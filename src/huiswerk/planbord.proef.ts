/**
 * HET PLANBORD NAGEREKEND
 *
 * Wat hier staat is niet met het oog te zien: dat de laatste dag vóór een toets
 * alleen overhoren is, dat een dag nooit méér dan tachtig procent vol komt, dat
 * een blok dat blijft liggen stilletjes naar voren schuift in plaats van rood
 * te worden, en dat de correctie op schattingen pas begint bij drie metingen en
 * dan als interval komt, niet als punt.
 */
import { describe, expect, it } from 'vitest'
import {
  capaciteit, dagenTussen, herplan, knipOnderdelen, leegPlan, schatting, schuif, toetsStand,
  vinkAf, voegPlanSamen, weekUren, zetEcht, zetToets,
} from './planbord'
import type { Blok, Planstand, Toets } from './planbord'

const VANDAAG = '2026-10-01' // een donderdag

function toets(deel: Partial<Toets> & { id: string; datum: string }): Toets {
  return {
    vak: 'wiskundeA', titel: 'Toets', onderdelen: ['A', 'B', 'C'], perOnderdeel: 45,
    bijgewerkt: 1, ...deel,
  }
}

function plan(...ts: Toets[]): Planstand {
  let p = leegPlan()
  for (const t of ts) p = zetToets(p, t)
  return herplan(p, VANDAAG, 1000)
}

describe('de dagen', () => {
  it('schuift over maandgrenzen heen', () => {
    expect(schuif('2026-09-30', 1)).toBe('2026-10-01')
    expect(schuif('2026-10-01', -1)).toBe('2026-09-30')
    expect(dagenTussen('2026-10-01', '2026-10-09')).toBe(8)
  })

  it('houdt tachtig procent van een dag aan', () => {
    /* 1 oktober 2026 is een donderdag: 120 minuten, dus 96 te plannen. */
    expect(capaciteit([150, 90, 120, 120, 120, 120, 180], VANDAAG)).toBe(96)
  })
})

