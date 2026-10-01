/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **Eén meetmoment is geen beloop.** Twee metingen op dezelfde dag zijn één
 * moment, en dan komt er niets terug. Dezelfde regel als bij de veranderkaart
 * en bij de thuisbloeddruk, en om dezelfde reden: een verschil van nul tonen
 * omdat er maar één moment is, suggereert dat er niets veranderd is terwijl er
 * niets gemeten is.
 *
 * **Twee metingen op één dag zijn samen één punt.** Zonder die stap telt een
 * dag waarop je twee keer mat dubbel mee in het beeld.
 *
 * **Het gewicht ernaast komt uit de gladde lijn en van de juiste dag.** Niet de
 * weging van die ochtend (dat is voor een deel vocht) en niet de nieuwste
 * waarde uit de hele reeks, maar het voortschrijdend gemiddelde op of vóór de
 * dag van die omtrekmeting. Wie dat verkeerd doet, vergelijkt een omtrek van
 * april met een gewicht van september en ziet een verband dat er niet is.
 *
 * **En een verschil onder de meetfout heet geen verandering.** De fout van het
 * lint loopt van 0,7 tot 15 cm; onder de twee centimeter zegt de app dat er
 * niets te zeggen valt.
 */
import { describe, expect, it } from 'vitest'
import { MEETRUIS_CM, middelbeloop } from './middelbeloop'
import type { Meting } from '@/gedeeld/db/tabellen'
import type { Trendpunt } from './rekenkern'

const m = (datum: string, waarde: number, soort = 'middelomtrek'): Meting => ({
  id: datum + soort + waarde, datum: datum as Meting['datum'], soort, waarde,
  eenheid: 'cm', notitie: null,
})

const punt = (d: string, ema: number | null): Trendpunt => ({
  d: d as Trendpunt['d'], w: ema, ema, kcal: null, eiwit: null,
  afwijkingKg: null, uitbijter: false,
})

describe('een beloop heeft twee momenten nodig', () => {
  it('geeft niets terug bij één meting', () => {
    expect(middelbeloop([m('2026-05-01', 114)], [])).toBeNull()
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('en ook niet bij twee metingen op dezelfde dag', () => {
    expect(middelbeloop([m('2026-05-01', 114), m('2026-05-01', 112)], [])).toBeNull()
  })

  it('en niets bij een lege lijst', () => {
    expect(middelbeloop([], [])).toBeNull()
  })

  it('maar wel zodra er een tweede dag is', () => {
    const b = middelbeloop([m('2026-05-01', 114), m('2026-09-01', 108)], [])
    expect(b?.verschilCm).toBe(-6)
  })
})

describe('wat er meetelt en wat niet', () => {
  it('slaat andere meetsoorten over', () => {
    const b = middelbeloop([
      m('2026-05-01', 114), m('2026-09-01', 108),
      m('2026-07-01', 128, 'bloeddruk_sys'), m('2026-07-01', 41, 'nekomtrek'),
    ], [])
    expect(b?.punten).toHaveLength(2)
  })

  it('middelt twee metingen van één dag tot één punt', () => {
    const b = middelbeloop([
      m('2026-05-01', 115), m('2026-05-01', 113), m('2026-09-01', 108),
    ], [])
    expect(b?.punten).toHaveLength(2)
    expect(b?.eerste.cm).toBe(114)
  })

  it('zet de punten op datum, ook als ze door elkaar binnenkomen', () => {
    const b = middelbeloop([
      m('2026-09-01', 108), m('2026-05-01', 114), m('2026-07-01', 111),
    ], [])
    expect(b?.punten.map((p) => p.cm)).toEqual([114, 111, 108])
    expect(b?.eerste.cm).toBe(114)
    expect(b?.laatste.cm).toBe(108)
  })

  it('negeert een onmogelijke waarde in plaats van ermee te rekenen', () => {
    const b = middelbeloop([m('2026-05-01', 114), m('2026-06-01', 0), m('2026-09-01', 108)], [])
    expect(b?.punten).toHaveLength(2)
  })
})

describe('de meetfout van het lint', () => {
  it('noemt een verschil onder de twee centimeter geen verandering', () => {
    const b = middelbeloop([m('2026-05-01', 109), m('2026-09-01', 108)], [])
    expect(b?.binnenRuis).toBe(true)
  })

  it('en een verschil van twee of meer wel', () => {
    const b = middelbeloop([m('2026-05-01', 110), m('2026-09-01', 108)], [])
    expect(Math.abs(b!.verschilCm)).toBeGreaterThanOrEqual(MEETRUIS_CM)
    expect(b?.binnenRuis).toBe(false)
  })

  it('kijkt naar de grootte en niet naar de richting', () => {
    const omhoog = middelbeloop([m('2026-05-01', 108), m('2026-09-01', 111)], [])
    expect(omhoog?.verschilCm).toBe(3)
    expect(omhoog?.binnenRuis).toBe(false)
  })
})

describe('het gewicht dat ernaast komt te staan', () => {
  const reeks = [
    punt('2026-05-01', 121.4),
    punt('2026-07-01', 119.0),
    punt('2026-09-01', 117.3),
    punt('2026-09-20', 116.8),
  ]

  it('pakt de gladde lijn van de dag van de meting, niet de nieuwste', () => {
    const b = middelbeloop([m('2026-05-01', 114), m('2026-09-01', 108)], reeks)
    expect(b?.gewichtVan).toBe(121.4)
    expect(b?.gewichtTot).toBe(117.3)
  })

  /* Meet je op een dag zonder weging, dan telt de laatste bekende waarde
     ervóór. Vooruitkijken zou een gewicht gebruiken dat op dat moment nog niet
     bestond. */
  it('valt terug op de laatste waarde vóór die dag', () => {
    const b = middelbeloop([m('2026-06-15', 112), m('2026-08-01', 110)], reeks)
    expect(b?.gewichtVan).toBe(121.4)
    expect(b?.gewichtTot).toBe(119.0)
  })

  it('geeft niets als er vóór die dag nog niet gewogen was', () => {
    const b = middelbeloop([m('2026-01-01', 116), m('2026-09-01', 108)], reeks)
    expect(b?.gewichtVan).toBeNull()
    expect(b?.gewichtTot).toBe(117.3)
  })

  it('slaat dagen zonder gladde waarde over', () => {
    const metGaten = [punt('2026-05-01', null), punt('2026-05-02', 121.0)]
    const b = middelbeloop([m('2026-05-01', 114), m('2026-09-01', 108)], metGaten)
    expect(b?.gewichtVan).toBeNull()
    expect(b?.gewichtTot).toBe(121.0)
  })
})
