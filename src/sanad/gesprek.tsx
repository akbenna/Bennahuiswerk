/**
 * HET GESPREK OP HET SCHERM
 *
 * Eén haak voor beide plekken waar het model meedoet. Het antwoord komt
 * stromend binnen en verschijnt terwijl het geschreven wordt; dat is niet
 * alleen prettiger dan een spinner, het maakt ook zichtbaar dat er iets gebeurt
 * bij een vraag waar het model lang over nadenkt.
 *
 * Afbreken kan altijd: wie een verkeerde vraag stelde hoeft niet te wachten,
 * en wie wegklikt laat geen verzoek achter dat nog terugkomt in een scherm dat
 * er niet meer is.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AiFout, vraag } from './ai'
import { Bezig } from './onderdelen'

export interface Gesprek {
  tekst: string
  bezig: boolean
  fout: string
  vraag: (sys: string, invoer: string) => Promise<void>
  stop: () => void
}

export function useGesprek(): Gesprek {
  const [tekst, zetTekst] = useState('')
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState('')
  const breker = useRef<AbortController | null>(null)

  /* Wegklikken breekt af: een lopend verzoek dat straks terugkomt zou anders in
     een scherm schrijven dat er niet meer is. */
  useEffect(() => () => breker.current?.abort(), [])

  const stop = useCallback(() => {
    breker.current?.abort()
    breker.current = null
    zetBezig(false)
  }, [])

  return {
    tekst,
    bezig,
    fout,
    stop,
    vraag: useCallback(async (sys: string, invoer: string) => {
      breker.current?.abort()
      const b = new AbortController()
      breker.current = b
      zetFout('')
      zetTekst('')
      zetBezig(true)
      try {
        const uit = await vraag(sys, invoer, zetTekst, b.signal)
        if (!b.signal.aborted) zetTekst(uit)
      } catch (e) {
        if (!b.signal.aborted) zetFout(e instanceof AiFout ? e.message : 'Er ging iets mis.')
      } finally {
        if (breker.current === b) breker.current = null
        zetBezig(false)
      }
    }, []),
  }
}

/** Het antwoordvak. Gewone tekst, met de alinea's van het model intact. */
export function Antwoord({ g }: { g: Gesprek }): ReactNode {
  if (g.fout) return <div className="ask-out"><span className="small muted">{g.fout}</span></div>
  if (!g.tekst && !g.bezig) return null
  return (
    <div className="ask-out">
      {g.tekst
        ? g.tekst.split(/\n{2,}/).map((p, i) => <p key={i} style={{ margin: i ? '10px 0 0' : 0 }}>{p}</p>)
        : <Bezig tekst="aan het nadenken…" />}
      {g.bezig && g.tekst && (
        <p style={{ margin: '10px 0 0' }}>
          <button className="btn ghost sm" onClick={g.stop}>Stoppen</button>
        </p>
      )}
    </div>
  )
}
