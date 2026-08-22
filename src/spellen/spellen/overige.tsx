/**
 * DE VIER OVERIGE SPELLEN
 *
 * Geheugenspel, Hoger of lager, Woord-warwinkel en Boter-kaas-eieren. Ze hebben
 * elk hun eigen vorm en delen alleen het kader.
 */
import { useState } from 'react'
import { Kader, RecordRegel, useLater } from './kader'
import type { SpelEigenschappen } from './kader'
import { LETTERS, WOORDEN } from '../gegevens'
import { hussel, pak, ri } from '../toeval'

/* ------------------------------------------------------------ Geheugenspel -- */
const PLAATJES = ['⚽', '🎮', '🍕', '🐶', '🌟', '🚀'] as const

export function Memory(p: SpelEigenschappen) {
  const arabisch = p.instel.memoryAr
  const [kaarten] = useState(() => {
    const set = arabisch ? hussel(LETTERS).slice(0, 6) : [...PLAATJES]
    return hussel([...set, ...set])
  })
  const [beurten, zetBeurten] = useState(0)
  const [open, zetOpen] = useState<number[]>([])
  const [gevonden, zetGevonden] = useState<Set<number>>(new Set())
  const later = useLater()

  const stand = (
    <>Beurten <b>{beurten}</b> · record{' '}
      <b>{p.record === undefined ? '—' : `${p.record} (minst)`}</b></>
  )

  function tik(i: number) {
    if (open.length >= 2 || gevonden.has(i) || open.includes(i)) return
    const nu = [...open, i]
    zetOpen(nu)
    if (nu.length < 2) return

    const [a, b] = nu as [number, number]
    zetBeurten((n) => n + 1)
    if (kaarten[a] === kaarten[b]) {
      p.piep('goed')
      later(() => {
        const nieuw = new Set(gevonden).add(a).add(b)
        zetGevonden(nieuw)
        zetOpen([])
        if (nieuw.size === kaarten.length) {
          p.opKlaar(beurten + 1, `Alle paren in ${beurten + 1} beurten.`)
        }
      }, 300)
    } else {
      p.piep('mis')
      later(() => zetOpen([]), 700)
    }
  }

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten} stand={stand}>
      <div className="rij" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn ghost sm"
                onClick={() => { p.zetInstel({ memoryAr: !arabisch }); p.opnieuw() }}>
          {arabisch ? 'Met plaatjes spelen' : 'Met Arabische letters spelen'}
        </button>
      </div>
      <div className="veld" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 320 }}>
        {kaarten.map((e, i) => {
          const zichtbaar = open.includes(i) || gevonden.has(i)
          return (
            <button key={i} type="button"
                    className={'vak' + (arabisch ? ' ar' : '') +
                               (gevonden.has(i) ? ' goed' : zichtbaar ? ' op' : ' dicht')}
                    onClick={() => tik(i)}>
              {zichtbaar ? e : '❓'}
            </button>
          )
        })}
      </div>
    </Kader>
  )
}

/* --------------------------------------------------------- Hoger of lager -- */
export function HogerOfLager(p: SpelEigenschappen) {
  const [doel] = useState(() => ri(1, 100))
  const [lo, zetLo] = useState(1)
  const [hi, zetHi] = useState(100)
  const [pogingen, zetPogingen] = useState(0)
  const [tip, zetTip] = useState('Ik denk aan een getal van 1 tot en met 100.')
  const [gok, zetGok] = useState('')

  function raad() {
    const g = Number(gok)
    if (!g) return
    const n = pogingen + 1
    zetPogingen(n)
    zetGok('')
    if (g === doel) {
      p.opKlaar(Math.max(1, 12 - n), `Goed! In ${n} keer.`)
      return
    }
    p.piep('mis')
    if (g < doel) { zetTip('Hoger! ⬆️'); zetLo((x) => Math.max(x, g + 1)) }
    else { zetTip('Lager! ⬇️'); zetHi((x) => Math.min(x, g - 1)) }
  }

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>Pogingen <b>{pogingen}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}>
      <div className="card midden">
        <p style={{ fontSize: '1.1rem' }}>{tip}</p>
        <p className="klein">tussen {lo} en {hi}</p>
        <input className="invoer" inputMode="numeric" autoComplete="off" placeholder="jouw gok"
               autoFocus value={gok} onChange={(e) => zetGok(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') raad() }} />
        <button type="button" className="btn" onClick={raad}>Raad</button>
      </div>
    </Kader>
  )
}

/* -------------------------------------------------------- Woord-warwinkel -- */
const doorElkaar = (woord: string): string => {
  let uit = woord
  while (uit === woord) uit = hussel(woord.split('')).join('')
  return uit
}

