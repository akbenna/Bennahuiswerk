#!/usr/bin/env node
/**
 * DE SCHERMEN VAN BENNAHEALTH BEKIJKEN
 *
 * Het scherm is pas te beoordelen met gegevens erin. Zonder sessie toont de app
 * het aanmeldscherm, en met een lege sessie een scherm vol nullen, precies wat
 * er mis was. Dit script zet dist/ neer achter de echte headers, onderschept de
 * databaseaanroepen en geeft er een verzonnen maar geloofwaardige reeks voor
 * terug: achtentwintig dagen wegen en loggen.
 *
 * Er komen vier toestanden uit als plaatje, want ze zijn allemaal het bekijken
 * waard: de eerste dag (nog geen doel, het model kalibreert), een dag na enkele
 * weken (band, ring, maaltijden), diezelfde dag in het donker, en de
 * onderhoudsfase, de enige toestand waarin het stoplicht bestaat. Van de dag
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
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.json': 'application/json',
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
function reeks(aantalDagen, vorm = 'gewoon') {
  const dagen = []
  const regels = []
  for (let i = aantalDagen - 1; i >= 0; i--) {
    const d = iso(NU - i * DAG)
    const t = (aantalDagen - 1 - i) / Math.max(1, aantalDagen - 1)
    const ruis = Math.sin(i * 2.7) * 0.45 + Math.cos(i * 1.3) * 0.3
    dagen.push({
      datum: d,
      /* In de tegenspraakvorm loopt het gewicht omhóóg en wordt er maar om de
         drie dagen gewogen. Dat is de toestand van het schermbeeld waar deze
         proef uit voortkomt: een trend die niet vastligt naast een halfgevuld
         logboek. */
      /* De uitbijtervorm is de gewone reeks met één weging van 190,2 erin, op
         de veertiende dag. Dat is het geval uit het echte logboek: een reeks
         rond de 118 met daartussen één getal dat er niet kan staan. */
      /* En de vorm zonder weging van vandaag: de ochtend waarop je de app
         opent en nog op de weegschaal moet. Elke andere vorm heeft die dag al
         gewogen, dus de kop "Stap op de weegschaal" en het weegveld in de hero
         kwamen in de hele proefopstelling niet voor. */
      /* De vorm waarin het afvallen stilvalt zonder dat het logboek verandert:
         eerst ruim negen weken vlot eraf, daarna bijna stil. Niet helemaal
         stil, want met het logboek van deze proefpersoon zou een echt plateau
         een verbruik onder het rustverbruik betekenen, en dat weigert de
         rekenkern terecht. Dit is de enige vorm die lang genoeg is voor twee
         vensters, en dus de enige waarin de kaart over het verbruiksbeloop
         iets te zeggen heeft. */
      gewicht_kg: vorm === 'gezakt'
        ? Math.round((124
            - 0.10 * Math.min(aantalDagen - 1 - i, 64)
            - 0.03 * Math.max(aantalDagen - 1 - i - 64, 0)
            + ruis * 0.9) * 10) / 10
        : vorm === 'niet-gewogen' && i === 0
        ? null
        : vorm === 'tegenspraak'
        ? (i % 3 === 0 ? Math.round((116.0 + t * 4.6 + ruis) * 10) / 10 : null)
        : vorm === 'uitbijter' && i === 14
        ? 190.2
        : Math.round((119.4 - t * 3.1 + ruis) * 10) / 10,
      gewicht_bron: 'handmatig', stappen: 4200 + Math.round(Math.abs(Math.sin(i)) * 5200),
      /* Om de dag drie kwartier op de hometrainer. Dat is bewust: zonder
         fietsminuten in de proefgegevens zou het bewegingsscherm nooit zijn
         fietskant tonen en zou die helft ongezien blijven. */
      actieve_energie_kcal: null, fiets_min: i % 2 === 0 ? 45 : null,
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
    /* Halfgevuld logboek in de tegenspraakvorm: drie maaltijden op twaalf van
       de achtentwintig dagen, en niets op de rest.
       De eerste opzet nam de eerste drie regels van het menu en kwam op 930
       kcal uit. Dat viel onder de 1.200-grens waarmee de rekenkern een dag als
       onvolledig wegstreept, dus er bleef geen enkele bruikbare dag over en het
       model kwam niet eens tót een uitspraak, precies niet de toestand die
       deze proef moet vangen. Vandaar ontbijt, lunch en diner: 1.560 kcal. */
    if (vorm === 'tegenspraak' && i % 7 >= 3) continue
    /* Vandaag niets gelogd, de dagen ervoor wel. Dat is de toestand van iemand
       die 's ochtends de app opent, en de enige toestand waarin de app "tussen
       0 en 0 kcal" kon zeggen. Zonder dit geval bestond die dag in de hele
       proefopstelling niet, en kwam een mutant die de nulband terugzet er
       ongemerkt doorheen. Dat is precies wat er gebeurde. */
    if (vorm === 'leeg-vandaag' && i === 0) continue
    const tot = i === 0 ? 4 : menu.length
    const gekozen = vorm === 'tegenspraak'
      ? [menu[0], menu[2], menu[4]] : menu.slice(0, tot)
    gekozen.forEach(([moment, naam, kcal, eiwit, koolh, vet, conf], j) => {
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
 *  toestand die de bolletjes moeten kunnen tonen, bijna, niet gehaald. */
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
  /* Een tweede, oudere meetdag. Zonder die dag heeft de kaart "Wat er veranderd
     is" niets te vergelijken, en dan zou de proef een kaart tonen die op de
     telefoon van de gebruiker wél vol staat en hier altijd leeg blijft. */
  const toen = iso(NU - 120 * DAG)
  /* Een tweede dag binnen dezelfde week als `toen`. Zonder die dag rust het
     begin van de bloeddrukreeks op één meting, en dan is op het scherm niet te
     zien of de kaart het weekgemiddelde neemt of de eerste de beste waarde. Met
     deze dag erbij zijn de twee antwoorden verschillend: 146 tegen 148. */
  const toenOok = iso(NU - 118 * DAG)
  return [
    { id: 'm1', datum: d, soort: 'bloeddruk_sys', waarde: 128, eenheid: 'mmHg', notitie: null },
    { id: 'm2', datum: d, soort: 'bloeddruk_dia', waarde: 82, eenheid: 'mmHg', notitie: null },
    { id: 'm3', datum: d, soort: 'middelomtrek', waarde: 108, eenheid: 'cm', notitie: null },
    { id: 'm4', datum: toen, soort: 'bloeddruk_sys', waarde: 146, eenheid: 'mmHg', notitie: null },
    { id: 'm5', datum: toen, soort: 'bloeddruk_dia', waarde: 92, eenheid: 'mmHg', notitie: null },
    { id: 'm6', datum: toen, soort: 'middelomtrek', waarde: 114, eenheid: 'cm', notitie: null },
    { id: 'm7', datum: toenOok, soort: 'bloeddruk_sys', waarde: 150, eenheid: 'mmHg', notitie: null },
    { id: 'm8', datum: toenOok, soort: 'bloeddruk_dia', waarde: 94, eenheid: 'mmHg', notitie: null },
  ]
}

function alles(aantalDagen, fase = 'afvallen') {
  const vorm = fase === 'tegenspraak' ? 'tegenspraak'
    : fase === 'uitbijter' ? 'uitbijter'
    : fase === 'leeg-vandaag' ? 'leeg-vandaag'
    : fase === 'niet-gewogen' ? 'niet-gewogen'
    : fase === 'gezakt' ? 'gezakt' : 'gewoon'
  const { dagen, regels } = aantalDagen > 0
    ? reeks(aantalDagen, vorm) : { dagen: [], regels: [] }
  /* De GLI staat in de instellingen en niet in een eigen kolom: het is een
     opgave van de gebruiker, geen gemeten waarde. Begonnen op 10 juni 2025,
     dus op de vastgezette klok veertien maanden geleden, ruim voorbij de acht
     maanden behandelfase van CooL en nog niet aan de twee jaar toe. */
  const profiel = fase === 'onderhoud'
    ? { ...PROFIEL, fase: 'onderhoud', onderhoud_basis_kg: 115.0 }
    : fase === 'gli'
      ? { ...PROFIEL, instellingen: { gli: { programma: 'cool', begonnen: '2025-06-10' } } }
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
  /* DE ZAAK VAN HET SCHERMBEELD
     Een halfgevuld logboek naast een weegreeks die omhoog loopt. De balans geeft
     dan een negatief verbruik, en de app toonde dat: "−15.786–13.652 kcal". Dit
     geval staat er zodat die toestand een vaste plek heeft en niet pas op een
     telefoon opduikt. */
  ['tegenspraak', 28, 'light', 'tegenspraak', ['Inzicht']],
  /* De ochtend waarop er nog niets in staat. */
  ['leeg-vandaag', 28, 'light', 'leeg-vandaag', ['Vandaag']],
  /* En de ochtend waarop er nog niet gewogen is. Zie de kop van dit bestand:
     elk ander geval heeft vandaag al gewogen, dus het weegveld in de hero stond
     in geen enkele afdruk. */
  ['niet-gewogen', 28, 'light', 'niet-gewogen', ['Vandaag']],
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

/**
 * DE SFEERBAND KEUREN: op elke maat, want hij ging maar op één maat mis.
 *
 * Twee dingen zijn hier gemeten en allebei waren ze fout.
 *
 * De band werd opgeblazen. De bron was 384 bij 384 en de doos vraagt er op een
 * telefoon met drie beeldpunten per punt 1290, ruim drie keer. Vandaar de
 * verhouding hieronder: doosbreedte maal beeldpunten, gedeeld door de bron.
 *
 * En hij spande niet. Vanaf 1240 punten wordt de hero een grid van twee
 * kolommen, en die grid noemde de band niet; hij werd dus automatisch geplaatst
 * en was 582 breed in een hero van 1076. Daarna spande hij wél maar haalde hij
 * de rand niet: de binnenmarge van de hero gaat op bureaublad naar 28 en de
 * band rekende met 18. Op de telefoon was er geen van beide keren iets te zien.
 *
 * De bovengrens verschilt per maat en dat is geen slordigheid. Er liggen twee
 * bestanden per band, 1600 en 2400, en de browser kiest. Op een telefoon en op
 * een gewoon bureaublad pakt hij de 1600 en verkleint hij die nog, daar hoort
 * dus niets opgeblazen te worden. Op 1920 met twee beeldpunten per punt pakt
 * hij de 2400 en vraagt de band er 2636: tien procent meer dan er is. Dat is
 * het laatste restje en op een foto niet te zien; de grens staat daar op 1,15
 * en niet op 1,05.
 *
 * De ondergrens is er ook, en die kijkt de andere kant op: haalt een telefoon
 * de 2400 op terwijl hij er 1188 kan tonen, dan is er tweehonderd kilobyte per
 * scherm weggegooid. Een proef die alleen naar scherpte kijkt vindt dat prima.
 */
async function keurSfeerband(pagina, dpr, maat, grens) {
  const tabs = ['Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']
  const gezien = new Set()
  const maten = new Set()
  let ergste = 0
  for (const tab of tabs) {
    await naarTab(pagina, tab)
    const m = await pagina.evaluate(async () => {
      const img = document.querySelector('.schermstrook')
      if (!img) return null
      const b = img.getBoundingClientRect()
      const h = img.closest('.hero').getBoundingClientRect()
      /* NIET `img.naturalWidth`, EN DAT IS EEN VAL
         Zodra er een `srcset` met `w`-beschrijvingen op staat, rekent de
         browser `naturalWidth` terug naar de dichtheid waarop hij het beeld
         toont: een bron van 1600 in een doos van 408 punten geeft 408 terug en
         niet 1600. De proef mat daarna zichzelf (doos gedeeld door doos) en
         gaf trouw 2,91 keer opblazing op een band die perfect scherp stond.
         De echte maat komt uit een los beeld zonder srcset. */
      const kaal = new Image()
      kaal.src = img.currentSrc
      await kaal.decode().catch(() => {})
      return {
        breed: b.width, hoog: Math.round(b.height), bron: kaal.naturalWidth,
        linksGat: Math.round(b.left - h.left), rechtsGat: Math.round(h.right - b.right),
        src: img.getAttribute('src'), compleet: img.complete && img.naturalWidth > 0,
        /* `currentSrc` is wat de browser wérkelijk gehaald heeft, en dat is bij
           een srcset iets anders dan `src`. Zonder dit meet je de bedoeling en
           niet de uitkomst. */
        gekozen: (img.currentSrc || '').split('/').pop(),
        srcset: img.getAttribute('srcset'),
      }
    })
    if (!m) throw new Error(`${maat}: ${tab} heeft geen sfeerband`)
    if (!m.compleet) throw new Error(`${maat}: ${tab}: ${m.src} is niet geladen`)
    /* De hero heeft een rand van één punt; meer kier dan dat is een gat. */
    if (m.linksGat > 2 || m.rechtsGat > 2) {
      throw new Error(`${maat}: de band bij ${tab} laat ${m.linksGat}/${m.rechtsGat} punten `
        + 'kier aan de zijkanten, hij haalt de rand van de hero niet')
    }
    const blaas = (m.breed * dpr) / m.bron
    if (blaas > grens) {
      throw new Error(`${maat}: de band bij ${tab} wordt ${blaas.toFixed(2)}× opgeblazen `
        + `(doos ${Math.round(m.breed)} × ${dpr} beeldpunten, bron ${m.bron}), grens is ${grens}`)
    }
    if (!m.srcset) throw new Error(`${maat}: ${tab} heeft geen srcset: één maat voor elk toestel`)
    /* Te klein kiezen geeft een zachte band; te groot kiezen kost een telefoon
       bandbreedte die hij niet kan tonen. Beide kanten dus. */
    /* 0,55 is gemeten en niet gekozen. Goed gekozen geeft 0,74 op een telefoon
       en 0,67 op een bureaublad; grijpt de browser mis naar de 2400, dan wordt
       het 0,49 en 0,45. De grens ligt daartussen. */
    if (blaas < 0.55) {
      throw new Error(`${maat}: de band bij ${tab} haalt ${m.gekozen} op terwijl hij `
        + `${Math.round(m.breed * dpr)} beeldpunten nodig heeft, dat is ${(1 / blaas).toFixed(1)}× `
        + 'meer dan er getoond wordt')
    }
    ergste = Math.max(ergste, blaas)
    gezien.add(m.src)
    maten.add(m.gekozen)
  }
  /* Vijf schermen, vijf verschillende foto's. Wijzen er twee naar hetzelfde
     bestand, dan is er één vergeten bij het wisselen. */
  if (gezien.size !== tabs.length) {
    throw new Error(`${maat}: ${gezien.size} verschillende foto's op ${tabs.length} schermen`)
  }
  const gekozen = [...maten].map((n) => (n.match(/-(\d+)\.jpg$/) ?? [])[1] ?? '?')
  console.log(`${maat.padEnd(26)} sfeerband: ${tabs.length} schermen, `
    + `hoogste opblazing ${ergste.toFixed(2)}× (grens ${grens}), spant tot de rand, `
    + `browser koos ${[...new Set(gekozen)].join('/')}`)
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
/* Eén merkproduct, met de velden die er in `merk_actief` echt in staan. Het is
   met opzet een product mét portie én verpakkingsgewicht: dat is het geval waar
   drie keuzes uit komen, en dus het geval waarin de volgorde ertoe doet. */
const MERK = [{
  id: 'm1', barcode: '4056489620921', naam: 'Pindakaas 100% pinda\'s', merk: 'Lidl',
  groep: 'plant-based-foods-and-beverages', kcal: 604, eiwit_g: 27.3, vet_g: 47.5,
  koolhydraat_g: 12.2, vezel_g: null, verpakking_gram: 600, portie_gram: 15,
  portie_naam: '15 g',
}]

/* DE TABELREGEL DIE BIJ 'PINDAKAAS' HOORT
   Zonder deze regel gaf de mock op elke vraag tonijn terug, ook op 'pindakaas'.
   De proef verderop vergeleek dan een merkproduct dat precies zo heet met een
   tabelregel die niets met de vraag te maken had, en concludeerde uit die
   volgorde iets over de rangorde van herkomst. Dat bewees niets zodra het
   scherm op naamovereenkomst ging rangschikken.
   Nu staan er twee regels die allebei 'pindakaas' heten, en dan gaat de proef
   werkelijk over de regel die hij wil beschermen: bij gelijke overeenkomst
   staat de tabelwaarde boven het etiket. */
/* Een gerecht dat bij 'pindakaas' hoort maar minder goed past dan de tabelregel:
   'pindakaas' staat er niet vooraan in de naam. In de oude indeling stond elk
   gerecht boven elke tabelregel, dus dit ding kwam eerst. Dat was precies de
   klacht. */
const GERECHT_PINDAKAAS = [{
  id: 'gp1', naam: 'Boterham met pindakaas', keuken: 'nederlands',
  omschrijving: 'Snee brood met pindakaas.', porties: 1, status: 'concept',
}]

const NEVO_PINDAKAAS = [
  { nevo_code: '423', naam: 'Pindakaas', groep: 'Hartig broodbeleg', kcal: 620,
    eiwit_g: 22.8, vet_g: 51.4, koolhydraat_g: 12.6, vezel_g: 6.5 },
  { nevo_code: '2417', naam: 'Pindakaas m stukjes pinda', groep: 'Hartig broodbeleg', kcal: 617,
    eiwit_g: 24.1, vet_g: 50.6, koolhydraat_g: 12.0, vezel_g: 6.9 },
]

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

/* Wat de database teruggeeft als het woordzoeken niets vond en de terugval op
   schrijfvarianten aansloeg. De vlag staat aan, en daar hoort het scherm een
   regel bij te zetten. Zie health/database/20-zoeken-met-alternatieven.sql. */
/* Wat kal_eiwitrijk teruggeeft: de tweede laag van de coach, uit de tabel in
   plaats van uit je geschiedenis. Eén gemeten product en één merkproduct, want
   juist de combinatie van die twee moet het herkomstteken laten zien, ◆ naast
   ◈ in dezelfde lijst. Zie health/database/23-eiwitrijk-uit-de-tabel.sql. */
const EIWITRIJK = [
  {
    herkomst: 'nevo', nevo_code: '5295', merk: null,
    naam: 'Skyr naturel magere', groep: 'Melk en melkproducten',
    portie_naam: 'glas', portie_gram: 150, gram_laag: 125, gram_hoog: 200,
    kcal: 90, eiwit_g: 15.9, dichtheid: 0.177,
  },
  {
    herkomst: 'merk', nevo_code: null,
    merk: {
      id: 'm-shake', barcode: '4056489', naam: 'High Protein Drink chocolade',
      merk: 'Milbona', groep: 'zuivel', kcal: 52, eiwit_g: 10,
      vet_g: 1.2, koolhydraat_g: 2.6, vezel_g: null,
      verpakking_gram: 250, portie_gram: 250, portie_naam: 'flesje',
    },
    naam: 'High Protein Drink chocolade (Milbona)', groep: 'merk',
    portie_naam: 'flesje', portie_gram: 250, gram_laag: 225, gram_hoog: 275,
    kcal: 130, eiwit_g: 25, dichtheid: 0.192,
  },
]

/* Wat kal_verzadiging teruggeeft: de derde laag, en een andere as dan eiwit.
   Drie echte regels uit de tabel, met opzet zo gekozen dat ze de twee dingen
   tonen die deze lijst moet kunnen. Champignon staat bovenaan met 476 gram per
   honderd kilocalorieën en een portie van elf kilocalorieën, een
   verzadigingslijst hoort juist die kant op te wijzen. En paardenrookvlees staat
   er níet in, want dat is de tegenhanger: uitstekende eiwitdichtheid, vult
   niets. Zie health/database/28-wat-vult-het-best.sql. */
const VERZADIGING = [
  /* Twee gerechten en twee producten, met opzet zo gekozen dat de
     belangrijkste ontwerpkeuze te toetsen is: het gerecht met de láágste score
     hoort nog altijd bóven het product met de hóógste te staan. Het zijn twee
     antwoorden op twee vragen en geen ranglijst. */
  { soort: 'gerecht', sleutel: 'd-harira', nevo_code: null,
    dish_id: '11111111-2222-3333-4444-555555555555',
    naam: 'Harira', groep: 'marokkaans',
    portie_naam: 'kom', portie_gram: 300, gram_laag: 250, gram_hoog: 400,
    kcal: 156, gram_per_100kcal: 193, eiwit_per_100kcal: 4.1, vezel_per_100kcal: 3.4,
    score: 61, bekend: true },
  { soort: 'gerecht', sleutel: 'd-mercimek', nevo_code: null,
    dish_id: '11111111-2222-3333-4444-666666666666',
    naam: 'Mercimek çorbası', groep: 'turks',
    portie_naam: 'kom', portie_gram: 300, gram_laag: 250, gram_hoog: 400,
    kcal: 195, gram_per_100kcal: 155, eiwit_per_100kcal: 4.1, vezel_per_100kcal: 3.9,
    score: 56, bekend: false },
  { soort: 'product', sleutel: '001', nevo_code: '001', dish_id: null,
    naam: 'Champignon gekookt', groep: 'Groente',
    portie_naam: 'opscheplepel', portie_gram: 50, gram_laag: 35, gram_hoog: 70,
    kcal: 11, gram_per_100kcal: 476, eiwit_per_100kcal: 18.1, vezel_per_100kcal: 5.2,
    score: 100, bekend: true },
  { soort: 'product', sleutel: '004', nevo_code: '004', dish_id: null,
    naam: 'Linzen groene en bruine gekookt', groep: 'Peulvruchten',
    portie_naam: 'opscheplepel', portie_gram: 60, gram_laag: 45, gram_hoog: 80,
    kcal: 59, gram_per_100kcal: 101, eiwit_per_100kcal: 8.9, vezel_per_100kcal: 5.4,
    score: 64, bekend: false },
]

const NEVO_BENADERD = [
  { nevo_code: '1491', naam: 'Lasagne bolognese koelverse maaltijd',
    groep: 'Samengestelde gerechten', kcal: 162,
    eiwit_g: 8.4, vet_g: 7.7, koolhydraat_g: 15.1, vezel_g: 1.1, benadering: true },
  { nevo_code: '5458', naam: 'Lasagne groenten- koelverse maaltijd',
    groep: 'Samengestelde gerechten', kcal: 112,
    eiwit_g: 4.3, vet_g: 5.2, koolhydraat_g: 11.6, vezel_g: 1.5, benadering: true },
]

/** De databaseaanroepen onderscheppen voor één pagina. */
/* Drie testers, en de volgorde in dit blok is met opzet niet de volgorde die
   het scherm hoort te tonen: wie wacht hoort bovenaan te komen, en dat is
   precies wat er te bewijzen valt. Er staat geen enkel gegeven uit de app zelf
   in, want `kal_testers` geeft dat niet terug; zie de kop van bestand 48. */
const TESTERS = [
  { account: 'abdelkader', naam: 'Abdelkader', status: 'toegelaten', beheerder: true,
    budget: 100000, notitie: null, aangemaakt_op: '2026-06-01T09:00:00Z',
    beoordeeld_op: null, maand_aanroepen: 212, maand_tokens: 980000, maand_usd: 4.21,
    laatst_actief: '2026-08-22T08:10:00Z' },
  { account: 'zineb', naam: 'Zineb', status: 'toegelaten', beheerder: false,
    budget: 100, notitie: null, aangemaakt_op: '2026-08-02T09:00:00Z',
    beoordeeld_op: '2026-08-02T10:00:00Z', maand_aanroepen: 31, maand_tokens: 120000,
    maand_usd: 0.52, laatst_actief: '2026-08-21T19:30:00Z' },
  { account: 'karim', naam: 'Karim', status: 'wacht', beheerder: false,
    budget: 100, notitie: null, aangemaakt_op: '2026-08-20T09:00:00Z',
    beoordeeld_op: null, maand_aanroepen: 0, maand_tokens: 0, maand_usd: 0,
    laatst_actief: null },
];

async function bedienDb(pagina, dagen, fase) {
  /* DE EIGEN SLEUTEL GAAT NIET LANGS DE DATABASE, BESTAND 49
     Hij gaat naar de edge function, want daar staat de hoofdsleutel waarmee hij
     versleuteld wordt. Deze stub doet wat die functie doet en niets meer: hij
     keurt het voorvoegsel en geeft de staart terug. De sleutel zelf komt
     nergens terug, ook hier niet. */
  await pagina.route('**/functions/v1/kal-ai', async (route) => {
    const p = JSON.parse(route.request().postData() ?? '{}')
    if (p.soort !== 'sleutel') return route.fallback()
    ;(pagina.__sleutels ??= []).push({ aanbieder: p.aanbieder, lengte: p.sleutel?.length })
    const goed = p.aanbieder === 'anthropic'
      ? p.sleutel.startsWith('sk-ant-')
      : p.sleutel.startsWith('sk-') && !p.sleutel.startsWith('sk-ant-')
    await route.fulfill({
      status: goed ? 200 : 400, contentType: 'application/json',
      body: JSON.stringify(goed
        ? { aanbieder: p.aanbieder, staart: p.sleutel.slice(-4) }
        : { error: 'Een sleutel van Anthropic begint met sk-ant-.' }),
    })
  })

  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    const lijf = fn === 'kal_ophalen' ? alles(dagen, fase)
      : fn === 'kal_maaltijden' ? MAALTIJDEN
      : fn === 'kal_zoeken'
        ? {
            maaltijden: MAALTIJDEN,
            /* De verkeerd gespelde vraag krijgt de benaderde uitslag terug,
               precies zoals de database hem geeft. Zo is te zien of het scherm
               de vlag ook echt gebruikt en niet altijd dezelfde regel toont. */
            nevo: /lesagn/i.test(route.request().postData() ?? '') ? NEVO_BENADERD
              : /pindakaas/i.test(route.request().postData() ?? '') ? NEVO_PINDAKAAS
              : NEVO_TONIJN,
            gerechten: /pindakaas/i.test(route.request().postData() ?? '') ? GERECHT_PINDAKAAS : [],
            eigen: [], merk: MERK,
          }
      : fn === 'kal_eiwitrijk' ? EIWITRIJK
      : fn === 'kal_verzadiging' ? VERZADIGING
      : fn === 'kal_ben_ik_beheerder' ? { beheerder: pagina.__beheerder === true }
      /* De wachtkamer en het budget, bestand 48. `__toegang` staat standaard op
         toegelaten, want elk ander geval in deze opstelling gaat over iets
         anders en hoort niet ineens achter een wachtscherm te komen. */
      : fn === 'kal_mijn_toegang'
        ? { mag: true, status: 'toegelaten', reden: 'goed', gebruikt: 12, budget: 100,
            uur: 0, beheerder: pagina.__beheerder === true, maand_tot: '2026-09-01',
            ...(pagina.__toegang ?? {}) }
      : fn === 'kal_testers'
        ? (pagina.__beheerder === true ? TESTERS : { fout: 'Dat kan niet' })
      : fn === 'kal_sleutel_weghalen' ? { weg: true }
      /* Weghalen, bestand 52. De stub doet wat de database doet: zonder het
         goede wachtwoord komt er een fout, en zonder `p_echt` verandert er
         niets en komt er alleen een telling. Beide worden geteld, want het
         verschil tussen kijken en wissen is hier de hele veiligheid. */
      : fn === 'kal_account_wissen'
        ? (() => {
            const p = JSON.parse(route.request().postData() ?? '{}')
            ;(pagina.__wissen ??= []).push({ echt: p.p_echt === true, ww: p.p_ww })
            if (p.p_ww !== 'goedwachtwoord') return { fout: 'Je wachtwoord klopt niet' }
            return {
              gewist: p.p_echt === true, account: 'abdelkader', totaal: 149,
              per_tabel: { kal_dagen: 28, kal_regels: 112, kal_metingen: 6, kal_profiel: 1,
                           kal_gebruikers: 1, eigen_ai_sleutel: 1 },
            }
          })()
      : fn === 'kal_tester_zetten'
        ? (() => {
            const p = JSON.parse(route.request().postData() ?? '{}')
            ;(pagina.__gezet ??= []).push(p)
            return { account: p.p_account, status: p.p_status ?? 'wacht', budget: p.p_budget ?? 100 }
          })()
      : fn === 'kal_herstelcode_voor'
        ? { code: 'QQQQQ-WWWWW-EEEEE-RRRRR', account: 'fatima' }
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

    /* EEN BAND DIE GEEN BAND IS
     *
     * Op een lege dag stond in de kop "Wat je logde ligt tussen 0 en 0 kcal" en
     * in de coachregel "(2.165–2.165)". Allebei waar, allebei geen informatie,
     * en allebei doen ze alsof er onzekerheid gemeten is waar niets gemeten is.
     * In een app waarvan de stelregel "geen getal zonder zijn onzekerheid" is,
     * is het omgekeerde net zo fout. */
    if (tab === 'Vandaag') {
      const scherm = await pagina.locator('main, body').first().innerText()
      const nulband = scherm.match(/tussen\s+0\s+en\s+0/)
      if (nulband) throw new Error(`${stam}: marge van 0 tot 0 in beeld`)
      const puntband = scherm.match(/\((\d[\d.]*)[–-](\d[\d.]*)\)/)
      if (puntband && puntband[1] === puntband[2]) {
        throw new Error(`${stam}: band met twee gelijke grenzen: ${puntband[0]}`)
      }
    }

    /* DE VOLGORDE VAN HET VANDAAGSCHERM
     *
     * De gewone reden om deze app te openen is loggen. De knop daarvoor stond
     * drie kaarten naar beneden, onder twee kaarten die je eerst moest lezen.
     * Hij hoort meteen onder de hero, met "Wat er nog in past" eronder (dat is
     * de vraag die je daarna stelt) en daarna beweging en slaap.
     *
     * Net als bij Inzicht is dit met een grep niet te bewaken: een blok
     * verplaatsen verandert geen enkele tekst. Vandaar hier, op de gerenderde
     * pagina, en met de hero erbij, anders bewijst "knop vóór coachkaart" nog
     * niet dat er niets tussen de hero en de knop is gekropen.
     */
    if (tab === 'Vandaag') {
      const rij = await pagina.evaluate(() =>
        Array.from(document.querySelectorAll('.hero, .hoofdknop, .kaart')).map((el) => {
          if (el.classList.contains('hero')) return 'hero'
          if (el.classList.contains('hoofdknop')) return 'toevoegen'
          const k = el.querySelector('.eyebrow')
          return k && k.textContent ? k.textContent.trim() : '?'
        }))
      const waar = (t) => rij.findIndex((x) => x.startsWith(t))
      const hero = waar('hero')
      const knop = waar('toevoegen')
      const vakken = waar('De dag in vier momenten')
      const past = waar('Wat er nog in past')
      const vult = waar('Wat vult het best')
      const ontbreekt = waar('Wat ontbreekt er')
      const bew = waar('Beweging en slaap')
      if (hero !== 0) throw new Error(`${stam}: de hero staat niet bovenaan: ${JSON.stringify(rij)}`)
      if (knop !== 1) {
        throw new Error(`${stam}: "Eten toevoegen" staat niet meteen onder de hero, ` +
                        JSON.stringify(rij))
      }
      /* De vakken horen tegen de knop aan: ze zijn zelf de ingang, en knop en
         vakken uit elkaar trekken zet twee helften van één handeling op twee
         plekken. */
      if (vakken !== 2) {
        throw new Error(`${stam}: "De dag in vier momenten" staat niet meteen onder de knop, ` +
                        JSON.stringify(rij))
      }
      /* De coachkaart ontbreekt zolang er geen doel is; dan volgt beweging
         meteen op de vakken, en dat hoort ook zo. */
      if (past >= 0 && past !== 3) {
        throw new Error(`${stam}: "Wat er nog in past" staat niet onder de vakken, ` +
                        JSON.stringify(rij))
      }
      /* "Wat vult het best" hoort direct onder de coachkaart: het is dezelfde
         vraag vanuit een andere hoek, en allebei gaan ze over de ruimte die er
         nog is. Hij staat er alleen als er een doel én ruimte is. */
      if (vult >= 0 && vult !== past + 1) {
        throw new Error(`${stam}: "Wat vult het best" staat niet onder de coachkaart, ` +
                        JSON.stringify(rij))
      }
      /* "Wat ontbreekt er" sluit de rij van drie: eerst wat er nog in past, dan
         wat het best vult, dan wat er structureel buiten beeld blijft. Die derde
         staat er onder dezelfde voorwaarde als de tweede, zonder doel is er nog
         geen geschiedenis om iets over te zeggen. */
      if (ontbreekt >= 0 && ontbreekt !== vult + 1) {
        throw new Error(`${stam}: "Wat ontbreekt er" staat niet onder "Wat vult het best", ` +
                        JSON.stringify(rij))
      }
      if (bew < 0) throw new Error(`${stam}: "Beweging en slaap" ontbreekt: ${JSON.stringify(rij)}`)
      /* Direct na de laatste van de drie, en niet op een vast nummer: dat
         laatste hield geen stand zodra er een kaart bij kwam, terwijl de eis
         dezelfde bleef. */
      if (bew !== Math.max(vakken, past, vult, ontbreekt) + 1) {
        throw new Error(`${stam}: "Beweging en slaap" staat niet direct daaronder, ` +
                        JSON.stringify(rij))
      }
      console.log(`${''.padEnd(26)} volgorde: ${rij.slice(0, 6).join(' → ')}`)

      /* HET WEEGVELD STAAT IN DE HERO
         Het stond onderaan, achter zes kaarten langs, terwijl de kop erboven
         "Stap op de weegschaal" zei. Deze proef houdt vast dat kop en handeling
         bij elkaar staan: zegt de hero dat je moet wegen, dan staat het veld er
         ook. En zodra er gewogen is verdwijnt het en staat het getal er. */
      const heroTekst = (await pagina.locator('.hero').first().innerText()).replace(/\s+/g, ' ')
      const veld = await pagina.locator('.hero .heroweeg input').count()
      if (/Stap op de weegschaal/.test(heroTekst)) {
        if (veld !== 1) {
          throw new Error(`${stam}: de hero vraagt om een weging en heeft geen weegveld`)
        }
        const laag = await pagina.locator('.kaart').filter({ hasText: 'Ochtendweging' }).count()
        if (laag !== 1) throw new Error(`${stam}: de weegkaart eronder is verdwenen`)
        console.log(`${''.padEnd(26)} weegveld in de hero, en de kaart eronder blijft`)
      } else if (veld !== 0) {
        throw new Error(`${stam}: er staat een weegveld in de hero terwijl er al gewogen is`)
      } else if (!/kg/.test(heroTekst)) {
        throw new Error(`${stam}: het vlaggetje noemt het gewicht niet\n  ${heroTekst.slice(0, 160)}`)
      }
    }

    /* WAT JE KOMT HALEN STAAT BOVEN WAT JE KOMT DOEN
     *
     * Op Gezondheid stond het invoerformulier bovenaan de metingenkaart, dus
     * het eerste wat je zag was een leeg vak en niet je eigen bloeddruk.
     * Toevoegen is de uitzondering. Dit is een volgorde en dus met een grep
     * niet te bewaken. */
    if (tab === 'Gezondheid') {
      /* De kaart wordt gezocht op zijn tekst én op het feit dat hij het
         formulier bevat. Dat tweede is er later bij gekomen: sinds het
         bloeddrukgemiddelde erboven staat is er een tweede kaart op dit scherm
         waar het woord "metingen" in valt, en die heeft geen formulier. Zonder
         de `has` pakte `.first()` die kaart en viel de proef om op een kaart die
         hij nooit bedoeld heeft. De strengheid blijft gelijk: binnen de
         invoerkaart moeten de waarden nog steeds boven de velden staan.

         Het formulier was een uitrolmenu met één waardeveld; nu zijn het zes
         open vakjes, want een bloeddruk is twee getallen die bij elkaar horen
         en die kostten zo twee keer kiezen en twee keer opslaan. */
      const kaart = pagina.locator('.kaart')
        .filter({ hasText: 'Metingen' })
        .filter({ has: pagina.locator('.meetvelden') })
        .first()
      const volgorde = await kaart.evaluate((el) => {
        const waarden = el.querySelector('.trio')
        const veld = el.querySelector('.meetvelden')
        if (!waarden || !veld) return null
        return waarden.compareDocumentPosition(veld) & Node.DOCUMENT_POSITION_FOLLOWING ? 'goed' : 'fout'
      })
      if (volgorde !== 'goed') {
        throw new Error(`${stam}: de invoervelden staan boven de waarden (${volgorde})`)
      }
      /* Zes vakjes, met boven elk wat erin hoort. Een vakje zonder eigen naam
         is een vakje waar je in gokt. */
      const vakjes = await kaart.locator('.meetvelden label').count()
      if (vakjes !== 6) throw new Error(`${stam}: ${vakjes} meetvakjes in plaats van 6`)
      const namen = (await kaart.locator('.meetvelden').innerText()).replace(/\s+/g, ' ')
      for (const naam of ['Bovendruk', 'Onderdruk', 'Rustpols', 'Middelomtrek',
                          'Nekomtrek', 'Saturatie']) {
        if (!namen.includes(naam)) {
          throw new Error(`${stam}: "${naam}" staat niet boven een vakje\n  ${namen}`)
        }
      }
      /* DE MIDDELOMTREK ALS REEKS
         De app toonde alleen de nieuwste waarde. Met twee meetdagen hoort de
         reeks eronder te staan, met per stap het verschil, en met het verschil
         over het geheel in gewone taal eronder. */
      const platMeting = (await kaart.innerText()).replace(/\s+/g, ' ')
      for (const stuk of ['Je metingen', '114 cm', '108 cm', 'Van 114 naar 108 cm']) {
        if (!platMeting.includes(stuk)) {
          throw new Error(`${stam}: "${stuk}" ontbreekt in de reeks van de middelomtrek`
            + `\n  ${platMeting.slice(0, 300)}`)
        }
      }
      console.log(`${''.padEnd(26)} metingen: waarden boven het formulier, reeks van 2 dagen eronder`)

      /* WAT ER VERANDERD IS
         De enige kaart op dit scherm die twee momenten naast elkaar zet. Hij
         hoort er alleen te staan als er werkelijk twee meetdagen zijn, en het
         gewicht hoort uit de gladde lijn te komen en niet van de weegschaal. */
      const verandering = pagina.locator('.kaart').filter({ hasText: 'Wat er veranderd is' })
      if (!(await verandering.count())) {
        throw new Error(`${stam}: de kaart met wat er veranderd is ontbreekt`)
      }
      const platte = (await verandering.first().innerText()).replace(/\s+/g, ' ')
      for (const maat of ['Gewicht (trend)', 'Middelomtrek', 'Bovendruk', 'Onderdruk']) {
        if (!platte.includes(maat)) {
          throw new Error(`${stam}: "${maat}" staat niet in wat er veranderd is\n  ${platte}`)
        }
      }
      /* 114 naar 108 is zes centimeter eraf. En de bloeddruk begint op het
         gemiddelde van twee meetdagen, 146 en 150, dus op 148: dat is twintig
         punten eraf en niet achttien. Staat er -18, dan pakt de kaart de eerste
         de beste meting in plaats van de week eromheen. */
      for (const verwacht of ['-6', '-20', '-11']) {
        if (!platte.includes(verwacht)) {
          throw new Error(`${stam}: ${verwacht} ontbreekt in wat er veranderd is\n  ${platte}`)
        }
      }
      /* En hoe lang erover gedaan is. Het gewicht komt uit de reeks van
         achtentwintig dagen en de metingen liggen honderdelf dagen uit elkaar,
         dus deze kaart hoort twee verschillende eenheden te tonen. Staat er
         overal dezelfde, dan volgt de eenheid de tijd niet. */
      if (!/gemiddelde van de meetdagen/.test(platte)) {
        throw new Error(`${stam}: de kaart zegt niet dat de bloeddruk uit meetdagen komt`
          + `\n  ${platte}`)
      }
      for (const spanne of ['· 4 wk', '· 4 mnd']) {
        if (!platte.includes(spanne)) {
          throw new Error(`${stam}: "${spanne}" ontbreekt in wat er veranderd is\n  ${platte}`)
        }
      }
      console.log(`${''.padEnd(26)} veranderd: ${platte.slice(0, 110)}`)

      /* WAT ALS
         De rekensom staat in `watals.ts` en is daar ook geproefd. Wat hier te
         bewijzen valt is dat de schuif het scherm werkelijk beweegt, en in de
         goede richting: kilo's eraf hoort het risico omlaag te brengen en niet
         omhoog. En dat nul kilo hetzelfde getal geeft als de kaart erboven,
         want dat is de enige plek waar de twee elkaar kunnen tegenspreken. */
      const watals = pagina.locator('.kaart').filter({ hasText: 'Wat als' }).first()
      if (!(await watals.count())) throw new Error(`${stam}: de wat-als-kaart ontbreekt`)
      const schuif = watals.locator('input[type=range]')
      const risico = async () => {
        const t = (await watals.innerText()).replace(/\s+/g, ' ')
        const m = /([\d,]+)% nu, ([\d,]+)% met dit scenario/.exec(t)
        if (!m) throw new Error(`${stam}: geen risico in de wat-als-kaart\n  ${t.slice(0, 300)}`)
        return { nu: Number(m[1].replace(',', '.')), straks: Number(m[2].replace(',', '.')) }
      }
      /* DE BAND MET DE GRENZEN VAN DE RICHTLIJN
         Een percentage zegt weinig zonder zijn grenzen, en die verschuiven met
         de leeftijd. De figuur hoort ze allebei te tekenen; staat er maar één
         getal onder de band, dan is er een zone weggevallen. */
      const bandtekst = await watals.locator('svg.fig').first()
        .evaluate((el) => [...el.querySelectorAll('text')].map((t) => t.textContent).join(' '))
      const grenzen = bandtekst.split(' ').filter((x) => /^\d+,\d%$/.test(x))
      if (grenzen.length < 4) {
        throw new Error(`${stam}: de risicoband mist een grens of een stip (${bandtekst})`)
      }
      await schuif.fill('0')
      await pagina.waitForTimeout(150)
      const opNul = await risico()
      if (opNul.straks !== opNul.nu) {
        throw new Error(`${stam}: op nul kilo staat er ${opNul.straks} tegen ${opNul.nu}`)
      }
      await schuif.fill('10')
      await pagina.waitForTimeout(150)
      const opTien = await risico()
      if (!(opTien.straks < opNul.nu)) {
        throw new Error(`${stam}: tien kilo eraf verlaagt het risico niet `
          + `(${opTien.straks} tegen ${opNul.nu})`)
      }
      const watalsTekst = (await watals.innerText()).replace(/\s+/g, ' ')
      for (const stuk of ['Stap 1', 'Stap 2', 'Hartleeftijd', 'marge',
                          'geen voorspelling voor jou', 'NHG-CVRM']) {
        if (!watalsTekst.includes(stuk)) {
          throw new Error(`${stam}: "${stuk}" ontbreekt in de wat-als-kaart\n  ${watalsTekst.slice(0, 300)}`)
        }
      }
      console.log(`${''.padEnd(26)} wat als: 10 kg -> ${opTien.straks}% van ${opNul.nu}%, `
        + 'beide stappen in beeld')

      /* MEE NAAR HET SPREEKUUR
         Dit is de enige tekst in deze app die het scherm verlaat. Wat er
         weggelaten wordt is weg: de lezer kan niet doorklikken en heeft de app
         niet. De voorbehouden horen dus mee te reizen, en of ze dat doen is
         alleen op het echte scherm te zien, want de kaart stelt het vel samen
         uit wat hierboven berekend is. */
      const vel = pagina.locator('.kaart').filter({ hasText: 'Mee naar het spreekuur' })
      if (!(await vel.count())) throw new Error(`${stam}: de spreekuurkaart ontbreekt`)
      await vel.first().getByText('lees eerst wat erin staat').click()
      await pagina.waitForTimeout(200)
      const tekst = await pagina.locator('#spreekuurvel').innerText()
      for (const stuk of [
        'zelf gemeten en zelf ingevoerd',    // waar het vandaan komt
        'niet de weging van vandaag',        // het gewicht is de gladde lijn
        'factor 1,3',                        // het voorbehoud bij SCORE2
        'C-index is 0,65 tot 0,72',
        'gerekend met',                      // met wélke bloeddruk
        'WAT HIER NIET IN STAAT',            // wat ontbreekt, ontbreekt niet stil
      ]) {
        if (!tekst.includes(stuk)) {
          throw new Error(`${stam}: "${stuk}" ontbreekt in het spreekuurvel`
            + `\n  ${tekst.replace(/\s+/g, ' ').slice(0, 400)}`)
        }
      }
      /* En er staat geen oordeel in. Deze app zegt nergens of een getal goed is,
         en juist in een tekst die naar een mailbox gaat is dat het verschil
         tussen informeren en behandelen. */
      for (const oordeel of ['te hoog', 'te laag', 'goed bezig', 'ongezond', 'gezond gewicht']) {
        if (tekst.toLowerCase().includes(oordeel)) {
          throw new Error(`${stam}: "${oordeel}" staat in het spreekuurvel`)
        }
      }
      console.log(`${''.padEnd(26)} spreekuurvel: ${tekst.split('\n').length} regels, `
        + 'voorbehouden mee, geen oordeel')
    }

    /* DE VOLGORDE VAN HET INZICHTSCHERM
     *
     * Het scherm beantwoordt twee vragen (wat verbruik ik, wat eet ik) en de
     * rest is verantwoording. Die volgorde is een keuze en geen toeval, en ze
     * is met een grep niet te bewaken: een kaart verplaatsen verandert geen
     * enkele tekst. Vandaar hier, op de gerenderde pagina.
     *
     * Zodra er een band is hoort "Waar je nu staat" bovenaan te staan en zakt
     * de afleiding naar onderen. Dat is precies de omkering die makkelijk
     * ongemerkt terugdraait. */
    if (tab === 'Inzicht') {
      const koppen = await pagina.locator('.kaart .eyebrow').allTextContents()
      const i = (t) => koppen.findIndex((x) => x.trim().startsWith(t))
      const staat = i('Waar je nu staat')
      const band = i('Waar de band vandaan komt')
      if (staat < 0) throw new Error(`${stam}: "Waar je nu staat" ontbreekt`)

      const kaart = pagina.locator('.kaart', { hasText: 'Waar je nu staat' }).first()
      const getallen = await kaart.locator('.trio .getal').allTextContents()
      if (getallen.length !== 3) {
        throw new Error(`${stam}: "Waar je nu staat" toont ${getallen.length} getallen, niet 3`)
      }

      /* GEEN ONMOGELIJK GETAL IN DE KOP, OOIT
       *
       * Dit is de proef waar het echt om gaat. De app toonde op een telefoon
       * "Verbruik per dag −15.786–13.652 kcal": de energiebalans klopte, de
       * bewering kon niet waar zijn. Een app die één onmogelijk getal toont is
       * op geen enkel ander getal meer te vertrouwen.
       *
       * De regel is niet "geen min in de kop" (een gewichtstrend mag negatief
       * zijn) maar: in het blok met de kerngetallen staat geen minteken vóór
       * een cijfer. Daar staan alleen kilocalorieën, en die zijn nooit negatief. */
      const kern = pagina.locator('.hero .kerngetallen')
      if (await kern.count()) {
        const tekst = await kern.first().innerText()
        if (/[-−–]\s?\d/.test(tekst.replace(/(\d)[–-](\d)/g, '$1|$2'))) {
          throw new Error(`${stam}: negatief getal in de kop: ${JSON.stringify(tekst)}`)
        }
      }

      /* DE POORT ZELF TOETSEN, EN NIET ALLEEN ZIJN GEVOLG
       *
       * De eerste versie van deze proef keek alleen of er een negatief getal in
       * de kop stond. Dat bleek niets te bewijzen: de ondergrens wordt ook
       * afgekapt op het rustverbruik, en die afkapping verbergt het minteken al.
       * Een mutant die de hele plausibiliteitspoort weghaalde kwam er dus
       * ongemerkt doorheen, de app zou weer "Wat je lichaam verbruikt: 2.195 –
       * 15.000 kcal" tonen bij gegevens die elkaar tegenspreken.
       *
       * Daarom deze regel, die aan het gevál hangt en niet aan wat er toevallig
       * op het scherm staat: in de tegenspraakopstelling mag de kop geen
       * verbruik beweren. Punt. */
      if (naam === 'tegenspraak' && kop.startsWith('Wat je lichaam verbruikt')) {
        throw new Error(`${stam}: de kop beweert een verbruik terwijl logboek en ` +
                        `weegschaal elkaar tegenspreken, ${JSON.stringify(kop)}`)
      }

      if (kop.startsWith('Wat je lichaam verbruikt')) {
        if (band >= 0 && band < staat) {
          throw new Error(`${stam}: de afleiding staat bóven "Waar je nu staat", ` +
                          JSON.stringify(koppen))
        }
        console.log(`${''.padEnd(26)} volgorde: waar-je-staat op ${staat}, afleiding op ${band}` +
                    ` · ${getallen.map((x) => x.trim()).join(' / ')}`)
      } else {
        /* Zonder bruikbaar verbruik hoort de kop te zeggen wat er aan de hand
           is, hoort het rustverbruik genoemd te worden, en hoort er geen doel
           te staan dat nergens op rust. */
        if (!/spreken elkaar tegen|Nog niet te berekenen/.test(kop)) {
          throw new Error(`${stam}: onverwachte kop zonder verbruik, ${JSON.stringify(kop)}`)
        }
        const hero = await pagina.locator('.hero').innerText()
        if (/spreken elkaar tegen/.test(kop) && !/liggend al verbruikt|rustverbruik/.test(hero)) {
          throw new Error(`${stam}: de kop meldt een tegenspraak maar noemt de grens niet`)
        }
        console.log(`${''.padEnd(26)} geen verbruik: ${JSON.stringify(kop)}` +
                    ` · ${getallen.map((x) => x.trim()).join(' / ')}`)
      }
    }

    /* De coachkaart staat alleen op Vandaag, en alleen als er een doel is. Hij
       hoort de eiwiteis te noemen én voorstellen te tonen: een kaart die wel
       rekent maar niets aanbiedt is de helft van de functie, en dat is aan een
       screenshot niet te zien.

       DE LAT, EN WAAROM HIJ HIER GEKEURD WORDT

       De kaart noemt de lat één keer bovenaan ("de lat ligt op 7,5") en daarna
       wijst elke voorstelregel zichzelf aan met "lat zakt naar" of "lat stijgt
       naar". Dat is een bewering over de richting, en die is met een grep niet
       te keuren: de oude versie zette een vlaggetje "op tempo" bij de goede
       gevallen en niets bij de rest, en dat zag er in de tekst net zo goed uit.
       Hier wordt daarom het getal uit de kop naast de getallen uit de regels
       gelegd. Draait de vergelijking in het scherm om, dan valt dit om. */
    if (tab === 'Vandaag' && naam !== 'eerste-dag') {
      const kaart = pagina.locator('.kaart', { hasText: 'Wat er nog in past' })
      if (!(await kaart.count())) throw new Error(`${stam}: coachkaart ontbreekt`)
      const zin = (await kaart.locator('p.klein').allTextContents()).join(' ')
      if (!/De lat ligt op [\d,.]+ g eiwit\s+per 100 kcal|eiwit is binnen|over je doel/.test(zin)) {
        throw new Error(`${stam}: coachkaart noemt de lat niet: ${JSON.stringify(zin)}`)
      }
      const lat = /De lat ligt op ([\d,.]+) g/.exec(zin)
      const regels = await kaart.locator('.voorstellen > * .mini').allTextContents()
      for (const r of regels) {
        const m = /lat (zakt naar|stijgt naar|blijft op) ([\d,.]+)/.exec(r)
        if (!m) {
          /* De enige regel zonder lat is er één die de ruimte precies opmaakt:
             dan is er niets meer om eiwit in te stoppen. Alles anders is een
             regel die zwijgt waar hij iets te zeggen had. */
          if (!lat || /daarna nog\s*0 kcal/.test(r)) continue
          throw new Error(`${stam}: voorstelregel noemt de lat niet, ${JSON.stringify(r)}`)
        }
        if (!lat) throw new Error(`${stam}: regel noemt een lat die de kop niet noemt, ${r}`)
        const kop = Number(lat[1].replace(',', '.'))
        const na = Number(m[2].replace(',', '.'))
        /* De richting wordt op de getoonde getallen bepaald, dus hier ook. Was
           dat niet zo, dan kon er "stijgt naar 7,3" staan onder "de lat ligt op
           7,3", waar, en voor de lezer een tegenspraak. */
        const hoort = na === kop ? 'blijft op' : na < kop ? 'zakt naar' : 'stijgt naar'
        if (m[1] !== hoort) {
          throw new Error(`${stam}: "${m[1]}" klopt niet: lat ${kop} → ${na}`)
        }
      }
      const n = await kaart.locator('.voorstellen > *').count()
      console.log(`${''.padEnd(26)} coach=${n} voorstellen` +
                  (lat ? ` · lat ${lat[1]} → ${regels.length ? regels.map((r) =>
                    (/lat (?:zakt naar|stijgt naar|blijft op) ([\d,.]+)/.exec(r) ?? [, ':'])[1]).join('/') : ':'}` : ''))
    }
  }

  /* De telefoon is het toestel waar deze app op gebruikt wordt, en met drie
     beeldpunten per punt ook de zwaarste vraag aan een foto. Dit geval bezoekt
     toch al alle tabbladen, dus de band wordt hier meteen gekeurd. */
  if (naam === 'na-vier-weken') await keurSfeerband(pagina, 3, 'telefoon 430 dpr3', 1.05)

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
      throw new Error(`${naam}: ingeklapt staat er geen band: ${JSON.stringify(kop)}`)
    }
    if (!(await tegel.locator('.conf').count())) {
      throw new Error(`${naam}: ingeklapt staat er geen graad`)
    }

    const kcal = async () => {
      const t = (await tegel.locator('.mini').first().textContent()) ?? ''
      const m = t.match(/([\d.]+) kcal/)
      if (!m) throw new Error(`${naam}: geen kcal op de maaltijdtegel: ${JSON.stringify(t)}`)
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

  /* MERKPRODUCTEN IN DE ZOEKUITSLAG

     Ze horen ónder de tabelwaarden te staan, met het teken ◈ en graad D. Dat is
     geen rangorde van belang maar van herkomst: een etiket is een opgave van de
     fabrikant. Komt dit ooit boven de tabel te staan, of krijgt het ◆, dan is de
     hele reden voor een aparte tabel weg. */
  {
    await pagina.getByLabel('Zoeken').fill('pindakaas')
    await pagina.waitForTimeout(700)
    const rijen = pagina.locator('.venster .lijst > *')
    const teksten = await rijen.allTextContents()
    const iMerk = teksten.findIndex((t) => t.includes('Pindakaas 100%'))
    if (iMerk < 0) throw new Error(`${naam}: het merkproduct staat niet in de uitslag`)

    /* De tabelregel die net zo goed bij de vraag past. Stond hier eerst
       'Tonijn', en die matchte de vraag helemaal niet. */
    /* Op de groepsnaam en niet op 'Pindakaas': elke regel begint met de letter
       van zijn graad, en beide regels heten pindakaas. De groep staat alleen bij
       een tabelwaarde. */
    const iNevo = teksten.findIndex((t) => t.includes('Hartig broodbeleg'))
    if (iNevo < 0) throw new Error(`${naam}: de tabelwaarde voor pindakaas ontbreekt`)
    /* DE RANGSCHIKKING ZELF
       'Pindakaas' is de naam van de tabelregel en staat middenin die van het
       gerecht. De tabelregel hoort dus eerst. In de oude indeling kon dat niet:
       gerechten stonden als blok boven de tabel, wat de vraag ook was. Deze
       regel valt om zodra het scherm weer emmer voor emmer gaat tonen. */
    const iGerecht = teksten.findIndex((t) => t.includes('Boterham met pindakaas'))
    if (iGerecht < 0) throw new Error(`${naam}: het gerecht ontbreekt in de uitslag`)
    if (iGerecht < iNevo) {
      throw new Error(`${naam}: het gerecht "Boterham met pindakaas" staat bóven `
        + 'de tabelregel "Pindakaas", terwijl die laatste precies zo heet')
    }
    if (iMerk < iNevo) {
      throw new Error(`${naam}: het merkproduct staat bóven de tabelwaarde`)
    }
    const rij = rijen.nth(iMerk)
    if (!(await rij.locator('.herkomst').count())) {
      throw new Error(`${naam}: het merkproduct heeft geen herkomstteken`)
    }
    const teken = (await rij.locator('.herkomst').textContent()) ?? ''
    if (teken.trim() !== '◈') {
      throw new Error(`${naam}: het merkteken is ${JSON.stringify(teken)} en geen ◈`)
    }
    if ((await rij.locator('.conf').textContent()) !== 'D') {
      throw new Error(`${naam}: een etiketwaarde hoort graad D te krijgen`)
    }
    const regel = teksten[iMerk] ?? ''
    if (!regel.includes('pak van 600 g')) {
      throw new Error(`${naam}: het verpakkingsgewicht staat er niet bij, ${JSON.stringify(regel)}`)
    }
    console.log(`${''.padEnd(26)} pindakaas: tabel op ${iNevo + 1}, gerecht op ${iGerecht + 1}, `
      + `merk ◈ op ${iMerk + 1}, op naamovereenkomst, niet per emmer`)
    await pagina.getByLabel('Zoeken').fill('')
    await pagina.waitForTimeout(300)
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
    /* DE DRIE MANIEREN STAAN BOVEN ELKAAR
     *
     * Zoeken, een foto maken en het opschrijven zijn drie manieren om hetzelfde
     * te doen. Twee ervan zaten in de kop van het beschrijfvak, onder de vouw,
     * dus wie een bord voor zich had staan moest eerst langs alle
     * zoekresultaten scrollen om bij de camera te komen.
     *
     * Dit is een volgorde en dus met een grep niet te bewaken: de knoppen
     * verplaatsen verandert hun tekst niet. Vandaar op de gerenderde pagina, en
     * met de hoogte en niet met de DOM-volgorde, een knop kan in de opmaak
     * best vóór het zoekveld staan en er op het scherm onder belanden. */
    const hoogte = async (kies) => {
      const doos = await pagina.locator(kies).first().boundingBox()
      if (!doos) throw new Error(`${naam}: ${kies} staat niet op het scherm`)
      return doos.y
    }
    const yBalk = await hoogte('.venster .zoekvak')
    for (const woord of ['Foto', 'Beschrijven']) {
      const knop = pagina.locator('.venster .ingang', { hasText: woord }).first()
      if (!(await knop.count())) throw new Error(`${naam}: er is geen ingang "${woord}"`)
      const doos = await knop.boundingBox()
      if (!doos || doos.y >= yBalk) {
        throw new Error(`${naam}: "${woord}" staat niet bóven het zoekveld ` +
                        `(${doos ? Math.round(doos.y) : '?'} tegenover ${Math.round(yBalk)})`)
      }
    }
    /* En de camera moet er echt een zijn. Een knop met het woord "Foto" die geen
       bestandsveld opent doet niets. */
    const veld = pagina.locator('.venster .ingang input[type=file]')
    const camera = await veld.count()
    if (camera !== 1) throw new Error(`${naam}: ${camera} fotovelden bij de ingangen, verwacht 1`)

    /* EN HIJ MAG DE FOTOROL NIET BUITENSLUITEN

       Hier stond `capture="environment"` op. Dat is geen voorkeur maar een
       dwang: een telefoon slaat de keuzelijst dan over en opent meteen de
       achtercamera, dus je kon alleen loggen wat op dat moment vóór je stond,
       niet het kiekje van vanmiddag, niet de foto die iemand je stuurde, niet
       het etiket dat je in de winkel fotografeerde.

       Dit is met een schermafdruk niet te zien en op een computer ook niet te
       merken: daar negeert de browser `capture` en opende het altijd al de
       bestandenkiezer. Het staat er dus als eigenschap van het veld, want dat is
       precies waar het verschil zit. */
    if (await veld.getAttribute('capture') !== null) {
      throw new Error(`${naam}: het fotoveld dwingt de camera af en sluit de fotorol uit`)
    }
    /* `accept` blijft wél staan: uit je hele fotorol alleen de foto's tonen is
       een gunst en geen beperking. */
    if (await veld.getAttribute('accept') !== 'image/*') {
      throw new Error(`${naam}: het fotoveld filtert niet meer op afbeeldingen`)
    }
    console.log(`${''.padEnd(26)} ingangen boven de balk: Foto, Beschrijven · ` +
                'foto uit de rol mag ook')

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
      throw new Error(`${naam}: de zin is niet overgenomen: ${JSON.stringify(inhoud)}`)
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

    /* En de benadering. "Lesagna" gaf tot voor kort een leeg scherm; nu komt
       Lasagne eruit, mét de regel dat er geraden is naar wat er bedoeld werd.
       Beide helften tellen: de producten zonder die regel zou net zo goed een
       gewone treffer kunnen zijn, en dan zwijgt het scherm over het raden. */
    await pagina.getByLabel('Zoeken').fill('lesagna')
    await pagina.waitForTimeout(700)
    const gezegd = pagina.locator('.venster', { hasText: 'Niets met precies die spelling' })
    if (!(await gezegd.count())) {
      throw new Error(`${naam}: "lesagna" toont een benadering zonder dat te zeggen`)
    }
    const benaderd = (await pagina.locator('.venster .lijst .knip').allTextContents())
      .find((t) => t.includes('Lasagne'))
    if (!benaderd) throw new Error(`${naam}: "lesagna" vindt geen Lasagne`)
    console.log(`${''.padEnd(26)} zoeken op "lesagna" → ${JSON.stringify(benaderd.trim())}`)

    /* De tegenproef: bij een gewone treffer hoort die regel er NIET te staan.
       Zonder deze helft zou een regel die er altijd staat er net zo uitzien. */
    await pagina.getByLabel('Zoeken').fill('tonijn')
    await pagina.waitForTimeout(700)
    if (await pagina.locator('.venster', { hasText: 'Niets met precies die spelling' }).count()) {
      throw new Error(`${naam}: "tonijn" krijgt de benaderingsregel, en dat hoort niet`)
    }

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
   van de banden van de vakken, niet de wortel daarvan, want dan zou de app
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
  if (!m) throw new Error(`dagoverzicht: geen band bij het dagtotaal: ${JSON.stringify(band)}`)
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
    if (!v) throw new Error(`dagoverzicht: vak ${i} zonder band: ${JSON.stringify(t)}`)
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
    throw new Error(`dagoverzicht: het teken heeft geen uitleg: ${JSON.stringify(titel)}`)
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

/* ------------------------------------------------- de fiets en de tabel -- */
/* Twee toevoegingen die allebei onzichtbaar konden blijven, en dat ook deden.

   `fiets_min` stond al in elke dag en kwam via de koppeling binnen, maar het
   bewegingsscherm keek er niet naar: het zei "nog 913 stappen per dag tot 8.000"
   op een dag waarop er drie kwartier gefietst was. Er is niets aan de gegevens
   veranderd om dit te repareren, alleen aan het scherm.

   En de coach stelde alleen voor uit je eigen geschiedenis. Die loopt leeg, en
   dan stond er niets. Nu komt er een tweede lijst uit de voedingsmiddelentabel,
   en die moet zijn herkomstteken dragen: ◆ voor een gemeten waarde, ◈ voor een
   etiket. Juist hier, want dit is de enige lijst waar een eiwitshake van de
   supermarkt naast een stuk vis kan staan. */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  /* De tabel onder de coach. */
  {
    const kaart = pagina.locator('.kaart', { hasText: 'Wat er nog in past' })
    await kaart.locator('text=Uit de tabel').waitFor({ timeout: 5000 })
    const rijen = kaart.locator('.lijst').last().locator('> div')
    const tekens = await rijen.locator('.herkomst').allTextContents()
    if (tekens.join('') !== '◆◈') {
      throw new Error(`uit de tabel: tekens zijn ${JSON.stringify(tekens)} en niet ◆◈`)
    }
    const eerste = (await rijen.first().innerText()).replace(/\s+/g, ' ')
    /* De portie hoort erbij te staan. "Skyr" zonder hoeveelheid is geen
       voorstel maar een categorie. */
    for (const moet of ['Skyr', 'glas van 150 g', '90 kcal', '16 g eiwit']) {
      if (!eerste.includes(moet)) throw new Error(`uit de tabel: "${moet}" ontbreekt in ${JSON.stringify(eerste)}`)
    }
    await pagina.screenshot({ path: 'gereedschap/health-uitdetabel.png' })
    console.log(`uit de tabel               ${tekens.join(' ')} · ${JSON.stringify(eerste.slice(0, 64))}`)
  }

  /* En de inspanning op het bewegingsscherm.

     `kal_dagen.fiets_min` blijft bestaan (het is de weg waarlangs de koppeling
     op de telefoon binnenkomt) en hoort mee te tellen als één matige fietsrit
     van die dag. Vier van de zeven dagen in de proefreeks hebben er 45, dus 180
     van de 150. Zou die brug wegvallen, dan staat er 0 en merkt niemand het:
     het scherm ziet er verder precies hetzelfde uit. */
  {
    await naarTab(pagina, 'Beweging')
    const kop = (await pagina.locator('.hero').innerText()).replace(/\s+/g, ' ')
    if (!/minuten inspanning/.test(kop)) {
      throw new Error(`beweging: de kop noemt de inspanning niet, ${JSON.stringify(kop.slice(0, 120))}`)
    }
    /* Op de tekst van de balk en niet op de kop: "Inspanning" staat ook in de
       uitlegteksten van andere kaarten, en `hasText` kijkt naar de hele kaart. */
    const kaart = pagina.locator('.kaart').filter({ hasText: /van 150 min/ }).first()
    const week = (await kaart.innerText()).replace(/\s+/g, ' ')
    if (!/180 van 150 min/.test(week)) {
      throw new Error(`beweging: het oude veld telt niet mee: ${JSON.stringify(week.slice(0, 160))}`)
    }
    const veld = pagina.getByLabel('Fietsminuten vandaag')
    if (!(await veld.count())) throw new Error('beweging: het oude veld is niet meer te verbeteren')

    /* DE WISSELKOERS, OP HET SCHERM EN IN WAT ER VERSTUURD WORDT

       Veertig minuten hardlopen telt voor honderdvijftig-minutennorm als
       tachtig. Dat staat als zin onder het invoervel, en het hoort als
       `intensiteit: 'zwaar'` in de database te belanden. Een scherm dat het
       eerste zegt en het tweede niet doet, valt nergens anders om. */
    const verstuurd = []
    await pagina.route('**/rest/v1/rpc/kal_rij_toevoegen', async (route) => {
      verstuurd.push(JSON.parse(route.request().postData() ?? '{}'))
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    await kaart.getByRole('button', { name: 'Hardlopen' }).click()
    /* Exact, want `getByLabel` zoekt op deelreeks: "Fietsminuten vandaag"
       bevat "minuten" en dan staan er twee velden. */
    await kaart.getByLabel('Minuten', { exact: true }).fill('40')
    await pagina.waitForTimeout(150)
    const hint = (await kaart.innerText()).replace(/\s+/g, ' ')
    if (!/40 minuten tellen als 80/.test(hint)) {
      throw new Error(`beweging: de wisselkoers staat niet op het scherm, ${JSON.stringify(hint.slice(-220))}`)
    }
    if (!/Hardlopen telt als zwaar/.test(hint)) {
      throw new Error(`beweging: de aanname noemt zichzelf niet: ${JSON.stringify(hint.slice(-220))}`)
    }
    await kaart.getByRole('button', { name: 'Toevoegen' }).click()
    await pagina.waitForTimeout(400)
    const rij = verstuurd[0]?.p_rij
    if (!rij || rij.soort !== 'rennen' || rij.minuten !== 40
        || rij.intensiteit !== 'zwaar' || rij.geschat !== true) {
      throw new Error(`beweging: er gaat iets anders naar de database, ${JSON.stringify(rij)}`)
    }

    await pagina.screenshot({ path: 'gereedschap/health-beweging-fiets.png', fullPage: true })
    const titel = (await pagina.locator('.hero h2').textContent()) ?? ''
    console.log(`inspanning                 kop=${JSON.stringify(titel)} · ${week.match(/\d+ van 150 min/)?.[0]}`
      + ` · 40′ rennen → ${rij.intensiteit}, geschat=${rij.geschat}`)
  }
  await pagina.close()
}

/* --------------------------------------------- de breedste band -- */
/* NA HET HERKENNEN KUN JE DE GROOTSTE ONZEKERHEID WEGWERKEN

   Bij herkenning uit tekst of foto is niet het herkennen de zwakke schakel maar
   de portie, zie VERANTWOORDING.md §18.6. Je kon zo'n regel wel weggooien en
   niet aanscherpen. Nu krijgt de regel met de breedste band een weegveld.

   Deze proef doet de hele weg: de herkenning wordt onderschept met twee regels
   waarvan er één een brede band heeft, en dan wordt er echt een gewicht
   ingetikt. Waar het om gaat is wat er daarna staat, een smallere band, maar
   géén kaal getal, want de tabel blijft zijn eigen marge houden. */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')

  /* De herkenning is een edge function en niet een rpc, dus hij heeft zijn eigen
     onderschepping nodig. Twee regels: een appel met een smalle band, en een
     tajine met een brede. Het veld hoort bij de tajine te staan. */
  await pagina.route('**/functions/v1/kal-ai', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      model: 'proef', ms: 1200, opmerking: '', referentieobject: null,
      regels: [
        { naam: 'Appel', moment: 'diner', hoeveelheid: 1, eenheid: 'stuk',
          gram_equivalent: 120, kcal_punt: 95, kcal_laag: 88, kcal_hoog: 102,
          eiwit_g: 0.5, vet_g: 0.3, koolhydraat_g: 22, vezel_g: 2.4,
          conf: 'C', onzekerheidsbronnen: [], bron: 'tekst-ai',
          nevo_code: '9001', nevo_naam: 'Appel rauw',
          gram_laag: 110, gram_hoog: 135, ai_model: 'proef' },
        { naam: 'Tajine met kip', moment: 'diner', hoeveelheid: 1, eenheid: 'portie',
          gram_equivalent: 400, kcal_punt: 720, kcal_laag: 520, kcal_hoog: 980,
          eiwit_g: 46, vet_g: 30, koolhydraat_g: 71, vezel_g: 8,
          conf: 'D', onzekerheidsbronnen: ['portie geschat', 'bereidingsvet geschat'],
          bron: 'tekst-ai', nevo_code: '1491', nevo_naam: 'Lasagne bolognese',
          gram_laag: 300, gram_hoog: 560, ai_model: 'proef' },
      ],
    }),
  }))

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.maal', { timeout: 5000 })
  /* Dezelfde weg als de invoervelproef: via het maaltijdvak, want dat is de weg
     die gelopen wordt en die het moment meteen goed zet. */
  await pagina.getByTitle('Iets toevoegen aan je diner').click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  /* Via de ingang bovenaan het vel. Die knop heette "Tekst" en zat in de kop van
     het beschrijfvak, onder de vouw; hij staat nu boven het zoekveld. De proef
     loopt de weg die gelopen wordt. */
  await pagina.getByRole('button', { name: 'Beschrijven' }).click()
  await pagina.locator('.venster textarea').fill('een bord tajine met kip en een appel')
  await pagina.getByRole('button', { name: 'Herkennen' }).click()
  await pagina.waitForSelector('.venster .kaart', { timeout: 8000 })
  await pagina.waitForTimeout(300)

  const kaart = pagina.locator('.venster .kaart', { hasText: 'Herkend' })
  const veld = pagina.getByLabel(/Gewogen gewicht van Tajine/)

  process.stdout.write('breedste band              ')
  if (!(await veld.count())) throw new Error('er staat geen weegveld bij de breedste regel')
  /* En niet bij de appel: die heeft niets te winnen, en een veld onder elke
     regel zou van dit lijstje een formulier maken. */
  if (await pagina.getByLabel(/Gewogen gewicht van Appel/).count()) {
    throw new Error('de appel krijgt ook een weegveld, en daar valt niets te winnen')
  }

  const voor = (await kaart.innerText()).replace(/\s+/g, ' ')
  await veld.fill('300')
  await pagina.getByRole('button', { name: 'Gewicht overnemen' }).click()
  await pagina.waitForTimeout(300)
  const na = (await kaart.innerText()).replace(/\s+/g, ' ')

  /* 300 van 400 gram is driekwart: 720 wordt 540, met de tabelband van acht
     procent eromheen. Dat is 497 tot 583. */
  if (!na.includes('540')) throw new Error(`het gewicht rekent niet door: ${JSON.stringify(na.slice(0, 200))}`)
  if (!/497.{0,3}583/.test(na)) throw new Error(`de band na het wegen klopt niet: ${JSON.stringify(na)}`)
  /* De kern: er blijft een band staan. Een kaal getal zou beweren dat de tabel
     exact is. */
  if (na.includes('540 540')) throw new Error('na het wegen staat er een punt in plaats van een band')
  if (!na.includes('gewogen: 300 g')) throw new Error('de weging staat niet bij de onzekerheid')
  if (!na.includes('bereidingsvet geschat')) {
    throw new Error('het bereidingsvet is weggegooid, en dat is na het wegen even onzeker')
  }
  /* En het veld is weg: er valt niets meer aan te scherpen. */
  if (await pagina.getByLabel(/Gewogen gewicht van Tajine/).count()) {
    throw new Error('het weegveld staat er nog na het wegen')
  }
  await pagina.screenshot({ path: 'gereedschap/health-gewogen.png' })
  const band = (s) => (s.match(/(\d{3})[–-](\d{3})/) ?? []).slice(1).join('–')
  console.log(`${band(voor)} → ${band(na)} kcal na wegen · band blijft`)
  await pagina.close()
}

