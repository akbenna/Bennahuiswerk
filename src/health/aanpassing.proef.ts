/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **De logfout valt weg.** Dat is de hele reden dat dit getal een verschil is
 * en geen niveau. Wie in beide vensters even veel te weinig opschrijft, hoort
 * dezelfde uitkomst te krijgen als wie het precies goed doet. Onder het model
 * dat optelt hoort dat exact te zijn; onder het model dat vermenigvuldigt blijft
 * er een restje, en de proef zet daar een grens op in plaats van te doen alsof
 * het nul is.
 *
 * **Een logfout die verandert valt niet weg.** Even belangrijk: de proef die
 * hierboven bewijst dat de app iets wegstreept, moet ernaast een proef hebben
 * die laat zien dat hij niet álles wegstreept. Anders zou een uitkomst van nul
 * ook "nul" heten.
 *
 * **Nul in het interval betekent geen uitspraak.** Een verbruik dat vijftig
 * kcal afwijkt met een band van honderd eromheen is geen bevinding.
 *
 * **En het moet onder beide modellen kloppen.** De twee verwachtingen liggen
 * uit elkaar, en een uitkomst die daartussenin valt is een uitkomst die van de
 * modelkeuze afhangt. Die hoort er niet te staan.
 *
 * **De vensters raken elkaar niet.** Delen ze dagen, dan staat dezelfde meting
 * aan beide kanten van het minteken.
 */
import { describe, expect, it } from 'vitest'
import { aanpassing } from './aanpassing'
import type { Uitslag } from './aanpassing'
import type { Dagenkaart } from './rekenkern'
import type { IsoDatum, Profiel } from '@/gedeeld/db/tabellen'

const pf = {
  lengte_cm: 196, geboortedatum: null, leeftijd_jaar: 45, geslacht: 'man',
  start_gewicht_kg: 120, doel_gewicht_kg: 100, tempo_pct_week: 0.5,
  eiwit_g_per_kg: 1.6, etniciteit: null, fase: 'afvallen',
  onderhoud_basis_kg: null, instellingen: {},
} as unknown as Profiel

const dag = (i: number): IsoDatum =>
  new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10) as IsoDatum

/**
 * Vierentachtig dagen met een rechte gewichtslijn en een inname die halverwege
 * mag omslaan. Recht, want dan is de helling in beide vensters dezelfde en gaat
 * elk verschil in de uitkomst over de inname en niet over de ruis.
 */
function reeks(
  { kcalToen, kcalNu, kgPerDag = -0.1, startKg = 120, dagen = 84 }:
  { kcalToen: number; kcalNu: number; kgPerDag?: number; startKg?: number; dagen?: number },
): Dagenkaart {
  const uit: Dagenkaart = {}
  for (let i = 0; i < dagen; i++) {
    const d = dag(i)
    const kcal = i < dagen / 2 ? kcalToen : kcalNu
    uit[d] = {
      datum: d, gewicht_kg: startKg + kgPerDag * i, stappen: 6000,
      _kcal: kcal, _eiwit: 120, _laag: kcal, _hoog: kcal,
    } as Dagenkaart[string]
  }
  return uit
}

const uit = (o: { kcalToen: number; kcalNu: number }) =>
  aanpassing(reeks(o), pf, dag(83))

/** Uitpakken met een duidelijke fout als er niets in zit. */
function moetLukken(u: Uitslag) {
  if ('ontbreekt' in u) throw new Error(`geen uitkomst: ${u.ontbreekt}`)
  return u.aanpassing
}

describe('de twee vensters', () => {
  it('legt ze aan de uiteinden van de reeks en laat ze elkaar niet raken', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.toen.van).toBe(dag(0))
    expect(a.toen.eind).toBe(dag(27))
    expect(a.nu.van).toBe(dag(56))
    expect(a.nu.eind).toBe(dag(83))
    expect(a.dagenTussen).toBe(56)
    expect(a.toen.eind < a.nu.van).toBe(true)
  })

  /* Zonder deze regel zou het vroege venster zijn rustverbruik op het gewicht
     van vandaag berekenen, en dan verdwijnt juist het verschil dat gemeten
     wordt. De grens zelf zit in `analyse`; hier staat dat dit bestand erop
     leunt. */
  it('rekent het vroege venster op het gewicht van toen', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.toen.gewichtKg).toBeCloseTo(117.3, 1)
    expect(a.nu.gewichtKg).toBeCloseTo(111.7, 1)
    expect(a.toen.rustBMR).toBeGreaterThan(a.nu.rustBMR)
  })

  it('zegt te-kort zolang de twee vensters zouden overlappen', () => {
    const kort = reeks({ kcalToen: 2500, kcalNu: 2500, dagen: 50 })
    expect(aanpassing(kort, pf, dag(49))).toEqual({ ontbreekt: 'te-kort' })
  })

  it('en zegt te-kort als er nog nooit gewogen is', () => {
    expect(aanpassing({}, pf, dag(83))).toEqual({ ontbreekt: 'te-kort' })
  })
})

