/** HET PROGRAMMA — achtentwintig weken in vijf blokken, en waar je staat. */
import type { ReactNode } from 'react'
import { CURRICULUM } from '../gegevens/curriculum'
import { PROGRAMMA, weekTitel } from '../programma'
import { Tag, Vink, nul } from '../onderdelen'
import type { Stand } from '../opslag'

export function Programma(
  { stand, naarWeek }: { stand: Stand; naarWeek: (nr: number) => void },
): ReactNode {
  return (
    <>
      <h1>Programma</h1>
      <p className="lede muted" style={{ marginTop: 10, maxWidth: '58ch' }}>
        Achtentwintig weken in vijf blokken. Drieëntwintig lesweken, elk met een brontekst, en
        na elk blok een consolidatieweek zonder nieuwe stof.
      </p>

      <div style={{ marginTop: 20 }}>
        {CURRICULUM.map((sp) => {
          const rijen = PROGRAMMA.filter((w) => w.sp.id === sp.id)
          const k = rijen.filter((w) => stand.klaar[w.nr]).length
          return (
            <div key={sp.id}>
              <div className="blokkop">
                <Tag kleur={sp.kleur}>Blok {sp.nr}</Tag>
                <h3 style={{ flex: 1 }}>{sp.titel}</h3>
                <span className="meta">{k}/{rijen.length}</span>
              </div>
              <p className="small muted" style={{ margin: '0 0 10px', maxWidth: '60ch' }}>
                {sp.ondertitel}
              </p>
              {rijen.map((w) => (
                <button
                  type="button"
                  key={w.nr}
                  className={`wk${stand.klaar[w.nr] ? ' done' : ''}${w.type === 'cons' ? ' cons' : ''}`}
                  onClick={() => naarWeek(w.nr)}
                >
                  <span className="n">{nul(w.nr)}</span>
                  <span className="mk">{stand.klaar[w.nr] ? <Vink /> : null}</span>
                  <span className="t">
                    <b>{weekTitel(w)}</b>
                    <span>{w.type === 'les'
                      ? 'brontekst · uitleg · toepassing · toets'
                      : 'synthese en herhaling'}</span>
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <hr className="rule" />
      <div className="card">
        <span className="meta">Hoe dit programma is opgezet</span>
        <p className="small" style={{ marginTop: 10 }}>
          De didactiek volgt vier principes die voor volwassen leren het best onderbouwd zijn.{' '}
          <b>Ophalen boven herlezen</b>: elke week eindigt met een toets, en de kaarten dwingen
          actief terughalen in plaats van herkennen. <b>Spreiding</b>: kaarten komen terug op
          groeiende intervallen, niet wanneer het toevallig uitkomt. <b>Vervlechting</b>: de
          herhaling mengt bewust sporen door elkaar, wat lastiger voelt en beter beklijft.{' '}
          <b>Verankering in ervaring</b>: elke week vraagt om toepassing op je eigen praktijk,
          omdat volwassenen leren vanuit een probleem en niet vanuit een leerstof.
        </p>
        <p className="small" style={{ marginBottom: 0 }}>
          Het weekritme is bewust traag. Achtentwintig weken van vijftig minuten is minder dan
          twintig uur — maar gespreid over zeven maanden, en dat is wat het verschil maakt.
        </p>
      </div>
    </>
  )
}
