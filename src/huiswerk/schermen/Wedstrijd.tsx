/**
 * WEDSTRIJD — één vriend uitdagen via een link
 *
 * Beide spelers krijgen exact dezelfde tien vragen; de sjablonen krijgen hun
 * getallen dus één keer, bij het maken. Meeste goed wint, bij gelijkspel de
 * snelste tijd.
 *
 * Er gaat bewust niets persoonlijks de deur uit: een verzonnen code, tien
 * sommen en twee scores. Geen namen die iets zeggen, geen account, geen
 * toestemming nodig.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN } from '../gegevens/profielen'
import type { Kaart, Toeval } from '../gegevens/soorten'
import { antwoordKlopt, norm } from '../nakijken'
import { speel } from '../geluid'
import { Regels } from '../onderdelen'
import {
  bouwWedstrijd, wedstrijdCode, wedstrijdHalen, wedstrijdInsturen, wedstrijdLink,
  wedstrijdMaken, winnaar,
} from '../wedstrijd'
import type { Uitslag, Wedstrijd as Partij, Wedstrijdvraag } from '../wedstrijd'

interface QuizProps {
  vragen: Wedstrijdvraag[]
  geluid: boolean
  klaar: (r: { correct: number; secs: number }) => void
}

function Quiz({ vragen, geluid, klaar }: QuizProps): ReactNode {
  const [n, zetN] = useState(0)
  const [val, zetVal] = useState('')
  const [goed, zetGoed] = useState(0)
  const [start] = useState(() => Date.now())
  const [flits, zetFlits] = useState<'goed' | 'fout' | null>(null)
  const veld = useRef<HTMLInputElement>(null)
  const v = vragen[n]

  useEffect(() => {
    zetVal('')
    veld.current?.focus()
  }, [n])

  function na(ok: boolean): void {
    zetFlits(ok ? 'goed' : 'fout')
    speel(ok ? 'goed' : 'fout', geluid)
    const ng = goed + (ok ? 1 : 0)
    zetGoed(ng)
    setTimeout(() => {
      zetFlits(null)
      if (n + 1 >= vragen.length) klaar({ correct: ng, secs: Math.round((Date.now() - start) / 1000) })
      else zetN(n + 1)
    }, 500)
  }

  if (!v) return null
  const nakijken = (): void => {
    if (flits) return
    na(antwoordKlopt({ a: v.a, alt: v.alt ?? undefined }, val))
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="pill">Vraag {n + 1} / {vragen.length}</span>
        <span className="muted" style={{ fontSize: 13 }}>{v.t} · goed: {goed}</span>
      </div>
      <div className="pbar" style={{ marginBottom: 12 }}>
        <i style={{ width: Math.round(n / vragen.length * 100) + '%' }} />
      </div>
      <Regels className="qbox" tekst={v.q} />
      {v.opties
        ? (
          <div className="optiegrid">
            {v.opties.map((opt, i) => (
              <button
                type="button" key={i} disabled={!!flits}
                className={'optiebtn' + (norm(val) === norm(opt) ? ' sel' : '')}
                onClick={() => zetVal(opt)}
              >{opt}</button>
            ))}
          </div>
          )
        : (
          <div className="answerrow">
            <input
              ref={veld} value={val} placeholder="jouw antwoord" disabled={!!flits} inputMode="text"
              onChange={(e) => zetVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') nakijken() }}
            />
            {v.u && <div className="unit">{v.u}</div>}
          </div>
          )}
      {flits === 'goed' && <div className="feedback ok">✅ Goed!</div>}
      {flits === 'fout' && (
        <div className="feedback no">❌ Het was: <b>{v.a} {v.u}</b></div>
      )}
      <div className="center" style={{ marginTop: 14 }}>
        <button type="button" className="btn" disabled={!!flits} onClick={nakijken}>Nakijken →</button>
      </div>
    </div>
  )
}

function Score(
  { maker, vriend, totaal }: { maker: Uitslag; vriend: Uitslag | null; totaal: number },
): ReactNode {
  const w = winnaar(maker, vriend)
  return (
    <div className="card center" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 44 }}>{w === 'gelijk' ? '🤝' : '🏆'}</div>
      <h2>
        {!vriend ? 'Nog geen tegenstander'
          : w === 'gelijk' ? 'Gelijkspel!'
            : w === 'vriend' ? (vriend.naam || 'Je vriend') + ' wint!'
              : (maker.naam || 'De maker') + ' wint!'}
      </h2>
      <div className="wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
        <div className="card" style={{ minWidth: 120 }}>
          <b>{maker.naam || 'Maker'}</b>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{maker.correct}/{totaal}</div>
          <div className="muted" style={{ fontSize: 12 }}>{maker.secs}s</div>
        </div>
        {vriend && (
          <div className="card" style={{ minWidth: 120 }}>
            <b>{vriend.naam || 'Vriend'}</b>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{vriend.correct}/{totaal}</div>
            <div className="muted" style={{ fontSize: 12 }}>{vriend.secs}s</div>
          </div>
        )}
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
        Meeste goed wint; bij gelijkspel telt de snelste tijd.
      </p>
    </div>
  )
}

export function WedstrijdMaken(
  { pid, alle, toeval, geluid, terug }:
  { pid: string; alle: Kaart[]; toeval: Toeval; geluid: boolean; terug: () => void },
): ReactNode {
  const naam = PROFIELEN[pid]?.naam ?? ''
  const [fase, zetFase] = useState<'intro' | 'spelen' | 'delen'>('intro')
  const [vragen] = useState(() => bouwWedstrijd(pid, alle, toeval))
  const [code] = useState(() => wedstrijdCode(toeval))
  const [mijn, zetMijn] = useState<Uitslag | null>(null)
  const [vriend, zetVriend] = useState<Uitslag | null>(null)
  const [fout, zetFout] = useState('')
  const [kopie, zetKopie] = useState(false)
  const link = wedstrijdLink(code)

  async function klaar(r: { correct: number; secs: number }): Promise<void> {
    const maker: Uitslag = { naam, correct: r.correct, secs: r.secs }
    zetMijn(maker)
    zetFase('delen')
    try {
      await wedstrijdMaken(code, { naam, vragen, maker })
    } catch {
      zetFout('Kon de wedstrijd niet online zetten. Controleer internet en probeer opnieuw.')
    }
  }

  async function ververs(): Promise<void> {
    try {
      const r = await wedstrijdHalen(code)
      if (r?.vriend) zetVriend(r.vriend)
      else zetFout('Je vriend heeft nog niet gespeeld.')
    } catch (e) {
      zetFout('Kon niet ophalen: ' + ((e as Error).message ?? ''))
    }
    setTimeout(() => zetFout(''), 2500)
  }

  function kopieer(): void {
    void navigator.clipboard?.writeText(link).then(() => {
      zetKopie(true)
      setTimeout(() => zetKopie(false), 1500)
    }).catch(() => { /* een browser die het weigert: de link staat gewoon in beeld */ })
  }

  if (fase === 'spelen') {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={() => zetFase('intro')}>← terug</button>
          <span className="pill">⚔️ Jouw ronde</span>
        </div>
        <Quiz vragen={vragen} geluid={geluid} klaar={(r) => void klaar(r)} />
      </div>
    )
  }

  if (fase === 'delen' && mijn) {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={terug}>← terug</button>
          <span className="pill">⚔️ Wedstrijd</span>
        </div>
        <div className="card center">
          <div style={{ fontSize: 40 }}>🎯</div>
          <h2>Jij had {mijn.correct}/{vragen.length} goed in {mijn.secs}s</h2>
          <p className="muted">Stuur de link naar één vriend. Jullie spelen dezelfde vragen!</p>
          <div className="card" style={{ marginTop: 8, wordBreak: 'break-all', fontSize: 13 }}>{link}</div>
          <div className="wrap center" style={{ marginTop: 10 }}>
            <button type="button" className="btn" onClick={kopieer}>
              {kopie ? 'Gekopieerd ✓' : '📋 Kopieer link'}
            </button>
            <button type="button" className="btn ghost" onClick={() => void ververs()}>
              🔄 Uitslag ophalen
            </button>
          </div>
          {fout && (
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8, fontSize: 13 }}>
              {fout}
            </div>
          )}
        </div>
        {vriend && <Score maker={mijn} vriend={vriend} totaal={vragen.length} />}
      </div>
    )
  }

  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← terug</button>
        <span className="pill">⚔️ Wedstrijd</span>
      </div>
      <div className="card center">
        <div style={{ fontSize: 44 }}>⚔️</div>
        <h2>Daag een vriend uit!</h2>
        <p className="muted">
          Jij speelt {vragen.length} vragen op jouw niveau. Daarna krijg je een link voor <b>één</b>
          {' '}vriend om dezelfde vragen te doen. Wie heeft de meeste goed?
        </p>
        <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          Veilig: het is alleen een spelletje, zonder persoonlijke gegevens.
        </p>
        <button
          type="button" className="btn" style={{ marginTop: 10 }}
          disabled={vragen.length === 0} onClick={() => zetFase('spelen')}
        >Start jouw ronde 🚀</button>
      </div>
    </div>
  )
}

