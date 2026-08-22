/**
 * FSRS — de herhalingsplanner
 *
 * Compacte implementatie van de rekenkern van FSRS-4.5/5. Aannames, expliciet
 * gemaakt omdat ze afwijken van een volledige Anki-implementatie:
 *
 * 1. VASTE GEWICHTEN. De parameters worden niet geoptimaliseerd op de eigen
 *    reviewgeschiedenis. Dat vergt duizenden herhalingen en een optimizer; een
 *    gezin haalt die aantallen niet snel. We gebruiken de gepubliceerde
 *    standaardgewichten.
 * 2. DAGKORREL. Intervallen en verstreken tijd worden in hele dagen gerekend.
 *    Herhalingen binnen dezelfde dag (de "short-term scheduler" van FSRS-5)
 *    laten we weg; in plaats daarvan komt een kaart die je vandaag fout had
 *    achteraan de wachtrij van vandaag terug, zonder dat de stabiliteit
 *    opnieuw wordt bijgewerkt.
 * 3. VIER OORDELEN. 1 opnieuw, 2 lastig, 3 goed, 4 makkelijk. Bij oefeningen
 *    in de sessie oordeelt de app zelf: goed in één keer is 3, fout is 1.
 *    Alleen in het tabblad Herhaling kiest een volwassene zelf, omdat
 *    zelfbeoordeling daar informatie toevoegt en bij een kind vooral ruis.
 * 4. GEWENSTE RETENTIE 0,90. Bij die waarde geldt bij benadering interval ≈
 *    stabiliteit, wat het rekenwerk goed controleerbaar maakt.
 * 5. FUZZ. Op intervallen vanaf drie dagen zit een spreiding van ±5%, zodat
 *    kaarten die op dezelfde dag geleerd zijn niet levenslang op dezelfde dag
 *    terugkomen.
 *
 * Die spreiding komt hier als functie binnen in plaats van uit Math.random.
 * Zo is de planner zuiver en te toetsen: de gouden waarden uit de oude app
 * zijn gedraaid met de spreiding op precies één.
 */
import { dagVerschil, plusDagen } from './datum'

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]
const VERVAL = -0.5
const FACTOR = 19 / 81
export const RETENTIE = 0.90
const MAX_INTERVAL = 365 * 3

const klem = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))
const w = (i: number): number => W[i] as number

/** Oordeel: 1 opnieuw, 2 lastig, 3 goed, 4 makkelijk. */
export type Oordeel = 1 | 2 | 3 | 4

export interface Kaartstaat {
  /** Stabiliteit in dagen: hoe lang het geheugen het vasthoudt. */
  s: number
  /** Moeilijkheid, 1 tot 10. */
  d: number
  /** De dag van de laatste beoordeling. */
  laatst: string
  /** De dag waarop hij weer aan de beurt is. */
  due: string
  herh: number
  missers: number
}

/** De kans dat je hem nu nog weet, na `dagen` dagen bij stabiliteit `s`. */
export const ophaalbaarheid = (dagen: number, s: number): number =>
  Math.pow(1 + FACTOR * dagen / Math.max(s, 0.01), VERVAL)

/** Het interval dat bij een stabiliteit hoort, bij de gewenste retentie. */
export const interval = (s: number): number =>
  klem(Math.round((s / FACTOR) * (Math.pow(RETENTIE, 1 / VERVAL) - 1)), 1, MAX_INTERVAL)

const beginStabiliteit = (g: Oordeel): number => klem(w(g - 1), 0.1, MAX_INTERVAL)
const beginMoeilijkheid = (g: number): number =>
  klem(w(4) - Math.exp(w(5) * (g - 1)) + 1, 1, 10)

function nieuweMoeilijkheid(d: number, g: Oordeel): number {
  const delta = -w(6) * (g - 3)
  const lineair = d + delta * (10 - d) / 9 /* demping richting de randen */
  return klem(w(7) * beginMoeilijkheid(4) + (1 - w(7)) * lineair, 1, 10)
}

function stabiliteitNaSucces(s: number, d: number, r: number, g: Oordeel): number {
  const hard = g === 2 ? w(15) : 1
  const bonus = g === 4 ? w(16) : 1
  const alfa = 1 + Math.exp(w(8)) * (11 - d) * Math.pow(s, -w(9))
    * (Math.exp(w(10) * (1 - r)) - 1) * hard * bonus
  return klem(s * alfa, 0.1, MAX_INTERVAL)
}

function stabiliteitNaFout(s: number, d: number, r: number): number {
  const sf = w(11) * Math.pow(d, -w(12)) * (Math.pow(s + 1, w(13)) - 1) * Math.exp(w(14) * (1 - r))
  return klem(Math.min(sf, s), 0.1, MAX_INTERVAL)
}

/**
 * Een kaart beoordelen. `k` is de vorige staat of `null` bij een nieuwe kaart.
 * `spreiding` geeft een getal tussen 0 en 1 en staat standaard op de klok van
 * het toeval; met een vaste waarde wordt de planner voorspelbaar.
 */
export function beoordeel(
  k: Kaartstaat | null | undefined,
  g: Oordeel,
  dag: string,
  spreiding: () => number = Math.random,
): Kaartstaat {
  let s: number
  let d: number
  if (!k || k.s == null) {
    s = beginStabiliteit(g)
    d = beginMoeilijkheid(g)
  } else {
    const verlopen = Math.max(0, dagVerschil(k.laatst || dag, dag))
    const r = ophaalbaarheid(verlopen, k.s)
    d = nieuweMoeilijkheid(k.d, g)
    s = g === 1 ? stabiliteitNaFout(k.s, k.d, r) : stabiliteitNaSucces(k.s, d, r, g)
  }
  let iv = interval(s)
  if (iv >= 3) {
    /* Zie aanname 5: kaarten die op dezelfde dag geleerd zijn mogen niet
       levenslang op dezelfde dag terugkomen. */
    iv = klem(Math.round(iv * (1 + (spreiding() * 0.1 - 0.05))), 3, MAX_INTERVAL)
  }
  return {
    s: +s.toFixed(4),
    d: +d.toFixed(4),
    laatst: dag,
    due: plusDagen(dag, iv),
    herh: (k?.herh ?? 0) + 1,
    missers: (k?.missers ?? 0) + (g === 1 ? 1 : 0),
  }
}
