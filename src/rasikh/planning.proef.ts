/**
 * DE PLANNER BEWEZEN
 *
 * Niet tegen wat ik dacht dat eruit moest komen, maar tegen wat de oude,
 * gedraaide code wérkelijk teruggaf — over dertig planningen, veertig
 * beoordelingen, tien vastzettingen en vijfentwintig samenvoegingen. Zie
 * gereedschap/rasikh-gouden-waarden.mjs.
 *
 * Waarom juist hier zo streng: deze planner stuurt een reeks van jaren aan. Een
 * fout in het interval of in het samenvoegen laat zich pas over maanden zien,
 * en dan is er niets meer te herstellen.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import {
  REEKS, beoordeeld, doelSoeras, doelTotaal, doelVast, dueLijst, gezond,
  plan, soeraStand, vastgezet,
} from './planning'
import type { SoeraInfo } from './planning'
import { samenvoegen } from './opslag'
import type { AyaStaat, Cijfer, Stand } from './opslag'

const INDEX = gouden.index as SoeraInfo[]
const dag = gouden._peildag

describe('de intervallen staan gelijk aan de oude', () => {
  it('REEKS', () => { expect([...REEKS]).toEqual(gouden.reeks) })
})

describe('plan — dertig standen', () => {
  ;(gouden.gevallen as unknown as Array<{
    stand: Stand
    plan: { nieuw: number; reden: string; herhaalTijd: number; budget: number; rest: number; due: string[] }
    doelTotaal: number; doelVast: number; doelSoeras: number[]
    gezond: Record<string, number | null>
    soeraStand: Record<string, unknown>
  }>).forEach((g, i) => {
    const s = g.stand
    it(`geval ${i}: doel ${s.instel.doelVan}–${s.instel.doelTot}, ` +
       `${s.instel.minuten} min, volgorde ${s.instel.volgorde}`, () => {
      const p = plan(s, INDEX, dag)
      expect({
        nieuw: p.nieuw, reden: p.reden, herhaalTijd: p.herhaalTijd,
        budget: p.budget, rest: p.rest, due: p.due.map((d) => d.id),
      }).toEqual(g.plan)

      expect(doelTotaal(INDEX, s.instel)).toBe(g.doelTotaal)
      expect(doelVast(s, s.instel)).toBe(g.doelVast)
      expect(doelSoeras(INDEX, s.instel).map((x) => x.nr)).toEqual(g.doelSoeras)

      for (const [id, verwacht] of Object.entries(g.gezond)) {
        expect({ [id]: gezond(s.aya[id], dag) }).toEqual({ [id]: verwacht })
      }
      for (const info of INDEX) {
        expect({ [info.nr]: soeraStand(s, info, dag) })
          .toEqual({ [info.nr]: g.soeraStand[String(info.nr)] })
      }
    })
  })
})

describe('beoordeeld — veertig beoordelingen', () => {
  ;(gouden.beoordelingen as unknown as Array<{
    voor: AyaStaat | null; cijfer: Cijfer; na: AyaStaat
  }>).forEach((g, i) => {
    it(`geval ${i}: cijfer ${g.cijfer}${g.voor ? ` vanaf stap ${g.voor.stap}` : ' op een lege aya'}`, () => {
      expect(beoordeeld(g.voor ?? undefined, g.cijfer, dag)).toEqual(g.na)
    })
  })

  it('laat de oude staat heel', () => {
    const oud: AyaStaat = { stap: 2, vast: true, reeks: [3, 3], zwak: 1 }
    beoordeeld(oud, 1, dag)
    expect(oud).toEqual({ stap: 2, vast: true, reeks: [3, 3], zwak: 1 })
  })

  it('bewaart hoogstens de laatste zes beoordelingen', () => {
    let t: AyaStaat | undefined
    for (let n = 0; n < 10; n++) t = beoordeeld(t, 3, dag)
    expect(t?.reeks).toHaveLength(6)
  })

  it('komt nooit voorbij het laatste interval', () => {
    let t: AyaStaat | undefined
    for (let n = 0; n < 30; n++) t = beoordeeld(t, 3, dag)
    expect(t?.stap).toBe(REEKS.length - 1)
    expect(t?.due).toBe(dag + REEKS[REEKS.length - 1]!)
  })

  it('zet bij kwijt de stap terug op nul maar houdt de aya vast', () => {
    let t = beoordeeld(undefined, 3, dag)
    t = beoordeeld(t, 3, dag)
    expect(t.stap).toBe(2)
    t = beoordeeld(t, 1, dag)
    expect(t.stap).toBe(0)
    expect(t.vast).toBe(true)
    expect(t.due).toBe(dag + REEKS[0])
  })

  it('laat haperen de stap staan en de zwakte oplopen', () => {
    let t = beoordeeld(undefined, 3, dag)
    const stap = t.stap
    t = beoordeeld(t, 2, dag)
    expect(t.stap).toBe(stap)
    expect(t.zwak).toBe(1)
  })
})

describe('vastgezet — tien gevallen', () => {
  ;(gouden.vastzettingen as unknown as Array<{ voor: AyaStaat | null; na: AyaStaat }>)
    .forEach((g, i) => {
      it(`geval ${i}`, () => {
        expect(vastgezet(g.voor ?? undefined, dag)).toEqual(g.na)
      })
    })

  it('houdt de oorspronkelijke begindatum vast', () => {
    const oud: AyaStaat = { stap: 0, vast: false, reeks: [], zwak: 0, begonnen: dag - 100 }
    expect(vastgezet(oud, dag).begonnen).toBe(dag - 100)
  })
})

describe('samenvoegen — vijfentwintig gevallen', () => {
  ;(gouden.samenvoegingen as unknown as Array<{ a: Stand; b: Stand; uit: Stand }>)
    .forEach((g, i) => {
      it(`geval ${i}`, () => { expect(samenvoegen(g.a, g.b)).toEqual(g.uit) })
    })
})

describe('dueLijst', () => {
  const stand = (aya: Record<string, AyaStaat>): Stand =>
    ({ aya, log: [], instel: {} as never, instelD: null, laatste: null })

  it('zet de wankelste vooraan', () => {
    const s = stand({
      'a:1': { stap: 1, vast: true, reeks: [], zwak: 0, due: dag - 1 },
      'a:2': { stap: 1, vast: true, reeks: [], zwak: 5, due: dag },
      'a:3': { stap: 1, vast: true, reeks: [], zwak: 2, due: dag },
    })
    expect(dueLijst(s, dag).map((x) => x.id)).toEqual(['a:2', 'a:3', 'a:1'])
  })

  it('laat wat nog niet aan de beurt is buiten', () => {
    const s = stand({
      'a:1': { stap: 1, vast: true, reeks: [], zwak: 0, due: dag + 1 },
      'a:2': { stap: 1, vast: true, reeks: [], zwak: 0, due: dag },
    })
    expect(dueLijst(s, dag).map((x) => x.id)).toEqual(['a:2'])
  })

  it('laat wat niet vast staat buiten', () => {
    const s = stand({ 'a:1': { stap: 0, vast: false, reeks: [], zwak: 0, due: dag - 5 } })
    expect(dueLijst(s, dag)).toEqual([])
  })
})

describe('gezond', () => {
  it('geeft niets terug voor een aya die niet vaststaat', () => {
    expect(gezond(undefined, dag)).toBeNull()
    expect(gezond({ stap: 0, vast: false, reeks: [], zwak: 0 }, dag)).toBeNull()
  })
  it('blijft binnen nul en één', () => {
    const uiterst: AyaStaat = { stap: 99, vast: true, reeks: [3, 3, 3], zwak: 0, due: dag }
    expect(gezond(uiterst, dag)).toBeLessThanOrEqual(1)
    const slecht: AyaStaat = { stap: 0, vast: true, reeks: [1, 1, 1], zwak: 9, due: dag - 400 }
    expect(gezond(slecht, dag)).toBeGreaterThanOrEqual(0)
  })
  it('zakt naarmate een aya langer over tijd staat', () => {
    const t: AyaStaat = { stap: 3, vast: true, reeks: [3, 3, 3], zwak: 0, due: dag }
    const nu = gezond(t, dag) as number
    const laat = gezond({ ...t, due: dag - 5 }, dag) as number
    expect(laat).toBeLessThan(nu)
  })
})
