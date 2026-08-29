/**
 * OUDER-MODUS
 *
 * Achter een pincode, want hier staat het beheer: de voortgang per kind, de
 * uitbetaling, de weektaak en de knop die alles op nul zet. De pincode is geen
 * beveiliging tegen een indringer maar tegen een kind dat nieuwsgierig is; dat
 * is precies wat hier nodig is.
 *
 * Alle bedragen komen uit `beloning.ts` en worden hier alleen getoond — het
 * scherm rekent zelf niets uit. Uitbetalen is één handeling van de ouder: de
 * app houdt bij wat er verdiend is, en wie er wanneer betaalt is mensenwerk.
 */
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN, VAKNAAM } from '../gegevens/profielen'
import { SEED } from '../gegevens/seed'
import type { Kaart } from '../gegevens/soorten'
import type { Stand, Voortgang } from '../opslag'
import { schoonVoortgang } from '../opslag'
import {
  BELONING, berekenBeloning, euro, openstaand, totaalUitbetaald, totaalVerdiend,
  weekVerdiend, weekbudgetVan,
} from '../beloning'
import { isBeheerst } from '../leitner'
import { zwakteAnalyse } from '../volgsysteem'
import { bewaarAls, leerprofielData, rapportTekst } from '../rapport'
import { advies, bandNaam, isAf } from '../leerscan'
import {
  KindAccounts, Kindwachtwoorden, Leerlijnpaneel, Leerprofielpaneel, Weektaakbeheer, Zomerpaneel,
} from './Panelen'

export interface Wolkbediening {
  status: string
  koppelen: (code: string, pin: string) => Promise<void>
  inloggen: (code: string, pin: string) => Promise<void>
  gelijktrekken: () => Promise<void>
  uploaden: () => Promise<void>
  ontkoppelen: () => void
  meld: (t: string) => void
}

export interface OuderProps {
  stand: Stand
  alle: Kaart[]
  nuMs: number
  terug: () => void
  zet: (verander: (s: Stand) => Stand) => void
  zetKind: (pid: string, verander: (p: Voortgang) => Voortgang) => void
  wolk: Wolkbediening
  alleOnline: () => Promise<number>
  ververs: () => Promise<void>
  reset: () => void
}

export function Ouder(p: OuderProps): ReactNode {
  const [open, zetOpen] = useState(false)
  const [pin, zetPin] = useState('')
  const [melding, zetMelding] = useState('')

  function tik(cijfer: string): void {
    const np = (pin + cijfer).slice(0, 4)
    zetPin(np)
    if (np.length < 4) return
    if (np === p.stand.pin) { zetOpen(true); return }
    zetMelding('Onjuiste PIN')
    setTimeout(() => { zetPin(''); zetMelding('') }, 700)
  }

  if (!open) {
    return (
      <div>
        <button type="button" className="back" onClick={p.terug}>← terug</button>
        <div className="center" style={{ marginTop: 30 }}>
          <h2>Ouder-modus</h2>
          <p className="muted">Voer de PIN in (standaard 1234)</p>
          <div className="pindots">{'●'.repeat(pin.length)}{'○'.repeat(4 - pin.length)}</div>
          {melding && <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{melding}</div>}
          <div className="pinpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button type="button" key={n} onClick={() => tik(n)}>{n}</button>
            ))}
            <button type="button" onClick={() => zetPin('')}>C</button>
            <button type="button" onClick={() => tik('0')}>0</button>
            <button type="button" onClick={() => zetPin(pin.slice(0, -1))}>⌫</button>
          </div>
        </div>
      </div>
    )
  }

  return <OuderOpen {...p} />
}

