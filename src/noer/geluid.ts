/**
 * GELUID — tonen, stem en opnames
 *
 * Drie dingen die niets met elkaar te maken hebben behalve dat ze allemaal uit
 * de luidspreker komen.
 *
 * DE TONEN zijn met Web Audio gemaakt en niet met bestanden: geen downloads,
 * werkt offline, en een goed antwoord klinkt overal hetzelfde.
 *
 * DE STEM komt uit de browser zelf. Drie dingen bepalen of het Arabisch
 * bruikbaar klinkt, en alle drie zijn instelbaar omdat ze per toestel anders
 * uitpakken: wélke stem (op een iPhone staat standaard de compacte Arabische
 * stem; de verbeterde moet je apart downloaden), mét of zonder klinkertekens
 * (sommige stemmen struikelen erover), en in stukjes (een lange zin in één
 * keer gaat mis).
 *
 * DE OPNAMES gaan naar IndexedDB op dit toestel. Er wordt niets verstuurd.
 */

/* ------------------------------------------------------------- de tonen -- */

export type Toon = 'goed' | 'mis' | 'top' | 'tik'

let ac: AudioContext | null = null

/** Een kort tooltje. Zwijgt netjes als de browser niet meewerkt. */
export function toon(soort: Toon, aan: boolean): void {
  if (!aan) return
  try {
    const AC = window.AudioContext
    if (!AC) return
    ac = ac ?? new AC()
    if (ac.state === 'suspended') void ac.resume()
    const t0 = ac.currentTime
    const noten: Array<[number, number]> = soort === 'goed'
      ? [[660, 0], [990, 0.10]]
      : soort === 'top' ? [[523, 0], [659, 0.09], [784, 0.18], [1047, 0.27]]
        : soort === 'tik' ? [[880, 0]] : [[220, 0]]
    for (const [f, dt] of noten) {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = soort === 'mis' ? 'square' : 'sine'
      o.frequency.value = f
      const duur = soort === 'mis' ? 0.24 : soort === 'tik' ? 0.07 : 0.17
      g.gain.setValueAtTime(0.0001, t0 + dt)
      g.gain.exponentialRampToValueAtTime(soort === 'tik' ? 0.07 : 0.13, t0 + dt + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + duur)
      o.connect(g)
      g.connect(ac.destination)
      o.start(t0 + dt)
      o.stop(t0 + dt + duur + 0.02)
    }
  } catch { /* geen geluid is geen fout */ }
}

/* -------------------------------------------------------------- de stem -- */

/** De klinkertekens eraf, voor de stemmen die er niet tegen kunnen. */
export const kaal = (t: string): string =>
  String(t || '').replace(/[ً-ْٰۖ-ۭ]/g, '').replace(/\s+/g, ' ').trim()

export interface Steminstellingen {
  stem: boolean
  arStem: string
  harakat: boolean
  arTempo: number
}

class Stemmen {
  nl: SpeechSynthesisVoice | null = null
  ar: SpeechSynthesisVoice | null = null
  arLijst: SpeechSynthesisVoice[] = []
  klaar = false

  /** De beste beschikbare stemmen zoeken. Mag meermaals; stemmen komen laat. */
  zoek(voorkeurNaam = ''): void {
    try {
      const ss = window.speechSynthesis
      if (!ss) return
      const vs = ss.getVoices() ?? []
      if (!vs.length) return
      this.nl = vs.find((v) => /nl[-_]NL/i.test(v.lang)) ?? vs.find((v) => /^nl/i.test(v.lang)) ?? null
      this.arLijst = vs.filter((v) => /^ar/i.test(v.lang))
      this.ar = (voorkeurNaam ? this.arLijst.find((v) => v.name === voorkeurNaam) : null)
        ?? this.arLijst.find((v) => /enhanced|premium|verbeterd|neural/i.test(v.name))
        ?? this.arLijst.find((v) => /ar[-_]SA/i.test(v.lang))
        ?? this.arLijst[0] ?? null
      this.klaar = true
    } catch { /* een browser zonder stemmen mag de app niet stukmaken */ }
  }

  heeftAr(): boolean { return this.ar !== null }

  /** Arabisch in stukjes van vier woorden: één doorlopende zin met rustpunten. */
  zegAr(tekst: string, inst: Steminstellingen, tempo = 1, klaar?: () => void): void {
    if (!inst.stem || !this.ar) { klaar?.(); return }
    try {
      const ss = window.speechSynthesis
      if (!ss || !tekst) { klaar?.(); return }
      ss.cancel()
      const bron = inst.harakat ? String(tekst) : kaal(tekst)
      const woorden = bron.replace(/\s+/g, ' ').trim().split(' ')
      const stukjes: string[] = []
      for (let i = 0; i < woorden.length; i += 4) stukjes.push(woorden.slice(i, i + 4).join(' '))
      const snelheid = Math.max(0.4, Math.min(1.2, (inst.arTempo || 0.85) * tempo))
      stukjes.forEach((st, i) => {
        const u = new SpeechSynthesisUtterance(st)
        u.lang = this.ar?.lang ?? 'ar-SA'
        if (this.ar) u.voice = this.ar
        u.rate = snelheid
        u.pitch = 1
        if (klaar && i === stukjes.length - 1) { u.onend = klaar; u.onerror = klaar }
        ss.speak(u)
      })
    } catch { klaar?.() }
  }