describe('wat er met een logfout gebeurt', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('streept een fout weg die in beide vensters even groot is', () => {
    const eerlijk = moetLukken(uit({ kcalToen: 2500, kcalNu: 2100 }))
    const scheef = moetLukken(uit({ kcalToen: 2800, kcalNu: 2400 }))

    /* Exact, want deze verwachting is een optelling. */
    expect(scheef.verschilRust).toBe(eerlijk.verschilRust)
    /* En bij de verwachting die vermenigvuldigt blijft er een restje staan ter
       grootte van de fout maal het stukje dat je lichter bent geworden. Dat
       restje hoort klein te zijn tegenover de fout zelf. */
    expect(Math.abs(scheef.verschilMee - eerlijk.verschilMee)).toBeLessThan(300 / 10)
    expect(scheef.richting).toBe(eerlijk.richting)
  })

  it('maar niet een fout die tussen de twee vensters verandert', () => {
    const gelijk = moetLukken(uit({ kcalToen: 2500, kcalNu: 2100 }))
    const netter = moetLukken(uit({ kcalToen: 2500, kcalNu: 2400 }))
    expect(netter.verschilRust - gelijk.verschilRust).toBe(300)
  })
})

describe('wanneer er wel en niet iets staat', () => {
  it('zegt niets als nul nog in het interval zit', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.richting).toBeNull()
    expect(Math.abs(a.verschilRust)).toBeLessThan(a.half)
  })

  it('wijst omlaag als het verbruik verder gezakt is dan het gewicht verklaart', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2100 }))
    expect(a.richting).toBe('lager')
    expect(a.verschilMee).toBeLessThan(0)
    expect(a.verschilRust).toBeLessThan(0)
    expect(Math.max(a.verschilMee, a.verschilRust) + a.half).toBeLessThan(0)
  })

  it('en omhoog als het minder gezakt is', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 3000 }))
    expect(a.richting).toBe('hoger')
    expect(Math.min(a.verschilMee, a.verschilRust) - a.half).toBeGreaterThan(0)
  })

  /* De twee verwachtingen liggen uit elkaar, en daartussenin hangt een gebied
     waar het antwoord van de modelkeuze afhangt. Eén model kiezen zou daar een
     uitspraak opleveren. Deze proef houdt vast dat er dan niets staat. */
  it('houdt zijn mond in het gebied waar de twee modellen het oneens zijn', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.verwachtMee).toBeLessThan(a.verwachtRust)
    expect(a.verschilMee).toBeGreaterThan(a.verschilRust)
    expect(a.richting).toBeNull()
  })

  /* WAAR DE STRENGHEID ECHT IETS DOET
     Deze proef stond er eerst niet, en een versie die alleen naar het meemodel
     keek overleefde daardoor. De reden is dat de twee modellen bij afvallen
     altijd in dezelfde volgorde staan: dan is het meemodel vanzelf de
     maximumwaarde en valt het verschil tussen "de strengste van de twee" en
     "het meemodel" weg.

     Bij aankomen wisselen ze van plaats, en dan doet het er wel toe. Dit geval
     is bescheiden: ruim acht kilo erbij in twaalf weken. Het meemodel zet de
     afwijking net buiten de band (−157 bij een band van 143), het rustmodel net
     erbinnen (−136). Eén model kiezen zou hier "je verbruik is lager" hebben
     opgeleverd, en dat berust dan op de modelkeuze en niet op de meting. */
  it('zegt niets als alleen het meemodel de band verlaat, bij aankomen', () => {
    const d = reeks({ kcalToen: 3600, kcalNu: 3520, kgPerDag: 0.1 })
    const a = moetLukken(aanpassing(d, pf, dag(83)))
    expect(a.verschilMee + a.half).toBeLessThan(0)
    expect(a.verschilRust + a.half).toBeGreaterThan(0)
    expect(a.richting).toBeNull()
  })

  /* En dezelfde zaak aan de andere kant. Het rustmodel zet de afwijking net
     buiten de band (144 bij een band van 143), het meemodel net erbinnen (123).
     Twee proeven en niet één, want de code test de twee kanten met twee
     verschillende velden, en een versie die er maar één goed doet komt anders
     langs de ene proef heen. */
  it('en niets als alleen het rustmodel de band verlaat, bij aankomen', () => {
    const d = reeks({ kcalToen: 3600, kcalNu: 3800, kgPerDag: 0.1 })
    const a = moetLukken(aanpassing(d, pf, dag(83)))
    expect(a.verschilRust - a.half).toBeGreaterThan(0)
    expect(a.verschilMee - a.half).toBeLessThan(0)
    expect(a.richting).toBeNull()
  })

  /* Twee vensters vergelijken kost nauwkeurigheid, het kost er niet niets.
     Deze proef stond er eerst met `>=` en liet daarmee een versie door die het
     vroege venster gewoon oversloeg. Strikt dus, en met de som erbij: de twee
     fouten tellen op zoals fouten van twee losse metingen dat doen, en de
     coëfficiënt die daarbij telt is de grootste van de twee modellen. */
  it('is breder dan elk van de twee vensters apart, en precies hoeveel', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2100 }))
    expect(a.half).toBeGreaterThan(a.nu.half)
    expect(a.half).toBeGreaterThan(a.toen.half)
    expect(a.half).toBe(Math.round(Math.sqrt(a.toen.half ** 2 + a.nu.half ** 2)))
  })
})

