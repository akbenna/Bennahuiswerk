/**
 * EEN SPOOR — de blokken met hun lessen
 *
 * Een les gaat pas open als de vorige af is. Dat is geen pesterij: de stof
 * stapelt, en een les overslaan betekent tien minuten later vastlopen op iets
 * wat in de overgeslagen les werd uitgelegd.
 */
import type { ReactNode } from 'react'
import type { Blok } from '../gegevens/soorten'
import { af, blokAf, blokGedaan } from '../voortgang'
import type { Stand } from '../opslag'
import { Tag } from '../onderdelen'

/** Of les `li` in blok `bi` open staat. De allereerste altijd. */
export function open(stand: Stand, blokken: Blok[], bi: number, li: number): boolean {
  if (bi === 0 && li === 0) return true
  const b = blokken[bi]
  if (!b) return false
  if (li > 0) return af(stand, b.lessen[li - 1]?.id ?? '')
  const vorige = blokken[bi - 1]
  return vorige ? blokAf(stand, vorige) : false
}

export function Spoor({
  stand, blokken, kop, onder, opLes, staart,
}: {
  stand: Stand
  blokken: Blok[]
  kop: string
  onder: string
  opLes: (bi: number, li: number) => void
  staart?: ReactNode
}): ReactNode {
  return (
    <>
      <div>
        <h1>{kop}</h1>
        <p className="klein" style={{ marginTop: 5 }}>{onder}</p>
      </div>
      {blokken.map((b, bi) => {
        const n = blokGedaan(stand, b)
        return (
          <div key={b.id}>
            <div className="blokkop">
              <h2>{b.ico} {b.n}</h2>
              <span className="lijn" />
              <Tag soort={n === b.lessen.length ? 'goed' : undefined}>{n}/{b.lessen.length}</Tag>
            </div>
            <p className="klein" style={{ margin: '-4px 0 10px' }}>{b.u}</p>
            <div className="stack">
              {b.lessen.map((l, li) => {
                const kan = open(stand, blokken, bi, li)
                const klaar = af(stand, l.id)
                return (
                  <button
                    key={l.id}
                    className={`les${klaar ? ' af' : ''}`}
                    disabled={!kan}
                    onClick={() => opLes(bi, li)}
                  >
                    <span className="nr">{klaar ? '✓' : kan ? li + 1 : '🔒'}</span>
                    <span className="tt">
                      <b>{l.t}{l.project && <> <span className="tag k">project</span></>}</b>
                      <span>{l.d}</span>
                    </span>
                    <span className="rechts">
                      {klaar ? `${stand.lessen[l.id]?.score ?? 0}%` : kan ? '→' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {staart}
    </>
  )
}
