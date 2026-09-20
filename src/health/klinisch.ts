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
  ['snurken', 'Luid snurken, hoorbaar door een gesloten deur'],
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

/**
 * VIER VAN DE ACHT VRAGEN KENT DEZE APP AL
 *
 * STOP-BANG vraagt naar vier dingen die niemand hoeft te schatten: geslacht,
 * leeftijd, BMI en nekomtrek. Die staan alle vier al in deze app, en tot nu toe
 * stond de nekomtrek er zelfs twee keer: als meting in het lijstje, en als
 * vinkje dat je zelf moest zetten. Twee plekken voor hetzelfde getal is één
 * plek waar het fout kan gaan.
 *
 * Wat hier terugkomt is alleen wat vaststaat. Een ontbrekende meting geeft
 * géén sleutel terug en geen `false`: "niet gemeten" is geen "nee", en dat
 * onderscheid is in deze app de hele tijd hetzelfde onderscheid. Een vinkje dat
 * uit staat omdat er niets gemeten is, ziet er op het scherm precies zo uit als
 * een vinkje dat uit staat omdat het antwoord nee is, en juist daarom vertelt
 * het scherm ernaast wát de app weet en waar het vandaan komt.
 *
 * De grenzen zijn die van de officiële vragenlijst en niet die van het gemak:
 * ouder dan 50 en BMI boven 35 zijn strikt, de nekomtrek is 43 cm of meer bij
 * mannen en 41 of meer bij vrouwen. Zonder geslacht valt die laatste niet te
 * beantwoorden, en dan komt hij er dus niet uit.
 */
export const NEK_GRENS = { m: 43, v: 41 } as const

export function stopbangUitGegevens(
  g: {
    geslacht: 'm' | 'v' | null
    leeftijdJaar: number | null
    bmi: number | null
    nekCm: number | null
  },
): StopbangAntwoorden {
  const uit: StopbangAntwoorden = {}
  if (g.geslacht != null) uit.man = g.geslacht === 'm'
  if (g.leeftijdJaar != null) uit.leeftijd = g.leeftijdJaar > 50
  if (g.bmi != null) uit.bmi = g.bmi > 35
  if (g.nekCm != null && g.geslacht != null) uit.nek = g.nekCm >= NEK_GRENS[g.geslacht]
  return uit
}

export function stopbangScore(a: StopbangAntwoorden): { score: number; klasse: Risicoklasse } {
  const n = STOPBANG.filter(([k]) => a[k]).length
  const stop = (['snurken', 'moe', 'apneu', 'bloeddruk'] as const).filter((k) => a[k]).length
  let klasse: Risicoklasse = n <= 2 ? 'laag' : n <= 4 ? 'matig' : 'hoog'
  // Verfijning voor de matige groep; verhoogt de specificiteit.
  if (klasse === 'matig' && stop >= 2 && (a.man || a.bmi || a.nek)) klasse = 'hoog'
  return { score: n, klasse }
}

/**
 * DE MIDDEL-LENGTEVERHOUDING
 *
 * De middelomtrek staat al op het scherm met de afkappunten van 94 en 102 cm.
 * Die zijn er voor een Europese man van gemiddelde lengte, en dat is precies
 * hun zwakte: dezelfde 102 cm betekent iets anders bij 1,70 m dan bij 1,96 m.
 *
 * De verhouding lost dat op met één deling en zonder tabel. De grens ligt op
 * 0,5 voor iedereen: je middel hoort minder dan de helft van je lengte te zijn.
 * Dat is de maat die NICE aanbeveelt naast de BMI, en het is ook wat een
 * obesitaskliniek in de praktijk werkelijk meet wanneer een MRI-scanner bij 140
 * kilo ophoudt en DEXA alleen binnen onderzoek mag.
 *
 * WAT HIJ WEL EN NIET ZEGT
 *
 * Hij zegt iets over waar het vet zit, en dat is de vraag die ertoe doet:
 * hetzelfde gewicht kan onderhuids zitten (waar het weinig kwaad doet) of om de
 * organen (waar het insulineresistentie geeft). Hij zegt niets over hóéveel vet
 * er is, en hij vervangt de BMI niet.
 *
 * En hij erft de meetfout van de middelomtrek. Die loopt in de literatuur van
 * 0,7 tot 15 cm; bij een lengte van 1,90 m is twee centimeter goed voor 0,01 in
 * de verhouding. Daarom staat er één cijfer achter de komma en niet twee, en
 * daarom heet de zone rond de grens uitdrukkelijk een zone.
 */
export type Middelzone = 'onder' | 'rond' | 'boven'

