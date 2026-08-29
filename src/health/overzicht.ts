/**
 * DE DAG UITGEREKEND
 *
 * Het dagscherm toont vier vakken met een totaal per vak. Dat is genoeg om te
 * zien of je goed zit, en te weinig zodra je wilt weten wáárom een getal is wat
 * het is. Dit is het rekenwerk achter dat tweede scherm.
 *
 * Waarom het los staat van het scherm: hier zitten optellingen in die stil fout
 * kunnen gaan. Een macro die als nul telt in plaats van als onbekend, een band
 * die smaller wordt door hem verkeerd op te tellen — dat ziet er allemaal
 * plausibel uit. Los ervan is het te toetsen.
 *
 * DE BAND TELT OP ALS SOM, NIET ALS WORTEL
 *
 * Twee regels met elk 100–150 kcal geven samen 200–300, niet 200–271. Dat laatste
 * zou volgen uit het optellen van varianties, en dat mag alleen bij onafhankelijke
 * fouten. Hier zijn ze dat niet: schat het model de porties structureel te ruim,
 * dan doet het dat de hele dag. De brede som is het eerlijke antwoord.
 *
 * ONBEKEND IS GEEN NUL
 *
 * Een regel zonder eiwitwaarde is niet een regel met nul gram eiwit. Daarom telt
 * `ontbreekt` hoeveel regels er geen waarde hadden: het scherm kan dan zeggen dat
 * het totaal een ondergrens is in plaats van te doen alsof het klopt.
 */
import type { Moment, Regel } from '@/gedeeld/db/tabellen'

export interface Macrosom {
  /** De som van wat er wél stond. */
  gram: number
  /** Hoeveel regels geen waarde hadden. Boven nul is `gram` een ondergrens. */
  ontbreekt: number
}

export interface Vaksom {
  moment: Moment
  regels: Regel[]
  kcal: number
  laag: number
  hoog: number
  eiwit: Macrosom
  koolhydraat: Macrosom
  vet: Macrosom
  vezel: Macrosom
}

export interface Dagoverzicht {
  vakken: Vaksom[]
  totaal: Omit<Vaksom, 'moment' | 'regels'> & { regels: Regel[] }
  /** Hoeveel regels op een gemeten tabelwaarde staan, van hoeveel in totaal. */
  gemeten: number
  aantal: number
}

/** De vier vakken, in de volgorde van de dag. `onbekend` valt onder tussendoor. */
export const VAKKEN: Moment[] = ['ontbijt', 'lunch', 'diner', 'tussendoor']

function macro(regels: readonly Regel[], veld: keyof Regel): Macrosom {
  let gram = 0
  let ontbreekt = 0
  for (const r of regels) {
    const w = r[veld]
    if (typeof w === 'number') gram += w
    else ontbreekt++
  }
  return { gram, ontbreekt }
}

function som(regels: Regel[]): Omit<Vaksom, 'moment'> {
  return {
    regels,
    kcal: regels.reduce((n, r) => n + r.kcal_punt, 0),
    /* Ontbreekt de band, dan is de puntschatting het beste wat er is — en niet
       nul, want dan zou een regel zonder band het interval naar beneden trekken
       en de dag zekerder laten lijken dan hij is. */
    laag: regels.reduce((n, r) => n + (r.kcal_laag ?? r.kcal_punt), 0),
    hoog: regels.reduce((n, r) => n + (r.kcal_hoog ?? r.kcal_punt), 0),
    eiwit: macro(regels, 'eiwit_g'),
    koolhydraat: macro(regels, 'koolhydraat_g'),
    vet: macro(regels, 'vet_g'),
    vezel: macro(regels, 'vezel_g'),
  }
}

/**
 * Alles van één dag, per vak en in totaal.
 *
 * De vier vakken staan er altijd, ook leeg: het overzicht van een dag waarop je
 * niet ontbeten hebt hoort dat te laten zien en niet weg te laten.
 */
export function dagoverzicht(regels: readonly Regel[]): Dagoverzicht {
  const bij = (m: Moment): Regel[] =>
    regels.filter((r) => (r.moment === 'onbekend' ? m === 'tussendoor' : r.moment === m))

  const alles = [...regels]
  return {
    vakken: VAKKEN.map((m) => ({ moment: m, ...som(bij(m)) })),
    totaal: som(alles),
    gemeten: alles.filter((r) => r.nevo_code != null).length,
    aantal: alles.length,
  }
}

/**
 * Hoe de portie er stond toen hij ingevoerd werd — "2 sneden · 70 g", "150 g".
 *
 * Leeg als er niets over te zeggen valt. Een lege string is hier beter dan een
 * streepje: het scherm laat de regel dan gewoon weg in plaats van een vakje te
 * vullen met de mededeling dat het leeg is.
 */
export function portietekst(r: Pick<Regel, 'hoeveelheid' | 'eenheid' | 'gram_equivalent'>): string {
  const delen: string[] = []
  if (r.hoeveelheid != null && r.eenheid) delen.push(`${r.hoeveelheid} ${r.eenheid}`)
  else if (r.eenheid) delen.push(r.eenheid)
  if (r.gram_equivalent != null) delen.push(`${Math.round(r.gram_equivalent)} g`)
  return delen.join(' · ')
}
