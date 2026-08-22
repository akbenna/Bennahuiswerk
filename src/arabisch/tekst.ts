/**
 * TEKST — nakijken, vocaliseren, en de vier letterVormen
 *
 * OVER HET NAKIJKEN
 *
 * Een leerling die "kitab" typt in plaats van "kitāb" heeft het goed.
 * Strengheid op diakritische tekens meet typvaardigheid, niet taalkennis, en
 * dat is niet wat deze app wil weten. Het Nederlands gaat daarom door een
 * normalisatie die de streepjes en de ayn-tekens weghaalt; het Arabisch door
 * een normalisatie die de klinkertekens weghaalt en de alif-varianten
 * gelijkschakelt. Wat overblijft is het skelet dat telt.
 */
import { LETTERS } from './gegevens/letters'

/* Fatha tot en met sukun, de dagger-alif en de tatweel. */
const TASHKIL = /[ً-ْٰـ]/g

export const ontdoeTashkil = (s: string): string => String(s).replace(TASHKIL, '')

export function normNl(s: string): string {
  return String(s).toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') /* ā→a, ḥ→h, ṣ→s */
    .replace(/[ʿʾ'`´’‘]/g, '') /* ayn- en hamza-tekens */
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

export function normAr(s: string): string {
  return ontdoeTashkil(String(s).trim())
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
}

/** Klopt het getypte antwoord met een van de goede antwoorden? */
export function antwoordKlopt(gegeven: string, juisteLijst: string[]): boolean {
  const g1 = normNl(gegeven)
  const g2 = normAr(gegeven)
  return juisteLijst.some((j) => {
    const jn = normNl(j)
    if (jn && jn === g1) return true
    if (/[؀-ۿ]/.test(j) && normAr(j) === g2) return true
    return false
  })
}

/** Woorden waarvan het skelet zonder klinkertekens meer dan één woord kan zijn. */
export const AMBIGU = new Set([
  'كتب', 'علم', 'قتل', 'درس', 'فعل', 'حسن', 'ملك', 'قدر', 'ذكر',
  'عمل', 'كفر', 'نور', 'حكم', 'جمع', 'سلم', 'قرأ', 'فهم',
])

export type Vocalisatie = 'vol' | 'kaal' | 'selectief'

/**
 * De klinkertekens tonen, weglaten, of alleen waar het woord zonder die tekens
 * dubbelzinnig wordt. Dat laatste is wat een echte tekst doet: de tekens staan
 * er alleen waar ze nodig zijn.
 */
export function vocaliseer(ar: string, stand: Vocalisatie): string {
  if (stand === 'vol') return ar
  if (stand === 'kaal') return ontdoeTashkil(ar)
  return ar.split(' ').map((woord) => {
    const kaal = ontdoeTashkil(woord).replace(/^ال/, '')
    return AMBIGU.has(kaal) || AMBIGU.has(ontdoeTashkil(woord)) ? woord : ontdoeTashkil(woord)
  }).join(' ')
}

const AR_TEKENS = '؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿'
const AR_RUN = new RegExp('[' + AR_TEKENS + '](?:[' + AR_TEKENS + '‍ ]*[' + AR_TEKENS + '])?', 'g')

/**
 * Wikkelt losse Arabische stukken die middenin Nederlandse tekst staan in een
 * eigen isolatie-element. Zonder dat springen de leestekens rond een Arabisch
 * woord naar de verkeerde kant — een punt die vóór de zin belandt.
 */
export const arIn = (html: string | null | undefined): string =>
  String(html ?? '').replace(AR_RUN, (m) => `<span class="arin${m.length > 16 ? ' lang' : ''}">${m}</span>`)

/* Zero-width joiner: dwingt de vorm af zonder de Unicode-presentatietekens
   (U+FE80..), die door sommige fonts slecht gedekt worden. */
const ZWJ = '‍'

export interface Lettervorm {
  los: string
  begin: string
  midden: string
  eind: string
  verbindtLinks: boolean
}

/** De vier schrijfvormen van een letter. */
export function letterVormen(l: string): Lettervorm {
  const vl = LETTERS.find((x) => x.l === l)?.vl
  return {
    los: l,
    begin: vl ? l + ZWJ : l,
    midden: vl ? ZWJ + l + ZWJ : ZWJ + l,
    eind: ZWJ + l,
    verbindtLinks: Boolean(vl),
  }
}
