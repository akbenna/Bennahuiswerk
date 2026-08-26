/**
 * RASIKH — de Koran vastzetten.
 *
 * Voor een volwassene met weinig tijd en veel geheugen. Het uitgangspunt is
 * omgekeerd aan de meeste apps: niet "hoeveel leer je erbij" maar "hoeveel houd
 * je vast". Nieuwe stof komt er pas bij als de herhalingen bij zijn.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWolk } from '@/gedeeld/wolk'
import { useRecitatie } from './audio'
import { laadIndex } from './koran'
import {
  beoordeeld, dueLijst, doelTotaal, doelVast, vastgezet,
} from './planning'
import type { SoeraInfo } from './planning'
import {
  dagNu, datum, leeg, lees, samenvoegen, schrijf, vul,
} from './opslag'
import type { Cijfer, Instellingen as Inst, Stand } from './opslag'
import { Vandaag } from './schermen/Vandaag'
import { Nieuw } from './schermen/Nieuw'
import { Herhalen } from './schermen/Herhalen'
import { Verwarring } from './schermen/Verwarring'
import { Kaart } from './schermen/Kaart'
import { Instellingen } from './schermen/Instellingen'

const TABS = [
  ['vandaag', 'Vandaag'], ['nieuw', 'Nieuw'], ['herhalen', 'Herhalen'],
  ['verwarring', 'Verwarring'], ['kaart', 'Kaart'], ['instel', 'Instellingen'],
] as const
type Tab = (typeof TABS)[number][0]

export function App() {
  const [stand, zetStandRuw] = useState<Stand>(leeg)
  const [index, zetIndex] = useState<SoeraInfo[] | null>(null)
  const [tekstMist, zetTekstMist] = useState(false)
  const [tab, zetTab] = useState<Tab>('vandaag')
  const [dag, zetDag] = useState(dagNu)

  const wolk = useWolk('rasikh')
  const recitatie = useRecitatie()

  const nu = useRef(stand)
  nu.current = stand

  const bewaar = useCallback((s: Stand) => {
    zetStandRuw(s)
    schrijf(s)
    wolk.bewaar(s)
  }, [wolk])

  /* Ophalen, samenvoegen, terugschrijven. In die volgorde, want alleen zo weet
     je zeker dat het andere toestel ook krijgt wat hier gebeurd is. */
  const gelijktrekken = useCallback(async () => {
    const ver = await wolk.ophalen()
    let s = nu.current
    if (ver && typeof ver === 'object' && ('aya' in ver || 'log' in ver)) {
      s = samenvoegen(s, ver as Partial<Stand>)
    }
    s = { ...s, laatste: new Date().toISOString() }
    zetStandRuw(s)
    schrijf(s)
    wolk.bewaar(s, true)
  }, [wolk])

  useEffect(() => {
    let af = false
    void (async () => {
      const opgeslagen = vul(await lees())
      if (!af) zetStandRuw(opgeslagen)
      try {
        const { index: idx } = await laadIndex()
        if (!af) zetIndex(idx)
      } catch {
        if (!af) zetTekstMist(true)
      }
    })()
    return () => { af = true }
  }, [])

  useEffect(() => {
    if (!index || !wolk.aan) return
    void gelijktrekken()
    // alleen bij het openen en na het inloggen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, wolk.aan])

  /* Bij het wegleggen van de telefoon nog één keer wegschrijven, zonder de
     gebruikelijke wachttijd — anders gaat de laatste beoordeling verloren. */
  useEffect(() => {
    const weg = () => { if (wolk.aan) wolk.bewaar(nu.current, true) }
    addEventListener('pagehide', weg)
    return () => removeEventListener('pagehide', weg)
  }, [wolk])

  /* Over de dagovergang heen blijven kloppen: wie om half één 's nachts nog
     bezig is, hoort morgenvroeg de nieuwe dag te zien zonder te herladen. */
  useEffect(() => {
    const t = setInterval(() => zetDag(dagNu()), 60_000)
    return () => clearInterval(t)
  }, [])

  const zetInstel = useCallback((i: Partial<Inst>) => {
    /* Elke wijziging krijgt een tijdstempel: bij het samenvoegen tellen de
       jongste instellingen, zodat een doel dat je op je telefoon verzet niet
       wordt teruggedraaid door de oudere stand op je laptop. */
    bewaar({
      ...nu.current,
      instel: { ...nu.current.instel, ...i },
      instelD: new Date().toISOString(),
    })
  }, [bewaar])

  const logDag = (s: Stand, x: { nieuw?: number; herhaald?: number }): Stand => {
    const d = datum(dagNu())
    const log = s.log.some((r) => r.d === d) ? [...s.log] : [...s.log, { d, nieuw: 0, herhaald: 0 }]
    const i = log.findIndex((r) => r.d === d)
    const r = log[i]
    if (r) log[i] = { d, nieuw: r.nieuw + (x.nieuw ?? 0), herhaald: r.herhaald + (x.herhaald ?? 0) }
    return { ...s, log: log.slice(-500), laatste: d }
  }

  const opBeoordeeld = useCallback((id: string, cijfer: Cijfer) => {
    const s = nu.current
    bewaar(logDag(
      { ...s, aya: { ...s.aya, [id]: beoordeeld(s.aya[id], cijfer, dagNu()) } },
      { herhaald: 1 }))
  }, [bewaar])

  const opVastgezet = useCallback((id: string) => {
    const s = nu.current
    bewaar(logDag(
      { ...s, aya: { ...s.aya, [id]: vastgezet(s.aya[id], dagNu()) } },
      { nieuw: 1 }))
  }, [bewaar])

  if (tekstMist) {
    return (
      <main className="wrap">
        <div className="card" style={{ marginTop: 20 }}>
          <h2>De tekst ontbreekt</h2>
          <p style={{ marginTop: 8 }}>
            De map <b>tekst/</b> is niet gevonden. Zonder die bestanden kan Rasikh niets doen.
          </p>
        </div>
      </main>
    )
  }

  const open = index ? dueLijst(stand, dag).length : 0
  const vast = index ? doelVast(stand, stand.instel) : 0
  const totaal = index ? doelTotaal(index, stand.instel) : 0

  return (
    <div className="schil">
      <header className="top">
        <div className="top-in">
          <a className="terug" href="/" title="Terug naar BennaHub" aria-label="Terug naar BennaHub">←</a>
          <span className="brand">Koran uit je hoofd<em lang="ar">رَاسِخ</em></span>
          <span className="tegen">{index ? `${vast} van ${totaal} vast` : ''}</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Onderdelen">
        <div className="tabs-in" role="tablist">
          {TABS.map(([sleutel, label]) => (
            <button key={sleutel} type="button" className="tab" role="tab"
                    aria-selected={tab === sleutel}
                    onClick={() => { recitatie.stop(); zetTab(sleutel); scrollTo(0, 0) }}>
              {label}
              {sleutel === 'herhalen' && open > 0 && <span className="bol">{open}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main className="wrap">
        <section className="view on" role="tabpanel">
          <div className="stack">
            {!index ? <p className="meta">Bezig met laden…</p>
             : tab === 'vandaag' ? (
              <Vandaag stand={stand} index={index} dag={dag} naarTab={zetTab} />
            ) : tab === 'nieuw' ? (
              <Nieuw stand={stand} index={index} dag={dag} recitatie={recitatie}
                     opVastgezet={opVastgezet} naarVandaag={() => zetTab('vandaag')} />
            ) : tab === 'herhalen' ? (
              <Herhalen stand={stand} dag={dag} recitatie={recitatie} opBeoordeeld={opBeoordeeld} />
            ) : tab === 'verwarring' ? (
              <Verwarring stand={stand} index={index} />
            ) : tab === 'kaart' ? (
              <Kaart stand={stand} index={index} dag={dag}
                     opDoel={(nr) => zetInstel({ doelVan: nr, doelTot: nr })} />
            ) : (
              <Instellingen stand={stand} index={index} recitatie={recitatie} wolk={wolk}
                            zetInstel={zetInstel} zetStand={bewaar}
                            opGelijktrekken={gelijktrekken} />
            )}
          </div>
        </section>

        <footer>
          <p>
            Deze app stuurt op behoud. Nieuwe stof komt er pas bij als de herhalingen bij zijn — dat
            is geen strengheid maar de enige manier waarop memoriseren op de lange duur standhoudt.
          </p>
          <p>
            De Arabische tekst is de druk van het King Fahd-complex — Warsh en Hafs — met de
            vertaling van Fred Leemhuis. De recitatie komt uit Islam leren, aan te vullen met het
            script in <span style={{ whiteSpace: 'nowrap' }}>rasikh/audio/</span>. Leg de tekst één
            keer naast een moshaf voordat je iets vastzet.
          </p>
          <p className="meta" style={{ marginTop: 12 }}>Onderdeel van BennaHub</p>
        </footer>
      </main>
    </div>
  )
}
