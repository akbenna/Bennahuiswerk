/**
 * WAT ER BEWAARD WORDT
 *
 * Eén stand voor het gezin, met per kind een voortgang. De sleutel blijft
 * `oefenapp_v1`: wie hem hernoemt zet vier kinderen terug op nul.
 *
 * Het samenvoegen kiest per veld wat het verst is: de hoogste punten, het
 * hoogste Leitner-doosje, de langste reeks. Nooit een som — twee toestellen die
 * dezelfde sessie hebben gezien zouden anders alles dubbel tellen.
 */
import { leesDag, weekNummer } from './datum'

/** Eén Leitner-kaart: in welk doosje hij zit, hoe vaak goed en fout, en wanneer
 *  hij voor het laatst gezien is. */
export interface Kaartstand { box: number; ok: number; wrong: number; last: number }

export interface Dagstand {
  d: string | null
  goed: number
  /** "Sterk goed": eerste keer, zonder hint, op een som die nog niet beheerst was. */
  sterk: number
  /** Dezelfde sterke antwoorden, maar gewogen naar moeilijkheid. */
  sterkPunten: number
  fout: number
  sterkIds: string[]
}

export interface Toetsdag { d: string | null; oefen: number; proef: number }
export interface Betaling { d: string; bedrag: number }
export interface Weekstuk { wk: string; punten: number; beheerst: number; geoefend: number }
export interface Foutregel { id: string; when: number; [veld: string]: unknown }

export interface Voortgang {
  punten: number
  /** De oude vorm van beheersing, vóór Leitner. Blijft staan voor de migratie. */
  solved: Record<string, { ok: number }>
  cards: Record<string, Kaartstand>
  streak: number
  dagstreak: number
  lastDay: string | null
  badges: string[]
  goal: number
  todayCount: number
  foutLog: Foutregel[]
  /** Een vaste keuze (1, 2 of 3) of `auto`, waarbij de app meegroeit. */
  niveau: 'auto' | 1 | 2 | 3
  autoLvl: number
  correctRun: number
  dag: Dagstand
  toetsDag: Toetsdag
  betaaldOp: string | null
  weekbudget: number
  betalingen: Betaling[]
  verdiend: Betaling[]
  verdiendBij: number
  bonus: number
  missieStreak: number
  missieLaatst: string | null
  weekKey: string | null
  weekPunten: number
  /** De totaalscore aan het begin van deze week; de toernooistand is het
   *  verschil. Zo begint elke week netjes bij nul zonder een aparte teller die
   *  uit de pas kan lopen. */
  weekBasis: number
  historie: Weekstuk[]
  /** De leerscan van dit kind, als hij hem ingevuld heeft. */
  leerscan?: Leerscanstand
}

export interface Zomer {
  aan: boolean
  start: string | null
  weken: number
  doel: number
  bonus: number
}

export interface Weektaak { items: string[]; set: string }

export interface Stand {
  custom: Array<Record<string, unknown> & { id: string }>
  pin: string
  prog: Record<string, Voortgang>
  geluid: boolean
  voorlezen: boolean
  cloud: { household: string; pin: string; lastServer: number | null; lastSync: number | null }
  kidpw: Record<string, string>
  kidacc: Record<string, { code: string; pw: string }>
  games: Record<string, number>
  wedstrijdAan: boolean
  zomer: Zomer
  spelNaDoel: boolean
  weektaak: Record<string, Weektaak>
  /** De stand van het wekelijkse toernooi: welke week, en per kind de hoogste
   *  weekscore die tot nu toe gezien is. */
  toernooiStand?: { week: string; punten: Record<string, number> }
  /** Wie de vorige week won, zodat het scherm het één keer kan melden. */
  toernooiWinnaar?: { pid: string; week: string; bedrag: number } | null
  /** Wat de kinderen aan de vraagbaak vroegen. Staat hier en niet in de
   *  voortgang van één kind, omdat het ouderscherm ze samen wil zien: het is de
   *  lijst met wat er nog gemaakt moet worden, opgeschreven door de kinderen
   *  zelf. Optioneel, dus een oude opslag blijft gewoon leesbaar. */
  vragen?: Vraagregel[]
}

