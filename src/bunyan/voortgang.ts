/**
 * PUNTEN, RANGEN, INSIGNES EN GELD
 *
 * Zelfde gedachte als in de huiswerkapp: geld hoort bij afgemaakt werk, met een
 * hard weekplafond zodat het niet uit de hand loopt. Punten en rangen lopen
 * dóór als het weekbudget op is — anders stopt het leren als het geld stopt, en
 * dat is precies de verkeerde les.
 *
 * Alles hier is zuiver: er komt een stand in en er komt een nieuwe stand uit.
 * De oude code veranderde `S` ter plekke en riep zelf `bewaar()` aan; daardoor
 * kon het gebeuren dat de punten wel meetelden en de dagenreeks niet, en was
 * het niet te toetsen zonder de halve app erbij.
 */
import { CODE } from './gegevens/code'
import { PC } from './gegevens/pc'
import type { Blok, Les } from './gegevens/soorten'
import { leeg } from './opslag'
import type { Stand } from './opslag'

export const ALLEBLOKKEN: Blok[] = [...CODE, ...PC]
export const ALLELESSEN: Les[] = ALLEBLOKKEN.flatMap((b) => b.lessen)

export const blokVan = (id: string): Blok | undefined =>
  ALLEBLOKKEN.find((b) => b.lessen.some((l) => l.id === id))
export const lesVan = (id: string): Les | undefined => ALLELESSEN.find((l) => l.id === id)
export const spoorVan = (id: string): 'code' | 'pc' => (id.startsWith('c') ? 'code' : 'pc')

export type Rang = readonly [punten: number, naam: string, ico: string, u: string]

export const RANGEN: Rang[] = [
  [0, 'Noob', '🌱', 'Iedereen begint hier'],
  [150, 'Scriptkiddie', '⌨️', 'Je eerste programma\'s draaien'],
  [400, 'Bouwer', '🔧', 'Je weet wat er in een pc zit'],
  [800, 'Coder', '💻', 'Lussen en lijsten zijn geen probleem meer'],
  [1400, 'Debugger', '🐞', 'Je vindt je eigen fouten'],
  [2200, 'Engineer', '🛠️', 'Je bouwt dingen die af zijn'],
  [3200, 'Architect', '🏛️', 'Je bedenkt het zelf'],
  [4500, 'Legende', '👑', 'Er valt hier weinig meer te halen'],
]

export const rangVan = (p: number): Rang =>
  RANGEN.filter((r) => p >= r[0]).pop() ?? (RANGEN[0] as Rang)
export const volgendeRang = (p: number): Rang | null => RANGEN.find((r) => p < r[0]) ?? null

export const XP = { les: 20, project: 60, blok: 80, perfect: 10 }

export interface Insigne { id: string; n: string; ico: string; u: string }

export const INSIGNES: Insigne[] = [
  { id: 'eerste', n: 'Hallo wereld', ico: '👋', u: 'Je eerste programma gedraaid' },
  { id: 'blokC1', n: 'Python spreekt', ico: '🐍', u: 'Blok 1 van coderen af' },
  { id: 'lus', n: 'Rondje rond', ico: '🔁', u: 'Je eerste lus die werkt' },
  { id: 'lijst', n: 'Alles op een rij', ico: '📋', u: 'Lijsten en woordenboeken af' },
  { id: 'functie', n: 'Zelf gemaakt', ico: '🧩', u: 'Je eerste eigen functie' },
  { id: 'web', n: 'Op het web', ico: '🌐', u: 'De webtalen af' },
  { id: 'onderdeel', n: 'Elk onderdeel', ico: '🔩', u: 'Je kent alle onderdelen van een pc' },
  { id: 'bouw', n: 'Handen aan de kast', ico: '🖥️', u: 'De bouwmodule af' },
  { id: 'budget', n: 'Slimme koper', ico: '💶', u: 'Een pc gebouwd binnen het budget' },
  { id: 'fps', n: 'Honderd frames', ico: '🎮', u: 'Een bouw die 100 fps haalt in de bouwbank' },
  { id: 'reeks7', n: 'Zeven dagen', ico: '🔥', u: 'Zeven dagen achter elkaar geoefend' },
  { id: 'reeks30', n: 'Dertig dagen', ico: '🌙', u: 'Dertig dagen achter elkaar geoefend' },
  { id: 'eigen', n: 'Eigen werk', ico: '✨', u: 'Drie eigen programma\'s bewaard' },
  { id: 'alles', n: 'Alles gehad', ico: '🏆', u: 'Alle lessen van beide sporen af' },
]

export const af = (s: Stand, id: string): boolean => Boolean(s.lessen[id]?.af)
export const blokAf = (s: Stand, b: Blok): boolean => b.lessen.every((l) => af(s, l.id))
export const blokGedaan = (s: Stand, b: Blok): number => b.lessen.filter((l) => af(s, l.id)).length

/** Het weeknummer waarin het weekbudget loopt, als JJJJ-WW. */
export function weekNr(nu: Date): string {
  const start = new Date(nu.getFullYear(), 0, 1)
  const weken = Math.ceil(((nu.getTime() - start.getTime()) / 864e5 + start.getDay() + 1) / 7)
  return nu.getFullYear() + '-' + String(weken).padStart(2, '0')
}

