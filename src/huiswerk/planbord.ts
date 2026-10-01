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
 *    Een opdracht met een deadline (een O&O-verslag) krijgt alleen de eerste
 *    soort: daar valt niets te overhoren.
 *
 * 2. Nooit meer dan tachtig procent van een dag vol. Een planning die tot de
 *    laatste minuut gevuld is loopt bij de eerste tegenvaller uit en haalt dat
 *    nooit meer in. Wat niet past schuift naar een andere dag met ruimte; past
 *    het nergens, dan naar de minst volle dag met een vlag, en het scherm zegt
 *    dat eerlijk.
 *
 * 3. Schatten en meten. Bij elk blok staat een schatting; achteraf vult het kind
 *    in hoe lang het écht duurde. Na drie van zulke paren weet het bord hoe ver
 *    de schattingen ernaast zitten en corrigeert het de volgende. Dat getal is
 *    een interval, geen punt: "6 tot 9 uur deze week", niet "7 uur". Mensen
 *    schatten hun eigen taken stelselmatig te laag en ook als ze dat weten,
 *    dus het bord doet het rekenwerk, niet het kind.
 *
 * HET KIND HEEFT HET LAATSTE WOORD
 *
 * Het bord stelt voor; het kind mag afwijken. Een blok dat het kind naar een
 * andere dag sleept staat daarna vast en wordt bij herplannen niet meer
 * verplaatst. Minuten die het kind zelf invult gaan vóór de correctie van het
 * bord. Een dag waarop minder kan ("woensdag maar een half uur") krijgt een
 * eigen getal dat alleen voor die datum geldt. Een planning die je niet zelf
 * mag bijsturen voelt als andermans planning, en die volg je niet.
 *
 * HERPLANNEN ZONDER VERWIJT, MAAR WEL EERLIJK
 *
 * Een blok dat blijft liggen wordt niet rood. Bij het volgende herplannen
 * worden alle niet-afgevinkte blokken opnieuw neergezet vanaf vandaag. Maar
 * elk blok onthoudt de dag waarop het éérst gepland stond (`eerst`): daarop
 * meet `toetsStand` of iemand op schema ligt. Anders zou herplannen de
 * achterstand uitwissen, en zou het bord nooit "loopt achter" kunnen zeggen.
 *
 * De klok komt als argument binnen (een ISO-dag), anders is dit niet te toetsen.
 */

export type Soort = 'eerste' | 'herhaal' | 'overhoor'

export interface Toets {
  id: string
  vak: string
  /** De dag van de toets of de deadline, als ISO-dag (`2026-10-07`). */
  datum: string
  /** Korte omschrijving: "H3 Krachten". */
  titel: string
  /** De stof in stukken; elk stuk wordt één blok in de eerste ronde. */
  onderdelen: string[]
  /** Minuten per onderdeel, zoals het kind het zélf schat. */
  perOnderdeel: number
  /** Wanneer voor het laatst bewerkt; bij het samenvoegen wint de nieuwste. */
  bijgewerkt: number
  /** Een opdracht met een deadline in plaats van een toets: geen herhaal- en
   *  overhoorblok. Ontbreekt bij oudere toetsen en betekent dan: toets. */
  opdracht?: boolean
  /** Onderwerpen in de app die bij deze stof horen (`vak|onderwerp|jaar`),
   *  door de planlezer aangewezen en door de app nagekeken. */
  oefenen?: string[]
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
  /** De dag waarop dit blok voor het eerst gepland stond. Herplannen verandert
   *  `datum`, nooit `eerst`: daarop wordt achterstand gemeten. */
  eerst?: string
  /** De schatting zoals het kind hem gaf, vóór de correctie. */
  basis: number
  /** De schatting ná de correctie; dit staat op het scherm. */
  geschat: number
  /** Door het kind zelf ingevulde minuten. Gaat vóór de correctie. */
  eigen?: number
  /** Door het kind op deze dag gezet: herplannen laat hem staan. */
  vast?: boolean
  gedaan: boolean
  /** Hoe lang het echt duurde, in minuten. Niet ingevuld is null. */
  echt: number | null
  klaarOp: number | null
  /** Wanneer het vinkje er weer af ging. Nodig bij het samenvoegen: anders zet
   *  een toestel dat het oude vinkje nog heeft het gewoon terug. */
  losOp?: number
  /** Paste nergens meer: staat op de minst volle dag, en die loopt over. */
  vol?: boolean
}

