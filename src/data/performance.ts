import { t, type Node } from '@/types/diagnostic';
import { flow, q, o, fix, taskGuide, retry, saveWork } from './builders';
const causes: [string, ReturnType<typeof t>][] = [
  ['cpu', t('Sustained processor load', 'หน่วยประมวลผลทำงานหนักต่อเนื่อง')],
  ['memory', t('Memory pressure', 'หน่วยความจำไม่เพียงพอ')],
  ['disk', t('Sustained disk activity', 'ดิสก์ทำงานหนักต่อเนื่อง')],
  ['space', t('Low free storage', 'พื้นที่จัดเก็บเหลือน้อย')],
  ['app', t('A particular application', 'ปัญหาเฉพาะแอป')],
];
function resourceNodes(): Node[] {
  return [
    q(
      'cpu_read',
      t('Check processor activity', 'ตรวจการทำงานของ CPU'),
      t(
        'A sustained high reading can explain delays. It does not identify a faulty processor.',
        'ค่าสูงต่อเนื่องอาจอธิบายอาการช้า แต่ไม่ได้แปลว่า CPU เสีย',
      ),
      taskGuide,
      [
        o('high', 'CPU stays above 90%', 'CPU สูงกว่า 90% ต่อเนื่อง', 'cpu_process', {
          cpu: 'likely',
        }),
        o('medium', 'CPU is 50–90%', 'CPU อยู่ที่ 50–90%', 'cpu_process', { cpu: 'possible' }),
        o('low', 'CPU stays below 50%', 'CPU ต่ำกว่า 50% ต่อเนื่อง', 'memory_read', {
          cpu: 'unlikely',
        }),
      ],
      'memory_read',
    ),
    q(
      'cpu_process',
      t('Which app is using the processor?', 'แอปใดใช้ CPU มาก'),
      t(
        'Identifying the busy app lets us reduce workload without changing system files.',
        'การหาแอปที่ทำงานหนักช่วยลดภาระโดยไม่เปลี่ยนไฟล์ระบบ',
      ),
      [
        ...taskGuide,
        t(
          'Select the CPU column to sort highest first. Read the top process name.',
          'เลือกหัวคอลัมน์ CPU เพื่อเรียงจากมากไปน้อย แล้วดูชื่อกระบวนการด้านบน',
        ),
      ],
      [
        o('known', 'An app I recognize', 'แอปที่รู้จัก', 'cpu_fix', { cpu: 'likely' }),
        o(
          'update',
          'Windows Update or an installer',
          'Windows Update หรือตัวติดตั้ง',
          'update_test',
        ),
        o(
          'system',
          'System, security software, or an unfamiliar process',
          'ระบบ โปรแกรมความปลอดภัย หรือชื่อที่ไม่รู้จัก',
          'memory_read',
        ),
      ],
      'memory_read',
    ),
    fix(
      'cpu_fix',
      t('Reduce the busy app’s workload', 'ลดภาระของแอปที่ทำงานหนัก'),
      'cpu',
      t(
        'Your observation points to a busy app. Test that explanation by closing only that app normally.',
        'ผลที่พบชี้ไปที่แอปที่ทำงานหนัก ทดสอบโดยปิดเฉพาะแอปนั้นตามปกติ',
      ),
      [
        saveWork,
        t(
          'Close the app from its own menu. Reopen it with fewer tabs, documents, or background tasks.',
          'ปิดแอปจากเมนูของแอป แล้วเปิดใหม่โดยลดแท็บ เอกสาร หรืองานเบื้องหลัง',
        ),
      ],
      retry,
      'memory_read',
    ),
    q(
      'update_test',
      t('Is an update still making progress?', 'การอัปเดตยังคืบหน้าหรือไม่'),
      t(
        'Installation activity can be temporary. Interrupting it can create a different problem.',
        'การติดตั้งอาจใช้ทรัพยากรชั่วคราว การขัดจังหวะอาจสร้างปัญหาใหม่',
      ),
      [
        t(
          'Open Settings → Windows Update (Windows 10: Update & Security → Windows Update). Check the displayed status without cancelling it.',
          'เปิด Settings → Windows Update (Windows 10: Update & Security → Windows Update) ดูสถานะโดยไม่ยกเลิก',
        ),
      ],
      [
        o('yes', 'Yes, an update is progressing', 'ใช่ การอัปเดตกำลังคืบหน้า', 'update_fix', {
          cpu: 'likely',
          disk: 'possible',
        }),
        o(
          'no',
          'No update is running, or it appears stuck',
          'ไม่มีการอัปเดตหรือดูเหมือนค้าง',
          'memory_read',
        ),
      ],
      'memory_read',
    ),
    fix(
      'update_fix',
      t('Let the update finish', 'รอให้การอัปเดตเสร็จ'),
      'cpu',
      t(
        'The active update is a plausible temporary source of workload.',
        'การอัปเดตที่กำลังทำงานอาจทำให้เครื่องช้าชั่วคราว',
      ),
      [
        t(
          'Keep the computer connected to power and let the update complete. Avoid starting more demanding tasks.',
          'เสียบไฟและรอให้การอัปเดตเสร็จ หลีกเลี่ยงงานที่ใช้ทรัพยากรมาก',
        ),
        t(
          'If Windows requests a restart, save your work first and use its Restart option. If it stays stuck, stop here and seek official support.',
          'หาก Windows ขอให้เริ่มใหม่ ให้บันทึกงานก่อนแล้วเลือก Restart หากค้างต่อเนื่อง ให้หยุดและขอความช่วยเหลือจากผู้ผลิต',
        ),
      ],
      retry,
      'memory_read',
    ),
    {
      ...q(
        'memory_read',
        t('Check memory usage', 'ตรวจการใช้หน่วยความจำ'),
        t(
          'High memory use can force Windows to move data to slower storage. A percentage alone cannot prove you need more RAM.',
          'การใช้หน่วยความจำสูงอาจทำให้ Windows ย้ายข้อมูลไปดิสก์ที่ช้ากว่า เปอร์เซ็นต์เพียงอย่างเดียวไม่ได้พิสูจน์ว่าต้องเพิ่ม RAM',
        ),
        taskGuide,
        [
          o('low', 'Below 85%', 'ต่ำกว่า 85%', 'disk_read', { memory: 'unlikely' }),
          o('high', '85% or higher', '85% ขึ้นไป', 'memory_process', { memory: 'likely' }),
        ],
        'disk_read',
      ),
      input: 'range',
      min: 0,
      max: 100,
      unit: '%',
      ranges: [
        { max: 84.99, option: 'low' },
        { max: 100, option: 'high' },
      ],
    },
    q(
      'memory_process',
      t('What is using the most memory?', 'อะไรใช้หน่วยความจำมากที่สุด'),
      t(
        'Closing a known app is a reversible way to test memory pressure.',
        'การปิดแอปที่รู้จักเป็นวิธีทดสอบภาระหน่วยความจำที่ย้อนกลับได้',
      ),
      [
        ...taskGuide,
        t(
          'Sort the Memory column highest first. Look for a familiar app with many tabs or large documents.',
          'เรียงคอลัมน์ Memory จากมากไปน้อย มองหาแอปที่มีหลายแท็บหรือเอกสารขนาดใหญ่',
        ),
      ],
      [
        o(
          'known',
          'A familiar app or many browser tabs',
          'แอปที่รู้จักหรือแท็บเบราว์เซอร์จำนวนมาก',
          'memory_fix',
          { memory: 'likely' },
        ),
        o('unknown', 'Nothing I can safely close', 'ไม่มีสิ่งที่ปิดได้อย่างปลอดภัย', 'disk_read'),
      ],
      'disk_read',
    ),
    fix(
      'memory_fix',
      t('Free up working memory', 'คืนหน่วยความจำที่ใช้งานอยู่'),
      'memory',
      t(
        'A known app is using substantial memory during the slowdown.',
        'แอปที่รู้จักใช้หน่วยความจำมากขณะที่เครื่องช้า',
      ),
      [
        saveWork,
        t(
          'Close unneeded tabs and apps normally. Repeat the same task with fewer apps open. Avoid “RAM cleaner” utilities.',
          'ปิดแท็บและแอปที่ไม่จำเป็นตามปกติ ลองงานเดิมโดยเปิดแอปน้อยลง หลีกเลี่ยงโปรแกรม “ล้าง RAM”',
        ),
      ],
      retry,
      'disk_read',
    ),
    q(
      'disk_read',
      t('Check disk activity', 'ตรวจการทำงานของดิสก์'),
      t(
        'Sustained disk activity can delay apps even when CPU and memory are available.',
        'ดิสก์ที่ทำงานหนักต่อเนื่องอาจทำให้แอปช้าแม้ CPU และหน่วยความจำยังว่าง',
      ),
      taskGuide,
      [
        o('high', 'Disk stays near 100%', 'Disk ใกล้ 100% ต่อเนื่อง', 'disk_process', {
          disk: 'likely',
        }),
        o('low', 'Disk is not consistently high', 'Disk ไม่ได้สูงต่อเนื่อง', 'space', {
          disk: 'unlikely',
        }),
      ],
      'space',
    ),
    q(
      'disk_process',
      t('What is keeping the disk busy?', 'อะไรทำให้ดิสก์ทำงานหนัก'),
      t(
        'We can test a known transfer without disabling essential Windows services.',
        'ทดสอบงานถ่ายโอนที่รู้จักได้โดยไม่ปิดบริการสำคัญของ Windows',
      ),
      [
        ...taskGuide,
        t(
          'Sort by Disk. Check whether a familiar backup, download, or file transfer is active.',
          'เรียงตาม Disk ดูว่ามีการสำรอง ดาวน์โหลด หรือคัดลอกไฟล์ที่รู้จักอยู่หรือไม่',
        ),
      ],
      [
        o(
          'transfer',
          'A download, backup, or file transfer',
          'การดาวน์โหลด สำรอง หรือคัดลอกไฟล์',
          'disk_fix',
          { disk: 'likely' },
        ),
        o('system', 'Windows or something unfamiliar', 'Windows หรือสิ่งที่ไม่รู้จัก', 'space'),
      ],
      'space',
    ),
    fix(
      'disk_fix',
      t('Pause the competing transfer', 'พักการถ่ายโอนที่แย่งทรัพยากร'),
      'disk',
      t(
        'The transfer may be competing with your active work for disk access.',
        'การถ่ายโอนอาจแย่งใช้ดิสก์กับงานที่กำลังทำ',
      ),
      [
        t(
          'Use the transfer app’s Pause button if available. Do not interrupt a Windows update, encryption, or firmware operation.',
          'ใช้ปุ่ม Pause ในแอปหากมี ห้ามขัดจังหวะการอัปเดต Windows การเข้ารหัส หรือเฟิร์มแวร์',
        ),
        t(
          'If it cannot be paused safely, let it complete before testing again.',
          'หากพักอย่างปลอดภัยไม่ได้ ให้รอจนเสร็จแล้วทดสอบใหม่',
        ),
      ],
      retry,
      'space',
      undefined,
      t('Resume the paused transfer from the same app.', 'กลับไปดำเนินการถ่ายโอนต่อจากแอปเดิม'),
    ),
    q(
      'space',
      t('Is your Windows drive nearly full?', 'ไดรฟ์ Windows ใกล้เต็มหรือไม่'),
      t(
        'Windows needs free storage for temporary files. Low free space is only one possible contributor.',
        'Windows ต้องใช้พื้นที่ว่างสำหรับไฟล์ชั่วคราว พื้นที่น้อยเป็นเพียงสาเหตุหนึ่งที่เป็นไปได้',
      ),
      [
        t(
          'Open File Explorer → This PC. Look at the free space on the Windows drive, usually C:. Do not delete anything yet.',
          'เปิด File Explorer → This PC ดูพื้นที่ว่างของไดรฟ์ Windows ซึ่งมักเป็น C: ยังไม่ต้องลบอะไร',
        ),
      ],
      [
        o('low', 'Less than about 10% is free', 'เหลือว่างน้อยกว่าประมาณ 10%', 'space_fix', {
          space: 'likely',
        }),
        o('enough', 'More free space is available', 'มีพื้นที่ว่างมากกว่านั้น', 'unresolved', {
          space: 'unlikely',
        }),
      ],
    ),
    fix(
      'space_fix',
      t('Review storage with Windows', 'ตรวจพื้นที่จัดเก็บด้วย Windows'),
      'space',
      t(
        'Your drive is nearly full. Review what is using space before removing anything.',
        'ไดรฟ์ใกล้เต็ม ให้ตรวจสิ่งที่ใช้พื้นที่ก่อนลบ',
      ),
      [
        t(
          'Open Settings → System → Storage. Review the categories first.',
          'เปิด Settings → System → Storage ตรวจหมวดหมู่ก่อน',
        ),
        t(
          'Move only files you recognize to a trusted backup drive and verify the copy. Remove originals only after you are certain the backup works. Skip this step if unsure; do not select Downloads or previous Windows installations blindly.',
          'ย้ายเฉพาะไฟล์ที่รู้จักไปยังไดรฟ์สำรองที่เชื่อถือได้และตรวจสำเนา ลบต้นฉบับเมื่อมั่นใจว่าสำรองแล้ว หากไม่แน่ใจให้ข้าม ห้ามเลือก Downloads หรือ Windows รุ่นก่อนโดยไม่ตรวจสอบ',
        ),
      ],
      retry,
      'unresolved',
      t(
        'Removing files can cause data loss. Keep a verified backup and do not remove unfamiliar or system files.',
        'การลบไฟล์อาจทำให้ข้อมูลสูญหาย ต้องมีสำเนาที่ตรวจสอบแล้ว และห้ามลบไฟล์ระบบหรือไฟล์ที่ไม่รู้จัก',
      ),
    ),
  ];
}
const base = resourceNodes();
export const performanceFlows = [
  flow('slow', 'cpu_read', causes, base),
  flow('cpu', 'cpu_read', causes, resourceNodes()),
  flow(
    'memory',
    'memory_read',
    causes.filter(([id]) => ['memory', 'disk', 'space'].includes(id)),
    resourceNodes().filter((n) =>
      [
        'memory_read',
        'memory_process',
        'memory_fix',
        'disk_read',
        'disk_process',
        'disk_fix',
        'space',
        'space_fix',
      ].includes(n.id),
    ),
  ),
  flow(
    'disk',
    'disk_read',
    causes.filter(([id]) => ['disk', 'space'].includes(id)),
    resourceNodes().filter((n) =>
      ['disk_read', 'disk_process', 'disk_fix', 'space', 'space_fix'].includes(n.id),
    ),
  ),
  flow(
    'freeze',
    'scope',
    [...causes, ['thermal', t('Heat or hardware instability', 'ความร้อนหรือฮาร์ดแวร์ไม่เสถียร')]],
    [
      q(
        'scope',
        t('What stops responding?', 'สิ่งใดหยุดตอบสนอง'),
        t(
          'A single frozen app and an unresponsive system need different checks.',
          'แอปเดียวค้างกับทั้งระบบค้างต้องตรวจต่างกัน',
        ),
        [
          t(
            'While the issue occurs, try switching to another app or opening Task Manager with Ctrl + Shift + Esc.',
            'ขณะเกิดปัญหา ลองสลับไปแอปอื่นหรือเปิด Task Manager ด้วย Ctrl + Shift + Esc',
          ),
        ],
        [
          o(
            'app',
            'Only one app; Windows still responds',
            'แอปเดียว Windows ยังตอบสนอง',
            'app_fix',
            { app: 'likely' },
          ),
          o('system', 'The whole computer freezes', 'ค้างทั้งเครื่อง', 'heat_check', {
            app: 'unlikely',
          }),
        ],
        'heat_check',
      ),
      fix(
        'app_fix',
        t('Restart the affected app safely', 'เริ่มแอปที่มีปัญหาใหม่อย่างปลอดภัย'),
        'app',
        t(
          'Other apps still respond, which points toward the affected app.',
          'แอปอื่นยังตอบสนอง จึงชี้ไปที่แอปที่มีปัญหา',
        ),
        [
          saveWork,
          t(
            'Close the affected app normally if possible. If it will not close and unsaved work matters, stop and seek help rather than forcing it. Reopen and test a smaller document or workload.',
            'ปิดแอปตามปกติหากทำได้ หากปิดไม่ได้และมีงานสำคัญที่ยังไม่บันทึก ให้ขอความช่วยเหลือแทนการบังคับปิด เปิดใหม่และทดสอบงานขนาดเล็กลง',
          ),
        ],
        retry,
        'cpu_read',
      ),
      q(
        'heat_check',
        t('Are there signs of unsafe heat?', 'มีสัญญาณความร้อนที่ไม่ปลอดภัยหรือไม่'),
        t(
          'A burning smell, swollen battery, or repeated thermal shutdown needs professional inspection.',
          'กลิ่นไหม้ แบตเตอรี่บวม หรือเครื่องดับเพราะความร้อนซ้ำ ต้องให้ผู้เชี่ยวชาญตรวจ',
        ),
        [
          t(
            'Do not open the computer. Check for a burning smell, visible battery swelling, or repeated unexpected shutdowns.',
            'ไม่ต้องเปิดตัวเครื่อง สังเกตกลิ่นไหม้ แบตเตอรี่บวมที่มองเห็น หรือการดับเองซ้ำ',
          ),
        ],
        [
          o(
            'danger',
            'Burning smell, swelling, or repeated shutdowns',
            'มีกลิ่นไหม้ บวม หรือดับเองซ้ำ',
            'safety_stop',
            { thermal: 'likely' },
          ),
          o('normal', 'None of these signs', 'ไม่มีอาการเหล่านี้', 'cpu_read'),
        ],
      ),
      ...resourceNodes(),
    ],
  ),
];
