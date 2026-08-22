/**
 * DE VORMEN VAN DE LEERSTOF EN DE ONDERDELEN
 *
 * De bestanden hiernaast zijn gegevens, geen code: ze zijn ongewijzigd
 * overgenomen uit de oude pagina (zie gereedschap/oud/bunyan-index.html) en
 * alleen van een type voorzien. Eén uitzondering die er echt code van maakt:
 * `check` is een functie die de uitslag van het programma van het kind
 * nakijkt. Dat kan geen JSON zijn en hoort dat ook niet te zijn — elke opdracht
 * kijkt op zijn eigen manier na, en die manier hoort bij de opdracht.
 */
import type { Uitslag } from '../minipy'

/** De drie talen die de editor aankan. */
export type Taal = 'py' | 'js' | 'html'

/** Wat de editor teruggeeft na een run; ook wat `check` te zien krijgt. */
export interface Draaiuitslag {
  ok: boolean
  uit: string[]
  fout?: string | undefined
  /** Bij HTML en JS: de opgebouwde broncode, zodat een check erin kan kijken. */
  code?: string | undefined
}

export interface Opdracht {
  /** De vraag zelf; bevat HTML. */
  vraag: string
  /** Waar het kind mee begint. */
  start: string
  hint: string
  /** Kijkt na of het antwoord goed is. Krijgt de uitslag én de broncode,
   *  want bij HTML en CSS zit het antwoord in de code en niet in de uitvoer. */
  check: (r: Draaiuitslag, code: string) => boolean | undefined
  /** Wat er staat als het niet goed is. */
  fout: string
  taal?: Taal | undefined
  /** Voorgevulde regels voor het vak "Wat jij intypt". */
  invoer?: string | undefined
  /** Een uitgewerkte oplossing, waar die er is. */
  oplossing?: string | undefined
}

/** Begripsvraag: `o` zijn de opties, `j` de index van het juiste antwoord. */
export interface Vraag { v: string; o: string[]; j: number; u: string }

export interface Les {
  id: string
  t: string
  d: string
  /** De alinea's uitleg; bevatten HTML. */
  uitleg: string[]
  voorbeeld?: string | undefined
  /** De taal van het voorbeeld; de opdracht kan er zijn eigen hebben. */
  taal?: Taal | undefined
  opdracht?: Opdracht | undefined
  vragen?: Vraag[] | undefined
  /** Een grotere opdracht die zwaarder telt in de punten. */
  project?: boolean | undefined
}

export interface Blok {
  id: string
  n: string
  ico: string
  u: string
  lessen: Les[]
}

/* ---------------------------------------------------------- de bouwbank ---- */

export interface Deel {
  id: string
  n: string
  d: string
  prijs: number
  ico?: string | undefined
  /** Ruwe maat voor snelheid, alleen om mee te vergelijken. */
  punten?: number | undefined
  /** Wat het onderdeel ongeveer trekt onder belasting. */
  watt?: number | undefined
  socket?: string | undefined
  ram?: string | undefined
  /** Bij geheugen: DDR4 of DDR5 — het bord moet erbij passen. */
  soort?: string | undefined
  duo?: boolean | undefined
  maat?: string | undefined
  maten?: string[] | undefined
  maxLengte?: number | undefined
  lengte?: number | undefined
  gb?: number | undefined
  tb?: number | undefined
  snel?: number | undefined
}

export type Soortdeel = 'cpu' | 'mobo' | 'gpu' | 'ram' | 'opslag' | 'psu' | 'kast'

export interface Game { id: string; n: string; ico: string; zwaarte: number; cpuDeel: number }
export interface Scherm { id: string; n: string; f: number }

export type { Uitslag }
