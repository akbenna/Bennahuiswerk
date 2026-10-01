/**
 * HET PLANBORD
 *
 * Toetsen erin, een dagplanning eruit. Dit is het rekenwerk; het scherm staat
 * in `schermen/Planbord.tsx` en houdt zelf niets bij.
 *
 * WAAROM DIT BESTAAT
 *
 * De app overhoort, geeft oefentoetsen en rekent beloning uit. Dat werkt pas
 * als je weet wát je vandaag moet doen en hoe lang dat duurt. Een kind in de
 * bovenbouw dat daarop vastloopt heeft niets aan nóg een oefening; het heeft
 * een lijstje nodig voor vandaag, en morgen weer een.
 *
 * DRIE REGELS, EN WAAROM
 *
 * 1. Terugplannen vanaf de toets. Elke toets krijgt drie soorten blokken: de
 *    stof één keer doorwerken (één blok per onderdeel), een herhaalronde twee
 *    dagen ervoor, en de dag ervoor alleen jezelf overhoren. Die volgorde is
 *    niet willekeurig: op de laatste dag nog nieuwe stof lezen is het slechtste
 *    wat je kunt doen, en toch is het wat iedereen doet die te laat begint.
 *
 * 2. Nooit meer dan tachtig procent van een dag vol. Een planning die tot de
 *    laatste minuut gevuld is loopt bij de eerste tegenvaller uit en haalt dat
 *    nooit meer in. Wat niet past schuift naar een eerdere dag; past het nergens,
 *    dan blijft het staan met een vlag, en het scherm zegt dat eerlijk.
 *
 * 3. Schatten en meten. Bij elk blok staat een schatting; achteraf vult het kind
 *    in hoe lang het écht duurde. Na drie van zulke paren weet het bord hoe ver
 *    de schattingen ernaast zitten en corrigeert het de volgende. Dat getal is
 *    een interval, geen punt: "6 tot 9 uur deze week", niet "7 uur". Mensen
 *    schatten hun eigen taken stelselmatig te laag en ook als ze dat weten,
 *    dus het bord doet het rekenwerk, niet het kind.
 *
 * HERPLANNEN ZONDER VERWIJT
 *
 * Een blok dat blijft liggen wordt niet rood. Bij het volgende herplannen
 * worden alle niet-afgevinkte blokken opnieuw neergezet vanaf vandaag; wat af
 * is blijft waar het stond. Er is dus nooit een stapel achterstand, alleen een
 * nieuwe planning. Of dat nog past, zegt `toetsStand`.
 *
 * De klok komt als argument binnen (een ISO-dag), anders is dit niet te toetsen.
 */

export type Soort = 'eerste' | 'herhaal' | 'overhoor'

export interface Toets {
  id: string
  vak: string
  /** De dag van de toets als ISO-dag (`2026-10-07`). */
  datum: string
  /** Korte omschrijving: "H3 Krachten". */
  titel: string
  /** De stof in stukken; elk stuk wordt één blok in de eerste ronde. */
  onderdelen: string[]
  /** Minuten per onderdeel, zoals het kind het zélf schat. */
  perOnderdeel: number
  /** Wanneer voor het laatst bewerkt; bij het samenvoegen wint de nieuwste. */
  bijgewerkt: number
  /** Weggehaald. Blijft staan als grafsteen, anders zet een ander toestel hem
   *  bij het samenvoegen gewoon terug. */
  weg?: boolean
}

export interface Blok {
  /** `toetsId|soort|index`: vast, zodat twee toestellen hetzelfde blok
   *  herkennen en "gedaan" niet verloren gaat bij het samenvoegen. */
  id: string
  toets: string
  soort: Soort
  taak: string
  /** ISO-dag. */
  datum: string
  /** De schatting zoals het kind hem gaf, vóór de correctie. */
  basis: number
  /** De schatting ná de correctie; dit staat op het scherm. */
  geschat: number
  gedaan: boolean
  /** Hoe lang het echt duurde, in minuten. Niet ingevuld is null. */
  echt: number | null
  klaarOp: number | null
  /** Paste nergens meer: staat op zijn ideale dag, maar die dag loopt over. */
  vol?: boolean
}

export interface Planstand {
  toetsen: Toets[]
  blokken: Blok[]
  /** Beschikbare minuten per weekdag, 0 = zondag tot en met 6 = zaterdag. */
  perDag: number[]
  /** Voor welke dag deze planning gemaakt is. */
  geplandVoor: string | null
  /** Wanneer. Bij het samenvoegen wint de nieuwste planning. */
  geplandOp: number
}

