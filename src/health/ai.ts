/**
 * DE HERKENNING
 *
 * Praat met de edge function kal-ai. Wat daar gebeurt staat in hoofdstuk 11 van
 * VERANTWOORDING.md: het model benoemt de onderdelen en schat een portiebereik,
 * de server zoekt ze op in NEVO, het model kiest de tabelregel, en de server
 * rékent met de tabelwaarde. Het model rekent niet zelf.
 *
 * Hier staat alleen de grens: wat erin gaat en wat eruit komt, getypt.
 */
import { DATABASE_URL, DatabaseFout } from '@/gedeeld/db/verbinding'
import type { Graad, IsoDatum, Moment } from '@/gedeeld/db/tabellen'
import type { Dagtraining } from './dagverslag'

export interface Foto {
  naam: string
  type: string
  /** base64, zonder de data:-kop */
  data: string
}

export interface HerkendeRegel {
  naam: string
  moment: Moment | 'onbekend'
  hoeveelheid: number
  eenheid: string
  gram_equivalent: number
  kcal_punt: number
  kcal_laag: number
  kcal_hoog: number
  eiwit_g: number
  vet_g: number
  koolhydraat_g: number
  vezel_g: number
  conf: Graad
  onzekerheidsbronnen: string[]
  bron: 'tekst-ai' | 'foto-ai'
  nevo_code: string | null
  nevo_naam: string | null
  gram_laag: number
  gram_hoog: number
  ai_model: string
}

export interface Herkenning {
  regels: HerkendeRegel[]
  opmerking: string
  referentieobject: string | null
  model: string
  ms: number
}

/**
 * Wat een dagverslag oplevert: dezelfde regels als bij een losse beschrijving,
 * plus de krachttraining die erin genoemd werd.
 *
 * `trainingen` is optioneel in het type en nooit optioneel na `verslag()`. Dat
 * verschil is er omdat de nu draaiende edge function het veld niet stuurt — zie
 * daar.
 */
export interface Dagherkenning extends Herkenning {
  trainingen?: Dagtraining[]
}

export interface ImportDag {
  datum: IsoDatum
  kcal: number | null
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  gewicht_kg: number | null
  stappen: number | null
  actieve_energie_kcal: number | null
}

/**
 * WAAROP DE HERKENNING ZICH BASEERDE
 *
 * Het scherm "Alle gegevens" van Apple Gezondheid is een kale lijst: per rij één
 * getal en een datum, zonder eenheid. Welke grootheid het is staat alleen in de
 * kop bovenaan, en wie doorscrolt en dan een afdruk maakt heeft die kop niet in
 * beeld. Dan moet de herkenning kiezen tussen stappen en kilocalorieën op niets
 * anders dan de grootte van de getallen.
 *
 * Dat mag, maar niet stil. `hoe` zegt waar de grootheid vandaan komt, en het
 * scherm toont dat vóór er iets wordt overgenomen — een misgok is anders niet
 * terug te vinden: hij ziet eruit als een gewone rij in de database.
 */
export interface Importbron {
  wat: 'stappen' | 'actieve_energie_kcal' | 'kcal' | 'gewicht_kg' | 'onbekend'
  /** `kop` = op de afdruk gelezen · `reeks` = van een andere afdruk van dezelfde
   *  lijst · `grootte` = afgeleid uit hoe groot de getallen zijn, dus een gok. */
  hoe: 'kop' | 'reeks' | 'grootte'
  kop?: string | null
  dagen?: number | null
}

/**
 * EEN WORK-OUT UIT DE LIJST VAN APPLE GEZONDHEID
 *
 * Duur en datum, en verder niets — de lijst toont geen soort. Dat is precies
 * waarom deze rijen niet vanzelf in een dag belanden: er is geen veld waar een
 * duur zonder soort in past zonder een bewering te doen die er niet staat.
 */
export interface Importactiviteit {
  datum: IsoDatum
  minuten: number
  bron?: string | null
  tijd?: string | null
}

/**
 * De bovengrens waarboven een "work-out" er geen is.
 *
 * Vier uur. Een lange rit of een bergwandeling haalt dat, en die horen mee te
 * tellen. Wat er níet doorheen komt is wat een horloge doet als het een hele dag
 * als één activiteit wegschrijft — in de lijst die dit oproep stond een post van
 * 9 uur 7 en een van 14 uur 22, en dat zijn geen trainingen maar een vergeten
 * stopknop.
 *
 * Zou zo'n post als beweegminuten binnenkomen, dan haalt het weekdoel van 150
 * minuten zich in één klap vijf keer op een dag waarop er misschien niets
 * gebeurde. Dat is erger dan hem missen: een doel dat vanzelf afgaat meet niets.
 *
 * De grens haalt niets wég — ze zet het vinkje uit. Wie het beter weet zet hem
 * aan, en dat is het verschil tussen een filter en een oordeel.
 */
export const ACTIVITEIT_MAX_MIN = 240

