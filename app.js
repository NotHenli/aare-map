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

const t = key => (MESSAGES[LANG] && MESSAGES[LANG][key]) || (MESSAGES.en && MESSAGES.en[key]) || (MESSAGES.de && MESSAGES.de[key]) || '';
const tr = obj => (obj && (obj[LANG] || obj.en || obj.de)) || '';
const fmt = (s, vals) => s.replace(/\{(\w+)\}/g, (m, k) => vals[k]);

// --- Partner mode: /vermietung (or ?p=vermietung) shows the rental-company version ---
const PARTNER_ID = (() => {
  const path = location.pathname.replace(/\/$/, '');
  const fromPath = Object.keys(SITE.partners).find(id => path.endsWith('/' + id));
  if (fromPath) return fromPath;
  const q = new URLSearchParams(location.search).get('p');
  return SITE.partners[q] ? q : null;
})();
const PARTNER = PARTNER_ID ? SITE.partners[PARTNER_ID] : null;

// POIs can be limited to one audience via `audience: 'public' | 'partner'` (default: both).
const AUDIENCE = PARTNER ? 'partner' : 'public';
const SHOWN = POIS.filter(p => !p.audience || p.audience === 'all' || p.audience === AUDIENCE);

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

// --- River line, trimmed to the trip: Einstieg Schwäbis → Ausstieg Eichholz
//     (partner trips end earlier, at the partner's exit) ---
const TRIP_START = POIS.find(p => p.id === 'schwaebis');
const EICHHOLZ = POIS.find(p => p.id === 'eichholz');
const TRIP_END = PARTNER ? POIS.find(p => p.id === PARTNER.exitPoiId) : EICHHOLZ;

function nearestIdx(coords, lat, lon) {
  let best = 0, bestD = Infinity;
  coords.forEach((c, i) => {
    const d = (c[1] - lat) ** 2 + (c[0] - lon) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// Main river channel
const riverFeats = RIVER_GEOJSON.features.slice()
  .filter(f => f.properties.name !== 'DangerZone')
  .sort((a, b) => b.geometry.coordinates.length - a.geometry.coordinates.length);
let mainCoords = riverFeats[0].geometry.coordinates;

// The "DangerZone" feature's 4 coordinates form the straight main channel through the
// diversion section – the Aare GeoJSON incorrectly routes through the curving side meander.
// Splice the DangerZone shortcut in to replace that meander section.
const dangerZoneFeature = RIVER_GEOJSON.features.find(f => f.properties.name === 'DangerZone');
if (dangerZoneFeature) {
  const dzCoords = dangerZoneFeature.geometry.coordinates;
  const dzStartIdx = nearestIdx(mainCoords, dzCoords[0][1], dzCoords[0][0]);
  const dzEndIdx   = nearestIdx(mainCoords, dzCoords[dzCoords.length - 1][1], dzCoords[dzCoords.length - 1][0]);
  mainCoords = [
    ...mainCoords.slice(0, dzStartIdx),
    ...dzCoords,
    ...mainCoords.slice(dzEndIdx + 1)
  ];
}

const iStart = nearestIdx(mainCoords, TRIP_START.lat, TRIP_START.lon);
const SCHWELLE = POIS.find(p => p.id === 'schwelle');
const iEnd = nearestIdx(mainCoords, SCHWELLE.lat, SCHWELLE.lon);
// ROUTE always runs to Schwelle: distances and hazard warnings must keep working
// even when a customer misses their exit. Only the DISPLAYED line stops
// at the exit.
const ROUTE = mainCoords.slice(Math.min(iStart, iEnd), Math.max(iStart, iEnd) + 1);
const DISPLAY_COORDS = ROUTE.slice(0, nearestIdx(ROUTE, TRIP_END.lat, TRIP_END.lon) + 1);
const RIVER_TRIMMED = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: DISPLAY_COORDS } }]
};

