# Deploy ABLE-FLOW on a school server

The school server serves static files. The story, symbols, CSS and application
JavaScript remain embedded in `index.html`; no application build, Node server,
database or Supabase configuration is required for classroom storytelling.

## Prepare a release

1. Review the seed and embedded story, run the automated checks in
   [VERIFICATION.md](../VERIFICATION.md), and complete the
   [manual accessibility checklist](accessibility-checklist.md) on the target
   device. Record failed or unverified checks; they block release.
2. Copy only `index.html`, `manifest.json`, `sw.js` and the `icons/` directory into
   a new release directory, such as `/srv/able-flow/releases/release-001/`.
   Keep the repository, `.git`, `.codex`, credentials and test files outside the
   document root. The seed JSON is an authoring handoff artifact; runtime content
   is already embedded in the HTML.
3. Make those files readable by nginx and point `/srv/able-flow/current` at the
   approved release. Retain the previous release for rollback. Use an atomic
   symlink replacement when switching releases so files are not copied piecemeal
   into the live directory.

## HTTPS and local DNS

Choose a school-controlled hostname, for example `stories.school.example`, and
configure local DNS to resolve it to the server. Replace that placeholder below.
Provision a certificate trusted by the tablets, with a matching hostname and full
certificate chain. Keep its private key outside the document root.

PWA installation requires HTTPS except for loopback development. Plain HTTP to a
school LAN IP is not the localhost exception. Do not bypass certificate warnings
or disable browser security. An internet-independent school can use an IT-managed
local certificate authority trusted on its devices; certificate provisioning is a
school IT task. See [MDN's installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## nginx static configuration

Place this in the distribution's nginx site configuration directory, included from
the `http` context. Adjust the hostname, release root and certificate paths.
The standard nginx `http` configuration should already include `mime.types`.

```nginx
server {
    listen 80;
    server_name stories.school.example;
    return 301 https://stories.school.example$request_uri;
}

server {
    listen 443 ssl;
    server_name stories.school.example;
    root /srv/able-flow/current;
    index index.html;

    ssl_certificate     /etc/nginx/tls/stories.fullchain.pem;
    ssl_certificate_key /etc/nginx/tls/stories.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    autoindex off;

    # Revalidate the application shell and worker after each release.
    location = / {
        add_header Cache-Control "no-cache" always;
        try_files /index.html =404;
    }
    location = /index.html {
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }
    location = /sw.js {
        default_type application/javascript;
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }
    location = /manifest.json {
        types { application/manifest+json json; }
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }
    location ^~ /icons/ {
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }
    # Serve only application resources; do not expose the repository or env files.
    location / { return 404; }
}
```

Run `sudo nginx -t` before `sudo systemctl reload nginx`. Check the HTTPS root,
`/index.html`, `/sw.js`, `/manifest.json`, and both icon paths return 200 with the
expected MIME types. Missing paths must return 404, not HTML pretending to be JS.
See nginx's [HTTPS guide](https://nginx.org/en/docs/http/configuring_https_servers.html)
and [static file directives](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files).

This example dedicates the hostname's root to ABLE-FLOW. A subdirectory deployment
needs matching nginx locations and a consistent manifest/worker scope. Keep the
hostname, protocol, port and path stable: browser storage and installed progress
belong to that origin, and another hostname will not inherit them.

## Supabase environment variables are optional

No `.env` file is required. nginx does not interpolate shell environment variables
into static HTML, and this app does not automatically consume `SUPABASE_URL` or
`SUPABASE_PUBLISHABLE_KEY`. Setting those variables alone does not enable sync.
Leave them unset for a fully local deployment.

If a school elects to add sync, its optional integration may use `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` while provisioning an authenticated client. Supply that
client and its Auth user ID through `window.ABLE_FLOW_CONFIG` before the main
inline script runs. Keep browser configuration in memory; do not put project URLs
or keys into the committed `index.html`, and never expose a service-role key.
An authenticated session and matching learner profile must already exist. The
current prototype has the adapter, not a client-provisioning or sign-in interface.
See [Supabase setup](../supabase/README.md) and the root README's sync contract.

Every choice is saved locally before a serialized background revision-checked save. Offline or unconfigured
deployments make no Supabase calls. Startup/reconnect adopt newer server revisions only for clean local progress;
unsynced branches require explicit conflict resolution. See [sync details](sync.md). There are no real-time subscriptions. Learners sharing
one anonymous browser session also share its profile; distinct learners need
separate managed sessions before a production rollout.

## Install, verify, update and roll back

Open the HTTPS address on each target device while connected to the school LAN.
Wait for offline readiness, install, choose a branch, then turn off all network
connections, force-close and reopen the installed PWA. Confirm the last story
state returns. Complete all four sections of the judges' accessibility checklist,
including forced colors and NVDA/TalkBack. A desktop DOM test is not a substitute.

For each changed app shell or asset, bump `VERSION` in `sw.js` and deploy the whole
release together. Existing sessions keep their cached version until the learner
selects **Save progress and update**. Test that path without losing branch progress.
For rollback, deploy the previous approved content with a **new** worker version,
preserving the same origin and compatible story IDs/versions. Do not clear learner
storage as a deployment step. Repeat the offline cold-start and accessibility
checks before returning the release to classrooms.

The supplied config has been reviewed against nginx documentation; it has not
been executed on an actual school server. The operator must run `nginx -t` with
the real hostname, certificates and file permissions before deployment.
