# ABLE-FLOW Agent Instructions

## Core Principles
1. **Accessibility First:** Every interactive element must be reachable by keyboard and by single-switch scanning (spacebar/Enter). No feature is complete until it passes the switch-access checklist below.
2. **Offline-First:** The app must fully function from `file://` or a static server with no network. Supabase is for *optional* asynchronous sync only—never a runtime dependency for core storytelling.
3. **Single-File Architecture:** All CSS and JavaScript must be inlined in `index.html`. Do not introduce a build step, bundler, or external `<script src>` unless explicitly instructed.

## Done When (verification checklist)
- [ ] Complete and record the [manual accessibility checklist](docs/accessibility-checklist.md) for every change and before every release on the target device (a low-end Android tablet or the school server's browser). Do not substitute automated tests or desktop simulations; failed or unverified required checks block release.
- [ ] The story can be navigated start-to-finish using only Spacebar (scan → select).
- [ ] The app loads and runs with DevTools “Offline” checked.
- [ ] High-contrast mode passes WCAG 2.2 AA contrast ratios (4.5:1 body text).
- [ ] AAC symbol slots render as inline SVG (no external image requests).
- [ ] `manifest.json` and `sw.js` are registered and the PWA installs.

## Supabase Usage
- Use the `supabase` MCP tools to inspect the schema before writing any query.
- All client-side Supabase calls must be wrapped in `try/catch` and fail silently (log to console) so offline use is never blocked.
- Never hardcode project URLs or keys in `index.html`; use a `config` object that defaults to `null` when offline.