/* --------------------------------------------- hoe deze app werkt -- */
/* De logica van deze app stond opgeschreven in HANDLEIDING.md, en dat bestand
   staat in een repo waar niemand komt die de app gebruikt. "Zodat iedereen
   begrijpt hoe het werkt" betekent dus: ook hier, achter één tik onder Profiel.

   Een venster dat opengaat maar leeg is zou met alleen een screenshot net zo
   goed slagen. Daarom wordt er gekeken naar de vier dingen die het moet dragen:
   de grondregel, de drie herkomsttekens, waarom er soms "dit lijkt erop" staat,
   en wat de app niet weet. */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Profiel')

  await pagina.getByRole('button', { name: 'Hoe deze app werkt' }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  await pagina.waitForTimeout(300)
  await pagina.screenshot({ path: 'gereedschap/health-hoewerkt.png', fullPage: true })

  const tekst = await pagina.locator('.venster').innerText()
  for (const moet of ['onzekerheid', 'gemeten', 'etiket', 'geschat', 'lijkt erop', 'niet weet']) {
    if (!tekst.toLowerCase().includes(moet)) {
      throw new Error(`de uitleg zegt niets over "${moet}"`)
    }
  }
  /* Drie tekens, niet twee en niet vier. Ze staan in dezelfde component als in
     de rest van de app, dus als er ooit een teken bij komt hoort deze proef om
     te vallen en niet stil door te lopen. */
  const tekens = await pagina.locator('.venster .tekenlijst .herkomst').allTextContents()
  if (tekens.join('') !== '◆◈◇') {
    throw new Error(`de tekens in de uitleg zijn ${JSON.stringify(tekens)} en niet ◆◈◇`)
  }

  /* Escape en niet de sluitknop: het venster ligt in een sluier die het hele
     scherm bedekt en die vangt de klik af. Zo is meteen bewezen dat die toets
     werkt. */
  await pagina.keyboard.press('Escape')
  await pagina.waitForTimeout(300)
  if (await pagina.locator('.venster').count()) throw new Error('Escape sluit de uitleg niet')

  console.log(`hoe werkt het              ${tekst.length} tekens · ${tekens.join(' ')} · Escape sluit`)
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
  /* DE SLAAPINSTRUCTIE MOET DE DUUR NOEMEN
   *
   * Hier stond "herhaal actie 1 en 2 voor Slaapanalyse", zoeken en dan Som.
   * Dat kan niet werken: slaap is een categorie en geen meetwaarde, dus
   * Bereken statistiek geeft 0. Het kwam pas aan het licht toen iemand de
   * opdracht echt had gebouwd en de database de nul weigerde.
   *
   * Een instructie die niet kán werken is erger dan een ontbrekende, want je
   * gaat bij jezelf zoeken. Deze proef houdt vast dat de stap die het wél doet
   * (de duur van de monsters optellen) er staat. */
  const vel = await pagina.locator('.venster').innerText()
  if (!/Duur|Duration/.test(vel)) {
    throw new Error('koppelvel: de slaapinstructie noemt de duur niet')
  }
  if (/Herhaal actie 1 en 2 voor.{0,40}Slaap/s.test(vel)) {
    throw new Error('koppelvel: de slaapinstructie zegt weer "herhaal actie 1 en 2"')
  }

  console.log(`koppelen                   endpoint=${JSON.stringify(url)}`)
  console.log(`                           velden=${velden.length}`)
  await pagina.close()
}

