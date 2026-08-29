/**
 * ZOEKEN OF BESCHRIJVEN — hetzelfde vak, twee bedoelingen
 *
 * Het invoervel heeft bovenaan een zoekveld en verderop, ingeklapt, een vak om
 * te beschrijven wat je gegeten hebt. Dat is een logische indeling voor wie hem
 * gebouwd heeft en een onlogische voor wie hem gebruikt: je ziet één invoervak
 * en typt daarin wat je at.
 *
 * "twee boterhammen met mayonaise" in het zoekveld levert dan losse producten
 * op — en met een beetje pech een graanreep, omdat "twee" toevallig in
 * "B'tween" past. Wat je bedoelde was een maaltijd.
 *
 * Dit bestand beslist wanneer dat vermoeden gerechtvaardigd is, zodat het vel
 * kan aanbieden: dit lijkt een hele maaltijd, zal ik hem herkennen?
 *
 * WAAROM DRIE WOORDEN
 *
 * Productnamen die mensen zelf typen zijn kort: "tonijn", "halfvolle melk",
 * "bruin brood". Wie drie of meer woorden gebruikt is aan het vertellen, niet
 * aan het opzoeken. Twee is te weinig — dan zou "halfvolle melk" een maaltijd
 * heten en krijg je het aanbod bij elke tweede zoekopdracht, en een aanbod dat
 * te vaak komt leert iedereen wegkijken.
 *
 * Vulwoorden tellen wel mee. Ze zijn juist het signaal: "met", "en", "een" —
 * daar herken je een zin aan. Wie ze eruit filtert houdt van "brood met kaas"
 * twee woorden over en mist precies het geval waar het om gaat.
 */

/** Woorden van twee letters of meer, zoals de gebruiker ze typte. */
function woorden(term: string): string[] {
  return term
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
}

/** Vanaf hier is het een zin en geen zoekterm. */
export const ZINDREMPEL = 3

/**
 * Klinkt dit als een hele maaltijd in plaats van als één product?
 *
 * Er wordt niets aan de gebruiker opgedrongen: dit bepaalt alleen of het aanbod
 * in beeld komt. De zoekresultaten blijven er gewoon onder staan, want soms
 * bedoelde je toch dat ene product.
 */
export function lijktOpZin(term: string): boolean {
  return woorden(term).length >= ZINDREMPEL
}
