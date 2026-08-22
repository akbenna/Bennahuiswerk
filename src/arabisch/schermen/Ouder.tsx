/**
 * OUDER — profielen, sporen, weergave en beheer
 *
 * Dit scherm zit op slot. Hier staan de profielen, de sporen en de knop die
 * alles wist; dat is geen scherm waar een kind per ongeluk in hoort te komen.
 * Zonder ingestelde code geldt de standaardcode, en zolang die geldt zegt het
 * scherm dat er zelf bij.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import type { Profiel, Stand } from '../opslag'
import { STANDAARDPIN, leeg } from '../opslag'
import { SPOORNAAM, bouwPad } from '../leerplan'
import { vandaag } from '../datum'
import type { Vocalisatie } from '../tekst'
import { Cockpit } from './Cockpit'
import { Wolkvak } from './Wolkvak'

const VOCALISATIES: Array<[Vocalisatie, string]> = [
  ['vol', 'Volledig — alles gevocaliseerd'],
  ['selectief', 'Selectief — alleen waar het woord anders dubbelzinnig is'],
  ['kaal', 'Geen — zoals in een gewone tekst'],
]

const THEMAS: Array<[string, string]> = [
  ['auto', 'Volg het toestel'], ['licht', 'Licht'], ['donker', 'Donker'],
]

export interface OuderProps {
  t: Toestand
  naarTab: (tab: string) => void
  nieuwProfiel: () => void
  bewerkProfiel: (id: string) => void
  doeMeting: () => void
  doeWerkblad: (week: number) => void
}

export function Ouder(props: OuderProps): ReactNode {
  const { t, nieuwProfiel, bewerkProfiel } = props
  const [open, zetOpen] = useState(false)
  const [pin, zetPin] = useState('')
  const [meld, zetMeld] = useState('')

  if (!open) {
    const probeer = (): void => {
      if (pin === (t.stand.ouderPin || STANDAARDPIN)) { zetOpen(true); return }
      zetMeld('Dat is hem niet.')
      zetPin('')
    }
    return (
      <div className="wrap">
        <h1>Ouder</h1>
        <div className="kaart" style={{ marginTop: 12, maxWidth: 420 }}>
          <p className="small muted" style={{ margin: 0 }}>
            Dit scherm is voor papa en mama: de profielen, de voortgang en het beheer. Voer de
            code in om verder te gaan.
          </p>
          <label className="veldje" style={{ marginTop: 10 }}>
            <span>Code</span>
            <input
              type="password" inputMode="numeric" value={pin}
              onChange={(e) => zetPin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') probeer() }}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="k" onClick={probeer}>Openen</button>
          </div>
          {meld && <p className="small" style={{ marginTop: 8, color: 'var(--fout)' }}>{meld}</p>}
        </div>
      </div>
    )
  }

  return <OuderOpen {...props} nieuwProfiel={nieuwProfiel} bewerkProfiel={bewerkProfiel} />
}

function OuderOpen(
  { t, naarTab, nieuwProfiel, bewerkProfiel, doeMeting, doeWerkblad }: OuderProps,
): ReactNode {
  const [wisvraag, zetWisvraag] = useState(false)
  const [verwijder, zetVerwijder] = useState<string | null>(null)
  const [bericht, zetBericht] = useState<ReactNode>(null)
  const p = t.profiel
  const lijst = Object.values(t.stand.profielen)

  const zetPin = (waarde: string): void => {
    /* Leeg laten kan niet; dan geldt weer de standaardcode. */
    t.zet((s) => ({ ...s, ouderPin: waarde.trim() || STANDAARDPIN }))
  }

  return (
    <div className="wrap">
      <h1>Ouder</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        Beheer van profielen, sporen en gegevens.
      </p>

      <Cockpit
        t={t} naarTab={naarTab} doeMeting={doeMeting} doeWerkblad={doeWerkblad}
      />

      <Wolkvak t={t} />

      <h3 style={{ marginTop: 22 }}>Profielen</h3>
      <div className="stack" style={{ marginTop: 10 }}>
        {lijst.map((x) => {
          const pad = bouwPad(x.spoor).length
          const openKaarten = Object.values(x.kaarten)
            .filter((k) => k.due && k.due <= t.dag).length
          return (
            <div className={x.id === p?.id ? 'kaart accent' : 'kaart'} key={x.id}>
              <div className="rij tussen">
                <div className="rij">
                  <span className="profbol">{x.naam.trim().charAt(0).toUpperCase()}</span>
                  <div>
                    <b>{x.naam}</b>
                    <div className="klein muted">
                      {x.leeftijd} jaar · spoor {x.spoor} — {SPOORNAAM[x.spoor]}
                      {x.spoorHandmatig ? ' (handmatig)' : ''}
                    </div>
                  </div>
                </div>
                {x.id === p?.id
                  ? <span className="vlag acc">actief</span>
                  : (
                    <button type="button" className="k rand klein" onClick={() => t.kies(x.id)}>
                      Kiezen
                    </button>
                    )}
              </div>
              <div className="rij" style={{ marginTop: 10 }}>
                <span className="vlag">{x.blok}/{pad} stappen</span>
                <span className="vlag">{Object.keys(x.kaarten).length} kaarten</span>
                {openKaarten > 0 && <span className="vlag warmv">{openKaarten} open</span>}
                {x.spoor <= 2 && <span className="vlag">{x.punten} punten</span>}
              </div>
              {x.intentie && (
                <p className="klein muted" style={{ margin: '10px 0 0' }}>{x.intentie}</p>
              )}
              <div className="rij" style={{ marginTop: 10 }}>
                <button type="button" className="k rand klein" onClick={() => bewerkProfiel(x.id)}>
                  Instellingen
                </button>
                {verwijder === x.id
                  ? (
                    <>
                      <span className="klein" style={{ color: 'var(--fout)' }}>
                        {x.naam} verwijderen?
                      </span>
                      <button
                        type="button" className="k gevaar klein"
                        onClick={() => { zetVerwijder(null); wisProfiel(t, x.id) }}
                      >Ja</button>
                      <button
                        type="button" className="k rand klein" onClick={() => zetVerwijder(null)}
                      >Nee</button>
                    </>
                    )
                  : (
                    <button
                      type="button" className="k stil klein" onClick={() => zetVerwijder(x.id)}
                    >Verwijderen</button>
                    )}
              </div>
            </div>
          )
        })}
      </div>
      <button type="button" className="k rand vol" style={{ marginTop: 12 }} onClick={nieuwProfiel}>
        Profiel toevoegen
      </button>

      {p && (
        <>
          <hr className="regel" />
          <h3>Weergave</h3>
          <div className="kaart" style={{ marginTop: 10 }}>
            <div className="veldje">
              <label className="lbl" htmlFor="ouVocal">Klinkertekens (tashkil)</label>
              <select
                className="veld" id="ouVocal" value={p.voorkeur.vocalisatie}
                onChange={(e) => zetVoorkeur(t, { vocalisatie: e.target.value as Vocalisatie })}
              >
                {VOCALISATIES.map(([v, naam]) => <option value={v} key={v}>{naam}</option>)}
              </select>
              <p className="klein muted" style={{ margin: '6px 0 0' }}>
                Volledige vocalisatie helpt de beginner en remt de gevorderde. Spoor 1 en 2 staan
                standaard op volledig, spoor 3 en 4 op selectief.
              </p>
            </div>
            <div className="veldje">
              <label className="lbl" htmlFor="ouGeluid">Geluid</label>
              <select
                className="veld" id="ouGeluid" value={p.voorkeur.geluid ? '1' : '0'}
                onChange={(e) => zetVoorkeur(t, { geluid: e.target.value === '1' })}
              >
                <option value="1">Uitspraakknoppen aan</option>
                <option value="0">Uit</option>
              </select>
            </div>
            <div className="veldje" style={{ marginBottom: 0 }}>
              <label className="lbl" htmlFor="ouThema">Thema</label>
              <select
                className="veld" id="ouThema" value={t.stand.thema ?? 'auto'}
                onChange={(e) => t.zet((s) => ({ ...s, thema: e.target.value }))}
              >
                {THEMAS.map(([v, naam]) => <option value={v} key={v}>{naam}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <hr className="regel" />
      <h3>De code van dit scherm</h3>
      <div className="kaart" style={{ marginTop: 10 }}>
        <label className="veldje" style={{ marginTop: 0 }}>
          <span>Code</span>
          <input
            inputMode="numeric" defaultValue={t.stand.ouderPin || STANDAARDPIN}
            onBlur={(e) => zetPin(e.target.value)}
          />
        </label>
        {(t.stand.ouderPin || STANDAARDPIN) === STANDAARDPIN
          ? (
            <p className="small" style={{ marginTop: 8, color: 'var(--fout)' }}>
              Hij staat nog op <b>{STANDAARDPIN}</b>. Verander hem — dat is het enige dat dit
              scherm dichthoudt.
            </p>
            )
          : (
            <p className="small muted" style={{ marginTop: 8 }}>
              Leeg laten kan niet; dan geldt weer {STANDAARDPIN}.
            </p>
            )}
      </div>

      <h3 style={{ marginTop: 22 }}>Gegevens</h3>
      <p className="small muted">
        Een back-up is één JSON-bestand met alle profielen en hun voortgang. Zet hem terug op een
        ander toestel en je gaat verder waar je was.
      </p>
      <div className="rij" style={{ marginTop: 10 }}>
        <button type="button" className="k rand" onClick={() => zetBericht(exporteer(t.stand))}>
          Back-up opslaan
        </button>
        <label className="k rand" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          Back-up terugzetten
          <input
            type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void importeer(f, t, zetBericht)
            }}
          />
        </label>
      </div>
      {bericht}

      <div className="kaart" style={{ marginTop: 18, borderColor: 'var(--fout)' }}>
        <b style={{ color: 'var(--fout)' }}>Alles wissen</b>
        <p className="small muted" style={{ margin: '6px 0 10px' }}>
          Verwijdert alle profielen en alle voortgang van dit toestel. Dit kan niet ongedaan
          worden gemaakt.
        </p>
        {wisvraag
          ? (
            <>
              {/* Geen ingebouwd bevestigingsvenster: een inline bevestiging is duidelijker,
                  laat zich vormgeven en blijft binnen de app. */}
              <div className="melding waarschuwing" style={{ marginBottom: 10 }}>
                Weet je het zeker? Alle profielen verdwijnen.
              </div>
              <div className="rij">
                <button
                  type="button" className="k gevaar"
                  onClick={() => { zetWisvraag(false); t.zet(() => leeg()) }}
                >Ja, alles wissen</button>
                <button type="button" className="k rand" onClick={() => zetWisvraag(false)}>
                  Annuleren
                </button>
              </div>
            </>
            )
          : (
            <button type="button" className="k gevaar" onClick={() => zetWisvraag(true)}>
              Alles wissen
            </button>
            )}
      </div>

      <hr className="regel" />
      <h3>Hoe deze app werkt</h3>
      <div className="kaart small">
        <p>
          De herhaling gebruikt FSRS met een gewenste retentie van 0,90: per kaart wordt geschat
          hoe waarschijnlijk het is dat je hem nog weet, en hij komt terug op het moment dat die
          kans naar 90 procent zakt. Er is bewust geen streak — een gebroken reeks verlaagt het
          vervolggedrag, en dit schema kan niet breken omdat het altijd op vandaag staat.
        </p>
        <p>
          Meerkeuze wordt spaarzaam ingezet, want herkennen is makkelijker dan ophalen. Waar het
          kan typ of bouw je het antwoord zelf. Bij elke vraag volgt terugkoppeling, ook bij een
          goed antwoord.
        </p>
        <p style={{ marginBottom: 0 }}>
          Alleen verwarbare dingen worden door elkaar geoefend — ba, ta en tha bij elkaar, sin en
          shin bij elkaar. Letters, woorden en grammatica zitten nooit in dezelfde sessie.
        </p>
      </div>
    </div>
  )
}

function zetVoorkeur(t: Toestand, deel: Partial<Profiel['voorkeur']>): void {
  t.zetProf((pr) => ({ ...pr, voorkeur: { ...pr.voorkeur, ...deel } }))
}

function wisProfiel(t: Toestand, id: string): void {
  t.zet((s) => {
    const profielen = { ...s.profielen }
    delete profielen[id]
    return {
      ...s,
      profielen,
      actief: s.actief === id ? Object.keys(profielen)[0] ?? null : s.actief,
    }
  })
}

function exporteer(stand: Stand): ReactNode {
  const naam = 'lisan-backup-' + vandaag() + '.json'
  const blob = new Blob([JSON.stringify(stand, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = naam
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500)
  return <div className="melding" style={{ marginTop: 10 }}>Back-up opgeslagen als {naam}</div>
}

async function importeer(
  bestand: File, t: Toestand, meld: (n: ReactNode) => void,
): Promise<void> {
  let nieuw: Stand
  try {
    const gelezen = JSON.parse(await bestand.text()) as Stand
    if (!gelezen || typeof gelezen !== 'object' || typeof gelezen.profielen !== 'object') {
      throw new Error('geen geldig Arabisch-bestand')
    }
    nieuw = gelezen
  } catch (e) {
    meld(
      <div className="melding waarschuwing" style={{ marginTop: 10 }}>
        Dit bestand kon niet worden gelezen: {(e as Error).message}
      </div>,
    )
    return
  }
  const n = Object.keys(nieuw.profielen).length
  meld(
    <div className="melding waarschuwing" style={{ marginTop: 10 }}>
      Dit bestand bevat {n} profiel{n === 1 ? '' : 'en'}. Terugzetten vervangt alles wat er nu op
      dit toestel staat.
      <div className="rij" style={{ marginTop: 10 }}>
        <button
          type="button" className="k klein"
          onClick={() => {
            const actief = nieuw.actief && nieuw.profielen[nieuw.actief]
              ? nieuw.actief
              : Object.keys(nieuw.profielen)[0] ?? null
            t.zet(() => ({ ...nieuw, actief }))
            meld(null)
          }}
        >Terugzetten</button>
        <button type="button" className="k rand klein" onClick={() => meld(null)}>Annuleren</button>
      </div>
    </div>,
  )
}
