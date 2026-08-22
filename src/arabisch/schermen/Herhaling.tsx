/**
 * HERHALING — de wachtrij en wat eraan komt
 *
 * Het staafje van veertien dagen is er om te laten zien dat een rustige dag
 * geen achterstand is maar een vooruitzicht: je ziet vooraf wanneer het druk
 * wordt en kunt daar iets mee.
 */
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import { herhalingsRij } from '../leerplan'
import { dagVerschil } from '../datum'
import { Statvak } from '../onderdelen'

/** Hoeveel dagen vooruit de staafjes kijken. */
const VOORUIT = 14

/** Een kaart geldt als "zit er goed in" vanaf een stabiliteit van een week:
 *  daaronder valt hij nog binnen een paar dagen terug. */
const RIJP = 7

export function Herhaling({ t, start }: { t: Toestand; start: () => void }): ReactNode {
  const p = t.profiel
  if (!p) return null
  const { rij, totaal, plafond } = herhalingsRij(p.kaarten, t.dag, p.dagdoel)
  const alle = Object.keys(p.kaarten).length
  const jong = Object.values(p.kaarten).filter((k) => k.s < RIJP).length

  const tel: Record<number, number> = {}
  for (const k of Object.values(p.kaarten)) {
    if (!k.due) continue
    const n = Math.max(0, dagVerschil(t.dag, k.due))
    if (n < VOORUIT) tel[n] = (tel[n] ?? 0) + 1
  }
  const max = Math.max(1, ...Object.values(tel))

  return (
    <div className="wrap">
      <h1>Herhaling</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        Gespreide herhaling met FSRS. De app rekent per kaart uit wanneer je hem waarschijnlijk
        bijna vergeten bent, en zet hem dan pas terug.
      </p>

      <div className="raster r3" style={{ marginTop: 14 }}>
        <Statvak n={totaal} wat="staan open" />
        <Statvak n={alle} wat="kaarten in totaal" />
        <Statvak n={alle - jong} wat="zitten er goed in" />
      </div>

      {rij.length
        ? (
          <>
            <button type="button" className="k vol" style={{ marginTop: 16 }} onClick={start}>
              {rij.length} herhalen
            </button>
            {totaal > plafond && (
              <p className="klein muted" style={{ marginTop: 8 }}>
                Van de {totaal} open kaarten doe je er vandaag {plafond}. De rest komt morgen.
                Het dagplafond staat in het tabblad Ouder.
              </p>
            )}
          </>
          )
        : (
          <div className="kaart mid" style={{ marginTop: 16, padding: 26 }}>
            <b>Niets te herhalen vandaag</b>
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              Dat is geen achterstand die je inhaalt maar het systeem dat werkt: kaarten komen
              terug op het moment dat het nut heeft.
            </p>
          </div>
          )}

      <hr className="regel" />
      <h3>Wat er de komende dagen aankomt</h3>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 90, marginTop: 12 }}>
        {Array.from({ length: VOORUIT }, (_, i) => {
          const n = tel[i] ?? 0
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div
                title={`${n} kaarten`}
                style={{
                  height: Math.round(n / max * 70),
                  background: i === 0 ? 'var(--warm)' : 'var(--accent)',
                  borderRadius: '3px 3px 0 0',
                  minHeight: n ? 3 : 0,
                }}
              />
              <div className="klein muted" style={{ fontSize: '.6rem', marginTop: 3 }}>
                {i === 0 ? 'nu' : i}
              </div>
            </div>
          )
        })}
      </div>
      <p className="klein muted">Aantal kaarten per dag, veertien dagen vooruit.</p>
    </div>
  )
}
