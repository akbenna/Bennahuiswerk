/**
 * DE MIDDELOMTREK ALS REEKS
 *
 * De app bewaarde elke middelomtrek met een datum en toonde er één: de
 * nieuwste. Daarmee is de vraag die ertoe doet niet te beantwoorden. Niet
 * "hoeveel is het", maar "gaat het de goede kant op, en gaat het mee met het
 * gewicht of niet".
 *
 * Dat laatste is het hele punt. Valt het gewicht terwijl de omtrek gelijk
 * blijft, dan gaat er iets anders weg dan buikvet. Valt de omtrek terwijl de
 * weegschaal stilstaat, dan gebeurt er juist wél iets. Die twee naast elkaar
 * zeggen samen meer dan allebei apart, en beide getallen stonden er al.
 *
 * DRIE DINGEN DIE DEZE FUNCTIE NIET DOET
 *
 * **Geen trendlijn.** Bij vier metingen over een half jaar is een helling met
 * standaardfout een schijnnauwkeurigheid. Er staat wat er staat: de punten, de
 * eerste, de laatste en het verschil.
 *
 * **Geen verschil kleiner dan de meetfout presenteren als verandering.** Die
 * fout loopt in de literatuur van 0,7 tot 15 cm; twee centimeter is hier de
 * ondergrens waaronder de app zegt dat er niets te zeggen valt. Dat is
 * dezelfde vloer die bij de meting zelf al genoemd wordt.
 *
 * **Geen gewicht van de weegschaal.** Het gewicht dat ernaast komt te staan is
 * de gladde lijn op of vóór die dag, en niet de weging van die ochtend. Anders
 * vergelijk je een omtrek met een vochtschommeling.
 */
import type { Meting } from '@/gedeeld/db/tabellen'
import type { Trendpunt } from './rekenkern'

/** Onder deze grens is het verschil meetfout en geen verandering. */
export const MEETRUIS_CM = 2

export interface Middelpunt {
  datum: string
  cm: number
}

export interface Middelbeloop {
  /** Op datum, oudste eerst. Eén punt per dag. */
  punten: Middelpunt[]
  eerste: Middelpunt
  laatste: Middelpunt
  /** Laatste min eerste. Negatief is eraf. */
  verschilCm: number
  /** Valt het verschil binnen de meetfout van het lint? */
  binnenRuis: boolean
  /** De gladde gewichtslijn op of vóór die dag, als die er is. */
  gewichtVan: number | null
  gewichtTot: number | null
}

/** Het voortschrijdend gemiddelde op of vóór deze dag. */
function emaOp(reeks: readonly Trendpunt[], datum: string): number | null {
  let uit: number | null = null
  for (const p of reeks) {
    if (p.d > datum) break
    if (p.ema != null) uit = p.ema
  }
  return uit
}

export function middelbeloop(
  metingen: readonly Meting[], reeks: readonly Trendpunt[],
): Middelbeloop | null {
  /* Meer metingen op één dag zijn één meetmoment, net als bij de bloeddruk.
     Zonder deze stap telt een dag waarop twee keer gemeten is dubbel mee in
     het beeld. */
  const perDag = new Map<string, number[]>()
  for (const m of metingen) {
    if (m.soort !== 'middelomtrek') continue
    const w = Number(m.waarde)
    if (!Number.isFinite(w) || w <= 0) continue
    const d = m.datum as string
    perDag.set(d, [...(perDag.get(d) ?? []), w])
  }

  const punten: Middelpunt[] = [...perDag.entries()]
    .map(([datum, ws]) => ({
      datum,
      cm: Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10,
    }))
    .sort((a, b) => a.datum.localeCompare(b.datum))

  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  /* Eén meetmoment is geen beloop. Zie de kop. */
  if (!eerste || !laatste || punten.length < 2) return null

  const verschilCm = Math.round((laatste.cm - eerste.cm) * 10) / 10
  return {
    punten,
    eerste,
    laatste,
    verschilCm,
    binnenRuis: Math.abs(verschilCm) < MEETRUIS_CM,
    gewichtVan: emaOp(reeks, eerste.datum),
    gewichtTot: emaOp(reeks, laatste.datum),
  }
}
