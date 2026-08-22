/**
 * GEBEDSTIJDEN — berekend uit de stand van de zon
 *
 * Dezelfde methode die de bekende gebedstijdenprogramma's gebruiken:
 * juliaanse dag, declinatie en tijdvereffening van de zon, en daaruit per
 * gebed een uurhoek. Voor Nederland is de hoge breedtegraad het lastige punt —
 * in de zomer wordt het 's nachts niet donker genoeg voor de gebruikelijke
 * hoeken. Daarom is er een regel voor: de nacht in zevenen delen, of in
 * tweeën. Berekend blijft berekend; houd de kalender van je eigen moskee aan.
 *
 * WAT ER VERANDERD IS AAN DE OUDE VERSIE
 *
 * De tijdzone en de hogebreedteregel komen nu als argument binnen in plaats
 * van uit `datum.getTimezoneOffset()` en uit de globale instellingen. Daarmee
 * is de berekening zuiver: dezelfde invoer geeft altijd dezelfde uitkomst, op
 * elke machine. Dat is wat de 1344 gouden waarden uit de oude app toetsbaar
 * maakt — anders zou dezelfde toets in Roermond en op een server in Ierland
 * verschillende antwoorden geven.
 *
 * De uitkomsten zijn uren sinds middernacht, als kommagetal. `NaN` betekent:
 * de zon haalt die hoek hier vandaag niet.
 */

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const sin = (d: number): number => Math.sin(d * D2R)
const cos = (d: number): number => Math.cos(d * D2R)
const tan = (d: number): number => Math.tan(d * D2R)
const asin = (x: number): number => Math.asin(x) * R2D
const acos = (x: number): number => Math.acos(x) * R2D
const atan2 = (y: number, x: number): number => Math.atan2(y, x) * R2D
const acot = (x: number): number => Math.atan(1 / x) * R2D

/** Rest die nooit negatief wordt; `vast(-1, 360)` is 359. */
const vast = (a: number, n: number): number => {
  const r = a - n * Math.floor(a / n)
  return r < 0 ? r + n : r
}
const vastUur = (a: number): number => vast(a, 24)

export type MethodeId = 'MWL' | 'ISNA' | 'EGYPT' | 'KARACHI'

/** `f` is de zonshoogte onder de horizon bij fajr, `i` die bij isha. */
export const METHODEN: Record<MethodeId, { f: number; i: number; n: string }> = {
  MWL: { f: 18, i: 17, n: 'Muslim World League (18° / 17°)' },
  ISNA: { f: 15, i: 15, n: 'ISNA (15° / 15°)' },
  EGYPT: { f: 19.5, i: 17.5, n: 'Egyptische autoriteit (19,5° / 17,5°)' },
  KARACHI: { f: 18, i: 18, n: 'Karachi (18° / 18°)' },
}

/** Hoe de asr-schaduw gemeten wordt: 1 is de meerderheid, 2 is Hanafi. */
export type Asr = 1 | 2

/** Wat er gebeurt als de zon de hoek niet haalt. */
export type Hoog = 'zevende' | 'midden' | 'geen'

export interface Kalenderdag { j: number; m: number; d: number }
export interface Plek { lat: number; lon: number }

export interface Opties {
  methode: MethodeId
  asr: Asr
  /** Uren voorsprong op UTC, inclusief zomertijd. */
  tz: number
  hoog: Hoog
}

export interface Tijden {
  fajr: number
  op: number
  dhuhr: number
  asr: number
  onder: number
  isha: number
  maghrib: number
}

export const julian = (y: number, m: number, d: number): number => {
  if (m <= 2) { y -= 1; m += 12 }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5
}

/** Declinatie van de zon en de tijdvereffening, beide op de gegeven dag. */
export function zonStand(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0
  const g = vast(357.529 + 0.98560028 * D, 360)
  const q = vast(280.459 + 0.98564736 * D, 360)
  const L = vast(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360)
  const e = 23.439 - 0.00000036 * D
  const RA = vast(atan2(cos(e) * sin(L), cos(L)) / 15, 24)
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA }
}

/** De hoogte van de zon bij op- en ondergang, in graden onder de horizon. */
const HORIZON = 0.833

