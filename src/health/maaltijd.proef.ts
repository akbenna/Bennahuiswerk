/**
 * EIGEN MAALTIJDEN BEWIJZEN
 *
 * Vier dingen kunnen hier stilletjes kapot en geven dan geen fout maar een
 * getal dat er goed uitziet.
 *
 * 1. De band kan meeschalen vergeten. Een halve portie met de band van een
 *    hele is een maaltijd die twee keer zo onzeker lijkt als hij is — en, erger,
 *    een hele portie met de band van een halve lijkt twee keer zo zeker.
 * 2. De slechtste graad kan een gemiddelde worden. Dan verdwijnt het geschatte
 *    scheutje olie tussen zes gewogen ingrediënten, en dat scheutje is bij deze
 *    gebruiker de grootste post van de dag.
 * 3. Een ontbrekende eiwitwaarde kan als nul meetellen. Dan meldt de coach dat
 *    het eiwit gehaald is op grond van een optelling met gaten.
 * 4. Het verdelen over borden kan gratis worden. Wie twee porties kookt en er
 *    één eet heeft niet exact de helft gegeten, en dat hoort de regel te zeggen.
 */
import { describe, expect, it } from 'vitest'
import { aggregaat, maaltijdRegel, naamvoorstel, portieNaam, slechtste, snapshot } from './maaltijd'
import type { Maaltijd, MaaltijdRegel } from './maaltijd'
import type { Graad, IsoDatum, Moment, Regel, RegelBron } from '@/gedeeld/db/tabellen'

function onderdeel(o: Partial<MaaltijdRegel> & { naam: string; kcal_punt: number }): MaaltijdRegel {
  return {
    hoeveelheid: null, eenheid: null, gram_equivalent: null,
    kcal_laag: Math.round(o.kcal_punt * 0.9), kcal_hoog: Math.round(o.kcal_punt * 1.1),
    eiwit_g: 0, vet_g: 0, koolhydraat_g: 0, vezel_g: 0,
    conf: 'B' as Graad, onzekerheidsbronnen: null, bron: 'nevo' as RegelBron, nevo_code: null,
    ...o,
  }
}

/* De salade uit de analyse, zoals hij in de app staat: zeven onderdelen, samen
   twee porties. De olie is het onderdeel dat alles bepaalt. */
const salade: Maaltijd = {
  id: 'm1', naam: 'Tonijnsalade', toelichting: null, porties: 2,
  regels: [
    onderdeel({ naam: 'Tomaat', kcal_punt: 65, eiwit_g: 3.2, gram_equivalent: 360, conf: 'A' }),
    onderdeel({ naam: 'Ui', kcal_punt: 45, eiwit_g: 1.3, gram_equivalent: 110, conf: 'A' }),
    onderdeel({ naam: 'Paprika', kcal_punt: 45, eiwit_g: 1.4, gram_equivalent: 150, conf: 'A' }),
    onderdeel({ naam: 'Tonijn', kcal_punt: 115, eiwit_g: 25, gram_equivalent: 100, conf: 'A' }),
    onderdeel({ naam: 'Mayonaise', kcal_punt: 80, eiwit_g: 0.1, gram_equivalent: 12, conf: 'B' }),
    onderdeel({ naam: 'Dressing', kcal_punt: 45, eiwit_g: 0.2, gram_equivalent: 15, conf: 'C' }),
    onderdeel({
      naam: 'Olijfolie', kcal_punt: 355, eiwit_g: 0, gram_equivalent: 40, conf: 'D',
      kcal_laag: 265, kcal_hoog: 490,
    }),
  ],
}

