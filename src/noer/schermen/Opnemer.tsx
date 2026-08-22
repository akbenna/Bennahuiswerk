/**
 * JEZELF OPNEMEN
 *
 * De snelste manier om je uitspraak te verbeteren is jezelf terughoren naast
 * de voorgelezen tekst. Het fragment blijft in het geheugen van dit toestel;
 * er wordt niets verstuurd.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { OPNAME } from '../geluid'

export function Opnemer({ id }: { id?: string }): ReactNode {
  const [bezig, zetBezig] = useState(false)
  const [url, zetUrl] = useState<string | null>(null)
  const [melding, zetMelding] = useState('')

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  if (!OPNAME.kan()) {
    return (
      <div className="rij" style={{ marginTop: 12 }}>
        <span className="klein">Opnemen kan op dit toestel niet.</span>
      </div>
    )
  }

  const knop = async (): Promise<void> => {
    if (!bezig) {
      try {
        await OPNAME.start()
        zetBezig(true)
        zetMelding('Aan het opnemen…')
      } catch {
        zetMelding('Geen toegang tot de microfoon.')
      }
      return
    }
    const blob = await OPNAME.stop()
    zetBezig(false)
    zetMelding(blob ? '' : 'Er is niets opgenomen.')
    if (!blob) return
    if (url) URL.revokeObjectURL(url)
    zetUrl(URL.createObjectURL(blob))
  }

  return (
    <div style={{ marginTop: 12 }} data-id={id}>
      <div className="rij">
        <button className={`btn sm${bezig ? '' : ' ghost'}`} onClick={() => void knop()}>
          {bezig ? '⏹ Stoppen' : url ? '🎙️ Nog een keer' : '🎙️ Neem jezelf op'}
        </button>
        <span className="klein">{melding}</span>
      </div>
      {url && <audio controls src={url} style={{ width: '100%', marginTop: 9 }} />}
    </div>
  )
}
