/**
 * GEBEDSTIJDEN EN QIBLA
 *
 * Berekend uit de stand van de zon voor de plaats van het gezin. Er staat
 * uitdrukkelijk bij dat het een richtlijn is: de kalender van de eigen moskee
 * is de afspraak van de buurt, en die wint van een berekening.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { METHODEN, hijri, klok, qiblaHoek, volgendGebed } from '../gebedstijden'
import type { Tijden as Tijdenrij } from '../gebedstijden'
import { Melding } from '../onderdelen'
import { tijdenVan } from './Vandaag'
import type { Toestand } from '../toestand'
import type { Tab } from '../tabs'

const RIJEN: Array<[keyof Tijdenrij, string, string]> = [
  ['fajr', 'Fajr', 'الفجر'], ['op', 'Zonsopgang', 'الشروق'], ['dhuhr', 'Dhuhr', 'الظهر'],
  ['asr', 'Asr', 'العصر'], ['maghrib', 'Maghrib', 'المغرب'], ['isha', 'Isha', 'العشاء'],
]

export function Tijden({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  const [locMeld, zetLocMeld] = useState<{ tekst: string; soort?: 'fout' }>({ tekst: '' })
  const [kompasMeld, zetKompasMeld] = useState('')
  const [heading, zetHeading] = useState<number | null>(null)

  const g = t.stand.gezin
  const tijden = tijdenVan(t)
  const vg = volgendGebed(tijden.nu, tijden.morgen, t.klok.uur)
  const qh = qiblaHoek(g.lat, g.lon)

  /* Het kompas van de telefoon. Op iOS moet er eerst om toestemming gevraagd
     worden, en dat mag alleen vanuit een aanraking — vandaar de knop. */
  useEffect(() => () => { /* de luisteraar wordt in startKompas opgeruimd */ }, [])

  const startKompas = (): void => {
    const aan = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }): void => {
      const h = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null)
      if (h != null) zetHeading(h)
    }
    try {
      const D = DeviceOrientationEvent as unknown as
        { requestPermission?: () => Promise<string> }
      if (typeof D?.requestPermission === 'function') {
        void D.requestPermission().then((r) => {
          if (r === 'granted') {
            addEventListener('deviceorientation', aan as EventListener, true)
            zetKompasMeld('Draai rustig rond tot de wijzer recht vooruit staat.')
          } else zetKompasMeld('Geen toegang tot het kompas.')
        }).catch(() => zetKompasMeld('Geen toegang tot het kompas.'))
      } else if (window.DeviceOrientationEvent) {
        addEventListener('deviceorientationabsolute', aan as EventListener, true)
        addEventListener('deviceorientation', aan as EventListener, true)
        zetKompasMeld('Draai rustig rond tot de wijzer recht vooruit staat.')
      } else {
        zetKompasMeld('Dit toestel heeft geen kompas. Gebruik de graden hierboven met een gewoon kompas.')
      }
    } catch {
      zetKompasMeld('Het kompas werkt hier niet.')
    }
  }

  const zoekPlek = (): void => {
    if (!navigator.geolocation) {
      zetLocMeld({ tekst: 'Dit toestel geeft geen locatie door.', soort: 'fout' })
      return
    }
    zetLocMeld({ tekst: 'Even zoeken…' })
    navigator.geolocation.getCurrentPosition((p) => {
      t.zet((s) => ({
        ...s,
        gezin: {
          ...s.gezin,
          lat: Math.round(p.coords.latitude * 10000) / 10000,
          lon: Math.round(p.coords.longitude * 10000) / 10000,
          plaats: 'Mijn plek',
        },
      }))
      zetLocMeld({ tekst: '' })
    }, () => {
      zetLocMeld({
        tekst: 'Geen toegang tot je locatie. Vul de plaats handmatig in bij Ouder.',
        soort: 'fout',
      })
    }, { timeout: 10000 })
  }

  return (
    <>
      <div>
        <h1>Gebedstijden</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Berekend uit de stand van de zon voor jouw plaats. Neem het als richtlijn en houd de
          kalender van je eigen moskee aan; die is de afspraak van de buurt.
        </p>
      </div>

      <div className="grid g2">
        <div className="card">
          <p className="meta">Straks</p>
          <h2 style={{ marginTop: 4 }}>
            {vg.n}{vg.morgen && <span className="klein"> (morgen)</span>}
          </h2>
          <p className="cijfer" style={{ marginTop: 5 }}>{klok(vg.uur)}</p>
          <p className="klein">
            Over {Math.floor(vg.over / 60)} uur en {Math.round(vg.over % 60)} minuten
          </p>
          <hr className="rule" style={{ margin: '16px 0' }} />
          <p className="meta">{g.plaats} · {g.lat.toFixed(3)}, {g.lon.toFixed(3)}</p>
          <p className="klein" style={{ marginTop: 4 }}>{hijri(new Date(t.klok.ms))}</p>
          <div className="rij" style={{ marginTop: 12 }}>
            <button className="btn sm ghost" onClick={zoekPlek}>📍 Gebruik mijn plek</button>
            <button className="btn sm ghost" onClick={() => ga('ouder')}>Instellingen</button>
          </div>
          <Melding {...locMeld} />
        </div>

        <div className="card">
          <p className="meta">Vandaag</p>
          <div style={{ marginTop: 8 }}>
            {RIJEN.map(([k, n, a]) => (
              <div className={`tijdrij ${vg.k === k ? 'nu' : ''}`} key={k}>
                <span className="nm">{n}</span>
                <span className="ar" style={{ fontSize: '1.05rem', color: 'var(--muted)' }}>{a}</span>
                <span className="tijd">{klok(tijden.nu[k])}</span>
              </div>
            ))}
          </div>
          <p className="klein" style={{ marginTop: 12 }}>
            Methode: {METHODEN[g.methode].n} · Asr bij schaduw ×{g.asr} ·{' '}
            {g.hoog === 'geen'
              ? 'geen aanpassing'
              : `nacht in ${g.hoog === 'midden' ? 'tweeën' : 'zevenen'}`} bij hoge breedtegraad.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>De qibla</h2>
        <p className="klein" style={{ marginTop: 6 }}>
          Vanuit {g.plaats} ligt de Ka'ba op <b>{Math.round(qh)}°</b> — dat is zuidoost. Houd je
          telefoon plat; kan hij het kompas lezen, dan draait de wijzer mee.
        </p>
        <div className="kompas" style={{ marginTop: 16 }}>
          <Kompas hoek={qh} heading={heading} />
        </div>
        <div className="rij" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn sm ghost" onClick={startKompas}>Kompas gebruiken</button>
        </div>
        <p className="melding" style={{ textAlign: 'center' }}>{kompasMeld}</p>
      </div>
    </>
  )
}

function Kompas({ hoek, heading }: { hoek: number; heading: number | null }): ReactNode {
  const draai = heading == null ? 0 : -heading
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Qibla-richting">
      <g transform={`rotate(${draai} 100 100)`}>
        <circle cx="100" cy="100" r="88" fill="var(--surface-2)" stroke="var(--line-2)" strokeWidth="2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a} x1="100" y1="14" x2="100" y2={a % 90 === 0 ? 26 : 22}
            stroke="var(--line-2)" strokeWidth="2" transform={`rotate(${a} 100 100)`}
          />
        ))}
        <text x="100" y="40" textAnchor="middle" fontSize="13" fill="var(--muted)" fontFamily="var(--mono)">N</text>
        <g transform={`rotate(${hoek} 100 100)`}>
          <path d="M100 24 L110 62 L100 55 L90 62 Z" fill="var(--k)" />
          <text x="100" y="80" textAnchor="middle" fontSize="15" fill="var(--k)" fontFamily="var(--ar)">
            الكعبة
          </text>
        </g>
      </g>
      <circle cx="100" cy="100" r="6" fill="var(--ink)" />
      <text x="100" y="176" textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="var(--mono)">
        {Math.round(hoek)}°
      </text>
    </svg>
  )
}
