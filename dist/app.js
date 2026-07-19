/* Aare float map Thun → Bern
 *
 * Privacy: geolocation is used exclusively on-device to draw the position dot
 * and compute the remaining distance. Coordinates are never stored and never
 * sent anywhere – the only network requests are map tiles (swisstopo) and
 * anonymous river data (aare.guru). The sole persisted value is the chosen
 * UI language (localStorage 'aare-lang'). */

// --- i18n: saved choice > browser language > German ---
const storedLang = (() => { try { return localStorage.getItem('aare-lang'); } catch (e) { return null; } })();
const navLangs = (navigator.languages || [navigator.language || 'de']).map(l => String(l).slice(0, 2).toLowerCase());
let LANG = LANGS.includes(storedLang) ? storedLang : (navLangs.find(l => LANGS.includes(l)) || 'de');

const t = key => MESSAGES[LANG][key];        // UI string
const tr = obj => obj[LANG] || obj.de;       // {de,fr,en} content field
const fmt = (s, vals) => s.replace(/\{(\w+)\}/g, (m, k) => vals[k]);

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
map.fitBounds(routeBounds.pad(0.06)); // small margin so endpoint labels stay on screen
map.setMaxBounds(routeBounds.pad(0.5));
map.setMinZoom(map.getBoundsZoom(routeBounds.pad(0.2)));

// --- POI icons: one consistent stroke style (24×24, round caps, currentColor) ---
const svgIcon = paths =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  // arrow dropping into water
  entry: svgIcon(
    '<path d="M12 3.5v8"/><path d="M8.5 8 12 11.5 15.5 8"/>' +
    '<path d="M2.5 17.5c1.6 1.3 3.2 1.3 4.75 0s3.15-1.3 4.75 0 3.15 1.3 4.75 0 3.15-1.3 4.75 0"/>'
  ),
  // arrow climbing out of the water (mirror of the entry icon)
  exit: svgIcon(
    '<path d="M12 11.5v-8"/><path d="M8.5 7 12 3.5 15.5 7"/>' +
    '<path d="M2.5 17.5c1.6 1.3 3.2 1.3 4.75 0s3.15-1.3 4.75 0 3.15 1.3 4.75 0 3.15-1.3 4.75 0"/>'
  ),
  // warning triangle
  danger: svgIcon('<path d="M12 3.8 21.2 19.6H2.8z"/><path d="M12 9.8v4.3"/><path d="M12 17.2h.01"/>'),
  // breaking surf wave (Uttigenwelle): curling crest over the water line
  wave: svgIcon(
    '<path d="M3 15.5c0-6 4-10 9-10 3.9 0 6.5 2.3 6.5 5.2 0 2.2-1.7 3.8-3.8 3.8-1.8 0-3.2-1.3-3.2-3"/>' +
    '<path d="M2.5 19.5c1.6 1.3 3.2 1.3 4.75 0s3.15-1.3 4.75 0 3.15 1.3 4.75 0 3.15-1.3 4.75 0"/>'
  ),
  // covered wooden bridge (Auguetbrücke): pitched roof, walls, deck, water
  bridge: svgIcon(
    '<path d="M2.5 10.5 12 5.5l9.5 5"/>' +
    '<path d="M5 9.2v6.3"/><path d="M19 9.2v6.3"/>' +
    '<path d="M2.5 15.5h19"/>' +
    '<path d="M2.5 19.5c1.6 1.3 3.2 1.3 4.75 0s3.15-1.3 4.75 0 3.15 1.3 4.75 0 3.15-1.3 4.75 0"/>'
  ),
  // no-entry (weir)
  weir: svgIcon('<circle cx="12" cy="12" r="8.75"/><path d="M6.5 12h11" stroke-width="2.6"/>'),
  // inflatable boat, top view
  rental: svgIcon('<rect x="6" y="3" width="12" height="18" rx="6"/><rect x="9.2" y="7" width="5.6" height="10" rx="2.8"/>'),
  // camera (photo placeholder in popups)
  photo: svgIcon('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.2" r="3.2"/>')
};
const iconFor = p => ICONS[p.icon || p.type];

function popupHtml(p) {
  return (
    `<div class="popup-title ${p.type}"><span class="popup-ic ${p.type}">${iconFor(p)}</span>${tr(p.name)}</div>` +
    `<img class="popup-img" src="img/${p.id}.jpg" alt="">` +
    `<div>${tr(p.desc)}</div>` +
    (p.url ? `<a class="popup-link" href="${p.url}" target="_blank" rel="noopener">${t('website')}</a>` : '')
  );
}

// --- Lightbox: tap a popup photo to view it full-screen ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCap = document.getElementById('lightbox-cap');

function openLightbox(src, caption) {
  lightboxImg.src = src;
  lightboxImg.alt = caption;
  lightboxCap.textContent = caption;
  lightbox.classList.remove('hidden');
}
function closeLightbox() { lightbox.classList.add('hidden'); }
lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// Opening a popup zooms to its location; the popup sits above the anchor,
// so aim the camera slightly below centre to keep it fully on screen.
function focusOn(latlng) {
  const z = Math.max(map.getZoom(), 16);
  const target = map.unproject(map.project(latlng, z).subtract([0, 100]), z);
  map.flyTo(target, z, { duration: 0.8 });
}

