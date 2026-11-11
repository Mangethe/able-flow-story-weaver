# ABLE-FLOW Story Weaver

An offline branching story with automatic single-switch scanning. Open `index.html`
directly to play, or serve this directory on localhost/HTTPS for PWA installation.
No build, package installation, external fonts, scripts or story downloads are
needed to run the app.

## Five-command/action quickstart

Prerequisites: Git, Node.js/npm and an install-capable browser. No Supabase account
or environment variable is needed. The first `npx` invocation needs internet to
download the static server; classroom operation does not.

1. **Clone** (terminal): `git clone https://github.com/Mangethe/able-flow-story-weaver.git`
2. **Serve** (same terminal): `npx --yes serve@14.2.4 able-flow-story-weaver --listen tcp://127.0.0.1:8787`
3. **Open** (browser address bar): `http://127.0.0.1:8787/`
4. **Install PWA** (browser action): choose **Install ABLE-FLOW** when offered, or
   the browser's **Install app / Add to Home screen** command. Wait for **Saved for
   offline use** before disconnecting.
5. **Run accessibility checklist** (manual action): follow
   [docs/accessibility-checklist.md](docs/accessibility-checklist.md) on the intended
   tablet or school browser and record the results. Judges use the same checklist.

Steps 4–5 are browser/manual commands, not shell commands. Stop the preview server
with Ctrl+C when finished. If the folder already exists, serve that checkout
instead of cloning over it. Service workers do not operate under `file://`.

For tablets accessing a school server over the LAN, use the HTTPS deployment in
[docs/deploy.md](docs/deploy.md); the tablet's `localhost` points to the tablet.
See the [one-slide production roadmap](docs/production-roadmap.svg) and its
[text equivalent](docs/production-roadmap.md).

## First-launch story and seed data

[seed/stories/folktale-1.json](seed/stories/folktale-1.json) contains **Tortoise and
the quiet garden**, an original, short folktale-style example with two endings.
It is not attributed to a particular cultural tradition. Its identical embedded
copy in `index.html` provides content on the first launch, including from `file://`;
the app does not fetch the JSON file at runtime. No database seeding is required.

To edit the story, update the seed JSON and the `const story` object in
`index.html` together, preserve stable node/choice IDs, increment the story version
for incompatible changes, and bump `VERSION` in `sw.js`. The automated check rejects
seed/embedded-content drift. Draft SSL gloss remains unverified and needs language
review. The new story ID starts a new story rather than restoring the earlier
`quiet-garden` demonstration's progress.

## Controls

- Space or Enter starts scanning. Wait for the desired button to be highlighted,
  then press again to select. Holding a key cannot repeat a selection.
- Scan speed is adjustable through a scannable button. The default interval is
  configured in milliseconds with `data-scan-interval="2000"` on `<body>`; a saved
  speed preference overrides this default. Invalid intervals fall back to 2000 ms.
- Pause scanning is part of the scan cycle. Resume uses the same switch.
- Tab pauses scanning for ordinary keyboard navigation. Space/Enter still activates
  the focused button. Hiding the page stops scanning until explicit resume.
- Go back and Start again are available as the story progresses. Progress and
  preferences are stored locally when storage is available; otherwise play continues
  in memory.

## Source layout

- `index.html`: inline styles, scanner, story data/validator, original SVG symbols,
  gloss rendering, local persistence and optional installation/update controls.
- `manifest.json`, `icons/`: local PWA metadata and book-shaped installation icons.
- `sw.js`: versioned, scope-specific app-shell cache. Bump `VERSION` whenever a
  precached file changes. Updates wait for an explicit action that saves progress.
- `tests/`: separate Node/jsdom QA scripts, never loaded by the application.

The embedded `story` object has `storyId`, `version`, `title`, `signLanguage`,
`startNodeId` and keyed `nodes`. Each node has `id`, `title`, `text`, `aacIconRef`,
`sslGloss`, `ending` and `choices`. Each choice has `id`, `text`, `aacIconRef`,
`sslGloss` and `targetNodeId`. Ending nodes have no choices. The validator rejects
missing destinations, duplicate choice IDs, unreachable nodes, unsupported symbols
and nodes with no route to an ending.

