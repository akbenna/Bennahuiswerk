/**
 * DE SUGGESTIES BEWIJZEN
 *
 * Er is hier geen oude code om tegenaan te leggen: dit is nieuw. Wat er wel is,
 * zijn drie eigenschappen die makkelijk stilletjes kapotgaan zodra iemand de
 * sortering aanraakt, en die dan geen foutmelding geven maar een lijst die er
 * plausibel uitziet en de verkeerde dingen bovenaan zet.
 *
 * 1. 'recent' is puur datum, 'vaak' is puur aantal. Zodra die twee door elkaar
 *    gaan lopen kan niemand de lijst meer uitleggen.
 * 2. Een herhaling neemt de getallen van de vorige keer letterlijk over. Als
 *    daar ooit iets herrekend gaat worden, verzint de app een portie die je
 *    niet gegeten hebt.
 * 3. Wat overgenomen is, zegt dat het overgenomen is.
 */
import { describe, expect, it } from 'vitest'
import { herhaalRegel, herhalingen, laatsteMaaltijd, sleutelVan } from './herhaal'
import type { Graad, IsoDatum, Moment, Regel, RegelBron } from '@/gedeeld/db/tabellen'

let teller = 0

function regel(
  datum: string, naam: string, moment: Moment, kcal = 100, extra: Partial<Regel> = {},
): Regel {
  return {
    id: 'r' + ++teller, datum: datum as IsoDatum, moment, naam,
    hoeveelheid: null, eenheid: null, gram_equivalent: null,
    kcal_punt: kcal, kcal_laag: Math.round(kcal * 0.85), kcal_hoog: Math.round(kcal * 1.15),
    eiwit_g: 10, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'B' as Graad, onzekerheidsbronnen: null, bron: 'tekst-ai' as RegelBron,
    nevo_code: null, dish_id: null, recept_id: null, foto_pad: null,
    ruwe_invoer: null, ai_model: null,
    ...extra,
  }
}

const NU = '2026-08-22' as IsoDatum

describe('groeperen', () => {
  it('vat verschillen in hoofdletters en spaties samen', () => {
    expect(sleutelVan('  Havermout   met   melk ')).toBe('havermout met melk')
    const uit = herhalingen([
      regel('2026-08-20', 'Havermout met melk', 'ontbijt'),
      regel('2026-08-21', 'havermout  met melk', 'ontbijt'),
    ], { nu: NU, soort: 'vaak' })
    expect(uit).toHaveLength(1)
    expect(uit[0]?.aantal).toBe(2)
  })

  it('houdt de spelling van de laatste keer aan', () => {
    const uit = herhalingen([
      regel('2026-08-20', 'havermout', 'ontbijt'),
      regel('2026-08-21', 'Havermout met banaan', 'ontbijt'),
    ], { nu: NU, soort: 'recent' })
    /* Twee verschillende namen blijven twee regels; alleen schrijfwijze valt
       samen. Anders zou 'kip' en 'kip met rijst' één ding worden. */
    expect(uit.map((h) => h.naam)).toEqual(['Havermout met banaan', 'havermout'])
  })

  it('neemt het moment waarop iets het vaakst gegeten wordt, niet dat van de laatste keer', () => {
    const uit = herhalingen([
      regel('2026-08-18', 'Cappuccino', 'ontbijt'),
      regel('2026-08-19', 'Cappuccino', 'ontbijt'),
      regel('2026-08-20', 'Cappuccino', 'ontbijt'),
      regel('2026-08-21', 'Cappuccino', 'avond' as Moment),
    ], { nu: NU, soort: 'vaak' })
    expect(uit[0]?.moment).toBe('ontbijt')
  })

  it('gebruikt onbekend alleen als er niets anders is', () => {
    const a = herhalingen([
      regel('2026-08-20', 'Import', 'onbekend'),
      regel('2026-08-21', 'Import', 'onbekend'),
    ], { nu: NU, soort: 'vaak' })
    expect(a[0]?.moment).toBe('onbekend')

    const b = herhalingen([
      regel('2026-08-20', 'Import', 'onbekend'),
      regel('2026-08-21', 'Import', 'onbekend'),
      regel('2026-08-21', 'Import', 'lunch'),
    ], { nu: NU, soort: 'vaak' })
    expect(b[0]?.moment).toBe('lunch')
  })
})

