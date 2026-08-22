/**
 * DE VORMEN VAN DE LEERSTOF
 *
 * De bestanden hiernaast zijn gegevens, geen code: ze zijn ongewijzigd
 * overgenomen uit de oude pagina (zie gereedschap/oud/noer-index.html) en
 * alleen van een type voorzien. Teksten met opmaak zijn HTML; wie de inhoud
 * wil nakijken leest daar mee.
 */

/** Welk spoor: 1 is 7–9 jaar, 2 is 10–12, 3 is 13 en ouder. */
export type Spoor = 1 | 2 | 3

/** Waar een onderdeel staat: verplicht, aanbevolen, of ná de slotgroet. */
export type Soortdeel = 'fard' | 'sunna' | 'na'

/** Meerkeuzevraag: `o` zijn de opties, `a` de index van het juiste antwoord. */
export interface Vraag { v: string; o: string[]; a: number; u: string }

export interface Les {
  id: string
  t: string
  ar?: string | undefined
  /** Vanaf welk spoor deze les meedoet. */
  sp: number
  /** De alinea's van de gewone tekst; HTML. */
  tk: string[]
  /** De kortere versie voor de jongsten; HTML. */
  jr?: string | undefined
  /** De verdieping voor de oudsten; HTML. */
  dp: string
  /** Tafereel-id's om bij de les te tekenen. */
  zie?: string[] | undefined
  q: Vraag[]
  /** Oefenkaartjes: [voorkant, achterkant]. */
  kt?: Array<[string, string]> | undefined
  /** Een zin om samen over te praten. */
  praat?: string | undefined
}

export interface Module {
  id: string
  t: string
  ar: string
  ico: string
  lead: string
  lessen: Les[]
}

/* ------------------------------------------------------------- de wassing -- */

/** Een tekst om te zeggen: Arabisch, transcriptie en betekenis. */
export interface Zegtekst {
  ar: string
  tr: string
  nl: string
  /** Verwijzing naar een audiofragment of naar een tekst uit T. */
  aid?: string | undefined
  uit?: string | undefined
  naam?: string | undefined
  keer?: string | undefined
}

export interface Wudustap {
  id: string
  t: string
  /** Welk lichaamsdeel oplicht in de tekening. */
  deel: string
  soort: Soortdeel
  kort: string
  tip: string
  hoe: string[]
  zeg?: Zegtekst | undefined
  aantal?: string | undefined
}

/* ------------------------------------------------------------- het gebed -- */

export interface Gebedstap {
  k: string
  t: string
  /** Welke houding erbij getekend wordt. */
  h: string
  /** Waar de houding in beeld staat, of niets. */
  merk: number[] | null
  soort: Soortdeel
  doe: string[]
  /** Sleutel in T van wat je zegt. */
  zeg?: string | undefined
  zeg2?: string | undefined
  /** Extra teksten, als sleutels in T. */
  extra?: string[] | undefined
  let?: string | undefined
}

export interface Gebed {
  id: string
  naam: string
  ar: string
  rak: number
  tijd: string
  hardop: string
  sunnaVoor: string
  sunnaNa: string
  extra: string
}

export interface Nafila { n: string; ar: string; r: string; w: string; u: string }

/** Iets wat naast het gebed staat: wel bekend, niet verplicht. */
export interface Naast { zeg: string; t: string; w: string; u: string }

/* --------------------------------------------------------- uit je hoofd -- */

export interface Hifz {
  id: string
  naam: string
  ar: string
  /** Soeranummer, als het een soera is. */
  nr?: number | undefined
  aya?: number | undefined
  soort: 'soera' | 'gebed'
  waarom: string
  /** Per regel: [Arabisch, klank, betekenis] en soms de uitspraak in
   *  lettergrepen als vierde. */
  r: Array<[string, string, string] | [string, string, string, string]>
}

export interface Dua { w: string; ar: string; tr: string; nl: string }

/* ------------------------------------------------- de bijzondere gebeden -- */

export interface Regelsoort { t: string; c: string }

export interface Onderwerp {
  id: string
  n: string
  ar: string
  /** Sleutel in REGELS. */
  regel: string
  rak: string
  kort: string
  wanneer: string
  hoe: string[]
  let: string
  tips: string[]
  /** Vraag en antwoord: [vraag, antwoord]. */
  vragen: Array<[string, string]>
  /** Sleutels in T van wat er gezegd wordt. */
  zeg: string[]
}

export interface Rouwstap { t: string; d: string; zeg?: string[] | undefined }
export interface Fout { v: string; a: string }

/* ---------------------------------------------------------- de beloning -- */

export type Niveau = readonly [punten: number, naam: string, ico: string]
export interface Insigne { id: string; n: string; ico: string; u: string }
