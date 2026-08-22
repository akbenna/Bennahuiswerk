/**
 * DE COCKPIT — het jaarplan van alle kinderen naast elkaar
 *
 * Wat een ouder wil weten past op één scherm: waar staat ieder kind, wanneer
 * was de laatste les, hoe gingen de toetsen, en wat komt er zaterdag.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import type { Profiel } from '../opslag'
import { JAAR, SESSIEMINUTEN } from '../gegevens/jaarplan'
import { weekVan } from '../leerplan'
import { Balk } from '../onderdelen'

const uren = (minuten: number): number => Math.round(minuten / 6) / 10

export function Cockpit(
  { t, naarTab, doeMeting, doeWerkblad }:
  { t: Toestand; naarTab: (tab: string) => void; doeMeting: () => void
    doeWerkblad: (week: number) => void },
): ReactNode {
  const [opnieuw, zetOpnieuw] = useState<string | null>(null)
  const lijst = Object.values(t.stand.profielen)
  const metJaar = lijst.filter((x) => x.jaar)

  return (
    <>
      <h3 style={{ marginTop: 22 }}>Jaarplan — de cockpit</h3>
      <p className="small muted" style={{ margin: '4px 0 0' }}>
        Zesendertig weken van {SESSIEMINUTEN} minuten per kind. Hier zie je waar iedereen staat,
        wanneer de laatste les was en hoe de toetsen gingen.
      </p>
      {lijst.length
        ? lijst.map((pr) => (
          <Rij
            key={pr.id} pr={pr} t={t} naarTab={naarTab} doeWerkblad={doeWerkblad}
            opnieuw={opnieuw === pr.id}
            vraagOpnieuw={() => zetOpnieuw(pr.id)}
            annuleer={() => zetOpnieuw(null)}
            doeMeting={() => { zetOpnieuw(null); t.kies(pr.id); naarTab('jaarplan'); doeMeting() }}
          />
          ))
        : <div className="kaart" style={{ marginTop: 10 }}>Nog geen profielen.</div>}
      {metJaar.length > 1 && (
        <p className="klein muted" style={{ marginTop: 10 }}>
          Tip: laat de kinderen tegelijk beginnen maar niet per se op dezelfde week — het
          programma is per kind. Wie verder is, helpt de ander; dat is het beste wat er is voor
          allebei.
        </p>
      )}
    </>
  )
}

function Rij(
  { pr, t, naarTab, doeWerkblad, opnieuw, vraagOpnieuw, annuleer, doeMeting }:
  { pr: Profiel; t: Toestand; naarTab: (tab: string) => void; doeWerkblad: (week: number) => void
    opnieuw: boolean; vraagOpnieuw: () => void; annuleer: () => void; doeMeting: () => void },
): ReactNode {
  const j = pr.jaar
  if (!j) {
    return (
      <div className="kaart" style={{ marginTop: 10 }}>
        <div className="rij tussen">
          <b>{pr.naam}</b><span className="muted small">nog geen jaarplan</span>
        </div>
        <p className="klein muted" style={{ margin: '6px 0 0' }}>
          Laat {pr.naam} de niveaubepaling doen onder <b>Jaarplan</b>; daarna begint het
          programma op de juiste week.
        </p>
      </div>
    )
  }

  const af = Object.keys(j.sessies).length
  const pct = Math.round(af / JAAR.length * 100)
  const w = weekVan(j.week) ?? JAAR[JAAR.length - 1]
  const laatste = Object.values(j.sessies).map((x) => x.d).sort().pop()
  const toetsen = Object.keys(j.toetsen).sort()
  const minuten = Object.values(j.sessies).reduce((n, x) => n + (x.minuten || 0), 0)

  return (
    <div className="kaart" style={{ marginTop: 10 }}>
      <div className="rij tussen">
        <b>{pr.naam}</b>
        <span className="muted small">week {j.week} van {JAAR.length} · {pct}%</span>
      </div>
      <Balk pct={pct} style={{ margin: '8px 0' }} />
      <div className="rij" style={{ gap: 16, marginTop: 8 }}>
        <span className="statvak"><b>{af}</b><span>lessen</span></span>
        <span className="statvak"><b>{uren(minuten)}</b><span>uur les</span></span>
        <span className="statvak">
          <b>{j.meting ? `${j.meting.score}/${j.meting.totaal}` : '—'}</b>
          <span>niveaubepaling</span>
        </span>
        <span className="statvak"><b>{toetsen.length}</b><span>toetsen</span></span>
      </div>
      {toetsen.length > 0 && (
        <div className="rij" style={{ marginTop: 10 }}>
          {toetsen.map((k) => {
            const x = j.toetsen[k]
            if (!x) return null
            const p2 = Math.round(x.score / x.totaal * 100)
            return (
              <span className={'vlag ' + (p2 >= 80 ? 'acc' : p2 >= 60 ? 'warmv' : '')} key={k}>
                blok {k}: {x.score}/{x.totaal}
              </span>
            )
          })}
        </div>
      )}
      <p className="klein muted" style={{ marginTop: 10 }}>
        Laatste les: {laatste ?? 'nog geen'} · hierna: <b>{w?.t}</b>{w?.toets ? ' (met toets)' : ''}
      </p>
      <div className="rij" style={{ marginTop: 10 }}>
        <button
          type="button" className="k rand"
          onClick={() => { t.kies(pr.id); naarTab('jaarplan') }}
        >Open het jaarplan</button>
        <button
          type="button" className="k rand"
          onClick={() => { t.kies(pr.id); doeWerkblad(j.week) }}
        >Werkblad van deze week</button>
        {opnieuw
          ? (
            <>
              {/* De lessen die al gedaan zijn blijven staan; alleen de startweek
                  verschuift. Dat is het waard om te vragen, niet om te melden. */}
              <span className="klein" style={{ color: 'var(--fout)' }}>
                Opnieuw meten? De gedane lessen blijven staan.
              </span>
              <button type="button" className="k klein" onClick={doeMeting}>Ja</button>
              <button type="button" className="k rand klein" onClick={annuleer}>Nee</button>
            </>
            )
          : (
            <button type="button" className="k rand" onClick={vraagOpnieuw}>Opnieuw meten</button>
            )}
      </div>
    </div>
  )
}
