/**
 * INSTELLINGEN — tempo, doel, tekst, klank, opslag en gegevens.
 */
import { useRef, useState } from 'react'
import { Kaart, Melding, Tag } from '../onderdelen'
import { doelSoeras } from '../planning'
import type { SoeraInfo } from '../planning'
import { datum, leeg, vul } from '../opslag'
import type { Instellingen as Inst, Lezing, Stand, Volgorde } from '../opslag'
import { laadSoera, totaalAya } from '../koran'
import type { Recitatie } from '../audio'
import type { useWolk } from '@/gedeeld/wolk'

const fouttekst = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export function Instellingen(
  { stand, index, recitatie, wolk, zetInstel, zetStand, opGelijktrekken }:
  {
    stand: Stand
    index: readonly SoeraInfo[]
    recitatie: Recitatie
    wolk: ReturnType<typeof useWolk>
    zetInstel: (i: Partial<Inst>) => void
    zetStand: (s: Stand) => void
    opGelijktrekken: () => Promise<void>
  },
) {
  const vast = Object.values(stand.aya).filter((t) => t.vast).length
  const i = stand.instel

  return (
    <>
      <div><h1>Instellingen</h1></div>

      <div className="grid g2">
        <Kaart>
          <h3>Tempo en doel</h3>
          <Keuze label="Tijd per dag" waarde={i.minuten} opZet={(v) => zetInstel({ minuten: +v })}
                 opties={[[10, '10 minuten'], [15, '15'], [20, '20'], [25, '25'], [30, '30'],
                          [45, '45'], [60, '60 minuten']]} />
          <Keuze label="Hoogstens nieuw per dag" waarde={i.maxNieuw}
                 opZet={(v) => zetInstel({ maxNieuw: +v })}
                 opties={[[1, '1 aya'], [2, '2'], [3, '3'], [5, '5'], [8, '8 aya']]} />
          <div className="rij" style={{ gap: 10 }}>
            <Keuze breed label="Doel van soera" waarde={i.doelVan}
                   opZet={(v) => zetInstel({ doelVan: +v })}
                   opties={index.map((s) => [s.nr, `${s.nr}. ${s.naam}`])} />
            <Keuze breed label="tot en met" waarde={i.doelTot}
                   opZet={(v) => zetInstel({ doelTot: +v })}
                   opties={index.map((s) => [s.nr, `${s.nr}. ${s.naam}`])} />
          </div>
          <div className="rij" style={{ marginTop: 8 }}>
            {([[78, 114, "Juz 'amma"], [67, 114, 'Laatste twee juz'],
               [1, 114, 'De hele Koran']] as const).map(([van, tot, label]) => (
              <button key={label} type="button" className="btn ghost sm"
                      onClick={() => zetInstel({ doelVan: van, doelTot: tot })}>{label}</button>
            ))}
          </div>
          <Keuze label="Volgorde" waarde={i.volgorde}
                 opZet={(v) => zetInstel({ volgorde: v as Volgorde })}
                 opties={[['kort', 'Kortste soera eerst'], ['achter', 'Van achteren naar voren'],
                          ['voor', 'Van voren naar achteren']]} />
        </Kaart>

        <Kaart>
          <h3>Tekst en klank</h3>
          <Keuze label="Lezing" waarde={i.lezing} opZet={(v) => zetInstel({ lezing: v as Lezing })}
                 opties={[['warsh', 'Warsh — zoals in de Maghreb'],
                          ['hafs', 'Hafs — de meest verspreide druk']]} />
          <Keuze label="Tempo van de recitatie" waarde={i.tempo}
                 opZet={(v) => zetInstel({ tempo: parseFloat(v) })}
                 opties={[[0.75, 'Langzaam'], [1, 'Gewoon'], [1.25, 'Vlot']]} />
          <p className="klein" style={{ marginTop: 12 }}>
            De Warsh-tekst komt van het King Fahd-complex en past bij de Warsh-recitatie die in Islam
            leren staat. Ziet een teken er vreemd uit, dan mist je toestel het juiste lettertype; zet
            dan Hafs aan — de tekst is dezelfde openbaring, alleen anders overgeleverd.
          </p>
          <p className="klein" style={{ marginTop: 8 }}>
            Recitatie beschikbaar voor <b>{recitatie.aantal}</b> aya's
            {recitatie.bron && ` (${recitatie.bron})`}. Voor de rest van je doel haal je hem op met{' '}
            <span className="meta" style={{ textTransform: 'none' }}>
              node rasikh/audio/haal-audio.mjs
            </span> — zie LEESMIJ.md in die map.
          </p>
        </Kaart>
      </div>

      <Offline stand={stand} index={index} />

      <Kaart>
        <h3>Waarom het zo werkt</h3>
        <p className="klein" style={{ marginTop: 8 }}>
          De tijd die je opgeeft wordt éérst gevuld met herhalen. Wat overblijft bepaalt hoeveel
          nieuwe aya's erbij mogen. Blijft er niets over, dan komt er niets bij. Dat voelt langzaam in
          de eerste weken en redt je in het tweede jaar.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Wie op zijn eenenvijftigste begint heeft geen tekort aan begrip maar aan herhaaltijd.
          Daarom staat betekenis vóór klank in de zes stappen, en daarom worden de verwarpunten apart
          getraind: dat zijn de twee plekken waar een volwassen geheugen wint of verliest.
        </p>
      </Kaart>

      <Wolkkaart wolk={wolk} stand={stand} opGelijktrekken={opGelijktrekken} />

      <Gegevens stand={stand} index={index} vast={vast} zetStand={zetStand} />
    </>
  )
}

