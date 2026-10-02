import { describe, expect, it } from 'vitest';
import { flows, getFlow } from '@/data/flows';
import { catalog } from '@/data/catalog';
import { validateFlow } from '@/engine/validate';
import { startSession, answerQuestion, answerRange, verifyFix, addNote } from '@/engine/diagnostic';
import type { Session, FixResult } from '@/types/diagnostic';
const intake = { platform: 'windows11' as const, symptoms: ['Intermittent'], change: 'none' };
describe('flow integrity', () => {
  it('has all 15 requested flows with complete bilingual definitions', () => {
    expect(flows.length).toBe(15);
    expect(new Set(flows.map((f) => f.id)).size).toBe(15);
    expect(flows.map((f) => f.id).sort()).toEqual(catalog.map((f) => f.id).sort());
    for (const flow of flows) expect(validateFlow(flow), flow.id).toEqual([]);
  });
  it.each(flows)(
    '$id: every reachable answer and fix result is valid and keeps evidence',
    (flow) => {
      const queue = [startSession(flow, intake)];
      const visited = new Set<string>();
      let terminal = 0;
      while (queue.length) {
        const session = queue.shift()!;
        if (session.outcome !== 'in_progress') {
          terminal++;
          expect(session.endedAt).toBeDefined();
          continue;
        }
        if (visited.has(session.current)) continue;
        visited.add(session.current);
        const node = flow.nodes.find((n) => n.id === session.current)!;
        expect(node).toBeDefined();
        const successors: Session[] =
          node.kind === 'question'
            ? node.options.map((option) =>
                answerQuestion(
                  flow,
                  session,
                  option.id,
                  option.detail ? 'An unusual symptom' : undefined,
                ),
              )
            : (
                ['fixed', 'improved', 'no_change', 'worse', 'could_not_complete'] as FixResult[]
              ).map((result) => verifyFix(flow, session, result, true));
        successors.forEach((next) => {
          expect(next.history.length).toBe(session.history.length + 1);
          expect(next.history.slice(0, -1)).toEqual(session.history);
          expect(new Set(next.history.map((h) => h.nodeId)).size).toBe(next.history.length);
          expect(next.stopReason).not.toBe('invalid');
          queue.push(next);
        });
      }
      expect(visited.size).toBe(flow.nodes.length);
      expect(terminal).toBeGreaterThan(0);
    },
  );
  it('validator detects cycles, broken links, unknown causes and missing translations', () => {
    const broken = structuredClone(getFlow('microphone')!);
    const node = broken.nodes[0];
    if (node.kind !== 'question') throw new Error();
    node.options[0].next = node.id;
    node.options[1].next = 'absent';
    node.title.th = '';
    node.options[0].effects = [{ cause: 'nonexistent', status: 'likely' }];
    const errors = validateFlow(broken).join(' ');
    expect(errors).toMatch(/Cycle/);
    expect(errors).toMatch(/Missing target/);
    expect(errors).toMatch(/Unknown cause/);
    expect(errors).toMatch(/Missing translation/);
  });
});
describe('microphone investigation', () => {
  const flow = getFlow('microphone')!;
  function permissionFix() {
    let s = startSession(flow, intake);
    for (const answer of ['yes', 'yes', 'yes', 'blocked']) s = answerQuestion(flow, s, answer);
    expect(s.current).toBe('permission_fix');
    return s;
  }
  it('rules out connection, selection and mute using actual observations', () => {
    const s = permissionFix();
    expect(s.causes.find((c) => c.id === 'connection')!.status).toBe('ruled_out');
    expect(s.causes.find((c) => c.id === 'selection')!.status).toBe('ruled_out');
    expect(s.causes.find((c) => c.id === 'mute')!.status).toBe('ruled_out');
    expect(s.causes.find((c) => c.id === 'permission')!.status).toBe('likely');
    expect(s.outcome).toBe('in_progress');
  });
  it('a failed fix continues with history and never asks the same question again', () => {
    const before = permissionFix();
    const after = verifyFix(flow, before, 'no_change');
    expect(after.current).toBe('app_test');
    expect(after.history.slice(0, 4)).toEqual(before.history);
    expect(after.fixes).toHaveLength(1);
    expect(after.causes.find((c) => c.id === 'permission')!.status).toBe('possible');
    const fallback = answerQuestion(flow, after, 'no');
    expect(fallback.outcome).toBe('solution_not_found');
  });
  it('success requires reported verification; worse stops further fixes', () => {
    expect(verifyFix(flow, permissionFix(), 'fixed').outcome).toBe('solved');
    expect(verifyFix(flow, permissionFix(), 'worse').stopReason).toBe('worse');
    const partial = verifyFix(flow, permissionFix(), 'improved');
    expect(answerQuestion(flow, partial, 'no').outcome).toBe('partially_solved');
  });
  it('unknown answers and Other preserve uncertainty rather than inventing facts', () => {
    const start = startSession(flow, intake);
    expect(answerQuestion(flow, start, 'unsure').causes).toEqual(start.causes);
    expect(() => answerQuestion(flow, start, 'other')).toThrow();
    const other = answerQuestion(flow, start, 'other', 'It appears briefly then disappears');
    expect(other.history[0].answerId).toBe('other');
    expect(other.history[0].detail).toContain('briefly');
    expect(other.current).toBe('connection');
    expect(() => answerQuestion(flow, start, 'invented-answer')).toThrow();
    const noted = addNote(start, 'After ten minutes, the microphone stops', ['after_time']);
    expect(noted.causes).toEqual(start.causes);
    expect(noted.history).toEqual([]);
  });
});
it('numeric readings validate boundaries and choose the relevant branch', () => {
  const flow = getFlow('memory')!;
  const s = startSession(flow, intake);
  expect(answerRange(flow, s, 84.9).current).toBe('disk_read');
  expect(answerRange(flow, s, 85).current).toBe('memory_process');
  for (const v of [-1, 101, NaN, Infinity]) expect(() => answerRange(flow, s, v)).toThrow();
});
it('caution actions require acknowledgement, with a safe skip available', () => {
  const flow = getFlow('driver')!;
  let s = startSession(flow, intake);
  s = answerQuestion(flow, s, 'yes');
  s = answerQuestion(flow, s, 'yes');
  expect(() => verifyFix(flow, s, 'fixed')).toThrow(/acknowledgement/);
  expect(verifyFix(flow, s, 'could_not_complete').current).toBe('manager');
  expect(verifyFix(flow, s, 'fixed', true).outcome).toBe('solved');
});
it('unsafe heat ends tests immediately without recommending a fix', () => {
  const flow = getFlow('heat')!;
  const s = answerQuestion(flow, startSession(flow, intake), 'danger');
  expect(s.stopReason).toBe('safety');
  expect(s.outcome).toBe('solution_not_found');
  expect(s.fixes).toEqual([]);
});
it('rejects wrong-flow, unsupported-platform and completed-session mutations', () => {
  const mic = getFlow('microphone')!,
    wifi = getFlow('wifi')!;
  const s = startSession(mic, intake);
  expect(() => answerQuestion(wifi, s, 'off')).toThrow();
  expect(() => startSession(mic, { ...intake, platform: 'linux' as never })).toThrow();
  expect(() => answerQuestion(mic, { ...s, outcome: 'solved' }, 'yes')).toThrow();
});

