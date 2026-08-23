/**
 * HET INVOERVEL — alles wat met eten loggen te maken heeft, op één plek.
 *
 * Hoe het was: het tekstvak stond op Vandaag, het zoeken op Voeding, de porties
 * in een derde venster. Wie zijn lunch wilde loggen wisselde van tabblad, zocht,
 * koos een portie, kwam terug op Voeding en moest zelf terug naar Vandaag om te
 * zien wat het gedaan had. Vier of vijf handelingen voor iets wat je drie keer
 * per dag doet, elke dag.
 *
 * Hoe het nu is: één vel dat opengaat vanaf het maaltijdvak dat je aantikt. Het
 * moment staat er al goed in, en het eerste dat je ziet is niet een leeg
 * zoekveld maar wat je zelf al eens gegeten hebt — met één tik erop staat het
 * erin. Zoeken kan in hetzelfde vel, beschrijven ook, en het vel blijft open
 * zodat een maaltijd van drie dingen drie tikken is en geen drie keer opnieuw
 * beginnen.
 *
 * Wat het bewust níét doet is zelf opslaan zonder dat je het gezien hebt. De
 * suggesties nemen de portie van de vorige keer over en zeggen dat er ook bij;
 * de herkenning legt haar concept eerst voor. Snel is niet hetzelfde als
 * ongezien.
 */
import { useEffect, useRef, useState } from 'react'
import { Chip, Kaart, Keuzechip, Knop, Kop, Rij, Spin, Tussen, Venster } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL } from '@/gedeeld/datum'
import { roep } from '@/gedeeld/db/rpc'
import type { NieuweRegel, Zoekuitslag } from '@/gedeeld/db/rpc'
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import { herhaalRegel, herhalingen, laatsteMaaltijd } from '../herhaal'
import type { Herhaling, Lijstsoort } from '../herhaal'
import { herken, leesFoto } from '../ai'
import type { Herkenning } from '../ai'
import type { Onderwerp } from './Portie'

/** De vier momenten waar je uit kiest, in de volgorde van de dag. */
export const MOMENTKEUZE: Array<{ id: Moment; naam: string; klas: string }> = [
  { id: 'ontbijt', naam: 'Ontbijt', klas: 'ochtend' },
  { id: 'lunch', naam: 'Lunch', klas: 'middag' },
  { id: 'diner', naam: 'Diner', klas: 'avond' },
  { id: 'tussendoor', naam: 'Tussendoor', klas: 'tussen' },
]

/* De handjevol dingen die vrijwel elke dag terugkomen, voor wie nog geen
   geschiedenis heeft. Ze vullen het beschrijfvak in plaats van meteen op te
   slaan: bij een nieuwe gebruiker weet de app nog niet wat een cappuccino bij
   hém is. */
const SNELLE = [
  { ico: '☕', naam: 'Koffie', tekst: 'een cappuccino' },
  { ico: '🍞', naam: 'Brood', tekst: 'twee bruine boterhammen met kaas' },
  { ico: '🥜', naam: 'Handje', tekst: 'een handje ongezouten noten' },
]

export interface InvoerEigenschappen {
  datum: IsoDatum
  token: string
  startMoment: Moment
  /** Alle regels, niet alleen die van vandaag: de suggesties komen eruit. */
  regels: Regel[]
  opPortie: (o: Onderwerp, moment: Moment) => void
  voegRegelsToe: (r: NieuweRegel[]) => void
  opSluiten: () => void
}

/**
 * Waar het vel op opent.
 *
 * Voor vandaag raadt de klok het moment. Voor een oudere dag zegt de klok
 * niets, en dan is het eerste vak dat nog leeg staat de beste gok — dat is
 * doorgaans precies wat je komt aanvullen.
 */
function beginMoment(start: Moment, regels: Regel[], datum: IsoDatum): Moment {
  if (start !== 'onbekend') return start
  const vanDieDag = regels.filter((r) => r.datum === datum)
  const leeg = MOMENTKEUZE.find((m) => !vanDieDag.some((r) => r.moment === m.id))
  return leeg?.id ?? 'tussendoor'
}

