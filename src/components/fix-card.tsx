'use client';
import { useState } from 'react';
import { ArrowRight, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import type { Fix, FixResult, Session, Flow } from '@/types/diagnostic';
import { results } from '@/engine/diagnostic';
import { useApp } from './providers';
import { Choice } from './choices';
export function FixCard({
  node,
  session,
  flow,
  onVerify,
}: {
  node: Fix;
  session: Session;
  flow: Flow;
  onVerify: (result: FixResult, acknowledged: boolean) => void;
}) {
  const { tx, m } = useApp();
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState<FixResult | ''>('');
  const cause = session.causes.find((c) => c.id === node.cause);
  const label = flow.causes.find((c) => c.id === node.cause)!.title;
  const locked = node.risk === 'caution' && !acknowledged;
  return (
    <article className="panel diagnostic-card">
      <span className={`risk-label ${node.risk}`}>
        {node.risk === 'safe' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}{' '}
        {tx(node.risk === 'safe' ? m.safe : m.caution)}
      </span>
      <p className="eyebrow diagnosis-eyebrow">{tx(m.likely)}</p>
      <h1 className="question-heading" tabIndex={-1}>
        {tx(label)}
      </h1>
      <div className="why-panel">
        <ShieldCheck size={18} />
        <div>
          <strong>{tx(m.basis)}</strong>
          <p>{tx(node.why)}</p>
        </div>
      </div>
      {!!cause?.evidence.length && (
        <ul className="supporting-evidence">
          {cause.evidence.map((e, i) => (
            <li key={i}>
              <Check size={15} />
              <span>
                {tx(e.title)}: {tx(e.answer)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {node.risk === 'caution' && (
        <div className="warning-message">
          <strong>{tx(m.caution)}</strong>
          <p>{node.warning && tx(node.warning)}</p>
          <label className="acknowledgement">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            {tx(m.acknowledge)}
          </label>
        </div>
      )}
      {!locked && (
        <>
          <h2>{tx(node.title)}</h2>
          <ol className="guide-list">
            {node.steps.map((line, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <p>{tx(line)}</p>
              </li>
            ))}
          </ol>
          <div className="verification">
            <h2>{tx(m.verifyTitle)}</h2>
            <p>{tx(node.verify)}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (result) onVerify(result, acknowledged);
              }}
            >
              <fieldset>
                <legend className="sr-only">{tx(m.verifyTitle)}</legend>
                <div className="answer-options">
                  {Object.entries(results).map(([id, label]) => (
                    <Choice
                      name="verification"
                      key={id}
                      value={id}
                      label={tx(label)}
                      checked={result === id}
                      onChange={() => setResult(id as FixResult)}
                    />
                  ))}
                </div>
              </fieldset>
              <button className="button primary" disabled={!result}>
                {tx(m.recordResult)}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </>
      )}
      {locked && (
        <button className="button secondary" onClick={() => onVerify('could_not_complete', false)}>
          {tx(results.could_not_complete)}
          <ArrowRight size={16} />
        </button>
      )}
    </article>
  );
}
