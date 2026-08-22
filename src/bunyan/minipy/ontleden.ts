/**
 * ONTLEDEN — van woorden naar een boom
 *
 * De voorrang loopt van laag naar hoog precies zoals in Python zelf: of, en,
 * niet, vergelijken, optellen, vermenigvuldigen, machtsverheffen, unair,
 * staart. Eén afwijking is met opzet blijven staan omdat de gouden waarden
 * haar vastleggen: `-2 ** 2` geeft hier 4 en in echt Python -4, want het
 * minteken wordt hier eerder gebonden. Wie dat repareert, verandert wat een
 * kind op het scherm ziet, en dat hoort dan een aparte beslissing te zijn.
 */
import { fout } from './fout'
import type { Woord } from './lezen'

export interface Getal { t: 'getal'; w: number; r: number }
export interface Tekst { t: 'tekst'; w: string; r: number }
export interface Ftekst { t: 'ftekst'; w: string; r: number }
export interface Naam { t: 'naam'; w: string; r: number }
export interface Waar { t: 'waar'; w: boolean; r: number }
export interface Niets { t: 'niets'; r: number }
export interface Lijst { t: 'lijst'; w: Uitdr[]; r: number }
export interface Woordenboek { t: 'woordenboek'; w: Array<[Uitdr, Uitdr]>; r: number }
export interface Min { t: 'min'; w: Uitdr; r: number }
export interface Niet { t: 'niet'; w: Uitdr; r: number }
export interface En { t: 'en'; l: Uitdr; r2: Uitdr; r: number }
export interface Of { t: 'of'; l: Uitdr; r2: Uitdr; r: number }
export interface Reken { t: 'reken'; op: string; l: Uitdr; r2: Uitdr; r: number }
export interface Verg { t: 'verg'; op: string; l: Uitdr; r2: Uitdr; r: number }
export interface Index { t: 'index'; w: Uitdr; i: Uitdr; r: number }
export interface Snee { t: 'snee'; w: Uitdr; van: Uitdr | null; tot: Uitdr | null; r: number }
export interface Punt { t: 'punt'; w: Uitdr; naam: string; r: number }
export interface Roep { t: 'roep'; fn: Uitdr; args: Uitdr[]; r: number }

export type Uitdr =
  | Getal | Tekst | Ftekst | Naam | Waar | Niets | Lijst | Woordenboek
  | Min | Niet | En | Of | Reken | Verg | Index | Snee | Punt | Roep

export interface Als { t: 'if'; test: Uitdr; dan: Stat[]; anders: Stat[]; r: number }
export interface Zolang { t: 'while'; test: Uitdr; lijf: Stat[]; r: number }
export interface Voor { t: 'for'; naam: string; bron: Uitdr; lijf: Stat[]; r: number }
export interface Def { t: 'def'; naam: string; args: string[]; lijf: Stat[]; r: number }
export interface Terugstat { t: 'return'; w: Uitdr | null; r: number }
export interface Zet { t: 'zet'; doel: Naam | Index; op: string; w: Uitdr; r: number }
export interface Kaal { t: 'break' | 'continue' | 'pass' | 'import'; r: number }
export interface Losse { t: 'uitdrukking'; w: Uitdr; r: number }

export type Stat = Als | Zolang | Voor | Def | Terugstat | Zet | Kaal | Losse

const TOEKEN = ['=', '+=', '-=', '*=', '/=', '//=', '**=']