export function InvoerVenster(p: InvoerEigenschappen) {
  const [moment, zetMoment] = useState<Moment>(
    () => beginMoment(p.startMoment, p.regels, p.datum))
  const [soort, zetSoort] = useState<Lijstsoort>('vaak')
  const [term, zetTerm] = useState('')
  /* Wat er in dit vel is toegevoegd. Het vel blijft open, dus zonder deze regel
     zie je niet of je tik is aangekomen — en tik je hem nog een keer. */
  const [gedaan, zetGedaan] = useState<string[]>([])

  const zoekt = term.trim().length >= 2
  const suggesties = herhalingen(p.regels, { nu: p.datum, soort, moment, max: 10 })
  const maaltijd = laatsteMaaltijd(p.regels, moment, p.datum, p.datum)

  function voegToe(regels: NieuweRegel[], namen: string[]) {
    p.voegRegelsToe(regels)
    zetGedaan((g) => [...g, ...namen])
  }

  return (
    <Venster titel="Wat heb je gegeten?" opSluiten={p.opSluiten}
             onder={
               <div className="momentkeuze">
                 {MOMENTKEUZE.map((m) => (
                   <button type="button" key={m.id} className={'momentchip ' + m.klas
                     + (m.id === moment ? ' aan' : '')}
                           aria-pressed={m.id === moment}
                           onClick={() => zetMoment(m.id)}>
                     <span className="stip" />{m.naam}
                   </button>
                 ))}
               </div>
             }>

      <div className="zoekvak" style={{ marginTop: 12 }}>
        <span aria-hidden="true">🔎</span>
        <input placeholder="zoek in NEVO, gerechten en je eigen producten" autoComplete="off"
               aria-label="Zoeken" value={term} onChange={(e) => zetTerm(e.target.value)} />
      </div>

      {/* De bevestiging staat vlak onder het zoekveld en niet onderaan. Je tikt
          een plus midden in een lijst; een melding onder aan een vel dat je moet
          scrollen zie je niet, en dan tik je nog een keer. */}
      {gedaan.length > 0 && (
        <Kaart toon="goed" style={{ marginTop: 10, marginBottom: 0 }}>
          <Tussen>
            <span style={{ fontSize: '.86rem' }}>
              ✓ {gedaan.length} toegevoegd aan je{' '}
              {MOMENTKEUZE.find((m) => m.id === moment)?.naam.toLowerCase()}
              <span className="mini" style={{ display: 'block' }}>{gedaan.join(', ')}</span>
            </span>
            <Knop vol opKlik={p.opSluiten}>Klaar</Knop>
          </Tussen>
        </Kaart>
      )}

      {zoekt
        ? <Zoekvangst token={p.token} term={term} opKies={(o) => p.opPortie(o, moment)} />
        : (
          <>
            {maaltijd && (
              <button type="button" className="hoofdknop breed" style={{ marginTop: 12 }}
                      onClick={() => voegToe(
                        maaltijd.regels.map((r) => herhaalRegel(
                          { sleutel: '', naam: r.naam, aantal: 1, laatst: r.datum, moment, regel: r },
                          p.datum, moment)),
                        maaltijd.regels.map((r) => r.naam))}>
                <span aria-hidden="true">↺</span>
                <span>
                  Neem je {MOMENTKEUZE.find((m) => m.id === moment)?.naam.toLowerCase()} van{' '}
                  {kortNL(maaltijd.datum)} over
                  <span className="hoofdknopsub">
                    {maaltijd.regels.length} regels · {dz(Math.round(maaltijd.kcal))} kcal
                  </span>
                </span>
              </button>
            )}

            <Tussen style={{ marginTop: 16 }}>
              <Kop>Wat je al eens at</Kop>
              <Rij>
                <Keuzechip aan={soort === 'vaak'} opKlik={() => zetSoort('vaak')}>Vaak</Keuzechip>
                <Keuzechip aan={soort === 'recent'} opKlik={() => zetSoort('recent')}>Recent</Keuzechip>
              </Rij>
            </Tussen>

            {suggesties.length === 0 ? (
              <p className="klein" style={{ marginTop: 8 }}>
                Nog niets om te herhalen. Zoek hierboven, of beschrijf het hieronder in gewone taal —
                vanaf de tweede keer staat het hier en is het één tik.
              </p>
            ) : (
              <div className="lijst" style={{ marginTop: 6 }}>
                {suggesties.map((h) => (
                  <Suggestie key={h.sleutel} h={h} moment={moment} gedaan={gedaan.includes(h.naam)}
                             opKies={() => voegToe([herhaalRegel(h, p.datum, moment)], [h.naam])} />
                ))}
              </div>
            )}

            <Beschrijven token={p.token} datum={p.datum} moment={moment}
                         opToevoegen={(r, n) => voegToe(r, n)} />
          </>
        )}

    </Venster>
  )
}

