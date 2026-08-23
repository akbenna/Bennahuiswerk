/**
 * DE BOUWSTENEN
 *
 * De oude app bouwde elk scherm op met dezelfde vier of vijf vormen — kaart,
 * knop, chip, balk, inklapbare uitleg — maar telkens opnieuw uitgeschreven als
 * string met de klassenamen erin. Hier staan ze één keer.
 *
 * Ze zijn met opzet dun: ze zetten een klasse en geven kinderen door. De stijl
 * blijft in stijl.css staan, waar hij te lezen is als samenhangend geheel in
 * plaats van verspreid over honderden losse attributen.
 */
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { Graad } from '@/gedeeld/db/tabellen'

export function Kaart(
  { toon, plat, style, children }:
  {
    toon?: 'let' | 'fout' | 'goed' | undefined
    plat?: boolean | undefined
    style?: CSSProperties | undefined
    children: ReactNode
  },
) {
  const klas = ['kaart', toon ?? '', plat ? 'plat' : ''].filter(Boolean).join(' ')
  return <div className={klas} style={style}>{children}</div>
}

export function Kop({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>
}

export function Tussen(
  { style, children }: { style?: CSSProperties | undefined; children: ReactNode },
) {
  return <div className="tussen" style={style}>{children}</div>
}

export function Rij(
  { style, children }: { style?: CSSProperties | undefined; children: ReactNode },
) {
  return <div className="rij" style={style}>{children}</div>
}

export function Knop(
  { vol, klein, uit, opKlik, titel, style, children }:
  {
    vol?: boolean | undefined
    klein?: boolean | undefined
    uit?: boolean | undefined
    opKlik?: (() => void) | undefined
    titel?: string | undefined
    style?: CSSProperties | undefined
    children: ReactNode
  },
) {
  return (
    <button
      type="button"
      className={['knop', vol ? 'vol' : '', klein ? 'sm' : ''].filter(Boolean).join(' ')}
      onClick={opKlik}
      disabled={uit ?? false}
      aria-label={titel ?? undefined}
      style={style}
    >
      {children}
    </button>
  )
}

/** A etiket en gewogen · B etiket, portie geschat · C tabelwaarde · D ruwe schatting. */
export function Chip({ graad }: { graad: Graad }) {
  return <span className={'conf ' + graad} title={'Betrouwbaarheid ' + graad}>{graad}</span>
}

/**
 * Een aantikbaar chipje: een keuze uit een klein rijtje, zonder de zwaarte van
 * een knop. Bewust iets anders dan `Chip` hierboven — die is een label voor de
 * betrouwbaarheidsgraad en nooit aantikbaar. Twee dingen die er hetzelfde
 * uitzien maar niet hetzelfde doen zouden een vergissing zijn.
 */
export function Keuzechip(
  { aan, opKlik, titel, children }:
  { aan?: boolean | undefined; opKlik: () => void; titel?: string | undefined; children: ReactNode },
) {
  return (
    <button type="button" className={'chip' + (aan ? ' aan' : '')} aria-pressed={aan ?? false}
            title={titel} onClick={opKlik}>{children}</button>
  )
}

export function Balk({ deel, toon }: { deel: number; toon?: 'goed' | 'let' | undefined }) {
  return (
    <div className="balk">
      <i className={toon ?? ''} style={{ width: Math.max(0, Math.min(100, deel)) + '%' }} />
    </div>
  )
}

/**
 * Inklapbare onderbouwing. De stand staat per blok in localStorage: het scherm
 * werd vroeger bij elke wijziging opnieuw getekend en een <details> klapte dan
 * dicht terwijl je aan het lezen was. React hertekent niet meer op die manier,
 * maar de stand hoort ook een bezoek later nog te kloppen — dus hij blijft.
 */
/* Ook deze sleutel blijft: welke uitleg je open had staan hoort niet te
   verdwijnen omdat de app anders gaat heten. */
const SLEUTEL_UITLEG = 'kalibratie.uitleg'

function leesStand(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL_UITLEG) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

export function Uitleg(
  { id, label, children }: { id: string; label?: string | undefined; children: ReactNode },
) {
  const [open, zetOpen] = useState(false)
  useEffect(() => { zetOpen(leesStand()[id] ?? false) }, [id])

  const wissel = useCallback((e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const nu = e.currentTarget.open
    zetOpen(nu)
    try {
      localStorage.setItem(SLEUTEL_UITLEG, JSON.stringify({ ...leesStand(), [id]: nu }))
    } catch { /* een browser die opslag weigert mag de app niet stukmaken */ }
  }, [id])

  return (
    <details className="uitleg" open={open} onToggle={wissel}>
      <summary>{label ?? 'waarom'}</summary>
      <div className="inhoud mini">{children}</div>
    </details>
  )
}

/** Een venster met sluier. Klikken naast het venster sluit het. */
export function Venster(
  { titel, onder, opSluiten, children }:
  { titel: string; onder?: ReactNode; opSluiten: () => void; children: ReactNode },
) {
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => { if (e.key === 'Escape') opSluiten() }
    addEventListener('keydown', opToets)
    return () => removeEventListener('keydown', opToets)
  }, [opSluiten])

  return (
    <div className="sluier" onClick={(e) => { if (e.target === e.currentTarget) opSluiten() }}>
      <div className="venster" role="dialog" aria-modal="true" aria-label={titel}>
        <div className="tussen">
          <h2 style={{ fontSize: '1.2rem', lineHeight: 1.25 }}>{titel}</h2>
          <Knop klein opKlik={opSluiten} titel="Sluiten">×</Knop>
        </div>
        {onder}
        {children}
      </div>
    </div>
  )
}

export function Spin() {
  return <span className="spin" />
}
