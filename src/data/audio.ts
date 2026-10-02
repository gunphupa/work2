import { t } from '@/types/diagnostic';
import { flow, q, o, fix, retry } from './builders';
const inputGuide = [
  t(
    'Open Settings → System → Sound. Under Input, look for your microphone. In Windows 10, look under “Choose your input device”.',
    'เปิด Settings → System → Sound ใต้ Input มองหาไมโครโฟน ใน Windows 10 ให้ดู “Choose your input device”',
  ),
  t(
    'If it is external, check its power and connector without opening the computer. For Bluetooth, check pairing in Bluetooth settings.',
    'หากเป็นอุปกรณ์ภายนอก ตรวจไฟและขั้วต่อโดยไม่เปิดตัวเครื่อง หากเป็น Bluetooth ให้ตรวจการจับคู่ในการตั้งค่า Bluetooth',
  ),
];
const permissions = [
  t(
    'Windows 11: Settings → Privacy & security → Microphone. Windows 10: Settings → Privacy → Microphone.',
    'Windows 11: Settings → Privacy & security → Microphone ส่วน Windows 10: Settings → Privacy → Microphone',
  ),
  t(
    'Look at Microphone access, app access, and desktop app access. Check the affected app if it is listed.',
    'ดู Microphone access สิทธิ์แอป และสิทธิ์แอปเดสก์ท็อป ตรวจแอปที่มีปัญหาหากมีในรายการ',
  ),
];
const micCauses: [string, ReturnType<typeof t>][] = [
  ['connection', t('Connection or device detection', 'การเชื่อมต่อหรือการตรวจพบอุปกรณ์')],
  ['selection', t('Wrong input selected', 'เลือกอุปกรณ์รับเสียงผิด')],
  ['mute', t('Muted or low microphone level', 'ปิดเสียงหรือระดับไมโครโฟนต่ำ')],
  ['permission', t('Microphone access blocked', 'สิทธิ์ไมโครโฟนถูกปิด')],
  ['app', t('Application-specific settings', 'การตั้งค่าเฉพาะแอป')],
  ['hardware', t('Device, cable, or driver problem', 'ปัญหาอุปกรณ์ สาย หรือไดรเวอร์')],
];
export const microphone = flow('microphone', 'detect', micCauses, [
  q(
    'detect',
    t('Can Windows see your microphone?', 'Windows พบไมโครโฟนหรือไม่'),
    t(
      'Detection separates connection problems from input and app settings.',
      'การตรวจพบช่วยแยกปัญหาการเชื่อมต่อออกจากการตั้งค่าเสียงและแอป',
    ),
    inputGuide,
    [
      o('yes', 'Yes, my microphone is listed', 'มีไมโครโฟนในรายการ', 'selected', {
        connection: 'ruled_out',
      }),
      o('no', 'No, it is missing', 'ไม่มีในรายการ', 'connection', { connection: 'likely' }),
    ],
    'connection',
  ),
  q(
    'connection',
    t('How is the microphone connected?', 'ไมโครโฟนเชื่อมต่ออย่างไร'),
    t(
      'The connection type determines which physical checks are useful.',
      'ชนิดการเชื่อมต่อช่วยเลือกการตรวจที่เหมาะสม',
    ),
    [
      t(
        'Look at the connector or device settings. Built-in laptop microphones do not have an external cable.',
        'ดูขั้วต่อหรือการตั้งค่าอุปกรณ์ ไมโครโฟนในโน้ตบุ๊กไม่มีสายภายนอก',
      ),
    ],
    [
      o('usb', 'USB cable or USB receiver', 'สาย USB หรือตัวรับ USB', 'port'),
      o('jack', '3.5 mm audio plug', 'แจ็คเสียง 3.5 มม.', 'jack'),
      o('bluetooth', 'Bluetooth', 'Bluetooth', 'pair'),
      o('builtin', 'Built into the computer', 'ติดตั้งในเครื่อง', 'unresolved', {
        hardware: 'possible',
      }),
    ],
  ),
  q(
    'port',
    t('Does another USB port detect it?', 'พอร์ต USB อื่นตรวจพบหรือไม่'),
    t(
      'This checks whether the original port or hub is the problem.',
      'ช่วยตรวจว่าพอร์ตเดิมหรือฮับเป็นสาเหตุหรือไม่',
    ),
    [
      t(
        'Connect the microphone directly to a different USB port on the computer, without a hub. Wait a few seconds and check the Sound input list again.',
        'เสียบไมโครโฟนเข้าพอร์ต USB อื่นของเครื่องโดยไม่ผ่านฮับ รอสักครู่แล้วตรวจรายการ Input อีกครั้ง',
      ),
    ],
    [
      o('yes', 'It is now listed', 'พบในรายการแล้ว', 'port_fix', { connection: 'likely' }),
      o('no', 'Still not listed', 'ยังไม่พบ', 'cross_test', { hardware: 'possible' }),
    ],
    'cross_test',
  ),
  fix(
    'port_fix',
    t('Use the working connection', 'ใช้การเชื่อมต่อที่ทำงานได้'),
    'connection',
    t(
      'Windows detects the microphone on another port, which points to the original connection.',
      'Windows พบไมโครโฟนเมื่อใช้พอร์ตอื่น จึงชี้ไปที่การเชื่อมต่อเดิม',
    ),
    [
      t(
        'Keep it connected to the working port. Open your app and select this microphone as its input.',
        'ใช้พอร์ตที่ทำงานได้ต่อไป เปิดแอปและเลือกไมโครโฟนนี้เป็นอุปกรณ์รับเสียง',
      ),
    ],
    retry,
    'selected',
  ),
  q(
    'jack',
    t('Does the plug match the microphone socket?', 'แจ็คตรงกับช่องไมโครโฟนหรือไม่'),
    t(
      'Headphone-only sockets and separate microphone plugs are not interchangeable. Some headsets need the correct splitter.',
      'ช่องหูฟังอย่างเดียวกับช่องไมโครโฟนใช้แทนกันไม่ได้ ชุดหูฟังบางรุ่นต้องใช้ตัวแยกที่ถูกต้อง',
    ),
    [
      t(
        'Use the microphone or combined headset socket marked by its icon. Check the device manual if the connector has separate plugs; do not force it.',
        'ใช้ช่องที่มีสัญลักษณ์ไมโครโฟนหรือชุดหูฟัง หากมีหลายแจ็คให้ตรวจคู่มือ ห้ามฝืนเสียบ',
      ),
    ],
    [
      o('wrong', 'It was in the wrong socket', 'เดิมเสียบผิดช่อง', 'jack_fix', {
        connection: 'likely',
      }),
      o('correct', 'The connection matches the manual', 'เชื่อมต่อตรงตามคู่มือ', 'cross_test'),
    ],
    'cross_test',
  ),
  fix(
    'jack_fix',
    t('Connect to the matching audio socket', 'เสียบช่องเสียงที่ตรงกัน'),
    'connection',
    t('The previous socket did not provide microphone input.', 'ช่องเดิมไม่ได้รับสัญญาณไมโครโฟน'),
    [
      t(
        'Connect gently to the socket specified in the device manual. If an adapter is required, use one that matches the headset and computer.',
        'เสียบเบา ๆ เข้าช่องที่คู่มือระบุ หากต้องใช้อะแดปเตอร์ ให้ใช้แบบที่ตรงกับชุดหูฟังและคอมพิวเตอร์',
      ),
    ],
    retry,
    'selected',
  ),
  q(
    'pair',
    t(
      'Is the microphone connected in Bluetooth settings?',
      'ไมโครโฟนเชื่อมต่อใน Bluetooth หรือไม่',
    ),
    t(
      'A saved pairing does not always mean the device is currently connected.',
      'การเคยจับคู่ไม่ได้แปลว่ากำลังเชื่อมต่ออยู่',
    ),
    [
      t(
        'Check Settings → Bluetooth & devices (Windows 10: Devices → Bluetooth & other devices). Make sure the headset is powered on and not in use by another computer or phone.',
        'ตรวจ Settings → Bluetooth & devices (Windows 10: Devices → Bluetooth & other devices) ตรวจว่าเปิดชุดหูฟังและไม่ได้ใช้งานกับเครื่องหรือโทรศัพท์อื่น',
      ),
    ],
    [
      o('off', 'It is disconnected', 'ไม่ได้เชื่อมต่อ', 'pair_fix', { connection: 'likely' }),
      o('on', 'It is connected', 'เชื่อมต่อแล้ว', 'cross_test'),
    ],
    'cross_test',
  ),
  fix(
    'pair_fix',
    t('Reconnect your Bluetooth headset', 'เชื่อมต่อชุดหูฟัง Bluetooth ใหม่'),
    'connection',
    t('Windows reports the device as disconnected.', 'Windows ระบุว่าอุปกรณ์ยังไม่ได้เชื่อมต่อ'),
    [
      t(
        'Turn the headset on and connect using Bluetooth settings. If needed, follow the manufacturer’s pairing instructions. Then choose its microphone in Sound → Input.',
        'เปิดชุดหูฟังและเชื่อมต่อผ่านการตั้งค่า Bluetooth หากจำเป็นให้ทำตามคู่มือการจับคู่ของผู้ผลิต แล้วเลือกไมโครโฟนใน Sound → Input',
      ),
    ],
    retry,
    'selected',
  ),
  q(
    'cross_test',
    t(
      'Does the microphone work on another compatible device?',
      'ไมโครโฟนใช้กับอุปกรณ์อื่นที่รองรับได้หรือไม่',
    ),
    t(
      'A separate device helps distinguish a microphone problem from a Windows issue. Skip if none is available.',
      'อุปกรณ์อีกเครื่องช่วยแยกปัญหาไมโครโฟนกับ Windows ข้ามได้หากไม่มี',
    ),
    [
      t(
        'If safe and convenient, test with another compatible computer or phone using the manufacturer’s supported connection.',
        'หากสะดวกและปลอดภัย ให้ทดสอบกับคอมพิวเตอร์หรือโทรศัพท์ที่รองรับโดยใช้การเชื่อมต่อตามคู่มือ',
      ),
    ],
    [
      o('works', 'It works elsewhere', 'ใช้ได้กับเครื่องอื่น', 'unresolved', {
        hardware: 'possible',
      }),
      o('fails', 'It also fails there', 'เครื่องอื่นก็ใช้ไม่ได้', 'unresolved', {
        hardware: 'likely',
      }),
    ],
  ),
  q(
    'selected',
    t('Is the correct input selected?', 'เลือกอุปกรณ์รับเสียงถูกต้องหรือไม่'),
    t(
      'Windows can detect several microphones while using the wrong one.',
      'Windows อาจพบหลายไมโครโฟนแต่กำลังใช้ผิดตัว',
    ),
    inputGuide,
    [
      o('yes', 'My intended microphone is selected', 'เลือกไมโครโฟนที่ต้องการแล้ว', 'meter', {
        selection: 'ruled_out',
      }),
      o('no', 'A different microphone is selected', 'เลือกไมโครโฟนอื่นอยู่', 'select_fix', {
        selection: 'likely',
      }),
    ],
    'meter',
  ),
  fix(
    'select_fix',
    t('Choose the intended microphone', 'เลือกไมโครโฟนที่ต้องการ'),
    'selection',
    t('Windows was listening to another input.', 'Windows กำลังรับเสียงจากอุปกรณ์อื่น'),
    [
      t(
        'Under Sound → Input, select your microphone. Select the same microphone in the affected app’s audio settings.',
        'ใน Sound → Input เลือกไมโครโฟนของคุณ แล้วเลือกตัวเดียวกันในการตั้งค่าเสียงของแอป',
      ),
    ],
    retry,
    'meter',
  ),
  q(
    'meter',
    t('Does the input meter move when you speak?', 'แถบระดับเสียงขยับเมื่อพูดหรือไม่'),
    t(
      'A moving Windows input meter shows that audio is reaching Windows.',
      'แถบระดับเสียงของ Windows ที่ขยับแสดงว่าเสียงเข้าถึง Windows',
    ),
    [
      ...inputGuide,
      t(
        'Speak normally while watching the microphone’s input meter or Test your microphone control. Do not record private conversations.',
        'พูดตามปกติแล้วดูแถบ Input หรือ Test your microphone อย่าบันทึกบทสนทนาส่วนตัว',
      ),
    ],
    [
      o('yes', 'The meter responds', 'แถบขยับ', 'permission', {
        mute: 'ruled_out',
        hardware: 'unlikely',
      }),
      o('no', 'The meter does not respond', 'แถบไม่ขยับ', 'mute'),
    ],
    'permission',
  ),
  q(
    'mute',
    t(
      'Is the microphone muted or its level very low?',
      'ไมโครโฟนปิดเสียงหรือระดับเสียงต่ำมากหรือไม่',
    ),
    t(
      'A physical mute switch or zero input level can block an otherwise detected microphone.',
      'สวิตช์ปิดเสียงหรือระดับ Input เป็นศูนย์อาจบล็อกไมโครโฟนที่ตรวจพบแล้ว',
    ),
    [
      t(
        'Check the headset’s mute switch and Sound → Input → device properties. Look at the input volume without changing unrelated settings.',
        'ตรวจสวิตช์ปิดเสียงที่ชุดหูฟังและ Sound → Input → คุณสมบัติอุปกรณ์ ดูระดับเสียงโดยไม่เปลี่ยนค่าอื่น',
      ),
    ],
    [
      o('muted', 'Muted or at zero', 'ปิดเสียงหรือเป็นศูนย์', 'mute_fix', { mute: 'likely' }),
      o('normal', 'It is unmuted with a normal level', 'ไม่ปิดเสียงและระดับปกติ', 'permission', {
        mute: 'ruled_out',
      }),
    ],
    'permission',
  ),
  fix(
    'mute_fix',
    t('Unmute and adjust the input level', 'เปิดไมโครโฟนและปรับระดับเสียง'),
    'mute',
    t(
      'The mute or level setting can explain the missing input.',
      'การปิดเสียงหรือระดับต่ำอธิบายอาการเสียงไม่เข้าได้',
    ),
    [
      t(
        'Turn off the physical mute and raise the input volume to a moderate level. Watch the meter while speaking.',
        'ยกเลิกปิดเสียงที่ตัวอุปกรณ์และเพิ่มระดับ Input ให้พอเหมาะ ดูแถบระดับขณะพูด',
      ),
    ],
    retry,
    'permission',
  ),
  q(
    'permission',
    t('Does the app have microphone access?', 'แอปมีสิทธิ์ใช้ไมโครโฟนหรือไม่'),
    t(
      'Windows privacy settings can prevent an app from receiving audio even when the microphone works.',
      'การตั้งค่าความเป็นส่วนตัวอาจบล็อกแอปแม้ไมโครโฟนทำงาน',
    ),
    permissions,
    [
      o('blocked', 'An access setting is off', 'มีสิทธิ์ที่ถูกปิดอยู่', 'permission_fix', {
        permission: 'likely',
      }),
      o('allowed', 'Access is enabled', 'เปิดสิทธิ์แล้ว', 'app_test', { permission: 'ruled_out' }),
    ],
    'app_test',
  ),
  fix(
    'permission_fix',
    t('Allow access for your trusted app', 'อนุญาตไมโครโฟนให้แอปที่เชื่อถือได้'),
    'permission',
    t(
      'You found a disabled permission that applies to the affected app.',
      'พบสิทธิ์ที่ปิดอยู่และเกี่ยวข้องกับแอปที่มีปัญหา',
    ),
    [
      ...permissions,
      t(
        'Enable the required access only for an app you trust. Close and reopen that app after changing the permission.',
        'เปิดสิทธิ์ที่จำเป็นสำหรับแอปที่เชื่อถือได้เท่านั้น แล้วปิดและเปิดแอปใหม่',
      ),
    ],
    retry,
    'app_test',
  ),
  q(
    'app_test',
    t(
      'Does the microphone work in another trusted app?',
      'ไมโครโฟนใช้กับแอปอื่นที่เชื่อถือได้หรือไม่',
    ),
    t(
      'This isolates the original app from the Windows audio path.',
      'ช่วยแยกปัญหาแอปเดิมออกจากระบบเสียงของ Windows',
    ),
    [
      t(
        'Use an existing trusted app’s microphone test, or Sound Recorder / Voice Recorder if installed. Check a short non-private sound.',
        'ใช้การทดสอบไมโครโฟนของแอปที่เชื่อถือได้ หรือ Sound Recorder / Voice Recorder หากติดตั้งอยู่ ทดสอบเสียงสั้น ๆ ที่ไม่เป็นส่วนตัว',
      ),
    ],
    [
      o('yes', 'Yes, another app works', 'แอปอื่นใช้ได้', 'app_fix', {
        app: 'likely',
        hardware: 'unlikely',
      }),
      o('no', 'No, it fails in both', 'ใช้ไม่ได้ทั้งสองแอป', 'unresolved', { app: 'unlikely' }),
    ],
  ),
  fix(
    'app_fix',
    t('Check the original app’s input', 'ตรวจอุปกรณ์รับเสียงของแอปเดิม'),
    'app',
    t(
      'Audio works in another app, pointing to settings inside the original one.',
      'เสียงใช้ได้ในแอปอื่น จึงชี้ไปที่การตั้งค่าในแอปเดิม',
    ),
    [
      t(
        'Open the original app’s audio settings. Select your working microphone, check in-app mute, and use its built-in test. For a website, review that site’s microphone permission in the browser.',
        'เปิดการตั้งค่าเสียงของแอปเดิม เลือกไมโครโฟนที่ใช้ได้ ตรวจปิดเสียงในแอป และใช้การทดสอบของแอป หากเป็นเว็บไซต์ ให้ตรวจสิทธิ์ไมโครโฟนของเว็บในเบราว์เซอร์',
      ),
    ],
    retry,
    'unresolved',
  ),
]);
const soundGuide = [
  t(
    'Open Settings → System → Sound. Check Output (Windows 10: Choose your output device). An HDMI monitor may be selected even if it has no speakers.',
    'เปิด Settings → System → Sound ดู Output (Windows 10: Choose your output device) อาจเลือกจอ HDMI ที่ไม่มีลำโพงอยู่',
  ),
];
export const sound = flow(
  'sound',
  'output',
  [
    ['output', t('Wrong audio output', 'อุปกรณ์ส่งเสียงผิด')],
    ['mute', t('Muted volume', 'ปิดเสียงอยู่')],
    ['app', t('Application audio settings', 'การตั้งค่าเสียงของแอป')],
    ['connection', t('Connection or playback device', 'การเชื่อมต่อหรืออุปกรณ์เล่นเสียง')],
  ],
  [
    q(
      'output',
      t('Is Windows using the output you expect?', 'Windows ใช้อุปกรณ์ส่งเสียงที่ต้องการหรือไม่'),
      t(
        'Sound may be routed to a monitor, headset, or disconnected device.',
        'เสียงอาจถูกส่งไปจอ ชุดหูฟัง หรืออุปกรณ์ที่ไม่ได้เชื่อมต่อ',
      ),
      soundGuide,
      [
        o('wrong', 'A different device is selected', 'เลือกอุปกรณ์อื่นอยู่', 'output_fix', {
          output: 'likely',
        }),
        o('correct', 'The correct device is selected', 'เลือกถูกแล้ว', 'volume', {
          output: 'ruled_out',
        }),
        o('missing', 'My device is missing', 'ไม่มีอุปกรณ์ในรายการ', 'connection'),
      ],
      'connection',
    ),
    fix(
      'output_fix',
      t('Choose your speakers or headphones', 'เลือกลำโพงหรือหูฟัง'),
      'output',
      t(
        'The selected output did not match the device you wanted to hear.',
        'อุปกรณ์ส่งเสียงที่เลือกไม่ตรงกับที่ต้องการ',
      ),
      [
        t(
          'Select your connected speakers or headphones under Output. Keep the volume low at first.',
          'เลือกลำโพงหรือหูฟังที่เชื่อมต่อใน Output เริ่มจากเสียงเบาก่อน',
        ),
      ],
      retry,
      'volume',
    ),
    q(
      'volume',
      t('Is any volume control muted?', 'มีจุดใดปิดเสียงอยู่หรือไม่'),
      t(
        'Windows, the app, and the physical device can each mute sound.',
        'Windows แอป และตัวอุปกรณ์ปิดเสียงแยกกันได้',
      ),
      [
        t(
          'Check the taskbar speaker icon, the app’s volume, and your speaker/headset controls. Start with a low, comfortable volume.',
          'ตรวจไอคอนลำโพงบนแถบงาน เสียงของแอป และปุ่มลำโพงหรือหูฟัง ใช้ระดับเสียงเบาที่สบาย',
        ),
      ],
      [
        o('muted', 'Muted or at zero', 'ปิดเสียงหรือเป็นศูนย์', 'volume_fix', { mute: 'likely' }),
        o('normal', 'All are unmuted', 'ทุกจุดเปิดเสียงแล้ว', 'test', { mute: 'ruled_out' }),
      ],
      'test',
    ),
    fix(
      'volume_fix',
      t('Restore a comfortable volume', 'เปิดเสียงในระดับที่สบาย'),
      'mute',
      t('A muted control was found in the playback path.', 'พบการปิดเสียงในเส้นทางเล่นเสียง'),
      [
        t(
          'Unmute the relevant control and increase volume gradually. Avoid high volume when using headphones.',
          'เปิดเสียงที่จุดนั้นและเพิ่มทีละน้อย หลีกเลี่ยงเสียงดังขณะใช้หูฟัง',
        ),
      ],
      retry,
      'test',
    ),
    q(
      'test',
      t('Can another app play sound?', 'แอปอื่นเล่นเสียงได้หรือไม่'),
      t(
        'A working second app narrows the issue to the original app.',
        'แอปอื่นที่เล่นได้ช่วยจำกัดปัญหาไปที่แอปเดิม',
      ),
      [
        t(
          'At a low volume, play a familiar local audio file or use the selected output device’s Test control in Sound settings.',
          'ใช้เสียงเบา เล่นไฟล์เสียงในเครื่องที่รู้จัก หรือใช้ปุ่ม Test ของอุปกรณ์ใน Sound',
        ),
      ],
      [
        o('yes', 'Yes, I hear it', 'ได้ยินเสียง', 'app_fix', {
          app: 'likely',
          connection: 'unlikely',
        }),
        o('no', 'No sound there either', 'ไม่มีเสียงเช่นกัน', 'connection', { app: 'unlikely' }),
      ],
      'connection',
    ),
    fix(
      'app_fix',
      t('Review the app’s audio output', 'ตรวจอุปกรณ์ส่งเสียงของแอป'),
      'app',
      t('The device plays other audio successfully.', 'อุปกรณ์เล่นเสียงอื่นได้'),
      [
        t(
          'Check the app’s audio output and mute setting. In Windows volume mixer, check that app’s volume. Restart only the affected app after saving work.',
          'ตรวจอุปกรณ์ส่งเสียงและปิดเสียงในแอป ตรวจเสียงแอปใน Windows volume mixer บันทึกงานก่อนเริ่มเฉพาะแอปที่มีปัญหาใหม่',
        ),
      ],
      retry,
      'connection',
    ),
    q(
      'connection',
      t('Do another pair of headphones or speakers work?', 'หูฟังหรือลำโพงอื่นใช้ได้หรือไม่'),
      t(
        'A known working output helps isolate the original cable or device.',
        'อุปกรณ์ที่ใช้ได้ช่วยแยกปัญหาสายหรืออุปกรณ์เดิม',
      ),
      [
        t(
          'Check power and gently reseat the audio plug, or check Bluetooth connection. If available, select and test another compatible output at low volume.',
          'ตรวจไฟและเสียบแจ็คใหม่อย่างเบามือ หรือดูการเชื่อมต่อ Bluetooth หากมีอุปกรณ์อื่นที่รองรับ ให้เลือกและทดสอบด้วยเสียงเบา',
        ),
      ],
      [
        o('yes', 'Another output works', 'อุปกรณ์อื่นใช้ได้', 'connection_fix', {
          connection: 'likely',
        }),
        o('no', 'Neither output works', 'ใช้ไม่ได้ทั้งสอง', 'unresolved'),
      ],
    ),
    fix(
      'connection_fix',
      t('Use the working audio device', 'ใช้อุปกรณ์เสียงที่ทำงานได้'),
      'connection',
      t(
        'The alternate output works; the original connection or device needs attention.',
        'อุปกรณ์อื่นใช้ได้ การเชื่อมต่อหรืออุปกรณ์เดิมจึงควรได้รับการตรวจ',
      ),
      [
        t(
          'Use the working output for now. Check the original device’s official manual for its power, cable, and connection requirements; do not open it.',
          'ใช้อุปกรณ์ที่ทำงานได้ชั่วคราว ตรวจคู่มือผู้ผลิตของอุปกรณ์เดิมเกี่ยวกับไฟ สาย และการเชื่อมต่อ ไม่ต้องเปิดตัวอุปกรณ์',
        ),
      ],
      retry,
      'unresolved',
    ),
  ],
);