/**
 * Eén suggestie: naam, wat het de vorige keer was, en een tik om het te doen.
 *
 * De onderregel is kort gehouden. Hij stond er eerst voluit — "28× gelogd,
 * laatst 22 aug (meestal ontbijt)" — en liep dan over twee regels, waardoor de
 * lijst half zo lang werd en je dus moest scrollen voor iets wat één tik hoorde
 * te zijn.
 */
function Suggestie(
  { h, moment, gedaan, opKies }:
  { h: Herhaling; moment: Moment; gedaan: boolean; opKies: () => void },
) {
  const r = h.regel
  const elders = h.moment !== 'onbekend' && h.moment !== moment
  return (
    <div>
      <span className="groei">
        <span className="knip" style={{ fontSize: '.88rem', display: 'block' }}>
          {gedaan && <span style={{ color: 'var(--goed)' }} aria-label="toegevoegd">✓ </span>}
          {h.naam}
        </span>
        <span className="mini">
          {dz(Math.round(r.kcal_punt))} kcal
          {r.eiwit_g != null && ` · ${dec(r.eiwit_g, 1)} g eiwit`}
          {' · '}
          <span title={`${h.aantal} keer gelogd, laatst op ${h.laatst}`}>
            {h.aantal}× · {kortNL(h.laatst)}
          </span>
          {elders && ` · meestal ${h.moment}`}
        </span>
      </span>
      <Knop vol klein titel={`${h.naam} toevoegen aan je ${moment}`} opKlik={opKies}>+</Knop>
    </div>
  )
}

/**
 * Zoeken in NEVO, de gerechtenbibliotheek en je eigen producten.
 *
 * Hetzelfde zoeken als op het voedingsscherm, maar hier zonder van tabblad te
 * wisselen. De volgorde van de antwoorden wordt bewaakt: een trage treffer op
 * 'cous' mag het resultaat van 'couscous' niet overschrijven.
 */