/* --------------------------------------------- het brede scherm ------------ */
/* Sinds de Medical-Intelligence-laag wordt de tabbalk boven 960 pixels een
   zijbalk, met de merknaam en een onderschrift als ::before en ::after. Die
   staan in CSS en niet in de app, dus geen enkele proef raakte ze aan, terwijl
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
     weegkaart boven de hero uit. De pagina klopt dan nog steeds: alleen de
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
    throw new Error(`breed: een dagblok is ${maten.blok}px breed, de strook is een staafdiagram geworden`)
  }
  if (maten.zijBoven == null || maten.heroBoven == null || maten.zijBoven < maten.heroBoven) {
    throw new Error(`breed: de zijkolom begint op ${maten.zijBoven} en de hero op ${maten.heroBoven}, `
      + 'de leesvolgorde staat op zijn kop')
  }
  if (maten.streepBreed != null && maten.inhoudBreed != null
      && maten.streepBreed < maten.inhoudBreed - 2) {
    throw new Error(`breed: de scheidingslijn is ${maten.streepBreed} van ${maten.inhoudBreed} px breed`)
  }
  console.log(`${''.padEnd(26)} dagblok=${maten.blok}px · zijkolom onder de hero · streep vol`)

  /* De band op de brede indeling. Hier zat de gridfout: de hero wordt vanaf
     1240 een raster van twee kolommen en de band belandde in de eerste. */
  await keurSfeerband(pagina, 1, 'breed 1440 dpr1', 1.05)
  await pagina.close()

  /* En dezelfde breedte op een scherm met twee beeldpunten per punt. Dit is de
     zwaarste vraag die de bronnen krijgen; de grens staat daarom hoger en de
     reden staat bij `keurSfeerband`. */
  {
    const retina = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2,
      locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
    })
    await retina.addInitScript(`localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proef', account: 'abdelkader' }))`)
    const rp = await retina.newPage()
    await bedienDb(rp, 28, 'afvallen')
    await rp.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await rp.waitForTimeout(1100)
    await keurSfeerband(rp, 2, 'breed 1920 dpr2', 1.15)
    await retina.close()
  }

  /* En hetzelfde scherm in het donker. De telefoon staat in het donker en het
     brede scherm heeft eigen regels voor achtergrond, schaduw en de macrotegels
, precies de plek waar een vergeten donkere variant licht op licht geeft. */
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

  /* DE GATEN TUSSEN DE KAARTEN

     Twee kolommen hébben was niet genoeg, en dat bleek pas toen iemand ernaar
     keek. Een raster geeft elk item een eigen rij, dus een korte kaart naast
     een lange laat de hoogte van de lange over als lege lucht: op Beweging een
     gat van bijna zeshonderd punten onder "Over het hele venster", op Inzicht
     eenzelfde gat onder "Te snel". De pagina klopte, de proeven stonden groen,
     en het scherm was half leeg.

     Dit meet het enige wat dat aantoont: de verticale afstand tussen twee
     kaarten die in dezelfde kolom onder elkaar staan. Die hoort de tussenruimte
     te zijn en niets meer.

     Twee dingen zijn met opzet uitgezonderd. Een kaart over de volle breedte
     (de hero, een `.duo`) breekt de stroom af, wat eronder begint staat niet
     in dezelfde kolomloop, dus daar meet afstand niets. En de laatste kaart van
     een kolom heeft geen opvolger; die leegte staat onderaan en is de prijs van
     twee kolommen, niet een gat ertussen. */
  const RUIMTE_MAX = 28
  for (const tab of ['Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']) {
    await naarTab(anderpagina, tab)
    await anderpagina.waitForTimeout(450)
    const ruimte = await anderpagina.evaluate(() => {
      const inhoud = document.querySelector('#inhoud')
      if (!inhoud) return null
      const vol = Math.round(inhoud.getBoundingClientRect().width)
      const maten = [...inhoud.children]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.height > 1 && r.width > 1)
      const overBeide = maten.filter((r) => Math.round(r.width) >= vol - 4)
      const perKolom = new Map()
      for (const r of maten.filter((x) => Math.round(x.width) < vol - 4)) {
        const k = Math.round(r.left)
        if (!perKolom.has(k)) perKolom.set(k, [])
        perKolom.get(k).push(r)
      }
      let ergste = 0
      for (const rij of perKolom.values()) {
        rij.sort((a, b) => a.top - b.top)
        for (let i = 0; i + 1 < rij.length; i++) {
          const boven = rij[i].bottom, onder = rij[i + 1].top
          if (overBeide.some((b) => b.top >= boven - 1 && b.bottom <= onder + 1)) continue
          ergste = Math.max(ergste, Math.round(onder - boven))
        }
      }
      return { ergste, kolommen: perKolom.size, kaarten: maten.length }
    })
    if (!ruimte || ruimte.kaarten < 2) throw new Error(`breed: ${tab} heeft geen kaarten om te meten`)
    if (ruimte.ergste > RUIMTE_MAX) {
      throw new Error(`breed: op ${tab} staat ${ruimte.ergste}px lege ruimte tussen twee kaarten `
        + `in dezelfde kolom, hoogstens ${RUIMTE_MAX} hoort erin te passen`)
    }
    console.log(`${''.padEnd(26)} ${tab.padEnd(11)} ${ruimte.kolommen} kolommen, `
      + `grootste gat ${ruimte.ergste}px`)
  }
  await anderpagina.close()

  /* GEEN TWEE STUKKEN TEKST OVER ELKAAR HEEN
     Een grid plaatst wat je aanwijst, en stapelt zonder klagen als je twee
     dingen dezelfde cel geeft. `.hero>.mini{grid-row:4}` wees één cel aan
     terwijl een schermkop twee `.mini`-alinea's kan hebben, en op Inzicht
     stonden ze 436 bij 17 punten over elkaar. Niets viel om: de pagina was
     geldig, de tekst stond er, en hij was onleesbaar.
     Dat is alleen met meten te zien, en alleen op een breed scherm, vandaar
     hier, en vandaar over alle zes de tabbladen en niet alleen het ene waar het
     toevallig opviel. */
  {
    const overlap = await breed.newPage()
    await bedienDb(overlap, 28, 'afvallen')
    await overlap.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await overlap.waitForTimeout(900)
    let gekeken = 0
    for (const tab of ['Vandaag', 'Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']) {
      await naarTab(overlap, tab)
      const bots = await overlap.evaluate(() => {
        const h = document.querySelector('.hero')
        if (!h) return { n: 0, botsing: null }
        const els = [...h.querySelectorAll('p, .mini, .klein, .getal, .eyebrow, h2')]
          .filter((e) => {
            const r = e.getBoundingClientRect()
            return r.height > 0 && r.width > 0 && (e.textContent || '').trim()
          })
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
          if (els[i].contains(els[j]) || els[j].contains(els[i])) continue
          const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect()
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          /* Vier punten speling: letters mogen elkaar met hun regelhoogte raken,
             vlakken van veertien punten hoog is stapelen. */
          if (oy > 4 && ox > 4) {
            return { n: els.length, botsing: {
              a: (els[i].textContent || '').trim().slice(0, 44),
              b: (els[j].textContent || '').trim().slice(0, 44),
              ox: Math.round(ox), oy: Math.round(oy) } }
          }
        }
        return { n: els.length, botsing: null }
      })
      if (bots.botsing) {
        throw new Error(`breed: op ${tab} liggen twee stukken tekst in de hero over elkaar `
          + `(${bots.botsing.ox}\u00d7${bots.botsing.oy} punten), `
          + `${JSON.stringify(bots.botsing.a)} en ${JSON.stringify(bots.botsing.b)}`)
      }
      gekeken += bots.n
    }
    console.log(`${''.padEnd(26)} hero op 1440: ${gekeken} stukken tekst, geen enkele over elkaar`)
    await overlap.close()
  }
}

