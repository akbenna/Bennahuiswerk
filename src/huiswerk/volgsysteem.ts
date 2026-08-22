/**
 * DIDACTISCH VOLGSYSTEEM
 *
 * Wat een ouder wil weten: waar staat mijn kind, per vak en per onderwerp, en
 * loopt het vooruit of achteruit. Drie stukken:
 *
 *  - een wekelijkse momentopname, zodat er een lijn over tijd ontstaat en niet
 *    alleen een stand van nu;
 *  - een beheersings-taxonomie met vier standen, in woorden en niet in cijfers;
 *  - een volledig leerprofiel per kind, ook bruikbaar als export.
 *
 * Sjablonen doen hier niet mee. Die zijn oneindig, dus "hoeveel procent van de
 * sjablonen beheerst dit kind" is een vraag zonder betekenis; alleen de vaste
 * opgaven zijn per stuk te tellen.
 */
import type { Kaart, Opgave, Profielkaart } from './gegevens/soorten'
import { VAKNAAM } from './gegevens/profielen'
import type { Voortgang, Weekstuk } from './opslag'
import { kaartStand } from './leitner'
import { weekSleutel } from './datum'

/** Alleen de vaste opgaven: sjablonen zijn niet per stuk te beheersen. */
const vasteVan = (alle: readonly Kaart[], pid: string): Opgave[] =>
  alle.filter((e): e is Opgave => e.p === pid && !('gen' in e))

/** De wekelijkse momentopname bijwerken. Geeft een nieuwe historie terug. */
export function momentopname(pr: Voortgang, nuMs: number): Weekstuk[] {
  const wk = weekSleutel(nuMs)
  const kaarten = Object.values(pr.cards ?? {})
  const snap: Weekstuk = {
    wk,
    punten: pr.punten || 0,
    beheerst: kaarten.filter((c) => (c.box || 0) >= 4).length,
    geoefend: kaarten.filter((c) => (c.box || 0) > 0).length,
  }
  return [...(pr.historie ?? []).filter((x) => x?.wk !== wk), snap].slice(-52)
}

export interface Beheersniveau { key: string; label: string; emoji: string; kleur: string }

export const BEHEERS_NIVEAUS: Beheersniveau[] = [
  { key: 'nieuw', label: 'nog niet begonnen', emoji: '⚪', kleur: '#9aa0a6' },
  { key: 'zwak', label: 'in ontwikkeling', emoji: '🔴', kleur: '#C23728' },
  { key: 'bijna', label: 'bijna beheerst', emoji: '🟡', kleur: '#c9a227' },
  { key: 'beheerst', label: 'beheerst', emoji: '🟢', kleur: '#2c7a2c' },
]

export function beheersStatus(pct: number, geoefend: number): Beheersniveau {
  if (!geoefend) return BEHEERS_NIVEAUS[0] as Beheersniveau
  if (pct >= 80) return BEHEERS_NIVEAUS[3] as Beheersniveau
  if (pct >= 50) return BEHEERS_NIVEAUS[2] as Beheersniveau
  return BEHEERS_NIVEAUS[1] as Beheersniveau
}

export interface Zwakteregel {
  v: string
  t: string
  jaar: string
  total: number
  mastered: number
  wrong: number
  beg: number
  avg: number
  pct: number
  /** Hoger is zwakker: fouten wegen dubbel, en hoe lager het gemiddelde doosje
   *  hoe hoger de score. */
  score: number
}

/** De vijf zwakste en drie sterkste onderwerpen. Alleen wat al geoefend is doet
 *  mee — een onderwerp waar nog nooit aan begonnen is, is niet zwak maar nieuw. */
export function zwakteAnalyse(
  prog: Voortgang, alle: readonly Kaart[], pid: string,
): { zwak: Zwakteregel[]; sterk: Zwakteregel[]; geoefendAantal: number } {
  const perOnderwerp: Record<string, {
    v: string; t: string; total: number; mastered: number; wrong: number
    boxSum: number; beg: number; jaar: string
  }> = {}
  for (const e of vasteVan(alle, pid)) {
    const c = kaartStand(prog, e.id)
    const k = e.v + '|' + e.t
    const o = (perOnderwerp[k] ??= {
      v: e.v, t: e.t, total: 0, mastered: 0, wrong: 0, boxSum: 0, beg: 0, jaar: e.jaar ?? 'nu',
    })
    o.total++
    if (c.box >= 4) o.mastered++
    o.wrong += c.wrong || 0
    if (c.box > 0) { o.beg++; o.boxSum += c.box }
  }
  const rijen: Zwakteregel[] = Object.values(perOnderwerp).map((o) => {
    const avg = o.beg ? o.boxSum / o.beg : 0
    return {
      v: o.v, t: o.t, jaar: o.jaar, total: o.total, mastered: o.mastered,
      wrong: o.wrong, beg: o.beg, avg,
      pct: o.total ? Math.round(o.mastered / o.total * 100) : 0,
      score: o.wrong * 2 + (4 - avg),
    }
  })
  const geoefend = rijen.filter((o) => o.beg > 0)
  return {
    zwak: geoefend.filter((o) => o.wrong > 0 || o.avg < 4).sort((a, b) => b.score - a.score).slice(0, 5),
    sterk: geoefend.filter((o) => o.avg >= 4 && o.wrong === 0).sort((a, b) => b.beg - a.beg).slice(0, 3),
    geoefendAantal: geoefend.length,
  }
}

