const windows = new Map<string, { start: number; count: number }>();
export function limitRequest(key: string, limit = 20, now = Date.now()): boolean {
  if (windows.size > 5000)
    for (const [id, value] of windows) if (now - value.start >= 60000) windows.delete(id);
  const value = windows.get(key);
  if (!value || now - value.start >= 60000) {
    if (windows.size >= 10000) return false;
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  value.count += 1;
  return value.count <= limit;
}
export function guardRequest(request: Request, scope: string): Response | null {
  const origin = request.headers.get('origin');
  if (origin) {
    // Next may normalize request.url to its internal listen address. The incoming
    // Host is the authority the browser requested; do not trust forwarded-host.
    const internalUrl = new URL(request.url);
    const host = request.headers.get('host') || internalUrl.host;
    const protocol = request.headers.get('x-forwarded-proto');
    const scheme =
      protocol === 'http' || protocol === 'https' ? protocol + ':' : internalUrl.protocol;
    let publicOrigin: string;
    try {
      publicOrigin = new URL(`${scheme}//${host}`).origin;
    } catch {
      return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
    }
    if (origin !== publicOrigin || request.headers.get('sec-fetch-site') === 'cross-site')
      return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'JSON is required.' }, { status: 415 });
  // In-memory abuse control, not identity or experiment data. Use trusted edge limits in production.
  if (!limitRequest(scope, scope === 'interpret' || scope === 'followups' ? 30 : 60))
    return Response.json(
      { error: 'Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  return null;
}
export async function readLimitedJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!request.body) throw new Error('Missing request body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Request too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
