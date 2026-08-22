/**
 * DE VORMEN VAN DE LEERSTOF
 *
 * De bestanden hiernaast zijn gegevens, geen code: ze zijn ongewijzigd
 * overgenomen uit de oude pagina (zie gereedschap/oud/arabisch-index.html) en
 * alleen van een type voorzien.
 */

/** Spoor 1 is 7–9 jaar, 2 is 10–12, 3 is 13–15, 4 is volwassen. */
export type Spoor = 1 | 2 | 3 | 4

export interface Letter {
  l: string
  n: string
  /** Transcriptie. */
  tr: string
  /** Klankbeschrijving. */
  k: string
  /** Uitspraakhulp in het Nederlands. */
  u: string
  /** Zonneletter: de lam van het lidwoord assimileert. */
  zon: boolean
  /** Verbindt naar links. */
  vl: boolean
  moeilijk: boolean
  vb: string
}

export interface Teken { t: string; n: string; tr: string; u: string; demo: string }
export interface Extrateken { l: string; n: string; tr: string; u: string }

export interface Woord {
  /** Arabisch, gevocaliseerd. */
  a: string
  /** Transcriptie. */
  t: string
  /** Nederlands. */
  n: string
  /** Thema. */
  th: string
  /** Wortel. */
  b: string
  /** Geslacht. */
  g: string
  /** Meervoud. */
  mv: string
  /** Vanaf welk spoor. */
  s: number
  /** Terzijde over het Marokkaans. */
  d?: string | undefined
}

export interface Grammaticaoefening {
  k: string
  v: string
  o?: string[] | undefined
  j?: number | undefined
  u: string
  /** De goede antwoorden bij een typvraag. */
  jt?: string[] | undefined
}

export interface Grammatica {
  id: string
  sp: number
  titel: string
  kern: string
  tekst: string
  /** Voorbeelden: Arabisch, transcriptie, uitleg. Altijd drie. */
  vb: Array<[string, string, string]>
  oef: Grammaticaoefening[]
}

export interface Zin { a: string; t: string; n: string; n2: number; c: string }

export interface Leesvraag { v: string; o: string[]; j: number; u: string }

export interface Tekst {
  id: string
  n2: number
  titel: string
  ar: string
  nl: string
  gloss: Array<[string, string]>
  vraag: Leesvraag
}

export interface Koranwoord {
  a: string
  t: string
  n: string
  /** De wortel. */
  r: string
  /** Ordegrootte van het aantal voorkomens; rangorde, geen telling. */
  f: number
  k: string
}

export interface Sessiestap { id: string; min: number; t: string; wat: string }
export interface Blok { n: number; weken: [number, number]; t: string; u: string }

export interface Geloofsstuk { t: string; ar: string; tr: string; x: string }

export interface Week {
  n: number
  t: string
  letters?: string[] | undefined
  doel: string
  lezen: string[]
  geloof: Geloofsstuk
  focus?: string | undefined
  /** Bij welk bloknummer de toets hoort. */
  toets?: number | undefined
}

export interface Metingvraag { v: string; ar: string; o: string[]; a: number; g: string }
export interface Metingniveau { min: number; niveau: number; week: number; t: string; u: string }