function OuderOpen(p: OuderProps): ReactNode {
  return (
    <div>
      <div className="topbar">
        <button type="button" className="back" onClick={p.terug}>← terug</button>
        <span className="pill">Ouder-modus</span>
      </div>
      <Leerscanpaneel stand={p.stand} />
      <Vragenpaneel stand={p.stand} zet={p.zet} />
      <KindAccounts stand={p.stand} alleOnline={p.alleOnline} ververs={p.ververs} />
      <Leerprofielpaneel stand={p.stand} alle={p.alle} />
      <Leerlijnpaneel stand={p.stand} />
      <Weektaakbeheer stand={p.stand} zet={p.zet} />
      <Resetpaneel reset={p.reset} />
      <Wolkpaneel stand={p.stand} wolk={p.wolk} />
      <Voortgangpaneel {...p} />
      <Zomerpaneel stand={p.stand} zet={p.zet} />
      <Kindwachtwoorden
        stand={p.stand}
        zetPw={(pid, pw) => p.zet((s) => ({ ...s, kidpw: { ...s.kidpw, [pid]: pw.trim() } }))}
      />
      <Schakelaar
        titel="⚔️ Vriend uitdagen (wedstrijd via link)"
        uitleg="Kind kan één vriend uitnodigen voor dezelfde quiz. Alleen een spelletje, geen persoonlijke gegevens."
        aan={p.stand.wedstrijdAan !== false}
        wissel={() => p.zet((s) => ({ ...s, wedstrijdAan: !(s.wedstrijdAan !== false) }))}
      />
      <Schakelaar
        titel="🎮 Speeltijd verdienen"
        uitleg="Spelletjes pas beschikbaar nadat het dagdoel gehaald is."
        aan={p.stand.spelNaDoel === true}
        wissel={() => p.zet((s) => ({ ...s, spelNaDoel: !(s.spelNaDoel === true) }))}
      />
      <Opgavenbeheer stand={p.stand} zet={p.zet} />
    </div>
  )
}

function Schakelaar(
  { titel, uitleg, aan, wissel }:
  { titel: string; uitleg: string; aan: boolean; wissel: () => void },
): ReactNode {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <b>{titel}</b>
          <div className="muted" style={{ fontSize: 12 }}>{uitleg}</div>
        </span>
        <button type="button" className={'btn sm ' + (aan ? '' : 'ghost')} onClick={wissel}>
          {aan ? 'Aan' : 'Uit'}
        </button>
      </div>
    </div>
  )
}

function Resetpaneel({ reset }: { reset: () => void }): ReactNode {
  const [vraag, zetVraag] = useState(false)
  const [melding, zetMelding] = useState('')
  return (
    <div className="card" style={{ marginBottom: 16, background: '#fdeeee', borderLeftColor: '#C23728' }}>
      <div
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
      >
        <span>
          🗑️ <b>Alles resetten naar 0</b>
          <div className="muted" style={{ fontSize: 12 }}>
            Wist alle punten, voortgang, betalingen en spel-records — iedereen begint schoon
            (accounts &amp; instellingen blijven).
          </div>
        </span>
        {vraag
          ? (
            <span className="wrap">
              <button
                type="button" className="btn accent sm"
                onClick={() => {
                  zetVraag(false)
                  reset()
                  zetMelding('✅ Alles gereset naar 0 — iedereen begint schoon.')
                  setTimeout(() => zetMelding(''), 4000)
                }}
              >Ja, alles naar 0</button>
              <button type="button" className="btn ghost sm" onClick={() => zetVraag(false)}>
                Annuleren
              </button>
            </span>
            )
          : (
            <button type="button" className="btn accent sm" onClick={() => zetVraag(true)}>
              Reset naar 0
            </button>
            )}
      </div>
      {vraag && (
        /* Geen ingebouwd bevestigingsvenster: een inline vraag laat zich
           vormgeven, blijft binnen de app en is niet weg te klikken zonder te
           lezen. */
        <div className="muted" style={{ marginTop: 8, fontSize: 13, color: '#C23728' }}>
          Weet je het zeker? Alle scores van álle kinderen gaan naar 0, ook online. Dit kan niet
          ongedaan worden gemaakt.
        </div>
      )}
      {melding && (
        <div style={{ color: '#2c7a2c', fontWeight: 600, marginTop: 8, fontSize: 13 }}>{melding}</div>
      )}
    </div>
  )
}