describe('aggregaat', () => {
  it('telt de onderdelen op en zet ze op het gevraagde aantal porties', () => {
    const heel = aggregaat(salade, 2)
    expect(heel.kcal).toBe(750)
    expect(heel.gram).toBe(787)

    const een = aggregaat(salade, 1)
    expect(een.kcal).toBe(375)
    expect(een.eiwit).toBeCloseTo(15.6, 5)
  })

  it('schaalt de band mee en telt hem op zijn breedst op', () => {
    /* Laag bij laag, hoog bij hoog: de aanname dat alle fouten dezelfde kant op
       wijzen. Dat is de breedste optelling die er is, en dat is hier de
       bedoeling. */
    const een = aggregaat(salade, 1)
    expect(een.kcalLaag).toBe(312)   // (59+41+41+104+72+41+265) / 2 = 311,5
    expect(een.kcalHoog).toBe(464)   // (72+50+50+127+88+50+490) / 2 = 463,5
    expect(een.kcalLaag).toBeLessThan(een.kcal)
    expect(een.kcalHoog).toBeGreaterThan(een.kcal)
  })

  it('neemt de slechtste graad en niet het gemiddelde', () => {
    /* Zes onderdelen van A tot C en één D-scheutje olie. De maaltijd is D. */
    expect(aggregaat(salade, 2).conf).toBe('D')
  })

  it('laat een trede vallen zodra er verdeeld wordt', () => {
    const gewogen: Maaltijd = {
      ...salade, porties: 2,
      regels: salade.regels.map((r) => ({ ...r, conf: 'A' as Graad })),
    }
    /* Alles afgewogen in de pan: A. Op twee borden verdeeld: geen A meer. */
    expect(aggregaat(gewogen, 2).conf).toBe('A')
    expect(aggregaat(gewogen, 1).conf).toBe('B')
    expect(aggregaat(gewogen, 1).onzeker).toContain('1 van 2 porties, niet apart gewogen')
  })

  it('zakt niet verder dan B door het verdelen', () => {
    /* Het verdelen voegt onzekerheid toe; het wist niet wat er al bekend was.
       Een C blijft dus een C. */
    const geschat: Maaltijd = {
      ...salade, regels: salade.regels.map((r) => ({ ...r, conf: 'C' as Graad })),
    }
    expect(aggregaat(geschat, 1).conf).toBe('C')
  })

  it('meldt een onderdeel zonder marge in plaats van het te verzwijgen', () => {
    const half: Maaltijd = {
      ...salade,
      regels: [
        onderdeel({ naam: 'Brood', kcal_punt: 200 }),
        onderdeel({ naam: 'Kaas', kcal_punt: 100, kcal_laag: null, kcal_hoog: null }),
      ],
      porties: 1,
    }
    const a = aggregaat(half, 1)
    expect(a.kcalLaag).toBe(280)   // 180 + 100: het punt telt aan beide kanten mee
    expect(a.onzeker.some((o) => o.includes('geen marge bekend'))).toBe(true)
  })

  it('telt een ontbrekende eiwitwaarde niet als nul weg', () => {
    const m: Maaltijd = {
      ...salade, porties: 1,
      regels: [
        onderdeel({ naam: 'Kip', kcal_punt: 200, eiwit_g: 30 }),
        onderdeel({ naam: 'Saus', kcal_punt: 100, eiwit_g: null }),
      ],
    }
    const a = aggregaat(m, 1)
    expect(a.eiwit).toBe(30)
    expect(a.onzeker.some((o) => o.includes('ondergrens'))).toBe(true)
  })

  it('geeft null als geen enkel onderdeel de waarde kent', () => {
    const m: Maaltijd = {
      ...salade, porties: 1,
      regels: [onderdeel({ naam: 'Onbekend', kcal_punt: 100, eiwit_g: null, vezel_g: null })],
    }
    expect(aggregaat(m, 1).eiwit).toBeNull()
    expect(aggregaat(m, 1).vezel).toBeNull()
  })

  it('neemt de onzekerheid van de onderdelen over, zonder dubbel', () => {
    const m: Maaltijd = {
      ...salade, porties: 1,
      regels: [
        onderdeel({ naam: 'A', kcal_punt: 100, onzekerheidsbronnen: ['olie niet gewogen'] }),
        onderdeel({ naam: 'B', kcal_punt: 100, onzekerheidsbronnen: ['olie niet gewogen'] }),
      ],
    }
    expect(aggregaat(m, 1).onzeker.filter((o) => o === 'olie niet gewogen')).toHaveLength(1)
  })
})

