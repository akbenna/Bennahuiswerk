/**
 * Twee tonen uit de Web Audio API in plaats van geluidsbestanden: scheelt
 * downloads en werkt zonder internet.
 */
import { useCallback, useRef } from 'react'
import { ri } from './toeval'

export type Klank = 'goed' | 'mis' | 'piep'

export function useGeluid(aan: boolean): (soort: Klank) => void {
  const ctx = useRef<AudioContext | null>(null)

  return useCallback((soort: Klank) => {
    if (!aan) return
    try {
      /* Pas aanmaken bij het eerste geluid: browsers weigeren een AudioContext
         die buiten een aanraking om ontstaat. */
      ctx.current ??= new AudioContext()
      const c = ctx.current
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g)
      g.connect(c.destination)
      o.type = 'sine'
      const t = c.currentTime
      if (soort === 'goed') {
        o.frequency.setValueAtTime(660, t)
        o.frequency.setValueAtTime(880, t + 0.08)
      } else if (soort === 'mis') {
        o.frequency.setValueAtTime(220, t)
        o.frequency.setValueAtTime(160, t + 0.09)
      } else {
        o.frequency.setValueAtTime(440 + ri(0, 220), t)
      }
      g.gain.setValueAtTime(0.12, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      o.start(t)
      o.stop(t + 0.24)
    } catch { /* geen geluid is geen storing */ }
  }, [aan])
}
