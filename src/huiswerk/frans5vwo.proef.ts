/**
 * DE PASSÉ COMPOSÉ NAGEKEKEN
 *
 * Twee kanten van dezelfde vraag. Een antwoord dat op een telefoon getypt is,
 * zonder accenten of met een rechte apostrof, hoort goed te zijn: op papier
 * was het ook goed. Maar de varianten mogen niet zo ruim worden dat de accord
 * verdwijnt, want dat is precies wat er geoefend wordt. "arrive" bij "arrivée"
 * is fout, en "lavée" bij "elle s’est lavé les mains" ook.
 */
import { describe, expect, it } from 'vitest'
import { FRANS_5VWO, metVarianten } from './gegevens/frans5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { antwoordKlopt } from './nakijken'

const zonderAccent = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const vind = (a: string) => {
  const e = FRANS_5VWO.find((x) => x.a === a)
  if (!e) throw new Error('geen opgave met antwoord ' + a)
  return e
}

describe('de passé composé', () => {
  it('rekent een antwoord zonder accenten of met een rechte apostrof goed', () => {
    for (const e of FRANS_5VWO) {
      expect(antwoordKlopt(e, e.a), e.q).toBe(true)
      expect(antwoordKlopt(e, zonderAccent(e.a)), e.q).toBe(true)
      expect(antwoordKlopt(e, e.a.replace(/’/g, "'")), e.q).toBe(true)
      expect(antwoordKlopt(e, zonderAccent(e.a).replace(/’/g, "'").toUpperCase()), e.q).toBe(true)
    }
  })

  it('laat de accord niet wegvallen door de varianten', () => {
    expect(antwoordKlopt(vind('arrivée'), 'arrive')).toBe(false)
    expect(antwoordKlopt(vind('arrivée'), 'arrivé')).toBe(false)
    expect(antwoordKlopt(vind('parties'), 'partie')).toBe(false)
    expect(antwoordKlopt(vind('levés'), 'leve')).toBe(false)
    expect(antwoordKlopt(vind('mangées'), 'mange')).toBe(false)
    /* En andersom: waar géén accord hoort, is de accord fout. */
    expect(antwoordKlopt(vind('lavé'), 'lavee')).toBe(false)
    expect(antwoordKlopt(vind('lavé'), 'lave')).toBe(true)
  })

  it('verwart het hulpwerkwoord niet', () => {
    expect(antwoordKlopt(vind('suis'), 'ai')).toBe(false)
    expect(antwoordKlopt(vind('a'), 'est')).toBe(false)
  })

  it('maakt van een antwoord zonder bijzondere tekens geen dubbele varianten', () => {
    const e = metVarianten({ p: 'x', v: 'frans', t: 'x', q: 'x', a: 'vu' })
    expect(e.alt).toEqual([])
  })

  it('landt op de tegel die er al was, en heeft alle drie de treden', () => {
    const tegels = new Set(SEED.filter((e) => e.p === 'amaani' && e.v === 'frans').map((e) => e.t))
    for (const e of FRANS_5VWO) expect(tegels.has(e.t), e.t).toBe(true)
    for (const lvl of [1, 2, 3]) {
      expect(FRANS_5VWO.filter((e) => e.lvl === lvl).length, `niveau ${lvl}`).toBeGreaterThanOrEqual(6)
    }
  })

  it('staat achter de rest, zodat geen bestaande id verschuift', () => {
    const eerste = NIEUW2627.length - FRANS_5VWO.length
    expect(NIEUW2627[eerste]?.q).toBe(FRANS_5VWO[0]?.q)
    expect(NIEUW2627[eerste - 1]?.p).not.toBe('amaani')
  })
})
