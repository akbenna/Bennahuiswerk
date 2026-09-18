/**
 * DE VOORKEUREN — wat je wél en niet voorgeschoteld wilt krijgen
 *
 * Drie lijsten in deze app doen voorstellen. De coach put uit je eigen
 * geschiedenis; "Uit de tabel" en "Wat vult het best" putten uit het hele
 * Nederlands Voedingsstoffenbestand. Die laatste twee weten niet wat je lust, en
 * stellen dus paardenrookvlees voor aan iemand die geen vlees eet.
 *
 * Hier staat wat iemand over zijn eten heeft gezegd, en hoe dat doorwerkt in een
 * lijst. Niet het scherm en niet de database — alleen de regels, zodat ze een
 * proef kunnen hebben die niet door een browser of een verbinding heen hoeft.
 *
 * HET ONDERSCHEID DAT ALLES DRAAGT: GEZEGD TEGENOVER GEZIEN
 *
 * Bestand 28 in de database legt een keuze vast die hier tegenin lijkt te gaan.
 * `kal_verzadiging` weet uit welke groepen je de laatste zestig dagen gegeten
 * hebt, en gebruikt dat alléén om te markeren en nooit om te sorteren. De reden
 * staat er scherp: wie drie weken hetzelfde eet krijgt anders drie weken
 * hetzelfde voorgesteld. Een lijst die op je gewoonten sorteert loopt zichzelf
 * vast.
 *
 * Dat argument klopt, en het gaat niet over wat hier gebeurt. Het verschil is
 * waar de uitspraak vandaan komt:
 *
 *   GEZIEN   afgeleid uit wat je logde. Sorteren daarop is een lus: je eet iets,
 *            dus krijg je het voorgesteld, dus eet je het. De lijst vernauwt
 *            zichzelf zonder dat iemand dat gekozen heeft.
 *   GEZEGD   door jou aangezet, met opzet. "Ik eet geen vlees" vernauwt niets
 *            over tijd — het is een grens, geen lus. Een vegetariër alleen
 *            vegetarische voorstellen tonen is geen bubbel maar juistheid.
 *
 * Wat hier staat is uitsluitend het tweede soort.
 *
 * MAAR DE ZACHTE VOORKEUR KAN DE LUS ALSNOG BOUWEN
 *
 * "Liever geen vis" is gezegd en niet gezien, en tóch: als dat vis permanent
 * onderaan zet, verdwijnt vis uit beeld en kom je er nooit meer op terug. Dat is
 * dezelfde vernauwing langs een andere weg.
 *
 * Daarom zijn er twee mechanismen en niet één schuifje:
 *
 *   NOOIT    verwijdert. Allergie, eetpatroon, iets waar je niet aan wilt.
 *            Absoluut, en een `nooit` kan niet door iets anders overstemd
 *            worden.
 *   LIEVER   verschuift, begrensd. Een duwtje van hoogstens `DUW` punten op een
 *            score van honderd. Genoeg om bij gelijke geschiktheid te winnen,
 *            te weinig om iets wat aantoonbaar beter is te begraven.
 *
 * Die grens is het hele punt. Zonder plafond is een zachte voorkeur een harde
 * met een vriendelijker naam.
 */

/**
 * Wat iemand structureel niet eet.
 *
 * Dit is geen smaak maar een categorie: het verandert niet per dag en het kent
 * geen uitzonderingen die de app hoort te verzinnen. Daarom een aparte keuze en
 * niet drie vinkjes in de `nooit`-lijst — zo staat er één woord in het profiel
 * waar ook een suppletieregel aan kan hangen.
 */
export type Eetpatroon = 'alles' | 'geen-vlees' | 'geen-vlees-geen-vis' | 'veganistisch'

export interface Voorkeuren {
  patroon: Eetpatroon
  /** Groepen die nooit voorgesteld worden. Verwijdert. */
  nooit: readonly string[]
  /** Groepen die je liever ziet. Verschuift, begrensd. */
  liever: readonly string[]
  /** Groepen die je liever niet ziet. Verschuift, begrensd. */
  minder: readonly string[]
}

export const GEEN_VOORKEUR: Voorkeuren = {
  patroon: 'alles', nooit: [], liever: [], minder: [],
}

/**
 * Hoeveel een zachte voorkeur mag verschuiven, op een score van honderd.
 *
 * Twaalf is gekozen en niet gemeten, en dat hoort erbij te staan. De redenering:
 * de verzadigingsscore van `kal_verzadiging` heeft een drempel van 45 en een
 * praktisch bereik tot ongeveer 85. Twaalf punten verzet iets een paar plaatsen
 * en haalt niets van boven naar onder. Wie een voorkeur aanzet en er niets van
 * merkt heeft er niets aan; wie hem aanzet en de lijst ziet omslaan heeft een
 * filter gekregen waar hij om een duwtje vroeg.
 *
 * Het getal staat hier één keer, zodat het te verstellen is zonder erachteraan
 * te zoeken — en zodat een proef eraan kan hangen.
 */
