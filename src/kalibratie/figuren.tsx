/**
 * DE FIGUREN
 *
 * Drie SVG's, met de hand getekend en zonder grafiekbibliotheek. Dat is geen
 * zuinigheid: elke bibliotheek die dit zou kunnen weegt meer dan de hele app en
 * geen enkele tekent standaard wat hier nodig is — een interval naast een
 * formuleschatting, een weeglijn met de losse metingen eronder, en staven die
 * van kleur wisselen op een drempel die iets betekent.
 *
 * Overgezet uit intervalSVG(), gewichtSVG() en innameSVG() in de oude
 * index.html; de coördinaten zijn ongewijzigd.
 */
import { dec, dz } from '@/gedeeld/getal'
import { kortNL } from '@/gedeeld/datum'
import type { Analyse, Trendpunt } from './rekenkern'
import { VENSTER } from './rekenkern'

/** Het gemeten interval, met de formuleschatting er grijs achter. */
export function IntervalFiguur({ a }: { a: Analyse }) {
  if (a.laag == null || a.hoog == null || a.tdee == null) return null
  const min = Math.min(a.laag, a.doel ?? a.laag, a.priorLaag) - 200
  const max = Math.max(a.hoog, a.priorHoog) + 200
  const p = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <>
      <svg
        className="fig" viewBox="0 0 100 18" preserveAspectRatio="none"
        style={{ height: 48, marginTop: 10 }} role="img"
        aria-label={`Interval ${Math.round(a.laag)} tot ${Math.round(a.hoog)} kcal, doel ${a.doel ?? '—'}`}
      >
        <rect x={p(a.priorLaag)} y={7.5} width={p(a.priorHoog) - p(a.priorLaag)} height={3}
              fill="var(--dim)" opacity={0.28} />
        <line x1={0} y1={9} x2={100} y2={9} stroke="var(--lijn)" strokeWidth={0.35} />
        <rect x={p(a.laag)} y={4} width={p(a.hoog) - p(a.laag)} height={10} fill="var(--k)" opacity={0.2} />
        <line x1={p(a.laag)} y1={4} x2={p(a.laag)} y2={14} stroke="var(--k)" strokeWidth={0.4} />
        <line x1={p(a.hoog)} y1={4} x2={p(a.hoog)} y2={14} stroke="var(--k)" strokeWidth={0.4} />
        <line x1={p(a.tdee)} y1={2} x2={p(a.tdee)} y2={16} stroke="var(--ink)" strokeWidth={0.7} />
        {a.doel != null && (
          <line x1={p(a.doel)} y1={2} x2={p(a.doel)} y2={16} stroke="var(--let)" strokeWidth={0.7} />
        )}
      </svg>
      <div className="tussen mini cijfer">
        <span>{dz(Math.round(min))}</span>
        <span style={{ fontFamily: 'var(--sans)' }}>
          grijs = formuleschatting · zwart = meting · oranje = doel
        </span>
        <span>{dz(Math.round(max))}</span>
      </div>
    </>
  )
}

