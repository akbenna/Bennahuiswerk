/**
 * HET LEERPAD — vijftien modules, met de les als venster erover
 *
 * Welke lessen je ziet hangt af van je leeftijd: het spoor. Een module waarvan
 * op jouw spoor nog geen enkele les meedoet, staat er grijs bij met "vanaf tien
 * jaar" erop — zichtbaar, want dat er meer komt is zelf ook een boodschap.
 *
 * Een les is eerst lezen, dan drie vragen. Bij twee of meer goed is hij
 * gehaald; hij overdoen mag altijd, maar levert dan een kwart van de punten en
 * geen geld meer op.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { MODULES } from '../gegevens/modules'
import { INSIGNES } from '../gegevens/beloning'
import { SPOREN } from '../gegevens/beloning'
import type { Les, Module } from '../gegevens/soorten'
import { TARIEF } from '../opslag'
import type { Voortgang } from '../opslag'
import {
  XP, alleLessen, checkInsignes, checkMissie, leeftijd, lessenVan,
  puntenErbij, verdien,
} from '../voortgang'
import type { Lesplek } from '../voortgang'
import { Balk, Blad, Ring, Rijk, Tag, Vink } from '../onderdelen'
import { Tafereel } from '../figuren'
import { TAFEREEL } from '../gegevens/figuren'
import { MODKLEUR } from '../tabs'
import type { Tab } from '../tabs'
import { toon } from '../geluid'
import { useGeluid } from '../luisteren'
import { GeenProfiel } from './Vandaag'
import type { Toestand } from '../toestand'

export const kleurVan = (id: string): string =>
  MODKLEUR[MODULES.findIndex((m) => m.id === id) % MODKLEUR.length] as string

const zonderHtml = (t: string): string => String(t || '').replace(/<[^>]+>/g, '')

/** De eerste zin van een les, afgekapt: genoeg om te zien waar het over gaat. */
const tipVan = (l: Les): string => {
  const e = zonderHtml(l.tk[0] ?? l.jr ?? '')
  return e.length > 112 ? e.slice(0, 112).replace(/\s\S*$/, '') + '…' : e
}

/** Vanaf welke leeftijd een spoor begint. */
const vanaf = (n: number): number => (n === 1 ? 7 : n === 2 ? 10 : 13)

