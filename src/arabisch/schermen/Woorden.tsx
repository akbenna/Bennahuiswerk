/**
 * WOORDEN — de hele woordenschat, doorzoekbaar
 *
 * Zoeken gaat op Nederlands, transcriptie én Arabisch. Dat laatste met de
 * tekens eraf: wie zelf Arabisch tikt zet er zelden klinkertekens bij, en dan
 * zou een woord dat er wél mee in de lijst staat onvindbaar zijn.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { WOORDEN } from '../gegevens/woorden'
import type { Toestand } from '../toestand'
import { normAr, normNl } from '../tekst'
import { WoordRij } from '../inhoud'

/** Boven dit aantal wordt de lijst niet langer getoond maar verfijnd: vierhonderd
 *  regels tekenen kost merkbaar tijd en helpt niemand zoeken. */
const PLAFOND = 400

export function Woorden({ t, openWoord }: { t: Toestand; openWoord: (i: number) => void }): ReactNode {
  const [zoek, zetZoek] = useState('')
  const [thema, zetThema] = useState('alle')
  const p = t.profiel
  if (!p) return null

  const themas = Array.from(new Set(WOORDEN.map((w) => w.th)))
  const q = normNl(zoek)
  const qa = normAr(zoek)
  const lijst = WOORDEN.map((w, i) => ({ w, i })).filter(({ w }) => (
    (thema === 'alle' || w.th === thema)
    && (!zoek || normNl(w.n).includes(q) || normNl(w.t).includes(q)
      || (!!qa && normAr(w.a).includes(qa)))))

  return (
    <div className="wrap">
      <h1>Woorden</h1>
      <p className="muted small" style={{ marginTop: 4 }}>
        {WOORDEN.length} woorden. Zoek op Nederlands, Arabisch of transcriptie.
      </p>
      <input
        className="veld" style={{ marginTop: 12 }} placeholder="Zoeken…" autoComplete="off"
        value={zoek} onChange={(e) => zetZoek(e.target.value)}
      />
      <div className="chips">
        {['alle', ...themas].map((th) => (
          <button
            type="button" key={th} className="chip" aria-pressed={thema === th}
            onClick={() => zetThema(th)}
          >{th}</button>
        ))}
      </div>
      <div className="kaart">
        {lijst.length
          ? (
            <>
              {lijst.slice(0, PLAFOND).map(({ w, i }) => (
                <WoordRij
                  key={i} w={w} vocalisatie={p.voorkeur.vocalisatie} open={() => openWoord(i)}
                />
              ))}
              {lijst.length > PLAFOND && (
                <p className="klein muted mid" style={{ marginTop: 10 }}>
                  {lijst.length - PLAFOND} meer — verfijn je zoekopdracht.
                </p>
              )}
            </>
            )
          : <div className="leeg">Niets gevonden.</div>}
      </div>
    </div>
  )
}
