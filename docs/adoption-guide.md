# Adoption and small pilot guide

This guide helps an educator or independent reviewer try the current prototype
and record practical barriers. It does not claim classroom outcomes or replace the
[manual accessibility checklist](accessibility-checklist.md). Do not collect names,
diagnoses or other identifying learner details in these notes. Follow the school's
consent, safeguarding and data-handling process before involving learners.

## Current adoption readiness

- **Quickstart:** The five-step clone, serve, open, install and checklist procedure
  is in [README.md](../README.md). It needs Git, Node.js/npm for the local `npx`
  server, an install-capable browser, and initial internet to download `serve`.
  The app itself has no package-install or build step. For `file://`, local
  storytelling works but PWA installation/service workers do not.
- **Story editing:** Edit `seed/stories/folktale-1.json` and the matching embedded
  `const story` in `index.html` together. Preserve stable node/choice IDs; increase
  the story version for incompatible progress changes; increase `VERSION` in
  `sw.js` for a changed precached shell. Run the application verification command
  in [VERIFICATION.md](../VERIFICATION.md) to catch seed/embedded drift.
- **Deployment:** [docs/deploy.md](deploy.md) describes a static nginx deployment,
  trusted HTTPS, cache/update handling and rollback. It has not been exercised on
  a school server; an operator still needs to substitute the real host/certificate,
  run `nginx -t`, and test on the deployment device.
- **Sync:** Supabase is optional and currently has no sign-in/client provisioning
  screen. Core stories and local progress work without it. See [sync details](sync.md).
- **Known limitations:** The single short story has two endings. Symbols, wording
  and draft SSL gloss have not been validated with intended learners, educators or
  a language expert. The gloss is hidden by default and is not verified language.
  Classroom benefits and learning gains have not been measured. Target-device
  offline cold start, complete forced-colors coverage and NVDA/TalkBack
  announcements remain unverified in [the results record](accessibility-results.md).

## Educator feedback guide

Use one short session with the learner's usual access setup. Explain that this is
a prototype and that pausing or stopping is welcome. Ask the learner to choose
symbols/gloss settings only if that is appropriate for their normal communication;
do not ask them to demonstrate a skill they do not usually use. The educator may
operate the setup, but record clearly when a helper takes an action.

Ask and observe:

1. **Instructions and symbols:** Without explaining the symbols first, what does
   the learner think each visible symbol and choice says? Which labels need to be
   read aloud or explained? Did text labels help? Ask the educator whether the
   setup instructions were clear and whether the symbol choices fit their context.
2. **Timing and controls:** Could the learner anticipate when the highlight moved?
   Was the scan speed comfortable? Could they start, select, pause and resume with
   the intended switch? Did any highlight move before they were ready? Which
   controls needed educator assistance?
3. **Meaningful choices:** Could the learner tell how the two choices differed?
   Did either option feel like a real preference? Did the selected ending make
   sense as a result of that choice? Ask the educator what, if anything, made a
   choice confusing or unappealing.
4. **Assistance and barriers:** What assistance was needed, from whom, and for
   which step? What prevented or interrupted use (device setup, scanning pace,
   symbol meaning, text, focus visibility, network, installation or something
   else)? Record observed behavior and the participant's own words separately.

Use neutral prompts such as “What do you think happens if you choose this?” and
“Would you like more time, less time, or the same time?” Do not lead toward a
positive answer. Stop if the learner shows fatigue or frustration. Do not record
names or identifying details in the project notes.

## Observable pilot measures

These measures describe prototype use only. They do not show learning gains,
literacy improvement, communication development or causal impact.

| Measure | Record | Interpretation limit |
| --- | --- | --- |
| Branch completion | Whether the learner reached an ending after beginning a branch; which branch was chosen; whether a helper intervened | Completion does not establish comprehension or learning |
| Choice access | Whether both choices were visibly scanned and could be selected with the intended input | A short trial does not establish access across learners/devices |
| Scan support | Number of pauses/restarts requested or provided and whether the learner indicated the pace was comfortable | Do not treat pause count as a learner score |
| Progress recovery | Starting node, chosen branch, whether the app was closed/offline, and whether reopening restored that node | Record the exact browser, install state and connectivity procedure |
| Assistance and blockers | Step, kind of help, and observed barrier; distinguish learner request from helper intervention | Avoid judgments about learner ability; report the interface/context |
| Symbol/instruction interpretation | Participant's description or action for a symbol/label, plus whether an explanation was needed | A small formative sample is not language validation |

For each session, record date, device/browser, input method, app/story version,
session length if useful, measures above, and any change proposed. Use a participant
code only if the school's process permits it; keep any identity key outside this
repository. Report the number of sessions actually completed and missing data.
Never fill gaps with estimates or example results.

## Independent setup checklist

Give this list to a person who has not worked on the code. Ask them to follow it
without coaching first; if they get stuck, help them and record where help was
needed. Do not describe setup as independently successful until their evidence is
received.

- [ ] Record device model, operating system, browser/version and whether the device
      is on the school LAN.
- [ ] Obtain the repository using the README clone command, or receive an approved
      release directory from the school operator.
- [ ] For local preview, confirm Git and Node.js/npm are available; run the exact
      README `npx --yes serve@14.2.4 ...` command from the parent directory.
- [ ] Open `http://127.0.0.1:8787/` on the same computer as the server. For another
      device, use the school HTTPS host described in `docs/deploy.md`; its own
      `localhost` is not the server.
- [ ] Confirm the story and symbols load and that Space starts scanning. Record any
      explanation or extra action required.
- [ ] If installation is part of the trial, install from the browser and wait for
      the app's offline-ready message. Record the exact install route and outcome.
- [ ] Follow the manual accessibility checklist. Mark unavailable reader/device
      checks Unverified; do not substitute automated tests.
- [ ] If testing recovery, record the chosen node, close/reopen method, network
      state and restored node. Do not call an ordinary refresh an installed cold
      start.
- [ ] Send back the completed checklist, exact error text or a screenshot/session
      excerpt with personal information removed. State which steps were completed
      without help and which needed assistance.

Current independent setup status: **not demonstrated**. The repository contains
author verification, but no second operator's setup evidence has been supplied.

## Licensing and attribution decision needed

No root `LICENSE` file or explicit license/attribution statement was found during
this review. Do not assume that public GitHub visibility grants permission to
reuse or redistribute the code, story or symbols. Consider licensing these
components separately because their authorship and reuse needs may differ:

- **Application code:** MIT is a short permissive option that allows reuse with
  notice and disclaimer; Apache-2.0 is another permissive option with express
  patent terms and more conditions.
- **Original story text:** CC BY 4.0 permits sharing and adaptation with attribution;
  CC BY-SA 4.0 adds a share-alike condition to adaptations. These are examples to
  compare, not a recommendation about ownership or legal suitability.
- **Inline SVG symbols/artwork:** Identify who created or sourced each symbol,
  then choose a compatible separate license or explicitly include them in the
  code/story license. Do not apply a license to third-party material unless you
  have authority to do so.

Before adding license files, confirm who owns or may license the application code,
story text and symbols, whether any capstone/school/employer terms apply, whether
you want commercial reuse allowed, whether attribution is required, and whether
adaptations must use the same license. Also decide whether a root code license and
separate `seed/` or symbol attribution notices best represent that choice. No
license has been added pending your decision.
