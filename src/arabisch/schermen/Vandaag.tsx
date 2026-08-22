/**
 * VANDAAG — de sessie
 *
 * Er is bewust geen streak en geen achterstand. De kalender wordt bij elke
 * opening opnieuw op vandaag verankerd: het eerstvolgende blok dat je nog niet
 * hebt gedaan is dat van vandaag, het blok erna dat van morgen. Wie een week
 * niets doet vindt dus geen zeven sessies terug maar precies één.
 *
 * De sessie loopt in vier stappen: leren, oefenen, herhalen, klaar. Wie stopt
 * verliest wat er nog aan kwam maar houdt alles wat al beoordeeld is — elke
 * vraag schrijft meteen weg.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import type { Padstap } from '../leerplan'
import { herhalingsRij } from '../leerplan'
import { oefeningenVoorBlok, oefeningVoorKaart } from '../oefeningen'
import type { Oefening } from '../oefeningen'
import { beoordeel } from '../fsrs'
import type { Kaartstaat, Oordeel } from '../fsrs'
import type { Profiel } from '../opslag'
import { datumNL, plusDagen } from '../datum'
import { Rijk, Statvak } from '../onderdelen'
import { LeerInhoud, blokOmschrijving } from '../inhoud'
import { Oefenvak } from '../Oefenvak'

/** Een lege dagstand, zodat elke teller ergens begint. */
const leegDag = { blokken: 0, herhaald: 0, goed: 0, fout: 0 }

/** Hoe lang een sessie ongeveer duurt. Een schatting, geen belofte: het gaat
 *  erom dat iemand vooraf weet of hij er nu aan moet beginnen. */
export function schattingMinuten(oefeningen: number, herh: number): number {
  return Math.max(5, Math.round(oefeningen * 0.6 + herh * 0.35 + 2))
}

interface Sessie {
  blok: Padstap | null
  stap: 'leren' | 'oefenen' | 'herhalen' | 'klaar'
  oefeningen: Oefening[]
  i: number
  herh: string[]
  hi: number
}

