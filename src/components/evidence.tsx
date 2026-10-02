'use client';
import { Check, Circle, ArrowRight, GitBranch } from 'lucide-react';
import type { Session, Flow } from '@/types/diagnostic';
import { useApp } from './providers';
export function EvidenceList({ session }: { session: Session }) {
  const { tx, m } = useApp();
  return (
    <details className="evidence-details">
      <summary>
        {tx(m.evidence)}
        <span>{session.history.length}</span>
      </summary>
      <ol>
        {session.history.map((e, i) => (
          <li key={`${e.nodeId}-${i}`}>
            <strong>{tx(e.title)}</strong>
            <span>
              {tx(e.answer)}
              {e.detail && ` · ${e.detail}`}
            </span>
          </li>
        ))}
      </ol>
      {!!session.notes.length && (
        <div>
          <h3>{tx(m.noteCount)}</h3>
          {session.notes.map((n, i) => (
            <p key={i}>{n.text}</p>
          ))}
        </div>
      )}
    </details>
  );
}
export function ProgressPanel({ session, flow }: { session: Session; flow: Flow }) {
  const { tx, m } = useApp();
  const node = flow.nodes.find((n) => n.id === session.current);
  const possible = session.causes.filter((c) => c.status !== 'ruled_out');
  const ruledOut = session.causes.filter((c) => c.status === 'ruled_out');
  return (
    <aside className="progress-panel">
      <section className="panel">
        <div className="sidebar-title">
          <GitBranch size={16} />
          <h2>{tx(m.investigation)}</h2>
        </div>
        <ol className="timeline">
          <li className="complete">
            <Check size={13} />
            <span>{tx(m.contextDone)}</span>
          </li>
          {session.history.slice(-3).map((h, i) => (
            <li key={i} className="complete">
              <Check size={13} />
              <span>{tx(h.title)}</span>
            </li>
          ))}
          <li className="current">
            <ArrowRight size={14} />
            <span>
              {node && tx(node.title)}
              <small>{tx(m.currentCheck)}</small>
            </span>
          </li>
        </ol>
        <div className="sidebar-divider" />
        <h3>
          {tx(m.possible)}
          <span className="count-badge">{possible.length}</span>
        </h3>
        <ul className="cause-list">
          {possible.map((c) => (
            <li key={c.id}>
              <span className={`cause-indicator ${c.status}`}>
                <Circle size={9} />
              </span>
              <div>
                <span>{tx(flow.causes.find((f) => f.id === c.id)!.title)}</span>
                <small className={c.status}>{tx(m.statuses[c.status])}</small>
              </div>
            </li>
          ))}
        </ul>
        <div className="sidebar-divider" />
        <h3>
          {tx(m.ruledOut)}
          <span className="count-badge">{ruledOut.length}</span>
        </h3>
        {ruledOut.length ? (
          <ul className="cause-list ruled-out">
            {ruledOut.map((c) => (
              <li key={c.id}>
                <Check size={13} />
                <span>{tx(flow.causes.find((f) => f.id === c.id)!.title)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field-hint">{tx(m.noRuledOut)}</p>
        )}
      </section>
      <EvidenceList session={session} />
    </aside>
  );
}
