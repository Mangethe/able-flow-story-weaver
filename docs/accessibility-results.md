# Accessibility test record — current revision

Status: **release blocked; target-device verification incomplete**.

The connected automation surfaces expose Windows desktop browsers. No controlled
Android tablet, school-server browser session, NVDA or TalkBack session has been
identified. A request for target-device availability is pending. Do not substitute
DOM assertions, a desktop browser, or the app's contrast toggle for the required
device tests in [the checklist](accessibility-checklist.md).

| Required test | Current status | Evidence still needed |
| --- | --- | --- |
| Spacebar-only complete navigation | Unverified on the target device | Both branches, preferences, conflict controls, Back, Restart, pause/resume and held-key behavior |
| Installed offline cold start | Unverified | Install on target, choose a branch, disable every network, force-close, reopen and recover that branch |
| Forced-colors focus | Unverified | Actual forced-colors mode, all scannable controls, visible unclipped outline |
| Zoom/reflow | Unverified | 200% zoom and narrow target viewport; no lost controls or horizontal scrolling needed to read content |
| NVDA/TalkBack announcements | Unverified | The spoken label and current-item state match visual scan focus; record reader/version/mode |

Automated coverage checks Space/Enter events, one scan interval, focus/current
alignment, hidden/disabled target exclusion, high-contrast color values, inline
symbols, offline data and cache logic. It does not establish any manual pass above.
The current app adds wrapping for narrow controls and a system Highlight outline
in forced colors. These are changes to verify, not proof of device compatibility.

Use this record together with the checklist. Add the actual date, device, OS,
browser, app/worker version (v6), screen-reader setup, observed announcements and
evidence for each result before changing a status to Pass. Retest after any fix.

## Edge desktop session — 2026-11-12

Tested the local prototype at `http://127.0.0.1:8787/` in Microsoft Edge Beta on
Windows, in a roughly 760 × 1024 window. The exact Edge/OS versions and deployment
device identity were not captured. This is supporting desktop evidence; the target
device release statuses above remain unverified. Browser setup used pointing input;
the story actions below used Spacebar only. The physical mouse was not unplugged.