// Popup photos are optional (img/<id>.jpg): while the file is missing a dashed
// placeholder shows the expected filename; loaded photos open the lightbox on
// tap. No inline handlers so the strict Content-Security-Policy holds.
map.on('popupopen', e => {
  focusOn(e.popup.getLatLng());
  const img = e.popup.getElement().querySelector('.popup-img');
  if (!img) return;
  const title = e.popup.getElement().querySelector('.popup-title');
  const usePlaceholder = () => {
    const ph = document.createElement('div');
    ph.className = 'popup-img-ph';
    ph.innerHTML = `${ICONS.photo}<span>${img.getAttribute('src').split('/').pop()}</span>`;
    img.replaceWith(ph);
  };
  const enableZoom = () => {
    img.classList.add('zoomable');
    img.addEventListener('click', () => openLightbox(img.src, title ? title.textContent : ''));
  };
  if (img.complete) (img.naturalWidth ? enableZoom : usePlaceholder)();
  else {
    img.addEventListener('load', enableZoom);
    img.addEventListener('error', usePlaceholder);
  }
});

const markers = {};
POIS.forEach(p => {
  const size = (p.type === 'danger' || p.type === 'weir') ? 36 : 32; // matches .poi-icon CSS
  const icon = L.divIcon({
    className: '',
    html: `<div class="poi-icon ${p.type}">${iconFor(p)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
  const m = L.marker([p.lat, p.lon], { icon, title: tr(p.name) });
  m.bindPopup(popupHtml(p), { maxWidth: 280, autoPan: false }); // focusOn() frames the popup instead
  markers[p.id] = m;
});

// The rental marker shows the Aarebootsvermietung logo once img/vermietung-logo.png
// exists (preloaded here – keeps the SVG fallback without inline error handlers).
(() => {
  const logo = new Image();
  logo.onload = () => markers['vermietung-schwaebis'].setIcon(L.divIcon({
    className: '',
    html: `<div class="poi-icon rental"><img class="poi-icon-img" src="img/vermietung-logo.png" alt=""></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  }));
  logo.src = 'img/vermietung-logo.png';
})();

// --- Exit zone along the Camping Eichholz bank (get out anywhere in this stretch) ---
const M_PER_DEG = 111320;
function bankBand(zone, innerM, outerM) {
  const i0 = nearestIdx(ROUTE, zone.from.lat, zone.from.lon);
  const i1 = nearestIdx(ROUTE, zone.to.lat, zone.to.lon);
  const seg = ROUTE.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  const sign = zone.side === 'left' ? 1 : -1;
  const offset = dist => seg.map((c, i) => {
    const a = seg[Math.max(0, i - 1)], b = seg[Math.min(seg.length - 1, i + 1)];
    const mPerLon = M_PER_DEG * Math.cos(c[1] * Math.PI / 180);
    const dx = (b[0] - a[0]) * mPerLon, dy = (b[1] - a[1]) * M_PER_DEG;
    const len = Math.hypot(dx, dy) || 1;
    return [c[1] + (dx / len) * sign * dist / M_PER_DEG, c[0] - (dy / len) * sign * dist / mPerLon];
  });
  return offset(innerM).concat(offset(outerM).reverse());
}

const zonePopup = z =>
  `<div class="popup-title exit"><span class="popup-ic exit">${ICONS.exit}</span>${tr(z.name)}</div>` +
  `<img class="popup-img" src="img/${z.photo || z.id}.jpg" alt="">` +
  `<div>${tr(z.desc)}</div>`;

const zoneLayers = EXIT_ZONES.map(z => {
  // thinner band (closer to river edge) and shorter outer offset
  const bandCoords = bankBand(z, 2, 48);
  const layer = L.polygon(bandCoords, {
    color: '#0d9488', weight: 1.5, dashArray: '6 5', opacity: 0.9,
    fillColor: '#0d9488', fillOpacity: 0.16
  }).addTo(map).bindPopup(zonePopup(z), { maxWidth: 280, autoPan: false });

  // place a small marker in the middle of the zone (midpoint of anchors)
  const midLat = (z.from.lat + z.to.lat) / 2;
  const midLon = (z.from.lon + z.to.lon) / 2;
  const zoneMarker = L.marker([midLat, midLon], {
    icon: L.divIcon({ className: '', html: `<div class="zone-icon exit">${ICONS.exit}</div>`, iconSize: [28, 28] }),
    zIndexOffset: 600
  }).addTo(map).bindPopup(zonePopup(z), { maxWidth: 280, autoPan: false });

  return { z, layer, marker: zoneMarker };
});

// --- START / ENDE labels at the trip endpoints (pill style, see .route-label) ---
function routeLabel(p, cls) {
  return L.marker([p.lat, p.lon], {
    icon: L.divIcon({ className: '', html: '', iconSize: [0, 0] }),
    interactive: false, keyboard: false, zIndexOffset: 700
  }).addTo(map);
}
const startLabel = routeLabel(TRIP_START, 'start');
const endLabel = routeLabel(TRIP_END, 'end');

