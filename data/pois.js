// Points of interest along the float route Thun–Bern, in downstream order.
// Coordinates verified against OpenStreetMap (official slipways, bridges, weir).
const POIS = [
  {
    id: 'schwaebis',
    type: 'entry',
    lat: 46.76181, lon: 7.61835,
    name: 'Einstieg Schwäbis',
    de: 'Offizielle Einwasserungsstelle. Hier starten die meisten Böötler ab Thun. Rettungsweste anziehen, Nutzlast des Boots beachten.',
    en: 'Official boat entry point. Most floats from Thun start here. Wear your life jacket.'
  },
  {
    id: 'uttigenwelle',
    type: 'danger',
    lat: 46.79730, lon: 7.58180,
    name: 'Uttigenwelle (SBB-Brücke)',
    de: 'Starke Welle unter der Eisenbahnbrücke – die Gefahrenstelle liegt in der Flussmitte und links. RECHTS halten! Für ungeübte Bootsfahrer sehr gefährlich.',
    en: 'Strong standing wave under the railway bridge. Keep to the RIGHT side of the river. Very dangerous for inexperienced boaters.'
  },
  {
    id: 'uttigen',
    type: 'entry',
    lat: 46.79756, lon: 7.58089,
    name: 'Einstieg Uttigen',
    de: 'Offizielle Einwasserungsstelle direkt unterhalb der Eisenbahnbrücke – wer hier startet, umgeht die Uttigenwelle.',
    en: 'Official entry point just below the railway bridge – starting here avoids the Uttigen wave.'
  },
  {
    id: 'auguetbruecke',
    type: 'danger',
    lat: 46.91901, lon: 7.50039,
    name: 'Auguetbrücke (Holzbrücke)',
    de: 'Vorsicht Brückenpfeiler! In der Mitte zwischen den Pfeilern durchfahren. Boote nicht an der Brücke anbinden. Frühzeitig Kurs wählen – die Strömung drückt gegen die Pfeiler.',
    en: 'Wooden bridge with pillars in the river – pass through the MIDDLE between the pillars. The current pushes towards the pillars, steer early.'
  },
  {
    id: 'eichholz',
    type: 'exit',
    lat: 46.93307, lon: 7.45328,
    name: 'Ausstieg Eichholz',
    de: 'Erster Hauptausstieg in Bern (rechtes Ufer). Grosse Wiese, Camping, Duschen, WC, Tram Nr. 9 (Haltestelle Eichholz). Guter Ausstieg für Schlauchboote.',
    en: 'First main exit in Bern (right bank). Large meadow, camping, showers, tram no. 9. Good take-out for boats.'
  },
  {
    id: 'marzili',
    type: 'exit',
    lat: 46.94246, lon: 7.44541,
    name: 'Ausstieg Marzili – LETZTER AUSSTIEG',
    de: 'Letzte Ausstiegsstelle (linkes Ufer, beim Marzilibad)! Danach folgt das Schwellenmätteli-Wehr – Lebensgefahr. Hier spätestens aussteigen.',
    en: 'LAST EXIT (left bank, at the Marzili lido)! The deadly Schwellenmätteli weir follows – you must get out here at the latest.'
  },
  {
    id: 'schwelle',
    type: 'weir',
    lat: 46.94578, lon: 7.45191,
    name: 'Wehr Schwellenmätteli – GESPERRT',
    de: 'Lebensgefahr! Wehr mit starker Walze. Gesperrte Zone für Schwimmer und Boote. Niemals weiterfahren – spätestens im Marzili aussteigen.',
    en: 'Deadly weir – closed to all swimmers and boats. Never continue past Marzili.'
  }
];