export function WedstrijdSpelen(
  { code, geluid, terug }: { code: string; geluid: boolean; terug: () => void },
): ReactNode {
  const [fase, zetFase] = useState<'laden' | 'naam' | 'spelen' | 'uitslag' | 'fout'>('laden')
  const [partij, zetPartij] = useState<Partij | null>(null)
  const [naam, zetNaam] = useState('')
  const [vriend, zetVriend] = useState<Uitslag | null>(null)
  const [fout, zetFout] = useState('')

  useEffect(() => {
    let leeft = true
    wedstrijdHalen(code).then((r) => {
      if (!leeft) return
      if (!r) { zetFout('Uitdaging niet gevonden.'); zetFase('fout'); return }
      zetPartij(r)
      if (r.vriend) { zetVriend(r.vriend); zetFase('uitslag') } else zetFase('naam')
    }).catch((e: Error) => {
      if (!leeft) return
      zetFout(e.message || 'Uitdaging niet gevonden.')
      zetFase('fout')
    })
    return () => { leeft = false }
  }, [code])

  const vragen = partij?.vragen ?? []
  const maker = partij ? { ...partij.maker, naam: partij.maker.naam || partij.naam } : null

  async function klaar(r: { correct: number; secs: number }): Promise<void> {
    const f: Uitslag = { naam: naam.trim() || 'Vriend', correct: r.correct, secs: r.secs }
    try {
      await wedstrijdInsturen(code, f)
      zetVriend(f)
      zetFase('uitslag')
    } catch (e) {
      zetFout('Kon je uitslag niet opslaan: ' + ((e as Error).message ?? ''))
      zetFase('fout')
    }
  }

  if (fase === 'laden') {
    return <div className="card center" style={{ marginTop: 40 }}>⏳ Wedstrijd laden…</div>
  }
  if (fase === 'fout' || !maker) {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={terug}>← naar start</button>
        </div>
        <div className="card center" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 40 }}>😕</div>
          <p>{fout || 'Uitdaging niet gevonden.'}</p>
        </div>
      </div>
    )
  }
  if (fase === 'naam') {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={terug}>← naar start</button>
          <span className="pill">⚔️ Uitdaging</span>
        </div>
        <div className="card center">
          <div style={{ fontSize: 44 }}>⚔️</div>
          <h2>{maker.naam} daagt je uit!</h2>
          <p className="muted">Speel dezelfde {vragen.length} vragen. Wie heeft de meeste goed?</p>
          <input
            className="f" style={{ maxWidth: 220, margin: '12px auto' }} value={naam}
            placeholder="Jouw naam" onChange={(e) => zetNaam(e.target.value)}
          />
          <div>
            <button type="button" className="btn" onClick={() => zetFase('spelen')}>Start 🚀</button>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Veilig: alleen een spelletje, geen persoonlijke gegevens nodig.
          </p>
        </div>
      </div>
    )
  }
  if (fase === 'spelen') {
    return (
      <div>
        <div className="topbar"><span className="pill">⚔️ Jouw ronde tegen {maker.naam}</span></div>
        <Quiz vragen={vragen} geluid={geluid} klaar={(r) => void klaar(r)} />
      </div>
    )
  }
  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={terug}>← naar start</button>
        <span className="pill">⚔️ Uitslag</span>
      </div>
      <Score maker={maker} vriend={vriend} totaal={vragen.length} />
      <div className="center" style={{ marginTop: 14 }}>
        <button type="button" className="btn ghost" onClick={terug}>Naar de oefenapp →</button>
      </div>
    </div>
  )
}
