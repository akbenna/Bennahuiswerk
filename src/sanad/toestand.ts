/**
 * DE STAND VAN HET PROGRAMMA
 *
 * Eén plek waar de voortgang woont, en drie kanten waar zij heen gaat: het
 * scherm, de opslag van dit toestel, en de centrale kopie. Lokaal blijft de
 * bron waarop de app draait — snel, en werkt zonder internet; de wolk is de
 * kopie die toestellen met elkaar delen.
 *
 * Gelijktrekken is altijd ophalen, samenvoegen, terugschrijven, in die
 * volgorde. Alleen zo krijgt het ándere toestel ook wat hier gebeurd is.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWolk } from '@/gedeeld/wolk'
import type { Wolk } from '@/gedeeld/wolk'
import { vandaag } from '@/gedeeld/datum'
import { LEEG, lees, samenvoegen, schrijf } from './opslag'
import type { Losse, Stand } from './opslag'

export interface Toestand {
  stand: Stand
  wolk: Wolk
  /** De dag van vandaag; wordt bij terugkeer op het toestel opnieuw gelezen. */
  nu: string
  /** Werk de stand bij en schrijf hem naar beide kanten weg. */
  zet: (verander: (s: Stand) => Stand) => void
  /** Ophalen, samenvoegen, terugschrijven. Geeft terug of het lukte. */
  gelijktrekken: (stil?: boolean) => Promise<boolean>
  /** Een binnengekomen momentopname erbij voegen (back-up terugzetten). */
  voegBij: (binnen: Losse) => void
  /** Alles weg, hier en centraal. */
  wisAlles: () => Promise<void>
}

export function useSanad(): Toestand {
  const [stand, zetRuw] = useState<Stand>(LEEG)
  const [nu, zetNu] = useState(vandaag)
  const wolk = useWolk('sanad')

  /* De laatste stand buiten de hertekening houden: gelijktrekken loopt door een
     await heen en zou anders met een verouderde kopie terugschrijven. */
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
    if (ver === null || typeof ver !== 'object') return false
    zetEnSchrijf(samenvoegen(laatste.current, ver as Losse), true)
    return true
  }, [wolk, zetEnSchrijf])

  const voegBij = useCallback((binnen: Losse) => {
    zetEnSchrijf(samenvoegen(laatste.current, binnen))
  }, [zetEnSchrijf])

  const wisAlles = useCallback(async () => {
    laatste.current = LEEG
    zetRuw(LEEG)
    schrijf(LEEG)
    if (wolk.aan) wolk.bewaar(LEEG, true)
  }, [wolk])

  /* Bij het openen: eerst wat hier staat, dan pas de wolk. De app is meteen
     bruikbaar; het gelijktrekken mag even duren en mag ook mislukken. */
  const gestart = useRef(false)
  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    zetRuw(lees())
    if (wolk.aan) void gelijktrekken()
  }, [wolk.aan, gelijktrekken])

  /* Een telefoon die een nacht in de zak zit, komt de volgende ochtend terug
     met het scherm van gisteren. Dan klopt "vandaag" niet meer. */
  useEffect(() => {
    const kijk = (): void => zetNu(vandaag())
    addEventListener('visibilitychange', kijk)
    addEventListener('focus', kijk)
    return () => {
      removeEventListener('visibilitychange', kijk)
      removeEventListener('focus', kijk)
    }
  }, [])

  return { stand, wolk, nu, zet, gelijktrekken, voegBij, wisAlles }
}
