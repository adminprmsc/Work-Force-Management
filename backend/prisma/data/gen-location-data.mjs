import { readFileSync, writeFileSync } from 'fs';

const villages = JSON.parse(readFileSync('villages-by-tehsil.json', 'utf8'));
const settlements = JSON.parse(readFileSync('settlements-by-village.json', 'utf8'));

const wrong = new Set([
  'DARYA KHAN',
  'KALLAR KAHAR',
  'KAHROR PACCA',
  'KHAIRPUR TAMEWALI',
  'KOT MOMIN',
  'LIAQATPUR',
  'PAKPATTAN',
  'ROJHAN',
  'TAUNSA',
  'ISA KHEL',
  'NOORPUR THAL',
  'SHUJABAD',
]);

const tehsils = Object.keys(villages);

// Defensive: strip the 12 wrongly-nested tehsil names from BAHAWALNAGAR villages
if (villages['BAHAWALNAGAR']) {
  villages['BAHAWALNAGAR'] = villages['BAHAWALNAGAR'].filter((v) => !wrong.has(v));
}

const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

const fmtArr = (arr, indent) => {
  if (arr.length === 0) return '[]';
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 2);
  return '[\n' + arr.map((v) => inner + q(v)).join(',\n') + ',\n' + pad + ']';
};

let out = '';
out += '// AUTO-GENERATED canonical geography data. Single source of truth.\n';
out += '// Generated from villages-by-tehsil.json and settlements-by-village.json\n';
out += '// via gen-location-data.mjs. Do not edit by hand.\n\n';

out += 'export const TEHSIL_OPTIONS = [\n';
out += tehsils.map((t) => '  ' + q(t)).join(',\n') + ',\n';
out += '] as const;\n\n';

out += 'export type Tehsil = (typeof TEHSIL_OPTIONS)[number];\n\n';
out += 'export type LocationData = Record<string, string[]>;\n\n';

out += 'export const LOCATION_DATA: LocationData = {\n';
out += tehsils.map((t) => '  ' + q(t) + ': ' + fmtArr(villages[t], 2)).join(',\n') + ',\n';
out += '};\n\n';

const sVillages = Object.keys(settlements);
out += 'export const SETTLEMENT_DATA: LocationData = {\n';
out += sVillages.map((v) => '  ' + q(v) + ': ' + fmtArr(settlements[v], 2)).join(',\n') + ',\n';
out += '};\n';

writeFileSync('location-data.ts', out);

console.log(tehsils.map((t) => `${t}: ${villages[t].length}`).join('\n'));
console.log('---');
console.log('settlement villages:', sVillages.length);
console.log(
  'total settlements:',
  Object.values(settlements).reduce((a, b) => a + b.length, 0),
);
