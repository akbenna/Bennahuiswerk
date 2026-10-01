/**
 * VAKKEN: het scherm van één kind
 *
 * Alles wat een kind nodig heeft om te kiezen wat het gaat doen. De volgorde is
 * omgedraaid ten opzichte van de eerste opzet, en daar zit de hele gedachte in.
 *
 * Vroeger stond bovenaan wat er al bereikt was (rang, dagmissie, dagdoel,
 * verdiend geld, niveau) en pas na zeven kaarten de vakken. De redenering was
 * dat een kind eerst hoort te zien dat het ergens staat. In de praktijk betekende
 * het scrollen: wie kwam oefenen moest eerst langs alles wat leuk is aan
 * oefenen voordat hij kon beginnen.
 *
 * Nu staat het werk vooraan: de weektaak van de ouder, dan de vakken en de
 * onderwerpen. Wat er te halen valt staat eronder in één kaart die dicht begint.
 * Alleen het dagdoel blijft als smalle strook zichtbaar, dat is geen beloning
 * maar de opdracht van vandaag.
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ONDERWERPICOON, PROFIELEN, VAKNAAM } from '../gegevens/profielen'
import type { Kaart, Thema } from '../gegevens/soorten'
import type { Voortgang } from '../opslag'
import { berekenBeloning, euro, halfRond, weekVerdiend } from '../beloning'
import { isBeheerst, kaartStand, sterrenVan, sterrenVanStapel } from '../leitner'
import { INSIGNES, dagMissie, rangVoor } from '../missie'
import { Klapkaart } from '../onderdelen'
import { Formuleklapper } from './Naslag'
import { Vraagveld } from './Vraagveld'
import { catalogus } from '../vraagbaak'
import type { Ingang, Uitslag } from '../vraagbaak'
import { actueel, blokkenOp, isoVan, leegPlan, toetsStand, weekUren, zetToets } from '../planbord'
import type { Planstand, Toets } from '../planbord'
import { Blokregel, STATUSKLEUR, dagLabel, oefenroute } from './Planbord'
import { STARTTOETSEN } from '../gegevens/toetsen-start'

export interface VakkenProps {
  pid: string
  prog: Voortgang
  alle: Kaart[]
  vak: string
  thema: Thema
  nuMs: number
  weektaak: string[]
  wedstrijdAan: boolean
  spelNaDoel: boolean
  zetVak: (v: string) => void
  terug: () => void
  /** Wat de terugknop doet. Wie via het portaal binnenkwam gaat daar terug
   *  naartoe en niet naar een scherm met de namen van zijn broers en zussen. */
  terugLabel?: string
  naarOnderwerp: (t: string, jaar: string) => void
  zetDoel: (n: number) => void
  zetNiveau: (n: Voortgang['niveau']) => void
  naarWedstrijd: () => void
  naarSpellen: () => void
  /** Wat een kind aan de vraagbaak vroeg, voor het ouderscherm. */
  opVraag: (vraag: string, uitslag: Uitslag) => void
  naarLeerscan: () => void
  /** Het planbord van dit kind, als het er een heeft. */
  plan?: Planstand | undefined
  /** Zonder deze twee geen planstrook: een scherm dat geen planbord kan
   *  bewaren of openen hoort er ook geen te tonen. */
  bewaarPlan?: (p: Planstand) => void
  naarPlanbord?: () => void
}

/** Wat elk niveau betekent, in één regel. Zonder dit is "niveau 3" een cijfer
 *  en geen keuze: een ouder kan dan niet zien wat hij aanzet. */
const NIVEAUS: Array<[Exclude<Voortgang['niveau'], 'auto'>, string, string]> = [
  [1, '1 · makkelijk', 'Eén stap, met de getallen die er staan.'],
  [2, '2 · middel', 'Twee stappen, of eerst iets omrekenen.'],
  [3, '3 · moeilijk', 'Terugrekenen, of een som met een adder onder het gras.'],
]

/**
 * DE NIVEAUKNOP, WAAR JE HEM NODIG HEBT
 *
 * Hij stond onderin de dichtgeklapte kaart "Mijn voortgang", tussen de rangen
 * en de badges. Daar hoort hij niet: dit is geen behaalde stand om naar te
 * kijken maar een knop die bepaalt wát je de komende tien sommen krijgt. Dus
 * staat hij nu onder de onderwerpen, waar je hem pakt vlak voordat je begint.
 */
