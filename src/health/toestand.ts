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
import { isSessie, roep } from '@/gedeeld/db/rpc'
import type { Alles, Sessie } from '@/gedeeld/db/rpc'
import { bundelDagen } from './bundel'
import type { Dagenkaart } from './rekenkern'

/* De sleutel houdt de oude naam. Een app hernoemen mag je niet uitloggen:
   wat hier staat is de sessie op dit toestel, en die hoort de naamswijziging
   niet te merken. */
const SLEUTEL_SESSIE = 'kalibratie.sessie'

const LEEG: Alles = {
  profiel: null, dagen: [], regels: [], producten: [],
  recepten: [], metingen: [], labs: [], vragenlijsten: [], training: [], inspanning: [],
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
  /* WAAROM DIT ER APART BIJ STAAT

     Zonder deze vlag kent de app twee toestanden — er is een profiel en er is er
     geen — en niet de derde: ik ben nog aan het ophalen. De sessie komt uit
     localStorage en is er dus meteen, terwijl `alles` nog LEEG is. Het scherm
     concludeerde in die halve seconde dat je nieuw bent en zette de
     opzetpagina neer, die daarna vanzelf weer verdween.

     Lelijk, maar erger dan lelijk: op die pagina staan twee knoppen die een
     profiel zetten en de augustusreeks kunnen inladen. Eén tik in dat raampje
     schreef over je eigen profiel heen. */
  geladen: boolean
  bezig: boolean
  /** De laatste fout, zodat een scherm hem kan tonen in plaats van een alert. */
  fout: string | null
  wisFout: () => void
  aanmelden: (account: string, ww: string, nieuw: boolean) => Promise<void>
  /** Met de eenmalige herstelcode een nieuw wachtwoord zetten. */
  herstellen: (account: string, code: string, nieuw: string) => Promise<void>
  afmelden: () => Promise<void>
  /** Voert een wijziging uit en haalt daarna alles opnieuw op. */
  wijzig: (werk: (token: string) => Promise<unknown>) => Promise<void>
  herlaad: () => Promise<void>
}

export function useKalibratie(): Kalibratie {
  const [sessie, zetSessie] = useState<Sessie | null>(leesSessie)
  const [alles, zetAlles] = useState<Alles>(LEEG)
  const [geladen, zetGeladen] = useState(false)
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)

  const haal = useCallback(async (token: string) => {
    const o = await roep('kal_ophalen', { p_token: token })
    // De server kan velden weglaten; een ontbrekende lijst hoort leeg te zijn
    // en niet undefined, anders valt een scherm om op `.map` van niets.
    zetAlles({ ...LEEG, ...o })
    zetGeladen(true)
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
          zetGeladen(false)
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
      /* Registreren gooit nog wel bij een fout; aanmelden geeft er een terug.
         Waarom die twee verschillen staat bij `Aanmelduitslag` in rpc.ts: de
         rem op het aanmelden houdt een teller bij, en een exception zou de
         vastgelegde poging mee terugdraaien. */
      if (nieuw) {
        const s = await roep('kal_registreren', { p_account: account, p_ww: ww, p_naam: account })
        try { localStorage.setItem(SLEUTEL_SESSIE, JSON.stringify(s)) } catch { /* mag falen */ }
        zetSessie(s)
        return
      }
      const uit = await roep('kal_aanmelden', { p_account: account, p_ww: ww })
      if (!isSessie(uit)) {
        /* Geen token betekent niet aangemeld — ook al kwam het antwoord met een
           200 binnen. Zonder deze regel zou een mislukte aanmelding een lege
           sessie opleveren die er geslaagd uitziet. */
        zetFout(uit.fout)
        return
      }
      try { localStorage.setItem(SLEUTEL_SESSIE, JSON.stringify(uit)) } catch { /* mag falen */ }
      zetSessie(uit)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }, [])

  /* Herstellen is aanmelden met een code in plaats van een wachtwoord, en geeft
     net zo goed een uitslag terug in plaats van te gooien. De teller in de
     database telt beide ingangen bij elkaar op; zou dat niet zo zijn, dan was
     dit een omweg om de rem heen. */
  const herstellen = useCallback(async (account: string, code: string, nieuw: string) => {
    zetBezig(true)
    zetFout(null)
    try {
      const uit = await roep('kal_ww_herstellen',
        { p_account: account, p_code: code, p_nieuw: nieuw })
      if (!isSessie(uit)) { zetFout(uit.fout); return }
      try { localStorage.setItem(SLEUTEL_SESSIE, JSON.stringify(uit)) } catch { /* mag falen */ }
      zetSessie(uit)
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
    zetGeladen(false)
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
    sessie, alles, dagenkaart, geladen, bezig, fout,
    wisFout: useCallback(() => zetFout(null), []),
    aanmelden, herstellen, afmelden, wijzig, herlaad,
  }
}
