'use client';
import { useState } from 'react';
import { t, type Flow, type Session, type FixResult } from '@/types/diagnostic';
import { recommendations } from '@/engine/recommendations';
import { followupPayload } from '@/lib/followup-request';
import { results } from '@/engine/diagnostic';
import { useApp } from './providers';
export function Recommendations({
  flow,
  session,
  onResult,
}: {
  flow: Flow;
  session: Session;
  onResult: (id: string, result: FixResult) => void;
}) {
  const { tx } = useApp();
  const candidates = recommendations(flow, session);
  const [order, setOrder] = useState<string[]>([]);
  const [detail, setDetail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ai' | 'rules' | 'unavailable'>('idle');
  const [selected, setSelected] = useState<Record<string, FixResult | ''>>({});
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (!order.length) return 0;
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
  async function review() {
    if (status === 'busy') return;
    setStatus('busy');
    try {
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify(followupPayload(session, detail)),
      });
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (
        !Array.isArray(body.ids) ||
        body.ids.length !== candidates.length ||
        new Set(body.ids).size !== candidates.length ||
        body.ids.some((id: string) => !candidates.some((c) => c.id === id)) ||
        !['ai', 'rules', 'unavailable'].includes(body.source)
      )
        throw new Error();
      setOrder(body.ids);
      setStatus(body.source);
    } catch {
      setStatus('unavailable');
    }
  }
  return (
    <section
      className="next-checks"
      aria-label={tx(t('Recommended next checks', 'การตรวจต่อที่แนะนำ'))}
    >
      <h2>{tx(t('What I recommend trying next', 'สิ่งที่แนะนำให้ลองต่อ'))}</h2>
      <p>
        {tx(
          t(
            'These are next checks, not a confirmed diagnosis. Try one at a time and record what happens. Completed follow-ups will not be suggested again.',
            'นี่คือการตรวจต่อ ไม่ใช่การวินิจฉัยที่ยืนยันแล้ว ลองทีละอย่างและบันทึกผล การตรวจต่อที่ทำแล้วจะไม่ถูกเสนอซ้ำ',
          ),
        )}
      </p>
      {candidates.length > 1 && (
        <details className="evidence-details">
          <summary>{tx(t('Help prioritize these checks', 'ช่วยจัดลำดับการตรวจเหล่านี้'))}</summary>
          <label className="field-label">
            {tx(t('Any extra detail? (optional)', 'มีข้อมูลเพิ่มเติมหรือไม่ (ไม่บังคับ)'))}
            <textarea
              maxLength={1000}
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </label>
          <p>
            {tx(
              t(
                'Review sends your selected checks, results, and this optional detail to our server and, when enabled, OpenAI. Earlier notes and free-text answers are not sent. Do not include passwords or personal information.',
                'การทบทวนจะส่งตัวเลือก ผลตรวจ และข้อมูลเสริมนี้ไปเซิร์ฟเวอร์ของเราและ OpenAI หากเปิดใช้ ไม่ส่งบันทึกหรือคำตอบข้อความเดิม ห้ามใส่รหัสผ่านหรือข้อมูลส่วนตัว',
              ),
            )}
          </p>
          <button className="button secondary" disabled={status === 'busy'} onClick={review}>
            {tx(
              status === 'busy'
                ? t('Reviewing…', 'กำลังทบทวน…')
                : t('Review my next checks', 'ทบทวนการตรวจต่อ'),
            )}
          </button>
          <p role="status">
            {tx(
              status === 'ai'
                ? t(
                    'AI prioritized the available checks using your results. The instructions remain the built-in guidance.',
                    'AI จัดลำดับการตรวจจากผลของคุณ โดยใช้คำแนะนำที่มีอยู่ในระบบ',
                  )
                : status === 'rules'
                  ? t(
                      'Built-in recommendations are ready. AI is not enabled or is not needed for this set of checks.',
                      'คำแนะนำในระบบพร้อมแล้ว AI ยังไม่เปิดใช้หรือไม่จำเป็นสำหรับชุดการตรวจนี้',
                    )
                  : status === 'unavailable'
                    ? t(
                        'AI review is unavailable. You can still use all the recommendations below.',
                        'ทบทวนด้วย AI ไม่พร้อมใช้งาน คุณยังใช้คำแนะนำด้านล่างได้ทั้งหมด',
                      )
                    : t('', ''),
            )}
          </p>
        </details>
      )}
      {sorted.slice(0, 3).map((item, index) => (
        <article key={item.id} className="recommendation-card" aria-label={tx(item.title)}>
          <h3>
            <span>{index + 1}.</span> {tx(item.title)}
          </h3>
          <p>{tx(item.why)}</p>
          <ol>
            {item.steps.map((step, i) => (
              <li key={i}>{tx(step)}</li>
            ))}
          </ol>
          <p>
            <strong>{tx(t('What to look for: ', 'สิ่งที่ควรสังเกต: '))}</strong>
            {tx(item.lookFor)}
          </p>
          {!item.kind && (
            <div className="recommendation-result">
              <p>
                {tx(
                  t(
                    'Repeat the original activity before marking it fixed. Finding a clue alone does not mean the problem is solved.',
                    'ลองงานที่เคยมีปัญหาก่อนระบุว่าแก้แล้ว การพบเบาะแสเพียงอย่างเดียวยังไม่ได้แปลว่าแก้ได้แล้ว',
                  ),
                )}
              </p>
              <label htmlFor={`result-${item.id}`}>
                {tx(t('After trying this check', 'หลังลองตรวจตามนี้'))}
              </label>
              <select
                id={`result-${item.id}`}
                value={selected[item.id] ?? ''}
                onChange={(e) =>
                  setSelected((prev) => ({ ...prev, [item.id]: e.target.value as FixResult }))
                }
              >
                <option value="">{tx(t('Choose the result', 'เลือกผลที่ได้'))}</option>
                {Object.entries(results).map(([value, label]) => (
                  <option key={value} value={value}>
                    {tx(label)}
                  </option>
                ))}
              </select>
              <button
                className="button secondary"
                disabled={!selected[item.id] || status === 'busy'}
                onClick={() => onResult(item.id, selected[item.id] as FixResult)}
              >
                {tx(t('Save follow-up result', 'บันทึกผลตรวจต่อ'))}
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
