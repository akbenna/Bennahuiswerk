/**
 * TOEVAL DAT JE KUNT VASTZETTEN
 *
 * De oefeningen hebben toeval nodig: afleiders kiezen, opties husselen, een
 * gat in een zin prikken. Met `Math.random` rechtstreeks is daar niets van te
 * toetsen en verandert een scherm bij elke hertekening van vorm.
 *
 * Vandaar deze bron: hij komt als argument mee, en een vaste beginwaarde geeft
 * altijd dezelfde reeks. In de app krijgt elke sessie een eigen beginwaarde uit
 * de klok; in de toets een vaste.
 */
export interface Toeval {
  /** Een getal in [0, 1). */
  (): number
}

/** Een eenvoudige lineair-congruente generator; goed genoeg om te husselen. */
export function bron(zaad: number): Toeval {
  let z = zaad || 1
  return () => {
    z = (z * 1103515245 + 12345) & 0x7fffffff
    return z / 0x7fffffff
  }
}

export function husselen<T>(arr: readonly T[], t: Toeval): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(t() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

export const willekeurig = <T>(arr: readonly T[], t: Toeval): T =>
  arr[Math.floor(t() * arr.length)] as T
