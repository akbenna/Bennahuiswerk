/**
 * DE FOTO BIJ EEN PRODUCT — een korte lijst, met opzet
 *
 * Er liggen tien foto's in `health/beeldmateriaal/`, en de voedingsmiddelentabel
 * heeft er 2.328 regels. Die verhouding bepaalt het hele ontwerp.
 *
 * WAAROM DIT EEN HANDGEMAAKTE LIJST IS EN GEEN KOLOM IN DE DATABASE
 *
 * Een beeldkolom op `nevo_foods` zou voor 2.320 producten leeg staan. Dat is
 * geen gegeven maar een belofte die niet waargemaakt wordt, en het nodigt uit
 * tot vullen met wat er toevallig lijkt te passen. Zes foto's zijn met de hand
 * aan een code gekoppeld en daar houdt het op. Wie er een toevoegt, kijkt er
 * eerst naar.
 *
 * WAAROM NIET OP GROEP
 *
 * De verleiding is groot: één notenfoto voor de hele groep "Noten en zaden"
 * dekt in één klap veertig producten. Maar een walnoot is geen cashewnoot, en
 * een foto die "ongeveer dit soort ding" zegt is precies de soort benadering
 * waar deze app het elders niet bij laat. Een foto hoort te tonen wat je
 * aanklikte, of er hoort er geen te staan.
 *
 * WAAROM ALLEEN IN HET PORTIEVENSTER
 *
 * Daar staat één product op het scherm, dus een ontbrekende foto betekent geen
 * foto en verder niets. In de zoeklijst zou hetzelfde bestand een lijst opleveren
 * waarin drie van de twaalf regels een plaatje hebben, en dat leest als kapot en
 * niet als levendig.
 *
 * De codes komen uit de tabel zelf en niet uit mijn hoofd. Klopt er ooit een
 * niet meer, dan is het gevolg dat er geen foto verschijnt — het duurste wat
 * deze lijst kan misgaan.
 */

/** Waar de bestanden staan zodra de app gebouwd is. */
const MAP = '/health/eten/'

/**
 * NEVO-code naar bestand. Meerdere codes mogen naar dezelfde foto wijzen als
 * het werkelijk hetzelfde beeld is — grof en fijn volkorenbrood zien er op een
 * foto niet anders uit.
 */
export const FOTOS: Readonly<Record<string, string>> = {
  '151': 'food_banana.png',        // Banaan
  '689': 'food_avocado.png',       // Avocado
  '1587': 'food_salmon.png',       // Zalm kweek- rauw
  '5261': 'food_skyr.png',         // Skyr m vruchten magere
  '207': 'food_nuts.png',          // Noten gemengd ongezouten
  '1935': 'food_nuts.png',         // Noten gemengd gezouten
  '2782': 'food_bread.png',        // Tarwebrood volkoren grof
  '2811': 'food_bread.png',        // Tarwebrood volkoren fijn
}

/**
 * Het pad naar de foto, of null als er voor dit product geen foto is.
 *
 * `Object.hasOwn` en niet gewoon `FOTOS[code]`, en dat is geen overdaad. Een
 * objectliteral erft van `Object.prototype`, dus `FOTOS['constructor']` geeft de
 * ingebouwde functie terug en `FOTOS['__proto__']` het prototype — allebei
 * waarheidsgetrouw genoeg om door een `if` te komen. Er zou dan een `<img>` op
 * het scherm staan met de broncode van een functie als adres. De proef bij dit
 * bestand viel er meteen over; zonder die proef was het er stil in gebleven,
 * want geen enkel echt NEVO-product heet zo.
 */
export function fotoVoor(nevoCode: string | null | undefined): string | null {
  if (!nevoCode || !Object.hasOwn(FOTOS, nevoCode)) return null
  return MAP + FOTOS[nevoCode]
}
