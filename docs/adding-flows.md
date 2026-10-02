# Extending a diagnostic flow

Add catalog metadata in `src/data/catalog.ts`, a typed flow in the relevant data module, and export it through `src/data/flows.ts`. If adding a new category ID, update the AI enum and feedback schema deliberately; never allow an AI response to create arbitrary flow IDs.

Each question needs English and Thai titles, an explanation of why it matters, instructions a beginner can follow, approved answer destinations, and cause effects justified by that answer. The builders add an explicit Not sure fallback and an Other option with required detail. Unknown answers must not eliminate causes.

Each fix needs an observed rationale, ordered instructions, a verification question, an undo/stop explanation, and a later fallback. Caution actions require an acknowledgement enforced by both UI and engine. The `safety_stop` destination ends testing; `unresolved` ends without claiming a solution. Graphs are acyclic so a failed action cannot repeat earlier questions.

Confidence defaults to “very likely” only after a user reports that a supported action fixed the original problem. Use `confidenceOnSuccess: 'possible'` for a verification-only node that does not establish a cause. Never use arbitrary probability percentages.

Run `npm run validate:flows`, `npm test`, type checking, and appropriate browser scenarios. Review Windows instructions against current official documentation and test wording with beginners in both languages. Exclude destructive fixes from V1 rather than hiding them behind a generic disclaimer.
