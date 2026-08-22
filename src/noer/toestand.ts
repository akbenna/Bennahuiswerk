/**
 * DE STAND VAN ISLAM LEREN
 *
 * Deze app is de enige met meer dan één kind erin, dus er zijn twee lagen: de
 * stand van het gezin (profielen, plaats, instellingen) en de voortgang van
 * het profiel dat nu aan de beurt is. `zetProf` werkt op die tweede laag, zodat
 * geen enkel scherm hoeft te weten waar in `data` het staat.
 *
 * De klok komt uit één plek en niet uit `new Date()` verspreid over de app: een
 * telefoon die een nacht in de zak zit, komt de volgende ochtend terug met het
 * scherm van gisteren, en dan klopt "vandaag" niet meer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWolk } from '@/gedeeld/wolk'
import type { Wolk } from '@/gedeeld/wolk'
import { iso, plusDagen } from '@/gedeeld/datum'
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import { leeg, leegProg, lees, samenvoegen, schrijf } from './opslag'
import type { Losse, Profiel, Stand, Voortgang } from './opslag'
import { spoorVan } from './voortgang'
import type { Spoor } from './gegevens/soorten'

export interface Klok {
  vandaag: string
  gisteren: string
  /** Hele dagen sinds 1970; waar de oefenkaarten mee rekenen. */
  dag: number
  /** Het jaar, voor het uitrekenen van de leeftijd. */
  jaar: number
  /** Het uur van de dag als kommagetal. */
  uur: number
  /** Het moment zelf, voor het weekbudget. */
  ms: number
}

function klokNu(): Klok {
  const d = new Date()
  const vandaag = iso(d)
  return {
    vandaag,
    gisteren: plusDagen(vandaag as IsoDatum, -1),
    dag: Math.floor(d.getTime() / 864e5),
    jaar: d.getFullYear(),
    uur: d.getHours() + d.getMinutes() / 60,
    ms: d.getTime(),
  }
}

/** Eén keer per toestel de stem-instellingen terugzetten op wat er thuis is
 *  afgesproken. Het stempel `stemV` zorgt dat het precies één keer gebeurt;
 *  verandert de afspraak later, dan hoogt een nieuwe versie het opnieuw op. */
export const STEM_VERSIE = 1

export function stemHerstel(s: Stand): Stand {
  if ((s.instel.stemV ?? 0) >= STEM_VERSIE) return s
  return {
    ...s,
    instel: {
      ...s.instel,
      alleenEcht: true, arStem: '', arTempo: 0.85, harakat: true,
      tempo: 1, stemV: STEM_VERSIE,
    },
  }
}

export interface Toestand {
  stand: Stand
  wolk: Wolk
  klok: Klok
  /** Het profiel dat nu aan de beurt is, of niets. */
  profiel: Profiel | null
  /** De voortgang van dat profiel; een lege stand als er niemand gekozen is. */
  pr: Voortgang
  spoor: Spoor
  zet: (verander: (s: Stand) => Stand) => void
  /** Alleen de voortgang van het huidige profiel bijwerken. */
  zetProf: (verander: (p: Voortgang) => Voortgang) => void
  gelijktrekken: () => Promise<boolean>
  voegBij: (binnen: Losse) => void
}

export function useNoer(): Toestand {
  const [stand, zetRuw] = useState<Stand>(leeg)
  const [klok, zetKlok] = useState<Klok>(klokNu)
  /* Het account heet in de database `bidaya`, de oude naam van deze app. Wie
     dat hernoemt, koppelt elk gezin los van zijn eigen voortgang. */
  const wolk = useWolk('bidaya')

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

  const zetProf = useCallback((verander: (p: Voortgang) => Voortgang) => {
    zetEnSchrijf(((s: Stand): Stand => {
      const id = s.actief
      if (!id) return s
      return { ...s, data: { ...s.data, [id]: verander(s.data[id] ?? leegProg()) } }
    })(laatste.current))
  }, [zetEnSchrijf])

  const gelijktrekken = useCallback(async (): Promise<boolean> => {
    const ver = await wolk.ophalen()
    if (!ver || typeof ver !== 'object') return false
    const binnen = ver as Losse
    /* Een lege kopie is geen kopie: dan staat er aan de andere kant nog niets. */
    if (!binnen.profielen && !binnen.data) return false
    /* Ook ná het gelijktrekken herstellen: anders komt de oude stand gewoon
       weer terug via de centrale kopie van een ander toestel. */
    const s = stemHerstel(samenvoegen(laatste.current, binnen))
    zetEnSchrijf({ ...s, last: new Date().toISOString() }, true)
    return true
  }, [wolk, zetEnSchrijf])

  const voegBij = useCallback((binnen: Losse) => {
    zetEnSchrijf(samenvoegen(laatste.current, binnen))
  }, [zetEnSchrijf])

  const gestart = useRef(false)
  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    const s = stemHerstel(lees())
    /* Een actief profiel dat niet meer bestaat wijst nergens naar. */
    zetRuw(s.actief && !s.profielen.some((p) => p.id === s.actief)
      ? { ...s, actief: s.profielen[0]?.id ?? null }
      : s)
    if (wolk.aan) void gelijktrekken()
  }, [wolk.aan, gelijktrekken])

  useEffect(() => {
    const kijk = (): void => zetKlok(klokNu())
    addEventListener('visibilitychange', kijk)
    addEventListener('focus', kijk)
    /* Elke minuut: het volgende gebed telt af, en dat moet meelopen. */
    const t = setInterval(kijk, 30_000)
    return () => {
      removeEventListener('visibilitychange', kijk)
      removeEventListener('focus', kijk)
      clearInterval(t)
    }
  }, [])

  const profiel = useMemo(
    () => stand.profielen.find((p) => p.id === stand.actief) ?? null,
    [stand.profielen, stand.actief])
  const pr = (stand.actief ? stand.data[stand.actief] : null) ?? leegProg()
  const spoor = spoorVan(profiel, klok.jaar)

  return { stand, wolk, klok, profiel, pr, spoor, zet, zetProf, gelijktrekken, voegBij }
}
