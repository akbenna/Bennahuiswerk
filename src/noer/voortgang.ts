/**
 * VOORTGANG — punten, niveaus, kaarten, missie, insignes en geld
 *
 * Alles hier is zuiver gemaakt: een stand erin, een nieuwe stand eruit, en de
 * dag komt als argument binnen in plaats van uit de klok. De oude versie
 * veranderde de globale `S` ter plekke en riep zelf `bewaar()` aan; daardoor
 * was er geen manier om na te gaan of de punten en de dagenreeks nog bij
 * elkaar hoorden zonder de halve app op te tuigen.
 *
 * Over het geld: het hoort bij het leren — lessen, memoriseren, oefenen en de
 * examens. Het gebed zelf staat er standaard buiten. Dat is een keuze en de
 * ouder kan hem omzetten; de uitleg staat bij het ouderscherm. Er is een hard
 * weekbudget, en dat is precies waarom de verdiensten met datum bewaard worden
 * en niet als één getal.
 */
import { MODULES } from './gegevens/modules'
import { HIFZ } from './gegevens/hifz'
import { DUAS } from './gegevens/hifz'
import { NIVEAUS } from './gegevens/beloning'
import type { Les, Module, Spoor, Vraag } from './gegevens/soorten'
import type { Profiel, Voortgang } from './opslag'
import { TARIEF } from './opslag'

export const XP = { les: 20, kaart: 2, hifzNiveau: 15, gebed: 5, missie: 25, examen: 60 }

/** De leeftijd van een profiel op het gegeven jaar, begrensd op 4 tot 20. */
export const leeftijd = (p: Profiel | null, jaar: number): number =>
  Math.max(4, Math.min(20, jaar - (p?.geb ?? 2014)))

/** Welk spoor daarbij hoort: jonger dan tien, jonger dan dertien, of ouder. */
export const spoorVan = (p: Profiel | null, jaar: number): Spoor => {
  const l = leeftijd(p, jaar)
  return l < 10 ? 1 : l < 13 ? 2 : 3
}

/** De lessen van een module die op dit spoor meedoen. */
export const lessenVan = (mod: Module, spoor: Spoor): Les[] =>
  mod.lessen.filter((l) => (l.sp || 1) <= spoor)

export interface Lesplek extends Les { mod: string; modT: string }

export const alleLessen = (spoor: Spoor): Lesplek[] =>
  MODULES.flatMap((m) => lessenVan(m, spoor).map((l) => ({ ...l, mod: m.id, modT: m.t })))

export interface Niveaustand {
  i: number
  naam: string
  ico: string
  volgend: string | null
  pct: number
  /** Hoeveel punten er nog tot het volgende niveau zijn. */
  naar: number
}

export function niveauVan(pt: number): Niveaustand {
  let i = 0
  for (let k = 0; k < NIVEAUS.length; k++) if (pt >= (NIVEAUS[k] as [number, string, string])[0]) i = k
  const nu = NIVEAUS[i] as [number, string, string]
  const vol = NIVEAUS[i + 1] ?? null
  return {
    i, naam: nu[1], ico: nu[2],
    volgend: vol ? vol[1] : null,
    pct: vol ? Math.round((pt - nu[0]) / (vol[0] - nu[0]) * 100) : 100,
    naar: vol ? vol[0] - pt : 0,
  }
}

/** Een dag "aanraken": houdt de reeks bij. Alleen echte activiteit telt. */
export function raakDag(pr: Voortgang, vandaag: string, gisteren: string): Voortgang {
  if (pr.laatsteDag === vandaag) return pr
  return {
    ...pr,
    reeks: pr.laatsteDag === gisteren ? (pr.reeks || 0) + 1 : 1,
    laatsteDag: vandaag,
  }
}

export const puntenErbij = (
  pr: Voortgang, n: number, vandaag: string, gisteren: string,
): Voortgang => raakDag({ ...pr, punten: (pr.punten || 0) + n }, vandaag, gisteren)

/* ------------------------------------------------------------- het geld -- */

const centen = (n: number): number => Math.round(n * 100) / 100

/** Een JJJJ-MM-DD als tijdstip, middernacht plaatselijk. */
export const dagMs = (s: string): number => {
  const p = String(s || '').split('-').map(Number)
  return new Date(p[0] || 2000, (p[1] || 1) - 1, p[2] || 1).getTime()
}

/** Wat er in de laatste zeven dagen verdiend is. */
export const verdiendDezeWeek = (pr: Voortgang, nuMs: number): number => {
  const grens = nuMs - 7 * 864e5
  return (pr.verdiensten ?? []).filter((v) => dagMs(v.d) >= grens).reduce((s, v) => s + v.b, 0)
}

