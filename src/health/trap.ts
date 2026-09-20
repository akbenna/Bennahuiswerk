/**
 * DE TRAP — waar je staat in het Nederlandse traject
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
 *    huisarts — de NHG-Standaard laat die uitdrukkelijk vrij dit aanbod niet
 *    te leveren.
 * 2. Registratie-indicatie en NHG-indicatie zijn twee verschillende dingen en
 *    horen naast elkaar te staan. Dat verschil ís de informatie.
 * 3. "Niet bekend" is een eigen uitkomst, naast gehaald en niet gehaald. Geen
 *    leeftijd, geen GLI-gegevens, geen jaar aan wegingen: dan zegt de app dat,
 *    en niet "je voldoet niet".
 *
 * WAT HIER NOG NIET IN STAAT, EN WAAROM DAT EEN SLOT HEEFT
 *
 * De exacte criteria van de medicatietrede — BMI-grenzen, welke comorbiditeit,
 * hoeveel maanden GLI — staan hier niet. Ze zijn bekend uit samenvattingen van
 * de NHG-Standaard Obesitas 2.0, maar de standaard zelf is van deze omgeving
 * niet te bereiken: de netwerkproxy blokkeert `nhg.org`.
 *
 * Voor een tekst in een onderzoeksbestand is tweedehands genoeg. Voor een regel
 * die op iemands scherm bepaalt of hij naar zijn huisarts stapt, niet. Daarom
 * draagt `MEDICATIE` een vlag `bevestigd`, staat die op `false`, en levert de
 * hele trede zolang uitsluitend `niet bekend` — ongeacht wat er verder van
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
 * null waar ik de lengte niet geverifieerd heb — dat is iets anders dan nul, en
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
 * Eerst stond hier een deling door 30,44 dagen — de gemiddelde maandlengte. Dat
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
 * tonen — de overgang valt daardoor op maand zeven. Een halve maand
 * nauwkeurigheid in een fase-indeling weegt niet op tegen een jaargrens die
 * niet klopt.
 *
 * WANNEER DIT `null` GEEFT
 *
 * Bij een onleesbare datum, en bij een datum die ná `tot` ligt. Die twee zijn
 * van buitenaf niet te onderscheiden, en `glivoortgang` vangt ze daarom allebei
 * apart af vóór hij hier komt. Door elkaar halen levert een zin op die niet
 * klopt — "niet te lezen" bij een datum die prima leesbaar is, alleen in de
 * toekomst — en dan gaat iemand zijn invoer nakijken die zich enkel in het jaar
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
    return { fase: 'afgerond', maanden, tekst: `de twee jaar zitten erop — ${maanden} maanden geleden begonnen` }
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
 * De medicatietrede, en het slot erop.
 *
 * `bevestigd: false` betekent dat de criteria hier níét uit de NHG-Standaard
 * zelf zijn overgenomen maar uit samenvattingen ervan. Zolang die vlag uit
 * staat, geeft `medicatiecriteria` uitsluitend `niet bekend` terug — hoeveel er
 * verder ook van iemand bekend is.
 *
 * Dat is geen voorzichtigheid maar de enige juiste uitkomst: als je niet zeker
 * weet wat de eis is, weet je ook niet of iemand eraan voldoet.
 */
export const MEDICATIE = {
  bevestigd: false,
  waarom: 'De criteria komen uit samenvattingen van de NHG-Standaard Obesitas 2.0 en niet '
    + 'uit de standaard zelf. Tot dat nagekeken is, beoordeelt deze app ze niet.',
  /** Wat er wél met zekerheid over te zeggen valt. */
  vast: [
    'De lat ligt hoger dan de Europese registratietekst in de bijsluiter.',
    'Er gaat minstens een jaar leefstijlbegeleiding aan vooraf, met onvoldoende resultaat.',
    'De NHG-Standaard noemt het "aanvullend aanbod": geen huisarts is verplicht het te leveren.',
  ],
} as const

export interface Trapvraag {
  /** Of er een GLI loopt, en sinds wanneer. */
  gliProgramma?: string | null | undefined
  gliBegonnen?: IsoDatum | null | undefined
  vandaag: IsoDatum
}

/**
 * De criteria voor de medicatietrede.
 *
 * Zolang `MEDICATIE.bevestigd` uit staat is er precies één uitkomst: één
 * criterium, `niet bekend`, met de reden. Geen deellijst, geen "dit heb je al
 * wel" — want een half beoordeelde eis leest als een halve toezegging.
 */
export function medicatiecriteria(v: Trapvraag): Criterium[] {
  if (!MEDICATIE.bevestigd) {
    return [{
      wat: 'De criteria van de huisarts',
      stand: 'niet bekend',
      toelichting: MEDICATIE.waarom,
    }]
  }
  /* Zodra de standaard nagekeken is, komen de echte criteria hier. Ze horen
     stuk voor stuk hun eigen stand te krijgen, met `niet bekend` voor alles wat
     het profiel niet weet. */
  const g = glivoortgang(v.gliProgramma, v.gliBegonnen, v.vandaag)
  return [{
    wat: 'Een jaar leefstijlbegeleiding',
    stand: g.maanden == null ? 'niet bekend' : g.maanden >= 12 ? 'gehaald' : 'niet gehaald',
    toelichting: g.tekst,
  }]
}

/**
 * Op welke trede iemand staat.
 *
 * Alleen op grond van wat er ingevuld is, en niet van een oordeel. Wie geen GLI
 * heeft opgegeven staat op `leefstijl` — dat betekent "hier is niets over
 * bekend" en niet "je hoort hier thuis".
 */
export function trede(v: Trapvraag): Tredenaam {
  return v.gliProgramma ? 'gli' : 'leefstijl'
}