export function middelLengte(
  middelCm: number | null, lengteCm: number | null,
): { ratio: number; zone: Middelzone } | null {
  /* Eén wacht voor drie gevallen, en dat is geen bezuiniging maar het gevolg
     van een mutatieproef: met een losse null-controle ervóór bleef een mutant
     die haar wegnam in leven, want de tweede wacht ving hetzelfde geval al op.
     Twee regels die hetzelfde bewaken zijn er één te veel. `null` is niet
     groter dan nul, dus hij valt hier vanzelf onder. */
  const m = middelCm ?? NaN
  const l = lengteCm ?? NaN
  if (!(m > 0) || !(l > 0)) return null
  const ratio = Math.round((m / l) * 100) / 100
  /* De grens is 0,5. De band eromheen is de meetfout, niet een tussencategorie:
     wie op 0,50 uitkomt weet met één lintmeting niet of hij erboven of eronder
     zit, en dat hoort het scherm te zeggen in plaats van te kiezen. */
  const zone: Middelzone = ratio < 0.49 ? 'onder' : ratio > 0.51 ? 'boven' : 'rond'
  return { ratio, zone }
}

export type Onderhoudzone = 'groen' | 'geel' | 'rood'

/**
 * Onderhoud: het stoplicht uit STOP Regain (Wing 2006). Triggert op het
 * voortschrijdend gemiddelde, niet op de dagmeting, anders vuurt rood op
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

/* ==========================================================================
   WELKE METING GELDT ALS ER TWEE OP DEZELFDE DAG STAAN
   ========================================================================== */

/**
 * De nieuwste van een reeks, en wat er gebeurt bij gelijke datums.
 *
 * De vergelijking hier was `x.datum < y.datum ? 1 : -1`. Voor twee gelijke
 * datums geeft dat -1 in beide richtingen: a hoort vóór b én b hoort vóór a.
 * Dat is geen ordening maar een tegenspraak, en welke rij er dan bovenaan komt
 * hangt af van de sorteerfunctie van de browser.
 *
 * Zolang niemand twee metingen op één dag had was dat onzichtbaar. Met de
 * koppeling is het dat niet meer: het horloge schrijft elke nacht een rustpols,
 * en jij kunt er die dag zelf ook een invullen. Op 23 augustus stonden er
 * werkelijk twee, 64 en 70, en het scherm koos er willekeurig één.
 *
 * De tiebreak volgt de regel die in de database al geldt en die in
 * `kal_proef_koppeling` staat vastgelegd: wat jij zelf invulde wint van wat
 * automatisch binnenkwam. Een koppeling mag aanvullen, niet overstemmen.
 */
export const AUTOMATISCH = 'koppeling'

function bronrang(x: { notitie?: string | null }): number {
  return x.notitie === AUTOMATISCH ? 1 : 0
}

export function nieuwsteEerst<T extends { datum: string; notitie?: string | null }>(
  lijst: T[],
): T[] {
  return [...lijst].sort((x, y) => (
    x.datum === y.datum ? bronrang(x) - bronrang(y) : x.datum < y.datum ? 1 : -1
  ))
}

export function nieuwste<T extends { datum: string; notitie?: string | null }>(
  lijst: T[], test: (x: T) => boolean,
): T | null {
  return nieuwsteEerst(lijst.filter(test))[0] ?? null
}

/** Kale ISO-datums, dus geen tijdzone in het spel. */
export function dagenTussen(van: string, tot: string): number {
  const t = (x: string) => Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10))
  return Math.round((t(tot) - t(van)) / 86400000)
}

export interface Rustpols<M> { nu: M; basis: number | null; n: number }

/**
 * De rustpols: de laatste meting, en hoe hij zich verhoudt tot de maand ervoor.
 *
 * Bij deze meting is de verandering het signaal en niet de waarde. Een pols van
 * 58 zegt op zichzelf weinig, bij de een is dat hoog, bij de ander laag. Vier
 * slagen omhoog ten opzichte van je eigen gemiddelde zegt wel iets.
 *
 * De vergelijking gebruikt de dagen ervóór en niet de hele reeks: anders trekt
 * de laatste meting zijn eigen referentie mee omhoog en zie je nooit een
 * verandering. Meerdere metingen op dezelfde dag tellen één keer mee, want
 * anders weegt een dag waarop je twee keer mat dubbel zo zwaar.
 */
export function rustpols<M extends {
  datum: string; soort: string; waarde: number; notitie?: string | null
}>(
  metingen: M[],
): Rustpols<M> | null {
  const alle = nieuwsteEerst(metingen.filter((m) => m.soort === 'hartslag_rust'))
  const nu = alle[0]
  if (!nu) return null
  const perDag = new Map<string, M>()
  for (const m of alle.slice(1)) if (!perDag.has(m.datum)) perDag.set(m.datum, m)
  const eerder = [...perDag.values()].filter((m) => dagenTussen(m.datum, nu.datum) <= 30)
  return {
    nu,
    basis: eerder.length >= 3
      ? eerder.reduce((t, m) => t + m.waarde, 0) / eerder.length : null,
    n: eerder.length,
  }
}
