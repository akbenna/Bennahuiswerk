#!/usr/bin/env node
/* =============================================================================
   Zet de opnames die thuis zijn ingesproken vast in de app.

   In de app maak je de opnames onder Ouder → Eigen stem opnemen en sla je ze op
   als één bestand. Dat bestand komt hier binnen; dit script pakt het uit naar
   losse geluidsbestanden en schrijft het lijstje dat de app leest. Commit de map
   daarna, en vanaf dat moment heeft elk toestel de stem van thuis — ook een
   telefoon die de app voor het eerst opent, en ook zonder internet.

   Gebruik:
     node noer/audio/zet-eigen.mjs ~/Downloads/noer-stem-2026-08-15.json

   Draai je het nog een keer met een nieuw bestand, dan worden bestaande opnames
   overschreven en blijven de opnames die er niet in zitten gewoon staan.
============================================================================= */
import { writeFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = join(HIER, 'eigen');

const bron = process.argv[2];
if (!bron) {
  console.error('Geef het geëxporteerde bestand op:\n' +
    '  node noer/audio/zet-eigen.mjs <noer-stem-….json>\n');
  process.exit(1);
}

/* Elk toestel neemt in zijn eigen formaat op; de naam van het bestand moet daar
   bij passen, anders speelt de browser het niet af. */
const EXT = { 'audio/mp4':'m4a', 'audio/x-m4a':'m4a', 'audio/aac':'m4a',
              'audio/mpeg':'mp3', 'audio/webm':'webm', 'audio/ogg':'ogg', 'audio/wav':'wav' };

/* `q:h-dhikr:1` wordt `q-h-dhikr-1` — leesbaar, en veilig als bestandsnaam. */
const veilig = id => id.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '');

/* Een browser neemt op in webm (Chrome) of m4a (Safari). Webm speelt niet op een
   iPhone en m4a niet overal even soepel — mp3 speelt overal. Staat ffmpeg op deze
   computer, dan zetten we alles om; zo niet, dan houden we het origineel en
   zeggen we erbij dat het op sommige toestellen stil kan blijven. */
const draai = (cmd, args) => new Promise((res, rej) => {
  const k = spawn(cmd, args, { shell: process.platform === 'win32' });
  let fout = ''; k.stderr.on('data', d => fout += d);
  k.on('error', rej); k.on('close', c => c === 0 ? res() : rej(new Error(fout.slice(-200))));
});
let heeftFfmpeg = false;
try { await draai('ffmpeg', ['-version']); heeftFfmpeg = true; } catch (e) {}

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
  if (bestanden[id]) over++;
  const rauw = veilig(id) + '.' + ext;
  await writeFile(join(DOEL, rauw), Buffer.from(m[2], 'base64'));
  let naam = rauw;
  if (heeftFfmpeg && ext !== 'mp3') {
    naam = veilig(id) + '.mp3';
    try {
      await draai('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(DOEL, rauw), '-codec:a', 'libmp3lame', '-q:a', '5', join(DOEL, naam)]);
      await unlink(join(DOEL, rauw));
    } catch (e) { naam = rauw; console.warn('Omzetten mislukt voor ' + id + ', origineel bewaard.'); }
  }
  bestanden[id] = naam;
  n++;
}

await writeFile(join(DOEL, 'lijst.json'),
  JSON.stringify({ gemaakt: new Date().toISOString().slice(0, 10), bron: basename(bron), bestanden }, null, 1));

const alles = (await readdir(DOEL)).filter(f => f !== 'lijst.json');
console.log(n + ' opnames weggeschreven (' + over + ' vervangen). In de map staan er nu ' + alles.length + '.');
if (!heeftFfmpeg) console.log('\nLet op: ffmpeg staat niet op deze computer, dus de opnames blijven in het formaat\n' +
  'van het toestel waarop ze gemaakt zijn. Een webm-opname uit Chrome speelt niet af op een\n' +
  'iPhone. Installeer ffmpeg en draai dit nog eens met dezelfde export om dat te verhelpen.');
console.log('Commit `noer/audio/eigen/` en de opnames staan op elk toestel.');
