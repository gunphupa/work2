import { flows } from '../src/data/flows';
import { auditEndings } from '../src/engine/audit';
import { recommendations } from '../src/engine/recommendations';
console.log('Terminal-branch audit (representative histories, not real-world diagnostic success)');
console.table(
  flows.map((flow) => {
    const endings = auditEndings(flow);
    const unresolved = endings.filter(
      (s) => s.outcome !== 'solved' && !['safety', 'worse', 'invalid'].includes(s.stopReason ?? ''),
    );
    const missing = unresolved.filter((s) => recommendations(flow, s).length === 0).length;
    if (missing) process.exitCode = 1;
    return {
      flow: flow.id,
      terminalBranches: endings.length,
      unresolved: unresolved.length,
      withNextSteps: unresolved.length - missing,
      safetyStops: endings.filter((s) => ['safety', 'worse'].includes(s.stopReason ?? '')).length,
      missing,
    };
  }),
);
