/**
 * WELKE METING HET SCHERM LAAT ZIEN
 *
 * Deze proef bestaat om één reden. De sortering die hier onder ligt gaf voor
 * twee gelijke datums -1 terug in beide richtingen — a vóór b én b vóór a. Dat
 * is geen ordening maar een tegenspraak, en de uitkomst hing af van de
 * sorteerfunctie van de browser. Zolang niemand twee metingen op één dag had
 * viel dat niemand op.
 *
 * Met de koppeling erbij is het geen theorie meer: het horloge schrijft elke
 * nacht een rustpols en jij kunt er die dag zelf ook een invullen. Op 23
 * augustus 2026 stonden er werkelijk twee, 64 en 70.
 *
 * Wat hier vastligt is dus niet "sorteren werkt", maar de regel: wat jij zelf
 * invulde wint van wat automatisch binnenkwam. Diezelfde regel staat in de
 * database in `kal_beweging_dag` en is daar vastgelegd in `kal_proef_koppeling`
 * onder "EEN POLS DIE JIJ INVULDE BLIJFT STAAN". Als één van de twee ooit
 * omdraait, horen ze niet allebei stil mee te draaien.
 */
import { describe, expect, it } from 'vitest'
import { AUTOMATISCH, dagenTussen, nieuwste, rustpols } from './klinisch'

interface M { datum: string; soort: string; waarde: number; notitie?: string | null }

const m = (datum: string, waarde: number, notitie: string | null = null): M =>
  ({ datum, soort: 'hartslag_rust', waarde, notitie })

describe('nieuwste', () => {
  it('pakt de laatste datum, ongeacht de volgorde in de lijst', () => {
    const uit = nieuwste([m('2026-08-19', 60), m('2026-08-23', 64), m('2026-08-21', 62)],
      (x) => x.soort === 'hartslag_rust')
    expect(uit?.datum).toBe('2026-08-23')
  })

  it('laat op dezelfde dag jouw meting winnen van die van de koppeling', () => {
    const jouwe = m('2026-08-23', 70)
    const horloge = m('2026-08-23', 64, AUTOMATISCH)
    /* Beide volgordes, want juist dát ging mis: het antwoord mag niet afhangen
       van hoe de rijen toevallig uit de database komen. */
    expect(nieuwste([horloge, jouwe], () => true)?.waarde).toBe(70)
    expect(nieuwste([jouwe, horloge], () => true)?.waarde).toBe(70)
  })

  it('geeft niets terug als er niets van die soort is', () => {
    expect(nieuwste([m('2026-08-23', 64)], (x) => x.soort === 'middelomtrek')).toBeNull()
  })

  it('laat de lijst zelf ongemoeid', () => {
    const lijst = [m('2026-08-19', 60), m('2026-08-23', 64)]
    nieuwste(lijst, () => true)
    expect(lijst[0]?.datum).toBe('2026-08-19')
  })
})

describe('rustpols', () => {
  const reeks = [
    m('2026-08-23', 64), m('2026-08-22', 60), m('2026-08-21', 58), m('2026-08-20', 62),
  ]

  it('vergelijkt met de dagen ervóór en niet met zichzelf', () => {
    const r = rustpols(reeks)
    expect(r?.nu.waarde).toBe(64)
    expect(r?.n).toBe(3)
    expect(r?.basis).toBe(60)   // (60+58+62)/3, zonder de 64 van vandaag
  })

  it('zwijgt onder de drie eerdere metingen', () => {
    const r = rustpols([m('2026-08-23', 64), m('2026-08-22', 60)])
    expect(r?.basis).toBeNull()
    expect(r?.n).toBe(1)
  })

  it('telt een dag met twee metingen één keer', () => {
    /* Anders weegt een dag waarop je toevallig twee keer mat dubbel zo zwaar in
       je eigen referentie. */
    const r = rustpols([...reeks, m('2026-08-22', 90, AUTOMATISCH)])
    expect(r?.n).toBe(3)
    expect(r?.basis).toBe(60)
  })

  it('laat alles ouder dan dertig dagen buiten de vergelijking', () => {
    const r = rustpols([
      m('2026-08-23', 64), m('2026-08-22', 60), m('2026-08-21', 58),
      m('2026-06-01', 90),
    ])
    expect(r?.n).toBe(2)
  })

  it('geeft niets terug zonder metingen', () => {
    expect(rustpols([])).toBeNull()
    expect(rustpols([{ datum: '2026-08-23', soort: 'bloeddruk_sys', waarde: 130 }])).toBeNull()
  })
})

describe('dagenTussen', () => {
  it('telt kale datums zonder tijdzone', () => {
    expect(dagenTussen('2026-08-20', '2026-08-23')).toBe(3)
    expect(dagenTussen('2026-08-23', '2026-08-23')).toBe(0)
    /* Over de zomertijdgrens heen: 25 uur in een dag mag geen halve dag geven. */
    expect(dagenTussen('2026-10-24', '2026-10-26')).toBe(2)
  })
})
