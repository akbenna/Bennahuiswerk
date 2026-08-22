/**
 * ARABISCH — lezen, begrijpen en spreken, voor het hele gezin
 *
 * Vier sporen naast elkaar op één toestel: een kind van acht dat de letters
 * leert en een volwassene die aan grammatica toe is, elk met een eigen profiel,
 * een eigen leerpad en een eigen kaartenbak. Wat het spoor bepaalt is de
 * leeftijd; de ouder kan het overschrijven.
 *
 * Naast het leerpad — dat op eigen tempo loopt en altijd op vandaag staat —
 * loopt een jaarplan van zesendertig weken voor wie het gestructureerd wil
 * doen. De twee delen dezelfde kaartenbak.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useArabisch } from './toestand'
import { LETTERS, TEKENS } from './gegevens/letters'
import { JAAR, METING, SESSIEMINUTEN } from './gegevens/jaarplan'
import { vandaag } from './datum'
import { SPOORNAAM, aantalDue } from './leerplan'
import { Blad, Rijk } from './onderdelen'
import { LeerInhoud, LetterKaart, Woordblad, blokOmschrijving } from './inhoud'
import { Blokttoets, Les, Meting, Werkblad, toetsVragen } from './jaarles'
import { Onthaal, NieuwProfiel } from './schermen/Onthaal'
import { Bewerken } from './schermen/Bewerken'
import { Vandaag } from './schermen/Vandaag'
import { Leerpad } from './schermen/Leerpad'
import { Jaarplan } from './schermen/Jaarplan'
import { Alfabet } from './schermen/Alfabet'
import { Woorden } from './schermen/Woorden'
import { Herhaling } from './schermen/Herhaling'
import { Spel } from './schermen/Spel'
import { Ouder } from './schermen/Ouder'

const TABS: Array<[string, string]> = [
  ['vandaag', 'Vandaag'], ['leerpad', 'Leerpad'], ['jaarplan', 'Jaarplan'], ['alfabet', 'Alfabet'],
  ['woorden', 'Woorden'], ['herhaling', 'Herhaling'], ['spel', 'Spel'], ['ouder', 'Ouder'],
]

type Blad =
  | { soort: 'woord'; i: number }
  | { soort: 'letter'; l: string }
  | { soort: 'teken'; i: number }
  | { soort: 'stap'; i: number }
  | { soort: 'wie' }
  | { soort: 'nieuw' }
  | { soort: 'bewerk'; id: string }
  | { soort: 'meting' }
  | { soort: 'les'; week: number }
  | { soort: 'lesklaar'; week: number; toets: number | null }
  | { soort: 'werkblad'; week: number }
  | { soort: 'toets'; blok: number }

export function App(): ReactNode {
  const t = useArabisch()
  const [tab, zetTab] = useState('vandaag')
  const [blad, zetBlad] = useState<Blad | null>(null)
  /* Een sein, geen vlag: elke tik op "herhalen" in het tabblad Herhaling moet
     een nieuwe ronde starten, ook als er net een is afgebroken. */
  const [herhaalSein, zetHerhaalSein] = useState(0)
  const p = t.profiel

  /* Het thema. "auto" volgt het toestel en luistert mee als dat halverwege
     omslaat — een telefoon die 's avonds naar donker gaat hoort de app mee te
     nemen zonder dat je hem opnieuw opent. */
  useEffect(() => {
    const keuze = t.stand.thema ?? 'auto'
    const vraag = matchMedia('(prefers-color-scheme: dark)')
    const pas = (): void => {
      const donker = keuze === 'donker' || (keuze === 'auto' && vraag.matches)
      document.documentElement.dataset.thema = donker ? 'donker' : 'licht'
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', donker ? '#15140F' : '#FAF8F4')
    }
    pas()
    vraag.addEventListener('change', pas)
    return () => vraag.removeEventListener('change', pas)
  }, [t.stand.thema])

  /* Het kindspoor krijgt grotere letters en rondere hoeken. */
  useEffect(() => {
    document.body.dataset.modus = t.kind ? 'kind' : 'volwassen'
  }, [t.kind])

  const ga = (v: string): void => { zetTab(v); scrollTo({ top: 0 }) }
  const sluit = (): void => zetBlad(null)

  if (!p) {
    return (
      <div className="wrap">
        <Onthaal t={t} />
      </div>
    )
  }

  const due = aantalDue(p.kaarten, t.dag)

  return (
    <>
      <header className="top">
        <div className="top-in">
          <a className="terugpijl" href="/" title="Terug naar BennaHub" aria-label="Terug naar BennaHub">
            ←
          </a>
          <span className="merk">Arabisch <span className="ar" lang="ar">لِسَان</span></span>
          <button
            type="button" className="profielknop" aria-label="Profiel wisselen"
            onClick={() => zetBlad({ soort: 'wie' })}
          >
            <span className="bol">{p.naam.trim().charAt(0).toUpperCase()}</span>
            <span>{p.naam}</span>
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Hoofdnavigatie">
        <div className="tabs-in" role="tablist">
          {TABS.map(([v, label]) => (
            (v === 'spel' && !t.kind)
              ? null
              : (
                <button
                  type="button" key={v} className="tab" role="tab"
                  aria-selected={tab === v} onClick={() => ga(v)}
                >
                  {label}
                  {v === 'herhaling' && due > 0 && <span className="telbol">{due}</span>}
                </button>
                )
          ))}
        </div>
      </nav>

      <main>
        <section className="zicht aan" role="tabpanel">
          {tab === 'vandaag' && (
            <Vandaag
              key={p.id} t={t} herhaalSein={herhaalSein}
              toonWoord={(i) => zetBlad({ soort: 'woord', i })}
            />
          )}
          {tab === 'leerpad' && <Leerpad t={t} openStap={(i) => zetBlad({ soort: 'stap', i })} />}
          {tab === 'jaarplan' && (
            <Jaarplan
              t={t}
              doeMeting={() => zetBlad({ soort: 'meting' })}
              doeLes={(w) => zetBlad({ soort: 'les', week: w })}
              doeWerkblad={(w) => zetBlad({ soort: 'werkblad', week: w })}
              doeToets={(b) => zetBlad({ soort: 'toets', blok: b })}
              kiesWeek={(w) => t.zetProf((pr) => (
                pr.jaar ? { ...pr, jaar: { ...pr.jaar, week: w } } : pr))}
            />
          )}
          {tab === 'alfabet' && (
            <Alfabet
              t={t}
              openLetter={(l) => zetBlad({ soort: 'letter', l })}
              openTeken={(i) => zetBlad({ soort: 'teken', i })}
            />
          )}
          {tab === 'woorden' && <Woorden t={t} openWoord={(i) => zetBlad({ soort: 'woord', i })} />}
          {tab === 'herhaling' && (
            <Herhaling t={t} start={() => { zetHerhaalSein((n) => n + 1); ga('vandaag') }} />
          )}
          {tab === 'spel' && t.kind && <Spel t={t} />}
          {tab === 'ouder' && (
            <Ouder
              t={t} naarTab={ga}
              nieuwProfiel={() => zetBlad({ soort: 'nieuw' })}
              bewerkProfiel={(id) => zetBlad({ soort: 'bewerk', id })}
              doeMeting={() => zetBlad({ soort: 'meting' })}
              doeWerkblad={(w) => zetBlad({ soort: 'werkblad', week: w })}
            />
          )}
        </section>

        <footer className="voet"><div className="wrap">
          Arabisch · Modern Standaardarabisch · voortgang staat centraal, met dit toestel als
          terugval<br />
          Onderdeel van BennaHub
        </div></footer>
      </main>

      <Blad open={blad !== null} sluit={sluit}>
        {blad && <Bladinhoud t={t} blad={blad} zetBlad={zetBlad} sluit={sluit} ga={ga} />}
      </Blad>
    </>
  )
}

