# Codex in ABLE-FLOW development

This is a retrospective assembled from the checked-in repository, its reachable
commit history, the GitHub Actions records inspected for this project, and the
conversation evidence available when this document was written. It is not a
transcript of every development session. Explanations marked **Retrospective**
describe the apparent engineering reason for a change; they are not quoted
original prompts or an assertion that a particular Plan mode session occurred.

## Working contract and planning

### Accessibility, offline use and a single-file app

- **Requirement / context:** [AGENTS.md](../AGENTS.md) requires keyboard and
  single-switch reachability, offline-first behavior, inline CSS/JavaScript in
  `index.html`, and a manual release checklist. The user supplied these constraints
  directly in the conversation. They rule out requiring a build service or cloud
  connection for core storytelling.
- **Decision:** The application remains a single HTML file, with the manifest,
  service worker, icons and story-authoring seed as separate static PWA/handoff
  artifacts. Supabase is optional.
- **Implementation:** [index.html](../index.html), [manifest.json](../manifest.json),
  [sw.js](../sw.js), [docs/accessibility-checklist.md](accessibility-checklist.md),
  and [docs/deploy.md](deploy.md).
- **Verification / limits:** The current suite exercises file/static contexts and
  worker caching. The latest inspected GitHub application workflow run is tied to
  an earlier commit; it is not evidence that the current working tree has passed
  CI. The full target-device release checklist remains incomplete.
- **Retrospective:** Making these constraints explicit in AGENTS.md gives future
  Codex work a durable project contract instead of relying on conversational
  memory. There is no evidence here of a saved Plan mode session or a complete
  original planning transcript.

### Milestone planning and handoff

- **Requirement / context:** The conversation requested work in milestones A–E:
  scanner and shell, story rendering, inline AAC/South African Sign Language gloss,
  offline PWA, then optional sync only after local functionality.
- **Decision:** Keep story operation independent from sync, and verify each stage
  before proceeding. The milestones describe staged work; the exact sequencing of
  every implementation edit is not fully reconstructable from Git history.
- **Implementation:** The milestone checklist and subsequent qualifications are
  recorded in [VERIFICATION.md](../VERIFICATION.md); current usage and setup are
  in [README.md](../README.md).
- **Verification / limits:** Automated milestone results are recorded in the
  verification log. Manual results are labeled by browser and date. Historical
  entries may describe earlier behavior (for example timestamp comparison); use
  later sections and [docs/sync.md](sync.md) for current behavior.
- **Retrospective:** The milestones helped bound a growing prototype into
  inspectable deliverables. They are not evidence that a formal planning tool or
  Codex Plan mode was used.

## Implementation and debugging

### Deterministic switch scanning

- **Requirement / failure scenario:** The conversation called out the risk of a
  nondeterministic or uninterruptible scan loop: focus should stay on the current
  item; selection should stop the old interval; after branch rendering scanning
  should restart at index zero.
- **Context and decision:** Use one `scanIndex`, one configurable
  `setInterval`, and Space/Enter selection. Keep focus, `aria-current="true"`, and
  the visible outline synchronized. This decision is also spelled out in the
  scanner comments and tests; no original prompt wording is inferred here.
- **Implementation:** Scanner state and transition handling live inline in
  [index.html](../index.html). Tests for timer count, interval configuration,
  focus/current alignment, held keys and stale callbacks live in
  [tests/verify.cjs](../tests/verify.cjs).
- **Verification / limits:** Automated tests execute the inline application in a
  DOM harness. Native browser Spacebar sessions are described in
  [VERIFICATION.md](../VERIFICATION.md) and
  [docs/accessibility-results.md](accessibility-results.md). Edge desktop checks
  do not replace unplugged-switch testing or the target-device checklist.

### Forced-colors outline and viewport-edge failure

- **Failure scenario:** In the Edge session recorded in this conversation, actual
  `forced-colors: active` emulation exposed an outline that touched the viewport
  edge while a scanned control was brought into view.
