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

/* Eén bewaarde maaltijd, met de getallen die 08-de-twee-favorieten.sql echt in
   de database zet. Zo controleert de proef de schaling tegen een bekend geval:
   752 kcal voor twee porties, dus 376 voor één en 188 voor een halve. */
const MAALTIJDEN = [{
  id: 'mt1', naam: 'Tonijnsalade', porties: 2, favoriet: true,
  toelichting: 'Staat voor twee porties. Tonijn op water.',
  regels: [
    { naam: 'Tomaat', hoeveelheid: 3, eenheid: 'stuk', gram_equivalent: 360,
      kcal_punt: 79, kcal_laag: 62, kcal_hoog: 97, eiwit_g: 2.5, vet_g: 1.8,
      koolhydraat_g: 10.8, vezel_g: 4.3, conf: 'C',
      onzekerheidsbronnen: ['geschat op het oog'], bron: 'nevo', nevo_code: '2730' },
    { naam: 'Ui', hoeveelheid: 1, eenheid: 'stuk', gram_equivalent: 110,
      kcal_punt: 41, kcal_laag: 30, kcal_hoog: 56, eiwit_g: 1.4, vet_g: 0.2,
      koolhydraat_g: 6.9, vezel_g: 3.0, conf: 'C',
      onzekerheidsbronnen: null, bron: 'nevo', nevo_code: '63' },
    { naam: 'Paprika', hoeveelheid: 1, eenheid: 'stuk', gram_equivalent: 150,
      kcal_punt: 38, kcal_laag: 28, kcal_hoog: 48, eiwit_g: 1.2, vet_g: 0.2,
      koolhydraat_g: 6.5, vezel_g: 2.7, conf: 'C',
      onzekerheidsbronnen: null, bron: 'nevo', nevo_code: '884' },
    { naam: 'Tonijn uit blik, uitgelekt', hoeveelheid: 1, eenheid: 'blik', gram_equivalent: 100,
      kcal_punt: 109, kcal_laag: 104, kcal_hoog: 120, eiwit_g: 24.9, vet_g: 1.0,
      koolhydraat_g: 0, vezel_g: 0, conf: 'B',
      onzekerheidsbronnen: null, bron: 'nevo', nevo_code: '1590' },
    { naam: 'Mayonaise', hoeveelheid: 2, eenheid: 'theelepel', gram_equivalent: 12,
      kcal_punt: 80, kcal_laag: 53, kcal_hoog: 133, eiwit_g: 0.1, vet_g: 8.6,
      koolhydraat_g: 0.4, vezel_g: 0, conf: 'C',
      onzekerheidsbronnen: null, bron: 'nevo', nevo_code: '451' },
    { naam: 'Dressing honing/mosterd', hoeveelheid: 1, eenheid: 'eetlepel', gram_equivalent: 15,
      kcal_punt: 45, kcal_laag: 30, kcal_hoog: 75, eiwit_g: 0.2, vet_g: 3.9,
      koolhydraat_g: 2.3, vezel_g: 0, conf: 'C',
      onzekerheidsbronnen: null, bron: 'nevo', nevo_code: '2468' },
    { naam: 'Olijfolie', hoeveelheid: 3, eenheid: 'eetlepel', gram_equivalent: 40,
      kcal_punt: 360, kcal_laag: 270, kcal_hoog: 630, eiwit_g: 0, vet_g: 40,
      koolhydraat_g: 0, vezel_g: 0, conf: 'D',
      onzekerheidsbronnen: ['niet gewogen; 30 tot 70 gram scheelt 360 kcal in de schaal'],
      bron: 'nevo', nevo_code: '601' },
  ],
}]

/* Vier tonijnregels uit NEVO, om te kunnen zien dat de eigen maaltijd erbovenuit
   komt en niet ergens tussen de tabel verdwijnt. */
