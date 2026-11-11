# Milestone verification

The application has no build or runtime dependency. `tests/verify.cjs` is a separate
Node/jsdom QA harness; its dependencies are installed in a temporary directory.

```powershell
npm.cmd install --prefix C:\Temp\able-flow-qa --no-audit --no-fund jsdom
$env:NODE_PATH='C:\Temp\able-flow-qa\node_modules'
node tests/verify.cjs A
node tests/verify.cjs B
node tests/verify.cjs C
node tests/verify.cjs D
node tests/verify.cjs E
```

Automated DOM checks exercise the actual inline application script with network
requests blocked. They do not establish visual layout, native key default behaviour,
screen-reader usability, DevTools Offline, or browser PWA installation.

| AGENTS.md checklist | A | B | C | D |
| --- | --- | --- | --- | --- |
| Start-to-finish using Space | Scanner checks pass; story pending B | Both endings, Back and replay pass | Pass with symbols and gloss | Rechecked; install/update buttons also reachable |
| Runs with DevTools Offline | Simulated file/static contexts pass | Pass in simulation, including blocked file storage | Pass in simulation; no symbol requests | Simulated worker serves cached shell and assets offline |
| High contrast ≥4.5:1 | White/black text: 21:1; toggle passes | Rechecked, pass | Rechecked; SVG inherits text color | Rechecked, pass |
| AAC slots use inline SVG | Pending C | Pending C | Pass for node and choices | Rechecked, pass |
| Manifest, worker, installation | Pending D | Pending D | Pending D | Manifest/icons/registration/cache logic pass; browser installation pending |

Milestone A: 11 automated checks passed before B began. A test-library API mismatch
was corrected before this successful run. Browser verification was pending at that checkpoint.

Milestone B: 18 checks passed before C began. Includes both branches in both URL
contexts, bad data rejection, valid progress restoration and invalid progress reset.

Milestone C: 20 checks passed before D began. Includes SVG namespaces, local paths,
accessible choice labels, optional gloss, missing-symbol rejection and fallback.

Actual DevTools Offline and PWA installation remain browser verification tasks.
The later native Spacebar check below verifies storytelling and visible scan
outlines; zoom/reflow, screen-reader behaviour and other input modes remain pending.

Milestone D: 26 checks passed. Worker simulation verifies all four precache files,
offline root/index/query-string navigation, cached installation assets, ignoring
unrelated requests, retaining the old cache after failed installation, waiting for
an explicit update action, and deleting only obsolete caches for this app scope.
Application checks cover relative worker registration, direct-file registration
skip, install/update scan reachability, saving before update, and non-blocking
registration failure. PNG headers and dimensions are checked against the manifest.

Milestone E's optional progress adapter was subsequently implemented at the user's
explicit request; see the sync verification section below. The target schema was
re-inspected through Supabase MCP before writing client queries. There are no
embedded project keys or SDK downloads, and sync remains unconfigured by default.
The outstanding browser offline/install checks are still not recorded as passed.

## Remaining browser checks

Earlier browser-control attempts were blocked. The retry on 2026-11-12 succeeded
through a visible native Chrome window. The Spacebar-only portions of steps 1–2
passed as detailed below; the remaining portions and PWA installation are pending.

1. Open `index.html` directly. Use only Space: start scanning, choose either branch,
   confirm immediate focus at index zero (Go back), select Go back, complete the
   other branch, then Start again. Confirm the first choice is focused immediately
   after returning or restarting, with one outline and one current target.
   Repeat with Enter; verify held keys select once and Tab pauses automatic scanning.
2. Enable High contrast by scanning to its control. Inspect text, SVG strokes and
   focus outlines at 200% zoom and narrow viewport widths. Confirm that disabled
   controls are skipped. Hide/return to the tab and confirm explicit resume.
3. Serve the repository with `python -m http.server 8787 --bind 127.0.0.1`. Open
   `http://127.0.0.1:8787/`. Wait for “Saved for offline use.” In DevTools Application,
   confirm the worker, manifest, local 192/512 icons and four precache entries.
4. Check DevTools Network “Offline” and reload. Complete both branches with Space.
   Confirm no external resources are required, then repeat from the direct file.
5. Install from the browser menu or the app's Install control when offered. Launch
   the installed app offline and complete a story. Browser support varies; the
   missing install prompt must never block storytelling.
6. For update QA, change a visible word and bump `VERSION` in `sw.js`. Reconnect and
   reload/check for updates. Confirm the existing page waits, then scan to Save
   progress and update. Confirm the refreshed version restores the current branch.
   Recheck offline loading and restore the intended final files afterward.

Stop the temporary HTTP server when finished. These browser checks must pass before
claiming the full AGENTS.md checklist complete.

## Deterministic scan-loop revision

The reading-delay behaviour in the original milestone results above is superseded.
The current loop has one `scanIndex`, one `setInterval`, a configurable body
`data-scan-interval`, and a `selectCurrent()` entry point for Space/Enter. It clears
the old interval before activation, parks focus on a connected control during
rendering, then restarts immediately at index zero. Each current target receives
`aria-current="true"` and the scan outline. Pause/background suspension clears the
interval. Saved speed preferences override the attribute's initial default.

