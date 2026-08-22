/* De vormen van de leerstof. Deze bestanden zijn gegevens, geen code: ze zijn
   ongewijzigd overgenomen uit de oude pagina (zie gereedschap/oud/sanad-index.html)
   en alleen van een type voorzien. Wie de inhoud wil nakijken, leest daar mee. */

export type Kleur = 'blue' | 'green' | 'purple' | 'red' | 'yellow'

/** Een fragment uit een oorspronkelijk werk, met vertaling en verantwoording. */
export interface Matn {
  /** Arabische tekst; een ¶ markeert een scheiding tussen losse regels. */
  ar: string
  /** Nederlandse vertaling. */
  nl: string
  /** Waar het vandaan komt, met keten of editie. Bevat HTML. */
  bron: string
  /** Woordanker: paren [Arabisch woord, betekenis]. */
  g?: Array<[string, string]>
  /** Waarom juist dit fragment. Bevat HTML. */
  w?: string
}

/** Een narratieve sectie binnen een module. `h` is HTML. */
export interface Sectie { t: string; h: string }

/** Begripstoets: één vraag, vier opties, `j` is de index van het juiste antwoord. */
export interface Toets { v: string; o: string[]; j: number; u: string }

export interface Module {
  id: string
  titel: string
  /** Richttijd in minuten. */
  tijd: number
  secties: Sectie[]
  check: Toets
}

export interface Spoor {
  id: string
  /** Romeins bloknummer zoals het in de kop staat. */
  nr: string
  kleur: Kleur
  titel: string
  ondertitel: string
  intro: string
  modules: Module[]
}

/** Per module-id: de kernvraag, de brontekst(en) en de toepassingsopdracht. */
export interface Extra {
  kern: string
  matn: Matn[]
  doe: string
}

/** Een consolidatieweek. `na` is het spoor-id waarop de week volgt. */
export interface Consolidatie {
  na: string
  titel: string
  kern: string
  matn: Matn
  taken: string[]
  slot: string
}

/** Kenniskaart. `s` is het spoor-id; `v` de voorkant, `a` de achterkant (HTML). */
export interface Kaart { id: string; s: string; v: string; a: string }

/** Een werk uit de traditie. `d` is de discipline, `n` het niveau. */
export interface Bron {
  t: string
  ar: string
  au: string
  /** Sterfjaar van de auteur, hidjri/gregoriaans. */
  j: string
  d: string
  n: 'begin' | 'kern' | 'gevorderd'
  o: string
}

/** Lexiconterm: `t` de transcriptie, `ar` het Arabisch, `u` de uitleg. */
export interface Term { t: string; ar: string; u: string }