describe('de terugplanning', () => {
  it('zet overhoren op de dag ervoor en herhalen twee dagen ervoor', () => {
    const p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const over = p.blokken.find((b) => b.soort === 'overhoor') as Blok
    const herh = p.blokken.find((b) => b.soort === 'herhaal') as Blok
    expect(over.datum).toBe('2026-10-06')
    expect(herh.datum).toBe('2026-10-05')
    /* De eerste ronde eindigt uiterlijk drie dagen voor de toets. */
    for (const b of p.blokken.filter((x) => x.soort === 'eerste')) {
      expect(b.datum <= '2026-10-04', b.id).toBe(true)
      expect(b.datum >= VANDAAG, b.id).toBe(true)
    }
  })

  it('spreidt de eerste ronde over de dagen in plaats van alles op één dag', () => {
    const p = plan(toets({ id: 'w', datum: '2026-10-07', onderdelen: ['A', 'B', 'C', 'D'] }))
    const dagen = new Set(p.blokken.filter((b) => b.soort === 'eerste').map((b) => b.datum))
    expect(dagen.size).toBeGreaterThan(1)
  })

  it('zet alles op vandaag als de toets morgen is', () => {
    const p = plan(toets({ id: 'b', datum: '2026-10-02', vak: 'biologie' }))
    expect(p.blokken.length).toBe(5)
    for (const b of p.blokken) expect(b.datum).toBe(VANDAAG)
  })

  it('plant niets voor een toets die al geweest is', () => {
    const p = plan(toets({ id: 'oud', datum: '2026-09-30' }))
    expect(p.blokken).toHaveLength(0)
  })

  it('laat een dag nooit over de capaciteit lopen zolang er elders ruimte is', () => {
    const p = plan(
      toets({ id: 'w', datum: '2026-10-07' }),
      toets({ id: 'n', datum: '2026-10-08', vak: 'natuurkunde' }),
      toets({ id: 'f', datum: '2026-10-09', vak: 'frans', perOnderdeel: 20 }),
    )
    const perDag = new Map<string, number>()
    for (const b of p.blokken) perDag.set(b.datum, (perDag.get(b.datum) ?? 0) + b.geschat)
    for (const [dag, min] of perDag) {
      const vol = p.blokken.some((b) => b.datum === dag && b.vol)
      if (!vol) expect(min, dag).toBeLessThanOrEqual(capaciteit(p.perDag, dag))
    }
  })

  it('schuift naar later als eerder vol is, in plaats van alles op vandaag', () => {
    /* Vier toetsen in acht dagen. Wat niet op zijn ideale dag past hoort naar
       een andere dag met ruimte, en pas als er nergens ruimte is naar de minst
       volle dag; vandaag is niet de put waar alles in valt. */
    const p = plan(
      toets({ id: 'b', datum: '2026-10-02', vak: 'biologie', onderdelen: ['A', 'B'], perOnderdeel: 40 }),
      toets({ id: 'w', datum: '2026-10-07' }),
      toets({ id: 'n', datum: '2026-10-08', vak: 'natuurkunde' }),
      toets({ id: 'f', datum: '2026-10-09', vak: 'frans', onderdelen: ['A', 'B', 'C', 'D'], perOnderdeel: 20 }),
    )
    const vandaag = p.blokken.filter((b) => b.datum === VANDAAG)
    /* Alleen de toets van morgen hoort vandaag te staan: die kan nergens anders heen. */
    expect(vandaag.every((b) => b.toets === 'b')).toBe(true)
    /* En de eerste ronde komt nooit op de dag vóór de toets. */
    for (const b of p.blokken.filter((x) => x.soort === 'eerste')) {
      const t = p.toetsen.find((x) => x.id === b.toets) as Toets
      if (dagenTussen(VANDAAG, t.datum) >= 2) expect(b.datum <= schuif(t.datum, -2), b.id).toBe(true)
    }
  })

  it('zegt eerlijk wanneer het niet past', () => {
    /* Zes onderdelen van een uur, toets overmorgen: dat past niet in twee
       dagen van 96 minuten. */
    const p = plan(toets({
      id: 'x', datum: '2026-10-03', onderdelen: ['1', '2', '3', '4', '5', '6'], perOnderdeel: 60,
    }))
    expect(p.blokken.some((b) => b.vol)).toBe(true)
    const [stand] = toetsStand(p, VANDAAG)
    expect(stand?.krap).toBe(true)
  })

  it('geeft elk blok een vast id dat een tweede planning herkent', () => {
    const a = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const b = herplan(a, '2026-10-02', 2000)
    expect(new Set(b.blokken.map((x) => x.id))).toEqual(new Set(a.blokken.map((x) => x.id)))
  })
})

describe('herplannen zonder verwijt', () => {
  it('laat afgevinkt werk staan en zet de rest opnieuw neer vanaf vandaag', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const eerste = p.blokken.find((b) => b.datum === VANDAAG) as Blok
    p = vinkAf(p, eerste.id, true, 5)
    /* Twee dagen later: niets anders gedaan. */
    const later = herplan(p, '2026-10-03', 3000)
    const af = later.blokken.find((b) => b.id === eerste.id) as Blok
    expect(af.gedaan).toBe(true)
    expect(af.datum).toBe(VANDAAG)
    for (const b of later.blokken.filter((x) => !x.gedaan)) {
      expect(b.datum >= '2026-10-03', b.id).toBe(true)
    }
  })

  it('merkt achterstand op aan wat er vóór vandaag had moeten gebeuren', () => {
    const p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    expect(toetsStand(p, VANDAAG)[0]?.status).toBe('nog niet begonnen')
    /* Niets gedaan, drie dagen verder: achter. */
    expect(toetsStand(p, '2026-10-04')[0]?.status).toBe('loopt achter')
    /* Alles van de eerste dagen af: op schema. */
    let q = p
    for (const b of p.blokken.filter((x) => x.datum < '2026-10-04')) q = vinkAf(q, b.id, true, 9)
    expect(toetsStand(q, '2026-10-04')[0]?.status).toBe('op schema')
    let r = q
    for (const b of p.blokken) r = vinkAf(r, b.id, true, 9)
    expect(toetsStand(r, '2026-10-04')[0]?.status).toBe('klaar')
  })
})