  zegNL(tekst: string, aan: boolean, tempo = 0.98): void {
    if (!aan) return
    try {
      const ss = window.speechSynthesis
      if (!ss || !tekst) return
      ss.cancel()
      const u = new SpeechSynthesisUtterance(String(tekst))
      u.lang = 'nl-NL'
      if (this.nl) u.voice = this.nl
      u.rate = tempo
      u.pitch = 1
      ss.speak(u)
    } catch { /* stil is ook goed */ }
  }

  stop(): void {
    try { window.speechSynthesis?.cancel() } catch { /* niets */ }
  }
}

export const STEM = new Stemmen()

/* --------------------------------------------------------- de fragmenten --
   Er zijn drie bronnen, in deze volgorde:
     1. een opname die thuis zelf is ingesproken (staat in dit toestel);
     2. een meegeleverd recitatie- of stemfragment uit public/noer/audio/;
     3. de stem van het toestel — het noodvangnet, standaard uit.
   Elk stukje tekst heeft een eigen kenmerk: `q:<tekst>:<regel>` voor de Koran
   en de gebedsteksten, `t:<naam>` voor de losse zinnen, `d:<nummer>` voor de
   du'a's van de dag. */

const MAP = '/noer/audio/'

class Fragmenten {
  private db: IDBDatabase | null = null
  private lijst = new Set<string>()
  private eigenMee: Record<string, string> = {}
  private stemMee: Record<string, string> = {}
  private eigen = new Set<string>()
  private speler: HTMLAudioElement | null = null
  private merk: object | null = null
  ontgrendeld = false

  private async open(): Promise<IDBDatabase | null> {
    if (this.db) return this.db
    this.db = await new Promise<IDBDatabase | null>((res) => {
      try {
        const v = indexedDB.open('bidaya-stem', 1)
        v.onupgradeneeded = () => { v.result.createObjectStore('opnames') }
        v.onsuccess = () => res(v.result)
        v.onerror = () => res(null)
      } catch { res(null) }
    })
    return this.db
  }

