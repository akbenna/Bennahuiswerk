// @vitest-environment node
//
// In de node-omgeving en niet in de browseromgeving die de rest van deze map
// gebruikt. Dat is geen voorkeur maar een eis: esbuild weigert te starten onder
// een `TextEncoder` die door jsdom is vervangen, met een melding over een
// invariant die niemand zonder deze regel zou thuisbrengen. En het klopt ook
// inhoudelijk, want wat hier draait is code die op een server hoort en niet in
// een browser.
/**
 * DE SLEUTELKLUIS, WERKELIJK GEDRAAID
 *
 * De edge-functies vallen buiten `tsc -b` en buiten de proeven: ze draaien op
 * Deno en importeren van https-adressen. De poort `npm run edge` leest ze en
 * controleert sinds kort ook de aanroepen, maar hij vóért niets uit.
 *
 * Voor de meeste code daar is dat te dragen. Voor dit stuk niet. Versleuteling
 * die alleen gelezen is, is versleuteling waarvan niemand weet of hij werkt, en
 * de manier waarop hij stuk kan gaan is stil: een verkeerde beginwaarde, een
 * sleutel die er toch nog in staat, twee keer dezelfde uitkomst. Dat zie je niet
 * aan de code en je merkt het niet aan de app.
 *
 * HOE DIT BESTAND BIJ DIE CODE KOMT
 *
 * Hij knipt het blok uit `health/edge/kal-ai.ts` tussen `KLUIS_VERSIE` en de
 * sleutelkeuring eronder, zet er een regel voor die `Deno` bekendmaakt, en laat
 * esbuild er gewone JavaScript van maken. Dat is dezelfde weg die
 * `gereedschap/privacy-schrijven.mjs` gebruikt, en om dezelfde reden: ontleden
 * met een reguliere expressie werkte daar niet en hier ook niet.
 *
 * Er wordt dus geen kopie getoetst maar de code zelf. Verandert dat blok, dan
 * verandert wat hier draait mee, en dat is het hele punt.
 *
 * WAT ER NIET MEE GETOETST IS
 *
 * Of de edge function hem op de goede momenten aanroept. Dat staat in de
 * proefopstelling (`je eigen sleutel`), aan de kant van het scherm. En of
 * Anthropic de ontsleutelde sleutel accepteert; dat blijkt pas bij de eerste
 * echte herkenning en staat als zodanig in bestand 49.
 */
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'
import { beforeAll, describe, expect, it } from 'vitest'

interface Kluis {
  versleutel: (tekst: string) => Promise<string>
  ontsleutel: (cijfer: string) => Promise<string>
  vergeet: () => void
}

let kluis: Kluis

/** Tweeëndertig willekeurige bytes als base64, zoals `openssl rand -base64 32`. */
const nieuweKluis = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64')

let hoofdsleutel = ''
const zet = (v: string | undefined) => {
  hoofdsleutel = v ?? ''
  kluis?.vergeet()
}

beforeAll(async () => {
  const bron = readFileSync('health/edge/kal-ai.ts', 'utf8')
  const van = bron.indexOf('const KLUIS_VERSIE')
  const tot = bron.indexOf('/* De voorwaarden aan een sleutel staan hier')
  expect(van, 'het kluisblok staat niet meer in kal-ai.ts').toBeGreaterThan(0)
  expect(tot).toBeGreaterThan(van)

  const { outputFiles } = await build({
    stdin: {
      contents:
        'declare const Deno: { env: { get(k: string): string | undefined } }\n'
        + bron.slice(van, tot)
        + '\nexport { versleutel, ontsleutel }\nexport function vergeet() { kluisCache = null }\n',
      loader: 'ts', resolveDir: '.',
    },
    bundle: true, format: 'esm', write: false, platform: 'node',
  })
  ;(globalThis as { Deno?: unknown }).Deno = { env: { get: () => hoofdsleutel || undefined } }
  kluis = await import(
    'data:text/javascript;base64,' + Buffer.from(outputFiles[0]!.text).toString('base64'))
})

