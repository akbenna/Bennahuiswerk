/**
 * DE CONDITIE — wat er bij deze gebruiker speelt, en wat de app daarmee mag
 *
 * Deze app rekent aan energie en verzadiging, en dat is voor de meeste mensen
 * genoeg. Voor een deel van de gebruikers is het dat niet: wie insuline spuit
 * en afvalt krijgt hypo's zodra de inname daalt en de dosis niet meedaalt. Dat
 * is geen zeldzame samenloop maar de gewone gang van zaken in een spreekkamer,
 * en een app die mensen laat afvallen zonder het te noemen laat een gat vallen
 * dat hij zelf heeft gegraven.
 *
 * WAT HIER WEL EN NIET GEBEURT
 *
 * Wat hier gebeurt is signaleren en terugverwijzen. Wat hier niet gebeurt is
 * doseren, en dat is een grens die met opzet scherp ligt. Een insulinedosis is
 * een therapeutische beslissing; software die die beslissing voorrekent is
 * onder de MDR een hulpmiddel van klasse IIb, en dat is deze app niet. De
 * redenering staat voluit in `health/STRATEGIE-CHRONISCHE-ZORG.md`.
 *
 * Er is nog een tweede reden, en die is van deze app zelf. De stelregel is dat
 * geen enkel getal zonder zijn onzekerheid op het scherm komt. Een
 * insulinedosis kán deze app niet met een interval leveren — hij weet de
 * gevoeligheid niet, de koolhydraat-insulineratio niet en de nierfunctie niet.
 * Dus hoort hij het getal niet te geven.
 *
 * WAAROM ER GEEN DREMPELS IN STAAN
 *
 * De verleiding is een signaal te laten afgaan bij "tekort groter dan zoveel
 * kilocalorieën" of "trend steiler dan zoveel kilo per week". Dat zou precisie
 * suggereren die er niet is: zulke drempels staan in geen enkele richtlijn en
 * ik zou ze hier zelf verzinnen. Wat er wél staat is een voorwaarde die geen
 * uitleg nodig heeft — je gebruikt dit middel én je hebt een afvaldoel — en
 * dan één keer de informatie die erbij hoort. Komt er ooit een drempel, dan
 * komt hij uit een richtlijn en met bron in `VERANTWOORDING.md`.
 *
 * WAAROM GROEPEN EN GEEN MIDDELEN
 *
 * De gebruiker kiest een groep, niet een middel. Drie redenen. Alles wat de app
 * ermee doet hangt van de groep af en niet van het merk. Een lijst met losse
 * middelen die onvolledig of verouderd is wekt vertrouwen dat hij niet
 * verdient. En een groep is met een voorbeeld erbij aan te wijzen door iemand
 * die moeizaam leest — in deze praktijk geen bijzaak.
 *
 * Wat er is opgegeven is zelfopgave en geen medicatieoverzicht. Waar het op het
 * scherm komt hoort dat erbij te staan.
 */
import type { Conditie, Instellingen, Medicatiegroep } from '@/gedeeld/db/tabellen'

/* De vorm staat bij de tabellen, want hij woont in een kolom; hier staat wat de
   app ermee doet. Doorgegeven zodat een scherm maar één plek hoeft te kennen. */
export type { Conditie, Medicatiegroep }

/** Wat er op het scherm staat bij elke groep: de naam zoals een patiënt hem
 *  herkent, en een voorbeeld omdat de naam alleen niet genoeg is. */
export const MEDICATIEGROEPEN: ReadonlyArray<{
  groep: Medicatiegroep; naam: string; voorbeeld: string
}> = [
  { groep: 'insuline', naam: 'Insuline', voorbeeld: 'pen of pomp' },
  { groep: 'su', naam: 'Suikertablet die de alvleesklier aanzet', voorbeeld: 'gliclazide, glimepiride' },
  { groep: 'sglt2', naam: 'Tablet die suiker uitplast', voorbeeld: 'dapagliflozine, empagliflozine' },
  { groep: 'glp1', naam: 'Prik voor de suiker of het gewicht', voorbeeld: 'semaglutide, dulaglutide' },
  { groep: 'ras', naam: 'Bloeddrukpil die op de nieren werkt', voorbeeld: 'enalapril, losartan, perindopril' },
  { groep: 'diureticum', naam: 'Plaspil', voorbeeld: 'hydrochloorthiazide, furosemide' },
  { groep: 'metformine', naam: 'Metformine', voorbeeld: 'de meest voorgeschreven suikerpil' },
]

export interface Signaal {
  id: string
  kop: string
  tekst: string
  /** Waar de gebruiker mee verder moet. Altijd een mens, nooit een getal. */
  handeling: string
}

export function conditieVan(i: Instellingen): Conditie {
  return i.conditie ?? {}
}

export function heeftMed(c: Conditie, g: Medicatiegroep): boolean {
  return (c.med ?? []).includes(g)
}

/** Heeft de gebruiker hier iets ingevuld? Leeg is iets anders dan "niets aan de
 *  hand": het betekent dat we het niet weten, en dan zwijgt de app. */
export function conditieGezet(c: Conditie): boolean {
  return !!(c.hypertensie || c.dm2 || c.hvz || (c.med ?? []).length)
}

/**
 * De signalen die bij deze conditie horen.
 *
 * `afvaldoel` is de enige toestand die meeweegt: de eerste twee signalen gaan
 * over wat er gebeurt als de inname daalt, en zonder afvaldoel daalt er niets.
 */
export function signalen(c: Conditie, afvaldoel: boolean): Signaal[] {
  const uit: Signaal[] = []

  if (afvaldoel && (heeftMed(c, 'insuline') || heeftMed(c, 'su'))) {
    uit.push({
      id: 'hypo',
      kop: 'Je suikermedicijn en afvallen',
      tekst: 'Insuline en tabletten die de alvleesklier aanzetten kunnen je bloedsuiker te laag '
        + 'maken zodra je minder eet of gewicht verliest. De dosis die vorige maand klopte, kan '
        + 'over een paar weken te hoog zijn.',
      handeling: 'Bespreek met je huisarts of praktijkondersteuner wanneer de dosis mee moet dalen, '
        + 'en meet vaker je suiker in de weken dat je afvalt.',
    })
  }

  if (afvaldoel && heeftMed(c, 'sglt2')) {
    uit.push({
      id: 'ketoacidose',
      kop: 'Sterk minder koolhydraten met deze tablet',
      tekst: 'Bij een tablet die suiker uitplast kan het lichaam ontregeld raken als je heel weinig '
        + 'koolhydraten eet, ook wanneer je bloedsuiker gewoon normaal is. Je ziet het dus niet aan '
        + 'je meter. Misselijkheid, buikpijn, snel ademen of een vreemde adem zijn signalen om '
        + 'dezelfde dag contact op te nemen.',
      handeling: 'Overleg met je huisarts of praktijkondersteuner voordat je fors minder '
        + 'koolhydraten gaat eten.',
    })
  }

  if (c.hypertensie && heeftMed(c, 'ras')) {
    uit.push({
      id: 'kalium',
      kop: 'Zoutvervangers en je bloeddrukpil',
      tekst: 'Minder zout helpt bij hoge bloeddruk, maar veel zoutvervangers bevatten kalium. In '
        + 'combinatie met een bloeddrukpil die op de nieren werkt kan het kalium in je bloed te '
        + 'hoog worden.',
      handeling: 'Gebruik geen kaliumhoudende zoutvervanger zonder dit eerst met je huisarts of '
        + 'praktijkondersteuner te bespreken. Minder zout gebruiken mag altijd.',
    })
  }

  return uit
}
