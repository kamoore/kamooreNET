// Basic site config — edit to customize
const CONFIG = {
  contactEmail: 'github@kamoore.net',
  githubProfile: 'https://github.com/kamoore',
  dataPath: 'assets/data/projects.json',
  defaults: {
    theme: 'auto',
    accentStart: '#34d399',
    accentEnd: '#60a5fa',
    bgAccent1: '#34d399',
    bgAccent2: '#60a5fa'
  }
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

let PROJECTS = [];

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  } catch { return iso; }
}

function escapeHTML(s = '') {
  return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));
}

function projectCard(p) {
  const topics = (p.topics || []).slice(0, 6);
  const chips = topics.map(t => `<span class="chip">#${escapeHTML(t)}</span>`).join('');
  const descSrc = p.blurb || p.description;
  const desc = descSrc ? escapeHTML(descSrc) : 'No description yet.';
  const updated = p.updatedAt ? `Updated ${formatDate(p.updatedAt)}` : '';
  const star = typeof p.stars === 'number' ? `⭐ ${p.stars}` : '';
  const vis = p.isPrivate ? 'Private' : (p.visibility || 'Public');
  const openBtn = (p.url && !p.isPrivate)
    ? `<a class="btn btn-ghost" href="${p.url}" target="_blank" rel="noopener">Open</a>`
    : (p.url ? `<span class="btn btn-ghost is-disabled" aria-disabled="true">Open <span class="lock">🔒</span></span>` : '');
  const actions = `
    <div class="actions">
      ${openBtn}
      ${p.homepage ? `<a class="btn btn-ghost" href="${p.homepage}" target="_blank" rel="noopener">Website</a>` : ''}
      <a class="btn btn-primary" href="#contact" data-project="${encodeURIComponent(p.name)}">Request Access</a>
    </div>`;
  return `
    <article class="card" data-name="${escapeHTML(p.name)}" data-topics="${escapeHTML((p.topics||[]).join(' ').toLowerCase())}">
      <h3>${escapeHTML(p.name)}</h3>
      <p>${desc}</p>
      <div class="meta">${star ? `<span>${star}</span>` : ''}<span>${vis}</span>${updated ? `<span>•</span><span>${updated}</span>` : ''}</div>
      ${chips ? `<div class="chips">${chips}</div>` : ''}
      ${actions}
    </article>`;
}

function getSortMode() {
  const sel = $('#sort');
  return sel ? sel.value : 'date';
}

function renderProjects() {
  const grid = $('#projects-grid');
  const empty = $('#projects-empty');
  const q = ($('#search')?.value || '').trim().toLowerCase();
  const sort = getSortMode();
  let items = PROJECTS.slice();
  if (q) {
    items = items.filter(p => (
      (p.name || '').toLowerCase().includes(q) ||
      ((p.topics || []).join(' ').toLowerCase().includes(q)) ||
      (p.description || '').toLowerCase().includes(q)
    ));
  }
  if (sort === 'access') {
    items.sort((a, b) => {
      if (a.isPrivate !== b.isPrivate) return a.isPrivate ? 1 : -1;
      return (a.name || '').localeCompare(b.name || '');
    });
  } else {
    items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }
  grid.innerHTML = items.map(projectCard).join('');
  empty.classList.toggle('hidden', items.length > 0);
}

