#!/usr/bin/env node
/**
 * DE CSP ECHT NALOPEN
 *
 * Een Content-Security-Policy die je opschrijft en niet uitprobeert is een
 * belofte. Dit script zet dist/ neer achter een servertje dat precies de headers
 * uit vercel.json meestuurt, opent de app in Chromium, en meldt elke overtreding
 * en elke fout in de console.
 *
 * De app praat in deze proef niet met de database — er is geen sessie — maar
 * alles wat de pagina zelf laadt komt wel langs de policy: het script, de stijl,
 * het lettertype, de iconen.
 *
 *   node gereedschap/csp-proef.mjs
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const vercel = JSON.parse(await readFile('vercel.json', 'utf8'))
const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.map': 'application/json',
}

/** De regels uit vercel.json toepassen, met dezelfde padvergelijking. */
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
  if (!existsSync(bestand)) { antwoord.writeHead(404).end('niet gevonden'); return }
  antwoord.writeHead(200, {
    'Content-Type': TYPEN[extname(bestand)] ?? 'application/octet-stream',
    ...headersVoor(pad),
  })
  antwoord.end(await readFile(bestand))
})
await new Promise((k) => server.listen(0, k))
const poort = server.address().port

/* Playwright zoekt standaard de bouwversie die bij zijn eigen versie hoort.
   Staat er al een Chromium op de machine, dan is die goed genoeg voor deze
   proef: we kijken of een pagina rendert en of de policy iets tegenhoudt, en
   dat verschilt niet tussen bouwversies. Zonder deze zoektocht faalt `npm run
   controle` op een verse machine met een melding over browsers in plaats van
   over de app. */
function zoekChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM
  const mappen = ['/opt/pw-browsers', join(process.env.HOME ?? '', '.cache/ms-playwright')]
  for (const map of mappen) {
    if (!existsSync(map)) continue
    for (const naam of readdirSync(map)) {
      const kandidaat = join(map, naam, 'chrome-linux', 'chrome')
      if (existsSync(kandidaat)) return kandidaat
    }
  }
  return null
}

const pad = zoekChromium()
if (!pad) {
  console.error('Geen Chromium gevonden. Zet PLAYWRIGHT_CHROMIUM op het pad, of')
  console.error('draai `npx playwright install chromium`.')
  server.close()
  process.exit(1)
}
const browser = await chromium.launch({ executablePath: pad })
const pagina = await browser.newPage()
const overtredingen = []
const fouten = []
const buitenBereik = []

/* Google Fonts en Supabase zijn vanuit deze omgeving niet bereikbaar. Dat is
   geen fout in de app en geen CSP-overtreding — het is de sandbox. Zulke
   verzoeken worden apart geteld en genoemd, niet stilzwijgend weggefilterd.

   Sterker: dat het verzoek überhaupt de deur uit ging en pas op het netwerk
   strandde, is het bewijs dat connect-src de database toestaat. Was de policy
   te streng, dan had de browser hem hier geblokkeerd en stond hij hierboven bij
   de overtredingen. */
const BUITEN_BEREIK = ['fonts.googleapis.com', 'fonts.gstatic.com', 'supabase.co']
const isBuitenBereik = (url) => BUITEN_BEREIK.some((h) => url.includes(h))

pagina.on('console', (m) => {
  const t = m.text()
  if (/Content Security Policy|Refused to/i.test(t)) overtredingen.push(t)
  else if (m.type() === 'error' && !/Failed to load resource/i.test(t)) fouten.push(t)
})
pagina.on('pageerror', (e) => fouten.push(String(e)))
pagina.on('requestfailed', (r) => {
  const regel = `${r.url()} — ${r.failure()?.errorText}`
  if (isBuitenBereik(r.url())) buitenBereik.push(regel)
  else fouten.push(regel)
})

/* Elke omgebouwde app krijgt dezelfde behandeling: opvragen, laten renderen,
   en kijken of de policy iets tegenhield. De verwachting per pagina staat
   erbij, want "de pagina laadde" is geen bewijs dat er iets op staat. */
