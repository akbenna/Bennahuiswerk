/**
 * DE TEKST
 *
 * Honderdveertien bestanden in public/rasikh/tekst/, samen 6.236 aya's, in de
 * Warsh- en de Hafs-lezing, met de vertaling van Leemhuis en een klankweergave.
 * Ze worden per soera geladen op het moment dat ze nodig zijn, en daarna
 * onthouden — een soera opnieuw ophalen bij elke aya zou het herhalen onbruikbaar
 * traag maken.
 */
import type { Lezing } from './opslag'
import type { SoeraInfo } from './planning'

/** Eén aya zoals hij in het bestand staat. */
interface RuweAya {
  n: number
  /** Warsh */
  w: string
  /** Hafs */
  h: string
  /** klankweergave */
  t: string
  /** vertaling */
  nl: string
}

/**
 * LET OP: TWEE VORMEN MET DEZELFDE VELDNAAM
 *
 * In `tekst/index.json` is `aya` een áántal en staat er een juz bij. In
 * `tekst/<nr>.json` is `aya` een líjst met de aya's zelf, en ontbreekt de juz.
 * Dat zijn twee verschillende dingen met dezelfde naam, en precies daar ging
 * het bij de omzetting mis: één `as unknown as SoeraInfo` en de lijst belandde
 * op de plek van het aantal, waarna React een object probeerde te tekenen.
 *
 * Vandaar dat het bestand hieronder zijn eigen type heeft en de SoeraInfo uit
 * de index komt — die is de enige met de juz erin.
 */
interface Soerabestand {
  nr: number
  naam: string
  ar: string
  ev: string
  plaats: string
  aya: RuweAya[]
}

/** Wat de schermen verwachten. */
export interface Aya {
  id: string
  nr: number
  n: number
  soera: SoeraInfo
  /** volgt de gekozen lezing */
  ar: string
  w: string
  h: string
  tr: string
  nl: string
}

const cache = new Map<number, Soerabestand>()

/** De index staat hier zodra hij geladen is; `aya()` heeft hem nodig om de
 *  juiste SoeraInfo — met juz — aan een aya te hangen. */
let index: readonly SoeraInfo[] = []

export async function laadIndex(): Promise<{ index: SoeraInfo[]; bron: string }> {
  const r = await fetch('tekst/index.json')
  if (!r.ok) throw new Error('de tekstindex ontbreekt')
  const j = (await r.json()) as { soera?: SoeraInfo[]; bron?: string }
  index = j.soera ?? []
  return { index: [...index], bron: j.bron ?? '' }
}

export async function laadSoera(nr: number): Promise<Soerabestand> {
  const bestaand = cache.get(nr)
  if (bestaand) return bestaand
  const r = await fetch('tekst/' + nr + '.json')
  if (!r.ok) throw new Error('soera ' + nr + ' ontbreekt')
  const j = (await r.json()) as Soerabestand
  cache.set(nr, j)
  return j
}

/** De gegevens van een soera zoals de schermen ze willen: met een áántal en
 *  een juz. Uit de index; ontbreekt hij daar, dan uit het bestand zelf. */
function infoVan(b: Soerabestand): SoeraInfo {
  const uit = index.find((s) => s.nr === b.nr)
  return uit ?? {
    nr: b.nr, naam: b.naam, ar: b.ar, ev: b.ev,
    plaats: b.plaats, juz: 0, aya: b.aya.length,
  }
}

const maak = (info: SoeraInfo, a: RuweAya, lezing: Lezing): Aya => ({
  id: `${info.nr}:${a.n}`, nr: info.nr, n: a.n, soera: info,
  ar: lezing === 'hafs' ? a.h : a.w, w: a.w, h: a.h, tr: a.t, nl: a.nl,
})

export async function aya(nr: number, n: number, lezing: Lezing): Promise<Aya | null> {
  const s = await laadSoera(nr)
  const a = s.aya[n - 1]
  return a ? maak(infoVan(s), a, lezing) : null
}

export const ayaVanId = async (id: string, lezing: Lezing): Promise<Aya | null> => {
  const [nr, n] = id.split(':').map(Number)
  return nr && n ? aya(nr, n, lezing) : null
}

export const vorigeAya = (a: Aya, lezing: Lezing): Promise<Aya | null> =>
  a.n > 1 ? aya(a.nr, a.n - 1, lezing) : Promise.resolve(null)

/** Alle aya's van de hele Koran. */
export const totaalAya = (index: readonly SoeraInfo[]): number =>
  index.reduce((n, s) => n + s.aya, 0)

/* ------------------------------------------------------------ verwarring -- */

export interface Verwargroep {
  /** de gedeelde tekst, zonder tekens */
  t: string
  /** de plaatsen: [soera, aya] */
  p: Array<[number, number]>
  soort?: 'gelijk' | 'opening'
}

export interface Mutashabihat {
  exact: Verwargroep[]
  opening: Verwargroep[]
}

export async function laadVerwarring(): Promise<Mutashabihat> {
  try {
    const r = await fetch('tekst/mutashabihat.json')
    if (r.ok) return (await r.json()) as Mutashabihat
  } catch { /* dan leeg */ }
  return { exact: [], opening: [] }
}

/**
 * De groepen die jóuw stof raken: minstens één plaats staat vast, en de groep
 * heeft meer dan één plaats — een tekst die maar op één plek staat kan niet
 * verwarren.
 */
export function relevanteVerwarring(
  mut: Mutashabihat, vast: ReadonlySet<string>,
): Verwargroep[] {
  const raakt = (g: Verwargroep) =>
    g.p.length > 1 && g.p.some(([c, v]) => vast.has(`${c}:${v}`))
  return [
    ...mut.exact.map((g) => ({ ...g, soort: 'gelijk' as const })),
    ...mut.opening.map((g) => ({ ...g, soort: 'opening' as const })),
  ].filter(raakt)
}

/** Bij de keuzes hoort niet de hele aya — sommige zijn een half scherm lang.
 *  Het gaat om herkennen hoe het verdergaat, en dat zit in de eerste woorden. */
export const aanhef = (t: string, n = 9): string => {
  const w = String(t).split(/\s+/)
  return w.length <= n ? t : w.slice(0, n).join(' ') + ' …'
}
