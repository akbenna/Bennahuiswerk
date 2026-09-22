/**
 * DRIE VENSTERS: profiel, importeren en account.
 * Overgezet uit vensterProfiel(), vensterImport() en vensterAccount().
 */
import { useEffect, useState } from 'react'
import { Kaart, Keuzechip, Knop, Kop, Rij, Spin, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import { MEDICATIEGROEPEN } from '../conditie'
import type { Conditie, Medicatiegroep } from '../conditie'
import { dec, dz } from '@/gedeeld/getal'
import type { Fase, Geslacht, IsoDatum, Profiel } from '@/gedeeld/db/tabellen'
import { isSessie, roep } from '@/gedeeld/db/rpc'
import type { NieuweDag, NieuweInspanning, NieuweRegel } from '@/gedeeld/db/rpc'
import { BRONNAAM, geraden, importeer, leesFoto, redenUit } from '../ai'
import { MINIMUM_LENGTE, wachtwoordklacht } from '../wachtwoord'
import { SOORTEN, equivalent, standaardIntensiteit } from '../inspanning'
import { GLI_PROGRAMMAS } from '../trap'
import { kortNL, vandaag } from '@/gedeeld/datum'
import type { Tester } from '@/gedeeld/db/rpc'
import { AANBIEDERNAAM, ONBEKEND, leesToegang, restZin, uitlegAi } from '../toegang'
import type { Aanbieder, Toegang } from '../toegang'
import type { ImportDag, Importactiviteit, Importbron } from '../ai'


/* ----------------------------------------------------------------- profiel */

/**
 * WAT ER SPEELT: de conditie en de medicatiegroepen.
 *
 * Dit blok staat onderin het profielvenster en niet op een eigen tabblad. Dat
 * is een keuze: een aparte diabetesmodule naast een aparte hypertensiemodule
 * bouwt de ziektegebonden keten na waar de zorg juist vanaf wil, en de meeste
 * mensen in deze praktijk hebben meer dan één aandoening tegelijk. Eén profiel
 * dat schermen anders wéégt is iets anders dan een app die uitdijt.
 *
 * Het staat bewust ná de doelen: wie hier niets invult merkt er niets van, en
 * dat hoort ook zo. Leeg betekent "we weten het niet".
 */
function Conditieblok(
  { conditie, opZet }: { conditie: Conditie; opZet: (c: Conditie) => void },
) {
  const med = conditie.med ?? []
  const wissel = (g: Medicatiegroep) => opZet({
    ...conditie,
    med: med.includes(g) ? med.filter((x) => x !== g) : [...med, g],
  })
  type Vlag = 'hypertensie' | 'dm2' | 'hvz' | 'huid_donker' | 'weinig_zon'
  const vink = (sleutel: Vlag) => (aan: boolean) =>
    opZet({ ...conditie, [sleutel]: aan })

  const Vinkje = (
    { sleutel, naam, toelichting }:
    { sleutel: Vlag; naam: string; toelichting?: string },
  ) => (
    <div className="regel">
      <div>
        <b style={{ fontSize: '.87rem' }}>{naam}</b>
        {toelichting && <div className="mini">{toelichting}</div>}
      </div>
      <input type="checkbox" checked={!!conditie[sleutel]} style={{ width: 19, height: 19 }}
             onChange={(e) => vink(sleutel)(e.target.checked)} />
    </div>
  )

  return (
    <>
      <div className="tussen" style={{ marginTop: 16 }}>Wat er bij jou speelt</div>
      <div className="mini" style={{ marginBottom: 6 }}>
        Vul dit alleen in als het klopt. De app gaat er niets anders van rekenen, maar hij wijst je op
        dingen die bij deze middelen horen als je afvalt.
      </div>

      <Vinkje sleutel="hypertensie" naam="Hoge bloeddruk, of daarvoor behandeld" />
      <Vinkje sleutel="dm2" naam="Diabetes type 2" />
      <Vinkje sleutel="hvz" naam="Hart- of vaatziekte gehad" />

      {/* TWEE VRAGEN OVER ZON, EN WAAROM ZE APART GESTELD WORDEN

          De Gezondheidsraad adviseert extra vitamine D onder meer bij een
          getinte of donkere huid en bij weinig buitenkomen of bedekkende
          kleding. Het profiel kent `etniciteit`, en het zou verleidelijk zijn
          die ervoor te gebruiken, maar afkomst is geen huidskleur, en een app
          die dat gelijkstelt doet een aanname over iemand die hij niet mag doen.
          `etniciteit` gaat in deze app over de afkapwaarde van de middelomtrek
          en over niets anders.

          Leeg is hier "niet gevraagd" en geen "nee": zolang er niets staat,
          zwijgt de regel over deze twee gronden. */}
      <div className="tussen" style={{ marginTop: 14 }}>Zon op je huid</div>
      <div className="mini" style={{ marginBottom: 6 }}>
        Voor het vitamine D-advies. De huid maakt vitamine D uit zonlicht, en in Nederland staat
        de zon van oktober tot maart te laag om daar genoeg van te leveren.
      </div>
      <Vinkje sleutel="huid_donker" naam="Getinte of donkere huid"
              toelichting="Meer zon nodig voor dezelfde aanmaak." />
      <Vinkje sleutel="weinig_zon" naam="Weinig buiten, of bedekkende kleding"
              toelichting="Minder dan een kwartier per dag met gezicht en handen onbedekt." />

      <div className="regel" style={{ display: 'block' }}>
        <div><b style={{ fontSize: '.87rem' }}>Welke medicijnen gebruik je?</b></div>
        <div className="mini" style={{ marginBottom: 8 }}>
          Groepen, geen merken. Weet je het niet zeker, laat het dan leeg en vraag het na bij je
          praktijkondersteuner.
        </div>
        <Rij style={{ gap: 6, flexWrap: 'wrap' }}>
          {MEDICATIEGROEPEN.map((m) => (
            <Keuzechip key={m.groep} aan={med.includes(m.groep)} titel={m.voorbeeld}
                       opKlik={() => wissel(m.groep)}>
              {m.naam}
            </Keuzechip>
          ))}
        </Rij>
        <div className="mini" style={{ marginTop: 8 }}>
          Dit is jouw opgave en geen medicatieoverzicht uit de praktijk.
        </div>
      </div>
    </>
  )
}



export function ProfielVenster(
  { profiel, opSluiten, opBewaren }:
  { profiel: Profiel; opSluiten: () => void; opBewaren: (p: Partial<Profiel>) => void },
) {
  const [p, zetP] = useState<Profiel>(profiel)
  const i = p.instellingen

  const getal = (v: string): number | null => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  const zet = <K extends keyof Profiel>(sleutel: K, waarde: Profiel[K]) =>
    zetP((oud) => ({ ...oud, [sleutel]: waarde }))
  const zetI = <K extends keyof Profiel['instellingen']>(
    sleutel: K, waarde: Profiel['instellingen'][K],
  ) => zetP((oud) => ({ ...oud, instellingen: { ...oud.instellingen, [sleutel]: waarde } }))

  const Nummer = (
    { waarde, opZet, breed }:
    { waarde: number | null | undefined; opZet: (n: number | null) => void; breed?: boolean },
  ) => (
    <input className={breed ? 'smal' : 'smaller'} type="number" step="any"
           value={waarde ?? ''} onChange={(e) => opZet(getal(e.target.value))} />
  )

  return (
    <Venster titel="Profiel en doelen" opSluiten={opSluiten}>
      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Lengte, leeftijd, geslacht</b></div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.lengte_cm} opZet={(n) => zet('lengte_cm', n ?? 0)} />
          <Nummer waarde={p.leeftijd_jaar} opZet={(n) => zet('leeftijd_jaar', n)} />
          <select value={p.geslacht} style={{ width: 'auto' }}
                  onChange={(e) => zet('geslacht', e.target.value as Geslacht)}>
            <option value="m">m</option><option value="v">v</option>
          </select>
        </Rij>
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Doelgewicht</b></div>
        <Nummer waarde={p.doel_gewicht_kg} opZet={(n) => zet('doel_gewicht_kg', n)} />
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Streeftempo</b>
          <div className="mini">
            Procent lichaamsgewicht per week. Boven 1,0 gaat het ten koste van vetvrije massa; 0,5 tot
            1,0 is de band.
          </div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.tempo_pct_week} opZet={(n) => zet('tempo_pct_week', n ?? 0)} />
          <span className="mini">%/wk</span>
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Eiwitdoel</b>
          <div className="mini">
            Gram per kilo <i>gecorrigeerd</i> gewicht, met plafond op BMI 30. 1,2 tot 1,5 tijdens
            energierestrictie.
          </div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.eiwit_g_per_kg} opZet={(n) => zet('eiwit_g_per_kg', n ?? 0)} />
          <span className="mini">g/kg</span>
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Olijfolie in de saladebereiding</b>
          <div className="mini">De grootste onzekerheid van de dag. Weeg één keer.</div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={i.olie_g ?? null} opZet={(n) => zetI('olie_g', n ?? undefined)} />
          <span className="mini">g</span>
          <input type="checkbox" checked={!!i.olie_gewogen} style={{ width: 19, height: 19 }}
                 onChange={(e) => zetI('olie_gewogen', e.target.checked)} />
        </Rij>
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Melk per cappuccino</b></div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={i.melk_ml ?? null} opZet={(n) => zetI('melk_ml', n ?? undefined)} />
          <select value={i.melk_soort ?? 'half'} style={{ width: 'auto' }}
                  onChange={(e) => zetI('melk_soort', e.target.value as 'mager' | 'half' | 'vol')}>
            <option value="mager">mager</option>
            <option value="half">halfvol</option>
            <option value="vol">vol</option>
          </select>
          <input type="checkbox" checked={!!i.melk_gemeten} style={{ width: 19, height: 19 }}
                 onChange={(e) => zetI('melk_gemeten', e.target.checked)} />
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Rookt</b>
          <div className="mini">Invoer voor SCORE2.</div>
        </div>
        <input type="checkbox" checked={!!i.rookt} style={{ width: 19, height: 19 }}
               onChange={(e) => zetI('rookt', e.target.checked)} />
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Fase</b></div>
        <select value={p.fase} style={{ width: 'auto' }}
                onChange={(e) => zet('fase', e.target.value as Fase)}>
          <option value="afvallen">afvallen</option>
          <option value="onderhoud">onderhoud</option>
          <option value="pauze">pauze</option>
        </select>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Basisgewicht onderhoud</b>
          <div className="mini">Het laagste stabiele gewicht; de zones rekenen hiervandaan.</div>
        </div>
        <Nummer waarde={p.onderhoud_basis_kg} opZet={(n) => zet('onderhoud_basis_kg', n)} />
      </div>

      {/* DE TRAP: waar je staat in het Nederlandse traject
          Twee velden, en ze zijn er niet om vast te leggen dat je iets doet
          maar om te kunnen tonen waar je bent. Wat ermee gebeurt staat op
          Profiel bij "Je traject"; waarom de medicatietrede daar op slot zit,
          staat in `trap.ts`. */}
      <div className="tussen" style={{ marginTop: 16 }}>Gecombineerde leefstijlinterventie</div>
      <div className="mini" style={{ marginBottom: 6 }}>
        Het tweejarige programma dat via je huisarts loopt en volledig vergoed wordt. Vul het in
        als je erin zit, dan kan de app laten zien waar je bent.
      </div>
      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Welk programma</b></div>
        <select value={i.gli?.programma ?? ''} style={{ flex: '0 0 190px' }}
                aria-label="GLI-programma"
                /* Geen programma betekent: het hele veld weg, niet een lege
                   sleutel. Een startdatum zonder programma zegt niets. */
                onChange={(e) => zetI('gli', e.target.value
                  ? { ...i.gli, programma: e.target.value }
                  : undefined)}>
          <option value="">geen</option>
          {GLI_PROGRAMMAS.map((g) => (
            <option key={g.sleutel} value={g.sleutel}>{g.naam}</option>
          ))}
        </select>
      </div>
      {i.gli?.programma && (
        <div className="regel">
          <div><b style={{ fontSize: '.87rem' }}>Begonnen op</b></div>
          {/* `max` op vandaag: een startdatum in de toekomst is een typefout in
              het jaartal en geen keuze. De kaart vangt hem ook op, maar liever
              hier, daar leest hij als een mededeling, hier als een grens. */}
          <input type="date" value={i.gli?.begonnen ?? ''} aria-label="Startdatum GLI"
                 max={vandaag()} style={{ flex: '0 0 150px' }}
                 onChange={(e) => {
                   const g = { ...i.gli }
                   if (e.target.value) g.begonnen = e.target.value as IsoDatum
                   else delete g.begonnen
                   zetI('gli', g)
                 }} />
        </div>
      )}

      <Conditieblok conditie={i.conditie ?? {}} opZet={(c) => zetI('conditie', c)} />

      <Rij style={{ marginTop: 14 }}>
        <Knop vol opKlik={() => opBewaren(p)}>Bewaren</Knop>
        <Knop opKlik={opSluiten}>Annuleren</Knop>
      </Rij>
    </Venster>
  )
}

