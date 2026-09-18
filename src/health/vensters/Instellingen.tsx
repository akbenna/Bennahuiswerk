/**
 * DRIE VENSTERS: profiel, importeren en account.
 * Overgezet uit vensterProfiel(), vensterImport() en vensterAccount().
 */
import { useState } from 'react'
import { Kaart, Keuzechip, Knop, Kop, Rij, Spin, Venster } from '../onderdelen/basis'
import { MEDICATIEGROEPEN } from '../conditie'
import type { Conditie, Medicatiegroep } from '../conditie'
import { dec, dz } from '@/gedeeld/getal'
import type { Fase, Geslacht, Profiel } from '@/gedeeld/db/tabellen'
import { isSessie, roep } from '@/gedeeld/db/rpc'
import type { NieuweDag, NieuweRegel } from '@/gedeeld/db/rpc'
import { importeer, leesFoto } from '../ai'
import { MINIMUM_LENGTE, wachtwoordklacht } from '../wachtwoord'
import type { ImportDag } from '../ai'


/* ----------------------------------------------------------------- profiel */

/**
 * WAT ER SPEELT — de conditie en de medicatiegroepen.
 *
 * Dit blok staat onderin het profielvenster en niet op een eigen tabblad. Dat
 * is een keuze: een aparte diabetesmodule naast een aparte hypertensiemodule
 * bouwt de ziektegebonden keten na waar de zorg juist vanaf wil, en de meeste
 * mensen in deze praktijk hebben meer dan één aandoening tegelijk. Eén profiel
 * dat schermen anders wéégt is iets anders dan een app die uitdijt.
 *
 * Het staat bewust ná de doelen: wie hier niets invult merkt er niets van, en
 * dat hoort ook zo. Leeg betekent "we weten het niet".
 */
function Conditieblok(
  { conditie, opZet }: { conditie: Conditie; opZet: (c: Conditie) => void },
) {
  const med = conditie.med ?? []
  const wissel = (g: Medicatiegroep) => opZet({
    ...conditie,
    med: med.includes(g) ? med.filter((x) => x !== g) : [...med, g],
  })
  const vink = (sleutel: 'hypertensie' | 'dm2' | 'hvz') => (aan: boolean) =>
    opZet({ ...conditie, [sleutel]: aan })

  const Vinkje = (
    { sleutel, naam }: { sleutel: 'hypertensie' | 'dm2' | 'hvz'; naam: string },
  ) => (
    <div className="regel">
      <div><b style={{ fontSize: '.87rem' }}>{naam}</b></div>
      <input type="checkbox" checked={!!conditie[sleutel]} style={{ width: 19, height: 19 }}
             onChange={(e) => vink(sleutel)(e.target.checked)} />
    </div>
  )

  return (
    <>
      <div className="tussen" style={{ marginTop: 16 }}>Wat er bij jou speelt</div>
      <div className="mini" style={{ marginBottom: 6 }}>
        Vul dit alleen in als het klopt. De app gaat er niets anders van rekenen — hij wijst je op
        dingen die bij deze middelen horen als je afvalt.
      </div>

      <Vinkje sleutel="hypertensie" naam="Hoge bloeddruk, of daarvoor behandeld" />
      <Vinkje sleutel="dm2" naam="Diabetes type 2" />
      <Vinkje sleutel="hvz" naam="Hart- of vaatziekte gehad" />

      <div className="regel" style={{ display: 'block' }}>
        <div><b style={{ fontSize: '.87rem' }}>Welke medicijnen gebruik je?</b></div>
        <div className="mini" style={{ marginBottom: 8 }}>
          Groepen, geen merken. Weet je het niet zeker, laat het dan leeg en vraag het na bij je
          praktijkondersteuner.
        </div>
        <Rij style={{ gap: 6, flexWrap: 'wrap' }}>
          {MEDICATIEGROEPEN.map((m) => (
            <Keuzechip key={m.groep} aan={med.includes(m.groep)} titel={m.voorbeeld}
                       opKlik={() => wissel(m.groep)}>
              {m.naam}
            </Keuzechip>
          ))}
        </Rij>
        <div className="mini" style={{ marginTop: 8 }}>
          Dit is jouw opgave en geen medicatieoverzicht uit de praktijk.
        </div>
      </div>
    </>
  )
}



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

      <Conditieblok conditie={i.conditie ?? {}} opZet={(c) => zetI('conditie', c)} />

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
      {/* Dezelfde onwaarheid als onder het aanmeldscherm stond, en die heb ik
          daar wél rechtgezet en hier niet. Twee plekken die hetzelfde zeggen en
          los van elkaar bijgewerkt worden — precies het patroon waar dit
          project elders variabelen voor gebruikt. Hier kan dat niet: het zijn
          twee verschillende zinnen in twee verschillende schermen. */}
      <p className="klein" style={{ marginTop: 8 }}>
        Aangemeld als <b>{account}</b>. De sessie blijft dertig dagen staan. Je gegevens staan in de
        eigen database van BennaHub, los van de zorggegevens van de praktijk, en zijn alleen via
        beveiligde databasefuncties met dit wachtwoord bereikbaar.
      </p>
      <WachtwoordWijzigen />
      <Herstelcode />
      <Rij style={{ marginTop: 14 }}>
        <Knop opKlik={opAfmelden}>Afmelden</Knop>
      </Rij>
    </Venster>
  )
}

