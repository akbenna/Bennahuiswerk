/**
 * HET LEERPAD — een vaste reeks blokken, één blok is één sessie
 *
 * Er is bewust geen streak en geen achterstand. De kalender wordt bij elke
 * opening opnieuw op vandaag verankerd: het eerstvolgende blok dat je nog niet
 * hebt gedaan, is dat van vandaag; het blok erna is dat van morgen. Wie een
 * week niets doet, vindt dus geen zeven sessies terug maar precies één, en er
 * is niets verloren gegaan. (Silverman & Barasch, JCR 2023: een gebroken reeks
 * verlaagt het vervolggedrag; een schema dat altijd op vandaag staat kan niet
 * breken.)
 *
 * Binnen een blok wordt alleen gemengd wat verward kan worden — ba/ta/tha bij
 * elkaar, sin/shin bij elkaar. Letters, woordenschat en grammatica zitten
 * nooit in dezelfde sessie; dat is versnippering, geen interleaving.
 */
import { LETTERS, TEKENS } from './gegevens/letters'
import { WOORDEN } from './gegevens/woorden'
import { GRAMMATICA } from './gegevens/grammatica'
import { ZINNEN } from './gegevens/zinnen'
import { TEKSTEN } from './gegevens/teksten'
import { KORAN100 } from './gegevens/koran'
import { BLOKKEN, JAAR } from './gegevens/jaarplan'
import type { Spoor, Week, Woord } from './gegevens/soorten'
import type { Kaartstaat } from './fsrs'
import { dagVerschil } from './datum'

/** Leeftijd bepaalt het spoor. De ouder kan het overschrijven. */
export function spoorBijLeeftijd(l: number): Spoor {
  if (l <= 9) return 1
  if (l <= 12) return 2
  if (l <= 15) return 3
  return 4
}

export const SPOORNAAM: Record<Spoor, string> = {
  1: 'Lezen en letters', 2: 'Woorden en zinnen', 3: 'Grammatica en teksten', 4: 'Het volwassen spoor',
}
export const SPOORLEEFTIJD: Record<Spoor, string> = {
  1: '7 tot 9 jaar', 2: '10 tot 12 jaar', 3: '13 tot 15 jaar', 4: 'volwassen',
}

/* Verwarparen: letters die op elkaar lijken in vorm of klank staan in dezelfde
   groep, zodat je ze naast elkaar leert onderscheiden. */
export const LETTERGROEPEN: Array<{ l: string[]; t: string }> = [
  { l: ['ا', 'ب'], t: 'Alif en ba — de eerste twee' },
  { l: ['ت', 'ث'], t: 'Ta en tha — twee punten of drie' },
  { l: ['ج', 'ح', 'خ'], t: 'Jim, ha en kha — één vorm, drie klanken' },
  { l: ['د', 'ذ'], t: 'Dal en dhal' },
  { l: ['ر', 'ز'], t: 'Ra en zay' },
  { l: ['س', 'ش'], t: 'Sin en shin' },
  { l: ['ص', 'ض'], t: 'Sad en dad — de zware s en d' },
  { l: ['ط', 'ظ'], t: 'Ta en za — de zware t en dh' },
  { l: ['ع', 'غ'], t: 'Ayn en ghayn — de keelletters' },
  { l: ['ف', 'ق'], t: 'Fa en qaf — één punt of twee' },
  { l: ['ك', 'ل'], t: 'Kaf en lam' },
  { l: ['م', 'ن'], t: 'Mim en nun' },
  { l: ['ه', 'و', 'ي'], t: 'Ha, waw en ya — de laatste drie' },
]

function hakInStukken<T>(arr: T[], n: number): T[][] {
  const uit: T[][] = []
  for (let i = 0; i < arr.length; i += n) uit.push(arr.slice(i, i + n))
  return uit
}

/** Rondgang over meerdere stromen volgens een herhalend patroon. Zo wisselt de
 *  sóórt sessie van dag tot dag, terwijl elke sessie zelf over één ding gaat. */
