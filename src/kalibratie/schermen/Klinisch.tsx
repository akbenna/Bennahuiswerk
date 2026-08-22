/**
 * KLINISCH — metingen, lab, SCORE2, FIB-4 en STOP-BANG.
 * Overgezet uit vwKlinisch() en stopbangKaart().
 */
import { useState } from 'react'
import { Kaart, Knop, Kop, Rij, Uitleg } from '../onderdelen/basis'
import { dec } from '@/gedeeld/getal'
import { kortNL, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Lab, Meting, Profiel, Vragenlijst } from '@/gedeeld/db/tabellen'
import type { Analyse } from '../rekenkern'
import { STOPBANG, fib4, score2, stopbangScore } from '../klinisch'
import type { StopbangAntwoorden, StopbangSleutel } from '../klinisch'

/** code, naam, eenheid, ondergrens, bovengrens */
const LABS = [
  ['hba1c', 'HbA1c', 'mmol/mol', null, 42],
  ['glucose_nuchter', 'Nuchter glucose', 'mmol/L', null, 6.0],
  ['tc', 'Totaal cholesterol', 'mmol/L', null, null],
  ['hdl', 'HDL-cholesterol', 'mmol/L', 1.0, null],
  ['ldl', 'LDL-cholesterol', 'mmol/L', null, 2.6],
  ['tg', 'Triglyceriden', 'mmol/L', null, 1.7],
  ['alat', 'ALAT', 'U/L', null, 45],
  ['asat', 'ASAT', 'U/L', null, 35],
  ['ggt', 'GGT', 'U/L', null, 55],
  ['trombo', 'Trombocyten', '10⁹/L', 150, 400],
  ['tsh', 'TSH', 'mE/L', 0.4, 4.0],
  ['vitd', 'Vitamine D', 'nmol/L', 50, null],
  ['egfr', 'eGFR', 'ml/min', 60, null],
  ['kreat', 'Kreatinine', 'µmol/L', null, 110],
] as const satisfies ReadonlyArray<readonly [string, string, string, number | null, number | null]>

const METINGSOORTEN = [
  ['bloeddruk_sys', 'bloeddruk systolisch'],
  ['bloeddruk_dia', 'bloeddruk diastolisch'],
  ['middelomtrek', 'middelomtrek'],
  ['nekomtrek', 'nekomtrek'],
  ['hartslag_rust', 'hartslag in rust'],
] as const

export interface KlinischEigenschappen {
  a: Analyse
  profiel: Profiel
  labs: Lab[]
  metingen: Meting[]
  vragenlijsten: Vragenlijst[]
  bewaarMeting: (m: { datum: IsoDatum; soort: string; waarde: number; eenheid: string }) => void
  bewaarLab: (l: {
    datum: IsoDatum; code: string; naam: string; waarde: number
    eenheid: string; ref_laag: number | null; ref_hoog: number | null
  }) => void
  bewaarStopbang: (v: {
    datum: IsoDatum; soort: string; antwoorden: StopbangAntwoorden
    score: number; klasse: string
  }) => void
}

const nieuwste = <T extends { datum: IsoDatum }>(lijst: T[], test: (x: T) => boolean): T | null =>
  lijst.filter(test).sort((x, y) => (x.datum < y.datum ? 1 : -1))[0] ?? null

