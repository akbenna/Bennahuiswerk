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
 * voor vol aanzien is precies waar deze app niet aan hoort te doen, dat is
 * hetzelfde als een ontbrekende waarde als nul behandelen.
 *
 * En: het venster is een venster. Metingen van vorige maand horen er niet bij,
 * ook niet als ze de enige zijn die er staan.
 *
 * Daar is een vierde bij gekomen, en dat was een correctie en geen uitbreiding:
 * de eerste meetdag vervalt. Het NHG-protocol schrijft dat voor en deze app
 * telde hem mee. De regels hieronder houden niet alleen vast dát hij vervalt
 * maar ook wanneer hij dat níet doet, want dat is de kant waar het mis kan
 * gaan: wie al weken meet heeft geen gewenningsdag, en dan zou dit goede
 * gegevens weggooien.
 */
import { describe, expect, it } from 'vitest'
import { thuisbloeddruk } from './bloeddruk'
import type { IsoDatum, Meting } from '@/gedeeld/db/tabellen'

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
  it('rekent over de week zonder de gewenningsdag', () => {
    const t = thuisbloeddruk(week, '2026-09-14')
    expect(t?.sys).toBe(129)          // (136+132+130+128+126+124)/6 = 129,33
    expect(t?.dia).toBe(80)
    expect(t?.dagen).toBe(6)
    expect(t?.gewenningsdagWeg).toBe(true)
    /* Zes tellende dagen uit zeven gemeten is een volledige meetweek. */
    expect(t?.volledigeWeek).toBe(true)
  })

  /* Zonder deze regel zou een proef die alleen op 129 let ook groen staan als
     de functie per ongeluk de laatste dag wegliet in plaats van de eerste. */
  it('laat de eerste dag vallen en niet de laatste', () => {
    const scheef = [
      ...paar('2026-09-12', 200, 100),
      ...paar('2026-09-13', 130, 80),
      ...paar('2026-09-14', 100, 60),
    ]
    const t = thuisbloeddruk(scheef, '2026-09-14')
    expect(t?.sys).toBe(115)          // (130+100)/2, dus de 200 is weg
    expect(t?.dagen).toBe(2)
  })

  /* Vier metingen op één dag mogen die dag niet vier keer laten meetellen. De
     oudere metingen zetten de gewenningsdag buiten spel, zodat deze regel over
     de weging gaat en niet over het vervallen. */
  it('weegt elke dag even zwaar, ongeacht het aantal metingen', () => {
    const scheef = [
      ...paar('2026-09-01', 140, 85),
      ...paar('2026-09-13', 180, 100), ...paar('2026-09-13', 180, 100),
      ...paar('2026-09-13', 180, 100), ...paar('2026-09-14', 120, 70),
    ]
    const t = thuisbloeddruk(scheef, '2026-09-14')
    expect(t?.sys).toBe(150)          // en niet 165, wat een plat gemiddelde geeft
    expect(t?.dagen).toBe(2)
    expect(t?.gewenningsdagWeg).toBe(false)
  })

  it('telt de losse metingen apart van de dagen', () => {
    const t = thuisbloeddruk(
      [...paar('2026-09-13', 128, 78),
       ...paar('2026-09-14', 130, 80), ...paar('2026-09-14', 134, 82)], '2026-09-14',
    )
    expect(t?.dagen).toBe(1)
    expect(t?.metingen).toBe(4)
  })
})

