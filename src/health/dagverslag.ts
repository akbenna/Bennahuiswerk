/**
 * HET DAGVERSLAG — één keer vertellen, één keer goedkeuren
 *
 * Het invoervel logt per moment: je tikt een vak aan, zoekt, kiest een portie.
 * Dat werkt, en op een dag dat je er geen zin in hebt werkt het niet, want dan
 * doe je het gewoon niet. Wat dan overblijft is een gat in de reeks, en een gat
 * is erger dan een ruwe schatting: het model achter deze app leest een dag
 * zonder regels niet als "onbekend" maar telt hem mee als een dag waarop er
 * weinig gegeten is.
 *
 * Dus deze weg: je vertelt je dag in één keer — ingesproken met de microfoon
 * van je eigen toetsenbord, of getypt — en de herkenning verdeelt hem over de
 * vier momenten. Jij kijkt na en keurt in één keer goed.
 *
 * WAT HIER STAAT EN WAT NIET
 *
 * Hier staat het verdelen, het verschuiven en het optellen: alles wat van de
 * herkenning naar een lijst regels gaat. Wat er niet staat is het praten met de
 * herkenning (`ai.ts`) en het scherm (`vensters/Dagverslag.tsx`). Die scheiding
 * is niet netheid maar toetsbaarheid: het verdelen is precies het stuk dat stil
 * kan omvallen, en dat hoort een proef te hebben die niet door een browser
 * heen hoeft.
 *
 * DE REGEL DIE ALLES DRAAGT
 *
 * Een regel zonder moment wordt niet opgeslagen. Niet in 'tussendoor' gedumpt,
 * niet op goed geluk bij het diner gezet — hij blijft staan tot jij hem
 * aanwijst. Dat lijkt streng en het is de hele reden dat dit vel te vertrouwen
 * is: de herkenning mag raden, maar een gok die er net zo uitziet als een
 * zekerheid is precies wat je niet wilt in iets wat je in één tik goedkeurt.
 * `naarRegels` laat ze daarom vallen, en het scherm telt ze apart zodat je ziet
 * hoeveel er nog op je wachten.
 */
import type { HerkendeRegel } from './ai'
import type { NieuweRegel } from '@/gedeeld/db/rpc'
import type { IsoDatum, Moment } from '@/gedeeld/db/tabellen'

/** De vier vakken in de volgorde van de dag. Zonder 'onbekend': dat is geen
 *  moment van de dag maar het ontbreken ervan, en het krijgt een eigen plek. */
export const DAGDELEN: readonly Moment[] = ['ontbijt', 'lunch', 'diner', 'tussendoor']

/**
 * Een herkende regel met een plek in het vel.
 *
 * `sleutel` is de volgorde waarin de herkenning hem noemde, en verandert niet
 * meer. Dat is wat een regel identificeert terwijl je hem verschuift of
 * weglaat; de naam kan niet dienen, want twee kopjes koffie op één dag zijn
 * twee regels met dezelfde naam.
 */
export interface Keuze {
  sleutel: number
  regel: HerkendeRegel
  /** Waar hij nu staat. 'onbekend' betekent: nog niet geplaatst. */
  moment: Moment
}

export interface Vak {
  moment: Moment
  keuzes: Keuze[]
}

export interface Optelling {
  kcal: number
  laag: number
  hoog: number
  eiwit: number
}

/**
 * Van de herkenning naar keuzes.
 *
 * Het moment dat het model noemt wordt overgenomen, en anders wordt het
 * 'onbekend'. Hier wint het model dus wél — anders dan in het invoervel, waar
 * het moment van het vel voorgaat. Dat is geen inconsequentie maar hetzelfde
 * principe: het vel weet het daar beter omdat jij het net hebt aangetikt, en
 * hier heb je niets aangetikt. Het verslag is het enige dat het weet.
 */
export function beginKeuzes(regels: readonly HerkendeRegel[]): Keuze[] {
  return regels.map((regel, sleutel) => ({
    sleutel,
    regel,
    moment: GELDIG.has(regel.moment) ? (regel.moment as Moment) : 'onbekend',
  }))
}

const GELDIG = new Set<string>(DAGDELEN)

/**
 * De vakken, in de volgorde waarin het vel ze toont.
 *
 * 'onbekend' komt vooraan wanneer er iets in staat, en verdwijnt zodra het leeg
 * is. Vooraan omdat het het enige is waar nog iets van je gevraagd wordt; de
 * vier gevulde vakken eronder hoef je alleen te lezen. Een leeg dagdeel wordt
 * helemaal niet getoond: een vel met vier koppen waarvan er twee niets onder
 * zich hebben laat je zoeken naar wat er wél staat.
 */
