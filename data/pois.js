// Points of interest along the float route Thun–Bern, in downstream order.
// Positions verified on the ground by the site owner (do not blindly reset to OSM).
//
// Fields:
//   name/desc – {de, fr, en} strings, selected via the language switcher
//   icon      – overrides the type icon (see ICONS in app.js)
//   minZoom   – marker only appears from this zoom level (prevents overlapping icons)
//   A photo/logo appears in the popup automatically if img/<id>.jpg exists.
const POIS = [
  {
    id: 'vermietung-schwaebis',
    type: 'rental',
    lat: 46.76217, lon: 7.61887,
    minZoom: 16,
    url: 'https://aarebootsvermietung.ch',
    name: {
      de: 'Aarebootsvermietung',
      fr: 'Aarebootsvermietung',
      en: 'Aarebootsvermietung'
    },
    desc: {
      de: 'Miete ein Boot bei der Aarebootsvermietung – Fahrt von Schwäbis bis nach Bern (Eichholz). Schwimmwesten, Paddel und wasserdichte Tonne inklusive. Aarebootsvermietung-Boote enden in Eichholz.',
      fr: 'Louez un bateau chez Aarebootsvermietung – descente de Schwäbis jusqu’à Berne (Eichholz). Gilets de sauvetage, pagaies et tonneau étanche inclus. Les bateaux Aarebootsvermietung se terminent à Eichholz.',
      en: 'Rent a boat at Aarebootsvermietung – float from Schwäbis down to Eichholz in Bern. Life jackets, paddles and a waterproof barrel are all included. Aarebootsvermietung rentals finish at Eichholz.'
    }
  },
  {
    id: 'schwaebis',
    type: 'entry',
    lat: 46.76199, lon: 7.61814,
    name: {
      de: 'Einstieg Schwäbis',
      fr: 'Embarquement Schwäbis',
      en: 'Entry Schwäbis'
    },
    desc: {
      de: 'Offizielle und beliebteste Einwasserungsstelle.',
      fr: 'Point de mise à l’eau officiel et le plus populaire.',
      en: 'Official and most popular boat entry point.'
    }
  },
  {
    id: 'uttigenwelle',
    type: 'danger',
    icon: 'wave',
    lat: 46.79730, lon: 7.58180,
    name: {
      de: 'Uttigenwelle (SBB-Brücke)',
      fr: 'Vague d’Uttigen (pont CFF)',
      en: 'Uttigen wave (railway bridge)'
    },
    desc: {
      de: 'Starke stehende Welle in der Flussmitte unter der Eisenbahnbrücke. RECHTS halten, ca. 5 m vom Ufer entfernt, und das Boot gerade halten. Bitte im Boot bleiben.',
      fr: 'Forte vague stationnaire au milieu de la rivière, sous le pont ferroviaire. Restez à DROITE, à env. 5 m de la rive, et gardez le bateau droit. Restez dans le bateau.',
      en: 'Strong standing wave in the middle of the river under the railway bridge. Keep to the RIGHT, about 5 m from the bank, and keep the boat straight. Please stay in the boat.'
    }
  },
  {
    id: 'rubigen-wyderwasser',
    type: 'restaurant',
    lat: 46.89011, lon: 7.53777,
    name: {
      de: 'Rubigen – Wyderwasser',
      fr: 'Rubigen – Wyderwasser',
      en: 'Rubigen – Wyderwasser'
    },
    desc: {
      de: 'Ausstieg RECHTS, ca. 100 m nach den Brückenpfeilern. Restaurant Campagna liegt auf der LINKEN Seite. Wyderwasser-Beizli direkt am Strand rechts. Grillplatz für Gruppen mit Reservation vorhanden.',
      fr: 'Sortie à DROITE, env. 100 m après les piliers du pont. Le Restaurant Campagna se trouve sur la rive GAUCHE. Le bar Wyderwasser est directement sur la plage à droite. Place de gril disponible pour les groupes sur réservation.',
      en: 'Exit on the RIGHT, about 100 m after the bridge pillars. Restaurant Campagna is on the LEFT bank. The Wyderwasser beach bar is on the right bank. BBQ spot available for booked groups.'
    }
  },
  {
    id: 'auguetbruecke',
    type: 'danger',
    icon: 'bridge',
    lat: 46.91901, lon: 7.50039,
    name: {
      de: 'Auguetbrücke (Holzbrücke)',
      fr: 'Auguetbrücke (pont en bois)',
      en: 'Auguetbrücke (wooden bridge)'
    },
    desc: {
      de: 'Holzbrücke mit drei Pfeilern im Fluss – links oder rechts zwischen den Pfeilern durchfahren. Boot gerade halten, nicht in Brückennähe schwimmen.',
      fr: 'Pont en bois avec trois piliers dans la rivière – passez entre les piliers, à gauche ou à droite. Gardez le bateau droit et ne nagez pas près du pont.',
      en: 'Wooden bridge with three pillars in the river – pass between the pillars on the left or right side. Keep the boat straight and do not swim near the bridge.'
    }
  },
  {
    id: 'eichholz',
    type: 'exit',
    lat: 46.93450, lon: 7.45820,
    hidden: true,
    name: {
      de: 'Ausstieg Eichholz',
      fr: 'Sortie Eichholz',
      en: 'Exit Eichholz'
    },
    desc: {
      de: 'Erster und einfachster Hauptausstieg in Bern: Ausstieg überall in der markierten Zone entlang des Campings Eichholz möglich. Für Aarebootsvermietung-Kunden ist dies der Ausstieg. Duschen, WC – Tram Nr. 9 fährt ins Stadtzentrum.',
      fr: 'Première sortie principale et la plus facile à Berne : sortie possible partout dans la zone marquée le long du camping Eichholz. Pour les clients Aarebootsvermietung, c’est la sortie. Douches, WC – le tram n° 9 vous amène au centre-ville.',
      en: 'First and easiest main exit in Bern: you can get out anywhere in the marked zone along Camping Eichholz. This is the exit for Aarebootsvermietung rentals. Showers, WC – tram no. 9 takes you to the city centre.'
    }
  },

  {
    id: 'schwelle',
    type: 'weir',
    lat: 46.94578, lon: 7.45191,
    minZoom: 13,
    name: {
      de: 'Wehr Schwellenmätteli – GESPERRT',
      fr: 'Barrage Schwellenmätteli – INTERDIT',
      en: 'Schwellenmätteli weir – CLOSED'
    },
    desc: {
      de: 'Lebensgefahr! Wehr mit starker Walze. Gesperrte Zone für Schwimmer und Boote. Niemals weiterfahren – spätestens im Eichholz aussteigen.',
      fr: 'Danger de mort ! Barrage avec fort rappel. Zone interdite aux nageurs et aux bateaux. Ne continuez jamais – sortez au plus tard à Eichholz.',
      en: 'Deadly weir – closed to all swimmers and boats. Never continue past Eichholz.'
    }
  }
];

// Bank stretches where getting out is possible anywhere (drawn as a zone along the river,
// not as a single point). Anchors snap to the nearest vertices of the route line;
// `side` is the bank seen in downstream direction.
const EXIT_ZONES = [
  {
    id: 'eichholz-zone',
    photo: 'eichholz', // popup photo file: img/eichholz.jpg (shared with the Eichholz POI)
    // extended further west and east to better match the park paths/trees
    from: { lat: 46.93478, lon: 7.45900 }, // extend more to the path end on the left
    to:   { lat: 46.93415, lon: 7.45480 }, // extend a bit more to the right until trees clear
    side: 'left',
    name: {
      de: 'Ausstiegszone Eichholz',
      fr: 'Zone de sortie Eichholz',
      en: 'Exit zone Eichholz'
    },
    desc: {
      de: 'Ausstieg überall in dieser Zone entlang des Campings Eichholz möglich. Für Aarebootsvermietung-Kunden ist dies der Ausstieg.',
      fr: 'Sortie possible partout dans cette zone le long du camping Eichholz. Pour les clients Aarebootsvermietung, c’est la sortie.',
      en: 'You can get out anywhere in this zone along the Camping Eichholz bank. This is the exit for Aarebootsvermietung rentals.'
    }
  }
];
