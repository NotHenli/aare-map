// Site-wide configuration, editable via admin.html (published through GitHub,
// live ~1 minute after saving). Loaded on every page before app.js.
const SITE = {
  // Banner shown under the header on all map pages.
  // level: 'info' (blue) | 'warn' (orange) | 'danger' (red)
  alert: {
    enabled: false,
    level: 'info',
    text: {
      de: '',
      fr: '',
      en: ''
    }
  },

  // Partner configuration: /vermietung shows the Aarebootsvermietung version
  // of the map (trip ends at Eichholz, partner POIs visible).
  partners: {
    vermietung: {
      name: 'Aarebootsvermietung',
      url: 'https://aarebootsvermietung.ch',
      logo: 'img/vermietung-logo.png',
      exitPoiId: 'eichholz',
      destLabel: 'Eichholz'
    }
  }
};
