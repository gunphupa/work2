'use client';
import { useState } from 'react';
import { CheckCircle2, Send, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { Session } from '@/types/diagnostic';
import { useApp } from './providers';
import { Choice } from './choices';
export function Feedback({ session }: { session: Session }) {
  const { locale, tx, m } = useApp();
  const [success, setSuccess] = useState('');
  const [ratings, setRatings] = useState({ clarity: 0, ease: 0, relevance: 0 });
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!success || Object.values(ratings).some((n) => !n) || state === 'busy') return;
    setState('busy');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          sessionId: session.id,
          flowId: session.flowId,
          outcome: session.outcome,
          success,
          ...ratings,
          comment,
          locale,
          steps: session.history.length,
          durationSeconds: Math.min(
            604800,
            Math.max(
              0,
              Math.round(((session.endedAt ?? session.startedAt) - session.startedAt) / 1000),
            ),
          ),
        }),
      });
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (body.saved !== true) throw new Error();
      setState('saved');
    } catch {
      setState('error');
    }
  }
  if (state === 'saved')
    return (
      <div className="panel feedback-thanks" role="status">
        <CheckCircle2 size={26} />
        <h2>{tx(m.thanks)}</h2>
      </div>
    );
  return (
    <form className="panel feedback-form" onSubmit={submit}>
      <span className="eyebrow">
        {locale === 'en' ? 'A SMALL PART OF THE SCIENCE' : 'ส่วนเล็ก ๆ ของการศึกษา'}
      </span>
      <h2>{tx(m.feedback)}</h2>
      <p>{tx(m.feedbackBody)}</p>
      <fieldset>
        <legend>{tx(m.successQuestion)}</legend>
        <div className="choice-grid three">
          {[
            ['yes', m.yes],
            ['partially', m.partially],
            ['no', m.no],
          ].map(([id, label]) => (
            <Choice
              key={id as string}
              name="success"
              value={id as string}
              label={tx(label as typeof m.yes)}
              checked={success === id}
              onChange={() => setSuccess(id as string)}
            />
          ))}
        </div>
      </fieldset>
      {(['clarity', 'ease', 'relevance'] as const).map((key) => (
        <fieldset className="rating-field" key={key}>
          <legend>{tx(m[key])}</legend>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={ratings[key] === n ? 'chosen' : ''}>
                <input
                  type="radio"
                  name={key}
                  value={n}
                  checked={ratings[key] === n}
                  onChange={() => setRatings((prev) => ({ ...prev, [key]: n }))}
                  required
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <div className="rating-captions">
            <span>{tx(m.lowRating)}</span>
            <span>{tx(m.highRating)}</span>
          </div>
        </fieldset>
      ))}
      <label className="field-label">
        {tx(m.comment)}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
        />
      </label>
      <p className="feedback-privacy">
        <ShieldCheck size={17} />
        {tx(m.privacy)}
      </p>
      {state === 'error' && (
        <p className="warning-message" role="alert">
          {tx(m.feedbackFailed)}
        </p>
      )}
      <button
        className="button primary"
        disabled={state === 'busy' || !success || Object.values(ratings).some((n) => !n)}
      >
        {state === 'busy' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}{' '}
        {tx(state === 'busy' ? m.submitting : m.submit)}
      </button>
    </form>
  );
}
