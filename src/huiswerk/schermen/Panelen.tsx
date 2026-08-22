/**
 * DE PANELEN VAN HET OUDERSCHERM
 *
 * Zeven uitklapbare stukken. Ze staan los omdat ze los te lezen zijn: wie de
 * weektaak klaarzet hoeft niets van het leerprofiel te weten, en omgekeerd.
 */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN, VAKNAAM } from '../gegevens/profielen'
import { SEED } from '../gegevens/seed'
import type { Kaart } from '../gegevens/soorten'
import type { Stand } from '../opslag'
import { schoonVoortgang } from '../opslag'
import { isBeheerst } from '../leitner'
import { BEHEERS_NIVEAUS, beheersStatus, leerprofiel } from '../volgsysteem'
import { DOMEINVOLGORDE, REKENVAKKEN, domeinVan } from '../rapport'
import { dagIso } from '../datum'
import { STANDAARD_WACHTWOORD, accountVan } from '../wolk'
import { Figuur } from '../figuren'

const staaf = (pct: number, kleur?: string): ReactNode => (
  <div className="pbar" style={{ height: 7, marginTop: 3 }}>
    <i style={{ width: Math.min(100, pct) + '%', ...(kleur ? { background: kleur } : {}) }} />
  </div>
)

/** Een kop die uit- en inklapt. Het was een <div> met onClick; als knop is hij
 *  met het toetsenbord te bedienen en leest een schermlezer hem voor als knop. */
function Klapkop(
  { open, zet, titel, dicht, uit }:
  { open: boolean; zet: () => void; titel: ReactNode; dicht: string; uit: string },
): ReactNode {
  return (
    <button
      type="button" className="klapkop row" aria-expanded={open} onClick={zet}
      style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
    >
      <b>{titel}</b>
      <span className="muted" style={{ fontSize: 13 }}>{open ? dicht : uit}</span>
    </button>
  )
}

/* ------------------------------------------------------ de kind-accounts */

export function KindAccounts(
  { stand, alleOnline, ververs }:
  { stand: Stand; alleOnline: () => Promise<number>; ververs: () => Promise<void> },
): ReactNode {
  const [bezig, zetBezig] = useState(false)
  const [melding, zetMelding] = useState('')
  const zeg = (t: string): void => { zetMelding(t); setTimeout(() => zetMelding(''), 3000) }

  return (
    <div className="card" style={{ marginBottom: 16, background: '#eef4fb', borderLeftColor: '#3a6ea0' }}>
      <b>👤 Kind-accounts (scores volgen het kind)</b>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Elk kind logt op elk toestel in met <b>zijn naam + wachtwoord &ldquo;
        {STANDAARD_WACHTWOORD}&rdquo;</b>. De scores staan online op zijn eigen account — dus op
        elk toestel gelijk, niet meer per toestel.
      </p>
      <div className="wrap" style={{ marginTop: 6 }}>
        {Object.entries(PROFIELEN).map(([pid, P]) => (
          <span key={pid} className="tag">{P.emoji} {P.naam}: {accountVan(stand, pid).code}</span>
        ))}
      </div>
      <div className="wrap" style={{ marginTop: 10 }}>
        <button
          type="button" className="btn sm" disabled={bezig}
          onClick={() => {
            zetBezig(true)
            void alleOnline().then((n) => {
              zetBezig(false)
              zeg(n + ' van ' + Object.keys(PROFIELEN).length + ' accounts online gezet ✓')
            })
          }}
        >{bezig ? 'Bezig…' : '☁️ Zet alle accounts nu online'}</button>
        <button
          type="button" className="btn ghost sm" disabled={bezig}
          onClick={() => {
            zetBezig(true)
            void ververs()
              .then(() => zeg('Nieuwste scores opgehaald ✓'))
              .catch(() => zeg('Kon niet ophalen — probeer opnieuw.'))
              .finally(() => zetBezig(false))
          }}
        >🔄 Nieuwste scores ophalen</button>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        De app haalt bij openen automatisch de nieuwste scores van elk kind op en voegt ze samen
        (hoogste telt), zodat elk toestel hetzelfde toont. Werkt een toestel offline, dan synct
        het zodra er weer verbinding is.
      </p>
      {melding && (
        <div style={{ color: '#2c5680', fontWeight: 600, marginTop: 8, fontSize: 13 }}>{melding}</div>
      )}
    </div>
  )
}

/* --------------------------------------------------------- het leerprofiel */

