/**
 * DE SFEERFOTO PER TABBLAD
 *
 * Eén band bovenaan elk scherm. Niet om iets te zeggen: er staat een fiets bij
 * Beweging omdat dat een toon zet, niet omdat je vandaag gefietst hebt.
 *
 * WAAROM DIT HIER STAAT EN NIET IN ELK SCHERM APART
 *
 * Omdat het een keuze is over de app als geheel en niet over één scherm. Zes
 * foto's naast elkaar zijn een sfeer; zes losse besluiten in zes bestanden zijn
 * dat na een half jaar niet meer. Wie hem wil wisselen, wisselt hem hier, en
 * ziet meteen wat er naast staat.
 *
 * Elk beeld hoort bij de vraag van zijn scherm: een fiets in de polder bij
 * Beweging, een weegschaal bij Inzicht, een bloeddrukmeter bij Gezondheid,
 * groenten bij Voeding, een ontbijt bij Vandaag, de voorraadkast bij Meer.
 *
 * WAAROM ER TWEE MATEN ZIJN
 *
 * Hier stonden eerst productfoto's van 384 bij 384, en die werden op een
 * telefoon ruim drie keer opgeblazen, de band is daar 396 punten breed en een
 * telefoon zet er drie beeldpunten op elk punt, dus hij vraagt er 1290.
 *
 * Eén maat lost dat niet netjes op. Een bureaublad van 1920 met twee
 * beeldpunten per punt vraagt er 2564; een telefoon vraagt er 1290. Zou er
 * alleen een band van 2400 liggen, dan haalt elke telefoon tweehonderd kilobyte
 * per scherm binnen die hij niet kan tonen, en dit is een app die vooral op een
 * telefoon open staat.
 *
 * Dus twee bestanden en een `srcset`: de browser rekent zelf uit welke hij
 * nodig heeft. Wat hij dan kiest is te meten (`img.naturalWidth` zegt welke
 * het geworden is) en dat is precies wat de proef in `health-voorbeeld.mjs`
 * doet, op drie maten.
 *
 * `SIZES` zegt hoe breed de band wórdt, want dat kan de browser niet zien
 * voordat hij de stijl heeft. De getallen zijn gemeten en niet geschat: op een
 * telefoon van 430 is de band 396 (92%), op 1440 is hij 1074 (75%), op 1920 is
 * hij 1318 (69%). De 75 procent hierboven schat dus royaal aan de veilige kant:
 * liever een beeld te groot dan een dat te klein blijkt.
 *
 * De bronnen zijn 2400 bij 900 aangeleverd. Dat is gemeten echt detail en geen
 * opschaling van de vorige levering: de randenergie per beeldpunt ligt 1,32 keer
 * hoger dan wanneer je diezelfde 1600 zelf naar 2400 trekt. `LEESMIJ.md` in
 * `health/beeldmateriaal/` beschrijft hoe dat gemeten is.
 */

/** Wat er in `src` gaat: de kleinste maat, en dus ook wat een browser zonder
 *  `srcset` krijgt. */
export const SFEERFOTO = {
  vandaag: '/health/koppen/vandaag-1600.jpg',
  voeding: '/health/koppen/voeding-1600.jpg',
  inzicht: '/health/koppen/inzicht-1600.jpg',
  beweging: '/health/koppen/beweging-1600.jpg',
  gezondheid: '/health/koppen/gezondheid-1600.jpg',
  meer: '/health/koppen/meer-1600.jpg',
} as const

/** De twee maten waarin elke band klaarligt. */
export const SFEERMATEN = [1600, 2400] as const

/**
 * De `srcset` bij een sfeerfoto: dezelfde naam, de andere maat ernaast.
 *
 * Afgeleid uit het pad en niet los opgeschreven, want twee lijsten die
 * hetzelfde moeten zeggen lopen uiteen zodra er één wordt aangeraakt. Staat er
 * een pad in dat niet op `-1600.jpg` eindigt, dan komt er niets terug en valt
 * de browser terug op `src`, een band die iets te zacht is, en geen kapotte.
 */
export function sfeerSrcset(pad: string): string | undefined {
  if (!pad.endsWith('-1600.jpg')) return undefined
  const stam = pad.slice(0, -'-1600.jpg'.length)
  return SFEERMATEN.map((m) => `${stam}-${m}.jpg ${m}w`).join(', ')
}

/** Hoe breed de band wordt, zodat de browser de juiste maat kan kiezen.
 *  Gemeten, zie de kop van dit bestand. */
export const SFEER_SIZES = '(min-width: 1240px) 75vw, 95vw'
