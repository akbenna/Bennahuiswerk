/**
 * SPELLETJES — de speelhoek, los van de huiswerkapp.
 *
 * Even afschakelen: dertien spelletjes plus de twee grote. Vrije tijd is een
 * gunst — dus: even pauze, en daarna weer verder.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { SPELLEN } from './spellen'
import type { Spelbeschrijving } from './spellen'
import { BoterKaasEieren } from './spellen/overige'
import { EXTERN, GRAPPEN } from './gegevens'
import { useGeluid } from './geluid'
import { pak } from './toeval'
import {
  haalOud, isBeter, leeg, lees, samenvoegen, schrijf, vul,
} from './opslag'
import type { Instellingen, Stand } from './opslag'
import { useWolk } from '@/gedeeld/wolk'

export function App() {
  const [stand, zetStand] = useState<Stand>(leeg)
  const [geladen, zetGeladen] = useState(false)
  const [bezigMet, zetBezigMet] = useState<Spelbeschrijving | null>(null)
  const [uitslag, zetUitslag] = useState<{ score: number; tekst: string; nieuw: boolean } | null>(null)
  const [ronde, zetRonde] = useState(0)
  const [melding, zetMelding] = useState<{ tekst: string; soort?: 'goed' | 'fout' } | null>(null)
  const [grap] = useState(() => pak(GRAPPEN) ?? GRAPPEN[0])

  const wolk = useWolk('raha')
  const piep = useGeluid(stand.instel.geluid)

  /* De laatste stand buiten de hertekening houden, zodat het bewaren bij het
     sluiten van de pagina de nieuwste versie meestuurt. */
  const nu = useRef(stand)
  nu.current = stand

  const bewaar = useCallback((s: Stand) => {
    zetStand(s)
    schrijf(s)
    wolk.bewaar(s)
  }, [wolk])

  const gelijktrekken = useCallback(async () => {
    const ver = await wolk.ophalen()
    let s = nu.current
    if (ver && typeof ver === 'object' && 'records' in ver) {
      s = samenvoegen(s, ver as Partial<Stand>, SPELLEN)
    }
    s = { ...s, laatste: new Date().toISOString() }
    zetStand(s)
    schrijf(s)
    wolk.bewaar(s, true)
  }, [wolk])

  /* Eerste keer: van de schijf lezen, de oude records uit de huiswerkapp
     overnemen, en pas daarna gelijktrekken met wat er centraal staat. */
  useEffect(() => {
    let af = false
    void (async () => {
      const opgeslagen = vul(await lees())
      const { stand: s, overgenomen } = haalOud(opgeslagen, SPELLEN)
      if (af) return
      zetStand(s)
      zetGeladen(true)
      if (overgenomen) {
        schrijf(s)
        zetMelding({
          tekst: `${overgenomen} ${overgenomen === 1 ? 'record is' : 'records zijn'} ` +
                 'overgenomen uit de huiswerkapp.',
        })
      }
    })()
    return () => { af = true }
  }, [])

  useEffect(() => {
    if (!geladen || !wolk.aan) return
    void gelijktrekken()
    // alleen bij het openen en na het inloggen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geladen, wolk.aan])

  /* Wat er nog niet weg is, gaat mee als de pagina sluit. */
  useEffect(() => {
    const weg = () => { if (wolk.aan) wolk.bewaar(nu.current, true) }
    addEventListener('pagehide', weg)
    return () => removeEventListener('pagehide', weg)
  }, [wolk])

  const zetInstel = useCallback((i: Partial<Instellingen>) => {
    bewaar({
      ...nu.current,
      instel: { ...nu.current.instel, ...i },
      instelD: new Date().toISOString(),
    })
  }, [bewaar])

  function klaar(score: number, tekst?: string) {
    const spel = bezigMet
    if (!spel) return
    const beter = isBeter(nu.current.records[spel.id], score, spel.lager)
    piep(beter ? 'goed' : 'mis')
    bewaar({
      ...nu.current,
      records: beter ? { ...nu.current.records, [spel.id]: score } : nu.current.records,
      gespeeld: { ...nu.current.gespeeld, [spel.id]: (nu.current.gespeeld[spel.id] ?? 0) + 1 },
    })
    zetUitslag({
      score, nieuw: beter,
      tekst: tekst ?? `Je haalde ${score} ${spel.eenh}.`,
    })
  }

  const sluit = useCallback(() => { zetBezigMet(null); zetUitslag(null) }, [])

  /* Escape sluit het spel, net als in de oude app. */
  useEffect(() => {
    if (!bezigMet) return
    const opToets = (e: KeyboardEvent) => { if (e.key === 'Escape') sluit() }
    addEventListener('keydown', opToets)
    return () => removeEventListener('keydown', opToets)
  }, [bezigMet, sluit])

  const overlay = bezigMet && (() => {
    const Spel = bezigMet.Spel
    const gedeeld = {
      spel: bezigMet,
      record: stand.records[bezigMet.id],
      piep, instel: stand.instel, zetInstel,
      opKlaar: klaar,
      opnieuw: () => { zetUitslag(null); zetRonde((n) => n + 1) },
      opSluiten: sluit,
    }
    return (
      <div className="overlay on" role="dialog" aria-modal="true"
           onClick={(e) => { if (e.target === e.currentTarget) sluit() }}>
        <div className="blad">
          {uitslag ? (
            <Uitslag spel={bezigMet} uitslag={uitslag}
                     opnieuw={() => { zetUitslag(null); zetRonde((n) => n + 1) }}
                     opTerug={sluit} />
          ) : bezigMet.id === 'bke' ? (
            <BoterKaasEieren key={ronde} {...gedeeld}
              gewonnen={stand.records['bke'] ?? 0}
              opGewonnen={() => bewaar({
                ...nu.current,
                records: { ...nu.current.records, bke: (nu.current.records['bke'] ?? 0) + 1 },
                gespeeld: { ...nu.current.gespeeld, bke: (nu.current.gespeeld['bke'] ?? 0) + 1 },
              })} />
          ) : (
            <Spel key={ronde} {...gedeeld} />
          )}
        </div>
      </div>
    )
  })()

  const gespeeld = Object.values(stand.gespeeld).reduce((a, b) => a + b, 0)
  const metRecord = Object.keys(stand.records).length

  return (
    <>
      <header className="top">
        <div className="top-in">
          <button type="button" className="terug" title="Terug" aria-label="Terug"
                  onClick={() => { if (bezigMet) sluit(); else location.href = '/' }}>←</button>
          <span className="brand">Spelletjes<em lang="ar">رَاحَة</em></span>
          <span className="tegen">
            {metRecord ? `${metRecord} van de ${SPELLEN.length} met een record` : ''}
          </span>
        </div>
      </header>

      <main className="wrap">
      <div id="scherm" className="stack">
        <div>
          <h1>Spelletjes</h1>
          <p className="klein" style={{ marginTop: 5 }}>
            {SPELLEN.length} spellen plus twee grote.{' '}
            {gespeeld ? `Je speelde er tot nu toe ${gespeeld}.`
                      : 'Nog niets gespeeld — begin waar je zin in hebt.'}
          </p>
        </div>

        <div className="tegels">
          {SPELLEN.map((s) => (
            <button key={s.id} type="button" className="tegel"
                    onClick={() => { zetUitslag(null); zetRonde((n) => n + 1); zetBezigMet(s) }}>
              <span className={'ico' + (s.id === 'letters' ? ' ar' : '')}>{s.ico}</span>
              <b>{s.n}</b><span>{s.u}</span>
              <span className="rec">
                {stand.records[s.id] === undefined
                  ? 'nog geen record'
                  : `🏆 ${stand.records[s.id]} ${s.eenh}`}
              </span>
            </button>
          ))}
        </div>

        <h2 style={{ marginTop: 26 }}>De grote twee</h2>
        <p className="klein" style={{ marginTop: 5 }}>
          Deze openen in een eigen scherm en zijn een stuk uitgebreider.
        </p>
        <div className="tegels">
          {EXTERN.map((s) => (
            <a key={s.n} className="tegel" href={s.href} style={{ textDecoration: 'none' }}>
              <span className="ico">{s.ico}</span><b>{s.n}</b><span>{s.u}</span>
            </a>
          ))}
        </div>

        <Instellingenkaart
          stand={stand} zetInstel={zetInstel} wolk={wolk}
          melding={melding} zetMelding={zetMelding}
          opGelijktrekken={gelijktrekken}
          opWissen={() => bewaar({ ...nu.current, records: {}, gespeeld: {} })}
        />

      </div>
      <footer>
        <p>{grap}</p>
        <p>
          Deze hoek heette eerst <b lang="ar">رَاحَة</b> — <i>raha</i>, rust. Vrije tijd is een gunst
          waar volgens de overlevering veel mensen zich in vergissen — dus: even pauze, en daarna
          weer verder. De app helpt daarbij door niets te doen wat je hier langer houdt dan je van
          plan was: geen meldingen, geen dagelijkse beloning, geen reclame.
        </p>
        <p className="meta">Onderdeel van BennaHub</p>
      </footer>
      </main>
      {overlay}
    </>
  )
}

function Uitslag(
  { spel, uitslag, opnieuw, opTerug }:
  {
    spel: Spelbeschrijving
    uitslag: { score: number; tekst: string; nieuw: boolean }
    opnieuw: () => void
    opTerug: () => void
  },
) {
  return (
    <>
      <div className="rij tussen">
        <p className="meta">{spel.ico} {spel.n}</p>
        <button type="button" className="btn ghost sm" onClick={opTerug}>Klaar</button>
      </div>
      <div className="card midden" style={{ marginTop: 12 }}>
        <p style={{ margin: '10px 0 0', fontWeight: 600 }}>
          {uitslag.tekst}{uitslag.nieuw && <span className="tag goed"> record</span>}
        </p>
        <div className="rij" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button type="button" className="btn" onClick={opnieuw}>Nog een keer</button>
          <button type="button" className="btn ghost" onClick={opTerug}>Terug</button>
        </div>
      </div>
    </>
  )
}

/**
 * Het geluid mag je zelf aan- en uitzetten; de rest — inloggen en records
 * wissen — zit achter de oudercode.
 */
function Instellingenkaart(
  { stand, zetInstel, wolk, melding, zetMelding, opGelijktrekken, opWissen }:
  {
    stand: Stand
    zetInstel: (i: Partial<Instellingen>) => void
    wolk: ReturnType<typeof useWolk>
    melding: { tekst: string; soort?: 'goed' | 'fout' } | null
    zetMelding: (m: { tekst: string; soort?: 'goed' | 'fout' } | null) => void
    opGelijktrekken: () => Promise<void>
    opWissen: () => void
  },
) {
  const [open, zetOpen] = useState(false)
  const [pin, zetPin] = useState('')
  const [acc, zetAcc] = useState('')
  const [ww, zetWw] = useState('')
  const oudercode = stand.instel.ouderPin || '1234'

  const zeg = (tekst: string, soort?: 'goed' | 'fout') => zetMelding({ tekst, ...(soort ? { soort } : {}) })

  return (
    <div className="card" style={{ marginTop: 22 }}>
      <div className="rij tussen">
        <h3>Instellingen</h3>
        <button type="button" className="btn ghost sm"
                onClick={() => zetInstel({ geluid: !stand.instel.geluid })}>
          Geluid: {stand.instel.geluid ? 'aan' : 'uit'}
        </button>
      </div>
      <p className="klein" style={{ marginTop: 8 }}>
        Records staan op dit toestel. Het geluid mag je zelf aan- en uitzetten; de rest — inloggen en
        records wissen — zit achter de oudercode.
      </p>

      {!open ? (
        <div className="rij" style={{ marginTop: 10 }}>
          <input type="password" placeholder="oudercode" inputMode="numeric" value={pin}
                 onChange={(e) => zetPin(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') zetOpen(pin === oudercode) }} />
          <button type="button" className="btn sm"
                  onClick={() => {
                    if (pin === oudercode) { zetOpen(true); zetPin('') }
                    else { zeg('Dat is hem niet.', 'fout'); zetPin('') }
                  }}>
            Openen
          </button>
        </div>
      ) : (
        <>
          <p className="klein" style={{ marginTop: 8 }}>
            <span className={'tag ' + (wolk.aan ? 'goed' : '')}>
              {wolk.aan ? `Ingelogd als ${wolk.account}` : 'Alleen op dit toestel'}
            </span>
          </p>
          {wolk.aan ? (
            <div className="rij" style={{ marginTop: 10 }}>
              <button type="button" className="btn ghost sm" onClick={wolk.uitloggen}>Uitloggen</button>
              <button type="button" className="btn ghost sm"
                      onClick={async () => {
                        zeg('Bezig…')
                        try { await opGelijktrekken(); zeg('Gelijkgetrokken.', 'goed') }
                        catch (e) { zeg(e instanceof Error ? e.message : String(e), 'fout') }
                      }}>
                Nu gelijktrekken
              </button>
            </div>
          ) : (
            <div className="rij" style={{ marginTop: 10 }}>
              <input placeholder="account" autoComplete="username" value={acc}
                     onChange={(e) => zetAcc(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
              <input type="password" placeholder="wachtwoord" autoComplete="current-password"
                     value={ww} onChange={(e) => zetWw(e.target.value)}
                     style={{ flex: 1, minWidth: 120 }} />
              <button type="button" className="btn sm"
                      onClick={async () => {
                        if (!acc.trim() || !ww) { zeg('Vul een account en een wachtwoord in.', 'fout'); return }
                        zeg('Bezig…')
                        try {
                          await wolk.inloggen(acc.trim(), ww)
                          await opGelijktrekken()
                          zeg('Ingelogd en gelijkgetrokken.', 'goed')
                        } catch (e) { zeg(e instanceof Error ? e.message : String(e), 'fout') }
                      }}>
                Inloggen
              </button>
              <button type="button" className="btn ghost sm"
                      onClick={async () => {
                        if (!acc.trim() || ww.length < 4) {
                          zeg('Kies een naam en een wachtwoord van minstens vier tekens.', 'fout')
                          return
                        }
                        zeg('Bezig…')
                        try {
                          await wolk.registreren(acc.trim(), ww, stand)
                          zeg('Account aangemaakt.', 'goed')
                        } catch (e) { zeg(e instanceof Error ? e.message : String(e), 'fout') }
                      }}>
                Nieuw
              </button>
            </div>
          )}

          <label className="veld" style={{ display: 'block', marginTop: 12 }}>
            <span className="meta">Oudercode</span>
            <input inputMode="numeric" defaultValue={oudercode} style={{ width: 160 }}
                   onBlur={(e) => zetInstel({ ouderPin: e.target.value.trim() || '1234' })} />
          </label>
          {oudercode === '1234' && (
            <p className="klein" style={{ marginTop: 6, color: 'var(--fout)' }}>
              Hij staat nog op <b>1234</b> — verander hem.
            </p>
          )}
          {Object.keys(stand.records).length > 0 && (
            <div className="rij" style={{ marginTop: 12 }}>
              <button type="button" className="btn ghost sm" style={{ color: 'var(--fout)' }}
                      onClick={() => { if (confirm('Alle records wissen?')) opWissen() }}>
                Records wissen
              </button>
            </div>
          )}
        </>
      )}

      {melding && <p className={'melding klein ' + (melding.soort ?? '')}>{melding.tekst}</p>}
    </div>
  )
}
