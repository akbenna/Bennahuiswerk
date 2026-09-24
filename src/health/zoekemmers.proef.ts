/**
 * ELKE EMMER WORDT GETEKEND, OF HIJ STAAT ERBIJ
 *
 * `kal_zoeken` geeft vijf emmers terug: je eigen maaltijden, de tabel, de
 * gerechten, je eigen producten en de merken. Een scherm dat er vier tekent is
 * niet stuk in de zin dat er iets omvalt. Het is erger: het toont "niets
 * gevonden" terwijl de treffers in het antwoord zitten.
 *
 * WAAROM DIT NIET DOOR DE TYPEN GEVANGEN WERD
 *
 * `merk` staat in `Zoekuitslag` en is niet optioneel, dus `tsc` had er alles
 * over te zeggen wat er te zeggen viel. Maar een veld dat je niet gebruikt is
 * geen fout, alleen een veld dat je niet gebruikt. De 219 merkproducten die in
 * de database stonden kwamen netjes over de lijn en werden op het scherm
 * Voeding nergens getekend; het invoervenster deed het wel, dus het viel pas op
 * toen iemand zijn eigen assortiment zocht en "niets gevonden" las.
 *
 * WAT DEZE PROEF DOET
 *
 * Hij leest de velden van `Zoekuitslag` uit `rpc.ts` met de parser van
 * TypeScript, zoekt elk bestand dat `kal_zoeken` aanroept, en eist per veld
 * één van twee dingen: het wordt in dat bestand van de uitslag afgelezen, of
 * het staat in een `ZOEKEMMERS_NIET_GETOOND` in datzelfde bestand.
 *
 * Die tweede uitweg is met opzet een uitweg en geen achterdeur. Hij dwingt geen
 * scherm om alles te tonen, hij dwingt alleen dat wat niet getoond wordt op
 * papier staat, in het bestand zelf, waar de volgende lezer het tegenkomt.
 *
 * WAT HIJ NIET DEKT
 *
 * Of een getekende emmer er goed uitziet, en of hij bij nul treffers netjes
 * wegblijft. Dat staat in de proefopstelling. Deze proef gaat over de vraag
 * ervoor: wordt hij überhaupt aangeraakt.
 */
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const RPC = 'src/gedeeld/db/rpc.ts'

/** De schermen die `kal_zoeken` aanroepen. Groeit die lijst, dan groeit de proef mee. */
const SCHERMEN = [
  'src/health/schermen/Voeding.tsx',
  'src/health/vensters/Invoer.tsx',
]

