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
      de: 'Schlauchboot-Vermietung an der Regiebrücke – das Haus rechts direkt nach der Brücke (Schwäbisstrasse, Steffisburg). Boote, Schwimmwesten und Trockensäcke – Einwasserung gleich unterhalb.',
      fr: 'Location de bateaux pneumatiques à la Regiebrücke – la maison à droite juste après le pont (Schwäbisstrasse, Steffisburg). Bateaux, gilets de sauvetage et sacs étanches – mise à l’eau juste en aval.',
      en: 'Inflatable boat rental at the Regiebrücke – the house on the right just after the bridge. Boats, life jackets and dry bags – launch just downstream.'
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
      de: 'Offizielle Einwasserungsstelle. Hier starten die meisten Böötler ab Thun. Rettungsweste anziehen, Nutzlast des Boots beachten.',
      fr: 'Point de mise à l’eau officiel. La plupart des descentes depuis Thoune partent ici. Portez votre gilet de sauvetage et respectez la charge utile du bateau.',
      en: 'Official boat entry point. Most floats from Thun start here. Wear your life jacket.'
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
      de: 'Starke Welle unter der Eisenbahnbrücke – die Gefahrenstelle liegt in der Flussmitte und links. RECHTS halten! Für ungeübte Bootsfahrer sehr gefährlich.',
      fr: 'Forte vague sous le pont ferroviaire – le danger se situe au milieu de la rivière et à gauche. Restez à DROITE ! Très dangereux pour les personnes inexpérimentées.',
      en: 'Strong standing wave under the railway bridge. Keep to the RIGHT side of the river. Very dangerous for inexperienced boaters.'
    }
  },
  {
    id: 'uttigen',
    type: 'entry',
    lat: 46.79756, lon: 7.58089,
    minZoom: 16,
    name: {
      de: 'Einstieg Uttigen',
      fr: 'Embarquement Uttigen',
      en: 'Entry Uttigen'
    },
    desc: {
      de: 'Offizielle Einwasserungsstelle direkt unterhalb der Eisenbahnbrücke – wer hier startet, umgeht die Uttigenwelle.',
      fr: 'Point de mise à l’eau officiel juste en aval du pont ferroviaire – en partant ici, on évite la vague d’Uttigen.',
      en: 'Official entry point just below the railway bridge – starting here avoids the Uttigen wave.'
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
      de: 'Vorsicht Brückenpfeiler! In der Mitte zwischen den Pfeilern durchfahren. Boote nicht an der Brücke anbinden. Frühzeitig Kurs wählen – die Strömung drückt gegen die Pfeiler.',
      fr: 'Attention aux piliers du pont ! Passez au MILIEU entre les piliers. Le courant pousse vers les piliers – choisissez votre trajectoire tôt. N’amarrez pas les bateaux au pont.',
      en: 'Wooden bridge with pillars in the river – pass through the MIDDLE between the pillars. The current pushes towards the pillars, steer early.'
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
      de: 'Erster Hauptausstieg in Bern: Ausstieg überall in der markierten Zone entlang des Campings Eichholz möglich. Grosse Wiese, Camping, Duschen, WC, Tram Nr. 9.',
      fr: 'Première sortie principale à Berne : sortie possible partout dans la zone marquée le long du camping Eichholz. Grande prairie, camping, douches, WC, tram n° 9.',
      en: 'First main exit in Bern: you can get out anywhere in the marked zone along the Camping Eichholz meadow. Showers, WC, tram no. 9.'
    }
  },
  {
    id: 'marzili',
    type: 'exit',
    lat: 46.94435, lon: 7.44520,
    name: {
      de: 'Ausstieg Marzili – LETZTER AUSSTIEG',
      fr: 'Sortie Marzili – DERNIÈRE SORTIE',
      en: 'Exit Marzili – LAST EXIT'
    },
    desc: {
      de: 'Letzte Ausstiegsstelle: der Platz direkt vor der Dalmazibrücke, linkes Ufer. Danach folgt das Schwellenmätteli-Wehr – Lebensgefahr. Hier spätestens aussteigen!',
      fr: 'Dernière sortie : l’espace juste avant le pont Dalmazibrücke, rive gauche. Ensuite vient le barrage du Schwellenmätteli – danger de mort. Sortez ici au plus tard !',
      en: 'LAST EXIT: the open space just before the Dalmazibrücke bridge, on the left bank. The deadly Schwellenmätteli weir follows – you must get out here at the latest.'
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
      de: 'Lebensgefahr! Wehr mit starker Walze. Gesperrte Zone für Schwimmer und Boote. Niemals weiterfahren – spätestens im Marzili aussteigen.',
      fr: 'Danger de mort ! Barrage avec fort rappel. Zone interdite aux nageurs et aux bateaux. Ne continuez jamais – sortez au plus tard au Marzili.',
      en: 'Deadly weir – closed to all swimmers and boats. Never continue past Marzili.'
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
      de: 'Ausstieg überall in dieser Zone entlang des Campings Eichholz möglich.',
      fr: 'Sortie possible partout dans cette zone le long du camping Eichholz.',
      en: 'You can get out anywhere in this zone along the Camping Eichholz bank.'
    }
  }
];
