/**
 * HET OUDEROVERZICHT
 *
 * Wie wat wanneer heeft gedaan, en wat er in elke app is verdiend. Overgezet uit
 * schermOuder(), vraagOuderWW() en tekenOuder().
 */
import { useEffect, useState } from 'react'
import { Balk, Codekaart, Melding } from '../onderdelen'
import { APPS } from '../apps'
import { UITLEZERS } from '../uitlezers'
import type { Regel } from '../uitlezers'
import { datum, euro, hoofd, stilte } from '../opmaak'
import type { Ik } from '../sessie'
import { leesOuderWw, wisOuderWw, zetOuderWw } from '../sessie'
import type { AppStand, Overzicht } from '@/gedeeld/db/bennahub'
import { gezinWachtwoord, lidReset, overzicht as haalOverzicht } from '@/gedeeld/db/bennahub'

const fouttekst = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export interface OuderEigenschappen {
  ik: Ik
  naarHub: () => void
  naarWachtwoord: () => void
  opAfmelden: () => void
}

export function Ouder(p: OuderEigenschappen) {
  const [ww, zetWw] = useState<string | null>(leesOuderWw)
  const [gegevens, zetGegevens] = useState<Overzicht | null>(null)
  const [fout, zetFout] = useState<string | null>(null)
  const [ronde, zetRonde] = useState(0)

  useEffect(() => {
    if (!ww) return
    let af = false
    void (async () => {
      try {
        const r = await haalOverzicht(ww)
        if (!af) { zetGegevens(r); zetFout(null) }
      } catch (e) {
        if (af) return
        wisOuderWw()
        zetWw(null)
        zetGegevens(null)
        zetFout(fouttekst(e))
      }
    })()
    return () => { af = true }
  }, [ww, ronde])

  if (!ww) {
    return (
      <VraagWachtwoord
        {...p} fout={fout}
        opGoed={(w) => { zetOuderWw(w); zetWw(w); zetFout(null) }}
      />
    )
  }

  if (!gegevens) {
    return (
      <>
        <Balk ik={p.ik} breed naarOverzicht={() => zetRonde((n) => n + 1)}
              naarWachtwoord={p.naarWachtwoord} opAfmelden={p.opAfmelden} />
        <div className="wrap breed" style={{ paddingTop: 34 }}>
          <p className="meta">Bezig met ophalen…</p>
        </div>
      </>
    )
  }

  return (
    <Tabel {...p} ww={ww} gegevens={gegevens} opVernieuwen={() => zetRonde((n) => n + 1)} />
  )
}

