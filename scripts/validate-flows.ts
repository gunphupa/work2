import { flows } from '../src/data/flows';
import { validateFlow } from '../src/engine/validate';
let count = 0;
for (const flow of flows) {
  const errors = validateFlow(flow);
  count += errors.length;
  if (errors.length) console.error(flow.id, errors);
}
console.log(
  `Validated ${flows.length} flows and ${flows.reduce((n, f) => n + f.nodes.length, 0)} nodes; ${count} errors.`,
);
process.exitCode = count ? 1 : 0;
