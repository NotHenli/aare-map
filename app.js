/* Aare float map Thun → Bern */

// --- Base map: swisstopo aerial imagery (free, no API key) ---
const map = L.map('map', { zoomControl: false, attributionControl: false, maxBoundsViscosity: 1.0 });

L.tileLayer(
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
  {
    maxZoom: 19,
    attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a> · Fluss: © <a href="https://www.openstreetmap.org/copyright">OSM</a> · Live: <a href="https://aare.guru">aare.guru</a>'
  }
).addTo(map);

L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map); // hidden on touch layouts via CSS

// --- River line, trimmed to the trip: Einstieg Schwäbis → Ausstieg Marzili ---
const TRIP_START = POIS.find(p => p.id === 'schwaebis');
const TRIP_END = POIS.find(p => p.id === 'marzili');

function nearestIdx(coords, lat, lon) {
  let best = 0, bestD = Infinity;
  coords.forEach((c, i) => {
    const d = (c[1] - lat) ** 2 + (c[0] - lon) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// Longest feature is the main channel; side channels are dropped entirely.
const riverFeats = RIVER_GEOJSON.features.slice()
  .sort((a, b) => b.geometry.coordinates.length - a.geometry.coordinates.length);
const mainCoords = riverFeats[0].geometry.coordinates;
const iStart = nearestIdx(mainCoords, TRIP_START.lat, TRIP_START.lon);
const iEnd = nearestIdx(mainCoords, TRIP_END.lat, TRIP_END.lon);
const ROUTE = mainCoords.slice(Math.min(iStart, iEnd), Math.max(iStart, iEnd) + 1);
const RIVER_TRIMMED = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ROUTE } }]
};

L.geoJSON(RIVER_TRIMMED, { style: { color: '#ffffff', weight: 8, opacity: 0.85 } }).addTo(map);
const riverLine = L.geoJSON(RIVER_TRIMMED, { style: { color: '#3ec1ff', weight: 4.5, opacity: 0.95 } }).addTo(map);

// --- Restrict view to the relevant area: no panning away, no zooming out past the route ---
const routeBounds = riverLine.getBounds();
map.fitBounds(routeBounds.pad(0.02));
map.setMaxBounds(routeBounds.pad(0.4));
map.setMinZoom(map.getBoundsZoom(routeBounds.pad(0.05)));

// --- POI markers ---
const ICONS = { entry: '🛶', danger: '⚠️', exit: '🏁', weir: '⛔', rental: '🚤' };

function popupHtml(p) {
  return (
    `<div class="popup-title ${p.type}">${ICONS[p.type]} ${p.name}</div>` +
    `<img class="popup-img" src="img/${p.id}.jpg" alt="" onerror="this.remove()">` +
    `<div>${p.de}</div>` +
    `<div class="popup-en">${p.en}</div>` +
    (p.url ? `<a class="popup-link" href="${p.url}" target="_blank" rel="noopener">Website öffnen ↗</a>` : '')
  );
}

const markers = {};
POIS.forEach(p => {
  const size = (p.type === 'danger' || p.type === 'weir') ? 36 : 32;
  const icon = L.divIcon({
    className: '',
    html: `<div class="poi-icon ${p.type}" style="width:${size}px;height:${size}px">${ICONS[p.type]}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
  const m = L.marker([p.lat, p.lon], { icon, title: p.name });
  m.bindPopup(popupHtml(p), { maxWidth: 280 });
  markers[p.id] = m;
});

// Markers with a minZoom only appear when zoomed in, so nearby icons never overlap.
function updateMarkerVisibility() {
  const z = map.getZoom();
  POIS.forEach(p => {
    const m = markers[p.id];
    const show = !p.minZoom || z >= p.minZoom;
    if (show && !map.hasLayer(m)) m.addTo(map);
    else if (!show && map.hasLayer(m)) m.remove();
  });
}
map.on('zoomend', updateMarkerVisibility);
updateMarkerVisibility();

// --- Bottom sheet with POI list ---
const panel = document.getElementById('poi-panel');
const backdrop = document.getElementById('sheet-backdrop');
const list = document.getElementById('poi-list');

function openSheet() { panel.classList.remove('hidden'); backdrop.classList.remove('hidden'); }
function closeSheet() { panel.classList.add('hidden'); backdrop.classList.add('hidden'); }

POIS.forEach(p => {
  const li = document.createElement('li');
  li.innerHTML =
    `<span class="li-icon ${p.type}">${ICONS[p.type]}</span>` +
    `<span class="li-name">${p.name}</span>` +
    `<svg class="li-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;
  li.addEventListener('click', () => {
    closeSheet();
    markers[p.id].addTo(map); // ensure visible even before the flyTo zoom kicks in
    map.flyTo([p.lat, p.lon], 16, { duration: 0.8 });
    markers[p.id].openPopup();
  });
  list.appendChild(li);
});

document.getElementById('list-btn').addEventListener('click', () =>
  panel.classList.contains('hidden') ? openSheet() : closeSheet()
);
backdrop.addEventListener('click', closeSheet);
document.getElementById('sheet-handle').addEventListener('click', closeSheet);

// --- Toast ---
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4000);
}

// --- Along-river distance model (for progress + proximity warnings) ---
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Cumulative metres along the route for every vertex
const cumDist = [0];
for (let i = 1; i < ROUTE.length; i++) {
  cumDist[i] = cumDist[i - 1] + haversine(ROUTE[i - 1][1], ROUTE[i - 1][0], ROUTE[i][1], ROUTE[i][0]);
}
const kmAlongRoute = (lat, lon) => cumDist[nearestIdx(ROUTE, lat, lon)] / 1000;
const distToRoute = (lat, lon) => {
  const c = ROUTE[nearestIdx(ROUTE, lat, lon)];
  return haversine(lat, lon, c[1], c[0]);
};

