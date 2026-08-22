/** Getallen zoals een Nederlander ze leest: punt voor duizend, komma voor decimaal. */

/** Heel getal met duizendscheiding. Een streepje als er niets te tonen is —
 *  niet een nul, want niets weten en nul zijn is niet hetzelfde. */
export const dz = (n: number | null | undefined): string =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('nl-NL')

/** Decimaal met vaste precisie, komma als scheidingsteken. */
export const dec = (v: number | null | undefined, n = 1): string =>
  v == null || Number.isNaN(v) ? '—' : Number(v).toFixed(n).replace('.', ',')
