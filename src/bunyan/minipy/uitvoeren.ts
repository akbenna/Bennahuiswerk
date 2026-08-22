/**
 * UITVOEREN — de boom aflopen
 *
 * Twee dingen die niet vanzelfsprekend zijn en er met opzet in zitten.
 *
 * De stappenteller. Een while-lus die nooit stopt bevriest anders het tabblad,
 * en dat is voor een kind niet te onderscheiden van "de computer is stuk". Na
 * vierhonderdduizend stappen komt er een melding die zegt waar je moet kijken.
 *
 * De eigen toevalsgenerator. `random` met een vast zaad betekent dat een
 * opdracht met dobbelstenen nog steeds na te kijken is: dezelfde code geeft
 * altijd dezelfde worp, en het kind kan zijn programma stap voor stap volgen.
 */
import { fout, MinipyFout } from './fout'
import { lees } from './lezen'
import { ontleed } from './ontleden'
import type { Index, Naam, Stat, Uitdr } from './ontleden'

/** Alles wat een Python-waarde hier kan zijn. */
export type Waarde =
  | number | string | boolean | null
  | Waarde[]
  | Map<Waarde, Waarde>
  | Functie | Ingebouwd | Module | Methodehouder

export interface Functie { fn: true; naam: string; args: string[]; lijf: Stat[]; sluit: Bereik }
export interface Ingebouwd { ib: true; naam: string }
export interface Module { mod: 'random' }
export interface Methodehouder { methode: true; op: Waarde; naam: string; r: number }

interface Bereik { vars: Record<string, Waarde>; ouder: Bereik | null }

/* Twee unieke merken voor break en continue: die reizen als teruggave omhoog
   door de blokken heen, en mogen met geen enkele echte waarde samenvallen. */
const BREEK = Symbol('breek')
const DOOR = Symbol('door')
class Terug { constructor(readonly w: Waarde) {} }
type Sprong = typeof BREEK | typeof DOOR | Terug | null

/* Sorteren en min/max leunden in de oude vertaler op de < van JavaScript zelf,
   ook bij dingen die Python nooit zou vergelijken. Dat is precies wat een kind
   te zien krijgt, dus het blijft zo — maar het staat hier één keer opgeschreven
   in plaats van vier keer verstopt in een vergelijkerfunctie. */
const jsKleiner = (x: Waarde, y: Waarde): boolean =>
  (x as number) < (y as number)
const jsGroter = (x: Waarde, y: Waarde): boolean =>
  (x as number) > (y as number)
const jsOrde = (x: Waarde, y: Waarde): number =>
  jsKleiner(x, y) ? -1 : jsGroter(x, y) ? 1 : 0

const INGEBOUWD = new Set([
  'print', 'input', 'len', 'str', 'int', 'float', 'bool', 'abs', 'round', 'min', 'max',
  'sum', 'sorted', 'reversed', 'list', 'range', 'enumerate', 'type',
])

export interface Opties {
  /** De regels uit het vak "Wat jij intypt". */
  invoer?: string[]
  /** Waar `print` naartoe schrijft; standaard naar de lijst in de uitslag. */
  schrijf?: (s: string) => void
  maxStappen?: number
  zaad?: number
}

const isFunctie = (w: Waarde): w is Functie =>
  typeof w === 'object' && w !== null && 'fn' in w
const isIngebouwd = (w: Waarde): w is Ingebouwd =>
  typeof w === 'object' && w !== null && 'ib' in w
const isModule = (w: Waarde): w is Module =>
  typeof w === 'object' && w !== null && 'mod' in w

export class Uitvoerder {
  readonly uit: string[] = []
  private readonly invoer: string[]
  private readonly schrijf: (s: string) => void
  private readonly maxStappen: number
  private zaad: number
  stappen = 0

  constructor(opties: Opties = {}) {
    this.invoer = (opties.invoer ?? []).slice()
    this.schrijf = opties.schrijf ?? ((s) => { this.uit.push(s) })
    this.maxStappen = opties.maxStappen ?? 400_000
    this.zaad = opties.zaad ?? 12345
  }

  /** Een eigen toevalsgenerator, zodat een opgave met random toch na te kijken is. */
  private toeval(): number {
    this.zaad = (this.zaad * 1103515245 + 12345) & 0x7fffffff
    return this.zaad / 0x7fffffff
  }

  private tel(r: number): void {
    if (++this.stappen > this.maxStappen) {
      throw fout(r, 'je programma blijft maar doorgaan',
        'Waarschijnlijk stopt een while-lus nooit. Kijk of de waarde in de test ook echt verandert.')
    }
  }

