/**
 * DE AANMELDING VAN HET PORTAAL
 *
 * Wie er aan staat wordt bewaard en gelezen in `@/gedeeld/sessie` — daar staat
 * ook waarom. Hier staat alleen wat van het portaal zelf is: het omzetten van
 * een aanmelding naar een sessie, en het ouderwachtwoord.
 */
import type { Aanmelding } from '@/gedeeld/db/bennahub'
import { GEZIN } from '@/gedeeld/db/bennahub'
import { bewaarWie, vergeetWie, wieBenIk } from '@/gedeeld/sessie'
import type { Ik } from '@/gedeeld/sessie'

const OUDER_WW = 'bennahub.ouderww'

export type { Ik }
export { wieBenIk }

export function meldAan(lid: Aanmelding): Ik {
  const s: Ik = {
    gezin: GEZIN, naam: lid.naam, rol: lid.rol, emoji: lid.emoji,
    kleur: lid.kleur, apps: lid.apps ?? [], tijd: Date.now(),
  }
  bewaarWie(s)
  return s
}

export function meldAf(): void {
  vergeetWie()
  try { sessionStorage.removeItem(OUDER_WW) } catch { /* mag falen */ }
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