/* ------------------------------------------------- wachtwoord kwijt ------ */
/* HET SCHERM DAT JE ALLEEN ZIET ALS JE VASTZIT
   De aanmeldschermen komen in geen enkel ander geval hier voorbij: de proef
   zet een sessie in localStorage en zit dus altijd binnen. Juist het scherm
   voor wie eruit ligt bleef daarmee ongezien, en dat is het scherm waar een
   fout het duurst is, want wie hem tegenkomt heeft geen andere weg meer.
   Vandaar een context zónder sessie. */
{
  const uit = await browser.newContext({
    viewport: { width: 430, height: 1180 }, deviceScaleFactor: 2,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  const pagina = await uit.newPage()
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(700)

  const kop = await pagina.locator('header h1').first().textContent()
  if (kop?.trim() !== 'BennaHealth') throw new Error(`kwijt: geen aanmeldscherm, kop=${JSON.stringify(kop)}`)
  await pagina.screenshot({ path: 'gereedschap/health-aanmelden.png' })

  /* De drie knoppen die er horen te staan. "Wachtwoord kwijt?" is er sinds
     bestand 33; zonder die knop is de herstelcode onbereikbaar en heeft het
     hele bestand geen ingang. */
  for (const naam of ['Aanmelden', 'Nieuw account']) {
    if (!(await pagina.getByRole('button', { name: naam }).count())) {
      throw new Error(`kwijt: knop "${naam}" ontbreekt op het aanmeldscherm`)
    }
  }
  const kwijtknop = pagina.getByRole('button', { name: 'Wachtwoord kwijt?' })
  if (!(await kwijtknop.count())) throw new Error('kwijt: geen ingang naar het herstelpad')

  await kwijtknop.click()
  await pagina.waitForTimeout(400)

  const kop2 = await pagina.locator('header h1').first().textContent()
  if (kop2?.trim() !== 'Wachtwoord kwijt') {
    throw new Error(`kwijt: het herstelpad opent niet, kop=${JSON.stringify(kop2)}`)
  }
  /* Drie velden: wie hier een veld vergeet levert een scherm op dat niet werkt
     en dat er wel uitziet. */
  const velden = await pagina.locator('.veld > span').allTextContents()
  const hoort = ['naam', 'herstelcode', 'nieuw wachtwoord']
  if (velden.join('|') !== hoort.join('|')) {
    throw new Error(`kwijt: velden zijn ${JSON.stringify(velden)}, verwacht ${JSON.stringify(hoort)}`)
  }
  /* De knop hoort dood te zijn tot alle drie gevuld zijn, een herstelpoging
     met een leeg veld kost een streepje op de rem. */
  const zetten = pagina.getByRole('button', { name: 'Nieuw wachtwoord zetten' })
  if (!(await zetten.isDisabled())) throw new Error('kwijt: de knop staat aan met lege velden')
  await pagina.locator('.veld input').nth(0).fill('abdelkader')
  await pagina.locator('.veld input').nth(1).fill('ENNH9-2TCNU-X7XLB-VM45A')
  /* DRIE MANIEREN WAAROP EEN WACHTWOORD AFVALT, EN ALLE DRIE HOREN ZE HIER
     De regel staat in `src/health/wachtwoord.ts` en wordt daar los getoetst.
     Wat hier bewezen moet worden is iets anders: dat hij het scherm ook echt
     bereikt. Een regel die alleen in een unittest bestaat houdt geen knop tegen.

     `elftekens12` is het scherpst: onder de oude eis van acht kwam die erdoor.
     Blijft de knop daarbij aan, dan draait het scherm nog op de oude regel. */
  for (const [poging, waarom] of [
    ['kort', 'te kort'],
    ['elftekens12', 'elf tekens, onder de oude eis van acht kwam dit erdoor'],
    ['wachtwoord2024', 'staat op de lijst met veelgebruikte wachtwoorden'],
    ['qwertyuiopas', 'een rechte lijn over het toetsenbord'],
  ]) {
    await pagina.locator('.veld input').nth(2).fill(poging)
    if (!(await zetten.isDisabled())) {
      throw new Error(`kwijt: de knop staat aan bij "${poging}" (${waarom})`)
    }
  }
  await pagina.locator('.veld input').nth(2).fill('zeilbootkaravaan')
  if (await zetten.isDisabled()) throw new Error('kwijt: de knop blijft uit terwijl alles gevuld is')
  await pagina.screenshot({ path: 'gereedschap/health-wachtwoord-kwijt.png' })

  await pagina.getByRole('button', { name: 'Terug' }).click()
  await pagina.waitForTimeout(300)
  const kop3 = await pagina.locator('header h1').first().textContent()
  if (kop3?.trim() !== 'BennaHealth') throw new Error('kwijt: "Terug" komt niet terug')

  console.log(`wachtwoord kwijt         3 knoppen \u00b7 3 velden \u00b7 `
    + `knop uit bij leeg en bij 4 zwakke wachtwoorden \u00b7 Terug werkt`)
  await uit.close()
}

/* ------------------------------------------------- het accountvenster ---- */
/* DE BEHEERDERSREGEL HOORT ER ALLEEN TE STAAN VOOR EEN BEHEERDER
   `kal_herstelcode_voor` bestond sinds bestand 40 maar was nergens vanuit de app
   bereikbaar, en daarmee hielp hij alleen wie de SQL-editor al openheeft, dus
   precies de persoon die hem niet nodig heeft. Bestand 41 en dit scherm maken
   dat af.

   Wat hier bewezen moet worden zijn twee dingen tegelijk, en het tweede is het
   belangrijkste: dat de regel er stáát voor een beheerder, én dat hij er niet
   staat voor een ander. Een proef die alleen het eerste doet gaat groen bij een
   knop die bij iedereen staat. */
{
  const meten = async (beheerder) => {
    const c = await browser.newContext({
      viewport: { width: 430, height: 1180 }, deviceScaleFactor: 2,
      locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
    })
    const pagina = await c.newPage()
    pagina.__beheerder = beheerder
    await bedienDb(pagina, 28, 'afvallen')
    await pagina.addInitScript(() => {
      localStorage.setItem('kalibratie.sessie',
        JSON.stringify({ token: 'proeftoken', account: 'abdelkader' }))
    })
    await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(700)
    /* Het accountvenster hangt aan de ronde knop met de initialen, rechtsboven
       in de kop. Er is geen tabblad voor. */
    await pagina.getByRole('button', { name: /^Account van/ }).click()
    await pagina.waitForTimeout(500)

    const eigen = await pagina.getByRole('button', { name: 'Herstelcode maken', exact: true }).count()
    const wijzig = await pagina.getByRole('button', { name: 'Wachtwoord wijzigen', exact: true }).count()
    const ander = await pagina
      .getByRole('button', { name: 'Herstelcode voor iemand anders', exact: true }).count()
    return { pagina, c, eigen, wijzig, ander }
  }

  const gewoon = await meten(false)
  const baas = await meten(true)

  /* De twee regels die er voor iedereen horen te staan. Staan die er niet, dan
     is het venster stuk en zegt het verschil hieronder niets. */
  for (const [wie, uit] of [['gewoon', gewoon], ['beheerder', baas]]) {
    if (uit.eigen !== 1) throw new Error(`account (${wie}): "Herstelcode maken" ontbreekt`)
    if (uit.wijzig !== 1) throw new Error(`account (${wie}): "Wachtwoord wijzigen" ontbreekt`)
  }
  if (gewoon.ander !== 0) {
    throw new Error('account: de beheerdersregel staat er voor wie geen beheerder is')
  }
  if (baas.ander !== 1) {
    throw new Error('account: de beheerdersregel ontbreekt voor een beheerder')
  }

  /* En het formulier erachter. De tekst die eerlijk is over wat dit is hoort
     erin te staan; verdwijnt die, dan belooft het scherm iets dat niet waar is. */
  await baas.pagina.getByRole('button', { name: 'Herstelcode voor iemand anders', exact: true }).click()
  await baas.pagina.waitForTimeout(300)
  /* `exact` is hier nodig en niet netjesheid: Playwright zoekt op deelreeks, en
     "Herstelcode maken" van het blok erboven bevat "Code maken". Zonder exact
     vindt hij er twee en valt de proef om op iets dat niets met het scherm te
     maken heeft. */
  const knop = baas.pagina.getByRole('button', { name: 'Code maken', exact: true })
  if (!(await knop.isDisabled())) throw new Error('account: "Code maken" staat aan met lege velden')
  const uitleg = await baas.pagina.locator('.venster').innerText()
  if (!/zou hem ook zelf kunnen gebruiken/.test(uitleg)) {
    throw new Error('account: de waarschuwing over de eigen inzage staat er niet')
  }
  const velden = await baas.pagina.locator('.veld > span').allTextContents()
  if (!velden.includes('voor welk account') || !velden.includes('je eigen wachtwoord')) {
    throw new Error(`account: velden zijn ${JSON.stringify(velden)}`)
  }
  await baas.pagina.screenshot({ path: 'gereedschap/health-beheerder.png' })

  console.log(`het accountvenster        beheerdersregel: 1 voor de beheerder, 0 voor de rest · `
    + `2 eigen regels bij allebei · knop uit bij leeg · waarschuwing staat er`)
  await gewoon.c.close()
  await baas.c.close()
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
     hero hem vanzelf al klein, daar bewees de proef dus niets. Tussen 960 en
     1100 staat de hero op één kolom en heeft de strook de volle breedte, en
     precies daar wordt het een staafdiagram als het maximum ontbreekt. */
  if (breedte >= 960) {
    const blok = await pagina.evaluate(() => {
      const i = document.querySelector('.strook > i')
      return i ? Math.round(i.getBoundingClientRect().width) : null
    })
    if (blok == null || blok > 30) {
      throw new Error(`${breedte}px: een dagblok is ${blok}px breed: de strook is een staafdiagram`)
    }
    strookmaten.push(`${breedte}px→${blok}px`)

    /* En of de inhoud niet ónder de zijbalk begint. De zijbalk staat vast en de
       inhoud houdt afstand met padding; die twee getallen staan los van elkaar
       in de stijl en kunnen dus uit elkaar lopen. Gebeurt dat, dan valt de
       linkerrand van elke kaart weg achter de balk, geen foutmelding, alleen
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
        + `loopt tot ${rand?.navRechts}, de kaarten liggen eronder`)
    }
    if (rand.navHoog < rand.viewport - 2) {
      throw new Error(`${breedte}px: de zijbalk is ${rand.navHoog} hoog in een venster van `
        + `${rand.viewport}, hij loopt niet door`)
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

/* HET RAAMPJE WAARIN DE OPZETPAGINA VERSCHEEN
   ------------------------------------------------------------------------
   De sessie komt uit localStorage en is er meteen; `kal_ophalen` doet er even
   over. Zolang de app die twee niet uit elkaar hield, las hij een profiel dat er
   nog niet was als "deze gebruiker is nieuw" en zette hij de opzetpagina neer,
   die daarna vanzelf weer verdween. Op die pagina staan twee knoppen die een
   profiel zetten en de augustusreeks kunnen inladen.

   Hier wordt het ophalen expres een seconde opgehouden, zodat dat raampje wijd
   openstaat en te zien is wat erin gebeurt. Er hoort een wachtregel te staan en
   géén "Eerste keer". */
{
  const traag = await ctx.newPage()
  await bedienDb(traag, 28, 'afvallen')
  await traag.route('**/rest/v1/rpc/kal_ophalen', async (route) => {
    await new Promise((r) => setTimeout(r, 1000))
    await route.fallback()
  })
  await traag.goto(`http://localhost:${poort}/health/`)
  await traag.waitForTimeout(400)

  const wacht = await traag.locator('text=Je gegevens ophalen').count()
  const eerste = await traag.locator('h1', { hasText: 'Eerste keer' }).count()
  if (eerste) throw new Error('tijdens het ophalen staat de opzetpagina er, één tik en je profiel is weg')
  if (!wacht) throw new Error('tijdens het ophalen staat er niets; een leeg scherm zegt ook niets')

  /* En daarna hoort de gewone app er te staan. Zonder deze helft zou een scherm
     dat voor eeuwig "ophalen" zegt er net zo goed uitzien. */
  await traag.waitForSelector('.hero', { timeout: 5000 })
  const kop = await traag.locator('.hero h2').textContent()
  console.log(`traag ophalen              wachtregel=ja · opzetpagina=nee · daarna kop=${JSON.stringify(kop)}`)
  await traag.close()
}

/* ------------------------------------------------------------- het contrast -- */
/* LEESBAARHEID IS EEN GETAL, GEEN INDRUK
 *
 * De stilste kleur van de app, --dim, droeg de kleinste tekst: 0,75 rem, en
 * daar staan juist de onzekerheidsbanden in. In een app waarvan de stelregel
 * "geen getal zonder zijn onzekerheid" is, stond de onzekerheid dus in de
 * slechtst leesbare kleur die er was, 2,71 op een lichte kaart, waar 4,5 de
 * norm is.
 *
 * Dat is met een palettabel half te controleren, en die helft is de makkelijke.
 * Wat een tabel niet ziet: tekst die op een verloop staat. De hero heeft er vier
 * en daar staat ook .mini. Deze proef leest daarom van het scherm zelf: voor elk
 * element met eigen tekst de berekende kleur, en de achtergrond door de ouders
 * omhoog te lopen tot er een ondoorzichtige is. Staat er een verloop tussen, dan
 * worden álle kleurstops eruit gehaald en moet het tegen elk daarvan kloppen,
 * want waar in het verloop de tekst valt weet je niet.
 *
 * De norm is die van WCAG AA: 4,5 voor gewone tekst, 3,0 voor grote (24 px, of
 * 18,66 px vet). Vijf tabbladen, allebei de thema's.
 */
{
  const NORM = 4.5
  /* Een echte functie en geen tekst. Als string in een template-literal
     verdwijnt de backslash uit `\d` en `\(` (JavaScript laat een onbekende
     escape gewoon vallen) en dan leest de regex geen enkel getal meer uit
     "rgb(255, 255, 255)". De proef vond dan nul elementen en meldde groen. Dat
     is precies het soort proef dat niets bewijst, en hij kwam er alleen uit
     doordat het terugzetten van de oude kleur hem niet omver kreeg. */
  const meet = () => {
    const nums = (t) => (t.match(/-?[\d.]+/g) ?? []).map(Number)
    const kleur = (t) => { const n = nums(t); return n.length >= 3 ? n.slice(0, 3) : null }
    const dekt = (t) => { const n = nums(t); return n.length >= 3 && (n.length < 4 || n[3] >= 0.92) }
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    const L = (r) => { const [a, b, c] = r.map(lin); return 0.2126 * a + 0.7152 * b + 0.0722 * c }
    const R = (a, b) => {
      const l1 = L(a), l2 = L(b)
      const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1]
      return (h + 0.05) / (l + 0.05)
    }
    /* De achtergrond waar deze tekst werkelijk op ligt. Omhoog door de ouders
       tot er een ondoorzichtige is. Staat er een verloop tussen, dan komen álle
       kleurstops mee: waar in dat verloop de tekst valt weet je niet, dus moet
       het tegen elk ervan kloppen. */
    const achter = (el) => {
      const uit = []
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (s.backgroundImage && s.backgroundImage !== 'none') {
          for (const x of s.backgroundImage.match(/rgba?\([^)]*\)/g) ?? []) {
            const k = kleur(x)
            if (k && dekt(x)) uit.push(k)
          }
          if (uit.length) return uit
        }
        if (dekt(s.backgroundColor)) { uit.push(kleur(s.backgroundColor)); return uit }
      }
      return uit.length ? uit : null
    }
    const slecht = []
    let bekeken = 0
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg')) continue
      const eigen = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim())
      if (!eigen.length) continue
      const doos = el.getBoundingClientRect()
      if (doos.width < 2 || doos.height < 2) continue
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden' || Number(s.opacity) < 0.5) continue
      const vk = kleur(s.color)
      const bg = achter(el)
      if (!vk || !bg) continue
      bekeken++
      const px = parseFloat(s.fontSize)
      const groot = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700)
      const eis = groot ? 3 : 4.5
      const laagste = Math.min(...bg.map((b) => R(vk, b)))
      if (laagste < eis) {
        slecht.push({
          tekst: eigen.join(' ').slice(0, 44),
          klas: (typeof el.className === 'string' ? el.className : '') || el.tagName,
          px: Math.round(px), eis, ratio: Number(laagste.toFixed(2)),
        })
      }
    }
    return { bekeken, slecht: slecht.sort((a, b) => a.ratio - b.ratio) }
  }

  /* ------------------------------------------------ tekst op een foto -----
     WAAROM DE PROEF HIERBOVEN HIER NIET VOLDOET

     `achter()` zoekt de achtergrond door de ouders omhoog te lopen. Dat werkt
     voor een kleur en voor een verloop, en het werkt niet voor een foto: een
     `<img>` is geen achtergrond van een ouder, dus de lus loopt er dwars
     doorheen en komt uit bij de laag erachter. Sinds de hero een foto draagt
     zou die proef dus groen melden op een scherm dat onleesbaar is, precies
     het soort proef dat niets bewijst.

     Voor de hero wordt daarom niet geredeneerd maar gekeken. Een schermafdruk
     van de hero, en onder elk stukje tekst de werkelijke beeldpunten: de
     donkerste en de lichtste die er liggen. Tegen allebei moet de tekstkleur
     de norm halen, want waar in dat vlak een letter precies valt weet je niet.

     Dat is strenger dan nodig (een letter van tien punten raakt niet elk
     beeldpunt onder zijn regel) en dat is met opzet. De foto's rouleren per
     dag, dus de marge moet tegen de ongelukkigste stand kunnen en niet tegen
     de stand van vandaag. */
  const heropixels = async (pagina, waar) => {
    const hero = await pagina.$('.hero')
    if (!hero) return []
    const doos = await hero.boundingBox()
    if (!doos) return []

    const vakken = await pagina.evaluate(() => {
      const nums = (t) => (t.match(/-?[\d.]+/g) ?? []).map(Number)
      const uit = []
      for (const el of document.querySelectorAll('.hero *')) {
        if (el.closest('svg')) continue
        const eigen = [...el.childNodes]
          .filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim())
        if (!eigen.length) continue
        const r = el.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) continue
        const st = getComputedStyle(el)
        if (st.visibility === 'hidden' || Number(st.opacity) < 0.5) continue
        const k = nums(st.color)
        if (k.length < 3) continue
        const px = parseFloat(st.fontSize)
        uit.push({
          tekst: eigen.join(' ').slice(0, 44),
          klas: (typeof el.className === 'string' ? el.className : '') || el.tagName,
          kleur: k.slice(0, 3), px,
          groot: px >= 24 || (px >= 18.66 && Number(st.fontWeight) >= 700),
          doos: { x: r.x, y: r.y, w: r.width, h: r.height },
        })
      }
      return uit
    })

    /* DE TEKST GAAT ERAF VOORDAT ER GEMETEN WORDT

       Eerst nam deze proef het vijfde en het vijfennegentigste honderdste van de
       helderheid binnen elk tekstvak, in de veronderstelling dat de letters
       daarmee wegvielen. Dat was mis, en de diagnose wees het meteen aan: bij de
       titel in het donkere thema was de tekstkleur 0,90 helder en het
       vijfennegentigste honderdste 0,905. De proef mat dus de letters en noemde
       dat de ondergrond, en kwam op een verhouding van 1,00 uit, tekst die
       precies zo licht is als zichzelf.

       Letters kunnen makkelijk meer dan vijf procent van hun eigen vak beslaan,
       dus geen enkel honderdste is veilig. Nu gaat de tekst er echt af: alles in
       de hero onzichtbaar behalve de foto en de waas, één afdruk, en dan ligt er
       onder elk vak alleen nog ondergrond. Daarna gaat de tekst weer aan.

       `visibility` en niet `display`: de vakken moeten op hun plek blijven staan,
       anders meet ik straks op coördinaten die niet meer bestaan. */
    /* Via de CSSOM en niet via een stijlblad: de proef draait achter de echte
       CSP-headers, en die staat geen los `<style>` toe. `el.style.x = ...` valt
       daar niet onder, dat is geen inline stijl in de zin van de policy. Dit
       viel om op de proef zelf en niet op een gedachte. */
    const verstopt = () => {
      const uit = []
      for (const el of document.querySelectorAll('.hero > *')) {
        if (el.classList.contains('herofoto') || el.classList.contains('herowaas')
            || el.classList.contains('heroglans')) continue
        uit.push([el, el.style.visibility])
        el.style.visibility = 'hidden'
      }
      window.__terug = uit
      return uit.length
    }
    const weg = await pagina.evaluate(verstopt)
    if (!weg) throw new Error(`heropixels: niets te verbergen in de hero op ${waar}`)
    const plaat = await hero.screenshot({ type: 'png' })
    await pagina.evaluate(() => {
      for (const [el, v] of window.__terug ?? []) el.style.visibility = v
      delete window.__terug
    })

    const lees = await pagina.evaluate(async ({ b64, vakken, oorsprong }) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      c.getContext('2d').drawImage(img, 0, 0)
      const g = c.getContext('2d')
      const f = img.naturalWidth / oorsprong.width
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
      const L = (r) => 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2])
      const R = (a, b) => {
        const [h, l] = L(a) > L(b) ? [L(a), L(b)] : [L(b), L(a)]
        return (h + 0.05) / (l + 0.05)
      }
      const grijs = (l) => {
        const g8 = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055
        const v = Math.round(Math.min(255, Math.max(0, g8 * 255)))
        return [v, v, v]
      }
      const slecht = []
      let bekeken = 0
      for (const v of vakken) {
        const x = Math.max(0, Math.round((v.doos.x - oorsprong.x) * f))
        const y = Math.max(0, Math.round((v.doos.y - oorsprong.y) * f))
        const w = Math.min(c.width - x, Math.round(v.doos.w * f))
        const h = Math.min(c.height - y, Math.round(v.doos.h * f))
        if (w < 1 || h < 1) continue
        const px = g.getImageData(x, y, w, h).data
        /* Nu de letters weg zijn telt het uiterste, en niet een honderdste: de
           donkerste en de lichtste plek waar een letter op kan vallen. */
        let min = 1, max = 0
        for (let i = 0; i < px.length; i += 4) {
          const l = L([px[i], px[i + 1], px[i + 2]])
          if (l < min) min = l
          if (l > max) max = l
        }
        bekeken++
        const eis = v.groot ? 3 : 4.5
        const laagste = Math.min(R(v.kleur, grijs(min)), R(v.kleur, grijs(max)))
        if (laagste < eis) {
          slecht.push({ tekst: v.tekst, klas: v.klas, px: Math.round(v.px), eis,
                        ratio: Number(laagste.toFixed(2)),
                        diag: `tekst rgb(${v.kleur}) onder ${min.toFixed(3)}..${max.toFixed(3)}` })
        }
      }
      return { bekeken, slecht }
    }, { b64: plaat.toString('base64'), vakken, oorsprong: doos })
    if (!lees.bekeken) throw new Error(`heropixels: nul stukken tekst gemeten op ${waar}`)
    fotoGemeten += lees.bekeken
    return lees.slecht.map((x) => ({ ...x, waar: `${waar} (beeldpunten)` }))
  }

  const gezien = []
  let bekeken = 0
  let fotoGemeten = 0
  for (const [schema, keuze] of [['dark', null], ['light', null]]) {
    const pagina = await ctx.newPage()
    await pagina.emulateMedia({ colorScheme: schema })
    if (keuze) await pagina.addInitScript(`localStorage.setItem('kalibratie.thema', '${keuze}')`)
    await bedienDb(pagina, 28, 'afvallen')
    await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await pagina.waitForSelector('.hero', { timeout: 5000 })
    for (const tab of ['Vandaag', 'Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']) {
      await naarTab(pagina, tab)
      const uit = await pagina.evaluate(meet)
      bekeken += uit.bekeken
      for (const x of uit.slecht) gezien.push({ ...x, waar: `${schema}/${tab}` })
      /* En op de hero: de beeldpunten zelf, want daar liggen verlopen. */
      for (const x of await heropixels(pagina, `${schema}/${tab}`)) gezien.push(x)
    }
    await pagina.close()
  }
  if (gezien.length) {
    const lijst = gezien.slice(0, 10).map(
      (x) => `  ${x.ratio} (eis ${x.eis}) · ${x.waar} · ${x.px}px · ${x.klas} · ${JSON.stringify(x.tekst)}${x.diag ? " · " + x.diag : ""}`)
    throw new Error(`contrast: ${gezien.length} stuk(ken) tekst onder de norm\n${lijst.join('\n')}`)
  }
  /* Een proef die niets bekeek meldt ook groen. Dat is deze proef één keer
     overkomen, dus telt hij nu hoeveel tekst hij werkelijk gemeten heeft. */
  if (bekeken < 300) throw new Error(`contrast: maar ${bekeken} stukken tekst bekeken, dat klopt niet`)
  /* Ook deze telt wat hij werkelijk gezien heeft. Verdwijnt de foto uit de
     hero, of raakt de klasse `metfoto` zoek, dan meet dit stuk niets meer en
     hoort dat op te vallen in plaats van stil groen te blijven. */
  if (fotoGemeten < 40) {
    throw new Error(`heropixels: maar ${fotoGemeten} stukken tekst op de hero gemeten (`
                    + 'staat de hero er nog?')
  }
  console.log(`contrast                   ${bekeken} stukken tekst, zes tabbladen, ` +
              `twee thema's) alles haalt ${NORM}`)
  console.log(`heropixels                 ${fotoGemeten} stukken tekst op de hero, ` +
              'gemeten aan de beeldpunten en niet aan de kleurstops')
}

