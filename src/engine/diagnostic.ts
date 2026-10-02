import {
  t,
  type Flow,
  type Session,
  type Intake,
  type FixResult,
  type Evidence,
} from '@/types/diagnostic';
export const results: Record<FixResult, ReturnType<typeof t>> = {
  fixed: t("Yes, it's fixed", 'แก้ปัญหาได้แล้ว'),
  improved: t('It improved, but is not fixed', 'ดีขึ้นแต่ยังไม่หาย'),
  no_change: t('No change', 'ไม่เปลี่ยนแปลง'),
  worse: t('It made the problem worse', 'อาการแย่ลง'),
  could_not_complete: t("I couldn't complete the step", 'ทำตามขั้นตอนไม่ได้'),
};
export class DiagnosticError extends Error {}
export function startSession(flow: Flow, intake: Intake): Session {
  if (!['windows10', 'windows11', 'unknown'].includes(intake.platform))
    throw new DiagnosticError('Unsupported platform');
  return {
    id: crypto.randomUUID(),
    flowId: flow.id,
    startedAt: Date.now(),
    ...intake,
    current: flow.start,
    history: [],
    causes: flow.causes.map((c) => ({ id: c.id, status: 'possible', evidence: [] })),
    fixes: [],
    notes: [],
    outcome: 'in_progress',
  };
}
function advance(flow: Flow, session: Session, next: string): Session {
  if (next === 'safety_stop') return finishSession(session, 'safety');
  if (next === 'unresolved') return finishSession(session, 'exhausted');
  if (
    !flow.nodes.some((n) => n.id === next) ||
    session.history.some((e) => e.nodeId === next) ||
    session.history.length > 60
  )
    return finishSession(session, 'invalid');
  return { ...session, current: next };
}
export function answerQuestion(
  flow: Flow,
  session: Session,
  answerId: string,
  detail?: string,
): Session {
  const node = flow.nodes.find((n) => n.id === session.current);
  if (session.flowId !== flow.id || session.outcome !== 'in_progress' || node?.kind !== 'question')
    throw new DiagnosticError('Invalid question state');
  const option = node.options.find((o) => o.id === answerId);
  if (!option || (option.detail && !detail?.trim()) || (detail?.length ?? 0) > 1000)
    throw new DiagnosticError('Invalid answer');
  const evidence: Evidence = {
    nodeId: node.id,
    answerId: option.id,
    title: node.title,
    answer: option.label,
    detail: detail?.trim(),
    timestamp: Date.now(),
  };
  const updated: Session = {
    ...session,
    history: [...session.history, evidence],
    causes: session.causes.map((c) => {
      const effect = option.effects?.find((e) => e.cause === c.id);
      return effect ? { ...c, status: effect.status, evidence: [...c.evidence, evidence] } : c;
    }),
  };
  return advance(flow, updated, option.next);
}
export function answerRange(flow: Flow, session: Session, value: number): Session {
  const node = flow.nodes.find((n) => n.id === session.current);
  if (
    node?.kind !== 'question' ||
    node.input !== 'range' ||
    !Number.isFinite(value) ||
    value < (node.min ?? 0) ||
    value > (node.max ?? 100)
  )
    throw new DiagnosticError('Invalid reading');
  const range = node.ranges?.find((r) => value <= r.max);
  if (!range) throw new DiagnosticError('Missing range');
  return answerQuestion(flow, session, range.option, `${value}${node.unit ?? ''}`);
}
export function verifyFix(
  flow: Flow,
  session: Session,
  result: FixResult,
  acknowledged = false,
): Session {
  const node = flow.nodes.find((n) => n.id === session.current);
  if (
    session.flowId !== flow.id ||
    session.outcome !== 'in_progress' ||
    node?.kind !== 'fix' ||
    !(result in results)
  )
    throw new DiagnosticError('Invalid fix state');
  if (node.risk === 'caution' && !acknowledged && result !== 'could_not_complete')
    throw new DiagnosticError('Safety acknowledgement required');
  const evidence: Evidence = {
    nodeId: node.id,
    title: node.title,
    answer: results[result],
    timestamp: Date.now(),
  };
  const updated: Session = {
    ...session,
    history: [...session.history, evidence],
    fixes: [...session.fixes, { fixId: node.id, result, timestamp: Date.now() }],
    causes: session.causes.map((c) =>
      c.id === node.cause
        ? {
            ...c,
            status: result === 'fixed' ? (node.confidenceOnSuccess ?? 'very_likely') : 'possible',
            evidence: [...c.evidence, evidence],
          }
        : c,
    ),
  };
  if (result === 'fixed') return { ...updated, outcome: 'solved', endedAt: Date.now() };
  if (result === 'worse') return finishSession(updated, 'worse');
  return advance(flow, updated, node.onFailure);
}
export function finishSession(session: Session, reason: Session['stopReason'] = 'ended'): Session {
  return {
    ...session,
    outcome:
      reason !== 'worse' &&
      reason !== 'safety' &&
      session.fixes.some((f) => f.result === 'improved')
        ? 'partially_solved'
        : 'solution_not_found',
    stopReason: reason,
    endedAt: Date.now(),
  };
}
export function addNote(session: Session, text: string, symptoms: string[] = []): Session {
  if (!text.trim() || text.length > 1000 || session.notes.length >= 20)
    throw new DiagnosticError('Invalid note');
  // Text interpretation is recorded as reported context, never as an observed test result.
  return { ...session, notes: [...session.notes, { text: text.trim(), symptoms }] };
}
