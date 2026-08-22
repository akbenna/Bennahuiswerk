/**
 * SPEL — alleen voor de kinderen
 *
 * Vier spellen op dezelfde woordenschat als het leerpad, zodat oefenen en
 * spelen niet twee losse voorraden worden. Het luisterspel verschijnt alleen
 * op een toestel dat Arabisch kan spreken.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { LETTERS } from '../gegevens/letters'
import { WOORDEN } from '../gegevens/woorden'
import type { Toestand } from '../toestand'
import { husselen, willekeurig } from '../toeval'
import { normAr, ontdoeTashkil, vocaliseer } from '../tekst'
import { Balk, Rijk } from '../onderdelen'
import { Bouwvak } from '../Oefenvak'

interface Optie { tekst: string; ar: boolean; goed: boolean }
interface Vraag {
  type: 'kies' | 'bouw'
  kop: string
  toon?: string | undefined
  spreek?: string | undefined
  opties?: Optie[] | undefined
  doel?: string | undefined
  tegels?: string[] | undefined
  uitleg: string
  /** Bij het letterspel: welke letter er verdiend wordt. */
  letter?: string | undefined
}

interface Spelstand {
  id: string
  ronde: number
  punten: number
  totaal: number
  vraag: Vraag
  /** Is er al geantwoord, en was dat goed? */
  beantwoord: boolean
  goed: boolean
  /** Welke optie er aangetikt is, om hem rood te kunnen maken. */
  gekozen: number | null
  klaar: boolean
}

const SPELLEN = [
  { id: 'klank', n: 'Letter en klank', o: 'Welke letter hoor je?', stem: false },
  { id: 'beeld', n: 'Woord en plaatje', o: 'Zoek het goede woord bij het plaatje', stem: false },
  { id: 'bouwen', n: 'Woord bouwen', o: 'Zet de letters in de goede volgorde', stem: false },
  { id: 'luister', n: 'Luisteren', o: 'Luister en kies', stem: true },
]

/** Bouwen gaat langzamer dan kiezen; zes rondes duren daar even lang als tien. */
const RONDES = (id: string): number => (id === 'bouwen' ? 6 : 10)

/** Woorden met een korte, spatieloze schrijfwijze: langer dan vijf letters
 *  levert een rij tegels op die op een telefoon niet meer past. */
const BOUWBAAR = 5