/** Zet het weekpotje op nul zodra er een nieuwe week begonnen is. */
export function nieuweWeek(s: Stand, week: string): Stand {
  return s.week.nr === week ? s : { ...s, week: { nr: week, verdiend: 0 } }
}

const centen = (n: number): number => Math.round(n * 100) / 100

/** Wat er werkelijk verdiend wordt: nooit meer dan wat er deze week nog in zit. */
export function verdien(s: Stand, bedrag: number, week: string): { stand: Stand; echt: number } {
  const na = nieuweWeek(s, week)
  const ruimte = Math.max(0, (na.instel.weekbudget || 6) - na.week.verdiend)
  const echt = Math.min(bedrag, ruimte)
  return {
    echt,
    stand: {
      ...na,
      week: { ...na.week, verdiend: centen(na.week.verdiend + echt) },
      saldo: centen(na.saldo + echt),
    },
  }
}

const LOGLENGTE = 400

/** Een dag bijschrijven in het logboek; bestaande dagen tellen op. */
export function logDag(s: Stand, dag: string, x: { lessen: number; punten: number }): Stand {
  const log = s.log.map((r) => ({ ...r }))
  let r = log.find((y) => y.d === dag)
  if (!r) {
    r = { d: dag, lessen: 0, punten: 0 }
    log.push(r)
  }
  r.lessen += x.lessen
  r.punten += x.punten
  return { ...s, log: log.slice(-LOGLENGTE) }
}

/** De dagenreeks bijwerken. Aaneengesloten dagen tellen op, een gat begint bij één. */
export function reeksBij(s: Stand, vandaag: string, gisteren: string): Stand {
  if (s.laatsteDag === vandaag) return s
  return {
    ...s,
    reeks: s.laatsteDag === gisteren ? (s.reeks || 0) + 1 : 1,
    laatsteDag: vandaag,
  }
}

export type Soortwerk = 'les' | 'project'

export interface Beloning {
  stand: Stand
  /** Was dit de eerste keer dat deze les werd afgerond? Alleen dan telt hij. */
  eerst: boolean
  punten: number
  geld: number
  nieuw: Insigne[]
}

/**
 * Alles wat na een afgeronde les of project gebeurt, op één plek. Zo kan het
 * niet gebeuren dat de punten wel meetellen en de dagenreeks niet.
 */
export function afgerond(
  s: Stand, id: string, score: number, soort: Soortwerk,
  klok: { vandaag: string; gisteren: string; week: string },
): Beloning {
  const oud = s.lessen[id] ?? { af: false, score: 0, pogingen: 0 }
  const eerst = !oud.af
  const punten = (soort === 'project' ? XP.project : XP.les) + (score >= 100 ? XP.perfect : 0)

  let uit: Stand = {
    ...s,
    lessen: {
      ...s.lessen,
      [id]: {
        af: true,
        score: Math.max(oud.score || 0, score),
        pogingen: (oud.pogingen || 0) + 1,
        d: klok.vandaag,
      },
    },
  }
  if (!eerst) return { stand: uit, eerst, punten: 0, geld: 0, nieuw: [] }

  uit = { ...uit, punten: uit.punten + punten }
  const tarief = soort === 'project' ? (uit.instel.tariefProject || 1.5) : (uit.instel.tariefLes || 0.4)
  const beloond = verdien(uit, tarief, klok.week)
  uit = logDag(beloond.stand, klok.vandaag, { lessen: 1, punten })
  uit = reeksBij(uit, klok.vandaag, klok.gisteren)

  const nieuw: Insigne[] = []
  const geef = (insId: string): void => {
    if (uit.insignes.includes(insId)) return
    const i = INSIGNES.find((x) => x.id === insId)
    if (!i) return
    uit = { ...uit, insignes: [...uit.insignes, insId] }
    nieuw.push(i)
  }
  if (uit.reeks >= 7) geef('reeks7')
  if (uit.reeks >= 30) geef('reeks30')
  for (const i of blokInsignes(uit)) {
    if (!uit.insignes.includes(i)) geef(i)
  }
  return { stand: uit, eerst, punten, geld: beloond.echt, nieuw }
}

/** Welke insignes de stand op dit moment verdient. Geeft alleen de id's terug. */
export function blokInsignes(s: Stand): string[] {
  const uit: string[] = []
  const bijBlok = (blokId: string, insId: string): void => {
    const b = ALLEBLOKKEN.find((x) => x.id === blokId)
    if (b && blokAf(s, b)) uit.push(insId)
  }
  const bijLes = (lesId: string, insId: string): void => {
    if (af(s, lesId)) uit.push(insId)
  }
  bijLes('c1-1', 'eerste')
  bijLes('c2-5', 'lus')
  bijLes('c4-1', 'functie')
  bijBlok('c1', 'blokC1')
  bijBlok('c3', 'lijst')
  bijBlok('c5', 'web')
  bijBlok('p1', 'onderdeel')
  bijBlok('p3', 'bouw')
  if (ALLELESSEN.every((l) => af(s, l.id))) uit.push('alles')
  if (s.projecten.length >= 3) uit.push('eigen')
  return uit
}

/** De eerstvolgende les die nog niet af is, of anders de laatste. */
export function volgendeLes(s: Stand, blokken: Blok[]): Les | null {
  for (const b of blokken) {
    for (const l of b.lessen) if (!af(s, l.id)) return l
  }
  return ALLELESSEN.at(-1) ?? null
}

export const leegStand = leeg
