import { z } from 'zod';
import { interpret } from '@/ai/interpreter';
import { guardRequest, readLimitedJson } from '@/lib/http';
export const runtime = 'nodejs';
const schema = z.object({ text: z.string().trim().min(2).max(1000) }).strict();
export async function POST(request: Request) {
  const blocked = guardRequest(request, 'interpret');
  if (blocked) return blocked;
  try {
    const { text } = schema.parse(await readLimitedJson(request));
    return Response.json(
      await interpret(text, {
        key: process.env.FIXFLOW_AI_KEY || process.env.OPENAI_API_KEY,
        model: process.env.FIXFLOW_AI_MODEL,
      }),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Please enter a short description of your computer problem.' },
      { status: 400 },
    );
  }
}
