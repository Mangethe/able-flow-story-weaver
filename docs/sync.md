# Ordered offline-first progress sync

The single-file app remains usable without a configured client, Auth session,
profile, network, or writable storage. Storage errors fall back to in-memory play.
Supply `window.ABLE_FLOW_CONFIG` before the main inline script to enable optional
sync: `supabaseClient` is an authenticated client and `profileId` is its Auth user
ID. A matching learner profile must already exist. Do not embed URLs or keys in
the committed HTML. For local-only profiles, supply distinct stable `localProfileId`
values; without one, the scope is `local:default`.

## Local persistence and ordering

Progress keys are `able-flow-progress:<encoded profile scope>:<encoded story ID>:v<version>`.
Authenticated scopes are `auth:<user ID>`; local-only scopes are
`local:<localProfileId>`. Display preferences use a profile-scoped settings key.
Legacy unscoped progress is copied only when its explicit owner matches. Unowned
legacy progress can migrate only to `local:default`, never to an authenticated
learner or a named local profile. The old record is retained rather than deleted.

Every choice, Back and Restart updates the current path and sequence, marks
`sync.pending=true`, and writes the entire local record synchronously before
starting any cloud work. Rendering and scanning never await sync. While a save is
active, subsequent actions overwrite only the latest local pending snapshot.
After acknowledgement, the worker sends that latest snapshot and skips intermediate
queued states. It never launches a second write concurrently in the same page.

The local record also persists `revision`, `sequence`, `inFlight` and `conflict`.
Before sending, `inFlight` records the attempted path, choices, sequence, expected
server revision and random mutation ID. Network failures retain it. A reconnect
(`online` event), startup, or later choice retries cloud reconciliation. Reloads
retry an ambiguous attempted mutation before sending newer pending work.
There is no real-time subscription or polling loop.

## Server revisions and conflicts

Migration `20261112000200_versioned_progress_revisions.sql` adds `story_version`,
`revision` and `last_mutation_id`, with uniqueness on
`(profile_id, story_id, story_version)`. Existing unversioned rows are assumed to be
version 1; other story versions do not read them.

All authenticated progress inserts/updates now go through the
`save_story_progress` RPC. It derives the owner from `auth.uid()` rather than a
caller-supplied profile. The function checks authentication, restricts itself to
that owner, locks the row and compares the expected revision atomically:

- Expected revision 0 creates a missing row at revision 1.
- A matching existing revision updates the row and increments its revision.
- Repeating the row's last mutation ID acknowledges the prior save without another
  increment. This handles a server commit whose acknowledgement was lost.
- A different revision returns a conflict without changing the cloud row.

Direct authenticated INSERT/UPDATE grants were revoked to prevent old clients
from bypassing this check. Owner-only SELECT/DELETE and RLS remain enabled.
The function is SECURITY DEFINER with an empty search path, explicit owner checks
and EXECUTE granted only to `authenticated`. Old cached clients can still play
locally; their obsolete direct upserts fail safely until they accept the v5 update.

Device `updatedAt` and server `updated_at` are for diagnostics only. They never
decide which progress wins. Startup/reconnect adopts a greater server revision
only when local progress is clean. Dirty local progress with a different cloud
revision stays intact and shows two scannable actions:

- **Keep this device's progress** explicitly rebases the local save onto the
  observed cloud revision. A concurrent change can cause another conflict; it
  cannot be overwritten silently.
- **Use cloud progress** first preserves the unsynced local record at the scoped
  `:conflict-backup` key, then adopts the cloud state. If a backup cannot be written,
  the app keeps the local branch. If the cloud row was deleted, this action is
  disabled and the learner may explicitly recreate it using the device copy.

This policy does not merge divergent branches or use last-arriving timestamps.
Only the latest conflict backup is retained. Export any backup needed for audit
before resolving another conflict. Use one active learner tab per browser profile:
the cloud CAS protects concurrent devices/tabs, but browser localStorage is not a
cross-tab transaction engine. A shared anonymous session still represents one
learner; changing `localProfileId` is local separation, not cloud authorization.

## Verification

`node tests/verify.cjs E` tests serialized writes, coalescing, offline/reload retry,
ambiguous acknowledgements, explicit conflict resolution/backup, colliding clients,
clock skew, profile/version isolation, corrupt rows and scan focus with mocked
clients. `supabase/tests/ownership.sql` tests the deployed RPC and database policies
as two authenticated anonymous identities in a rolled-back transaction. Real
client provisioning and target-device accessibility remain separate release checks.
