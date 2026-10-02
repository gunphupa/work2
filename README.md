# FixFlow V1

A bilingual, adaptive Windows troubleshooting application. FixFlow uses an explicit diagnostic graph to collect observations, narrow possible causes, recommend supported actions, and verify the result. It never scans or changes the user's computer.

## Run the application

Use Node.js 22.18+ (Node 24 was used for validation) and npm.

```bash
npm ci
npm run dev
```

For a production server:

```bash
npm run build
npm start
```

The server uses port 3000 by default. Add `-- --port 3100` to `npm run dev` or `npm start` to choose another port. In this cloud workspace, run commands from `/workspace/work2`. If the default npm cache is unavailable, use `npm ci --cache /workspace/.npm-cache`.

No credentials or database are required for the guided diagnostic workflow. There are no accounts, remote control, background hardware scans, or automatic session history. Active sessions live in React memory and reset on navigation away or reload. English is the initial language; the header switches the full interface and flow content to Thai without discarding an active session.

## What is implemented

- 15 end-to-end diagnostic flows, with 140 question and fix nodes.
- Adaptive paths, qualitative cause statuses, evidence history, and relevant explanations.
- Single choice, multiple symptom selection, numeric memory readings, free-text context, Other, and Not sure guides.
- Explicit verification for every action: fixed, improved, unchanged, worse, and unable to complete.
- Failed actions preserve prior evidence and continue to an unvisited check. Unsafe symptoms and worsening results stop the investigation.
- Review and acknowledgement before caution actions. No BIOS flashing, registry edits, drive formatting, or forced repair commands.
- English/Thai responsive interface, a How It Works page, and an About page explaining the research question.
- Optional constrained AI interpretation, with local English/Thai matching when no key is configured or the service fails.
- Anonymous feedback, retry deduplication, private file storage, and CSV/JSON exports with descriptive statistics.
- Downloadable local session summaries. These may contain the user's own notes, so the interface asks users to review them before sharing.

| Category    | Flows                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------- |
| Performance | Slow computer, freezes, high CPU, high memory, high disk activity, overheating, game lag |
| Network     | Wi-Fi unavailable, slow internet                                                         |
| Audio       | Microphone unavailable, no sound                                                         |
| Hardware    | USB device not detected, monitor no signal                                               |
| Windows     | Startup problems, device/driver problems                                                 |

## Architecture

`src/data/` contains bilingual data-driven flow graphs. `src/engine/` owns navigation, cause updates, evidence, and verification. UI components render these definitions instead of implementing diagnostic branches. The home page loads only catalog metadata; a diagnostic route receives the selected flow.

```text
src/app/          Next.js pages and server API routes
src/components/   Shared forms, diagnostic screens, feedback, and layout
src/data/         Catalog, typed flow definitions, and builders
src/engine/       Immutable session transitions and graph validation
src/types/        Diagnostic domain types
src/i18n/         English/Thai interface messages
src/ai/           Local matching and validated optional AI interpretation
src/lib/          Feedback schema/storage, request guards, and export helpers
tests/            Engine, AI, feedback, HTTP, and browser tests
scripts/          Flow validation and private feedback export
```

Session context and reported text never masquerade as observed test results. AI can propose only approved problem IDs and a small set of reported symptom tags. The user confirms a starting path; the diagnostic engine remains authoritative. The graph validator checks translation presence, duplicate IDs, links, cause references, reachability, cycles, range mappings, and safe fallbacks.

## Optional AI

Copy `.env.example` to `.env.local` and set values securely on your own machine or through the hosting environment. Never commit that file.

| Variable           | Purpose                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `FIXFLOW_AI_KEY`   | Optional server-side OpenAI API key. `OPENAI_API_KEY` is also recognized if supplied outside this cloud configuration. |
| `FIXFLOW_AI_MODEL` | Optional model with strict JSON schema support; defaults to `gpt-4.1-mini`.                                            |
| `FIXFLOW_DATA_DIR` | Optional feedback directory. Defaults to `.data` under the application working directory.                              |

