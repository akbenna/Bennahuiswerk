/**
 * DE STAND VAN HUISWERK
 *
 * Eén stand voor het gezin, met per kind een voortgang. Twee soorten
 * wegschrijven lopen ernaast: de familiecode (de hele stand) en het
 * kind-account (alleen die ene voortgang). Beide met uitstel, want een kind dat
 * tien sommen achter elkaar goed heeft zou anders tien keer een volledige
 * opslag versturen terwijl alleen de laatste telt.
 *
 * De klok komt uit één plek. Een tablet die 's avonds wordt neergelegd en 's
 * ochtends weer opgepakt staat anders nog op de dag van gisteren, en dan telt
 * de dagreeks niet door.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PROFIELEN } from './gegevens/profielen'
import { SEED } from './gegevens/seed'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { naarDitJaar } from './gegevens/schooljaar'
import { sjablonen } from './gegevens/sjablonen'
import type { Kaart } from './gegevens/soorten'
import { ECHT } from './toeval'
import { dagKort, gisterKort } from './datum'
import { lees, schoonVoortgang, schrijf } from './opslag'
import type { Stand, Voortgang } from './opslag'
import { familieBewaren, familieOphalen, kindBewaren, kindOphalen } from './wolk'
import { toernooiRonde } from './toernooi'
import { raakDag } from './uitslag'

/** Hoe lang er gewacht wordt voordat er echt weggeschreven wordt. */
const WACHT_MS = 1500

export const KINDEREN = Object.keys(PROFIELEN)

/** Alle opgaven: de vaste voorraad, de sjablonen en wat de ouder erbij zette.
 *  De sjablonen worden één keer gebouwd — opnieuw bouwen zou elke hertekening
 *  nieuwe getallen geven midden in een som. */
const SJABLONEN = sjablonen(ECHT)

export interface Toestand {
  stand: Stand
  /** De dag van vandaag, zoals hij in de opslag staat. */
  dag: string
  gisteren: string
  /** Alle opgaven waaruit gekozen kan worden. */
  alle: Kaart[]
  /** Een korte melding voor het ouderscherm. */
  wolkmelding: string
  zetWolkmelding: (t: string) => void
  zet: (verander: (s: Stand) => Stand) => void
  /** Alleen de voortgang van één kind bijwerken, en die daarna naar zijn eigen
   *  account sturen. */
  zetKind: (pid: string, verander: (p: Voortgang) => Voortgang) => void
  /** Het profiel openen: de dagreeks bijwerken en de dagteller op nul. */
  openKind: (pid: string) => void
  /** Alle kind-accounts stil bijwerken, zodat het scorebord overal gelijk is. */
  haalKinderen: () => Promise<void>
}

export function useHuiswerk(): Toestand {
  const [stand, zetRuw] = useState<Stand>(() => lees(KINDEREN))
  const [dag, zetDag] = useState(() => dagKort(new Date()))
  const [wolkmelding, zetWolkmelding] = useState('')

  const laatste = useRef(stand)
  laatste.current = stand
  const familieTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kindTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const bewaarStraks = useCallback((s: Stand): void => {
    if (!s.cloud?.household || !s.cloud.pin) return
    if (familieTimer.current) clearTimeout(familieTimer.current)
    familieTimer.current = setTimeout(() => {
      void familieBewaren(laatste.current)
        .then((t) => { if (t) zetWolkmelding('Opgeslagen in de cloud ✓') })
        .catch(() => zetWolkmelding('Cloud niet bereikbaar (lokaal bewaard)'))
    }, WACHT_MS)
  }, [])

  const zet = useCallback((verander: (s: Stand) => Stand): void => {
    const s = verander(laatste.current)
    laatste.current = s
    zetRuw(s)
    schrijf(s)
    bewaarStraks(s)
  }, [bewaarStraks])

  const duwKind = useCallback((pid: string): void => {
    const t = kindTimers.current[pid]
    if (t) clearTimeout(t)
    kindTimers.current[pid] = setTimeout(() => {
      void kindBewaren(laatste.current, pid).then((samen) => {
        if (samen) zet((s) => ({ ...s, prog: { ...s.prog, [pid]: samen } }))
      })
    }, WACHT_MS)
  }, [zet])

  const zetKind = useCallback((pid: string, verander: (p: Voortgang) => Voortgang): void => {
    zet((s) => ({
      ...s,
      prog: { ...s.prog, [pid]: verander(schoonVoortgang(s.prog[pid])) },
    }))
    duwKind(pid)
  }, [zet, duwKind])

  const openKind = useCallback((pid: string): void => {
    const nu = new Date()
    zet((s) => ({
      ...s,
      prog: {
        ...s.prog,
        [pid]: raakDag(schoonVoortgang(s.prog[pid]), dagKort(nu), gisterKort(nu)),
      },
    }))
  }, [zet])

  const haalKinderen = useCallback(async (): Promise<void> => {
    for (const pid of KINDEREN) {
      const samen = await kindOphalen(laatste.current, pid)
      if (samen) zet((s) => ({ ...s, prog: { ...s.prog, [pid]: samen } }))
    }
  }, [zet])

  /* Bij het openen één keer: het toernooi afrekenen, de kind-accounts ophalen,
     en als er een familiecode is ook de hele stand. Alle drie stil — als er
     geen verbinding is werkt de app gewoon door. */
  const gestart = useRef(false)
  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    zet((s) => toernooiRonde(s, KINDEREN, Date.now()).stand)
    void haalKinderen()
    void familieOphalen(laatste.current, KINDEREN).then((samen) => {
      if (!samen) return
      zet(() => samen)
      zetWolkmelding('Samengevoegd met de cloud ✓')
    }).catch(() => { /* stil: de app werkt ook zonder */ })
  }, [zet, haalKinderen])

  /* De dag kan verschieten terwijl de app openstaat. */
  useEffect(() => {
    const kijk = (): void => zetDag(dagKort(new Date()))
    const t = setInterval(kijk, 60_000)
    addEventListener('visibilitychange', kijk)
    addEventListener('focus', kijk)
    return () => {
      clearInterval(t)
      removeEventListener('visibilitychange', kijk)
      removeEventListener('focus', kijk)
    }
  }, [])

  /* De hele voorraad, en daarna één keer door `naarDitJaar`: de opgaven dragen
     hun leerjaar ten opzichte van het oude niveau, en wie is overgegaan leest
     dat anders. Zie `gegevens/schooljaar.ts`. */
  const alle = useMemo<Kaart[]>(
    () => naarDitJaar([...SEED, ...NIEUW2627, ...SJABLONEN,
      ...(stand.custom as unknown as Kaart[])]),
    [stand.custom])

  return {
    stand, dag, gisteren: gisterKort(new Date()), alle,
    wolkmelding, zetWolkmelding, zet, zetKind, openKind, haalKinderen,
  }
}
