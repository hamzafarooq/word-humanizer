/* -------------------------------------------------------
   Chapter Humanizer — selection-based + paragraph cursor flow
------------------------------------------------------- */

Office.onReady((info) => {
  if (info.host !== Office.HostType.Word) return;
  document.getElementById('save-key-btn').addEventListener('click', saveApiKey);
  document.getElementById('humanize-btn').addEventListener('click', humanizeSelection);
  document.getElementById('humanize-para-btn').addEventListener('click', humanizeCurrentParagraph);
  document.getElementById('insert-sample-btn').addEventListener('click', insertSampleText);

  const saved = localStorage.getItem('ch-api-key');
  if (saved) {
    document.getElementById('api-key').value = saved;
    document.getElementById('key-status').textContent = 'API key loaded.';
  }
});

/* ---- API key ---- */
function saveApiKey() {
  const key = document.getElementById('api-key').value.trim();
  if (!key.startsWith('sk-ant')) {
    setKeyStatus('Key should start with sk-ant...', true);
    return;
  }
  localStorage.setItem('ch-api-key', key);
  setKeyStatus('Saved ✓');
}

function setKeyStatus(msg, isError = false) {
  const el = document.getElementById('key-status');
  el.textContent = msg;
  el.style.color = isError ? '#dc2626' : '#15803d';
}

function getApiKey() {
  return localStorage.getItem('ch-api-key') || '';
}

/* ---- Sample text (scores ~0 — wall-to-wall AI patterns) ---- */
const SAMPLE_AI_TEXT =
  'The integration of artificial intelligence into modern organizational workflows represents a paradigm shift — fundamentally transforming how enterprises navigate the rapidly evolving technological landscape. Furthermore, it is worth noting that robust and seamless automation tools leverage cutting-edge capabilities to foster unprecedented operational efficiency across vibrant, dynamic, and resilient teams. Moreover, this groundbreaking development serves as a testament to human ingenuity, underscoring its pivotal role in shaping the broader industry landscape and delivering seamless value at every crucial touchpoint.';

async function insertSampleText() {
  const btn = document.getElementById('insert-sample-btn');
  btn.disabled = true;
  btn.textContent = 'Inserting…';
  try {
    await Word.run(async (context) => {
      const sel = context.document.getSelection();
      sel.insertParagraph(SAMPLE_AI_TEXT, 'After');
      await context.sync();
    });
    showToast('Sample inserted — place cursor in it and click Humanize');
  } catch (err) {
    showToast('Could not insert sample: ' + err.message, true);
  }
  btn.disabled = false;
  btn.textContent = 'Insert sample AI text to test scoring';
}

/* ---- Humanize current paragraph (no selection needed) ---- */
async function humanizeCurrentParagraph() {
  if (!getApiKey()) { showToast('Enter your API key first', true); return; }

  const btn = document.getElementById('humanize-para-btn');
  btn.disabled = true;
  btn.textContent = 'Reading...';

  let paraText = '';
  let paraIndex = -1;

  try {
    await Word.run(async (context) => {
      // Get the paragraph containing the cursor
      const sel = context.document.getSelection();
      const para = sel.paragraphs.getFirst();
      para.load('text, style');
      await context.sync();

      paraText = para.text.trim();

      // Get its index in the document
      const allParas = context.document.body.paragraphs;
      allParas.load('text');
      await context.sync();

      for (let i = 0; i < allParas.items.length; i++) {
        if (allParas.items[i].text.trim() === paraText) {
          paraIndex = i;
          break;
        }
      }
    });
  } catch (err) {
    showToast('Could not read paragraph: ' + err.message, true);
    resetBtn('humanize-para-btn', 'Humanize Paragraph at Cursor');
    return;
  }

  if (!paraText || paraText.length < 10) {
    showToast('Place cursor in a text paragraph first', true);
    resetBtn('humanize-para-btn', 'Humanize Paragraph at Cursor');
    return;
  }

  btn.textContent = 'Humanizing...';
  showCard(paraText, null, paraIndex);

  try {
    const response = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: paraText, apiKey: getApiKey() }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API error');

    updateCard(data.result);
  } catch (err) {
    showToast('Error: ' + err.message, true);
    setCardError();
  }

  resetBtn('humanize-para-btn', 'Humanize Paragraph at Cursor');
}