function updateRouteLabels() {
  startLabel.setIcon(L.divIcon({
    className: '', iconSize: [0, 0],
    html: `<div class="route-label start">${t('labelStart')}</div>`
  }));
  endLabel.setIcon(L.divIcon({
    className: '', iconSize: [0, 0],
    html: `<div class="route-label end">${t('labelEnd')}</div>`
  }));
}

// Markers with a minZoom only appear when zoomed in, so nearby icons never overlap.
function updateMarkerVisibility() {
  const z = map.getZoom();
  POIS.forEach(p => {
    const m = markers[p.id];
    const show = !p.hidden && (!p.minZoom || z >= p.minZoom);
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

const listNameEls = {};
POIS.forEach(p => {
  const li = document.createElement('li');
  li.innerHTML =
    `<span class="li-icon ${p.type}">${iconFor(p)}</span>` +
    `<span class="li-name">${tr(p.name)}</span>` +
    `<svg class="li-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;
  listNameEls[p.id] = li.querySelector('.li-name');
  li.addEventListener('click', () => {
    closeSheet();
    // opening the popup zooms to the spot via the popupopen handler (focusOn)
    if (p.hidden) {
      // Eichholz POI is represented by an exit zone; open the zone marker instead
      const zl = zoneLayers.find(zl => zl.z.id === 'eichholz-zone');
      if (zl) zl.marker.openPopup();
      return;
    }
    markers[p.id].addTo(map); // ensure visible even before the zoom kicks in
    markers[p.id].openPopup();
  });
  list.appendChild(li);
});

document.getElementById('list-btn').addEventListener('click', () =>
  panel.classList.contains('hidden') ? openSheet() : closeSheet()
);

// --- Reset-view button: appears whenever the map is zoomed in past the overview ---
const resetBtn = document.getElementById('reset-btn');
const OVERVIEW_BOUNDS = routeBounds.pad(0.06);
const OVERVIEW_ZOOM = map.getBoundsZoom(OVERVIEW_BOUNDS);

map.on('zoomend', () =>
  resetBtn.classList.toggle('hidden', map.getZoom() <= OVERVIEW_ZOOM)
);
resetBtn.addEventListener('click', () => {
  map.closePopup();
  map.flyToBounds(OVERVIEW_BOUNDS, { duration: 0.8 });
});
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
let lastFix = null; // re-render the pill in the new language on switch

function updateProgress(lat, lon) {
  lastFix = [lat, lon];
  // Only meaningful while actually on/near the river
  if (distToRoute(lat, lon) > 500) { progressPill.classList.remove('show', 'danger'); return; }
  const kmUser = kmAlongRoute(lat, lon);
  const remaining = KM_MARZILI - kmUser;

  if (remaining > 0.15) {
    const speed = KM_MARZILI / floatHours; // km/h at current flow
    const mins = Math.round((remaining / speed) * 60);
    const eta = mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `${mins} min`;
    progressPill.textContent = fmt(t('progress'), { km: remaining.toFixed(1), eta });
    progressPill.classList.remove('danger');
  } else {
    progressPill.textContent = t('progressDanger');
    progressPill.classList.add('danger');
  }
  progressPill.classList.add('show');

  // One-time warning when approaching a hazard from upstream
  HAZARDS.forEach(h => {
    const ahead = h.km - kmUser;
    if (!alerted[h.id] && ahead > 0 && ahead < 0.7) {
      alerted[h.id] = true;
      toast(fmt(t('hazardAhead'), { name: tr(h.name), m: Math.round(ahead * 10) * 100 }));
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
  toast(t('locError'));
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
    toast(fmt(MESSAGES[LANG].highFlow, { flow: b.flow }));
  }
}).catch(() => { /* live data is optional; map works without it */ });

// --- Language switcher: re-render every translated surface ---
function applyLang(lang) {
  LANG = lang;
  try { localStorage.setItem('aare-lang', lang); } catch (e) { /* private mode */ }
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.getElementById('stats').title = t('statsTitle');
  document.getElementById('disclaimer').innerHTML = t('disclaimer');
  locateBtn.setAttribute('aria-label', t('locateAria'));

  POIS.forEach(p => {
    markers[p.id].setPopupContent(popupHtml(p));
    listNameEls[p.id].textContent = tr(p.name);
    markers[p.id].options.title = tr(p.name); // applied when the marker (re)enters the map
    const el = markers[p.id].getElement();
    if (el) el.title = tr(p.name);
  });
  zoneLayers.forEach(({ z, layer, marker }) => {
    layer.setPopupContent(zonePopup(z));
    marker.setPopupContent(zonePopup(z));
  });
  updateRouteLabels();
  if (watching && lastFix) updateProgress(lastFix[0], lastFix[1]);

  document.querySelectorAll('#lang-switch button').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
}

document.querySelectorAll('#lang-switch button').forEach(b =>
  b.addEventListener('click', () => applyLang(b.dataset.lang))
);
applyLang(LANG);
