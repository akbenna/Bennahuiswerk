/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **Eén meting is geen beloop, en twee op dezelfde dag ook niet.** Dat is de
 * regel waar dit bestand om draait. Een verschil van nul tonen omdat er maar
 * één meetmoment is, suggereert dat er niets veranderd is terwijl er niets
 * gemeten is. Dat onderscheid houdt deze app overal aan.
 *
 * **Het gewicht komt uit de gladde lijn en niet van de weegschaal.** Het
 * verschil tussen twee losse wegingen is voor een flink deel vocht. Deze proef
 * zet dat vast met een reeks waarin de eerste en de laatste weging toevallig
 * gelijk zijn terwijl de trend wél daalt: wie de ruwe waarden zou pakken, komt
 * op nul uit.
 *
 * **De volgorde komt uit de datums en niet uit de rij.** Metingen komen uit de
 * database in de volgorde waarin ze toevallig staan; het eerste element van een
 * array is niet de oudste meting.
 *
 * **En er hoort een tijd bij het verschil.** Zes centimeter eraf in vier maanden
 * is iets anders dan zes centimeter eraf in drie jaar. De proef zet de grenzen
 * vast waar de eenheid wisselt, want juist daar kan een verkeerde deler
 * onopgemerkt blijven: rond de twee weken schelen dagen en weken weinig.
 */
import { describe, expect, it } from 'vitest'
import { tijdspanne, veranderingen } from './verandering'
import type { Lab, Meting } from '@/gedeeld/db/tabellen'
import type { Trendpunt } from './rekenkern'

const punt = (d: string, w: number | null, ema: number | null): Trendpunt => ({
  d: d as Trendpunt['d'], w, ema, kcal: null, eiwit: null, afwijkingKg: null, uitbijter: false,
})

const meting = (datum: string, soort: string, waarde: number): Meting => ({
  id: datum + soort, datum: datum as Meting['datum'], soort, waarde,
  eenheid: null, notitie: null,
})

const lab = (datum: string, code: string, waarde: number): Lab => ({
  id: datum + code, datum: datum as Lab['datum'], code, naam: null, waarde,
  eenheid: null, ref_laag: null, ref_hoog: null, notitie: null,
})

const vind = (rijen: ReturnType<typeof veranderingen>, naam: string) =>
  rijen.find((r) => r.naam === naam)

describe('een beloop heeft twee momenten nodig', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('laat een maat met één meting helemaal weg', () => {
    const uit = veranderingen([], [meting('2026-09-01', 'middelomtrek', 108)], [])
    expect(vind(uit, 'Middelomtrek')).toBeUndefined()
  })

  it('en ook een maat met twee metingen op dezelfde dag', () => {
    const uit = veranderingen([], [
      meting('2026-09-01', 'middelomtrek', 108),
      meting('2026-09-01', 'middelomtrek', 106),
    ], [])
    expect(vind(uit, 'Middelomtrek')).toBeUndefined()
  })

  it('maar neemt hem mee zodra er een tweede dag is', () => {
    const uit = veranderingen([], [
      meting('2026-09-01', 'middelomtrek', 108),
      meting('2026-10-01', 'middelomtrek', 104),
    ], [])
    expect(vind(uit, 'Middelomtrek')?.verschil).toBe(-4)
  })

  it('geeft een lege lijst als er niets te melden valt', () => {
    expect(veranderingen([], [], [])).toEqual([])
  })
})

describe('het gewicht komt uit de trend', () => {
  /* De eerste en de laatste weging zijn allebei 118,0; de gladde lijn zakt van
     118,4 naar 116,9. Wie de ruwe waarden zou pakken komt op nul uit, en dat is
     precies de fout die deze regel voorkomt. */
  it('rekent met de gladde lijn en niet met de losse wegingen', () => {
    const reeks = [
      punt('2026-08-01', 118.0, 118.4),
      punt('2026-08-15', 116.2, 117.5),
      punt('2026-09-01', 118.0, 116.9),
    ]
    const g = vind(veranderingen(reeks, [], []), 'Gewicht (trend)')
    expect(g?.vanWaarde).toBe(118.4)
    expect(g?.totWaarde).toBe(116.9)
    expect(g?.verschil).toBe(-1.5)
  })

  it('slaat dagen zonder gladde waarde over', () => {
    const reeks = [
      punt('2026-08-01', null, null),
      punt('2026-08-02', 118.0, 118.0),
      punt('2026-08-03', null, null),
      punt('2026-08-20', 117.0, 117.4),
    ]
    const g = vind(veranderingen(reeks, [], []), 'Gewicht (trend)')
    expect(g?.vanDatum).toBe('2026-08-02')
    expect(g?.totDatum).toBe('2026-08-20')
  })
})

