// script.js — EDNA game (language, difficulty, water types, extras)
// ---------------------------------------------------------------
// Required HTML IDs on analyzer pages:
// - buttons-container   : where water-type buttons go
// - result-container    : wraps the results area (hidden by default is fine)
// - result-title        : title above the code list ("Results for: River")
// - code-container      : list of code rows is rendered here
//
// Optional IDs (if you have buttons for checking/resetting):
// - check-btn           : clicking it evaluates answers (✔️/❌)
// - reset-btn           : clears all selected answers
//
// CSS note: add these to style.css for colored bases (if not already):
// .base { font-weight: 600; }
// .base-a { color: #d32f2f; } /* A */
// .base-c { color: #1976d2; } /* C */
// .base-g { color: #388e3c; } /* G */
// .base-t { color: #f57c00; } /* T */

(function () {
  // ---------- Language detection (cz/en) ----------
  function detectLang() {
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('cs') || htmlLang.startsWith('cz')) return 'cz';
    if (htmlLang.startsWith('en')) return 'en';
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('-cz')) return 'cz';
    if (path.includes('-en')) return 'en';
    return 'en';
  }
  const lang = detectLang();

  // ---------- Difficulty (icons / sequences) ----------
  const qs = new URLSearchParams(window.location.search);
  const level = (qs.get('level') === 'sequences') ? 'sequences' : 'icons';

  // ---------- State ----------
  let waterData = {};         // full JSON
  let WATER_KEYS = [];        // keys except "extras"
  let EXTRAS = [];            // array of extra entries
  let speciesList = [];       // all species names in current language (sorted)
  let currentWaterKey = null; // which water type is open
  let currentCodes = [];      // entries for the open water type (plus any added extras)

  // ---------- DOM refs (safe getters) ----------
  function byId(id) { return document.getElementById(id); }

  function ensureContainer(id) {
    let el = byId(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    return el;
  }

  const buttonsContainer = ensureContainer('buttons-container');
  const resultContainer  = ensureContainer('result-container');
  const resultTitle      = ensureContainer('result-title');
  const codeContainer    = ensureContainer('code-container');

  // ---------- Data helpers (support new + old formats) ----------
  function getSeqAndIcon(entry) {
    // New format: { sequence: "ACGT", icon: "🐟", species: {...} }
    if (entry.sequence !== undefined || entry.icon !== undefined) {
      return { seq: entry.sequence || '', icon: entry.icon || '' };
    }
    // Back-compat: { code: "🧬ACGT | 🐟", species: {...} }
    if (entry.code) {
      const cleaned = String(entry.code).trim().replace(/^🧬\s*/, '');
      const parts = cleaned.split('|').map(s => s.trim());
      const seqPart = parts[0] || '';
      const iconPart = parts[1] || '';
      return { seq: seqPart, icon: iconPart };
    }
    return { seq: '', icon: '' };
  }

  // Render-time coloring of plain A/C/G/T (no HTML in JSON needed)
  function colorize(seq) {
    const map = {
      'A': '<span class="base base-a">A</span>',
      'C': '<span class="base base-c">C</span>',
      'G': '<span class="base base-g">G</span>',
      'T': '<span class="base base-t">T</span>'
    };
    return String(seq)
      .split('')
      .map(ch => map[ch.toUpperCase()] || ch)
      .join('');
  }

  // Returns either colored sequence HTML (for sequences mode) or icon text
  function formatForDisplay(entry) {
    const { seq, icon } = getSeqAndIcon(entry);
    if (level === 'sequences' && seq) {
      return { isHTML: true, html: colorize(seq) };
    }
    // fallback and also default in icons mode
    return { isHTML: false, text: icon || '' };
  }

  // ---------- Build UI ----------
  function buildWaterButtons() {
    buttonsContainer.innerHTML = '';
    WATER_KEYS.forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = waterData[key].title[lang];
      btn.addEventListener('click', () => openWaterType(key));
      buttonsContainer.appendChild(btn);
    });
  }

  function openWaterType(key) {
    currentWaterKey = key;
    currentCodes = Array.isArray(waterData[key].codes) ? [...waterData[key].codes] : [];
    renderResultTitle(key);
    renderCodeList();
    resultContainer.style.display = 'block';
  }

  function renderResultTitle(key) {
    const waterTitle = waterData[key].title[lang];
    resultTitle.textContent = (lang === 'cz')
      ? `Výsledky pro: ${waterTitle}`
      : `Results for: ${waterTitle}`;
  }

  function buildSpeciesList() {
  const set = new Set();
  const collect = (arr) => (arr || []).forEach(e => set.add(e.species?.[lang] || ''));

  // include all assigned water types
  WATER_KEYS.forEach(k => collect(waterData[k].codes));

  // include extras (unassigned animals)
  if (waterData.extras && Array.isArray(waterData.extras.codes)) {
    collect(waterData.extras.codes);
  }

  const arr = Array.from(set).filter(Boolean);
  arr.sort((a, b) => a.localeCompare(b, (lang === 'cz') ? 'cs' : 'en'));
  speciesList = arr;
}

  function addPlaceholderOption(selectEl) {
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = (lang === 'cz') ? '— vyberte druh —' : '— choose species —';
  opt.disabled = true;
  opt.selected = true;
  selectEl.appendChild(opt);
}
  
  function buildSpeciesOptions(selectEl) {
  selectEl.innerHTML = '';
  addPlaceholderOption(selectEl);
  speciesList.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    selectEl.appendChild(opt);
  });
}

  function renderCodeList() {
    codeContainer.innerHTML = '';

    currentCodes.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'code-row';

      const label = document.createElement('span');
      label.textContent = `${index + 1}. `;
      label.style.marginRight = '6px';

      const codeEl = document.createElement('div');
      codeEl.className = 'code-item';

      const out = formatForDisplay(entry);
      if (out.isHTML) {
        codeEl.innerHTML = out.html; // colored bases
      } else {
        codeEl.textContent = out.text; // icons
      }

      const select = document.createElement('select');
      select.id = `select-${index}`;
      buildSpeciesOptions(select);

      const resultSpan = document.createElement('span');
      resultSpan.id = `result-${index}`;
      resultSpan.style.marginLeft = '10px';

      row.appendChild(label);
      row.appendChild(codeEl);
      row.appendChild(select);
      row.appendChild(resultSpan);
      codeContainer.appendChild(row);
    });
  }

  // ---------- Checking answers (optional, if you have a "Check" button) ----------
  function checkAnswers() {
    let correct = 0;
    currentCodes.forEach((entry, index) => {
      const select = byId(`select-${index}`);
      const resultSpan = byId(`result-${index}`);
      if (!select || !resultSpan) return;

      const picked = select.value;
      const target = entry.species?.[lang] || '';
      const isOk = picked === target;

      resultSpan.textContent = isOk ? '✔️' : '❌';
      resultSpan.setAttribute('aria-label', isOk ? 'correct' : 'wrong');

      if (isOk) correct += 1;
    });

    const total = currentCodes.length;
    const msg = (lang === 'cz')
      ? `Správně: ${correct} / ${total}`
      : `Correct: ${correct} / ${total}`;
    // If you have a status element, show it; else log:
    const status = byId('status-line');
    if (status) status.textContent = msg; else console.log(msg);
  }

  // ---------- Reset selections (optional, if you have a "Reset" button) ----------
  function resetSelections() {
    currentCodes.forEach((_, index) => {
      const select = byId(`select-${index}`);
      const resultSpan = byId(`result-${index}`);
      if (select) select.selectedIndex = -1;
      if (resultSpan) resultSpan.textContent = '';
    });
    const status = byId('status-line');
    if (status) status.textContent = '';
  }

  // ---------- Wire optional buttons if present ----------
  function wireButtons() {
    const checkBtn = byId('check-btn');
    if (checkBtn) checkBtn.addEventListener('click', checkAnswers);

    const resetBtn = byId('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetSelections);
  }

  // ---------- Load data.json and initialize ----------
  function init() {
    fetch('data.json', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        waterData = json || {};

        // keys except extras
        WATER_KEYS = Object.keys(waterData).filter(k => k !== 'extras');

        // extras array (if present)
        EXTRAS = (waterData.extras && Array.isArray(waterData.extras.codes))
          ? waterData.extras.codes
          : [];

        // species list (sorted)
        buildSpeciesList();

        // build water buttons
        buildWaterButtons();

        // hide results until a water type is selected
        resultContainer.style.display = 'none';
        resultTitle.textContent = '';

        // wire optional buttons
        wireButtons();
      })
      .catch(err => {
        console.error('Failed to load data.json:', err);
        const msg = (lang === 'cz')
          ? 'Nepodařilo se načíst data. Zkontrolujte prosím soubor data.json.'
          : 'Failed to load data. Please check data.json.';
        resultTitle.textContent = msg;
        resultContainer.style.display = 'block';
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