/** De uitslag van de leerscan van één kind. Optioneel: wie hem nooit invulde
 *  heeft er gewoon geen. */
export interface Leerscanstand {
  tijd: number
  antwoorden: Record<string, number>
}

/** Eén vraag aan de vraagbaak, zoals hij bewaard wordt. */
export interface Vraagregel {
  tijd: number
  pid: string
  vraag: string
  /** De onderwerpen die de app aanwees. Leeg betekent: hier was niets voor. */
  raak: string[]
  /** Wat er volgens het model zou moeten komen, als er niets was. */
  gat: string | null
}

/** Het weekbudget waarmee een nieuw kind begint. */
export const WEEKBUDGET = 20

export const leegDag = (): Dagstand =>
  ({ d: null, goed: 0, sterk: 0, sterkPunten: 0, fout: 0, sterkIds: [] })

export const leegVoortgang = (): Voortgang => ({
  punten: 0, solved: {}, cards: {}, streak: 0, dagstreak: 0, lastDay: null, badges: [],
  goal: 10, todayCount: 0, foutLog: [], niveau: 'auto', autoLvl: 1, correctRun: 0,
  dag: leegDag(), toetsDag: { d: null, oefen: 0, proef: 0 }, betaaldOp: null,
  weekbudget: WEEKBUDGET, betalingen: [], verdiend: [], verdiendBij: 0, bonus: 0,
  missieStreak: 0, missieLaatst: null, weekKey: null, weekPunten: 0, weekBasis: 0, historie: [],
})

type Losse = Partial<Voortgang>

/** Een binnengekomen voortgang op orde brengen: ontbrekende velden aanvullen,
 *  onmogelijke waarden terugzetten, en de oude `solved` omzetten naar
 *  Leitner-kaarten. */
export function schoonVoortgang(p: Losse | null | undefined): Voortgang {
  const np: Voortgang = { ...leegVoortgang(), ...(p ?? {}) }
  np.solved = p?.solved ?? {}
  np.cards = p?.cards ?? {}
  np.badges = p?.badges ?? []
  np.foutLog = p?.foutLog ?? []
  if (typeof np.goal !== 'number') np.goal = 10
  if (typeof np.todayCount !== 'number') np.todayCount = 0
  if (np.niveau !== 'auto' && ![1, 2, 3].includes(np.niveau)) np.niveau = 'auto'
  if (![1, 2, 3].includes(np.autoLvl)) np.autoLvl = 1
  if (typeof np.correctRun !== 'number') np.correctRun = 0
  if (!np.dag || typeof np.dag !== 'object') np.dag = leegDag()
  if (!Array.isArray(np.dag.sterkIds)) np.dag.sterkIds = []
  if (typeof np.dag.sterkPunten !== 'number') np.dag.sterkPunten = 0
  if (typeof np.weekbudget !== 'number') np.weekbudget = WEEKBUDGET
  if (!Array.isArray(np.betalingen)) np.betalingen = []
  if (!Array.isArray(np.verdiend)) np.verdiend = []
  if (typeof np.verdiendBij !== 'number') np.verdiendBij = 0
  if (typeof np.bonus !== 'number') np.bonus = 0
  if (!Array.isArray(np.historie)) np.historie = []
  if (typeof np.missieStreak !== 'number') np.missieStreak = 0
  if (typeof np.weekPunten !== 'number') np.weekPunten = 0
  /* IJkwaarde voor de weekstand: staat hij er niet in, dan is het huidige
     totaal de ijkwaarde — de toernooistand begint dan netjes bij 0 in plaats
     van een oude teller te tonen. */
  np.weekBasis = typeof p?.weekBasis === 'number' ? p.weekBasis : (np.punten || 0)
  if (np.weekBasis > (np.punten || 0)) np.weekBasis = np.punten || 0
  if (!np.toetsDag || typeof np.toetsDag !== 'object') np.toetsDag = { d: null, oefen: 0, proef: 0 }
  /* Eenmalige overzetting: de oude `solved` wordt een Leitner-kaart. */
  if (Object.keys(np.cards).length === 0 && Object.keys(np.solved).length > 0) {
    for (const id of Object.keys(np.solved)) {
      const ok = np.solved[id]?.ok ?? 0
      np.cards[id] = { box: Math.min(5, 1 + ok), ok, wrong: 0, last: 0 }
    }
  }
  return np
}

