import { t } from '@/types/diagnostic';
import { flow, q, o, fix, retry } from './builders';
export const usb = flow(
  'usb',
  'condition',
  [
    ['port', t('USB port, cable, or hub', 'พอร์ต USB สาย หรือฮับ')],
    ['device', t('Peripheral hardware', 'ฮาร์ดแวร์อุปกรณ์ต่อพ่วง')],
    ['driver', t('Windows device driver', 'ไดรเวอร์อุปกรณ์ Windows')],
  ],
  [
    q(
      'condition',
      t('Is the device safe to reconnect?', 'อุปกรณ์ปลอดภัยที่จะเชื่อมต่อใหม่หรือไม่'),
      t(
        'Visible damage or an active storage transfer changes what is safe to try.',
        'ความเสียหายที่มองเห็นหรือการถ่ายโอนข้อมูลมีผลต่อความปลอดภัย',
      ),
      [
        t(
          'Check for damaged connectors, liquid, unusual heat, or an active file transfer. Do not unplug a storage device while files are being written.',
          'ตรวจขั้วต่อเสียหาย ของเหลว ความร้อนผิดปกติ หรือการถ่ายโอนไฟล์ ห้ามถอดอุปกรณ์จัดเก็บขณะกำลังเขียนข้อมูล',
        ),
      ],
      [
        o('safe', 'No damage; no transfer is running', 'ไม่เสียหายและไม่มีการถ่ายโอน', 'port'),
        o('damage', 'Damaged, very hot, or wet', 'เสียหาย ร้อนมาก หรือเปียก', 'safety_stop', {
          device: 'likely',
        }),
        o('busy', 'A storage operation is running', 'กำลังทำงานกับอุปกรณ์จัดเก็บ', 'unresolved'),
      ],
    ),
    q(
      'port',
      t('Does a direct connection to another port work?', 'เสียบตรงกับพอร์ตอื่นแล้วใช้ได้หรือไม่'),
      t(
        'This removes a hub or a single port from the connection path.',
        'ช่วยตัดฮับหรือพอร์ตเดียวออกจากเส้นทางการเชื่อมต่อ',
      ),
      [
        t(
          'For storage, safely eject first. Connect directly to another computer USB port without a hub. Wait and look in Device Manager; storage may also appear in File Explorer. Never initialize or format a disk to make it appear.',
          'หากเป็นอุปกรณ์จัดเก็บให้ Eject ก่อน เสียบตรงกับพอร์ต USB อื่นโดยไม่ผ่านฮับ รอแล้วดู Device Manager หรือ File Explorer ห้าม Initialize หรือฟอร์แมตดิสก์เพื่อให้ตรวจพบ',
        ),
      ],
      [
        o('works', 'It is detected in the other port', 'พอร์ตอื่นตรวจพบ', 'port_fix', {
          port: 'likely',
        }),
        o('fails', 'It is still not detected', 'ยังไม่พบ', 'cable'),
      ],
      'cable',
    ),
    fix(
      'port_fix',
      t('Keep the working USB connection', 'ใช้การเชื่อมต่อ USB ที่ทำงานได้'),
      'port',
      t(
        'The device works when the original port or hub is bypassed.',
        'อุปกรณ์ใช้ได้เมื่อไม่ผ่านพอร์ตหรือฮับเดิม',
      ),
      [
        t(
          'Use the working port. If a hub is required, check its power supply and compatibility in the manufacturer’s manual.',
          'ใช้พอร์ตที่ทำงานได้ หากจำเป็นต้องใช้ฮับ ให้ตรวจไฟเลี้ยงและความเข้ากันได้จากคู่มือผู้ผลิต',
        ),
      ],
      retry,
      'cable',
    ),
    q(
      'cable',
      t('Does another compatible data cable help?', 'สายข้อมูลที่รองรับเส้นอื่นช่วยหรือไม่'),
      t(
        'Some USB cables supply power only. A device lighting up does not prove data is connected.',
        'สาย USB บางเส้นส่งไฟอย่างเดียว อุปกรณ์มีไฟไม่ได้พิสูจน์ว่าข้อมูลเชื่อมต่อ',
      ),
      [
        t(
          'If the cable is detachable and you have a known working compatible data cable, try it. Do not force connectors or use damaged cables. Skip for devices with a fixed cable.',
          'หากถอดสายได้และมีสายข้อมูลที่รองรับซึ่งใช้ได้แน่นอน ให้ลองเปลี่ยน ห้ามฝืนขั้วต่อหรือใช้สายเสียหาย ข้ามได้หากถอดสายไม่ได้',
        ),
      ],
      [
        o('works', 'It works with the other cable', 'ใช้ได้กับสายอื่น', 'cable_fix', {
          port: 'likely',
        }),
        o('fails', 'No improvement / fixed cable', 'ไม่ดีขึ้น / สายถอดไม่ได้', 'manager'),
      ],
      'manager',
    ),
    fix(
      'cable_fix',
      t('Use a compatible data cable', 'ใช้สายข้อมูลที่รองรับ'),
      'port',
      t('The alternate cable restored detection.', 'สายอื่นทำให้ตรวจพบอุปกรณ์'),
      [
        t(
          'Use the working cable that meets the device’s requirements. Test the device’s normal function before relying on it.',
          'ใช้สายที่ทำงานได้และตรงตามข้อกำหนด ทดสอบการทำงานปกติก่อนใช้งานจริง',
        ),
      ],
      retry,
      'manager',
    ),
    q(
      'manager',
      t('What does Device Manager show?', 'Device Manager แสดงอะไร'),
      t(
        'A warning gives a useful clue, but does not prove which driver is needed.',
        'ไอคอนเตือนให้เบาะแส แต่ไม่ได้พิสูจน์ว่าต้องใช้ไดรเวอร์ใด',
      ),
      [
        t(
          'Right-click Start → Device Manager. Look under the relevant device category and Universal Serial Bus controllers. Read Properties → General if there is a warning. Do not uninstall anything.',
          'คลิกขวา Start → Device Manager ดูหมวดอุปกรณ์และ Universal Serial Bus controllers หากมีเตือนให้อ่าน Properties → General ไม่ต้องถอนการติดตั้ง',
        ),
      ],
      [
        o(
          'warning',
          'A warning or unknown device is shown',
          'มีคำเตือนหรืออุปกรณ์ที่ไม่รู้จัก',
          'unresolved',
          { driver: 'possible' },
        ),
        o(
          'missing',
          'Nothing changes when it is connected',
          'ไม่มีอะไรเปลี่ยนเมื่อเชื่อมต่อ',
          'cross',
        ),
      ],
      'cross',
    ),
    q(
      'cross',
      t('Does it work on another compatible computer?', 'ใช้กับคอมพิวเตอร์อื่นที่รองรับได้หรือไม่'),
      t(
        'This separates a PC-specific issue from the peripheral itself.',
        'ช่วยแยกปัญหาเฉพาะคอมพิวเตอร์ออกจากอุปกรณ์',
      ),
      [
        t(
          'If available, test on another compatible computer. If valuable storage is failing, stop testing and contact a data-recovery professional instead of formatting it.',
          'หากมี ให้ทดสอบกับเครื่องอื่นที่รองรับ หากเป็นอุปกรณ์จัดเก็บข้อมูลสำคัญที่กำลังเสีย ให้หยุดและปรึกษาผู้กู้ข้อมูลแทนการฟอร์แมต',
        ),
      ],
      [
        o('works', 'It works elsewhere', 'ใช้กับเครื่องอื่นได้', 'unresolved', {
          device: 'unlikely',
          driver: 'possible',
        }),
        o('fails', 'It fails there too', 'เครื่องอื่นก็ใช้ไม่ได้', 'unresolved', {
          device: 'likely',
        }),
      ],
    ),
  ],
);
export const monitor = flow(
  'monitor',
  'power',
  [
    ['power', t('Display power', 'ไฟเลี้ยงจอภาพ')],
    ['input', t('Wrong display input', 'ช่องรับสัญญาณภาพผิด')],
    ['cable', t('Video cable or connection', 'สายหรือการเชื่อมต่อภาพ')],
    ['display_path', t('Original display or video connection', 'จอหรือการเชื่อมต่อภาพเดิม')],
    ['pc', t('Computer startup or graphics output', 'การเริ่มเครื่องหรือสัญญาณภาพจากคอมพิวเตอร์')],
  ],
  [
    q(
      'power',
      t('Can the monitor show its own menu?', 'จอแสดงเมนูของตัวเองได้หรือไม่'),
      t(
        'The monitor’s built-in menu checks display power independently of Windows.',
        'เมนูในจอช่วยตรวจไฟเลี้ยงแยกจาก Windows',
      ),
      [
        t(
          'Press the monitor’s menu button using its manual. Check its power light. For a laptop’s built-in black screen, choose the laptop option.',
          'กดปุ่มเมนูของจอตามคู่มือ ตรวจไฟแสดงสถานะ หากเป็นจอในโน้ตบุ๊กที่ดำ ให้เลือกตัวเลือกโน้ตบุ๊ก',
        ),
      ],
      [
        o('yes', 'Yes, its menu appears', 'เมนูแสดงได้', 'input', { power: 'ruled_out' }),
        o('no', 'No menu or power light', 'ไม่มีเมนูหรือไฟ', 'power_fix', { power: 'likely' }),
        o('laptop', 'It is a laptop’s built-in screen', 'เป็นจอในโน้ตบุ๊ก', 'unresolved', {
          pc: 'possible',
        }),
      ],
    ),
    fix(
      'power_fix',
      t('Check the monitor’s power connection', 'ตรวจไฟเลี้ยงจอ'),
      'power',
      t('The monitor did not show its own menu or power light.', 'จอไม่แสดงเมนูหรือไฟของตัวเอง'),
      [
        t(
          'Check that the monitor is switched on and its undamaged power cable is seated. Use only the correct power supply. If there is damage, smell, or heat, stop and seek service.',
          'ตรวจว่าเปิดจอและสายไฟที่ไม่เสียหายเสียบแน่น ใช้แหล่งจ่ายไฟที่ถูกต้องเท่านั้น หากเสียหาย มีกลิ่น หรือร้อนผิดปกติ ให้หยุดและส่งซ่อม',
        ),
      ],
      retry,
      'input',
    ),
    q(
      'input',
      t('Does the selected input match the cable?', 'เลือก Input ตรงกับสายหรือไม่'),
      t(
        'A monitor can be powered on while listening to an unused input.',
        'จอมีไฟแต่เลือกช่องที่ไม่ได้ใช้อยู่ได้',
      ),
      [
        t(
          'Trace the video cable without unplugging it. In the monitor menu, check whether HDMI 1, HDMI 2, or DisplayPort matches that socket.',
          'ดูสายภาพโดยไม่ต้องถอด ในเมนูจอตรวจว่า HDMI 1, HDMI 2 หรือ DisplayPort ตรงกับช่องที่เสียบหรือไม่',
        ),
      ],
      [
        o('wrong', 'The input does not match', 'Input ไม่ตรง', 'input_fix', { input: 'likely' }),
        o('right', 'It matches the connected cable', 'ตรงกับสายที่เสียบ', 'cable', {
          input: 'ruled_out',
        }),
      ],
      'cable',
    ),
    fix(
      'input_fix',
      t('Select the connected video input', 'เลือกช่องรับภาพที่เชื่อมต่อ'),
      'input',
      t('The monitor was set to a different connector.', 'จอเลือกขั้วต่ออื่นอยู่'),
      [
        t(
          'Use the monitor’s input/source control to select the connected socket. Give the display a few seconds to detect it.',
          'ใช้ปุ่ม Input หรือ Source ของจอเลือกช่องที่เสียบ รอสักครู่ให้จอตรวจพบ',
        ),
      ],
      retry,
      'cable',
    ),
    q(
      'cable',
      t('Does reseating the video cable restore the picture?', 'เสียบสายภาพใหม่แล้วมีภาพหรือไม่'),
      t(
        'A loose external video connector can cause a no-signal message.',
        'ขั้วต่อภาพภายนอกหลวมอาจทำให้ไม่มีสัญญาณ',
      ),
      [
        t(
          'If you can save work, do so. Turn the monitor off, then gently reconnect the external video cable at both ends. Do not open the computer or force a connector. Turn the monitor back on.',
          'บันทึกงานหากทำได้ ปิดจอแล้วเสียบสายภาพภายนอกใหม่ทั้งสองด้านอย่างเบามือ ห้ามเปิดเครื่องหรือฝืนขั้วต่อ แล้วเปิดจอ',
        ),
      ],
      [
        o('yes', 'The picture returned', 'ภาพกลับมาแล้ว', 'cable_fix', { cable: 'likely' }),
        o('no', 'Still no signal', 'ยังไม่มีสัญญาณ', 'cross'),
      ],
      'cross',
    ),
    fix(
      'cable_fix',
      t('Verify the secure display connection', 'ตรวจการเชื่อมต่อจอที่แน่นแล้ว'),
      'cable',
      t('Reconnecting the cable restored the display.', 'เสียบสายใหม่แล้วภาพกลับมา'),
      [
        t(
          'Leave the connector securely seated without tension on the cable. Check that the picture stays stable during normal use.',
          'เสียบขั้วต่อให้แน่นโดยไม่ดึงตึง ตรวจว่าภาพคงที่ระหว่างใช้งานปกติ',
        ),
      ],
      retry,
      'cross',
    ),
    q(
      'cross',
      t('Does a known working display or cable help?', 'จอหรือสายที่ใช้ได้แน่นอนช่วยหรือไม่'),
      t(
        'Swapping one external part at a time narrows the signal problem.',
        'สลับอุปกรณ์ภายนอกทีละชิ้นช่วยจำกัดปัญหาสัญญาณ',
      ),
      [
        t(
          'If available, try a compatible working video cable, then a working display. Change one thing at a time. If the computer shows no startup signs, seek manufacturer support.',
          'หากมี ให้ลองสายภาพที่รองรับและใช้ได้ แล้วลองจอที่ใช้ได้ เปลี่ยนทีละอย่าง หากเครื่องไม่มีสัญญาณเริ่มทำงานให้ขอความช่วยเหลือจากผู้ผลิต',
        ),
      ],
      [
        o(
          'works',
          'A replacement cable or display works',
          'เปลี่ยนสายหรือจอแล้วใช้ได้',
          'replacement_fix',
          { display_path: 'likely', pc: 'unlikely' },
        ),
        o('fails', 'Neither restores a picture', 'ไม่มีอย่างใดช่วย', 'unresolved', {
          pc: 'possible',
        }),
      ],
    ),
    fix(
      'replacement_fix',
      t('Verify the working display setup', 'ตรวจชุดจอและสายที่ใช้ได้'),
      'display_path',
      t(
        'Changing an external cable or display restored the picture. This points to the original display path, but does not prove which part failed.',
        'การเปลี่ยนสายหรือจอภายนอกทำให้ภาพกลับมา จึงชี้ไปที่ชุดการเชื่อมต่อภาพเดิม แต่ยังพิสูจน์ไม่ได้ว่าชิ้นใดเสีย',
      ),
      [
        t(
          'Keep the compatible working cable or display connected, with no tension on the cable. Use the computer normally for a few minutes and check that the picture stays stable.',
          'ใช้สายหรือจอที่รองรับและใช้ได้ต่อไป โดยไม่ดึงสายตึง ลองใช้งานปกติสักครู่แล้วตรวจว่าภาพคงที่',
        ),
        t(
          'If the replacement is only borrowed, record which change helped before returning it. Have the original part checked before buying a replacement.',
          'หากยืมอุปกรณ์มาทดสอบ ให้บันทึกว่าสิ่งใดช่วยก่อนคืน ควรตรวจชิ้นเดิมก่อนซื้อใหม่',
        ),
      ],
      retry,
      'unresolved',
      undefined,
      t(
        'Stop using the replacement setup if it worsens the problem. Do not reconnect visibly damaged parts.',
        'หยุดใช้ชุดทดแทนหากอาการแย่ลง ห้ามต่อชิ้นส่วนที่มองเห็นว่าเสียหายกลับเข้าไป',
      ),
    ),
  ],
);
