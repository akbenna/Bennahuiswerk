/**
 * DE OVERZETTING BEWEZEN
 *
 * Alles hier vergelijkt met src/sanad/gouden-waarden.json, en dat bestand is
 * niet met de hand geschreven: het komt uit de oude pagina zelf, gedraaid door
 * gereedschap/sanad-gouden-waarden.mjs. Wat er getoetst wordt is dus niet wat
 * ik dénk dat de app deed, maar wat zij wérkelijk deed.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import gouden from './gouden-waarden.json'
import { CURRICULUM } from './gegevens/curriculum'
import { KAARTEN } from './gegevens/kaarten'
import { BRONNEN } from './gegevens/bronnen'
import { LEXICON } from './gegevens/lexicon'
import { EXTRA } from './gegevens/extra'
import { CONSOLIDATIE } from './gegevens/consolidatie'
import { PROGRAMMA, TOT, actieveWeek, openSporen, planWeek, weekTitel } from './programma'
import { actieveKaarten, beoordeel, dueKaarten, fmt, volgend } from './kaartplanner'
import type { Kaartstand, Oordeel } from './kaartplanner'
import { LEEG, reeksNa, samenvoegen } from './opslag'
import type { Stand } from './opslag'
import type { IsoDatum } from '../gedeeld/db/tabellen'

const vinger = (x: unknown): string =>
  createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

const NU = gouden.nu as IsoDatum

describe('de leerstof is ongeschonden overgekomen', () => {
  it('vijf sporen, met dezelfde modules in dezelfde volgorde', () => {
    expect(CURRICULUM.map((s) => s.id)).toEqual(gouden.stof.curriculum.map((s) => s.id))
    CURRICULUM.forEach((sp, i) => {
      const g = gouden.stof.curriculum[i]!
      expect({ nr: sp.nr, kleur: sp.kleur, titel: sp.titel })
        .toEqual({ nr: g.nr, kleur: g.kleur, titel: g.titel })
      expect(vinger(sp), `spoor ${sp.id}`).toBe(g.vinger)
      expect(sp.modules.map((m) => m.id)).toEqual(g.modules.map((m) => m.id))
    })
  })

  it('elke module draagt dezelfde secties en dezelfde toets', () => {
    const modules = CURRICULUM.flatMap((s) => s.modules)
    const g = gouden.stof.curriculum.flatMap((s) => s.modules)
    expect(modules).toHaveLength(g.length)
    modules.forEach((m, i) => {
      const w = g[i]!
      expect({ titel: m.titel, tijd: m.tijd, secties: m.secties.length,
        juist: m.check.j, opties: m.check.o.length })
        .toEqual({ titel: w.titel, tijd: w.tijd, secties: w.secties,
          juist: w.juist, opties: w.opties })
      expect(vinger(m), `module ${m.id}`).toBe(w.vinger)
    })
  })

  it('het juiste antwoord staat altijd binnen de opties', () => {
    for (const m of CURRICULUM.flatMap((s) => s.modules)) {
      expect(m.check.j, m.id).toBeGreaterThanOrEqual(0)
      expect(m.check.j, m.id).toBeLessThan(m.check.o.length)
    }
  })

  it('vierennegentig kaarten, elk aan een bestaand spoor', () => {
    const sporen = new Set(CURRICULUM.map((s) => s.id))
    expect(KAARTEN.map((k) => k.id)).toEqual(gouden.stof.kaarten.map((k) => k.id))
    KAARTEN.forEach((k, i) => {
      const g = gouden.stof.kaarten[i]!
      expect(k.s).toBe(g.s)
      expect(sporen.has(k.s), `kaart ${k.id} hangt aan spoor ${k.s}`).toBe(true)
      expect(vinger(k), `kaart ${k.id}`).toBe(g.vinger)
    })
    expect(new Set(KAARTEN.map((k) => k.id)).size).toBe(KAARTEN.length)
  })

  it('bronnen en lexicon staan er voluit in', () => {
    BRONNEN.forEach((b, i) => {
      const g = gouden.stof.bronnen[i]!
      expect({ t: b.t, d: b.d, n: b.n }).toEqual({ t: g.t, d: g.d, n: g.n })
      expect(vinger(b), b.t).toBe(g.vinger)
    })
    expect(BRONNEN).toHaveLength(gouden.stof.bronnen.length)
    LEXICON.forEach((x, i) => {
      const g = gouden.stof.lexicon[i]!
      expect(x.t).toBe(g.t)
      expect(vinger(x), x.t).toBe(g.vinger)
    })
    expect(LEXICON).toHaveLength(gouden.stof.lexicon.length)
  })

  it('elke module heeft zijn kernvraag, brontekst en opdracht', () => {
    const g = gouden.stof.extra as Record<string, { matn: number; vinger: string }>
    expect(Object.keys(EXTRA).sort()).toEqual(Object.keys(g).sort())
    for (const [id, e] of Object.entries(EXTRA)) {
      expect(e.matn.length, id).toBe(g[id]!.matn)
      expect(vinger(e), id).toBe(g[id]!.vinger)
      expect(e.kern.length, id).toBeGreaterThan(10)
      expect(e.doe.length, id).toBeGreaterThan(10)
    }
  })

  it('vijf consolidatieweken, elk achter een bestaand spoor', () => {
    const sporen = new Set(CURRICULUM.map((s) => s.id))
    CONSOLIDATIE.forEach((c, i) => {
      const g = gouden.stof.consolidatie[i]!
      expect({ na: c.na, titel: c.titel, taken: c.taken.length })
        .toEqual({ na: g.na, titel: g.titel, taken: g.taken })
      expect(vinger(c), c.na).toBe(g.vinger)
      expect(sporen.has(c.na), c.na).toBe(true)
    })
    expect(CONSOLIDATIE).toHaveLength(gouden.stof.consolidatie.length)
  })
})

describe('het programma', () => {
  it('telt achtentwintig weken in dezelfde volgorde als vroeger', () => {
    expect(TOT).toBe(gouden.totaal)
    expect(PROGRAMMA.map((w) => ({
      nr: w.nr, type: w.type, spoor: w.sp.id, titel: weekTitel(w),
      module: w.type === 'les' ? w.m.id : null,
    }))).toEqual(gouden.programma)
  })

  it('nummert aaneengesloten vanaf één', () => {
    PROGRAMMA.forEach((w, i) => expect(w.nr).toBe(i + 1))
  })

  it('sluit elk spoor af met zijn consolidatieweek', () => {
    for (const sp of CURRICULUM) {
      const weken = PROGRAMMA.filter((w) => w.sp.id === sp.id)
      expect(weken.at(-1)!.type, sp.id).toBe('cons')
    }
  })

  it('wijst de actieve week aan', () => {
    expect(actieveWeek({})).toBe(1)
    expect(actieveWeek({ 1: NU })).toBe(2)
    expect(actieveWeek({ 2: NU })).toBe(1)
    const alles = Object.fromEntries(PROGRAMMA.map((w) => [w.nr, NU]))
    expect(actieveWeek(alles)).toBe(TOT)
  })

  it('rekent de planweek uit de startdatum', () => {
    for (const p of gouden.planning) {
      expect(planWeek(p.start as IsoDatum | null, p.nu as IsoDatum), String(p.start)).toBe(p.week)
    }
  })
})

describe('de kaartplanner', () => {
  it('geeft dezelfde intervallen als vroeger', () => {
    for (const r of gouden.roosters) {
      const c = r.i === null ? {} : { i: r.i, e: r.e! }
      const d = volgend(c, r.q as Oordeel)
      expect(d, `i=${r.i} e=${r.e} q=${r.q}`).toBe(r.d)
      expect(fmt(d)).toBe(r.tekst)
    }
  })

  it('loopt hele reeksen beoordelingen gelijk met vroeger', () => {
    for (const reeks of gouden.reeksen) {
      let c: Kaartstand | undefined
      let s: Stand = { ...LEEG, alles: true }
      reeks.uit.forEach((stap, i) => {
        c = beoordeel(c, stap.q as Oordeel, NU)
        s = { ...s, ...reeksNa(s, NU) }
        expect({ i: c.i, e: +c.e.toFixed(10), n: c.n, due: c.due },
          `pad ${reeks.pad.join('')} stap ${i + 1}`)
          .toEqual({ i: stap.i, e: stap.e, n: stap.n, due: stap.due })
      })
      expect(s.dagreeks).toBe(reeks.dagreeks)
      expect(s.last).toBe(reeks.last)
    }
  })

  it('houdt de gemakfactor binnen zijn grenzen', () => {
    let c = beoordeel(undefined, 2, NU)
    for (let n = 0; n < 40; n++) c = beoordeel(c, 3, NU)
    expect(c.e).toBeLessThanOrEqual(3.2)
    let d = beoordeel(undefined, 2, NU)
    for (let n = 0; n < 40; n++) d = beoordeel(d, 0, NU)
    expect(d.e).toBeGreaterThanOrEqual(1.3)
    expect(d.i).toBe(0)
  })

  it('rekent het nieuwe interval met de oude gemakfactor', () => {
    /* "Makkelijk" mag niet twee keer meetellen in dezelfde beurt: eerst het
       interval uit de stand van vóór het oordeel, dan pas de factor omhoog. */
    const c = beoordeel({ i: 10, e: 2.5, n: 1, due: NU }, 3, NU)
    expect(c.i).toBe(Math.round(10 * 2.5 * 1.35))
    expect(c.e).toBe(2.65)
  })

  it('zet een gevallen kaart terug op vandaag', () => {
    expect(beoordeel({ i: 60, e: 2.5, n: 4, due: '2026-12-01' }, 0, NU))
      .toEqual({ i: 0, e: 2.3, n: 5, due: NU })
  })

  it('schrijft dagen en maanden zoals vroeger', () => {
    expect(fmt(1)).toBe('1 d')
    expect(fmt(29)).toBe('29 d')
    expect(fmt(30)).toBe('1 mnd')
    expect(fmt(365)).toBe('12 mnd')
  })

  it('geeft alleen de kaarten van opengevallen sporen vrij', () => {
    for (const g of gouden.openstaand) {
      const klaar = g.klaar as Record<number, string>
      const alles = 'alles' in g ? Boolean(g.alles) : false
      const open = openSporen(klaar)
      if (!alles) expect([...open].sort()).toEqual(g.sporen)
      const act = actieveKaarten(KAARTEN, open, alles)
      expect(act, JSON.stringify(g.klaar)).toHaveLength(g.actief)
      expect(dueKaarten(act, {}, NU)).toHaveLength(g.due)
      expect(actieveWeek(klaar)).toBe(g.week)
    }
  })

  it('laat een kaart met een datum in de toekomst met rust', () => {
    const stand: Record<string, Kaartstand> = {
      [KAARTEN[0]!.id]: { i: 8, e: 2.5, n: 2, due: '2026-12-01' },
      [KAARTEN[1]!.id]: { i: 1, e: 2.5, n: 1, due: NU },
    }
    const due = dueKaarten(KAARTEN, stand, NU).map((k) => k.id)
    expect(due).not.toContain(KAARTEN[0]!.id)
    expect(due).toContain(KAARTEN[1]!.id)
  })
})