export const SLEUTEL = 'oefenapp_v1'

export function leegStand(): Stand {
  return {
    custom: [], pin: '1234', prog: {}, geluid: true, voorlezen: true,
    cloud: { household: '', pin: '', lastServer: null, lastSync: null },
    kidpw: {}, kidacc: {}, games: {}, wedstrijdAan: true,
    zomer: { aan: false, start: null, weken: 7, doel: 50, bonus: 15 },
    spelNaDoel: false, weektaak: {}, toernooiWinnaar: null,
  }
}

/** Een binnengekomen stand op orde brengen. `kinderen` zijn de profielen die er
 *  hoe dan ook in moeten zitten. */
export function schoonStand(ruw: Partial<Stand> | null, kinderen: string[]): Stand {
  const s: Stand = { ...leegStand(), ...(ruw ?? {}) }
  s.custom = Array.isArray(s.custom) ? s.custom : []
  s.pin = s.pin || '1234'
  const prog: Record<string, Voortgang> = { ...(s.prog ?? {}) }
  if (typeof s.geluid !== 'boolean') s.geluid = true
  if (typeof s.voorlezen !== 'boolean') s.voorlezen = true
  if (!s.cloud || typeof s.cloud !== 'object') s.cloud = leegStand().cloud
  if (!s.kidpw || typeof s.kidpw !== 'object') s.kidpw = {}
  if (!s.kidacc || typeof s.kidacc !== 'object') s.kidacc = {}
  if (!s.games || typeof s.games !== 'object') s.games = {}
  if (typeof s.wedstrijdAan !== 'boolean') s.wedstrijdAan = true
  if (!s.zomer || typeof s.zomer !== 'object') s.zomer = leegStand().zomer
  if (typeof s.spelNaDoel !== 'boolean') s.spelNaDoel = false
  if (!s.weektaak || typeof s.weektaak !== 'object') s.weektaak = {}
  for (const pid of kinderen) prog[pid] = schoonVoortgang(prog[pid])
  s.prog = prog
  return s
}

export function lees(kinderen: string[]): Stand {
  try {
    const r = localStorage.getItem(SLEUTEL)
    return schoonStand(r ? (JSON.parse(r) as Partial<Stand>) : null, kinderen)
  } catch {
    return schoonStand(null, kinderen)
  }
}

export function schrijf(s: Stand): void {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(s))
  } catch { /* een volle of geweigerde opslag mag het oefenen niet stilzetten */ }
}

/** Wat er naar de centrale opslag gaat: alles behalve de inloggegevens zelf. */
export function zonderCloud(s: Stand): Omit<Stand, 'cloud'> {
  const { cloud: _cloud, ...rest } = s
  return rest
}

/* --------------------------------------------------------------- samenvoegen */

const hoogste = (a: number | undefined, b: number | undefined): number => Math.max(a ?? 0, b ?? 0)

const nieuwste = (a: string | null | undefined, b: string | null | undefined): string | null =>
  (leesDag(a) >= leesDag(b) ? a ?? null : b ?? null)

