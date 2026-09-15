/**
 * DE TEKENINGEN BIJ EEN LEEG SCHERM
 *
 * Een leeg scherm is het enige moment waarop een tekening de ruimte krijgt
 * zonder met een getal te concurreren. Daarom staan deze drie groot en alleen,
 * en daarom mogen ze illustratiever zijn dan de tekentjes op de balk.
 *
 * Ze zijn getekend naar een opdracht die één ding hard vastlegde: `currentColor`
 * en geen enkele vaste kleur. Wat je hieronder ziet is dan ook geen plaatje maar
 * vorm — de kleur komt van buiten, en dus kloppen ze in dag en nacht en bij elk
 * palet dat er later nog komt. Diepte zit in `fill-opacity`, niet in een tweede
 * kleur.
 *
 * WAAROM ZE HIER STAAN EN NIET IN `public/`
 *
 * Als bestand in `public/` zouden ze via `<img>` binnenkomen, en dan is
 * `currentColor` weg — een `<img>` weet niets van de kleur van zijn omgeving.
 * Inline in de pagina werkt het wel, en het scheelt drie verzoeken. Dezelfde
 * afweging als bij `tekens.tsx`.
 *
 * WAT EEN LEEG SCHERM WEL EN NIET MAG ZEGGEN
 *
 * De tekening staat er om de leegte draaglijk te maken, niet om hem te
 * verbergen. De tekst eronder blijft dus zeggen wat er aan de hand is en wat je
 * kunt doen; dat is wat mensen lezen. Wie de tekening weghaalt houdt een scherm
 * over dat nog steeds klopt.
 */

const doek = (kinderen: React.ReactNode) => (
  <svg viewBox="0 0 240 200" width="190" height="158" className="leegbeeld"
       aria-hidden="true" focusable="false">{kinderen}</svg>
)

/** Een berg met een vlag: er is nog geen doel om naartoe te werken. */
export const LeegGeenDoel = () => doek(
  <>
    <path d="M28 164 86 96l35 42 39-61 52 87Z" fill="currentColor" fillOpacity="0.13" />
    <path d="M28 164 86 96l35 42 39-61 52 87" fill="none" stroke="currentColor" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.72" />
    <path d="M160 77V43M160 43l20 8-20 8" fill="none" stroke="currentColor" strokeWidth="6"
          strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="86" cy="96" r="8" fill="currentColor" fillOpacity="0.55" />
    <circle cx="121" cy="138" r="8" fill="currentColor" fillOpacity="0.55" />
  </>,
)

/** Een klembord met vinkjes: er is nog te weinig ingevuld om iets te tonen. */
export const LeegGeenGegevens = () => doek(
  <>
    <rect x="62" y="38" width="116" height="126" rx="14" fill="currentColor" fillOpacity="0.12" />
    <rect x="78" y="54" width="84" height="94" fill="currentColor" fillOpacity="0.08" />
    <rect x="91" y="27" width="58" height="27" rx="8" fill="currentColor" fillOpacity="0.72" />
    <path d="M91 83h58M91 108h58M91 133h39" fill="none" stroke="currentColor" strokeWidth="5"
          strokeLinecap="round" strokeOpacity="0.65" />
    <path d="m82 83 5 5 9-10M82 108l5 5 9-10M82 133l5 5 9-10" fill="none" stroke="currentColor"
          strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </>,
)

/** Een lege kom met damp: er is vandaag nog niets gelogd. */
export const LeegGeenMaaltijden = () => doek(
  <>
    <path d="M43 89h154l-12 55a17 17 0 0 1-16.6 13H71.6A17 17 0 0 1 55 144L43 89Z"
          fill="currentColor" fillOpacity="0.14" />
    <path d="M37 89h166" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <path d="M64 70c-5-11 6-14 1-26M119 70c-5-11 6-14 1-26M174 70c-5-11 6-14 1-26" fill="none"
          stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.72" />
    <circle cx="72" cy="119" r="7" fill="currentColor" fillOpacity="0.35" />
    <circle cx="120" cy="119" r="7" fill="currentColor" fillOpacity="0.5" />
    <circle cx="168" cy="119" r="7" fill="currentColor" fillOpacity="0.35" />
  </>,
)
