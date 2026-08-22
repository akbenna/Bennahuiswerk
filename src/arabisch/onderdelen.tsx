/**
 * KLEINE ONDERDELEN
 *
 * De uitleg in deze app draagt opmaak: <b> om een begrip, <span class="ar"> om
 * Arabisch dat middenin een Nederlandse zin staat. Die gaat via
 * dangerouslySetInnerHTML naar binnen, en dat mag omdat de herkomst vaststaat —
 * die teksten staan in de repo, in gegevens/. Alles wat een ouder of een kind
 * zélf intikt (een naam, een afspraak, een zoekterm) gaat als gewone tekst door
 * React heen en komt hier nooit langs.
 */
import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { arIn } from './tekst'

/** Vaste opmaak uit de gegevens, met het losse Arabisch geïsoleerd. */
export function Rijk(
  { html, als = 'div', className, style }:
  { html: string; als?: 'div' | 'span' | 'p' | 'h2' | 'h3' | 'b'; className?: string; style?: CSSProperties },
): ReactNode {
  const E = als
  return <E className={className} style={style} dangerouslySetInnerHTML={{ __html: arIn(html) }} />
}

export const Balk = ({ pct, style }: { pct: number; style?: CSSProperties }): ReactNode => (
  <div className="balk" style={style}><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
)

export const Vlag = ({ soort, children }: { soort?: string; children: ReactNode }): ReactNode => (
  <span className={soort ? `vlag ${soort}` : 'vlag'}>{children}</span>
)

export const Statvak = ({ n, wat }: { n: ReactNode; wat: string }): ReactNode => (
  <div className="kaart dun statvak"><b>{n}</b><span>{wat}</span></div>
)

/** Het venster dat over de app heen schuift. Sluit op Escape en op de rand. */
export function Blad(
  { open, sluit, children }: { open: boolean; sluit: () => void; children: ReactNode },
): ReactNode {
  useEffect(() => {
    if (!open) return
    const toets = (e: KeyboardEvent): void => { if (e.key === 'Escape') sluit() }
    addEventListener('keydown', toets)
    /* Zolang het blad open staat scrollt de pagina eronder niet mee. */
    const oud = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', toets)
      document.body.style.overflow = oud
    }
  }, [open, sluit])
  if (!open) return null
  return (
    <div
      className="overlay aan" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) sluit() }}
    >
      <div className="blad">
        <div className="rij tussen" style={{ marginBottom: 8 }}>
          <span className="label">Arabisch</span>
          <button type="button" className="ikoon" onClick={sluit} aria-label="Sluiten">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** De luisterknop. Verdwijnt als het toestel geen Arabische stem heeft. */
export function Luister(
  { spraak, tekst, groot, kind }:
  { spraak: { beschikbaar: boolean; zeg: (t: string) => void }; tekst: string
    groot?: boolean; kind?: ReactNode },
): ReactNode {
  if (!spraak.beschikbaar || !tekst) return null
  return groot
    ? (
      <button type="button" className="k rand" onClick={() => spraak.zeg(tekst)}>
        {kind ?? '🔈 Uitspreken'}
      </button>
      )
    : (
      <button
        type="button" className="ikoon" onClick={() => spraak.zeg(tekst)}
        aria-label="Uitspreken" title="Uitspreken"
      >🔈</button>
      )
}
