/**
 * WAT ER VERANDERD IS SINDS JE BEGON
 *
 * Deze app kon alles laten zien behalve het enige dat een behandeling
 * beoordeelt: of er iets beter van geworden is. Op elk scherm stond een
 * momentopname, en het beloop moest je er zelf bij denken.
 *
 * Dat is niet alleen ongemak. Wie afvalt beoordeelt zichzelf op de weegschaal,
 * en dat is precies het getal waarvan bekend is dat het het minst zegt. De
 * vraag die ertoe doet is wat er met je bloeddruk, je middelomtrek en je
 * bloedwaarden gebeurt, en die gegevens staan hier al, met datum en al.
 *
 * DRIE REGELS, EN ZE VOLGEN ALLE DRIE UIT DE REST VAN DEZE APP
 *
 * **Twee metingen op verschillende dagen, of niets.** Eén waarde is geen
 * beloop, en twee waarden op dezelfde dag zijn één meetmoment. Dan komt de
 * regel er niet in, in plaats van een verschil van nul te tonen.
 *
 * **Het gewicht komt uit de trend en niet van de weegschaal.** Het verschil
 * tussen twee losse wegingen is voor een flink deel vocht; het verschil tussen
 * het begin en het eind van de gladde lijn is wat er werkelijk af is. De rest
 * van de app rekent al zo, dit hoort daarbij.
 *
 * **En de bloeddruk komt uit twee weken en niet uit twee metingen.** Diezelfde
 * regel gold hier aanvankelijk niet, en dat was een gat: de kaart zette twee
 * losse bloeddrukmetingen naast elkaar en noemde het verschil, terwijl de
 * kaart eronder met zoveel woorden uitlegt dat één meting geen bloeddruk is.
 * Nu staat aan elk uiteinde het gemiddelde van de meetdagen binnen een week
 * van dat uiteinde, en dragen de twee vensters elkaars dagen niet. Wie maar
 * twee dagen heeft gemeten, houdt twee dagen: het venster maakt het beter waar
 * het kan en verzint niets waar het niet kan.
 *
 * **Er staat een verschil, geen oordeel.** Geen kleur, geen pijl omhoog die
 * "goed" betekent. Of een daling van 0,3 in je HbA1c iets betekent hangt af van
 * dingen die deze app niet weet, en de grens tussen informeren en beoordelen
 * ligt in deze app overal op dezelfde plek.
 *
 * EN ER STAAT BIJ HOE LANG EROVER GEDAAN IS
 *
 * Een verschil zonder tijd erbij is niet te lezen. Zes centimeter eraf in vier
 * maanden is iets anders dan zes centimeter eraf in drie jaar, en het getal is
 * in beide gevallen hetzelfde. De datums stonden er al; ze stonden alleen niet
 * op het scherm.
 */
import type { Lab, Meting } from '@/gedeeld/db/tabellen'
import { VENSTER_DAGEN } from './bloeddruk'
import { dagenTussen } from './klinisch'
import type { Trendpunt } from './rekenkern'

export interface Verandering {
  /** Waar het over gaat, zoals het op het scherm komt. */
  naam: string
  eenheid: string
  vanWaarde: number
  vanDatum: string
  totWaarde: number
  totDatum: string
  /** Tot min van. Positief is omhoog, en dat is niet vanzelf goed of slecht. */
  verschil: number
  /** Hoeveel cijfers achter de komma dit getal verdraagt. */
  decimalen: number
  /** Dagen tussen die twee meetmomenten. Altijd minstens één. */
  dagen: number
  /** Hoeveel meetdagen er achter elk uiteinde zitten. Eén is een los moment. */
  vanDagen: number
  totDagen: number
}

/** Een maand is 365,25/12 dagen, want een kalendermaand bestaat hier niet. */
const MAAND = 365.25 / 12

/**
 * Hoe lang ertussen zit, in de eenheid die bij die afstand past.
 *
 * Onder de twee weken staan de dagen er los; daarboven zou "17 dagen" preciezer
 * klinken dan het is, want de meetmomenten liggen zelf al niet op een vaste
 * dag. Vanaf twee jaar worden het jaren, en daaronder blijven het maanden:
 * "18 mnd" zegt meer dan "1,5 jr".
 *
 * Hoe lang een maand of een jaar precies duurt doet hier niet toe: op hele
 * maanden en hele jaren afgerond geeft elke redelijke waarde hetzelfde antwoord.
 * Wat wel toedoet zijn de grenzen, en dat een span niet in de verkeerde eenheid
 * belandt. Dat is wat de proef vasthoudt.
 */
export function tijdspanne(dagen: number): string {
  if (dagen < 14) return `${dagen} d`
  if (dagen < 70) return `${Math.round(dagen / 7)} wk`
  if (dagen < 730) return `${Math.round(dagen / MAAND)} mnd`
  return `${Math.round(dagen / (MAAND * 12))} jr`
}

interface Punt { datum: string; waarde: number }
interface Uiteinde { datum: string; waarde: number; dagen: number }

