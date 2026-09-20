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
 * bereiken, die staat er met opzet buiten.
 */
import { describe, expect, it } from 'vitest'
import { ACTIVITEIT_MAX_MIN, aannemelijk, redenUit } from './ai'
import type { Importactiviteit } from './ai'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const d = (s: string) => s as IsoDatum
const post = (datum: string, minuten: number, soort?: string): Importactiviteit =>
  ({ datum: d(datum), minuten, soort: soort ?? 'wandelen' })

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
     negatieve duur bestaat niet, die zou uit een misgelezen regel komen. */
  it('en nul of minder ook niet', () => {
    expect(aannemelijk(0)).toBe(false)
    expect(aannemelijk(-30)).toBe(false)
  })
})

describe('waarom een vinkje uit staat', () => {
  it('een gewone post heeft geen reden en telt dus mee', () => {
    expect(redenUit(post('2026-08-20', 45, 'fietsen'))).toBeNull()
  })

  /* Krachttraining staat in de richtlijn apart, twee keer per week
     spierversterkend, naast de aerobe minuten. Zou een sessie van een uur hier
     meetellen, dan stond de halve week er al op. En de lijst geeft geen sets of
     reps, dus er valt ook geen trainingsrij van te maken. */
  it('krachttraining telt apart', () => {
    expect(redenUit(post('2026-08-20', 60, 'kracht')))
      .toMatch(/krachttraining/)
  })

  /* De volgorde doet ertoe: een krachtsessie van veertien uur is nog steeds in
     de eerste plaats een krachtsessie. Zou de duur eerst gekeurd worden, dan
     kreeg je "een vergeten stopknop?" bij iets wat sowieso niet meetelt. */
  it('en dat weegt zwaarder dan de duur', () => {
    expect(redenUit(post('2026-08-20', 14 * 60, 'kracht'))).toMatch(/krachttraining/)
  })

  it('een vergeten stopknop noemt zijn duur', () => {
    expect(redenUit(post('2026-08-20', 9 * 60 + 7, 'fietsen'))).toMatch(/4 uur/)
  })

  /* Een post zonder kopje mag mee, maar niet zonder dat je het gezien hebt:
     zonder soort valt hij op "anders" terug en telt hij als matig, en dat is
     een aanname bovenop een aanname. */
  it('een post zonder soort vraagt om een blik', () => {
    expect(redenUit({ datum: d('2026-08-20'), minuten: 30 })).toMatch(/geen soort/)
    expect(redenUit(post('2026-08-20', 30, ''))).toMatch(/geen soort/)
  })
})

describe('de lijst zoals het scherm hem vinkt', () => {
  /* Een onaannemelijke post sleept de rest van zijn dag niet mee: de rit blijft
     staan en alleen de post van veertien uur valt eruit. */
  it('haalt alleen de posten met een reden eruit', () => {
    const lijst = [
      post('2026-08-20', 52, 'fietsen'),
      post('2026-08-20', 14 * 60 + 22, 'fietsen'),
      post('2026-08-20', 60, 'kracht'),
      post('2026-08-21', 33, 'wandelen'),
    ]
    expect(lijst.filter((a) => redenUit(a) == null).map((a) => a.minuten))
      .toEqual([52, 33])
  })
})
