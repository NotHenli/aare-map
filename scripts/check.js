#!/usr/bin/env node
// Pre-push checks: syntax-check all first-party JS, then evaluate the data
// files and make sure every POI / exit zone / UI string exists in all languages.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const files = ['app.js', 'admin.js', 'data/river.js', 'data/messages.js', 'data/pois.js', 'data/site.js', 'scripts/build.js'];

let errors = 0;
const fail = msg => { console.error(`✗ ${msg}`); errors++; };

// 1. Syntax check (catches unterminated strings, missing braces, ...)
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
    console.log(`✓ syntax ${file}`);
  } catch (err) {
    fail(`syntax ${file}\n${err.stderr}`);
  }
}

if (errors === 0) {
  // 2. Evaluate the data files in a sandbox and validate translations.
  const context = vm.createContext({});
  for (const file of ['data/messages.js', 'data/pois.js', 'data/site.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const { LANGS, MESSAGES, POIS, EXIT_ZONES, SITE } = vm.runInContext('({ LANGS, MESSAGES, POIS, EXIT_ZONES, SITE })', context);

  // site.js: alert must have a German text when enabled; partner exits must exist
  if (SITE.alert.enabled && !(SITE.alert.text.de || '').trim()) {
    fail('site.js: alert is enabled but text.de is empty');
  }
  for (const [id, partner] of Object.entries(SITE.partners)) {
    if (!POIS.some(p => p.id === partner.exitPoiId)) {
      fail(`site.js: partner "${id}" exitPoiId "${partner.exitPoiId}" not found in pois.js`);
    }
  }

  const refKeys = Object.keys(MESSAGES[LANGS[0]]);
  for (const lang of LANGS) {
    if (!MESSAGES[lang]) { fail(`messages.js: language "${lang}" missing`); continue; }
    for (const key of refKeys) {
      if (typeof MESSAGES[lang][key] !== 'string') fail(`messages.js: ${lang}.${key} missing`);
    }
  }

  for (const poi of [...POIS, ...EXIT_ZONES]) {
    if (!poi.id) fail('pois.js: POI without id');
    for (const field of ['name', 'desc']) {
      for (const lang of LANGS) {
        if (typeof poi[field]?.[lang] !== 'string' || !poi[field][lang].trim()) {
          fail(`pois.js: ${poi.id}.${field}.${lang} missing or empty`);
        }
      }
    }
    if (poi.from ? !(poi.from.lat && poi.from.lon && poi.to?.lat && poi.to?.lon)
                 : !(typeof poi.lat === 'number' && typeof poi.lon === 'number')) {
      fail(`pois.js: ${poi.id} has invalid coordinates`);
    }
  }

  if (errors === 0) console.log(`✓ ${POIS.length} POIs + ${EXIT_ZONES.length} exit zones valid in ${LANGS.join('/')}`);
}

if (errors > 0) {
  console.error(`\n${errors} problem(s) found – fix before pushing.`);
  process.exit(1);
}
console.log('All checks passed.');