export function Klinisch(p: KlinischEigenschappen) {
  const { a, profiel, labs, metingen } = p
  const lab = (code: string) => nieuwste(labs, (x) => x.code === code)
  const meting = (soort: string) => nieuwste(metingen, (x) => x.soort === soort)

  const sbd = meting('bloeddruk_sys'), dbd = meting('bloeddruk_dia')
  const middel = meting('middelomtrek')
  const tc = lab('tc'), hdl = lab('hdl')

  const sc = sbd?.waarde != null && tc?.waarde != null && hdl?.waarde != null
    ? score2(profiel.geslacht, {
        leeftijd: profiel.leeftijd_jaar ?? 0,
        rook: !!profiel.instellingen.rookt,
        sbd: Number(sbd.waarde), tc: Number(tc.waarde), hdl: Number(hdl.waarde), dm: false,
      })
    : null

  const f = fib4({
    leeftijd: profiel.leeftijd_jaar ?? 0,
    asat: Number(lab('asat')?.waarde ?? 0),
    alat: Number(lab('alat')?.waarde ?? 0),
    trombo: Number(lab('trombo')?.waarde ?? 0),
  })

  return (
    <>
      <MetingInvoer bewaar={p.bewaarMeting} a={a} sbd={sbd} dbd={dbd} middel={middel} />
      <LabInvoer bewaar={p.bewaarLab} labs={labs} />

      <Kaart toon={sc?.klasse === 'hoog' ? 'let' : undefined}>
        <Kop>SCORE2 — tienjaarsrisico hart- en vaatziekten</Kop>
        {sc ? (
          <>
            <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
              <span className="getal" style={{ fontSize: '2rem' }}>{dec(sc.risico, 1)}%</span>
              <span className="klein">{sc.klasse} risico volgens NHG-CVRM</span>
            </Rij>
            <p className="mini" style={{ marginTop: 8 }}>
              Berekend met het gepubliceerde ESC-algoritme voor de laag-risicoregio, niet met de tabel.
              Twee kanttekeningen die erbij horen: SCORE2 onderschat in Nederland met een factor 1,3 bij
              mannen, oplopend bij lage sociaaleconomische status en niet-westerse afkomst, en de
              C-index is 0,65 tot 0,72. Dit is een gespreksinstrument, geen individuele voorspelling.
            </p>
          </>
        ) : (
          <p className="klein" style={{ marginTop: 4 }}>
            Nog niet te berekenen. Nodig: systolische bloeddruk, totaal cholesterol en HDL. Het
            algoritme rekent met totaal en HDL apart, terwijl de NHG-tabellen non-HDL gebruiken — bij
            gelijk non-HDL kunnen die uiteenlopen.
          </p>
        )}
      </Kaart>

      <Kaart toon={f?.klasse === 'verwijzen' ? 'let' : undefined}>
        <Kop>FIB-4 — leverfibrose bij MASLD</Kop>
        {f ? (
          <>
            <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
              <span className="getal" style={{ fontSize: '2rem' }}>{dec(f.waarde, 2)}</span>
              <span className="klein">
                {f.klasse === 'uitgesloten' ? 'fibrose praktisch uitgesloten'
                 : f.klasse === 'grijs' ? 'grijze zone — tweede test (FibroScan of ELF)'
                 : 'boven 2,67 — verwijzing MDL overwegen'}
              </span>
            </Rij>
            <p className="mini" style={{ marginTop: 8 }}>
              Afkapwaarden uit de Richtlijn MASLD/MASH (NVMDL, april 2024): onder {dec(f.onder, 1)} is
              fibrose uitgesloten bij jouw leeftijd, tot 2,67 volgt een tweede test. Geen enkele
              niet-invasieve test haalt sensitiviteit én specificiteit boven de tachtig procent; dit is
              een uitsluittest, geen stadiëring. Bij BMI {dec(a.bmi, 1)} is het cardiometabole criterium
              voor MASLD al vervuld — maar de diagnose vraagt aangetoonde steatose, en die stelt deze
              app niet.
            </p>
          </>
        ) : (
          <p className="klein" style={{ marginTop: 4 }}>
            Nodig: ASAT, ALAT en trombocyten. Met het oog op MASLD hoort dat in de nulmeting.
          </p>
        )}
      </Kaart>

      <StopbangKaart vragenlijsten={p.vragenlijsten} bewaar={p.bewaarStopbang} />
    </>
  )
}

