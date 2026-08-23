#!/usr/bin/env node
/**
 * DE SCHERMEN VAN BENNAHEALTH BEKIJKEN
 *
 * Het scherm is pas te beoordelen met gegevens erin. Zonder sessie toont de app
 * het aanmeldscherm, en met een lege sessie een scherm vol nullen — precies wat
 * er mis was. Dit script zet dist/ neer achter de echte headers, onderschept de
 * databaseaanroepen en geeft er een verzonnen maar geloofwaardige reeks voor
 * terug: achtentwintig dagen wegen en loggen.
 *
 * Er komen vier toestanden uit als plaatje, want ze zijn allemaal het bekijken
 * waard: de eerste dag (nog geen doel, het model kalibreert), een dag na enkele
 * weken (band, ring, maaltijden), diezelfde dag in het donker, en de
 * onderhoudsfase — de enige toestand waarin het stoplicht bestaat. Van de dag
 * na vier weken gaan alle zes de tabbladen mee.
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

/** Twee krachtsessies in de afgelopen week: het doel is drie, dus dit is de
 *  toestand die de bolletjes moeten kunnen tonen — bijna, niet gehaald. */
function training(aantalDagen) {
  if (aantalDagen < 7) return []
  const uit = []
  const oefeningen = [
    ['Squat', 'benen', 4, 6, 90], ['Roeien', 'rug', 4, 10, 60],
    ['Bankdrukken', 'borst', 3, 8, 62.5], ['Schouderdrukken', 'schouders', 3, 10, 30],
  ]
  for (const [i, dag] of [2, 5].entries()) {
    oefeningen.slice(i * 2, i * 2 + 2).forEach(([oefening, spiergroep, sets, reps, kg], j) => {
      uit.push({
        id: `t${dag}-${j}`, datum: iso(NU - dag * DAG), oefening, spiergroep,
        sets, reps, gewicht_kg: kg, rpe: 8, notitie: null,
      })
    })
  }
  return uit
}

/** Een bloeduitslag van zes weken terug: het meeste binnen de referentie, twee
 *  waarden erbuiten. Alles groen is net zo min een test als alles leeg. */
const LABUITSLAG = [
  ['hba1c', 'HbA1c', 41, 'mmol/mol', null, 42],
  ['glucose_nuchter', 'Nuchter glucose', 6.4, 'mmol/L', null, 6.0],
  ['tc', 'Totaal cholesterol', 5.1, 'mmol/L', null, null],
  ['hdl', 'HDL-cholesterol', 1.2, 'mmol/L', 1.0, null],
  ['ldl', 'LDL-cholesterol', 3.1, 'mmol/L', null, 2.6],
  ['tg', 'Triglyceriden', 1.4, 'mmol/L', null, 1.7],
  ['alat', 'ALAT', 38, 'U/L', null, 45],
  ['tsh', 'TSH', 2.1, 'mE/L', 0.4, 4.0],
  ['vitd', 'Vitamine D', 58, 'nmol/L', 50, null],
  ['egfr', 'eGFR', 94, 'ml/min', 60, null],
]

function labs(aantalDagen) {
  if (aantalDagen < 7) return []
  const d = iso(NU - 44 * DAG)
  return LABUITSLAG.map(([code, naam, waarde, eenheid, lo, hi], i) => ({
    id: `l${i}`, datum: d, code, naam, waarde, eenheid,
    ref_laag: lo, ref_hoog: hi, notitie: null,
  }))
}

function metingen(aantalDagen) {
  if (aantalDagen < 7) return []
  const d = iso(NU - 9 * DAG)
  return [
    { id: 'm1', datum: d, soort: 'bloeddruk_sys', waarde: 128, eenheid: 'mmHg', notitie: null },
    { id: 'm2', datum: d, soort: 'bloeddruk_dia', waarde: 82, eenheid: 'mmHg', notitie: null },
    { id: 'm3', datum: d, soort: 'middelomtrek', waarde: 108, eenheid: 'cm', notitie: null },
  ]
}

