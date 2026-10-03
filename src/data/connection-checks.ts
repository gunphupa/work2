import { t, type Node } from '@/types/diagnostic';
import { q, o, fix, retry } from './builders';
export function connectionChecks(cause: string): Node[] {
  return [
    q(
      'connection_kind',
      t('How is this computer connected?', 'คอมพิวเตอร์เชื่อมต่ออย่างไร'),
      t(
        'Wireless and wired connections need different checks.',
        'การเชื่อมต่อไร้สายและแบบสายต้องตรวจต่างกัน',
      ),
      [
        t(
          'Look at Settings → Network & internet. Check whether the active connection is Wi-Fi or Ethernet. Do not disconnect it yet.',
          'ดู Settings → Network & internet ว่าใช้ Wi-Fi หรือ Ethernet ยังไม่ต้องตัดการเชื่อมต่อ',
        ),
      ],
      [
        o('wifi', 'Wi-Fi', 'Wi-Fi', 'wifi_compare'),
        o('ethernet', 'Ethernet cable', 'สาย Ethernet', 'router_check'),
      ],
      'router_check',
    ),
    q(
      'wifi_compare',
      t(
        'Does a closer Wi-Fi location improve this task?',
        'เข้าใกล้ Wi-Fi แล้วงานนี้ดีขึ้นหรือไม่',
      ),
      t(
        'This compares the wireless path without resetting the router.',
        'ช่วยเปรียบเทียบเส้นทางไร้สายโดยไม่รีเซ็ตเราเตอร์',
      ),
      [
        t(
          'If practical, move the laptop nearer the router and compare the same task. If you already tried this and it did not help, choose “No improvement” without repeating it.',
          'หากทำได้ ย้ายโน้ตบุ๊กใกล้เราเตอร์แล้วเทียบงานเดิม หากลองแล้วไม่ช่วยให้เลือก “ไม่ดีขึ้น” โดยไม่ต้องลองซ้ำ',
        ),
      ],
      [
        o('yes', 'It improves nearby', 'ใกล้แล้วดีขึ้น', 'wifi_location_fix', {
          [cause]: 'possible',
        }),
        o('no', 'No improvement', 'ไม่ดีขึ้น', 'router_check'),
      ],
      'router_check',
    ),
    {
      ...fix(
        'wifi_location_fix',
        t('Use the better wireless location', 'ใช้จุดที่สัญญาณไร้สายดีกว่า'),
        cause,
        t(
          'The same task improved when the wireless path changed.',
          'งานเดิมดีขึ้นเมื่อเปลี่ยนเส้นทางสัญญาณไร้สาย',
        ),
        [
          t(
            'Keep using the tested location with fewer obstacles. Repeat the original task for a few minutes. Do not change shared router settings.',
            'ใช้ตำแหน่งที่ทดสอบแล้วและมีสิ่งกีดขวางน้อยลง ลองงานเดิมสักครู่ ไม่ต้องเปลี่ยนค่าเราเตอร์ส่วนรวม',
          ),
        ],
        retry,
        'router_check',
      ),
      confidenceOnSuccess: 'likely',
    },
    q(
      'router_check',
      t(
        'Do the router’s lights or external cables look abnormal?',
        'ไฟหรือสายภายนอกของเราเตอร์ผิดปกติหรือไม่',
      ),
      t(
        'An upstream connection problem can affect all devices using the router.',
        'ปัญหาการเชื่อมต่อขาเข้าอาจกระทบทุกเครื่องที่ใช้เราเตอร์',
      ),
      [
        t(
          'Compare Power and Internet/WAN lights with the router/modem manual. Visually check external Ethernet plugs. Do not open equipment, press Reset, disconnect shared cables, or touch fiber connectors. Ask the network owner if you cannot access it.',
          'เทียบไฟ Power และ Internet/WAN กับคู่มือเราเตอร์หรือโมเด็ม ดูขั้วสาย Ethernet ภายนอก ห้ามเปิดอุปกรณ์ กด Reset ถอดสายส่วนรวม หรือแตะขั้วไฟเบอร์ หากเข้าถึงไม่ได้ให้ถามเจ้าของเครือข่าย',
        ),
      ],
      [
        o(
          'abnormal',
          'A cable looks loose or a service light is abnormal',
          'สายดูหลวมหรือไฟบริการผิดปกติ',
          'provider_status',
          { [cause]: 'possible' },
        ),
        o('normal', 'Nothing looks abnormal', 'ไม่เห็นสิ่งผิดปกติ', 'provider_status'),
      ],
      'provider_status',
    ),
    q(
      'provider_status',
      t(
        'Does your internet provider report a local incident?',
        'ผู้ให้บริการเน็ตแจ้งเหตุขัดข้องในพื้นที่หรือไม่',
      ),
      t(
        'A provider incident needs a different response from a Windows setting problem.',
        'เหตุขัดข้องของผู้ให้บริการต้องรับมือต่างจากปัญหาค่า Windows',
      ),
      [
        t(
          'Check your provider’s official app or service-status page for your area, or ask the school/work network administrator. No published incident does not guarantee that the service is healthy.',
          'ตรวจแอปหรือหน้าสถานะทางการของผู้ให้บริการสำหรับพื้นที่คุณ หรือถามผู้ดูแลเครือข่ายโรงเรียนหรือที่ทำงาน ไม่มีประกาศไม่ได้รับรองว่าบริการปกติ',
        ),
      ],
      [
        o(
          'outage',
          'An incident is reported for my service',
          'มีประกาศเหตุขัดข้องของบริการที่ใช้',
          'unresolved',
          { [cause]: 'likely' },
        ),
        o('none', 'No relevant incident is listed', 'ไม่พบประกาศที่เกี่ยวข้อง', 'unresolved'),
      ],
    ),
  ];
}