export function voegKaartenSamen(
  a: Record<string, Kaartstand> | undefined, b: Record<string, Kaartstand> | undefined,
): Record<string, Kaartstand> {
  const uit: Record<string, Kaartstand> = { ...(a ?? {}) }
  for (const id of Object.keys(b ?? {})) {
    const e = uit[id]
    const c = (b ?? {})[id] as Kaartstand
    uit[id] = e
      ? { box: hoogste(e.box, c.box), ok: hoogste(e.ok, c.ok),
          wrong: hoogste(e.wrong, c.wrong), last: hoogste(e.last, c.last) }
      : c
  }
  return uit
}

export function voegVoortgangSamen(x: Losse | null | undefined, y: Losse | null | undefined): Voortgang {
  const a = schoonVoortgang(x)
  const b = schoonVoortgang(y)

  const solved = { ...a.solved }
  for (const id of Object.keys(b.solved)) {
    solved[id] = { ok: hoogste(solved[id]?.ok, b.solved[id]?.ok) }
  }

  const badges = [...new Set([...a.badges, ...b.badges])]

  const gezien = new Set<string>()
  const betalingen: Betaling[] = []
  for (const p of [...a.betalingen, ...b.betalingen]) {
    const k = p.d + '|' + p.bedrag
    if (!gezien.has(k)) { gezien.add(k); betalingen.push(p) }
  }

  /* Verdiensten: per dag het hoogste brutobedrag, zodat de weekstand niet
     verloren gaat en op elk toestel gelijk is. */
  const perDag: Record<string, number> = {}
  for (const x2 of [...a.verdiend, ...b.verdiend]) {
    if (x2?.d) perDag[x2.d] = Math.max(perDag[x2.d] ?? 0, x2.bedrag || 0)
  }
  const verdiend = Object.keys(perDag).map((d) => ({ d, bedrag: perDag[d] as number })).slice(-400)

  /* Leerhistorie: per week de meest complete momentopname. */
  const perWeek: Record<string, Weekstuk> = {}
  for (const h of [...a.historie, ...b.historie]) {
    if (!h?.wk) continue
    const e = perWeek[h.wk]
    if (!e || (h.punten || 0) >= (e.punten || 0)) {
      perWeek[h.wk] = {
        wk: h.wk,
        punten: Math.max(h.punten || 0, e?.punten ?? 0),
        beheerst: Math.max(h.beheerst || 0, e?.beheerst ?? 0),
        geoefend: Math.max(h.geoefend || 0, e?.geoefend ?? 0),
      }
    }
  }
  const historie = Object.keys(perWeek).sort().map((k) => perWeek[k] as Weekstuk).slice(-52)

  const fgezien = new Set<string>()
  const foutLog: Foutregel[] = []
  for (const f of [...a.foutLog, ...b.foutLog].sort((p, q) => (q.when || 0) - (p.when || 0))) {
    if (f && !fgezien.has(f.id)) { fgezien.add(f.id); foutLog.push(f) }
  }

  /* De toernooistand per week bijleggen: dezelfde week → de hoogste teller met
     de laagste ijkwaarde (dus het grootste weekverschil); een andere week → de
     nieuwste, waarbij de oude weekstand vervalt. De ijkwaarde reist mee met de
     week die wint. */
  const punten = hoogste(a.punten, b.punten)
  const basisA = typeof a.weekBasis === 'number' ? a.weekBasis : (a.punten || 0)
  const basisB = typeof b.weekBasis === 'number' ? b.weekBasis : (b.punten || 0)
  let weekKey: string | null
  let weekPunten: number
  let weekBasis: number
  if (a.weekKey && a.weekKey === b.weekKey) {
    weekKey = a.weekKey
    weekPunten = hoogste(a.weekPunten, b.weekPunten)
    weekBasis = Math.min(basisA, basisB)
  } else if (weekNummer(a.weekKey) >= weekNummer(b.weekKey)) {
    weekKey = a.weekKey ?? b.weekKey
    weekPunten = a.weekPunten || 0
    weekBasis = basisA
  } else {
    weekKey = b.weekKey
    weekPunten = b.weekPunten || 0
    weekBasis = basisB
  }
  if (weekBasis > punten) weekBasis = punten

  const zelfdeDag = a.dag.d === b.dag.d
  const dag: Dagstand = zelfdeDag
    ? {
        d: a.dag.d,
        goed: hoogste(a.dag.goed, b.dag.goed),
        sterk: hoogste(a.dag.sterk, b.dag.sterk),
        sterkPunten: hoogste(a.dag.sterkPunten, b.dag.sterkPunten),
        fout: hoogste(a.dag.fout, b.dag.fout),
        sterkIds: [...new Set([...a.dag.sterkIds, ...b.dag.sterkIds])],
      }
    : (leesDag(a.dag.d) >= leesDag(b.dag.d) ? a.dag : b.dag)

  return {
    ...a, ...b,
    punten,
    streak: hoogste(a.streak, b.streak),
    dagstreak: hoogste(a.dagstreak, b.dagstreak),
    missieStreak: hoogste(a.missieStreak, b.missieStreak),
    weekPunten, weekKey, weekBasis,
    missieLaatst: nieuwste(a.missieLaatst, b.missieLaatst),
    todayCount: hoogste(a.todayCount, b.todayCount),
    goal: Math.max(a.goal || 10, b.goal || 10),
    weekbudget: Math.max(a.weekbudget || 0, b.weekbudget || 0),
    autoLvl: Math.max(a.autoLvl || 1, b.autoLvl || 1),
    /* De instelling volgt de kant die hem bewust gezet heeft. */
    niveau: b.niveau !== 'auto' ? b.niveau : a.niveau,
    cards: voegKaartenSamen(a.cards, b.cards),
    solved, badges,
    betalingen: betalingen.slice(-120),
    verdiend, verdiendBij: Math.max(a.verdiendBij, b.verdiendBij),
    bonus: Math.max(a.bonus, b.bonus),
    historie, foutLog: foutLog.slice(0, 40), dag,
    lastDay: nieuwste(a.lastDay, b.lastDay),
    betaaldOp: nieuwste(a.betaaldOp, b.betaaldOp),
    toetsDag: leesDag(a.toetsDag.d) >= leesDag(b.toetsDag.d) ? a.toetsDag : b.toetsDag,
  }
}