export function WoordWarwinkel(p: SpelEigenschappen) {
  const nieuwWoord = () => {
    const w = pak(WOORDEN) ?? WOORDEN[0]
    return { woord: w, door: doorElkaar(w) }
  }
  const [goed, zetGoed] = useState(0)
  const [ronde, zetRonde] = useState(nieuwWoord)
  const [invoer, zetInvoer] = useState('')
  const [melding, zetMelding] = useState('')
  const later = useLater()

  function controleer() {
    if (invoer.trim().toLowerCase() === ronde.woord) {
      zetGoed((n) => n + 1)
      p.piep('goed')
      zetMelding('Goed!')
      later(() => { zetRonde(nieuwWoord()); zetInvoer(''); zetMelding('') }, 600)
    } else {
      p.piep('mis')
      zetMelding('Nog niet…')
    }
  }

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>Goed <b>{goed}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}>
      <div className="card midden">
        <div className="groot" style={{ letterSpacing: '.22em', textTransform: 'uppercase' }}>
          {ronde.door}
        </div>
        <input className="invoer" autoComplete="off" placeholder="welk woord?" autoFocus
               style={{ fontFamily: 'var(--sans)' }} value={invoer}
               onChange={(e) => zetInvoer(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') controleer() }} />
        <p className="klein" style={{ minHeight: 20 }}>{melding}</p>
        <div className="rij" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={controleer}>Controleer</button>
          <button type="button" className="btn ghost"
                  onClick={() => { zetRonde(nieuwWoord()); zetInvoer(''); zetMelding('') }}>
            Overslaan
          </button>
          <button type="button" className="btn ghost"
                  onClick={() => p.opKlaar(goed, `Je had er ${goed} goed.`)}>
            Stoppen
          </button>
        </div>
      </div>
    </Kader>
  )
}

/* ----------------------------------------------------- Boter-kaas-eieren -- */
const LIJNEN = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6],
  [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
] as const

type Bord = string[]
const wint = (b: Bord, s: string): boolean => LIJNEN.some((l) => l.every((i) => b[i] === s))

/** De computer kijkt of hij kan winnen, blokkeert anders, pakt anders het
 *  midden. Verliezen mag, maar cadeautjes geven is niet leuk. */
function computerZet(bord: Bord): number | null {
  const leeg = bord.map((x, j) => (x ? null : j)).filter((j): j is number => j !== null)
  if (!leeg.length) return null
  for (const j of leeg) { const t = bord.slice(); t[j] = '🤖'; if (wint(t, '🤖')) return j }
  for (const j of leeg) { const t = bord.slice(); t[j] = '🙂'; if (wint(t, '🙂')) return j }
  if (!bord[4]) return 4
  return pak(leeg) ?? leeg[0] as number
}

export function BoterKaasEieren(p: SpelEigenschappen & { gewonnen: number; opGewonnen: () => void }) {
  const [bord, zetBord] = useState<Bord>(() => Array(9).fill(''))
  const [melding, zetMelding] = useState('')

  function zet(i: number) {
    if (bord[i] || melding) return
    const n = bord.slice()
    n[i] = '🙂'
    if (wint(n, '🙂')) {
      p.piep('goed')
      p.opGewonnen()
      zetBord(n)
      zetMelding('🎉 Jij wint!')
      return
    }
    if (n.every(Boolean)) { zetBord(n); zetMelding('🤝 Gelijkspel.'); return }

    const keus = computerZet(n)
    if (keus != null) n[keus] = '🤖'
    zetBord(n)
    if (wint(n, '🤖')) {
      p.piep('mis')
      zetMelding('🤖 De computer wint. Volgende keer beter.')
    } else if (n.every(Boolean)) {
      zetMelding('🤝 Gelijkspel.')
    }
  }

  return (
    <Kader spel={p.spel} opSluiten={p.opSluiten}
           stand={<>Gewonnen <b>{p.gewonnen}</b> keer</>}>
      {melding && (
        <div className="card midden"><p style={{ fontWeight: 600, margin: 0 }}>{melding}</p></div>
      )}
      <div className="veld" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 250 }}>
        {bord.map((c, i) => (
          <button key={i} type="button" className="vak" style={{ fontSize: '1.7rem' }}
                  onClick={() => zet(i)}>{c}</button>
        ))}
      </div>
      <div className="rij" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn ghost"
                onClick={() => { zetBord(Array(9).fill('')); zetMelding('') }}>
          Nieuw potje
        </button>
      </div>
    </Kader>
  )
}
