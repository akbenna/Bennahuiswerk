/**
 * KLEINE ONDERDELEN
 *
 * De stukken die op vier of vijf schermen terugkomen. Geen enkele hiervan zet
 * HTML uit gegevens rechtstreeks in de pagina: alle opgavetekst gaat als gewone
 * tekst door React heen. Dat is niet alleen veiliger maar ook eerlijker — de
 * ouder mag zelf opgaven toevoegen, en die zijn geen code.
 */
import type { CSSProperties, ReactNode } from 'react'

export const Balk = ({ pct, kleur, achter }:
{ pct: number; kleur?: string; achter?: string }): ReactNode => (
  <div className="miniprog" style={achter ? { background: achter } : undefined}>
    <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, ...(kleur ? { background: kleur } : {}) }} />
  </div>
)

export const Kop = ({ terug, pil, extra }:
{ terug: () => void; pil?: ReactNode; extra?: ReactNode }): ReactNode => (
  <div className="topbar">
    <button type="button" className="back" onClick={terug}>← terug</button>
    {pil && <span className="pill">{pil}</span>}
    {extra}
  </div>
)

export const Rij = ({ children, style }:
{ children: ReactNode; style?: CSSProperties }): ReactNode => (
  <div className="row" style={style}>{children}</div>
)

/** Tekst met regeleindes, zoals een uitwerking. `white-space: pre-wrap` houdt
 *  ze heel zonder dat er HTML aan te pas komt. */
export const Regels = ({ tekst, className, style }:
{ tekst: string; className?: string; style?: CSSProperties }): ReactNode => (
  <div className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>{tekst}</div>
)
