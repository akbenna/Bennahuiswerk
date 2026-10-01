/**
 * DE VERWACHTE WAARDEN IN controle-md5.sql OPNIEUW UITREKENEN
 *
 *   node gereedschap/md5-verslag.mjs            toont het blok
 *   node gereedschap/md5-verslag.mjs --schrijf  zet het in het bestand
 *
 * Draai dit zodra er een functie in `health/database/` verandert. De proef
 * `src/health/dbverslag.proef.ts` valt anders om, en terecht: een controle die
 * de verkeerde waarde verwacht wijst naar de database terwijl het verschil aan
 * deze kant zit.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { blok } from './db-md5.mjs'

const MAP = 'health/database'
const PAD = MAP + '/controle-md5.sql'
const nieuw = blok(MAP)

if (!process.argv.includes('--schrijf')) {
  console.log(nieuw)
  process.exit(0)
}

const oud = readFileSync(PAD, 'utf8')
/* Alleen het blok tussen `values` en de sluitende haak van de `with`. De
   uitleg erboven en de vergelijking eronder blijven zoals ze zijn.

   Op de vondst toetsen en niet op het verschil: was het bestand al bij, dan is
   de uitkomst gelijk aan wat er stond, en dat is geen mislukking. */
const BLOK = /(\n  values\n)[\s\S]*?(\n\),\n)/
if (!BLOK.test(oud)) {
  console.error('md5-verslag: het values-blok is niet gevonden, er is niets geschreven')
  process.exit(1)
}
const uit = oud.replace(BLOK, `$1${nieuw}$2`)
writeFileSync(PAD, uit)
console.log(uit === oud
  ? `md5-verslag: ${PAD} was al bij (${nieuw.split('\n').length} functies)`
  : `md5-verslag: ${nieuw.split('\n').length} functies weggeschreven in ${PAD}`)
