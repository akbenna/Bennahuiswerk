/**
 * DE PORTIEKEUZE
 *
 * Eén venster voor drie herkomsten: een gerecht uit de bibliotheek, een product
 * uit de voedingsmiddelentabel, en een eigen product. Ze verschillen in waar de porties vandaan
 * komen en niet in wat er daarna gebeurt, dus ze delen dit scherm.
 *
 * Wat hier niet meer staat is prompt('Hoeveel gram?'). Die vraag kan een mens
 * niet beantwoorden — een snee brood is vijfentwintig tot vijfenveertig gram en
 * dat weet niemand uit het hoofd — terwijl "hoeveel sneetjes" wél te
 * beantwoorden is. De vijfendertig huishoudmaten staan per productgroep in de
 * database en dekken alle zevenentwintig groepen; er is dus geen product zonder
 * maat. En elke maat brengt zijn eigen band mee: het getal dat je vroeger
 * intikte had geen marge en deed daarmee alsof het gewogen was.
 */
import { useState } from 'react'
import { Chip, Kaart, Knop, Kop, Rij, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import { vandaag } from '@/gedeeld/datum'
import type { EigenProduct, Graad, IsoDatum, Moment } from '@/gedeeld/db/tabellen'
import type { Gerecht, MerkTreffer, NieuweRegel, ProductMetMaten } from '@/gedeeld/db/rpc'
import { Bron } from '../herkomst'

/** Waar de portiekeuze op dit moment over gaat. */
export type Onderwerp =
  | { soort: 'gerecht'; gerecht: Gerecht }
  | { soort: 'nevo'; product: ProductMetMaten }
  | { soort: 'eigen'; product: EigenProduct }
  | { soort: 'merk'; product: MerkTreffer }

export interface Keuze {
  label: string
  /** Hetzelfde label zonder icoon; wat in de regel en de onzekerheid komt. */
  kaal: string
  sub: string
  notitie?: string | null
  gram: number
  gram_laag: number
  gram_hoog: number
  kcal_punt: number
  kcal_laag: number
  kcal_hoog: number
  eiwit_g: number
  vet_g: number
  koolhydraat_g: number
  vezel_g: number
  gewogen?: boolean
}

/**
 * Een maaltijdmoment raden uit de klok. Alleen voor vandaag: op een oudere dag
 * is het uur van nu niets waard, en dan is 'onbekend' het eerlijke antwoord.
 */
export function momentNu(datum: IsoDatum): Moment {
  if (datum !== vandaag()) return 'onbekend'
  const u = new Date().getHours()
  return u < 11 ? 'ontbijt' : u < 15 ? 'lunch' : u < 21 ? 'diner' : 'tussendoor'
}

const MOMENTEN: Moment[] = ['ontbijt', 'lunch', 'diner', 'tussendoor', 'onbekend']

export function bouwKeuzes(o: Onderwerp, metOptioneel: boolean, gram: string): Keuze[] {
  if (o.soort === 'gerecht') {
    return o.gerecht.porties.map((p) => {
      const w = metOptioneel && p.met ? p.met : p
      return {
        label: (p.icoon ? p.icoon + ' ' : '') + p.label,
        kaal: p.label,
        sub: `${dz(p.gram)} g · band ${dz(p.gram_laag)}–${dz(p.gram_hoog)} g`,
        notitie: p.notitie,
        gram: p.gram, gram_laag: p.gram_laag, gram_hoog: p.gram_hoog,
        kcal_punt: w.kcal_punt, kcal_laag: w.kcal_laag, kcal_hoog: w.kcal_hoog,
        eiwit_g: w.eiwit_g, vet_g: w.vet_g,
        koolhydraat_g: w.koolhydraat_g, vezel_g: w.vezel_g,
      }
    })
  }

  if (o.soort === 'nevo') {
    const n = o.product
    const per = (v: number | null, g: number) => Math.round(((v ?? 0) * g) / 100 * 10) / 10
    const maak = (label: string, sub: string, g: number, lo: number, hi: number, gewogen = false): Keuze => ({
      label, kaal: label, sub,
      gram: g, gram_laag: lo, gram_hoog: hi,
      kcal_punt: Math.round((n.kcal * g) / 100),
      kcal_laag: Math.round((n.kcal * lo) / 100),
      kcal_hoog: Math.round((n.kcal * hi) / 100),
      eiwit_g: per(n.eiwit_g, g), vet_g: per(n.vet_g, g),
      koolhydraat_g: per(n.koolhydraat_g, g), vezel_g: per(n.vezel_g, g),
      gewogen,
    })
    const uit = n.maten.map((m) =>
      maak(m.naam, `${dz(m.gram)} g · band ${dz(m.gram_laag)}–${dz(m.gram_hoog)} g`,
           m.gram, m.gram_laag, m.gram_hoog))

    /* Afwegen blijft mogelijk en is de enige keuze die geen huishoudmaat is.
       De smalle band eromheen is de onzekerheid van de tabel zelf, niet de
       portie: die is dan immers geen schatting meer. */
    const g = parseFloat(gram)
    if (Number.isFinite(g) && g > 0) {
      uit.push(maak('afgewogen', `${dz(g)} g, door jou gewogen`,
                    g, Math.round(g * 0.95), Math.round(g * 1.05), true))
    }
    return uit
  }

  if (o.soort === 'merk') return keuzesVoorMerk(o.product)

  const pr = o.product
  const g = Number(pr.per) || 100
  return [{
    label: `per ${dz(g)} ${pr.eenheid || 'g'}`, kaal: `per ${dz(g)} ${pr.eenheid || 'g'}`,
    sub: 'waarde van het etiket',
    gram: g, gram_laag: g, gram_hoog: g,
    kcal_punt: Math.round(pr.kcal),
    kcal_laag: Math.round(pr.kcal * 0.95),
    kcal_hoog: Math.round(pr.kcal * 1.05),
    eiwit_g: Number(pr.eiwit_g) || 0, vet_g: Number(pr.vet_g) || 0,
    koolhydraat_g: Number(pr.koolhydraat_g) || 0, vezel_g: Number(pr.vezel_g) || 0,
  }]
}

/**
 * DE PORTIES VAN EEN MERKPRODUCT
 *
 * Drie manieren om te zeggen hoeveel, en ze komen uit drie verschillende
 * bronnen — vandaar dat ze niet dezelfde band krijgen.
 *
 *   100 g            de maat waarin de voedingswaarde op het etiket staat
 *   één portie       wat de fabrikant een portie noemt
 *   de verpakking    wat er in het pak zit
 *
 * DE BAND, EN WAAROM HIJ NIET NUL IS
 *
 * Een etiket ziet eruit als een exact getal en is het niet. De Europese regels
 * staan bij de meeste voedingswaarden een afwijking toe die voor energie rond de
 * twintig procent ligt; dat is geen slordigheid van de fabrikant maar een
 * erkende marge. Wie 100 g afweegt weet dus het gewicht precies en de
 * voedingswaarde niet.
 *
 * Daarom hier tien procent aan weerskanten op alle drie de keuzes: het gewicht
 * staat vast, de waarde erachter niet. Dat is smaller dan een geschatte portie
 * en breder dan een tabelwaarde, en dat is precies waar een etiket hoort te
 * staan.
 *
 * De portie van de fabrikant krijgt daarbovenop niets extra's. "Eén portie" is
 * hún keuze en niet die van jou — wie een dubbele schep neemt kiest gewoon twee.
 */
export function keuzesVoorMerk(p: MerkTreffer): Keuze[] {
  const per = (waarde: number | null, gram: number) => ((Number(waarde) || 0) * gram) / 100
  const maak = (label: string, sub: string, gram: number): Keuze => ({
    label, kaal: label, sub,
    gram, gram_laag: gram, gram_hoog: gram,
    kcal_punt: Math.round((p.kcal * gram) / 100),
    kcal_laag: Math.round((p.kcal * gram * 0.9) / 100),
    kcal_hoog: Math.round((p.kcal * gram * 1.1) / 100),
    eiwit_g: per(p.eiwit_g, gram), vet_g: per(p.vet_g, gram),
    koolhydraat_g: per(p.koolhydraat_g, gram), vezel_g: per(p.vezel_g, gram),
  })

  const uit = [maak('100 g', 'zoals het op het etiket staat', 100)]

  /* De portie van de fabrikant, als hij er een noemt. Hij komt vooraan, want
     het is de maat waarin het product bedoeld is. */
  if (p.portie_gram && p.portie_gram > 0) {
    uit.unshift(maak(
      p.portie_naam?.trim() ? `portie (${dz(p.portie_gram)} g)` : `portie ${dz(p.portie_gram)} g`,
      'wat de fabrikant een portie noemt', p.portie_gram))
  }

  /* En het hele pak. Zelden wat je in één keer eet, maar wel wat je in de hand
     hebt als je niet weet hoeveel eruit ging. */
  if (p.verpakking_gram && p.verpakking_gram > 0 && p.verpakking_gram <= 5000) {
    uit.push(maak(`hele verpakking (${dz(p.verpakking_gram)} g)`,
                  'alles wat er in het pak zit', p.verpakking_gram))
  }
  return uit
}

/**
 * Waar het getal vandaan komt, in gewone zinnen. Deze lijst gaat mee de regel in
 * en is later terug te lezen; een band zonder benoemde onzekerheid is een getal
 * dat doet alsof.
 */
export function bouwOnzekerheid(
  o: Onderwerp, k: Keuze, metOptioneel: boolean, aantal: number,
): string[] {
  const uit: string[] = []
  if (o.soort === 'gerecht') {
    const g = o.gerecht
    uit.push(`portie geschat als ${k.kaal}, ${dz(k.gram_laag)}–${dz(k.gram_hoog)} g`)
    if (g.vet_gram > 0) {
      uit.push(`bevat ${dz(g.vet_gram)} g bereidingsvet${g.vet_soort ? ` (${g.vet_soort})` : ''}` +
               ' uit het recept, niet gewogen')
    }
    uit.push('energiedichtheid berekend op de ingrediënten zoals ze de pan in gaan; ' +
             'indampen is niet verrekend')
    if (g.optioneel > 0) {
      uit.push((metOptioneel ? 'inclusief ' : 'zonder ') + (g.optioneel_namen ?? ''))
    }
    if (g.ongekoppeld > 0) {
      uit.push(`${g.ongekoppeld_namen ?? ''} staat niet in het voedingsstoffenbestand ` +
               'en telt als nul mee')
    }
    uit.push(`${g.bevestigd} van ${g.ingredienten} ingrediëntkoppelingen door een diëtist bevestigd`)
  } else if (o.soort === 'nevo') {
    uit.push(k.gewogen
      ? 'gewicht afgewogen; alleen de onzekerheid van de voedingsmiddelentabel resteert'
      : `huishoudmaat, niet gewogen — ${dz(k.gram_laag)}–${dz(k.gram_hoog)} g per ${k.kaal}`)
  } else if (o.soort === 'merk') {
    uit.push(`etiketwaarde van ${o.product.merk ?? 'de fabrikant'}, geen tabelwaarde`)
    uit.push('de wettelijke marge op een etiket is voor energie ongeveer tien procent')
    if (k.kaal.startsWith('portie')) {
      uit.push('portie zoals de fabrikant hem noemt, niet door jou afgewogen')
    }
  } else {
    uit.push('etiketwaarde van een eigen product, niet nagewogen')
  }
  if (aantal !== 1) uit.push('aantal opgegeven, niet geteld uit een verpakking')
  return uit
}

export function PortieVenster(
  { onderwerp, datum, moment: startMoment, opSluiten, opToevoegen }:
  {
    onderwerp: Onderwerp
    datum: IsoDatum
    /** Het moment dat elders al gekozen is. Zonder dit raadt het venster het
     *  opnieuw uit de klok, en overschrijft het dus wat je net aantikte. */
    moment?: Moment | undefined
    opSluiten: () => void
    opToevoegen: (r: NieuweRegel) => void
  },
) {
  const standaard = onderwerp.soort === 'gerecht'
    ? Math.max(0, onderwerp.gerecht.porties.findIndex((p) => p.standaard))
    : 0
  const [gekozen, zetGekozen] = useState(standaard)
  const [aantal, zetAantal] = useState(1)
  const [metOptioneel, zetMetOptioneel] = useState(false)
  const [gram, zetGram] = useState('')
  const [moment, zetMoment] = useState<Moment>(startMoment ?? momentNu(datum))

  const keuzes = bouwKeuzes(onderwerp, metOptioneel, gram)
  const k = keuzes[Math.min(gekozen, keuzes.length - 1)]
  if (!k) return null

  const heel = (v: number) => Math.round(v * aantal)
  const half = (v: number) => Math.round(v * aantal * 10) / 10
  const g = onderwerp.soort === 'gerecht' ? onderwerp.gerecht : null
  // Niet via `g`: de smalspoorcontrole van TypeScript volgt de discriminant en
  // niet een variabele die eruit is afgeleid.
  const titel = onderwerp.soort === 'gerecht' ? onderwerp.gerecht.naam : onderwerp.product.naam

  const onzeker = bouwOnzekerheid(onderwerp, k, metOptioneel, aantal)

  /* De graad volgt de ladder in de voettekst. Een gerecht uit de bibliotheek is
     C zolang het gevalideerd is en al zijn ingrediënten een tabelwaarde hebben;
     ontbreekt daar iets aan, dan is het D. Dat is nog steeds een trede beter dan
     wat de herkenning uit tekst of foto van hetzelfde gerecht maakt. */
  const conf: Graad =
    onderwerp.soort === 'eigen' ? (onderwerp.product.conf || 'A')
    : onderwerp.soort === 'nevo' ? 'C'
    : g && g.status === 'validated' && g.ongekoppeld === 0 ? 'C' : 'D'

  function voegToe() {
    if (!k) return
    const naam = `${titel} · ${aantal !== 1 ? dec(aantal, aantal % 1 ? 1 : 0) + '× ' : ''}` +
                 `${k.kaal} (${dz(heel(k.gram))} g)`
    const regel: NieuweRegel = {
      datum, moment, naam,
      hoeveelheid: aantal, eenheid: k.kaal, gram_equivalent: heel(k.gram),
      kcal_punt: heel(k.kcal_punt), kcal_laag: heel(k.kcal_laag), kcal_hoog: heel(k.kcal_hoog),
      eiwit_g: half(k.eiwit_g), vet_g: half(k.vet_g),
      koolhydraat_g: half(k.koolhydraat_g), vezel_g: half(k.vezel_g),
      conf, onzekerheidsbronnen: onzeker,
      bron: onderwerp.soort === 'gerecht' ? 'bibliotheek'
          : onderwerp.soort === 'nevo' ? 'nevo'
          : onderwerp.soort === 'merk' ? 'merk' : 'handmatig',
      ...(g ? { dish_id: g.id } : {}),
      ...(onderwerp.soort === 'nevo' ? { nevo_code: onderwerp.product.nevo_code } : {}),
    }
    opToevoegen(regel)
  }

  return (
    <Venster
      titel={titel}
      opSluiten={opSluiten}
      onder={
        g ? (
          <p className="mini" style={{ marginTop: 2 }}>
            {g.keuken}
            {g.beoordelaar && ` · nagelopen door ${g.beoordelaar}`}
            {' · '}{dz(g.kcal_per_100)} kcal per 100 g
          </p>
        ) : onderwerp.soort === 'nevo' ? (
          <p className="mini" style={{ marginTop: 2 }}>
            {onderwerp.product.groep} · {dz(onderwerp.product.kcal)} kcal per 100 g
          </p>
        ) : null
      }
    >
      <Kop>Hoeveel</Kop>
      <Rij style={{ marginTop: 6, flexWrap: 'wrap' }}>
        {keuzes.map((keuze, i) => (
          <Knop key={keuze.label + i} vol={i === gekozen} opKlik={() => zetGekozen(i)}
                style={{ textAlign: 'left', flex: '1 1 140px' }}>
            <span style={{ display: 'block' }}>{keuze.label}</span>
            <span className="mini" style={{ display: 'block', opacity: 0.8 }}>{keuze.sub}</span>
          </Knop>
        ))}
      </Rij>
      {k.notitie && <p className="mini" style={{ marginTop: 6 }}>{k.notitie}</p>}

      {onderwerp.soort === 'nevo' && (
        <Rij style={{ marginTop: 8, alignItems: 'center' }}>
          <span className="mini">of afwegen</span>
          <input className="smaller" type="number" step="1" inputMode="numeric" placeholder="gram"
                 value={gram}
                 onChange={(e) => {
                   zetGram(e.target.value)
                   const n = parseFloat(e.target.value)
                   if (Number.isFinite(n) && n > 0) zetGekozen(onderwerp.product.maten.length)
                 }} />
          <span className="mini">g</span>
        </Rij>
      )}

      <Rij style={{ marginTop: 12, alignItems: 'center' }}>
        <span className="mini" style={{ flex: '1 1 auto' }}>Aantal</span>
        <Knop klein uit={aantal <= 0.5}
              opKlik={() => zetAantal((n) => Math.max(0.5, n <= 1 ? n - 0.5 : n - 1))}>−</Knop>
        <span className="cijfer" style={{ minWidth: '2.2em', textAlign: 'center' }}>
          {dec(aantal, aantal % 1 ? 1 : 0)}
        </span>
        <Knop klein opKlik={() => zetAantal((n) => (n < 1 ? n + 0.5 : n + 1))}>+</Knop>
      </Rij>

      {g && g.optioneel > 0 && (
        <label className="regel" style={{ cursor: 'pointer' }}>
          <div>
            <b style={{ fontSize: '.87rem' }}>Met {g.optioneel_namen}</b>
            <div className="mini">
              Staat als optioneel in het recept. Dit is een vraag met een antwoord en hoort daarom
              niet in de bandbreedte verstopt.
            </div>
          </div>
          <input type="checkbox" checked={metOptioneel} style={{ width: 19, height: 19 }}
                 onChange={(e) => zetMetOptioneel(e.target.checked)} />
        </label>
      )}

      <div className="regel">
        <div>
          <b style={{ fontSize: '.87rem' }}>Maaltijdmoment</b>
          <div className="mini">Bepaalt waar het in de eiwitverdeling terechtkomt.</div>
        </div>
        <select style={{ width: 'auto' }} value={moment}
                onChange={(e) => zetMoment(e.target.value as Moment)}>
          {MOMENTEN.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <Kaart plat style={{ marginTop: 12 }}>
        <Tussen>
          <div>
            <span className="getal" style={{ fontSize: '1.8rem' }}>{dz(heel(k.kcal_punt))}</span>
            <span className="klein"> kcal</span>
            <div className="mini cijfer">
              {dz(heel(k.kcal_laag))}–{dz(heel(k.kcal_hoog))} kcal · {dz(heel(k.gram))} g
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="cijfer" style={{ fontSize: '1.05rem' }}>{dec(half(k.eiwit_g), 1)} g</span>
            <div className="mini">eiwit</div>
          </div>
        </Tussen>
      </Kaart>

      <ul className="mini" style={{ margin: '10px 0 0', paddingLeft: 16, lineHeight: 1.5 }}>
        {onzeker.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      {g && (
        <Uitleg id="opbouw-gerecht" label="de opbouw van dit gerecht">
          <p>
            Zo is dit gerecht opgebouwd, per {dz(g.totaal_gram)} g. Wat je hierboven ziet is dit maal
            het aandeel van jouw portie.
          </p>
          <div className="lijst">
            {g.regels.map((r, i) => (
              <div key={i}>
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.82rem', display: 'block' }}>
                    {r.naam}
                    {r.vet_regel && ' · bereidingsvet'}
                    {r.optioneel && ' · optioneel'}
                    {!r.gekoppeld && ' · geen tabelwaarde'}
                  </span>
                  {r.nevo_naam && (
                    <span className="mini">
                      <Bron regel={r} />{r.bevestigd && ' · bevestigd'}
                    </span>
                  )}
                </span>
                <span className="cijfer mini" style={{ textAlign: 'right' }}>
                  {dz(r.gram)} g<br />{dz(r.kcal)} kcal
                </span>
              </div>
            ))}
          </div>
        </Uitleg>
      )}

      <Rij style={{ marginTop: 14 }}>
        <Knop vol opKlik={voegToe}>Toevoegen</Knop>
        <Knop opKlik={opSluiten}>Annuleren</Knop>
        <span style={{ marginLeft: 'auto' }}><Chip graad={conf} /></span>
      </Rij>
    </Venster>
  )
}
