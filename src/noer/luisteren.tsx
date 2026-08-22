/**
 * LUISTEREN — de tekstblokken met hun knoppen
 *
 * Elk stukje tekst dat je kunt horen ziet er hetzelfde uit: het Arabisch groot,
 * de klank eronder, de betekenis eronder, en rechts twee knoppen. Het bolletje
 * op de linkerknop zegt of er een échte opname is; zonder opname blijft het
 * standaard stil, want de stem van de telefoon leest de Koran als een
 * voorleesrobot en dat is nadrukkelijk niet de bedoeling.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AUDIO, STEM } from './geluid'
import type { Steminstellingen } from './geluid'
import type { Instellingen } from './opslag'
import { HIFZ } from './gegevens/hifz'

export interface Geluid {
  inst: Instellingen
  /** Speelt één fragment; `id` is het kenmerk, `ar` de tekst als vangnet. */
  speel: (id: string | null, ar: string) => void
  speelReeks: (rijen: Array<[string | null, string]>) => void
  zegNL: (t: string) => void
  stop: () => void
  /** Is er van dit kenmerk een echte opname? */
  heeft: (id: string) => boolean
  /** Kan de app dit stukje überhaupt laten horen? */
  kan: (id: string) => boolean
  meld: (t: string) => void
}

const Doos = createContext<Geluid | null>(null)

export const useGeluid = (): Geluid => {
  const g = useContext(Doos)
  if (!g) throw new Error('useGeluid buiten een Geluidbron')
  return g
}

export function Geluidbron(
  { inst, meld, children }: { inst: Instellingen; meld: (t: string) => void; children: ReactNode },
): ReactNode {
  const [, hertekenen] = useState(0)

  /* De stemmen komen niet meteen binnen; de browser meldt het als ze er zijn. */
  useEffect(() => {
    const zoek = (): void => { STEM.zoek(inst.arStem); hertekenen((n) => n + 1) }
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = zoek
        zoek()
      }
    } catch { /* een browser zonder stemmen mag de app niet stukmaken */ }
    void AUDIO.lees().then(() => hertekenen((n) => n + 1))
    /* Een telefoon speelt geen geluid af dat niet uit een aanraking voortkomt. */
    const wakker = (): void => AUDIO.ontgrendel()
    for (const g of ['pointerdown', 'touchstart', 'click']) {
      addEventListener(g, wakker, { passive: true })
    }
    return () => {
      for (const g of ['pointerdown', 'touchstart', 'click']) removeEventListener(g, wakker)
    }
  }, [inst.arStem])

  const stem: Steminstellingen & { alleenEcht: boolean } = {
    stem: inst.stem, arStem: inst.arStem, harakat: inst.harakat,
    arTempo: inst.arTempo, alleenEcht: inst.alleenEcht,
  }

  const waarde: Geluid = {
    inst,
    speel: useCallback((id, ar) => { void AUDIO.speel(id, ar, stem, meld) },
      [inst.arTempo, inst.alleenEcht, inst.harakat, inst.stem, meld]),
    speelReeks: useCallback((rijen) => { void AUDIO.speelReeks(rijen, stem, meld) },
      [inst.arTempo, inst.alleenEcht, inst.harakat, inst.stem, meld]),
    zegNL: useCallback((t) => STEM.zegNL(t, inst.stem, inst.tempo), [inst.stem, inst.tempo]),
    stop: useCallback(() => AUDIO.stop(), []),
    heeft: useCallback((id) => AUDIO.heeft(id), []),
    kan: useCallback((id) => (id ? AUDIO.heeft(id) || STEM.heeftAr() : STEM.heeftAr()), []),
    meld,
  }
  return <Doos.Provider value={waarde}>{children}</Doos.Provider>
}

export interface Blokinhoud {
  ar: string
  tr?: string | undefined
  nl?: string | undefined
  /** De uitspraak in lettergrepen, als die er is. */
  uit?: string | undefined
  keer?: string | undefined
  /** Het kenmerk van het geluidsfragment. */
  aid?: string | undefined
}

/** Een tekstblok met Arabisch, klank en betekenis, plus knoppen om te horen. */
export function Tekstblok(
  { o, staart }: { o: Blokinhoud; staart?: ReactNode },
): ReactNode {
  const g = useGeluid()
  const aid = o.aid ?? ''
  const echt = aid ? g.heeft(aid) : false
  return (
    <div className="card plat" style={{ background: 'var(--surface-2)' }}>
      <div className="rij tussen" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ar" style={{ fontSize: '1.55rem', color: 'var(--ink)' }}>{o.ar}</div>
          {o.tr && <div className="tr" style={{ marginTop: 8 }}>{o.tr}</div>}
          {o.uit && <div className="uitspraak">{o.uit}</div>}
          {o.nl && <div className="nl" style={{ marginTop: 6, color: 'var(--muted)' }}>{o.nl}</div>}
          {o.keer && <div className="tag k" style={{ marginTop: 9 }}>{o.keer}</div>}
        </div>
        <div className="rij" style={{ flexDirection: 'column', gap: 6 }}>
          {g.kan(aid) && (
            <button
              className={`icoon${echt ? ' aan' : ''}`}
              title={echt ? 'Arabisch horen (echte opname)' : 'Arabisch horen'}
              onClick={() => g.speel(aid || null, o.ar)}
            >🔊</button>
          )}
          {o.nl && (
            <button className="icoon" title="Betekenis horen" onClick={() => g.zegNL(o.nl ?? '')}>
              💬
            </button>
          )}
        </div>
      </div>
      {staart}
    </div>
  )
}

/** Teksten die te lang zijn voor één blok staan regel voor regel in HIFZ. */
export function Blokkenvan(
  { hifzId, staart }: { hifzId: string; staart?: ReactNode },
): ReactNode {
  const g = useGeluid()
  const h = HIFZ.find((x) => x.id === hifzId)
  if (!h) return null
  return (
    <div className="stack">
      {h.r.map((r, i) => (
        <Tekstblok key={i} o={{ ar: r[0], tr: r[1], nl: r[2], uit: r[3], aid: `q:${h.id}:${i + 1}` }} />
      ))}
      <div className="rij">
        <button
          className="btn sm ghost"
          onClick={() => g.speelReeks(h.r.map((x, i) => [`q:${h.id}:${i + 1}`, x[0]]))}
        >▶︎ Hele tekst achter elkaar</button>
        <button className="btn sm ghost" onClick={g.stop}>■ Stop</button>
      </div>
      {staart}
    </div>
  )
}
