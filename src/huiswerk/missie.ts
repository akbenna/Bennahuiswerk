/**
 * RANGEN, MISSIES EN INSIGNES
 *
 * Wat er te halen valt op een dag. Drie taken, niet meer: het dagdoel, netjes
 * werken, en één oefentoets. Alle drie samen geeft een bonus, en dat is één
 * keer per dag — een missie die je vijf keer kunt afronden is geen missie.
 *
 * De klok komt als argument binnen; anders is een dagreeks niet te toetsen.
 */
import { dagKort, gisterKort, weekSleutel } from './datum'
import type { Rang, Thema } from './gegevens/soorten'
import type { Voortgang } from './opslag'

export interface Rangstand {
  naam: string
  emoji: string
  volgendeNaam: string | null
  /** Hoeveel punten er nog bij moeten voor de volgende rang. */
  naar: number
  pct: number
}

export function rangVoor(thema: Thema, punten: number): Rangstand {
  const r = thema.rangen
  let i = 0
  for (let k = 0; k < r.length; k++) if (punten >= (r[k] as Rang)[0]) i = k
  const huidig = r[i] as Rang
  const volgende = r[i + 1] ?? null
  const basis = huidig[0]
  const top = volgende ? volgende[0] : huidig[0]
  return {
    naam: huidig[1],
    emoji: huidig[2],
    volgendeNaam: volgende ? volgende[1] : null,
    naar: volgende ? volgende[0] - punten : 0,
    pct: volgende ? Math.round((punten - basis) / (top - basis) * 100) : 100,
  }
}

/** De toernooipunten van deze week: de totaalscore min de stand aan het begin
 *  van de week. Afgeleid van de ranglijst zelf, zodat er geen tweede teller is
 *  die uit de pas kan lopen. */
export function weekPuntenNu(pr: Voortgang, nuMs: number): number {
  if (!pr || pr.weekKey !== weekSleutel(nuMs)) return 0
  const basis = typeof pr.weekBasis === 'number' ? pr.weekBasis : (pr.punten || 0)
  return Math.max(0, (pr.punten || 0) - basis)
}

export interface Missietaak { k: string; ok: boolean; tekst: string }

export function dagMissie(prog: Voortgang, nu: Date): { taken: Missietaak[]; klaar: boolean } {
  const vandaag = dagKort(nu)
  const goal = prog.goal || 10
  const td = prog.todayCount || 0
  const d = prog.dag.d === vandaag ? prog.dag : { goed: 0, fout: 0 }
  const pog = (d.goed || 0) + (d.fout || 0)
  const nauw = pog ? d.goed / pog : 0
  const t = prog.toetsDag.d === vandaag ? prog.toetsDag : { oefen: 0, proef: 0 }
  const taken: Missietaak[] = [
    { k: 'doel', ok: td >= goal, tekst: 'Haal je dagdoel (' + td + '/' + goal + ' sommen)' },
    { k: 'nauw', ok: pog >= 8 && nauw >= 0.8, tekst: 'Werk nauwkeurig (≥ 80% van ' + Math.max(8, pog) + ')' },
    { k: 'toets', ok: (t.oefen || 0) > 0 || (t.proef || 0) > 0, tekst: 'Doe een oefentoets' },
  ]
  return { taken, klaar: taken.every((x) => x.ok) }
}

/** De missiebonus, in XP. */
export const MISSIEBONUS = 25

/** De dagmissie verzilveren, hoogstens één keer per dag. Geeft niets terug als
 *  er niets te verzilveren viel — dan blijft de voortgang zoals hij was. */
export function verzilverMissie(pr: Voortgang, nu: Date): Voortgang | null {
  const vandaag = dagKort(nu)
  if (pr.missieLaatst === vandaag) return null
  if (!dagMissie(pr, nu).klaar) return null
  return {
    ...pr,
    missieStreak: pr.missieLaatst === gisterKort(nu) ? (pr.missieStreak || 0) + 1 : 1,
    missieLaatst: vandaag,
    punten: (pr.punten || 0) + MISSIEBONUS,
    weekPunten: (pr.weekPunten || 0) + MISSIEBONUS,
  }
}

export interface Insigne { id: string; emoji: string; naam: string; test: (p: Voortgang) => boolean }

export const INSIGNES: Insigne[] = [
  { id: 'p50', emoji: '⭐', naam: '50 punten', test: (p) => p.punten >= 50 },
  { id: 'p150', emoji: '🌟', naam: '150 punten', test: (p) => p.punten >= 150 },
  { id: 'p300', emoji: '🏆', naam: '300 punten', test: (p) => p.punten >= 300 },
  { id: 's5', emoji: '🔥', naam: '5 op rij goed', test: (p) => p.streak >= 5 },
  { id: 'd3', emoji: '📅', naam: '3 dagen op rij', test: (p) => p.dagstreak >= 3 },
]

/** Welke insignes er nieuw bij komen. Leeg als er niets verdiend is. */
export const nieuweInsignes = (pr: Voortgang): string[] =>
  INSIGNES.filter((b) => b.test(pr) && !pr.badges.includes(b.id)).map((b) => b.id)
