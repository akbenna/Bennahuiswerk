/**
 * DE TABELLEN VAN KALIBRATIE, ZOALS ZE ECHT ZIJN
 *
 * Handgeschreven en niet gegenereerd. Het gereedschap van Supabase levert voor
 * dit project een bestand van ruim een megabyte, want daar zit het hele
 * ProVita-schema in: patiënten, behandelaars, intakes, honderd tabellen waar
 * deze app niets mee te maken heeft. Wat hieronder staat is precies wat de
 * negen apps aanraken, uit `information_schema` overgenomen op 22 augustus 2026.
 *
 * Een uitroepteken in de databasekolom betekent NOT NULL; hier staat dan geen
 * `| null`. Dat onderscheid is de reden dat dit bestand bestaat: het verschil
 * tussen `gewicht_kg: number` en `gewicht_kg: number | null` is precies het
 * verschil tussen een grafiek die klopt en een grafiek met een gat erin.
 */

/** JJJJ-MM-DD. Los type omdat een datum in dit systeem nooit een Date is: de
 *  weegreeks is een reeks dagen en geen reeks tijdstippen, en een tijdzone die
 *  ertussen komt verschuift een weging naar de verkeerde dag. */
export type IsoDatum = string

export type Geslacht = 'm' | 'v'
export type Fase = 'afvallen' | 'onderhoud' | 'pauze'
export type Moment = 'ontbijt' | 'lunch' | 'diner' | 'tussendoor' | 'onbekend'
export type Graad = 'A' | 'B' | 'C' | 'D'
export type RegelBron =
  | 'handmatig' | 'recept' | 'bibliotheek' | 'tekst-ai' | 'foto-ai' | 'import' | 'nevo'
  /* 'merk' is een etiketwaarde van een fabrikant. Bewust géén 'nevo': dat zou de
     app laten beweren dat er een laboratoriumbepaling achter zit. Zie
     health/database/19-merkregels.sql voor de bijbehorende constraint. */
  | 'merk'

/**
 * DE CONDITIE — wat er bij deze gebruiker speelt.
 *
 * Deze twee typen staan hier en niet bij de logica in `src/health/conditie.ts`,
 * omdat ze de vorm van een kolom beschrijven: ze wonen in `instellingen` en
 * gaan als zodanig over de lijn. De logica die eraan hangt staat wél daar.
 *
 * Groepen en geen middelen, en waarom dat zo is, staat in `conditie.ts`.
 */
export type Medicatiegroep = 'insuline' | 'su' | 'sglt2' | 'glp1' | 'ras' | 'diureticum'

export interface Conditie {
  /** Hoge bloeddruk, of daarvoor behandeld. */
  hypertensie?: boolean
  /** Diabetes mellitus type 2. */
  dm2?: boolean
  /** Doorgemaakte hart- of vaatziekte. */
  hvz?: boolean
  /** Zelfopgave, en dus nadrukkelijk geen medicatieoverzicht. */
  med?: Medicatiegroep[]
}

/**
 * DE VOORKEUREN — wat iemand wel en niet voorgeschoteld wil krijgen.
 *
 * Staat hier om dezelfde reden als `Conditie` hierboven: het is de vorm van wat
 * er in `instellingen` bewaard wordt en over de lijn gaat. De regels — wat een
 * eetpatroon voorstelt, hoe hard een uitsluiting is, hoeveel een duwtje mag
 * verschuiven — staan in `src/health/voorkeuren.ts`, met de proeven erbij.
 *
 * De groepen zijn `string` en geen opsomming van de zevenentwintig. Dat is
 * bewust: wat hier binnenkomt is wat er ooit bewaard is, en een tabel kan
 * veranderen. Een opgeslagen groep die niet meer bestaat hoort geen typefout te
 * geven maar gewoon niets uit te sluiten — zie `groepenOver` daar.
 */