const PAGINAS = [
  { pad: '/', kop: 'BennaHub', minKnoppen: 1, plaat: 'start' },
  { pad: '/health/', kop: 'BennaHealth', minKnoppen: 2, plaat: 'health' },
  {
    pad: '/rasikh/', kop: 'Koran uit je hoofd', minKnoppen: 6, plaat: 'rasikh',
    /* De tekst wordt per soera geladen; dat het tabblad Nieuw een echte aya
       toont bewijst dat de index, het laden en de planning samenwerken. */
    async doe(pagina) {
      await pagina.getByRole('tab', { name: 'Nieuw' }).click()
      await pagina.locator('.aya .ar').first().waitFor({ timeout: 5000 })
      const arabisch = await pagina.locator('.aya .ar').first().textContent()
      if (!arabisch || arabisch.trim().length < 5) return 'geen Arabische tekst geladen'
      await pagina.getByRole('button', { name: /Begin bij stap 1/ }).click()
      const stap = await pagina.locator('.blad .meta').first().textContent()
      if (!/stap 1 van 6/.test(stap ?? '')) return `leerflow startte niet: ${stap}`
      await pagina.locator('.blad').getByRole('button', { name: 'Sluiten' }).click()
      return null
    },
  },
  {
    pad: '/spellen/', kop: 'Spelletjes', minKnoppen: 13, plaat: 'spellen',
    /* Renderen is niet werken. Een spel openen, een goede zet doen en kijken of
       de teller meeloopt is het kortste bewijs dat de omzetting van imperatieve
       DOM-code naar componenten de logica heeft overgehouden. */
    async doe(pagina) {
      await pagina.locator('.tegel', { hasText: 'Even of oneven' }).click()
      // De tegels blijven onder de overlay staan, dus zoeken gebeurt binnen het blad.
      const blad = pagina.locator('.blad')
      const getal = Number(await blad.locator('.groot').textContent())
      await blad.getByRole('button', { name: getal % 2 === 0 ? 'Even' : 'Oneven', exact: true }).click()
      const stand = await blad.locator('.stand').textContent()
      if (!/🏆 1/.test(stand ?? '')) return `score liep niet mee: ${stand}`
      await blad.getByRole('button', { name: 'Klaar' }).click()
      if (await pagina.locator('.blad').count()) return 'het spel bleef openstaan'
      return null
    },
  },
  {
    pad: '/sanad/', kop: 'Geloofsstudie', minKnoppen: 7, plaat: 'sanad',
    /* De hele weekgang in het klein: instellen, door de vijf stappen, de toets
       beantwoorden, de week afronden en dan een kaart beoordelen. Dat raakt de
       drie dingen die bij het ombouwen stuk hadden kunnen gaan — het programma
       uit drie gegevensbestanden, de faseovergang, en de kaartplanner. */
    async doe(pagina) {
      await pagina.getByRole('button', { name: 'Beginnen' }).click()
      for (let n = 0; n < 4; n++) await pagina.getByRole('button', { name: 'Verder' }).click()
      const opties = pagina.locator('.opt')
      if (await opties.count() < 2) return 'de toets kwam niet op het scherm'
      await opties.first().click()
      const oordeel = await pagina.locator('.note .meta').first().textContent()
      if (!/Juist|Nog niet/.test(oordeel ?? '')) return `geen beoordeling: ${oordeel}`
      await pagina.getByRole('button', { name: 'Week afronden' }).click()
      const af = await pagina.locator('.tag.green').first().textContent()
      if (!/Week 1 afgerond/.test(af ?? '')) return `week werd niet afgerond: ${af}`

      await pagina.getByRole('button', { name: 'Kaarten' }).click()
      const rij = await pagina.locator('.meta').last().textContent()
      if (!/in de rij/.test(rij ?? '')) return `geen kaartenrij: ${rij}`
      await pagina.getByRole('button', { name: 'Toon antwoord' }).click()
      if (!await pagina.locator('.flash .a').count()) return 'het antwoord bleef verborgen'
      const voor = Number((rij ?? '').match(/\d+/)?.[0] ?? 0)
      await pagina.getByRole('button', { name: /^Goed/ }).click()
      const na = Number((await pagina.locator('.meta').last().textContent() ?? '').match(/\d+/)?.[0] ?? 0)
      if (na !== voor - 1) return `de rij liep niet door: ${voor} → ${na}`
      return null
    },
  },
  {
    pad: '/bunyan/', kop: 'Computers & Code', minKnoppen: 6, plaat: 'bunyan',
    /* De eerste Python-les helemaal: uitleg, het voorbeeld in de editor, laten
       draaien, nakijken, de vragen, en afronden. Dat raakt de vertaler, de
       nakijkfunctie uit de gegevens én de puntentelling in één keer. Daarna nog
       de bouwbank, want die rekent met andere getallen. */
    async doe(pagina) {
      await pagina.getByRole('tab', { name: 'Coderen' }).click()
      await pagina.locator('.les').first().click()
      const blad = pagina.locator('.blad')
      await blad.getByRole('button', { name: 'Zet dit in de editor' }).click()
      await blad.getByRole('button', { name: 'Uitvoeren' }).click()
      const uit = await blad.locator('.uitvoer pre').textContent()
      if (!/Hallo wereld/.test(uit ?? '')) return `de Python draaide niet: ${uit}`
      await blad.getByRole('button', { name: 'Nakijken' }).click()
      const oordeel = await blad.locator('.kader h4').first().textContent()
      if (!/Klopt/.test(oordeel ?? '')) return `de opdracht werd niet goedgekeurd: ${oordeel}`

      /* Beide vragen goed beantwoorden; het juiste antwoord staat in de data
         maar de proef mag het niet kennen — dus alle knoppen langs tot er
         "Goed" staat is hier niet eerlijk. We nemen wat er staat en kijken of
         de knop opengaat. */
      const kaarten = blad.locator('#vragen .card, .card.plat')
      const vragen = await blad.locator('.card.plat').count()
      for (let i = 0; i < vragen; i++) {
        const kaart = blad.locator('.card.plat').nth(i)
        await kaart.getByRole('button').first().click()
      }
      const klaar = blad.getByRole('button', { name: 'Ik ben klaar' })
      if (await klaar.isDisabled()) return 'de knop bleef op slot na alle vragen'
      await klaar.click()
      const kop = await blad.locator('h2').first().textContent()
      if (!/Les af/.test(kop ?? '')) return `de les werd niet afgerond: ${kop}`
      await blad.getByRole('button', { name: 'Terug naar het overzicht' }).click()

      /* De JavaScript en de HTML draaien in een frame met een eigen policy.
         Dat is precies de plek waar een strikte CSP het stilletjes kan
         breken, dus die moet hier echt iets terugzeggen. */
      await pagina.getByRole('tab', { name: 'Werkbank' }).click()
      await pagina.getByRole('button', { name: 'JavaScript' }).click()
      await pagina.getByRole('button', { name: 'Uitvoeren' }).click()
      await pagina.waitForTimeout(1200)
      const console_ = await pagina.locator('.uitvoer pre').first().textContent()
      if (!/Hallo Amine/.test(console_ ?? '')) return `de zandbak zweeg: ${console_}`

      await pagina.getByRole('button', { name: 'Openen' }).first().click()
      await pagina.locator('.deel', { hasText: 'AMD Ryzen 5 5600' }).click()
      const totaal = await pagina.locator('.card', { hasText: 'Totaal' }).locator('.cijfer').textContent()
      if (!/105/.test(totaal ?? '')) return `de bouwbank rekende niet: ${totaal}`
      return null
    },
  },
]

