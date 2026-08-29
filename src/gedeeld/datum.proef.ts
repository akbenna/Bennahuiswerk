/**
 * MORGEN BESTAAT NIET
 *
 * `stapDag` is de enige plek waar staat hoe ver je vooruit mag. Twee dingen
 * gebruiken hem — de pijltjesknop en de veeg — en die horen precies hetzelfde te
 * weigeren. Gaat de grens hier stuk, dan komt er een leeg dagoverzicht van een
 * dag die nog niet geweest is, en dat ziet er niet uit als een fout.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { plusDagen, stapDag, vandaag } from './datum'
import type { IsoDatum } from './db/tabellen'

afterEach(() => vi.useRealTimers())

/** Een vast heden, zodat de proef om middernacht niet ineens iets anders zegt. */
function nuIs(dag: string): IsoDatum {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(dag + 'T09:00:00'))
  return dag as IsoDatum
}

describe('stapDag', () => {
  it('terug mag altijd', () => {
    const nu = nuIs('2026-08-29')
    expect(stapDag(nu, -1)).toBe('2026-08-28')
    expect(stapDag(nu, -400)).toBe(plusDagen(nu, -400))
  })

  it('vooruit mag tot en met vandaag', () => {
    nuIs('2026-08-29')
    expect(stapDag('2026-08-27' as IsoDatum, 1)).toBe('2026-08-28')
    expect(stapDag('2026-08-28' as IsoDatum, 1)).toBe('2026-08-29')
  })

  it('voorbij vandaag mag niet', () => {
    const nu = nuIs('2026-08-29')
    expect(stapDag(nu, 1)).toBeNull()
    expect(stapDag(nu, 30)).toBeNull()
    /* Ook een sprong vanuit het verleden die eroverheen schiet. */
    expect(stapDag('2026-08-20' as IsoDatum, 30)).toBeNull()
  })

  it('vandaag zelf is geen stap voorbij vandaag', () => {
    const nu = nuIs('2026-08-29')
    expect(stapDag(nu, 0)).toBe(vandaag())
  })

  it('over een maandgrens klopt het ook', () => {
    nuIs('2026-09-02')
    expect(stapDag('2026-08-31' as IsoDatum, 1)).toBe('2026-09-01')
  })
})
