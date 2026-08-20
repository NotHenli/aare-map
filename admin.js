/* Aare Map Admin Dashboard
 * Tabbed interface for managing POIs, translations, alerts, and settings.
 * Publishes by committing data/pois.js, data/site.js, and data/messages.js
 * to GitHub. Vercel redeploys automatically (~1 min after save).
 * The GitHub token is pasted by the admin and kept in localStorage only. */

const REPO_OWNER = 'NotHenli';
const REPO_NAME = 'aare-map';
const BRANCH = 'main';

// Deep-clone utility
const clone = o => JSON.parse(JSON.stringify(o));

// Working copies
const state = {
  site: clone(SITE),
  pois: clone(POIS),
  zones: clone(EXIT_ZONES),
  messages: clone(MESSAGES)
};

const $ = id => document.getElementById(id);

// ============================================================
//  Toast
// ============================================================
let toastTimer;
function toast(msg, ms = 3500) {
  $('adm-toast').textContent = msg;
  $('adm-toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('adm-toast').classList.remove('show'), ms);
}

// ============================================================
//  Tabs
// ============================================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function switchTab(tabId) {
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  tabPanels.forEach(p => p.classList.toggle('active', p.id === `panel-${tabId}`));
  history.replaceState(null, '', `#${tabId}`);

  // Lazy-init translation editor
  if (tabId === 'translations' && !transBuilt) buildTransEditor();
}

tabBtns.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

// Init from hash
const initTab = location.hash.replace('#', '') || 'pois';
if (document.querySelector(`[data-tab="${initTab}"]`)) switchTab(initTab);

// ============================================================
//  Serialization: regenerate the data files
// ============================================================
function siteFile() {
  return '// Site-wide configuration, editable via admin.html (published through GitHub,\n' +
    '// live ~1 minute after saving). Loaded on every page before app.js.\n' +
    'const SITE = ' + JSON.stringify(state.site, null, 2) + ';\n';
}

function poisFile() {
  return '// Points of interest along the float route Thun–Bern, in downstream order.\n' +
    '// Positions verified on the ground by the site owner (do not blindly reset to OSM).\n' +
    '// Edited via admin.html – see that page for the field reference.\n' +
    'const POIS = ' + JSON.stringify(state.pois, null, 2) + ';\n\n' +
    '// Bank stretches where getting out is possible anywhere (zones along the river).\n' +
    'const EXIT_ZONES = ' + JSON.stringify(state.zones, null, 2) + ';\n';
}

function messagesFile() {
  return '// UI strings for Aare Map – Multilingual support for Swiss tourism & river safety.\n' +
    'const LANGS = ' + JSON.stringify(LANGS) + ';\n\n' +
    'const LANG_INFO = ' + JSON.stringify(LANG_INFO, null, 2) + ';\n\n' +
    'const MESSAGES = ' + JSON.stringify(state.messages, null, 2) + ';\n';
}

// ============================================================
//  Dirty tracking
// ============================================================
const original = { site: '', pois: '', messages: '' };
function isDirty() {
  return siteFile() !== original.site ||
         poisFile() !== original.pois ||
         messagesFile() !== original.messages;
}
function refreshDirty() {
  $('dirty-note').textContent = isDirty() ? 'Ungespeicherte Änderungen' : '';
  $('publish').disabled = !isDirty();
}

// ============================================================
//  POI List with Search & Filter
// ============================================================
const AUD_LABEL = { public: 'öffentlich', partner: 'Vermietung' };
let poiFilter = 'all';
let poiSearch = '';

