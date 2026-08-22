/** Toeval, op één plek. Elk spel gebruikt deze drie en niets anders. */

/** Een heel getal van a tot en met b. */
export const ri = (a: number, b: number): number => Math.floor(Math.random() * (b - a + 1)) + a

/** Eén willekeurig element. Werpt niet bij een lege lijst maar geeft undefined —
 *  de aanroepers hieronder geven altijd een gevulde lijst mee. */
export const pak = <T,>(a: readonly T[]): T | undefined => a[Math.floor(Math.random() * a.length)]

/** Een geschudde kopie; de oorspronkelijke lijst blijft heel. */
export const hussel = <T,>(a: readonly T[]): T[] => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const x = b[i] as T
    b[i] = b[j] as T
    b[j] = x
  }
  return b
}
