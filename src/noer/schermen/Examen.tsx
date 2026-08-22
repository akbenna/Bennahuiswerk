/**
 * HET EXAMEN — de stappen op volgorde zetten
 *
 * Eén fout mag. Dat is geen mildheid maar een keuze: wie de volgorde kent maar
 * één keer misklikt heeft het geleerd, en een examen dat op één tik afketst
 * leert een kind vooral dat het niet nog eens moet proberen.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { WUDU } from '../gegevens/wudu'
import { STAPPEN } from '../gegevens/gebed'
import { INSIGNES } from '../gegevens/beloning'
import { TARIEF } from '../opslag'
import { XP, checkInsignes, checkMissie, markeerOefening, puntenErbij, verdien } from '../voortgang'
import { toon } from '../geluid'
import type { Toestand } from '../toestand'

/** De stappen die niet in het examen meedoen: die staan los van de volgorde. */
const BUITEN = ['iqama', 'opstaan', 'qunut', 'nagebed']

function hussel<T>(a: T[], zaad: number): T[] {
  const b = a.slice()
  let z = zaad || 1
  for (let i = b.length - 1; i > 0; i--) {
    z = (z * 1103515245 + 12345) & 0x7fffffff
    const j = z % (i + 1)
    ;[b[i], b[j]] = [b[j] as T, b[i] as T]
  }
  return b
}

export function Examen({ soort, t, sluit }: {
  soort: 'wudu' | 'salah'; t: Toestand; sluit: () => void
}): ReactNode {
  const bron = soort === 'wudu'
    ? WUDU.map((w) => ({ id: w.id, t: w.t }))
    : STAPPEN.filter((s) => !BUITEN.includes(s.k)).map((s) => ({ id: s.k, t: s.t }))
  const juist = bron.map((b) => b.id)

  const [gelegd, zetGelegd] = useState<string[]>([])
  const [fouten, zetFouten] = useState(0)
  const [mis, zetMis] = useState<string | null>(null)
  const [af, zetAf] = useState<{ gehaald: boolean; verdiend: number; nieuw: string[] } | null>(null)
  const [ronde, zetRonde] = useState(0)

  const { klok: k } = t

  const afronden = (fout: number): void => {
    const gehaald = fout <= 1
    let verdiend = 0
    let nieuw: string[] = []
    t.zetProf((p) => {
      let uit = p
      if (gehaald) {
        const eerste = !p.examens[soort]?.gehaald
        uit = { ...uit, examens: { ...uit.examens, [soort]: { gehaald: true, d: k.vandaag } } }
        uit = puntenErbij(uit, XP.examen, k.vandaag, k.gisteren)
        if (eerste) {
          const b = verdien(
            uit, 'Examen ' + (soort === 'wudu' ? 'wassing' : 'gebed'),
            soort === 'wudu' ? TARIEF.examenWudu : TARIEF.examenSalah,
            t.stand.gezin.budget, k.vandaag, k.ms)
          uit = b.stand
          verdiend = b.echt
        }
        toon('top', t.stand.instel.geluid)
      }
      uit = markeerOefening(uit, k.vandaag, k.gisteren)
      const ins = checkInsignes(uit, t.spoor)
      nieuw = ins.nieuw
      return checkMissie(ins.stand, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    })
    zetAf({ gehaald, verdiend, nieuw })
  }

  const opnieuw = (): void => {
    zetGelegd([])
    zetFouten(0)
    zetMis(null)
    zetAf(null)
    zetRonde((n) => n + 1)
  }

  if (af) {
    return (
      <>
        <h2>{af.gehaald ? 'Gehaald!' : 'Nog niet'}</h2>
        <p style={{ marginTop: 10 }}>
          {af.gehaald
            ? `Je kent de volgorde. ${af.verdiend > 0 ? `${euro(af.verdiend)} erbij.` : ''}`
            : `Je maakte ${fouten} fouten. Loop de stappen nog een keer door en probeer het opnieuw.`}
        </p>
        {af.nieuw.length > 0 && (
          <div className="kader" style={{ marginTop: 14 }}>
            <h4>Nieuw insigne</h4>
            <p>{af.nieuw.map((x) => {
              const b = INSIGNES.find((y) => y.id === x)
              return b ? `${b.ico} ${b.n}` : x
            }).join(' · ')}</p>
          </div>
        )}
        <div className="rij" style={{ marginTop: 18 }}>
          <button className="btn" onClick={opnieuw}>Nog een keer</button>
          <button className="btn ghost" onClick={sluit}>Sluiten</button>
        </div>
      </>
    )
  }

  const los = hussel(bron.filter((b) => !gelegd.includes(b.id)), (ronde + 1) * 7919 + gelegd.length)

  const tik = (id: string): void => {
    if (id === juist[gelegd.length]) {
      const nu = [...gelegd, id]
      zetGelegd(nu)
      zetMis(null)
      toon('tik', t.stand.instel.geluid)
      if (nu.length === juist.length) afronden(fouten)
    } else {
      const f = fouten + 1
      zetFouten(f)
      zetMis(id)
      toon('mis', t.stand.instel.geluid)
      setTimeout(() => zetMis(null), 320)
    }
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">Examen · {soort === 'wudu' ? 'de wassing' : 'het gebed'}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <h2 style={{ marginTop: 6 }}>Zet ze op volgorde</h2>
      <p className="klein" style={{ marginTop: 6 }}>
        Tik ze aan van eerst naar laatst. Je mag één fout maken.
      </p>
      <div className="doos" style={{ marginTop: 14, direction: 'ltr' }}>
        {gelegd.length ? gelegd.map((id, i) => (
          <span
            className="woord" key={id}
            style={{ fontFamily: 'var(--sans)', fontSize: '.86rem', direction: 'ltr' }}
          >{i + 1}. {bron.find((b) => b.id === id)?.t}</span>
        )) : <span className="klein">Nog niets gekozen</span>}
      </div>
      <div className="woorden" style={{ marginTop: 14, direction: 'ltr' }}>
        {los.map((b) => (
          <button
            className={`woord${mis === b.id ? ' fout' : ''}`} key={b.id}
            style={{ fontFamily: 'var(--sans)', fontSize: '.88rem', direction: 'ltr' }}
            onClick={() => tik(b.id)}
          >{b.t}</button>
        ))}
      </div>
      <p className="klein" style={{ marginTop: 12 }}>Fouten: {fouten}</p>
    </>
  )
}