29 automated checks pass, including exact focus order over three wraps, interval
configuration, invalid configuration fallback, repeated-start timer count,
held-key protection at the new branch, stale-callback rejection, and both complete
Space-only branches in file/static DOM simulations. The service-worker cache
version is bumped to v2 for the changed application shell. Earlier manual attempts
were blocked by unavailable browser-host access and minimized Chrome windows.

## Native Spacebar-only verification — 2026-11-12

PASS for branching, pause/resume, Back, replay and visible scan outlines in native
Google Chrome, opening the current repository `index.html` directly from `file://`.
No extra permission prompt was required. Browser-host APIs remained unavailable,
but native control of a newly available, visible Chrome window succeeded.

Setup used the address bar to load the exact local file, then one click on the
noninteractive story heading to give the page keyboard input. From that point,
every app action used only Spacebar—no Tab, Enter, button clicks or DOM scripting.

Observed outcomes in native screenshots and page text:

- Space started automatic scanning and showed the first choice's outline.
- Scanning advanced beyond the first choice; Space selected High contrast, showing
  white text/SVG strokes on black and a clear yellow scan outline.
- Space selected Pause scanning, leaving a stable outline on Resume scanning;
  another Space resumed the loop.
- Space selected Listen to the water. “By the water” and “STORY COMPLETE” rendered,
  with Go back immediately outlined as index zero of the new control list.
- Space selected Go back. The two choices returned, with Listen to the water
  immediately outlined as index zero.
- After scanning advanced, Space selected Rest beneath the tree. “Under the tree”
  and “STORY COMPLETE” rendered, again with Go back immediately outlined.
- From the paused ending, Space resumed scanning; waiting one two-second interval
  and pressing Space selected Start again. The initial node returned with the
  first choice immediately outlined, and Back/Start again disabled.

The native accessibility focus field stayed stale on the address bar, so outcomes
were assessed from the rendered page, screenshots and actual Space-triggered
actions. Exact DOM focus/`aria-current` alignment, held-key protection and stale
timer rejection remain covered by the automated tests, rather than newly claimed
as separate manual passes. This run does not establish DevTools Offline, hosted
service-worker behaviour, installed-PWA operation, 200% zoom/reflow or screen-reader
usability. Optional sync verification is recorded separately below.

## Best-effort progress sync — 2026-11-12

36 automated checks pass with `node tests/verify.cjs E` (29 existing checks plus
seven grouped sync checks). All application calls are guarded by online/client/
profile availability and try/catch. Both sync functions carry the exact comment
`// SYNC: best-effort, never blocking`. The call sites use `void`, never await sync
before rendering or scanning. The service-worker version is v3 for the new shell.

Verified with mocked Supabase clients executing the real inline application:

- Offline/unconfigured/no-profile cases save immediately and make no client calls.
- Local storage already contains the choice before the upsert starts.
- Hanging reads/writes do not block rendering, scanning, Back, or later choices.
- The write uses the inspected profile/story unique key and exact choice IDs.
- Startup fetches are scoped to the configured profile and current story.
- Newer remote progress is persisted with the remote timestamp and displayed;
  equal/older timestamps leave local storage and the displayed node unchanged.
- A local choice made while the startup read is pending is compared at response
  time; an older response cannot overwrite it.
- Missing/invalid dates, invalid choices and wrong profile/story data are ignored.
- Network promise rejections and returned SDK errors are caught without UI errors.
- A newer pull arriving during scanning preserves one interval and restarts at
  index zero with aligned focus, outline and `aria-current`.

No real learner progress was sent during testing. Real anonymous-auth HTTP sign-in
and configured-client network integration were not exercised by these mocks.

## Repository handoff and seed story — 2026-11-12

The README now provides clone → `npx serve` → open → install → manual checklist
instructions. `docs/deploy.md` includes the static nginx configuration, trusted
HTTPS requirement, optional Supabase environment-variable explanation, deployment
verification and rollback procedure. The existing `AGENTS.md` reference points to
the same manual checklist that judges can complete.

The original folktale-style seed at `seed/stories/folktale-1.json` is embedded
identically in `index.html`. First launch does not fetch JSON or require database
seeding. The story ID is now `folktale-1`; legacy `quiet-garden` progress does not
restore into this different story. Both endings are still reachable using Space.
The service-worker shell version is v4.

37 application checks pass, including seed/embedded JSON equality, fresh first
launch with network requests blocked, both story branches, scanning, caching and
sync regressions. The nginx binary is unavailable on this development host; the
operator must run `nginx -t` on the school server. The roadmap SVG was rendered to
a temporary PNG and visually inspected as one 16:9 slide. It has an editable text
equivalent in `docs/production-roadmap.md`. The presentation service failed before
saving slide content, so the repository SVG is the delivered slide.

The new story has not been manually checked on a low-end Android tablet or the
school server's browser. Offline installed cold start, forced-colors visibility
and actual NVDA/TalkBack announcements remain unverified. The target-device release
gate remains blocked; no production deployment or release is claimed.
