/**
 * DE BOUWBANK — een pc samenstellen en zien of hij klopt
 *
 * De controles zijn die je in het echt ook doet voordat je bestelt: past het
 * voetje, past het geheugen, past het bord in de kast, past de kaart in de
 * kast, en levert de voeding genoeg. Wie die vijf kan nalopen kan een pc
 * bestellen zonder dat er iets terug moet.
 *
 * De fps-schatting is een schatting en zegt dat ook. Wat zij moet léren is de
 * verhouding: de videokaart doet het meeste werk en meer nog naarmate het
 * scherm zwaarder is, terwijl de processor een bovengrens is die niet met de
 * resolutie meegroeit. Dát is waarom een snelle kaart op 1080p verspild is en
 * een zwakke processor daar juist de rem wordt.
 */
import { euro } from '@/gedeeld/getal'
import { DEELNAMEN, DELEN, SCHERMEN } from './gegevens/bouwbank'
import type { Deel, Game, Soortdeel } from './gegevens/soorten'

export const SOORTEN = Object.keys(DEELNAMEN) as Soortdeel[]

/** Wat er in de bouw ligt: per soort een deel-id, of niets. */
export type Bouw = Partial<Record<Soortdeel, string>>

export interface Bouwstand extends Bouw {
  budget: number
  scherm: string
}

export const LEGE_BOUW: Bouwstand = { budget: 900, scherm: '1080' }

/* De oude code liep vast op een id dat niet meer bestond: `deelById(...).prijs`
   zonder controle, en dan stond de hele app stil omdat er ooit een onderdeel uit
   de lijst was gehaald. Hier levert een onbekend id gewoon niets op. */
export const deelById = (soort: Soortdeel, id: string | undefined): Deel | null =>
  (id ? DELEN[soort].find((x) => x.id === id) ?? null : null)

export const bouwPrijs = (bouw: Bouw): number =>
  SOORTEN.reduce((n, s) => n + (deelById(s, bouw[s])?.prijs ?? 0), 0)

/**
 * Wat de bouw ongeveer trekt. De voeding telt hier níet mee: zijn `watt` is wat
 * hij kan léveren, niet wat hij verbruikt. Die twee door elkaar halen is precies
 * de fout die de bank moet helpen voorkomen. De 30 W erbij is voor het
 * moederbord en de ventilators.
 */
export const bouwWatt = (bouw: Bouw): number =>
  SOORTEN.reduce((n, s) => (s === 'psu' ? n : n + (deelById(s, bouw[s])?.watt ?? 0)), 30)

export interface Bouwfout {
  /** De zin die op het scherm komt. */
  z: string
  /** Hard betekent: zo werkt hij niet. Zacht is een advies. */
  hard: boolean
  /** Naar welk onderdeel de knop moet springen. */
  kies?: Soortdeel
  /** Gaat dit over geld in plaats van techniek? */
  geld?: boolean
}

export function bouwFouten(bouw: Bouwstand): Bouwfout[] {
  const f: Bouwfout[] = []
  const c = deelById('cpu', bouw.cpu)
  const m = deelById('mobo', bouw.mobo)
  const g = deelById('gpu', bouw.gpu)
  const r = deelById('ram', bouw.ram)
  const p = deelById('psu', bouw.psu)
  const k = deelById('kast', bouw.kast)

  for (const s of SOORTEN) {
    if (!bouw[s]) f.push({ z: 'Er is nog geen ' + DEELNAMEN[s].toLowerCase() + ' gekozen.', hard: true, kies: s })
  }
  if (c && m && c.socket !== m.socket) {
    f.push({ z: 'De ' + c.n + ' heeft voetje ' + c.socket + ', maar het ' + m.n + ' heeft ' + m.socket + '. Die passen niet.', hard: true })
  }
  if (r && m && r.soort !== m.ram) {
    f.push({ z: 'Dit bord wil ' + m.ram + '-geheugen en je koos ' + r.soort + '. Die sleuven zijn anders gekeept.', hard: true })
  }
  if (m && k && !(k.maten ?? []).includes(m.maat ?? '')) {
    f.push({ z: 'Een ' + m.maat + '-bord past niet in de ' + k.n + '.', hard: true })
  }
  if (g && k && (g.lengte ?? 0) > (k.maxLengte ?? 0)) {
    f.push({ z: 'De ' + g.n + ' is ' + g.lengte + ' mm lang; in deze kast past ' + k.maxLengte + ' mm.', hard: true })
  }
  if (p) {
    const w = bouwWatt(bouw)
    const levert = p.watt ?? 0
    if (w > levert) {
      f.push({ z: 'Alles samen trekt ongeveer ' + w + ' W en je voeding levert ' + levert + ' W. Te weinig.', hard: true })
    } else if (w > levert * 0.8) {
      f.push({ z: 'Je zit op ' + w + ' W van de ' + levert + ' W. Dat kan net, maar er is geen marge — neem een maat groter.', hard: false })
    }
  }
  if (r && !r.duo) {
    f.push({ z: 'Eén reepje geheugen betekent geen dual channel. Twee kleinere is sneller dan één grote.', hard: false })
  }
  if (bouw.opslag === 'hdd1') {
    f.push({ z: 'Windows op een harde schijf maakt alles traag. Neem een NVMe.', hard: false })
  }
  const prijs = bouwPrijs(bouw)
  if (prijs > bouw.budget) {
    f.push({ z: 'Je zit ' + euro(prijs - bouw.budget) + ' boven je budget.', hard: false, geld: true })
  }
  return f
}

/**
 * De geschatte beeldjes per seconde. De twee factoren zijn zo gekozen dat de
 * uitkomsten in de buurt van echte tests liggen: een RTX 4060 haalt hier rond
 * de 160 fps in EA FC op 1080p en rond de 55 in Cyberpunk, en een RTX 4080 rond
 * de 40 in Cyberpunk op 4K. Geeft `null` zolang de bouw nog niet ver genoeg is.
 */
export function fpsVan(bouw: Bouw, game: Game, schermId: string): number | null {
  const c = deelById('cpu', bouw.cpu)
  const g = deelById('gpu', bouw.gpu)
  const r = deelById('ram', bouw.ram)
  const o = deelById('opslag', bouw.opslag)
  if (!c || !g || !r) return null

  const scherm = SCHERMEN.find((x) => x.id === schermId) ?? (SCHERMEN[0] as { f: number })
  const gpuFps = ((g.punten ?? 0) * 1.0) / (game.zwaarte * scherm.f)
  const cpuFps = ((c.punten ?? 0) * 2.5) / (game.zwaarte * (0.5 + game.cpuDeel))
  let fps = Math.min(gpuFps, cpuFps)
  if ((r.gb ?? 0) < 16) fps *= 0.82 /* te weinig geheugen kost overal */
  if (!r.duo) fps *= 0.92 /* geen dual channel */
  if (o && (o.punten ?? 0) < 30) fps *= 0.97 /* trage schijf: laadtijd, iets stotteren */
  return Math.round(fps)
}

export { DEELNAMEN, DELEN, GAMES, SCHERMEN } from './gegevens/bouwbank'
