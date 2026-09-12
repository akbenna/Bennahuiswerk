/**
 * DE TEKENTJES VAN DE TABBALK
 *
 * Dezelfde keuze als in `src/start/tekens.tsx`, en om dezelfde redenen. Geen
 * emoji — dat tekent elk toestel anders. Geen icoonbibliotheek — dat is
 * honderd kilobyte voor zes vormpjes, en een strikte Content-Security-Policy
 * laat er toch geen van een CDN binnen. Dit zijn lijnen die de kleur van hun
 * omgeving overnemen (`currentColor`), dus ze kloppen in het lichte thema, in
 * het donkere, en in de groene tint van het tabblad waar je op staat.
 *
 * WAAROM DE OUDE TEKENS WEG MOESTEN
 *
 * Er stonden zes losse Unicode-vormen op de balk: ◍ ◎ ◇ ◈ ✚ ⋯. Twee daarvan
 * waren al vergeven. ◇ betekent in deze app "geschat" en ◈ betekent "opgave van
 * het etiket" — dat staat op élk scherm naast élke waarde, en het is de
 * kortste samenvatting van waar deze app over gaat. Diezelfde ruiten óók als
 * tabblad gebruiken maakt van een betekenisvol teken een versiering.
 *
 * Wat een tekentje hier moet doen is één ding: bij één blik zeggen waar je
 * bent. Daarom een vorm die bij het scherm hoort en niet bij de plek in de rij.
 *
 * DE ZES
 *
 * Vandaag      de doelring — het beeld dat op dat scherm zelf de dag draagt
 * Inzicht      een lijn die daalt: de weegtrend, waar het verbruik uit komt
 * Voeding      een kom: eten opzoeken en toevoegen
 * Beweging     twee voetstappen
 * Gezondheid   een hart
 * Profiel      een persoon
 *
 * Beweging en Profiel zijn met opzet géén twee mensfiguren. Op twintig pixels
 * is het verschil tussen een lopend en een staand poppetje weg, en dan staan er
 * twee tabbladen die hetzelfde lijken.
 */
import type { ReactNode } from 'react'

const teken = (kinderen: ReactNode) => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kinderen}
  </svg>
)

/** De doelring: bijna rond, met de opening waar het vandaag nog niet vol is. */
export const TekenVandaag = () => teken(
  <><path d="M20.3 8.6a9 9 0 1 1-4.9-4.9" />
    <circle cx="12" cy="12" r="2.6" /></>,
)

/** De weegtrend. Hij daalt, want dat is waar dit scherm over gaat. */
export const TekenInzicht = () => teken(
  <><path d="M3.2 20.4V4.6" /><path d="M3.2 20.4h17.2" />
    {/* Er stond een bolletje op het beginpunt. Op de balk las dat als een
        losse vlek tegen de as aan, en het zei niets wat de lijn niet al zegt. */}
    <path d="M6.2 8.6 10.6 13l3.2-3 5.2 5.6" /></>,
)

/** Een kom met damp: eten, en niet het zoeken ernaar. */
export const TekenVoeding = () => teken(
  <><path d="M3 11.4h18a9 9 0 0 1-18 0Z" />
    <path d="M9.4 7.8c0-1.4 1.4-1.6 1.4-3" />
    <path d="M13.6 7.8c0-1.4 1.4-1.6 1.4-3" /></>,
)

/**
 * Twee voetstappen, uit elkaar gezet zoals ze in een spoor staan.
 *
 * De eerste versie tekende per voet een bal en een hiel als twee losse bogen.
 * Op de balk — eenentwintig pixels — vielen die uit elkaar en stond er "8 8".
 * Dezelfde les als bij de bāʾ in `public/iconen/LEESMIJ.md`: één gestreken
 * contour houdt zijn vorm, twee losse delen lopen dood.
 */
export const TekenBeweging = () => teken(
  <><path d="M8 3.6c2 0 3.2 1.9 3.2 4.2 0 2.3-1.1 3.3-1.1 5.1 0 1.2-.9 2-2.1 2s-2.1-.8-2.1-2c0-1.8-1.1-2.8-1.1-5.1C4.8 5.5 6 3.6 8 3.6Z" />
    <path d="M16 9c2 0 3.2 1.9 3.2 4.2 0 2.3-1.1 3.3-1.1 5.1 0 1.2-.9 2-2.1 2s-2.1-.8-2.1-2c0-1.8-1.1-2.8-1.1-5.1C12.8 10.9 14 9 16 9Z" /></>,
)

/** Een hart. De bloeddruk, de saturatie en de rustpols wonen daar. */
export const TekenGezondheid = () => teken(
  <path d="M12 20.4C12 20.4 3.8 15.6 3.8 10.2a4.6 4.6 0 0 1 8.2-2.9 4.6 4.6 0 0 1 8.2 2.9c0 5.4-8.2 10.2-8.2 10.2Z" />,
)

/** Een persoon. Hier staat wie je bent en wat je instelt. */
export const TekenProfiel = () => teken(
  <><circle cx="12" cy="7.8" r="3.6" />
    <path d="M4.9 20.6a7.3 7.3 0 0 1 14.2 0" /></>,
)

