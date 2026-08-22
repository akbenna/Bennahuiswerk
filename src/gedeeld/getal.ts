/** Getallen zoals een Nederlander ze leest: punt voor duizend, komma voor decimaal. */

/** Heel getal met duizendscheiding. Een streepje als er niets te tonen is —
 *  niet een nul, want niets weten en nul zijn is niet hetzelfde. */
export const dz = (n: number | null | undefined): string =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('nl-NL')

/** Decimaal met vaste precisie, komma als scheidingsteken. */
export const dec = (v: number | null | undefined, n = 1): string =>
  v == null || Number.isNaN(v) ? '—' : Number(v).toFixed(n).replace('.', ',')

/** Bedrag in euro. De spatie tussen het teken en het bedrag is een harde
 *  spatie: "€" en het bedrag horen bij elkaar en mogen niet over twee regels
 *  verdeeld raken. */
export const euro = (n: number): string =>
  '€ ' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')