/* ---- Humanize selected text ---- */
async function humanizeSelection() {
  if (!getApiKey()) { showToast('Enter your API key first', true); return; }

  const btn = document.getElementById('humanize-btn');
  btn.disabled = true;
  btn.textContent = 'Reading selection...';

  let selectedText = '';
  let controlId = null;

  try {
    await Word.run(async (context) => {
      const sel = context.document.getSelection();
      sel.load('text');
      await context.sync();
      selectedText = sel.text.trim();

      if (selectedText.length >= 10) {
        const control = sel.insertContentControl();
        control.tag = 'humanizer-pending';
        control.appearance = 'Hidden';
        control.load('id');
        await context.sync();
        controlId = control.id;
      }
    });
  } catch (err) {
    showToast('Could not read selection: ' + err.message, true);
    resetBtn('humanize-btn', 'Humanize Selection');
    return;
  }

  if (!selectedText || selectedText.length < 10) {
    showToast('Select some text in Word first', true);
    resetBtn('humanize-btn', 'Humanize Selection');
    return;
  }

  btn.textContent = 'Humanizing...';
  showCard(selectedText, controlId, null);

  try {
    const response = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectedText, apiKey: getApiKey() }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API error');

    updateCard(data.result);
  } catch (err) {
    showToast('Error: ' + err.message, true);
    setCardError();
    await cleanupControl();
  }

  resetBtn('humanize-btn', 'Humanize Selection');
}

/* ---- Humanizer score (heuristic, 0–94, higher = more human) ---- */
function humanScore(text) {
  const t = text.toLowerCase();
  let penalties = 0;
  const flags = [];

  const banned = [
    'delve', 'leverage', 'robust', 'seamless', 'pivotal',
    'testament', 'tapestry', 'vibrant', 'foster',
    'furthermore', 'moreover', 'additionally', 'groundbreaking',
    'underscore', 'realm', 'navigate', 'landscape',
  ];
  const foundWords = [];
  banned.forEach(w => {
    const hits = (t.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length;
    if (hits) { penalties += hits * 10; foundWords.push(w); }
  });
  if (foundWords.length) flags.push({ key: 'vocab', label: `AI words: ${foundWords.slice(0, 4).join(', ')}${foundWords.length > 4 ? ` +${foundWords.length - 4}` : ''}` });

  const emDashes = (text.match(/—/g) || []).length;
  if (emDashes) {
    penalties += emDashes * 12;
    flags.push({ key: 'emdash', label: `em dash${emDashes > 1 ? ` ×${emDashes}` : ''}` });
  }

  const phraseList = [
    'marks a pivotal moment',
    'serves as a testament',
    'represents a paradigm shift',
    'it is worth noting',
    'underscoring its',
    'highlighting the need',
  ];
  phraseList.forEach(p => {
    if (t.includes(p)) {
      penalties += 15;
      flags.push({ key: `phrase:${p}`, label: `"${p}"` });
    }
  });

  // Floor at 7 so score never hits 0
  return { score: Math.max(7, Math.min(94, 100 - penalties)), flags };
}

function scoreBadgeHtml(score, id) {
  const cls = score >= 71 ? 'score-green' : score >= 41 ? 'score-amber' : 'score-red';
  return `<span class="score-badge ${cls}" id="${id}">${score}</span>`;
}

function reasonsHtml(flags) {
  if (!flags.length) return '<span class="reason-clear">No AI patterns detected</span>';
  return flags.map(f => `<span class="reason-flag">${escapeHtml(f.label)}</span>`).join('');
}

function improvementsHtml(beforeFlags, afterFlags) {
  const afterKeys = new Set(afterFlags.map(f => f.key));
  const fixed = beforeFlags.filter(f => !afterKeys.has(f.key));
  if (!fixed.length) return '<span class="reason-clear">Score already clean</span>';
  return fixed.map(f => `<span class="reason-fixed">✓ ${escapeHtml(f.label)}</span>`).join('');
}

/* ---- Card UI ---- */
function showCard(originalText, controlId, paraIndex) {
  const prev = document.getElementById('result-card');
  if (prev && prev._controlId) cleanupControl();

  const before = humanScore(originalText);
  const area = document.getElementById('card-area');
  area.innerHTML = `
    <div class="result-card" id="result-card">
      <div class="score-row">
        <div class="score-col">
          <div class="score-label">AI Score</div>
          ${scoreBadgeHtml(before.score, 'score-before')}
        </div>
        <div class="score-arrow">→</div>
        <div class="score-col">
          <div class="score-label">Human Score</div>
          <span class="score-badge score-pending" id="score-after">—</span>
        </div>
      </div>
      <div class="score-reasons" id="score-reasons">${reasonsHtml(before.flags)}</div>
      <div class="score-reasons hidden" id="score-improvements"></div>
      <div class="card-label">Original</div>
      <div class="original-text">${escapeHtml(originalText)}</div>
      <div class="card-label suggestion-label hidden">Rewrite</div>
      <div class="suggestion hidden" id="suggestion-text"></div>
      <div class="spinner" id="spinner">
        <div class="spin-dot"></div><div class="spin-dot"></div><div class="spin-dot"></div>
      </div>
      <div class="actions hidden" id="card-actions">
        <button class="btn-accept" id="btn-accept">Accept</button>
        <button class="btn-skip" id="btn-dismiss">Dismiss</button>
      </div>
    </div>
  `;

  const card = document.getElementById('result-card');
  card._controlId = controlId;
  card._paraIndex = paraIndex;
  card._humanized = null;
  card._beforeFlags = before.flags;

  document.getElementById('btn-accept').addEventListener('click', acceptResult);
  document.getElementById('btn-dismiss').addEventListener('click', dismissResult);
}

function updateCard(humanizedText) {
  const card = document.getElementById('result-card');
  if (!card) return;
  card._humanized = humanizedText;

  const after = humanScore(humanizedText);
  const afterEl = document.getElementById('score-after');
  if (afterEl) {
    afterEl.textContent = after.score;
    afterEl.className = 'score-badge ' + (after.score >= 71 ? 'score-green' : after.score >= 41 ? 'score-amber' : 'score-red');
  }

  // Show what was fixed
  const improveEl = document.getElementById('score-improvements');
  if (improveEl) {
    improveEl.innerHTML = improvementsHtml(card._beforeFlags || [], after.flags);
    improveEl.classList.remove('hidden');
  }
  // Collapse the "why it's bad" row now that improvements are shown
  document.getElementById('score-reasons')?.classList.add('hidden');

  document.getElementById('spinner').classList.add('hidden');
  document.getElementById('suggestion-text').textContent = humanizedText;
  document.getElementById('suggestion-text').classList.remove('hidden');
  card.querySelector('.suggestion-label').classList.remove('hidden');
  document.getElementById('card-actions').classList.remove('hidden');
}

function setCardError() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.innerHTML = '<p style="color:#dc2626;font-size:12px">Error — try again</p>';
}

