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
import {
  aandelen, aggregaat, duiding, hefbomen, maaltijdRegel, naamvoorstel,
  portieNaam, slechtste, snapshot, varianten,
} from './maaltijd'
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
  id: 'm1', naam: 'Tonijnsalade', toelichting: null, porties: 2, favoriet: true,
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

/* ------------------------------------------------------------------------- */
/*  DE DUIDING                                                               */
/*                                                                           */
/*  Dit blok is bewust opgebouwd uit de getallen die 08-de-twee-favorieten    */
/*  daadwerkelijk in de database zet. Verandert daar een ingrediënt, dan      */
/*  hoort deze proef om te vallen: hij is niet alleen een test van de         */
/*  rekenregels maar ook een ijkpunt tegen wat er in productie staat.         */
/* ------------------------------------------------------------------------- */

const echt: Maaltijd = {
  id: 'm2', naam: 'Tonijnsalade', toelichting: null, porties: 2, favoriet: true,
  regels: [
    onderdeel({ naam: 'Tomaat', kcal_punt: 79, kcal_laag: 62, kcal_hoog: 97, eiwit_g: 2.5, vet_g: 1.8, koolhydraat_g: 10.8, vezel_g: 4.3, gram_equivalent: 360, conf: 'C' }),
    onderdeel({ naam: 'Ui', kcal_punt: 41, kcal_laag: 30, kcal_hoog: 56, eiwit_g: 1.4, vet_g: 0.2, koolhydraat_g: 6.9, vezel_g: 3.0, gram_equivalent: 110, conf: 'C' }),
    onderdeel({ naam: 'Paprika', kcal_punt: 38, kcal_laag: 28, kcal_hoog: 48, eiwit_g: 1.2, vet_g: 0.2, koolhydraat_g: 6.5, vezel_g: 2.7, gram_equivalent: 150, conf: 'C' }),
    onderdeel({ naam: 'Tonijn uit blik, uitgelekt', kcal_punt: 109, kcal_laag: 104, kcal_hoog: 120, eiwit_g: 24.9, vet_g: 1.0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 100, conf: 'B' }),
    onderdeel({ naam: 'Mayonaise', kcal_punt: 80, kcal_laag: 53, kcal_hoog: 133, eiwit_g: 0.1, vet_g: 8.6, koolhydraat_g: 0.4, vezel_g: 0, gram_equivalent: 12, conf: 'C' }),
    onderdeel({ naam: 'Dressing honing/mosterd', kcal_punt: 45, kcal_laag: 30, kcal_hoog: 75, eiwit_g: 0.2, vet_g: 3.9, koolhydraat_g: 2.3, vezel_g: 0, gram_equivalent: 15, conf: 'C' }),
    onderdeel({ naam: 'Olijfolie', kcal_punt: 360, kcal_laag: 270, kcal_hoog: 630, eiwit_g: 0, vet_g: 40, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 40, conf: 'D' }),
  ],
}

