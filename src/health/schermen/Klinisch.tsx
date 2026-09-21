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
import { Kaart, Keuzechip, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Schermkop } from '../hero'
import { dec } from '@/gedeeld/getal'
import { kortNL, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Lab, Meting, Profiel, Vragenlijst } from '@/gedeeld/db/tabellen'
import type { Analyse, Trendpunt } from '../rekenkern'
import { VENSTER_DAGEN, spreekkamerUitThuis, thuisbloeddruk } from '../bloeddruk'
import type { Thuisbloeddruk } from '../bloeddruk'
import { LeegGeenGegevens } from '../leegbeeld'
import { MEDICATIEGROEPEN, conditieGezet, conditieVan } from '../conditie'
import {
  STOPBANG, fib4, middelLengte, nieuwste, rustpols, score2, stopbangScore, stopbangUitGegevens,
} from '../klinisch'
import { middelbeloop } from '../middelbeloop'
import { hartleeftijd, watals } from '../watals'
import type { Hartleeftijd, WatalsInvoer } from '../watals'
import { spreekuurtekst } from '../spreekuur'
import type { Spreekuurbron } from '../spreekuur'
import { tijdspanne, veranderingen } from '../verandering'
import type { Verandering } from '../verandering'
import type { Rustpols, StopbangAntwoorden, StopbangSleutel } from '../klinisch'
import { WegLab, WegMeting, WegTraject } from '../tekens'
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

/**
 * DE METINGEN DIE JE ZELF INVULT.
 *
 * Code, wat er boven het vakje staat, de eenheid en de stap van het vakje.
 *
 * Dit was een uitrolmenu met één waardeveld ernaast, en dat is voor precies het
 * geval waar het hier het vaakst om gaat de verkeerde vorm: een bloeddruk is
 * twee getallen die bij elkaar horen, en die kostte zo twee keer kiezen, twee
 * keer typen en twee keer opslaan. Zes open vakjes passen op één scherm, dus
 * staan ze er alle zes.
 */
const METINGSOORTEN = [
  ['bloeddruk_sys', 'Bovendruk', 'mmHg', 1],
  ['bloeddruk_dia', 'Onderdruk', 'mmHg', 1],
  ['hartslag_rust', 'Rustpols', '/min', 1],
  ['middelomtrek', 'Middelomtrek', 'cm', 0.5],
  ['nekomtrek', 'Nekomtrek', 'cm', 0.5],
  ['saturatie', 'Saturatie', '%', 1],
] as const satisfies ReadonlyArray<readonly [string, string, string, number]>

export interface KlinischEigenschappen {
  a: Analyse
  profiel: Profiel
  /** Het profielvenster openen, waar de conditie wordt ingevuld. */
  opProfiel: () => void
  /** Het venster Leren openen. */
  opLeren: () => void
  /** Het boekje Verdiepen openen, eventueel meteen op één stuk. */
  opVerdiepen: (stuk?: string) => void
  labs: Lab[]
  metingen: Meting[]
  /** De hele reeks, voor de kaart met wat er veranderd is. */
  reeks: readonly Trendpunt[]
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
  const nek = meting('nekomtrek')
  const pols = rustpols(metingen)
  const tc = lab('tc'), hdl = lab('hdl')

  /* SCORE2 REKENT MET DE SPREEKKAMER, EN DEZE APP MEET THUIS
   *
   * Hier stond de nieuwste losse bloeddrukmeting in de risicoschatting. Dat is
   * twee keer de verkeerde waarde. Eén meting is geen bloeddruk, en dat weet
   * deze app: de kaart eronder rekent al over een week. En een thuismeting mag
   * volgens de richtlijnmodule niet rechtstreeks in de risicotabel, want die
   * tabel gaat uit van gestandaardiseerde spreekkamermetingen. Een thuiswaarde
   * valt lager uit, dus het risico viel te laag uit.
   *
   * Nu gaat de week erin, omgerekend naar de spreekkamerwaarde die de tabel
   * verwacht. Hoe die schatting loopt staat in `bloeddruk.ts`; wat er ingegaan
   * is staat op het scherm, met het risico zonder correctie ernaast. */
  const thuis = thuisbloeddruk(metingen, vandaag())
  const sysThuis = thuis?.sys ?? (sbd?.waarde != null ? Number(sbd.waarde) : null)
  const sysSpreekkamer = sysThuis != null ? spreekkamerUitThuis(sysThuis) : null

