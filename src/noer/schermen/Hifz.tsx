/**
 * UIT JE HOOFD LEREN — vier oefeningen per tekst
 *
 * Meelezen, woorden wegstoppen, de puzzel, de toets. Die volgorde is de hele
 * didactiek: eerst zien en horen, dan zelf aanvullen, dan de volgorde zonder
 * de tekst, en pas daarna zonder hulp. Wie meteen bij de toets begint leert
 * het niet, hij ontdekt alleen dat hij het nog niet kent.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { HIFZ } from '../gegevens/hifz'
import { INSIGNES } from '../gegevens/beloning'
import type { Hifz as Hifztekst } from '../gegevens/soorten'
import { TARIEF } from '../opslag'
import {
  XP, checkInsignes, checkMissie, markeerOefening, puntenErbij, verdien,
} from '../voortgang'
import { Balk, Blad, Tag } from '../onderdelen'
import { STEM, toon } from '../geluid'
import { Tekstblok, useGeluid } from '../luisteren'
import { GeenProfiel } from './Vandaag'
import { Woordpuzzel } from './Woordpuzzel'
import type { Toestand } from '../toestand'
import type { Tab } from '../tabs'

type Oefening = 'lees' | 'verberg' | 'puzzel' | 'toets'

export function Hifz({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  const [open, zetOpen] = useState<string | null>(null)
  const [oef, zetOef] = useState<Oefening | null>(null)
  if (!t.profiel) return <GeenProfiel ga={ga} />

  const { pr } = t
  const klaar = Object.values(pr.hifz).filter((h) => h.gehaald).length
  const h = open ? HIFZ.find((x) => x.id === open) : null

  return (
    <div className="stack">
      <div className="card">
        <p className="meta">Onderdeel 4</p>
        <h2 style={{ marginTop: 4 }}>Uit je hoofd leren</h2>
        <p className="klein" style={{ marginTop: 8 }}>
          Twaalf korte soera's en de vaste teksten van het gebed. Elke tekst heeft vier
          oefeningen: meelezen, woorden wegstoppen, de puzzel, en de toets. Haal je de toets, dan
          telt hij als gekend — en dat levert {euro(TARIEF.hifz)} op.
        </p>
        <div className="rij" style={{ marginTop: 12 }}>
          <Tag soort="k">{klaar} van de {HIFZ.length} gekend</Tag>
          {!STEM.heeftAr() && <Tag soort="let">Geen Arabische stem op dit toestel</Tag>}
        </div>
        {!STEM.heeftAr() && (
          <p className="klein" style={{ marginTop: 9 }}>
            Je kunt de Arabische tekst niet laten voorlezen. Zet in de instellingen van je
            telefoon een Arabische stem erbij (bij Toegankelijkheid → Spraak), dan werkt de
            luisterknop wel.
          </p>
        )}
      </div>

      <div className="grid g3">
        {HIFZ.map((x) => {
          const st = pr.hifz[x.id] ?? { niveau: 0, gehaald: false }
          return (
            <button className="card klik" key={x.id} onClick={() => { zetOpen(x.id); zetOef(null) }}>
              <div className="rij tussen">
                <span className="ar" style={{ fontSize: '1.25rem', color: 'var(--k)' }}>{x.ar}</span>
                {st.gehaald ? <Tag soort="goed">Gekend</Tag> : <Tag>{st.niveau}/4</Tag>}
              </div>
              <h4 style={{ marginTop: 7 }}>{x.naam}</h4>
              <p className="klein" style={{ marginTop: 3 }}>
                {x.nr ? `Soera ${x.nr} · ${x.aya} aya` : 'Gebedstekst'}
              </p>
              <div style={{ marginTop: 10 }}><Balk pct={st.niveau / 4 * 100} /></div>
              <p className="klein" style={{ marginTop: 8 }}>{x.waarom}</p>
            </button>
          )
        })}
      </div>

      <Blad open={h !== null} sluit={() => { zetOpen(null); zetOef(null) }}>
        {h && oef === null && (
          <Menu h={h} t={t} kies={zetOef} sluit={() => zetOpen(null)} />
        )}
        {h && oef === 'lees' && <Lees h={h} t={t} terug={() => zetOef(null)} />}
        {h && oef === 'verberg' && <Verberg h={h} t={t} terug={() => zetOef(null)} />}
        {h && (oef === 'puzzel' || oef === 'toets') && (
          <Toets
            key={oef} h={h} t={t} toets={oef === 'toets'}
            terug={() => zetOef(null)} naarToets={() => zetOef('toets')}
          />
        )}
      </Blad>
    </div>
  )
}

/** Een niveau vastleggen. Alleen omhoog: een herhaling zet je niet terug. */
function zetNiveau(t: Toestand, h: Hifztekst, n: number): void {
  const { klok: k } = t
  t.zetProf((p) => {
    const st = p.hifz[h.id] ?? { niveau: 0, gehaald: false }
    let uit = p
    if (n > st.niveau) uit = puntenErbij(uit, XP.hifzNiveau, k.vandaag, k.gisteren)
    uit = {
      ...uit,
      hifz: {
        ...uit.hifz,
        [h.id]: { ...st, niveau: Math.max(st.niveau, n), d: k.vandaag },
      },
    }
    uit = markeerOefening(uit, k.vandaag, k.gisteren)
    return checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
  })
}

