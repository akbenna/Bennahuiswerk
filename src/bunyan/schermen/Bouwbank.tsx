/**
 * DE BOUWBANK — een pc samenstellen binnen een budget
 *
 * Het punt is niet dat er een lijstje onderdelen uitkomt maar dat de vijf
 * controles zichtbaar worden: past het voetje, past het geheugen, past het bord
 * in de kast, past de kaart in de kast, en levert de voeding genoeg. Wie die
 * vijf kan nalopen bestelt een pc zonder dat er iets terug moet.
 */
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import {
  DEELNAMEN, DELEN, GAMES, SCHERMEN, SOORTEN,
  bouwFouten, bouwPrijs, bouwWatt, deelById, fpsVan,
} from '../bouwbank'
import type { Bouwstand } from '../bouwbank'
import type { Soortdeel } from '../gegevens/soorten'
import type { Stand } from '../opslag'
import { Cijfer, Melding, Tag } from '../onderdelen'

const BUDGETTEN = [600, 750, 900, 1200, 1600, 2500]

interface Props {
  bouw: Bouwstand
  zetBouw: (b: Bouwstand) => void
  stand: Stand
  nu: string
  bewaar: (naam: string, gemiddeld: number) => string
  bericht: string
  naarWerkbank: () => void
}

export function Bouwbank({
  bouw, zetBouw, stand, nu, bewaar, bericht, naarWerkbank,
}: Props): ReactNode {
  const prijs = bouwPrijs(bouw)
  const fouten = bouwFouten(bouw)
  const hard = fouten.filter((f) => f.hard)
  const compleet = SOORTEN.every((s) => bouw[s])
  const psu = deelById('psu', bouw.psu)

  const kies = (s: Soortdeel, id: string): void =>
    zetBouw({ ...bouw, [s]: bouw[s] === id ? undefined : id })

  return (
    <>
      <div className="rij tussen">
        <div>
          <h1>De bouwbank</h1>
          <p className="klein" style={{ marginTop: 5 }}>
            Kies onderdelen die bij elkaar passen en kijk wat je pc haalt.
          </p>
        </div>
        <button className="btn ghost sm" onClick={naarWerkbank}>Terug naar de werkbank</button>
      </div>

      <div className="grid g3">
        <Cijfer
          kop="Totaal" waarde={euro(prijs)}
          kleur={prijs > bouw.budget ? 'var(--fout)' : 'var(--ink)'}
          onder={`budget ${euro(bouw.budget)}`}
        />
        <Cijfer
          kop="Stroom"
          waarde={<>{bouwWatt(bouw)}<span style={{ fontSize: '.9rem' }}> W</span></>}
          onder={psu ? `voeding levert ${psu.watt} W` : 'nog geen voeding'}
        />
        <Cijfer
          kop="Past het"
          waarde={hard.length ? `${hard.length} ✕` : compleet ? '✓' : '—'}
          kleur={hard.length ? 'var(--fout)' : compleet ? 'var(--goed)' : 'var(--muted)'}
          onder={hard.length ? 'los dit eerst op' : compleet ? 'alles klopt' : 'nog niet compleet'}
        />
      </div>

      <div className="card">
        <div className="rij tussen"><h3>Instellingen</h3></div>
        <div className="grid g2" style={{ marginTop: 6 }}>
          <label className="veld">
            <span>Budget</span>
            <select value={bouw.budget} onChange={(e) => zetBouw({ ...bouw, budget: +e.target.value })}>
              {BUDGETTEN.map((b) => <option key={b} value={b}>{euro(b)}</option>)}
            </select>
          </label>
          <label className="veld">
            <span>Scherm</span>
            <select value={bouw.scherm} onChange={(e) => zetBouw({ ...bouw, scherm: e.target.value })}>
              {SCHERMEN.map((s) => <option key={s.id} value={s.id}>{s.n}</option>)}
            </select>
          </label>
        </div>
      </div>

      {SOORTEN.map((soort) => {
        const gekozen = deelById(soort, bouw[soort])
        return (
          <div className="card" key={soort}>
            <div className="rij tussen">
              <h3>{DEELNAMEN[soort]}</h3>
              {gekozen ? <Tag soort="k">{gekozen.n}</Tag> : <Tag>nog niets</Tag>}
            </div>
            <div className="stack" style={{ marginTop: 10 }}>
              {DELEN[soort].map((d) => (
                <button
                  key={d.id}
                  className={`deel${bouw[soort] === d.id ? ' gekozen' : ''}`}
                  onClick={() => kies(soort, d.id)}
                >
                  <span className="ico">{d.ico}</span>
                  <span className="tt"><b>{d.n}</b><span>{d.d}</span></span>
                  <span className="prijs">{d.prijs ? euro(d.prijs) : '—'}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {fouten.length > 0 && (
        <div className="card">
          <h3>Wat er nog niet klopt</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {fouten.map((f, i) => (
              <div className={`kader ${f.hard ? 'fout' : 'let'}`} key={i}>
                <p className="klein">{f.z}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {compleet && hard.length === 0 && (
        <Uitslag {...{ bouw, stand, nu, bewaar, bericht, zetBouw }} />
      )}

      {stand.bouwsels.length > 0 && (
        <div className="card">
          <h3>Je bewaarde bouwen</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {stand.bouwsels.slice().reverse().map((b) => (
              <div className="card plat" key={b.id}>
                <div className="rij tussen">
                  <div>
                    <b>{b.naam}</b>
                    <div className="klein">{b.d}</div>
                  </div>
                  <button
                    className="btn ghost sm"
                    onClick={() => zetBouw({ ...bouw, ...b.delen })}
                  >Openen</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Uitslag({
  bouw, nu, bewaar, bericht, zetBouw,
}: Pick<Props, 'bouw' | 'nu' | 'bewaar' | 'bericht' | 'zetBouw'> & { stand: Stand }): ReactNode {
  const scherm = SCHERMEN.find((s) => s.id === bouw.scherm) ?? SCHERMEN[0]
  const fps = GAMES.map((g) => ({ g, f: fpsVan(bouw, g, bouw.scherm) ?? 0 }))
  const gemiddeld = Math.round(fps.reduce((n, x) => n + x.f, 0) / fps.length)

  return (
    <div className="card kleur">
      <h3>Wat haalt hij</h3>
      <p className="klein" style={{ marginTop: 6 }}>
        Geschat op {scherm?.n}, hoge instellingen. Een schatting om mee te kiezen, geen belofte.
      </p>
      <div className="stack" style={{ marginTop: 12 }}>
        {fps.map(({ g, f }) => {
          const kleur = f >= 100 ? 'var(--goed)' : f >= 60 ? 'var(--k)' : f >= 30 ? 'var(--let)' : 'var(--fout)'
          return (
            <div className="meter" key={g.id}>
              <span style={{ minWidth: 132 }}>{g.ico} {g.n}</span>
              <span className="staaf">
                <i style={{ width: `${Math.min(100, f / 144 * 100)}%`, background: kleur }} />
              </span>
              <span className="w" style={{ color: kleur }}>{f} fps</span>
            </div>
          )
        })}
      </div>
      <div className="rij" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => bewaar('Bouw van ' + nu, gemiddeld)}>
          Deze bouw bewaren
        </button>
        <button
          className="btn ghost"
          onClick={() => zetBouw({ budget: bouw.budget, scherm: bouw.scherm })}
        >Opnieuw beginnen</button>
      </div>
      <Melding tekst={bericht} soort="goed" />
    </div>
  )
}
