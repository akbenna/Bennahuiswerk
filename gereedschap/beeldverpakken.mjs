/**
 * BEELD KEUREN EN VERPAKKEN
 *
 * Twee taken die bij elke levering foto's terugkomen, en die allebei met de
 * hand fout gaan.
 *
 * `blad` zet een map beelden naast elkaar op één vel met de bestandsnaam eronder.
 * Dat is er niet om mooi te zijn: `beeld.ts` eist dat elk beeld bekeken is
 * voordat het aan een gerecht gekoppeld wordt, en achttien bestanden los
 * openen is precies de handeling die je na de zesde overslaat. Op het vel van
 * september 2026 viel zo op dat de foto bij 'Kuru fasulye (witte bonen)'
 * kikkererwten toonde.
 *
 * `verpak` snijdt en hercodeert naar de maat waarop de app ze toont. De
 * bronnen waren 1600 bij 600 en 1024 bij 1024, samen zeven megabyte; wat de app
 * nodig heeft is 1600 bij 600 voor een schermband en 1400 bij 525 voor een
 * gerecht. Op kwaliteit 80 scheelt dat een factor drie zonder zichtbaar
 * verlies, gemeten met de proef in `health-voorbeeld.mjs`.
 *
 * WAAROM DIT VIA DE BROWSER GAAT
 *
 * Er is geen `sharp` en geen imagemagick in deze omgeving, en er is wel een
 * Chromium — die voor de proeven toch al geïnstalleerd staat. Een canvas doet
 * precies hetzelfde werk: schalen met `imageSmoothingQuality: 'high'` en
 * coderen met `toDataURL`. Eén afhankelijkheid minder om te onderhouden.
 *
 * GEBRUIK
 *
 *   node gereedschap/beeldverpakken.mjs <map> blad [uit] [voorvoegsel]
 *   node gereedschap/beeldverpakken.mjs <map> verpak <uit> <breed> <hoog> <kwaliteit>
 *
 * Bijvoorbeeld, zoals de zes schermbanden en elf gerechten erin kwamen:
 *
 *   ... /bron/koppen   verpak public/health/koppen    1600 600 80
 *   ... /bron/gerechten verpak public/health/gerechten 1400 525 80
 *
 * `verpak` snijdt naar het midden (`cover`) en haalt het voorvoegsel `kop-` of
 * `gerecht-` van de naam. Het schrijft altijd JPEG.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { readdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BRON = process.argv[2]
const TAAK = process.argv[3] || 'blad'
const UIT = process.argv[4] || '/tmp/claude-0/-home-user-Bennahuiswerk/2ae70cff-9a95-5060-bd5b-e64bd0a07ce0/scratchpad'

const browser = await chromium.launch({ executablePath: process.env.CHROOM || undefined })
const pagina = await browser.newPage()
await pagina.setContent('<canvas id=c></canvas>')

async function base64(p) { return (await readFile(p)).toString('base64') }

if (TAAK === 'blad') {
  const namen = readdirSync(BRON).filter((f) => /\.(jpg|png)$/i.test(f)).sort()
  const groepen = process.argv[5] ? namen.filter((n) => n.startsWith(process.argv[5])) : namen
  const bestanden = []
  for (const n of groepen) bestanden.push({ naam: n, data: await base64(`${BRON}/${n}`) })
  const png = await pagina.evaluate(async ({ bestanden }) => {
    const KOL = 3, VAK = 420, BALK = 34
    const rij = Math.ceil(bestanden.length / KOL)
    const c = document.getElementById('c')
    c.width = KOL * VAK; c.height = rij * (VAK + BALK)
    const x = c.getContext('2d')
    x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height)
    for (let i = 0; i < bestanden.length; i++) {
      const im = new Image()
      await new Promise((k) => { im.onload = k; im.src = 'data:image/jpeg;base64,' + bestanden[i].data })
      const cx = (i % KOL) * VAK, cy = Math.floor(i / KOL) * (VAK + BALK)
      const s = Math.min(VAK / im.width, VAK / im.height)
      const w = im.width * s, h = im.height * s
      x.drawImage(im, cx + (VAK - w) / 2, cy + (VAK - h) / 2, w, h)
      x.fillStyle = '#fff'; x.font = '18px monospace'
      x.fillText(bestanden[i].naam.replace(/\.(jpg|png)$/, ''), cx + 8, cy + VAK + 23)
      x.strokeStyle = '#444'; x.strokeRect(cx, cy, VAK, VAK + BALK)
    }
    return c.toDataURL('image/png').split(',')[1]
  }, { bestanden })
  await writeFile(`${UIT}/contactblad-${process.argv[5] || 'alles'}.png`, Buffer.from(png, 'base64'))
  console.log(`contactblad-${process.argv[5] || 'alles'}.png — ${bestanden.length} beelden`)
}

if (TAAK === 'verpak') {
  /* argv[5] = doelbreedte, argv[6] = doelhoogte (0 = naar verhouding), argv[7] = kwaliteit */
  const bw = Number(process.argv[5]), bh = Number(process.argv[6]), kw = Number(process.argv[7])
  await mkdir(UIT, { recursive: true })
  const namen = readdirSync(BRON).filter((f) => /\.(jpg|png)$/i.test(f)).sort()
  for (const n of namen) {
    const data = await base64(`${BRON}/${n}`)
    const uit = await pagina.evaluate(async ({ data, bw, bh, kw }) => {
      const im = new Image()
      await new Promise((k) => { im.onload = k; im.src = 'data:image/jpeg;base64,' + data })
      const h = bh || Math.round(bw * im.height / im.width)
      const c = document.getElementById('c')
      c.width = bw; c.height = h
      const x = c.getContext('2d')
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'
      /* cover: vul de doos, snij wat er overschiet */
      const s = Math.max(bw / im.width, h / im.height)
      const w2 = im.width * s, h2 = im.height * s
      x.drawImage(im, (bw - w2) / 2, (h - h2) / 2, w2, h2)
      return { jpg: c.toDataURL('image/jpeg', kw / 100).split(',')[1], w: bw, h }
    }, { data, bw, bh, kw })
    const buf = Buffer.from(uit.jpg, 'base64')
    const doel = `${UIT}/${n.replace(/^(kop|gerecht)-/, '').replace(/\.(jpg|png)$/i, '.jpg')}`
    await writeFile(doel, buf)
    console.log(`${n.padEnd(38)} → ${uit.w}×${uit.h}  ${(buf.length / 1024).toFixed(0)} kB`)
  }
}

await browser.close()