const NEVO_TONIJN = [
  { nevo_code: '1589', naam: 'Tonijn in olie blik', groep: 'Vis', kcal: 206,
    eiwit_g: 27, vet_g: 10.8, koolhydraat_g: 0.1, vezel_g: 0.1 },
  { nevo_code: '1590', naam: 'Tonijn in water blik', groep: 'Vis', kcal: 109,
    eiwit_g: 24.9, vet_g: 1, koolhydraat_g: 0, vezel_g: 0 },
  { nevo_code: '5265', naam: 'Tonijn m groente en tomatensaus in blik', groep: 'Vis', kcal: 98,
    eiwit_g: 11.7, vet_g: 3.5, koolhydraat_g: 4.8, vezel_g: 0.6 },
  { nevo_code: '1591', naam: 'Tonijn vers gebakken', groep: 'Vis', kcal: 184,
    eiwit_g: 25.9, vet_g: 8.7, koolhydraat_g: 0, vezel_g: 0 },
]

/** De databaseaanroepen onderscheppen voor één pagina. */
async function bedienDb(pagina, dagen, fase) {
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    const lijf = fn === 'kal_ophalen' ? alles(dagen, fase)
      : fn === 'kal_maaltijden' ? MAALTIJDEN
      : fn === 'kal_zoeken' ? { maaltijden: MAALTIJDEN, nevo: NEVO_TONIJN, gerechten: [], eigen: [] }
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

  /* De bewaarde maaltijd is de kortste weg die het vel kent, en de enige met
     rekenwerk erin: wat er op de tegel staat hoort mee te bewegen met de
     portiekeuze. Een tegel die bij ½ hetzelfde getal toont als bij 1 is niet
     lelijk maar onwaar, en dat is aan een screenshot niet te zien.

     Sinds de tegels ingeklapt beginnen wordt hier ook getoetst wát er ingeklapt
     te zien is. De afspraak is dat de graad en de band nooit weggaan: die twee
     zíjn de onzekerheid, samengevat. Wat mag inklappen is waar ze vandaan komen.
     Een tegel die ingeklapt alleen een naam en een getal toont, breekt de regel
     waar deze hele app op staat. */
  {
    const tegel = pagina.locator('.venster .kaart', { hasText: 'Tonijnsalade' }).first()
    if (!(await tegel.count())) throw new Error(`${naam}: de bewaarde maaltijd staat er niet`)

    const dicht = (await tegel.locator('.maalopen').getAttribute('aria-expanded')) === 'false'
    if (!dicht) throw new Error(`${naam}: de maaltijdtegel staat open in plaats van dicht`)
    if (await tegel.getByRole('button', { name: '½', exact: true }).count()) {
      throw new Error(`${naam}: de portiekeuze staat er terwijl de tegel dicht is`)
    }
    const kop = (await tegel.locator('.mini').first().textContent()) ?? ''
    if (!/\(\d[\d.]*–\d[\d.]*\)/.test(kop)) {
      throw new Error(`${naam}: ingeklapt staat er geen band — ${JSON.stringify(kop)}`)
    }
    if (!(await tegel.locator('.conf').count())) {
      throw new Error(`${naam}: ingeklapt staat er geen graad`)
    }

    const kcal = async () => {
      const t = (await tegel.locator('.mini').first().textContent()) ?? ''
      const m = t.match(/([\d.]+) kcal/)
      if (!m) throw new Error(`${naam}: geen kcal op de maaltijdtegel — ${JSON.stringify(t)}`)
      return Number(m[1].replace(/\./g, ''))
    }
    const heel = await kcal()

    await tegel.locator('.maalopen').click()
    await pagina.waitForTimeout(120)
    await tegel.getByRole('button', { name: '½', exact: true }).click()
    await pagina.waitForTimeout(120)
    const half = await kcal()
    if (Math.abs(half - heel / 2) > 1) {
      throw new Error(`${naam}: ½ portie geeft ${half} en niet ongeveer ${heel / 2}`)
    }
    /* En de kop zegt dat er een halve gekozen is. Zonder dat log je met één tik
       iets anders dan wat er staat zodra de tegel weer dichtgaat. */
    if (!((await tegel.locator('.mini').first().textContent()) ?? '').includes('½ portie')) {
      throw new Error(`${naam}: de kop zegt niet dat er een halve portie gekozen is`)
    }
    /* En de aanname hoort op de tegel te staan, niet achter een uitklapje. */
    const uitleg = (await tegel.textContent()) ?? ''
    if (!uitleg.includes('niet apart gewogen')) {
      throw new Error(`${naam}: de tegel zegt niet dat een deelportie een aanname is`)
    }

    /* De duiding zit achter een tweede uitklapje, en wat erin staat is de hele
       reden dat het uitklapje er is: waar de energie zit, en wat er gebeurt als
       je eraan draait. Een leeg vak is erger dan geen vak. */
    await tegel.locator('details.uitleg > summary').click()
    await pagina.waitForTimeout(200)
    await pagina.screenshot({ path: `gereedschap/health-${naam}-duiding.png` })
    const duiding = (await tegel.locator('details.uitleg .inhoud').textContent()) ?? ''
    for (const woord of ['kcal per gram', 'gram per 100 kcal', 'Waar de energie zit',
                         'Olijfolie', 'halveren', 'verdubbelen']) {
      if (!duiding.includes(woord)) {
        throw new Error(`${naam}: de duiding mist "${woord}"`)
      }
    }
    await tegel.locator('details.uitleg > summary').click()
    await tegel.getByRole('button', { name: '1', exact: true }).click()
    await tegel.locator('.maalopen').click()
    await pagina.waitForTimeout(120)
    console.log(`${naam.padEnd(26)} maaltijd: dicht=1 regel · 1 portie=${heel} kcal, ½=${half} kcal`)
  }

  /* DE BRUG VAN ZOEKEN NAAR BESCHRIJVEN

     Wie een hele zin in het zoekveld typt bedoelt een maaltijd en krijgt losse
     producten. Sinds kort biedt het vel dan aan om hem te laten herkennen. Dat
     aanbod is te toetsen én het is te makkelijk stuk te maken: één woord meer in
     de drempel en het komt nooit meer, zonder dat er iets rood wordt. */
  {
    await pagina.getByLabel('Zoeken').fill('twee boterhammen met mayonaise')
    await pagina.waitForTimeout(700)
    const aanbod = pagina.locator('.venster button.hoofdknop', { hasText: 'hele maaltijd' })
    if (!(await aanbod.count())) {
      throw new Error(`${naam}: geen aanbod om een zin te laten herkennen`)
    }
    /* Het hoort vóór de zoekresultaten te staan. Eronder zie je het pas als je
       de verkeerde weg al bent ingeslagen. */
    const eerste = pagina.locator('.venster .hoofdknop, .venster .lijst, .venster .kaart').first()
    if (!((await eerste.textContent()) ?? '').includes('hele maaltijd')) {
      throw new Error(`${naam}: het aanbod staat niet bovenaan`)
    }

    await aanbod.click()
    await pagina.waitForTimeout(400)
    /* Na de tik: het zoekveld leeg, het beschrijfvak open, en de zin erin. */
    const zoek = await pagina.getByLabel('Zoeken').inputValue()
    if (zoek !== '') throw new Error(`${naam}: het zoekveld is niet leeggemaakt (${zoek})`)
    const vak = pagina.locator('.venster textarea')
    if (!(await vak.count())) throw new Error(`${naam}: het beschrijfvak ging niet open`)
    const inhoud = await vak.inputValue()
    if (inhoud !== 'twee boterhammen met mayonaise') {
      throw new Error(`${naam}: de zin is niet overgenomen — ${JSON.stringify(inhoud)}`)
    }
    await pagina.screenshot({ path: `gereedschap/health-${naam}-herkenaanbod.png` })
    console.log(`${''.padEnd(26)} zin → beschrijfvak: ${JSON.stringify(inhoud)}`)

    /* En een gewone zoekterm hoort het aanbod NIET te krijgen. Zonder deze
       controle zou een drempel van één woord er net zo goed uitzien. */
    await pagina.locator('.venster textarea').fill('')
    await pagina.getByLabel('Zoeken').fill('tonijn')
    await pagina.waitForTimeout(700)
    if (await pagina.locator('.venster button.hoofdknop', { hasText: 'hele maaltijd' }).count()) {
      throw new Error(`${naam}: "tonijn" krijgt het aanbod, en dat hoort niet`)
    }
    await pagina.getByLabel('Zoeken').fill('')
    await pagina.waitForTimeout(300)
  }

  /* En de weg via het zoekveld. Dit is wat er eerder niet werkte: wie "tonijn"
     typte kreeg de vierentwintig tonijnregels van NEVO en niet zijn eigen
     salade. Hij hoort nu bovenaan te staan, met het sterretje aan. */
  {
    await pagina.getByLabel('Zoeken').fill('tonijn')
    await pagina.waitForSelector('.venster .kaart', { timeout: 5000 })
    await pagina.waitForTimeout(500)
    const eerste = pagina.locator('.venster .kaart').first()
    const titel = (await eerste.locator('.knip').first().textContent()) ?? ''
    if (!titel.includes('Tonijnsalade')) {
      throw new Error(`${naam}: zoeken op tonijn geeft "${titel}" en niet je eigen salade`)
    }
    if (!titel.includes('★')) throw new Error(`${naam}: het sterretje staat niet aan`)
    console.log(`${''.padEnd(26)} zoeken op "tonijn" → ${JSON.stringify(titel.trim())}`)
    await pagina.getByLabel('Zoeken').fill('')
    await pagina.waitForTimeout(300)
  }

  const chips = await pagina.locator('.momentchip').count()
  const aan = await pagina.locator('.momentchip.aan').textContent()
  const suggesties = await pagina.locator('.venster .suggesties > div').count()
  if (chips !== 4) throw new Error(`${naam}: ${chips} momentchips in plaats van 4`)

  /* De belofte van dit vel is één tik. Die tik wordt hier werkelijk gedaan, en
     er wordt gekeken of hij aankomt: een bevestiging bovenin, en het vinkje op
     de regel die je aanraakte. Zonder die controle is 'één tik' een bewering. */
  let bevestiging = 'geen suggesties'
  if (suggesties > 0) {
    await pagina.locator('.venster .suggesties > div').first().getByRole('button').click()
    await pagina.waitForSelector('.venster .kaart.goed', { timeout: 5000 })
    bevestiging = (await pagina.locator('.venster .kaart.goed').textContent()) ?? ''
    await pagina.waitForTimeout(300)
    await pagina.screenshot({ path: `gereedschap/health-${naam}-getikt.png` })
  }
  console.log(`${naam.padEnd(26)} moment=${JSON.stringify(aan)} suggesties=${suggesties}`)
  console.log(`${''.padEnd(26)} na één tik: ${JSON.stringify(bevestiging.slice(0, 70))}`)
  await pagina.close()
}

