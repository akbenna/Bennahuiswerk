/**
 * HET SPELSCHERM
 *
 * Elk spel krijgt hetzelfde kader: een kopregel met de naam, een standregel die
 * meeloopt, en daaronder het veld. In de oude app schreven de spellen die
 * regels zelf met `stand()` en `knop()` rechtstreeks in de DOM; hier geven ze
 * hem gewoon door als inhoud.
 */
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Klank } from '../geluid'
import type { Instellingen } from '../opslag'

export interface Spelbeschrijving {
  id: string
  ico: string
  /** De naam. */
  n: string
  /** Eén zin uitleg op de tegel. */
  u: string
  /** De eenheid van de score: punten, goed, beurten… */
  eenh: string
  /** Waar bij dit spel minder juist beter is. Alleen het geheugenspel. */
  lager?: boolean
  Spel: (p: SpelEigenschappen) => ReactNode
}

export interface SpelEigenschappen {
  spel: Spelbeschrijving
  record: number | undefined
  piep: (k: Klank) => void
  instel: Instellingen
  zetInstel: (i: Partial<Instellingen>) => void
  /** Het spel is afgelopen met deze score. */
  opKlaar: (score: number, tekst?: string) => void
  /** Opnieuw beginnen met hetzelfde spel; het geheugenspel gebruikt dit als je
   *  halverwege van plaatjes naar letters wisselt. */
  opnieuw: () => void
  /** Het spel afbreken zonder score. */
  opSluiten: () => void
}

export function Kader(
  { spel, stand, knop, opSluiten, children }:
  {
    spel: Spelbeschrijving
    stand: ReactNode
    knop?: ReactNode
    opSluiten: () => void
    children?: ReactNode
  },
) {
  return (
    <>
      <div className="rij tussen">
        <p className="meta">{spel.ico} {spel.n}</p>
        <button type="button" className="btn ghost sm" onClick={opSluiten}>Klaar</button>
      </div>
      <div className="card midden" style={{ marginTop: 12 }}>
        <div className="stand">{stand}</div>
        <div>{knop}</div>
      </div>
      <div id="veld">{children}</div>
    </>
  )
}

/** De vaste staart van de standregel. */
export function RecordRegel({ spel, record }: { spel: Spelbeschrijving; record: number | undefined }) {
  return <>record <b>{record === undefined ? '—' : `${record} ${spel.eenh}`}</b></>
}

/**
 * Een aftellende klok die zichzelf opruimt. Elk spel op tijd gebruikt hem, en
 * geen enkel spel houdt zijn eigen `setInterval` meer bij — dat was in de oude
 * app de reden dat er een lijst met lopende timers moest worden bijgehouden om
 * ze bij het sluiten allemaal te kunnen stoppen.
 */
export function useKlok(duur: number, opAf: () => void): number {
  const [tijd, zetTijd] = useState(duur)
  const af = useRef(opAf)
  af.current = opAf

  useEffect(() => {
    const t = setInterval(() => {
      zetTijd((n) => {
        if (n <= 1) { clearInterval(t); af.current(); return 0 }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [duur])

  return tijd
}

/** Een timer die zichzelf opruimt als het spel weggaat. */
export function useLater(): (f: () => void, ms: number) => void {
  const lopend = useRef<Array<ReturnType<typeof setTimeout>>>([])
  useEffect(() => () => { lopend.current.forEach(clearTimeout) }, [])
  return (f, ms) => { lopend.current.push(setTimeout(f, ms)) }
}
