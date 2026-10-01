/**
 * DE BOUWSTENEN
 *
 * De oude app bouwde elk scherm op met dezelfde vier of vijf vormen (kaart,
 * knop, chip, balk, inklapbare uitleg) maar telkens opnieuw uitgeschreven als
 * string met de klassenamen erin. Hier staan ze één keer.
 *
 * Ze zijn met opzet dun: ze zetten een klasse en geven kinderen door. De stijl
 * blijft in stijl.css staan, waar hij te lezen is als samenhangend geheel in
 * plaats van verspreid over honderden losse attributen.
 */
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { Graad } from '@/gedeeld/db/tabellen'
import { Sfeervlak } from '../achtergronden'
import type { Sfeer } from '../achtergronden'

export function Kaart(
  { toon, plat, zij, sfeer, style, children }:
  {
    toon?: 'let' | 'fout' | 'goed' | undefined
    plat?: boolean | undefined
    /**
     * Een getekend motief achter de inhoud, in de accentkleur en op een dekking
     * die je niet los ziet. Het staat hier en niet bij de aanroeper omdat het
     * twee dingen tegelijk moet regelen (de klasse op de kaart en een laag
     * eronder) en dat is precies het soort verdubbeling dat ergens fout gaat
     * zodra er een derde kaart bijkomt. Waarom de motieven bestaan en wat de
     * dekking betekent, staat in `achtergronden.tsx`.
     */
    sfeer?: Sfeer | undefined
    /**
     * Op een breed scherm hoort deze kaart in de smalle kolom naast de inhoud.
     * Op de telefoon doet het niets, daar is er maar één kolom.
     *
     * Dit staat hier en niet in de CSS omdat de volgorde in de code de volgorde
     * op de telefoon ís, en die klopt. Welke kaart naar de zijkolom mag is een
     * uitspraak over wat die kaart betekent (een terzijde, geen hoofdlijn), en
     * die uitspraak hoort bij de kaart te staan en niet in een selector die op
     * volgnummer telt.
     */
    zij?: boolean | undefined
    style?: CSSProperties | undefined
    children: ReactNode
  },
) {
  const klas = ['kaart', toon ?? '', plat ? 'plat' : '', zij ? 'zijkolom' : '',
    sfeer ? 'metsfeer' : ''].filter(Boolean).join(' ')
  if (!sfeer) return <div className={klas} style={style}>{children}</div>
  /* De inhoud krijgt een eigen laag, anders ligt het motief eroverheen. Dat
     `position:relative` staat in `.metsfeer>*` en niet hier, zodat de stijl op
     één plek blijft. */
  return (
    <div className={klas} style={style}>
      <Sfeervlak soort={sfeer} />
      <div>{children}</div>
    </div>
  )
}

/**
 * De kop van een kaart. Optioneel met een wegwijzer ervoor, een getekend teken
 * dat zegt wát voor soort ding eronder staat. Welke koppen er één horen te
 * krijgen en waarom het er anders uitziet dan een herkomstteken, staat in
 * `tekens.tsx`.
 */
export function Kop(
  { teken: Teken, children }:
  { teken?: (() => ReactNode) | undefined; children: ReactNode },
) {
  if (!Teken) return <div className="eyebrow">{children}</div>
  return <div className="eyebrow metteken"><Teken />{children}</div>
}

export function Tussen(
  { style, children }: { style?: CSSProperties | undefined; children: ReactNode },
) {
  return <div className="tussen" style={style}>{children}</div>
}

export function Rij(
  { style, children }: { style?: CSSProperties | undefined; children: ReactNode },
) {
  return <div className="rij" style={style}>{children}</div>
}

export function Knop(
  { vol, klein, uit, opKlik, titel, style, children }:
  {
    vol?: boolean | undefined
    klein?: boolean | undefined
    uit?: boolean | undefined
    opKlik?: (() => void) | undefined
    titel?: string | undefined
    style?: CSSProperties | undefined
    children: ReactNode
  },
) {
  return (
    <button
      type="button"
      className={['knop', vol ? 'vol' : '', klein ? 'sm' : ''].filter(Boolean).join(' ')}
      onClick={opKlik}
      disabled={uit ?? false}
      aria-label={titel ?? undefined}
      style={style}
    >
      {children}
    </button>
  )
}

/** A etiket en gewogen · B etiket, portie geschat · C tabelwaarde · D ruwe schatting. */
export function Chip({ graad }: { graad: Graad }) {
  return <span className={'conf ' + graad} title={'Betrouwbaarheid ' + graad}>{graad}</span>
}

/**
 * Een aantikbaar chipje: een keuze uit een klein rijtje, zonder de zwaarte van
 * een knop. Bewust iets anders dan `Chip` hierboven, die is een label voor de
 * betrouwbaarheidsgraad en nooit aantikbaar. Twee dingen die er hetzelfde
 * uitzien maar niet hetzelfde doen zouden een vergissing zijn.
 */
export function Keuzechip(
  { aan, opKlik, titel, children }:
  { aan?: boolean | undefined; opKlik: () => void; titel?: string | undefined; children: ReactNode },
) {
  return (
    <button type="button" className={'chip' + (aan ? ' aan' : '')} aria-pressed={aan ?? false}
            title={titel} onClick={opKlik}>{children}</button>
  )
}

export function Balk({ deel, toon }: { deel: number; toon?: 'goed' | 'let' | undefined }) {
  return (
    <div className="balk">
      <i className={toon ?? ''} style={{ width: Math.max(0, Math.min(100, deel)) + '%' }} />
    </div>
  )
}

