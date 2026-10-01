/**
 * DE REKENKERN
 *
 * Overgezet uit sectie 3 van de oude index.html, regel voor regel, met typen
 * erbij en zonder één getal te veranderen. Dat is met opzet: elke keuze
 * hieronder is verantwoord in VERANTWOORDING.md tegen literatuur, en de
 * verwijzing staat erbij zodat een getal in het scherm terugvindbaar is. Wat
 * verantwoord is en werkt, herschrijf je niet, dat til je eruit.
 *
 * TWEE DINGEN ZIJN WÉL VERANDERD, EN DAAROM STAAN ZE HIER
 *
 * 1. `analyse()` riep zelf `vandaag()` aan. Daarmee was hij niet te testen: de
 *    uitkomst hing af van de klok van de machine. De dag is nu een argument met
 *    vandaag als standaard. Voor de app verandert er niets; voor de proef alles.
 *
 * 2. `onderhoudZone()` gaf een CSS-variabele terug (`var(--goed)`). Een
 *    rekenfunctie hoort geen kleur te kennen. De zone komt eruit, het scherm
 *    kiest de kleur. Zie klinisch.ts.
 */
import { dagVerschil, plusDagen, vandaag as vandaagNu } from '@/gedeeld/datum'
import type { Dag, IsoDatum, Profiel } from '@/gedeeld/db/tabellen'

/** De vuistregel van Wishnofsky (1958): 7.700 kcal per kilo lichaamsweefsel.
 *  Hier alleen als omrekenfactor achteraf, nooit als voorspeller, zie
 *  hoofdstuk 2, dat uitlegt waarom dat onderscheid het hele punt is. */
export const KCAL_PER_KG = 7700

/** Veelvoud van zeven: anders lekt het weekritme in de helling (Orsama 2014). */
export const VENSTER = 28

/**
 * Een dag met de voedingsregels er al bij opgeteld. De velden met een liggend
 * streepje ervoor zijn de optelling; de rest komt onveranderd uit kal_dagen.
 */
export interface DagMetTotalen extends Partial<Dag> {
  datum: IsoDatum
  _kcal: number
  _eiwit: number
  _laag: number
  _hoog: number
}

export type Dagenkaart = Record<IsoDatum, DagMetTotalen>

/** Wat het model over zichzelf durft te zeggen. */
export type Zekerheid = 'geen' | 'laag' | 'middel' | 'hoog'

/**
 * Of de uitkomst van de energiebalans fysiologisch kán kloppen.
 *
 * Los van `Zekerheid`, en dat onderscheid is het hele punt: "laag" betekent dat
 * het model het niet nauwkeurig weet, "onder-rust" betekent dat het antwoord
 * niet waar kan zijn. Het eerste mag je met een brede band tonen, het tweede
 * niet.
 */
export type TdeeOordeel = 'goed' | 'onder-rust' | 'boven-plafond'

/**
 * Mifflin-St Jeor. Aanbevolen bij overgewicht boven Harris-Benedict
 * (Frankenfield 2003). Blijft een prior, geen meting.
 */
export function bmr(pf: Pick<Profiel, 'lengte_cm' | 'leeftijd_jaar' | 'geslacht'>, w: number): number {
  return Math.round(
    10 * w + 6.25 * pf.lengte_cm - 5 * (pf.leeftijd_jaar ?? 0) + (pf.geslacht === 'm' ? 5 : -161),
  )
}

/**
 * Referentiegewicht voor het eiwitdoel: actueel gewicht met een plafond op
 * BMI 30 (Weijs 2025). Vetmassa vraagt geen eiwit; rekenen op actueel gewicht
 * geeft bij obesitas klinisch relevante overschatting (Dekker 2022).
 */
export function eiwitReferentie(pf: Pick<Profiel, 'lengte_cm'>, w: number): number {
  const m = pf.lengte_cm / 100
  return Math.min(w, 30 * m * m)
}

export interface Punt { x: number; y: number; datum?: IsoDatum }
export interface Regressie { helling: number; snij: number; se: number; n: number }

