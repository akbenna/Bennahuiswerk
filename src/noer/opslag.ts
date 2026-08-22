/**
 * WAT ER BEWAARD WORDT, EN HOE TWEE TOESTELLEN SAMENKOMEN
 *
 * Deze app is de enige in de hub met meer dan één kind erin: elk profiel heeft
 * zijn eigen voortgang, en het gezin deelt de plaats, de gebedsmethode en de
 * instellingen. Bij het samenvoegen gaat het dus per profiel — en de regel
 * blijft dezelfde als overal: niets weggooien. Bij een botsing wint de hoogste
 * waarde of de nieuwste datum, nooit "leeg".
 */
import type { Hoog, MethodeId, Asr } from './gebedstijden'

export interface Lesstand { klaar: boolean; score: number; d?: string | undefined }
export interface Hifzstand { niveau: number; gehaald: boolean; d?: string | undefined }
export interface Kaartstand {
  /** Waar de kaart in de reeks staat; hoger is verder uit elkaar. */
  stap: number
  /** De dag (hele dagen sinds 1970) waarop hij weer aan de beurt is. */
  due: number
}
export interface Examenstand { gehaald: boolean; d?: string | undefined }
export interface Verdienste { d: string; bron: string; b: number }
export interface Betaling { d: string; b: number }

export interface Voortgang {
  punten: number
  reeks: number
  laatsteDag: string | null
  lessen: Record<string, Lesstand>
  hifz: Record<string, Hifzstand>
  kaarten: Record<string, Kaartstand>
  /** Dag → gebed-id → gebeden of niet. */
  gebed: Record<string, Record<string, boolean>>
  examens: Record<string, Examenstand>
  insignes: string[]
  saldo: number
  verdiensten: Verdienste[]
  betalingen: Betaling[]
  missieLaatst: string | null
  missieReeks: number
  missieDagen: Record<string, boolean>
  duasGezien: number
  /** Hoeveel kaarten er vandaag gedaan zijn. */
  kaartenDag?: { d: string; n: number } | undefined
  /** Of er vandaag iets van het gebed geoefend is. */
  oefenDag?: { d: string } | undefined
}

export interface Profiel { id: string; naam: string; geb: number; kleur: string }

export interface Gezin {
  budget: number
  /** Telt het gebed zelf mee voor de beloning? Standaard niet; zie het ouderscherm. */
  gebedTelt: boolean
  ouderPin: string
  plaats: string
  lat: number
  lon: number
  methode: MethodeId
  asr: Asr
  hoog: Hoog
}

export interface Instellingen {
  geluid: boolean
  stem: boolean
  tempo: number
  groot: boolean
  /** De gekozen stem voor het Arabisch, als naam. */
  arStem: string
  harakat: boolean
  arTempo: number
  /** Alleen echte opnames afspelen, geen toestelstem. */
  alleenEcht: boolean
  /** Stempel: is de stemherstel al één keer gedraaid op dit toestel? */
  stemV: number
}

export interface Stand {
  profielen: Profiel[]
  actief: string | null
  data: Record<string, Voortgang>
  gezin: Gezin
  instel: Instellingen
  last: string | null
}

export const TARIEF = {
  les: 0.50, hifz: 1.50, examenWudu: 1.00, examenSalah: 1.50,
  missie: 0.50, reeks7: 1.00, gebed: 0.10, gebedDagMax: 0.50, weekbudget: 10,
}

export const leegProg = (): Voortgang => ({
  punten: 0, reeks: 0, laatsteDag: null, lessen: {}, hifz: {}, kaarten: {},
  gebed: {}, examens: {}, insignes: [], saldo: 0, verdiensten: [], betalingen: [],
  missieLaatst: null, missieReeks: 0, missieDagen: {}, duasGezien: 0,
})

export const leeg = (): Stand => ({
  profielen: [], actief: null, data: {},
  gezin: {
    budget: TARIEF.weekbudget, gebedTelt: false, ouderPin: '1234',
    plaats: 'Roermond', lat: 51.1942, lon: 5.9873,
    methode: 'MWL', asr: 1, hoog: 'zevende',
  },
  instel: {
    geluid: true, stem: true, tempo: 1, groot: false, arStem: '',
    harakat: true, arTempo: 0.85, alleenEcht: true, stemV: 0,
  },
  last: null,
})

export type Losse = Partial<Stand>

const max = (a: number | undefined, b: number | undefined): number => Math.max(a ?? 0, b ?? 0)

