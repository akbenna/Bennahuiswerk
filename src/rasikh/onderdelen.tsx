/** De vormen die op meerdere schermen van Rasikh terugkomen. */
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import type { Aya } from './koran'

export const Balk = ({ deel, dun }: { deel: number; dun?: boolean }) => (
  <div className={'bar' + (dun ? ' dun' : '')}>
    <i style={{ width: Math.max(0, Math.min(100, deel)) + '%' }} />
  </div>
)

export const Kaart = (
  { toon, plat, children }:
  { toon?: 'let' | 'fout' | undefined; plat?: boolean; children: ReactNode },
) => <div className={['card', plat ? 'plat' : '', toon ?? ''].filter(Boolean).join(' ')}>{children}</div>

export const Kader = (
  { toon, kop, children }:
  { toon?: 'let' | 'fout' | undefined; kop: string; children: ReactNode },
) => (
  <div className={'kader ' + (toon ?? '')}>
    <h4>{kop}</h4>
    <p className="klein" style={{ marginTop: 4 }}>{children}</p>
  </div>
)

export const Tag = ({ toon, children }: { toon?: string; children: ReactNode }) =>
  <span className={'tag ' + (toon ?? '')}>{children}</span>

/** Eén aya, met de klank en de betekenis eronder tenzij die weggelaten worden. */
export function AyaBlok(
  { a, ar, geenTr, geenNl, opHoren }:
  {
    a: Aya
    /** Andere Arabische tekst tonen dan die van de aya zelf; het losmaken
     *  gebruikt dit om woorden te verbergen. */
    ar?: ReactNode
    geenTr?: boolean
    geenNl?: boolean
    opHoren?: (() => void) | undefined
  },
) {
  return (
    <div className="aya">
      <div className="rij tussen" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ar">{ar ?? a.ar}</div>
          {!geenTr && <div className="tr" style={{ marginTop: 8 }}>{a.tr}</div>}
          {!geenNl && (
            <div className="nl" style={{ marginTop: 5, color: 'var(--muted)' }}>{a.nl}</div>
          )}
        </div>
        {opHoren && (
          <div>
            <button type="button" className="icoon" title="Luister" onClick={opHoren}>🔊</button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Het overlay-blad waarin het leren, het herhalen en de vensters gebeuren. */
export function Blad({ opSluiten, children }: { opSluiten: () => void; children: ReactNode }) {
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => { if (e.key === 'Escape') opSluiten() }
    addEventListener('keydown', opToets)
    return () => removeEventListener('keydown', opToets)
  }, [opSluiten])

  return (
    <div className="overlay on" role="dialog" aria-modal="true"
         onClick={(e) => { if (e.target === e.currentTarget) opSluiten() }}>
      <div className="blad">{children}</div>
    </div>
  )
}

export const BladKop = (
  { tekst, opSluiten }: { tekst: string; opSluiten: () => void },
) => (
  <div className="rij tussen">
    <p className="meta">{tekst}</p>
    <button type="button" className="icoon" aria-label="Sluiten" onClick={opSluiten}>✕</button>
  </div>
)

export const Melding = (
  { tekst, soort }: { tekst: string | null; soort?: 'goed' | 'fout' | 'let' | undefined },
) => <p className={'melding ' + (soort ?? '')}>{tekst ?? ''}</p>
