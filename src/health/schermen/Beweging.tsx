/**
 * BEWEGING — stappen, fietsen, kracht, en waarom actieve energie nergens meetelt.
 *
 * Dit scherm opende met drie kale getallen naast elkaar. Een getal met "doel
 * 8.000" eronder zegt niet of je het haalt; daar moet je zelf voor rekenen. Nu
 * staat de staat vooraan: de ring vergelijkt de week met het doel, en de drie
 * krachtsessies zijn drie bolletjes — bij zulke kleine aantallen is tellen
 * sneller dan lezen.
 *
 * DE FIETS STOND ER NIET, EN DAT WAS EEN FOUT
 *
 * `fiets_min` staat al in elke dag en kwam via de koppeling gewoon binnen, maar
 * dit scherm keek er niet naar. Voor wie de hometrainer verkiest boven een
 * wandeling zei de app dus "nog 913 stappen per dag tot 8.000" op een dag waarop
 * er een half uur gefietst was. Dat is niet streng, dat is blind.
 *
 * Nu telt beweging als gehaald bij 8.000 stappen per dag óf 150 minuten matige
 * inspanning per week — de ondergrens van de WHO-richtlijn van 2020, en de enige
 * van de twee die op een hometrainer haalbaar is.
 *
 * Wat er met opzet níet gebeurt is die minuten naar calorieën omrekenen. Zie de
 * uitleg bij de fietskaart: het verbruik komt uit de gewichtstrend, en daar zit
 * de fiets al in.
 */
import { useState } from 'react'
import { Balk, Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Bolletjes, Doelring, Schermkop } from '../hero'
import { dz } from '@/gedeeld/getal'
import { kortNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Training } from '@/gedeeld/db/tabellen'
import type { Analyse, Dagenkaart } from '../rekenkern'
import { WegFiets, WegKracht, WegWeken } from '../tekens'
import { SFEERFOTO } from '../sfeerfotos'

const SPIERGROEPEN = ['benen', 'rug', 'borst', 'schouders', 'armen', 'romp'] as const