function Keuze(
  { label, waarde, opties, opZet, breed }:
  {
    label: string
    waarde: string | number
    opties: ReadonlyArray<readonly [string | number, string]>
    opZet: (v: string) => void
    breed?: boolean
  },
) {
  return (
    <label className="veld" style={breed ? { flex: 1 } : undefined}>
      <span>{label}</span>
      <select value={String(waarde)} onChange={(e) => opZet(e.target.value)}>
        {opties.map(([v, l]) => <option key={v} value={String(v)}>{l}</option>)}
      </select>
    </label>
  )
}

/**
 * Klaarzetten is niets anders dan de bestanden één keer ophalen: de servicewerker
 * bewaart ze dan vanzelf. Rustig aan, vier tegelijk.
 */
function Offline({ stand, index }: { stand: Stand; index: readonly SoeraInfo[] }) {
  const [melding, zetMelding] = useState<{ tekst: string; soort?: 'goed' | 'let' } | null>(null)
  const [bezig, zetBezig] = useState(false)
  const van = Math.min(stand.instel.doelVan, stand.instel.doelTot)
  const tot = Math.max(stand.instel.doelVan, stand.instel.doelTot)

  async function klaarzetten() {
    zetBezig(true)
    const rij = doelSoeras(index, stand.instel).map((s) => s.nr)
    const totaalAantal = rij.length
    let n = 0, mis = 0
    const doe = async () => {
      for (;;) {
        const nr = rij.shift()
        if (nr == null) return
        try { await laadSoera(nr) } catch { mis++ }
        n++
        zetMelding({ tekst: `${n} van de ${totaalAantal} soera's klaargezet…` })
      }
    }
    await Promise.all([doe(), doe(), doe(), doe()])
    try { await fetch('tekst/mutashabihat.json') } catch { /* geeft niet */ }
    zetMelding(mis
      ? { tekst: `${n - mis} soera's staan klaar, ${mis} lukten niet. Probeer het zo nog eens.`, soort: 'let' }
      : { tekst: 'Klaar. Je doel staat op dit toestel, ook zonder verbinding.', soort: 'goed' })
    zetBezig(false)
  }

  return (
    <Kaart>
      <h3>Zonder internet</h3>
      <p className="klein" style={{ marginTop: 6 }}>
        Wat je opent blijft op je toestel staan. Wil je zeker weten dat je hele doel meegaat in de
        trein of op reis, zet het dan van tevoren klaar: dat haalt de tekst van soera {van} tot en met{' '}
        {tot} binnen.
      </p>
      <div className="rij" style={{ marginTop: 12 }}>
        <button type="button" className="btn ghost sm" disabled={bezig}
                onClick={() => void klaarzetten()}>Doel klaarzetten</button>
      </div>
      <Melding tekst={melding?.tekst ?? null} soort={melding?.soort} />
    </Kaart>
  )
}

