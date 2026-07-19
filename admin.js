/* Aare Map admin: edits the site alert and the POIs, then publishes by
 * committing data/site.js and data/pois.js to GitHub. Vercel redeploys
 * automatically, so changes are live about a minute after saving.
 * The GitHub token is pasted by the admin and kept in localStorage only. */

const REPO_OWNER = 'NotHenli';
const REPO_NAME = 'aare-map';
const BRANCH = 'main';

// Working copies (deep clones so "Abbrechen" never mutates the loaded data)
const clone = o => JSON.parse(JSON.stringify(o));
const state = { site: clone(SITE), pois: clone(POIS), zones: clone(EXIT_ZONES) };

const $ = id => document.getElementById(id);

// --- Toast ---
let toastTimer;
function toast(msg, ms = 3500) {
  $('adm-toast').textContent = msg;
  $('adm-toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('adm-toast').classList.remove('show'), ms);
}

// --- Serialization: regenerate the two data files ---
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

const original = { site: '', pois: '' };
function isDirty() { return siteFile() !== original.site || poisFile() !== original.pois; }
function refreshDirty() {
  $('dirty-note').textContent = isDirty() ? 'Ungespeicherte Änderungen' : '';
  $('publish').disabled = !isDirty();
}

// --- Alert form ---
function loadAlertForm() {
  const a = state.site.alert;
  $('alert-enabled').checked = !!a.enabled;
  $('alert-level').value = a.level || 'info';
  $('alert-de').value = a.text.de || '';
  $('alert-fr').value = a.text.fr || '';
  $('alert-en').value = a.text.en || '';
}
function bindAlertForm() {
  const sync = () => {
    const a = state.site.alert;
    a.enabled = $('alert-enabled').checked;
    a.level = $('alert-level').value;
    a.text.de = $('alert-de').value.trim();
    a.text.fr = $('alert-fr').value.trim();
    a.text.en = $('alert-en').value.trim();
    refreshDirty();
  };
  ['alert-enabled', 'alert-level', 'alert-de', 'alert-fr', 'alert-en']
    .forEach(id => $(id).addEventListener('input', sync));
}

// --- POI list ---
const AUD_LABEL = { public: 'öffentlich', partner: 'Vermietung' };
function renderPoiList() {
  const ul = $('poi-admin-list');
  ul.innerHTML = '';
  state.pois.forEach((p, i) => {
    const li = document.createElement('li');
    const aud = p.audience ? `<span class="poi-aud">${AUD_LABEL[p.audience] || p.audience}</span>` : '';
    li.innerHTML =
      `<span class="poi-tag ${p.type}">${p.type}</span>` +
      `<span class="poi-name">${p.name.de || p.id}</span>${aud}`;
    li.addEventListener('click', () => openEditor(i));
    ul.appendChild(li);
  });
}

// --- POI editor dialog with map picker ---
let editIndex = -1; // -1 = new POI
let pickMap = null, pickMarker = null;

function ensurePickMap() {
  if (pickMap) return;
  pickMap = L.map('pick-map', { attributionControl: false });
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg', { maxZoom: 19 }).addTo(pickMap);
  pickMap.on('click', e => setPickPos(e.latlng.lat, e.latlng.lng));
}
function setPickPos(lat, lon) {
  lat = +lat.toFixed(5); lon = +lon.toFixed(5);
  $('e-lat').value = lat;
  $('e-lon').value = lon;
  if (!pickMarker) pickMarker = L.marker([lat, lon], { draggable: true }).addTo(pickMap)
    .on('dragend', () => { const ll = pickMarker.getLatLng(); setPickPos(ll.lat, ll.lng); });
  else pickMarker.setLatLng([lat, lon]);
}

function openEditor(i) {
  editIndex = i;
  const p = i >= 0 ? state.pois[i] : {
    id: '', type: 'info', lat: 46.85, lon: 7.53,
    name: { de: '', fr: '', en: '' }, desc: { de: '', fr: '', en: '' }
  };
  $('editor-title').textContent = i >= 0 ? `Punkt bearbeiten: ${p.id}` : 'Neuer Punkt';
  $('e-id').value = p.id;
  $('e-id').disabled = i >= 0; // the id names the photo file – keep it stable
  $('e-type').value = p.type;
  $('e-audience').value = p.audience || '';
  $('e-minzoom').value = p.minZoom || '';
  $('e-lat').value = p.lat;
  $('e-lon').value = p.lon;
  $('e-url').value = p.url || '';
  ['de', 'fr', 'en'].forEach(l => {
    $(`e-name-${l}`).value = p.name[l] || '';
    $(`e-desc-${l}`).value = p.desc[l] || '';
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
function closeEditor() { $('editor-wrap').classList.add('hidden'); }

function saveEditor() {
  const id = $('e-id').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const lat = parseFloat($('e-lat').value), lon = parseFloat($('e-lon').value);
  const nameDe = $('e-name-de').value.trim();
  if (!id) return toast('Bitte eine ID vergeben (z. B. "grillplatz-jaberg").');
  if (editIndex < 0 && state.pois.some(p => p.id === id)) return toast(`ID "${id}" existiert bereits.`);
  if (!(lat > 46.7 && lat < 47.0 && lon > 7.3 && lon < 7.7)) return toast('Position liegt ausserhalb des Streckengebiets.');
  if (!nameDe) return toast('Mindestens der deutsche Name ist nötig.');

  const p = editIndex >= 0 ? state.pois[editIndex] : { id, name: {}, desc: {} };
  p.type = $('e-type').value;
  p.lat = lat; p.lon = lon;

  const aud = $('e-audience').value;
  if (aud) p.audience = aud; else delete p.audience;
  const mz = parseInt($('e-minzoom').value, 10);
  if (mz) p.minZoom = mz; else delete p.minZoom;
  const url = $('e-url').value.trim();
  if (url) p.url = url; else delete p.url;

  ['de', 'fr', 'en'].forEach(l => {
    // missing translations fall back to German so the site never shows a hole
    p.name[l] = $(`e-name-${l}`).value.trim() || nameDe;
    p.desc[l] = $(`e-desc-${l}`).value.trim() || $('e-desc-de').value.trim();
  });
  if (!p.desc.de) return toast('Bitte eine deutsche Beschreibung erfassen.');

  if (editIndex < 0) {
    // keep downstream order: insert by latitude relative to the flow (Thun south → Bern north)
    const at = state.pois.findIndex(x => x.lat > p.lat);
    state.pois.splice(at < 0 ? state.pois.length : at, 0, p);
  }
  closeEditor();
  renderPoiList();
  refreshDirty();
}

function deleteEditor() {
  const p = state.pois[editIndex];
  if (['schwaebis', 'marzili', 'schwelle', 'eichholz'].includes(p.id)) {
    return toast('Dieser Punkt ist sicherheitsrelevant bzw. Streckenanfang/-ende und kann nicht gelöscht werden.');
  }
  if (!confirm(`«${p.name.de}» wirklich löschen?`)) return;
  state.pois.splice(editIndex, 1);
  closeEditor();
  renderPoiList();
  refreshDirty();
}

// --- GitHub publishing ---
const tokenKey = 'aare-admin-token';
const getToken = () => { try { return localStorage.getItem(tokenKey) || ''; } catch (e) { return ''; } };

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
  const el = $('token-status');
  if (!getToken()) { el.textContent = 'Kein Token gespeichert.'; el.className = 'status'; return; }
  try {
    const res = await gh('');
    if (res.ok) { el.textContent = `✓ Verbunden mit ${REPO_OWNER}/${REPO_NAME}`; el.className = 'status ok'; }
    else { el.textContent = `✗ Token ungültig oder ohne Zugriff (HTTP ${res.status})`; el.className = 'status err'; }
  } catch (e) { el.textContent = '✗ Verbindung fehlgeschlagen'; el.className = 'status err'; }
}

function validateAll() {
  const a = state.site.alert;
  if (a.enabled && !a.text.de) return 'Site-Alert ist aktiv, aber der deutsche Text fehlt.';
  for (const p of state.pois) {
    for (const l of ['de', 'fr', 'en']) {
      if (!p.name[l] || !p.desc[l]) return `POI "${p.id}": Text ${l.toUpperCase()} fehlt.`;
    }
  }
  return null;
}

async function publish() {
  const problem = validateAll();
  if (problem) return toast('⚠️ ' + problem);
  if (!getToken()) return toast('Bitte zuerst einen GitHub-Token speichern.');
  const btn = $('publish');
  btn.disabled = true; btn.textContent = 'Veröffentliche…';
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await putFile('data/site.js', siteFile(), `Admin: site config (${stamp})`);
    await putFile('data/pois.js', poisFile(), `Admin: POIs (${stamp})`);
    original.site = siteFile();
    original.pois = poisFile();
    toast('✓ Veröffentlicht – in ca. 1 Minute live.', 6000);
  } catch (e) {
    toast('✗ Fehler: ' + e.message, 8000);
  }
  btn.textContent = 'Veröffentlichen';
  refreshDirty();
}

function download() {
  [['site.js', siteFile()], ['pois.js', poisFile()]].forEach(([name, content]) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  toast('Dateien heruntergeladen – nach data/ kopieren und pushen.');
}

// --- Init ---
original.site = siteFile();
original.pois = poisFile();
loadAlertForm();
bindAlertForm();
renderPoiList();
refreshDirty();
checkToken();
$('token').value = getToken();

$('token-save').addEventListener('click', () => {
  try { localStorage.setItem(tokenKey, $('token').value.trim()); } catch (e) { /* private mode */ }
  checkToken();
});
$('poi-add').addEventListener('click', () => openEditor(-1));
$('e-save').addEventListener('click', saveEditor);
$('e-cancel').addEventListener('click', closeEditor);
$('e-delete').addEventListener('click', deleteEditor);
$('editor-wrap').addEventListener('click', e => { if (e.target === $('editor-wrap')) closeEditor(); });
$('publish').addEventListener('click', publish);
$('download').addEventListener('click', download);
window.addEventListener('beforeunload', e => { if (isDirty()) e.preventDefault(); });
