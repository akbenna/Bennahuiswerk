/**
 * HET LOGBOEK
 *
 * Op termijn het waardevolste deel van het programma: de enige plek waar de
 * stof en de eigen ervaring elkaar raken. Wat hier staat is door de gebruiker
 * getikt en gaat dus als gewone tekst het scherm op, nooit als opmaak.
 */
import type { ReactNode } from 'react'
import { PROGRAMMA, weekTitel } from '../programma'
import { Tag } from '../onderdelen'
import type { Stand } from '../opslag'

export function Logboek({ stand }: { stand: Stand }): ReactNode {
  const rijen = Object.keys(stand.notities)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((n) => stand.notities[n]?.trim())

  return (
    <>
      <h1>Logboek</h1>
      <p className="lede muted" style={{ marginTop: 10, maxWidth: '58ch' }}>
        Je eigen antwoorden op de toepassingsopdrachten. Dit is op termijn het waardevolste deel
        van het programma: het is de enige plek waar de stof en jouw ervaring elkaar raken.
      </p>
      <div style={{ marginTop: 26 }}>
        {rijen.length === 0
          ? <p className="muted small">
              Nog niets geschreven. De toepassingsopdracht staat in stap vier van elke week.
            </p>
          : rijen.map((n) => {
            const w = PROGRAMMA[n - 1]
            return (
              <div className="log" key={n}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Tag kleur={w?.sp.kleur}>Week {n}</Tag>
                  <h4 style={{ fontSize: '.98rem', fontWeight: 500, margin: 0 }}>
                    {w ? weekTitel(w) : ''}
                  </h4>
                  <span className="meta" style={{ marginLeft: 'auto' }}>{stand.klaar[n] ?? ''}</span>
                </div>
                <p>{stand.notities[n]}</p>
              </div>
            )
          })}
      </div>
    </>
  )
}
