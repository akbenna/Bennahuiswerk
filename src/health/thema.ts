/**
 * THEMA — dag of nacht, en wie dat bepaalt.
 *
 * De app volgde alleen het toestel: `prefers-color-scheme` en verder niets. Dat
 * is een goede grondstand en een slecht eindstation. Wie zijn iPhone op nacht
 * heeft staan omdat dat 's avonds prettig is, zit er overdag ook in, en dan is
 * een scherm vol grafieken en lichte cijfers op bijna-zwart precies verkeerd om.
 *
 * Drie standen dus, en niet twee. "Volg het toestel" moet blijven bestaan als
 * eigen keuze: die doet iets anders dan dag of nacht — hij schakelt mee met de
 * schemerstand van iOS. Een tuimelschakelaar met twee standen kan dat niet
 * uitdrukken, want zodra je hem aanraakt ben je die koppeling kwijt en kun je er
 * niet meer terug.
 *
 * HOE HET WERKT
 *
 * Eén kenmerk op <html>: `data-thema="licht"` of `data-thema="donker"`. Bij
 * "volg het toestel" staat het er niet. De stijl leest dat kenmerk en verder
 * niemand — zie de toelichting boven in `stijl.css`.
 *
 * Dat het kenmerk er bij de grondstand níet staat is de hele truc. De
 * mediaquery blijft dan gewoon gelden, dus een toestel dat op nacht staat krijgt
 * de nachtkleuren van de stijl zelf, vóórdat er ook maar één regel JavaScript
 * gedraaid heeft. Zou de grondstand `data-thema="systeem"` heten en zou dit
 * bestand dat naar licht of donker moeten vertalen, dan zag je bij elke start
 * eerst een wit scherm oplichten.
 */
import { useSyncExternalStore } from 'react'

export type Themakeuze = 'systeem' | 'licht' | 'donker'

const SLEUTEL = 'kalibratie.thema'
const KEUZES: readonly Themakeuze[] = ['systeem', 'licht', 'donker']

/** Wat er op het scherm staat bij elke stand. */
export const THEMANAMEN: ReadonlyArray<{ keuze: Themakeuze; naam: string; titel: string }> = [
  { keuze: 'systeem', naam: 'Volg het toestel', titel: 'Schakelt mee met de schemerstand van je telefoon' },
  { keuze: 'licht', naam: 'Dag', titel: 'Altijd het lichte thema' },
  { keuze: 'donker', naam: 'Nacht', titel: 'Altijd het donkere thema' },
]

function gelezen(): Themakeuze {
  try {
    const x = localStorage.getItem(SLEUTEL)
    return KEUZES.includes(x as Themakeuze) ? (x as Themakeuze) : 'systeem'
  } catch {
    return 'systeem'
  }
}

let keuze: Themakeuze = gelezen()
const luisteraars = new Set<() => void>()

function schilder(): void {
  const el = document.documentElement
  if (keuze === 'systeem') delete el.dataset.thema
  else el.dataset.thema = keuze
}

/**
 * Eén keer aanroepen bij het opstarten, vóór het renderen. Niet in een effect:
 * dan staat het scherm er al een tel in de verkeerde kleur.
 */
export function themaToepassen(): void {
  schilder()
}

export function zetThema(nieuw: Themakeuze): void {
  keuze = nieuw
  try {
    if (nieuw === 'systeem') localStorage.removeItem(SLEUTEL)
    else localStorage.setItem(SLEUTEL, nieuw)
  } catch { /* een geweigerde opslag mag de knop niet stukmaken */ }
  schilder()
  for (const f of luisteraars) f()
}

/**
 * Eén abonnement voor allebei de haken. Er zijn twee dingen die de uitkomst
 * kunnen veranderen — de keuze hier, en de schemerstand van het toestel — en
 * wie op het één let moet ook op het ander letten: bij "volg het toestel"
 * verandert de kleur zonder dat er hier iets gebeurt.
 */
function abonneer(melden: () => void): () => void {
  luisteraars.add(melden)
  const vraag = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme:dark)') : null
  vraag?.addEventListener('change', melden)
  return () => {
    luisteraars.delete(melden)
    vraag?.removeEventListener('change', melden)
  }
}

export function useThemakeuze(): Themakeuze {
  return useSyncExternalStore(abonneer, () => keuze, () => 'systeem' as Themakeuze)
}

function donkerNu(): boolean {
  if (keuze === 'donker') return true
  if (keuze === 'licht') return false
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme:dark)').matches
}

/**
 * Of het nú donker is. Alleen nodig waar een kleur niet uit de stijl komt maar
 * uit JavaScript — het verloop van de hero op Vandaag is de enige plek. Inline
 * stijl luistert niet naar een mediaquery, dus daar moet de app zelf kijken.
 */
export function useDonker(): boolean {
  return useSyncExternalStore(abonneer, donkerNu, () => false)
}
