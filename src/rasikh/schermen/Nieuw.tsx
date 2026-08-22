/**
 * NIEUW — de zes stappen waarmee een aya vastgezet wordt.
 *
 * Betekenis staat vóór klank, en dat is een keuze: wie op zijn eenenvijftigste
 * begint heeft geen tekort aan begrip maar aan herhaaltijd. De haak waar de
 * klank aan blijft hangen is dan de betekenis, en dat is het voordeel dat een
 * volwassene heeft boven een kind.
 */
import { useEffect, useMemo, useState } from 'react'
import { AyaBlok, Balk, Blad, BladKop, Kaart, Kader, Tag } from '../onderdelen'
import { plan, soeraStand, volgende } from '../planning'
import type { SoeraInfo } from '../planning'
import type { Stand } from '../opslag'
import { aya as haalAya, vorigeAya } from '../koran'
import type { Aya } from '../koran'
import type { Recitatie } from '../audio'

export const STAPPEN = [
  { t: 'Horen', u: 'Luister drie keer mee terwijl je meeleest. Nog niets uit je hoofd.' },
  { t: 'Begrijpen', u: 'Wat staat er. Betekenis is de haak waar de klank aan blijft hangen — dat is het voordeel dat een volwassene heeft.' },
  { t: 'Inprenten', u: 'Vijf keer hardop, mét de tekst voor je.' },
  { t: 'Losmaken', u: 'De tekst verdwijnt in stappen. Tik op een grijs vlak als je vastloopt.' },
  { t: 'Vastzetten', u: 'Uit het hoofd, drie keer vlekkeloos achter elkaar. Eén hapering en de teller gaat terug.' },
  { t: 'Knopen', u: 'De naad met de vorige aya is waar het later misgaat. Zeg ze aan elkaar.' },
] as const

interface Vordering { gehoord: number; gezegd: number; verberg: number; vlekkeloos: number }
const LEEG: Vordering = { gehoord: 0, gezegd: 0, verberg: 0, vlekkeloos: 0 }

/** Wanneer mag je door naar de volgende stap? */
export function magDoor(i: number, v: Vordering): boolean {
  if (i === 2) return v.gezegd >= 5
  if (i === 3) return v.verberg >= 3
  if (i === 4) return v.vlekkeloos >= 3
  return true
}

export function Nieuw(
  { stand, index, dag, recitatie, opVastgezet, naarVandaag }:
  {
    stand: Stand; index: readonly SoeraInfo[]; dag: number
    recitatie: Recitatie
    opVastgezet: (id: string) => void
    naarVandaag: () => void
  },
) {
  const p = plan(stand, index, dag)
  /* `volgende` geeft elke keer een nieuw object terug. Dat object rechtstreeks
     in de afhankelijkheden zetten laat het effect bij élke hertekening opnieuw
     lopen, waarbij het zichzelf opruimt vóórdat de aya binnen is — en dan komt
     er nooit iets op het scherm. Vandaar de sleutel op de waarden. */
  const doel = volgende(stand, index)
  const doelSleutel = doel ? `${doel.nr}:${doel.n}` : null
  const [a, zetA] = useState<Aya | null>(null)
  const [bezig, zetBezig] = useState(false)

  useEffect(() => {
    let af = false
    if (!doelSleutel) { zetA(null); return }
    const [nr, n] = doelSleutel.split(':').map(Number)
    void haalAya(nr as number, n as number, stand.instel.lezing)
      .then((x) => { if (!af) zetA(x) })
    return () => { af = true }
  }, [doelSleutel, stand.instel.lezing])

  if (!doel || !a) {
    return (
      <Kaart>
        <h1>Alles staat vast</h1>
        <p style={{ marginTop: 8 }}>
          Binnen je doel ligt alles vast. Verruim het doel bij <b>Instellingen</b>.
        </p>
      </Kaart>
    )
  }

  const st = soeraStand(stand, a.soera, dag)

  return (
    <>
      <div>
        <h1>Nieuw</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          {a.soera.naam} · aya {a.n} van {a.soera.aya}
        </p>
      </div>

      {!p.nieuw && (
        <Kader toon="let" kop="Eigenlijk niet vandaag">
          {p.reden} Je kunt doorgaan, maar het herhalen wordt morgen zwaarder.
        </Kader>
      )}

      <Kaart>
        <div className="rij tussen">
          <h3>
            {a.soera.naam}{' '}
            <span className="ar" style={{ fontSize: '1rem', color: 'var(--k)' }}>{a.soera.ar}</span>
          </h3>
          <Tag>{st.vast} van {st.totaal} vast</Tag>
        </div>
        <div style={{ marginTop: 10 }}>
          <Balk deel={st.totaal ? (st.vast / st.totaal) * 100 : 0} />
        </div>
        <p className="klein" style={{ marginTop: 10 }}>
          {a.soera.ev} · geopenbaard in {a.soera.plaats}
        </p>
      </Kaart>

      <AyaBlok a={a} opHoren={recitatie.heeft(a)
        ? () => void recitatie.speel(a, stand.instel.tempo) : undefined} />

      <div className="rij">
        <button type="button" className="btn groot" onClick={() => zetBezig(true)}>
          Begin bij stap 1 — horen
        </button>
      </div>

      {bezig && (
        <Leerflow a={a} lezing={stand.instel.lezing} tempo={stand.instel.tempo}
                  recitatie={recitatie} nogNieuw={p.nieuw}
                  opSluiten={() => zetBezig(false)}
                  opVastgezet={opVastgezet} naarVandaag={naarVandaag} />
      )}
    </>
  )
}