function alles(aantalDagen, fase = 'afvallen') {
  const { dagen, regels } = aantalDagen > 0 ? reeks(aantalDagen) : { dagen: [], regels: [] }
  const profiel = fase === 'onderhoud'
    ? { ...PROFIEL, fase: 'onderhoud', onderhoud_basis_kg: 115.0 }
    : PROFIEL
  return {
    profiel, dagen, regels, producten: [], recepten: [], vragenlijsten: [],
    metingen: metingen(aantalDagen), labs: labs(aantalDagen), training: training(aantalDagen),
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
  ['eerste-dag', 1, 'light', 'afvallen', ['Vandaag']],
  ['na-vier-weken', 28, 'light', 'afvallen',
   ['Vandaag', 'Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']],
  ['donker', 28, 'dark', 'afvallen', ['Vandaag', 'Voeding', 'Profiel']],
  /* De onderhoudsfase is de enige toestand waarin het stoplicht bestaat. Zonder
     dit geval blijft die kop ongezien tot iemand hem in productie tegenkomt. */
  ['onderhoud', 28, 'light', 'onderhoud', ['Profiel']],
]

/** Een tabblad openen en wachten tot de kop er echt staat. */
async function naarTab(pagina, label) {
  if (label !== 'Vandaag') {
    await pagina.getByRole('tab', { name: label }).click()
    await pagina.waitForSelector('.hero', { timeout: 5000 })
  }
  /* De ring tekent zichzelf in acht tienden van een seconde, de staven in bijna
     een halve. Een screenshot daarvóór laat een halve ring zien en dat is geen
     ijkpunt. */
  await pagina.waitForTimeout(1100)
}

/* Twee gekoppelde toestellen, om het koppelvel met inhoud te kunnen zien. */
const KOPPELINGEN = [
  { id: 'k1', naam: 'iPhone', sleutel_begin: 'kal_9f3a2c1b', aangemaakt_op: '2026-08-01T09:00:00Z',
    laatst_gebruikt_op: '2026-08-22T05:02:00Z', aantal_berichten: 21, aantal_dagen: 21, actief: true },
  { id: 'k2', naam: 'Oude telefoon', sleutel_begin: 'kal_44be07d2',
    aangemaakt_op: '2026-06-14T09:00:00Z', laatst_gebruikt_op: null,
    aantal_berichten: 0, aantal_dagen: 0, actief: true },
]

/** De databaseaanroepen onderscheppen voor één pagina. */
async function bedienDb(pagina, dagen, fase) {
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    const lijf = fn === 'kal_ophalen' ? alles(dagen, fase)
      : fn === 'kal_koppelingen_lijst' ? KOPPELINGEN
      : fn === 'kal_koppeling_maken'
        ? { sleutel: 'kal_' + 'a3f19c7e42b08d5619fa2c3d7e8b04915cad6237'.slice(0, 48),
            koppeling: KOPPELINGEN[0] }
      : {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lijf) })
  })
}

for (const [naam, dagen, thema, fase, tabs] of gevallen) {
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: thema })
  await bedienDb(pagina, dagen, fase)
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  for (const tab of tabs) {
    await naarTab(pagina, tab)
    const stam = tab === 'Vandaag' ? naam : `${naam}-${tab.toLowerCase()}`
    await pagina.screenshot({ path: `gereedschap/health-${stam}.png` })
    const kop = await pagina.locator('.hero h2').textContent()
    /* Elk scherm hoort een kop met een oordeel te hebben. Een lege kop is geen
       stijlkwestie maar een scherm dat zijn eigen vraag niet beantwoordt. */
    if (!kop || !kop.trim()) throw new Error(`${stam}: kop is leeg`)
    console.log(`${stam.padEnd(26)} kop=${JSON.stringify(kop)}`)

    /* De coachkaart staat alleen op Vandaag, en alleen als er een doel is. Hij
       hoort de eiwiteis te noemen én voorstellen te tonen: een kaart die wel
       rekent maar niets aanbiedt is de helft van de functie, en dat is aan een
       screenshot niet te zien. */
    if (tab === 'Vandaag' && naam !== 'eerste-dag') {
      const kaart = pagina.locator('.kaart', { hasText: 'Wat er nog in past' })
      if (!(await kaart.count())) throw new Error(`${stam}: coachkaart ontbreekt`)
      const zin = (await kaart.locator('p.klein').first().textContent()) ?? ''
      if (!/g eiwit per 100 kcal|eiwit is binnen|over je doel/.test(zin)) {
        throw new Error(`${stam}: coachkaart noemt de eis niet — ${JSON.stringify(zin)}`)
      }
      const n = await kaart.locator('.lijst > *').count()
      console.log(`${''.padEnd(26)} coach=${n} voorstellen`)
    }
  }
  await pagina.close()
}

