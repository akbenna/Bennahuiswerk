/**
 * KAART — niet hoeveel je kent, maar hoe stevig het staat.
 */
import { useState } from 'react'
import { Blad, BladKop, Kaart as Blok } from '../onderdelen'
import { doelTotaal, doelVast, gezond, inDoel, soeraStand } from '../planning'
import type { SoeraInfo } from '../planning'
import { totaalAya } from '../koran'
import { datum } from '../opslag'
import type { Stand } from '../opslag'

export function Kaart(
  { stand, index, dag, opDoel }:
  { stand: Stand; index: readonly SoeraInfo[]; dag: number; opDoel: (nr: number) => void },
) {
  const [open, zetOpen] = useState<number | null>(null)
  const vast = Object.values(stand.aya).filter((t) => t.vast)
  const g = vast.map((t) => gezond(t, dag) ?? 0)
  const sterk = g.filter((x) => x >= 0.66).length
  const zwak = g.filter((x) => x < 0.66 && x >= 0.33).length
  const wankel = g.filter((x) => x < 0.33).length

  const recent = stand.log.slice(-21)
  const tempo = recent.length
    ? recent.reduce((n, r) => n + r.nieuw, 0) / Math.max(1, recent.length) : 0
  const rest = doelTotaal(index, stand.instel) - doelVast(stand, stand.instel)
  const dagen = tempo > 0 ? Math.ceil(rest / tempo) : null
  const bezig = index.filter((s) => soeraStand(stand, s, dag).vast > 0)

  return (
    <>
      <div>
        <h1>Kaart</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          Niet hoeveel je kent, maar hoe stevig het staat.
        </p>
      </div>

      <div className="grid g4">
        <Blok>
          <p className="meta">Vast</p>
          <p className="cijfer">
            {vast.length}
            <span style={{ fontSize: '.9rem', color: 'var(--muted)' }}>/{totaalAya(index)}</span>
          </p>
        </Blok>
        <Blok>
          <p className="meta">Stevig</p>
          <p className="cijfer" style={{ color: 'var(--goed)' }}>{sterk}</p>
        </Blok>
        <Blok>
          <p className="meta">Zwak</p>
          <p className="cijfer" style={{ color: 'var(--let)' }}>{zwak}</p>
        </Blok>
        <Blok>
          <p className="meta">Wankel</p>
          <p className="cijfer" style={{ color: 'var(--fout)' }}>{wankel}</p>
        </Blok>
      </div>

      {bezig.length ? (
        <Blok>
          <h3>Waar je mee bezig bent</h3>
          <div style={{ marginTop: 10 }}>
            {bezig.map((s) => {
              const st = soeraStand(stand, s, dag)
              const b = (n: number) => (st.totaal ? (n / st.totaal) * 100 : 0)
              return (
                <div className="kaartrij" key={s.nr}>
                  <span style={{ minWidth: 118 }}>
                    <b>{s.naam}</b><span className="klein"> {s.nr}</span>
                  </span>
                  <span className="staaf">
                    <i className="st" style={{ width: b(st.sterk) + '%' }} />
                    <i className="zw" style={{ width: b(st.zwak) + '%' }} />
                    <i className="nw" style={{ width: b(st.wankel) + '%' }} />
                  </span>
                  <span className="klein" style={{ minWidth: 58, textAlign: 'right' }}>
                    {st.vast}/{st.totaal}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="klein" style={{ marginTop: 10 }}>
            <span style={{ color: 'var(--goed)' }}>■</span> stevig &nbsp;
            <span style={{ color: 'var(--let)' }}>■</span> zwak &nbsp;
            <span style={{ color: 'var(--fout)' }}>■</span> wankel
          </p>
        </Blok>
      ) : (
        <Blok>
          <h3>Nog niets vastgezet</h3>
          <p className="klein" style={{ marginTop: 6 }}>
            Zodra je een aya vastzet, verschijnt hier hoe stevig hij staat.
          </p>
        </Blok>
      )}

      <Blok>
        <h3>Het hele boek</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Honderdveertien soera's. Groen is vast, grijs is nog niet. Tik een vakje aan voor de naam.
        </p>
        <div className="boek">
          {index.map((s) => {
            const st = soeraStand(stand, s, dag)
            const p = st.totaal ? st.vast / st.totaal : 0
            const kleur = p === 0 ? 'var(--surface-2)'
              : p < 1 ? `color-mix(in srgb,var(--goed) ${Math.round(20 + p * 80)}%,var(--surface-2))`
              : 'var(--goed)'
            return (
              <button key={s.nr} type="button"
                      className={'vak' + (inDoel(stand.instel, s.nr) ? ' doel' : '')}
                      title={`${s.naam} — ${st.vast}/${st.totaal}`}
                      aria-label={`${s.naam}, ${st.vast} van ${st.totaal} vast`}
                      style={{ background: kleur }} onClick={() => zetOpen(s.nr)} />
            )
          })}
        </div>
        <p className="klein" style={{ marginTop: 10 }}>
          Een randje betekent: dit valt binnen je doel.
        </p>
      </Blok>

      <Blok>
        <h3>Tempo</h3>
        {tempo > 0 && dagen != null ? (
          <p style={{ marginTop: 8 }}>
            Je zet gemiddeld <b>{Math.round(tempo * 10) / 10}</b> aya per dag vast. In dit tempo staan
            de resterende {rest} aya's van je doel er over ongeveer <b>{dagen} dagen</b> — rond{' '}
            {datum(dag + dagen)}.
          </p>
        ) : (
          <p style={{ marginTop: 8 }}>
            Nog te weinig gegevens. Na een week of twee staat hier een eerlijke schatting.
          </p>
        )}
        <p className="klein" style={{ marginTop: 8 }}>
          Die schatting gaat uit van doorgaan zoals nu. Ga je sneller, dan groeit het herhaalwerk mee
          — en dáár loopt het meestal vast.
        </p>
      </Blok>

      {open != null && (
        <SoeraBlad stand={stand} info={index.find((s) => s.nr === open)} dag={dag}
                   opSluiten={() => zetOpen(null)}
                   opDoel={(nr) => { opDoel(nr); zetOpen(null) }} />
      )}
    </>
  )
}

/**
 * Een vakje op de kaart zegt zonder naam niets, en op een telefoon is er geen
 * muisaanwijzer om hem uit te lezen. Aantikken opent daarom de gegevens — en
 * meteen de enige handeling die je daar wilt doen: dit tot je doel maken.
 */
function SoeraBlad(
  { stand, info, dag, opSluiten, opDoel }:
  {
    stand: Stand; info: SoeraInfo | undefined; dag: number
    opSluiten: () => void; opDoel: (nr: number) => void
  },
) {
  if (!info) return null
  const st = soeraStand(stand, info, dag)
  const b = (n: number) => (st.totaal ? (n / st.totaal) * 100 : 0)

  return (
    <Blad opSluiten={opSluiten}>
      <BladKop tekst={`Soera ${info.nr} · juz ${info.juz} · ${info.plaats}`} opSluiten={opSluiten} />
      <h2 style={{ marginTop: 6 }}>{info.naam}</h2>
      <p className="ar" style={{ fontSize: '1.5rem', marginTop: 4 }}>{info.ar}</p>
      <p className="klein" style={{ marginTop: 6 }}>{info.aya} aya · {st.vast} vastgezet</p>
      <div className="staaf" style={{ marginTop: 12 }}>
        <i className="st" style={{ width: b(st.sterk) + '%' }} />
        <i className="zw" style={{ width: b(st.zwak) + '%' }} />
        <i className="nw" style={{ width: b(st.wankel) + '%' }} />
      </div>
      <div className="rij" style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={() => opDoel(info.nr)}>
          Maak dit mijn doel
        </button>
        <button type="button" className="btn ghost" onClick={opSluiten}>Sluiten</button>
      </div>
      <p className="klein" style={{ marginTop: 10 }}>
        Je doel is nu soera {stand.instel.doelVan} tot en met {stand.instel.doelTot}. Een breder
        gebied stel je in bij Instellingen.
      </p>
    </Blad>
  )
}