function Wolkkaart(
  { wolk, stand, opGelijktrekken }:
  { wolk: ReturnType<typeof useWolk>; stand: Stand; opGelijktrekken: () => Promise<void> },
) {
  const [acc, zetAcc] = useState('')
  const [ww, zetWw] = useState('')
  const [melding, zetMelding] = useState<{ tekst: string; soort?: 'goed' | 'fout' } | null>(null)
  const zeg = (tekst: string, soort?: 'goed' | 'fout') =>
    zetMelding({ tekst, ...(soort ? { soort } : {}) })

  return (
    <Kaart>
      <h3>Centrale opslag</h3>
      <p className="klein" style={{ marginTop: 5 }}>
        Met een account staat je voortgang op elk toestel gelijk: begin op de bank op je telefoon, ga
        verder op de laptop. Zonder internet werkt alles gewoon door; bij de volgende verbinding
        wordt het samengevoegd — er gaat nooit iets verloren.
      </p>
      <p className="klein" style={{ marginTop: 5 }}>
        Voor een reeks van jaren is dat geen luxe. Alles wat hier staat — wat vast is, wanneer het
        terugkomt, waar je haperde — bestaat anders op één toestel.
      </p>
      <p className="klein" style={{ marginTop: 9 }}>
        <Tag toon={wolk.aan ? 'goed' : ''}>
          {wolk.aan ? `Ingelogd als ${wolk.account}` : 'Alleen op dit toestel'}
        </Tag>
        {wolk.fout && <> <Tag toon="fout">{wolk.fout}</Tag></>}
      </p>

      {wolk.aan ? (
        <div className="rij" style={{ marginTop: 14 }}>
          <button type="button" className="btn ghost sm" onClick={wolk.uitloggen}>Uitloggen</button>
          <button type="button" className="btn ghost sm"
                  onClick={async () => {
                    zeg('Bezig…')
                    try { await opGelijktrekken(); zeg('Gelijkgetrokken.', 'goed') }
                    catch (e) { zeg(fouttekst(e), 'fout') }
                  }}>
            Nu gelijktrekken
          </button>
        </div>
      ) : (
        <>
          <label className="veld">
            <span>Account</span>
            <input placeholder="benna" autoComplete="username" value={acc}
                   onChange={(e) => zetAcc(e.target.value)} />
          </label>
          <label className="veld">
            <span>Wachtwoord</span>
            <input type="password" autoComplete="current-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          <div className="rij" style={{ marginTop: 14 }}>
            <button type="button" className="btn"
                    onClick={async () => {
                      if (!acc.trim() || !ww) { zeg('Vul een account en een wachtwoord in.', 'fout'); return }
                      zeg('Bezig…')
                      try {
                        await wolk.inloggen(acc.trim(), ww)
                        await opGelijktrekken()
                        zeg('Ingelogd en gelijkgetrokken.', 'goed')
                      } catch (e) { zeg(fouttekst(e), 'fout') }
                    }}>
              Inloggen
            </button>
            <button type="button" className="btn ghost"
                    onClick={async () => {
                      if (!acc.trim() || ww.length < 4) {
                        zeg('Kies een naam en een wachtwoord van minstens vier tekens.', 'fout')
                        return
                      }
                      zeg('Bezig…')
                      try { await wolk.registreren(acc.trim(), ww, stand); zeg('Account aangemaakt.', 'goed') }
                      catch (e) { zeg(fouttekst(e), 'fout') }
                    }}>
              Nieuw account
            </button>
          </div>
        </>
      )}
      <Melding tekst={melding?.tekst ?? null} soort={melding?.soort} />
    </Kaart>
  )
}

function Gegevens(
  { stand, index, vast, zetStand }:
  { stand: Stand; index: readonly SoeraInfo[]; vast: number; zetStand: (s: Stand) => void },
) {
  const bestand = useRef<HTMLInputElement>(null)
  const [melding, zetMelding] = useState<{ tekst: string; soort?: 'goed' | 'fout' } | null>(null)

  return (
    <Kaart>
      <h3>Gegevens</h3>
      <p className="klein" style={{ marginTop: 6 }}>
        {vast} aya's vastgelegd · {stand.log.length} dagen geschiedenis · tekst: {index.length}{' '}
        soera's, {totaalAya(index)} aya's
      </p>
      <div className="rij" style={{ marginTop: 12 }}>
        <button type="button" className="btn ghost sm"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(
                    new Blob([JSON.stringify(stand, null, 1)], { type: 'application/json' }))
                  a.download = 'rasikh-' + datum() + '.json'
                  a.click()
                }}>
          Opslaan als bestand
        </button>
        <button type="button" className="btn ghost sm" onClick={() => bestand.current?.click()}>
          Inlezen
        </button>
        <input ref={bestand} type="file" accept="application/json" style={{ display: 'none' }}
               onChange={async (e) => {
                 const f = e.target.files?.[0]
                 if (!f) return
                 try {
                   const j = JSON.parse(await f.text()) as Partial<Stand>
                   if (!j.aya) throw new Error('geen rasikh-bestand')
                   zetStand(vul(j))
                   zetMelding({ tekst: 'Ingelezen.', soort: 'goed' })
                 } catch {
                   zetMelding({ tekst: 'Dat bestand kon niet gelezen worden.', soort: 'fout' })
                 }
               }} />
        <button type="button" className="btn ghost sm" style={{ color: 'var(--fout)' }}
                onClick={() => {
                  if (confirm('Alles wissen? Alle voortgang gaat weg.')) zetStand(leeg())
                }}>
          Alles wissen
        </button>
      </div>
      <Melding tekst={melding?.tekst ?? null} soort={melding?.soort} />
    </Kaart>
  )
}
