/**
 * DE POORT DIE ER NIET WAS
 *
 * `health/edge/` valt buiten `tsc -b`: die bestanden draaien op Deno, met
 * `import ... from "https://..."` en met globals die deze tsconfig niet kent.
 * Ze uit de bouw houden was juist. Ze uit élke controle houden was dat niet.
 *
 * WAT ER GEBEURDE
 *
 * De systeemprompt van kal-ai is een template-literal, en daarin kwamen
 * verwijzingen als `bronnen` en `activiteiten` te staan, met backticks, want zo
 * schrijft dit project een veldnaam op. Een backtick sluit een template-literal.
 * De prompt eindigde dus halverwege en de rest van het bestand werd onzin.
 *
 * Niets merkte het. De vier poorten kijken niet naar deze map, de armatuur
 * draait tegen een onderschepte kal-ai, en de proeven raken alleen de app. Het
 * kwam pas boven bij het uitrollen, drie commits later:
 *
 *     Failed to bundle the function (reason: The module's source code could
 *     not be parsed: Expression expected at .../index.ts:421:257
 *
 * WAT DEZE PROEF WEL EN NIET DOET
 *
 * Hij ontleedt elk bestand met de parser van TypeScript zelf, dezelfde die
 * `tsc` gebruikt, maar zonder typen op te zoeken. Dat is precies wat hier kan:
 * de imports wijzen naar https-adressen die van hier niet te halen zijn, dus
 * typecontrole is uitgesloten, maar of het bestand te lezen ís hangt daar niet
 * van af.
 *
 * Hij zegt dus niets over of de functie werkt. Alleen dat Deno hem kan
 * inlezen, en dat is exact de fout die hier drie commits lang heeft gestaan.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const MAP = 'health/edge'
const bestanden = readdirSync(MAP).filter((n) => n.endsWith('.ts'))
if (!bestanden.length) {
  console.error('edge-proef: geen enkel bestand gevonden in ' + MAP)
  process.exit(1)
}

let fout = 0
for (const naam of bestanden) {
  const pad = join(MAP, naam)
  const bron = readFileSync(pad, 'utf8')
  const vel = ts.createSourceFile(pad, bron, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  /* `parseDiagnostics` staat niet in de publieke typen maar is wat de parser
     zelf achterlaat. Een lege lijst is wat we willen zien. */
  const klachten = vel.parseDiagnostics ?? []
  if (klachten.length) {
    fout += klachten.length
    for (const k of klachten.slice(0, 5)) {
      const { line, character } = vel.getLineAndCharacterOfPosition(k.start ?? 0)
      const tekst = ts.flattenDiagnosticMessageText(k.messageText, ' ')
      console.error(`${pad}:${line + 1}:${character + 1}  ${tekst}`)
      console.error(`    ${(bron.split('\n')[line] ?? '').slice(Math.max(0, character - 60), character + 40)}`)
    }
    if (klachten.length > 5) console.error(`    … en nog ${klachten.length - 5}`)
  } else {
    console.log(`${pad.padEnd(28)} leesbaar · ${bron.split('\n').length} regels`)
  }
}

if (fout) {
  console.error(`\n${fout} leesfout${fout === 1 ? '' : 'en'}. Deno weigert dit bestand bij het uitrollen.`)
  process.exit(1)
}
/**
 * EN DE TWEEDE HELFT: KLOPPEN DE AANROEPEN
 *
 * Ontleden vangt een backtick die te vroeg sluit. Het vangt niet een aanroep
 * met een argument te veel, en dat is precies wat hier gebeurde op de dag dat
 * `claude(key, MODEL, ...)` een `vraagModel(aanbieder, sleutel, MODEL, ...)`
 * werd: de oude `key` bleef staan, het bestand bleef leesbaar, de poort bleef
 * groen, en het model zou de sleutel als systeemprompt hebben gekregen.
 *
 * WAAROM DIT EERST NIET KON, EN NU WEL
 *
 * De reden om het niet te doen stond in de kop hierboven en klopte: de imports
 * wijzen naar https-adressen die van hier niet te halen zijn, dus `tsc` kan het
 * bestand niet oplossen en weigert.
 *
 * Maar dat geldt voor de ímports, niet voor de rest. Een eigen compilerhost die
 * elk https-adres beantwoordt met een stuk `declare module` lost dat op: alles
 * wat van buiten komt heet dan `any`, en alles wat in dit bestand zelf staat
 * wordt gewoon nagekeken. Dat is minder dan een echte typecontrole en het is
 * veel meer dan niets.
 *
 * WAT ER DAAROM WORDT GENEGEERD
 *
 * Alles wat over de buitenwereld gaat: onbekende modules (2307), Deno dat deze
 * tsconfig niet kent (2304 op `Deno`), en `any` dat impliciet rondgaat. Wat
 * overblijft zijn de fouten die binnen het bestand zelf te zien zijn, en dat is
 * de soort die hier stond.
 */
const NEGEER = new Set([
  2307, // kan de module niet vinden: dat is het hele punt van de stub
  2305, // de module kent die naam niet: de stub kent geen enkele naam
  2304, // onbekende naam: Deno
  7016, 7006, 7031, 7034, 7005, // impliciet any, onvermijdelijk zonder echte typen
  2339, // eigenschap bestaat niet op any-achtige vorm
])

const STUB = 'declare const x: any; export = x;'

function controleerTypen(paden) {
  const opties = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    allowJs: false,
    skipLibCheck: true,
    strict: false,
    noImplicitAny: false,
  }
  const gewoon = ts.createCompilerHost(opties)
  const host = {
    ...gewoon,
    fileExists: (f) => (f.startsWith('https:') ? true : gewoon.fileExists(f)),
    readFile: (f) => (f.startsWith('https:') ? STUB : gewoon.readFile(f)),
    getSourceFile: (f, taal) =>
      f.startsWith('https:')
        ? ts.createSourceFile(f, STUB, taal, true, ts.ScriptKind.TS)
        : gewoon.getSourceFile(f, taal),
    resolveModuleNameLiterals: (namen, bevat) =>
      namen.map((n) =>
        n.text.startsWith('https:')
          ? { resolvedModule: { resolvedFileName: n.text, extension: '.ts' } }
          : ts.resolveModuleName(n.text, bevat, opties, gewoon)),
  }
  const programma = ts.createProgram(paden, opties, host)
  return ts.getPreEmitDiagnostics(programma)
    .filter((d) => !NEGEER.has(d.code))
    .filter((d) => d.file && !d.file.fileName.startsWith('https:'))
}

const klachten = controleerTypen(bestanden.map((n) => join(MAP, n)))
if (klachten.length) {
  for (const k of klachten.slice(0, 8)) {
    const vel = k.file
    const { line, character } = vel.getLineAndCharacterOfPosition(k.start ?? 0)
    console.error(`${vel.fileName}:${line + 1}:${character + 1}  `
      + ts.flattenDiagnosticMessageText(k.messageText, ' '))
  }
  if (klachten.length > 8) console.error(`    … en nog ${klachten.length - 8}`)
  console.error(`\n${klachten.length} typefout${klachten.length === 1 ? '' : 'en'} in de edge-functies.`)
  process.exit(1)
}
console.log(`${bestanden.length} edge-functies, alle leesbaar en de aanroepen kloppen.`)

