/**
 * DE HERHALINGSPLANNER
 *
 * Het uitgangspunt is omgekeerd aan de meeste apps: niet "hoeveel leer je erbij"
 * maar "hoeveel houd je vast". Nieuwe stof komt er pas bij als de herhalingen
 * bij zijn. De tijd die je opgeeft wordt éérst gevuld met herhalen; wat
 * overblijft bepaalt hoeveel nieuwe aya's erbij mogen. Blijft er niets over,
 * dan komt er niets bij.
 *
 * Alles hier is puur: geen klok, geen opslag, geen scherm. De dag gaat er als
 * argument in. Dat is niet netheid maar noodzaak — een planner die zijn eigen
 * datum leest, is niet te testen, en dit is precies de code waar een fout pas
 * over maanden zichtbaar wordt. Zie planning.proef.ts.
 */
import type { AyaStaat, Cijfer, Instellingen, Stand } from './opslag'

/** De intervallen in dagen. Verdubbelend tot 64, daarna rustiger — voorbij twee
 *  maanden zegt een verdubbeling niets meer over of iets blijft zitten. */
export const REEKS = [1, 2, 4, 8, 16, 32, 64, 120, 200] as const

/** Hoeveel seconden een herhaling en een nieuwe aya kosten. Uit de praktijk. */
export const SEC_HERHAAL = 30
export const SEC_NIEUW = 360

export const sleutel = (nr: number, n: number): string => `${nr}:${n}`

export interface SoeraInfo {
  nr: number
  naam: string
  ar: string
  aya: number
  plaats: string
  juz: number
  ev?: string
}

/* ------------------------------------------------------------ beoordelen -- */

/**
 * Een beoordeling verwerken. Vlekkeloos schuift een stap op en haalt een punt
 * van de zwakte af; haperen laat de stap staan maar telt zwakte op; kwijt zet
 * de stap terug op nul.
 *
 * Waarom haperen de stap niet terugzet: dan valt een aya die je grotendeels
 * kent terug naar de dagelijkse herhaling, en verdringt hij de aya's die je
 * werkelijk kwijt bent. De zwaktemeter regelt de volgorde, het interval de
 * frequentie; die twee doen verschillend werk.
 */
export function beoordeeld(oud: AyaStaat | undefined, cijfer: Cijfer, dag: number): AyaStaat {
  const t: AyaStaat = oud
    ? { ...oud, reeks: [...oud.reeks] }
    : { stap: 0, vast: true, reeks: [], zwak: 0 }

  t.reeks = [...t.reeks, cijfer].slice(-6)
  if (cijfer === 3) {
    t.stap = Math.min(REEKS.length - 1, t.stap + 1)
    t.zwak = Math.max(0, t.zwak - 1)
  } else if (cijfer === 2) {
    t.zwak = t.zwak + 1
  } else {
    t.stap = 0
    t.zwak = t.zwak + 2
  }
  t.due = dag + (REEKS[t.stap] as number)
  t.laatst = dag
  t.vast = true
  return t
}

/** Een aya voor het eerst vastzetten: hij komt morgen terug. */
export function vastgezet(oud: AyaStaat | undefined, dag: number): AyaStaat {
  const t: AyaStaat = oud ? { ...oud, reeks: [...oud.reeks] } : { stap: 0, vast: true, reeks: [], zwak: 0 }
  t.vast = true
  t.due = dag + (REEKS[0] as number)
  t.laatst = dag
  t.begonnen = t.begonnen ?? dag
  return t
}

/* -------------------------------------------------------------- planning -- */

export interface DueRegel extends AyaStaat { id: string }

/** Wat vandaag aan de beurt is, de wankelste eerst. */
export function dueLijst(stand: Stand, dag: number): DueRegel[] {
  return Object.entries(stand.aya)
    .filter(([, t]) => t.vast && (t.due ?? 0) <= dag)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => b.zwak - a.zwak || (a.due ?? 0) - (b.due ?? 0))
}

export const inDoel = (i: Instellingen, nr: number): boolean =>
  nr >= Math.min(i.doelVan, i.doelTot) && nr <= Math.max(i.doelVan, i.doelTot)

export function doelSoeras(index: readonly SoeraInfo[], i: Instellingen): SoeraInfo[] {
  const r = index.filter((s) => inDoel(i, s.nr))
  if (i.volgorde === 'kort') return r.slice().sort((a, b) => a.aya - b.aya || b.nr - a.nr)
  if (i.volgorde === 'achter') return r.slice().sort((a, b) => b.nr - a.nr)
  return r.slice().sort((a, b) => a.nr - b.nr)
}

export const doelTotaal = (index: readonly SoeraInfo[], i: Instellingen): number =>
  doelSoeras(index, i).reduce((n, s) => n + s.aya, 0)