export interface Onderwerpregel {
  t: string
  jaar: string
  totaal: number
  beheerst: number
  geoefend: number
  ok: number
  wrong: number
  lvl: Record<number, number>
  laatst: number
  pct: number
  pogingen: number
  /** Nauwkeurigheid in procenten, of niets als er nog nooit geprobeerd is. */
  nauw: number | null
  status: Beheersniveau
}

export interface Vakregel {
  v: string
  naam: string
  totaal: number
  beheerst: number
  geoefend: number
  pct: number
  /** Hoeveel procent van de opgaven al eens is aangeraakt. */
  dekking: number
  onderwerpen: Onderwerpregel[]
}

export interface Leerprofiel {
  pid: string
  naam: string
  niveau: string
  volgend: string
  totaal: number
  beheerst: number
  geoefend: number
  mastery: number
  dekking: number
  punten: number
  dagstreak: number
  vakken: Vakregel[]
  historie: Weekstuk[]
}

export function leerprofiel(
  prog: Voortgang, alle: readonly Kaart[], pid: string, P: Profielkaart | undefined,
): Leerprofiel | null {
  if (!P) return null
  const eigen = vasteVan(alle, pid)
  const vakken: Vakregel[] = []
  for (const v of P.vakken ?? []) {
    const items = eigen.filter((e) => e.v === v)
    const map: Record<string, Omit<Onderwerpregel, 'pct' | 'pogingen' | 'nauw' | 'status'>> = {}
    for (const e of items) {
      const c = kaartStand(prog, e.id)
      const o = (map[e.t] ??= {
        t: e.t, jaar: e.jaar ?? 'nu', totaal: 0, beheerst: 0, geoefend: 0,
        ok: 0, wrong: 0, lvl: { 1: 0, 2: 0, 3: 0 }, laatst: 0,
      })
      o.totaal++
      if (c.box >= 4) o.beheerst++
      if (c.box > 0) o.geoefend++
      o.ok += c.ok || 0
      o.wrong += c.wrong || 0
      const n = e.lvl ?? 1
      o.lvl[n] = (o.lvl[n] ?? 0) + 1
      o.laatst = Math.max(o.laatst, c.last || 0)
    }
    const onderwerpen: Onderwerpregel[] = Object.values(map).map((o) => {
      const pogingen = o.ok + o.wrong
      const pct = o.totaal ? Math.round(o.beheerst / o.totaal * 100) : 0
      return {
        ...o, pct, pogingen,
        nauw: pogingen ? Math.round(o.ok / pogingen * 100) : null,
        status: beheersStatus(pct, o.geoefend),
      }
    }).sort((a, b) => a.pct - b.pct || b.wrong - a.wrong)

    const totaal = items.length
    const beheerst = onderwerpen.reduce((s, o) => s + o.beheerst, 0)
    const geoefend = onderwerpen.reduce((s, o) => s + o.geoefend, 0)
    vakken.push({
      v, naam: VAKNAAM[v] ?? v, totaal, beheerst, geoefend,
      pct: totaal ? Math.round(beheerst / totaal * 100) : 0,
      dekking: totaal ? Math.round(geoefend / totaal * 100) : 0,
      onderwerpen,
    })
  }
  const totaal = vakken.reduce((s, x) => s + x.totaal, 0)
  const beheerst = vakken.reduce((s, x) => s + x.beheerst, 0)
  const geoefend = vakken.reduce((s, x) => s + x.geoefend, 0)
  return {
    pid, naam: P.naam, niveau: P.niveau, volgend: P.volgend,
    totaal, beheerst, geoefend,
    mastery: totaal ? Math.round(beheerst / totaal * 100) : 0,
    dekking: totaal ? Math.round(geoefend / totaal * 100) : 0,
    punten: prog.punten || 0, dagstreak: prog.dagstreak || 0,
    vakken, historie: prog.historie ?? [],
  }
}
