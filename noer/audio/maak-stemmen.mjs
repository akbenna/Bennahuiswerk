#!/usr/bin/env node
/* =============================================================================
   Maakt geluid voor de zinnen van het gebed en de du'a's.

   Voor de Koran gebruiken we een mens: die fragmenten haalt haal-recitatie.mjs
   op. Voor de takbir, de tashahhud, de salawat, de woorden in de buiging en de
   knieval en de du'a's van de dag bestaat geen archief. Dit script laat die
   inspreken door een van de neurale Arabische stemmen van Microsoft — een stuk
   beter dan de stem die in een telefoon zit, en op elk toestel hetzelfde.

   Het blijft een machine. Neemt iemand thuis of in de moskee ze later echt in,
   dan gaan die opnames er vanzelf boven: de app kijkt eerst in `audio/eigen`.

   Eenmalig installeren (Python 3 zit al op elke Mac):
     python3 -m pip install --user edge-tts
   Weigert dat met "externally managed environment", dan:
     brew install pipx && pipx install edge-tts
   Of, als laatste redmiddel:
     python3 -m pip install --user --break-system-packages edge-tts

   Daarna:
     node noer/audio/maak-stemmen.mjs
     node noer/audio/maak-stemmen.mjs --stem=ar-SA-ZariyahNeural
     node noer/audio/maak-stemmen.mjs --lijst-stemmen
============================================================================= */
import { writeFile, mkdir, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = join(HIER, 'stem');
const APP  = join(HIER, '..', 'index.html');

const arg = (n, s) => { const t = process.argv.find(a => a.startsWith('--' + n + '=')); return t ? t.slice(n.length + 3) : s; };
const vlag = n => process.argv.includes('--' + n);
const STEM = arg('stem', 'ar-SA-HamedNeural');
const TEMPO = arg('tempo', '-25%');

const draai = (cmd, args) => new Promise((res, rej) => {
  const k = spawn(cmd[0], [...cmd.slice(1), ...args], { shell: process.platform === 'win32' });
  let uit = '', fout = '';
  k.stdout.on('data', d => uit += d); k.stderr.on('data', d => fout += d);
  k.on('error', rej);
  k.on('close', c => c === 0 ? res(uit) : rej(new Error(fout.trim() || ('afgesloten met ' + c))));
});

/* ---- de teksten uit de app halen, zodat er maar één plek is waar ze staan ---- */
/* We lezen index.html en snijden er de gegevenslijsten uit. Haakjes tellen mag
   niet naïef: er staan haakjes ín de teksten. Vandaar dit kleine leesmachientje
   dat aanhalingstekens overslaat.

   Commentaar moet het net zo goed overslaan, en dat is geen luxe: in het
   Nederlands staat er zo "de du'a" in een uitleg, en zo'n losse apostrof laat
   een naïeve lezer denken dat er een string begint. Alles tot de vólgende
   apostrof — soms honderden regels verderop — telt dan niet meer mee, en de
   lijst loopt scheef af met een foutmelding die nergens naar wijst. */
function haalLiteral(bron, naam) {
  const start = bron.indexOf('const ' + naam + ' = ');
  if (start < 0) throw new Error('kon ' + naam + ' niet vinden in index.html');
  let i = bron.indexOf('=', start) + 1;
  while (' \n\r\t'.includes(bron[i])) i++;
  const open = bron[i], dicht = open === '{' ? '}' : ']';
  let diep = 0, aanhaling = null;
  for (let j = i; j < bron.length; j++) {
    const c = bron[j];
    if (aanhaling) {
      if (c === '\\') { j++; continue; }
      if (c === aanhaling) aanhaling = null;
      continue;
    }
    if (c === '/' && bron[j + 1] === '*') { const e = bron.indexOf('*/', j + 2); if (e < 0) break; j = e + 1; continue; }
    if (c === '/' && bron[j + 1] === '/') { const e = bron.indexOf('\n', j + 2); if (e < 0) break; j = e; continue; }
    if (c === "'" || c === '"' || c === '`') { aanhaling = c; continue; }
    if (c === open) diep++;
    else if (c === dicht) { diep--; if (!diep) return bron.slice(i, j + 1); }
  }
  throw new Error(naam + ' loopt niet netjes af');
}
const lees = (bron, naam) => new Function('return ' + haalLiteral(bron, naam))();

const bron = await readFile(APP, 'utf8');
const T = lees(bron, 'T'), HIFZ = lees(bron, 'HIFZ'), DUAS = lees(bron, 'DUAS'), WUDU = lees(bron, 'WUDU');
const regelsVan = id => (HIFZ.find(h => h.id === id) || { r: [] }).r;

const WERK = [
  ...regelsVan('h-iqama').map((r, i)      => ({ id:'q:h-iqama:' + (i+1),      ar:r[0], wat:'Iqama ' + (i+1) })),
  { id:'t:takbir', ar:T.takbir.ar, wat:'De takbir' },
  ...regelsVan('h-dhikr').map((r, i)      => ({ id:'q:h-dhikr:' + (i+1),      ar:r[0], wat:'Buiging en knieval ' + (i+1) })),
  ...regelsVan('h-tashahhud').map((r, i)  => ({ id:'q:h-tashahhud:' + (i+1),  ar:r[0], wat:'Tashahhud ' + (i+1) })),
  ...regelsVan('h-salawat').map((r, i)    => ({ id:'q:h-salawat:' + (i+1),    ar:r[0], wat:'Salawat ' + (i+1) })),
  ...regelsVan('h-dua-salam').map((r, i) => ({ id:'q:h-dua-salam:' + (i+1),  ar:r[0], wat:"Du'a vóór de slotgroet " + (i+1) })),
  { id:'t:salam', ar:T.salam.ar, wat:'De slotgroet' },
  { id:'t:qunut', ar:T.qunut.ar, wat:'De qunut' },
  { id:'t:amin',  ar:T.amin.ar,  wat:'Amin' },
  ...regelsVan('h-nagebed').map((r, i)   => ({ id:'q:h-nagebed:' + (i+1),   ar:r[0], wat:'Na het gebed ' + (i+1) })),
  { id:'t:istiftah', ar:T.istiftah.ar, wat:"De openingsdu'a" },
  { id:'t:taawwudh', ar:T.taawwudh.ar, wat:'Bescherming zoeken' },
  /* De gebeden die zelden langskomen — en die je juist dán niet wilt opzoeken. */
  { id:'t:takbir-eid',   ar:T.takbirEid.ar,  wat:'Takbir van het feest' },
  { id:'t:janaza',       ar:T.janazaDua.ar,  wat:"Du'a bij een overledene" },
  { id:'t:janaza-kind',  ar:T.janazaKind.ar, wat:"Du'a bij een overleden kind" },
  { id:'t:istirja',      ar:T.istirja.ar,    wat:'Als je het nieuws hoort' },
  { id:'t:musiba',       ar:T.duaMusiba.ar,  wat:"Du'a bij verdriet" },
  { id:'t:taziya',       ar:T.taziya.ar,     wat:'Condoleren' },
  { id:'t:bij-graf',     ar:T.bijGraf.ar,    wat:'Bij het graf' },
  { id:'t:groet-graf',   ar:T.groetGraf.ar,  wat:'Groet aan het kerkhof' },
  { id:'t:istikhara',    ar:T.istikhara.ar,  wat:'De istikhara' },
  { id:'t:istisqa',      ar:T.istisqa.ar,    wat:'Vragen om regen' },
  { id:'t:bismillah',     ar:WUDU[0].zeg.ar,                 wat:'Wassing: begin' },
  { id:'t:wudu-shahada',  ar:WUDU[WUDU.length-1].zeg.ar,     wat:'Wassing: slot' },
  ...DUAS.map((d, i) => ({ id:'d:' + (i+1), ar:d.ar, wat:"Du'a: " + d.w })),
];

const veilig = id => id.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '');
const bestaat = async f => { try { await access(f); return true; } catch (e) { return false; } };