describe('duiding', () => {
  it('rekent de drie maten die iets zeggen', () => {
    const d = duiding(echt)
    expect(d.kcal).toBe(752)
    expect(d.gram).toBe(787)
    expect(d.dichtheid).toBe(0.96)      // onder de 1,0: dit vult
    expect(d.eiwitPer100).toBe(4.0)     // en dít is waarom het toch te weinig is
    expect(d.vezel).toBe(10)
    /* De band hoort er ook bij te kloppen, en die is breed: 577 tot 1159 voor de
       schaal. Bijna al die breedte komt uit één regel — de olie loopt van 270
       tot 630 kcal. */
    const a = aggregaat(echt, echt.porties)
    expect(a.kcalLaag).toBe(577)
    expect(a.kcalHoog).toBe(1159)
  })

  it('geeft de energieprocenten zonder ze naar 100 te praten', () => {
    const d = duiding(echt)
    expect(d.ePct.eiwit).toBe(16.1)
    expect(d.ePct.vet).toBe(66.7)
    expect(d.ePct.koolhydraat).toBe(14.3)
    /* Samen 97,1. Dat gat is de afronding per onderdeel plus de energie uit
       vezels, en het hoort zichtbaar te blijven: het is informatie over hoe
       grof de invoer is en niet iets om weg te normaliseren. */
    const som = (d.ePct.eiwit ?? 0) + (d.ePct.vet ?? 0) + (d.ePct.koolhydraat ?? 0)
    expect(som).toBeGreaterThan(95)
    expect(som).toBeLessThan(100)
  })

  it('is onafhankelijk van hoeveel je opschept', () => {
    /* Verhoudingen veranderen niet als je de schaal anders verdeelt. */
    expect(duiding({ ...echt, porties: 4 }).eiwitPer100).toBe(duiding(echt).eiwitPer100)
    expect(duiding({ ...echt, porties: 4 }).dichtheid).toBe(duiding(echt).dichtheid)
  })

  it('zwijgt over dichtheid als de grammen ontbreken', () => {
    const zonder = { ...echt, regels: echt.regels.map((r) => ({ ...r, gram_equivalent: null })) }
    expect(duiding(zonder).dichtheid).toBeNull()
  })
})

describe('hefbomen', () => {
  it('wijst de olie aan als wat je kunt halveren', () => {
    const h = hefbomen(echt)
    expect(h.grootste?.naam).toBe('Olijfolie')
    expect(h.grootste?.deel).toBeCloseTo(0.479, 3)
  })

  it('wijst de tonijn aan als wat je kunt verdubbelen', () => {
    expect(hefbomen(echt).eiwitrijkste?.naam).toBe('Tonijn uit blik, uitgelekt')
  })

  it('noemt niets om te halveren als niets groot genoeg is', () => {
    const vlak: Maaltijd = {
      ...echt, porties: 1,
      regels: Array.from({ length: 5 }, (_, i) =>
        onderdeel({ naam: 'deel ' + i, kcal_punt: 100, eiwit_g: 10 })),
    }
    expect(hefbomen(vlak).grootste).toBeNull()
  })

  it('noemt niets om te verdubbelen als alles even eiwitrijk is', () => {
    /* Verdubbelen werkt alleen als het onderdeel de dichtheid omhoog trekt.
       Ligt alles op het gemiddelde, dan levert elke verdubbeling precies
       hetzelfde getal op — en dan hoort de app te zwijgen in plaats van een
       knop te tonen die niets doet. */
    const vlak: Maaltijd = {
      ...echt, porties: 1,
      regels: Array.from({ length: 3 }, (_, i) =>
        onderdeel({ naam: 'deel ' + i, kcal_punt: 100, eiwit_g: 10 })),
    }
    expect(hefbomen(vlak).eiwitrijkste).toBeNull()
    expect(hefbomen(vlak).grootste?.naam).toBe('deel 0')   // 33% is wel groot genoeg
  })
})

describe('varianten', () => {
  it('zet de vier uitkomsten naast elkaar', () => {
    const v = varianten(echt)
    expect(v.map((x) => x.label)).toEqual([
      'zoals je hem maakt',
      'Olijfolie halveren',
      'Tonijn uit blik, uitgelekt verdubbelen',
      'allebei',
    ])
    expect(v.map((x) => x.kcal)).toEqual([752, 572, 861, 681])
    expect(v.map((x) => x.perPortie)).toEqual([376, 286, 431, 341])
    expect(v.map((x) => x.eiwitPer100)).toEqual([4.0, 5.3, 6.4, 8.1])
  })

  it('laat zien dat de laatste rij minder kost dan de eerste', () => {
    /* Dit is de hele bevinding in twee getallen: voor mínder energie het dubbele
       aan eiwit per calorie. Gaat die verhouding ooit de verkeerde kant op, dan
       is er iets stuk in de rekenregels en niet in de salade. */
    const v = varianten(echt)
    const nu = v[0]
    const allebei = v[3]
    expect(allebei?.kcal).toBeLessThan(nu?.kcal ?? 0)
    expect(allebei?.eiwitPer100 ?? 0).toBeGreaterThan((nu?.eiwitPer100 ?? 0) * 2)
  })

  it('zegt niets als er niets te draaien valt', () => {
    const vlak: Maaltijd = {
      ...echt, porties: 1,
      regels: Array.from({ length: 5 }, (_, i) =>
        onderdeel({ naam: 'deel ' + i, kcal_punt: 100, eiwit_g: 10 })),
    }
    expect(varianten(vlak)).toEqual([])
  })
})