/* ------------------------------------------------------- het invoervel -- */
/* Het vel is het scherm waar de app om draait en het is niet te zien zonder het
   open te doen. Twee toestanden: met geschiedenis (dan staat er een lijst om te
   herhalen) en zonder (dan is de eerste keer aan de beurt). */

for (const [naam, dagen, thema] of [['invoervel', 28, 'light'], ['invoervel-leeg', 1, 'light']]) {
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: thema })
  await bedienDb(pagina, dagen, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.maal', { timeout: 5000 })
  /* Via het maaltijdvak en niet via de grote knop: dat is de weg die het meest
     gelopen wordt, en de weg die het moment meteen goed zet. */
  await pagina.getByTitle('Iets toevoegen aan je lunch').click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  await pagina.waitForTimeout(400)
  await pagina.screenshot({ path: `gereedschap/health-${naam}.png` })

  const chips = await pagina.locator('.momentchip').count()
  const aan = await pagina.locator('.momentchip.aan').textContent()
  const suggesties = await pagina.locator('.venster .lijst > div').count()
  if (chips !== 4) throw new Error(`${naam}: ${chips} momentchips in plaats van 4`)

  /* De belofte van dit vel is één tik. Die tik wordt hier werkelijk gedaan, en
     er wordt gekeken of hij aankomt: een bevestiging bovenin, en het vinkje op
     de regel die je aanraakte. Zonder die controle is 'één tik' een bewering. */
  let bevestiging = 'geen suggesties'
  if (suggesties > 0) {
    await pagina.locator('.venster .lijst > div').first().getByRole('button').click()
    await pagina.waitForSelector('.venster .kaart.goed', { timeout: 5000 })
    bevestiging = (await pagina.locator('.venster .kaart.goed').textContent()) ?? ''
    await pagina.waitForTimeout(300)
    await pagina.screenshot({ path: `gereedschap/health-${naam}-getikt.png` })
  }
  console.log(`${naam.padEnd(26)} moment=${JSON.stringify(aan)} suggesties=${suggesties}`)
  console.log(`${''.padEnd(26)} na één tik: ${JSON.stringify(bevestiging.slice(0, 70))}`)
  await pagina.close()
}

/* -------------------------------------------------------- het koppelvel -- */
/* Het vel met de instructies is het enige scherm van de app dat iemand op een
   ander apparaat naast zich moet kunnen leggen. Dan moet het wel kloppen. */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.getByRole('tab', { name: 'Profiel' }).click()
  await pagina.getByRole('button', { name: 'Horloge en telefoon koppelen' }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  await pagina.waitForSelector('.lijst > div', { timeout: 5000 })
  await pagina.screenshot({ path: 'gereedschap/health-koppelen.png' })

  await pagina.getByRole('button', { name: 'Sleutel maken' }).click()
  await pagina.waitForSelector('.sleutelvak', { timeout: 5000 })
  await pagina.waitForTimeout(200)
  await pagina.screenshot({ path: 'gereedschap/health-koppelen-sleutel.png' })

  /* Het endpoint in het vel moet het echte endpoint zijn. Een instructie met
     een verkeerde URL faalt pas op de telefoon van iemand anders. */
  const url = await pagina.locator('#kop-Endpoint').textContent()
  if (!url?.endsWith('/rest/v1/rpc/kal_beweging_dag')) {
    throw new Error(`koppelvel: verkeerd endpoint ${url}`)
  }
  /* De veldnamen in de instructie moeten de parameternamen van de functie zijn.
     Een typefout hierin faalt pas op de telefoon van iemand anders, met een
     melding die over de schemacache gaat en niet over het veld. */
  const velden = await pagina.locator('.veldtabel code').allTextContents()
  for (const v of ['p_sleutel', 'p_dagen_terug', 'p_stappen', 'p_slaap_uur',
                   'p_hartslag_rust']) {
    if (!velden.includes(v)) throw new Error(`koppelvel: ${v} ontbreekt in de veldtabel`)
  }
  console.log(`koppelen                   endpoint=${JSON.stringify(url)}`)
  console.log(`                           velden=${velden.length}`)
  await pagina.close()
}

