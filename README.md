# Aare Böötle – Thun → Bern

Interaktive Sicherheitskarte für die Aare-Bootsfahrt von Thun nach Bern.
Zeigt Einstiege, Gefahrenstellen, Ausstiege, den Live-Standort und die
aktuelle Wassertemperatur / Abflussmenge.

**Demo lokal starten:**

```bash
cd aare-map
python3 -m http.server 8000
# → http://localhost:8000
```

Die Seite ist rein statisch (HTML/CSS/JS, kein Build-Schritt, keine API-Keys)
und kann auf jedem statischen Host deployt werden (GitHub Pages, Netlify,
Cloudflare Pages, …).

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Seite und Layout |
| `app.js` | Karte (Leaflet), Marker, GPS-Standort, Live-Daten |
| `style.css` | Styling, mobile-first |
| `data/pois.js` | Streckenpunkte (Einstiege, Gefahren, Ausstiege) |
| `data/river.js` / `data/river.geojson` | Flussgeometrie der Aare (aus OpenStreetMap) |
| `data/river_raw.json` | Overpass-Rohdaten (zur Regeneration) |

## Datenquellen & Lizenzen

- **Kartenkacheln:** [swisstopo](https://www.swisstopo.admin.ch) – frei nutzbar mit Quellenangabe
- **Flussgeometrie & POI-Koordinaten:** [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)
- **Wassertemperatur/Abfluss:** [aare.guru](https://aare.guru) API ([Existenz API](https://api.existenz.ch), Quellenangabe erforderlich)
- Sicherheitsinformationen orientieren sich an der offiziellen SLRG-Aarekarte.
  **Wichtig:** Das Kartenbild/PDF der SLRG ist urheberrechtlich geschützt und
  darf nicht kopiert werden – diese Seite verwendet ausschliesslich eigene
  Texte und offene Geodaten.

## Flussgeometrie aktualisieren

Die Aare-Geometrie stammt aus einer Overpass-Abfrage
(`way["waterway"="river"]["name"="Aare"]` in der Bounding-Box Thun–Bern),
wird zu Linien zusammengefügt und kurz nach dem Schwellenmätteli-Wehr
abgeschnitten. Siehe Git-History für das Verarbeitungsskript.
