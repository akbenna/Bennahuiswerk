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

/* ========================================================================== */
/*  DE DUIDING                                                                */
/*                                                                            */
/*  Wat er in de schaal zit is één ding; wat het bétekent is een ander. Een    */
/*  maaltijd van 752 kcal zegt niets zonder te weten waar die kcal vandaan     */
/*  komen — en bij deze gebruiker is dat de hele vraag. Vandaar drie maten die */
/*  wél iets zeggen, en twee knoppen om aan te draaien.                        */
/*                                                                            */
/*  Alle drie zijn verhoudingen en dus onafhankelijk van hoeveel je opschept.  */
/*  Dat is precies waarom ze bruikbaar zijn: een halve portie van een schaal   */
/*  met vier gram eiwit per honderd kilocalorieën heeft nog steeds vier gram   */
/*  eiwit per honderd kilocalorieën.                                           */
/* ========================================================================== */

export interface Duiding {
  gram: number | null
  kcal: number
  /** Kilocalorieën per gram. Onder de 1,0 vult het; boven de 2,0 telt het aan. */
  dichtheid: number | null
  /** Gram eiwit per 100 kcal. Dít is de maat die telt bij een tekort. */
  eiwitPer100: number | null
  /** Het aandeel van elke macro in de energie. Telt niet op tot 100 — zie hieronder. */
  ePct: { eiwit: number | null; vet: number | null; koolhydraat: number | null }
  vezel: number | null
}

/**
 * De maten die iets zeggen, over de hele schaal gerekend.
 *
 * De energieprocenten tellen expres niet op tot honderd. Ze worden berekend uit
 * de macro's die er staan, elk met zijn eigen Atwater-factor, en die macro's zijn
 * per onderdeel afgerond op één decimaal. Bovendien leveren vezels zelf ook nog
 * ongeveer twee kilocalorieën per gram. Het verschil normaliseren zou het beeld
 * netter maken en de afwijking verbergen; die afwijking is juist informatie over
 * hoe grof de invoer is.
 */
export function duiding(m: Maaltijd): Duiding {
  const a = aggregaat(m, m.porties)
  const pct = (g: number | null, factor: number): number | null =>
    g == null || a.kcal <= 0 ? null : Math.round((g * factor) / a.kcal * 1000) / 10
  return {
    gram: a.gram,
    kcal: a.kcal,
    dichtheid: a.gram && a.gram > 0 ? Math.round(a.kcal / a.gram * 100) / 100 : null,
    eiwitPer100: a.eiwit == null || a.kcal <= 0
      ? null : Math.round(a.eiwit / a.kcal * 1000) / 10,
    ePct: { eiwit: pct(a.eiwit, 4), vet: pct(a.vet, 9), koolhydraat: pct(a.koolhydraat, 4) },
    vezel: a.vezel,
  }
}

export interface Aandeel {
  naam: string
  kcal: number
  /** Het aandeel in de energie van de hele schaal, tussen 0 en 1. */
  deel: number
  /** Gram eiwit per kcal van dit onderdeel. */
  dichtheid: number | null
}

/** De onderdelen op energie-aandeel, het duurste eerst. */
export function aandelen(m: Maaltijd): Aandeel[] {
  const totaal = m.regels.reduce((n, r) => n + r.kcal_punt, 0)
  return m.regels
    .map((r) => ({
      naam: r.naam,
      kcal: Math.round(r.kcal_punt),
      deel: totaal > 0 ? r.kcal_punt / totaal : 0,
      dichtheid: r.kcal_punt > 0 && r.eiwit_g != null ? r.eiwit_g / r.kcal_punt : null,
    }))
    .sort((x, y) => y.deel - x.deel || x.naam.localeCompare(y.naam, 'nl'))
}

export interface Hefbomen {
  /** Wat je kunt halveren: het onderdeel dat de meeste energie levert. */
  grootste: Aandeel | null
  /** Wat je kunt verdubbelen: het onderdeel met de hoogste eiwitdichtheid. */
  eiwitrijkste: Aandeel | null
}

