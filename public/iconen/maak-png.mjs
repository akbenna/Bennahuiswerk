#!/usr/bin/env node
/* =============================================================================
   Maakt van elke SVG in deze map een PNG van 180 bij 180.

   iOS zet geen SVG op het beginscherm. Zonder PNG krijgt een toegevoegde app
   daar een grijze rechthoek met een schermafdruk erin, en dan is het hele punt
   van eigen pictogrammen weg.

   Draaien:  node iconen/maak-png.mjs

   Er is een browser voor nodig; Playwright zit in deze omgeving al. Verander je
   een SVG, draai dit dan opnieuw en commit beide bestanden samen — anders wijst
   de telefoon nog naar het oude plaatje en de browser al naar het nieuwe.
============================================================================= */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HIER = dirname(fileURLToPath(import.meta.url));
const MAAT = 180;

/* Playwright staat globaal geïnstalleerd en niet naast dit bestand, dus zoeken
   we hem op via de gewone modulepaden plus de map van npm zelf. */
const eis = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try { ({ chromium } = eis(p)); break; } catch (e) { /* volgende proberen */ }
}
if (!chromium) {
  console.error('Playwright niet gevonden. Installeer het met: npm i -g playwright');
  process.exit(1);
}

const svgs = (await readdir(HIER)).filter(f => f.endsWith('.svg')).sort();
if (!svgs.length) { console.error('Geen SVG gevonden in ' + HIER); process.exit(1); }

const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: MAAT, height: MAAT }, deviceScaleFactor: 1 });

for (const naam of svgs) {
  const bron = await readFile(join(HIER, naam), 'utf8');
  /* De achtergrond doorzichtig laten: het pictogram tekent zijn eigen vlak, en
     een witte rand eromheen valt op een donker beginscherm meteen op. */
  await pagina.setContent(
    '<style>html,body{margin:0;padding:0;background:transparent}' +
    'svg{display:block;width:' + MAAT + 'px;height:' + MAAT + 'px}</style>' + bron);
  await pagina.screenshot({ path: join(HIER, naam.replace(/\.svg$/, '-180.png')), omitBackground: true });
  process.stdout.write('.');
}

await browser.close();
console.log('\n' + svgs.length + ' pictogrammen omgezet naar PNG van ' + MAAT + '×' + MAAT + '.');