function Wolkpaneel({ stand, wolk }: { stand: Stand; wolk: Wolkbediening }): ReactNode {
  const c = stand.cloud
  const gekoppeld = !!(c.household && c.pin)
  const [code, zetCode] = useState(c.household)
  const [pin, zetPin] = useState('')
  const [bezig, zetBezig] = useState(false)

  const doe = (fn: () => Promise<void>): void => {
    zetBezig(true)
    void fn().catch((e: Error) => wolk.meld('⚠️ ' + (e.message || 'mislukt'))).finally(() => zetBezig(false))
  }

  return (
    <div className="card" style={{ marginBottom: 16, background: '#eef4fb', borderLeftColor: '#3a6ea0' }}>
      <b>☁️ Online opslag — overal &amp; altijd inzien</b>
      {gekoppeld
        ? (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            Gekoppeld aan familiecode <b>{c.household}</b>. Resultaten worden automatisch
            opgeslagen en op elk toestel gelijk gehouden.
            {c.lastSync && (
              <div className="muted" style={{ marginTop: 2 }}>
                Laatst gesynct: {new Date(c.lastSync).toLocaleString('nl-NL')}
              </div>
            )}
            <div className="wrap" style={{ marginTop: 10 }}>
              <button
                type="button" className="btn sm" disabled={bezig}
                onClick={() => doe(wolk.gelijktrekken)}
              >🔄 Samenvoegen &amp; gelijktrekken</button>
              <button
                type="button" className="btn ghost sm" disabled={bezig}
                onClick={() => doe(wolk.uploaden)}
              >⬆️ Uploaden</button>
              <button type="button" className="btn ghost sm" onClick={wolk.ontkoppelen}>
                Ontkoppel
              </button>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Tip: doe &ldquo;Samenvoegen &amp; gelijktrekken&rdquo; één keer op élk toestel — dan
              tonen alle toestellen dezelfde (hoogste) score per kind.
            </p>
          </div>
          )
        : (
          <div style={{ marginTop: 8 }}>
            <p className="muted" style={{ fontSize: 13 }}>
              Kies één familiecode + pincode. Koppel op dit toestel; op elk ander toestel log je
              met dezelfde code in en zie je dezelfde resultaten.
            </p>
            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <div style={{ flex: 2 }}>
                <label className="fld" htmlFor="wCode">Familiecode</label>
                <input
                  className="f" id="wCode" value={code} placeholder="bijv. benna-gezin"
                  onChange={(e) => zetCode(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="fld" htmlFor="wPin">Pincode (4–8 cijfers)</label>
                <input
                  className="f" id="wPin" inputMode="numeric" value={pin} placeholder="1234"
                  onChange={(e) => zetPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
              </div>
            </div>
            <div className="wrap" style={{ marginTop: 10 }}>
              <button
                type="button" className="btn sm" disabled={bezig}
                onClick={() => doe(() => wolk.koppelen(code.trim().toLowerCase(), pin))}
              >➕ Nieuw gezin koppelen (upload)</button>
              <button
                type="button" className="btn ghost sm" disabled={bezig}
                onClick={() => doe(() => wolk.inloggen(code.trim().toLowerCase(), pin))}
              >🔑 Inloggen &amp; ophalen</button>
            </div>
          </div>
          )}
      {wolk.status && (
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#2c5680' }}>
          {wolk.status}
        </div>
      )}
    </div>
  )
}

function Voortgangpaneel({ stand, alle, nuMs, zet, zetKind }: OuderProps): ReactNode {
  const bestand = useRef<HTMLInputElement>(null)

  function terugzetten(f: File): void {
    void f.text().then((tekst) => {
      try {
        const obj = JSON.parse(tekst) as Stand
        if (!obj?.prog) throw new Error('geen back-up')
        zet((s) => ({ ...obj, cloud: s.cloud }))
      } catch {
        /* Een onleesbaar bestand mag niets overschrijven. */
      }
    })
  }

  return (
    <div className="card" style={{ marginBottom: 16, background: '#f0f6ea', borderLeftColor: '#5EA03A' }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <b>📊 Voortgang &amp; beloning per kind</b>
        <div className="wrap">
          <button
            type="button" className="btn ghost sm"
            onClick={() => bewaarAls('voortgangsrapport.txt', rapportTekst(stand, alle), 'text/plain')}
          >⬇️ Rapport</button>
          <button
            type="button" className="btn ghost sm"
            onClick={() => bewaarAls('leerprofiel.json',
              JSON.stringify(leerprofielData(stand, alle), null, 2), 'application/json')}
          >📊 Leerprofiel (JSON)</button>
          <button
            type="button" className="btn ghost sm"
            onClick={() => bewaarAls('bennahuiswerk-backup.json',
              JSON.stringify(stand, null, 2), 'application/json')}
          >💾 Back-up</button>
          <button type="button" className="btn ghost sm" onClick={() => bestand.current?.click()}>
            📂 Terugzetten
          </button>
          <input
            ref={bestand} type="file" accept="application/json,.json" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) terugzetten(f)
            }}
          />
        </div>
      </div>

      {Object.entries(PROFIELEN).map(([pid, P]) => {
        const prog = schoonVoortgang(stand.prog[pid])
        const vakRijen = P.vakken.map((v) => {
          const kaarten = alle.filter((e) => e.p === pid && e.v === v)
          return {
            v, total: kaarten.length,
            beheerst: kaarten.filter((e) => isBeheerst(prog, e.id)).length,
          }
        })
        const totBeheerst = vakRijen.reduce((s, r) => s + r.beheerst, 0)
        const totKaart = vakRijen.reduce((s, r) => s + r.total, 0)
        const analyse = zwakteAnalyse(prog, alle, pid)
        const b = berekenBeloning(prog, nuMs)
        const wv = weekVerdiend(prog, nuMs)
        const open = openstaand(prog)
        return (
          <div key={pid} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700 }}>
              {P.emoji} {P.naam}{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                · {P.niveau} · beheersing {totKaart ? Math.round(totBeheerst / totKaart * 100) : 0}%
                {' '}({totBeheerst}/{totKaart})
              </span>
            </div>
            <div className="muted" style={{ fontWeight: 400, fontSize: 13, marginTop: 2 }}>
              ⭐ {prog.punten || 0} · 🔥 {prog.streak || 0} · 📅 {prog.dagstreak || 0} dagen ·
              {' '}vandaag {prog.todayCount || 0}/{prog.goal || 10} · niveau{' '}
              {prog.niveau === 'auto' ? `auto (${prog.autoLvl || 1})` : prog.niveau}
            </div>
            <div className="wrap" style={{ marginTop: 6 }}>
              {vakRijen.map((r) => (
                <span key={r.v} className="tag">
                  {VAKNAAM[r.v] ?? r.v}: {r.beheerst}/{r.total}
                </span>
              ))}
            </div>
            {analyse.zwak.length > 0
              ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#a33' }}>
                    ⚠️ Aandachtspunten — zwakste onderwerpen:
                  </div>
                  {analyse.zwak.map((o, i) => (
                    <div key={i} style={{ marginTop: 4 }}>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                        <span>
                          {VAKNAAM[o.v] ?? o.v} – {o.t}{o.jaar === 'next' ? ' (volgend jaar)' : ''}
                        </span>
                        <span className="muted">
                          {o.pct}% beheerst{o.wrong > 0 ? ` · ${o.wrong}× fout` : ''}
                        </span>
                      </div>
                      <div className="pbar" style={{ height: 5 }}>
                        <i style={{
                          width: o.pct + '%',
                          ...(o.wrong > 0 ? { background: '#C23728' } : {}),
                        }} />
                      </div>
                    </div>
                  ))}
                  {analyse.sterk.length > 0 && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      💪 Gaat goed: {analyse.sterk.map((o) => (VAKNAAM[o.v] ?? o.v) + ' – ' + o.t).join(' · ')}
                    </div>
                  )}
                </div>
                )
              : (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Nog te weinig geoefend om zwakke punten te bepalen.
                </div>
                )}
            {prog.foutLog.length > 0 && (
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                📕 Foutenschrift: {prog.foutLog.length} som(men) om te herhalen
              </div>
            )}

            <div style={{
              marginTop: 8, padding: '8px 10px', background: '#fff9e6',
              border: '1px solid #f0d67a', borderRadius: 10,
            }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15 }}>
                  💶 <b>Totaal verdiend: {euro(totaalVerdiend(prog))}</b>
                </span>
                <button
                  type="button" className="btn sm" disabled={open <= 0}
                  onClick={() => zetKind(pid, (pr) => ({
                    ...pr,
                    betalingen: [...pr.betalingen, { d: new Date(nuMs).getFullYear() + '-'
                      + (new Date(nuMs).getMonth() + 1) + '-' + new Date(nuMs).getDate(),
                    bedrag: openstaand(pr) }].slice(-120),
                    betaaldOp: new Date(nuMs).getFullYear() + '-'
                      + (new Date(nuMs).getMonth() + 1) + '-' + new Date(nuMs).getDate(),
                  }))}
                >{open > 0 ? 'Betaal ' + euro(open) : 'Betaald ✓'}</button>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 4, fontSize: 13 }}>
                <span className="muted">Uitbetaald: <b>{euro(totaalUitbetaald(prog))}</b></span>
                <span style={{ fontWeight: 700, color: open > 0 ? '#a8730a' : '#2c7a2c' }}>
                  nog te betalen: {euro(open)}
                </span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                deze week {euro(wv)} van {euro(b.weekbudget)} budget
                {(prog.bonus || 0) > 0 ? ' · 🏆 toernooibonus ' + euro(prog.bonus) : ''}
                {(prog.verdiendBij || 0) !== 0
                  ? ' · bijstelling ' + (prog.verdiendBij > 0 ? '+' : '') + euro(prog.verdiendBij)
                  : ''}
                <br />vandaag {euro(b.bedrag)} · nauwkeurigheid{' '}
                {b.pogingen ? Math.round(b.nauw * 100) : 0}%
                {b.toetsEuro > 0 ? ' · toetsbonus ' + euro(b.toetsEuro) : ''}
                {b.factor === 0.5 ? ' · half tarief' : ''}
              </div>
              <div className="pbar" style={{ marginTop: 4 }}>
                <i style={{
                  width: Math.min(100, b.weekbudget ? Math.round(wv / b.weekbudget * 100) : 0) + '%',
                }} />
              </div>
              <div className="wrap" style={{ marginTop: 8, alignItems: 'center', gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Verdiensten bijstellen:</span>
                <button
                  type="button" className="btn ghost sm"
                  onClick={() => zetKind(pid, (pr) => ({ ...pr, verdiendBij: (pr.verdiendBij || 0) - 0.5 }))}
                >− € 0,50</button>
                <button
                  type="button" className="btn ghost sm"
                  onClick={() => zetKind(pid, (pr) => ({ ...pr, verdiendBij: (pr.verdiendBij || 0) + 0.5 }))}
                >+ € 0,50</button>
                {(prog.verdiendBij || 0) !== 0 && (
                  <span className="muted" style={{ fontSize: 12 }}>
                    (bijstelling {prog.verdiendBij > 0 ? '+' : ''}{euro(prog.verdiendBij)})
                  </span>
                )}
              </div>
              <div className="wrap" style={{ marginTop: 6, alignItems: 'center' }}>
                <span className="muted" style={{ fontSize: 12 }}>Weekbudget:</span>
                <button
                  type="button" className="btn ghost sm"
                  onClick={() => zetKind(pid, (pr) => ({
                    ...pr, weekbudget: Math.max(0, weekbudgetVan(pr) - 2.5),
                  }))}
                >−</button>
                <span style={{ fontWeight: 700, minWidth: 64, textAlign: 'center' }}>
                  {euro(weekbudgetVan(prog))}
                </span>
                <button
                  type="button" className="btn ghost sm"
                  onClick={() => zetKind(pid, (pr) => ({ ...pr, weekbudget: weekbudgetVan(pr) + 2.5 }))}
                >+</button>
              </div>
            </div>
          </div>
        )
      })}

      <div
        className="muted"
        style={{
          fontSize: 12, marginTop: 12, lineHeight: 1.5, paddingTop: 8,
          borderTop: '1px solid var(--line)',
        }}
      >
        💶 <b>Beloning naar resultaat &amp; niveau:</b> alleen 1e keer goed zónder hint telt, en{' '}
        <b>moeilijker = meer waard</b> (niveau 1/2/3 → 1/2/3 punten × €{' '}
        {String(BELONING.tariefPunt).replace('.', ',')}). Nauwkeurigheidspoort (≥ 85% vol tarief,
        ≥ 70% half, daaronder niets). Toetsbonus schaalt met de score. Dagplafond{' '}
        {euro(BELONING.dagMax)} en een <b>hard weekbudget per kind</b> — de app betaalt nooit meer
        uit dan dat.
      </div>
    </div>
  )
}

