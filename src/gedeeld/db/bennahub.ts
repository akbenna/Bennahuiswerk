/**
 * DE HUB-FUNCTIES
 *
 * Deze zestien functies horen bij de startpagina en de acht kinder-apps, en ze
 * doen één ding anders dan de kal_-functies: **ze melden een fout in het
 * antwoord en niet in de statuscode.** Een verkeerd wachtwoord levert
 * HTTP 200 op met `{"error":"Dat wachtwoord klopt niet."}` erin.
 *
 * Dat is geen slordigheid maar een keuze in de database — een foutmelding voor
 * een kind hoort een zin te zijn, niet een 401. Maar het betekent wel dat de
 * gewone `roep()` zo'n antwoord voor geslaagd aanziet en een leeg object
 * doorgeeft. Vandaar deze laag: hij pakt het antwoord uit en gooit alsnog.
 *
 * Wie hier langs gaat kan dat niet vergeten, want de typen hieronder bevatten
 * het foutveld niet.
 */
import { DatabaseFout } from './verbinding'
import { roep } from './rpc'
import type { RpcKaart } from './rpc'

/** Het gezin waar deze installatie voor is. Eén waarde, één plek. */
export const GEZIN = 'benna'

export type Rol = 'kind' | 'ouder'

export interface Lid {
  naam: string
  rol: Rol
  emoji: string
  kleur: string
  apps: string[] | null
  actief: boolean
  geboren: number | null
  heeftCode: boolean
  heeftFoto: boolean
  laatstActief: string | null
}

/** Wat er terugkomt als een lid zich aanmeldt: minder velden dan de lijst. */
export interface Aanmelding {
  naam: string
  rol: Rol
  emoji: string
  kleur: string
  apps: string[] | null
  geboren: number | null
  /** true wanneer het wachtwoord bij deze aanmelding is aangemaakt. */
  gekozen?: boolean
}

export interface AppStand {
  app: string
  account: string
  /** De opslag van die app, in het formaat dat die app zelf kiest. */
  data: unknown
  updatedAt: string
}

export interface Overzicht {
  leden: Lid[]
  apps: AppStand[]
}

/** Wat de database terugstuurt: of een fout, of het antwoord. */
type MetFout = { error?: unknown } | null | undefined

/**
 * Roept een hub-functie aan en maakt van een `error`-veld een echte fout.
 * Alles wat met de hub praat loopt hierlangs; niets eromheen. Ook `wolk.ts`
 * gebruikt hem, want die vier functies melden fouten op dezelfde manier.
 */
export async function hub<K extends keyof RpcKaart>(
  functie: K, argumenten: RpcKaart[K]['in'],
): Promise<unknown> {
  const uit = (await roep(functie, argumenten)) as MetFout
  if (uit && typeof uit === 'object' && 'error' in uit && uit.error) {
    throw new DatabaseFout(String(uit.error), 200, functie)
  }
  return uit
}

export const ledenLijst = async (): Promise<Lid[]> =>
  ((await hub('bennahub_leden_lijst', { p_gezin: GEZIN })) as Lid[] | null) ?? []

export const lidAanmelden = async (naam: string, code: string): Promise<Aanmelding> =>
  (await hub('bennahub_lid_aanmelden', {
    p_gezin: GEZIN, p_naam: naam, p_code: code,
  })) as Aanmelding

export const gezinStart = async (wachtwoord: string, leden: unknown): Promise<void> => {
  await hub('bennahub_gezin_start', {
    p_gezin: GEZIN, p_wachtwoord: wachtwoord, p_leden: leden,
  })
}

export const lidCode = async (naam: string, oud: string, nieuw: string): Promise<void> => {
  await hub('bennahub_lid_code', { p_gezin: GEZIN, p_naam: naam, p_oud: oud, p_nieuw: nieuw })
}

export const lidReset = async (ouderWw: string, naam: string): Promise<void> => {
  await hub('bennahub_lid_reset', { p_gezin: GEZIN, p_ouder_ww: ouderWw, p_naam: naam })
}

export const gezinWachtwoord = async (oud: string, nieuw: string): Promise<void> => {
  await hub('bennahub_gezin_wachtwoord', { p_gezin: GEZIN, p_oud: oud, p_nieuw: nieuw })
}

export const overzicht = async (ouderWw: string): Promise<Overzicht> => {
  const uit = (await hub('bennahub_overzicht', {
    p_gezin: GEZIN, p_ouder_ww: ouderWw,
  })) as Partial<Overzicht> | null
  return { leden: uit?.leden ?? [], apps: uit?.apps ?? [] }
}