  const risico = (sys: number) => (tc?.waarde != null && hdl?.waarde != null
    ? score2(profiel.geslacht, {
        leeftijd: profiel.leeftijd_jaar ?? 0,
        rook: !!profiel.instellingen.rookt,
        sbd: sys, tc: Number(tc.waarde), hdl: Number(hdl.waarde), dm: false,
      })
    : null)

  const sc = sysSpreekkamer != null ? risico(sysSpreekkamer) : null
  /* Wat er gestaan zou hebben zonder de omrekening. Niet om te kiezen, maar
     omdat een lezer hoort te zien hoeveel die stap uitmaakt. */
  const scZonder = sysThuis != null ? risico(sysThuis) : null

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

  /* HET VEL VOOR HET SPREEKUUR
     Alles wat hierboven al is uitgerekend, en niets nieuws. Zie de kop van
     `spreekuur.ts`: zou dit vel zelf rekenen, dan konden het scherm en het
     briefje verschillende dingen zeggen over dezelfde dag.
     De STOP-BANG komt uit de bewaarde vragenlijst en niet uit de vinkjes op het
     scherm: wat je nog niet bewaard hebt, heb je nog niet ingevuld. */
  const sbLijst = nieuwste(p.vragenlijsten, (x) => x.soort === 'stopbang')
  /* De laatste waarde van de gladde lijn, niet `a.gewicht`: dat is de weging
     zelf, en die verschilt van dag tot dag voor een flink deel door vocht. */
  const trendKg = [...p.reeks].reverse().find((x) => x.ema != null)?.ema ?? null
  const spreekuur: Spreekuurbron = {
    vandaag: vandaag(),
    gewichtKg: trendKg,
    bmi: a.bmi,
    middelCm: middel?.waarde != null ? Number(middel.waarde) : null,
    middelDatum: middel?.datum ?? null,
    middelLengte: middelLengte(middel ? Number(middel.waarde) : null, profiel.lengte_cm),
    middelbeloop: middelbeloop(metingen, p.reeks),
    thuis,
    sysSpreekkamer,
    veranderingen: veranderingen(p.reeks, metingen, labs),
    labs: gemeten.map((g) => ({
      naam: g.naam, waarde: Number(g.x?.waarde), eenheid: g.eenheid,
      lo: g.lo, hi: g.hi, datum: g.x?.datum ?? '',
    })),
    labsLeeg: gekeurd.filter((g) => g.x == null).map((g) => g.naam),
    score2: sc ? { risico: sc.risico, klasse: sc.klasse } : null,
    fib4: f ? {
      waarde: f.waarde,
      klasse: f.klasse === 'uitgesloten' ? 'fibrose praktisch uitgesloten'
        : f.klasse === 'grijs' ? 'grijze zone, een tweede test hoort erbij'
        : 'boven 2,67, verwijzing MDL overwegen',
    } : null,
    stopbang: sbLijst?.score != null && sbLijst.klasse
      ? { score: sbLijst.score, klasse: `${sbLijst.klasse} risico` }
      : null,
  }

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

      <Conditiekaart profiel={profiel} opProfiel={p.opProfiel} opLeren={p.opLeren}
                     opVerdiepen={p.opVerdiepen} />
      <Veranderingkaart rijen={veranderingen(p.reeks, metingen, labs)} />
      <Eigenbloeddruk t={thuis} />

      <MetingInvoer bewaar={p.bewaarMeting} a={a} sbd={sbd} dbd={dbd} middel={middel}
                    lengteCm={profiel.lengte_cm} alleMetingen={metingen} reeks={p.reeks}
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
              Gerekend met <b className="hoeveelheid">{sysSpreekkamer} mmHg</b> bovendruk:
              {thuis
                ? ` de geschatte spreekkamerwaarde bij je thuisgemiddelde van ${sysThuis} over `
                  + `${thuis.dagen} ${thuis.dagen === 1 ? 'dag' : 'dagen'}.`
                : ` de geschatte spreekkamerwaarde bij je laatste meting van ${sysThuis}.`}
              {' '}De risicotabel gaat uit van een meting in de spreekkamer, en die valt hoger uit
              dan een meting thuis; de omrekening komt uit tabel 1 van de richtlijnmodule.
              {scZonder ? ` Zonder die stap zou hier ${dec(scZonder.risico, 1)}% staan.` : ''}
            </p>
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

