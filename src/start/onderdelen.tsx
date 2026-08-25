/** De vormen die op meerdere schermen van de startpagina terugkomen. */
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { AppTegel, Groep } from './apps'
import type { Ik } from './sessie'
import { hoofd, nu, stilte } from './opmaak'
import type { Voortgang } from './voortgang'
import {
  TekenBoek, TekenGrafiek, TekenHuis, TekenHulp, TekenKalender, TekenKlok,
  TekenLamp, TekenRaster, TekenSleutel, TekenSter, TekenUit,
} from './tekens'

/** De kleur van een persoon of een app als CSS-variabelen. */
export const kleurVan = (naam: string, voorvoegsel = 'k'): CSSProperties =>
  ({ [`--${voorvoegsel}`]: `var(--${naam})`, [`--${voorvoegsel}bg`]: `var(--${naam}-bg)` }) as CSSProperties

export const persoonKleur = (kleur: string): CSSProperties =>
  ({ '--pk': `var(--${kleur})`, '--pbg': `var(--${kleur}-bg)` }) as CSSProperties

export function Merk() {
  return <div className="merk"><span className="b">Benna</span>Hub</div>
}

/* ---------------------------------------------------------------------------
   DE TWEE GROEPEN

   Wat er per groep boven de kaarten staat. Het staat hier als gegevens omdat de
   zijbalk dezelfde namen en dezelfde tekentjes gebruikt: één plek wijzigen.
--------------------------------------------------------------------------- */
export interface Groepkop { groep: Groep; anker: string; titel: string; onder: string }

export const GROEPEN: readonly Groepkop[] = [
  { groep: 'kind', anker: 'kinderen', titel: 'Voor de kinderen', onder: 'Leren wordt leuk' },
  { groep: 'groot', anker: 'groten', titel: 'Voor de groten', onder: 'Verdieping en dagelijks gebruik' },
]

const groepTeken = (g: Groep) => (g === 'kind' ? <TekenRaster /> : <TekenBoek />)

/* ---------------------------------------------------------------------------
   DE KAARTEN

   Eén app per groep staat groot: dat is de app waar je in negen van de tien
   gevallen naartoe gaat, en die hoort niet even breed te zijn als de rest. De
   volgorde in apps.ts bepaalt wie dat is — daar staat het huiswerk bovenaan bij
   de kinderen, en de geloofsstudie bij de groten.
--------------------------------------------------------------------------- */

export function Uitgelicht({ tegel, stand }: { tegel: AppTegel; stand?: Voortgang | undefined }) {
  return (
    <a className="uitgelicht" href={tegel.href} style={kleurVan(tegel.k)}>
      <span className="merkje"><TekenSter /> Begin hier</span>
      <img className="uitico" src={tegel.ico} alt="" width={92} height={92} />
      <h3>{tegel.naam}</h3>
      {tegel.oud && (
        <span className="uitoud">
          {tegel.oud}
          {tegel.ar && <> · <span className="ar" lang="ar">{tegel.ar}</span></>}
        </span>
      )}
      <p>{tegel.zin}</p>
      {stand
        ? <Strook stand={stand} />
        : <div className="detail">{tegel.detail.slice(0, 3).map((d) => <span key={d}>{d}</span>)}</div>}
      <span className="opknop">Open {tegel.naam} <span aria-hidden="true">→</span></span>
    </a>
  )
}

/** "Gisteren", of "Selma · gisteren" als de cijfers van iemand anders zijn. */
const wanneer = (stand: Voortgang): { tekst: string; klasse: string } => {
  const st = stilte(stand.laatst)
  return { tekst: stand.wie ? `${hoofd(stand.wie)} · ${st.tekst}` : st.tekst, klasse: st.klasse }
}

export function Tegelkaart({ tegel, stand }: { tegel: AppTegel; stand?: Voortgang | undefined }) {
  const st = stand ? wanneer(stand) : null
  return (
    <a className="appt" href={tegel.href} style={kleurVan(tegel.k)}>
      <img className="apptico" src={tegel.ico} alt="" width={44} height={44} />
      <h3>{tegel.naam}</h3>
      {stand && (
        <span className="apptcijfers">
          {stand.cellen.slice(0, 2).map(([label, waarde]) => (
            <span key={label}>{label} <b>{waarde}</b></span>
          ))}
        </span>
      )}
      <span className="apptrij">
        {/* Waar de app over gaat, tot je hem gebruikt hebt; daarna hoe lang het
            geleden is — dat is dan het antwoord waar je voor komt kijken. */}
        {st
          ? <span className={'speld ' + st.klasse}>{st.tekst}</span>
          : <span className="apptzin">{tegel.kort}</span>}
        <span className="apptpijl" aria-hidden="true">→</span>
      </span>
    </a>
  )
}

