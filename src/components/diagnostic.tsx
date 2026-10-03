'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquarePlus, Plus, LoaderCircle, X } from 'lucide-react';
import type { Flow, Intake, Session, FixResult } from '@/types/diagnostic';
import {
  startSession,
  answerQuestion,
  answerRange,
  verifyFix,
  finishSession,
  addNote,
} from '@/engine/diagnostic';
import { interpretLocally, type Interpretation } from '@/ai/interpreter';
import { useApp } from './providers';
import { IntakeForm } from './intake';
import { QuestionCard } from './question-card';
import { FixCard } from './fix-card';
import { ProgressPanel } from './evidence';
import { Completion } from './completion';
import { recordRecommendation } from '@/engine/recommendations';
export function Diagnostic({ flow }: { flow: Flow }) {
  const { tx, m, setPendingDescription } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState(false);
  const [ending, setEnding] = useState(false);
  const node = flow.nodes.find((n) => n.id === session?.current);
  const displayKey = session
    ? `${session.current}:${session.outcome}:${session.recommendations?.length ?? 0}`
    : '';
  useEffect(() => {
    if (displayKey) {
      document
        .querySelector<HTMLElement>('.question-heading, .completion-card h1')
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [displayKey]); // Only move focus when the displayed step changes.
  function begin(intake: Intake) {
    try {
      setSession(startSession(flow, intake));
      setPendingDescription('');
      setError(false);
    } catch {
      setError(true);
    }
  }
  function update(operation: (session: Session) => Session) {
    if (!session) return false;
    try {
      setSession(operation(session));
      setError(false);
      return true;
    } catch {
      setError(true);
      return false;
    }
  }
  const finished = session && session.outcome !== 'in_progress';
  return (
    <main id="main" className="container diagnostic-page">
      <div className="diagnostic-topbar">
        <Link href="/" className="text-link">
          <ArrowLeft size={15} />
          {tx(m.back)}
        </Link>
        {session && !finished && (
          <div>
            <span className="step-counter">
              {tx(m.step)} {session.history.length + 1}
            </span>
            <button className="subtle-button" onClick={() => setEnding(true)}>
              {tx(m.end)}
              <X size={13} />
            </button>
          </div>
        )}
      </div>
      {ending && !finished && (
        <div className="end-confirm" role="alert">
          <p>{tx(m.confirmEnd)}</p>
          <button className="button secondary" onClick={() => setEnding(false)}>
            {tx(m.cancel)}
          </button>
          <button className="button primary" onClick={() => update((s) => finishSession(s))}>
            {tx(m.end)}
          </button>
        </div>
      )}
      {error && (
        <p className="warning-message" role="alert">
          {tx(m.error)}
        </p>
      )}
      {!session ? (
        <IntakeForm flow={flow} onStart={begin} />
      ) : finished ? (
        <Completion
          session={session}
          flow={flow}
          onRecommendationResult={(id, result) =>
            update((s) => recordRecommendation(flow, s, id, result))
          }
        />
      ) : (
        <div className="diagnostic-layout">
          <div>
            <div className="session-label">{tx(flow.title)}</div>
            {node?.kind === 'question' ? (
              <QuestionCard
                key={node.id}
                node={node}
                step={session.history.length + 1}
                onAnswer={(id, detail) => update((s) => answerQuestion(flow, s, id, detail))}
                onReading={(value) => update((s) => answerRange(flow, s, value))}
              />
            ) : node?.kind === 'fix' ? (
              <FixCard
                key={node.id}
                node={node}
                session={session}
                flow={flow}
                onVerify={(result: FixResult, ack) =>
                  update((s) => verifyFix(flow, s, result, ack))
                }
              />
            ) : (
              <div className="panel warning-message" role="alert">
                {tx(m.error)}
                <Link href="/">{tx(m.back)}</Link>
              </div>
            )}
            <ContextNote onAdd={(text, symptoms) => update((s) => addNote(s, text, symptoms))} />
          </div>
          <ProgressPanel session={session} flow={flow} />
        </div>
      )}
    </main>
  );
}
function ContextNote({ onAdd }: { onAdd: (text: string, symptoms: string[]) => boolean }) {
  const { tx, m } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    '' | 'unsupported' | 'off_topic' | 'saved' | 'fallback' | 'error'
  >('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2) return;
    setBusy(true);
    setStatus('');
    let result: Interpretation;
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error();
      result = await response.json();
    } catch {
      result = { ...interpretLocally(text), source: 'unavailable' };
    }
    if (result.status === 'unsupported') setStatus('unsupported');
    else if (result.status === 'off_topic') setStatus('off_topic');
    else {
      const saved = onAdd(text, result.symptoms);
      if (saved) setText('');
      setStatus(saved ? (result.source === 'unavailable' ? 'fallback' : 'saved') : 'error');
    }
    setBusy(false);
  }
  return (
    <details className="context-note">
      <summary>
        <MessageSquarePlus size={17} />
        {tx(m.notes)}
        <Plus size={15} />
      </summary>
      <form onSubmit={submit}>
        <p>{tx(m.notesHint)}</p>
        <label htmlFor="context-note-text" className="field-label">
          {tx(m.otherDetail)}
        </label>
        <textarea
          id="context-note-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={3}
        />
        <p className="field-hint">
          {tx(m.textPrivacy)} {tx(m.textService)}
        </p>
        <button disabled={busy || text.trim().length < 2} className="button secondary">
          {busy && <LoaderCircle className="spin" size={15} />}
          {tx(m.addNote)}
        </button>
        <p role="status" className="field-hint">
          {status === 'unsupported'
            ? tx(m.unsupported)
            : status === 'off_topic'
              ? tx(m.offTopic)
              : status === 'error'
                ? tx(m.error)
                : status
                  ? tx(m.noteSaved)
                  : ''}
          {status === 'fallback' && ' ' + tx(m.aiUnavailable)}
        </p>
      </form>
    </details>
  );
}