/** Een correctie op de schattingen, met zijn onzekerheid. */
export interface Schatting {
  /** Hoeveel paren schatting/echt eraan ten grondslag liggen. */
  n: number
  /** Mediaan van echt ÷ geschat. 1 betekent: klopt. */
  factor: number
  laag: number
  hoog: number
}

export type Toetsstatus = 'klaar' | 'nog niet begonnen' | 'op schema' | 'loopt achter'

export interface Toetsstand {
  toets: Toets
  status: Toetsstatus
  /** Dagen tot de toets, 0 is vandaag. */
  dagen: number
  /** Minuten die nog openstaan. */
  rest: number
  /** Beschikbare minuten van vandaag tot de dag vóór de toets. */
  ruimte: number
  /** Er staat meer open dan er tijd is. */
  krap: boolean
  gedaan: number
  totaal: number
}

/* ------------------------------------------------------------------ dagen */

/** Zondag tot en met zaterdag. Maandag is kort: dat is de lange schooldag. */
export const PER_DAG_STANDAARD: number[] = [150, 90, 120, 120, 120, 120, 180]

/** Nooit meer dan dit deel van een dag inplannen. */
export const VULGRAAD = 0.8

export const MIN_PAREN = 3

const twee = (n: number): string => String(n).padStart(2, '0')

export function isoVan(d: Date): string {
  return d.getFullYear() + '-' + twee(d.getMonth() + 1) + '-' + twee(d.getDate())
}

export function datumVan(iso: string): Date {
  const p = iso.split('-').map(Number)
  return new Date(p[0] || 2000, (p[1] || 1) - 1, p[2] || 1)
}

export function schuif(iso: string, dagen: number): string {
  const d = datumVan(iso)
  d.setDate(d.getDate() + dagen)
  return isoVan(d)
}

/** Dagen van `a` tot `b`; negatief als `b` eerder valt. */
export function dagenTussen(a: string, b: string): number {
  return Math.round((datumVan(b).getTime() - datumVan(a).getTime()) / 86400000)
}

export const weekdag = (iso: string): number => datumVan(iso).getDay()

export const rond5 = (min: number): number => Math.max(5, Math.round(min / 5) * 5)

/** Beschikbare minuten op een dag, met de vulgraad erin. */
export function capaciteit(perDag: number[], iso: string): number {
  const ruw = perDag[weekdag(iso)] ?? 0
  return Math.floor(ruw * VULGRAAD)
}

export const leegPlan = (): Planstand => ({
  toetsen: [], blokken: [], perDag: PER_DAG_STANDAARD.slice(), geplandVoor: null, geplandOp: 0,
})

export function schoonPlan(p: Partial<Planstand> | null | undefined): Planstand {
  const uit = { ...leegPlan(), ...(p ?? {}) }
  uit.toetsen = Array.isArray(uit.toetsen) ? uit.toetsen.filter((t) => t && t.id) : []
  uit.blokken = Array.isArray(uit.blokken) ? uit.blokken.filter((b) => b && b.id) : []
  if (!Array.isArray(uit.perDag) || uit.perDag.length !== 7) uit.perDag = PER_DAG_STANDAARD.slice()
  uit.perDag = uit.perDag.map((m) => (typeof m === 'number' && m >= 0 ? m : 0))
  if (typeof uit.geplandOp !== 'number') uit.geplandOp = 0
  return uit
}

/* --------------------------------------------------------------- schatting */

