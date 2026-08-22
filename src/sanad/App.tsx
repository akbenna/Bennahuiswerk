/**
 * GELOOFSSTUDIE — achtentwintig weken Malikitische fiqh
 *
 * Een leerprogramma voor een volwassene met een beroep: vijftig minuten op een
 * vaste avond, en vijf tot tien minuten kaarten op de andere dagen. Het ritme
 * is met opzet traag; wat het programma bouwt is oriëntatie en leesvaardigheid,
 * geen fatwabevoegdheid.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSanad } from './toestand'
import { KAARTEN } from './gegevens/kaarten'
import { actieveKaarten, dueKaarten } from './kaartplanner'
import { TOT, actieveWeek, openSporen } from './programma'
import { Week } from './schermen/Week'
import { Programma } from './schermen/Programma'
import { Herhaling } from './schermen/Herhaling'
import { Bronnen } from './schermen/Bronnen'
import { Lexicon } from './schermen/Lexicon'
import { Logboek } from './schermen/Logboek'
import { Instellingen } from './schermen/Instellingen'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const TABS = [
  ['week', 'Deze week'], ['programma', 'Programma'], ['herhaling', 'Herhaling'],
  ['bronnen', 'Bronnen'], ['lexicon', 'Lexicon'], ['logboek', 'Logboek'],
  ['instel', 'Instellingen'],
] as const
type Tab = (typeof TABS)[number][0]

export function App(): ReactNode {
  const t = useSanad()
  const [tab, zetTab] = useState<Tab>('week')
  const [weekNr, zetWeekNr] = useState<number | null>(null)

  const { stand, nu } = t
  const open = openSporen(stand.klaar)
  const due = dueKaarten(
    actieveKaarten(KAARTEN, open, stand.alles), stand.cards, nu as IsoDatum).length
  const gedaan = Object.keys(stand.klaar).length

  const ga = (v: Tab): void => { zetTab(v); scrollTo({ top: 0 }) }
  const naarWeek = (n: number): void => { zetWeekNr(n); ga('week') }

  return (
    <>
      <header className="top">
        <div className="top-in">
          <a className="terug" href="/" title="Terug naar BennaHub" aria-label="Terug naar BennaHub">←</a>
          <span className="brand">Geloofsstudie<em lang="ar">سند</em></span>
          <span className="top-sub">
            {stand.start ? `week ${actieveWeek(stand.klaar)} · ${gedaan}/${TOT}` : 'nog niet gestart'}
          </span>
        </div>
      </header>

      <nav className="tabs">
        <div className="tabs-in" role="tablist">
          {TABS.map(([v, label]) => (
            <button
              key={v}
              className="tab"
              role="tab"
              aria-selected={tab === v}
              onClick={() => ga(v)}
            >
              {label}
              {v === 'herhaling' && due > 0 && <span className="dot">{due}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main>
        <section className="view on" key={tab}>
          <div className="wrap">
            {tab === 'week' && (
              <Week
                stand={stand} nu={nu} zet={t.zet}
                nr={weekNr} zetNr={zetWeekNr}
                naarHerhaling={() => ga('herhaling')}
              />
            )}
            {tab === 'programma' && <Programma stand={stand} naarWeek={naarWeek} />}
            {tab === 'herhaling' && <Herhaling stand={stand} nu={nu} zet={t.zet} />}
            {tab === 'bronnen' && <Bronnen />}
            {tab === 'lexicon' && <Lexicon />}
            {tab === 'logboek' && <Logboek stand={stand} />}
            {tab === 'instel' && <Instellingen t={t} />}
          </div>
        </section>

        <footer className="foot">
          <div className="wrap">
            <p className="small muted" style={{ margin: 0 }}>
              Geloofsstudie · achtentwintig weken · Malikitische fiqh, usul, ‘aqida,
              bronnenkritiek en medische ethiek<br />
              Arabische teksten zijn gezet naar de gangbare edities; controleer bij twijfel een
              gedrukte uitgave.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