export function voegSamen(hier: Partial<Stand> | null, ginds: Partial<Stand> | null): Stand {
  const l = hier ?? {}
  const c = ginds ?? {}
  const uit: Stand = { ...leegStand(), ...l } as Stand
  const prog: Record<string, Voortgang> = {}
  for (const pid of new Set([...Object.keys(l.prog ?? {}), ...Object.keys(c.prog ?? {})])) {
    prog[pid] = voegVoortgangSamen(l.prog?.[pid], c.prog?.[pid])
  }
  uit.prog = prog

  const gezien = new Set<string>()
  uit.custom = []
  for (const e of [...(l.custom ?? []), ...(c.custom ?? [])]) {
    if (e && !gezien.has(e.id)) { gezien.add(e.id); uit.custom.push(e) }
  }
  uit.games = { ...(c.games ?? {}) }
  for (const k of Object.keys(l.games ?? {})) {
    uit.games[k] = hoogste(uit.games[k], (l.games ?? {})[k])
  }
  /* Wachtwoorden en accounts: dit toestel wint, want daar is zojuist iets
     ingesteld. */
  uit.kidpw = { ...(c.kidpw ?? {}), ...(l.kidpw ?? {}) }
  uit.kidacc = { ...(c.kidacc ?? {}), ...(l.kidacc ?? {}) }
  uit.zomer = l.zomer ?? c.zomer ?? uit.zomer
  uit.pin = l.pin || c.pin || '1234'
  return uit
}
