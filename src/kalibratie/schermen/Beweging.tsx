/**
 * BEWEGING — stappen, kracht, en waarom actieve energie nergens meetelt.
 * Overgezet uit vwBeweging().
 */
import { useState } from 'react'
import { Balk, Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Cijfer } from '../figuren'
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

  return (
    <>
      <Kaart>
        <div className="trio">
          <Cijfer label="Stappen 7 dgn" waarde={gem7 != null ? dz(gem7) : '—'}
                  onder="doel 8.000 gemiddeld" />
          <Cijfer label="Venster" waarde={a.gemStappen != null ? dz(Math.round(a.gemStappen)) : '—'}
                  onder={`${a.venster} dagen`} />
          <Cijfer label="Krachtsessies" waarde={String(sessies)} onder="doel 3 per week" />
        </div>
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