/**
 * Kleinste-kwadratenregressie. Levert helling én standaardfout; die laatste
 * voedt het betrouwbaarheidsinterval op het verbruik.
 */
export function regressie(p: readonly Punt[]): Regressie | null {
  const n = p.length
  if (n < 3) return null
  const mx = p.reduce((a, x) => a + x.x, 0) / n
  const my = p.reduce((a, x) => a + x.y, 0) / n
  const sxx = p.reduce((a, x) => a + (x.x - mx) ** 2, 0)
  if (!sxx) return null
  const sxy = p.reduce((a, x) => a + (x.x - mx) * (x.y - my), 0)
  const helling = sxy / sxx
  const snij = my - helling * mx
  const rest = p.reduce((a, x) => a + (x.y - (snij + helling * x.x)) ** 2, 0)
  return { helling, snij, se: Math.sqrt(rest / (n - 2) / sxx), n }
}

export interface Trendpunt {
  d: IsoDatum
  w: number | null
  ema: number | null
  kcal: number | null
  eiwit: number | null
  /** Hoeveel deze weging afweek van wat de trend verwachtte, in kilo.
   *  Null op de eerste weging: daar is nog geen verwachting. */
  afwijkingKg: number | null
  /** Een weging die niet bij de reeks past. Zie `UITBIJTER_KG`. */
  uitbijter: boolean
}

/**
 * DE ONDERGRENS ONDER DE UITBIJTERGRENS
 *
 * Drie standaarddeviaties alleen is hier niet genoeg, en dat is geen detail.
 *
 * Wie elke ochtend binnen tweehonderd gram weegt heeft een spreiding van
 * tweehonderd gram, en dan is drie keer dat zeshonderd gram. Een kilo verschil
 * na een zoute maaltijd zou dan als uitbijter aangemerkt worden, en dat is
 * precies wat hoofdstuk 1 níet wil: sprongen van een tot twee kilo zijn
 * fysiologisch.
 *
 * Vandaar een vloer van drie kilo. Zoveel lichaamsweefsel verdwijnt of komt er
 * niet in één nacht bij; wat er wél kan is vocht, een andere weegschaal, een
 * ander mens op de weegschaal, of een typefout. De app zegt niet welke van de
 * vier het is, alleen dat het er één van moet zijn.
 */
export const UITBIJTER_KG = 3

/** Hoeveel wegingen er minstens moeten zijn voor een eigen spreiding. */
export const UITBIJTER_MIN_N = 5

/** Hoeveel buren er aan weerszijden meetellen in de plaatselijke mediaan. */
const UITBIJTER_BUREN = 3

/**
 * Exponentieel gewogen gemiddelde met halfwaardetijd rond zeven dagen
 * (alfa 0,1). Presteert gelijk aan Kalman-smoothing en is uitlegbaar
 * (Turicchi 2020). Alleen een punt op dagen waarop echt gewogen is.
 *
 * DE UITBIJTERMARKERING, EN WAAROM ZE NIET AAN DE EWMA HANGT
 *
 * Hoofdstuk 1 van `VERANTWOORDING.md` beloofde deze markering al: een weging
 * die te ver van de verwachting afwijkt wordt aangemerkt, maar niet
 * weggegooid. Ze stond er alleen niet; dit bestand kende het woord uitbijter
 * niet. Dat is rechtgezet.
 *
 * De verwachting is niet de EWMA. Dat was de eerste opzet en die maakte van één
 * fout er drie: de EWMA lóópt naar een uitbijter toe, dus na een weging van 190
 * in een reeks rond de 118 wijken ook de twee wegingen erná ver van de
 * verwachting af, en werden die evengoed aangemerkt. Eén verkeerde toets zou
 * dan drie dagen besmetten.
 *
 * Wat er nu staat is de mediaan van de buurwegingen, drie aan elke kant en de
 * weging zelf niet meegerekend. Een mediaan verschuift niet van één wild getal,
 * dus de buren blijven schoon en alleen de weging zelf springt eruit.
 *
 * De spreiding erover wordt om dezelfde reden als mediane absolute afwijking
 * gerekend, maal 1,4826 zodat ze bij een normale verdeling hetzelfde getal
 * oplevert als een standaarddeviatie.
 *
 * WAT ER NIET GEBEURT
 *
 * De weging blijft in de reeks, telt mee in de EWMA en telt mee in de
 * regressie. Er wordt niets weggegooid en niets gecorrigeerd. De app zet er een
 * markering bij en laat het oordeel aan degene die op de weegschaal stond, want
 * die weet of het een tweede persoon was of een verkeerde toets.
 */
