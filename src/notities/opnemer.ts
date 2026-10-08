/**
 * DE OPNEMER
 *
 * Neemt op en zet elke dertig seconden een blok in de opslag. Dat is de hele
 * verdediging tegen iOS: Safari kan de microfoon stilzetten als het scherm op
 * slot gaat, en wat dan al boven staat is veilig. Een wake lock houdt het
 * scherm intussen wakker.
 *
 * De blokken gaan strikt op volgorde naar boven, want de worker plakt ze
 * achter elkaar tot één bestand: alleen het eerste blok draagt de kop van het
 * formaat. Een mislukte upload wordt dus herhaald tot hij lukt, en het volgende
 * blok wacht.
 */
import { db } from './verbinding'

export const BLOK_MS = 30_000

export interface Formaat { mime: string; ext: string; type: string }

export function kiesFormaat(): Formaat {
  const opties: Formaat[] = [
    { mime: 'audio/webm;codecs=opus', ext: 'webm', type: 'audio/webm' },
    { mime: 'audio/mp4', ext: 'mp4', type: 'audio/mp4' },
    { mime: 'audio/webm', ext: 'webm', type: 'audio/webm' },
  ]
  const kan = (m: string): boolean =>
    typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
    && MediaRecorder.isTypeSupported(m)
  return opties.find((o) => kan(o.mime)) ?? { mime: '', ext: 'webm', type: 'audio/webm' }
}

/** Het pad van blok n: op naam gesorteerd is dat ook op volgorde, tot 99.999 blokken. */
export const blokPad = (uid: string, noteId: string, n: number, ext: string): string =>
  `${uid}/${noteId}/chunk-${String(n).padStart(5, '0')}.${ext}`

const wacht = (ms: number): Promise<void> => new Promise((k) => setTimeout(k, ms))

interface Terugmeldingen {
  niveau?: (n: number) => void
  wachtrij?: (n: number) => void
  melding?: (m: string | null) => void
}

export class Opnemer {
  private wachtrijLijst: Array<{ pad: string; blob: Blob }> = []
  private teller = 0
  private uploaden = false
  private slot: WakeLockSentinel | null = null
  private stroom: MediaStream | null = null
  private rec: MediaRecorder | null = null
  private klank: AudioContext | null = null
  private gestopt: Promise<void> = Promise.resolve()
  private formaat: Formaat = kiesFormaat()
  private uid = ''
  private noteId = ''
  private zichtbaar = (): void => {
    if (document.visibilityState === 'visible' && this.rec?.state === 'recording') void this.houdWakker()
  }

  constructor(private readonly terug: Terugmeldingen) {}

  get openstaand(): number { return this.wachtrijLijst.length }
  get bezig(): boolean { return this.uploaden }

  async start(uid: string, noteId: string): Promise<void> {
    this.uid = uid
    this.noteId = noteId
    this.stroom = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    const rec = new MediaRecorder(this.stroom, {
      ...(this.formaat.mime ? { mimeType: this.formaat.mime } : {}),
      audioBitsPerSecond: 32_000,
    })
    this.rec = rec
    rec.ondataavailable = (e) => { if (e.data.size) this.inWachtrij(e.data) }
    this.gestopt = new Promise((k) => { rec.onstop = () => k() })
    rec.start(BLOK_MS)
    this.meter()
    await this.houdWakker()
    document.addEventListener('visibilitychange', this.zichtbaar)
  }

  private async houdWakker(): Promise<void> {
    try { this.slot = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* niet ondersteund */ }
  }

  /** Het niveau voor de ring om de knop. Mislukt dit, dan neemt hij toch op. */
  private meter(): void {
    try {
      const Klank = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Klank || !this.stroom) return
      this.klank = new Klank()
      const an = this.klank.createAnalyser()
      an.fftSize = 512
      this.klank.createMediaStreamSource(this.stroom).connect(an)
      const buf = new Uint8Array(an.fftSize)
      const tik = (): void => {
        if (!this.rec || this.rec.state === 'inactive') return
        an.getByteTimeDomainData(buf)
        let som = 0
        for (const v of buf) som += ((v - 128) / 128) ** 2
        this.terug.niveau?.(Math.min(1, Math.sqrt(som / buf.length) * 4))
        requestAnimationFrame(tik)
      }
      tik()
    } catch { /* de meter is versiering */ }
  }

  private inWachtrij(blob: Blob): void {
    this.teller += 1
    this.wachtrijLijst.push({ pad: blokPad(this.uid, this.noteId, this.teller, this.formaat.ext), blob })
    this.terug.wachtrij?.(this.wachtrijLijst.length)
    void this.pomp()
  }

  async pomp(): Promise<void> {
    if (this.uploaden) return
    this.uploaden = true
    let poging = 0
    while (this.wachtrijLijst.length) {
      const eerste = this.wachtrijLijst[0]
      if (!eerste) break
      const { error } = await db().storage.from('audio')
        .upload(eerste.pad, eerste.blob, { contentType: this.formaat.type, upsert: true })
      if (error) {
        poging += 1
        this.terug.melding?.(`Uploaden mislukt, nieuwe poging. (${error.message})`)
        await wacht(Math.min(30_000, 1000 * 2 ** poging))
        continue
      }
      poging = 0
      this.terug.melding?.(null)
      this.wachtrijLijst.shift()
      this.terug.wachtrij?.(this.wachtrijLijst.length)
      /* Ook een teken van leven voor de worker: een opname die drie uur niets
         meer bijwerkt, wordt als afgebroken behandeld en alsnog verwerkt. */
      void db().from('notes').update({ duur_sec: Math.round((this.teller * BLOK_MS) / 1000) }).eq('id', this.noteId)
    }
    this.uploaden = false
  }

  /** Stopt en wacht tot alles boven staat. Geeft true als de wachtrij leeg is. */
  async stop(maxWachtMs = 120_000): Promise<boolean> {
    if (this.rec && this.rec.state !== 'inactive') this.rec.stop()
    await this.gestopt
    this.stroom?.getTracks().forEach((t) => t.stop())
    void this.klank?.close().catch(() => {})
    void this.slot?.release().catch(() => {})
    document.removeEventListener('visibilitychange', this.zichtbaar)
    const tot = Date.now() + maxWachtMs
    while ((this.wachtrijLijst.length || this.uploaden) && Date.now() < tot) await wacht(300)
    return this.wachtrijLijst.length === 0
  }
}
