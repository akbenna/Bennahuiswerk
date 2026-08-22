/**
 * KLEINE ONDERDELEN
 *
 * De uitleg in de lessen draagt opmaak: <b> om een begrip, <span class="ar">
 * om Arabisch. Die gaat via dangerouslySetInnerHTML naar binnen, en dat mag
 * omdat de herkomst vaststaat — die teksten staan in de repo. Alles wat een
 * kind of een ouder zélf intikt gaat als gewone tekst door React heen.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export function Rijk(
  { html, als = 'div', className, style }:
  { html: string; als?: 'div' | 'span' | 'p' | 'h3' | 'h4' | 'li' | 'summary'; className?: string; style?: React.CSSProperties },
): ReactNode {
  const E = als
  return <E className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

export const Balk = ({ pct }: { pct: number }): ReactNode => (
  <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
)

export const Ring = ({ pct, tekst }: { pct: number; tekst: ReactNode }): ReactNode => (
  <div className="ring" style={{ '--p': Math.max(0, Math.min(100, pct)) } as React.CSSProperties}>
    <span>{tekst}</span>
  </div>
)

export const Tag = ({ soort, children, style }:
{ soort?: string | undefined; children: ReactNode; style?: React.CSSProperties }): ReactNode => (
  <span className={soort ? `tag ${soort}` : 'tag'} style={style}>{children}</span>
)

export const Vink = ({ aan, ...rest }: { aan: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>): ReactNode =>
  (rest.onClick
    ? <button className={`vink ${aan ? 'aan' : ''}`} {...rest}>✓</button>
    : <span className={`vink ${aan ? 'aan' : ''}`}>✓</span>)

export const Melding = (
  { tekst, soort }: { tekst: string; soort?: 'goed' | 'fout' | undefined },
): ReactNode => (tekst ? <p className={soort ? `melding ${soort}` : 'melding'}>{tekst}</p> : null)

/**
 * Een kort berichtje onderin beeld. Bedoeld voor dingen die misgaan terwijl er
 * geen scherm is om het in te zetten — beter dan stilte.
 */
export function Kortje({ tekst }: { tekst: string }): ReactNode {
  const [zicht, zetZicht] = useState(false)
  useEffect(() => {
    if (!tekst) { zetZicht(false); return }
    zetZicht(true)
    const t = setTimeout(() => zetZicht(false), 4200)
    return () => clearTimeout(t)
  }, [tekst])
  if (!zicht || !tekst) return null
  return (
    <div style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 26, zIndex: 80,
      maxWidth: '88vw', background: 'var(--ink)', color: 'var(--canvas)', padding: '11px 16px',
      borderRadius: 10, fontSize: '.9rem', lineHeight: 1.4, boxShadow: 'var(--schaduw-op)',
      textAlign: 'center',
    }}>{tekst}</div>
  )
}

/** Het venster dat over de app heen schuift. Sluit op Escape en op de rand. */
export function Blad(
  { open, sluit, children }: { open: boolean; sluit: () => void; children: ReactNode },
): ReactNode {
  useEffect(() => {
    if (!open) return
    const toets = (e: KeyboardEvent): void => { if (e.key === 'Escape') sluit() }
    addEventListener('keydown', toets)
    return () => removeEventListener('keydown', toets)
  }, [open, sluit])
  if (!open) return null
  return (
    <div
      className="overlay on" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) sluit() }}
    >
      <div className="blad">{children}</div>
    </div>
  )
}
