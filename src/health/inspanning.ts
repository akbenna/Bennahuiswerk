/**
 * INSPANNING — wandelen, rennen, fietsen, en waarom ze niet hetzelfde tellen
 *
 * Dit scherm had één veld voor beweging buiten de stappen om: `fiets_min`. Die
 * naam was altijd al te smal — wie zwemt of hardloopt zette zijn minuten in een
 * vakje dat "fietsen" heette — maar het werd pas echt fout bij het rekenen.
 *
 * WAT DE RICHTLIJN WERKELIJK ZEGT
 *
 * De WHO-richtlijn van 2020 noemt twee bedragen en geen één: 150 tot 300
 * minuten matige inspanning per week, óf 75 tot 150 minuten zware, óf een
 * combinatie waarin een minuut zware voor twee matige telt. Die wisselkoers
 * staat in de richtlijn zelf; hij is hier niet verzonnen.
 *
 * Eén veld kan dat niet dragen. Veertig minuten hardlopen is niet hetzelfde als
 * veertig minuten wandelen, en een app die ze bij elkaar optelt zegt tegen de
 * hardloper dat hij nog niet op de helft is.
 *
 * WAT HIER AANGENOMEN WORDT, EN DAT IS NIET NIETS
 *
 * De intensiteit wordt afgeleid uit de soort, en dat is een aanname. Rennen is
 * niet altijd zwaar en wandelen niet altijd matig: dat hangt af van tempo,
 * helling en van wie het doet. Wat een horloge daarover weet — hartslag als
 * percentage van de reserve — komt niet mee in een schermafdruk en niet in de
 * koppeling.
 *
 * Dus staat het er als aanname en niet als meting. `geschat` blijft bij de rij
 * staan, het scherm zegt het, en de schakelaar staat ernaast voor wie het beter
 * weet. Een aanname die zichzelf niet noemt is in dit ontwerp een fout.
 *
 * WAT HIER NIET IN ZIT
 *
 * Krachttraining. Die telt in de richtlijn apart — twee keer per week
 * spierversterkend, naast de aerobe minuten — en heeft in deze app zijn eigen
 * tabel en zijn eigen drie bolletjes. Zou hij hier ook meetellen, dan haalde
 * één zware sessie de halve week aerobe norm en dat is precies wat de richtlijn
 * níet zegt.
 *
 * En calorieën. Zie de uitleg bij de kaart: het verbruik komt uit de
 * gewichtstrend en daar zit de inspanning al in.
 */

export type Intensiteit = 'matig' | 'zwaar'

export interface Soort {
  sleutel: string
  naam: string
  /** Wat deze soort meestal is. Een aanname, geen meting — zie de kop. */
  intensiteit: Intensiteit
  /** Waar die aanname op rust, in de taal van het scherm. */
  waarom: string
}

/**
 * De soorten die het scherm aanbiedt.
 *
 * De indeling matig/zwaar volgt het Compendium of Physical Activities: matig is
 * 3 tot 6 MET, zwaar is 6 of meer. Wandelen op 5 km/u is 3,5; hardlopen op 8
 * km/u is 8,3; gewoon fietsen 4 tot 6 en stevig fietsen 8 tot 10.
 *
 * Fietsen staat daarmee op de grens, en staat hier als matig. Dat is de
 * voorzichtige kant: wie hard fietst zet de schakelaar om, en wie dat niet doet
 * krijgt geen weekdoel dat zichzelf haalt.
 *
 * `anders` staat er omdat deze lijst nooit af is. Hij telt als matig en vraagt
 * om een naam, zodat er in de lijst iets anders staat dan "anders".
 */