describe('maaltijdRegel', () => {
  it('maakt één regel met een naam waar de portie in staat', () => {
    const r = maaltijdRegel(salade, 1, '2026-08-24' as IsoDatum, 'lunch' as Moment)
    expect(r.naam).toBe('Tonijnsalade · 1 portie')
    expect(r.kcal_punt).toBe(375)
    expect(r.bron).toBe('recept')
    expect(r.recept_id).toBe('m1')
    expect(r.hoeveelheid).toBe(1)
    expect(r.eenheid).toBe('portie')
  })

  it('schrijft een halve portie als een half', () => {
    const r = maaltijdRegel(salade, 0.5, '2026-08-24' as IsoDatum, 'lunch' as Moment)
    expect(r.naam).toBe('Tonijnsalade · ½ porties')
    expect(r.kcal_punt).toBe(188)
  })

  it('zet de onzekerheid in de regel en niet in de voetnoot', () => {
    const r = maaltijdRegel(salade, 1, '2026-08-24' as IsoDatum, 'lunch' as Moment)
    expect(r.onzekerheidsbronnen).toContain('1 van 2 porties, niet apart gewogen')
  })
})

describe('portieNaam', () => {
  it('schrijft halven als halven', () => {
    expect(portieNaam(0.5)).toBe('½')
    expect(portieNaam(1)).toBe('1')
    expect(portieNaam(1.5)).toBe('1½')
    expect(portieNaam(2)).toBe('2')
    expect(portieNaam(0.75)).toBe('0,75')
  })
})

describe('slechtste', () => {
  it('kiest de laagste graad, en D als er niets is', () => {
    expect(slechtste(['A', 'C', 'B'])).toBe('C')
    expect(slechtste(['A'])).toBe('A')
    expect(slechtste([])).toBe('D')
  })
})

let teller = 0
function regel(naam: string, kcal: number, bron: RegelBron): Regel {
  return {
    id: 'r' + ++teller, datum: '2026-08-24' as IsoDatum, moment: 'lunch' as Moment, naam,
    hoeveelheid: 1, eenheid: 'portie', gram_equivalent: 100,
    kcal_punt: kcal, kcal_laag: kcal - 10, kcal_hoog: kcal + 10,
    eiwit_g: 10, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'B' as Graad, onzekerheidsbronnen: null, bron,
    nevo_code: 'x', dish_id: null, recept_id: null, foto_pad: null,
    ruwe_invoer: null, ai_model: null,
  }
}

describe('snapshot', () => {
  it('haalt de dag eraf en houdt de voedingswaarde', () => {
    const [uit] = snapshot([regel('Tonijn', 115, 'nevo')])
    expect(uit?.naam).toBe('Tonijn')
    expect(uit?.kcal_laag).toBe(105)
    expect(uit).not.toHaveProperty('datum')
    expect(uit).not.toHaveProperty('id')
  })

  it('neemt een regel die zelf uit een maaltijd komt niet mee', () => {
    /* Anders bewaar je een maaltijd die naar zichzelf verwijst, en verdubbelt
       hij bij de tweede keer opslaan. */
    const uit = snapshot([regel('Tonijnsalade · 1 portie', 375, 'recept'), regel('Brood', 200, 'nevo')])
    expect(uit.map((r) => r.naam)).toEqual(['Brood'])
  })

  it('laat een dagtotaal uit een import staan waar hij staat', () => {
    expect(snapshot([regel('Dagtotaal uit Yazio', 1319, 'import')])).toEqual([])
  })
})

describe('naamvoorstel', () => {
  it('stelt de eerste twee onderdelen voor, zonder de portiestaart', () => {
    expect(naamvoorstel(
      [regel('Tonijn in olie blik · portie (100 g)', 206, 'nevo'), regel('Paprika · 150 g', 45, 'nevo')],
      'lunch' as Moment,
    )).toBe('Tonijn in olie blik met Paprika')
  })
})