export const doelVast = (stand: Stand, i: Instellingen): number =>
  Object.entries(stand.aya)
    .filter(([id, t]) => t.vast && inDoel(i, Number(id.split(':')[0]))).length

export interface Dagplan {
  due: DueRegel[]
  nieuw: number
  reden: string
  herhaalTijd: number
  budget: number
  rest: number
}

export function plan(stand: Stand, index: readonly SoeraInfo[], dag: number): Dagplan {
  const i = stand.instel
  const due = dueLijst(stand, dag)
  const budget = (i.minuten || 25) * 60
  const herhaalTijd = due.length * SEC_HERHAAL
  const over = budget - herhaalTijd
  const rest = doelTotaal(index, i) - doelVast(stand, i)

  let nieuw = 0
  let reden = ''
  if (!rest) {
    reden = 'Alles binnen je doel staat vast. Verruim het doel bij Instellingen, ' +
            'of houd bij wat je hebt.'
  } else if (over < SEC_NIEUW) {
    reden = due.length
      ? 'Vandaag geen nieuwe aya: de herhalingen vullen je tijd al. Dat is precies zoals het ' +
        'hoort — eerst vasthouden, dan uitbreiden.'
      : 'Zet je tijd iets ruimer; onder de zes minuten past er geen nieuwe aya in.'
  } else {
    nieuw = Math.min(i.maxNieuw || 3, Math.floor(over / SEC_NIEUW), rest)
  }
  return { due, nieuw, reden, herhaalTijd, budget, rest }
}

/**
 * De volgende aya: binnen het doel, in de gekozen volgorde, en altijd de eerste
 * die nog niet vastligt — zo blijven soera's heel in plaats van los.
 */
export function volgende(
  stand: Stand, index: readonly SoeraInfo[],
): { nr: number; n: number } | null {
  for (const s of doelSoeras(index, stand.instel)) {
    for (let n = 1; n <= s.aya; n++) {
      if (!stand.aya[sleutel(s.nr, n)]?.vast) return { nr: s.nr, n }
    }
  }
  return null
}

/* ------------------------------------------------------------ gezondheid -- */

/**
 * Hoe stevig staat deze aya, van 0 tot 1. Drie dingen wegen mee: hoe de laatste
 * drie beurten gingen (zestig procent), hoe ver hij in de reeks staat (veertig
 * procent), en hoeveel dagen hij al over tijd is (aftrek, hooguit 0,4).
 *
 * De aftrek voor te laat is er omdat een aya die drie weken over zijn datum
 * heen staat níét meer is wat zijn laatste beoordeling zei — ook al was die
 * vlekkeloos.
 */
export function gezond(t: AyaStaat | undefined, dag: number): number | null {
  if (!t?.vast) return null
  const l = t.reeks.slice(-3)
  const gem = l.length ? l.reduce((a, b) => a + b, 0) / l.length : 2
  const rijp = Math.min(1, t.stap / 5)
  const laat = Math.max(0, dag - (t.due ?? dag))
  return Math.max(0, Math.min(1, ((gem - 1) / 2) * 0.6 + rijp * 0.4 - Math.min(0.4, laat * 0.05)))
}

export interface Soerastand {
  totaal: number; vast: number; sterk: number; zwak: number; wankel: number
}

export function soeraStand(
  stand: Stand, info: SoeraInfo | undefined, dag: number,
): Soerastand {
  if (!info) return { totaal: 0, vast: 0, sterk: 0, zwak: 0, wankel: 0 }
  let vast = 0, sterk = 0, zwak = 0, wankel = 0
  for (let n = 1; n <= info.aya; n++) {
    const t = stand.aya[sleutel(info.nr, n)]
    if (!t?.vast) continue
    vast++
    const g = gezond(t, dag) ?? 0
    if (g >= 0.66) sterk++
    else if (g >= 0.33) zwak++
    else wankel++
  }
  return { totaal: info.aya, vast, sterk, zwak, wankel }
}

/** Wanneer komt wat terug, in groepen. */
export function komende(stand: Stand, dag: number): Array<[string, number]> {
  const per: Record<string, number> = {}
  for (const t of Object.values(stand.aya)) {
    if (!t.vast) continue
    const d = Math.max(0, (t.due ?? 0) - dag)
    const k = d === 0 ? 'vandaag' : d === 1 ? 'morgen'
            : d <= 7 ? 'deze week' : d <= 30 ? 'deze maand' : 'later'
    per[k] = (per[k] ?? 0) + 1
  }
  return (['vandaag', 'morgen', 'deze week', 'deze maand', 'later'] as const)
    .filter((k) => per[k]).map((k) => [k, per[k] as number])
}
