/**
 * BEWEGING — stappen, kracht, en waarom actieve energie nergens meetelt.
 *
 * Dit scherm opende met drie kale getallen naast elkaar. Een getal met "doel
 * 8.000" eronder zegt niet of je het haalt; daar moet je zelf voor rekenen. Nu
 * staat de staat vooraan: de ring vergelijkt de week met het doel, en de drie
 * krachtsessies zijn drie bolletjes — bij zulke kleine aantallen is tellen
 * sneller dan lezen.
 */
import { useState } from 'react'
import { Balk, Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Bolletjes, Doelring, Schermkop } from '../hero'
import { dz } from '@/gedeeld/getal'
import { kortNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Training } from '@/gedeeld/db/tabellen'
import type { Analyse, Dagenkaart } from '../rekenkern'

const SPIERGROEPEN = ['benen', 'rug', 'borst', 'schouders', 'armen', 'romp'] as const

export function Beweging(
  { a, dagen, training, datum, bewaarTraining }:
  {
    a: Analyse; dagen: Dagenkaart; training: Training[]; datum: IsoDatum
    bewaarTraining: (t: {
      datum: IsoDatum; oefening: string; spiergroep: string
      sets: number | null; reps: number | null; gewicht_kg: number | null
    }) => void
  },
) {
  const sleutels = Object.keys(dagen).sort().slice(-21)
  const laatste7 = sleutels.slice(-7)
    .map((x) => dagen[x]?.stappen).filter((v): v is number => v != null)
  const gem7 = laatste7.length
    ? Math.round(laatste7.reduce((s, b) => s + b, 0) / laatste7.length) : null

  const sinds = plusDagen(vandaag(), -7)
  const recent = training.filter((t) => t.datum >= sinds)
  const sessies = new Set(recent.map((t) => t.datum)).size
  const perSpier: Record<string, number> = {}
  for (const t of recent) {
    const s = t.spiergroep ?? 'overig'
    perSpier[s] = (perSpier[s] ?? 0) + (Number(t.sets) || 0)
  }

  /* Acht duizend is de knik in de dosis-responscurve voor sterfte (Paluch 2022),
     niet de tienduizend uit een Japanse stappentellerreclame van 1965. */
  const STAPDOEL = 8000
  const KRACHTDOEL = 3
  const haaltStappen = gem7 != null && gem7 >= STAPDOEL
  const haaltKracht = sessies >= KRACHTDOEL

  return (
    <>
      <Schermkop
        toon={haaltStappen && haaltKracht ? 'goed' : gem7 == null ? 'rust' : 'let'}
        bovenschrift="Deze week"
        titel={haaltStappen && haaltKracht ? 'Allebei gehaald'
          : haaltStappen ? 'Stappen staan, kracht nog niet'
          : haaltKracht ? 'Kracht staat, stappen nog niet'
          : gem7 == null ? 'Nog niets ingevuld' : 'Nog niet op dreef'}
        rechts={<span className={'vlaggetje ' + (haaltStappen && haaltKracht ? 'goed' : 'rust')}>
          {sessies}/{KRACHTDOEL} kracht
        </span>}
      >
        <div className="heroring">
          <Doelring waarde={gem7 ?? 0} doel={STAPDOEL} maat={118}
                    kind={<>
                      <span className="getal" style={{ fontSize: '1.35rem' }}>
                        {gem7 != null ? dz(gem7) : '—'}
                      </span>
                      <span className="mini">stappen<br />per dag</span>
                    </>} />
          <div className="herocijfers">
            <p style={{ fontSize: '.92rem' }}>
              {gem7 == null
                ? 'Vul een paar dagen stappen in bij Vandaag; dan staat hier een gemiddelde.'
                : haaltStappen
                  ? `Gemiddeld over zeven dagen, boven de ${dz(STAPDOEL)} waar de winst zit.`
                  : `Gemiddeld over zeven dagen. Nog ${dz(STAPDOEL - gem7)} per dag tot ${dz(STAPDOEL)}.`}
            </p>
            <div className="mini" style={{ marginTop: 10 }}>Krachtsessies deze week</div>
            <Bolletjes aantal={sessies} van={KRACHTDOEL} naam="krachtsessies"
                       kleur={haaltKracht ? 'var(--heldergoed)' : undefined} />
          </div>
        </div>
      </Schermkop>

      <Kaart>
        {/* Van de drie getallen die hier stonden zijn er twee naar de kop
            verhuisd. Hetzelfde getal twee keer op één scherm is geen nadruk
            maar ruis; wat overblijft is het getal dat de kop níét toont. */}
        <Kop>Over het hele venster</Kop>
        <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
          <span className="getal" style={{ fontSize: '1.6rem' }}>
            {a.gemStappen != null ? dz(Math.round(a.gemStappen)) : '—'}
          </span>
          <span className="klein">
            stappen per dag over {a.venster} dagen — de reeks waar het model op rekent, en niet de
            week hierboven.
          </span>
        </Rij>
        <Uitleg id="actieveenergie" label="waarom dit niet meetelt">
          <p>
            Actieve energie uit Apple of Garmin wordt bewaard als volume-indicator maar verschijnt
            nergens in de rekenkern. De fout in energieverbruik is twintig tot vijftig procent en niet
            consistent in één richting; een bias die je niet kent kun je niet corrigeren. Voor jou gaat
            het om zo'n 633 kcal per dag — genoeg om het hele tekort weg te eten als je het zou
            bijtellen.
          </p>
        </Uitleg>
      </Kaart>

      <TrainingInvoer datum={datum} bewaar={bewaarTraining} perSpier={perSpier} />

      <Kaart>
        <Kop>Laatste drie weken</Kop>
        <div className="lijst" style={{ marginTop: 4 }}>
          {sleutels.slice().reverse().map((x) => {
            const r = dagen[x]
            const st = r?.stappen ?? 0
            return (
              <div key={x}>
                <span className="cijfer mini" style={{ width: 52 }}>{kortNL(x)}</span>
                <span className="balk groei">
                  <i style={{
                    width: Math.min(100, (st / 12000) * 100) + '%',
                    ...(st < 5000 ? { background: 'var(--dim)' } : {}),
                  }} />
                </span>
                <span className="cijfer mini" style={{ width: 52, textAlign: 'right' }}>
                  {r?.stappen != null ? dz(r.stappen) : '—'}
                </span>
                <span style={{ width: 16, color: 'var(--goed)' }}>{r?.kracht ? '✓' : ''}</span>
              </div>
            )
          })}
        </div>
      </Kaart>
    </>
  )
}

