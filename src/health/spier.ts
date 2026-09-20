/**
 * SPIERBEHOUD — wat er naast het vet verdwijnt, en wat ertegen helpt
 *
 * Een weegschaal telt kilo's en zegt niet waar ze vandaan komen. Bij snel
 * gewichtsverlies is dat verschil groot: in de lichaamssamenstellingssubstudie
 * van STEP-1 was ongeveer 40 % van wat er op semaglutide verdween vetvrije
 * massa, bij tirzepatide in SURMOUNT-1 ongeveer 25 %.
 *
 * Wat daartegen helpt is niet omstreden: genoeg eiwit, krachttraining, en het
 * in de gaten houden. Wat wél omstreden is, is hoevéél het helpt — zie de
 * waarschuwing onderaan dit bestand en hoofdstuk 12 van
 * `health/ONDERZOEK-MEDISCH-AFVALLEN.md`.
 *
 * DIT BESTAND MEET NIETS EN OORDEELT NIET OVER IEMAND
 *
 * Er komt geen score uit en geen cijfer. Er komen drie regels uit die zeggen
 * wat er staat en wat er ontbreekt. Een samengesteld spiergetal zou een
 * nauwkeurigheid suggereren die geen van de drie onderdelen heeft.
 */

/* --------------------------------------------------------------- SARC-F -- */

/**
 * DE VIJF VRAGEN, EN WAAROM DE LAGE AFKAPWAARDE
 *
 * SARC-F is de screener die de Europese consensus EWGSOP2 aanbeveelt: vijf
 * vragen, geen apparaat. De eerste vier gaan over moeite (0 = geen, 1 = enige,
 * 2 = veel), de vijfde over vallen in het afgelopen jaar (0 = geen, 1 = één tot
 * drie, 2 = vier of meer).
 *
 * De gangbare grens is 4. Die heeft een hoge specificiteit en een láge
 * sensitiviteit: hij is goed in uitsluiten en slecht in opsporen. Voor een
 * screener in een app is dat de verkeerde kant van de fout — die hoort te
 * signaleren, niet te diagnosticeren. Daarom staat hier ook de grens van 1, en
 * gebruikt het scherm die.
 *
 * Beide staan er, want ze betekenen iets verschillends en dat hoort niet in één
 * getal te verdwijnen.
 */
export type Sarcfpunt = 0 | 1 | 2

export interface Sarcfantwoorden {
  /** Moeite met vier à vijf kilo tillen en dragen. */
  kracht: Sarcfpunt
  /** Moeite met door een kamer lopen. */
  lopen: Sarcfpunt
  /** Moeite met opstaan uit een stoel of bed. */
  opstaan: Sarcfpunt
  /** Moeite met tien traptreden. */
  traplopen: Sarcfpunt
  /** Vallen in het afgelopen jaar: 0 = geen, 1 = één tot drie, 2 = vier of meer. */
  vallen: Sarcfpunt
}

export const SARCF_OPSPOREN = 1
export const SARCF_UITSLUITEN = 4

export const SARCF_VRAGEN: ReadonlyArray<{
  sleutel: keyof Sarcfantwoorden; vraag: string; schaal: [string, string, string]
}> = [
  { sleutel: 'kracht', vraag: 'Hoeveel moeite heb je met vier à vijf kilo tillen en dragen?',
    schaal: ['geen', 'enige', 'veel of lukt niet'] },
  { sleutel: 'lopen', vraag: 'Hoeveel moeite heb je met door een kamer lopen?',
    schaal: ['geen', 'enige', 'veel, of alleen met hulp'] },
  { sleutel: 'opstaan', vraag: 'Hoeveel moeite heb je met opstaan uit een stoel of bed?',
    schaal: ['geen', 'enige', 'veel, of alleen met hulp'] },
  { sleutel: 'traplopen', vraag: 'Hoeveel moeite heb je met tien traptreden op?',
    schaal: ['geen', 'enige', 'veel of lukt niet'] },
  { sleutel: 'vallen', vraag: 'Hoe vaak ben je het afgelopen jaar gevallen?',
    schaal: ['niet', 'één tot drie keer', 'vier keer of vaker'] },
]