/* ------------------------------------------------------- wat vult het best -- */
/* EEN KAART DIE DICHT BEGINT MOET OOK ÉCHT NIETS DOEN
 *
 * De derde coachlaag beantwoordt een andere vraag dan de tweede: niet "waar zit
 * eiwit in" maar "waar heb ik genoeg aan". Hij begint dicht, en dat is niet
 * alleen om het scherm rustig te houden, er hangt een vraag aan de database
 * aan. De belofte is dus dat wie hem nooit opent er ook niet voor betaalt, en
 * die belofte is te tellen.
 *
 * Daarna drie dingen die aan de inhoud hangen en niet aan de plaats. Het
 * kopgetal is het aantal gram voor honderd kilocalorieën en niet de score: dat
 * eerste is een deling van twee gemeten waarden, dat tweede een schatting. De
 * vlag "uit je eigen hoek" hoort alleen bij de regel die hem verdient. En de
 * uitleg moet zeggen dat de score geschat is, een lijst die zich voordoet als
 * meting is in deze app erger dan geen lijst.
 */
{
  const pagina = await ctx.newPage()
  let gevraagd = 0
  await bedienDb(pagina, 28, 'afvallen')
  /* Ná bedienDb, niet ervoor: Playwright laat de láátst geregistreerde route
     eerst aan bod komen, dus een teller die ervoor staat wordt nooit bereikt. */
  await pagina.route('**/rest/v1/rpc/kal_verzadiging', async (route) => {
    gevraagd++
    await route.fallback()
  })
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  const kaart = pagina.locator('.kaart', { hasText: 'Wat vult het best' }).first()
  if (!(await kaart.count())) throw new Error('watvult: de kaart staat er niet')
  await pagina.waitForTimeout(600)
  if (gevraagd !== 0) {
    throw new Error(`watvult: dicht en toch ${gevraagd} keer gevraagd, dan is dichtklappen gratis noch nuttig`)
  }
  /* Dicht hoort er wél te staan waaróm je hem zou openen. Een kop met niets
     eronder is een deurtje zonder bordje. */
  const dichtregel = (await kaart.locator('p.mini').first().textContent()) ?? ''
  if (!/kcal/.test(dichtregel)) {
    throw new Error(`watvult: dicht staat er geen reden om te openen, ${JSON.stringify(dichtregel)}`)
  }

  await kaart.getByRole('button', { name: 'open' }).click()
  await pagina.waitForTimeout(700)
  if (gevraagd !== 1) throw new Error(`watvult: na openen ${gevraagd} aanvragen, verwacht 1`)

  const regels = kaart.locator('.lijst > *')
  const n = await regels.count()
  if (n !== 4) throw new Error(`watvult: ${n} voorstellen, verwacht er 4`)

  /* TWEE ANTWOORDEN, GEEN RANGLIJST
   *
   * Dit is de kern van de kaart en het is precies de regel die bij een
   * verbouwing sneuvelt. Een gerecht en een opscheplepel champignons zijn niet
   * hetzelfde soort ding: de champignon wint elke ranglijst op gram per honderd
   * kilocalorieën, en dan krijgt iemand die staat te bedenken wát hij gaat
   * koken een bijgerechtenlijst terug.
   *
   * De stub is zo gekozen dat de proef hieraan hangt en niet aan de volgorde
   * die er toevallig uit komt: het gerecht met de laagste score (56) hoort nog
   * altijd boven het product met de hoogste (100) te staan. */
  const volgorde = await regels.evaluateAll(
    (els) => els.map((e) => e.textContent?.split('\n')[0]?.trim() ?? ''))
  const iLaagsteGerecht = volgorde.findIndex((t) => t.startsWith('Mercimek'))
  const iBesteProduct = volgorde.findIndex((t) => t.startsWith('Champignon'))
  if (iLaagsteGerecht < 0 || iBesteProduct < 0) {
    throw new Error(`watvult: gerecht of product ontbreekt: ${JSON.stringify(volgorde)}`)
  }
  if (iLaagsteGerecht > iBesteProduct) {
    throw new Error('watvult: het zwakste gerecht staat onder het sterkste product (' +
                    `dan is het één ranglijst geworden) ${JSON.stringify(volgorde)}`)
  }
  const koppen = await kaart.locator('p.mini').allTextContents()
  if (!koppen.some((t) => /Om te koken/.test(t))) {
    throw new Error(`watvult: geen kop "Om te koken": ${JSON.stringify(koppen)}`)
  }

  /* Het kopgetal, op de regel waar het over gaat, niet op de eerste, want dat
     is sinds de gerechten erbij kwamen een gerecht. Op elke regel hoort het
     aantal gram voor honderd kilocalorieën te staan en nergens de score: dat
     eerste is een deling van twee gemeten waarden, dat tweede een schatting. */
  const champ = (await regels.filter({ hasText: 'Champignon' }).first().innerText())
    .replace(/\s+/g, ' ')
  if (!/476 g voor 100 kcal/.test(champ)) {
    throw new Error(`watvult: het gram-getal staat niet voorop, ${JSON.stringify(champ)}`)
  }
  if (/\b100\b(?!\s*kcal)/.test(champ.replace('476 g voor 100 kcal', ''))) {
    throw new Error(`watvult: de score staat op de regel: ${JSON.stringify(champ)}`)
  }
  /* De portie hoort erbij: "een opscheplepel van 50 g, 11 kcal" is bruikbaar,
     "champignons" niet. En bij een gerecht net zo goed. */
  if (!/opscheplepel van 50 g/.test(champ) || !/11 kcal/.test(champ)) {
    throw new Error(`watvult: de portie ontbreekt: ${JSON.stringify(champ)}`)
  }
  const harira = (await regels.filter({ hasText: 'Harira' }).first().innerText())
    .replace(/\s+/g, ' ')
  if (!/193 g voor 100 kcal/.test(harira) || !/kom van 300 g/.test(harira)) {
    throw new Error(`watvult: het gerecht mist zijn getal of zijn portie, ${JSON.stringify(harira)}`)
  }

  /* De vlag hangt aan de gegevens en niet aan de plaats: precies één van de
     drie regels komt uit een hoek die deze gebruiker al eet. */
  const eigenHoek = await kaart.locator('.lijst > * .vlaggetje', { hasText: 'eigen hoek' }).count()
  if (eigenHoek !== 1) throw new Error(`watvult: ${eigenHoek} keer "uit je eigen hoek", verwacht 1`)

  /* En de eerlijkheid over wat de score is. */
  /* `innerText` geeft van een dichtgeklapte <details> alleen de samenvatting;
     de tekst staat er wel maar is verborgen. Daarom textContent. */
  const uitleg = await kaart.locator('details.uitleg').first()
    .evaluate((el) => el.textContent ?? '')
  if (!/schatting uit de samenstelling/i.test(uitleg)) {
    throw new Error('watvult: de uitleg zegt niet dat de score een schatting is')
  }
  if (!/45/.test(uitleg) || !/35/.test(uitleg) || !/20/.test(uitleg)) {
    throw new Error('watvult: de uitleg noemt de weging van de drie termen niet')
  }

  /* Als láátste, want dit opent het portievenster en dat legt zich over de
     kaart heen, elke regel die hierna nog naar de lijst kijkt vindt niets.
     En een gerecht hoort een ánder venster te openen dan een product: kal_gerecht
     kal_portiematen. Zonder deze regel zou een gerecht met een leeg
     portievenster opengaan en dat is aan de lijst niet te zien. */
  let gevraagdGerecht = 0
  await pagina.route('**/rest/v1/rpc/kal_gerecht', async (route) => {
    gevraagdGerecht++
    await route.fallback()
  })
  /* Niet op '＋' zoeken: `Knop` zet zijn `titel` als aria-label, en dat
     vervángt de zichtbare tekst. Dat de titel "Gerecht openen" is en niet
     "Portie kiezen" is meteen het tweede wat hier getoetst wordt. */
  await regels.first().getByRole('button', { name: 'Gerecht openen' }).click()
  await pagina.waitForTimeout(500)
  if (gevraagdGerecht !== 1) {
    throw new Error(`watvult: tik op een gerecht vroeg ${gevraagdGerecht} keer kal_gerecht, verwacht 1`)
  }


  console.log(`wat vult het best          dicht=0 aanvragen · open=${gevraagd} · ${n} voorstellen · ` +
              'gerechten boven producten · gerecht opent kal_gerecht')
  await pagina.screenshot({ path: 'gereedschap/health-watvult.png' })
  await pagina.close()
}

/* ------------------------------------------------------ vertel je hele dag -- */
/* HET DAGVERSLAG: ÉÉN KEER VERTELLEN, ÉÉN KEER GOEDKEUREN
 *
 * Dit vel keur je in één tik goed, en dat is precies waarom het een proef als
 * deze nodig heeft. Wat er mis kan gaan zonder dat iemand het merkt is niet dat
 * het scherm leeg blijft (dat zie je) maar dat er iets ánders wordt opgeslagen
 * dan wat er stond. Twaalf regels ziet niemand na op het aantal.
 *
 * Daarom loopt deze proef niet tot aan de knop maar tot voorbij de knop: de
 * aanroep naar kal_regels_toevoegen wordt onderschept en er wordt gekeken wat
 * erin zit. Een vel dat er goed uitziet en drie regels op 'tussendoor' wegschrijft
 * zou hier omvallen en in een schermafdruk niet.
 *
 * De herkenning stuurt vijf regels en één ervan heeft geen moment. Die hoort
 * bovenaan te staan, apart, en hij hoort NIET mee te gaan zolang hij daar staat.
 * Dat is de afspraak waar het hele vel op rust: de herkenning mag raden, maar
 * een gok die eruitziet als een zekerheid is het ergste wat dit vel kan doen.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })

  /* Wat er naar de database gaat, opgevangen in plaats van weggegooid. */
  const verstuurd = { regels: null, trainingen: [] }
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    if (fn === 'kal_regels_toevoegen') {
      verstuurd.regels = JSON.parse(route.request().postData() ?? '{}').p_regels
    }
    if (fn === 'kal_rij_toevoegen') {
      const lijf = JSON.parse(route.request().postData() ?? '{}')
      verstuurd.trainingen.push({ tabel: lijf.p_tabel, rij: lijf.p_rij })
    }
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(fn === 'kal_ophalen' ? alles(28, 'afvallen') : {}),
    })
  })

  const regel = (naam, moment, kcal, eiwit) => ({
    naam, moment, hoeveelheid: 1, eenheid: 'portie', gram_equivalent: 100,
    kcal_punt: kcal, kcal_laag: Math.round(kcal * 0.8), kcal_hoog: Math.round(kcal * 1.3),
    eiwit_g: eiwit, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'C', onzekerheidsbronnen: [], bron: 'tekst-ai',
    nevo_code: '9001', nevo_naam: naam, gram_laag: 80, gram_hoog: 130, ai_model: 'proef',
  })

  await pagina.route('**/functions/v1/kal-ai', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      model: 'proef', ms: 1400, opmerking: '', referentieobject: null,
      regels: [
        regel('Twee bruine boterhammen', 'ontbijt', 320, 10),
        regel('Broodje zalm', 'lunch', 410, 22),
        regel('Tajine met kip', 'diner', 720, 46),
        regel('Handje amandelen', 'tussendoor', 180, 6),
        /* De regel waar het om draait: het verslag zei niet wanneer. */
        regel('Glas sinaasappelsap', 'onbekend', 110, 2),
      ],
      trainingen: [
        { oefening: 'Bankdrukken', spiergroep: 'borst', sets: 3, reps: 10, gewicht_kg: 40 },
        /* En een die genoemd is zonder aantallen. Het vel hoort dat te zeggen
           en er geen gebruikelijke drie-maal-tien bij te verzinnen. */
        { oefening: 'Roeien', spiergroep: 'rug', sets: null, reps: null, gewicht_kg: null },
      ],
    }),
  }))

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  process.stdout.write('vertel je dag              ')
  await pagina.getByRole('button', { name: /vertel je hele dag/i }).click()
  await pagina.waitForSelector('.venster textarea', { timeout: 5000 })
  await pagina.locator('.venster textarea')
    .fill('Vanochtend twee bruine boterhammen, tussen de middag een broodje zalm, '
          + 'vanavond tajine. En ik heb bankgedrukt.')
  await pagina.getByRole('button', { name: 'Uitzoeken' }).click()
  await pagina.waitForSelector('.venster .kaart', { timeout: 8000 })
  await pagina.waitForTimeout(300)

  const venster = pagina.locator('.venster')
  const tekst = async () => (await venster.innerText()).replace(/\s+/g, ' ')
  const voor = await tekst()

  /* 1. De vier momenten staan er als koppen, in de volgorde van de dag, met het
        onbekende vak vooraan, dat is het enige waar nog iets van je gevraagd
        wordt. */
  const koppen = (await venster.locator('.kaart .eyebrow').allTextContents())
    .map((x) => x.trim()).filter((x) => /Ontbijt|Lunch|Diner|Tussendoor|Waar hoort dit|Getraind/.test(x))
  const verwacht = ['Waar hoort dit?', 'Ontbijt', 'Lunch', 'Diner', 'Tussendoor', 'Getraind']
  if (JSON.stringify(koppen) !== JSON.stringify(verwacht)) {
    throw new Error(`de vakken staan verkeerd: ${JSON.stringify(koppen)}`)
  }

  /* 2. Het vel zegt hoeveel er ingaat, en dat is vier van de vijf. */
  if (!/4 van 5 regels gaan erin/.test(voor)) {
    throw new Error(`het vel telt verkeerd: ${JSON.stringify(voor.slice(0, 220))}`)
  }
  if (!/1 wacht nog op een plek/.test(voor)) throw new Error('het vel meldt de losse regel niet')

  /* 3. De training zonder aantallen zegt dat, en verzint er niets bij. */
  if (!/geen aantallen genoemd/.test(voor)) {
    throw new Error('een training zonder aantallen zegt dat niet')
  }
  if (/Roeien[^×]*\d+ × \d+|Roeien[^×]*\d+ sets|Roeien[^×]*kg/.test(voor)) {
    throw new Error('er worden aantallen verzonnen bij een training die er geen had')
  }
  if (!/Bankdrukken borst · 3 × 10 · 40,0 kg/.test(voor)) {
    throw new Error(`de genoemde aantallen staan er niet: ${JSON.stringify(voor)}`)
  }

  await pagina.screenshot({ path: 'gereedschap/health-dagverslag.png', fullPage: true })

  /* 4. Nu de losse regel aanwijzen. Het vak hoort te verdwijnen en de telling
        hoort mee te lopen. */
  const losse = venster.locator('.lijst > *', { hasText: 'Glas sinaasappelsap' })
  await losse.getByRole('button', { name: 'Ontbijt' }).click()
  await pagina.waitForTimeout(200)
  const na = await tekst()
  if (/Waar hoort dit/.test(na)) throw new Error('het onbekende vak blijft staan na het aanwijzen')
  if (!/5 van 5 regels gaan erin/.test(na)) {
    throw new Error(`de telling loopt niet mee: ${JSON.stringify(na.slice(0, 220))}`)
  }

  /* 5. En dan de knop, en dan wat er werkelijk verstuurd is. Dit is het stuk
        dat een schermafdruk niet laat zien. */
  await pagina.getByRole('button', { name: 'Alles toevoegen' }).click()
  await pagina.waitForTimeout(600)

  if (!verstuurd.regels) throw new Error('er is niets naar kal_regels_toevoegen gegaan')
  if (verstuurd.regels.length !== 5) {
    throw new Error(`er gingen ${verstuurd.regels.length} regels in plaats van 5 in`)
  }
  const plek = Object.fromEntries(verstuurd.regels.map((r) => [r.naam, r.moment]))
  const hoort = {
    'Twee bruine boterhammen': 'ontbijt', 'Broodje zalm': 'lunch', 'Tajine met kip': 'diner',
    'Handje amandelen': 'tussendoor', 'Glas sinaasappelsap': 'ontbijt',
  }
  for (const [naam, m] of Object.entries(hoort)) {
    if (plek[naam] !== m) throw new Error(`${naam} ging naar ${plek[naam]} in plaats van ${m}`)
  }
  /* De voedingswaarde en de band gaan ongeschonden mee, dit is de plek waar een
     spread-fout alles op nul zou zetten zonder dat het scherm verandert. */
  const tajine = verstuurd.regels.find((r) => r.naam === 'Tajine met kip')
  if (tajine.kcal_punt !== 720 || tajine.kcal_laag !== 576 || tajine.kcal_hoog !== 936) {
    throw new Error(`de band gaat niet heel mee: ${JSON.stringify(tajine)}`)
  }
  if (tajine.bron !== 'tekst-ai' || tajine.nevo_code !== '9001') {
    throw new Error('de herkomst gaat niet mee')
  }
  if (verstuurd.trainingen.length !== 2) {
    throw new Error(`er gingen ${verstuurd.trainingen.length} trainingen in plaats van 2 in`)
  }
  const roeien = verstuurd.trainingen.find((t) => t.rij.oefening === 'Roeien')
  if (roeien.tabel !== 'training') throw new Error('de training gaat naar de verkeerde tabel')
  if (roeien.rij.sets !== null || roeien.rij.reps !== null) {
    throw new Error(`er worden aantallen weggeschreven die niemand genoemd heeft: ${JSON.stringify(roeien.rij)}`)
  }

  const eerste = `4 van 5 → 5 van 5 · ${verstuurd.regels.length} regels op `
    + `${[...new Set(verstuurd.regels.map((r) => r.moment))].sort().join('/')} · `
    + `${verstuurd.trainingen.length} oefeningen · band heel`
  await pagina.close()

  /* 6. EN NU ZONDER AANWIJZEN: DE BELOFTE WAAR HET VEL OP RUST
        Hierboven werd de losse regel eerst aangewezen, en dan gaan er vijf in.
        Dat bewijst niet dat er vier ingaan als je hem láát staan: een `naarRegels`
        die niet filtert zou hierboven niets kapotmaken. Dus nog een keer, en nu
        wordt er meteen op de knop gedrukt.

        Dit is het geval dat in het echt voorkomt. Je keurt in één tik goed, en
        het vel heeft je verteld dat er vier ingaan. Gaan er dan vijf in, dan
        staat er iets in je dag wat je nooit hebt aangewezen, en dat zou je pas
        merken als het dagtotaal er raar uitziet. */
  const tweede = await ctx.newPage()
  await tweede.emulateMedia({ colorScheme: 'light' })
  const los = { regels: null }
  await tweede.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    if (fn === 'kal_regels_toevoegen') {
      los.regels = JSON.parse(route.request().postData() ?? '{}').p_regels
    }
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(fn === 'kal_ophalen' ? alles(28, 'afvallen') : {}),
    })
  })
  await tweede.route('**/functions/v1/kal-ai', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      model: 'proef', ms: 1400, opmerking: '', referentieobject: null, trainingen: [],
      regels: [
        regel('Twee bruine boterhammen', 'ontbijt', 320, 10),
        regel('Glas sinaasappelsap', 'onbekend', 110, 2),
      ],
    }),
  }))
  await tweede.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await tweede.waitForSelector('.hero', { timeout: 5000 })
  await tweede.getByRole('button', { name: /vertel je hele dag/i }).click()
  await tweede.waitForSelector('.venster textarea', { timeout: 5000 })
  await tweede.locator('.venster textarea').fill('twee boterhammen en een glas sap')
  await tweede.getByRole('button', { name: 'Uitzoeken' }).click()
  await tweede.waitForSelector('.venster .kaart', { timeout: 8000 })
  await tweede.getByRole('button', { name: 'Alles toevoegen' }).click()
  await tweede.waitForTimeout(600)

  if (!los.regels) throw new Error('er is niets verstuurd bij de tweede doorloop')
  if (los.regels.length !== 1) {
    throw new Error(`een regel zonder moment werd tóch opgeslagen: `
                    + JSON.stringify(los.regels.map((r) => [r.naam, r.moment])))
  }
  if (los.regels[0].naam !== 'Twee bruine boterhammen') {
    throw new Error(`de verkeerde regel ging erin: ${los.regels[0].naam}`)
  }
  await tweede.close()

  console.log(`${eerste}
${''.padEnd(27)}zonder aanwijzen: 1 van 2: het sap blijft staan`)
}

/* ---------------------------------------------------------- wat je lust -- */
/* DE VOORKEUREN: HET PATROON VULT DE VINKJES EN FILTERT NIET ZELF
 *
 * Dit vel keur je één keer in en daarna bepaalt het maandenlang wat de app je
 * aanbiedt. Wat hier stil misgaat merk je nooit: je ziet een aangevinkt
 * eetpatroon en een lijst die er normaal uitziet, en je hebt geen manier om te
 * zien dat er vlees in staat.
 *
 * Deze proef loopt daarom tot voorbij de knop: hij onderschept
 * `kal_profiel_zetten` en kijkt wat er werkelijk in `instellingen.voorkeuren`
 * terechtkomt. Een vel dat de goede vinkjes toont en de verkeerde lijst opslaat
 * valt hier om en op een schermafdruk niet.
 *
 * De vier gemengde groepen zijn het eigenlijke onderwerp. Ze moeten meegaan bij
 * een eetpatroon (want ze bevatten allebei) én terug te halen zijn (want er zit
 * ook in wat je wél lust).
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })

  const bewaard = { patch: null }
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    if (fn === 'kal_profiel_zetten') {
      bewaard.patch = JSON.parse(route.request().postData() ?? '{}').p_patch
    }
    /* De gedeelde fixture heeft `instellingen: {}`, en dan kan stap 5 hieronder
       niet bewijzen dat de rest van die kolom blijft staan, dan toetst hij de
       fixture en niet de app. Hier wordt hij dus gevuld, en alleen hier: de
       olie telt mee in het model, dus dit bij alle gevallen zetten zou de
       schermafdrukken en de gouden waarden verschuiven. */
    const lijf = fn === 'kal_ophalen'
      ? (() => {
          const a = alles(28, 'afvallen')
          return { ...a, profiel: { ...a.profiel, instellingen: {
            olie_g: 25, olie_gewogen: false, melk_ml: 150, melk_soort: 'half',
            conditie: { hypertensie: true },
          } } }
        })()
      : {}
    await route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(lijf),
    })
  })

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  process.stdout.write('wat je lust                ')
  await naarTab(pagina, 'Profiel')
  await pagina.getByRole('button', { name: 'Wat je lust' }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })

  const venster = pagina.locator('.venster')
  const tekst = async () => (await venster.innerText()).replace(/\s+/g, ' ')

  /* 1. Alle zevenentwintig staan er, en er gaat niets uit voordat je iets kiest. */
  const begin = await tekst()
  if (!/27 van 27 groepen blijven over/.test(begin)) {
    throw new Error(`het vel begint niet schoon: ${JSON.stringify(begin.slice(0, 200))}`)
  }
  if (/Deze krijg je niet voorgesteld/.test(begin)) {
    throw new Error('er staat iets uit terwijl er nog niets gekozen is')
  }

  /* 2. Vegetarisch zet vlees én de vier gemengde groepen uit, en de vis. */
  await venster.getByRole('button', { name: 'Vegetarisch' }).click()
  await pagina.waitForTimeout(200)
  const na = await tekst()
  for (const g of ['Vlees en gevogelte', 'Vleeswaren', 'Vis, schaal- en schelpdieren',
                   'Samengestelde gerechten', 'Soepen', 'Hartige snacks en zoutjes',
                   'Hartig broodbeleg']) {
    if (!na.includes(g)) throw new Error(`"${g}" staat niet in het vel`)
  }
  if (!/Deze krijg je niet voorgesteld/.test(na)) {
    throw new Error('er gaat niets uit bij vegetarisch')
  }
  /* En ei en zuivel blijven: dat is het verschil met veganistisch. */
  if (!/20 van 27 groepen blijven over/.test(na)) {
    throw new Error(`de telling klopt niet na vegetarisch: `
                    + JSON.stringify((na.match(/\d+ van 27 groepen blijven over/) ?? [])[0]))
  }

  /* 3. De gemengde groepen zeggen waaróm ze eruit gaan. Zonder die zin is het
        een onverklaarde uitsluiting en gaat de gebruiker hem terugzetten zonder
        te weten wat hij daarmee binnenhaalt. */
  if (!/bevat allebei; hier staat ook wat je wél lust/.test(na)) {
    throw new Error('de gemengde groepen leggen niets uit')
  }

  /* En geen enkele groepsnaam mag afgekapt staan: je zet een vinkje om bij iets
     waarvan je de naam moet kunnen lezen. Drie chips ernaast maken dat krap, dus
     dit is precies de plek waar een naam stilletjes tot "Graanproducten en m…"
     wordt en niemand het merkt.

     Gemeten en niet gelezen: `text-overflow: ellipsis` kapt af in de opmaak en
     laat de DOM ongemoeid, dus `textContent` geeft de hele naam terug en een
     zoektocht naar "…" vindt nooit iets. Dat wás de eerste versie van deze
     proef en hij stond groen bij een scherm dat de namen wél afkapte. Wat het
     wel verraadt is de meetkunde: scrollWidth groter dan clientWidth. */
  const afgekapt = await venster.locator('.tussen > .mini').evaluateAll(
    (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent))
  if (afgekapt.length) {
    throw new Error(`groepsnamen staan afgekapt: ${JSON.stringify(afgekapt.slice(0, 3))}`)
  }

  await pagina.screenshot({ path: 'gereedschap/health-voorkeuren.png', fullPage: true })

  /* 4. Pindakaas terughalen. Dat is de hele reden dat het patroon niet zelf
        filtert: één tik, en Hartig broodbeleg staat er weer in. */
  const rij = venster.locator('.tussen', { hasText: 'Hartig broodbeleg' }).first()
  await rij.getByRole('button', { name: /Hartig broodbeleg weer voorstellen/ }).click()
  await pagina.waitForTimeout(200)
  const terug = await tekst()
  if (!/21 van 27 groepen blijven over/.test(terug)) {
    throw new Error(`terughalen telt niet mee: `
                    + JSON.stringify((terug.match(/\d+ van 27 groepen blijven over/) ?? [])[0]))
  }

  /* 5. En dan bewaren, en kijken wat er werkelijk gaat. */
  await venster.getByRole('button', { name: 'Bewaren' }).click()
  await pagina.waitForTimeout(500)

  const v = bewaard.patch?.instellingen?.voorkeuren
  if (!v) throw new Error('er is geen voorkeur naar kal_profiel_zetten gegaan')
  if (v.patroon !== 'vegetarisch') throw new Error(`patroon is ${v.patroon}`)
  for (const g of ['Vlees en gevogelte', 'Vleeswaren', 'Vis, schaal- en schelpdieren']) {
    if (!v.nooit.includes(g)) throw new Error(`"${g}" staat niet in nooit, er komt vlees door`)
  }
  if (v.nooit.includes('Hartig broodbeleg')) {
    throw new Error('het teruggehaalde broodbeleg staat toch in nooit')
  }
  if (v.nooit.includes('Eieren') || v.nooit.includes('Kaas')) {
    throw new Error('vegetarisch sluit ei of kaas uit, en dat hoort niet')
  }
  /* De rest van de instellingen mag niet sneuvelen: het is één jsonb-kolom, dus
     een patch die alleen de voorkeuren stuurt gooit de olie en de melk weg. */
  const i = bewaard.patch.instellingen
  if (i.olie_g !== 25 || i.melk_ml !== 150 || i.conditie?.hypertensie !== true) {
    throw new Error('de andere instellingen zijn uit de patch verdwenen: '
                    + JSON.stringify(i))
  }

  console.log(`27 → 20 na vegetarisch → 21 na terughalen · `
              + `${v.nooit.length} groepen bewaard, ei en kaas blijven · rest van instellingen heel`)

  /* 6. DE KEUKENS. Ze staan er alle zes, en uitzetten komt in de patch terecht.
        Dit is de enige indeling die een gerecht zelf draagt: de uitsluiting van
        bestand 36 loopt over de ingrediënten en zegt niets over "ik kook nooit
        Syrisch". */
  /* Bewaren sluit het venster: dat is het ontwerp en niet een ongelukje, dus
     hier gaat het gewoon weer open. Dit kostte een ronde: de vorige versie
     zocht de chips in een venster dat er niet meer was en vond er nul, wat er
     precies zo uitziet als "de kaart ontbreekt". */
  await pagina.getByRole('button', { name: 'Wat je lust' }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  const keukenchips = venster.locator('.kaart', { hasText: 'Welke keukens kook je' }).last()
  const chips = await keukenchips.locator('button').allInnerTexts()
  if (chips.length !== 6) throw new Error(`zes keukens verwacht, gezien: ${JSON.stringify(chips)}`)
  await keukenchips.getByRole('button', { name: 'Syrisch' }).click()
  await pagina.waitForTimeout(150)
  await venster.getByRole('button', { name: 'Bewaren' }).click()
  await pagina.waitForTimeout(400)
  const k = bewaard.patch?.instellingen?.voorkeuren?.keukens
  if (!k?.includes('syrisch')) {
    throw new Error(`de uitgezette keuken staat niet in de patch: ${JSON.stringify(k)}`)
  }
  if (k.length !== 1) throw new Error(`er gingen meer keukens uit dan aangetikt: ${JSON.stringify(k)}`)
  console.log(`                           zes keukens · syrisch uit komt in de patch`)
  await pagina.close()
}