export function vakken(keuzes: readonly Keuze[]): Vak[] {
  const uit: Vak[] = []
  const los = keuzes.filter((k) => k.moment === 'onbekend')
  if (los.length) uit.push({ moment: 'onbekend', keuzes: los })
  for (const m of DAGDELEN) {
    const eigen = keuzes.filter((k) => k.moment === m)
    if (eigen.length) uit.push({ moment: m, keuzes: eigen })
  }
  return uit
}

/** Een regel naar een ander vak. Onbekende sleutels raken niets aan. */
export function verplaats(keuzes: readonly Keuze[], sleutel: number, moment: Moment): Keuze[] {
  return keuzes.map((k) => (k.sleutel === sleutel ? { ...k, moment } : k))
}

/** Een regel weg. Wat er niet in zat heb je niet gegeten. */
export function weglaten(keuzes: readonly Keuze[], sleutel: number): Keuze[] {
  return keuzes.filter((k) => k.sleutel !== sleutel)
}

/**
 * Optellen, met de band mee.
 *
 * Niet alleen het punt: de ondergrens en de bovengrens tellen op tot de
 * ondergrens en de bovengrens van het geheel. Dat is de stelregel van deze app
 * op de plek waar hij het makkelijkst sneuvelt — een totaal is precies het
 * getal waarvan je denkt dat het wel exact zal zijn.
 *
 * Dit is optellen en geen foutenvoortplanting: de grenzen worden bij elkaar
 * opgeteld en niet in kwadratuur. Dat geeft een bredere band dan statistisch
 * nodig, en dat is hier de goede kant om fout te zitten — de porties van één
 * dag zijn niet onafhankelijk (wie royaal opschept doet dat de hele dag), dus
 * de fouten heffen elkaar niet uit zoals kwadratuur aanneemt.
 */
export function optellen(keuzes: readonly Keuze[]): Optelling {
  return keuzes.reduce<Optelling>((a, k) => ({
    kcal: a.kcal + (k.regel.kcal_punt || 0),
    laag: a.laag + (k.regel.kcal_laag || 0),
    hoog: a.hoog + (k.regel.kcal_hoog || 0),
    eiwit: a.eiwit + (k.regel.eiwit_g || 0),
  }), { kcal: 0, laag: 0, hoog: 0, eiwit: 0 })
}

/**
 * Wat er opgeslagen wordt.
 *
 * Alles behalve wat nog op 'onbekend' staat. Zie de kop van dit bestand: dat is
 * geen randgeval maar de afspraak waar dit vel op rust.
 */
export function naarRegels(keuzes: readonly Keuze[], datum: IsoDatum): NieuweRegel[] {
  return keuzes
    .filter((k) => k.moment !== 'onbekend')
    .map((k) => ({ ...k.regel, datum, moment: k.moment }))
}

/** Hoeveel er nog geplaatst moet worden. */
export function nogTePlaatsen(keuzes: readonly Keuze[]): number {
  return keuzes.filter((k) => k.moment === 'onbekend').length
}

/* --------------------------------------------------------------------------
   DE TRAININGEN
   --------------------------------------------------------------------------

   Een andere tabel en een ander pad — `kal_rij_toevoegen` per rij, terwijl het
   eten in één keer via `kal_regels_toevoegen` gaat. Voor de gebruiker is het
   één knop; dat de database er twee wegen voor heeft is niet zijn probleem.

   Wat het model níét mag doen is sets of herhalingen verzinnen. Dat staat in de
   prompt, en hier staat het vangnet: wat leeg terugkomt blijft leeg. Een
   training zonder sets is een training waarvan je weet dat je hem gedaan hebt,
   en dat is precies wat de tegel op Beweging telt. */

export interface Dagtraining {
  oefening: string
  spiergroep?: string | null
  sets?: number | null
  reps?: number | null
  gewicht_kg?: number | null
}

export interface Trainingrij {
  /* De indexhandtekening staat er omdat `kal_rij_toevoegen` een losse rij
     aanneemt en niet weet welke tabel hij krijgt. De benoemde velden eronder
     zijn wat deze rij werkelijk is; ze verdwijnen niet doordat dit erboven
     staat, dus een ontbrekend veld valt nog steeds op bij het typen. */
  [veld: string]: unknown
  datum: IsoDatum
  oefening: string
  spiergroep: string | null
  sets: number | null
  reps: number | null
  gewicht_kg: number | null
}

/**
 * Trainingen klaarmaken voor opslag.
 *
 * Een oefening zonder naam valt weg: dat is geen training maar ruis uit de
 * spraakherkenning, en hij zou als een lege regel op Beweging belanden.
 */
export function naarTrainingen(
  trainingen: readonly Dagtraining[], datum: IsoDatum,
): Trainingrij[] {
  return trainingen
    .filter((t) => (t.oefening ?? '').trim() !== '')
    .map((t) => ({
      datum,
      oefening: t.oefening.trim(),
      spiergroep: t.spiergroep ?? null,
      sets: t.sets ?? null,
      reps: t.reps ?? null,
      gewicht_kg: t.gewicht_kg ?? null,
    }))
}
