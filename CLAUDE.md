# Word Humanizer — Claude Code Context

> Built on the shoulders of giants — the humanizer patterns and philosophy in this project are directly inspired by **Siqi Chen's** original [humanizer](https://github.com/blader/humanizer) Claude Code skill (9.8k ★). Thank you, [@blader](https://github.com/blader), for the thoughtful taxonomy of AI writing patterns that made this possible.

## What this project is
A Microsoft Word task-pane add-in that rewrites AI-generated paragraphs to sound natural. It runs a local HTTPS Express server that proxies calls to the Anthropic Claude API.

## Architecture
- `server.js` — Express HTTPS server on port 3000. Serves `src/` as static files. One endpoint: `POST /api/humanize` proxies to `https://api.anthropic.com/v1/messages`.
- `src/taskpane.html` — Add-in UI shell.
- `src/taskpane.js` — All client logic: Office.js integration, humanScore() heuristic, card UI, accept/dismiss flow.
- `src/taskpane.css` — Styles.
- `src/icon.svg` — Add-in icon (green circle, pencil + sparkles).
- `manifest.xml` — Office Add-in manifest pointing to `https://localhost:3000`.

## Key decisions
- **API key is client-side** — stored in `localStorage`, sent to the server per-request in the POST body. Never written to disk or logged.
- **Model** — uses `claude-sonnet-4-6`.
- **humanScore() heuristic** — pure client-side, no API call. Penalises banned AI vocab, em dashes, and specific multi-word AI phrases. Returns `{ score, flags }` where score is clamped 7–94 (never 0, never 100).
- **Two humanize modes** — paragraph-at-cursor (by index) and selection (via content control tag `humanizer-pending`).

## Dev workflow
```bash
npm install
npm run install-certs   # once — installs trusted local HTTPS cert
npm start               # runs server at https://localhost:3000
```
Sideload `manifest.xml` in Word via Insert → Add-ins → Upload My Add-in.

## What NOT to change without care
- The `office-addin-dev-certs` flow in `server.js` — Word requires HTTPS; removing it breaks the add-in.
- The `humanizer-pending` content control tag — used to locate and replace selected text after API returns.
- The `escapeHtml()` call in `showCard` — prevents XSS from document text being injected into the panel HTML.
