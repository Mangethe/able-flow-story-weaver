# Manual accessibility verification

Run this checklist for every change and before every release on the intended
deployment device: a low-end Android tablet or the browser used to access the
school server. Automated tests and desktop simulations do not replace these
manual checks. Do not release while any required check is failed or unverified.

## Record the test environment

- Date and tester:
- Commit or release version:
- Target device and operating system:
- Browser and version:
- Installed PWA version / service-worker cache version:
- Switch or keyboard used:
- Screen reader and version (NVDA or TalkBack):
- Forced-colors configuration:

Start every checkbox unchecked. Record evidence, failures and retest results below.
If the device cannot run a required test, mark it unverified, identify the missing
capability, and arrange verification on an appropriate supported deployment device.

## 1. Switch-only navigation

- [ ] Unplug the mouse or disable the pointing device. After launching the app,
      use only Spacebar for every app action; do not use touch, clicks, Tab, Enter
      or screen-reader navigation commands to select controls during this test.
- [ ] Start scanning, wait for the desired highlight, and select using Spacebar.
- [ ] Navigate every branch from the start to its ending. Every story choice is
      reachable, including choices revealed after a branch changes.
- [ ] Reach and use Go back, Start again, Pause/Resume, scan-speed and contrast
      controls, plus installation/update controls whenever offered.
- [ ] After selecting a branch, the new controls render and scanning restarts at
      index zero. The current control has a visible outline and retains focus.
- [ ] Hold Spacebar: no duplicate selection occurs. Release and press again to
      select. Pausing stops scanning, and resuming remains possible with Spacebar.

## 2. Offline cold start

- [ ] While online, install the PWA and wait until offline resources are ready.
- [ ] Make a story choice and record the current story, node and branch.
- [ ] Turn off Wi-Fi and any mobile-data or other network connection.
- [ ] Force-close the installed app. Reopen it from its installed launcher icon
      while still offline; a refresh or already-open tab does not count.
- [ ] The app loads successfully and restores the last story state, including the
      selected branch. Story text and AAC symbols render without a network.
- [ ] Continue through the story using Spacebar while offline. Missing Supabase
      connectivity does not block navigation or local saving.

## 3. High contrast / forced colors

- [ ] Enable the browser's forced-colors mode or the platform high-contrast mode
      that activates it. The app's own High contrast toggle alone does not count.
- [ ] Scan through every enabled control on every branch and ending, including
      settings and installation/update controls whenever offered.
- [ ] Every scanned element has a clearly visible focus outline in forced colors.
      The outline is not clipped, obscured or conveyed by color alone.
- [ ] Text, control labels and inline AAC symbols remain readable. Verify the
      app's high-contrast body text meets at least 4.5:1 contrast separately.

## 4. Screen-reader announcements

- [ ] Enable NVDA on a supported school browser or TalkBack on the Android tablet.
      Record the reader's mode and any required switch/keyboard pass-through setup.
- [ ] Start scanning and listen as the current element advances through every
      enabled control, including after a branch renders.
- [ ] Each scanned element's label is announced, and its `aria-current="true"`
      state is conveyed as the current item. Inspecting the DOM alone does not pass
      this check; record what the reader actually announces.
- [ ] Announcements, visible scan outline and keyboard focus identify the same
      element. Previous elements are no longer announced as current.
- [ ] Branch selection, Pause/Resume, Go back and Start again remain usable;
      announcements do not prevent the learner from selecting the intended choice.

## Results and release decision

| Check | Pass / Fail / Unverified | Observed evidence or issue | Retest result |
| --- | --- | --- | --- |
| Switch-only navigation | Unverified | | |
| Offline cold start | Unverified | | |
| Forced-colors focus | Unverified | | |
| Screen-reader announcements | Unverified | | |

- Issues and fixes:
- Remaining limitations:
- Release decision (blocked until all required checks pass):
- Verified by / date:
