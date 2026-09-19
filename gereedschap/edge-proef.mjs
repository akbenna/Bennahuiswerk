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
 * verwijzingen als `bronnen` en `activiteiten` te staan — met backticks, want zo
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
 * Hij ontleedt elk bestand met de parser van TypeScript zelf — dezelfde die
 * `tsc` gebruikt, maar zonder typen op te zoeken. Dat is precies wat hier kan:
 * de imports wijzen naar https-adressen die van hier niet te halen zijn, dus
 * typecontrole is uitgesloten, maar of het bestand te lezen ís hangt daar niet
 * van af.
 *
 * Hij zegt dus niets over of de functie werkt. Alleen dat Deno hem kan
 * inlezen — en dat is exact de fout die hier drie commits lang heeft gestaan.
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
console.log(`${bestanden.length} edge-functies, alle leesbaar.`)