function VraagWachtwoord(
  { ik, naarHub, naarWachtwoord, opAfmelden, fout, opGoed }:
  OuderEigenschappen & { fout: string | null; opGoed: (ww: string) => void },
) {
  const [ww, zetWw] = useState('')
  const [melding, zetMelding] = useState<string | null>(fout)
  const [bezig, zetBezig] = useState(false)

  async function doe() {
    zetBezig(true)
    zetMelding('Bezig…')
    try {
      await haalOverzicht(ww)
      opGoed(ww)
    } catch (e) {
      zetBezig(false)
      zetMelding(fouttekst(e))
    }
  }

  return (
    <>
      <Balk ik={ik} naarOverzicht={() => {}} naarWachtwoord={naarWachtwoord}
            opAfmelden={opAfmelden} />
      <div className="wrap" style={{ paddingTop: 34 }}>
        <Codekaart>
          <h2>Overzicht</h2>
          <p className="klein" style={{ marginTop: 8 }}>
            Hier staat wat iedereen in alle apps heeft gedaan en wat er openstaat. Typ je
            ouderwachtwoord — dat is iets anders dan je eigen wachtwoord als je dat hebt gewijzigd.
          </p>
          <input type="password" placeholder="Ouderwachtwoord" autoComplete="current-password"
                 autoFocus value={ww} onChange={(e) => zetWw(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') void doe() }} />
          <button type="button" className="btn vol" disabled={bezig} onClick={() => void doe()}>
            Bekijken
          </button>
          <Melding tekst={melding} />
          <div className="rij" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button type="button" className="btn ghost sm" onClick={naarHub}>← Terug</button>
          </div>
        </Codekaart>
      </div>
    </>
  )
}

/** Wat een uitlezer eruit haalt, of niets als hij het niet kan lezen. */
function leesVeilig(app: string, stand: AppStand): Regel[] {
  const lees = UITLEZERS[app]
  if (!lees) return []
  try {
    return lees(stand.data)
  } catch {
    /* Een app die zijn vorm wijzigt mag het overzicht niet omgooien. */
    return []
  }
}

function Tabel(
  { ik, ww, gegevens, naarHub, naarWachtwoord, opAfmelden, opVernieuwen }:
  OuderEigenschappen & { ww: string; gegevens: Overzicht; opVernieuwen: () => void },
) {
  /* Het geld bij elkaar. Dit is de vraag die je op zaterdag stelt: wie krijgt er
     nog wat van me? */
  const potjes = gegevens.apps.flatMap((stand) =>
    leesVeilig(stand.app, stand)
      .filter((r) => r.euro != null && r.euro > 0)
      .map((r) => ({
        app: APPS.find((a) => a.id === stand.app)?.naam ?? stand.app,
        wie: r.wie,
        euro: r.euro as number,
      })))
  const totaal = potjes.reduce((n, p) => n + p.euro, 0)

  return (
    <>
      <Balk ik={ik} breed naarOverzicht={opVernieuwen} naarWachtwoord={naarWachtwoord}
            opAfmelden={opAfmelden} />
      <div className="wrap breed" style={{ paddingTop: 34 }}>
        <h1 style={{ fontSize: '2rem' }}>Overzicht</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Alles van alle apps op één plek. Dit ziet alleen wie zich als ouder heeft aangemeld.
        </p>

        <div className="raster g2" style={{ marginTop: 22 }}>
          <div className="kaart">
            <p className="meta">Nog uit te betalen</p>
            <p className="cijfer" style={{ color: 'var(--goed)', marginTop: 4 }}>{euro(totaal)}</p>
            {potjes.length ? (
              <div className="tabelwrap" style={{ marginTop: 12 }}>
                <table className="tbl">
                  <tbody>
                    {potjes.map((p, i) => (
                      <tr key={i}>
                        <td><b>{hoofd(p.wie)}</b></td>
                        <td className="klein">{p.app}</td>
                        <td className="geld" style={{ textAlign: 'right' }}>{euro(p.euro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="klein" style={{ marginTop: 8 }}>Er staat nergens iets open.</p>
            )}
          </div>

          <div className="kaart">
            <p className="meta">Wie was er voor het laatst</p>
            <div className="tabelwrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <tbody>
                  {gegevens.leden.map((l) => {
                    const st = stilte(l.laatstActief)
                    return (
                      <tr key={l.naam}>
                        <td>{l.emoji} <b>{hoofd(l.naam)}</b></td>
                        <td className="klein">{l.rol === 'ouder' ? 'ouder' : ''}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={'speld ' + st.klasse}>{st.tekst}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ResetKnop naam={l.naam} ww={ww} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="klein" style={{ marginTop: 10 }}>
              "Resetten" wist alleen het wachtwoord van dat kind — zijn lessen, punten en spaarpot
              blijven staan. Bij de volgende keer kiest hij zelf een nieuw wachtwoord, dus jij hoeft
              er niets voor te onthouden.
            </p>
          </div>
        </div>

        <h2 style={{ marginTop: 34, fontSize: '1.4rem' }}>Per app</h2>
        <div style={{ marginTop: 14 }}>
          {APPS.map((a) => <AppBlok key={a.id} tegel={a} standen={gegevens.apps} />)}
        </div>

        <OuderWachtwoord />

        <div className="rij" style={{ marginTop: 24, marginBottom: 40 }}>
          <button type="button" className="btn ghost" onClick={naarHub}>← Terug naar de apps</button>
          <button type="button" className="btn ghost" onClick={opVernieuwen}>Vernieuwen</button>
        </div>
      </div>
    </>
  )
}

function AppBlok(
  { tegel, standen }: { tegel: (typeof APPS)[number]; standen: AppStand[] },
) {
  const stand = standen.find((x) => x.app === tegel.id)
  const heeftUitlezer = UITLEZERS[tegel.id] != null
  const regels = stand ? leesVeilig(tegel.id, stand) : []

  /* Kent een app geen uitlezer of staat er nog niets in, dan zeggen we dat
     gewoon — een lege tabel laat je raden of het niet werkt of dat er niets is. */
  let inhoud
  if (tegel.id === 'huiswerk' || tegel.id === 'academie') {
    inhoud = (
      <p className="klein">
        Deze app heeft nog zijn eigen inlog en bewaart niets centraal. Het overzicht daarvan staat in
        de app zelf.
      </p>
    )
  } else if (!stand) {
    inhoud = (
      <p className="klein">
        Nog geen centraal account. Wie de app opent en zich aanmeldt, komt hier vanzelf te staan.
      </p>
    )
  } else if (!heeftUitlezer) {
    inhoud = <p className="klein">Laatst bijgewerkt {datum(stand.updatedAt)}.</p>
  } else if (!regels.length) {
    inhoud = (
      <p className="klein">
        Account <b>{stand.account}</b>, maar er staat nog geen voortgang in. Laatst bijgewerkt{' '}
        {datum(stand.updatedAt)}.
      </p>
    )
  } else {
    const kolommen = regels[0]?.regels.map((x) => x[0]) ?? []
    inhoud = (
      <div className="tabelwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Wie</th>
              {kolommen.map((k) => <th key={k}>{k}</th>)}
              <th>Verdiend</th><th>Laatst</th>
            </tr>
          </thead>
          <tbody>
            {regels.map((r, i) => {
              const st = stilte(r.laatst ?? stand.updatedAt)
              return (
                <tr key={i}>
                  <td><b>{hoofd(r.wie)}</b></td>
                  {r.regels.map((x, j) => <td key={j}>{x[1]}</td>)}
                  <td className="geld">{r.euro == null ? '—' : euro(r.euro)}</td>
                  <td><span className={'speld ' + st.klasse}>{st.tekst}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="kaart" style={{ borderLeft: `3px solid var(--${tegel.k})` }}>
      <div className="rij" style={{ gap: 12 }}>
        <img className="tegel" src={tegel.ico} alt="" width={34} height={34}
             style={{ width: 34, height: 34, borderRadius: 10, ['--k' as string]: `var(--${tegel.k})` }} />
        <h3>{tegel.naam}</h3>
      </div>
      <div style={{ marginTop: 12 }}>{inhoud}</div>
    </div>
  )
}

function ResetKnop({ naam, ww }: { naam: string; ww: string }) {
  const [stand, zetStand] = useState<'klaar' | 'bezig' | 'gewist'>('klaar')
  return (
    <button
      type="button" className="btn ghost sm nowrap" disabled={stand !== 'klaar'}
      onClick={async () => {
        const vraag = `Het wachtwoord van ${hoofd(naam)} wissen? De voortgang blijft staan; ` +
          `bij de volgende keer kiest ${hoofd(naam)} zelf een nieuw wachtwoord.`
        if (!confirm(vraag)) return
        zetStand('bezig')
        try {
          await lidReset(ww, naam)
          zetStand('gewist')
        } catch (e) {
          zetStand('klaar')
          alert(fouttekst(e))
        }
      }}
    >
      {stand === 'gewist' ? 'Gewist' : 'Resetten'}
    </button>
  )
}

function OuderWachtwoord() {
  const [oud, zetOud] = useState('')
  const [nieuw, zetNieuw] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [goed, zetGoed] = useState(false)
  const [bezig, zetBezig] = useState(false)

  async function doe() {
    if (nieuw.length < 6) {
      zetGoed(false)
      zetMelding('Het nieuwe wachtwoord moet minstens 6 tekens zijn.')
      return
    }
    zetBezig(true)
    try {
      await gezinWachtwoord(oud, nieuw)
      zetOuderWw(nieuw)
      zetGoed(true)
      zetMelding('Gewijzigd.')
    } catch (e) {
      zetGoed(false)
      zetMelding(fouttekst(e))
    } finally {
      zetBezig(false)
    }
  }

  return (
    <div className="kaart" style={{ marginTop: 22 }}>
      <h3>Ouderwachtwoord wijzigen</h3>
      <p className="klein" style={{ marginTop: 6 }}>
        Hiermee kom je bij dit overzicht en hiermee melden jij en Hanae je aan.
      </p>
      <div className="raster g2" style={{ marginTop: 10 }}>
        <input type="password" placeholder="huidig wachtwoord" autoComplete="current-password"
               value={oud} onChange={(e) => zetOud(e.target.value)} />
        <input type="password" placeholder="nieuw wachtwoord (min. 6)" autoComplete="new-password"
               value={nieuw} onChange={(e) => zetNieuw(e.target.value)} />
      </div>
      <div className="rij" style={{ marginTop: 12 }}>
        <button type="button" className="btn sm" disabled={bezig} onClick={() => void doe()}>
          Opslaan
        </button>
      </div>
      <Melding tekst={melding} goed={goed} />
    </div>
  )
}
