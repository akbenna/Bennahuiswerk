/**
 * WAT ER GEBEURT NA EEN ANTWOORD
 *
 * Eén functie, en dat is met opzet: punten, Leitner-doosje, dagteller,
 * foutenschrift, automatisch niveau, insignes, dagmissie, verdiensten en de
 * wekelijkse momentopname horen bij elkaar en mogen niet uit de pas raken.
 *
 * Alles is puur — de voortgang gaat erin en er komt een nieuwe uit. Zo is de
 * hele keten te toetsen zonder scherm, zonder opslag en zonder klok.
 */
import { dagKort, weekSleutel } from './datum'
import type { Kaart, Opgave } from './gegevens/soorten'
import { NIVEAUGEWICHT, legVerdienstVast } from './beloning'
import { isBeheerst } from './leitner'
import { INSIGNES, verzilverMissie } from './missie'
import { momentopname } from './volgsysteem'
import type { Foutregel, Kaartstand, Voortgang } from './opslag'
import { leegDag } from './opslag'

/** Bij een nieuwe week schuift de ijkwaarde mee, zodat de toernooistand netjes
 *  bij nul begint. */
function nieuweWeek(pr: Voortgang, nuMs: number): Voortgang {
  const wk = weekSleutel(nuMs)
  if (pr.weekKey === wk) return pr
  return { ...pr, weekKey: wk, weekPunten: 0, weekBasis: pr.punten || 0 }
}

/** Bij een nieuwe dag begint de eerlijke dagteller opnieuw — die telt wat er
 *  vandáág verdiend is en mag niets van gisteren meenemen. */
function nieuweDag(pr: Voortgang, nu: Date): Voortgang {
  const vandaag = dagKort(nu)
  if (pr.dag.d === vandaag) return { ...pr, dag: { ...pr.dag, sterkIds: [...pr.dag.sterkIds] } }
  return { ...pr, dag: { ...leegDag(), d: vandaag } }
}

export interface Antwoord {
  kaart: Kaart
  /** De opgave zoals hij op het scherm stond; bij een sjabloon met de getallen
   *  van deze beurt erin. */
  beurt: Opgave
  goed: boolean
  hintGebruikt: boolean
}

/**
 * Het resultaat van één antwoord verwerken.
 *
 * De punten: tien voor een som die nog niet beheerst was, vijf als er een hint
 * bij is gebruikt, drie als de som al beheerst was. Dat laatste is geen straf
 * maar een sturing — herhalen wat je al kunt is minder waard dan leren wat je
 * nog niet kunt.
 */
export function verwerkAntwoord(vorig: Voortgang, a: Antwoord, nu: Date): Voortgang {
  const nuMs = nu.getTime()
  let pr = nieuweWeek(nieuweDag(vorig, nu), nuMs)
  const wasBeheerst = isBeheerst(pr, a.kaart.id)
  const c: Kaartstand = { ...(pr.cards[a.kaart.id] ?? { box: 0, ok: 0, wrong: 0, last: 0 }) }
  const lvl = a.beurt.lvl ?? a.kaart.lvl ?? 1
  const cards = { ...pr.cards }
  const solved = { ...pr.solved }
  let foutLog: Foutregel[] = [...pr.foutLog]
  const dag = { ...pr.dag, sterkIds: [...pr.dag.sterkIds] }

  if (a.goed) {
    const erbij = wasBeheerst ? 3 : (a.hintGebruikt ? 5 : 10)
    pr = {
      ...pr,
      punten: (pr.punten || 0) + erbij,
      weekPunten: (pr.weekPunten || 0) + erbij,
      streak: (pr.streak || 0) + 1,
      todayCount: (pr.todayCount || 0) + 1,
    }
    dag.goed++
    /* "Sterk" telt hoogstens één keer per kaart per dag, en weegt naar niveau:
       anders is dezelfde makkelijke som twintig keer herhalen het lucratiefst. */
    if (!wasBeheerst && !a.hintGebruikt && !dag.sterkIds.includes(a.kaart.id)) {
      dag.sterk++
      dag.sterkPunten = (dag.sterkPunten || 0) + (NIVEAUGEWICHT[lvl] ?? 1)
      dag.sterkIds.push(a.kaart.id)
    }
    c.ok = (c.ok || 0) + 1
    c.box = Math.min(5, (c.box || 0) + 1)
    solved[a.kaart.id] = { ok: (solved[a.kaart.id]?.ok ?? 0) + 1 }
    /* Beheerst → uit het foutenschrift. */
    if (c.box >= 4) foutLog = foutLog.filter((f) => f.id !== a.kaart.id)
  } else {
    pr = { ...pr, streak: 0 }
    c.wrong = (c.wrong || 0) + 1
    c.box = 1
    dag.fout++
    const regel: Foutregel = {
      id: a.kaart.id, t: a.kaart.t, v: a.kaart.v,
      q: a.beurt.q, a: a.beurt.a, u: a.beurt.u ?? '', when: nuMs,
    }
    foutLog = [regel, ...foutLog.filter((f) => f.id !== a.kaart.id)].slice(0, 40)
  }

  /* Automatisch niveau: drie goed op rij is een tikje moeilijker, één fout is
     een tikje makkelijker. Sneller omhoog dan omlaag zou een kind vastzetten op
     stof die het net niet aankan. */
  let correctRun = pr.correctRun || 0
  let autoLvl = pr.autoLvl || 1
  if (a.goed) {
    correctRun++
    if (correctRun >= 3 && autoLvl < 3) { autoLvl++; correctRun = 0 }
  } else {
    correctRun = 0
    if (autoLvl > 1) autoLvl--
  }

  c.last = nuMs
  cards[a.kaart.id] = c
  pr = { ...pr, cards, solved, foutLog, dag, correctRun, autoLvl }

  pr = verzilverMissie(pr, nu) ?? pr

  const badges = [...pr.badges]
  for (const b of INSIGNES) if (!badges.includes(b.id) && b.test(pr)) badges.push(b.id)
  pr = { ...pr, badges }

  pr = legVerdienstVast(pr, nuMs)
  return { ...pr, historie: momentopname(pr, nuMs) }
}

/** Een toetsuitslag bewaren, voor de "klaar voor de toets"-bonus. Alleen de
 *  béste score van vandaag telt: een tweede poging mag de eerste niet bederven. */
export function verwerkToets(
  vorig: Voortgang, isProef: boolean, pct: number, nu: Date,
): Voortgang {
  const nuMs = nu.getTime()
  const vandaag = dagKort(nu)
  const td = vorig.toetsDag.d === vandaag
    ? { ...vorig.toetsDag }
    : { d: vandaag, oefen: 0, proef: 0 }
  if (isProef) td.proef = Math.max(td.proef || 0, pct)
  else td.oefen = Math.max(td.oefen || 0, pct)

  let pr = nieuweWeek({ ...vorig, toetsDag: td }, nuMs)
  pr = verzilverMissie(pr, nu) ?? pr
  return legVerdienstVast(pr, nuMs)
}

/** De dagreeks bijwerken bij het openen van een profiel: gisteren geoefend →
 *  door; langer geleden → opnieuw beginnen. */
export function raakDag(pr: Voortgang, vandaag: string, gisteren: string): Voortgang {
  if (pr.lastDay === vandaag) return pr
  return {
    ...pr,
    dagstreak: pr.lastDay === gisteren ? (pr.dagstreak || 0) + 1 : 1,
    lastDay: vandaag,
    todayCount: 0,
  }
}
