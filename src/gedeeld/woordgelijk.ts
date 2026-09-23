/**
 * DEZELFDE WOORDEN, ANDERE LEESTEKENS
 *
 * De gouden waarden van de zes leer-apps worden gedraaid uit de oude
 * HTML-pagina's in `gereedschap/oud/`. Ze bewijzen dat de overzetting naar
 * TypeScript woordgetrouw was, en dat archief hoort te blijven wat het is: een
 * bewijsstuk. Het bijwerken van die pagina's om een proef groen te krijgen zou
 * het bewijs vervalsen, en daar begint deze functie.
 *
 * Want er is nu één verandering die de lesteksten wél mochten ondergaan: de
 * gedachtestreepjes eruit. Die zijn met de hand vervangen door een komma, een
 * dubbele punt, haakjes of een punt, per zin gewogen. Op een strikte vinger
 * valt elke les daardoor om, en dan zegt de proef niets meer over wat er
 * werkelijk toe doet.
 *
 * WAT DEZE FUNCTIE WEGGOOIT, EN WAT ZE VASTHOUDT
 *
 * Weg gaan hoofdletters en alles wat geen letter of cijfer is. Over blijven de
 * woorden en de getallen, in hun volgorde. Daarmee blijft de proef zien wat ze
 * hoort te zien: een woord dat verdwijnt, een getal dat verschuift, een les die
 * van plaats wisselt. Ze ziet niet meer of er een komma of een dubbele punt
 * staat, en dat is precies de vrijheid die gegeven is.
 *
 * Wie een leesteken wél wil vastleggen, doet dat in een eigen proef bij het
 * bestand zelf. `src/health/schermtekst.proef.ts` doet dat voor het
 * gedachtestreepje, over de hele app.
 */

/** De woorden en getallen van een tekst, zonder leestekens en zonder kasten. */
export function woorden(tekst: string): string {
  return tekst.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/**
 * Dezelfde waarde, met elke tekst tot zijn woorden teruggebracht.
 *
 * Loopt door objecten en lijsten heen, want de gouden waarden zijn geneste
 * structuren en niet losse zinnen.
 */
export function woordgelijk<T>(x: T): T {
  if (typeof x === 'string') return woorden(x) as unknown as T
  if (Array.isArray(x)) return x.map(woordgelijk) as unknown as T
  if (x && typeof x === 'object') {
    const uit: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(x)) uit[k] = woordgelijk(v)
    return uit as unknown as T
  }
  return x
}