let mis = 0
for (const p of PAGINAS) {
  overtredingen.length = 0
  fouten.length = 0
  buitenBereik.length = 0
  await pagina.goto(`http://localhost:${poort}${p.pad}`, { waitUntil: 'networkidle' })
  // De hub haalt eerst de ledenlijst op; zonder database blijft dat hangen op
  // de wachttekst. Dat is geen CSP-kwestie, dus we kijken naar wat er staat.
  const kop = await pagina.textContent('h1, .merk, .brand').catch(() => null)
  const knoppen = await pagina.locator('button').count()
  await pagina.screenshot({ path: `gereedschap/pagina-${p.plaat}.png` })

  const werkt = p.doe ? await p.doe(pagina) : null

  const csp = headersVoor(p.pad)['Content-Security-Policy']
  const goed = csp && (kop ?? '').includes(p.kop) && knoppen >= p.minKnoppen
               && !overtredingen.length && !fouten.length && !werkt
  if (!goed) mis++

  console.log(`\n${p.pad}`)
  console.log('  CSP:', csp ? 'toegepast' : 'ONTBREEKT')
  console.log('  kop:', JSON.stringify(kop))
  console.log('  knoppen:', knoppen)
  console.log('  CSP-overtredingen:', overtredingen.length)
  overtredingen.forEach((o) => console.log('     ·', o))
  console.log('  fouten:', fouten.length)
  fouten.forEach((o) => console.log('     ·', o))
  if (buitenBereik.length) {
    console.log('  buiten bereik in deze omgeving (geen fout):', buitenBereik.length)
  }
  if (p.doe) console.log('  werkt:', werkt ?? 'ja')
  console.log(goed ? '  → rendert onder de strikte policy' : '  → ER IS IETS MIS')
}

await browser.close()
server.close()
process.exit(mis ? 1 : 0)