/* ------------------------------------------------- dit nooit meer, en waar -- */
/* TWEE DINGEN DIE ELKAAR NODIG HEBBEN
 *
 * Het kruisje bij "Uit de tabel" schrijft meteen in het profiel, er is geen
 * bewaarknop, want je klikt iets weg en verwacht dat het weg is. Wat daar stil
 * mis kan gaan: de knop doet niets, of hij stuurt een patch die de rest van
 * `instellingen` wegvaagt. Allebei merk je pas weken later.
 *
 * En de regel onder de hero. "Wat je lust" zit drie tikken diep in Profiel;
 * wie het niet toevallig openslaat weet niet dat het bestaat en denkt dat de
 * app dom is. Die regel hoort er dus te staan én ergens heen te gaan.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  const bewaard = { patch: null }
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    if (fn === 'kal_profiel_zetten') {
      bewaard.patch = JSON.parse(route.request().postData() ?? '{}').p_patch
    }
    const lijf = fn === 'kal_ophalen'
      ? (() => {
          const a = alles(28, 'afvallen')
          return { ...a, profiel: { ...a.profiel, instellingen: { olie_g: 25 } } }
        })()
      : fn === 'kal_eiwitrijk'
        ? [{ nevo_code: '2731', naam: 'Cherrytomaat', portie_naam: 'handje',
             portie_gram: 80, kcal: 24, eiwit_g: 1, herkomst: 'nevo' }]
        : {}
    await route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(lijf),
    })
  })
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  process.stdout.write('dit nooit meer             ')

  /* 1. De regel onder de hero nodigt uit zolang er niets staat. */
  const hero = pagina.locator('.hero').first()
  const heroTekst = (await hero.innerText()).replace(/\s+/g, ' ')
  if (!/weten nog niet wat je lust/.test(heroTekst)) {
    throw new Error(`de hero verwijst niet naar de voorkeuren: ${JSON.stringify(heroTekst.slice(0, 120))}`)
  }

  /* 2. En hij gaat ergens heen. Een uitnodiging die nergens op klikt is een
        mededeling, en dan had hij er net zo goed niet kunnen staan. */
  await hero.getByRole('button', { name: /instellen/ }).click()
  await pagina.waitForSelector('.venster', { timeout: 5000 })
  if (!/Wat je lust/.test(await pagina.locator('.venster').innerText())) {
    throw new Error('de knop onder de hero opent niet "Wat je lust"')
  }
  await pagina.getByRole('button', { name: /sluiten|Sluiten/ }).first().click()
  await pagina.waitForTimeout(300)

  /* 3. Het kruisje bij een tabelvoorstel. */
  const rij = pagina.locator('.lijst > div', { hasText: 'Cherrytomaat' }).last()
  await rij.getByRole('button', { name: /niet meer voorstellen/ }).click()
  await pagina.waitForTimeout(500)
  const vk = bewaard.patch?.instellingen?.voorkeuren
  if (!vk?.nietProduct?.includes('2731')) {
    throw new Error(`het weggeklikte product staat niet in de patch: ${JSON.stringify(vk)}`)
  }
  /* Eén jsonb-kolom: een patch die alleen de voorkeuren stuurt gooit de olie weg. */
  if (bewaard.patch.instellingen.olie_g !== 25) {
    throw new Error('het wegklikken vaagde de rest van instellingen weg: '
                    + JSON.stringify(bewaard.patch.instellingen))
  }
  console.log(`regel onder de hero verwijst en opent · × schrijft `
              + `${vk.nietProduct.length} code in het profiel · rest van instellingen heel`)
  await pagina.close()
}

/* ---------------------------------------------------------- wat ontbreekt -- */
/* DE SUPPLETIEKAART: ZWIJGEN IS HIER NET ZO BELANGRIJK ALS SPREKEN
 *
 * Dit is de enige kaart in de app die een gezondheidsuitspraak doet zonder een
 * meting eronder: van de 2.328 producten heeft er geen één een micronutrient.
 * Wat hier stil misgaat is dus erger dan elders, want er is geen getal dat het
 * tegenspreekt.
 *
 * Twee gevallen die er hetzelfde uitzien en dat niet zijn:
 *
 *   te weinig gelogd   dan weet de app niets, en een advies zou een uitspraak
 *                      over je invoergedrag zijn die klinkt als een meting
 *   genoeg gelogd      dan is het een waarneming over je voeding
 *
 * En één die niet mag versloffen: B12 bij veganistisch is "nodig" en niet "te
 * overwegen". Naast "kan geen kwaad" zetten maakt er een suggestie van.
 */
for (const [naam, dagen, patroon, verwacht] of [
  ['te weinig gelogd', 3, 'veganistisch', 'stil'],
  ['veganistisch',    24, 'veganistisch', 'b12'],
  ['alles eet alles', 24, 'alles', 'niets'],
]) {
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })

  let gevraagd = 0
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    let lijf = {}
    if (fn === 'kal_ophalen') {
      const a = alles(28, 'afvallen')
      lijf = { ...a, profiel: { ...a.profiel, instellingen: {
        voorkeuren: { patroon, nooit: [], liever: [], minder: [] },
      } } }
    } else if (fn === 'kal_hoeken') {
      gevraagd++
      /* Alles gelogd behalve vis: dan hangt het advies alleen nog aan het
         aantal dagen, en dát is wat deze proef uit elkaar trekt. */
      lijf = { dagen, groepen: ['Vlees en gevogelte', 'Melk en melkproducten', 'Kaas',
                                'Groente', 'Fruit', 'Brood'] }
    }
    await route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(lijf),
    })
  })

  /* `Uitklap` onthoudt zijn stand in localStorage, en die is gedeeld binnen één
     browsercontext. Zonder dit staat de kaart bij het tweede geval al open
     omdat het eerste hem opendeed, en meet de proef hieronder niets.

     Alleen die ene sleutel, en niet `localStorage.clear()`: daar staat ook de
     sessie in, en die wissen logt de gebruiker uit, dan komt er helemaal geen
     scherm. Dat was de eerste versie van deze regel. */
  await pagina.addInitScript(
    () => { try { localStorage.removeItem('kalibratie.uitleg') } catch { /* mag */ } })
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  /* Dicht hoort hij niets te vragen: wie er niets aan heeft betaalt de vraag
     aan de database niet. */
  if (gevraagd !== 0) throw new Error(`${naam}: kal_hoeken wordt gevraagd terwijl de kaart dicht is`)

  const kaart = pagina.locator('.kaart', { hasText: 'Wat ontbreekt er?' }).first()
  if (!(await kaart.count())) throw new Error(`${naam}: de suppletiekaart staat er niet`)
  await kaart.getByRole('button', { name: 'open' }).click()
  await pagina.waitForTimeout(700)
  if (gevraagd !== 1) throw new Error(`${naam}: kal_hoeken ${gevraagd}× gevraagd, verwacht 1`)

  const t = (await kaart.innerText()).replace(/\s+/g, ' ')

  if (verwacht === 'stil') {
    /* DRIE DAGEN GELOGD. Er staat geen vis in de lijst, en tóch hoort er geen
       omega-3-advies te komen: dat zou gaan over hoe weinig je invulde. Wat er
       wél hoort te staan is waaróm de app zwijgt. */
    if (/Omega-3/.test(t)) throw new Error(`${naam}: er komt een advies uit drie dagen log`)
    if (!/3 van de 28 dagen/.test(t)) {
      throw new Error(`${naam}: de kaart legt niet uit waarom hij zwijgt, ${JSON.stringify(t)}`)
    }
    /* Maar B12 hoort er wél te staan: dat hangt aan je eetpatroon en niet aan
       je log, en een vinkje is er ook op een dag dat je niets invulde. */
    if (!/Vitamine B12/.test(t)) {
      throw new Error(`${naam}: B12 hangt aan het eetpatroon en hoort er te staan`)
    }
  }

  if (verwacht === 'b12') {
    if (!/Vitamine B12/.test(t)) throw new Error(`${naam}: geen B12 bij veganistisch`)
    /* Het onderscheid dat niet mag versloffen. */
    /* `.last()` en niet `.first()`: de uitklapkaart omvat de adviezen, dus een
       filter op de naam vindt er twee, de omhullende en de echte. */
    const b12 = pagina.locator('.kaart', { hasText: 'Vitamine B12' }).last()
    const vlag = (await b12.locator('.vlaggetje').innerText()).trim()
    if (vlag !== 'nodig') throw new Error(`${naam}: B12 staat als "${vlag}" en niet als "nodig"`)
    /* En omega-3 hoort er nu wél bij, want er is genoeg gelogd en er zat geen vis bij. */
    if (!/Omega-3/.test(t)) throw new Error(`${naam}: geen omega-3 terwijl er 24 dagen zonder vis zijn`)
    const omega = pagina.locator('.kaart', { hasText: 'Omega-3' }).last()
    const ovlag = (await omega.locator('.vlaggetje').innerText()).trim()
    if (ovlag !== 'te overwegen') throw new Error(`${naam}: omega-3 staat als "${ovlag}"`)
    /* Elke regel draagt zijn grond: zonder dat moet je het geloven. */
    if (!/Je gaf aan veganistisch te eten/.test(t)) throw new Error(`${naam}: B12 zonder grond`)
    if (!/28 dagen niets uit/.test(t)) throw new Error(`${naam}: omega-3 zonder grond`)
    /* En de kaart zegt zelf dat hij niet meet. */
    if (!/bevat geen vitamines en mineralen/.test(t)) {
      throw new Error(`${naam}: de kaart verzwijgt dat er niets gemeten is`)
    }
    await pagina.screenshot({ path: 'gereedschap/health-suppletie.png', fullPage: true })
  }

  if (verwacht === 'niets') {
    /* Alles eet alles, en er is vis noch niet gelogd... wel 24 dagen. Er zat
       geen vis bij, dus omega-3 mag. B12 niet. */
    if (/Vitamine B12/.test(t)) throw new Error(`${naam}: B12 bij iemand die alles eet`)
  }

  console.log(`wat ontbreekt              ${naam.padEnd(18)} ${
    [...new Set(t.match(/Vitamine B12|Omega-3|IJzer|Calcium/g) ?? [':'])].join(', ')}`)
  await pagina.close()
}

/* ----------------------------------------------------- de tekens op de balk -- */
/* DE RUITEN WAREN AL VERGEVEN
 *
 * Op de balk stonden zes losse Unicode-vormen: ◍ ◎ ◇ ◈ ✚ ⋯. Twee daarvan
 * betekenen in deze app iets: ◇ is "geschat" en ◈ is "opgave van het etiket".
 * Die staan naast élke waarde op élk scherm, en het is de kortste samenvatting
 * van waar deze app over gaat. Ze óók als tabblad gebruiken maakt van een
 * betekenisvol teken een versiering.
 *
 * Deze proef houdt twee dingen vast. Elk tabblad draagt een getekend teken, een
 * <svg> en geen letter, want een letter tekent elk toestel anders. En de ruiten
 * komen op de balk niet meer voor, terwijl ze op het scherm eronder wél moeten
 * blijven staan: zonder die tweede helft zou "haal alle herkomsttekens weg" hier
 * glansrijk doorheen komen.
 */
{
  const pagina = await ctx.newPage()
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })

  const knoppen = pagina.locator('nav.tabs button')
  const n = await knoppen.count()
  const metTeken = await pagina.locator('nav.tabs button .ic > svg').count()
  if (metTeken !== n) {
    throw new Error(`balk: ${metTeken} van de ${n} tabbladen heeft een getekend teken`)
  }
  const balktekst = await pagina.locator('nav.tabs').innerText()
  const ruit = balktekst.match(/[◇◈◆]/)
  if (ruit) throw new Error(`balk: ${ruit[0]} staat nog op de balk, die vorm is al vergeven`)

  /* En de tegenproef: de ruiten horen op het scherm zelf wél te staan. */
  const opHetScherm = await pagina.locator('.herkomst').count()
  if (opHetScherm === 0) throw new Error('balk: er staat geen enkel herkomstteken meer op het scherm')

  console.log(`de balk                    ${n} tabbladen, ${metTeken} getekende tekens, ` +
              `${opHetScherm} herkomsttekens op het scherm`)

  /* TWEE TEKENSYSTEMEN DIE ELKAAR NIET MOGEN BIJTEN
   *
   * Er lopen nu twee soorten tekens door de app. De herkomsttekens ◆ ◈ ◇ zijn
   * hetzelfde teken in drie vullingen: hoe vol de ruit staat zegt hoeveel er
   * werkelijk bekend is. De wegwijzers bij de koppen zijn lijntekeningen die
   * zeggen wát voor soort ding eronder staat.
   *
   * Ze zijn alleen uit elkaar te houden zolang ze van elkaar wegblijven, en
   * dat is met een grep niet te bewaken, een `fill` toevoegen verandert geen
   * tekst die je kunt zoeken. Vandaar hier, op de gerenderde pagina, en drie
   * regels die alle drie aan de vorm hangen en niet aan de plaats.
   */
  const grens = { koppen: 0, herkomst: 0 }
  for (const tab of ['Vandaag', 'Inzicht', 'Voeding', 'Beweging', 'Gezondheid', 'Profiel']) {
    await naarTab(pagina, tab)

    /* GEEN GEKLEURD TEKEN, NERGENS
     *
     * De huisregel is geen emoji: elk toestel tekent ze anders, en naast een
     * lijntekening staat op een iPhone ineens een gekleurd fototoestel. Die
     * regel lekte, en hij lekte op de enige plek die geen enkele proef bekeek,
     * het vergrootglas in het zoekveld van Voeding bleef staan toen dat in het
     * invoervel al vervangen was.
     *
     * Daarom hier, in de lus over alle zes de tabbladen, en niet op één scherm.
     * `\p{Emoji_Presentation}` is precies de goede zeef: hij vangt de tekens die
     * standaard in kleur getekend worden en laat de typografische met rust,
     * ＋, ↺, ›, ★ en ✓ horen hier wél thuis en zijn overal zwart. */
    const gekleurd = await pagina.evaluate(() =>
      [...new Set(document.body.innerText.match(/\p{Emoji_Presentation}/gu) ?? [])])
    if (gekleurd.length) {
      throw new Error(`${tab}: ${gekleurd.join(' ')} staat op het scherm, de huisregel is getekend`)
    }

    const uit = await pagina.evaluate(() => {
      const wegwijzers = [...document.querySelectorAll('.eyebrow svg')]
      return {
        aantal: wegwijzers.length,
        gevuld: wegwijzers.filter((s) => (s.getAttribute('fill') ?? 'none') !== 'none').length,
        ruitInKop: [...document.querySelectorAll('.eyebrow')]
          .filter((e) => /[◆◈◇]/.test(e.textContent ?? '')).length,
        tekenInHerkomst: document.querySelectorAll('.herkomst svg').length,
        herkomst: document.querySelectorAll('.herkomst').length,
        dubbel: [...document.querySelectorAll('.kaart')]
          .filter((k) => k.querySelectorAll(':scope > .eyebrow svg, :scope > * > .eyebrow svg')
            .length > 1).length,
      }
    })
    if (uit.gevuld) throw new Error(`${tab}: ${uit.gevuld} wegwijzer(s) met een vulling, ` +
                                    'gevuld is herkomst, lijn is wegwijzer')
    if (uit.ruitInKop) throw new Error(`${tab}: een ruit in een kop: die vorm is van de herkomst`)
    if (uit.tekenInHerkomst) throw new Error(`${tab}: een getekend teken op een herkomstplek`)
    if (uit.dubbel) throw new Error(`${tab}: ${uit.dubbel} kaart(en) met meer dan één wegwijzer`)
    grens.koppen += uit.aantal
    grens.herkomst += uit.herkomst
  }
  if (grens.koppen === 0) throw new Error('geen enkele wegwijzer bij een kop gevonden')
  if (grens.herkomst === 0) throw new Error('geen enkel herkomstteken meer op het scherm')
  console.log(`${''.padEnd(26)} ${grens.koppen} wegwijzers bij koppen, ` +
              `${grens.herkomst} herkomsttekens, geen vulling, geen ruit`)
  await pagina.close()

  /* Een afdruk van alleen de balk, vier keer zo scherp. De tekens zijn met de
     hand getekend en op eenentwintig pixels is een halve eenheid het verschil
     tussen een voetstap en een acht; dat moet je kunnen zíen. Vandaar een eigen
     context: de vergroting moet uit de afbeelding komen en niet uit een zoom,
     want zoom verandert de afronding en dus precies wat je wilt beoordelen. */
  const scherp = await browser.newContext({
    viewport: { width: 430, height: 900 }, deviceScaleFactor: 4,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  await scherp.addInitScript(`{
    const echt = Date; const vast = ${NU};
    class V extends echt {
      constructor(...a){ super(...(a.length ? a : [vast])) }
      static now(){ return vast }
    }
    window.Date = V;
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proef', account: 'abdelkader' }));
  }`)
  const scherpe = await scherp.newPage()
  await bedienDb(scherpe, 28, 'afvallen')
  await scherpe.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await scherpe.waitForSelector('nav.tabs', { timeout: 5000 })
  await scherpe.waitForTimeout(400)
  await scherpe.locator('nav.tabs').screenshot({ path: 'gereedschap/health-balk.png' })
  await scherp.close()
}

/* -------------------------------------------------- dag, nacht en de keuze -- */
/* TWEE WEGEN NAAR DEZELFDE NACHT
 *
 * De nachtkleuren stonden in mediaquery's. Nu kan de gebruiker kiezen, en die
 * keuze staat als `data-thema` op <html>. CSS kent geen of-constructie tussen
 * een mediaquery en een kenmerk, dus staat elk nachtblok twee keer in de stijl
 *, en dat is precies het soort verdubbeling waar over een half jaar één helft
 * van bijgewerkt wordt.
 *
 * Deze proef vergelijkt daarom niet de tekst van de stijl maar het beeld. Twee
 * keer dezelfde app, drie tabbladen diep:
 *
 *   A. toestel op nacht, geen keuze  → de mediaquery doet het werk
 *   B. toestel op dag, keuze "donker" → het kenmerk doet het werk
 *
 * Van élk element op de pagina worden zes eigenschappen gelezen. Wijkt er één
 * af, dan is er een nachtblok waarvan de tweeling achterblijft, en de proef
 * zegt welk element en welke eigenschap. Welke regel in de stijl het
 * veroorzaakt hoeft hij niet te weten.
 *
 * En de tegenproef: toestel op nacht met keuze "licht" hoort wél te verschillen.
 * Zonder die helft zou een stijl die het kenmerk volledig negeert er glansrijk
 * doorheen komen, dan zijn A en B immers ook gelijk.
 */
{
  const TABS = ['Vandaag', 'Inzicht', 'Beweging']

  /** Elk element op de pagina, met wat er aan kleur uit komt. */
  const meten = async (pagina) => {
    const uit = []
    for (const tab of TABS) {
      await naarTab(pagina, tab)
      uit.push(await pagina.evaluate(() => [...document.querySelectorAll('*')].map((el) => {
        const s = getComputedStyle(el)
        return [
          el.tagName + '.' + (typeof el.className === 'string' ? el.className : ''),
          s.backgroundColor, s.color, s.borderTopColor, s.boxShadow, s.outlineColor,
          s.backgroundImage,
        ].join(' | ')
      })))
    }
    return uit.flat()
  }

  const opzetten = async (schema, keuze) => {
    const pagina = await ctx.newPage()
    await pagina.emulateMedia({ colorScheme: schema })
    if (keuze) {
      await pagina.addInitScript(`localStorage.setItem('kalibratie.thema', ${JSON.stringify(keuze)})`)
    }
    await bedienDb(pagina, 28, 'afvallen')
    await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await pagina.waitForSelector('.hero', { timeout: 5000 })
    return pagina
  }

  const viaMedia = await opzetten('dark', null)
  const viaKenmerk = await opzetten('light', 'donker')

  /* Het kenmerk hoort er alleen te staan als er gekozen is. Staat er bij de
     grondstand `data-thema="systeem"`, dan slaat de mediaquery niet meer aan en
     licht het scherm bij elke start eerst wit op voordat JavaScript draait. */
  const grondstand = await viaMedia.evaluate(() => document.documentElement.dataset.thema ?? null)
  if (grondstand !== null) {
    throw new Error(`thema: zonder keuze staat er toch een kenmerk (${grondstand})`)
  }
  const gedwongen = await viaKenmerk.evaluate(() => document.documentElement.dataset.thema ?? null)
  if (gedwongen !== 'donker') throw new Error(`thema: het kenmerk staat op ${gedwongen}`)

  const a = await meten(viaMedia)
  const b = await meten(viaKenmerk)
  if (a.length !== b.length) {
    throw new Error(`thema: ${a.length} elementen tegenover ${b.length}, niet te vergelijken`)
  }
  const scheef = a.findIndex((x, i) => x !== b[i])
  if (scheef >= 0) {
    throw new Error('thema: de nacht via het kenmerk is niet dezelfde nacht als via het toestel\n' +
                    `  toestel: ${a[scheef]}\n  kenmerk: ${b[scheef]}`)
  }
  console.log(`dag en nacht               ${a.length} elementen gelijk in beide nachten`)
  await viaKenmerk.close()

  /* De tegenproef. Dag afdwingen op een toestel dat op nacht staat hoort een
     ánder scherm te geven, en hetzelfde scherm als een toestel dat op dag
     staat. Twee beweringen, want de eerste alleen laat een stijl door die het
     kenmerk kent en er de verkeerde kleuren aan hangt. */
  const gedwongenDag = await opzetten('dark', 'licht')
  const c = await meten(gedwongenDag)
  if (c.length === a.length && c.every((x, i) => x === a[i])) {
    throw new Error('thema: "dag" op een toestel dat op nacht staat verandert niets')
  }
  await gedwongenDag.close()

  const gewoneDag = await opzetten('light', null)
  const d = await meten(gewoneDag)
  const anders = c.findIndex((x, i) => x !== d[i])
  if (c.length !== d.length || anders >= 0) {
    throw new Error('thema: de afgedwongen dag is niet dezelfde dag als een toestel op dag\n' +
                    `  gedwongen: ${c[anders]}\n  toestel:   ${d[anders]}`)
  }
  console.log(`${''.padEnd(26)} afgedwongen dag = gewone dag, en ≠ nacht`)
  await gewoneDag.close()

  /* En de schakelaar zelf. Dat de stijl twee wegen kent zegt nog niet dat er
     een knop is die ze bewandelt. */
  await naarTab(viaMedia, 'Profiel')
  const kaart = viaMedia.locator('.kaart', { hasText: 'Dag of nacht' }).first()
  if (!(await kaart.count())) throw new Error('thema: er staat geen keuze op Profiel')
  await kaart.getByRole('button', { name: 'Dag' }).click()
  await viaMedia.waitForTimeout(400)
  const naDag = await viaMedia.evaluate(() => ({
    kenmerk: document.documentElement.dataset.thema ?? null,
    bewaard: localStorage.getItem('kalibratie.thema'),
    grond: getComputedStyle(document.body).backgroundColor,
  }))
  if (naDag.kenmerk !== 'licht') throw new Error(`thema: na "Dag" staat het kenmerk op ${naDag.kenmerk}`)
  if (naDag.bewaard !== 'licht') throw new Error('thema: de keuze wordt niet bewaard')

  await kaart.getByRole('button', { name: 'Volg het toestel' }).click()
  await viaMedia.waitForTimeout(400)
  const naSysteem = await viaMedia.evaluate(() => ({
    kenmerk: document.documentElement.dataset.thema ?? null,
    bewaard: localStorage.getItem('kalibratie.thema'),
    grond: getComputedStyle(document.body).backgroundColor,
  }))
  if (naSysteem.kenmerk !== null) throw new Error('thema: terug naar het toestel laat een kenmerk staan')
  if (naSysteem.bewaard !== null) throw new Error('thema: terug naar het toestel laat een keuze staan')
  if (naSysteem.grond === naDag.grond) {
    throw new Error(`thema: de schakelaar verandert de achtergrond niet (${naDag.grond})`)
  }
  console.log(`${''.padEnd(26)} schakelaar: dag=${naDag.grond} · toestel=${naSysteem.grond}`)

  await viaMedia.screenshot({ path: 'gereedschap/health-thema.png' })
  await viaMedia.close()
}

/**
 * DE WORK-OUTLIJST DIE EEN LIJST INSPANNINGEN WORDT
 *
 * Apple Gezondheid heeft onder "Work-outs" een lijst van posts: een duur, een
 * datum, de app die hem schreef, en een kopje dat zegt wat het was. Dat kopje
 * bepaalt hoe zwaar de minuten tellen, veertig minuten hardlopen is voor de
 * WHO-richtlijn tachtig matige minuten en veertig wandelen veertig.
 *
 * WAAROM EEN GREP HIER NIET VOLSTAAT
 *
 * Wat hier fout kan gaan is niet dat het scherm leeg blijft, dat zie je. Het is
 * dat er iets ánders wordt weggeschreven dan wat er op het scherm stond. Vier
 * dingen moeten kloppen en ze zitten elk in een andere laag:
 *
 *   het vinkje        staat uit bij krachttraining, bij een duur die geen
 *                     training kán zijn, en bij een post zonder kopje, en dat
 *                     komt uit `redenUit()` en niet uit een klasse in de HTML
 *   de soort          is te verbeteren, en een post die een soort krijgt hoort
 *                     daarmee meteen aangevinkt te staan: die tik heeft de vraag
 *                     al beantwoord
 *   de wisselkoers    het scherm noemt twee getallen, echte minuten en matige
 *                     minuten, en ze horen te verschillen zodra er iets zwaars
 *                     bij zit
 *   het versturen     wat aangevinkt staat komt als rij in
 *                     kal_inspanning_toevoegen, met de intensiteit die bij de
 *                     soort hoort en `geschat: true`
 *
 * De laatste is de enige die telt en de enige die je op een schermafdruk niet
 * ziet. Daarom loopt deze proef tot voorbij de knop: de aanroep wordt
 * onderschept en nagekeken.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')

  const { dagen: reeksdagen } = reeks(28)
  const dagA = reeksdagen[reeksdagen.length - 3].datum
  const dagB = reeksdagen[reeksdagen.length - 2].datum

  const verstuurd = { rijen: null }
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    if (route.request().url().endsWith('kal_inspanning_toevoegen')) {
      verstuurd.rijen = JSON.parse(route.request().postData() ?? '{}').p_rijen
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ toegevoegd: verstuurd.rijen.length, overgeslagen: 0 }),
      })
      return
    }
    await route.fallback()
  })

  /* Vijf posten, en elke reden om een vinkje uit te zetten komt één keer voor.
     Geen `dagen` erbij: een work-outafdruk bevat geen dagreeks, en dat is
     meteen de proef dat het blok ook zonder dagen in beeld komt. */
  await pagina.route('**/functions/v1/kal-ai', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      model: 'proef', opmerking: '', dagen: [], bronnen: [],
      activiteiten: [
        { datum: dagA, minuten: 52, soort: 'fietsen', label: 'Buiten fietsen', bron: 'Garmin', tijd: '07:12' },
        { datum: dagA, minuten: 40, soort: 'rennen', label: 'Hardlopen buiten', bron: 'Garmin', tijd: '18:40' },
        { datum: dagA, minuten: 45, soort: 'kracht', label: 'Functionele kracht', bron: 'Garmin', tijd: '20:05' },
        { datum: dagB, minuten: 14 * 60 + 22, soort: 'fietsen', label: 'Buiten fietsen', bron: 'Garmin', tijd: '00:03' },
        { datum: dagB, minuten: 31, soort: null, label: null, bron: 'Garmin', tijd: '19:05' },
      ],
    }),
  }))

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Profiel')
  await pagina.getByRole('button', { name: 'Importeren uit een andere app' }).click()
  await pagina.waitForSelector('.venster textarea', { timeout: 5000 })
  await pagina.locator('.venster textarea').fill('Work-outs uit Apple Gezondheid')
  await pagina.getByRole('button', { name: 'Uitlezen' }).click()

  const venster = pagina.locator('.venster')
  await venster.getByText('Work-outs', { exact: true }).waitFor({ timeout: 8000 })
  await pagina.waitForTimeout(200)

  process.stdout.write('work-outs                  ')

  /* 1. Vijf posten; drie vinkjes uit, elk om een eigen reden. Die reden hoort
        erbij te staan: een vinkje dat uit staat zonder uitleg is niet te
        beoordelen, en dan zet je hem uit gewoonte weer aan. */
  const vinkjes = venster.locator('input[type=checkbox]')
  if (await vinkjes.count() !== 5) {
    throw new Error(`work-outs: ${await vinkjes.count()} vinkjes in plaats van 5`)
  }
  const stand = []
  for (let i = 0; i < 5; i++) stand.push(await vinkjes.nth(i).isChecked())
  if (JSON.stringify(stand) !== JSON.stringify([true, true, false, false, false])) {
    throw new Error(`work-outs: de vinkjes staan op ${JSON.stringify(stand)}`)
  }
  let plat = (await venster.innerText()).replace(/\s+/g, ' ')
  for (const moet of [/krachttraining telt apart/, /langer dan 4 uur/, /geen soort te zien/]) {
    if (!moet.test(plat)) throw new Error(`work-outs: de reden ${moet} staat er niet\n  ${plat}`)
  }

  /* De krachtsessie is niet aan te vinken, en dat is het énige slot: er staat
     geen tweede zeef achter. Een vinkje dat je wél kunt aanzetten en dat daarna
     niets doet, is erger dan geen vinkje, dan denk je dat het meetelt. */
  if (!(await vinkjes.nth(2).isDisabled())) {
    throw new Error('work-outs: de krachtsessie is aan te vinken')
  }
  if (await vinkjes.nth(3).isDisabled() || await vinkjes.nth(4).isDisabled()) {
    throw new Error('work-outs: een post die je zelf mag beoordelen staat op slot')
  }

  /* En het slot gaat open zodra het kopje verbeterd wordt: "Functionele kracht"
     kan best een roeisessie geweest zijn. */
  await venster.getByLabel(`Soort van ${dagA} 45 min`).selectOption('roeien')
  await pagina.waitForTimeout(150)
  if (await vinkjes.nth(2).isDisabled()) {
    throw new Error('work-outs: een andere soort kiezen haalt het slot er niet af')
  }
  await venster.getByLabel(`Soort van ${dagA} 45 min`).selectOption('kracht')
  await pagina.waitForTimeout(150)
  if (!(await vinkjes.nth(2).isDisabled()) || await vinkjes.nth(2).isChecked()) {
    throw new Error('work-outs: terug naar kracht laat het vinkje aan staan')
  }

  /* 2. Twee getallen en ze verschillen: 52 + 40 = 92 gedaan, en 52 + 80 = 132
        voor de norm. Eén getal zou over een van beide liegen. */
  if (!/samen 92 minuten, en dat telt als 132 matige minuten/.test(plat)) {
    throw new Error(`work-outs: de wisselkoers staat niet in de samenvatting\n  ${plat}`)
  }

  /* 3. De post zonder kopje een soort geven beantwoordt de vraag die het vinkje
        stelde, dus hij hoort meteen aan te staan. Nog een tik vragen is een tik
        die niets toevoegt. */
  await venster.getByLabel(`Soort van ${dagB} 31 min`).selectOption('wandelen')
  await pagina.waitForTimeout(200)
  if (!(await vinkjes.nth(4).isChecked())) {
    throw new Error('work-outs: een soort kiezen vinkt de post niet aan')
  }
  plat = (await venster.innerText()).replace(/\s+/g, ' ')
  if (!/samen 123 minuten, en dat telt als 163 matige minuten/.test(plat)) {
    throw new Error(`work-outs: de samenvatting loopt niet mee\n  ${plat}`)
  }
  console.log(`5 posten · vinkjes ${stand.map((v) => v ? '✓' : '·').join('')} · 92′ → 132 matige, na de soort 123′ → 163`)

  await pagina.screenshot({ path: 'gereedschap/health-import-workouts.png' })

  /* 4. Tot voorbij de knop. Drie rijen, met de intensiteit die bij de soort
        hoort en `geschat: true`: de app heeft hem afgeleid en niet gemeten.
        De krachtsessie en de veertien uur gaan nergens heen. */
  await venster.getByRole('button', { name: 'Overnemen' }).click()
  await pagina.waitForTimeout(600)
  if (!Array.isArray(verstuurd.rijen)) throw new Error('work-outs: er is niets verstuurd')
  const kort = verstuurd.rijen.map((r) =>
    `${r.datum}/${r.soort}/${r.minuten}/${r.intensiteit}/${r.geschat}/${r.bron}`)
  const moet = [
    `${dagA}/fietsen/52/matig/true/import`,
    `${dagA}/rennen/40/zwaar/true/import`,
    `${dagB}/wandelen/31/matig/true/import`,
  ]
  if (JSON.stringify(kort) !== JSON.stringify(moet)) {
    throw new Error('work-outs: er gaat iets anders naar de database dan er op het scherm stond\n'
      + `  verstuurd: ${JSON.stringify(kort, null, 1)}\n  verwacht:  ${JSON.stringify(moet, null, 1)}`)
  }
  console.log(`${''.padEnd(26)} verstuurd: 3 rijen, de kracht en de 14 u 22 nergens`)

  await pagina.close()
}

