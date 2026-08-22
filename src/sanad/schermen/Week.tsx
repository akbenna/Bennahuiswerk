/**
 * DEZE WEEK — vijf stappen
 *
 * Kernvraag, brontekst, uitleg, toepassing, toets. De volgorde is de didactiek:
 * eerst de vraag zonder het antwoord, dan de bron vóór de uitleg erover, en pas
 * daarna wat het betekent. De toepassingsopdracht staat vóór de toets, want het
 * eigen voorbeeld is wat de stof vasthoudt, niet het juiste antwoord.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { PROGRAMMA, TOT, actieveWeek, planWeek, weekTitel } from '../programma'
import { DAGEN } from '../gegevens/dagen'
import { MatnBlok, Rijk, Tag, nul } from '../onderdelen'
import { Antwoord, useGesprek } from '../gesprek'
import { SYS } from '../ai'
import type { Stand } from '../opslag'

export const FASEN = ['Kernvraag', 'Brontekst', 'Uitleg', 'Toepassing', 'Toets'] as const

interface Props {
  stand: Stand
  nu: string
  zet: (f: (s: Stand) => Stand) => void
  /** Het weeknummer dat getoond wordt; `null` betekent: waar je bent gebleven. */
  nr: number | null
  zetNr: (n: number | null) => void
  naarHerhaling: () => void
}

