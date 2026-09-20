/**
 * DE THUISBLOEDDRUK: één getal uit een week metingen, en wat dat getal niet is
 *
 * Op het klinische scherm stond de nieuwste bloeddrukmeting. Dat is voor deze
 * waarde precies de verkeerde keuze, en om dezelfde reden als bij het gewicht:
 * de dagelijkse schommeling is groter dan het verschil dat je probeert te zien.
 * Eén meting van 148 zegt niets; zeven dagen die rond de 148 uitkomen zeggen
 * alles. De app rekent al zo over het gewicht, en deed het hier niet.
 *
 * WAT DE RICHTLIJN VRAAGT, EN WAT DEZE APP DAARVAN KAN CONTROLEREN
 *
 * De geprotocolleerde thuismeting bij de NHG-Standaard CVRM is: twee metingen
 * vóór het ontbijt en twee metingen twee uur na het avondeten, een week lang.
 *
 * Van dat protocol kan deze app maar de helft nagaan. Een meting draagt hier een
 * datum en geen tijdstip (zie `Meting` in `tabellen.ts`), dus of iemand 's
 * ochtends én 's avonds gemeten heeft is hier niet te zien. De app telt dus
 * metingen en dagen, en zegt er met zoveel woorden bij dat het ochtend-en-avond
 * deel buiten zijn bereik ligt. Dat is beter dan een vinkje dat "protocol
 * gevolgd" zegt op grond van iets wat het niet gemeten heeft.
 *
 * WAAROM EERST PER DAG EN DAARNA PAS OVER DE DAGEN
 *
 * Wie op dinsdag vier keer meet en op woensdag één keer, laat dinsdag vier keer
 * zo zwaar wegen in een plat gemiddelde. Het protocol vraagt om een week, niet
 * om een aantal metingen. Daarom eerst het daggemiddelde en dan het gemiddelde
 * daarvan: elke dag telt één keer mee.
 *
 * WAAROM ER GEEN OORDEEL BIJ STAAT
 *
 * Er komt geen afkapwaarde in deze functie en geen kleur op het scherm. Zelf
 * een grens neerzetten zou hier hetzelfde zijn als een dosis geven: het is de
 * stap van informeren naar beoordelen, en die hoort bij de huisarts of de
 * praktijkondersteuner. Zie de laatste alinea van dit blok: de grens bestaat
 * wel degelijk, de app kiest ervoor hem niet te tonen.
 *
 * Wat er wel bij staat is de spreiding. Een gemiddelde van 132 uit dagen die
 * tussen 118 en 146 liggen is een ander getal dan hetzelfde gemiddelde uit dagen
 * die tussen 130 en 134 liggen, en dat hoort te zien te zijn.
 *
 * DE EERSTE MEETDAG TELT NIET MEE, EN DAT IS RECHTGEZET
 *
 * Hier stond eerst dat de eerste dag bleef meetellen, met als reden dat de
 * handleiding het laten vervallen niet voorschrijft. Dat klopte niet. Het
 * NHG-protocol thuisbloeddrukmeting is 7-2-2 (zeven dagen, twee keer per dag,
 * twee metingen per keer) en laat de eerste dag uitdrukkelijk vervallen: op de
 * eerste dag is iemand nog aan het apparaat aan het wennen en valt de meting
 * systematisch hoger uit. Er blijven zes dagen over.
 *
 * Het gevolg van de oude regel was een gemiddelde dat te hoog uitviel. Dat is
 * de veilige kant van de fout, maar het is wel een fout, en een die de app aan
 * een verkeerd gelezen protocol ophing.
 *
 * WAT HIER ANDERS IS DAN IN HET PROTOCOL, EN WAAROM
 *
 * Het protocol beschrijft één meetweek met een begin. Deze app rekent over een
 * schuivend venster van zeven dagen op een reeks die kan doorlopen. De oudste
 * dag in dat venster is dus niet vanzelf iemands eerste meetdag: wie al drie
 * weken meet is allang gewend, en dan zou die dag weggooien goede gegevens
 * weggooien.
 *
 * De gewenningsdag vervalt daarom alleen als het werkelijk de eerste is: er
 * staat geen enkele eerdere bloeddrukmeting. En hij vervalt niet als er anders
 * niets overblijft, één dag minder is beter dan geen getal.
 *
 * WAT DE APP NOG STEEDS NIET DOET
 *
 * Er komt geen afkapwaarde in deze functie en geen kleur op het scherm. Dat is
 * een keuze en geen leemte: het NHG-protocol noemt wél een grens voor de
 * thuismeting (135/85 mmHg). Hier stond eerder dat die grens er niet was en uit
 * een andere richtlijn kwam; ook dat klopte niet. De grens bestaat, en de app
 * zet hem toch niet neer, omdat de stap van informeren naar beoordelen bij de
 * huisarts of praktijkondersteuner hoort.
 *
 * BRON, EN WAT ER OP 20 SEPTEMBER 2026 WEL EN NIET IS NAGELOPEN
 *
 * Er liggen twee NHG-protocollen naast elkaar en ze gaan over verschillende
 * dingen. Dat onderscheid is hier het hele punt.
 *
 * **Nagelopen tegen het document zelf:** NHG, Protocol bloeddruk meten, 2022,
 * versie 1.1. Dat gaat over de méting in de spreekkamer en niet over de week
 * thuis. Wat het zegt en wat deze app ervan overneemt:
 *
 *   - Elke bloeddrukwaarde die in het dossier komt rust op ten minste twee
 *     metingen, en wat je noteert is het gemiddelde van de laatste twee.
 *   - Vijf minuten rustig zitten vooraf, stil zijn tijdens de meting, voeten
 *     naast elkaar op de grond, de manchet ter hoogte van het midden van het
 *     borstbeen. De manchet moet tussen twee metingen helemaal leeg.
 *   - Verschillen twee metingen meer dan 10 mmHg systolisch of 5 mmHg
 *     diastolisch, dan meet je door tot twee opeenvolgende metingen binnen die
 *     marge liggen. Lukt dat na vier metingen niet, dan overleg je.
 *   - Een verhoogde bloeddruk stel je vast op het gemiddelde van de
 *     geregistreerde bovendrukken over drie verschillende momenten, bij 140
 *     mmHg of hoger.
 *   - En de reden dat een week thuis meten überhaupt bestaat: 15 tot 20 procent
 *     van de mensen heeft alleen in de spreekkamer een verhoogde bloeddruk, en
 *     10 tot 15 procent juist andersom.
 *
 * EN ÉÉN VERSCHIL DAT DAARUIT ZICHTBAAR WERD
 *
 * Het spreekkamerprotocol zegt: noteer het gemiddelde van de láátste twee
 * metingen. Wie drie keer meet omdat de eerste twee te ver uit elkaar lagen,
 * registreert dus de laatste twee en niet alle drie.
 *
 * Deze functie doet iets anders: zij middelt alles wat er op een dag staat. Dat
 * is met opzet blijven staan. Het spreekkamerprotocol gaat over één meting in
 * de spreekkamer, niet over een week thuis, en de rekenregel daarvan overnemen
 * op grond van een document dat er niet over gaat zou precies de fout zijn die
 * hierboven wordt rechtgezet. Het verschil staat hier opgeschreven en wordt
 * vastgehouden door een proef, zodat het niet stilletjes kan verschuiven.
 *
 * **Niet nagelaten tegen het document zelf:** het protocol thuisbloeddrukmeting.
 * De 7-2-2-opzet, het vervallen van de eerste dag en de grens van 135/85 mmHg
 * komen nog steeds uit drie onafhankelijke weergaven en niet uit dat protocol.
 * Het document dat hierboven is nagelopen gaat daar niet over en bevestigt ze
 * dus niet. Wie het protocol thuisbloeddrukmeting op zijn bureau heeft, hoort
 * die drie nog na te lopen voordat ze als gecontroleerd gelden.
 */