export const SOORTEN: Soort[] = [
  { sleutel: 'wandelen', naam: 'Wandelen', intensiteit: 'matig', waarom: 'ongeveer 3,5 MET' },
  { sleutel: 'rennen', naam: 'Hardlopen', intensiteit: 'zwaar', waarom: '8 MET en meer' },
  { sleutel: 'fietsen', naam: 'Fietsen', intensiteit: 'matig', waarom: '4 tot 6 MET; stevig fietsen is zwaar' },
  { sleutel: 'hometrainer', naam: 'Hometrainer', intensiteit: 'matig', waarom: '4 tot 6 MET bij gewone weerstand' },
  { sleutel: 'zwemmen', naam: 'Zwemmen', intensiteit: 'matig', waarom: '5 tot 6 MET bij rustige baantjes' },
  { sleutel: 'roeien', naam: 'Roeien', intensiteit: 'zwaar', waarom: '7 MET en meer op een roeiapparaat' },
  { sleutel: 'crosstrainer', naam: 'Crosstrainer', intensiteit: 'matig', waarom: 'ongeveer 5 MET' },
  { sleutel: 'racket', naam: 'Tennis of padel', intensiteit: 'zwaar', waarom: '7 tot 8 MET bij enkelspel' },
  { sleutel: 'team', naam: 'Veldsport', intensiteit: 'zwaar', waarom: '7 MET en meer' },
  { sleutel: 'dansen', naam: 'Dansen', intensiteit: 'matig', waarom: '4 tot 5 MET' },
  { sleutel: 'tuinieren', naam: 'Tuinieren', intensiteit: 'matig', waarom: '3,5 tot 4,5 MET bij spitten en harken' },
  { sleutel: 'anders', naam: 'Anders', intensiteit: 'matig', waarom: 'voorzichtig gerekend, want onbekend' },
]

/**
 * De wisselkoers uit de richtlijn: één minuut zware inspanning telt voor twee
 * matige. Dat is geen afronding van iets fysiologisch maar de omrekening die de
 * WHO zelf opschrijft, en daarom staat hij als getal en niet als formule.
 */
export const FACTOR: Record<Intensiteit, number> = { matig: 1, zwaar: 2 }

/** De ondergrens van de richtlijn, uitgedrukt in matige minuten per week. */
export const WEEKDOEL_MIN = 150

export function soortVan(sleutel: string): Soort | null {
  return SOORTEN.find((s) => s.sleutel === sleutel) ?? null
}

/**
 * Wat een soort meestal is.
 *
 * Een sleutel die deze app niet kent — uit een oudere rij, of uit een import
 * die iets nieuws zag — telt als matig. Dat is de kant waarop een fout het
 * minst kwaad doet: te laag rekenen laat je doorgaan, te hoog rekenen zegt dat
 * je klaar bent.
 */
export function standaardIntensiteit(sleutel: string): Intensiteit {
  return soortVan(sleutel)?.intensiteit ?? 'matig'
}

/** De naam voor op het scherm. Een eigen naam bij `anders` gaat voor. */
export function naamVan(sleutel: string, eigennaam?: string | null): string {
  const eigen = eigennaam?.trim()
  if (eigen) return eigen
  return soortVan(sleutel)?.naam ?? sleutel
}

/** Wat deze minuten waard zijn in matige minuten. */
export function equivalent(minuten: number, intensiteit: Intensiteit): number {
  return Math.round(minuten * FACTOR[intensiteit])
}

export interface Inspanningsrij {
  minuten: number
  intensiteit: Intensiteit
}

/** Het weektotaal in matige minuten. Optellen en niet middelen: de richtlijn
 *  staat per week, en drie keer vijftig is hetzelfde als zeven keer eenentwintig. */
export function weektotaal(rijen: Inspanningsrij[]): number {
  return rijen.reduce((s, r) => s + equivalent(r.minuten, r.intensiteit), 0)
}

/**
 * Hoeveel er van elk soort in zat, in echte minuten en niet in equivalenten.
 *
 * Twee lijsten naast elkaar zouden hier verwarren, dus: de verdeling toont wat
 * je gedáán hebt en de balk toont wat het telt. Wie veertig minuten rende ziet
 * daar veertig staan en in de balk tachtig, en de regel eronder zegt waarom.
 */
export function verdeling(
  rijen: Array<{ soort: string; eigennaam?: string | null; minuten: number }>,
): Array<{ naam: string; minuten: number }> {
  const per = new Map<string, number>()
  for (const r of rijen) {
    const naam = naamVan(r.soort, r.eigennaam)
    per.set(naam, (per.get(naam) ?? 0) + Math.round(r.minuten))
  }
  return [...per.entries()]
    .map(([naam, minuten]) => ({ naam, minuten }))
    .sort((a, b) => b.minuten - a.minuten || a.naam.localeCompare(b.naam))
}

