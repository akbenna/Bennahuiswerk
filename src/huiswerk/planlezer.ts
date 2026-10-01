/**
 * DE PLANLEZER, AAN DE KANT VAN DE APP
 *
 * Een schermafdruk van het rooster, de studiewijzer of de hoofdstukken erin;
 * voorgestelde toetsen eruit. Wat er in de edge function gebeurt staat in
 * `huiswerk/edge/huiswerk-plan.ts`. Hier gebeuren drie dingen:
 *
 * 1. Verkleinen. Een schermafdruk van een telefoon is twee tot vijf megabyte.
 *    Het model leest een rooster net zo goed op 1600 pixels breed, en dan is
 *    het een paar honderd kilobyte: sneller over een mobiele verbinding, en
 *    goedkoper.
 *
 * 2. Nakijken. Wat het model teruggeeft is een voorstel. Een vak dat dit kind
 *    niet heeft, een datum die al geweest is of niet bestaat, een toets zonder
 *    stof: dat valt eruit, met de reden erbij, zodat het kind ziet wat er niet
 *    is overgenomen. Een oefenonderwerp dat niet in de app staat valt ook weg;
 *    dezelfde grendel als bij de vraagbaak.
 *
 * 3. Wat ontbreekt doorgeven. Noemt het model een gat (stof die de app niet
 *    heeft), dan komt dat in de lijst op het ouderscherm. Zo vertellen de
 *    hoofdstukken van het kind zelf wat er nog gemaakt moet worden.
 *
 * Er komt niets op het bord zonder dat het kind het aanvinkt.
 */
import { DATABASE_URL } from '@/gedeeld/db/verbinding'
import { VAKNAAM } from './gegevens/profielen'
import type { Ingang } from './vraagbaak'
import { dagenTussen, nieuwId } from './planbord'
import type { Toets } from './planbord'

export interface Beeld { type: string; data: string }

/** Eén toets zoals hij uit de edge function komt, vóór het nakijken. */
export interface RuweToets {
  vak?: unknown
  datum?: unknown
  titel?: unknown
  onderdelen?: unknown
  opdracht?: unknown
  minutenPerOnderdeel?: unknown
  twijfel?: unknown
  oefenen?: unknown
  gat?: unknown
}

export interface Voorstel {
  toets: Toets
  /** Wat het model niet zeker wist, voor het kind. Leeg als het duidelijk was. */
  twijfel: string
  /** Stof die de app nog niet heeft, voor het ouderscherm. */
  gat: string
}

export interface Leesuitslag {
  voorstellen: Voorstel[]
  /** Wat er niet is overgenomen, met de reden. */
  afgewezen: string[]
  opmerking: string
}

const MAX_BREED = 1600

/** Een foto verkleinen tot JPEG op hoogstens 1600 pixels. Lukt het niet (een
 *  oude browser, een vreemd bestand), dan het origineel. */
