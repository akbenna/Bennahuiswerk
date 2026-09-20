/**
 * LEREN — vaste teksten, en waarom dat het hele ontwerp is
 *
 * Wat hier staat is een boekje. Elke tekst is een constante: hij leest niets van
 * de gebruiker, rekent niets uit, en staat er voor iedereen hetzelfde. Dat is
 * geen gemakzucht maar de grens waar deze app aan de goede kant van blijft.
 *
 * Onder MDCG 2019-11 is software die uitsluitend informatie ontsluit, zonder de
 * gegevens van een patiënt te verwerken, geen medisch hulpmiddel: een digitaal
 * leerboek is geen apparaat. "Wat is een hypo en wat doe je dan" als vaste tekst
 * mag dus. Diezelfde tekst berekend voor jóu mag niet. De redenering staat in
 * `health/STRATEGIE-CHRONISCHE-ZORG.md`.
 *
 * De conditie bepaalt hooguit welke bladzijden bovenaan komen. Dat is bladeren
 * en geen verwerken — de tekst zelf verandert er niet van, en dat is precies wat
 * de proef bewaakt.
 *
 * WAAROM ER HIER WÉL GETALLEN IN STAAN
 *
 * In `conditie.ts` mag geen enkel signaal een getal bevatten; daar is een proef
 * voor. Hier staan ze wel, en dat is geen tegenspraak. Het verschil is van wie
 * het getal is. "Eet zes tabletten druivensuiker" is voorlichting die voor
 * iedereen gelijk is en die letterlijk zo op Thuisarts staat. "Verlaag je
 * insuline met vier eenheden" zou een dosis voor één persoon zijn. Het eerste is
 * een boek, het tweede is een behandeling.
 *
 * DE BRON STAAT ERBIJ, EN DAT IS EEN EIS
 *
 * Elke bladzijde draagt zijn herkomst, net als elke voedingswaarde in deze app.
 * Een tekst zonder bron hoort hier niet te staan, en de proef houdt dat vast.
 */
import type { Conditie } from './conditie'
import { heeftMed } from './conditie'

export interface Bladzijde {
  id: string
  titel: string
  /** Korte alinea's. Geen opsommingen: dit wordt gelezen, niet afgevinkt. */
  tekst: string[]
  bron: string
  /** Bij welke conditie deze bladzijde bovenaan hoort. Leeg is: altijd tonen. */
  bij?: (c: Conditie) => boolean
}