function Leerflow(
  { a, lezing, tempo, recitatie, nogNieuw, opSluiten, opVastgezet, naarVandaag }:
  {
    a: Aya
    lezing: Stand['instel']['lezing']
    tempo: number
    recitatie: Recitatie
    nogNieuw: number
    opSluiten: () => void
    opVastgezet: (id: string) => void
    naarVandaag: () => void
  },
) {
  const [stap, zetStap] = useState(0)
  const [v, zetV] = useState<Vordering>(LEEG)
  const [vorige, zetVorige] = useState<Aya | null>(null)
  const [klaar, zetKlaar] = useState(false)
  const [zichtbaar, zetZichtbaar] = useState<Set<number>>(() => new Set())
  const [kijk, zetKijk] = useState(false)

  useEffect(() => {
    let af = false
    void vorigeAya(a, lezing).then((x) => { if (!af) zetVorige(x) })
    return () => { af = true }
  }, [a, lezing])

  /* Welke woorden verborgen zijn hangt af van het niveau; dat wordt één keer
     per niveau geloot en niet bij elke hertekening opnieuw — anders springt de
     tekst onder je handen weg. */
  const niveau = [0, 0.35, 0.7, 1][Math.min(3, v.verberg)] ?? 0
  const woorden = useMemo(() => a.ar.split(' '), [a.ar])
  const verborgen = useMemo(
    () => new Set(woorden.map((_, i) => i).filter(() => Math.random() < niveau)),
    [woorden, niveau])

  if (klaar) {
    return (
      <Blad opSluiten={opSluiten}>
        <h2>{a.soera.naam} {a.n} staat vast</h2>
        <p style={{ marginTop: 8 }}>
          Hij komt morgen terug, daarna over twee dagen, vier, acht — steeds verder uit elkaar zolang
          het goed gaat. Dat terugkomen is het werk; het leren was het makkelijke deel.
        </p>
        <AyaBlok a={a} />
        <div className="rij" style={{ marginTop: 16 }}>
          {nogNieuw > 1 && (
            <button type="button" className="btn"
                    onClick={() => { zetKlaar(false); zetStap(0); zetV(LEEG); opSluiten() }}>
              Nog een aya
            </button>
          )}
          <button type="button" className="btn ghost"
                  onClick={() => { opSluiten(); naarVandaag() }}>
            Klaar voor vandaag
          </button>
        </div>
      </Blad>
    )
  }

  const S = STAPPEN[stap]
  if (!S) return null

  return (
    <Blad opSluiten={opSluiten}>
      <BladKop tekst={`${a.soera.naam} ${a.n} · stap ${stap + 1} van 6 · ${S.t}`}
               opSluiten={opSluiten} />
      <div style={{ margin: '10px 0 4px' }}><Balk dun deel={(stap / 6) * 100} /></div>
      <p className="klein" style={{ marginBottom: 14 }}>{S.u}</p>

      {stap === 0 && (
        <>
          <AyaBlok a={a} geenNl />
          {recitatie.heeft(a) ? (
            <div className="rij" style={{ marginTop: 12 }}>
              <button type="button" className="btn"
                      onClick={async () => {
                        await recitatie.speel(a, tempo)
                        zetV((x) => ({ ...x, gehoord: x.gehoord + 1 }))
                      }}>
                Speel af ({v.gehoord} van 3)
              </button>
            </div>
          ) : (
            <Kader kop="Nog geen recitatie">
              Voor deze aya is nog geen recitatie opgehaald. Lees hem hardop mee met je eigen opname,
              of haal de recitatie op — zie Instellingen.
            </Kader>
          )}
        </>
      )}

      {stap === 1 && (
        <>
          <AyaBlok a={a} />
          {vorige && (
            <Kaart plat>
              <p className="meta">Hiervoor staat</p>
              <div className="ar" style={{ fontSize: '1.15rem', marginTop: 4 }}>{vorige.ar}</div>
            </Kaart>
          )}
        </>
      )}

      {stap === 2 && (
        <>
          <AyaBlok a={a} geenNl />
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="btn"
                    onClick={() => zetV((x) => ({ ...x, gezegd: x.gezegd + 1 }))}>
              Hardop gezegd ({v.gezegd} van 5)
            </button>
            {recitatie.heeft(a) && (
              <button type="button" className="btn ghost"
                      onClick={() => void recitatie.speel(a, tempo)}>
                Nog eens horen
              </button>
            )}
          </div>
        </>
      )}

      {stap === 3 && (
        <>
          <div className="aya">
            <div className="ar">
              {woorden.map((w, i) => (
                verborgen.has(i) && !zichtbaar.has(i) ? (
                  <span key={i} className="verborgen"
                        onClick={() => zetZichtbaar((s) => new Set(s).add(i))}>{w}</span>
                ) : <span key={i}>{w}</span>
              )).reduce<React.ReactNode[]>((uit, el, i) => i ? [...uit, ' ', el] : [el], [])}
            </div>
          </div>
          <p className="klein" style={{ marginTop: 10 }}>{Math.round(niveau * 100)}% verborgen</p>
          <div className="rij" style={{ marginTop: 10 }}>
            <button type="button" className="btn ghost"
                    onClick={() => zetZichtbaar(new Set())}>Opnieuw</button>
            {niveau < 1 && (
              <button type="button" className="btn"
                      onClick={() => { zetV((x) => ({ ...x, verberg: x.verberg + 1 })); zetZichtbaar(new Set()) }}>
                Meer verbergen
              </button>
            )}
          </div>
        </>
      )}

      {stap === 4 && (
        <>
          <Kaart plat>
            <div style={{ textAlign: 'center' }}>
              <p className="meta">Uit het hoofd</p>
              <p className="klein" style={{ marginTop: 6 }}>Zeg de aya hardop. Kijk niet.</p>
              <p className="cijfer" style={{ marginTop: 10 }}>{v.vlekkeloos} / 3</p>
            </div>
          </Kaart>
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="btn"
                    onClick={() => zetV((x) => ({ ...x, vlekkeloos: x.vlekkeloos + 1 }))}>
              Vlekkeloos
            </button>
            <button type="button" className="btn ghost"
                    onClick={() => zetV((x) => ({ ...x, vlekkeloos: 0 }))}>
              Ik haperde
            </button>
            <button type="button" className="btn ghost" onClick={() => zetKijk(true)}>Laat zien</button>
          </div>
          {kijk && <AyaBlok a={a} geenNl />}
        </>
      )}

      {stap === 5 && (
        vorige ? (
          <>
            <Kaart plat>
              <p className="meta">De naad</p>
              <div className="ar" style={{ fontSize: '1.2rem', marginTop: 6, opacity: 0.6 }}>
                {vorige.ar}
              </div>
              <div className="ar" style={{ fontSize: '1.45rem', marginTop: 8 }}>{a.ar}</div>
            </Kaart>
            <p className="klein" style={{ marginTop: 10 }}>
              Zeg ze twee keer aan elkaar. Het einde van de vorige aya is de sleutel voor het begin
              van deze.
            </p>
          </>
        ) : (
          <>
            <Kaart plat>
              <p className="meta">Het begin van de soera</p>
              <div className="ar" style={{ marginTop: 6 }}>{a.ar}</div>
            </Kaart>
            <p className="klein" style={{ marginTop: 10 }}>
              Dit is de eerste aya; er is nog geen naad.
            </p>
          </>
        )
      )}

      <div className="rij tussen" style={{ marginTop: 20 }}>
        <button type="button" className="btn ghost" disabled={stap === 0}
                onClick={() => { zetStap((n) => n - 1); zetKijk(false) }}>
          Terug
        </button>
        <button type="button" className="btn" disabled={!magDoor(stap, v)}
                onClick={() => {
                  zetKijk(false)
                  if (stap === 5) { opVastgezet(a.id); zetKlaar(true) }
                  else zetStap((n) => n + 1)
                }}>
          {stap === 5 ? 'Zet vast' : 'Volgende'}
        </button>
      </div>
    </Blad>
  )
}
