/**
 * COMPUTERS & CODE — een pc bouwen en leren programmeren
 *
 * Twee sporen naast elkaar voor een jongen van elf. Het eerste — wat er in een
 * computer zit — is een middag werk; het tweede — hem iets laten doen — een
 * paar jaar. Daarom staat er elke dag maar één stap op het scherm.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { CODE } from './gegevens/code'
import { PC } from './gegevens/pc'
import type { Blok } from './gegevens/soorten'
import { useBunyan } from './toestand'
import { euro } from '@/gedeeld/getal'
import { INSIGNES, blokInsignes, rangVan, spoorVan } from './voortgang'
import { LEGE_BOUW, SOORTEN, bouwPrijs } from './bouwbank'
import type { Bouwstand } from './bouwbank'
import { Vandaag } from './schermen/Vandaag'
import { Spoor } from './schermen/Spoor'
import { Les } from './schermen/Les'
import { Werkbank } from './schermen/Werkbank'
import { Bouwbank } from './schermen/Bouwbank'
import { Beloning } from './schermen/Beloning'
import { Ouder } from './schermen/Ouder'

const TABS = [
  ['vandaag', 'Vandaag'], ['code', 'Coderen'], ['pc', 'Bouwen'],
  ['bank', 'Werkbank'], ['beloning', 'Beloning'], ['ouder', 'Ouder'],
] as const
type Tab = (typeof TABS)[number][0]

/** Welk blad er in de werkbank open staat. */
type Bank = 'werk' | 'bouw'

