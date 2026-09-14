/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Drie regels, en elk van de drie is een fout die ik onderweg bijna maakte.
 *
 * Eerst: het gemiddelde loopt over dágen en niet over metingen. Wie op één dag
 * vier keer meet en de rest van de week één keer, zou in een plat gemiddelde de
 * hele week overstemmen. Het protocol vraagt om een week.
 *
 * Dan: een dag zonder onderdruk telt niet mee. Half ingevulde dagen stilzwijgend
 * voor vol aanzien is precies waar deze app niet aan hoort te doen — dat is
 * hetzelfde als een ontbrekende waarde als nul behandelen.
 *
 * En: het venster is een venster. Metingen van vorige maand horen er niet bij,
 * ook niet als ze de enige zijn die er staan.
 */
import { describe, expect, it } from 'vitest'
import { thuisbloeddruk } from './bloeddruk'
import type { Meting } from '@/gedeeld/db/tabellen'

let teller = 0
const m = (datum: string, soort: string, waarde: number): Meting => ({
  id: 'p' + ++teller, datum, soort, waarde, eenheid: 'mmHg', notitie: null,
})
const paar = (datum: string, sys: number, dia: number): Meting[] =>
  [m(datum, 'bloeddruk_sys', sys), m(datum, 'bloeddruk_dia', dia)]

const week = [
  ...paar('2026-09-08', 140, 88), ...paar('2026-09-09', 136, 84),
  ...paar('2026-09-10', 132, 82), ...paar('2026-09-11', 130, 80),
  ...paar('2026-09-12', 128, 78), ...paar('2026-09-13', 126, 78),
  ...paar('2026-09-14', 124, 76),
]

describe('het gemiddelde', () => {
  it('rekent over de hele week', () => {
    const t = thuisbloeddruk(week, '2026-09-14')
    expect(t?.sys).toBe(131)          // (140+136+132+130+128+126+124)/7 = 130,857
    expect(t?.dia).toBe(81)
    expect(t?.dagen).toBe(7)
    expect(t?.volledigeWeek).toBe(true)
  })

  /* Vier metingen op één dag mogen die dag niet vier keer laten meetellen. */
  it('weegt elke dag even zwaar, ongeacht het aantal metingen', () => {
    const scheef = [
      ...paar('2026-09-13', 180, 100), ...paar('2026-09-13', 180, 100),
      ...paar('2026-09-13', 180, 100), ...paar('2026-09-14', 120, 70),
    ]
    const t = thuisbloeddruk(scheef, '2026-09-14')
    expect(t?.sys).toBe(150)          // en niet 165, wat een plat gemiddelde geeft
    expect(t?.dagen).toBe(2)
  })

  it('telt de losse metingen apart van de dagen', () => {
    const t = thuisbloeddruk(
      [...paar('2026-09-14', 130, 80), ...paar('2026-09-14', 134, 82)], '2026-09-14',
    )
    expect(t?.dagen).toBe(1)
    expect(t?.metingen).toBe(4)
  })
})

describe('wat er niet meetelt', () => {
  it('laat een dag zonder onderdruk vallen', () => {
    const t = thuisbloeddruk([...paar('2026-09-14', 130, 80), m('2026-09-13', 'bloeddruk_sys', 200)],
      '2026-09-14')
    expect(t?.dagen).toBe(1)
    expect(t?.sys).toBe(130)
  })

  it('geeft null als er nergens een compleet paar staat', () => {
    expect(thuisbloeddruk([m('2026-09-14', 'bloeddruk_sys', 130)], '2026-09-14')).toBeNull()
    expect(thuisbloeddruk([], '2026-09-14')).toBeNull()
  })

  it('kijkt niet buiten het venster, ook niet als daar alles staat', () => {
    expect(thuisbloeddruk(paar('2026-08-01', 150, 90), '2026-09-14')).toBeNull()
  })

  it('kijkt niet vooruit', () => {
    expect(thuisbloeddruk(paar('2026-09-20', 150, 90), '2026-09-14')).toBeNull()
  })

  it('laat andere soorten metingen met rust', () => {
    const t = thuisbloeddruk([...paar('2026-09-14', 130, 80), m('2026-09-14', 'middelomtrek', 98)],
      '2026-09-14')
    expect(t?.metingen).toBe(2)
  })
})

describe('de spreiding', () => {
  it('is het verschil tussen de hoogste en de laagste dag', () => {
    expect(thuisbloeddruk(week, '2026-09-14')?.spreidingSys).toBe(16)
  })

  it('is nul bij één dag, en dat is geen rust maar te weinig gegevens', () => {
    const t = thuisbloeddruk(paar('2026-09-14', 130, 80), '2026-09-14')
    expect(t?.spreidingSys).toBe(0)
    expect(t?.volledigeWeek).toBe(false)
  })
})