/* Waar zit edge-tts? Na een installatie met --user zet Python de opdracht in een
   map die niet altijd op het PATH staat. In dat geval werkt de omweg via de
   Python-module wél. We proberen ze op volgorde en onthouden wat werkt. */
async function vindEdgeTts() {
  const kandidaten = [['edge-tts'], ['python3', '-m', 'edge_tts'], ['python', '-m', 'edge_tts'], ['py', '-m', 'edge_tts']];
  for (const k of kandidaten) {
    try { await draai(k, ['--help']); return k; } catch (e) { /* volgende proberen */ }
  }
  return null;
}
const EDGE = await vindEdgeTts();

if (vlag('lijst-stemmen')) {
  try {
    const uit = await draai(EDGE, ['--list-voices']);
    console.log('\nArabische stemmen:\n');
    uit.split('\n').filter(r => /^ar-/.test(r.trim())).forEach(r => console.log('  ' + r.trim().split(/\s{2,}/)[0]));
  } catch (e) { console.error('edge-tts staat er nog niet op.'); }
  process.exit(0);
}

if (vlag('proef')) {
  console.log('\nDeze ' + WERK.length + ' fragmenten worden gemaakt:\n');
  WERK.forEach(w => console.log('  ' + w.id.padEnd(20) + w.wat.padEnd(26) + w.ar.slice(0, 40)));
  console.log('\n(Proefdraai: er is niets gemaakt.)\n');
  process.exit(0);
}

