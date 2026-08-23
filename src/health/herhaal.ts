/**
 * WAT JE AL EENS GEGETEN HEBT
 *
 * Het duurste aan loggen is niet het typen maar het opnieuw uitzoeken. Wie elke
 * ochtend dezelfde havermout eet, doorloopt elke ochtend dezelfde vier stappen:
 * tabblad, zoekveld, treffer, portie. Terwijl het antwoord al in de eigen
 * geschiedenis staat — inclusief de portie die je toen gekozen hebt.
 *
 * Dit bestand leidt uit de gelogde regels twee lijsten af: wat je het laatst at
 * en wat je het vaakst eet. Twee lijsten en niet één gemengde ranglijst, omdat
 * een gemengde lijst een gewicht bevat dat niemand kan controleren; "recent" en
 * "vaak" zijn allebei in één zin uit te leggen.
 *
 * Er wordt niets nieuws geschat. Een herhaling neemt de getallen van de vorige
 * keer letterlijk over — inclusief de band eromheen — en zegt erbij dát ze
 * overgenomen zijn. Dat is een aanname (je schept vandaag niet exact hetzelfde
 * op) en die hoort in de regel te staan, niet weggelaten te worden omdat hij
 * onhandig is.
 */
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import type { NieuweRegel } from '@/gedeeld/db/rpc'

export interface Herhaling {
  /** De genormaliseerde naam waarop gegroepeerd is. */
  sleutel: string
  /** De naam zoals hij de laatste keer gespeld werd. */
  naam: string
  /** Hoe vaak in het venster gelogd. */
  aantal: number
  laatst: IsoDatum
  /** Het moment waarop dit meestal gegeten wordt; 'onbekend' als het niet uitmaakt. */
  moment: Moment
  /** De laatste versie: hier komen alle getallen vandaan. */
  regel: Regel
}

export type Lijstsoort = 'recent' | 'vaak'

export interface Herhaalvraag {
  /** Vandaag, of de dag die je aan het invullen bent. */
  nu: IsoDatum
  soort: Lijstsoort
  /** Bij 'vaak': voorrang voor wat op dít moment van de dag gegeten wordt. */
  moment?: Moment | undefined
  /** Hoeveel dagen terug er gekeken wordt. */
  venster?: number
  max?: number
}

