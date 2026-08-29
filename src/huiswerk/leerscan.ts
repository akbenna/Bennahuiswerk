/**
 * DE UITSLAG VAN DE LEERSCAN
 *
 * Rekenwerk zonder scherm eromheen, zodat het te toetsen is: antwoorden erin,
 * een profiel eruit.
 *
 * DE BANDEN
 *
 * Drie vragen per dimensie, elk 0 tot 2 punten, dus 0 tot 6 per dimensie.
 *
 *   0–2  hier valt het meeste te winnen
 *   3–4  kan sterker
 *   5–6  dit doe je al goed
 *
 * Waarom niet fijner verdeeld: drie vragen dragen niet meer nauwkeurigheid dan
 * dit. Een schaal van 0 tot 100 zou een precisie suggereren die er niet is, en
 * dan gaat een kind volgende maand het verschil tussen 61 en 64 zitten uitleggen.
 *
 * WAT ER BOVENAAN KOMT
 *
 * De zwakste dimensie, en bij gelijke stand de dimensie die het meeste oplevert.
 * Die volgorde is niet willekeurig: van de vijf heeft jezelf overhoren het
 * grootste effect, daarna spreiden. Beginnen staat achteraan omdat het geen
 * leertechniek is maar een voorwaarde — al helpt de beste techniek niets als een
 * kind niet begint, dus als dát het zwakst is komt het alsnog bovenaan.
 *
 * EN ÉÉN DING TEGELIJK
 *
 * `advies()` geeft één kop-advies terug, niet vijf. Een kind dat vijf dingen
 * moet veranderen verandert er nul.
 */
import { DIMENSIES, SCANVRAGEN } from './gegevens/leerscan'
import type { Dimensie, Dimensiekaart } from './gegevens/leerscan'

/** Wat er van een afgeronde scan bewaard wordt. */
export interface Leerscan {
  /** Wanneer hij gedaan is. */
  tijd: number
  /** Per vraag-id het gekozen antwoord: 0, 1 of 2. */
  antwoorden: Record<string, number>
}

export type Band = 0 | 1 | 2

export interface Uitkomst {
  dim: Dimensie
  kaart: Dimensiekaart
  /** 0 tot 6. */
  punten: number
  /** Hoeveel vragen van deze dimensie beantwoord zijn. */
  beantwoord: number
  band: Band
}

/* De volgorde waarin winst te halen is, sterkste effect eerst. Gebruikt om
   gelijke stand te breken. */
const GEWICHT: Dimensie[] = ['ophalen', 'spreiden', 'nakijken', 'mengen', 'beginnen']

export const bandVan = (punten: number): Band =>
  (punten <= 2 ? 0 : punten <= 4 ? 1 : 2)

/** Is de scan volledig ingevuld? */
export const isAf = (scan: Leerscan | null | undefined): boolean =>
  !!scan && SCANVRAGEN.every((v) => typeof scan.antwoorden[v.id] === 'number')

/**
 * De vijf dimensies met hun score, zwakste eerst. Ontbrekende antwoorden tellen
 * als nul punten maar worden apart geteld, zodat een half ingevulde scan niet
 * stiekem als "hier valt veel te winnen" wordt gelezen.
 */
export function uitkomsten(scan: Leerscan): Uitkomst[] {
  const lijst = DIMENSIES.map((kaart) => {
    const eigen = SCANVRAGEN.filter((v) => v.dim === kaart.dim)
    let punten = 0
    let beantwoord = 0
    for (const v of eigen) {
      const a = scan.antwoorden[v.id]
      if (typeof a !== 'number') continue
      beantwoord++
      punten += Math.max(0, Math.min(2, Math.round(a)))
    }
    return { dim: kaart.dim, kaart, punten, beantwoord, band: bandVan(punten) }
  })
  return lijst.sort((a, b) =>
    a.punten - b.punten || GEWICHT.indexOf(a.dim) - GEWICHT.indexOf(b.dim))
}

export interface Advies {
  /** Waar dit kind het meeste te winnen heeft. */
  kop: Uitkomst
  /** De zin die daarbij hoort. */
  tekst: string
  /** Waar in de app het meteen kan. */
  inDeApp: string
  /** Wat al goed gaat — één ding, om mee te openen. */
  sterk: Uitkomst | null
}

/**
 * Eén advies, niet vijf. `sterk` is de hoogste dimensie, maar alleen als die
 * echt in de bovenste band zit: een compliment over iets wat matig gaat is
 * geen compliment.
 */
export function advies(scan: Leerscan): Advies {
  const lijst = uitkomsten(scan)
  const kop = lijst[0] as Uitkomst
  const hoogste = [...lijst].reverse()[0] as Uitkomst
  return {
    kop,
    tekst: kop.kaart.advies[kop.band],
    inDeApp: kop.kaart.inDeApp,
    sterk: hoogste.band === 2 && hoogste.dim !== kop.dim ? hoogste : null,
  }
}

/** Kort label bij een band, voor op het scherm. */
export const bandNaam = (b: Band): string =>
  (b === 0 ? 'hier valt het meeste te winnen' : b === 1 ? 'kan sterker' : 'dit doe je al goed')
