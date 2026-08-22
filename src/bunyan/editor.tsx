/**
 * DE EDITOR — één vak voor drie talen
 *
 * Python draait in MINIPY, hier in de app, met een stappenteller tegen de
 * oneindige lus. JavaScript en HTML gaan naar public/bunyan/zandbak.html, een
 * frame met een eigen herkomst; zie de kop van dat bestand voor waarom.
 *
 * Het frame krijgt zevenhonderd milliseconde om iets terug te zeggen. Dat is
 * geen nauwkeurige meting maar een keuze: langer wachten voelt als hangen, en
 * wie een echte lus schrijft ziet het frame vanzelf leeg blijven.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { draai } from './minipy'
import type { Taal } from './gegevens/soorten'
import type { Draaiuitslag } from './gegevens/soorten'

const WACHT_MS = 700

export interface Uitkomst extends Draaiuitslag {
  code: string
  regel?: number | undefined
  tip?: string | undefined
}

const NAAM: Record<Taal, string> = { py: 'Python', js: 'JavaScript', html: 'HTML' }

interface Props {
  taal: Taal
  code: string
  zetCode: (c: string) => void
  /** Wat er in het vak "Wat jij intypt" staat; alleen bij Python. */
  invoer?: string | undefined
  zetInvoer?: ((v: string) => void) | undefined
  /** Waar de editor op terugvalt bij "Opnieuw". */
  begin: string
  /** Wordt na elke run geroepen, zodat een opdracht zichzelf kan nakijken. */
  opUitkomst?: ((u: Uitkomst) => void) | undefined
  /** Een greep op de editor, zodat de knop "Nakijken" hem kan laten draaien. */
  greep?: MutableRefObject<EditorGreep | null> | undefined
}

export interface EditorGreep {
  /** Voert uit en meldt de uitkomst; de opdracht gebruikt dit om na te kijken. */
  voerUit: (na?: (u: Uitkomst) => void) => void
}

export function Editor({
  taal, code, zetCode, invoer, zetInvoer, begin, opUitkomst, greep,
}: Props): ReactNode {
  const id = useId()
  const [uit, zetUit] = useState<string[]>([])
  const [fout, zetFout] = useState<{ regel: number; fout: string; tip: string } | null>(null)
  const [gedraaid, zetGedraaid] = useState(false)
  const frame = useRef<HTMLIFrameElement | null>(null)
  const merk = useRef(0)

  const na = useRef(opUitkomst)
  na.current = opUitkomst

  /* Het frame praat terug via postMessage. Alleen berichten met het merk van de
     lopende run tellen; een antwoord van een vorige run mag hier niet in. */
  const lopend = useRef<{ merk: string; uit: string[]; klaar: (u: Uitkomst) => void } | null>(null)
  useEffect(() => {
    const luister = (e: MessageEvent): void => {
      const d = e.data as { soort?: string; b?: string; r?: string; f?: string; l?: number }
      if (d?.soort !== 'bunyan-uit') return
      const l = lopend.current
      if (!l || d.b !== l.merk) return
      if (d.f) {
        zetUit([...l.uit])
        zetFout({ regel: d.l ?? 0, fout: d.f, tip: '' })
        lopend.current = null
        l.klaar({ ok: false, uit: l.uit, fout: d.f, regel: d.l ?? 0, code: '' })
      } else if (d.r !== undefined) {
        l.uit.push(d.r)
      }
    }
    addEventListener('message', luister)
    return () => removeEventListener('message', luister)
  }, [])

  const voerUit = useCallback((klaarNa?: (u: Uitkomst) => void) => {
    zetGedraaid(true)
    const meld = (u: Uitkomst): void => {
      na.current?.(u)
      klaarNa?.(u)
    }
    if (taal === 'py') {
      const r = draai(code, { invoer: (invoer ?? '').split('\n').filter((x) => x.length) })
      zetUit(r.uit)
      zetFout(r.ok ? null : { regel: r.regel, fout: r.fout, tip: r.tip })
      meld(r.ok
        ? { ok: true, uit: r.uit, code }
        : { ok: false, uit: r.uit, code, regel: r.regel, fout: r.fout, tip: r.tip })
      return
    }
    const m = 'bun' + ++merk.current
    const staat = { merk: m, uit: [] as string[], klaar: (u: Uitkomst) => meld({ ...u, code }) }
    lopend.current = staat
    zetUit([])
    zetFout(null)
    frame.current?.contentWindow?.postMessage({ soort: 'bunyan-draai', merk: m, code, taal }, '*')
    /* Het frame zegt niet wanneer het klaar is — een script kan blijven lopen.
       Na de wachttijd nemen we wat er binnen is en gaan we door. */
    setTimeout(() => {
      if (lopend.current !== staat) return
      lopend.current = null
      zetUit([...staat.uit])
      meld({ ok: true, uit: staat.uit, code })
    }, WACHT_MS)
  }, [code, invoer, taal])

  if (greep) greep.current = { voerUit }

  const tekst = uit.join('\n')
  return (
    <>
      <div className="editor">
        <div className="kop">
          <span className="meta">{NAAM[taal]}</span>
          <button className="btn sm ghost" onClick={() => zetCode(begin)}>Opnieuw</button>
          <button className="btn sm" onClick={() => voerUit()}>Uitvoeren</button>
        </div>
        <textarea
          id={`ed${id}`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={code}
          onChange={(e) => zetCode(e.target.value)}
        />
      </div>

      {zetInvoer && (
        <label className="veld">
          <span>Wat jij intypt (elk antwoord op een eigen regel)</span>
          <textarea
            rows={2}
            style={{ fontFamily: 'var(--mono)', fontSize: '.85rem' }}
            value={invoer ?? ''}
            onChange={(e) => zetInvoer(e.target.value)}
          />
        </label>
      )}

      <div className="uitvoer">
        <div className="kop meta">Uitvoer</div>
        {taal !== 'py' && (
          <iframe
            ref={frame}
            title="Voorbeeld"
            src="/bunyan/zandbak.html"
            sandbox="allow-scripts"
            style={{ width: '100%', height: 210, border: 0, background: '#fff', display: 'block' }}
          />
        )}
        <pre
          className={tekst ? '' : 'leeg'}
          style={taal !== 'py' ? { borderTop: '1px solid var(--line)' } : undefined}
        >
          {tekst || (gedraaid
            ? 'Geen uitvoer.'
            : taal === 'py' ? 'Nog niets — druk op Uitvoeren.' : 'Console: nog niets.')}
        </pre>
        {fout && (
          <div className="foutbalk">
            <b>{fout.regel ? `Regel ${fout.regel}: ` : ''}{fout.fout}</b>
            {fout.tip && <span className="tip">{fout.tip}</span>}
          </div>
        )}
      </div>
    </>
  )
}
