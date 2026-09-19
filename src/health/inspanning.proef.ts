/**
 * WAT ER AAN DE INSPANNINGSREKENING TE TOETSEN VALT
 *
 * Eén ding: dat een minuut zware inspanning voor twee matige telt, en dat dat
 * overal doorwerkt. De rest van dit bestand is er om die ene regel niet stil te
 * laten verdwijnen — een factor die per ongeluk op 1 komt te staan geeft geen
 * foutmelding, alleen een weekdoel dat niet meer gehaald wordt.
 *
 * En één die net zo belangrijk is en makkelijker over het hoofd te zien: de
 * verdeling toont échte minuten en de balk equivalenten. Zouden die twee
 * hetzelfde rekenen, dan staat er bij veertig minuten hardlopen tachtig in de
 * lijst, en dan liegt het scherm over wat je gedaan hebt.
 */
import { describe, expect, it } from 'vitest'
import {
  FACTOR, OUD_VELD, SOORTEN, WEEKDOEL_MIN, equivalent, naamVan, soortVan,
  standaardIntensiteit, verdeling, weekposten, weektotaal, zwareMinuten,
} from './inspanning'

describe('de wisselkoers uit de richtlijn', () => {
  it('matig telt enkel en zwaar dubbel', () => {
    expect(equivalent(30, 'matig')).toBe(30)
    expect(equivalent(30, 'zwaar')).toBe(60)
  })

  /* Deze twee staan er los van `equivalent`, want ze zijn de richtlijn zelf en
     niet een gevolg ervan: 150 matige minuten of 75 zware. Gaat de factor of het
     doel schuiven, dan valt hier op dát het schuift en niet pas twee schermen
     verderop. */
  it('vijfenzeventig zware minuten halen het weekdoel precies', () => {
    expect(equivalent(75, 'zwaar')).toBe(WEEKDOEL_MIN)
  })

  it('en honderdvijftig matige ook', () => {
    expect(equivalent(WEEKDOEL_MIN, 'matig')).toBe(WEEKDOEL_MIN)
  })

  it('de factoren zijn 1 en 2 en niets anders', () => {
    expect(FACTOR.matig).toBe(1)
    expect(FACTOR.zwaar).toBe(2)
  })
})

describe('het weektotaal', () => {
  it('telt een gemengde week bij elkaar op', () => {
    /* Twee keer een half uur wandelen en een kwartier rennen: 60 + 30 = 90. */
    expect(weektotaal([
      { minuten: 30, intensiteit: 'matig' },
      { minuten: 30, intensiteit: 'matig' },
      { minuten: 15, intensiteit: 'zwaar' },
    ])).toBe(90)
  })

  it('een lege week is nul en geen streepje', () => {
    expect(weektotaal([])).toBe(0)
  })

  /* Een week waarin alleen gerend is hoort het doel te halen op veel minder
     minuten dan een week waarin alleen gewandeld is. Dat is de hele reden dat
     dit bestand bestaat, dus staat het er als eigen bewering. */
  it('rennen haalt het doel op de helft van de minuten', () => {
    const gerend = weektotaal([{ minuten: 76, intensiteit: 'zwaar' }])
    const gewandeld = weektotaal([{ minuten: 76, intensiteit: 'matig' }])
    expect(gerend).toBeGreaterThanOrEqual(WEEKDOEL_MIN)
    expect(gewandeld).toBeLessThan(WEEKDOEL_MIN)
  })
})

describe('de soorten', () => {
  it('elke soort heeft een naam, een intensiteit en een reden', () => {
    for (const s of SOORTEN) {
      expect(s.naam, s.sleutel).toBeTruthy()
      expect(['matig', 'zwaar'], s.sleutel).toContain(s.intensiteit)
      expect(s.waarom, s.sleutel).toBeTruthy()
    }
  })

  it('geen twee soorten delen een sleutel', () => {
    expect(new Set(SOORTEN.map((s) => s.sleutel)).size).toBe(SOORTEN.length)
  })

  it('wandelen is matig en rennen is zwaar', () => {
    expect(standaardIntensiteit('wandelen')).toBe('matig')
    expect(standaardIntensiteit('rennen')).toBe('zwaar')
  })

  /* Fietsen staat op de grens van het Compendium en is met opzet als matig
     ingedeeld. Dat is de voorzichtige kant: wie hard fietst zet de schakelaar
     om, wie dat niet doet krijgt geen doel dat zichzelf haalt. */
  it('fietsen is voorzichtig ingedeeld en dus matig', () => {
    expect(standaardIntensiteit('fietsen')).toBe('matig')
  })

  /* Een sleutel die deze app niet kent komt uit een oudere rij of uit een
     import die iets nieuws zag. Die telt als matig, want te laag rekenen laat
     je doorgaan en te hoog rekenen zegt dat je klaar bent. */
  it('een onbekende soort telt als matig en valt niet om', () => {
    expect(standaardIntensiteit('onderwatermanden-vlechten')).toBe('matig')
    expect(soortVan('onderwatermanden-vlechten')).toBeNull()
  })

  it('krachttraining staat er niet bij', () => {
    /* Die telt in de richtlijn apart en heeft zijn eigen bolletjes. Zou hij hier
       ook meetellen, dan haalde één sessie de halve aerobe week. */
    expect(SOORTEN.map((s) => s.sleutel)).not.toContain('kracht')
    expect(SOORTEN.map((s) => s.sleutel)).not.toContain('krachttraining')
  })
})