function rondgang<T>(stromen: Record<string, T[]>, patroon: string[]): T[] {
  const kopie: Record<string, T[]> = {}
  for (const k of Object.keys(stromen)) kopie[k] = (stromen[k] as T[]).slice()
  const uit: T[] = []
  let i = 0
  let leeg = 0
  while (leeg < patroon.length * 2 && uit.length < 500) {
    const sleutel = patroon[i % patroon.length] as string
    i++
    const stroom = kopie[sleutel]
    if (stroom?.length) { uit.push(stroom.shift() as T); leeg = 0 } else leeg++
    if (Object.keys(kopie).every((k) => !(kopie[k] as T[]).length)) break
  }
  return uit
}

export interface Padstap {
  k: 'letters' | 'teken' | 'woorden' | 'grammatica' | 'zinnen' | 'tekst' | 'koran'
  titel: string
  items?: Array<{ w: Woord; i: number }> | Array<{ z: (typeof ZINNEN)[number]; i: number }>
    | Array<{ k: (typeof KORAN100)[number]; i: number }> | undefined
  letters?: string[] | undefined
  idx?: number | undefined
  id?: string | undefined
}

export function bouwPad(spoor: Spoor): Padstap[] {
  const woorden = WOORDEN.map((w, i) => ({ w, i })).filter((x) => x.w.s <= spoor)
  const gram = GRAMMATICA.filter((g) => g.sp === spoor)
  const zinnen = ZINNEN.map((z, i) => ({ z, i })).filter((x) => x.z.n2 === Math.min(spoor, 4))
  const teksten = TEKSTEN.filter((t) => t.n2 === Math.min(spoor, 4))

  /* Titels moeten uit elkaar te houden zijn in een lijst van zeventig stappen;
     "Woorden: familie" drie keer op rij helpt niemand. Vandaar de doortelling
     per thema en de categorie bij de zinnen. */
  const themaTeller: Record<string, number> = {}
  const stroomW: Padstap[] = hakInStukken(woorden, spoor === 1 ? 6 : 8).map((g) => {
    const th = (g[0] as { w: Woord }).w.th
    themaTeller[th] = (themaTeller[th] ?? 0) + 1
    const meer = woorden.filter((x) => x.w.th === th).length > (spoor === 1 ? 6 : 8)
    return { k: 'woorden', titel: 'Woorden: ' + th + (meer ? ' ' + themaTeller[th] : ''), items: g }
  })
  const stroomG: Padstap[] = gram.map((g) => ({ k: 'grammatica', titel: g.titel, id: g.id }))
  const stroomZ: Padstap[] = hakInStukken(zinnen, 6).map((g) => {
    const soorten = [...new Set(g.map((x) => x.z.c))]
    return { k: 'zinnen', titel: 'Zinnen: ' + soorten.slice(0, 2).join(' en '), items: g }
  })
  const stroomT: Padstap[] = teksten.map((t) => ({ k: 'tekst', titel: 'Lezen: ' + t.titel, id: t.id }))

  if (spoor === 1) {
    const stroomL: Padstap[] = LETTERGROEPEN.map((g) => ({ k: 'letters', titel: g.t, letters: g.l }))
    const stroomTk: Padstap[] = TEKENS.map((t, i) => ({
      k: 'teken', titel: 'Teken: ' + t.tr + ' — ' + t.n, idx: i,
    }))
    return rondgang({ L: stroomL, T: stroomTk, W: stroomW, Z: stroomZ },
      ['L', 'L', 'T', 'W', 'L', 'W', 'Z'])
  }
  if (spoor === 2) {
    return rondgang({ G: stroomG, W: stroomW, Z: stroomZ, T: stroomT },
      ['G', 'W', 'Z', 'W', 'T', 'W', 'G'])
  }
  if (spoor === 3) {
    return rondgang({ G: stroomG, W: stroomW, Z: stroomZ, T: stroomT },
      ['G', 'Z', 'W', 'T', 'G', 'Z', 'W'])
  }
  /* Volwassen spoor: hetzelfde materiaal in hoger tempo, plus de Koranwoorden
     als eigen stroom. */
  const stroomK: Padstap[] = hakInStukken(KORAN100.map((k, i) => ({ k, i })), 10)
    .map((g, i) => ({
      k: 'koran', titel: 'Koranwoorden ' + (i * 10 + 1) + '–' + (i * 10 + g.length), items: g,
    }))
  const teller4: Record<string, number> = {}
  const woorden4: Padstap[] = hakInStukken(WOORDEN.map((w, i) => ({ w, i })), 14).map((g) => {
    const th = (g[0] as { w: Woord }).w.th
    teller4[th] = (teller4[th] ?? 0) + 1
    return { k: 'woorden', titel: 'Woorden: ' + th + ' ' + teller4[th], items: g }
  })
  return rondgang({ G: stroomG, K: stroomK, W: woorden4, Z: stroomZ, T: stroomT },
    ['G', 'K', 'Z', 'W', 'K', 'T', 'G'])
}

