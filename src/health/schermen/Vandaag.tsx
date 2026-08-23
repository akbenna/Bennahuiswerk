/**
 * VANDAAG — het scherm waar de dag op gebeurt.
 *
 * Dit scherm was een formulier. Drie invulvelden, twee nullen en een leeg
 * tekstvak; alles klopte en niemand had zin om het te openen. Wie de app voor
 * het eerst opende zag "0 van 161 g", "0 kcal" en "nog geen doel" — drie keer
 * de mededeling dat er niets is.
 *
 * Wat er nu staat begint bij wat er wél is. Bovenaan één beeld dat de dag
 * samenvat, met een ring die de onzekerheidsband toont in plaats van een harde
 * streep: dat is de stelling van deze app als plaatje in plaats van als
 * voetnoot. Is er nog geen doel, dan telt diezelfde ring af naar de zevende
 * weging — een bereikbaar doel in plaats van een lege mededeling.
 *
 * Daaronder vier maaltijdvakken die er altijd staan, ook leeg. Een leeg vak met
 * een naam en een uitnodiging is iets heel anders dan een leeg scherm.
 *
 * En sinds kort zijn die vakken ook de ingang: je tikt op het vak en het
 * invoervel gaat open met dat moment er al in. Het tekstvak dat hier stond is
 * daarheen verhuisd. Het hoorde hier niet — loggen gebeurt op drie manieren
 * (herhalen, zoeken, beschrijven) en die horen bij elkaar te staan, niet één op
 * dit scherm, één op het volgende tabblad en één in een derde venster.
 */
import { useEffect, useState } from 'react'
import { Chip, Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Dagenstrook, Doelring } from '../hero'
import type { Dagstaaf } from '../hero'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL, langNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import type { NieuweRegel } from '@/gedeeld/db/rpc'
import type { Analyse, Dagenkaart, DagMetTotalen } from '../rekenkern'
import { momentNu } from '../vensters/Portie'
import { meldenNu, tekort, voorstellen } from '../coach'
import { herhaalRegel } from '../herhaal'

export interface VandaagEigenschappen {
  a: Analyse
  dag: DagMetTotalen
  regels: Regel[]
  /** De hele geschiedenis, want de coach stelt voor uit wat je zelf eet. */
  alleRegels: Regel[]
  /** De hele reeks, voor de dagenstrook onder de ring. */
  dagen: Dagenkaart
  datum: IsoDatum
  eiwitPerKg: number
  zetDatum: (d: IsoDatum) => void
  zetDagveld: (veld: string, waarde: string | number | boolean | null) => void
  /** Het invoervel openen, met het moment er al in. */
  opInvoer: (m: Moment) => void
  wisRegel: (id: string) => void
  /** Eén tik op een voorstel zet het meteen op de dag. */
  voegToe: (regels: NieuweRegel[]) => void
}

/**
 * De vier momenten van de dag, met hun kleur en hun uitnodiging.
 *
 * `kort` is wat er in het vak past als er vier naast elkaar staan. Het volle
 * woord blijft in de titel en in de schermlezer staan — een afgekapt
 * "Tussend…" is minder duidelijk dan een korter woord dat wél af is.
 */
const MOMENTEN: Array<{ id: Moment; naam: string; kort: string; klas: string; leeg: string }> = [
  { id: 'ontbijt', naam: 'Ontbijt', kort: 'Ontbijt', klas: 'ochtend', leeg: 'Koffie telt ook' },
  { id: 'lunch', naam: 'Lunch', kort: 'Lunch', klas: 'middag', leeg: 'Brood, salade, restje' },
  { id: 'diner', naam: 'Diner', kort: 'Diner', klas: 'avond', leeg: 'Het bord van vanavond' },
  { id: 'tussendoor', naam: 'Tussendoor', kort: 'Tussen', klas: 'tussen',
    leeg: 'Noten, fruit, een koekje' },
]