export function ontleed(tk: Woord[]): Stat[] {
  let p = 0
  const nu = (): Woord => tk[p] as Woord
  const woord = (): string => String(nu().w)
  const regel = (): number => nu().regel
  const hap = (): Woord => tk[p++] as Woord
  const is = (s: string, w?: string): boolean =>
    nu().s === s && (w === undefined || nu().w === w)

  function eis(s: string, w?: string, uitleg?: string): Woord {
    if (!is(s, w)) {
      throw fout(regel(), uitleg
        ?? ('hier verwachtte ik ' + (w ? '"' + w + '"' : s.toLowerCase())
          + ' maar er staat "' + (nu().w !== undefined ? String(nu().w) : nu().s) + '"'))
    }
    return hap()
  }
  const eindeRegel = (): void => { if (is('EINDE')) hap() }

  function blok(waar: string): Stat[] {
    eis('OP', ':', 'je bent de dubbele punt vergeten aan het eind van de ' + waar + '-regel')
    eindeRegel()
    if (!is('INSPRING')) {
      throw fout(regel(), 'na de ' + waar + '-regel moet de volgende regel inspringen',
        'Zet vier spaties voor de regels die bij deze ' + waar + ' horen.')
    }
    hap()
    const rij: Stat[] = []
    while (!is('UIT') && !is('KLAAR')) rij.push(statement())
    if (is('UIT')) hap()
    return rij
  }

  function statement(): Stat {
    const r = regel()
    if (is('SLEUTEL', 'if')) {
      hap()
      const test = expr()
      const dan = blok('if')
      let staart: Stat[] | null = null
      if (is('SLEUTEL', 'elif')) staart = [statement()]
      else if (is('SLEUTEL', 'else')) { hap(); staart = blok('else') }
      return { t: 'if', test, dan, anders: staart ?? [], r }
    }
    if (is('SLEUTEL', 'elif')) {
      hap()
      const test = expr()
      const dan = blok('elif')
      let staart: Stat[] | null = null
      if (is('SLEUTEL', 'elif')) staart = [statement()]
      else if (is('SLEUTEL', 'else')) { hap(); staart = blok('else') }
      return { t: 'if', test, dan, anders: staart ?? [], r }
    }
    if (is('SLEUTEL', 'while')) {
      hap()
      const test = expr()
      return { t: 'while', test, lijf: blok('while'), r }
    }
    if (is('SLEUTEL', 'for')) {
      hap()
      const naam = String(eis('NAAM', undefined,
        'na "for" hoort een naam, bijvoorbeeld: for getal in ...').w)
      eis('SLEUTEL', 'in', 'na de naam hoort "in", bijvoorbeeld: for getal in range(5):')
      const bron = expr()
      return { t: 'for', naam, bron, lijf: blok('for'), r }
    }
    if (is('SLEUTEL', 'def')) {
      hap()
      const naam = String(eis('NAAM', undefined, 'na "def" hoort de naam van je functie').w)
      eis('OP', '(', 'na de naam van een functie horen haakjes')
      const args: string[] = []
      while (!is('OP', ')')) {
        args.push(String(eis('NAAM').w))
        if (is('OP', ',')) hap()
      }
      hap()
      return { t: 'def', naam, args, lijf: blok('def'), r }
    }
    if (is('SLEUTEL', 'return')) {
      hap()
      const w = (is('EINDE') || is('UIT') || is('KLAAR')) ? null : expr()
      eindeRegel()
      return { t: 'return', w, r }
    }
    if (is('SLEUTEL', 'break')) { hap(); eindeRegel(); return { t: 'break', r } }
    if (is('SLEUTEL', 'continue')) { hap(); eindeRegel(); return { t: 'continue', r } }
    if (is('SLEUTEL', 'pass')) { hap(); eindeRegel(); return { t: 'pass', r } }
    if (is('SLEUTEL', 'import')) { hap(); eis('NAAM'); eindeRegel(); return { t: 'import', r } }
    if (is('SLEUTEL', 'from')) {
      /* "from x import y" komt in dit eerste jaar niet voor; de oude vertaler
         eiste hier "as" en liep dus altijd vast. Dat is zo gelaten. */
      hap()
      eis('NAAM')
      eis('SLEUTEL', 'as')
      return { t: 'pass', r }
    }
    if (is('SLEUTEL', 'else')) {
      throw fout(r, '"else" hoort bij een "if" die erboven staat',
        'Kijk of de if-regel erboven even ver inspringt als deze else.')
    }

    /* toekenning of losse uitdrukking */
    const links = expr()
    if (is('OP') && TOEKEN.includes(woord())) {
      const op = String(hap().w)
      const rechts = expr()
      eindeRegel()
      if (links.t !== 'naam' && links.t !== 'index') {
        throw fout(r, 'links van het = teken hoort een naam', 'Bijvoorbeeld: score = 10')
      }
      return { t: 'zet', doel: links, op, w: rechts, r }
    }
    eindeRegel()
    return { t: 'uitdrukking', w: links, r }
  }

  /* Voorrang van laag naar hoog, zoals in Python zelf. */
  const expr = (): Uitdr => of_()

  function of_(): Uitdr {
    let l = en_()
    while (is('SLEUTEL', 'or')) { const r = regel(); hap(); l = { t: 'of', l, r2: en_(), r } }
    return l
  }
  function en_(): Uitdr {
    let l = niet()
    while (is('SLEUTEL', 'and')) { const r = regel(); hap(); l = { t: 'en', l, r2: niet(), r } }
    return l
  }
  function niet(): Uitdr {
    if (is('SLEUTEL', 'not')) { const r = regel(); hap(); return { t: 'niet', w: niet(), r } }
    return verg()
  }
  function verg(): Uitdr {
    let l = som()
    for (;;) {
      const volgt = tk[p + 1]
      const isNotIn = is('SLEUTEL', 'not') && volgt?.s === 'SLEUTEL' && volgt.w === 'in'
      if (!((is('OP') && ['==', '!=', '<', '>', '<=', '>='].includes(woord()))
        || is('SLEUTEL', 'in') || isNotIn)) break
      const r = regel()
      let op: string
      if (is('SLEUTEL', 'not')) { hap(); hap(); op = 'not in' } else op = String(hap().w)
      l = { t: 'verg', op, l, r2: som(), r }
    }
    return l
  }
  function som(): Uitdr {
    let l = term()
    while (is('OP', '+') || is('OP', '-')) {
      const r = regel()
      const op = String(hap().w)
      l = { t: 'reken', op, l, r2: term(), r }
    }
    return l
  }
  function term(): Uitdr {
    let l = macht()
    while (is('OP', '*') || is('OP', '/') || is('OP', '//') || is('OP', '%')) {
      const r = regel()
      const op = String(hap().w)
      l = { t: 'reken', op, l, r2: macht(), r }
    }
    return l
  }
  function macht(): Uitdr {
    const l = unair()
    if (is('OP', '**')) { const r = regel(); hap(); return { t: 'reken', op: '**', l, r2: macht(), r } }
    return l
  }
  function unair(): Uitdr {
    if (is('OP', '-')) { const r = regel(); hap(); return { t: 'min', w: unair(), r } }
    if (is('OP', '+')) { hap(); return unair() }
    return staart()
  }
  function staart(): Uitdr {
    let e = basis()
    for (;;) {
      if (is('OP', '(')) {
        const r = regel()
        hap()
        const args: Uitdr[] = []
        while (!is('OP', ')')) {
          if (is('KLAAR')) throw fout(r, 'er ontbreekt een ) ', 'Elk haakje dat opengaat moet weer dicht.')
          args.push(expr())
          if (is('OP', ',')) hap()
        }
        hap()
        e = { t: 'roep', fn: e, args, r }
      } else if (is('OP', '[')) {
        const r = regel()
        hap()
        const van = is('OP', ':') ? null : expr()
        if (is('OP', ':')) {
          hap()
          const tot = is('OP', ']') ? null : expr()
          eis('OP', ']')
          e = { t: 'snee', w: e, van, tot, r }
        } else {
          eis('OP', ']', 'er ontbreekt een ] ')
          e = { t: 'index', w: e, i: van as Uitdr, r }
        }
      } else if (is('OP', '.')) {
        const r = regel()
        hap()
        const naam = String(eis('NAAM', undefined, 'na een punt hoort de naam van iets').w)
        e = { t: 'punt', w: e, naam, r }
      } else return e
    }
  }
  function basis(): Uitdr {
    const r = regel()
    if (is('GETAL')) return { t: 'getal', w: Number(hap().w), r }
    if (is('TEKST')) return { t: 'tekst', w: String(hap().w), r }
    if (is('FTEKST')) return { t: 'ftekst', w: String(hap().w), r }
    if (is('NAAM')) return { t: 'naam', w: String(hap().w), r }
    if (is('SLEUTEL', 'True')) { hap(); return { t: 'waar', w: true, r } }
    if (is('SLEUTEL', 'False')) { hap(); return { t: 'waar', w: false, r } }
    if (is('SLEUTEL', 'None')) { hap(); return { t: 'niets', r } }
    if (is('OP', '(')) { hap(); const e = expr(); eis('OP', ')', 'er ontbreekt een ) '); return e }
    if (is('OP', '[')) {
      hap()
      const w: Uitdr[] = []
      while (!is('OP', ']')) {
        if (is('KLAAR')) throw fout(r, 'er ontbreekt een ] ', 'Elke [ moet weer dicht met ].')
        w.push(expr())
        if (is('OP', ',')) hap()
      }
      hap()
      return { t: 'lijst', w, r }
    }
    if (is('OP', '{')) {
      hap()
      const paren: Array<[Uitdr, Uitdr]> = []
      while (!is('OP', '}')) {
        if (is('KLAAR')) throw fout(r, 'er ontbreekt een } ', 'Elke { moet weer dicht met }.')
        const k = expr()
        eis('OP', ':', 'in een woordenboek hoort een : tussen de sleutel en de waarde')
        paren.push([k, expr()])
        if (is('OP', ',')) hap()
      }
      hap()
      return { t: 'woordenboek', w: paren, r }
    }
    if (is('EINDE')) throw fout(r, 'deze regel is niet af', 'Er hoort hier nog iets te staan.')
    throw fout(r, 'hier begrijp ik niets van: "'
      + (nu().w !== undefined ? String(nu().w) : nu().s) + '"')
  }

  const rij: Stat[] = []
  while (!is('KLAAR')) {
    if (is('EINDE') || is('INSPRING') || is('UIT')) { hap(); continue }
    rij.push(statement())
  }
  return rij
}
