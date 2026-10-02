import { z } from 'zod';
import { problemIds } from '@/ai/interpreter';
export const feedbackSchema = z
  .object({
    sessionId: z.uuid(),
    flowId: z.enum(problemIds),
    outcome: z.enum(['solved', 'partially_solved', 'solution_not_found']),
    success: z.enum(['yes', 'partially', 'no']),
    clarity: z.number().int().min(1).max(5),
    ease: z.number().int().min(1).max(5),
    relevance: z.number().int().min(1).max(5),
    steps: z.number().int().min(0).max(100),
    durationSeconds: z.number().int().min(0).max(604800),
    locale: z.enum(['en', 'th']),
    comment: z.string().trim().max(1000).default(''),
  })
  .strict();
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackRecord = FeedbackInput & { timestamp: string; category: string };
