/**
 * WISKUNDE A EN BIOLOGIE 5 VWO NAGEKEKEN
 *
 * Bij wiskunde A komen de kansen uit een eigen benadering van de normale
 * verdeling (`fi`, `fiInv`) en een exacte binomiale verdeling. De waarden
 * hieronder zijn daar los van uitgerekend, in Python met `math.erf` en exacte
 * binomiaalcoëfficiënten: een andere taal en een andere methode. Klopt de
 * benadering in de app niet, of zit er in een opgave een verkeerde grens, dan
 * valt deze proef om.
 *
 * Bij biologie gaat het om de kansen bij kruisingen en om wat de nakijker
 * goed rekent: een vakterm met de gangbare varianten, een kans in procenten,
 * en de verhouding 3 : 1 met of zonder spaties.
 */
import { describe, expect, it } from 'vitest'
import { BIOLOGIE_5VWO } from './gegevens/biologie5vwo'
import { WISKUNDEA_5VWO, binomcdf, fi, fiInv } from './gegevens/wiskundea5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { ONDERWERPICOON } from './gegevens/profielen'
import { antwoordKlopt, norm } from './nakijken'

const ALLES = [...WISKUNDEA_5VWO, ...BIOLOGIE_5VWO]
const getal = (a: string): number => parseFloat(norm(a))
const vind = (lijst: typeof ALLES, stuk: string) => {
  const e = lijst.filter((x) => x.q.includes(stuk))
  if (e.length !== 1) throw new Error(`${e.length} opgaven met "${stuk}"`)
  return e[0] as (typeof ALLES)[number]
}
const klopt = (stuk: string, verwacht: number): void => {
  const a = getal(vind(WISKUNDEA_5VWO, stuk).a)
  expect(Math.abs(a - verwacht) / verwacht, stuk).toBeLessThan(0.001)
}

describe('de normale en de binomiale verdeling', () => {
  it('benadert de normale verdeling op zes decimalen', () => {
    /* Tabelwaarden van Φ. */
    expect(fi(0)).toBeCloseTo(0.5, 6)
    expect(fi(1)).toBeCloseTo(0.841345, 6)
    expect(fi(-2)).toBeCloseTo(0.022750, 6)
    expect(fiInv(0.975)).toBeCloseTo(1.959964, 5)
    expect(fiInv(0.01)).toBeCloseTo(-2.326348, 5)
    expect(binomcdf(10, 0.3, 2)).toBeCloseTo(0.382783, 6)
  })

  it('rekent de normale verdeling na', () => {
    klopt('minder dan 480 g', 2.27501)
    klopt('meer dan 515 g', 6.68072)
    klopt('tussen 490 en 520 g', 81.8595)
    klopt('langer dan 190 cm', 7.65637)
    klopt('tussen 170 en 185 cm', 68.5911)
    klopt('minder dan 990 mL? Geef', 0.620967)
    klopt('langste 10 %', 188.971)
    klopt('kortste 5 %', 168.486)
    klopt('Bereken het gemiddelde μ', 508.416)
    klopt('Bereken σ', 4.86914)
    klopt('wordt afgekeurd', 4.55003)
    klopt('1000 pakken', 158.655)
  })

  it('rekent de binomiale verdeling na', () => {
    klopt('Bereken P(X = 3)', 26.6828)
    klopt('Bereken P(X ≤ 2)', 38.2783)
    klopt('geen enkele defect', 12.1577)
    klopt('P(X ≥ 8)', 10.1812)
    klopt('P(5 ≤ X ≤ 10)', 77.3375)
    klopt('minstens 6 goed', 5.44022)
    klopt('meer dan 90 % kans', 13)
    klopt('precies 2 keer kop', 31.25)
    klopt('hoogstens 1 product', 55.3542)
  })
})

describe('biologie', () => {
  it('rekent de kruisingen goed, en een verkeerde kans fout', () => {
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'Aa × Aa. Hoe groot is de kans op een nakomeling met genotype aa'), '25')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'Aa × Aa. Hoe groot is de kans op een nakomeling met genotype aa'), '50')).toBe(false)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'AaBb × AaBb, twee genen'), '6,25')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'AaBb × AaBb, twee genen'), '1/16')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'beide eigenschappen'), '56,25')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'heterozygoot is'), '66,7')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'verhouding komen'), '3 : 1')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'verhouding komen'), '1:3')).toBe(false)
  })

  it('rekent DNA-strengen letterlijk na', () => {
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'van ATGCCA'), 'tacggt')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'van ATGCCA'), 'TACGGA')).toBe(false)
    /* mRNA heeft U, geen T: een streng met T is fout. */
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'matrijsstreng van het DNA is TACGGT'), 'ATGCCA')).toBe(false)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'matrijsstreng van het DNA is TACGGT'), 'AUGCCA')).toBe(true)
  })

  it('accepteert de gangbare spellingen van een vakterm', () => {
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'Welk orgaan maakt insuline'), 'pancreas')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'isolerende laag'), 'mergschede')).toBe(true)
    expect(antwoordKlopt(vind(BIOLOGIE_5VWO, 'meer water terugnemen'), 'adh')).toBe(true)
  })
})

describe('de opgaven zelf', () => {
  it('rekent elk antwoord goed, en elk rekenantwoord van 10 % ernaast fout', () => {
    for (const e of ALLES) {
      expect(antwoordKlopt(e, e.a), e.q).toBe(true)
      const n = getal(e.a)
      if (!e.opties && !/[/:]/.test(e.a) && !Number.isNaN(n) && n >= 1) {
        expect(antwoordKlopt(e, String(n * 1.1)), e.q).toBe(false)
      }
    }
  })

  it('zet het antwoord van een meerkeuzevraag tussen de opties', () => {
    for (const e of ALLES.filter((x) => x.opties)) expect(e.opties, e.q).toContain(e.a)
  })

  it('geeft elk onderwerp zes opgaven per niveau', () => {
    const per = new Map<string, number[]>()
    for (const e of ALLES) {
      const k = `${e.v}|${e.t}`
      const n = per.get(k) ?? [0, 0, 0, 0]
      n[e.lvl ?? 0] = (n[e.lvl ?? 0] ?? 0) + 1
      per.set(k, n)
    }
    expect(per.size).toBe(8)
    for (const [t, n] of per) for (const lvl of [1, 2, 3]) expect(n[lvl], `${t} niveau ${lvl}`).toBe(6)
  })

  it('heeft een hint, een uitwerking en een teken bij elke opgave', () => {
    for (const e of ALLES) {
      expect(e.h?.length, e.q).toBeGreaterThan(0)
      expect((e.s ?? '').length, e.q).toBeGreaterThan(5)
      expect(ONDERWERPICOON[e.t], e.t).toBeTruthy()
    }
  })

  it('herhaalt geen vraag die er al was', () => {
    const nieuw = new Set(ALLES.map((e) => e.q))
    const elders = new Set([...SEED, ...NIEUW2627.filter((e) => !nieuw.has(e.q))].map((e) => e.q.trim()))
    for (const e of ALLES) expect(elders.has(e.q.trim()), e.q).toBe(false)
  })

  it('staat achter de natuurkunde, zodat de id’s van eerder niet verschuiven', () => {
    expect(NIEUW2627.find((e) => e.id === 'nw26_891')?.q).toBe(WISKUNDEA_5VWO[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_963')?.q).toBe(BIOLOGIE_5VWO[0]?.q)
  })
})
