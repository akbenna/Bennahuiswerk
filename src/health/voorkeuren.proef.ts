/**
 * DE VOORKEUREN BEWIJZEN
 *
 * Vier dingen kunnen hier stil kapotgaan, en alle vier zien er daarna uit als
 * een lijst die gewoon werkt.
 *
 * 1. Een uitsluiting die niet uitsluit. Iemand zet "geen vlees" aan, ziet het
 *    vinkje staan, en krijgt vlees voorgesteld. Dit is het ergste geval, want
 *    het vinkje is de belofte en de lijst de leugen.
 * 2. Een zachte voorkeur die hard blijkt. Als "liever niet" iets permanent
 *    onderaan zet, verdwijnt het uit beeld — dezelfde vernauwing waar bestand 28
 *    in de database over gaat, langs een andere weg binnengekomen.
 * 3. Een voorkeur die de rangschikking van de database omgooit waar hij niets
 *    zegt. Dan verlies je de verzadigingsscore als ordening en krijg je in de
 *    plaats daarvan willekeur.
 * 4. Een tegenspraak die stilzwijgend beslecht wordt.
 */
import { describe, expect, it } from 'vitest'
import {
  DUW, GEEN_VOORKEUR, GEMENGD, GROEPEN, KEUKENNAAM, KEUKENS, MAX_NIET_PRODUCT,
  duwtje, groepenOver, ietsIngesteld, laatProductToe, mag, magKeuken, magProduct,
  pasToe, uitgesloten, voorstel, weigerProduct, zetKeuken,
} from './voorkeuren'
import type { Voorkeuren } from './voorkeuren'

const v = (p: Partial<Voorkeuren>): Voorkeuren => ({ ...GEEN_VOORKEUR, ...p })

/* Groepsnamen zoals ze in bestand 28 letterlijk voorkomen, plus twee die daar
   niet in staan. Deze proef gaat over de regels en niet over de tabel, dus de
   namen zijn hier willekeurig — behalve dat ze niet verzonnen mogen lijken. */
const SAUS = 'Hartige sauzen'
const DRANK = 'Niet-alcoholische dranken'
const KRUID = 'Kruiden en specerijen'

describe('uitsluiten', () => {
  it('sluit niets uit zonder voorkeur', () => {
    expect(mag(GEEN_VOORKEUR, SAUS)).toBe(true)
    expect(uitgesloten(GEEN_VOORKEUR).size).toBe(0)
  })

  it('verwijdert wat op nooit staat', () => {
    const w = v({ nooit: [SAUS] })
    expect(mag(w, SAUS)).toBe(false)
    expect(mag(w, DRANK)).toBe(true)
  })

  it('laat iets zonder groep met rust', () => {
    /* Een merkproduct hoeft geen NEVO-groep te hebben. Dat is geen reden om het
       weg te gooien en ook geen reden om te doen alsof het uitgesloten is. */
    expect(mag(v({ nooit: [SAUS] }), null)).toBe(true)
    expect(mag(v({ nooit: [SAUS] }), undefined)).toBe(true)
  })

  it('kent alle zevenentwintig groepen van de tabel', () => {
    /* Het aantal is de vingerafdruk. Klopt het niet meer, dan is er iets aan
       nevo_foods veranderd en niet aan deze lijst — en dan hoort iemand hier te
       kijken voordat een eetpatroon stilzwijgend de verkeerde groep uitzet. */
    expect(GROEPEN).toHaveLength(27)
    expect(new Set(GROEPEN).size).toBe(27)
  })
})