describe('de gewenningsdag', () => {
  it('vervalt als het werkelijk de eerste meetdag is', () => {
    const t = thuisbloeddruk(
      [...paar('2026-09-13', 160, 95), ...paar('2026-09-14', 120, 70)], '2026-09-14',
    )
    expect(t?.gewenningsdagWeg).toBe(true)
    expect(t?.sys).toBe(120)
    expect(t?.dagen).toBe(1)
  })

  /* DE REGEL DIE DE FOUT AAN DE ANDERE KANT VANGT
     Wie al drie weken meet is gewend. De oudste dag in het venster is dan geen
     gewenningsdag maar een gewone dag, en weggooien is dan gegevens weggooien.
     Een meting van vóór het venster (dus eentje die zelf niet meetelt) is
     genoeg om dat te weten. */
  it('vervalt niet als er al eerder gemeten is, ook van buiten het venster', () => {
    const t = thuisbloeddruk(
      [...paar('2026-08-20', 150, 90),
       ...paar('2026-09-13', 160, 95), ...paar('2026-09-14', 120, 70)], '2026-09-14',
    )
    expect(t?.gewenningsdagWeg).toBe(false)
    expect(t?.sys).toBe(140)          // (160+120)/2
    expect(t?.dagen).toBe(2)
  })

  /* Een halve dag is geen meetdag. Een losse bovendruk van eergisteren maakt
     iemand dus niet 'gewend', anders zou een onvolledige invoer de
     gewenningsdag van de echte reeks laten staan. */
  it('geldt één meetdag als een dag die niet vervalt', () => {
    const t = thuisbloeddruk(paar('2026-09-14', 130, 80), '2026-09-14')
    expect(t?.gewenningsdagWeg).toBe(false)
    expect(t?.sys).toBe(130)
    expect(t?.dagen).toBe(1)
  })
})

describe('wat er niet meetelt', () => {
  it('laat een dag zonder onderdruk vallen', () => {
    const t = thuisbloeddruk([...paar('2026-09-14', 130, 80), m('2026-09-13', 'bloeddruk_sys', 200)],
      '2026-09-14')
    expect(t?.dagen).toBe(1)
    expect(t?.sys).toBe(130)
  })

  /* Een onvolledige dag is geen meetdag om op te rekenen, maar hij zegt wél
     dat er al gemeten werd. Anders zou de eerste complete dag ten onrechte als
     gewenningsdag vervallen. */
  it('telt een halve dag ervóór wel mee voor de vraag of iemand al mat', () => {
    const t = thuisbloeddruk(
      [m('2026-09-12', 'bloeddruk_sys', 200), ...paar('2026-09-14', 130, 80)], '2026-09-14')
    expect(t?.gewenningsdagWeg).toBe(false)
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
  /* Twaalf en niet zestien: de gewenningsdag van 140 telt ook hier niet mee.
     Een spreiding die de weggelaten dag wél meenam zou de lezer een streek
     leveren, een getal dat niet uit dezelfde dagen komt als het gemiddelde
     eronder. */
  it('is het verschil tussen de hoogste en de laagste tellende dag', () => {
    expect(thuisbloeddruk(week, '2026-09-14')?.spreidingSys).toBe(12)
  })

  it('is nul bij één dag, en dat is geen rust maar te weinig gegevens', () => {
    const t = thuisbloeddruk(paar('2026-09-14', 130, 80), '2026-09-14')
    expect(t?.spreidingSys).toBe(0)
    expect(t?.volledigeWeek).toBe(false)
  })
})

/**
 * HET VERSCHIL MET DE SPREEKKAMER, VASTGEHOUDEN
 *
 * Het NHG-protocol bloeddruk meten (2022) zegt voor de spreekkamer: noteer het
 * gemiddelde van de láátste twee metingen. Deze functie middelt alles wat er op
 * een dag staat, en dat is een keuze en geen slordigheid: dat protocol gaat
 * over de meting in de spreekkamer en niet over een week thuis.
 *
 * Deze proef houdt dat verschil vast. Verschuift het ooit, dan hoort dat een
 * besluit te zijn dat iemand neemt, niet iets wat gebeurt.
 */
describe('een dag met meer dan twee metingen', () => {
  it('middelt alles van die dag, en niet alleen de laatste twee', () => {
    const drie = [
      ...paar('2026-09-10', 150, 95),
      ...paar('2026-09-10', 130, 85),
      ...paar('2026-09-10', 130, 85),
    ]
    const t = thuisbloeddruk(drie, '2026-09-10' as IsoDatum)
    /* De laatste twee zouden 130/85 geven; alle drie geeft 137/88. */
    expect(t?.sys).toBe(137)
    expect(t?.dia).toBe(88)
  })
})