async function loadProjects() {
  const grid = $('#projects-grid');
  const empty = $('#projects-empty');
  try {
    const res = await fetch(CONFIG.dataPath, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    PROJECTS = (Array.isArray(data) ? data : data.projects || []);
    renderProjects();
  } catch (err) {
    console.warn('Failed to load projects.json', err);
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

function bindFilters() {
  $('#search')?.addEventListener('input', renderProjects);
  $('#sort')?.addEventListener('change', renderProjects);
}

function bindContact() {
  const mailto = $('#mailto-link');
  const compose = $('#compose');
  const gh = $('#github-link');
  if (mailto) mailto.href = `mailto:${encodeURIComponent(CONFIG.contactEmail)}?subject=${encodeURIComponent('Project Access Request')}`;
  if (gh && CONFIG.githubProfile) gh.href = CONFIG.githubProfile;

  compose?.addEventListener('click', () => {
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const lines = [
      `Hi Kyle,`,
      '',
      `I’d like access to one or more projects.`,
      name ? `Name: ${name}` : '',
      email ? `Reply-To: ${email}` : '',
      '',
      message || 'Details: '
    ].filter(Boolean);
    const body = encodeURIComponent(lines.join('\n'));
    const url = `mailto:${encodeURIComponent(CONFIG.contactEmail)}?subject=${encodeURIComponent('Project Access Request')}&body=${body}`;
    window.location.href = url;
  });

  // Autofill contact with project name when clicking Request Access on a card
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-project]');
    if (!a) return;
    const project = decodeURIComponent(a.getAttribute('data-project') || '');
    const m = $('#message');
    if (m && !m.value) m.value = `Requesting access to: ${project}`;
  });
}

function applyStylePrefs(prefs) {
  const d = document.documentElement;
  d.dataset.theme = prefs.theme || CONFIG.defaults.theme;
  d.style.setProperty('--accent-start', prefs.accentStart || CONFIG.defaults.accentStart);
  d.style.setProperty('--accent-end', prefs.accentEnd || CONFIG.defaults.accentEnd);
  d.style.setProperty('--bg-accent-1', prefs.bgAccent1 || CONFIG.defaults.bgAccent1);
  d.style.setProperty('--bg-accent-2', prefs.bgAccent2 || CONFIG.defaults.bgAccent2);
}

function loadStylePrefs() {
  try {
    const raw = localStorage.getItem('stylePrefs');
    return raw ? { ...CONFIG.defaults, ...JSON.parse(raw) } : { ...CONFIG.defaults };
  } catch { return { ...CONFIG.defaults }; }
}

function saveStylePrefs(prefs) { localStorage.setItem('stylePrefs', JSON.stringify(prefs)); }

function bindStylePanel() {
  const prefs = loadStylePrefs();
  applyStylePrefs(prefs);

  const openers = ['#style-btn', '#style-open'].map(sel => $(sel)).filter(Boolean);
  const panel = $('#style-panel');
  const closeBtn = $('#style-close');
  const resetBtn = $('#style-reset');
  const themeSel = $('#theme-select');
  const accentStart = $('#accent-start');
  const accentEnd = $('#accent-end');
  const bg1 = $('#bg-accent-1');
  const bg2 = $('#bg-accent-2');

  // Initialize fields
  themeSel.value = prefs.theme;
  accentStart.value = prefs.accentStart;
  accentEnd.value = prefs.accentEnd;
  bg1.value = prefs.bgAccent1;
  bg2.value = prefs.bgAccent2;

  const setOpen = (open) => {
    panel.classList.toggle('hidden', !open);
    openers.forEach(btn => btn?.setAttribute('aria-expanded', String(open)));
    if (open) themeSel.focus();
  };

  openers.forEach(btn => btn?.addEventListener('click', () => setOpen(panel.classList.contains('hidden'))));
  closeBtn?.addEventListener('click', () => setOpen(false));

  // Outside click
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('hidden')) return;
    const wrap = panel.closest('.style-wrap');
    if (!wrap?.contains(e.target)) setOpen(false);
  });
  // ESC key
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  function update() {
    const next = {
      theme: themeSel.value,
      accentStart: accentStart.value,
      accentEnd: accentEnd.value,
      bgAccent1: bg1.value,
      bgAccent2: bg2.value
    };
    applyStylePrefs(next);
    saveStylePrefs(next);
  }
  [themeSel, accentStart, accentEnd, bg1, bg2].forEach(el => el?.addEventListener('input', update));
  resetBtn?.addEventListener('click', () => {
    applyStylePrefs(CONFIG.defaults);
    saveStylePrefs(CONFIG.defaults);
    themeSel.value = CONFIG.defaults.theme;
    accentStart.value = CONFIG.defaults.accentStart;
    accentEnd.value = CONFIG.defaults.accentEnd;
    bg1.value = CONFIG.defaults.bgAccent1;
    bg2.value = CONFIG.defaults.bgAccent2;
  });
}

