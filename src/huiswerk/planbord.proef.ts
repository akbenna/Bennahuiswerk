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
  actueel, capaciteit, dagenTussen, herplan, knipOnderdelen, leegPlan, maakLos, schatting, schuif,
  toetsStand, uurgetal, verplaats, vinkAf, voegPlanSamen, weekUren, zetDagtijd, zetEcht, zetEigen, zetToets,
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
    expect(capaciteit({ perDag: [150, 90, 120, 120, 120, 120, 180] }, VANDAAG)).toBe(96)
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

  it('laat de avond ervoor het teruglezen vallen en niet het overhoren', () => {
    /* Zoals op het scherm van 1 oktober: biologie morgen, twee onderdelen van
       40 minuten, herhalen en overhoren van 30. Samen 140 minuten op een
       donderdag van 96. */
    const p = plan(toets({
      id: 'b', datum: '2026-10-02', vak: 'biologie',
      onderdelen: ['Samenvatting doorlezen', 'Begrippen overhoren'], perOnderdeel: 40,
    }))
    const soort = (s: string) => p.blokken.filter((b) => b.soort === s)
    expect(soort('overhoor')[0]?.vol).toBeFalsy()
    expect(soort('herhaal')[0]?.vol).toBeFalsy()
    expect(soort('eerste').some((b) => b.vol)).toBe(true)
    /* Wat past staat bovenaan. */
    const vol = p.blokken.map((b) => !!b.vol)
    expect(vol).toEqual([...vol].sort((a, b) => Number(a) - Number(b)))
  })

  it('houdt de gewone volgorde als alles past', () => {
    const p = plan(toets({ id: 'b', datum: '2026-10-02', vak: 'biologie', onderdelen: ['A'], perOnderdeel: 20 }))
    expect(p.blokken.map((b) => b.soort)).toEqual(['eerste', 'herhaal', 'overhoor'])
    expect(p.blokken.some((b) => b.vol)).toBe(false)
  })

  it('plant niets voor een toets die al geweest is', () => {
    const p = plan(toets({ id: 'oud', datum: '2026-09-30' }))
    expect(p.blokken).toHaveLength(0)
  })

  it('zet niets op een dag die op nul staat, ook niet als het nergens past', () => {
    /* Dinsdag is sportdag. Tien uur stof met de toets donderdag past niet, maar
       de overloop hoort op de dagen die er wél zijn, niet op dinsdag. */
    let p = leegPlan()
    p = { ...p, perDag: [150, 90, 0, 120, 120, 120, 180] }
    p = zetToets(p, toets({
      id: 'x', datum: '2026-10-08', perOnderdeel: 60,
      onderdelen: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    }))
    p = herplan(p, VANDAAG, 1)
    expect(p.blokken.some((b) => b.vol)).toBe(true)
    for (const b of p.blokken) expect(b.datum, b.id).not.toBe('2026-10-06')
  })

  it('maakt geen blok voor een toets van vandaag', () => {
    const p = plan(toets({ id: 'nu', datum: VANDAAG }))
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
      if (!vol) expect(min, dag).toBeLessThanOrEqual(capaciteit(p, dag))
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

  it('noemt elke toets krap die een blok op een overvolle dag heeft', () => {
    /* Drie toetsen die elk afzonderlijk zouden passen, maar samen niet. */
    const p = plan(
      toets({ id: 'a', datum: '2026-10-05', onderdelen: ['1', '2', '3'], perOnderdeel: 60 }),
      toets({ id: 'b', datum: '2026-10-05', vak: 'natuurkunde', onderdelen: ['1', '2', '3'], perOnderdeel: 60 }),
      toets({ id: 'c', datum: '2026-10-05', vak: 'frans', onderdelen: ['1', '2', '3'], perOnderdeel: 60 }),
    )
    const krap = toetsStand(p, VANDAAG).filter((s) => s.krap).map((s) => s.toets.id)
    for (const id of new Set(p.blokken.filter((b) => b.vol).map((b) => b.toets))) {
      expect(krap, id).toContain(id)
    }
    expect(krap.length).toBeGreaterThan(0)
  })

  it('geeft een opdracht met deadline geen herhaal- of overhoorblok', () => {
    const p = plan(toets({ id: 'oo', datum: '2026-10-09', vak: 'oeno', opdracht: true, onderdelen: ['Onderzoek', 'Schrijven'] }))
    expect(p.blokken.map((b) => b.soort)).toEqual(['eerste', 'eerste'])
    for (const b of p.blokken) expect(b.datum < '2026-10-09', b.id).toBe(true)
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
    /* Ook nadat het bord op die dag opnieuw gepland heeft: herplannen schuift de
       blokken naar voren maar wist de achterstand niet uit. Dit is precies wat
       er gebeurt als ze het bord opent. */
    const herpland = herplan(p, '2026-10-04', 9000)
    for (const b of herpland.blokken) expect(b.datum >= '2026-10-04', b.id).toBe(true)
    expect(toetsStand(herpland, '2026-10-04')[0]?.status).toBe('loopt achter')
    /* Alles van de eerste dagen af: op schema. */
    let q = p
    for (const b of p.blokken.filter((x) => x.datum < '2026-10-04')) q = vinkAf(q, b.id, true, 9)
    expect(toetsStand(q, '2026-10-04')[0]?.status).toBe('op schema')
    let r = q
    for (const b of p.blokken) r = vinkAf(r, b.id, true, 9)
    expect(toetsStand(r, '2026-10-04')[0]?.status).toBe('klaar')
  })
})