/* ---- Accept / Dismiss ---- */
async function acceptResult() {
  const card = document.getElementById('result-card');
  if (!card || !card._humanized) return;

  document.getElementById('btn-accept').disabled = true;
  document.getElementById('btn-accept').textContent = 'Replacing...';

  try {
    if (card._controlId !== null) {
      // Selection mode: replace via content control
      await Word.run(async (context) => {
        const controls = context.document.contentControls.getByTag('humanizer-pending');
        controls.load('items');
        await context.sync();
        if (controls.items.length === 0) throw new Error('Marker not found — did the document change?');
        controls.items[0].insertText(card._humanized, 'Replace');
        controls.items[0].delete(true); // true = keep content
        await context.sync();
      });
    } else {
      // Paragraph cursor mode: replace by index
      await Word.run(async (context) => {
        const paragraphs = context.document.body.paragraphs;
        paragraphs.load('items');
        await context.sync();
        const target = paragraphs.items[card._paraIndex];
        if (!target) throw new Error('Paragraph not found');
        target.clear();
        target.insertText(card._humanized, 'Start');
        await context.sync();
      });
    }

    document.getElementById('card-area').innerHTML = '<div class="done-msg">✓ Replaced successfully</div>';
    showToast('Done ✓');

  } catch (err) {
    showToast('Error: ' + err.message, true);
    document.getElementById('btn-accept').disabled = false;
    document.getElementById('btn-accept').textContent = 'Accept';
  }
}

async function dismissResult() {
  if (document.getElementById('result-card')?._controlId) await cleanupControl();
  document.getElementById('card-area').innerHTML = '';
}

async function cleanupControl() {
  try {
    await Word.run(async (context) => {
      const controls = context.document.contentControls.getByTag('humanizer-pending');
      controls.load('items');
      await context.sync();
      controls.items.forEach(c => c.delete(true));
      await context.sync();
    });
  } catch (_) { /* ignore */ }
}

function resetBtn(id, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = label;
}

/* ---- Toast ---- */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
