/**
 * HET GEBED, STAP VOOR STAP
 *
 * Twaalf onderdelen: wat je doet, wat je zegt, waar je op moet letten. De
 * kleuren zeggen wat verplicht is en wat niet, en dat onderscheid staat er
 * groot bij: een gebed zonder een fard-onderdeel telt niet, terwijl je een
 * sunna kunt vergeten en gewoon door kunt gaan.
 *
 * Onderaan staan drie dingen die in deze school niet bij het verplichte gebed
 * horen. Kennen is wel nuttig — je staat vroeg of laat achter een imam die het
 * wél doet.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NAAST, STAPPEN, etiket } from '../gegevens/gebed'
import { T } from '../gegevens/teksten'
import { HIFZ } from '../gegevens/hifz'
import { Blad, Rijk, Tag } from '../onderdelen'
import { Houding } from '../figuren'
import { Blokkenvan, Tekstblok, useGeluid } from '../luisteren'
import { checkMissie, markeerOefening, puntenErbij } from '../voortgang'
import type { Toestand } from '../toestand'
import { Examen } from './Examen'
import { soortTag } from './Wudu'
import { Opnemer } from './Opnemer'

/** Teksten die te lang zijn voor één blok staan al regel voor regel in HIFZ. */
export const LANG: Record<string, string> = {
  iqama: 'h-iqama', fatiha: 'h-fatiha', tashahhud: 'h-tashahhud', salawat: 'h-salawat',
}