/* ------------------------------------------------- het dagoverzicht -- */
/* Het detailvenster is de plek waar de app zijn eigen getallen uit elkaar haalt.
   Precies daarom is een screenshot alleen er niet genoeg: wat hier fout kan gaan
   is stille rekenfout, en die ziet er op een plaatje net zo uit als de goede.

   Twee dingen worden dus echt nagerekend. De band van de dag hoort de som te zijn
   van de banden van de vakken — niet de wortel daarvan, want dan zou de app
   beloven dat de fouten elkaar wegstrepen, en dat mag alleen bij onafhankelijke
   fouten. En elke regel hoort te zeggen waar zijn getal vandaan komt: sinds dat
   een teken is (◆ gemeten, ◇ geschat) is het makkelijker om stilletjes te
   verdwijnen dan toen het "NEVO:" heette. */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.maal', { timeout: 5000 })
  await pagina.getByRole('button', { name: /^Details:/ }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  await pagina.waitForTimeout(400)
  await pagina.screenshot({ path: 'gereedschap/health-dagoverzicht.png', fullPage: true })

  const venster = pagina.locator('.venster')
  const getal = (t) => Number((t ?? '').replace(/\./g, '').replace(',', '.'))

  /* Het dagtotaal met zijn band. */
  const kop = venster.locator('.kaart', { hasText: 'De hele dag' }).first()
  const punt = getal(await kop.locator('.getal').first().textContent())
  const band = (await kop.locator('.cijfer').first().textContent()) ?? ''
  const m = band.match(/([\d.]+)–([\d.]+)/)
  if (!m) throw new Error(`dagoverzicht: geen band bij het dagtotaal — ${JSON.stringify(band)}`)
  const [laag, hoog] = [getal(m[1]), getal(m[2])]
  if (!(laag <= punt && punt <= hoog)) {
    throw new Error(`dagoverzicht: ${punt} ligt niet in ${laag}–${hoog}`)
  }

  /* De vakken, en de optelling. De koppen staan in `.tussen` van elke vakkaart. */
  const vakken = venster.locator('.kaart').filter({ has: pagina.locator('.dagstip') })
  const n = await vakken.count()
  if (n === 0) throw new Error('dagoverzicht: geen enkel maaltijdvak')
  let somPunt = 0, somLaag = 0, somHoog = 0
  for (let i = 0; i < n; i++) {
    const t = (await vakken.nth(i).locator('.tussen .cijfer').first().textContent()) ?? ''
    const v = t.match(/([\d.]+) kcal\s*\(([\d.]+)–([\d.]+)\)/)
    if (!v) throw new Error(`dagoverzicht: vak ${i} zonder band — ${JSON.stringify(t)}`)
    somPunt += getal(v[1]); somLaag += getal(v[2]); somHoog += getal(v[3])
  }
  /* Één kcal speling: elk getal wordt apart afgerond voordat het op het scherm
     komt, en vier afrondingen halen het niet altijd tot op de eenheid. */
  for (const [wat, a, b] of [['punt', somPunt, punt], ['laag', somLaag, laag],
                             ['hoog', somHoog, hoog]]) {
    if (Math.abs(a - b) > 1) {
      throw new Error(`dagoverzicht: de vakken tellen op tot ${a} ${wat}, de dag zegt ${b}`)
    }
  }

  /* Elke regel zegt waar hij vandaan komt, en de uitleg staat er nog achter. */
  const tekens = await venster.locator('.herkomst').count()
  const regels = await vakken.locator('.lijst > *').count()
  if (tekens !== regels) {
    throw new Error(`dagoverzicht: ${regels} regels maar ${tekens} herkomsttekens`)
  }
  const eerste = venster.locator('.herkomst').first()
  const teken = (await eerste.textContent()) ?? ''
  const titel = (await eerste.getAttribute('title')) ?? ''
  if (!'◆◇'.includes(teken.trim())) {
    throw new Error(`dagoverzicht: onbekend herkomstteken ${JSON.stringify(teken)}`)
  }
  if (!/tabel|geschat/.test(titel)) {
    throw new Error(`dagoverzicht: het teken heeft geen uitleg — ${JSON.stringify(titel)}`)
  }
  /* En het woord waar dit teken voor in de plaats kwam hoort nergens meer als
     kale kop op het scherm te staan. */
  const alles = (await venster.textContent()) ?? ''
  if (/\bNEVO\b/.test(alles)) throw new Error('dagoverzicht: "NEVO" staat nog op het scherm')

  console.log(`dagoverzicht${''.padEnd(14)} ${regels} regels in ${n} vakken`)
  console.log(`${''.padEnd(26)} dag=${punt} (${laag}–${hoog}) = som van de vakken`)
  console.log(`${''.padEnd(26)} herkomst: ${tekens}× teken, titel=${JSON.stringify(titel)}`)
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

  /* Twee dingen die op 430 pixels niet kunnen misgaan en op 1440 wel, en die
     allebei één keer misgegaan zijn tijdens het bouwen van deze indeling.

     De eerste: de veertien dagen staan op `flex:1 1 0` zonder maximum. Zonder
     bovengrens worden het planken van zeventig pixels en lees je een
     staafdiagram in plaats van een strook dagen.

     De tweede is erger, want hij verandert wat er staat: met `grid-auto-flow:
     dense` mag het raster achteruit zoeken naar een gat, en dan springt de
     weegkaart boven de hero uit. De pagina klopt dan nog steeds — alleen de
     leesvolgorde niet meer. Een screenshot laat dat zien; een proef die alleen
     naar kleuren kijkt niet. */
  const maten = await pagina.evaluate(() => {
    const blok = document.querySelector('.strook > i')
    const hero = document.querySelector('.hero')
    const zij = document.querySelector('.kaart.zijkolom')
    const streep = document.querySelector('#inhoud')
    return {
      blok: blok ? Math.round(blok.getBoundingClientRect().width) : null,
      heroBoven: hero ? Math.round(hero.getBoundingClientRect().top) : null,
      zijBoven: zij ? Math.round(zij.getBoundingClientRect().top) : null,
      inhoudBreed: streep ? Math.round(streep.getBoundingClientRect().width) : null,
      streepBreed: streep
        ? Math.round(parseFloat(getComputedStyle(streep, '::before').width) || 0) : null,
    }
  })
  if (maten.blok == null || maten.blok > 30) {
    throw new Error(`breed: een dagblok is ${maten.blok}px breed — de strook is een staafdiagram geworden`)
  }
  if (maten.zijBoven == null || maten.heroBoven == null || maten.zijBoven < maten.heroBoven) {
    throw new Error(`breed: de zijkolom begint op ${maten.zijBoven} en de hero op ${maten.heroBoven} — `
      + 'de leesvolgorde staat op zijn kop')
  }
  if (maten.streepBreed != null && maten.inhoudBreed != null
      && maten.streepBreed < maten.inhoudBreed - 2) {
    throw new Error(`breed: de scheidingslijn is ${maten.streepBreed} van ${maten.inhoudBreed} px breed`)
  }
  console.log(`${''.padEnd(26)} dagblok=${maten.blok}px · zijkolom onder de hero · streep vol`)
  await pagina.close()

  /* En hetzelfde scherm in het donker. De telefoon staat in het donker en het
     brede scherm heeft eigen regels voor achtergrond, schaduw en de macrotegels
     — precies de plek waar een vergeten donkere variant licht op licht geeft. */
  const donkerpagina = await breed.newPage()
  await donkerpagina.emulateMedia({ colorScheme: 'dark' })
  await bedienDb(donkerpagina, 28, 'afvallen')
  await donkerpagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await donkerpagina.waitForSelector('.hero', { timeout: 5000 })
  await donkerpagina.waitForTimeout(1100)
  await donkerpagina.screenshot({ path: 'gereedschap/health-breed-donker.png' })
  const donkermaat = await donkerpagina.evaluate(() => {
    const lees = (el) => getComputedStyle(el).backgroundColor
    return { body: lees(document.body), tegel: lees(document.querySelector('.macro')) }
  })
  console.log(`${''.padEnd(26)} donker: body=${donkermaat.body}`)
  await donkerpagina.close()

  /* Eén ander tabblad op dezelfde breedte. De kolomindeling van Vandaag geldt
     alleen op een scherm dat zelf een zijkolom aanwijst; de vijf andere blijven
     op de gewone plaatsing. Dat is precies het soort onderscheid dat je pas ziet
     als je kijkt, en dat op 430 pixels niet bestaat. */
  const anderpagina = await breed.newPage()
  await bedienDb(anderpagina, 28, 'afvallen')
  await anderpagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await anderpagina.getByRole('tab', { name: 'Inzicht' }).click()
  await anderpagina.waitForSelector('.hero', { timeout: 5000 })
  await anderpagina.waitForTimeout(1100)
  await anderpagina.screenshot({ path: 'gereedschap/health-breed-inzicht.png' })
  /* Op zo'n scherm horen de kaarten over twee kolommen verdeeld te staan. Staan
     ze allemaal op dezelfde x, dan is de rechterkolom leeg en is er veertig
     procent van het scherm weggegooid. */
  const kolommenDaar = await anderpagina.locator('#inhoud > .kaart').evaluateAll(
    (els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().left)))].length)
  if (kolommenDaar < 2) {
    throw new Error(`breed: Inzicht zet alle ${kolommenDaar} kaarten in één kolom`)
  }
  console.log(`${''.padEnd(26)} Inzicht op 1440: ${kolommenDaar} kolommen`)
  await anderpagina.close()
}

