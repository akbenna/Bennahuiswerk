/**
 * IS JE VERBRUIK MEEGEZAKT?
 *
 * Dit is de vraag waarvoor deze app gebouwd is en die hij tot nu toe niet
 * stelde. Een formule kan hem niet beantwoorden: Mifflin-St Jeor kent alleen
 * lengte, gewicht, leeftijd en geslacht, dus die zegt per definitie dat je
 * verbruik precies zoveel gezakt is als je lichter bent geworden. Wie wil weten
 * of er méér gezakt is dan het gewicht verklaart, moet meten. Dat doet deze app
 * al, achtentwintig dagen lang, en hij deed het één keer in plaats van twee.
 *
 * Twee vensters, en het verschil ertussen. Meer is het niet.
 *
 * WAAROM EEN VERSCHIL BETROUWBAARDER IS DAN DE TWEE GETALLEN ZELF
 *
 * Het gemeten verbruik is inname min de energie die het vet in of uit ging. De
 * inname komt uit een logboek, en een logboek zit ernaast: bijna iedereen logt
 * te weinig, en de app rekent dat verschil ook uit (`onderrapportage`). Het
 * gemeten verbruik draagt die fout dus mee.
 *
 * Maar in een vérschil valt die fout weg, zolang hij dezelfde blijft. Wie zijn
 * boterham al een jaar tweehonderd kcal te licht opschrijft, doet dat in beide
 * vensters, en tweehonderd min tweehonderd is nul. Dat maakt het verschil tussen
 * twee vensters een schoner getal dan elk venster apart, en dat is precies
 * andersom dan je zou denken.
 *
 * Precies weg valt hij onder het tweede model hieronder, waar de verwachting een
 * optelling is; onder het eerste, waar hij met een verhouding vermenigvuldigd
 * wordt, blijft er een restje staan ter grootte van de fout maal het stukje dat
 * je lichter bent. Bij driehonderd kcal en acht kilo eraf is dat rond de acht
 * kcal, en dat is de orde van het afrondingswerk. De proef zet er een grens op.
 *
 * Wat er níet uit wegvalt is een fout die verandert. Wie sinds juni nauwkeuriger
 * weegt en logt, ziet zijn gemeten verbruik stijgen zonder dat er aan hem iets
 * veranderd is. Dat staat op het scherm, want het is de enige manier waarop dit
 * getal ernaast kan zitten zonder dat iets het verraadt.
 *
 * WAT "VERWACHT" BETEKENT, EN WAAROM HET TWEE GETALLEN ZIJN
 *
 * Om te zeggen dat er méér gezakt is dan het gewicht verklaart, moet er staan
 * wat het gewicht dan verklaart. Daar bestaan twee verdedigbare antwoorden en ze
 * geven niet hetzelfde:
 *
 *   **Alles zakt mee.** Een lichter lichaam verbruikt minder in rust én minder
 *   bij elke stap, want er is minder te dragen. Dan schaalt het hele verbruik
 *   met het rustverbruik: verwacht = toen × (rust nu / rust toen).
 *
 *   **Alleen de rust zakt.** Het rustverbruik daalt met de massa, maar wat je
 *   aan beweging kwijt bent blijft in absolute zin hetzelfde. Dan verwacht =
 *   toen − (rust toen − rust nu).
 *
 * De eerste voorspelt een grotere daling dan de tweede, zolang je meer verbruikt
 * dan je rustverbruik. Welke van de twee klopt is niet uit te maken met de
 * gegevens die deze app heeft. Dus rekent hij ze allebei, en een uitspraak komt
 * er alleen als hij onder béide modellen overeind blijft. Dat is strenger dan
 * één model kiezen, en het is eerlijker dan doen alsof de keuze niet bestaat.
 *
 * WAT ER NOG MEER IN DIT GETAL ZIT
 *
 * Metabole adaptatie is één verklaring voor een verbruik dat verder zakt dan het
 * gewicht verklaart. Het is niet de enige, en de app kan ze niet uit elkaar
 * houden:
 *
 *   - minder gaan bewegen zonder het te merken (de niet-sportieve beweging is
 *     waar de grootste verschillen tussen mensen zitten)
 *   - anders zijn gaan loggen
 *   - een weegreeks die in één van de twee vensters slechter bepaald was
 *
 * Daarom heet dit bestand niet `adaptatie.ts`. Wat hier gemeten wordt is het
 * verschil tussen twee metingen, en wat dat verschil betekent staat er niet bij.
 *
 * DE MAAT VOOR DE LITERATUUR
 *
 * De cijfers waar dit tegenaan te leggen is staan in VERANTWOORDING.md §2: in de
 * Biggest Loser-follow-up −275 ± 207 kcal per dag op week 30 en −499 ± 207 na
 * zes jaar (Fothergill 2016). Dat is een uiterste, bij een extreem tempo en
 * veertien deelnemers, en de herinterpretatie ervan loopt nog. Het staat hier
 * als ordegrootte en niet als verwachting: een verschil van tweehonderd kcal is
 * groot, en de meeste reeksen zijn niet nauwkeurig genoeg om er een van die
 * omvang met zekerheid uit te halen.
 */
import type { IsoDatum, Profiel } from '@/gedeeld/db/tabellen'
import { dagVerschil, plusDagen } from '@/gedeeld/datum'
import { VENSTER, analyse } from './rekenkern'
import type { Analyse, Dagenkaart } from './rekenkern'