- **Decision:** Preserve the browser's system highlight outline and give buttons
  scroll margin so the outline has room after automatic scrolling.
- **Implementation:** The button rule in [index.html](../index.html) sets
  `scroll-margin: 1rem`; the forced-colors rule uses the system `Highlight` color.
- **Verification / limits:** The conversation records a manual retest of
  Pause scanning and Draft gloss preview in Edge, plus 42 grouped local application
  checks. The recorded test did not cover every target device, browser, branch and
  control; the manual record retains those as open checks.

### Ordered, retryable progress sync

- **Requirement / failure scenario:** The conversation identified independent
  upserts arriving out of order, offline saves not retrying on reconnect, device
  clocks being unsuitable for conflict ordering, and local keys not being
  separated by profile/story/version.
- **Decision:** Save synchronously on the device, then serialize best-effort cloud
  work. Coalesce later actions into the latest pending snapshot. Use server
  revisions and idempotent mutation IDs for ordering and retry; show an explicit
  conflict choice rather than silently resolving divergent paths by timestamp.
- **Implementation:** The adapter is inline in [index.html](../index.html). The
  database change is
  [20261112000200_versioned_progress_revisions.sql](../supabase/migrations/20261112000200_versioned_progress_revisions.sql).
  Policy and failure modes are documented in [docs/sync.md](sync.md). The comment
  `// SYNC: best-effort, never blocking` marks the async boundary for future edits.
- **Verification / limits:** [tests/sync.cjs](../tests/sync.cjs) and
  [tests/verify.cjs](../tests/verify.cjs) exercise behavior with mocked clients.
  The conversation and verification record report the SQL ownership/CAS checks
  were executed through Supabase in a rollback-only test. Those results do not
  demonstrate real learner data, classroom sign-in provisioning, two-device field
  use, or screen-reader usability.

### Service-worker updates and local-first behavior

- **Requirement / failure scenario:** A new static release must not replace an
  active story unexpectedly or discard the learner's current branch.
- **Decision:** Cache a scoped shell, wait for explicit update activation, and save
  progress before switching versions.
- **Implementation:** [sw.js](../sw.js) manages the app shell and activation;
  update controls and progress preservation are in [index.html](../index.html).
  [tests/worker.cjs](../tests/worker.cjs) covers cache/install/update scenarios.
- **Verification / limits:** Worker lifecycle is simulated in tests. The Edge
  conversation verified selection of the waiting update and reload behavior. A
  full installed offline cold start on a school device remains unverified.

## Review and CI

### Structured Codex security review

- **Requirement / failure scenario:** A CI gate needs machine-readable findings;
  free-form prose is not a reliable contract for a security decision.
- **Decision:** The SDK workflow supplies a structured output schema and validates
  the result before gating on critical findings.
- **Implementation:** [.codex/security-schema.json](../.codex/security-schema.json),
  [.github/scripts/security-review.cjs](../.github/scripts/security-review.cjs),
  [.github/scripts/security-contract.cjs](../.github/scripts/security-contract.cjs),
  and [tests/security-review.test.cjs](../tests/security-review.test.cjs), invoked
  by [.github/workflows/codex-security.yml](../.github/workflows/codex-security.yml).
- **Verification / limits:** Five local contract tests are reported in
  [VERIFICATION.md](../VERIFICATION.md). The workflow requires
  `OPENAI_API_KEY`. The checked-in workflow proves this gate is configured. No
  successful live AI security-review run is evidenced by the workflow records
  inspected for this retrospective, so none is claimed.

### Deterministic application CI

- **Requirement / failure scenario:** The conversation requested that the
  application verification suite run independently in GitHub Actions.
- **Decision / implementation:**
  [.github/workflows/application-tests.yml](../.github/workflows/application-tests.yml)
  installs pinned Node/jsdom QA dependencies in an isolated runner directory and
  runs `node tests/verify.cjs E` on pushes to main/master and pull requests.
