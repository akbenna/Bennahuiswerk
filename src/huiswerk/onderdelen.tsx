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

/**
 * Een kaart die dichtgeklapt begint. Voor alles wat leuk is om te zien maar
 * niet nodig om te beginnen: de stand, de rangen, het verdiende geld.
 *
 * Dit is een `<details>` en geen knop met een `useState`. Dat is met opzet: een
 * browser klapt hem dan zelf open en dicht, hij is met het toetsenbord te
 * bedienen, een schermlezer noemt hem uitklapbaar, en zoeken in de pagina
 * (⌘F) vindt de tekst erin ook als hij dicht staat. Er komt geen enkele regel
 * JavaScript aan te pas.
 */
export const Klapkaart = ({ titel, zij, open, children }:
{ titel: ReactNode; zij?: ReactNode; open?: boolean; children: ReactNode }): ReactNode => (
  <details className="klapkaart" open={open}>
    <summary>
      <b>{titel}</b>
      {zij != null && <span className="muted zij">{zij}</span>}
    </summary>
    <div className="klapbak">{children}</div>
  </details>
)