export function Stappen({ t }: { t: Toestand }): ReactNode {
  const [loop, zetLoop] = useState<number | null>(null)
  const [examen, zetExamen] = useState(false)
  const ex = t.pr.examens['salah']

  return (
    <div className="stack">
      <div className="card">
        <div className="rij tussen">
          <div>
            <p className="meta">Onderdeel 2</p>
            <h2 style={{ marginTop: 4 }}>Het gebed, stap voor stap</h2>
          </div>
          {ex?.gehaald && <Tag soort="goed">Examen gehaald</Tag>}
        </div>
        <p className="klein" style={{ marginTop: 8 }}>
          Twaalf onderdelen: wat je doet, wat je zegt, en waar je op moet letten. Je kunt elke
          tekst horen en jezelf opnemen om terug te luisteren.
        </p>
        <div className="rij" style={{ marginTop: 14 }}>
          <button className="btn groot" onClick={() => zetLoop(0)}>Beginnen bij de intentie</button>
          <button className="btn ghost" onClick={() => zetExamen(true)}>
            Examen: zet ze op volgorde
          </button>
        </div>
      </div>

      <div className="grid g3">
        {STAPPEN.map((s, i) => (
          <button className="card klik" key={s.k} style={{ padding: '14px 15px' }} onClick={() => zetLoop(i)}>
            <div className="rij tussen">
              <Tag soort={soortTag(s.soort)}>{etiket(s.soort)}</Tag>
              <span className="meta">{i + 1}</span>
            </div>
            <h4 style={{ marginTop: 8 }}>{s.t}</h4>
          </button>
        ))}
      </div>

      <div className="kader" style={{ marginTop: 12 }}>
        <h4>Wat betekenen de kleuren</h4>
        <p className="klein" style={{ marginTop: 4 }}>
          <Tag soort="fout">Moet</Tag> is fard: valt dit weg, dan telt je gebed niet en begin je
          opnieuw. <Tag soort="k">Sunna</Tag> is sterk aanbevolen: vergeet je het, dan blijft je
          gebed geldig — bij twee of meer herstel je het met de knieval van vergetelheid.{' '}
          <Tag>Na het gebed</Tag> hoort er niet meer bij, maar de Profeet ﷺ bleef er wel voor zitten.
        </p>
      </div>

      <div className="card">
        <h3>De verplichte onderdelen van het gebed</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Deze horen er volgens de Malikitische school echt bij; valt er één weg, dan telt het
          gebed niet.
        </p>
        <ul className="net" style={{ marginTop: 10 }}>
          <li>De intentie</li><li>De openingstakbir, staand uitgesproken</li>
          <li>Staan bij de Fatiha</li><li>Al-Fatiha lezen in elke rak'a</li>
          <li>De buiging</li><li>Rechtop komen uit de buiging</li>
          <li>De knieval</li><li>Overeind komen uit de knieval</li>
          <li>Rust in elke houding</li><li>De volgorde aanhouden</li>
          <li>De slotgroet, zittend</li>
        </ul>
        <p className="klein" style={{ marginTop: 10 }}>
          De soera na de Fatiha, de takbirs onderweg, de eerste zitting en de tashahhud zijn
          sterk aanbevolen (sunna mu'akkada). Vergeet je er twee of meer, dan herstel je dat met
          de knieval van vergetelheid — zie <b>Als het misgaat</b>.
        </p>
      </div>

      <div className="card">
        <h3>Naast de volgorde</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Deze drie staan niet in de stappen hierboven, omdat ze in deze school niet bij het
          verplichte gebed horen. Kennen is wel nuttig: in een vrijwillig gebed mag je ze zeggen,
          en je staat vroeg of laat achter een imam die het wél doet.
        </p>
        <div className="stack" style={{ marginTop: 12 }}>
          {NAAST.map((x) => {
            const w = T[x.zeg]
            return (
              <div className="card plat" key={x.zeg}>
                <div className="rij tussen"><h4>{x.t}</h4><Tag>{x.w}</Tag></div>
                {w && <Tekstblok o={w} />}
                <Rijk als="p" className="klein" style={{ marginTop: 8 }} html={x.u} />
              </div>
            )
          })}
        </div>
      </div>

      <Blad open={loop !== null} sluit={() => zetLoop(null)}>
        {loop !== null && (
          <Stapblad i={loop} t={t} ga={(n) => zetLoop(n)} sluit={() => zetLoop(null)} />
        )}
      </Blad>
      <Blad open={examen} sluit={() => zetExamen(false)}>
        {examen && <Examen soort="salah" t={t} sluit={() => zetExamen(false)} />}
      </Blad>
    </div>
  )
}

function Stapblad({ i, t, ga, sluit }: {
  i: number; t: Toestand; ga: (n: number) => void; sluit: () => void
}): ReactNode {
  const g = useGeluid()
  const s = STAPPEN[i]
  const { klok: k } = t
  const t1 = s?.zeg ? T[s.zeg] : null
  const t2 = s?.zeg2 ? T[s.zeg2] : null
  const lang = s?.zeg ? LANG[s.zeg] : undefined

  useEffect(() => {
    if (!s) return
    if (lang) {
      const h = HIFZ.find((x) => x.id === lang)
      if (h) g.speelReeks(h.r.map((x, n) => [`q:${h.id}:${n + 1}`, x[0]]))
    } else if (t1) {
      g.speel(t1.aid ?? null, t1.ar)
    }
  }, [i])

  if (!s) return null

  const klaar = (): void => {
    t.zetProf((p) => {
      let uit = markeerOefening(p, k.vandaag, k.gisteren)
      uit = puntenErbij(uit, 10, k.vandaag, k.gisteren)
      return checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    })
    sluit()
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">Gebed · stap {i + 1} van {STAPPEN.length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {STAPPEN.map((_, x) => <i key={x} className={x <= i ? 'aan' : ''} />)}
      </div>
      <div className="podium" style={{ marginTop: 16 }}>
        <Houding naam={s.h} merk={s.merk} />
        <span className={`stap-uit tag ${soortTag(s.soort)}`}>{etiket(s.soort)}</span>
      </div>
      <h2 style={{ marginTop: 16 }}>{s.t}</h2>
      <ul className="net" style={{ marginTop: 10 }}>
        {s.doe.map((d, x) => <Rijk key={x} als="li" html={d} />)}
      </ul>
      {lang
        ? <Blokkenvan hifzId={lang} staart={<Opnemer id={`eigen:${lang}`} />} />
        : t1 && <Tekstblok o={t1} staart={<Opnemer id={t1.aid ?? `eigen:${s.zeg ?? s.k}`} />} />}
      {t2 && <Tekstblok o={t2} />}
      {(s.extra ?? []).map((x) => {
        const e = T[x]
        return e ? <Tekstblok key={x} o={e} /> : null
      })}
      {s.let && (
        <div className="kader let" style={{ marginTop: 14 }}>
          <h4>Let op</h4>
          <Rijk als="p" html={s.let} />
        </div>
      )}
      <div className="rij tussen" style={{ marginTop: 20 }}>
        <button className="btn ghost" disabled={i === 0} onClick={() => ga(i - 1)}>← Terug</button>
        <button
          className="btn"
          onClick={() => (i === STAPPEN.length - 1 ? klaar() : ga(i + 1))}
        >{i === STAPPEN.length - 1 ? 'Klaar' : 'Volgende →'}</button>
      </div>
    </>
  )
}