export function Spel({ t }: { t: Toestand }): ReactNode {
  const [spel, zetSpel] = useState<Spelstand | null>(null)
  const [bouwsel, zetBouwsel] = useState<string[]>([])
  const p = t.profiel
  if (!p) return null

  const maakVraag = (id: string): Vraag => {
    const tv = t.omgeving.toeval
    const bruikbaar = WOORDEN.filter((w) => w.s <= p.spoor && w.b)

    if (id === 'klank') {
      const L = willekeurig(LETTERS, tv)
      const fout = husselen(LETTERS.filter((x) => x.l !== L.l), tv).slice(0, 3)
      return {
        type: 'kies',
        kop: `Welke letter is <b>${L.n}</b>?`,
        opties: husselen([L, ...fout], tv).map((x) => ({ tekst: x.l, ar: true, goed: x.l === L.l })),
        uitleg: `<span class="ar klein-ar">${L.l}</span> — <b>${L.tr}</b>, klank ${L.k}`
          + (L.moeilijk ? ' (een klank die het Nederlands niet kent)' : ''),
        letter: L.l,
      }
    }
    if (id === 'beeld') {
      const w = willekeurig(bruikbaar, tv)
      const fout = husselen(bruikbaar.filter((x) => x.a !== w.a), tv).slice(0, 3)
      return {
        type: 'kies',
        kop: 'Welk woord hoort hierbij?',
        toon: w.b,
        opties: husselen([w, ...fout], tv).map((x) => ({
          tekst: vocaliseer(x.a, p.voorkeur.vocalisatie), ar: true, goed: x.a === w.a,
        })),
        uitleg: `<span class="ar klein-ar">${w.a}</span> — ${w.n}`,
      }
    }
    if (id === 'bouwen') {
      const w = willekeurig(
        WOORDEN.filter((x) => x.s <= p.spoor
          && ontdoeTashkil(x.a).length <= BOUWBAAR && !x.a.includes(' ')), tv)
      return {
        type: 'bouw',
        kop: `Bouw het woord voor <b>${w.n}</b>`,
        toon: w.b,
        doel: ontdoeTashkil(w.a),
        tegels: husselen(Array.from(ontdoeTashkil(w.a)), tv),
        uitleg: `<span class="ar klein-ar">${w.a}</span> — ${w.n}`,
      }
    }
    /* Luisteren: de afleiders komen bij voorkeur uit hetzelfde thema, want
       "boom of stoel" is te makkelijk om er iets van te horen. */
    const w = willekeurig(bruikbaar, tv)
    const fout = husselen([
      ...bruikbaar.filter((x) => x.th === w.th && x.a !== w.a),
      ...husselen(bruikbaar.filter((x) => x.a !== w.a), tv).slice(0, 3),
    ], tv).slice(0, 3)
    return {
      type: 'kies',
      kop: 'Wat hoor je?',
      spreek: w.a,
      opties: husselen([w, ...fout], tv).map((x) => ({
        tekst: x.n + ' ' + (x.b || ''), ar: false, goed: x.a === w.a,
      })),
      uitleg: `<span class="ar klein-ar">${w.a}</span> — ${w.n}`,
    }
  }

  const start = (id: string): void => {
    zetBouwsel([])
    zetSpel({
      id, ronde: 0, punten: 0, totaal: RONDES(id),
      vraag: maakVraag(id), beantwoord: false, goed: false, gekozen: null, klaar: false,
    })
  }

  const af = (s: Spelstand, goed: boolean, gekozen: number | null = null): void => {
    zetSpel({ ...s, beantwoord: true, goed, gekozen, punten: s.punten + (goed ? 1 : 0) })
    t.zetProf((pr) => ({
      ...pr,
      punten: goed ? pr.punten + 5 : pr.punten,
      letters: goed && s.vraag.letter
        ? { ...pr.letters, [s.vraag.letter]: (pr.letters[s.vraag.letter] ?? 0) + 1 }
        : pr.letters,
    }))
  }

  const door = (s: Spelstand): void => {
    const ronde = s.ronde + 1
    zetBouwsel([])
    if (ronde >= s.totaal) {
      t.zetProf((pr) => ({
        ...pr,
        spelrecords: { ...pr.spelrecords, [s.id]: Math.max(pr.spelrecords[s.id] ?? 0, s.punten) },
      }))
      zetSpel({ ...s, ronde, klaar: true })
      return
    }
    zetSpel({ ...s, ronde, vraag: maakVraag(s.id), beantwoord: false, goed: false, gekozen: null })
  }

  const veroverd = Object.keys(p.letters).filter((l) => (p.letters[l] ?? 0) >= 3).length

  if (!spel) {
    const lijst = SPELLEN.filter((s) => !s.stem || t.spraak.beschikbaar)
    return (
      <div className="wrap">
        <h1>Spel</h1>
        <div className="kaart accent rij tussen" style={{ marginTop: 14 }}>
          <div><span className="label">Jouw punten</span><div className="punten">{p.punten}</div></div>
          <div style={{ textAlign: 'right' }}>
            <span className="label">Alfabet veroverd</span>
            <div className="punten">{veroverd}/28</div>
          </div>
        </div>
        <div className="raster r2" style={{ marginTop: 16 }}>
          {lijst.map((s) => (
            <button type="button" key={s.id} className="spelkaart" onClick={() => start(s.id)}>
              <b>{s.n}</b>
              <span>{s.o}</span>
              {p.spelrecords[s.id] && (
                <span className="vlag goedv" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  record {p.spelrecords[s.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        {!t.spraak.beschikbaar && (
          <p className="klein muted" style={{ marginTop: 12 }}>
            Het luisterspel verschijnt zodra dit toestel een Arabische stem heeft.
          </p>
        )}
        <hr className="regel" />
        <h3>Veroverd alfabet</h3>
        <p className="klein muted">Een letter kleurt zodra je hem drie keer goed hebt gehad.</p>
        <div className="lettergrid" style={{ marginTop: 10 }}>
          {LETTERS.map((l) => (
            <div key={l.l} className={'lettervak' + ((p.letters[l.l] ?? 0) >= 3 ? ' veroverd' : '')}>
              <span className="l">{l.l}</span><span className="nm">{l.tr}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (spel.klaar) {
    const record = p.spelrecords[spel.id] ?? 0
    return (
      <div className="wrap">
        <div className="kaart accent mid" style={{ padding: '32px 18px', marginTop: 20 }}>
          <div className="ar" style={{ fontSize: '2.4rem' }}>مُمْتَاز</div>
          <h2 style={{ marginTop: 8 }}>{spel.punten} van {spel.totaal} goed</h2>
          {record === spel.punten && spel.punten > 0 && <p className="small">Nieuw record.</p>}
        </div>
        <div className="rij" style={{ marginTop: 16 }}>
          <button type="button" className="k rek" onClick={() => start(spel.id)}>Nog een keer</button>
          <button type="button" className="k rand rek" onClick={() => zetSpel(null)}>Terug</button>
        </div>
      </div>
    )
  }

  const v = spel.vraag

  return (
    <div className="wrap">
      <div className="rij tussen">
        <span className="label">Ronde {spel.ronde + 1} van {spel.totaal}</span>
        <button type="button" className="k stil klein" onClick={() => zetSpel(null)}>Stoppen</button>
      </div>
      <Balk pct={Math.round(spel.ronde / spel.totaal * 100)} style={{ margin: '8px 0 16px' }} />
      <div className="vraagblok">
        <Rijk className="vraagtekst" html={v.kop} />
        {v.toon && <div className="mid" style={{ fontSize: '4rem' }}>{v.toon}</div>}
        {v.spreek && (
          <div className="mid" style={{ margin: '8px 0 16px' }}>
            <button type="button" className="k" onClick={() => t.spraak.zeg(v.spreek ?? '')}>
              🔈 Nog eens
            </button>
          </div>
        )}

        {v.type === 'kies'
          ? (
            <div>
              {(v.opties ?? []).map((o, i) => (
                <button
                  type="button" key={i} disabled={spel.beantwoord}
                  className={'optie' + (!spel.beantwoord ? ''
                    : o.goed ? ' goed'
                    : i === spel.gekozen ? ' fout' : ' flauw')}
                  onClick={() => { if (!spel.beantwoord) af(spel, o.goed, i) }}
                >
                  {o.ar ? <span className="ar">{o.tekst}</span> : o.tekst}
                </button>
              ))}
            </div>
            )
          : (
            <Bouwvak
              tegels={v.tegels ?? []} bouwsel={bouwsel} zetBouwsel={zetBouwsel}
              zin={false} vast={spel.beantwoord}
              controleer={() => af(spel, normAr(bouwsel.join('')) === normAr(v.doel ?? ''))}
            />
            )}

        {spel.beantwoord && (
          <>
            <div className={`terug ${spel.goed ? 'goed' : 'fout'}`}>
              <b>{spel.goed ? 'Goed' : 'Nog niet'}</b>
              <Rijk className="uitleg" html={v.uitleg} />
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="button" className="k vol" onClick={() => door(spel)}>Verder</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
