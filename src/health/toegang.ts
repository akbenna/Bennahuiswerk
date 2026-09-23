/**
 * WAT JE MAG, EN WAT DE APP DAAROVER ZEGT
 *
 * De app gaat naar testers en daarmee verandert er iets aan de aard van het
 * ding. Tot nu toe was elke fout een storing. Vanaf nu is "dit werkt niet" ook
 * een antwoord dat klopt: je wacht nog op toelating, of je maand is op.
 *
 * Dit bestand vertaalt de uitslag van `kal_mijn_toegang` naar wat er op het
 * scherm hoort te staan. Het rekent niets uit; de grens ligt in de database en
 * de poort die geld kost ligt in de edge function. Zie bestand 48.
 *
 * WAAROM ONBEKEND NIET HETZELFDE IS ALS GEWEIGERD
 *
 * De volgorde van uitrollen is: eerst de SQL, dan de edge function, dan de app.
 * Wie die volgorde omdraait, of hem halverwege onderbreekt, heeft een app die
 * een functie aanroept die nog niet bestaat.
 *
 * Dat mag geen slot worden. Een app die zichzelf dichtzet omdat een RPC
 * ontbreekt, zet zich dicht bij precies degene die er het minste aan kan doen.
 * Dus: geen antwoord betekent `onbekend`, en `onbekend` gedraagt zich als
 * toegelaten. De echte grens staat toch in de edge function, en die weigert
 * netjes met een zin die de gebruiker kan lezen.
 *
 * Datzelfde geldt voor een netwerkfout. Wie in de trein zit is niet afgewezen.
 *
 * EN WAAROM DE AFWIJZING EEN SCHERM IS EN GEEN SLOT
 *
 * Staat er `afgewezen`, dan toont de app dat in plaats van de app. Dat is een
 * scherm: wie de RPC's rechtstreeks aanroept komt nog steeds bij zijn eigen
 * gegevens. Het is zijn eigen gewicht en niet dat van een ander, dus dat is te
 * verdedigen, maar het is geen slot en het staat hier zodat niemand het
 * daarvoor aanziet. Een echt slot vraagt een regel in `kal_sessie`, en die
 * functie staat nog niet op papier.
 */
import type { Toegang as RpcToegang } from '@/gedeeld/db/rpc'

export type Status = 'wacht' | 'toegelaten' | 'afgewezen' | 'onbekend'

export type Reden =
  | 'goed' | 'wacht' | 'afgewezen' | 'maand-op' | 'uur-vol' | 'onbekend'

export type Aanbieder = 'anthropic' | 'openai'

export interface Toegang {
  status: Status
  reden: Reden
  /** Draait deze gebruiker op zijn eigen sleutel? Dan geldt het budget niet. */
  eigenSleutel: boolean
  aanbieder: Aanbieder | null
  /** De laatste vier tekens van de sleutel, nooit meer. Zie bestand 49. */
  staart: string | null
  /** Geslaagde AI-aanroepen deze maand, en hoeveel er in totaal mogen. */
  gebruikt: number
  budget: number
  beheerder: boolean
  /** De eerste dag van de volgende maand: dan springt de teller terug. */
  maandTot: string | null
}

/** Wat de app aanhoudt zolang de database nog niets teruggaf. */
export const ONBEKEND: Toegang = {
  status: 'onbekend', reden: 'onbekend',
  eigenSleutel: false, aanbieder: null, staart: null,
  gebruikt: 0, budget: 0, beheerder: false, maandTot: null,
}

const AANBIEDERS: readonly string[] = ['anthropic', 'openai']

/** Zoals de aanbieder op het scherm heet. */
export const AANBIEDERNAAM: Record<Aanbieder, string> = {
  anthropic: 'Anthropic', openai: 'OpenAI',
}

const STATUSSEN: readonly string[] = ['wacht', 'toegelaten', 'afgewezen']
const REDENEN: readonly string[] = ['goed', 'wacht', 'afgewezen', 'maand-op', 'uur-vol']

