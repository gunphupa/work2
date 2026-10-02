const origin = process.env.FIXFLOW_SMOKE_ORIGIN || 'http://127.0.0.1:3000';
for (const [route, expected] of [
  ['/', 'FixFlow'],
  ['/diagnose/microphone', 'microphone'],
]) {
  const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !(await response.text()).toLowerCase().includes(expected.toLowerCase()))
    throw new Error(`Page check failed: ${route}`);
}
const response = await fetch(new URL('/api/interpret', origin), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin },
  body: JSON.stringify({ text: 'My microphone is not working' }),
  signal: AbortSignal.timeout(12000),
});
const result = await response.json();
if (!response.ok || result.status !== 'matched' || result.problemId !== 'microphone')
  throw new Error('Interpretation endpoint failed');
console.log(
  'Ready: home page, microphone diagnostic route, and same-origin interpretation request passed. No feedback records were created.',
);