function nieuwste(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null
  if (!b) return a
  return a >= b ? a : b
}

function perId<T>(
  a: Record<string, T> | undefined,
  b: Record<string, T> | undefined,
  kies: (x: T, y: T) => T,
): Record<string, T> {
  const uit: Record<string, T> = { ...(a ?? {}) }
  for (const [id, y] of Object.entries(b ?? {})) {
    const x = uit[id]
    uit[id] = x === undefined ? y : kies(x, y)
  }
  return uit
}

const unie = (a: string[] | undefined, b: string[] | undefined): string[] =>
  [...new Set([...(a ?? []), ...(b ?? [])])]

export function samenvoegen(a: Losse | null, b: Losse | null): Stand {
  if (!a) return { ...leeg(), ...(b ?? {}) }
  if (!b) return { ...leeg(), ...a }

  const profielen = [...(a.profielen ?? [])]
  for (const p of b.profielen ?? []) {
    if (!profielen.some((x) => x.id === p.id)) profielen.push(p)
  }

  const data: Record<string, Voortgang> = {}
  for (const id of unie(Object.keys(a.data ?? {}), Object.keys(b.data ?? {}))) {
    const x = a.data?.[id] ?? leegProg()
    const y = b.data?.[id] ?? leegProg()
    data[id] = {
      punten: max(x.punten, y.punten),
      reeks: max(x.reeks, y.reeks),
      laatsteDag: nieuwste(x.laatsteDag, y.laatsteDag),
      lessen: perId(x.lessen, y.lessen, (p, q) => ({
        klaar: p.klaar || q.klaar,
        score: Math.max(p.score || 0, q.score || 0),
        d: nieuwste(p.d, q.d) ?? undefined,
      })),
      hifz: perId(x.hifz, y.hifz, (p, q) => ({
        niveau: Math.max(p.niveau || 0, q.niveau || 0),
        gehaald: p.gehaald || q.gehaald,
        d: nieuwste(p.d, q.d) ?? undefined,
      })),
      /* Bij een kaart wint de verste stap: dat is de meest recente kennis. */
      kaarten: perId(x.kaarten, y.kaarten, (p, q) => ((p.stap || 0) >= (q.stap || 0) ? p : q)),
      /* Een gebed dat ergens is afgevinkt blijft afgevinkt. */
      gebed: perId(x.gebed, y.gebed, (p, q) => ({ ...q, ...p })),
      examens: perId(x.examens, y.examens, (p, q) => ({
        gehaald: p.gehaald || q.gehaald,
        d: nieuwste(p.d, q.d) ?? undefined,
      })),
      insignes: unie(x.insignes, y.insignes),
      saldo: max(x.saldo, y.saldo),
      /* De langste lijst is de volledigste; twee lijsten samenvoegen zou
         dezelfde verdienste dubbel kunnen tellen. */
      verdiensten: (x.verdiensten ?? []).length >= (y.verdiensten ?? []).length
        ? (x.verdiensten ?? []) : (y.verdiensten ?? []),
      betalingen: (x.betalingen ?? []).length >= (y.betalingen ?? []).length
        ? (x.betalingen ?? []) : (y.betalingen ?? []),
      missieLaatst: nieuwste(x.missieLaatst, y.missieLaatst),
      missieReeks: max(x.missieReeks, y.missieReeks),
      missieDagen: { ...(y.missieDagen ?? {}), ...(x.missieDagen ?? {}) },
      duasGezien: max(x.duasGezien, y.duasGezien),
    }
  }

  return {
    profielen,
    actief: a.actief ?? b.actief ?? null,
    data,
    gezin: { ...leeg().gezin, ...(b.gezin ?? {}), ...(a.gezin ?? {}) },
    instel: { ...leeg().instel, ...(b.instel ?? {}), ...(a.instel ?? {}) },
    last: nieuwste(a.last, b.last),
  }
}

/* De sleutel blijft `bidaya.v1`: wie hem hernoemt, wist elk lopend profiel. */
const SLEUTEL = 'bidaya.v1'

export function lees(): Stand {
  try {
    const v = localStorage.getItem(SLEUTEL)
    return v ? samenvoegen(leeg(), JSON.parse(v) as Losse) : leeg()
  } catch {
    return leeg()
  }
}

export function schrijf(s: Stand): void {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(s))
  } catch { /* een volle of geweigerde opslag mag de app niet stilzetten */ }
}