export interface Planstand {
  toetsen: Toets[]
  blokken: Blok[]
  /** Beschikbare minuten per weekdag, 0 = zondag tot en met 6 = zaterdag. */
  perDag: number[]
  /** Afwijkingen voor één datum: "deze woensdag maar 30 minuten". */
  perDatum?: Record<string, number>
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
  /** Het past niet: er staat een blok op een overvolle dag, of er staat meer
   *  open dan er tot de toets aan tijd is. */
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

/** De ruwe minuten voor een dag: een afwijking voor die datum, anders de weekdag. */
export function minutenOp(p: Pick<Planstand, 'perDag' | 'perDatum'>, iso: string): number {
  const eigen = p.perDatum?.[iso]
  return typeof eigen === 'number' ? eigen : (p.perDag[weekdag(iso)] ?? 0)
}

/** Beschikbare minuten op een dag, met de vulgraad erin. */
export function capaciteit(p: Pick<Planstand, 'perDag' | 'perDatum'>, iso: string): number {
  return Math.floor(minutenOp(p, iso) * VULGRAAD)
}

export const leegPlan = (): Planstand => ({
  toetsen: [], blokken: [], perDag: PER_DAG_STANDAARD.slice(), perDatum: {},
  geplandVoor: null, geplandOp: 0,
})

export function schoonPlan(p: Partial<Planstand> | null | undefined): Planstand {
  const uit = { ...leegPlan(), ...(p ?? {}) }
  uit.toetsen = Array.isArray(uit.toetsen) ? uit.toetsen.filter((t) => t && t.id) : []
  uit.blokken = Array.isArray(uit.blokken) ? uit.blokken.filter((b) => b && b.id) : []
  if (!Array.isArray(uit.perDag) || uit.perDag.length !== 7) uit.perDag = PER_DAG_STANDAARD.slice()
  uit.perDag = uit.perDag.map((m) => (typeof m === 'number' && m >= 0 ? m : 0))
  if (!uit.perDatum || typeof uit.perDatum !== 'object') uit.perDatum = {}
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

/** Wat er voor één toets nog te doen is, en op welke dag dat het liefst valt.
 *  Blokken die al af zijn of door het kind zijn vastgezet slaat hij over. */
function wensen(t: Toets, vandaag: string, overslaan: Set<string>, f: number): Wens[] {
  const uit: Wens[] = []
  const dagen = dagenTussen(vandaag, t.datum)
  if (dagen <= 0) return uit
  const laatste = schuif(t.datum, -1)
  /* Bij een toets eindigt de eerste ronde drie dagen ervoor, zodat er ruimte is
     voor herhalen en overhoren. Bij een opdracht mag hij tot de dag ervoor. */
  const eersteEind = t.opdracht ? laatste : (dagen >= 4 ? schuif(t.datum, -3) : vandaag)
  const eersteLaatst = t.opdracht ? laatste : (dagen >= 2 ? schuif(t.datum, -2) : vandaag)
  const eersteSpan = Math.max(0, dagenTussen(vandaag, eersteEind))

  const n = t.onderdelen.length
  for (let i = 0; i < n; i++) {
    const id = `${t.id}|eerste|${i}`
    if (overslaan.has(id)) continue
    /* Gelijkmatig uitsmeren over de dagen die er voor de eerste ronde zijn. */
    const plek = n > 1 ? Math.round(i / (n - 1) * eersteSpan) : Math.floor(eersteSpan / 2)
    const basis = t.perOnderdeel
    uit.push({
      ideaal: schuif(vandaag, plek), vroegst: vandaag, laatst: eersteLaatst,
      blok: {
        id, toets: t.id, soort: 'eerste', taak: t.onderdelen[i] ?? '',
        datum: '', basis, geschat: rond5(basis * f), gedaan: false, echt: null, klaarOp: null,
      },
    })
  }
  if (t.opdracht) return uit

  const eersteTotaal = n * t.perOnderdeel
  const herhaalId = `${t.id}|herhaal|0`
  if (!overslaan.has(herhaalId)) {
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
  if (!overslaan.has(overhoorId)) {
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
 * waar ze stonden, net als blokken die het kind zelf op een dag heeft gezet.
 * Al het andere wordt opnieuw neergezet. De schattingen van nieuwe blokken
 * worden gecorrigeerd met wat er tot nu toe gemeten is, behalve waar het kind
 * zelf minuten heeft ingevuld.
 */
export function herplan(p: Planstand, vandaag: string, nu = Date.now()): Planstand {
  const s = schatting(p.blokken)
  const f = s.factor
  const levend = p.toetsen.filter((t) => !t.weg)
  const levendIds = new Set(levend.map((t) => t.id))
  const datumVanToets = new Map(levend.map((t) => [t.id, t.datum]))
  const gedaan = p.blokken.filter((b) => b.gedaan && levendIds.has(b.toets))
  /* Vastgezet blijft vast zolang de dag nog komt en vóór de toets valt. Is de
     dag voorbij en het blok niet af, dan plant het bord hem gewoon opnieuw. */
  const vast = p.blokken.filter((b) => !b.gedaan && b.vast && levendIds.has(b.toets)
    && b.datum >= vandaag && b.datum < (datumVanToets.get(b.toets) ?? ''))
  const overslaan = new Set([...gedaan, ...vast].map((b) => b.id))
  const oud = new Map(p.blokken.map((b) => [b.id, b]))

  const alle: Wens[] = []
  for (const t of [...levend].sort((a, b) => a.datum.localeCompare(b.datum))) {
    alle.push(...wensen(t, vandaag, overslaan, f))
  }
  alle.sort((a, b) =>
    a.ideaal.localeCompare(b.ideaal)
    || a.blok.toets.localeCompare(b.blok.toets)
    || VOLGORDE[a.blok.soort] - VOLGORDE[b.blok.soort])

  /* Wat er per dag al bezet is: afgevinkt werk van vandaag of later, en wat het
     kind zelf heeft vastgezet. */
  const bezet = new Map<string, number>()
  for (const b of gedaan) {
    if (b.datum >= vandaag) bezet.set(b.datum, (bezet.get(b.datum) ?? 0) + (b.echt ?? b.geschat))
  }
  for (const b of vast) bezet.set(b.datum, (bezet.get(b.datum) ?? 0) + b.geschat)
  const vrij = (dag: string, min: number): boolean =>
    (bezet.get(dag) ?? 0) + min <= capaciteit(p, dag)

  /* Eerst de ideale dag, dan eerder, dan later, elk binnen de grenzen van het
     soort blok. Past het nergens, dan de dag met de meeste ruimte over: zo
     verdeelt een te volle week zich en belandt niet alles op vandaag. Een dag
     die het kind op nul heeft gezet komt daarbij niet in aanmerking. */
  const plek = (w: Wens, min: number): string | null => {
    if (vrij(w.ideaal, min)) return w.ideaal
    for (let d = schuif(w.ideaal, -1); d >= w.vroegst; d = schuif(d, -1)) if (vrij(d, min)) return d
    for (let d = schuif(w.ideaal, 1); d <= w.laatst; d = schuif(d, 1)) if (vrij(d, min)) return d
    return null
  }
  const minstVol = (w: Wens): string => {
    let beste: string | null = null
    let ruimte = -Infinity
    for (let d = w.vroegst; d <= w.laatst; d = schuif(d, 1)) {
      const cap = capaciteit(p, d)
      if (cap <= 0) continue
      const over = cap - (bezet.get(d) ?? 0)
      if (over > ruimte) { ruimte = over; beste = d }
    }
    return beste ?? w.ideaal
  }

  const nieuw: Blok[] = []
  for (const w of alle) {
    const was = oud.get(w.blok.id)
    /* Wat het kind zelf invulde gaat vóór de correctie, en is ook de basis
       waartegen gemeten wordt: het is háár schatting. */
    const eigen = was?.eigen
    const basis = eigen ?? w.blok.basis
    const geschat = eigen ?? w.blok.geschat
    const dag = plek(w, geschat)
    const datum = dag ?? minstVol(w)
    const blok: Blok = {
      ...w.blok,
      basis, geschat, datum,
      eerst: was?.eerst ?? was?.datum ?? datum,
      echt: was?.echt ?? null,
      ...(eigen != null ? { eigen } : {}),
      ...(was?.losOp ? { losOp: was.losOp } : {}),
      ...(dag ? {} : { vol: true }),
    }
    bezet.set(blok.datum, (bezet.get(blok.datum) ?? 0) + blok.geschat)
    nieuw.push(blok)
  }

  return {
    ...p,
    blokken: [...gedaan, ...vast, ...nieuw].sort((a, b) =>
      a.datum.localeCompare(b.datum) || VOLGORDE[a.soort] - VOLGORDE[b.soort]),
    geplandVoor: vandaag,
    geplandOp: nu,
  }
}

/** De planning zoals hij er vandaag uitziet. Is hij voor een eerdere dag
 *  gemaakt, dan nu opnieuw; anders ongewijzigd. Zo laat elk scherm dat het
 *  bord leest hetzelfde zien, ook als het bord zelf niet geopend is. */
export function actueel(p: Planstand, vandaag: string): Planstand {
  if (p.geplandVoor === vandaag || !p.toetsen.some((t) => !t.weg)) return p
  return herplan(p, vandaag)
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
 * Hoe elke toets ervoor staat. "Op schema" betekent: van wat volgens de
 * oorspronkelijke planning vóór vandaag had moeten gebeuren is minstens
 * tachtig procent af, in minuten. Gemeten op `eerst`, niet op `datum`: een blok
 * dat steeds een dag opschuift blijft dus meetellen als achterstand.
 */
export function toetsStand(p: Planstand, vandaag: string): Toetsstand[] {
  return p.toetsen.filter((t) => !t.weg).map((t) => {
    const mijn = p.blokken.filter((b) => b.toets === t.id)
    const dagen = dagenTussen(vandaag, t.datum)
    const totaal = mijn.length
    const gedaan = mijn.filter((b) => b.gedaan).length
    const rest = mijn.filter((b) => !b.gedaan).reduce((s, b) => s + b.geschat, 0)
    let ruimte = 0
    for (let d = vandaag; d < t.datum; d = schuif(d, 1)) ruimte += capaciteit(p, d)
    const verwacht = mijn.filter((b) => (b.eerst ?? b.datum) < vandaag)
    const verwachtMin = verwacht.reduce((s, b) => s + b.geschat, 0)
    const verwachtAf = verwacht.filter((b) => b.gedaan).reduce((s, b) => s + b.geschat, 0)
    let status: Toetsstatus
    if (totaal > 0 && gedaan === totaal) status = 'klaar'
    else if (gedaan === 0 && verwacht.length === 0) status = 'nog niet begonnen'
    else if (verwachtMin === 0 || verwachtAf / verwachtMin >= 0.8) status = 'op schema'
    else status = 'loopt achter'
    const krap = mijn.some((b) => !b.gedaan && b.vol) || rest > ruimte
    return { toets: t, status, dagen, rest, ruimte, krap, gedaan, totaal }
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

/** Het moment van de laatste vinkhandeling op een blok, aan of uit. */
const vinkMoment = (b: Blok): number => Math.max(b.klaarOp ?? 0, b.losOp ?? 0)

/**
 * Twee planborden bijleggen. Toetsen op id, de nieuwst bewerkte wint, en een
 * grafsteen wint van een levende versie die ouder is. Per blok wint de
 * nieuwste vinkhandeling, aan of uit: wie op de tablet een vinkje weghaalt
 * hoort het niet terug te krijgen van de telefoon die het oude vinkje nog
 * had. De rest van de planning komt van de kant die het laatst gepland heeft,
 * want die heeft de nieuwste dag gezien.
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

  const winnaar = new Map<string, Blok>()
  for (const bl of [...a.blokken, ...b.blokken]) {
    const e = winnaar.get(bl.id)
    if (!e || vinkMoment(bl) > vinkMoment(e)) winnaar.set(bl.id, bl)
  }
  const gedaan = [...winnaar.values()].filter((bl) => bl.gedaan)
  const gedaanIds = new Set(gedaan.map((bl) => bl.id))
  const open = nieuwst.blokken
    .filter((bl) => !gedaanIds.has(bl.id))
    .map((bl) => (bl.gedaan ? (winnaar.get(bl.id) as Blok) : bl))
  const levend = new Set([...toetsen.values()].filter((t) => !t.weg).map((t) => t.id))
  return {
    toetsen: [...toetsen.values()],
    blokken: [...gedaan, ...open].filter((bl) => levend.has(bl.toets)),
    perDag: nieuwst.perDag,
    perDatum: { ...(a.perDatum ?? {}), ...(b.perDatum ?? {}), ...(nieuwst.perDatum ?? {}) },
    geplandVoor: nieuwst.geplandVoor,
    geplandOp: Math.max(a.geplandOp, b.geplandOp),
  }
}

/* -------------------------------------------------------------- bewerken */

export const nieuwId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function zetToets(p: Planstand, t: Toets): Planstand {
  const rest = p.toetsen.filter((x) => x.id !== t.id)
  /* Is de stof veranderd, dan hoort een blok voor een onderdeel dat er niet
     meer is te verdwijnen, en hoort een blok voor een hernoemd onderdeel de
     nieuwe naam te dragen. Wat af is, vastgezet of zelf geschat blijft. */
  const blokken = p.blokken.flatMap((b) => {
    if (b.toets !== t.id || b.gedaan) return [b]
    if (b.soort !== 'eerste') return t.opdracht ? [] : [b]
    const i = Number(b.id.split('|')[2])
    const naam = t.onderdelen[i]
    return naam == null ? [] : [{ ...b, taak: naam }]
  })
  return { ...p, toetsen: [...rest, t], blokken }
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
    blokken: p.blokken.map((b) => {
      if (b.id !== id) return b
      if (gedaan) {
        const { losOp: _weg, ...rest } = b
        return { ...rest, gedaan: true, klaarOp: nu }
      }
      return { ...b, gedaan: false, klaarOp: null, echt: null, losOp: nu }
    }),
  }
}

export function zetEcht(p: Planstand, id: string, echt: number | null): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => (b.id === id ? { ...b, echt } : b)),
  }
}

/** Het kind zet een blok zelf op een dag. Hij staat daarna vast. */
export function verplaats(p: Planstand, id: string, datum: string): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => (b.id === id ? { ...b, datum, vast: true, vol: false } : b)),
  }
}

/** Het blok weer aan het bord overlaten. */
export function maakLos(p: Planstand, id: string): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => {
      if (b.id !== id) return b
      const { vast: _weg, ...rest } = b
      return rest
    }),
  }
}

