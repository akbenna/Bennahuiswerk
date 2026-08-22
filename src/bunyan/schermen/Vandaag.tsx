/**
 * VANDAAG — waar je staat en wat de eerstvolgende stap is
 *
 * Eén les per dag is genoeg. Wie een uur achter elkaar doet en dan vier dagen
 * niets, onthoudt minder dan wie elke dag tien minuten doet — daarom staan hier
 * twee knoppen en niet een hele lijst.
 */
import type { ReactNode } from 'react'
import { CODE } from '../gegevens/code'
import { PC } from '../gegevens/pc'
import { euro } from '@/gedeeld/getal'
import { plusDagen } from '@/gedeeld/datum'
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import { ALLELESSEN, af, blokGedaan, blokVan, rangVan, volgendeLes, volgendeRang } from '../voortgang'
import type { Stand } from '../opslag'
import { Balk, Cijfer, Kader } from '../onderdelen'

const totaalVan = (b: typeof CODE): number => b.reduce((n, x) => n + x.lessen.length, 0)
const gedaanVan = (s: Stand, b: typeof CODE): number => b.reduce((n, x) => n + blokGedaan(s, x), 0)

export function Vandaag(
  { stand, nu, ga }: { stand: Stand; nu: string; ga: (v: 'code' | 'pc') => void },
): ReactNode {
  const rang = rangVan(stand.punten)
  const volg = volgendeRang(stand.punten)
  const totaal = ALLELESSEN.length
  const gedaan = ALLELESSEN.filter((l) => af(stand, l.id)).length
  const nuC = volgendeLes(stand, CODE)
  const nuP = volgendeLes(stand, PC)
  const vandaag = stand.log.find((x) => x.d === nu)

  return (
    <>
      <div>
        <h1>Hoi {stand.instel.naam}</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          {nu} · {gedaan} van de {totaal} lessen af
          {stand.reeks > 1 && <> · <span className="vlam">🔥 {stand.reeks} dagen op rij</span></>}
        </p>
      </div>

      <div className="grid g3">
        <Cijfer
          kop="Rang"
          waarde={<span style={{ fontSize: '1.5rem' }}>{rang[2]} {rang[1]}</span>}
          onder={<>{stand.punten} punten{volg ? ` · nog ${volg[0] - stand.punten} tot ${volg[1]}` : ' · de top'}</>}
        />
        <Cijfer
          kop="Spaarpot" waarde={euro(stand.saldo)} kleur="var(--goed)"
          onder={`deze week ${euro(stand.week.verdiend)} van ${euro(stand.instel.weekbudget)}`}
        />
        <Cijfer
          kop="Vandaag" waarde={vandaag?.lessen ?? 0}
          onder={vandaag?.lessen ? 'lessen gedaan — mooi' : 'nog niets gedaan'}
        />
      </div>

      <div className="card">
        <h3>Doe er vandaag één</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Eén les per dag is genoeg. Wie een uur achter elkaar doet en dan vier dagen niets,
          onthoudt minder dan wie elke dag tien minuten doet.
        </p>
        <div className="grid g2" style={{ marginTop: 14 }}>
          <button className="les" onClick={() => ga('code')}>
            <span className="nr">🐍</span>
            <span className="tt">
              <b>{nuC?.t}</b>
              <span>Coderen · {nuC ? blokVan(nuC.id)?.n : ''}</span>
            </span>
            <span className="rechts">→</span>
          </button>
          <button className="les" onClick={() => ga('pc')}>
            <span className="nr">🔩</span>
            <span className="tt">
              <b>{nuP?.t}</b>
              <span>Bouwen · {nuP ? blokVan(nuP.id)?.n : ''}</span>
            </span>
            <span className="rechts">→</span>
          </button>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>🐍 Coderen</h3>
          <Balk p={gedaanVan(stand, CODE) / totaalVan(CODE) * 100} />
          <p className="klein" style={{ marginTop: 8 }}>
            {gedaanVan(stand, CODE)} van de {totaalVan(CODE)} lessen. Python, dan de webtalen.
          </p>
        </div>
        <div className="card">
          <h3>🔩 Bouwen</h3>
          <Balk p={gedaanVan(stand, PC) / totaalVan(PC) * 100} />
          <p className="klein" style={{ marginTop: 8 }}>
            {gedaanVan(stand, PC)} van de {totaalVan(PC)} lessen. Onderdelen, bouwen, werkend houden.
          </p>
        </div>
      </div>

      {stand.log.length > 1 && (
        <div className="card">
          <h3>De laatste twee weken</h3>
          <Grafiek stand={stand} nu={nu} />
        </div>
      )}

      <Kader kop="Hoe dit werkt">
        Elke les heeft uitleg, iets om zelf te doen en een paar vragen. Je krijgt punten voor
        elke les die je afmaakt en geld voor het werk — tot een vast bedrag per week. Daarna
        lopen de punten door, want leren stopt niet als het geld stopt.
      </Kader>
    </>
  )
}

function Grafiek({ stand, nu }: { stand: Stand; nu: string }): ReactNode {
  const dagen = Array.from({ length: 14 }, (_, k) => {
    const d = plusDagen(nu as IsoDatum, k - 13)
    return { d, n: stand.log.find((x) => x.d === d)?.lessen ?? 0 }
  })
  const max = Math.max(1, ...dagen.map((x) => x.n))
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 70, marginTop: 12 }}>
      {dagen.map((x) => (
        <div
          key={x.d}
          title={`${x.d}: ${x.n}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
        >
          <div style={{
            background: x.n ? 'var(--k)' : 'var(--surface-2)',
            height: `${Math.max(3, x.n / max * 100)}%`,
            borderRadius: 3,
          }} />
        </div>
      ))}
    </div>
  )
}
