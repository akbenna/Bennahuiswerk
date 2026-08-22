/**
 * WAT ER BEWAARD WORDT, EN HOE TWEE TOESTELLEN SAMENKOMEN
 *
 * Dit is het gevoeligste bestand van de app. Wat hier staat — wat vast is,
 * wanneer het terugkomt, waar je haperde — is een reeks van jaren. Eén verkeerd
 * samengevoegd veld en een halve juz komt morgen tegelijk terug, of erger: valt
 * stil uit de planning omdat de due-datum van het andere toestel won.
 *
 * Alles hieronder is puur. Zie opslag.proef.ts.
 */

/** Dagen sinds 1970. De hele app rekent in hele dagen en nooit in tijdstippen:
 *  een herhaling hoort bij een dag, niet bij een uur. */
export const dagNu = (): number => Math.floor(Date.now() / 864e5)

export const datum = (d?: number): string => {
  const x = new Date((d ?? dagNu()) * 864e5)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export type Lezing = 'warsh' | 'hafs'
export type Volgorde = 'kort' | 'achter' | 'voor'
/** 3 vlekkeloos · 2 haperde · 1 kwijt */
export type Cijfer = 1 | 2 | 3

export interface Instellingen {
  minuten: number
  maxNieuw: number
  tempo: number
  lezing: Lezing
  volgorde: Volgorde
  doelVan: number
  doelTot: number
}

/** De staat van één aya. */
export interface AyaStaat {
  /** Waar in de reeks intervallen deze aya staat. */
  stap: number
  vast: boolean
  /** De laatste zes beoordelingen, oudste eerst. */
  reeks: Cijfer[]
  /** Hoe vaak het recent haperde; bepaalt de volgorde bij het herhalen. */
  zwak: number
  /** De dag waarop hij terugkomt. */
  due?: number
  /** De dag van de laatste beoordeling. */
  laatst?: number
  /** De dag waarop hij voor het eerst is vastgezet. */
  begonnen?: number
}

export interface Dagregel {
  d: string
  nieuw: number
  herhaald: number
}

export interface Stand {
  aya: Record<string, AyaStaat>
  log: Dagregel[]
  instel: Instellingen
  instelD: string | null
  laatste: string | null
}

export const KEY = 'rasikh.v1'

/** Standaard: juz 'amma. */
export const leeg = (): Stand => ({
  aya: {}, log: [],
  instel: {
    minuten: 25, maxNieuw: 3, tempo: 1,
    lezing: 'warsh', volgorde: 'kort', doelVan: 78, doelTot: 114,
  },
  instelD: null, laatste: null,
})

export const vul = (l: Partial<Stand> | null): Stand => {
  const basis = leeg()
  if (!l) return basis
  return { ...basis, ...l, instel: { ...basis.instel, ...(l.instel ?? {}) } }
}

/* --------------------------------------------------------------- opslag --- */

interface Brug {
  get: (sleutel: string, sessie: boolean) => Promise<{ value?: string } | null>
  set: (sleutel: string, waarde: string, sessie: boolean) => void
}
const brug = (): Brug | null => (globalThis as { storage?: Brug }).storage ?? null

export const lees = async (): Promise<Stand | null> => {
  try {
    const r = await brug()?.get(KEY, false)
    if (r?.value) return JSON.parse(r.value) as Stand
  } catch { /* dan localStorage */ }
  try {
    const v = localStorage.getItem(KEY)
    return v ? (JSON.parse(v) as Stand) : null
  } catch { return null }
}

export const schrijf = (s: Stand): void => {
  const t = JSON.stringify(s)
  try { brug()?.set(KEY, t, false) } catch { /* mag falen */ }
  try { localStorage.setItem(KEY, t) } catch { /* mag falen */ }
}

/* --------------------------------------------------------- samenvoegen --- */

const nieuwste = (a: string | null | undefined, b: string | null | undefined): string | null =>
  !a ? (b ?? null) : !b ? a : a >= b ? a : b

/**
 * Twee standen van dezelfde aya. De jóngste beoordeling wint — die weet het
 * best hoe het er nu voor staat. Maar `vast` gaat nooit terug naar niet-vast,
 * en `begonnen` houdt de vroegste datum: dat is geschiedenis en geen mening.
 */
export function samenAya(x: AyaStaat | undefined, y: AyaStaat | undefined): AyaStaat | undefined {
  if (!x) return y
  if (!y) return x
  const w = (y.laatst ?? 0) > (x.laatst ?? 0) ? y : x
  const begonnen = [x.begonnen, y.begonnen].filter((n): n is number => n != null)
  return {
    ...w,
    vast: x.vast || y.vast,
    ...(begonnen.length ? { begonnen: Math.min(...begonnen) } : {}),
  }
}

/**
 * De dagtellingen. Twee toestellen op dezelfde dag: de hoogste telling, niet de
 * som. Anders groeit die dag bij elke samenvoeging opnieuw, en dan liegt de
 * grafiek er binnen een week een factor twee naast.
 */
export function samenLog(a: Dagregel[] = [], b: Dagregel[] = []): Dagregel[] {
  const uit: Record<string, Dagregel> = {}
  for (const r of [...a, ...b]) {
    const o = uit[r.d]
    uit[r.d] = o
      ? { d: r.d, nieuw: Math.max(o.nieuw, r.nieuw), herhaald: Math.max(o.herhaald, r.herhaald) }
      : { ...r }
  }
  return Object.keys(uit).sort().map((d) => uit[d] as Dagregel).slice(-500)
}

export function samenvoegen(a: Stand, b: Partial<Stand>): Stand {
  const aya = { ...a.aya }
  for (const [id, y] of Object.entries(b.aya ?? {})) {
    const uit = samenAya(aya[id], y)
    if (uit) aya[id] = uit
  }
  return {
    aya,
    log: samenLog(a.log, b.log),
    /* Instellingen horen bij het hoofd, niet bij het toestel: wat je op je
       telefoon als doel zet wil je op je laptop terugzien. Daarom de jongst
       gewijzigde, en niet de hoogste of de laatst geladen. */
    instel: (b.instelD ?? '') > (a.instelD ?? '') && b.instel ? { ...b.instel } : { ...a.instel },
    instelD: nieuwste(a.instelD, b.instelD),
    laatste: nieuwste(a.laatste, b.laatste),
  }
}