The scanner uses one `scanIndex` and one `setInterval`. Each tick advances one
enabled visible button in document order, then wraps. Space/Enter invokes
`selectCurrent()`, clears the interval before activation, and renders the chosen
branch. Scanning restarts immediately at index zero of the new controls, with no
reading-delay timer. The first choice is index zero at the start; Go back is index
zero at an ending. Focus, `aria-current="true"` and the visible outline always
identify the same scanned button. Held keys cannot advance or select again until
released. Stale callbacks from an old interval cannot advance a replacement loop.

The states are READY → SCANNING → ACTIVATING, with RENDERING during branch
replacement. Pause/Tab enters PAUSED; hiding or blurring enters SUSPENDED. Both
require explicit resume. All enabled visible buttons, including installation/update
controls when available, participate in the scan cycle.

The example SSL gloss is draft text with no sign language specified. It is labeled
as unverified and needs review by an appropriate language expert before real use.

Milestones A–D are implemented with automated verification. A native Chrome
Spacebar-only run passed both branches, pause/resume, Back, replay and visible scan
outlines on 2026-11-12. Browser DevTools Offline and installation checks remain
pending. Optional Supabase sync (E) is implemented and inactive by default. See
[VERIFICATION.md](VERIFICATION.md) for milestone results, QA setup and the remaining
browser checklist.

## Optional progress sync

Before the main inline script runs, an integrator may supply
`window.ABLE_FLOW_CONFIG` with `supabaseClient` (an already authenticated Supabase
client) and `profileId` (that session's user ID). Both default to null. The matching
`learner_profiles` row must already exist. No SDK download, keys, sign-in UI or
profile provisioning is added to the story app.

Every choice saves the path, exact choice history and local `updatedAt` to
`localStorage` synchronously, then fires an unawaited `story_progress` upsert only
when online and configured. The server maintains its own `updated_at`. On startup,
one unawaited query fetches that profile/story's latest row. Valid remote progress
merges into local storage and the display only when its timestamp is strictly
newer than the latest local save, including saves made while the query was pending.
Equal/older records leave local progress untouched. Legacy local saves without a
timestamp can be replaced by valid timestamped remote progress.

There is no real-time subscription, polling, reconnection queue or retry loop.
Supabase failures are caught and logged; local play continues. If the browser
denies local storage, play continues in memory as before. Configuring sync enables
remote transmission of progress; leaving the configuration empty keeps play local.

## Structured security-review gate

`.codex/security-schema.json` is the output contract for the Codex SDK review.
The SDK runner supplies it through `thread.run(prompt, { outputSchema })`, then
validates the result before writing `findings.json`. The CI gate independently
validates the same schema. It accepts this shape:

```json
{
  "findings": [
    {
      "severity": "high",
      "file": "index.html",
      "line": 42,
      "description": "The vulnerability, exploit conditions and security impact."
    }
  ]
}
```

All four fields are required; severity is `critical`, `high`, `medium` or `low`,
and line is a positive integer. Unexpected fields are rejected. A successful
review with no findings returns `{"findings":[]}`. Free text, markdown-fenced JSON,
missing fields, missing output and API failures fail the check instead of being
treated as a clean review. Critical findings fail CI; other severities retain the
existing nonblocking policy.

The workflow uses pinned CI-only SDK/validator dependencies and needs the
`OPENAI_API_KEY` GitHub Actions secret. Fork PRs without access to that secret cannot
complete the review; they are not silently marked clean. Make the `review` job a
required branch-protection check if it should prevent merging. The application
itself still has no build or runtime dependency.

Contract tests run with `node --test tests/security-review.test.cjs` after the CI
dependencies are installed (or with `NODE_PATH` pointing at the temporary QA
directory). Five tests cover severity validation, required fields, malformed/free-
text rejection, SDK schema forwarding, and CLI pass/fail behavior. A live API review
was not executed during local verification.
