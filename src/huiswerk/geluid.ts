/**
 * GELUID EN VOORLEZEN
 *
 * Twee tonen, zelfgemaakt met Web Audio: geen bestanden, dus het werkt ook
 * offline en het kost niets aan laadtijd. Goed is een tweeklank omhoog, fout
 * één lage blokgolf — kort genoeg om niet te vertragen.
 *
 * Het voorlezen gaat via de stem van het toestel. Wiskundige tekens moeten
 * eerst uitgesproken worden: "√" leest een stem niet voor, "wortel" wel.
 */

let audio: AudioContext | null = null

export function speel(soort: 'goed' | 'fout', aan: boolean): void {
  if (!aan) return
  try {
    const AC = window.AudioContext
    if (!AC) return
    audio ??= new AC()
    const ac = audio
    if (ac.state === 'suspended') void ac.resume()
    const t0 = ac.currentTime
    const noten: Array<[number, number]> = soort === 'goed' ? [[660, 0], [990, 0.10]] : [[220, 0]]
    for (const [f, dt] of noten) {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = soort === 'goed' ? 'sine' : 'square'
      o.frequency.value = f
      const duur = soort === 'goed' ? 0.18 : 0.26
      g.gain.setValueAtTime(0.0001, t0 + dt)
      g.gain.exponentialRampToValueAtTime(0.14, t0 + dt + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + duur)
      o.connect(g)
      g.connect(ac.destination)
      o.start(t0 + dt)
      o.stop(t0 + dt + duur + 0.02)
    }
  } catch { /* een toestel dat geen geluid wil maken hoort het oefenen niet te stoppen */ }
}

/** Wiskundige tekens uitspreekbaar maken. */
export function spreekbaar(t: unknown): string {
  return String(t ?? '')
    .replace(/√/g, ' wortel ').replace(/²/g, ' kwadraat ').replace(/³/g, ' tot de derde ')
    .replace(/×/g, ' keer ').replace(/÷/g, ' gedeeld door ').replace(/·/g, ' keer ')
    .replace(/−/g, ' min ').replace(/π/g, ' pi ').replace(/°/g, ' graden ')
    .replace(/€\s?/g, ' euro ').replace(/\s+/g, ' ').trim()
}

let nlStem: SpeechSynthesisVoice | null = null

function zoekStem(): SpeechSynthesisVoice | null {
  try {
    const vs = speechSynthesis.getVoices() || []
    nlStem = vs.find((v) => /nl[-_]NL/i.test(v.lang))
      ?? vs.find((v) => /^nl/i.test(v.lang))
      ?? nlStem
  } catch { /* geen stemmen op dit toestel */ }
  return nlStem
}

/** De stemmenlijst komt op sommige browsers pas ná het eerste verzoek binnen. */
export function stemKlaarzetten(): void {
  try {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.addEventListener('voiceschanged', () => { zoekStem() })
    zoekStem()
  } catch { /* niets aan de hand */ }
}

export function leesVoor(tekst: string, aan: boolean): void {
  if (!aan) return
  try {
    if (!('speechSynthesis' in window)) return
    const txt = spreekbaar(tekst)
    if (!txt) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(txt)
    u.lang = 'nl-NL'
    u.rate = 0.95
    u.pitch = 1
    const stem = nlStem ?? zoekStem()
    if (stem) u.voice = stem
    speechSynthesis.speak(u)
  } catch { /* een stem die weigert mag de oefening niet stilzetten */ }
}

export function stopVoorlezen(): void {
  try {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  } catch { /* niets aan de hand */ }
}
