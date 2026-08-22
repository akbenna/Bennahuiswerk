/**
 * HERHALING — vijf tot tien minuten per dag
 *
 * De rij wordt één keer opgebouwd uit wat vandaag aan de beurt is, en daarna
 * afgewerkt. Een kaart die je "opnieuw" geeft gaat achteraan in dezelfde rij en
 * komt dus binnen de sessie nog een keer langs; dat is de bedoeling.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { KAARTEN } from '../gegevens/kaarten'
import { CURRICULUM } from '../gegevens/curriculum'
import { actieveKaarten, beoordeel, dueKaarten, fmt, volgend } from '../kaartplanner'
import type { Oordeel } from '../kaartplanner'
import { openSporen } from '../programma'
import { reeksNa } from '../opslag'
import type { Stand } from '../opslag'
import { Rijk, Tag } from '../onderdelen'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const KNOPPEN: Array<[Oordeel, string]> = [
  [0, 'Opnieuw'], [1, 'Lastig'], [2, 'Goed'], [3, 'Makkelijk'],
]

export function Herhaling(
  { stand, nu, zet }: { stand: Stand; nu: string; zet: (f: (s: Stand) => Stand) => void },
): ReactNode {
  const [rij, zetRij] = useState<string[]>([])
  const [tonen, zetTonen] = useState(false)

  const open = openSporen(stand.klaar)
  const actief = actieveKaarten(KAARTEN, open, stand.alles)

  /* De rij bij binnenkomst vullen, en opnieuw zodra hij leegloopt. Niet bij elke
     hertekening: dan zou een beoordeelde kaart meteen weer terugkomen. */
  const vullen = useCallback(() => {
    const o = openSporen(stand.klaar)
    const a = actieveKaarten(KAARTEN, o, stand.alles)
    zetRij(dueKaarten(a, stand.cards, nu as IsoDatum).map((k) => k.id))
    zetTonen(false)
  }, [stand.klaar, stand.alles, stand.cards, nu])

  const [gevuld, zetGevuld] = useState(false)
  useEffect(() => {
    if (gevuld) return
    zetGevuld(true)
    vullen()
  }, [gevuld, vullen])

  if (!actief.length) {
    return (
      <>
        <Kop />
        <div className="card">
          <h3>Nog geen kaarten vrijgegeven</h3>
          <p className="small muted" style={{ margin: '10px 0 16px' }}>
            Rond eerst een week af; de kaarten van dat blok komen dan beschikbaar.
          </p>
          <button className="btn ghost sm" onClick={() => { zet((s) => ({ ...s, alles: true })); zetGevuld(false) }}>
            Alles ineens vrijgeven
          </button>
        </div>
      </>
    )
  }

  const kaart = KAARTEN.find((k) => k.id === rij[0])
  if (!kaart) {
    const ongezien = actief.filter((k) => !stand.cards[k.id]).length
    return (
      <>
        <Kop />
        <div className="card">
          <h3>Niets te herhalen vandaag</h3>
          <p className="small muted" style={{ margin: '10px 0 0' }}>
            {actief.length} kaarten actief, waarvan {ongezien} nog niet gezien. De rest komt
            terug op de geplande dag.
          </p>
        </div>
        {!stand.alles && (
          <div style={{ marginTop: 14 }}>
            <button className="btn ghost sm" onClick={() => { zet((s) => ({ ...s, alles: true })); zetGevuld(false) }}>
              Alle {KAARTEN.length} kaarten vrijgeven
            </button>
          </div>
        )}
      </>
    )
  }

  const sp = CURRICULUM.find((s) => s.id === kaart.s)
  const c = stand.cards[kaart.id]

  const oordeel = (q: Oordeel): void => {
    zet((s) => ({
      ...s,
      cards: { ...s.cards, [kaart.id]: beoordeel(s.cards[kaart.id], q, nu as IsoDatum) },
      ...reeksNa(s, nu as IsoDatum),
    }))
    /* "Opnieuw" schuift de kaart naar achteren in dezelfde rij; de rest gaat eruit. */
    const rest = rij.slice(1)
    zetRij(q === 0 ? [...rest, kaart.id] : rest)
    zetTonen(false)
    if (!rest.length && q !== 0) zetGevuld(false)
  }

  return (
    <>
      <Kop />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {sp ? <Tag kleur={sp.kleur}>Blok {sp.nr}</Tag> : <span />}
        <span className="meta">{rij.length} in de rij</span>
      </div>
      <div className="flash">
        <Rijk className="q" html={kaart.v} />
        {tonen && <Rijk className="a" html={kaart.a} />}
      </div>
      {tonen ? (
        <div className="rate">
          {KNOPPEN.map(([q, label]) => (
            <button key={q} onClick={() => oordeel(q)}>
              {label}<span>{q === 0 ? 'straks' : fmt(volgend(c, q))}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn" onClick={() => zetTonen(true)}>Toon antwoord</button>
        </div>
      )}
    </>
  )
}

const Kop = (): ReactNode => (
  <>
    <h1>Herhaling</h1>
    <p className="lede muted" style={{ marginTop: 10, marginBottom: 26, maxWidth: '56ch' }}>
      Vijf tot tien minuten per dag. Kaarten uit een blok komen vrij zodra je er een week van
      hebt afgerond, en worden daarna door elkaar aangeboden.
    </p>
  </>
)
