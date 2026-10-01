/**
 * DE PLANLEZER NAGEKEKEN
 *
 * Het model leest een schermafdruk; deze proef gaat over wat de app daarna
 * doet, want daar zit de grendel. Een vak dat het kind niet heeft, een datum die
 * niet bestaat of al geweest is, een toets zonder stof, een oefenonderwerp dat
 * het model verzon of dat bij een ander vak hoort: dat mag allemaal niet op het
 * bord komen, en het kind hoort te zien waarom niet.
 */
import { describe, expect, it } from 'vitest'
import { nakijken } from './planlezer'
import type { Ingang } from './vraagbaak'

const VAKKEN = ['wiskundeA', 'natuurkunde', 'scheikunde', 'frans', 'oeno']
const VANDAAG = '2026-10-01'

const ing = (vakSleutel: string, onderwerp: string): Ingang => ({
  s: `${vakSleutel}|${onderwerp}|nu`, vak: vakSleutel, vakSleutel, onderwerp, jaar: 'nu', n: 10, beheerst: 0,
})
const CAT: Ingang[] = [
  ing('scheikunde', 'Molverhoudingen'),
  ing('scheikunde', 'Reactiesnelheid'),
  ing('natuurkunde', 'Krachten & evenwicht'),
  ing('wiskundeA', 'Kansrekening'),
]

const toets = (deel: Record<string, unknown>): Record<string, unknown> => ({
  vak: 'scheikunde', datum: '2026-10-07', titel: 'H3', onderdelen: ['§3.1', '§3.2'],
  opdracht: false, minutenPerOnderdeel: 40, twijfel: '', oefenen: [], gat: '', ...deel,
})

describe('het nakijken van wat de planlezer las', () => {
  it('neemt een goede toets over, met de oefenonderwerpen die bestaan', () => {
    const u = nakijken({
      toetsen: [toets({ oefenen: ['scheikunde|Molverhoudingen|nu', 'scheikunde|Verzonnen|nu'] })],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen).toHaveLength(1)
    expect(u.afgewezen).toEqual([])
    const t = u.voorstellen[0]?.toets
    expect(t?.vak).toBe('scheikunde')
    expect(t?.onderdelen).toEqual(['§3.1', '§3.2'])
    expect(t?.oefenen).toEqual(['scheikunde|Molverhoudingen|nu'])
  })

  it('laat geen oefenonderwerp van een ander vak toe', () => {
    const u = nakijken({
      toetsen: [toets({ oefenen: ['natuurkunde|Krachten & evenwicht|nu'] })],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen[0]?.toets.oefenen).toBeUndefined()
  })

  it('wijst af wat niet kan, en zegt waarom', () => {
    const u = nakijken({
      toetsen: [
        toets({ vak: 'geschiedenis' }),
        toets({ datum: '2026-02-30' }),
        toets({ datum: '2026-09-30' }),
        toets({ datum: VANDAAG }),
        toets({ onderdelen: [] }),
        toets({ datum: '2027-06-01' }),
      ],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen).toHaveLength(0)
    expect(u.afgewezen).toHaveLength(6)
    expect(u.afgewezen[0]).toMatch(/pakket/)
    expect(u.afgewezen[1]).toMatch(/datum/)
    expect(u.afgewezen[2]).toMatch(/geweest/)
    expect(u.afgewezen[3]).toMatch(/geweest/)
    expect(u.afgewezen[4]).toMatch(/stof/)
    expect(u.afgewezen[5]).toMatch(/vier maanden/)
  })

  it('neemt dezelfde toets van twee afbeeldingen één keer op', () => {
    const u = nakijken({ toetsen: [toets({}), toets({ titel: 'H3 opnieuw' })] }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen).toHaveLength(1)
  })

  it('houdt minuten binnen redelijke grenzen', () => {
    const u = nakijken({
      toetsen: [
        toets({ minutenPerOnderdeel: 500 }),
        toets({ vak: 'frans', minutenPerOnderdeel: 'veel' }),
      ],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen.map((v) => v.toets.perOnderdeel)).toEqual([120, 40])
  })

  it('geeft een gat door, behalve bij een opdracht', () => {
    const u = nakijken({
      toetsen: [
        toets({ gat: 'Gaswet pV = nRT, 5 vwo' }),
        toets({ vak: 'oeno', opdracht: true, gat: 'iets', datum: '2026-10-09' }),
      ],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen[0]?.gat).toBe('Gaswet pV = nRT, 5 vwo')
    expect(u.voorstellen[1]?.gat).toBe('')
    expect(u.voorstellen[1]?.toets.opdracht).toBe(true)
  })

  it('verdraagt een kapot antwoord', () => {
    expect(nakijken({}, VAKKEN, CAT, VANDAAG).voorstellen).toEqual([])
    expect(nakijken({ toetsen: 'onzin' }, VAKKEN, CAT, VANDAAG).voorstellen).toEqual([])
    expect(nakijken({ toetsen: [null, 3] }, VAKKEN, CAT, VANDAAG).voorstellen).toEqual([])
  })

  it('zet de voorstellen op datum', () => {
    const u = nakijken({
      toetsen: [toets({ datum: '2026-10-09', vak: 'frans' }), toets({ datum: '2026-10-05' })],
    }, VAKKEN, CAT, VANDAAG)
    expect(u.voorstellen.map((v) => v.toets.datum)).toEqual(['2026-10-05', '2026-10-09'])
  })
})
