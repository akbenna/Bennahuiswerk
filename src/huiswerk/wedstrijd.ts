/**
 * DE WEDSTRIJD — één vriend uitdagen via een link
 *
 * Tien vragen uit het eigen niveau van het kind, met de getallen al ingevuld:
 * de vriend moet exact dezelfde sommen krijgen, dus een sjabloon mag daar niet
 * opnieuw loten. De uitslag gaat op aantal goed, en bij gelijk spel op tijd.
 */
import { hub } from '@/gedeeld/db/bennahub'
import type { Kaart, Toeval } from './gegevens/soorten'
import { beurtVan } from './leitner'

export interface Wedstrijdvraag {
  q: string
  a: string
  alt: string[] | null
  opties: string[] | null
  u: string
  t: string
}

export interface Uitslag { correct: number; secs: number; naam?: string }

/** Een code die kort genoeg is om over te typen en lang genoeg om niet te
 *  raden. */
export const wedstrijdCode = (t: Toeval): string => {
  const tekens = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 10 }, () => t.pick(tekens.split(''))).join('')
}

export function wedstrijdLink(code: string): string {
  try {
    return location.href.split('#')[0] + '#w=' + code
  } catch {
    return '#w=' + code
  }
}

/** Tien vragen uit de stof van dit jaar. Sjablonen krijgen hier hun getallen,
 *  zodat beide spelers dezelfde som zien. */
export function bouwWedstrijd(pid: string, alle: readonly Kaart[], t: Toeval): Wedstrijdvraag[] {
  const pool = t.shuffle(alle.filter((e) => e.p === pid && (e.jaar ?? 'nu') === 'nu')).slice(0, 10)
  return pool.map((kaart) => {
    const inst = beurtVan(kaart)
    return {
      q: inst.q, a: inst.a, alt: inst.alt ?? null, opties: inst.opties ?? null,
      u: inst.u ?? '', t: kaart.t,
    }
  })
}

export function winnaar(maker: Uitslag, vriend: Uitslag | null): 'maker' | 'vriend' | 'gelijk' | null {
  if (!vriend) return null
  if ((vriend.correct || 0) > (maker.correct || 0)) return 'vriend'
  if ((vriend.correct || 0) < (maker.correct || 0)) return 'maker'
  /* Gelijk aantal goed → de snelste wint. */
  if ((vriend.secs || 0) < (maker.secs || 0)) return 'vriend'
  if ((vriend.secs || 0) > (maker.secs || 0)) return 'maker'
  return 'gelijk'
}

export interface Wedstrijd {
  naam: string
  vragen: Wedstrijdvraag[]
  maker: Uitslag
  vriend?: Uitslag | null
}

export const wedstrijdMaken = async (code: string, data: Wedstrijd): Promise<void> => {
  await hub('oefenapp_ch_create', { p_code: code, p_data: data })
}

export const wedstrijdHalen = async (code: string): Promise<Wedstrijd | null> => {
  const r = (await hub('oefenapp_ch_get', { p_code: code })) as { data?: Wedstrijd } | null
  return r?.data ?? null
}

export const wedstrijdInsturen = async (code: string, vriend: Uitslag): Promise<void> => {
  await hub('oefenapp_ch_submit', { p_code: code, p_friend: vriend })
}
