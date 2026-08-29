/**
 * DE VRAAGBAAK
 *
 * Een kind opent deze app zelden om te bladeren. Het opent hem omdat er iets in
 * zijn hoofd zit: *ik snap breuken optellen niet*. De app bood daar geen ingang
 * voor — je moest zelf bedenken onder welk vak en welk onderwerp jouw vraag
 * hoort, en dat is precies het stuk dat je niet weet als je vastzit.
 *
 * Hier staat de brug. De vraag gaat naar de edge function `huiswerk-ai`, samen
 * met de complete lijst onderwerpen van dít kind. Het model kiest daaruit; het
 * verzint niets.
 *
 * EN DAARNA KIJKT DEZE MODULE HET NA
 *
 * `verwerk` gooit elke sleutel weg die niet in de catalogus staat. Dat is geen
 * wantrouwen jegens het model maar de vaste afspraak in dit huis: bij
 * BennaHealth kiest het model de NEVO-regel en rékent de server met de
 * tabelwaarde. Hier kiest het model het onderwerp en bepaalt de app of dat
 * onderwerp bestaat. Zo kan een verzonnen onderwerp nooit als knop op het
 * scherm belanden, hoe het antwoord er ook uitziet.
 *
 * Alles wat je hieronder ziet dat geen netwerk raakt, is met opzet een gewone
 * functie zonder toestand: `catalogus` en `verwerk` zijn zo te toetsen zonder
 * dat er één keer met een model gepraat hoeft te worden.
 */
import { DATABASE_URL } from '@/gedeeld/db/verbinding'
import { PROFIELEN, VAKNAAM } from './gegevens/profielen'
import type { Kaart } from './gegevens/soorten'
import { isBeheerst } from './leitner'
import type { Voortgang } from './opslag'

/** Eén onderwerp zoals het model het te zien krijgt. */
export interface Ingang {
  /** De sleutel waarmee het model dit onderwerp aanwijst: vak|onderwerp|jaar. */
  s: string
  vak: string
  vakSleutel: string
  onderwerp: string
  jaar: 'nu' | 'next'
  n: number
  beheerst: number
}

/** Wat er uit de vraagbaak komt, ná het nakijken. */
export interface Uitslag {
  antwoord: string
  routes: Ingang[]
  /** Wat er volgens het model niet in de app staat, of null. */
  gat: string | null
  /** Sleutels die het model noemde maar die niet bestaan. Alleen voor de proef
   *  en het ouderscherm — een kind hoeft dit niet te zien. */
  verzonnen: string[]
}

export const sleutelVan = (vak: string, onderwerp: string, jaar: string): string =>
  `${vak}|${onderwerp}|${jaar === 'next' ? 'next' : 'nu'}`

/**
 * Alle onderwerpen die dit kind heeft, met hoeveel opgaven erin zitten en
 * hoeveel het er al beheerst. Beide jaren, want een kind mag vragen naar stof
 * van volgend jaar.
 */
export function catalogus(alle: readonly Kaart[], pid: string, prog: Voortgang): Ingang[] {
  const bak = new Map<string, Ingang>()
  for (const e of alle) {
    if (e.p !== pid) continue
    const jaar = e.jaar === 'next' ? 'next' : 'nu'
    const s = sleutelVan(e.v, e.t, jaar)
    let ing = bak.get(s)
    if (!ing) {
      ing = {
        s, vakSleutel: e.v, vak: VAKNAAM[e.v] ?? e.v, onderwerp: e.t, jaar, n: 0, beheerst: 0,
      }
      bak.set(s, ing)
    }
    ing.n++
    if (isBeheerst(prog, e.id)) ing.beheerst++
  }
  return [...bak.values()]
}

/** Het rauwe antwoord van de edge function, vóór het nakijken. */
export interface RuwAntwoord {
  antwoord?: unknown
  routes?: unknown
  gat?: unknown
}

/**
 * Het antwoord nakijken tegen de catalogus. Alleen sleutels die er echt zijn
 * overleven; de rest komt in `verzonnen` terecht en verdwijnt van het scherm.
 *
 * Dubbele sleutels worden één keer geteld, en er gaan er hoogstens drie door:
 * een lijstje van tien knoppen is weer een keuze in plaats van een antwoord.
 */
export function verwerk(ruw: RuwAntwoord, cat: readonly Ingang[]): Uitslag {
  const kaart = new Map(cat.map((i) => [i.s, i]))
  const routes: Ingang[] = []
  const verzonnen: string[] = []
  const gezien = new Set<string>()

  for (const r of Array.isArray(ruw.routes) ? ruw.routes : []) {
    const s = String(r)
    if (gezien.has(s)) continue
    gezien.add(s)
    const ing = kaart.get(s)
    if (ing) {
      if (routes.length < 3) routes.push(ing)
    } else {
      verzonnen.push(s)
    }
  }

  const gat = ruw.gat ? String(ruw.gat).trim() : ''
  return {
    antwoord: String(ruw.antwoord ?? '').trim(),
    routes,
    /* Wijst het model wél iets aan, dan is er geen gat — wat het er verder ook
       bij schrijft. Anders komt elke vraag in de ouderlijst terecht. */
    gat: routes.length === 0 && gat ? gat : null,
    verzonnen,
  }
}

export class VraagbaakFout extends Error {}

/** Stel de vraag. Geeft het nagekeken antwoord terug. */
export async function stel(
  vraag: string, pid: string, alle: readonly Kaart[], prog: Voortgang,
  afbreken?: AbortSignal,
): Promise<Uitslag> {
  const prof = PROFIELEN[pid]
  const cat = catalogus(alle, pid, prog)
  if (!cat.length) throw new VraagbaakFout('Voor dit profiel staan nog geen opgaven klaar.')

  let antwoord: Response
  try {
    antwoord = await fetch(DATABASE_URL + '/functions/v1/huiswerk-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vraag,
        kind: { naam: prof?.naam, niveau: prof?.niveau, volgend: prof?.volgend },
        catalogus: cat.map(({ s, vak, onderwerp, jaar, n, beheerst }) =>
          ({ s, vak, onderwerp, jaar, n, beheerst })),
      }),
      /* `exactOptionalPropertyTypes` staat aan: het veld weglaten is iets
         anders dan het op undefined zetten. */
      ...(afbreken ? { signal: afbreken } : {}),
    })
  } catch {
    throw new VraagbaakFout('Geen verbinding. Je kunt gewoon een vak hieronder kiezen.')
  }

  const uit = (await antwoord.json()) as RuwAntwoord & { error?: string }
  if (!antwoord.ok) throw new VraagbaakFout(uit.error ?? 'De vraagbaak doet het even niet.')
  return verwerk(uit, cat)
}
