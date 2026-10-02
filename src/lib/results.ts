import type { FeedbackRecord } from './feedback-schema';
export function summarize(records: FeedbackRecord[]) {
  const average = (key: 'ease' | 'clarity' | 'relevance' | 'steps' | 'durationSeconds') =>
    records.length
      ? Number((records.reduce((n, r) => n + r[key], 0) / records.length).toFixed(2))
      : null;
  return {
    submittedSessions: records.length,
    solved: records.filter((r) => r.success === 'yes').length,
    partiallySolved: records.filter((r) => r.success === 'partially').length,
    notSolved: records.filter((r) => r.success === 'no').length,
    averageEase: average('ease'),
    averageClarity: average('clarity'),
    averageRelevance: average('relevance'),
    averageSteps: average('steps'),
    averageDurationSeconds: average('durationSeconds'),
  };
}
export function toCsv(records: FeedbackRecord[]): string {
  const headers = [
    'timestamp',
    'category',
    'flowId',
    'outcome',
    'success',
    'clarity',
    'ease',
    'relevance',
    'steps',
    'durationSeconds',
    'locale',
    'comment',
  ] as const;
  const escape = (value: unknown) => {
    let s = String(value);
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return [
    headers.join(','),
    ...records.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\r\n');
}
