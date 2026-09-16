/**
 * HET DAGVERSLAG BEWIJZEN
 *
 * Dit vel keur je in één tik goed. Dat is de winst en meteen het gevaar: wat
 * hier stil misgaat, gaat er in één keer twaalf regels lang in, en je ziet het
 * pas terug als het dagtotaal er raar uitziet.
 *
 * Drie dingen kunnen kapot zonder een fout te geven.
 *
 * 1. Een regel zonder moment die tóch wordt opgeslagen. Hij landt dan op een
 *    plek die niemand heeft aangewezen, en daarmee is de hele belofte van dit
 *    vel weg — je keurde iets goed wat je niet gezien hebt.
 * 2. Een regel die bij het verschuiven verdwijnt of zich verdubbelt. Twaalf
 *    regels ziet niemand na op het aantal.
 * 3. De band die bij het optellen wegvalt, of die het punt niet meer omsluit.
 *    Een dagtotaal zonder band ziet er precies zo uit als een goed dagtotaal.
 */
import { describe, expect, it } from 'vitest'
import {
  beginKeuzes, naarRegels, naarTrainingen, nogTePlaatsen, optellen, vakken, verplaats, weglaten,
} from './dagverslag'
import type { HerkendeRegel } from './ai'
import type { Graad, IsoDatum, Moment } from '@/gedeeld/db/tabellen'

const DATUM = '2026-09-16' as IsoDatum

function herkend(naam: string, moment: string, kcal: number, eiwit = 10): HerkendeRegel {
  return {
    naam, moment: moment as Moment, hoeveelheid: 1, eenheid: 'portie',
    gram_equivalent: 100, kcal_punt: kcal,
    kcal_laag: Math.round(kcal * 0.8), kcal_hoog: Math.round(kcal * 1.3),
    eiwit_g: eiwit, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'C' as Graad, onzekerheidsbronnen: [], bron: 'tekst-ai',
    nevo_code: '123', nevo_naam: naam, gram_laag: 80, gram_hoog: 130,
    ai_model: 'proef',
  }
}

/* Een gewone dag zoals hij ingesproken wordt: drie maaltijden, iets tussendoor,
   en één ding waarvan het moment niet uit de tekst bleek. */
const DAG = [
  herkend('Twee bruine boterhammen', 'ontbijt', 320, 10),
  herkend('Broodje zalm', 'lunch', 410, 22),
  herkend('Tajine met kip', 'diner', 720, 46),
  herkend('Handje amandelen', 'tussendoor', 180, 6),
  herkend('Glas sinaasappelsap', 'onbekend', 110, 2),
]

describe('beginKeuzes', () => {
  it('neemt het moment over dat het model noemde', () => {
    const k = beginKeuzes(DAG)
    expect(k.map((x) => x.moment)).toEqual(['ontbijt', 'lunch', 'diner', 'tussendoor', 'onbekend'])
  })

  it('zet alles wat geen dagdeel is op onbekend', () => {
    /* De herkenning hoort 'onbekend' te sturen als ze het niet weet, maar een
       model dat 'snack' of een lege tekenreeks verzint mag hier geen regel
       laten ontstaan die nergens hoort en toch een moment lijkt te hebben. */
    const raar = beginKeuzes([herkend('Iets', 'snack', 100), herkend('Iets anders', '', 100)])
    expect(raar.every((k) => k.moment === 'onbekend')).toBe(true)
  })

  it('geeft elke regel een eigen sleutel, ook bij dezelfde naam', () => {
    const twee = beginKeuzes([herkend('Cappuccino', 'ontbijt', 60), herkend('Cappuccino', 'lunch', 60)])
    expect(twee[0]?.sleutel).not.toBe(twee[1]?.sleutel)
  })
})

describe('vakken', () => {
  it('zet wat nog geplaatst moet worden vooraan', () => {
    const v = vakken(beginKeuzes(DAG))
    expect(v[0]?.moment).toBe('onbekend')
    expect(v.map((x) => x.moment)).toEqual(['onbekend', 'ontbijt', 'lunch', 'diner', 'tussendoor'])
  })

  it('laat het onbekende vak verdwijnen zodra het leeg is', () => {
    const k = verplaats(beginKeuzes(DAG), 4, 'ontbijt')
    expect(vakken(k).map((x) => x.moment)).toEqual(['ontbijt', 'lunch', 'diner', 'tussendoor'])
  })

  it('toont geen leeg dagdeel', () => {
    /* Alleen een ontbijt ingesproken: dan hoort er één vak te staan en niet
       vier koppen waarvan er drie niets onder zich hebben. */
    const v = vakken(beginKeuzes([herkend('Twee bruine boterhammen', 'ontbijt', 320)]))
    expect(v).toHaveLength(1)
    expect(v[0]?.moment).toBe('ontbijt')
  })

  it('houdt de regels binnen een vak in de volgorde van het verslag', () => {
    const drie = beginKeuzes([
      herkend('Koffie', 'ontbijt', 10), herkend('Brood', 'ontbijt', 320), herkend('Kaas', 'ontbijt', 90),
    ])
    expect(vakken(drie)[0]?.keuzes.map((k) => k.regel.naam)).toEqual(['Koffie', 'Brood', 'Kaas'])
  })
})

