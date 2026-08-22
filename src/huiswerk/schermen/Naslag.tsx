/**
 * NASLAG — formules en leertips
 *
 * Twee schermen die niets bijhouden: ze staan er om op te zoeken. De
 * formulekaart begint met het vierstappenplan, want dat is wat er misgaat —
 * niet de formule maar de gewoonte om eerst op te schrijven wat je weet.
 */
import type { ReactNode } from 'react'
import { FORMULEBLOKKEN } from '../gegevens/formules'
import { TIPS_CATS } from '../gegevens/leertips'

export function Formules({ terug }: { terug: () => void }): ReactNode {
  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">Formules &amp; uitleg</span>
      </div>
      <h1 style={{ fontSize: 24 }}>📐 Formules</h1>

      <div className="card" style={{ marginTop: 12, borderLeft: '4px solid var(--accent)' }}>
        <b style={{ color: 'var(--accent)' }}>Bij elke som: het 4-stappenplan (GGFU)</b>
        <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7 }}>
          <b>1. Gegeven</b> — schrijf op wat je weet, mét eenheid.<br />
          <b>2. Gevraagd</b> — wat moet je uitrekenen?<br />
          <b>3. Formule</b> — kies de formule, schrijf hem eerst leeg op.<br />
          <b>4. Uitwerking</b> — invullen, uitrekenen, eenheid erachter, en vraag:{' '}
          <i>&ldquo;is dit logisch?&rdquo;</i>
        </div>
      </div>

      {FORMULEBLOKKEN.map((blok) => (
        <div key={blok.kop} className="card" style={{ marginTop: 12 }}>
          <b>{blok.kop}</b>
          <div style={{ marginTop: 8 }}>
            {blok.items.map(([naam, f]) => (
              <div
                key={naam}
                style={{
                  display: 'flex', gap: 10, alignItems: 'baseline', padding: '5px 0',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div style={{ flex: '0 0 38%', fontWeight: 600, fontSize: 14 }}>{naam}</div>
                <div className="formule" style={{ flex: 1, fontSize: 14 }}>{f}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="muted center" style={{ marginTop: 16, fontSize: 13 }}>
        Tip: leer formules niet uit je hoofd door staren — schrijf ze één keer over en hoor jezelf
        elke dag 5 minuten één blokje over. 🌟
      </p>
    </div>
  )
}

export function Leertips({ terug }: { terug: () => void }): ReactNode {
  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">Leertips</span>
      </div>
      <h1 style={{ fontSize: 24 }}>💡 Leertips</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        Kleine gewoontes, groot verschil. Lees er af en toe één — niet alles tegelijk.
      </p>
      {TIPS_CATS.map((cat) => (
        <div key={cat.kop} className="card" style={{ marginTop: 12 }}>
          <b>{cat.emoji} {cat.kop}</b>
          <div style={{ marginTop: 8 }}>
            {cat.tips.map(([t, u]) => (
              <div key={t} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 600 }}>{t}</div>
                <div className="muted" style={{ fontSize: 14 }}>{u}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="muted center" style={{ marginTop: 16, fontSize: 13 }}>
        De beste tip? Begin gewoon. Eén som is altijd beter dan geen som. 🌟
      </p>
    </div>
  )
}
