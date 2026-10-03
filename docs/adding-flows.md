# Extending a diagnostic flow

Add catalog metadata in `src/data/catalog.ts`, a typed flow in the relevant data module, and export it through `src/data/flows.ts`. If adding a new category ID, update the AI enum and feedback schema deliberately; never allow an AI response to create arbitrary flow IDs.

Each question needs English and Thai titles, an explanation of why it matters, instructions a beginner can follow, approved answer destinations, and cause effects justified by that answer. The builders add an explicit Not sure fallback and an Other option with required detail. Unknown answers must not eliminate causes.

Each fix needs an observed rationale, ordered instructions, a verification question, an undo/stop explanation, and a later fallback. Caution actions require an acknowledgement enforced by both UI and engine. The `safety_stop` destination ends testing; `unresolved` opens evidence-based follow-up guidance without claiming a solution. Graphs are acyclic so a failed action cannot repeat earlier questions.

Add context-dependent recommendations in `src/engine/recommendations.ts` for uncovered cases. Explain why, what to do, and how to interpret the observation in both languages. Use recorded answer IDs to exclude completed or contradictory checks; do not infer observations from notes. Unsuccessful follow-ups must not be repeated. Waiting and support handoffs cannot be marked as verified fixes. Safety and worsening outcomes must not suggest more procedures. Keep follow-ups non-destructive and reversible; riskier actions belong in a reviewed graph with explicit caution handling. `npm run audit:endings` must show zero unresolved branches without guidance.

Optional AI only orders server-eligible recommendation IDs. The server replays validated answer IDs rather than trusting client-supplied diagnoses. Do not expand the AI response schema to arbitrary commands, URLs, or success claims. Ask users explicitly before sending their recorded checks, and preserve useful offline behavior.

Confidence defaults to “very likely” only after a user reports that a supported action fixed the original problem. Use `confidenceOnSuccess: 'possible'` for a verification-only node that does not establish a cause. Never use arbitrary probability percentages.

Run `npm run validate:flows`, `npm test`, type checking, and appropriate browser scenarios. Review Windows instructions against current official documentation and test wording with beginners in both languages. Exclude destructive fixes from V1 rather than hiding them behind a generic disclaimer.
