/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Twee dingen, en het tweede is het belangrijkste.
 *
 * De factor is 2,5 en niet 2,54 of 1000/400 of wat er verder in omloop is. Hij
 * komt uit de etiketteringsverordening en hij hoort te kloppen met wat er op het
 * pak staat, want daar vergelijkt de gebruiker mee.
 *
 * En onbekend blijft onbekend. Zou `zoutGram` ooit 0 teruggeven voor een product
 * waarvan het natrium niet bekend is, dan staat er op het scherm "0,0 g zout"
 * bij iets wat zout kan bevatten. Dat is dezelfde fout als een ontbrekende
 * voedingswaarde als nul behandelen, en die maakt deze app nergens anders.
 */
import { describe, expect, it } from 'vitest'
import { ZOUTFACTOR, zoutGram } from './zout'

describe('de omrekening', () => {
  it('volgt de factor uit de etiketteringsverordening', () => {
    expect(ZOUTFACTOR).toBe(2.5)
  })

  it('rekent milligram natrium om naar gram zout', () => {
    expect(zoutGram(400)).toBeCloseTo(1.0, 6)
    expect(zoutGram(1000)).toBeCloseTo(2.5, 6)
    expect(zoutGram(0)).toBe(0)
  })

  /* Een bouillonblokje is het schoolvoorbeeld: rond de 4 g zout per blokje. */
  it('geeft voor een zoutrijk product een herkenbaar getal', () => {
    expect(zoutGram(1600)).toBeCloseTo(4.0, 6)
  })
})

describe('onbekend is geen nul', () => {
  it('laat null null', () => {
    expect(zoutGram(null)).toBeNull()
    expect(zoutGram(undefined)).toBeNull()
  })

  it('weigert wat geen getal is', () => {
    expect(zoutGram(Number.NaN)).toBeNull()
    expect(zoutGram(Number.POSITIVE_INFINITY)).toBeNull()
  })
})
