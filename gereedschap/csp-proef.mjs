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

/* Google Fonts is vanuit deze omgeving niet bereikbaar. Dat is geen fout in de
   app en geen CSP-overtreding — het is de sandbox. Zulke verzoeken worden
   apart geteld en genoemd, niet stilzwijgend weggefilterd. */
const isBuitenBereik = (url) => url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')

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

await pagina.goto(`http://localhost:${poort}/kalibratie/`, { waitUntil: 'networkidle' })
const kop = await pagina.textContent('h1').catch(() => null)
const knoppen = await pagina.locator('button').count()
await pagina.screenshot({ path: 'gereedschap/kalibratie-aanmelden.png' })

await browser.close()
server.close()

console.log('CSP:', headersVoor('/kalibratie/')['Content-Security-Policy'] ? 'toegepast' : 'ONTBREEKT')
console.log('kop op het scherm:', JSON.stringify(kop))
console.log('knoppen gerenderd:', knoppen)
console.log('CSP-overtredingen:', overtredingen.length)
overtredingen.forEach((o) => console.log('   ·', o))
console.log('fouten in de console:', fouten.length)
fouten.forEach((o) => console.log('   ·', o))
if (buitenBereik.length) {
  console.log(`buiten bereik in deze omgeving (geen fout): ${buitenBereik.length}`)
  buitenBereik.forEach((o) => console.log('   ·', o))
}

const goed = kop === 'Kalibratie' && knoppen >= 2 && !overtredingen.length && !fouten.length
console.log(goed ? '\nDe app rendert onder de strikte policy.' : '\nEr is iets mis.')
process.exit(goed ? 0 : 1)
