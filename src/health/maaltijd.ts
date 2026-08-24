/**
 * EIGEN MAALTIJDEN — één gerecht, zeven producten, één regel
 *
 * Een tonijnsalade is één ding om te eten en zeven dingen om op te zoeken. Wie
 * hem elke week logt zoekt elke week zeven keer, en krijgt elke week een net
 * iets ander antwoord: dezelfde salade wordt 690 kcal of 810 kcal al naar
 * gelang welke tomaat je aanklikte. Dat verschil is geen echte variatie in wat
 * je at, het is ruis van het invoeren zelf — en die ruis komt daarna in de
 * helling terecht waar het model op rekent.
 *
 * Je zoekt het dus één keer uit, bewaart het, en logt het daarna als één regel.
 *
 * DRIE REGELS DIE HIER HARD STAAN
 *
 * 1. De band telt op zoals de onderdelen: laag bij laag, hoog bij hoog. Dat is
 *    de bréédste optelling die er is — hij veronderstelt dat alle fouten
 *    dezelfde kant op wijzen. Statistisch mag dat te ruim heten; hier is dat
 *    precies goed. Onzekerheid pleit in deze app nooit in je voordeel, en een
 *    smallere band zou een nauwkeurigheid claimen die uit een optelling van
 *    zeven schattingen niet te halen valt.
 *
 * 2. De graad van de maaltijd is de slechtste graad van zijn onderdelen. Zes
 *    gewogen ingrediënten en één geschat scheutje olie maken samen een
 *    geschatte maaltijd. Het gemiddelde nemen zou het scheutje wegmiddelen —
 *    en juist dat scheutje is bij deze gebruiker de grootste post van de dag.
 *
 * 3. Delen door porties kost een trede. Wat je afgewogen in de pan hebt gedaan
 *    is A; wat je daarna op twee borden verdeelt is dat niet meer, want die
 *    twee borden zijn niet gelijk. A zakt daarom naar B zodra de deelfactor
 *    niet 1 is. Lager dan B zakt hij niet: het verdelen voegt onzekerheid toe,
 *    het wist niet wat er al bekend was.
 *
 * Wat hier bewust níét gebeurt is opnieuw rekenen. Er komt geen nieuwe
 * schatting bij; alles komt uit wat je ooit hebt ingevoerd, maal een factor.
 */
