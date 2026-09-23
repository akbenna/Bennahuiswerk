/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * De bladzijden zijn vaste teksten, en dat is geen eigenschap die je aanneemt
 * maar één die stil sneuvelt. Zodra iemand ooit een gewicht, een dosis of een
 * naam in een tekst weeft, is dit boekje geen boekje meer maar software die
 * patiëntgegevens verwerkt, en dan schuift de app een categorie op waar hij
 * niet thuishoort. Zie de kop van `leren.ts`.
 *
 * De proef doet daarom twee dingen. Hij leest elke tekst twee keer, met twee
 * totaal verschillende condities, en eist dat er letterlijk hetzelfde staat. En
 * hij eist dat elke bladzijde een bron draagt, want een gezondheidstekst zonder
 * herkomst is in deze app hetzelfde soort fout als een voedingswaarde zonder
 * herkomst.
 */
import { describe, expect, it } from 'vitest'
import { BLADZIJDEN, bladzijden } from './leren'
import type { Conditie } from './conditie'

const leeg: Conditie = {}
const alles: Conditie = {
  hypertensie: true, dm2: true, hvz: true,
  med: ['insuline', 'su', 'sglt2', 'glp1', 'ras', 'diureticum'],
}

describe('de teksten staan vast', () => {
  it('leest bij elke conditie letterlijk hetzelfde', () => {
    const plat = (c: Conditie) =>
      bladzijden(c).map((b) => b.id + '|' + b.titel + '|' + b.tekst.join(' ')).sort().join('\n')
    expect(plat(alles)).toBe(plat(leeg))
  })

  it('laat geen bladzijde weg, welke conditie er ook staat', () => {
    expect(bladzijden(leeg)).toHaveLength(BLADZIJDEN.length)
    expect(bladzijden(alles)).toHaveLength(BLADZIJDEN.length)
  })
})

describe('de volgorde', () => {
  it('zet bij diabetes met insuline de hypo bovenaan', () => {
    expect(bladzijden({ dm2: true, med: ['insuline'] })[0]?.id).toBe('hypo')
  })

  it('zet bij hoge bloeddruk een bloeddrukbladzijde bovenaan', () => {
    expect(['zout', 'thuis-meten']).toContain(bladzijden({ hypertensie: true })[0]?.id)
  })

  it('houdt bij een lege conditie de vaste volgorde aan', () => {
    expect(bladzijden(leeg).map((b) => b.id)).toEqual(BLADZIJDEN.map((b) => b.id))
  })
})

describe('elke bladzijde is af', () => {
  it('draagt een bron', () => {
    for (const b of BLADZIJDEN) expect(b.bron.length).toBeGreaterThan(8)
  })

  it('heeft een titel en minstens twee alineas', () => {
    for (const b of BLADZIJDEN) {
      expect(b.titel.length).toBeGreaterThan(4)
      expect(b.tekst.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('heeft nergens twee keer hetzelfde kenmerk', () => {
    const ids = BLADZIJDEN.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