describe('de naam op het scherm', () => {
  it('een bekende soort heet zoals hij heet', () => {
    expect(naamVan('rennen')).toBe('Hardlopen')
  })

  it('een eigen naam gaat voor', () => {
    expect(naamVan('anders', 'Kickboksen')).toBe('Kickboksen')
  })

  /* Een naam van alleen spaties is geen naam. Zonder deze regel staat er een
     lege regel in de lijst waar niemand iets aan heeft. */
  it('een naam van spaties telt niet als naam', () => {
    expect(naamVan('anders', '   ')).toBe('Anders')
  })

  it('en een onbekende sleutel valt terug op zichzelf', () => {
    expect(naamVan('kajak')).toBe('kajak')
  })
})

describe('de verdeling', () => {
  /* Écht gelopen minuten, niet wat ze waard zijn. Rekende deze mee met de
     factor, dan stond er bij veertig minuten hardlopen tachtig in de lijst en
     loog het scherm over wat je gedaan hebt. */
  it('toont echte minuten en geen equivalenten', () => {
    expect(verdeling([{ soort: 'rennen', minuten: 40 }]))
      .toEqual([{ naam: 'Hardlopen', minuten: 40 }])
  })

  it('telt dezelfde soort bij elkaar op', () => {
    expect(verdeling([
      { soort: 'wandelen', minuten: 25 },
      { soort: 'wandelen', minuten: 35 },
    ])).toEqual([{ naam: 'Wandelen', minuten: 60 }])
  })

  it('zet de grootste vooraan', () => {
    expect(verdeling([
      { soort: 'wandelen', minuten: 20 },
      { soort: 'fietsen', minuten: 90 },
      { soort: 'rennen', minuten: 45 },
    ]).map((r) => r.naam)).toEqual(['Fietsen', 'Hardlopen', 'Wandelen'])
  })

  /* Twee rijen 'anders' met verschillende namen zijn twee soorten en geen één.
     Ze op de sleutel optellen zou "Kickboksen" en "Yoga" tot 'Anders' samen
     smelten. */
  it('twee eigen namen blijven twee regels', () => {
    expect(verdeling([
      { soort: 'anders', eigennaam: 'Kickboksen', minuten: 60 },
      { soort: 'anders', eigennaam: 'Yoga', minuten: 30 },
    ])).toEqual([
      { naam: 'Kickboksen', minuten: 60 },
      { naam: 'Yoga', minuten: 30 },
    ])
  })

  it('niets erin is niets eruit', () => {
    expect(verdeling([])).toEqual([])
  })
})

describe('het oude veld telt mee', () => {
  const week = ['2026-09-14', '2026-09-15', '2026-09-16']
  const post = (datum: string, soort: string, minuten: number,
                intensiteit: 'matig' | 'zwaar' = 'matig', bron = 'app') =>
    ({ datum, soort, minuten, intensiteit, bron })

  it('een dag met fietsminuten levert een rit op', () => {
    expect(weekposten(week, [], { '2026-09-15': 45 }))
      .toEqual([{ datum: '2026-09-15', soort: 'fietsen', minuten: 45, intensiteit: 'matig', bron: OUD_VELD }])
  })

  /* `kal_dagen.fiets_min` heeft `default 0`, dus elke dag die ooit is
     aangeraakt heeft er een. Zonder deze regel stond er bij iedereen een kolom
     nullen in de lijst van de week. */
  it('nul minuten is geen rit', () => {
    expect(weekposten(week, [], { '2026-09-15': 0, '2026-09-16': null })).toEqual([])
  })

  it('en hij komt bovenop wat er in de lijst staat', () => {
    const uit = weekposten(week, [post('2026-09-15', 'wandelen', 30)], { '2026-09-15': 45 })
    expect(weektotaal(uit)).toBe(75)
    expect(uit.map((r) => r.bron)).toEqual(['app', OUD_VELD])
  })

  /* Een dag buiten het venster hoort niet mee te tellen, ook niet als hij in de
     rijen zit — de lijst gaat over drie weken en de norm over zeven dagen. */
  it('een rij van buiten de week valt eraf', () => {
    expect(weekposten(week, [post('2026-09-01', 'rennen', 40, 'zwaar')], {})).toEqual([])
  })

  it('en een fietsdag buiten de week ook', () => {
    expect(weekposten(week, [], { '2026-09-01': 60 })).toEqual([])
  })
})

describe('hoeveel er zwaar was', () => {
  const p = (minuten: number, intensiteit: 'matig' | 'zwaar') =>
    ({ datum: '2026-09-15', soort: 'x', minuten, intensiteit, bron: 'app' })

  /* Échte minuten en geen equivalenten: de regel op het scherm zegt "waarvan 40
     minuten zwaar", en dat is wat je gedaan hebt. Rekende dit met de factor,
     dan stond er tachtig. */
  it('telt echte minuten en geen equivalenten', () => {
    expect(zwareMinuten([p(40, 'zwaar'), p(30, 'matig')])).toBe(40)
  })

  it('een week zonder zware inspanning is nul', () => {
    expect(zwareMinuten([p(30, 'matig')])).toBe(0)
  })
})