export function trendReeks(dagen: Dagenkaart): Trendpunt[] {
  const k = Object.keys(dagen).sort()
  let ema: number | null = null
  const uit: Trendpunt[] = []
  for (const d of k) {
    const dag = dagen[d]
    if (!dag) continue
    const w = dag.gewicht_kg ?? null
    if (w != null) ema = ema == null ? w : ema * 0.9 + w * 0.1
    uit.push({
      d,
      w,
      ema: w != null && ema != null ? Math.round(ema * 100) / 100 : null,
      kcal: dag._kcal || null,
      eiwit: dag._eiwit || null,
      afwijkingKg: null,
      uitbijter: false,
    })
  }
  markeer(uit)
  return uit
}

/** De mediaan van een niet-lege lijst. */
function mediaan(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

/**
 * Vult `afwijkingKg` en `uitbijter` in. Past de punten ter plekke aan, want ze
 * horen bij elkaar: de afwijking is het getal waarop de markering rust en die
 * twee mogen niet uit elkaar lopen.
 */
function markeer(punten: Trendpunt[]): void {
  const gewogen = punten.filter((p) => p.w != null)
  if (gewogen.length < UITBIJTER_MIN_N) return

  for (let i = 0; i < gewogen.length; i++) {
    const buren = gewogen
      .slice(Math.max(0, i - UITBIJTER_BUREN), i + UITBIJTER_BUREN + 1)
      .filter((_, j) => j !== Math.min(i, UITBIJTER_BUREN))
      .map((p) => p.w!)
    if (!buren.length) continue
    gewogen[i]!.afwijkingKg = Math.round((gewogen[i]!.w! - mediaan(buren)) * 100) / 100
  }

  const afw = gewogen.map((p) => p.afwijkingKg).filter((x): x is number => x != null)
  if (afw.length < UITBIJTER_MIN_N) return
  const spreiding = 1.4826 * mediaan(afw.map((x) => Math.abs(x)))
  const grens = Math.max(3 * spreiding, UITBIJTER_KG)
  for (const p of gewogen) {
    if (p.afwijkingKg != null && Math.abs(p.afwijkingKg) > grens) p.uitbijter = true
  }
}

export interface Analyse {
  gewicht: number
  wPunten: Punt[]
  reg: Regressie | null
  hellingWk: number | null
  hellingPct: number | null
  gemInname: number | null
  sdInname: number | null
  gemStappen: number | null
  rustBMR: number
  palLaag: number
  palHoog: number
  priorLaag: number
  priorHoog: number
  priorMid: number
  tdee: number | null
  /** Of die uitkomst fysiologisch kán kloppen; null zolang er geen tdee is. */
  tdeeOordeel: TdeeOordeel | null
  /** De ondergrens van de band, afgekapt op de ruststofwisseling. */
  laagMogelijk: number | null
  laag: number | null
  hoog: number | null
  half: number | null
  zekerheid: Zekerheid
  doel: number | null
  tekort: number
  tempoKgWk: number
  teSnel: boolean
  onderrapportage: number | null
  eiwitDoel: number
  eiwitRef: number
  wekenTotDoel: number | null
  gelogd: number
  volledig: number
  gemarkeerd: number
  venster: number
  bmi: number
}

/**
 * Het hart. Leest de weegreeks en de gelogde energie over een venster van
 * achtentwintig dagen en leidt daar een verbruik uit af, met een interval,
 * nooit als punt alleen.
 *
 * `eind` is standaard vandaag. Zie de kop van dit bestand voor waarom dat een
 * argument is en geen aanroep binnenin.
 */
export function analyse(dagen: Dagenkaart, pf: Profiel, eind: IsoDatum = vandaagNu()): Analyse {
  const start = plusDagen(eind, -VENSTER + 1)
  const sleutels = Object.keys(dagen).filter((k) => k >= start && k <= eind).sort()

  const wPunten: Punt[] = []
  const innames: number[] = []
  const stappen: number[] = []
  let gelogd = 0
  let gemarkeerd = 0

  for (const k of sleutels) {
    const d = dagen[k]
    if (!d) continue
    if (d.gewicht_kg != null) wPunten.push({ x: dagVerschil(start, k), y: +d.gewicht_kg, datum: k })
    const kcal = d._kcal || 0
    if (kcal > 0 && k !== eind) {
      // de lopende dag is per definitie onvolledig
      gelogd++
      if (kcal < 1200) gemarkeerd++ // niet weggooien, wel apart tellen
      else innames.push(kcal)
    }
    if (d.stappen != null) stappen.push(+d.stappen)
  }

  /* Ook hier telt `eind` mee. Zonder die grens pakte deze regel de laatste
     weging uit de hele kaart, dus ook een die ná het venster ligt, en dan
     rekende een teruggezette analyse zijn rustverbruik op het gewicht van
     vandaag. Bij de gewone aanroep (eind is vandaag) verandert er niets. */
  const alleW = Object.keys(dagen)
    .filter((k) => k <= eind && dagen[k]?.gewicht_kg != null).sort()
  const laatste = alleW.length ? alleW[alleW.length - 1] : undefined
  const gewicht = laatste
    ? +(dagen[laatste]?.gewicht_kg ?? 0)
    : (pf.start_gewicht_kg ?? pf.doel_gewicht_kg ?? 80)

  const gemStappen = stappen.length ? stappen.reduce((a, b) => a + b, 0) / stappen.length : null
  const gemInname = innames.length ? innames.reduce((a, b) => a + b, 0) / innames.length : null
  const sdInname =
    innames.length > 1 && gemInname != null
      ? Math.sqrt(innames.reduce((a, v) => a + (v - gemInname) ** 2, 0) / (innames.length - 1))
      : null

  const rustBMR = bmr(pf, gewicht)

  /* De activiteitsfactor uit stappen is het zwakste onderdeel van de app: een
     gevalideerde conversie bestaat niet (Westerterp 2013). Daarom een band en
     geen punt, en zodra het model meet is hij overbodig. */
  const palLaag = 1.35
  const palHoog = gemStappen ? Math.min(1.7, 1.4 + gemStappen / 22000) : 1.6
  const priorLaag = Math.round(rustBMR * palLaag)
  const priorHoog = Math.round(rustBMR * palHoog)
  const priorMid = Math.round((priorLaag + priorHoog) / 2)

  const reg = regressie(wPunten)
  let tdee: number | null = null
  let laag: number | null = null
  let hoog: number | null = null
  let half: number | null = null
  let zekerheid: Zekerheid = 'geen'
  const hellingWk = reg ? reg.helling * 7 : null

  if (reg && gemInname != null && wPunten.length >= 7 && innames.length >= 7) {
    tdee = gemInname - reg.helling * KCAL_PER_KG
    const seH = (reg.se ?? 0.05) * KCAL_PER_KG
    const seG = sdInname != null ? sdInname / Math.sqrt(innames.length) : 150
    /* Ondergrens van 100 kcal: bij achtentwintig dagelijkse metingen ligt de
       ruisvloer op de helling alleen al rond 145 kcal/dag. Een smaller
       interval is schijnprecisie. */
    half = Math.max(100, 1.96 * Math.sqrt(seH ** 2 + seG ** 2))
    laag = tdee - half
    hoog = tdee + half
    const dekking = gelogd / VENSTER
    if (wPunten.length >= 18 && innames.length >= 18 && dekking > 0.75 && half < 350) zekerheid = 'hoog'
    else if (wPunten.length >= 12 && innames.length >= 12 && half < 550) zekerheid = 'middel'
    else zekerheid = 'laag'
  }

  /* WANNEER HET MODEL ZIJN EIGEN UITKOMST NIET MAG GELOVEN
   *
   * tdee is een energiebalans: gemiddelde inname min de energie die het vet in
   * of uit ging. Die som klopt alleen als de twee invoeren bij elkaar horen.
   * Doen ze dat niet, dan geeft dezelfde som een onmogelijk antwoord, en hij
   * geeft het zonder te klagen.
   *
   * Dat gebeurde. Een logboek van 1.461 kcal over twaalf dagen naast een
   * weegreeks die met +2,30 kg per week omhoog liep, gaf een verbruik van
   * −1.069 kcal per dag, getoond als "−15.786–13.652 kcal". De standaardfout op
   * die helling was 0,975 kg per dág: de trend was in het geheel niet bepaald,
   * en toch stond er een getal.
   *
   * De grenzen zijn fysiologisch en niet gekozen om deze ene zaak op te lossen.
   * Onder: niemand verbruikt minder dan zijn ruststofwisseling. Boven:
   * tweeënhalf keer het rustverbruik is de bovengrens van wat een mens langer
   * dan een paar dagen volhoudt, de alimentaire limiet uit Thurber 2019, die
   * ook voor wielrenners in een grote ronde geldt.
   *
   * WAT HIER MET OPZET NIET GEBEURT
   *
   * De som zelf blijft staan, en `zekerheid` en `doel` ook. Dit veld is een
   * oordeel naast de uitkomst en geen ingreep erin: de rekenkern blijft melden
   * wat de balans geeft, en de schermen krijgen één plek om te zien of ze het
   * mogen beweren. Dat scheelt bovendien het hertekenen van veertig gouden
   * waarden die niets met deze fout te maken hebben.
   *
   * De ondergrens van de band wordt wél afgekapt op het rustverbruik. Een
   * interval dat onmogelijke waarden bevat is geen interval; afkappen op een
   * bekende fysieke grens houdt de informatie die er wél in zit (de bovenkant) 
   * overeind. */
  const PAL_PLAFOND = 2.5
  const tdeeOordeel: TdeeOordeel | null =
    tdee == null ? null
    : tdee < rustBMR ? 'onder-rust'
    : tdee > rustBMR * PAL_PLAFOND ? 'boven-plafond'
    : 'goed'
  const laagMogelijk = laag != null ? Math.max(laag, rustBMR) : null

  /* Tempo in procent lichaamsgewicht per week, herberekend op het actuele
     gewicht (Garthe 2011 in combinatie met Forbes 2000). */
  const tempoKgWk = (pf.tempo_pct_week / 100) * gewicht
  const tekort = (tempoKgWk * KCAL_PER_KG) / 7
  const hellingPct = hellingWk != null ? (hellingWk / gewicht) * 100 : null
  const teSnel = hellingPct != null && hellingPct < -1.0
  const doel = tdee != null ? Math.max(rustBMR, Math.round((tdee - tekort) / 10) * 10) : null

  const eiwitRef = eiwitReferentie(pf, gewicht)
  const eiwitDoel = Math.round(pf.eiwit_g_per_kg * eiwitRef)

  const wekenTotDoel =
    hellingWk && hellingWk < -0.05 && pf.doel_gewicht_kg
      ? Math.round((gewicht - pf.doel_gewicht_kg) / -hellingWk)
      : null

  return {
    gewicht, wPunten, reg, hellingWk, hellingPct, gemInname, sdInname, gemStappen,
    rustBMR, palLaag, palHoog, priorLaag, priorHoog, priorMid,
    tdee, laag, hoog, half, zekerheid, doel, tekort, tempoKgWk, teSnel,
    tdeeOordeel, laagMogelijk,
    onderrapportage: tdee != null ? priorMid - tdee : null,
    eiwitDoel, eiwitRef, wekenTotDoel,
    gelogd, volledig: innames.length, gemarkeerd, venster: VENSTER,
    bmi: gewicht / (pf.lengte_cm / 100) ** 2,
  }
}