/**
 * HET OUDE VELD TELT MEE, EN DAT IS EEN KEUZE
 *
 * `kal_dagen.fiets_min` blijft bestaan. De koppeling op de telefoon vuurt elke
 * ochtend om zeven uur en stuurt dat veld mee; die afspraak breken zou betekenen
 * dat de opdracht op het toestel opnieuw moet, en tot dat gebeurd is komt er
 * niets meer binnen.
 *
 * Dus leest dit scherm hem als één fietsrit van die dag, matig, náást de rijen
 * uit `kal_inspanning`. Een dag met 45 in het oude veld en een wandeling van een
 * half uur in de nieuwe lijst telt 75 matige minuten, en beide staan er.
 *
 * De prijs: een rit die de koppeling doorgeeft én die je met de hand toevoegt
 * telt twee keer. Dat is zichtbaar — ze staan allebei in de lijst van die dag,
 * met hun herkomst erbij — en met één tik weg te halen. Een stille
 * voorkeursregel die er één van de twee laat verdwijnen zou erger zijn: dan mis
 * je minuten zonder te weten welke.
 */
export const OUD_VELD = 'fiets_min'

export interface Post {
  datum: string
  soort: string
  eigennaam?: string | null
  minuten: number
  intensiteit: Intensiteit
  bron: string
}

export function weekposten(
  datums: readonly string[],
  rijen: readonly Post[],
  fiets: Readonly<Record<string, number | null | undefined>>,
): Post[] {
  const week = new Set(datums)
  const uit: Post[] = rijen.filter((r) => week.has(r.datum))
  for (const d of datums) {
    const m = fiets[d]
    /* Nul is geen rit. `kal_dagen.fiets_min` heeft `default 0`, dus elke dag die
       ooit is aangeraakt heeft er een — zonder deze regel stond er bij iedereen
       een kolom nullen in de lijst. */
    if (m != null && m > 0) {
      uit.push({ datum: d, soort: 'fietsen', minuten: m, intensiteit: 'matig', bron: OUD_VELD })
    }
  }
  return uit
}

/** Hoeveel van het weektotaal uit zware inspanning komt, in échte minuten. */
export function zwareMinuten(rijen: readonly Post[]): number {
  return rijen.filter((r) => r.intensiteit === 'zwaar')
    .reduce((s, r) => s + Math.round(r.minuten), 0)
}

/**
 * WELKE DAGEN "DEZE WEEK" ZIJN — en waarom dat geen vanzelfsprekende vraag was
 *
 * Dit scherm nam de dagen uit de gegevens: de sleutels van de dagenkaart,
 * gesorteerd, de laatste eenentwintig. Dat leest logisch en het is op twee
 * manieren fout.
 *
 * DE MINUTEN DIE NIEMAND ZAG
 *
 * De dagenkaart heeft alleen dagen waarvoor een rij in `kal_dagen` bestaat, of
 * waarop iets gelogd is. Een work-outafdruk importeren maakt zo'n rij níet: die
 * schrijft alleen in `kal_inspanning`. Op een dag zonder stappen en zonder eten
 * — een dag van voordat de koppeling draaide, bijvoorbeeld — stond je rit dus
 * wél in de database en nergens op het scherm, en telde hij ook niet mee voor
 * de norm. Precies dezelfde fout als `actieve_energie_kcal`, dat maanden lang
 * netjes werd opgeslagen en door niets werd gelezen.
 *
 * DE WEEK DIE UITDIJDE
 *
 * En de zeven laatste sléútels zijn niet de zeven laatste dágen. Bij een gat in
 * de gegevens reikte "deze week" stilletjes drie weken terug, en dan staat er
 * een weektotaal onder een kop die "Deze week" zegt.
 *
 * Een kalendervenster heeft geen van beide problemen: het bestaat los van wat
 * er toevallig gemeten is, en dat is precies wat een norm per week nodig heeft.
 */
export function dagvenster(tot: string, aantal: number): string[] {
  const eind = Date.parse(tot + 'T12:00:00Z')
  if (!Number.isFinite(eind) || aantal < 1) return []
  const uit: string[] = []
  for (let i = aantal - 1; i >= 0; i--) {
    uit.push(new Date(eind - i * 86400000).toISOString().slice(0, 10))
  }
  return uit
}