export function sarcfscore(a: Sarcfantwoorden): number {
  return a.kracht + a.lopen + a.opstaan + a.traplopen + a.vallen
}

/** Of deze score reden geeft om verder te kijken. Op de lage grens: opsporen. */
export function sarcfsignaal(a: Sarcfantwoorden): boolean {
  return sarcfscore(a) >= SARCF_OPSPOREN
}

/* ------------------------------------------------------------ stoeltest -- */

/**
 * VIJF KEER OPSTAAN, MET EEN STOEL EN EEN STOPWATCH
 *
 * EWGSOP2 laat de keuze tussen handknijpkracht en de stoeltest. Knijpkracht is
 * de betere maat — bij geriatrische revalidatie presteerde hij aantoonbaar
 * beter — maar hij vraagt een dynamometer, en die heeft niemand thuis.
 *
 * De stoeltest vraagt een keukenstoel en de klok van je telefoon. Dat is waarom
 * hij hier staat en de knijpkracht niet: een maat die niemand doet, meet niets.
 * Dat hij de zwakkere van de twee is, hoort het scherm te zeggen.
 *
 * Boven de vijftien seconden, of niet kunnen opstaan zonder je armen te
 * gebruiken, geldt als aanwijzing voor verminderde spierkracht.
 */
export const STOELTEST_GRENS_S = 15

/**
 * DE ONDERGRENS, EN WAAROM HIJ ER IS
 *
 * Vijf keer volledig opstaan en gaan zitten kost een mens minstens een paar
 * seconden; onder de twee is het geen meting maar een dubbele tik op de knop.
 * Zonder deze grens bewaart de app zo'n uitslag zonder te klagen, en leest hij
 * daarna als "snel" — de vleiendste uitkomst op de zwakste gegevens.
 *
 * Dat is geen bedacht geval: de armatuur vond hem. Die zet de klok vast, dus
 * `Date.now()` stond stil en er werd nul seconden opgeslagen. De stopwatch
 * gebruikt nu `performance.now()`, die loopt door, en deze grens vangt wat daar
 * alsnog doorheen komt.
 */
export const STOELTEST_MIN_S = 2

/**
 * null = niet gedaan, of een uitslag die geen meting kan zijn. Allebei iets
 * anders dan snel of traag, en ze horen hetzelfde te lezen: onbekend.
 */
export function stoeltestTraag(seconden: number | null | undefined): boolean | null {
  if (seconden == null || !Number.isFinite(seconden)) return null
  if (seconden < STOELTEST_MIN_S) return null
  return seconden > STOELTEST_GRENS_S
}

/* ------------------------------------------------- eiwit, per maaltijd -- */

/**
 * DE DREMPEL DIE NAAST HET DAGDOEL STAAT
 *
 * Het scherm Voeding deelt het eiwitdoel door drie en zet daar een stippellijn.
 * Dat is een goede maat voor "haal ik mijn dag", en het is géén maat voor "komt
 * de spieraanmaak op gang".
 *
 * Want er is een tweede, onafhankelijke grens. Bij ouderen is ongeveer 2,8 g
 * leucine per maaltijd nodig om spieraanmaak te prikkelen — zo'n 30 gram eiwit.
 * In een calorietekort is de aanmaak onderdrukt en de afbraak verhoogd, en dan
 * telt het halen van die drempel bij élke maaltijd zwaarder dan het dagtotaal.
 *
 * WAAR DE TWEE UIT ELKAAR LOPEN
 *
 * Bij een dagdoel van 161 g is een derde daarvan 54 g — ruim boven de drempel,
 * en dan valt er niets te zien. Bij een dagdoel van 75 g is een derde 25 g, en
 * dan ligt de stippellijn ónder de drempel. Het scherm zegt dan "op peil"
 * terwijl er van spieraanmaak weinig terechtkomt.
 *
 * Dat is geen reden om het dagdoel te verhogen. Het is een reden om te zeggen
 * dat drie maaltijden dan niet de goede verdeling is: twee grotere halen de
 * drempel wel.
 */