describe('aandelen', () => {
  it('zet het duurste onderdeel bovenaan', () => {
    const a = aandelen(echt)
    expect(a[0]?.naam).toBe('Olijfolie')
    expect(a[0]?.kcal).toBe(360)
    /* De hele schaal groente plus het blik tonijn samen is minder dan de olie
       alleen. Dat is de zin waar dit gerecht om draait. */
    const groenteEnVis = a.filter((x) => x.naam !== 'Olijfolie' && x.naam !== 'Mayonaise'
      && x.naam !== 'Dressing honing/mosterd').reduce((n, x) => n + x.kcal, 0)
    expect(groenteEnVis).toBeLessThan(a[0]?.kcal ?? 0)
  })
})

/* ------------------------------------------------------------------------- */
/*  HET TWEEDE IJKPUNT                                                       */
/*                                                                           */
/*  De salade laat de hefbomen zien in het makkelijke geval: de grootste post */
/*  is het vet. Dit gerecht doet dat niet — daar is het brood de grootste     */
/*  post en het vet een theelepel. Zonder dit geval zou een rekenregel die    */
/*  simpelweg "het vet" aanwijst er even goed doorheen komen.                 */
/*                                                                           */
/*  De getallen komen uit 10-stokbroodtonijn.sql zoals die in de database     */
/*  staan; verandert daar een ingrediënt, dan hoort deze proef om te vallen.  */
/* ------------------------------------------------------------------------- */

const brood: Maaltijd = {
  id: 'm3', naam: 'Mijn stokbroodtonijn', toelichting: null, porties: 1, favoriet: true,
  regels: [
    onderdeel({ naam: 'Stokbrood wit', kcal_punt: 338, kcal_laag: 270, kcal_hoog: 432, eiwit_g: 12.1, vet_g: 1.5, koolhydraat_g: 67.0, vezel_g: 3.5, gram_equivalent: 125, conf: 'C' }),
    onderdeel({ naam: 'Tonijn uit blik, uitgelekt', kcal_punt: 109, kcal_laag: 104, kcal_hoog: 120, eiwit_g: 24.9, vet_g: 1.0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 100, conf: 'B' }),
    onderdeel({ naam: 'Tomaat', kcal_punt: 26, kcal_laag: 20, kcal_hoog: 35, eiwit_g: 0.8, vet_g: 0.6, koolhydraat_g: 3.6, vezel_g: 1.4, gram_equivalent: 120, conf: 'C' }),
    onderdeel({ naam: 'Paprika', kcal_punt: 38, kcal_laag: 28, kcal_hoog: 48, eiwit_g: 1.2, vet_g: 0.2, koolhydraat_g: 6.5, vezel_g: 2.7, gram_equivalent: 150, conf: 'C' }),
    onderdeel({ naam: 'Kaas Goudse 48+ jong', kcal_punt: 73, kcal_laag: 55, kcal_hoog: 109, eiwit_g: 4.6, vet_g: 5.9, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 20, conf: 'C' }),
    onderdeel({ naam: 'Olijfolie erover', kcal_punt: 45, kcal_laag: 27, kcal_hoog: 90, eiwit_g: 0, vet_g: 5.0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 5, conf: 'C' }),
    onderdeel({ naam: 'Zout', kcal_punt: 0, kcal_laag: 0, kcal_hoog: 0, eiwit_g: 0, vet_g: 0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 1, conf: 'A' }),
  ],
}

