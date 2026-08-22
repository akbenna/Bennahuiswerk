/**
 * CENTRALE OPSLAG
 *
 * Met één gezinsaccount staat de voortgang van alle profielen centraal: wie op
 * de telefoon oefent gaat op de tablet verder. Zonder internet werkt de app
 * gewoon door; er wordt later samengevoegd en nooit overschreven.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'

/** Korter dan dit is geen wachtwoord maar een formaliteit. */
const MINIMUM = 4

export function Wolkvak({ t }: { t: Toestand }): ReactNode {
  const [acc, zetAcc] = useState('')
  const [pin, zetPin] = useState('')
  const [meld, zetMeld] = useState('')
  const [soort, zetSoort] = useState<'goed' | 'fout' | ''>('')
  const w = t.wolk

  const zeg = (tekst: string, s: 'goed' | 'fout' | '' = ''): void => { zetMeld(tekst); zetSoort(s) }

  const inloggen = async (): Promise<void> => {
    const a = acc.trim().toLowerCase()
    if (!a || !pin) { zeg('Vul een naam en een wachtwoord in.', 'fout'); return }
    zeg('Bezig…')
    try {
      await w.inloggen(a, pin)
      await t.gelijktrekken()
      zetPin('')
      zeg('Ingelogd en gelijkgetrokken.', 'goed')
    } catch (e) { zeg((e as Error).message, 'fout') }
  }

  const registreren = async (): Promise<void> => {
    const a = acc.trim().toLowerCase()
    if (!a || pin.length < MINIMUM) {
      zeg(`Kies een naam en een wachtwoord van minstens ${MINIMUM} tekens.`, 'fout')
      return
    }
    zeg('Bezig…')
    try {
      await w.registreren(a, pin, t.stand)
      zetPin('')
      zeg('Account aangemaakt. Wat hier al stond is meegenomen.', 'goed')
    } catch (e) { zeg((e as Error).message, 'fout') }
  }

  const nu = async (): Promise<void> => {
    zeg('Bezig…')
    const ok = await t.gelijktrekken()
    zeg(ok ? 'Gelijkgetrokken.' : 'Kon de centrale kopie niet ophalen; er is niets verloren gegaan.',
      ok ? 'goed' : 'fout')
  }

  return (
    <>
      <h3 style={{ marginTop: 22 }}>
        <span className={'wolkbol' + (w.aan ? (w.fout ? ' fout' : ' aan') : '')} />
        Centrale opslag
      </h3>
      <div className="kaart" style={{ marginTop: 10 }}>
        <p className="small muted" style={{ margin: '0 0 4px' }}>
          Met één gezinsaccount staat de voortgang van alle profielen centraal: wie op de telefoon
          oefent gaat op de tablet verder. Zonder internet werkt de app gewoon door; er wordt
          later samengevoegd en nooit overschreven.
        </p>
        {w.aan
          ? (
            <>
              <p className="small" style={{ margin: '8px 0 0' }}>Ingelogd als <b>{w.account}</b>.</p>
              <div className="rij" style={{ marginTop: 12 }}>
                <button type="button" className="k rand" disabled={w.bezig} onClick={() => void nu()}>
                  Nu gelijktrekken
                </button>
                <button
                  type="button" className="k stil"
                  onClick={() => { w.uitloggen(); zeg('Uitgelogd. De voortgang blijft op dit toestel staan.') }}
                >Uitloggen</button>
              </div>
            </>
            )
          : (
            <>
              <label className="veldje">
                <span>Naam van het account</span>
                <input
                  placeholder="benna" autoComplete="username" value={acc}
                  onChange={(e) => zetAcc(e.target.value)}
                />
              </label>
              <label className="veldje">
                <span>Wachtwoord</span>
                <input
                  type="password" placeholder={`minstens ${MINIMUM} tekens`}
                  autoComplete="current-password" value={pin}
                  onChange={(e) => zetPin(e.target.value)}
                />
              </label>
              <div className="rij" style={{ marginTop: 12 }}>
                <button type="button" className="k" disabled={w.bezig} onClick={() => void inloggen()}>
                  Inloggen
                </button>
                <button
                  type="button" className="k rand" disabled={w.bezig}
                  onClick={() => void registreren()}
                >Nieuw account</button>
              </div>
            </>
            )}
        <p
          className="small"
          style={{
            margin: '10px 0 0', minHeight: '1.2em',
            color: soort === 'fout' ? 'var(--fout)' : soort === 'goed' ? 'var(--goed)' : 'var(--muted)',
          }}
        >{meld}</p>
      </div>
    </>
  )
}