/**
 * Het verloop van de hero volgt het uur: warm bij het begin van de dag, koel
 * aan het eind. Oriëntatie, geen effect — je ziet aan de kleur of je aan het
 * begin of aan het eind van je dag staat.
 *
 * Het verloop gaat als inline stijl naar binnen, en inline stijl luistert niet
 * naar een media query. Er moeten dus twee sets zijn en de app moet zelf kijken
 * welke geldt; anders staat er in het donkere thema lichte tekst op een lichte
 * achtergrond, en dat is niet lelijk maar onleesbaar.
 */
const HERO = {
  licht: [
    ['linear-gradient(155deg,#FBEEDA 0%,#F4E0D2 55%,#EDD7CE 100%)', 'rgba(255,247,235,.75)'],
    ['linear-gradient(155deg,#EAF1E6 0%,#DFEBE6 55%,#D8E7E4 100%)', 'rgba(255,255,255,.7)'],
    ['linear-gradient(155deg,#E4E9F1 0%,#DCE2EE 55%,#D6DCEA 100%)', 'rgba(255,255,255,.55)'],
  ],
  donker: [
    ['linear-gradient(155deg,#2A2118 0%,#251C17 55%,#201A16 100%)', 'rgba(255,214,150,.10)'],
    ['linear-gradient(155deg,#1A2320 0%,#18211E 55%,#161E1D 100%)', 'rgba(180,255,220,.08)'],
    ['linear-gradient(155deg,#181C26 0%,#171B24 55%,#151821 100%)', 'rgba(160,190,255,.08)'],
  ],
} as const

const GROET = ['Goedemorgen', 'Goedemiddag', 'Goedenavond'] as const

function heroKleur(uur: number, donker: boolean): { achtergrond: string; glans: string; groet: string } {
  const i = uur < 11 ? 0 : uur < 18 ? 1 : 2
  const [achtergrond, glans] = (donker ? HERO.donker : HERO.licht)[i]
  return { achtergrond, glans, groet: GROET[i] }
}

/** Volgt het thema van het toestel, ook als dat halverwege omslaat. */
function useDonker(): boolean {
  const [donker, zet] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme:dark)').matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const vraag = matchMedia('(prefers-color-scheme:dark)')
    const kijk = (): void => zet(vraag.matches)
    vraag.addEventListener('change', kijk)
    return () => vraag.removeEventListener('change', kijk)
  }, [])
  return donker
}