const MARZILI = POIS.find(p => p.id === 'marzili');
const KM_MARZILI = kmAlongRoute(MARZILI.lat, MARZILI.lon);
const HAZARDS = POIS.filter(p => p.type === 'danger' || p.type === 'weir')
  .map(p => ({ ...p, km: kmAlongRoute(p.lat, p.lon) }));

let floatHours = 3; // refined from live flow data below
const progressPill = document.getElementById('progress-pill');
const alerted = {};

function updateProgress(lat, lon) {
  // Only meaningful while actually on/near the river
  if (distToRoute(lat, lon) > 500) { progressPill.classList.remove('show', 'danger'); return; }
  const kmUser = kmAlongRoute(lat, lon);
  const remaining = KM_MARZILI - kmUser;

  if (remaining > 0.15) {
    const speed = KM_MARZILI / floatHours; // km/h at current flow
    const mins = Math.round((remaining / speed) * 60);
    const eta = mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `${mins} min`;
    progressPill.textContent = `🏁 Marzili: ${remaining.toFixed(1)} km · ca. ${eta}`;
    progressPill.classList.remove('danger');
  } else {
    progressPill.textContent = '⛔ Marzili passiert – SOFORT aussteigen, Wehr voraus!';
    progressPill.classList.add('danger');
  }
  progressPill.classList.add('show');

  // One-time warning when approaching a hazard from upstream
  HAZARDS.forEach(h => {
    const ahead = h.km - kmUser;
    if (!alerted[h.id] && ahead > 0 && ahead < 0.7) {
      alerted[h.id] = true;
      toast(`⚠️ ${h.name} in ${Math.round(ahead * 10) * 100} m`);
    }
  });
}

// --- Geolocation: live position dot (browser asks for permission on first tap) ---
let userMarker = null, accCircle = null, watching = false, firstFix = true;
const locateBtn = document.getElementById('locate-btn');

locateBtn.addEventListener('click', () => {
  if (watching) {
    map.stopLocate();
    watching = false; firstFix = true;
    locateBtn.classList.remove('active');
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (accCircle) { map.removeLayer(accCircle); accCircle = null; }
    progressPill.classList.remove('show', 'danger');
    Object.keys(alerted).forEach(k => delete alerted[k]);
    return;
  }
  watching = true;
  locateBtn.classList.add('active');
  map.locate({ watch: true, enableHighAccuracy: true });
});

map.on('locationfound', e => {
  if (!userMarker) {
    userMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: '',
        html: '<div class="user-dot-wrap"><div class="user-pulse"></div><div class="user-dot"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }),
      zIndexOffset: 1000
    }).addTo(map);
    accCircle = L.circle(e.latlng, { radius: e.accuracy, weight: 1, color: '#2e7cf6', fillColor: '#2e7cf6', fillOpacity: 0.08 }).addTo(map);
  } else {
    userMarker.setLatLng(e.latlng);
    accCircle.setLatLng(e.latlng).setRadius(e.accuracy);
  }
  if (firstFix) { map.setView(e.latlng, Math.max(map.getZoom(), 15)); firstFix = false; }
  updateProgress(e.latlng.lat, e.latlng.lng);
});

map.on('locationerror', () => {
  watching = false; firstFix = true;
  locateBtn.classList.remove('active');
  toast('Standort nicht verfügbar – bitte Standortfreigabe im Browser erlauben.');
});

// --- Live data from aare.guru: temperature, flow Thun & Bern, float time estimate ---
// Rule of thumb for Thun→Bern (based on flow at Thun):
//   < 100 m³/s ≈ 4 h · 100–120 ≈ 3½ h · 120–160 ≈ 3 h · ≥ 160 ≈ 2½–3 h
function floatTime(flow) {
  if (flow == null) return null;
  if (flow >= 160) { floatHours = 2.75; return '2½–3 h'; }
  if (flow >= 120) { floatHours = 3; return '≈ 3 h'; }
  if (flow >= 100) { floatHours = 3.5; return '≈ 3½ h'; }
  floatHours = 4; return '≈ 4 h';
}

function setStat(id, text, warn) {
  const el = document.getElementById(id);
  el.textContent = text;
  if (warn) el.parentElement.classList.add('warn');
}

const aareGuru = city =>
  fetch(`https://aareguru.existenz.ch/v2018/current?city=${city}&app=aare-float-map&version=0.3`)
    .then(r => r.json());

Promise.allSettled([aareGuru('thun'), aareGuru('bern')]).then(([thun, bern]) => {
  const t = thun.status === 'fulfilled' ? (thun.value.aare || {}) : {};
  const b = bern.status === 'fulfilled' ? (bern.value.aare || {}) : {};

  if (b.temperature != null) setStat('stat-temp', `${b.temperature} °C`);
  if (t.flow != null) setStat('stat-flow-thun', `${t.flow} m³/s`);
  // City of Bern advises caution for boaters above ~220 m³/s
  if (b.flow != null) setStat('stat-flow-bern', `${b.flow} m³/s`, b.flow >= 220);

  const time = floatTime(t.flow != null ? t.flow : b.flow);
  if (time) setStat('stat-time', time);
  if (b.flow != null && b.flow >= 220) {
    toast('⚠️ Hoher Abfluss (' + b.flow + ' m³/s in Bern) – Bootsfahrt nur für Geübte!');
  }
}).catch(() => { /* live data is optional; map works without it */ });
