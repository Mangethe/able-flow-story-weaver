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
| Installation | Edge offered Install ABLE-FLOW Story Weaver. Installation was not confirmed. | Awaiting explicit installation permission under the computer-use policy; installed cold start remains unverified. |
| Screen reader | No NVDA/TalkBack session was available. NVDA was not found in the standard Program Files locations. | Awaiting user information; no spoken announcement was tested or inferred from the accessibility tree. |

Forced-colors emulation was reset to No emulation and DevTools closed after the
checks. The local preview server was stopped. No production release was made.
