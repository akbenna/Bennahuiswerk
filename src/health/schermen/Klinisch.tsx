/**
 * KLINISCH: metingen, lab, SCORE2, FIB-4 en STOP-BANG.
 *
 * De vraag van dit scherm is: staat er iets buiten de grens. Die vraag was
 * alleen te beantwoorden door zestien labwaarden na te lopen en ze zelf tegen
 * hun referentie te houden. Nu telt de kop dat voor je, en toont hij metéén
 * wélke, met de referentie erbij, want "afwijkend" zonder grens is een
 * schrikbeeld en geen gegeven.
 */
import { useState } from 'react'
import { Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Schermkop } from '../hero'
import { dec } from '@/gedeeld/getal'
import { kortNL, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Lab, Meting, Profiel, Vragenlijst } from '@/gedeeld/db/tabellen'
import type { Analyse } from '../rekenkern'
import { VENSTER_DAGEN, thuisbloeddruk } from '../bloeddruk'
import { LeegGeenGegevens } from '../leegbeeld'
import { MEDICATIEGROEPEN, conditieGezet, conditieVan } from '../conditie'
import { STOPBANG, fib4, middelLengte, nieuwste, rustpols, score2, stopbangScore } from '../klinisch'
import type { Rustpols, StopbangAntwoorden, StopbangSleutel } from '../klinisch'
import { WegLab, WegMeting } from '../tekens'
import { SFEERFOTO } from '../sfeerfotos'

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
  ['saturatie', 'zuurstofsaturatie'],
] as const

