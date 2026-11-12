# ABLE-FLOW production path — one slide

![Four-stage ABLE-FLOW production roadmap](production-roadmap.svg)

| Stage | What is delivered | Evidence needed to advance |
| --- | --- | --- |
| 1. Single-file PWA | Embedded story and SVG symbols; switch scanning; local saves. Implemented, with target-device QA pending. | All four manual accessibility checks pass on the intended device. |
| 2. Static hosting on the school server | nginx + trusted HTTPS; a stable origin; complete, versioned releases and rollback. Next deployment step. | Installed offline cold start restores the last branch; update and rollback preserve progress. |
| 3. Optional Supabase sync | Local-first synchronous saves, one serialized background write, latest-snapshot coalescing, reconnect/reload retry, and atomic server-revision checks with idempotent mutation IDs. Explicit conflict choices preserve or back up local work. Adapter and schema are implemented; client provisioning remains an integration task. | Real client/session provisioning and multi-profile use verified in the intended classroom setup; confirm offline storytelling still works without sync. |
| 4. Multi-school content pack | Versioned, school-specific story/language packs with offline distribution. Planned. | Content licensing, educator approval, reviewed AAC/SSL language, pack validation and compatibility tested. |

Release gate at every stage: Spacebar navigation → installed offline cold start →
forced-colors focus → NVDA/TalkBack announcements. Use [the same checklist](accessibility-checklist.md)
for developers, school operators and judges. These are staged readiness criteria,
not claims that production deployment or target-device verification is complete.

The initial roadmap draft described sync as independent upserts with newer-only
timestamp merges. That description is obsolete. The current adapter instead uses
serialized, retryable revision-checked saves and explicit conflict handling; see
[the current sync policy](sync.md). Historical notes in `VERIFICATION.md` retain
their original context and should be read alongside its later revision entries.