  draai(bron: string): string[] {
    const ast = ontleed(lees(bron))
    this.blok(ast, { vars: Object.create(null) as Record<string, Waarde>, ouder: null })
    return this.uit
  }

  private blok(rij: Stat[], o: Bereik): Sprong {
    for (const s of rij) {
      const w = this.stat(s, o)
      if (w) return w
    }
    return null
  }

  private vind(o: Bereik, naam: string): Bereik | null {
    let x: Bereik | null = o
    while (x) {
      if (naam in x.vars) return x
      x = x.ouder
    }
    return null
  }

  private stat(s: Stat, o: Bereik): Sprong {
    this.tel(s.r)
    switch (s.t) {
      case 'uitdrukking': this.ev(s.w, o); return null
      case 'pass': case 'import': return null
      case 'zet': return this.zetten(s, o)
      case 'if':
        return this.waar(this.ev(s.test, o)) ? this.blok(s.dan, o) : this.blok(s.anders, o)
      case 'while': {
        while (this.waar(this.ev(s.test, o))) {
          this.tel(s.r)
          const w = this.blok(s.lijf, o)
          if (w === BREEK) break
          if (w && w !== DOOR) return w
        }
        return null
      }
      case 'for': {
        for (const x of this.rijVan(this.ev(s.bron, o), s.r)) {
          this.tel(s.r)
          o.vars[s.naam] = x
          const w = this.blok(s.lijf, o)
          if (w === BREEK) break
          if (w && w !== DOOR) return w
        }
        return null
      }
      case 'def':
        o.vars[s.naam] = { fn: true, naam: s.naam, args: s.args, lijf: s.lijf, sluit: o }
        return null
      case 'return': return new Terug(s.w ? this.ev(s.w, o) : null)
      case 'break': return BREEK
      case 'continue': return DOOR
    }
  }

  private zetten(s: { doel: Naam | Index; op: string; w: Uitdr; r: number }, o: Bereik): null {
    let w = this.ev(s.w, o)
    if (s.op !== '=') {
      const oud = this.ev(s.doel, o)
      w = this.reken(s.op.slice(0, -1), oud, w, s.r)
    }
    if (s.doel.t === 'naam') {
      const bestaat = this.vind(o, s.doel.w)
      ;(bestaat ?? o).vars[s.doel.w] = w
      return null
    }
    const houder = this.ev(s.doel.w, o)
    const i = this.ev(s.doel.i, o)
    if (Array.isArray(houder)) houder[this.index(houder, i, s.r)] = w
    else if (houder instanceof Map) houder.set(i, w)
    else throw fout(s.r, 'hier kun je niets in zetten')
    return null
  }

  private rijVan(w: Waarde, r: number): Waarde[] {
    if (Array.isArray(w)) return w
    if (typeof w === 'string') return w.split('')
    if (w instanceof Map) return [...w.keys()]
    throw fout(r, 'hier kun je niet doorheen lopen met een for-lus',
      'Dat kan met een lijst, met tekst, of met range(...).')
  }

  waar(w: Waarde): boolean {
    if (w === null || w === undefined || w === false) return false
    if (w === true) return true
    if (typeof w === 'number') return w !== 0
    if (typeof w === 'string') return w.length > 0
    if (Array.isArray(w)) return w.length > 0
    if (w instanceof Map) return w.size > 0
    return true
  }

  private index(rij: { length: number }, i: Waarde, r: number): number {
    if (typeof i !== 'number' || Math.floor(i) !== i) {
      throw fout(r, 'een plek in een lijst moet een heel getal zijn')
    }
    const k = i < 0 ? rij.length + i : i
    if (k < 0 || k >= rij.length) {
      throw fout(r, 'plek ' + i + ' bestaat niet; deze lijst heeft ' + rij.length + ' plekken',
        'Tellen begint bij 0, dus de laatste plek is ' + (rij.length - 1) + '.')
    }
    return k
  }