export function Beweging(
  { a, dagen, training, datum, bewaarTraining, zetDagveld }:
  {
    a: Analyse; dagen: Dagenkaart; training: Training[]; datum: IsoDatum
    zetDagveld: (veld: string, waarde: string | number | boolean | null) => void
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

  /* De fietsminuten van dezelfde zeven dagen, opgeteld en niet gemiddeld: de
     WHO-richtlijn staat per week, en drie keer vijftig minuten is hetzelfde als
     zeven keer eenentwintig. */
  const fiets7 = sleutels.slice(-7)
    .reduce((s, x) => s + (dagen[x]?.fiets_min ?? 0), 0)
  const fietsVandaag = dagen[datum]?.fiets_min ?? null
  const fietsOoit = sleutels.some((x) => (dagen[x]?.fiets_min ?? 0) > 0)

  /* WANNEER KWAM ER VOOR HET LAATST IETS BINNEN
   *
   * De koppeling met Gezondheid is de enige invoer op dit scherm die vanzelf
   * hoort te gaan, en juist daarom de enige die stil kan vallen zonder dat je
   * het merkt: er komt niets, en dat ziet eruit als een dag zonder stappen.
   *
   * Dit leest de gegevens en niet de sleutel. Wat je wilt weten is of er íets
   * is aangekomen, niet of de koppeling nog bestaat — een sleutel die geldig is
   * en waar niets doorheen komt is geen geruststelling.
   *
   * De regel staat er alleen als er ooit iets binnenkwam. Wie hem nooit heeft
   * ingesteld leest niet elke dag dat er iets stilstaat wat hij niet heeft. */
  const metStappen = Object.keys(dagen).filter((k) => (dagen[k]?.stappen ?? 0) > 0).sort()
  const laatsteBinnen = metStappen.length ? metStappen[metStappen.length - 1]! : null
  const dagenStil = laatsteBinnen
    ? Math.round((Date.parse(vandaag()) - Date.parse(laatsteBinnen)) / 86400000) : null

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
  /* Honderdvijftig minuten matige inspanning per week: de ondergrens uit de
     WHO-richtlijn beweging van 2020. Voor wie op een hometrainer zit is dat de
     bruikbare maat — stappen telt zo'n rit niet mee. */
  const FIETSDOEL = 150
  const haaltStappen = gem7 != null && gem7 >= STAPDOEL
  const haaltFiets = fiets7 >= FIETSDOEL
  /* Eén van de twee is genoeg. Wie fietst hoeft niet óók te lopen, en andersom;
     het gaat om de belasting, niet om de manier. */
  const haaltBeweging = haaltStappen || haaltFiets
  const haaltKracht = sessies >= KRACHTDOEL

  return (
    <>
      <Schermkop
        foto={SFEERFOTO.beweging}
        toon={haaltBeweging && haaltKracht ? 'goed'
          : gem7 == null && fiets7 === 0 ? 'rust' : 'let'}
        bovenschrift="Deze week"
        titel={haaltBeweging && haaltKracht ? 'Allebei gehaald'
          : haaltBeweging ? 'Beweging staat, kracht nog niet'
          : haaltKracht ? 'Kracht staat, beweging nog niet'
          : gem7 == null && fiets7 === 0 ? 'Nog niets ingevuld' : 'Nog niet op dreef'}
        rechts={<span className={'vlaggetje ' + (haaltBeweging && haaltKracht ? 'goed' : 'rust')}>
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
            {/* DE RING TELT STAPPEN, DE KOP TELT BEWEGING

                Die twee kunnen uit elkaar lopen zodra er gefietst wordt, en dan
                staat er een onvolle ring onder een kop die zegt dat het goed
                gaat. De eerste versie loste dat niet op: daar stond "nog 913 per
                dag tot 8.000" pal boven "daarmee is het weekdoel gehaald" —
                twee tegengestelde beweringen naast elkaar.

                De regel hieronder overbrugt ze. Zodra de fiets het doel draagt,
                is "nog 913 stappen" niet meer wat je moet weten, en verdwijnt
                hij. De ring blijft staan en blijft eerlijk: hij zegt "stappen
                per dag" en dat is wat hij telt. */}
            <p style={{ fontSize: '.92rem' }}>
              {gem7 == null && fiets7 === 0
                ? 'Vul een paar dagen stappen in bij Vandaag, of zet hieronder je fietsminuten neer.'
                : haaltStappen
                  ? `Gemiddeld over zeven dagen, boven de ${dz(STAPDOEL)} waar de winst zit.`
                  : haaltFiets
                    ? `Onder de ${dz(STAPDOEL)} stappen, maar de ${dz(fiets7)} minuten op de fiets `
                      + 'halen het weekdoel al.'
                    : gem7 == null
                      ? `Nog ${dz(FIETSDOEL - fiets7)} minuten fietsen tot ${FIETSDOEL} deze week.`
                      : `Gemiddeld over zeven dagen. Nog ${dz(STAPDOEL - gem7)} per dag tot `
                        + `${dz(STAPDOEL)}${fiets7 > 0
                          ? `, of nog ${dz(FIETSDOEL - fiets7)} minuten fietsen tot ${FIETSDOEL}`
                          : ''}.`}
            </p>
            <div className="mini" style={{ marginTop: 10 }}>Krachtsessies deze week</div>
            <Bolletjes aantal={sessies} van={KRACHTDOEL} naam="krachtsessies"
                       kleur={haaltKracht ? 'var(--heldergoed)' : undefined} />
            {dagenStil != null && (
              <p className="mini" style={{ marginTop: 10 }}>
                {dagenStil === 0 ? 'Uit Gezondheid vandaag binnengekomen.'
                 : dagenStil === 1 ? 'Uit Gezondheid gisteren binnengekomen.'
                 : dagenStil <= 2 ? `Uit Gezondheid ${dagenStil} dagen geleden binnengekomen.`
                 : `Uit Gezondheid al ${dagenStil} dagen niets binnengekomen — kijk of de `
                   + 'automatisering op je telefoon nog draait.'}
              </p>
            )}
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

      <Kaart>
        <Tussen>
          <Kop teken={WegFiets}>Fietsen</Kop>
          {haaltFiets && <span className="vlaggetje goed">✓ weekdoel</span>}
        </Tussen>
        <Rij style={{ marginTop: 8, alignItems: 'center' }}>
          <input className="smal" type="number" inputMode="numeric" min="0" step="5" placeholder="—"
                 key={'fm' + datum} defaultValue={fietsVandaag ?? ''}
                 aria-label="Fietsminuten vandaag"
                 onBlur={(e) => zetDagveld('fiets_min', e.target.value || null)} />
          <span className="klein">minuten vandaag</span>
        </Rij>
        <div style={{ marginTop: 10 }}>
          <Tussen>
            <span className="mini">Deze week</span>
            <span className="cijfer mini">{dz(fiets7)} van {FIETSDOEL} min</span>
          </Tussen>
          <Balk deel={(fiets7 / FIETSDOEL) * 100} toon={haaltFiets ? 'goed' : undefined} />
        </div>
        <Uitleg id="fiets" label="waarom minuten en geen kilometers of calorieën">
          <p>
            Afstand zegt op een hometrainer niets — daar is geen afstand. Wat telt is duur maal
            inspanning, en de duur is het enige daarvan dat je zonder vermogensmeter betrouwbaar
            weet. Vandaar minuten.
          </p>
          <p>
            Calorieën worden er met opzet niet van gemaakt. Een schatting uit hartslag of uit een
            tabel per fietstype heeft een fout van twintig tot vijftig procent, en die fout zit niet
            consistent in één richting — corrigeren kan dus niet. Voor jou zou het om honderden
            kcal per rit gaan: genoeg om het hele tekort weg te rekenen op een getal dat geraden is.
          </p>
          <p>
            En het hóéft ook niet: je verbruik wordt gemeten uit de gewichtstrend, en wat je op de
            fiets verbrandt zit daar al in. Wat dit scherm doet is bijhouden dát je bewoog, en dat
            is precies waarvoor de richtlijn geschreven is.
          </p>
        </Uitleg>
      </Kaart>

      <TrainingInvoer datum={datum} bewaar={bewaarTraining} perSpier={perSpier} />

      <Kaart>
        <Kop teken={WegWeken}>Laatste drie weken</Kop>
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
                {/* De fietskolom staat er alleen als er die drie weken ooit
                    gefietst is. Anders is het een kolom streepjes. */}
                {fietsOoit && (
                  <span className="cijfer mini" style={{ width: 44, textAlign: 'right' }}>
                    {r?.fiets_min ? dz(r.fiets_min) + '′' : '—'}
                  </span>
                )}
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
      <Kop teken={WegKracht}>Krachttraining toevoegen</Kop>
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
