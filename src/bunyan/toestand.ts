/**
 * DE STAND VAN COMPUTERS & CODE
 *
 * Eén plek waar de voortgang woont, en drie kanten waar zij heen gaat: het
 * scherm, de opslag van dit toestel, en de centrale kopie. Gelijktrekken is
 * altijd ophalen, samenvoegen, terugschrijven — in die volgorde, want alleen zo
 * krijgt het ándere toestel ook wat hier gebeurd is.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWolk } from '@/gedeeld/wolk'
import type { Wolk } from '@/gedeeld/wolk'
import { iso, plusDagen, vandaag } from '@/gedeeld/datum'
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import { leeg, lees, samenvoegen, schrijf } from './opslag'
import type { Losse, Stand } from './opslag'
import { nieuweWeek, weekNr } from './voortgang'

export interface Klok {
  vandaag: string
  gisteren: string
  week: string
}

export interface Toestand {
  stand: Stand
  wolk: Wolk
  klok: Klok
  zet: (verander: (s: Stand) => Stand) => void
  gelijktrekken: () => Promise<boolean>
  voegBij: (binnen: Losse) => void
  wisAlles: () => void
}

const klokNu = (): Klok => {
  const nu = vandaag()
  return { vandaag: nu, gisteren: plusDagen(nu, -1), week: weekNr(new Date()) }
}

export function useBunyan(): Toestand {
  const [stand, zetRuw] = useState<Stand>(leeg)
  const [klok, zetKlok] = useState<Klok>(klokNu)
  const wolk = useWolk('bunyan')

  const laatste = useRef(stand)
  laatste.current = stand

  const zetEnSchrijf = useCallback((s: Stand, direct = false) => {
    laatste.current = s
    zetRuw(s)
    schrijf(s)
    wolk.bewaar(s, direct)
  }, [wolk])

  const zet = useCallback((verander: (s: Stand) => Stand) => {
    zetEnSchrijf(verander(laatste.current))
  }, [zetEnSchrijf])

  const gelijktrekken = useCallback(async (): Promise<boolean> => {
    const ver = await wolk.ophalen()
    if (!ver || typeof ver !== 'object') return false
    const binnen = ver as Losse
    /* Een lege kopie is geen kopie: dan staat er aan de andere kant nog niets,
       en overschrijven met niets is precies wat we nooit willen. */
    if (!binnen.lessen && binnen.punten === undefined) return false
    const s = samenvoegen(laatste.current, binnen)
    zetEnSchrijf({ ...s, laatste: new Date().toISOString() }, true)
    return true
  }, [wolk, zetEnSchrijf])

  const voegBij = useCallback((binnen: Losse) => {
    zetEnSchrijf(samenvoegen(laatste.current, binnen))
  }, [zetEnSchrijf])

  const wisAlles = useCallback(() => {
    zetEnSchrijf(leeg(), true)
  }, [zetEnSchrijf])

  /* Bij het openen: eerst wat hier staat, dan pas de wolk. */
  const gestart = useRef(false)
  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    zetRuw(nieuweWeek(lees(), klokNu().week))
    if (wolk.aan) void gelijktrekken()
  }, [wolk.aan, gelijktrekken])

  /* Een toestel dat een nacht dicht was, komt terug met de datum van gisteren. */
  useEffect(() => {
    const kijk = (): void => zetKlok(klokNu())
    addEventListener('visibilitychange', kijk)
    addEventListener('focus', kijk)
    return () => {
      removeEventListener('visibilitychange', kijk)
      removeEventListener('focus', kijk)
    }
  }, [])

  return { stand, wolk, klok, zet, gelijktrekken, voegBij, wisAlles }
}

export const datumNu = (): IsoDatum => iso(new Date())
