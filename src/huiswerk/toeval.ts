/**
 * HET TOEVAL
 *
 * Waar de oude app rechtstreeks `Math.random()` aanriep, komt de bron hier als
 * argument binnen. Dat is geen netheid om de netheid: honderdtwintig sjablonen
 * met wisselende getallen zijn alleen te toetsen als je ze dezelfde getallen
 * kunt laten trekken, en zonder dat blijft "levert dit sjabloon het goede
 * antwoord?" een vraag die niemand beantwoordt.
 *
 * De drie functies zijn letterlijk die van de oude app, inclusief de
 * volgorde waarin ze uit de bron putten — anders rolt er bij hetzelfde zaad
 * een andere som uit en is de vergelijking waardeloos.
 */
import type { Toeval } from './gegevens/soorten'

export function toevalUit(bron: () => number): Toeval {
  return {
    ri: (a, b) => Math.floor(bron() * (b - a + 1)) + a,
    pick: <T>(a: readonly T[]): T => a[Math.floor(bron() * a.length)] as T,
    shuffle: <T>(a: readonly T[]): T[] => {
      const b = a.slice()
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(bron() * (i + 1))
        const t = b[i] as T
        b[i] = b[j] as T
        b[j] = t
      }
      return b
    },
  }
}

/** Het echte toeval, voor de app zelf. */
export const ECHT: Toeval = toevalUit(Math.random)