it('a restored Wi-Fi connection does not invent the original cause', () => {
  const flow = getFlow('wifi')!;
  let session = startSession(flow, intake);
  for (const id of ['on', 'yes', 'works']) session = answerQuestion(flow, session, id);
  expect(session.current).toBe('recheck');
  const completed = verifyFix(flow, session, 'fixed');
  expect(completed.outcome).toBe('solved');
  expect(completed.causes.find((c) => c.id === 'pc')!.status).toBe('possible');
});

describe('slowdown checks beyond resource usage', () => {
  const flow = getFlow('slow')!;
  function normalReadings() {
    let session = startSession(flow, intake);
    for (const answer of ['low', 'low', 'low', 'enough'])
      session = answerQuestion(flow, session, answer);
    expect(session.outcome).toBe('in_progress');
    expect(session.current).toBe('slow_scope');
    expect(session.causes.filter((cause) => cause.status === 'unlikely')).toHaveLength(4);
    return session;
  }
  it('normal readings lead to an app comparison and a verified fix', () => {
    let session = normalReadings();
    const readings = session.history;
    session = answerQuestion(flow, session, 'app');
    session = answerQuestion(flow, session, 'yes');
    expect(session.current).toBe('slow_app_fix');
    expect(session.fixes).toHaveLength(0);
    const solved = verifyFix(flow, session, 'fixed');
    expect(solved.outcome).toBe('solved');
    expect(solved.history.slice(0, 4)).toEqual(readings);
  });
  it('requires an identifiable nonessential app before suggesting a startup action', () => {
    const scope = answerQuestion(flow, normalReadings(), 'startup');
    const unknown = answerQuestion(flow, scope, 'unsure');
    expect(unknown.outcome).toBe('solution_not_found');
    expect(unknown.fixes).toHaveLength(0);
    expect(unknown.causes.find((cause) => cause.id === 'startup')!.status).toBe('possible');
    const known = answerQuestion(flow, scope, 'known');
    expect(known.current).toBe('startup_fix');
    expect(verifyFix(flow, known, 'fixed').outcome).toBe('solved');
  });
  it.each(['no_change', 'could_not_complete', 'worse'] as const)(
    'does not turn a %s app action into success',
    (result) => {
      let session = normalReadings();
      session = answerQuestion(flow, session, 'app');
      session = answerQuestion(flow, session, 'yes');
      const completed = verifyFix(flow, session, result);
      expect(completed.outcome).toBe('solution_not_found');
      expect(completed.history.slice(0, -1)).toEqual(session.history);
      expect(completed.stopReason).toBe(result === 'worse' ? 'worse' : 'exhausted');
    },
  );
});

it('a working replacement display requires verification without claiming the cable is faulty', () => {
  const flow = getFlow('monitor')!;
  let session = startSession(flow, intake);
  for (const answer of ['yes', 'right', 'no', 'works'])
    session = answerQuestion(flow, session, answer);
  expect(session.current).toBe('replacement_fix');
  expect(session.outcome).toBe('in_progress');
  expect(session.causes.find((cause) => cause.id === 'cable')!.status).toBe('possible');
  expect(session.causes.find((cause) => cause.id === 'display_path')!.status).toBe('likely');
  expect(verifyFix(flow, session, 'fixed').outcome).toBe('solved');
  expect(verifyFix(flow, session, 'no_change').outcome).toBe('solution_not_found');
  expect(verifyFix(flow, session, 'improved').outcome).toBe('partially_solved');
});
