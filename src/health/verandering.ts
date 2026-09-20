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
 * **Er staat een verschil, geen oordeel.** Geen kleur, geen pijl omhoog die
 * "goed" betekent. Of een daling van 0,3 in je HbA1c iets betekent hangt af van
 * dingen die deze app niet weet, en de grens tussen informeren en beoordelen
 * ligt in deze app overal op dezelfde plek.
 */
import type { Lab, Meting } from '@/gedeeld/db/tabellen'
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
}

/** Twee metingen op verschillende dagen, of niets. */
function beloop(
  punten: Array<{ datum: string; waarde: number }>,
): { van: { datum: string; waarde: number }; tot: { datum: string; waarde: number } } | null {
  const op = [...punten].sort((a, b) => a.datum.localeCompare(b.datum))
  const van = op[0]
  const tot = op[op.length - 1]
  if (!van || !tot || van.datum === tot.datum) return null
  return { van, tot }
}

const rond = (x: number, n: number): number => Math.round(x * 10 ** n) / 10 ** n

function regel(
  naam: string, eenheid: string, decimalen: number,
  punten: Array<{ datum: string; waarde: number }>,
): Verandering | null {
  const b = beloop(punten)
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
  uit.push(regel('Bovendruk', 'mmHg', 0, soort('bloeddruk_sys')))
  uit.push(regel('Onderdruk', 'mmHg', 0, soort('bloeddruk_dia')))

  for (const [code, naam, eenheid, dec] of LABS) {
    uit.push(regel(naam, eenheid, dec, labs
      .filter((l) => l.code === code && l.waarde != null)
      .map((l) => ({ datum: l.datum as string, waarde: Number(l.waarde) }))))
  }

  return uit.filter((r): r is Verandering => r != null)
}
