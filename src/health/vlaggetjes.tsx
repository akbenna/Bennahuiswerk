/**
 * DE VLAGGETJES, GETEKEND IN PLAATS VAN GELADEN
 *
 * De geleverde beeldset had hier zes PNG's voor. Die zijn niet overgenomen, en
 * de reden is dezelfde als in `tekens.tsx`: een plaatje draagt zijn kleuren
 * ingebakken. In het donkere thema stond er donkere tekst op een lichte pil op
 * een donker vlak, en dat is niet bij te sturen zonder van elk vlaggetje twee
 * bestanden te maken. Deze tekeningen nemen de kleur van hun omgeving over, dus
 * ze kloppen in beide thema's en bij elk toekomstig palet.
 *
 * De vorm volgt de geleverde set (een pil met een tekentje en een woord) want
 * die was goed. Alleen de uitvoering is anders.
 *
 * Welke vlaggen er zijn en waarom er maar drie soorten overbleven, staat in
 * `claims.ts`.
 */
import type { Claim, Claimsoort } from './claims'

const teken = (kinderen: React.ReactNode) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kinderen}</svg>
)

/* Een opgeheven arm voor eiwit, een korenaar voor vezels, en een druppel met
   een streep erdoor voor het lage natrium. Alle drie in één gestreken contour
   waar het kan, losse delen lopen dood op twaalf pixels, de les uit
   `public/iconen/LEESMIJ.md`. */
const TEKENS: Record<Claimsoort, () => React.ReactNode> = {
  eiwit: () => teken(
    <><path d="M3.2 9.4V6.6" /><path d="M12.8 9.4V6.6" />
      <path d="M5.4 10.6V5.4" /><path d="M10.6 10.6V5.4" />
      <path d="M5.4 8h5.2" /></>,
  ),
  vezel: () => teken(
    <><path d="M8 14V5.6" />
      <path d="M8 7.4c0-1.7 1.2-3 2.8-3 0 1.7-1.2 3-2.8 3Z" />
      <path d="M8 7.4c0-1.7-1.2-3-2.8-3 0 1.7 1.2 3 2.8 3Z" />
      <path d="M8 10.8c0-1.7 1.2-3 2.8-3 0 1.7-1.2 3-2.8 3Z" />
      <path d="M8 10.8c0-1.7-1.2-3-2.8-3 0 1.7 1.2 3 2.8 3Z" /></>,
  ),
  zout: () => teken(
    <><path d="M8 2.6S4.2 6.7 4.2 9.2a3.8 3.8 0 0 0 7.6 0C11.8 6.7 8 2.6 8 2.6Z" />
      <path d="M3 13 13 3" /></>,
  ),
}

export function Vlaggetjes({ lijst }: { lijst: Claim[] }) {
  if (!lijst.length) return null
  return (
    <span className="vlaggetjes">
      {lijst.map((c) => {
        const Teken = TEKENS[c.soort]
        return (
          <span key={c.id} className={'vlaggetje ' + c.soort} title={c.grond}>
            <Teken />{c.naam}
          </span>
        )
      })}
    </span>
  )
}