/** Namen verschillen per keer in hoofdletters en spaties, verder niet. */
export function sleutelVan(naam: string): string {
  return naam.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Het aantal dagen tussen twee ISO-datums. Beide zijn kale datums, dus de
 *  tijdzone doet niet mee — daarom Date.UTC en niet Date.parse van de string. */
function dagenTussen(van: IsoDatum, tot: IsoDatum): number {
  const t = (s: string): number => {
    const [j, m, d] = s.split('-').map(Number)
    return Date.UTC(j ?? 0, (m ?? 1) - 1, d ?? 1)
  }
  return Math.round((t(tot) - t(van)) / 86400000)
}

/**
 * De regels groeperen op naam.
 *
 * Binnen een groep wint de laatste regel: die levert de getallen. Bij twee
 * regels op dezelfde dag is dat de laatste in de lijst, want zo komen ze uit de
 * database terug.
 */
function groepeer(regels: Regel[]): Map<string, Herhaling> {
  const uit = new Map<string, Herhaling>()
  const momenten = new Map<string, Map<Moment, number>>()

  for (const r of regels) {
    const sleutel = sleutelVan(r.naam)
    if (!sleutel) continue

    const tel = momenten.get(sleutel) ?? new Map<Moment, number>()
    tel.set(r.moment, (tel.get(r.moment) ?? 0) + 1)
    momenten.set(sleutel, tel)

    const staand = uit.get(sleutel)
    if (!staand) {
      uit.set(sleutel, {
        sleutel, naam: r.naam, aantal: 1, laatst: r.datum, moment: r.moment, regel: r,
      })
      continue
    }
    staand.aantal += 1
    if (r.datum >= staand.laatst) {
      staand.laatst = r.datum
      staand.naam = r.naam
      staand.regel = r
    }
  }

  /* Het moment is dat waarop het het vaakst gegeten wordt, niet dat van de
     laatste keer: één avondlijke uitzondering hoort het ontbijt niet te
     verplaatsen. 'onbekend' telt alleen mee als er niets anders is. */
  for (const [sleutel, tel] of momenten) {
    const h = uit.get(sleutel)
    if (!h) continue
    let beste: Moment = 'onbekend'
    let hoogste = 0
    for (const [m, n] of tel) {
      if (m === 'onbekend') continue
      if (n > hoogste) { hoogste = n; beste = m }
    }
    h.moment = beste
  }

  return uit
}

/**
 * De lijst met suggesties.
 *
 * 'recent' is puur op datum: wat je gisteren at staat boven wat je vorige week
 * at, hoe vaak het ook was. 'vaak' telt binnen het venster, met de recentste
 * bovenaan bij gelijk aantal — anders blijft een gerecht dat je een half jaar
 * geleden veertig keer at eeuwig bovenaan staan.
 */
export function herhalingen(regels: Regel[], vraag: Herhaalvraag): Herhaling[] {
  const venster = vraag.venster ?? 60
  const max = vraag.max ?? 12

  const binnen = regels.filter((r) => {
    /* Een importregel is geen gerecht maar een dagtotaal: "Dagtotaal uit Yazio",
       1.319 kcal, 76 gram eiwit. Die als suggestie aanbieden betekent dat één
       tik een hele dag als één maaltijd wegschrijft. Hij hoort in de
       geschiedenis thuis en niet in een lijst waar je uit kiest. */
    if (r.bron === 'import') return false
    const d = dagenTussen(r.datum, vraag.nu)
    return d >= 0 && d <= venster
  })
  const alles = [...groepeer(binnen).values()]

  if (vraag.soort === 'recent') {
    return alles
      .sort((x, y) => (x.laatst === y.laatst
        ? y.aantal - x.aantal || x.naam.localeCompare(y.naam, 'nl')
        : (x.laatst < y.laatst ? 1 : -1)))
      .slice(0, max)
  }

  /* Bij 'vaak' krijgt het gekozen moment voorrang, maar het is geen filter:
     een lijst die leeg is omdat je nooit eerder om drie uur 's nachts at, is
     minder bruikbaar dan een lijst met je gewone dingen eronder. */
  const m = vraag.moment
  const rang = (h: Herhaling): number => (m != null && m !== 'onbekend' && h.moment === m ? 1 : 0)
  return alles
    .sort((x, y) => rang(y) - rang(x)
      || y.aantal - x.aantal
      || (x.laatst === y.laatst ? x.naam.localeCompare(y.naam, 'nl') : (x.laatst < y.laatst ? 1 : -1)))
    .slice(0, max)
}

/**
 * Een herhaling omzetten in een nieuwe regel voor vandaag.
 *
 * Alle getallen komen letterlijk van de vorige keer. Wat erbij komt is de
 * mededeling dat ze overgenomen zijn: de portie van toen is een aanname over
 * vandaag, en deze app zet aannames in de regel en niet in de kleine lettertjes.
 */
export function herhaalRegel(h: Herhaling, datum: IsoDatum, moment: Moment): NieuweRegel {
  const r = h.regel
  const bronnen = r.onzekerheidsbronnen ?? []
  const notitie = `zelfde portie als op ${r.datum}`
  return {
    datum,
    moment,
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
    onzekerheidsbronnen: bronnen.includes(notitie) ? bronnen : [...bronnen, notitie],
    bron: r.bron,
    nevo_code: r.nevo_code,
    dish_id: r.dish_id,
    recept_id: r.recept_id,
  }
}

/**
 * Een hele maaltijd van een eerdere dag in één keer overnemen.
 *
 * Dit is de kortste weg die er is: wie elke werkdag hetzelfde ontbijt eet,
 * herhaalt niet drie losse regels maar één ontbijt. De dag die wordt
 * voorgesteld is de laatste waarop dat moment gevuld was.
 */
export interface Maalherhaling {
  datum: IsoDatum
  moment: Moment
  regels: Regel[]
  kcal: number
}

export function laatsteMaaltijd(
  regels: Regel[], moment: Moment, nu: IsoDatum, negeerDag: IsoDatum,
): Maalherhaling | null {
  const kandidaten = regels.filter(
    (r) => r.moment === moment && r.datum !== negeerDag && dagenTussen(r.datum, nu) > 0)
  if (!kandidaten.length) return null

  let laatste = kandidaten[0]!.datum
  for (const r of kandidaten) if (r.datum > laatste) laatste = r.datum

  const uit = kandidaten.filter((r) => r.datum === laatste)
  /* Eén regel is geen maaltijd om over te nemen: daar staat de losse suggestie
     al voor, en twee knoppen voor hetzelfde is er één te veel. */
  if (uit.length < 2) return null
  return {
    datum: laatste, moment, regels: uit,
    kcal: uit.reduce((n, r) => n + r.kcal_punt, 0),
  }
}
