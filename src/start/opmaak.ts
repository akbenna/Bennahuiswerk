/** Hoe getallen, namen en datums er op de startpagina uitzien. */

export const hoofd = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export const euro = (n: number | null | undefined): string =>
  '€ ' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace('.', ',')

export function datum(d: string | null | undefined): string {
  if (!d) return '—'
  const t = new Date(d)
  if (Number.isNaN(t.getTime())) return '—'
  const dagen = Math.floor((Date.now() - t.getTime()) / 86_400_000)
  if (dagen <= 0) return 'vandaag'
  if (dagen === 1) return 'gisteren'
  if (dagen < 14) return dagen + ' dagen geleden'
  return t.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export type Stiltklasse = 'goed' | 'let' | 'stil'

/** Hoe lang is het al stil? */
export function stilte(d: string | null | undefined): { tekst: string; klasse: Stiltklasse } {
  if (!d) return { tekst: 'nog nooit', klasse: 'stil' }
  const t = new Date(d).getTime()
  if (!Number.isFinite(t)) return { tekst: 'nog nooit', klasse: 'stil' }
  const dagen = Math.floor((Date.now() - t) / 86_400_000)
  if (dagen <= 1) return { tekst: datum(d), klasse: 'goed' }
  if (dagen <= 4) return { tekst: datum(d), klasse: 'let' }
  return { tekst: datum(d), klasse: 'stil' }
}

export interface Nu { dag: string; datum: string; tijd: string }

/** De klok op de startpagina. Los van de opmaak van de rest, want hier hoort de
 *  dag voluit ("Woensdag") en niet "25 jun" — het is een begroeting en geen
 *  tabelcel. */
export const nu = (t: Date = new Date()): Nu => ({
  dag: hoofd(t.toLocaleDateString('nl-NL', { weekday: 'long' })),
  datum: t.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }),
  tijd: t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
})