function renderPoiList() {
  const ul = $('poi-list');
  ul.innerHTML = '';
  const q = poiSearch.toLowerCase();

  const filtered = state.pois.filter((p, i) => {
    if (poiFilter !== 'all' && p.type !== poiFilter) return false;
    if (q) {
      const hay = `${p.id} ${p.name.de || ''} ${p.name.en || ''} ${p.name.fr || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    ul.innerHTML = '<li class="poi-empty">Keine Punkte gefunden.</li>';
    return;
  }

  filtered.forEach(p => {
    const realIndex = state.pois.indexOf(p);
    const li = document.createElement('li');
    const aud = p.audience ? `<span class="poi-aud">${AUD_LABEL[p.audience] || p.audience}</span>` : '';
    const premium = p.isPremium ? '<span class="poi-aud">★</span>' : '';
    li.innerHTML =
      `<span class="poi-tag ${p.type}">${p.type}</span>` +
      `<span class="poi-name">${p.name.de || p.id}</span>${premium}${aud}`;
    li.addEventListener('click', () => openEditor(realIndex));
    ul.appendChild(li);
  });
}

// Search
$('poi-search').addEventListener('input', e => {
  poiSearch = e.target.value;
  renderPoiList();
});

// Filter pills
$('poi-filters').addEventListener('click', e => {
  const pill = e.target.closest('.filter-pill');
  if (!pill) return;
  poiFilter = pill.dataset.filter;
  $('poi-filters').querySelectorAll('.filter-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.filter === poiFilter));
  renderPoiList();
});

// ============================================================
//  POI Editor Dialog
// ============================================================
let editIndex = -1;
let pickMap = null, pickMarker = null;

function ensurePickMap() {
  if (pickMap) return;
  pickMap = L.map('pick-map', { attributionControl: false });
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg', {
    maxZoom: 19
  }).addTo(pickMap);
  pickMap.on('click', e => setPickPos(e.latlng.lat, e.latlng.lng));
}

function setPickPos(lat, lon) {
  lat = +lat.toFixed(5);
  lon = +lon.toFixed(5);
  $('e-lat').value = lat;
  $('e-lon').value = lon;
  if (!pickMarker) {
    pickMarker = L.marker([lat, lon], { draggable: true }).addTo(pickMap)
      .on('dragend', () => {
        const ll = pickMarker.getLatLng();
        setPickPos(ll.lat, ll.lng);
      });
  } else {
    pickMarker.setLatLng([lat, lon]);
  }
}

// Build language tab fields for a multilingual property (name, desc, hours)
function buildLangTabs(containerId, fieldsId, fieldType, prefix) {
  const tabsEl = $(containerId);
  const fieldsEl = $(fieldsId);
  tabsEl.innerHTML = '';
  fieldsEl.innerHTML = '';

  LANGS.forEach((lang, i) => {
    const code = lang.toUpperCase();
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `lang-tab${i === 0 ? ' active' : ''}`;
    tab.textContent = code;
    tab.dataset.lang = lang;
    tab.addEventListener('click', () => {
      tabsEl.querySelectorAll('.lang-tab').forEach(t => t.classList.toggle('active', t === tab));
      fieldsEl.querySelectorAll('.lang-fields').forEach(f =>
        f.classList.toggle('active', f.dataset.lang === lang));
    });
    tabsEl.appendChild(tab);

    const div = document.createElement('div');
    div.className = `lang-fields${i === 0 ? ' active' : ''}`;
    div.dataset.lang = lang;

    if (fieldType === 'input') {
      div.innerHTML = `<label class="field">${code} <input id="${prefix}-${lang}"></label>`;
    } else {
      div.innerHTML = `<label class="field">${code} <textarea id="${prefix}-${lang}" rows="3"></textarea></label>`;
    }
    fieldsEl.appendChild(div);
  });

  // "Show all" toggle
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'lang-toggle';
  toggle.textContent = 'Alle anzeigen';
  let expanded = false;
  toggle.addEventListener('click', () => {
    expanded = !expanded;
    toggle.textContent = expanded ? 'Nur eine' : 'Alle anzeigen';
    fieldsEl.querySelectorAll('.lang-fields').forEach(f => {
      f.classList.toggle('active', expanded || f.dataset.lang === tabsEl.querySelector('.lang-tab.active')?.dataset.lang);
    });
  });
  tabsEl.appendChild(toggle);
}

function openEditor(i) {
  editIndex = i;
  const p = i >= 0 ? state.pois[i] : {
    id: '', type: 'info', lat: 46.85, lon: 7.53,
    name: {}, desc: {}, hours: {}
  };
  $('editor-title').textContent = i >= 0 ? `Punkt bearbeiten: ${p.id}` : 'Neuer Punkt';
  $('e-id').value = p.id;
  $('e-id').disabled = i >= 0;
  $('e-type').value = p.type;
  $('e-audience').value = p.audience || '';
  $('e-minzoom').value = p.minZoom || '';
  $('e-lat').value = p.lat;
  $('e-lon').value = p.lon;
  $('e-url').value = p.url || '';
  $('e-action-url').value = p.actionUrl || '';
  $('e-logo-url').value = p.logoUrl || '';
  $('e-premium').checked = !!p.isPremium;

  // Build lang tabs for name/desc/hours
  buildLangTabs('e-name-tabs', 'e-name-fields', 'input', 'e-name');
  buildLangTabs('e-desc-tabs', 'e-desc-fields', 'textarea', 'e-desc');
  buildLangTabs('e-hours-tabs', 'e-hours-fields', 'input', 'e-hours');

  // Fill values
  LANGS.forEach(l => {
    const nameEl = $(`e-name-${l}`);
    const descEl = $(`e-desc-${l}`);
    const hoursEl = $(`e-hours-${l}`);
    if (nameEl) nameEl.value = (p.name && p.name[l]) || '';
    if (descEl) descEl.value = (p.desc && p.desc[l]) || '';
    if (hoursEl) hoursEl.value = (p.hours && p.hours[l]) || '';
  });

  $('e-delete').style.display = i >= 0 ? '' : 'none';
  $('editor-wrap').classList.remove('hidden');

  ensurePickMap();
  setTimeout(() => {
    pickMap.invalidateSize();
    pickMap.setView([p.lat, p.lon], 15);
    setPickPos(p.lat, p.lon);
  }, 60);
}

function closeEditor() {
  $('editor-wrap').classList.add('hidden');
}

function saveEditor() {
  const id = $('e-id').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const lat = parseFloat($('e-lat').value);
  const lon = parseFloat($('e-lon').value);
  const nameDe = ($('e-name-de')?.value || '').trim();

  if (!id) return toast('Bitte eine ID vergeben (z. B. "grillplatz-jaberg").');
  if (editIndex < 0 && state.pois.some(p => p.id === id)) return toast(`ID "${id}" existiert bereits.`);
  if (!(lat > 46.7 && lat < 47.0 && lon > 7.3 && lon < 7.7)) return toast('Position liegt ausserhalb des Streckengebiets.');
  if (!nameDe) return toast('Mindestens der deutsche Name ist nötig.');

  const p = editIndex >= 0 ? state.pois[editIndex] : { id, name: {}, desc: {} };
  p.type = $('e-type').value;
  p.lat = lat;
  p.lon = lon;

  const aud = $('e-audience').value;
  if (aud) p.audience = aud; else delete p.audience;
  const mz = parseInt($('e-minzoom').value, 10);
  if (mz) p.minZoom = mz; else delete p.minZoom;
  const url = $('e-url').value.trim();
  if (url) p.url = url; else delete p.url;
  const actionUrl = $('e-action-url').value.trim();
  if (actionUrl) p.actionUrl = actionUrl; else delete p.actionUrl;
  const logoUrl = $('e-logo-url').value.trim();
  if (logoUrl) p.logoUrl = logoUrl; else delete p.logoUrl;
  const premium = $('e-premium').checked;
  if (premium) p.isPremium = true; else delete p.isPremium;

  // Multilingual fields
  if (!p.name) p.name = {};
  if (!p.desc) p.desc = {};

  LANGS.forEach(l => {
    const nv = ($(`e-name-${l}`)?.value || '').trim();
    p.name[l] = nv || nameDe; // fallback to DE
    const dv = ($(`e-desc-${l}`)?.value || '').trim();
    const descDe = ($('e-desc-de')?.value || '').trim();
    p.desc[l] = dv || descDe; // fallback to DE
  });

  // Hours (optional)
  const hasHours = LANGS.some(l => ($(`e-hours-${l}`)?.value || '').trim());
  if (hasHours) {
    if (!p.hours) p.hours = {};
    LANGS.forEach(l => {
      const hv = ($(`e-hours-${l}`)?.value || '').trim();
      if (hv) p.hours[l] = hv;
    });
  } else {
    delete p.hours;
  }

  if (!p.desc.de) return toast('Bitte eine deutsche Beschreibung erfassen.');

  if (editIndex < 0) {
    // Keep downstream order: insert by latitude (Thun south → Bern north)
    const at = state.pois.findIndex(x => x.lat > p.lat);
    state.pois.splice(at < 0 ? state.pois.length : at, 0, p);
  }
  closeEditor();
  renderPoiList();
  refreshDirty();
}

function deleteEditor() {
  const p = state.pois[editIndex];
  if (['schwaebis', 'schwelle', 'eichholz'].includes(p.id)) {
    return toast('Dieser Punkt ist sicherheitsrelevant und kann nicht gelöscht werden.');
  }
  if (!confirm(`«${p.name.de}» wirklich löschen?`)) return;
  state.pois.splice(editIndex, 1);
  closeEditor();
  renderPoiList();
  refreshDirty();
}

// ============================================================
//  Translation Editor
// ============================================================
let transBuilt = false;
const TRANS_SECTIONS = {
  'Navigation & Labels': ['subtitle', 'listBtn', 'resetBtn', 'panelTitle', 'labelStart', 'labelEnd', 'subtitlePartner'],
  'Legende': ['legendEntry', 'legendDanger', 'legendExit', 'legendWeir', 'legendRental'],
  'Live-Daten': ['statsTitle', 'statTemp', 'statFlowThun', 'statFlowBern', 'statTime'],
  'Fortschritt & Sicherheit': ['progress', 'progressDanger', 'progressMissedExit', 'hazardAhead', 'highFlow'],
  'Standort & Berechtigungen': ['locError', 'locateAria', 'locateHint', 'permTitle', 'permBody',
    'permStep1', 'permStep2', 'permStep3', 'permStep4', 'permSettings', 'permClose'],
  'Onboarding': ['introStart', 'introHintPartner', 'website'],
  'Rechtliches & Footer': ['disclaimer'],
  'Sonstiges': ['beerHint']
};

function buildTransEditor() {
  transBuilt = true;
  const container = $('trans-editor');
  container.innerHTML = '';

  // Populate language selector
  const langSelect = $('trans-lang');
  langSelect.innerHTML = '';
  LANGS.filter(l => l !== 'de').forEach(l => {
    const info = LANG_INFO[l];
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = `${info?.code || l.toUpperCase()} – ${info?.name || l}`;
    langSelect.appendChild(opt);
  });

  const currentLang = () => langSelect.value || 'en';

  function renderTransFields() {
    container.innerHTML = '';
    const lang = currentLang();
    const deMessages = state.messages.de || {};
    const langMessages = state.messages[lang] || {};

    // Collect all keys we know about
    const allSectionKeys = new Set();
    Object.values(TRANS_SECTIONS).forEach(keys => keys.forEach(k => allSectionKeys.add(k)));

    // Find keys not in any section (catch-all)
    const extraKeys = Object.keys(deMessages).filter(k => !allSectionKeys.has(k));
    const sections = { ...TRANS_SECTIONS };
    if (extraKeys.length) sections['Weitere'] = extraKeys;

    for (const [section, keys] of Object.entries(sections)) {
      const sec = document.createElement('div');
      sec.className = 'trans-section';
      sec.innerHTML = `<h3>${section}</h3>`;

      keys.forEach(key => {
        const deVal = deMessages[key] || '';
        const langVal = langMessages[key] || '';

        const row = document.createElement('div');
        row.className = 'trans-row';

        const isLong = deVal.length > 80;
        const inputHtml = isLong
          ? `<textarea class="trans-input" data-key="${key}" rows="3">${escHtml(langVal)}</textarea>`
          : `<input class="trans-input" data-key="${key}" value="${escAttr(langVal)}">`;

        row.innerHTML =
          `<div class="trans-key">${key}<div class="trans-ref">DE: ${escHtml(deVal.substring(0, 120))}${deVal.length > 120 ? '…' : ''}</div></div>` +
          `<div>${inputHtml}</div>`;

        sec.appendChild(row);
      });

      container.appendChild(sec);
    }

    // Bind change events
    container.querySelectorAll('.trans-input').forEach(el => {
      el.addEventListener('input', () => {
        const lang = currentLang();
        if (!state.messages[lang]) state.messages[lang] = {};
        state.messages[lang][el.dataset.key] = el.value;
        refreshDirty();
      });
    });
  }

  langSelect.addEventListener('change', renderTransFields);
  renderTransFields();
}

function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// ============================================================
//  Alert Form
// ============================================================
function buildAlertLangFields() {
  const container = $('alert-langs');
  container.innerHTML = '';
  // Build textarea for each language that has alert text support
  // Use de, en, fr as primary, but allow all LANGS
  const alertLangs = ['de', 'en', 'fr'];
  alertLangs.forEach(l => {
    const code = l.toUpperCase();
    const val = state.site.alert.text[l] || '';
    container.innerHTML += `<label class="field">${code} <textarea id="alert-${l}" rows="2">${escHtml(val)}</textarea></label>`;
  });

  // Bind
  alertLangs.forEach(l => {
    $(`alert-${l}`).addEventListener('input', () => {
      state.site.alert.text[l] = $(`alert-${l}`).value.trim();
      updateAlertPreview();
      refreshDirty();
    });
  });
}

function updateAlertPreview() {
  const a = state.site.alert;
  const preview = $('alert-preview');
  if (!a.enabled) {
    preview.className = 'alert-preview off';
    preview.textContent = 'Kein Alert aktiv';
    return;
  }
  preview.className = `alert-preview ${a.level}`;
  preview.textContent = a.text.de || '(kein Text)';
}

function bindAlertForm() {
  const sync = () => {
    state.site.alert.enabled = $('alert-enabled').checked;
    state.site.alert.level = $('alert-level').value;
    updateAlertPreview();
    refreshDirty();
  };
  $('alert-enabled').addEventListener('change', sync);
  $('alert-level').addEventListener('change', sync);
}

function loadAlertForm() {
  const a = state.site.alert;
  $('alert-enabled').checked = !!a.enabled;
  $('alert-level').value = a.level || 'info';
  buildAlertLangFields();
  updateAlertPreview();
}

// ============================================================
//  Settings
// ============================================================
function loadSettings() {
  // Partner info (read-only)
  const partnerEl = $('partner-info');
  const partners = state.site.partners || {};
  const entries = Object.entries(partners);
  if (entries.length === 0) {
    partnerEl.textContent = 'Keine Partner konfiguriert.';
  } else {
    partnerEl.innerHTML = entries.map(([id, p]) =>
      `<strong>${p.name}</strong> (<code>/${id}</code>)<br>` +
      `Exit: <code>${p.exitPoiId}</code> · ` +
      `<a href="${p.url}" target="_blank" rel="noopener">${p.url} ↗</a>`
    ).join('<br><br>');
  }

  // TWINT
  $('twint-url').value = state.site.twintUrl || '';
  $('twint-url').addEventListener('input', () => {
    const val = $('twint-url').value.trim();
    if (val) state.site.twintUrl = val; else delete state.site.twintUrl;
    refreshDirty();
  });
}

// ============================================================
//  GitHub Publishing
// ============================================================
const tokenKey = 'aare-admin-token';
const getToken = () => { try { return localStorage.getItem(tokenKey) || ''; } catch { return ''; } };

const gh = (path, opts = {}) =>
  fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {})
    }
  });

const b64 = s => btoa(unescape(encodeURIComponent(s)));

async function putFile(path, content, message) {
  const cur = await gh(`contents/${path}?ref=${BRANCH}`);
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  const res = await gh(`contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: b64(content), branch: BRANCH, sha })
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${(await res.json()).message || ''}`);
}

async function checkToken() {
  const el = $('conn-status');
  if (!getToken()) {
    el.textContent = 'Nicht verbunden';
    el.className = 'adm-status none';
    return;
  }
  try {
    const res = await gh('');
    if (res.ok) {
      el.textContent = `✓ ${REPO_OWNER}/${REPO_NAME}`;
      el.className = 'adm-status ok';
    } else {
      el.textContent = `✗ Token ungültig (${res.status})`;
      el.className = 'adm-status err';
    }
  } catch {
    el.textContent = '✗ Verbindung fehlgeschlagen';
    el.className = 'adm-status err';
  }
}

function validateAll() {
  const a = state.site.alert;
  if (a.enabled && !a.text.de) return 'Site-Alert ist aktiv, aber der deutsche Text fehlt.';
  for (const p of state.pois) {
    if (!p.name.de || !p.desc.de) return `POI "${p.id}": Deutscher Text fehlt.`;
  }
  return null;
}

async function publish() {
  const problem = validateAll();
  if (problem) return toast('⚠️ ' + problem);
  if (!getToken()) return toast('Bitte zuerst einen GitHub-Token speichern.');
  const btn = $('publish');
  btn.disabled = true;
  btn.textContent = 'Veröffentliche…';
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await putFile('data/site.js', siteFile(), `Admin: site config (${stamp})`);
    await putFile('data/pois.js', poisFile(), `Admin: POIs (${stamp})`);
    await putFile('data/messages.js', messagesFile(), `Admin: translations (${stamp})`);
    original.site = siteFile();
    original.pois = poisFile();
    original.messages = messagesFile();
    toast('✓ Veröffentlicht – in ca. 1 Minute live.', 6000);
  } catch (e) {
    toast('✗ Fehler: ' + e.message, 8000);
  }
  btn.textContent = 'Veröffentlichen';
  refreshDirty();
}

function download() {
  [['site.js', siteFile()], ['pois.js', poisFile()], ['messages.js', messagesFile()]].forEach(([name, content]) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  toast('Dateien heruntergeladen – nach data/ kopieren und pushen.');
}

// ============================================================
//  Init
// ============================================================
original.site = siteFile();
original.pois = poisFile();
original.messages = messagesFile();

loadAlertForm();
bindAlertForm();
loadSettings();
renderPoiList();
refreshDirty();
checkToken();
$('token').value = getToken();

// Event bindings
$('token-save').addEventListener('click', () => {
  try { localStorage.setItem(tokenKey, $('token').value.trim()); } catch { /* private mode */ }
  checkToken();
  toast('Token gespeichert.');
});

$('poi-add').addEventListener('click', () => openEditor(-1));
$('e-save').addEventListener('click', saveEditor);
$('e-cancel').addEventListener('click', closeEditor);
$('e-delete').addEventListener('click', deleteEditor);
$('editor-wrap').addEventListener('click', e => { if (e.target === $('editor-wrap')) closeEditor(); });
$('publish').addEventListener('click', publish);
$('download').addEventListener('click', download);
window.addEventListener('beforeunload', e => { if (isDirty()) e.preventDefault(); });