describe('het stokbroodtonijn als tweede ijkpunt', () => {
  it('telt op tot wat er in de database staat', () => {
    const a = aggregaat(brood, 1)
    expect(a.kcal).toBe(629)
    expect(a.kcalLaag).toBe(504)
    expect(a.kcalHoog).toBe(834)
    expect(a.eiwit).toBe(43.6)
    expect(a.gram).toBe(521)
  })

  it('is een C en niet een D, omdat de olie hier een theelepel is', () => {
    /* Dezelfde onzekerheid over dezelfde handeling — een lepel olie die niet
       gewogen wordt — maar hier is het gevolg 63 kcal en bij de salade 360.
       Dat verschil hoort de graad uit te drukken, en dat doet hij. */
    expect(aggregaat(brood, 1).conf).toBe('C')
    expect(aggregaat(echt, echt.porties).conf).toBe('D')
  })

  it('wijst het brood aan als grootste post, en niet het vet', () => {
    /* Dit is waarom dit geval erbij staat. Bij de salade is de grootste post
       toevallig ook het vet; een regel die simpelweg "het vet" aanwijst zou
       daar niet op stukgaan en hier wel. */
    const h = hefbomen(brood)
    expect(h.grootste?.naam).toBe('Stokbrood wit')
    expect(h.eiwitrijkste?.naam).toBe('Tonijn uit blik, uitgelekt')
  })

  it('is de eiwitrijkste van de drie', () => {
    const d = duiding(brood)
    expect(d.eiwitPer100).toBe(6.9)
    expect(d.dichtheid).toBe(1.21)
    /* Ruim anderhalf keer zo eiwitdicht als de salade. Dat is de hele reden dat
       dit gerecht er is, en het is geen mening maar een deling. */
    expect(d.eiwitPer100 ?? 0).toBeGreaterThan((duiding(echt).eiwitPer100 ?? 0) * 1.5)
  })

  it('laat zien wat de twee knoppen hier doen', () => {
    const v = varianten(brood)
    expect(v.map((x) => x.label)).toEqual([
      'zoals je hem maakt',
      'Stokbrood wit halveren',
      'Tonijn uit blik, uitgelekt verdubbelen',
      'allebei',
    ])
    expect(v.map((x) => x.kcal)).toEqual([629, 460, 738, 569])
    /* Elke knop hoort de eiwitdichtheid omhoog te brengen, en allebei het meest.
       Gaat die volgorde ooit door elkaar, dan klopt er iets niet in de
       rekenregels en niet in het broodje. */
    const dicht = v.map((x) => x.eiwitPer100 ?? 0)
    expect(dicht[1]).toBeGreaterThan(dicht[0] ?? 0)
    expect(dicht[2]).toBeGreaterThan(dicht[0] ?? 0)
    expect(dicht[3]).toBeGreaterThan(Math.max(dicht[1] ?? 0, dicht[2] ?? 0))
    expect(dicht[3]).toBeGreaterThan(10)
  })
})

/* ------------------------------------------------------------------------- */
/*  DE VASTGELEGDE VARIANT                                                    */
/*                                                                            */
/*  "Tonijnsalade licht" is de onderste rij van de variantentabel, opgeslagen  */
/*  als gerecht. Dat betekent dat er nu twee plekken zijn waar hetzelfde       */
/*  getal vandaan komt — de tabel in het scherm en de rij in de database — en  */
/*  twee plekken met hetzelfde getal lopen uiteen zodra iemand er één          */
/*  aanraakt. Deze proef is het touwtje ertussen.                             */
/* ------------------------------------------------------------------------- */

