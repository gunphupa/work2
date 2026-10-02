'use client';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  ArrowRight,
  Download,
  ExternalLink,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import type { Session, Flow } from '@/types/diagnostic';
import { useApp } from './providers';
import { Feedback } from './feedback';
import { EvidenceList } from './evidence';
export function Completion({ session, flow }: { session: Session; flow: Flow }) {
  const { tx, m } = useApp();
  const solved = session.outcome === 'solved';
  const partial = session.outcome === 'partially_solved';
  const unsafe = session.stopReason === 'safety';
  const worse = session.stopReason === 'worse';
  const latestFix = flow.nodes.find((n) => n.id === session.fixes.at(-1)?.fixId);
  const workedFix = flow.nodes.find(
    (n) =>
      n.id ===
      session.fixes.findLast((f) => f.result === 'fixed' || f.result === 'improved')?.fixId,
  );
  function download() {
    const payload = {
      problem: tx(flow.title),
      platform: session.platform,
      symptoms: session.symptoms,
      recentChange: session.change,
      reportedContext: session.context,
      outcome: session.outcome,
      durationSeconds: Math.round(
        ((session.endedAt ?? session.startedAt) - session.startedAt) / 1000,
      ),
      evidence: session.history.map((e) => ({
        check: tx(e.title),
        result: tx(e.answer),
        detail: e.detail,
      })),
      causes: session.causes.map((c) => ({
        cause: tx(flow.causes.find((f) => f.id === c.id)!.title),
        status: tx(m.statuses[c.status]),
      })),
      notes: session.notes.map((n) => n.text),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fixflow-summary.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="completion-layout">
      <section className="panel completion-card">
        <span
          className={`completion-icon ${solved ? 'success' : unsafe || worse ? 'warning' : ''}`}
        >
          {solved ? (
            <CheckCircle2 size={30} />
          ) : unsafe || worse ? (
            <AlertTriangle size={30} />
          ) : (
            <Compass size={30} />
          )}
        </span>
        <span className="eyebrow">{tx(flow.title)}</span>
        <h1 tabIndex={-1}>
          {tx(
            unsafe
              ? m.unsafeTitle
              : worse
                ? m.worseTitle
                : solved
                  ? m.solved
                  : partial
                    ? m.partial
                    : m.unresolved,
          )}
        </h1>
        <p className="completion-body">
          {tx(
            unsafe
              ? m.unsafeBody
              : solved
                ? m.solvedBody
                : partial
                  ? m.partialBody
                  : m.unresolvedBody,
          )}
        </p>
        {worse && latestFix?.kind === 'fix' && (
          <div className="warning-message">
            <strong>{tx(m.undo)}</strong>
            <p>{tx(latestFix.undo)}</p>
          </div>
        )}
        {session.stopReason === 'invalid' && <p className="warning-message">{tx(m.error)}</p>}
        {workedFix?.kind === 'fix' && !unsafe && !worse && (
          <div className="worked-fix">
            <Check size={20} />
            <div>
              <span>{tx(m.fixedBy)}</span>
              <strong>{tx(workedFix.title)}</strong>
            </div>
          </div>
        )}
        <div className="completion-stats">
          <div>
            <strong>{session.history.length}</strong>
            <span>{tx(m.testsCompleted)}</span>
          </div>
          <div>
            <strong>
              {Math.max(
                1,
                Math.round(((session.endedAt ?? session.startedAt) - session.startedAt) / 60000),
              )}
              <small> {tx(m.minutes)}</small>
            </strong>
            <span>{tx(m.duration)}</span>
          </div>
        </div>
        <EvidenceList session={session} />
        {!solved && (
          <div className="support-box">
            <a
              className="text-link"
              href="https://support.microsoft.com/windows"
              target="_blank"
              rel="noreferrer"
            >
              {tx(m.support)}
              <ExternalLink size={14} />
            </a>
            <p>{tx(m.manufacturer)}</p>
          </div>
        )}
        <button onClick={download} className="button secondary">
          <Download size={16} />
          {tx(m.download)}
        </button>
        <p className="field-hint">{tx(m.privacySummary)}</p>
        <Link className="text-link new-problem" href="/">
          {tx(m.newProblem)}
          <ArrowRight size={16} />
        </Link>
      </section>
      <Feedback session={session} />
    </div>
  );
}
