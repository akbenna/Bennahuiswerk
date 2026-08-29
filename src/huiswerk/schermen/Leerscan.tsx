/**
 * DE LEERSCAN OP HET SCHERM
 *
 * Eén vraag tegelijk. Vijftien vragen onder elkaar is een formulier en dat vult
 * een kind af; één vraag met drie knoppen is een gesprekje.
 *
 * Er zit geen "vorige"-knop op de laatste vraag maar wel op de rest, en de
 * uitslag is altijd opnieuw op te roepen. Wat er níét is, is een cijfer of een
 * etiket: je krijgt te zien wat je al goed doet en één ding om aan te werken.
 * Vijf adviezen tegelijk verandert er nul.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { DIMENSIES, SCANVRAGEN } from '../gegevens/leerscan'
import { advies, bandNaam, isAf, uitkomsten } from '../leerscan'
import type { Leerscan as Scan } from '../leerscan'

export interface LeerscanProps {
  naam: string
  scan: Scan | null
  terug: () => void
  bewaar: (scan: Scan) => void
}

export function Leerscan({ naam, scan, terug, bewaar }: LeerscanProps): ReactNode {
  const [antwoorden, zetAntwoorden] = useState<Record<string, number>>(
    () => (isAf(scan) ? { ...scan?.antwoorden } : {}))
  const [bezig, zetBezig] = useState(() => !isAf(scan))
  const [nr, zetNr] = useState(0)

  const vraag = SCANVRAGEN[nr]

  function kies(waarde: number): void {
    if (!vraag) return
    const bij = { ...antwoorden, [vraag.id]: waarde }
    zetAntwoorden(bij)
    if (nr + 1 < SCANVRAGEN.length) { zetNr(nr + 1); return }
    const af: Scan = { tijd: Date.now(), antwoorden: bij }
    bewaar(af)
    zetBezig(false)
  }

  if (bezig && vraag) {
    const pct = Math.round(nr / SCANVRAGEN.length * 100)
    return (
      <div>
        <div className="topbar">
          <button
            type="button" className="back"
            onClick={() => (nr === 0 ? terug() : zetNr(nr - 1))}
          >← {nr === 0 ? 'terug' : 'vorige vraag'}</button>
          <span className="pill">{nr + 1} van {SCANVRAGEN.length}</span>
        </div>
        <div className="pbar" style={{ marginBottom: 18 }}><i style={{ width: pct + '%' }} /></div>

        <div className="card">
          <h1 style={{ fontSize: 20, margin: 0 }}>{vraag.vraag}</h1>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            Er is geen goed of fout antwoord. Kies wat je echt meestal doet.
          </p>
          <div style={{ marginTop: 14 }}>
            {vraag.opties.map((tekst, i) => (
              <button
                type="button" key={i} className="scanoptie"
                onClick={() => kies(i)}
              >{tekst}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const gedaan: Scan = { tijd: scan?.tijd ?? Date.now(), antwoorden }
  const lijst = uitkomsten(gedaan)
  const a = advies(gedaan)

  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">Leerscan</span>
      </div>
      <h1 style={{ fontSize: 24 }}>🔎 Zo leer jij, {naam}</h1>

      {a.sterk && (
        <div className="card" style={{ marginTop: 12, background: '#eaf7e2', borderColor: '#bcd9a6' }}>
          <b>{a.sterk.kaart.emoji} {a.sterk.kaart.kop} — dit doe je al goed</b>
          <p style={{ margin: '6px 0 0', fontSize: 15 }}>{a.sterk.kaart.advies[2]}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 12, background: '#fff7e8', borderColor: '#f0d67a' }}>
        <b>{a.kop.kaart.emoji} Werk hier als eerste aan: {a.kop.kaart.kop.toLowerCase()}</b>
        <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.55 }}>{a.tekst}</p>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          <b>In deze app:</b> {a.inDeApp}
        </p>
      </div>

      <p className="muted" style={{ margin: '18px 0 6px', fontSize: 13 }}>
        Je hele beeld — één ding tegelijk aanpakken werkt het best, dus laat de rest even staan.
      </p>
      {lijst.map((u) => (
        <div key={u.dim} className="card" style={{ marginTop: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <b>{u.kaart.emoji} {u.kaart.kop}</b>
            <span className="muted" style={{ fontSize: 12 }}>{bandNaam(u.band)}</span>
          </div>
          <div className="pbar" style={{ marginTop: 6 }}>
            <i style={{ width: Math.round(u.punten / 6 * 100) + '%' }} />
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{u.kaart.wat}</div>
        </div>
      ))}

      <div className="center" style={{ marginTop: 18 }}>
        <button
          type="button" className="btn ghost"
          onClick={() => { zetAntwoorden({}); zetNr(0); zetBezig(true) }}
        >Opnieuw invullen</button>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <b>Waarom deze vijf?</b>
        <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          Dit is geen test die zegt wat voor type je bent. Het idee dat de één een
          &ldquo;beeldleerder&rdquo; is en de ander een &ldquo;luisteraar&rdquo; klinkt logisch,
          maar het is onderzocht en het klopt niet: je leert niet beter als de uitleg bij je
          voorkeur past. Wat wél verschil maakt is wát je doet — en dat kun je veranderen.
        </p>
        {DIMENSIES.map((d) => (
          <div key={d.dim} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 600 }}>{d.emoji} {d.kop}</div>
            <div className="muted" style={{ fontSize: 13 }}>{d.waarom}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
