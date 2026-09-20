/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Dit is de enige tekst in deze app die het scherm verlaat. Wat hier weggelaten
 * wordt, is weg: de lezer kan niet doorklikken, en heeft de app niet. Daarom
 * staan hier proeven op dingen die op het scherm vanzelf spreken.
 *
 * **De voorbehouden reizen mee.** Een SCORE2 zonder de onderschatting van 1,3
 * en zonder de C-index is in de inbox van een huisarts een ander getal dan op
 * dit scherm. Datzelfde geldt voor FIB-4 als uitsluittest en voor STOP-BANG als
 * screeningsvragenlijst. Drie proeven, en ze dekken alle drie hetzelfde soort
 * fout: het getal overleeft de reis en het voorbehoud niet.
 *
 * **Er staat bij waar het vandaan komt.** Zelf gemeten, zelf ingevoerd. In
 * platte tekst ziet een overgetikte waarde er hetzelfde uit als een labuitslag.
 *
 * **Wat ontbreekt krijgt een regel.** Een maat die er niet is verdwijnt niet
 * stilzwijgend. Leeg betekent in deze app niet gemeten, en dat is iets anders
 * dan goed.
 *
 * **En de bloeddruk zegt wat er niet aan na te gaan is.** De app kent geen
 * tijdstip bij een meting en kan het ochtend-en-avonddeel van het protocol dus
 * niet controleren. Wie dat weglaat, levert een getal af dat geprotocolleerd
 * lijkt.
 */
import { describe, expect, it } from 'vitest'
import { spreekuurtekst } from './spreekuur'
import type { Spreekuurbron } from './spreekuur'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const leeg: Spreekuurbron = {
  vandaag: '2026-09-20' as IsoDatum,
  gewichtKg: null, bmi: null,
  middelCm: null, middelDatum: null, middelLengte: null, middelbeloop: null,
  thuis: null, sysSpreekkamer: null,
  veranderingen: [], labs: [], labsLeeg: [],
  score2: null, fib4: null, stopbang: null,
}

const vol: Spreekuurbron = {
  ...leeg,
  gewichtKg: 117.3, bmi: 36.2,
  middelCm: 108, middelDatum: '2026-09-11',
  middelLengte: { ratio: 0.55, zone: 'boven' },
  middelbeloop: {
    punten: [], eerste: { datum: '2026-05-23', cm: 114 }, laatste: { datum: '2026-09-11', cm: 108 },
    verschilCm: -6, binnenRuis: false, gewichtVan: 121.4, gewichtTot: 117.3,
  },
  thuis: {
    sys: 128, dia: 82, dagen: 6, metingen: 14, volledigeWeek: false,
    spreidingSys: 12, gewenningsdagWeg: true,
  },
  sysSpreekkamer: 132,
  veranderingen: [{
    naam: 'Middelomtrek', eenheid: 'cm', vanWaarde: 114, vanDatum: '2026-05-23',
    totWaarde: 108, totDatum: '2026-09-11', verschil: -6, decimalen: 0, dagen: 111,
  }],
  labs: [{
    naam: 'HbA1c', waarde: 39, eenheid: 'mmol/mol', lo: null, hi: 42, datum: '2026-08-07',
  }],
  labsLeeg: ['TSH', 'Vitamine D'],
  score2: { risico: 6.42, klasse: 'laag' },
  fib4: { waarde: 1.12, klasse: 'fibrose praktisch uitgesloten' },
  stopbang: { score: 4, klasse: 'matig risico' },
}

describe('waar de getallen vandaan komen', () => {
  it('zegt bovenaan dat het zelf gemeten en zelf ingevoerd is', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('zelf gemeten en zelf ingevoerd')
    expect(t.split('\n').slice(0, 6).join(' ')).toContain('geen')
  })

  it('noemt het gewicht de gladde lijn en niet de weging van vandaag', () => {
    expect(spreekuurtekst(vol)).toContain('niet de weging van vandaag')
  })

  it('zet bij elke labwaarde een datum en een referentie', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('7 augustus 2026')
    expect(t).toContain('referentie tot 42')
  })

  it('zet bij elke verandering de tijd die ertussen zit', () => {
    expect(spreekuurtekst(vol)).toContain('van 114 naar 108 cm in 4 mnd')
  })
})

describe('de voorbehouden reizen mee', () => {
  /* DE PROEVEN WAAR DIT BESTAND VOOR BESTAAT. */
  it('geeft SCORE2 zijn onderschatting en zijn C-index mee', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('6,4 procent')
    expect(t).toContain('factor 1,3')
    expect(t).toContain('C-index is 0,65 tot 0,72')
    expect(t).toContain('gespreksinstrument')
  })

  it('en zegt met welke bloeddruk er gerekend is', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('gerekend met 132 mmHg')
    expect(t).toContain('thuisgemiddelde van 128')
  })

  it('geeft FIB-4 mee dat het een uitsluittest is', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('uitsluittest en geen stadiëring')
    expect(t).toContain('NVMDL')
  })

  it('geeft STOP-BANG mee dat het geen diagnose is', () => {
    expect(spreekuurtekst(vol)).toContain('geen diagnose')
  })

  it('en de bloeddruk wat er niet aan na te gaan is', () => {
    const t = spreekuurtekst(vol)
    expect(t).toContain('een datum en geen tijdstip')
    expect(t).toContain('eerste meetdag telt niet mee')
  })
})

describe('wat er niet in staat, staat erin', () => {
  it('noemt elke maat die ontbreekt bij naam', () => {
    const t = spreekuurtekst(leeg)
    expect(t).toContain('WAT HIER NIET IN STAAT')
    for (const stuk of ['Gewicht:', 'Middelomtrek:', 'Bloeddruk:', 'SCORE2:', 'FIB-4:',
                        'STOP-BANG:']) {
      expect(t).toContain(stuk)
    }
  })

  it('noemt de labwaarden die niet ingevuld zijn', () => {
    expect(spreekuurtekst(vol)).toContain('Niet ingevuld: TSH, Vitamine D.')
  })

  /* Een lege app levert geen leeg briefje: wat er niet is, is dan juist het
     hele bericht. */
  it('levert ook zonder één enkele meting een leesbare tekst', () => {
    const t = spreekuurtekst(leeg)
    expect(t.split('\n').length).toBeGreaterThan(10)
    expect(t).toContain('Labwaarden: geen enkele ingevuld.')
  })

  it('laat een kop met een voorbehoud weg als de score er niet is', () => {
    expect(spreekuurtekst(leeg)).not.toContain('C-index')
  })

  /* Een kop boven niets leest als een gegeven dat is weggevallen. Wat er niet
     is, hoort onderaan te staan waar het thuishoort, en nergens anders. */
  it('zet geen kop boven een blok dat leeg zou blijven', () => {
    const t = spreekuurtekst(leeg)
    for (const k of ['GEWICHT EN OMTREK', 'BLOEDDRUK', 'LABWAARDEN', 'WAT DE APP HIERUIT']) {
      expect(t).not.toContain(k)
    }
  })

  it('en een labwaarde leest als een uitslag, zonder loze komma-nul', () => {
    expect(spreekuurtekst(vol)).toContain('HbA1c: 39 mmol/mol')
  })
})
