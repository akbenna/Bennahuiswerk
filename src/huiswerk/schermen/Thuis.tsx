/**
 * THUIS — kiezen wie er gaat oefenen
 *
 * Dit scherm was de landingspagina van de app: een banier, de ranglijst, het
 * toernooi en de week-uitslag, en pas daaronder de vier profielen. Sinds de app
 * onder het portaal hangt klopt die volgorde niet meer. Wie hier komt heeft zich
 * al voorgesteld en wil aan het werk; de competitie hoort daarna te komen, niet
 * ervoor.
 *
 * Dus: één regel als kop, vier namen om te kiezen, en al het puntenwerk in één
 * kaart die dicht begint. Dat er een ranglijst ís blijft een keuze — vier
 * kinderen van groep 4 tot 4 vwo kunnen alleen eerlijk naast elkaar staan omdat
 * de punten al meeschalen met moeilijkheid. Maar hij hoeft niet als eerste in
 * beeld te staan, en hij hoort niet op de naamknoppen: daar las je vroeger de
 * stand van je broer of zus voordat je zelf begonnen was.
 *
 * Meestal komt niemand hier meer. Wie via het portaal binnenkomt gaat
 * rechtstreeks naar zijn eigen scherm; dit is wat er overblijft voor wie de app
 * los opent of van kind wisselt.
 */
import type { ReactNode } from 'react'
import { PROFIELEN, THEMAS } from '../gegevens/profielen'
import { TIP_VAN_DE_DAG } from '../gegevens/leertips'
import type { Kaart, Thema } from '../gegevens/soorten'
import type { Stand, Voortgang } from '../opslag'
import { schoonVoortgang } from '../opslag'
import { euro, weekVerdiend, zomerStand } from '../beloning'
import { rangVoor, weekPuntenNu } from '../missie'
import type { Rangstand } from '../missie'
import { Balk, Klapkaart } from '../onderdelen'

const MEDAILLES = ['🥇', '🥈', '🥉', '🏅']

export const themaVan = (pid: string): Thema =>
  (THEMAS[PROFIELEN[pid]?.thema ?? 'standaard'] ?? THEMAS.standaard) as Thema

interface Kind {
  id: string
  p: (typeof PROFIELEN)[string]
  pr: Voortgang
  th: Thema
  rang: Rangstand
}

export interface ThuisProps {
  stand: Stand
  alle: Kaart[]
  nuMs: number
  kies: (pid: string) => void
  naarOuder: () => void
  naarFormules: () => void
  naarLeertips: () => void
  naarSpellen: () => void
  zetGeluid: (aan: boolean) => void
  zetVoorlezen: (aan: boolean) => void
}