export function Vandaag(
  { t, toonWoord, herhaalSein }:
  { t: Toestand; toonWoord: (i: number) => void; herhaalSein: number },
): ReactNode {
  const [sessie, zetSessie] = useState<Sessie | null>(null)
  const beginRef = useRef<((metNieuw: boolean) => void) | null>(null)
  /* Het sein komt uit het tabblad Herhaling. Bij de eerste hertekening staat
     het op nul en mag er niets gebeuren; daarna is elke verhoging een verzoek. */
  const gezien = useRef(herhaalSein)
  useEffect(() => {
    if (herhaalSein === gezien.current) return
    gezien.current = herhaalSein
    beginRef.current?.(false)
  }, [herhaalSein])

  const p = t.profiel
  if (!p) return null

  const { rij, totaal, plafond } = herhalingsRij(p.kaarten, t.dag, p.dagdoel)
  const klaarMetPad = p.blok >= t.pad.length
  const blok = t.pad[Math.min(p.blok, t.pad.length - 1)] ?? null

  const begin = (metNieuw: boolean): void => {
    const b = metNieuw && !klaarMetPad ? blok : null
    /* Kaarten waar geen oefening meer bij te maken is, gaan er hier uit in
       plaats van halverwege de sessie. De inhoud kan verschoven zijn; zo'n
       kaart zou anders elke dag terugkomen zonder ooit gesteld te worden. */
    const levend: string[] = []
    const dood: string[] = []
    for (const r of rij) {
      if (oefeningVoorKaart(r.id, t.omgeving)) levend.push(r.id)
      else dood.push(r.id)
    }
    if (dood.length) {
      t.zetProf((pr) => {
        const kaarten = { ...pr.kaarten }
        for (const id of dood) delete kaarten[id]
        return { ...pr, kaarten }
      })
    }
    const oefeningen = b ? oefeningenVoorBlok(b, t.omgeving) : []
    const stap = b ? 'leren' as const : levend.length ? 'herhalen' as const : 'klaar' as const
    zetSessie({ blok: b, stap, oefeningen, i: 0, herh: levend, hi: 0 })
  }
  beginRef.current = begin

  if (sessie) {
    return (
      <Sessieloop
        t={t} p={p} sessie={sessie} zetSessie={zetSessie}
        stop={() => zetSessie(null)} toonWoord={toonWoord}
      />
    )
  }

  const dagStat = p.dagen[t.dag] ?? leegDag
  const gedaan = dagStat.blokken > 0
  const positie = Math.min(p.blok + 1, t.pad.length)
  const aantalOef = blok ? oefeningenVoorBlok(blok, t.omgeving).length : 0
  const komend = t.pad.slice(p.blok + (gedaan ? 1 : 0), p.blok + (gedaan ? 1 : 0) + 4)

  return (
    <div className="wrap">
      <div className="rij tussen" style={{ marginBottom: 4 }}>
        <span className="label">{datumNL(t.dag)}</span>
        <span className="vlag acc">Stap {positie} van {t.pad.length}</span>
      </div>
      <h1>{gedaan ? 'Klaar voor vandaag' : 'Hallo ' + p.naam}</h1>

      {p.intentie && (
        <div className="kaart accent" style={{ marginTop: 14 }}>
          <span className="label">Jouw afspraak</span>
          <div style={{ marginTop: 4, fontWeight: 600 }}>{p.intentie}</div>
        </div>
      )}

      {klaarMetPad
        ? (
          <div className="kaart" style={{ marginTop: 16 }}>
            <h3>Je hebt het hele pad doorgewerkt</h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              Er is geen nieuwe stof meer in dit spoor. De herhaling loopt door, en in het
              tabblad Ouder kun je naar een volgend spoor overstappen.
            </p>
          </div>
          )
        : gedaan
          ? (
            <div className="kaart" style={{ marginTop: 16 }}>
              <h3><Rijk als="span" html={blok ? blok.titel : ''} /> staat klaar voor morgen</h3>
              <p className="small muted" style={{ marginTop: 8 }}>
                Vandaag heb je gedaan wat er stond. Er stapelt zich niets op: morgen begin je
                hier gewoon.
              </p>
              <button type="button" className="k rand" style={{ marginTop: 12 }} onClick={() => begin(true)}>
                Toch nog een stap doen
              </button>
            </div>
            )
          : (
            <div className="kaart" style={{ marginTop: 16 }}>
              <span className="label">Vandaag</span>
              <Rijk als="h3" style={{ marginTop: 4 }} html={blok ? blok.titel : ''} />
              <Rijk als="p" className="small muted" style={{ margin: '8px 0 0' }} html={blokOmschrijving(blok)} />
              <div className="rij" style={{ marginTop: 8 }}>
                <span className="vlag">{aantalOef} oefeningen</span>
                {rij.length > 0 && <span className="vlag warmv">{rij.length} herhalingen</span>}
                <span className="vlag">± {schattingMinuten(aantalOef, rij.length)} min</span>
              </div>
              <button type="button" className="k vol" style={{ marginTop: 14 }} onClick={() => begin(true)}>
                Beginnen
              </button>
            </div>
            )}

      {totaal > plafond && (
        <div className="melding waarschuwing" style={{ marginTop: 14 }}>
          Er staan {totaal} herhalingen open. Je doet er vandaag {plafond}; de rest schuift door
          naar morgen. Zo blijft de wachtrij hanteerbaar in plaats van te groeien tot iets waar
          je niet meer aan begint.
        </div>
      )}

      {gedaan && (
        <div className="raster r3" style={{ marginTop: 20 }}>
          <Statvak n={dagStat.goed} wat="goed vandaag" />
          <Statvak n={dagStat.fout} wat="nog niet goed" />
          <Statvak n={dagStat.herhaald} wat="herhaald" />
        </div>
      )}

      {rij.length > 0 && (gedaan || klaarMetPad) && (
        <button type="button" className="k rand vol" style={{ marginTop: 14 }} onClick={() => begin(false)}>
          Alleen herhalen ({rij.length})
        </button>
      )}

      <hr className="regel" />
      <h3>Wat er hierna komt</h3>
      <div style={{ marginTop: 8 }}>
        {komend.map((b, i) => (
          <div className="padrij" key={i}>
            <span className="padmerk">{i + 1}</span>
            <span className="pt">
              <Rijk als="b" html={b.titel} />
              <span>{datumNL(plusDagen(t.dag, i + (gedaan ? 1 : 0)))}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="klein muted" style={{ marginTop: 12 }}>
        De kalender schuift met je mee. Sla je een paar dagen over, dan staat er geen stapel
        klaar — het pad begint gewoon weer bij vandaag.
      </p>
    </div>
  )
}

const STAPPEN = ['leren', 'oefenen', 'herhalen', 'klaar'] as const

function Stapbalk({ stap }: { stap: Sessie['stap'] }): ReactNode {
  const nu = STAPPEN.indexOf(stap)
  return (
    <div className="stapbalk">
      {STAPPEN.map((s, i) => (
        <i key={s} className={i < nu ? 'klaar' : i === nu ? 'aan' : ''} />
      ))}
    </div>
  )
}

function Sessieloop(
  { t, p, sessie, zetSessie, stop, toonWoord }:
  { t: Toestand; p: Profiel; sessie: Sessie; zetSessie: (s: Sessie) => void
    stop: () => void; toonWoord: (i: number) => void },
): ReactNode {
  /* De uitgangsstaat van de kaart die nu voorligt; zie beoordeeldeKaart. */
  const vorige = useRef<Kaartstaat | null>(null)

  const stopKnop = (
    <button type="button" className="k stil klein" onClick={stop}>Stoppen</button>
  )

  /* De overgangen staan hier en niet in de hertekening: een stap die tijdens
     het tekenen doorschuift schrijft weg terwijl React nog bezig is, en dan
     telt de sessie zichzelf twee keer af. */
  const naOefening = (i: number): void => {
    if (i < sessie.oefeningen.length) { zetSessie({ ...sessie, stap: 'oefenen', i }); return }
    if (sessie.herh.length) { zetSessie({ ...sessie, stap: 'herhalen', i, hi: 0 }); return }
    rondAf(t, sessie)
    zetSessie({ ...sessie, stap: 'klaar', i })
  }

  const naHerhaling = (hi: number): void => {
    if (hi < sessie.herh.length) { zetSessie({ ...sessie, hi }); return }
    rondAf(t, sessie)
    zetSessie({ ...sessie, stap: 'klaar', hi })
  }

  const beoordeeldeKaart = (oef: Oefening, goed: boolean, oordeel: Oordeel, zelf: boolean): void => {
    /* De uitgangsstaat van deze kaart. Bij een zelfoordeel is `p` alweer
       bijgewerkt door de eerste beoordeling, dus die staat komt uit de ref —
       anders zou het oordeel bovenop het automatische stapelen in plaats van
       ervoor in de plaats te komen. */
    const basis = zelf ? vorige.current : (oef.id ? p.kaarten[oef.id] ?? null : null)
    if (!zelf) vorige.current = basis

    t.zetProf((pr) => {
      const kaarten = oef.id
        ? { ...pr.kaarten, [oef.id]: beoordeel(basis, oordeel, t.dag) }
        : pr.kaarten
      /* Een zelfoordeel vervangt het automatische en telt verder nergens in
         mee: de dag, de punten en het veroverde alfabet zijn al bijgeschreven. */
      if (zelf) return { ...pr, kaarten }

      const dag = pr.dagen[t.dag] ?? leegDag
      /* Het veroverde alfabet: een letter kleurt pas als je hem drie keer goed
         hebt gehad. */
      const letter = oef.id?.startsWith('L:') ? oef.id.split(':')[1] ?? '' : ''
      return {
        ...pr,
        kaarten,
        letters: goed && letter
          ? { ...pr.letters, [letter]: (pr.letters[letter] ?? 0) + 1 }
          : pr.letters,
        dagen: {
          ...pr.dagen,
          [t.dag]: { ...dag, [goed ? 'goed' : 'fout']: dag[goed ? 'goed' : 'fout'] + 1 },
        },
        punten: goed && t.kind ? pr.punten + 10 : pr.punten,
      }
    })
  }

  if (sessie.stap === 'leren' && sessie.blok) {
    const blok = sessie.blok
    return (
      <div className="wrap">
        <Stapbalk stap="leren" />
        <div className="rij tussen"><span className="label">Leren</span>{stopKnop}</div>
        <Rijk als="h2" style={{ margin: '6px 0 14px' }} html={blok.titel} />
        <LeerInhoud
          blok={blok} vocalisatie={p.voorkeur.vocalisatie} spraak={t.spraak} toonWoord={toonWoord}
        />
        <button
          type="button" className="k vol" style={{ marginTop: 20 }}
          onClick={() => naOefening(0)}
        >Nu oefenen</button>
      </div>
    )
  }

  if (sessie.stap === 'oefenen') {
    const oef = sessie.oefeningen[sessie.i]
    if (!oef) return null
    return (
      <div className="wrap">
        <Stapbalk stap="oefenen" />
        <div className="rij tussen">
          <span className="label">Oefenen · {sessie.i + 1} van {sessie.oefeningen.length}</span>
          {stopKnop}
        </div>
        <div style={{ marginTop: 12 }}>
          <Oefenvak
            key={'o' + sessie.i} oef={oef} spraak={t.spraak} zelfOordeel={false}
            beoordeeld={(goed, oordeel, zelf) => beoordeeldeKaart(oef, goed, oordeel, zelf)}
            klaar={() => naOefening(sessie.i + 1)}
          />
        </div>
      </div>
    )
  }

  if (sessie.stap === 'herhalen') {
    const id = sessie.herh[sessie.hi]
    const oef = id ? oefeningVoorKaart(id, t.omgeving) : null
    if (!oef) return null
    return (
      <div className="wrap">
        <Stapbalk stap="herhalen" />
        <div className="rij tussen">
          <span className="label">Herhalen · {sessie.hi + 1} van {sessie.herh.length}</span>
          {stopKnop}
        </div>
        <div style={{ marginTop: 12 }}>
          <Oefenvak
            key={'h' + sessie.hi} oef={oef} spraak={t.spraak}
            /* Zelfbeoordeling alleen op het volwassen spoor: bij een kind
               levert "hoe ging dat?" vooral ruis op en vertraagt het. */
            zelfOordeel={p.spoor >= 3}
            beoordeeld={(goed, oordeel, zelf) => beoordeeldeKaart(oef, goed, oordeel, zelf)}
            klaar={() => {
              t.zetProf((pr) => {
                const dag = pr.dagen[t.dag] ?? leegDag
                return { ...pr, dagen: { ...pr.dagen, [t.dag]: { ...dag, herhaald: dag.herhaald + 1 } } }
              })
              naHerhaling(sessie.hi + 1)
            }}
          />
        </div>
      </div>
    )
  }

  const st = p.dagen[t.dag] ?? leegDag
  return (
    <div className="wrap">
      <Stapbalk stap="klaar" />
      <div className="kaart accent mid" style={{ padding: '30px 18px', marginTop: 10 }}>
        <div className="ar" style={{ fontSize: '2.6rem' }}>أَحْسَنْت</div>
        <h2 style={{ marginTop: 8 }}>Klaar</h2>
        <p className="small" style={{ marginTop: 6 }}>
          {t.kind ? `Je hebt ${p.punten} punten.` : 'Deze stap is afgerond.'}
        </p>
      </div>
      <div className="raster r3" style={{ marginTop: 16 }}>
        <Statvak n={st.goed} wat="goed" />
        <Statvak n={st.fout} wat="nog niet" />
        <Statvak n={st.herhaald} wat="herhaald" />
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>
        Morgen staat de volgende stap klaar. Kom je er niet aan toe, dan schuift alles mee — er
        ontstaat geen achterstand.
      </p>
      <button type="button" className="k vol" style={{ marginTop: 14 }} onClick={stop}>
        Terug naar Vandaag
      </button>
    </div>
  )
}

/** De sessie afronden: één stap verder op het pad, en de dag telt mee. */
function rondAf(t: Toestand, sessie: Sessie): void {
  if (!sessie.blok) return
  t.zetProf((pr) => {
    const dag = pr.dagen[t.dag] ?? leegDag
    return {
      ...pr,
      dagen: { ...pr.dagen, [t.dag]: { ...dag, blokken: dag.blokken + 1 } },
      blok: Math.min(pr.blok + 1, t.pad.length),
      punten: t.kind ? pr.punten + 25 : pr.punten,
    }
  })
}