/* ------------------------------------------------ meebewegen met de maat -- */
/* De maaltijdvakken stonden op één kolom tot 560 pixels en daarna op twee, en
   daar bleef het bij: op een tablet en op een groot scherm bleven het er twee.
   Deze controle kijkt of het aantal kolommen werkelijk meebeweegt. */

const breedtes = [360, 430, 768, 1000, 1100, 1920]
const kolommen = []
const strookmaten = []
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

  /* De dagenstrook op elke brede maat. Op 1440 knijpt de rechterkolom van de
     hero hem vanzelf al klein — daar bewees de proef dus niets. Tussen 960 en
     1100 staat de hero op één kolom en heeft de strook de volle breedte, en
     precies daar wordt het een staafdiagram als het maximum ontbreekt. */
  if (breedte >= 960) {
    const blok = await pagina.evaluate(() => {
      const i = document.querySelector('.strook > i')
      return i ? Math.round(i.getBoundingClientRect().width) : null
    })
    if (blok == null || blok > 30) {
      throw new Error(`${breedte}px: een dagblok is ${blok}px breed — de strook is een staafdiagram`)
    }
    strookmaten.push(`${breedte}px→${blok}px`)

    /* En of de inhoud niet ónder de zijbalk begint. De zijbalk staat vast en de
       inhoud houdt afstand met padding; die twee getallen staan los van elkaar
       in de stijl en kunnen dus uit elkaar lopen. Gebeurt dat, dan valt de
       linkerrand van elke kaart weg achter de balk — geen foutmelding, alleen
       tekst die halverwege een woord begint. */
    const rand = await pagina.evaluate(() => {
      const nav = document.querySelector('nav.tabs')
      const kaart = document.querySelector('#inhoud .kaart, #inhoud .hero')
      if (!nav || !kaart) return null
      const n = nav.getBoundingClientRect(); const k = kaart.getBoundingClientRect()
      return { navRechts: Math.round(n.right), navHoog: Math.round(n.height),
               kaartLinks: Math.round(k.left), viewport: window.innerHeight }
    })
    if (!rand || rand.kaartLinks < rand.navRechts) {
      throw new Error(`${breedte}px: de inhoud begint op ${rand?.kaartLinks} en de zijbalk `
        + `loopt tot ${rand?.navRechts} — de kaarten liggen eronder`)
    }
    if (rand.navHoog < rand.viewport - 2) {
      throw new Error(`${breedte}px: de zijbalk is ${rand.navHoog} hoog in een venster van `
        + `${rand.viewport} — hij loopt niet door`)
    }
  }

  if (breedte === 1100) await pagina.screenshot({ path: 'gereedschap/health-breed.png' })
  if (breedte === 1920) await pagina.screenshot({ path: 'gereedschap/health-zeerbreed.png' })
  if (breedte === 360) await pagina.screenshot({ path: 'gereedschap/health-smal.png' })
  await maat.close()
}
console.log('maaltijdvakken             ' + kolommen.join(' · '))
console.log('dagenstrook                ' + strookmaten.join(' · '))
if (kolommen[0] === kolommen[kolommen.length - 1]) {
  throw new Error('de maaltijdvakken bewegen niet mee met de schermbreedte')
}

await browser.close()
server.close()
