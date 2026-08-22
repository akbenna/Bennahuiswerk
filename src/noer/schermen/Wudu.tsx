/**
 * DE WASSING — tien stappen, en het examen op volgorde
 *
 * Bij elke stap licht het lichaamsdeel op dat aan de beurt is. De kleur zegt
 * of het moet of dat het een gewoonte van de Profeet ﷺ is; dat onderscheid is
 * het hele punt van dit onderdeel, want een wassing zonder een fard-stap is
 * geen wassing en dan telt het gebed erna ook niet.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { WUDU, WUDU_REGELS } from '../gegevens/wudu'
import { etiket } from '../gegevens/gebed'
import type { Soortdeel } from '../gegevens/soorten'
import { Blad, Rijk, Tag } from '../onderdelen'
import { Wudufiguur } from '../figuren'
import { Tekstblok, useGeluid } from '../luisteren'
import { checkMissie, markeerOefening, puntenErbij } from '../voortgang'
import type { Toestand } from '../toestand'
import { Examen } from './Examen'

/** De kleur bij een soort: fard is rood, sunna is de huiskleur. */
export const soortTag = (s: Soortdeel): string =>
  (s === 'fard' ? 'fout' : s === 'na' ? '' : 'k')

export function Wudu({ t }: { t: Toestand }): ReactNode {
  const [loop, zetLoop] = useState<number | null>(null)
  const [examen, zetExamen] = useState(false)
  const ex = t.pr.examens['wudu']

  return (
    <div className="stack">
      <div className="card">
        <div className="rij tussen">
          <div>
            <p className="meta">Onderdeel 1</p>
            <h2 style={{ marginTop: 4 }}>
              De wassing <span className="ar" style={{ fontSize: '1.1rem', color: 'var(--k)' }}>الوضوء</span>
            </h2>
          </div>
          {ex?.gehaald && <Tag soort="goed">Examen gehaald</Tag>}
        </div>
        <p className="klein" style={{ marginTop: 8 }}>
          Tien stappen. Bij elke stap zie je welk deel aan de beurt is, hoe vaak, en of het moet
          of dat het een gewoonte van de Profeet ﷺ is.
        </p>
        <div className="rij" style={{ marginTop: 14 }}>
          <button className="btn groot" onClick={() => zetLoop(0)}>Stap voor stap doen</button>
          <button className="btn ghost" onClick={() => zetExamen(true)}>
            Examen: zet ze op volgorde
          </button>
        </div>
      </div>

      <div className="grid g2">
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h4>Wat betekenen de kleuren</h4>
          <p className="klein" style={{ marginTop: 4 }}>
            <Tag soort="fout">Moet</Tag> is fard: laat je dit weg, dan is je wassing niet geldig
            en is je gebed dat ook niet. <Tag soort="k">Sunna</Tag> is wat de Profeet ﷺ deed:
            sterk aanbevolen, en je wassing blijft geldig zonder.
          </p>
        </div>
        <div className="card">
          <h3>Wat moet (fard)</h3>
          <ul className="net" style={{ marginTop: 9 }}>
            {(WUDU_REGELS['fard'] ?? []).map((x) => <li key={x}>{x}</li>)}
          </ul>
          <p className="klein" style={{ marginTop: 10 }}>
            Wrijven en aaneengesloten doorgaan staan in andere scholen niet in dit rijtje. In de
            Malikitische school wel.
          </p>
        </div>
        <div className="card">
          <h3>Wat de Profeet ﷺ deed (sunna)</h3>
          <ul className="net" style={{ marginTop: 9 }}>
            {(WUDU_REGELS['sunna'] ?? []).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3>Hierdoor gaat je wassing weg</h3>
          <ul className="net" style={{ marginTop: 9 }}>
            {(WUDU_REGELS['breekt'] ?? []).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3>Hierdoor juist niet</h3>
          <ul className="net" style={{ marginTop: 9 }}>
            {(WUDU_REGELS['breektNiet'] ?? []).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      </div>

      <Blad open={loop !== null} sluit={() => zetLoop(null)}>
        {loop !== null && (
          <Wuduloop
            i={loop} t={t}
            ga={(n) => zetLoop(n)}
            sluit={() => zetLoop(null)}
            naarExamen={() => { zetLoop(null); zetExamen(true) }}
          />
        )}
      </Blad>

      <Blad open={examen} sluit={() => zetExamen(false)}>
        {examen && <Examen soort="wudu" t={t} sluit={() => zetExamen(false)} />}
      </Blad>
    </div>
  )
}

function Wuduloop({ i, t, ga, sluit, naarExamen }: {
  i: number; t: Toestand; ga: (n: number) => void; sluit: () => void; naarExamen: () => void
}): ReactNode {
  const g = useGeluid()
  const w = WUDU[i]
  const { klok: k } = t

  /* De tekst van de stap meteen laten horen: bij de wassing hoort maar één
     zin, en die wil je horen zodra je de stap opent. */
  useEffect(() => {
    if (w?.zeg) g.speel(w.zeg.aid ?? null, w.zeg.ar)
  }, [i])

  if (!w) {
    return (
      <>
        <h2>De wassing is klaar</h2>
        <p style={{ marginTop: 10 }}>
          Kijk omhoog en zeg de shahada. Ga daarna meteen bidden — dat is het mooiste moment.
        </p>
        <div className="rij" style={{ marginTop: 18 }}>
          <button className="btn" onClick={naarExamen}>Doe het examen</button>
          <button className="btn ghost" onClick={sluit}>Sluiten</button>
        </div>
      </>
    )
  }

  const klaar = (): void => {
    t.zetProf((p) => {
      let uit = markeerOefening(p, k.vandaag, k.gisteren)
      uit = puntenErbij(uit, 10, k.vandaag, k.gisteren)
      return checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    })
    ga(WUDU.length)
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">Wassing · stap {i + 1} van {WUDU.length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {WUDU.map((_, x) => <i key={x} className={x <= i ? 'aan' : ''} />)}
      </div>
      <div className="podium" style={{ marginTop: 16 }}>
        <Wudufiguur deel={w.deel} />
        <span className={`stap-uit tag ${soortTag(w.soort)}`}>{etiket(w.soort)}</span>
      </div>
      <h2 style={{ marginTop: 16 }}>
        {w.t} {w.aantal && <Tag style={{ verticalAlign: 'middle' }}>{w.aantal}</Tag>}
      </h2>
      <p className="nl" style={{ marginTop: 6 }}>{w.kort}</p>
      <ul className="net" style={{ marginTop: 12 }}>
        {w.hoe.map((h, x) => <Rijk key={x} als="li" html={h} />)}
      </ul>
      {w.tip && (
        <div className="kader" style={{ marginTop: 12 }}>
          <h4>Tip</h4>
          <p className="klein" style={{ marginTop: 4 }}>{w.tip}</p>
        </div>
      )}
      {w.zeg && <Tekstblok o={w.zeg} />}
      <div className="rij tussen" style={{ marginTop: 20 }}>
        <button className="btn ghost" disabled={i === 0} onClick={() => ga(i - 1)}>← Terug</button>
        <button
          className="btn"
          onClick={() => (i === WUDU.length - 1 ? klaar() : ga(i + 1))}
        >{i === WUDU.length - 1 ? 'Klaar' : 'Volgende →'}</button>
      </div>
    </>
  )
}