/* ==========================================================================
   DE WEGWIJZERS BIJ DE KOPPEN
   ==========================================================================

   Een tweede soort teken, en het moet als tweede soort te herkennen zijn. Er
   loopt al een tekensysteem door deze app heen dat iets betekent — ◆ gemeten,
   ◈ etiket, ◇ geschat — en dat is niet zomaar een setje symbolen: het is
   hetzelfde teken in drie vullingen, en hoe vol de ruit staat zegt hoeveel er
   werkelijk bekend is. Dat is het beste stuk van de beeldtaal hier en het
   verandert dus niet. Wat moet wijken is alles eromheen.

   Vier verschillen, en ze staan los van elkaar, zodat er niet één hoeft te
   werken maar alle vier tegelijk:

     vorm    wegwijzer is lijn, open, nooit gevuld — herkomst is een gesloten
             glyph met een vulling. Gevuld is herkomst, lijn is wegwijzer.
     maat    zestien pixels tegenover 0,72 rem in de tekst
     plek    links van de kop in een eigen kolom — herkomst staat ín de regel,
             vlak vóór de waarde waar het over gaat
     kleur   --dim, de stilste kleur die er is; herkomst erft de tekstkleur

   En één vorm is verboden: geen ruit, nergens, buiten de herkomst. Daarom staat
   er ook geen ruit meer op de tabbalk.

   WELKE KOPPEN ER ÉÉN KRIJGEN

   Alleen een kop die zegt wát voor soort ding er onder staat. Een kop die een
   oordeel draagt — "Te snel", "Waar je nu staat", "Wat er nog in past" — krijgt
   er geen, want dat is een zin en geen etiket, en een tekentje ervoor maakt er
   een etiket van. Deze app zet het oordeel vooraan; dat mag geen rubriek worden.

   Een uitlegkaart krijgt er ook geen. Dat zijn de voetnoten, en een tekentje
   zou ze promoveren tot iets waar je langs moet.
*/

const wegwijzer = (kinderen: ReactNode) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kinderen}
  </svg>
)

/** Een weegschaal: het vlak met de wijzer erop. */
export const WegWeging = () => wegwijzer(
  <><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" />
    <path d="M8.4 15.4a4.6 4.6 0 0 1 7.2-5.6" /><path d="M12 15.4l3.6-5.6" /></>,
)

/** Een klok: de dag valt in momenten uiteen. */
export const WegMomenten = () => wegwijzer(
  <><circle cx="12" cy="12" r="8.6" /><path d="M12 6.8V12l3.6 2.2" /></>,
)

/** Een hartslaglijn: de metingen van het lichaam. */
export const WegMeting = () => wegwijzer(
  <path d="M2.6 12.4h4.2l2-4.6 3 10 2.4-6.2 1.6 2.8h5.6" />,
)

/** Een reageerbuis met een vloeistofrand. */
export const WegLab = () => wegwijzer(
  /* Breder dan de eerste versie. Een buisje van zes pixels breed las als een
     batterij; de verhouding telt, niet de aanwezigheid. */
  <><path d="M8 3v12.4a4 4 0 0 0 8 0V3" /><path d="M6 3h12" />
    <path d="M8 11.4h8" /></>,
)

/** Een fiets. */
export const WegFiets = () => wegwijzer(
  <><circle cx="5.8" cy="16.6" r="3.8" /><circle cx="18.2" cy="16.6" r="3.8" />
    <path d="M5.8 16.6 10 8.4h3.4l2.6 8.2" /><path d="M8.6 8.4h3.8" /></>,
)

/** Een halter. */
export const WegKracht = () => wegwijzer(
  /* Eerst vier losse streepjes met een stang ertussen. Op zestien pixels bleven
     daar twee haartjes van over en las het als een liggend streepje. Twee
     schijven met een gewicht eraan houden hun vorm. */
  <><rect x="4" y="7.6" width="3.6" height="8.8" rx="1.4" />
    <rect x="16.4" y="7.6" width="3.6" height="8.8" rx="1.4" />
    <path d="M7.6 12h8.8" /></>,
)

/** Een kalender: een blok weken terug. */
export const WegWeken = () => wegwijzer(
  <><rect x="3.4" y="5.2" width="17.2" height="15.4" rx="3" />
    <path d="M3.4 10.2h17.2" /><path d="M8.2 3.4v3.6" /><path d="M15.8 3.4v3.6" /></>,
)

/** Schuifregelaars: hier stel je iets in. */
export const WegInstellen = () => wegwijzer(
  <><path d="M3.4 8.4h17.2" /><path d="M3.4 15.6h17.2" />
    <circle cx="9" cy="8.4" r="2.4" /><circle cx="15.6" cy="15.6" r="2.4" /></>,
)

/** Een maansikkel: de nachtstand, en daarmee de keuze tussen dag en nacht. */
export const WegThema = () => wegwijzer(
  <path d="M19.4 15.2A8.2 8.2 0 0 1 8.8 4.6a8.2 8.2 0 1 0 10.6 10.6Z" />,
)

/** Een vlag: waar je naartoe gaat. */
export const WegTraject = () => wegwijzer(
  <><path d="M5.6 21V3.4" /><path d="M5.6 4.6h12.8l-2.6 4.2 2.6 4.2H5.6" /></>,
)

/** Staafjes: wat je per dag gelogd hebt. */
export const WegPerDag = () => wegwijzer(
  <><path d="M4.4 20.4V13" /><path d="M9.4 20.4V6.6" />
    <path d="M14.6 20.4v-9.8" /><path d="M19.6 20.4V9" /></>,
)
