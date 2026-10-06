/**
 * NAAR PROVITA: JE GEGEVENS OVERZETTEN VIA JE EIGEN BROWSER
 *
 * Wie in een programma van ProVita Care zit en zijn eten in deze app bijhoudt,
 * wil dat zijn behandelaar dat ziet. Tegelijk zegt `health/BEOOGD-DOEL.md` dat
 * deze app niet in een dossier schrijft en dat er niemand meekijkt. Dit is de
 * weg die allebei waar houdt.
 *
 * ProVita opent deze app in een nieuw venster met `?naar=provita`. Hier
 * verschijnt dan een vraag: wil je wat je hebt vastgelegd naar ProVita sturen?
 * Pas na ja haalt de app de export op (`kal_exporteren`, bestand 55) en geeft
 * hem met `postMessage` aan het venster dat hem opende. Daar ziet de patiënt
 * eerst wat er meekomt, en beslist hij nog een keer.
 *
 * Er is dus geen koppeling tussen de databases, geen sleutel die ergens wordt
 * bewaard, en geen moment waarop deze app zelf iets ergens neerzet. De
 * gebruiker draagt zijn eigen gegevens over, zoals artikel 20 AVG dat bedoelt,
 * alleen zonder dat hij een bestand hoeft te downloaden en weer te uploaden.
 *
 * WAAR HET OP STUKLOOPT, EN WAT DAN
 *
 * `postMessage` krijgt een doelorigin mee, en de browser bezorgt het bericht
 * alleen als het venster aan de andere kant precies die origin heeft. Daarom
 * staan de ProVita-adressen hieronder met naam, en wordt er naar elk ervan
 * apart verstuurd: bij alle andere wordt het bericht door de browser zelf
 * weggegooid. Een andere site die deze app opent met `?naar=provita` krijgt
 * dus niets, ook niet als de gebruiker ja zegt.
 *
 * Een geïnstalleerde app (PWA) op een iPhone opent een link in een apart
 * venster zonder `window.opener`. Dan valt er niets te bezorgen en biedt het
 * scherm het bestand als download aan, dat in ProVita in te lezen is.
 */

/** De adressen van ProVita Care die een export mogen ontvangen. */
export const PROVITA_ORIGINS = [
  'https://provita-care.nl',
  'https://www.provita-care.nl',
] as const

export const BERICHTSOORT = 'bennahealth-export'

/** Of deze pagina geopend is om gegevens naar ProVita te sturen. */
export function vraagtNaarProvita(zoek: string): boolean {
  return new URLSearchParams(zoek).get('naar') === 'provita'
}

export interface Opener {
  postMessage(bericht: unknown, doelOrigin: string): void
}

/**
 * Bezorgt de export bij het venster dat deze pagina opende. Geeft terug of er
 * een venster was om naar te sturen; of het bericht ook aankwam, weet alleen de
 * browser, en die zegt het niet.
 */
export function stuurNaarProvita(opener: Opener | null, bestand: unknown): boolean {
  if (!opener) return false
  for (const origin of PROVITA_ORIGINS) {
    opener.postMessage({ soort: BERICHTSOORT, bestand }, origin)
  }
  return true
}
