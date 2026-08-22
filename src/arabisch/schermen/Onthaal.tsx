/**
 * ONTHAAL — profiel kiezen of aanmaken
 *
 * Bij het aanmaken vragen we alleen naam en leeftijd; de app kiest daarop het
 * spoor. Daarnaast één zin over wanneer en waar. Dat laatste is geen
 * versiering: een vastgelegde uitvoeringsintentie is de goedkoopste ingreep met
 * een groot effect op of iemand het werkelijk gaat doen (Gollwitzer & Sheeran,
 * d ≈ 0,65).
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Toestand } from '../toestand'
import { SPOORLEEFTIJD, SPOORNAAM, bouwPad, spoorBijLeeftijd } from '../leerplan'
import type { Spoor } from '../gegevens/soorten'

/** Voorstel voor dit gezin. De leeftijd bepaalt het spoor; de ouder kan beide
 *  in het ouderscherm bijstellen. */
const GEZIN: Array<{ naam: string; leeftijd: number; spoor?: Spoor }> = [
  { naam: 'Hanae', leeftijd: 40 },
  { naam: 'Selma', leeftijd: 8 },
  { naam: 'Amine', leeftijd: 11 },
  { naam: 'Wassima', leeftijd: 14 },
  /* Zestien valt formeel in het volwassen spoor; hier bewust 13-15. */
  { naam: 'Amaani', leeftijd: 16, spoor: 3 },
]

const MIN_LEEFTIJD = 4
const MAX_LEEFTIJD = 99

const WANNEER = [
  'na het avondeten', 'voor het slapengaan', 'na school', 'na het ontbijt',
  'in de auto naar school', 'na het middaggebed',
]
const WAAR = ['aan de keukentafel', 'op de bank', 'aan mijn bureau', 'in bed', 'in de tuin']

export function NieuwProfiel(
  { maak }: { maak: (naam: string, leeftijd: number, intentie: string) => void },
): ReactNode {
  const [naam, zetNaam] = useState('')
  const [lft, zetLft] = useState('')
  const [wanneer, zetWanneer] = useState('')
  const [waar, zetWaar] = useState('')

  const l = parseInt(lft, 10)
  const geldig = !!naam.trim() && l >= MIN_LEEFTIJD && l <= MAX_LEEFTIJD
  const s = geldig ? spoorBijLeeftijd(l) : null
  const zin = (!wanneer.trim() && !waar.trim())
    ? ''
    : 'Elke dag ' + (wanneer.trim() || 'op een vast moment')
      + (waar.trim() ? ', ' + waar.trim() : '') + ' oefen ik Arabisch.'

  return (
    <>
      <h2 style={{ marginBottom: 4 }}>Nieuw profiel</h2>
      <p className="muted small" style={{ marginBottom: 18 }}>
        Naam en leeftijd zijn genoeg. De app kiest daarop het spoor; dat is later te wijzigen.
      </p>
      <div className="veldje">
        <label className="lbl" htmlFor="npNaam">Naam</label>
        <input
          className="veld" id="npNaam" maxLength={24} autoComplete="off"
          placeholder="Bijvoorbeeld Yasmina" value={naam} onChange={(e) => zetNaam(e.target.value)}
        />
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="npLeeftijd">Leeftijd</label>
        <input
          className="veld" id="npLeeftijd" type="number" inputMode="numeric"
          min={MIN_LEEFTIJD} max={MAX_LEEFTIJD} placeholder="Bijvoorbeeld 9"
          value={lft} onChange={(e) => zetLft(e.target.value)}
        />
      </div>
      {s && (
        <div className="melding" style={{ marginBottom: 16 }}>
          Spoor {s} — <b>{SPOORNAAM[s]}</b> ({SPOORLEEFTIJD[s]})
        </div>
      )}

      <hr className="regel" style={{ margin: '20px 0' }} />
      <h3 style={{ marginBottom: 4 }}>Wanneer ga je het doen?</h3>
      <p className="muted small" style={{ marginBottom: 14 }}>
        Eén zin, nu vastgelegd. Wie van tevoren opschrijft wánneer en wáár, doet het aanzienlijk
        vaker werkelijk.
      </p>
      <div className="veldje">
        <label className="lbl" htmlFor="npWanneer">Elke dag…</label>
        <input
          className="veld" id="npWanneer" maxLength={60} autoComplete="off" list="npWanneerLijst"
          placeholder="na het avondeten" value={wanneer} onChange={(e) => zetWanneer(e.target.value)}
        />
        <datalist id="npWanneerLijst">
          {WANNEER.map((x) => <option value={x} key={x} />)}
        </datalist>
      </div>
      <div className="veldje">
        <label className="lbl" htmlFor="npWaar">…op deze plek</label>
        <input
          className="veld" id="npWaar" maxLength={60} autoComplete="off" list="npWaarLijst"
          placeholder="aan de keukentafel" value={waar} onChange={(e) => zetWaar(e.target.value)}
        />
        <datalist id="npWaarLijst">
          {WAAR.map((x) => <option value={x} key={x} />)}
        </datalist>
      </div>
      {zin && <div className="kaart accent small" style={{ marginBottom: 16 }}><b>{zin}</b></div>}
      <button
        type="button" className="k vol" disabled={!geldig}
        onClick={() => maak(naam.trim(), l, zin)}
      >Beginnen</button>
    </>
  )
}