      {sc && sysSpreekkamer != null && tc?.waarde != null && hdl?.waarde != null
        && profiel.leeftijd_jaar != null && trendKg != null
        && (profiel.geslacht === 'm' || profiel.geslacht === 'v') && (
        <WatalsKaart
          nu={{
            geslacht: profiel.geslacht, leeftijd: profiel.leeftijd_jaar,
            rookt: !!profiel.instellingen.rookt, dm: false,
            gewichtKg: trendKg, sbd: sysSpreekkamer,
            tc: Number(tc.waarde), hdl: Number(hdl.waarde),
          }}
          lengteCm={profiel.lengte_cm} doelKg={profiel.doel_gewicht_kg} />
      )}

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

      <StopbangKaart vragenlijsten={p.vragenlijsten} bewaar={p.bewaarStopbang}
                     uitGegevens={stopbangUitGegevens({
                       geslacht: profiel.geslacht === 'm' || profiel.geslacht === 'v'
                         ? profiel.geslacht : null,
                       leeftijdJaar: profiel.leeftijd_jaar,
                       bmi: a.bmi,
                       nekCm: nek ? Number(nek.waarde) : null,
                     })} />

      <Spreekuurkaart bron={spreekuur} />
    </>
  )
}

/**
 * MEE NAAR HET SPREEKUUR
 *
 * Een consult duurt tien minuten. Alles wat op dit scherm staat, staat er dan
 * niet: voorlezen van een telefoon kost meer tijd dan er is, en de helft komt
 * er verkeerd uit. Dit maakt er één tekst van om te plakken.
 *
 * WAAROM HET VEL ZICHTBAAR IS VOORDAT JE HET KOPIEERT
 *
 * Wat je verstuurt, hoor je gelezen te hebben. Een knop die stilletjes iets
 * over je gezondheid naar je klembord zet, en dus naar de volgende plek waar je
 * plakt, is in deze app de verkeerde vorm. Vandaar de tekst erbij, in dezelfde
 * regels als waarin hij vertrekt.
 */
function Spreekuurkaart({ bron }: { bron: Spreekuurbron }) {
  const tekst = spreekuurtekst(bron)
  const [gedaan, zetGedaan] = useState(false)

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst)
      zetGedaan(true)
      setTimeout(() => zetGedaan(false), 2400)
    } catch {
      /* Het klembord mag alleen in een beveiligde context. Dan maar selecteren:
         beter dan een knop die niets doet en niets zegt. */
      const el = document.getElementById('spreekuurvel')
      if (el) {
        const bereik = document.createRange()
        bereik.selectNodeContents(el)
        getSelection()?.removeAllRanges()
        getSelection()?.addRange(bereik)
      }
    }
  }

  return (
    <Kaart>
      <Kop teken={WegMeting}>Mee naar het spreekuur</Kop>
      <p style={{ fontSize: '.92rem', marginTop: 8 }}>
        Alles van dit scherm in één tekst: je gewicht uit de trend, de week bloeddruk, je
        middelomtrek met de datum, de labwaarden zoals je ze overnam, en wat de app daaruit
        berekent. De voorbehouden gaan mee, want een getal zonder die zinnen is in een mailbox
        een ander getal.
      </p>
      <Rij style={{ marginTop: 12 }}>
        <Knop vol opKlik={() => void kopieer()}>
          {gedaan ? 'Gekopieerd' : 'Kopieer het overzicht'}
        </Knop>
      </Rij>
      <p className="mini" style={{ marginTop: 8 }}>
        Er wordt niets verstuurd en niets opgeslagen: de tekst gaat naar je klembord en verder
        nergens heen. Wat je ermee doet is aan jou.
      </p>
      <Uitleg id="spreekuurvel-toon" label="lees eerst wat erin staat">
        <pre id="spreekuurvel" className="spreekuurvel">{tekst}</pre>
      </Uitleg>
    </Kaart>
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
  { profiel, opProfiel, opLeren, opVerdiepen }:
  {
    profiel: Profiel; opProfiel: () => void; opLeren: () => void
    opVerdiepen: (stuk?: string) => void
  },
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
          <Knop opKlik={() => opVerdiepen()}>Lezen over afvallen</Knop>
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
        <Knop opKlik={() => opVerdiepen()}>Lezen over afvallen</Knop>
      </Rij>
    </Kaart>
  )
}

