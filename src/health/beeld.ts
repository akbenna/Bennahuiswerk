/**
 * DE FOTO BIJ EEN PRODUCT: een korte lijst, met opzet
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
 * niet meer, dan is het gevolg dat er geen foto verschijnt, het duurste wat
 * deze lijst kan misgaan.
 */

/** Waar de bestanden staan zodra de app gebouwd is. */
const MAP = '/health/eten/'

/**
 * NEVO-code naar bestand. Meerdere codes mogen naar dezelfde foto wijzen als
 * het werkelijk hetzelfde beeld is, grof en fijn volkorenbrood zien er op een
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
 * ingebouwde functie terug en `FOTOS['__proto__']` het prototype, allebei
 * waarheidsgetrouw genoeg om door een `if` te komen. Er zou dan een `<img>` op
 * het scherm staan met de broncode van een functie als adres. De proef bij dit
 * bestand viel er meteen over; zonder die proef was het er stil in gebleven,
 * want geen enkel echt NEVO-product heet zo.
 */
export function fotoVoor(nevoCode: string | null | undefined): string | null {
  if (!nevoCode || !Object.hasOwn(FOTOS, nevoCode)) return null
  return MAP + FOTOS[nevoCode]
}

/* ────────────────────────────────────────────────────────────────────────────
   DE FOTO BIJ EEN GERECHT, een tweede lijst, om een andere reden
   ────────────────────────────────────────────────────────────────────────────

   Hierboven staat waarom er voor de voedingsmiddelentabel bijna geen foto's
   zijn: 2.328 producten en tien beelden, dus zwijgen is het eerlijkste. Bij de
   gerechtenbibliotheek ligt dat anders, en dat verschil is het noemen waard.

   De bibliotheek is met de hand samengesteld en telt ruim honderd gerechten uit
   de Marokkaanse, Turkse, Syrische, Surinaamse en Nederlandse keuken. Juist die
   gerechten ontbreken in elke beeldbank, terwijl het het eten is dat hier
   werkelijk gekookt wordt. Een foto per gerecht is hier dus geen versiering
   maar herkenning: wie 'harira' leest twijfelt misschien, wie de kom ziet niet.

   WAAROM OP NAAM EN NIET OP ID

   De id's van de gerechten staan in de database en niet in dit bestand. Ze hier
   overtypen zou een tweede waarheid maken die stil kan gaan afwijken. De naam
   staat wél in het `Gerecht`-object dat het portievenster al in handen heeft,
   dus daarop koppelen we.

   Dat heeft een prijs, en die moet genoemd worden: wijzigt iemand de naam in de
   bibliotheek, dan verdwijnt de foto zonder waarschuwing. Dat is het goedkoopste
   wat hier mis kan gaan, er staat dan geen foto, en nooit de verkeerde.

   WAAROM DE SLEUTEL GENORMALISEERD WORDT

   'Mercimek çorbası', 'Mercimek corbasi' en 'mercimek çorbasi' zijn hetzelfde
   gerecht en drie verschillende letterreeksen. De sleutel haalt accenten weg,
   zet alles klein en vervangt elke reeks niet-letters door één spatie. Wat
   overblijft is stabiel genoeg om met de hand te onderhouden.

   Wat deze sleutel bewust NIET doet is gedeeltelijk matchen. 'Harira met lam'
   levert geen treffer op 'harira'. Dat is geen tekortkoming maar het punt: een
   foto hoort te tonen wat er staat, en een gerecht met lam is een ander gerecht
   dan een gerecht zonder. Liever geen foto dan een foto die bijna klopt. */

/** Waar de gerechtfoto's staan zodra de app gebouwd is. */
const GERECHTMAP = '/health/gerechten/'

/**
 * De sleutel waarop een gerechtnaam wordt opgezocht.
 *
 * De dotloze Turkse ı (U+0131) valt niet uiteen onder NFD (anders dan ç, ş en
 * ğ, die dat wel doen) dus die wordt apart afgevangen. Zonder die regel wordt
 * 'çorbası' tot 'corbas' en zou de sleutel in de lijst hieronder er onleesbaar
 * uit moeten zien om te kunnen werken.
 */
export function gerechtsleutel(naam: string): string {
  return naam
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Genormaliseerde gerechtnaam naar bestand.
 *
 * Elk beeld is voor toevoeging bekeken: is dit het gerecht, ziet het er
 * thuisgekookt uit, staat er geen tekst in. Wie er een toevoegt doet hetzelfde.
 *
 * WAT ER BIJ HET KEUREN GEBEURDE
 *
 * Bij 'Kuru fasulye (witte bonen)' lag eerst een foto van kikkererwten, rond,
 * met het snaveltje, en niet de ovale witte boon waar het gerecht naar heet. Op
 * het contactblad viel dat niet op, in een uitsnede van twee keer wel. Dat
 * gerecht stond daarom een levering lang zonder beeld: liever geen foto dan een
 * foto die bijna klopt. De tweede levering bracht de goede (witte bonen in
 * tomatensaus met ui en groene peper, rijst ernaast) en nu staat hij er wel.
 *
 * Twee andere verdienen een aantekening. Bij de couscous is het lamsvlees niet
 * te zien (dat ligt bij dit gerecht onder de berg, zoals het hoort) en bij de
 * roti ontbreekt de kousenband naast de kip en de aardappel. Daar gaat het om
 * een onderdeel dat buiten beeld valt, niet om een ander gerecht.
 */
export const GERECHTFOTOS: Readonly<Record<string, string>> = {
  /* marokkaans */
  'harira': 'harira.jpg',
  'zaalouk auberginesalade': 'zaalouk.jpg',
  'couscous met zeven groenten en lamsvlees': 'couscous-zeven-groenten.jpg',
  'kefta tajine met ei en tomaat': 'kefta-tajine.jpg',
  /* turks */
  'bulgur pilavi': 'bulgur-pilavi.jpg',
  'mercimek corbasi rode linzensoep': 'mercimek-corbasi.jpg',
  'kuru fasulye witte bonen': 'kuru-fasulye.jpg',
  /* syrisch */
  'fattoush': 'fattoush.jpg',
  'kibbeh': 'kibbeh.jpg',
  /* surinaams */
  'roti met kip kousenband en aardappel': 'roti-kip.jpg',
  'heri heri met bakkeljauw': 'heri-heri.jpg',
  /* nederlands */
  'erwtensoep met vlees': 'erwtensoep.jpg',
}

/**
 * Het pad naar de foto bij een gerecht, of null als er geen is.
 *
 * `Object.hasOwn` om dezelfde reden als hierboven: zonder die controle geeft
 * een gerecht dat toevallig 'constructor' heet de ingebouwde functie terug.
 * Onwaarschijnlijk, maar de proef bij dit bestand hield het al een keer tegen.
 */
export function fotoVoorGerecht(naam: string | null | undefined): string | null {
  if (!naam) return null
  const sleutel = gerechtsleutel(naam)
  if (!Object.hasOwn(GERECHTFOTOS, sleutel)) return null
  return GERECHTMAP + GERECHTFOTOS[sleutel]
}
