/**
 * HET SAMENVOEGEN NAGEREKEND
 *
 * Dit is het enige stuk van de spelletjes waar een fout stil blijft. Een spel
 * dat vastloopt zie je meteen; een record dat bij het gelijktrekken tussen de
 * tablet en de telefoon de verkeerde kant op wordt overschreven zie je pas als
 * je het mist.
 *
 * De kern van de regel: bij bijna elk spel wint het hóógste, maar bij het
 * geheugenspel juist het laagste — minder beurten is beter. Eén verkeerd teken
 * daar en het beste resultaat van een kind verdwijnt bij de volgende
 * synchronisatie.
 */
import { describe, expect, it } from 'vitest'
import { haalOud, isBeter, leeg, samenvoegen, vul } from './opslag'
import type { Stand } from './opslag'
import type { Spelbeschrijving } from './spellen/kader'

/* Genoeg van een spelbeschrijving om te weten welke kant beter op is. */
const SPELLEN = [
  { id: 'reken', lager: false },
  { id: 'memory', lager: true },
] as unknown as Spelbeschrijving[]

const stand = (p: Partial<Stand>): Stand => ({ ...leeg(), ...p })

describe('samenvoegen', () => {
  it('houdt het hoogste record bij een gewoon spel', () => {
    const a = stand({ records: { reken: 12 } })
    const b = stand({ records: { reken: 9 } })
    expect(samenvoegen(a, b, SPELLEN).records['reken']).toBe(12)
    expect(samenvoegen(b, a, SPELLEN).records['reken']).toBe(12)
  })

  it('houdt het laagste record bij het geheugenspel', () => {
    const a = stand({ records: { memory: 14 } })
    const b = stand({ records: { memory: 11 } })
    expect(samenvoegen(a, b, SPELLEN).records['memory']).toBe(11)
    expect(samenvoegen(b, a, SPELLEN).records['memory']).toBe(11)
  })

  it('neemt een record over dat aan één kant nog niet bestond', () => {
    const uit = samenvoegen(stand({}), stand({ records: { memory: 20 } }), SPELLEN)
    expect(uit.records['memory']).toBe(20)
  })

  it('telt het aantal keer gespeeld niet op maar neemt het hoogste', () => {
    // Twee toestellen die allebei vanaf dezelfde stand verder telden: optellen
    // zou de gedeelde geschiedenis dubbel meetellen.
    const a = stand({ gespeeld: { reken: 8 } })
    const b = stand({ gespeeld: { reken: 5 } })
    expect(samenvoegen(a, b, SPELLEN).gespeeld['reken']).toBe(8)
  })

  it('laat bij de instellingen de jóngste winnen, niet de hoogste', () => {
    const oud = stand({
      instelD: '2026-08-01T10:00:00Z',
      instel: { geluid: true, memoryAr: false, ouderPin: '1234' },
    })
    const nieuw = stand({
      instelD: '2026-08-20T10:00:00Z',
      instel: { geluid: false, memoryAr: true, ouderPin: '9876' },
    })
    expect(samenvoegen(oud, nieuw, SPELLEN).instel.ouderPin).toBe('9876')
    expect(samenvoegen(nieuw, oud, SPELLEN).instel.ouderPin).toBe('9876')
  })

  it('raakt een onbekend spel niet kwijt', () => {
    const uit = samenvoegen(stand({}), stand({ records: { onbekend: 3 } }), SPELLEN)
    expect(uit.records['onbekend']).toBe(3)
  })

  it('laat de oorspronkelijke standen heel', () => {
    const a = stand({ records: { reken: 1 } })
    const b = stand({ records: { reken: 2 } })
    samenvoegen(a, b, SPELLEN)
    expect(a.records['reken']).toBe(1)
    expect(b.records['reken']).toBe(2)
  })
})

describe('isBeter', () => {
  it('noemt het eerste resultaat altijd beter', () => {
    expect(isBeter(undefined, 0, false)).toBe(true)
    expect(isBeter(undefined, 99, true)).toBe(true)
  })
  it('kijkt de goede kant op', () => {
    expect(isBeter(10, 11, false)).toBe(true)
    expect(isBeter(10, 9, false)).toBe(false)
    expect(isBeter(10, 9, true)).toBe(true)
    expect(isBeter(10, 11, true)).toBe(false)
  })
  it('rekent gelijk niet als beter', () => {
    expect(isBeter(10, 10, false)).toBe(false)
    expect(isBeter(10, 10, true)).toBe(false)
  })
})

describe('vul', () => {
  it('vult een stand van de schijf aan met wat er ontbreekt', () => {
    const uit = vul({ records: { reken: 5 } })
    expect(uit.records['reken']).toBe(5)
    expect(uit.instel.geluid).toBe(true)
    expect(uit.instel.ouderPin).toBe('1234')
  })
  it('behoudt een instelling die er wél stond', () => {
    const uit = vul({ instel: { geluid: false } as never })
    expect(uit.instel.geluid).toBe(false)
    expect(uit.instel.memoryAr).toBe(false)
  })
  it('geeft een lege stand terug bij niets', () => {
    expect(vul(null)).toEqual(leeg())
  })
})

describe('haalOud', () => {
  it('neemt de records uit de huiswerkapp over', () => {
    localStorage.setItem('oefenapp_v1', JSON.stringify({ games: { reken: 15, memory: 9 } }))
    const { stand: uit, overgenomen } = haalOud(leeg(), SPELLEN)
    expect(overgenomen).toBe(2)
    expect(uit.records).toEqual({ reken: 15, memory: 9 })
  })

  it('overschrijft een beter record niet', () => {
    localStorage.setItem('oefenapp_v1', JSON.stringify({ games: { reken: 5, memory: 20 } }))
    const nu = stand({ records: { reken: 12, memory: 8 } })
    const { stand: uit, overgenomen } = haalOud(nu, SPELLEN)
    expect(overgenomen).toBe(0)
    expect(uit.records).toEqual({ reken: 12, memory: 8 })
  })

  it('slaat wat geen getal is over', () => {
    localStorage.setItem('oefenapp_v1', JSON.stringify({ games: { reken: 'hoog', memory: 4 } }))
    const { overgenomen } = haalOud(leeg(), SPELLEN)
    expect(overgenomen).toBe(1)
  })

  it('doet niets bij onleesbare of ontbrekende opslag', () => {
    localStorage.setItem('oefenapp_v1', 'geen json')
    expect(haalOud(leeg(), SPELLEN).overgenomen).toBe(0)
    localStorage.removeItem('oefenapp_v1')
    expect(haalOud(leeg(), SPELLEN).overgenomen).toBe(0)
  })
})
