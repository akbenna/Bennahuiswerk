/**
 * DE REKENKERN BUNDELEN VOOR PROVITA CARE
 *
 *   node gereedschap/kern-bundel.mjs                      toont wat er zou komen
 *   node gereedschap/kern-bundel.mjs --naar <map>         schrijft het weg
 *
 * Bijvoorbeeld, met de twee repo's naast elkaar:
 *
 *   node gereedschap/kern-bundel.mjs --naar ../provita-care/src/lib/bennakern
 *
 * WAT ER UITKOMT
 *
 *   bennakern.js         één ES-module, gebouwd uit src/health/kern.ts
 *   herkomst.json        versie, commit, datum, en per bronbestand een sha256
 *   gouden-waarden.json  de veertig dagenreeksen uit src/health/gouden-waarden.json,
 *                        zodat de proef aan de ProVita-kant hetzelfde bewijst
 *                        als rekenkern.proef.ts hier
 *
 * WAAROM KOPIËREN EN GEEN NPM-PAKKET
 *
 * Omdat deze repo privé is en ProVita op Vercel bouwt. Een afhankelijkheid op
 * een privérepository vraagt een sleutel in de bouwomgeving van een ander
 * project, en een bouw die stukgaat op een verlopen sleutel is erger dan een
 * kopie die er gewoon staat. De kopie is dus het pakket, en wat een pakket
 * betrouwbaar maakt gaat mee: een versie, de herkomst, en de gouden waarden.
 * De ProVita-proef rekent de sha256 van bennakern.js na; een hand die in de
 * kopie zit, valt daar om.
 *
 * Alleen wat `kern.ts` exporteert komt mee. Waarom dat een korte lijst is staat
 * in de kop van dat bestand.
 */
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const INGANG = 'src/health/kern.ts'

const sha = (tekst) => createHash('sha256').update(tekst).digest('hex')

const uitvoer = await build({
  entryPoints: [INGANG],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  write: false,
  metafile: true,
  legalComments: 'none',
  tsconfig: 'tsconfig.json',
  /* Niet verkleinen: de kopie moet aan de andere kant te lezen zijn, ook voor
     wie hem alleen opent om te zien waar een getal vandaan komt. */
  minify: false,
})

const bronnen = Object.keys(uitvoer.metafile.inputs).sort()
const versie = /KERN_VERSIE = '([^']+)'/.exec(readFileSync(INGANG, 'utf8'))?.[1]
if (!versie) {
  console.error('kern-bundel: KERN_VERSIE niet gevonden in', INGANG)
  process.exit(1)
}

let commit = 'onbekend'
let schoon = false
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim()
  schoon = execSync(`git status --porcelain -- ${bronnen.join(' ')}`).toString().trim() === ''
} catch { /* buiten git: de herkomst zegt dan 'onbekend', en dat is waar */ }

const kop = `// =============================================================================
// BENNAKERN ${versie}: GEBOUWD, NIET MET DE HAND BEWERKEN
//
// Gebundeld uit akbenna/Bennahuiswerk ${INGANG}, commit ${commit}${schoon ? '' : ' (met lokale wijzigingen)'}.
// Opnieuw maken: node gereedschap/kern-bundel.mjs --naar <deze map>
// Wat erin zit en waarom niet meer: de kop van ${INGANG}.
// =============================================================================
`
const code = kop + uitvoer.outputFiles[0].text

const herkomst = {
  pakket: 'bennakern',
  versie,
  commit,
  schoon,
  gemaakt_op: new Date().toISOString().slice(0, 10),
  ingang: INGANG,
  sha256_bundel: sha(code),
  bronnen: Object.fromEntries(bronnen.map((b) => [b, sha(readFileSync(b))])),
}

const gouden = JSON.parse(readFileSync('src/health/gouden-waarden.json', 'utf8'))
const goudenKern = {
  _toelichting: 'Overgenomen uit Bennahuiswerk src/health/gouden-waarden.json, alleen de rekenkern. '
    + 'De risicoscores blijven daar: ze zitten niet in de kern.',
  _peildag: gouden._peildag,
  constanten: gouden.constanten,
  gevallen: gouden.gevallen,
}

const naarIdx = process.argv.indexOf('--naar')
if (naarIdx < 0) {
  console.log(kop)
  console.log(JSON.stringify(herkomst, null, 2))
  console.log(`\n${code.length} tekens, ${bronnen.length} bronbestanden, ${goudenKern.gevallen.length} gouden gevallen`)
  process.exit(0)
}

const map = resolve(process.argv[naarIdx + 1] ?? '')
mkdirSync(map, { recursive: true })
writeFileSync(join(map, 'bennakern.js'), code)
writeFileSync(join(map, 'herkomst.json'), JSON.stringify(herkomst, null, 2) + '\n')
writeFileSync(join(map, 'gouden-waarden.json'), JSON.stringify(goudenKern) + '\n')
console.log(`kern-bundel: ${versie} (${commit}) weggeschreven naar ${map}`)
if (!schoon) console.warn('kern-bundel: let op, de bronnen hebben lokale wijzigingen; commit eerst en bundel opnieuw')
