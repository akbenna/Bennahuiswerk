/**
 * INSTELLINGEN — waar je voortgang staat, en wie er meeleest
 *
 * Vier kaarten: de centrale opslag, de eigen sleutel voor het model, de back-up
 * en het wisknopje. Wat ze delen is dat ze alle vier over vertrouwen gaan, en
 * dat de tekst daarom zegt wat er werkelijk gebeurt in plaats van het gerust te
 * stellen.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Melding } from '../onderdelen'
import type { Soort } from '../onderdelen'
import { bewaarSleutel, leesSleutel, lijktOpSleutel, wisSleutel } from '../ai'
import type { Losse } from '../opslag'
import type { Toestand } from '../toestand'

interface Bericht { tekst: string; soort: Soort }
const stil: Bericht = { tekst: '', soort: undefined }

export function Instellingen({ t }: { t: Toestand }): ReactNode {
  return (
    <>
      <h1>Instellingen</h1>
      <p className="lede muted" style={{ marginTop: 10, maxWidth: '58ch' }}>
        Waar je voortgang staat, en hoe de twee gespreksfuncties aan te zetten zijn.
      </p>
      <Opslag t={t} />
      <Sleutel />
      <Backup t={t} />
      <Wissen t={t} />
    </>
  )
}

function Opslag({ t }: { t: Toestand }): ReactNode {
  const [acc, zetAcc] = useState('')
  const [pin, zetPin] = useState('')
  const [bericht, zetBericht] = useState<Bericht>(stil)
  const { wolk } = t

  const kop = !wolk.aan
    ? 'Centrale opslag — alleen dit toestel'
    : wolk.bezig ? 'Bezig met gelijktrekken…'
      : wolk.fout ? 'Centrale opslag — storing' : 'Centrale opslag — verbonden'

  const trek = async (): Promise<void> => {
    zetBericht({ tekst: 'Bezig…', soort: undefined })
    const gelukt = await t.gelijktrekken()
    zetBericht(gelukt
      ? { tekst: 'Gelijkgetrokken. Alles op dit toestel en in de wolk is nu hetzelfde.', soort: 'goed' }
      : { tekst: 'Kon de centrale kopie niet ophalen. Er is niets verloren gegaan.', soort: 'fout' })
  }

  return (
    <div className="card" style={{ marginTop: 26 }}>
      <span className="meta">
        <span className={`status-bol${wolk.aan ? (wolk.fout ? ' fout' : ' aan') : ''}`} />
        <span>{kop}</span>
      </span>
      <p className="small" style={{ marginTop: 10, maxWidth: '62ch' }}>
        Met een account staat je voortgang niet op dit toestel maar centraal: afgeronde weken,
        kaarten en je logboek vind je terug op je telefoon, je laptop en de computer in de
        praktijk. Zonder internet werkt de app gewoon door en wordt er bij de eerstvolgende
        verbinding samengevoegd — nooit overschreven.
      </p>

      {wolk.aan ? (
        <>
          <p className="small" style={{ margin: '14px 0 0' }}>Ingelogd als <b>{wolk.account}</b>.</p>
          <div className="knoprij">
            <button className="btn ghost" disabled={wolk.bezig} onClick={() => void trek()}>
              Nu gelijktrekken
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                wolk.uitloggen()
                zetBericht({
                  tekst: 'Uitgelogd. Je voortgang blijft op dit toestel staan en de centrale kopie blijft bewaard.',
                  soort: undefined,
                })
              }}
            >Uitloggen op dit toestel</button>
          </div>
        </>
      ) : (
        <>
          <label className="veld">
            <span>Naam</span>
            <input value={acc} autoComplete="username" placeholder="abdelkader"
              onChange={(e) => zetAcc(e.target.value)} />
          </label>
          <label className="veld">
            <span>Wachtwoord</span>
            <input value={pin} type="password" autoComplete="current-password"
              placeholder="minstens vier tekens" onChange={(e) => zetPin(e.target.value)} />
          </label>
          <div className="knoprij">
            <button
              className="btn"
              onClick={() => void (async () => {
                const a = acc.trim().toLowerCase()
                if (!a || !pin) {
                  zetBericht({ tekst: 'Vul een naam en een wachtwoord in.', soort: 'fout' })
                  return
                }
                zetBericht({ tekst: 'Bezig…', soort: undefined })
                try {
                  await wolk.inloggen(a, pin)
                  zetPin('')
                  await trek()
                } catch (e) {
                  zetBericht({ tekst: e instanceof Error ? e.message : 'Inloggen mislukte.', soort: 'fout' })
                }
              })()}
            >Inloggen</button>
            <button
              className="btn ghost"
              onClick={() => void (async () => {
                const a = acc.trim().toLowerCase()
                if (!a || pin.length < 4) {
                  zetBericht({
                    tekst: 'Kies een naam en een wachtwoord van minstens vier tekens.', soort: 'fout',
                  })
                  return
                }
                zetBericht({ tekst: 'Bezig…', soort: undefined })
                try {
                  await wolk.registreren(a, pin, t.stand)
                  zetPin('')
                  zetBericht({
                    tekst: 'Account aangemaakt. Wat je hier al had staan is meteen meegenomen.',
                    soort: 'goed',
                  })
                } catch (e) {
                  zetBericht({ tekst: e instanceof Error ? e.message : 'Aanmaken mislukte.', soort: 'fout' })
                }
              })()}
            >Nieuw account</button>
          </div>
        </>
      )}

      <Melding {...bericht} />
      {wolk.fout && !bericht.tekst && (
        <Melding tekst={`Laatste poging mislukt: ${wolk.fout} Je werk staat veilig op dit toestel.`} soort="fout" />
      )}
    </div>
  )
}

function Sleutel(): ReactNode {
  const [waarde, zetWaarde] = useState(leesSleutel)
  const [bericht, zetBericht] = useState<Bericht>(() =>
    leesSleutel() ? { tekst: 'Er staat een sleutel op dit toestel.', soort: 'goed' } : stil)

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <span className="meta">Doorvragen en meelezen</span>
      <p className="small" style={{ marginTop: 10, maxWidth: '62ch' }}>
        Bij elke module kun je doorvragen, en je uitwerking van de toepassingsopdracht laten
        meelezen. Daarvoor is een eigen sleutel van Anthropic nodig. Die blijft in de browser van
        dit toestel staan en wordt niet centraal opgeslagen — op een ander toestel vul je hem
        opnieuw in. Zonder sleutel werkt de rest van de app volledig; alleen die twee knoppen
        geven dan een melding.
      </p>
      <label className="veld">
        <span>API-sleutel</span>
        <input type="password" autoComplete="off" placeholder="sk-ant-…"
          value={waarde} onChange={(e) => zetWaarde(e.target.value)} />
      </label>
      <div className="knoprij">
        <button
          className="btn"
          onClick={() => {
            const v = waarde.trim()
            if (!v) { zetBericht({ tekst: 'Plak eerst een sleutel.', soort: 'fout' }); return }
            if (!lijktOpSleutel(v)) {
              zetBericht({
                tekst: 'Dat ziet er niet uit als een sleutel van Anthropic; die begint met sk-ant-.',
                soort: 'fout',
              })
              return
            }
            try {
              bewaarSleutel(v)
              zetBericht({ tekst: 'Bewaard op dit toestel. Doorvragen en meelezen werken nu.', soort: 'goed' })
            } catch {
              zetBericht({ tekst: 'Kon niet opslaan in deze browser.', soort: 'fout' })
            }
          }}
        >Bewaren</button>
        <button
          className="btn ghost"
          onClick={() => {
            wisSleutel()
            zetWaarde('')
            zetBericht({ tekst: 'Verwijderd van dit toestel.', soort: undefined })
          }}
        >Verwijderen</button>
      </div>
      <Melding {...bericht} />
    </div>
  )
}

function Backup({ t }: { t: Toestand }): ReactNode {
  const [bericht, zetBericht] = useState<Bericht>(stil)

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <span className="meta">Back-up</span>
      <p className="small" style={{ marginTop: 10, maxWidth: '62ch' }}>
        Alles wat je hebt gedaan als één bestand, om te bewaren of over te zetten.
      </p>
      <div className="knoprij">
        <button
          className="btn ghost"
          onClick={() => {
            const blob = new Blob([JSON.stringify(t.stand, null, 1)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `sanad-${t.nu}.json`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 2000)
            zetBericht({ tekst: 'Bestand gedownload.', soort: 'goed' })
          }}
        >Exporteren</button>
        <label className="btn ghost" style={{ cursor: 'pointer' }}>
          Terugzetten
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => void (async () => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const binnen = JSON.parse(await f.text()) as Losse
                t.voegBij(binnen)
                zetBericht({ tekst: 'Teruggezet en samengevoegd met wat er al stond.', soort: 'goed' })
              } catch {
                zetBericht({ tekst: 'Dit bestand kon niet gelezen worden.', soort: 'fout' })
              }
            })()}
          />
        </label>
      </div>
      <Melding {...bericht} />
    </div>
  )
}

/** Twee keer klikken in plaats van een dialoogvenster: even bewust, geen pop-up. */
function Wissen({ t }: { t: Toestand }): ReactNode {
  const [gewapend, zetGewapend] = useState(false)
  const [bericht, zetBericht] = useState<Bericht>(stil)

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <span className="meta">Opnieuw beginnen</span>
      <p className="small" style={{ marginTop: 10, maxWidth: '62ch' }}>
        Wist alle voortgang op dit toestel: afgeronde weken, kaarten en logboek. Als je bent
        ingelogd wordt ook de centrale kopie leeggemaakt. Exporteer eerst als je twijfelt.
      </p>
      <div className="knoprij">
        <button
          className="btn ghost"
          onClick={() => void (async () => {
            if (!gewapend) {
              zetGewapend(true)
              zetBericht({ tekst: 'Dit kan niet ongedaan worden gemaakt.', soort: 'fout' })
              setTimeout(() => { zetGewapend(false); zetBericht(stil) }, 6000)
              return
            }
            zetGewapend(false)
            await t.wisAlles()
            zetBericht({ tekst: 'Alles gewist. Je kunt opnieuw beginnen.', soort: 'goed' })
          })()}
        >{gewapend ? 'Zeker weten? Klik nogmaals' : 'Alles wissen'}</button>
      </div>
      <Melding {...bericht} />
    </div>
  )
}