export function Thuis(p: ThuisProps): ReactNode {
  const { stand, nuMs } = p
  /* De tip rouleert per dag, niet per hertekening: anders springt hij terwijl
     iemand hem aan het lezen is. */
  const tip = TIP_VAN_DE_DAG[Math.floor(nuMs / 86400000) % TIP_VAN_DE_DAG.length]

  const kinderen: Kind[] = Object.entries(PROFIELEN).map(([id, prof]) => {
    const pr = schoonVoortgang(stand.prog[id])
    const th = themaVan(id)
    return { id, p: prof, pr, th, rang: rangVoor(th, pr.punten || 0) }
  })

  const ranglijst = [...kinderen].sort((a, b) => (b.pr.punten || 0) - (a.pr.punten || 0))
  const toernooi = [...kinderen]
    .sort((a, b) => weekPuntenNu(b.pr, nuMs) - weekPuntenNu(a.pr, nuMs))
  const leider = toernooi[0] && weekPuntenNu(toernooi[0].pr, nuMs) > 0 ? toernooi[0] : null
  const nu = new Date(nuMs)
  const dagenTot = 8 - (nu.getDay() || 7)
  const winnaar = stand.toernooiWinnaar
  const weekrijen = kinderen.map((k) => ({ k, v: weekVerdiend(k.pr, nuMs) }))
  const weektotaal = weekrijen.reduce((s, r) => s + r.v, 0)
  const zomerrijen = stand.zomer?.aan
    ? kinderen.map((k) => ({ k, z: zomerStand(k.pr, stand.zomer, nuMs) }))
      .filter((x): x is { k: Kind; z: NonNullable<ReturnType<typeof zomerStand>> } => x.z !== null)
    : []
  const iemandKlaar = kinderen.some((k) => (k.pr.todayCount || 0) >= (k.pr.goal || 10))
  const spelOpSlot = stand.spelNaDoel && !iemandKlaar

  return (
    <div>
      <div className="minikop">
        <span className="gezicht">📚</span>
        <h1>Huiswerk</h1>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
          Oefenclub Bennaghmouch
        </span>
      </div>
      <p className="muted" style={{ margin: '0 0 14px', fontSize: 14 }}>Wie gaat er oefenen?</p>

      {kinderen.map(({ id, p: prof }) => (
        <button
          type="button" key={id} className="naamknop" style={{ background: prof.kleur }}
          onClick={() => p.kies(id)}
        >
          <span className="em">{prof.emoji}</span>
          <span>
            <span className="nm">{prof.naam}</span>
            <span className="nv" style={{ display: 'block' }}>{prof.niveau}</span>
          </span>
          <span className="pijl">›</span>
        </button>
      ))}

      <Klapkaart
        titel="🏆 Klassement en zakgeld"
        zij={leider ? `aan kop: ${leider.p.emoji} ${leider.p.naam}` : 'nog geen punten deze week'}
      >
        <div className="card">
          <b>Ranglijst — alle punten bij elkaar</b>
          {ranglijst.map((k, i) => (
            <div key={k.id} className="rankrow">
              <span className="medal">{MEDAILLES[i] ?? '⭐'}</span>
              <span style={{ fontSize: 20 }}>{k.p.emoji}</span>
              <b style={{ flex: 1 }}>
                {k.p.naam}{' '}
                <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                  · {k.rang.emoji} {k.rang.naam}
                </span>
              </b>
              <span style={{ fontWeight: 800, color: '#a8730a' }}>{k.pr.punten || 0}</span>
              <span className="muted" style={{ fontSize: 12 }}>{k.th.xp}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>Toernooi van de week — € 10 voor de winnaar</b>
            <span className="muted" style={{ fontSize: 12 }}>
              nieuwe ronde over {dagenTot} {dagenTot === 1 ? 'dag' : 'dagen'}
            </span>
          </div>
          {winnaar && PROFIELEN[winnaar.pid] && (
            <div style={{ margin: '6px 0', fontSize: 13, color: '#2c7a2c', fontWeight: 600 }}>
              🎉 Vorige week won {PROFIELEN[winnaar.pid]?.emoji} {PROFIELEN[winnaar.pid]?.naam}{' '}
              {euro(winnaar.bedrag)}! (staat in de ouder-modus klaar)
            </div>
          )}
          {toernooi.map((k, i) => (
            <div
              key={k.id} className="rankrow"
              style={{ background: 'transparent', border: 'none', padding: '4px 0' }}
            >
              <span className="medal">{MEDAILLES[i] ?? '⭐'}</span>
              <span style={{ fontSize: 20 }}>{k.p.emoji}</span>
              <b style={{ flex: 1 }}>{k.p.naam}</b>
              <span style={{ fontWeight: 700 }}>{weekPuntenNu(k.pr, nuMs)}</span>
              <span className="muted" style={{ fontSize: 12 }}>deze week</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>Week-uitslag</b>
            <span className="muted" style={{ fontSize: 12 }}>
              {nu.getDay() === 0
                ? 'Het is zondag — tijd voor de uitslag! 🎉'
                : 'samen ' + euro(weektotaal)}
            </span>
          </div>
          {weekrijen.map(({ k, v }) => (
            <div
              key={k.id} className="row"
              style={{ justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}
            >
              <span>{k.p.emoji} {k.p.naam}</span>
              <span style={{ fontWeight: 700, color: '#a8730a' }}>{euro(v)}</span>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Dit is wat er deze week eerlijk verdiend is. Uitbetalen doe je in de ouder-modus.
          </div>
        </div>

        {zomerrijen.length > 0 && (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>🏖️ Zomer-challenge</b>
              <span className="muted" style={{ fontSize: 13 }}>
                samen al {euro(zomerrijen.reduce((s, x) => s + x.z.verdiend, 0))} verdiend
              </span>
            </div>
            {zomerrijen.map(({ k, z }) => (
              <div key={k.id} style={{ marginTop: 8 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{k.p.emoji} <b>{k.p.naam}</b> {z.gehaald && <span>🏆</span>}</span>
                  <span style={{ fontWeight: 700, color: '#a8730a' }}>
                    {euro(z.verdiend)} / {euro(z.doel)}
                  </span>
                </div>
                <Balk pct={z.pct} kleur="#e08a2b" achter="rgba(0,0,0,.08)" />
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {z.gehaald
                    ? <span>🎉 Zomerdoel gehaald — verdien je bonus van {euro(z.bonus)}!</span>
                    : (
                      <span>
                        Nog {euro(Math.max(0, z.doel - z.verdiend))} tot je doel · dan{' '}
                        +{euro(z.bonus)} bonus · nog {z.wekenOver}{' '}
                        {z.wekenOver === 1 ? 'week' : 'weken'}
                      </span>
                      )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Klapkaart>

      <div className="center" style={{ marginTop: 16 }}>
        {spelOpSlot
          ? (
            <div>
              <button type="button" className="btn ghost" disabled>🔒 Spelletjes</button>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Eerst een dagdoel halen, dan verdien je speeltijd! 💪
              </div>
            </div>
            )
          : <button type="button" className="btn gold" onClick={p.naarSpellen}>🎮 Spelletjes →</button>}
      </div>

      <div className="hint" style={{ margin: '16px 0' }}><b>Tip van de dag:</b> {tip}</div>
      <div className="navrow">
        <button type="button" className="navbtn b" onClick={p.naarFormules}>📐 Formules</button>
        <button type="button" className="navbtn g" onClick={p.naarLeertips}>💡 Leertips</button>
        <button
          type="button" className="navbtn" title="Geluid aan of uit"
          onClick={() => p.zetGeluid(!stand.geluid)}
        >{stand.geluid ? '🔊 Geluid' : '🔇 Geluid'}</button>
        <button
          type="button" className="navbtn" title="Voorlezen aan of uit (tekst-naar-spraak)"
          onClick={() => p.zetVoorlezen(!stand.voorlezen)}
        >{stand.voorlezen ? '🗣️ Voorlezen' : '🔇 Voorlezen'}</button>
        <button type="button" className="navbtn p" onClick={p.naarOuder}>👨‍👩‍👧 Ouder-modus</button>
      </div>
    </div>
  )
}