const licht: Maaltijd = {
  id: 'm4', naam: 'Tonijnsalade licht', toelichting: null, porties: 2, favoriet: true,
  regels: [
    onderdeel({ naam: 'Tomaat', kcal_punt: 79, kcal_laag: 62, kcal_hoog: 97, eiwit_g: 2.5, vet_g: 1.8, koolhydraat_g: 10.8, vezel_g: 4.3, gram_equivalent: 360, conf: 'C' }),
    onderdeel({ naam: 'Ui', kcal_punt: 41, kcal_laag: 30, kcal_hoog: 56, eiwit_g: 1.4, vet_g: 0.2, koolhydraat_g: 6.9, vezel_g: 3.0, gram_equivalent: 110, conf: 'C' }),
    onderdeel({ naam: 'Paprika', kcal_punt: 38, kcal_laag: 28, kcal_hoog: 48, eiwit_g: 1.2, vet_g: 0.2, koolhydraat_g: 6.5, vezel_g: 2.7, gram_equivalent: 150, conf: 'C' }),
    onderdeel({ naam: 'Tonijn uit blik, uitgelekt', kcal_punt: 218, kcal_laag: 207, kcal_hoog: 240, eiwit_g: 49.8, vet_g: 2.0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 200, conf: 'B' }),
    onderdeel({ naam: 'Mayonaise', kcal_punt: 80, kcal_laag: 53, kcal_hoog: 133, eiwit_g: 0.1, vet_g: 8.6, koolhydraat_g: 0.4, vezel_g: 0, gram_equivalent: 12, conf: 'C' }),
    onderdeel({ naam: 'Dressing honing/mosterd', kcal_punt: 45, kcal_laag: 30, kcal_hoog: 75, eiwit_g: 0.2, vet_g: 3.9, koolhydraat_g: 2.3, vezel_g: 0, gram_equivalent: 15, conf: 'C' }),
    onderdeel({ naam: 'Olijfolie, afgemeten', kcal_punt: 180, kcal_laag: 135, kcal_hoog: 225, eiwit_g: 0, vet_g: 20.0, koolhydraat_g: 0, vezel_g: 0, gram_equivalent: 20, conf: 'C' }),
  ],
}

describe('Tonijnsalade licht', () => {
  it('is exact de vierde rij van de variantentabel', () => {
    /* Het touwtje. Verandert er een ingrediënt in het recept zonder dat het
       origineel meeverandert — of andersom — dan valt dit om. */
    const vier = varianten(echt)[3]
    expect(vier?.label).toBe('allebei')
    expect(aggregaat(licht, licht.porties).kcal).toBe(vier?.kcal)
    expect(aggregaat(licht, 1).kcal).toBe(vier?.perPortie)
    expect(aggregaat(licht, 1).eiwit).toBe(vier?.eiwitPortie)
    expect(duiding(licht).eiwitPer100).toBe(vier?.eiwitPer100)
  })

  it('heeft een smallere band dan de tabel voorspelt, en dat is het punt', () => {
    /* varianten() halveert de band van de olie mee en houdt daarmee de
       onzekerheid van een slordige gieting. Dit gerecht legt vast dat je de
       lepel afmeet, en dan is de marge kleiner dan de helft van de oude. Wie
       dat gelijk zou trekken, zou de winst van het afmeten weggooien. */
    const a = aggregaat(licht, licht.porties)
    expect(a.kcalHoog).toBe(874)
    expect(a.kcalHoog ?? 0).toBeLessThan(964)      // wat varianten() zou geven
    expect(a.conf).toBe('C')
  })

  it('haalt bijna twee keer zoveel eiwit uit minder energie dan het origineel', () => {
    const oud = aggregaat(echt, 1)
    const nieuw = aggregaat(licht, 1)
    expect(nieuw.kcal).toBeLessThan(oud.kcal)
    expect(nieuw.eiwit ?? 0).toBeGreaterThan((oud.eiwit ?? 0) * 1.8)
    /* En de band is smaller geworden, niet alleen het punt. Dat tweede is de
       grotere winst: het model heeft een smalle band nodig om iets te durven
       zeggen. */
    const breedOud = (oud.kcalHoog ?? 0) - (oud.kcalLaag ?? 0)
    const breedNieuw = (nieuw.kcalHoog ?? 0) - (nieuw.kcalLaag ?? 0)
    expect(breedNieuw).toBeLessThan(breedOud / 1.5)
  })
})