// Main route: white outline underneath, then blue on top
L.geoJSON(RIVER_TRIMMED, { style: { color: '#ffffff', weight: 8, opacity: 0.85 } }).addTo(map);
const riverLine = L.geoJSON(RIVER_TRIMMED, { style: { color: '#00B6AC', weight: 4.5, opacity: 0.95 } }).addTo(map);
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
  photo: svgIcon('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.2" r="3.2"/>'),
  // fork and knife (restaurant)
  restaurant: svgIcon(
    '<line x1="8.5" y1="3" x2="8.5" y2="21"/>' +
    '<path d="M6 3v6a2.5 2.5 0 0 0 5 0V3"/>' +
    '<line x1="15.5" y1="3" x2="15.5" y2="21"/>' +
    '<path d="M13 3c0 0 2.5 2 2.5 5s-2.5 5-2.5 5v8"/>'
  )
};
const iconFor = p => ICONS[p.icon || p.type];

function popupHtml(p, kmUser) {
  // kmUser is optional; passed in when the popup is refreshed during live tracking.
  let etaHtml = '';
  if (kmUser != null) {
    const kmPoi = POI_KM[p.id];
    if (kmPoi != null) {
      const kmAhead = kmPoi - kmUser;
      if (kmAhead > 0.04) {
        const speed = KM_EICHHOLZ / floatHours;
        const mins = Math.round((kmAhead / speed) * 60);
        if (mins > 0) {
          const etaStr = mins >= 60
            ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`
            : `${mins} min`;
          etaHtml = `<div class="popup-eta">⏱ ${etaStr}</div>`;
        }
      }
    }
  }
  return (
    `<div class="popup-title ${p.type}"><span class="popup-ic ${p.type}">${iconFor(p)}</span>${tr(p.name)}</div>` +
    etaHtml +
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
SHOWN.forEach(p => {
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

// Both rental markers (start + return) show the Aarebootsvermietung logo once
// img/vermietung-logo.png exists (preloaded here – keeps the SVG fallback without inline error handlers).
(() => {
  const logo = new Image();
  const logoIcon = () => L.divIcon({
    className: '',
    html: `<div class="poi-icon rental"><img class="poi-icon-img" src="img/vermietung-logo.png" alt=""></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  logo.onload = () => {
    if (markers['vermietung-schwaebis']) markers['vermietung-schwaebis'].setIcon(logoIcon());
    if (markers['vermietung-eichholz'])  markers['vermietung-eichholz'].setIcon(logoIcon());
  };
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

// --- Closed river section past Eichholz down to Schwellenmätteli weir ---
const DANGER_POLYGON = [
  // North side
  [46.94467, 7.44552], [46.94480, 7.44565], [46.94491, 7.44575], [46.94505, 7.44585],
  [46.94527, 7.44597], [46.94535, 7.44603], [46.94551, 7.44621], [46.94555, 7.44636],
  [46.94561, 7.44653], [46.94570, 7.44658], [46.94574, 7.44686], [46.94579, 7.44712],
  [46.94586, 7.44740], [46.94589, 7.44765], [46.94593, 7.44795], [46.94594, 7.44832],
  [46.94595, 7.44841], [46.94596, 7.44873], [46.94596, 7.44901], [46.94596, 7.44912],
  [46.94596, 7.44931], [46.94596, 7.44955], [46.94597, 7.44984], [46.94597, 7.45007],
  [46.94597, 7.45037], [46.94597, 7.45062], [46.94596, 7.45099], [46.94598, 7.45136],
  [46.94599, 7.45182], [46.94599, 7.45211], [46.94597, 7.45231], [46.94601, 7.45269],
  [46.94605, 7.45313], [46.94608, 7.45344], [46.94613, 7.45375], [46.94618, 7.45412],
  [46.94624, 7.45446], [46.94630, 7.45477], [46.94634, 7.45508], [46.94642, 7.45544],
  [46.94646, 7.45563], [46.94650, 7.45569],
  // South side
  [46.94564, 7.45603], [46.94547, 7.45550], [46.94541, 7.45536], [46.94531, 7.45513],
  [46.94520, 7.45487], [46.94508, 7.45472], [46.94486, 7.45426], [46.94475, 7.45404],
  [46.94468, 7.45374], [46.94466, 7.45354], [46.94472, 7.45315], [46.94467, 7.45300],
  [46.94467, 7.45261], [46.94470, 7.45227], [46.94473, 7.45199], [46.94480, 7.45166],
  [46.94488, 7.45125], [46.94495, 7.45086], [46.94501, 7.45049], [46.94515, 7.45022],
  [46.94530, 7.45002], [46.94552, 7.44984], [46.94558, 7.44969], [46.94561, 7.44956],
  [46.94561, 7.44926], [46.94561, 7.44905], [46.94562, 7.44886], [46.94563, 7.44864],
  [46.94563, 7.44847], [46.94558, 7.44816], [46.94555, 7.44804], [46.94548, 7.44786],
  [46.94544, 7.44771], [46.94536, 7.44757], [46.94527, 7.44734], [46.94522, 7.44716],
  [46.94509, 7.44686], [46.94502, 7.44673], [46.94493, 7.44655], [46.94481, 7.44644],
  [46.94471, 7.44636], [46.94460, 7.44630], [46.94451, 7.44625], [46.94443, 7.44619]
];

const dangerCorridor = L.polygon(DANGER_POLYGON, {
  color: '#dc2626',
  weight: 2,
  dashArray: '6 5',
  opacity: 0.9,
  fillColor: '#ef4444',
  fillOpacity: 0.35,
  smoothFactor: 1,
  interactive: true
}).addTo(map);

const weirPopupContent = () =>
  `<div class="popup-title weir"><span class="popup-ic weir">${ICONS.weir}</span>${tr(SCHWELLE.name)}</div>` +
  `<img class="popup-img" src="img/schwelle.jpg" alt="">` +
  `<div>${tr(SCHWELLE.desc)}</div>`;

dangerCorridor.bindPopup(weirPopupContent, { maxWidth: 280, autoPan: false });

// --- START / ENDE labels at the trip endpoints (pill style, see .route-label) ---
function routeLabel(p) {
  return L.marker([p.lat, p.lon], {
    icon: L.divIcon({ className: '', html: '', iconSize: [0, 0] }),
    interactive: false, keyboard: false, zIndexOffset: 700
  }).addTo(map);
}
const startLabel = routeLabel(TRIP_START);
const endLabel = routeLabel(TRIP_END);

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
  SHOWN.forEach(p => {
    const m = markers[p.id];
    // partner pages always show the partner's own rental marker
    const zoomOk = !p.minZoom || z >= p.minZoom || (PARTNER && p.type === 'rental');
    const show = !p.hidden && zoomOk;
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
const listEtaEls = {};
SHOWN.forEach(p => {
  const li = document.createElement('li');
  li.innerHTML =
    `<span class="li-icon ${p.type}">${iconFor(p)}</span>` +
    `<span class="li-name">${tr(p.name)}</span>` +
    `<span class="li-eta"></span>` +
    `<svg class="li-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;
  listNameEls[p.id] = li.querySelector('.li-name');
  listEtaEls[p.id] = li.querySelector('.li-eta');
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

// ETA helpers ----------------------------------------------------------------
// Returns a human-readable "X min" / "Xh Ym" string for a POI ahead of the
// user, or null when the POI is behind or the user isn't on the river.
function etaForPoi(p, kmUser) {
  const kmPoi = POI_KM[p.id];
  if (kmPoi == null) return null;
  const kmAhead = kmPoi - kmUser;
  if (kmAhead <= 0.04) return null; // already passed or right here
  const speed = KM_EICHHOLZ / floatHours; // km/h – same as progress pill
  const mins = Math.round((kmAhead / speed) * 60);
  if (mins <= 0) return null;
  return mins >= 60
    ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`
    : `${mins} min`;
}

// Update every list-item ETA badge and refresh the currently open popup.
function refreshEta(kmUser) {
  SHOWN.forEach(p => {
    const el = listEtaEls[p.id];
    if (!el) return;
    const eta = etaForPoi(p, kmUser);
    el.textContent = eta ? eta : '';
  });

  // Also refresh the popup that is currently open, if any.
  const openPopup = map._popup;
  if (!openPopup) return;
  SHOWN.forEach(p => {
    if (markers[p.id] && markers[p.id].isPopupOpen()) {
      markers[p.id].setPopupContent(popupHtml(p, kmUser));
    }
  });
}

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

const KM_EICHHOLZ = kmAlongRoute(EICHHOLZ.lat, EICHHOLZ.lon);
const KM_DEST = kmAlongRoute(TRIP_END.lat, TRIP_END.lon);
const DEST_LABEL = PARTNER ? PARTNER.destLabel : 'Eichholz';
const HAZARDS = POIS.filter(p => p.type === 'danger' || p.type === 'weir')
  .map(p => ({ ...p, km: kmAlongRoute(p.lat, p.lon) }));

// Pre-compute each POI's km position along the route for ETA calculations.
const POI_KM = {};
SHOWN.forEach(p => { POI_KM[p.id] = kmAlongRoute(p.lat, p.lon); });


let floatHours = 3; // refined from live flow data below
const progressPill = document.getElementById('progress-pill');
const alerted = {};
let lastFix = null; // re-render the pill in the new language on switch

function updateProgress(lat, lon) {
  lastFix = [lat, lon];
  // Only meaningful while actually on/near the river
  if (distToRoute(lat, lon) > 500) { progressPill.classList.remove('show', 'danger', 'warn'); return; }
  const kmUser = kmAlongRoute(lat, lon);
  const remaining = KM_DEST - kmUser;

  progressPill.classList.remove('danger', 'warn');
  if (remaining > 0.15) {
    const speed = KM_EICHHOLZ / floatHours; // km/h at current flow (full-trip average)
    const mins = Math.round((remaining / speed) * 60);
    const eta = mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `${mins} min`;
    progressPill.textContent = fmt(t('progress'), { dest: DEST_LABEL, km: remaining.toFixed(1), eta });
  } else if (PARTNER && KM_EICHHOLZ - kmUser > 0.15) {
    // partner customer drifted past their exit – Eichholz is now the last chance
    progressPill.textContent = t('progressMissedExit');
    progressPill.classList.add('warn');
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

  // Update ETA badges on list items and the currently open popup.
  refreshEta(kmUser);
}

// --- Geolocation: your position is a little rubber boat (asks permission on first tap) ---
// Top view, pointing "up"; rotated toward the direction of travel while floating.
const BOAT_SVG =
  '<svg viewBox="0 0 44 58" aria-hidden="true">' +
  // outer tube
  '<path d="M22 3C31 3 38 12 38 25v18c0 8-7 12-16 12S6 51 6 43V25C6 12 13 3 22 3Z" fill="#fbbf24" stroke="#000000" stroke-width="2.5"/>' +
  // tube highlight
  '<path d="M22 7c6.8 0 12 7.4 12 18v17.5c0 5.8-5.2 8.5-12 8.5s-12-2.7-12-8.5V25C10 14.4 15.2 7 22 7Z" fill="#e5e7eb"/>' +
  // floor
  '<path d="M22 11c5 0 8.6 6 8.6 14.4v15.2c0 4.4-3.8 6.4-8.6 6.4s-8.6-2-8.6-6.4V25.4C13.4 17 17 11 22 11Z" fill="#d1d5db"/>' +
  // bench + paddles
  '<rect x="13.4" y="30" width="17.2" height="4.5" rx="2" fill="#4b5563"/>' +
  '<path d="M8 22 2.5 34M36 22l5.5 12" stroke="#8a5a2b" stroke-width="2.6" stroke-linecap="round"/>' +
  '<ellipse cx="2.8" cy="37" rx="2.6" ry="4.4" fill="#8a5a2b" transform="rotate(24 2.8 37)"/>' +
  '<ellipse cx="41.2" cy="37" rx="2.6" ry="4.4" fill="#8a5a2b" transform="rotate(-24 41.2 37)"/>' +
  '</svg>';

function bearing(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLon = (lon2 - lon1) * rad;
  const y = Math.sin(dLon) * Math.cos(lat2 * rad);
  const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

let userMarker = null, accCircle = null, watching = false, firstFix = true;
let boatEl = null, prevFix = null;
const locateBtn = document.getElementById('locate-btn');

// --- Smooth heading system ---
// rawCompass  : latest reading straight from the sensor (noisy)
// smoothCompass: low-pass filtered compass value (noise killed)
// targetHeading: what we want to rotate toward (unwrapped, in degrees)
// displayHeading: what's currently on screen (lerps toward target each rAF frame)
let rawCompass = null, smoothCompass = null;
let targetHeading = 0, displayHeading = 0;
let hasAbsoluteCompass = false; // true once deviceorientationabsolute fires
let rafId = null;

// Low-pass filter strength: 0 = keep old, 1 = take new immediately.
// 0.15 kills jitter while still reacting within ~0.5 s to a real turn.
const COMPASS_LP = 0.15;
// Lerp speed per rAF frame (~60 fps). 0.12 ≈ Google Maps feel.
const HEADING_LERP = 0.12;

// Unwrap `next` relative to `current` so we always rotate the short way.
function unwrapAngle(current, next) {
  let delta = ((next - current) % 360 + 540) % 360 - 180;
  return current + delta;
}

function headingRaf() {
  if (!boatEl) { rafId = null; return; }
  // Lerp display toward target — smooth, frame-rate-independent enough at 60 fps
  displayHeading += (targetHeading - displayHeading) * HEADING_LERP;
  boatEl.style.transform = `rotate(${displayHeading}deg)`;
  rafId = requestAnimationFrame(headingRaf);
}

function startRaf() {
  if (!rafId) rafId = requestAnimationFrame(headingRaf);
}
function stopRaf() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// Called by both deviceorientation and deviceorientationabsolute.
// Absolute (true-north) events win and suppress relative ones.
function handleOrientation(e) {
  const isAbsolute = e.type === 'deviceorientationabsolute' || e.absolute === true;
  if (!isAbsolute && hasAbsoluteCompass) return; // ignore relative once we have absolute
  if (isAbsolute) hasAbsoluteCompass = true;

  let raw;
  if (e.webkitCompassHeading != null) {
    // iOS — already in true-north degrees, 0 = north, clockwise
    raw = e.webkitCompassHeading;
  } else if (e.alpha != null) {
    // Android / Chrome — alpha is CCW from north when absolute
    raw = (360 - e.alpha) % 360;
  } else {
    return;
  }

  // Low-pass filter to smooth sensor noise
  if (smoothCompass === null) {
    smoothCompass = raw;
  } else {
    // Circular LP filter — average through the short arc
    const delta = ((raw - smoothCompass + 540) % 360) - 180;
    smoothCompass = (smoothCompass + delta * COMPASS_LP + 360) % 360;
  }
  rawCompass = raw;

  // Update the unwrapped target (never spin the long way)
  targetHeading = unwrapAngle(targetHeading, smoothCompass);
  startRaf();
}

locateBtn.addEventListener('click', () => {
  if (watching) {
    map.stopLocate();
    watching = false; firstFix = true;
    locateBtn.classList.remove('active');
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (accCircle) { map.removeLayer(accCircle); accCircle = null; }
    boatEl = null; prevFix = null;
    rawCompass = null; smoothCompass = null; hasAbsoluteCompass = false;
    targetHeading = 0; displayHeading = 0;
    stopRaf();
    progressPill.classList.remove('show', 'danger', 'warn');
    Object.keys(alerted).forEach(k => delete alerted[k]);
    window.removeEventListener('deviceorientation', handleOrientation);
    window.removeEventListener('deviceorientationabsolute', handleOrientation);
    return;
  }

  // Request compass permission on iOS 13+, then register both event types.
  // deviceorientationabsolute is preferred (true north); deviceorientation
  // is the fallback (may be relative to device boot orientation).
  const registerEvents = () => {
    window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  };
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(state => { if (state === 'granted') registerEvents(); })
      .catch(() => {});
  } else {
    registerEvents();
  }

  const hint = document.getElementById('locate-hint');
  if (hint && !hint.classList.contains('hidden')) {
    hint.classList.add('hidden');
    try { localStorage.setItem('aare-locate-hint', '1'); } catch(e) {}
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
        html: `<div class="user-boat-wrap"><div class="user-pulse"></div><div class="user-boat">${BOAT_SVG}</div></div>`,
        iconSize: [40, 52],
        iconAnchor: [20, 26]
      }),
      zIndexOffset: 1000
    }).addTo(map);
    boatEl = userMarker.getElement().querySelector('.user-boat');
    accCircle = L.circle(e.latlng, { radius: e.accuracy, weight: 1, color: '#2e7cf6', fillColor: '#2e7cf6', fillOpacity: 0.08 }).addTo(map);
    // Boat click: toggle between close zoom and overview.
    let boatZoomedIn = false;
    userMarker.on('click', () => {
      if (!boatZoomedIn) {
        focusOn(userMarker.getLatLng());
        boatZoomedIn = true;
      } else {
        map.flyToBounds(OVERVIEW_BOUNDS, { duration: 0.8 });
        boatZoomedIn = false;
      }
    });
    // Reset toggle state whenever the user manually pans/zooms away.
    map.once('movestart', () => { boatZoomedIn = false; });
    startRaf(); // begin animating as soon as the marker exists
  } else {
    userMarker.setLatLng(e.latlng);
    accCircle.setLatLng(e.latlng).setRadius(e.accuracy);
  }

  // GPS bearing: used only when no compass data is available.
  // Only update targetHeading from GPS when we've actually moved (avoids noisy
  // position jumps flipping the boat direction randomly while stationary).
  if (rawCompass === null && prevFix) {
    const moved = haversine(prevFix.lat, prevFix.lng, e.latlng.lat, e.latlng.lng);
    if (moved > 8) {
      const gpsBearing = bearing(prevFix.lat, prevFix.lng, e.latlng.lat, e.latlng.lng);
      targetHeading = unwrapAngle(targetHeading, gpsBearing);
      prevFix = e.latlng;
    }
  } else {
    prevFix = e.latlng;
  }

  if (firstFix) { map.setView(e.latlng, Math.max(map.getZoom(), 15)); firstFix = false; }
  updateProgress(e.latlng.lat, e.latlng.lng);
});


map.on('locationerror', e => {
  // transient dropouts while already tracking are normal (tunnels, bridges) – keep going
  if (userMarker) return;
  watching = false; firstFix = true;
  locateBtn.classList.remove('active');
  // Error code 1 = permission denied – show the in-page guide instead of a plain toast.
  if (e.code === 1) {
    showPermModal();
  } else {
    toast(t('locError'));
  }
});

// --- Location permission modal (Safari / iOS) ---
const locPermModal = document.getElementById('loc-perm-modal');
const locPermClose = document.getElementById('loc-perm-close');
function showPermModal() { locPermModal.classList.remove('hidden'); }
function hidePermModal() { locPermModal.classList.add('hidden'); }
locPermClose.addEventListener('click', hidePermModal);
locPermModal.addEventListener('click', e => { if (e.target === locPermModal) hidePermModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePermModal(); });


// --- Live data from aare.guru: temperature, flow Thun & Bern, float time estimate ---
// Rule of thumb for Thun→Bern (based on flow at Thun):
//   < 115 ≈ 4 h · 115–130 ≈ 3¾ h · 130–150 ≈ 3½ h · 150–175 ≈ 3¼ h · 175–200 ≈ 3 h · ≥ 200 < 3 h
function floatTime(flow) {
  if (flow == null) return null;
  if (flow >= 200) { floatHours = 2.75; return '< 3 h'; }
  if (flow >= 175) { floatHours = 3; return '≈ 3 h'; }
  if (flow >= 150) { floatHours = 3.25; return '≈ 3¼ h'; }
  if (flow >= 130) { floatHours = 3.5; return '≈ 3½ h'; }
  if (flow >= 115) { floatHours = 3.75; return '≈ 3¾ h'; }
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

// --- Site alert banner (content managed via admin.html → data/site.js) ---
const siteAlertEl = document.getElementById('site-alert');
const siteAlertText = document.getElementById('site-alert-text');
// dismissal is remembered per alert text for this session only
const alertKey = 'aare-alert-' + (SITE.alert.text.de || '').slice(0, 40);
const alertDismissed = (() => { try { return sessionStorage.getItem(alertKey); } catch (e) { return null; } })();

function renderSiteAlert() {
  if (!SITE.alert.enabled || !(SITE.alert.text.de || '').trim() || alertDismissed) return;
  siteAlertEl.classList.remove('hidden', 'info', 'warn', 'danger');
  siteAlertEl.classList.add(SITE.alert.level || 'info');
  siteAlertText.textContent = tr(SITE.alert.text);
}
document.getElementById('site-alert-close').addEventListener('click', () => {
  siteAlertEl.classList.add('hidden');
  try { sessionStorage.setItem(alertKey, '1'); } catch (e) { /* private mode */ }
});

// --- Partner header badge ---
if (PARTNER) {
  const badge = document.getElementById('partner-badge');
  badge.href = PARTNER.url;
  badge.querySelector('img').src = PARTNER.logo;
  badge.classList.remove('hidden');
}

// --- Language switcher: re-render every translated surface ---
const langMenu = document.getElementById('lang-menu');
const langToggleBtn = document.getElementById('lang-toggle-btn');
const langFlagEl = document.getElementById('lang-curr-flag');
const langLabelEl = document.getElementById('lang-curr-label');

function openLangMenu() {
  if (!langMenu) return;
  langMenu.classList.remove('hidden');
  if (langToggleBtn) langToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeLangMenu() {
  if (!langMenu) return;
  langMenu.classList.add('hidden');
  if (langToggleBtn) langToggleBtn.setAttribute('aria-expanded', 'false');
}

if (langMenu && typeof LANG_INFO !== 'undefined') {
  langMenu.innerHTML = LANGS.map(code => {
    const info = LANG_INFO[code] || { flag: '', name: code.toUpperCase(), code: code.toUpperCase() };
    return `<button type="button" class="lang-option" role="option" data-lang="${code}">
      <span class="lang-option-flag">${info.flag}</span>
      <span class="lang-option-name">${info.name}</span>
      <svg class="lang-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>`;
  }).join('');

  langMenu.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLang(btn.dataset.lang);
      closeLangMenu();
    });
  });
}

if (langToggleBtn) {
  langToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isClosed = !langMenu || langMenu.classList.contains('hidden');
    if (isClosed) openLangMenu();
    else closeLangMenu();
  });
}

document.addEventListener('click', e => {
  if (langMenu && !langMenu.classList.contains('hidden')) {
    if (!langMenu.contains(e.target) && !langToggleBtn.contains(e.target)) {
      closeLangMenu();
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && langMenu && !langMenu.classList.contains('hidden')) {
    closeLangMenu();
    if (langToggleBtn) langToggleBtn.focus();
  }
});

function applyLang(lang) {
  LANG = lang;
  try { localStorage.setItem('aare-lang', lang); } catch (e) { /* private mode */ }
  document.documentElement.lang = lang;

  // Update language toggle button and dropdown active items
  const info = (typeof LANG_INFO !== 'undefined' && LANG_INFO[lang]) || { flag: '', name: lang.toUpperCase(), code: lang.toUpperCase() };
  if (langFlagEl) langFlagEl.innerHTML = info.flag;
  if (langLabelEl) langLabelEl.textContent = info.code;

  if (langMenu) {
    langMenu.querySelectorAll('.lang-option').forEach(b => {
      const isActive = b.dataset.lang === lang;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  // Permission modal steps contain <strong> tags — use innerHTML for those.
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  const subEl = document.querySelector('[data-i18n="subtitle"]');
  if (PARTNER && subEl) subEl.textContent = t('subtitlePartner');
  renderSiteAlert();
  document.getElementById('stats').title = t('statsTitle');
  document.getElementById('disclaimer').innerHTML = t('disclaimer');
  locateBtn.setAttribute('aria-label', t('locateAria'));

  SHOWN.forEach(p => {
    const kmUser = (watching && lastFix) ? kmAlongRoute(lastFix[0], lastFix[1]) : null;
    markers[p.id].setPopupContent(popupHtml(p, kmUser));
    listNameEls[p.id].textContent = tr(p.name);
    markers[p.id].options.title = tr(p.name); // applied when the marker (re)enters the map
    const el = markers[p.id].getElement();
    if (el) el.title = tr(p.name);
  });
  zoneLayers.forEach(({ z, layer, marker }) => {
    layer.setPopupContent(zonePopup(z));
    marker.setPopupContent(zonePopup(z));
  });
  if (typeof dangerCorridor !== 'undefined' && dangerCorridor) dangerCorridor.setPopupContent(weirPopupContent());
  updateRouteLabels();
  if (watching && lastFix) updateProgress(lastFix[0], lastFix[1]);
}

applyLang(LANG);

// Show the locate button hint on first visit (previously gated by the intro splash)
try {
  if (!localStorage.getItem('aare-locate-hint')) {
    setTimeout(() => {
      const hint = document.getElementById('locate-hint');
      if (hint) hint.classList.remove('hidden');
    }, 1500);
  }
} catch(e) {}

// Register Service Worker for offline PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('PWA: Service Worker registration failed:', err);
    });
  });
}
