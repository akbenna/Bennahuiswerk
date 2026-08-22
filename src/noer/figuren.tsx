/**
 * DE TEKENINGEN OP HET SCHERM
 *
 * De SVG-fragmenten staan in gegevens/figuren.ts; hier worden ze in een
 * component gezet. Ze gaan via dangerouslySetInnerHTML naar binnen omdat het
 * pad-tekst is die uit de repo komt en nergens anders vandaan — precies zoals
 * de leerstof zelf.
 */
import type { CSSProperties, ReactNode } from 'react'
import { HOUDING, KLEED, TAFEREEL } from './gegevens/figuren'

/** Een houding tekenen. `merk` zet een gestippelde ring om het lichaamsdeel
 *  waar het op dat moment om gaat: [x, y, straal]. */
export function Houding(
  { naam, merk }: { naam: string; merk?: number[] | null },
): ReactNode {
  const h = HOUDING[naam] ?? HOUDING['staan'] ?? ''
  const ring = merk
    ? `<circle class="fig-mark gloed" cx="${merk[0]}" cy="${merk[1]}" r="${merk[2] ?? 26}"/>`
    : ''
  return (
    <svg
      viewBox="0 0 320 240" role="img" aria-label={`Houding: ${naam}`}
      dangerouslySetInnerHTML={{ __html: KLEED + h + ring }}
    />
  )
}

/** Een tafereel bij een verhaal. Geeft niets als het niet bestaat. */
export function Tafereel({ id }: { id: string }): ReactNode {
  const t = TAFEREEL[id]
  if (!t) return null
  return (
    <div className="tafereel">
      <svg
        viewBox="0 0 400 220" role="img" aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        dangerouslySetInnerHTML={{ __html: t }}
      />
    </div>
  )
}

/**
 * De wassing tekenen we van voren: één figuur waarin telkens een ander deel
 * oplicht. Zo zie je in één oogopslag waar het water heen gaat.
 */
/**
 * De wassing tekenen we van voren: één figuur waarin telkens een ander deel
 * oplicht. Zo zie je in één oogopslag waar het water heen gaat.
 *
 * Dit is echte JSX en geen tekstfragment, en dat is met opzet: React zet een
 * `style`-object via de CSSOM, terwijl een `style="..."` in een tekstfragment
 * een inline stijl is die de strikte policy tegenhoudt. Het verschil is
 * onzichtbaar in de bron en zichtbaar op het scherm — dan staat de hele
 * tekening er ongekleurd bij.
 */
export function Wudufiguur({ deel }: { deel: string }): ReactNode {
  const vlak = (d: string): CSSProperties => deel === d
    ? { fill: 'var(--k)', opacity: 0.55 }
    : { fill: 'var(--surface-3)', opacity: 0.9 }
  const lijn: CSSProperties = {
    fill: 'none', stroke: 'var(--ink)', strokeWidth: 3.4,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  }
  const dik: CSSProperties = {
    fill: 'none', stroke: 'var(--k)', strokeWidth: 6, strokeLinecap: 'round',
  }
  const arm: CSSProperties = deel === 'armen'
    ? { fill: 'none', stroke: 'var(--k)', strokeWidth: 15, strokeLinecap: 'round', opacity: 0.55 }
    : { fill: 'none', stroke: 'var(--surface-3)', strokeWidth: 15, strokeLinecap: 'round' }

  return (
    <svg viewBox="0 0 300 268" role="img" aria-label={`Wassing: ${deel}`}>
      <ellipse cx="150" cy="66" rx="41" ry="47" style={vlak('gezicht')} />
      <ellipse cx="150" cy="66" rx="41" ry="47" style={lijn} />
      <ellipse cx="107" cy="68" rx="9" ry="13" style={vlak('oren')} />
      <ellipse cx="193" cy="68" rx="9" ry="13" style={vlak('oren')} />
      <ellipse cx="107" cy="68" rx="9" ry="13" style={lijn} />
      <ellipse cx="193" cy="68" rx="9" ry="13" style={lijn} />
      <path d="M116 24 A44 30 0 0 1 184 24 L184 34 A44 22 0 0 0 116 34 Z" style={vlak('hoofd')} />
      <path d="M116 24 A44 30 0 0 1 184 24" style={lijn} />
      <path d="M150 54 L150 74 M144 74 L156 74" style={deel === 'neus' ? dik : lijn} />
      <path d="M134 92 Q150 102 166 92" style={deel === 'mond' ? dik : lijn} />
      <path d="M150 113 V132" style={lijn} />
      <path
        d="M112 136 H188 L196 176 H104 Z"
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)', strokeWidth: 3.4 }}
      />
      <path d="M112 140 L74 206 M188 140 L226 206" style={arm} />
      <path d="M112 140 L74 206 M188 140 L226 206" style={lijn} />
      <circle cx="70" cy="214" r="12" style={vlak('handen')} />
      <circle cx="230" cy="214" r="12" style={vlak('handen')} />
      <circle cx="70" cy="214" r="12" style={lijn} />
      <circle cx="230" cy="214" r="12" style={lijn} />
      <rect x="106" y="232" width="34" height="24" rx="11" style={vlak('voeten')} />
      <rect x="160" y="232" width="34" height="24" rx="11" style={vlak('voeten')} />
      <rect x="106" y="232" width="34" height="24" rx="11" style={lijn} />
      <rect x="160" y="232" width="34" height="24" rx="11" style={lijn} />
    </svg>
  )
}