export const DUW = 12

/**
 * De groepen die een eetpatroon uitsluit.
 *
 * LEEG, EN DAT IS MET OPZET
 *
 * Dit hoort gevuld te worden met de groepsnamen zoals ze wérkelijk in
 * `nevo_foods.groep` staan — zevenentwintig stuks. Die zijn hiervandaan niet op
 * te vragen, en ze verzinnen is hier de duurste fout die er is: een groepsnaam
 * die niet bestaat sluit niets uit, valt nergens over, en levert een vegetariër
 * een lijst met vlees. Precies zoals een verkeerde NEVO-code gewoon de
 * voedingswaarde van iets anders geeft.
 *
 * `patroonSluitUit` valt daarom om zolang dit leeg is, in plaats van stilzwijgend
 * niets uit te sluiten. Zie `voorkeuren.proef.ts`.
 */
export const PATROON_GROEPEN: Record<Eetpatroon, readonly string[]> = {
  'alles': [],
  'geen-vlees': [],
  'geen-vlees-geen-vis': [],
  'veganistisch': [],
}

export class GeenGroepenBekend extends Error {
  constructor(patroon: Eetpatroon) {
    super(`Voor het eetpatroon "${patroon}" staan er geen NEVO-groepen ingevuld. `
      + 'Zie PATROON_GROEPEN in voorkeuren.ts.')
    this.name = 'GeenGroepenBekend'
  }
}

/**
 * Wat dit patroon uitsluit.
 *
 * Gooit als de lijst leeg is voor een patroon dat iets hoort uit te sluiten.
 * Stilzwijgend niets uitsluiten is hier het gevaarlijke antwoord: de gebruiker
 * ziet een aangezet vinkje en krijgt een ongefilterde lijst.
 */
export function patroonSluitUit(patroon: Eetpatroon): readonly string[] {
  if (patroon === 'alles') return []
  const groepen = PATROON_GROEPEN[patroon]
  if (!groepen.length) throw new GeenGroepenBekend(patroon)
  return groepen
}

/**
 * Alles wat verwijderd wordt: het patroon plus wat je zelf hebt uitgezet.
 *
 * Eén verzameling, want voor wat eruit moet doet het er niet toe waaróm.
 */
export function uitgesloten(v: Voorkeuren): Set<string> {
  return new Set([...patroonSluitUit(v.patroon), ...v.nooit])
}

/** Verwijderd of niet. Er is geen derde antwoord. */
export function mag(v: Voorkeuren, groep: string | null | undefined): boolean {
  if (groep == null) return true   // zonder groep valt er niets uit te sluiten
  return !uitgesloten(v).has(groep)
}

/**
 * Het duwtje voor een groep: +DUW, −DUW of nul.
 *
 * Een groep die in beide zachte lijsten staat krijgt nul. Dat is geen
 * spitsvondigheid maar het enige eerlijke antwoord op "liever wel én liever
 * niet": de gebruiker heeft zichzelf tegengesproken en de app hoort niet te
 * kiezen welke helft ze gelooft.
 *
 * Een uitgesloten groep krijgt ook nul — niet omdat het niet uitmaakt, maar
 * omdat hij er al uit is en een duwtje op iets wat niet bestaat een getal is dat
 * nergens over gaat.
 */
export function duwtje(v: Voorkeuren, groep: string | null | undefined): number {
  if (groep == null || !mag(v, groep)) return 0
  const wel = v.liever.includes(groep)
  const niet = v.minder.includes(groep)
  if (wel === niet) return 0
  return wel ? DUW : -DUW
}

export interface Rangschikbaar {
  groep?: string | null
  score?: number | null
}

/**
 * Een lijst filteren en herschikken naar de voorkeuren.
 *
 * Eerst verwijderen, dan verschuiven — in die volgorde, want een uitgesloten
 * regel hoort nergens meer aan mee te doen. De oorspronkelijke volgorde blijft
 * de tiebreak: bij een gelijke aangepaste score wint wie er al boven stond. Dat
 * houdt de rangschikking van de database intact waar de voorkeur niets zegt.
 */
export function pasToe<T extends Rangschikbaar>(regels: readonly T[], v: Voorkeuren): T[] {
  const weg = uitgesloten(v)
  return regels
    .filter((r) => r.groep == null || !weg.has(r.groep))
    .map((r, plek) => ({ r, plek, score: (r.score ?? 0) + duwtje(v, r.groep) }))
    .sort((a, b) => (b.score - a.score) || (a.plek - b.plek))
    .map((x) => x.r)
}

/**
 * Of deze voorkeuren iets doen.
 *
 * Het scherm gebruikt dit om te zwijgen als er niets ingesteld is: een kaart die
 * meldt "je voorkeuren zijn toegepast" terwijl er geen voorkeuren zijn, is ruis.
 */
export function ietsIngesteld(v: Voorkeuren): boolean {
  return v.patroon !== 'alles' || v.nooit.length > 0
    || v.liever.length > 0 || v.minder.length > 0
}