import type { Graad, IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import type { Maaltijd, MaaltijdRegel, NieuweRegel } from '@/gedeeld/db/rpc'

/* De vorm zelf staat op de databasegrens, bij de andere vormen die de database
   teruggeeft. Hier staat wat je ermee doet. */
export type { Maaltijd, MaaltijdRegel }

const ORDE: Graad[] = ['A', 'B', 'C', 'D']

/** De slechtste van een reeks graden. Leeg is 'D': niets weten is niet goed. */
export function slechtste(graden: readonly Graad[]): Graad {
  let uit = 0
  for (const g of graden) uit = Math.max(uit, ORDE.indexOf(g))
  return ORDE[graden.length ? uit : 3] ?? 'D'
}

/** Een trede omlaag, maar nooit voorbij B. Zie regel 3 in de kop. */
function eenTredeLager(g: Graad): Graad {
  return g === 'A' ? 'B' : g
}

/** 0,5 → '½'. Halven komen op de knop te staan en lezen zo een stuk sneller. */
export function portieNaam(n: number): string {
  const heel = Math.floor(n)
  const rest = n - heel
  if (Math.abs(rest - 0.5) < 1e-9) return (heel ? String(heel) : '') + '½'
  if (rest === 0) return String(heel)
  return String(Math.round(n * 100) / 100).replace('.', ',')
}

const rondKcal = (n: number): number => Math.round(n)
const rondGram = (n: number): number => Math.round(n * 10) / 10

export interface Aggregaat {
  kcal: number
  kcalLaag: number | null
  kcalHoog: number | null
  eiwit: number | null
  vet: number | null
  koolhydraat: number | null
  vezel: number | null
  gram: number | null
  conf: Graad
  /** Wat er aan deze optelling schort, in gewone taal. Gaat mee de regel in. */
  onzeker: string[]
}

/**
 * De onderdelen optellen en op het gevraagde aantal porties zetten.
 *
 * Ontbrekende velden worden niet stilzwijgend als nul geteld. Een onderdeel
 * zonder eiwitwaarde maakt het eiwit van de maaltijd een ondergrens, en dat
 * hoort in de regel te staan en niet in de kleine lettertjes: anders denkt de
 * coach dat je eiwit gehaald hebt op grond van een optelling met gaten.
 */
export function aggregaat(m: Maaltijd, aantal: number): Aggregaat {
  const deel = aantal / Math.max(m.porties, 1e-9)

  let kcal = 0
  let laag = 0
  let hoog = 0
  let zonderBand = 0
  const som = { eiwit: 0, vet: 0, koolhydraat: 0, vezel: 0 }
  const leeg = { eiwit: 0, vet: 0, koolhydraat: 0, vezel: 0 }
  let gram = 0
  let zonderGram = 0
  const graden: Graad[] = []
  const onzeker: string[] = []

  for (const r of m.regels) {
    kcal += r.kcal_punt
    /* Geen band bekend? Dan telt het punt mee aan beide kanten. Dat maakt de
       band van de maaltijd smaller dan hij hoort te zijn, dus wordt het
       geteld en gemeld. */
    laag += r.kcal_laag ?? r.kcal_punt
    hoog += r.kcal_hoog ?? r.kcal_punt
    if (r.kcal_laag == null || r.kcal_hoog == null) zonderBand++

    for (const veld of ['eiwit', 'vet', 'koolhydraat', 'vezel'] as const) {
      const w = veld === 'eiwit' ? r.eiwit_g
        : veld === 'vet' ? r.vet_g
        : veld === 'koolhydraat' ? r.koolhydraat_g : r.vezel_g
      if (w == null) leeg[veld]++
      else som[veld] += w
    }

    if (r.gram_equivalent == null) zonderGram++
    else gram += r.gram_equivalent

    graden.push(r.conf)
    for (const o of r.onzekerheidsbronnen ?? []) if (!onzeker.includes(o)) onzeker.push(o)
  }

  if (zonderBand > 0) {
    onzeker.push(`van ${zonderBand} ${zonderBand === 1 ? 'onderdeel' : 'onderdelen'} `
      + 'is geen marge bekend; de band is dus eerder te smal dan te breed')
  }
  if (leeg.eiwit > 0) {
    onzeker.push(`het eiwit is een ondergrens: ${leeg.eiwit} `
      + `${leeg.eiwit === 1 ? 'onderdeel heeft' : 'onderdelen hebben'} geen eiwitwaarde`)
  }

  let conf = slechtste(graden)
  if (Math.abs(deel - 1) > 1e-9) {
    conf = eenTredeLager(conf)
    onzeker.push(`${portieNaam(aantal)} van ${portieNaam(m.porties)} `
      + `${m.porties === 1 ? 'portie' : 'porties'}, niet apart gewogen`)
  }

  const macro = (veld: keyof typeof som): number | null =>
    leeg[veld] === m.regels.length ? null : rondGram(som[veld] * deel)

  return {
    kcal: rondKcal(kcal * deel),
    kcalLaag: rondKcal(laag * deel),
    kcalHoog: rondKcal(hoog * deel),
    eiwit: macro('eiwit'),
    vet: macro('vet'),
    koolhydraat: macro('koolhydraat'),
    vezel: macro('vezel'),
    gram: zonderGram === m.regels.length ? null : rondGram(gram * deel),
    conf,
    onzeker,
  }
}

/**
 * Een maaltijd omzetten in de regel die de dag in gaat.
 *
 * Eén regel en niet zeven. De onderdelen blijven in het recept staan en de
 * regel wijst er met `recept_id` naar terug, dus er gaat niets verloren — maar
 * in het dagoverzicht is een salade één salade, en in de suggestielijst van de
 * coach is hij één voorstel in plaats van zeven losse producten waarvan er één
 * "olijfolie, 40 gram" heet.
 */
export function maaltijdRegel(
  m: Maaltijd, aantal: number, datum: IsoDatum, moment: Moment,
): NieuweRegel {
  const a = aggregaat(m, aantal)
  return {
    datum,
    moment,
    naam: `${m.naam} · ${portieNaam(aantal)} ${aantal === 1 ? 'portie' : 'porties'}`,
    hoeveelheid: aantal,
    eenheid: 'portie',
    gram_equivalent: a.gram,
    kcal_punt: a.kcal,
    kcal_laag: a.kcalLaag,
    kcal_hoog: a.kcalHoog,
    eiwit_g: a.eiwit,
    vet_g: a.vet,
    koolhydraat_g: a.koolhydraat,
    vezel_g: a.vezel,
    conf: a.conf,
    onzekerheidsbronnen: a.onzeker.length ? a.onzeker : null,
    bron: 'recept',
    recept_id: m.id,
  }
}

/**
 * Wat je vandaag gelogd hebt vastleggen als de onderdelen van een maaltijd.
 *
 * Alles wat aan de dag hangt gaat eraf: de datum, het moment, het id. Wat
 * overblijft is de voedingswaarde en waar die vandaan kwam. Een regel die zelf
 * uit een maaltijd komt gaat niet mee — anders bewaar je een maaltijd die naar
 * zichzelf verwijst en die bij het tweede keer opslaan verdubbelt.
 */
export function snapshot(regels: readonly Regel[]): MaaltijdRegel[] {
  return regels
    .filter((r) => r.bron !== 'recept' && r.bron !== 'import')
    .map((r) => ({
      naam: r.naam,
      hoeveelheid: r.hoeveelheid,
      eenheid: r.eenheid,
      gram_equivalent: r.gram_equivalent,
      kcal_punt: r.kcal_punt,
      kcal_laag: r.kcal_laag,
      kcal_hoog: r.kcal_hoog,
      eiwit_g: r.eiwit_g,
      vet_g: r.vet_g,
      koolhydraat_g: r.koolhydraat_g,
      vezel_g: r.vezel_g,
      conf: r.conf,
      onzekerheidsbronnen: r.onzekerheidsbronnen,
      bron: r.bron,
      nevo_code: r.nevo_code,
    }))
}

/**
 * Een naam voorstellen voor wat er nu op dat moment staat.
 *
 * De eerste twee onderdelen, want dat is doorgaans waar het gerecht naar heet.
 * Je kunt hem overtypen; het punt is dat er iets staat.
 */
export function naamvoorstel(regels: readonly Regel[], moment: Moment): string {
  const kort = (n: string): string => (n.split('·')[0] ?? n).trim()
  const namen = regels.slice(0, 2).map((r) => kort(r.naam)).filter(Boolean)
  if (!namen.length) return moment === 'onbekend' ? 'Eigen maaltijd' : moment
  return namen.join(' met ')
}
