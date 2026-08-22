/**
 * HET JAAR — de les, het werkblad, de niveaubepaling en de blokttoets
 *
 * Zesendertig weken van anderhalf uur, één vast moment per week. De les loopt
 * in zeven onderdelen met de klok erbij; die klok is een hulpmiddel en geen
 * baas: hij loopt door en waarschuwt zacht, maar niets sluit vanzelf af.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BLOKKEN, JAAR, METING, METINGNIVEAUS, SESSIE } from './gegevens/jaarplan'
import { LETTERS } from './gegevens/letters'
import type { Week } from './gegevens/soorten'
import { lettersTot, weekVan } from './leerplan'
import { letterVormen } from './tekst'
import { husselen } from './toeval'
import type { Toeval } from './toeval'
import { Balk } from './onderdelen'
import { Vormrij } from './inhoud'
import type { Spraak } from './spraak'

const AR = /[؀-ۿ]/

/* ------------------------------------------------------------ de les zelf */

export function Les(
  { week, klaar, naarWerkblad }:
  { week: number; klaar: (w: Week) => void; naarWerkblad: () => void },
): ReactNode {
  const [i, zetI] = useState(0)
  const w = weekVan(week)
  const st = SESSIE[i]
  if (!w || !st) return null

  return (
    <>
      <span className="label">
        Week {week} · {st.t} · onderdeel {i + 1} van {SESSIE.length}
      </span>
      <Balk pct={Math.round(i / SESSIE.length * 100)} style={{ margin: '10px 0 4px' }} />
      <div className="rij tussen" style={{ marginBottom: 12 }}>
        <span className="klein muted">{st.wat}</span>
        <Klok key={st.id} minuten={st.min} />
      </div>

      <Lesonderdeel stap={st.id} w={w} week={week} naarWerkblad={naarWerkblad} />

      <div className="rij tussen" style={{ marginTop: 20 }}>
        <button type="button" className="k rand" disabled={i === 0} onClick={() => zetI(i - 1)}>
          Terug
        </button>
        <button
          type="button" className="k vol"
          onClick={() => (i === SESSIE.length - 1 ? klaar(w) : zetI(i + 1))}
        >
          {i === SESSIE.length - 1 ? 'De les is klaar' : 'Volgende'}
        </button>
      </div>
    </>
  )
}