import type { IsoDatum, Meting } from '@/gedeeld/db/tabellen'
import { dagenTussen } from './klinisch'

export const SYS = 'bloeddruk_sys'
export const DIA = 'bloeddruk_dia'
/** Een week, want dat is wat het protocol vraagt. */
export const VENSTER_DAGEN = 7

export interface Thuisbloeddruk {
  sys: number
  dia: number
  /** Dagen met zowel een boven- als een onderdruk. */
  dagen: number
  /** Alle losse metingen waar dit op rust. */
  metingen: number
  /** Zijn er op alle zeven dagen van het venster metingen? */
  volledigeWeek: boolean
  /** Hoogste min laagste daggemiddelde, systolisch. */
  spreidingSys: number
  /** Of de eerste meetdag als gewenningsdag buiten het gemiddelde is gelaten. */
  gewenningsdagWeg: boolean
}

/**
 * Het gemiddelde over het venster dat op `tot` eindigt.
 *
 * Null zodra er geen enkele dag is met een compleet paar: een bovendruk zonder
 * onderdruk is geen bloeddruk, en half invullen mag niet stilzwijgend als heel
 * doorgaan.
 */
export function thuisbloeddruk(
  metingen: Meting[], tot: IsoDatum, venster: number = VENSTER_DAGEN,
): Thuisbloeddruk | null {
  const binnen = metingen.filter((m) => {
    if (m.soort !== SYS && m.soort !== DIA) return false
    const d = dagenTussen(m.datum, tot)
    return d >= 0 && d < venster
  })
  if (!binnen.length) return null

  const perDag = new Map<string, { sys: number[]; dia: number[] }>()
  for (const m of binnen) {
    const dag = perDag.get(m.datum) ?? { sys: [], dia: [] }
    ;(m.soort === SYS ? dag.sys : dag.dia).push(Number(m.waarde))
    perDag.set(m.datum, dag)
  }

  const gem = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
  const compleet = [...perDag.entries()]
    .filter(([, d]) => d.sys.length && d.dia.length)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  if (!compleet.length) return null

  /* DE GEWENNINGSDAG
     Alleen als de oudste complete dag in dit venster ook werkelijk iemands
     eerste meetdag is: staat er ook maar één bloeddrukmeting vóór die dag, dan
     was hij al aan het meten en is hij gewend. En nooit als er anders niets
     overblijft. */
  const oudste = compleet[0]![0]
  const eerderGemeten = metingen.some(
    (m) => (m.soort === SYS || m.soort === DIA) && m.datum < oudste,
  )
  const gewenningsdagWeg = !eerderGemeten && compleet.length > 1
  const tellend = gewenningsdagWeg ? compleet.slice(1) : compleet

  const dagSys = tellend.map(([, d]) => gem(d.sys))
  const dagDia = tellend.map(([, d]) => gem(d.dia))

  return {
    sys: Math.round(gem(dagSys)),
    dia: Math.round(gem(dagDia)),
    dagen: tellend.length,
    metingen: tellend.reduce((n, [, d]) => n + d.sys.length + d.dia.length, 0),
    /* Zes tellende dagen is een volledige meetweek: zeven gemeten, de eerste
       eraf. Wie doormeet en dus geen gewenningsdag meer heeft, haalt het met
       zeven. */
    volledigeWeek: tellend.length >= (gewenningsdagWeg ? venster - 1 : venster),
    spreidingSys: Math.round(Math.max(...dagSys) - Math.min(...dagSys)),
    gewenningsdagWeg,
  }
}
