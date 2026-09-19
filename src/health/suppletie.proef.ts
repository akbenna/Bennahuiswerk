/**
 * DE SUPPLETIE BEWIJZEN
 *
 * Dit is het enige deel van de app dat een gezondheidsuitspraak doet zonder dat
 * er een meting onder ligt — de tabel heeft geen micronutriënten. Wat hier stil
 * misgaat is dus erger dan elders, want er is geen getal dat het tegenspreekt.
 *
 * Vier dingen die kapot kunnen zonder een fout te geven:
 *
 * 1. Een advies dat verschijnt terwijl er niets gelogd is. Dan is het een
 *    uitspraak over je invoergedrag die zich voordoet als een uitspraak over je
 *    voeding — de ergste soort, want hij klinkt als een meting.
 * 2. B12 die van "nodig" naar "overwegen" zakt. Dat is het enige advies hier
 *    waar geen afweging bij hoort, en het naast "kan geen kwaad" zetten maakt er
 *    een suggestie van.
 * 3. Een advies zonder grond. Dan kun je het niet narekenen en moet je het
 *    geloven, en dat is precies wat deze app nergens vraagt.
 * 4. Een lege lijst die "er is niets aan de hand" lijkt te zeggen terwijl hij
 *    "ik weet het niet" bedoelt.
 */
import { describe, expect, it } from 'vitest'
import {
  GENOEG_DAGEN, VENSTER_DAGEN, adviezen, genoegGelogd, nagekeken, teWeinigGelogd,
} from './suppletie'
import type { Suppletievraag } from './suppletie'
import { GEEN_VOORKEUR } from './voorkeuren'
import type { Voorkeuren } from './voorkeuren'

const VIS = 'Vis, schaal- en schelpdieren'
const ALLE_HOEKEN = [
  VIS, 'Vlees en gevogelte', 'Vleeswaren', 'Melk en melkproducten', 'Kaas',
  'Groente', 'Fruit', 'Brood',
]

interface Deelvraag {
  voorkeuren?: Partial<Voorkeuren>
  gelogdeGroepen?: readonly string[]
  dagenGelogd?: number
}

const vraag = (p: Deelvraag = {}): Suppletievraag => ({
  voorkeuren: { ...GEEN_VOORKEUR, ...p.voorkeuren },
  gelogdeGroepen: p.gelogdeGroepen ?? ALLE_HOEKEN,
  dagenGelogd: p.dagenGelogd ?? 28,
})

describe('genoeg gelogd', () => {
  it('zwijgt onder de drempel, ook als er hoeken ontbreken', () => {
    /* DE BELANGRIJKSTE PROEF VAN DIT BESTAND.

       Vier dagen gelogd en geen vis erbij: dat betekent dat je vier dagen lang
       geen vis logde, en dat zegt niets over je voeding. Een advies hier zou
       een uitspraak over je invoergedrag zijn die klinkt als een meting. */
    const stil = vraag({ gelogdeGroepen: ['Brood'], dagenGelogd: 4 })
    expect(genoegGelogd(stil)).toBe(false)
    expect(adviezen(stil)).toEqual([])
  })

  it('spreekt vanaf de drempel', () => {
    const wel = vraag({ gelogdeGroepen: ['Brood'], dagenGelogd: GENOEG_DAGEN })
    expect(genoegGelogd(wel)).toBe(true)
    expect(adviezen(wel).length).toBeGreaterThan(0)
  })

  it('zegt waarom er niets staat als het aan de invoer ligt', () => {
    /* Een lege kaart zonder uitleg leest als "er is niets aan de hand", en dat
       is maar één van de twee mogelijkheden. */
    const stil = vraag({ gelogdeGroepen: ['Brood'], dagenGelogd: 4 })
    expect(teWeinigGelogd(stil)).toMatch(/4 van de 28 dagen/)
    /* En zwijgt zodra er genoeg gelogd is. */
    expect(teWeinigGelogd(vraag())).toBeNull()
    /* Maar niet zodra er wél adviezen zijn: wie veganistisch eet en drie dagen
       logt ziet B12 staan en hoort niets over vis — en dan hoort hij te lezen
       dat de app dat niet kan zien, en niet te denken dat vis in orde is. */
    const weinig = vraag({ voorkeuren: { patroon: 'veganistisch' }, dagenGelogd: 3 })
    expect(adviezen(weinig).length).toBeGreaterThan(0)
    expect(teWeinigGelogd(weinig)).toMatch(/3 van de 28 dagen/)
  })

  it('laat een uitgezette groep wél tellen onder de drempel', () => {
    /* Een vinkje is er ook op een dag dat je niets invulde. Dat is het verschil
       tussen gezegd en gezien, en het hoort hier zichtbaar te zijn. */
    const uit = vraag({
      voorkeuren: { nooit: [VIS] }, gelogdeGroepen: ALLE_HOEKEN, dagenGelogd: 2,
    })
    expect(adviezen(uit).map((a) => a.id)).toContain('omega3')
  })
})

