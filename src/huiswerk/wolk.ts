/**
 * DE CENTRALE OPSLAG VAN HUISWERK
 *
 * Twee lagen naast elkaar, en dat is met opzet.
 *
 * De **familiecode** bewaart de hele stand: alle kinderen, de opgaven die de
 * ouder erbij heeft gezet, de instellingen. Dat is de back-up van het gezin.
 *
 * Het **kind-account** bewaart alleen de voortgang van dat ene kind. Daardoor
 * volgen de scores het kind en niet het toestel: wie op de telefoon van zijn
 * broer oefent, ziet zijn eigen punten. De accountcode is afgeleid van de naam
 * (`bennaclan-selma`), zodat hij op elk toestel hetzelfde is zonder dat een
 * kind van acht iets hoeft te onthouden.
 *
 * Wegschrijven gaat nooit blind. Er wordt eerst opgehaald en samengevoegd, en
 * pas dan teruggeschreven — een toestel dat een dag offline was mag de
 * centrale stand niet verlagen.
 */
import { hub } from '@/gedeeld/db/bennahub'
import type { Stand, Voortgang } from './opslag'
import { schoonVoortgang, voegSamen, voegVoortgangSamen, zonderCloud } from './opslag'

/** Het standaardwachtwoord waarmee elk kind begint. */
export const STANDAARD_WACHTWOORD = 'Bennaclan'

/** De familie waar de accountcodes onder vallen. */
const FAMILIE = 'bennaclan'

export const kindWachtwoord = (s: Stand, pid: string): string =>
  s.kidpw?.[pid] || STANDAARD_WACHTWOORD

export const wachtwoordGelijk = (a: string, b: string): boolean =>
  String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()

export interface Account { code: string; pw: string }

export function accountVan(s: Stand, pid: string): Account {
  const a = s.kidacc?.[pid]
  return a?.code ? a : { code: FAMILIE + '-' + pid, pw: STANDAARD_WACHTWOORD }
}

interface Lading { data?: unknown; updated_at?: string }

const laad = async (code: string, pin: string): Promise<Lading> =>
  (await hub('oefenapp_load', { p_household: code, p_pin: pin })) as Lading

const bewaar = async (code: string, pin: string, data: unknown): Promise<Lading> =>
  (await hub('oefenapp_save', { p_household: code, p_pin: pin, p_data: data })) as Lading

const maakAan = async (code: string, pin: string, data: unknown): Promise<Lading> =>
  (await hub('oefenapp_register', { p_household: code, p_pin: pin, p_data: data })) as Lading

/* ------------------------------------------------------- de familiecode */

export async function familieAanmaken(
  code: string, pin: string, s: Stand,
): Promise<void> {
  await maakAan(code, pin, zonderCloud(s))
}

/** Inloggen: ophalen, samenvoegen, en de samengevoegde stand terugschrijven. */
export async function familieInloggen(
  code: string, pin: string, hier: Stand, kinderen: string[],
): Promise<Stand> {
  const r = await laad(code, pin)
  const samen = voegSamen(hier, (r.data ?? {}) as Partial<Stand>)
  samen.cloud = { household: code, pin, lastServer: null, lastSync: Date.now() }
  for (const pid of kinderen) samen.prog[pid] = schoonVoortgang(samen.prog[pid])
  await bewaar(code, pin, zonderCloud(samen))
  return samen
}

/** De hele stand wegschrijven. Geeft terug wanneer de server hem kreeg. */
export async function familieBewaren(s: Stand): Promise<number> {
  const c = s.cloud
  if (!c?.household || !c.pin) return 0
  await bewaar(c.household, c.pin, zonderCloud(s))
  return Date.now()
}

/** Ophalen en samenvoegen zonder in te loggen — voor het stille bijwerken bij
 *  het openen van de app. Geeft niets terug als er niets te halen viel. */
export async function familieOphalen(s: Stand, kinderen: string[]): Promise<Stand | null> {
  const c = s.cloud
  if (!c?.household || !c.pin) return null
  const r = await laad(c.household, c.pin)
  if (!r?.data) return null
  const samen = voegSamen(s, r.data as Partial<Stand>)
  samen.cloud = { ...c, lastServer: null, lastSync: Date.now() }
  for (const pid of kinderen) samen.prog[pid] = schoonVoortgang(samen.prog[pid])
  return samen
}

/* ------------------------------------------------------ het kind-account */

/**
 * De voortgang van één kind veilig wegschrijven: eerst ophalen, samenvoegen,
 * dan terug. Zo kan een toestel de centrale stand nooit verlagen. Geeft de
 * samengevoegde voortgang terug, of niets als het account nog niet bestond en
 * zojuist met de lokale stand is aangemaakt.
 */
export async function kindBewaren(
  s: Stand, pid: string,
): Promise<Voortgang | null> {
  const acc = accountVan(s, pid)
  const hier = schoonVoortgang(s.prog[pid])
  try {
    const r = await laad(acc.code, acc.pw)
    const samen = voegVoortgangSamen(hier, ((r.data as { prog?: Voortgang })?.prog) ?? {})
    await bewaar(acc.code, acc.pw, { prog: samen })
    return samen
  } catch {
    /* Het account bestaat waarschijnlijk nog niet. Aanmaken met wat hier staat;
       lukt dat ook niet, dan blijft de voortgang gewoon op dit toestel. */
    try {
      await maakAan(acc.code, acc.pw, { prog: hier })
    } catch { /* geen verbinding — lokaal is genoeg */ }
    return null
  }
}

/** De voortgang van één kind ophalen en samenvoegen. Niets terug betekent:
 *  er viel niets te halen. */
export async function kindOphalen(s: Stand, pid: string): Promise<Voortgang | null> {
  const acc = accountVan(s, pid)
  try {
    const r = await laad(acc.code, acc.pw)
    const ginds = (r.data as { prog?: Voortgang })?.prog
    if (!ginds) return null
    return voegVoortgangSamen(s.prog[pid], ginds)
  } catch {
    return null
  }
}

/**
 * Een kind aanmelden met naam en wachtwoord. Bestaat het account nog niet, dan
 * wordt het aangemaakt met de stand die hier staat — een kind dat voor het
 * eerst inlogt hoort zijn punten niet kwijt te raken. Gooit alleen bij een
 * echt verkeerd wachtwoord of geen verbinding.
 */
export async function kindAanmelden(
  s: Stand, pid: string, code: string, pw: string,
): Promise<Voortgang> {
  const c = String(code ?? '').trim().toLowerCase()
  const hier = schoonVoortgang(s.prog[pid])
  let r: Lading
  try {
    r = await laad(c, pw)
  } catch (e) {
    try {
      await maakAan(c, pw, { prog: hier })
      return hier
    } catch {
      throw e
    }
  }
  const samen = voegVoortgangSamen(hier, ((r.data as { prog?: Voortgang })?.prog) ?? {})
  try {
    await bewaar(c, pw, { prog: samen })
  } catch { /* het samenvoegen is gelukt; terugschrijven kan wachten */ }
  return samen
}