export function Leerpad({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  const [mod, zetMod] = useState<string | null>(null)
  const [les, zetLes] = useState<string | null>(null)

  if (!t.profiel) return <GeenProfiel ga={ga} />

  const { pr, spoor } = t
  const mijn = alleLessen(spoor)
  const klaarTotaal = mijn.filter((l) => pr.lessen[l.id]?.klaar).length
  const later = MODULES.filter((m) => lessenVan(m, spoor).length === 0)
  const uitleg = spoor === 1
    ? 'Korte teksten, veel beeld, en drie vragen na elke les. De zwaardere onderwerpen komen vanzelf als je ouder wordt.'
    : spoor === 2
      ? 'De volledige uitleg, met de achtergrond erbij: waar iets vandaan komt en waarom het zo is.'
      : 'De volledige uitleg plus een blok verdieping bij elke les — met de fiqh-termen, het verschil van mening en de vragen waar niet iedereen een makkelijk antwoord op heeft.'

  return (
    <>
      <div>
        <h1>Het leerpad</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Alles wat een moslim moet weten, in veertien modules — van wie Allah is tot de vragen
          die je op je vijftiende krijgt. Het gebed is daarvan één onderdeel; de rest gaat over
          geloven, gedrag, de Koran, de geschiedenis en het leven hier.
        </p>
      </div>

      <div className="card">
        <div className="rij tussen">
          <div>
            <p className="meta">Jouw leerlijn</p>
            <h2 style={{ marginTop: 4 }}>{SPOREN[spoor].n}</h2>
            <p className="klein" style={{ marginTop: 4 }}>
              {t.profiel.naam} is {leeftijd(t.profiel, t.klok.jaar)} · {SPOREN[spoor].u.toLowerCase()}
            </p>
          </div>
          <Ring
            pct={mijn.length ? klaarTotaal / mijn.length * 100 : 0}
            tekst={`${klaarTotaal}/${mijn.length}`}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <Balk pct={mijn.length ? klaarTotaal / mijn.length * 100 : 0} />
        </div>
        <p className="klein" style={{ marginTop: 11 }}>{uitleg}</p>
        {later.length > 0 && (
          <p className="klein" style={{ marginTop: 8 }}>
            Er {later.length === 1
              ? 'wacht nog één module die opengaat'
              : `wachten nog ${later.length} modules die opengaan`} als je ouder bent.
          </p>
        )}
      </div>

      <div className="grid g2">
        {MODULES.map((m) => {
          const ls = lessenVan(m, spoor)
          if (!ls.length) {
            const nodig = Math.min(...m.lessen.map((l) => l.sp || 1))
            return (
              <div className="card plat" style={{ opacity: 0.55 }} key={m.id}>
                <div className="rij tussen">
                  <span className="ico-vak" style={{ '--mkbg': 'var(--surface-2)', filter: 'grayscale(1)' } as React.CSSProperties}>
                    {m.ico}
                  </span>
                  <Tag soort="let">Vanaf {vanaf(nodig)} jaar</Tag>
                </div>
                <h3 style={{ marginTop: 9 }}>
                  {m.t} <span className="ar" style={{ fontSize: '1rem', color: 'var(--muted)' }}>{m.ar}</span>
                </h3>
                <p className="klein" style={{ marginTop: 5 }}>{m.lead}</p>
              </div>
            )
          }
          const klaar = ls.filter((l) => pr.lessen[l.id]?.klaar).length
          const kl = kleurVan(m.id)
          return (
            <button
              className="card klik mod" key={m.id}
              style={{ '--mk': `var(--${kl})`, '--mkbg': `var(--${kl}-bg)` } as React.CSSProperties}
              onClick={() => zetMod(m.id)}
            >
              <div className="rij tussen">
                <span className="ico-vak">{m.ico}</span>
                {klaar === ls.length
                  ? <Tag soort="goed">Af</Tag>
                  : <Tag style={{ background: 'var(--mkbg)', color: 'var(--mk)' }}>{klaar}/{ls.length}</Tag>}
              </div>
              <h3 style={{ marginTop: 11 }}>
                {m.t} <span className="ar" style={{ fontSize: '1rem', color: 'var(--mk)' }}>{m.ar}</span>
              </h3>
              <p className="klein" style={{ marginTop: 5 }}>{m.lead}</p>
              <div style={{ marginTop: 11 }}><Balk pct={klaar / ls.length * 100} /></div>
            </button>
          )
        })}
      </div>

      <Blad open={mod !== null && les === null} sluit={() => zetMod(null)}>
        {mod !== null && (
          <Moduleblad
            m={MODULES.find((x) => x.id === mod) as Module}
            pr={pr} spoor={spoor}
            sluit={() => zetMod(null)}
            opLes={(id) => zetLes(id)}
          />
        )}
      </Blad>

      <Blad open={les !== null} sluit={() => zetLes(null)}>
        {les !== null && (
          <Lesblad
            key={les}
            id={les} t={t}
            sluit={() => { zetLes(null); zetMod(null) }}
            naar={(id) => zetLes(id)}
          />
        )}
      </Blad>
    </>
  )
}

function Moduleblad({ m, pr, spoor, sluit, opLes }: {
  m: Module; pr: Voortgang; spoor: 1 | 2 | 3; sluit: () => void; opLes: (id: string) => void
}): ReactNode {
  const kl = kleurVan(m.id)
  return (
    <div style={{ '--mk': `var(--${kl})`, '--mkbg': `var(--${kl}-bg)` } as React.CSSProperties}>
      <div className="rij tussen">
        <span className="ico-vak">{m.ico}</span>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <h2 style={{ marginTop: 8 }}>{m.t}</h2>
      <p className="klein" style={{ marginTop: 5 }}>{m.lead}</p>
      <ul className="geen" style={{ marginTop: 16 }}>
        {lessenVan(m, spoor).map((l, i) => {
          const st = pr.lessen[l.id]
          return (
            <li key={l.id}>
              <Vink aan={Boolean(st?.klaar)} />
              <button
                className="klik"
                style={{
                  flex: 1, textAlign: 'left', background: 'none', border: 0,
                  font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0,
                }}
                onClick={() => opLes(l.id)}
              >
                <b>{i + 1}. {l.t}</b>
                {l.ar && <span className="ar" style={{ fontSize: '.95rem', color: 'var(--k)' }}> {l.ar}</span>}
                {st?.klaar && <span className="klein"> · {st.score}/3 goed</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type Fase = { soort: 'lezen' } | { soort: 'vraag'; i: number; goed: number }
  | { soort: 'klaar'; goed: number; totaal: number; verdiend: number; nieuw: string[] }

function Lesblad({ id, t, sluit, naar }: {
  id: string; t: Toestand; sluit: () => void; naar: (id: string) => void
}): ReactNode {
  const [fase, zetFase] = useState<Fase>({ soort: 'lezen' })
  const g = useGeluid()
  const { pr, spoor, klok: k } = t
  const l = alleLessen(spoor).find((x) => x.id === id)
  if (!l) return null

  const rond = (goed: number): void => {
    const totaal = (l.q ?? []).length
    const gehaald = goed >= Math.ceil(totaal * 2 / 3)
    let verdiend = 0
    let nieuw: string[] = []
    t.zetProf((p) => {
      let uit = p
      if (gehaald) {
        const eerste = !p.lessen[l.id]?.klaar
        const oud = p.lessen[l.id]
        uit = {
          ...uit,
          lessen: {
            ...uit.lessen,
            [l.id]: { klaar: true, score: Math.max(oud?.score ?? 0, goed), d: k.vandaag },
          },
        }
        if (eerste) {
          uit = puntenErbij(uit, XP.les, k.vandaag, k.gisteren)
          const b = verdien(uit, 'Les: ' + l.t, TARIEF.les, t.stand.gezin.budget, k.vandaag, k.ms)
          uit = b.stand
          verdiend = b.echt
        } else {
          uit = puntenErbij(uit, Math.round(XP.les / 4), k.vandaag, k.gisteren)
        }
        toon('top', t.stand.instel.geluid)
      }
      const ins = checkInsignes(uit, spoor)
      nieuw = ins.nieuw
      return checkMissie(ins.stand, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    })
    zetFase({ soort: 'klaar', goed, totaal, verdiend, nieuw })
  }

  if (fase.soort === 'vraag') {
    /* De sleutel per vraag: zonder dat blijft het gekozen antwoord van de
       vorige vraag staan en zijn alle knoppen meteen uitgeschakeld. */
    return <Vraagblad key={fase.i} l={l} i={fase.i} goed={fase.goed} sluit={sluit} inst={t.stand.instel}
      verder={(g2) => {
        const volg = fase.i + 1
        if (volg >= (l.q ?? []).length) rond(g2)
        else zetFase({ soort: 'vraag', i: volg, goed: g2 })
      }} />
  }

  if (fase.soort === 'klaar') {
    const gehaald = fase.goed >= Math.ceil(fase.totaal * 2 / 3)
    const volgende = alleLessen(spoor).find((x) => !pr.lessen[x.id]?.klaar && x.id !== l.id)
    return (
      <>
        <div className="rij tussen">
          <p className="meta">{l.modT}</p>
          <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
        </div>
        <h2 style={{ marginTop: 6 }}>{gehaald ? 'Gehaald' : 'Nog een keer'}</h2>
        <p style={{ marginTop: 8 }}>
          {fase.goed} van de {fase.totaal} goed.
          {!gehaald && ' Je hebt er twee nodig — lees het nog een keer rustig door, dan lukt het.'}
        </p>
        {fase.verdiend > 0 && (
          <div className="kader" style={{ marginTop: 14 }}>
            <h4>Verdiend</h4>
            <p>{euro(fase.verdiend)} bij je saldo. Je vader of moeder betaalt uit bij <b>Beloning</b>.</p>
          </div>
        )}
        {fase.nieuw.length > 0 && (
          <div className="kader" style={{ marginTop: 14 }}>
            <h4>Nieuw insigne</h4>
            <p>{fase.nieuw.map((x) => {
              const b = INSIGNES.find((y) => y.id === x)
              return b ? `${b.ico} ${b.n}` : x
            }).join(' · ')}</p>
          </div>
        )}
        <div className="rij" style={{ marginTop: 20 }}>
          {volgende && (
            <button className="btn" onClick={() => { zetFase({ soort: 'lezen' }); naar(volgende.id) }}>
              Volgende les →
            </button>
          )}
          <button className="btn ghost" onClick={sluit}>Sluiten</button>
        </div>
      </>
    )
  }

  /* Lezen. Bij een verhaal hoort een vraag om samen over door te praten; die
     staat apart, want hij is niet bedoeld om af te vinken maar om te stellen. */
  const tekst = spoor === 1 && l.jr ? [l.jr] : l.tk
  const verder = (l.zie ?? []).map((x) => alleLessen(spoor).find((y) => y.id === x))
    .filter((x): x is Lesplek => x !== undefined)
  const verhalen = verder.filter((v) => v.mod === 'm15')
  const overig = verder.filter((v) => v.mod !== 'm15')
  const vkl = kleurVan('m15')
  const kl = kleurVan(l.mod)
  const voorlezen = zonderHtml(tekst.join(' '))

  return (
    <div style={{ '--mk': `var(--${kl})`, '--mkbg': `var(--${kl}-bg)` } as React.CSSProperties}>
      <div className="rij tussen">
        <p className="meta" style={{ color: 'var(--mk)' }}>{l.modT}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <h2 style={{ marginTop: 6 }}>
        {l.t} {l.ar && <span className="ar" style={{ fontSize: '1.1rem', color: 'var(--mk)' }}>{l.ar}</span>}
      </h2>
      {TAFEREEL[l.id] && <div style={{ marginTop: 14 }}><Tafereel id={l.id} /></div>}
      <div className="nl" style={{ marginTop: 14 }}>
        {tekst.map((p, i) => <Rijk key={i} als="p" html={p} />)}
      </div>
      {spoor === 3 && l.dp && (
        <div className="kader info" style={{ marginTop: 16 }}>
          <h4>Voor wie verder wil</h4>
          <Rijk als="p" html={l.dp} />
        </div>
      )}
      {l.praat && (
        <div className="praat">
          <p className="meta" style={{ marginBottom: 6 }}>Praat er thuis over</p>
          <p>{l.praat}</p>
        </div>
      )}

      {verhalen.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="meta">
            {verhalen.length === 1 ? 'Hierover gaat een verhaal' : 'Hierover gaan verhalen'}
          </p>
          <div className="stack" style={{ marginTop: 9 }}>
            {verhalen.map((v) => (
              <button
                className="card klik verhaalkaart" key={v.id}
                style={{ '--mk': `var(--${vkl})`, '--mkbg': `var(--${vkl}-bg)` } as React.CSSProperties}
                onClick={() => naar(v.id)}
              >
                <span className={TAFEREEL[v.id] ? 'vk-beeld' : 'ico-vak'}>
                  {TAFEREEL[v.id] ? <Tafereel id={v.id} /> : '📜'}
                </span>
                <span className="vk-tekst">
                  <span className="meta" style={{ color: 'var(--mk)' }}>Verhaal van een profeet</span>
                  <b>{v.t}</b>
                  <span className="klein">{tipVan(v)}</span>
                </span>
                <span className="vk-pijl">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {overig.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p className="meta">Hoort hierbij</p>
          <div className="rij" style={{ marginTop: 8 }}>
            {overig.map((v) => (
              <button className="btn sm ghost" key={v.id} onClick={() => naar(v.id)}>{v.t}</button>
            ))}
          </div>
        </div>
      )}

      <div className="rij" style={{ marginTop: 20 }}>
        <button className="btn" onClick={() => zetFase({ soort: 'vraag', i: 0, goed: 0 })}>
          Ik heb het gelezen →
        </button>
        <button className="icoon" title="Voorlezen" onClick={() => g.zegNL(voorlezen)}>🔊</button>
      </div>
    </div>
  )
}

function Vraagblad({ l, i, goed, verder, sluit, inst }: {
  l: Lesplek; i: number; goed: number
  verder: (goed: number) => void; sluit: () => void; inst: { geluid: boolean }
}): ReactNode {
  const [gekozen, zetGekozen] = useState<number | null>(null)
  const q = (l.q ?? [])[i]
  if (!q) return null
  const ok = gekozen === q.a

  return (
    <>
      <div className="rij tussen">
        <p className="meta">Vraag {i + 1} van {(l.q ?? []).length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {(l.q ?? []).map((_, k) => <i key={k} className={k < i ? 'aan' : ''} />)}
      </div>
      <h3 style={{ marginTop: 18 }}>{q.v}</h3>
      <div className="stack" style={{ marginTop: 16 }}>
        {q.o.map((o, k) => (
          <button
            className="card klik" key={k}
            style={{
              padding: '14px 16px',
              pointerEvents: gekozen === null ? undefined : 'none',
              borderColor: gekozen === null ? undefined
                : k === q.a ? 'var(--goed)' : k === gekozen ? 'var(--fout)' : undefined,
            }}
            onClick={() => { zetGekozen(k); toon(k === q.a ? 'goed' : 'mis', inst.geluid) }}
          >{o}</button>
        ))}
      </div>
      {gekozen !== null && (
        <>
          <div className={`kader ${ok ? '' : 'let'}`} style={{ marginTop: 16 }}>
            <h4>{ok ? 'Goed' : 'Bijna'}</h4>
            <p>{q.u}</p>
          </div>
          <div className="rij" style={{ marginTop: 14 }}>
            <button className="btn" onClick={() => verder(goed + (ok ? 1 : 0))}>Verder →</button>
          </div>
        </>
      )}
    </>
  )
}
