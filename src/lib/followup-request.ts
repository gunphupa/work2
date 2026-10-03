import { z } from 'zod';
import { problemIds } from '@/ai/interpreter';
import type { Session } from '@/types/diagnostic';
const resultSchema = z.enum(['fixed', 'improved', 'no_change', 'worse', 'could_not_complete']);
const id = z.string().min(1).max(80);
export const followupRequestSchema = z
  .object({
    flowId: z.enum(problemIds),
    platform: z.enum(['windows10', 'windows11', 'unknown']),
    ended: z.boolean(),
    actions: z
      .array(
        z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('question'), nodeId: id, answerId: id }).strict(),
          z.object({ kind: z.literal('fix'), nodeId: id, result: resultSchema }).strict(),
        ]),
      )
      .max(60),
    followups: z.array(z.object({ id, result: resultSchema }).strict()).max(25),
    detail: z.string().trim().max(1000),
  })
  .strict();
export type FollowupRequest = z.infer<typeof followupRequestSchema>;
export function followupPayload(session: Session, detail = ''): FollowupRequest {
  return {
    flowId: session.flowId as FollowupRequest['flowId'],
    platform: session.platform,
    ended: session.stopReason === 'ended',
    detail,
    actions: session.history
      .filter((e) => !e.nodeId.startsWith('recommendation:'))
      .map((e) => {
        const attempt = session.fixes.find((f) => f.fixId === e.nodeId);
        return attempt
          ? { kind: 'fix', nodeId: e.nodeId, result: attempt.result }
          : { kind: 'question', nodeId: e.nodeId, answerId: e.answerId ?? 'unsure' };
      }),
    followups: (session.recommendations ?? []).map(({ id, result }) => ({ id, result })),
  };
}
