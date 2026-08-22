/**
 * EERLIJKE BELONING
 *
 * De app rekent zélf uit wat een dag oefenen waard is; de ouder betaalt pas
 * uit. Alleen wat écht bewezen is telt mee:
 *
 *  - alleen "sterk goed" — eerste keer, zónder hint, op een som die nog niet
 *    beheerst was — en gewogen naar moeilijkheid: niveau 1 telt 1, niveau 3
 *    telt 3. Hoger niveau is meer waard;
 *  - een nauwkeurigheidspoort tegen gok- en haastwerk: onder de 70 procent
 *    telt een dag helemaal niet mee, daartussen half tarief;
 *  - een toetsbonus die meeschaalt met de score, pas vanaf een voldoende;
 *  - een dagplafond én een hard weekbudget per kind.
 *
 * Richtlijn: een goede sessie van ongeveer een uur is zo'n vijf euro waard. De
 * begrenzing is er niet om te knijpen maar om het eerlijk te houden: zonder
 * bovengrens loont het om een makkelijke som honderd keer te herhalen.
 *
 * De klok komt als argument binnen — anders is geen enkele uitkomst hier te
 * toetsen zonder de systeemklok te verzetten.
 */
import { dagKort, leesDag, weekSleutel } from './datum'
import type { Voortgang } from './opslag'
import { WEEKBUDGET } from './opslag'

export const BELONING = {
  weekbudget: WEEKBUDGET,
  dagMax: 6,
  tariefPunt: 0.06,
  werkMax: 5,
  /** Zoveel sommen op een dag voordat er iets meetelt. */
  drempel: 12,
  oefenBonus: 2,
  proefBonus: 3,
  /** Vanaf deze nauwkeurigheid vol tarief, daaronder tot `mid` half. */
  hoog: 0.85,
  mid: 0.70,
  toernooiBonus: 10,
}

/** Hoe zwaar een som van dit niveau meetelt. */
export const NIVEAUGEWICHT: Record<number, number> = { 1: 1, 2: 2, 3: 3 }

/** Bedragen gaan per halve euro. Een kind dat € 3,17 hoort te krijgen begrijpt
 *  dat niet, en de ouder telt het niet na. */
export const halfRond = (n: number): number => Math.round(n * 2) / 2

export const euro = (n: number): string => '€ ' + halfRond(n).toFixed(2).replace('.', ',')

export const weekbudgetVan = (pr: Voortgang): number =>
  (typeof pr.weekbudget === 'number' && pr.weekbudget >= 0 ? pr.weekbudget : BELONING.weekbudget)

/** Wat er de laatste zeven dagen daadwerkelijk is uitbetaald. */
export function weekUitbetaald(pr: Voortgang, nu: number): number {
  const grens = nu - 7 * 86400000
  return (pr.betalingen ?? [])
    .filter((b) => leesDag(b.d) >= grens)
    .reduce((s, b) => s + (b.bedrag || 0), 0)
}

export interface Beloningstand {
  bedrag: number
  vandaagBruto: number
  nauw: number
  genoeg: boolean
  factor: number
  poort: string
  sterk: number
  punten: number
  goed: number
  fout: number
  pogingen: number
  werkEuro: number
  toetsEuro: number
  proef: number
  oefen: number
  betaald: boolean
  weekbudget: number
  weekPaid: number
  restWeek: number
}

export function berekenBeloning(pr: Voortgang, nuMs: number): Beloningstand {
  const d = pr.dag
  const t = pr.toetsDag
  const goed = d.goed || 0
  const fout = d.fout || 0
  const sterk = d.sterk || 0
  const punten = d.sterkPunten || 0
  const pogingen = goed + fout
  const nauw = pogingen ? goed / pogingen : 0
  const genoeg = pogingen >= BELONING.drempel

  let factor = 0
  let poort = ''
  if (!genoeg) {
    poort = 'Doe eerst minstens ' + BELONING.drempel + ' sommen om mee te tellen.'
  } else if (nauw >= BELONING.hoog) {
    factor = 1
    poort = 'Top nauwkeurig 💯 — vol tarief'
  } else if (nauw >= BELONING.mid) {
    factor = 0.5
    poort = 'Redelijk — half tarief. Werk nog wat rustiger.'
  } else {
    factor = 0
    poort = 'Te veel fouten — dit telt nog niet. Rustig en goed = beloning.'
  }

  /* Naar moeilijkheid, niet naar aantal: honderd makkelijke sommen horen minder
     op te leveren dan dertig moeilijke. */
  const werkEuro = Math.min(BELONING.werkMax, punten * BELONING.tariefPunt) * factor
  const proef = t.proef || 0
  const oefen = t.oefen || 0
  const toetsEuro = proef >= 70
    ? halfRond(BELONING.proefBonus * (proef / 100))
    : (oefen >= 70 ? halfRond(BELONING.oefenBonus * (oefen / 100)) : 0)

  const vandaagBruto = Math.min(BELONING.dagMax, halfRond(werkEuro + toetsEuro))
  const weekbudget = weekbudgetVan(pr)
  const weekPaid = weekUitbetaald(pr, nuMs)
  const restWeek = Math.max(0, halfRond(weekbudget - weekPaid))

  return {
    bedrag: Math.min(vandaagBruto, restWeek),
    vandaagBruto, nauw, genoeg, factor, poort, sterk, punten, goed, fout, pogingen,
    werkEuro: halfRond(werkEuro), toetsEuro, proef, oefen,
    betaald: pr.betaaldOp === dagKort(new Date(nuMs)),
    weekbudget, weekPaid, restWeek,
  }
}