function MetingInvoer(
  { bewaar, a, sbd, dbd, middel }:
  {
    bewaar: KlinischEigenschappen['bewaarMeting']; a: Analyse
    sbd: Meting | null; dbd: Meting | null; middel: Meting | null
  },
) {
  const [soort, zetSoort] = useState<string>(METINGSOORTEN[0][0])
  const [waarde, zetWaarde] = useState('')

  function opslaan() {
    const w = parseFloat(waarde)
    if (!Number.isFinite(w)) return
    bewaar({
      datum: vandaag(), soort, waarde: w,
      eenheid: soort.includes('bloeddruk') ? 'mmHg' : soort.includes('omtrek') ? 'cm' : '/min',
    })
    zetWaarde('')
  }

  return (
    <Kaart>
      <Kop>Metingen</Kop>
      <Rij style={{ marginTop: 8 }}>
        <select value={soort} onChange={(e) => zetSoort(e.target.value)}
                style={{ flex: '1 1 150px', width: 'auto' }}>
          {METINGSOORTEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="number" step="0.1" placeholder="waarde" value={waarde}
               onChange={(e) => zetWaarde(e.target.value)} style={{ flex: '0 0 96px' }} />
        <Knop vol opKlik={opslaan}>Opslaan</Knop>
      </Rij>
      <div className="trio" style={{ marginTop: 12 }}>
        <div>
          <div className="mini">Bloeddruk</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {sbd && dbd ? `${Math.round(sbd.waarde)}/${Math.round(dbd.waarde)}` : '—'}
          </div>
        </div>
        <div>
          <div className="mini">Middelomtrek</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {middel ? dec(middel.waarde, 0) + ' cm' : '—'}
          </div>
        </div>
        <div>
          <div className="mini">BMI</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>{dec(a.bmi, 1)}</div>
        </div>
      </div>
      {middel ? (
        <p className="mini" style={{ marginTop: 8 }}>
          {middel.waarde >= 102 ? 'Boven 102 cm — de grens waarbij gewichtsafname wordt aanbevolen.'
           : middel.waarde >= 94 ? 'Tussen 94 en 102 cm — de grens waarbij het gewicht niet meer mag toenemen.'
           : 'Onder 94 cm.'}{' '}
          Voor Noord-Afrikaanse afkomst gelden dezelfde waarden als voor Europese mannen: IDF, WHO en
          de Nederlandse richtlijn 2023 verwijzen alle drie naar de Europese afkappunten. Alleen voor
          Aziatische afkomst liggen ze lager. Meetfout in de literatuur 0,7 tot 15 cm — twee centimeter
          verschil is ruis.
        </p>
      ) : (
        <p className="mini" style={{ marginTop: 8 }}>
          Meten halverwege tussen de onderste rib en de bovenrand van de bekkenkam, staand, op de blote
          huid, lint parallel aan de vloer.
        </p>
      )}
    </Kaart>
  )
}

function LabInvoer(
  { bewaar, labs }: { bewaar: KlinischEigenschappen['bewaarLab']; labs: Lab[] },
) {
  const [code, zetCode] = useState<string>(LABS[0][0])
  const [waarde, zetWaarde] = useState('')
  const [datum, zetDatum] = useState<IsoDatum>(vandaag())

  function opslaan() {
    const w = parseFloat(waarde)
    const def = LABS.find((x) => x[0] === code)
    if (!Number.isFinite(w) || !def) return
    bewaar({
      datum, code, naam: def[1], waarde: w, eenheid: def[2],
      ref_laag: def[3], ref_hoog: def[4],
    })
    zetWaarde('')
  }

  const getoond = LABS
    .map((def) => ({ def, l: nieuwste(labs, (x) => x.code === def[0]) }))
    .filter((x): x is { def: (typeof LABS)[number]; l: Lab } => x.l != null)

  return (
    <Kaart>
      <Kop>Laboratorium</Kop>
      <Rij style={{ marginTop: 8 }}>
        <select value={code} onChange={(e) => zetCode(e.target.value)}
                style={{ flex: '1 1 160px', width: 'auto' }}>
          {LABS.map(([c, n, e]) => <option key={c} value={c}>{n} ({e})</option>)}
        </select>
        <input type="number" step="0.01" placeholder="waarde" value={waarde}
               onChange={(e) => zetWaarde(e.target.value)} style={{ flex: '0 0 96px' }} />
        <input type="date" value={datum} onChange={(e) => zetDatum(e.target.value)}
               style={{ flex: '0 0 148px' }} />
        <Knop vol opKlik={opslaan}>Opslaan</Knop>
      </Rij>
      <div className="lijst" style={{ marginTop: 10 }}>
        {getoond.length === 0 && <div className="klein">Nog geen labwaarden.</div>}
        {getoond.map(({ def, l }) => {
          const [, naam, eenheid, lo, hi] = def
          const buiten = (lo != null && l.waarde != null && l.waarde < lo)
                      || (hi != null && l.waarde != null && l.waarde > hi)
          return (
            <div key={def[0]}>
              <span className="groei" style={{ fontSize: '.86rem' }}>{naam}</span>
              <span className="cijfer" style={{
                fontSize: '.86rem', color: buiten ? 'var(--let)' : 'inherit',
              }}>
                {dec(l.waarde, 2)} {eenheid}
              </span>
              <span className="mini">{kortNL(l.datum)}</span>
            </div>
          )
        })}
      </div>
    </Kaart>
  )
}

function StopbangKaart(
  { vragenlijsten, bewaar }:
  { vragenlijsten: Vragenlijst[]; bewaar: KlinischEigenschappen['bewaarStopbang'] },
) {
  const laatste = nieuwste(vragenlijsten, (x) => x.soort === 'stopbang')
  const [antwoorden, zetAntwoorden] = useState<StopbangAntwoorden>(
    () => (laatste?.antwoorden ?? {}) as StopbangAntwoorden)
  const r = stopbangScore(antwoorden)

  return (
    <Kaart toon={laatste && r.klasse === 'hoog' ? 'let' : undefined}>
      <Kop>STOP-BANG — obstructieve slaapapneu</Kop>
      <div style={{ marginTop: 8 }}>
        {STOPBANG.map(([k, l]) => (
          <label key={k} style={{
            display: 'flex', gap: 9, padding: '6px 0', cursor: 'pointer', alignItems: 'flex-start',
          }}>
            <input type="checkbox" checked={!!antwoorden[k as StopbangSleutel]}
                   style={{ width: 19, height: 19, flex: '0 0 19px', marginTop: 2 }}
                   onChange={(e) =>
                     zetAntwoorden((a) => ({ ...a, [k]: e.target.checked }))} />
            <span style={{ fontSize: '.85rem', lineHeight: 1.35 }}>{l}</span>
          </label>
        ))}
      </div>
      <Rij style={{ marginTop: 8 }}>
        <Knop vol opKlik={() => bewaar({
          datum: vandaag(), soort: 'stopbang', antwoorden,
          score: r.score, klasse: r.klasse,
        })}>Berekenen en bewaren</Knop>
        <span className="klein"><b>{r.score} van 8</b> — {r.klasse} risico</span>
      </Rij>
      <Uitleg id="stopbang" label="wat deze score wél en niet zegt">
        <p>
          Bij een score van drie of meer is de sensitiviteit voor matig tot ernstig OSA 94 procent, maar
          de <b>specificiteit slechts 34 procent</b>. Man boven de vijftig levert al twee punten op
          zonder één klacht: in een populatie van vijftigplusmannen met obesitas is bijna iedereen
          "matig risico", en dat is informatie over de vragenlijst, niet over jou.
        </p>
        <p>
          En de richting van het bewijs is anders dan vaak wordt aangenomen. CPAP maakt afvallen niet
          makkelijker — twee meta-analyses vinden een kleine gewichts<i>toename</i>. Omgekeerd wél: tien
          kilo afvallen verlaagde in Sleep AHEAD de AHI met bijna tien events per uur. Behandel OSA om
          de OSA, en het gewicht apart.
        </p>
      </Uitleg>
    </Kaart>
  )
}
