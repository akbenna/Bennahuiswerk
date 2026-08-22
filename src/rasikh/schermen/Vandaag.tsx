/**
 * VANDAAG — wat er te doen is, en in welke volgorde.
 * Herhalen gaat vóór. Wat je vandaag laat liggen kost volgende week het dubbele.
 */
import { Balk, Kaart, Kader, Tag } from '../onderdelen'
import { SEC_NIEUW, doelTotaal, doelVast, gezond, plan } from '../planning'
import type { SoeraInfo } from '../planning'
import { datum } from '../opslag'
import type { Stand } from '../opslag'

export function Vandaag(
  { stand, index, dag, naarTab }:
  { stand: Stand; index: readonly SoeraInfo[]; dag: number; naarTab: (t: 'herhalen' | 'nieuw') => void },
) {
  const p = plan(stand, index, dag)
  const vast = doelVast(stand, stand.instel)
  const tot = doelTotaal(index, stand.instel)
  const wankel = Object.values(stand.aya)
    .filter((t) => t.vast && (gezond(t, dag) ?? 1) < 0.33).length
  const min = Math.round((p.herhaalTijd + p.nieuw * SEC_NIEUW) / 60)
  const van = Math.min(stand.instel.doelVan, stand.instel.doelTot)
  const totS = Math.max(stand.instel.doelVan, stand.instel.doelTot)

  return (
    <>
      <div>
        <h1>Vandaag</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          {datum(dag)} · ongeveer {min} minuten · doel: soera {van} tot {totS}
        </p>
      </div>

      <div className="grid g4">
        <Kaart>
          <p className="meta">Te herhalen</p>
          <p className="cijfer">{p.due.length}</p>
          <p className="klein">{Math.round(p.herhaalTijd / 60)} min</p>
        </Kaart>
        <Kaart>
          <p className="meta">Nieuw vandaag</p>
          <p className="cijfer">{p.nieuw}</p>
          <p className="klein">{p.nieuw ? `${Math.round((p.nieuw * SEC_NIEUW) / 60)} min` : '—'}</p>
        </Kaart>
        <Kaart>
          <p className="meta">Staat vast</p>
          <p className="cijfer">
            {vast}<span style={{ fontSize: '.95rem', color: 'var(--muted)' }}>/{tot}</span>
          </p>
          <Balk deel={tot ? (vast / tot) * 100 : 0} />
        </Kaart>
        <Kaart>
          <p className="meta">Wankel</p>
          <p className="cijfer" style={{ color: wankel ? 'var(--fout)' : 'var(--ink)' }}>{wankel}</p>
          <p className="klein">aandacht nodig</p>
        </Kaart>
      </div>

      {p.due.length ? (
        <Kaart>
          <div className="rij tussen">
            <h3>Eerst herhalen</h3><Tag toon="k">{p.due.length} open</Tag>
          </div>
          <p className="klein" style={{ marginTop: 6 }}>
            Herhalen gaat vóór. Wat je vandaag laat liggen kost volgende week het dubbele.
          </p>
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="btn groot" onClick={() => naarTab('herhalen')}>
              Begin met herhalen
            </button>
          </div>
        </Kaart>
      ) : (
        <Kaart>
          <h3>Je bent bij</h3>
          <p className="klein" style={{ marginTop: 6 }}>
            Er staat niets open. Dat is het doel — niet dat je veel kent, maar dat wat je kent blijft
            staan.
          </p>
        </Kaart>
      )}

      {p.nieuw ? (
        <Kaart>
          <div className="rij tussen">
            <h3>Daarna iets nieuws</h3><Tag toon="goed">{p.nieuw} aya</Tag>
          </div>
          <p className="klein" style={{ marginTop: 6 }}>Doe dit pas als het herhalen klaar is.</p>
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="btn ghost" onClick={() => naarTab('nieuw')}>
              Naar het nieuwe stuk
            </button>
          </div>
        </Kaart>
      ) : (
        <Kader toon="let" kop="Vandaag niets nieuws">{p.reden}</Kader>
      )}

      {wankel > 0 && (
        <Kader toon="fout" kop={`${wankel} aya's staan wankel`}>
          Die haperden de laatste keren; ze komen sneller terug. Kijk ze na bij <b>Kaart</b>.
        </Kader>
      )}

      <Kaart>
        <h3>De laatste twee weken</h3>
        <Streep stand={stand} dag={dag} />
      </Kaart>
    </>
  )
}

function Streep({ stand, dag }: { stand: Stand; dag: number }) {
  const d = Array.from({ length: 14 }, (_, i) => {
    const dd = datum(dag - (13 - i))
    const r = stand.log.find((x) => x.d === dd)
    return { dd, n: r?.nieuw ?? 0, h: r?.herhaald ?? 0 }
  })
  const max = Math.max(4, ...d.map((x) => x.n + x.h))

  return (
    <>
      <div className="rij" style={{ alignItems: 'flex-end', gap: 5, marginTop: 12, height: 74 }}>
        {d.map((x) => (
          <div key={x.dd} title={`${x.dd}: ${x.n} nieuw, ${x.h} herhaald`}
               style={{ flex: 1, display: 'flex', flexDirection: 'column',
                        justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ height: `${(x.n / max) * 100}%`, background: 'var(--goed)',
                          borderRadius: '3px 3px 0 0' }} />
            <div style={{ height: `${(x.h / max) * 100}%`, background: 'var(--k)',
                          borderRadius: '0 0 3px 3px', opacity: 0.75 }} />
          </div>
        ))}
      </div>
      <p className="klein" style={{ marginTop: 8 }}>
        <span style={{ color: 'var(--goed)' }}>■</span> nieuw &nbsp;
        <span style={{ color: 'var(--k)' }}>■</span> herhaald
      </p>
    </>
  )
}