/** De klok van één lesonderdeel. Loopt af naar nul en blijft daar staan. */
function Klok({ minuten }: { minuten: number }): ReactNode {
  const [over, zetOver] = useState(minuten * 60)
  useEffect(() => {
    const t = setInterval(() => zetOver((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="klein muted" style={{ fontFamily: 'var(--mono)' }}>
      {Math.floor(over / 60)}:{String(over % 60).padStart(2, '0')}
    </span>
  )
}

function Lesonderdeel(
  { stap, w, week, naarWerkblad }:
  { stap: string; w: Week; week: number; naarWerkblad: () => void },
): ReactNode {
  if (stap === 'open') {
    return (
      <>
        <div className="mid">
          <div className="ar reus">بِسْمِ اللَّهِ</div>
          <p className="tr">Bismillah</p>
        </div>
        <div className="kaart dun" style={{ marginTop: 14 }}>
          <b>Vandaag: {w.t}</b>
          <p className="small" style={{ margin: '6px 0 0' }}>{w.doel}</p>
        </div>
      </>
    )
  }

  if (stap === 'herhaal') {
    /* De laatste twaalf letters van de weken hiervóór: meer past niet op één
       regel en meer herhalen dan dat past niet in een kwartier. */
    const eerder = lettersTot(week - 1).slice(-12)
    return (
      <>
        <p className="small">
          Lees deze letters van de vorige weken hardop voor. Twijfel je bij één, kijk hem dan
          samen na in het alfabet.
        </p>
        {eerder.length
          ? (
            <div className="rij" style={{ justifyContent: 'center', marginTop: 14 }}>
              {eerder.map((l, i) => (
                <span key={i} className="ar" style={{ fontSize: '2.1rem', padding: '6px 10px' }}>{l}</span>
              ))}
            </div>
            )
          : (
            <p className="klein muted" style={{ marginTop: 10 }}>
              Dit is de eerste week; er is nog niets om te herhalen. Ga door naar de letters.
            </p>
            )}
        <p className="klein muted" style={{ marginTop: 12 }}>
          Daarna: doe een ronde in <b>Herhaling</b> — die kaarten komen precies terug op het
          moment dat je ze dreigt te vergeten.
        </p>
      </>
    )
  }

  if (stap === 'letters') {
    const ltrs = w.letters ?? []
    if (!ltrs.length) {
      return (
        <p className="small">
          Deze week komen er geen nieuwe letters bij.{' '}
          {w.focus ? `De aandacht gaat naar: ${w.focus}.` : 'Het gaat om herhalen en vastzetten.'}
        </p>
      )
    }
    return (
      <>
        {ltrs.map((l) => {
          const L = LETTERS.find((x) => x.l === l)
          return (
            <div className="kaart dun" style={{ marginTop: 10 }} key={l}>
              <div className="rij tussen">
                <div>
                  <b>{L ? `${L.n} — ${L.tr}` : l}</b>
                  <div className="klein muted">klank: {L ? L.k : ''}</div>
                </div>
                <span className="ar" style={{ fontSize: '2.6rem' }}>{l}</span>
              </div>
              <Vormrij l={l} />
              {L && <p className="klein" style={{ marginTop: 8 }}>{L.u}</p>}
              {L?.vb && (
                <div className="rij" style={{ marginTop: 6 }}>
                  <span className="klein muted">voorbeeld</span>
                  <span className="ar">{L.vb}</span>
                </div>
              )}
            </div>
          )
        })}
      </>
    )
  }

  if (stap === 'lezen') {
    return (
      <>
        <p className="small">
          Hardop lezen, drie keer per regel. Eerst langzaam en spellend, dan één keer vloeiend.
        </p>
        <div style={{ marginTop: 12 }}>
          {(w.lezen ?? []).map((x, i) => (
            <div className="kaart dun" style={{ marginTop: 8, textAlign: 'center' }} key={i}>
              <div className="ar" style={{ fontSize: '2rem' }}>{x}</div>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (stap === 'schrijven') {
    return (
      <>
        <p className="small">
          Van rechts naar links. Eerst overtrekken, dan zelf. Neem de tijd: netjes is
          belangrijker dan veel.
        </p>
        <div className="rij" style={{ marginTop: 14 }}>
          <button type="button" className="k vol" onClick={naarWerkblad}>Open het werkblad</button>
        </div>
        <p className="klein muted" style={{ marginTop: 10 }}>
          Het werkblad is gemaakt om af te drukken. Lukt dat niet, laat het kind dan op het
          scherm meekijken en op papier naschrijven.
        </p>
      </>
    )
  }

  if (stap === 'geloof') {
    const g = w.geloof
    return (
      <>
        <div className="mid">
          <div className="ar reus">{g.ar}</div>
          <p className="tr">{g.tr}</p>
        </div>
        <h3 style={{ marginTop: 12 }}>{g.t}</h3>
        <p style={{ marginTop: 6 }}>{g.x}</p>
        <p className="klein muted" style={{ marginTop: 12 }}>
          Meer hierover staat in Islam leren, de andere app van de hub.
        </p>
      </>
    )
  }

  return (
    <>
      <p className="small">Spreek af wat er deze week thuis blijft liggen:</p>
      <ul style={{ margin: '10px 0 0 18px', lineHeight: 1.8 }}>
        {(w.letters ?? []).length > 0 && <li>Elke dag vijf minuten de nieuwe letters schrijven.</li>}
        <li>De woorden van vandaag één keer per dag hardop lezen.</li>
        <li>Een ronde in <b>Herhaling</b>, drie keer deze week.</li>
      </ul>
      <div className="mid" style={{ marginTop: 16 }}>
        <div className="ar reus">الْحَمْدُ لِلَّهِ</div>
        <p className="tr">Alhamdulillah</p>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- het werkblad */

/** Bedoeld om af te drukken: de letters in hun vier vormen, een rij om over te
 *  trekken en lege regels om zelf te schrijven. De rest van de pagina wordt bij
 *  het afdrukken weggelaten. */
export function Werkblad({ week, sluit }: { week: number; sluit: () => void }): ReactNode {
  const w = weekVan(week)
  if (!w) return null
  const ltrs = (w.letters ?? []).length ? (w.letters ?? []) : lettersTot(week).slice(-3)
  const spoorrij = (l: string): ReactNode => (
    <div className="wbrij">
      <span className="wbgroot">{l}</span>
      {Array.from({ length: 6 }, (_, i) => <span className="wbspoor" key={i}>{l}</span>)}
    </div>
  )
  return (
    <>
      <div className="printbaar">
        <div className="wbkop"><b>Arabisch · werkblad week {week}</b><span>{w.t}</span></div>
        <p className="klein muted">Naam: ______________________   Datum: ______________</p>
        {ltrs.map((l, n) => {
          const L = LETTERS.find((x) => x.l === l)
          const v = letterVormen(l)
          return (
            <div className="wbblok" key={l + n}>
              <div className="rij tussen">
                <b>{L ? `${L.n} — ${L.tr}` : l}</b>
                <span className="klein muted">{L ? L.k : ''}</span>
              </div>
              <div className="rij" style={{ justifyContent: 'space-around', margin: '6px 0' }}>
                {([['los', v.los], ['begin', v.begin], ['midden', v.midden], ['eind', v.eind]] as const)
                  .map(([nm, vv]) => (
                    <div className="mid" key={nm}>
                      <div className="ar" style={{ fontSize: '1.7rem' }}>{vv}</div>
                      <div className="klein muted">{nm}</div>
                    </div>
                  ))}
              </div>
              {spoorrij(l)}
              {spoorrij(l)}
              <div className="wbleeg" />
              <div className="wbleeg" />
            </div>
          )
        })}
        <div className="wbblok">
          <b>Lezen</b>
          {(w.lezen ?? []).map((x, i) => (
            <div className="wbrij" key={i}>
              <span className="ar" style={{ fontSize: '1.7rem' }}>{x}</span>
            </div>
          ))}
        </div>
        <p className="klein muted">Van rechts naar links. Eerst overtrekken, dan zelf.</p>
      </div>
      <div className="rij" style={{ marginTop: 16 }}>
        <button type="button" className="k vol" onClick={() => print()}>Afdrukken</button>
        <button type="button" className="k rand" onClick={sluit}>Sluiten</button>
      </div>
    </>
  )
}

/* -------------------------------------------------------- de niveaubepaling */

/** Achttien vragen. Ze bepalen niet wie het knapst is, maar op welke week het
 *  programma begint — wie de eerste letters al kent hoeft die niet nog eens. */
export function Meting(
  { begin }: { begin: (niveau: number, week: number, score: number) => void },
): ReactNode {
  const [i, zetI] = useState(0)
  const [goed, zetGoed] = useState(0)
  const [per, zetPer] = useState<Record<string, { goed: number; totaal: number }>>({})

  if (i >= METING.length) {
    let nv = METINGNIVEAUS[0]
    for (const x of METINGNIVEAUS) if (goed >= x.min) nv = x
    if (!nv) return null
    return (
      <>
        <span className="label">Niveaubepaling</span>
        <h2 style={{ margin: '6px 0' }}>{goed} van de {METING.length} goed</h2>
        <p><b>{nv.t}</b> — {nv.u}</p>
        <div className="kaart dun" style={{ marginTop: 12 }}>
          {Object.keys(per).map((g) => (
            <div className="rij tussen" style={{ padding: '5px 0' }} key={g}>
              <span>{g}</span>
              <span className="muted small">{per[g]?.goed}/{per[g]?.totaal}</span>
            </div>
          ))}
        </div>
        <p className="klein muted" style={{ marginTop: 12 }}>
          Het programma begint voor jou bij week {nv.week}. Je kunt altijd terug naar een
          eerdere week — in het jaarplan tik je gewoon op het weeknummer.
        </p>
        <div className="rij" style={{ marginTop: 16 }}>
          <button
            type="button" className="k vol"
            onClick={() => begin(nv.niveau, nv.week, goed)}
          >Begin bij week {nv.week}</button>
        </div>
      </>
    )
  }

  const q = METING[i]
  if (!q) return null
  return (
    <>
      <span className="label">Niveaubepaling · vraag {i + 1} van {METING.length}</span>
      <Balk pct={Math.round(i / METING.length * 100)} style={{ margin: '10px 0 16px' }} />
      <p style={{ margin: '0 0 4px' }}>{q.v}</p>
      {q.ar && (
        <div className="ar" style={{ fontSize: '2.6rem', textAlign: 'center', margin: '14px 0' }}>
          {q.ar}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {q.o.map((o, k) => (
          <button
            type="button" key={k} className="k rand"
            style={{ display: 'block', width: '100%', textAlign: 'right', marginTop: 8 }}
            onClick={() => {
              const ok = k === q.a
              if (ok) zetGoed((n) => n + 1)
              zetPer((p) => {
                const v = p[q.g] ?? { goed: 0, totaal: 0 }
                return { ...p, [q.g]: { goed: v.goed + (ok ? 1 : 0), totaal: v.totaal + 1 } }
              })
              zetI(i + 1)
            }}
          >
            {AR.test(o) ? <span className="ar" style={{ fontSize: '1.5rem' }}>{o}</span> : o}
          </button>
        ))}
      </div>
    </>
  )
}

/* -------------------------------------------------------------- de blokttoets */

export interface Toetsvraag {
  ar: string
  v: string
  o: string[]
  goed: string
  spreek?: string | undefined
}

/** De vragen van één blok: letters herkennen en woorden horen. Ze komen uit de
 *  weken van dat blok zelf, dus de toets kan niets vragen wat er niet in stond. */
export function toetsVragen(nr: number, t: Toeval): Toetsvraag[] {
  const blok = BLOKKEN.find((x) => x.n === nr)
  if (!blok) return []
  const weken = JAAR.filter((x) => x.n >= blok.weken[0] && x.n <= blok.weken[1])
  const ltrs = weken.flatMap((x) => x.letters ?? [])
  const woorden = weken.flatMap((x) => x.lezen ?? [])
  const vragen: Toetsvraag[] = []

  for (const l of ltrs.slice(0, 8)) {
    const L = LETTERS.find((x) => x.l === l)
    if (!L) continue
    const fout = husselen(LETTERS.filter((x) => x.l !== l), t).slice(0, 2).map((x) => x.tr)
    vragen.push({ ar: l, v: 'Welke letter is dit?', o: husselen([L.tr, ...fout], t), goed: L.tr })
  }
  for (const x of woorden.slice(-6)) {
    const fout = husselen(woorden.filter((y) => y !== x), t).slice(0, 2)
    if (fout.length < 2) continue
    vragen.push({ ar: '', v: 'Welk woord hoor je?', o: husselen([x, ...fout], t), goed: x, spreek: x })
  }
  return vragen.slice(0, 12)
}

export function Blokttoets(
  { nr, vragen, spraak, klaar }:
  { nr: number; vragen: Toetsvraag[]; spraak: Spraak
    klaar: (score: number, totaal: number) => void },
): ReactNode {
  const [i, zetI] = useState(0)
  const [goed, zetGoed] = useState(0)

  useEffect(() => {
    const q = vragen[i]
    if (q?.spreek) spraak.zeg(q.spreek)
  }, [i, vragen, spraak])

  if (i >= vragen.length) {
    const pct = vragen.length ? Math.round(goed / vragen.length * 100) : 0
    return (
      <>
        <span className="label">Toets blok {nr}</span>
        <h2 style={{ margin: '6px 0' }}>{goed} van de {vragen.length} goed</h2>
        <Balk pct={pct} style={{ margin: '10px 0' }} />
        <p>
          {pct >= 80 ? 'Dat zit goed. Ga door naar het volgende blok.'
            : pct >= 60 ? 'De basis staat. Loop de letters die misgingen nog een keer na in het '
              + 'alfabet voordat je verdergaat.'
              : 'Nog niet. Doe de weken van dit blok nog een keer — dat is geen straf maar '
                + 'precies hoe leren werkt.'}
        </p>
        <div className="rij" style={{ marginTop: 16 }}>
          <button type="button" className="k vol" onClick={() => klaar(goed, vragen.length)}>
            Klaar
          </button>
        </div>
      </>
    )
  }

  const q = vragen[i]
  if (!q) return null
  return (
    <>
      <span className="label">Toets blok {nr} · vraag {i + 1} van {vragen.length}</span>
      <Balk pct={Math.round(i / vragen.length * 100)} style={{ margin: '10px 0 16px' }} />
      <p style={{ margin: 0 }}>{q.v}</p>
      {q.ar && (
        <div className="ar" style={{ fontSize: '2.8rem', textAlign: 'center', margin: '14px 0' }}>
          {q.ar}
        </div>
      )}
      {q.spreek && spraak.beschikbaar && (
        <div className="mid" style={{ margin: '12px 0' }}>
          <button type="button" className="k rand" onClick={() => spraak.zeg(q.spreek ?? '')}>
            Luister
          </button>
        </div>
      )}
      <div>
        {q.o.map((o, k) => (
          <button
            type="button" key={k} className="k rand"
            style={{ display: 'block', width: '100%', marginTop: 8 }}
            onClick={() => { if (o === q.goed) zetGoed((n) => n + 1); zetI(i + 1) }}
          >
            {AR.test(o) ? <span className="ar" style={{ fontSize: '1.5rem' }}>{o}</span> : o}
          </button>
        ))}
      </div>
    </>
  )
}
