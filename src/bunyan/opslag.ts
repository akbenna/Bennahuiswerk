/**
 * WAT ER BEWAARD WORDT, EN HOE TWEE TOESTELLEN SAMENKOMEN
 *
 * Eén regel: niets gaat weg. Bij lessen telt de béste score en niet de laatste
 * — anders wist een slordige tweede poging een goed resultaat uit, en dat is
 * het tegenovergestelde van wat een score hoort te doen.
 *
 * Het saldo is de enige waarde die niet zomaar te vergelijken is: twee
 * toestellen kunnen allebei iets verdiend en iets uitbetaald hebben. Daarom
 * wordt het opnieuw uitgerekend uit verdiend min uitbetaald, in plaats van twee
 * getallen te vergelijken die elk maar de helft van het verhaal zijn.
 */

/** Wat er van één les bewaard staat. */
export interface Lesstand {
  af: boolean
  score: number
  pogingen: number
  /** De dag waarop de les werd afgerond. */
  d?: string | undefined
}

export interface Dagregel { d: string; lessen: number; punten: number }

export interface Project { id: string; naam: string; taal: string; code: string; d: string }
export interface Bouwsel { id: string; naam: string; delen: Record<string, string>; d: string }

export interface Instellingen {
  naam: string
  /** Wat er per week maximaal te verdienen valt, in euro. */
  weekbudget: number
  tariefLes: number
  tariefProject: number
  tariefBlok: number
  ouderPin: string
}

export interface Stand {
  lessen: Record<string, Lesstand>
  /** Les-id → de laatst getypte code, zodat werk niet weg is. */
  code: Record<string, string>
  projecten: Project[]
  bouwsels: Bouwsel[]
  punten: number
  saldo: number
  uitbetaald: number
  reeks: number
  laatsteDag: string | null
  insignes: string[]
  week: { nr: string | null; verdiend: number }
  log: Dagregel[]
  instel: Instellingen
  /** Wanneer de instellingen voor het laatst veranderden; beslist wie wint. */
  instelD: string | null
  laatste: string | null
}

export const LEGE_INSTELLINGEN: Instellingen = {
  naam: 'Amine', weekbudget: 6, tariefLes: 0.40, tariefProject: 1.50,
  tariefBlok: 2.00, ouderPin: '1234',
}

export const leeg = (): Stand => ({
  lessen: {}, code: {}, projecten: [], bouwsels: [],
  punten: 0, saldo: 0, uitbetaald: 0, reeks: 0, laatsteDag: null,
  insignes: [], week: { nr: null, verdiend: 0 },
  log: [],
  instel: { ...LEGE_INSTELLINGEN },
  instelD: null, laatste: null,
})

/** Een binnengekomen momentopname is niet te vertrouwen op vorm. */
export type Losse = Partial<Stand>

const centen = (n: number): number => Math.round(n * 100) / 100

function nieuwste(x: string | null | undefined, y: string | null | undefined): string | null {
  if (!x) return y ?? null
  if (!y) return x
  return x >= y ? x : y
}

/** Hoeveel dagregels er bewaard blijven: ruim een jaar oefenen. */
const LOGLENGTE = 400

export function samenvoegen(a: Losse | null, b: Losse | null): Stand {
  const x = a ?? {}
  const y = b ?? {}
  const uit: Stand = { ...leeg(), ...x, ...y }

  uit.lessen = { ...(x.lessen ?? {}) }
  for (const [id, jong] of Object.entries(y.lessen ?? {})) {
    const oud = uit.lessen[id]
    uit.lessen[id] = !oud ? jong : {
      af: Boolean(oud.af || jong.af),
      score: Math.max(oud.score || 0, jong.score || 0),
      pogingen: Math.max(oud.pogingen || 0, jong.pogingen || 0),
      d: nieuwste(oud.d, jong.d) ?? undefined,
    }
  }
  uit.code = { ...(x.code ?? {}), ...(y.code ?? {}) }
  uit.punten = Math.max(x.punten ?? 0, y.punten ?? 0)
  uit.uitbetaald = Math.max(x.uitbetaald ?? 0, y.uitbetaald ?? 0)
  uit.reeks = Math.max(x.reeks ?? 0, y.reeks ?? 0)
  uit.laatsteDag = nieuwste(x.laatsteDag, y.laatsteDag)
  uit.insignes = [...new Set([...(x.insignes ?? []), ...(y.insignes ?? [])])]

  /* Verdiend min uitbetaald, aan beide kanten, en dan de hoogste. Zie de kop. */
  const verdiendX = (x.saldo ?? 0) + (x.uitbetaald ?? 0)
  const verdiendY = (y.saldo ?? 0) + (y.uitbetaald ?? 0)
  uit.saldo = Math.max(0, centen(Math.max(verdiendX, verdiendY) - uit.uitbetaald))

  const dagen: Record<string, Dagregel> = {}
  for (const r of [...(x.log ?? []), ...(y.log ?? [])]) {
    const staat = dagen[r.d]
    dagen[r.d] = staat
      ? { d: r.d, lessen: Math.max(staat.lessen || 0, r.lessen || 0), punten: Math.max(staat.punten || 0, r.punten || 0) }
      : { ...r }
  }
  uit.log = Object.keys(dagen).sort().map((d) => dagen[d] as Dagregel).slice(-LOGLENGTE)

  uit.projecten = samenOpId(x.projecten, y.projecten)
  uit.bouwsels = samenOpId(x.bouwsels, y.bouwsels)

  /* De instellingen zijn één geheel: half die van de ouder en half die van het
     andere toestel is erger dan een van de twee. De nieuwste set wint. */
  const jongerY = (y.instelD ?? '') > (x.instelD ?? '')
  uit.instel = { ...LEGE_INSTELLINGEN, ...((jongerY ? y.instel : x.instel) ?? {}) }
  uit.instelD = nieuwste(x.instelD, y.instelD)
  uit.laatste = nieuwste(x.laatste, y.laatste)
  return uit
}

function samenOpId<T extends { id: string }>(a: T[] | undefined, b: T[] | undefined): T[] {
  const uit = [...(a ?? [])]
  for (const p of b ?? []) if (!uit.some((q) => q.id === p.id)) uit.push(p)
  return uit
}

/* De sleutel blijft `bunyan.v1`: wie hem hernoemt, wist elke lopende gebruiker.
   De oude pagina probeerde eerst een `window.storage` van de omgeving waarin zij
   ooit draaide; die bestaat in een browser niet. */
const SLEUTEL = 'bunyan.v1'

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
