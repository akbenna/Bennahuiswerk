/**
 * DE GEBEDSTIJDEN BEWEZEN
 *
 * 1344 combinaties van datum, plaats, methode, asr-schaduw en hogebreedteregel,
 * vergeleken met wat de oude app werkelijk uitrekende — tot op de seconde.
 * Zeven plaatsen van Nairobi tot Tromsø en acht dagen, waaronder beide
 * zonnewendes: dat is waar het rekenwerk het snelst uit elkaar valt.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import { gebedstijden, julian, klok, qiblaHoek, volgendGebed, zonStand } from './gebedstijden'
import type { Asr, Hoog, MethodeId, Tijden } from './gebedstijden'

/** Zoals de opwekker afrondde: op de seconde. */
const rond = (x: number): number | null =>
  Number.isNaN(x) ? null : Math.round(x * 3600) / 3600

describe('de stand van de zon', () => {
  it('geeft dezelfde juliaanse dag en declinatie als vroeger', () => {
    for (const g of gouden.juliaans) {
      expect(julian(g.j, g.m, g.d), `${g.j}-${g.m}-${g.d}`).toBe(g.jd)
      const z = zonStand(g.jd)
      expect({ decl: rond(z.decl), eqt: rond(z.eqt) }, `${g.j}-${g.m}-${g.d}`)
        .toEqual(g.zon)
    }
  })

  it('wijst de qibla dezelfde kant op als vroeger', () => {
    for (const g of gouden.qibla) {
      expect(rond(qiblaHoek(g.lat, g.lon)), g.plek).toBe(g.hoek)
    }
  })

  it('wijst vanuit Nederland naar het zuidoosten', () => {
    const hoek = qiblaHoek(51.1942, 5.9873)
    expect(hoek).toBeGreaterThan(90)
    expect(hoek).toBeLessThan(180)
  })
})

describe('de gebedstijden', () => {
  it.each(gouden.tijden.map((g) => [`${g.plek} ${g.j}-${g.m}-${g.d} ${g.methode} asr${g.asr} ${g.hoog}`, g] as const))(
    '%s', (_naam, g) => {
      const t = gebedstijden(
        { j: g.j, m: g.m, d: g.d },
        { lat: g.lat, lon: g.lon },
        { methode: g.methode as MethodeId, asr: g.asr as Asr, tz: g.tz, hoog: g.hoog as Hoog },
      )
      expect(Object.fromEntries(
        (Object.keys(t) as Array<keyof Tijden>).map((k) => [k, rond(t[k])]),
      )).toEqual(g.t)
    })

  it('houdt de gebeden in de goede volgorde op een gewone dag', () => {
    const t = gebedstijden({ j: 2026, m: 3, d: 20 }, { lat: 51.1942, lon: 5.9873 },
      { methode: 'MWL', asr: 1, tz: 1, hoog: 'zevende' })
    expect(t.fajr).toBeLessThan(t.op)
    expect(t.op).toBeLessThan(t.dhuhr)
    expect(t.dhuhr).toBeLessThan(t.asr)
    expect(t.asr).toBeLessThan(t.maghrib)
    expect(t.maghrib).toBeLessThan(t.isha)
  })

  it('geeft in juni in Roermond alsnog een fajr, dankzij de zevendenregel', () => {
    const zonder = gebedstijden({ j: 2026, m: 6, d: 21 }, { lat: 51.1942, lon: 5.9873 },
      { methode: 'MWL', asr: 1, tz: 2, hoog: 'geen' })
    const met = gebedstijden({ j: 2026, m: 6, d: 21 }, { lat: 51.1942, lon: 5.9873 },
      { methode: 'MWL', asr: 1, tz: 2, hoog: 'zevende' })
    expect(Number.isNaN(zonder.fajr)).toBe(true)
    expect(Number.isNaN(met.fajr)).toBe(false)
    expect(met.fajr).toBeGreaterThan(met.isha - 24)
  })

  it('geeft bij de hanafitische schaduw een latere asr', () => {
    const plek = { lat: 51.1942, lon: 5.9873 }
    const dag = { j: 2026, m: 3, d: 20 }
    const een = gebedstijden(dag, plek, { methode: 'MWL', asr: 1, tz: 1, hoog: 'zevende' })
    const twee = gebedstijden(dag, plek, { methode: 'MWL', asr: 2, tz: 1, hoog: 'zevende' })
    expect(twee.asr).toBeGreaterThan(een.asr)
  })

  it('geeft bij een ruimere methode een latere fajr en een vroegere isha', () => {
    const plek = { lat: 51.1942, lon: 5.9873 }
    const dag = { j: 2026, m: 3, d: 20 }
    const mwl = gebedstijden(dag, plek, { methode: 'MWL', asr: 1, tz: 1, hoog: 'geen' })
    const isna = gebedstijden(dag, plek, { methode: 'ISNA', asr: 1, tz: 1, hoog: 'geen' })
    /* ISNA rekent met 15° in plaats van 18°: de zon staat dan minder diep, dus
       fajr valt later en isha eerder. */
    expect(isna.fajr).toBeGreaterThan(mwl.fajr)
    expect(isna.isha).toBeLessThan(mwl.isha)
  })

  it('schuift met de tijdzone mee, uur voor uur', () => {
    const plek = { lat: 51.1942, lon: 5.9873 }
    const dag = { j: 2026, m: 3, d: 20 }
    const winter = gebedstijden(dag, plek, { methode: 'MWL', asr: 1, tz: 1, hoog: 'zevende' })
    const zomer = gebedstijden(dag, plek, { methode: 'MWL', asr: 1, tz: 2, hoog: 'zevende' })
    expect(zomer.dhuhr - winter.dhuhr).toBeCloseTo(1, 9)
  })
})

describe('de klok en het volgende gebed', () => {
  it('schrijft uren als uren en minuten', () => {
    expect(klok(0)).toBe('00:00')
    expect(klok(6.5)).toBe('06:30')
    expect(klok(12.755)).toBe('12:45')
    expect(klok(23.999)).toBe('00:00')
    expect(klok(NaN)).toBe('—')
  })

  it('wijst het eerstvolgende gebed aan', () => {
    const t: Tijden = { fajr: 5, op: 7, dhuhr: 13, asr: 16, onder: 20, isha: 22, maghrib: 20 }
    const m: Tijden = { ...t, fajr: 5.1 }
    expect(volgendGebed(t, m, 4).k).toBe('fajr')
    expect(volgendGebed(t, m, 6).k).toBe('op')
    expect(volgendGebed(t, m, 14).k).toBe('asr')
    expect(volgendGebed(t, m, 21).k).toBe('isha')
  })

  it('gaat na isha door naar de fajr van morgen', () => {
    const t: Tijden = { fajr: 5, op: 7, dhuhr: 13, asr: 16, onder: 20, isha: 22, maghrib: 20 }
    const m: Tijden = { ...t, fajr: 5.1 }
    const v = volgendGebed(t, m, 23)
    expect(v.morgen).toBe(true)
    expect(v.k).toBe('fajr')
    expect(v.over).toBeCloseTo((24 - 23 + 5.1) * 60, 6)
  })

  it('slaat een gebed over dat vandaag niet bestaat', () => {
    const t: Tijden = { fajr: NaN, op: NaN, dhuhr: 13, asr: 16, onder: NaN, isha: NaN, maghrib: NaN }
    const m: Tijden = { ...t, fajr: 3 }
    expect(volgendGebed(t, m, 4).k).toBe('dhuhr')
    expect(volgendGebed(t, m, 17).morgen).toBe(true)
  })
})
