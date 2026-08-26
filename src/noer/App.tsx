/**
 * ISLAM LEREN — de basis van de islam, voor het hele gezin
 *
 * Vier kinderen van zeven tot vijftien in één app, elk met een eigen profiel en
 * een eigen leerlijn. Wat het spoor bepaalt is de leeftijd: dezelfde module
 * geeft een kind van acht drie korte alinea's en een kind van veertien
 * dezelfde stof met de fiqh-termen en het meningsverschil erbij.
 *
 * De fiqh volgt de Malikitische school. Waar andere scholen het anders doen
 * staat dat erbij, zonder oordeel.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNoer } from './toestand'
import { niveauVan } from './voortgang'
import { leegProg } from './opslag'
import { Blad, Kortje } from './onderdelen'
import { Geluidbron } from './luisteren'
import { TABS, GEBED_NAV } from './tabs'
import type { Gebedtab, Tab } from './tabs'
import { Vandaag } from './schermen/Vandaag'
import { Leerpad } from './schermen/Leerpad'
import { Oefenen } from './schermen/Oefenen'
import { Wudu } from './schermen/Wudu'
import { Stappen } from './schermen/Stappen'
import { Bidmee } from './schermen/Bidmee'
import { Hifz } from './schermen/Hifz'
import { AlleGebeden, Bijzonder, Duas, Fouten } from './schermen/Naslag'
import { Tijden } from './schermen/Tijden'
import { Beloning } from './schermen/Beloning'
import { Ouder } from './schermen/Ouder'

export function App(): ReactNode {
  const t = useNoer()
  const [tab, zetTab] = useState<Tab>('vandaag')
  const [gebedtab, zetGebedtab] = useState<Gebedtab>('wudu')
  const [wie, zetWie] = useState(false)
  const [kortje, zetKortje] = useState('')

  const ga = (v: Tab): void => { zetTab(v); scrollTo({ top: 0 }) }
  const naarGebed = (k: Gebedtab): void => {
    zetGebedtab(k)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* De achtergrond volgt het spoor van het kind dat aan de beurt is: de app
     ziet er voor een kind van acht anders uit dan voor een van veertien. */
  const spoor = t.profiel ? String(t.spoor) : '3'

  return (
    <Geluidbron inst={t.stand.instel} meld={zetKortje}>
      <div data-spoor={spoor} data-view={tab}
           className={'schil' + (t.stand.instel.groot ? ' groot' : '')}>
        <header className="top">
          <div className="top-in">
            <a className="terug" href="/" title="Terug naar BennaHub" aria-label="Terug naar BennaHub">←</a>
            <span className="brand">Islam leren<em lang="ar">نور الإسلام</em></span>
            <div className="wie">
              <button
                type="button"
                onClick={() => (t.stand.profielen.length ? zetWie(true) : ga('ouder'))}
              >
                <span className="bol" style={t.profiel ? { background: t.profiel.kleur } : undefined}>
                  {t.profiel ? t.profiel.naam[0] : '?'}
                </span>
                <span>{t.profiel ? t.profiel.naam : 'Kies wie je bent'}</span>
              </button>
            </div>
          </div>
        </header>

        <nav className="tabs" aria-label="Onderdelen">
          <div className="tabs-in" role="tablist">
            {TABS.map(([v, label]) => (
              <button key={v} className="tab" role="tab" aria-selected={tab === v} onClick={() => ga(v)}>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="wrap">
          <section className="view on" role="tabpanel" key={tab}>
            {tab === 'vandaag' && <div className="stack"><Vandaag t={t} ga={ga} /></div>}
            {tab === 'leerpad' && <div className="stack"><Leerpad t={t} ga={ga} /></div>}
            {tab === 'gebed' && (
              <div className="stack">
                <div>
                  <h1>Leren bidden</h1>
                  <p className="klein" style={{ marginTop: 6 }}>
                    Van wassen tot de slotgroet. Alles staat er stap voor stap in: wat je zegt,
                    wat je doet, wat moet en wat mooi is om te doen. Volgens de Malikitische
                    school, de school van thuis.
                  </p>
                </div>
                <div className="rij" role="tablist" aria-label="Onderdelen van het gebed">
                  {GEBED_NAV.map(([k, n]) => (
                    <button
                      key={k} className={`btn sm ${gebedtab === k ? '' : 'ghost'}`}
                      onClick={() => naarGebed(k)}
                    >{n}</button>
                  ))}
                </div>
                <div>
                  {gebedtab === 'wudu' && <Wudu t={t} />}
                  {gebedtab === 'stappen' && <Stappen t={t} />}
                  {gebedtab === 'mee' && <Bidmee t={t} ga={ga} />}
                  {gebedtab === 'hifz' && <Hifz t={t} ga={ga} />}
                  {gebedtab === 'alle' && <AlleGebeden naar={naarGebed} />}
                  {gebedtab === 'bijzonder' && <Bijzonder t={t} />}
                  {gebedtab === 'duas' && <Duas t={t} />}
                  {gebedtab === 'fouten' && <Fouten />}
                </div>
              </div>
            )}
            {tab === 'tijden' && <div className="stack"><Tijden t={t} ga={ga} /></div>}
            {tab === 'oefenen' && <div className="stack"><Oefenen t={t} ga={ga} /></div>}
            {tab === 'beloning' && <div className="stack"><Beloning t={t} ga={ga} /></div>}
            {tab === 'ouder' && <div className="stack"><Ouder t={t} /></div>}
          </section>

          <footer>
            <p>
              Islam leren bewaart je voortgang op dit toestel en — als er een gezinsaccount is
              ingesteld — ook centraal, zodat je op elke telefoon of tablet verder gaat waar je
              gebleven was. Zonder internet werkt alles gewoon door.
            </p>
            <p>
              De fiqh volgt de Malikitische school. Waar andere scholen het anders doen, staat
              dat erbij. De gebedstijden zijn berekend en bedoeld ter oriëntatie; houd de
              kalender van je eigen moskee aan.
            </p>
            <p className="meta" style={{ marginTop: 14 }}>Gebouwd voor het gezin Benna</p>
          </footer>
        </main>

        <Blad open={wie} sluit={() => zetWie(false)}>
          <h2>Wie ben je?</h2>
          <div className="stack" style={{ marginTop: 16 }}>
            {t.stand.profielen.map((p) => {
              const pr = t.stand.data[p.id] ?? leegProg()
              const nv = niveauVan(pr.punten)
              return (
                <button
                  className="card klik" key={p.id} style={{ padding: '14px 16px' }}
                  onClick={() => { t.zet((s) => ({ ...s, actief: p.id })); zetWie(false) }}
                >
                  <div className="rij">
                    <span
                      className="bol"
                      style={{ background: p.kleur, width: 34, height: 34, fontSize: '.95rem' }}
                    >{p.naam[0]}</span>
                    <div style={{ flex: 1 }}>
                      <b>{p.naam}</b>
                      <div className="klein">
                        {nv.ico} {nv.naam} · {pr.punten} punten · {pr.reeks} dagen op rij
                      </div>
                    </div>
                    {t.stand.actief === p.id && <span className="tag k">Nu</span>}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="rij" style={{ marginTop: 18 }}>
            <button className="btn ghost" onClick={() => { zetWie(false); ga('ouder') }}>
              Ouderscherm
            </button>
          </div>
        </Blad>

        <Kortje tekst={kortje} />
      </div>
    </Geluidbron>
  )
}