export function Week({ stand, nu, zet, nr, zetNr, naarHerhaling }: Props): ReactNode {
  const [fase, zetFase] = useState(0)
  const [net, zetNet] = useState<number | null>(null)
  const [gekozen, zetGekozen] = useState<number | null>(null)
  const [notitie, zetNotitie] = useState<string | null>(null)
  const [bewaard, zetBewaard] = useState(false)

  const doorvragen = useGesprek()
  const meelezen = useGesprek()
  const [vraagtekst, zetVraagtekst] = useState('')

  if (!stand.start) return <Beginnen nu={nu} zet={zet} />

  const huidig = nr ?? actieveWeek(stand.klaar)
  const w = PROGRAMMA[huidig - 1]
  if (!w) return <p className="muted small">Die week bestaat niet.</p>

  /* Van scherm wisselen zet de stappen terug op nul; dat gaat via zetNr. */
  const naarWeek = (n: number): void => {
    zetNr(n)
    zetFase(0)
    zetGekozen(null)
    zetNotitie(null)
    zetNet(null)
    scrollTo({ top: 0 })
  }

  if (net !== null) {
    const af = PROGRAMMA[net - 1]!
    const volg = actieveWeek(stand.klaar)
    const gedaan = Object.keys(stand.klaar).length
    return (
      <div style={{ padding: '30px 0' }}>
        <Tag kleur="green">Week {net} afgerond</Tag>
        <h1 style={{ marginTop: 16 }}>{gedaan} van {TOT}</h1>
        <p className="lede muted" style={{ marginTop: 12, maxWidth: '52ch' }}>
          De kaarten van blok {af.sp.nr} staan nu open. Doe de komende dagen een korte
          ronde; dat is waar de spreiding zijn werk doet.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn" onClick={naarHerhaling}>Kaarten</button>
          {volg !== net && (
            <button className="btn ghost" onClick={() => naarWeek(volg)}>Naar week {volg}</button>
          )}
        </div>
      </div>
    )
  }

  const af = Boolean(stand.klaar[w.nr])
  const pw = planWeek(stand.start, nu)
  const tekst = notitie ?? stand.notities[w.nr] ?? ''

  const bewaarNotitie = (t: string): void => {
    zet((s) => ({ ...s, notities: { ...s.notities, [w.nr]: t } }))
    zetBewaard(true)
  }

  const rondAf = (): void => {
    if (notitie !== null) bewaarNotitie(notitie)
    zet((s) => ({
      ...s,
      klaar: { ...s.klaar, [w.nr]: nu },
      ...(notitie !== null ? { notities: { ...s.notities, [w.nr]: notitie } } : {}),
    }))
    zetNet(w.nr)
    scrollTo({ top: 0 })
  }

  const Toepassing = (
    <>
      <div className="opdracht">
        <span className="meta">Toepassing</span>
        {w.type === 'les'
          ? w.ex.doe
          : 'Werk de derde taak van de vorige stap hier schriftelijk uit. Schrijf voor jezelf over vijf jaar.'}
      </div>
      <textarea
        className="notitie"
        value={tekst}
        placeholder={w.type === 'les'
          ? 'Schrijf hier. Er is geen goed antwoord; er is alleen jouw antwoord.'
          : 'Schrijf hier.'}
        onChange={(e) => { zetNotitie(e.target.value); zetBewaard(false) }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn ghost sm" onClick={() => bewaarNotitie(tekst)}>Bewaren</button>
        <button
          className="btn ghost sm"
          disabled={meelezen.bezig || !tekst.trim()}
          onClick={() => {
            const t = tekst.trim()
            bewaarNotitie(t)
            const opdracht = w.type === 'les' ? w.ex.doe : 'Uitwerking van de consolidatietaak.'
            void meelezen.vraag(
              SYS + '\n\nDe gebruiker heeft een toepassingsopdracht uitgewerkt. Reageer als '
              + 'studiebegeleider: benoem wat scherp gezien is, wijs één aanname aan die tegen het '
              + 'licht mag, en voeg één stuk kennis toe dat hij nog niet gebruikt. Corrigeer '
              + 'feitelijke fouten direct. Prijs niet zonder inhoud.',
              `Opdracht: ${opdracht}\n\nMijn uitwerking:\n${t}`)
          }}
        >Laat meelezen</button>
        <span className="small muted" style={{ alignSelf: 'center' }}>
          {bewaard ? 'bewaard' : ''}
        </span>
      </div>
      <Antwoord g={meelezen} />
    </>
  )

  let body: ReactNode = null
  if (w.type === 'les') {
    if (fase === 0) body = (
      <>
        <p className="lede" style={{ fontSize: '1.24rem', maxWidth: '48ch' }}>{w.ex.kern}</p>
        <p className="small muted" style={{ marginTop: 22, maxWidth: '56ch' }}>
          Houd deze vraag vast. Alles wat volgt is een antwoord erop, en aan het eind van de
          sessie zou je haar in eigen woorden moeten kunnen beantwoorden.
        </p>
      </>
    )
    if (fase === 1) body = (
      <>
        <p className="small muted" style={{ maxWidth: '56ch', marginBottom: 4 }}>
          Lees het Arabisch eerst hardop, vóór de vertaling. De woordenlijst is bedoeld om je
          door de zin heen te helpen, niet om haar te vervangen.
        </p>
        {w.ex.matn.map((m, i) => <MatnBlok key={i} m={m} />)}
      </>
    )
    if (fase === 2) body = w.m.secties.map((s, i) => (
      <div key={i}>
        <div className="sectie">
          <span className="meta">{nul(i + 1)}</span>
          <h3>{s.t}</h3>
          <Rijk html={s.h} />
        </div>
        {i < w.m.secties.length - 1 && <hr className="rule" />}
      </div>
    ))
    if (fase === 3) body = Toepassing
    if (fase === 4) body = (
      <>
        <Rijk className="lede" als="p" html={w.m.check.v} />
        <div id="opts">
          {w.m.check.o.map((o, i) => (
            <button
              key={i}
              className={`opt${gekozen === null ? '' : i === w.m.check.j ? ' good' : i === gekozen ? ' bad' : ' dim'}`}
              disabled={gekozen !== null}
              onClick={() => zetGekozen(i)}
            >{o}</button>
          ))}
        </div>
        {gekozen !== null && (
          <div className={`note ${gekozen === w.m.check.j ? 'green' : 'yellow'}`}>
            <span className="meta">{gekozen === w.m.check.j ? 'Juist' : 'Nog niet'}</span>
            <Rijk als="p" html={w.m.check.u} />
          </div>
        )}
      </>
    )
  } else {
    if (fase === 0) body = (
      <>
        <p className="lede" style={{ fontSize: '1.24rem', maxWidth: '48ch' }}>{w.c.kern}</p>
        <p className="small muted" style={{ marginTop: 22, maxWidth: '56ch' }}>
          Deze week bevat geen nieuwe stof. Consolidatie is geen pauze maar het moment waarop
          losse kennis een structuur wordt.
        </p>
      </>
    )
    if (fase === 1) body = <MatnBlok m={w.c.matn} />
    if (fase === 2) body = (
      <>
        <h3>Wat je nu zou moeten kunnen</h3>
        <div style={{ marginTop: 16 }}>
          {w.c.taken.map((t, i) => (
            <div className="row" key={i}>
              <span className="meta">{nul(i + 1)}</span>
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--serif)', fontSize: '1.03rem' }}>{t}</p>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 26 }}><Rijk als="p" html={w.c.slot} /></div>
      </>
    )
    if (fase === 3) body = Toepassing
    if (fase === 4) body = (
      <>
        <h3>Herhaling in plaats van toets</h3>
        <p style={{ marginTop: 12, maxWidth: '58ch' }}>
          Deze week wordt afgesloten met de kaarten. Doe een volledige ronde van alles wat
          openstaat voordat je de week afvinkt.
        </p>
        <button className="btn" style={{ marginTop: 8 }} onClick={naarHerhaling}>Naar de kaarten</button>
      </>
    )
  }

  /* De knop om af te ronden verschijnt pas als de toets beantwoord is — of
     meteen, bij een consolidatieweek en bij een week die je overdoet. */
  const magAfronden = fase === 4 && (w.type === 'cons' || af || gekozen !== null)

  return (
    <>
      <div className="weekkop">
        <Tag kleur={w.sp.kleur}>Blok {w.sp.nr} · {w.sp.titel}</Tag>
        <span className="meta">Week {w.nr} van {TOT}</span>
        {af && <Tag kleur="green">afgerond</Tag>}
      </div>
      <h1 style={{ marginTop: 6 }}>{weekTitel(w)}</h1>

      {!af && pw !== null && pw !== w.nr && (
        <p className="small muted" style={{ marginTop: 10 }}>
          Volgens je planning zou je nu in week {pw} zitten.{' '}
          {pw > w.nr
            ? 'Geen probleem — doorlopen is belangrijker dan bijblijven.'
            : 'Je loopt voor; je kunt de tijd ook in de kaarten steken.'}
        </p>
      )}

      <div className="fase">{FASEN.map((f, i) => <i key={f} className={i <= fase ? 'on' : ''} />)}</div>
      <div className="fase-lbl">
        {FASEN.map((f, i) => <span key={f} className={i === fase ? 'on' : ''}>{f}</span>)}
      </div>

      {body}

      <div className="navrij">
        {fase > 0 && (
          <button className="btn ghost sm" onClick={() => { zetFase(fase - 1); scrollTo({ top: 0 }) }}>
            Terug
          </button>
        )}
        <span className="rest" />
        {fase < 4
          ? <button className="btn" onClick={() => { zetFase(fase + 1); scrollTo({ top: 0 }) }}>Verder</button>
          : magAfronden && (
            <button className="btn" onClick={rondAf}>{af ? 'Opnieuw afvinken' : 'Week afronden'}</button>
          )}
      </div>

      {fase >= 2 && (
        <div className="ask">
          <span className="meta">Doorvragen</span>
          <p className="small muted" style={{ margin: '8px 0 12px' }}>
            Een vervolgvraag bij deze week. Antwoorden zijn Malikitisch georiënteerd, noemen
            bronnen, en markeren waar de school verdeeld is of waar het om hedendaagse ijtihad gaat.
          </p>
          <textarea
            className="ask-in"
            value={vraagtekst}
            placeholder="Stel je vraag…"
            onChange={(e) => zetVraagtekst(e.target.value)}
          />
          <div style={{ marginTop: 10 }}>
            <button
              className="btn sm"
              disabled={doorvragen.bezig || !vraagtekst.trim()}
              onClick={() => void doorvragen.vraag(
                `${SYS}\n\nContext: de vraag komt bij week ${w.nr}, "${weekTitel(w)}", uit het blok "${w.sp.titel}".`,
                vraagtekst.trim())}
            >Vragen</button>
          </div>
          <Antwoord g={doorvragen} />
        </div>
      )}
    </>
  )
}

/** Het scherm vóór het begin: een startdatum en een vaste avond. */
function Beginnen({ nu, zet }: { nu: string; zet: (f: (s: Stand) => Stand) => void }): ReactNode {
  const [datum, zetDatum] = useState(nu)
  const [dag, zetDag] = useState('4')
  return (
    <>
      <h1>Geloofsstudie</h1>
      <p className="lede" style={{ marginTop: 12, maxWidth: '54ch' }}>
        Een leerprogramma van achtentwintig weken in Malikitische fiqh, usul al-fiqh,
        Ash‘aritische geloofsleer, bronnenkritiek en medische ethiek — met elke week een
        fragment uit de oorspronkelijke tekst.
      </p>
      <div className="card" style={{ marginTop: 26 }}>
        <span className="meta">Instellen</span>
        <p className="small" style={{ margin: '10px 0 0' }}>
          Kies een vaste avond. Reken op vijftig minuten per sessie, plus vijf tot tien minuten
          kaarten op de andere dagen. Je kunt altijd vooruit of achteruit; de planning is een
          ritme, geen deadline.
        </p>
        <div className="setup">
          <div className="veld">
            <label htmlFor="inStart">Startdatum</label>
            <input id="inStart" type="date" value={datum} onChange={(e) => zetDatum(e.target.value)} />
          </div>
          <div className="veld">
            <label htmlFor="inDag">Studieavond</label>
            <select id="inDag" value={dag} onChange={(e) => zetDag(e.target.value)}>
              {DAGEN.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <button
            className="btn"
            onClick={() => zet((s) => ({ ...s, start: (datum || nu) as Stand['start'], dag }))}
          >Beginnen</button>
        </div>
      </div>
    </>
  )
}
