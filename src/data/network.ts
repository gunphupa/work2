import { t } from '@/types/diagnostic';
import { flow, q, o, fix, retry } from './builders';
import { connectionChecks } from './connection-checks';
const wifiGuide = [
  t(
    'Open Settings → Network & internet. Check Wi-Fi and Airplane mode. On Windows 10, the section is called Network & Internet.',
    'เปิด Settings → Network & internet ตรวจ Wi-Fi และ Airplane mode ใน Windows 10 ชื่อหมวดคือ Network & Internet',
  ),
];
export const wifi = flow(
  'wifi',
  'radio',
  [
    ['radio', t('Wi-Fi disabled or airplane mode', 'ปิด Wi-Fi หรือเปิดโหมดเครื่องบิน')],
    ['range', t('Weak signal or unavailable network', 'สัญญาณอ่อนหรือไม่พบเครือข่าย')],
    ['credentials', t('Network sign-in or credentials', 'การลงชื่อเข้าใช้หรือรหัสเครือข่าย')],
    ['router', t('Router or internet provider', 'เราเตอร์หรือผู้ให้บริการอินเทอร์เน็ต')],
    ['pc', t('This computer’s connection', 'การเชื่อมต่อของคอมพิวเตอร์นี้')],
  ],
  [
    q(
      'radio',
      t('Is Wi-Fi on and airplane mode off?', 'เปิด Wi-Fi และปิดโหมดเครื่องบินหรือไม่'),
      t(
        'These switches can disconnect Wi-Fi without a hardware fault.',
        'สวิตช์เหล่านี้อาจตัด Wi-Fi โดยที่ฮาร์ดแวร์ไม่ได้เสีย',
      ),
      wifiGuide,
      [
        o(
          'off',
          'Wi-Fi is off or airplane mode is on',
          'ปิด Wi-Fi หรือเปิดโหมดเครื่องบิน',
          'radio_fix',
          { radio: 'likely' },
        ),
        o('on', 'Wi-Fi is on; airplane mode is off', 'เปิด Wi-Fi และปิดโหมดเครื่องบิน', 'visible', {
          radio: 'ruled_out',
        }),
        o('missing', 'There is no Wi-Fi option', 'ไม่มีตัวเลือก Wi-Fi', 'adapter'),
      ],
      'adapter',
    ),
    fix(
      'radio_fix',
      t('Enable your wireless connection', 'เปิดการเชื่อมต่อไร้สาย'),
      'radio',
      t(
        'A disabled radio explains why the computer cannot connect.',
        'การปิดการเชื่อมต่อไร้สายอธิบายว่าทำไมเครื่องเชื่อมต่อไม่ได้',
      ),
      [
        t(
          'Turn airplane mode off and Wi-Fi on. If your laptop has a wireless switch, check its manual. Select your trusted network.',
          'ปิดโหมดเครื่องบินและเปิด Wi-Fi หากโน้ตบุ๊กมีสวิตช์ไร้สาย ให้ตรวจคู่มือ เลือกเครือข่ายที่เชื่อถือได้',
        ),
      ],
      retry,
      'visible',
    ),
    q(
      'adapter',
      t('Does Device Manager show a wireless adapter?', 'Device Manager พบอะแดปเตอร์ไร้สายหรือไม่'),
      t(
        'A missing Wi-Fi control may indicate an adapter or driver issue rather than a router issue.',
        'ไม่มีปุ่ม Wi-Fi อาจเกี่ยวกับอะแดปเตอร์หรือไดรเวอร์ ไม่ใช่เราเตอร์',
      ),
      [
        t(
          'Right-click Start → Device Manager → Network adapters. Look for a Wi-Fi or Wireless adapter or a warning icon. Read only; do not uninstall anything.',
          'คลิกขวา Start → Device Manager → Network adapters มองหา Wi-Fi หรือ Wireless หรือไอคอนเตือน อ่านอย่างเดียว ไม่ต้องถอนการติดตั้ง',
        ),
      ],
      [
        o('warning', 'Missing or showing a warning', 'ไม่พบหรือมีไอคอนเตือน', 'unresolved', {
          pc: 'likely',
        }),
        o('present', 'Wireless adapter is listed normally', 'พบอะแดปเตอร์ปกติ', 'visible', {
          pc: 'possible',
        }),
      ],
    ),
    q(
      'visible',
      t('Can you see your network name?', 'เห็นชื่อเครือข่ายของคุณหรือไม่'),
      t(
        'A missing network suggests a signal or router availability issue.',
        'ไม่พบเครือข่ายอาจเกี่ยวกับสัญญาณหรือเราเตอร์',
      ),
      [
        t(
          'Open the Wi-Fi network list near the taskbar clock. Look for your own trusted network. Do not connect to unknown networks.',
          'เปิดรายการ Wi-Fi ใกล้นาฬิกาบนแถบงาน มองหาเครือข่ายที่เชื่อถือได้ อย่าเชื่อมต่อเครือข่ายที่ไม่รู้จัก',
        ),
      ],
      [
        o('yes', 'Yes, my network is listed', 'เห็นชื่อเครือข่าย', 'connected', {
          range: 'unlikely',
        }),
        o('no', 'My network is missing', 'ไม่มีชื่อเครือข่าย', 'range_test', { range: 'possible' }),
      ],
      'range_test',
    ),
    q(
      'range_test',
      t('Does moving closer make the network appear?', 'ขยับเข้าใกล้แล้วพบเครือข่ายหรือไม่'),
      t(
        'This checks signal range without changing the router configuration.',
        'ช่วยตรวจระยะสัญญาณโดยไม่เปลี่ยนการตั้งค่าเราเตอร์',
      ),
      [
        t(
          'If practical, move the laptop closer to the router. Check that the router has power. Do not reset it or unplug shared equipment.',
          'หากทำได้ ให้ย้ายโน้ตบุ๊กเข้าใกล้เราเตอร์ ตรวจว่าเราเตอร์มีไฟ อย่ากดรีเซ็ตหรือถอดปลั๊กอุปกรณ์ส่วนรวม',
        ),
      ],
      [
        o('yes', 'The network appears nearby', 'พบเครือข่ายเมื่ออยู่ใกล้', 'range_fix', {
          range: 'likely',
        }),
        o('no', 'Still missing', 'ยังไม่พบ', 'other_device'),
      ],
      'other_device',
    ),
    fix(
      'range_fix',
      t('Use a stronger signal location', 'ใช้งานในจุดที่สัญญาณแรงกว่า'),
      'range',
      t('The network appeared closer to the router.', 'เครือข่ายปรากฏเมื่ออยู่ใกล้เราเตอร์'),
      [
        t(
          'Use the computer closer to the router and away from large obstacles. Connect to your trusted network.',
          'ใช้เครื่องใกล้เราเตอร์และห่างสิ่งกีดขวางขนาดใหญ่ แล้วเชื่อมต่อเครือข่ายที่เชื่อถือได้',
        ),
      ],
      retry,
      'connected',
    ),
    q(
      'connected',
      t('What happens when you connect?', 'เกิดอะไรขึ้นเมื่อเชื่อมต่อ'),
      t(
        'Authentication failures differ from a connection that has no internet.',
        'ปัญหารหัสหรือการยืนยันตัวตนต่างจากเชื่อมต่อได้แต่ไม่มีอินเทอร์เน็ต',
      ),
      [
        t(
          'Select your trusted network and read the exact status. Never share the Wi-Fi password here.',
          'เลือกเครือข่ายที่เชื่อถือได้และอ่านสถานะ ไม่ต้องส่งรหัส Wi-Fi ที่นี่',
        ),
      ],
      [
        o(
          'password',
          'Password or sign-in error',
          'รหัสผ่านหรือการลงชื่อเข้าใช้ผิดพลาด',
          'signin_fix',
          { credentials: 'likely' },
        ),
        o('limited', 'Connected, but no internet', 'เชื่อมต่อแต่ไม่มีอินเทอร์เน็ต', 'other_device'),
        o(
          'works',
          'Connected and internet now works',
          'เชื่อมต่อและใช้อินเทอร์เน็ตได้แล้ว',
          'recheck',
          { pc: 'possible' },
        ),
      ],
      'other_device',
    ),
    fix(
      'signin_fix',
      t('Check the network’s sign-in requirements', 'ตรวจข้อมูลเข้าใช้เครือข่าย'),
      'credentials',
      t(
        'The connection was rejected during authentication.',
        'การเชื่อมต่อถูกปฏิเสธระหว่างยืนยันตัวตน',
      ),
      [
        t(
          'Verify the network name and password with the network owner. Check Caps Lock and keyboard language. For school or work networks, ask the administrator instead of changing security settings.',
          'ตรวจชื่อเครือข่ายและรหัสกับเจ้าของ ตรวจ Caps Lock และภาษาแป้นพิมพ์ หากเป็นเครือข่ายโรงเรียนหรือที่ทำงาน ให้ถามผู้ดูแลแทนการเปลี่ยนค่าความปลอดภัย',
        ),
        t(
          'For a trusted guest network, use its expected sign-in page if Windows offers one. Never bypass certificate warnings.',
          'สำหรับเครือข่ายผู้เยี่ยมชมที่เชื่อถือได้ ใช้หน้าลงชื่อเข้าใช้ที่คาดหมายหาก Windows แสดง ห้ามข้ามคำเตือนใบรับรอง',
        ),
      ],
      retry,
      'other_device',
    ),
    {
      ...fix(
        'recheck',
        t('Verify the restored connection', 'ตรวจการเชื่อมต่อที่กลับมา'),
        'pc',
        t(
          'You report that internet access has returned. This does not establish the original cause.',
          'คุณแจ้งว่าอินเทอร์เน็ตกลับมาแล้ว แต่ยังไม่ยืนยันสาเหตุเดิม',
        ),
        [
          t(
            'Open two familiar websites and repeat the task that failed. If the problem returns, record that below.',
            'เปิดเว็บไซต์ที่รู้จักสองเว็บและลองงานที่เคยมีปัญหา หากเกิดซ้ำให้แจ้งด้านล่าง',
          ),
        ],
        retry,
        'other_device',
      ),
      confidenceOnSuccess: 'possible',
    },
    q(
      'other_device',
      t('Can another device use the same Wi-Fi?', 'อุปกรณ์อื่นใช้ Wi-Fi เดียวกันได้หรือไม่'),
      t(
        'A shared failure points toward the network; a single-device failure points toward this PC.',
        'เสียหลายเครื่องชี้ไปที่เครือข่าย เสียเครื่องเดียวชี้ไปที่เครื่องนี้',
      ),
      [
        t(
          'Use another device on the same Wi-Fi, with mobile data turned off for this test. Try two familiar websites.',
          'ใช้อุปกรณ์อื่นเชื่อม Wi-Fi เดียวกัน ปิดข้อมูลมือถือระหว่างทดสอบ แล้วเปิดเว็บไซต์ที่รู้จักสองเว็บ',
        ),
      ],
      [
        o(
          'both',
          'Neither device can access the internet',
          'ทั้งสองเครื่องใช้อินเทอร์เน็ตไม่ได้',
          'unresolved',
          { router: 'likely', pc: 'unlikely' },
        ),
        o('only', 'The other device works', 'อีกเครื่องใช้ได้', 'reconnect_fix', {
          router: 'unlikely',
          pc: 'likely',
        }),
      ],
    ),
    fix(
      'reconnect_fix',
      t('Reconnect this computer once', 'เชื่อมต่อคอมพิวเตอร์นี้ใหม่หนึ่งครั้ง'),
      'pc',
      t(
        'The network works for another device, so a local connection issue is more likely.',
        'อีกเครื่องใช้เครือข่ายได้ จึงมีแนวโน้มเป็นปัญหาการเชื่อมต่อเฉพาะเครื่อง',
      ),
      [
        t(
          'Finish or pause calls and transfers. Disconnect from Wi-Fi using the network list, then reconnect to the same trusted network. Do not use Network reset.',
          'จบหรือพักสายและการถ่ายโอนก่อน ตัดการเชื่อมต่อจากรายการ Wi-Fi แล้วเชื่อมเครือข่ายเดิมที่เชื่อถือได้ ไม่ต้องใช้ Network reset',
        ),
      ],
      retry,
      'unresolved',
    ),
  ],
);
export const internet = flow(
  'internet',
  'scope',
  [
    ['site', t('One website or application', 'เว็บไซต์หรือแอปเดียว')],
    ['signal', t('Weak wireless signal', 'สัญญาณไร้สายอ่อน')],
    ['load', t('Competing network activity', 'งานอื่นแย่งใช้เครือข่าย')],
    ['provider', t('Router or provider capacity', 'เราเตอร์หรือความจุเครือข่ายผู้ให้บริการ')],
    ['device', t('A device-specific issue', 'ปัญหาเฉพาะอุปกรณ์')],
  ],
  [
    q(
      'scope',
      t(
        'Is everything online slow, or only one service?',
        'ทุกอย่างออนไลน์ช้าหรือเฉพาะบริการเดียว',
      ),
      t(
        'One slow service may be a problem at that service rather than your connection.',
        'บริการเดียวช้าอาจเป็นปัญหาที่บริการนั้นไม่ใช่เครือข่ายของคุณ',
      ),
      [
        t(
          'Compare two familiar websites or services. Avoid downloading large files just to test.',
          'เปรียบเทียบเว็บไซต์หรือบริการที่รู้จักสองแห่ง ไม่ต้องดาวน์โหลดไฟล์ใหญ่เพื่อทดสอบ',
        ),
      ],
      [
        o('one', 'Only one website or app', 'เว็บหรือแอปเดียว', 'site_fix', { site: 'likely' }),
        o('all', 'Several services are slow', 'หลายบริการช้า', 'compare', { site: 'unlikely' }),
      ],
      'compare',
    ),
    fix(
      'site_fix',
      t('Check the affected service', 'ตรวจบริการที่มีปัญหา'),
      'site',
      t(
        'Other services respond normally on the same connection.',
        'บริการอื่นตอบสนองปกติบนเครือข่ายเดียวกัน',
      ),
      [
        t(
          'Check the service’s official status or help page. Save work and reopen the affected app or page. If it reports an outage, wait for the service to recover.',
          'ตรวจหน้าสถานะหรือความช่วยเหลืออย่างเป็นทางการ บันทึกงานและเปิดแอปหรือหน้าเว็บใหม่ หากมีประกาศขัดข้องให้รอบริการกลับมา',
        ),
      ],
      retry,
      'compare',
    ),
    q(
      'compare',
      t('Is another device slow on the same network?', 'อีกเครื่องช้าบนเครือข่ายเดียวกันหรือไม่'),
      t(
        'This helps separate a PC issue from a shared network slowdown.',
        'ช่วยแยกปัญหาเครื่องกับเครือข่ายที่ช้าร่วมกัน',
      ),
      [
        t(
          'Compare the same websites on another device using the same network. Turn mobile data off on a phone during the comparison.',
          'เปรียบเทียบเว็บเดียวกันบนอีกอุปกรณ์ที่ใช้เครือข่ายเดียวกัน ปิดข้อมูลมือถือขณะเปรียบเทียบ',
        ),
      ],
      [
        o('both', 'Both are slow', 'ช้าทั้งสองเครื่อง', 'traffic', {
          provider: 'possible',
          device: 'unlikely',
        }),
        o('one', 'Only this computer is slow', 'ช้าเฉพาะเครื่องนี้', 'signal', {
          device: 'possible',
          provider: 'unlikely',
        }),
      ],
      'signal',
    ),
    q(
      'signal',
      t('Does the connection improve near the router?', 'ใกล้เราเตอร์แล้วดีขึ้นหรือไม่'),
      t(
        'Distance and obstacles can reduce Wi-Fi quality.',
        'ระยะห่างและสิ่งกีดขวางลดคุณภาพ Wi-Fi ได้',
      ),
      [
        t(
          'If using Wi-Fi, move closer if practical and retry the same website. If using Ethernet, choose “No difference / Ethernet”.',
          'หากใช้ Wi-Fi ลองเข้าใกล้แล้วทดสอบเว็บเดิม หากใช้สาย Ethernet เลือก “ไม่ต่าง / Ethernet”',
        ),
      ],
      [
        o('yes', 'It is noticeably better nearby', 'ใกล้แล้วดีขึ้นชัดเจน', 'signal_fix', {
          signal: 'likely',
        }),
        o('no', 'No difference / Ethernet', 'ไม่ต่าง / Ethernet', 'traffic', {
          signal: 'unlikely',
        }),
      ],
      'traffic',
    ),
    fix(
      'signal_fix',
      t('Improve the wireless path', 'ปรับเส้นทางสัญญาณไร้สาย'),
      'signal',
      t('The same task worked better closer to the router.', 'งานเดิมทำได้ดีขึ้นเมื่อใกล้เราเตอร์'),
      [
        t(
          'Work closer to the router, or use a compatible Ethernet connection if available and authorized. Avoid changing shared router settings.',
          'ใช้งานใกล้เราเตอร์ หรือใช้สาย Ethernet ที่รองรับหากมีและได้รับอนุญาต หลีกเลี่ยงเปลี่ยนการตั้งค่าเราเตอร์ส่วนรวม',
        ),
      ],
      retry,
      'traffic',
    ),
    q(
      'traffic',
      t('Are large transfers running?', 'มีการถ่ายโอนข้อมูลขนาดใหญ่อยู่หรือไม่'),
      t(
        'Downloads, cloud sync, and streaming can share limited connection capacity.',
        'การดาวน์โหลด ซิงก์คลาวด์ และสตรีมใช้ความจุเครือข่ายร่วมกัน',
      ),
      [
        t(
          'Look for downloads, backup/sync activity, or high-quality streaming on your devices. Ask other network users before changing shared activity.',
          'ดูการดาวน์โหลด สำรองหรือซิงก์ และสตรีมคุณภาพสูงบนอุปกรณ์ ถามผู้ใช้เครือข่ายคนอื่นก่อนเปลี่ยนงานส่วนรวม',
        ),
      ],
      [
        o(
          'yes',
          'Yes, a transfer I control is running',
          'มีการถ่ายโอนที่ควบคุมได้อยู่',
          'traffic_fix',
          { load: 'likely' },
        ),
        o('no', 'No known large transfers', 'ไม่มีการถ่ายโอนใหญ่ที่ทราบ', 'browser_compare', {
          load: 'unlikely',
        }),
      ],
      'browser_compare',
    ),
    fix(
      'traffic_fix',
      t('Pause a competing download', 'พักการดาวน์โหลดที่แย่งเครือข่าย'),
      'load',
      t(
        'A known transfer is consuming connection capacity.',
        'การถ่ายโอนที่ทราบกำลังใช้ความจุเครือข่าย',
      ),
      [
        t(
          'Pause only a download or sync that you control using its own Pause button. Do not interrupt critical updates. Test the same task, then resume the transfer.',
          'พักเฉพาะการดาวน์โหลดหรือซิงก์ที่ควบคุมได้ด้วยปุ่ม Pause ห้ามขัดจังหวะอัปเดตสำคัญ ทดสอบงานเดิมแล้วดำเนินการถ่ายโอนต่อ',
        ),
      ],
      retry,
      'browser_compare',
      undefined,
      t('Resume the transfer using its own app.', 'กลับไปดำเนินการถ่ายโอนต่อจากแอปเดิม'),
    ),
    q(
      'browser_compare',
      t(
        'Does another browser load the same pages normally?',
        'เบราว์เซอร์อื่นโหลดหน้าเดิมตามปกติหรือไม่',
      ),
      t(
        'This separates a browser-specific issue from a connection that is slow across apps.',
        'ช่วยแยกปัญหาเฉพาะเบราว์เซอร์ออกจากการเชื่อมต่อที่ช้าหลายแอป',
      ),
      [
        t(
          'Keep FixFlow open. If another trusted browser is already installed, compare the same two familiar pages there. Do not clear passwords, disable security tools, or install a new browser just for this test.',
          'เปิด FixFlow ไว้ หากมีเบราว์เซอร์ที่เชื่อถือได้อีกตัวติดตั้งอยู่ เปรียบเทียบเว็บที่รู้จักสองหน้าเดิม ไม่ต้องลบรหัสผ่าน ปิดโปรแกรมความปลอดภัย หรือติดตั้งเบราว์เซอร์เพื่อทดสอบนี้',
        ),
      ],
      [
        o(
          'yes',
          'The other browser is noticeably faster',
          'เบราว์เซอร์อื่นเร็วกว่าอย่างเห็นได้ชัด',
          'browser_fix',
          { device: 'likely' },
        ),
        o('no', 'Both browsers are slow', 'ช้าทั้งสองเบราว์เซอร์', 'router_check'),
        o(
          'unavailable',
          'No other browser is available',
          'ไม่มีเบราว์เซอร์อื่นให้ทดสอบ',
          'router_check',
        ),
      ],
      'router_check',
    ),
    {
      ...fix(
        'browser_fix',
        t('Use the working browser for this task', 'ใช้เบราว์เซอร์ที่ทำงานได้สำหรับงานนี้'),
        'device',
        t(
          'The same pages work better in another browser. This offers a workaround without resetting your data.',
          'หน้าเดียวกันทำงานดีกว่าในอีกเบราว์เซอร์ เป็นทางเลี่ยงโดยไม่รีเซ็ตข้อมูล',
        ),
        [
          t(
            'Complete the original task in the working browser. Keep the affected browser’s data unchanged. If this helps, note both browser versions for follow-up support rather than assuming the whole internet connection was fixed.',
            'ทำงานเดิมในเบราว์เซอร์ที่ใช้ได้ คงข้อมูลเบราว์เซอร์เดิมไว้ หากช่วยให้จดเวอร์ชันทั้งสองสำหรับฝ่ายช่วยเหลือ แทนการสรุปว่าเน็ตทั้งหมดถูกแก้แล้ว',
          ),
        ],
        retry,
        'router_check',
      ),
      confidenceOnSuccess: 'likely',
    },
    ...connectionChecks('provider').filter((node) =>
      ['router_check', 'provider_status'].includes(node.id),
    ),
  ],
);
