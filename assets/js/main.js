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
  const actions = `
    <div class="actions">
      ${p.url ? `<a class="btn btn-ghost" href="${p.url}" target="_blank" rel="noopener">Open</a>` : ''}
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

async function loadProjects() {
  const grid = $('#projects-grid');
  const empty = $('#projects-empty');
  try {
    const res = await fetch(CONFIG.dataPath, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = (Array.isArray(data) ? data : data.projects || []).sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0));
    grid.innerHTML = items.map(projectCard).join('');
    empty.classList.toggle('hidden', items.length > 0);
  } catch (err) {
    console.warn('Failed to load projects.json', err);
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  }
}

function bindSearch() {
  const input = $('#search');
  const grid = $('#projects-grid');
  const empty = $('#projects-empty');
  const filter = () => {
    const q = input.value.trim().toLowerCase();
    const cards = $$('.card', grid);
    let visible = 0;
    cards.forEach(c => {
      const hay = (c.dataset.name + ' ' + c.dataset.topics).toLowerCase();
      const show = !q || hay.includes(q);
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    empty.classList.toggle('hidden', visible > 0);
  };
  input.addEventListener('input', filter);
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

window.addEventListener('DOMContentLoaded', async () => {
  initFooter();
  bindStylePanel();
  bindSearch();
  bindContact();
  await loadProjects();
});
