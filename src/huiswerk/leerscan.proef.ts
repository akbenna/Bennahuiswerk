/**
 * DE LEERSCAN NAGEREKEND
 *
 * Twee dingen die niet met het oog te zien zijn.
 *
 * Het eerste: dat de zwakste gewoonte bovenaan komt en niet toevallig de eerste
 * in de lijst. Bij gelijke stand wint de dimensie waar het meeste te halen is —
 * jezelf overhoren vóór spreiden vóór de rest — en dat is een keuze die je
 * alleen ziet als je hem toetst.
 *
 * Het tweede: dat de vragen zelf kloppen. Drie per dimensie, elk drie opties,
 * en ze staan door elkaar. Dat laatste is geen opmaak maar opzet: staan alle
 * vragen over uitstelgedrag op een rij, dan hoort een kind waar het over gaat en
 * gaat het antwoorden wat braaf klinkt.
 */
import { describe, expect, it } from 'vitest'
import { DIMENSIES, SCANVRAGEN } from './gegevens/leerscan'
import type { Dimensie } from './gegevens/leerscan'
import { advies, bandVan, isAf, uitkomsten } from './leerscan'
import type { Leerscan } from './leerscan'

/** Een scan waarin elke dimensie de opgegeven score per vraag krijgt. */
function scan(per: Partial<Record<Dimensie, number>>, standaard = 1): Leerscan {
  const antwoorden: Record<string, number> = {}
  for (const v of SCANVRAGEN) antwoorden[v.id] = per[v.dim] ?? standaard
  return { tijd: 0, antwoorden }
}

describe('de vragenlijst', () => {
  it('heeft precies drie vragen per dimensie', () => {
    for (const d of DIMENSIES) {
      expect(SCANVRAGEN.filter((v) => v.dim === d.dim), d.dim).toHaveLength(3)
    }
    expect(SCANVRAGEN).toHaveLength(15)
  })

  it('geeft elke vraag een eigen id en drie opties', () => {
    expect(new Set(SCANVRAGEN.map((v) => v.id)).size).toBe(SCANVRAGEN.length)
    for (const v of SCANVRAGEN) {
      expect(v.opties, v.id).toHaveLength(3)
      for (const o of v.opties) expect(o.trim().length, v.id).toBeGreaterThan(3)
      expect(v.vraag.trim().endsWith('?'), v.id).toBe(true)
    }
  })

  /* Zonder dit staan de drie vragen van één dimensie zo weer op een rij. */
  it('zet nooit twee vragen van dezelfde dimensie achter elkaar', () => {
    for (let i = 1; i < SCANVRAGEN.length; i++) {
      expect(SCANVRAGEN[i]?.dim, `vraag ${i}`).not.toBe(SCANVRAGEN[i - 1]?.dim)
    }
  })

  it('geeft elke dimensie een advies per band en een plek in de app', () => {
    for (const d of DIMENSIES) {
      expect(d.advies, d.dim).toHaveLength(3)
      for (const a of d.advies) expect(a.trim().length, d.dim).toBeGreaterThan(40)
      expect(d.inDeApp.trim().length, d.dim).toBeGreaterThan(20)
      expect(d.waarom.trim().length, d.dim).toBeGreaterThan(40)
    }
  })
})

describe('de banden', () => {
  it('legt de grenzen op 2 en 4', () => {
    expect([0, 1, 2].map(bandVan)).toEqual([0, 0, 0])
    expect([3, 4].map(bandVan)).toEqual([1, 1])
    expect([5, 6].map(bandVan)).toEqual([2, 2])
  })
})

describe('de uitkomst', () => {
  it('telt drie vragen op tot hoogstens zes punten', () => {
    const u = uitkomsten(scan({}, 2))
    for (const x of u) {
      expect(x.punten, x.dim).toBe(6)
      expect(x.beantwoord, x.dim).toBe(3)
      expect(x.band, x.dim).toBe(2)
    }
  })

  it('zet de zwakste gewoonte vooraan', () => {
    const u = uitkomsten(scan({ mengen: 0 }, 2))
    expect(u[0]?.dim).toBe('mengen')
    expect(u[0]?.punten).toBe(0)
  })

  /* Bij gelijke stand wint de gewoonte waar het meeste te halen valt.
     Let op het gekozen paar: `mengen` staat in de vragenlijst vóór `nakijken`,
     maar levert minder op. Alleen met dit paar zegt de proef iets — bij elk
     ander paar geeft stabiel sorteren toevallig hetzelfde antwoord, en dan
     toets je niets. Dat bleek uit een mutatieproef: de regel weghalen liet de
     eerdere versie van deze proef gewoon groen. */
  it('breekt gelijke stand op wat het meeste oplevert, niet op de volgorde van de lijst', () => {
    const u = uitkomsten(scan({ mengen: 0, nakijken: 0 }, 2))
    expect(u[0]?.dim).toBe('nakijken')
    expect(u[1]?.dim).toBe('mengen')
    expect(DIMENSIES.findIndex((d) => d.dim === 'mengen'))
      .toBeLessThan(DIMENSIES.findIndex((d) => d.dim === 'nakijken'))
  })

  it('telt een onbeantwoorde vraag niet als nul-met-oordeel', () => {
    const half: Leerscan = { tijd: 0, antwoorden: { o1: 2 } }
    const o = uitkomsten(half).find((x) => x.dim === 'ophalen')
    expect(o?.beantwoord).toBe(1)
    expect(o?.punten).toBe(2)
  })

  it('trekt een antwoord buiten bereik terug binnen 0 en 2', () => {
    const raar: Leerscan = { tijd: 0, antwoorden: { o1: 9, o2: -4, o3: 1 } }
    const o = uitkomsten(raar).find((x) => x.dim === 'ophalen')
    expect(o?.punten).toBe(2 + 0 + 1)
  })
})

describe('het advies', () => {
  it('gaat over precies één ding', () => {
    const a = advies(scan({ nakijken: 0 }, 2))
    expect(a.kop.dim).toBe('nakijken')
    expect(a.tekst).toBe(a.kop.kaart.advies[0])
    expect(a.inDeApp).toContain('fouten')
  })

  it('noemt iets wat al goed gaat, als dat er is', () => {
    const a = advies(scan({ beginnen: 0 }, 2))
    expect(a.sterk).not.toBeNull()
    expect(a.sterk?.band).toBe(2)
    expect(a.sterk?.dim).not.toBe('beginnen')
  })

  /* Een compliment over iets wat matig gaat is geen compliment. */
  it('verzint geen compliment als niets in de bovenste band zit', () => {
    expect(advies(scan({}, 1)).sterk).toBeNull()
  })

  it('past de toon aan de band aan', () => {
    expect(advies(scan({}, 2)).tekst).toBe(
      DIMENSIES.find((d) => d.dim === 'ophalen')?.advies[2])
    expect(advies(scan({}, 0)).tekst).toBe(
      DIMENSIES.find((d) => d.dim === 'ophalen')?.advies[0])
  })
})

describe('af of niet', () => {
  it('is pas af als elke vraag beantwoord is', () => {
    expect(isAf(null)).toBe(false)
    expect(isAf({ tijd: 0, antwoorden: {} })).toBe(false)
    expect(isAf({ tijd: 0, antwoorden: { o1: 1 } })).toBe(false)
    expect(isAf(scan({}, 1))).toBe(true)
  })
})
