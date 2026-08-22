/**
 * DE WOLK — aanmelden en bewaren, voor de apps die dat delen
 *
 * Zes apps — Islam leren, Arabisch, Computers & Code, Spelletjes,
 * Geloofsstudie en Koran uit je hoofd — hadden hier elk hun eigen kopie van:
 * dezelfde vier databasefuncties, dezelfde sleutel in localStorage, dezelfde
 * uitgestelde opslag van 2.500 ms, zesmaal overgetypt. Verbetering aan één
 * ervan bereikte de andere vijf niet, en dat is precies hoe die kopieën uit
 * elkaar gaan lopen.
 *
 * Wat elke app wél zelf houdt, is de vórm van wat er bewaard wordt. Die staat
 * hier bewust als `unknown` in en niet als een gedeeld formaat: een leerlijn
 * Arabisch en een lijst spelrecords hebben niets met elkaar te maken, en zodra
 * je die vorm gaat delen moeten zes apps tegelijk mee met elke wijziging.
 *
 * DE UITGESTELDE OPSLAG
 *
 * `bewaar()` wacht standaard tweeënhalve seconde. Dat is geen zuinigheid met
 * verzoeken maar met de reeks: een kind dat tien sommen achter elkaar goed
 * heeft, zou anders tien keer een volledige opslag versturen terwijl alleen de
 * laatste telt. Bij afsluiten of uitloggen ga je met `direct` erlangs.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { hub } from './db/bennahub'

/** Hoe lang `bewaar()` wacht voordat hij echt verstuurt. */
const WACHT_MS = 2500

interface Bewaard {
  acc: string
  pin: string
}

/** Wat de database bij het inloggen teruggeeft. */
interface Lading {
  data?: unknown
  error?: unknown
}

const sleutelVan = (app: string): string => 'bennahub.acc.' + app

function leesSessie(app: string): Bewaard | null {
  try {
    const s = JSON.parse(localStorage.getItem(sleutelVan(app)) ?? 'null') as Bewaard | null
    return s?.acc && s.pin ? s : null
  } catch {
    return null
  }
}

export interface Wolk {
  /** Is er iemand aangemeld? */
  aan: boolean
  account: string | null
  /** Loopt er op dit moment een verzoek? */
  bezig: boolean
  /** De laatste fout, of niets. */
  fout: string | null
  /** De accountnamen die deze app kent. Geeft een lege lijst bij problemen —
   *  je moet je kunnen aanmelden ook als de lijst niet opkomt. */
  accounts: () => Promise<string[]>
  registreren: (account: string, wachtwoord: string, beginData?: unknown) => Promise<void>
  /** Meldt aan en geeft meteen terug wat er bewaard stond. */
  inloggen: (account: string, wachtwoord: string) => Promise<unknown>
  uitloggen: () => void
  /** Haalt opnieuw op; `null` als het niet lukte. */
  ophalen: () => Promise<unknown>
  /** Bewaart, standaard na tweeënhalve seconde stilte. */
  bewaar: (data: unknown, direct?: boolean) => void
}

export function useWolk(app: string): Wolk {
  const bestaand = useRef<Bewaard | null>(null)
  if (bestaand.current === null) bestaand.current = leesSessie(app)

  const [sessie, zetSessie] = useState<Bewaard | null>(bestaand.current)
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)

  /* De timer én de laatst aangeboden gegevens buiten de hertekening houden:
     een opslag die halverwege door een hertekening wordt afgekapt verliest
     precies de wijziging die hem aanriep. */
  const wacht = useRef<ReturnType<typeof setTimeout> | null>(null)
  const laatste = useRef<unknown>(null)
  const nu = useRef<Bewaard | null>(sessie)
  nu.current = sessie

  const onthoud = useCallback((s: Bewaard | null) => {
    try {
      if (s) localStorage.setItem(sleutelVan(app), JSON.stringify(s))
      else localStorage.removeItem(sleutelVan(app))
    } catch { /* een browser die opslag weigert mag de app niet stukmaken */ }
    zetSessie(s)
  }, [app])

  const versturen = useCallback(async (data: unknown) => {
    const s = nu.current
    if (!s) return
    zetBezig(true)
    try {
      await hub('bennahub_save',
        { p_app: app, p_account: s.acc, p_pin: s.pin, p_data: data })
      zetFout(null)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }, [app])

  /* Wat nog in de wachtkamer staat mag niet verdwijnen als de app sluit. */
  useEffect(() => () => {
    if (wacht.current) {
      clearTimeout(wacht.current)
      void versturen(laatste.current)
    }
  }, [versturen])

  return {
    aan: sessie != null,
    account: sessie?.acc ?? null,
    bezig,
    fout,

    accounts: useCallback(async () => {
      try {
        const uit = await hub('bennahub_accounts', { p_app: app })
        return Array.isArray(uit) ? uit.filter((x): x is string => typeof x === 'string') : []
      } catch {
        return []
      }
    }, [app]),

    registreren: useCallback(async (account, wachtwoord, beginData) => {
      await hub('bennahub_register',
        { p_app: app, p_account: account, p_pin: wachtwoord, p_data: beginData ?? {} })
      zetFout(null)
      onthoud({ acc: account, pin: wachtwoord })
    }, [app, onthoud]),

    inloggen: useCallback(async (account, wachtwoord) => {
      const r = (await hub('bennahub_load',
        { p_app: app, p_account: account, p_pin: wachtwoord })) as Lading | null
      zetFout(null)
      onthoud({ acc: account, pin: wachtwoord })
      return r?.data ?? {}
    }, [app, onthoud]),

    uitloggen: useCallback(() => {
      if (wacht.current) {
        clearTimeout(wacht.current)
        wacht.current = null
        void versturen(laatste.current)
      }
      onthoud(null)
    }, [onthoud, versturen]),

    ophalen: useCallback(async () => {
      const s = nu.current
      if (!s) return null
      zetBezig(true)
      try {
        const r = (await hub('bennahub_load',
          { p_app: app, p_account: s.acc, p_pin: s.pin })) as Lading | null
        zetFout(null)
        return r?.data ?? {}
      } catch (e) {
        zetFout(e instanceof Error ? e.message : String(e))
        return null
      } finally {
        zetBezig(false)
      }
    }, [app]),

    bewaar: useCallback((data, direct = false) => {
      if (!nu.current) return
      laatste.current = data
      if (wacht.current) clearTimeout(wacht.current)
      if (direct) {
        wacht.current = null
        void versturen(data)
        return
      }
      wacht.current = setTimeout(() => {
        wacht.current = null
        void versturen(data)
      }, WACHT_MS)
    }, [versturen]),
  }
}