/**
 * WAT ALS: de schuif, en wat eronder hoort te staan
 *
 * De rekensom staat in `watals.ts`, met de bronnen en met wat eraan mankeert.
 * Hier staat alleen hoe het op het scherm komt, en daar zijn twee keuzes in
 * gemaakt die het verschil uitmaken tussen een hulpmiddel en een goocheltruc.
 *
 * **De twee stappen staan er allebei.** Eerst wat er met je bloeddruk en je
 * cholesterol gebeurt, dan pas wat SCORE2 daarvan leest. Wie de eerste stap niet
 * gelooft, ziet meteen waar hij niet in meegaat. Eén pijl van kilo's naar een
 * risicopercentage zou verbergen dat er een aanname tussen zit.
 *
 * **De band staat naast het getal en niet eronder.** Het middelste effect is een
 * gemiddelde uit studies; de helft van de mensen zit erbuiten. Een kaart die
 * "2,7 procent" zegt en de spreiding in de kleine letters zet, zegt iets anders
 * dan hij waarmaakt.
 */
function WatalsKaart(
  { nu, lengteCm, doelKg }:
  { nu: WatalsInvoer; lengteCm: number | null; doelKg: number | null },
) {
  /* Tot een BMI van 20 en niet verder: dat is geen advies maar de onderkant van
     het bereik waarbinnen de vraag zinnig is. Zonder lengte dertig kilo. */
  const bodem = lengteCm ? Math.round(20 * (lengteCm / 100) ** 2) : nu.gewichtKg - 30
  const max = Math.max(1, Math.min(30, Math.round(nu.gewichtKg - bodem)))
  /* De schuif begint op je eigen doel als dat er is, en anders op vijf kilo.
     Op nul beginnen zou een kaart geven die zegt dat er niets verandert. */
  const begin = doelKg != null && doelKg < nu.gewichtKg
    ? Math.min(max, Math.round(nu.gewichtKg - doelKg)) : Math.min(max, 5)
  const [kilos, zetKilos] = useState(begin)
  const [stopt, zetStopt] = useState(false)

  const uit = watals(nu, { kilosEraf: kilos, stoptMetRoken: stopt })
  if (!uit) return null
  const hNu = hartleeftijd(nu.geslacht, uit.nu.risico)
  const hStraks = hartleeftijd(nu.geslacht, uit.straks.risico)
  const jaren = (h: Hartleeftijd | null): string =>
    h == null ? '–' : 'jaren' in h ? `${h.jaren} jaar` : h.grens === 'onder' ? 'onder de 40' : 'boven de 69'

  return (
    <Kaart sfeer="golf">
      <Kop teken={WegTraject}>Wat als</Kop>
      <p style={{ fontSize: '.92rem', marginTop: 6 }}>
        Wat gewichtsverlies gemiddeld doet met je bloeddruk en je cholesterol, en wat SCORE2 daar
        vervolgens van leest. Twee stappen, allebei zichtbaar.
      </p>

      <label className="veld" style={{ marginTop: 14 }}>
        <span>
          <b className="hoeveelheid">{kilos} kg</b> eraf: van {dec(nu.gewichtKg, 1)} naar{' '}
          {dec(uit.straks.waarden.gewichtKg, 1)} kg
        </span>
        <input type="range" className="schuif" min={0} max={max} step={1} value={kilos}
               aria-label="hoeveel kilo eraf"
               onChange={(e) => zetKilos(Number(e.target.value))} />
      </label>
      {nu.rookt && (
        <Rij style={{ marginTop: 8 }}>
          <Keuzechip aan={stopt} opKlik={() => zetStopt((x) => !x)}>en ik stop met roken</Keuzechip>
        </Rij>
      )}

      <Tussen style={{ marginTop: 14 }}><Kop>Stap 1: je waarden</Kop></Tussen>
      <div className="trio" style={{ marginTop: 6 }}>
        <div>
          <div className="mini">Bovendruk</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {Math.round(uit.straks.waarden.sbd)}
          </div>
          <div className="mini">was {Math.round(nu.sbd)} mmHg</div>
        </div>
        <div>
          <div className="mini">Totaal cholesterol</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {dec(uit.straks.waarden.tc, 1)}
          </div>
          <div className="mini">was {dec(nu.tc, 1)} mmol/L</div>
        </div>
        <div>
          <div className="mini">HDL</div>
          <div className="getal" style={{ fontSize: '1.2rem' }}>
            {dec(uit.straks.waarden.hdl, 2)}
          </div>
          <div className="mini">was {dec(nu.hdl, 2)} mmol/L</div>
        </div>
      </div>

      <Tussen style={{ marginTop: 14 }}><Kop>Stap 2: wat SCORE2 daarvan leest</Kop></Tussen>
      <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
        <span className="getal" style={{ fontSize: '2rem' }}>{dec(uit.straks.risico, 1)}%</span>
        <span className="klein">
          in plaats van {dec(uit.nu.risico, 1)}%, band {dec(uit.laagste.risico, 1)} tot{' '}
          {dec(uit.hoogste.risico, 1)}
        </span>
      </Rij>
      <p className="mini" style={{ marginTop: 8 }}>
        Hartleeftijd {jaren(hNu)} nu, {jaren(hStraks)} dan. Dat is de leeftijd waarop iemand met
        ideale waarden hetzelfde tienjaarsrisico heeft als jij; er hangt geen behandelgrens aan.
      </p>
      <p className="mini" style={{ marginTop: 8 }}>
        Dit is het gemiddelde van studies en geen voorspelling voor jou: de helft van de mensen
        wijkt er fors van af, en waarom dat zo is staat in de kennisbank bij het stuk over
        responders. Er staat ook geen gewonnen levensjaar bij, want dat vraagt aannames die deze
        app niet doet.
      </p>

      <Uitleg id="watals" label="waar deze effecten vandaan komen">
        <p>
          <b>Bloeddruk:</b> ongeveer één mmHg systolisch per kilo, uit de meta-analyse van Neter
          en anderen (Hypertension 2003, vijfentwintig trials).
        </p>
        <p>
          <b>Cholesterol:</b> per kilo ongeveer 0,05 mmol/L totaal cholesterol eraf en 0,009
          mmol/L HDL erbij, uit de meta-analyse van Dattilo en Kris-Etherton (Am J Clin Nutr
          1992). Die HDL-stijging geldt bij een stábiel gewicht; tijdens het afvallen zelf daalt
          HDL in die analyse juist licht, dus wie halverwege meet ziet iets anders.
        </p>
        <p>
          Geen van beide schattingen is tegen het artikel zelf nagelopen; ze komen uit weergaven
          van derden. Daarom is de band hier ruim genomen, en daarom is het geen gepubliceerd
          betrouwbaarheidsinterval maar een marge.
        </p>
        <p>
          Stoppen met roken telt in SCORE2 als een schakelaar: aan of uit. In het echt zakt dat
          risico over jaren en niet op de dag dat je stopt.
        </p>
      </Uitleg>
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
/**
 * WAT ER VERANDERD IS SINDS JE BEGON
 *
 * De rest van dit scherm is een momentopname: dit is de enige kaart die twee
 * momenten naast elkaar zet. Dat is met opzet de eerste kaart onder de kop,
 * want het is de vraag waarvoor je hier komt zodra je langer dan een paar weken
 * bezig bent.
 *
 * Er staat een verschil en geen oordeel: geen kleur, geen pijl die "goed"
 * betekent. Wat de rekenregels zijn en waarom, staat in `verandering.ts`.
 */
function Veranderingkaart({ rijen }: { rijen: Verandering[] }) {
  if (!rijen.length) return null
  return (
    <Kaart>
      <Kop>Wat er veranderd is</Kop>
      <div style={{ marginTop: 6 }}>
        {rijen.map((r) => (
          <div key={r.naam} className="labrij">
            <span className="naam" style={{ fontSize: '.86rem' }}>{r.naam}</span>
            <span className="mini">
              {dec(r.vanWaarde, r.decimalen)} → {dec(r.totWaarde, r.decimalen)} {r.eenheid}
              {' · '}
              <span className="tijd">{tijdspanne(r.dagen)}</span>
            </span>
            <span className="cijfer" style={{ fontSize: '.86rem' }}>
              {r.verschil > 0 ? '+' : ''}{dec(r.verschil, r.decimalen)}
            </span>
          </div>
        ))}
      </div>
      <p className="mini" style={{ marginTop: 10 }}>
        Van je eerste meting tot je laatste, per maat, met de tijd die ertussen zit. Hier staat
        alleen wat er verschoven is; wat dat betekent hoor je van je huisarts.
        {rijen.some((r) => r.vanDagen > 1 || r.totDagen > 1)
          && ' Bij de bloeddruk staat aan beide kanten het gemiddelde van de meetdagen in die week,'
             + ' en niet één losse meting.'}
      </p>
      <Uitleg id="verandering" label="waarom hier geen kleur bij staat">
        <p>
          Het gewicht komt uit de gladde lijn en niet van de weegschaal: het verschil tussen twee
          losse wegingen is voor een flink deel vocht. De middelomtrek erft de meetfout van het lint,
          die in de literatuur van 0,7 tot 15 cm loopt, dus twee centimeter verschil is ruis. En een
          bloedwaarde schommelt ook zonder dat er iets veranderd is.
        </p>
        <p>
          Een maat komt hier pas te staan als hij op twee verschillende dagen gemeten is. Eén meting
          is geen beloop, en twee op dezelfde dag zijn één meetmoment.
        </p>
        <p>
          De bloeddruk heeft daarbovenop een venster van een week aan elke kant, om dezelfde reden
          als de kaart hierboven: één meting is geen bloeddruk. De twee vensters delen nooit een
          dag, want anders zou bij een korte reeks dezelfde dag aan beide kanten meetellen en
          vergelijk je een getal met zichzelf. Ligt een dag precies tussen het begin en het eind in,
          dan telt hij nergens mee.
        </p>
      </Uitleg>
    </Kaart>
  )
}

function Eigenbloeddruk({ t }: { t: Thuisbloeddruk | null }) {
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
      {/* WAAROM EEN WEEK THUIS METEN BESTAAT
          Deze twee getallen komen uit het NHG-protocol bloeddruk meten zelf en
          zijn het sterkste argument voor deze kaart: bij een op de vijf mensen
          zegt de spreekkamer iets anders dan de week erbuiten, en dat geldt
          beide kanten op. */}
      <Uitleg id="thuisversusspreekkamer" label="waarom dit iets zegt wat de spreekkamer niet zegt">
        <p>
          Bij <b className="hoeveelheid">15 tot 20 procent</b> van de mensen is de bloeddruk alleen
          in de spreekkamer verhoogd, en bij <b className="hoeveelheid">10 tot 15 procent</b> juist
          alleen daarbuiten. Daarom staat in het protocol dat je bij een indicatie voor behandeling
          naast de spreekkamermeting ook een meting over langere tijd doet.
        </p>
        <p>
          In de spreekkamer geldt bovendien een andere grens dan thuis. Daar wordt een verhoogde
          bloeddruk vastgesteld op het gemiddelde van de geregistreerde bovendrukken over drie
          verschillende momenten, bij 140 mmHg of hoger. De richtlijn zet daar een thuismeting van
          135 mmHg naast, en een spreekkamermeting van 180 naast een thuismeting van 170. Wat jouw
          getal betekent zet deze app met opzet niet neer.
        </p>
        <p>
          En de week thuis is niet de eerste keus. Een 24-uursmeting heeft de voorkeur, omdat de
          bloeddruk over de nacht een sterkere voorspeller is dan die overdag, en daar zegt een
          thuismeting niets over. Wat de thuismeting wél heeft: hij is minder belastend, en hij
          vraagt van jou dat je een week lang twee keer per dag meet.
        </p>
        <p className="mini">
          Bronnen: NHG, Protocol bloeddruk meten, 2022, versie 1.1, voor de meting zelf. En de
          richtlijnmodule Bloeddrukmeting bij CVRM (NHG en NIV, 17 oktober 2018, geldigheid
          beoordeeld 1 juni 2021) voor de vergelijking tussen de meetmethodes, tabel 1. Wat daar
          niet in staat, en hier dus tweedehands blijft: de twee metingen per meetmoment, het
          vervallen van de eerste dag, en de 85 onderdruk.
        </p>
      </Uitleg>
    </Kaart>
  )
}

function MetingInvoer(
  { bewaar, a, sbd, dbd, middel, pols, lengteCm, alleMetingen, reeks }:
  {
    bewaar: KlinischEigenschappen['bewaarMeting']; a: Analyse
    sbd: Meting | null; dbd: Meting | null; middel: Meting | null
    pols: Rustpols<Meting> | null
    lengteCm: number | null
    /** Voor de reeks van de middelomtrek, die meer zegt dan de laatste waarde. */
    alleMetingen: Meting[]
    reeks: readonly Trendpunt[]
  },
) {
  const mlv = middelLengte(middel ? Number(middel.waarde) : null, lengteCm)
  const beloop = middelbeloop(alleMetingen, reeks)
  const [velden, zetVelden] = useState<Record<string, string>>({})
  const [datum, zetDatum] = useState<string>(vandaag())

  const getal = (code: string): number => parseFloat((velden[code] ?? '').replace(',', '.'))
  const ingevuld = METINGSOORTEN.filter(([c]) => Number.isFinite(getal(c)))
  /* Een bloeddruk is twee getallen die bij elkaar horen. Eén ervan bewaren mag,
     maar dan valt die dag buiten het weekgemiddelde, en dat hoort de app te
     zeggen in plaats van het stil te laten gebeuren. */
  const halveBloeddruk = Number.isFinite(getal('bloeddruk_sys'))
    !== Number.isFinite(getal('bloeddruk_dia'))

  function opslaan() {
    for (const [code, , eenheid] of ingevuld) {
      bewaar({ datum: datum as IsoDatum, soort: code, waarde: getal(code), eenheid })
    }
    zetVelden({})
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
      {/* DE REEKS, EN WAAROM ER GEEN LIJNTJE BIJ STAAT
          Een sparkline zet zijn punten even ver uit elkaar, en
          middelomtrekmetingen liggen dat nooit: twee in mei en één in
          september zouden er uitzien als een gelijkmatig verloop. Bij een
          handvol metingen is de datum erbij zetten eerlijker dan een lijn die
          de tijd ertussen platslaat. */}
      {beloop && (
        <div style={{ marginTop: 10 }}>
          <div className="mini">Je metingen</div>
          {beloop.punten.map((punt, i) => {
            const vorige = beloop.punten[i - 1]
            const stap = vorige ? Math.round((punt.cm - vorige.cm) * 10) / 10 : null
            return (
              <div key={punt.datum} className="labrij">
                <span className="naam mini">{kortNL(punt.datum as IsoDatum)}</span>
                <span className="cijfer" style={{ fontSize: '.86rem' }}>{dec(punt.cm, 0)} cm</span>
                <span className="mini" style={{ minWidth: 48, textAlign: 'right' }}>
                  {stap == null ? '' : stap === 0 ? 'gelijk' : (stap > 0 ? '+' : '') + dec(stap, 0)}
                </span>
              </div>
            )
          })}
          <p className="mini" style={{ marginTop: 8 }}>
            {beloop.binnenRuis
              ? `Van ${dec(beloop.eerste.cm, 0)} naar ${dec(beloop.laatste.cm, 0)} cm. Dat verschil `
                + 'valt binnen de meetfout van het lint, dus er is nog niets uit af te lezen.'
              : `Van ${dec(beloop.eerste.cm, 0)} naar ${dec(beloop.laatste.cm, 0)} cm, `
                + `${dec(Math.abs(beloop.verschilCm), 0)} cm `
                + `${beloop.verschilCm < 0 ? 'eraf' : 'erbij'}.`}
            {beloop.gewichtVan != null && beloop.gewichtTot != null && (
              ` In dezelfde periode ging je gewichtstrend van ${dec(beloop.gewichtVan, 1)} naar `
              + `${dec(beloop.gewichtTot, 1)} kg. Die twee naast elkaar zeggen meer dan allebei `
              + 'apart: gaat de omtrek mee omlaag met het gewicht, of niet.')}
          </p>
        </div>
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
      {/* De meetinstructie voor de bloeddruk hoort bij het invoerveld en niet in
          een boekje: wie hier een getal intikt, bepaalt op dat moment hoe goed
          het getal is. Alles hieronder staat letterlijk in het protocol. */}
      <Uitleg id="bloeddrukmeten" label="hoe je een bloeddruk meet die iets waard is">
        <p>
          Vijf minuten rustig zitten voordat je meet, in een rustige omgeving, en niet praten
          tijdens de meting. Voeten naast elkaar op de grond, benen niet over elkaar, geen vuist
          maken. De onderarm ontspannen op tafel, de manchet ter hoogte van het midden van je
          borstbeen.
        </p>
        <p>
          Meet twee keer, met een of twee minuten ertussen, en laat de manchet daartussen helemaal
          leeg lopen. Noteer het gemiddelde van de laatste twee metingen: één losse meting is geen
          bloeddruk. Verschillen die twee meer dan 10 mmHg boven of 5 mmHg onder, meet dan door tot
          twee opeenvolgende metingen dichter bij elkaar liggen.
        </p>
        <p>
          Voel bij het meten ook even je pols. Een onregelmatige hartslag kan op boezemfibrilleren
          wijzen, en automatische bloeddrukmeters zijn daar niet voor goedgekeurd: de waarde die er
          dan uitkomt is onbetrouwbaar. Voelt het onregelmatig, meld het dan bij je huisarts in
          plaats van het getal te geloven.
        </p>
        <p className="mini">
          Bronnen: NHG, Protocol bloeddruk meten, 2022, versie 1.1. Het voelen van de pols en de
          beperking van automatische meters bij boezemfibrilleren staan in de richtlijnmodule
          Bloeddrukmeting bij CVRM (NHG en NIV, 2018, beoordeeld 2021).
        </p>
      </Uitleg>
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
      <Tussen style={{ marginTop: 14 }}>
        <Kop>Zelf meten</Kop>
        <label className="veld" style={{ flex: '0 0 auto' }}>
          <input type="date" value={datum} max={vandaag()}
                 aria-label="datum van de meting"
                 onChange={(e) => zetDatum(e.target.value || vandaag())} />
        </label>
      </Tussen>
      <div className="meetvelden">
        {METINGSOORTEN.map(([code, label, eenheid, stap]) => (
          <label className="veld" key={code}>
            <span>{label} <span className="mini">{eenheid}</span></span>
            <input type="number" step={stap} inputMode="decimal"
                   value={velden[code] ?? ''}
                   onChange={(e) => zetVelden((v) => ({ ...v, [code]: e.target.value }))} />
          </label>
        ))}
      </div>
      {halveBloeddruk && (
        <p className="mini" style={{ marginTop: 8 }}>
          Bij een bloeddruk horen twee getallen. Met maar één van de twee telt deze dag niet mee in
          je weekgemiddelde hieronder.
        </p>
      )}
      <Rij style={{ marginTop: 12 }}>
        <Knop vol uit={ingevuld.length === 0} opKlik={opslaan}>
          {ingevuld.length > 1 ? `${ingevuld.length} metingen opslaan` : 'Opslaan'}
        </Knop>
        {datum !== vandaag() && (
          <span className="mini">op {kortNL(datum as IsoDatum)}</span>
        )}
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

/** Wat de app zelf al weet, per vraag, in gewone taal onder het vinkje. */
const UIT_GEGEVENS_LABEL: Partial<Record<StopbangSleutel, string>> = {
  man: 'uit je profiel',
  leeftijd: 'uit je geboortedatum',
  bmi: 'uit je lengte en je laatste weging',
  nek: 'uit je laatste nekomtrek',
}

function StopbangKaart(
  { vragenlijsten, bewaar, uitGegevens }:
  {
    vragenlijsten: Vragenlijst[]; bewaar: KlinischEigenschappen['bewaarStopbang']
    /** De vier vragen die niemand hoeft te schatten. Zie `stopbangUitGegevens`. */
    uitGegevens: StopbangAntwoorden
  },
) {
  const laatste = nieuwste(vragenlijsten, (x) => x.soort === 'stopbang')
  /* DE EERSTE KEER VULT DE APP IN WAT HIJ WEET, DAARNA NOOIT MEER
     Wie de lijst al eens bewaard heeft, heeft antwoorden gegeven; die
     overschrijven met een berekening zou zijn oordeel weggooien. Vandaar alleen
     bij een lege lijst, en altijd met de herkomst erbij zodat zichtbaar is wat
     er niet door jou is aangetikt. */
  const [antwoorden, zetAntwoorden] = useState<StopbangAntwoorden>(
    () => (laatste?.antwoorden ?? uitGegevens) as StopbangAntwoorden)
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
            <span style={{ fontSize: '.85rem', lineHeight: 1.35 }}>
              {l}
              {k in uitGegevens && (
                <span className="mini" style={{ display: 'block', marginTop: 2 }}>
                  {UIT_GEGEVENS_LABEL[k as StopbangSleutel]}:{' '}
                  {uitGegevens[k as StopbangSleutel] ? 'ja' : 'nee'}
                  {/* Wie het vinkje anders zet dan de gegevens zeggen, heeft
                      daar meestal een reden voor. Het scherm spreekt dat niet
                      tegen, het zegt alleen dat de twee uit elkaar lopen. */}
                  {!!antwoorden[k as StopbangSleutel] !== uitGegevens[k as StopbangSleutel]
                    && (antwoorden[k as StopbangSleutel]
                      ? ', jij zegt van wel'
                      : ', jij zegt van niet')}
                </span>
              )}
            </span>
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