describe('voorstel', () => {
  it('stelt niets voor bij "alles"', () => {
    expect(voorstel('alles')).toEqual([])
  })

  it('zet bij pescotarisch het vlees uit en de vis niet', () => {
    const uit = voorstel('pescotarisch')
    expect(uit).toContain('Vlees en gevogelte')
    expect(uit).toContain('Vleeswaren')
    expect(uit).not.toContain('Vis, schaal- en schelpdieren')
  })

  it('zet bij vegetarisch de vis er ook uit, en ei en zuivel niet', () => {
    const uit = voorstel('vegetarisch')
    expect(uit).toContain('Vis, schaal- en schelpdieren')
    expect(uit).not.toContain('Eieren')
    expect(uit).not.toContain('Kaas')
    expect(uit).not.toContain('Melk en melkproducten')
  })

  it('zet bij veganistisch ook ei, kaas en melk uit', () => {
    const uit = voorstel('veganistisch')
    for (const g of ['Eieren', 'Kaas', 'Melk en melkproducten', 'Gebak en koek']) {
      expect(uit).toContain(g)
    }
    /* En juist niet de vervangers — dat is de groep waar een veganist het van
       moet hebben. Die eruit gooien zou de lijst voor precies deze gebruiker
       het armst maken. */
    expect(uit).not.toContain('Vleesvervangers en zuivelvervangers')
    expect(uit).not.toContain('Peulvruchten')
    expect(uit).not.toContain('Noten en zaden')
  })

  it('neemt de vier gemengde groepen mee zodra er iets uitgaat', () => {
    /* Samengestelde gerechten, Soepen, Hartige snacks en Hartig broodbeleg
       bevatten allebei. Op de naam filteren is de fout uit bestand 34; ze gaan
       dus mee uit, zichtbaar, en de gebruiker haalt terug wat hij wil. */
    for (const p of ['pescotarisch', 'vegetarisch', 'veganistisch'] as const) {
      for (const g of GEMENGD) expect(voorstel(p)).toContain(g)
    }
  })

  it('noemt alleen groepen die werkelijk bestaan', () => {
    /* DE PROEF DIE DE STILLE FOUT VANGT. Een groepsnaam die net niet klopt
       sluit niets uit en valt nergens over — de vegetariër krijgt dan vlees. */
    for (const p of ['pescotarisch', 'vegetarisch', 'veganistisch'] as const) {
      for (const g of voorstel(p)) {
        expect(GROEPEN, `"${g}" staat niet in nevo_foods.groep`).toContain(g)
      }
    }
  })

  it('laat genoeg over om een lijst mee te vullen', () => {
    /* Veganistisch is het strengste patroon. Blijft daar te weinig van over,
       dan is "Wat vult het best" voor die gebruiker leeg en lijkt de app stuk. */
    const over = GROEPEN.filter((g) => !voorstel('veganistisch').includes(g))
    expect(over.length).toBeGreaterThanOrEqual(12)
    expect(over).toContain('Groente')
    expect(over).toContain('Peulvruchten')
  })
})

describe('duwtje', () => {
  it('duwt omhoog en omlaag, en verder niet', () => {
    expect(duwtje(v({ liever: [SAUS] }), SAUS)).toBe(DUW)
    expect(duwtje(v({ minder: [SAUS] }), SAUS)).toBe(-DUW)
    expect(duwtje(v({ liever: [SAUS] }), DRANK)).toBe(0)
  })

  it('kiest niet bij een tegenspraak', () => {
    /* Liever wél en liever níét op hetzelfde. De gebruiker spreekt zichzelf
       tegen; de app hoort niet te bepalen welke helft ze gelooft. */
    expect(duwtje(v({ liever: [SAUS], minder: [SAUS] }), SAUS)).toBe(0)
  })

  it('duwt niet aan iets wat er al uit is', () => {
    expect(duwtje(v({ nooit: [SAUS], liever: [SAUS] }), SAUS)).toBe(0)
  })
})

