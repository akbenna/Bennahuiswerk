#!/usr/bin/env node
/**
 * HET STARTSCHERM VAN BENNAHEALTH BEKIJKEN
 *
 * Het scherm is pas te beoordelen met gegevens erin. Zonder sessie toont de app
 * het aanmeldscherm, en met een lege sessie een scherm vol nullen — precies wat
 * er mis was. Dit script zet dist/ neer achter de echte headers, onderschept de
 * databaseaanroepen en geeft er een verzonnen maar geloofwaardige reeks voor
 * terug: achtentwintig dagen wegen en loggen.
 *
 * Twee toestanden komen eruit als plaatje, want ze zijn allebei het bekijken
 * waard: de eerste dag (nog geen doel, het model kalibreert) en een dag na
 * enkele weken (band, ring, maaltijden).
 *
 *   node gereedschap/health-voorbeeld.mjs
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { existsSync, statSync } from 'node:fs'
import { chromium } from 'playwright'

const vercel = JSON.parse(await readFile('vercel.json', 'utf8'))
const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.map': 'application/json',
}
function headersVoor(pad) {
  const uit = {}
  for (const regel of vercel.headers) {
    const patroon = new RegExp('^' + regel.source.replace('(.*)', '.*') + '$')
    if (patroon.test(pad)) for (const h of regel.headers) uit[h.key] = h.value
  }
  return uit
}
const server = createServer(async (verzoek, antwoord) => {
  let pad = decodeURIComponent(new URL(verzoek.url, 'http://x').pathname)
  let bestand = join('dist', normalize(pad).replace(/^(\.\.[/\\])+/, ''))
  if (existsSync(bestand) && statSync(bestand).isDirectory()) bestand = join(bestand, 'index.html')
  if (!existsSync(bestand)) { antwoord.writeHead(404).end('weg'); return }
  const uit = headersVoor(pad)
  uit['Content-Type'] = TYPEN[extname(bestand)] ?? 'application/octet-stream'
  antwoord.writeHead(200, uit).end(await readFile(bestand))
})
await new Promise((k) => server.listen(0, k))
const poort = server.address().port

/* ---------------------------------------------------------- de gegevens -- */

const DAG = 86400000
const iso = (d) => new Date(d).toISOString().slice(0, 10)
const NU = Date.parse('2026-08-22T09:00:00Z')

/** Een geloofwaardige reeks: 119 kg zakkend naar 116, met ruis. */
function reeks(aantalDagen) {
  const dagen = []
  const regels = []
  for (let i = aantalDagen - 1; i >= 0; i--) {
    const d = iso(NU - i * DAG)
    const t = (aantalDagen - 1 - i) / Math.max(1, aantalDagen - 1)
    const ruis = Math.sin(i * 2.7) * 0.45 + Math.cos(i * 1.3) * 0.3
    dagen.push({
      datum: d, gewicht_kg: Math.round((119.4 - t * 3.1 + ruis) * 10) / 10,
      gewicht_bron: 'handmatig', stappen: 4200 + Math.round(Math.abs(Math.sin(i)) * 5200),
      actieve_energie_kcal: null, fiets_min: null,
      slaap_min: 420 + Math.round(Math.sin(i * 0.9) * 45), slaap_kwaliteit: null,
      bedtijd: null, waaktijd: null, kracht: i % 3 === 0, notitie: null, bron: 'handmatig',
    })
    const menu = [
      ['ontbijt', 'Havermout met melk en banaan', 410, 18, 62, 9, 'A'],
      ['ontbijt', 'Cappuccino', 90, 5, 8, 4, 'B'],
      ['lunch', 'Twee bruine boterhammen met kaas 30+', 430, 24, 44, 16, 'B'],
      ['lunch', 'Handje ongezouten amandelen', 180, 6, 5, 15, 'C'],
      ['diner', 'Tajine met kip, olijven en couscous', 720, 46, 71, 24, 'B'],
      ['diner', 'Griekse yoghurt met honing', 210, 14, 22, 7, 'A'],
      ['tussendoor', 'Appel', 95, 1, 22, 0, 'A'],
    ]
    /* De laatste dag krijgt alleen ontbijt en lunch: een halve dag is de
       gewone toestand als je 's middags kijkt. */
    const tot = i === 0 ? 4 : menu.length
    menu.slice(0, tot).forEach(([moment, naam, kcal, eiwit, koolh, vet, conf], j) => {
      regels.push({
        id: `${d}-${j}`, datum: d, moment, naam,
        hoeveelheid: null, eenheid: null, gram_equivalent: null,
        kcal_punt: kcal, kcal_laag: Math.round(kcal * 0.86), kcal_hoog: Math.round(kcal * 1.16),
        eiwit_g: eiwit, vet_g: vet, koolhydraat_g: koolh, vezel_g: null,
        conf, onzekerheidsbronnen: conf === 'C' ? ['portie geschat'] : null,
        bron: 'tekst-ai', nevo_code: conf === 'A' ? '1017' : null,
        dish_id: null, recept_id: null, foto_pad: null, ruwe_invoer: null, ai_model: null,
      })
    })
  }
  return { dagen, regels }
}

