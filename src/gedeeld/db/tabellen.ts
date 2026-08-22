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

export interface Instellingen {
  olie_g?: number
  olie_gewogen?: boolean
  melk_ml?: number
  melk_soort?: 'mager' | 'half' | 'vol'
  melk_gemeten?: boolean
  rookt?: boolean
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
