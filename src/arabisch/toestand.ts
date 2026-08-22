/**
 * DE STAND VAN ARABISCH
 *
 * Eén gezin, meerdere profielen, en per profiel een leerpad, een kaartenbak en
 * een jaarplan. `zetProf` werkt op het profiel dat aan de beurt is, zodat geen
 * enkel scherm hoeft te weten waar in de stand dat staat.
 *
 * De datum komt uit één plek. Een telefoon die 's avonds wordt neergelegd en
 * 's ochtends weer opgepakt, staat anders nog op het scherm van gisteren — en
 * dan klopt de wachtrij niet meer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWolk } from '@/gedeeld/wolk'
import type { Wolk } from '@/gedeeld/wolk'
import { vandaag } from './datum'
import { leeg, lees, nieuwProfiel, samenvoegen, schrijf } from './opslag'
import type { Losse, Profiel, Stand } from './opslag'
import { bouwPad, spoorBijLeeftijd } from './leerplan'
import type { Padstap } from './leerplan'
import { bron } from './toeval'
import type { Toeval } from './toeval'
import type { Spoor } from './gegevens/soorten'
import { useSpraak } from './spraak'
import type { Spraak } from './spraak'
import type { Omgeving } from './oefeningen'

export interface Toestand {
  stand: Stand
  wolk: Wolk
  spraak: Spraak
  /** De dag van vandaag, als ISO-datum. */
  dag: string
  /** Het profiel dat aan de beurt is, of niets. */
  profiel: Profiel | null
  /** Het leerpad van dat profiel. Leeg als er niemand gekozen is. */
  pad: Padstap[]
  /** Zit er een kind achter dit profiel? Dan komen er punten en een spel bij. */
  kind: boolean
  /** De omgeving waarin oefeningen gemaakt worden. */
  omgeving: Omgeving
  zet: (verander: (s: Stand) => Stand) => void
  /** Alleen het profiel dat aan de beurt is bijwerken. */
  zetProf: (verander: (p: Profiel) => Profiel) => void
  kies: (id: string) => void
  maak: (naam: string, leeftijd: number, intentie: string, spoor?: Spoor) => Profiel
  gelijktrekken: () => Promise<boolean>
}

/* Een profiel-id moet uniek zijn over toestellen heen — twee telefoons die
   tegelijk een profiel aanmaken mogen elkaar niet overschrijven bij het
   samenvoegen. Vandaar de tijd én toeval. */
const nieuwId = (): string =>
  'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/* Het toeval waarmee afleiders worden gekozen. Eén bron voor de hele app: de
   oefeningen van een blok worden dan in één keer gemaakt en veranderen niet
   halverwege een sessie omdat React iets hertekent. */
const TOEVAL: Toeval = bron(Date.now())

export function useArabisch(): Toestand {
  const [stand, zetRuw] = useState<Stand>(leeg)
  const [dag, zetDag] = useState(vandaag)
  /* Het account heet in de database `lisan`, de oude naam van deze app. Wie dat
     hernoemt, koppelt elk gezin los van zijn eigen voortgang. */
  const wolk = useWolk('lisan')

  const laatste = useRef(stand)
  laatste.current = stand

  const zetEnSchrijf = useCallback((s: Stand, direct = false): void => {
    laatste.current = s
    zetRuw(s)
    schrijf(s)
    wolk.bewaar(s, direct)
  }, [wolk])

  const zet = useCallback((verander: (s: Stand) => Stand): void => {
    zetEnSchrijf(verander(laatste.current))
  }, [zetEnSchrijf])

  const zetProf = useCallback((verander: (p: Profiel) => Profiel): void => {
    const s = laatste.current
    const id = s.actief
    const p = id ? s.profielen[id] : undefined
    if (!id || !p) return
    zetEnSchrijf({ ...s, profielen: { ...s.profielen, [id]: verander(p) } })
  }, [zetEnSchrijf])

  const kies = useCallback((id: string): void => {
    zet((s) => (s.profielen[id] ? { ...s, actief: id } : s))
  }, [zet])

  const maak = useCallback(
    (naam: string, leeftijd: number, intentie: string, spoor?: Spoor): Profiel => {
      const id = nieuwId()
      const p = nieuwProfiel(id, naam, leeftijd, spoorBijLeeftijd(leeftijd), intentie, vandaag())
      /* Een handmatig spoor blijft handmatig: anders rekent de app het bij de
         eerstvolgende verjaardag stilletjes terug. */
      const met = spoor ? { ...p, spoor, spoorHandmatig: true } : p
      zet((s) => ({ ...s, actief: id, profielen: { ...s.profielen, [id]: met } }))
      return met
    }, [zet])

  const gelijktrekken = useCallback(async (): Promise<boolean> => {
    const ver = await wolk.ophalen()
    if (!ver || typeof ver !== 'object') return false
    const binnen = ver as Losse
    /* Een kopie zonder profielen is geen kopie: dan staat er centraal nog
       niets, en samenvoegen zou alleen maar werk kosten. */
    if (!binnen.profielen || !Object.keys(binnen.profielen).length) return false
    zetEnSchrijf(samenvoegen(laatste.current, binnen), true)
    return true
  }, [wolk, zetEnSchrijf])

  const gestart = useRef(false)
  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    const s = lees()
    /* Een actief profiel dat niet meer bestaat wijst nergens naar. */
    zetRuw(s.actief && !s.profielen[s.actief]
      ? { ...s, actief: Object.keys(s.profielen)[0] ?? null }
      : s)
    if (wolk.aan) void gelijktrekken()
  }, [wolk.aan, gelijktrekken])

  /* De dag kan verschieten terwijl de app openstaat. Elke minuut kijken of hij
     gedraaid is; zo ja, dan komt de wachtrij van vandaag vanzelf mee. */
  useEffect(() => {
    const kijk = (): void => zetDag(vandaag())
    const t = setInterval(kijk, 60_000)
    addEventListener('visibilitychange', kijk)
    addEventListener('focus', kijk)
    return () => {
      clearInterval(t)
      removeEventListener('visibilitychange', kijk)
      removeEventListener('focus', kijk)
    }
  }, [])

  /* Bij het afsluiten meteen wegschrijven: de uitgestelde opslag van de wolk
     wacht tweeënhalve seconde, en die haalt een gesloten tabblad niet. */
  useEffect(() => {
    const weg = (): void => { if (wolk.aan) wolk.bewaar(laatste.current, true) }
    addEventListener('pagehide', weg)
    return () => removeEventListener('pagehide', weg)
  }, [wolk])

  const profiel = (stand.actief ? stand.profielen[stand.actief] : null) ?? null
  const pad = useMemo(() => (profiel ? bouwPad(profiel.spoor) : []), [profiel?.spoor])
  const kind = !!profiel && profiel.spoor <= 2
  const spraak = useSpraak(profiel?.voorkeur.geluid ?? true)

  const omgeving: Omgeving = {
    spoor: profiel?.spoor ?? 1,
    vocalisatie: profiel?.voorkeur.vocalisatie ?? 'vol',
    magLuisteren: spraak.beschikbaar,
    toeval: TOEVAL,
  }

  return {
    stand, wolk, spraak, dag, profiel, pad, kind, omgeving,
    zet, zetProf, kies, maak, gelijktrekken,
  }
}