/** Of deze duur er een van een mens is en niet van een vergeten stopknop. */
export function aannemelijk(minuten: number): boolean {
  return minuten > 0 && minuten <= ACTIVITEIT_MAX_MIN
}

/** De minuten per dag opgeteld: twee ritten op één dag zijn samen één getal. */
export function minutenPerDag(
  activiteiten: Importactiviteit[],
): Array<{ datum: IsoDatum; minuten: number }> {
  const per = new Map<IsoDatum, number>()
  for (const a of activiteiten) {
    per.set(a.datum, (per.get(a.datum) ?? 0) + Math.round(a.minuten))
  }
  return [...per.entries()]
    .map(([datum, minuten]) => ({ datum, minuten }))
    .sort((a, b) => a.datum.localeCompare(b.datum))
}

export interface ImportUitslag {
  dagen: ImportDag[]
  /** Leeg bij de versie van de edge function die deze velden nog niet kent. */
  bronnen?: Importbron[]
  activiteiten?: Importactiviteit[]
  opmerking: string
  model: string
}

/**
 * Welke reeksen op niets anders dan de grootte van de getallen berusten.
 *
 * Dit is de enige vorm van onzekerheid die het scherm kan tonen zonder dat
 * iemand de afdruk erbij pakt, en daarom staat hij hier los: zo kan een proef
 * hem toetsen zonder browser en zonder verbinding.
 *
 * Een lege of ontbrekende lijst geeft niets terug. Dat is met opzet geen fout:
 * de edge function die nu draait kent `bronnen` nog niet, en dan hoort het
 * scherm te werken zoals het altijd werkte in plaats van een waarschuwing te
 * tonen die nergens op slaat.
 */
export function geraden(bronnen: Importbron[] | undefined): Importbron[] {
  return (bronnen ?? []).filter((b) => b.hoe === 'grootte' || b.wat === 'onbekend')
}

/** Hoe een grootheid heet op het scherm. */
export const BRONNAAM: Record<Importbron['wat'], string> = {
  stappen: 'stappen',
  actieve_energie_kcal: 'actieve energie',
  kcal: 'gegeten kilocalorieën',
  gewicht_kg: 'gewicht',
  onbekend: 'onbekend',
}

async function vraag(lichaam: Record<string, unknown>): Promise<unknown> {
  let antwoord: Response
  try {
    antwoord = await fetch(DATABASE_URL + '/functions/v1/kal-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lichaam),
    })
  } catch {
    throw new DatabaseFout('Geen verbinding met de herkenning.', 0, 'kal-ai')
  }
  const uit = (await antwoord.json()) as { error?: string }
  if (uit.error) throw new DatabaseFout(uit.error, antwoord.status, 'kal-ai')
  return uit
}

export async function herken(
  token: string, soort: 'tekst' | 'foto', tekst: string, fotos: Foto[] = [],
): Promise<Herkenning> {
  return (await vraag({ token, soort, tekst, fotos })) as Herkenning
}

export async function importeer(
  token: string, tekst: string, fotos: Foto[] = [],
): Promise<ImportUitslag> {
  return (await vraag({ token, soort: 'import', tekst, fotos })) as ImportUitslag
}

/**
 * Een heel dagverslag in één keer. Zie `dagverslag.ts` voor wat ermee gebeurt.
 *
 * WAT ER GEBEURT ALS DE FUNCTIE NOG NIET UITGEROLD IS
 *
 * `soort: 'dag'` is nieuw in `health/edge/kal-ai.ts`. De versie die er nu
 * draait kent hem niet, en valt voor alles wat geen 'foto' of 'import' is terug
 * op de tekstprompt. Dat is precies het gedrag dat je wilt: het eten wordt
 * herkend en het moment komt mee zover het model het uit de woorden kan halen —
 * het veld staat al in het oude schema. Wat ontbreekt is `trainingen`, en die
 * komt hier als lege lijst terug.
 *
 * Er gaat dus niets stuk vóór de uitrol; er komt iets bij ná de uitrol. Dat is
 * bewust zo gebouwd, want de uitrol is handwerk en het eten is waar het om gaat.
 */
export async function verslag(token: string, tekst: string): Promise<Dagherkenning> {
  const uit = (await vraag({ token, soort: 'dag', tekst })) as Dagherkenning
  return { ...uit, trainingen: uit.trainingen ?? [] }
}

/** Een bestand omzetten naar wat de functie verwacht. */
export function leesFoto(bestand: File): Promise<Foto> {
  return new Promise((klaar, mis) => {
    const lezer = new FileReader()
    lezer.onerror = () => mis(new Error('Kon de foto niet lezen.'))
    lezer.onload = () => {
      const uit = String(lezer.result)
      klaar({ naam: bestand.name, type: bestand.type, data: uit.slice(uit.indexOf(',') + 1) })
    }
    lezer.readAsDataURL(bestand)
  })
}
