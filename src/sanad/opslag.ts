/**
 * WAT ER BEWAARD WORDT, EN HOE TWEE KOPIEËN SAMENKOMEN
 *
 * Eén regel bij het samenvoegen: niets gaat weg. Wie op de laptop week zeven
 * afrondt en op de telefoon week acht, heeft ze allebei afgerond — niet de
 * laatste die toevallig verstuurde. Bij een botsing wint daarom altijd de
 * verste stand, de langste tekst of de nieuwste datum, nooit "leeg".
 */
import type { IsoDatum } from '../gedeeld/db/tabellen'
import { dagVerschil } from '../gedeeld/datum'
import type { Kaartstand } from './kaartplanner'

export interface Stand {
  /** De dag waarop het programma begon; `null` zolang er niet gestart is. */
  start: IsoDatum | null
  /** De gekozen studieavond, als weekdagnummer 0–6 in een string. */
  dag: string
  /** Weeknummer → de dag waarop de week is afgerond. */
  klaar: Record<number, string>
  /** Kaart-id → de stand van die kaart. */
  cards: Record<string, Kaartstand>
  /** Weeknummer → wat er in het logboek is geschreven. */
  notities: Record<number, string>
  /** Zijn alle kaarten ineens vrijgegeven, ook die van ongedane sporen? */
  alles: boolean
  /** De laatste dag waarop er kaarten zijn gedaan. */
  last: IsoDatum | null
  /** Hoeveel dagen achter elkaar dat nu is. */
  dagreeks: number
}

export const LEEG: Stand = {
  start: null, dag: '4', klaar: {}, cards: {}, notities: {},
  alles: false, last: null, dagreeks: 0,
}

const max = (a: number | undefined, b: number | undefined): number =>
  Math.max(a ?? 0, b ?? 0)

function nieuwste<T extends string>(a: T | null | undefined, b: T | null | undefined): T | null {
  if (!a) return b ?? null
  if (!b) return a
  return a >= b ? a : b
}

/** Twee kaarten op id: per id de winnaar volgens `kies`. */
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

/** Een binnengekomen momentopname is niet te vertrouwen op vorm — hij komt uit
 *  een backupbestand of uit een oudere versie van de app. */
export type Losse = Partial<Stand>

export function samenvoegen(a: Losse | null, b: Losse | null): Stand {
  const x = a ?? {}
  const y = b ?? {}
  return {
    ...LEEG,
    ...x,
    ...y,
    /* De vroegste start wint: wie op twee toestellen begon, is begonnen op de
       eerste dag, en anders zouden alle afgeronde weken plotseling vooruitlopen
       op de planning. */
    start: x.start && y.start ? (x.start < y.start ? x.start : y.start) : (x.start ?? y.start ?? null),
    klaar: { ...(x.klaar ?? {}), ...(y.klaar ?? {}) },
    cards: perId(x.cards, y.cards, (p, q) => {
      // de kaart die verder in het schema staat draagt de meest recente kennis
      const kp = p?.n ?? 0
      const kq = q?.n ?? 0
      if (kp !== kq) return kp > kq ? p : q
      return nieuwste(p?.due, q?.due) === p?.due ? p : q
    }),
    notities: perId(x.notities, y.notities, (p, q) =>
      String(q ?? '').length > String(p ?? '').length ? q : p),
    alles: Boolean(x.alles || y.alles),
    dagreeks: max(x.dagreeks, y.dagreeks),
    last: nieuwste(x.last, y.last),
  }
}

/** De dagreeks bijwerken nu er op `nu` gewerkt is. Aaneengesloten dagen tellen
 *  op; één overgeslagen dag begint opnieuw bij één. */
export function reeksNa(s: Stand, nu: IsoDatum): Pick<Stand, 'last' | 'dagreeks'> {
  if (s.last === nu) return { last: s.last, dagreeks: s.dagreeks }
  return {
    last: nu,
    dagreeks: s.last && dagVerschil(s.last, nu) === 1 ? s.dagreeks + 1 : 1,
  }
}

/* De sleutel blijft `sanad.v2`: wie hem hernoemt, zet elke lopende gebruiker
   terug op week één. De oude pagina probeerde eerst een `window.storage` van
   de omgeving waarin zij ooit draaide; die bestaat in een browser niet en de
   tak viel altijd door naar localStorage. */
const SLEUTEL = 'sanad.v2'

export function lees(): Stand {
  try {
    const v = localStorage.getItem(SLEUTEL)
    return v ? samenvoegen(LEEG, JSON.parse(v) as Losse) : LEEG
  } catch {
    return LEEG
  }
}

export function schrijf(s: Stand): void {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(s))
  } catch { /* een volle of geweigerde opslag mag de app niet stilzetten */ }
}
