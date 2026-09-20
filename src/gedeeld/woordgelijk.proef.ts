/**
 * DE PROEF OP DE VERSOEPELING
 *
 * `woordgelijk` maakt een bestaande proef losser, en dat is het soort
 * verandering waar je later spijt van krijgt als niemand opschrijft hoe los
 * precies. De gouden waarden van de zes leer-apps zagen elke tekenwijziging in
 * de lesteksten; sinds de gedachtestreepjes eruit gingen zien ze de leestekens
 * niet meer.
 *
 * Wat hier vastligt is de andere helft: wát ze nog wél zien. Een woord dat
 * verdwijnt, een getal dat verschuift, een zin die van plaats wisselt, een lege
 * tekst waar er een stond. Zolang die regels staan is de versoepeling een grens
 * en geen gat.
 *
 * En de twee kopieën. `gereedschap/woordgelijk.mjs` doet hetzelfde voor de
 * opwekkers, die als los script draaien zonder de padaliassen van de app. Twee
 * kopieën die uiteenlopen zouden een vinger opleveren die aan beide kanten
 * anders gerekend wordt, en dan vergelijkt de proef twee dingen die niets met
 * elkaar te maken hebben. De laatste regels hieronder draaien allebei en leggen
 * ze naast elkaar.
 */
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { woordgelijk, woorden } from './woordgelijk'

describe('wat er wegvalt', () => {
  it('ziet geen verschil tussen een streepje, een komma en een dubbele punt', () => {
    expect(woorden('de lat ligt hoger — dat is het punt'))
      .toBe(woorden('de lat ligt hoger, dat is het punt'))
    expect(woorden('de lat ligt hoger — dat is het punt'))
      .toBe(woorden('de lat ligt hoger: dat is het punt'))
  })

  it('ziet geen verschil tussen een tussenzin met streepjes en één met haakjes', () => {
    expect(woorden('alles wat hier staat — wat vast is — bestaat anders'))
      .toBe(woorden('alles wat hier staat (wat vast is) bestaat anders'))
  })

  it('ziet geen verschil in hoofdletters, want een punt erbij maakt er een', () => {
    expect(woorden('hij kwam — zij ging')).toBe(woorden('hij kwam. Zij ging'))
  })
})

describe('wat er blijft', () => {
  it('ziet een woord dat verdwijnt', () => {
    expect(woorden('twee keer per week')).not.toBe(woorden('twee per week'))
  })

  it('ziet een getal dat verandert', () => {
    expect(woorden('150 minuten')).not.toBe(woorden('160 minuten'))
    expect(woorden('35,0')).not.toBe(woorden('32,5'))
  })

  it('ziet een andere volgorde', () => {
    expect(woorden('eerst vasthouden, dan uitbreiden'))
      .not.toBe(woorden('eerst uitbreiden, dan vasthouden'))
  })

  it('ziet een tekst die leeg is geworden', () => {
    expect(woorden('een zin')).not.toBe(woorden(''))
  })

  /* Arabisch en de Koranwoorden staan vol tekens die geen a-z zijn. Werden die
     als leesteken weggegooid, dan zou de halve leerstof op één lege tekst
     uitkomen en zou de proef overal groen staan. */
  it('houdt Arabisch en andere schriften vast', () => {
    expect(woorden('كِتَاب')).not.toBe('')
    expect(woorden('كِتَاب')).not.toBe(woorden('قَلَم'))
  })
})

describe('door de structuur heen', () => {
  it('raakt elke tekst in een genest object', () => {
    expect(woordgelijk({ a: 'x — y', b: [{ c: 'p — q' }] }))
      .toEqual({ a: 'x y', b: [{ c: 'p q' }] })
  })

  it('laat getallen, booleans en null met rust', () => {
    expect(woordgelijk({ n: 12, b: true, z: null })).toEqual({ n: 12, b: true, z: null })
  })
})

describe('de twee kopieën', () => {
  it('rekenen hetzelfde, in de app en in de opwekkers', () => {
    const gevallen = [
      'de lat ligt hoger — dat is het punt',
      'alles (wat vast is) bestaat anders',
      'كِتَاب en 150 minuten',
      '',
      'A B  céè',
    ]
    const hier = gevallen.map(woorden)
    const daar = JSON.parse(execFileSync('node', [
      '--input-type=module', '-e',
      "import { woorden } from './gereedschap/woordgelijk.mjs';"
      + `console.log(JSON.stringify(${JSON.stringify(gevallen)}.map(woorden)))`,
    ], { encoding: 'utf8' }))
    expect(daar).toEqual(hier)
  })
})
