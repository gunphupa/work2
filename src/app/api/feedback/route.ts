import { feedbackSchema } from '@/lib/feedback-schema';
import { feedbackStore } from '@/lib/feedback-store';
import { guardRequest, readLimitedJson } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const blocked = guardRequest(request, 'feedback');
  if (blocked) return blocked;
  let input;
  try {
    input = feedbackSchema.parse(await readLimitedJson(request));
  } catch {
    return Response.json({ error: 'Please check your feedback and try again.' }, { status: 400 });
  }
  try {
    return Response.json(
      { saved: true, ...(await feedbackStore.save(input)) },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    console.error('Feedback storage unavailable. Check the configured data directory.');
    return Response.json({ error: 'Feedback could not be saved right now.' }, { status: 503 });
  }
}