describe('recent', () => {
  it('sorteert op datum en niet op aantal', () => {
    const uit = herhalingen([
      regel('2026-08-10', 'Vaak', 'lunch'), regel('2026-08-11', 'Vaak', 'lunch'),
      regel('2026-08-12', 'Vaak', 'lunch'), regel('2026-08-13', 'Vaak', 'lunch'),
      regel('2026-08-21', 'Eenmalig', 'lunch'),
    ], { nu: NU, soort: 'recent' })
    expect(uit.map((h) => h.naam)).toEqual(['Eenmalig', 'Vaak'])
  })

  it('laat de toekomst en alles buiten het venster weg', () => {
    const uit = herhalingen([
      regel('2026-08-23', 'Morgen', 'lunch'),
      regel('2026-05-01', 'Lang geleden', 'lunch'),
      regel('2026-08-20', 'Binnen', 'lunch'),
    ], { nu: NU, soort: 'recent', venster: 60 })
    expect(uit.map((h) => h.naam)).toEqual(['Binnen'])
  })

  it('laat een geïmporteerd dagtotaal buiten de suggesties', () => {
    /* Kwam tegen het echte logboek boven water: 'Dagtotaal uit Yazio' stond
       zeventien keer in de geschiedenis en werd braaf voorgesteld als maaltijd
       van 1.319 kcal. Eén tik en je hele dag staat er als één regel in. */
    const uit = herhalingen([
      regel('2026-08-20', 'Dagtotaal uit Yazio', 'onbekend', 1319, { bron: 'import' }),
      regel('2026-08-21', 'Dagtotaal uit Yazio', 'onbekend', 1319, { bron: 'import' }),
      regel('2026-08-21', 'Havermout', 'ontbijt'),
    ], { nu: NU, soort: 'vaak' })
    expect(uit.map((h) => h.naam)).toEqual(['Havermout'])
  })

  it('houdt zich aan max', () => {
    const veel = Array.from({ length: 30 }, (_, i) => regel('2026-08-2' + (i % 10), 'x' + i, 'lunch'))
    expect(herhalingen(veel, { nu: NU, soort: 'recent', max: 5 })).toHaveLength(5)
  })
})

describe('vaak', () => {
  it('sorteert op aantal en niet op datum', () => {
    const uit = herhalingen([
      regel('2026-08-10', 'Vaak', 'lunch'), regel('2026-08-11', 'Vaak', 'lunch'),
      regel('2026-08-12', 'Vaak', 'lunch'),
      regel('2026-08-21', 'Eenmalig', 'lunch'),
    ], { nu: NU, soort: 'vaak' })
    expect(uit.map((h) => h.naam)).toEqual(['Vaak', 'Eenmalig'])
  })

  it('geeft het gekozen moment voorrang zonder de rest weg te gooien', () => {
    const regels = [
      regel('2026-08-10', 'Tajine', 'diner'), regel('2026-08-11', 'Tajine', 'diner'),
      regel('2026-08-12', 'Tajine', 'diner'), regel('2026-08-13', 'Tajine', 'diner'),
      regel('2026-08-20', 'Havermout', 'ontbijt'), regel('2026-08-21', 'Havermout', 'ontbijt'),
    ]
    const uit = herhalingen(regels, { nu: NU, soort: 'vaak', moment: 'ontbijt' })
    /* Havermout staat bovenaan ondanks de helft van het aantal — maar Tajine
       verdwijnt niet, want een lege lijst helpt niemand. */
    expect(uit.map((h) => h.naam)).toEqual(['Havermout', 'Tajine'])
  })

  it('negeert het moment als er onbekend staat', () => {
    const regels = [
      regel('2026-08-10', 'Tajine', 'diner'), regel('2026-08-11', 'Tajine', 'diner'),
      regel('2026-08-20', 'Havermout', 'ontbijt'),
    ]
    const uit = herhalingen(regels, { nu: NU, soort: 'vaak', moment: 'onbekend' })
    expect(uit.map((h) => h.naam)).toEqual(['Tajine', 'Havermout'])
  })
})