function Zoekvangst(
  { token, term, opKies }: { token: string; term: string; opKies: (o: Onderwerp) => void },
) {
  const [uitslag, zetUitslag] = useState<Zoekuitslag | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)
  const teller = useRef(0)

  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) { zetUitslag(null); return }
    const mijn = ++teller.current
    const tijd = setTimeout(async () => {
      zetLoopt(true)
      try {
        const u = await roep('kal_zoeken', { p_token: token, p_q: q, p_limiet: 10 })
        if (mijn === teller.current) { zetUitslag(u); zetFout(null) }
      } catch (e) {
        if (mijn === teller.current) zetFout(e instanceof Error ? e.message : String(e))
      } finally {
        if (mijn === teller.current) zetLoopt(false)
      }
    }, 300)
    return () => clearTimeout(tijd)
  }, [term, token])

  async function kiesGerecht(id: string) {
    try {
      const g = await roep('kal_gerecht', { p_token: token, p_dish_id: id })
      if (!g.porties.length) { zetFout('Voor dit gerecht staan geen porties klaar.'); return }
      opKies({ soort: 'gerecht', gerecht: g })
    } catch (e) { zetFout(e instanceof Error ? e.message : String(e)) }
  }
  async function kiesNevo(code: string) {
    try {
      opKies({ soort: 'nevo', product: await roep('kal_portiematen', { p_token: token, p_nevo_code: code }) })
    } catch (e) { zetFout(e instanceof Error ? e.message : String(e)) }
  }

  const leeg = uitslag && !uitslag.nevo.length && !uitslag.gerechten.length && !uitslag.eigen.length

  return (
    <div style={{ marginTop: 10 }}>
      {loopt && <p className="klein"><Spin /> Zoeken…</p>}
      {fout && <p className="klein">{fout}</p>}

      {uitslag && (uitslag.eigen.length > 0 || uitslag.gerechten.length > 0 || uitslag.nevo.length > 0) && (
        <div className="lijst">
          {/* Eigen producten eerst: dat is de enige categorie zonder schatting,
              en meestal precies waar je naar zocht. */}
          {uitslag.eigen.map((pr) => (
            <div key={'e' + pr.id}>
              <Chip graad={pr.conf || 'A'} />
              <span className="groei">
                <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{pr.naam}</span>
                <span className="mini">eigen product · per {dz(pr.per)} {pr.eenheid || 'g'}</span>
              </span>
              <Knop vol klein titel="Toevoegen"
                    opKlik={() => opKies({ soort: 'eigen', product: pr })}>+</Knop>
            </div>
          ))}
          {uitslag.gerechten.map((g) => (
            <div key={'g' + g.id}>
              <Chip graad={g.status === 'validated' ? 'C' : 'D'} />
              <span className="groei">
                <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{g.naam}</span>
                <span className="mini">gerecht · {g.keuken}</span>
              </span>
              <Knop vol klein titel="Portie kiezen" opKlik={() => void kiesGerecht(g.id)}>+</Knop>
            </div>
          ))}
          {uitslag.nevo.map((n) => (
            <div key={'n' + n.nevo_code}>
              <Chip graad="C" />
              <span className="groei">
                <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{n.naam}</span>
                <span className="mini">{dz(n.kcal)} kcal per 100 g · {n.groep}</span>
              </span>
              <Knop vol klein titel="Portie kiezen" opKlik={() => void kiesNevo(n.nevo_code)}>+</Knop>
            </div>
          ))}
        </div>
      )}

      {leeg && !loopt && (
        <p className="klein">
          Niets gevonden. Probeer het losse product zonder de bereiding erbij, of beschrijf de hele
          maaltijd in gewone taal — leeg het zoekveld, dan staat dat vak er weer.
        </p>
      )}
    </div>
  )
}

/**
 * Zeggen wat je at, in tekst of met een foto.
 *
 * Stond als eigen kaart op Vandaag, tussen de weging en de maaltijdvakken. Dat
 * is de verkeerde plek: het is geen apart onderwerp maar de derde manier om
 * hetzelfde te doen, en het hoort dus naast de andere twee te staan. Ingeklapt,
 * want het is de langzaamste van de drie — een halve minuut tegenover één tik.
 */
