# ABLE-FLOW Story Weaver

ABLE-FLOW is an offline branching-story prototype for learners who benefit from
single-switch access and educators who support accessible literacy. It presents
short choices with text and optional AAC symbols; a learner can wait for automatic
scanning and select with Space or Enter. The story, styles and app logic live in
one `index.html`, so the core story can run without a network or application
runtime dependencies.

The educational hypothesis is that learner-controlled, switch-accessible stories
with local progress may make interactive reading easier to offer in settings with
limited connectivity. This prototype has not measured classroom participation,
literacy outcomes, learner preference or educator workload. Those benefits remain
hypotheses pending review with intended learners and educators.

## Current status

| Area | Implemented | Verified | Planned / evidence still needed |
| --- | --- | --- | --- |
| Story and access | One original short story, two endings, automatic switch scanning, inline SVG symbols, Back/Restart and scannable display preferences | Automated scan and branch checks; Edge desktop Spacebar checks for both endings | Test symbols, wording and sustained use with intended learners and educators; consider expanding content only after that review |
| Offline PWA | Local manifest, icons, service worker, versioned app-shell cache and local progress | Automated worker/cache checks; Edge reload and saved progress recovery with the local server stopped | Installed cold start with network disabled on the target device; DevTools Offline and complete target-device checklist |
| Optional progress sync | Local-first saves; serialized, coalesced retries; server revisions and mutation IDs; explicit conflict choices | Mocked client tests and rollback-only database ownership/CAS checks | Real client/session provisioning and classroom workflow; sync stays optional |
| Accessibility | Keyboard and single-switch controls, visible scan outline, forced-colors styling, adjustable scan speed | Automated focus alignment; partial Edge forced-colors and 200% zoom inspection | NVDA/TalkBack spoken announcements and full checks on the deployment device |
| Review and CI | Structured Codex security-review gate and separate deterministic application-test workflow | The application workflow has a successful GitHub Actions run for application commit `d7dc5383e89a414eb3ffaef45670bdef275ab808`; security contract has local tests | The application run covers current `HEAD`; verify the separate security workflow on a future run and decide whether it is a required merge check |

“Verified” describes only the evidence named in that cell. It does not mean the
full release checklist passed. See [the detailed verification record](VERIFICATION.md)
and [current accessibility results](docs/accessibility-results.md).

## Quickstart

Prerequisites: Git, Node.js/npm and an install-capable browser. No Supabase account
or application package install is needed. The first `npx` server invocation needs
internet to obtain `serve`; classroom storytelling does not.

1. Clone: `git clone https://github.com/Mangethe/able-flow-story-weaver.git`
2. Serve: `npx --yes serve@14.2.4 able-flow-story-weaver --listen tcp://127.0.0.1:8787`
3. Open `http://127.0.0.1:8787/` in the browser.
4. Install using **Install ABLE-FLOW** or the browser’s install command. Wait for
   **Saved for offline use**.
5. Run and record [the manual accessibility checklist](docs/accessibility-checklist.md)
   on the intended tablet or school browser. Judges can use this same checklist.

Steps 4 and 5 are browser/manual actions. Stop the preview server with Ctrl+C.
Service workers require localhost or HTTPS; direct `file://` use supports local
storytelling but does not install the PWA. For a school LAN deployment, see
[docs/deploy.md](docs/deploy.md). The deployment roadmap is shown in
[one slide](docs/production-roadmap.svg), with a [text equivalent](docs/production-roadmap.md).

## Intended users and access problem

The intended learners are people who can engage with a short branching story but
may need a single-switch way to move among choices. Educators are the people who
select or facilitate stories and configure symbol/gloss presentation. These are
the product's intended roles; the repository does not specify learner ages,
diagnoses, schools, languages, or local support arrangements. Those details need
confirmation from you and the intended educational community before making more
specific beneficiary claims.

Conventional choice-based web stories expect pointing, touch, or repeated keyboard
navigation and may depend on a continuous network. Here, one button is highlighted
at a time and the learner can select it with a single key. The story is embedded
in the page and progress is saved locally, so the core interaction does not depend
on cloud sync. This is an access design goal; its classroom impact has not yet been
evaluated.

