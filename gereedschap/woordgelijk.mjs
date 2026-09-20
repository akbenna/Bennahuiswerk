/**
 * Dezelfde functie als `src/gedeeld/woordgelijk.ts`, voor de opwekkers van de
 * gouden waarden. Twee kopieën is hier de goedkoopste oplossing: de opwekkers
 * draaien als los script zonder de padaliassen van de app, en een derde weg
 * erheen bouwen kost meer dan deze twaalf regels. De proef
 * `src/gedeeld/woordgelijk.proef.ts` toetst dat ze hetzelfde doen.
 */
export function woorden(tekst) {
  return tekst.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function woordgelijk(x) {
  if (typeof x === 'string') return woorden(x)
  if (Array.isArray(x)) return x.map(woordgelijk)
  if (x && typeof x === 'object') {
    const uit = {}
    for (const [k, v] of Object.entries(x)) uit[k] = woordgelijk(v)
    return uit
  }
  return x
}