export async function verklein(bestand: File): Promise<Beeld> {
  try {
    const bitmap = await createImageBitmap(bestand)
    const schaal = Math.min(1, MAX_BREED / Math.max(bitmap.width, bitmap.height))
    const doek = document.createElement('canvas')
    doek.width = Math.round(bitmap.width * schaal)
    doek.height = Math.round(bitmap.height * schaal)
    const pen = doek.getContext('2d')
    if (!pen) throw new Error('geen canvas')
    pen.drawImage(bitmap, 0, 0, doek.width, doek.height)
    const url = doek.toDataURL('image/jpeg', 0.85)
    return { type: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) }
  } catch {
    const url = await new Promise<string>((goed, mis) => {
      const lezer = new FileReader()
      lezer.onload = () => goed(String(lezer.result))
      lezer.onerror = () => mis(new Error('onleesbaar'))
      lezer.readAsDataURL(bestand)
    })
    return { type: bestand.type || 'image/jpeg', data: url.slice(url.indexOf(',') + 1) }
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const echteDatum = (iso: string): boolean => {
  if (!ISO.test(iso)) return false
  const [j, m, d] = iso.split('-').map(Number) as [number, number, number]
  const dt = new Date(j, m - 1, d)
  return dt.getFullYear() === j && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * Het antwoord van het model nakijken. Alles wat hier niet doorheen komt staat
 * in `afgewezen`, met een zin die het kind begrijpt.
 */
export function nakijken(
  ruw: { toetsen?: unknown; opmerking?: unknown },
  vakken: readonly string[],
  cat: readonly Ingang[],
  vandaag: string,
  nu = Date.now(),
): Leesuitslag {
  const mag = new Set(vakken)
  const bekend = new Map(cat.map((i) => [i.s, i]))
  const voorstellen: Voorstel[] = []
  const afgewezen: string[] = []
  const gezien = new Set<string>()

  for (const r of (Array.isArray(ruw.toetsen) ? ruw.toetsen : []) as RuweToets[]) {
    const vak = String(r?.vak ?? '').trim()
    const datum = String(r?.datum ?? '').trim()
    const titel = String(r?.titel ?? '').trim().slice(0, 80)
    const naam = `${VAKNAAM[vak] ?? (vak || 'onbekend vak')}${titel ? ` (${titel})` : ''}`
    if (!mag.has(vak)) { afgewezen.push(`${naam}: dit vak staat niet in jouw pakket.`); continue }
    if (!echteDatum(datum)) { afgewezen.push(`${naam}: geen geldige datum gevonden.`); continue }
    if (dagenTussen(vandaag, datum) <= 0) { afgewezen.push(`${naam}: die dag is vandaag of al geweest.`); continue }
    if (dagenTussen(vandaag, datum) > 120) { afgewezen.push(`${naam}: ligt meer dan vier maanden vooruit.`); continue }
    const onderdelen = (Array.isArray(r.onderdelen) ? r.onderdelen : [])
      .map((o) => String(o ?? '').trim().slice(0, 120)).filter(Boolean).slice(0, 12)
    if (!onderdelen.length) { afgewezen.push(`${naam}: er stond geen stof bij.`); continue }
    const dubbel = `${vak}|${datum}`
    if (gezien.has(dubbel)) continue
    gezien.add(dubbel)

    /* Alleen onderwerpen die echt bestaan, van dit vak, en hoogstens vier. */
    const oefenen = [...new Set((Array.isArray(r.oefenen) ? r.oefenen : []).map(String))]
      .filter((s) => bekend.get(s)?.vakSleutel === vak)
      .slice(0, 4)
    const opdracht = r.opdracht === true
    const min = Math.round(Number(r.minutenPerOnderdeel))
    voorstellen.push({
      toets: {
        id: nieuwId() + voorstellen.length,
        vak, datum,
        titel: titel || (opdracht ? 'Opdracht' : 'Toets'),
        onderdelen,
        perOnderdeel: Number.isFinite(min) ? Math.max(10, Math.min(120, min)) : 40,
        bijgewerkt: nu,
        ...(opdracht ? { opdracht: true } : {}),
        ...(oefenen.length ? { oefenen } : {}),
      },
      twijfel: String(r.twijfel ?? '').trim().slice(0, 200),
      gat: opdracht ? '' : String(r.gat ?? '').trim().slice(0, 200),
    })
  }
  voorstellen.sort((a, b) => a.toets.datum.localeCompare(b.toets.datum))
  return { voorstellen, afgewezen, opmerking: String(ruw.opmerking ?? '').trim().slice(0, 400) }
}

export class PlanlezerFout extends Error {}

/** De afbeeldingen en de tekst naar de planlezer, en het nagekeken antwoord terug. */
export async function lees(
  invoer: { beelden: Beeld[]; tekst: string },
  kind: { naam: string; niveau: string; vakken: readonly string[] },
  cat: readonly Ingang[],
  vandaag: string,
  afbreken?: AbortSignal,
): Promise<Leesuitslag> {
  let antwoord: Response
  try {
    antwoord = await fetch(DATABASE_URL + '/functions/v1/huiswerk-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beelden: invoer.beelden,
        tekst: invoer.tekst,
        vandaag,
        kind: { naam: kind.naam, niveau: kind.niveau },
        vakken: kind.vakken.map((v) => ({ sleutel: v, naam: VAKNAAM[v] ?? v })),
        catalogus: cat.map((i) => ({ s: i.s, vak: i.vak, onderwerp: i.onderwerp, n: i.n })),
      }),
      ...(afbreken ? { signal: afbreken } : {}),
    })
  } catch {
    throw new PlanlezerFout('Geen verbinding. Probeer het zo nog eens.')
  }
  const data = await antwoord.json().catch(() => ({})) as { error?: string; toetsen?: unknown; opmerking?: unknown }
  /* Een 404 betekent dat de function nog niet is uitgerold (zie
     huiswerk/edge/UITROLLEN.md). Dat is iets anders dan "het doet het even
     niet", en het kind kan intussen gewoon de stof zelf intypen. */
  if (antwoord.status === 404) {
    throw new PlanlezerFout('De fotolezer staat nog niet aan. Zet je toets er intussen zelf op met "＋ Toets of opdracht".')
  }
  if (!antwoord.ok) throw new PlanlezerFout(data.error ?? 'De planlezer doet het even niet.')
  return nakijken(data, kind.vakken, cat, vandaag)
}
