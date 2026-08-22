/**
 * DE SPELLEN MET EEN RASTER
 *
 * Mollen meppen, Letterjacht, Veelvouden-vangst en Volg de kleuren. Ze delen
 * dat er een raster met vakken staat waar je op tikt; wat er in die vakken
 * gebeurt verschilt te veel om ze samen te nemen.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Kader, RecordRegel, useKlok, useLater } from './kader'
import type { SpelEigenschappen } from './kader'
import { LETTERS } from '../gegevens'
import { hussel, pak, ri } from '../toeval'

/* ---------------------------------------------------------- Mollen meppen -- */
export function Mollen(p: SpelEigenschappen) {
  const [score, zetScore] = useState(0)
  const [plek, zetPlek] = useState(-1)
  const tijd = useKlok(20, () => p.opKlaar(score, `Je hebt er ${score} gemept.`))

  useEffect(() => {
    const t = setInterval(() => zetPlek(ri(0, 8)), 720)
    return () => clearInterval(t)
  }, [])

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>⏱ <b>{tijd}</b>s · 🏆 <b>{score}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}>
      <div className="veld" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 300 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} type="button" className={'vak' + (i === plek ? ' op' : '')}
                  onClick={() => {
                    if (i !== plek) return
                    zetScore((n) => n + 1)
                    p.piep('goed')
                    zetPlek(-1)
                  }}>
            {i === plek ? '🦔' : ''}
          </button>
        ))}
      </div>
    </Kader>
  )
}

/* ------------------------------------------------------------ Letterjacht -- */
interface Letterronde { doel: string; rij: string[] }

const maakLetterronde = (): Letterronde => {
  const doel = pak(LETTERS) ?? LETTERS[0]
  const rest = LETTERS.filter((l) => l !== doel)
  const hoeveel = ri(2, 4)
  const rij = hussel(Array.from({ length: 9 }, (_, i) =>
    i < hoeveel ? doel : (pak(rest) ?? rest[0] as string)))
  return { doel, rij }
}

export function Letterjacht(p: SpelEigenschappen) {
  const [score, zetScore] = useState(0)
  const [ronde, zetRonde] = useState<Letterronde>(maakLetterronde)
  const [geraakt, zetGeraakt] = useState<Record<number, 'goed' | 'mis'>>({})
  const tijd = useKlok(40, () => p.opKlaar(score))
  const later = useLater()

  const over = ronde.rij.filter((l, i) => l === ronde.doel && !geraakt[i]).length

  useEffect(() => {
    if (over === 0 && Object.keys(geraakt).length > 0) {
      later(() => { zetRonde(maakLetterronde()); zetGeraakt({}) }, 350)
    }
  }, [over, geraakt, later])

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>⏱ <b>{tijd}</b>s · 🏆 <b>{score}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}>
      <div className="card midden">
        <p className="klein">Zoek deze letter</p>
        <div className="ar" style={{ fontSize: '3rem', lineHeight: 1.4 }}>{ronde.doel}</div>
      </div>
      <div className="veld" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 300 }}>
        {ronde.rij.map((l, i) => (
          <button key={i} type="button" className={'vak ar ' + (geraakt[i] ?? '')}
                  disabled={geraakt[i] != null}
                  onClick={() => {
                    const raak = l === ronde.doel
                    zetGeraakt((g) => ({ ...g, [i]: raak ? 'goed' : 'mis' }))
                    zetScore((n) => (raak ? n + 1 : Math.max(0, n - 1)))
                    p.piep(raak ? 'goed' : 'mis')
                  }}>
            {l}
          </button>
        ))}
      </div>
    </Kader>
  )
}

/* ------------------------------------------------------ Veelvouden-vangst -- */
export function Veelvouden(p: SpelEigenschappen) {
  const tafel = useRef(ri(2, 9)).current
  const maakRij = useCallback(() => Array.from({ length: 9 }, () => {
    if (Math.random() < 0.45) return tafel * ri(1, 9)
    let x: number
    do { x = ri(2, 90) } while (x % tafel === 0)
    return x
  }), [tafel])

  const [score, zetScore] = useState(0)
  const [rij, zetRij] = useState<number[]>(maakRij)
  const [geraakt, zetGeraakt] = useState<Record<number, 'goed' | 'mis'>>({})
  const tijd = useKlok(30, () => p.opKlaar(score))
  const later = useLater()

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>⏱ <b>{tijd}</b>s · 🏆 <b>{score}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}>
      <div className="card midden"><p>Tik alle veelvouden van <b>{tafel}</b></p></div>
      <div className="veld" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 320 }}>
        {rij.map((n, i) => (
          <button key={i} type="button" className={'vak ' + (geraakt[i] ?? '')}
                  style={{ fontSize: '1.15rem' }} disabled={geraakt[i] != null}
                  onClick={() => {
                    const raak = n % tafel === 0
                    zetGeraakt((g) => ({ ...g, [i]: raak ? 'goed' : 'mis' }))
                    zetScore((s) => (raak ? s + 1 : Math.max(0, s - 1)))
                    p.piep(raak ? 'goed' : 'mis')
                    later(() => { zetRij(maakRij()); zetGeraakt({}) }, 550)
                  }}>
            {n}
          </button>
        ))}
      </div>
    </Kader>
  )
}

/* ------------------------------------------------------- Volg de kleuren -- */
const KLEUREN = ['#C0392B', '#1E8449', '#1F618D', '#B7950B'] as const

export function Simon(p: SpelEigenschappen) {
  const [reeks, zetReeks] = useState<number[]>(() => [ri(0, 3)])
  const [pos, zetPos] = useState(0)
  const [toont, zetToont] = useState(true)
  const [licht, zetLicht] = useState(-1)
  const later = useLater()

  /* De reeks afspelen. Zolang dit loopt mag er niet getikt worden — anders telt
     een tik tijdens het voorspelen mee als antwoord. */
  useEffect(() => {
    zetToont(true)
    zetPos(0)
    let i = 0
    const stap = () => {
      if (i >= reeks.length) { zetLicht(-1); zetToont(false); return }
      const nu = reeks[i] as number
      zetLicht(nu)
      p.piep('piep')
      i++
      later(() => { zetLicht(-1); later(stap, 230) }, 330)
    }
    later(stap, 500)
    // alleen bij een nieuwe reeks opnieuw afspelen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reeks])

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>Niveau <b>{reeks.length}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}
           knop={<p className="klein" style={{ marginTop: 8 }}>{toont ? 'Kijk goed…' : 'Jouw beurt'}</p>}>
      <div className="veld" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 280 }}>
        {KLEUREN.map((c, i) => (
          <button key={c} type="button" className="vak"
                  style={{ background: licht === i ? c : c + '55', borderColor: c }}
                  onClick={() => {
                    if (toont) return
                    zetLicht(i)
                    later(() => zetLicht(-1), 330)
                    if (i === reeks[pos]) {
                      if (pos + 1 >= reeks.length) {
                        zetToont(true)
                        later(() => zetReeks((r) => [...r, ri(0, 3)]), 600)
                      } else {
                        zetPos((n) => n + 1)
                      }
                    } else {
                      zetToont(true)
                      p.opKlaar(reeks.length - 1, `Je kwam tot niveau ${reeks.length - 1}.`)
                    }
                  }} />
        ))}
      </div>
    </Kader>
  )
}
