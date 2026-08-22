/**
 * DE REKENKERN
 *
 * Overgezet uit sectie 3 van de oude index.html, regel voor regel, met typen
 * erbij en zonder één getal te veranderen. Dat is met opzet: elke keuze
 * hieronder is verantwoord in VERANTWOORDING.md tegen literatuur, en de
 * verwijzing staat erbij zodat een getal in het scherm terugvindbaar is. Wat
 * verantwoord is en werkt, herschrijf je niet — dat til je eruit.
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

/** Wichmann's constante: 7.700 kcal per kilo lichaamsweefsel. Zie hoofdstuk 2. */
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
}

/**
 * Exponentieel gewogen gemiddelde met halfwaardetijd rond zeven dagen
 * (alfa 0,1). Presteert gelijk aan Kalman-smoothing en is uitlegbaar
 * (Turicchi 2020). Alleen een punt op dagen waarop echt gewogen is.
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
    })
  }
  return uit
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
 * achtentwintig dagen en leidt daar een verbruik uit af — met een interval,
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

  const alleW = Object.keys(dagen).filter((k) => dagen[k]?.gewicht_kg != null).sort()
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
    onderrapportage: tdee != null ? priorMid - tdee : null,
    eiwitDoel, eiwitRef, wekenTotDoel,
    gelogd, volledig: innames.length, gemarkeerd, venster: VENSTER,
    bmi: gewicht / (pf.lengte_cm / 100) ** 2,
  }
}
