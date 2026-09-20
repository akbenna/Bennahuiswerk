/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * De sparkline in de kop van het inzichtscherm tekende niets zodra er geen twee
 * wegingen op opeenvolgende dagen stonden. Het pad bestond dan uit louter
 * verplaatsingen (`M`) zonder lijnstuk ertussen, en zo'n pad heeft geen lengte:
 * op het scherm stond het kopje "Gewicht, laatste acht weken" met een lege
 * strook eronder. Wie om de drie dagen weegt kreeg dus een figuur die eruitzag
 * alsof hij stuk was, terwijl zijn reeks alleen dun is.
 *
 * Twee eigenschappen houden dat tegen, en ze wijzen tegen elkaar in:
 *
 *   1. Elke waarde die er staat wordt getekend, ook een die helemaal alleen
 *      staat. Dat gebeurt met een lijnstuk naar zichzelf, wat met een ronde
 *      streepdop een stip geeft.
 *   2. Een gat blijft een gat. Er wordt nooit doorgetrokken over een dag waarop
 *      niet gewogen is, want dan zou de figuur een meting tonen die er niet is.
 *
 * De tweede zonder de eerste geeft de lege strook terug; de eerste zonder de
 * tweede geeft een vloeiende lijn die niet gemeten is. Beide staan hieronder.
 */
import { describe, expect, it } from 'vitest'
import { LIJNTJE_BREEDTE, lijnpad } from './hero'

/** Het aantal losse stukken: elk stuk begint met een `M`. */
const stukken = (d: string): number => (d.match(/M/g) ?? []).length
/** De lijnstukken: alleen hiervan tekent de browser iets. */
const lijnen = (d: string): number => (d.match(/L/g) ?? []).length
/** De punten uit het pad, op volgorde. */
const punten = (d: string): Array<[number, number]> =>
  [...d.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])

describe('wat er getekend wordt', () => {
  it('trekt een aaneengesloten reeks in één stuk door', () => {
    const d = lijnpad([1, 2, 3, 4], 1, 4, 46)
    expect(stukken(d)).toBe(1)
    expect(lijnen(d)).toBe(3)
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT.
     Om de drie dagen wegen: geen enkel punt heeft een buurman. Dit is precies
     de reeks die een lege strook opleverde. */
  it('tekent een reeks zonder enkele buur toch, als stippen', () => {
    const reeks = [110, null, null, 111, null, null, 109, null, null, 112]
    const d = lijnpad(reeks, 109, 112, 46)
    expect(stukken(d)).toBe(4)
    /* Vier stippen, dus vier lijnstukken: zonder deze eis staat er niets. */
    expect(lijnen(d)).toBe(4)
  })

  it('geeft een los punt een lijnstuk naar zichzelf en niet naar de buurman', () => {
    const d = lijnpad([null, 5, null], 5, 5, 46)
    const p = punten(d)
    expect(p).toHaveLength(2)
    expect(p[0]).toEqual(p[1])
  })

  it('tekent ook een los punt aan het einde van de reeks', () => {
    const d = lijnpad([1, 2, null, 9], 1, 9, 46)
    expect(stukken(d)).toBe(2)
    const p = punten(d)
    expect(p.at(-1)).toEqual(p.at(-2))
  })
})

describe('wat er níet getekend wordt', () => {
  it('trekt niet door over een gat heen', () => {
    const d = lijnpad([1, 2, null, null, 3, 4], 1, 4, 46)
    expect(stukken(d)).toBe(2)
    /* Twee paren, dus twee lijnstukken. Wordt er doorgetrokken, dan zijn het er
       meer en loopt de lijn over dagen waarop niet gewogen is. */
    expect(lijnen(d)).toBe(2)
  })

  it('maakt van een paar geen stippen', () => {
    const d = lijnpad([1, 2], 1, 2, 46)
    const p = punten(d)
    expect(p[0]).not.toEqual(p[1])
  })

  it('laat lege plekken leeg', () => {
    expect(lijnpad([null, null], 0, 1, 46)).toBe('')
  })
})

describe('de schaal', () => {
  it('legt de laagste waarde onderaan en de hoogste bovenaan', () => {
    const [laag, hoog] = punten(lijnpad([1, 9], 1, 9, 46))
    expect(laag![1]).toBe(46 - 4)
    expect(hoog![1]).toBe(46 - 4 - (46 - 10))
  })

  it('houdt een vlakke reeks binnen het vlak in plaats van te delen door nul', () => {
    for (const [, y] of punten(lijnpad([7, 7, 7], 7, 7, 46))) {
      expect(Number.isFinite(y)).toBe(true)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(46)
    }
  })

  it('spant van rand tot rand', () => {
    const p = punten(lijnpad([1, 2, 3], 1, 3, 46))
    expect(p[0]![0]).toBe(0)
    expect(p.at(-1)![0]).toBe(LIJNTJE_BREEDTE)
  })
})
