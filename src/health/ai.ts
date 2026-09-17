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

export interface ImportUitslag {
  dagen: ImportDag[]
  opmerking: string
  model: string
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
