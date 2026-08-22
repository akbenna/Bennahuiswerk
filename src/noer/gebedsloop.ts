/**
 * HET GEBED IN STAPPEN — de rij die "bid mee" aflopen moet
 *
 * Zuiver: er komt een aantal rak'a en een gebed-id in, en er komt een rij
 * stappen uit. De qunut hoort in deze school alleen bij de Fajr, in de tweede
 * rak'a, ná het lezen en vóór de buiging; de iqama alleen bij de vijf
 * verplichte gebeden en niet bij een vrijwillig gebed of de witr.
 *
 * De soera na al-Fatiha is een eigen stap en niet een zinnetje eronder. Je
 * leest hem helemaal, en dat duurt langer dan de Fatiha zelf — wie hem alleen
 * als voetnoot ziet, slaat hem in het echt ook over.
 */
import { HIFZ } from './gegevens/hifz'
import type { Hifz } from './gegevens/soorten'

export interface Gebedstap {
  k: string
  /** In welke rak'a deze stap valt. */
  r: number
  /** Bij een soera-stap: welke soera. */
  soera?: Hifz | undefined
  /** De eerste zitting bij een gebed van meer dan twee rak'a. */
  midden?: boolean | undefined
}

/** Hoelang elke stap ongeveer duurt, in seconden. Een schatting om op mee te lopen. */
export const DUUR: Record<string, number> = {
  iqama: 22, niyyah: 5, takbir: 3, fatiha: 24, soera: 8, qunut: 20, ruku: 7,
  itidal: 5, sujud1: 7, jalsa: 5, sujud2: 7, opstaan: 4, tashahhud: 15,
  salawat: 13, dua: 12, salam: 4, nagebed: 25,
}

/** De korte soera's waar de eerste twee rak'a uit gekozen worden. */
export const KORTE = HIFZ.filter((h) => h.nr !== undefined && h.nr !== 1)

/** Twee verschillende korte soera's: dat is hoe het in het echt gaat, en het
 *  oefent er meteen twee in plaats van één. */
export function kiesSoeras(zaad: number): [Hifz, Hifz] {
  const a = KORTE[Math.abs(zaad) % KORTE.length] as Hifz
  const rest = KORTE.filter((h) => h.id !== a.id)
  const b = (rest[Math.abs(zaad * 7 + 3) % rest.length] ?? a) as Hifz
  return [a, b]
}

export function bouwGebed(rak: number, id: string, soeras: [Hifz, Hifz]): Gebedstap[] {
  const seq: Gebedstap[] = []
  if (id) seq.push({ k: 'iqama', r: 1 })
  for (let r = 1; r <= rak; r++) {
    if (r === 1) { seq.push({ k: 'niyyah', r }); seq.push({ k: 'takbir', r }) } else seq.push({ k: 'opstaan', r })
    seq.push({ k: 'fatiha', r })
    if (r <= 2) seq.push({ k: 'soera', r, soera: soeras[r - 1] as Hifz })
    if (id === 'fajr' && r === 2) seq.push({ k: 'qunut', r })
    seq.push({ k: 'ruku', r })
    seq.push({ k: 'itidal', r })
    seq.push({ k: 'sujud1', r })
    seq.push({ k: 'jalsa', r })
    seq.push({ k: 'sujud2', r })
    if (rak > 2 && r === 2) seq.push({ k: 'tashahhud', r, midden: true })
    if (r === rak) {
      seq.push({ k: 'tashahhud', r })
      seq.push({ k: 'salawat', r })
      seq.push({ k: 'dua', r })
      seq.push({ k: 'salam', r })
      seq.push({ k: 'nagebed', r })
    }
  }
  return seq
}