function vel(pad: string): ts.SourceFile {
  return ts.createSourceFile(pad, readFileSync(pad, 'utf8'), ts.ScriptTarget.ES2022, true,
    pad.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}

/** De veldnamen van `interface Zoekuitslag`, uit de bron en niet uit mijn hoofd. */
export function emmers(): string[] {
  const uit: string[] = []
  const loop = (k: ts.Node): void => {
    if (ts.isInterfaceDeclaration(k) && k.name.text === 'Zoekuitslag') {
      for (const lid of k.members) {
        if (ts.isPropertySignature(lid) && ts.isIdentifier(lid.name)) uit.push(lid.name.text)
      }
    }
    ts.forEachChild(k, loop)
  }
  loop(vel(RPC))
  return uit
}

/**
 * Hoe de uitslag in dit bestand heet, uit `useState<Zoekuitslag | null>(...)`.
 *
 * Zonder deze stap kijkt de proef naar élke naam achter een punt, en dan pleit
 * `m.merk` in een regel van de lijst de emmer `merk` vrij terwijl niemand hem
 * tekent. Dat is geen bedacht gevaar: de eerste versie van deze proef deed dat,
 * en een mutant die de hele emmer weghaalde bleef groen.
 */
function uitslagnaam(bron: ts.SourceFile): string | null {
  let naam: string | null = null
  const loop = (k: ts.Node): void => {
    if (ts.isVariableDeclaration(k) && ts.isArrayBindingPattern(k.name) && k.initializer
        && ts.isCallExpression(k.initializer)
        && k.initializer.typeArguments?.some(
          (t) => t.getText(bron).includes('Zoekuitslag'))) {
      const eerste = k.name.elements[0]
      if (eerste && ts.isBindingElement(eerste) && ts.isIdentifier(eerste.name)) {
        naam = eerste.name.text
      }
    }
    ts.forEachChild(k, loop)
  }
  loop(bron)
  return naam
}

/** De emmers die werkelijk ván de uitslag gelezen worden: `uitslag.merk`, `uitslag?.merk`. */
function afgelezen(bron: ts.SourceFile, van: string): Set<string> {
  const uit = new Set<string>()
  const loop = (k: ts.Node): void => {
    if (ts.isPropertyAccessExpression(k) && ts.isIdentifier(k.name)
        && ts.isIdentifier(k.expression) && k.expression.text === van) {
      uit.add(k.name.text)
    }
    ts.forEachChild(k, loop)
  }
  loop(bron)
  return uit
}

/** Wat het bestand zelf opgeeft als bewust niet getekend. */
function nietGetoond(bron: ts.SourceFile): Set<string> {
  const uit = new Set<string>()
  const loop = (k: ts.Node): void => {
    if (ts.isVariableDeclaration(k) && ts.isIdentifier(k.name)
        && k.name.text === 'ZOEKEMMERS_NIET_GETOOND' && k.initializer) {
      /* `[...] as const` zit in een AsExpression; de lijst staat eronder. */
      const lijst = ts.isAsExpression(k.initializer) ? k.initializer.expression : k.initializer
      if (ts.isArrayLiteralExpression(lijst)) {
        for (const e of lijst.elements) if (ts.isStringLiteral(e)) uit.add(e.text)
      }
    }
    ts.forEachChild(k, loop)
  }
  loop(bron)
  return uit
}

function roeptZoeken(bron: ts.SourceFile): boolean {
  let ja = false
  const loop = (k: ts.Node): void => {
    if (ts.isStringLiteral(k) && k.text === 'kal_zoeken') ja = true
    ts.forEachChild(k, loop)
  }
  loop(bron)
  return ja
}

describe('de emmers van kal_zoeken', () => {
  it('zijn er vijf, en ze komen uit rpc.ts', () => {
    expect(emmers().sort())
      .toEqual(['eigen', 'gerechten', 'maaltijden', 'merk', 'nevo'].sort())
  })

  it('en elk genoemd scherm roept hem werkelijk aan', () => {
    for (const pad of SCHERMEN) {
      expect(roeptZoeken(vel(pad)), `${pad} roept kal_zoeken niet aan`).toBe(true)
    }
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. Zonder deze regel verdwijnt een
     emmer stil, en dat is precies hoe de merkproducten verdwenen. */
  for (const pad of SCHERMEN) {
    it(`${pad} tekent elke emmer, of noemt hem`, () => {
      const bron = vel(pad)
      const van = uitslagnaam(bron)
      expect(van, `${pad} houdt de uitslag niet in een useState<Zoekuitslag>`).not.toBeNull()
      const gezien = afgelezen(bron, van as unknown as string)
      const gemeld = nietGetoond(bron)
      for (const e of emmers()) {
        expect(
          gezien.has(e) || gemeld.has(e),
          `${pad} doet niets met de emmer "${e}". Teken hem, of zet hem in `
          + 'ZOEKEMMERS_NIET_GETOOND met een reden erboven.',
        ).toBe(true)
      }
    })
  }

  /* En de uitweg mag geen sluipweg worden: wat erin staat hoort een emmer te
     zijn. Een typefout ("maaltyden") zou anders een emmer vrijpleiten die er
     niet is, terwijl de echte ongetekend blijft. */
  it('en wat als niet getoond staat, is ook werkelijk een emmer', () => {
    const geldig = new Set(emmers())
    for (const pad of SCHERMEN) {
      for (const naam of nietGetoond(vel(pad))) {
        expect(geldig.has(naam), `${pad} noemt "${naam}", en dat is geen emmer van Zoekuitslag`)
          .toBe(true)
      }
    }
  })
})
