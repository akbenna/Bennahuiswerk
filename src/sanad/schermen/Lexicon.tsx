/** NEGENENZESTIG KERNBEGRIPPEN — wie de termen kent, kan de discussie volgen. */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { LEXICON } from '../gegevens/lexicon'
import { Rijk } from '../onderdelen'

export function Lexicon(): ReactNode {
  const [zoek, zetZoek] = useState('')
  const z = zoek.toLowerCase()
  const lijst = LEXICON.filter((x) => !z || (x.t + x.u).toLowerCase().includes(z))

  return (
    <>
      <h1>Lexicon</h1>
      <p className="lede muted" style={{ marginTop: 10, maxWidth: '56ch' }}>
        Negenenzestig kernbegrippen. Wie de termen kent, kan de discussie volgen.
      </p>
      <input
        className="search"
        style={{ marginTop: 24 }}
        value={zoek}
        onChange={(e) => zetZoek(e.target.value)}
        placeholder="Zoek een term…"
        aria-label="Zoek een term"
      />
      {lijst.length === 0
        ? <p className="muted small">Niets gevonden.</p>
        : lijst.map((x) => (
          <div className="row" key={x.t}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h4>{x.t}</h4>
              <span className="ar" lang="ar" dir="rtl">{x.ar}</span>
            </div>
            <Rijk als="p" className="small" html={x.u} />
          </div>
        ))}
    </>
  )
}