describe('herhaalRegel', () => {
  const bron = regel('2026-08-15', 'Tajine met kip', 'diner', 720, {
    hoeveelheid: 1, eenheid: 'bord', gram_equivalent: 420,
    conf: 'C', nevo_code: '1234', onzekerheidsbronnen: ['portie geschat'],
  })
  const h = herhalingen([bron], { nu: NU, soort: 'recent' })[0]!

  it('neemt elk getal letterlijk over', () => {
    const nieuw = herhaalRegel(h, NU, 'diner')
    expect(nieuw.kcal_punt).toBe(bron.kcal_punt)
    expect(nieuw.kcal_laag).toBe(bron.kcal_laag)
    expect(nieuw.kcal_hoog).toBe(bron.kcal_hoog)
    expect(nieuw.eiwit_g).toBe(bron.eiwit_g)
    expect(nieuw.vet_g).toBe(bron.vet_g)
    expect(nieuw.koolhydraat_g).toBe(bron.koolhydraat_g)
    expect(nieuw.vezel_g).toBe(bron.vezel_g)
    expect(nieuw.gram_equivalent).toBe(bron.gram_equivalent)
    expect(nieuw.conf).toBe('C')
    expect(nieuw.nevo_code).toBe('1234')
  })

  it('zet de nieuwe dag en het gekozen moment', () => {
    const nieuw = herhaalRegel(h, NU, 'lunch')
    expect(nieuw.datum).toBe(NU)
    expect(nieuw.moment).toBe('lunch')
  })

  it('vertelt dat de portie is overgenomen, en zegt het maar één keer', () => {
    const een = herhaalRegel(h, NU, 'diner')
    expect(een.onzekerheidsbronnen).toEqual(['portie geschat', 'zelfde portie als op 2026-08-15'])

    /* Twee keer herhalen mag de notitie niet stapelen. */
    const tweede = { ...h, regel: { ...h.regel, onzekerheidsbronnen: een.onzekerheidsbronnen ?? null } }
    expect(herhaalRegel(tweede, NU, 'diner').onzekerheidsbronnen).toHaveLength(2)
  })

  it('voegt de notitie ook toe als er nog geen bronnen waren', () => {
    const kaal = herhalingen([regel('2026-08-19', 'Appel', 'tussendoor', 95)],
      { nu: NU, soort: 'recent' })[0]!
    expect(herhaalRegel(kaal, NU, 'tussendoor').onzekerheidsbronnen)
      .toEqual(['zelfde portie als op 2026-08-19'])
  })
})

describe('laatsteMaaltijd', () => {
  const regels = [
    regel('2026-08-19', 'Havermout', 'ontbijt', 410),
    regel('2026-08-19', 'Cappuccino', 'ontbijt', 90),
    regel('2026-08-20', 'Havermout', 'ontbijt', 410),
    regel('2026-08-20', 'Cappuccino', 'ontbijt', 90),
    regel('2026-08-20', 'Banaan', 'ontbijt', 105),
    regel('2026-08-22', 'Koffie', 'ontbijt', 5),
  ]

  it('pakt de laatste dag vóór vandaag waarop dat moment gevuld was', () => {
    const m = laatsteMaaltijd(regels, 'ontbijt', NU, NU)
    expect(m?.datum).toBe('2026-08-20')
    expect(m?.regels).toHaveLength(3)
    expect(m?.kcal).toBe(605)
  })

  it('stelt geen maaltijd van één regel voor', () => {
    expect(laatsteMaaltijd([
      regel('2026-08-20', 'Appel', 'tussendoor'),
    ], 'tussendoor', NU, NU)).toBeNull()
  })

  it('geeft niets terug voor een moment dat nooit gevuld was', () => {
    expect(laatsteMaaltijd(regels, 'diner', NU, NU)).toBeNull()
  })

  it('slaat de dag over die je aan het invullen bent', () => {
    /* Anders stelt de app voor om over te nemen wat er al staat. */
    const eergisteren = laatsteMaaltijd(regels, 'ontbijt', '2026-08-20' as IsoDatum,
      '2026-08-20' as IsoDatum)
    expect(eergisteren?.datum).toBe('2026-08-19')
  })
})
