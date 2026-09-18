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
 *            Absoluut, en een `nooit` kan niet door iets anders overstemd worden.
 *   LIEVER   verschuift, begrensd. Een duwtje van hoogstens `DUW` punten op een
 *            score van honderd. Genoeg om bij gelijke geschiktheid te winnen,
 *            te weinig om iets wat aantoonbaar beter is te begraven.
 *
 * Die grens is het hele punt. Zonder plafond is een zachte voorkeur een harde
 * met een vriendelijker naam.
 */

/**
 * De zevenentwintig groepen van NEVO, letterlijk zoals ze in `nevo_foods.groep`
 * staan.
 *
 * Letterlijk is hier geen stijlkwestie. Een groepsnaam die net niet klopt sluit
 * niets uit, valt nergens over, en levert een vegetariër een lijst met vlees —
 * dezelfde stille fout als een verkeerde NEVO-code die gewoon de voedingswaarde
 * van iets anders geeft. De aantallen staan erbij als vingerafdruk: wijken die
 * af, dan is er iets veranderd aan de tabel en niet aan deze lijst.
 */
export const GROEPEN = [
  'Aardappelen en knolgewassen',                 //  49
  'Alcoholische dranken',                        //  41
  'Brood',                                       // 124
  'Diversen',                                    //  18
  'Eieren',                                      //  13
  'Flesvoeding en preparaten',                   //  58
  'Fruit',                                       // 111
  'Gebak en koek',                               // 170
  'Graanproducten en meelsoorten',               // 142
  'Groente',                                     // 230
  'Hartig broodbeleg',                           //  24
  'Hartige sauzen',                              //  82
  'Hartige snacks en zoutjes',                   //  72
  'Kaas',                                        //  73
  'Kruiden en specerijen',                       //  51
  'Melk en melkproducten',                       // 131
  'Niet-alcoholische dranken',                   // 112
  'Noten en zaden',                              //  37
  'Peulvruchten',                                //  39
  'Samengestelde gerechten',                     //  83
  'Soepen',                                      //  29
  'Suiker, snoep, zoet beleg en zoete sauzen',   // 128
  'Vetten en oliën',                             //  70
  'Vis, schaal- en schelpdieren',                //  98
  'Vlees en gevogelte',                          // 216
  'Vleesvervangers en zuivelvervangers',         //  62
  'Vleeswaren',                                  //  65
] as const

export type Groep = typeof GROEPEN[number]

/**
 * Hoe iemand zich zelf omschrijft.
 *
 * `pescotarisch` staat er apart omdat het een echt verschil is dat mensen zelf
 * maken, en omdat het voor de suppletie uitmaakt: wie vis eet heeft de omega-3-
 * vraag niet.
 */
export type Eetpatroon = 'alles' | 'pescotarisch' | 'vegetarisch' | 'veganistisch'

export const PATROONNAAM: Record<Eetpatroon, string> = {
  'alles': 'Ik eet alles',
  'pescotarisch': 'Geen vlees, wel vis',
  'vegetarisch': 'Vegetarisch',
  'veganistisch': 'Veganistisch',
}

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
 */
export const DUW = 12

/* --------------------------------------------------------------------------
   DE VIER GEMENGDE GROEPEN
   --------------------------------------------------------------------------

   Vier van de zevenentwintig bevatten zowel vlees als niet-vlees, en op
   groepsniveau is dat niet te scheiden:

     Samengestelde gerechten     83   nasi met kip naast nasi zonder
     Soepen                      29   kippensoep naast groentesoep
     Hartige snacks en zoutjes   72   frikandel naast chips
     Hartig broodbeleg           24   smeerpaté naast pindakaas

   Op de naam filteren zou hier verleidelijk zijn en het is precies de fout die
   in bestand 34 een gedroogde tomaat opleverde: een naam zegt wat iemand het
   noemde, niet wat het is. "Nasi rames" bevat kip en zegt dat nergens.

   Dus geen slimmigheid. Het eetpatroon zet deze vier mee uit, en je ziet dat
   staan — zie `voorstel()` hieronder. Wie zijn pindakaas terug wil haalt het
   vinkje weg. Dat kost een handeling en het is eerlijk; een regel die stil
   raadt is dat niet. */
export const GEMENGD: readonly string[] = [
  'Samengestelde gerechten', 'Soepen', 'Hartige snacks en zoutjes', 'Hartig broodbeleg',
]

const VLEES = ['Vlees en gevogelte', 'Vleeswaren']
const VIS = ['Vis, schaal- en schelpdieren']
const DIERLIJK = ['Eieren', 'Kaas', 'Melk en melkproducten']
/* Gebak en koek is bij veganistisch óók gemengd: ei en boter zitten er in het
   merendeel in en staan niet in de naam. Zelfde afweging als hierboven. */
const BAKSEL = ['Gebak en koek']

/**
 * Welke groepen dit patroon vóórstelt uit te zetten.
 *
 * VOORSTELT, EN FILTERT NIET ZELF
 *
 * Dit is de kern van het ontwerp. Het patroon vult de vinkjes; `nooit` bepaalt
 * wat er werkelijk wegvalt. Daardoor staat er nooit een regel te filteren die
 * de gebruiker niet heeft zien staan — en de vier gemengde groepen hierboven
 * zijn een zichtbare keuze in plaats van een stille versimpeling.
 *
 * Wie zich veganistisch noemt en daarna Gebak en koek weer aanzet, heeft dat
 * gedaan met het vinkje voor zich. Dat is zijn keuze en niet onze fout.
 */
export function voorstel(patroon: Eetpatroon): string[] {
  switch (patroon) {
    case 'alles': return []
    case 'pescotarisch': return [...VLEES, ...GEMENGD]
    case 'vegetarisch': return [...VLEES, ...VIS, ...GEMENGD]
    case 'veganistisch': return [...VLEES, ...VIS, ...DIERLIJK, ...BAKSEL, ...GEMENGD]
  }
}

/** Alles wat verwijderd wordt. Alleen `nooit` — zie `voorstel()`. */
export function uitgesloten(v: Voorkeuren): Set<string> {
  return new Set(v.nooit)
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

/**
 * Wat er overblijft om uit te kiezen.
 *
 * Het scherm waarschuwt hiermee voordat de lijst leegloopt. Zet iemand twintig
 * van de zevenentwintig groepen uit, dan is een lege verzadigingslijst geen
 * storing maar het gevolg — en dat hoort hij te lezen vóórdat hij hem leeg ziet.
 */
export function groepenOver(v: Voorkeuren): number {
  const weg = uitgesloten(v)
  return GROEPEN.filter((g) => !weg.has(g)).length
}