const SLEUTEL = 'sk-ant-api03-' + 'q'.repeat(80)

describe('heen en terug', () => {
  it('geeft precies terug wat erin ging', async () => {
    zet(nieuweKluis())
    const cijfer = await kluis.versleutel(SLEUTEL)
    expect(await kluis.ontsleutel(cijfer)).toBe(SLEUTEL)
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. Versleutelde tekst die de sleutel
     nog bevat is geen versleutelde tekst, en dat is met het blote oog niet te
     zien aan iets wat op base64 lijkt. */
  it('draagt de sleutel niet meer in zich', async () => {
    zet(nieuweKluis())
    const cijfer = await kluis.versleutel(SLEUTEL)
    expect(cijfer).not.toContain('sk-ant')
    expect(cijfer).not.toContain('qqqq')
    /* En ook niet verpakt: de hele sleutel als base64 hoort er evenmin in te
       staan, want dan zou een omhulsel voor versleuteling doorgaan. */
    expect(cijfer).not.toContain(Buffer.from(SLEUTEL).toString('base64').slice(0, 20))
  })

  it('en draagt zijn versie voorop', async () => {
    zet(nieuweKluis())
    expect(await kluis.versleutel(SLEUTEL)).toMatch(/^v1\./)
  })
})

describe('de beginwaarde', () => {
  /* Bij AES-GCM is twee keer dezelfde beginwaarde met dezelfde sleutel geen
     schoonheidsfout maar een gat: dan zijn twee versleutelde teksten tegen
     elkaar weg te strepen. Dit is de proef die dat vangt, en het is precies het
     soort fout dat verder nergens opvalt. */
  it('is elke keer anders', async () => {
    zet(nieuweKluis())
    const uit = await Promise.all([1, 2, 3, 4, 5].map(() => kluis.versleutel(SLEUTEL)))
    expect(new Set(uit).size).toBe(5)
  })

  it('en alle vijf zijn leesbaar', async () => {
    zet(nieuweKluis())
    for (let i = 0; i < 5; i += 1) {
      expect(await kluis.ontsleutel(await kluis.versleutel(SLEUTEL))).toBe(SLEUTEL)
    }
  })
})

describe('wat er misgaat, gaat hoorbaar mis', () => {
  it('weigert een andere hoofdsleutel', async () => {
    zet(nieuweKluis())
    const cijfer = await kluis.versleutel(SLEUTEL)
    zet(nieuweKluis())
    await expect(kluis.ontsleutel(cijfer)).rejects.toThrow()
  })

  /* Dat dit een fout geeft en geen halve uitkomst is de reden dat de edge
     function erop kan vertrouwen: raakt `SLEUTELKLUIS` kwijt, dan valt de app
     niet stilletjes terug op de gedeelde sleutel en dus op de rekening van de
     eigenaar. */
  it('weigert een geknoeide cijfertekst', async () => {
    zet(nieuweKluis())
    const cijfer = await kluis.versleutel(SLEUTEL)
    const stuk = cijfer.slice(0, -4) + (cijfer.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    await expect(kluis.ontsleutel(stuk)).rejects.toThrow()
  })

  it('weigert een onbekende versie', async () => {
    zet(nieuweKluis())
    const cijfer = await kluis.versleutel(SLEUTEL)
    await expect(kluis.ontsleutel('v9' + cijfer.slice(2))).rejects.toThrow(/Onbekende versleuteling/)
  })

  it('weigert een hoofdsleutel van de verkeerde lengte', async () => {
    zet(Buffer.from(new Uint8Array(20)).toString('base64'))
    await expect(kluis.versleutel('x')).rejects.toThrow(/20 bytes en moet er 32 zijn/)
  })

  it('en zegt het als er helemaal geen is', async () => {
    zet(undefined)
    await expect(kluis.versleutel('x')).rejects.toThrow(/Geen SLEUTELKLUIS/)
  })
})