  private reken(op: string, a: Waarde, b: Waarde, r: number): Waarde {
    const getal = (x: Waarde): x is number => typeof x === 'number'
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b)
      if (getal(a) && getal(b)) return a + b
      if (typeof a === 'string' || typeof b === 'string') {
        throw fout(r, 'je probeert tekst en een getal bij elkaar op te tellen',
          'Zet het getal eerst om met str(...), of gebruik een f-string: f"score: {punten}"')
      }
      throw fout(r, 'deze twee dingen kun je niet optellen')
    }
    if (op === '*') {
      if (typeof a === 'string' && getal(b)) return a.repeat(Math.max(0, Math.floor(b)))
      if (getal(a) && typeof b === 'string') return b.repeat(Math.max(0, Math.floor(a)))
      if (Array.isArray(a) && getal(b)) {
        const u: Waarde[] = []
        for (let i = 0; i < Math.floor(b); i++) u.push(...a)
        return u
      }
      if (getal(a) && getal(b)) return a * b
      throw fout(r, 'deze twee dingen kun je niet vermenigvuldigen')
    }
    if (!getal(a) || !getal(b)) {
      throw fout(r, 'hier kun je alleen met getallen rekenen',
        'Er staat iets anders dan een getal in de som.')
    }
    if (op === '-') return a - b
    if (op === '/') {
      if (b === 0) throw fout(r, 'je deelt door nul', 'Delen door nul kan niet; vang dat af met een if.')
      return a / b
    }
    if (op === '//') { if (b === 0) throw fout(r, 'je deelt door nul'); return Math.floor(a / b) }
    if (op === '%') { if (b === 0) throw fout(r, 'je deelt door nul'); return ((a % b) + b) % b }
    if (op === '**') return Math.pow(a, b)
    throw fout(r, 'deze rekenstap ken ik niet: ' + op)
  }

  private gelijk(a: Waarde, b: Waarde): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((x, i) => this.gelijk(x, b[i] as Waarde))
    }
    return a === b
  }

  private ev(e: Uitdr, o: Bereik): Waarde {
    this.tel(e.r)
    switch (e.t) {
      case 'getal': case 'tekst': case 'waar': return e.w
      case 'niets': return null
      case 'ftekst': return this.fstring(e.w, e.r, o)
      case 'lijst': return e.w.map((x) => this.ev(x, o))
      case 'woordenboek': {
        const m = new Map<Waarde, Waarde>()
        for (const [k, v] of e.w) m.set(this.ev(k, o), this.ev(v, o))
        return m
      }
      case 'naam': {
        const b = this.vind(o, e.w)
        if (b) return b.vars[e.w] as Waarde
        if (INGEBOUWD.has(e.w)) return { ib: true, naam: e.w }
        if (e.w === 'random') return { mod: 'random' }
        throw fout(e.r, 'de naam "' + e.w + '" kent Python nog niet',
          'Je gebruikt hem voordat je hem gemaakt hebt — of er zit een typefout in.')
      }
      case 'min': {
        const w = this.ev(e.w, o)
        if (typeof w !== 'number') throw fout(e.r, 'een minteken werkt alleen bij getallen')
        return -w
      }
      case 'niet': return !this.waar(this.ev(e.w, o))
      case 'en': { const l = this.ev(e.l, o); return this.waar(l) ? this.ev(e.r2, o) : l }
      case 'of': { const l = this.ev(e.l, o); return this.waar(l) ? l : this.ev(e.r2, o) }
      case 'reken': return this.reken(e.op, this.ev(e.l, o), this.ev(e.r2, o), e.r)
      case 'verg': return this.vergelijk(e.op, this.ev(e.l, o), this.ev(e.r2, o), e.r)
      case 'index': return this.opIndex(this.ev(e.w, o), this.ev(e.i, o), e.r)
      case 'snee': return this.snijden(e, o)
      case 'punt': return { methode: true, op: this.ev(e.w, o), naam: e.naam, r: e.r }
      case 'roep': return this.roep(e.fn, e.args, e.r, o)
    }
  }

  private vergelijk(op: string, a: Waarde, b: Waarde, r: number): Waarde {
    if (op === '==') return this.gelijk(a, b)
    if (op === '!=') return !this.gelijk(a, b)
    if (op === 'in' || op === 'not in') {
      let hit: boolean
      if (typeof b === 'string') hit = typeof a === 'string' && b.includes(a)
      else if (Array.isArray(b)) hit = b.some((x) => this.gelijk(x, a))
      else if (b instanceof Map) hit = b.has(a)
      else throw fout(r, '"in" werkt bij tekst, een lijst of een woordenboek')
      return op === 'in' ? hit : !hit
    }
    if (typeof a !== typeof b || (typeof a !== 'number' && typeof a !== 'string')) {
      throw fout(r, 'deze twee dingen kun je niet met ' + op + ' vergelijken',
        'Vergelijk getallen met getallen en tekst met tekst.')
    }
    const y = b as number | string
    if (op === '<') return a < y
    if (op === '>') return a > y
    if (op === '<=') return a <= y
    return a >= y
  }

  private opIndex(w: Waarde, i: Waarde, r: number): Waarde {
    if (w instanceof Map) {
      if (!w.has(i)) {
        throw fout(r, 'de sleutel ' + this.toon(i) + ' staat niet in dit woordenboek',
          'Kijk met .get(sleutel) als je niet zeker weet of hij bestaat.')
      }
      return w.get(i) as Waarde
    }
    if (typeof w === 'string') return w[this.index(w.split(''), i, r)] as string
    if (Array.isArray(w)) return w[this.index(w, i, r)] as Waarde
    throw fout(r, 'hier kun je geen [ ] achter zetten')
  }

  private snijden(e: { w: Uitdr; van: Uitdr | null; tot: Uitdr | null; r: number }, o: Bereik): Waarde {
    const w = this.ev(e.w, o)
    if (!Array.isArray(w) && typeof w !== 'string') {
      throw fout(e.r, 'een stuk eruit snijden kan alleen bij tekst of een lijst')
    }
    const n = w.length
    let a = e.van === null ? 0 : this.ev(e.van, o)
    let b = e.tot === null ? n : this.ev(e.tot, o)
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw fout(e.r, 'de grenzen van een stuk moeten getallen zijn')
    }
    if (a < 0) a += n
    if (b < 0) b += n
    return (w as string).slice(Math.max(0, a), Math.max(0, b))
  }

  private fstring(s: string, r: number, o: Bereik): string {
    let uit = ''
    let i = 0
    while (i < s.length) {
      if (s[i] === '{') {
        if (s[i + 1] === '{') { uit += '{'; i += 2; continue }
        let d = 1
        let j = i + 1
        while (j < s.length && d > 0) {
          if (s[j] === '{') d++
          if (s[j] === '}') d--
          j++
        }
        if (d > 0) throw fout(r, 'er ontbreekt een } in de f-string')
        const stuk = s.slice(i + 1, j - 1)
        let deel = stuk
        let rond: number | null = null
        const m = stuk.match(/^(.*):\.(\d+)f$/)
        if (m) { deel = m[1] as string; rond = Number(m[2]) }
        let w: Waarde
        try {
          const eerste = ontleed(lees(deel))[0]
          if (!eerste || eerste.t !== 'uitdrukking') throw fout(r, 'deze regel is niet af')
          w = this.ev(eerste.w, o)
        } catch (err) {
          /* De fout kwam uit een stukje code binnen de tekst; het regelnummer
             daarvan zegt niets, dus we zetten dat van de f-string terug. */
          if (err instanceof MinipyFout) throw fout(r, err.message, err.tip)
          throw err
        }
        uit += rond !== null && typeof w === 'number' ? w.toFixed(rond) : this.toon(w)
        i = j
      } else if (s[i] === '}' && s[i + 1] === '}') { uit += '}'; i += 2 } else { uit += s[i]; i++ }
    }
    return uit
  }

  toon(w: Waarde): string {
    if (w === null || w === undefined) return 'None'
    if (w === true) return 'True'
    if (w === false) return 'False'
    if (typeof w === 'number') return String(w)
    if (typeof w === 'string') return w
    if (Array.isArray(w)) return '[' + w.map((x) => this.toonIn(x)).join(', ') + ']'
    if (w instanceof Map) {
      return '{' + [...w.entries()].map(([k, v]) => this.toonIn(k) + ': ' + this.toonIn(v)).join(', ') + '}'
    }
    if (isFunctie(w)) return '<functie ' + w.naam + '>'
    return String(w)
  }

  private toonIn(w: Waarde): string {
    return typeof w === 'string' ? "'" + w + "'" : this.toon(w)
  }

  private roep(fn: Uitdr, argUitdr: Uitdr[], r: number, o: Bereik): Waarde {
    const args = argUitdr.map((a) => this.ev(a, o))

    /* een methode: "iets.doe(...)" */
    if (fn.t === 'punt') return this.methode(this.ev(fn.w, o), fn.naam, args, r)

    const f = this.ev(fn, o)
    if (isIngebouwd(f)) return this.ingebouwd(f.naam, args, r)
    if (isFunctie(f)) {
      if (args.length !== f.args.length) {
        throw fout(r, 'de functie ' + f.naam + ' wil ' + f.args.length + ' '
          + (f.args.length === 1 ? 'ding' : 'dingen') + ' tussen de haakjes, maar je geeft er ' + args.length,
        'Kijk bij "def ' + f.naam + '(' + f.args.join(', ') + ')" hoeveel er horen.')
      }
      const nieuw: Bereik = { vars: Object.create(null) as Record<string, Waarde>, ouder: f.sluit }
      f.args.forEach((a, i) => { nieuw.vars[a] = args[i] as Waarde })
      const w = this.blok(f.lijf, nieuw)
      return w instanceof Terug ? w.w : null
    }
    throw fout(r, 'dit is geen functie, dus je kunt er geen ( ) achter zetten')
  }

  private methode(doel: Waarde, naam: string, args: Waarde[], r: number): Waarde {
    if (isModule(doel)) return this.random(naam, args, r)
    if (typeof doel === 'string') return this.opTekst(doel, naam, args, r)
    if (Array.isArray(doel)) return this.opLijst(doel, naam, args, r)
    if (doel instanceof Map) return this.opWoordenboek(doel, naam, args, r)
    throw fout(r, 'hier kun je geen .' + naam + '(...) achter zetten')
  }

  private random(naam: string, args: Waarde[], r: number): Waarde {
    if (naam === 'randint') {
      const a = args[0] as number
      const b = args[1] as number
      return Math.floor(this.toeval() * (b - a + 1)) + a
    }
    if (naam === 'choice') {
      const rij = args[0] as Waarde[]
      return rij[Math.floor(this.toeval() * rij.length)] as Waarde
    }
    if (naam === 'random') return this.toeval()
    if (naam === 'shuffle') {
      const a = args[0] as Waarde[]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.toeval() * (i + 1))
        ;[a[i], a[j]] = [a[j] as Waarde, a[i] as Waarde]
      }
      return null
    }
    throw fout(r, 'random kent "' + naam + '" niet', 'Er is randint, choice, random en shuffle.')
  }

  private opTekst(s: string, naam: string, a: Waarde[], r: number): Waarde {
    switch (naam) {
      case 'upper': return s.toUpperCase()
      case 'lower': return s.toLowerCase()
      case 'strip': return s.trim()
      case 'split': return a.length ? s.split(a[0] as string) : s.split(/\s+/).filter((x) => x)
      case 'replace': return s.split(a[0] as string).join(a[1] as string)
      case 'startswith': return s.startsWith(a[0] as string)
      case 'endswith': return s.endsWith(a[0] as string)
      case 'find': return s.indexOf(a[0] as string)
      case 'count': return a[0] === '' ? 0 : s.split(a[0] as string).length - 1
      case 'join': return (a[0] as Waarde[]).map((x) => this.toon(x)).join(s)
      case 'isdigit': return /^[0-9]+$/.test(s)
      case 'title': return s.replace(/\w\S*/g, (w) => (w[0] as string).toUpperCase() + w.slice(1).toLowerCase())
    }
    throw fout(r, 'tekst kent "' + naam + '" niet',
      'Bij tekst kan onder andere: upper, lower, strip, split, replace, startswith, count.')
  }

  private opLijst(doel: Waarde[], naam: string, a: Waarde[], r: number): Waarde {
    switch (naam) {
      case 'append': doel.push(a[0] as Waarde); return null
      case 'pop': {
        if (!doel.length) throw fout(r, 'je haalt iets uit een lege lijst')
        return a.length ? doel.splice(this.index(doel, a[0] as Waarde, r), 1)[0] as Waarde : doel.pop() as Waarde
      }
      case 'insert': doel.splice(a[0] as number, 0, a[1] as Waarde); return null
      case 'remove': {
        const i = doel.findIndex((x) => this.gelijk(x, a[0] as Waarde))
        if (i < 0) throw fout(r, 'dat staat niet in de lijst')
        doel.splice(i, 1)
        return null
      }
      case 'sort': doel.sort(jsOrde); return null
      case 'reverse': doel.reverse(); return null
      case 'index': {
        const i = doel.findIndex((x) => this.gelijk(x, a[0] as Waarde))
        if (i < 0) throw fout(r, 'dat staat niet in de lijst')
        return i
      }
      case 'count': return doel.filter((x) => this.gelijk(x, a[0] as Waarde)).length
      case 'clear': doel.length = 0; return null
    }
    throw fout(r, 'een lijst kent "' + naam + '" niet',
      'Bij een lijst kan onder andere: append, pop, insert, remove, sort, reverse, count.')
  }

  private opWoordenboek(doel: Map<Waarde, Waarde>, naam: string, a: Waarde[], r: number): Waarde {
    switch (naam) {
      case 'keys': return [...doel.keys()]
      case 'values': return [...doel.values()]
      case 'items': return [...doel.entries()].map(([k, v]) => [k, v])
      case 'get': return doel.has(a[0] as Waarde) ? doel.get(a[0] as Waarde) as Waarde : (a.length > 1 ? a[1] as Waarde : null)
      case 'pop': {
        const w = doel.get(a[0] as Waarde)
        doel.delete(a[0] as Waarde)
        return w === undefined ? null : w
      }
    }
    throw fout(r, 'een woordenboek kent "' + naam + '" niet', 'Er is keys, values, items, get en pop.')
  }

  private ingebouwd(naam: string, a: Waarde[], r: number): Waarde {
    switch (naam) {
      case 'print': this.schrijf(a.map((x) => this.toon(x)).join(' ')); return null
      case 'input': {
        if (!this.invoer.length) {
          throw fout(r, 'je programma vraagt om invoer, maar er is niets ingevuld',
            'Zet je antwoorden in het vak "Wat jij intypt", elk op een eigen regel.')
        }
        const w = this.invoer.shift() as string
        /* Net als in een echte terminal: de vraag en het antwoord op één regel,
           zodat je terugleest wat er gevraagd is en wat erop volgde. */
        this.schrijf((a.length ? this.toon(a[0] as Waarde) : '') + w)
        return w
      }
      case 'len':
        if (typeof a[0] === 'string' || Array.isArray(a[0])) return a[0].length
        if (a[0] instanceof Map) return a[0].size
        throw fout(r, 'len() werkt bij tekst, een lijst of een woordenboek')
      case 'str': return this.toon(a[0] as Waarde)
      case 'int': {
        if (typeof a[0] === 'number') return Math.trunc(a[0])
        if (typeof a[0] === 'boolean') return a[0] ? 1 : 0
        const n = parseInt(String(a[0]).trim(), 10)
        if (isNaN(n)) {
          throw fout(r, '"' + String(a[0]) + '" kan geen getal worden',
            'int() lukt alleen als er echt cijfers staan.')
        }
        return n
      }
      case 'float': {
        const n = parseFloat(String(a[0]).replace(',', '.'))
        if (isNaN(n)) throw fout(r, '"' + String(a[0]) + '" kan geen kommagetal worden')
        return n
      }
      case 'bool': return this.waar(a[0] as Waarde)
      case 'abs': return Math.abs(a[0] as number)
      case 'round': return a.length > 1 ? +(a[0] as number).toFixed(a[1] as number) : Math.round(a[0] as number)
      case 'min': return (a.length === 1 ? a[0] as Waarde[] : a).reduce((x, y) => (jsKleiner(y, x) ? y : x))
      case 'max': return (a.length === 1 ? a[0] as Waarde[] : a).reduce((x, y) => (jsGroter(y, x) ? y : x))
      case 'sum': return (a[0] as number[]).reduce((x, y) => x + y, 0)
      case 'sorted': {
        const w = (a[0] as Waarde[]).slice()
        w.sort(jsOrde)
        return w
      }
      case 'reversed': return (a[0] as Waarde[]).slice().reverse()
      case 'list': return this.rijVan(a[0] as Waarde, r).slice()
      case 'range': {
        let van = 0
        let tot = a[0] as number
        let stap = 1
        if (a.length >= 2) { van = a[0] as number; tot = a[1] as number }
        if (a.length >= 3) stap = a[2] as number
        if (stap === 0) throw fout(r, 'de stap van range() mag geen 0 zijn')
        const u: number[] = []
        const teGroot = (): void => { if (u.length > 200_000) throw fout(r, 'dit bereik is veel te groot') }
        if (stap > 0) for (let i = van; i < tot; i += stap) { u.push(i); teGroot() } else for (let i = van; i > tot; i += stap) { u.push(i); teGroot() }
        return u
      }
      case 'enumerate': return this.rijVan(a[0] as Waarde, r).map((x, i) => [i, x])
      case 'type': return this.soortVan(a[0] as Waarde)
    }
    throw fout(r, 'de functie ' + naam + ' ken ik niet')
  }

  private soortVan(w: Waarde): string {
    if (typeof w === 'number') return Number.isInteger(w) ? 'int' : 'float'
    if (typeof w === 'string') return 'str'
    if (typeof w === 'boolean') return 'bool'
    if (Array.isArray(w)) return 'list'
    if (w instanceof Map) return 'dict'
    return 'None'
  }
}
