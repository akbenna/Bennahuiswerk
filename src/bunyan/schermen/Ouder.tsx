/**
 * HET OUDERSCHERM — voortgang, uitbetalen en instellingen
 *
 * Altijd op slot, ook zonder ingestelde code — dan geldt de standaardcode.
 * Anders zet degene voor wie de beloning bedoeld is zijn eigen tarief, en dat
 * is het enige scherm in de app waar dat werkelijk uitmaakt.
 *
 * Het slot is een drempel en geen beveiliging: de code staat gewoon in de
 * opslag van dit toestel. Wie hem eruit wil halen kan dat, en dat weet een kind
 * dat de lessen hier gehaald heeft ook. Dat is de bedoeling.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { ALLEBLOKKEN, ALLELESSEN, af, blokGedaan } from '../voortgang'
import type { Instellingen, Losse } from '../opslag'
import { Balk, Cijfer, Kader, Melding, Tag } from '../onderdelen'
import type { Toestand } from '../toestand'

const BUDGETTEN = [3, 4, 5, 6, 8, 10, 12]
const LESTARIEVEN = [0.20, 0.30, 0.40, 0.50, 0.75]
const PROJECTTARIEVEN = [1, 1.5, 2, 3]

export function Ouder({ t }: { t: Toestand }): ReactNode {
  const [open, zetOpen] = useState(false)
  const [pin, zetPin] = useState('')
  const [mis, zetMis] = useState('')

  if (!open) {
    const proberen = (): void => {
      if (pin === (t.stand.instel.ouderPin || '1234')) {
        zetOpen(true)
        return
      }
      zetMis('Dat is hem niet.')
      zetPin('')
    }
    return (
      <div className="card">
        <h3>Ouderscherm</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Dit scherm is voor papa en mama: de instellingen, de voortgang en het uitbetalen.
        </p>
        <label className="veld">
          <span>Code</span>
          <input
            type="password" inputMode="numeric" value={pin}
            onChange={(e) => { zetPin(e.target.value); zetMis('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') proberen() }}
          />
        </label>
        <div className="rij" style={{ marginTop: 12 }}>
          <button className="btn" onClick={proberen}>Openen</button>
        </div>
        <Melding tekst={mis} soort="fout" />
      </div>
    )
  }
  return <Binnen t={t} />
}

function Binnen({ t }: { t: Toestand }): ReactNode {
  const { stand, wolk } = t
  const [wMeld, zetWMeld] = useState<{ tekst: string; soort?: 'goed' | 'fout' }>({ tekst: '' })
  const [gMeld, zetGMeld] = useState<{ tekst: string; soort?: 'goed' | 'fout' }>({ tekst: '' })
  const [acc, zetAcc] = useState('')
  const [pin, zetPin] = useState('')
  const [uitbetalen, zetUitbetalen] = useState(false)
  const [wissen, zetWissen] = useState(false)

  const totaal = ALLELESSEN.length
  const gedaan = ALLELESSEN.filter((l) => af(stand, l.id)).length
  const scores = ALLELESSEN.filter((l) => af(stand, l.id)).map((l) => stand.lessen[l.id]?.score ?? 0)
  const gem = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const laatste = stand.log.slice(-14)

  const zetInstel = (v: Partial<Instellingen>): void => t.zet((s) => ({
    ...s, instel: { ...s.instel, ...v }, instelD: new Date().toISOString(),
  }))

  return (
    <>
      <div>
        <h1>Ouderscherm</h1>
        <p className="klein" style={{ marginTop: 5 }}>Voortgang, uitbetalen en instellingen.</p>
      </div>

      <div className="grid g4">
        <Cijfer kop="Lessen af" waarde={<>{gedaan}<span style={{ fontSize: '.9rem', color: 'var(--muted)' }}>/{totaal}</span></>} />
        <Cijfer kop="Gemiddeld" waarde={`${gem}%`} />
        <Cijfer kop="Uit te betalen" waarde={euro(stand.saldo)} kleur="var(--goed)" />
        <Cijfer kop="Dagen op rij" waarde={stand.reeks} />
      </div>

      <div className="card">
        <h3>Per blok</h3>
        <div className="stack" style={{ marginTop: 10 }}>
          {ALLEBLOKKEN.map((b) => {
            const n = blokGedaan(stand, b)
            return (
              <div className="rij" style={{ gap: 12 }} key={b.id}>
                <span style={{ minWidth: 150 }}>{b.ico} <b>{b.n}</b></span>
                <span style={{ flex: 1, minWidth: 90 }}><Balk p={n / b.lessen.length * 100} /></span>
                <span className="klein" style={{ minWidth: 44, textAlign: 'right' }}>
                  {n}/{b.lessen.length}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3>Uitbetalen</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          De app rekent alleen. Betaal je uit, druk dan hier — dan gaat het saldo naar nul en
          blijft het totaal bewaard.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Tot nu toe uitbetaald: <b>{euro(stand.uitbetaald)}</b>
        </p>
        <div className="rij" style={{ marginTop: 12 }}>
          <button
            className="btn"
            disabled={stand.saldo <= 0}
            onClick={() => {
              if (!uitbetalen) { zetUitbetalen(true); return }
              zetUitbetalen(false)
              t.zet((s) => ({
                ...s,
                uitbetaald: Math.round((s.uitbetaald + s.saldo) * 100) / 100,
                saldo: 0,
              }))
            }}
          >
            {uitbetalen
              ? `Zeker weten? Klik nogmaals`
              : `${euro(stand.saldo)} uitbetaald`}
          </button>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Instellingen</h3>
          <label className="veld">
            <span>Naam</span>
            <input
              value={stand.instel.naam}
              onChange={(e) => zetInstel({ naam: e.target.value })}
            />
          </label>
          <label className="veld">
            <span>Weekbudget</span>
            <select
              value={stand.instel.weekbudget}
              onChange={(e) => zetInstel({ weekbudget: +e.target.value })}
            >{BUDGETTEN.map((b) => <option key={b} value={b}>{euro(b)}</option>)}</select>
          </label>
          <label className="veld">
            <span>Per gewone les</span>
            <select
              value={stand.instel.tariefLes}
              onChange={(e) => zetInstel({ tariefLes: parseFloat(e.target.value) })}
            >{LESTARIEVEN.map((b) => <option key={b} value={b}>{euro(b)}</option>)}</select>
          </label>
          <label className="veld">
            <span>Per project</span>
            <select
              value={stand.instel.tariefProject}
              onChange={(e) => zetInstel({ tariefProject: parseFloat(e.target.value) })}
            >{PROJECTTARIEVEN.map((b) => <option key={b} value={b}>{euro(b)}</option>)}</select>
          </label>
          <label className="veld">
            <span>Code voor het ouderscherm</span>
            <input
              value={stand.instel.ouderPin}
              inputMode="numeric"
              onChange={(e) => zetInstel({ ouderPin: e.target.value.trim() || '1234' })}
            />
          </label>
          {stand.instel.ouderPin === '1234' && (
            <Kader soort="let" kop="Verander deze code">
              Hij staat nog op 1234. Dat raadt {stand.instel.naam} binnen een minuut, en dit
              scherm bepaalt wat een les hem oplevert.
            </Kader>
          )}
        </div>

        <div className="card">
          <h3>Centrale opslag</h3>
          <p className="klein" style={{ marginTop: 5 }}>
            Met een account staat de voortgang op elk toestel gelijk. Zonder internet werkt
            alles door; bij de volgende verbinding wordt het samengevoegd — er gaat nooit iets
            verloren.
          </p>
          <p className="klein" style={{ marginTop: 9 }}>
            <Tag soort={wolk.aan ? 'goed' : undefined}>
              {wolk.aan ? `Ingelogd als ${wolk.account}` : 'Alleen op dit toestel'}
            </Tag>
          </p>
          {wolk.aan ? (
            <div className="rij" style={{ marginTop: 14 }}>
              <button className="btn ghost sm" onClick={() => { wolk.uitloggen(); zetWMeld({ tekst: '' }) }}>
                Uitloggen
              </button>
              <button
                className="btn ghost sm"
                disabled={wolk.bezig}
                onClick={() => void (async () => {
                  zetWMeld({ tekst: 'Bezig…' })
                  const goed = await t.gelijktrekken()
                  zetWMeld(goed
                    ? { tekst: 'Gelijkgetrokken.', soort: 'goed' }
                    : { tekst: 'Kon de centrale kopie niet ophalen. Er is niets verloren gegaan.', soort: 'fout' })
                })()}
              >Nu gelijktrekken</button>
            </div>
          ) : (
            <>
              <label className="veld">
                <span>Account</span>
                <input value={acc} placeholder="benna" autoComplete="username"
                  onChange={(e) => zetAcc(e.target.value)} />
              </label>
              <label className="veld">
                <span>Wachtwoord</span>
                <input value={pin} type="password" autoComplete="current-password"
                  onChange={(e) => zetPin(e.target.value)} />
              </label>
              <div className="rij" style={{ marginTop: 14 }}>
                <button
                  className="btn"
                  onClick={() => void (async () => {
                    if (!acc.trim() || !pin) {
                      zetWMeld({ tekst: 'Vul een account en een wachtwoord in.', soort: 'fout' })
                      return
                    }
                    zetWMeld({ tekst: 'Bezig…' })
                    try {
                      await wolk.inloggen(acc.trim(), pin)
                      zetPin('')
                      await t.gelijktrekken()
                      zetWMeld({ tekst: 'Ingelogd en gelijkgetrokken.', soort: 'goed' })
                    } catch (e) {
                      zetWMeld({ tekst: e instanceof Error ? e.message : 'Inloggen mislukte.', soort: 'fout' })
                    }
                  })()}
                >Inloggen</button>
                <button
                  className="btn ghost"
                  onClick={() => void (async () => {
                    if (!acc.trim() || pin.length < 4) {
                      zetWMeld({ tekst: 'Kies een naam en een wachtwoord van minstens vier tekens.', soort: 'fout' })
                      return
                    }
                    zetWMeld({ tekst: 'Bezig…' })
                    try {
                      await wolk.registreren(acc.trim(), pin, stand)
                      zetPin('')
                      zetWMeld({ tekst: 'Account aangemaakt.', soort: 'goed' })
                    } catch (e) {
                      zetWMeld({ tekst: e instanceof Error ? e.message : 'Aanmaken mislukte.', soort: 'fout' })
                    }
                  })()}
                >Nieuw account</button>
              </div>
            </>
          )}
          <Melding {...wMeld} />
        </div>
      </div>

      <div className="card">
        <h3>De laatste twee weken</h3>
        {laatste.length ? (
          <div className="stack" style={{ marginTop: 10 }}>
            {laatste.slice().reverse().map((r) => (
              <div
                className="rij tussen" key={r.d}
                style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}
              >
                <span className="klein">{r.d}</span>
                <span className="klein">
                  {r.lessen} {r.lessen === 1 ? 'les' : 'lessen'} · {r.punten} punten
                </span>
              </div>
            ))}
          </div>
        ) : <p className="klein" style={{ marginTop: 8 }}>Nog niets gedaan.</p>}
      </div>

      <div className="card">
        <h3>Gegevens</h3>
        <div className="rij" style={{ marginTop: 10 }}>
          <button
            className="btn ghost sm"
            onClick={() => {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(
                new Blob([JSON.stringify(stand, null, 1)], { type: 'application/json' }))
              a.download = `bunyan-${t.klok.vandaag}.json`
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 2000)
            }}
          >Opslaan als bestand</button>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
            Inlezen
            <input
              type="file" accept="application/json" hidden
              onChange={(e) => void (async () => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  const j = JSON.parse(await f.text()) as Losse
                  if (!j.lessen) throw new Error('geen voortgang in dit bestand')
                  t.voegBij(j)
                  zetGMeld({ tekst: 'Ingelezen.', soort: 'goed' })
                } catch {
                  zetGMeld({ tekst: 'Dat bestand kon niet gelezen worden.', soort: 'fout' })
                }
              })()}
            />
          </label>
          <button
            className="btn ghost sm"
            style={{ color: 'var(--fout)' }}
            onClick={() => {
              if (!wissen) {
                zetWissen(true)
                zetGMeld({ tekst: 'Alle voortgang gaat weg. Klik nogmaals.', soort: 'fout' })
                return
              }
              zetWissen(false)
              t.wisAlles()
              zetGMeld({ tekst: 'Alles gewist.', soort: 'goed' })
            }}
          >{wissen ? 'Zeker weten?' : 'Alles wissen'}</button>
        </div>
        <Melding {...gMeld} />
      </div>

      <Kader kop="Waarom het geld aan het werk hangt en niet aan de tijd">
        Er is geen beloning voor "een uur bezig zijn", alleen voor een les die af is. Dat
        scheelt de discussie over of er echt gewerkt werd. En het weekplafond staat er zodat
        een goede week niet in een salaris verandert: als het budget op is lopen de punten, de
        rangen en de insignes gewoon door.
      </Kader>
    </>
  )
}