export const LEUCINEDREMPEL_G = 30

export interface Maaltijdverdeling {
  /** Het dagdoel gedeeld door drie — de stippellijn op Voeding. */
  gedeeld: number
  /** De drempel waarboven spieraanmaak op gang komt. */
  drempel: number
  /** Of het dagdoel over drie maaltijden de drempel haalt. */
  drieHaaltDrempel: boolean
  /** Over hoeveel maaltijden dit dagdoel de drempel wél haalt; 0 = over geen. */
  maaltijdenDieHalen: number
}

export function maaltijdverdeling(dagdoelG: number): Maaltijdverdeling {
  const doel = Math.max(0, Math.round(dagdoelG))
  const gedeeld = Math.max(1, Math.round(doel / 3))
  /* Naar beneden: bij 75 g dagdoel haal je twee maaltijden van 37 g, geen twee
     en een half. Een halve maaltijd bestaat niet. */
  const maaltijdenDieHalen = Math.floor(doel / LEUCINEDREMPEL_G)
  return {
    gedeeld,
    drempel: LEUCINEDREMPEL_G,
    drieHaaltDrempel: gedeeld >= LEUCINEDREMPEL_G,
    maaltijdenDieHalen,
  }
}

/**
 * WELKE EETMOMENTEN EEN MAALTIJD ZIJN
 *
 * De drempel gaat over een maaltijd, en een handje amandelen is er geen. Zou
 * "tussendoor" meetellen, dan gaat de teller omlaag bij precies het gedrag dat
 * er niets mee te maken heeft: wie drie maaltijden op peil heeft én iets
 * tussendoor eet, leest "3 van de 4". Dat is een oordeel over zijn tussendoortje
 * vermomd als een oordeel over zijn spieren.
 *
 * En "onbekend" telt niet mee: dat zijn regels uit een import zonder
 * maaltijdmoment. Daarvan is de verdeling niet bekend, en onbekend hoort niet
 * als gemist te lezen.
 *
 * Alleen momenten waar werkelijk iets gelogd is komen terug. Een diner dat er
 * niet is, is geen maaltijd van nul gram.
 */
export const HOOFDMAALTIJDEN = ['ontbijt', 'lunch', 'diner'] as const

export function hoofdmaaltijden(
  perMoment: Readonly<Record<string, number | undefined>>,
): number[] {
  return HOOFDMAALTIJDEN
    .map((m) => perMoment[m] ?? 0)
    .filter((g) => g > 0)
}

/** Hoeveel van de gegeven maaltijden boven de leucinedrempel uitkwamen. */
export function maaltijdenBovenDrempel(gramPerMaaltijd: readonly number[]): number {
  return gramPerMaaltijd.filter((g) => g >= LEUCINEDREMPEL_G).length
}

/* -------------------------------------------------------- het drieluik -- */

export type Stand = 'goed' | 'let' | 'onbekend'

export interface Spierregel {
  wat: string
  stand: Stand
  /** Wat er staat. Leeg bij `onbekend`. */
  waarde: string
  /** Waarom dat zo gelezen wordt, of wat er ontbreekt. */
  toelichting: string
}

export interface Spiervraag {
  /** Eiwit per maaltijd van de laatste gelogde dag, alleen de hoofdmaaltijden. */
  eiwitPerMaaltijd?: readonly number[] | undefined
  /** Krachtsessies in de afgelopen zeven dagen, en het doel. */
  krachtsessies?: number | undefined
  krachtdoel: number
  /** De laatste stoeltest in seconden, en hoe lang geleden. */
  stoeltestSeconden?: number | null | undefined
  stoeltestDagenGeleden?: number | null | undefined
  /** De laatste SARC-F, als hij ingevuld is. */
  sarcf?: Sarcfantwoorden | undefined
}

/**
 * De drie hefbomen naast elkaar, in de volgorde waarin je er iets aan kunt doen.
 *
 * Eiwit staat voorop omdat het de enige is die vandaag te veranderen valt.
 * De screener staat achteraan omdat hij het traagst beweegt — en omdat hij,
 * anders dan de andere twee, niets is waar je op kunt sturen.
 */
