/* Aare float map Thun → Bern */

// --- Base map: official swisstopo tiles (free, no API key) ---
const swisstopoColor = L.tileLayer(
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
  { maxZoom: 18, attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a> · Fluss: © <a href="https://www.openstreetmap.org/copyright">OSM</a> · Live: <a href="https://aare.guru">aare.guru</a>' }
);
const swissimage = L.tileLayer(
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
  { maxZoom: 19, attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>' }
);

const map = L.map('map', { layers: [swisstopoColor], zoomControl: false });
L.control.zoom({ position: 'topright' }).addTo(map);
L.control.layers({ 'Karte': swisstopoColor, 'Luftbild': swissimage }, null, { position: 'topright' }).addTo(map);

// --- River line (white casing + blue line for visibility on any base map) ---
const casing = L.geoJSON(RIVER_GEOJSON, { style: { color: '#ffffff', weight: 9, opacity: 0.8 } }).addTo(map);
const riverLine = L.geoJSON(RIVER_GEOJSON, { style: { color: '#2f8fbf', weight: 5, opacity: 0.95 } }).addTo(map);
map.fitBounds(riverLine.getBounds().pad(0.02));

// --- POI markers ---
const ICONS = { entry: '🛶', danger: '⚠️', exit: '🏁', weir: '⛔' };

const markers = {};
POIS.forEach(p => {
  const size = (p.type === 'danger' || p.type === 'weir') ? 34 : 30;
  const icon = L.divIcon({
    className: '',
    html: `<div class="poi-icon ${p.type}" style="width:${size}px;height:${size}px">${ICONS[p.type]}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
  const m = L.marker([p.lat, p.lon], { icon, title: p.name }).addTo(map);
  m.bindPopup(
    `<div class="popup-title ${p.type}">${ICONS[p.type]} ${p.name}</div>` +
    `<div>${p.de}</div>` +
    `<div class="popup-en">${p.en}</div>`,
    { maxWidth: 260 }
  );
  markers[p.id] = m;
});

// --- POI list panel ---
const panel = document.getElementById('poi-panel');
const list = document.getElementById('poi-list');
POIS.forEach(p => {
  const li = document.createElement('li');
  li.innerHTML = `<i class="dot ${p.type}"></i> ${p.name}`;
  li.addEventListener('click', () => {
    panel.classList.add('hidden');
    map.flyTo([p.lat, p.lon], 16, { duration: 0.8 });
    markers[p.id].openPopup();
  });
  list.appendChild(li);
});
document.getElementById('list-btn').addEventListener('click', () => panel.classList.toggle('hidden'));

// --- Geolocation: live position dot ---
let userMarker = null, accCircle = null, watching = false, firstFix = true;
const locateBtn = document.getElementById('locate-btn');

locateBtn.addEventListener('click', () => {
  if (watching) {
    map.stopLocate();
    watching = false; firstFix = true;
    locateBtn.classList.remove('active');
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (accCircle) { map.removeLayer(accCircle); accCircle = null; }
    return;
  }
  watching = true;
  locateBtn.classList.add('active');
  map.locate({ watch: true, enableHighAccuracy: true });
});

map.on('locationfound', e => {
  if (!userMarker) {
    userMarker = L.marker(e.latlng, {
      icon: L.divIcon({ className: '', html: '<div class="user-dot" style="width:18px;height:18px"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      zIndexOffset: 1000
    }).addTo(map);
    accCircle = L.circle(e.latlng, { radius: e.accuracy, weight: 1, color: '#1668c7', fillOpacity: 0.08 }).addTo(map);
  } else {
    userMarker.setLatLng(e.latlng);
    accCircle.setLatLng(e.latlng).setRadius(e.accuracy);
  }
  if (firstFix) { map.setView(e.latlng, Math.max(map.getZoom(), 15)); firstFix = false; }
});

map.on('locationerror', () => {
  watching = false; firstFix = true;
  locateBtn.classList.remove('active');
  alert('Standort nicht verfügbar. Bitte GPS/Standortfreigabe aktivieren.');
});

// --- Live water temperature & flow from aare.guru (free API, attribution required) ---
fetch('https://aareguru.existenz.ch/v2018/current?city=bern&app=aare-float-map&version=0.1')
  .then(r => r.json())
  .then(d => {
    const a = d.aare || {};
    if (a.temperature != null) document.getElementById('aare-temp').textContent = `🌡 ${a.temperature} °C`;
    if (a.flow != null) {
      const el = document.getElementById('aare-flow');
      el.textContent = `🌊 ${a.flow} m³/s`;
      // City of Bern advises caution for boaters above ~220 m³/s
      if (a.flow >= 220) { el.style.background = '#fde3e3'; el.style.color = '#a01212'; el.textContent += ' ⚠️'; }
    }
  })
  .catch(() => { /* live data is optional; map works without it */ });