/** Het kind vult zelf de minuten in; `null` geeft het weer aan het bord. */
export function zetEigen(p: Planstand, id: string, min: number | null): Planstand {
  return {
    ...p,
    blokken: p.blokken.map((b) => {
      if (b.id !== id) return b
      if (min == null) {
        const { eigen: _weg, ...rest } = b
        return rest
      }
      const m = Math.max(5, Math.min(240, Math.round(min)))
      return { ...b, eigen: m, basis: m, geschat: m }
    }),
  }
}

/** Een afwijkende hoeveelheid tijd voor één datum; `null` haalt hem weg. */
export function zetDagtijd(p: Planstand, iso: string, min: number | null): Planstand {
  const perDatum = { ...(p.perDatum ?? {}) }
  if (min == null) delete perDatum[iso]
  else perDatum[iso] = Math.max(0, Math.min(600, Math.round(min)))
  return { ...p, perDatum }
}

/** De stof in stukken knippen: per regel, of per komma als het één regel is. */
export function knipOnderdelen(tekst: string): string[] {
  const regels = tekst.split(/\n/).map((r) => r.trim()).filter(Boolean)
  const stukken = regels.length > 1 ? regels : (regels[0] ?? '').split(/[,;]/).map((r) => r.trim())
  return stukken.filter(Boolean).slice(0, 12)
}