export function spierbeeld(v: Spiervraag): Spierregel[] {
  const uit: Spierregel[] = []

  const maaltijden = v.eiwitPerMaaltijd
  if (!maaltijden || maaltijden.length === 0) {
    uit.push({
      wat: 'Eiwit per maaltijd', stand: 'onbekend', waarde: '',
      toelichting: 'nog niets gelogd met een maaltijdmoment erbij',
    })
  } else {
    const gehaald = maaltijdenBovenDrempel(maaltijden)
    uit.push({
      wat: 'Eiwit per maaltijd',
      stand: gehaald >= 3 ? 'goed' : 'let',
      waarde: `${gehaald} van de ${maaltijden.length} boven ${LEUCINEDREMPEL_G} g`,
      toelichting: gehaald >= 3
        ? 'elke hoofdmaaltijd prikkelt de aanmaak'
        : `onder ${LEUCINEDREMPEL_G} g komt de spieraanmaak nauwelijks op gang`,
    })
  }

  const sessies = v.krachtsessies
  if (sessies == null) {
    uit.push({
      wat: 'Krachttraining', stand: 'onbekend', waarde: '',
      toelichting: 'nog geen sessies bijgehouden',
    })
  } else {
    uit.push({
      wat: 'Krachttraining',
      stand: sessies >= v.krachtdoel ? 'goed' : 'let',
      waarde: `${sessies} van de ${v.krachtdoel} deze week`,
      toelichting: sessies >= v.krachtdoel
        ? 'de prikkel die spier vasthoudt staat'
        : 'krachttraining is de sterkste van de drie hefbomen',
    })
  }

  const traag = stoeltestTraag(v.stoeltestSeconden)
  if (traag == null) {
    uit.push({
      wat: 'Opstaan uit een stoel', stand: 'onbekend', waarde: '',
      toelichting: 'nog niet gedaan: vijf keer opstaan, met een stopwatch',
    })
  } else {
    const oud = (v.stoeltestDagenGeleden ?? 0) > 90
    uit.push({
      wat: 'Opstaan uit een stoel',
      stand: traag ? 'let' : oud ? 'onbekend' : 'goed',
      waarde: `${Math.round(v.stoeltestSeconden as number)} seconden`,
      toelichting: traag
        ? `boven de ${STOELTEST_GRENS_S} seconden. Bespreek dit met je huisarts`
        : oud ? 'ouder dan drie maanden; doe hem opnieuw'
        : `onder de ${STOELTEST_GRENS_S} seconden`,
    })
  }

  if (v.sarcf && sarcfsignaal(v.sarcf)) {
    uit.push({
      wat: 'Vragenlijst',
      stand: 'let',
      waarde: `${sarcfscore(v.sarcf)} van de 10`,
      toelichting: sarcfscore(v.sarcf) >= SARCF_UITSLUITEN
        ? 'genoeg om het na te laten kijken'
        : 'één of meer klachten genoemd; op zichzelf nog geen aanwijzing',
    })
  }

  return uit
}

/**
 * WAT HIER NIET BEWEZEN IS, EN DAT HOORT OP HET SCHERM
 *
 * De richting van het bewijs is sterk: meer eiwit en krachttraining behouden
 * meer vetvrije massa dan minder. De grootte is zwak. In één overzicht van
 * twintig studies vond er slechts drie een significant verschil in verlies van
 * vetvrije massa tussen eiwitgroepen, en maar één daarvan ging over mensen boven
 * de vijftig.
 *
 * Een app die zegt "1,6 gram per kilo behoudt je spieren" belooft daarom meer
 * dan het bewijs draagt. Deze zin staat hier zodat hij ook op het scherm komt.
 */
export const SPIER_VOORBEHOUD =
  'De richting hiervan is goed onderbouwd, de grootte niet: van twintig studies '
  + 'naar eiwit en vetvrije massa vonden er drie een duidelijk verschil, en maar '
  + 'één ging over mensen boven de vijftig. Dit zijn de beste hefbomen die er zijn, '
  + 'geen garantie.'
