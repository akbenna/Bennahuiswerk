/**
 * DE ACHTERGRONDEN — getekend, en bijna onzichtbaar
 *
 * De geleverde set had er vier: bladeren, heuvels, zonsopgang, golven. Ze zijn
 * niet overgenomen als bestand, en de reden was op het scherm te zien. Een
 * lichte bladerenfoto op 55 procent achter de hero maakte in het donkere thema
 * de zin over de bandbreedte onleesbaar — en dat is nu net de zin die uitlegt
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
 * hun omgeving over en staan op een dekking die je niet los ziet — je merkt ze
 * pas als je ze weghaalt. Dat is de bedoeling: een achtergrond die je opvalt
 * concurreert met het getal ervoor.
 *
 * DE DEKKING IS EEN GRENS EN GEEN SMAAK
 *
 * `--sfeer` staat op 0,05 in het licht en 0,07 in het donker. Daarboven begint
 * de kleine tekst eronder contrast te verliezen, en de contrastproef in
 * `gereedschap/health-voorbeeld.mjs` meet dat op elk stukje tekst. Wie deze
 * waarde omhoog zet, hoort die proef te draaien en niet alleen te kijken.
 *
 * WAAROM GEEN CSS-VERLOOP
 *
 * Dat kan en het is goedkoper. Maar een verloop is een kleurvlak en geen motief:
 * het voegt niets toe aan wat de kaart al zegt. Deze vormen verwijzen ergens
 * naar — een blad bij voeding, een golf bij een reeks metingen, een heuvel bij
 * een trend — en dat is het enige argument om een achtergrond te hebben.
 */
import type { ReactNode } from 'react'

export type Sfeer = 'blad' | 'golf' | 'heuvel'

const doek = (kinderen: ReactNode) => (
  <svg className="sfeer" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"
       fill="currentColor" aria-hidden="true" focusable="false">
    {kinderen}
  </svg>
)

const VORMEN: Record<Sfeer, () => ReactNode> = {
  /* Twee bladeren die elkaar overlappen, uit de rechterbovenhoek weg. Ze lopen
     met opzet het vlak uit: een motief dat helemaal in beeld staat leest als een
     plaatje, een motief dat wordt afgesneden als achtergrond. */
  blad: () => doek(
    <>
      <path d="M402 8c-62 4-108 30-131 68-18 30-14 62 8 78 26-14 48-36 62-66 14-30 40-58 61-62Z" />
      <path d="M330 -6c-48 22-78 56-86 96-6 32 8 58 30 64 14-24 22-54 22-86 0-32 14-58 34-74Z"
            opacity=".6" />
    </>,
  ),
  /* Drie golven onder elkaar: een reeks metingen die doorloopt. */
  golf: () => doek(
    <>
      <path d="M0 132c58-26 96-26 152 0s96 26 152 0 96-26 96 0v72H0Z" opacity=".55" />
      <path d="M0 158c58-22 96-22 152 0s96 22 152 0 96-22 96 0v46H0Z" />
    </>,
  ),
  /* Twee heuvelruggen: een trend die daalt, net als het weegtekentje. */
  heuvel: () => doek(
    <>
      <path d="M0 176 108 86l74 56 70-72 148 106v28H0Z" opacity=".5" />
      <path d="M0 204 132 122l82 46 88-56 98 62v30H0Z" />
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
