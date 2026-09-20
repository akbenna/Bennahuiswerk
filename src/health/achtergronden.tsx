/**
 * DE ACHTERGRONDEN: getekend, en bijna onzichtbaar
 *
 * De geleverde set had er vier: bladeren, heuvels, zonsopgang, golven. Ze zijn
 * niet overgenomen als bestand, en de reden was op het scherm te zien. Een
 * lichte bladerenfoto op 55 procent achter de hero maakte in het donkere thema
 * de zin over de bandbreedte onleesbaar, en dat is nu net de zin die uitlegt
 * waarom de ring van deze app anders werkt dan die van elke andere.
 *
 * Een foto kan dat probleem niet oplossen. Hij draagt zijn eigen helderheid mee,
 * en wat op een lichte ondergrond een rustig motief is, is op een donkere een
 * lichtvlek. Twee bestanden maken zou het verdubbelen zonder het op te lossen:
 * dan moet iemand ze allebei bijhouden.
 *
 * WAT HIER STAAT
 *
 * Dezelfde motieven, maar getekend en in `currentColor`. Ze nemen de kleur van
 * hun omgeving over en staan op een dekking die je niet los ziet, je merkt ze
 * pas als je ze weghaalt. Dat is de bedoeling: een achtergrond die je opvalt
 * concurreert met het getal ervoor.
 *
 * DE DEKKING IS EEN GRENS EN GEEN SMAAK
 *
 * `--sfeer` is een vermenigvuldiger en geen absolute waarde: de vormen dragen
 * zelf al een `fill-opacity` per laag, van 0,10 tot 0,22. Het product van die
 * twee is wat je ziet, en dat landt rond de acht procent. Daarboven begint de
 * kleine tekst eronder contrast te verliezen, en de contrastproef in
 * `gereedschap/health-voorbeeld.mjs` meet dat op elk stukje tekst. Wie deze
 * waarde omhoog zet, hoort die proef te draaien en niet alleen te kijken.
 *
 * WAAROM GEEN CSS-VERLOOP
 *
 * Dat kan en het is goedkoper. Maar een verloop is een kleurvlak en geen motief:
 * het voegt niets toe aan wat de kaart al zegt. Deze vormen verwijzen ergens
 * naar (een blad bij voeding, een golf bij een reeks metingen, een heuvel bij
 * een trend) en dat is het enige argument om een achtergrond te hebben.
 */
import type { ReactNode } from 'react'

export type Sfeer = 'blad' | 'golf' | 'heuvel'

const doek = (kinderen: ReactNode) => (
  <svg className="sfeer" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"
       fill="currentColor" aria-hidden="true" focusable="false">
    {kinderen}
  </svg>
)

/* De drie motieven. Ze dragen hun eigen `fill-opacity` per laag (daar zit de
   diepte in) en `--sfeer` schaalt het geheel nog een keer. De vormen lopen het
   vlak links en rechts uit: een motief dat helemaal in beeld staat leest als een
   plaatje, afgesneden leest het als achtergrond. */
const VORMEN: Record<Sfeer, () => ReactNode> = {
  /* Een blad met nerven, uit de rechterbovenhoek weg, bij voeding. */
  blad: () => doek(
    <>
      <path d="M-20 175C55 126 101 51 185 15c26-11 55-18 86-19-20 47-48 88-84 119-52 45-111 67-207 73Z"
            fill="currentColor" fillOpacity="0.18" />
      <path d="M18 194c61-45 109-103 146-176" fill="none" stroke="currentColor" strokeWidth="7"
            strokeLinecap="round" strokeOpacity="0.22" />
      <path d="M77 166c36-8 68-24 96-48M105 126c31-1 58-8 83-22M131 87c25-5 44-12 63-23"
            fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
            strokeOpacity="0.14" />
    </>,
  ),
  /* Golven die doorlopen: bij een reeks metingen. */
  golf: () => doek(
    <>
      <path d="M-20 134C57 78 116 90 178 122c68 35 124 30 242-39v137H-20Z"
            fill="currentColor" fillOpacity="0.16" />
      <path d="M-20 154C60 101 120 112 183 143c71 35 126 27 237-35v92H-20Z"
            fill="currentColor" fillOpacity="0.10" />
      <path d="M-20 130C58 75 116 89 178 120c69 35 126 31 242-38" fill="none" stroke="currentColor"
            strokeWidth="8" strokeLinecap="round" strokeOpacity="0.20" />
    </>,
  ),
  /* Een heuvelrug: bij een trend. */
  heuvel: () => doek(
    <>
      <path d="M-20 194 94 88c17-16 40-16 56 2l41 45 54-69c18-23 47-25 66-3l109 131Z"
            fill="currentColor" fillOpacity="0.12" />
      <path d="M-20 194 94 88c17-16 40-16 56 2l41 45 54-69c18-23 47-25 66-3l109 131Z"
            fill="currentColor" fillOpacity="0.10" />
      <path d="M-20 194 94 88c17-16 40-16 56 2l41 45 54-69c18-23 47-25 66-3" fill="none"
            stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.20" />
    </>,
  ),
}

/**
 * Een sfeervlak dat zichzelf achter zijn broers en zussen legt. De kaart
 * eromheen hoeft alleen `position:relative` te krijgen; dat doet `.metsfeer`.
 */
export function Sfeervlak({ soort }: { soort: Sfeer }) {
  const Vorm = VORMEN[soort]
  return <Vorm />
}
