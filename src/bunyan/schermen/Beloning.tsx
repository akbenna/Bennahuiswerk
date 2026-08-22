/**
 * BELONING — punten voor wat je leert, geld voor wat je afmaakt
 *
 * Het weekplafond staat er zodat een goede week niet in een salaris verandert.
 * Als het budget op is lopen de punten, de rangen en de insignes gewoon door —
 * anders zou leren stoppen zodra het geld stopt, en dat is precies de verkeerde
 * les om een kind van elf mee te geven.
 */
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { INSIGNES, RANGEN, XP, rangVan, volgendeRang } from '../voortgang'
import type { Stand } from '../opslag'
import { Balk, Cijfer } from '../onderdelen'

export function Beloning({ stand }: { stand: Stand }): ReactNode {
  const rang = rangVan(stand.punten)
  const volg = volgendeRang(stand.punten)
  const naarVolg = volg ? Math.round((stand.punten - rang[0]) / (volg[0] - rang[0]) * 100) : 100

  const regels: Array<[string, string]> = [
    ['Een gewone les afmaken', `${euro(stand.instel.tariefLes)} · ${XP.les} punten`],
    ['Een project afmaken', `${euro(stand.instel.tariefProject)} · ${XP.project} punten`],
    ['Alle vragen in één keer goed', `geen geld · ${XP.perfect} punten erbij`],
    ['Een les nog eens doen', 'geen geld · oefenen mag altijd'],
  ]

  return (
    <>
      <div>
        <h1>Beloning</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          Punten voor wat je leert, geld voor wat je afmaakt.
        </p>
      </div>

      <div className="card kleur">
        <div className="rij tussen">
          <div>
            <p className="meta">Je rang</p>
            <p className="cijfer" style={{ marginTop: 2 }}>{rang[2]} {rang[1]}</p>
            <p className="klein">{rang[3]}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="meta">Punten</p>
            <p className="cijfer">{stand.punten}</p>
          </div>
        </div>
        <div style={{ marginTop: 14 }}><Balk p={naarVolg} /></div>
        <p className="klein" style={{ marginTop: 8 }}>
          {volg
            ? `Nog ${volg[0] - stand.punten} punten tot ${volg[2]} ${volg[1]}.`
            : 'Je hebt de hoogste rang. Er valt hier weinig meer te halen — tijd voor eigen projecten.'}
        </p>
      </div>

      <div className="grid g3">
        <Cijfer kop="Spaarpot" waarde={euro(stand.saldo)} kleur="var(--goed)" onder="nog niet uitbetaald" />
        <div className="card">
          <p className="meta">Deze week</p>
          <p className="cijfer">{euro(stand.week.verdiend)}</p>
          <p className="klein">van {euro(stand.instel.weekbudget)}</p>
          <Balk p={stand.week.verdiend / (stand.instel.weekbudget || 6) * 100} />
        </div>
        <Cijfer
          kop="Dagen op rij" waarde={stand.reeks}
          onder={stand.reeks >= 7 ? 'sterk' : 'zeven is het eerste doel'}
        />
      </div>

      <div className="card">
        <h3>Wat levert wat op</h3>
        <div className="stack" style={{ marginTop: 10 }}>
          {regels.map(([wat, hoeveel]) => (
            <div
              className="rij tussen"
              key={wat}
              style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}
            >
              <span>{wat}</span><span className="klein">{hoeveel}</span>
            </div>
          ))}
        </div>
        <p className="klein" style={{ marginTop: 12 }}>
          Er kan hoogstens {euro(stand.instel.weekbudget)} per week bij. Daarna blijf je punten
          en insignes verdienen — leren stopt niet als het geld stopt.
        </p>
      </div>

      <div className="card">
        <h3>Insignes</h3>
        <div className="grid g2" style={{ marginTop: 12 }}>
          {INSIGNES.map((i) => {
            const heb = stand.insignes.includes(i.id)
            return (
              <div className={`insigne${heb ? '' : ' uit'}`} key={i.id}>
                <span className="ico">{heb ? i.ico : '🔒'}</span>
                <div><b>{i.n}</b><span>{i.u}</span></div>
              </div>
            )
          })}
        </div>
        <p className="klein" style={{ marginTop: 12 }}>
          {stand.insignes.length} van de {INSIGNES.length} gehaald.
        </p>
      </div>

      <div className="card">
        <h3>Alle rangen</h3>
        <div className="stack" style={{ marginTop: 10 }}>
          {RANGEN.map((r) => (
            <div
              className="rij tussen"
              key={r[0]}
              style={r === rang
                ? { padding: '6px 0', fontWeight: 600 }
                : { padding: '6px 0', opacity: stand.punten >= r[0] ? 1 : 0.5 }}
            >
              <span>{r[2]} {r[1]}</span><span className="klein">{r[0]} punten</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
