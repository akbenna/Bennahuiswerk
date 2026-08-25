/**
 * WAT ER OP DIT TOESTEL AL GEDAAN IS
 *
 * De kaarten op de startpagina zeiden tot nu toe alleen wát een app is. Waar je
 * gebleven bent stond erachter, in de app zelf, en dat is precies het getal
 * waarvoor je hem opent.
 *
 * De negen apps wonen alle op dezelfde herkomst — /noer/, /rasikh/, /huiswerk/ —
 * en delen daarmee één localStorage. De stand van elke app is hier dus gewoon te
 * lezen, zonder netwerk en zonder ouderwachtwoord. Uitlezen doen de uitlezers
 * die er voor het ouderoverzicht al waren; hier komt alleen bij welke sleutel
 * bij welke app hoort en welke regel van jou is.
 *
 * DRIE DINGEN DIE HIER NIET GEBEUREN
 *
 * Er wordt niets geschreven. Dit bestand leest, en als het niet lukt geeft het
 * niets terug — een kaart zonder cijfers is een kaart zoals hij eerst was, en
 * dat is geen storing.
 *
 * Er wordt niets geraden. Staat er nergens een getal dat boven nul uitkomt, dan
 * is er nog niets gedaan en zeggen we niets, in plaats van een rij nullen die
 * eruitziet als voortgang.
 *
 * En er wordt niets van iemand anders getoond zonder erbij te zeggen van wie
 * het is. Een kind ziet zijn eigen regel; wat er niet op zijn naam staat blijft
 * weg. Een ouder ziet wie er het laatst bezig was, mét die naam erbij — die
 * heeft het ouderoverzicht toch al, en een getal zonder naam zou hij voor het
 * zijne aanzien.
 */
import { UITLEZERS } from './uitlezers'
import type { Cel, Regel } from './uitlezers'
import type { Ik } from './sessie'
import type { AppTegel } from './apps'

/** Waar elke app zijn stand neerzet. BennaHealth staat er niet bij: die bewaart
 *  alles centraal achter een eigen aanmelding en laat hier niets achter. */
const SLEUTELS: Readonly<Record<string, readonly string[]>> = {
  huiswerk: ['oefenapp_v1'],
  bidaya: ['bidaya.v1'],
  lisan: ['lisan.v1'],
  bunyan: ['bunyan.v1'],
  raha: ['raha.v1'],
  sanad: ['sanad.v2'],
  rasikh: ['rasikh.v1'],
  /* Drie cursussen, drie sleutels; ze komen als `delen` binnen bij de uitlezer. */
  academie: ['kompas_v1', 'verbind_v2', 'podium_v1'],
}

export interface Voortgang {
  cellen: readonly Cel[]
  /** De dag waarop er voor het laatst iets gebeurde, of niets. */
  laatst: string | null
  /** Van wie deze cijfers zijn, als dat iemand anders is dan wie er kijkt. */
  wie: string | null
}

const leesSleutel = (sleutel: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(sleutel) ?? 'null')
  } catch {
    return null
  }
}

/** De opslag van één app, in de vorm die zijn uitlezer verwacht. */
function lokaal(app: string): unknown {
  const sleutels = SLEUTELS[app]
  if (!sleutels?.length) return null
  if (sleutels.length === 1) return leesSleutel(sleutels[0] as string)
  const delen = sleutels.map(leesSleutel).filter((d) => d != null)
  return delen.length ? { delen } : null
}

/** Zegt deze cel iets, of staat er alleen een nul of een streepje? */
const zinvol = ([, waarde]: Cel): boolean =>
  waarde !== '—' && waarde !== 0 && waarde !== '' && waarde !== '0'

/** Hoort deze regel bij niemand in het bijzonder? Spelletjes en de Academie
 *  bewaren geen profielen, dus wat daar staat is van het hele gezin. */
const vanIedereen = (r: Regel): boolean => r.wie.toLowerCase() === 'iedereen'

/** De laatste van een stel regels; `laatst` is een datum als tekst, dus groter
 *  is later. Regels zonder datum verliezen het altijd. */
const meestRecent = (regels: Regel[]): Regel | undefined =>
  regels.reduce<Regel | undefined>(
    (beste, r) => (!beste || (r.laatst ?? '') > (beste.laatst ?? '') ? r : beste), undefined)

/** De regel die bij deze persoon hoort, of niets. */
function mijnRegel(regels: Regel[], ik: Ik): Regel | null {
  if (!regels.length) return null
  const naam = ik.naam.toLowerCase()
  const eigen = regels.find((r) => r.wie.toLowerCase() === naam)
  if (eigen) return eigen
  const iedereen = regels.find(vanIedereen)
  if (iedereen) return iedereen
  /* Een ouder krijgt de regel van wie er het laatst bezig was. Dat is bij apps
     met één gebruiker die ene — Amine bij het coderen, papa bij de Koran — en
     bij het huiswerk het kind dat er als laatste zat. De naam gaat mee, want
     zonder naam leest het als je eigen voortgang. */
  return ik.rol === 'ouder' ? (meestRecent(regels) ?? null) : null
}

/** De voortgang van één app, of niets als er niets te melden valt. */
export function voortgangVan(app: string, ik: Ik): Voortgang | null {
  const lees = UITLEZERS[app]
  const opslag = lokaal(app)
  if (!lees || opslag == null) return null
  let regels: Regel[]
  try {
    regels = lees(opslag)
  } catch {
    /* Een app die zijn vorm wijzigt mag de startpagina niet omgooien. */
    return null
  }
  const r = mijnRegel(regels, ik)
  if (!r || !r.regels.some(zinvol)) return null
  const eigen = r.wie.toLowerCase() === ik.naam.toLowerCase() || vanIedereen(r)
  return { cellen: r.regels, laatst: r.laatst, wie: eigen ? null : r.wie }
}

/** Alles in één keer, zodat de opslag één keer per hertekening gelezen wordt. */
export function voortgangAlles(
  lijst: readonly AppTegel[], ik: Ik | null,
): ReadonlyMap<string, Voortgang> {
  const uit = new Map<string, Voortgang>()
  if (!ik) return uit
  for (const app of lijst) {
    const v = voortgangVan(app.id, ik)
    if (v) uit.set(app.id, v)
  }
  return uit
}
