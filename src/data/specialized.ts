import { t } from '@/types/diagnostic';
import { flow, q, o, fix, retry, taskGuide, saveWork } from './builders';
export const heat = flow(
  'heat',
  'safety',
  [
    ['air', t('Restricted airflow', 'การระบายอากาศถูกกีดขวาง')],
    ['load', t('Sustained workload', 'ภาระงานสูงต่อเนื่อง')],
    ['cooling', t('Cooling or hardware problem', 'ระบบระบายความร้อนหรือฮาร์ดแวร์')],
  ],
  [
    q(
      'safety',
      t('Are there any warning signs?', 'มีสัญญาณอันตรายหรือไม่'),
      t(
        'A hot surface alone does not prove overheating. Smoke, battery swelling, or repeated shutdowns need a different response.',
        'ผิวเครื่องอุ่นอย่างเดียวไม่ยืนยันว่าร้อนเกินไป ควัน แบตเตอรี่บวม หรือดับเองซ้ำต้องจัดการต่างกัน',
      ),
      [
        t(
          'Without opening or touching hot parts, check for smoke, a burning smell, a swollen battery, or repeated shutdowns. Do not install stress tests.',
          'ไม่ต้องเปิดหรือแตะชิ้นส่วนร้อน ตรวจควัน กลิ่นไหม้ แบตเตอรี่บวม หรือดับเองซ้ำ ห้ามติดตั้งโปรแกรมทดสอบหนัก',
        ),
      ],
      [
        o(
          'danger',
          'Smoke, burning smell, swelling, or repeated shutdowns',
          'ควัน กลิ่นไหม้ บวม หรือดับเองซ้ำ',
          'safety_stop',
          { cooling: 'likely' },
        ),
        o(
          'warm',
          'Warm or loud, but none of those signs',
          'อุ่นหรือพัดลมดังแต่ไม่มีอาการข้างต้น',
          'air',
        ),
      ],
    ),
    q(
      'air',
      t('Are the air vents blocked?', 'ช่องระบายอากาศถูกบังหรือไม่'),
      t(
        'Soft surfaces and covered vents can restrict cooling.',
        'พื้นผิวนุ่มและช่องระบายที่ถูกบังอาจขัดขวางการระบายความร้อน',
      ),
      [
        t(
          'Check whether a laptop is on a blanket or cushion. Look for objects covering external vents. Keep clear of hot surfaces.',
          'ดูว่าโน้ตบุ๊กวางบนผ้าห่มหรือเบาะหรือไม่ ดูสิ่งที่บังช่องระบายภายนอก หลีกเลี่ยงผิวที่ร้อน',
        ),
      ],
      [
        o(
          'blocked',
          'Yes, vents are covered or on a soft surface',
          'ถูกบังหรือวางบนพื้นนุ่ม',
          'air_fix',
          { air: 'likely' },
        ),
        o('clear', 'Vents are clear on a hard surface', 'ช่องไม่ถูกบังและวางบนพื้นแข็ง', 'load', {
          air: 'unlikely',
        }),
      ],
      'load',
    ),
    fix(
      'air_fix',
      t('Give the computer room to cool', 'ให้เครื่องมีพื้นที่ระบายความร้อน'),
      'air',
      t('You found an obstruction to airflow.', 'พบสิ่งกีดขวางการระบายอากาศ'),
      [
        t(
          'Save work. Place the computer on a hard, flat surface with clearance around vents. Let it cool under a light workload. Do not open it or spray liquid into it.',
          'บันทึกงาน วางเครื่องบนพื้นแข็งเรียบและเว้นรอบช่องระบาย ให้เย็นลงโดยใช้งานเบา ๆ ห้ามเปิดเครื่องหรือฉีดของเหลว',
        ),
      ],
      retry,
      'load',
    ),
    q(
      'load',
      t('Does it become hot only during demanding work?', 'ร้อนเฉพาะขณะทำงานหนักหรือไม่'),
      t(
        'Games and rendering produce heat; unusual heat while idle can indicate a cooling problem.',
        'เกมและการเรนเดอร์สร้างความร้อน ร้อนผิดปกติขณะว่างอาจเกี่ยวกับระบบระบาย',
      ),
      [
        ...taskGuide,
        t(
          'Compare a demanding task with normal light use. Stop if it shuts down or develops unsafe heat.',
          'เปรียบเทียบงานหนักกับใช้งานเบา หยุดหากเครื่องดับหรือร้อนผิดปกติ',
        ),
      ],
      [
        o(
          'busy',
          'Only during a demanding app or game',
          'เฉพาะแอปหรือเกมที่ใช้ทรัพยากรมาก',
          'load_fix',
          { load: 'likely' },
        ),
        o(
          'idle',
          'It stays unusually hot during light use',
          'ยังร้อนผิดปกติขณะใช้งานเบา',
          'unresolved',
          { cooling: 'possible' },
        ),
      ],
    ),
    fix(
      'load_fix',
      t('Reduce the demanding workload', 'ลดภาระงานหนัก'),
      'load',
      t(
        'The heat follows a demanding workload. This does not prove the cooling system is healthy.',
        'ความร้อนเกิดตามภาระงานหนัก แต่ไม่ได้พิสูจน์ว่าระบบระบายปกติ',
      ),
      [
        saveWork,
        t(
          'Close the demanding app normally, or reduce its workload. For a game, use a lower frame-rate limit if available. If unusual heat persists, stop and seek manufacturer support.',
          'ปิดแอปหนักตามปกติหรือลดภาระ หากเป็นเกมใช้การจำกัดเฟรมที่ต่ำลงหากมี หากยังร้อนผิดปกติให้หยุดและขอคำแนะนำจากผู้ผลิต',
        ),
      ],
      retry,
      'unresolved',
    ),
  ],
);
export const gaming = flow(
  'gaming',
  'type',
  [
    ['network', t('Online connection latency', 'ความหน่วงเครือข่ายออนไลน์')],
    ['render', t('Graphics workload', 'ภาระการแสดงผลภาพ')],
    ['background', t('Background workload', 'ภาระงานเบื้องหลัง')],
    ['heat', t('Heat-related performance limits', 'ประสิทธิภาพลดลงจากความร้อน')],
  ],
  [
    q(
      'type',
      t('What kind of lag do you notice?', 'สังเกตอาการกระตุกแบบใด'),
      t(
        'Delayed online actions differ from choppy frames rendered by the computer.',
        'การตอบสนองออนไลน์ช้าต่างจากภาพที่เครื่องแสดงไม่ต่อเนื่อง',
      ),
      [
        t(
          'If the game provides FPS and ping indicators, observe them. FPS describes frame rate; ping describes network delay. Do not install a new tool just for this check.',
          'หากเกมมีตัวแสดง FPS และ ping ให้สังเกต FPS คืออัตราเฟรม ping คือความหน่วงเครือข่าย ไม่ต้องติดตั้งเครื่องมือใหม่',
        ),
      ],
      [
        o(
          'online',
          'Players jump around or online actions are delayed',
          'ผู้เล่นวาร์ปหรือคำสั่งออนไลน์ช้า',
          'network',
          { network: 'possible' },
        ),
        o(
          'frames',
          'The whole picture is choppy, including offline',
          'ภาพกระตุกแม้เล่นออฟไลน์',
          'load',
          { render: 'possible', network: 'unlikely' },
        ),
      ],
      'load',
    ),
    q(
      'network',
      t('Does it happen in other online services too?', 'บริการออนไลน์อื่นมีปัญหาด้วยหรือไม่'),
      t(
        'One game server can have problems even if the local network is fine.',
        'เซิร์ฟเวอร์เกมเดียวอาจมีปัญหาแม้เครือข่ายปกติ',
      ),
      [
        t(
          'Check the game’s official service status and compare another familiar online service. Look for your own active downloads.',
          'ตรวจสถานะบริการอย่างเป็นทางการของเกมและเปรียบเทียบบริการอื่น ดูการดาวน์โหลดของคุณที่กำลังทำงาน',
        ),
      ],
      [
        o(
          'download',
          'A download I control is running',
          'มีการดาวน์โหลดที่ควบคุมได้อยู่',
          'network_fix',
          { network: 'likely' },
        ),
        o(
          'server',
          'Only this game, or the service reports an outage',
          'เฉพาะเกมนี้หรือบริการแจ้งขัดข้อง',
          'unresolved',
        ),
        o('all', 'Several online services are affected', 'หลายบริการมีปัญหา', 'unresolved', {
          network: 'likely',
        }),
      ],
    ),
    fix(
      'network_fix',
      t('Pause the competing transfer', 'พักการถ่ายโอนที่แย่งเครือข่าย'),
      'network',
      t('Your active transfer may be competing with the game.', 'การถ่ายโอนอาจแย่งเครือข่ายกับเกม'),
      [
        t(
          'Pause a download you control using its own Pause button. Do not interrupt updates or other people’s activity. Test the same game server, then resume the download.',
          'พักการดาวน์โหลดที่ควบคุมได้ด้วยปุ่ม Pause ห้ามขัดจังหวะอัปเดตหรืองานคนอื่น ทดสอบเซิร์ฟเวอร์เดิมแล้วดาวน์โหลดต่อ',
        ),
      ],
      retry,
      'unresolved',
    ),
    q(
      'load',
      t('Are other demanding apps running?', 'มีแอปหนักอื่นทำงานอยู่หรือไม่'),
      t(
        'Background apps can compete for CPU, memory, and graphics resources.',
        'แอปเบื้องหลังอาจแย่ง CPU หน่วยความจำ และกราฟิก',
      ),
      taskGuide,
      [
        o(
          'yes',
          'A known app is using a lot of resources',
          'แอปที่รู้จักใช้ทรัพยากรมาก',
          'background_fix',
          { background: 'likely' },
        ),
        o('no', 'No demanding background app', 'ไม่มีแอปเบื้องหลังที่ทำงานหนัก', 'settings', {
          background: 'unlikely',
        }),
      ],
      'settings',
    ),
    fix(
      'background_fix',
      t('Close the competing app normally', 'ปิดแอปที่แย่งทรัพยากรตามปกติ'),
      'background',
      t(
        'You observed another demanding app during the slowdown.',
        'พบแอปอื่นที่ใช้ทรัพยากรสูงขณะช้า',
      ),
      [
        saveWork,
        t(
          'Close only the known app and retry the same game scene. Leave Windows and security processes running.',
          'ปิดเฉพาะแอปที่รู้จักแล้วทดสอบฉากเดิม ให้กระบวนการ Windows และความปลอดภัยทำงานต่อ',
        ),
      ],
      retry,
      'settings',
    ),
    q(
      'settings',
      t('Does a lower graphics preset improve frame rate?', 'ลดกราฟิกแล้วเฟรมดีขึ้นหรือไม่'),
      t(
        'A reversible graphics change tests whether rendering load is a major contributor.',
        'ปรับกราฟิกที่ย้อนกลับได้ช่วยทดสอบว่าภาระภาพเป็นสาเหตุหลักหรือไม่',
      ),
      [
        t(
          'Note the current preset. Select a lower preset in the game, then compare the same scene. Restore the original setting if needed.',
          'จดค่ากราฟิกเดิม เลือกค่าต่ำลงในเกมและเปรียบเทียบฉากเดิม คืนค่าเดิมได้หากต้องการ',
        ),
      ],
      [
        o('yes', 'Frame rate improves', 'เฟรมดีขึ้น', 'settings_fix', { render: 'likely' }),
        o('no', 'Little or no improvement', 'ดีขึ้นน้อยหรือไม่ดีขึ้น', 'time', {
          render: 'unlikely',
        }),
      ],
      'time',
    ),
    fix(
      'settings_fix',
      t('Use a balanced graphics preset', 'ใช้กราฟิกที่เหมาะกับเครื่อง'),
      'render',
      t('Lower rendering demand improved the same scene.', 'ลดภาระแสดงผลแล้วฉากเดิมดีขึ้น'),
      [
        t(
          'Keep a graphics preset that runs smoothly. Check the game’s official system requirements before considering upgrades.',
          'ใช้ค่ากราฟิกที่ทำงานลื่น ตรวจข้อกำหนดระบบอย่างเป็นทางการของเกมก่อนคิดอัปเกรด',
        ),
      ],
      retry,
      'time',
    ),
    q(
      'time',
      t('Does performance worsen as the computer heats up?', 'ยิ่งเครื่องร้อนยิ่งช้าหรือไม่'),
      t(
        'Time-related slowdown can be consistent with heat limits, but needs more evidence.',
        'ช้าลงตามเวลาอาจเกี่ยวกับความร้อน แต่ต้องมีข้อมูลเพิ่ม',
      ),
      [
        t(
          'Compare the start of a session with later normal play. Do not stress-test. If you notice unsafe heat or repeated shutdowns, stop using the computer and seek service.',
          'เปรียบเทียบช่วงเริ่มเล่นกับภายหลังตามปกติ ไม่ต้องทดสอบหนัก หากร้อนผิดปกติหรือดับเองซ้ำ ให้หยุดใช้งานและส่งตรวจ',
        ),
      ],
      [
        o('yes', 'It worsens with heat over time', 'ช้าลงเมื่อร้อนขึ้นตามเวลา', 'unresolved', {
          heat: 'possible',
        }),
        o('no', 'It is equally slow from the start', 'ช้าเท่ากันตั้งแต่เริ่ม', 'unresolved', {
          heat: 'unlikely',
        }),
      ],
    ),
  ],
);