describe('pasToe', () => {
  const lijst = [
    { naam: 'a', groep: DRANK, score: 80 },
    { naam: 'b', groep: SAUS, score: 70 },
    { naam: 'c', groep: KRUID, score: 60 },
  ]

  it('verandert niets zonder voorkeur', () => {
    expect(pasToe(lijst, GEEN_VOORKEUR).map((x) => x.naam)).toEqual(['a', 'b', 'c'])
  })

  it('verwijdert het uitgeslotene en laat de rest staan', () => {
    const uit = pasToe(lijst, v({ nooit: [SAUS] }))
    expect(uit.map((x) => x.naam)).toEqual(['a', 'c'])
  })

  it('verschuift op een zachte voorkeur', () => {
    /* b staat op 70 en krijgt er twaalf bij: 82, dus boven a met 80. */
    expect(pasToe(lijst, v({ liever: [SAUS] })).map((x) => x.naam)).toEqual(['b', 'a', 'c'])
  })

  it('kan met een duwtje niets van boven naar onder halen', () => {
    /* DE GRENS DIE EEN ZACHTE VOORKEUR ZACHT HOUDT.

       a staat twintig punten boven c. Eén duwtje is twaalf, dus zelfs a omlaag
       én c omhoog tegelijk (vierentwintig verschil) mag niet meer doen dan ze
       verwisselen — en nooit a helemaal uit beeld duwen. Wat hier bewezen wordt
       is dat er niets verdwijnt: de lijst blijft even lang. */
    const uit = pasToe(lijst, v({ minder: [DRANK], liever: [KRUID] }))
    expect(uit).toHaveLength(3)
    expect(uit.map((x) => x.naam)).toEqual(['c', 'b', 'a'])
    /* En het verschil blijft eindig: met een groter gat wint de score alsnog. */
    const groterGat = [
      { naam: 'ver', groep: DRANK, score: 90 },
      { naam: 'dichtbij', groep: KRUID, score: 60 },
    ]
    expect(pasToe(groterGat, v({ minder: [DRANK], liever: [KRUID] }))[0]?.naam).toBe('ver')
  })

  it('houdt de volgorde van de database aan waar de voorkeur niets zegt', () => {
    /* Gelijke score en geen voorkeur: dan hoort de rangschikking te blijven
       zoals hij binnenkwam. Zonder deze regel wordt de volgorde willekeurig op
       precies de plek waar de database wél iets wist. */
    const gelijk = [
      { naam: 'eerst', groep: DRANK, score: 70 },
      { naam: 'tweede', groep: KRUID, score: 70 },
      { naam: 'derde', groep: SAUS, score: 70 },
    ]
    expect(pasToe(gelijk, GEEN_VOORKEUR).map((x) => x.naam))
      .toEqual(['eerst', 'tweede', 'derde'])
    /* En ook met een duwtje erbij blijft de onderlinge volgorde van de rest. */
    expect(pasToe(gelijk, v({ liever: [SAUS] })).map((x) => x.naam))
      .toEqual(['derde', 'eerst', 'tweede'])
  })

  it('laat regels zonder groep staan en zonder duwtje', () => {
    const gemengd = [
      { naam: 'merk', groep: null, score: 70 },
      { naam: 'nevo', groep: SAUS, score: 70 },
    ]
    expect(pasToe(gemengd, v({ nooit: [SAUS] })).map((x) => x.naam)).toEqual(['merk'])
    expect(pasToe(gemengd, v({ liever: [SAUS] })).map((x) => x.naam)).toEqual(['nevo', 'merk'])
  })

  it('rekent met nul waar geen score staat', () => {
    /* `kal_eiwitrijk` geeft geen score terug — die lijst gaat op dichtheid. Dan
       hoort een duwtje nog steeds te werken en niet op NaN uit te komen. */
    const zonder = [{ naam: 'a', groep: DRANK }, { naam: 'b', groep: SAUS }]
    expect(pasToe(zonder, v({ liever: [SAUS] })).map((x) => x.naam)).toEqual(['b', 'a'])
  })
})

describe('ietsIngesteld', () => {
  it('zwijgt als er niets staat', () => {
    expect(ietsIngesteld(GEEN_VOORKEUR)).toBe(false)
  })

  it('merkt elk van de vier op', () => {
    expect(ietsIngesteld(v({ patroon: 'veganistisch' }))).toBe(true)
    expect(ietsIngesteld(v({ nooit: [SAUS] }))).toBe(true)
    expect(ietsIngesteld(v({ liever: [SAUS] }))).toBe(true)
    expect(ietsIngesteld(v({ minder: [SAUS] }))).toBe(true)
  })
})

describe('groepenOver', () => {
  it('telt de zevenentwintig af', () => {
    expect(groepenOver(GEEN_VOORKEUR)).toBe(27)
    expect(groepenOver(v({ nooit: ['Groente', 'Fruit'] }))).toBe(25)
  })

  it('telt een groep die niet bestaat niet mee', () => {
    /* Anders zou een typefout in `nooit` het getal omlaag brengen terwijl er
       niets uitgesloten werd — een waarschuwing die de verkeerde kant op wijst. */
    expect(groepenOver(v({ nooit: ['Bestaat Niet'] }))).toBe(27)
  })
})

/* ==========================================================================
   DE TWEE FIJNERE KNOPPEN
   ========================================================================== */

