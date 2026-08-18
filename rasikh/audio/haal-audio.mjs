#!/usr/bin/env node
/* =============================================================================
   Haalt recitatie per aya op voor Rasikh.

   Zonder opties pakt het script het gebied waar je waarschijnlijk begint,
   juz 'amma — soera 78 tot en met 114:

     node rasikh/audio/haal-audio.mjs

   Een ander stuk:            --soera=67-114      --soera=2      --soera=alles
   Een bepaalde reciteerder:  --bron=warsh-dosary
   De bronnen zien:           --lijst
   Een eigen archief:         --basis="https://…/map"
   Opnieuw ophalen:           --opnieuw

   Een aya is ongeveer 100 kB. Juz 'amma is zo'n 60 MB, de hele Koran een halve
   gigabyte en ruim zesduizend bestanden. Voor meer dan vijfhonderd fragmenten
   vraagt het script eerst om --ja, zodat je niet per ongeluk je hele schijf
   volzet en een uur zit te wachten.

   Rasikh valt vanzelf terug op de achtenvijftig fragmenten die al in
   noer/audio/quran staan. Wat je hier ophaalt gaat daarvóór.
============================================================================= */
import { writeFile, mkdir, access, readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const TEKST = join(HIER, '..', 'tekst');

/* Dezelfde volgorde als in Noer: Warsh eerst, want dat is de lezing van de
   Maghreb. Lukt geen van de Warsh-bronnen, dan een Hafs-lezing, en dan staat
   het er ook bij — je wilt niet ongemerkt in een andere lezing memoriseren. */
const BRONNEN = [
  { id:'warsh-dosary',  lezing:'Warsh', naam:'Ibrahim al-Dosary',
    basis:'https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps' },
  { id:'warsh-jazaery', lezing:'Warsh', naam:'Yassin al-Jazaery',
    basis:'https://everyayah.com/data/warsh/warsh_yassin_al_jazaery_128kbps' },
  { id:'warsh-basit',   lezing:'Warsh', naam:'Abdul Basit',
    basis:'https://everyayah.com/data/warsh/warsh_abdulbasit_128kbps' },
  { id:'husary',        lezing:'Hafs',  naam:'Al-Husary, mujawwad',
    basis:'https://everyayah.com/data/Husary_128kbps_Mujawwad' },
  { id:'husary-leraar', lezing:'Hafs',  naam:'Al-Husary, langzaam voorzeggend',
    basis:'https://everyayah.com/data/Husary_Muallim_128kbps' },
  { id:'minshawi',      lezing:'Hafs',  naam:'Al-Minshawi, mujawwad',
    basis:'https://everyayah.com/data/Minshawy_Mujawwad_192kbps' },
  { id:'alafasy',       lezing:'Hafs',  naam:'Mishary al-Afasy',
    basis:'https://everyayah.com/data/Alafasy_128kbps' },
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

/* --------------------------- wat gaan we ophalen? --------------------------- */
let INDEX;
try {
  INDEX = JSON.parse(await readFile(join(TEKST, 'index.json'), 'utf8')).soera;
} catch (e) {
  console.error('rasikh/tekst/index.json is niet te lezen. Draai dit script vanuit de map van het project.');
  process.exit(1);
}

const gevraagd = arg('soera', '78-114');
let van, tot;
if (gevraagd === 'alles') { van = 1; tot = 114; }
else if (/^\d+$/.test(gevraagd)) { van = tot = +gevraagd; }
else {
  const m = gevraagd.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) { console.error('Onbegrijpelijke opgave bij --soera. Gebruik 78-114, of 2, of alles.'); process.exit(1); }
  van = Math.min(+m[1], +m[2]); tot = Math.max(+m[1], +m[2]);
}
if (van < 1 || tot > 114) { console.error('Soera\'s lopen van 1 tot en met 114.'); process.exit(1); }

const rij = INDEX.filter(s => s.nr >= van && s.nr <= tot);
const totaal = rij.reduce((n, s) => n + s.aya, 0);

const DOEL = HIER;
await mkdir(DOEL, { recursive: true });
const bestaat = async f => { try { await access(f); return true; } catch (e) { return false; } };
const opnieuw = vlag('opnieuw');

/* Tellen wat er al staat, zodat de waarschuwing over het echte werk gaat. */
let alAanwezig = 0;
if (!opnieuw) {
  for (const s of rij) for (let a = 1; a <= s.aya; a++)
    if (await bestaat(join(DOEL, s.nr + '-' + a + '.mp3'))) alAanwezig++;
}
const teDoen = totaal - alAanwezig;

console.log('\nSoera ' + van + ' tot en met ' + tot + ' — ' + totaal + ' aya' +
  (alAanwezig ? ', waarvan ' + alAanwezig + ' al opgehaald' : '') + '.');
console.log('Nog te halen: ' + teDoen + ' fragmenten, ruwweg ' +
  (teDoen < 1000 ? Math.round(teDoen / 10) + ' MB' : Math.round(teDoen / 100) / 10 + ' GB') + '.\n');

if (teDoen === 0) { console.log('Er valt niets te halen. Klaar.'); process.exit(0); }
if (teDoen > 500 && !vlag('ja')) {
  console.log('Dat is veel. Weet je het zeker, zet er dan --ja achter:\n');
  console.log('  node rasikh/audio/haal-audio.mjs --soera=' + gevraagd + ' --ja\n');
  console.log('Of begin klein: --soera=112-114 is in een halve minuut binnen.\n');
  process.exit(0);
}

/* ------------------------------------ halen ------------------------------------ */
const nr = (s, a) => String(s).padStart(3, '0') + String(a).padStart(3, '0');

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

async function kiesBron() {
  const eigen = arg('basis', '');
  if (eigen) return { id:'eigen', lezing:'onbekend', naam:'eigen opgave', basis: eigen.replace(/\/$/, '') };
  const g = arg('bron', '');
  const kandidaten = g ? BRONNEN.filter(b => b.id === g) : BRONNEN;
  if (g && !kandidaten.length) { console.error('Onbekende bron. Bekijk ze met --lijst.'); process.exit(1); }
  for (const b of kandidaten) {
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

/* Vier tegelijk. Sneller dan dit is niet netjes tegenover een gratis archief. */
const TEGELIJK = 4;
let klaar = 0, gehaald = 0, overgeslagen = 0;
const mislukt = [];

async function werk(taken) {
  while (taken.length) {
    const t = taken.shift();
    const pad = join(DOEL, t.s + '-' + t.a + '.mp3');
    if (!opnieuw && await bestaat(pad)) { overgeslagen++; klaar++; continue; }
    try {
      await writeFile(pad, await haal(bron.basis + '/' + nr(t.s, t.a) + '.mp3'));
      gehaald++;
    } catch (e) {
      mislukt.push(t.s + ':' + t.a + '  (' + e.message + ')');
    }
    klaar++;
    if (klaar % 25 === 0 || klaar === totaal)
      process.stdout.write('\r  ' + klaar + ' van ' + totaal +
        ' · gehaald ' + gehaald + ' · mislukt ' + mislukt.length + '   ');
  }
}

const taken = [];
for (const s of rij) for (let a = 1; a <= s.aya; a++) taken.push({ s: s.nr, a });
await Promise.all(Array.from({ length: TEGELIJK }, () => werk(taken)));
process.stdout.write('\n');

/* ---------------------------------- de lijst ---------------------------------- */
/* De lijst wordt uit de map zelf opgebouwd, niet uit wat deze ronde toevallig
   ophaalde. Zo blijft wat je een vorige keer al had gewoon staan. */
const namen = (await readdir(DOEL)).filter(f => /^\d+-\d+\.mp3$/.test(f));
const fragmenten = namen.map(f => f.replace('.mp3', '').replace('-', ':'))
  .sort((x, y) => { const [a, b] = x.split(':').map(Number), [c, d] = y.split(':').map(Number);
                    return a - c || b - d; });

let oud = {};
try { oud = JSON.parse(await readFile(join(DOEL, 'lijst.json'), 'utf8')); } catch (e) {}
if (oud.bron && oud.bron !== bron.naam && oud.fragmenten?.length)
  console.warn('\n⚠  Er stond al recitatie van ' + oud.bron + ' in deze map, en die van ' +
    bron.naam + ' komt er nu bij.\n   Twee stemmen door elkaar is verwarrend bij memoriseren.\n' +
    '   Wil je alleen deze: gooi de map leeg en draai opnieuw.\n');

await writeFile(join(DOEL, 'lijst.json'), JSON.stringify({
  bron: bron.naam, lezing: bron.lezing, adres: bron.basis,
  gemaakt: new Date().toISOString().slice(0, 10), fragmenten
}, null, 1));

console.log('\nKlaar. ' + gehaald + ' opgehaald, ' + overgeslagen + ' stond er al, ' +
  mislukt.length + ' mislukt. In totaal ' + fragmenten.length + ' fragmenten in de map.');
if (mislukt.length) console.log('Mislukt:\n  ' + mislukt.slice(0, 20).join('\n  ') +
  (mislukt.length > 20 ? '\n  … en nog ' + (mislukt.length - 20) : '') +
  '\nDraai het script nog eens; wat er al staat wordt overgeslagen.');
console.log('\nLuister eerst naar ' + rij[0].nr + '-1.mp3 en kijk of het klopt met de tekst in de app.');
console.log('Daarna: git add rasikh/audio && git commit -m "Recitatie voor Rasikh"');
console.log('\nLet op: mp3\'s zijn groot. Zet je de hele Koran in git, dan wordt de map zwaar —');
console.log('overweeg dan om rasikh/audio/*.mp3 in .gitignore te zetten en lokaal te houden.\n');
