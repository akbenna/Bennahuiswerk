/**
 * WAT ER BEWAARD WORDT, EN HOE HET SAMENKOMT
 *
 * Alles hier is een pure functie op een gewoon object. Dat is met opzet: het
 * samenvoegen tussen twee toestellen is het enige stuk van deze app waar een
 * fout stil blijft. Een spel dat vastloopt zie je meteen; een record dat bij het
 * gelijktrekken de verkeerde kant op wordt overschreven zie je pas als je het
 * mist. Zie opslag.proef.ts.
 */
import type { Spelbeschrijving } from './spellen/kader'

export interface Instellingen {
  geluid: boolean
  memoryAr: boolean
  ouderPin: string
}

export interface Stand {
  records: Record<string, number>
  gespeeld: Record<string, number>
  laatste: string | null
  instelD: string | null
  instel: Instellingen
}

export const KEY = 'raha.v1'

export const leeg = (): Stand => ({
  records: {}, gespeeld: {}, laatste: null, instelD: null,
  instel: { geluid: true, memoryAr: false, ouderPin: '1234' },
})

/* De opslag op dit toestel. `window.storage` is de brug van de omhullende app
   op de tablet; die is er niet altijd, en dan is localStorage genoeg. */
interface Brug {
  get: (sleutel: string, sessie: boolean) => Promise<{ value?: string } | null>
  set: (sleutel: string, waarde: string, sessie: boolean) => void
}
const brug = (): Brug | null =>
  (globalThis as { storage?: Brug }).storage ?? null

export const lees = async (): Promise<Stand | null> => {
  try {
    const r = await brug()?.get(KEY, false)
    if (r?.value) return JSON.parse(r.value) as Stand
  } catch { /* dan localStorage */ }
  try {
    const v = localStorage.getItem(KEY)
    return v ? (JSON.parse(v) as Stand) : null
  } catch {
    return null
  }
}

export const schrijf = (s: Stand): void => {
  const tekst = JSON.stringify(s)
  try { brug()?.set(KEY, tekst, false) } catch { /* mag falen */ }
  try { localStorage.setItem(KEY, tekst) } catch { /* mag falen */ }
}

/** Een stand van de schijf aanvullen met wat er ontbreekt. */
export const vul = (l: Partial<Stand> | null): Stand => {
  const basis = leeg()
  if (!l) return basis
  return { ...basis, ...l, instel: { ...basis.instel, ...(l.instel ?? {}) } }
}

/**
 * Bij het samenvoegen tussen toestellen wint het béste record, en dat is niet
 * altijd het hoogste: bij het geheugenspel tellen juist minder beurten.
 */
export function samenvoegen(
  a: Stand, b: Partial<Stand>, spellen: readonly Spelbeschrijving[],
): Stand {
  const lager = (id: string) => spellen.find((s) => s.id === id)?.lager === true
  const uit: Stand = { ...a, ...b, records: { ...a.records }, gespeeld: { ...a.gespeeld }, instel: a.instel }

  for (const [id, y] of Object.entries(b.records ?? {})) {
    const x = uit.records[id]
    uit.records[id] = x === undefined ? y : lager(id) ? Math.min(x, y) : Math.max(x, y)
  }
  for (const [id, y] of Object.entries(b.gespeeld ?? {})) {
    uit.gespeeld[id] = Math.max(uit.gespeeld[id] ?? 0, y)
  }

  /* De instellingen zijn geen records: daar wint de jongste en niet de hoogste. */
  uit.instel = (b.instelD ?? '') > (a.instelD ?? '') && b.instel ? { ...b.instel } : { ...a.instel }

  const nieuwste = (x: string | null | undefined, y: string | null | undefined): string | null =>
    !x ? (y ?? null) : !y ? x : x >= y ? x : y
  uit.instelD = nieuwste(a.instelD, b.instelD)
  uit.laatste = nieuwste(a.laatste, b.laatste)
  return uit
}

/** Is dit een beter record dan wat er stond? */
export const isBeter = (oud: number | undefined, score: number, lager?: boolean): boolean =>
  oud === undefined || (lager ? score < oud : score > oud)

/**
 * De records stonden tot nu toe in de huiswerkapp. Die halen we één keer op in
 * plaats van ze te laten verdampen: een record van een half jaar geleden gooi
 * je niet weg omdat de spelletjes verhuizen.
 */
export function haalOud(
  s: Stand, spellen: readonly Spelbeschrijving[],
): { stand: Stand; overgenomen: number } {
  let ruw: unknown = null
  try {
    ruw = JSON.parse(localStorage.getItem('oefenapp_v1') ?? 'null')
  } catch {
    return { stand: s, overgenomen: 0 }
  }
  const games = (ruw as { games?: Record<string, unknown> } | null)?.games
  if (!games) return { stand: s, overgenomen: 0 }

  const records = { ...s.records }
  let n = 0
  for (const [id, waarde] of Object.entries(games)) {
    if (typeof waarde !== 'number') continue
    const spel = spellen.find((x) => x.id === id)
    if (!spel) continue
    if (isBeter(records[id], waarde, spel.lager)) { records[id] = waarde; n++ }
  }
  return { stand: n ? { ...s, records } : s, overgenomen: n }
}