if (!EDGE) {
  console.error('\nedge-tts is niet gevonden — niet als opdracht en niet als Python-module.\n\n' +
    'Installeer het eenmalig. Op een Mac heet pip niet "pip" maar zit hij in Python:\n' +
    '  python3 -m pip install --user edge-tts\n\n' +
    'Weigert dat met "externally managed environment", gebruik dan pipx:\n' +
    '  brew install pipx && pipx install edge-tts\n\n' +
    'Het is de neurale voorleesstem van Microsoft. Er is geen sleutel of account voor nodig,\n' +
    'wel internet op het moment dat je dit script draait. Na het installeren hoef je niets\n' +
    'aan je PATH te doen: dit script vindt hem ook via python3 -m edge_tts.\n');
  process.exit(1);
}
console.log('Gevonden: ' + EDGE.join(' '));

await mkdir(DOEL, { recursive: true });
let bestanden = {};
try { bestanden = JSON.parse(await readFile(join(DOEL, 'lijst.json'), 'utf8')).bestanden || {}; } catch (e) {}

console.log('Stem: ' + STEM + ' · tempo ' + TEMPO + ' · ' + WERK.length + ' fragmenten\n');
let n = 0, over = 0, fout = 0;
for (const w of WERK) {
  const naam = veilig(w.id) + '.mp3', pad = join(DOEL, naam);
  if (!vlag('opnieuw') && await bestaat(pad)) { bestanden[w.id] = naam; over++; process.stdout.write('='); continue; }
  try {
    await draai(EDGE, ['--voice', STEM, '--rate=' + TEMPO, '--text', w.ar, '--write-media', pad]);
    bestanden[w.id] = naam; n++; process.stdout.write('.');
  } catch (e) { fout++; process.stdout.write('x'); console.error('\n  ' + w.wat + ': ' + e.message); }
}
process.stdout.write('\n');

await writeFile(join(DOEL, 'lijst.json'), JSON.stringify({
  stem: STEM, tempo: TEMPO, gemaakt: new Date().toISOString().slice(0, 10), bestanden
}, null, 1));

console.log('\n' + n + ' gemaakt, ' + over + ' stonden er al, ' + fout + ' mislukt.');
console.log('Luister er een paar na — een voorleesstem legt de klemtoon soms verkeerd.');
console.log('Daarna: git add noer/audio/stem && git commit -m "Stemmen erbij"');
