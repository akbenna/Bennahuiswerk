/**
 * DE STARTTOETSEN RECHTGEZET
 *
 * De eerste versie las de toetsen af van stippen in een rooster en zat er bij
 * biologie en natuurkunde naast. `herstelStart` zet een bord dat daarmee gevuld
 * is recht, en mag niets aanraken wat het kind zelf veranderde.
 */
import { describe, expect, it } from 'vitest'
import { herstelStart, STARTTOETSEN } from './gegevens/toetsen-start'
import { VOORTPLANTING_5VWO } from './gegevens/biologie5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { ONDERWERPICOON } from './gegevens/profielen'
import { herplan, leegPlan, toetsStand, vinkAf, zetToets } from './planbord'
import type { Planstand, Toets } from './planbord'
import { antwoordKlopt } from './nakijken'

const VANDAAG = '2026-10-01'

/** Het bord zoals het op 1 oktober op haar scherm stond. */
function oudBord(): Planstand {
  const oud: Toets[] = [
    { id: 'start-bio-2026-10-02', vak: 'biologie', datum: '2026-10-02', titel: 'Toets biologie',
      onderdelen: ['Samenvatting en schema’s doorlezen', 'Begrippen overhoren'], perOnderdeel: 40, bijgewerkt: 100 },
    { id: 'start-wisa-2026-10-07', vak: 'wiskundeA', datum: '2026-10-07', titel: 'Toets wiskunde A',
      onderdelen: ['Theorie en voorbeelden, opschrijven wat je niet snapt', 'Opgaven maken', 'Oefentoets op tijd'], perOnderdeel: 45, bijgewerkt: 100 },
    { id: 'start-nat-2026-10-08', vak: 'natuurkunde', datum: '2026-10-08', titel: 'Toets natuurkunde',
      onderdelen: ['Formules op één blad, met eenheden', 'Voorbeeldopgaven nadoen, dan opgaven', 'Oefentoets op tijd'], perOnderdeel: 45, bijgewerkt: 100 },
    { id: 'start-fatl-2026-10-09', vak: 'frans', datum: '2026-10-09', titel: 'Toets Frans',
      onderdelen: ['Woordjes eerste helft', 'Woordjes tweede helft', 'Grammatica', 'Woordjes door elkaar'], perOnderdeel: 20, bijgewerkt: 100 },
  ]
  let p = leegPlan()
  for (const t of oud) p = zetToets(p, t)
  return herplan(p, VANDAAG, 1)
}
const toets = (p: Planstand | undefined, id: string) => p?.toetsen.find((t) => t.id === id)

