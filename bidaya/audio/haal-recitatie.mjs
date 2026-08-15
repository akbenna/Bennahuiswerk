#!/usr/bin/env node
/* =============================================================================
   Haalt de recitatiefragmenten op die Bidaya gebruikt.

   Waarom een script en geen kant-en-klare map: de opnames komen van een archief
   dat per aya één bestand aanbiedt, en welke reciteerder je wilt is een keuze.
   Dit script haalt precies de vierenzestig regels op die in de app staan, zet ze
   neer onder de naam die de app verwacht, en schrijft een lijstje van wat er
   gelukt is. Wat ontbreekt, valt in de app vanzelf terug op de stem van het
   toestel — de app blijft dus werken, ook als je dit nooit draait.

   Gebruik:
     node haal-recitatie.mjs --basis="https://<archief>/<map-van-de-reciteerder>"

   Er wordt per aya een bestand verwacht met de gebruikelijke naamgeving
   SSSAAA.mp3 — 001001.mp3 is soera 1, aya 1. Kandidaten voor een Warsh-lezing
   vind je op everyayah.com (map `data/warsh/...`) en bij mp3quran.net. Draait
   het script vast op 404's, dan klopt de map niet; probeer een andere.

   Over al-Fatiha: in de Kufische telling (die de meeste archieven aanhouden) is
   de basmala aya 1 en loopt de soera tot aya 7. In de Medinensische telling,
   die bij Warsh hoort, telt de basmala niet mee en schuift alles één op. Draai
   met --fatiha=madani als je merkt dat het eerste fragment niet de basmala is.

   Na afloop: open bidaya/audio/quran/h-fatiha-1.mp3 en luister of je "bismillahi
   r-rahmani r-rahim" hoort. Klopt dat niet, draai dan met de andere telling.
============================================================================= */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = join(HIER, 'quran');

/* Wat de app nodig heeft: per tekst het soeranummer en het aantal regels.
   De regels van de app zijn de aya's, in dezelfde volgorde. */
const TEKSTEN = [
  { id:'h-fatiha',   soera:1,   regels:7 },
  { id:'h-nas',      soera:114, regels:6 },
  { id:'h-falaq',    soera:113, regels:5 },
  { id:'h-ikhlas',   soera:112, regels:4 },
  { id:'h-masad',    soera:111, regels:5 },
  { id:'h-nasr',     soera:110, regels:3 },
  { id:'h-kafirun',  soera:109, regels:6 },
  { id:'h-kawthar',  soera:108, regels:3 },
  { id:'h-maun',     soera:107, regels:7 },
  { id:'h-quraysh',  soera:106, regels:4 },
  { id:'h-fil',      soera:105, regels:5 },
  { id:'h-asr',      soera:103, regels:3 },
];

const arg = (naam, standaard) => {
  const t = process.argv.find(a => a.startsWith('--' + naam + '='));
  return t ? t.slice(naam.length + 3) : standaard;
};
const basis  = (arg('basis', '') || '').replace(/\/$/, '');
const fatiha = arg('fatiha', 'kufi');

if (!basis) {
  console.error('Geef op waar de fragmenten vandaan komen:\n' +
    '  node haal-recitatie.mjs --basis="https://<archief>/<reciteerder>"\n' +
    '  optioneel: --fatiha=madani\n');
  process.exit(1);
}

const nr = (s, a) => String(s).padStart(3, '0') + String(a).padStart(3, '0');

/* Regelnummer in de app → aya-nummer in het archief. Alleen al-Fatiha wijkt af. */
function ayaVan(tekst, regel) {
  if (tekst.id === 'h-fatiha' && fatiha === 'madani') {
    // De basmala staat in de Medinensische telling niet als aya van de soera.
    // Regel 1 (de basmala) pakken we dan van de basmala aan het begin van
    // soera 2 — dat is dezelfde zin, door dezelfde reciteerder ingesproken.
    if (regel === 1) return { soera: 1, aya: 1, let: 'basmala' };
    return { soera: 1, aya: regel - 1 };
  }
  return { soera: tekst.soera, aya: regel };
}

async function haal(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
  const buf = Buffer.from(await r.arrayBuffer());
  // Een echt mp3-bestand begint met "ID3" of met een frame-synchronisatie.
  const goed = buf.length > 2000 && (buf.slice(0, 3).toString() === 'ID3' || buf[0] === 0xff);
  if (!goed) throw new Error('geen bruikbaar mp3-bestand (' + buf.length + ' bytes)');
  return buf;
}

await mkdir(DOEL, { recursive: true });
const gelukt = [], mislukt = [];

for (const t of TEKSTEN) {
  for (let regel = 1; regel <= t.regels; regel++) {
    const { soera, aya } = ayaVan(t, regel);
    const bron = basis + '/' + nr(soera, aya) + '.mp3';
    const naam = t.id + '-' + regel + '.mp3';
    try {
      const buf = await haal(bron);
      await writeFile(join(DOEL, naam), buf);
      gelukt.push('q:' + t.id + ':' + regel);
      process.stdout.write('.');
    } catch (e) {
      mislukt.push(naam + '  ←  ' + bron + '  (' + e.message + ')');
      process.stdout.write('x');
    }
  }
}
process.stdout.write('\n');

/* Controle: bestaat er ook een aya ná de laatste die wij verwachten? Dan houdt
   dit archief een andere telling aan en klopt de indeling van die soera niet. */
for (const t of TEKSTEN) {
  const { soera } = ayaVan(t, 1);
  try {
    await haal(basis + '/' + nr(t.soera, t.regels + 1) + '.mp3');
    console.warn('Let op: ' + t.id + ' heeft in dit archief meer aya\'s dan de ' +
      t.regels + ' regels in de app. Controleer de indeling van die soera.');
  } catch (e) { /* niets gevonden is precies goed */ }
}

await writeFile(join(DOEL, 'lijst.json'),
  JSON.stringify({ bron: basis, telling: fatiha, gemaakt: new Date().toISOString().slice(0, 10), fragmenten: gelukt }, null, 1));

console.log('\nKlaar. ' + gelukt.length + ' fragmenten opgehaald, ' + mislukt.length + ' mislukt.');
if (mislukt.length) console.log('Mislukt:\n  ' + mislukt.join('\n  '));
console.log('\nLuister nu naar audio/quran/h-fatiha-1.mp3. Hoor je "bismillahi r-rahmani r-rahim"?\n' +
  'Zo niet, draai opnieuw met --fatiha=' + (fatiha === 'kufi' ? 'madani' : 'kufi') + '.');
