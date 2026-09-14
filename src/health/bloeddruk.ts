/**
 * DE THUISBLOEDDRUK — één getal uit een week metingen, en wat dat getal niet is
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
 * Er komt geen afkapwaarde in deze functie en geen kleur op het scherm. De
 * praktische handleiding bij de standaard geeft streefwaarden voor de meting in
 * de praktijk; een aparte afkapwaarde voor de thuismeting staat daar niet in, en
 * de waarde die elders circuleert (135/85) komt uit een andere richtlijn. Zelf
 * een grens kiezen zou hier hetzelfde zijn als een dosis geven: het is de stap
 * van informeren naar beoordelen, en die hoort bij de praktijkondersteuner.
 *
 * Wat er wel bij staat is de spreiding. Een gemiddelde van 132 uit dagen die
 * tussen 118 en 146 liggen is een ander getal dan hetzelfde gemiddelde uit dagen
 * die tussen 130 en 134 liggen, en dat hoort te zien te zijn.
 *
 * De eerste dag blijft meetellen. Sommige richtlijnen laten hem vervallen omdat
 * hij systematisch hoger uitvalt; de handleiding waar dit op steunt schrijft dat
 * niet voor. Zolang dat zo is verzint deze app die regel niet zelf.
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
  const compleet = [...perDag.values()].filter((d) => d.sys.length && d.dia.length)
  if (!compleet.length) return null

  const dagSys = compleet.map((d) => gem(d.sys))
  const dagDia = compleet.map((d) => gem(d.dia))

  return {
    sys: Math.round(gem(dagSys)),
    dia: Math.round(gem(dagDia)),
    dagen: compleet.length,
    metingen: compleet.reduce((n, d) => n + d.sys.length + d.dia.length, 0),
    volledigeWeek: compleet.length >= venster,
    spreidingSys: Math.round(Math.max(...dagSys) - Math.min(...dagSys)),
  }
}