describe('zelf bijsturen', () => {
  it('laat een blok dat ze zelf verplaatst staan bij het herplannen', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const b = p.blokken.find((x) => x.soort === 'eerste') as Blok
    p = verplaats(p, b.id, '2026-10-05')
    const later = herplan(p, '2026-10-02', 2)
    expect(later.blokken.find((x) => x.id === b.id)?.datum).toBe('2026-10-05')
    expect(later.blokken.find((x) => x.id === b.id)?.vast).toBe(true)
    /* En los gemaakt mag het bord hem weer neerzetten waar het wil. */
    const los = herplan(maakLos(later, b.id), '2026-10-02', 3)
    expect(los.blokken.find((x) => x.id === b.id)?.vast).toBeUndefined()
  })

  it('plant een vastgezet blok opnieuw als de dag voorbij is en het niet af is', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const b = p.blokken.find((x) => x.soort === 'eerste') as Blok
    p = verplaats(p, b.id, '2026-10-02')
    const later = herplan(p, '2026-10-03', 2)
    const nu = later.blokken.find((x) => x.id === b.id) as Blok
    expect(nu.datum >= '2026-10-03').toBe(true)
    expect(nu.vast).toBeUndefined()
  })

  it('houdt haar eigen minuten aan, ook als het bord iets anders zou rekenen', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07', onderdelen: ['A', 'B', 'C', 'D', 'E', 'F'], perOnderdeel: 40 }))
    /* Drie metingen die een factor twee geven. */
    for (const b of p.blokken.filter((x) => x.soort === 'eerste').slice(0, 3)) {
      p = vinkAf(p, b.id, true, 2); p = zetEcht(p, b.id, 80)
    }
    const open = p.blokken.filter((x) => x.soort === 'eerste' && !x.gedaan)
    p = zetEigen(p, (open[0] as Blok).id, 25)
    const q = herplan(p, '2026-10-02', 4)
    expect(q.blokken.find((x) => x.id === (open[0] as Blok).id)?.geschat).toBe(25)
    expect(q.blokken.find((x) => x.id === (open[1] as Blok).id)?.geschat).toBe(80)
  })

  it('plant minder op een dag waar ze minder tijd heeft', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    p = zetDagtijd(p, '2026-10-03', 0)
    p = herplan(p, VANDAAG, 5)
    expect(p.blokken.filter((b) => b.datum === '2026-10-03')).toHaveLength(0)
    expect(capaciteit(p, '2026-10-03')).toBe(0)
    expect(capaciteit(zetDagtijd(p, '2026-10-03', null), '2026-10-03')).toBe(144)
  })

  it('bewaart wat af, vast of zelf geschat is als ze de stof aanpast', () => {
    let p = plan(toets({ id: 'w', datum: '2026-10-07', onderdelen: ['A', 'B', 'C'] }))
    const [a, b2] = p.blokken.filter((x) => x.soort === 'eerste') as [Blok, Blok]
    p = vinkAf(p, a.id, true, 1)
    p = zetEigen(p, b2.id, 15)
    p = zetToets(p, toets({ id: 'w', datum: '2026-10-07', onderdelen: ['A', 'B nieuw'], bijgewerkt: 2 }))
    p = herplan(p, VANDAAG, 6)
    expect(p.blokken.find((x) => x.id === a.id)?.gedaan).toBe(true)
    const nb = p.blokken.find((x) => x.id === b2.id) as Blok
    expect(nb.taak).toBe('B nieuw')
    expect(nb.geschat).toBe(15)
    expect(p.blokken.some((x) => x.id === 'w|eerste|2')).toBe(false)
  })
})

describe('actueel', () => {
  it('plant een bord van gisteren opnieuw, zodat elk scherm vandaag hetzelfde ziet', () => {
    const p = plan(toets({ id: 'w', datum: '2026-10-07' }))
    expect(actueel(p, VANDAAG)).toBe(p)
    const morgen = actueel(p, '2026-10-02')
    expect(morgen.geplandVoor).toBe('2026-10-02')
    for (const b of morgen.blokken) expect(b.datum >= '2026-10-02', b.id).toBe(true)
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

  it('schrijft een half uur met een komma', () => {
    expect(uurgetal(11.5)).toBe('11,5')
    expect(uurgetal(12)).toBe('12')
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

  it('laat een weggehaald vinkje weg, ook als het andere toestel het nog heeft', () => {
    const basis = plan(toets({ id: 'w', datum: '2026-10-07' }))
    const b1 = basis.blokken[0] as Blok
    const telefoon = vinkAf(basis, b1.id, true, 10)
    const tablet = vinkAf(telefoon, b1.id, false, 20)
    expect(voegPlanSamen(telefoon, tablet).blokken.find((b) => b.id === b1.id)?.gedaan).toBe(false)
    expect(voegPlanSamen(tablet, telefoon).blokken.find((b) => b.id === b1.id)?.gedaan).toBe(false)
    /* En wie daarna opnieuw aanvinkt, wint weer. */
    const weer = vinkAf(tablet, b1.id, true, 30)
    expect(voegPlanSamen(telefoon, weer).blokken.find((b) => b.id === b1.id)?.gedaan).toBe(true)
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