  private async doe<T>(modus: IDBTransactionMode, f: (o: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
    const db = await this.open()
    if (!db) return null
    return new Promise((res) => {
      const v = f(db.transaction('opnames', modus).objectStore('opnames'))
      v.onsuccess = () => res(v.result)
      v.onerror = () => res(null)
    })
  }

  async zet(id: string, blob: Blob): Promise<void> {
    await this.doe('readwrite', (o) => o.put(blob, id))
    this.eigen.add(id)
  }

  async haal(id: string): Promise<Blob | null> {
    return this.eigen.has(id) ? await this.doe<Blob>('readonly', (o) => o.get(id)) : null
  }

  async weg(id: string): Promise<void> {
    await this.doe('readwrite', (o) => o.delete(id))
    this.eigen.delete(id)
  }

  eigenIds(): string[] { return [...this.eigen] }

  /** De lijstjes met wat er meegeleverd is inlezen. Ontbreken ze, dan is de map leeg. */
  async lees(): Promise<void> {
    const ids = await this.doe<IDBValidKey[]>('readonly', (o) => o.getAllKeys())
    this.eigen = new Set((ids ?? []).map(String))
    const laad = async (pad: string): Promise<unknown> => {
      try {
        const r = await fetch(MAP + pad, { cache: 'no-cache' })
        return r.ok ? await r.json() : null
      } catch { return null }
    }
    const q = await laad('quran/lijst.json') as { fragmenten?: string[] } | null
    if (q?.fragmenten) this.lijst = new Set(q.fragmenten)
    const e = await laad('eigen/lijst.json') as { bestanden?: Record<string, string> } | null
    if (e?.bestanden) this.eigenMee = e.bestanden
    const s = await laad('stem/lijst.json') as { bestanden?: Record<string, string> } | null
    if (s?.bestanden) this.stemMee = s.bestanden
  }

  /** Een meegeleverde opname van thuis gaat vóór op de recitatie: bij de zinnen
   *  van het gebed is de stem van je eigen vader nu eenmaal de bedoeling. */
  bestand(id: string): string | null {
    if (this.eigenMee[id]) return MAP + 'eigen/' + this.eigenMee[id]
    if (this.lijst.has(id)) return MAP + 'quran/' + id.slice(2).replace(':', '-') + '.mp3'
    if (this.stemMee[id]) return MAP + 'stem/' + this.stemMee[id]
    return null
  }

  heeft(id: string): boolean {
    return this.eigen.has(id) || Boolean(this.eigenMee[id]) || this.lijst.has(id) || Boolean(this.stemMee[id])
  }

  /* Een telefoon speelt geen geluid af dat niet uit een aanraking voortkomt.
     Daarom maken we bij de eerste tik één speler wakker met een stukje stilte;
     daarna mag diezelfde speler ook uit zichzelf beginnen. */
  ontgrendel(): void {
    if (this.ontgrendeld) return
    try {
      this.speler = this.speler ?? new Audio()
      this.speler.src = 'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA'
      const p = this.speler.play()
      if (p?.then) void p.then(() => { this.speler?.pause(); this.ontgrendeld = true }).catch(() => {})
      else this.ontgrendeld = true
    } catch { /* dan wacht het geluid op de volgende tik */ }
  }

  /* Stil maken en stoppen zijn twee verschillende dingen. Binnen een reeks moet
     het vorige fragment stil worden zonder dat de reeks zelf wordt afgebroken;
     alleen een echte stopknop breekt de reeks af. */
  private stil(): void {
    try {
      if (this.speler) { this.speler.pause(); this.speler.currentTime = 0 }
    } catch { /* niets */ }
    STEM.stop()
  }

  stop(): void { this.merk = null; this.stil() }

  private speelUrl(url: string, tempo: number, opruimen = false): Promise<void> {
    return new Promise((res) => {
      this.speler = this.speler ?? new Audio()
      const a = this.speler
      a.src = url
      a.playbackRate = Math.max(0.5, Math.min(1.5, tempo / 0.85))
      const af = (): void => {
        a.onended = null
        a.onerror = null
        if (opruimen) setTimeout(() => URL.revokeObjectURL(url), 1000)
        res()
      }
      a.onended = af
      a.onerror = af
      const p = a.play()
      if (p?.catch) void p.catch(() => af())
    })
  }

  /** Eén stukje laten horen. Geeft terug wanneer het afgelopen is. */
  async speel(
    id: string | null, arTekst: string, inst: Steminstellingen & { alleenEcht: boolean },
    meld?: (t: string) => void,
  ): Promise<void> {
    this.stil()
    if (id) {
      const eigen = await this.haal(id)
      if (eigen) return this.speelUrl(URL.createObjectURL(eigen), inst.arTempo, true)
      const f = this.bestand(id)
      if (f) return this.speelUrl(f, inst.arTempo)
    }
    /* De stem van de telefoon is nadrukkelijk niet de bedoeling bij Arabisch:
       hij legt klemtonen verkeerd en leest de Koran als een voorleesrobot.
       Zolang `alleenEcht` aanstaat — en dat is standaard — blijft het liever
       stil, met een regel erbij die zegt wat eraan te doen is. */
    if (inst.alleenEcht) {
      meld?.('Van dit stukje is nog geen opname. Neem het in bij Ouder → Eigen stem opnemen.')
      return
    }
    return new Promise((res) => STEM.zegAr(arTekst, inst, 1, () => res()))
  }

  /** Een rij fragmenten achter elkaar. Stopt zodra er iets anders begint. */
  async speelReeks(
    rijen: Array<[string | null, string]>,
    inst: Steminstellingen & { alleenEcht: boolean },
    meld?: (t: string) => void,
  ): Promise<void> {
    const merk = {}
    this.merk = merk
    for (const [id, ar] of rijen) {
      if (this.merk !== merk) return
      await this.speel(id, ar, inst, meld)
      if (this.merk !== merk) return
      await new Promise((r) => setTimeout(r, 260))
    }
  }
}

export const AUDIO = new Fragmenten()

/* ------------------------------------------------------------- opnemen --
   Jezelf horen is de snelste manier om je uitspraak te verbeteren. We nemen op
   in het geheugen en spelen terug; er wordt niets verstuurd. */

class Opnemer {
  private rec: MediaRecorder | null = null
  private brokken: Blob[] = []
  bezig = false

  kan(): boolean {
    return Boolean(navigator.mediaDevices && 'MediaRecorder' in window)
  }

  /* Elk toestel neemt in zijn eigen formaat op: Safari levert mp4, Chrome en
     Firefox leveren webm. Welk formaat het is, moet je van de recorder zélf
     overnemen — noem je het verkeerd, dan slaat het bestand wel op maar weigert
     de speler het af te spelen. */
  async start(): Promise<void> {
    const stroom = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.brokken = []
    let opties: MediaRecorderOptions = {}
    for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']) {
      try {
        if (MediaRecorder.isTypeSupported?.(t)) { opties = { mimeType: t }; break }
      } catch { /* dan de volgende */ }
    }
    this.rec = new MediaRecorder(stroom, opties)
    this.rec.ondataavailable = (e) => { if (e.data?.size) this.brokken.push(e.data) }
    this.rec.onstop = () => stroom.getTracks().forEach((t) => t.stop())
    this.rec.start()
    this.bezig = true
  }

  /** Geeft het opgenomen fragment terug, met het juiste soortlabel erop. */
  stop(): Promise<Blob | null> {
    return new Promise((res) => {
      const r = this.rec
      if (!r) { this.bezig = false; res(null); return }
      r.addEventListener('stop', () => {
        this.bezig = false
        const soort = (r.mimeType || 'audio/webm').split(';')[0] as string
        res(this.brokken.length ? new Blob(this.brokken, { type: soort }) : null)
      }, { once: true })
      try { r.stop() } catch { this.bezig = false; res(null) }
    })
  }
}

export const OPNAME = new Opnemer()
