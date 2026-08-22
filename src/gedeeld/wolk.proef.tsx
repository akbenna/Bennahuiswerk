/**
 * DE UITGESTELDE OPSLAG NAGEREKEND
 *
 * Dit is het enige stuk van de wolk waar een fout niet meteen zichtbaar is. Een
 * verkeerde inlog merk je binnen een seconde; een opslag die niet aankomt merk
 * je pas als je je werk kwijt bent.
 *
 * De laatste proef hieronder dekt een fout die in de oude code zat: `bewaar()`
 * zette een timer van tweeënhalve seconde en verder niets. Sloot je het tabblad
 * binnen die tijd, dan was wat je had gedaan weg — zonder melding, want er was
 * niets misgegaan.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWolk } from './wolk'

const APP = 'proefapp'

/** Elk verzoek dat de deur uit ging, in volgorde. */
let verstuurd: Array<{ functie: string; lichaam: Record<string, unknown> }> = []

beforeEach(() => {
  vi.useFakeTimers()
  verstuurd = []
  localStorage.clear()
  localStorage.setItem('bennahub.acc.' + APP, JSON.stringify({ acc: 'selma', pin: '1234' }))
  vi.stubGlobal('fetch', async (url: string, opties: { body: string }) => ({
    ok: true,
    json: async () => {
      verstuurd.push({
        functie: url.split('/rpc/')[1] ?? '',
        lichaam: JSON.parse(opties.body) as Record<string, unknown>,
      })
      return {}
    },
  }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const opslagen = () => verstuurd.filter((v) => v.functie === 'bennahub_save')

describe('useWolk', () => {
  it('leest een bestaande sessie uit localStorage', () => {
    const { result } = renderHook(() => useWolk(APP))
    expect(result.current.aan).toBe(true)
    expect(result.current.account).toBe('selma')
  })

  it('stuurt niets voordat de wachttijd om is', async () => {
    const { result } = renderHook(() => useWolk(APP))
    act(() => { result.current.bewaar({ punten: 1 }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(2400) })
    expect(opslagen()).toHaveLength(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(200) })
    expect(opslagen()).toHaveLength(1)
  })

  it('vat tien wijzigingen samen tot één opslag, met de laatste stand', async () => {
    const { result } = renderHook(() => useWolk(APP))
    act(() => {
      for (let n = 1; n <= 10; n++) result.current.bewaar({ punten: n })
    })
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(opslagen()).toHaveLength(1)
    expect(opslagen()[0]?.lichaam['p_data']).toEqual({ punten: 10 })
  })

  it('stuurt meteen bij direct', async () => {
    const { result } = renderHook(() => useWolk(APP))
    await act(async () => { result.current.bewaar({ punten: 3 }, true) })
    expect(opslagen()).toHaveLength(1)
    expect(opslagen()[0]?.lichaam['p_data']).toEqual({ punten: 3 })
  })

  it('stuurt het wachtende werk alsnog bij uitloggen', async () => {
    const { result } = renderHook(() => useWolk(APP))
    act(() => { result.current.bewaar({ punten: 7 }) })
    await act(async () => { result.current.uitloggen() })
    expect(opslagen()).toHaveLength(1)
    expect(opslagen()[0]?.lichaam['p_data']).toEqual({ punten: 7 })
    expect(result.current.aan).toBe(false)
    expect(localStorage.getItem('bennahub.acc.' + APP)).toBeNull()
  })

  it('stuurt het wachtende werk alsnog als de app sluit', async () => {
    const { result, unmount } = renderHook(() => useWolk(APP))
    act(() => { result.current.bewaar({ punten: 9 }) })
    expect(opslagen()).toHaveLength(0)
    await act(async () => { unmount() })
    expect(opslagen()).toHaveLength(1)
    expect(opslagen()[0]?.lichaam['p_data']).toEqual({ punten: 9 })
  })

  it('bewaart niets zonder aanmelding', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useWolk(APP))
    expect(result.current.aan).toBe(false)
    act(() => { result.current.bewaar({ punten: 1 }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(opslagen()).toHaveLength(0)
  })

  it('geeft een lege lijst als de accountnamen niet opkomen', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('geen net') })
    const { result } = renderHook(() => useWolk(APP))
    let uit: string[] = ['nog niet gezet']
    await act(async () => { uit = await result.current.accounts() })
    expect(uit).toEqual([])
  })
})
