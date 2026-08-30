/**
 * DE CURSUSSEN ZIJN VRIJ TOEGANKELIJK
 *
 * De drie cursussen van de Academie stonden elk achter een eigen slot met een
 * cijfercode. Dat slot is eraf, en dit is de proef dat het eraf blijft.
 *
 * Waarom een echte browser en niet een grep op "lock": het slot was geen
 * markering maar gedrag. Het zette `#lock` op `display:flex` en riep `render()`
 * pas ná het ontgrendelen aan. Een bestand waar het slot half uit is gehaald
 * ziet er in de tekst prima uit en toont in de browser een leeg scherm. Daarom
 * kijkt deze proef naar wat er staat.
 *
 * Twee helften, en ze zijn allebei nodig:
 *
 *   1. de drie cursussen openen zonder slot en met inhoud erop
 *   2. de poort — het scherm waarop je kiest wie je bent — wijst ernaar, met
 *      erbij dat er geen wachtwoord nodig is
 *
 * Zonder die tweede helft zou "vrij toegankelijk" betekenen: bereikbaar voor
 * wie het adres al kent. Dat is niet hetzelfde als vindbaar.
 *
 * Hij leest `dist/`, dus eerst bouwen.
 *
 *   npm run build && CHROOM=... node gereedschap/cursus-proef.mjs
 *
 * Getoetst met een mutatieproef: het oude bestand met slot teruggezet in dist,
 * en dan valt hij om op "er staat nog een slot".
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const WORTEL = 'dist'
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
}

const server = createServer((req, res) => {
  let p = join(WORTEL, decodeURIComponent((req.url ?? '/').split('?')[0]))
  if (!existsSync(p) || p.endsWith('/')) p = join(p, 'index.html')
  if (!existsSync(p)) { res.writeHead(404); res.end('niet gevonden'); return }
  res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' })
  res.end(readFileSync(p))
})
await new Promise((r) => server.listen(0, r))
const poort = server.address().port

const browser = await chromium.launch({ executablePath: process.env.CHROOM })
let stuk = 0
const val = (m) => { console.log(`  FOUT — ${m}`); stuk++ }

/* ------------------------------------------------------------------ 1 */
const CURSUSSEN = [['kompas', 'KOMPAS'], ['communicatie', 'VERBIND'], ['presenteren', 'PODIUM']]
for (const [bestand, merk] of CURSUSSEN) {
  const pg = await browser.newPage()
  const fouten = []
  pg.on('pageerror', (e) => fouten.push(String(e)))
  await pg.goto(`http://localhost:${poort}/huiswerk/cursussen/${bestand}.html`,
                { waitUntil: 'networkidle' })
  await pg.waitForTimeout(400)

  const slot = await pg.locator('#lock, .lockcard, input[type=password]').count()
  const tekst = (await pg.locator('body').innerText()).trim()
  const knoppen = await pg.locator('button').count()

  process.stdout.write(`${bestand.padEnd(14)}`)
  if (slot) val('er staat nog een slot')
  /* Een cursus die opent maar niets toont is net zo stuk als een cursus achter
     een slot; render() moet echt gedraaid hebben. */
  else if (tekst.length < 200) val(`bijna niets op het scherm (${tekst.length} tekens)`)
  else if (!tekst.includes(merk)) val(`de kop zegt geen ${merk}`)
  else if (fouten.length) val(fouten[0])
  else console.log(`open · ${tekst.length} tekens · ${knoppen} knoppen`)
  await pg.close()
}

/* ------------------------------------------------------------------ 2 */
{
  const pg = await browser.newPage()
  /* De poort haalt de gezinsleden bij de database op. Die is hier niet, dus we
     verzinnen er twee — anders belandt het scherm op "geen verbinding" en is de
     poort zelf niet te zien. */
  await pg.route('**/rest/v1/rpc/**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([
      { naam: 'amaani', rol: 'kind', emoji: '🚀', kleur: 'arabisch', heeftCode: true },
      { naam: 'hanae', rol: 'ouder', emoji: '🌷', kleur: 'spel', heeftCode: true },
    ]),
  }))
  await pg.goto(`http://localhost:${poort}/`, { waitUntil: 'networkidle' })
  await pg.waitForSelector('.persoon', { timeout: 5000 })

  process.stdout.write('poort         ')
  const balk = pg.locator('.snelbalk')
  const links = await pg.locator('.snelbalk .snellinks a').allTextContents()
  if (!(await balk.count())) val('de cursussen staan niet op de poort')
  else if (links.length !== 3) val(`${links.length} cursuslinks in plaats van drie`)
  else if (!(await balk.innerText()).toLowerCase().includes('zonder wachtwoord')) {
    val('de poort zegt niet dat er geen wachtwoord nodig is')
  } else {
    /* En de weg zelf: één klik hoort in de cursus uit te komen, zonder dat er
       onderweg om een code gevraagd wordt. */
    await pg.locator('.snelbalk .snellinks a').first().click()
    await pg.waitForLoadState('networkidle')
    await pg.waitForTimeout(400)
    const slot = await pg.locator('#lock, .lockcard, input[type=password]').count()
    const waar = new URL(pg.url()).pathname
    if (slot) val('na één klik staat er alsnog een slot')
    else if (!waar.includes('/cursussen/')) val(`één klik komt uit op ${waar}`)
    else console.log(`${links.join(' · ')} → ${waar}, geen code gevraagd`)
  }
  await pg.close()
}

await browser.close()
server.close()
if (stuk) { console.log(`\n${stuk} fout(en).`); process.exit(1) }
console.log('\nDe cursussen zijn vrij toegankelijk.')
