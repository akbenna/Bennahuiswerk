/**
 * WAAR EEN GETAL VANDAAN KOMT
 *
 * Er is één onderscheid dat in deze app overal terugkomt: staat er een gemeten
 * tabelwaarde achter dit getal, of is het een schatting? Dat verschil bepaalt
 * hoeveel het waard is, en het stond tot nu toe met zoveel woorden op het
 * scherm — "NEVO: Tarwestokbrood wit", "geen tabelwaarde — schatting van het
 * model".
 *
 * Dat is te veel uitleg voor iets wat je in één oogopslag wilt zien, en het is
 * bovendien jargon: NEVO zegt een kind niets en een gast ook niet. Het is
 * daarom een teken geworden.
 *
 *   ◆  gemeten     — de waarde komt uit de voedingsmiddelentabel
 *   ◈  etiket      — de opgave van een fabrikant
 *   ◇  geschat     — een schatting: het model, een gerecht of je eigen product
 *
 * Het middelste teken is er later bij gekomen, met de merkproducten, en het
 * moest erbij. Een etiket is geen van beide: het is geen laboratoriumbepaling,
 * maar het is ook geen gok — er staat een fabrikant achter die er wettelijk aan
 * gehouden kan worden, met een toegestane marge van rond de tien procent op de
 * energie. Dat onder ◇ scharen zou het te laag inschatten en onder ◆ te hoog.
 *
 * Gevuld tegen open, hetzelfde teken. Dat is met opzet: het zijn twee soorten
 * van hetzelfde, geen goed en fout. Een schatting is niet verkeerd, hij is
 * alleen minder zeker — en hoevéél minder zeker staat al in de graad A tot D
 * ernaast.
 *
 * De volledige uitleg staat in de titel, zodat wie de muis stilhoudt of een
 * schermlezer gebruikt het gewone woord alsnog krijgt. Het teken is de korte
 * vorm, niet de enige vorm.
 *
 * ÉÉN PLEK
 *
 * Dit bestand is de enige plek waar dat onderscheid gemaakt wordt. Zou elk
 * scherm zelf `r.nevo_naam ? … : …` schrijven, dan lopen ze uiteen zodra er een
 * bron bij komt — en dat is precies wat er stond te gebeuren met de merkgegevens
 * van winkels erbij.
 */
import type { RegelBron } from '@/gedeeld/db/tabellen'

/** Genoeg van een regel om te weten waar hij vandaan komt. */
export interface RegelHerkomst {
  nevo_naam?: string | null
  nevo_code?: string | null
  bron?: RegelBron | string
}

export interface Herkomst {
  /** Het teken dat op het scherm komt. */
  teken: '◆' | '◈' | '◇'
  /** Wat het teken betekent, in gewone taal. Voor `title` en schermlezers. */
  uitleg: string
  /** Of er een gemeten tabelwaarde achter zit. */
  gemeten: boolean
}

const GEMETEN: Herkomst = {
  teken: '◆',
  gemeten: true,
  uitleg: 'gemeten waarde uit de voedingsmiddelentabel',
}

const ETIKET: Herkomst = {
  teken: '◈',
  gemeten: false,
  uitleg: 'etiketwaarde van de fabrikant',
}

const GESCHAT: Herkomst = {
  teken: '◇',
  gemeten: false,
  uitleg: 'geschat, geen tabelwaarde',
}

/**
 * De herkomst van één regel. Doorslaggevend is of er een tabelnaam bij staat:
 * die krijgt een regel alleen als de server hem in de tabel heeft opgezocht.
 * `bron` alleen is niet genoeg — een regel uit een eigen recept draagt `recept`
 * terwijl de onderdelen wél uit de tabel kwamen.
 */
export function herkomstVan(regel: RegelHerkomst): Herkomst {
  /* De tabel gaat voor. Een merkregel heeft nooit een tabelnaam, dus deze twee
     kunnen elkaar niet in de weg zitten — maar de volgorde staat er expliciet,
     want als het ooit wél kan, wint de meting. */
  if (regel.nevo_naam || regel.nevo_code) return GEMETEN
  if (regel.bron === 'merk') return ETIKET
  return GESCHAT
}

/** Wat er achter het teken hoort te staan, als er ruimte voor is. */
export function herkomstTekst(regel: RegelHerkomst): string {
  const h = herkomstVan(regel)
  if (!h.gemeten) return h.uitleg
  return regel.nevo_naam ? `${h.uitleg}: ${regel.nevo_naam}` : h.uitleg
}

/**
 * Het teken op het scherm, met de naam erachter als die er is.
 *
 * Zonder omhulsel, want de plaatsen waar het staat verschillen: soms alleen, soms
 * met nog iets erachter op dezelfde regel. De aanroeper bepaalt de opmaak.
 *
 * Het teken staat in een `<abbr>`: dat is precies wat het is — een afkorting met
 * een uitgeschreven vorm. Wie de muis stilhoudt of een schermlezer gebruikt
 * krijgt de gewone woorden alsnog, zonder dat ze de hele dag ruimte innemen.
 */
export function Bron({ regel }: { regel: RegelHerkomst }) {
  const h = herkomstVan(regel)
  return (
    <>
      <abbr className="herkomst" title={h.uitleg}>{h.teken}</abbr>{' '}
      {regel.nevo_naam
        ?? (h.gemeten ? 'tabelwaarde'
            : h.teken === '◈' ? 'etiket van de fabrikant'
            : 'schatting van het model')}
    </>
  )
}
