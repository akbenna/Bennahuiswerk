/**
 * DE TOESTAND
 *
 * De oude app hield alles in één globale `S` en riep na elke wijziging
 * `laden()` en daarna `teken()` aan, waarna het hele scherm opnieuw werd
 * opgebouwd. Dat werkte, maar het had één hardnekkig gevolg: elk invoerveld
 * verloor zijn inhoud en zijn cursor zodra er ergens iets veranderde. Daarom
 * staat in de oude code overal `onchange` en nergens `oninput`, en daarom moest
 * de portiekeuze een veld met de hand uitlezen voordat er hertekend werd.
 *
 * Hier is de toestand één hook. React vervangt alleen wat er echt verandert,
 * dus dat probleem bestaat niet meer.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DatabaseFout } from '@/gedeeld/db/verbinding'
import { roep } from '@/gedeeld/db/rpc'
import type { Alles, Sessie } from '@/gedeeld/db/rpc'
import { bundelDagen } from './bundel'
import type { Dagenkaart } from './rekenkern'

/* De sleutel houdt de oude naam. Een app hernoemen mag je niet uitloggen:
   wat hier staat is de sessie op dit toestel, en die hoort de naamswijziging
   niet te merken. */
const SLEUTEL_SESSIE = 'kalibratie.sessie'

const LEEG: Alles = {
  profiel: null, dagen: [], regels: [], producten: [],
  recepten: [], metingen: [], labs: [], vragenlijsten: [], training: [],
}

function leesSessie(): Sessie | null {
  try {
    const s = JSON.parse(localStorage.getItem(SLEUTEL_SESSIE) ?? 'null') as Sessie | null
    return s?.token ? s : null
  } catch {
    return null
  }
}

export interface Kalibratie {
  sessie: Sessie | null
  alles: Alles
  dagenkaart: Dagenkaart
  bezig: boolean
  /** De laatste fout, zodat een scherm hem kan tonen in plaats van een alert. */
  fout: string | null
  wisFout: () => void
  aanmelden: (account: string, ww: string, nieuw: boolean) => Promise<void>
  afmelden: () => Promise<void>
  /** Voert een wijziging uit en haalt daarna alles opnieuw op. */
  wijzig: (werk: (token: string) => Promise<unknown>) => Promise<void>
  herlaad: () => Promise<void>
}

export function useKalibratie(): Kalibratie {
  const [sessie, zetSessie] = useState<Sessie | null>(leesSessie)
  const [alles, zetAlles] = useState<Alles>(LEEG)
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)

  const haal = useCallback(async (token: string) => {
    const o = await roep('kal_ophalen', { p_token: token })
    // De server kan velden weglaten; een ontbrekende lijst hoort leeg te zijn
    // en niet undefined, anders valt een scherm om op `.map` van niets.
    zetAlles({ ...LEEG, ...o })
  }, [])

  useEffect(() => {
    if (!sessie) return
    let afgebroken = false
    void (async () => {
      try {
        await haal(sessie.token)
      } catch (e) {
        if (afgebroken) return
        // Een verlopen token is geen storing maar een afmelding.
        if (e instanceof DatabaseFout && e.status >= 400 && e.status < 500) {
          localStorage.removeItem(SLEUTEL_SESSIE)
          zetSessie(null)
        } else {
          zetFout(e instanceof Error ? e.message : String(e))
        }
      }
    })()
    return () => { afgebroken = true }
  }, [sessie, haal])

  const aanmelden = useCallback(async (account: string, ww: string, nieuw: boolean) => {
    zetBezig(true)
    zetFout(null)
    try {
      const s = nieuw
        ? await roep('kal_registreren', { p_account: account, p_ww: ww, p_naam: account })
        : await roep('kal_aanmelden', { p_account: account, p_ww: ww })
      try { localStorage.setItem(SLEUTEL_SESSIE, JSON.stringify(s)) } catch { /* mag falen */ }
      zetSessie(s)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }, [])

  const afmelden = useCallback(async () => {
    const t = sessie?.token
    zetSessie(null)
    zetAlles(LEEG)
    try { localStorage.removeItem(SLEUTEL_SESSIE) } catch { /* mag falen */ }
    // De server op de hoogte stellen mag mislukken: lokaal ben je al weg.
    if (t) { try { await roep('kal_afmelden', { p_token: t }) } catch { /* stil */ } }
  }, [sessie])

  const wijzig = useCallback(async (werk: (token: string) => Promise<unknown>) => {
    if (!sessie || bezig) return
    zetBezig(true)
    zetFout(null)
    try {
      await werk(sessie.token)
      await haal(sessie.token)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }, [sessie, bezig, haal])

  const herlaad = useCallback(async () => {
    if (!sessie) return
    try { await haal(sessie.token) } catch { /* de eerstvolgende wijziging probeert het opnieuw */ }
  }, [sessie, haal])

  const dagenkaart = useMemo(
    () => bundelDagen(alles.dagen, alles.regels),
    [alles.dagen, alles.regels],
  )

  return {
    sessie, alles, dagenkaart, bezig, fout,
    wisFout: useCallback(() => zetFout(null), []),
    aanmelden, afmelden, wijzig, herlaad,
  }
}
