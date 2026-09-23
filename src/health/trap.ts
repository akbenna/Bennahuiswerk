/**
 * DE TRAP: waar je staat in het Nederlandse traject
 *
 * Afvallen loopt in Nederland langs treden: wat je zelf doet, de gecombineerde
 * leefstijlinterventie, medicatie, en de operatie. Elke trede heeft
 * toegangseisen, en die van medicatie liggen aanzienlijk hoger dan de
 * bijsluiter doet vermoeden.
 *
 * Niemand toont dit. De meeste apps citeren de registratietekst, en die noemt
 * een drempel waar bijna iedereen met overgewicht boven zit. Dat wekt een
 * verwachting die bij de huisarts stukloopt.
 *
 * DRIE REGELS DIE NIET ONDERHANDELBAAR ZIJN
 *
 * 1. Deze module zegt nooit dat iemand in aanmerking komt. Hij zegt wat de
 *    richtlijn vraagt en wat de app van je weet. Het oordeel is van de
 *    huisarts, de NHG-Standaard laat die uitdrukkelijk vrij dit aanbod niet
 *    te leveren.
 * 2. Registratie-indicatie en NHG-indicatie zijn twee verschillende dingen en
 *    horen naast elkaar te staan. Dat verschil ís de informatie.
 * 3. "Niet bekend" is een eigen uitkomst, naast gehaald en niet gehaald. Geen
 *    leeftijd, geen GLI-gegevens, geen jaar aan wegingen: dan zegt de app dat,
 *    en niet "je voldoet niet".
 *
 * WAT HIER NOG NIET IN STAAT, EN WAAROM DAT EEN SLOT HEEFT
 *
 * De exacte criteria van de medicatietrede (BMI-grenzen, welke comorbiditeit,
 * hoeveel maanden GLI) staan hier niet. Ze zijn bekend uit samenvattingen van
 * de NHG-Standaard Obesitas 2.0, maar de standaard zelf is van deze omgeving
 * niet te bereiken: de netwerkproxy blokkeert `nhg.org`.
 *
 * Voor een tekst in een onderzoeksbestand is tweedehands genoeg. Voor een regel
 * die op iemands scherm bepaalt of hij naar zijn huisarts stapt, niet. Daarom
 * draagt `MEDICATIE` een vlag `bevestigd`, staat die op `false`, en levert de
 * hele trede zolang uitsluitend `niet bekend`, ongeacht wat er verder van
 * iemand bekend is. Een proef houdt dat vast.
 */
import type { IsoDatum } from '@/gedeeld/db/tabellen'

export type Tredenaam = 'leefstijl' | 'gli' | 'medicatie' | 'operatie'

/* ------------------------------------------------------------------ GLI -- */

/**
 * De erkende programma's, met de lengte van hun behandelfase.
 *
 * De totale duur is bij alle 24 maanden: een behandelfase en daarna een
 * onderhoudsfase. Wat verschilt is waar de knip ligt. `behandelfaseMaanden` is
 * null waar ik de lengte niet geverifieerd heb, dat is iets anders dan nul, en
 * het scherm hoort dat verschil te tonen.
 *
 * CooL is het enige programma dat door één persoon wordt gegeven: een
 * leefstijlcoach. Bij de andere is het een team.
 */
export const GLI_TOTAAL_MAANDEN = 24

export interface Gliprogramma {
  sleutel: string
  naam: string
  behandelfaseMaanden: number | null
}

export const GLI_PROGRAMMAS: readonly Gliprogramma[] = [
  { sleutel: 'beweegkuur', naam: 'BeweegKuur', behandelfaseMaanden: 12 },
  { sleutel: 'slimmer', naam: 'SLIMMER', behandelfaseMaanden: 6.5 },
  { sleutel: 'cool', naam: 'CooL', behandelfaseMaanden: 8 },
  { sleutel: 'samensportief', naam: 'Samen Sportief in Beweging', behandelfaseMaanden: 12 },
  { sleutel: 'xfittt', naam: 'X-Fittt', behandelfaseMaanden: null },
  { sleutel: 'keerdm2', naam: 'Keer Diabetes2 Om', behandelfaseMaanden: null },
  { sleutel: 'keerdm2i', naam: 'Keer Diabetes2 Om, intensief', behandelfaseMaanden: null },
  { sleutel: 'anders', naam: 'Een ander programma', behandelfaseMaanden: null },
]

export function programmaVan(sleutel: string | null | undefined): Gliprogramma | null {
  if (!sleutel) return null
  return GLI_PROGRAMMAS.find((p) => p.sleutel === sleutel) ?? null
}