export function App(): ReactNode {
  const t = useBunyan()
  const [tab, zetTab] = useState<Tab>('vandaag')
  const [bank, zetBank] = useState<Bank>('werk')
  const [les, zetLes] = useState<{ blokken: Blok[]; bi: number; li: number } | null>(null)
  const [bouw, zetBouw] = useState<Bouwstand>(LEGE_BOUW)
  const [bouwMeld, zetBouwMeld] = useState('')

  const { stand } = t
  const rang = rangVan(stand.punten)

  const ga = (v: Tab): void => {
    zetTab(v)
    scrollTo({ top: 0 })
  }

  const openLes = (blokken: Blok[]) => (bi: number, li: number): void => {
    zetLes({ blokken, bi, li })
    scrollTo({ top: 0 })
  }

  /* De achtergrondkleur volgt het spoor waar je in zit: groen bij coderen,
     oranje bij bouwen. Dat is het enige onderscheid dat een kind nodig heeft
     om te weten waar hij is. */
  const spoor = les ? spoorVan(les.blokken[les.bi]?.lessen[les.li]?.id ?? '')
    : tab === 'code' ? 'code' : tab === 'pc' ? 'pc' : ''

  const bewaarBouw = (naam: string, gemiddeld: number): string => {
    t.zet((s) => {
      const na = {
        ...s,
        bouwsels: [...s.bouwsels, {
          id: 'b' + Date.now(), naam, d: t.klok.vandaag,
          delen: Object.fromEntries(SOORTEN.map((x) => [x, bouw[x] ?? ''])),
        }],
      }
      const verdiend: string[] = []
      if (bouwPrijs(bouw) <= bouw.budget) verdiend.push('budget')
      if (gemiddeld >= 100) verdiend.push('fps')
      for (const id of [...verdiend, ...blokInsignes(na)]) {
        if (!na.insignes.includes(id)) na.insignes = [...na.insignes, id]
      }
      return na
    })
    const nieuw = [
      ...(bouwPrijs(bouw) <= bouw.budget && !stand.insignes.includes('budget') ? ['budget'] : []),
      ...(gemiddeld >= 100 && !stand.insignes.includes('fps') ? ['fps'] : []),
    ].map((id) => INSIGNES.find((i) => i.id === id)).filter((i) => i !== undefined)
    const melding = 'Bewaard.'
      + (nieuw.length ? ' Insigne erbij: ' + nieuw.map((i) => `${i.ico} ${i.n}`).join(', ') : '')
    zetBouwMeld(melding)
    return melding
  }

  return (
    <div className="schil" data-spoor={spoor}>
      <header className="top">
        <div className="top-in">
          <a className="terug" href="/" title="Terug naar BennaHub" aria-label="Terug naar BennaHub">←</a>
          <span className="brand">Computers &amp; Code<em>Bunyan</em></span>
          <span className="tegen">
            <span>{rang[2]} {stand.punten}</span>
            <span className="munt">{euro(stand.saldo)}</span>
          </span>
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
          <div className="stack">
            {tab === 'vandaag' && (
              <Vandaag stand={stand} nu={t.klok.vandaag} ga={(v) => ga(v)} />
            )}
            {tab === 'code' && (
              <Spoor
                stand={stand} blokken={CODE} kop="Coderen"
                onder={'Eerst Python, want daarin zie je met één regel wat je doet. Daarna de talen '
                  + 'van het web, en aan het eind hoe je verder gaat op je eigen computer.'}
                opLes={openLes(CODE)}
              />
            )}
            {tab === 'pc' && (
              <Spoor
                stand={stand} blokken={PC} kop="Een pc bouwen"
                onder={'Eerst weten wat er in zit en waarom, dan pas schroeven. Onderaan staat de '
                  + 'bouwbank om te oefenen met kiezen.'}
                opLes={openLes(PC)}
                staart={(
                  <div className="card kleur" style={{ marginTop: 22 }}>
                    <h3>🧰 De bouwbank</h3>
                    <p className="klein" style={{ marginTop: 6 }}>
                      Stel een pc samen binnen een budget. De bank rekent uit of alles bij elkaar
                      past, hoeveel stroom je nodig hebt en hoeveel fps je ongeveer haalt in de
                      spellen die jij speelt.
                    </p>
                    <div className="rij" style={{ marginTop: 12 }}>
                      <button className="btn" onClick={() => { zetBank('bouw'); ga('bank') }}>
                        Open de bouwbank
                      </button>
                    </div>
                  </div>
                )}
              />
            )}
            {tab === 'bank' && bank === 'werk' && (
              <Werkbank
                stand={stand} nu={t.klok.vandaag} zet={t.zet}
                naarBouwbank={() => zetBank('bouw')}
              />
            )}
            {tab === 'bank' && bank === 'bouw' && (
              <Bouwbank
                bouw={bouw} zetBouw={(b) => { zetBouw(b); zetBouwMeld('') }}
                stand={stand} nu={t.klok.vandaag}
                bewaar={bewaarBouw} bericht={bouwMeld}
                naarWerkbank={() => zetBank('werk')}
              />
            )}
            {tab === 'beloning' && <Beloning stand={stand} />}
            {tab === 'ouder' && <Ouder t={t} />}
          </div>
        </section>

        <footer>
          <p>
            Deze app leert twee dingen tegelijk: hoe je een computer in elkaar zet en hoe je hem
            iets laat doen. Het eerste is een middag werk, het tweede een paar jaar — daarom
            staat hier elke dag maar één stap.
          </p>
          <p>
            De Python hierin draait in je browser en is met de hand gebouwd voor deze app. Hij
            kent genoeg voor het eerste jaar. Wat je hier leert werkt precies zo in de echte
            Python op een pc, en zodra je toe bent aan meer staat in de laatste module wat je
            dan installeert.
          </p>
          <p className="meta">Onderdeel van BennaHub</p>
        </footer>
      </main>

      {les && (
        <div
          className="overlay on"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) zetLes(null) }}
        >
          <div className="blad">
            <Les
              blokken={les.blokken} bi={les.bi} li={les.li}
              stand={stand} klok={t.klok} zet={t.zet}
              ga={(bi, li) => zetLes({ blokken: les.blokken, bi, li })}
              sluit={() => zetLes(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
