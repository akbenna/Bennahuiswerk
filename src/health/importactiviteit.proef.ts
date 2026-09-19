/**
 * WAT ER MET EEN WORK-OUTLIJST GEBEURT
 *
 * Apple Gezondheid heeft onder "Work-outs" een lijst van posts: een duur, een
 * datum, en de app die hem geschreven heeft. Geen soort. Die lijst is de enige
 * plek waar beweegminuten vandaan komen als er geen koppeling draait.
 *
 * Twee beslissingen zitten hier, en ze zijn allebei te toetsen zonder browser:
 * welke duur aannemelijk is, en hoe meerdere posts op één dag één getal worden.
 * De herkenning zelf draait in een edge function en is van hier niet te
 * bereiken — die staat er met opzet buiten.
 */
import { describe, expect, it } from 'vitest'
import { ACTIVITEIT_MAX_MIN, aannemelijk, minutenPerDag } from './ai'
import type { Importactiviteit } from './ai'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const d = (s: string) => s as IsoDatum
const post = (datum: string, minuten: number, bron?: string): Importactiviteit =>
  ({ datum: d(datum), minuten, ...(bron ? { bron } : {}) })

describe('welke duur er een van een mens is', () => {
  it('een gewone training telt mee', () => {
    expect(aannemelijk(12)).toBe(true)
    expect(aannemelijk(45)).toBe(true)
  })

  /* Een lange rit of een bergwandeling haalt drie uur en hoort mee te tellen.
     Zou de grens daaronder liggen, dan zou juist de zwaarste dag van de week
     wegvallen. */
  it('een lange rit van drie uur ook', () => {
    expect(aannemelijk(180)).toBe(true)
  })

  /* Precies op de grens telt mee. Dat is geen detail: een grens die zijn eigen
     waarde uitsluit is een andere grens dan hij zegt te zijn. */
  it('de grens zelf telt mee en de minuut erna niet', () => {
    expect(aannemelijk(ACTIVITEIT_MAX_MIN)).toBe(true)
    expect(aannemelijk(ACTIVITEIT_MAX_MIN + 1)).toBe(false)
  })

  /* De twee posts die dit hele veld nodig maakten, uit de lijst die aanleiding
     was: 9 uur 7 en 14 uur 22. Dat zijn geen trainingen maar een horloge dat de
     stopknop niet gezien heeft. Kwamen ze binnen als beweegminuten, dan haalde
     het weekdoel van 150 minuten zich vijf keer op één dag. */
  it('een vergeten stopknop niet', () => {
    expect(aannemelijk(9 * 60 + 7)).toBe(false)
    expect(aannemelijk(14 * 60 + 22)).toBe(false)
  })

  /* Nul minuten is geen work-out maar een post die is afgebroken, en een
     negatieve duur bestaat niet — die zou uit een misgelezen regel komen. */
  it('en nul of minder ook niet', () => {
    expect(aannemelijk(0)).toBe(false)
    expect(aannemelijk(-30)).toBe(false)
  })
})

describe('meerdere posts op één dag', () => {
  it('worden bij elkaar opgeteld', () => {
    expect(minutenPerDag([post('2026-08-20', 30), post('2026-08-20', 45)]))
      .toEqual([{ datum: d('2026-08-20'), minuten: 75 }])
  })

  it('en blijven per dag uit elkaar', () => {
    expect(minutenPerDag([post('2026-08-21', 20), post('2026-08-20', 30)]))
      .toEqual([
        { datum: d('2026-08-20'), minuten: 30 },
        { datum: d('2026-08-21'), minuten: 20 },
      ])
  })

  /* Op datum, niet op de volgorde waarin de afdrukken binnenkwamen. Wie
     doorscrolt maakt ze van onder naar boven, en dan staat de nieuwste dag
     vooraan in de invoer. */
  it('op datum gerangschikt en niet op volgorde van binnenkomst', () => {
    const uit = minutenPerDag([post('2026-08-22', 10), post('2026-08-19', 10), post('2026-08-21', 10)])
    expect(uit.map((r) => r.datum)).toEqual([d('2026-08-19'), d('2026-08-21'), d('2026-08-22')])
  })

  /* De lijst toont "44 min", maar een post van 44 min 36 s komt als 44,6 binnen
     als het model uit de seconden rekent. Minuten zijn hele getallen in
     kal_dagen; ronden en niet afkappen, net als de koppeling doet. */
  it('een halve minuut wordt afgerond en niet afgekapt', () => {
    expect(minutenPerDag([post('2026-08-20', 44.6)]))
      .toEqual([{ datum: d('2026-08-20'), minuten: 45 }])
  })

  it('niets erin is niets eruit', () => {
    expect(minutenPerDag([])).toEqual([])
  })
})

describe('de twee samen, zoals het scherm ze gebruikt', () => {
  /* Wat overgenomen wordt is de som van wat aangevinkt staat. Een vergeten
     stopknop op dezelfde dag als een echte rit mag die dag niet meeslepen: de
     rit blijft staan en alleen de post van veertien uur valt eruit. */
  it('een onaannemelijke post sleept de rest van zijn dag niet mee', () => {
    const lijst = [
      post('2026-08-20', 52, 'Garmin'),
      post('2026-08-20', 14 * 60 + 22, 'Garmin'),
      post('2026-08-21', 33, 'Garmin'),
    ]
    expect(minutenPerDag(lijst.filter((a) => aannemelijk(a.minuten))))
      .toEqual([
        { datum: d('2026-08-20'), minuten: 52 },
        { datum: d('2026-08-21'), minuten: 33 },
      ])
  })

  /* Een dag waarop álles onaannemelijk is levert geen regel op, en zeker geen
     regel met nul minuten: nul beweegminuten wegschrijven is een bewering, en
     die staat nergens. */
  it('een dag zonder enige aannemelijke post levert geen regel op', () => {
    expect(minutenPerDag([post('2026-08-20', 9 * 60 + 7)].filter((a) => aannemelijk(a.minuten))))
      .toEqual([])
  })
})