const PROFIEL = {
  lengte_cm: 196, geboortedatum: '1985-03-04', leeftijd_jaar: 41, geslacht: 'm',
  start_gewicht_kg: 122, doel_gewicht_kg: 100, tempo_pct_week: 0.6,
  eiwit_g_per_kg: 1.4, etniciteit: null, fase: 'afvallen',
  onderhoud_basis_kg: null, instellingen: {},
}

function alles(aantalDagen) {
  const { dagen, regels } = aantalDagen > 0 ? reeks(aantalDagen) : { dagen: [], regels: [] }
  return {
    profiel: PROFIEL, dagen, regels,
    producten: [], recepten: [], metingen: [], labs: [], vragenlijsten: [], training: [],
  }
}

/* ------------------------------------------------------------- de foto's -- */

const browser = await chromium.launch({ executablePath: process.env.CHROOM || undefined })
const ctx = await browser.newContext({
  viewport: { width: 430, height: 1180 }, deviceScaleFactor: 2,
  locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
})
/* De klok vastzetten: een screenshot die morgen anders is, is geen ijkpunt. */
await ctx.addInitScript(`{
  const echt = Date;
  const vast = ${NU};
  class V extends echt {
    constructor(...a){ super(...(a.length ? a : [vast])) }
    static now(){ return vast }
  }
  window.Date = V;
  localStorage.setItem('kalibratie.sessie', JSON.stringify({ token: 'proef', account: 'abdelkader' }));
}`)

/* Ook het donkere thema, want het heroverloop gaat als inline stijl naar
   binnen en luistert dus niet naar een media query. Dat moet je zién. */
const gevallen = [
  ['eerste-dag', 1, 'light'],
  ['na-vier-weken', 28, 'light'],
  ['donker', 28, 'dark'],
]

for (const [naam, dagen, thema] of gevallen) {
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: thema })
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    const lijf = fn === 'kal_ophalen' ? alles(dagen) : {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lijf) })
  })
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  /* De ring tekent zichzelf in acht tienden van een seconde. Een screenshot
     daarvóór laat een halve ring zien en dat is geen ijkpunt. */
  await pagina.waitForTimeout(1100)
  await pagina.screenshot({ path: `gereedschap/health-${naam}.png` })
  const kop = await pagina.locator('.hero h2').textContent()
  const ring = await pagina.locator('.hero .getal').first().textContent()
  const vakken = await pagina.locator('.maal').count()
  console.log(`${naam.padEnd(16)} kop=${JSON.stringify(kop)} ring=${ring} maaltijdvakken=${vakken}`)
  await pagina.close()
}

await browser.close()
server.close()
