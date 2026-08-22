/**
 * HERHALEN — zelf beoordelen.
 * Wees streng: een hapering nu is beter dan een gat over een maand.
 */
import { useEffect, useState } from 'react'
import { AyaBlok, Balk, Blad, BladKop, Kaart, Tag } from '../onderdelen'
import { SEC_HERHAAL, dueLijst, komende } from '../planning'
import type { DueRegel } from '../planning'
import type { Cijfer, Stand } from '../opslag'
import { ayaVanId, vorigeAya } from '../koran'
import type { Aya } from '../koran'
import type { Recitatie } from '../audio'

export function Herhalen(
  { stand, dag, opBeoordeeld, recitatie }:
  {
    stand: Stand; dag: number
    opBeoordeeld: (id: string, cijfer: Cijfer) => void
    recitatie: Recitatie
  },
) {
  const [rij, zetRij] = useState<DueRegel[] | null>(null)
  const due = dueLijst(stand, dag)
  const wachtend = komende(stand, dag)

  return (
    <>
      <div>
        <h1>Herhalen</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          Zelf beoordelen. Wees streng: een hapering nu is beter dan een gat over een maand.
        </p>
      </div>

      {due.length ? (
        <Kaart>
          <div className="rij tussen">
            <h3>{due.length} aan de beurt</h3>
            <Tag toon="k">± {Math.round((due.length * SEC_HERHAAL) / 60)} min</Tag>
          </div>
          <p className="klein" style={{ marginTop: 6 }}>De wankelste eerst.</p>
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="btn groot" onClick={() => zetRij(due)}>Beginnen</button>
          </div>
        </Kaart>
      ) : (
        <Kaart>
          <h3>Niets open</h3>
          <p className="klein" style={{ marginTop: 6 }}>
            Je bent bij. Oefen desnoods de <b>verwarpunten</b> — dat mag altijd.
          </p>
        </Kaart>
      )}

      {Object.keys(stand.aya).length > 0 && (
        <Kaart>
          <h3>Wat er aankomt</h3>
          <div className="rij" style={{ marginTop: 10 }}>
            {wachtend.map(([k, n]) => (
              <Tag key={k} toon={k === 'vandaag' ? 'k' : ''}>{k}: {n}</Tag>
            ))}
          </div>
        </Kaart>
      )}

      {rij && (
        <Ronde rij={rij} lezing={stand.instel.lezing} recitatie={recitatie}
               tempo={stand.instel.tempo}
               opBeoordeeld={opBeoordeeld} opSluiten={() => zetRij(null)} />
      )}
    </>
  )
}

function Ronde(
  { rij, lezing, recitatie, tempo, opBeoordeeld, opSluiten }:
  {
    rij: DueRegel[]
    lezing: Stand['instel']['lezing']
    recitatie: Recitatie
    tempo: number
    opBeoordeeld: (id: string, cijfer: Cijfer) => void
    opSluiten: () => void
  },
) {
  const [i, zetI] = useState(0)
  const [tel, zetTel] = useState({ goed: 0, totaal: 0 })
  const [paar, zetPaar] = useState<{ a: Aya; vorige: Aya | null } | null>(null)
  const [getoond, zetGetoond] = useState(false)

  useEffect(() => {
    let af = false
    zetGetoond(false)
    void (async () => {
      const regel = rij[i]
      if (!regel) { zetPaar(null); return }
      const a = await ayaVanId(regel.id, lezing)
      if (af || !a) { if (!af) zetI((n) => n + 1); return }
      const vorige = await vorigeAya(a, lezing)
      if (!af) zetPaar({ a, vorige })
    })()
    return () => { af = true }
  }, [i, rij, lezing])

  if (i >= rij.length) {
    return (
      <Blad opSluiten={opSluiten}>
        <h2>Ronde klaar</h2>
        <p style={{ marginTop: 8 }}>{tel.goed} van de {tel.totaal} vlekkeloos.</p>
        <p className="klein" style={{ marginTop: 8 }}>
          Wat haperde komt sneller terug. Dat is geen straf; daar is dit systeem voor.
        </p>
        <div className="rij" style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={opSluiten}>Klaar</button>
        </div>
      </Blad>
    )
  }

  return (
    <Blad opSluiten={opSluiten}>
      <BladKop tekst={`Herhalen · ${i + 1} van ${rij.length}`} opSluiten={opSluiten} />
      <div style={{ margin: '10px 0 16px' }}><Balk dun deel={(i / rij.length) * 100} /></div>

      {paar && (
        <>
          <Kaart plat>
            <p className="meta">{paar.a.soera.naam} · aya {paar.a.n}</p>
            {paar.vorige && (
              <div className="ar" style={{ fontSize: '1.05rem', marginTop: 8, opacity: 0.5 }}>
                {paar.vorige.ar}
              </div>
            )}
            <p className="klein" style={{ marginTop: 8 }}>Zeg deze aya hardop, uit je hoofd.</p>
          </Kaart>

          {!getoond ? (
            <div className="rij" style={{ marginTop: 14 }}>
              <button type="button" className="btn" onClick={() => zetGetoond(true)}>Laat zien</button>
            </div>
          ) : (
            <>
              <AyaBlok a={paar.a}
                       opHoren={recitatie.heeft(paar.a)
                         ? () => void recitatie.speel(paar.a, tempo) : undefined} />
              <p className="klein" style={{ marginTop: 12 }}>Hoe ging het?</p>
              <div className="rij" style={{ marginTop: 8 }}>
                {([[3, 'Vlekkeloos', 'btn'], [2, 'Haperde', 'btn ghost'],
                   [1, 'Kwijt', 'btn ghost']] as const).map(([c, label, klasse]) => (
                  <button key={c} type="button" className={klasse}
                          onClick={() => {
                            opBeoordeeld(paar.a.id, c)
                            zetTel((t) => ({ goed: t.goed + (c === 3 ? 1 : 0), totaal: t.totaal + 1 }))
                            zetI((n) => n + 1)
                          }}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Blad>
  )
}
