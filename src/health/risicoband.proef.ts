/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **De grenzen van de band en de klasse van de app komen uit één bron.** Zij
 * stonden op twee plekken met dezelfde vier getallen erin, en twee plekken met
 * dezelfde getallen lopen uit elkaar zonder dat iemand het ziet. Dan kleurt de
 * band oranje bij een uitkomst die de app "laag" noemt, en dat is precies het
 * soort fout waar niemand een proef voor schrijft.
 *
 * **En de grenzen verschuiven met de leeftijd.** Dezelfde 6 procent heet onder
 * de vijftig matig en daarboven hoog. Een band die dat niet meeneemt, tekent de
 * verkeerde zone onder de stip.
 *
 * **Twee bijschriften die over elkaar vallen zijn één onleesbaar getal.** Bij
 * een klein verschil staan de stippen vlak bij elkaar. De stippen blijven staan
 * waar ze horen; de bijschriften wijken, en niet de figuur uit.
 */
import { describe, expect, it } from 'vitest'
import { score2, score2Grenzen, score2Klasse } from './klinisch'
import { LABELRUIMTE, uitElkaar } from './figuren'

describe('de grenzen van NHG-CVRM', () => {
  it('liggen lager onder de vijftig', () => {
    expect(score2Grenzen(49)).toEqual({ matig: 2.5, hoog: 7.5 })
    expect(score2Grenzen(50)).toEqual({ matig: 5, hoog: 10 })
  })

  it('bepalen de klasse, en de grens hoort bij de zwaardere kant', () => {
    expect(score2Klasse(52, 4.99)).toBe('laag')
    expect(score2Klasse(52, 5)).toBe('matig')
    expect(score2Klasse(52, 9.99)).toBe('matig')
    expect(score2Klasse(52, 10)).toBe('hoog')
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT: de band en de app zeggen hetzelfde.
     Hij rekent een echte SCORE2 uit en houdt zijn klasse naast wat de grenzen
     zeggen, dus hij valt om zodra een van de twee verschuift. */
  it('geven dezelfde klasse als score2 zelf', () => {
    for (const leeftijd of [42, 49, 50, 61]) {
      for (const sbd of [118, 132, 146, 170]) {
        const r = score2('m', { leeftijd, rook: false, sbd, tc: 5.4, hdl: 1.2, dm: false })
        if (!r) continue
        expect(r.klasse).toBe(score2Klasse(leeftijd, r.risico))
      }
    }
  })
})

describe('de twee bijschriften', () => {
  it('blijven staan waar ze staan als er ruimte genoeg is', () => {
    expect(uitElkaar(200, 100, 330)).toEqual({ nu: 200, straks: 100 })
  })

  it('wijken uit elkaar als ze te dicht bij elkaar komen', () => {
    const u = uitElkaar(160, 150, 330)
    expect(u.nu - u.straks).toBeCloseTo(LABELRUIMTE, 6)
    /* Elk de kant op waar hij toch al stond: het scenario staat links. */
    expect(u.straks).toBeLessThan(150)
    expect(u.nu).toBeGreaterThan(160)
  })

  it('wijken ook de andere kant op als het scenario rechts ligt', () => {
    const u = uitElkaar(150, 160, 330)
    expect(u.straks - u.nu).toBeCloseTo(LABELRUIMTE, 6)
    expect(u.straks).toBeGreaterThan(160)
  })

  it('lopen de figuur niet uit', () => {
    const links = uitElkaar(4, 2, 330)
    expect(links.nu).toBeGreaterThanOrEqual(13)
    expect(links.straks).toBeGreaterThanOrEqual(13)
    const rechts = uitElkaar(328, 326, 330)
    expect(rechts.nu).toBeLessThanOrEqual(317)
  })

  it('doen niets als er maar één stip is', () => {
    expect(uitElkaar(200, null, 330).nu).toBe(200)
  })
})
