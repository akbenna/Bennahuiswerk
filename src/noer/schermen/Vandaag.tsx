/**
 * VANDAAG — waar je staat, wat er hierna komt, en de opdracht van de dag
 *
 * Het eerste wat een kind ziet. Vandaar de volgorde: eerst wie je bent en hoe
 * ver je bent, dan het eerstvolgende gebed met de klok erbij, dan de drie
 * dingen die vandaag nog te doen zijn. Alles daaronder is doorklikken.
 */
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { MODULES } from '../gegevens/modules'
import { GEBEDEN } from '../gegevens/gebed'
import { TARIEF } from '../opslag'
import {
  XP, alleLessen, checkInsignes, checkMissie, kaartenNu, niveauVan,
  puntenErbij, verdien, verdiendVandaagUit,
} from '../voortgang'
import { gebedstijden, hijri, klok, volgendGebed } from '../gebedstijden'
import type { Tijden } from '../gebedstijden'
import { Balk, Ring, Tag, Vink } from '../onderdelen'
import { toon } from '../geluid'
import type { Toestand } from '../toestand'
import type { Tab } from '../tabs'
import { missie } from '../voortgang'

export const HELD = (
  <div className="held">
    <div className="naam">Islam leren<em lang="ar">نور الإسلام</em></div>
    <p className="zin">
      De basis van de islam: geloven, mooi leven, en leren bidden — stap voor stap, in je eigen tempo.
    </p>
    <div className="streep" />
  </div>
)

export function GeenProfiel({ ga }: { ga: (v: Tab) => void }): ReactNode {
  return (
    <div className="card">
      <h1>Wie ben jij?</h1>
      <p style={{ marginTop: 10 }}>
        Islam leren houdt de voortgang per kind bij: welke lessen je gehad hebt, wat je uit je
        hoofd kent en wat je verdiend hebt. Kies hierboven wie je bent, of laat je vader of
        moeder een profiel aanmaken bij <b>Ouder</b>.
      </p>
      <div className="rij" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => ga('ouder')}>Naar het ouderscherm</button>
      </div>
    </div>
  )
}

/** De tijden van vandaag en van morgen, uit de instellingen van het gezin. */
export function tijdenVan(t: Toestand): { nu: Tijden; morgen: Tijden } {
  const g = t.stand.gezin
  const d = new Date(t.klok.ms)
  const m = new Date(t.klok.ms + 864e5)
  const opt = { methode: g.methode, asr: g.asr, tz: -d.getTimezoneOffset() / 60, hoog: g.hoog }
  return {
    nu: gebedstijden({ j: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }, g, opt),
    morgen: gebedstijden({ j: m.getFullYear(), m: m.getMonth() + 1, d: m.getDate() },
      g, { ...opt, tz: -m.getTimezoneOffset() / 60 }),
  }
}