describe('verplaats en weglaten', () => {
  it('verplaatst er precies één en verliest er geen', () => {
    const k = verplaats(beginKeuzes(DAG), 2, 'lunch')
    expect(k).toHaveLength(DAG.length)
    expect(k.find((x) => x.sleutel === 2)?.moment).toBe('lunch')
    /* En de rest staat nog waar hij stond — een verschuiving die de buren
       meeneemt zou je bij twaalf regels niet zien. */
    expect(k.filter((x) => x.sleutel !== 2).map((x) => x.moment))
      .toEqual(['ontbijt', 'lunch', 'tussendoor', 'onbekend'])
  })

  it('raakt niets aan bij een sleutel die er niet is', () => {
    const begin = beginKeuzes(DAG)
    expect(verplaats(begin, 99, 'diner')).toEqual(begin)
  })

  it('laat er precies één weg', () => {
    const k = weglaten(beginKeuzes(DAG), 0)
    expect(k).toHaveLength(4)
    expect(k.some((x) => x.regel.naam === 'Twee bruine boterhammen')).toBe(false)
  })

  it('laat bij dezelfde naam alleen de aangewezen regel weg', () => {
    const twee = beginKeuzes([herkend('Cappuccino', 'ontbijt', 60), herkend('Cappuccino', 'lunch', 60)])
    const over = weglaten(twee, 0)
    expect(over).toHaveLength(1)
    expect(over[0]?.moment).toBe('lunch')
  })
})

describe('optellen', () => {
  it('telt het punt en de band allebei op', () => {
    const t = optellen(beginKeuzes(DAG))
    expect(t.kcal).toBe(320 + 410 + 720 + 180 + 110)
    expect(t.laag).toBe(256 + 328 + 576 + 144 + 88)
    expect(t.hoog).toBe(416 + 533 + 936 + 234 + 143)
    expect(t.eiwit).toBe(10 + 22 + 46 + 6 + 2)
  })

  it('houdt het punt binnen de band', () => {
    const t = optellen(beginKeuzes(DAG))
    expect(t.laag).toBeLessThan(t.kcal)
    expect(t.hoog).toBeGreaterThan(t.kcal)
  })

  it('telt een leeg vel op tot nul en niet tot NaN', () => {
    expect(optellen([])).toEqual({ kcal: 0, laag: 0, hoog: 0, eiwit: 0 })
  })
})

describe('naarRegels', () => {
  it('slaat niet op wat nog geen moment heeft', () => {
    /* De regel waar dit hele vel op rust. Vijf regels herkend, vier met een
       moment: er gaan er vier in, en het sinaasappelsap blijft staan. */
    const uit = naarRegels(beginKeuzes(DAG), DATUM)
    expect(uit).toHaveLength(4)
    expect(uit.some((r) => r.naam === 'Glas sinaasappelsap')).toBe(false)
    expect(uit.every((r) => r.moment !== 'onbekend')).toBe(true)
  })

  it('neemt het sap wel mee zodra je het aanwijst', () => {
    const uit = naarRegels(verplaats(beginKeuzes(DAG), 4, 'ontbijt'), DATUM)
    expect(uit).toHaveLength(5)
    expect(uit.find((r) => r.naam === 'Glas sinaasappelsap')?.moment).toBe('ontbijt')
  })

  it('zet overal dezelfde datum en houdt de voedingswaarde heel', () => {
    const uit = naarRegels(beginKeuzes(DAG), DATUM)
    expect(uit.every((r) => r.datum === DATUM)).toBe(true)
    const tajine = uit.find((r) => r.naam === 'Tajine met kip')
    expect(tajine?.kcal_punt).toBe(720)
    expect(tajine?.kcal_laag).toBe(576)
    expect(tajine?.kcal_hoog).toBe(936)
    expect(tajine?.eiwit_g).toBe(46)
    /* De herkomst gaat mee: een regel uit een dagverslag hoort later te weten
       waar hij vandaan kwam. */
    expect(tajine?.bron).toBe('tekst-ai')
    expect(tajine?.nevo_code).toBe('123')
  })

  it('telt hoeveel er nog op je wachten', () => {
    expect(nogTePlaatsen(beginKeuzes(DAG))).toBe(1)
    expect(nogTePlaatsen(verplaats(beginKeuzes(DAG), 4, 'lunch'))).toBe(0)
  })
})

describe('naarTrainingen', () => {
  it('neemt over wat er staat en laat leeg wat er niet staat', () => {
    const uit = naarTrainingen([{ oefening: 'Bankdrukken', spiergroep: 'borst', sets: 3, reps: 10 }], DATUM)
    expect(uit).toEqual([{
      datum: DATUM, oefening: 'Bankdrukken', spiergroep: 'borst',
      sets: 3, reps: 10, gewicht_kg: null,
    }])
  })

  it('vult geen gebruikelijk aantal in waar niets genoemd is', () => {
    /* Dit is waar het model in de verleiding komt en waar de prompt hem
       tegenhoudt. Komt er toch niets terug, dan blijft het hier ook niets: een
       verzonnen driemaal-tien is een getal dat niemand ooit gezegd heeft. */
    const uit = naarTrainingen([{ oefening: 'Squat' }], DATUM)
    expect(uit[0]).toEqual({
      datum: DATUM, oefening: 'Squat', spiergroep: null,
      sets: null, reps: null, gewicht_kg: null,
    })
  })

  it('laat naamloze ruis weg', () => {
    expect(naarTrainingen([{ oefening: '  ' }, { oefening: 'Roeien' }], DATUM)).toHaveLength(1)
  })
})
