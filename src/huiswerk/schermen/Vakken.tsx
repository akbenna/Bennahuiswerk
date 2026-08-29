/**
 * VAKKEN — het scherm van één kind
 *
 * Alles wat een kind nodig heeft om te kiezen wat het gaat doen. De volgorde is
 * omgedraaid ten opzichte van de eerste opzet, en daar zit de hele gedachte in.
 *
 * Vroeger stond bovenaan wat er al bereikt was — rang, dagmissie, dagdoel,
 * verdiend geld, niveau — en pas na zeven kaarten de vakken. De redenering was
 * dat een kind eerst hoort te zien dat het ergens staat. In de praktijk betekende
 * het scrollen: wie kwam oefenen moest eerst langs alles wat leuk is aan
 * oefenen voordat hij kon beginnen.
 *
 * Nu staat het werk vooraan: de weektaak van de ouder, dan de vakken en de
 * onderwerpen. Wat er te halen valt staat eronder in één kaart die dicht begint.
 * Alleen het dagdoel blijft als smalle strook zichtbaar — dat is geen beloning
 * maar de opdracht van vandaag.
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ONDERWERPICOON, PROFIELEN, VAKNAAM } from '../gegevens/profielen'
import type { Kaart, Thema } from '../gegevens/soorten'
import type { Voortgang } from '../opslag'
import { berekenBeloning, euro, halfRond, weekVerdiend } from '../beloning'
import { isBeheerst, kaartStand } from '../leitner'
import { INSIGNES, dagMissie, rangVoor } from '../missie'
import { Klapkaart } from '../onderdelen'
import { Vraagveld } from './Vraagveld'
import type { Uitslag } from '../vraagbaak'

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

      <div className={'doelstrook' + (doelGehaald ? ' klaar' : '')}>
        <span className="tel">
          🎯 {p.prog.todayCount || 0} / {doel}
        </span>
        <div className="pbar"><i style={{ width: doelPct + '%' }} /></div>
        <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {doelGehaald ? 'gehaald! 🎉' : p.thema.doel}
        </span>
      </div>

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

      {onderwerpen.map(({ t, total, beheerst }) => {
        const pct = total ? Math.round(beheerst / total * 100) : 0
        const sterren = pct >= 100 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : beheerst > 0 ? '⭐' : '☆☆☆'
        return (
          <button type="button" key={t} className="topic" onClick={() => p.naarOnderwerp(t, jaar)}>
            <div className="ico">{ONDERWERPICOON[t] ?? '📘'}</div>
            <div className="grow">
              <div className="tt">{t}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {beheerst} / {total} beheerst · <span className="stars">{sterren}</span>
              </div>
              <div className="pbar"><i style={{ width: pct + '%' }} /></div>
            </div>
            <div>›</div>
          </button>
        )
      })}

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
            <b>⭐ Dagmissie {missie.klaar ? '— gehaald! 🎉' : ''}</b>
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
                : <span>💡 Haal een oefentoets voor een bonus — hoe hoger je score, hoe meer.</span>}
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
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>📈 Niveau</b>
            <span className="muted" style={{ fontSize: 13 }}>
              {p.prog.niveau === 'auto'
                ? `Automatisch (nu niveau ${p.prog.autoLvl || 1})`
                : `Vast op niveau ${p.prog.niveau}`}
            </span>
          </div>
          <div className="wrap" style={{ marginTop: 10 }}>
            {([['auto', 'Auto'], [1, '1 · makkelijk'], [2, '2 · middel'], [3, '3 · moeilijk']] as
              Array<[Voortgang['niveau'], string]>).map(([v, label]) => (
              <button
                type="button" key={String(v)}
                className={'btn sm ' + (p.prog.niveau === v ? '' : 'ghost')}
                onClick={() => p.zetNiveau(v)}
              >{label}</button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            {p.prog.niveau === 'auto'
              ? 'Bij Auto wordt het vanzelf een tikje moeilijker als het goed gaat, en makkelijker '
                + 'als het even niet lukt.'
              : 'Bij een vast niveau krijg je vooral oefeningen van dat niveau.'}
          </p>
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
        >📝 Proeftoets — 20 vragen, alle vakken door elkaar</button>
      </div>

      <div className="center" style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost" onClick={p.naarLeerscan}>
          🔎 {p.prog.leerscan ? 'Zo leer jij' : 'Hoe leer jij? — 15 korte vragen'}
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
              🔒 Spelletjes — haal eerst je dagdoel
            </button>
            )
          : (
            <button type="button" className="btn gold" onClick={p.naarSpellen}>
              🎮 Spelletjes →{p.spelNaDoel ? ' (verdiend!)' : ''}
            </button>
            )}
      </div>

      <p className="muted center" style={{ marginTop: 14, fontSize: 13 }}>
        Een som is <b>beheerst</b> als je hem een paar keer achter elkaar goed hebt. Foute sommen
        komen vaker terug. 🌱
      </p>
    </div>
  )
}