export function Vandaag({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  if (!t.profiel) return <>{HELD}<GeenProfiel ga={ga} /></>

  const { pr, klok: k, spoor } = t
  const nv = niveauVan(pr.punten)
  const tijden = tijdenVan(t)
  const vg = volgendGebed(tijden.nu, tijden.morgen, k.uur)
  const m = missie(pr, k.vandaag)
  const log = pr.gebed[k.vandaag] ?? {}
  const gedaan = GEBEDEN.filter((g) => log[g.id]).length
  const mijn = alleLessen(spoor)
  const lessenKlaar = mijn.filter((l) => pr.lessen[l.id]?.klaar).length
  const kn = kaartenNu(pr, spoor, k.dag)
  const teDoen = kn.herhaal.length + Math.min(5, kn.nieuw.length)
  const uur = new Date(k.ms).getHours()
  const groet = uur < 6 ? 'Nog vroeg' : uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'
  const volgende = mijn.find((l) => !pr.lessen[l.id]?.klaar)

  /* Een gebed afvinken raakt vier dingen tegelijk: de punten, misschien geld,
     de dagmissie en de insignes. Ze horen bij elkaar, dus ze gaan in één keer. */
  const vinkGebed = (id: string): void => t.zetProf((p) => {
    const dag = { ...(p.gebed[k.vandaag] ?? {}) }
    const aan = !dag[id]
    dag[id] = aan
    let uit = { ...p, gebed: { ...p.gebed, [k.vandaag]: dag } }
    if (aan) {
      uit = puntenErbij(uit, XP.gebed, k.vandaag, k.gisteren)
      toon('goed', t.stand.instel.geluid)
      if (t.stand.gezin.gebedTelt
        && verdiendVandaagUit(uit, 'Gebed', k.vandaag) < TARIEF.gebedDagMax) {
        uit = verdien(uit, 'Gebed', TARIEF.gebed, t.stand.gezin.budget, k.vandaag, k.ms).stand
      }
    }
    uit = checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
    return checkInsignes(uit, spoor).stand
  })

  return (
    <>
      {HELD}
      <div className="card">
        <div className="rij tussen">
          <div>
            <p className="meta">{groet} · {hijri(new Date(k.ms))}</p>
            <h1 style={{ marginTop: 4 }}>Ahlan, {t.profiel.naam}</h1>
          </div>
          <Ring pct={nv.pct} tekst={pr.punten} />
        </div>
        <div className="rij" style={{ marginTop: 14, gap: 16 }}>
          <div className="kpi"><span className="cijfer">{nv.ico}</span><span className="klein">{nv.naam}</span></div>
          <div className="kpi"><span className="cijfer">{pr.reeks}</span><span className="klein">dagen op rij</span></div>
          <div className="kpi">
            <span className="cijfer">
              {lessenKlaar}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/{mijn.length}</span>
            </span>
            <span className="klein">lessen</span>
          </div>
          <div className="kpi"><span className="cijfer">{euro(pr.saldo)}</span><span className="klein">te ontvangen</span></div>
        </div>
        {nv.volgend && (
          <p className="klein" style={{ marginTop: 12 }}>
            Nog {nv.naar} punten tot <b>{nv.volgend}</b>.
          </p>
        )}
      </div>

      <div className="grid g2">
        <div className="card">
          <p className="meta">Hierna</p>
          <h2 style={{ marginTop: 5 }}>
            {vg.n}{vg.morgen && <span className="klein"> (morgen)</span>}
          </h2>
          <p className="cijfer" style={{ marginTop: 6 }}>{klok(vg.uur)}</p>
          <p className="klein">
            Over {Math.floor(vg.over / 60)} uur en {Math.round(vg.over % 60)} minuten · {t.stand.gezin.plaats}
          </p>
          <div className="rij" style={{ marginTop: 13 }}>
            <button className="btn sm ghost" onClick={() => ga('tijden')}>Alle tijden</button>
          </div>
        </div>

        <div className="card">
          <p className="meta">Vandaag gebeden</p>
          <h2 style={{ marginTop: 5 }}>{gedaan} van de 5</h2>
          <Balk pct={gedaan / 5 * 100} />
          <ul className="geen" style={{ marginTop: 8 }}>
            {GEBEDEN.map((g) => (
              <li key={g.id}>
                <Vink aan={Boolean(log[g.id])} aria-label={`${g.naam} afvinken`} onClick={() => vinkGebed(g.id)} />
                <span style={{ flex: 1 }}>{g.naam} <span className="klein">· {g.rak} rak'a</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="rij tussen">
          <p className="meta">De opdracht van vandaag</p>
          {m.klaar
            ? <Tag soort="goed">Gehaald</Tag>
            : <Tag>{m.taken.filter((x) => x.ok).length} van de 3</Tag>}
        </div>
        <ul className="geen" style={{ marginTop: 8 }}>
          {m.taken.map((x) => (
            <li key={x.k}><Vink aan={x.ok} /><span>{x.t}</span></li>
          ))}
        </ul>
        <p className="klein" style={{ marginTop: 10 }}>
          Alle drie gehaald? Dan gaat je reeks omhoog en komt er {euro(TARIEF.missie)} bij.
        </p>
      </div>

      <div className="grid g3">
        <button className="card klik" onClick={() => ga('leerpad')}>
          <p className="meta">Het leerpad · {MODULES.length} modules</p>
          <h3 style={{ marginTop: 5 }}>
            {lessenKlaar < mijn.length ? 'De volgende les' : 'Alles gehaald 🎉'}
          </h3>
          <p className="klein" style={{ marginTop: 5 }}>
            {lessenKlaar < mijn.length ? volgende?.t ?? '' : 'Herhaal wat je geleerd hebt.'}
          </p>
        </button>
        <button className="card klik" onClick={() => ga('gebed')}>
          <p className="meta">Leren bidden</p>
          <h3 style={{ marginTop: 5 }}>Oefen het gebed</h3>
          <p className="klein" style={{ marginTop: 5 }}>
            Wassing, houdingen, meebidden en uit je hoofd leren.
          </p>
        </button>
        <button className="card klik" onClick={() => ga('oefenen')}>
          <p className="meta">Oefenkaarten</p>
          <h3 style={{ marginTop: 5 }}>{teDoen} klaar</h3>
          <p className="klein" style={{ marginTop: 5 }}>Korte herhaling van wat je al gehad hebt.</p>
        </button>
      </div>
    </>
  )
}