function Bladinhoud(
  { t, blad, zetBlad, sluit, ga }:
  { t: ReturnType<typeof useArabisch>; blad: Blad; zetBlad: (b: Blad | null) => void
    sluit: () => void; ga: (v: string) => void },
): ReactNode {
  const p = t.profiel
  if (!p) return null

  if (blad.soort === 'woord') {
    return <Woordblad i={blad.i} kaarten={p.kaarten} spraak={t.spraak} sluit={sluit} />
  }

  if (blad.soort === 'letter') {
    return (
      <>
        <LetterKaart L={LETTERS.find((x) => x.l === blad.l)} uitgebreid spraak={t.spraak} />
        <button type="button" className="k rand vol" style={{ marginTop: 16 }} onClick={sluit}>
          Sluiten
        </button>
      </>
    )
  }

  if (blad.soort === 'teken') {
    const tk = TEKENS[blad.i]
    if (!tk) return null
    return (
      <>
        <div className="mid">
          <div className="ar reus">{tk.demo}</div>
          <h3 style={{ marginTop: 8 }}>{tk.n}</h3>
          <div className="tr">{tk.tr}</div>
        </div>
        <Rijk als="p" style={{ marginTop: 14 }} html={tk.u} />
        <button type="button" className="k rand vol" style={{ marginTop: 10 }} onClick={sluit}>
          Sluiten
        </button>
      </>
    )
  }

  if (blad.soort === 'stap') {
    const b = t.pad[blad.i]
    if (!b) return null
    return (
      <>
        <Rijk als="h3" html={b.titel} />
        <Rijk als="p" className="muted small" html={blokOmschrijving(b)} />
        <div style={{ marginTop: 14 }}>
          <LeerInhoud
            blok={b} vocalisatie={p.voorkeur.vocalisatie} spraak={t.spraak}
            toonWoord={(i) => zetBlad({ soort: 'woord', i })}
          />
        </div>
        <button type="button" className="k rand vol" style={{ marginTop: 16 }} onClick={sluit}>
          Sluiten
        </button>
      </>
    )
  }

  if (blad.soort === 'wie') {
    return (
      <>
        <h3>Wie leert er?</h3>
        <div className="stack" style={{ marginTop: 14 }}>
          {Object.values(t.stand.profielen).map((x) => (
            <button
              type="button" className="profkaart" key={x.id}
              style={x.id === p.id ? { borderColor: 'var(--accent)' } : undefined}
              onClick={() => { t.kies(x.id); sluit(); ga('vandaag') }}
            >
              <span className="bol">{x.naam.trim().charAt(0).toUpperCase()}</span>
              <span>
                <b>{x.naam}</b>
                <small>{SPOORNAAM[x.spoor]}{x.id === p.id ? ' · actief' : ''}</small>
              </span>
            </button>
          ))}
        </div>
        <button
          type="button" className="k rand vol" style={{ marginTop: 14 }}
          onClick={() => { sluit(); ga('ouder') }}
        >Naar het ouderbeheer</button>
        <button type="button" className="k stil vol" style={{ marginTop: 6 }} onClick={sluit}>
          Sluiten
        </button>
      </>
    )
  }

  if (blad.soort === 'nieuw') {
    return (
      <div className="onthaal">
        <NieuwProfiel maak={(naam, leeftijd, intentie) => {
          t.maak(naam, leeftijd, intentie)
          sluit()
          ga('vandaag')
        }} />
      </div>
    )
  }

  if (blad.soort === 'bewerk') {
    const x = t.stand.profielen[blad.id]
    if (!x) return null
    return (
      <Bewerken
        p={x} sluit={sluit}
        bewaar={(nieuw) => {
          t.zet((s) => ({ ...s, profielen: { ...s.profielen, [nieuw.id]: nieuw } }))
          sluit()
        }}
      />
    )
  }

  if (blad.soort === 'meting') {
    return (
      <Meting begin={(niveau, week, score) => {
        t.zetProf((pr) => ({
          ...pr,
          jaar: {
            gestart: vandaag(), niveau, week,
            meting: { d: vandaag(), score, totaal: METING.length },
            sessies: {}, toetsen: {},
          },
        }))
        sluit()
      }} />
    )
  }

  if (blad.soort === 'les') {
    return (
      <Les
        week={blad.week}
        naarWerkblad={() => zetBlad({ soort: 'werkblad', week: blad.week })}
        klaar={(w) => {
          const n = blad.week
          t.zetProf((pr) => {
            const j = pr.jaar
            if (!j) return pr
            const eerder = !!j.sessies[String(n)]
            const letters = { ...pr.letters }
            for (const l of w.letters ?? []) letters[l] = (letters[l] ?? 0) + 1
            return {
              ...pr,
              letters,
              punten: eerder ? pr.punten : pr.punten + 30,
              jaar: {
                ...j,
                sessies: { ...j.sessies, [n]: { d: vandaag(), minuten: SESSIEMINUTEN } },
                week: j.week === n && n < JAAR.length ? n + 1 : j.week,
              },
            }
          })
          zetBlad({ soort: 'lesklaar', week: n, toets: w.toets ?? null })
        }}
      />
    )
  }

  if (blad.soort === 'lesklaar') {
    const w = JAAR.find((x) => x.n === blad.week)
    return (
      <>
        <div className="mid">
          <div className="ar reus">أَحْسَنْت</div>
          <p className="tr">Ahsant — goed gedaan</p>
        </div>
        <h2 style={{ marginTop: 12 }}>Week {blad.week} is af</h2>
        <p style={{ marginTop: 6 }}>{w?.doel}</p>
        {blad.toets && (
          <p className="small" style={{ marginTop: 10 }}>
            Deze week hoort er een toets bij. Doe hem nu, of een andere dag deze week.
          </p>
        )}
        <div className="rij" style={{ marginTop: 16 }}>
          {blad.toets && (
            <button
              type="button" className="k vol"
              onClick={() => zetBlad({ soort: 'toets', blok: blad.toets as number })}
            >Doe de toets</button>
          )}
          <button type="button" className="k rand" onClick={sluit}>Sluiten</button>
        </div>
      </>
    )
  }

  if (blad.soort === 'werkblad') {
    return <Werkblad week={blad.week} sluit={sluit} />
  }

  return (
    <Blokttoets
      nr={blad.blok} vragen={toetsVragen(blad.blok, t.omgeving.toeval)} spraak={t.spraak}
      klaar={(score, totaal) => {
        t.zetProf((pr) => {
          const j = pr.jaar
          if (!j) return pr
          const oud = j.toetsen[String(blad.blok)]
          return {
            ...pr,
            punten: pr.punten + score * 5,
            jaar: {
              ...j,
              toetsen: !oud || score > oud.score
                ? { ...j.toetsen, [blad.blok]: { d: vandaag(), score, totaal } }
                : j.toetsen,
            },
          }
        })
        sluit()
      }}
    />
  )
}
