/**
 * WIE ER AAN STAAT
 *
 * In localStorage, zodat je niet bij elke stap opnieuw moet typen. Wel met een
 * houdbaarheid: op een gedeelde tablet blijft anders het account van 's ochtends
 * de hele dag openstaan. Acht uur is een schooldag plus de avond.
 */
import type { Aanmelding, Rol } from '@/gedeeld/db/bennahub'
import { GEZIN } from '@/gedeeld/db/bennahub'

const SLEUTEL = 'bennahub.wie'
const OUDER_WW = 'bennahub.ouderww'
const UREN = 8

export interface Ik {
  gezin: string
  naam: string
  rol: Rol
  emoji: string
  kleur: string
  apps: string[]
  tijd: number
}

export function wieBenIk(): Ik | null {
  try {
    const s = JSON.parse(localStorage.getItem(SLEUTEL) ?? 'null') as Ik | null
    if (!s?.naam) return null
    if (Date.now() - (s.tijd ?? 0) > UREN * 3600 * 1000) return null
    return s
  } catch {
    return null
  }
}

export function meldAan(lid: Aanmelding): Ik {
  const s: Ik = {
    gezin: GEZIN, naam: lid.naam, rol: lid.rol, emoji: lid.emoji,
    kleur: lid.kleur, apps: lid.apps ?? [], tijd: Date.now(),
  }
  try { localStorage.setItem(SLEUTEL, JSON.stringify(s)) } catch { /* mag falen */ }
  return s
}

export function meldAf(): void {
  try {
    localStorage.removeItem(SLEUTEL)
    sessionStorage.removeItem(OUDER_WW)
  } catch { /* mag falen */ }
}

/* Het ouderwachtwoord staat in sessionStorage en niet in localStorage: het
   overleeft het wisselen van scherm maar niet het sluiten van het tabblad. */
export const leesOuderWw = (): string | null => {
  try { return sessionStorage.getItem(OUDER_WW) } catch { return null }
}
export const zetOuderWw = (ww: string): void => {
  try { sessionStorage.setItem(OUDER_WW, ww) } catch { /* mag falen */ }
}
export const wisOuderWw = (): void => {
  try { sessionStorage.removeItem(OUDER_WW) } catch { /* mag falen */ }
}