/** De cijfers op de grote kaart: drie getallen groot, met eronder waar ze over
 *  gaan, en rechts hoe lang het geleden is. */
function Strook({ stand }: { stand: Voortgang }) {
  return (
    <div className="uitstand">
      {stand.cellen.slice(0, 3).map(([label, waarde]) => (
        <span className="uitcijfer" key={label}>
          <b>{waarde}</b>
          <span>{label}</span>
        </span>
      ))}
      {/* Hier geen gekleurd speldje. De kleuren van `stilte` zijn gemeten tegen
          een lichte kaart; op een vlak dat de kleur van zijn app draagt zijn ze
          onleesbaar. Wat er staat — "vandaag", "vier dagen geleden" — zegt het
          zelf al, en dat haalt op elk van de negen vlakken zijn contrast. */}
      <span className="uitlaatst">{wanneer(stand).tekst}</span>
    </div>
  )
}

/** Eén blok: de kop, de grote kaart, en de tegels ernaast. */
export function Appgroep(
  { kop, lijst, standen }:
  { kop: Groepkop; lijst: readonly AppTegel[]; standen: ReadonlyMap<string, Voortgang> },
) {
  const [eerste, ...rest] = lijst
  if (!eerste) return null
  return (
    <section className="groep" id={kop.anker}>
      <div className="groepkop">
        <span className="groepico">{groepTeken(kop.groep)}</span>
        <span className="groeptekst">
          <h2>{kop.titel}</h2>
          <span className="klein">{kop.onder}</span>
        </span>
        <span className="groeptel">{lijst.length} {lijst.length === 1 ? 'app' : 'apps'}</span>
      </div>
      <div className="groeplijf">
        <Uitgelicht tegel={eerste} stand={standen.get(eerste.id)} />
        {rest.length > 0 && (
          <div className="tegelraster">
            {rest.map((a) => <Tegelkaart key={a.id} tegel={a} stand={standen.get(a.id)} />)}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   DE ZIJBALK

   Hij draagt drie dingen tegelijk: het merk, de weg naar de twee groepen, en de
   knoppen die bij jouw account horen. Daarom staat er ook geen aparte balk meer
   bovenaan het hubscherm — dat was hetzelfde, twee keer.

   Wat er in staat, bestaat ook echt. Er is geen "Berichten" en geen "Planning",
   dus er staat er ook geen; een menu-item dat niets doet is erger dan een menu
   dat kort is.
--------------------------------------------------------------------------- */

/** Welke groep staat er in beeld? De zijbalk licht die op. Zonder waarnemer —
 *  een oude browser, een proef in jsdom — blijft simpelweg 'boven' staan; dat
 *  is een gemis aan opsmuk en niet aan werking. */
function useInBeeld(ankers: readonly string[]): string {
  const [aan, zetAan] = useState<string>('boven')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const delen = ['boven', ...ankers]
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e !== null)
    if (!delen.length) return
    const zichtbaar = new Set<string>()
    const kijker = new IntersectionObserver(
      (rijen) => {
        for (const r of rijen) {
          if (r.isIntersecting) zichtbaar.add(r.target.id)
          else zichtbaar.delete(r.target.id)
        }
        /* De bovenste die je ziet wint: bij scrollen komt de volgende sectie
           onderin binnen beeld terwijl de vorige nog boven staat, en dan hoort
           de vorige nog steeds op te lichten. */
        const eerste = delen.find((e) => zichtbaar.has(e.id))
        if (eerste) zetAan(eerste.id)
      },
      /* Alleen de bovenste veertig procent van het venster telt mee. Kijk je
         naar het midden, dan zou bovenaan de pagina de eerste groep al oplichten
         terwijl je nog naar de begroeting kijkt. */
      { rootMargin: '0px 0px -62% 0px' },
    )
    delen.forEach((e) => kijker.observe(e))
    return () => kijker.disconnect()
  }, [ankers.join('|')])
  return aan
}

export function Zijbalk(
  { ik, groepen, naarOverzicht, naarWachtwoord, opAfmelden }:
  {
    ik: Ik | null
    groepen: readonly Groepkop[]
    naarOverzicht: () => void
    naarWachtwoord: () => void
    opAfmelden: () => void
  },
) {
  const aan = useInBeeld(groepen.map((g) => g.anker))
  const link = (anker: string, teken: ReactNode, tekst: string) => (
    <a key={anker} className={'zijlink' + (aan === anker ? ' aan' : '')} href={`#${anker}`}>
      {teken}<span>{tekst}</span>
    </a>
  )
  return (
    <aside className="zij">
      <div className="zijkop">
        <img src="/iconen/hub.svg" alt="" width={46} height={46} />
        <Merk />
        <p className="zijzin">Jouw plek om te leren, ontdekken en groeien</p>
      </div>

      <nav className="zijnav" aria-label="Startpagina">
        {link('boven', <TekenHuis />, 'Start')}
        {groepen.map((g) => link(g.anker, groepTeken(g.groep), g.titel))}
      </nav>

      {ik && (
        <>
          <p className="zijgroep">Jouw account</p>
          <nav className="zijnav" aria-label="Account">
            {ik.rol === 'ouder' && (
              <button type="button" className="zijlink" onClick={naarOverzicht}>
                <TekenGrafiek /><span>Overzicht</span>
              </button>
            )}
            <button type="button" className="zijlink" onClick={naarWachtwoord}>
              <TekenSleutel /><span>Wachtwoord</span>
            </button>
            <button type="button" className="zijlink" onClick={opAfmelden}>
              <TekenUit /><span>Afmelden</span>
            </button>
          </nav>
        </>
      )}

      <div className="zijvoet">
        <TekenHulp />
        <p>Loop je vast? Vraag papa of mama — zij komen overal bij.</p>
      </div>
    </aside>
  )
}

/* ---------------------------------------------------------------------------
   HET ONTHAAL — de begroeting met de klok en jouw kaartje ernaast.
--------------------------------------------------------------------------- */

/** De klok loopt door. Elke halve minuut kijken is genoeg voor een weergave die
 *  alleen uren en minuten toont, en het scheelt een timer die elke seconde de
 *  hele kop opnieuw laat tekenen. */
function useKlok() {
  const [t, zetT] = useState(() => nu())
  useEffect(() => {
    const tik = setInterval(() => zetT(nu()), 30_000)
    return () => clearInterval(tik)
  }, [])
  return t
}

export function Onthaal(
  { ik, naarOverzicht, naarWachtwoord }:
  { ik: Ik; naarOverzicht: () => void; naarWachtwoord: () => void },
) {
  const t = useKlok()
  const ouder = ik.rol === 'ouder'
  return (
    <header className="welkom" id="boven">
      <div className="welkomtekst">
        {/* Een harde spatie voor het zwaaien: anders valt de hand op een smal
            scherm op een eigen regel onder de naam. */}
        <h1>Hallo {hoofd(ik.naam)}!{'\u00A0'}<span className="zwaai" aria-hidden="true">👋</span></h1>
        <p className="lede">Kies waar je mee verder wilt — alles wat je doet, komt op jouw naam te staan.</p>
      </div>
      <div className="welkomkaarten">
        <div className="mkaart">
          <span className="mico"><TekenKalender /></span>
          <span className="mtekst">
            <span className="klein">{t.dag}</span>
            <strong>{t.datum}</strong>
            <span className="mtijd"><TekenKlok /> {t.tijd}</span>
          </span>
        </div>
        <div className="mkaart" style={persoonKleur(ik.kleur)}>
          <span className="gezichtje">{ik.emoji}</span>
          <span className="mtekst">
            <strong>{hoofd(ik.naam)}</strong>
            <span className="klein">
              {ouder ? 'Ouder — jij ziet alle apps en alle voortgang' : 'Jouw eigen plek, met jouw eigen code'}
            </span>
            <button type="button" className="mlink"
                    onClick={ouder ? naarOverzicht : naarWachtwoord}>
              {ouder ? 'Bekijk het overzicht' : 'Wachtwoord wijzigen'} <span aria-hidden="true">→</span>
            </button>
          </span>
        </div>
      </div>
    </header>
  )
}

/** De balk onderaan, in de vorm van de tip uit het ontwerp — maar met iets erin
 *  dat ergens heen gaat. */
export function Snelbalk() {
  return (
    <div className="snelbalk">
      <span className="snelico"><TekenLamp /></span>
      <strong>Rechtstreeks naar een cursus</strong>
      <span className="snellinks">
        <a href="huiswerk/cursussen/kompas.html">Kompas</a>
        <a href="huiswerk/cursussen/communicatie.html">Verbind</a>
        <a href="huiswerk/cursussen/presenteren.html">Podium</a>
      </span>
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
      <p>
        De cijfers op de kaarten komen van dit toestel — van het account dat hier het laatst in die
        app aanstond. Op een ander toestel staat er dus wat daar gedaan is, tot beide bij zijn.
      </p>
      <p className="meta">Gebouwd voor het gezin Benna</p>
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