export const verdiendVandaagUit = (pr: Voortgang, bron: string, vandaag: string): number =>
  (pr.verdiensten ?? []).filter((v) => v.d === vandaag && v.bron === bron)
    .reduce((s, v) => s + v.b, 0)

/** Hoeveel verdiensten er bewaard blijven: ruim een jaar. */
const LOGLENGTE = 400

/**
 * Verdient wat er nog in het weekbudget past, en niet meer. Geeft de nieuwe
 * stand terug plus het bedrag dat er werkelijk bij kwam.
 */
export function verdien(
  pr: Voortgang, bron: string, bedrag: number, budget: number, vandaag: string, nuMs: number,
): { stand: Voortgang; echt: number } {
  const rest = Math.max(0, budget - verdiendDezeWeek(pr, nuMs))
  const b = Math.min(bedrag, rest)
  if (b <= 0) return { stand: pr, echt: 0 }
  const verdiensten = [...(pr.verdiensten ?? []), { d: vandaag, bron, b }].slice(-LOGLENGTE)
  return { stand: { ...pr, verdiensten, saldo: centen((pr.saldo || 0) + b) }, echt: b }
}

/* ---------------------------------------------------------- de dagmissie -- */

export interface Taak { k: string; ok: boolean; t: string }

export function missie(pr: Voortgang, vandaag: string): { taken: Taak[]; klaar: boolean } {
  const les = Object.values(pr.lessen ?? {}).some((x) => x.d === vandaag)
  const kaart = (pr.kaartenDag?.d === vandaag ? pr.kaartenDag.n : 0) >= 5
  const gebedOef = pr.oefenDag?.d === vandaag
  const gelogd = Object.values(pr.gebed?.[vandaag] ?? {}).filter(Boolean).length
  const taken: Taak[] = [
    { k: 'leren', ok: les || kaart, t: 'Doe een les, of vijf oefenkaarten' },
    { k: 'gebed', ok: Boolean(gebedOef), t: 'Oefen iets van het gebed' },
    { k: 'log', ok: gelogd >= 1, t: 'Zet je gebeden van vandaag in het logboek' },
  ]
  return { taken, klaar: taken.every((t) => t.ok) }
}

/** De missie afronden als hij vandaag klaar is en nog niet geteld was. */
export function checkMissie(
  pr: Voortgang, budget: number, vandaag: string, gisteren: string, nuMs: number,
): { stand: Voortgang; gehaald: boolean } {
  if (pr.missieLaatst === vandaag) return { stand: pr, gehaald: false }
  if (!missie(pr, vandaag).klaar) return { stand: pr, gehaald: false }

  let uit: Voortgang = {
    ...pr,
    missieReeks: pr.missieLaatst === gisteren ? (pr.missieReeks || 0) + 1 : 1,
    missieLaatst: vandaag,
    missieDagen: { ...(pr.missieDagen ?? {}), [vandaag]: true },
    punten: (pr.punten || 0) + XP.missie,
  }
  uit = verdien(uit, 'Dagmissie', TARIEF.missie, budget, vandaag, nuMs).stand
  if ((uit.reeks || 0) > 0 && (uit.reeks || 0) % 7 === 0) {
    uit = verdien(uit, 'Zeven dagen op rij', TARIEF.reeks7, budget, vandaag, nuMs).stand
  }
  return { stand: uit, gehaald: true }
}

/* ------------------------------------------------------------ insignes -- */

/** Welke insignes de stand op dit moment verdient. Geeft alleen de id's. */
export function verdiendeInsignes(pr: Voortgang, spoor: Spoor): string[] {
  const uit: string[] = []
  const geef = (id: string): void => { if (!uit.includes(id)) uit.push(id) }
  const hifzKlaar = Object.values(pr.hifz ?? {}).filter((h) => h.gehaald).length

  if (pr.examens?.['wudu']?.gehaald) geef('i-wudu')
  if (pr.examens?.['salah']?.gehaald) geef('i-salah')
  if (pr.hifz?.['h-fatiha']?.gehaald) geef('i-fatiha')
  if (hifzKlaar >= 3) geef('i-drie')
  if (hifzKlaar >= 10) geef('i-tien')
  if (MODULES.some((m) => lessenVan(m, spoor).every((l) => pr.lessen?.[l.id]?.klaar))) geef('i-mod1')
  if (alleLessen(spoor).every((l) => pr.lessen?.[l.id]?.klaar)) geef('i-alles')
  if ((pr.reeks || 0) >= 7) geef('i-reeks7')
  if ((pr.reeks || 0) >= 30) geef('i-reeks30')

  const dagen = Object.keys(pr.gebed ?? {})
  if (dagen.some((d) => Object.values(pr.gebed[d] ?? {}).filter(Boolean).length >= 5)) geef('i-vijf')

  /* De langste rij aaneengesloten dagen waarop alle vijf gebeden staan. */
  let opRij = 0
  let best = 0
  const gesorteerd = [...dagen].sort()
  gesorteerd.forEach((d, i) => {
    const vol = Object.values(pr.gebed[d] ?? {}).filter(Boolean).length >= 5
    if (!vol) { opRij = 0; return }
    const vorige = gesorteerd[i - 1]
    opRij = vorige && dagMs(d) - dagMs(vorige) === 864e5 ? opRij + 1 : 1
    best = Math.max(best, opRij)
  })
  if (best >= 7) geef('i-vijf7')
  if ((pr.duasGezien || 0) >= DUAS.length) geef('i-duas')
  return uit
}

