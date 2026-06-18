/**
 * Merges per-tehsil village JSON files into villages-by-tehsil.json
 * Run: node prisma/data/merge-location-json.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEHSIL_FILES = {
  'AHMADPUR SIAL': 'ahmadpur-sial.json',
  ALIPUR: 'alipur.json',
  BAHAWALNAGAR: 'bahawalnagar.json',
  BHOWANA: 'bhowana.json',
  'DARYA KHAN': 'darya-khan.json',
  'ISA KHEL': 'isa-khel.json',
  'KALLAR KAHAR': 'kallar-kahar.json',
  'KAHROR PACCA': 'kahror-pacca.json',
  'KHAIRPUR TAMEWALI': 'khairpur-tamewali.json',
  'KOT MOMIN': 'kot-momin.json',
  LIAQATPUR: 'liaqatpur.json',
  'NOORPUR THAL': 'noorpur-thal.json',
  PAKPATTAN: 'pakpattan.json',
  ROJHAN: 'rojhan.json',
  SHUJABAD: 'shujabad.json',
  TAUNSA: 'taunsa.json',
};

const villagesDir = join(__dirname, 'villages');
const villagesByTehsil = {};

for (const [tehsil, file] of Object.entries(TEHSIL_FILES)) {
  const path = join(villagesDir, file);
  try {
    villagesByTehsil[tehsil] = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    villagesByTehsil[tehsil] = [];
    console.warn(`Missing or invalid: ${file}`);
  }
}

writeFileSync(
  join(__dirname, 'villages-by-tehsil.json'),
  JSON.stringify(villagesByTehsil, null, 2),
);

// Settlements: load if present, else empty object
try {
  const settlements = JSON.parse(
    readFileSync(join(__dirname, 'settlements-by-village.json'), 'utf8'),
  );
  console.log(
    `Merged ${Object.keys(villagesByTehsil).length} tehsils; settlements: ${Object.keys(settlements).length} villages`,
  );
} catch {
  writeFileSync(join(__dirname, 'settlements-by-village.json'), '{}');
  console.log('Created empty settlements-by-village.json');
}

console.log('Wrote villages-by-tehsil.json');
