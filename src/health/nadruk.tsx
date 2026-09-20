/**
 * DE GETALLEN LATEN OPVALLEN, EN ALLEEN DE GETALLEN
 *
 * Het naslagvenster is een lopend verhaal, en juist daarin verdwijnen de
 * getallen: "ongeveer 40 procent van het verlies was vetvrije massa" leest als
 * één grijze regel, terwijl de veertig procent het hele punt is. Wie iets
 * opzoekt wil dat in één blik zien en pas daarna de zin eromheen.
 *
 * Met de hand vetzetten zou werken en gaat mis: de teksten worden bijgewerkt,
 * en dan staat de nadruk op het oude getal. Het gebeurt hier dus bij het
 * tekenen, en de regel eronder is te toetsen.
 *
 * WAT ER NIET DIK MAG WORDEN, EN WAAROM DAT DE HELE MOEILIJKHEID IS
 *
 * Een cijfer is niet hetzelfde als een getal. In deze teksten staan `STEP-1`,
 * `GLP-1`, `Keer Diabetes2 Om` en `augustus 2026`, en geen van vieren is een
 * hoeveelheid. Vet gezet zouden ze de aandacht trekken van precies de getallen
 * waar het om gaat.
 *
 * Daarom drie voorwaarden, en ze zijn alle drie nodig:
 *
 *   1. Een getal telt alleen als er links en rechts geen letter, cijfer of
 *      koppelteken tegenaan staat. Dat haalt `STEP-1` en `Diabetes2` eruit.
 *   2. De eenheid erachter hoort erbij, anders staat "40" dik en "procent"
 *      dun, en dat leest als twee dingen.
 *   3. Een kaal jaartal is geen hoeveelheid. `2026` zonder eenheid blijft dus
 *      gewoon staan.
 *
 * En één eigenschap boven alles: de tekst zelf verandert niet. Wat er in gaat
 * komt er letterlijk weer uit, alleen in stukken geknipt. Dat is de proef die
 * ertoe doet, want een nadrukregel die stilletjes een woord opeet is erger dan
 * geen nadruk.
 */
import { Fragment, type ReactNode } from 'react'

/** Wat er ná een getal nog bij de hoeveelheid hoort. */
const EENHEDEN = [
  'procent', '%', 'gram', 'kilo', 'kcal', 'kilogram',
  'jaar', 'maanden', 'maand', 'weken', 'week', 'dagen', 'dag', 'uur', 'minuten',
  'keer', 'deelnemers', 'studies', 'onderzoeken', 'sets',
].join('|')

/**
 * Een hoeveelheid: een getal, eventueel een bereik, eventueel met eenheid.
 * Staat als losse export zodat de proef hem kan aanwijzen.
 */
export const HOEVEELHEID = new RegExp(
  '(?<![\\p{L}\\d-])'
  + '\\d+(?:[.,]\\d+)?'
  + '(?:\\s+(?:tot|à|en)\\s+\\d+(?:[.,]\\d+)?)?'
  + '(?:\\s+(?:' + EENHEDEN + '))?'
  + '(?![\\p{L}\\d-])',
  'gu',
)

/** Een kaal jaartal is een plaatsbepaling en geen hoeveelheid. */
const jaartal = (stuk: string): boolean => /^(?:19|20)\d{2}$/.test(stuk)

export interface Stuk {
  tekst: string
  nadruk: boolean
}

/**
 * Knipt een zin in stukken, met bij elk stuk of het nadruk krijgt.
 *
 * De som van de stukken is weer de zin, letterlijk. Zie de kop.
 */
export function splitsHoeveelheden(tekst: string): Stuk[] {
  const uit: Stuk[] = []
  let laatst = 0
  for (const treffer of tekst.matchAll(HOEVEELHEID)) {
    const hele = treffer[0]
    if (jaartal(hele)) continue
    const begin = treffer.index
    if (begin > laatst) uit.push({ tekst: tekst.slice(laatst, begin), nadruk: false })
    uit.push({ tekst: hele, nadruk: true })
    laatst = begin + hele.length
  }
  if (laatst < tekst.length || !uit.length) {
    uit.push({ tekst: tekst.slice(laatst), nadruk: false })
  }
  return uit
}

/** Dezelfde zin, met de hoeveelheden eruit springend. */
export function metNadruk(tekst: string): ReactNode {
  return splitsHoeveelheden(tekst).map((s, i) => (
    s.nadruk
      ? <b key={i} className="hoeveelheid">{s.tekst}</b>
      : <Fragment key={i}>{s.tekst}</Fragment>
  ))
}
