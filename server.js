const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'src')));

// Proxy endpoint — keeps the Anthropic API call server-side
app.post('/api/humanize', async (req, res) => {
  const { text, apiKey } = req.body;

  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing text or apiKey' });
  }

  const SYSTEM_PROMPT = `You are a writing editor. Rewrite the provided paragraph to remove AI writing patterns and make it sound natural and human.

Rules:
- Remove AI vocabulary: delve, leverage, robust, navigate, seamless, pivotal, testament, landscape, underscore, tapestry, vibrant, foster, crucial, realm, Furthermore, Moreover, Additionally, groundbreaking
- Remove em dashes (—) — replace with commas or periods
- Remove inflated significance language: "marks a pivotal moment", "serves as a testament", "represents a paradigm shift"
- Replace copula avoidance: "serves as / stands as / represents / boasts" → use "is / are / has"
- Remove rule-of-three patterns and excessive parallelism
- Remove vague attributions: "experts say", "industry observers", "it is worth noting"
- Remove tacked-on -ing phrases that add fake depth (e.g. "underscoring its importance", "highlighting the need")
- Remove negative parallelisms: "It's not just X; it's Y"
- Vary sentence length naturally — mix short and long sentences
- Keep all technical accuracy, terminology, and meaning intact
- Keep approximately the same length

Return ONLY the rewritten paragraph. No explanation, no preamble.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    res.json({ result: data.content[0].text.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  let httpsOptions;
  try {
    const devCerts = require('office-addin-dev-certs');
    httpsOptions = await devCerts.getHttpsServerOptions();
  } catch (e) {
    console.error('\nCould not load dev certificates.');
    console.error('Run this first:  npm run install-certs\n');
    process.exit(1);
  }

  https.createServer(httpsOptions, app).listen(3000, () => {
    console.log('\n✓ Chapter Humanizer running at https://localhost:3000');
    console.log('  Load word-humanizer/manifest.xml in Word to get started.\n');
  });
}

start();
