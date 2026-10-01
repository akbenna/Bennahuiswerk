/**
 * TOETSEN UIT EEN FOTO
 *
 * Bovenaan het planbord: een schermafdruk van het rooster, de studiewijzer of
 * de bladzijde met de hoofdstukken, en de planlezer zet er toetsen van klaar.
 * Het kind ziet eerst wat er gelezen is, met wat onzeker was en wat er niet is
 * overgenomen, en kiest zelf wat erop gaat. Bij elke toets staat welke stof de
 * app ervoor heeft, zodat het meteen duidelijk is waar je kunt oefenen.
 */
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { VAKNAAM } from '../gegevens/profielen'
import { PlanlezerFout, lees, verklein } from '../planlezer'
import type { Beeld, Leesuitslag, Voorstel } from '../planlezer'
import type { Ingang } from '../vraagbaak'
import { dagLabel } from './Planbord'

const MAX = 3

export interface FotolezerProps {
  naam: string
  niveau: string
  vakken: readonly string[]
  catalogus: readonly Ingang[]
  vandaag: string
  /** Begint open: als er nog niets op het bord staat is dit de snelste weg. */
  open: boolean
  opBord: (gekozen: Voorstel[]) => void
}

export function Fotolezer(p: FotolezerProps): ReactNode {
  const [beelden, zetBeelden] = useState<Array<Beeld & { naam: string }>>([])
  const [tekst, zetTekst] = useState('')
  const [bezig, zetBezig] = useState(false)
  const [fout, zetFout] = useState('')
  const [uitslag, zetUitslag] = useState<Leesuitslag | null>(null)
  const [gekozen, zetGekozen] = useState<Set<number>>(new Set())
  const kiezer = useRef<HTMLInputElement>(null)
  const onderwerp = new Map(p.catalogus.map((i) => [i.s, i]))

  const voegToe = async (lijst: FileList | null): Promise<void> => {
    if (!lijst) return
    zetFout('')
    const nieuw: Array<Beeld & { naam: string }> = []
    for (const f of [...lijst].slice(0, MAX - beelden.length)) {
      if (!f.type.startsWith('image/')) continue
      nieuw.push({ ...(await verklein(f)), naam: f.name })
    }
    zetBeelden((b) => [...b, ...nieuw].slice(0, MAX))
    if (kiezer.current) kiezer.current.value = ''
  }

  const lezen = async (): Promise<void> => {
    zetBezig(true)
    zetFout('')
    zetUitslag(null)
    try {
      const u = await lees(
        { beelden: beelden.map(({ type, data }) => ({ type, data })), tekst },
        { naam: p.naam, niveau: p.niveau, vakken: p.vakken }, p.catalogus, p.vandaag)
      zetUitslag(u)
      zetGekozen(new Set(u.voorstellen.map((_, i) => i)))
    } catch (e) {
      zetFout(e instanceof PlanlezerFout ? e.message : 'Dat lukte niet. Probeer het zo nog eens.')
    } finally {
      zetBezig(false)
    }
  }

  const wissel = (i: number): void => zetGekozen((g) => {
    const n = new Set(g)
    if (n.has(i)) n.delete(i)
    else n.add(i)
    return n
  })

  return (
    <details className="klapkaart" open={p.open} style={{ marginTop: 14, border: '2px solid var(--gold)' }}>
      <summary>
        <b>📸 Toetsen uit een foto</b>
        <span className="muted zij">rooster, studiewijzer of hoofdstukken</span>
      </summary>
      <div className="klapbak">
        <p style={{ marginTop: 0, fontSize: 15 }}>
          Maak een <b>schermafdruk</b> van je rooster met de toetsen, van je <b>studiewijzer</b>, of
          van de bladzijde met de <b>hoofdstukken die je moet leren</b>. De planlezer haalt er de
          toetsen en de stof uit, en zoekt erbij wat je in deze app kunt oefenen.
        </p>
        <input
          ref={kiezer} type="file" accept="image/*" multiple hidden
          onChange={(e) => { void voegToe(e.target.files) }}
        />
        <div className="wrap" style={{ alignItems: 'center' }}>
          <button
            type="button" className="btn gold" disabled={bezig || beelden.length >= MAX}
            onClick={() => kiezer.current?.click()}
          >📷 Kies {beelden.length ? 'nog een' : 'een'} schermafdruk</button>
          <span className="muted" style={{ fontSize: 13 }}>hoogstens {MAX}</span>
        </div>
        {beelden.length > 0 && (
          <div className="wrap" style={{ marginTop: 10 }}>
            {beelden.map((b, i) => (
              <span key={i} className="badge" style={{ gap: 8 }}>
                <img
                  src={`data:${b.type};base64,${b.data}`} alt=""
                  style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                />
                {b.naam.slice(0, 18) || `afbeelding ${i + 1}`}
                <button
                  type="button" className="back" style={{ padding: 0 }} aria-label="Weghalen"
                  onClick={() => zetBeelden((l) => l.filter((_, j) => j !== i))}
                >✕</button>
              </span>
            ))}
          </div>
        )}
        <label className="fld">Of plak de stof of het toetsoverzicht (mag ook erbij)
          <textarea
            className="f" rows={3} value={tekst} onChange={(e) => zetTekst(e.target.value)}
            placeholder={'bijv. wo 7 okt toets wiskunde A H3 §3.1–3.4\ndo 8 okt natuurkunde H2 Krachten'}
          />
        </label>
        <div className="wrap" style={{ marginTop: 10 }}>
          <button
            type="button" className="btn" disabled={bezig || (!beelden.length && !tekst.trim())}
            onClick={() => { void lezen() }}
          >{bezig ? '⏳ Even lezen…' : '✨ Lees en maak een planning'}</button>
        </div>
        {bezig && (
          <p className="muted" style={{ fontSize: 13 }}>Dit duurt meestal tien tot dertig seconden.</p>
        )}
        {fout && <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>{fout}</div>}

        {uitslag && (
          <div style={{ marginTop: 14 }}>
            {uitslag.voorstellen.length === 0 && (
              <p style={{ fontSize: 15 }}>Ik vond geen toetsen die ik kon overnemen.</p>
            )}
            {uitslag.voorstellen.length > 0 && (
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>
                Dit las ik. Vink uit wat niet klopt; aanpassen kan daarna op het bord.
              </p>
            )}
            {uitslag.voorstellen.map((v, i) => (
              <label
                key={i} className="row"
                style={{ alignItems: 'flex-start', padding: '8px 0', borderTop: '1px solid var(--line)', cursor: 'pointer' }}
              >
                <input
                  type="checkbox" checked={gekozen.has(i)} onChange={() => wissel(i)}
                  style={{ width: 22, height: 22, marginTop: 2, flex: 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>
                    {v.toets.opdracht ? '📎 ' : '📝 '}{VAKNAAM[v.toets.vak] ?? v.toets.vak} · {v.toets.titel}
                    <span className="muted" style={{ fontWeight: 400 }}> · {dagLabel(v.toets.datum, p.vandaag)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {v.toets.onderdelen.join(' · ')}
                  </div>
                  {(v.toets.oefenen ?? []).length > 0 && (
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                      Oefenen in de app:{' '}
                      {(v.toets.oefenen ?? []).map((s) => onderwerp.get(s)?.onderwerp ?? s).join(', ')}
                    </div>
                  )}
                  {v.twijfel && (
                    <div className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>⚠️ {v.twijfel}</div>
                  )}
                </div>
              </label>
            ))}
            {uitslag.afgewezen.length > 0 && (
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                Niet overgenomen: {uitslag.afgewezen.join(' ')}
              </div>
            )}
            {uitslag.opmerking && (
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{uitslag.opmerking}</div>
            )}
            {uitslag.voorstellen.length > 0 && (
              <div className="wrap" style={{ marginTop: 12 }}>
                <button
                  type="button" className="btn gold" disabled={gekozen.size === 0}
                  onClick={() => {
                    p.opBord(uitslag.voorstellen.filter((_, i) => gekozen.has(i)))
                    zetUitslag(null)
                    zetBeelden([])
                    zetTekst('')
                  }}
                >Zet op het bord ({gekozen.size})</button>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  )
}