export function Leerprofielpaneel({ stand, alle }: { stand: Stand; alle: Kaart[] }): ReactNode {
  const [open, zetOpen] = useState(false)
  const [detail, zetDetail] = useState<string | null>(null)
  const [vakOpen, zetVakOpen] = useState<Record<string, boolean>>({})
  const profielen = useMemo(
    () => Object.keys(PROFIELEN)
      .map((pid) => leerprofiel(schoonVoortgang(stand.prog[pid]), alle, pid, PROFIELEN[pid]))
      .filter((x): x is NonNullable<typeof x> => x !== null),
    [stand.prog, alle])

  return (
    <div className="card" style={{ marginBottom: 16, background: '#eef6f0', borderLeftColor: '#2c7a2c' }}>
      <Klapkop
        open={open} zet={() => zetOpen(!open)}
        titel="📊 Leerprofiel — wat wordt goed beheerst, wat nog niet"
        dicht="▲ inklappen" uit="▼ bekijk beheersing per kind, vak en onderwerp"
      />
      {open && (
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Legenda: {BEHEERS_NIVEAUS.map((n) => (
            <span key={n.key} style={{ marginRight: 10, whiteSpace: 'nowrap' }}>
              {n.emoji} {n.label}
            </span>
          ))}
          <div style={{ marginTop: 2 }}>
            Beheersing = onderdelen met het Leitner-doosje op &ldquo;vast&rdquo; (≥ 4/5). Dekking =
            aandeel dat al is geoefend.
          </div>
        </div>
      )}
      {open && profielen.map((pr) => {
        const uit = detail === pr.pid
        const trend = pr.historie.slice(-8)
        return (
          <div key={pr.pid} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <Klapkop
              open={uit} zet={() => zetDetail(uit ? null : pr.pid)}
              titel={
                <>
                  {PROFIELEN[pr.pid]?.emoji} {pr.naam}{' '}
                  <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {pr.niveau}</span>
                </>
              }
              dicht={`▲ beheersing ${pr.mastery}% · dekking ${pr.dekking}%`}
              uit={`▼ beheersing ${pr.mastery}% · dekking ${pr.dekking}%`}
            />
            <div className="row" style={{ gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Beheerst {pr.beheerst}/{pr.totaal} ({pr.mastery}%)
                </span>
                {staaf(pr.mastery, '#2c7a2c')}
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Geoefend {pr.geoefend}/{pr.totaal} ({pr.dekking}%)
                </span>
                {staaf(pr.dekking, '#3a6ea0')}
              </div>
            </div>
            {uit && (
              <div style={{ marginTop: 8 }}>
                {trend.length >= 2 && (
                  <div style={{ margin: '4px 0 8px' }}>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Trend — beheerste onderdelen per week (laatste {trend.length}):
                    </div>
                    <Figuur ill={{
                      type: 'lijngrafiek',
                      punten: trend.map((h, i) => [i + 1, h.beheerst]),
                      xlabel: 'week', ylabel: 'beheerst',
                    }} />
                  </div>
                )}
                {pr.vakken.map((v) => {
                  const sleutel = pr.pid + '|' + v.v
                  const vUit = !!vakOpen[sleutel]
                  const st = beheersStatus(v.pct, v.geoefend)
                  return (
                    <div key={v.v} style={{ marginTop: 6 }}>
                      <Klapkop
                        open={vUit} zet={() => zetVakOpen({ ...vakOpen, [sleutel]: !vUit })}
                        titel={
                          <>
                            {st.emoji} {v.naam}{' '}
                            <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                              {v.beheerst}/{v.totaal} beheerst
                            </span>
                          </>
                        }
                        dicht={`▲ ${v.pct}%`} uit={`▼ ${v.pct}%`}
                      />
                      {staaf(v.pct, st.kleur)}
                      {vUit && (
                        <div style={{ marginTop: 4, paddingLeft: 6 }}>
                          {v.onderwerpen.map((o) => (
                            <div
                              key={o.t} className="row"
                              style={{ justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}
                            >
                              <span>{o.status.emoji} {o.t}{o.jaar === 'next' ? ' · volgend jaar' : ''}</span>
                              <span className="muted">
                                {o.geoefend > 0
                                  ? `${o.pct}% · ${o.nauw != null ? o.nauw + '% goed' : '—'}`
                                    + (o.wrong > 0 ? ` · ${o.wrong}× fout` : '')
                                  : 'nog niet begonnen'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------- de leerlijn */

export function Leerlijnpaneel({ stand }: { stand: Stand }): ReactNode {
  const [open, zetOpen] = useState(false)
  /* Alleen de vaste opgaven: sjablonen zijn parametrisch en niet per stuk
     "beheerst". */
  const alle: Kaart[] = [...SEED, ...(stand.custom as unknown as Kaart[])]

  return (
    <div className="card" style={{ marginBottom: 16, background: '#f4f1fb', borderLeftColor: '#7a5ea0' }}>
      <Klapkop
        open={open} zet={() => zetOpen(!open)} titel="🎯 Leerlijn-overzicht per domein"
        dicht="▲ inklappen" uit="▼ bekijk voortgang per curriculum-domein"
      />
      {open && (
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Beheersing per officieel leerlijndomein (referentieniveaus / examenprogramma), berekend
          uit de vaste opgaven.
        </div>
      )}
      {open && Object.entries(PROFIELEN).map(([pid, P]) => {
        const prog = schoonVoortgang(stand.prog[pid])
        const eigen = alle.filter((e) => e.p === pid)
        const reken = eigen.filter((e) => REKENVAKKEN.has(e.v))
        const domeinen: Record<string, Kaart[]> = {}
        for (const e of reken) (domeinen[domeinVan(e.t)] ??= []).push(e)
        const overig: Record<string, Kaart[]> = {}
        for (const e of eigen.filter((x) => !REKENVAKKEN.has(x.v))) (overig[e.v] ??= []).push(e)
        return (
          <div key={pid} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700 }}>
              {P.emoji} {P.naam}{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {P.niveau}</span>
            </div>
            {reken.length > 0 && (
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Rekenen/wiskunde — landelijke domeinen
              </div>
            )}
            {DOMEINVOLGORDE.filter((d) => domeinen[d]).map((d) => {
              const arr = domeinen[d] as Kaart[]
              const beheerst = arr.filter((e) => isBeheerst(prog, e.id)).length
              const pct = arr.length ? Math.round(beheerst / arr.length * 100) : 0
              return (
                <div key={d} style={{ marginTop: 6 }}>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{d}</span>
                    <span className="muted">{beheerst}/{arr.length} · {pct}%</span>
                  </div>
                  <div className="pbar"><i style={{ width: pct + '%' }} /></div>
                </div>
              )
            })}
            {Object.keys(overig).length > 0 && (
              <div className="wrap" style={{ marginTop: 8 }}>
                {Object.entries(overig).map(([v, arr]) => (
                  <span key={v} className="tag">
                    {VAKNAAM[v] ?? v}: {arr.filter((e) => isBeheerst(prog, e.id)).length}/{arr.length}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------- de weektaak */

export function Weektaakbeheer(
  { stand, zet }: { stand: Stand; zet: (verander: (s: Stand) => Stand) => void },
): ReactNode {
  const [open, zetOpen] = useState(false)
  const [gekozen, zetGekozen] = useState<Record<string, string[]>>(() => {
    const o: Record<string, string[]> = {}
    for (const pid of Object.keys(PROFIELEN)) o[pid] = stand.weektaak[pid]?.items?.slice() ?? []
    return o
  })
  const [melding, zetMelding] = useState('')
  const alle: Kaart[] = [...SEED, ...(stand.custom as unknown as Kaart[])]

  const wissel = (pid: string, sleutel: string): void => {
    zetGekozen((s) => {
      const arr = (s[pid] ?? []).slice()
      const i = arr.indexOf(sleutel)
      if (i >= 0) arr.splice(i, 1)
      else arr.push(sleutel)
      return { ...s, [pid]: arr }
    })
  }

  return (
    <div className="card" style={{ marginBottom: 16, background: '#eef6ff', borderLeftColor: '#3a6ea0' }}>
      <Klapkop
        open={open} zet={() => zetOpen(!open)} titel="📌 Weektaak klaarzetten"
        dicht="▲ inklappen" uit="▼ kies per kind de onderwerpen van de week"
      />
      {open && (
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Vink onderwerpen aan; het kind ziet ze als &ldquo;Jouw weektaak&rdquo; bovenaan, met
          voortgang. Tip: 2 tot 4 per kind.
        </div>
      )}
      {open && Object.entries(PROFIELEN).map(([pid, P]) => {
        const perVak: Record<string, Set<string>> = {}
        for (const e of alle.filter((x) => x.p === pid)) (perVak[e.v] ??= new Set()).add(e.t)
        const mijn = gekozen[pid] ?? []
        return (
          <div key={pid} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700 }}>
              {P.emoji} {P.naam}{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                · {mijn.length} gekozen
              </span>
            </div>
            {Object.keys(perVak).map((v) => (
              <div key={v} style={{ marginTop: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>{VAKNAAM[v] ?? v}</div>
                <div className="wrap" style={{ marginTop: 4 }}>
                  {[...(perVak[v] ?? [])].map((t) => {
                    const sleutel = v + '|' + t
                    const aan = mijn.includes(sleutel)
                    return (
                      <button
                        type="button" key={sleutel} className={'btn sm ' + (aan ? 'gold' : 'ghost')}
                        onClick={() => wissel(pid, sleutel)}
                      >{aan ? '✓ ' : ''}{t}</button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {open && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button" className="btn"
            onClick={() => {
              const vandaag = dagIso(new Date())
              zet((s) => {
                const wt = { ...s.weektaak }
                for (const pid of Object.keys(gekozen)) {
                  wt[pid] = { items: gekozen[pid] ?? [], set: vandaag }
                }
                return { ...s, weektaak: wt }
              })
              zetMelding('✅ Weektaken opgeslagen — de kinderen zien ze meteen.')
              setTimeout(() => zetMelding(''), 3500)
            }}
          >💾 Weektaken opslaan</button>
          {melding && (
            <span style={{ color: '#2c7a2c', fontWeight: 600, marginLeft: 10, fontSize: 13 }}>
              {melding}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------- de zomer en de codes */

export function Zomerpaneel(
  { stand, zet }: { stand: Stand; zet: (verander: (s: Stand) => Stand) => void },
): ReactNode {
  const z = stand.zomer
  const pas = (deel: Partial<Stand['zomer']>): void =>
    zet((s) => ({ ...s, zomer: { ...s.zomer, ...deel } }))
  const vandaag = dagIso(new Date())

  return (
    <div className="card" style={{ marginBottom: 16, background: '#fff7ea', borderLeftColor: '#e08a2b' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏖️ <b>Zomer-challenge (vakantie)</b></span>
        <button
          type="button" className={'btn sm ' + (z.aan ? '' : 'ghost')}
          onClick={() => pas({ aan: !z.aan, start: z.start ?? vandaag })}
        >{z.aan ? 'Aan' : 'Uit'}</button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Elk kind spaart over ~{z.weken} weken naar een zomerdoel; bij het doel volgt een bonus. Zo
        staat er een leuk streefbedrag &ldquo;na de vakantie&rdquo; tegenover echt oefenen.
      </p>
      <div className="row" style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <label className="fld" htmlFor="zStart">Startdatum</label>
          <input
            className="f" id="zStart" type="date" value={z.start ?? vandaag}
            onChange={(e) => pas({ start: e.target.value })}
          />
        </div>
        <div style={{ width: 80 }}>
          <label className="fld" htmlFor="zWeken">Weken</label>
          <input
            className="f" id="zWeken" inputMode="numeric" value={z.weken}
            onChange={(e) => pas({ weken: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 7) })}
          />
        </div>
        <div style={{ width: 100 }}>
          <label className="fld" htmlFor="zDoel">Doel (€)</label>
          <input
            className="f" id="zDoel" inputMode="numeric" value={z.doel}
            onChange={(e) => pas({ doel: Number(e.target.value.replace(/\D/g, '')) || 0 })}
          />
        </div>
        <div style={{ width: 100 }}>
          <label className="fld" htmlFor="zBonus">Bonus (€)</label>
          <input
            className="f" id="zBonus" inputMode="numeric" value={z.bonus}
            onChange={(e) => pas({ bonus: Number(e.target.value.replace(/\D/g, '')) || 0 })}
          />
        </div>
      </div>
    </div>
  )
}

export function Kindwachtwoorden(
  { stand, zetPw }: { stand: Stand; zetPw: (pid: string, pw: string) => void },
): ReactNode {
  const [waarden, zetWaarden] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    for (const id of Object.keys(PROFIELEN)) o[id] = stand.kidpw[id] ?? ''
    return o
  })
  const [melding, zetMelding] = useState('')

  return (
    <div className="card" style={{ marginBottom: 16, background: '#faf3ff', borderLeftColor: '#9c3b7e' }}>
      <b>🔒 Wachtwoord per kind (om te starten)</b>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Standaard is het wachtwoord <b>{STANDAARD_WACHTWOORD}</b> voor iedereen. Hieronder per kind
        te wijzigen.
      </p>
      {Object.entries(PROFIELEN).map(([id, P]) => (
        <div key={id} className="row" style={{ gap: 8, alignItems: 'center', marginTop: 8 }}>
          <span style={{ width: 110 }}>{P.emoji} {P.naam}</span>
          <input
            className="f" style={{ flex: 1 }} value={waarden[id] ?? ''} placeholder={STANDAARD_WACHTWOORD}
            aria-label={'Wachtwoord van ' + P.naam}
            onChange={(e) => zetWaarden({ ...waarden, [id]: e.target.value })}
          />
          <button
            type="button" className="btn sm"
            onClick={() => {
              zetPw(id, waarden[id] || STANDAARD_WACHTWOORD)
              zetMelding('✅ Wachtwoord van ' + P.naam + ' opgeslagen.')
              setTimeout(() => zetMelding(''), 2000)
            }}
          >Opslaan</button>
        </div>
      ))}
      {melding && (
        <div style={{ color: '#2c7a2c', fontWeight: 600, marginTop: 8, fontSize: 13 }}>{melding}</div>
      )}
    </div>
  )
}