export function gebedstijden(datum: Kalenderdag, plek: Plek, opt: Opties): Tijden {
  const meth = METHODEN[opt.methode]
  const { lat, lon } = plek
  const jd = julian(datum.j, datum.m, datum.d) - lon / (15 * 24)

  const middag = (t: number): number => vastUur(12 - zonStand(jd + t).eqt)
  const hoekTijd = (hoek: number, t: number, tegen = false): number => {
    const decl = zonStand(jd + t).decl
    const x = (-sin(hoek) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))
    if (x < -1 || x > 1) return NaN /* de zon haalt die hoek niet */
    const u = acos(x) / 15
    return middag(t) + (tegen ? -u : u)
  }
  const asrTijd = (f: number, t: number): number => {
    const decl = zonStand(jd + t).decl
    return hoekTijd(-acot(f + tan(Math.abs(lat - decl))), t)
  }

  const ruw = {
    fajr: hoekTijd(meth.f, 5 / 24, true),
    op: hoekTijd(HORIZON, 6 / 24, true),
    dhuhr: middag(12 / 24),
    asr: asrTijd(opt.asr, 13 / 24),
    onder: hoekTijd(HORIZON, 18 / 24),
    isha: hoekTijd(meth.i, 18 / 24),
  }
  const bij = (u: number): number => vastUur(u + opt.tz - lon / 15)
  const t: Tijden = {
    fajr: bij(ruw.fajr), op: bij(ruw.op), dhuhr: bij(ruw.dhuhr),
    asr: bij(ruw.asr), onder: bij(ruw.onder), isha: bij(ruw.isha),
    maghrib: bij(ruw.onder),
  }

  /* Hoge breedtegraad: als de hoek niet gehaald wordt — of pas veel te laat —
     nemen we een deel van de nacht. Zonder deze regel valt fajr in juni weg. */
  if (opt.hoog !== 'geen') {
    const nacht = vastUur(t.op - t.onder)
    const deel = opt.hoog === 'midden' ? nacht / 2 : nacht / 7
    if (Number.isNaN(t.fajr) || vastUur(t.op - t.fajr) > deel) t.fajr = vastUur(t.op - deel)
    if (Number.isNaN(t.isha) || vastUur(t.isha - t.onder) > deel) t.isha = vastUur(t.onder + deel)
  }
  return t
}

/** De richting naar de Ka'ba, in graden vanaf het noorden. */
export function qiblaHoek(lat: number, lon: number): number {
  const kLat = 21.4225
  const kLon = 39.8262
  const dL = kLon - lon
  const y = sin(dL)
  const x = cos(lat) * tan(kLat) - sin(lat) * cos(dL)
  return vast(atan2(y, x), 360)
}

/** De islamitische datum, zoals de browser hem kent. Leeg als hij dat niet kan. */
export function hijri(d: Date): string {
  try {
    return new Intl.DateTimeFormat('nl-NL-u-ca-islamic-umalqura',
      { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  } catch {
    return ''
  }
}

/** "07:32" uit een kommagetal aan uren. */
export const klok = (uren: number): string => {
  if (Number.isNaN(uren)) return '—'
  const t = Math.round(uren * 60)
  return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')
}

export interface Volgend {
  k: keyof Tijden
  n: string
  uur: number
  /** Hoeveel minuten het nog duurt. */
  over: number
  morgen?: boolean
}

const RIJ: Array<[keyof Tijden, string]> = [
  ['fajr', 'Fajr'], ['op', 'Zonsopgang'], ['dhuhr', 'Dhuhr'],
  ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha'],
]

/** Welk gebed er nu aankomt. `nu` is het uur van de dag als kommagetal. */
export function volgendGebed(vandaag: Tijden, morgen: Tijden, nu: number): Volgend {
  for (const [k, n] of RIJ) {
    const u = vandaag[k]
    if (!Number.isNaN(u) && u > nu) return { k, n, uur: u, over: (u - nu) * 60 }
  }
  return { k: 'fajr', n: 'Fajr', uur: morgen.fajr, over: (24 - nu + morgen.fajr) * 60, morgen: true }
}

/** De dag van een `Date` in de tijdzone van de gebruiker, als kalenderdag. */
export const kalenderdag = (d: Date): Kalenderdag => ({
  j: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
})

/** De tijdzone waarin die `Date` valt, in uren voorsprong op UTC. */
export const zoneVan = (d: Date): number => -d.getTimezoneOffset() / 60
