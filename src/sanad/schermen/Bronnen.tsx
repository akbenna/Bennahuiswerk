/** DE WERKEN ZELF — wat het is, wie het schreef, en of je eraan kunt komen. */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { BRONNEN } from '../gegevens/bronnen'
import { Rijk, Tag } from '../onderdelen'

export const DISC: Record<string, string> = {
  fiqh: 'Fiqh', usul: 'Usul', aqida: '‘Aqida', hadith: 'Hadith',
  tafsir: 'Tafsir', tasawwuf: 'Tasawwuf', tibb: 'Geneeskunde',
}

const NIV = { begin: 'green', kern: 'blue', gevorderd: 'yellow' } as const

export function Bronnen(): ReactNode {
  const [filter, zetFilter] = useState('alles')
  const [zoek, zetZoek] = useState('')

  const z = zoek.toLowerCase()
  const lijst = BRONNEN.filter((b) =>
    (filter === 'alles' || b.d === filter)
    && (!z || (b.t + b.au + b.o).toLowerCase().includes(z)))

  return (
    <>
      <h1>Bronnen</h1>
      <p className="lede muted" style={{ marginTop: 10, maxWidth: '56ch' }}>
        De werken zelf: wat het is, wie het schreef, waar het in de traditie staat, en of het
        toegankelijk is.
      </p>

      <div className="filters" style={{ marginTop: 24 }}>
        {['alles', ...Object.keys(DISC)].map((d) => (
          <button key={d} className="chip" aria-pressed={filter === d} onClick={() => zetFilter(d)}>
            {d === 'alles' ? 'Alles' : DISC[d]}
          </button>
        ))}
      </div>
      <input
        className="search"
        value={zoek}
        onChange={(e) => zetZoek(e.target.value)}
        placeholder="Zoek in titels, auteurs, omschrijvingen…"
        aria-label="Zoek in de bronnen"
      />

      {lijst.length === 0
        ? <p className="muted small">Niets gevonden.</p>
        : lijst.map((b) => (
          <div className="row" key={b.t}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h4>{b.t}</h4>
              <Tag kleur={NIV[b.n]}>{b.n}</Tag>
              <Tag>{DISC[b.d] ?? b.d}</Tag>
            </div>
            <span className="ar" lang="ar" dir="rtl">{b.ar}</span>
            <p className="small muted" style={{ margin: '0 0 8px' }}>{b.au} · {b.j}</p>
            <Rijk als="p" className="small" html={b.o} />
          </div>
        ))}
    </>
  )
}
