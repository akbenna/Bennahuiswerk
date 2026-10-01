/**
 * UNIT 1 VAN FRANS EN ENGELS NAGEKEKEN
 *
 * Dit is basisstof, en de punten gaan verloren aan de kleine dingen: een e bij
 * een vrouwelijk onderwerp, au of en, its of it’s. Dus gaat deze proef vooral na
 * dat de nakijker die kleine dingen fout rekent, en een telefoontoetsenbord
 * (rechte apostrof, geen accent) niet.
 */
import { describe, expect, it } from 'vitest'
import { ENGELS_UNIT1, FRANS_UNITE1 } from './gegevens/unit1'
import { VOORTPLANTING_5VWO } from './gegevens/biologie5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { ONDERWERPICOON } from './gegevens/profielen'
import { antwoordKlopt } from './nakijken'

const ALLES = [...FRANS_UNITE1, ...ENGELS_UNIT1]
const vind = (stuk: string) => {
  const e = ALLES.filter((x) => x.q.includes(stuk))
  if (e.length !== 1) throw new Error(`${e.length} opgaven met "${stuk}"`)
  return e[0] as (typeof ALLES)[number]
}
const goed = (stuk: string, invoer: string): boolean => antwoordKlopt(vind(stuk), invoer)

describe('Frans', () => {
  it('rekent de uitgang bij être fout als hij ontbreekt', () => {
    expect(goed('elle ___ (sortir) hier soir', 'est sortie')).toBe(true)
    expect(goed('elle ___ (sortir) hier soir', 'est sorti')).toBe(false)
    expect(goed('elle ___ (sortir) hier soir', 'a sorti')).toBe(false)
    expect(goed('mes amies ___ (partir)', 'sont partis')).toBe(false)
    expect(goed('il ne sort pas', "il n'est pas sorti")).toBe(true)
  })

  it('kent au, en, aux en à, en de uitzonderingen', () => {
    expect(goed('Je vais ___ France', 'au')).toBe(false)
    expect(goed('___ Mexique', 'au')).toBe(true)
    expect(goed('___ Mexique', 'en')).toBe(false)
    expect(goed('Il habite ___ Iran', 'au')).toBe(false)
    expect(goed('Il habite ___ Paris', 'a')).toBe(true) // geen accent op de telefoon
    expect(goed('Ik ga naar Italië', 'je vais en italie')).toBe(true)
    expect(goed('Ik ga naar Italië', 'je vais au italie')).toBe(false)
  })
})

describe('Engels', () => {
  it('rekent de valkuilen fout', () => {
    expect(goed('licking ___ paws', 'its')).toBe(true)
    expect(goed('licking ___ paws', "it's")).toBe(false)
    expect(goed('her’s', "her's")).toBe(false)
    expect(goed('football every Saturday', 'play')).toBe(false)
    expect(goed('Does she ___ (play)', 'plays')).toBe(false)
    expect(goed('(not / like) coffee', "doesn't like")).toBe(true)
    expect(goed('(not / like) coffee', "don't like")).toBe(false)
    expect(goed('(easy) than', 'more easy')).toBe(false)
  })

  it('rekent beide vormen goed waar er twee zijn', () => {
    expect(goed('Superlative van "far"', 'furthest')).toBe(true)
    expect(goed('Comparative van "simple"', 'more simple')).toBe(true)
  })
})

describe('de opgaven zelf', () => {
  it('rekent elk antwoord goed en zet het tussen de opties', () => {
    for (const e of ALLES) {
      expect(antwoordKlopt(e, e.a), e.q).toBe(true)
      if (e.opties) {
        expect(e.opties, e.q).toContain(e.a)
        expect(e.opties.filter((o) => antwoordKlopt(e, o)), e.q).toEqual([e.a])
      }
    }
  })

  it('geeft elk onderwerp zes opgaven per niveau', () => {
    const per = new Map<string, number[]>()
    for (const e of ALLES) {
      const k = `${e.v}|${e.t}`
      const n = per.get(k) ?? [0, 0, 0, 0]
      n[e.lvl ?? 0] = (n[e.lvl ?? 0] ?? 0) + 1
      per.set(k, n)
    }
    expect(per.size).toBe(6)
    for (const [t, n] of per) for (const lvl of [1, 2, 3]) expect(n[lvl], `${t} niveau ${lvl}`).toBe(6)
  })

  it('heeft een hint, een uitwerking en een teken bij elke opgave', () => {
    for (const e of ALLES) {
      expect(e.h?.length, e.q).toBeGreaterThan(0)
      expect((e.s ?? '').length, e.q).toBeGreaterThan(5)
      expect(ONDERWERPICOON[e.t], e.t).toBeTruthy()
    }
  })

  it('herhaalt geen vraag, en staat achteraan zodat geen id verschuift', () => {
    const nieuw = new Set(ALLES.map((e) => e.q))
    expect(nieuw.size).toBe(ALLES.length)
    const elders = new Set([...SEED, ...NIEUW2627.filter((e) => !nieuw.has(e.q))].map((e) => e.q.trim()))
    for (const e of ALLES) expect(elders.has(e.q.trim()), e.q).toBe(false)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1214')?.q).toBe(VOORTPLANTING_5VWO[17]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1215')?.q).toBe(FRANS_UNITE1[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1251')?.q).toBe(ENGELS_UNIT1[0]?.q)
    expect(NIEUW2627).toHaveLength(1323)
  })
})
