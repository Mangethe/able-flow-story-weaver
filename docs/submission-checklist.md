# Capstone submission checklist

Use this before sharing the video and repository. Mark an item complete only when
the linked artifact or recording is available. The four judging criteria receive
equal weight; this checklist maps each one to concrete evidence and known gaps.

## Judging evidence

| Criterion | Include in submission | Current evidence / caveat |
| --- | --- | --- |
| Codex integration: planning, building, review, documentation | Link [AGENTS.md](../AGENTS.md), [Codex retrospective](codex-development.md), scanner/focus implementation, both workflow files, verification record, and actual run links. Describe MCP roles and distinguish mocked sync tests, rollback-only SQL checks, and workflow runs. | Application run 43123168557 passed on application commit `d7dc5383e89a414eb3ffaef45670bdef275ab808`, matching current `HEAD`; local documentation edits were not covered. This is not evidence of a successful live Codex security-review run. Do not claim a formal saved Plan session unless you provide it. |
| Specific real-world educational impact | State the intended learner/educator roles and access constraint as the design target; include the educator guide, observable pilot measures, and limitations. Add only genuine, consented participant evidence if collected. | No user study, classroom outcome or learning gain is recorded. Potential benefits remain hypotheses. |
| Reusability and adoption | Link README quickstart, seed/edit instructions, deployment guide, adoption guide, accessibility checklist, and roadmap. If another operator follows setup, include their actual checklist and evidence. | Independent setup is not demonstrated. nginx has not been tested on a school server. License decision is open; do not imply reuse terms. |
| 3–5 minute demo and pitch | Include the timed [demo script](demo-script.md), a 4-minute recording, transcript/captions, visible revision, and accessible link. Keep live local progress separate from optional Supabase sync. | Do not claim installed offline cold-start recovery, full target-device verification or screen-reader announcements; these remain unverified. |

## Recording and link quality

- [ ] Final video duration is **3:00–5:00**; target is 4:00. The script timings add
      to exactly 4:00. Record the actual duration: `[HH:MM:SS]`.
- [ ] The shared video link opens for a judge in a private/logged-out browser, or
      permissions are explicitly set for the judging audience. Test the final URL
      from a separate browser/profile before submission.
- [ ] Provide accurate captions or a transcript. Review technical names, filenames,
      “AAC”, “SSL”, “Supabase”, “Codex”, and all version/commit identifiers.
- [ ] Narration is audible above system audio; the story text and current scan
      outline are legible at normal playback size. Avoid showing private account,
      learner or school data.
- [ ] Add spoken description when an important visual action is not clear from the
      narration. Keep captions from covering the scanned choice or its outline.
- [ ] Include a short written summary and links to the repository, README,
      verification record, accessibility results, demo script and roadmap.

## Recording revision and claims

- [ ] Record source commit: `[full SHA]`.
- [ ] Record worker cache version from `sw.js`: `[vN]`.
- [ ] Record device, OS, browser/version, viewport/zoom, and input method:
      `[details]`.
- [ ] If installed app is shown, record that it is installed and whether the
      specific take is online, cached with origin unavailable, or an actual
      network-disabled cold start.
- [ ] State any assistance used to begin the scan. Claim Spacebar-only selection
      only for the part actually performed that way. Do not claim a physical
      switch test unless the mouse was disabled/unplugged and only the switch was
      used.
- [ ] Confirm every demo claim against the linked evidence. Label mock tests,
      desktop simulations, partial checks, and unverified requirements distinctly.
- [ ] Supabase is identified as optional. The basic story demo shows local saves;
      do not imply a configured classroom account or live sync unless demonstrated.
- [ ] No production deployment, learner result, educator finding, language
      approval or independent setup success is claimed without evidence.

## Presenter details to fill in

- Presenter name and role: `[confirm]`
- Intended school/community and learner context: `[confirm; do not infer age or diagnosis]`
- Recording date and final duration: `[fill after recording]`
- Final video URL and access test: `[fill after upload and separate-profile test]`
- Source commit and worker version recorded in the video: `[fill]`
- Next-month plan owner, feasible dates and consent/language-review arrangements:
  `[confirm; describe as proposed until arranged]`
- License/attribution status: `[no license file currently; resolve ownership and terms before redistribution]`

## Evidence to attach when available

- [ ] Recording and transcript/caption file.
- [ ] Any genuine learner/educator feedback, anonymized and collected through the
      school's approved consent/data process.
- [ ] Target-device accessibility checklist and results.
- [ ] Independent setup checklist completed by another operator, with their
      environment and any help received.
- [ ] GitHub Actions links for the exact submitted revision, including the
      Codex security review only if a successful run actually exists.
