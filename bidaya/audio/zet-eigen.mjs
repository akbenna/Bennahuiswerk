#!/usr/bin/env node
/* =============================================================================
   Zet de opnames die thuis zijn ingesproken vast in de app.

   In de app maak je de opnames onder Ouder → Eigen stem opnemen en sla je ze op
   als één bestand. Dat bestand komt hier binnen; dit script pakt het uit naar
   losse geluidsbestanden en schrijft het lijstje dat de app leest. Commit de map
   daarna, en vanaf dat moment heeft elk toestel de stem van thuis — ook een
   telefoon die de app voor het eerst opent, en ook zonder internet.

   Gebruik:
     node bidaya/audio/zet-eigen.mjs ~/Downloads/bidaya-stem-2026-08-15.json

   Draai je het nog een keer met een nieuw bestand, dan worden bestaande opnames
   overschreven en blijven de opnames die er niet in zitten gewoon staan.
============================================================================= */
import { writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = join(HIER, 'eigen');

const bron = process.argv[2];
if (!bron) {
  console.error('Geef het geëxporteerde bestand op:\n' +
    '  node bidaya/audio/zet-eigen.mjs <bidaya-stem-….json>\n');
  process.exit(1);
}

/* Elk toestel neemt in zijn eigen formaat op; de naam van het bestand moet daar
   bij passen, anders speelt de browser het niet af. */
const EXT = { 'audio/mp4':'m4a', 'audio/x-m4a':'m4a', 'audio/aac':'m4a',
              'audio/mpeg':'mp3', 'audio/webm':'webm', 'audio/ogg':'ogg', 'audio/wav':'wav' };

/* `q:h-dhikr:1` wordt `q-h-dhikr-1` — leesbaar, en veilig als bestandsnaam. */
const veilig = id => id.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '');

const json = JSON.parse(await readFile(bron, 'utf8'));
const opnames = json.opnames || {};
if (!Object.keys(opnames).length) {
  console.error('Er staan geen opnames in dat bestand.');
  process.exit(1);
}

await mkdir(DOEL, { recursive: true });

/* Wat er al ligt, houden we vast: een tweede export met alleen nieuwe opnames
   mag de eerdere niet wegvegen. */
let bestanden = {};
try { bestanden = JSON.parse(await readFile(join(DOEL, 'lijst.json'), 'utf8')).bestanden || {}; } catch (e) {}

let n = 0, over = 0;
for (const [id, dataUrl] of Object.entries(opnames)) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) { console.warn('Overgeslagen (onbekende vorm): ' + id); continue; }
  const soort = m[1].split(';')[0];
  const ext = EXT[soort];
  if (!ext) { console.warn('Overgeslagen (onbekend formaat ' + soort + '): ' + id); continue; }
  const naam = veilig(id) + '.' + ext;
  if (bestanden[id]) over++;
  await writeFile(join(DOEL, naam), Buffer.from(m[2], 'base64'));
  bestanden[id] = naam;
  n++;
}

await writeFile(join(DOEL, 'lijst.json'),
  JSON.stringify({ gemaakt: new Date().toISOString().slice(0, 10), bron: basename(bron), bestanden }, null, 1));

const alles = (await readdir(DOEL)).filter(f => f !== 'lijst.json');
console.log(n + ' opnames weggeschreven (' + over + ' vervangen). In de map staan er nu ' + alles.length + '.');
console.log('Commit `bidaya/audio/eigen/` en de opnames staan op elk toestel.');