/**
 * DE DAG DIE ER NIET WAS
 *
 * De dagenkaart wordt gebouwd uit `kal_dagen` en `kal_regels`. Een dag waarop
 * niets gemeten en niets gelogd is, staat er niet in, en daar zat de fout.
 *
 * Het bewegingsscherm nam zijn venster uit die kaart: de laatste eenentwintig
 * sleutels. Een work-outafdruk importeren schrijft alleen in `kal_inspanning`
 * en maakt geen dagrij. Je rit van zo'n dag stond dus wél in de database, kwam
 * nergens op het scherm, en telde niet mee voor de norm. Dezelfde fout als
 * `actieve_energie_kcal`, dat maandenlang netjes werd opgeslagen en door niets
 * werd gelezen, en net zo onzichtbaar, want het scherm ziet er verder precies
 * hetzelfde uit.
 *
 * Daarom een eigen reeks met een gat erin. Dat gat is het hele punt: met de
 * gewone proefgegevens, waar elke dag een rij heeft, valt hier niets te zien.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })

  const grond = alles(28, 'afvallen')
  /* Twee dagen terug bestaat niet: geen meting, geen maaltijd. Precies de
     toestand van een dag van vóór de koppeling.

     Met opzet een dag die fietsminuten hád: zo laat het totaal twee dingen
     tegelijk zien, dat de 45 van die dag wegvalt mét de dagrij, en dat de rit
     uit `kal_inspanning` er los van blijft staan. Was het een dag zonder
     fietsminuten, dan bewees het totaal maar de helft. */
  const gatdag = grond.dagen[grond.dagen.length - 3]
  const gat = gatdag.datum
  if (gatdag.fiets_min !== 45) {
    throw new Error(`gatendag: de proefreeks is veranderd: ${gat} heeft ${gatdag.fiets_min} fietsminuten`)
  }
  const gaten = {
    ...grond,
    dagen: grond.dagen.filter((d) => d.datum !== gat),
    regels: grond.regels.filter((r) => r.datum !== gat),
    /* Eén rit, op precies die dag, en zwaar zodat hij ook in de wisselkoers
       zichtbaar is: 60 echte minuten horen als 120 te tellen. */
    inspanning: [{
      id: 'proef-1', datum: gat, soort: 'rennen', eigennaam: null, minuten: 60,
      intensiteit: 'zwaar', geschat: true, bron: 'import', tijd: null, notitie: null,
    }],
  }
  await pagina.route('**/rest/v1/rpc/**', async (route) => {
    const fn = route.request().url().split('/').pop()
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(fn === 'kal_ophalen' ? gaten : {}),
    })
  })

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Beweging')

  const kaart = pagina.locator('.kaart').filter({ hasText: /van 150 min/ }).first()
  const plat = (await kaart.innerText()).replace(/\s+/g, ' ')

  /* De vier fietsdagen van de reeks leveren 180; de dag met het gat is er één
     van, dus die valt weg en er blijven er drie over: 135. Daar bovenop de rit
     van 60 zware minuten, die als 120 telt. Samen 255. */
  if (!/255 van 150 min/.test(plat)) {
    throw new Error(`gatendag: het weektotaal is niet 255: ${JSON.stringify(plat.slice(0, 200))}`)
  }
  /* En hij staat in de verdeling, in échte minuten. */
  if (!/Hardlopen 60′/.test(plat)) {
    throw new Error(`gatendag: de rit staat niet in de verdeling, ${JSON.stringify(plat.slice(0, 260))}`)
  }
  if (!/waarvan 60 zwaar/.test(plat)) {
    throw new Error(`gatendag: de zware minuten worden niet genoemd, ${JSON.stringify(plat.slice(0, 260))}`)
  }

  /* En in de lijst van drie weken staat de dag er met zijn minuten, náást de
     streepjes voor de stappen die er niet zijn. Zonder die regel is een dag
     zonder meting op dit scherm onvindbaar. */
  const weken = pagina.locator('.kaart').filter({ hasText: 'Laatste drie weken' }).first()
  const regel = weken.locator('.lijst > div').filter({ hasText: '60′' })
  if (!(await regel.count())) {
    throw new Error('gatendag: de dag zonder meting staat niet in de driewekenlijst')
  }
  const tekst = (await regel.first().innerText()).replace(/\s+/g, ' ')
  /* Een half streepje (U+2013) en niet een gedachtestreepje: dat laatste komt
     sinds de tekstnaloop nergens meer in schermtekst voor. Zie
     `src/health/schermtekst.proef.ts`. */
  if (!/–/.test(tekst)) {
    throw new Error(`gatendag: de dag toont stappen die er niet zijn: ${JSON.stringify(tekst)}`)
  }

  console.log(`gatendag                   ${gat} zonder dagrij · 135 + 60 zwaar = 255 van 150 · ${JSON.stringify(tekst)}`)
  await pagina.close()
}

/**
 * DE DRIE HEFBOMEN DIE SPIER VASTHOUDEN
 *
 * Bij snel afvallen verdwijnt er naast vet ook spier, in de substudie van
 * STEP-1 was ongeveer 45 procent van het verlies op semaglutide vetvrije massa.
 * Geen app meet dat. Wat deze kaart doet is de drie dingen naast elkaar zetten
 * waarvan bekend is dat ze het tegengaan.
 *
 * WAT HIER NIET MET EEN GREP TE ZIEN IS
 *
 * Twee dingen gaan de database in via een weg die al bestond: de stoeltest als
 * meting, de vijf vragen als vragenlijst. Dat is precies waarom deze module
 * geen enkele databasewijziging nodig had, en ook precies waarom het mis kan
 * gaan zonder dat het scherm er anders uitziet. Een stoeltest die als
 * `soort: 'middelomtrek'` wegschrijft staat er even netjes bij.
 *
 * Daarom loopt deze proef tot voorbij allebei de knoppen en kijkt hij wat er
 * verstuurd wordt.
 *
 * En één ding dat er juist níét hoort te staan: bij een eiwitdoel van 161 gram
 * is een derde daarvan 54 gram, ruim boven de drempel van dertig. De
 * waarschuwing over de verdeling hoort dan weg te blijven. Een waarschuwing die
 * bij iedereen staat, wordt door niemand gelezen.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')

  const verstuurd = []
  await pagina.route('**/rest/v1/rpc/kal_rij_toevoegen', async (route) => {
    verstuurd.push(JSON.parse(route.request().postData() ?? '{}'))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Beweging')

  const kaart = pagina.locator('.kaart').filter({ hasText: 'Wat je spieren vasthoudt' }).first()
  await kaart.waitFor({ timeout: 5000 })
  const plat = (await kaart.innerText()).replace(/\s+/g, ' ')

  process.stdout.write('spierbehoud                ')

  /* 1. De drie hefbomen staan er, in de volgorde waarin je er iets aan kunt
        doen: eiwit eerst, want dat is de enige die vandaag te veranderen valt. */
  const namen = await kaart.locator('.lijst > div .groei').allTextContents()
  const kort = namen.map((n) => n.split('  ')[0].trim().split('\n')[0])
  for (const moet of ['Eiwit per maaltijd', 'Krachttraining', 'Opstaan uit een stoel']) {
    if (!kort.some((n) => n.startsWith(moet))) {
      throw new Error(`spier: "${moet}" staat niet op de kaart, ${JSON.stringify(kort)}`)
    }
  }
  if (!kort[0].startsWith('Eiwit')) {
    throw new Error(`spier: eiwit staat niet voorop: ${JSON.stringify(kort)}`)
  }

  /* 2. De drempel staat in échte grammen, en telt alleen de hoofdmaaltijden die
        werkelijk gelogd zijn.

        De laatste dag van de proefreeks heeft alleen ontbijt en lunch, de
        toestand van iemand die 's middags kijkt. Ontbijt is havermout plus
        cappuccino: 18 + 5 = 23 gram eiwit, onder de drempel. Lunch is kaas plus
        amandelen: 24 + 6 = 30, precies erop, en precies erop telt mee.

        Dus "1 van de 2". Zou hier "2 van de 3" staan, dan telde de kaart een
        maaltijd mee die er niet was, en dat is erger dan te weinig tellen: een
        niet-gegeten diner van nul gram zou als gemiste drempel lezen. */
  if (!/1 van de 2 boven 30 g/.test(plat)) {
    throw new Error(`spier: de eiwitdrempel telt verkeerd: ${JSON.stringify(plat.slice(0, 260))}`)
  }

  /* 3. En de verdelingswaarschuwing blijft wég bij dit eiwitdoel. */
  if (/onder de 30 g waarop de spieraanmaak/.test(plat)) {
    throw new Error('spier: de verdelingswaarschuwing staat er terwijl 161/3 = 54')
  }

  /* 4. De stoeltest, tot voorbij de knop. */
  await kaart.getByRole('button', { name: 'Stoeltest doen' }).click()
  await kaart.getByRole('button', { name: 'Starten' }).click()
  /* Ruim boven de ondergrens van twee seconden. Dat die grens bestaat, kwam
     uit deze proef: de armatuur zet de klok vast, dus een stopwatch op
     `Date.now()` stond stil en er ging nul seconden de database in, en nul
     seconden las daarna als "snel". De stopwatch gebruikt nu
     `performance.now()`, die loopt door omdat hij monotoon is en niet aan de
     kalenderklok hangt. */
  await pagina.waitForTimeout(2600)
  await kaart.getByRole('button', { name: 'Klaar' }).click()
  await kaart.getByRole('button', { name: 'Bewaren' }).click()
  await pagina.waitForTimeout(400)

  const meting = verstuurd.find((v) => v.p_tabel === 'meting')?.p_rij
  if (!meting || meting.soort !== 'stoeltest' || meting.eenheid !== 's'
      || !(meting.waarde >= 2)) {
    throw new Error(`spier: de stoeltest gaat verkeerd de database in, ${JSON.stringify(meting)}`)
  }

  /* 5. De vijf vragen, met één genoemde klacht. Dat is er één, en de lage
        afkapwaarde hoort hem als signaal te bewaren, niet als "geen". Bij de
        gangbare grens van vier zou hier 'geen' staan, en dan zwijgt het scherm
        precies bij de mensen voor wie de lijst bedoeld is. */
  await kaart.getByRole('button', { name: 'Vijf vragen' }).click()
  /* Op de groep en niet op de tekst: vijf vragen met dezelfde drie antwoorden
     eronder zijn anders niet uit elkaar te houden, niet voor deze proef en
     niet voor een schermlezer. */
  const vraag = kaart.getByRole('group', { name: /tien traptreden/ })
  await vraag.getByRole('button', { name: 'enige' }).click()
  await pagina.waitForTimeout(150)
  await kaart.getByRole('button', { name: 'Bewaren' }).click()
  await pagina.waitForTimeout(400)

  const lijst = verstuurd.find((v) => v.p_tabel === 'vragenlijst')?.p_rij
  if (!lijst || lijst.soort !== 'sarcf' || lijst.score !== 1 || lijst.klasse !== 'signaal') {
    throw new Error(`spier: de vragenlijst gaat verkeerd de database in, ${JSON.stringify(lijst)}`)
  }
  if (lijst.antwoorden?.traplopen !== 1) {
    throw new Error(`spier: het antwoord komt niet mee: ${JSON.stringify(lijst.antwoorden)}`)
  }

  await pagina.screenshot({ path: 'gereedschap/health-spier.png', fullPage: true })
  console.log(`3 hefbomen · stoeltest ${meting.waarde}s → meting · 1 klacht → score ${lijst.score}, ${lijst.klasse}`)
  await pagina.close()
}

/**
 * HET BOEKJE OVER AFVALLEN
 *
 * Acht stukken, en de belofte zit in de vorm: elk stuk zegt ook wat het níét
 * weet, en dat staat in een eigen vak vóór het nut in plaats van als kleine
 * letter eronder.
 *
 * WAAROM DIT NIET MET EEN PROEF IN VITEST AF IS
 *
 * Die controleert dat het veld `nietWeten` gevuld is. Hij kan niet zien of het
 * scherm het tóónt. Een venster dat alleen `weten` rendert komt daar ongemerkt
 * doorheen, en dan staat er precies het soort tekst dat dit boekje niet wil
 * zijn: zeker klinkende beweringen zonder hun grens.
 *
 * En de grens die voor de klant het meest uitmaakt: geen enkel stuk mag een
 * getal van de lezer bevatten. Dat is niet alleen stijl. Onder MDCG 2019-11 is
 * een boekje geen medisch hulpmiddel zolang het geen patiëntgegevens verwerkt;
 * dezelfde tekst met jouw gewicht erin zou de app een categorie op schuiven waar
 * hij niet thuishoort. Deze proef leest daarom het echte scherm en zoekt naar
 * de cijfers uit de proefgegevens.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'afvallen')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Profiel')

  /* 0. DE INHOUDSOPGAVE STAAT OP HET SCHERM, EN NIET ALLEEN IN DE DOOS
        Het boekje stond als één knop onderaan een kaart over de herkomst van
        de getallen: elf stukken die je moest kénnen om ze te vinden. Nu staan
        de titels er. Deze proef telt ze, want een lijst die stilletjes leeg
        raakt ziet er in de code prima uit. */
  const kast = pagina.locator('.kaart').filter({ hasText: 'Kennisbank' })
  const index = kast.locator('button.naslagregel')
  /* Elf stukken plus twee planken ernaast: je aandoening en hoe de app rekent. */
  const titels = await index.count()
  if (titels !== 13) throw new Error(`verdiepen: ${titels} regels in de kast in plaats van 13`)
  const eersteTitel = (await index.first().innerText()).replace(/\s+/g, ' ').trim()
  if (!eersteTitel.startsWith('De Nederlandse trap')) {
    throw new Error(`verdiepen: de eerste titel is "${eersteTitel}"`)
  }

  await index.first().click()

  const venster = pagina.locator('.venster')
  await venster.waitFor({ timeout: 5000 })

  process.stdout.write('verdiepen                  ')

  /* 1. Elf stukken. Er staat er één open, want er is op een titel getikt, en
        dat hoort precies dát stuk te openen. De rest staat dicht: wie hier komt
        kiest wat hij leest. De knop heet "open" en niet zoals het stuk,
        `Uitklap` zet de kop in een `Kop` en de schakelaar ernaast. */
  const dichte = venster.getByRole('button', { name: 'open', exact: true })
  const open = venster.getByRole('button', { name: 'dicht', exact: true })
  const aantal = await dichte.count() + await open.count()
  if (aantal !== 11) throw new Error(`verdiepen: ${aantal} stukken in plaats van 11`)
  if (await open.count() !== 1) {
    throw new Error(`verdiepen: ${await open.count()} stukken open na een tik op een titel`)
  }
  const geopend = (await venster.locator('#stuk-trap').innerText()).replace(/\s+/g, ' ')
  if (!/trap|GLI|leefstijlinterventie/i.test(geopend)) {
    throw new Error(`verdiepen: de aangetikte titel opent het verkeerde stuk\n  ${geopend.slice(0, 160)}`)
  }

  /* 2. Eén openen, en dan moeten alle vier de delen er staan. */
  await venster.locator('.kaart').filter({ hasText: 'Wat er gebeurt als je stopt' })
    .getByRole('button', { name: 'open', exact: true }).click()
  await pagina.waitForTimeout(250)
  const plat = (await venster.innerText()).replace(/\s+/g, ' ')

  if (!/tweederde van het verloren gewicht/.test(plat)) {
    throw new Error('verdiepen: het stuk gaat niet open, of het getal staat er niet')
  }
  if (!/Wat we niet weten/.test(plat)) {
    throw new Error(`verdiepen: het voorbehoud staat niet op het scherm\n  ${plat.slice(0, 300)}`)
  }
  if (!/verantwoord afbouwt is niet onderzocht/.test(plat)) {
    throw new Error('verdiepen: het voorbehoud staat er als kop maar zonder inhoud')
  }
  if (!/Waar je dit terugziet/.test(plat)) throw new Error('verdiepen: de verwijzing ontbreekt')
  if (!/Bron: Wilding/.test(plat)) throw new Error('verdiepen: de bron ontbreekt')

  /* 3. HET BOEKJE BLIJFT EEN BOEKJE.
        Open álle stukken en kijk of er ergens een getal van deze gebruiker in
        staat. De proefreeks heeft een gewicht rond de 116-119 kg, een eiwitdoel
        van 161 g en een dagdoel van 3.690 kcal; geen van die getallen hoort hier
        voor te komen. */
  for (let i = 0; i < 14; i++) {
    const nog = venster.getByRole('button', { name: 'open', exact: true })
    if (!(await nog.count())) break
    await nog.first().click()
    await pagina.waitForTimeout(80)
  }
  await pagina.waitForTimeout(300)
  const alles = (await venster.innerText()).replace(/\s+/g, ' ')
  for (const getal of ['116,6', '118,0', '3.690', '161 g', '7.468']) {
    if (alles.includes(getal)) {
      throw new Error(`verdiepen: "${getal}" komt uit de gebruiker en staat in het boekje, `
        + 'dan is het geen boekje meer')
    }
  }

  /* 4. En de slotregel die zegt wat dit niet is. */
  if (!/schrijft geen medicijnen voor/.test(alles)) {
    throw new Error('verdiepen: de slotregel over voorlichting ontbreekt')
  }

  await pagina.screenshot({ path: 'gereedschap/health-verdiepen.png', fullPage: true })

  /* 6. DE VERWIJZING VANAF EEN KAART KOMT BINNEN OP HÉT STUK
        Een verwijzing die het boekje bovenaan opent, is een verwijzing die niet
        werkt: je staat dan in een boekje van elf stukken zonder te weten welk
        stuk bedoeld was. Erger nog, wie dat stuk ooit dichtklapte krijgt een
        onthouden stand terug en ziet niets gebeuren. Vandaar hier, met een
        stand die met opzet dicht is gezet. */
  await pagina.keyboard.press('Escape')
  await pagina.waitForTimeout(200)
  await pagina.evaluate(() => {
    localStorage.setItem('kalibratie.uitleg', JSON.stringify({ 'verdiep-slaap': false }))
  })
  await pagina.getByRole('button', { name: 'Lees het hele stuk' }).click()
  await pagina.waitForTimeout(400)
  const slaapstuk = (await pagina.locator('#stuk-slaap').innerText()).replace(/\s+/g, ' ')
  if (!/Nedeltcheva|veertien nachten|vetvrije massa/.test(slaapstuk)) {
    throw new Error(`verdiepen: de verwijzing opent het slaapstuk niet\n  ${slaapstuk.slice(0, 200)}`)
  }
  console.log(`${''.padEnd(26)} inhoudsopgave: ${titels} titels · verwijzing opent het stuk zelf`)
  console.log(`${aantal} stukken · vier delen per stuk · geen enkel getal van de lezer erin`)
  await pagina.close()
}