function initFooter() { $('#year').textContent = String(new Date().getFullYear()); }

function initConsole() {
  const out = document.getElementById('console-output');
  if (!out) return;
  const body = document.querySelector('.console-body');
  const cursor = document.querySelector('.cursor');
  const replay = document.getElementById('console-replay');
  const SPEED = 2.0; // slower typing multiplier

  const SIMULATIONS = [
    [
      { t: '$ codex init hobbitai --stack py,twitch,voice', d: 20 },
      { t: '● Creating project: hobbitai', d: 8 },
      { t: '● Adding: twitch chat, wake-word, tts voice', d: 8 },
      { t: '$ codex run "respond to mentions as Hobbit"', d: 22 },
      { t: '[tmi] connected: #hobbit', d: 12 },
      { t: '[wake] hotword model loaded', d: 14 },
      { t: '$ voice train --speaker Hobbit --samples 12', d: 22 },
      { t: '[voice] training… ████████ 100%', d: 10 },
      { t: '$ save --profile stream', d: 20 },
      { t: '✓ ready — say "hey hobbit" in chat', d: 14 }
    ],
    [
      { t: '$ codex create sdr-scanner --stack py,nn,grpc', d: 22 },
      { t: '● Model: 10-code ASR profile', d: 10 },
      { t: '● DSP chain: rtl, fm, vad', d: 8 },
      { t: '$ codex run "transcribe 154.310 MHz"', d: 22 },
      { t: '[sdr] locked: 154.310 MHz (LAFD)', d: 12 },
      { t: '[vad] speech frames: 47', d: 10 },
      { t: '[asr] 10-97 arriving on scene', d: 12 },
      { t: '$ save --profile scanner', d: 18 },
      { t: '✓ stream ready — buffering 5s', d: 12 }
    ],
    [
      { t: '$ codex init fivem-tools --stack js,ws,ui', d: 22 },
      { t: '● Adding: events, ptt overlay, replay buf', d: 10 },
      { t: '$ codex run "highlight @mentions and clip 10s"', d: 22 },
      { t: '[ws] connected: game pipe', d: 12 },
      { t: '[clip] hotkey ⌥C armed', d: 12 },
      { t: '✓ ready — testing overlay…', d: 12 }
    ]
  ];

  let simIndex = Math.floor(Math.random() * SIMULATIONS.length);

  const append = (s) => {
    out.textContent += s;
    // keep bottom pinned while hiding scrollbar
    if (body) body.scrollTop = body.scrollHeight;
  };
  const newline = () => { append('\n'); };
  async function typeLine(text, speed) {
    for (let i = 0; i < text.length; i++) {
      append(text[i]);
      await new Promise(r => setTimeout(r, speed * SPEED));
    }
    newline();
  }
  async function run() {
    cursor?.classList.remove('hidden');
    out.textContent = '';
    if (body) body.scrollTop = 0;
    const lines = SIMULATIONS[simIndex];
    for (const L of lines) {
      await typeLine(L.t, L.d);
    }
    cursor?.classList.add('hidden');
  }
  replay?.addEventListener('click', () => {
    // pick a different simulation when possible
    const next = Math.floor(Math.random() * SIMULATIONS.length);
    simIndex = (SIMULATIONS.length > 1 && next === simIndex) ? (next + 1) % SIMULATIONS.length : next;
    run();
  });
  run();
}

window.addEventListener('DOMContentLoaded', async () => {
  initFooter();
  bindStylePanel();
  bindFilters();
  bindContact();
  initConsole();
  await loadProjects();
});
