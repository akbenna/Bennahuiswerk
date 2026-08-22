/**
 * JAARPLAN — zesendertig weken, anderhalf uur per week
 *
 * Het loopt cumulatief: wat je in week drie leert komt in week twintig nog
 * terug. Waar het programma begint bepaalt de niveaubepaling, niet de leeftijd
 * — wie de eerste letters al kent hoeft die niet nog eens.
 */
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import { BLOKKEN, JAAR, SESSIE, SESSIEMINUTEN } from '../gegevens/jaarplan'
import { blokVan, weekVan } from '../leerplan'
import { Balk } from '../onderdelen'

export const sessiesGedaan = (s: Record<string, unknown>): number => Object.keys(s).length

export function Jaarplan(
  { t, doeMeting, doeLes, doeWerkblad, doeToets, kiesWeek }:
  { t: Toestand; doeMeting: () => void; doeLes: (w: number) => void
    doeWerkblad: (w: number) => void; doeToets: (b: number) => void; kiesWeek: (w: number) => void },
): ReactNode {
  const p = t.profiel
  if (!p) return <div className="wrap"><div className="kaart">Kies eerst een profiel.</div></div>

  const j = p.jaar
  if (!j) {
    return (
      <div className="wrap">
        <h1>Jaarplan</h1>
        <div className="kaart" style={{ marginTop: 14 }}>
          <p>
            Een jaar Arabisch, zesendertig weken lang, één vast moment per week van{' '}
            {SESSIEMINUTEN} minuten. Elke les heeft dezelfde opbouw: herhalen, nieuwe letters,
            lezen, schrijven, en een stuk geloof dat aansluit op het woord van die week.
          </p>
          <p>
            Het loopt cumulatief: wat je in week drie leert, komt in week twintig nog terug. Aan
            het eind lees je al-Fatiha en de korte soera&apos;s van het blad.
          </p>
          <p>
            We beginnen met een korte niveaubepaling van achttien vragen. Die bepaalt niet wie
            het knapst is, maar op welke week jouw programma begint — wie de eerste letters al
            kent, hoeft die niet nog eens.
          </p>
          <div className="rij" style={{ marginTop: 14 }}>
            <button type="button" className="k vol" onClick={doeMeting}>Doe de niveaubepaling</button>
          </div>
        </div>
      </div>
    )
  }

  const w = weekVan(j.week) ?? JAAR[JAAR.length - 1]
  const blok = blokVan(j.week)
  const af = sessiesGedaan(j.sessies)
  const pct = Math.round(af / JAAR.length * 100)
  const klaar = !!j.sessies[String(j.week)]
  if (!w) return null

  return (
    <div className="wrap">
      <h1>Jaarplan</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        Zesendertig weken van {SESSIEMINUTEN} minuten. Lezen en schrijven, met elke week een stuk
        geloof erbij.
      </p>

      <div className="kaart" style={{ marginTop: 14 }}>
        <div className="rij tussen">
          <b>Week {j.week} van {JAAR.length}</b>
          <span className="muted small">{af} {af === 1 ? 'les' : 'lessen'} gedaan · {pct}%</span>
        </div>
        <Balk pct={pct} style={{ marginTop: 8 }} />
        <p className="klein muted" style={{ marginTop: 8 }}>
          {blok ? `Blok ${blok.n} — ${blok.t}` : ''}
        </p>
      </div>

      <div className="kaart" style={{ marginTop: 14 }}>
        <span className="label">De les van deze week</span>
        <h2 style={{ margin: '6px 0 2px' }}>{w.t}</h2>
        <p className="small" style={{ margin: '0 0 10px' }}>{w.doel}</p>
        {(w.letters ?? []).length > 0 && (
          <div className="rij" style={{ marginBottom: 10 }}>
            {(w.letters ?? []).map((l) => (
              <span className="ar" style={{ fontSize: '2rem' }} key={l}>{l}</span>
            ))}
          </div>
        )}
        <div className="rij">
          {klaar && <span className="vlag acc">Deze week is afgerond</span>}
          <button type="button" className="k vol" onClick={() => doeLes(j.week)}>
            {klaar ? 'Nog een keer doen' : 'Begin de les'}
          </button>
          <button type="button" className="k rand" onClick={() => doeWerkblad(j.week)}>
            Werkblad afdrukken
          </button>
          {w.toets && (
            <button type="button" className="k rand" onClick={() => doeToets(w.toets as number)}>
              Toets van blok {w.toets}
            </button>
          )}
        </div>
      </div>

      <h3 style={{ margin: '22px 0 8px' }}>Het hele jaar</h3>
      {BLOKKEN.map((b) => {
        const gemaakt = j.toetsen[String(b.n)]
        return (
          <div className="kaart" style={{ marginTop: 10 }} key={b.n}>
            <div className="rij tussen">
              <b>Blok {b.n} — {b.t}</b>
              {gemaakt && <span className="vlag acc">toets {gemaakt.score}/{gemaakt.totaal}</span>}
            </div>
            <p className="klein muted" style={{ margin: '2px 0 8px' }}>{b.u}</p>
            <div className="rij" style={{ gap: 6 }}>
              {JAAR.filter((x) => x.n >= b.weken[0] && x.n <= b.weken[1]).map((x) => {
                const gedaan = !!j.sessies[String(x.n)]
                const nu = x.n === j.week
                /* De knop van de huidige week is gevuld maar mag niet uitrekken:
                   .vol is elders een knop over de volle breedte. */
                return (
                  <button
                    type="button" key={x.n} className={nu ? 'k rand vol' : 'k rand'}
                    title={`Week ${x.n} — ${x.t}`}
                    onClick={() => kiesWeek(x.n)}
                    style={{
                      display: 'inline-block', width: 'auto', padding: '6px 10px', fontSize: '.82rem',
                      ...(gedaan && !nu ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}),
                    }}
                  >{gedaan ? '✓ ' : ''}{x.n}</button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="kaart" style={{ marginTop: 14 }}>
        <span className="label">Hoe een les eruitziet</span>
        <div style={{ marginTop: 8 }}>
          {SESSIE.map((st) => (
            <div
              className="rij tussen" key={st.id}
              style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}
            >
              <span>{st.t}</span><span className="muted small">{st.min} min</span>
            </div>
          ))}
        </div>
        <p className="klein muted" style={{ marginTop: 10 }}>
          Samen {SESSIEMINUTEN} minuten. Zaterdag of zondag werkt het beste: één vast moment per
          week is meer waard dan elke dag een beetje.
        </p>
      </div>
    </div>
  )
}