/**
 * Inklapbare onderbouwing. De stand staat per blok in localStorage: het scherm
 * werd vroeger bij elke wijziging opnieuw getekend en een <details> klapte dan
 * dicht terwijl je aan het lezen was. React hertekent niet meer op die manier,
 * maar de stand hoort ook een bezoek later nog te kloppen, dus hij blijft.
 */
/* Ook deze sleutel blijft: welke uitleg je open had staan hoort niet te
   verdwijnen omdat de app anders gaat heten. */
const SLEUTEL_UITLEG = 'kalibratie.uitleg'

function leesStand(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL_UITLEG) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

export function Uitleg(
  { id, label, children }: { id: string; label?: string | undefined; children: ReactNode },
) {
  const [open, zetOpen] = useState(false)
  useEffect(() => { zetOpen(leesStand()[id] ?? false) }, [id])

  const wissel = useCallback((e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const nu = e.currentTarget.open
    zetOpen(nu)
    try {
      localStorage.setItem(SLEUTEL_UITLEG, JSON.stringify({ ...leesStand(), [id]: nu }))
    } catch { /* een browser die opslag weigert mag de app niet stukmaken */ }
  }, [id])

  return (
    <details className="uitleg" open={open} onToggle={wissel}>
      <summary>{label ?? 'waarom'}</summary>
      <div className="inhoud mini">{children}</div>
    </details>
  )
}

/**
 * Een blok dat dicht begint, zijn stand onthoudt, en zijn inhoud pas aanmaakt
 * als hij opengaat.
 *
 * Verschilt van `Uitleg` op één punt dat er werkelijk toe doet: onder een
 * uitlegblok staat tekst die er toch al is, hier hangt wérk aan het opengaan,
 * een vraag aan de database. Daarom `{open && kinderen}` en geen verborgen
 * inhoud: wie de kaart nooit opent kost niets.
 *
 * De stand wordt bij dezelfde sleutel bewaard als die van `Uitleg`, want het is
 * hetzelfde soort geheugen en twee sleutels voor één ding lopen uit elkaar.
 */
export function Uitklap(
  { id, kop, teken, dicht, beginOpen, children }:
  {
    id: string; kop: string; teken?: (() => ReactNode) | undefined
    /** De regel onder de kop als hij dicht is: waarom zou je hem openen? */
    dicht?: string | undefined
    /**
     * Open bij het openen van het venster, wat er ook onthouden is.
     *
     * Dat "wat er ook onthouden is" is het punt: wie hier via een verwijzing
     * binnenkomt, komt voor dít stuk. Een eerder dichtgeklapte stand hoort die
     * bedoeling niet te overrulen, want dan klik je op een verwijzing en
     * gebeurt er zichtbaar niets.
     */
    beginOpen?: boolean | undefined
    children: ReactNode
  },
) {
  const [open, zetOpen] = useState(false)
  useEffect(() => { zetOpen(beginOpen ? true : leesStand()[id] ?? false) }, [id, beginOpen])

  const wissel = useCallback(() => {
    zetOpen((was) => {
      const nu = !was
      try {
        localStorage.setItem(SLEUTEL_UITLEG, JSON.stringify({ ...leesStand(), [id]: nu }))
      } catch { /* een browser die opslag weigert mag de app niet stukmaken */ }
      return nu
    })
  }, [id])

  return (
    <Kaart>
      <Tussen>
        <Kop teken={teken}>{kop}</Kop>
        <Keuzechip aan={open} opKlik={wissel}>{open ? 'dicht' : 'open'}</Keuzechip>
      </Tussen>
      {!open && dicht && <p className="mini" style={{ marginTop: 6 }}>{dicht}</p>}
      {open && children}
    </Kaart>
  )
}

/** Een venster met sluier. Klikken naast het venster sluit het. */
export function Venster(
  { titel, boven, onder, breed, opSluiten, children }:
  {
    titel: string
    /**
     * Een strook die vóór de titel komt en tot de rand doorloopt, een foto,
     * en verder niets wat gelezen moet worden. Hij staat hier en niet als
     * eerste kind, omdat hij buiten de binnenmarge van het venster valt: een
     * beeld dat tot de rand loopt kan een kind van dit onderdeel niet zelf
     * regelen zonder de marge terug te rekenen, en die som hoort op één plek.
     */
    boven?: ReactNode | undefined
    onder?: ReactNode | undefined
    /**
     * Voor een venster waar je in leest in plaats van iets invult: breder, met
     * meer lucht. Waarom dat geen smaak is, staat bij `.venster.breed`.
     */
    breed?: boolean | undefined
    opSluiten: () => void
    children: ReactNode
  },
) {
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => { if (e.key === 'Escape') opSluiten() }
    addEventListener('keydown', opToets)
    return () => removeEventListener('keydown', opToets)
  }, [opSluiten])

  return (
    <div className="sluier" onClick={(e) => { if (e.target === e.currentTarget) opSluiten() }}>
      <div className={'venster' + (breed ? ' breed' : '')} role="dialog" aria-modal="true"
           aria-label={titel}>
        {boven}
        <div className="tussen">
          <h2 style={{ fontSize: breed ? '1.4rem' : '1.2rem', lineHeight: 1.25 }}>{titel}</h2>
          <Knop klein opKlik={opSluiten} titel="Sluiten">×</Knop>
        </div>
        {onder}
        {children}
      </div>
    </div>
  )
}

export function Spin() {
  return <span className="spin" />
}
