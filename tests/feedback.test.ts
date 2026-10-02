import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FileFeedbackStore } from '@/lib/feedback-store';
import { feedbackSchema, type FeedbackRecord } from '@/lib/feedback-schema';
import { summarize, toCsv } from '@/lib/results';
import { guardRequest, readLimitedJson, limitRequest } from '@/lib/http';
const input = () => ({
  sessionId: crypto.randomUUID(),
  flowId: 'microphone' as const,
  outcome: 'solved' as const,
  success: 'yes' as const,
  clarity: 5,
  ease: 4,
  relevance: 5,
  steps: 7,
  durationSeconds: 190,
  locale: 'en' as const,
  comment: '',
});
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
describe('anonymous feedback', () => {
  it('saves an empty optional comment and deduplicates concurrent retries', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'fixflow-test-'));
    dirs.push(dir);
    const store = new FileFeedbackStore(dir);
    const value = input();
    expect(await store.list()).toEqual([]);
    const results = await Promise.all([store.save(value), store.save(value), store.save(input())]);
    expect(results.filter((r) => r.duplicate)).toHaveLength(1);
    const records = await new FileFeedbackStore(dir).list();
    expect(records).toHaveLength(2);
    expect(records[0].comment).toBe('');
    expect(records[0].category).toBe('audio');
    expect(Object.keys(records[0])).not.toContain('notes');
    expect(summarize(records).averageSteps).toBe(7);
  });
  it('does not claim success if storage fails', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'fixflow-test-'));
    dirs.push(dir);
    await writeFile(path.join(dir, 'blocked'), 'file');
    await expect(new FileFeedbackStore(path.join(dir, 'blocked')).save(input())).rejects.toThrow();
  });
  it('rejects out of range scores, unknown fields, raw notes, and unfinished outcomes', () => {
    for (const update of [
      { clarity: 0 },
      { ease: 6 },
      { outcome: 'in_progress' },
      { notes: 'private context' },
      { flowId: 'unknown' },
      { durationSeconds: -1 },
      { comment: 'x'.repeat(1001) },
    ])
      expect(feedbackSchema.safeParse({ ...input(), ...update }).success).toBe(false);
  });
  it('exports real submitted counts and escapes spreadsheet formulas', () => {
    const record: FeedbackRecord = {
      ...input(),
      comment: '=HYPERLINK("bad")',
      timestamp: new Date().toISOString(),
      category: 'audio',
    };
    expect(summarize([])).toMatchObject({ submittedSessions: 0, averageEase: null });
    expect(summarize([record])).toMatchObject({
      submittedSessions: 1,
      solved: 1,
      partiallySolved: 0,
    });
    expect(toCsv([record])).toContain('"\'=HYPERLINK');
    expect(toCsv([record])).not.toContain(record.sessionId);
  });
});
it('rejects cross-origin posts and oversized request bodies', async () => {
  const r = new Request('https://fixflow.example/api/feedback', {
    method: 'POST',
    headers: { origin: 'https://other.example', 'content-type': 'application/json' },
    body: '{}',
  });
  expect(guardRequest(r, 'feedback')?.status).toBe(403);
  const large = new Request('https://fixflow.example', {
    method: 'POST',
    body: JSON.stringify({ text: 'x'.repeat(9000) }),
  });
  await expect(readLimitedJson(large)).rejects.toThrow(/large/);
  expect(limitRequest('test-window', 1, 0)).toBe(true);
  expect(limitRequest('test-window', 1, 1)).toBe(false);
  expect(limitRequest('test-window', 1, 60000)).toBe(true);
});

it('accepts the browser-facing host when Next normalizes the internal URL', () => {
  const request = new Request('http://0.0.0.0:3000/api/feedback', {
    method: 'POST',
    headers: {
      host: '127.0.0.1:3000',
      origin: 'http://127.0.0.1:3000',
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
    },
    body: '{}',
  });
  expect(guardRequest(request, 'host-regression')).toBeNull();
  const proxied = new Request('http://0.0.0.0:3000/api/feedback', {
    method: 'POST',
    headers: {
      host: 'fixflow.example',
      origin: 'https://fixflow.example',
      'x-forwarded-proto': 'https',
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
    },
    body: '{}',
  });
  expect(guardRequest(proxied, 'proxy-regression')).toBeNull();
  const crossSite = new Request(proxied, {
    headers: {
      host: 'fixflow.example',
      origin: 'https://evil.example',
      'x-forwarded-host': 'evil.example',
      'x-forwarded-proto': 'https',
      'content-type': 'application/json',
    },
  });
  expect(guardRequest(crossSite, 'rejection-regression')?.status).toBe(403);
});
