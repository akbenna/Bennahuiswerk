/**
 * DE VIJF SPELLEN OP TIJD
 *
 * Elk is niet meer dan een opgave, een weergave en een controle. Wat ze delen —
 * de klok, de score, het record, de volgende opgave — staat in TijdSpel.
 */
import { Antwoordveld, Keuzeknoppen, TijdSpel } from './TijdSpel'
import type { SpelEigenschappen } from './kader'
import { hussel, pak, ri } from '../toeval'

/* ------------------------------------------------------------- Reken-race -- */
export function RekenRace(p: SpelEigenschappen) {
  return (
    <TijdSpel {...p} duur={30}
      maak={() => { const a = ri(2, 12), b = ri(2, 12); return { a, b, ans: a * b } }}
      juist={(o, k) => Number(k) === o.ans}
      toon={(o, kies) => (
        <div className="card midden">
          <div className="groot">{o.a} × {o.b}</div>
          <Antwoordveld opKies={kies} juist={(v) => Number(v) === o.ans} />
        </div>
      )} />
  )
}

/* ------------------------------------------------------------ Som-sprint -- */
export function SomSprint(p: SpelEigenschappen) {
  return (
    <TijdSpel {...p} duur={30}
      maak={() => {
        const plus = Math.random() < 0.5
        let a = ri(2, 20), b = ri(2, 20)
        if (!plus && b > a) { const t = a; a = b; b = t }
        return { a, b, plus, ans: plus ? a + b : a - b }
      }}
      juist={(o, k) => String(k).trim() !== '' && Number(k) === o.ans}
      toon={(o, kies) => (
        <div className="card midden">
          <div className="groot">{o.a} {o.plus ? '+' : '−'} {o.b}</div>
          <Antwoordveld opKies={kies}
                        juist={(v) => String(v).trim() !== '' && Number(v) === o.ans} />
        </div>
      )} />
  )
}

/* ----------------------------------------------------------- Groter getal -- */
export function GroterGetal(p: SpelEigenschappen) {
  return (
    <TijdSpel {...p} duur={30}
      maak={() => { let a = ri(1, 999); const b = ri(1, 999); if (a === b) a++; return { a, b } }}
      juist={(o, k) => k === (o.a > o.b ? 'a' : 'b')}
      toon={(o, kies) => (
        <div className="card midden">
          <p className="klein">Welke is groter?</p>
          <Keuzeknoppen groot opKies={kies}
                        keuzes={[['a', String(o.a)], ['b', String(o.b)]]} />
        </div>
      )} />
  )
}

/* -------------------------------------------------------- Even of oneven -- */
export function EvenOfOneven(p: SpelEigenschappen) {
  return (
    <TijdSpel {...p} duur={30}
      maak={() => ({ n: ri(1, 99) })}
      juist={(o, k) => k === (o.n % 2 === 0 ? 'even' : 'oneven')}
      toon={(o, kies) => (
        <div className="card midden">
          <div className="groot">{o.n}</div>
          <Keuzeknoppen opKies={kies} keuzes={[['even', 'Even'], ['oneven', 'Oneven']]} />
        </div>
      )} />
  )
}

/* -------------------------------------------------------------- Klok-race -- */
const zeg = (u: number, m: number): string => `${(u % 12) || 12}:${String(m).padStart(2, '0')}`

/** Een klok met wijzers die echt kloppen, ook de uurwijzer die met de minuten
 *  meeschuift — anders leert een kind hem verkeerd lezen. */
export function Klok({ u, m }: { u: number; m: number }) {
  const hoekM = m * 6 - 90
  const hoekU = ((u % 12) + m / 60) * 30 - 90
  const p = (hoek: number, lengte: number): [number, number] =>
    [70 + Math.cos((hoek * Math.PI) / 180) * lengte, 70 + Math.sin((hoek * Math.PI) / 180) * lengte]
  const [mx, my] = p(hoekM, 46)
  const [ux, uy] = p(hoekU, 32)

  return (
    <svg className="klok" width={140} height={140} viewBox="0 0 140 140" role="img" aria-label="klok">
      <circle cx={70} cy={70} r={64} fill="var(--surface)" stroke="var(--line-2)" strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => {
        const h = i * 30 - 90
        const [x1, y1] = p(h, 56)
        const [x2, y2] = p(h, 62)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                     stroke="var(--line-2)" strokeWidth={2} />
      })}
      <line x1={70} y1={70} x2={ux} y2={uy} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
      <line x1={70} y1={70} x2={mx} y2={my} stroke="var(--k)" strokeWidth={3} strokeLinecap="round" />
      <circle cx={70} cy={70} r={4} fill="var(--ink)" />
    </svg>
  )
}

export function KlokRace(p: SpelEigenschappen) {
  return (
    <TijdSpel {...p} duur={40}
      maak={() => {
        const u = ri(1, 12)
        const m = pak([0, 15, 30, 45]) ?? 0
        const goed = zeg(u, m)
        const set = new Set([goed])
        while (set.size < 3) set.add(zeg(ri(1, 12), pak([0, 15, 30, 45]) ?? 0))
        return { u, m, goed, keus: hussel([...set]) }
      }}
      juist={(o, k) => k === o.goed}
      toon={(o, kies) => (
        <div className="card midden">
          <Klok u={o.u} m={o.m} />
          <Keuzeknoppen opKies={kies} keuzes={o.keus.map((k) => [k, k] as const)} />
        </div>
      )} />
  )
}