const gemiddelde = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/** Eén waarde per dag: twee metingen op één dag zijn één meetmoment. */
function perDag(punten: readonly Punt[]): Punt[] {
  const bak = new Map<string, number[]>()
  for (const p of punten) bak.set(p.datum, [...(bak.get(p.datum) ?? []), p.waarde])
  return [...bak.entries()]
    .map(([datum, ws]) => ({ datum, waarde: gemiddelde(ws) }))
    .sort((a, b) => a.datum.localeCompare(b.datum))
}

/**
 * De twee uiteinden van een reeks, elk over een venster van zoveel dagen.
 *
 * Met `venster` op 1 is dit de eerste meetdag tegen de laatste. Groter dan 1
 * betekent: het gemiddelde van de meetdagen binnen zoveel dagen van dat
 * uiteinde. Dat is wat de bloeddruk nodig heeft en wat een losse meting niet
 * kan geven.
 *
 * ELKE DAG HOORT BIJ HET UITEINDE WAAR HIJ HET DICHTST BIJ LIGT
 *
 * Anders zou bij een reeks die korter is dan twee vensters dezelfde dag aan
 * beide kanten meetellen, en dan vergelijkt het verschil een getal met
 * zichzelf. Ligt een dag precies even ver van beide uiteinden, dan telt hij
 * nergens mee: hij zegt over geen van beide kanten iets.
 */
function uiteinden(punten: readonly Punt[], venster: number): {
  van: Uiteinde; tot: Uiteinde
} | null {
  const op = perDag(punten)
  const eerste = op[0]
  const laatste = op[op.length - 1]
  /* Eén meetmoment is geen beloop. Zie de kop. */
  if (!eerste || !laatste || eerste.datum === laatste.datum) return null

  const vanKant: Punt[] = []
  const totKant: Punt[] = []
  for (const p of op) {
    const voor = dagenTussen(eerste.datum, p.datum)
    const na = dagenTussen(p.datum, laatste.datum)
    if (voor < venster && voor < na) vanKant.push(p)
    else if (na < venster && na < voor) totKant.push(p)
  }

  return {
    van: {
      datum: eerste.datum,
      waarde: gemiddelde(vanKant.map((p) => p.waarde)),
      dagen: vanKant.length,
    },
    tot: {
      datum: laatste.datum,
      waarde: gemiddelde(totKant.map((p) => p.waarde)),
      dagen: totKant.length,
    },
  }
}

const rond = (x: number, n: number): number => Math.round(x * 10 ** n) / 10 ** n

function regel(
  naam: string, eenheid: string, decimalen: number,
  punten: readonly Punt[], venster = 1,
): Verandering | null {
  const b = uiteinden(punten, venster)
  if (!b) return null
  return {
    naam,
    eenheid,
    vanWaarde: rond(b.van.waarde, decimalen),
    vanDatum: b.van.datum,
    totWaarde: rond(b.tot.waarde, decimalen),
    totDatum: b.tot.datum,
    verschil: rond(b.tot.waarde - b.van.waarde, decimalen),
    decimalen,
    dagen: dagenTussen(b.van.datum, b.tot.datum),
    vanDagen: b.van.dagen,
    totDagen: b.tot.dagen,
  }
}

/** De labwaarden die hier horen, in de volgorde waarin ze op het scherm komen. */
const LABS: ReadonlyArray<readonly [code: string, naam: string, eenheid: string, dec: number]> = [
  ['hba1c', 'HbA1c', 'mmol/mol', 0],
  ['glucose_nuchter', 'Nuchter glucose', 'mmol/L', 1],
  ['ldl', 'LDL-cholesterol', 'mmol/L', 1],
  ['hdl', 'HDL-cholesterol', 'mmol/L', 1],
  ['tg', 'Triglyceriden', 'mmol/L', 1],
  ['alat', 'ALAT', 'U/L', 0],
]

export function veranderingen(
  reeks: readonly Trendpunt[], metingen: readonly Meting[], labs: readonly Lab[],
): Verandering[] {
  const uit: Array<Verandering | null> = []

  /* Het gewicht uit de gladde lijn, want twee losse wegingen verschillen ook
     zonder dat er iets veranderd is. */
  uit.push(regel('Gewicht (trend)', 'kg', 1,
    reeks.filter((p) => p.ema != null).map((p) => ({ datum: p.d, waarde: p.ema! }))))

  const soort = (s: string) => metingen
    .filter((m) => m.soort === s && Number.isFinite(Number(m.waarde)))
    .map((m) => ({ datum: m.datum as string, waarde: Number(m.waarde) }))

  uit.push(regel('Middelomtrek', 'cm', 0, soort('middelomtrek')))
  /* De enige twee maten met een venster. Zie de kop: één bloeddrukmeting is
     geen bloeddruk, en dat is precies wat de kaart eronder uitlegt. */
  uit.push(regel('Bovendruk', 'mmHg', 0, soort('bloeddruk_sys'), VENSTER_DAGEN))
  uit.push(regel('Onderdruk', 'mmHg', 0, soort('bloeddruk_dia'), VENSTER_DAGEN))

  for (const [code, naam, eenheid, dec] of LABS) {
    uit.push(regel(naam, eenheid, dec, labs
      .filter((l) => l.code === code && l.waarde != null)
      .map((l) => ({ datum: l.datum as string, waarde: Number(l.waarde) }))))
  }

  return uit.filter((r): r is Verandering => r != null)
}
