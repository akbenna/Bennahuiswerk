/**
 * WOORDEN — de bron in stukjes
 *
 * Inspringen wordt hier al tot INSPRING- en UIT-tekens gemaakt, want dat is wat
 * Python van andere talen onderscheidt: het blok zit in de witruimte. Binnen
 * haakjes telt inspringen niet, zodat een lange lijst over meer regels mag.
 */
import { fout } from './fout'

export type Soort =
  | 'INSPRING' | 'UIT' | 'EINDE' | 'KLAAR'
  | 'TEKST' | 'FTEKST' | 'GETAL' | 'NAAM' | 'SLEUTEL' | 'OP'

export interface Woord {
  s: Soort
  /** De inhoud: een getal bij GETAL, verder tekst. Leeg bij de blokwoorden. */
  w?: string | number
  regel: number
}

export const SLEUTELS = [
  'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue',
  'and', 'or', 'not', 'True', 'False', 'None', 'pass', 'import', 'from', 'as',
]

export function lees(bron: string): Woord[] {
  const rijen = bron.replace(/\r\n?/g, '\n').split('\n')
  const uit: Woord[] = []
  const stapel = [0]
  let haakjes = 0

  for (let r = 0; r < rijen.length; r++) {
    const rij = rijen[r] ?? ''
    const regel = r + 1

    /* Binnen haakjes telt inspringen niet: dan loopt een regel gewoon door. */
    if (haakjes === 0) {
      const kaal = rij.replace(/#.*$/, '').trim()
      if (kaal === '') continue
      const inspring = (rij.match(/^[ \t]*/)?.[0] ?? '').replace(/\t/g, '    ').length
      const top = (): number => stapel[stapel.length - 1] ?? 0
      if (inspring > top()) {
        stapel.push(inspring)
        uit.push({ s: 'INSPRING', regel })
      } else {
        while (inspring < top()) {
          stapel.pop()
          uit.push({ s: 'UIT', regel })
          if (inspring > top()) {
            throw fout(regel, 'deze regel springt in tot een plek die niet klopt',
              'Elke regel binnen een blok moet even ver inspringen als de rest van dat blok.')
          }
        }
      }
    }

    let i = haakjes > 0 ? 0 : rij.length - rij.replace(/^[ \t]*/, '').length

    while (i < rij.length) {
      const c = rij[i] as string
      if (c === ' ' || c === '\t') { i++; continue }
      if (c === '#') break

      /* tekst tussen aanhalingstekens, met of zonder f ervoor */
      if (c === '"' || c === "'"
        || ((c === 'f' || c === 'F') && (rij[i + 1] === '"' || rij[i + 1] === "'"))) {
        const f = c === 'f' || c === 'F'
        if (f) i++
        const q = rij[i] as string
        i++
        let s = ''
        while (i < rij.length && rij[i] !== q) {
          if (rij[i] === '\\') {
            const n = rij[i + 1]
            s += n === 'n' ? '\n' : n === 't' ? '\t' : n === '\\' ? '\\' : n === q ? q : '\\' + (n ?? '')
            i += 2
          } else {
            s += rij[i]
            i++
          }
        }
        if (i >= rij.length) {
          throw fout(regel, 'er ontbreekt een ' + q + ' aan het eind van de tekst',
            'Tekst begint en eindigt altijd met hetzelfde teken: ' + q + 'zo' + q)
        }
        i++
        uit.push({ s: f ? 'FTEKST' : 'TEKST', w: s, regel })
        continue
      }

      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(rij[i + 1] ?? ''))) {
        let j = i
        while (j < rij.length && /[0-9._]/.test(rij[j] as string)) j++
        uit.push({ s: 'GETAL', w: parseFloat(rij.slice(i, j).replace(/_/g, '')), regel })
        i = j
        continue
      }

      if (/[A-Za-z_À-ɏ]/.test(c)) {
        let j = i
        while (j < rij.length && /[A-Za-z0-9_À-ɏ]/.test(rij[j] as string)) j++
        const w = rij.slice(i, j)
        uit.push({ s: SLEUTELS.includes(w) ? 'SLEUTEL' : 'NAAM', w, regel })
        i = j
        continue
      }

      const drie = rij.slice(i, i + 3)
      const twee = rij.slice(i, i + 2)
      if (['//=', '**='].includes(drie)) { uit.push({ s: 'OP', w: drie, regel }); i += 3; continue }
      if (['==', '!=', '<=', '>=', '//', '**', '+=', '-=', '*=', '/='].includes(twee)) {
        uit.push({ s: 'OP', w: twee, regel })
        i += 2
        continue
      }
      if ('+-*/%<>=(),:[]{}.'.includes(c)) {
        if ('([{'.includes(c)) haakjes++
        if (')]}'.includes(c)) haakjes = Math.max(0, haakjes - 1)
        uit.push({ s: 'OP', w: c, regel })
        i++
        continue
      }
      throw fout(regel, 'dit teken begrijp ik niet: ' + c,
        'Python kent dit teken niet. Kijk of er een letter of teken te veel staat.')
    }
    if (haakjes === 0) uit.push({ s: 'EINDE', regel })
  }
  while (stapel.length > 1) {
    stapel.pop()
    uit.push({ s: 'UIT', regel: rijen.length })
  }
  uit.push({ s: 'KLAAR', regel: rijen.length })
  return uit
}