function Beschrijven(
  { token, datum, moment, opToevoegen }:
  {
    token: string; datum: IsoDatum; moment: Moment
    opToevoegen: (r: NieuweRegel[], namen: string[]) => void
  },
) {
  const [open, zetOpen] = useState(false)
  const [tekst, zetTekst] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [concept, zetConcept] = useState<Herkenning | null>(null)

  async function doe(soort: 'tekst' | 'foto', foto?: File) {
    if (soort === 'tekst' && !tekst.trim()) { zetMelding('Schrijf eerst op wat je gegeten hebt.'); return }
    zetOpen(true)
    zetLoopt(true)
    zetMelding(null)
    try {
      const fotos = foto ? [await leesFoto(foto)] : []
      const uit = await herken(token, soort, tekst.trim(), fotos)
      zetConcept(uit)
      zetTekst('')
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  const totaal = concept?.regels.reduce(
    (a, r) => ({
      p: a.p + (r.kcal_punt || 0), l: a.l + (r.kcal_laag || 0),
      h: a.h + (r.kcal_hoog || 0), e: a.e + (r.eiwit_g || 0),
    }), { p: 0, l: 0, h: 0, e: 0 })

  return (
    <div style={{ marginTop: 16 }}>
      <Tussen>
        <Kop>Of beschrijf het</Kop>
        <Rij>
          {/* De foto zit in de kop en niet achter het openklappen: wie een bord
              voor zich heeft staan wil niet eerst een tekstvak opvouwen. */}
          <label className="chip" style={{ cursor: 'pointer' }}>
            📷 Foto
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                   onChange={(e) => { const f = e.target.files?.[0]; if (f) void doe('foto', f) }} />
          </label>
          <Keuzechip aan={open} opKlik={() => zetOpen((o) => !o)}>✎ Tekst</Keuzechip>
        </Rij>
      </Tussen>

      {open && (
        <>
          <textarea style={{ marginTop: 8 }} value={tekst} onChange={(e) => zetTekst(e.target.value)}
                    placeholder="Schrijf het zoals je het zou vertellen — een bord tajine met kip, twee cappuccino's, een handje amandelen." />
          <Rij style={{ marginTop: 8 }}>
            {SNELLE.map((x) => (
              <Keuzechip key={x.naam} opKlik={() => zetTekst((t) => (t ? t + ', ' : '') + x.tekst)}>
                {x.ico} {x.naam}
              </Keuzechip>
            ))}
          </Rij>
          <button type="button" className="hoofdknop" style={{ marginTop: 10 }}
                  disabled={loopt} onClick={() => void doe('tekst')}>
            {loopt ? <><Spin /> Bezig met herkennen…</> : 'Herkennen'}
          </button>
          <p className="klein" style={{ marginTop: 8 }}>
            {loopt
              ? 'Dit duurt een halve minuut: er wordt in twee ronden tegen het Nederlands Voedingsstoffenbestand gematcht. De voedingswaarde komt uit die tabel en niet uit het geheugen van het model.'
              : melding}
          </p>
        </>
      )}
      {!open && melding && <p className="klein" style={{ marginTop: 8 }}>{melding}</p>}

      {concept && totaal && (
        <Kaart plat style={{ marginTop: 12 }}>
          <Tussen>
            <Kop>Herkend — nakijken vóór opslaan</Kop>
            <span className="mini">{concept.model}</span>
          </Tussen>
          <div className="lijst" style={{ marginTop: 6 }}>
            {concept.regels.map((r, i) => (
              <div key={i}>
                <Chip graad={r.conf} />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{r.naam}</span>
                  <span className="mini">
                    {r.nevo_naam ? 'NEVO: ' + r.nevo_naam : 'geen tabelwaarde — schatting van het model'}
                  </span>
                  {r.onzekerheidsbronnen.map((o, j) => (
                    <span className="mini" style={{ display: 'block' }} key={j}>· {o}</span>
                  ))}
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span className="cijfer" style={{ fontSize: '.85rem', display: 'block' }}>
                    {dz(r.kcal_punt)}
                  </span>
                  <span className="mini cijfer">{dz(r.kcal_laag)}–{dz(r.kcal_hoog)}</span>
                </span>
                <Knop klein titel="Weglaten"
                      opKlik={() => {
                        const over = concept.regels.filter((_, j) => j !== i)
                        zetConcept(over.length ? { ...concept, regels: over } : null)
                      }}>×</Knop>
              </div>
            ))}
          </div>
          <Tussen style={{ marginTop: 10 }}>
            <span className="cijfer" style={{ fontSize: '.9rem' }}>
              <b>{dz(Math.round(totaal.p))} kcal</b>{' '}
              <span className="klein">
                ({dz(Math.round(totaal.l))}–{dz(Math.round(totaal.h))}) · {dec(totaal.e, 1)} g eiwit
              </span>
            </span>
            {/* Het moment van het vel wint van dat van het model: jij hebt het
                net aangetikt, het model heeft het geraden uit de klok. */}
            <Knop vol opKlik={() => {
              opToevoegen(
                concept.regels.map((r) => ({ ...r, datum, moment })),
                concept.regels.map((r) => r.naam))
              zetConcept(null)
            }}>Toevoegen</Knop>
          </Tussen>
          {concept.opmerking && <p className="klein" style={{ marginTop: 8 }}>{concept.opmerking}</p>}
          {concept.referentieobject && (
            <p className="mini" style={{ marginTop: 4 }}>
              Schaal bepaald aan: {concept.referentieobject}.
            </p>
          )}
        </Kaart>
      )}
    </div>
  )
}
