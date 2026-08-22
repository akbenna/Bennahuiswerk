/**
 * DRIE VENSTERS: profiel, importeren en account.
 * Overgezet uit vensterProfiel(), vensterImport() en vensterAccount().
 */
import { useState } from 'react'
import { Kaart, Knop, Rij, Spin, Venster } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import type { Fase, Geslacht, Profiel } from '@/gedeeld/db/tabellen'
import type { NieuweDag, NieuweRegel } from '@/gedeeld/db/rpc'
import { importeer, leesFoto } from '../ai'
import type { ImportDag } from '../ai'

/* ----------------------------------------------------------------- profiel */

export function ProfielVenster(
  { profiel, opSluiten, opBewaren }:
  { profiel: Profiel; opSluiten: () => void; opBewaren: (p: Partial<Profiel>) => void },
) {
  const [p, zetP] = useState<Profiel>(profiel)
  const i = p.instellingen

  const getal = (v: string): number | null => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  const zet = <K extends keyof Profiel>(sleutel: K, waarde: Profiel[K]) =>
    zetP((oud) => ({ ...oud, [sleutel]: waarde }))
  const zetI = <K extends keyof Profiel['instellingen']>(
    sleutel: K, waarde: Profiel['instellingen'][K],
  ) => zetP((oud) => ({ ...oud, instellingen: { ...oud.instellingen, [sleutel]: waarde } }))

  const Nummer = (
    { waarde, opZet, breed }:
    { waarde: number | null | undefined; opZet: (n: number | null) => void; breed?: boolean },
  ) => (
    <input className={breed ? 'smal' : 'smaller'} type="number" step="any"
           value={waarde ?? ''} onChange={(e) => opZet(getal(e.target.value))} />
  )

  return (
    <Venster titel="Profiel en doelen" opSluiten={opSluiten}>
      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Lengte, leeftijd, geslacht</b></div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.lengte_cm} opZet={(n) => zet('lengte_cm', n ?? 0)} />
          <Nummer waarde={p.leeftijd_jaar} opZet={(n) => zet('leeftijd_jaar', n)} />
          <select value={p.geslacht} style={{ width: 'auto' }}
                  onChange={(e) => zet('geslacht', e.target.value as Geslacht)}>
            <option value="m">m</option><option value="v">v</option>
          </select>
        </Rij>
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Doelgewicht</b></div>
        <Nummer waarde={p.doel_gewicht_kg} opZet={(n) => zet('doel_gewicht_kg', n)} />
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Streeftempo</b>
          <div className="mini">
            Procent lichaamsgewicht per week. Boven 1,0 gaat het ten koste van vetvrije massa; 0,5 tot
            1,0 is de band.
          </div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.tempo_pct_week} opZet={(n) => zet('tempo_pct_week', n ?? 0)} />
          <span className="mini">%/wk</span>
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Eiwitdoel</b>
          <div className="mini">
            Gram per kilo <i>gecorrigeerd</i> gewicht, met plafond op BMI 30. 1,2 tot 1,5 tijdens
            energierestrictie.
          </div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={p.eiwit_g_per_kg} opZet={(n) => zet('eiwit_g_per_kg', n ?? 0)} />
          <span className="mini">g/kg</span>
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Olijfolie in de saladebereiding</b>
          <div className="mini">De grootste onzekerheid van de dag. Weeg één keer.</div>
        </div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={i.olie_g ?? null} opZet={(n) => zetI('olie_g', n ?? undefined)} />
          <span className="mini">g</span>
          <input type="checkbox" checked={!!i.olie_gewogen} style={{ width: 19, height: 19 }}
                 onChange={(e) => zetI('olie_gewogen', e.target.checked)} />
        </Rij>
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Melk per cappuccino</b></div>
        <Rij style={{ gap: 5 }}>
          <Nummer waarde={i.melk_ml ?? null} opZet={(n) => zetI('melk_ml', n ?? undefined)} />
          <select value={i.melk_soort ?? 'half'} style={{ width: 'auto' }}
                  onChange={(e) => zetI('melk_soort', e.target.value as 'mager' | 'half' | 'vol')}>
            <option value="mager">mager</option>
            <option value="half">halfvol</option>
            <option value="vol">vol</option>
          </select>
          <input type="checkbox" checked={!!i.melk_gemeten} style={{ width: 19, height: 19 }}
                 onChange={(e) => zetI('melk_gemeten', e.target.checked)} />
        </Rij>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Rookt</b>
          <div className="mini">Invoer voor SCORE2.</div>
        </div>
        <input type="checkbox" checked={!!i.rookt} style={{ width: 19, height: 19 }}
               onChange={(e) => zetI('rookt', e.target.checked)} />
      </div>

      <div className="regel">
        <div><b style={{ fontSize: '.87rem' }}>Fase</b></div>
        <select value={p.fase} style={{ width: 'auto' }}
                onChange={(e) => zet('fase', e.target.value as Fase)}>
          <option value="afvallen">afvallen</option>
          <option value="onderhoud">onderhoud</option>
          <option value="pauze">pauze</option>
        </select>
      </div>

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Basisgewicht onderhoud</b>
          <div className="mini">Het laagste stabiele gewicht; de zones rekenen hiervandaan.</div>
        </div>
        <Nummer waarde={p.onderhoud_basis_kg} opZet={(n) => zet('onderhoud_basis_kg', n)} />
      </div>

      <Rij style={{ marginTop: 14 }}>
        <Knop vol opKlik={() => opBewaren(p)}>Bewaren</Knop>
        <Knop opKlik={opSluiten}>Annuleren</Knop>
      </Rij>
    </Venster>
  )
}

