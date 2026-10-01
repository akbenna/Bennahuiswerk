/**
 * HET PLANBORD, OP HET SCHERM
 *
 * Bovenaan staat vandaag, en alleen vandaag: het lijstje dat je afwerkt en
 * afvinkt. Daaronder de komende dagen, dan de toetsen met hoe ze ervoor staan,
 * en helemaal onderaan wat je zelden aanraakt: de beschikbare tijd per dag.
 *
 * Elk afgevinkt blok vraagt één ding terug: hoe lang duurde het echt. Niet om
 * te controleren, maar omdat het bord daar de volgende schattingen mee
 * corrigeert. Dat is de hele reden dat die vraag er staat, en daarom staat hij
 * er met vier knoppen en niet met een leeg veld.
 *
 * Al het rekenwerk staat in `planbord.ts`; dit scherm roept het aan en toont
 * wat eruit komt.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { VAKNAAM } from '../gegevens/profielen'
import { STARTTOETSEN } from '../gegevens/toetsen-start'
import {
  MIN_PAREN, blokkenOp, capaciteit, dagenTussen, geplandOp, haalToetsWeg, herplan, isoVan,
  knipOnderdelen, leegPlan, nieuwId, rond5, schatting, schuif, toetsStand, vinkAf, weekUren,
  zetEcht, zetToets,
} from '../planbord'
import type { Blok, Planstand, Toets, Toetsstatus } from '../planbord'

const WEEKDAG = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function dagLabel(iso: string, vandaag: string): string {
  const n = dagenTussen(vandaag, iso)
  if (n === 0) return 'vandaag'
  if (n === 1) return 'morgen'
  const p = iso.split('-').map(Number)
  const d = new Date(p[0] ?? 2000, (p[1] ?? 1) - 1, p[2] ?? 1)
  return `${WEEKDAG[d.getDay()]} ${d.getDate()} ${MAAND[d.getMonth()]}`
}

const uren = (min: number): string => {
  if (min < 60) return `${min} min`
  const u = Math.floor(min / 60)
  const r = min % 60
  return r ? `${u} u ${r} min` : `${u} u`
}

const STATUSKLEUR: Record<Toetsstatus, string> = {
  'klaar': '#6b7163', 'nog niet begonnen': '#3a6ea0', 'op schema': '#48792c', 'loopt achter': '#C23728',
}

export interface PlanbordProps {
  pid: string
  naam: string
  vakken: string[]
  plan: Planstand | undefined
  nuMs: number
  terug: () => void
  bewaar: (p: Planstand) => void
}

export function Planbord(p: PlanbordProps): ReactNode {
  const vandaag = isoVan(new Date(p.nuMs))
  const plan = p.plan ?? leegPlan()
  const [bewerk, zetBewerk] = useState<Toets | null | 'nieuw'>(null)

  /* Een nieuwe dag: de planning opnieuw neerzetten vanaf vandaag. Eén keer bij
     het openen, en alleen als er iets te plannen valt. */
  const { bewaar } = p
  useEffect(() => {
    if (plan.toetsen.some((t) => !t.weg) && plan.geplandVoor !== vandaag) {
      bewaar(herplan(plan, vandaag))
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [vandaag])

  const zet = (q: Planstand): void => bewaar(herplan(q, vandaag))
  const levend = plan.toetsen.filter((t) => !t.weg)
  const standen = toetsStand(plan, vandaag)
  const week = weekUren(plan, vandaag)
  const s = schatting(plan.blokken)
  const vandaagBlokken = blokkenOp(plan, vandaag)
  const start = (STARTTOETSEN[p.pid] ?? []).filter((t) => t.datum >= vandaag)

  /* De dagen na vandaag waar iets op staat, tot en met de laatste toets. */
  const laatste = levend.reduce((m, t) => (t.datum > m ? t.datum : m), vandaag)
  const dagen: string[] = []
  for (let d = schuif(vandaag, 1); d <= laatste && dagen.length < 21; d = schuif(d, 1)) dagen.push(d)

  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={p.terug}>← terug</button>
        <span className="pill">Planbord</span>
      </div>
      <h1 style={{ fontSize: 24 }}>📅 Planbord van {p.naam}</h1>

      {levend.length > 0 && (
        <p className="muted" style={{ marginTop: 4, fontSize: 14 }}>
          Komende week: <b>{week.laag === week.hoog ? `${week.laag} uur` : `${week.laag} tot ${week.hoog} uur`}</b>.
          {' '}{s.n >= MIN_PAREN
            ? (s.factor > 1.15
                ? `Je schat meestal te laag (×${s.factor.toFixed(1)}), het bord rekent dat al mee.`
                : s.factor < 0.85
                  ? `Je schat meestal te ruim (×${s.factor.toFixed(1)}), het bord rekent dat al mee.`
                  : 'Je schattingen kloppen aardig.')
            : `Vul na elk blok in hoe lang het echt duurde; na ${MIN_PAREN} keer gaat het bord je schattingen corrigeren.`}
        </p>
      )}

      {levend.length === 0 && (
        <div className="card center" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 32 }}>🗓️</div>
          <p style={{ fontSize: 16 }}>Nog geen toetsen op het bord.</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Zet elke toets erop zodra hij in je rooster staat. Het bord rekent terug vanaf de
            toetsdag en zegt elke dag wat je doet.
          </p>
          <div className="wrap" style={{ justifyContent: 'center', marginTop: 10 }}>
            {start.length > 0 && (
              <button
                type="button" className="btn gold"
                onClick={() => {
                  let q = plan
                  for (const t of start) q = zetToets(q, { ...t, bijgewerkt: Date.now() })
                  zet(q)
                }}
              >⚡ Begin met de toetsen van deze week ({start.length})</button>
            )}
            <button type="button" className="btn" onClick={() => zetBewerk('nieuw')}>＋ Toets erbij</button>
          </div>
        </div>
      )}

      {levend.length > 0 && (
        <Dagkaart
          titel="Vandaag" iso={vandaag} vandaag={vandaag} blokken={vandaagBlokken} plan={plan}
          open bewaar={bewaar}
        />
      )}

      {dagen.map((d) => {
        const bl = blokkenOp(plan, d)
        if (!bl.length) return null
        return <Dagkaart key={d} titel={dagLabel(d, vandaag)} iso={d} vandaag={vandaag} blokken={bl} plan={plan} bewaar={bewaar} />
      })}

      {levend.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>📝 Toetsen</b>
            <button type="button" className="btn sm" onClick={() => zetBewerk('nieuw')}>＋ Toets erbij</button>
          </div>
          {standen.map((st) => (
            <div key={st.toets.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {VAKNAAM[st.toets.vak] ?? st.toets.vak} · {st.toets.titel}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {dagLabel(st.toets.datum, vandaag)}
                    {st.dagen > 1 && ` · over ${st.dagen} dagen`}
                    {st.dagen < 0 && ' · geweest'}
                    {' · '}{st.gedaan}/{st.totaal} blokken af
                  </div>
                </div>
                <span
                  className="tag"
                  style={{ color: '#fff', background: STATUSKLEUR[st.status], whiteSpace: 'nowrap' }}
                >{st.status}</span>
              </div>
              {st.krap && st.dagen > 0 && (
                <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
                  Er staat {uren(st.rest)} open en er is {uren(st.ruimte)} tijd tot de toets. Maak
                  blokken korter, of zet meer tijd per dag (onderaan).
                </div>
              )}
              <div className="wrap" style={{ marginTop: 6 }}>
                <button type="button" className="btn ghost sm" onClick={() => zetBewerk(st.toets)}>✏️ Stof aanpassen</button>
                <button
                  type="button" className="btn ghost sm"
                  onClick={() => { if (confirm('Deze toets van het bord halen?')) zet(haalToetsWeg(plan, st.toets.id)) }}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bewerk && (
        <Toetsformulier
          vakken={p.vakken} vandaag={vandaag}
          toets={bewerk === 'nieuw' ? null : bewerk}
          sluit={() => zetBewerk(null)}
          bewaar={(t) => { zet(zetToets(plan, t)); zetBewerk(null) }}
        />
      )}

      <details className="klapkaart" style={{ marginTop: 14 }}>
        <summary><b>⏱️ Beschikbare tijd per dag</b><span className="muted zij">het bord vult nooit meer dan 80%</span></summary>
        <div className="klapbak">
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            Minuten per dag die je echt aan school kunt besteden, na eten, sport en reizen. Liever
            te laag dan te hoog: een planning die uitloopt haalt het nooit meer in.
          </p>
          <div className="wrap">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
              <label key={wd} style={{ fontSize: 13, fontWeight: 600 }}>
                {WEEKDAG[wd]}
                <input
                  className="f" type="number" inputMode="numeric" min={0} max={600} step={15}
                  style={{ width: 76, marginLeft: 6, padding: '6px 8px' }}
                  value={plan.perDag[wd] ?? 0}
                  onChange={(e) => {
                    const perDag = plan.perDag.slice()
                    perDag[wd] = Math.max(0, Math.min(600, Number(e.target.value) || 0))
                    zet({ ...plan, perDag })
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </details>

      <p className="muted center" style={{ marginTop: 16, fontSize: 13 }}>
        Blijft er iets liggen? Niets aan de hand: morgen staat het opnieuw ingepland. Het bord
        verwijt niet, het rekent.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ dagen */

function Dagkaart({ titel, iso, vandaag, blokken, plan, open, bewaar }: {
  titel: string; iso: string; vandaag: string; blokken: Blok[]; plan: Planstand
  open?: boolean; bewaar: (p: Planstand) => void
}): ReactNode {
  const cap = capaciteit(plan.perDag, iso)
  const gepland = geplandOp(plan, iso)
  const af = blokken.filter((b) => b.gedaan).length
  const vol = blokken.some((b) => b.vol)
  const alles = blokken.length > 0 && af === blokken.length
  return (
    <div
      className="card"
      style={{
        marginTop: 12,
        ...(open ? { background: '#eef6ff', borderLeft: '4px solid #3a6ea0' } : {}),
        ...(alles ? { opacity: 0.75 } : {}),
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b style={{ textTransform: open ? 'none' : 'capitalize' }}>{open ? '📍 ' : ''}{titel}</b>
        <span className="muted" style={{ fontSize: 13 }}>
          {af}/{blokken.length} af · {uren(gepland)}{cap ? ` van ${uren(cap)}` : ''}
        </span>
      </div>
      {vol && (
        <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
          Deze dag loopt over: er paste niets meer eerder. Doe wat je kunt, de rest schuift morgen vanzelf.
        </div>
      )}
      {blokken.length === 0 && (
        <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>Niets gepland. 🎉</p>
      )}
      {blokken.map((b) => <Blokregel key={b.id} blok={b} plan={plan} vandaag={vandaag} bewaar={bewaar} />)}
    </div>
  )
}

export function Blokregel({ blok: b, plan, vandaag, bewaar }: {
  blok: Blok; plan: Planstand; vandaag: string; bewaar: (p: Planstand) => void
}): ReactNode {
  const toets = plan.toetsen.find((t) => t.id === b.toets)
  const vraagEcht = b.gedaan && b.echt == null
  const keuzes = [...new Set([rond5(b.geschat * 0.5), rond5(b.geschat), rond5(b.geschat * 1.5), rond5(b.geschat * 2)])]
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <label className="row" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
        <input
          type="checkbox" checked={b.gedaan} style={{ width: 22, height: 22, marginTop: 2, flex: 'none' }}
          onChange={(e) => bewaar(vinkAf(plan, b.id, e.target.checked))}
        />
        <div style={{ flex: 1, ...(b.gedaan ? { textDecoration: 'line-through', color: 'var(--muted)' } : {}) }}>
          <span className="tag" style={{ marginRight: 6 }}>{toets ? (VAKNAAM[toets.vak] ?? toets.vak) : '?'}</span>
          {b.soort === 'overhoor' ? '🧠 ' : b.soort === 'herhaal' ? '🔁 ' : '📖 '}
          {b.taak}
          <span className="muted" style={{ fontSize: 13 }}>
            {' · '}{b.gedaan && b.echt != null ? `${b.echt} min (geschat ${b.geschat})` : `± ${b.geschat} min`}
            {b.vol ? ' · past niet' : ''}
            {b.datum < vandaag && !b.gedaan ? ' · blijven liggen' : ''}
          </span>
        </div>
      </label>
      {vraagEcht && (
        <div className="wrap" style={{ marginTop: 6, marginLeft: 32, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Hoe lang duurde het echt?</span>
          {keuzes.map((m) => (
            <button type="button" key={m} className="btn ghost sm" onClick={() => bewaar(zetEcht(plan, b.id, m))}>
              {m} min
            </button>
          ))}
          <button type="button" className="btn ghost sm" onClick={() => {
            const v = prompt('Hoeveel minuten?', String(b.geschat))
            const n = Number(v)
            if (v && n > 0) bewaar(zetEcht(plan, b.id, Math.round(n)))
          }}>anders…</button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- formulier */

function Toetsformulier({ vakken, vandaag, toets, sluit, bewaar }: {
  vakken: string[]; vandaag: string; toets: Toets | null; sluit: () => void; bewaar: (t: Toets) => void
}): ReactNode {
  const [vak, zetVak] = useState(toets?.vak ?? vakken[0] ?? '')
  const [datum, zetDatum] = useState(toets?.datum ?? schuif(vandaag, 7))
  const [titel, zetTitel] = useState(toets?.titel ?? '')
  const [stof, zetStof] = useState(toets?.onderdelen.join('\n') ?? '')
  const [per, zetPer] = useState(toets?.perOnderdeel ?? 45)
  const [fout, zetFout] = useState('')
  const onderdelen = knipOnderdelen(stof)

  const opslaan = (): void => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) { zetFout('Kies een datum.'); return }
    if (datum < vandaag) { zetFout('Die dag is al geweest.'); return }
    if (onderdelen.length === 0) { zetFout('Zet er minstens één stuk stof in, bijvoorbeeld "§3.1".'); return }
    bewaar({
      id: toets?.id ?? nieuwId(), vak, datum, titel: titel.trim() || 'Toets', onderdelen,
      perOnderdeel: Math.max(10, Math.min(180, Math.round(per) || 45)), bijgewerkt: Date.now(),
    })
  }

  return (
    <div className="card" style={{ marginTop: 14, borderLeft: '4px solid var(--gold)' }}>
      <b>{toets ? '✏️ Toets aanpassen' : '＋ Nieuwe toets'}</b>
      <label className="fld">Vak
        <select className="f" value={vak} onChange={(e) => zetVak(e.target.value)}>
          {vakken.map((v) => <option key={v} value={v}>{VAKNAAM[v] ?? v}</option>)}
        </select>
      </label>
      <label className="fld">Datum van de toets
        <input className="f" type="date" value={datum} min={vandaag} onChange={(e) => zetDatum(e.target.value)} />
      </label>
      <label className="fld">Waarover
        <input className="f" value={titel} placeholder="bijv. H3 Krachten" onChange={(e) => zetTitel(e.target.value)} />
      </label>
      <label className="fld">De stof, in stukken (één per regel)
        <textarea
          className="f" value={stof} rows={4}
          placeholder={'§3.1 Krachten tekenen\n§3.2 Krachten ontbinden\n§3.3 Evenwicht\nSamenvatting'}
          onChange={(e) => zetStof(e.target.value)}
        />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>
        {onderdelen.length} {onderdelen.length === 1 ? 'stuk' : 'stukken'}. Elk stuk wordt één blok; houd ze klein genoeg voor één zit.
      </div>
      <label className="fld">Minuten per stuk, zoals jij het schat
        <input
          className="f" type="number" inputMode="numeric" min={10} max={180} step={5} value={per}
          style={{ width: 120 }} onChange={(e) => zetPer(Number(e.target.value))}
        />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>
        Eerste ronde ± {uren(onderdelen.length * (per || 0))}, plus herhalen en overhoren. Het bord
        corrigeert dit zodra het weet hoe jouw schattingen uitpakken.
      </div>
      {fout && <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>{fout}</div>}
      <div className="wrap" style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={opslaan}>Op het bord</button>
        <button type="button" className="btn ghost" onClick={sluit}>Annuleren</button>
      </div>
    </div>
  )
}
