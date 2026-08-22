/**
 * DE KLINISCHE MODULES
 *
 * Overgezet uit sectie 3 van de oude index.html zonder één coëfficiënt te
 * veranderen. Verantwoord in hoofdstuk 13 van VERANTWOORDING.md.
 *
 * Één ding is wél anders: `onderhoudZone()` gaf voorheen een CSS-variabele
 * terug. Een functie die een risico uitrekent hoort niet te weten welke kleur
 * het scherm gebruikt; die koppeling staat nu in het scherm.
 */
import type { Geslacht } from '@/gedeeld/db/tabellen'

export type Risicoklasse = 'laag' | 'matig' | 'hoog'

export interface Score2Invoer {
  leeftijd: number
  rook: boolean
  /** systolische bloeddruk, mmHg */
  sbd: number
  /** totaalcholesterol, mmol/l */
  tc: number
  /** HDL-cholesterol, mmol/l */
  hdl: number
  /** diabetes mellitus */
  dm: boolean
}

/**
 * SCORE2, laag-risicoregio (Nederland), mannen en vrouwen onder de zeventig.
 * Coëfficiënten uit Eur Heart J 2021;42:2439-54; deze implementatie
 * reproduceert de vier gepubliceerde rekenvoorbeelden exact.
 *
 * Buiten 40–69 jaar geeft hij `null` en niet een getal: SCORE2-OP is bewust
 * niet geïmplementeerd omdat de gevonden coëfficiëntenset het gepubliceerde
 * voorbeeld niet reproduceert.
 */
export function score2(
  geslacht: Geslacht,
  { leeftijd, rook, sbd, tc, hdl, dm }: Score2Invoer,
): { risico: number; klasse: Risicoklasse } | null {
  if (leeftijd < 40 || leeftijd > 69) return null
  const cage = (leeftijd - 60) / 5
  const csbp = (sbd - 120) / 20
  const ctc = tc - 6
  const chdl = (hdl - 1.3) / 0.5
  const r = rook ? 1 : 0
  const d = dm ? 1 : 0

  let x: number, base: number, s1: number, s2: number
  if (geslacht === 'm') {
    x = 0.3742 * cage + 0.6012 * r + 0.2777 * csbp + 0.6457 * d + 0.1458 * ctc - 0.2698 * chdl
      - 0.0755 * cage * r - 0.0255 * cage * csbp - 0.0281 * cage * ctc
      + 0.0426 * cage * chdl - 0.0983 * cage * d
    base = 0.9605; s1 = -0.5699; s2 = 0.7476
  } else {
    x = 0.4648 * cage + 0.7744 * r + 0.3131 * csbp + 0.8096 * d + 0.1002 * ctc - 0.2606 * chdl
      - 0.1088 * cage * r - 0.0277 * cage * csbp - 0.0226 * cage * ctc
      + 0.0613 * cage * chdl - 0.1272 * cage * d
    base = 0.9776; s1 = -0.738; s2 = 0.7019
  }

  const u = 1 - Math.pow(base, Math.exp(x))
  if (u <= 0 || u >= 1) return null
  const risico = (1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - u))))) * 100

  // NHG-CVRM, leeftijdsafhankelijk
  const klasse: Risicoklasse =
    leeftijd < 50
      ? risico < 2.5 ? 'laag' : risico < 7.5 ? 'matig' : 'hoog'
      : risico < 5 ? 'laag' : risico < 10 ? 'matig' : 'hoog'
  return { risico, klasse }
}

export interface Fib4Invoer {
  leeftijd: number
  asat: number
  alat: number
  trombo: number
}
export type Fib4Klasse = 'uitgesloten' | 'grijs' | 'verwijzen'

/**
 * FIB-4 (Sterling 2006), met de leeftijdsgrens uit de Richtlijn MASLD/MASH
 * 2024: onder 65 jaar sluit 1,3 uit, daarboven 2,0 (McPherson 2017).
 */
export function fib4(
  { leeftijd, asat, alat, trombo }: Fib4Invoer,
): { waarde: number; onder: number; klasse: Fib4Klasse } | null {
  if (!(leeftijd > 0 && asat > 0 && alat > 0 && trombo > 0)) return null
  const w = (leeftijd * asat) / (trombo * Math.sqrt(alat))
  const onder = leeftijd >= 65 ? 2.0 : 1.3
  const klasse: Fib4Klasse = w < onder ? 'uitgesloten' : w <= 2.67 ? 'grijs' : 'verwijzen'
  return { waarde: w, onder, klasse }
}

/**
 * STOP-BANG, officiële versie: BMI-drempel 35 (niet 30) en een
 * geslachtsspecifieke nekomtrek van 43 en 41 cm.
 */
export const STOPBANG = [
  ['snurken', 'Luid snurken — hoorbaar door een gesloten deur'],
  ['moe', 'Overdag vaak moe of slaperig'],
  ['apneu', 'Waargenomen ademstops, stikken of naar adem happen'],
  ['bloeddruk', 'Hoge bloeddruk, of daarvoor behandeld'],
  ['bmi', 'BMI boven 35'],
  ['leeftijd', 'Ouder dan 50'],
  ['nek', 'Nekomtrek 43 cm of meer (man) / 41 cm of meer (vrouw)'],
  ['man', 'Man'],
] as const satisfies ReadonlyArray<readonly [string, string]>

export type StopbangSleutel = (typeof STOPBANG)[number][0]
export type StopbangAntwoorden = Partial<Record<StopbangSleutel, boolean>>

export function stopbangScore(a: StopbangAntwoorden): { score: number; klasse: Risicoklasse } {
  const n = STOPBANG.filter(([k]) => a[k]).length
  const stop = (['snurken', 'moe', 'apneu', 'bloeddruk'] as const).filter((k) => a[k]).length
  let klasse: Risicoklasse = n <= 2 ? 'laag' : n <= 4 ? 'matig' : 'hoog'
  // Verfijning voor de matige groep; verhoogt de specificiteit.
  if (klasse === 'matig' && stop >= 2 && (a.man || a.bmi || a.nek)) klasse = 'hoog'
  return { score: n, klasse }
}

export type Onderhoudzone = 'groen' | 'geel' | 'rood'

/**
 * Onderhoud: het stoplicht uit STOP Regain (Wing 2006). Triggert op het
 * voortschrijdend gemiddelde, niet op de dagmeting — anders vuurt rood op
 * dagelijkse schommelingen van een tot twee kilo.
 */
export function onderhoudZone(
  trendGewicht: number | null,
  basis: number | null,
): { zone: Onderhoudzone; delta: number } | null {
  if (trendGewicht == null || basis == null) return null
  const d = trendGewicht - basis
  if (d < 1.4) return { zone: 'groen', delta: d }
  if (d < 2.3) return { zone: 'geel', delta: d }
  return { zone: 'rood', delta: d }
}