describe('de keukens', () => {
  it('kent er precies zes, en dezelfde als de database', () => {
    /* De CHECK op `cultural_dishes.cuisine` laat deze zes toe. Komt er daar een
       bij en hier niet, dan filtert het vel een keuken die niemand kan uitzetten
       — en dat merkt niemand, want er komt geen fout van. */
    expect([...KEUKENS].sort()).toEqual(
      ['marokkaans', 'nederlands', 'overig', 'surinaams', 'syrisch', 'turks'])
    for (const k of KEUKENS) expect(KEUKENNAAM[k].length).toBeGreaterThan(2)
  })

  it('laat alles door zolang er niets uitstaat', () => {
    for (const k of KEUKENS) expect(magKeuken(GEEN_VOORKEUR, k)).toBe(true)
    /* Een gerecht zonder keuken hoort niet stilzwijgend te verdwijnen. */
    expect(magKeuken(GEEN_VOORKEUR, null)).toBe(true)
  })

  it('houdt tegen wat je uitzet, en verder niets', () => {
    const v = zetKeuken(GEEN_VOORKEUR, 'syrisch', false)
    expect(magKeuken(v, 'syrisch')).toBe(false)
    expect(magKeuken(v, 'surinaams')).toBe(true)
    /* En weer aan. */
    expect(magKeuken(zetKeuken(v, 'syrisch', true), 'syrisch')).toBe(true)
  })

  it('zet een keuken niet twee keer uit', () => {
    let v = zetKeuken(GEEN_VOORKEUR, 'turks', false)
    v = zetKeuken(v, 'turks', false)
    expect(v.keukens).toEqual(['turks'])
  })

  it('werkt op een profiel van vóór dit veld', () => {
    /* Wie de app al gebruikte heeft `keukens` niet in zijn instellingen staan.
       Dat hoort "niets uitgezet" te betekenen en geen storing. */
    const oud = { patroon: 'alles', nooit: [], liever: [], minder: [] } as Voorkeuren
    expect(magKeuken(oud, 'turks')).toBe(true)
    expect(ietsIngesteld(oud)).toBe(false)
  })
})

describe('een los product weigeren', () => {
  it('weigert op code en niet op naam', () => {
    /* Op naam zoeken is precies de fout waardoor bestand 34 bijna een gedroogde
       tomaat van 258 kcal voor een verse aanzag. */
    const v = weigerProduct(GEEN_VOORKEUR, '2731')
    expect(magProduct(v, '2731')).toBe(false)
    expect(magProduct(v, '2730')).toBe(true)
  })

  it('laat een product zonder code met rust', () => {
    /* Een merkproduct draagt geen NEVO-code. Dat hoort door te komen en niet
       stilzwijgend te verdwijnen. */
    expect(magProduct(weigerProduct(GEEN_VOORKEUR, '2731'), null)).toBe(true)
    expect(magProduct(GEEN_VOORKEUR, '')).toBe(true)
  })

  it('groeit niet van twee keer hetzelfde wegklikken', () => {
    let v = weigerProduct(GEEN_VOORKEUR, '2731')
    v = weigerProduct(v, '2731')
    expect(v.nietProduct).toEqual(['2731'])
  })

  it('laat weer toe wat je terugzet', () => {
    const v = weigerProduct(weigerProduct(GEEN_VOORKEUR, 'a'), 'b')
    expect(laatProductToe(v, 'a').nietProduct).toEqual(['b'])
    /* Iets terugzetten dat er niet staat verandert niets. */
    expect(laatProductToe(v, 'z').nietProduct).toEqual(['a', 'b'])
  })

  it('loopt niet onbegrensd vol, en vergeet de oudste', () => {
    /* Dit staat als jsonb in `instellingen` en gaat bij elke profielwijziging
       mee over de lijn. De grens moet er dus zijn, en hij moet doorschuiven en
       niet weigeren: een knop die stilletjes niets doet is erger. */
    let v = GEEN_VOORKEUR
    for (let i = 0; i < MAX_NIET_PRODUCT + 5; i++) v = weigerProduct(v, `c${i}`)
    expect(v.nietProduct).toHaveLength(MAX_NIET_PRODUCT)
    /* De laatste staat erin, de eerste vijf zijn eraf. */
    expect(magProduct(v, `c${MAX_NIET_PRODUCT + 4}`)).toBe(false)
    expect(magProduct(v, 'c0')).toBe(true)
  })

  it('telt mee voor "is er iets ingesteld"', () => {
    expect(ietsIngesteld(GEEN_VOORKEUR)).toBe(false)
    expect(ietsIngesteld(weigerProduct(GEEN_VOORKEUR, '2731'))).toBe(true)
    expect(ietsIngesteld(zetKeuken(GEEN_VOORKEUR, 'turks', false))).toBe(true)
  })
})