describe('schatten en meten', () => {
  const metParen = (ratios: number[]): Blok[] => ratios.map((r, i) => ({
    id: 'b' + i, toets: 't', soort: 'eerste' as const, taak: '', datum: VANDAAG,
    basis: 40, geschat: 40, gedaan: true, echt: Math.round(40 * r), klaarOp: 1,
  }))

  it('doet niets onder drie metingen', () => {
    expect(schatting(metParen([2, 2])).factor).toBe(1)
    expect(schatting(metParen([2, 2])).n).toBe(2)
  })

  it('neemt de mediaan, en geeft de kwartielen als band', () => {
    const s = schatting(metParen([1.0, 1.5, 1.5, 2.0, 3.0]))
    expect(s.n).toBe(5)
    expect(s.factor).toBe(1.5)
    expect(s.laag).toBe(1.5)
    expect(s.hoog).toBe(2.0)
  })

  it('corrigeert de volgende schattingen ermee', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07', onderdelen: ['A', 'B', 'C', 'D', 'E', 'F'], perOnderdeel: 40 }))
    const eerste = p.blokken.filter((b) => b.soort === 'eerste').slice(0, 3)
    for (const b of eerste) { p = vinkAf(p, b.id, true, 2); p = zetEcht(p, b.id, 80) }
    const q = herplan(p, '2026-10-02', 4000)
    const open = q.blokken.find((b) => b.soort === 'eerste' && !b.gedaan) as Blok
    expect(open.basis).toBe(40)
    expect(open.geschat).toBe(80)
  })

  it('geeft de week als interval, nooit als één getal', () => {
    const p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const w = weekUren(p, VANDAAG)
    expect(w.hoog).toBeGreaterThan(w.laag)
    expect(w.laag).toBeGreaterThan(0)
  })
})

describe('samenvoegen', () => {
  it('houdt afgevinkt werk van beide kanten en de planning van de nieuwste', () => {
    const basis = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const [b1, b2] = basis.blokken as [Blok, Blok]
    const tablet = vinkAf(basis, b1.id, true, 10)
    const telefoon = herplan(vinkAf(basis, b2.id, true, 11), '2026-10-02', 5000)
    const samen = voegPlanSamen(tablet, telefoon)
    expect(samen.blokken.find((b) => b.id === b1.id)?.gedaan).toBe(true)
    expect(samen.blokken.find((b) => b.id === b2.id)?.gedaan).toBe(true)
    expect(samen.geplandVoor).toBe('2026-10-02')
    expect(new Set(samen.blokken.map((b) => b.id)).size).toBe(samen.blokken.length)
  })

  it('laat een weggehaalde toets weg blijven', () => {
    const basis = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const weg = { ...basis, toetsen: basis.toetsen.map((t) => ({ ...t, weg: true, bijgewerkt: 9 })), blokken: [] }
    const samen = voegPlanSamen(basis, weg)
    expect(samen.toetsen[0]?.weg).toBe(true)
    expect(samen.blokken).toHaveLength(0)
  })

  it('verdraagt een lege of kapotte stand', () => {
    expect(voegPlanSamen(null, undefined).toetsen).toEqual([])
    expect(voegPlanSamen({ perDag: [1, 2] }, null).perDag).toHaveLength(7)
  })
})

describe('de stof knippen', () => {
  it('knipt per regel, en anders per komma', () => {
    expect(knipOnderdelen('§3.1\n§3.2\n§3.3')).toEqual(['§3.1', '§3.2', '§3.3'])
    expect(knipOnderdelen('woordjes, grammatica; teksten')).toEqual(['woordjes', 'grammatica', 'teksten'])
    expect(knipOnderdelen('')).toEqual([])
  })
})