/* --------------------------------------------------------------- importeren */

/**
 * EEN WORK-OUTLIJST WORDT EEN LIJST INSPANNINGEN
 *
 * De lijst onder "Work-outs" in Apple Gezondheid geeft per post een duur, een
 * datum, de app die hem schreef, en een kopje dat zegt wat het was. Dat kopje
 * is wat deze rijen bruikbaar maakt: veertig minuten hardlopen telt voor de
 * richtlijn dubbel zo zwaar als veertig minuten wandelen.
 *
 * WAAROM ER VINKJES STAAN EN GEEN FILTER
 *
 * Drie soorten posten beginnen uitgevinkt, en geen van drieën is "fout":
 * krachttraining (die telt apart en hoort in zijn eigen tabel), een duur van
 * meer dan vier uur (in de lijst die dit opriep stonden er twee van 9 en 14 uur
 *, een horloge dat de stopknop niet gezien heeft), en een post zonder kopje.
 *
 * De reden staat er bij elke uitgevinkte post bij. De app wéét namelijk niet dat
 * zo'n post fout is; hij vindt hem alleen onwaarschijnlijk, en dat is iets
 * anders. Wie beter weet vinkt hem aan.
 *
 * DE SOORT IS TE VERBETEREN, EN DAAROM STAAT HIJ ER ALS KEUZE
 *
 * Wat de herkenning van het kopje maakte is een vertaling, geen waarneming.
 * Staat er "Functionele kracht" en werd dat `kracht`, dan hoort dat te zien te
 * zijn en te veranderen te zijn, niet stil te gebeuren. Een post zonder kopje
 * heeft geen soort en vraagt er dus om.
 */
function duur(minuten: number): string {
  const m = Math.round(minuten)
  return m >= 60 ? `${Math.floor(m / 60)} u ${String(m % 60).padStart(2, '0')}` : `${m} min`
}

/** De soorten in het uitklaplijstje, plus de twee die geen inspanning zijn. */
const IMPORTSOORTEN: Array<{ sleutel: string; naam: string }> = [
  ...SOORTEN.map((s) => ({ sleutel: s.sleutel, naam: s.naam })),
  { sleutel: 'kracht', naam: 'Krachttraining (telt apart)' },
]

