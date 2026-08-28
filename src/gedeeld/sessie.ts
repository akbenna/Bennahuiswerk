/**
 * WIE ER AAN STAAT — gelezen vanuit elke app
 *
 * Het portaal schrijft hier wie er binnenkwam; de losse apps lezen het. Ze
 * draaien op dezelfde herkomst en delen dus dezelfde localStorage.
 *
 * Waarom dit in `gedeeld` staat en niet in `start`: de sleutelnaam en de
 * houdbaarheid zijn één feit. Zou de huiswerk-app zijn eigen kopie van
 * `bennahub.wie` en van die acht uur bijhouden, dan lopen de twee ooit uiteen —
 * en dat merkt niemand, tot een kind ineens toch weer moet inloggen terwijl het
 * portaal hem nog als aangemeld ziet.
 */
import type { Rol } from './db/bennahub'

const SLEUTEL = 'bennahub.wie'

/** Een schooldag plus de avond. Op een gedeelde tablet blijft het account van
 *  's ochtends anders tot het slapengaan openstaan. */
const UREN = 8

export interface Ik {
  gezin: string
  naam: string
  rol: Rol
  emoji: string
  kleur: string
  apps: string[]
  /** Wanneer er is aangemeld. Bepaalt samen met UREN of dit nog geldt. */
  tijd: number
}

/**
 * Wie er nu aan staat, of null. `nuMs` is een argument en geen aanroep
 * binnenin, zodat de houdbaarheid te toetsen is zonder de klok te verzetten.
 */
export function wieBenIk(nuMs: number = Date.now()): Ik | null {
  try {
    const s = JSON.parse(localStorage.getItem(SLEUTEL) ?? 'null') as Ik | null
    if (!s?.naam) return null
    if (nuMs - (s.tijd ?? 0) > UREN * 3600 * 1000) return null
    return s
  } catch {
    return null
  }
}

export function bewaarWie(ik: Ik): void {
  try { localStorage.setItem(SLEUTEL, JSON.stringify(ik)) } catch { /* mag falen */ }
}

export function vergeetWie(): void {
  try { localStorage.removeItem(SLEUTEL) } catch { /* mag falen */ }
}