/* ---------------------------------------------------------------- kaarten --
   Kaart-id's zijn afgeleid van de inhoud, niet opgeslagen. Zo blijft een
   profiel geldig als de inhoud groeit: nieuwe woorden krijgen nieuwe id's,
   bestaande kaarten houden hun geschiedenis. */

/* De richting valt weg als hij leeg is óf nul. Dat laatste is geen slordigheid
   maar hoe de oude app het deed, en de id's staan in ieders opslag: de eerste
   oefening van een grammaticamodule heet `G:g-01` en de tweede `G:g-01:1`.
   Wie dat "verbetert" ontkoppelt elke bestaande kaart van zijn geschiedenis. */
export const kaartId = (
  soort: string, sleutel: string | number, richting?: string | number | undefined,
): string => soort + ':' + sleutel + (richting ? ':' + richting : '')

/** Alle kaarten die bij dit spoor horen. */
export function alleKaartIds(spoor: Spoor): string[] {
  const uit: string[] = []
  if (spoor === 1) for (const l of LETTERS) uit.push(kaartId('L', l.l))
  WOORDEN.forEach((w, i) => {
    if (w.s > spoor) return
    uit.push(kaartId('W', i, 'nl'))
    if (spoor >= 2) uit.push(kaartId('W', i, 'ar'))
  })
  for (const g of GRAMMATICA.filter((x) => x.sp <= spoor)) {
    g.oef.forEach((_, n) => uit.push(kaartId('G', g.id, n)))
  }
  /* Let op de index: de oude code deed eerst `filter` en zocht daarna de
     oorspronkelijke plek met `indexOf`, wat op hetzelfde neerkomt maar bij een
     dubbele zin de eerste zou pakken. De id's blijven dus gelijk. */
  ZINNEN.forEach((z, i) => { if (z.n2 <= spoor) uit.push(kaartId('Z', i)) })
  if (spoor === 4) KORAN100.forEach((_, i) => uit.push(kaartId('K', i)))
  return uit
}

export interface Rijregel { id: string; k: Kaartstaat; over: number }

/**
 * De wachtrij van vandaag, met dagplafond. Het plafond is er om te voorkomen
 * dat een gemiste periode zich opstapelt tot een berg die niemand meer
 * aanraakt; wat er niet in past schuift door naar morgen, met de langst
 * wachtende kaarten eerst.
 */
export function herhalingsRij(
  kaarten: Record<string, Kaartstaat>, dag: string, plafond: number,
): { rij: Rijregel[]; totaal: number; plafond: number } {
  const rij: Rijregel[] = []
  for (const [id, k] of Object.entries(kaarten)) {
    if (k?.due && k.due <= dag) rij.push({ id, k, over: dagVerschil(k.due, dag) })
  }
  rij.sort((a, b) => b.over - a.over) /* langst wachtend eerst */
  return { rij: rij.slice(0, plafond), totaal: rij.length, plafond }
}

export const aantalDue = (kaarten: Record<string, Kaartstaat>, dag: string): number =>
  herhalingsRij(kaarten, dag, 1e6).totaal

/* ------------------------------------------------------------ het jaarplan */

export const weekVan = (n: number): Week | undefined => JAAR.find((w) => w.n === n)
export const blokVan = (n: number): typeof BLOKKEN[number] | undefined =>
  BLOKKEN.find((b) => n >= (b.weken[0] as number) && n <= (b.weken[1] as number))
export const lettersTot = (n: number): string[] =>
  JAAR.filter((w) => w.n <= n).flatMap((w) => w.letters ?? [])