/**
 * JE WACHTWOORD WIJZIGEN
 *
 * `kal_ww_wijzigen` bestond al sinds bestand 33 en stond zelfs getypeerd in
 * rpc.ts, maar werd nergens aangeroepen: de enige weg naar een nieuw wachtwoord
 * was de herstelcode. Zolang de eis acht tekens was viel dat niet op. Nu de eis
 * twaalf is, is het een gat: wie een oud wachtwoord van acht tekens heeft komt
 * er wel mee binnen, maar had geen enkele manier om het te vervangen. Een
 * strengere lat zonder ladder is geen strengere lat maar een klem.
 *
 * Het oude wachtwoord wordt gevraagd en dat is geen formaliteit: een token ligt
 * dertig dagen in localStorage, en wie dat steelt mag daarmee niet het slot
 * kunnen vervangen.
 *
 * Alle sessies vliegen eruit, ook dit toestel. Dat doet de database al; wat hier
 * gebeurt is het nieuwe token opvangen, want zonder dat zou je jezelf uitloggen.
 */
function WachtwoordWijzigen() {
  const [open, zetOpen] = useState(false)
  const [oud, zetOud] = useState('')
  const [nieuw, zetNieuw] = useState('')
  const [fout, zetFout] = useState<string | null>(null)
  const [klaar, zetKlaar] = useState(false)
  const [bezig, zetBezig] = useState(false)

  const klacht = wachtwoordklacht(nieuw)
  const kan = oud !== '' && nieuw !== '' && klacht === null

  const wijzig = async () => {
    zetBezig(true)
    zetFout(null)
    try {
      const s = JSON.parse(localStorage.getItem('kalibratie.sessie') ?? 'null') as
        { token?: string } | null
      if (!s?.token) { zetFout('Je bent niet aangemeld'); return }
      const uit = await roep('kal_ww_wijzigen', { p_token: s.token, p_oud: oud, p_nieuw: nieuw })
      if (!isSessie(uit)) { zetFout(uit.fout); return }
      /* Het nieuwe token moet hier opgeslagen worden: de database heeft zojuist
         álle sessies weggegooid, dus het token in localStorage is dood. */
      try { localStorage.setItem('kalibratie.sessie', JSON.stringify(uit)) } catch { /* mag falen */ }
      zetOud(''); zetNieuw(''); zetKlaar(true); zetOpen(false)
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (klaar && !open) {
    return (
      <p className="mini" style={{ marginTop: 14 }}>
        Je wachtwoord is gewijzigd. Andere toestellen die nog openstonden zijn afgemeld.
      </p>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <p className="mini">
          <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
            Wachtwoord wijzigen
          </button>
          {` — minstens ${MINIMUM_LENGTE} tekens.`}
        </p>
      ) : (
        <>
          <label className="veld">
            <span>je huidige wachtwoord</span>
            <input type="password" autoComplete="current-password" value={oud}
                   onChange={(e) => zetOud(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>nieuw wachtwoord</span>
            <input type="password" autoComplete="new-password" value={nieuw}
                   onChange={(e) => zetNieuw(e.target.value)} />
          </label>
          {/* Wat er mis is staat er terwijl je typt en niet pas na een klik: een
              eis die je pas leert kennen als je hem overtreedt is een valstrik.
              Bij een leeg veld staat er wat er wél moet. */}
          <p className="klein" style={{ marginTop: 8, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</>
              : fout ?? (nieuw === '' ? `Minstens ${MINIMUM_LENGTE} tekens.`
                : klacht ?? 'Dit kan ermee door.')}
          </p>
          <Rij>
            <Knop vol uit={!kan || bezig} opKlik={() => void wijzig()}>Wijzigen</Knop>
            <Knop uit={bezig}
                  opKlik={() => { zetOpen(false); zetOud(''); zetNieuw(''); zetFout(null) }}>
              Laat maar
            </Knop>
          </Rij>
        </>
      )}
    </div>
  )
}

/**
 * EEN HERSTELCODE MAKEN
 *
 * Zonder deze code is er geen weg terug als je je wachtwoord kwijt bent — er is
 * geen e-mail in deze app en dus geen herstelmail. Waarom dat zo is staat in
 * `health/database/33-wachtwoord-kwijt.sql`.
 *
 * Het wachtwoord wordt hier opnieuw gevraagd, en dat is geen hinder maar het
 * punt: een token ligt dertig dagen in localStorage, en wie dat steelt mag
 * daarmee geen blijvende ingang kunnen maken.
 *
 * De code staat maar één keer op het scherm. Hij wordt gehasht opgeslagen, dus
 * ook de database kan hem daarna niet meer tonen.
 */
function Herstelcode() {
  const [open, zetOpen] = useState(false)
  const [ww, zetWw] = useState('')
  const [code, zetCode] = useState<string | null>(null)
  const [fout, zetFout] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  const maak = async () => {
    zetBezig(true)
    zetFout(null)
    try {
      const s = JSON.parse(localStorage.getItem('kalibratie.sessie') ?? 'null') as
        { token?: string } | null
      if (!s?.token) { zetFout('Je bent niet aangemeld'); return }
      const uit = await roep('kal_herstelcode_maken', { p_token: s.token, p_ww: ww })
      if ('fout' in uit) { zetFout(uit.fout); return }
      zetCode(uit.code)
      zetWw('')
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
    } finally {
      zetBezig(false)
    }
  }

  if (code) {
    return (
      <div className="kaart" style={{ marginTop: 14 }}>
        <Kop>Schrijf deze code op</Kop>
        <p className="getal" style={{ fontSize: '1.15rem', marginTop: 8, letterSpacing: '.02em' }}>
          {code}
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Hij staat hier één keer. Bewaar hem ergens waar je hem terugvindt zonder deze app — op
          papier, of in je wachtwoordbeheerder. Hij werkt één keer; daarna maak je een nieuwe.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <p className="mini">
          <button type="button" className="alsLink" onClick={() => zetOpen(true)}>
            Herstelcode maken
          </button>
          {' '}— nodig als je ooit je wachtwoord kwijt bent.
        </p>
      ) : (
        <>
          <label className="veld">
            <span>je wachtwoord, nog één keer</span>
            <input type="password" autoComplete="current-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          <p className="klein" style={{ marginTop: 8, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</> : fout}
          </p>
          <Rij>
            <Knop vol uit={ww === '' || bezig} opKlik={() => void maak()}>Code maken</Knop>
            <Knop uit={bezig} opKlik={() => { zetOpen(false); zetWw(''); zetFout(null) }}>
              Laat maar
            </Knop>
          </Rij>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ aanmelden --- */

export function Aanmelden(
  { bezig, fout, opAanmelden, opHerstellen }:
  { bezig: boolean; fout: string | null
    opAanmelden: (a: string, w: string, nieuw: boolean) => void
    opHerstellen: (a: string, code: string, nieuw: string) => void },
) {
  const [account, zetAccount] = useState('')
  const [ww, zetWw] = useState('')
  /* De herstelweg staat achter een schakelaar en niet naast het gewone veld:
     wie gewoon inlogt hoort er niet over te struikelen, en wie hem nodig heeft
     zoekt ernaar. */
  const [kwijt, zetKwijt] = useState(false)
  const [code, zetCode] = useState('')
  /* AANMELDEN EN EEN WACHTWOORD ZETTEN ZIJN TWEE VERSCHILLENDE EISEN
     Wie aanmeldt mag alles intikken: wat hij heeft is wat hij heeft, ook als dat
     acht tekens uit 2024 zijn. De regel geldt alleen waar een wachtwoord gezet
     wordt — bij een nieuw account en bij herstellen. Zou hij ook op de
     aanmeldknop staan, dan sloot een strengere regel met terugwerkende kracht
     mensen buiten uit hun eigen gegevens. */
  const kan = account.trim() !== '' && ww !== ''
  const klachtNieuw = wachtwoordklacht(ww, account.trim())
  const kanNieuw = kan && klachtNieuw === null
  const kanHerstel = account.trim() !== '' && code.trim() !== ''
    && wachtwoordklacht(ww, account.trim()) === null

  if (kwijt) {
    return (
      <>
        <header>
          <h1>Wachtwoord kwijt</h1>
          <p className="sub">
            Met je herstelcode zet je een nieuw wachtwoord. De code werkt één keer; daarna maak je
            een nieuwe in je account.
          </p>
        </header>
        <Kaart style={{ marginTop: 18 }}>
          <label className="veld">
            <span>naam</span>
            <input autoComplete="username" autoCapitalize="none" value={account}
                   onChange={(e) => zetAccount(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>herstelcode</span>
            <input autoCapitalize="characters" spellCheck={false} value={code}
                   placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                   onChange={(e) => zetCode(e.target.value)} />
          </label>
          <label className="veld" style={{ marginTop: 10 }}>
            <span>nieuw wachtwoord</span>
            <input type="password" autoComplete="new-password" value={ww}
                   onChange={(e) => zetWw(e.target.value)} />
          </label>
          <p className="klein" style={{ marginTop: 10, minHeight: '1.3em' }}>
            {bezig ? <><Spin /> Bezig…</>
              : fout ?? (ww === '' ? `Minstens ${MINIMUM_LENGTE} tekens.`
                : wachtwoordklacht(ww, account.trim()) ?? 'Dit kan ermee door.')}
          </p>
          <Rij style={{ marginTop: 6 }}>
            <Knop vol uit={!kanHerstel || bezig}
                  opKlik={() => opHerstellen(account.trim().toLowerCase(), code.trim(), ww)}>
              Nieuw wachtwoord zetten
            </Knop>
            <Knop uit={bezig} opKlik={() => { zetKwijt(false); zetCode(''); zetWw('') }}>
              Terug
            </Knop>
          </Rij>
        </Kaart>
      </>
    )
  }

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
        {/* De klacht staat er alleen als je er iets aan kunt doen. Bij een leeg
            veld en tijdens het aanmelden zou hij afleiden van de echte fout, en
            wie gewoon inlogt gaat de regel niets aan. */}
        <p className="klein" style={{ marginTop: 10, minHeight: '1.3em' }}>
          {bezig ? <><Spin /> Bezig…</> : fout ?? (ww !== '' && klachtNieuw
            ? <span className="mini">Voor een nieuw account: {klachtNieuw.toLowerCase()}</span>
            : null)}
        </p>
        <Rij style={{ marginTop: 6 }}>
          <Knop vol uit={!kan || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, false)}>
            Aanmelden
          </Knop>
          <Knop uit={!kanNieuw || bezig}
                opKlik={() => opAanmelden(account.trim().toLowerCase(), ww, true)}>
            Nieuw account
          </Knop>
        </Rij>
        <p className="mini" style={{ marginTop: 12 }}>
          <button type="button" className="alsLink" onClick={() => { zetKwijt(true); zetWw('') }}>
            Wachtwoord kwijt?
          </button>
        </p>
      </Kaart>
      {/* Hier stond dat de gegevens in het project van ProVita staan, naast de
          patiëntgegevens. Dat klopte tot 26 augustus 2026 en daarna niet meer:
          op die dag is BennaHub naar een eigen database verhuisd, en de
          aanleiding voor die verhuizing was juist dat gezinsgegevens en
          zorggegevens één back-up en één blusgebied deelden. Een scherm dat de
          oude situatie blijft beschrijven maakt precies de belofte die toen is
          rechtgezet. Zie `SUPABASE-scheiding.md`. */}
      <p className="mini">
        Je gegevens staan in de eigen database van BennaHub, los van de zorggegevens van de praktijk.
        Geen enkele tabel is publiek benaderbaar; toegang loopt via beveiligde databasefuncties en het
        wachtwoord staat gehasht.
      </p>
    </>
  )
}
