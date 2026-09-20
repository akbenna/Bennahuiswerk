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
 *
 * WAAR DIE MINUTEN VANDAAN KOMEN
 *
 * Drie wegen, en het veld heet in alle drie `fiets_min` — die naam is ouder dan
 * wat erin zit. Wat er staat zijn minuten matige inspanning, welk apparaat ze
 * ook opleverde: de koppeling, het vakje op dit scherm, en sinds de work-outlijst
 * ook het importvenster. Dat laatste is voor wie geen koppeling laat draaien de
 * enige weg, en het is meteen de enige die een mens per post laat kiezen — een
 * horloge schrijft een hele dag weg als één activiteit van veertien uur, en zoiets
 * haalt het weekdoel in één klap vijf keer.
 */
import { useState } from 'react'
import { Balk, Kaart, Keuzechip, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Bolletjes, Doelring, Schermkop } from '../hero'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { Inspanning, IsoDatum, Meting, Regel, Training, Vragenlijst } from '@/gedeeld/db/tabellen'
import type { Analyse, Dagenkaart } from '../rekenkern'
import { WegFiets, WegKracht, WegWeken } from '../tekens'
import { SFEERFOTO } from '../sfeerfotos'
import {
  OUD_VELD, SOORTEN, WEEKDOEL_MIN, dagvenster, naamVan, soortVan,
  standaardIntensiteit, verdeling, weekposten, weektotaal, zwareMinuten,
} from '../inspanning'
import type { Intensiteit, Post } from '../inspanning'
import {
  SARCF_VRAGEN, SPIER_VOORBEHOUD, STOELTEST_GRENS_S, maaltijdverdeling,
  hoofdmaaltijden, sarcfscore, sarcfsignaal, spierbeeld, stoeltestTraag,
} from '../spier'
import type { Sarcfantwoorden, Sarcfpunt } from '../spier'

const SPIERGROEPEN = ['benen', 'rug', 'borst', 'schouders', 'armen', 'romp'] as const