export interface KlinischEigenschappen {
  a: Analyse
  profiel: Profiel
  /** Het profielvenster openen, waar de conditie wordt ingevuld. */
  opProfiel: () => void
  /** Het venster Leren openen. */
  opLeren: () => void
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


export function Klinisch(p: KlinischEigenschappen) {
  const { a, profiel, labs, metingen } = p
  const lab = (code: string) => nieuwste(labs, (x) => x.code === code)
  const meting = (soort: string) => nieuwste(metingen, (x) => x.soort === soort)

  const sbd = meting('bloeddruk_sys'), dbd = meting('bloeddruk_dia')
  const middel = meting('middelomtrek')
  const pols = rustpols(metingen)
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

  /* Alles wat er is, tegen zijn eigen referentie gehouden. Ontbrekende waarden
     tellen niet als "goed": ze tellen als niet gemeten, en dat is iets anders. */
  const gekeurd = LABS.map(([code, naam, eenheid, lo, hi]) => {
    const x = lab(code)
    if (x?.waarde == null) return { code, naam, eenheid, x: null, buiten: false, lo, hi }
    const w = Number(x.waarde)
    return {
      code, naam, eenheid, x, lo, hi,
      buiten: (lo != null && w < lo) || (hi != null && w > hi),
    }
  })
  const gemeten = gekeurd.filter((g) => g.x != null)
  const buiten = gemeten.filter((g) => g.buiten)

  return (
    <>
      <Schermkop
        foto={SFEERFOTO.gezondheid}
        toon={gemeten.length === 0 ? 'rust' : buiten.length ? 'let' : 'goed'}
        bovenschrift="Klinisch"
        titel={gemeten.length === 0
          ? 'Nog geen labwaarden'
          : buiten.length === 0
            ? 'Alles binnen de referentie'
            : `${buiten.length} waarde${buiten.length === 1 ? '' : 'n'} buiten de referentie`}
        rechts={<span className={'vlaggetje ' + (gemeten.length === 0 ? 'rust'
          : buiten.length ? 'let' : 'goed')}>
          {gemeten.length}/{LABS.length} ingevuld
        </span>}
      >
        {gemeten.length === 0 ? (
          <>
            <LeegGeenGegevens />
            <p style={{ fontSize: '.92rem', marginTop: 2, textAlign: 'center' }}>
              Vul hieronder in wat er in je laatste uitslag stond. Zonder ASAT, ALAT en trombocyten
              valt FIB-4 niet te berekenen, en zonder bloeddruk en cholesterol SCORE2 niet.
            </p>
          </>
        ) : (
          <>
            <div style={{ marginTop: 10 }}>
              {(buiten.length ? buiten : gemeten.slice(0, 4)).map((g) => (
                <div className="labrij" key={g.code}>
                  {/* Oranje en niet rood, en dezelfde kleur als in de tabel
                      eronder. Rood zegt 'ziek' terwijl de zin eronder juist
                      uitlegt dat dat er niet staat; twee kleuren voor hetzelfde
                      feit op één scherm zeggen dat het twee feiten zijn. */}
                  <span className="stoplicht"
                        style={{ background: g.buiten ? 'var(--let)' : 'var(--goed)' }} />
                  <span className="naam">
                    <span style={{ fontSize: '.88rem' }}>{g.naam}</span>
                    <span className="mini" style={{ display: 'block' }}>
                      referentie {g.lo != null ? `vanaf ${dec(g.lo, 1)}` : ''}
                      {g.lo != null && g.hi != null ? ' ' : ''}
                      {g.hi != null ? `tot ${dec(g.hi, 1)}` : ''}
                      {g.lo == null && g.hi == null ? 'geen afkapwaarde in deze app' : ''}
                      {' '}{g.eenheid} · gemeten {kortNL(g.x?.datum ?? vandaag())}
                    </span>
                  </span>
                  <span className={'waarde ' + (g.buiten ? 'buiten' : 'binnen')}>
                    {dec(Number(g.x?.waarde), 1)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mini" style={{ marginTop: 10 }}>
              {buiten.length
                ? 'Buiten de referentie is niet hetzelfde als ziek. Het is een reden om het met je '
                  + 'huisarts te bespreken, en om het over een tijd nog eens te meten.'
                : `De vier meest recente van ${gemeten.length} ingevulde waarden.`}
            </p>
          </>
        )}
      </Schermkop>

      <Conditiekaart profiel={profiel} opProfiel={p.opProfiel} opLeren={p.opLeren} />
      <Eigenbloeddruk metingen={metingen} />

      <MetingInvoer bewaar={p.bewaarMeting} a={a} sbd={sbd} dbd={dbd} middel={middel}
                    lengteCm={profiel.lengte_cm}
                    pols={pols} />
      <LabInvoer bewaar={p.bewaarLab} labs={labs} />

      <Kaart toon={sc?.klasse === 'hoog' ? 'let' : undefined}>
        <Kop>SCORE2: tienjaarsrisico hart- en vaatziekten</Kop>
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
            algoritme rekent met totaal en HDL apart, terwijl de NHG-tabellen non-HDL gebruiken. Bij
            gelijk non-HDL kunnen die uiteenlopen.
          </p>
        )}
      </Kaart>

      <Kaart toon={f?.klasse === 'verwijzen' ? 'let' : undefined}>
        <Kop>FIB-4: leverfibrose bij MASLD</Kop>
        {f ? (
          <>
            <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
              <span className="getal" style={{ fontSize: '2rem' }}>{dec(f.waarde, 2)}</span>
              <span className="klein">
                {f.klasse === 'uitgesloten' ? 'fibrose praktisch uitgesloten'
                 : f.klasse === 'grijs' ? 'grijze zone, tweede test (FibroScan of ELF)'
                 : 'boven 2,67, verwijzing MDL overwegen'}
              </span>
            </Rij>
            <p className="mini" style={{ marginTop: 8 }}>
              Afkapwaarden uit de Richtlijn MASLD/MASH (NVMDL, april 2024): onder {dec(f.onder, 1)} is
              fibrose uitgesloten bij jouw leeftijd, tot 2,67 volgt een tweede test. Geen enkele
              niet-invasieve test haalt sensitiviteit én specificiteit boven de tachtig procent; dit is
              een uitsluittest, geen stadiëring. Bij BMI {dec(a.bmi, 1)} is het cardiometabole criterium
              voor MASLD al vervuld, maar de diagnose vraagt aangetoonde steatose, en die stelt deze
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

/**
 * WAT ER BIJ JOU SPEELT: bovenaan Gezondheid en niet onderin een venster
 *
 * Deze kaart bestond eerst niet, en dat was een fout die het waard is op te
 * schrijven. De hele laag voor chronische zorg (de conditie, de
 * medicatiegroepen, de signalen, de zoutkolom, het venster Leren) was gebouwd
 * en werkte, maar hij hing af van een veld onderin het profielvenster, achter
 * het tabblad Meer. Wie dat veld niet vond, zag van de hele laag niets. Op het
 * tabblad dat Gezondheid heet stond er zelfs geen verwijzing naar.
 *
 * Een functie die pas bestaat als je hem al kent, bestaat niet.
 *
 * Daarom staat dit nu bovenaan dit scherm, en juist ook (of vooral) als er
 * niets is ingevuld. Leeg is hier geen reden om te zwijgen maar de plek waar de
 * uitnodiging hoort: dit is het enige scherm waar iemand naar zijn aandoening
 * komt zoeken.
 *
 * Wat de kaart toont als er wél iets staat, is niet alleen wát je opgaf maar
 * ook wát de app ermee doet. Anders blijft het een vinkje zonder gevolg.
 */
function Conditiekaart(
  { profiel, opProfiel, opLeren }:
  { profiel: Profiel; opProfiel: () => void; opLeren: () => void },
) {
  const c = conditieVan(profiel.instellingen)
  const med = (c.med ?? []).map((g) => MEDICATIEGROEPEN.find((m) => m.groep === g)).filter(Boolean)
  const aandoening = [
    c.hypertensie && 'hoge bloeddruk',
    c.dm2 && 'diabetes type 2',
    c.hvz && 'hart- of vaatziekte',
  ].filter(Boolean) as string[]

  if (!conditieGezet(c)) {
    return (
      <Kaart sfeer="golf">
        <Kop teken={WegMeting}>Wat er bij jou speelt</Kop>
        <p style={{ fontSize: '.92rem', marginTop: 8 }}>
          Heb je hoge bloeddruk, diabetes type 2, of een hart- of vaatziekte gehad? Geef het op,
          dan past de app zich erop aan: je ziet dan zout bij elk product, koolhydraten en vezels
          als dat telt, en je krijgt een seintje bij dingen die met je medicijnen te maken hebben.
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Vul je niets in, dan verandert er niets. Leeg betekent voor deze app dat hij het niet
          weet, en dan zwijgt hij.
        </p>
        <Rij style={{ marginTop: 12 }}>
          <Knop vol opKlik={opProfiel}>Invullen</Knop>
          <Knop opKlik={opLeren}>Leren over je aandoening</Knop>
        </Rij>
      </Kaart>
    )
  }

  return (
    <Kaart sfeer="golf">
      <Kop teken={WegMeting}>Wat er bij jou speelt</Kop>
      <Rij style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
        {aandoening.map((x) => <span key={x} className="vlaggetje let">{x}</span>)}
        {med.map((m) => <span key={m!.groep} className="vlaggetje rust" title={m!.voorbeeld}>{m!.naam}</span>)}
      </Rij>
      <p className="mini" style={{ marginTop: 10 }}>
        Jouw opgave, geen medicatieoverzicht uit de praktijk.
      </p>

      <Tussen style={{ marginTop: 14 }}><Kop>Wat de app hiermee doet</Kop></Tussen>
      <div style={{ fontSize: '.9rem', marginTop: 6 }}>
        {c.hypertensie && (
          <p style={{ marginTop: 4 }}>
            Bij elk product op Voeding staat hoeveel zout erin zit, en hieronder telt je bloeddruk
            per week in plaats van per meting.
          </p>
        )}
        {c.dm2 && (
          <p style={{ marginTop: 4 }}>
            Bij elk product staan de koolhydraten en de vezels, naast de energie en het eiwit.
          </p>
        )}
        {(med.length > 0) && (
          <p style={{ marginTop: 4 }}>
            Bij je medicijnen hoort een seintje als je afvalt. Dat verschijnt op Vandaag, onder de
            knop.
          </p>
        )}
        {!c.hypertensie && !c.dm2 && med.length === 0 && (
          <p style={{ marginTop: 4 }}>
            Voor wat je nu hebt opgegeven verandert er nog niets aan de schermen. Vul je ook je
            medicijnen in, dan let de app mee bij het afvallen.
          </p>
        )}
      </div>

      <Rij style={{ marginTop: 12 }}>
        <Knop opKlik={opProfiel}>Aanpassen</Knop>
        <Knop vol opKlik={opLeren}>Leren over je aandoening</Knop>
      </Rij>
    </Kaart>
  )
}

/**
 * DE BLOEDDRUK ALS WEEKGEMIDDELDE
 *
 * Het scherm liet de nieuwste meting zien. Voor deze waarde is dat dezelfde
 * fout als één weging voor het gewicht: de dagelijkse schommeling is groter dan
 * het verschil dat je wilt zien. De rekenregel en waarom er geen oordeel bij
 * staat, staan in `bloeddruk.ts`.
 */
function Eigenbloeddruk({ metingen }: { metingen: Meting[] }) {
  const t = thuisbloeddruk(metingen, vandaag())
  if (!t) return null

  return (
    /* De golf hoort bij een reeks: dit getal komt uit zeven dagen en niet uit
       één meting, en dat is precies wat de kaart wil zeggen. */
    <Kaart sfeer="golf">
      <Kop>Bloeddruk: je eigen metingen</Kop>
      <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
        <span className="getal" style={{ fontSize: '2rem' }}>{t.sys}/{t.dia}</span>
        <span className="klein">mmHg, gemiddeld over {t.dagen}
          {t.dagen === 1 ? ' dag' : ' dagen'}</span>
      </Rij>
      <p className="mini" style={{ marginTop: 8 }}>
        {t.metingen} metingen, en de dagen liepen {t.spreidingSys} mmHg uiteen in bovendruk.
        {t.volledigeWeek
          ? ' Dat is een hele week, zoals de meting bedoeld is.'
          : ` Een geprotocolleerde thuismeting loopt ${VENSTER_DAGEN} dagen; hoe meer dagen,`
            + ' hoe minder het toeval meeweegt.'}
        {/* Een dag die stilzwijgend wegvalt is een dag waarvan de lezer denkt dat
            hij meetelt. Wie zijn eigen getallen natelt hoort uit te komen. */}
        {t.gewenningsdagWeg
          && ' Je eerste meetdag telt niet mee: op die dag ben je nog aan het apparaat aan het'
             + ' wennen en valt de meting meestal hoger uit. Dat schrijft het protocol zo voor.'}
      </p>
      <p className="mini" style={{ marginTop: 8 }}>
        Twee dingen die deze app niet weet. Of je twee keer voor het ontbijt en twee keer na het
        avondeten gemeten hebt: een meting draagt hier een datum en geen tijdstip. En of dit
        thuismetingen zijn: wat je hier invult telt mee, waar je het ook mat. Wat dit getal betekent
        beoordeelt je huisarts of praktijkondersteuner; deze app zet er met opzet geen grens bij.
      </p>
    </Kaart>
  )
}

function MetingInvoer(
  { bewaar, a, sbd, dbd, middel, pols, lengteCm }:
  {
    bewaar: KlinischEigenschappen['bewaarMeting']; a: Analyse
    sbd: Meting | null; dbd: Meting | null; middel: Meting | null
    pols: Rustpols<Meting> | null
    lengteCm: number | null
  },
) {
  const mlv = middelLengte(middel ? Number(middel.waarde) : null, lengteCm)
  const [soort, zetSoort] = useState<string>(METINGSOORTEN[0][0])
  const [waarde, zetWaarde] = useState('')

  function opslaan() {
    const w = parseFloat(waarde)
    if (!Number.isFinite(w)) return
    bewaar({
      datum: vandaag(), soort, waarde: w,
      eenheid: soort.includes('bloeddruk') ? 'mmHg'
             : soort.includes('omtrek') ? 'cm'
             : soort === 'saturatie' ? '%' : '/min',
    })
    zetWaarde('')
  }

  return (
    <Kaart>
      <Kop teken={WegMeting}>Metingen</Kop>
      {/* WAAROM DE WAARDEN BOVEN HET FORMULIER STAAN
          Je komt hier kijken, en af en toe iets toevoegen. Het formulier stond
          bovenaan, dus het eerste wat je zag was een leeg invoervak en niet je
          eigen bloeddruk. Toevoegen is de uitzondering en hoort onder te staan. */}
      <div className="trio" style={{ marginTop: 10 }}>
        <div>
          <div className="mini">Bloeddruk</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {sbd && dbd ? `${Math.round(sbd.waarde)}/${Math.round(dbd.waarde)}` : '–'}
          </div>
        </div>
        <div>
          <div className="mini">Middelomtrek</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {middel ? dec(middel.waarde, 0) + ' cm' : '–'}
          </div>
        </div>
        <div>
          <div className="mini">BMI</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>{dec(a.bmi, 1)}</div>
        </div>
        <div>
          <div className="mini">Rustpols</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {pols ? Math.round(pols.nu.waarde) + ' /min' : '–'}
          </div>
        </div>
      </div>
      {pols && (
        <p className="mini" style={{ marginTop: 8 }}>
          Gemeten op {kortNL(pols.nu.datum)}.{' '}
          {pols.basis == null
            ? `Nog te weinig eerdere metingen (${pols.n}) om een verandering te zien; `
              + 'vanaf drie staat hier wat hij doet ten opzichte van je eigen gemiddelde.'
            : (() => {
                const d = pols.nu.waarde - pols.basis
                return Math.abs(d) < 2
                  ? `Gelijk aan je gemiddelde van de afgelopen maand (${dec(pols.basis, 0)}).`
                  : `${dec(Math.abs(d), 0)} slagen ${d > 0 ? 'hoger' : 'lager'} dan je gemiddelde `
                    + `van de afgelopen maand (${dec(pols.basis, 0)}). `
                    + (d > 0
                      ? 'Omhoog wijst op slechter herstel, een naderende infectie of te zware '
                        + 'belasting, meestal tijdelijk.'
                      : 'Omlaag gaat meestal samen met een betere conditie.')
              })()}
        </p>
      )}
      {pols && (
        <Uitleg id="rustpols" label="waarom de verandering telt en niet de waarde">
          <p>
            Bij deze meting is de verándering het signaal: de waarde zelf verschilt te veel per
            persoon om er iets uit af te lezen. Een rustpols van 66 zegt zonder jouw eigen
            gemiddelde ernaast niets.
          </p>
        </Uitleg>
      )}
      {middel && (
        <p className="mini" style={{ marginTop: 8 }}>
          {middel.waarde >= 102 ? 'Boven 102 cm, de grens waarbij gewichtsafname wordt aanbevolen.'
           : middel.waarde >= 94 ? 'Tussen 94 en 102 cm, de grens waarbij het gewicht niet meer mag toenemen.'
           : 'Onder 94 cm.'}
        </p>
      )}
      {/* DEZELFDE OMTREK ZEGT IETS ANDERS BIJ EEN ANDERE LENGTE
          De afkappunten hierboven zijn centimeters voor iedereen, en dat is hun
          zwakte: 102 cm bij 1,70 m is iets anders dan 102 cm bij 1,96 m. De
          verhouding lost dat op met één deling en zonder tabel, en het is ook
          wat een kliniek werkelijk meet zodra een MRI-scanner bij 140 kilo
          ophoudt. */}
      {mlv && (
        <p className="mini" style={{ marginTop: 4 }}>
          Gedeeld door je lengte: <b className="hoeveelheid">{dec(mlv.ratio, 2)}</b>.{' '}
          {mlv.zone === 'boven'
            ? 'Boven 0,5. Die grens is voor elke lengte dezelfde: je middel hoort minder dan de '
              + 'helft van je lengte te zijn.'
            : mlv.zone === 'rond'
              ? 'Rond de grens van 0,5. Aan welke kant precies is met één lintmeting niet te '
                + 'zeggen: twee centimeter verschil is hier al 0,01.'
              : 'Onder 0,5, de grens die voor elke lengte dezelfde is.'}
        </p>
      )}
      {/* De meetinstructie stond altijd in beeld zolang er geen middelomtrek
          was, een stuk grijze tekst over ribben en bekkenkammen op een scherm
          waar je je bloeddruk kwam bekijken. Hij hoort er wel te staan, want
          verkeerd meten geeft centimeters verschil, maar achter de uitklapper
          waar alle andere onderbouwing in deze app ook staat. */}
      <Uitleg id="middelomtrek"
              label={middel ? 'waar die grenzen vandaan komen' : 'hoe je de middelomtrek meet'}>
        <p>
          Meten halverwege tussen de onderste rib en de bovenrand van de bekkenkam, staand, op de
          blote huid, lint parallel aan de vloer.
        </p>
        <p>
          Voor Noord-Afrikaanse afkomst gelden dezelfde waarden als voor Europese mannen: IDF, WHO
          en de Nederlandse richtlijn 2023 verwijzen alle drie naar de Europese afkappunten. Alleen
          voor Aziatische afkomst liggen ze lager. Meetfout in de literatuur 0,7 tot 15 cm, dus twee
          centimeter verschil is ruis.
        </p>
        <p>
          De verhouding met je lengte staat er sinds kort naast, en die kent maar één grens: 0,5,
          voor iedereen en voor elke lengte. NICE beveelt hem naast de BMI aan, en in een
          obesitaskliniek is hij vaak het enige wat er werkelijk gemeten wordt: DEXA mag daar
          alleen binnen onderzoek en een MRI-scanner houdt rond de 140 kilo op, precies bij de
          patiënten waar het om gaat.
        </p>
        <p>
          Wat deze maat zegt is wáár het vet zit en niet hoeveel het er is. Dat is de vraag die
          ertoe doet: onderhuids vet doet weinig, vet om de organen geeft insulineresistentie. Hij
          vervangt de BMI dus niet, hij staat ernaast. En hij erft de meetfout van het lint, dus
          hier staan twee cijfers achter de komma en geen drie.
        </p>
      </Uitleg>
      <Rij style={{ marginTop: 12 }}>
        <select value={soort} onChange={(e) => zetSoort(e.target.value)}
                style={{ flex: '1 1 150px', width: 'auto' }}>
          {METINGSOORTEN.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="number" step="0.1" placeholder="waarde" value={waarde}
               onChange={(e) => zetWaarde(e.target.value)} style={{ flex: '0 0 96px' }} />
        <Knop vol opKlik={opslaan}>Opslaan</Knop>
      </Rij>
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
      <Kop teken={WegLab}>Laboratorium</Kop>
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
      <Kop>STOP-BANG: obstructieve slaapapneu</Kop>
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
        <span className="klein"><b>{r.score} van 8</b>, {r.klasse} risico</span>
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
          makkelijker: twee meta-analyses vinden een kleine gewichts<i>toename</i>. Omgekeerd wél: tien
          kilo afvallen verlaagde in Sleep AHEAD de AHI met bijna tien events per uur. Behandel OSA om
          de OSA, en het gewicht apart.
        </p>
      </Uitleg>
    </Kaart>
  )
}
