/**
 * WAT ER BEWAARD WORDT
 *
 * Eén stand voor het gezin, met daarin een profiel per persoon. Bij het
 * samenvoegen wint per kaart de kant die het laatst beoordeeld heeft — niet de
 * hoogste stabiliteit, want een kaart die je vandaag fout had hóórt terug te
 * vallen, en de nieuwste beoordeling is de ware.
 */
import type { Kaartstaat } from './fsrs'
import type { Spoor } from './gegevens/soorten'
import type { Vocalisatie } from './tekst'

export interface Dagstand { blokken: number; herhaald: number; goed: number; fout: number }

export interface Voorkeur {
  vocalisatie: Vocalisatie
  glossen: boolean
  geluid: boolean
}

/** Een gedane les, of een gemaakte toets. */
export interface Lesstand { minuten: number; d: string }
export interface Toetsstand { d: string; score: number; totaal: number }

export interface Jaarstand {
  niveau: number
  week: number
  gestart: string
  /** De niveaubepaling waarmee het jaar begon. */
  meting: Toetsstand
  /** Weeknummer → wat er die week gedaan is. */
  sessies: Record<string, Lesstand>
  /** Bloknummer → de beste toets van dat blok. */
  toetsen: Record<string, Toetsstand>
}

export interface Profiel {
  id: string
  naam: string
  leeftijd: number
  spoor: Spoor
  /** Heeft de ouder het spoor zelf gezet? Dan rekent de app niet meer terug. */
  spoorHandmatig: boolean
  intentie: string
  gemaakt: string
  dagdoel: number
  voorkeur: Voorkeur
  /** Kaart-id → FSRS-staat. */
  kaarten: Record<string, Kaartstaat>
  /** Hoeveel blokken van het leerpad af zijn. */
  blok: number
  dagen: Record<string, Dagstand>
  punten: number
  spelrecords: Record<string, number>
  /** Letter → aantal keer goed, voor het veroverde alfabet. */
  letters: Record<string, number>
  /** Het jaarprogramma; wordt aangemaakt na de niveaubepaling. */
  jaar: Jaarstand | null
}

export interface Stand {
  versie: 1
  actief: string | null
  thema: string | null
  profielen: Record<string, Profiel>
  ouderPin: string
}

/** De standaardcode. Een kant die hem nog heeft, heeft niets ingesteld. */
export const STANDAARDPIN = '1234'

export const leeg = (): Stand => ({
  versie: 1, actief: null, thema: null, profielen: {}, ouderPin: STANDAARDPIN,
})

export const dagdoelVan = (spoor: Spoor): number =>
  (spoor === 1 ? 15 : spoor === 2 ? 25 : spoor === 3 ? 40 : 60)

export function nieuwProfiel(
  id: string, naam: string, leeftijd: number, spoor: Spoor, intentie: string, nu: string,
): Profiel {
  return {
    id, naam, leeftijd, spoor, spoorHandmatig: false,
    intentie, gemaakt: nu,
    dagdoel: dagdoelVan(spoor),
    voorkeur: { vocalisatie: spoor <= 2 ? 'vol' : 'selectief', glossen: false, geluid: true },
    kaarten: {}, blok: 0, dagen: {}, punten: 0, spelrecords: {}, letters: {}, jaar: null,
  }
}

export type Losse = Partial<Stand>

const max = (a: number | undefined, b: number | undefined): number => Math.max(a ?? 0, b ?? 0)

function perId<T>(
  a: Record<string, T> | undefined,
  b: Record<string, T> | undefined,
  kies: (x: T, y: T) => T,
): Record<string, T> {
  const uit: Record<string, T> = { ...(a ?? {}) }
  for (const [id, y] of Object.entries(b ?? {})) {
    const x = uit[id]
    uit[id] = x === undefined ? y : kies(x, y)
  }
  return uit
}

export function samenvoegenProfiel(a: Profiel | undefined, b: Profiel | undefined): Profiel {
  if (!a) return b as Profiel
  if (!b) return a
  return {
    ...a, ...b,
    /* `laatst` is de datum van de laatste beoordeling; die bepaalt wie wint. */
    kaarten: perId(a.kaarten, b.kaarten, (x, y) => {
      const lx = x?.laatst ?? ''
      const ly = y?.laatst ?? ''
      if (lx !== ly) return lx > ly ? x : y
      return (x?.herh ?? 0) >= (y?.herh ?? 0) ? x : y
    }),
    dagen: perId(a.dagen, b.dagen, (x, y) => ({
      blokken: max(x.blokken, y.blokken), herhaald: max(x.herhaald, y.herhaald),
      goed: max(x.goed, y.goed), fout: max(x.fout, y.fout),
    })),
    letters: perId(a.letters, b.letters, (x, y) => max(x, y)),
    spelrecords: perId(a.spelrecords, b.spelrecords, (x, y) => max(x, y)),
    blok: max(a.blok, b.blok),
    punten: max(a.punten, b.punten),
    /* De instellingen volgen de kant die ze het laatst bewust gezet heeft;
       bij twijfel die van b — de kopie die zojuist binnenkwam. */
    voorkeur: { ...a.voorkeur, ...b.voorkeur },
  }
}

/* De oude samenvoegen bouwde een nieuw object met alleen versie, actief, thema
   en profielen: de ouderscode viel eruit. Wie thuis een code instelde en daarna
   op een tweede toestel gelijktrok, stond de volgende dag weer op 1234 zonder
   dat er iets van te zien was. Hier wint de kant die er iets anders dan de
   standaard heeft staan. */
const kiesPin = (x?: string, y?: string): string => {
  if (x && x !== STANDAARDPIN) return x
  if (y && y !== STANDAARDPIN) return y
  return x ?? y ?? STANDAARDPIN
}

export function samenvoegen(a: Losse | null, b: Losse | null): Stand {
  const x = a ?? {}
  const y = b ?? {}
  const profielen: Record<string, Profiel> = {}
  const ids = new Set([...Object.keys(x.profielen ?? {}), ...Object.keys(y.profielen ?? {})])
  for (const id of ids) {
    profielen[id] = samenvoegenProfiel(x.profielen?.[id], y.profielen?.[id])
  }
  return {
    versie: 1,
    actief: x.actief ?? y.actief ?? null,
    thema: x.thema ?? y.thema ?? null,
    profielen,
    ouderPin: kiesPin(x.ouderPin, y.ouderPin),
  }
}

/* De sleutel blijft `lisan.v1`: de oude naam van deze app. Wie hem hernoemt,
   zet elk profiel terug op nul. */
const SLEUTEL = 'lisan.v1'

export function lees(): Stand {
  try {
    const v = localStorage.getItem(SLEUTEL)
    return v ? samenvoegen(leeg(), JSON.parse(v) as Losse) : leeg()
  } catch {
    return leeg()
  }
}

export function schrijf(s: Stand): void {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(s))
  } catch { /* een volle of geweigerde opslag mag de app niet stilzetten */ }
}

export type { Spoor }
