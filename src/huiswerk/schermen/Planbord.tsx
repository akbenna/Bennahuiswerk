/**
 * HET PLANBORD, OP HET SCHERM
 *
 * Bovenaan staat vandaag, en alleen vandaag: het lijstje dat je afwerkt en
 * afvinkt. Daaronder de komende dagen, dan de toetsen en opdrachten met hoe ze
 * ervoor staan, en helemaal onderaan wat je zelden aanraakt: de beschikbare
 * tijd per weekdag.
 *
 * Elk afgevinkt blok vraagt één ding terug: hoe lang duurde het echt. Niet om
 * te controleren, maar omdat het bord daar de volgende schattingen mee
 * corrigeert. Daarom staat die vraag er met vier knoppen en niet met een leeg
 * veld.
 *
 * En elk blok heeft een knop "aanpassen": naar een andere dag (daarna staat hij
 * vast), andere minuten, of terug aan het bord. Een dag heeft een knop voor
 * "vandaag kan ik minder". Het bord stelt voor; zij beslist.
 *
 * Al het rekenwerk staat in `planbord.ts`; dit scherm roept het aan en toont
 * wat eruit komt.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { VAKNAAM } from '../gegevens/profielen'
import { STARTTOETSEN } from '../gegevens/toetsen-start'
import {
  MIN_PAREN, actueel, blokkenOp, capaciteit, dagenTussen, datumVan, geplandOp, haalToetsWeg,
  isoVan, knipOnderdelen, leegPlan, maakLos, minutenOp, nieuwId, rond5, schatting, schuif,
  toetsStand, verplaats, vinkAf, weekUren, zetDagtijd, zetEcht, zetEigen, zetToets,
} from '../planbord'
import type { Blok, Planstand, Toets, Toetsstatus } from '../planbord'

const WEEKDAG = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function dagLabel(iso: string, vandaag: string): string {
  const n = dagenTussen(vandaag, iso)
  if (n === 0) return 'vandaag'
  if (n === 1) return 'morgen'
  const d = datumVan(iso)
  return `${WEEKDAG[d.getDay()]} ${d.getDate()} ${MAAND[d.getMonth()]}`
}

const uren = (min: number): string => {
  if (min < 60) return `${min} min`
  const u = Math.floor(min / 60)
  const r = min % 60
  return r ? `${u} u ${r} min` : `${u} u`
}

export const STATUSKLEUR: Record<Toetsstatus, string> = {
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
  const opgeslagen = p.plan ?? leegPlan()
  const plan = actueel(opgeslagen, vandaag)
  const [bewerk, zetBewerk] = useState<Toets | null | 'nieuw'>(null)

  /* Was het bord voor een eerdere dag gepland, dan de nieuwe planning ook
     bewaren, zodat het ouderscherm en het andere toestel hem zien. */
  const { bewaar } = p
  useEffect(() => {
    if (plan !== opgeslagen) bewaar(plan)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [vandaag])

  /* Elke wijziging die de planning raakt: opnieuw neerzetten vanaf vandaag. */
  const herplanEnBewaar = (q: Planstand): void => bewaar(actueel({ ...q, geplandVoor: null }, vandaag))
  const levend = plan.toetsen.filter((t) => !t.weg)
  const standen = toetsStand(plan, vandaag)
  const week = weekUren(plan, vandaag)
  const s = schatting(plan.blokken)
  const start = (STARTTOETSEN[p.pid] ?? []).filter((t) => t.datum > vandaag)

  /* De dagen na vandaag waar iets op staat, tot en met de laatste toets. */
  const laatste = levend.reduce((m, t) => (t.datum > m ? t.datum : m), vandaag)
  const dagen: string[] = []
  for (let d = schuif(vandaag, 1); d <= laatste && dagen.length < 28; d = schuif(d, 1)) dagen.push(d)
  const dagProps = { vandaag, plan, bewaar, herplan: herplanEnBewaar }

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
          {' '}Klopt iets niet? Tik op <b>aanpassen</b> bij een blok.
        </p>
      )}

      {levend.length === 0 && (
        <div className="card center" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 32 }}>🗓️</div>
          <p style={{ fontSize: 16 }}>Nog niets op het bord.</p>
          <p className="muted" style={{ fontSize: 13 }}>
            Zet elke toets en elke opdracht met een deadline erop zodra hij in je rooster staat.
            Het bord rekent terug vanaf die dag en zegt elke dag wat je doet.
          </p>
          <div className="wrap" style={{ justifyContent: 'center', marginTop: 10 }}>
            {start.length > 0 && (
              <button
                type="button" className="btn gold"
                onClick={() => {
                  let q = plan
                  for (const t of start) q = zetToets(q, { ...t, bijgewerkt: Date.now() })
                  herplanEnBewaar(q)
                }}
              >⚡ Begin met de toetsen van deze week ({start.length})</button>
            )}
            <button type="button" className="btn" onClick={() => zetBewerk('nieuw')}>＋ Toets of opdracht</button>
          </div>
        </div>
      )}

      {levend.length > 0 && (
        <Dagkaart titel="Vandaag" iso={vandaag} blokken={blokkenOp(plan, vandaag)} open {...dagProps} />
      )}

      {dagen.map((d) => {
        const bl = blokkenOp(plan, d)
        const afwijkend = typeof plan.perDatum?.[d] === 'number'
        if (!bl.length && !afwijkend) return null
        return <Dagkaart key={d} titel={dagLabel(d, vandaag)} iso={d} blokken={bl} {...dagProps} />
      })}

      {levend.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>📝 Toetsen en opdrachten</b>
            <button type="button" className="btn sm" onClick={() => zetBewerk('nieuw')}>＋ Erbij</button>
          </div>
          {standen.map((st) => (
            <div key={st.toets.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {st.toets.opdracht ? '📎 ' : ''}{VAKNAAM[st.toets.vak] ?? st.toets.vak} · {st.toets.titel}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {st.toets.opdracht ? 'inleveren ' : ''}{dagLabel(st.toets.datum, vandaag)}
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
                  Dit past niet helemaal: er staat {uren(st.rest)} open. Maak blokken korter, zet
                  meer tijd per dag (onderaan), of kies bewust wat minder aandacht krijgt.
                </div>
              )}
              <div className="wrap" style={{ marginTop: 6 }}>
                <button type="button" className="btn ghost sm" onClick={() => zetBewerk(st.toets)}>✏️ Aanpassen</button>
                <button
                  type="button" className="btn ghost sm" aria-label="Van het bord halen"
                  onClick={() => { if (confirm('Van het bord halen?')) herplanEnBewaar(haalToetsWeg(plan, st.toets.id)) }}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bewerk && (
        <Toetsformulier
          key={bewerk === 'nieuw' ? 'nieuw' : bewerk.id}
          vakken={p.vakken} vandaag={vandaag}
          toets={bewerk === 'nieuw' ? null : bewerk}
          sluit={() => zetBewerk(null)}
          bewaar={(t) => { herplanEnBewaar(zetToets(plan, t)); zetBewerk(null) }}
        />
      )}

      <details className="klapkaart" style={{ marginTop: 14 }}>
        <summary><b>⏱️ Beschikbare tijd per weekdag</b><span className="muted zij">het bord vult nooit meer dan 80%</span></summary>
        <div className="klapbak">
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            Minuten per dag die je echt aan school kunt besteden, na eten, sport en reizen. Liever
            te laag dan te hoog: een planning die uitloopt haalt het nooit meer in. Is één dag
            anders, gebruik dan <b>⏱️</b> bij die dag.
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
                    herplanEnBewaar({ ...plan, perDag })
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

interface DagProps {
  titel: string; iso: string; vandaag: string; blokken: Blok[]; plan: Planstand
  open?: boolean; bewaar: (p: Planstand) => void; herplan: (p: Planstand) => void
}

function Dagkaart({ titel, iso, vandaag, blokken, plan, open, bewaar, herplan }: DagProps): ReactNode {
  const cap = capaciteit(plan, iso)
  const gepland = geplandOp(plan, iso)
  const af = blokken.filter((b) => b.gedaan).length
  const vol = blokken.some((b) => b.vol && !b.gedaan)
  const alles = blokken.length > 0 && af === blokken.length
  const afwijkend = typeof plan.perDatum?.[iso] === 'number'
  const zetTijd = (): void => {
    const v = prompt(
      `Hoeveel minuten heb je ${titel.toLowerCase()}? (0 = geen tijd, leeg = gewoon)`,
      String(minutenOp(plan, iso)))
    if (v === null) return
    herplan(zetDagtijd(plan, iso, v.trim() === '' ? null : Math.max(0, Number(v) || 0)))
  }
  return (
    <div
      className="card"
      style={{
        marginTop: 12,
        ...(open ? { background: '#eef6ff', borderLeft: '4px solid #3a6ea0' } : {}),
        ...(alles ? { opacity: 0.75 } : {}),
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <b style={{ textTransform: open ? 'none' : 'capitalize' }}>{open ? '📍 ' : ''}{titel}</b>
        <span className="row" style={{ gap: 6 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {af}/{blokken.length} af · {uren(gepland)}{cap ? ` van ${uren(cap)}` : ''}
          </span>
          <button
            type="button" className="btn ghost sm" style={{ padding: '4px 10px' }}
            title="Andere hoeveelheid tijd op deze dag" aria-label="Tijd op deze dag aanpassen"
            onClick={zetTijd}
          >⏱️</button>
        </span>
      </div>
      {afwijkend && (
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Deze dag heb je {uren(minutenOp(plan, iso))} opgegeven.{' '}
          <button
            type="button" className="back" style={{ padding: 0, fontSize: 13 }}
            onClick={() => herplan(zetDagtijd(plan, iso, null))}
          >gewoon maken</button>
        </div>
      )}
      {vol && (
        <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
          Deze dag loopt over: er paste nergens anders iets bij. Doe wat je kunt, de rest schuift vanzelf.
        </div>
      )}
      {blokken.length === 0 && (
        <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>Niets gepland. 🎉</p>
      )}
      {blokken.map((b) => (
        <Blokregel key={b.id} blok={b} plan={plan} vandaag={vandaag} bewaar={bewaar} herplan={herplan} />
      ))}
    </div>
  )
}

export function Blokregel({ blok: b, plan, vandaag, bewaar, herplan }: {
  blok: Blok; plan: Planstand; vandaag: string
  bewaar: (p: Planstand) => void; herplan: (p: Planstand) => void
}): ReactNode {
  const [aanpassen, zetAanpassen] = useState(false)
  const toets = plan.toetsen.find((t) => t.id === b.toets)
  const vraagEcht = b.gedaan && b.echt == null
  const keuzes = [...new Set([rond5(b.geschat * 0.5), rond5(b.geschat), rond5(b.geschat * 1.5), rond5(b.geschat * 2)])]
  /* Een blok mag naar elke dag van vandaag tot de dag vóór de toets. */
  const mogelijk: string[] = []
  if (toets) for (let d = vandaag; d < toets.datum && mogelijk.length < 28; d = schuif(d, 1)) mogelijk.push(d)
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <label className="row" style={{ alignItems: 'flex-start', cursor: 'pointer', flex: 1 }}>
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
              {b.vast ? ' · 📌 zelf gezet' : ''}
              {b.eigen != null && !b.gedaan ? ' · eigen schatting' : ''}
              {b.vol && !b.gedaan ? ' · past niet' : ''}
            </span>
          </div>
        </label>
        {!b.gedaan && (
          <button
            type="button" className="back" style={{ fontSize: 13, padding: '2px 4px', whiteSpace: 'nowrap' }}
            aria-expanded={aanpassen} onClick={() => zetAanpassen(!aanpassen)}
          >{aanpassen ? 'klaar' : 'aanpassen'}</button>
        )}
      </div>
      {aanpassen && !b.gedaan && (
        <div className="wrap" style={{ marginTop: 6, marginLeft: 32, alignItems: 'center', fontSize: 13 }}>
          <label style={{ fontWeight: 600 }}>
            Dag{' '}
            <select
              className="f" style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }} value={b.datum}
              onChange={(e) => herplan(verplaats(plan, b.id, e.target.value))}
            >
              {!mogelijk.includes(b.datum) && <option value={b.datum}>{dagLabel(b.datum, vandaag)}</option>}
              {mogelijk.map((d) => <option key={d} value={d}>{dagLabel(d, vandaag)}</option>)}
            </select>
          </label>
          <label style={{ fontWeight: 600 }}>
            Minuten{' '}
            <input
              className="f" type="number" inputMode="numeric" min={5} max={240} step={5}
              style={{ width: 72, padding: '4px 8px', fontSize: 13 }}
              defaultValue={b.geschat}
              onBlur={(e) => {
                const n = Number(e.target.value)
                if (n > 0 && n !== b.geschat) herplan(zetEigen(plan, b.id, n))
              }}
            />
          </label>
          {(b.vast || b.eigen != null) && (
            <button
              type="button" className="btn ghost sm"
              onClick={() => { herplan(zetEigen(maakLos(plan, b.id), b.id, null)); zetAanpassen(false) }}
            >↺ laat het bord kiezen</button>
          )}
        </div>
      )}
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
  const morgen = schuif(vandaag, 1)
  const [opdracht, zetOpdracht] = useState(toets?.opdracht === true)
  const [vak, zetVak] = useState(toets?.vak ?? vakken[0] ?? '')
  const [datum, zetDatum] = useState(toets?.datum ?? schuif(vandaag, 7))
  const [titel, zetTitel] = useState(toets?.titel ?? '')
  const [stof, zetStof] = useState(toets?.onderdelen.join('\n') ?? '')
  const [per, zetPer] = useState(toets?.perOnderdeel ?? 45)
  const [fout, zetFout] = useState('')
  const onderdelen = knipOnderdelen(stof)

  const opslaan = (): void => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) { zetFout('Kies een datum.'); return }
    if (datum <= vandaag) { zetFout('Kies een dag na vandaag: voor vandaag valt er niets meer te plannen.'); return }
    if (onderdelen.length === 0) { zetFout('Zet er minstens één stuk in, bijvoorbeeld "§3.1".'); return }
    bewaar({
      id: toets?.id ?? nieuwId(), vak, datum, titel: titel.trim() || (opdracht ? 'Opdracht' : 'Toets'),
      onderdelen, perOnderdeel: Math.max(10, Math.min(180, Math.round(per) || 45)), bijgewerkt: Date.now(),
      ...(opdracht ? { opdracht: true } : {}),
    })
  }

  return (
    <div className="card" style={{ marginTop: 14, borderLeft: '4px solid var(--gold)' }}>
      <b>{toets ? '✏️ Aanpassen' : '＋ Erbij op het bord'}</b>
      <div className="wrap" style={{ marginTop: 10 }}>
        <button type="button" className={'btn sm ' + (opdracht ? 'ghost' : '')} onClick={() => zetOpdracht(false)}>📝 Toets</button>
        <button type="button" className={'btn sm ' + (opdracht ? '' : 'ghost')} onClick={() => zetOpdracht(true)}>📎 Opdracht met deadline</button>
      </div>
      <label className="fld">Vak
        <select className="f" value={vak} onChange={(e) => zetVak(e.target.value)}>
          {vakken.map((v) => <option key={v} value={v}>{VAKNAAM[v] ?? v}</option>)}
        </select>
      </label>
      <label className="fld">{opdracht ? 'Inleveren op' : 'Datum van de toets'}
        <input className="f" type="date" value={datum} min={morgen} onChange={(e) => zetDatum(e.target.value)} />
      </label>
      <label className="fld">Waarover
        <input
          className="f" value={titel} placeholder={opdracht ? 'bijv. O&O verslag fase 2' : 'bijv. H3 Krachten'}
          onChange={(e) => zetTitel(e.target.value)}
        />
      </label>
      <label className="fld">{opdracht ? 'Wat er moet gebeuren' : 'De stof'}, in stukken (één per regel)
        <textarea
          className="f" value={stof} rows={4}
          placeholder={opdracht
            ? 'Bronnen zoeken\nOpzet maken\nEerste versie schrijven\nNalezen en inleveren'
            : '§3.1 Krachten tekenen\n§3.2 Krachten ontbinden\n§3.3 Evenwicht\nSamenvatting'}
          onChange={(e) => zetStof(e.target.value)}
        />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>
        {onderdelen.length} {onderdelen.length === 1 ? 'stuk' : 'stukken'}. Elk stuk wordt één blok; houd ze klein genoeg voor één zit.
        {opdracht ? ' Bij een opdracht komt er geen herhaal- of overhoorblok.' : ''}
      </div>
      <label className="fld">Minuten per stuk, zoals jij het schat
        <input
          className="f" type="number" inputMode="numeric" min={10} max={180} step={5} value={per}
          style={{ width: 120 }} onChange={(e) => zetPer(Number(e.target.value))}
        />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>
        ± {uren(onderdelen.length * (per || 0))}{opdracht ? '' : ', plus herhalen en overhoren'}. Het bord
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