- **Verification / limits:** GitHub Actions run
  [43123168557](https://github.com/Mangethe/able-flow-story-weaver/actions/runs/43123168557)
  completed successfully for application commit
  `d7dc5383e89a414eb3ffaef45670bdef275ab808` on November 11, 2026. This is the
  current `HEAD`, and the application files are unchanged in the local worktree.
  Current uncommitted documentation edits were not part of that run. It is an
  application-test run, not a Codex review run. No PRs were returned by the
  GitHub query inspected for this document. A successful live Codex review run
  is not evidenced.

## GitHub and Supabase MCP roles

**GitHub MCP:** The project conversation used GitHub integration capabilities to
inspect repository/Actions state. For this document, a read-only Actions query
confirmed the application run above, and a pull-request query returned no PR
records. The repository's Codex security workflow is a separate SDK integration;
its checked-in configuration does not prove that the API review completed
successfully. No PR review or release action is claimed here.

**Supabase MCP:** The project instructions in [AGENTS.md](../AGENTS.md) require
schema inspection before writing queries and require client calls to fail safely
for offline use. Earlier conversation requests explicitly used Supabase MCP to
inspect schema and create the learner/progress schema; later work applied the
version/revision migration and ran rollback-only database checks, as recorded in
[VERIFICATION.md](../VERIFICATION.md) and
[supabase/tests/ownership.sql](../supabase/tests/ownership.sql). The connected
Supabase project and its schema are configured integration evidence. Database
test execution is reported as demonstrated. This is distinct from the browser app:
it has no bundled SDK or sign-in UI, and no live classroom client provisioning or
learner progress sync was demonstrated.

## Documentation and handoff

- **Requirement / context:** The conversation requested materials so another
  person could run and judge the prototype, including quickstart, school-server
  deployment, seed data, an accessibility checklist, and an adoption roadmap.
- **Decision / implementation:** The repository now has
  [README.md](../README.md), [docs/deploy.md](deploy.md),
  [docs/accessibility-checklist.md](accessibility-checklist.md),
  [docs/accessibility-results.md](accessibility-results.md),
  [docs/production-roadmap.md](production-roadmap.md),
  [docs/production-roadmap.svg](production-roadmap.svg),
  [docs/sync.md](sync.md), and [seed/stories/folktale-1.json](../seed/stories/folktale-1.json).
- **Verification / limits:** Local path and command checks are recorded in the
  conversation. The nginx example has not been run on an actual school server.
  The roadmap SVG is the delivered slide artifact; prior verification records a
  failed presentation-service attempt and does not claim a saved slide deck.
  Accessibility results distinguish observed Edge behavior from outstanding
  target-device and reader tests.
- **Retrospective:** These materials make implementation assumptions, test limits
  and adoption steps inspectable to a new maintainer. They do not establish
  usability research, successful school deployment or measured outcomes.

## Evidence still needed

- Complete the manual checklist on the intended low-end Android tablet or school
  browser, including installed offline cold start and NVDA/TalkBack announcements.
- Obtain intended learner and educator feedback on story wording, AAC symbols and
  the switch-scanning pace; document consent and avoid identifying learners.
- Arrange qualified review of the draft SSL gloss before presenting it as usable
  language content.
- Run both GitHub workflows against the current revision and preserve their links.
- Validate the nginx configuration and optional authenticated sync in the actual
  school environment before describing those operations as field-tested.

## Genuine session material to add

To make this retrospective richer without fabricating records, supply genuine
artifacts if available:

- Screenshots of the original prompt/plan and milestone checkpoints, if retained.
- Screenshots or a short screen recording of the Edge Spacebar and forced-colors
  checks, with the device/browser context visible.
- A sanitized excerpt or link to the actual Supabase MCP migration/test result.
- A link or screenshot of a successful Codex security-review Actions run, if one
  exists; otherwise retain the current statement that such a run is unverified.
- Any real learner/educator evaluation notes, only if collected with appropriate
  consent and de-identification.