function Niveaukiezer(
  { prog, zetNiveau }: { prog: Voortgang; zetNiveau: (n: Voortgang['niveau']) => void },
): ReactNode {
  const vast = NIVEAUS.find(([n]) => n === prog.niveau)
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>🎚️ Moeilijkheid</b>
        <span className="muted" style={{ fontSize: 13 }}>
          {prog.niveau === 'auto'
            ? `Automatisch, nu niveau ${prog.autoLvl || 1}`
            : `Vast op niveau ${prog.niveau}`}
        </span>
      </div>
      <div className="wrap" style={{ marginTop: 10 }}>
        <button
          type="button"
          className={'btn sm ' + (prog.niveau === 'auto' ? '' : 'ghost')}
          onClick={() => zetNiveau('auto')}
        >Auto</button>
        {NIVEAUS.map(([n, label]) => (
          <button
            type="button" key={n}
            className={'btn sm ' + (prog.niveau === n ? '' : 'ghost')}
            onClick={() => zetNiveau(n)}
          >{label}</button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        {vast
          ? `${vast[2]} Elk onderwerp heeft zes sommen op dit niveau, dus je krijgt ze ook echt `
            + 'allemaal van niveau ' + vast[0] + '.'
          : 'Het gaat vanzelf een tikje omhoog na drie goede antwoorden, en weer omlaag als het '
            + 'even niet lukt. Wil je zelf kiezen, tik dan op 1, 2 of 3.'}
      </p>
    </div>
  )
}

export function Vakken(p: VakkenProps): ReactNode {
  const P = PROFIELEN[p.pid]
  const [jaar, zetJaar] = useState('nu')
  const heeftVolgend = useMemo(
    () => p.alle.some((e) => e.p === p.pid && (e.jaar ?? 'nu') === 'next'),
    [p.alle, p.pid])

  const onderwerpen = useMemo(() => {
    const lijst = p.alle.filter((e) => e.p === p.pid && e.v === p.vak && (e.jaar ?? 'nu') === jaar)
    const map: Record<string, Kaart[]> = {}
    for (const e of lijst) (map[e.t] ??= []).push(e)
    return Object.entries(map).map(([t, exs]) => ({
      t,
      total: exs.length,
      beheerst: exs.filter((e) => isBeheerst(p.prog, e.id)).length,
      begonnen: exs.filter((e) => kaartStand(p.prog, e.id).box > 0).length,
      /* De sterren komen uit het gemiddelde doosje en niet uit het percentage
         beheerst. Dat laatste springt pas bij doosje vier: een kind dat drie
         keer goed had zag niets bewegen. */
      sterren: sterrenVanStapel(p.prog, exs),
    }))
  }, [p.alle, p.pid, p.vak, p.prog, jaar])

  if (!P) return null

  const doel = p.prog.goal || 10
  const gedaan = Math.min(p.prog.todayCount || 0, doel)
  const doelPct = Math.round(gedaan / doel * 100)
  const foutAantal = (p.prog.foutLog ?? []).length
  const rang = rangVoor(p.thema, p.prog.punten || 0)
  const missie = dagMissie(p.prog, new Date(p.nuMs))
  const doelGehaald = (p.prog.todayCount || 0) >= doel
  const spelOpSlot = p.spelNaDoel && !doelGehaald

  const weekrijen = p.weektaak.map((sleutel) => {
    const stuk = sleutel.split('|')
    const v = stuk[0] ?? ''
    const t = stuk.slice(1).join('|')
    const exs = p.alle.filter((e) => e.p === p.pid && e.v === v && e.t === t)
    return { v, t, total: exs.length, beheerst: exs.filter((e) => isBeheerst(p.prog, e.id)).length }
  }).filter((r) => r.total > 0)
  const weekB = weekrijen.reduce((s, r) => s + r.beheerst, 0)
  const weekT = weekrijen.reduce((s, r) => s + r.total, 0)
  const b = P.beloning ? berekenBeloning(p.prog, p.nuMs) : null
  /* In de bovenbouw is het planbord het eerste wat er op het scherm staat,
     nog vóór het dagdoel: wie toetsen heeft, begint bij wat er vandaag af moet
     en niet bij tien sommen. In de onderbouw blijft het eronder, en verschijnt
     het alleen als er toetsen op staan. */
  const bovenbouw = /[456] (havo|vwo)/.test(P.niveau)
  const planstrook = p.bewaarPlan && p.naarPlanbord
    ? (
      <Planstrook
        pid={p.pid} plan={p.plan} nuMs={p.nuMs} bewaar={p.bewaarPlan} open={p.naarPlanbord}
        bovenbouw={bovenbouw} catalogus={catalogus(p.alle, p.pid, p.prog)}
        oefen={(v, onderw, jr) => {
          p.zetVak(v)
          if (onderw) p.naarOnderwerp(onderw, jr ?? 'nu')
        }}
      />
      )
    : null
  const wv = P.beloning ? weekVerdiend(p.prog, p.nuMs) : 0

  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={p.terug}>
          ← {p.terugLabel ?? 'terug'}
        </button>
        <div className="scorechip">
          <span className="s">{rang.emoji} {p.prog.punten || 0} {p.thema.xp}</span>
          <span className="s">🔥 {p.prog.streak || 0}</span>
          <span className="s">📅 {p.prog.dagstreak || 0}</span>
        </div>
      </div>

      <div className="minikop">
        <span className="gezicht" style={{ fontSize: 26 }}>{P.emoji}</span>
        <h1>{P.naam}</h1>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{P.niveau}</span>
      </div>

      {bovenbouw && planstrook}

      <div className={'doelstrook' + (doelGehaald ? ' klaar' : '')}>
        <span className="tel">
          🎯 {p.prog.todayCount || 0} / {doel}
        </span>
        <div className="pbar"><i style={{ width: doelPct + '%' }} /></div>
        <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {doelGehaald ? 'gehaald! 🎉' : p.thema.doel}
        </span>
      </div>

      {!bovenbouw && planstrook}

      <Vraagveld
        pid={p.pid} alle={p.alle} prog={p.prog} opVraag={p.opVraag}
        ga={(vak, onderwerp, jr) => {
          p.zetVak(vak)
          zetJaar(jr)
          p.naarOnderwerp(onderwerp, jr)
        }}
      />

      {weekrijen.length > 0 && (
        <div
          className="card"
          style={{ marginTop: 12, background: '#eef6ff', borderLeftColor: '#3a6ea0' }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <b>📌 Jouw weektaak</b>
            <span className="muted" style={{ fontSize: 13 }}>
              {weekT ? Math.round(weekB / weekT * 100) : 0}% beheerst
            </span>
          </div>
          <div className="pbar" style={{ marginTop: 8 }}>
            <i style={{ width: (weekT ? Math.round(weekB / weekT * 100) : 0) + '%' }} />
          </div>
          <div className="wrap" style={{ marginTop: 10 }}>
            {weekrijen.map((r, i) => (
              <button
                type="button" key={i} title={'Oefen ' + r.t}
                className={'btn sm ' + (r.beheerst >= r.total ? 'ghost' : '')}
                onClick={() => {
                  p.zetVak(r.v)
                  const heeftNu = p.alle.some((e) => e.p === p.pid && e.v === r.v && e.t === r.t
                    && (e.jaar ?? 'nu') === 'nu')
                  p.naarOnderwerp(r.t, heeftNu ? 'nu' : 'next')
                }}
              >
                {r.beheerst >= r.total ? '✅ ' : '▶️ '}{r.t}{' '}
                <span className="muted" style={{ fontSize: 12 }}>({r.beheerst}/{r.total})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {heeftVolgend && (
        <div className="wrap" style={{ margin: '16px 0 0', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>📅 Leerjaar:</span>
          <button
            type="button" className={'btn sm ' + (jaar === 'nu' ? '' : 'ghost')}
            onClick={() => zetJaar('nu')}
          >Dit jaar ({P.niveau})</button>
          <button
            type="button" className={'btn sm ' + (jaar === 'next' ? 'gold' : 'ghost')}
            onClick={() => zetJaar('next')}
          >🔭 Volgend jaar ({P.volgend})</button>
        </div>
      )}

      <div className="wrap" style={{ margin: '14px 0 12px' }}>
        {P.vakken.map((v) => (
          <button
            type="button" key={v} className={'btn sm ' + (v === p.vak ? '' : 'ghost')}
            onClick={() => p.zetVak(v)}
          >{VAKNAAM[v] ?? v}</button>
        ))}
      </div>

      {onderwerpen.length > 0 && (
        <div className="wrap" style={{ marginBottom: 14 }}>
          <button type="button" className="btn" onClick={() => p.naarOnderwerp('__mix__', jaar)}>
            🎲 Mix-oefening (door elkaar)
          </button>
          <button type="button" className="btn gold" onClick={() => p.naarOnderwerp('__toets__', jaar)}>
            📝 Oefentoets (10 vragen)
          </button>
          {foutAantal > 0 && (
            <button
              type="button" className="btn accent" onClick={() => p.naarOnderwerp('__fouten__', 'nu')}
            >📕 Mijn fouten oefenen ({foutAantal})</button>
          )}
        </div>
      )}

      {onderwerpen.length === 0 && (
        <div className="card center" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 32 }}>{jaar === 'next' ? '🔭' : '🌱'}</div>
          <p style={{ fontSize: 16 }}>
            {jaar === 'next'
              ? 'Voor dit vak is er nog geen stof van volgend jaar.'
              : 'Voor dit vak staan nog geen opgaven klaar.'}
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            {jaar === 'next'
              ? 'Kies een ander vak of ga terug naar "Dit jaar".'
              : 'Een ouder kan opgaven toevoegen via de ouder-modus op het beginscherm.'}
          </p>
        </div>
      )}

      {onderwerpen.map(({ t, total, beheerst, sterren }) => {
        const pct = total ? Math.round(beheerst / total * 100) : 0
        return (
          <button type="button" key={t} className="topic" onClick={() => p.naarOnderwerp(t, jaar)}>
            <div className="ico">{ONDERWERPICOON[t] ?? '📘'}</div>
            <div className="grow">
              <div className="tt">{t}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {beheerst} / {total} beheerst ·{' '}
                <span className="stars" title={`${sterren} van 5 sterren`}>
                  {sterrenVan(sterren)}
                </span>
              </div>
              <div className="pbar"><i style={{ width: pct + '%' }} /></div>
            </div>
            <div>›</div>
          </button>
        )
      })}

      <Niveaukiezer prog={p.prog} zetNiveau={p.zetNiveau} />

      <Klapkaart
        titel="📈 Mijn voortgang"
        zij={`${rang.emoji} ${rang.naam}${b && !b.betaald && b.bedrag > 0 ? ' · ' + euro(b.bedrag) + ' vandaag' : ''}`}
      >
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{rang.emoji} {rang.naam}</b>
            <span className="muted" style={{ fontSize: 13 }}>
              {rang.volgendeNaam
                ? `Nog ${rang.naar} ${p.thema.xp} → ${rang.volgendeNaam}`
                : 'Hoogste rang! 👑'}
            </span>
          </div>
          <div className="pbar" style={{ marginTop: 8 }}><i style={{ width: rang.pct + '%' }} /></div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>⭐ Dagmissie {missie.klaar ? '✓  gehaald! 🎉' : ''}</b>
            <span className="muted" style={{ fontSize: 13 }}>
              🔥 missie-streak: {p.prog.missieStreak || 0}
            </span>
          </div>
          <div style={{ marginTop: 6 }}>
            {missie.taken.map((t, i) => (
              <div key={i} style={{ fontSize: 14, padding: '2px 0' }}>
                {t.ok ? '✅' : '⬜'} {t.tekst}
              </div>
            ))}
          </div>
          {!missie.klaar && (
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Rond alle drie af → +25 punten en je missie-streak groeit!
            </div>
          )}
        </div>

        {b && (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>💶 Verdiend vandaag</b>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#a8730a' }}>
                {b.betaald ? 'uitbetaald ✓' : euro(b.bedrag)}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              {b.poort}<br />
              🎯 Goed op niveau (moeilijker = meer): <b>{b.punten}</b> punten · nauwkeurigheid{' '}
              <b>{b.pogingen ? Math.round(b.nauw * 100) : 0}%</b><br />
              {b.toetsEuro > 0
                ? (
                  <span>
                    ✅ Toets gehaald ({b.proef >= 70 ? `proeftoets ${b.proef}%` : `oefentoets ${b.oefen}%`})
                    {' '}→ bonus {euro(b.toetsEuro)}
                  </span>
                  )
                : <span>💡 Haal een oefentoets voor een bonus: hoe hoger je score, hoe meer.</span>}
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
              <span className="muted">Deze week verdiend: <b>{euro(wv)}</b> van {euro(b.weekbudget)}</span>
              <span className="muted">
                nog {euro(Math.max(0, halfRond(b.weekbudget - wv)))} mogelijk
              </span>
            </div>
            <div className="pbar" style={{ marginTop: 4 }}>
              <i style={{ width: Math.min(100, b.weekbudget ? Math.round(wv / b.weekbudget * 100) : 0) + '%' }} />
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              Papa/mama betaalt uit via de ouder-modus.
            </div>
          </div>
        )}

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>🎯 Dagdoel aanpassen</b>
            <span className="muted" style={{ fontSize: 13 }}>
              {p.prog.todayCount || 0} / {doel} {p.thema.doel}
            </span>
          </div>
          <div className="wrap" style={{ marginTop: 10, alignItems: 'center' }}>
            <button
              type="button" className="btn ghost sm" onClick={() => p.zetDoel(Math.max(5, doel - 5))}
            >−</button>
            <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{doel}</span>
            <button
              type="button" className="btn ghost sm" onClick={() => p.zetDoel(Math.min(40, doel + 5))}
            >+</button>
          </div>
        </div>

        <div className="card">
          <b>Badges</b>
          <div className="wrap" style={{ marginTop: 10 }}>
            {INSIGNES.map((b2) => (
              <span
                key={b2.id} className={'badge ' + (p.prog.badges.includes(b2.id) ? '' : 'locked')}
              >{b2.emoji} {b2.naam}</span>
            ))}
          </div>
        </div>
      </Klapkaart>

      <div className="center" style={{ marginTop: 14 }}>
        <button
          type="button" className="btn gold" onClick={() => p.naarOnderwerp('__proeftoets__', jaar)}
        >📝 Proeftoets: 20 vragen, alle vakken door elkaar</button>
      </div>

      <div className="center" style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost" onClick={p.naarLeerscan}>
          🔎 {p.prog.leerscan ? 'Zo leer jij' : 'Hoe leer jij?: 15 korte vragen'}
        </button>
      </div>

      {p.wedstrijdAan && (
        <div className="center" style={{ marginTop: 10 }}>
          <button type="button" className="btn accent" onClick={p.naarWedstrijd}>
            ⚔️ Daag een vriend uit
          </button>
        </div>
      )}

      <div className="center" style={{ marginTop: 10 }}>
        {spelOpSlot
          ? (
            <button type="button" className="btn ghost" disabled title="Haal eerst je dagdoel">
              🔒 Spelletjes: haal eerst je dagdoel
            </button>
            )
          : (
            <button type="button" className="btn gold" onClick={p.naarSpellen}>
              🎮 Spelletjes →{p.spelNaDoel ? ' (verdiend!)' : ''}
            </button>
            )}
      </div>

      {/* Dezelfde kaart als onderaan het oefenscherm, voor het vak dat hier
          openstaat. Zo ligt hij er ook vóór en ná een reeks. */}
      <Formuleklapper vak={p.vak} bovenbouw={/[456] (havo|vwo)/.test(P.niveau)} />

      <p className="muted center" style={{ marginTop: 14, fontSize: 13 }}>
        Elke goede beurt is een ster erbij; vanaf vier sterren heet een som <b>beheerst</b>. Foute
        sommen komen vaker terug, beheerste sommen pas na een paar dagen. 🌱
      </p>
    </div>
  )
}

/**
 * Wat er vandaag op het planbord staat, bovenaan het scherm van het kind.
 *
 * Groot, en met één knop die doet wat je wilt: het bord openen. Een kleine
 * knop tussen de rest werd niet gezien, en een planbord dat je niet ziet
 * gebruik je niet. Staan er nog geen toetsen op, dan is er één tik om de
 * toetsen van deze week erop te zetten: een leeg bord is een drempel.
 */
function Planstrook({ pid, plan: opgeslagen, nuMs, bewaar, open, bovenbouw, catalogus: cat, oefen: naar }: {
  pid: string; plan: Planstand | undefined; nuMs: number; bewaar: (p: Planstand) => void
  open: () => void; bovenbouw: boolean
  catalogus: readonly Ingang[]; oefen: (vak: string, onderwerp?: string, jaar?: string) => void
}): ReactNode {
  const oefen = (t: Toets): void => {
    const r = oefenroute(t, cat)[0]
    if (r) naar(r.vak, r.onderwerp, r.jaar)
  }
  const kanOefenen = (t: Toets): boolean => oefenroute(t, cat).length > 0
  const vandaag = isoVan(new Date(nuMs))
  /* Zoals het bord er vandaag uitziet, ook als het sinds gisteren niet meer
     geopend is: anders staat hier "niets gepland" terwijl er werk ligt. */
  const plan = opgeslagen ? actueel(opgeslagen, vandaag) : undefined
  const herplan = (q: Planstand): void => bewaar(actueel({ ...q, geplandVoor: null }, vandaag))
  const toetsen = plan ? toetsStand(plan, vandaag).filter((s) => s.dagen >= 0) : []
  const kader = { marginTop: 14, background: '#eef6ff', border: '2px solid #3a6ea0', borderRadius: 18 }

  if (!plan || toetsen.length === 0) {
    if (!bovenbouw) return null
    const start = (STARTTOETSEN[pid] ?? []).filter((t) => t.datum > vandaag)
    return (
      <div className="card" style={kader}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>📅 Jouw planbord</div>
        <p style={{ margin: '6px 0 0', fontSize: 15 }}>
          Maak een schermafdruk van je rooster, je studiewijzer of de hoofdstukken die je moet
          leren. Het bord haalt er je toetsen uit, rekent terug vanaf de toetsdag en zegt elke
          dag wat je doet. Bij elke toets staat wat je in deze app kunt oefenen.
        </p>
        <div className="wrap" style={{ marginTop: 12 }}>
          {start.length > 0 && (
            <button
              type="button" className="btn gold"
              onClick={() => {
                let q = plan ?? leegPlan()
                for (const t of start) q = zetToets(q, { ...t, bijgewerkt: Date.now() })
                herplan(q)
              }}
            >⚡ Zet de toetsen van deze week erop ({start.length})</button>
          )}
          <button type="button" className="btn" onClick={open}>📸 Uit een foto van je rooster →</button>
        </div>
      </div>
    )
  }

  const vandaagBlokken = blokkenOp(plan, vandaag)
  const af = vandaagBlokken.filter((b) => b.gedaan).length
  const minuten = vandaagBlokken.filter((b) => !b.gedaan).reduce((m, b) => m + b.geschat, 0)
  const pct = vandaagBlokken.length ? Math.round(af / vandaagBlokken.length * 100) : 100
  const week = weekUren(plan, vandaag)
  return (
    <div className="card" style={kader}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>📅 Vandaag op je planbord</div>
        <span className="muted" style={{ fontSize: 13 }}>
          {af}/{vandaagBlokken.length} af{minuten > 0 ? ` · nog ± ${minuten} min` : ''}
        </span>
      </div>
      <div className="pbar" style={{ marginTop: 8 }}><i style={{ width: pct + '%' }} /></div>

      <div className="wrap" style={{ marginTop: 10, gap: 6 }}>
        {toetsen.slice(0, 3).map((st) => (
          <span key={st.toets.id} className="badge" style={{ fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: STATUSKLEUR[st.status], display: 'inline-block' }} />
            {st.toets.opdracht ? '📎 ' : ''}{VAKNAAM[st.toets.vak] ?? st.toets.vak} · {dagLabel(st.toets.datum, vandaag)}
          </span>
        ))}
        {toetsen.length > 3 && <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>+{toetsen.length - 3}</span>}
      </div>

      {vandaagBlokken.length === 0 && (
        <p className="muted" style={{ fontSize: 14, margin: '10px 0 0' }}>Vandaag niets gepland. 🎉</p>
      )}
      {vandaagBlokken.map((b) => (
        <Blokregel
          key={b.id} blok={b} plan={plan} vandaag={vandaag} bewaar={bewaar} herplan={herplan}
          oefen={oefen} kanOefenen={kanOefenen}
        />
      ))}
      <div className="row" style={{ marginTop: 12, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn" onClick={open}>Hele planning →</button>
        <span className="muted" style={{ fontSize: 13 }}>
          komende week {week.laag === week.hoog ? `${week.laag} uur` : `${week.laag} tot ${week.hoog} uur`}
        </span>
      </div>
    </div>
  )
}
