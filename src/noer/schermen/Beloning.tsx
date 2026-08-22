/**
 * BELONING — punten voor alles, euro's voor wat je écht leert
 *
 * Een les halen, een tekst uit je hoofd kennen, een examen halen en de
 * dagopdracht afmaken. Het gebed zelf staat er standaard buiten: dat is een
 * keuze, en de uitleg staat bij het ouderscherm.
 *
 * De stickerkaart loopt van maandag tot en met zondag en eindigt in de week van
 * vandaag. Vier volle weken, netjes uitgelijnd — een rij die halverwege begint
 * leest een kind niet als een kalender.
 */
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { INSIGNES } from '../gegevens/beloning'
import { TARIEF } from '../opslag'
import { niveauVan, verdiendDezeWeek } from '../voortgang'
import { Balk, Tag } from '../onderdelen'
import { GeenProfiel } from './Vandaag'
import type { Toestand } from '../toestand'
import type { Tab } from '../tabs'

const twee = (n: number): string => String(n).padStart(2, '0')
const isoVan = (d: Date): string =>
  `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`

export function Beloning({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  if (!t.profiel) return <GeenProfiel ga={ga} />

  const { pr } = t
  const nv = niveauVan(pr.punten)
  const week = verdiendDezeWeek(pr, t.klok.ms)
  const budget = t.stand.gezin.budget
  const heb = new Set(pr.insignes)

  const nu = new Date(t.klok.ms)
  const naZondag = (7 - (nu.getDay() || 7)) % 7
  const eind = new Date(t.klok.ms + naZondag * 864e5)
  const dagen = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(eind.getTime() - (27 - i) * 864e5)
    return {
      s: isoVan(d),
      komt: d > nu,
      nu: d.toDateString() === nu.toDateString(),
      n: d.getDate(),
    }
  })
  const laatste = pr.verdiensten.slice(-8).reverse()
  const uitbetaald = pr.betalingen.reduce((s, b) => s + b.b, 0)

  return (
    <>
      <div>
        <h1>Beloning</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Je verdient punten met alles wat je doet, en euro's met wat je écht leert: een les
          halen, een tekst uit je hoofd kennen, een examen halen en je dagopdracht afmaken.
          Uitbetalen doet je vader of moeder.
        </p>
      </div>

      <div className="grid g4">
        <div className="card">
          <p className="meta">Punten</p><p className="cijfer">{pr.punten}</p>
          <p className="klein">{nv.ico} {nv.naam}</p>
        </div>
        <div className="card">
          <p className="meta">Dagen op rij</p><p className="cijfer">{pr.reeks}</p>
          <p className="klein">Beste gewoonte die er is</p>
        </div>
        <div className="card">
          <p className="meta">Nog niet uitbetaald</p><p className="cijfer">{euro(pr.saldo)}</p>
          <p className="klein">Vraag het thuis</p>
        </div>
        <div className="card">
          <p className="meta">Deze week verdiend</p><p className="cijfer">{euro(week)}</p>
          <div style={{ marginTop: 6 }}><Balk pct={week / budget * 100} /></div>
          <p className="klein">van {euro(budget)}</p>
        </div>
      </div>

      <div className="card">
        <div className="rij tussen">
          <h3>Naar het volgende niveau</h3>
          <Tag soort="k">{nv.volgend ?? 'Hoogste bereikt'}</Tag>
        </div>
        <div style={{ marginTop: 10 }}><Balk pct={nv.pct} /></div>
        <p className="klein" style={{ marginTop: 8 }}>
          {nv.volgend ? `Nog ${nv.naar} punten.` : 'Je hebt alle niveaus gehaald. Nu vasthouden.'}
        </p>
      </div>

      <div className="card">
        <h3>Je stickerkaart</h3>
        <p className="klein" style={{ marginTop: 5 }}>
          Elke dag waarop je de opdracht van de dag afmaakt, komt er een ster bij. De laatste
          vier weken:
        </p>
        <div className="stickers" style={{ marginTop: 12 }}>
          {['M', 'D', 'W', 'D', 'V', 'Z', 'Z'].map((k, i) => (
            <div className="kop" key={`${k}${i}`}>{k}</div>
          ))}
          {dagen.map((d) => {
            const vol = pr.missieDagen[d.s]
            return (
              <div
                className={`sticker ${vol ? 'vol' : ''} ${d.nu ? 'nu' : ''} ${d.komt ? 'komt' : ''}`}
                title={d.s} key={d.s}
              >{vol ? '⭐' : d.komt ? '' : d.n}</div>
            )
          })}
        </div>
        <p className="klein" style={{ marginTop: 10 }}>
          {Object.keys(pr.missieDagen).length} sterren verdiend. Vandaag heeft een rand eromheen.
        </p>
      </div>

      <div className="card">
        <div className="rij tussen">
          <h3>Insignes</h3>
          <Tag soort={heb.size ? 'goed' : undefined}>{heb.size} van de {INSIGNES.length}</Tag>
        </div>
        <div className="insignes" style={{ marginTop: 12 }}>
          {[...INSIGNES].sort((a, b) => (heb.has(b.id) ? 1 : 0) - (heb.has(a.id) ? 1 : 0)).map((b) => (
            <div className={`insigne ${heb.has(b.id) ? 'aan' : ''}`} title={b.u} key={b.id}>
              <div className="ico">{b.ico}</div>
              <div className="nm">{b.n}</div>
              {!heb.has(b.id) && (
                <div className="klein" style={{ fontSize: '.68rem', lineHeight: 1.25, marginTop: 3 }}>
                  {b.u}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>Zo verdien je</h3>
          <div className="tblwrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <tbody>
                <tr><td>Een les halen (eerste keer)</td><td>{euro(TARIEF.les)}</td></tr>
                <tr><td>Een tekst uit je hoofd kennen</td><td>{euro(TARIEF.hifz)}</td></tr>
                <tr><td>Het examen van de wassing</td><td>{euro(TARIEF.examenWudu)}</td></tr>
                <tr><td>Het examen van het gebed</td><td>{euro(TARIEF.examenSalah)}</td></tr>
                <tr><td>De opdracht van de dag</td><td>{euro(TARIEF.missie)}</td></tr>
                <tr><td>Zeven dagen op rij</td><td>{euro(TARIEF.reeks7)}</td></tr>
                {t.stand.gezin.gebedTelt && (
                  <tr>
                    <td>Een gebed afvinken</td>
                    <td>{euro(TARIEF.gebed)} (max {euro(TARIEF.gebedDagMax)} per dag)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="klein" style={{ marginTop: 10 }}>
            Per week kun je hoogstens {euro(budget)} verdienen. Is dat op, dan gaan de punten
            gewoon door.
          </p>
        </div>

        <div className="card">
          <h3>Laatst verdiend</h3>
          {laatste.length ? (
            <div className="tblwrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <tbody>
                  {laatste.map((v, i) => (
                    <tr key={`${v.d}-${v.bron}-${i}`}>
                      <td>{v.bron}</td><td className="klein">{v.d}</td><td>{euro(v.b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="klein" style={{ marginTop: 8 }}>
              Nog niets. Begin met een les of met de wassing.
            </p>
          )}
          {uitbetaald > 0 && (
            <p className="klein" style={{ marginTop: 12 }}>Al uitbetaald: {euro(uitbetaald)}</p>
          )}
        </div>
      </div>
    </>
  )
}