describe('B12', () => {
  it('is nodig bij veganistisch, en staat bovenaan', () => {
    const uit = adviezen(vraag({ voorkeuren: { patroon: 'veganistisch' } }))
    const b12 = uit.find((a) => a.id === 'b12')
    expect(b12?.zwaarte).toBe('nodig')
    expect(uit[0]?.id).toBe('b12')
  })

  it('komt niet bij vegetarisch, want daar is ei en zuivel', () => {
    const uit = adviezen(vraag({ voorkeuren: { patroon: 'vegetarisch' } }))
    expect(uit.map((a) => a.id)).not.toContain('b12')
  })

  it('is het enige dat nodig is', () => {
    /* Als er ooit een tweede "nodig" bij komt, hoort iemand daar bewust over na
       te denken en niet per ongeluk in te rollen. */
    const alles = adviezen(vraag({
      voorkeuren: { patroon: 'veganistisch', nooit: [VIS, 'Melk en melkproducten', 'Kaas'] },
      gelogdeGroepen: [],
    }))
    expect(alles.filter((a) => a.zwaarte === 'nodig').map((a) => a.id)).toEqual(['b12'])
    expect(alles.length).toBeGreaterThan(1)
  })
})

describe('de adviezen zelf', () => {
  it('zwijgt bij iemand die alles eet en alles logt', () => {
    expect(adviezen(vraag())).toEqual([])
  })

  it('noemt omega-3 als er geen vis in beeld is', () => {
    const zonderVis = vraag({ gelogdeGroepen: ALLE_HOEKEN.filter((g) => g !== VIS) })
    const a = adviezen(zonderVis).find((x) => x.id === 'omega3')
    expect(a?.zwaarte).toBe('overwegen')
    expect(a?.grond).toMatch(new RegExp(`${VENSTER_DAGEN} dagen niets uit`))
  })

  it('noemt calcium pas als álle zuivel weg is', () => {
    /* Kaas zonder melk is geen calciumprobleem. Eén van de twee is genoeg. */
    const kaasWel = vraag({
      gelogdeGroepen: ALLE_HOEKEN.filter((g) => g !== 'Melk en melkproducten'),
    })
    expect(adviezen(kaasWel).map((a) => a.id)).not.toContain('calcium')
    const geenZuivel = vraag({
      gelogdeGroepen: ALLE_HOEKEN.filter((g) => g !== 'Melk en melkproducten' && g !== 'Kaas'),
    })
    expect(adviezen(geenZuivel).map((a) => a.id)).toContain('calcium')
  })

  it('noemt ijzer bij vegetarisch zonder naar de log te kijken', () => {
    const uit = adviezen(vraag({ voorkeuren: { patroon: 'vegetarisch' } }))
    const ijzer = uit.find((a) => a.id === 'ijzer')
    expect(ijzer?.grond).toBe('Je gaf aan geen vlees te eten.')
  })

  it('zet wat nodig is boven wat te overwegen is', () => {
    const uit = adviezen(vraag({
      voorkeuren: { patroon: 'veganistisch' }, gelogdeGroepen: [],
    }))
    const eerste = uit.findIndex((a) => a.zwaarte === 'overwegen')
    const laatsteNodig = uit.map((a) => a.zwaarte).lastIndexOf('nodig')
    expect(laatsteNodig).toBeLessThan(eerste)
  })

  it('geeft elk advies een grond, een reden en een bron', () => {
    /* Zonder grond kun je het niet narekenen en moet je het geloven. Dat is wat
       deze app nergens anders vraagt en hier dus ook niet. */
    const uit = adviezen(vraag({
      voorkeuren: { patroon: 'veganistisch' }, gelogdeGroepen: [],
    }))
    expect(uit.length).toBeGreaterThan(2)
    for (const a of uit) {
      expect(a.grond.length, `${a.id} heeft geen grond`).toBeGreaterThan(10)
      expect(a.reden.length, `${a.id} heeft geen reden`).toBeGreaterThan(10)
      expect(a.bron.length, `${a.id} heeft geen bron`).toBeGreaterThan(10)
      expect(a.id).not.toBe('')
    }
  })

  it('geeft geen advies dat nergens over gaat', () => {
    /* Geen multivitamine, geen magnesium, geen "ondersteunt de weerstand". Wat
       er niet in zit is net zo goed ontwerp als wat er wel in zit. */
    const alles = adviezen(vraag({
      voorkeuren: { patroon: 'veganistisch', nooit: [VIS, 'Melk en melkproducten', 'Kaas'] },
      gelogdeGroepen: [],
    }))
    expect(alles.map((a) => a.id).sort()).toEqual(['b12', 'calcium', 'ijzer', 'omega3'])
  })
})

