/**
 * PROFIEL BIJSTELLEN
 *
 * Naam, leeftijd, spoor, dagplafond en de afspraak. Het spoor mag handmatig:
 * een kind van zestien dat pas begint hoort niet in het volwassen spoor, en
 * omgekeerd. Wie het handmatig zet, houdt het — de app rekent dan niet meer
 * terug op de leeftijd.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Profiel } from '../opslag'
import { dagdoelVan } from '../opslag'
import { SPOORNAAM, spoorBijLeeftijd } from '../leerplan'
import type { Spoor } from '../gegevens/soorten'

const MIN_LEEFTIJD = 4
const MAX_LEEFTIJD = 99
const MIN_DOEL = 5
const MAX_DOEL = 200

export function Bewerken(
  { p, bewaar, sluit }:
  { p: Profiel; bewaar: (nieuw: Profiel) => void; sluit: () => void },
): ReactNode {
  const [naam, zetNaam] = useState(p.naam)
  const [lft, zetLft] = useState(String(p.leeftijd))
  const [spoor, zetSpoor] = useState<string>(p.spoorHandmatig ? String(p.spoor) : 'auto')
  const [doel, zetDoel] = useState(String(p.dagdoel))
  const [intentie, zetIntentie] = useState(p.intentie)

  const l = parseInt(lft, 10)
  const geldig = !!naam.trim() && l >= MIN_LEEFTIJD && l <= MAX_LEEFTIJD

  const opslaan = (): void => {
    if (!geldig) return
    const handmatig = spoor !== 'auto'
    const nieuwSpoor = (handmatig ? parseInt(spoor, 10) : spoorBijLeeftijd(l)) as Spoor
    bewaar({
      ...p,
      naam: naam.trim(),
      leeftijd: l,
      spoorHandmatig: handmatig,
      spoor: nieuwSpoor,
      /* Bij een ander spoor begint het leerpad opnieuw te tellen; de
         herhalingskaarten blijven staan, want die horen bij de inhoud en niet
         bij het pad. */
      blok: nieuwSpoor === p.spoor ? p.blok : 0,
      dagdoel: Math.min(MAX_DOEL, Math.max(MIN_DOEL, parseInt(doel, 10) || dagdoelVan(nieuwSpoor))),
      intentie: intentie.trim(),
    })
  }

  return (
    <>
      <h3>{p.naam}</h3>
      <div className="veldje" style={{ marginTop: 14 }}>
        <label className="lbl" htmlFor="bpNaam">Naam</label>
        <input
          className="veld" id="bpNaam" maxLength={24} value={naam}
          onChange={(e) => zetNaam(e.target.value)}
        />
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="bpLeeftijd">Leeftijd</label>
        <input
          className="veld" id="bpLeeftijd" type="number" min={MIN_LEEFTIJD} max={MAX_LEEFTIJD}
          value={lft} onChange={(e) => zetLft(e.target.value)}
        />
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="bpSpoor">Spoor</label>
        <select
          className="veld" id="bpSpoor" value={spoor} onChange={(e) => zetSpoor(e.target.value)}
        >
          <option value="auto">
            Automatisch op leeftijd (nu spoor {spoorBijLeeftijd(geldig ? l : p.leeftijd)})
          </option>
          {([1, 2, 3, 4] as Spoor[]).map((s) => (
            <option value={s} key={s}>Spoor {s} — {SPOORNAAM[s]}</option>
          ))}
        </select>
        <p className="klein muted" style={{ margin: '6px 0 0' }}>
          Bij een ander spoor begint het leerpad opnieuw te tellen. De herhalingskaarten blijven
          behouden.
        </p>
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="bpDoel">Dagplafond herhalingen</label>
        <input
          className="veld" id="bpDoel" type="number" min={MIN_DOEL} max={MAX_DOEL}
          value={doel} onChange={(e) => zetDoel(e.target.value)}
        />
        <p className="klein muted" style={{ margin: '6px 0 0' }}>
          Wat er boven dit aantal uitkomt schuift door naar de volgende dag, zodat de wachtrij
          nooit onbegrensd groeit.
        </p>
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="bpIntentie">Afspraak — wanneer en waar</label>
        <input
          className="veld" id="bpIntentie" maxLength={140} value={intentie}
          onChange={(e) => zetIntentie(e.target.value)}
        />
      </div>
      <div className="rij">
        <button type="button" className="k rek" disabled={!geldig} onClick={opslaan}>Opslaan</button>
        <button type="button" className="k rand" onClick={sluit}>Annuleren</button>
      </div>
    </>
  )
}