export type Eetpatroon = 'alles' | 'pescotarisch' | 'vegetarisch' | 'veganistisch'

export interface Voorkeuren {
  patroon: Eetpatroon
  /** Groepen die nooit voorgesteld worden. Verwijdert. */
  nooit: readonly string[]
  /** Groepen die je liever ziet. Verschuift, begrensd. */
  liever: readonly string[]
  /** Groepen die je liever niet ziet. Verschuift, begrensd. */
  minder: readonly string[]
  /**
   * Keukens waaruit geen gerecht voorgesteld wordt. De zes waarden van
   * `cultural_dishes.cuisine`, niet de tabelgroepen — dit gaat over gerechten.
   * Ontbreekt het veld, dan staat er niets uit.
   */
  keukens?: readonly string[]
  /**
   * Losse producten die je nooit meer voorgesteld wilt krijgen, op NEVO-code.
   *
   * De zevenentwintig groepen zijn grof: wie geen spruitjes lust moet anders
   * heel "Groente" uitzetten. Dit is de fijne knop ernaast, en hij wordt niet
   * ingevuld in een vragenlijst maar op het moment dat het voorstel voor je
   * neus staat.
   */
  nietProduct?: readonly string[]
}

export interface Instellingen {
  olie_g?: number
  olie_gewogen?: boolean
  melk_ml?: number
  melk_soort?: 'mager' | 'half' | 'vol'
  melk_gemeten?: boolean
  rookt?: boolean
  conditie?: Conditie
  voorkeuren?: Voorkeuren
}

export interface Profiel {
  lengte_cm: number
  geboortedatum: IsoDatum | null
  leeftijd_jaar: number | null
  geslacht: Geslacht
  start_gewicht_kg: number | null
  doel_gewicht_kg: number | null
  tempo_pct_week: number
  eiwit_g_per_kg: number
  etniciteit: string | null
  fase: Fase
  onderhoud_basis_kg: number | null
  instellingen: Instellingen
}

export interface Dag {
  datum: IsoDatum
  gewicht_kg: number | null
  gewicht_bron: string | null
  stappen: number | null
  actieve_energie_kcal: number | null
  fiets_min: number | null
  slaap_min: number | null
  slaap_kwaliteit: number | null
  bedtijd: string | null
  waaktijd: string | null
  kracht: boolean
  notitie: string | null
  bron: string
}

export interface Regel {
  id: string
  datum: IsoDatum
  moment: Moment
  naam: string
  hoeveelheid: number | null
  eenheid: string | null
  gram_equivalent: number | null
  kcal_punt: number
  kcal_laag: number | null
  kcal_hoog: number | null
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  conf: Graad
  onzekerheidsbronnen: string[] | null
  bron: RegelBron
  nevo_code: string | null
  dish_id: string | null
  recept_id: string | null
  foto_pad: string | null
  ruwe_invoer: string | null
  ai_model: string | null
}

export interface EigenProduct {
  id: string
  naam: string
  per: number
  eenheid: string
  kcal: number
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  conf: Graad
  tag: string | null
  nevo_code: string | null
}

export interface Meting {
  id: string; datum: IsoDatum; soort: string; waarde: number
  eenheid: string | null; notitie: string | null
}
export interface Lab {
  id: string; datum: IsoDatum; code: string; naam: string | null
  waarde: number | null; eenheid: string | null
  ref_laag: number | null; ref_hoog: number | null; notitie: string | null
}
export interface Training {
  id: string; datum: IsoDatum; oefening: string; spiergroep: string | null
  sets: number | null; reps: number | null; gewicht_kg: number | null
  rpe: number | null; notitie: string | null
}
export interface Vragenlijst {
  id: string; datum: IsoDatum; soort: string
  antwoorden: Record<string, unknown>; score: number | null; klasse: string | null
}
export interface Recept {
  id: string; naam: string; toelichting: string | null
  porties: number; dish_id: string | null; volgt_profiel: boolean
}
