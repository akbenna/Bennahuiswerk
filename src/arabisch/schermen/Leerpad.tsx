/**
 * LEERPAD — de kaart van wat je hebt doorgewerkt
 *
 * Bij een kind gaat het over punten en veroverde letters; bij een volwassene
 * over de stappen zelf. Dezelfde voortgang, andere maat.
 */
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import { SPOORLEEFTIJD, SPOORNAAM } from '../leerplan'
import { datumNL, plusDagen } from '../datum'
import { Balk, Rijk } from '../onderdelen'
import { soortNaam } from '../inhoud'

export function Leerpad(
  { t, openStap }: { t: Toestand; openStap: (i: number) => void },
): ReactNode {
  const p = t.profiel
  if (!p) return null
  const totaal = t.pad.length
  const af = p.blok
  const pct = totaal ? Math.round(af / totaal * 100) : 0
  const veroverd = Object.keys(p.letters).filter((l) => (p.letters[l] ?? 0) >= 3).length

  return (
    <div className="wrap">
      <h1>Leerpad</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        {SPOORNAAM[p.spoor]} · {SPOORLEEFTIJD[p.spoor]}
      </p>

      <div className="kaart" style={{ marginTop: 14 }}>
        <div className="rij tussen">
          <b>{af} van {totaal} stappen</b>
          <span className="muted small">{pct}%</span>
        </div>
        <Balk pct={pct} style={{ marginTop: 8 }} />
        {t.kind
          ? (
            <div className="rij" style={{ marginTop: 12 }}>
              <span className="vlag warmv">{p.punten} punten</span>
              <span className="vlag acc">{veroverd} van 28 letters veroverd</span>
            </div>
            )
          : (
            <>
              <div className="kaartkaart">
                {t.pad.map((b, i) => (
                  <i key={i} className={i < af ? 'af' : i === af ? 'nu' : ''} title={b.titel} />
                ))}
              </div>
              <p className="klein muted" style={{ marginTop: 8 }}>
                Elk vakje is één stap. Dit is de kaart van wat je hebt doorgewerkt.
              </p>
            </>
            )}
      </div>

      <div className="kaart" style={{ marginTop: 14, padding: '6px 16px' }}>
        {t.pad.map((b, i) => (
          <button
            type="button" key={i} onClick={() => openStap(i)}
            className={'padrij ' + (i < af ? 'af' : i === af ? 'nu' : '')}
          >
            <span className="padmerk">{i < af ? '✓' : i + 1}</span>
            <span className="pt">
              <Rijk als="b" html={b.titel} />
              <span>
                {soortNaam(b.k)}
                {i >= af && ' · ' + datumNL(plusDagen(t.dag, i - af))}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="klein muted" style={{ marginTop: 12 }}>
        Je kunt een afgeronde stap opnieuw bekijken door erop te tikken.
      </p>
    </div>
  )
}
