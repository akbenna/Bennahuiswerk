/**
 * HET PROGRAMMA — achtentwintig weken uit drie gegevensbestanden
 *
 * De weeklijst is geen gegeven maar een afleiding: per spoor eerst de modules
 * uit het curriculum, daarna de consolidatieweek die op dat spoor volgt. Dat
 * die volgorde hier één keer wordt vastgelegd, is precies waarom hij nergens
 * anders herhaald hoeft te worden — het weeknummer is overal hetzelfde getal,
 * ook in wat er al bewaard staat.
 */
import { CURRICULUM } from './gegevens/curriculum'
import { CONSOLIDATIE } from './gegevens/consolidatie'
import { EXTRA } from './gegevens/extra'
import type { Consolidatie, Extra, Module, Spoor } from './gegevens/soorten'
import { dagVerschil } from '../gedeeld/datum'
import type { IsoDatum } from '../gedeeld/db/tabellen'

/** Een lesweek: brontekst, uitleg, toepassing en toets. */
export interface Lesweek {
  type: 'les'
  nr: number
  sp: Spoor
  m: Module
  ex: Extra
}

/** Een consolidatieweek: geen nieuwe stof, wel synthese. */
export interface Consolidatieweek {
  type: 'cons'
  nr: number
  sp: Spoor
  c: Consolidatie
}

export type Week = Lesweek | Consolidatieweek

/** De titel die boven de week staat, ongeacht welk soort week het is. */
export const weekTitel = (w: Week): string => (w.type === 'les' ? w.m.titel : w.c.titel)

function bouw(): Week[] {
  const uit: Week[] = []
  for (const sp of CURRICULUM) {
    for (const m of sp.modules) {
      const ex = EXTRA[m.id]
      /* Een module zonder kernvraag en brontekst is een lege week; dat mag niet
         stil gebeuren, want dan schuiven alle latere weeknummers op. */
      if (!ex) throw new Error(`Module ${m.id} mist zijn EXTRA-blok`)
      uit.push({ type: 'les', nr: uit.length + 1, sp, m, ex })
    }
    const c = CONSOLIDATIE.find((x) => x.na === sp.id)
    if (c) uit.push({ type: 'cons', nr: uit.length + 1, sp, c })
  }
  return uit
}

export const PROGRAMMA: Week[] = bouw()
export const TOT = PROGRAMMA.length

/** De week waar je bent: de eerste die nog niet is afgevinkt. */
export const actieveWeek = (klaar: Record<number, string>): number =>
  PROGRAMMA.find((w) => !klaar[w.nr])?.nr ?? TOT

/** De week waar je volgens je eigen startdatum zou zitten. */
export const planWeek = (start: IsoDatum | null, nu: IsoDatum): number | null =>
  start === null ? null : Math.min(TOT, Math.max(1, Math.floor(dagVerschil(start, nu) / 7) + 1))

/** De sporen waarvan minstens één week is afgerond; hun kaarten staan open. */
export const openSporen = (klaar: Record<number, string>): Set<string> =>
  new Set(PROGRAMMA.filter((w) => klaar[w.nr]).map((w) => w.sp.id))