export function ImportVenster(
  { token, opSluiten, opOvernemen }:
  {
    token: string
    opSluiten: () => void
    opOvernemen: (
      dagen: NieuweDag[], regels: NieuweRegel[], inspanning: NieuweInspanning[],
    ) => void
  },
) {
  const [tekst, zetTekst] = useState('')
  const [fotos, zetFotos] = useState<Awaited<ReturnType<typeof leesFoto>>[]>([])
  const [melding, zetMelding] = useState<string | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [concept, zetConcept] = useState<ImportDag[] | null>(null)
  const [bronnen, zetBronnen] = useState<Importbron[]>([])
  const [werk, zetWerk] = useState<Importactiviteit[]>([])
  const [aan, zetAan] = useState<boolean[]>([])
  /* De soort staat apart van `werk` omdat hij te veranderen is: `werk` is wat de
     herkenning zag en blijft dat, `soorten` is wat eruit wordt. */
  const [soorten, zetSoorten] = useState<string[]>([])

  /* Geen tweede zeef op 'kracht' hier: het vinkje van zo'n post is uitgezet én
     niet aan te zetten (zie `disabled` hieronder), en dat is het slot. Stond de
     zeef er óók, dan was er een regel die niets doet zolang het slot werkt en
     niemand die merkt wanneer het slot brak, twee halve sloten in plaats van
     één hele. */
  const rijen: NieuweInspanning[] = werk
    .map((a, i) => ({ a, soort: soorten[i] ?? '', aan: !!aan[i] }))
    .filter((x) => x.aan && x.soort)
    .map(({ a, soort }) => ({
      datum: a.datum,
      soort,
      minuten: Math.round(a.minuten),
      intensiteit: standaardIntensiteit(soort),
      geschat: true,
      eigennaam: soort === 'anders' ? (a.label ?? null) : null,
      bron: 'import',
      ...(a.tijd ? { tijd: a.tijd } : {}),
    }))
  const echteMinuten = rijen.reduce((s, r) => s + r.minuten, 0)
  const matigeMinuten = rijen.reduce(
    (s, r) => s + equivalent(r.minuten, r.intensiteit ?? 'matig'), 0)

  async function uitlezen() {
    zetLoopt(true)
    zetMelding(null)
    try {
      const uit = await importeer(token, tekst, fotos)
      zetConcept(uit.dagen)
      zetBronnen(uit.bronnen ?? [])
      const w = uit.activiteiten ?? []
      zetWerk(w)
      zetSoorten(w.map((a) => a.soort ?? ''))
      zetAan(w.map((a) => redenUit(a) == null))
      zetMelding(`${uit.dagen.length} dagen gevonden.`
        + (w.length ? ` ${w.length} work-out${w.length === 1 ? '' : 's'}.` : '')
        + (uit.opmerking ? ` ${uit.opmerking}` : ''))
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  /* Een soort kiezen bij een post die er geen had is meteen het antwoord op de
     vraag die het vinkje stelde. Hem daarna nóg een keer laten aanvinken is een
     tik die niets toevoegt. Krachttraining blijft uit: die hoort hier niet. */
  function kiesSoort(i: number, sleutel: string) {
    zetSoorten(soorten.map((v, j) => j === i ? sleutel : v))
    const a = werk[i]
    if (a && sleutel && sleutel !== 'kracht' && redenUit({ ...a, soort: sleutel }) == null) {
      zetAan(aan.map((v, j) => j === i ? true : v))
    }
    if (sleutel === 'kracht') zetAan(aan.map((v, j) => j === i ? false : v))
  }

  function overnemen() {
    if (!concept) return
    const dagen: NieuweDag[] = concept
      .filter((d) => d.gewicht_kg != null || d.stappen != null || d.actieve_energie_kcal != null)
      .map((d) => ({
        datum: d.datum,
        ...(d.gewicht_kg != null ? { gewicht_kg: d.gewicht_kg } : {}),
        ...(d.stappen != null ? { stappen: d.stappen } : {}),
        ...(d.actieve_energie_kcal != null ? { actieve_energie_kcal: d.actieve_energie_kcal } : {}),
        bron: 'import',
      }))
    const regels: NieuweRegel[] = concept
      .filter((d): d is ImportDag & { kcal: number } => d.kcal != null && d.kcal > 0)
      .map((d) => ({
        datum: d.datum, naam: 'Dagtotaal, geïmporteerd', kcal_punt: d.kcal,
        kcal_laag: Math.round(d.kcal * 0.85), kcal_hoog: Math.round(d.kcal * 1.45),
        eiwit_g: d.eiwit_g, vet_g: d.vet_g, koolhydraat_g: d.koolhydraat_g,
        conf: 'D', bron: 'import',
        onzekerheidsbronnen: [
          'dagtotaal uit een andere app, niet per product terug te rekenen',
          'bovengrens ruim genomen wegens de gebruikelijke onderregistratie',
        ],
      }))
    opOvernemen(dagen, regels, rijen)
  }

  return (
    <Venster titel="Importeren" opSluiten={opSluiten}>
      <p className="klein" style={{ marginTop: 8 }}>
        Plak tekst uit Yazio of Apple Gezondheid, of stuur schermafdrukken mee. Er wordt alleen
        overgenomen wat er werkelijk staat; gaten worden niet opgevuld.
      </p>
      <textarea style={{ marginTop: 10, minHeight: 120 }} value={tekst}
                onChange={(e) => zetTekst(e.target.value)}
                placeholder={'20 augustus 2026    1.319 kcal\n19 augustus 2026    1.481 kcal\n…'} />
      <Rij style={{ marginTop: 8 }}>
        <label className="knop" style={{ cursor: 'pointer' }}>
          Schermafdrukken kiezen
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                 onChange={async (e) => {
                   const lijst = [...(e.target.files ?? [])].slice(0, 8)
                   zetFotos(await Promise.all(lijst.map(leesFoto)))
                 }} />
        </label>
        {fotos.length > 0 && (
          <span className="mini">
            {fotos.length} afbeelding{fotos.length === 1 ? '' : 'en'} klaar
          </span>
        )}
      </Rij>
      <p className="klein" style={{ marginTop: 8, minHeight: '1.2em' }}>
        {loopt ? <><Spin /> Uitlezen…</> : melding}
      </p>

      {concept && (concept.length > 0 || werk.length > 0) && (
        <>
          {/* WAAROP DE HERKENNING ZICH BASEERDE
              Een "Alle gegevens"-lijst uit Apple Gezondheid is een kale kolom
              getallen; welke grootheid dat is staat in een kop die vaak
              weggescrold is. Wat er geraden is hoort hier te staan en niet in de
              database: een verkeerd geraden kolom ziet er daarna uit als elke
              andere rij en is niet meer terug te vinden.

              Alleen de gokken, niet alle reeksen. Wie bij elke import een lijstje
              krijgt waar meestal niets mis mee is, kijkt er na twee keer
              overheen, en dan staat de waarschuwing er voor niets. */}
          {geraden(bronnen).length > 0 && (
            <Kaart toon="let" plat style={{ marginTop: 10 }}>
              <p className="klein">
                <b>Kijk dit na.</b> De kop stond niet op de afdruk, dus dit is afgeleid uit hoe
                groot de getallen zijn:
              </p>
              <ul className="mini" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {geraden(bronnen).map((b, i) => (
                  <li key={i}>
                    gelezen als <b>{BRONNAAM[b.wat]}</b>
                    {b.dagen != null && ` · ${b.dagen} dagen`}
                  </li>
                ))}
              </ul>
              <p className="mini" style={{ marginTop: 6 }}>
                Klopt dat niet, neem dan niet over: maak een nieuwe afdruk waar de kop op staat.
              </p>
            </Kaart>
          )}

          {concept.length > 0 && (
            <div className="lijst" style={{ marginTop: 8, maxHeight: 230, overflow: 'auto' }}>
              {concept.map((d) => (
                <div key={d.datum}>
                  <span className="cijfer mini groei">{d.datum}</span>
                  <span className="cijfer mini">
                    {d.kcal != null && `${dz(d.kcal)} kcal`}
                    {d.eiwit_g != null && ` · ${dec(d.eiwit_g, 0)} g eiwit`}
                    {d.stappen != null && ` · ${dz(d.stappen)} stappen`}
                    {d.actieve_energie_kcal != null
                      && ` · ${dz(d.actieve_energie_kcal)} kcal actief`}
                    {d.gewicht_kg != null && ` · ${dec(d.gewicht_kg, 1)} kg`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {werk.length > 0 && (
            <>
              <Kop>Work-outs</Kop>
              <p className="klein">
                Wat aangevinkt staat komt erbij als inspanning. Een vinkje staat uit als er een
                reden voor is, en die staat erbij. Wie het beter weet zet hem aan. De soort bepaalt
                hoe zwaar de minuten tellen en is hier te verbeteren.
              </p>
              <div className="lijst" style={{ marginTop: 6, maxHeight: 240, overflow: 'auto' }}>
                {werk.map((a, i) => {
                  const reden = redenUit({ ...a, soort: soorten[i] ?? '' })
                  return (
                    <div key={i} style={{ flexWrap: 'wrap' }}>
                      {/* Krachttraining is niet aan te vinken, en dat is iets anders
                          dan hem verbergen. De richtlijn telt hem apart en de
                          lijst geeft geen sets of reps, dus er valt hier niets
                          van te maken. Klopte het kopje niet, dan verander je de
                          soort, en dan mag hij wél mee. */}
                      <input type="checkbox" checked={!!aan[i]} style={{ width: 19, height: 19 }}
                             disabled={soorten[i] === 'kracht'}
                             aria-label={`${a.datum} · ${duur(a.minuten)}`}
                             onChange={(e) => zetAan(aan.map((v, j) => j === i ? e.target.checked : v))} />
                      <span className="cijfer mini groei knip">
                        {a.datum}{a.tijd ? ` ${a.tijd}` : ''}
                        {a.label ? ` · ${a.label}` : ''}
                      </span>
                      <select value={soorten[i] ?? ''} style={{ flex: '0 0 138px' }}
                              aria-label={`Soort van ${a.datum} ${duur(a.minuten)}`}
                              onChange={(e) => kiesSoort(i, e.target.value)}>
                        <option value="">geen soort</option>
                        {IMPORTSOORTEN.map((s) => (
                          <option key={s.sleutel} value={s.sleutel}>{s.naam}</option>
                        ))}
                      </select>
                      <span className="cijfer mini" style={{ width: 60, textAlign: 'right' }}>
                        {duur(a.minuten)}
                      </span>
                      {reden && (
                        <span className="mini" style={{ flexBasis: '100%', color: 'var(--let)' }}>
                          {reden}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Wat er werkelijk verstuurd wordt, en wat het telt. Twee
                  getallen, want ze zijn niet hetzelfde: zware minuten tellen
                  dubbel, en een scherm dat alleen het tweede toont liegt over
                  wat je gedaan hebt. */}
              <p className="klein" style={{ marginTop: 10 }}>
                {rijen.length === 0
                  ? 'Niets aangevinkt: er komt geen inspanning bij.'
                  : <>
                      <b>{rijen.length}</b> {rijen.length === 1 ? 'activiteit' : 'activiteiten'},
                      samen <b>{dz(echteMinuten)} minuten</b>
                      {matigeMinuten !== echteMinuten
                        && <>, en dat telt als {dz(matigeMinuten)} matige minuten</>}.
                    </>}
              </p>
            </>
          )}

          <Rij style={{ marginTop: 8 }}>
            <Knop vol opKlik={overnemen}>Overnemen</Knop>
          </Rij>
        </>
      )}

      {!concept && (
        <Rij style={{ marginTop: 10 }}>
          <Knop vol uit={loopt} opKlik={() => void uitlezen()}>Uitlezen</Knop>
        </Rij>
      )}
    </Venster>
  )
}

/* ----------------------------------------------------------------- account */

export function AccountVenster(
  { account, opSluiten, opAfmelden }:
  { account: string; opSluiten: () => void; opAfmelden: () => void },
) {
  return (
    <Venster titel="Account" opSluiten={opSluiten}>
      {/* Dezelfde onwaarheid als onder het aanmeldscherm stond, en die heb ik
          daar wél rechtgezet en hier niet. Twee plekken die hetzelfde zeggen en
          los van elkaar bijgewerkt worden, precies het patroon waar dit
          project elders variabelen voor gebruikt. Hier kan dat niet: het zijn
          twee verschillende zinnen in twee verschillende schermen. */}
      <p className="klein" style={{ marginTop: 8 }}>
        Aangemeld als <b>{account}</b>. De sessie blijft dertig dagen staan. Je gegevens staan in de
        eigen database van BennaHub, los van de zorggegevens van de praktijk, en zijn alleen via
        beveiligde databasefuncties met dit wachtwoord bereikbaar.
      </p>
      <JouwToegang />
      <WachtwoordWijzigen />
      <Herstelcode />
      <BeheerdersHerstelcode />
      <Testerbeheer />
      <Rij style={{ marginTop: 14 }}>
        <Knop opKlik={opAfmelden}>Afmelden</Knop>
      </Rij>
    </Venster>
  )
}

/**
 * EEN HERSTELCODE VOOR IEMAND ANDERS
 *
 * Alleen zichtbaar voor een beheerder. Wat dat is en waarom de vlag met de hand
 * aangaat staat in `health/database/40-een-beheerder-die-niet-stilletjes-kan.sql`.
 *
 * WAT HIER NIET STAAT, EN DAT IS HET BELANGRIJKSTE
 *
 * Er staat geen belofte dat de beheerder er niet mee binnenkomt. Dat zou niet
 * waar zijn: wie een code doorgeeft heeft hem gezien en kan hem zelf inwisselen.
 * De tekst op het scherm zegt dat ook, want een schermbelofte die niet klopt is
 * erger dan geen belofte.
 *
 * Wat de regeling wél geeft is dat het niet stil kan: het slachtoffer merkt het
 * meteen, en elke uitgifte staat in `kal_herstel_log`.
 *
 * DE KNOP IS GEEN SLOT
 *
 * `kal_ben_ik_beheerder` bepaalt alleen of dit blok er staat. Wie dat antwoord
 * in zijn browser vervalst krijgt een formulier te zien dat bij het indrukken
 * alsnog geweigerd wordt, de grens ligt in de database en niet hier.
 */
/* Het sessietoken uit de opslag. Drie blokken hieronder hebben het nodig en
   stonden elk op het punt hun eigen kopie te maken. */
function sessietoken(): string | null {
  try {
    const s = JSON.parse(localStorage.getItem('kalibratie.sessie') ?? 'null') as
      { token?: string } | null
    return s?.token ?? null
  } catch { return null }
}

function BeheerdersHerstelcode() {
  const [mag, zetMag] = useState(false)
  const [open, zetOpen] = useState(false)
  const [voor, zetVoor] = useState('')
  const [ww, zetWw] = useState('')
  const [uitslag, zetUitslag] = useState<{ code: string; account: string } | null>(null)
  const [fout, zetFout] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  useEffect(() => {
    let afgebroken = false
    void (async () => {
      const t = sessietoken()
      if (!t) return
      try {
        const uit = await roep('kal_ben_ik_beheerder', { p_token: t })
        if (!afgebroken) zetMag(uit?.beheerder === true)
      } catch { /* geen beheerdersrecht, geen regel, dit is geen fout */ }
    })()
    return () => { afgebroken = true }
  }, [])

  const maak = async () => {
    zetBezig(true)
    zetFout(null)
    try {
      const t = sessietoken()
      if (!t) { zetFout('Je bent niet aangemeld'); return }
      const uit = await roep('kal_herstelcode_voor',
        { p_token: t, p_ww: ww, p_account: voor.trim().toLowerCase() })
      if ('fout' in uit) { zetFout(uit.fout); return }
      zetUitslag(uit)
      zetWw('')
      zetVoor('')
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (!mag) return null

  if (uitslag) {
    return (
      <div className="kaart" style={{ marginTop: 14 }}>
        <Kop>Code voor {uitslag.account}</Kop>
        <p className="getal" style={{ fontSize: '1.15rem', marginTop: 8, letterSpacing: '.02em' }}>
          {uitslag.code}
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Geef hem door en bewaar hem zelf niet. Hij werkt één keer, en de oude code van{' '}
          {uitslag.account} werkt niet meer. Deze uitgifte staat vastgelegd.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <p className="mini">
          <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
            Herstelcode voor iemand anders
          </button>
          {' '}, voor wie zijn wachtwoord én zijn code kwijt is.
        </p>
      ) : (
        <>
          {/* HET BLOK HOUDT ZIJN NAAM OOK ALS HET OPENSTAAT
              Zonder deze regel verdwijnt de naam zodra je hem openklapt, en
              hangen de twee velden rechtstreeks onder "Herstelcode maken", een
              ándere knop, die óók codes maakt. Op de schermafdruk was dat niet
              uit elkaar te houden. De twee blokken hierboven hebben hetzelfde
              patroon en komen ermee weg omdat ze alleen staan; dit is het derde
              en het tweede dat een code maakt. */}
          <p className="klein" style={{ marginTop: 4, fontWeight: 600 }}>
            Herstelcode voor iemand anders
          </p>
          <label className="veld" style={{ marginTop: 8 }}>
            <span>voor welk account</span>
            <input autoCapitalize="none" spellCheck={false} value={voor}
                   onChange={(e) => zetVoor(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>je eigen wachtwoord</span>
            <input type="password" autoComplete="current-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          {/* Eerlijk over wat dit is. Zie de kop van deze component. */}
          <p className="mini" style={{ marginTop: 8 }}>
            Diegene zet er zelf een nieuw wachtwoord mee. Je kent dat wachtwoord niet, maar je hebt
            de code wel gezien, dus je zou hem ook zelf kunnen gebruiken. Daarom wordt elke uitgifte
            vastgelegd, en merkt diegene het onmiddellijk.
          </p>
          <p className="klein" style={{ marginTop: 8, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</> : fout}
          </p>
          <Rij>
            <Knop vol uit={voor.trim() === '' || ww === '' || bezig} opKlik={() => void maak()}>
              Code maken
            </Knop>
            <Knop uit={bezig}
                  opKlik={() => { zetOpen(false); zetVoor(''); zetWw(''); zetFout(null) }}>
              Laat maar
            </Knop>
          </Rij>
        </>
      )}
    </div>
  )
}

/**
 * JE WACHTWOORD WIJZIGEN
 *
 * `kal_ww_wijzigen` bestond al sinds bestand 33 en stond zelfs getypeerd in
 * rpc.ts, maar werd nergens aangeroepen: de enige weg naar een nieuw wachtwoord
 * was de herstelcode. Zolang de eis acht tekens was viel dat niet op. Nu de eis
 * twaalf is, is het een gat: wie een oud wachtwoord van acht tekens heeft komt
 * er wel mee binnen, maar had geen enkele manier om het te vervangen. Een
 * strengere lat zonder ladder is geen strengere lat maar een klem.
 *
 * Het oude wachtwoord wordt gevraagd en dat is geen formaliteit: een token ligt
 * dertig dagen in localStorage, en wie dat steelt mag daarmee niet het slot
 * kunnen vervangen.
 *
 * Alle sessies vliegen eruit, ook dit toestel. Dat doet de database al; wat hier
 * gebeurt is het nieuwe token opvangen, want zonder dat zou je jezelf uitloggen.
 */
function WachtwoordWijzigen() {
  const [open, zetOpen] = useState(false)
  const [oud, zetOud] = useState('')
  const [nieuw, zetNieuw] = useState('')
  const [fout, zetFout] = useState<string | null>(null)
  const [klaar, zetKlaar] = useState(false)
  const [bezig, zetBezig] = useState(false)

  const klacht = wachtwoordklacht(nieuw)
  const kan = oud !== '' && nieuw !== '' && klacht === null

  const wijzig = async () => {
    zetBezig(true)
    zetFout(null)
    try {
      const s = JSON.parse(localStorage.getItem('kalibratie.sessie') ?? 'null') as
        { token?: string } | null
      if (!s?.token) { zetFout('Je bent niet aangemeld'); return }
      const uit = await roep('kal_ww_wijzigen', { p_token: s.token, p_oud: oud, p_nieuw: nieuw })
      if (!isSessie(uit)) { zetFout(uit.fout); return }
      /* Het nieuwe token moet hier opgeslagen worden: de database heeft zojuist
         álle sessies weggegooid, dus het token in localStorage is dood. */
      try { localStorage.setItem('kalibratie.sessie', JSON.stringify(uit)) } catch { /* mag falen */ }
      zetOud(''); zetNieuw(''); zetKlaar(true); zetOpen(false)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (klaar && !open) {
    return (
      <p className="mini" style={{ marginTop: 14 }}>
        Je wachtwoord is gewijzigd. Andere toestellen die nog openstonden zijn afgemeld.
      </p>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <p className="mini">
          <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
            Wachtwoord wijzigen
          </button>
          {`, minstens ${MINIMUM_LENGTE} tekens.`}
        </p>
      ) : (
        <>
          <label className="veld">
            <span>je huidige wachtwoord</span>
            <input type="password" autoComplete="current-password" value={oud}
                   onChange={(e) => zetOud(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>nieuw wachtwoord</span>
            <input type="password" autoComplete="new-password" value={nieuw}
                   onChange={(e) => zetNieuw(e.target.value)} />
          </label>
          {/* Wat er mis is staat er terwijl je typt en niet pas na een klik: een
              eis die je pas leert kennen als je hem overtreedt is een valstrik.
              Bij een leeg veld staat er wat er wél moet. */}
          <p className="klein" style={{ marginTop: 8, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</>
              : fout ?? (nieuw === '' ? `Minstens ${MINIMUM_LENGTE} tekens.`
                : klacht ?? 'Dit kan ermee door.')}
          </p>
          <Rij>
            <Knop vol uit={!kan || bezig} opKlik={() => void wijzig()}>Wijzigen</Knop>
            <Knop uit={bezig}
                  opKlik={() => { zetOpen(false); zetOud(''); zetNieuw(''); zetFout(null) }}>
              Laat maar
            </Knop>
          </Rij>
        </>
      )}
    </div>
  )
}

/**
 * EEN HERSTELCODE MAKEN
 *
 * Zonder deze code is er geen weg terug als je je wachtwoord kwijt bent, er is
 * geen e-mail in deze app en dus geen herstelmail. Waarom dat zo is staat in
 * `health/database/33-wachtwoord-kwijt.sql`.
 *
 * Het wachtwoord wordt hier opnieuw gevraagd, en dat is geen hinder maar het
 * punt: een token ligt dertig dagen in localStorage, en wie dat steelt mag
 * daarmee geen blijvende ingang kunnen maken.
 *
 * De code staat maar één keer op het scherm. Hij wordt gehasht opgeslagen, dus
 * ook de database kan hem daarna niet meer tonen.
 */
function Herstelcode() {
  const [open, zetOpen] = useState(false)
  const [ww, zetWw] = useState('')
  const [code, zetCode] = useState<string | null>(null)
  const [fout, zetFout] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  const maak = async () => {
    zetBezig(true)
    zetFout(null)
    try {
      const s = JSON.parse(localStorage.getItem('kalibratie.sessie') ?? 'null') as
        { token?: string } | null
      if (!s?.token) { zetFout('Je bent niet aangemeld'); return }
      const uit = await roep('kal_herstelcode_maken', { p_token: s.token, p_ww: ww })
      if ('fout' in uit) { zetFout(uit.fout); return }
      zetCode(uit.code)
      zetWw('')
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (code) {
    return (
      <div className="kaart" style={{ marginTop: 14 }}>
        <Kop>Schrijf deze code op</Kop>
        <p className="getal" style={{ fontSize: '1.15rem', marginTop: 8, letterSpacing: '.02em' }}>
          {code}
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Hij staat hier één keer. Bewaar hem ergens waar je hem terugvindt zonder deze app: op
          papier, of in je wachtwoordbeheerder. Hij werkt één keer; daarna maak je een nieuwe.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <p className="mini">
          <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
            Herstelcode maken
          </button>
          {' '}, nodig als je ooit je wachtwoord kwijt bent.
        </p>
      ) : (
        <>
          <label className="veld">
            <span>je wachtwoord, nog één keer</span>
            <input type="password" autoComplete="current-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          <p className="klein" style={{ marginTop: 8, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</> : fout}
          </p>
          <Rij>
            <Knop vol uit={ww === '' || bezig} opKlik={() => void maak()}>Code maken</Knop>
            <Knop uit={bezig} opKlik={() => { zetOpen(false); zetWw(''); zetFout(null) }}>
              Laat maar
            </Knop>
          </Rij>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ aanmelden --- */

export function Aanmelden(
  { bezig, fout, opAanmelden, opHerstellen }:
  { bezig: boolean; fout: string | null
    opAanmelden: (a: string, w: string, nieuw: boolean) => void
    opHerstellen: (a: string, code: string, nieuw: string) => void },
) {
  const [account, zetAccount] = useState('')
  const [ww, zetWw] = useState('')
  /* De herstelweg staat achter een schakelaar en niet naast het gewone veld:
     wie gewoon inlogt hoort er niet over te struikelen, en wie hem nodig heeft
     zoekt ernaar. */
  const [kwijt, zetKwijt] = useState(false)
  const [code, zetCode] = useState('')
  /* AANMELDEN EN EEN WACHTWOORD ZETTEN ZIJN TWEE VERSCHILLENDE EISEN
     Wie aanmeldt mag alles intikken: wat hij heeft is wat hij heeft, ook als dat
     acht tekens uit 2024 zijn. De regel geldt alleen waar een wachtwoord gezet
     wordt, bij een nieuw account en bij herstellen. Zou hij ook op de
     aanmeldknop staan, dan sloot een strengere regel met terugwerkende kracht
     mensen buiten uit hun eigen gegevens. */
  const kan = account.trim() !== '' && ww !== ''
  const klachtNieuw = wachtwoordklacht(ww, account.trim())
  const kanNieuw = kan && klachtNieuw === null
  const kanHerstel = account.trim() !== '' && code.trim() !== ''
    && wachtwoordklacht(ww, account.trim()) === null

  if (kwijt) {
    return (
      <>
        <header>
          <h1>Wachtwoord kwijt</h1>
          <p className="sub">
            Met je herstelcode zet je een nieuw wachtwoord. De code werkt één keer; daarna maak je
            een nieuwe in je account.
          </p>
        </header>
        <Kaart style={{ marginTop: 18 }}>
          <label className="veld">
            <span>naam</span>
            <input autoComplete="username" autoCapitalize="none" value={account}
                   onChange={(e) => zetAccount(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>herstelcode</span>
            <input autoCapitalize="characters" spellCheck={false} value={code}
                   placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                   onChange={(e) => zetCode(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>nieuw wachtwoord</span>
            <input type="password" autoComplete="new-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          <p className="klein" style={{ marginTop: 10, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</>
              : fout ?? (ww === '' ? `Minstens ${MINIMUM_LENGTE} tekens.`
                : wachtwoordklacht(ww, account.trim()) ?? 'Dit kan ermee door.')}
          </p>
          <Rij style={{ marginTop: 6 }}>
            <Knop vol uit={!kanHerstel || bezig}
                  opKlik={() => opHerstellen(account.trim().toLowerCase(), code.trim(), ww)}>
              Nieuw wachtwoord zetten
            </Knop>
            <Knop uit={bezig} opKlik={() => { zetKwijt(false); zetCode(''); zetWw('') }}>
              Terug
            </Knop>
          </Rij>
        </Kaart>
      </>
    )
  }

  return (
    <>
      <header>
        <h1>BennaHealth</h1>
        <p className="sub">
          Persoonlijk energiebalansmodel. Het verbruik wordt gemeten uit de gewichtstrend in plaats van
          geschat uit een formule.
        </p>
      </header>
      <Kaart style={{ marginTop: 18 }}>
        <label className="veld">
          <span>naam</span>
          <input autoComplete="username" autoCapitalize="none" value={account}
                 onChange={(e) => zetAccount(e.target.value)} />
        </label>
        <label className="veld" style={{ marginTop: 10 }}>
          <span>wachtwoord</span>
          <input type="password" autoComplete="current-password" value={ww}
                 onChange={(e) => zetWw(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && kan) opAanmelden(account.trim().toLowerCase(), ww, false)
                 }} />
        </label>
        {/* De klacht staat er alleen als je er iets aan kunt doen. Bij een leeg
            veld en tijdens het aanmelden zou hij afleiden van de echte fout, en
            wie gewoon inlogt gaat de regel niets aan. */}
        <p className="klein" style={{ marginTop: 10, minHeight: '1.3em' }}>
          {bezig ? <><Spin /> Bezig…</> : fout ?? (ww !== '' && klachtNieuw
            ? <span className="mini">Voor een nieuw account: {klachtNieuw.toLowerCase()}</span>
            : null)}
        </p>
        <Rij style={{ marginTop: 6 }}>
          <Knop vol uit={!kan || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, false)}>
            Aanmelden
          </Knop>
          <Knop uit={!kanNieuw || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, true)}>
            Nieuw account
          </Knop>
        </Rij>
        <p className="mini" style={{ marginTop: 12 }}>
          <button type="button" className="alsLink" onClick={() => { zetKwijt(true); zetWw('') }}>
            Wachtwoord kwijt?
          </button>
        </p>
      </Kaart>
      {/* Hier stond dat de gegevens in het project van ProVita staan, naast de
          patiëntgegevens. Dat klopte tot 26 augustus 2026 en daarna niet meer:
          op die dag is BennaHub naar een eigen database verhuisd, en de
          aanleiding voor die verhuizing was juist dat gezinsgegevens en
          zorggegevens één back-up en één blusgebied deelden. Een scherm dat de
          oude situatie blijft beschrijven maakt precies de belofte die toen is
          rechtgezet. Zie `SUPABASE-scheiding.md`. */}
      <p className="mini">
        Je gegevens staan in de eigen database van BennaHub, los van de zorggegevens van de praktijk.
        Geen enkele tabel is publiek benaderbaar; toegang loopt via beveiligde databasefuncties en het
        wachtwoord staat gehasht.
      </p>
    </>
  )
}

/**
 * WAT JE ZELF MAG
 *
 * Eén regel in het accountvenster, en hij staat er voor iedereen: de eigenaar
 * leest er "toegelaten" en verder niets, een tester leest waar hij aan toe is.
 *
 * Hij staat hier en niet op het hoofdscherm omdat het geen dagelijks gegeven
 * is. Wie wacht, merkt dat vanzelf op het moment dat hij iets wil laten
 * herkennen, en dáár staat dezelfde uitleg.
 */
function JouwToegang() {
  const [t, zetT] = useState<Toegang>(ONBEKEND)
  /* Een teller die na het bewaren van een sleutel blijft staan zoals hij was,
     leest als een sleutel die niet is aangekomen. */
  const [ronde, zetRonde] = useState(0)

  useEffect(() => {
    let afgebroken = false
    void (async () => {
      const tk = sessietoken()
      if (!tk) return
      try {
        const uit = await roep('kal_mijn_toegang', { p_token: tk })
        if (!afgebroken) zetT(leesToegang(uit))
      } catch { /* zie de kop van toegang.ts: geen antwoord is geen afwijzing */ }
    })()
    return () => { afgebroken = true }
  }, [ronde])

  if (t.status === 'onbekend') return null
  const rest = restZin(t)
  const uitleg = uitlegAi(t)

  return (
    <>
      <p className="mini" style={{ marginTop: 10 }}>
      <b>
        {t.status === 'toegelaten' ? 'Toegelaten tot de test'
         : t.status === 'wacht' ? 'Je aanmelding wacht op toelating'
         : 'Niet toegelaten'}
      </b>
      {rest && <>. {rest}</>}
      {uitleg && <>. {uitleg}</>}
      </p>
      <EigenSleutel t={t} opnieuw={() => zetRonde((x) => x + 1)} />
    </>
  )
}

/**
 * DE TESTERS
 *
 * Wie zich heeft aangemeld, wie er in mag, en wat het kost.
 *
 * WAT HIER NIET STAAT
 *
 * Geen gewicht, geen bloeddruk, geen labwaarde, geen maaltijd. `kal_testers`
 * geeft dat niet terug en dat is geen zuinigheid: het is de medische informatie
 * van iemand anders, en een beheerder die wil weten of zijn app gebruikt wordt
 * heeft er niets van nodig. Wat er wél staat is wanneer iemand voor het laatst
 * iets liet herkennen, en daarmee is de vraag "doet hij nog mee" te
 * beantwoorden zonder over zijn schouder mee te kijken.
 *
 * WAAROM HET BUDGET IN AANROEPEN STAAT EN NIET IN EURO
 *
 * Het bedrag in deze lijst wordt in de edge function uitgerekend met een vast
 * Sonnet-tarief. Draait er een ander model, dan klopt het niet meer, en dat
 * staat erbij. Het aantal aanroepen klopt altijd, dus dáár ligt de grens.
 *
 * DE KNOPPEN ZIJN GEEN SLOT
 *
 * Net als bij de herstelcode hierboven: dit blok verschijnt op grond van een
 * antwoord uit de database, en wie dat antwoord in zijn browser vervalst krijgt
 * een lijst te zien die leeg blijft en knoppen die weigeren. De grens ligt in
 * `kal_testers` en `kal_tester_zetten`.
 */
function Testerbeheer() {
  const [lijst, zetLijst] = useState<Tester[] | null>(null)
  const [bezig, zetBezig] = useState<string | null>(null)
  const [fout, zetFout] = useState<string | null>(null)

  const haal = async () => {
    const tk = sessietoken()
    if (!tk) return
    try {
      const uit = await roep('kal_testers', { p_token: tk })
      zetLijst(Array.isArray(uit) ? uit : null)
    } catch { /* geen beheerder, of bestand 48 is nog niet gedraaid */ }
  }

  useEffect(() => { void haal() }, [])

  const zet = async (account: string, velden: {
    p_status?: string; p_budget?: number
  }) => {
    const tk = sessietoken()
    if (!tk) return
    zetBezig(account)
    zetFout(null)
    try {
      const uit = await roep('kal_tester_zetten', { p_token: tk, p_account: account, ...velden })
      if (uit && 'fout' in uit) { zetFout(uit.fout); return }
      await haal()
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(null)
    }
  }

  if (!lijst) return null

  /* Wie wacht staat bovenaan, want dat is het enige waar iets van jou moet
     gebeuren. De rest op naam, zodat de lijst niet danst bij elke wijziging. */
  const orde = { wacht: 0, toegelaten: 1, afgewezen: 2 } as Record<string, number>
  const op = [...lijst].sort((a, b) =>
    (orde[a.status] ?? 3) - (orde[b.status] ?? 3) || a.account.localeCompare(b.account))
  const wachtend = op.filter((x) => x.status === 'wacht').length
  const usd = op.reduce((s, x) => s + (Number(x.maand_usd) || 0), 0)

  return (
    <div style={{ marginTop: 18 }}>
      <Tussen>
        <Kop>Testers</Kop>
        <span className="eyebrow" style={{ color: wachtend ? 'var(--let)' : 'var(--grijs)' }}>
          {wachtend === 0 ? 'niemand wacht'
           : wachtend === 1 ? '1 wacht op je' : `${wachtend} wachten op je`}
        </span>
      </Tussen>
      <p className="mini" style={{ marginTop: 4 }}>
        Wie wacht kan de app al gebruiken: wegen, loggen en alle figuren. Alleen het herkennen van
        maaltijden uit tekst of foto loopt op jouw sleutel, en dat is wat je hier toelaat. Het
        budget is een aantal herkenningen per kalendermaand.
      </p>

      {fout && <p className="mini" style={{ color: 'var(--let)', marginTop: 6 }}>{fout}</p>}

      <Kaart plat style={{ marginTop: 8 }}>
        <div className="lijst">
          {op.map((x) => (
            <div key={x.account} style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className="klein" style={{ flex: '0 0 96px', fontWeight: 600 }}>
                {x.account}
              </span>
              <span className={'vlaggetje ' + (x.status === 'toegelaten' ? 'goed'
                : x.status === 'wacht' ? 'let' : 'rust')}>
                {x.status}
              </span>
              <span className="mini groei">
                {x.maand_aanroepen} van {x.budget} deze maand
                {x.laatst_actief && <> · laatst {kortNL(x.laatst_actief.slice(0, 10) as IsoDatum)}</>}
              </span>
              {x.status !== 'toegelaten' && (
                <Knop klein uit={bezig === x.account}
                      opKlik={() => void zet(x.account, { p_status: 'toegelaten' })}>
                  toelaten
                </Knop>
              )}
              {x.status !== 'afgewezen' && !x.beheerder && (
                <Knop klein uit={bezig === x.account}
                      opKlik={() => void zet(x.account, { p_status: 'afgewezen' })}>
                  afwijzen
                </Knop>
              )}
              {/* Breder dan `.smal`, want de eigenaar staat op honderdduizend en
                  dat past niet in een vak dat voor kilo's gemaakt is. */}
              <input type="number" step="10" min="0" className="smal" defaultValue={x.budget}
                     style={{ width: 88 }} aria-label={`budget van ${x.account}`}
                     onBlur={(e) => {
                       const n = Number(e.target.value)
                       if (Number.isFinite(n) && n >= 0 && n !== x.budget) {
                         void zet(x.account, { p_budget: n })
                       }
                     }} />
            </div>
          ))}
        </div>
      </Kaart>

      <p className="mini" style={{ marginTop: 8 }}>
        Deze maand ging er ${usd.toFixed(2)} doorheen over alle accounts samen. Dat bedrag rekent
        met een vast Sonnet-tarief; draait er een ander model, dan is het een onderschatting. Het
        aantal herkenningen klopt wel altijd, en daarom staat het budget daarin.
      </p>
    </div>
  )
}

/**
 * JE EIGEN SLEUTEL
 *
 * De proefrit loopt op de sleutel van de eigenaar en is met opzet klein: genoeg
 * om te voelen wat het model met een foto van je bord doet, niet genoeg om er
 * maanden op te draaien. Wie verder wil, geeft zijn eigen sleutel op en betaalt
 * zijn eigen rekening.
 *
 * WAT HET SCHERM EERLIJK MOET ZEGGEN
 *
 * Dat de sleutel hier wordt bewaard. Niet in je browser, maar in de database
 * van deze app, versleuteld, en alleen te lezen door de functie die de
 * herkenning doet. Dat is beter dan een sleutel in een browser en het is geen
 * garantie, en wie een betaalsleutel afgeeft hoort te weten aan wie.
 *
 * Dat hij nooit meer terugkomt. Er is geen knop die hem laat zien, ook niet aan
 * jou. Je ziet de laatste vier tekens en verder niets. Wie zijn sleutel kwijt
 * is maakt een nieuwe bij zijn aanbieder.
 *
 * En dat hij hier niet uitgeprobeerd wordt. De database belt niet naar buiten,
 * dus of de sleutel werkt blijkt bij de eerste herkenning. Dat staat erbij,
 * want anders is "opgeslagen" een belofte die de app niet heeft gedaan.
 */
function EigenSleutel({ t, opnieuw }: { t: Toegang; opnieuw: () => void }) {
  const [open, zetOpen] = useState(false)
  const [aanbieder, zetAanbieder] = useState<Aanbieder>('anthropic')
  const [sleutel, zetSleutel] = useState('')
  const [fout, zetFout] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  if (t.status === 'onbekend') return null

  const bewaar = async () => {
    const tk = sessietoken()
    if (!tk) return
    zetBezig(true)
    zetFout(null)
    try {
      const uit = await roep('kal_sleutel_zetten',
        { p_token: tk, p_aanbieder: aanbieder, p_sleutel: sleutel.trim() })
      if ('fout' in uit) { zetFout(uit.fout); return }
      zetSleutel('')
      zetOpen(false)
      opnieuw()
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  const haalWeg = async () => {
    const tk = sessietoken()
    if (!tk) return
    zetBezig(true)
    try {
      await roep('kal_sleutel_weghalen', { p_token: tk })
      opnieuw()
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (t.eigenSleutel && !open) {
    return (
      <div style={{ marginTop: 14 }}>
        <Kop>Je eigen sleutel</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          De herkenning loopt op je eigen sleutel bij{' '}
          <b>{t.aanbieder ? AANBIEDERNAAM[t.aanbieder] : 'je aanbieder'}</b>
          {t.staart && <>, die eindigt op <span className="cijfer">{t.staart}</span></>}. Het
          maandbudget van de beheerder geldt niet meer voor jou; wat je gebruikt staat op je
          eigen rekening.
        </p>
        <Rij style={{ marginTop: 8 }}>
          <Knop klein opKlik={() => zetOpen(true)}>andere sleutel</Knop>
          <Knop klein uit={bezig} opKlik={() => void haalWeg()}>sleutel weghalen</Knop>
        </Rij>
        {fout && <p className="mini" style={{ color: 'var(--let)', marginTop: 6 }}>{fout}</p>}
      </div>
    )
  }

  if (!open) {
    return (
      <p className="mini" style={{ marginTop: 10 }}>
        <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
          Je eigen AI-sleutel gebruiken
        </button>
        {' '}, dan geldt het maandbudget niet meer voor jou.
      </p>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      <Kop>Je eigen sleutel</Kop>
      <p className="mini" style={{ marginTop: 4 }}>
        De herkenning van maaltijden loopt nu op de sleutel van de beheerder, en die is
        begrensd. Geef je je eigen sleutel op, dan loopt hij op jouw rekening en vervalt die
        grens. De rest van de app verandert er niet van.
      </p>

      <Rij style={{ marginTop: 10 }}>
        {(['anthropic', 'openai'] as const).map((a) => (
          <Keuzechip key={a} aan={aanbieder === a} opKlik={() => zetAanbieder(a)}>
            {AANBIEDERNAAM[a]}
          </Keuzechip>
        ))}
      </Rij>

      <input type="password" autoComplete="off" spellCheck={false}
             className="veld" style={{ marginTop: 8, width: '100%' }}
             placeholder={aanbieder === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
             aria-label="Je API-sleutel"
             value={sleutel} onChange={(e) => zetSleutel(e.target.value)} />

      {fout && <p className="mini" style={{ color: 'var(--let)', marginTop: 6 }}>{fout}</p>}

      <Rij style={{ marginTop: 10 }}>
        <Knop vol uit={bezig || sleutel.trim().length < 30} opKlik={() => void bewaar()}>
          Bewaren
        </Knop>
        <Knop uit={bezig} opKlik={() => { zetOpen(false); zetSleutel(''); zetFout(null) }}>
          Terug
        </Knop>
      </Rij>

      <Uitleg id="sleutel-waar" label="waar je sleutel terechtkomt">
        <p>
          Hij gaat versleuteld de database van deze app in, en alleen de functie die de
          herkenning doet kan hem uitlezen. Er is geen knop die hem laat zien, ook niet aan
          jou: je ziet straks de laatste vier tekens en verder niets. Dat is beter dan een
          sleutel in een browser en het is geen garantie, en je hoort te weten aan wie je hem
          afgeeft.
        </p>
        <p>
          Hij wordt hier niet uitgeprobeerd, want deze database belt niet naar buiten. Of hij
          werkt blijkt bij je eerste herkenning. Klopt er iets niet, dan zegt je aanbieder dat
          en komt die zin gewoon op je scherm.
        </p>
        <p>
          Je kunt hem er altijd zelf weer uithalen, en dan val je terug op het budget van de
          beheerder. Bij je aanbieder kun je een sleutel bovendien op elk moment intrekken;
          dat is de knop die altijd werkt, ook als je deze app niet vertrouwt.
        </p>
      </Uitleg>

      <Uitleg id="sleutel-hoe" label="hoe je er een maakt, en wat het kost">
        <p>
          <b>Anthropic.</b> Maak een account op console.anthropic.com, zet er onder Billing een
          tegoed op (het minimum is vijf dollar) en maak daarna onder API Keys een nieuwe
          sleutel. Hij begint met sk-ant- en je ziet hem één keer, dus plak hem meteen hier.
          Dit is de aanbieder waarop de herkenning van deze app gebouwd en getoetst is.
        </p>
        <p>
          <b>OpenAI.</b> Hetzelfde patroon op platform.openai.com: een account, tegoed onder
          Billing, en dan een sleutel onder API keys. Die begint met sk-. Let op dat een
          ChatGPT-abonnement hier niet voor telt; dat is een andere dienst dan de API en geeft
          je geen sleutel.
        </p>
        <p>
          Wat het kost: een herkenning is grofweg een paar dollarcent, dus vijf dollar tegoed
          is al gauw een paar honderd maaltijden. Je betaalt per gebruik en er loopt niets door
          als je de app een maand laat liggen. Zet bij je aanbieder een maandlimiet, dan kan
          het ook niet uit de hand lopen.
        </p>
        <p>
          Welke van de twee: de hele herkenning is op Anthropic gebouwd en daar zijn de
          gouden waarden van deze app op tot stand gekomen. Het OpenAI-pad is met dezelfde
          schema's gebouwd maar nog niet tegen een echte sleutel gedraaid. Werkt er iets niet
          zoals verwacht, meld het dan; in het logboek staat per herkenning welk model hem
          deed.
        </p>
      </Uitleg>
    </div>
  )
}
