/**
 * De vijf schermen. Ze praten rechtstreeks met de tabellen; wat ze mogen zien
 * bepaalt RLS, niet deze code.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { vandaag } from '@/gedeeld/datum'
import { db, workerUrl } from './verbinding'
import { Opnemer, kiesFormaat } from './opnemer'
import { BEZIG, MAX_UPLOAD, STATUS, dag, datum, docUrl, duur, extensie, veiligZoeken } from './opmaak'
import type { Actie, Context, Instellingen as InstellingenRij, Notitie as NotitieRij, NotitieRegel, WerkerStatus } from './typen'

const REGELVELDEN = 'id,titel,status,gestart_op,duur_sec,context_id,bron'

function useContexten(): Context[] {
  const [lijst, zetLijst] = useState<Context[]>([])
  useEffect(() => {
    void db().from('contexts').select('*').order('volgorde')
      .then(({ data }) => zetLijst((data ?? []) as Context[]))
  }, [])
  return lijst
}

const naarNotitie = (id: string): void => { location.hash = `#/notitie/${id}` }

/* ---------- Opnemen ---------- */

type Fase = 'klaar' | 'bezig' | 'afronden'

export function Opnemen({ uid }: { uid: string }) {
  const contexten = useContexten()
  const [contextId, zetContextId] = useState<string | null>(null)
  const [fase, zetFase] = useState<Fase>('klaar')
  const [start, zetStart] = useState(0)
  const [nu, zetNu] = useState(Date.now())
  const [niveau, zetNiveau] = useState(0)
  const [wachtrij, zetWachtrij] = useState(0)
  const [melding, zetMelding] = useState<string | null>(null)
  const opnemer = useRef<Opnemer | null>(null)
  const noteId = useRef<string | null>(null)
  const bestand = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (fase !== 'bezig') return
    const t = setInterval(() => zetNu(Date.now()), 500)
    const waarschuw = (e: BeforeUnloadEvent): void => { e.preventDefault(); e.returnValue = '' }
    addEventListener('beforeunload', waarschuw)
    return () => { clearInterval(t); removeEventListener('beforeunload', waarschuw) }
  }, [fase])

  const begin = async (): Promise<void> => {
    zetMelding(null)
    const { data, error } = await db().from('notes').insert({
      owner_id: uid, bron: 'app', status: 'opname', gestart_op: new Date().toISOString(),
      context_id: contextId, context_vast: Boolean(contextId),
    }).select('id').single()
    if (error || !data) { zetMelding(`Kon geen notitie aanmaken: ${error?.message ?? 'onbekende fout'}`); return }
    const id = (data as { id: string }).id
    noteId.current = id
    const o = new Opnemer({ niveau: zetNiveau, wachtrij: zetWachtrij, melding: zetMelding })
    opnemer.current = o
    try {
      await o.start(uid, id)
    } catch (e) {
      await db().from('notes').delete().eq('id', id)
      const fout = e as { name?: string; message?: string }
      zetMelding(fout.name === 'NotAllowedError'
        ? 'Geef de app toegang tot de microfoon in de instellingen van je browser.'
        : `Opnemen lukt niet: ${fout.message ?? 'onbekende fout'}`)
      return
    }
    zetStart(Date.now()); zetNu(Date.now()); zetFase('bezig')
  }

  const stop = async (): Promise<void> => {
    const o = opnemer.current
    const id = noteId.current
    if (!o || !id) return
    zetFase('afronden')
    const compleet = await o.stop()
    const sec = Math.round((Date.now() - start) / 1000)
    const klaarzetten = async (): Promise<void> => {
      await db().from('notes').update({ status: 'klaar_voor_verwerking', duur_sec: sec }).eq('id', id)
      naarNotitie(id)
    }
    if (compleet) {
      await klaarzetten()
    } else {
      zetMelding('Nog niet alles is geüpload. Laat de app open; de opname wordt verwerkt zodra de verbinding terug is.')
      void o.pomp()
      const t = setInterval(() => {
        if (!o.openstaand && !o.bezig) { clearInterval(t); void klaarzetten() }
      }, 2000)
    }
    zetFase('klaar'); zetNiveau(0)
  }

  const upload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_UPLOAD) {
      zetMelding('Dit bestand is groter dan 50 MB. Zet het in de map Notities/_inbox in Google Drive; dan wordt het daar opgepakt.')
      return
    }
    zetMelding('Bestand wordt geüpload…')
    const { data, error } = await db().from('notes').insert({
      owner_id: uid, bron: 'upload', status: 'opname', titel: f.name,
      gestart_op: new Date(f.lastModified || Date.now()).toISOString(),
      context_id: contextId, context_vast: Boolean(contextId), modellen: { bestandsnaam: f.name },
    }).select('id').single()
    if (error || !data) { zetMelding(error?.message ?? 'Kon geen notitie aanmaken.'); return }
    const id = (data as { id: string }).id
    const { error: upFout } = await db().storage.from('audio')
      .upload(`${uid}/${id}/upload${extensie(f.name)}`, f, { contentType: f.type || 'application/octet-stream' })
    if (upFout) { zetMelding(`Uploaden mislukt: ${upFout.message}`); return }
    await db().from('notes').update({ status: 'klaar_voor_verwerking' }).eq('id', id)
    naarNotitie(id)
  }

  const opname = fase !== 'klaar'
  const sec = opname ? Math.round((nu - start) / 1000) : 0
  const ondersteund = typeof MediaRecorder !== 'undefined'
  const ringstijl = { '--niveau': niveau } as CSSProperties

  return (
    <main className="opnemen">
      <div className="contextkeuze" role="radiogroup" aria-label="Waar gaat dit over?">
        <button type="button" role="radio" aria-checked={!contextId} disabled={opname} onClick={() => zetContextId(null)}>Automatisch</button>
        {contexten.map((c) => (
          <button type="button" key={c.id} role="radio" aria-checked={contextId === c.id} disabled={opname} onClick={() => zetContextId(c.id)}>{c.naam}</button>
        ))}
      </div>

      <div className="knopvlak">
        <button
          type="button"
          className={`opnameknop ${opname ? 'aan' : ''}`}
          style={ringstijl}
          onClick={() => void (opname ? stop() : begin())}
          disabled={!ondersteund || fase === 'afronden'}
          aria-label={opname ? 'Opname stoppen' : 'Opname starten'}
        >
          <span className="ring" aria-hidden="true" />
          <span className="kern" aria-hidden="true" />
        </button>
        <p className="tijd" aria-live="off">{duur(sec)}</p>
        <p className="toelichting">
          {fase === 'klaar' && 'Tik om op te nemen. Zeg aan het begin dat je opneemt.'}
          {fase === 'bezig' && (wachtrij > 1 ? `${wachtrij} stukken wachten op upload` : 'Wordt elke 30 seconden veiliggesteld')}
          {fase === 'afronden' && 'Laatste stuk wordt geüpload…'}
        </p>
      </div>

      {melding && <p className="melding" role="status">{melding}</p>}
      {!ondersteund && <p className="melding">Deze browser kan niet opnemen. Gebruik Safari op iOS 14.5 of later, of een recente Chrome of Edge.</p>}

      {!opname && (
        <div className="bestand">
          <button type="button" className="knop" onClick={() => bestand.current?.click()}>Audiobestand verwerken</button>
          <input ref={bestand} type="file" accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg" hidden onChange={(e) => void upload(e)} />
          <p className="klein">Spraakmemo, gespreksopname of export uit SwyxIt. Op de iPhone kan het ook via Delen, Google Drive, map Notities/_inbox.</p>
        </div>
      )}
      <p className="klein formaat">Opnameformaat: {kiesFormaat().ext}</p>
    </main>
  )
}