function TrainingInvoer(
  { datum, bewaar, perSpier }:
  {
    datum: IsoDatum
    bewaar: (t: {
      datum: IsoDatum; oefening: string; spiergroep: string
      sets: number | null; reps: number | null; gewicht_kg: number | null
    }) => void
    perSpier: Record<string, number>
  },
) {
  const [oefening, zetOefening] = useState('')
  const [spiergroep, zetSpiergroep] = useState<string>(SPIERGROEPEN[0])
  const [sets, zetSets] = useState('')
  const [reps, zetReps] = useState('')
  const [kg, zetKg] = useState('')

  function opslaan() {
    if (!oefening.trim()) return
    bewaar({
      datum, oefening: oefening.trim(), spiergroep,
      sets: parseInt(sets) || null, reps: parseInt(reps) || null,
      gewicht_kg: parseFloat(kg) || null,
    })
    zetOefening(''); zetSets(''); zetReps(''); zetKg('')
  }

  const spieren = Object.entries(perSpier)

  return (
    <Kaart>
      <Kop>Krachttraining toevoegen</Kop>
      <Rij style={{ marginTop: 8 }}>
        <input placeholder="oefening" value={oefening} onChange={(e) => zetOefening(e.target.value)}
               style={{ flex: '2 1 130px', width: 'auto' }} />
        <select value={spiergroep} onChange={(e) => zetSpiergroep(e.target.value)}
                style={{ flex: '0 0 110px' }}>
          {SPIERGROEPEN.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="sets" value={sets} onChange={(e) => zetSets(e.target.value)}
               style={{ flex: '0 0 68px' }} />
        <input type="number" placeholder="reps" value={reps} onChange={(e) => zetReps(e.target.value)}
               style={{ flex: '0 0 68px' }} />
        <input type="number" step="0.5" placeholder="kg" value={kg}
               onChange={(e) => zetKg(e.target.value)} style={{ flex: '0 0 68px' }} />
        <Knop vol opKlik={opslaan}>Opslaan</Knop>
      </Rij>

      {spieren.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Kop>Sets per spiergroep, laatste zeven dagen</Kop>
          {spieren.map(([s, n]) => (
            <div key={s} style={{ marginTop: 6 }}>
              <Tussen>
                <span className="mini" style={{ textTransform: 'capitalize' }}>{s}</span>
                <span className="cijfer mini">{n} van 10</span>
              </Tussen>
              <Balk deel={(n / 10) * 100} toon={n >= 10 ? 'goed' : undefined} />
            </div>
          ))}
        </div>
      )}

      <Uitleg id="kracht" label="wat de literatuur zegt">
        <p>
          Krachttraining voorkwam in Sardeli 2018 ruim 93 procent van het verlies aan vetvrije massa
          door caloriebeperking, zonder dat het vetverlies eronder leed; het protocol was in alle zes
          de onderliggende trials drie keer per week. Tien sets per spiergroep per week is een
          redelijke ondergrens (Schoenfeld 2017), met duidelijk afnemende meeropbrengst daarboven.
          Eiwit is faciliterend, niet vervangend: zonder training gaf 1,7 tegen 0,9 g/kg géén verschil.
        </p>
      </Uitleg>
    </Kaart>
  )
}
