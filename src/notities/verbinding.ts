/**
 * DE VERBINDING VAN NOTITIES
 *
 * Notities praat met een eigen Supabase-project en niet met de database van
 * BennaHub. Dat is geen toeval: hier staan opnames van vergaderingen, met
 * namen, bedragen en afspraken erin, en die horen niet in dezelfde back-up en
 * hetzelfde blusgebied als de gezinsapps. Zie `notities/README.md`.
 *
 * De sleutel hieronder is de publieke sleutel van dat project, om dezelfde
 * reden als in `gedeeld/db/verbinding.ts` gewoon in de repo: hij hoort in de
 * browser te staan en geeft uit zichzelf niets prijs. Elke tabel staat achter
 * RLS met de eigenaar als enige die erbij mag (`notities/database/01-schema.sql`).
 *
 * Zolang de twee waarden leeg zijn, toont de app dat hij nog niet gekoppeld is
 * in plaats van een inlogscherm dat nergens heen gaat.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const DATABASE_URL: string = ''
export const ANON_SLEUTEL: string = ''

/** Het adres van de worker, voor zoeken op betekenis en de statusregel. Leeg mag. */
export const WORKER_URL: string = ''

export const gekoppeld = (): boolean => DATABASE_URL !== '' && ANON_SLEUTEL !== ''

let klant: SupabaseClient | null = null

/** Pas bij het eerste gebruik aangemaakt: zonder adres zou createClient gooien. */
export function db(): SupabaseClient {
  if (!klant) {
    klant = createClient(DATABASE_URL, ANON_SLEUTEL, {
      /* Een eigen opslagsleutel: op hetzelfde adres staan de andere apps van
         de hub, en hun sessie is een andere dan deze. */
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'notities-sessie' },
    })
  }
  return klant
}

export const workerUrl = (): string => WORKER_URL.replace(/\/$/, '')