/* ---------- De lijst ---------- */

export function Lijst() {
  const contexten = useContexten()
  const ctxNaam = useMemo(() => Object.fromEntries(contexten.map((c) => [c.id, c.naam])), [contexten])
  const [notities, zetNotities] = useState<NotitieRegel[] | null>(null)
  const [filter, zetFilter] = useState<string | null>(null)
  const [zoek, zetZoek] = useState('')
  const [resultaat, zetResultaat] = useState<NotitieRegel[] | null>(null)

  const laad = useCallback(async () => {
    let q = db().from('notes').select(REGELVELDEN).order('gestart_op', { ascending: false }).limit(200)
    if (filter) q = q.eq('context_id', filter)
    const { data } = await q
    zetNotities((data ?? []) as NotitieRegel[])
  }, [filter])

  useEffect(() => { void laad() }, [laad])
  useEffect(() => {
    if (!notities?.some((n) => BEZIG.has(n.status))) return
    const t = setInterval(() => void laad(), 8000)
    return () => clearInterval(t)
  }, [notities, laad])

  const zoeken = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const term = zoek.trim()
    if (!term) { zetResultaat(null); return }
    const veilig = veiligZoeken(term)
    let lijst: NotitieRegel[] = []
    if (veilig) {
      const { data } = await db().from('notes').select(REGELVELDEN)
        .or(`titel.ilike.%${veilig}%,transcript.ilike.%${veilig}%`)
        .order('gestart_op', { ascending: false }).limit(30)
      lijst = (data ?? []) as NotitieRegel[]
    }
    const werker = workerUrl()
    if (werker) {
      try {
        const { data: { session } } = await db().auth.getSession()
        const r = await fetch(`${werker}/embed`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tekst: term }),
        })
        if (r.ok) {
          const { vector } = (await r.json()) as { vector: number[] }
          const { data: sem } = await db().rpc('zoek_notities', { query_embedding: vector, aantal: 10 })
          const gezien = new Set(lijst.map((n) => n.id))
          const extra = ((sem ?? []) as Array<NotitieRegel & { score: number }>)
            .filter((n) => n.score > 0.3 && !gezien.has(n.id))
          lijst = [...lijst, ...extra]
        }
      } catch { /* dan alleen op tekst */ }
    }
    zetResultaat(lijst)
  }

  const toon = resultaat ?? notities
  return (
    <main>
      <h1>Notities</h1>
      <form className="zoek" onSubmit={(e) => void zoeken(e)} role="search">
        <input type="search" placeholder="Zoek op onderwerp, naam of afspraak" value={zoek} aria-label="Zoeken"
          onChange={(e) => { zetZoek(e.target.value); if (!e.target.value) zetResultaat(null) }} />
      </form>
      <div className="contextkeuze klein-chips">
        <button type="button" aria-pressed={!filter} onClick={() => zetFilter(null)}>Alles</button>
        {contexten.map((c) => <button type="button" key={c.id} aria-pressed={filter === c.id} onClick={() => zetFilter(c.id)}>{c.naam}</button>)}
      </div>
      {toon === null ? null : toon.length === 0 ? (
        <p className="leeg">{resultaat ? 'Niets gevonden.' : 'Nog geen notities. Neem je eerste overleg op via Opnemen.'}</p>
      ) : (
        <ul className="lijst">
          {toon.map((n) => (
            <li key={n.id}>
              <a href={`#/notitie/${n.id}`}>
                <span className="titel">{n.titel || 'Zonder titel'}</span>
                <span className="meta">
                  {datum(n.gestart_op)}{n.duur_sec ? `, ${duur(n.duur_sec)}` : ''}
                  {n.context_id && ctxNaam[n.context_id] ? `, ${ctxNaam[n.context_id]}` : ''}
                </span>
                {n.status && n.status !== 'goedgekeurd' && <span className={`status s-${n.status}`}>{STATUS[n.status]}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

/* ---------- Eén notitie nalezen ---------- */

function Opsomming({ kop, items }: { kop: string; items: string[] | undefined }) {
  if (!items?.length) return null
  return <><h2>{kop}</h2><ul>{items.map((b, i) => <li key={i}>{b}</li>)}</ul></>
}

export function Notitie({ id }: { id: string }) {
  const contexten = useContexten()
  const [n, zetN] = useState<NotitieRij | null | undefined>(undefined)
  const [acties, zetActies] = useState<Actie[]>([])
  const [titel, zetTitel] = useState('')

  const laad = useCallback(async () => {
    const { data } = await db().from('notes').select('*').eq('id', id).maybeSingle()
    const rij = (data ?? null) as NotitieRij | null
    zetN(rij)
    if (rij) zetTitel((t) => t || rij.titel || '')
    const { data: a } = await db().from('actions').select('*').eq('note_id', id).order('van_mij', { ascending: false })
    zetActies((a ?? []) as Actie[])
  }, [id])

  useEffect(() => { void laad() }, [laad])
  useEffect(() => {
    if (!n || !BEZIG.has(n.status)) return
    const t = setInterval(() => void laad(), 5000)
    return () => clearInterval(t)
  }, [n, laad])

  if (n === undefined) return <main><p className="leeg">Laden…</p></main>
  if (n === null) return <main><p className="leeg">Deze notitie bestaat niet meer.</p></main>

  const r = n.samenvatting
  const bezig = BEZIG.has(n.status)
  const wijzig = async (velden: Partial<NotitieRij>): Promise<void> => {
    await db().from('notes').update(velden).eq('id', id)
    await laad()
  }
  const goedkeuren = async (): Promise<void> => {
    const { data: s } = await db().from('settings').select('bewaartermijn_audio_dagen').maybeSingle()
    const dagen = (s as { bewaartermijn_audio_dagen?: number } | null)?.bewaartermijn_audio_dagen ?? 30
    await wijzig({ status: 'goedgekeurd', titel, audio_verwijderen_na: new Date(Date.now() + dagen * 86_400_000).toISOString() })
  }
  /* Met een transcript is opnieuw samenvatten genoeg; zonder transcript, en
     zonder audio, valt er niets opnieuw te doen. */
  const kanOpnieuw = Boolean(n.transcript) || !n.audio_verwijderd
  const opnieuw = (): Promise<void> => wijzig({ status: n.transcript ? 'opnieuw' : 'klaar_voor_verwerking', fout: null })
  const kiesContext = (ctxId: string): Promise<void> => wijzig({
    context_id: ctxId || null, context_vast: Boolean(ctxId), status: n.transcript ? 'opnieuw' : n.status,
  })
  const vink = async (a: Actie): Promise<void> => {
    await db().from('actions').update({ afgerond: !a.afgerond }).eq('id', a.id)
    await laad()
  }
  const verwijder = async (): Promise<void> => {
    if (!confirm('Notitie, audio en transcript verwijderen? Het Google Doc blijft staan.')) return
    const map = `${n.owner_id}/${id}`
    const { data: bestanden } = await db().storage.from('audio').list(map, { limit: 1000 })
    if (bestanden?.length) await db().storage.from('audio').remove(bestanden.map((f) => `${map}/${f.name}`))
    await db().from('notes').delete().eq('id', id)
    location.hash = '#/notities'
  }
  const transcriptie = ([] as string[]).concat(n.modellen.transcriptie ?? [])

  return (
    <main className="notitie">
      <a className="terug" href="#/notities">Alle notities</a>
      {/* Een tekstvak en geen invoerveld: een titel van acht woorden past op
          een telefoon niet op één regel, en een invoerveld kapt hem dan af. */}
      <textarea className="titelveld" rows={2} value={titel} placeholder="Titel volgt na verwerking" aria-label="Titel"
        onChange={(e) => zetTitel(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
        onBlur={() => { if (titel !== (n.titel ?? '')) void wijzig({ titel }) }} />
      <p className="meta">
        {datum(n.gestart_op)}{n.duur_sec ? `, ${duur(n.duur_sec)}` : ''}
        {n.agenda_titel ? `, agenda: ${n.agenda_titel}` : ''}
      </p>

      <div className="regel">
        <label htmlFor="ctx">Context</label>
        <select id="ctx" value={n.context_id ?? ''} onChange={(e) => void kiesContext(e.target.value)} disabled={bezig}>
          <option value="">Automatisch</option>
          {contexten.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
        </select>
      </div>

      {bezig && <p className={`voortgang s-${n.status}`}>{STATUS[n.status]}…</p>}
      {n.status === 'fout' && (
        <div className="foutblok">
          <p>Verwerking mislukt: {n.fout}</p>
          {kanOpnieuw && <button type="button" className="knop" onClick={() => void opnieuw()}>Opnieuw proberen</button>}
        </div>
      )}

      {r && (
        <article className="samenvatting">
          {r.samenvatting.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          <Opsomming kop="Besluiten" items={r.besluiten} />
          {acties.length > 0 && (
            <>
              <h2>Actiepunten</h2>
              <ul className="acties">
                {acties.map((a) => (
                  <li key={a.id} className={a.van_mij ? 'mijn' : ''}>
                    <label>
                      <input type="checkbox" checked={a.afgerond} onChange={() => void vink(a)} />
                      <span><b>{a.wie}</b> {a.wat}{a.deadline ? <em> vóór {dag(a.deadline)}</em> : null}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Opsomming kop="Open vragen" items={r.open_vragen} />
          <Opsomming kop="Mijn vervolgstappen" items={r.mijn_vervolgstappen} />
        </article>
      )}

      {n.transcript && (
        <details className="transcript">
          <summary>Transcript</summary>
          <pre>{n.transcript}</pre>
        </details>
      )}

      <div className="knoppen">
        {n.status === 'gereed' && <button type="button" className="knop primair" onClick={() => void goedkeuren()}>Goedkeuren</button>}
        {n.drive_doc_id && <a className="knop" href={docUrl(n.drive_doc_id)} target="_blank" rel="noreferrer">Openen in Google Docs</a>}
        {(n.status === 'gereed' || n.status === 'goedgekeurd') && <button type="button" className="knop" onClick={() => void opnieuw()}>Opnieuw samenvatten</button>}
        <button type="button" className="knop tekst gevaar" onClick={() => void verwijder()}>Verwijderen</button>
      </div>
      {n.modellen.samenvatting && (
        <p className="klein">
          Gemaakt met {transcriptie.join(', ') || 'het bestaande transcript'} en {n.modellen.samenvatting}
          {n.modellen.drive_fout ? '. Het Google Doc kon niet worden gemaakt.' : '.'}
        </p>
      )}
    </main>
  )
}

/* ---------- Acties ---------- */

type ActieMetNotitie = Actie & { notes: { titel: string | null } | null }

export function Acties() {
  const [acties, zetActies] = useState<ActieMetNotitie[] | null>(null)
  const [alles, zetAlles] = useState(false)
  const laad = useCallback(async () => {
    let q = db().from('actions').select('*, notes(titel)')
      .order('deadline', { ascending: true, nullsFirst: false }).limit(300)
    if (!alles) q = q.eq('afgerond', false)
    const { data } = await q
    zetActies((data ?? []) as ActieMetNotitie[])
  }, [alles])
  useEffect(() => { void laad() }, [laad])
  const vink = async (a: Actie): Promise<void> => {
    await db().from('actions').update({ afgerond: !a.afgerond }).eq('id', a.id)
    await laad()
  }
  /* De lokale datum en niet toISOString(): die is UTC, en tussen middernacht
     en twee uur 's nachts zou een actie van vandaag dan al te laat heten. */
  const nu = vandaag()

  const groep = (kop: string, lijst: ActieMetNotitie[]) => lijst.length > 0 && (
    <section>
      <h2>{kop}</h2>
      <ul className="acties">
        {lijst.map((a) => (
          <li key={a.id} className={a.deadline && a.deadline < nu && !a.afgerond ? 'te-laat' : ''}>
            <label>
              <input type="checkbox" checked={a.afgerond} onChange={() => void vink(a)} />
              <span>
                {!a.van_mij && <b>{a.wie} </b>}{a.wat}
                {a.deadline && <em> vóór {dag(a.deadline)}</em>}
                <a className="bron" href={`#/notitie/${a.note_id}`}>{a.notes?.titel || 'notitie'}</a>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )

  if (!acties) return null
  return (
    <main>
      <h1>Acties</h1>
      <label className="schakel"><input type="checkbox" checked={alles} onChange={(e) => zetAlles(e.target.checked)} /> Ook afgeronde tonen</label>
      {acties.length === 0 && <p className="leeg">Geen openstaande acties.</p>}
      {groep('Voor mij', acties.filter((a) => a.van_mij))}
      {groep('Bij anderen', acties.filter((a) => !a.van_mij))}
    </main>
  )
}

/* ---------- Instellingen ---------- */

export function Instellingen({ uid }: { uid: string }) {
  const [s, zetS] = useState<InstellingenRij | null>(null)
  const [termijn, zetTermijn] = useState('30')
  const [stemFase, zetStemFase] = useState<string | null>(null)
  const [werker, zetWerker] = useState<WerkerStatus | false | null>(null)

  useEffect(() => {
    void db().from('settings').select('*').maybeSingle().then(({ data }) => {
      const rij = (data as InstellingenRij | null)
        ?? { owner_id: uid, mijn_naam: 'Abdelkader', stemreferentie_pad: null, bewaartermijn_audio_dagen: 30 }
      zetS(rij)
      zetTermijn(String(rij.bewaartermijn_audio_dagen))
    })
    const w = workerUrl()
    if (w) {
      fetch(`${w}/health`).then((r) => r.json() as Promise<WerkerStatus>).then(zetWerker).catch(() => zetWerker(false))
    }
  }, [uid])

  const bewaar = async (velden: Partial<InstellingenRij>): Promise<void> => {
    zetS((oud) => (oud ? { ...oud, ...velden } : oud))
    await db().from('settings').upsert({ owner_id: uid, ...velden })
  }

  const neemStemOp = async (): Promise<void> => {
    const f = kiesFormaat()
    let stroom: MediaStream
    try {
      stroom = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      zetStemFase('Geen toegang tot de microfoon.')
      return
    }
    const rec = new MediaRecorder(stroom, f.mime ? { mimeType: f.mime } : undefined)
    const delen: Blob[] = []
    rec.ondataavailable = (e) => delen.push(e.data)
    rec.start()
    for (let i = 8; i > 0; i--) {
      zetStemFase(`Praat gewoon door… ${i}`)
      await new Promise((k) => setTimeout(k, 1000))
    }
    await new Promise<void>((k) => { rec.onstop = () => k(); rec.stop() })
    stroom.getTracks().forEach((t) => t.stop())
    const pad = `${uid}/stem/referentie.${f.ext}`
    const { error } = await db().storage.from('audio')
      .upload(pad, new Blob(delen, { type: f.type }), { contentType: f.type, upsert: true })
    if (error) { zetStemFase(`Opslaan mislukt: ${error.message}`); return }
    await bewaar({ stemreferentie_pad: pad })
    zetStemFase('Stem opgeslagen. Je wordt voortaan bij naam herkend in transcripten.')
  }

  if (!s) return null
  return (
    <main className="instellingen">
      <h1>Instellingen</h1>
      <div className="regel">
        <label htmlFor="naam">Mijn naam in transcripten</label>
        <input id="naam" value={s.mijn_naam} onChange={(e) => zetS({ ...s, mijn_naam: e.target.value })}
          onBlur={(e) => void bewaar({ mijn_naam: e.target.value })} />
      </div>
      <section>
        <h2>Stemherkenning</h2>
        <p>Neem acht seconden van je eigen stem op, zonder anderen op de achtergrond. Daarmee herkent de spraakherkenning wie jij bent, zodat actiepunten goed worden toegewezen.</p>
        <button type="button" className="knop" onClick={() => void neemStemOp()} disabled={stemFase?.startsWith('Praat') ?? false}>
          {s.stemreferentie_pad ? 'Stem opnieuw opnemen' : 'Stem opnemen'}
        </button>
        {stemFase && <p className="klein" role="status">{stemFase}</p>}
      </section>
      <div className="regel">
        <label htmlFor="bewaar">Audio bewaren na goedkeuren (dagen)</label>
        <input id="bewaar" type="number" min="0" max="365" value={termijn}
          onChange={(e) => zetTermijn(e.target.value)}
          onBlur={() => {
            const n = Math.round(Number(termijn))
            const geldig = Number.isFinite(n) && n >= 0 && n <= 365 ? n : s.bewaartermijn_audio_dagen
            zetTermijn(String(geldig))
            void bewaar({ bewaartermijn_audio_dagen: geldig })
          }} />
      </div>
      <section>
        <h2>Verwerking</h2>
        {!workerUrl() && <p>Geen workeradres ingesteld; zoeken werkt alleen op tekst.</p>}
        {werker === false && <p className="fout">De worker is niet bereikbaar. Opnames blijven veilig staan en worden verwerkt zodra hij weer draait.</p>}
        {werker && (
          <p>
            Worker actief sinds {datum(werker.gestart)}, {werker.verwerkt} verwerkt{werker.fouten ? `, ${werker.fouten} mislukt` : ''}.
            {' '}Google Drive en Agenda: {werker.google ? 'gekoppeld' : 'niet gekoppeld'}.
          </p>
        )}
      </section>
      <button type="button" className="knop tekst" onClick={() => void db().auth.signOut()}>Uitloggen</button>
    </main>
  )
}
