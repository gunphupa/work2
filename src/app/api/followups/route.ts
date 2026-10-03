import { guardRequest, readLimitedJson } from '@/lib/http';
import { prioritizeFollowups } from '@/ai/followups';
import { followupRequestSchema } from '@/lib/followup-request';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = guardRequest(request, 'followups');
  if (blocked) return blocked;
  try {
    const input = followupRequestSchema.parse(await readLimitedJson(request, 16384));
    return Response.json(
      await prioritizeFollowups(input, {
        key: process.env.FIXFLOW_AI_KEY || process.env.OPENAI_API_KEY,
        model: process.env.FIXFLOW_AI_MODEL,
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'The recorded checks could not be reviewed. Your built-in recommendations are still available.',
      },
      { status: 400 },
    );
  }
}
