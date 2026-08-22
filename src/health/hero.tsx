/**
 * DE HERO — het eerste wat je ziet
 *
 * Elke calorie-app tekent een ring. Die ring liegt: hij zet een streep op
 * 2.100 kcal alsof dat een gemeten grens is, terwijl het een schatting is met
 * een marge van honderden calorieën. Deze app rekent al met een interval, en
 * dan hoort de ring dat ook te laten zien.
 *
 * Dus: de ring heeft een bándzone. De lichte boog is het gebied waarbinnen het
 * doel ligt; de volle boog is wat er gelogd is. Zit je in de band, dan zit je
 * goed — er is geen streep om net overheen te gaan. Dat is de hele stelling van
 * de app, maar dan als plaatje in plaats van als voetnoot.
 *
 * Voordat er zeven wegingen zijn, is er geen doel en dus geen band. De ring
 * toont dan iets anders: hoeveel wegingen er nog nodig zijn. Dat is de enige
 * eerlijke aanmoediging die de app kan geven, en het is oneindig veel beter dan
 * een 0 met "nog geen doel" eronder.
 */
import type { ReactNode } from 'react'

/* De ring staat rechtop en laat onderaan een opening: een volle cirkel leest
   als "af", een opening leest als "loopt nog". */
const OPENING = 62            // graden die onderaan open blijven
const START = 90 + OPENING / 2
const SPAN = 360 - OPENING

const rad = (g: number): number => (g * Math.PI) / 180

function punt(cx: number, cy: number, r: number, graad: number): [number, number] {
  return [cx + r * Math.cos(rad(graad)), cy + r * Math.sin(rad(graad))]
}

/** Een boog van `van` tot `tot`, beide als deel van 0..1 over de ringspan. */
function boog(cx: number, cy: number, r: number, van: number, tot: number): string {
  const a0 = START + Math.max(0, Math.min(1, van)) * SPAN
  const a1 = START + Math.max(0, Math.min(1, tot)) * SPAN
  const [x0, y0] = punt(cx, cy, r, a0)
  const [x1, y1] = punt(cx, cy, r, a1)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export interface RingEigenschappen {
  /** Wat er gelogd is: het puntgetal. */
  waarde: number
  /** De onder- en bovenkant van wat er gelogd is. Dít is de onzekerheid die de
   *  band toont — niet die van het doel. Wat je at is geschat; het doel is een
   *  streep die de app zelf trekt. */
  laag?: number | null
  hoog?: number | null
  /** De streep waar je naartoe werkt; niets als het model nog niets durft. */
  doel: number | null
  kind: ReactNode
  maat?: number
}

export function Doelring(
  { waarde, laag, hoog, doel, kind, maat = 132 }: RingEigenschappen,
): ReactNode {
  const c = maat / 2
  const dik = maat * 0.095
  const r = c - dik * 1.15

  /* De ring loopt tot iets voorbij het doel, zodat een overschrijding zichtbaar
     is zonder dat de ring meteen vol staat. Staat er nog geen doel, dan bepaalt
     de waarde zelf de schaal. */
  const top = Math.max(doel ?? 0, hoog ?? waarde, waarde, 1)
  const schaal = top * 1.06

  const deel = Math.min(1, waarde / schaal)
  const bandVan = laag != null ? Math.min(1, laag / schaal) : null
  const bandTot = hoog != null ? Math.min(1, hoog / schaal) : null
  const doelDeel = doel != null ? Math.min(1, doel / schaal) : null

  /* Kleur naar staat. Ernaast staat altijd hetzelfde in cijfers en in woorden:
     kleur alleen is voor niemand genoeg. */
  const over = doel != null && waarde > doel
  const bijna = doel != null && waarde >= doel * 0.85
  const kleur = over ? 'var(--let)' : bijna ? 'var(--heldergoed)' : 'var(--k)'

  return (
    <svg width={maat} height={maat} viewBox={`0 0 ${maat} ${maat}`} role="img"
         aria-label={doel != null
           ? `${Math.round(waarde)} van ${Math.round(doel)}`
           : `${Math.round(waarde)}`}>
      <path d={boog(c, c, r, 0, 1)} fill="none" stroke="var(--ringrail)"
            strokeWidth={dik} strokeLinecap="round" />

      {/* De band om wat er gelogd is: breder dan de rail en halfdoorzichtig,
          zodat hij als zone leest en niet als tweede streep. */}
      {bandVan != null && bandTot != null && bandTot > bandVan && (
        <path d={boog(c, c, r, bandVan, bandTot)} fill="none" stroke={kleur}
              strokeWidth={dik * 1.7} strokeLinecap="butt" opacity={0.22} />
      )}

      {deel > 0.002 && (
        <path d={boog(c, c, r, 0, deel)} fill="none" stroke={kleur}
              strokeWidth={dik} strokeLinecap="round" pathLength={100}
              strokeDasharray="100" strokeDashoffset="0">
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur=".8s"
                   calcMode="spline" keySplines="0.2 0.8 0.2 1" fill="freeze" />
        </path>
      )}

      {/* Het doel: een streepje dwars op de ring. */}
      {doelDeel != null && (() => {
        const a = START + doelDeel * SPAN
        const [x0, y0] = punt(c, c, r - dik * 0.85, a)
        const [x1, y1] = punt(c, c, r + dik * 0.85, a)
        return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--ink)" strokeWidth="2"
                     opacity={0.35} strokeLinecap="round" />
      })()}

      <foreignObject x={dik} y={dik} width={maat - 2 * dik} height={maat - 2 * dik}>
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.12,
        }}>{kind}</div>
      </foreignObject>
    </svg>
  )
}

/**
 * Veertien dagen naast elkaar. Eén dag zegt niets; een strook laat zien of er
 * een gewoonte in zit. De hoogte is het aandeel van het doel, de kleur zegt wat
 * er die dag gebeurd is — gewogen, gelogd, of allebei.
 */
export interface Dagstaaf { d: string; gewogen: boolean; gelogd: boolean; deel: number }

export function Dagenstrook({ dagen, nu }: { dagen: Dagstaaf[]; nu: string }): ReactNode {
  return (
    <div className="strook" role="img"
         aria-label={`De laatste ${dagen.length} dagen: `
           + `${dagen.filter((x) => x.gewogen).length} keer gewogen, `
           + `${dagen.filter((x) => x.gelogd).length} keer gelogd.`}>
      {dagen.map((x) => (
        <i key={x.d}
           className={[
             x.gewogen && x.gelogd ? 'beide' : x.gelogd ? 'gelogd' : x.gewogen ? 'gewogen' : '',
             x.d === nu ? 'nu' : '',
           ].filter(Boolean).join(' ')}
           title={x.d}
           style={{ height: `${Math.max(12, Math.min(100, x.deel * 100))}%` }} />
      ))}
    </div>
  )
}