describe('het oude bord rechtzetten', () => {
  it('zet biologie, natuurkunde en Frans op de echte datum en voegt Nederlands toe', () => {
    const q = herstelStart(oudBord(), 'amaani')
    expect(toets(q, 'start-bio-2026-10-02')?.datum).toBe('2026-10-09')
    expect(toets(q, 'start-nat-2026-10-08')?.datum).toBe('2026-10-12')
    expect(toets(q, 'start-fatl-2026-10-09')?.datum).toBe('2026-10-14')
    expect(toets(q, 'start-ned-2026-10-09')?.datum).toBe('2026-10-09')
    expect(toets(q, 'start-fra-so-2026-10-05')?.datum).toBe('2026-10-05')
    expect(toets(q, 'start-eng-idiom-2026-10-05')?.datum).toBe('2026-10-05')
    expect(toets(q, 'start-eng-gram-2026-10-08')?.datum).toBe('2026-10-08')
    expect(toets(q, 'start-ned-2026-10-08')?.datum).toBe('2026-10-08')
    /* Wiskunde A is niet nagekeken en blijft zoals hij was. */
    expect(toets(q, 'start-wisa-2026-10-07')?.datum).toBe('2026-10-07')
  })

  it('zet vanavond geen biologie meer op het bord, en telt niets als achterstand', () => {
    const q = herplan(herstelStart(oudBord(), 'amaani') as Planstand, VANDAAG, 2)
    const bio = q.blokken.filter((b) => b.toets === 'start-bio-2026-10-02')
    expect(bio.length).toBeGreaterThan(0)
    for (const b of bio) expect(b.datum <= '2026-10-08', b.id).toBe(true)
    const over = bio.find((b) => b.soort === 'overhoor')?.datum ?? ''
    expect(over >= '2026-10-07' && over <= '2026-10-08', over).toBe(true)
    /* Op het oude bord stond er vanavond 140 minuten biologie. */
    expect(bio.filter((b) => b.datum === VANDAAG).reduce((s, b) => s + b.geschat, 0)).toBeLessThan(140)
    /* Ze opent het bord pas de dag erna. De oude blokken stonden op 1 oktober;
       bleven ze staan, dan telden ze nu als achterstand. */
    const morgen = herplan(herstelStart(oudBord(), 'amaani') as Planstand, '2026-10-02', 3)
    const st = toetsStand(morgen, '2026-10-02').find((s) => s.toets.id === 'start-bio-2026-10-02')
    expect(st?.status).not.toBe('loopt achter')
  })

  it('laat een toets staan die ze zelf heeft veranderd', () => {
    let p = oudBord()
    const bio = toets(p, 'start-bio-2026-10-02') as Toets
    p = zetToets(p, { ...bio, onderdelen: ['Mijn eigen indeling'], bijgewerkt: 200 })
    const q = herstelStart(p, 'amaani')
    expect(toets(q, 'start-bio-2026-10-02')?.datum).toBe('2026-10-02')
    expect(toets(q, 'start-bio-2026-10-02')?.onderdelen).toEqual(['Mijn eigen indeling'])
  })

  it('houdt afgevinkt werk', () => {
    let p = oudBord()
    const blok = p.blokken.find((b) => b.toets === 'start-bio-2026-10-02') as { id: string }
    p = vinkAf(p, blok.id, true)
    const q = herstelStart(p, 'amaani')
    expect(q?.blokken.find((b) => b.id === blok.id)?.gedaan).toBe(true)
  })

  it('zet een weggehaalde toets niet terug, en doet niets twee keer', () => {
    const p = oudBord()
    const zonder = { ...p, toetsen: [...p.toetsen, { ...STARTTOETSEN.amaani!.find((t) => t.id === 'start-ned-2026-10-09')!, bijgewerkt: 5, weg: true }] }
    expect(toets(herstelStart(zonder, 'amaani'), 'start-ned-2026-10-09')?.weg).toBe(true)
    const een = herstelStart(p, 'amaani') as Planstand
    expect(herstelStart(een, 'amaani')).toBe(een)
    expect(herstelStart(undefined, 'amaani')).toBeUndefined()
  })

  it('laat de rechtgezette versie winnen van het andere toestel', () => {
    const q = herstelStart(oudBord(), 'amaani')
    expect(toets(q, 'start-bio-2026-10-02')?.bijgewerkt).toBeGreaterThan(100)
  })
})

describe('de stof voor het biologieproefwerk', () => {
  it('heeft zes opgaven per niveau, met hint, uitwerking en teken', () => {
    for (const lvl of [1, 2, 3]) expect(VOORTPLANTING_5VWO.filter((e) => e.lvl === lvl)).toHaveLength(6)
    for (const e of VOORTPLANTING_5VWO) {
      expect(antwoordKlopt(e, e.a), e.q).toBe(true)
      if (e.opties) expect(e.opties, e.q).toContain(e.a)
      expect(e.h?.length, e.q).toBeGreaterThan(0)
      expect((e.s ?? '').length, e.q).toBeGreaterThan(5)
      expect(ONDERWERPICOON[e.t], e.t).toBeTruthy()
    }
  })

  it('rekent de cyclus en de chromosomen na', () => {
    const vind = (stuk: string) => VOORTPLANTING_5VWO.find((e) => e.q.includes(stuk))!
    expect(Number(vind('cyclus van 32 dagen').a)).toBe(32 - 14)
    expect(Number(vind('na meiose I').a)).toBe(46 / 2)
    expect(antwoordKlopt(vind('veroorzaakt de eisprong'), 'FSH')).toBe(false)
    expect(antwoordKlopt(vind('veroorzaakt de eisprong'), 'lh')).toBe(true)
  })

  it('herhaalt geen vraag, en staat achteraan zodat geen id verschuift', () => {
    const nieuw = new Set(VOORTPLANTING_5VWO.map((e) => e.q))
    const elders = new Set([...SEED, ...NIEUW2627.filter((e) => !nieuw.has(e.q))].map((e) => e.q.trim()))
    for (const e of VOORTPLANTING_5VWO) expect(elders.has(e.q.trim()), e.q).toBe(false)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1197')?.q).toBe(VOORTPLANTING_5VWO[0]?.q)
    expect(NIEUW2627.find((e) => e.id === 'nw26_1214')?.q).toBe(VOORTPLANTING_5VWO[17]?.q)
  })

  it('wijst het bord naar onderwerpen die bestaan', () => {
    const sleutels = new Set(NIEUW2627.filter((e) => e.p === 'amaani').map((e) => `${e.v}|${e.t}|nu`))
    for (const t of STARTTOETSEN.amaani ?? []) for (const s of t.oefenen ?? []) expect(sleutels, s).toContain(s)
  })
})