export function Vandaag(p: VandaagEigenschappen) {
  const donker = useDonker()
  const { a, dag, regels, datum } = p
  const isVandaag = datum === vandaag()
  const gewogen = dag.gewicht_kg != null

  /* Hoeveel wegingen er nog nodig zijn voordat het model iets durft te zeggen.
     Dat getal is de enige zinvolle aanmoediging die de app kan geven: het is
     geen streefcijfer maar een telling. */
  const nogNodig = Math.max(0, 7 - a.wPunten.length)
  const kalibreert = a.doel == null

  const kleur = heroKleur(new Date().getHours(), donker)
  const koolh = regels.reduce((n, r) => n + (r.koolhydraat_g ?? 0), 0)
  const vet = regels.reduce((n, r) => n + (r.vet_g ?? 0), 0)

  /* De strook van veertien dagen. Hij staat er ook — juist — als er weinig in
     staat: dan laat hij zien dat er iets te beginnen valt. */
  const strook: Dagstaaf[] = Array.from({ length: 14 }, (_, i) => {
    const d = plusDagen(datum, i - 13)
    const x = p.dagen[d]
    return {
      d,
      gewogen: x?.gewicht_kg != null,
      gelogd: (x?._kcal ?? 0) > 0,
      deel: a.doel ? Math.min(1.2, (x?._kcal ?? 0) / a.doel) : ((x?._kcal ?? 0) > 0 ? 0.7 : 0),
    }
  })

  /* De reeks: hoeveel dagen achter elkaar er iets gebeurd is, terugtellend
     vanaf vandaag. Dit is de enige teller in de app die niet over gewicht gaat,
     en juist daarom de enige die op een slechte dag nog overeind staat. */
  let reeksNu = 0
  for (let i = strook.length - 1; i >= 0; i--) {
    const x = strook[i]
    if (!x || (!x.gewogen && !x.gelogd)) break
    reeksNu++
  }

  const status = (() => {
    const doel = a.doel ?? 0
    if (dag._kcal === 0) return { zin: 'Nog niets gelogd vandaag. Eén regel is genoeg om te beginnen.' }
    if (dag._kcal > doel * 1.08) {
      return { zin: 'Boven de streep van vandaag. Eén dag zegt niets — de weegreeks corrigeert het vanzelf.' }
    }
    if (dag._kcal >= doel * 0.9) return { zin: 'Je zit er precies op.' }
    return { zin: `Nog ${dz(Math.max(0, Math.round(doel - dag._kcal)))} kcal te gaan.` }
  })()

  const perMoment = (m: Moment): Regel[] =>
    regels.filter((r) => (r.moment === 'onbekend' ? m === 'tussendoor' : r.moment === m))

  return (
    <>
      <Tussen style={{ marginBottom: 12 }}>
        <Knop klein opKlik={() => p.zetDatum(plusDagen(datum, -1))} titel="Vorige dag">←</Knop>
        <span style={{ fontSize: '.88rem', fontWeight: 500 }}>
          {isVandaag ? 'Vandaag' : langNL(datum)}
        </span>
        <Knop klein uit={isVandaag} titel="Volgende dag"
              opKlik={() => { const n = plusDagen(datum, 1); if (n <= vandaag()) p.zetDatum(n) }}>
          →
        </Knop>
      </Tussen>

      <section className="hero"
               style={{ '--herobg': kleur.achtergrond, '--heroglow': kleur.glans } as React.CSSProperties}>
        <div className="heroglans" />
        <div className="heroboven">
          <div>
            <span className="eyebrow">{isVandaag ? kleur.groet : kortNL(datum)}</span>
            <h2 style={{ marginTop: 2 }}>
              {kalibreert
                ? 'Het model leert je nog'
                : !gewogen ? 'Stap op de weegschaal'
                : dag._kcal === 0 ? 'Wat heb je vandaag gegeten?'
                : 'Je dag tot nu toe'}
            </h2>
          </div>
          <span className={'vlaggetje ' + (gewogen ? 'goed' : 'rust')}>
            {gewogen ? '✓ gewogen' : '— niet gewogen'}
          </span>
        </div>

        <div className="heroring">
          <Doelring
            waarde={kalibreert ? a.wPunten.length : dag._kcal}
            doel={kalibreert ? 7 : a.doel}
            laag={kalibreert ? null : dag._laag}
            hoog={kalibreert ? null : dag._hoog}
            kind={kalibreert ? (
              <>
                <span className="getal" style={{ fontSize: '1.75rem' }}>{a.wPunten.length}</span>
                <span className="mini">van 7<br />wegingen</span>
              </>
            ) : (
              <>
                <span className="getal" style={{ fontSize: '1.65rem' }}>{dz(Math.round(dag._kcal))}</span>
                <span className="mini">van {dz(a.doel ?? 0)}<br />kcal</span>
              </>
            )}
          />
          <div className="herocijfers">
            {kalibreert ? (
              <p style={{ fontSize: '.9rem' }}>
                Nog <b>{nogNodig}</b> ochtendweging{nogNodig === 1 ? '' : 'en'}, dan zegt het model
                wat jouw lichaam werkelijk verbruikt — gemeten aan jou, niet uit een formule.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '.95rem' }}>{status.zin}</p>
                <p className="mini" style={{ marginTop: 6 }}>
                  Wat je logde ligt tussen{' '}
                  <span className="cijfer">{dz(Math.round(dag._laag))}</span> en{' '}
                  <span className="cijfer">{dz(Math.round(dag._hoog))}</span> kcal. Het lichte deel
                  van de ring is die marge.
                </p>
              </>
            )}
          </div>
        </div>

        <Dagenstrook dagen={strook} nu={datum} />
        <div className="mini" style={{ marginTop: 6 }}>
          veertien dagen · <b>{strook.filter((x) => x.gewogen).length}×</b> gewogen ·{' '}
          <b>{strook.filter((x) => x.gelogd).length}×</b> gelogd
          {reeksNu > 1 && <> · <b>{reeksNu} dagen op rij</b></>}
        </div>

        <div className="macros">
          <Macro naam="Eiwit" klas="eiwit" gram={dag._eiwit} doel={a.eiwitDoel}
                 kcalTotaal={dag._kcal} perGram={4} />
          <Macro naam="Koolhydraten" klas="koolh" gram={koolh} doel={null}
                 kcalTotaal={dag._kcal} perGram={4} />
          <Macro naam="Vet" klas="vet" gram={vet} doel={null}
                 kcalTotaal={dag._kcal} perGram={9} />
        </div>
      </section>

      {isVandaag && <Coachkaart {...p} />}

      <Weging {...p} gewogen={gewogen} isVandaag={isVandaag} nogNodig={nogNodig} />

      {/* Eén knop met een vulling op het hele scherm. Wie de app opent om te
          loggen — en dat is de gewone reden — hoeft niet te zoeken waar dat
          kan. Het moment wordt uit de klok geraden; in het vel kun je het met
          één tik veranderen. */}
      <button type="button" className="hoofdknop" style={{ marginBottom: 14 }}
              onClick={() => p.opInvoer(momentNu(datum))}>
        <span aria-hidden="true">＋</span>
        <span>Eten toevoegen</span>
      </button>

      <Kaart>
        <Kop>De dag in vier momenten</Kop>
        <div className="maaltijden" style={{ marginTop: 10 }}>
          {MOMENTEN.map((m) => {
            const eigen = perMoment(m.id)
            const kcal = eigen.reduce((n, r) => n + r.kcal_punt, 0)
            return (
              <div key={m.id} className={'maal ' + m.klas + (eigen.length ? ' gevuld' : '')}>
                {/* De kop is de knop. Het vak zelf kan dat niet zijn: er staan
                    wisknoppen in, en een knop in een knop is geen knop meer. */}
                <button type="button" className="maalvoeg"
                        onClick={() => p.opInvoer(m.id)}
                        title={`Iets toevoegen aan je ${m.naam.toLowerCase()}`}>
                  <span className="maalkop">
                    <span className="stip" />
                    <span className="maalnaam">{m.kort}</span>
                    <span style={{ flex: 1 }} />
                    {/* Alleen het aantal, niet 'regels' erbij: in vier kolommen
                        naast elkaar is dat het verschil tussen passen en
                        afkappen. Het woord staat in de titel. */}
                    {eigen.length > 0 && (
                      <span className="mini cijfer"
                            title={`${eigen.length} regel${eigen.length === 1 ? '' : 's'}`}>
                        {eigen.length}×
                      </span>
                    )}
                    <span className="maalplus" aria-hidden="true">＋</span>
                  </span>
                  {eigen.length === 0 ? (
                    <span className="mini maalleeg">{m.leeg}</span>
                  ) : (
                    <span className="maalgetal">{dz(Math.round(kcal))}
                      <span className="klein" style={{ fontSize: '.72rem' }}> kcal</span>
                    </span>
                  )}
                </button>
                {eigen.length > 0 && (
                  <div className="lijst" style={{ marginTop: 2 }}>
                    {/* Twee regels en niet één. Op één regel moesten de naam,
                        de graad, de calorieën en de wisknop naast elkaar, en
                        dan bleef er van 'Havermout met melk en banaan' precies
                        'Haver…' over. De naam krijgt nu de hele breedte. */}
                    {eigen.map((r) => (
                      <div key={r.id} style={{ padding: '5px 0' }}>
                        <span className="groei">
                          <span className="knip" style={{ fontSize: '.8rem', display: 'block' }}>
                            {r.naam}
                          </span>
                          <span className="mini">
                            <Chip graad={r.conf} /> {dz(Math.round(r.kcal_punt))} kcal
                          </span>
                        </span>
                        <Knop klein titel={`${r.naam} verwijderen`}
                              opKlik={() => p.wisRegel(r.id)}>×</Knop>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {regels.length === 0 && (
          <p className="mini" style={{ marginTop: 10 }}>
            Nog niets gelogd op {kortNL(datum)}. Eén regel is genoeg om te beginnen — het model
            rekent liever met de helft dan met niets. Tik een vak aan, of gebruik de knop hierboven.
          </p>
        )}
      </Kaart>

      <Kaart>
        <Kop>Beweging en slaap</Kop>
        <Rij style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <label className="veld">
            <span>stappen</span>
            <input className="smal" type="number" inputMode="numeric"
                   defaultValue={dag.stappen ?? ''} key={'st' + datum}
                   onBlur={(e) => p.zetDagveld('stappen', e.target.value || null)} />
          </label>
          <label className="veld">
            <span>slaap, uur</span>
            <input className="smaller" type="number" step="0.25" inputMode="decimal"
                   key={'sl' + datum}
                   defaultValue={dag.slaap_min != null ? Math.round(dag.slaap_min / 15) / 4 : ''}
                   onBlur={(e) => p.zetDagveld(
                     'slaap_min', e.target.value === '' ? null : Math.round(parseFloat(e.target.value) * 60))} />
          </label>
          <Knop vol={!!dag.kracht} opKlik={() => p.zetDagveld('kracht', !dag.kracht)}>
            {dag.kracht ? '✓ ' : ''}kracht
          </Knop>
        </Rij>
        <Uitleg id="beweging" label="waarom stappen hier alleen staan">
          <p>
            Stappen en slaap staan hier omdat ze ergens vandaan moeten komen, niet omdat het model
            ermee rekent. De actieve energie die je horloge erbij optelt gaat nooit naar het doel: die
            fout is twintig tot vijftig procent en niet consistent in één richting, dus corrigeren kan
            niet.
          </p>
          <p>
            Wat stappen wél doen, doen ze via de weegschaal. Beweeg je structureel meer, dan verschuift
            de helling, en dat ziet het model vanzelf — zonder dat er iets bij opgeteld hoeft te worden.
          </p>
        </Uitleg>
      </Kaart>

      <Uitleg id="eiwitref" label="waarom het eiwitdoel op gecorrigeerd gewicht staat">
        <p>
          Het eiwitdoel staat op gecorrigeerd gewicht en niet op je werkelijke gewicht: vetmassa
          vraagt nauwelijks eiwit, dus rekenen op {dec(a.gewicht, 0)} kilo geeft een doel dat niemand
          haalt en dat nergens op slaat. De correctie kapt het referentiegewicht af op BMI 30, wat
          voor jou {dec(a.eiwitRef, 0)} kilo geeft — {dec(p.eiwitPerKg, 1)} g/kg maakt {a.eiwitDoel} g.
        </p>
        <p>
          Waarom het hoog staat: bij een tekort is eiwit wat bepaalt of je gewichtsverlies uit vet
          komt of ook uit spier.
        </p>
      </Uitleg>
    </>
  )
}

/**
 * Eén macro-staafje.
 *
 * Eiwit heeft een doel, dus daar is een vulling zinvol: de balk zegt hoe ver je
 * bent. Koolhydraten en vet hebben er geen — deze app schrijft geen verdeling
 * voor. Een volle balk zetten omdat er "iets" gelogd is zou precies de
 * schijnprecisie zijn waar de rest van de app zich tegen verzet.
 *
 * Wat er dan wél staat: het aandeel in de energie van vandaag. Dat is een
 * gemeten verhouding en geen verzonnen doel, en het is het enige aan die twee
 * getallen wat je iets vertelt.
 */
function Macro(
  { naam, klas, gram, doel, kcalTotaal, perGram }:
  { naam: string; klas: string; gram: number; doel: number | null
    kcalTotaal: number; perGram: number },
) {
  const heeftDoel = doel != null && doel > 0
  const aandeel = kcalTotaal > 0 ? Math.min(100, (gram * perGram) / kcalTotaal * 100) : 0
  const deel = heeftDoel ? Math.min(100, (gram / doel) * 100) : aandeel
  return (
    <div className={'macro ' + klas}>
      <div className="mini">{naam}</div>
      <div>
        <b>{Math.round(gram)}</b>
        <span className="mini"> {heeftDoel ? `/ ${doel} g` : 'g'}</span>
      </div>
      <div className="staaf"><i style={{ width: `${deel}%` }} /></div>
      <div className="mini" style={{ marginTop: 3 }}>
        {heeftDoel
          ? `${Math.round(deel)}% van je doel`
          : kcalTotaal > 0 ? `${Math.round(aandeel)}% van de energie` : '—'}
      </div>
    </div>
  )
}

function Weging(
  { dag, datum, gewogen, isVandaag, nogNodig, zetDagveld }:
  VandaagEigenschappen & { gewogen: boolean; isVandaag: boolean; nogNodig: number },
) {
  /* Is er al gewogen, dan hoeft dit vak niet meer te schreeuwen: de hero zegt
     het al. Het blijft staan om te kunnen corrigeren, maar dan klein. */
  const moetNog = !gewogen && isVandaag
  return (
    <Kaart toon={moetNog ? 'let' : undefined}
           style={moetNog ? undefined : { paddingTop: 13, paddingBottom: 13 }}>
      <Tussen>
        <Kop>Ochtendweging</Kop>
        {gewogen && <span className="vlaggetje goed">✓ gedaan</span>}
      </Tussen>
      <Rij style={{ marginTop: 8, alignItems: 'center' }}>
        <input className="smal" type="number" step="0.1" inputMode="decimal" placeholder="—"
               key={'gw' + datum} defaultValue={dag.gewicht_kg ?? ''}
               aria-label="Gewicht in kilo"
               onBlur={(e) => zetDagveld('gewicht_kg', e.target.value || null)}
               style={moetNog ? { fontSize: '1.3rem', width: 112 } : undefined} />
        <span className="klein">
          kg{moetNog && ' · nuchter, na het toilet, vóór het eten'}
        </span>
      </Rij>
      {moetNog && nogNodig > 0 && (
        <p className="mini" style={{ marginTop: 8 }}>
          Nog {nogNodig} weging{nogNodig === 1 ? '' : 'en'} voordat het model een verbruik met interval
          kan tonen.
        </p>
      )}
      <Uitleg id="weging" label="waarom dit de kern is">
        <p>
          Dit is de enige invoer die niet te schatten valt, en het enige onbevooroordeelde signaal in
          het systeem. Alles wat je eet gaat door een schatting heen; de weegschaal niet.
        </p>
        <p>
          Nuchter, na het toilet, vóór het eten — steeds op dezelfde manier, want het gaat om het
          verschil tussen dagen en niet om de absolute waarde. Dagelijkse schommelingen van één tot
          twee kilo zijn vocht, glycogeen en darminhoud. Daarom leest het model de helling en niet de
          meting.
        </p>
      </Uitleg>
    </Kaart>
  )
}

/* ==========================================================================
   DE COACH — wat er nog in past, en wat dat kan vullen
   ==========================================================================

   Het rekenwerk staat in `coach.ts` en is daar bewezen; hier staat alleen hoe
   het eruitziet. Twee dingen zijn ontwerp en geen toeval.

   Er staat bij elk voorstel wat het jou oplevert en wat er daarna nog overblijft.
   Een lijstje namen is een menukaart; "nog 200 kcal en 20 g eiwit te gaan" is
   een antwoord op de vraag die je stelde.

   En de kaart durft leeg te zijn. Past er niets meer uit wat je de laatste weken
   at, dan zegt hij dat, in plaats van het dichtstbijzijnde te tonen. Een
   voorstel dat je over je doel zet is erger dan geen voorstel.
*/
function Coachkaart(p: VandaagEigenschappen) {
  const { a, dag, alleRegels, datum } = p
  const moment = momentNu(datum)
  const uur = new Date().getHours()

  const t = tekort(
    { kcal: dag._kcal, kcalLaag: dag._laag, kcalHoog: dag._hoog, eiwit: dag._eiwit },
    a.doel, a.eiwitDoel,
  )
  /* Zonder doel heeft het model nog niets te zeggen, en dan zwijgt de kaart
     helemaal in plaats van een kop met niets eronder te tonen. */
  if (a.doel == null) return null

  const lijst = voorstellen(alleRegels, t, { nu: datum, moment })
  const let_op = meldenNu(t, uur)

  return (
    <Kaart toon={let_op.reden === 'bijna-op' ? 'let' : undefined}>
      <Tussen>
        <Kop>Wat er nog in past</Kop>
        {let_op.melden && (
          <span className={'vlaggetje ' + (let_op.reden === 'bijna-op' ? 'let' : 'rust')}>
            {let_op.reden === 'eiwit-achter' ? 'eiwit loopt achter'
              : let_op.reden === 'bijna-op' ? 'ruimte bijna op'
              : 'veel ruimte over'}
          </span>
        )}
      </Tussen>

      {t.erover ? (
        <p className="klein" style={{ marginTop: 6 }}>
          Je zit <span className="cijfer">{dz(Math.abs(Math.round(t.kcalOver)))}</span> kcal over je
          doel. Eén dag is geen trend — de weegreeks van morgen zegt meer dan dit getal.
        </p>
      ) : (
        <p className="klein" style={{ marginTop: 6 }}>
          Nog <span className="cijfer">{dz(Math.round(t.kcalOver))}</span> kcal
          {' '}<span className="mini">
            ({dz(Math.round(t.kcalOverLaag))}–{dz(Math.round(t.kcalOverHoog))})
          </span>
          {t.eiwitOver > 0
            ? <> en <span className="cijfer">{Math.round(t.eiwitOver)}</span> g eiwit te gaan
                — dat vraagt <span className="cijfer">{dec((t.eis ?? 0) * 100, 1)}</span> g eiwit
                per 100 kcal in alles wat er nog bij komt.</>
            : <>. Je eiwit is binnen.</>}
        </p>
      )}

      {lijst.length > 0 && (
        <div className="lijst" style={{ marginTop: 10 }}>
          {lijst.map((v) => (
            <div key={v.herhaling.sleutel}>
              <div className="groei">
                <div className="knip">{v.naam}</div>
                {/* Eén getal maakt de vier voorstellen vergelijkbaar: eiwit per
                    100 kcal, dezelfde maat waarin de eis staat. "Helpt je eiwit
                    niet" stond hier eerst, en dat is een oordeel op de plek waar
                    een getal hoort — 46 gram eiwit helpt natuurlijk wel; wat het
                    niet doet is de rést van de dag op tempo houden. */}
                <div className="mini">
                  <span className="cijfer">{dz(v.kcal)}</span> kcal ·{' '}
                  <span className="cijfer">{Math.round(v.eiwit)}</span> g eiwit
                  {' · '}<span className="cijfer">{dec(v.dichtheid * 100, 1)}</span> g/100 kcal
                  {v.reden === 'eiwit' && ' — houdt je eiwit op tempo'}
                  {' · daarna nog '}<span className="cijfer">{dz(v.restKcal)}</span> kcal
                  {v.restEiwit > 0 && <> en <span className="cijfer">{v.restEiwit}</span> g eiwit</>}
                </div>
              </div>
              <Knop klein opKlik={() => p.voegToe([herhaalRegel(v.herhaling, datum, moment)])}>
                ＋
              </Knop>
            </div>
          ))}
        </div>
      )}

      {!t.erover && lijst.length === 0 && (
        <p className="mini" style={{ marginTop: 8 }}>
          Uit wat je de laatste weken at past hier niets meer in zonder eroverheen te gaan.
        </p>
      )}

      <Uitleg id="coach" label="hoe deze lijst tot stand komt">
        <p>
          De voorstellen komen uit je eigen geschiedenis, met de portie die jij toen at — er wordt
          niets geschat en niets verzonnen.
        </p>
        {t.eis != null && (
          <p>
            Er zijn nog <span className="cijfer">{Math.round(t.eiwitOver)}</span> gram eiwit nodig
            in <span className="cijfer">{dz(Math.round(t.kcalOver))}</span> kcal. Alles wat je vanaf
            nu eet moet dus minstens <span className="cijfer">{dec(t.eis * 100, 1)}</span> gram
            eiwit per 100 kcal leveren, anders wordt de rest van de dag moeilijker in plaats van
            makkelijker. Dat is de eis waarop deze lijst gerangschikt is.
          </p>
        )}
        <p>
          Het bereik tussen haakjes komt van wat je logde: die getallen zijn geschat, dus wat je
          overhoudt is dat ook. Voorgesteld wordt er alleen binnen de puntschatting — onzekerheid
          is geen vergunning om erover te gaan.
        </p>
      </Uitleg>
    </Kaart>
  )
}
