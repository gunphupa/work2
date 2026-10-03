import { t, type Text, type Flow, type Session, type FixResult } from '@/types/diagnostic';
import { results, DiagnosticError } from './diagnostic';

export interface Recommendation {
  id: string;
  title: Text;
  why: Text;
  steps: Text[];
  lookFor: Text;
  kind?: 'handoff' | 'wait';
}
const advice = (
  id: string,
  title: Text,
  why: Text,
  steps: Text[],
  lookFor: Text,
): Recommendation => ({ id, title, why, steps, lookFor });
export function recommendations(flow: Flow, session: Session): Recommendation[] {
  if (
    session.flowId !== flow.id ||
    session.outcome === 'solved' ||
    session.outcome === 'in_progress' ||
    ['safety', 'worse', 'invalid'].includes(session.stopReason ?? '')
  )
    return [];
  const answered = (node: string, answer: string) =>
    session.history.some((e) => e.nodeId === node && e.answerId === answer);
  const checked = (...nodes: string[]) =>
    session.history.some(
      (e) => nodes.includes(e.nodeId) && e.answerId !== 'unsure' && e.answerId !== 'other',
    );
  const candidates: Recommendation[] = [];
  const add = (item: Recommendation, eligible = true) => {
    if (eligible) candidates.push(item);
  };

  if (answered('provider_status', 'outage'))
    return [
      {
        ...advice(
          'provider_wait',
          t('Follow the provider’s recovery update', 'ติดตามการกู้คืนบริการของผู้ให้บริการ'),
          t(
            'You reported a provider incident affecting your service. Reconfiguring Windows will not repair that incident.',
            'คุณรายงานเหตุขัดข้องของผู้ให้บริการที่กระทบบริการของคุณ การปรับ Windows ไม่สามารถซ่อมเหตุขัดข้องนั้นได้',
          ),
          [
            t(
              'Keep the router settings unchanged. Note the incident number and recovery estimate from the provider’s official notice. When the provider reports recovery, retry the same websites or game. Use an alternative connection only if authorized and you understand any data charges.',
              'คงค่าเราเตอร์ไว้ จดเลขเหตุการณ์และเวลาที่คาดว่าจะกลับมาจากประกาศทางการ เมื่อผู้ให้บริการแจ้งแก้แล้วให้ลองเว็บหรือเกมเดิม ใช้เครือข่ายอื่นเฉพาะเมื่อได้รับอนุญาตและเข้าใจค่าข้อมูล',
            ),
          ],
          t(
            'If the problem remains after recovery, report the incident number, affected devices, and router light observations to the provider.',
            'หากยังมีปัญหาหลังแก้เหตุการณ์ ให้แจ้งเลขเหตุการณ์ อุปกรณ์ที่มีปัญหา และผลสังเกตไฟเราเตอร์แก่ผู้ให้บริการ',
          ),
        ),
        kind: 'wait',
      },
    ];

  // A storage operation is a stop condition, not an invitation to reconnect hardware.
  if (flow.id === 'usb' && !answered('condition', 'safe')) {
    return [
      {
        ...advice(
          'usb_wait',
          t('Leave the storage device connected', 'ให้อุปกรณ์จัดเก็บเชื่อมต่อไว้'),
          t(
            'A safe reconnection has not been established.',
            'ยังไม่ยืนยันว่าถอดเชื่อมต่อใหม่ได้อย่างปลอดภัย',
          ),
          [
            t(
              'Let an active file transfer finish. Do not unplug, initialize, or format the drive. If it appears stuck and contains important data, ask a data-recovery professional before changing anything.',
              'รอให้การถ่ายโอนเสร็จ ห้ามถอดสาย Initialize หรือฟอร์แมต หากค้างและมีข้อมูลสำคัญ ให้ปรึกษาผู้กู้ข้อมูลก่อนเปลี่ยนแปลง',
            ),
          ],
          t(
            'Once the operation finishes, use Safely Remove Hardware before any reconnection. Stop if there is damage, liquid, or unusual heat.',
            'เมื่องานเสร็จ ใช้ Safely Remove Hardware ก่อนถอดเชื่อมต่อใหม่ หยุดหากมีความเสียหาย ของเหลว หรือความร้อนผิดปกติ',
          ),
        ),
        kind: 'wait',
      },
    ];
  }

  if (
    ['internet', 'wifi'].includes(flow.id) ||
    (flow.id === 'gaming' && answered('type', 'online'))
  ) {
    const gameOutage = flow.id === 'gaming' && answered('service_status', 'outage');
    if (gameOutage)
      add({
        ...advice(
          'game_outage',
          t('Wait for the game service to recover', 'รอให้บริการเกมกลับมา'),
          t(
            'You reported an official outage. Local network changes cannot repair the game service.',
            'คุณรายงานประกาศขัดข้องอย่างเป็นทางการ การเปลี่ยนเครือข่ายในเครื่องซ่อมบริการเกมไม่ได้',
          ),
          [
            t(
              'Follow the incident on the game publisher’s official status page. Use offline play if available, then retry the same online mode after the publisher marks the incident resolved.',
              'ติดตามเหตุการณ์ในหน้าสถานะของผู้พัฒนาเกม เล่นออฟไลน์หากมี แล้วลองโหมดออนไลน์เดิมเมื่อผู้พัฒนาระบุว่าแก้แล้ว',
            ),
          ],
          t(
            'If it still fails after recovery, record the server region, time, and exact error for game support. Do not reset your router for a confirmed game outage.',
            'หากยังมีปัญหาหลังบริการกลับมา ให้บันทึกภูมิภาคเซิร์ฟเวอร์ เวลา และข้อผิดพลาดให้ฝ่ายช่วยเหลือเกม ไม่ต้องรีเซ็ตเราเตอร์เพราะเกมขัดข้อง',
          ),
        ),
        kind: 'wait',
      });
    else {
      const shared =
        answered('compare', 'both') ||
        answered('other_device', 'both') ||
        answered('network', 'all');
      const onlyGame = flow.id === 'gaming' && answered('network', 'server');
      const adapterWarning = flow.id === 'wifi' && answered('adapter', 'warning');
      add(
        advice(
          'router_connections',
          t('Inspect the router’s external connections', 'ตรวจการเชื่อมต่อภายนอกของเราเตอร์'),
          shared
            ? t(
                'More than one device or service is affected, so the shared connection deserves a check.',
                'มีปัญหาหลายอุปกรณ์หรือบริการ จึงควรตรวจจุดเชื่อมต่อร่วม',
              )
            : t(
                'The external network connection has not yet been checked in this session.',
                'ยังไม่ได้ตรวจการเชื่อมต่อเครือข่ายภายนอกในการตรวจครั้งนี้',
              ),
          [
            t(
              'Look at the router/modem power and Internet/WAN lights. Compare them with the labels or its manual. Check visually whether the external Ethernet cable is seated at both ends.',
              'ดูไฟ Power และ Internet/WAN ของเราเตอร์หรือโมเด็ม เทียบกับฉลากหรือคู่มือ ดูด้วยตาว่าสาย Ethernet ภายนอกเสียบเข้าที่ทั้งสองด้านหรือไม่',
            ),
            t(
              'Do not press Reset, open equipment, unplug shared connections, or handle fiber connectors. If a light indicates loss of service, note its exact label and color for the network owner or provider.',
              'ห้ามกด Reset เปิดตัวอุปกรณ์ ถอดการเชื่อมต่อส่วนรวม หรือจับขั้วต่อไฟเบอร์ หากไฟบอกขาดบริการ ให้จดชื่อไฟและสีให้เจ้าของเครือข่ายหรือผู้ให้บริการ',
            ),
          ],
          t(
            'An abnormal Internet/WAN light points toward the router’s upstream connection; normal lights do not prove the connection is healthy.',
            'ไฟ Internet/WAN ผิดปกติเป็นเบาะแสของการเชื่อมต่อขาเข้า ส่วนไฟปกติยังไม่ได้ยืนยันว่าเครือข่ายไม่มีปัญหา',
          ),
        ),
        !onlyGame &&
          !adapterWarning &&
          !checked('router_check') &&
          !(flow.id === 'internet' && answered('compare', 'one')),
      );
      add(
        advice(
          'browser_compare',
          t('Compare the same task in another browser', 'เปรียบเทียบงานเดิมในเบราว์เซอร์อื่น'),
          t(
            'A browser-specific issue can resemble a slow connection. This comparison does not require resetting settings.',
            'ปัญหาเฉพาะเบราว์เซอร์อาจดูเหมือนเน็ตช้า การเปรียบเทียบนี้ไม่ต้องรีเซ็ตค่า',
          ),
          [
            t(
              'Keep FixFlow open. If another trusted browser is already installed, open the same familiar website there and compare loading the same page. Do not clear passwords or browsing data.',
              'เปิด FixFlow ไว้ หากมีเบราว์เซอร์ที่เชื่อถือได้อีกตัวติดตั้งอยู่ ให้เปิดเว็บที่รู้จักหน้าเดียวกันแล้วเปรียบเทียบ ไม่ต้องลบรหัสผ่านหรือข้อมูลการท่องเว็บ',
            ),
          ],
          t(
            'If only the original browser is slow, temporarily use the working browser and report the comparison to the original browser’s support. If both are slow, focus on the connection.',
            'หากช้าเฉพาะเบราว์เซอร์เดิม ใช้อีกตัวชั่วคราวและแจ้งผลเปรียบเทียบแก่ฝ่ายช่วยเหลือของเบราว์เซอร์เดิม หากช้าทั้งคู่ให้เน้นตรวจการเชื่อมต่อ',
          ),
        ),
        flow.id === 'internet' && !shared && !checked('browser_compare', 'browser_fix'),
      );
      add(
        advice(
          'provider_status',
          t(
            'Check for a provider incident in your area',
            'ตรวจเหตุขัดข้องของผู้ให้บริการในพื้นที่',
          ),
          t(
            'The remaining symptoms may involve the shared network or provider, rather than a setting in Windows.',
            'อาการที่เหลืออาจเกี่ยวกับเครือข่ายร่วมหรือผู้ให้บริการ มากกว่าค่าใน Windows',
          ),
          [
            t(
              'Use your provider’s official app or status page to check your service area. On a school or workplace network, ask its administrator. If an incident is listed, follow its recovery updates rather than changing router settings.',
              'ใช้แอปหรือหน้าสถานะทางการของผู้ให้บริการตรวจพื้นที่บริการ หากเป็นเครือข่ายโรงเรียนหรือที่ทำงาน ให้ถามผู้ดูแล หากมีเหตุขัดข้องให้ติดตามการแก้ไขแทนการเปลี่ยนค่าเราเตอร์',
            ),
          ],
          t(
            'No published incident is not proof that service is normal. Report affected devices, times, and the connection checks already completed.',
            'ไม่มีประกาศไม่ได้ยืนยันว่าบริการปกติ แจ้งอุปกรณ์ที่มีปัญหา ช่วงเวลา และผลตรวจการเชื่อมต่อที่ทำแล้ว',
          ),
        ),
        !onlyGame &&
          !adapterWarning &&
          !checked('provider_status') &&
          !(flow.id === 'internet' && answered('compare', 'one')),
      );
      add(
        advice(
          'game_details',
          t(
            'Compare game modes and record the server region',
            'เปรียบเทียบโหมดเกมและบันทึกภูมิภาคเซิร์ฟเวอร์',
          ),
          t(
            'Online delay can be limited to a game mode or server even when other services work.',
            'ความหน่วงออนไลน์อาจเกิดเฉพาะโหมดหรือเซิร์ฟเวอร์ แม้บริการอื่นใช้งานได้',
          ),
          [
            t(
              'Use the game’s own ping indicator if available. Compare a normal online match with its offline/practice mode, without installing tools. Record the game name, region, ping, time, and whether other players report the same issue.',
              'ใช้ตัวแสดง ping ในเกมหากมี เปรียบเทียบออนไลน์ปกติกับโหมดออฟไลน์หรือฝึกซ้อม ไม่ต้องติดตั้งเครื่องมือ จดชื่อเกม ภูมิภาค ping เวลา และมีผู้เล่นอื่นพบอาการเดียวกันหรือไม่',
            ),
          ],
          t(
            'Smooth offline play with delayed online actions is useful evidence for game/network support; choppy offline play also needs performance checks.',
            'ออฟไลน์ลื่นแต่ออนไลน์หน่วงเป็นข้อมูลให้ฝ่ายช่วยเหลือเกมหรือเครือข่าย ส่วนออฟไลน์กระตุกควรตรวจประสิทธิภาพด้วย',
          ),
        ),
        flow.id === 'gaming',
      );
      add(
        advice(
          'local_reconnect',
          t(
            'Reconnect only this computer’s Wi-Fi once',
            'เชื่อมต่อ Wi-Fi ของคอมพิวเตอร์นี้ใหม่หนึ่งครั้ง',
          ),
          t(
            'The other device works, so a reversible connection check on this computer is more relevant than resetting the shared router.',
            'อีกอุปกรณ์ใช้ได้ การตรวจการเชื่อมต่อเครื่องนี้แบบคืนได้จึงเหมาะกว่าการรีเซ็ตเราเตอร์ส่วนรวม',
          ),
          [
            t(
              'Only if using Wi-Fi: finish calls and pause transfers first. Keep this tab open. From the Windows network list, disconnect and reconnect to the same trusted network, then repeat the original task. Skip if this is a managed connection you cannot reconnect yourself. Do not use Network reset or forget the network.',
              'ทำเฉพาะเมื่อใช้ Wi-Fi: จบสายและพักการถ่ายโอนก่อน เปิดแท็บนี้ไว้ จากรายการเครือข่าย Windows ตัดแล้วเชื่อมเครือข่ายเดิมที่เชื่อถือได้ใหม่ จากนั้นลองงานเดิม ข้ามหากเป็นเครือข่ายที่จัดการโดยองค์กรและเชื่อมใหม่เองไม่ได้ ห้ามใช้ Network reset หรือลืมเครือข่าย',
            ),
          ],
          t(
            'If it helps, confirm the original task works. If not, preserve the result and continue with adapter details rather than reconnecting repeatedly.',
            'หากช่วยให้ยืนยันว่างานเดิมใช้ได้ หากไม่ช่วยให้เก็บผลแล้วตรวจรายละเอียดอะแดปเตอร์ต่อแทนการเชื่อมใหม่ซ้ำ',
          ),
        ),
        (answered('compare', 'one') || answered('other_device', 'only')) &&
          !checked('reconnect_fix'),
      );
      add(
        advice(
          'adapter_status',
          t('Inspect the active network adapter’s status', 'ตรวจสถานะอะแดปเตอร์เครือข่ายที่ใช้งาน'),
          t(
            'This collects a more specific clue after the basic connection checks, without resetting the adapter.',
            'ช่วยหาเบาะแสที่เจาะจงหลังตรวจการเชื่อมต่อพื้นฐาน โดยไม่รีเซ็ตอะแดปเตอร์',
          ),
          [
            t(
              'Right-click Start → Device Manager → Network adapters. Open the active Wi-Fi or Ethernet adapter’s Properties and read General → Device status. Record its exact message and Driver version/date. Do not disable or uninstall it.',
              'คลิกขวา Start → Device Manager → Network adapters เปิด Properties ของ Wi-Fi หรือ Ethernet ที่ใช้งาน อ่าน General → Device status จดข้อความและเวอร์ชันหรือวันที่ Driver ห้ามปิดหรือถอนอะแดปเตอร์',
            ),
            t(
              'If the adapter is missing entirely, record the computer model and that observation instead; ask the computer manufacturer for its documented adapter detection procedure.',
              'หากไม่มีอะแดปเตอร์ในรายการเลย ให้จดรุ่นคอมพิวเตอร์และสิ่งที่พบแทน แล้วขอวิธีตรวจพบอะแดปเตอร์ตามเอกสารของผู้ผลิตเครื่อง',
            ),
          ],
          t(
            'A warning code helps the computer manufacturer identify the right next action. A normal status does not rule out network trouble; include your browser, device, and router comparison results.',
            'รหัสเตือนช่วยให้ผู้ผลิตเครื่องระบุขั้นตอนต่อไปที่เหมาะสม สถานะปกติไม่ได้ตัดปัญหาเครือข่าย ให้แนบผลเทียบเบราว์เซอร์ อุปกรณ์ และเราเตอร์ด้วย',
          ),
        ),
        !onlyGame && (!checked('adapter') || adapterWarning),
      );
    }
  }
  if (
    ['slow', 'freeze', 'cpu', 'memory', 'disk', 'heat'].includes(flow.id) ||
    (flow.id === 'gaming' && !answered('type', 'online'))
  ) {
    add(
      advice(
        'performance_timeline',
        t(
          'Compare the slowdown with Windows’ reliability history',
          'เทียบช่วงที่ช้ากับประวัติความเสถียรของ Windows',
        ),
        t(
          'The basic checks did not isolate a confirmed fix. A matching app failure or update can narrow the next investigation.',
          'การตรวจพื้นฐานยังไม่พบวิธีแก้ที่ยืนยันได้ ประวัติแอปล้มเหลวหรืออัปเดตตรงเวลาอาจช่วยจำกัดการตรวจต่อ',
        ),
        [
          t(
            'Search Start for “View reliability history”. Select the day and time the issue occurred. Read any matching application failure or Windows failure details; do not uninstall updates or change settings from this information alone.',
            'ค้นหา “View reliability history” ใน Start เลือกวันที่และช่วงที่เกิดปัญหา อ่านรายละเอียดแอปหรือ Windows ที่ล้มเหลว ไม่ต้องถอนอัปเดตหรือเปลี่ยนค่าจากข้อมูลนี้เพียงอย่างเดียว',
          ),
        ],
        t(
          'Record the application name and error code if they match the symptom time. If there is no matching event, tell support that too; absence of an event does not rule out a problem.',
          'จดชื่อแอปและรหัสผิดพลาดหากตรงกับเวลาเกิดอาการ หากไม่มีเหตุการณ์ตรงกันให้แจ้งด้วย การไม่มีบันทึกไม่ได้ตัดปัญหาออก',
        ),
      ),
      flow.id !== 'heat',
    );
    add(
      advice(
        'power_source',
        t('Check the laptop’s power source', 'ตรวจแหล่งจ่ายไฟของโน้ตบุ๊ก'),
        t(
          'Battery operation or an unsuitable charger can limit performance on some laptops.',
          'การใช้แบตเตอรี่หรือที่ชาร์จไม่เหมาะสมอาจจำกัดประสิทธิภาพโน้ตบุ๊กบางรุ่น',
        ),
        [
          t(
            'For a laptop, check whether Windows shows charging while using the manufacturer-approved, undamaged charger. Compare ordinary light use on that power source; skip this check for a desktop. Do not change voltage, overclock, or run a stress test.',
            'หากเป็นโน้ตบุ๊ก ดูว่า Windows แสดงกำลังชาร์จเมื่อใช้ที่ชาร์จที่ผู้ผลิตรับรองและไม่เสียหายหรือไม่ เปรียบเทียบงานเบาทั่วไปเมื่อเสียบไฟ ข้ามหากเป็นเดสก์ท็อป ห้ามปรับแรงดัน โอเวอร์คล็อก หรือทดสอบหนัก',
          ),
        ],
        t(
          'If it is not charging or the charger is unusually hot or damaged, stop using that charger and contact the manufacturer. Otherwise record whether performance changes.',
          'หากไม่ชาร์จหรือที่ชาร์จร้อนผิดปกติหรือเสียหาย ให้หยุดใช้และติดต่อผู้ผลิต มิฉะนั้นให้บันทึกว่าประสิทธิภาพเปลี่ยนหรือไม่',
        ),
      ),
      flow.id !== 'heat',
    );
    add(
      advice(
        'heat_service',
        t(
          'Prepare a cooling inspection without opening the computer',
          'เตรียมข้อมูลตรวจระบบระบายความร้อนโดยไม่เปิดเครื่อง',
        ),
        t(
          'If unusual heat persists, an equipment-specific cooling inspection is a useful next step.',
          'หากความร้อนผิดปกติยังอยู่ การตรวจระบบระบายความร้อนเฉพาะรุ่นเป็นขั้นต่อไปที่มีประโยชน์',
        ),
        [
          t(
            'Stop demanding tasks. Note the computer model, whether fans run during ordinary light use, and any shutdown times. Do not touch hot parts, open the case, or install a stress test. Give those observations to the manufacturer or a qualified technician.',
            'หยุดงานหนัก จดรุ่นเครื่อง พัดลมทำงานขณะใช้งานเบาหรือไม่ และเวลาเครื่องดับ ห้ามแตะส่วนร้อน เปิดตัวเครื่อง หรือติดตั้งการทดสอบหนัก ส่งข้อมูลให้ผู้ผลิตหรือช่างที่มีคุณสมบัติเหมาะสม',
          ),
        ],
        t(
          'Ask them to inspect cooling and power with the recorded symptoms, instead of requesting an unverified part replacement.',
          'ขอให้ตรวจระบบระบายความร้อนและไฟตามอาการที่บันทึก แทนการขอเปลี่ยนอะไหล่โดยยังไม่ตรวจ',
        ),
      ),
      flow.id === 'heat',
    );
  }
  if (['microphone', 'sound'].includes(flow.id)) {
    const missing = answered('detect', 'no') || answered('output', 'missing');
    add(
      advice(
        'audio_app_compare',
        t(
          'Compare a built-in audio test with the affected app',
          'เทียบการทดสอบเสียงใน Windows กับแอปที่มีปัญหา',
        ),
        t(
          'This can separate Windows/device audio from a problem inside one app.',
          'ช่วยแยกเสียงของ Windows หรืออุปกรณ์ออกจากปัญหาในแอปเดียว',
        ),
        [
          flow.id === 'microphone'
            ? t(
                'In Settings → System → Sound → Input, use the microphone test or input meter while speaking. Compare it with the affected app’s own microphone test. You do not need to upload or keep a recording.',
                'ใน Settings → System → Sound → Input ใช้การทดสอบไมโครโฟนหรือดูมิเตอร์ขณะพูด แล้วเทียบกับการทดสอบในแอป ไม่ต้องอัปโหลดหรือเก็บเสียงบันทึก',
              )
            : t(
                'At a comfortable volume, use the selected output device’s Test option in Settings → System → Sound. Compare that with playback in the affected app.',
                'ใช้ระดับเสียงที่สบายหู ทดสอบอุปกรณ์เสียงที่เลือกจาก Settings → System → Sound แล้วเทียบกับเสียงในแอปที่มีปัญหา',
              ),
        ],
        t(
          'If the Windows test works but the app does not, focus on the app’s selected device and permissions. If both fail, record that for device support.',
          'หาก Windows ทดสอบได้แต่แอปไม่ได้ ให้เน้นอุปกรณ์ที่แอปเลือกและสิทธิ์ หากไม่ได้ทั้งคู่ให้บันทึกให้ฝ่ายช่วยเหลืออุปกรณ์',
        ),
      ),
      !missing && !checked('app_test', 'app_fix', 'test'),
    );
    add(
      advice(
        'audio_enhancements',
        t('Check whether audio enhancements are enabled', 'ตรวจว่าเปิดการปรับปรุงเสียงอยู่หรือไม่'),
        t(
          'Some audio effects can interfere with particular devices or apps; this is a reversible comparison, not a confirmed cause.',
          'เอฟเฟกต์เสียงบางอย่างอาจรบกวนอุปกรณ์หรือแอป เป็นการเปรียบเทียบที่ย้อนกลับได้ ไม่ใช่สาเหตุที่ยืนยันแล้ว',
        ),
        [
          t(
            'Open Settings → System → Sound and the affected input/output device properties. If Audio enhancements or an Enhancements tab is available, note the current setting, turn enhancements off temporarily, and test at a comfortable volume. If unavailable or managed by your organization, skip it.',
            'เปิด Settings → System → Sound และคุณสมบัติอุปกรณ์รับหรือส่งเสียงที่มีปัญหา หากมี Audio enhancements หรือแท็บ Enhancements ให้จดค่าเดิม ปิดชั่วคราวแล้วทดสอบด้วยเสียงระดับสบาย หากไม่มีหรือองค์กรจัดการอยู่ให้ข้าม',
          ),
        ],
        t(
          'If this does not help, restore the previous setting. If it helps, keep the change only if normal audio still works and report which effect setting mattered.',
          'หากไม่ช่วยให้คืนค่าเดิม หากช่วย ให้คงค่าไว้เฉพาะเมื่อเสียงปกติยังใช้ได้ และบันทึกว่าค่าใดมีผล',
        ),
      ),
      !missing,
    );
  }
  if (['usb', 'driver', 'microphone', 'sound'].includes(flow.id)) {
    add(
      advice(
        'device_details',
        t(
          'Match the exact device and error to its manufacturer’s guidance',
          'เทียบรุ่นอุปกรณ์และรหัสผิดพลาดกับคำแนะนำผู้ผลิต',
        ),
        t(
          'A specific device model and status code are more useful than guessing a driver.',
          'รุ่นและรหัสสถานะที่เจาะจงมีประโยชน์กว่าคาดเดาไดรเวอร์',
        ),
        [
          t(
            'In Device Manager, open the affected device’s Properties. Record the exact General → Device status message and Driver version/date. Compare the model and Windows version with the manufacturer’s support information. Do not uninstall the device or install a generic driver updater.',
            'ใน Device Manager เปิด Properties ของอุปกรณ์ จดข้อความ General → Device status และเวอร์ชันหรือวันที่ Driver เทียบรุ่นกับ Windows ในข้อมูลช่วยเหลือของผู้ผลิต ห้ามถอนอุปกรณ์หรือติดตั้งโปรแกรมอัปเดตไดรเวอร์ทั่วไป',
          ),
        ],
        t(
          'Ask device support which documented action applies to that exact code and version, including the connection tests already completed. Do not share serial numbers publicly.',
          'ถามฝ่ายช่วยเหลือว่าวิธีใดตามเอกสารตรงกับรหัสและเวอร์ชันนี้ พร้อมผลตรวจการเชื่อมต่อที่ทำแล้ว ไม่ต้องเผยแพร่หมายเลขซีเรียลสู่สาธารณะ',
        ),
      ),
    );
  }
  if (flow.id === 'monitor') {
    add(
      advice(
        'display_mode',
        t(
          'Check Windows’ display mode if another screen works',
          'ตรวจโหมดแสดงผล Windows หากอีกจอใช้งานได้',
        ),
        t(
          'Windows may be sending the desktop to a different display.',
          'Windows อาจส่งภาพเดสก์ท็อปไปยังอีกจอ',
        ),
        [
          t(
            'Only if you can see Windows on another screen, press Windows + P, note the current mode, and try Duplicate or Extend. Keep any working screen connected. If you cannot see the menu, skip this check rather than making blind changes.',
            'ทำเฉพาะเมื่อเห็น Windows บนอีกจอ กด Windows + P จดโหมดเดิม แล้วลอง Duplicate หรือ Extend ให้จอที่ใช้ได้เชื่อมต่ออยู่ หากมองไม่เห็นเมนูให้ข้าม ไม่ต้องปรับโดยมองไม่เห็น',
          ),
        ],
        t(
          'If it does not help, return to the previous mode. A picture that appears identifies a useful display-mode workaround, not a confirmed hardware repair.',
          'หากไม่ช่วยให้คืนโหมดเดิม หากมีภาพแสดงว่าโหมดแสดงผลช่วยได้ แต่ยังไม่ยืนยันว่าซ่อมฮาร์ดแวร์แล้ว',
        ),
      ),
    );
    add(
      advice(
        'monitor_self_test',
        t('Use the display’s documented self-test', 'ใช้การทดสอบตัวเองของจอตามคู่มือ'),
        t(
          'A manufacturer self-test can distinguish the display itself from the computer’s video output.',
          'การทดสอบตามคู่มือช่วยแยกตัวจอจากสัญญาณภาพของคอมพิวเตอร์',
        ),
        [
          t(
            'Find the exact model on the display label and read its manufacturer’s self-test instructions. Use only the documented external controls. For a built-in laptop screen, use the laptop manufacturer’s procedure; do not open the case or try undocumented key sequences.',
            'ดูรุ่นที่ฉลากจอแล้วอ่านวิธีทดสอบจากผู้ผลิต ใช้เฉพาะปุ่มภายนอกตามเอกสาร หากเป็นจอโน้ตบุ๊กให้ใช้วิธีของผู้ผลิตโน้ตบุ๊ก ห้ามเปิดเครื่องหรือลองลำดับปุ่มที่ไม่มีเอกสาร',
          ),
        ],
        t(
          'Record whether the self-test picture appears and any pattern or error. Give that result with your cable/input checks to display support.',
          'จดว่าภาพทดสอบปรากฏหรือไม่ รวมทั้งรูปแบบไฟหรือรหัส แล้วส่งพร้อมผลตรวจสายและ Input ให้ฝ่ายช่วยเหลือจอ',
        ),
      ),
    );
  }
  if (flow.id === 'boot') {
    add(
      advice(
        'boot_message',
        t(
          'Record the exact startup screen before changing anything',
          'บันทึกหน้าจอเริ่มต้นก่อนเปลี่ยนแปลง',
        ),
        t(
          'The startup stage determines whether power, Windows recovery, or storage needs investigation.',
          'จุดที่เริ่มเครื่องติดขัดช่วยแยกไฟเลี้ยง การกู้คืน Windows หรืออุปกรณ์จัดเก็บ',
        ),
        [
          t(
            'Record the visible error text, logo, and any beep or light pattern, plus the computer model. If BitLocker appears, use Microsoft’s official recovery-key instructions from your own account or organization; never post the key here. Avoid resets, reinstalls, or disk repair commands before protecting your files.',
            'จดข้อความผิดพลาด โลโก้ เสียงบี๊บหรือรูปแบบไฟ และรุ่นเครื่อง หากพบ BitLocker ให้ใช้คำแนะนำกู้คีย์ทางการของ Microsoft ผ่านบัญชีของคุณหรือองค์กร ห้ามโพสต์คีย์ที่นี่ หลีกเลี่ยงรีเซ็ต ติดตั้งใหม่ หรือคำสั่งซ่อมดิสก์ก่อนปกป้องไฟล์',
          ),
        ],
        t(
          'Give support the exact startup stage and ask for a data-preserving recovery procedure. If storage reports failure, stop repeated boot attempts and ask about data recovery first.',
          'แจ้งฝ่ายช่วยเหลือว่าติดที่จุดใดและขอวิธีกู้คืนที่รักษาข้อมูล หากรายงานดิสก์เสียให้หยุดลองบูตซ้ำและถามเรื่องกู้ข้อมูลก่อน',
        ),
      ),
    );
  }

  const attempted = new Set((session.recommendations ?? []).map((a) => a.id));
  const available = candidates.filter((c) => !attempted.has(c.id));
  if (available.length) return available;
  // A specific handoff remains after all applicable checks have been attempted.
  return [
    {
      ...advice(
        'handoff',
        t('Use these results for the next investigation', 'ใช้ผลเหล่านี้ตรวจต่ออย่างเจาะจง'),
        t(
          'There is no further built-in check that fits without repeating your results or guessing.',
          'ไม่มีการตรวจในระบบที่ตรงเพิ่มเติมโดยไม่ซ้ำผลเดิมหรือคาดเดา',
        ),
        [
          t(
            `For “${flow.title.en}”, download the summary below. Include the affected app/device model, the exact error, when it happens, and the results of the checks listed here. Ask the relevant app, device, or network support team to investigate what remains after these checks.`,
            `สำหรับ “${flow.title.th}” ดาวน์โหลดสรุปด้านล่าง เพิ่มชื่อแอปหรือรุ่นอุปกรณ์ ข้อผิดพลาด เวลาเกิดอาการ และผลตรวจที่แสดง ขอให้ฝ่ายช่วยเหลือของแอป อุปกรณ์ หรือเครือข่ายตรวจสิ่งที่ยังเหลือจากผลเหล่านี้`,
          ),
        ],
        t(
          'This preserves the useful evidence and avoids starting again with the same unsuccessful steps.',
          'ช่วยรักษาข้อมูลที่มีประโยชน์และไม่เริ่มซ้ำด้วยขั้นตอนเดิมที่ไม่ได้ผล',
        ),
      ),
      kind: 'handoff',
    },
  ];
}

export function recordRecommendation(
  flow: Flow,
  session: Session,
  id: string,
  result: FixResult,
): Session {
  const item = recommendations(flow, session).find((c) => c.id === id && !c.kind);
  if (!item || !(result in results) || (session.recommendations?.length ?? 0) >= 25)
    throw new DiagnosticError('Invalid follow-up result');
  const timestamp = Date.now();
  return {
    ...session,
    recommendations: [...(session.recommendations ?? []), { id, result, timestamp }],
    history: [
      ...session.history,
      { nodeId: `recommendation:${id}`, title: item.title, answer: results[result], timestamp },
    ],
    outcome:
      result === 'fixed'
        ? 'solved'
        : result === 'worse'
          ? 'solution_not_found'
          : result === 'improved'
            ? 'partially_solved'
            : session.outcome,
    stopReason: result === 'fixed' ? undefined : result === 'worse' ? 'worse' : session.stopReason,
    endedAt: timestamp,
  };
}
