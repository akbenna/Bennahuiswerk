/**
 * DE KAARTPLANNER — spreiding, niet herhaling
 *
 * Een variant op SM-2. Elke kaart draagt een interval `i` in dagen en een
 * gemakfactor `e`; bij een goed antwoord wordt het interval met die factor
 * vermenigvuldigd, bij "opnieuw" valt het terug naar nul en zakt de factor.
 * De factor blijft tussen 1.3 en 3.2: onder 1.3 komt een kaart die je één keer
 * misgokt hebt eeuwig terug, boven 3.2 springt een kaart van een maand naar een
 * kwartaal en is de spreiding geen spreiding meer.
 *
 * Alles hier is zuiver: de dag van vandaag komt als argument binnen en niet uit
 * de klok. Dat is wat de gouden waarden uit de oude pagina toetsbaar maakt.
 */
import { plusDagen } from '../gedeeld/datum'
import type { IsoDatum } from '../gedeeld/db/tabellen'
import type { Kaart } from './gegevens/soorten'

/** Hoe goed het ging: 0 opnieuw, 1 lastig, 2 goed, 3 makkelijk. */
export type Oordeel = 0 | 1 | 2 | 3

export interface Kaartstand {
  /** Het huidige interval in dagen; 0 zolang de kaart nieuw of gevallen is. */
  i: number
  /** Gemakfactor. */
  e: number
  /** Hoe vaak de kaart beoordeeld is. */
  n: number
  /** De dag waarop de kaart weer aan de beurt is. */
  due: IsoDatum
}

const BEGIN_E = 2.5
const MIN_E = 1.3
const MAX_E = 3.2

/** Het interval dat een oordeel zou opleveren. Ook gebruikt voor de voorspelling
 *  onder de knoppen: je ziet vóór het kiezen wanneer de kaart terugkomt. */
export function volgend(c: Partial<Kaartstand> | undefined, q: Oordeel): number {
  const i = c?.i ?? 0
  const e = c?.e ?? BEGIN_E
  if (q === 1) return i ? Math.max(1, Math.round(i * 1.2)) : 1
  if (q === 2) return i ? Math.round(i * e) : 2
  return i ? Math.round(i * e * 1.35) : 4
}

/** De nieuwe stand van een kaart na een oordeel. Geeft een nieuw object terug. */
export function beoordeel(
  c: Partial<Kaartstand> | undefined,
  q: Oordeel,
  nu: IsoDatum,
): Kaartstand {
  const e = c?.e ?? BEGIN_E
  const n = (c?.n ?? 0) + 1
  if (q === 0) return { i: 0, e: Math.max(MIN_E, e - 0.2), n, due: nu }
  /* Let op de volgorde: het nieuwe interval rekent met de óude gemakfactor.
     Andersom zou "makkelijk" twee keer meetellen in dezelfde beurt. */
  const i = volgend(c, q)
  const stap = q === 1 ? -0.15 : q === 3 ? 0.15 : 0
  return { i, e: Math.min(MAX_E, Math.max(MIN_E, e + stap)), n, due: plusDagen(nu, i) }
}

/** "3 d" of "5 mnd" — een maand is hier dertig dagen, want het is een schatting. */
export const fmt = (d: number): string => (d >= 30 ? `${Math.round(d / 30)} mnd` : `${d} d`)

/** De kaarten die meedoen: alles, of alleen de sporen die opengevallen zijn. */
export const actieveKaarten = (
  kaarten: Kaart[],
  open: Set<string>,
  alles: boolean,
): Kaart[] => (alles ? kaarten : kaarten.filter((k) => open.has(k.s)))

/** Wat vandaag aan de beurt is. Een kaart die nog nooit is gezien telt mee. */
export const dueKaarten = (
  actief: Kaart[],
  stand: Record<string, Kaartstand>,
  nu: IsoDatum,
): Kaart[] => actief.filter((k) => {
  const c = stand[k.id]
  return !c || c.due <= nu
})
