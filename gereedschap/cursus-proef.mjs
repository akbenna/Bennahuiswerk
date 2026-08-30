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
 *   2. ze staan als drie eigen tegels tussen de andere apps, elk met een eigen
 *      toelichting, en zonder snelkoppelingsbalk ernaast
 *
 * Zonder die tweede helft zou "toegankelijk" betekenen: bereikbaar voor wie het
 * adres al kent. Dat is niet hetzelfde als vindbaar. En één verzameltegel die
 * "Kompas, Verbind, Podium" zegt, zegt niet waar er een van drieën over gaat.
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
  /* De hub haalt de gezinsleden bij de database op en onthoudt wie er is
     aangemeld. Allebei verzinnen we hier, want anders staat de poort in de weg
     en zijn de tegels niet te zien. */
  await pg.route('**/rest/v1/rpc/**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([
      { naam: 'amaani', rol: 'kind', emoji: '🚀', kleur: 'arabisch', heeftCode: true },
      { naam: 'abdelkader', rol: 'ouder', emoji: '🌿', kleur: 'health', heeftCode: true },
    ]),
  }))
  /* `tijd` moet erbij: een aanmelding vervalt na acht uur, en zonder dat veld
     is hij per definitie verlopen en staat de poort er alsnog. */
  await pg.addInitScript(`localStorage.setItem('bennahub.wie', JSON.stringify({
    gezin: 'benna', naam: 'abdelkader', rol: 'ouder', emoji: '\u{1F33F}',
    kleur: 'health', apps: [], tijd: Date.now(),
  }))`)
  await pg.goto(`http://localhost:${poort}/`, { waitUntil: 'networkidle' })
  await pg.waitForSelector('.appt', { timeout: 5000 })

  process.stdout.write('tegels        ')
  /* Elk van de drie hoort een eigen tegel te zijn met een eigen toelichting. Eén
     verzameltegel die "Kompas, Verbind, Podium" zegt, zegt niet waar er een van
     drieën over gaat — dat was juist de reden om het te veranderen. */
  const namen = await pg.locator('.appt h3').allTextContents()
  const mist = ['Kompas', 'Verbind', 'Podium'].filter((n) => !namen.some((t) => t.trim() === n))
  const snelbalk = await pg.locator('.snelbalk').count()

  if (mist.length) val(`geen eigen tegel voor ${mist.join(', ')}`)
  else if (snelbalk) val('de snelkoppelingsbalk staat er nog')
  else {
    /* En de weg: één tik op de tegel hoort in de cursus uit te komen, zonder dat
       er onderweg nog een code gevraagd wordt. Wie in BennaHub is aangemeld,
       hoort niet nog een tweede keer een wachtwoord te zien. */
    await pg.locator('.appt', { hasText: 'Kompas' }).first().click()
    await pg.waitForLoadState('networkidle')
    await pg.waitForTimeout(400)
    const slot = await pg.locator('#lock, .lockcard, input[type=password]').count()
    const waar = new URL(pg.url()).pathname
    if (slot) val('na één tik staat er alsnog een slot')
    else if (!waar.includes('/cursussen/')) val(`één tik komt uit op ${waar}`)
    else console.log(`drie eigen tegels · geen snelbalk · tik → ${waar}, geen code`)
  }
  await pg.close()
}

await browser.close()
server.close()
if (stuk) { console.log(`\n${stuk} fout(en).`); process.exit(1) }
console.log('\nDe cursussen zijn vrij toegankelijk.')