/**
 * WAT DE TWEE VERWACHTINGEN BEWEREN
 *
 * Allebei zeggen ze: dit zou je verbruiken als er niets aan je veranderd was
 * behalve je gewicht. Dus moeten ze na afvallen allebei láger uitkomen dan het
 * verbruik van toen, en na aankomen allebei hoger. En het rustmodel zegt precies
 * hoeveel lager: net zoveel als het rustverbruik gezakt is, niet meer.
 *
 * Dit stond er eerst niet, en daardoor overleefde een versie die het teken van
 * dat model omdraaide: de verwachting ging dan omhóóg bij afvallen. Alle
 * uitspraken bleven staan, want die gingen over volgorde en niet over richting.
 */
describe('de richting van de verwachting', () => {
  it('verwacht na afvallen onder beide modellen een lager verbruik', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.verwachtRust).toBeLessThan(a.toen.tdee)
    expect(a.verwachtMee).toBeLessThan(a.toen.tdee)
  })

  it('en laat het rustmodel precies het rustverbruik zakken', () => {
    const a = moetLukken(uit({ kcalToen: 2500, kcalNu: 2500 }))
    expect(a.toen.tdee - a.verwachtRust).toBeCloseTo(a.toen.rustBMR - a.nu.rustBMR, 0)
  })

  /* En andersom. Deze app is om af te vallen, maar hij draait ook bij wie
     aankomt, en dan wisselen de twee modellen van plaats: wat meeschaalt met de
     massa verwacht dan het hóógste verbruik. Daarom staat er in de code een max
     en een min en niet twee keer hetzelfde veld. */
  it('keert de volgorde van de twee modellen om bij aankomen', () => {
    const omhoog = reeks({ kcalToen: 3200, kcalNu: 3200, kgPerDag: 0.05 })
    const a = moetLukken(aanpassing(omhoog, pf, dag(83)))
    expect(a.nu.rustBMR).toBeGreaterThan(a.toen.rustBMR)
    expect(a.verwachtMee).toBeGreaterThan(a.toen.tdee)
    expect(a.verwachtRust).toBeGreaterThan(a.toen.tdee)
    expect(a.verwachtMee).toBeGreaterThan(a.verwachtRust)
  })
})

describe('wat de balans niet mag beweren', () => {
  /* Dezelfde grens als in de rekenkern: aankomen op een mager logboek geeft een
     verbruik onder het rustverbruik, en dat kan niet. Zo'n venster hoort geen
     helft van een verschil te worden. */
  it('geeft geen verschil als een van de twee vensters onmogelijk is', () => {
    const d = reeks({ kcalToen: 1400, kcalNu: 2500, kgPerDag: 0.3 })
    expect(aanpassing(d, pf, dag(83))).toEqual({ ontbreekt: 'onmogelijk' })
  })
})
