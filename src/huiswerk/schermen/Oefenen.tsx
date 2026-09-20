/**
 * OEFENEN — de kern van de app
 *
 * Vier soorten sessies door één scherm: een onderwerp, een mix, het
 * foutenschrift, en een toets (oefen- of proeftoets). Het verschil zit vooral
 * in de regels: bij een toets is er één poging per vraag, geen hints en geen
 * uitwerking, en pas aan het eind een uitslag. Buiten de toets mag je zo vaak
 * proberen als je wilt, met hints die punten kosten in plaats van dat ze
 * verboden zijn.
 *
 * Punten: tien als je het zelf hebt, vijf met een hint, drie als je de som al
 * beheerste. Dat laatste is geen straf maar een sturing — herhalen wat je al
 * kunt hoort minder waard te zijn dan leren wat je nog niet kunt.
 *
 * EN HET SCHERM STOPT OOK EEN KEER
 *
 * De sturing hierboven was te zacht: buiten de toets bleef dit scherm vragen
 * stellen zolang er iets in de voorraad zat, en bij een klein onderwerp op een
 * vast niveau was dat één som. Een kind kreeg dan tien keer dezelfde vraag, met
 * "✓ beheerst" erboven. Twee dingen zijn daarop veranderd, en ze horen bij
 * elkaar:
 *
 *  - de voorraad wordt niet meer tot één niveau teruggesneden (`opNiveau`);
 *  - is alles net geweest, dan komt er een rustscherm in plaats van nóg een
 *    beurt (`kiesVolgende`). Een toets gaat wél door — die heeft zijn tien
 *    vragen nodig — en een kind dat zelf doorwil ook.
 *
 * Wat het kind ziet staat in sterren en niet in een vinkje: elk doosje is een
 * ster, vanaf vier heet een som beheerst. Zo beweegt er iets bij de eerste en
 * de tweede goede beurt, en niet pas bij de vierde.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN, VAKNAAM } from '../gegevens/profielen'
import { UITLEG } from '../gegevens/uitleg'
import type { Kaart, Opgave, Thema, Toeval } from '../gegevens/soorten'
import type { Voortgang } from '../opslag'
import {
  STERREN, beurtVan, kaartStand, kiesVolgende, opNiveau, puntenVoor, sterrenVan,
  sterrenVanStapel, sterrenVoor,
} from '../leitner'
import { antwoordKlopt, diagnoseFout, norm } from '../nakijken'
import { mmss } from '../datum'
import { leesVoor, speel } from '../geluid'
import { Figuur } from '../figuren'
import { Regels } from '../onderdelen'

/** Hoeveel vragen een toets telt. */
const OEFENTOETS = 10
const PROEFTOETS = 20

/** Hoeveel kaarten er onthouden worden om herhaling tegen te gaan. */
const RECENT = 8

export interface OefenenProps {
  pid: string
  vak: string
  onderwerp: string
  jaar: string
  alle: Kaart[]
  prog: Voortgang
  thema: Thema
  geluid: boolean
  voorlezen: boolean
  toeval: Toeval
  terug: () => void
  naarOnderwerp: (t: string, jaar?: string) => void
  opUitslag: (kaart: Kaart, beurt: Opgave, goed: boolean, hintGebruikt: boolean) => void
  opToets: (isProef: boolean, pct: number) => void
}

interface Toetsfout { t: string; q: string; a: string; u: string }

/** Hoe lang het nog duurt voordat een onderwerp dat rust terugkomt, in woorden.
 *  Naar boven afgerond: "morgen" is eerlijker dan "vandaag nog" als het pas
 *  vanavond zover is. */
function wachtwoorden(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return 'zo weer'
  const uren = Math.ceil(ms / 3600000)
  if (uren <= 1) return 'over een uur'
  if (uren < 24) return `over ${uren} uur`
  const dagen = Math.ceil(uren / 24)
  return dagen === 1 ? 'morgen' : `over ${dagen} dagen`
}

