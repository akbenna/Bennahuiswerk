/**
 * DE OVERZETTING BEWIJZEN
 *
 * De rekenkern is uit een gedraaid, verantwoord JavaScript-bestand overgezet
 * naar TypeScript. Zo'n overzetting is precies het moment waarop een stille
 * fout binnenkomt: een haakje verplaatst, een `Math.round` een niveau
 * verschoven, een `>=` dat een `>` wordt. Niets daarvan geeft een foutmelding;
 * het geeft een ander getal.
 *
 * Daarom controleert deze proef niet tegen wat ik dacht dat eruit moest komen,
 * maar tegen wat er werkelijk uit de oude code kwam — over veertig
 * dagenreeksen, dertig SCORE2-gevallen, twintig FIB-4's, vijfentwintig
 * STOP-BANG-invullingen en vijftien onderhoudszones. Zie
 * gereedschap/gouden-waarden-maken.mjs.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import { KCAL_PER_KG, VENSTER, analyse, trendReeks } from './rekenkern'
import type { Dagenkaart } from './rekenkern'
import { fib4, onderhoudZone, score2, stopbangScore } from './klinisch'
import type { Fib4Invoer, Score2Invoer, StopbangAntwoorden } from './klinisch'
import type { Geslacht, Profiel } from '@/gedeeld/db/tabellen'

/** De gouden waarden zijn json en dus ongetypt; hier gaan ze de typen in. */
interface Geval {
  profiel: Profiel
  dagen: Dagenkaart
  analyse: Record<string, unknown>
  trend: unknown
}
const gevallen = gouden.gevallen as unknown as Geval[]
const peildag = gouden._peildag

describe('constanten', () => {
  it('staan gelijk aan de oude', () => {
    expect(KCAL_PER_KG).toBe(gouden.constanten.KCAL_PER_KG)
    expect(VENSTER).toBe(gouden.constanten.VENSTER)
  })
})

describe('analyse — veertig dagenreeksen', () => {
  gevallen.forEach((g, i) => {
    it(`geval ${i}: ${Object.keys(g.dagen).length} dagen, ${g.profiel.geslacht}${g.profiel.leeftijd_jaar}`, () => {
      const nu = analyse(g.dagen, g.profiel, peildag) as unknown as Record<string, unknown>
      // Elk veld apart vergelijken: bij een verschil wil je weten wélk getal.
      for (const sleutel of Object.keys(g.analyse)) {
        expect({ [sleutel]: nu[sleutel] }).toEqual({ [sleutel]: g.analyse[sleutel] })
      }
      // En andersom, zodat een veld niet stilletjes kan verdwijnen.
      expect(Object.keys(nu).sort()).toEqual(Object.keys(g.analyse).sort())
    })
  })
})

describe('trendReeks', () => {
  gevallen.forEach((g, i) => {
    it(`geval ${i}`, () => {
      expect(trendReeks(g.dagen)).toEqual(g.trend)
    })
  })
})

/* SCORE2 is de enige van deze vijf die niet op de bit af vergeleken wordt, en
   dat is geen verzachting maar een correctie. De formule ketent exponentiëlen:
   `Math.exp` en `Math.pow` mogen per implementatie in de laatste bit afwijken,
   en dat doen ze ook — op Node 24 vielen twee van de dertig gevallen om op het
   vijftiende significante cijfer (12.86730793710429 tegen 12.8673079371043).
   Dat is geen overzettingsfout maar het gedrag van een `double`.

   Wat deze proef moet vangen is een verplaatst haakje of een omgeklapt
   vergelijkingsteken, en dat verandert een uitkomst in het derde cijfer, niet
   in het vijftiende. Tien decimalen is daarvoor een miljard keer scherper dan
   nodig. De klasse blijft wél exact vergeleken: dat is het enige dat een
   patiënt ooit te zien krijgt, en die mag niet schuiven. */
describe('score2', () => {
  ;(
    gouden.score2 as Array<{
      geslacht: string
      invoer: Score2Invoer
      uit: { risico: number; klasse: string } | null
    }>
  ).forEach((g, i) => {
    it(`geval ${i}: ${g.geslacht}, ${g.invoer.leeftijd} jaar`, () => {
      const uit = score2(g.geslacht as Geslacht, g.invoer)
      if (g.uit === null) {
        expect(uit).toBeNull()
        return
      }
      expect(uit).not.toBeNull()
      expect(uit!.klasse).toBe(g.uit.klasse)
      expect(uit!.risico).toBeCloseTo(g.uit.risico, 10)
    })
  })
})

describe('fib4', () => {
  ;(gouden.fib4 as Array<{ invoer: Fib4Invoer; uit: unknown }>).forEach((g, i) => {
    it(`geval ${i}`, () => {
      expect(fib4(g.invoer)).toEqual(g.uit)
    })
  })
})

describe('stopbang', () => {
  ;(gouden.stopbang as Array<{ invoer: StopbangAntwoorden; uit: unknown }>).forEach((g, i) => {
    it(`geval ${i}`, () => {
      expect(stopbangScore(g.invoer)).toEqual(g.uit)
    })
  })
})

describe('onderhoudZone', () => {
  ;(gouden.onderhoud as Array<{ trend: number; basis: number; uit: { zone: string; delta: number } | null }>)
    .forEach((g, i) => {
      it(`geval ${i}: trend ${g.trend} tegen basis ${g.basis}`, () => {
        const nu = onderhoudZone(g.trend, g.basis)
        // De oude gaf ook een kleur terug; die hoort niet in een rekenfunctie
        // en wordt hier dus niet vergeleken. Zie de kop van klinisch.ts.
        expect(nu).toEqual(g.uit == null ? null : { zone: g.uit.zone, delta: g.uit.delta })
      })
    })
})
