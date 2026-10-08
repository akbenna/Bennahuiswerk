/**
 * Kleine, zuivere hulp voor de schermen: geen database, geen DOM. Daarom staat
 * het apart, en daarom is het te toetsen (`notities.proef.ts`).
 */
import type { Status } from './typen'

export const STATUS: Record<Status, string> = {
  opname: 'Wordt opgenomen',
  klaar_voor_verwerking: 'In de wachtrij',
  transcriberen: 'Wordt uitgeschreven',
  samenvatten: 'Wordt samengevat',
  gereed: 'Klaar om na te lezen',
  goedgekeurd: 'Nagelezen',
  opnieuw: 'Wordt opnieuw samengevat',
  fout: 'Mislukt',
}

/** Wat nog in de molen zit: zolang dat zo is, kijkt het scherm periodiek opnieuw. */
export const BEZIG: ReadonlySet<Status> = new Set<Status>(
  ['opname', 'klaar_voor_verwerking', 'transcriberen', 'samenvatten', 'opnieuw'],
)

const twee = (n: number): string => String(n).padStart(2, '0')

/** Seconden als 4:05 of 1:02:09. */
export function duur(s: number | null | undefined): string {
  if (s == null || !Number.isFinite(s)) return ''
  const t = Math.max(0, Math.round(s))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  return h ? `${h}:${twee(m)}:${twee(sec)}` : `${m}:${twee(sec)}`
}

export const datum = (iso: string): string => new Date(iso).toLocaleString('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
})

/** Een datum JJJJ-MM-DD als "12 okt"; op het middaguur, zodat geen tijdzone hem verschuift. */
export const dag = (d: string): string =>
  new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export const docUrl = (id: string): string => `https://docs.google.com/document/d/${encodeURIComponent(id)}/edit`

export type Route =
  | { scherm: 'opnemen' }
  | { scherm: 'notities' }
  | { scherm: 'notitie'; id: string }
  | { scherm: 'acties' }
  | { scherm: 'instellingen' }

/** Het adres na de # naar een scherm. Wat niet herkend wordt is het opnamescherm. */
export function leesRoute(hash: string): Route {
  const pad = hash.replace(/^#/, '') || '/'
  const id = /^\/notitie\/([0-9a-f-]{36})$/i.exec(pad)?.[1]
  if (id) return { scherm: 'notitie', id }
  if (pad.startsWith('/notities')) return { scherm: 'notities' }
  if (pad.startsWith('/acties')) return { scherm: 'acties' }
  if (pad.startsWith('/instellingen')) return { scherm: 'instellingen' }
  return { scherm: 'opnemen' }
}

/**
 * Zoektekst die veilig in een PostgREST-filter `or=(...)` past. Komma's en
 * haakjes zijn daar syntaxis, en % en _ zijn jokers in ilike: wie op "50%"
 * zoekt, bedoelt niet "50 en dan wat dan ook".
 */
export const veiligZoeken = (term: string): string => term.replace(/[%_,()\\*"]/g, ' ').trim()

/** De extensie van een bestandsnaam, klein; zonder herkenbare extensie .m4a. */
export const extensie = (naam: string): string =>
  (/\.[a-z0-9]{1,5}$/i.exec(naam)?.[0] ?? '.m4a').toLowerCase()

/** Grens van een upload in de app, gelijk aan die van Supabase Storage op het gratis plan. */
export const MAX_UPLOAD = 50 * 1024 * 1024
