/**
 * HET OVERZICHT BEWIJZEN
 *
 * Vier eigenschappen die er plausibel uitzien als ze stukgaan, en die daarom
 * niet aan het oog overgelaten kunnen worden.
 *
 * 1. Regels zonder moment horen ergens te staan en niet te verdwijnen.
 * 2. De band is een som en geen wortel: onafhankelijke fouten zijn het niet.
 * 3. Een ontbrekende macro is geen nul, en het overzicht zegt dat er één mist.
 * 4. Een regel zonder band verkleint het interval niet.
 */
import { describe, expect, it } from 'vitest'
import { dagoverzicht, portietekst } from './overzicht'
import type { Graad, IsoDatum, Moment, Regel, RegelBron } from '@/gedeeld/db/tabellen'

let teller = 0

function regel(moment: Moment, kcal: number, extra: Partial<Regel> = {}): Regel {
  return {
    id: 'r' + ++teller, datum: '2026-08-29' as IsoDatum, moment, naam: 'iets',
    hoeveelheid: null, eenheid: null, gram_equivalent: null,
    kcal_punt: kcal, kcal_laag: Math.round(kcal * 0.8), kcal_hoog: Math.round(kcal * 1.2),
    eiwit_g: 10, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'B' as Graad, onzekerheidsbronnen: null, bron: 'tekst-ai' as RegelBron,
    nevo_code: null, dish_id: null, recept_id: null, foto_pad: null,
    ruwe_invoer: null, ai_model: null,
    ...extra,
  }
}

describe('dagoverzicht', () => {
  it('zet elke regel in precies één vak', () => {
    const o = dagoverzicht([regel('ontbijt', 100), regel('diner', 300), regel('diner', 50)])
    expect(o.vakken.map((v) => v.regels.length)).toEqual([1, 0, 2, 0])
    expect(o.aantal).toBe(3)
  })

  it('laat een regel zonder moment niet verdwijnen', () => {
    const o = dagoverzicht([regel('onbekend', 90)])
    expect(o.aantal).toBe(1)
    /* Bij tussendoor, zoals op het dagscherm. */
    expect(o.vakken[3]!.regels).toHaveLength(1)
    expect(o.vakken.reduce((n, v) => n + v.regels.length, 0)).toBe(1)
  })

  it('de vier vakken staan er ook als de dag leeg is', () => {
    const o = dagoverzicht([])
    expect(o.vakken).toHaveLength(4)
    expect(o.totaal.kcal).toBe(0)
  })

  it('telt de band op als som en niet als wortel', () => {
    /* Twee keer 100 (80–120) is 200 (160–240). Optellen van varianties zou
       200 (172–228) geven, en dat is een belofte die niemand waar kan maken. */
    const o = dagoverzicht([regel('lunch', 100), regel('lunch', 100)])
    expect(o.totaal.kcal).toBe(200)
    expect(o.totaal.laag).toBe(160)
    expect(o.totaal.hoog).toBe(240)
  })

  it('een regel zonder band maakt de dag niet zekerder', () => {
    const o = dagoverzicht([regel('lunch', 100, { kcal_laag: null, kcal_hoog: null })])
    expect(o.totaal.laag).toBe(100)
    expect(o.totaal.hoog).toBe(100)
  })

  it('een ontbrekende macro telt niet als nul maar wordt geteld', () => {
    const o = dagoverzicht([regel('lunch', 100), regel('lunch', 100, { eiwit_g: null })])
    expect(o.totaal.eiwit).toEqual({ gram: 10, ontbreekt: 1 })
    expect(o.totaal.koolhydraat).toEqual({ gram: 40, ontbreekt: 0 })
  })

  it('telt hoeveel regels op een tabelwaarde staan', () => {
    const o = dagoverzicht([regel('lunch', 100, { nevo_code: '123' }), regel('lunch', 100)])
    expect(o.gemeten).toBe(1)
    expect(o.aantal).toBe(2)
  })

  it('het totaal is de som van de vakken', () => {
    const o = dagoverzicht([regel('ontbijt', 100), regel('diner', 300), regel('onbekend', 50)])
    expect(o.vakken.reduce((n, v) => n + v.kcal, 0)).toBe(o.totaal.kcal)
    expect(o.vakken.reduce((n, v) => n + v.laag, 0)).toBe(o.totaal.laag)
  })
})

describe('portietekst', () => {
  it('zet aantal, eenheid en gram achter elkaar', () => {
    expect(portietekst({ hoeveelheid: 2, eenheid: 'snede', gram_equivalent: 70 }))
      .toBe('2 snede · 70 g')
  })

  it('laat weg wat er niet is', () => {
    expect(portietekst({ hoeveelheid: null, eenheid: null, gram_equivalent: 150 })).toBe('150 g')
    expect(portietekst({ hoeveelheid: 2, eenheid: null, gram_equivalent: null })).toBe('')
    expect(portietekst({ hoeveelheid: null, eenheid: null, gram_equivalent: null })).toBe('')
  })
})
