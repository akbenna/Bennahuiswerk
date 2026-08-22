/**
 * WAT ER IN DE GEGEVENS ZIT
 *
 * Eén plek voor de vormen die overal terugkomen. De velden houden hun korte
 * namen — `p`, `v`, `t`, `q`, `a` — omdat ze zo in zestienhonderd opgaven staan
 * en in ieders opslag; hernoemen kost hier niets en levert daar een migratie op
 * die niemand wil.
 */

/** Een tekening bij een opgave. Welke velden meedoen hangt af van `type`; de
 *  figuurcomponent kijkt zelf wat hij nodig heeft, en wat ontbreekt tekent hij
 *  als een vraagteken — dat is precies de bedoeling bij "hoe lang is deze
 *  zijde?". */
export interface Illustratie {
  type: string
  [veld: string]: unknown
}

/** Eén opgave. `q` is de vraag, `a` het antwoord, `alt` alles wat óók goed is. */
export interface Opgave {
  id: string
  /** Het profiel waar hij bij hoort. */
  p: string
  /** Het vak. */
  v: string
  /** Het onderwerp. */
  t: string
  /** Het niveau: 1, 2 of 3. */
  lvl?: number
  q: string
  a: string
  alt?: string[]
  /** Meerkeuze: als dit er staat komen er knoppen in plaats van een invoerveld. */
  opties?: string[]
  /** De eenheid, achter het invoerveld. */
  u?: string
  h?: string[]
  /** De uitwerking, met regeleindes. */
  s?: string
  ill?: Illustratie
  /** `next` = stof van volgend jaar; die doet niet mee tenzij erom gevraagd wordt. */
  jaar?: string
}

/** Wat een sjabloon per beurt oplevert: een opgave zonder id. */
export type Opgaveinhoud = Omit<Opgave, 'id' | 'p' | 'v' | 't' | 'lvl' | 'jaar'>

/** Het toeval waarmee een sjabloon zijn getallen kiest. Als argument, niet uit
 *  `Math.random`, zodat een sjabloon te toetsen is. */
export interface Toeval {
  /** Een heel getal van a tot en met b. */
  ri: (a: number, b: number) => number
  pick: <T>(a: readonly T[]) => T
  shuffle: <T>(a: readonly T[]) => T[]
}

/** Een opgave met wisselende getallen. Het id blijft gelijk: de Leitner-kaart
 *  hoort bij het sjabloon en niet bij de getallen van vandaag. */
export interface Sjabloon {
  id: string
  p: string
  v: string
  t: string
  lvl?: number
  jaar?: string
  gen: () => Opgaveinhoud
}

/** Een opgave zoals hij op het scherm komt: een vaste opgave, of één beurt van
 *  een sjabloon. */
export type Kaart = Opgave | Sjabloon

export interface Profielkaart {
  naam: string
  niveau: string
  volgend: string
  emoji: string
  kleur: string
  vakken: string[]
  thema?: string
  beloning?: boolean
}

/** Een rang: vanaf hoeveel punten, hoe hij heet, en met welk teken. */
export type Rang = [number, string, string]

export interface Thema {
  xp: string
  doel: string
  goal: string
  feest: string[]
  rangen: Rang[]
}
