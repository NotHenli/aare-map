# Aare Map – Böötle Thun → Bern

Interaktive Sicherheitskarte für die Aare-Bootsfahrt von Thun nach Bern.
Zeigt Einstiege, Gefahrenstellen, Ausstiege, Bootsvermietungen und den
Live-Standort – mit Wassertemperatur, Abfluss (Thun & Bern) und geschätzter
Fahrzeit von aare.guru. Unterwegs zeigt die App die Restdistanz bis zum
Ausstieg Marzili und warnt vor Gefahrenstellen. Als PWA auf dem Homescreen
installierbar.

**Lokal starten:**

```bash
npm run dev
# → http://localhost:3000
```

Die Seite ist rein statisch (HTML/CSS/JS, keine API-Keys). `npm run build`
prüft zuerst Syntax und Übersetzungen (`npm run check`) und erzeugt dann
`dist/` mit verkleinerten Bildern (sharp). Vor dem Pushen einmal
`npm run build` laufen lassen.

**Deployment mit Vercel:** Repo auf GitHub pushen, auf
[vercel.com](https://vercel.com) importieren – Build-Command `npm run build`,
Output-Verzeichnis `dist`, deployt bei jedem Push automatisch. Alternativ
funktioniert jeder statische Host (GitHub Pages, Netlify, Cloudflare Pages, …).

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
