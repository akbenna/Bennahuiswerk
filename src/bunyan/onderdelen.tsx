/**
 * KLEINE ONDERDELEN
 *
 * De uitleg in de lessen draagt opmaak: <code> om een stukje Python, <b> om een
 * begrip. Die komt via dangerouslySetInnerHTML op het scherm, en dat mag omdat
 * de herkomst vaststaat — die teksten staan in de repo en gaan langs een
 * review. Alles wat het kind zélf typt gaat als gewone tekst door React heen.
 */
import type { ReactNode } from 'react'

/** Opmaak uit de leerstof. Zie de kop van dit bestand. */
export function Rijk(
  { html, als = 'div', className }: { html: string; als?: 'div' | 'span' | 'p'; className?: string },
): ReactNode {
  const E = als
  return <E className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Voortgangsbalk, 0–100. */
export const Balk = ({ p }: { p: number }): ReactNode => (
  <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, p))}%` }} /></div>
)

export type Kadersoort = 'goed' | 'fout' | 'let' | undefined

export const Kader = (
  { soort, kop, children }: { soort?: Kadersoort; kop: string; children?: ReactNode },
): ReactNode => (
  <div className={soort ? `kader ${soort}` : 'kader'} style={{ marginTop: 12 }}>
    <h4>{kop}</h4>
    {children != null && <p className="klein" style={{ marginTop: 4 }}>{children}</p>}
  </div>
)

export const Melding = (
  { tekst, soort }: { tekst: string; soort?: 'goed' | 'fout' | undefined },
): ReactNode => (tekst ? <p className={soort ? `melding ${soort}` : 'melding'}>{tekst}</p> : null)

export const Tag = (
  { soort, children }: { soort?: string | undefined; children: ReactNode },
): ReactNode => (
  <span className={soort ? `tag ${soort}` : 'tag'}>{children}</span>
)

/** Een getal met een label eronder — het blokje dat overal terugkomt. */
export function Cijfer(
  { kop, waarde, onder, kleur }:
  { kop: string; waarde: ReactNode; onder?: ReactNode; kleur?: string },
): ReactNode {
  return (
    <div className="card">
      <p className="meta">{kop}</p>
      <p className="cijfer" style={kleur ? { color: kleur } : undefined}>{waarde}</p>
      {onder != null && <p className="klein">{onder}</p>}
    </div>
  )
}