/**
 * Wat er vandaag verdiend is blijvend vastleggen — net als de punten, zodat het
 * niet verdwijnt bij een nieuwe dag en meesynchroniseert naar de andere
 * toestellen. Geeft een nieuwe voortgang terug; muteert niets.
 */
export function legVerdienstVast(pr: Voortgang, nuMs: number): Voortgang {
  const vandaag = dagKort(new Date(nuMs))
  const bruto = berekenBeloning(pr, nuMs).vandaagBruto
  const lijst = (pr.verdiend ?? []).filter((x) => x?.d !== vandaag)
  if (bruto > 0) lijst.push({ d: vandaag, bedrag: bruto })
  return { ...pr, verdiend: lijst.slice(-400) }
}

/** Deze week eerlijk verdiend met oefenen, gecapt op het weekbudget. */
export function weekVerdiend(pr: Voortgang, nuMs: number): number {
  const grens = nuMs - 7 * 86400000
  const som = (pr.verdiend ?? [])
    .filter((x) => x && leesDag(x.d) >= grens)
    .reduce((s, x) => s + (x.bedrag || 0), 0)
  return Math.max(0, Math.min(weekbudgetVan(pr), halfRond(som)))
}

/** Alles bij elkaar, blijvend. Het werk telt per wéék gecapt op het budget —
 *  anders zou een kind dat drie weken niets deed en daarna één dag alles
 *  inhaalt, drie budgetten tegelijk opstrijken. De toernooibonus en een
 *  handmatige bijstelling komen daar bovenop. */
export function totaalVerdiend(pr: Voortgang): number {
  const perWeek: Record<string, number> = {}
  for (const x of pr.verdiend ?? []) {
    if (!x?.d) continue
    const wk = weekSleutel(leesDag(x.d))
    perWeek[wk] = (perWeek[wk] ?? 0) + (x.bedrag || 0)
  }
  const budget = weekbudgetVan(pr)
  let som = 0
  for (const wk of Object.keys(perWeek)) som += Math.min(budget, perWeek[wk] as number)
  return Math.max(0, halfRond(som + (pr.bonus || 0) + (pr.verdiendBij || 0)))
}

export const totaalUitbetaald = (pr: Voortgang): number =>
  halfRond((pr.betalingen ?? []).reduce((s, b) => s + (b.bedrag || 0), 0))

export const openstaand = (pr: Voortgang): number =>
  Math.max(0, halfRond(totaalVerdiend(pr) - totaalUitbetaald(pr)))

export interface Zomerstand {
  verdiend: number
  doel: number
  bonus: number
  gehaald: boolean
  pct: number
  wekenVoorbij: number
  wekenTotaal: number
  wekenOver: number
}

/** De zomer-uitdaging: hoeveel er sinds de startdatum is uitbetaald, en hoe dat
 *  staat tegenover het doel. */
export function zomerStand(
  pr: Voortgang,
  zomer: { aan: boolean; start: string | null; weken: number; doel: number; bonus: number } | null,
  nuMs: number,
): Zomerstand | null {
  if (!zomer?.aan || !zomer.start) return null
  const startMs = leesDag(zomer.start)
  const verdiend = (pr.betalingen ?? [])
    .filter((b) => leesDag(b.d) >= startMs)
    .reduce((s, b) => s + (b.bedrag || 0), 0)
  const wekenTotaal = zomer.weken || 7
  const wekenVoorbij = Math.max(0,
    Math.min(wekenTotaal, Math.floor((nuMs - startMs) / (7 * 86400000))))
  const doel = zomer.doel || 0
  return {
    verdiend: halfRond(verdiend),
    doel,
    bonus: zomer.bonus || 0,
    gehaald: doel > 0 && verdiend >= doel,
    pct: doel ? Math.min(100, Math.round(verdiend / doel * 100)) : 0,
    wekenVoorbij, wekenTotaal, wekenOver: Math.max(0, wekenTotaal - wekenVoorbij),
  }
}
