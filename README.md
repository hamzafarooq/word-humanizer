# Chapter Humanizer — Word Add-in

A Microsoft Word task-pane add-in that rewrites AI-generated paragraphs to sound natural and human. It sits inside Word as a sidebar, lets you rewrite one paragraph at a time, scores the text before and after, and shows you exactly what patterns were removed — all without leaving your document.

Uses the Claude API (Anthropic) as the rewrite engine.

---

## Demo

https://github.com/user-attachments/assets/a64fd976-5795-446d-a679-4a72cca0093c

---

## The problem it solves

AI-generated text has fingerprints. Certain words appear far too often — *leverage*, *pivotal*, *seamless*, *robust*, *furthermore*. Sentences get stitched together with em dashes. Importance gets inflated with phrases like "represents a paradigm shift" or "serves as a testament to." Lists of three appear constantly. Simple verbs get replaced with roundabout constructions ("serves as" instead of "is").

Individually these patterns are minor. Together they make text feel synthetic — readable, but somehow hollow. Editors, publishers, and increasingly AI detectors notice them.

Chapter Humanizer removes them systematically, one paragraph at a time, while keeping your meaning, length, and technical accuracy intact.

---

## What it does

**Two rewrite modes:**
- **Humanize Paragraph at Cursor** — place your cursor anywhere in a paragraph and click. No selection needed.
- **Humanize Selection** — highlight any span of text and click to rewrite just that portion.

**Before/after scoring:**
Every rewrite shows a live humanizer score (7–94) for both the original and the rewrite. The score is calculated client-side by checking for banned vocabulary, em dashes, and known AI phrase patterns. A score in the green zone (71+) means the text reads human. Red (below 40) means it's heavily patterned.

**Flag explanations:**
Below the score, you see exactly why the original scored low — which banned words were found, whether em dashes were present, which specific AI phrases were detected. After the rewrite, you see a green checklist of everything that was removed.

**Accept or dismiss:**
Every rewrite is a suggestion. You review it in the panel, then click **Accept** to replace the text in your document or **Dismiss** to leave it unchanged.

**Sample text for testing:**
A built-in "Insert sample AI text" button drops a heavily AI-patterned paragraph into your document so you can immediately see the scoring and rewrite flow in action.

---

## What patterns it removes

| Category | Examples |
|---|---|
| Banned vocabulary | delve, leverage, robust, seamless, pivotal, tapestry, vibrant, foster, furthermore, moreover, groundbreaking, realm, navigate, landscape |
| Punctuation | Em dashes (—) replaced with commas or periods |
| Significance inflation | "represents a paradigm shift", "serves as a testament", "marks a pivotal moment" |
| Copula avoidance | "serves as / stands as / boasts" → "is / are / has" |
| Tacked-on phrases | "...underscoring its importance", "...highlighting the need for X" |
| Negative parallelism | "It's not just X; it's Y" rewritten as a single direct statement |
| Hedging and filler | "it is worth noting", "experts say", "in today's rapidly evolving world" |

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

## Roadmap

- [ ] **Multi-LLM backend** — swap Claude for OpenAI, Gemini, or a local [Ollama](https://ollama.com) model via a dropdown in the panel. Useful for air-gapped environments or cost control.
- [ ] **Ollama support** — run fully offline with models like Llama 3, Mistral, or Phi-3. No API key required.
- [ ] **Chrome extension** — bring the same rewrite flow to Google Docs, Notion, and any `contenteditable` field in the browser.
- [ ] **Tested environments** — currently verified on macOS + Word 16.x. Need community testing on Windows 10/11 + Word, and Word Online.
- [ ] **Batch mode** — rewrite an entire document section-by-section in one click, with a progress bar and bulk accept/dismiss.
- [ ] **Custom word list** — let users add their own banned words and phrases on top of the defaults.
- [ ] **Score history** — track average before/after scores across a session so you can see overall document improvement.

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