Only the server calls `https://api.openai.com/v1/chat/completions`. Cloud environments with restricted egress need `api.openai.com` allowed before enabling AI. No key is sent to the browser. Do not use a `NEXT_PUBLIC_` variable for a credential.

The AI request uses a fixed system policy, strict structured output, allowed values, runtime validation, and an eight-second timeout. Unknown procedures or extra response fields are discarded. Missing credentials use local matching; errors fall back to local matching and a notice. All button-driven checks remain functional. Local matching is intentionally limited and may ask the user to choose a category. A live provider call has **not** been validated because no API key was supplied; the integration and failure behavior are tested with controlled responses.

Free-text descriptions are sent to the app server; enabling AI also sends them to the provider. The interface explains this and asks users not to include personal information, passwords, or recovery keys. Descriptions and diagnostic button answers are not stored with feedback.

## Feedback and competition results

Feedback is opt-in at the end of a session. It stores the selected flow/category, outcome, reported success, three 1–5 ratings, steps, duration, language, optional comment, timestamp, and a random session ID used solely to deduplicate retries. It does not store diagnostic notes, names, emails, IP addresses, or precise location. Hosting infrastructure may have its own request logs.

There is deliberately no public results-read API. The project owner exports records from the server command line:

```bash
npm run --silent feedback:export -- --summary
npm run --silent feedback:export > results.json
npm run --silent feedback:export -- --csv > results.csv
```

Run exports from the application directory with the same `FIXFLOW_DATA_DIR` as the server. Exports omit random session IDs. CSV escaping protects quoted comments and spreadsheet formula prefixes. Exported comments may still contain personal information volunteered by a tester; review them before publication.

Statistics describe **submitted feedback**, not every session or every visitor. Empty results are empty; the app never seeds experimental results or invents success rates. Browser test feedback uses `/tmp/fixflow-e2e-feedback`, separate from the app's default `.data` directory.

The default file store is appropriate for development and a small, single-process competition demo. Use a persistent disk and backups if collecting real results. Ephemeral serverless filesystems and multiple instances need a production database. Implement `FeedbackStore` using a server-side database client, enforce a unique `sessionId`, restrict read access to the owner, and preserve validation. For Supabase, keep service credentials server-side and disable anonymous table reads; route validated writes through the existing server endpoint. Do not expose service keys or grant public read access to feedback. Production public deployment also needs edge rate limits; current limits are per process.

## Validation

```bash
npm run validate:flows
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests exercise the production build and start their own server on port 3100. This cloud environment already provides `/usr/bin/chromium`; the Playwright configuration uses it. Elsewhere run `npx playwright install chromium` once, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed compatible Chromium binary. The browser download requires network access to Playwright's official distribution hosts.

The automated suite covers every flow's graph and transitions, end-to-end completion for all 15 flows, uncertainty and Other paths, failed fixes, caution gates, safety stops, malformed AI responses, API failures, feedback retry behavior, exports, English/Thai, mobile overflow, and accessibility checks. Automated accessibility checks are supplemented by visual review; they do not replace testing with assistive technology.

Formatting: `npm run format` or `npm run format:check`.

## Scope and next steps

- Diagnostic content uses user-reported observations. Automated software tests do not validate a physical PC repair or establish scientific effectiveness. Run supervised Windows 10/11 participant trials and have a qualified technician review the diagnostic content before making competition outcome claims.
- A successful action makes a cause more plausible; it is not a definitive hardware diagnosis. The app presents uncertainty and offers official support when evidence runs out.
- Menu labels can vary by Windows edition, update, and display language. Native Thai terminology review and broader Windows device trials would strengthen the content.
- Windows 10's servicing/support status depends on edition and support plan; offering a troubleshooting flow does not extend Microsoft's product support.
- Public hosting and publishing a cloud environment version are separate steps from preparing this application. Follow the hosting provider's deployment instructions and use persistent storage for real feedback.
- Useful next improvements are technician-reviewed flow expansion, a durable database for multi-instance hosting, and measured participant trials. Accounts, session history, additional operating systems, and remote hardware access are outside V1.