function Menu({ h, t, kies, sluit }: {
  h: Hifztekst; t: Toestand; kies: (o: Oefening) => void; sluit: () => void
}): ReactNode {
  const st = t.pr.hifz[h.id] ?? { niveau: 0, gehaald: false }
  const rijen: Array<[Oefening, string, string]> = [
    ['lees', '1 · Lees mee', 'Regel voor regel, met klank en betekenis. Tik op de luidspreker om te horen.'],
    ['verberg', '2 · Woorden wegstoppen', 'Steeds meer woorden verdwijnen. Tik erop als je het niet meer weet.'],
    ['puzzel', '3 · De puzzel', 'Zet de woorden van elke regel in de goede volgorde.'],
    ['toets', '4 · De toets', 'De hele tekst op volgorde, zonder hulp. Haal je hem, dan telt hij als gekend.'],
  ]
  return (
    <>
      <div className="rij tussen">
        <p className="meta">{h.nr ? `Soera ${h.nr}` : 'Gebedstekst'}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="rij tussen" style={{ marginTop: 6 }}>
        <h2>{h.naam}</h2>
        <span className="ar" style={{ fontSize: '1.6rem', color: 'var(--k)' }}>{h.ar}</span>
      </div>
      <p className="klein" style={{ marginTop: 6 }}>{h.waarom}</p>
      <div style={{ marginTop: 12 }}><Balk pct={st.niveau / 4 * 100} /></div>
      <div className="stack" style={{ marginTop: 16 }}>
        {rijen.map(([o, kop, uitleg]) => (
          <button className="card klik" key={o} style={{ padding: '14px 16px' }} onClick={() => kies(o)}>
            <b>{kop}</b>
            <p className="klein">{uitleg}</p>
          </button>
        ))}
      </div>
    </>
  )
}

function Lees({ h, t, terug }: { h: Hifztekst; t: Toestand; terug: () => void }): ReactNode {
  const g = useGeluid()
  return (
    <>
      <div className="rij tussen">
        <p className="meta">{h.naam} · lees mee</p>
        <button className="icoon" onClick={terug} aria-label="Terug">✕</button>
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {h.r.map((r, i) => (
          <Tekstblok key={i} o={{ ar: r[0], tr: r[1], nl: r[2], aid: `q:${h.id}:${i + 1}` }} />
        ))}
      </div>
      <div className="rij" style={{ marginTop: 18 }}>
        <button
          className="btn"
          onClick={() => g.speelReeks(h.r.map((x, i) => [`q:${h.id}:${i + 1}`, x[0]]))}
        >▶︎ Alles achter elkaar</button>
        <button className="btn ghost" onClick={g.stop}>■ Stop</button>
        <button className="btn ghost" onClick={() => { zetNiveau(t, h, 1); terug() }}>Klaar →</button>
      </div>
    </>
  )
}

/** Welke woorden verstopt zijn. Vast per ronde, zodat het scherm niet trilt. */
function verstopt(regels: string[][], deel: number, zaad: number): boolean[][] {
  let z = zaad || 1
  return regels.map((r) => (r[0] as string).split(' ').map(() => {
    z = (z * 1103515245 + 12345) & 0x7fffffff
    return z / 0x7fffffff < deel
  }))
}

