/**
 * ALFABET — achtentwintig letters, en de tekens die geen letter zijn
 *
 * De filters zijn geen versiering: zons- en maansletters bepalen hoe je het
 * lidwoord uitspreekt, en "verbindt niet naar links" verklaart waarom een woord
 * middenin uit elkaar valt. Dat zijn de twee dingen waar een beginner over
 * struikelt.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { EXTRA_TEKENS, LETTERS, TEKENS } from '../gegevens/letters'
import type { Toestand } from '../toestand'
import { Rijk } from '../onderdelen'

type Filter = 'alle' | 'zon' | 'maan' | 'moeilijk' | 'losstaand'

const FILTERS: Array<[Filter, string]> = [
  ['alle', 'alle'],
  ['zon', 'zonsletters (14)'],
  ['maan', 'maansletters (14)'],
  ['moeilijk', 'nieuwe klanken'],
  ['losstaand', 'verbinden niet naar links'],
]

export function Alfabet(
  { t, openLetter, openTeken }:
  { t: Toestand; openLetter: (l: string) => void; openTeken: (i: number) => void },
): ReactNode {
  const [filter, zetFilter] = useState<Filter>('alle')
  const p = t.profiel
  if (!p) return null

  const lijst = LETTERS.filter((l) => (
    filter === 'alle' ? true
      : filter === 'zon' ? l.zon
        : filter === 'maan' ? !l.zon
          : filter === 'moeilijk' ? l.moeilijk
            : !l.vl))

  return (
    <div className="wrap">
      <h1>Alfabet</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        Achtentwintig letters. Tik er een aan voor de vier vormen en de uitspraak.
      </p>

      <div className="chips" style={{ marginTop: 14 }}>
        {FILTERS.map(([f, naam]) => (
          <button
            type="button" key={f} className="chip" aria-pressed={filter === f}
            onClick={() => zetFilter(f)}
          >{naam}</button>
        ))}
      </div>

      <div className="lettergrid">
        {lijst.map((l) => (
          <button
            type="button" key={l.l} onClick={() => openLetter(l.l)}
            className={'lettervak' + ((p.letters[l.l] ?? 0) >= 3 ? ' veroverd' : '')}
          >
            <span className="l">{l.l}</span><span className="nm">{l.tr}</span>
          </button>
        ))}
      </div>

      <hr className="regel" />
      <h3>Klinker- en hulptekens</h3>
      <div className="raster r3" style={{ marginTop: 12 }}>
        {TEKENS.map((tk, i) => (
          <button
            type="button" key={tk.t} className="kaart dun mid" style={{ cursor: 'pointer' }}
            onClick={() => openTeken(i)}
          >
            <div className="ar" style={{ fontSize: '2rem' }}>{tk.demo}</div>
            <div className="klein" style={{ marginTop: 4 }}>{tk.tr}</div>
          </button>
        ))}
      </div>

      <hr className="regel" />
      <h3>Tekens die geen van de 28 letters zijn</h3>
      <div className="stack" style={{ marginTop: 12 }}>
        {EXTRA_TEKENS.map((e) => (
          <div className="kaart dun" key={e.l}>
            <div className="rij">
              <span className="ar" style={{ fontSize: '2rem' }}>{e.l}</span>
              <div className="rek"><b>{e.n}</b> <span className="tr">{e.tr}</span></div>
            </div>
            <Rijk als="p" className="small" style={{ margin: '8px 0 0' }} html={e.u} />
          </div>
        ))}
      </div>
    </div>
  )
}
