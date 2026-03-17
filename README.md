# Chapter Humanizer — Word Add-in

A Microsoft Word task-pane add-in that rewrites AI-generated paragraphs to sound natural and human. Uses the Claude API (Anthropic) as the backend.

## What it does

- **Humanize Paragraph at Cursor** — place your cursor anywhere in a paragraph, click the button, review the rewrite, and accept or dismiss.
- **Humanize Selection** — select any text, get a rewrite, accept or dismiss.

All rewrites strip common AI writing patterns: em dashes, filler transitions, inflated significance language, rule-of-three structures, copula avoidance, and banned vocabulary.

---

## Requirements

- **Node.js** v18 or later
- **Microsoft Word** (desktop, not web) — macOS or Windows
- An **Anthropic API key** (`sk-ant-...`)

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd word-humanizer
npm install
```

### 2. Install the local HTTPS dev certificates

Word requires HTTPS even for local add-ins. Run this once:

```bash
npm run install-certs
```

> On macOS you may be prompted for your system password to trust the certificate.
> On Windows, accept the UAC prompt.

### 3. Start the server

```bash
npm start
```

You should see:

```
✓ Chapter Humanizer running at https://localhost:3000
```

### 4. Sideload the add-in into Word

#### macOS
1. Open Word.
2. Go to **Insert → Add-ins → My Add-ins → Upload My Add-in**.
3. Browse to `manifest.xml` in this folder and click **Upload**.

#### Windows
1. Open Word.
2. Go to **Insert → Add-ins → My Add-ins → Upload My Add-in**.
3. Browse to `manifest.xml` and click **Upload**.

The **Chapter Humanizer** panel will appear in the right sidebar.

---

## Usage

1. Enter your Anthropic API key in the panel and click **Save**.
2. Place your cursor in any paragraph and click **Humanize Paragraph at Cursor**, or select text and click **Humanize Selection**.
3. Review the rewrite in the panel, then click **Accept** to replace the text or **Dismiss** to skip.

Your API key is stored only in the browser's `localStorage` for the Word add-in — it is never logged or persisted on disk.

---

## Project structure

```
word-humanizer/
├── manifest.xml        # Office Add-in manifest (points to localhost:3000)
├── package.json
├── server.js           # Express HTTPS server + /api/humanize proxy endpoint
└── src/
    ├── taskpane.html   # Add-in UI
    ├── taskpane.js     # Office.js logic
    └── taskpane.css    # Styles
```

---

## Stopping the server

```bash
npm run stop
# or just Ctrl+C in the terminal running npm start
```

---

## Credits

The humanization rules, pattern taxonomy, and core philosophy in this project are built on the work of **Siqi Chen ([@blader](https://github.com/blader))** and his original [humanizer](https://github.com/blader/humanizer) Claude Code skill (9.8k ★, MIT licensed).

> *"LLMs use statistical algorithms to guess what should come next. The result tends toward the most statistically likely result that applies to the widest variety of cases."*
> — Siqi Chen

This project wraps those ideas into a Microsoft Word add-in with a live before/after scoring UI.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not load dev certificates` | Run `npm run install-certs` first |
| Add-in shows a blank panel | Make sure `npm start` is running before opening Word |
| `NET::ERR_CERT_AUTHORITY_INVALID` in Word | Trust the cert: visit `https://localhost:3000` in your browser and accept the warning |
| API key error | Make sure the key starts with `sk-ant-` and has not expired |
