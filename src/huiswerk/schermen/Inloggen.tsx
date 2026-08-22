/**
 * INLOGGEN — het kind meldt zich aan op zijn eigen account
 *
 * De scores volgen het kind en niet het toestel, dus er hoort een aanmelding
 * bij. Maar een kind van acht dat op de bank zit met de tablet mag daar niet op
 * stuklopen: klopt het wachtwoord dat hier bekend is, dan gaat de app gewoon
 * open ook als er geen verbinding is. De centrale stand wordt dan later
 * bijgetrokken.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN } from '../gegevens/profielen'
import type { Stand } from '../opslag'
import { accountVan, kindWachtwoord, wachtwoordGelijk } from '../wolk'
import { STANDAARD_WACHTWOORD } from '../wolk'

export interface InloggenProps {
  pid: string
  stand: Stand
  terug: () => void
  /** Meldt aan bij de centrale opslag. Gooit bij een fout wachtwoord. */
  aanmelden: (pid: string, code: string, pw: string) => Promise<void>
  ok: () => void
}

export function Inloggen({ pid, stand, terug, aanmelden, ok }: InloggenProps): ReactNode {
  const P = PROFIELEN[pid] ?? { naam: '', emoji: '🔒', kleur: '#5EA03A' }
  const acc = accountVan(stand, pid)
  const [pw, zetPw] = useState('')
  const [melding, zetMelding] = useState('')
  const [bezig, zetBezig] = useState(false)
  const veld = useRef<HTMLInputElement>(null)

  useEffect(() => { veld.current?.focus() }, [])

  async function probeer(): Promise<void> {
    const hierOk = wachtwoordGelijk(pw, kindWachtwoord(stand, pid))
      || wachtwoordGelijk(pw, acc.pw)
    zetBezig(true)
    try {
      await aanmelden(pid, acc.code, pw)
      zetBezig(false)
      ok()
    } catch (e) {
      zetBezig(false)
      /* Geen verbinding, maar het wachtwoord dat hier bekend is klopt: dan mag
         er gewoon geoefend worden. */
      if (hierOk) { ok(); return }
      zetMelding(/pincode|wachtwoord/i.test((e as Error).message ?? '')
        ? 'Onjuist wachtwoord.'
        : 'Geen verbinding — probeer opnieuw.')
      zetPw('')
      setTimeout(() => zetMelding(''), 2200)
    }
  }

  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">Inloggen</span>
      </div>
      <div className="card center" style={{ marginTop: 20, background: P.kleur, color: '#fff' }}>
        <div style={{ fontSize: 46 }}>{P.emoji}</div>
        <h2 style={{ color: '#fff' }}>Hoi {P.naam}!</h2>
        <p style={{ opacity: .95 }}>Log in op je eigen account</p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <input
          ref={veld} className="f" type="password" value={pw} placeholder="wachtwoord"
          onChange={(e) => zetPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void probeer() }}
        />
        {melding && (
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>{melding}</div>
        )}
        <div className="center" style={{ marginTop: 12 }}>
          <button type="button" className="btn" disabled={bezig} onClick={() => void probeer()}>
            {bezig ? 'Bezig…' : 'Start 🚀'}
          </button>
        </div>
        <p className="muted center" style={{ fontSize: 12, marginTop: 8 }}>
          Log in met je naam + wachtwoord <b>{STANDAARD_WACHTWOORD}</b>. Je scores staan op je
          account — op elk toestel gelijk.
        </p>
      </div>
    </div>
  )
}