interface Formulier {
  p: string; v: string; t: string; lvl: string
  q: string; a: string; u: string; h1: string; h2: string; s: string
}

function Opgavenbeheer(
  { stand, zet }: { stand: Stand; zet: (verander: (s: Stand) => Stand) => void },
): ReactNode {
  const [form, zetForm] = useState<Formulier>({
    p: 'wassima', v: 'wiskunde', t: '', lvl: '1', q: '', a: '', u: '', h1: '', h2: '', s: '',
  })
  const [melding, zetMelding] = useState('')
  const [invoer, zetInvoer] = useState('')

  const vakken = PROFIELEN[form.p]?.vakken ?? []
  const bestaand = [...new Set(
    [...SEED, ...(stand.custom as unknown as Kaart[])]
      .filter((e) => e.p === form.p && e.v === form.v).map((e) => e.t))]

  function voegToe(): void {
    if (!form.q.trim() || !form.a.trim() || !form.t.trim()) {
      zetMelding('Vul minstens onderwerp, vraag en antwoord in.')
      return
    }
    const ex = {
      id: 'cust_' + Date.now(), p: form.p, v: form.v, t: form.t.trim(),
      lvl: Number(form.lvl) || 1, q: form.q.trim(), a: form.a.trim(),
      ...(form.u.trim() ? { u: form.u.trim() } : {}),
      h: [form.h1.trim(), form.h2.trim()].filter(Boolean),
      s: form.s.trim() || '(geen uitwerking toegevoegd)',
    }
    zet((s) => ({ ...s, custom: [...s.custom, ex] }))
    zetForm({ ...form, q: '', a: '', u: '', h1: '', h2: '', s: '' })
    zetMelding('✅ Opgave toegevoegd — staat meteen klaar voor ' + (PROFIELEN[form.p]?.naam ?? '') + '.')
    setTimeout(() => zetMelding(''), 2500)
  }

  return (
    <>
      <h2>Nieuwe opdracht toevoegen</h2>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="fld" htmlFor="fWie">Voor wie</label>
            <select
              className="f" id="fWie" value={form.p}
              onChange={(e) => {
                const pid = e.target.value
                zetForm({ ...form, p: pid, v: PROFIELEN[pid]?.vakken[0] ?? 'wiskunde' })
              }}
            >
              {Object.entries(PROFIELEN).map(([id, P]) => (
                <option key={id} value={id}>{P.naam} ({P.niveau})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="fld" htmlFor="fVak">Vak</label>
            <select
              className="f" id="fVak" value={form.v}
              onChange={(e) => zetForm({ ...form, v: e.target.value })}
            >
              {vakken.map((v) => <option key={v} value={v}>{VAKNAAM[v] ?? v}</option>)}
            </select>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div style={{ flex: 2 }}>
            <label className="fld" htmlFor="fOnd">Onderwerp</label>
            <input
              className="f" id="fOnd" list="tlist" value={form.t} placeholder="bijv. Procenten"
              onChange={(e) => zetForm({ ...form, t: e.target.value })}
            />
            <datalist id="tlist">{bestaand.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div style={{ flex: 1 }}>
            <label className="fld" htmlFor="fLvl">Niveau</label>
            <select
              className="f" id="fLvl" value={form.lvl}
              onChange={(e) => zetForm({ ...form, lvl: e.target.value })}
            >
              <option value="1">1 (makkelijk)</option>
              <option value="2">2 (middel)</option>
              <option value="3">3 (moeilijk)</option>
            </select>
          </div>
        </div>
        <label className="fld" htmlFor="fVraag">Vraag</label>
        <textarea
          className="f" id="fVraag" value={form.q} placeholder="Typ hier de opgave…"
          onChange={(e) => zetForm({ ...form, q: e.target.value })}
        />
        <div className="row" style={{ gap: 10 }}>
          <div style={{ flex: 2 }}>
            <label className="fld" htmlFor="fAntw">Antwoord</label>
            <input
              className="f" id="fAntw" value={form.a} placeholder="bijv. 30"
              onChange={(e) => zetForm({ ...form, a: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="fld" htmlFor="fEenh">Eenheid (optioneel)</label>
            <input
              className="f" id="fEenh" value={form.u} placeholder="bijv. cm²"
              onChange={(e) => zetForm({ ...form, u: e.target.value })}
            />
          </div>
        </div>
        <label className="fld" htmlFor="fH1">Hint 1 (optioneel)</label>
        <input
          className="f" id="fH1" value={form.h1}
          onChange={(e) => zetForm({ ...form, h1: e.target.value })}
        />
        <label className="fld" htmlFor="fH2">Hint 2 (optioneel)</label>
        <input
          className="f" id="fH2" value={form.h2}
          onChange={(e) => zetForm({ ...form, h2: e.target.value })}
        />
        <label className="fld" htmlFor="fUit">Uitwerking (stap voor stap)</label>
        <textarea
          className="f" id="fUit" value={form.s} placeholder="Laat de tussenstappen zien…"
          onChange={(e) => zetForm({ ...form, s: e.target.value })}
        />
        {melding && (
          <div style={{ marginTop: 12, fontWeight: 600, color: 'var(--primary-dark)' }}>{melding}</div>
        )}
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn" onClick={voegToe}>+ Opgave toevoegen</button>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Mijn toegevoegde opgaven ({stand.custom.length})</h3>
      <div style={{ marginTop: 10 }}>
        {stand.custom.length === 0 && <p className="muted">Nog niets toegevoegd.</p>}
        {(stand.custom as unknown as Kaart[]).map((e) => (
          <div key={e.id} className="exrow">
            <div className="grow" style={{ flex: 1 }}>
              <span className="tag">{PROFIELEN[e.p]?.naam ?? e.p}</span>{' '}
              <span className="tag">{VAKNAAM[e.v] ?? e.v}</span>{' '}
              <span className="tag">{e.t}</span>
              <div style={{ marginTop: 4 }}>{'q' in e ? e.q : ''}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                antwoord: {'a' in e ? e.a : ''} {'u' in e ? e.u ?? '' : ''}
              </div>
            </div>
            <button
              type="button" className="btn accent sm"
              onClick={() => zet((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== e.id) }))}
            >verwijder</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <b>Opslaan &amp; delen (back-up)</b>
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          De opgaven staan in deze browser. Exporteer ze om te bewaren of op het apparaat van je
          dochter te zetten.
        </p>
        <div className="wrap" style={{ marginTop: 8 }}>
          <button
            type="button" className="btn ghost sm"
            onClick={() => bewaarAls('oefeningen-export.json',
              JSON.stringify(stand.custom, null, 2), 'application/json')}
          >⬇️ Exporteer naar bestand</button>
        </div>
        <label className="fld" htmlFor="fImp">
          Importeren — plak hier een eerder geëxporteerde JSON
        </label>
        <textarea
          className="f" id="fImp" value={invoer} placeholder='[ {"p":"wassima", ...} ]'
          onChange={(e) => zetInvoer(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <button
            type="button" className="btn ghost sm" disabled={!invoer.trim()}
            onClick={() => {
              try {
                const arr = JSON.parse(invoer) as Array<Record<string, unknown> & { id: string }>
                if (!Array.isArray(arr)) throw new Error('geen lijst')
                zet((s) => ({ ...s, custom: [...s.custom, ...arr] }))
                zetInvoer('')
                zetMelding('✅ ' + arr.length + ' opgaven geïmporteerd.')
              } catch {
                zetMelding('Kon JSON niet lezen.')
              }
              setTimeout(() => zetMelding(''), 2500)
            }}
          >⬆️ Importeren</button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------ wat de kinderen vroegen */

/**
 * De vragen die de kinderen aan de vraagbaak stelden, nieuwste eerst.
 *
 * Dit is het enige scherm in de app dat vertelt wat er *ontbreekt*. Een vraag
 * waar niets voor gevonden werd is geen fout van het kind en ook niet van de
 * vraagbaak: het is stof die er nog niet is. Die staan daarom apart en bovenaan
 * — ze zijn de werklijst, opgeschreven door de kinderen zelf.
 */
export function Vragenpaneel(
  { stand, zet }: { stand: Stand; zet: (v: (s: Stand) => Stand) => void },
): ReactNode {
  const vragen = stand.vragen ?? []
  if (!vragen.length) return null
  const gaten = vragen.filter((v) => !v.raak.length)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b>💬 Wat de kinderen vroegen</b>
        <button
          type="button" className="btn ghost sm"
          onClick={() => zet((s) => ({ ...s, vragen: [] }))}
        >Lijst wissen</button>
      </div>

      {gaten.length > 0 && (
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          Bij <b>{gaten.length}</b> van de {vragen.length} vragen vond de app niets. Dat is de
          stof die nog gemaakt moet worden.
        </p>
      )}

      <div style={{ marginTop: 10 }}>
        {vragen.slice(0, 25).map((v, i) => {
          const naam = PROFIELEN[v.pid]?.naam ?? v.pid
          const emoji = PROFIELEN[v.pid]?.emoji ?? '❓'
          return (
            <div key={i} className={'vraagregel' + (v.raak.length ? '' : ' leeg')}>
              <div>
                <span className="wie">{emoji} {naam}</span>{' '}
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(v.tijd).toLocaleDateString('nl-NL',
                    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ marginTop: 2 }}>&ldquo;{v.vraag}&rdquo;</div>
              <div className="raak" style={{ marginTop: 2 }}>
                {v.raak.length
                  ? '→ ' + v.raak.join(' · ')
                  : <span><b>niets gevonden</b>{v.gat ? ' — ' + v.gat : ''}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------ hoe de kinderen leren */

/**
 * De leerscan per kind, voor de ouder.
 *
 * Wat hier bewust níét staat is een cijfer of een type. De scan meet gewoontes,
 * geen aanleg, en het nut zit in het gesprek dat erop volgt — vandaar dat er per
 * kind één ding uitspringt en niet vijf.
 *
 * En de waarschuwing eronder hoort erbij: een kind voelt welk antwoord braaf
 * klinkt. Wat er staat is wat het kind zegt te doen, en dat is een prima begin
 * van een gesprek maar geen meting.
 */
export function Leerscanpaneel({ stand }: { stand: Stand }): ReactNode {
  const rijen = Object.entries(PROFIELEN)
    .map(([pid, prof]) => ({ pid, prof, scan: schoonVoortgang(stand.prog[pid]).leerscan }))
  const ingevuld = rijen.filter((r) => isAf(r.scan ?? null))
  if (!ingevuld.length) return null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <b>🔎 Hoe de kinderen leren</b>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Uit de leerscan in de app. Dit gaat over gewoontes — wat een kind dóét — en niet over
        aanleg of een leertype.
      </p>
      {ingevuld.map(({ pid, prof, scan }) => {
        const a = advies(scan as NonNullable<typeof scan>)
        return (
          <div key={pid} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 700 }}>{prof.emoji} {prof.naam}</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>
              Grootste winst: <b>{a.kop.kaart.kop.toLowerCase()}</b>{' '}
              <span className="muted">({bandNaam(a.kop.band)})</span>
            </div>
            {a.sterk && (
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                Gaat al goed: {a.sterk.kaart.kop.toLowerCase()}
              </div>
            )}
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{a.kop.kaart.waarom}</div>
          </div>
        )
      })}
      <p className="muted" style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
        Een kind voelt welk antwoord braaf klinkt, dus lees dit als wat het zegt te doen. Het is
        een goede opening voor een gesprek, geen meting.
      </p>
    </div>
  )
}
