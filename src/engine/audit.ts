import type { Flow, Session, FixResult } from '@/types/diagnostic';
import { startSession, answerQuestion, verifyFix } from './diagnostic';
// One representative history per graph node; all its answer/result edges are exercised.
// This audits terminal branches, not every combination of observations or real-world success.
export function auditEndings(flow: Flow): Session[] {
  const queue = [startSession(flow, { platform: 'windows11', symptoms: [], change: '' })];
  const seen = new Set<string>();
  const endings: Session[] = [];
  while (queue.length) {
    const session = queue.shift()!;
    if (session.outcome !== 'in_progress') {
      endings.push(session);
      continue;
    }
    if (seen.has(session.current)) continue;
    seen.add(session.current);
    const node = flow.nodes.find((n) => n.id === session.current)!;
    if (node.kind === 'question') {
      queue.push(
        ...node.options.map((o) =>
          answerQuestion(flow, session, o.id, o.detail ? 'Unlisted symptom' : undefined),
        ),
      );
    } else {
      queue.push(
        ...(['fixed', 'improved', 'no_change', 'could_not_complete', 'worse'] as FixResult[]).map(
          (result) => verifyFix(flow, session, result, true),
        ),
      );
    }
  }
  return endings;
}