export const BLADZIJDEN: readonly Bladzijde[] = [
  {
    id: 'hypo',
    titel: 'Een te lage bloedsuiker (hypo)',
    tekst: [
      'Van een te lage bloedsuiker spreken we onder de 3,9. Je kunt er honger van krijgen, '
        + 'gaan zweten of trillen, duizelig of onrustig worden, hartkloppingen voelen, gapen, '
        + 'wazig zien of in de war raken.',
      'Eet zes suikerklontjes of zes tabletten druivensuiker. Of drink een glas warm water met '
        + 'twee eetlepels suiker. Eet daarna twee boterhammen met zoet beleg, bijvoorbeeld jam.',
      'Meet je bloedsuiker daarna drie keer: na een kwartier, na een uur en na twee uur. Blijft '
        + 'hij onder de 3,9, of reageert iemand niet goed op je, bel dan meteen de huisarts of 112.',
      'Krijg je vaker een hypo, dan is dat een reden om de medicijnen na te lopen met je '
        + 'huisarts of praktijkondersteuner. Vaker een hypo hoort er niet bij.',
    ],
    bron: 'Thuisarts.nl, "Ik heb diabetes type 2 en mijn bloedsuiker is te laag"',
    bij: (c) => heeftMed(c, 'insuline') || heeftMed(c, 'su'),
  },
  {
    id: 'afvallen-en-suiker',
    titel: 'Afvallen als je medicijnen voor je suiker gebruikt',
    tekst: [
      'Insuline en tabletten die de alvleesklier aanzetten zijn afgestemd op wat je nu eet en '
        + 'weegt. Ga je minder eten of val je af, dan kan dezelfde dosis te veel worden. Dat is '
        + 'geen reden om niet af te vallen. Het is een reden om het samen te doen.',
      'Spreek daarom af met je praktijkondersteuner wanneer je vaker meet en wanneer de dosis '
        + 'opnieuw bekeken wordt. Verander je medicijnen nooit op eigen houtje, ook niet als je '
        + 'ziet dat je waarden lager worden.',
      'Deze app rekent aan wat je eet en hoeveel je weegt. Over je dosering zegt hij niets, en dat '
        + 'is met opzet: daar zijn gegevens voor nodig die hij niet heeft.',
    ],
    bron: 'NHG-Standaard Diabetes mellitus type 2',
    bij: (c) => heeftMed(c, 'insuline') || heeftMed(c, 'su'),
  },
  {
    id: 'zout',
    titel: 'Zout en je bloeddruk',
    tekst: [
      'Minder zout eten verlaagt de bloeddruk. Het meeste zout komt niet uit het zoutvaatje maar '
        + 'uit brood, kaas, vleeswaren, soep, sauzen en kant-en-klaar eten. Daar valt dus ook de '
        + 'meeste winst te halen.',
      'Wees voorzichtig met zoutvervangers. Veel daarvan bevatten kalium in plaats van natrium. '
        + 'Gebruik je een bloeddrukpil die op de nieren werkt, dan kan het kalium in je bloed te '
        + 'hoog worden. Bespreek het eerst.',
      'Minder zout gebruiken mag altijd. Kruiden, peper, citroen en azijn geven smaak zonder zout.',
    ],
    bron: 'NHG-Standaard Cardiovasculair risicomanagement',
    bij: (c) => !!c.hypertensie,
  },
  {
    id: 'thuis-meten',
    titel: 'Thuis je bloeddruk meten',
    tekst: [
      'Eén meting zegt weinig. Je bloeddruk wisselt de hele dag, en meer dan het verschil dat je '
        + 'probeert te zien. Daarom meet je een week lang: twee metingen voor het ontbijt en twee '
        + 'metingen twee uur na het avondeten.',
      'Zit rustig, met je rug gesteund en je voeten op de grond, en wacht een paar minuten voor je '
        + 'begint. De manchet hoort om je bovenarm, op harthoogte. Meet niet vlak na koffie, '
        + 'roken of inspanning.',
      'Het gemiddelde van die week is het getal waar het om gaat. Wat dat getal betekent, bespreek '
        + 'je met je huisarts of praktijkondersteuner. Deze app zet er met opzet geen grens bij.',
    ],
    bron: 'NHG-Standaard Cardiovasculair risicomanagement',
    bij: (c) => !!c.hypertensie,
  },
  {
    id: 'koolhydraten',
    titel: 'Koolhydraten, vezels en je suiker',
    tekst: [
      'Er bestaat geen apart dieet bij diabetes. Het uitgangspunt is gewoon gezond eten, met waar '
        + 'nodig een aanpassing die bij jou past. Dat scheelt: je hoeft niet anders te koken dan '
        + 'de rest van je huishouden.',
      'Wat wel uitmaakt is wélke koolhydraten. Volkoren brood, peulvruchten, groente en fruit '
        + 'bevatten vezels, en die zorgen ervoor dat de suiker langzamer in je bloed komt. '
        + 'Frisdrank, wit brood en koek doen het omgekeerde.',
      'In het zoekscherm zie je bij elk product hoeveel koolhydraten en vezels erin zitten, zodra '
        + 'je bij je profiel hebt aangegeven dat je diabetes hebt.',
    ],
    bron: 'NDF Voedingsrichtlijn diabetes (2020, bewijsupdate 2023)',
    bij: (c) => !!c.dm2,
  },
  {
    id: 'suiker-uitplassen',
    titel: 'De tablet die suiker uitplast',
    tekst: [
      'Sommige diabetestabletten laten je nieren suiker uitplassen. Ze werken goed, en ze vragen '
        + 'om één ding extra opletten: eet je heel weinig koolhydraten, dan kan je lichaam '
        + 'ontregeld raken terwijl je bloedsuiker gewoon normaal lijkt. Je ziet het dus niet aan '
        + 'je meter.',
      'Misselijkheid, buikpijn, snel ademen, of een adem die zoetig of naar aceton ruikt: neem dan '
        + 'dezelfde dag contact op. Wacht niet tot de volgende dag omdat je waarden goed zijn.',
      'Wil je fors minder koolhydraten gaan eten, overleg dat dan eerst. Ook als je ziek bent of '
        + 'niet kunt eten is het verstandig te bellen wat je met deze tablet moet doen.',
      'Zorg dat je genoeg drinkt: door het uitplassen verlies je meer vocht dan je gewend bent.',
    ],
    bron: 'NHG-Standaard Diabetes mellitus type 2',
    bij: (c) => heeftMed(c, 'sglt2'),
  },
]

/**
 * De bladzijden, die eerst die bij deze conditie horen.
 *
 * Er valt niets weg. Wie wil lezen over iets wat hij niet heeft, mag dat —
 * verbergen zou suggereren dat de app weet wat er bij iemand speelt, en het
 * enige wat hij weet is wat er is aangevinkt.
 */
export function bladzijden(c: Conditie): Bladzijde[] {
  const raakt = (b: Bladzijde): boolean => (b.bij ? b.bij(c) : false)
  return [...BLADZIJDEN].sort((x, y) => Number(raakt(y)) - Number(raakt(x)))
}
