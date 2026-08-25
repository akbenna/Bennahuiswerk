/** De vormen die op meerdere schermen van de startpagina terugkomen. */
import type { CSSProperties, ReactNode } from 'react'
import type { AppTegel } from './apps'
import type { Ik } from './sessie'
import { hoofd } from './opmaak'

/** De kleur van een persoon of een app als CSS-variabelen. */
export const kleurVan = (naam: string, voorvoegsel = 'k'): CSSProperties =>
  ({ [`--${voorvoegsel}`]: `var(--${naam})`, [`--${voorvoegsel}bg`]: `var(--${naam}-bg)` }) as CSSProperties

export const persoonKleur = (kleur: string): CSSProperties =>
  ({ '--pk': `var(--${kleur})`, '--pbg': `var(--${kleur}-bg)` }) as CSSProperties

export function Merk() {
  return <div className="merk"><span className="b">Benna</span>Hub</div>
}

export function Kaart({ tegel, featured = false }: { tegel: AppTegel; featured?: boolean }) {
  return (
    <a className={'app' + (featured ? ' featured' : '')} href={tegel.href} style={kleurVan(tegel.k)}>
      <div className="app-topline">
        <div className="app-icon-wrap">
          <img className="tegel" src={tegel.ico} alt="" width={50} height={50} />
        </div>
        <div className="app-heading">
          <div className="app-title-row">
            <h2>{tegel.naam}</h2>
            {tegel.oud && <span className="oud">{tegel.oud}</span>}
          </div>
          {tegel.ar && <span className="app-ar" lang="ar">{tegel.ar}</span>}
          <span className="rol">{tegel.wie}</span>
        </div>
        <span className="app-open">Openen <span aria-hidden="true">↗</span></span>
      </div>
      <p className="app-description">{tegel.zin}</p>
      <div className="detail">{tegel.detail.map((d) => <span key={d}>{d}</span>)}</div>
    </a>
  )
}

function sortApps(lijst: readonly AppTegel[]) {
  const volgorde = ['huiswerk', 'bidaya', 'lisan', 'bunyan', 'raha', 'health', 'academie', 'sanad', 'rasikh']
  return [...lijst].sort((a, b) => volgorde.indexOf(a.id) - volgorde.indexOf(b.id))
}

export function Kaarten({ lijst }: { lijst: readonly AppTegel[] }) {
  const gesorteerd = sortApps(lijst)
  const kind = gesorteerd.filter((a) => a.groep === 'kind')
  const groot = gesorteerd.filter((a) => a.groep === 'groot')

  return (
    <div className="app-portaal">
      {kind.length > 0 && (
        <section className="groep app-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Leren &amp; ontdekken</p>
              <h2 className="groepkop">Voor de kinderen</h2>
              <p className="section-intro">Kies een app en ga meteen verder waar je gebleven bent.</p>
            </div>
            <span className="section-count">{kind.length} apps</span>
          </div>
          <div className="kaarten kind-grid">
            {kind.map((a, i) => <Kaart key={a.id} tegel={a} featured={i === 0} />)}
          </div>
        </section>
      )}

      {groot.length > 0 && (
        <section className="groep app-section adults-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Verdieping &amp; dagelijks gebruik</p>
              <h2 className="groepkop">Voor de groten</h2>
              <p className="section-intro">Persoonlijke tools, studie en verdieping op één plek.</p>
            </div>
            <span className="section-count">{groot.length} apps</span>
          </div>
          <div className="kaarten adult-grid">
            {groot.map((a, i) => <Kaart key={a.id} tegel={a} featured={i === 0} />)}
          </div>
        </section>
      )}
    </div>
  )
}

export function Balk(
  { ik, breed, naarOverzicht, naarWachtwoord, opAfmelden }:
  {
    ik: Ik
    breed?: boolean
    naarOverzicht: () => void
    naarWachtwoord: () => void
    opAfmelden: () => void
  },
) {
  return (
    <div className={'balk' + (breed ? ' breed' : '')} style={persoonKleur(ik.kleur)}>
      <div className="in">
        <span className="gezichtje">{ik.emoji}</span>
        <span className="wie">{hoofd(ik.naam)}</span>
        <span className="rest">
          {ik.rol === 'ouder' && (
            <button type="button" className="btn ghost sm" onClick={naarOverzicht}>Overzicht</button>
          )}
          <button type="button" className="btn ghost sm" onClick={naarWachtwoord}>Wachtwoord</button>
          <button type="button" className="btn sm" onClick={opAfmelden}>Afmelden</button>
        </span>
      </div>
    </div>
  )
}

export function Voet() {
  return (
    <footer>
      <p>
        Elke app bewaart je voortgang op dit toestel én centraal, dus je vindt hem op elk toestel
        terug; zonder internet werkt alles gewoon door en wordt er later gelijkgetrokken.
      </p>
      <p className="meta" style={{ marginTop: 16 }}>Gebouwd voor het gezin Benna</p>
    </footer>
  )
}

export function Codekaart(
  { kleur, children }: { kleur?: string | undefined; children: ReactNode },
) {
  return (
    <div className="codekaart" style={kleur ? persoonKleur(kleur) : undefined}>{children}</div>
  )
}

export function Melding({ tekst, goed }: { tekst: string | null; goed?: boolean }) {
  return <p className={'melding' + (goed ? ' goed' : '')}>{tekst ?? ''}</p>
}
