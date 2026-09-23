/**
 * JE WEGINGEN NALOPEN
 *
 * Deze app gooit geen metingen weg. Dat staat in hoofdstuk 1 en het is de reden
 * dat een uitbijter wel wordt aangemerkt en niet verwijderd: de app weet niet of
 * er een tweede persoon op de weegschaal stond of dat er een toets misging, en
 * wie er wél op stond weet dat meestal meteen.
 *
 * Maar daar hoorde een tweede helft bij die er niet was. De app zei "klopt het
 * niet, zet hem dan recht op de dag zelf", en dat betekende: zoek zelf uit welke
 * dag het was, blader daarheen, en typ het over. Voor één weging gaat dat. Voor
 * iemand die een maand met de app heeft zitten spelen voordat hij hem echt ging
 * gebruiken, is het genoeg werk om het niet te doen. En dan blijft er een reeks
 * staan waar een 190 in zit.
 *
 * Dit bestand zet de wegingen op een rij zodat ze na te lopen zijn. Het rekent
 * niets nieuws uit: de afwijking en de markering komen rechtstreeks uit
 * `trendReeks`, en wat daar de uitbijterregel is staat in `rekenkern.ts`.
 *
 * WAT HIER MET OPZET NIET STAAT
 *
 * Geen grens waarbuiten een weging vanzelf weggaat. De verleiding is groot: wie
 * weet dat hij rond de 119 weegt kan zeggen "alles buiten 117 tot 121 is fout",
 * en voor de reeks van vandaag klopt dat ook. Maar dit is een app om af te
 * vallen. Wie tien kilo kwijtraakt, weegt straks 109, en dan zou die grens
 * precies het resultaat weggooien dat de app moet meten. Een vaste band is
 * hetzelfde als het model vertellen wat eruit moet komen.
 *
 * Wat er wel staat is de lijst, met bij elke weging hoeveel hij afwijkt van zijn
 * buren, en de keuze bij degene die op de weegschaal stond.
 */
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import type { Trendpunt } from './rekenkern'

export interface Weging {
  datum: IsoDatum
  kg: number
  /** Hoeveel deze weging afweek van wat de dagen eromheen zeggen. */
  afwijkingKg: number | null
  /** Aangemerkt door de uitbijterregel in `rekenkern.ts`. */
  uitbijter: boolean
}

/** Elke dag waarop gewogen is, nieuwste eerst. */
export function wegingen(reeks: readonly Trendpunt[]): Weging[] {
  return reeks
    .filter((p): p is Trendpunt & { w: number } => p.w != null)
    .map((p) => ({
      datum: p.d, kg: p.w, afwijkingKg: p.afwijkingKg, uitbijter: p.uitbijter,
    }))
    .sort((a, b) => b.datum.localeCompare(a.datum))
}

/**
 * Wat er van de reeks overblijft als deze dagen eruit gaan.
 *
 * Dit is geen voorspelling maar een som die de gebruiker anders zelf moet maken:
 * hoeveel wegingen blijven er over, en tussen welke twee waarden liggen die dan.
 * Zonder dat getal is wegstrepen een sprong in het duister.
 */
export function zonder(
  lijst: readonly Weging[], weg: ReadonlySet<string>,
): { over: number; laagste: number | null; hoogste: number | null } {
  const blijft = lijst.filter((w) => !weg.has(w.datum)).map((w) => w.kg)
  return {
    over: blijft.length,
    laagste: blijft.length ? Math.min(...blijft) : null,
    hoogste: blijft.length ? Math.max(...blijft) : null,
  }
}