function percentiel(gesorteerd: number[], p: number): number {
  if (gesorteerd.length === 0) return 1
  const i = (gesorteerd.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  const a = gesorteerd[lo] as number
  const b = gesorteerd[hi] as number
  return a + (b - a) * (i - lo)
}

const klem = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

/**
 * Hoe ver de schattingen ernaast zitten. Mediaan en kwartielen van echt ÷
 * basis over de afgevinkte blokken waar een echte tijd bij staat. Onder drie
 * paren doet het bord niets: één blok dat drie keer zo lang duurde is nog geen
 * patroon.
 */
export function schatting(blokken: Blok[]): Schatting {
  const ratios = blokken
    .filter((b) => b.gedaan && b.echt != null && b.echt > 0 && b.basis > 0)
    .map((b) => (b.echt as number) / b.basis)
    .sort((a, b) => a - b)
  if (ratios.length < MIN_PAREN) return { n: ratios.length, factor: 1, laag: 1, hoog: 1 }
  return {
    n: ratios.length,
    factor: klem(percentiel(ratios, 0.5), 0.5, 3),
    laag: klem(percentiel(ratios, 0.25), 0.5, 3),
    hoog: klem(percentiel(ratios, 0.75), 0.5, 3),
  }
}

/* ------------------------------------------------------------- de planning */

interface Wens { blok: Blok; ideaal: string; vroegst: string; laatst: string }

const VOLGORDE: Record<Soort, number> = { eerste: 0, herhaal: 1, overhoor: 2 }

/** Wat er voor één toets nog te doen is, en op welke dag dat het liefst valt. */
function wensen(t: Toets, vandaag: string, gedaanIds: Set<string>, f: number): Wens[] {
  const uit: Wens[] = []
  const dagen = dagenTussen(vandaag, t.datum)
  if (dagen <= 0) return uit
  const laatste = schuif(t.datum, -1)
  const eersteEind = dagen >= 4 ? schuif(t.datum, -3) : vandaag
  const eersteSpan = Math.max(0, dagenTussen(vandaag, eersteEind))

  const n = t.onderdelen.length
  for (let i = 0; i < n; i++) {
    const id = `${t.id}|eerste|${i}`
    if (gedaanIds.has(id)) continue
    /* Gelijkmatig uitsmeren over de dagen die er voor de eerste ronde zijn. */
    const plek = n > 1 ? Math.round(i / (n - 1) * eersteSpan) : Math.floor(eersteSpan / 2)
    const basis = t.perOnderdeel
    uit.push({
      ideaal: schuif(vandaag, plek), vroegst: vandaag,
      /* Uiterlijk twee dagen voor de toets: de dag ervoor blijft voor overhoren. */
      laatst: dagen >= 2 ? schuif(t.datum, -2) : vandaag,
      blok: {
        id, toets: t.id, soort: 'eerste', taak: t.onderdelen[i] ?? '',
        datum: '', basis, geschat: rond5(basis * f), gedaan: false, echt: null, klaarOp: null,
      },
    })
  }

  const eersteTotaal = n * t.perOnderdeel
  const herhaalId = `${t.id}|herhaal|0`
  if (!gedaanIds.has(herhaalId)) {
    const basis = klem(Math.round(eersteTotaal * 0.4), 20, 60)
    uit.push({
      ideaal: dagen >= 3 ? schuif(t.datum, -2) : vandaag,
      vroegst: dagen >= 3 ? schuif(t.datum, -3) : vandaag,
      laatst: laatste,
      blok: {
        id: herhaalId, toets: t.id, soort: 'herhaal', taak: 'Herhalen: alles nog één keer, fouten eruit',
        datum: '', basis, geschat: rond5(basis * f), gedaan: false, echt: null, klaarOp: null,
      },
    })
  }

  const overhoorId = `${t.id}|overhoor|0`
  if (!gedaanIds.has(overhoorId)) {
    const basis = 30
    uit.push({
      ideaal: laatste, vroegst: dagen >= 2 ? schuif(t.datum, -2) : vandaag, laatst: laatste,
      blok: {
        id: overhoorId, toets: t.id, soort: 'overhoor', taak: 'Jezelf overhoren, geen nieuwe stof meer',
        datum: '', basis, geschat: rond5(basis * f), gedaan: false, echt: null, klaarOp: null,
      },
    })
  }
  return uit
}

/**
 * De planning opnieuw maken vanaf `vandaag`. Afgevinkte blokken blijven staan
 * waar ze stonden; al het andere wordt opnieuw neergezet. De schattingen van
 * nieuwe blokken worden gecorrigeerd met wat er tot nu toe gemeten is.
 */
export function herplan(p: Planstand, vandaag: string, nu = Date.now()): Planstand {
  const s = schatting(p.blokken)
  const f = s.factor
  const levend = p.toetsen.filter((t) => !t.weg)
  const levendIds = new Set(levend.map((t) => t.id))
  const gedaan = p.blokken.filter((b) => b.gedaan && levendIds.has(b.toets))
  const gedaanIds = new Set(gedaan.map((b) => b.id))
  /* Een echte tijd die bij een niet-afgevinkt blok stond, bewaren. */
  const echtVan = new Map(p.blokken.filter((b) => b.echt != null).map((b) => [b.id, b.echt]))

  const alle: Wens[] = []
  for (const t of [...levend].sort((a, b) => a.datum.localeCompare(b.datum))) {
    alle.push(...wensen(t, vandaag, gedaanIds, f))
  }
  alle.sort((a, b) =>
    a.ideaal.localeCompare(b.ideaal)
    || a.blok.toets.localeCompare(b.blok.toets)
    || VOLGORDE[a.blok.soort] - VOLGORDE[b.blok.soort])

  /* Wat er per dag al bezet is door afgevinkt werk van vandaag of later. */
  const bezet = new Map<string, number>()
  for (const b of gedaan) {
    if (b.datum >= vandaag) bezet.set(b.datum, (bezet.get(b.datum) ?? 0) + (b.echt ?? b.geschat))
  }
  const vrij = (dag: string, min: number): boolean =>
    (bezet.get(dag) ?? 0) + min <= capaciteit(p.perDag, dag)

  /* Eerst de ideale dag, dan eerder, dan later, elk binnen de grenzen van het
     soort blok. Past het nergens, dan de dag met de meeste ruimte over: zo
     verdeelt een te volle week zich en belandt niet alles op vandaag. */
  const plek = (w: Wens): string | null => {
    const min = w.blok.geschat
    if (vrij(w.ideaal, min)) return w.ideaal
    for (let d = schuif(w.ideaal, -1); d >= w.vroegst; d = schuif(d, -1)) if (vrij(d, min)) return d
    for (let d = schuif(w.ideaal, 1); d <= w.laatst; d = schuif(d, 1)) if (vrij(d, min)) return d
    return null
  }
  const minstVol = (w: Wens): string => {
    let beste = w.ideaal
    let ruimte = -Infinity
    for (let d = w.vroegst; d <= w.laatst; d = schuif(d, 1)) {
      const over = capaciteit(p.perDag, d) - (bezet.get(d) ?? 0)
      if (over > ruimte) { ruimte = over; beste = d }
    }
    return beste
  }

  const nieuw: Blok[] = []
  for (const w of alle) {
    const dag = plek(w)
    const blok: Blok = {
      ...w.blok,
      datum: dag ?? minstVol(w),
      echt: echtVan.get(w.blok.id) ?? null,
      ...(dag ? {} : { vol: true }),
    }
    bezet.set(blok.datum, (bezet.get(blok.datum) ?? 0) + blok.geschat)
    nieuw.push(blok)
  }

  return {
    ...p,
    blokken: [...gedaan, ...nieuw].sort((a, b) =>
      a.datum.localeCompare(b.datum) || VOLGORDE[a.soort] - VOLGORDE[b.soort]),
    geplandVoor: vandaag,
    geplandOp: nu,
  }
}

/* ----------------------------------------------------------------- de stand */

export function blokkenOp(p: Planstand, dag: string): Blok[] {
  return p.blokken.filter((b) => b.datum === dag)
}

/** Minuten gepland op een dag, afgevinkt werk tegen de echte tijd. */
export function geplandOp(p: Planstand, dag: string): number {
  return blokkenOp(p, dag).reduce((s, b) => s + (b.gedaan ? (b.echt ?? b.geschat) : b.geschat), 0)
}

/**
 * Hoe elke toets ervoor staat. "Op schema" betekent: van wat vóór vandaag had
 * moeten gebeuren is minstens tachtig procent af, in minuten. "Krap" staat er
 * los van: er staat meer open dan er tot de toets aan tijd is.
 */
export function toetsStand(p: Planstand, vandaag: string): Toetsstand[] {
  return p.toetsen.filter((t) => !t.weg).map((t) => {
    const mijn = p.blokken.filter((b) => b.toets === t.id)
    const dagen = dagenTussen(vandaag, t.datum)
    const totaal = mijn.length
    const gedaan = mijn.filter((b) => b.gedaan).length
    const rest = mijn.filter((b) => !b.gedaan).reduce((s, b) => s + b.geschat, 0)
    let ruimte = 0
    for (let d = vandaag; d < t.datum; d = schuif(d, 1)) ruimte += capaciteit(p.perDag, d)
    const verwacht = mijn.filter((b) => b.datum < vandaag)
    const verwachtMin = verwacht.reduce((s, b) => s + b.geschat, 0)
    const verwachtAf = verwacht.filter((b) => b.gedaan).reduce((s, b) => s + b.geschat, 0)
    let status: Toetsstatus
    if (totaal > 0 && gedaan === totaal) status = 'klaar'
    else if (gedaan === 0 && verwacht.length === 0) status = 'nog niet begonnen'
    else if (verwachtMin === 0 || verwachtAf / verwachtMin >= 0.8) status = 'op schema'
    else status = 'loopt achter'
    return { toets: t, status, dagen, rest, ruimte, krap: rest > ruimte, gedaan, totaal }
  }).sort((a, b) => a.toets.datum.localeCompare(b.toets.datum))
}

/** De uren van de komende zeven dagen, als interval. */
export function weekUren(p: Planstand, vandaag: string): { laag: number; hoog: number; midden: number } {
  const s = schatting(p.blokken)
  const eind = schuif(vandaag, 7)
  let basis = 0
  let geschat = 0
  for (const b of p.blokken) {
    if (b.gedaan || b.datum < vandaag || b.datum >= eind) continue
    basis += b.basis
    geschat += b.geschat
  }
  const uur = (m: number): number => Math.round(m / 60 * 2) / 2
  if (s.n < MIN_PAREN) {
    /* Zonder metingen is de onzekerheid de bekende: mensen schatten te laag,
       zelden te hoog. Dus de band loopt van de schatting tot anderhalf keer. */
    return { laag: uur(geschat), hoog: uur(geschat * 1.5), midden: uur(geschat) }
  }
  return { laag: uur(basis * s.laag), hoog: uur(basis * s.hoog), midden: uur(geschat) }
}

/* ------------------------------------------------------------ samenvoegen */

/**
 * Twee planborden bijleggen. Toetsen op id, de nieuwst bewerkte wint, en een
 * grafsteen wint van een levende versie die ouder is. Afgevinkte blokken komen
 * van beide kanten; de rest van de planning komt van de kant die het laatst
 * gepland heeft, want die heeft de nieuwste dag gezien.
 */
export function voegPlanSamen(
  x: Partial<Planstand> | null | undefined, y: Partial<Planstand> | null | undefined,
): Planstand {
  const a = schoonPlan(x)
  const b = schoonPlan(y)
  const toetsen = new Map<string, Toets>()
  for (const t of [...a.toetsen, ...b.toetsen]) {
    const e = toetsen.get(t.id)
    if (!e || (t.bijgewerkt || 0) > (e.bijgewerkt || 0)) toetsen.set(t.id, t)
  }
  const nieuwst = a.geplandOp >= b.geplandOp ? a : b
  const gedaan = new Map<string, Blok>()
  for (const bl of [...a.blokken, ...b.blokken]) {
    if (!bl.gedaan) continue
    const e = gedaan.get(bl.id)
    if (!e || (bl.klaarOp ?? 0) > (e.klaarOp ?? 0)) gedaan.set(bl.id, bl)
  }
  const open = nieuwst.blokken.filter((bl) => !bl.gedaan && !gedaan.has(bl.id))
  const levend = new Set([...toetsen.values()].filter((t) => !t.weg).map((t) => t.id))
  return {
    toetsen: [...toetsen.values()],
    blokken: [...gedaan.values(), ...open].filter((bl) => levend.has(bl.toets)),
    perDag: nieuwst.perDag,
    geplandVoor: nieuwst.geplandVoor,
    geplandOp: Math.max(a.geplandOp, b.geplandOp),
  }
}

/* -------------------------------------------------------------- bewerken */

export const nieuwId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function zetToets(p: Planstand, t: Toets): Planstand {
  const rest = p.toetsen.filter((x) => x.id !== t.id)
  return { ...p, toetsen: [...rest, t] }
}

export function haalToetsWeg(p: Planstand, id: string, nu = Date.now()): Planstand {
  return {
    ...p,
    toetsen: p.toetsen.map((t) => (t.id === id ? { ...t, weg: true, bijgewerkt: nu } : t)),
    blokken: p.blokken.filter((b) => b.toets !== id),
  }
}

export function vinkAf(p: Planstand, id: string, gedaan: boolean, nu = Date.now()): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => (b.id === id
      ? { ...b, gedaan, klaarOp: gedaan ? nu : null, ...(gedaan ? {} : { echt: null }) }
      : b)),
  }
}

export function zetEcht(p: Planstand, id: string, echt: number | null): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => (b.id === id ? { ...b, echt } : b)),
  }
}

/** De stof in stukken knippen: per regel, of per komma als het één regel is. */
export function knipOnderdelen(tekst: string): string[] {
  const regels = tekst.split(/\n/).map((r) => r.trim()).filter(Boolean)
  const stukken = regels.length > 1 ? regels : (regels[0] ?? '').split(/[,;]/).map((r) => r.trim())
  return stukken.filter(Boolean).slice(0, 12)
}
