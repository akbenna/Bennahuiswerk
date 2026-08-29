/**
 * DE HUISHOUDMAAT-REGEL UIT KAL-AI TOETSEN
 *
 * `kal-ai.ts` draait op Deno en is hier niet uit te voeren: hij haalt zijn
 * bibliotheken van een URL en praat met een database. Maar het stuk dat kán
 * misgaan zonder dat iemand het merkt is puur — welke huishoudmaat hoort bij
 * welk woord — en dat is wel te toetsen.
 *
 * Dus wordt dat blok uit de échte bron geknipt en gedraaid. Niet uit een kopie:
 * een kopie loopt uiteen met het origineel en dan toetst deze proef iets wat
 * niet meer bestaat. Verdwijnen de merkregels, dan valt hij hier om.
 *
 *   node gereedschap/kal-ai-proef.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const BRON = 'health/edge/kal-ai.ts'
const VAN = '/* ---------------------------------------------------------------------------\n   HUISHOUDMATEN UIT DE TABEL'
const TOT = '\n\nDeno.serve('

const bron = readFileSync(BRON, 'utf8')
const van = bron.indexOf(VAN)
if (van < 0) { console.error(`MIS: het blok "HUISHOUDMATEN UIT DE TABEL" staat niet meer in ${BRON}`); process.exit(1) }
const tot = bron.indexOf('interface Onderdeel', van)
if (tot < 0) { console.error('MIS: het einde van het blok is niet te vinden'); process.exit(1) }

const stuk = bron.slice(van, tot)
for (const naam of ['normaliseerEenheid', 'kiesMaat', 'EENHEID_ALIAS']) {
  if (!stuk.includes(naam)) { console.error(`MIS: ${naam} staat niet in het geknipte blok`); process.exit(1) }
}

const proef = stuk + `
/* ---------------------------------------------------------------- proef -- */

let fout = 0
const eis = (goed, wat) => { if (!goed) { console.error('MIS: ' + wat); fout++ } else console.log('ok  ' + wat) }

/* De maten zoals ze werkelijk in de database staan voor "Hartige sauzen",
   plus twee die daar horen te komen. */
const SAUS = [
  { naam: 'eetlepel',  meervoud: 'eetlepels',  gram_schatting: 15, gram_laag: 10, gram_hoog: 20 },
  { naam: 'theelepel', meervoud: 'theelepels', gram_schatting: 5,  gram_laag: 4,  gram_hoog: 7 },
]

/* Een maat waarvan het meervoud NIET in de aliaslijst staat. Die is er met
   opzet: met 'lepels' erin bewees de proef niets over het meervoud, want dat
   woord komt al via een alias op 'eetlepel' uit. Hier is de meervoudsregel de
   enige weg. */
const IJS = [{ naam: 'bol', meervoud: 'bollen', gram_schatting: 50, gram_laag: 40, gram_hoog: 65 }]

eis(normaliseerEenheid('Eetlepels') === 'eetlepel', 'hoofdletters en meervoud worden één woord')
eis(normaliseerEenheid('el') === 'eetlepel', 'de afkorting el is een eetlepel')
eis(normaliseerEenheid('lepel') === 'eetlepel', 'een lepel is in het Nederlands een eetlepel')
eis(normaliseerEenheid('tl') === 'theelepel', 'tl is een theelepel')
eis(normaliseerEenheid('sneetje') === 'snede', 'sneetje en snede zijn hetzelfde')
eis(normaliseerEenheid('') === '', 'niets in, niets uit')

eis(kiesMaat('eetlepel', false, SAUS)?.gram_schatting === 15, 'de eetlepel komt uit de tabel')
eis(kiesMaat('lepels', false, SAUS)?.gram_schatting === 15, 'ook via een synoniem in het meervoud')
eis(kiesMaat('bollen', false, IJS)?.gram_schatting === 50,
    'een meervoud dat geen alias heeft wordt via het meervoud in de tabel gevonden')
eis(kiesMaat('theelepel', false, SAUS)?.gram_schatting === 5, 'de theelepel ook')

/* De drie gevallen waarin de tabel juist NIET mag winnen. */
/* Deze drie leggen gedrag vast en geen regel: haal je de gram-controle uit
   kiesMaat weg, dan blijven ze groen, want er is toch geen maat die 'gram'
   heet. Ze staan er om te betrappen wie ooit zo'n maat of alias toevoegt. Zie
   het commentaar bij kiesMaat — daar staat hetzelfde, en waarom. */
eis(kiesMaat('gram', false, SAUS) === null, 'gram voluit is geen huishoudmaat')
eis(kiesMaat('milliliter', false, SAUS) === null, 'milliliter voluit ook niet')
eis(kiesMaat('g', false, SAUS) === null, 'en de korte vorm evenmin')
eis(kiesMaat('eetlepel', true, SAUS) === null,
    'een gewogen portie laten we met rust: die is beter dan de tabel')
eis(kiesMaat('portie', false, SAUS) === null,
    'een maat die de tabel niet kent laat de schatting van het model staan')
eis(kiesMaat('eetlepel', false, []) === null, 'zonder maten valt er niets te vervangen')

/* De band hoort mee te komen, niet alleen het middelpunt. Een eetlepel met
   alleen "15 g" zou een zekerheid beweren die er niet is. */
const m = kiesMaat('eetlepel', false, SAUS)
eis(m.gram_laag === 10 && m.gram_hoog === 20, 'de band komt mee uit de tabel')
eis(m.gram_laag < m.gram_schatting && m.gram_schatting < m.gram_hoog, 'en hij omsluit het punt')

process.exit(fout ? 1 : 0)
`

const tijdelijk = '/tmp/kal-ai-blok.ts'
writeFileSync(tijdelijk, proef)
const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', tijdelijk],
                    { stdio: 'inherit' })
unlinkSync(tijdelijk)
process.exit(r.status ?? 1)
