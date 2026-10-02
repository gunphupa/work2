import {
  t,
  type Text,
  type Option,
  type Question,
  type Fix,
  type Flow,
  type Node,
  type CauseStatus,
} from '@/types/diagnostic';
import { catalog } from './catalog';
export const o = (
  id: string,
  en: string,
  th: string,
  next: string,
  effects: Record<string, CauseStatus> = {},
): Option => ({
  id,
  label: t(en, th),
  next,
  effects: Object.entries(effects).map(([cause, status]) => ({ cause, status })),
});
export const q = (
  id: string,
  title: Text,
  why: Text,
  guide: Text[],
  options: Option[],
  fallback = 'unresolved',
): Question => ({
  id,
  kind: 'question',
  title,
  why,
  guide,
  options: [
    ...options,
    o('unsure', 'I’m not sure', 'ไม่แน่ใจ', fallback),
    { ...o('other', 'Something else', 'อาการอื่น', fallback), detail: true },
  ],
});
export const fix = (
  id: string,
  title: Text,
  cause: string,
  why: Text,
  steps: Text[],
  verify: Text,
  onFailure: string,
  caution?: Text,
  undo = t(
    'Return any setting you changed to its previous value. Stop if you are unsure.',
    'เปลี่ยนค่าที่ปรับกลับเป็นค่าเดิม หากไม่แน่ใจให้หยุด',
  ),
): Fix => ({
  id,
  kind: 'fix',
  title,
  cause,
  why,
  steps,
  verify,
  onFailure,
  risk: caution ? 'caution' : 'safe',
  warning: caution,
  undo,
});
export function flow(id: string, start: string, causes: [string, Text][], nodes: Node[]): Flow {
  const meta = catalog.find((m) => m.id === id);
  if (!meta) throw new Error(`Unknown flow: ${id}`);
  return { ...meta, start, causes: causes.map(([id, title]) => ({ id, title })), nodes };
}
export const taskGuide = [
  t(
    'Press Ctrl + Shift + Esc to open Task Manager. Select More details if shown (Windows 10), then open Processes.',
    'กด Ctrl + Shift + Esc เพื่อเปิด Task Manager เลือก More details หากมี (Windows 10) แล้วเปิด Processes',
  ),
  t(
    'Watch the readings while the problem is happening. A brief spike is normal; look for activity that stays high for about a minute.',
    'ดูค่าขณะที่มีปัญหา ค่าสูงช่วงสั้น ๆ เป็นเรื่องปกติ ให้สังเกตค่าที่สูงต่อเนื่องประมาณหนึ่งนาที',
  ),
];
export const retry = t(
  'Repeat the activity that was failing. Has the original problem gone away?',
  'ลองทำสิ่งที่เคยมีปัญหาอีกครั้ง อาการเดิมหายไปหรือไม่',
);
export const saveWork = t(
  'Save open work before closing any app. Never end Windows, security, or unfamiliar system processes.',
  'บันทึกงานก่อนปิดแอป ห้ามหยุดกระบวนการ Windows โปรแกรมรักษาความปลอดภัย หรือกระบวนการระบบที่ไม่รู้จัก',
);