/**
 * De twee knoppen waar aan te draaien valt.
 *
 * Halveren heeft alleen zin bij iets dat groot genoeg is om de uitkomst te
 * veranderen; onder een kwart van de energie is het een gebaar. Verdubbelen
 * heeft alleen zin bij iets dat de eiwitdichtheid ómhoog trekt, en dat is
 * precies wat "boven het gemiddelde van de maaltijd" betekent — reken het na en
 * het is een identiteit, geen vuistregel. Ligt het rijkste onderdeel op het
 * gemiddelde, dan is er niets te verdubbelen dat iets oplevert, en dan zegt de
 * app dat door te zwijgen.
 */
export function hefbomen(m: Maaltijd): Hefbomen {
  const lijst = aandelen(m)
  const kcal = m.regels.reduce((n, r) => n + r.kcal_punt, 0)
  const eiwit = m.regels.reduce((n, r) => n + (r.eiwit_g ?? 0), 0)
  const gemiddeld = kcal > 0 ? eiwit / kcal : 0

  const grootste = lijst[0] && lijst[0].deel >= 0.25 ? lijst[0] : null

  let eiwitrijkste: Aandeel | null = null
  for (const a of lijst) {
    if (a.dichtheid == null || a.dichtheid <= gemiddeld) continue
    if (eiwitrijkste == null || a.dichtheid > (eiwitrijkste.dichtheid ?? 0)) eiwitrijkste = a
  }
  return { grootste, eiwitrijkste }
}

/** Eén onderdeel met een factor vermenigvuldigen; de rest blijft staan. */
function metFactor(m: Maaltijd, naam: string, f: number): Maaltijd {
  const maal = (n: number | null): number | null => (n == null ? null : n * f)
  return {
    ...m,
    regels: m.regels.map((r) => (r.naam !== naam ? r : {
      ...r,
      hoeveelheid: maal(r.hoeveelheid),
      gram_equivalent: maal(r.gram_equivalent),
      kcal_punt: r.kcal_punt * f,
      kcal_laag: maal(r.kcal_laag),
      kcal_hoog: maal(r.kcal_hoog),
      eiwit_g: maal(r.eiwit_g),
      vet_g: maal(r.vet_g),
      koolhydraat_g: maal(r.koolhydraat_g),
      vezel_g: maal(r.vezel_g),
    })),
  }
}

export interface Variant {
  label: string
  /** De hele schaal. */
  kcal: number
  perPortie: number
  eiwitPortie: number | null
  eiwitPer100: number | null
}

function variant(m: Maaltijd, label: string): Variant {
  const heel = aggregaat(m, m.porties)
  const een = aggregaat(m, 1)
  return {
    label,
    kcal: heel.kcal,
    perPortie: een.kcal,
    eiwitPortie: een.eiwit,
    eiwitPer100: heel.eiwit == null || heel.kcal <= 0
      ? null : Math.round(heel.eiwit / heel.kcal * 1000) / 10,
  }
}

/**
 * Wat er gebeurt als je aan de twee knoppen draait.
 *
 * Vier regels als beide knoppen bestaan, minder als er minder te draaien valt,
 * en niets als er niets te draaien valt. Dat laatste is geen tekortkoming: een
 * maaltijd waarin geen enkel onderdeel een kwart van de energie levert en geen
 * enkel onderdeel boven het eiwitgemiddelde ligt, ís in balans, en dan is er
 * niets te adviseren.
 *
 * Er staat expres geen aanbeveling bij. De tabel zet de vier uitkomsten naast
 * elkaar en jij ziet zelf welke rij je bevalt — dat is een ander soort advies
 * dan een app die zegt wat je moet doen, en het is het soort dat blijft kloppen
 * als je voorkeuren veranderen.
 */
export function varianten(m: Maaltijd): Variant[] {
  const { grootste, eiwitrijkste } = hefbomen(m)
  if (!grootste && !eiwitrijkste) return []

  const uit: Variant[] = [variant(m, 'zoals je hem maakt')]
  let beide = m
  if (grootste) {
    uit.push(variant(metFactor(m, grootste.naam, 0.5), `${grootste.naam} halveren`))
    beide = metFactor(beide, grootste.naam, 0.5)
  }
  if (eiwitrijkste) {
    uit.push(variant(metFactor(m, eiwitrijkste.naam, 2), `${eiwitrijkste.naam} verdubbelen`))
    beide = metFactor(beide, eiwitrijkste.naam, 2)
  }
  if (grootste && eiwitrijkste) uit.push(variant(beide, 'allebei'))
  return uit
}
