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

export function Kaart({ tegel }: { tegel: AppTegel }) {
  return (
    <a className="app" href={tegel.href} style={kleurVan(tegel.k)}>
      <div className="kop">
        <img className="tegel" src={tegel.ico} alt="" width={50} height={50} />
        <h2>{tegel.naam}</h2>
        {tegel.oud && (
          <span className="oud">
            {tegel.oud} <span className="ar" lang="ar">{tegel.ar}</span>
          </span>
        )}
        <span className="rol">{tegel.wie}</span>
      </div>
      <p>{tegel.zin}</p>
      <div className="detail">{tegel.detail.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="pijl">Openen →</div>
    </a>
  )
}

export function Kaarten({ lijst }: { lijst: readonly AppTegel[] }) {
  const kind = lijst.filter((a) => a.groep === 'kind')
  const groot = lijst.filter((a) => a.groep === 'groot')
  return (
    <>
      {kind.length > 0 && (
        <section className="groep">
          <h2 className="groepkop">Voor de kinderen</h2>
          <div className="kaarten">{kind.map((a) => <Kaart key={a.id} tegel={a} />)}</div>
        </section>
      )}
      {groot.length > 0 && (
        <section className="groep">
          <h2 className="groepkop">Voor de groten</h2>
          <div className="kaarten smal">{groot.map((a) => <Kaart key={a.id} tegel={a} />)}</div>
        </section>
      )}
    </>
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
