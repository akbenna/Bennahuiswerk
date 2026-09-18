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
  DUW, GEEN_VOORKEUR, GeenGroepenBekend, duwtje, ietsIngesteld, mag, pasToe,
  patroonSluitUit, uitgesloten,
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

  it('valt om als een eetpatroon geen groepen kent', () => {
    /* DE BELANGRIJKSTE PROEF VAN DIT BESTAND.

       PATROON_GROEPEN is nog leeg: de echte NEVO-groepsnamen zijn hiervandaan
       niet op te vragen. Zolang dat zo is moet "geen vlees" omvallen en niet
       stilzwijgend niets doen. Een vinkje dat aanstaat en niets uitsluit is de
       ene fout die deze hele module hoort te voorkomen.

       Valt deze proef om, dan is PATROON_GROEPEN gevuld — en dan hoort dit geval
       hier weg en vervangen te worden door een proef die de echte groepen
       nakijkt. */
    expect(() => patroonSluitUit('geen-vlees')).toThrow(GeenGroepenBekend)
    expect(() => patroonSluitUit('veganistisch')).toThrow(GeenGroepenBekend)
  })

  it('valt niet om bij "alles", want daar valt niets uit te sluiten', () => {
    expect(patroonSluitUit('alles')).toEqual([])
    expect(mag(GEEN_VOORKEUR, SAUS)).toBe(true)
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
