import { t } from '@/types/diagnostic';
import { flow, q, o, fix, retry } from './builders';
export const boot = flow(
  'boot',
  'stage',
  [
    ['power', t('Power supply or charging', 'ไฟเลี้ยงหรือการชาร์จ')],
    ['peripheral', t('An external device affecting startup', 'อุปกรณ์ภายนอกกระทบการเริ่มเครื่อง')],
    ['windows', t('Windows startup or update issue', 'ปัญหาการเริ่มหรืออัปเดต Windows')],
    ['storage', t('Storage or recovery issue', 'ปัญหาที่จัดเก็บหรือการกู้คืน')],
  ],
  [
    q(
      'stage',
      t('Where does startup stop?', 'การเริ่มเครื่องหยุดตรงไหน'),
      t(
        'The last visible stage separates power, display, and Windows startup problems.',
        'ขั้นตอนสุดท้ายที่เห็นช่วยแยกไฟเลี้ยง จอภาพ และ Windows',
      ),
      [
        t(
          'Observe the screen and power light. Do not repeatedly force the computer off. If Windows is updating or encrypting, let it continue.',
          'สังเกตหน้าจอและไฟ ห้ามบังคับปิดซ้ำ หาก Windows อัปเดตหรือเข้ารหัสอยู่ให้ทำต่อ',
        ),
      ],
      [
        o('power', 'No lights or startup signs', 'ไม่มีไฟหรือสัญญาณเริ่มทำงาน', 'power', {
          power: 'possible',
        }),
        o(
          'logo',
          'Windows logo, spinning dots, or a recovery screen',
          'โลโก้ Windows จุดหมุน หรือหน้ากู้คืน',
          'update',
          { power: 'ruled_out', windows: 'possible' },
        ),
        o(
          'drive',
          'A missing drive message or BitLocker recovery',
          'แจ้งไม่พบไดรฟ์หรือกู้คืน BitLocker',
          'unresolved',
          { storage: 'possible' },
        ),
        o('black', 'Lights are on but the screen is black', 'มีไฟแต่จอดำ', 'unresolved'),
      ],
    ),
    q(
      'power',
      t('Is the correct power supply connected?', 'เชื่อมต่อแหล่งจ่ายไฟที่ถูกต้องหรือไม่'),
      t(
        'An unpowered computer cannot start Windows. We only check external connections.',
        'เครื่องไม่มีไฟเริ่ม Windows ไม่ได้ เราตรวจเฉพาะการเชื่อมต่อภายนอก',
      ),
      [
        t(
          'Check the wall outlet and original compatible power adapter. Do not open a power supply. Stop if you see damage, smoke, or battery swelling.',
          'ตรวจเต้ารับและอะแดปเตอร์เดิมที่รองรับ ห้ามเปิดแหล่งจ่ายไฟ หยุดหากเสียหาย มีควัน หรือแบตเตอรี่บวม',
        ),
      ],
      [
        o(
          'loose',
          'The supply was disconnected or switched off',
          'ไฟเลี้ยงไม่ได้เชื่อมต่อหรือสวิตช์ปิด',
          'power_fix',
          { power: 'likely' },
        ),
        o(
          'connected',
          'Correct power is already connected',
          'ไฟเลี้ยงที่ถูกต้องเชื่อมต่ออยู่แล้ว',
          'unresolved',
        ),
      ],
    ),
    fix(
      'power_fix',
      t('Restore the external power connection', 'เชื่อมต่อไฟภายนอกให้พร้อม'),
      'power',
      t(
        'The computer was not receiving its expected external power.',
        'เครื่องไม่ได้รับไฟภายนอกตามที่ควร',
      ),
      [
        t(
          'Seat the undamaged correct power cable and switch on the outlet if needed. For a laptop with an empty battery, allow charging according to its manual, then press power once.',
          'เสียบสายไฟที่ถูกต้องและไม่เสียหายให้แน่น เปิดสวิตช์เต้ารับหากจำเป็น หากแบตเตอรี่หมดให้ชาร์จตามคู่มือแล้วกดเปิดหนึ่งครั้ง',
        ),
      ],
      retry,
      'unresolved',
    ),
    q(
      'update',
      t('Is an update visibly making progress?', 'การอัปเดตมีความคืบหน้าที่มองเห็นหรือไม่'),
      t(
        'Interrupting a progressing update can damage the installation.',
        'ขัดจังหวะการอัปเดตที่กำลังคืบหน้าอาจทำให้การติดตั้งเสียหาย',
      ),
      [
        t(
          'Read the screen. Look for changing progress or a message asking you to keep the computer on. A spinning animation alone does not prove progress.',
          'อ่านข้อความ ดูความคืบหน้าที่เปลี่ยนหรือข้อความให้เปิดเครื่องไว้ ภาพหมุนอย่างเดียวไม่ยืนยันความคืบหน้า',
        ),
      ],
      [
        o('yes', 'The update is making progress', 'การอัปเดตคืบหน้า', 'wait_fix', {
          windows: 'likely',
        }),
        o('no', 'No active update is shown', 'ไม่แสดงการอัปเดตที่กำลังทำงาน', 'external'),
        o(
          'stuck',
          'An update appears stuck for a long time',
          'การอัปเดตดูค้างเป็นเวลานาน',
          'unresolved',
        ),
      ],
    ),
    fix(
      'wait_fix',
      t('Allow Windows to finish the update', 'รอ Windows อัปเดตจนเสร็จ'),
      'windows',
      t(
        'The screen reports an active update that is progressing.',
        'หน้าจอแสดงการอัปเดตที่กำลังคืบหน้า',
      ),
      [
        t(
          'Keep reliable power connected and follow the on-screen instructions. Do not force a shutdown. If progress stops for a prolonged period, contact Microsoft or the device manufacturer.',
          'ต่อไฟที่มั่นคงและทำตามหน้าจอ ห้ามบังคับปิด หากหยุดคืบหน้าเป็นเวลานาน ให้ติดต่อ Microsoft หรือผู้ผลิต',
        ),
      ],
      t(
        'After Windows finishes, can you reach the desktop normally?',
        'หลัง Windows ทำงานเสร็จ เข้าหน้าเดสก์ท็อปได้ตามปกติหรือไม่',
      ),
      'unresolved',
    ),
    q(
      'external',
      t(
        'Was a new external device connected before this?',
        'ต่ออุปกรณ์ภายนอกใหม่ก่อนเกิดปัญหาหรือไม่',
      ),
      t(
        'An external storage device or peripheral can sometimes interfere with startup.',
        'อุปกรณ์จัดเก็บภายนอกหรืออุปกรณ์ต่อพ่วงอาจรบกวนการเริ่มเครื่อง',
      ),
      [
        t(
          'Think about USB drives, docks, or other peripherals connected shortly before the problem. Do not disconnect an active storage operation.',
          'นึกถึงไดรฟ์ USB ด็อก หรืออุปกรณ์ที่ต่อก่อนเกิดปัญหา ห้ามถอดระหว่างทำงานกับข้อมูล',
        ),
      ],
      [
        o(
          'yes',
          'Yes, a nonessential device was added',
          'เพิ่มอุปกรณ์ที่ไม่จำเป็นไว้',
          'external_fix',
          { peripheral: 'possible' },
        ),
        o('no', 'No new external devices', 'ไม่มีอุปกรณ์ภายนอกใหม่', 'unresolved', {
          peripheral: 'unlikely',
        }),
      ],
    ),
    fix(
      'external_fix',
      t('Try startup without the added peripheral', 'ลองเริ่มเครื่องโดยไม่ต่ออุปกรณ์ที่เพิ่ม'),
      'peripheral',
      t(
        'The problem began after an external device was added. This is a testable possibility, not a confirmed cause.',
        'เริ่มมีปัญหาหลังเพิ่มอุปกรณ์ภายนอก เป็นความเป็นไปได้ที่ทดสอบได้ ยังไม่ใช่สาเหตุยืนยัน',
      ),
      [
        t(
          'Only proceed if no update, encryption, or storage operation is active and you can shut down using an on-screen power menu. If you cannot, skip this step.',
          'ทำได้เมื่อไม่มีการอัปเดต เข้ารหัส หรือทำงานกับข้อมูล และปิดเครื่องผ่านเมนูบนหน้าจอได้ หากไม่ได้ให้ข้าม',
        ),
        t(
          'Shut down normally, disconnect only the newly added nonessential peripheral, then start once. Keep keyboard, mouse, display, and necessary power attached.',
          'ปิดตามปกติ ถอดเฉพาะอุปกรณ์ใหม่ที่ไม่จำเป็น แล้วเปิดหนึ่งครั้ง คงแป้นพิมพ์ เมาส์ จอ และไฟที่จำเป็นไว้',
        ),
      ],
      retry,
      'unresolved',
      t(
        'Shutting down can lose unsaved work. Do not force power off, change BIOS settings, or remove internal components.',
        'การปิดเครื่องอาจสูญเสียงานที่ไม่บันทึก ห้ามบังคับปิด เปลี่ยน BIOS หรือถอดชิ้นส่วนภายใน',
      ),
    ),
  ],
);
export const driver = flow(
  'driver',
  'change',
  [
    ['driver', t('A recent driver change', 'การเปลี่ยนไดรเวอร์ล่าสุด')],
    ['disabled', t('A disabled device', 'อุปกรณ์ถูกปิดใช้งาน')],
    ['connection', t('Connection or device hardware', 'การเชื่อมต่อหรือฮาร์ดแวร์อุปกรณ์')],
  ],
  [
    q(
      'change',
      t(
        'Did it stop working right after a driver update?',
        'หยุดทำงานทันทีหลังอัปเดตไดรเวอร์หรือไม่',
      ),
      t(
        'The timing helps decide whether a supported rollback is worth considering.',
        'ช่วงเวลาช่วยตัดสินใจว่าควรพิจารณาย้อนกลับไดรเวอร์หรือไม่',
      ),
      [
        t(
          'Think about the last time it worked and any driver installer or Windows update you used. A recent update alone does not prove causation.',
          'นึกถึงครั้งสุดท้ายที่ใช้ได้และตัวติดตั้งไดรเวอร์หรือ Windows Update ที่ใช้ การอัปเดตล่าสุดอย่างเดียวไม่ได้พิสูจน์สาเหตุ',
        ),
      ],
      [
        o(
          'yes',
          'Yes, immediately after a driver update',
          'ใช่ ทันทีหลังอัปเดตไดรเวอร์',
          'rollback_available',
          { driver: 'possible' },
        ),
        o('no', 'No clear link to an update', 'ไม่เชื่อมโยงกับอัปเดตชัดเจน', 'manager'),
      ],
      'manager',
    ),
    q(
      'rollback_available',
      t(
        'Is Roll Back Driver available for that device?',
        'อุปกรณ์นั้นมีปุ่ม Roll Back Driver ที่ใช้ได้หรือไม่',
      ),
      t(
        'Windows can sometimes restore the previously installed driver without downloading an unknown package.',
        'บางครั้ง Windows คืนไดรเวอร์เดิมได้โดยไม่ต้องดาวน์โหลดแพ็กเกจที่ไม่รู้จัก',
      ),
      [
        t(
          'Right-click Start → Device Manager. Open the affected device’s Properties → Driver. Read the Roll Back Driver button state only; do not click yet.',
          'คลิกขวา Start → Device Manager เปิด Properties → Driver ของอุปกรณ์ที่มีปัญหา ดูว่าปุ่ม Roll Back Driver ใช้ได้หรือไม่ ยังไม่ต้องกด',
        ),
      ],
      [
        o(
          'yes',
          'Available, and this is the affected device',
          'ใช้ได้และเป็นอุปกรณ์ที่มีปัญหา',
          'rollback_fix',
          { driver: 'likely' },
        ),
        o(
          'no',
          'Unavailable or not the correct device',
          'ใช้ไม่ได้หรือไม่ใช่อุปกรณ์ที่ถูกต้อง',
          'manager',
        ),
      ],
      'manager',
    ),
    fix(
      'rollback_fix',
      t('Consider the previous device driver', 'พิจารณาไดรเวอร์อุปกรณ์รุ่นก่อน'),
      'driver',
      t(
        'The failure followed an update and Windows offers the previous driver. This is a plausible explanation.',
        'ปัญหาเกิดหลังอัปเดตและ Windows มีไดรเวอร์ก่อนหน้า เป็นคำอธิบายที่เป็นไปได้',
      ),
      [
        t(
          'Save work. If this is a storage, security, or system device, or a managed school/work computer, skip and contact its administrator.',
          'บันทึกงาน หากเป็นอุปกรณ์จัดเก็บ ความปลอดภัย ระบบ หรือเครื่องที่โรงเรียนหรือที่ทำงานดูแล ให้ข้ามและติดต่อผู้ดูแล',
        ),
        t(
          'For a noncritical peripheral you understand, use Roll Back Driver and follow Windows prompts. Restart only if requested and after saving work. Do not force a rollback if it is unavailable.',
          'สำหรับอุปกรณ์ต่อพ่วงที่ไม่สำคัญต่อระบบและเข้าใจ ให้ใช้ Roll Back Driver และทำตาม Windows เริ่มใหม่เฉพาะเมื่อร้องขอหลังบันทึกงาน ห้ามฝืนย้อนกลับหากไม่มีตัวเลือก',
        ),
      ],
      retry,
      'manager',
      t(
        'Changing drivers can interrupt the device and require administrator access or a restart. Only proceed if you understand which device is affected.',
        'เปลี่ยนไดรเวอร์อาจทำให้อุปกรณ์หยุด ต้องใช้สิทธิ์ผู้ดูแลหรือเริ่มใหม่ ทำต่อเมื่อเข้าใจว่าอุปกรณ์ใดได้รับผล',
      ),
      t(
        'If it becomes worse, stop. Ask the device manufacturer or administrator to restore its supported driver; do not install random driver tools.',
        'หากแย่ลงให้หยุด ขอผู้ผลิตหรือผู้ดูแลคืนไดรเวอร์ที่รองรับ ห้ามติดตั้งเครื่องมือไดรเวอร์ที่ไม่รู้จัก',
      ),
    ),
    q(
      'manager',
      t('What status does Device Manager report?', 'Device Manager รายงานสถานะใด'),
      t(
        'The exact status is more useful than guessing which driver to install.',
        'สถานะที่แน่นอนมีประโยชน์กว่าการเดาว่าต้องลงไดรเวอร์ใด',
      ),
      [
        t(
          'Open the affected device’s Properties → General. Read Device status. If there is a code, record it as additional context below.',
          'เปิด Properties → General ของอุปกรณ์ อ่าน Device status หากมีรหัสให้บันทึกเป็นข้อมูลเพิ่มเติมด้านล่าง',
        ),
      ],
      [
        o('disabled', 'Disabled (Code 22)', 'ถูกปิดใช้งาน (Code 22)', 'enable_fix', {
          disabled: 'likely',
        }),
        o('warning', 'Another warning or error code', 'คำเตือนหรือรหัสผิดพลาดอื่น', 'unresolved', {
          driver: 'possible',
        }),
        o('normal', 'Working properly, or not listed', 'ทำงานปกติหรือไม่มีในรายการ', 'connection'),
      ],
      'connection',
    ),
    fix(
      'enable_fix',
      t('Enable the known peripheral', 'เปิดใช้งานอุปกรณ์ต่อพ่วงที่รู้จัก'),
      'disabled',
      t(
        'Windows explicitly reports that this device is disabled.',
        'Windows รายงานชัดเจนว่าอุปกรณ์ถูกปิดใช้งาน',
      ),
      [
        t(
          'For your own noncritical peripheral, use Enable device in Device Manager. If it is managed by a school/workplace or was disabled for a reason you do not know, skip and ask the administrator.',
          'สำหรับอุปกรณ์ต่อพ่วงส่วนตัวที่ไม่สำคัญต่อระบบ ใช้ Enable device ใน Device Manager หากองค์กรดูแลหรือไม่ทราบเหตุผลที่ปิดไว้ ให้ข้ามและถามผู้ดูแล',
        ),
      ],
      retry,
      'connection',
      t(
        'Enabling a device changes system configuration and may require administrator access. Do not change a managed or unfamiliar device.',
        'เปิดอุปกรณ์เป็นการเปลี่ยนค่าระบบและอาจต้องใช้สิทธิ์ผู้ดูแล ห้ามเปลี่ยนอุปกรณ์ที่องค์กรดูแลหรือไม่รู้จัก',
      ),
    ),
    q(
      'connection',
      t('Is the physical connection secure?', 'การเชื่อมต่อทางกายภาพแน่นหรือไม่'),
      t(
        'A device can stop working for connection reasons even after a software change.',
        'อุปกรณ์อาจหยุดจากการเชื่อมต่อแม้เกิดหลังเปลี่ยนซอฟต์แวร์',
      ),
      [
        t(
          'Check external power and connectors without opening the computer. Do not unplug storage while it is active. Check the device’s official manual for supported connections.',
          'ตรวจไฟและขั้วต่อภายนอกโดยไม่เปิดเครื่อง ห้ามถอดที่จัดเก็บขณะใช้งาน ตรวจการเชื่อมต่อที่รองรับในคู่มือผู้ผลิต',
        ),
      ],
      [
        o(
          'loose',
          'A loose external connection was found',
          'พบการเชื่อมต่อภายนอกหลวม',
          'connection_fix',
          { connection: 'likely' },
        ),
        o('secure', 'Everything is securely connected', 'ทุกอย่างแน่นดี', 'unresolved'),
      ],
    ),
    fix(
      'connection_fix',
      t('Restore the external connection', 'เชื่อมต่อภายนอกให้แน่น'),
      'connection',
      t('An insecure connection was observed directly.', 'พบการเชื่อมต่อที่ไม่แน่นโดยตรง'),
      [
        t(
          'Reconnect the supported external connector safely, following the device’s manual. Never force a plug or reconnect damaged hardware.',
          'เสียบขั้วต่อภายนอกที่รองรับอย่างปลอดภัยตามคู่มือ ห้ามฝืนหรือเชื่อมฮาร์ดแวร์ที่เสียหาย',
        ),
      ],
      retry,
      'unresolved',
    ),
  ],
);
