/**
 * DE RECITATIE
 *
 * De app gebruikt zijn eigen map als die er is, en valt anders terug op de
 * fragmenten die voor Islam leren zijn opgehaald. Dat scheelt honderden
 * bestanden dubbel opslaan voor de twaalf korte soera's die beide apps kennen.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Aya } from './koran'

/** De soera's waarvan Islam leren de recitatie al heeft, met hun sleutel daar. */
const NOER: Record<number, string> = {
  1: 'fatiha', 103: 'asr', 105: 'fil', 106: 'quraysh', 107: 'maun', 108: 'kawthar',
  109: 'kafirun', 110: 'nasr', 111: 'masad', 112: 'ikhlas', 113: 'falaq', 114: 'nas',
}

export interface Recitatie {
  /** Is er voor deze aya een fragment? */
  heeft: (a: Aya) => boolean
  aantal: number
  bron: string
  speel: (a: Aya, tempo: number) => Promise<boolean>
  stop: () => void
}

async function lijst(pad: string): Promise<{ fragmenten: string[]; bron: string }> {
  try {
    const r = await fetch(pad, { cache: 'no-cache' })
    if (r.ok) {
      const j = (await r.json()) as { fragmenten?: string[]; bron?: string }
      return { fragmenten: j.fragmenten ?? [], bron: j.bron ?? '' }
    }
  } catch { /* geen recitatie is geen storing */ }
  return { fragmenten: [], bron: '' }
}

export function useRecitatie(): Recitatie {
  const [eigen, zetEigen] = useState<Set<string>>(() => new Set())
  const [noer, zetNoer] = useState<Set<string>>(() => new Set())
  const [bron, zetBron] = useState('')
  const speler = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let af = false
    void (async () => {
      const [e, n] = await Promise.all([
        lijst('audio/lijst.json'),
        lijst('/noer/audio/quran/lijst.json'),
      ])
      if (af) return
      zetEigen(new Set(e.fragmenten))
      zetNoer(new Set(n.fragmenten))
      zetBron(e.bron || n.bron)
    })()
    return () => { af = true }
  }, [])

  /* Browsers weigeren geluid dat niet uit een aanraking voortkomt. Eén stil
     fragment bij de eerste tik ontgrendelt de speler voor de rest van de sessie. */
  useEffect(() => {
    const ontgrendel = () => {
      try {
        speler.current ??= new Audio()
        speler.current.src =
          'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA'
        void speler.current.play().then(() => speler.current?.pause()).catch(() => {})
      } catch { /* dan later */ }
      removeEventListener('pointerdown', ontgrendel)
      removeEventListener('click', ontgrendel)
    }
    addEventListener('pointerdown', ontgrendel, { passive: true })
    addEventListener('click', ontgrendel, { passive: true })
    return () => {
      removeEventListener('pointerdown', ontgrendel)
      removeEventListener('click', ontgrendel)
    }
  }, [])

  const pad = useCallback((a: Aya): string | null => {
    if (eigen.has(`${a.nr}:${a.n}`)) return `audio/${a.nr}-${a.n}.mp3`
    const k = NOER[a.nr]
    if (k && noer.has(`q:h-${k}:${a.n}`)) return `/noer/audio/quran/h-${k}-${a.n}.mp3`
    return null
  }, [eigen, noer])

  const stop = useCallback(() => {
    try {
      if (speler.current) { speler.current.pause(); speler.current.currentTime = 0 }
    } catch { /* mag falen */ }
  }, [])

  useEffect(() => stop, [stop])

  return {
    heeft: useCallback((a) => pad(a) != null, [pad]),
    aantal: eigen.size + noer.size,
    bron,
    stop,
    speel: useCallback((a, tempo) => {
      const f = pad(a)
      if (!f) return Promise.resolve(false)
      return new Promise<boolean>((klaar) => {
        stop()
        speler.current ??= new Audio()
        const el = speler.current
        el.src = f
        el.playbackRate = tempo || 1
        const af = () => { el.onended = null; el.onerror = null; klaar(true) }
        el.onended = af
        el.onerror = af
        void el.play()?.catch(af)
      })
    }, [pad, stop]),
  }
}