/** De nieuwe insignes toekennen. Geeft terug welke er bij kwamen. */
export function checkInsignes(
  pr: Voortgang, spoor: Spoor,
): { stand: Voortgang; nieuw: string[] } {
  const heb = new Set(pr.insignes ?? [])
  const nieuw = verdiendeInsignes(pr, spoor).filter((id) => !heb.has(id))
  if (!nieuw.length) return { stand: pr, nieuw }
  return { stand: { ...pr, insignes: [...heb, ...nieuw] }, nieuw }
}

/* --------------------------------------------------------- oefenkaarten --
   De kaarten komen uit de lessen (vragen en losse kaartjes) en uit de teksten
   die je uit je hoofd leert. Herhalen loopt via oplopende tussenpozen. */

export const TUSSEN = [1, 2, 4, 8, 16, 32, 64]

export interface Kaart {
  id: string
  mod: string
  v: string
  /** Bij een meerkeuzekaart: de opties en het juiste antwoord. */
  o?: string[] | undefined
  a?: number | undefined
  u?: string | undefined
  /** Bij een open kaart: de achterkant. */
  open?: string | undefined
  les?: string | undefined
}

export function alleKaarten(spoor: Spoor): Kaart[] {
  const uit: Kaart[] = []
  for (const m of MODULES) {
    for (const l of lessenVan(m, spoor)) {
      (l.q ?? []).forEach((q: Vraag, i) => {
        uit.push({ id: `${l.id}-q${i}`, mod: m.t, v: q.v, o: q.o, a: q.a, u: q.u, les: l.id })
      })
      ;(l.kt ?? []).forEach((k, i) => {
        uit.push({ id: `${l.id}-k${i}`, mod: m.t, v: k[0], open: k[1], les: l.id })
      })
    }
  }
  for (const h of HIFZ) {
    const eerste = h.r[0]
    if (eerste) {
      uit.push({
        id: 'hf-' + h.id, mod: 'Uit je hoofd',
        v: `Wat is de eerste regel van ${h.naam}?`,
        open: `<span class="ar">${eerste[0]}</span><br><i>${eerste[1]}</i>`,
      })
    }
  }
  return uit
}

/** Wat er vandaag klaarligt: nog nooit gezien, of weer aan de beurt. */
export function kaartenNu(
  pr: Voortgang, spoor: Spoor, dag: number,
): { nieuw: Kaart[]; herhaal: Kaart[] } {
  const nieuw: Kaart[] = []
  const herhaal: Kaart[] = []
  for (const k of alleKaarten(spoor)) {
    const st = pr.kaarten?.[k.id]
    if (!st) nieuw.push(k)
    else if ((st.due || 0) <= dag) herhaal.push(k)
  }
  return { nieuw, herhaal }
}

/** Een kaart beoordelen. Goed schuift een stap op, fout begint opnieuw. */
export function kaartAntwoord(
  pr: Voortgang, id: string, goed: boolean, dag: number, vandaag: string, gisteren: string,
): Voortgang {
  const oud = pr.kaarten?.[id] ?? { stap: 0, due: 0 }
  const stap = goed ? Math.min(TUSSEN.length - 1, (oud.stap || 0) + 1) : 0
  let uit: Voortgang = {
    ...pr,
    kaarten: { ...(pr.kaarten ?? {}), [id]: { stap, due: dag + (TUSSEN[stap] as number) } },
  }
  if (goed) uit = { ...uit, punten: (uit.punten || 0) + XP.kaart }
  uit = {
    ...uit,
    kaartenDag: uit.kaartenDag?.d === vandaag
      ? { d: vandaag, n: uit.kaartenDag.n + 1 }
      : { d: vandaag, n: 1 },
  }
  return raakDag(uit, vandaag, gisteren)
}

/** Er is vandaag iets van het gebed geoefend. */
export const markeerOefening = (
  pr: Voortgang, vandaag: string, gisteren: string,
): Voortgang => raakDag({ ...pr, oefenDag: { d: vandaag } }, vandaag, gisteren)
