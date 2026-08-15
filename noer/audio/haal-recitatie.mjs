#!/usr/bin/env node
/* =============================================================================
   Haalt de recitatiefragmenten op die Noer Islam gebruikt.

   Zonder opties zoekt het script zelf een bron die werkt:

     node noer/audio/haal-recitatie.mjs

   Een bepaalde reciteerder kiezen:      --bron=warsh-dosary
   De lijst met bronnen zien:            --lijst
   Een eigen archief gebruiken:          --basis="https://…/map"
   Opnieuw ophalen wat er al staat:      --opnieuw

   Er wordt per aya één bestand verwacht met de gebruikelijke naamgeving
   SSSAAA.mp3 — 001001.mp3 is soera 1, aya 1.
============================================================================= */
import { writeFile, mkdir, access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const DOEL = join(HIER, 'quran');

/* De lezing van Warsh staat bovenaan: dat is de lezing van Marokko en de rest
   van de Maghreb, en dus wat de kinderen in de moskee horen. Werkt geen van de
   Warsh-bronnen, dan pakt het script een Hafs-lezing — beter een goede stem in
   de verkeerde lezing dan een robot. Het meldt altijd wát het gepakt heeft. */
const BRONNEN = [
  { id:'warsh-dosary',  lezing:'Warsh', naam:'Ibrahim al-Dosary',
    basis:'https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps' },
  { id:'warsh-jazaery', lezing:'Warsh', naam:'Yassin al-Jazaery',
    basis:'https://everyayah.com/data/warsh/warsh_yassin_al_jazaery_128kbps' },
  { id:'warsh-basit',   lezing:'Warsh', naam:'Abdul Basit',
    basis:'https://everyayah.com/data/warsh/warsh_abdulbasit_128kbps' },
  { id:'husary-leraar', lezing:'Hafs',  naam:'Al-Husary, langzaam voorzeggend (voor kinderen)',
    basis:'https://everyayah.com/data/Husary_Muallim_128kbps' },
  { id:'husary',        lezing:'Hafs',  naam:'Al-Husary, mujawwad',
    basis:'https://everyayah.com/data/Husary_128kbps_Mujawwad' },
  { id:'minshawi-leraar', lezing:'Hafs', naam:'Al-Minshawi, langzaam voorzeggend',
    basis:'https://everyayah.com/data/Minshawy_Teacher_128kbps' },
  { id:'alafasy',       lezing:'Hafs',  naam:'Mishary al-Afasy',
    basis:'https://everyayah.com/data/Alafasy_128kbps' },
];

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
const vlag = naam => process.argv.includes('--' + naam);

if (vlag('lijst')) {
  console.log('\nBeschikbare bronnen (--bron=<naam>):\n');
  for (const b of BRONNEN) console.log('  ' + b.id.padEnd(16) + b.lezing.padEnd(7) + b.naam);
  console.log('\nOf een eigen archief: --basis="https://…/map"\n');
  process.exit(0);
}

const nr = (s, a) => String(s).padStart(3, '0') + String(a).padStart(3, '0');
const bestaat = async f => { try { await access(f); return true; } catch (e) { return false; } };

async function haal(url, kort) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), kort ? 12000 : 45000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const goed = buf.length > 2000 && (buf.slice(0, 3).toString() === 'ID3' || buf[0] === 0xff);
    if (!goed) throw new Error('geen bruikbaar mp3-bestand (' + buf.length + ' bytes)');
    return buf;
  } finally { clearTimeout(t); }
}

/* Welke bron gebruiken we? Eén proefbestand zegt genoeg. */
async function kiesBron() {
  const eigen = arg('basis', '');
  if (eigen) return { id:'eigen', lezing:'onbekend', naam:'eigen opgave', basis: eigen.replace(/\/$/, '') };
  const gevraagd = arg('bron', '');
  const rij = gevraagd ? BRONNEN.filter(b => b.id === gevraagd) : BRONNEN;
  if (gevraagd && !rij.length) { console.error('Onbekende bron. Bekijk ze met --lijst.'); process.exit(1); }
  for (const b of rij) {
    process.stdout.write('Proberen: ' + b.naam + ' (' + b.lezing + ') … ');
    try { await haal(b.basis + '/112001.mp3', true); console.log('werkt.'); return b; }
    catch (e) { console.log('nee (' + e.message + ')'); }
  }
  return null;
}