export function Oefenen(p: OefenenProps): ReactNode {
  const jr = p.jaar || 'nu'
  const isMix = p.onderwerp === '__mix__'
  const isFout = p.onderwerp === '__fouten__'
  const isToets = p.onderwerp === '__toets__'
  const isProef = p.onderwerp === '__proeftoets__'
  const isExamen = isToets || isProef
  const toetsLengte = isProef ? PROEFTOETS : OEFENTOETS

  const [pool, zetPool] = useState<Kaart[]>([])
  const [kaart, zetKaart] = useState<Kaart | null>(null)
  const [beurt, zetBeurt] = useState<Opgave | null>(null)
  const [val, zetVal] = useState('')
  const [hintN, zetHintN] = useState(0)
  const [stand, zetStand] = useState<'open' | 'goed' | 'fout'>('open')
  const [toonUitwerking, zetToonUitwerking] = useState(false)
  const [pogingen, zetPogingen] = useState(0)
  const [verdiend, zetVerdiend] = useState(10)
  const [feest, zetFeest] = useState(false)
  const [toonUitleg, zetToonUitleg] = useState(true)
  const [sessie, zetSessie] = useState({ goed: 0, fout: 0, sterren: 0 })
  /* Alles in dit onderwerp is net geweest en wacht nog. Dan is doorvragen geen
     oefening maar herhaling van wat er al zit; het scherm zegt dat, en het kind
     kiest zelf of het tóch doorgaat. */
  const [rust, zetRust] = useState<{ tot: number; beheerst: boolean } | null>(null)
  /* De sterren van de som die net goed ging: ervoor en erna. */
  const [ster, zetSter] = useState({ voor: 0, na: 0 })
  const [klaar, zetKlaar] = useState(false)
  const [foutTip, zetFoutTip] = useState<string | null>(null)
  const [toets, zetToets] = useState<{ n: number; fout: Toetsfout[] }>({ n: 0, fout: [] })
  const [start, zetStart] = useState(0)
  const [secs, zetSecs] = useState(0)
  const invoer = useRef<HTMLInputElement>(null)
  const recent = useRef<string[]>([])
  /* De voortgang van dit moment. De sessie werkt hem elke beurt bij, en
     `volgendeKaart` moet met de nieuwste stand rekenen — anders krijg je de som
     die je net goed had meteen weer terug. */
  const nu = useRef(p.prog)
  nu.current = p.prog

  const uitlegSleutel = (!isMix && !isFout && !isExamen && UITLEG[p.onderwerp]) ? p.onderwerp : null
  const label = (isMix ? '🎲 Mix'
    : isFout ? '📕 Fouten herhalen'
      : isProef ? '📝 Proeftoets (alle vakken)'
        : isToets ? '📝 Oefentoets' : p.onderwerp) + (jr === 'next' ? ' 🔭 volgend jaar' : '')

  const toon = (c: Kaart): void => {
    zetRust(null)
    recent.current = [...recent.current.filter((id) => id !== c.id), c.id].slice(-RECENT)
    zetKaart(c)
    zetBeurt(beurtVan(c))
    zetVal('')
    zetHintN(0)
    zetStand('open')
    zetToonUitwerking(false)
    zetPogingen(0)
    zetFoutTip(null)
  }

  useEffect(() => {
    let lijst: Kaart[]
    if (isMix || isToets) {
      lijst = p.alle.filter((e) => e.p === p.pid && e.v === p.vak && (e.jaar ?? 'nu') === jr)
    } else if (isProef) {
      lijst = p.alle.filter((e) => e.p === p.pid && (e.jaar ?? 'nu') === jr)
    } else if (isFout) {
      const ids = new Set((nu.current.foutLog ?? []).map((f) => f.id))
      lijst = p.alle.filter((e) => ids.has(e.id))
    } else {
      lijst = p.alle.filter((e) => e.p === p.pid && e.v === p.vak && e.t === p.onderwerp
        && (e.jaar ?? 'nu') === jr)
    }
    /* Een vast niveau is een voorkeur, geen muur. Zie `opNiveau`: pas als dat
       ene niveau te weinig oplevert schuiven de buurniveaus erbij. Zonder dat
       bleef er bij een onderwerp als Delen precies één som over. */
    if (!isFout) lijst = opNiveau(lijst, nu.current.niveau)
    zetPool(lijst)
    zetSessie({ goed: 0, fout: 0, sterren: 0 })
    zetToets({ n: 0, fout: [] })
    zetKlaar(false)
    zetToonUitleg(true)
    zetStart(isExamen ? Date.now() : 0)
    zetSecs(0)
    recent.current = []
    /* Een toets moet zijn tien vragen hebben, ook als alles al beheerst is:
       daar telt `dwing`. Buiten de toets mag de stapel rusten. */
    const eerste = kiesVolgende(lijst, nu.current, [], Date.now(), p.toeval, isExamen)
    zetRust(eerste.rust ? { tot: eerste.terugOm, beheerst: eerste.allesBeheerst } : null)
    if (eerste.kaart) toon(eerste.kaart)
    else { zetKaart(null); zetBeurt(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.onderwerp, p.vak, p.pid, jr])

  useEffect(() => {
    if (invoer.current) invoer.current.focus()
  }, [kaart])

  /* De klok van de toets. Alleen zichtbaar, nooit sturend: er wordt niets
     afgebroken als hij doorloopt. */
  useEffect(() => {
    if (!isExamen || !start || klaar) return
    const id = setInterval(() => zetSecs(Math.round((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [isExamen, start, klaar])

  function controleer(): void {
    if (stand === 'goed' || !beurt || !kaart) return
    const ok = antwoordKlopt(beurt, val)
    if (isExamen) {
      /* In de toets: één poging per vraag. */
      if (stand !== 'open') return
      p.opUitslag(kaart, beurt, ok, false)
      zetStand(ok ? 'goed' : 'fout')
      speel(ok ? 'goed' : 'fout', p.geluid)
      zetToets((t) => ({
        n: t.n + 1,
        fout: ok ? t.fout : [...t.fout, { t: kaart.t, q: beurt.q, a: beurt.a, u: beurt.u ?? '' }],
      }))
      if (ok) { zetFeest(true); setTimeout(() => zetFeest(false), 900) }
      return
    }
    zetPogingen((t) => t + 1)
    if (ok) {
      /* De sterren van vóór het antwoord, want `opUitslag` schuift het doosje
         meteen op. Het verschil is wat het kind te zien krijgt. */
      const voor = kaartStand(nu.current, kaart.id).box
      const na = Math.min(STERREN, voor + 1)
      zetSter({ voor, na })
      zetVerdiend(puntenVoor(nu.current, kaart.id, hintN > 0))
      zetStand('goed')
      zetFoutTip(null)
      speel('goed', p.geluid)
      p.opUitslag(kaart, beurt, true, hintN > 0)
      zetSessie((s) => ({ goed: s.goed + 1, fout: s.fout, sterren: s.sterren + (na - voor) }))
      zetFeest(true)
      setTimeout(() => zetFeest(false), 1100)
    } else {
      zetStand('fout')
      zetFoutTip(diagnoseFout(beurt, val))
      speel('fout', p.geluid)
      p.opUitslag(kaart, beurt, false, false)
      zetSessie((s) => ({ goed: s.goed, fout: s.fout + 1, sterren: s.sterren }))
    }
  }

  function volgende(): void {
    if (isExamen && toets.n >= toetsLengte) {
      const pct = Math.round((toetsLengte - toets.fout.length) / toetsLengte * 100)
      if (start) zetSecs(Math.round((Date.now() - start) / 1000))
      p.opToets(isProef, pct)
      zetKlaar(true)
      return
    }
    pak(false)
  }

  /** De volgende som ophalen. `dwing` zet de rustregel opzij: dat doet een toets
   *  altijd, en een kind dat op "toch oefenen" tikt één keer. */
  function pak(dwing: boolean): void {
    const n = kiesVolgende(pool, nu.current, recent.current, Date.now(), p.toeval,
      dwing || isExamen)
    if (n.kaart) toon(n.kaart)
    else if (n.rust) zetRust({ tot: n.terugOm, beheerst: n.allesBeheerst })
  }

  if (rust && !isExamen) {
    const sterren = sterrenVanStapel(p.prog, pool)
    const hoeveel = `alle ${pool.length} ${pool.length === 1 ? 'som' : 'sommen'}`
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={p.terug}>← overzicht</button>
          <span className="pill">{label}</span>
        </div>
        <div className="card center" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 44 }}>{rust.beheerst ? '🏅' : '🌱'}</div>
          <h2>{rust.beheerst ? 'Dit beheers je.' : 'Je hebt ze allemaal gehad.'}</h2>
          <div className="stars" style={{ fontSize: 26, letterSpacing: 2 }}>
            {sterrenVan(sterren)}
          </div>
          <p style={{ fontSize: 16, marginTop: 8 }}>
            {rust.beheerst
              ? `Van ${hoeveel} van dit onderwerp heb je vier sterren of meer.`
              : `Je bent ${hoeveel} van dit onderwerp net langsgegaan.`}{' '}
            Ze komen <b>{wachtwoorden(rust.tot - Date.now())}</b> terug om te kijken of het blijft
            zitten.
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            Nu doorgaan levert dezelfde sommen op. Even wachten laat ze juist beter blijven zitten;
            pak zolang iets wat nog niet vastzit. 🌱
          </p>
        </div>
        <div className="wrap center" style={{ marginTop: 16, justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={p.terug}>← Ander onderwerp</button>
          {!isFout && !isMix && (
            <button type="button" className="btn gold" onClick={() => p.naarOnderwerp('__mix__', jr)}>
              🎲 Mix van dit vak
            </button>
          )}
          <button type="button" className="btn ghost sm" onClick={() => pak(true)}>
            Toch nog oefenen
          </button>
        </div>
      </div>
    )
  }

  if (!kaart || !beurt) {
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={p.terug}>← terug</button>
          <span className="pill">{label}</span>
        </div>
        <div className="card center" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <p style={{ fontSize: 18 }}>
            {isFout ? 'Geen fouten om te herhalen, top!' : 'Nog geen opgaven hier.'}
          </p>
          <button type="button" className="btn ghost" onClick={p.terug} style={{ marginTop: 10 }}>
            Terug naar overzicht
          </button>
        </div>
      </div>
    )
  }

  if (klaar && isExamen) {
    const goed = toetsLengte - toets.fout.length
    const pct = Math.round(goed / toetsLengte * 100)
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={p.terug}>← overzicht</button>
          <span className="pill">📝 Toetsuitslag</span>
        </div>
        <div className="card center">
          <div style={{ fontSize: 46 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'}</div>
          <h2>{goed} / {toetsLengte} goed</h2>
          <div className="pbar" style={{ margin: '10px 0' }}><i style={{ width: pct + '%' }} /></div>
          <p className="muted">
            {pct >= 80 ? 'Knap gedaan!'
              : pct >= 50 ? 'Goed bezig, nog even oefenen.'
                : 'Blijf oefenen, je komt er!'}
          </p>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            ⏱ Tijd: {mmss(secs)} · gemiddeld {mmss(Math.round(secs / toetsLengte))} per vraag
          </p>
        </div>
        {toets.fout.length > 0 && (
          <div className="card" style={{ marginTop: 12 }}>
            <b>Nakijken: deze gingen mis ({toets.fout.length}):</b>
            <div style={{ marginTop: 8 }}>
              {toets.fout.map((f, i) => (
                <div key={i} style={{ padding: '7px 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
                  <span className="tag">{f.t}</span> {f.q}{' '}
                  <span className="muted">→ {f.a} {f.u}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="wrap center" style={{ marginTop: 16, justifyContent: 'center' }}>
          <button
            type="button" className="btn"
            onClick={() => p.naarOnderwerp(isProef ? '__proeftoets__' : '__toets__')}
          >📝 Nieuwe toets</button>
          {toets.fout.length > 0 && (
            <button type="button" className="btn accent" onClick={() => p.naarOnderwerp('__fouten__')}>
              📕 Oefen je fouten
            </button>
          )}
          <button type="button" className="btn ghost" onClick={p.terug}>Terug</button>
        </div>
      </div>
    )
  }

  if (klaar) {
    const fouten = p.prog.foutLog ?? []
    const doel = p.prog.goal || 10
    const gehaald = (p.prog.todayCount || 0) >= doel
    return (
      <div>
        <div className="topbar">
          <button type="button" className="back" onClick={p.terug}>← overzicht</button>
          <span className="pill">Samenvatting</span>
        </div>
        <div className="card center">
          <div style={{ fontSize: 46 }}>
            {gehaald ? '🏆' : (p.thema.doel === 'doelpunten' ? '⚽' : '🌟')}
          </div>
          <h2>Goed bezig, {PROFIELEN[p.pid]?.naam}!</h2>
          <p style={{ fontSize: 18, margin: '6px 0' }}>
            Deze sessie: <b>{sessie.goed}</b>{' '}
            {p.thema.doel === 'doelpunten'
              ? (sessie.goed === 1 ? 'doelpunt' : 'doelpunten')
              : (sessie.goed === 1 ? 'som' : 'sommen')} goed.
          </p>
          {sessie.sterren > 0 && (
            <p style={{ fontSize: 16, margin: '2px 0' }}>
              <span className="stars">⭐</span> {sessie.sterren}{' '}
              {sessie.sterren === 1 ? 'ster' : 'sterren'} erbij.
            </p>
          )}
          <p className="muted">
            Vandaag totaal: {p.prog.todayCount || 0} / {doel} 🎯{' '}
            {gehaald ? '✓  dagdoel gehaald!' : ''}
          </p>
        </div>
        {fouten.length > 0
          ? (
            <div className="card" style={{ marginTop: 12 }}>
              <b>📕 Nog even herhalen ({fouten.length})</b>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Deze gingen mis. Pak ze nog een keer: daar leer je het meest van. 💪
              </p>
              <div style={{ marginTop: 8 }}>
                {fouten.slice(0, 8).map((f, i) => (
                  <div key={i} style={{ padding: '7px 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
                    <span className="tag">{String(f.t)}</span> {String(f.q)}{' '}
                    <span className="muted">→ {String(f.a)} {String(f.u)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn accent" onClick={() => p.naarOnderwerp('__fouten__')}>
                  📕 Oefen je fouten
                </button>
              </div>
            </div>
            )
          : (
            <div className="card center" style={{ marginTop: 12 }}>
              Geen openstaande fouten meer, helemaal top! ✅
            </div>
            )}
        <div className="center" style={{ marginTop: 16 }}>
          <button type="button" className="btn ghost" onClick={p.terug}>Terug naar overzicht</button>
        </div>
      </div>
    )
  }

  const doel = p.prog.goal || 10
  const gedaan = p.prog.todayCount || 0
  const opSlot = stand === 'goed' || (isExamen && stand !== 'open')
  const uitleg = uitlegSleutel ? UITLEG[uitlegSleutel] : null

  return (
    <div>
      {feest && (
        <div className="confetti">{p.thema.feest.map((e, i) => <span key={i}>{e}</span>)}</div>
      )}
      <div className="topbar">
        <button type="button" className="back" onClick={p.terug}>← terug</button>
        <div className="scorechip">
          <span className="s">{p.thema.xp === 'XP' ? '⚽' : '⭐'} {p.prog.punten || 0}</span>
          <span className="s">🔥 {p.prog.streak || 0}</span>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="pill">{label}{(isMix || isToets) ? ' · ' + (VAKNAAM[p.vak] ?? p.vak) : ''}</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {isExamen
            ? `⏱ ${mmss(secs)} · vraag ${stand === 'open' ? toets.n + 1 : toets.n} / ${toetsLengte}`
            : (
              <>
                som {sessie.goed + 1} · niveau {beurt.lvl ?? kaart.lvl ?? 1} ·{' '}
                <span
                  className="stars"
                  title={`${kaartStand(p.prog, kaart.id).box} van ${STERREN} sterren, `
                    + 'vanaf 4 heet deze som beheerst'}
                >{sterrenVoor(p.prog, kaart.id)}</span>
              </>
              )}
        </span>
      </div>
      <div className="pbar" style={{ marginBottom: 12 }}>
        <i style={{
          width: (isExamen
            ? Math.round(toets.n / toetsLengte * 100)
            : Math.min(100, Math.round(gedaan / doel * 100))) + '%',
        }} />
      </div>

      {uitleg && (
        <div className="card" style={{ marginBottom: 12, background: '#f3f8ee' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>💡 Even opfrissen</b>
            <button
              type="button" className="btn ghost sm" onClick={() => zetToonUitleg(!toonUitleg)}
            >{toonUitleg ? '▲ inklappen' : '▼ uitklappen'}</button>
          </div>
          {toonUitleg && (
            <>
              {uitleg.ill && (
                <div style={{ textAlign: 'center', marginTop: 8 }}><Figuur ill={uitleg.ill} /></div>
              )}
              <p style={{ marginTop: 8, fontSize: 14 }}>{uitleg.tekst}</p>
            </>
          )}
        </div>
      )}

      <div className="card">
        {beurt.ill && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}><Figuur ill={beurt.ill} /></div>
        )}
        {p.voorlezen && (
          <div style={{ marginBottom: 6 }}>
            <button
              type="button" className="btn ghost sm" title="Lees de vraag voor"
              onClick={() => leesVoor(beurt.q, true)}
            >🔊 Lees voor</button>
          </div>
        )}
        <Regels className="qbox" tekst={beurt.q} />
        {beurt.opties
          ? (
            <div className="optiegrid">
              {beurt.opties.map((opt, i) => (
                <button
                  type="button" key={i} disabled={opSlot}
                  className={'optiebtn' + (norm(val) === norm(opt) ? ' sel' : '')}
                  onClick={() => {
                    if (opSlot) return
                    zetVal(opt)
                    if (!isExamen && stand === 'fout') zetStand('open')
                  }}
                >{opt}</button>
              ))}
            </div>
            )
          : (
            <div className="answerrow">
              <input
                ref={invoer} value={val} placeholder="jouw antwoord" disabled={opSlot} inputMode="text"
                onChange={(e) => {
                  zetVal(e.target.value)
                  if (!isExamen && stand === 'fout') zetStand('open')
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') controleer() }}
              />
              {beurt.u && <div className="unit">{beurt.u}</div>}
            </div>
            )}

        {stand === 'goed' && (
          <div className="feedback ok celebrate">
            {isExamen
              ? (p.thema.doel === 'doelpunten' ? '⚽ GOAL!' : '✅ Goed!')
              : `${p.thema.goal} +${verdiend} ${p.thema.xp}`}
            {!isExamen && (
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>
                <span className="stars">{sterrenVan(ster.na)}</span>{' '}
                {ster.na > ster.voor
                  ? (ster.na === 4 && ster.voor < 4
                      ? '🏅 nu beheers je deze som!'
                      : ster.na === STERREN ? 'vol! deze zit er stevig in.' : 'een ster erbij')
                  : 'al vol, mooi zo'}
              </div>
            )}
          </div>
        )}
        {stand === 'fout' && isExamen && (
          <div className="feedback no">
            ❌ Helaas. Het goede antwoord is: <b>{beurt.a} {beurt.u}</b>
          </div>
        )}
        {stand === 'fout' && !isExamen && (
          <div className="feedback no">
            Nog niet: kijk nog eens, of open een hint. Je kunt het! 💪
            {foutTip && <div style={{ marginTop: 8, fontWeight: 600 }}>💡 {foutTip}</div>}
          </div>
        )}

        {!isExamen && hintN > 0 && beurt.h?.slice(0, hintN).map((h, i) => (
          <div key={i} className="hint"><b>Hint {i + 1}:</b> {h}</div>
        ))}
        {!isExamen && toonUitwerking && beurt.s && (
          <Regels className="solution" tekst={'Uitwerking\n' + beurt.s} />
        )}

        <div className="wrap" style={{ marginTop: 16 }}>
          {isExamen
            ? (
              <>
                {stand === 'open' && (
                  <button type="button" className="btn" onClick={controleer}>Nakijken</button>
                )}
                {stand !== 'open' && (
                  <button type="button" className="btn" onClick={volgende}>
                    {toets.n >= toetsLengte ? 'Bekijk score →' : 'Volgende →'}
                  </button>
                )}
              </>
              )
            : (
              <>
                {stand !== 'goed' && (
                  <button type="button" className="btn" onClick={controleer}>Nakijken</button>
                )}
                {stand !== 'goed' && beurt.h && hintN < beurt.h.length && (
                  <button type="button" className="btn gold sm" onClick={() => zetHintN(hintN + 1)}>
                    💡 Hint
                  </button>
                )}
                {stand !== 'goed' && pogingen >= 1 && !toonUitwerking && (
                  <button
                    type="button" className="btn ghost sm" onClick={() => zetToonUitwerking(true)}
                  >Toon uitwerking</button>
                )}
                {stand === 'goed' && (
                  <button type="button" className="btn" onClick={volgende}>Volgende →</button>
                )}
                {stand === 'goed' && !toonUitwerking && (
                  <button
                    type="button" className="btn ghost sm" onClick={() => zetToonUitwerking(true)}
                  >Bekijk uitwerking</button>
                )}
              </>
              )}
        </div>
      </div>

      {!isExamen && (
        <div className="center" style={{ marginTop: 14 }}>
          <button type="button" className="btn ghost sm" onClick={() => zetKlaar(true)}>
            ⏹ Stoppen: toon samenvatting
          </button>
        </div>
      )}
      <p className="muted center" style={{ marginTop: 10, fontSize: 13 }}>
        {isExamen
          ? `${isProef ? 'Proeftoets' : 'Oefentoets'}: ${toetsLengte} vragen, gemengd, geen hints. `
            + 'Veel succes! 🍀'
          : 'Elke goede beurt is een ster erbij; vanaf ⭐⭐⭐⭐ beheers je de som. '
            + 'Zelf gevonden = 10 punten · met hint = 5 · al beheerst = 3'}
      </p>
    </div>
  )
}