/* --------------------------------------------------------------- importeren */

export function ImportVenster(
  { token, opSluiten, opOvernemen }:
  {
    token: string
    opSluiten: () => void
    opOvernemen: (dagen: NieuweDag[], regels: NieuweRegel[]) => void
  },
) {
  const [tekst, zetTekst] = useState('')
  const [fotos, zetFotos] = useState<Awaited<ReturnType<typeof leesFoto>>[]>([])
  const [melding, zetMelding] = useState<string | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [concept, zetConcept] = useState<ImportDag[] | null>(null)

  async function uitlezen() {
    zetLoopt(true)
    zetMelding(null)
    try {
      const uit = await importeer(token, tekst, fotos)
      zetConcept(uit.dagen)
      zetMelding(`${uit.dagen.length} dagen gevonden.`)
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  function overnemen() {
    if (!concept) return
    const dagen: NieuweDag[] = concept
      .filter((d) => d.gewicht_kg != null || d.stappen != null || d.actieve_energie_kcal != null)
      .map((d) => ({
        datum: d.datum,
        ...(d.gewicht_kg != null ? { gewicht_kg: d.gewicht_kg } : {}),
        ...(d.stappen != null ? { stappen: d.stappen } : {}),
        ...(d.actieve_energie_kcal != null ? { actieve_energie_kcal: d.actieve_energie_kcal } : {}),
        bron: 'import',
      }))
    const regels: NieuweRegel[] = concept
      .filter((d): d is ImportDag & { kcal: number } => d.kcal != null && d.kcal > 0)
      .map((d) => ({
        datum: d.datum, naam: 'Dagtotaal, geïmporteerd', kcal_punt: d.kcal,
        kcal_laag: Math.round(d.kcal * 0.85), kcal_hoog: Math.round(d.kcal * 1.45),
        eiwit_g: d.eiwit_g, vet_g: d.vet_g, koolhydraat_g: d.koolhydraat_g,
        conf: 'D', bron: 'import',
        onzekerheidsbronnen: [
          'dagtotaal uit een andere app, niet per product terug te rekenen',
          'bovengrens ruim genomen wegens de gebruikelijke onderregistratie',
        ],
      }))
    opOvernemen(dagen, regels)
  }

  return (
    <Venster titel="Importeren" opSluiten={opSluiten}>
      <p className="klein" style={{ marginTop: 8 }}>
        Plak tekst uit Yazio of Apple Gezondheid, of stuur schermafdrukken mee. Er wordt alleen
        overgenomen wat er werkelijk staat; gaten worden niet opgevuld.
      </p>
      <textarea style={{ marginTop: 10, minHeight: 120 }} value={tekst}
                onChange={(e) => zetTekst(e.target.value)}
                placeholder={'20 augustus 2026    1.319 kcal\n19 augustus 2026    1.481 kcal\n…'} />
      <Rij style={{ marginTop: 8 }}>
        <label className="knop" style={{ cursor: 'pointer' }}>
          Schermafdrukken kiezen
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                 onChange={async (e) => {
                   const lijst = [...(e.target.files ?? [])].slice(0, 8)
                   zetFotos(await Promise.all(lijst.map(leesFoto)))
                 }} />
        </label>
        {fotos.length > 0 && (
          <span className="mini">
            {fotos.length} afbeelding{fotos.length === 1 ? '' : 'en'} klaar
          </span>
        )}
      </Rij>
      <p className="klein" style={{ marginTop: 8, minHeight: '1.2em' }}>
        {loopt ? <><Spin /> Uitlezen…</> : melding}
      </p>

      {concept && concept.length > 0 && (
        <>
          <div className="lijst" style={{ marginTop: 8, maxHeight: 230, overflow: 'auto' }}>
            {concept.map((d) => (
              <div key={d.datum}>
                <span className="cijfer mini groei">{d.datum}</span>
                <span className="cijfer mini">
                  {d.kcal != null && `${dz(d.kcal)} kcal`}
                  {d.eiwit_g != null && ` · ${dec(d.eiwit_g, 0)} g eiwit`}
                  {d.stappen != null && ` · ${dz(d.stappen)} stappen`}
                  {d.gewicht_kg != null && ` · ${dec(d.gewicht_kg, 1)} kg`}
                </span>
              </div>
            ))}
          </div>
          <Rij style={{ marginTop: 8 }}>
            <Knop vol opKlik={overnemen}>Overnemen</Knop>
          </Rij>
        </>
      )}

      {!concept && (
        <Rij style={{ marginTop: 10 }}>
          <Knop vol uit={loopt} opKlik={() => void uitlezen()}>Uitlezen</Knop>
        </Rij>
      )}
    </Venster>
  )
}

/* ----------------------------------------------------------------- account */

export function AccountVenster(
  { account, opSluiten, opAfmelden }:
  { account: string; opSluiten: () => void; opAfmelden: () => void },
) {
  return (
    <Venster titel="Account" opSluiten={opSluiten}>
      <p className="klein" style={{ marginTop: 8 }}>
        Aangemeld als <b>{account}</b>. De sessie blijft dertig dagen staan. Je gegevens staan in eigen
        tabellen in het Supabase-project van ProVita, afgescheiden van de patiëntgegevens, en zijn
        alleen via beveiligde databasefuncties met dit wachtwoord bereikbaar.
      </p>
      <Rij style={{ marginTop: 14 }}>
        <Knop opKlik={opAfmelden}>Afmelden</Knop>
      </Rij>
    </Venster>
  )
}

/* ------------------------------------------------------------ aanmelden --- */

export function Aanmelden(
  { bezig, fout, opAanmelden }:
  { bezig: boolean; fout: string | null; opAanmelden: (a: string, w: string, nieuw: boolean) => void },
) {
  const [account, zetAccount] = useState('')
  const [ww, zetWw] = useState('')
  const kan = account.trim() !== '' && ww !== ''

  return (
    <>
      <header>
        <h1>BennaHealth</h1>
        <p className="sub">
          Persoonlijk energiebalansmodel. Het verbruik wordt gemeten uit de gewichtstrend in plaats van
          geschat uit een formule.
        </p>
      </header>
      <Kaart style={{ marginTop: 18 }}>
        <label className="veld">
          <span>naam</span>
          <input autoComplete="username" autoCapitalize="none" value={account}
                 onChange={(e) => zetAccount(e.target.value)} />
        </label>
        <label className="veld" style={{ marginTop: 10 }}>
          <span>wachtwoord</span>
          <input type="password" autoComplete="current-password" value={ww}
                 onChange={(e) => zetWw(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && kan) opAanmelden(account.trim().toLowerCase(), ww, false)
                 }} />
        </label>
        <p className="klein" style={{ marginTop: 10, minHeight: '1.3em' }}>
          {bezig ? <><Spin /> Bezig…</> : fout}
        </p>
        <Rij style={{ marginTop: 6 }}>
          <Knop vol uit={!kan || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, false)}>
            Aanmelden
          </Knop>
          <Knop uit={!kan || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, true)}>
            Nieuw account
          </Knop>
        </Rij>
      </Kaart>
      <p className="mini">
        De gegevens staan in je eigen tabellen in het Supabase-project van ProVita, afgescheiden van de
        patiëntgegevens. Geen enkele tabel is publiek benaderbaar; toegang loopt via beveiligde
        databasefuncties en het wachtwoord staat gehasht.
      </p>
    </>
  )
}