const bron = await kiesBron();
if (!bron) {
  console.error('\nGeen enkele bron reageerde. Zit je achter een filter of firewall?\n' +
    'Probeer het anders met een eigen archief: --basis="https://…/map"\n');
  process.exit(1);
}
console.log('\nGekozen: ' + bron.naam + ' — lezing ' + bron.lezing + '\n');

await mkdir(DOEL, { recursive: true });
const opnieuw = vlag('opnieuw');
const gelukt = [], mislukt = [];

for (const t of TEKSTEN) {
  process.stdout.write(t.id.padEnd(12));
  for (let regel = 1; regel <= t.regels; regel++) {
    const naam = t.id + '-' + regel + '.mp3';
    const pad = join(DOEL, naam);
    if (!opnieuw && await bestaat(pad)) { gelukt.push('q:' + t.id + ':' + regel); process.stdout.write('='); continue; }
    /* Al-Fatiha: de basmala is in de gebruikelijke telling aya 1. Klopt dat in
       dit archief niet, dan merk je dat aan het eerste fragment; draai dan met
       --fatiha=madani (zie LEESMIJ.md). */
    const aya = (t.id === 'h-fatiha' && arg('fatiha','kufi') === 'madani')
      ? (regel === 1 ? 1 : regel - 1) : regel;
    try {
      await writeFile(pad, await haal(bron.basis + '/' + nr(t.soera, aya) + '.mp3'));
      gelukt.push('q:' + t.id + ':' + regel);
      process.stdout.write('.');
    } catch (e) {
      mislukt.push(naam + '  (' + e.message + ')');
      process.stdout.write('x');
    }
  }
  process.stdout.write('\n');
}

for (const t of TEKSTEN) {
  try {
    await haal(bron.basis + '/' + nr(t.soera, t.regels + 1) + '.mp3', true);
    console.warn('Let op: ' + t.id + ' heeft in dit archief meer aya\'s dan de ' + t.regels +
      ' regels in de app. Controleer de indeling van die soera.');
  } catch (e) { /* niets gevonden is precies goed */ }
}

/* De valkuil met al-Fatiha: kiest iemand de Medinensische telling terwijl het
   archief de Kufische aanhoudt, dan krijgen regel 1 en regel 2 hetzelfde
   fragment. Dat is met een vergelijking van twee bestanden hard vast te stellen,
   dus dat doen we hier in plaats van het aan het gehoor over te laten. */
try {
  const a = await readFile(join(DOEL, 'h-fatiha-1.mp3'));
  const b = await readFile(join(DOEL, 'h-fatiha-2.mp3'));
  if (a.equals(b)) {
    console.error('\n⚠  De eerste twee regels van al-Fatiha zijn hetzelfde fragment geworden.\n' +
      '   Dit archief houdt de andere telling aan dan je hebt opgegeven.\n' +
      '   Draai opnieuw ' + (arg('fatiha','kufi') === 'madani'
        ? 'zonder --fatiha=madani:  node noer/audio/haal-recitatie.mjs --opnieuw'
        : 'met --fatiha=madani:     node noer/audio/haal-recitatie.mjs --fatiha=madani --opnieuw') + '\n');
  }
} catch (e) { /* een van de twee ontbreekt; dat is elders al gemeld */ }

await writeFile(join(DOEL, 'lijst.json'), JSON.stringify({
  bron: bron.naam, lezing: bron.lezing, adres: bron.basis,
  gemaakt: new Date().toISOString().slice(0, 10), fragmenten: gelukt
}, null, 1));

console.log('\nKlaar. ' + gelukt.length + ' fragmenten, ' + mislukt.length + ' mislukt.');
if (mislukt.length) console.log('Mislukt:\n  ' + mislukt.join('\n  '));
console.log('\nLuister naar audio/quran/h-fatiha-1.mp3. Hoor je "bismillahi r-rahmani r-rahim"?');
console.log('Zo niet: draai opnieuw met --fatiha=madani --opnieuw');
console.log('Daarna: git add noer/audio/quran && git commit -m "Recitatie erbij"');
