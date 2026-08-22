/**
 * NAKIJKEN
 *
 * Wat telt als goed. Ruimhartig waar het om schrijfwijze gaat — een komma of
 * een punt, een euroteken, een spatie, een liggend streepje in plaats van een
 * minteken — en streng waar het om de wiskunde gaat.
 *
 * Twee dingen worden bewust niét getolereerd. Breuken (3/4) en tijden (3:00)
 * moeten letterlijk kloppen: `parseFloat('3/4')` is 3, en dan zou "3" goed
 * gerekend worden op een vraag naar een breuk. En het antwoord mag hoogstens
 * een half procent afwijken, met een ondergrens van 0,01 — genoeg voor een
 * afronding, te weinig om te gokken.
 */

export function norm(x: unknown): string {
  return String(x ?? '').toLowerCase().trim()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(/€|%/g, '')
    .replace(/,/g, '.')
}

export interface TeToetsen { a: string; alt?: string[] | undefined }

export function antwoordKlopt(ex: TeToetsen, val: string): boolean {
  const nv = norm(val)
  if (nv === '') return false
  const numV = parseFloat(nv)
  for (const c of [ex.a, ...(ex.alt ?? [])]) {
    const nc = norm(c)
    if (nc === nv) return true
    /* Breuken en tijden: alleen letterlijk. */
    if (/[/:]/.test(nc) || /[/:]/.test(nv)) continue
    const numC = parseFloat(nc)
    if (!isNaN(numC) && !isNaN(numV)
      && Math.abs(numC - numV) <= Math.max(0.01, Math.abs(numC) * 0.005)) return true
  }
  return false
}

/**
 * Gerichte foutfeedback. Herkent de fouten die een methode verraden in plaats
 * van een rekenslip: een omgedraaid teken, een verkeerde eenheid, een komma op
 * de verkeerde plek, of km/u waar m/s hoort. Geeft niets terug als het antwoord
 * nergens op slaat — dan is een algemene tip nuttiger dan een verkeerde gok.
 */
export function diagnoseFout(inst: { a: string }, val: string): string | null {
  const nv = norm(val)
  if (nv === '') return null
  const numV = parseFloat(nv)
  const numA = parseFloat(norm(inst.a))
  if (isNaN(numV) || isNaN(numA) || numA === 0 || numV === 0) return null
  if (numV === -numA) return 'Let op het minteken — je antwoord heeft het verkeerde teken (+ of −).'
  const r = numV / numA
  if (Math.abs(r - 3.6) < 1e-6 || Math.abs(r - 1 / 3.6) < 1e-6) {
    return 'Bijna! Denk aan km/u ↔ m/s: dat is delen (of juist vermenigvuldigen) met 3,6.'
  }
  for (const f of [1000, 100, 10, 0.1, 0.01, 0.001]) {
    if (Math.abs(r - f) < 1e-9) {
      return 'Je hebt het juiste getal, maar een factor ' + (f >= 1 ? f : '1/' + Math.round(1 / f))
        + ' ernaast — controleer de eenheid of de plaats van de komma.'
    }
  }
  if (Math.abs(numV - numA) <= Math.abs(numA) * 0.1) {
    return 'Je zit er heel dichtbij — kijk je rekenwerk of afronding nog even na.'
  }
  return null
}
