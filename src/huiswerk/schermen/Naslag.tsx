/**
 * NASLAG: formules en leertips
 *
 * Twee schermen die niets bijhouden: ze staan er om op te zoeken. De
 * formulekaart begint met het vierstappenplan, want dat is wat er misgaat,
 * niet de formule maar de gewoonte om eerst op te schrijven wat je weet.
 *
 * DE KAART MOET OOK NAAST DE SOM LIGGEN
 *
 * Dit scherm hangt aan de knop op het thuisscherm, en daar was het mis: wie via
 * het portaal binnenkomt begint bij zijn vakken en komt op dat thuisscherm
 * nooit meer langs (`App.tsx`, `viaPortaal`). En zelfs wie er wél kwam, moest
 * midden in een reeks twee schermen terug, waarmee de som weg was.
 *
 * Vandaar `Formuleklapper`: dezelfde blokken, ingeklapt onderaan het
 * oefenscherm en het vakkenscherm, gefilterd op het vak waar je mee bezig bent.
 * Het is een `<details>`, dus hij kost niets zolang hij dicht staat, hij is met
 * het toetsenbord te openen, en ⌘F vindt de formule erin ook dicht.
 */
import type { ReactNode } from 'react'
import { FORMULEBLOKKEN, formulesVoor } from '../gegevens/formules'
import type { Formuleblok } from '../gegevens/formules'
import { TIPS_CATS } from '../gegevens/leertips'
import { VAKNAAM } from '../gegevens/profielen'
import { Klapkaart } from '../onderdelen'

/** Niet de formule maar de gewoonte. Staat boven elke formulekaart. */
const Stappenplan = (): ReactNode => (
  <div className="card stappen" style={{ marginTop: 12, borderLeft: '4px solid var(--accent)' }}>
    <b style={{ color: 'var(--accent)' }}>Bij elke som: het 4-stappenplan (GGFU)</b>
    <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7 }}>
      <b>1. Gegeven</b>: schrijf op wat je weet, mét eenheid.<br />
      <b>2. Gevraagd</b>: wat moet je uitrekenen?<br />
      <b>3. Formule</b>: kies de formule, schrijf hem eerst leeg op.<br />
      <b>4. Uitwerking</b>: invullen, uitrekenen, eenheid erachter, en vraag:{' '}
      <i>&ldquo;is dit logisch?&rdquo;</i>
    </div>
  </div>
)

const Blok = ({ blok }: { blok: Formuleblok }): ReactNode => (
  <div className="card" style={{ marginTop: 12 }}>
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
)

/**
 * De formulekaart onderaan een scherm, ingeklapt, met alleen de blokken van dít
 * vak. Heeft het vak er geen (rekenen, taal, lezen) dan komt er niets te
 * staan; een lege kaart is erger dan geen kaart.
 *
 * Hij staat er ook tijdens een toets. Een formulekaart is geen hint: op school
 * ligt hij er bij het proefwerk net zo goed naast.
 */
export function Formuleklapper({ vak }: { vak: string }): ReactNode {
  const blokken = formulesVoor(vak)
  if (!blokken.length) return null
  return (
    <div style={{ marginTop: 14 }}>
      <Klapkaart titel="📐 Formules erbij" zij={`${VAKNAAM[vak] ?? vak}, altijd na te lezen`}>
        <Stappenplan />
        {blokken.map((blok) => <Blok key={blok.kop} blok={blok} />)}
      </Klapkaart>
    </div>
  )
}

export function Formules({ terug }: { terug: () => void }): ReactNode {
  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">Formules &amp; uitleg</span>
      </div>
      <h1 style={{ fontSize: 24 }}>📐 Formules</h1>

      <Stappenplan />

      {FORMULEBLOKKEN.map((blok) => <Blok key={blok.kop} blok={blok} />)}

      <p className="muted center" style={{ marginTop: 16, fontSize: 13 }}>
        Tip: leer formules niet uit je hoofd door staren: schrijf ze één keer over en hoor jezelf
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
        Kleine gewoontes, groot verschil. Lees er af en toe één, niet alles tegelijk.
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