describe('de volgorde komt uit de datums', () => {
  it('vindt de oudste en de nieuwste, ook als de rij door elkaar staat', () => {
    const uit = veranderingen([], [
      meting('2026-10-01', 'bloeddruk_sys', 128),
      meting('2026-08-01', 'bloeddruk_sys', 148),
      meting('2026-09-01', 'bloeddruk_sys', 138),
    ], [])
    const b = vind(uit, 'Bovendruk')
    expect(b?.vanWaarde).toBe(148)
    expect(b?.totWaarde).toBe(128)
    expect(b?.verschil).toBe(-20)
  })
})

describe('de labwaarden', () => {
  it('neemt alleen de codes die hier horen, en met hun eigen aantal decimalen', () => {
    const uit = veranderingen([], [], [
      lab('2026-01-01', 'hba1c', 41.4), lab('2026-08-01', 'hba1c', 39.6),
      lab('2026-01-01', 'ldl', 3.14), lab('2026-08-01', 'ldl', 2.56),
      lab('2026-01-01', 'onbekend', 1), lab('2026-08-01', 'onbekend', 2),
    ])
    expect(vind(uit, 'HbA1c')?.verschil).toBe(-2)
    expect(vind(uit, 'LDL-cholesterol')?.verschil).toBe(-0.6)
    expect(uit.map((r) => r.naam)).not.toContain('onbekend')
  })

  it('slaat een lab zonder waarde over in plaats van hem nul te noemen', () => {
    const zonder: Lab = { ...lab('2026-08-01', 'hba1c', 0), waarde: null }
    const uit = veranderingen([], [], [lab('2026-01-01', 'hba1c', 41), zonder])
    expect(vind(uit, 'HbA1c')).toBeUndefined()
  })
})

describe('hoe lang ertussen zit', () => {
  it('telt de dagen van de eerste tot de laatste meting', () => {
    const uit = veranderingen([], [
      meting('2026-10-01', 'middelomtrek', 104),
      meting('2026-09-01', 'middelomtrek', 108),
    ], [])
    expect(vind(uit, 'Middelomtrek')?.dagen).toBe(30)
  })

  it('en doet dat ook voor het gewicht uit de gladde lijn', () => {
    const reeks = [
      punt('2026-08-01', null, null),
      punt('2026-08-02', 118.0, 118.0),
      punt('2026-08-20', 117.0, 117.4),
    ]
    expect(vind(veranderingen(reeks, [], []), 'Gewicht (trend)')?.dagen).toBe(18)
  })
})

describe('de eenheid waarin die tijd op het scherm komt', () => {
  it('houdt het onder de twee weken bij dagen', () => {
    expect(tijdspanne(1)).toBe('1 d')
    expect(tijdspanne(13)).toBe('13 d')
  })

  /* DE PROEVEN WAAR DIT STUK VOOR BESTAAT: precies op de grenzen. Een deler die
     verspringt van zeven naar dertig valt hier om, en nergens anders. Dat de
     maand op 30,44 dagen staat en niet op 30 valt hier niet om, en dat hoort
     ook niet: op hele maanden afgerond geven ze hetzelfde antwoord. */
  it('en stapt op veertien dagen over naar weken', () => {
    expect(tijdspanne(14)).toBe('2 wk')
    expect(tijdspanne(69)).toBe('10 wk')
  })

  it('op zeventig dagen naar maanden', () => {
    expect(tijdspanne(70)).toBe('2 mnd')
    expect(tijdspanne(111)).toBe('4 mnd')
    expect(tijdspanne(365)).toBe('12 mnd')
  })

  /* Anderhalf jaar leest als 18 mnd en niet als 2 jr: daar is de maand nog de
     eenheid die het verschil draagt. */
  it('en pas op twee jaar naar jaren', () => {
    expect(tijdspanne(729)).toBe('24 mnd')
    expect(tijdspanne(730)).toBe('2 jr')
    expect(tijdspanne(1000)).toBe('3 jr')
  })
})
