# Four-minute capstone walkthrough

This script uses the current local story and only claims behavior supported by the
repository or recorded verification. Rehearse once with a timer. Do not describe
the Edge desktop checks as target-device validation. Fill the presenter and
classroom-context placeholders before recording.

## 0:00–0:30 — Learner, classroom constraint and access problem

**Spoken narration (about 30 seconds):**

“ABLE-FLOW is a prototype for learners who benefit from single-switch access and
educators supporting accessible literacy. Its design target is a learner who needs
a single-switch way to move among story choices, in a classroom where connectivity
may be limited. The page scans one choice at a time for Spacebar selection and
saves progress locally. These are access and availability goals; classroom outcomes
have not yet been measured.”

**Show:** Opening node of “Tortoise and the quiet garden”; keep the two labeled
choices and the “Works offline” badge visible.

**Evidence:** [README intended audience and access problem](../README.md#intended-users-and-access-problem),
[single-file/offline requirements](../AGENTS.md), and
[the embedded seed](../seed/stories/folktale-1.json).

**Fallback:** Use a still image of the opening node and state that it is a prototype
screen. Do not imply that a learner has validated it.

**Presenter placeholder:** Replace “learners who benefit from single-switch
access” with a more specific learner group only after you confirm that audience
with the intended school/community. Do not add age, diagnosis or school claims
without evidence.

## 0:30–1:40 — Single-switch story demonstration

**Spoken narration (about 70 seconds):**

“I start scanning with Spacebar. The highlighted button is the current choice; I
wait for the one I want, then press Spacebar again. I’ll choose the water path.
After the story renders, scanning restarts at the first available action. At the
ending, I can go back and take the other path, then restart. The text label is
always present with the inline symbol. The draft gloss is hidden by default
because it has not had language review.”

**Exact actions:**

1. Focus the page once before recording. From READY, press Space to start.
2. Wait for “Listen to the water”, then press Space to select it. Show “By the
   water” and the outlined Go back action.
3. Press Space to start scanning, then Space to select Go back at index zero.
4. Wait for “Rest beneath the tree” and select with Space. Show “Under the tree”.
5. If time permits, Space-scan to Start again and select; otherwise show the
   already verified opening screen after a replay.

The recording operator may use mouse/keyboard to focus the initial page before the
switch-only portion. From the first scan action through each selection, use only
Spacebar. If the test setup allows, disable the pointing device. Otherwise say
plainly that this recording demonstrates Spacebar operation, not unplugged-mouse
testing.

**Evidence:** [Scanner and branch behavior](../README.md#architecture-and-development),
[automated checks versus manual limits](../VERIFICATION.md), and the
[Edge manual record](accessibility-results.md#edge-desktop-session--2026-11-12).

**Fallback:** If scan focus or timing is unreliable, stop the live interaction and
show a short, genuine screen recording or screenshots from a completed session.
Label recorded evidence with its date and browser; do not present DOM tests as a
manual pass.

## 1:40–2:15 — Offline behavior and saved progress

**Spoken narration (about 35 seconds):**

“The application shell and story are cached locally. In the recorded Edge desktop
check, the local web server was stopped; reloading still showed the story, and a
Spacebar choice followed by another reload restored the selected ending. That
demonstrates a cached reload and local progress recovery with the origin unavailable.
It is not an installed-app cold start: Wi-Fi was still enabled, and the installed
app has not been force-closed and reopened with all networking disabled. Installed
offline cold start and screen-reader behavior remain unverified.”

**Show:** The recorded results table or a genuine capture from the origin-stopped
reload, including the restored ending. Keep “cached reload; origin stopped” visible
as the claim label. The app is installed in Edge, but do not imply an offline
installed cold start was tested.

**Evidence:** [Edge origin-unavailable check and explicit limitation](accessibility-results.md#edge-desktop-session--2026-11-12)
and [installed PWA attempt](accessibility-results.md#edge-install-attempt--2026-11-12).

**Fallback:** Show the evidence table in this document and say the installed
cold-start step remains unverified. Do not disable the presentation laptop's
network live unless you have a separate offline recording and can safely restore
connectivity.

## 2:15–3:20 — Codex process, review and CI

**Spoken narration (about 65 seconds):**

“Codex work followed the project constraints in AGENTS.md: accessibility first,
offline core behavior, and CSS and JavaScript kept in index.html. Conversation
milestones guided the shell, story, symbols, PWA and optional sync; the repository
records the decisions and historical verification rather than claiming a saved
Plan session. A reproduced forced-colors outline problem led to a scroll-margin
fix, which was retested in Edge. Supabase MCP was used for schema and migration
work; sync behavior tests use mocks, while database policy checks were run as
rollback-only SQL. GitHub MCP confirmed a successful application-test run on application commit
The Codex security workflow is configured, but a successful live AI review run is
not evidenced. GitHub reports that application-test run 43123168557 passed on
application commit d7dc5383e89a414eb3ffaef45670bdef275ab808, which is the current
HEAD. The local worktree changes are documentation edits and were not part of that
run.”

**Show:** `AGENTS.md`; briefly show the `index.html` scanner/focus rule and
`sw.js` v6; then show `.github/workflows/application-tests.yml` and the linked
GitHub Actions run. If time, point to the separate structured security workflow
and `docs/codex-development.md`.

**Evidence:** [AGENTS.md](../AGENTS.md),
[Codex development retrospective](codex-development.md),
[application workflow](../.github/workflows/application-tests.yml),
[successful application-test run on application commit d7dc5383e89a414eb3ffaef45670bdef275ab808](https://github.com/Mangethe/able-flow-story-weaver/actions/runs/43123168557),
[sync implementation and verification limits](sync.md), and
[current local verification record](../VERIFICATION.md).

**Fallback:** Use screenshots or the checked-in files and Actions link. State the
run's application commit and date, and that current local documentation changes
were not covered by it. Do not claim a successful Codex security-review run, a live
classroom sync, or a saved formal plan.

**Sync distinction:** The demo story uses local storage by default. Supabase sync
is optional, inactive unless an integrator provides an authenticated client and
profile, and has no in-app sign-in/provisioning screen. Keep it out of the live
learner flow unless the presentation is specifically about the integration.

## 3:20–4:00 — Limitations and next month

**Spoken narration (about 40 seconds):**

“This prototype has one short story and two endings. We have not measured learning
gains or classroom outcomes, and intended learners and educators have not yet
reviewed the symbols and wording. The SSL gloss is draft and unverified. Full
target-device checks, installed offline cold start and NVDA/TalkBack announcements
remain open. Next month, I propose first arranging a short, consented educator and
learner usability review, completing the device checklist with the school, and
having the gloss reviewed by an appropriate language expert. I would use those
findings to decide whether and how to expand the story.”

**Show:** The limitations table in [README.md](../README.md#verification-and-limitations)
and [the accessibility results](accessibility-results.md); finish on the four-stage
roadmap slide.

**Evidence:** [Current verification gaps](accessibility-results.md),
[manual checklist](accessibility-checklist.md), and
[prototype-to-production roadmap](production-roadmap.md).

**Fallback:** If no learner/educator review or language review can be arranged,
present those as proposed activities and state what access or consent is still
needed. Do not imply participants, findings, school approval or dates are secured.

**Presenter placeholders:** Confirm the school/community context, whether the
proposed next-month activities are feasible, who will arrange consent and expert
review, and the calendar month meant by “next month”.
