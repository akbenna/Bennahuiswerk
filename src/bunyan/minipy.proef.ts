/**
 * MINIPY, REGEL VOOR REGEL BEWEZEN
 *
 * Honderdtweeëndertig programma's door de nieuwe vertaler, en per programma
 * vergeleken met wat de óude eruit kreeg: de uitvoer regel voor regel, en bij
 * een fout het regelnummer, de melding en de tip woord voor woord.
 *
 * Die laatste zijn het punt. Een vertaler die werkt maar "regel 4" zegt waar
 * de oude "regel 3" zei, of die "de naam x kent Python nog niet" anders
 * formuleert, is stiller kapot dan een die niet start — het kind leest dan een
 * aanwijzing die naar de verkeerde regel wijst.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import { draai } from './minipy'
import { lees } from './minipy/lezen'
import { ontleed } from './minipy/ontleden'

interface GoudenProgramma {
  naam: string
  bron: string
  invoer: string[]
  uit: { ok: boolean; uit: string[]; regel: number | null; fout: string | null; tip: string | null }
}

const programmas = gouden.python as GoudenProgramma[]
const werkend = programmas.filter((p) => p.uit.ok)
const stuk = programmas.filter((p) => !p.uit.ok)

describe('MINIPY draait de programma\'s zoals vroeger', () => {
  it.each(werkend.map((p) => [p.naam, p] as const))('%s', (_naam, p) => {
    const r = draai(p.bron, { invoer: p.invoer.slice(), zaad: 12345 })
    expect(r.ok, r.ok ? '' : r.fout).toBe(true)
    expect(r.uit).toEqual(p.uit.uit)
  })
})

describe('MINIPY meldt de fouten zoals vroeger', () => {
  it.each(stuk.map((p) => [p.naam, p] as const))('%s', (_naam, p) => {
    const r = draai(p.bron, { invoer: p.invoer.slice(), zaad: 12345 })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect({ regel: r.regel, fout: r.fout, tip: r.tip })
      .toEqual({ regel: p.uit.regel, fout: p.uit.fout, tip: p.uit.tip })
    /* Wat er vóór de fout al geprint was, hoort er nog te staan: dat is voor
       een kind de helft van het zoeken. */
    expect(r.uit).toEqual(p.uit.uit)
  })
})

describe('het corpus dekt waar het voor bedoeld is', () => {
  it('bevat een programma per foutmelding', () => {
    /* Als deze telling zakt, is er een foutpad uit het corpus gevallen en wordt
       de bijbehorende melding nergens meer getoetst. */
    expect(stuk.filter((p) => p.naam.startsWith('FOUT')).length).toBeGreaterThanOrEqual(60)
    const meldingen = new Set(stuk.map((p) => p.uit.fout))
    expect(meldingen.size).toBeGreaterThanOrEqual(45)
  })

  it('draait ook de voorbeelden uit de lessen zelf', () => {
    expect(programmas.filter((p) => /^c\d/.test(p.naam)).length).toBeGreaterThan(30)
  })
})

describe('de vertaler zelf', () => {
  it('houdt de stappenteller aan', () => {
    const r = draai('n = 0\nwhile True:\n    n = n + 1\n', { maxStappen: 500 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fout).toBe('je programma blijft maar doorgaan')
    expect(r.stappen).toBeLessThan(600)
  })

  it('geeft dezelfde worp bij hetzelfde zaad, en een andere bij een ander', () => {
    const bron = 'import random\nprint(random.randint(1, 100))\n'
    expect(draai(bron, { zaad: 7 }).uit).toEqual(draai(bron, { zaad: 7 }).uit)
    expect(draai(bron, { zaad: 7 }).uit).not.toEqual(draai(bron, { zaad: 8 }).uit)
  })

  it('schrijft naar een eigen uitvoer als je die meegeeft', () => {
    const heen: string[] = []
    const r = draai('print("a")\nprint("b")\n', { schrijf: (s) => heen.push(s) })
    expect(heen).toEqual(['a', 'b'])
    expect(r.uit).toEqual([])
  })

  it('laat het inspringen tot blokwoorden worden', () => {
    const w = lees('if True:\n    print(1)\nprint(2)\n').map((x) => x.s)
    expect(w).toEqual([
      'SLEUTEL', 'SLEUTEL', 'OP', 'EINDE',
      'INSPRING', 'NAAM', 'OP', 'GETAL', 'OP', 'EINDE',
      'UIT', 'NAAM', 'OP', 'GETAL', 'OP', 'EINDE', 'KLAAR',
    ])
  })

  it('telt regels door binnen haakjes', () => {
    const w = lees('rij = [\n  1,\n  2\n]\nprint(rij)\n')
    expect(w.filter((x) => x.s === 'EINDE')).toHaveLength(2)
  })

  it('bouwt een boom waarin de voorrang klopt', () => {
    const [eerste] = ontleed(lees('x = 1 + 2 * 3\n'))
    expect(eerste?.t).toBe('zet')
    if (eerste?.t !== 'zet') return
    expect(eerste.w.t).toBe('reken')
    if (eerste.w.t !== 'reken') return
    expect(eerste.w.op).toBe('+')
    expect(eerste.w.r2.t).toBe('reken')
  })

  it('vangt een fout die niet van MINIPY komt netjes af', () => {
    const r = draai('print("a")\n', { schrijf: () => { throw new Error('vak vol') } })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.regel).toBe(0)
      expect(r.fout).toBe('er ging iets mis: vak vol')
    }
  })
})
