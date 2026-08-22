/**
 * BID MEE — de app loopt met je mee
 *
 * Elke houding, elke tekst, met de tijd erbij. Zet hem op vanzelf en volg mee,
 * of tik zelf door zodat je je eigen tempo houdt. Doe dit eerst een paar keer
 * zonder wassing als oefening, en daarna echt.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { GEBEDEN, STAPPEN, etiket } from '../gegevens/gebed'
import { T } from '../gegevens/teksten'
import { HIFZ } from '../gegevens/hifz'
import type { Hifz } from '../gegevens/soorten'
import { Blad, Rijk } from '../onderdelen'
import { Houding } from '../figuren'
import { Blokkenvan, Tekstblok, useGeluid } from '../luisteren'
import { DUUR, bouwGebed, KORTE, kiesSoeras } from '../gebedsloop'
import { checkInsignes, checkMissie, markeerOefening, puntenErbij } from '../voortgang'
import { toon } from '../geluid'
import { soortTag } from './Wudu'
import { LANG } from './Stappen'
import type { Toestand } from '../toestand'
import type { Tab } from '../tabs'

interface Keuze { rak: number; naam: string; id: string }

export function Bidmee({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  const [keuze, zetKeuze] = useState<Keuze | null>(null)

  return (
    <div className="stack">
      <div className="card">
        <p className="meta">Onderdeel 3</p>
        <h2 style={{ marginTop: 4 }}>Bid mee</h2>
        <p className="klein" style={{ marginTop: 8 }}>
          Kies een gebed. De app loopt met je mee: elke houding, elke tekst, met de tijd erbij.
          Zet hem op vanzelf en volg mee, of tik zelf door zodat je je eigen tempo houdt.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Doe dit eerst een paar keer zonder wassing als oefening, en daarna echt.
        </p>
      </div>

      <div className="grid g3">
        {GEBEDEN.map((g) => (
          <button
            className="card klik" key={g.id}
            onClick={() => zetKeuze({ rak: g.rak, naam: g.naam, id: g.id })}
          >
            <div className="rij tussen">
              <h3>{g.naam}</h3>
              <span className="ar" style={{ color: 'var(--k)' }}>{g.ar}</span>
            </div>
            <p className="klein" style={{ marginTop: 5 }}>
              {g.rak} rak'a · {g.hardop.toLowerCase()}
            </p>
            <p className="klein" style={{ marginTop: 3 }}>{g.tijd}</p>
          </button>
        ))}
        <button className="card klik" onClick={() => zetKeuze({ rak: 2, naam: "Sunna (2 rak'a)", id: '' })}>
          <h3>Vrijwillig</h3>
          <p className="klein" style={{ marginTop: 5 }}>2 rak'a · zacht</p>
          <p className="klein">Voor de sunna van de Fajr, duha of de groet aan de moskee.</p>
        </button>
        <button className="card klik" onClick={() => zetKeuze({ rak: 1, naam: 'Witr', id: '' })}>
          <h3>Witr</h3>
          <p className="klein" style={{ marginTop: 5 }}>1 rak'a · na de shaf'</p>
          <p className="klein">De losse rak'a waarmee je de nacht afsluit.</p>
        </button>
      </div>

      <div className="card">
        <h3>Hardop of zacht?</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Bij Fajr, en in de eerste twee rak'a van Maghrib en Isha, lees je hardop. Bij Dhuhr en
          Asr lees je zacht, zodat je jezelf net hoort. In de rak'a die daarna nog komen lees je
          altijd zacht, en dan alleen al-Fatiha.
        </p>
      </div>

      <Blad open={keuze !== null} sluit={() => zetKeuze(null)}>
        {keuze !== null && (
          <Loop
            key={`${keuze.id}-${keuze.rak}`}
            keuze={keuze} t={t}
            sluit={() => zetKeuze(null)}
            naarVandaag={() => { zetKeuze(null); ga('vandaag') }}
          />
        )}
      </Blad>
    </div>
  )
}

function Loop({ keuze, t, sluit, naarVandaag }: {
  keuze: Keuze; t: Toestand; sluit: () => void; naarVandaag: () => void
}): ReactNode {
  const g = useGeluid()
  const { klok: k } = t
  const [soeras, zetSoeras] = useState<[Hifz, Hifz]>(() => kiesSoeras(k.ms % 100000))
  const [i, zetI] = useState(0)
  const [vanzelf, zetVanzelf] = useState(false)
  const [af, zetAf] = useState(false)
  const [voortgang, zetVoortgang] = useState(0)

  const seq = bouwGebed(keuze.rak, keuze.id, soeras)
  const q = seq[i]
  const s = q ? STAPPEN.find((x) => x.k === q.k) : undefined
  const t1 = s?.zeg ? T[s.zeg] : null
  const t2 = s?.zeg2 ? T[s.zeg2] : null
  const lang = s?.zeg ? LANG[s.zeg] : undefined

  const klaar = (): void => {
    t.zetProf((p) => {
      let uit = markeerOefening(p, k.vandaag, k.gisteren)
      uit = puntenErbij(uit, 15, k.vandaag, k.gisteren)
      uit = checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
      return checkInsignes(uit, t.spoor).stand
    })
    zetAf(true)
  }

  /* Het geluid bij de stap. De soera gaat als reeks, de losse zinnen los. */
  useEffect(() => {
    if (af || !s) return
    if (q?.soera) {
      const h = q.soera
      g.speelReeks(h.r.map((x, n) => [`q:${h.id}:${n + 1}`, x[0]]))
    } else if (lang) {
      const h = HIFZ.find((x) => x.id === lang)
      if (h) g.speelReeks(h.r.map((x, n) => [`q:${h.id}:${n + 1}`, x[0]]))
    } else if (t1) {
      g.speel(t1.aid ?? null, t1.ar)
    } else {
      toon('tik', t.stand.instel.geluid)
    }
  }, [i, af, soeras])

  /* De klok bij "vanzelf". Een soera duurt langer naarmate hij meer aya heeft. */
  const tikker = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (tikker.current) { clearInterval(tikker.current); tikker.current = null }
    zetVoortgang(0)
    if (!vanzelf || af || !q) return
    const totaal = (DUUR[q.k] ?? 6)
      * (q.soera ? 1 + (q.soera.aya ?? q.soera.r.length) * 0.55 : 1)
      / (t.stand.instel.tempo || 1)
    let rest = totaal
    tikker.current = setInterval(() => {
      rest -= 0.25
      zetVoortgang(Math.max(0, (1 - rest / totaal) * 100))
      if (rest <= 0) {
        if (i >= seq.length - 1) { klaar() } else zetI((n) => n + 1)
      }
    }, 250)
    return () => { if (tikker.current) clearInterval(tikker.current) }
  }, [i, vanzelf, af, soeras])

  if (af) {
    return (
      <>
        <h2>Het gebed is klaar</h2>
        <p style={{ marginTop: 10 }}>
          Blijf nog even zitten: drie keer <i>astaghfirullah</i>, en daarna de dhikr. Wil je hem
          meteen in je logboek zetten?
        </p>
        <div className="rij" style={{ marginTop: 18 }}>
          <button className="btn" onClick={naarVandaag}>Zet in mijn logboek</button>
          <button className="btn ghost" onClick={sluit}>Sluiten</button>
        </div>
      </>
    )
  }
  if (!q || !s) return null

  /* Een andere soera voor déze rak'a, zonder het gebed opnieuw te beginnen. */
  const andereSoera = (): void => {
    const rest = KORTE.filter((h) => h.id !== q.soera?.id)
    const nieuw = rest[Math.abs(k.ms + i * 31) % rest.length]
    if (!nieuw) return
    zetSoeras((oud) => (q.r === 1 ? [nieuw, oud[1]] : [oud[0], nieuw]))
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">{keuze.naam} · rak'a {q.r} van {keuze.rak}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {seq.map((_, x) => <i key={x} className={x <= i ? 'aan' : ''} />)}
      </div>
      <div className="podium" style={{ marginTop: 14 }}>
        <Houding naam={s.h} merk={s.merk} />
        <span className={`stap-uit tag ${soortTag(s.soort)}`}>{etiket(s.soort)}</span>
      </div>
      <h2 style={{ marginTop: 14 }}>{s.t}</h2>
      {q.midden && (
        <p className="klein">De eerste zitting: alleen de tashahhud, daarna sta je weer op.</p>
      )}
      {q.soera && (
        <>
          <div className="rij tussen" style={{ marginTop: 10 }}>
            <p className="meta">{q.soera.naam} · {q.soera.r.length} regels</p>
            <button className="btn ghost sm" onClick={andereSoera}>Andere soera</button>
          </div>
          <Blokkenvan hifzId={q.soera.id} />
        </>
      )}
      {lang ? <Blokkenvan hifzId={lang} /> : t1 && <Tekstblok o={t1} />}
      {t2 && <Tekstblok o={t2} />}
      {(s.extra ?? []).map((x) => {
        const e = T[x]
        return e ? <Tekstblok key={x} o={e} /> : null
      })}
      <ul className="net" style={{ marginTop: 10 }}>
        {s.doe.map((d, x) => <Rijk key={x} als="li" html={d} />)}
      </ul>
      {s.let && (
        <div className="kader let" style={{ marginTop: 12 }}>
          <h4>Let op</h4>
          <Rijk als="p" className="klein" style={{ marginTop: 4 }} html={s.let} />
        </div>
      )}
      <div className="rij tussen" style={{ marginTop: 18 }}>
        <button className="btn ghost sm" disabled={i === 0} onClick={() => zetI(i - 1)}>←</button>
        <div className="rij">
          <button className="btn ghost sm" onClick={() => zetVanzelf(!vanzelf)}>
            {vanzelf ? '⏸ Pauze' : '▶︎ Vanzelf'}
          </button>
          <button
            className="btn"
            onClick={() => (i === seq.length - 1 ? klaar() : zetI(i + 1))}
          >{i === seq.length - 1 ? 'Klaar' : 'Volgende →'}</button>
        </div>
      </div>
      <div className="bar dun" style={{ marginTop: 12 }}>
        <i style={{ width: `${voortgang}%` }} />
      </div>
    </>
  )
}