export type Glifase = 'behandelfase' | 'onderhoudsfase' | 'afgerond' | 'onbekend'

export interface Glivoortgang {
  fase: Glifase
  maanden: number | null
  /** Wat er te zeggen valt, in één zin. */
  tekst: string
}

/** Een ISO-datum uit elkaar halen. `null` als het er geen is. */
function ontleed(d: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/**
 * HELE KALENDERMAANDEN TUSSEN TWEE DATUMS
 *
 * Eerst stond hier een deling door 30,44 dagen, de gemiddelde maandlengte. Dat
 * is bijna goed en precies verkeerd op de plek waar het telt: twee kalenderjaren
 * zijn 730 dagen, en 730 gedeeld door 30,44 is 23,98. Iemand die zijn tweejarige
 * programma op de dag af had doorlopen, kreeg te lezen dat hij nog in de
 * onderhoudsfase zat.
 *
 * Nu wordt er in kalendermaanden geteld. Op 19 juni plus drie maanden is 19
 * september, ongeacht hoeveel dagen daar tussen zitten.
 *
 * Wat dat kost: het antwoord is een heel getal. De behandelfase van SLIMMER
 * duurt zes en een halve maand, en die halve maand is in hele maanden niet te
 * tonen, de overgang valt daardoor op maand zeven. Een halve maand
 * nauwkeurigheid in een fase-indeling weegt niet op tegen een jaargrens die
 * niet klopt.
 *
 * WANNEER DIT `null` GEEFT
 *
 * Bij een onleesbare datum, en bij een datum die ná `tot` ligt. Die twee zijn
 * van buitenaf niet te onderscheiden, en `glivoortgang` vangt ze daarom allebei
 * apart af vóór hij hier komt. Door elkaar halen levert een zin op die niet
 * klopt ("niet te lezen" bij een datum die prima leesbaar is, alleen in de
 * toekomst) en dan gaat iemand zijn invoer nakijken die zich enkel in het jaar
 * vergist heeft.
 */
function maandenTussen(van: string, tot: string): number | null {
  const a = ontleed(van)
  const b = ontleed(tot)
  if (!a || !b) return null
  const [ja, ma, da] = a
  const [jb, mb, db] = b
  if (Date.UTC(jb, mb - 1, db) < Date.UTC(ja, ma - 1, da)) return null
  const maanden = (jb - ja) * 12 + (mb - ma)
  /* De dag van de maand is nog niet bereikt, dus die maand is niet vol. */
  return db < da ? maanden - 1 : maanden
}

export function glivoortgang(
  programma: string | null | undefined,
  begonnen: IsoDatum | null | undefined,
  vandaag: IsoDatum,
): Glivoortgang {
  if (!begonnen) {
    return { fase: 'onbekend', maanden: null, tekst: 'niet bekend wanneer je begonnen bent' }
  }
  if (!ontleed(begonnen) || !ontleed(vandaag)) {
    return { fase: 'onbekend', maanden: null, tekst: 'de startdatum is niet te lezen' }
  }
  const m = maandenTussen(begonnen, vandaag)
  if (m == null) {
    return { fase: 'onbekend', maanden: null, tekst: 'die startdatum ligt in de toekomst' }
  }
  const maanden = m
  const p = programmaVan(programma)

  if (m >= GLI_TOTAAL_MAANDEN) {
    return { fase: 'afgerond', maanden, tekst: `de twee jaar zitten erop, ${maanden} maanden geleden begonnen` }
  }
  /* Zonder bekende behandelfase valt er geen fase te noemen, wél een duur. Dat
     is iets anders dan niets weten, en het hoort ook anders te lezen. */
  if (p?.behandelfaseMaanden == null) {
    return {
      fase: 'onbekend', maanden,
      tekst: `${maanden} maanden bezig; van dit programma is de lengte van de behandelfase hier niet vastgelegd`,
    }
  }
  return m < p.behandelfaseMaanden
    ? { fase: 'behandelfase', maanden, tekst: `${maanden} van de ${p.behandelfaseMaanden} maanden behandelfase` }
    : { fase: 'onderhoudsfase', maanden, tekst: `behandelfase afgerond, nu in de onderhoudsfase van ${GLI_TOTAAL_MAANDEN} maanden` }
}

/* ------------------------------------------------------------ criteria -- */

export type Criteriumstand = 'gehaald' | 'niet gehaald' | 'niet bekend'

export interface Criterium {
  wat: string
  stand: Criteriumstand
  toelichting: string
}

/**
 * DE MEDICATIETREDE, NAGELEZEN IN DE STANDAARD ZELF
 *
 * Dit stond tot 20 september 2026 op slot. De criteria kwamen uit
 * samenvattingen, en zolang dat zo was gaf deze functie uitsluitend
 * `niet bekend`, want als je niet zeker weet wat de eis is, weet je ook niet of
 * iemand eraan voldoet.
 *
 * Het slot heeft zijn nut bewezen. De standaard zelf bleek drie dingen te
 * bevatten die in géén samenvatting stonden, waarvan één die er werkelijk toe
 * doet: **afwijkende BMI-drempels** voor mensen met een Aziatische (inclusief
 * Hindostaanse), Midden-Oosterse, Afrikaanse of Afrikaans-Caribische
 * migratieachtergrond. Die liggen ongeveer 2,5 punt lager. Een app die alleen de
 * standaarddrempels had getoond, had een groot deel van de mensen voor wie hij
 * gebouwd is verteld dat ze er nog niet aan toe waren.
 */
export const MEDICATIE = {
  bevestigd: true,
  bron: 'NHG-Standaard Obesitas, Nederlands Huisartsen Genootschap, augustus 2026, blz. 28–29',
  /** Wat er over deze trede vaststaat, in de bewoording van de standaard. */
  vast: [
    'De lat ligt hoger dan de Europese registratietekst in de bijsluiter.',
    'Er gaat minstens een jaar leefstijlbegeleiding aan vooraf, met onvoldoende resultaat '
      + '(minder dan tien procent gewichtsverlies), én je blijft eraan deelnemen.',
    'De standaard noemt het "extra aanbod en daarom facultatief": geen huisarts is verplicht '
      + 'het te leveren. Doet die het niet zelf, dan loopt de route via een obesitascentrum of '
      + 'een internist.',
    'Boven de 75 jaar niet, en niet tijdens zwangerschap of borstvoeding.',
    'Levert het na twaalf weken op de hoogste dosis die je verdraagt minder dan vijf procent '
      + 'op, dan schrijft de standaard voor om te stoppen.',
  ],
} as const

/**
 * DE BMI-DREMPELS, EN WAAROM DE APP ZE TOONT IN PLAATS VAN TOEPAST
 *
 * De standaard geeft twee sets referentiewaarden. Welke voor jou geldt hangt af
 * van je migratieachtergrond, en dáár zit het probleem: deze app vraagt daar
 * niet naar. Het profiel kent `etniciteit`, maar dat is een vrij tekstveld dat
 * alleen over de afkapwaarde van de middelomtrek gaat, zie de kop van
 * `Conditie` in `tabellen.ts`, waar om dezelfde reden twee aparte vragen staan
 * in plaats van een afleiding uit afkomst.
 *
 * Er zijn twee manieren om daarmee om te gaan. De ene is gokken welke set geldt.
 * De andere is ze allebei laten zien en de lezer zelf laten kijken. Alleen de
 * tweede is eerlijk, en hij is bovendien nuttiger: wie ziet dat er een lagere
 * drempel bestaat en dat die misschien voor hem geldt, heeft een vraag om aan
 * zijn huisarts te stellen. Een app die dat voor hem invult, geeft hem een
 * antwoord dat op een aanname rust.
 *
 * Dit is dus inhoud en geen oordeel, dezelfde grens als in `leren.ts`.
 */
export interface Drempelset {
  naam: string
  /** Vanaf deze BMI mét gewichtsgerelateerde comorbiditeit. */
  metComorbiditeit: number
  /** Vanaf deze BMI ook zonder. */
  zonder: number
}

export const DREMPELS: readonly Drempelset[] = [
  { naam: 'De meeste mensen', metComorbiditeit: 35, zonder: 40 },
  {
    naam: 'Aziatische (inclusief Hindostaanse), Midden-Oosterse, Afrikaanse of '
      + 'Afrikaans-Caribische achtergrond',
    metComorbiditeit: 32.5,
    zonder: 37.5,
  },
]

/** De comorbiditeit die de standaard bij deze drempels noemt. */
export const COMORBIDITEIT = [
  'coronaire hartziekten', 'beroerte', 'perifeer arterieel vaatlijden',
  'diabetes mellitus type 2', 'obstructief slaapapneu',
  'artrose van een dragend gewricht',
] as const

/** De bovengrens waarboven de standaard niet voorschrijft. */
export const LEEFTIJDGRENS = 75

export interface Trapvraag {
  /** Of er een GLI loopt, en sinds wanneer. */
  gliProgramma?: string | null | undefined
  gliBegonnen?: IsoDatum | null | undefined
  /** Uit het profiel. Leeg is "niet ingevuld" en niet "jong". */
  leeftijd?: number | null | undefined
  vandaag: IsoDatum
}

/**
 * DE CRITERIA, EN DE REGEL DIE BEPAALT WELKE DE APP BEOORDEELT
 *
 * Twee soorten. Een criterium is een **feit uit je eigen dossier** of een
 * **klinisch oordeel**. Het eerste beoordeelt deze app; het tweede nooit.
 *
 * Feit uit je dossier: hoe lang je GLI loopt (de startdatum staat in je profiel)
 * en je leeftijd. Daar valt niets aan te wegen: het staat er of het staat er
 * niet.
 *
 * Klinisch oordeel: of je BMI boven de drempel ligt, en of er
 * gewichtsgerelateerde comorbiditeit is. Die twee blijven `niet bekend`, en niet
 * uit voorzichtigheid:
 *
 * - Het gewicht in deze app is zelf ingevoerd en ongebonden. In het dossier van
 *   de bouwer staan wegingen van 107 én 190 kilo. Een drempeloordeel op zulke
 *   getallen is geen oordeel.
 * - Welke drempelset geldt hangt af van een vraag die deze app niet stelt.
 * - Bij comorbiditeit is een leeg vinkje géén "nee". Wie niets heeft aangevinkt
 *   kan slaapapneu hebben dat hij nooit heeft ingevoerd. "Niet aangevinkt" en
 *   "niet aanwezig" door elkaar halen is hier de gevaarlijkste fout die er is.
 *
 * DAARUIT VOLGT EEN EIGENSCHAP DIE EEN PROEF BEWAAKT
 *
 * Er is geen invoer denkbaar waarbij alle criteria op `gehaald` staan. Er zit er
 * altijd minstens één op `niet bekend`, want de klinische twee staan er altijd
 * op. Deze app kan dus nooit een scherm tonen waarop alles groen is, en dat is
 * precies de bedoeling: het oordeel is van de huisarts, en de standaard laat die
 * uitdrukkelijk vrij dit aanbod niet te leveren.
 */
export function medicatiecriteria(v: Trapvraag): Criterium[] {
  const g = glivoortgang(v.gliProgramma, v.gliBegonnen, v.vandaag)
  const uit: Criterium[] = []

  uit.push({
    wat: 'Een jaar leefstijlbegeleiding',
    stand: g.maanden == null ? 'niet bekend' : g.maanden >= 12 ? 'gehaald' : 'niet gehaald',
    toelichting: g.maanden == null
      ? 'Vul bij je profiel in welk programma je volgt en wanneer je begon, dan telt de app mee.'
      : g.tekst,
  })

  /* De leeftijdsgrens is een uitsluiting en geen eis, maar hij leest alleen goed
     als hij positief staat: "onder de 76" is te halen, "boven de 75" niet. */
  uit.push({
    wat: `Leeftijd onder de ${LEEFTIJDGRENS + 1}`,
    stand: v.leeftijd == null ? 'niet bekend'
      : v.leeftijd > LEEFTIJDGRENS ? 'niet gehaald' : 'gehaald',
    toelichting: v.leeftijd == null
      ? 'Je geboortedatum staat niet in je profiel.'
      : v.leeftijd > LEEFTIJDGRENS
        ? `De standaard schrijft boven de ${LEEFTIJDGRENS} jaar niet voor.`
        : `Je bent ${v.leeftijd}; de standaard schrijft boven de ${LEEFTIJDGRENS} niet voor.`,
  })

  uit.push({
    wat: 'De BMI-drempel',
    stand: 'niet bekend',
    toelichting: 'Dit weegt je huisarts. Deze app rekent het niet uit: je gewicht is hier zelf '
      + 'ingevoerd, en welke van de twee drempelsets voor jou geldt hangt af van een vraag die '
      + 'deze app niet stelt.',
  })

  uit.push({
    wat: 'Gewichtsgerelateerde comorbiditeit',
    stand: 'niet bekend',
    toelichting: 'Ook dit weegt je huisarts. Wat je hier niet hebt aangevinkt kan er wél zijn, '
      + 'en die twee door elkaar halen zou hier de gevaarlijkste fout zijn.',
  })

  return uit
}

/**
 * Op welke trede iemand staat.
 *
 * Alleen op grond van wat er ingevuld is, en niet van een oordeel. Wie geen GLI
 * heeft opgegeven staat op `leefstijl`, dat betekent "hier is niets over
 * bekend" en niet "je hoort hier thuis".
 */
export function trede(v: Trapvraag): Tredenaam {
  return v.gliProgramma ? 'gli' : 'leefstijl'
}
