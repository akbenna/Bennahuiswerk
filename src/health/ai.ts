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