export function Onthaal({ t }: { t: Toestand }): ReactNode {
  const [nieuw, zetNieuw] = useState(false)
  const lijst = Object.values(t.stand.profielen)

  const maak = (naam: string, leeftijd: number, intentie: string): void => {
    t.maak(naam, leeftijd, intentie)
  }

  /* De titel staat boven allebei de takken. De oude app liet hem weg zodra er
     nog geen profiel was, en dan opende de app op een naamloos formulier: wie
     hem voor het eerst opent zag nergens wat dit is. */
  const kop = (
    <div className="mid" style={{ marginBottom: 26 }}>
      <div className="ar" style={{ fontSize: '3.4rem', lineHeight: 1.2, color: 'var(--accent)' }}>
        لِسَان
      </div>
      <h1 style={{ marginTop: 6 }}>Arabisch</h1>
      <p className="muted" style={{ marginTop: 6 }}>Arabisch leren lezen, begrijpen en spreken</p>
    </div>
  )

  if (!lijst.length || nieuw) {
    return (
      <div className="onthaal" style={{ padding: '36px 0' }}>
        {kop}
        <NieuwProfiel maak={maak} />
        {!lijst.length && (
          <div className="kaart" style={{ marginTop: 22 }}>
            <b>Of zet het gezin in één keer klaar</b>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Vijf profielen met de leeftijden zoals doorgegeven. Controleer ze daarna in het
              ouderscherm — de leeftijd bepaalt welk spoor iemand krijgt, dus die moet kloppen.
            </p>
            <p className="small muted" style={{ margin: '0 0 12px' }}>
              {GEZIN.map((g) => g.naam + ' · ' + (g.leeftijd >= 18 ? 'volwassen' : g.leeftijd + ' jaar'))
                .join(' · ')}
            </p>
            <button
              type="button" className="k vol"
              onClick={() => {
                for (const g of GEZIN) t.maak(g.naam, g.leeftijd, '', g.spoor)
                /* Het eerste profiel actief maken, niet het laatst aangemaakte. */
                t.zet((s) => ({ ...s, actief: Object.keys(s.profielen)[0] ?? s.actief }))
              }}
            >De vijf profielen aanmaken</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="onthaal" style={{ padding: '36px 0' }}>
      {kop}
      <div className="stack" style={{ marginBottom: 22 }}>
        {lijst.map((p) => (
          <button type="button" className="profkaart" key={p.id} onClick={() => t.kies(p.id)}>
            <span className="bol">{p.naam.trim().charAt(0).toUpperCase()}</span>
            <span>
              <b>{p.naam}</b>
              <small>{SPOORNAAM[p.spoor]} · {p.blok} van {bouwPad(p.spoor).length} gedaan</small>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="k rand vol" onClick={() => zetNieuw(true)}>
        Nieuw profiel toevoegen
      </button>
    </div>
  )
}