/* ------------------------------------------------------------ je traject -- */
/**
 * DE TRAP, EN WAT DE APP ERVAN BEOORDEELT
 *
 * Deze app kent het Nederlandse traject: leefstijl, de gecombineerde
 * leefstijlinterventie, en daarboven gewichtsreducerende medicatie. Van die
 * bovenste trede toont hij de criteria van de NHG-Standaard Obesitas (augustus
 * 2026) en beoordeelt hij er twee: het jaar leefstijlbegeleiding en de leeftijd.
 * Dat zijn feiten uit het eigen dossier. De BMI-drempel en de comorbiditeit zijn
 * klinische oordelen en blijven "niet bekend".
 *
 * WAAROM DIT NIET MET EEN PROEF IN VITEST AF IS
 *
 * Die controleert dat `medicatiecriteria` er altijd minstens één op "niet
 * bekend" laat staan. Hij kan niet zien wat het scherm ermee doet. Een component
 * die de vier regels optelt tot één uitkomst ("drie van de vier", een groen
 * vinkje, "je komt er waarschijnlijk voor in aanmerking") komt daar ongemerkt
 * doorheen, en dan staat er precies de uitspraak die deze app niet mag doen.
 *
 * Deze proef leest daarom het echte scherm en eist dat het onbeoordeelde deel
 * zichtbaar blijft staan.
 */
{
  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'gli')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Profiel')

  process.stdout.write('je traject                 ')

  const kaart = pagina.locator('.kaart').filter({ hasText: 'Je traject' }).first()
  await kaart.waitFor({ timeout: 5000 })
  const plat = (await kaart.innerText()).replace(/\s+/g, ' ')

  /* 1. De GLI-trede: het programma bij naam, de duur in maanden, en de fase.
        Veertien maanden ligt voorbij de acht van CooL en voor de vierentwintig
        van het hele traject. */
  if (!/CooL/.test(plat)) throw new Error(`traject: het programma staat er niet\n  ${plat}`)
  if (!/14 van de 24 mnd/.test(plat)) {
    throw new Error(`traject: de voortgang klopt niet\n  ${plat}`)
  }
  if (!/behandelfase afgerond, nu in de onderhoudsfase/.test(plat)) {
    throw new Error(`traject: de fase staat er niet\n  ${plat}`)
  }

  /* 2. De vier criteria staan er, elk bij naam. */
  for (const wat of [
    'Een jaar leefstijlbegeleiding', 'Leeftijd onder de 76',
    'De BMI-drempel', 'Gewichtsgerelateerde comorbiditeit',
  ]) {
    if (!plat.includes(wat)) throw new Error(`traject: criterium "${wat}" ontbreekt\n  ${plat}`)
  }

  /* 3. Wat de app wél weet, beoordeelt hij ook. Veertien maanden is meer dan
        een jaar, en de proefgebruiker is 41. Zonder dit zou "zet alles op niet
        bekend" er net zo uitzien als een eerlijke kaart. */
  if (!/Een jaar leefstijlbegeleiding gehaald/.test(plat)) {
    throw new Error(`traject: het GLI-jaar wordt niet beoordeeld\n  ${plat}`)
  }
  if (!/Leeftijd onder de 76 gehaald/.test(plat)) {
    throw new Error(`traject: de leeftijd wordt niet beoordeeld\n  ${plat}`)
  }

  /* 4. HET INVARIANT. Wat de app niet weet, blijft zichtbaar onbeoordeeld,
        ook bij deze gebruiker, die op allebei de beoordeelbare criteria groen
        staat. Dat is precies het geval waarin een optelsom zou verleiden. */
  if (!/De BMI-drempel niet bekend/.test(plat)) {
    throw new Error(`traject: de BMI-drempel staat niet op "niet bekend"\n  ${plat}`)
  }
  if (!/Gewichtsgerelateerde comorbiditeit niet bekend/.test(plat)) {
    throw new Error(`traject: de comorbiditeit staat niet op "niet bekend"\n  ${plat}`)
  }

  /* 5. EN ER STAAT GEEN TOTAALOORDEEL. Geen optelsom, geen "waarschijnlijk",
        geen uitspraak over in aanmerking komen. De enige zin waarin "in
        aanmerking" mag voorkomen is die waarin de app zegt dat hij er niet over
        gaat; die wordt er hieronder uit geknipt voordat er gezocht wordt. */
  const samenvatting = kaart.locator('details.uitleg > summary')
  for (let i = 0; i < (await samenvatting.count()); i++) await samenvatting.nth(i).click()
  await pagina.waitForTimeout(200)
  const alles = (await kaart.innerText()).replace(/\s+/g, ' ')

  const zonderVoorbehoud = alles.replace(/Deze app zegt niet of je in aanmerking komt\./g, '')
  for (const oordeel of [
    /in aanmerking/, /\bje voldoet\b/, /\d\s*van de\s*4\b/, /waarschijnlijk in/,
  ]) {
    if (oordeel.test(zonderVoorbehoud)) {
      throw new Error(`traject: ${oordeel} staat op het scherm: dat is een totaaloordeel\n`
        + `  ${zonderVoorbehoud}`)
    }
  }
  if (!/zegt niet of je in aanmerking komt/.test(alles)) {
    throw new Error(`traject: de zin die zegt dat de app niet oordeelt ontbreekt\n  ${alles}`)
  }

  /* 6. DE VONDST. Twee drempelsets, en de tweede ligt lager. Dit is wat in geen
        enkele samenvatting van de standaard stond, en wat voor een groot deel
        van de gebruikers van deze app het verschil maakt. */
  /* Niet alleen dát de vier getallen er staan, maar ook bij welke drempel. Met
     losse getallen zou het verwisselen van "mét" en "zonder" (de comorbiditeit
     op 40 en de kale drempel op 35) er hetzelfde uitzien, en dat is precies de
     verwisseling die iemand ten onrechte afwijst. */
  for (const paar of ['35,0 mét · 40,0 zonder', '32,5 mét · 37,5 zonder']) {
    if (!alles.includes(paar)) {
      throw new Error(`traject: "${paar}" staat niet op het scherm, de drempels staan er niet, `
        + `of niet bij de juiste voorwaarde\n  ${alles}`)
    }
  }
  for (const woord of ['Aziatische', 'Hindostaanse', 'Afrikaans-Caribische']) {
    if (!alles.includes(woord)) {
      throw new Error(`traject: "${woord}" ontbreekt bij de tweede drempelset\n  ${alles}`)
    }
  }
  if (!/slaapapneu/.test(alles)) {
    throw new Error(`traject: de comorbiditeit staat niet voluit\n  ${alles}`)
  }

  /* 7. Wat er vaststaat, en waar het vandaan komt. */
  for (const zin of [
    'hoger dan de Europese registratietekst',
    'minstens een jaar leefstijlbegeleiding',
    'geen huisarts is verplicht',
    'Boven de 75 jaar niet',
  ]) {
    if (!alles.includes(zin)) {
      throw new Error(`traject: "${zin}" ontbreekt in het uitlegblok\n  ${alles}`)
    }
  }
  if (!/Bron: NHG-Standaard Obesitas/.test(alles)) {
    throw new Error(`traject: de bron ontbreekt\n  ${alles}`)
  }

  await pagina.screenshot({ path: 'gereedschap/health-traject.png', fullPage: true })
  await pagina.close()

  /* 8. ZONDER GLI GEEN KAART. Een lege doos met een kop erboven is erger dan
        geen doos: hij belooft iets. */
  const leeg = await ctx.newPage()
  await leeg.emulateMedia({ colorScheme: 'light' })
  await bedienDb(leeg, 28, 'afvallen')
  await leeg.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await leeg.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(leeg, 'Profiel')
  const zonder = await leeg.locator('.kaart').filter({ hasText: 'Je traject' }).count()
  if (zonder !== 0) throw new Error(`traject: de kaart staat er ${zonder}× zonder GLI`)
  await leeg.close()

  console.log('CooL 14/24 mnd · 2 beoordeeld, 2 open · drempels 35/40 en 32,5/37,5 · geen optelsom')
}

/**
 * DE WEGING DIE ER NIET KAN STAAN
 *
 * Hoofdstuk 1 van VERANTWOORDING.md beloofde deze markering al terwijl ze
 * nergens stond. Nu ze er is, hoort ze ook op het scherm te komen, want een
 * markering die de gebruiker niet ziet is geen markering.
 *
 * Twee kanten, en de tweede is de belangrijkste. Bij een reeks met een weging
 * van 190,2 hoort de zin er te staan, mét de datum en het verschil. Bij een
 * gewone reeks hoort hij er niet te staan: deze app is er voor iemand die
 * afvalt, en een waarschuwing over precies dat gedrag zou het scherm vullen
 * met ruis.
 */
{
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 1180 }, deviceScaleFactor: 2,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  await ctx.addInitScript(`{
    const echt = Date; const vast = ${NU};
    class V extends echt {
      constructor(...a){ super(...(a.length ? a : [vast])) }
      static now(){ return vast }
    }
    window.Date = V;
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proef', account: 'abdelkader' }));
  }`)

  const pagina = await ctx.newPage()
  await pagina.emulateMedia({ colorScheme: 'light' })
  await bedienDb(pagina, 28, 'uitbijter')
  await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(pagina, 'Inzicht')
  await pagina.waitForTimeout(600)

  const kaart = pagina.locator('.kaart').filter({ hasText: 'Gewicht en voortschrijdend' }).first()
  if (!(await kaart.count())) throw new Error('uitbijter: de weegkaart staat er niet')
  const tekst = (await kaart.innerText()).replace(/\s+/g, ' ')

  if (!/past niet bij de rest van je reeks/.test(tekst)) {
    throw new Error(`uitbijter: de markering staat er niet\n  ${tekst}`)
  }
  /* Het verschil hoort erbij te staan en niet alleen de mededeling. Zonder
     getal is het een waarschuwing waar je niets mee kunt. */
  const verschil = /(\d+[,.]\d) kg (boven|onder)/.exec(tekst)
  if (!verschil) throw new Error(`uitbijter: het verschil staat er niet bij\n  ${tekst}`)
  if (Number(verschil[1].replace(',', '.')) < 60) {
    throw new Error(`uitbijter: het verschil is ${verschil[1]} kg, dat kan niet kloppen`)
  }
  /* En de belofte dat er niets weggegooid wordt. Die staat niet voor de sier:
     hij is de reden dat de markering geen ingreep is. */
  if (!/gooit geen metingen weg/.test(tekst)) {
    throw new Error(`uitbijter: de app belooft niet dat hij de meting laat staan\n  ${tekst}`)
  }

  await pagina.screenshot({ path: 'gereedschap/health-uitbijter.png', fullPage: true })

  /* EN WAT JE ERMEE KUNT
     De markering is de helft van de belofte; de andere helft is dat jij hem
     kunt rechtzetten. Die helft bestond niet: "zet hem recht op de dag zelf"
     betekende zelf uitzoeken welke dag het was en erheen bladeren.

     Deze proef leest mee wat er naar de database gaat. Dat is het enige wat
     hier te bewijzen valt: het scherm kan niet laten zien dat een weging weg
     is, want de proefgegevens komen bij elke ophaalslag weer terug. */
  const gezet = []
  await pagina.route('**/rest/v1/rpc/kal_dag_zetten', async (route) => {
    gezet.push(JSON.parse(route.request().postData() ?? '{}'))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await pagina.getByRole('button', { name: /wegingen/i }).first().click()
  const wegvenster = pagina.locator('.venster').filter({ hasText: 'Je wegingen' })
  await wegvenster.waitFor({ timeout: 5000 })

  /* Hij opent op de opvallende wegingen, want daarvoor kom je hier. */
  const opvallend = (await wegvenster.innerText()).replace(/\s+/g, ' ')
  if (!/om na te lopen/.test(opvallend)) {
    throw new Error(`wegingen: het venster opent niet op de opvallende\n  ${opvallend.slice(0, 200)}`)
  }
  if (!/190/.test(opvallend)) {
    throw new Error(`wegingen: de uitbijter staat niet in de lijst\n  ${opvallend.slice(0, 200)}`)
  }

  await wegvenster.getByRole('button', { name: /weghalen/ }).first().click()
  await pagina.waitForTimeout(200)
  const weg = gezet[gezet.length - 1]
  if (!weg || weg.p_patch?.gewicht_kg !== null) {
    throw new Error(`wegingen: weghalen stuurt geen lege weging\n  ${JSON.stringify(gezet)}`)
  }
  /* En op de dag van die weging, niet op de dag die bovenaan het scherm staat. */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weg.p_datum ?? '')) {
    throw new Error(`wegingen: weghalen stuurt geen datum\n  ${JSON.stringify(weg)}`)
  }

  /* Wat hier NIET te proeven valt, en waarom dat goed is.

     Na het weghalen staat de regel er weer, met zijn oude waarde. Dat komt
     doordat deze proef een database naspeelt die altijd hetzelfde antwoordt:
     het scherm leest de reeks opnieuw en krijgt de weging terug. Het venster
     toont dus wat de database zegt en niet wat het zelf verstuurde.

     Dat is met opzet zo gebouwd. Een scherm dat de regel meteen als weggehaald
     toont, liegt op de dag dat de database het verzoek niet uitvoert, en dan
     denkt iemand dat zijn 190 weg is terwijl hij in de trend blijft staan. Het
     terugzetknopje is daarom pas te zien als er werkelijk iets weg is. */
  await pagina.screenshot({ path: 'gereedschap/health-wegingen.png', fullPage: true })
  console.log(`${'je wegingen nalopen'.padEnd(26)} weghalen -> ${weg.p_datum} gewicht_kg=null, `
    + `en de regel blijft staan zolang de database hem teruggeeft`)
  await pagina.close()

  /* De andere kant: bij een gewone reeks staat er niets. */
  const gewoon = await ctx.newPage()
  await gewoon.emulateMedia({ colorScheme: 'light' })
  await bedienDb(gewoon, 28, 'afvallen')
  await gewoon.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await gewoon.waitForSelector('.hero', { timeout: 5000 })
  await naarTab(gewoon, 'Inzicht')
  await gewoon.waitForTimeout(600)
  const schoon = (await gewoon.locator('.kaart')
    .filter({ hasText: 'Gewicht en voortschrijdend' }).first().innerText()).replace(/\s+/g, ' ')
  if (/past niet bij de rest/.test(schoon)) {
    throw new Error(`uitbijter: de markering gaat af op een gewone daling\n  ${schoon}`)
  }
  await gewoon.close()
  await ctx.close()

  console.log(`${'de weging die niet past'.padEnd(26)} 190,2 aangewezen, `
    + `${verschil[1]} kg ${verschil[2]}, en stil bij een gewone reeks`)
}

/* IS JE VERBRUIK MEEGEZAKT?
   De enige kaart die twee vensters nodig heeft, dus de enige die in een
   proefopstelling van achtentwintig dagen nooit te zien is. Zonder dit blok
   stond hij in geen enkele afdruk en had hij ook stuk kunnen zijn.

   Er worden twee reeksen bekeken en de tweede doet het echte werk: bij een
   gewone gestage daling hoort hier niets te staan. Een kaart die altijd iets
   beweert is geen meting. */
{
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 2600 }, deviceScaleFactor: 2,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  await ctx.addInitScript(`{
    const echt = Date; const vast = ${NU};
    class Vast extends echt {
      constructor(...a) { if (a.length === 0) super(vast); else super(...a) }
      static now() { return vast }
    }
    globalThis.Date = Vast;
    localStorage.setItem('kalibratie.sessie', JSON.stringify({ token: 'proef', account: 'abdelkader' }));
  }`)

  async function kaartTekst(fase) {
    const p = await ctx.newPage()
    await p.emulateMedia({ colorScheme: 'light' })
    await bedienDb(p, 120, fase)
    await p.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.hero', { timeout: 5000 })
    await naarTab(p, 'Inzicht')
    const kaart = p.locator('.kaart').filter({ hasText: 'Is je verbruik meegezakt' }).first()
    if (!(await kaart.count())) throw new Error(`verbruiksbeloop: de kaart staat er niet bij ${fase}`)
    for (const knop of await kaart.locator('summary').all()) await knop.click()
    const tekst = (await kaart.innerText()).replace(/\s+/g, ' ')
    return { p, kaart, tekst }
  }

  const gezakt = await kaartTekst('gezakt')
  if (!/verder gezakt dan je gewicht verklaart/.test(gezakt.tekst)) {
    throw new Error(`verbruiksbeloop: geen uitspraak bij een reeks die stilvalt\n  ${gezakt.tekst}`)
  }
  /* Nooit één getal. Twee verwachtingen, een verschil als bereik, en de marge
     erbij: dat is de hele belofte van deze kaart en het is in platte tekst na
     te lezen. */
  const bereik = /Het verschil is (-?\d[\d.]*) tot (-?\d[\d.]*) kcal per dag, en dat is meer dan de marge van ([\d.]*\d)/
    .exec(gezakt.tekst)
  if (!bereik) throw new Error(`verbruiksbeloop: geen verschil met marge\n  ${gezakt.tekst}`)
  const getal = (x) => Number(x.replace(/\./g, ''))
  if (!(getal(bereik[1]) < 0 && getal(bereik[2]) < 0)) {
    throw new Error(`verbruiksbeloop: het bereik wijst niet omlaag: ${bereik[1]} tot ${bereik[2]}`)
  }
  if (!(Math.abs(getal(bereik[2])) > getal(bereik[3]))) {
    throw new Error(`verbruiksbeloop: de marge is groter dan het verschil en er staat toch iets`)
  }
  /* En de voorbehouden reizen mee. Ze staan in de uitklap, en een uitklap die
     dichtgaat is hier hetzelfde als een voorbehoud dat verdwijnt. */
  for (const stuk of ['logboek zit er altijd naast', 'een fout die verandert',
                      'twee verdedigbare antwoorden', 'metabole adaptatie']) {
    if (!gezakt.tekst.includes(stuk)) {
      throw new Error(`verbruiksbeloop: "${stuk}" staat niet in de kaart\n  ${gezakt.tekst}`)
    }
  }
  await gezakt.p.screenshot({ path: 'gereedschap/health-verbruiksbeloop.png', fullPage: true })
  await gezakt.p.close()

  const stil = await kaartTekst('afvallen')
  if (!/Geen verschil dat uit de ruis komt/.test(stil.tekst)) {
    throw new Error(`verbruiksbeloop: een gestage daling levert toch een uitspraak op\n  ${stil.tekst}`)
  }
  await stil.p.close()
  await ctx.close()

  console.log(`${'is je verbruik meegezakt'.padEnd(26)} ${bereik[1]} tot ${bereik[2]} kcal `
    + `bij een marge van ${bereik[3]}, en stil bij een gestage daling`)
}

/* ------------------------------------------------------- de testerslijst ---- */
/* DE WACHTKAMER, BESTAND 48
   Twee dingen tegelijk, en het tweede weegt het zwaarst: de lijst staat er voor
   een beheerder, én hij staat er niet voor een ander. Een proef die alleen het
   eerste doet gaat groen bij een lijst die bij iedereen staat, en die lijst
   bevat de namen van alle testers.

   Wat er verder in moet: wie wacht hoort bovenaan, want dat is het enige waar
   iets van de beheerder moet gebeuren, en "toelaten" moet werkelijk naar de
   database gaan en niet alleen het scherm verzetten. */
{
  const kijk = async (beheerder) => {
    const c = await browser.newContext({
      viewport: { width: 430, height: 1600 }, deviceScaleFactor: 2,
      locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
    })
    const pagina = await c.newPage()
    pagina.__beheerder = beheerder
    await bedienDb(pagina, 28, 'afvallen')
    await pagina.addInitScript(() => {
      localStorage.setItem('kalibratie.sessie',
        JSON.stringify({ token: 'proeftoken', account: 'abdelkader' }))
    })
    await pagina.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(700)
    await pagina.getByRole('button', { name: /^Account van/ }).click()
    await pagina.waitForTimeout(500)
    return { pagina, c }
  }

  const gewoon = await kijk(false)
  /* `Kop` rendert een div en geen heading. Deze proef stond er eerst met
     getByRole('heading') en ging daarmee aan bêide kanten vacuüm langs: nul
     treffers bij de gewone gebruiker leek een geslaagde afwezigheid. */
  if (await gewoon.pagina.getByText('Testers', { exact: true }).count() !== 0) {
    throw new Error('testers: de lijst staat er voor wie geen beheerder is')
  }
  await gewoon.c.close()

  const baas = await kijk(true)
  const p = baas.pagina
  if (await p.getByText('Testers', { exact: true }).count() !== 1) {
    throw new Error('testers: de lijst ontbreekt voor een beheerder')
  }

  /* Wie wacht staat bovenaan. De stub geeft ze in een andere volgorde terug,
     dus dit gaat over het sorteren en niet over het doorgeven. */
  const velden = p.locator('input[aria-label^="budget van "]')
  const drie = []
  for (let i = 0; i < await velden.count(); i++) {
    drie.push((await velden.nth(i).getAttribute('aria-label')).replace('budget van ', ''))
  }
  if (drie.length !== 3) throw new Error(`testers: ${drie.length} regels in plaats van 3`)
  if (drie[0] !== 'karim') {
    throw new Error(`testers: wie wacht staat niet bovenaan, de volgorde is ${drie.join(', ')}`)
  }

  /* Er hoort te staan hoeveel er wachten, want dat is waar de beheerder voor
     kijkt. En de lijst mag geen enkel gegeven uit de app zelf tonen. */
  const blok = (await p.locator('.venster, .scherm, body').first().innerText()).replace(/\s+/g, ' ')
  if (!/1 wacht op je/.test(blok)) throw new Error('testers: het aantal wachtenden staat er niet')
  if (!/Sonnet-tarief/.test(blok)) {
    throw new Error('testers: het voorbehoud bij het bedrag staat er niet')
  }

  /* En toelaten gaat werkelijk naar de database. Zonder deze regel zou een knop
     die alleen het scherm verzet er precies hetzelfde uitzien. */
  await p.getByRole('button', { name: 'toelaten', exact: true }).first().click()
  await p.waitForTimeout(400)
  const uit = baas.pagina.__gezet ?? []
  if (!uit.some((x) => x.p_account === 'karim' && x.p_status === 'toegelaten')) {
    throw new Error(`testers: "toelaten" bereikte de database niet, verstuurd: ${JSON.stringify(uit)}`)
  }

  await p.screenshot({ path: 'gereedschap/health-testers.png', fullPage: true })
  await baas.c.close()

  console.log(`${'de testers'.padEnd(26)} lijst alleen voor de beheerder · `
    + `karim bovenaan · toelaten -> kal_tester_zetten`)
}

/* ------------------------------------------------------- de eigen sleutel ---- */
/* DE PROEFRIT HEEFT EEN VERVOLG, BESTAND 49
   Wat hier bewezen moet worden is niet dat er een vak staat. Het is dat het vak
   zegt waar de sleutel terechtkomt, dat hij er ook werkelijk heen gaat met de
   aanbieder erbij, en dat een sleutel die bij de verkeerde aanbieder hoort
   geweigerd wordt zonder dat de app hem toch doorzet.

   En het belangrijkste: dat de sleutel nergens op het scherm terugkomt. Een
   invoervak dat zijn inhoud vasthoudt is een sleutel die de volgende die op die
   telefoon kijkt gewoon kan lezen. */
{
  const c = await browser.newContext({
    viewport: { width: 430, height: 1900 }, deviceScaleFactor: 2,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  const p = await c.newPage()
  await bedienDb(p, 28, 'afvallen')
  await p.addInitScript(() => {
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proeftoken', account: 'abdelkader' }))
  })
  await p.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: /^Account van/ }).click()
  await p.waitForTimeout(500)

  await p.getByRole('button', { name: 'Je eigen AI-sleutel gebruiken' }).click()
  await p.waitForTimeout(300)

  /* De twee uitklappen horen erbij te staan: waar hij terechtkomt, en hoe je er
     een maakt. Zonder de eerste vraag je iemand een betaalsleutel af zonder te
     zeggen waar hij heen gaat. */
  /* Op naam en niet op `summary`: het scherm eronder heeft er ook, en die zijn
     niet zichtbaar zolang het accountvenster openstaat. */
  for (const naam of ['waar je sleutel terechtkomt', 'hoe je er een maakt, en wat het kost']) {
    await p.getByText(naam, { exact: true }).click()
  }
  await p.waitForTimeout(200)
  const tekst = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
  for (const stuk of ['versleuteld de database', 'geen knop die hem laat zien',
                      'console.anthropic.com', 'platform.openai.com',
                      'ChatGPT-abonnement hier niet voor telt', 'maandlimiet']) {
    if (!tekst.includes(stuk)) throw new Error(`sleutel: "${stuk}" staat niet op het scherm`)
  }

  const vak = p.getByLabel('Je API-sleutel')

  /* Eerst de verkeerde: een OpenAI-sleutel terwijl Anthropic aanstaat. */
  await vak.fill('sk-proj-' + 'q'.repeat(40))
  await p.getByRole('button', { name: 'Bewaren', exact: true }).click()
  await p.waitForTimeout(400)
  if (!(await p.locator('body').innerText()).includes('begint met sk-ant-')) {
    throw new Error('sleutel: de weigering van de database komt niet op het scherm')
  }

  /* En dan de goede, bij de andere aanbieder. */
  await p.getByRole('button', { name: 'OpenAI', exact: true }).click()
  await vak.fill('sk-proj-' + 'q'.repeat(40))
  await p.getByRole('button', { name: 'Bewaren', exact: true }).click()
  await p.waitForTimeout(500)

  const heen = p.__sleutels ?? []
  if (heen.length !== 2) throw new Error(`sleutel: ${heen.length} verzoeken in plaats van 2`)
  if (heen[0].aanbieder !== 'anthropic' || heen[1].aanbieder !== 'openai') {
    throw new Error(`sleutel: de aanbieder gaat niet mee: ${JSON.stringify(heen)}`)
  }

  /* En het vak is leeg. Dit is de proef die er het meest toe doet en het minst
     naar uitziet: een sleutel die in het invoervak blijft staan is een sleutel
     die de volgende die meekijkt gewoon leest. */
  if (await vak.count() && (await vak.inputValue()) !== '') {
    throw new Error('sleutel: het invoervak houdt de sleutel vast')
  }
  const na = (await p.locator('body').innerText())
  if (na.includes('qqqq')) throw new Error('sleutel: de sleutel staat op het scherm')

  await p.screenshot({ path: 'gereedschap/health-sleutel.png', fullPage: true })
  await c.close()

  console.log(`${'je eigen sleutel'.padEnd(26)} twee uitklappen \u00b7 verkeerd voorvoegsel geweigerd \u00b7 `
    + `aanbieder gaat mee \u00b7 vak leeg na bewaren`)
}

/* ---------------------------------------------------- je gegevens weghalen ---- */
/* DE ENIGE ONOMKEERBARE KNOP IN DE APP, BESTAND 52
   Wat hier bewezen moet worden gaat niet over of het werkt maar over of het
   moeilijk genoeg is. Drie dingen, en ze zitten er alle drie omdat de vorige
   niet genoeg was:

     1. De eerste tik verwijdert niets. Hij vraagt wat er zou weggaan.
     2. Zonder wachtwoord gebeurt er niets, en een verkeerd wachtwoord komt als
        een zin op het scherm en niet als een stille mislukking.
     3. En wat er weggaat staat er in gewone taal, met aantallen, vóórdat je
        bevestigt. Een knop die "alles weg" zegt zonder te zeggen wat alles is,
        vraagt om een beslissing die niemand kan nemen. */
{
  const c = await browser.newContext({
    viewport: { width: 430, height: 1900 }, deviceScaleFactor: 2,
    locale: 'nl-NL', timezoneId: 'Europe/Amsterdam',
  })
  const p = await c.newPage()
  await bedienDb(p, 28, 'afvallen')
  await p.addInitScript(() => {
    localStorage.setItem('kalibratie.sessie',
      JSON.stringify({ token: 'proeftoken', account: 'abdelkader' }))
  })
  await p.goto(`http://localhost:${poort}/health/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: /^Account van/ }).click()
  await p.waitForTimeout(500)

  await p.getByRole('button', { name: 'Al je gegevens weghalen' }).click()
  await p.waitForTimeout(300)

  const tekst = () => p.locator('body').innerText()
  for (const stuk of ['geen prullenbak', 'geen weg terug', 'aantekening']) {
    if (!(await tekst()).includes(stuk)) {
      throw new Error(`wissen: "${stuk}" staat niet op het scherm`)
    }
  }

  /* Eerst het verkeerde wachtwoord. */
  await p.getByLabel('Je wachtwoord').fill('fout')
  await p.getByRole('button', { name: 'Laat zien wat er weggaat' }).click()
  await p.waitForTimeout(400)
  if (!(await tekst()).includes('wachtwoord klopt niet')) {
    throw new Error('wissen: een verkeerd wachtwoord geeft geen zin op het scherm')
  }
  if ((p.__wissen ?? []).some((x) => x.echt)) {
    throw new Error('wissen: er is werkelijk gewist bij een verkeerd wachtwoord')
  }

  /* En dan het goede. De eerste tik hoort nog steeds niets te wissen. */
  await p.getByLabel('Je wachtwoord').fill('goedwachtwoord')
  await p.getByRole('button', { name: 'Laat zien wat er weggaat' }).click()
  await p.waitForTimeout(400)
  const na = await tekst()
  for (const stuk of ['149 in totaal', 'wat je gegeten en gedronken hebt',
                      'je metingen, waaronder bloeddruk', 'je eigen AI-sleutel']) {
    if (!na.includes(stuk)) throw new Error(`wissen: "${stuk}" staat niet in het overzicht`)
  }
  if (na.includes('kal_regels')) {
    throw new Error('wissen: er staan tabelnamen op het scherm in plaats van gewone taal')
  }
  if ((p.__wissen ?? []).some((x) => x.echt)) {
    throw new Error('wissen: de eerste tik heeft al gewist')
  }

  /* De afdruk hoort hier en niet aan het eind: na het wissen ben je afgemeld en
     staat er een aanmeldscherm, en dat is geen bewijs van wat je te zien kreeg
     toen je moest beslissen. */
  await p.screenshot({ path: 'gereedschap/health-wissen.png', fullPage: true })

  /* Pas de tweede knop wist werkelijk, en dan meldt hij je af. */
  await p.getByRole('button', { name: 'Ja, haal alles weg' }).click()
  await p.waitForTimeout(600)
  const echt = (p.__wissen ?? []).filter((x) => x.echt)
  if (echt.length !== 1) {
    throw new Error(`wissen: ${echt.length} echte wisverzoeken in plaats van 1`)
  }
  if (echt[0].ww !== 'goedwachtwoord') {
    throw new Error('wissen: het wachtwoord ging niet mee naar de database')
  }

  /* En afgemeld. Dat is de zichtbare kant van het wissen: blijf je ingelogd
     op een account dat niet meer bestaat, dan loopt de app daarna tegen fouten
     aan die niemand kan plaatsen. */
  await p.waitForTimeout(400)
  if (await p.getByRole('button', { name: 'Aanmelden', exact: true }).count() !== 1) {
    throw new Error('wissen: je blijft aangemeld op een account dat weg is')
  }
  await c.close()

  console.log(`${'je gegevens weghalen'.padEnd(26)} verkeerd wachtwoord geweigerd \u00b7 `
    + `eerste tik telt alleen \u00b7 149 in gewone taal \u00b7 pas de tweede wist`)
}

await browser.close()
server.close()