## Story, symbols and language

The first-launch story is [Tortoise and the quiet garden](seed/stories/folktale-1.json),
an original short folktale-style example with two endings and no claimed cultural
provenance. Its data is also embedded in `index.html`; the app does not fetch the
seed JSON at runtime. Node/choice text labels remain present when symbols are on
or off. Symbols use inline SVG. Draft SSL gloss is hidden by default and explicitly
unverified; it must be reviewed by an appropriate language expert before real use.

Before adding a larger content library, test the symbols and language with intended
learners and educators. Record what they understood, where they hesitated, and what
they recommend changing. Do not present unreviewed gloss as validated language.

## Architecture and development

- `index.html`: all app CSS and JavaScript, story validation/rendering, switch
  scanner, inline symbols, local progress and optional sync adapter.
- `manifest.json`, `icons/`, `sw.js`: install metadata, local icons and scoped,
  versioned app-shell caching. Increment `VERSION` when a precached resource changes.
- `seed/stories/`: authoring copy of the first story; update its embedded copy in
  `index.html` at the same time. Automated checks detect drift.
- `tests/`: Node/jsdom verification harnesses, not runtime dependencies.
- `.github/workflows/application-tests.yml`: deterministic application checks.
- `.github/workflows/codex-security.yml`: SDK-driven structured security review.

For development commands and milestone history, see [VERIFICATION.md](VERIFICATION.md).
For sync behavior and database assumptions, see [docs/sync.md](docs/sync.md).
For deployment steps, see [docs/deploy.md](docs/deploy.md).
For an independent setup checklist, educator feedback prompts, pilot measures and
the current licensing decision, see [docs/adoption-guide.md](docs/adoption-guide.md).

The scanner has one `scanIndex` and one interval. Space/Enter selects the current
visible enabled button; rendering stops the old timer and restarts at index zero.
The focused button carries `aria-current="true"` and a visible outline. Scan speed
can be changed through the controls; the initial interval is `data-scan-interval="2000"`.

## Optional Supabase progress sync

Sync is inactive by default. An integrator may provide `window.ABLE_FLOW_CONFIG`
before the inline app script runs, with an already-authenticated `supabaseClient`
and its `profileId`. The matching learner profile must already exist. The app does
not include sign-in or profile provisioning, fetch a Supabase SDK, or require
project keys for local storytelling.

Every action writes local progress synchronously. When configured and online, one
background save runs at a time and newer actions replace the pending snapshot.
Server revisions and mutation IDs order writes and make retries idempotent. A
revision conflict preserves local work and offers explicit scannable choices to
keep this device's progress or use a backed-up cloud state. Device timestamps do
not determine which branch wins. See [docs/sync.md](docs/sync.md).

## Verification and limitations

The application workflow pins Node 24.11.0 and jsdom 29.1.1 and runs
`node tests/verify.cjs E`. Its latest inspected successful run is
[GitHub Actions run 43123168557](https://github.com/Mangethe/able-flow-story-weaver/actions/runs/43123168557),
on application commit `d7dc5383e89a414eb3ffaef45670bdef275ab808` (November 11, 2026). This is the current `HEAD`; the application files are unchanged locally. The local verification record reports 42 grouped application checks. Current uncommitted documentation edits were not covered by the Actions run. The security workflow needs `OPENAI_API_KEY`; its CI result is not established by that application-test run.

Known evidence gaps:

- Classroom outcomes and educator workload have not been measured.
- Symbols, story wording and draft gloss have not been validated with intended
  learners, educators or a sign-language expert.
- NVDA/TalkBack announcements have not been manually verified.
- Full accessibility checks and installed offline cold start have not passed on a
  low-end Android tablet or the school deployment browser. Release remains blocked
  until required checks are completed and recorded in
  [docs/accessibility-results.md](docs/accessibility-results.md).
- The nginx configuration has not been executed on a school server. Real Supabase
  client provisioning and classroom auth use remain integration work.

No measured learning or classroom benefit is claimed by this prototype. Treat
potential benefits as hypotheses until evidence from the intended community is
recorded.
