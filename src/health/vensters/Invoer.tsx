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
 *
 * DE VIERDE MANIER: JE EIGEN MAALTIJDEN
 *
 * De drie hierboven werken per product. Een tonijnsalade is geen product maar
 * zeven producten, en die zoek je bij elke keer opnieuw op — met elke keer een
 * net iets ander antwoord. Vandaar de bovenste strook: wat je één keer hebt
 * uitgezocht staat daar als één tegel, met een portiekeuze erbij.
 *
 * Bewaren gebeurt onderaan, uit wat er op dit moment van deze dag staat. Dat is
 * de enige plek waar het kan zonder een tweede invoerscherm: je hebt de
 * maaltijd dan net ingevoerd, dus je weet precies wat erin zat.
 */
import { useEffect, useRef, useState } from 'react'
import { Chip, Kaart, Keuzechip, Knop, Kop, Rij, Spin, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL } from '@/gedeeld/datum'
import { roep } from '@/gedeeld/db/rpc'
import type { Maaltijd, NieuweRegel, Zoekuitslag } from '@/gedeeld/db/rpc'
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import { herhaalRegel, herhalingen, laatsteMaaltijd } from '../herhaal'
import type { Herhaling, Lijstsoort } from '../herhaal'
import {
  aandelen, aggregaat, duiding, maaltijdRegel, naamvoorstel, portieNaam, snapshot, varianten,
} from '../maaltijd'
import { herken, leesFoto } from '../ai'
import { lijktOpZin } from '../zoekzin'
import { Bron } from '../herkomst'
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

  const [maaltijden, zetMaaltijden] = useState<Maaltijd[]>([])

  /* Het beschrijfvak staat verderop en ingeklapt, maar het zoekveld moet het
     kunnen openen met de zin er al in. Daarom wonen deze twee hier en niet in
     `Beschrijven` zelf: anders kan alleen dat vak zichzelf openen, en juist wie
     het niet gevonden heeft moet erheen geholpen worden. */
  const [beschrijfOpen, zetBeschrijfOpen] = useState(false)
  const [beschrijfTekst, zetBeschrijfTekst] = useState('')
  const beschrijfVak = useRef<HTMLDivElement>(null)

  /* De overstap van zoeken naar beschrijven. Het zoekveld gaat leeg — anders
     blijven de zoekresultaten eroverheen staan en zie je nog steeds niet waar je
     terechtkwam. En dan naar het vak toe scrollen, want het staat onder de vouw. */
  function laatHerkennen(zin: string) {
    zetBeschrijfTekst(zin)
    zetBeschrijfOpen(true)
    zetTerm('')
    requestAnimationFrame(
      () => beschrijfVak.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const zoekt = term.trim().length >= 2
  const suggesties = herhalingen(p.regels, { nu: p.datum, soort, moment, max: 10 })
  const maaltijd = laatsteMaaltijd(p.regels, moment, p.datum, p.datum)

  /* Wat er nú op dit moment van deze dag staat. Hetzelfde vangnet als op
     Vandaag: een regel zonder moment hoort bij 'tussendoor'. */
  const opDitMoment = p.regels.filter(
    (r) => r.datum === p.datum
      && (r.moment === moment || (moment === 'tussendoor' && r.moment === 'onbekend')))

  async function haalMaaltijden() {
    try { zetMaaltijden(await roep('kal_maaltijden', { p_token: p.token }) ?? []) } catch { /* stil */ }
  }
  useEffect(() => { void haalMaaltijden() }, [p.token])

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
        <input placeholder="zoek in de tabel, gerechten en je eigen producten" autoComplete="off"
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
        ? (
          <Zoekvangst token={p.token} term={term} moment={moment}
                      opHerkennen={lijktOpZin(term) ? () => laatHerkennen(term.trim()) : undefined}
                      opKies={(o) => p.opPortie(o, moment)}
                      opMaaltijd={(m, aantal) => {
                        const r = maaltijdRegel(m, aantal, p.datum, moment)
                        voegToe([r], [r.naam])
                      }} />
        )
        : (
          <>
            {maaltijden.length > 0 && (
              <>
                <Tussen style={{ marginTop: 14 }}>
                  <Kop>Je eigen maaltijden</Kop>
                  <span className="mini">één tik, portie erbij</span>
                </Tussen>
                <div style={{ marginTop: 6 }}>
                  {maaltijden.map((m) => (
                    <Maaltijdtegel
                      key={m.id} m={m} moment={moment}
                      opKies={(aantal) => {
                        const r = maaltijdRegel(m, aantal, p.datum, moment)
                        voegToe([r], [r.naam])
                      }}
                      opWissen={async () => {
                        await roep('kal_maaltijd_wissen', { p_token: p.token, p_id: m.id })
                        await haalMaaltijden()
                      }}
                      opSter={async () => {
                        await roep('kal_maaltijd_favoriet',
                          { p_token: p.token, p_id: m.id, p_aan: !m.favoriet })
                        await haalMaaltijden()
                      }} />
                  ))}
                </div>
              </>
            )}

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
              /* `suggesties` staat naast `lijst` zodat deze lijst aan te wijzen is.
                 Er staan er inmiddels drie in dit vel — suggesties, zoekresultaten
                 en de duiding van een maaltijd — en "de eerste .lijst" is dan geen
                 aanwijzing meer maar een gok. */
              <div className="lijst suggesties" style={{ marginTop: 6 }}>
                {suggesties.map((h) => (
                  <Suggestie key={h.sleutel} h={h} moment={moment} gedaan={gedaan.includes(h.naam)}
                             opKies={() => voegToe([herhaalRegel(h, p.datum, moment)], [h.naam])} />
                ))}
              </div>
            )}

            <div ref={beschrijfVak}>
              <Beschrijven token={p.token} datum={p.datum} moment={moment}
                           open={beschrijfOpen} zetOpen={zetBeschrijfOpen}
                           tekst={beschrijfTekst} zetTekst={zetBeschrijfTekst}
                           opToevoegen={(r, n) => voegToe(r, n)} />
            </div>

            <Bewaren token={p.token} regels={opDitMoment} moment={moment}
                     opBewaard={() => void haalMaaltijden()} />
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
 * Zoeken in de voedingsmiddelentabel, de gerechtenbibliotheek en je eigen producten.
 *
 * Hetzelfde zoeken als op het voedingsscherm, maar hier zonder van tabblad te
 * wisselen. De volgorde van de antwoorden wordt bewaakt: een trage treffer op
 * 'cous' mag het resultaat van 'couscous' niet overschrijven.
 */
function Zoekvangst(
  { token, term, moment, opKies, opMaaltijd, opHerkennen }:
  {
    token: string; term: string; moment: Moment
    opKies: (o: Onderwerp) => void
    opMaaltijd: (m: Maaltijd, aantal: number) => void
    /* Ontbreekt deze, dan lijkt de term geen zin en komt er geen aanbod. Het
       oordeel valt buiten dit onderdeel: hier staat alleen hoe het eruitziet. */
    opHerkennen?: (() => void) | undefined
  },
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

  const maaltijden = uitslag?.maaltijden ?? []
  const leeg = uitslag && !uitslag.nevo.length && !uitslag.gerechten.length
    && !uitslag.eigen.length && !maaltijden.length

  return (
    <div style={{ marginTop: 10 }}>
      {loopt && <p className="klein"><Spin /> Zoeken…</p>}
      {fout && <p className="klein">{fout}</p>}

      {/* HET AANBOD, EN WAAROM HET HELEMAAL BOVENAAN STAAT

          Wie "twee boterhammen met mayonaise" in het zoekveld typt bedoelt een
          maaltijd, en krijgt losse producten. Dat is geen fout van de gebruiker:
          het zoekveld staat bovenaan en het beschrijfvak zit ingeklapt onder de
          vouw, dus je vindt het niet als je het niet al wist.

          Daarom staat dit vóór de resultaten en niet erna. Eronder zou het het
          aanbod maken dat je pas ziet als je de verkeerde weg al bent ingeslagen.

          De zoekresultaten blijven er wel onder staan: soms bedoelde je toch dat
          ene product, en dan is dit een aanbod en geen omleiding. */}
      {opHerkennen && (
        <button type="button" className="hoofdknop breed" style={{ marginBottom: 10 }}
                onClick={opHerkennen}>
          <span aria-hidden="true">✎</span>
          <span>
            Dit klinkt als een hele maaltijd
            <span className="hoofdknopsub">
              laat “{term.trim()}” herkennen in plaats van los opzoeken
            </span>
          </span>
        </button>
      )}

      {/* Je eigen maaltijden staan boven de tabel, want wie "tonijn" typt bedoelt
          zijn eigen salade en niet de vierentwintig tonijnregels uit de tabel. */}
      {maaltijden.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {maaltijden.map((m) => (
            <Maaltijdtegel key={m.id} m={m} moment={moment}
                           opKies={(aantal) => opMaaltijd(m, aantal)} />
          ))}
        </div>
      )}

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

          {/* Merkproducten onderaan, en met graad D. Dat is geen minachting maar
              de ladder: een etiket is een opgave van de fabrikant met een
              wettelijke marge, geen laboratoriumbepaling. Wat het wél heeft en de
              tabel niet is het gewicht van de verpakking — daarom staat dat er
              meteen bij. */}
          {(uitslag.merk ?? []).map((m) => (
            <div key={'m' + m.id}>
              <Chip graad="D" />
              <span className="groei">
                <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>
                  {m.naam}
                </span>
                <span className="mini">
                  <abbr className="herkomst" title="etiketwaarde van de fabrikant">◈</abbr>{' '}
                  {m.merk ?? 'merkproduct'} · {dz(m.kcal)} kcal per 100 g
                  {m.verpakking_gram != null && <> · pak van {dz(m.verpakking_gram)} g</>}
                </span>
              </span>
              <Knop vol klein titel="Portie kiezen"
                    opKlik={() => opKies({ soort: 'merk', product: m })}>+</Knop>
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
  { token, datum, moment, open, zetOpen, tekst, zetTekst, opToevoegen }:
  {
    token: string; datum: IsoDatum; moment: Moment
    /* Open en tekst komen van buiten: het zoekveld kan dit vak openklappen met
       een zin er al in. Zie `laatHerkennen` in InvoerVenster. */
    open: boolean
    zetOpen: (aan: boolean) => void
    tekst: string
    zetTekst: (t: string | ((oud: string) => string)) => void
    opToevoegen: (r: NieuweRegel[], namen: string[]) => void
  },
) {
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
          <Keuzechip aan={open} opKlik={() => zetOpen(!open)}>✎ Tekst</Keuzechip>
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
                  <span className="mini"><Bron regel={r} /></span>
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

/**
 * Eén bewaarde maaltijd: kiezen, loggen, en desgewenst nakijken.
 *
 * INGEKLAPT, MET ÉÉN TIK OM TE LOGGEN
 *
 * Uitgeklapt was elke tegel een blok van tien regels — naam, band, vier
 * portieknopjes, zes onzekerheidsbronnen, een toelichting en een uitklapje. Bij
 * vier bewaarde maaltijden vulde dat het hele vel, en dan moet je scrollen langs
 * dingen die je al weet om bij het zoekveld te komen dat je nodig hebt.
 *
 * Ingeklapt is één regel, en de plus ernaast logt één portie. Dat is meteen de
 * juiste standaard: één portie is verreweg het gewone geval, en wie een halve
 * wil klapt open en kiest hem.
 *
 * WAT ER NOOIT VERDWIJNT
 *
 * De graad en de band blijven staan, ook ingeklapt. Dat is geen detail maar de
 * afspraak van deze app: geen enkel getal zonder zijn onzekerheid. De letter en
 * de twee grenzen ná het punt zíjn die onzekerheid, samengevat; wat achter het
 * uitklapje verdwijnt is waar die vandaan komt — welk onderdeel niet gewogen is
 * en hoe erg dat is. Een samenvatting mag inklappen, de uitkomst niet.
 *
 * De portiekeuze verandert de kop mee. Staat er een halve portie gekozen, dan
 * zegt de kop dat, ook als de tegel weer dichtgaat — anders log je met één tik
 * iets anders dan wat er staat.
 */
function Maaltijdtegel(
  { m, moment, opKies, opWissen, opSter }:
  {
    m: Maaltijd; moment: Moment
    opKies: (aantal: number) => void
    opWissen?: (() => void) | undefined
    opSter?: (() => void) | undefined
  },
) {
  const [aantal, zetAantal] = useState(1)
  const [open, zetOpen] = useState(false)
  const [weg, zetWeg] = useState(false)
  const a = aggregaat(m, aantal)

  return (
    <Kaart plat style={{ marginBottom: 8 }}>
      <Tussen>
        {opSter && (
          <button type="button" className="ster" onClick={opSter} aria-pressed={m.favoriet}
                  title={m.favoriet ? `${m.naam} niet meer bovenaan` : `${m.naam} bovenaan zetten`}>
            {m.favoriet ? '★' : '☆'}
          </button>
        )}
        <button type="button" className="maalopen groei" aria-expanded={open}
                onClick={() => zetOpen((o) => !o)}
                title={open ? 'Minder tonen' : 'Wat erin zit'}>
          <span className="knip" style={{ fontSize: '.9rem', fontWeight: 600, display: 'block' }}>
            <span className="pijl" aria-hidden="true">›</span>
            {!opSter && m.favoriet && <span aria-hidden="true">★ </span>}
            {m.naam}
          </span>
          <span className="mini">
            <Chip graad={a.conf} /> {dz(a.kcal)} kcal ({dz(a.kcalLaag ?? a.kcal)}–{dz(a.kcalHoog ?? a.kcal)})
            {a.eiwit != null && ` · ${dec(a.eiwit, 1)} g eiwit`}
            {aantal !== 1 && ` · ${portieNaam(aantal)} portie`}
          </span>
        </button>
        <Knop vol klein titel={`${m.naam} toevoegen aan je ${moment}`}
              opKlik={() => opKies(aantal)}>+</Knop>
      </Tussen>

      {open && (
        <>
          <Rij style={{ marginTop: 8 }}>
            {[0.5, 1, 1.5, 2].map((n) => (
              <Keuzechip key={n} aan={aantal === n} opKlik={() => zetAantal(n)}>
                {portieNaam(n)}
              </Keuzechip>
            ))}
            <span style={{ flex: 1 }} />
            {opWissen && (weg ? (
              <>
                <Knop klein opKlik={opWissen}>echt weg</Knop>
                <Knop klein opKlik={() => zetWeg(false)}>nee</Knop>
              </>
            ) : (
              <Knop klein titel={`${m.naam} verwijderen`} opKlik={() => zetWeg(true)}>×</Knop>
            ))}
          </Rij>

          {/* Waar de onzekerheid vandaan komt. De uitkomst ervan — de graad en
              de band — staat hierboven en gaat nooit weg. */}
          {a.onzeker.map((o, i) => (
            <span className="mini" style={{ display: 'block', marginTop: 3 }} key={i}>· {o}</span>
          ))}
          {m.toelichting && (
            <p className="mini" style={{ marginTop: 6 }}>{m.toelichting}</p>
          )}

          <Duidingsvak m={m} />
        </>
      )}
    </Kaart>
  )
}

/**
 * Wat het gerecht bétekent, achter een uitklapje.
 *
 * Achter een uitklapje omdat dit niet is wat je komt doen — je komt loggen. Maar
 * wél in het gerecht en niet op een apart scherm, want de vraag "kan dit beter"
 * komt precies op het moment dat je ernaar kijkt.
 *
 * Drie maten en een tabel. De maten zijn verhoudingen en dus onafhankelijk van
 * hoeveel je opschept; de tabel zet vier uitkomsten naast elkaar zónder te
 * zeggen welke je moet kiezen. Dat laatste is opzet: een tabel blijft kloppen
 * als je voorkeuren veranderen, een aanbeveling niet.
 */
function Duidingsvak({ m }: { m: Maaltijd }) {
  const d = duiding(m)
  const lijst = aandelen(m)
  const v = varianten(m)
  const pct = (x: number): string => dec(x * 100, 0) + '%'

  return (
    <Uitleg id={'duiding-' + m.id} label="wat zit erin, en kan het beter">
      <p>
        De hele schaal is {dz(d.kcal)} kcal
        {d.gram != null && ` op ${dz(d.gram)} gram`}
        {d.dichtheid != null && ` — ${dec(d.dichtheid, 2)} kcal per gram`}.
        {d.eiwitPer100 != null && (
          <> Eiwit: <b>{dec(d.eiwitPer100, 1)} gram per 100 kcal</b>. Dát is de maat die telt
          bij een tekort; alles onder de vijf is mager.</>
        )}
      </p>
      <p>
        Van de energie komt {d.ePct.eiwit != null && `${dec(d.ePct.eiwit, 0)}% uit eiwit, `}
        {d.ePct.vet != null && `${dec(d.ePct.vet, 0)}% uit vet en `}
        {d.ePct.koolhydraat != null && `${dec(d.ePct.koolhydraat, 0)}% uit koolhydraten`}.
        {d.vezel != null && d.vezel > 0 && ` Vezels: ${dec(d.vezel, 1)} gram.`}
        {' '}Die percentages tellen niet op tot honderd — dat gat is de afronding per
        onderdeel plus de energie uit vezels, en het staat er omdat het iets zegt over hoe
        grof de invoer is.
      </p>

      <p style={{ marginBottom: 4 }}><b>Waar de energie zit</b></p>
      {lijst.map((x) => (
        <div className="duidingrij" key={x.naam}>
          <span>{x.naam}</span>
          <span className="cijfer">{dz(x.kcal)} kcal · {pct(x.deel)}</span>
        </div>
      ))}

      {v.length > 0 && (
        <>
          <p style={{ marginTop: 10, marginBottom: 4 }}><b>Als je aan twee knoppen draait — per portie</b></p>
          {v.map((x) => (
            <div className="duidingrij" key={x.label}>
              <span>{x.label}</span>
              <span className="cijfer">
                {dz(x.perPortie)} kcal
                {x.eiwitPer100 != null && ` · ${dec(x.eiwitPer100, 1)} g/100 kcal`}
              </span>
            </div>
          ))}
          <p style={{ marginTop: 6 }}>
            Er staat expres niet bij welke rij de beste is. De getallen zeggen wat elke keuze
            kost en oplevert; welke daarvan je vanavond wilt eten is geen rekensom.
          </p>
        </>
      )}
    </Uitleg>
  )
}

/**
 * Wat er nu op dit moment staat bewaren als een maaltijd.
 *
 * Twee regels is de ondergrens, om dezelfde reden als bij het overnemen van een
 * eerdere maaltijd: één regel is geen samengesteld gerecht, daar is de gewone
 * suggestielijst al voor, en twee wegen naar hetzelfde is er één te veel.
 *
 * Het aantal porties is het enige veld dat er echt toe doet en tegelijk het
 * enige dat je makkelijk verkeerd invult. Vandaar de zin eronder: wat je hier
 * invoert is wat er nu op tafel staat, niet wat je ervan opeet.
 */
function Bewaren(
  { token, regels, moment, opBewaard }:
  { token: string; regels: Regel[]; moment: Moment; opBewaard: () => void },
) {
  const onderdelen = snapshot(regels)
  const [open, zetOpen] = useState(false)
  const [naam, zetNaam] = useState('')
  const [porties, zetPorties] = useState(1)
  const [loopt, zetLoopt] = useState(false)
  const [melding, zetMelding] = useState<string | null>(null)

  if (onderdelen.length < 2) return null

  async function bewaar() {
    const hoe = naam.trim() || naamvoorstel(regels, moment)
    zetLoopt(true)
    zetMelding(null)
    try {
      await roep('kal_maaltijd_bewaren', {
        p_token: token, p_naam: hoe, p_toelichting: null,
        p_porties: porties, p_regels: onderdelen,
      })
      zetMelding(`"${hoe}" staat er. Vanaf nu is het één tik.`)
      zetOpen(false)
      opBewaard()
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  const totaal = onderdelen.reduce((n, r) => n + r.kcal_punt, 0)

  return (
    <div style={{ marginTop: 16 }}>
      <Tussen>
        <Kop>Vaker eten?</Kop>
        <Keuzechip aan={open}
                   opKlik={() => { zetOpen((o) => !o); if (!naam) zetNaam(naamvoorstel(regels, moment)) }}>
          ☆ Bewaar als maaltijd
        </Keuzechip>
      </Tussen>

      {open && (
        <Kaart plat style={{ marginTop: 8 }}>
          <p className="klein" style={{ marginTop: 0 }}>
            De {onderdelen.length} regels van je {moment} worden één maaltijd. De volgende keer is
            dat één tik in plaats van {onderdelen.length} keer zoeken — en dan met dezelfde getallen,
            wat het verschil is tussen variatie in wat je at en ruis in hoe je het invoerde.
          </p>
          <label className="veld" style={{ display: 'block', marginTop: 8 }}>
            <span>naam</span>
            <input value={naam} onChange={(e) => zetNaam(e.target.value)}
                   placeholder="Tonijnsalade" aria-label="Naam van de maaltijd" />
          </label>
          <label className="veld" style={{ display: 'block', marginTop: 8 }}>
            <span>staat voor hoeveel porties?</span>
            <input className="smaller" type="number" min="0.5" step="0.5" inputMode="decimal"
                   value={porties}
                   onChange={(e) => zetPorties(Math.max(0.5, parseFloat(e.target.value) || 1))} />
          </label>
          <p className="mini" style={{ marginTop: 6 }}>
            {dz(Math.round(totaal))} kcal in totaal, dus{' '}
            {dz(Math.round(totaal / Math.max(porties, 0.5)))} kcal per portie. Vul in wat er nu in de
            kom zit, niet wat je ervan opeet — dat kies je bij het loggen.
          </p>
          <Knop vol style={{ marginTop: 10 }} uit={loopt} opKlik={() => void bewaar()}>
            {loopt ? <><Spin /> Bewaren…</> : 'Bewaren'}
          </Knop>
        </Kaart>
      )}

      {melding && <p className="klein" style={{ marginTop: 8 }}>{melding}</p>}
    </div>
  )
}