describe('wat er nagekeken is als er niets uit kwam', () => {
  /* De aanleiding stond niet in de code maar in de vraag die erover gesteld
     werd: "Wat ontbreekt is leeg?" Een lege lijst met alleen een voorbehoud
     eronder is niet te onderscheiden van een kapotte lijst. */
  it('noemt alle vier de regels, ook als er niets gevonden is', () => {
    const v = vraag({ dagenGelogd: 20, gelogdeGroepen: ALLE_HOEKEN })
    expect(adviezen(v)).toEqual([])
    expect(nagekeken(v).map((r) => r.wat))
      .toEqual(['Vitamine B12', 'IJzer', 'Omega-3', 'Calcium'])
  })

  /* Elke regel moet zijn éigen reden geven. Zouden ze allemaal hetzelfde
     zeggen, dan is de lijst een sierrand en geen afleiding. */
  it('en geeft per regel wat hij zag', () => {
    const v = vraag({ dagenGelogd: 20, gelogdeGroepen: ALLE_HOEKEN })
    for (const r of nagekeken(v)) expect(r.stand, r.wat).toBeTruthy()
    expect(nagekeken(v).find((r) => r.wat === 'Omega-3')?.stand).toMatch(/in je log/)
  })

  /* Een hoek die je hebt uitgezet is iets anders dan een hoek die je niet logde,
     en allebei zijn iets anders dan te weinig gegevens. Alle drie moeten
     verschillend lezen — anders zegt de regel niets. */
  it('onderscheidt uitgezet, niet gelogd en te weinig gelogd', () => {
    const uitgezet = nagekeken(vraag({
      dagenGelogd: 20, gelogdeGroepen: ALLE_HOEKEN,
      voorkeuren: { nooit: [VIS] },
    })).find((r) => r.wat === 'Omega-3')?.stand
    const nietGelogd = nagekeken(vraag({
      dagenGelogd: 20, gelogdeGroepen: ALLE_HOEKEN.filter((g) => !/^Vis/.test(g)),
    })).find((r) => r.wat === 'Omega-3')?.stand
    const teWeinig = nagekeken(vraag({ dagenGelogd: 3, gelogdeGroepen: [] }))
      .find((r) => r.wat === 'Omega-3')?.stand
    expect(uitgezet).toMatch(/uitgezet/)
    expect(nietGelogd).toMatch(/niet in je log/)
    expect(teWeinig).toMatch(/te weinig gelogd/)
    expect(new Set([uitgezet, nietGelogd, teWeinig]).size).toBe(3)
  })

  /* B12 hangt aan je eetpatroon en niet aan je log. Die regel hoort dus iets
     anders te zeggen dan de andere drie, anders belooft hij een controle die
     er niet is. */
  it('B12 leest je eetpatroon en niet je log', () => {
    const alles = nagekeken(vraag({ dagenGelogd: 20, gelogdeGroepen: [] }))[0]!
    expect(alles.stand).not.toMatch(/log/)
    const vegan = nagekeken(vraag({
      dagenGelogd: 20, gelogdeGroepen: ALLE_HOEKEN,
      voorkeuren: { patroon: 'veganistisch' },
    }))[0]!
    expect(vegan.stand).toMatch(/plantaardig/)
  })
})