export function Beweging(
  { a, dagen, training, inspanning, metingen, vragenlijsten, regelsVandaag, datum,
    bewaarTraining, bewaarInspanning, wisInspanning, bewaarMeting, bewaarVragenlijst,
    zetDagveld }:
  {
    a: Analyse; dagen: Dagenkaart; training: Training[]; inspanning: Inspanning[]
    metingen: Meting[]; vragenlijsten: Vragenlijst[]; regelsVandaag: Regel[]
    datum: IsoDatum
    bewaarMeting: (m: {
      datum: IsoDatum; soort: string; waarde: number; eenheid: string
    }) => void
    bewaarVragenlijst: (v: {
      datum: IsoDatum; soort: string; antwoorden: Record<string, unknown>
      score: number; klasse: string
    }) => void
    zetDagveld: (veld: string, waarde: string | number | boolean | null) => void
    bewaarInspanning: (r: {
      datum: IsoDatum; soort: string; eigennaam: string | null
      minuten: number; intensiteit: Intensiteit; geschat: boolean
    }) => void
    wisInspanning: (id: string) => void
    bewaarTraining: (t: {
      datum: IsoDatum; oefening: string; spiergroep: string
      sets: number | null; reps: number | null; gewicht_kg: number | null
    }) => void
  },
) {
  /* Een kalendervenster en niet de sleutels van de dagenkaart. Die kaart kent
     alleen dagen waarvoor een meting of een maaltijd bestaat, en een
     work-outafdruk importeren maakt zo'n rij niet — je rit stond dan wél in de
     database en nergens op het scherm. En de zeven laatste sleutels zijn niet
     de zeven laatste dagen: bij een gat reikte "deze week" stilletjes verder
     terug. Zie `dagvenster` in `inspanning.ts`. */
  const sleutels = dagvenster(vandaag(), 21)
  const laatste7 = sleutels.slice(-7)
    .map((x) => dagen[x]?.stappen).filter((v): v is number => v != null)
  const gem7 = laatste7.length
    ? Math.round(laatste7.reduce((s, b) => s + b, 0) / laatste7.length) : null

  /* DE WEEK IN MATIGE MINUTEN
     Opgeteld en niet gemiddeld: de WHO-richtlijn staat per week, en drie keer
     vijftig minuten is hetzelfde als zeven keer eenentwintig. Zware minuten
     tellen onderweg dubbel — zie `inspanning.ts` voor waar die wisselkoers
     vandaan komt en waarom de intensiteit een aanname is die zichzelf noemt. */
  const alleposten = weekposten(
    sleutels,
    inspanning.map((r): Post => ({
      datum: r.datum, soort: r.soort, eigennaam: r.eigennaam,
      minuten: r.minuten, intensiteit: r.intensiteit, bron: r.bron,
    })),
    Object.fromEntries(sleutels.map((d) => [d, dagen[d]?.fiets_min])),
  )
  const week = new Set(sleutels.slice(-7))
  const posten = alleposten.filter((p) => week.has(p.datum))
  const minuten7 = weektotaal(posten)
  const zwaar7 = zwareMinuten(posten)
  const verdeeld = verdeling(posten)
  const inspanningOoit = alleposten.length > 0
  const perDatum: Record<string, number> = {}
  for (const p of alleposten) perDatum[p.datum] = (perDatum[p.datum] ?? 0) + Math.round(p.minuten)
  /* De posten van de getoonde dag, om ze te kunnen nakijken en weghalen. Het
     oude dagveld staat er apart bij: dat is geen rij en heeft geen id. */
  const vandaagRijen = inspanning.filter((r) => r.datum === datum)
  const fietsVandaag = dagen[datum]?.fiets_min ?? null

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
  /* ACTIEVE ENERGIE TELT NERGENS MEE, MAAR WAS OOK NERGENS TE ZIEN
     Zie de kop van dit bestand voor het eerste: het verbruik komt uit de
     gewichtstrend, en wat het horloge schat zou daar dubbel op tellen. Dat
     besluit staat.

     Het tweede was geen besluit maar een gat. `actieve_energie_kcal` kwam via de
     koppeling én via de import netjes binnen, werd opgeslagen, en daarna door
     geen enkel scherm gelezen — nagelopen op elke plek waar het veld voorkomt.
     Wie zijn Apple-gegevens importeerde vulde dus een kolom die niemand ooit
     zag, en kreeg geen enkel teken dat het gelukt was.

     Hier staat hij nu, als losse aflezing en met één regel erbij die zegt dat
     hij niet meetelt. Dat is iets anders dan wegstoppen: het getal is van jou,
     het klopt zover je horloge klopt, en het hoort niet stilzwijgend te
     verdwijnen omdat het model er niets mee doet. */
  const metEnergie = sleutels.slice(-7)
    .map((x) => dagen[x]?.actieve_energie_kcal)
    .filter((v): v is number => v != null && v > 0)
  const energie7 = metEnergie.length
    ? Math.round(metEnergie.reduce((a, b) => a + b, 0) / metEnergie.length)
    : null
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
  const haaltStappen = gem7 != null && gem7 >= STAPDOEL
  const haaltMinuten = minuten7 >= WEEKDOEL_MIN
  /* Eén van de twee is genoeg. Wie zwemt hoeft niet óók te lopen, en andersom;
     het gaat om de belasting, niet om de manier. En dubbel telt het niet: een
     wandeling levert stappen én minuten, maar de twee zijn alternatieven en
     geen som. */
  const haaltBeweging = haaltStappen || haaltMinuten
  const haaltKracht = sessies >= KRACHTDOEL

  return (
    <>
      <Schermkop
        foto={SFEERFOTO.beweging}
        toon={haaltBeweging && haaltKracht ? 'goed'
          : gem7 == null && minuten7 === 0 ? 'rust' : 'let'}
        bovenschrift="Deze week"
        titel={haaltBeweging && haaltKracht ? 'Allebei gehaald'
          : haaltBeweging ? 'Beweging staat, kracht nog niet'
          : haaltKracht ? 'Kracht staat, beweging nog niet'
          : gem7 == null && minuten7 === 0 ? 'Nog niets ingevuld' : 'Nog niet op dreef'}
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
              {gem7 == null && minuten7 === 0
                ? 'Vul een paar dagen stappen in bij Vandaag, of zet hieronder neer wat je gedaan hebt.'
                : haaltStappen
                  ? `Gemiddeld over zeven dagen, boven de ${dz(STAPDOEL)} waar de winst zit.`
                  : haaltMinuten
                    ? `Onder de ${dz(STAPDOEL)} stappen, maar de ${dz(minuten7)} minuten inspanning `
                      + 'halen het weekdoel al.'
                    : gem7 == null
                      ? `Nog ${dz(WEEKDOEL_MIN - minuten7)} minuten inspanning tot ${WEEKDOEL_MIN} deze week.`
                      : `Gemiddeld over zeven dagen. Nog ${dz(STAPDOEL - gem7)} per dag tot `
                        + `${dz(STAPDOEL)}${minuten7 > 0
                          ? `, of nog ${dz(WEEKDOEL_MIN - minuten7)} minuten inspanning tot ${WEEKDOEL_MIN}`
                          : ''}.`}
            </p>
            {energie7 != null && (
              /* Losse aflezing, en met opzet niet in de ring. De ring gaat over
                 een doel dat je kunt halen; dit getal is een waarneming van je
                 horloge waar dit model niets mee doet. Ze in één beeld zetten
                 zou suggereren dat ze bij elkaar horen. */
              <p className="mini" style={{ marginTop: 10 }}>
                <b>{dz(energie7)} kcal</b> actieve energie per dag, uit Gezondheid. Die telt hier
                nergens in mee — het verbruik komt uit je gewichtstrend, en daar zit deze beweging
                al in verwerkt.
              </p>
            )}
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
          <Kop teken={WegFiets}>Inspanning</Kop>
          {haaltMinuten && <span className="vlaggetje goed">✓ weekdoel</span>}
        </Tussen>
        <div style={{ marginTop: 8 }}>
          <Tussen>
            <span className="mini">Deze week</span>
            <span className="cijfer mini">{dz(minuten7)} van {WEEKDOEL_MIN} min</span>
          </Tussen>
          <Balk deel={(minuten7 / WEEKDOEL_MIN) * 100} toon={haaltMinuten ? 'goed' : undefined} />
        </div>
        {/* WAT JE GEDAAN HEBT, EN WAT HET TELT
            Twee verschillende getallen, en daarom twee verschillende regels.
            De verdeling staat in échte minuten: wie veertig minuten rende ziet
            daar veertig. De balk erboven staat in matige minuten en telt er
            tachtig. Zouden ze allebei hetzelfde rekenen, dan loog een van de
            twee — de balk over de norm, of de lijst over je dag. */}
        {verdeeld.length > 0 && (
          <p className="mini" style={{ marginTop: 6 }}>
            {verdeeld.map((v) => `${v.naam} ${dz(v.minuten)}′`).join(' · ')}
            {zwaar7 > 0 && ` — waarvan ${dz(zwaar7)} zwaar, en die tellen dubbel.`}
          </p>
        )}

        <InspanningInvoer datum={datum} bewaar={bewaarInspanning} />

        {(vandaagRijen.length > 0 || (fietsVandaag ?? 0) > 0) && (
          <div className="lijst" style={{ marginTop: 8 }}>
            {vandaagRijen.map((r) => (
              <div key={r.id}>
                <span className="klein groei knip">
                  {naamVan(r.soort, r.eigennaam)}
                  {/* De intensiteit staat erbij én waar hij vandaan komt.
                      Een aanname die zichzelf niet noemt is in dit ontwerp een
                      fout — rennen is niet altijd zwaar en wandelen niet altijd
                      matig, en wat een horloge daarover weet komt hier niet
                      langs. */}
                  <span className="mini" style={{ marginLeft: 6, color: 'var(--dim)' }}>
                    {r.intensiteit}{r.geschat ? ' (aangenomen)' : ''}
                    {r.bron !== 'app' && ` · ${r.bron}`}
                  </span>
                </span>
                <span className="cijfer mini">{dz(r.minuten)}′</span>
                <button type="button" className="ster" aria-label={`${naamVan(r.soort, r.eigennaam)} weghalen`}
                        onClick={() => wisInspanning(r.id)}>×</button>
              </div>
            ))}
            {/* HET OUDE VELD, EN WAAROM HET BEWERKBAAR BLIJFT
                `kal_dagen.fiets_min` is geen rij en heeft geen id: hij staat op
                de dag zelf en is de enige weg waarlangs de koppeling op je
                telefoon binnenkomt. Die afspraak breken zou betekenen dat de
                opdracht op het toestel opnieuw moet. Dus telt hij mee als één
                matige fietsrit, en blijft hij hier te verbeteren — wissen doe je
                door er nul in te zetten. */}
            {(fietsVandaag ?? 0) > 0 && (
              <div>
                <span className="klein groei knip">
                  Fietsen
                  <span className="mini" style={{ marginLeft: 6, color: 'var(--dim)' }}>
                    matig (aangenomen) · {OUD_VELD}
                  </span>
                </span>
                <input className="smal" type="number" inputMode="numeric" min="0" step="5"
                       key={'fm' + datum} defaultValue={fietsVandaag ?? ''}
                       aria-label="Fietsminuten vandaag"
                       style={{ width: 66 }}
                       onBlur={(e) => zetDagveld('fiets_min', e.target.value || null)} />
              </div>
            )}
          </div>
        )}

        <Uitleg id="inspanning" label="waarom zwaar dubbel telt, en waarom er geen calorieën bij staan">
          <p>
            De WHO-richtlijn van 2020 noemt twee bedragen en geen één: 150 tot 300 minuten matige
            inspanning per week, óf 75 tot 150 zware, óf een combinatie waarin een minuut zware
            voor twee matige telt. Die wisselkoers staat in de richtlijn zelf. Veertig minuten
            hardlopen is dus niet hetzelfde als veertig minuten wandelen.
          </p>
          <p>
            Hoe zwaar iets is, wordt hier afgeleid uit de soort, en dat is een aanname. Rennen is
            niet altijd zwaar en wandelen niet altijd matig: dat hangt af van tempo, helling en van
            wie het doet. Daarom staat er "aangenomen" bij, en staat de schakelaar ernaast voor wie
            het beter weet.
          </p>
          <p>
            Krachttraining telt hier niet mee. Die staat in de richtlijn apart — twee keer per week
            spierversterkend, naast deze minuten — en heeft hieronder zijn eigen bolletjes. Zou hij
            hier ook meetellen, dan haalde één zware sessie de halve week.
          </p>
          <p>
            Calorieën worden er met opzet niet van gemaakt. Een schatting uit hartslag of uit een
            tabel per activiteit heeft een fout van twintig tot vijftig procent, en die fout zit niet
            consistent in één richting — corrigeren kan dus niet. Voor jou zou het om honderden
            kcal per keer gaan: genoeg om het hele tekort weg te rekenen op een getal dat geraden is.
          </p>
          <p>
            En het hóéft ook niet: je verbruik wordt gemeten uit de gewichtstrend, en wat je hiermee
            verbrandt zit daar al in. Wat dit scherm doet is bijhouden dát je bewoog, en dat is
            precies waarvoor de richtlijn geschreven is.
          </p>
        </Uitleg>
      </Kaart>

      <TrainingInvoer datum={datum} bewaar={bewaarTraining} perSpier={perSpier} />

      <Spierkaart a={a} metingen={metingen} vragenlijsten={vragenlijsten}
                  regelsVandaag={regelsVandaag} sessies={sessies} krachtdoel={KRACHTDOEL}
                  bewaarMeting={bewaarMeting} bewaarVragenlijst={bewaarVragenlijst} />

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
                {/* De minutenkolom staat er alleen als er die drie weken ooit
                    iets in stond. Anders is het een kolom streepjes.

                    Échte minuten, net als in de verdeling hierboven — niet wat
                    ze voor de norm waard zijn. Een dag met veertig minuten
                    hardlopen hoort hier veertig te tonen; tachtig zou over die
                    dag liegen. */}
                {inspanningOoit && (
                  <span className="cijfer mini" style={{ width: 44, textAlign: 'right' }}>
                    {perDatum[x] ? dz(perDatum[x]!) + '′' : '—'}
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

/**
 * SPIERBEHOUD — de drie hefbomen, en wat ervan bekend is
 *
 * Een weegschaal telt kilo's en zegt niet waar ze vandaan komen. Bij snel
 * gewichtsverlies is dat verschil groot: in de substudie van STEP-1 was
 * ongeveer 45 procent van wat er op semaglutide verdween vetvrije massa.
 *
 * Deze kaart meet dat niet — dat kan geen app. Wat ze doet is de drie dingen
 * naast elkaar zetten waarvan bekend is dat ze het tegengaan, met per stuk wat
 * er staat en wat er ontbreekt. Waarom er geen samengesteld cijfer uit komt,
 * staat in `spier.ts`.
 *
 * DE KAART STAAT ER ALTIJD, OOK LEEG
 *
 * Drie regels op "onbekend" is informatie: het zegt dat er drie dingen zijn
 * waar je iets aan kunt doen en dat er van geen enkele iets bekend is. Zou de
 * kaart pas verschijnen als er gemeten is, dan weet wie niets meet ook niet
 * dat er iets te meten valt.
 */
function Spierkaart(
  { a, metingen, vragenlijsten, regelsVandaag, sessies, krachtdoel,
    bewaarMeting, bewaarVragenlijst }:
  {
    a: Analyse; metingen: Meting[]; vragenlijsten: Vragenlijst[]
    regelsVandaag: Regel[]; sessies: number; krachtdoel: number
    bewaarMeting: (m: {
      datum: IsoDatum; soort: string; waarde: number; eenheid: string
    }) => void
    bewaarVragenlijst: (v: {
      datum: IsoDatum; soort: string; antwoorden: Record<string, unknown>
      score: number; klasse: string
    }) => void
  },
) {
  const [open, zetOpen] = useState<'geen' | 'stoel' | 'vragen'>('geen')

  /* Eiwit per hoofdmaaltijd van vandaag. Tussendoor en "onbekend" tellen niet
     mee: de drempel gaat over een maaltijd en niet over een handje noten. */
  const perMoment: Record<string, number> = {}
  for (const r of regelsVandaag) {
    const m = r.moment ?? 'onbekend'
    perMoment[m] = (perMoment[m] ?? 0) + (Number(r.eiwit_g) || 0)
  }
  const gelogd = hoofdmaaltijden(perMoment)

  const stoel = metingen.filter((m) => m.soort === 'stoeltest')
    .sort((x, y) => y.datum.localeCompare(x.datum))[0]
  const laatsteSarcf = vragenlijsten.filter((v) => v.soort === 'sarcf')
    .sort((x, y) => y.datum.localeCompare(x.datum))[0]

  const regels = spierbeeld({
    ...(gelogd.length ? { eiwitPerMaaltijd: gelogd } : {}),
    krachtsessies: sessies,
    krachtdoel,
    ...(stoel ? {
      stoeltestSeconden: Number(stoel.waarde),
      stoeltestDagenGeleden:
        Math.round((Date.parse(vandaag()) - Date.parse(stoel.datum)) / 86400000),
    } : {}),
    ...(laatsteSarcf ? { sarcf: laatsteSarcf.antwoorden as unknown as Sarcfantwoorden } : {}),
  })

  /* HET DAGDOEL GEDEELD DOOR DRIE IS NIET DE DREMPEL
     Het scherm Voeding zet een stippellijn op een derde van je dagdoel. Dat is
     een goede maat voor "haal ik mijn dag" en geen maat voor "komt de aanmaak
     op gang". Bij een laag dagdoel ligt die stippellijn ónder de drempel, en
     dan zegt Voeding "op peil" terwijl er weinig gebeurt. Dat hoort hier te
     staan, want hier gaat het over spier. */
  const verd = maaltijdverdeling(a.eiwitDoel)

  return (
    <Kaart>
      <Tussen>
        <Kop teken={WegKracht}>Wat je spieren vasthoudt</Kop>
      </Tussen>
      <p className="mini" style={{ marginTop: 4 }}>
        Bij snel afvallen verdwijnt er naast vet ook spier. Dit zijn de drie dingen waarvan
        bekend is dat ze dat tegengaan.
      </p>

      <div className="lijst" style={{ marginTop: 8 }}>
        {/* De toelichting op een eigen regel en niet achter de naam. Hij stond
            eerst op dezelfde regel met `knip` eromheen, en werd dan afgekapt —
            precies het deel dat zegt wat je eraan kunt doen. */}
        {regels.map((r) => (
          <div key={r.wat} style={{ flexWrap: 'wrap' }}>
            <span className="klein groei">{r.wat}</span>
            <span className="cijfer mini"
                  style={r.stand === 'let' ? { color: 'var(--let)' } : undefined}>
              {r.waarde || '—'}
            </span>
            <span className="mini" style={{ flexBasis: '100%', color: 'var(--dim)' }}>
              {r.toelichting}
            </span>
          </div>
        ))}
      </div>

      {!verd.drieHaaltDrempel && (
        <Kaart toon="let" plat style={{ marginTop: 10 }}>
          <p className="klein">
            Je eiwitdoel gedeeld door drie is <b>{verd.gedeeld} g</b> — onder de {verd.drempel} g
            waarop de spieraanmaak op gang komt. Dat is geen reden om je doel te verhogen, maar
            wel om het anders te verdelen: <b>{verd.maaltijdenDieHalen} grotere maaltijden</b>
            {' '}halen de drempel wel.
          </p>
        </Kaart>
      )}

      <Rij style={{ marginTop: 10 }}>
        <Knop opKlik={() => zetOpen(open === 'stoel' ? 'geen' : 'stoel')}>
          Stoeltest doen
        </Knop>
        <Knop opKlik={() => zetOpen(open === 'vragen' ? 'geen' : 'vragen')}>
          {laatsteSarcf ? 'Vragenlijst opnieuw' : 'Vijf vragen'}
        </Knop>
      </Rij>

      {open === 'stoel' && <Stoeltest bewaar={(s) => {
        bewaarMeting({ datum: vandaag(), soort: 'stoeltest', waarde: s, eenheid: 's' })
        zetOpen('geen')
      }} />}
      {open === 'vragen' && <Sarcfvragen bewaar={(antw) => {
        bewaarVragenlijst({
          datum: vandaag(), soort: 'sarcf', antwoorden: { ...antw },
          score: sarcfscore(antw), klasse: sarcfsignaal(antw) ? 'signaal' : 'geen',
        })
        zetOpen('geen')
      }} />}

      <Uitleg id="spier" label="hoe zeker dit is, en waarom er geen score uit komt">
        <p>{SPIER_VOORBEHOUD}</p>
        <p>
          Er komt met opzet geen samengesteld spiergetal uit deze drie. Elk van de drie meet iets
          anders met een eigen onzekerheid; ze optellen tot één cijfer zou een nauwkeurigheid
          suggereren die geen van de drie heeft.
        </p>
        <p>
          De stoeltest is de zwakkere van de twee krachtmaten die de Europese consensus noemt —
          handknijpkracht presteert beter, maar die vraagt een dynamometer. Een maat die niemand
          thuis kan doen, meet niets. Boven de {STOELTEST_GRENS_S} seconden, of niet kunnen opstaan
          zonder je armen, geldt als aanwijzing voor verminderde spierkracht. Dat is een reden om
          het te bespreken, geen diagnose.
        </p>
      </Uitleg>
    </Kaart>
  )
}

/**
 * VIJF KEER OPSTAAN, MET DE KLOK VAN JE TELEFOON
 *
 * De app telt zelf, want een stopwatch bedienen terwijl je opstaat gaat niet.
 * Starten, vijf keer opstaan en gaan zitten, stoppen.
 */
function Stoeltest({ bewaar }: { bewaar: (seconden: number) => void }) {
  const [gestart, zetGestart] = useState<number | null>(null)
  const [uitslag, zetUitslag] = useState<number | null>(null)

  return (
    <Kaart plat style={{ marginTop: 8 }}>
      <p className="klein">
        Ga op een stevige stoel zitten met je armen over elkaar. Sta vijf keer zo snel als je
        kunt helemaal op en ga weer zitten — zonder je armen te gebruiken. Lukt dat niet zonder
        armen, stop dan: dat is op zichzelf al het antwoord.
      </p>
      <Rij style={{ marginTop: 8, alignItems: 'center' }}>
        {/* `performance.now()` en niet `Date.now()`: die eerste loopt monotoon
            door en is niet te verzetten. Een klok die tijdens de test verspringt
            — zomertijd, een synchronisatie, of een armatuur die hem vastzet —
            mag de uitslag niet veranderen. */}
        {gestart == null ? (
          <Knop vol opKlik={() => { zetUitslag(null); zetGestart(performance.now()) }}>
            Starten
          </Knop>
        ) : (
          <Knop vol opKlik={() => {
            const s = Math.round((performance.now() - gestart) / 100) / 10
            zetGestart(null); zetUitslag(s)
          }}>Klaar</Knop>
        )}
        {gestart != null && <span className="klein">de klok loopt</span>}
        {uitslag != null && (
          <>
            <span className="cijfer">{dec(uitslag, 1)} s</span>
            {/* Onder de ondergrens is er niets te bewaren. Dat is geen foutmelding
                maar een knop die er niet staat — zie `STOELTEST_MIN_S`. */}
            {stoeltestTraag(uitslag) != null
              ? <Knop opKlik={() => bewaar(uitslag)}>Bewaren</Knop>
              : <span className="klein">te kort om een meting te zijn — doe hem opnieuw</span>}
          </>
        )}
      </Rij>
    </Kaart>
  )
}

/**
 * SARC-F — vijf vragen, en de lage afkapwaarde
 *
 * Waarom deze lijst signaleert op één punt in plaats van op vier staat in
 * `spier.ts`. Kort: bij vier is hij goed in uitsluiten en slecht in opsporen,
 * en een screener in een app hoort de andere kant op te falen.
 */
function Sarcfvragen({ bewaar }: { bewaar: (a: Sarcfantwoorden) => void }) {
  const [antw, zetAntw] = useState<Sarcfantwoorden>({
    kracht: 0, lopen: 0, opstaan: 0, traplopen: 0, vallen: 0,
  })

  return (
    <Kaart plat style={{ marginTop: 8 }}>
      {/* Elke vraag is een eigen groep met de vraag als naam. Zonder dat staan
          er vijf identieke rijen "geen · enige · veel" onder elkaar, en hoort
          een schermlezer vijf keer hetzelfde zonder te weten waarbij. */}
      {SARCF_VRAGEN.map((v) => (
        <div key={v.sleutel} style={{ marginTop: 8 }} role="group" aria-label={v.vraag}>
          <div className="klein">{v.vraag}</div>
          <Rij style={{ marginTop: 4, flexWrap: 'wrap' }}>
            {v.schaal.map((label, punt) => (
              <Keuzechip key={label} aan={antw[v.sleutel] === punt}
                         opKlik={() => zetAntw({ ...antw, [v.sleutel]: punt as Sarcfpunt })}>
                {label}
              </Keuzechip>
            ))}
          </Rij>
        </div>
      ))}
      <Rij style={{ marginTop: 10 }}>
        <Knop vol opKlik={() => bewaar(antw)}>Bewaren</Knop>
        <span className="klein"><b>{sarcfscore(antw)} van de 10</b></span>
      </Rij>
    </Kaart>
  )
}

/**
 * WAT JE GEDAAN HEBT, IN DRIE TIKKEN
 *
 * Soort, duur, klaar. De intensiteit komt uit de soort en staat er als
 * schakelaar naast — niet als verplichte keuze, want dan moet je bij elke
 * wandeling iets beslissen waar je meestal niets over te zeggen hebt.
 *
 * Zodra je hem omzet gaat `geschat` op false, en dat blijft bij de rij staan.
 * Zo is achteraf te zien welke minuten op een aanname rusten en welke op een
 * oordeel — het verschil verdwijnt anders in de optelling.
 */
function InspanningInvoer(
  { datum, bewaar }:
  {
    datum: IsoDatum
    bewaar: (r: {
      datum: IsoDatum; soort: string; eigennaam: string | null
      minuten: number; intensiteit: Intensiteit; geschat: boolean
    }) => void
  },
) {
  const [soort, zetSoort] = useState(SOORTEN[0]!.sleutel)
  const [eigennaam, zetEigennaam] = useState('')
  const [minuten, zetMinuten] = useState('')
  /* null = nog niet aangeraakt, dus de aanname uit de soort. Een boolean zou
     dat verschil niet kunnen dragen: "matig" omdat je het koos en "matig"
     omdat het de standaard is zijn niet hetzelfde. */
  const [gekozen, zetGekozen] = useState<Intensiteit | null>(null)

  const aanname = standaardIntensiteit(soort)
  const intensiteit = gekozen ?? aanname
  const min = parseInt(minuten, 10)
  const mag = Number.isFinite(min) && min > 0

  function opslaan() {
    if (!mag) return
    bewaar({
      datum, soort,
      eigennaam: soort === 'anders' ? (eigennaam.trim() || null) : null,
      minuten: min, intensiteit, geschat: gekozen == null,
    })
    zetMinuten(''); zetEigennaam(''); zetGekozen(null)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div className="mini">Wat heb je gedaan?</div>
      <Rij style={{ marginTop: 6, flexWrap: 'wrap' }}>
        {SOORTEN.map((s) => (
          <Keuzechip key={s.sleutel} aan={soort === s.sleutel} titel={s.waarom}
                     opKlik={() => { zetSoort(s.sleutel); zetGekozen(null) }}>
            {s.naam}
          </Keuzechip>
        ))}
      </Rij>
      {soort === 'anders' && (
        <Rij style={{ marginTop: 8 }}>
          <input placeholder="wat was het?" value={eigennaam} aria-label="Naam van de activiteit"
                 onChange={(e) => zetEigennaam(e.target.value)}
                 style={{ flex: '1 1 140px', width: 'auto' }} />
        </Rij>
      )}
      <Rij style={{ marginTop: 8, alignItems: 'center' }}>
        <input className="smal" type="number" inputMode="numeric" min="1" step="5" placeholder="—"
               value={minuten} aria-label="Minuten" style={{ width: 72 }}
               onChange={(e) => zetMinuten(e.target.value)} />
        <span className="klein">minuten</span>
        <Keuzechip aan={intensiteit === 'matig'} opKlik={() => zetGekozen('matig')}>matig</Keuzechip>
        <Keuzechip aan={intensiteit === 'zwaar'} opKlik={() => zetGekozen('zwaar')}>zwaar</Keuzechip>
        <Knop vol uit={!mag} opKlik={opslaan}>Toevoegen</Knop>
      </Rij>
      <p className="mini" style={{ marginTop: 6 }}>
        {gekozen == null
          ? `${soortVan(soort)?.naam ?? soort} telt als ${aanname} — ${soortVan(soort)?.waarom ?? 'aangenomen'}`
            + `. Klopt dat niet, zet hem om.`
          : `Je hebt zelf ${gekozen} gekozen; dat wordt zo bewaard.`}
        {intensiteit === 'zwaar' && mag && ` Deze ${dz(min)} minuten tellen als ${dz(min * 2)}.`}
      </p>
    </div>
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
