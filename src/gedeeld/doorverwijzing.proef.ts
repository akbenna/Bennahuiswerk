/**
 * De oude adressen van BennaHealth blijven werken.
 *
 * `/kalibratie/:pad*` vangt `/kalibratie/` niet: de slash hoort bij het
 * optionele deel, dus met een slash en niets erachter past het patroon niet.
 * Dat gaf op 6 oktober 2026 een 404, juist op het adres dat ProVita in zijn
 * knoppen had staan. De vorm met de slash heeft daarom een eigen regel.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

type Regel = { source: string; destination: string; permanent?: boolean }
const regels: Regel[] = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects

describe('doorverwijzing van /kalibratie', () => {
  for (const [van, naar] of [
    ['/kalibratie', '/health'],
    ['/kalibratie/', '/health/'],
    ['/kalibratie/:pad*', '/health/:pad*'],
  ]) {
    it(`${van} gaat naar ${naar}`, () => {
      expect(regels.find((r) => r.source === van)?.destination).toBe(naar)
    })
  }

  it('de regel met de slash staat vóór het patroon', () => {
    const i = regels.findIndex((r) => r.source === '/kalibratie/')
    const j = regels.findIndex((r) => r.source === '/kalibratie/:pad*')
    expect(i).toBeGreaterThanOrEqual(0)
    expect(i).toBeLessThan(j)
  })
})