/** Losse wegingen als punten, het voortschrijdend gemiddelde als lijn. */
export function GewichtFiguur(
  { reeks, doelGewicht }: { reeks: readonly Trendpunt[]; doelGewicht: number | null },
) {
  const punten = reeks.filter((x) => x.w != null)
  if (punten.length < 1) {
    return (
      <p className="klein" style={{ marginTop: 8 }}>
        Nog geen weging. Zodra er drie staan, verschijnt hier een lijn.
      </p>
    )
  }
  const teWeinig = punten.length < 3
  const W = 330, H = 140, L = 32, B = 18
  const waarden = [...reeks.map((x) => x.w), ...reeks.map((x) => x.ema)]
    .filter((v): v is number => v != null)
  const lo = Math.min(...waarden) - 0.8
  const hi = Math.max(...waarden) + 0.8
  /* Bij een smalle as zegt afronden op hele kilo's niets: drie lijnen kregen
     dan twee keer hetzelfde getal. */
  const decim = hi - lo < 3 ? 1 : 0
  const doelInBeeld = doelGewicht != null && doelGewicht > lo && doelGewicht < hi
  const X = (i: number) => (reeks.length < 2 ? (L + W) / 2 : L + (i / (reeks.length - 1)) * (W - L - 4))
  const Y = (v: number) => H - B - ((v - lo) / (hi - lo || 1)) * (H - B - 10)
  const pad = reeks.map((x, i) => (x.ema != null ? `${X(i)},${Y(x.ema)}` : null))
    .filter(Boolean).join(' ')
  const eerste = reeks[0], laatste = reeks[reeks.length - 1]

  return (
    <>
      <svg className="fig" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }} role="img"
           aria-label="Gewicht per dag">
        {[0, 0.5, 1].map((f) => {
          const v = lo + (hi - lo) * f
          return (
            <g key={f}>
              <line x1={L} y1={Y(v)} x2={W} y2={Y(v)} stroke="var(--lijn)" strokeWidth={1} />
              <text x={0} y={Y(v) + 3.5} fontSize={9.5} fill="var(--grijs)"
                    fontFamily="ui-monospace,monospace">
                {v.toFixed(decim).replace('.', ',')}
              </text>
            </g>
          )
        })}
        {doelInBeeld && doelGewicht != null ? (
          <>
            <line x1={L} y1={Y(doelGewicht)} x2={W} y2={Y(doelGewicht)} stroke="var(--let)"
                  strokeWidth={1} strokeDasharray="3 3" />
            <text x={W} y={Y(doelGewicht) - 4} fontSize={9.5} fill="var(--let)" textAnchor="end">
              doel {doelGewicht}
            </text>
          </>
        ) : doelGewicht != null ? (
          <text x={W} y={10} fontSize={9} fill="var(--grijs)" textAnchor="end">
            doel {doelGewicht} kg ligt onder deze uitsnede
          </text>
        ) : null}
        {reeks.map((x, i) =>
          x.w != null ? <circle key={x.d} cx={X(i)} cy={Y(x.w)} r={2} fill="var(--dim)" /> : null)}
        {pad && (
          <polyline points={pad} fill="none" stroke="var(--k)" strokeWidth={2.2} strokeLinejoin="round" />
        )}
        {eerste && (
          <text x={L} y={H - 4} fontSize={9.5} fill="var(--grijs)">{kortNL(eerste.d)} —</text>
        )}
        {laatste && (
          <text x={L + 34} y={H - 4} fontSize={9.5} fill="var(--grijs)">{kortNL(laatste.d)}</text>
        )}
      </svg>
      {teWeinig && (
        <p className="mini" style={{ marginTop: 6 }}>
          {punten.length === 1 ? 'Eén weging' : `${punten.length} wegingen`} — nog {3 - punten.length}{' '}
          voordat er een lijn te trekken valt, en zeven voordat de helling meer is dan ruis.
        </p>
      )}
    </>
  )
}

/** Gelogde energie per dag; oranje onder 1.200 kcal. */
export function InnameFiguur({ reeks, doel }: { reeks: readonly Trendpunt[]; doel: number | null }) {
  const s = reeks.slice(-VENSTER)
  if (!s.length) return null
  const W = 330, H = 118, L = 32, B = 15
  const top = Math.max(2600, ...s.map((x) => x.kcal ?? 0)) * 1.06
  const Y = (v: number) => H - B - (v / top) * (H - B - 8)
  const bw = Math.max(2.5, (W - L - 4) / s.length - 2)
  const eerste = s[0], laatste = s[s.length - 1]

  return (
    <svg className="fig" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }} role="img"
         aria-label="Gelogde energie per dag">
      {[0, 1300, 2600].map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={W} y2={Y(v)} stroke="var(--lijn)" strokeWidth={1} />
          <text x={0} y={Y(v) + 3.5} fontSize={9.5} fill="var(--grijs)"
                fontFamily="ui-monospace,monospace">{v}</text>
        </g>
      ))}
      {s.map((x, i) =>
        x.kcal ? (
          <rect key={x.d} x={L + (i / s.length) * (W - L - 4)} y={Y(x.kcal)} width={bw}
                height={H - B - Y(x.kcal)} rx={1.5}
                fill={x.kcal < 1200 ? 'var(--let)' : 'var(--k)'} opacity={0.85} />
        ) : null)}
      <line x1={L} y1={Y(1200)} x2={W} y2={Y(1200)} stroke="var(--let)" strokeWidth={1}
            strokeDasharray="2 3" />
      {doel != null && (
        <>
          <line x1={L} y1={Y(doel)} x2={W} y2={Y(doel)} stroke="var(--k)" strokeWidth={1.2}
                strokeDasharray="4 3" />
          <text x={W} y={Y(doel) - 3} fontSize={9.5} fill="var(--k)" textAnchor="end">
            doel {dz(doel)}
          </text>
        </>
      )}
      {eerste && <text x={L} y={H - 3} fontSize={9.5} fill="var(--grijs)">{kortNL(eerste.d)}</text>}
      {laatste && (
        <text x={W} y={H - 3} fontSize={9.5} fill="var(--grijs)" textAnchor="end">
          {kortNL(laatste.d)}
        </text>
      )}
    </svg>
  )
}

/** Eén regel met een label en een getal, zoals in de drie- en tweekolomsblokken. */
export function Cijfer(
  { label, waarde, onder }: { label: string; waarde: string; onder?: string },
) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="getal" style={{ fontSize: '1.35rem', marginTop: 4 }}>{waarde}</div>
      {onder && <div className="mini">{onder}</div>}
    </div>
  )
}

export { dec, dz }