/** Wat één venster opleverde. */
export interface Venstermeting {
  /** De laatste dag van het venster. Het venster zelf is `VENSTER` dagen. */
  eind: IsoDatum
  van: IsoDatum
  /** Gemeten verbruik, kcal per dag. */
  tdee: number
  /** De halve breedte van het interval eromheen. */
  half: number
  /** Het gewicht waarop het rustverbruik van dit venster berekend is. */
  gewichtKg: number
  rustBMR: number
}

export type Richting = 'lager' | 'hoger'

export interface Aanpassing {
  toen: Venstermeting
  nu: Venstermeting
  /** Hoeveel dagen er tussen de twee venstereindes zitten. */
  dagenTussen: number
  /** Wat het verbruik nu zou zijn als alleen het gewicht veranderd was. */
  verwachtMee: number
  verwachtRust: number
  /** Gemeten nu min verwacht. Negatief betekent lager dan het gewicht verklaart. */
  verschilMee: number
  verschilRust: number
  /** De halve breedte van het interval op dat verschil, de breedste van de twee. */
  half: number
  /** De kant waar het verschil op valt, of null als nul er nog in zit. */
  richting: Richting | null
}

/** Waarom er geen uitkomst is. Het scherm zegt dat liever dan niets. */
export type Ontbreekt =
  | 'te-kort'
  | 'venster-toen-leeg'
  | 'venster-nu-leeg'
  | 'onmogelijk'

export type Uitslag = { aanpassing: Aanpassing } | { ontbreekt: Ontbreekt }

/* Dat `analyse` met een `eind` van vroeger niets uit de toekomst meeneemt is
   geen aanname maar een proef: zie "laat een weging van ná het venster het
   rustverbruik niet bepalen" in `rekenkern.proef.ts`. Die regel stond er niet
   toen dit bestand begon, en het rustverbruik van juli werd toen berekend op
   het gewicht van september. Hier de dagenkaart alsnog afknippen zou dezelfde
   zekerheid twee keer regelen, en de tweede zou stil meedrijven. */

function meting(a: Analyse, eind: IsoDatum): Venstermeting | null {
  if (a.tdee == null || a.half == null || a.tdeeOordeel !== 'goed') return null
  return {
    eind, van: plusDagen(eind, -VENSTER + 1),
    tdee: a.tdee, half: a.half, gewichtKg: a.gewicht, rustBMR: a.rustBMR,
  }
}

/**
 * De twee vensters naast elkaar.
 *
 * Het vroegste venster begint bij de eerste dag met een weging, zodat de twee
 * zo ver mogelijk uit elkaar liggen: hoe langer de tussentijd, hoe meer er te
 * zien valt. Ze mogen elkaar niet raken, anders zouden dezelfde dagen aan beide
 * kanten van het verschil staan en zou het verschil met zichzelf gecorreleerd
 * zijn. Dat is de reden voor de eis van zesenvijftig dagen en niet de ronde
 * getalletjes.
 */
export function aanpassing(
  dagen: Dagenkaart, pf: Profiel, eind: IsoDatum,
): Uitslag {
  const metGewicht = Object.keys(dagen)
    .filter((k) => k <= eind && dagen[k]?.gewicht_kg != null).sort()
  const eerste = metGewicht[0]
  if (!eerste) return { ontbreekt: 'te-kort' }

  const eindToen = plusDagen(eerste, VENSTER - 1)
  /* Niet overlappen: het venster van nu begint op `eind - VENSTER + 1`. */
  if (eindToen >= plusDagen(eind, -VENSTER + 1)) return { ontbreekt: 'te-kort' }

  const aToen = analyse(dagen, pf, eindToen)
  const aNu = analyse(dagen, pf, eind)
  const toen = meting(aToen, eindToen)
  const nu = meting(aNu, eind)
  if (!toen) return { ontbreekt: aToen.tdee == null ? 'venster-toen-leeg' : 'onmogelijk' }
  if (!nu) return { ontbreekt: aNu.tdee == null ? 'venster-nu-leeg' : 'onmogelijk' }

  const verhouding = nu.rustBMR / toen.rustBMR
  const verwachtMee = toen.tdee * verhouding
  const verwachtRust = toen.tdee - (toen.rustBMR - nu.rustBMR)
  const verschilMee = nu.tdee - verwachtMee
  const verschilRust = nu.tdee - verwachtRust

  /* De twee vensters raken elkaar niet, dus hun fouten tellen als onafhankelijk
     op. De coëfficiënt op `toen` verschilt per model (de verhouding tegenover
     één), en daarvan telt de breedste: een uitspraak die alleen onder het
     smalste interval standhoudt is geen uitspraak. */
  const breedte = (c: number) => Math.sqrt((c * toen.half) ** 2 + nu.half ** 2)
  const half = Math.max(breedte(verhouding), breedte(1))

  /* De twee modellen geven twee intervallen. Er staat alleen iets als ze
     allebei aan dezelfde kant van nul liggen, dus telt de bovenkant van het
     hoogste en de onderkant van het laagste. */
  const hoogsteBoven = Math.max(verschilMee, verschilRust) + half
  const laagsteOnder = Math.min(verschilMee, verschilRust) - half
  const richting: Richting | null =
    hoogsteBoven < 0 ? 'lager' : laagsteOnder > 0 ? 'hoger' : null

  return {
    aanpassing: {
      toen, nu, dagenTussen: dagVerschil(toen.eind, nu.eind),
      verwachtMee: Math.round(verwachtMee), verwachtRust: Math.round(verwachtRust),
      verschilMee: Math.round(verschilMee), verschilRust: Math.round(verschilRust),
      half: Math.round(half), richting,
    },
  }
}