function Verberg({ h, t, terug }: { h: Hifztekst; t: Toestand; terug: () => void }): ReactNode {
  const [deel, zetDeel] = useState(0.3)
  const [zicht, zetZicht] = useState<Set<string>>(new Set())
  const masker = verstopt(h.r, deel, Math.round(deel * 1000) + 17)

  return (
    <>
      <div className="rij tussen">
        <p className="meta">{h.naam} · woorden wegstoppen</p>
        <button className="icoon" onClick={terug} aria-label="Terug">✕</button>
      </div>
      <p className="klein" style={{ marginTop: 8 }}>
        {Math.round(deel * 100)}% van de woorden staat verstopt. Tik op een grijs vlak om het
        even te zien.
      </p>
      <div className="card plat" style={{ marginTop: 14, background: 'var(--surface-2)' }}>
        {h.r.map((r, i) => (
          <div className="ar" style={{ fontSize: '1.45rem', marginBottom: 14 }} key={i}>
            {r[0].split(' ').map((w, k) => {
              const sleutel = `${i}-${k}`
              if (!masker[i]?.[k]) return <span key={sleutel}>{w} </span>
              return (
                <span key={sleutel}>
                  <span
                    className={`verborgen${zicht.has(sleutel) ? ' zicht' : ''}`}
                    onClick={() => zetZicht((s) => {
                      const n = new Set(s)
                      if (n.has(sleutel)) n.delete(sleutel)
                      else n.add(sleutel)
                      return n
                    })}
                  >{w}</span>{' '}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="rij tussen" style={{ marginTop: 18 }}>
        <button
          className="btn ghost"
          onClick={() => { zetDeel(Math.min(1, deel + 0.2)); zetZicht(new Set()) }}
        >Meer wegstoppen</button>
        <button
          className="btn"
          onClick={() => {
            if (deel >= 0.8) { zetNiveau(t, h, 2); terug() } else { zetDeel(Math.min(1, deel + 0.25)); zetZicht(new Set()) }
          }}
        >{deel >= 0.8 ? 'Klaar' : 'Volgende ronde'}</button>
      </div>
    </>
  )
}

function Toets({ h, t, toets, terug, naarToets }: {
  h: Hifztekst; t: Toestand; toets: boolean; terug: () => void; naarToets: () => void
}): ReactNode {
  const [af, zetAf] = useState<{ fouten: number; gehaald: boolean; verdiend: number; nieuw: string[] } | null>(null)
  const { klok: k } = t

  const rond = (fouten: number): void => {
    if (!toets) {
      zetNiveau(t, h, 3)
      zetAf({ fouten, gehaald: true, verdiend: 0, nieuw: [] })
      return
    }
    const woorden = h.r.reduce((n, r) => n + r[0].split(' ').filter(Boolean).length, 0)
    const grens = Math.max(2, Math.round(woorden * 0.25))
    const gehaald = fouten <= grens
    let verdiend = 0
    let nieuw: string[] = []
    t.zetProf((p) => {
      const st = p.hifz[h.id] ?? { niveau: 0, gehaald: false }
      let uit = p
      if (gehaald) {
        if (!st.gehaald) {
          const b = verdien(uit, 'Uit het hoofd: ' + h.naam, TARIEF.hifz,
            t.stand.gezin.budget, k.vandaag, k.ms)
          uit = b.stand
          verdiend = b.echt
          uit = puntenErbij(uit, XP.hifzNiveau * 2, k.vandaag, k.gisteren)
        }
        toon('top', t.stand.instel.geluid)
      }
      uit = {
        ...uit,
        hifz: {
          ...uit.hifz,
          [h.id]: {
            niveau: gehaald ? 4 : st.niveau,
            gehaald: st.gehaald || gehaald,
            d: k.vandaag,
          },
        },
      }
      uit = markeerOefening(uit, k.vandaag, k.gisteren)
      const ins = checkInsignes(uit, t.spoor)
      nieuw = ins.nieuw
      return checkMissie(ins.stand, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    })
    zetAf({ fouten, gehaald, verdiend, nieuw })
  }

  if (af) {
    if (!toets) {
      return (
        <>
          <h2>Regel voor regel gelukt</h2>
          <p style={{ marginTop: 10 }}>
            {af.fouten} keer misgetikt. Doe de toets als je hem zonder hint aankunt.
          </p>
          <div className="rij" style={{ marginTop: 18 }}>
            <button className="btn" onClick={naarToets}>Naar de toets</button>
            <button className="btn ghost" onClick={terug}>Terug</button>
          </div>
        </>
      )
    }
    const woorden = h.r.reduce((n, r) => n + r[0].split(' ').filter(Boolean).length, 0)
    const grens = Math.max(2, Math.round(woorden * 0.25))
    return (
      <>
        <h2>{af.gehaald ? 'Gekend!' : 'Nog niet helemaal'}</h2>
        <p style={{ marginTop: 10 }}>
          {af.fouten} keer misgetikt{af.gehaald ? '' : ` — dat mocht er hoogstens ${grens} zijn`}.{' '}
          {af.gehaald
            ? 'Herhaal hem morgen nog een keer, dan blijft hij zitten.'
            : 'Doe de puzzel nog een paar keer en probeer het opnieuw.'}
        </p>
        {af.verdiend > 0 && (
          <div className="kader" style={{ marginTop: 14 }}>
            <h4>Verdiend</h4><p>{euro(af.verdiend)} bij je saldo.</p>
          </div>
        )}
        {af.nieuw.length > 0 && (
          <div className="kader" style={{ marginTop: 14 }}>
            <h4>Nieuw insigne</h4>
            <p>{af.nieuw.map((x) => {
              const b = INSIGNES.find((y) => y.id === x)
              return b ? `${b.ico} ${b.n}` : x
            }).join(' · ')}</p>
          </div>
        )}
        <div className="rij" style={{ marginTop: 18 }}>
          <button className="btn" onClick={terug}>Terug</button>
        </div>
      </>
    )
  }

  return (
    <Woordpuzzel
      regels={h.r}
      kop={`${h.naam} · ${toets ? 'toets' : 'puzzel'}`}
      hint={!toets}
      hifzId={h.id}
      geluid={t.stand.instel.geluid}
      sluit={terug}
      klaar={rond}
    />
  )
}