describe('samenvoegen', () => {
  it('geeft dezelfde uitkomst als vroeger', () => {
    for (const g of gouden.samen) {
      expect(samenvoegen(g.a as Stand, g.b as Stand), JSON.stringify(g.a))
        .toEqual(g.uit)
    }
  })

  it('gooit nooit een afgeronde week weg', () => {
    const uit = samenvoegen({ ...LEEG, klaar: { 7: 'a' } }, { ...LEEG, klaar: { 8: 'b' } })
    expect(uit.klaar).toEqual({ 7: 'a', 8: 'b' })
  })

  it('houdt de verste kaart, ongeacht van welk toestel hij komt', () => {
    const ver: Kaartstand = { i: 32, e: 2.6, n: 6, due: '2026-12-01' }
    const dicht: Kaartstand = { i: 2, e: 2.4, n: 2, due: '2026-08-24' }
    expect(samenvoegen({ cards: { k: ver } }, { cards: { k: dicht } }).cards['k']).toEqual(ver)
    expect(samenvoegen({ cards: { k: dicht } }, { cards: { k: ver } }).cards['k']).toEqual(ver)
  })

  it('houdt de langste notitie', () => {
    expect(samenvoegen({ notities: { 3: 'kort' } }, { notities: { 3: 'veel langer verhaal' } })
      .notities[3]).toBe('veel langer verhaal')
    expect(samenvoegen({ notities: { 3: 'veel langer verhaal' } }, { notities: { 3: 'kort' } })
      .notities[3]).toBe('veel langer verhaal')
  })

  it('neemt de vroegste startdatum', () => {
    expect(samenvoegen({ start: '2026-03-01' }, { start: '2026-01-15' }).start).toBe('2026-01-15')
    expect(samenvoegen({ start: '2026-01-15' }, { start: '2026-03-01' }).start).toBe('2026-01-15')
    expect(samenvoegen({}, { start: '2026-01-15' }).start).toBe('2026-01-15')
    expect(samenvoegen({ start: '2026-01-15' }, {}).start).toBe('2026-01-15')
  })

  it('verliest niets bij een lege of ontbrekende kant', () => {
    const s: Stand = { ...LEEG, start: '2026-01-01', klaar: { 1: 'a' }, dagreeks: 4 }
    expect(samenvoegen(s, null)).toEqual(s)
    expect(samenvoegen(null, s)).toEqual(s)
    expect(samenvoegen(null, null)).toEqual(LEEG)
  })
})

describe('de dagreeks', () => {
  it('telt op bij aaneengesloten dagen', () => {
    const s: Stand = { ...LEEG, last: '2026-08-21', dagreeks: 3 }
    expect(reeksNa(s, NU)).toEqual({ last: NU, dagreeks: 4 })
  })

  it('begint opnieuw na een gat', () => {
    const s: Stand = { ...LEEG, last: '2026-08-19', dagreeks: 9 }
    expect(reeksNa(s, NU)).toEqual({ last: NU, dagreeks: 1 })
  })

  it('verandert niets binnen dezelfde dag', () => {
    const s: Stand = { ...LEEG, last: NU, dagreeks: 5 }
    expect(reeksNa(s, NU)).toEqual({ last: NU, dagreeks: 5 })
  })

  it('begint bij één als er nog nooit gewerkt is', () => {
    expect(reeksNa(LEEG, NU)).toEqual({ last: NU, dagreeks: 1 })
  })
})
