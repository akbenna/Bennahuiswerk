/**
 * DE PUZZEL — de woorden van een regel in de goede volgorde
 *
 * Elk woord krijgt zijn eigen plek in de rij mee. Zonder dat gaat het mis bij
 * een regel waarin hetzelfde woord twee keer staat: dan zou de tweede al goed
 * gerekend worden op de plek van de eerste.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useGeluid } from '../luisteren'
import { toon } from '../geluid'

interface Woord { w: string; x: number }

function hussel<T>(a: T[], zaad: number): T[] {
  const b = a.slice()
  let z = zaad || 1
  for (let i = b.length - 1; i > 0; i--) {
    z = (z * 1103515245 + 12345) & 0x7fffffff
    const j = z % (i + 1)
    ;[b[i], b[j]] = [b[j] as T, b[i] as T]
  }
  return b
}

export function Woordpuzzel({ regels, kop, hint, hifzId, geluid, sluit, klaar }: {
  regels: Array<readonly string[]>
  kop: string
  hint: boolean
  hifzId?: string
  geluid: boolean
  sluit: () => void
  klaar: (fouten: number) => void
}): ReactNode {
  const g = useGeluid()
  const [r, zetR] = useState(0)
  const [gelegd, zetGelegd] = useState<Woord[]>([])
  const [fouten, zetFouten] = useState(0)
  const [mis, zetMis] = useState<number | null>(null)
  const [schud, zetSchud] = useState(0)

  const regel = regels[r]
  if (!regel) return null
  const woorden: Woord[] = (regel[0] as string).split(' ').filter(Boolean).map((w, x) => ({ w, x }))
  const los = hussel(woorden.filter((o) => !gelegd.some((q) => q.x === o.x)), (r + 1) * 104729 + schud)

  const tik = (o: Woord): void => {
    if (o.x === gelegd.length) {
      const nu = [...gelegd, o]
      zetGelegd(nu)
      zetMis(null)
      toon('tik', geluid)
      if (nu.length === woorden.length) {
        toon('goed', geluid)
        if (r + 1 >= regels.length) setTimeout(() => klaar(fouten), 420)
        else setTimeout(() => { zetR(r + 1); zetGelegd([]) }, 420)
      }
    } else {
      zetFouten((f) => f + 1)
      zetMis(o.x)
      toon('mis', geluid)
      setTimeout(() => zetMis(null), 320)
    }
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">{kop} · regel {r + 1} van {regels.length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {regels.map((_, k) => <i key={k} className={k < r ? 'aan' : ''} />)}
      </div>
      {hint && <p className="klein" style={{ marginTop: 12 }}>{regel[2]}</p>}
      <div className="doos" style={{ marginTop: 12 }}>
        <div className="woorden">
          {gelegd.map((o) => (
            <span className="woord" key={o.x} style={{ borderColor: 'var(--k)' }}>{o.w}</span>
          ))}
        </div>
      </div>
      <div className="woorden" style={{ marginTop: 16 }}>
        {los.map((o) => (
          <button
            className={`woord${mis === o.x ? ' fout' : ''}`} key={o.x}
            onClick={() => tik(o)}
          >{o.w}</button>
        ))}
      </div>
      <div className="rij" style={{ marginTop: 16 }}>
        <button
          className="icoon" title="Voorzeggen"
          onClick={() => g.speel(hifzId ? `q:${hifzId}:${r + 1}` : null, regel[0] as string)}
        >🔊</button>
        <button
          className="btn ghost sm"
          onClick={() => { zetGelegd([]); zetSchud((n) => n + 1) }}
        >Opnieuw</button>
      </div>
    </>
  )
}