| Test | Observed result | Scope / remaining work |
| --- | --- | --- |
| Both branches | Space started scanning, selected water and shade, and reached both endings. New endings immediately outlined Go back. Space also selected Back and Start again. | Pass for these desktop story actions; held-key behavior, every preference and conflict controls still need the full manual run. |
| Controlled update | Space selected Save progress and update after one complete scan; the app displayed Applying update, then returned to the saved node. | Worker changed from v5 to v6. |
| Origin unavailable | Stopped the task-owned local HTTP server. Reload still rendered the story and inline symbols. Space selected water, and another reload restored By the water. | Pass for cached reload, offline navigation and local persistence with the origin stopped. Wi-Fi remained enabled; this is not an installed cold start or DevTools Offline test. |
| Forced colors | Edge Rendering panel explicitly showed `forced-colors: active`. Story labels and SVGs were readable on black; scan focus used a cyan system outline on choices and settings. | Partial manual coverage; every branch/control and platform contrast theme still need verification. |
| Outline clipping fix | Before the fix, a scrolled outline touched the viewport edge. Added `scroll-margin: 1rem` to buttons. Retested v6 with tools docked below: Pause scanning and Draft gloss preview had complete outlines with space above the viewport boundary. | Pass for the reproduced case; retain the full target-device check. |
| Zoom/reflow | Edge displayed 200% zoom. Story paragraphs, title and the water choice label wrapped inside the narrow window without horizontal scrolling in the observed region. | Partial: all controls and endings must still be checked at 200% on the deployment device. Zoom was returned to the browser's existing 80% default. |
| Installation (historical entry; superseded below) | Edge offered Install ABLE-FLOW Story Weaver. Installation was not confirmed in this earlier session. | Superseded by the confirmed installation in [Edge install attempt — 2026-11-12](#edge-install-attempt--2026-11-12). This earlier observation is retained as history; installed offline cold start remains unverified. |
| Screen reader | No NVDA/TalkBack session was available. NVDA was not found in the standard Program Files locations. | Awaiting user information; no spoken announcement was tested or inferred from the accessibility tree. |

Forced-colors emulation was reset to No emulation and DevTools closed after the
checks. The local preview server was stopped. No production release was made.

## Environment recheck and shortest test session — 2026-11-12

Current source checkout: commit `d7dc5383e89a414eb3ffaef45670bdef275ab808`
(`main`, matching `origin/main` at inspection). Current service-worker cache
version in `sw.js`: `v6`. The working tree already contains unrelated documentation
edits; no application code changed during this environment check.

Available UI environment observed through Windows app inventory: Windows desktop
with Microsoft Edge Beta, Google Chrome, Vivaldi and VS Code open. The ABLE-FLOW
page had been tested in Edge Beta at `http://127.0.0.1:8787/` in the preceding
recorded session. Exact Windows build, Edge Beta version and physical device model
were not captured. No Android device or school-server browser session is exposed
to the available tools. NVDA was not found in the standard Program Files locations;
TalkBack is unavailable without an Android device. This is an environment inventory,
not a claim that those programs are absent from every user profile.

The shortest manual session on the intended deployment device is:

1. With the mouse unplugged/disabled, use only Spacebar to scan from the opening
node to the water ending, then Back; scan to the tree ending, then Restart.
2. In the same session, Spacebar-scan the Symbols, Draft gloss preview, scan speed
and contrast preferences. Pause and resume scanning. Hold Spacebar across a scan
interval, release it, and confirm a later press makes only one selection.
3. At 200% zoom and narrow viewport, enable real forced-colors mode. Scan through
choices, ending actions, settings and any offered install/update actions; confirm
each outline remains visible and readable without horizontal scrolling.
4. Install while online, make a choice, disable all network connections, force-close
the installed app and reopen it from its launcher. Confirm the saved branch and
inline symbol return, then continue with Spacebar.
5. With NVDA or TalkBack enabled, listen as scan focus advances and after a branch
renders. Record the actual spoken control label and current-item announcement and
compare them with the visible outline.

For the current local Edge session, this preparation and previous direct
observations are the available evidence. The prior record supports both Spacebar
branches, Back/Restart, a partial forced-colors check, and partial 200% reflow. It
does not cover preferences, held-key behavior, installed cold start, complete
control coverage under forced colors, or spoken announcements. Mark these
**Unverified** until directly performed and recorded with the exact environment.

## Edge install attempt — 2026-11-12

The user identified the test environment as a Microsoft Edge laptop and explicitly
authorized local PWA installation. Current source revision remained
`d7dc5383e89a414eb3ffaef45670bdef275ab808`; worker source remained v6. The physical
laptop make/model, Windows build and Edge Beta version were not exposed, so they
remain unrecorded. The available window was Microsoft Edge Beta on Windows.

| Test | Steps and observed result | Status |
| --- | --- | --- |
| Open current web build | Started the task-owned local server at `127.0.0.1:8787` and opened the app in Edge. Previously saved `By the water` was rendered. | Observed; this is a reload, not a cold start. |
| Go back with Spacebar | With the page focused, pressed Space twice from the ending (first starts scan at Go back; second selects it). The opening choices appeared and Listen to the water had the visible outline. | Partial pass for this branch return. |
| Start scanning | Waited through scan ticks; visible highlight advanced among choices and controls. When selecting the Symbols position, Edge's native Install PWA prompt appeared before that action completed. | Interrupted; preference change not confirmed. |
| Install | Chose Install in Edge's install prompt. The app inventory then showed an `ABLE-FLOW Story Weaver` installed app window. Its screenshot showed the opening story, inline SVG, and outlined Resume scanning; footer reported installed and ready for offline use. | Installation/readiness observed. |
| Offline cold start and saved-state recovery | No branch was saved in the installed app and no offline force-close/reopen was observed. | **Unverified.** |
| Preferences, pause/resume, Back/Restart, held key | Earlier Edge session observed Back and Restart; this session only observed return-to-start. No complete preferences run or held-key test was captured. | **Unverified** as a complete checklist. |
| Forced colors / zoom | Previous session recorded partial forced-colors and 200% reflow inspection in Edge, with the v6 outline-spacing retest. Not repeated in this install session. | Partial historical evidence only; full checklist **Unverified**. |
| Screen reader | No NVDA/TalkBack audio session available. | **Unverified.** |

The PWA install permission is now granted and the app is installed on this Windows
Edge profile. The remaining installed cold-start test still needs a choice made in
the installed app, force-close, all network connectivity disabled, and launcher
reopen. NVDA/TalkBack and the target Android/school-browser checks still need
appropriate hardware/software. No production release was published.
