/**
 * NEDERLANDS, ENGELS EN O&O 5 VWO NAGEKEKEN
 *
 * Bij de talen gaat het om wat de nakijker goed rekent. Een Engelse
 * werkwoordsvorm moet goed zijn met en zonder samentrekking, met een rechte of
 * een gekrulde apostrof, en een verkeerde tijd moet fout blijven: wie "lived"
 * typt waar "have lived" hoort, heeft de regel niet begrepen.
 *
 * Bij O&O staan een paar rekenvragen (de beslismatrix, het kritieke pad). Die
 * zijn hieronder los nagerekend in plaats van overgenomen uit de opgave.
 */
import { describe, expect, it } from 'vitest'
import { TALEN_5VWO } from './gegevens/talen5vwo'
import { OENO_5VWO } from './gegevens/oeno5vwo'
import { BIOLOGIE_5VWO } from './gegevens/biologie5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { ONDERWERPICOON } from './gegevens/profielen'
import { antwoordKlopt, norm } from './nakijken'

const ALLES = [...TALEN_5VWO, ...OENO_5VWO]
const getal = (a: string): number => parseFloat(norm(a))
const vind = (lijst: typeof ALLES, stuk: string) => {
  const e = lijst.filter((x) => x.q.includes(stuk))
  if (e.length !== 1) throw new Error(`${e.length} opgaven met "${stuk}"`)
  return e[0] as (typeof ALLES)[number]
}
const goed = (stuk: string, invoer: string): boolean => antwoordKlopt(vind(ALLES, stuk), invoer)

describe('Engels', () => {
  it('rekent een samentrekking goed, met elke apostrof', () => {
    expect(goed('since 2015', 'have lived')).toBe(true)
    expect(goed('since 2015', "'ve lived")).toBe(true)
    expect(goed('since 2015', '’ve lived')).toBe(true)
    expect(goed('(not / see) him yet', "haven't seen")).toBe(true)
    expect(goed('(not / see) him yet', 'have not seen')).toBe(true)
    expect(goed('I wish I ___ (not / say)', "hadn't said")).toBe(true)
    expect(goed('If she had left earlier', "wouldn't have missed")).toBe(true)
    expect(goed('If she had left earlier', 'would not miss')).toBe(false)
  })

  it('rekent een verkeerde tijd fout', () => {
    expect(goed('since 2015', 'lived')).toBe(false)
    expect(goed('visit) London last year', 'has visited')).toBe(false)
    expect(goed('the film ___ (start)', 'started')).toBe(false)
    expect(goed('If I ___ (know) the answer', 'know')).toBe(false)
    expect(goed('If they ___ (invite) me', 'invited')).toBe(false)
    expect(goed('I wish I ___ (have) more time', 'have')).toBe(false)
  })

  it('kent de onregelmatige vormen', () => {
    expect(goed('past simple van "to write"', 'wrote')).toBe(true)
    expect(goed('past simple van "to write"', 'written')).toBe(false)
    expect(goed('past participle (voltooid deelwoord) van "to speak"', 'spoken')).toBe(true)
    expect(goed('past participle (voltooid deelwoord) van "to speak"', 'spoke')).toBe(false)
  })
})

describe('Nederlands', () => {
  it('vraagt het foute woord, en rekent het goede woord fout', () => {
    expect(goed('Het meisje die daar loopt', 'die')).toBe(true)
    expect(goed('Het meisje die daar loopt', 'dat')).toBe(false)
    expect(goed('dat al jaren samenwerkt', 'hebben')).toBe(true)
    expect(goed('dat al jaren samenwerkt', 'heeft')).toBe(false)
  })

  it('laat geen drogreden twee keer als goed antwoord tussen de opties staan', () => {
    for (const e of TALEN_5VWO.filter((x) => x.opties)) {
      expect(new Set(e.opties).size, e.q).toBe(e.opties?.length)
      expect(e.opties?.filter((o) => antwoordKlopt(e, o)), e.q).toEqual([e.a])
    }
  })
})

describe('O&O', () => {
  it('rekent de beslismatrix en het kritieke pad na', () => {
    const weging = [3, 2, 1]
    const totaal = (score: number[]): number => score.reduce((t, s, i) => t + s * (weging[i] ?? 0), 0)
    expect(getal(vind(OENO_5VWO, 'Concept A scoort').a)).toBe(totaal([4, 2, 5]))
    expect(getal(vind(OENO_5VWO, 'Concept B scoort').a)).toBe(totaal([3, 5, 3]))
    expect(vind(OENO_5VWO, 'A scoort 21, B scoort 22').a).toBe(totaal([3, 5, 3]) > totaal([4, 2, 5]) ? 'B' : 'A')

    const A = 2, B = 3, C = 4, D = 1
    expect(getal(vind(OENO_5VWO, 'Hoeveel dagen duurt het project minstens').a)).toBe(A + Math.max(B, C) + D)
    expect(getal(vind(OENO_5VWO, 'speling heeft taak B').a)).toBe(C - B)
    expect(getal(vind(OENO_5VWO, 'Bereken het gemiddelde van 12, 13, 12 en 13').a)).toBe((12 + 13 + 12 + 13) / 4)
    expect(vind(OENO_5VWO, '20 % extra tijd').a).toBe(12 * 1.2 <= 15 ? 'ja' : 'nee')
  })

  it('accepteert de gangbare namen van een begrip', () => {
    expect(goed('die je in een experiment zelf verandert', 'onafhankelijke variabele')).toBe(true)
    expect(goed('die je in een experiment zelf verandert', 'afhankelijke variabele')).toBe(false)
    expect(goed('balken die laten zien', 'gantt chart')).toBe(true)
    expect(goed('lijst met eisen en wensen', 'PvE')).toBe(true)
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
    expect(per.size).toBe(9)
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
    expect(nieuw.size).toBe(ALLES.length)
    const elders = new Set([...SEED, ...NIEUW2627.filter((e) => !nieuw.has(e.q))].map((e) => e.q.trim()))
    for (const e of ALLES) expect(elders.has(e.q.trim()), e.q).toBe(false)
  })

  it('staat achter de biologie, zodat de id’s van eerder niet verschuiven', () => {
    expect(NIEUW2627.find((e) => e.id === 'nw26_963')?.q).toBe(BIOLOGIE_5VWO[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1035')?.q).toBe(TALEN_5VWO[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1143')?.q).toBe(OENO_5VWO[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1196')?.q).toBe(OENO_5VWO[OENO_5VWO.length - 1]?.q)
  })
})
