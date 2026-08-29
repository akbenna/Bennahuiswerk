/**
 * WAAR LOOP JE OP VAST?
 *
 * Eén regel, bovenaan het scherm van het kind, altijd zichtbaar. Hij staat er
 * omdat een kind deze app zelden opent om te bladeren: er zit een vraag in zijn
 * hoofd, en de app vroeg tot nu toe dat het kind die vraag eerst zelf vertaalde
 * naar een vak en een onderwerp. Dat is net het stuk dat je niet weet als je
 * vastzit.
 *
 * Wat er terugkomt zijn twee dingen: een paar zinnen houvast, en knoppen die
 * rechtstreeks in de stof springen. Die knoppen zijn nagekeken door
 * `vraagbaak.ts` — er staat nooit een onderwerp op dat niet bestaat.
 *
 * Het veld leegt zichzelf niet na het antwoord. Een kind dat leest wat er staat
 * en dan bedenkt dat het zijn vraag anders moet stellen, hoeft hem niet opnieuw
 * te typen.
 */
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Kaart } from '../gegevens/soorten'
import type { Voortgang } from '../opslag'
import { stel, VraagbaakFout } from '../vraagbaak'
import type { Uitslag } from '../vraagbaak'

export interface VraagveldProps {
  pid: string
  alle: readonly Kaart[]
  prog: Voortgang
  /** Naar een onderwerp springen: eerst het vak omzetten, dan het onderwerp. */
  ga: (vak: string, onderwerp: string, jaar: 'nu' | 'next') => void
  /** Voor het ouderscherm: wat er gevraagd is en of er iets voor bleek te zijn. */
  opVraag: (vraag: string, uitslag: Uitslag) => void
}

export function Vraagveld(p: VraagveldProps): ReactNode {
  const [tekst, zetTekst] = useState('')
  const [bezig, zetBezig] = useState(false)
  const [uit, zetUit] = useState<Uitslag | null>(null)
  const [fout, zetFout] = useState('')
  /* Een tweede tik terwijl de eerste nog loopt hoort de eerste af te breken en
     niet twee antwoorden door elkaar te laten binnenkomen. */
  const lopend = useRef<AbortController | null>(null)

  async function vraag(): Promise<void> {
    const v = tekst.trim()
    if (!v || bezig) return
    lopend.current?.abort()
    const stop = new AbortController()
    lopend.current = stop
    zetBezig(true)
    zetFout('')
    zetUit(null)
    try {
      const antwoord = await stel(v, p.pid, p.alle, p.prog, stop.signal)
      if (stop.signal.aborted) return
      zetUit(antwoord)
      p.opVraag(v, antwoord)
    } catch (e) {
      if (stop.signal.aborted) return
      zetFout(e instanceof VraagbaakFout
        ? e.message
        : 'Er ging iets mis. Kies gerust zelf een vak hieronder.')
    } finally {
      if (!stop.signal.aborted) zetBezig(false)
    }
  }

  return (
    <div className="vraagbaak">
      <label className="vraagrij">
        <span className="vraagicoon" aria-hidden="true">💬</span>
        <input
          className="f" type="text" value={tekst} disabled={bezig}
          placeholder="Waar loop je op vast?"
          aria-label="Waar loop je op vast?"
          onChange={(e) => zetTekst(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void vraag() }}
        />
        <button
          type="button" className="btn sm" disabled={bezig || !tekst.trim()}
          onClick={() => void vraag()}
        >{bezig ? 'Even zoeken…' : 'Zoek'}</button>
      </label>

      {fout && <p className="vraagfout">{fout}</p>}

      {uit && (
        <div className="vraaguit">
          {uit.antwoord && <p className="vraagtekst">{uit.antwoord}</p>}
          {uit.routes.length > 0 && (
            <div className="wrap">
              {uit.routes.map((r) => (
                <button
                  type="button" key={r.s} className="btn sm"
                  onClick={() => p.ga(r.vakSleutel, r.onderwerp, r.jaar)}
                >
                  ▶️ {r.onderwerp}{' '}
                  <span className="muted" style={{ fontSize: 12 }}>
                    · {r.vak}{r.jaar === 'next' ? ' · volgend jaar' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          {uit.gat && (
            <p className="vraaggat">
              Hier staat nog niets over in de app. Papa of mama ziet je vraag en kan het toevoegen.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