/**
 * De uitslag van de database naar iets waar de app op kan bouwen.
 *
 * Een waarde die deze app niet kent wordt `onbekend` en niet genegeerd: een
 * nieuwe status die hier stilletjes als "toegelaten" zou binnenkomen, is
 * precies het soort fout dat pas op de rekening zichtbaar wordt.
 */
export function leesToegang(uit: RpcToegang | null | undefined): Toegang {
  if (!uit || typeof uit !== 'object') return ONBEKEND
  const status = STATUSSEN.includes(String(uit.status)) ? (uit.status as Status) : 'onbekend'
  const reden = REDENEN.includes(String(uit.reden)) ? (uit.reden as Reden) : 'onbekend'
  const aanbieder = AANBIEDERS.includes(String(uit.aanbieder))
    ? (uit.aanbieder as Aanbieder) : null
  return {
    status,
    reden,
    eigenSleutel: uit.eigen_sleutel === true,
    aanbieder,
    staart: typeof uit.staart === 'string' ? uit.staart : null,
    gebruikt: Number.isFinite(uit.gebruikt) ? Number(uit.gebruikt) : 0,
    budget: Number.isFinite(uit.budget) ? Number(uit.budget) : 0,
    beheerder: uit.beheerder === true,
    maandTot: typeof uit.maand_tot === 'string' ? uit.maand_tot : null,
  }
}

/** Mag de AI nu gebruikt worden? Onbekend telt als ja; zie de kop. */
export const magAi = (t: Toegang): boolean =>
  t.status === 'toegelaten' || t.status === 'onbekend'

/** Moet de app plaatsmaken voor een bericht? Alleen bij een echte afwijzing. */
export const geslotenScherm = (t: Toegang): boolean => t.status === 'afgewezen'

/**
 * Wat er staat waar anders een herkenning had gestaan.
 *
 * Eén zin per geval, en elke zin zegt wat de lezer nu kan doen. "Niet
 * toegestaan" is geen bericht maar een deur zonder klink.
 */
export function uitlegAi(t: Toegang): string | null {
  if (t.status === 'wacht') {
    return 'Je aanmelding wacht op toelating. Wegen, loggen en alle figuren werken nu al; '
      + 'alleen het herkennen van maaltijden uit tekst of foto komt erbij zodra je bent toegelaten.'
  }
  if (t.status === 'afgewezen') return 'Dit account is niet toegelaten tot de test.'
  if (t.reden === 'maand-op') {
    return `Je ${t.budget} herkenningen van deze maand zijn op`
      + (t.maandTot ? `. Op ${t.maandTot} springt de teller terug.` : '.')
      + ' Wil je nu verder, geef dan je eigen sleutel op onder Account; dan loopt het'
      + ' op je eigen rekening en geldt dit budget niet meer. Invoeren met de hand'
      + ' werkt hoe dan ook gewoon door.'
  }
  if (t.reden === 'uur-vol') {
    return 'Dertig herkenningen in een uur is het maximum. Over een uur kan het weer.'
  }
  return null
}

/**
 * Hoeveel er nog over is, als tekst.
 *
 * Alleen als er een budget is dat ergens op slaat. De eigenaar staat op
 * honderdduizend en die hoeft niet te lezen dat hij er nog 99.987 heeft.
 */
export function restZin(t: Toegang, drempel = 1000): string | null {
  /* Op je eigen sleutel is er niets af te tellen: het budget van de eigenaar
     geldt dan niet meer, en een teller die niets begrenst leest als een grens. */
  if (t.eigenSleutel) return null
  if (t.status !== 'toegelaten' || t.budget <= 0 || t.budget >= drempel) return null
  const over = Math.max(t.budget - t.gebruikt, 0)
  return `${over} van je ${t.budget} herkenningen over deze maand`
}