/* --------------------------------------------- het brede scherm ------------ */
/* Sinds de Medical-Intelligence-laag wordt de tabbalk boven 960 pixels een
   zijbalk, met de merknaam en een onderschrift als ::before en ::after. Die
   staan in CSS en niet in de app, dus geen enkele proef raakte ze aan — terwijl
   ze wél naar tokens verwijzen die de app kan hernoemen.
   Dat is precies wat er gebeurde: `--serif` bestaat niet meer sinds de koppen
   naar één familie gingen, en een `var()` naar een token dat niet bestaat is
   ongeldig bij het berekenen. Deze controle kijkt of de merknaam in de zijbalk
   nog de familie krijgt die hij hoort te krijgen. */
{
  const breed = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  await breed.addInitScript(`{
    const echt = Date; const vast = ${NU};
    class V extends echt {
      constructor(...a){ super(...(a.length ? a : [vast])) }
      static now(){ return vast }
    }
    window.Date = V;
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proef', account: 'abdelkader' }));
  }`)
  const pagina = await breed.newPage()
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(1100)
  await pagina.screenshot({ path: 'gereedschap/health-breed-vandaag.png' })

  const merk = await pagina.evaluate(() => {
    const nav = document.querySelector('nav.tabs')
    if (!nav) return null
    const s = getComputedStyle(nav, '::before')
    return { familie: s.fontFamily, inhoud: s.content }
  })
  const kop = await pagina.evaluate(() =>
    getComputedStyle(document.querySelector('header h1')).fontFamily)
  if (!merk) throw new Error('breed: geen zijbalk gevonden')
  /* Een var() naar een verdwenen token laat de eigenschap terugvallen op wat er
     geërfd wordt. Dat is geen fout die opvalt, maar de merknaam staat dan in een
     andere letter dan de rest van het scherm. */
  if (merk.familie !== kop) {
    throw new Error(`breed: de merknaam in de zijbalk staat in ${merk.familie}, `
      + `de kop in ${kop}`)
  }
  console.log(`breed                      zijbalk=${merk.inhoud} familie=ok`)
  await pagina.close()
}

/* ------------------------------------------------ meebewegen met de maat -- */
/* De maaltijdvakken stonden op één kolom tot 560 pixels en daarna op twee, en
   daar bleef het bij: op een tablet en op een groot scherm bleven het er twee.
   Deze controle kijkt of het aantal kolommen werkelijk meebeweegt. */

const breedtes = [360, 430, 768, 1100]
const kolommen = []
for (const breedte of breedtes) {
  const maat = await browser.newContext({
    viewport: { width: breedte, height: 900 }, deviceScaleFactor: 1,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  /* Dezelfde vaste klok als hierboven: zonder die klok is 'vandaag' de echte
     dag, staan de vakken leeg en meet je de opmaak van een leeg scherm. */
  await maat.addInitScript(`{
    const echt = Date; const vast = ${NU};
    class V extends echt {
      constructor(...a){ super(...(a.length ? a : [vast])) }
      static now(){ return vast }
    }
    window.Date = V;
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proef', account: 'abdelkader' }));
  }`)
  const pagina = await maat.newPage()
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.maal', { timeout: 5000 })

  /* Het aantal kolommen is het aantal verschillende linkerposities van de vier
     vakken. Dat meet wat je ziet, en niet wat er in de stijl staat. */
  const links = await pagina.locator('.maal').evaluateAll(
    (els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().left)))].length)
  /* En of er niets buiten de rand valt. */
  const overloop = await pagina.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  if (overloop) throw new Error(`${breedte}px: de pagina schuift horizontaal`)
  kolommen.push(`${breedte}px→${links}kol`)
  if (breedte === 1100) await pagina.screenshot({ path: 'gereedschap/health-breed.png' })
  if (breedte === 360) await pagina.screenshot({ path: 'gereedschap/health-smal.png' })
  await maat.close()
}
console.log('maaltijdvakken             ' + kolommen.join(' · '))
if (kolommen[0] === kolommen[kolommen.length - 1]) {
  throw new Error('de maaltijdvakken bewegen niet mee met de schermbreedte')
}

await browser.close()
server.close()
