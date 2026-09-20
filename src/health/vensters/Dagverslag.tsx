/**
 * VERTEL JE DAG — het vel voor de dagen dat je er geen zin in hebt
 *
 * Het invoervel is gebouwd voor de maaltijd die je nú logt: één moment, zoeken,
 * een portie kiezen. Dat is de goede vorm voor het gewone geval en de verkeerde
 * voor het geval dat dit vel bedient — de avond waarop je bedenkt dat je vandaag
 * nog niets hebt ingevoerd en er nu geen zin in hebt om drie maaltijden
 * afzonderlijk op te zoeken.
 *
 * Wat er dan gebeurt zonder dit vel is niet "later loggen" maar "niet loggen",
 * en een gat in de reeks is erger dan een ruwe schatting. Het model achter de
 * app leest een lege dag niet als onbekend maar als een dag waarop er weinig
 * gegeten is, en dat trekt de hele reeks scheef.
 *
 * DRIE KEUZES DIE HET VEL BEPALEN
 *
 * Eén vak en geen formulier. Je vertelt het zoals je het aan iemand zou
 * vertellen, en de knop met de microfoon op je eigen toetsenbord doet de rest.
 * Daar staat bewust geen opnameknop in de app naast: de dictatie van het toestel
 * zelf is beter dan wat hier te bouwen is, hij staat er al, en hij stuurt geen
 * audio langs deze app.
 *
 * Nakijken per vak, niet per regel. Je leest vier koppen met daaronder wat er
 * staat, en je grijpt alleen in waar het mis is. Een vel dat om twaalf
 * bevestigingen vraagt is geen verbetering ten opzichte van twaalf keer zoeken.
 *
 * Wat geen moment heeft gaat niet mee. Het staat bovenaan, apart, met de vraag
 * eronder. Dat is de enige plek waar dit vel iets van je eist, en het is de
 * reden dat je de rest in één tik kunt goedkeuren: een gok die eruitziet als
 * een zekerheid is precies wat je niet wilt in iets wat je ongezien bevestigt.
 */
import { useState } from 'react'
import { Chip, Kaart, Keuzechip, Knop, Kop, Rij, Spin, Tussen, Venster } from '../onderdelen/basis'
import { Bron } from '../herkomst'
import { dec, dz } from '@/gedeeld/getal'
import { roep } from '@/gedeeld/db/rpc'
import type { NieuweRegel } from '@/gedeeld/db/rpc'
import type { IsoDatum, Moment } from '@/gedeeld/db/tabellen'
import { verslag } from '../ai'
import type { Dagherkenning } from '../ai'
import {
  DAGDELEN, beginKeuzes, naarRegels, naarTrainingen, nogTePlaatsen, optellen, vakken,
  verplaats, weglaten,
} from '../dagverslag'
import type { Dagtraining, Keuze } from '../dagverslag'

const NAAM: Record<Moment, string> = {
  ontbijt: 'Ontbijt', lunch: 'Lunch', diner: 'Diner',
  tussendoor: 'Tussendoor', onbekend: 'Waar hoort dit?',
}

const VOORBEELD = 'Vanochtend twee bruine boterhammen met jonge kaas en een '
  + 'cappuccino. Tussen de middag een broodje zalm van de Lidl met een '
  + 'cherrytomaatje erbij. Vanmiddag een handje amandelen. Vanavond tajine met '
  + 'kip en brood. En ik heb bankgedrukt, drie sets van tien met veertig kilo.'

export function DagverslagVenster(
  { token, datum, opSluiten, opGedaan }:
  {
    token: string
    datum: IsoDatum
    opSluiten: () => void
    /** Eén keer aangeroepen, met alles er tegelijk in. */
    opGedaan: (regels: NieuweRegel[]) => void
  },
) {
  const [tekst, zetTekst] = useState('')
  const [loopt, zetLoopt] = useState(false)
  const [melding, zetMelding] = useState<string | null>(null)
  const [uitslag, zetUitslag] = useState<Dagherkenning | null>(null)
  const [keuzes, zetKeuzes] = useState<Keuze[]>([])
  const [trainingen, zetTrainingen] = useState<Dagtraining[]>([])

  async function herken() {
    if (tekst.trim().length < 10) {
      zetMelding('Vertel eerst wat je vandaag gegeten hebt.')
      return
    }
    zetLoopt(true)
    zetMelding(null)
    try {
      const uit = await verslag(token, tekst.trim())
      zetUitslag(uit)
      zetKeuzes(beginKeuzes(uit.regels))
      zetTrainingen(uit.trainingen ?? [])
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  /* Eén knop, twee tabellen. Dat de training via een andere databasefunctie gaat
     dan het eten is hier niet te zien en hoort hier niet te zien te zijn.

     De trainingen gaan eerst en één voor één, want `kal_rij_toevoegen` neemt één
     rij. Het eten gaat daarna in één keer via `opGedaan`, dat het venster ook
     sluit — anders zou de gebruiker het vel al dicht zien terwijl de trainingen
     nog onderweg zijn. */
  async function bewaar() {
    const rijen = naarTrainingen(trainingen, datum)
    zetLoopt(true)
    try {
      for (const rij of rijen) {
        await roep('kal_rij_toevoegen', { p_token: token, p_tabel: 'training', p_rij: rij })
      }
    } catch (e) {
      zetLoopt(false)
      zetMelding(e instanceof Error ? e.message : String(e))
      return
    }
    zetLoopt(false)
    opGedaan(naarRegels(keuzes, datum))
    opSluiten()
  }

  const los = nogTePlaatsen(keuzes)
  const gaan = keuzes.filter((k) => k.moment !== 'onbekend')
  const tot = optellen(gaan)

  return (
    <Venster titel="Vertel je dag" opSluiten={opSluiten}>
      {!uitslag ? (
        <>
          <p className="klein">
            Schrijf of spreek in wat je vandaag gegeten hebt, in gewone woorden, in
            de volgorde waarin het je te binnen schiet. De microfoonknop op je eigen
            toetsenbord doet het inspreken; deze app neemt zelf niets op.
          </p>
          <textarea style={{ marginTop: 10, minHeight: 160 }} value={tekst}
                    onChange={(e) => zetTekst(e.target.value)}
                    placeholder="Vanochtend twee boterhammen met kaas, tussen de middag een broodje zalm…" />
          <Rij style={{ marginTop: 8 }}>
            <Keuzechip opKlik={() => zetTekst(VOORBEELD)}>Voorbeeld</Keuzechip>
          </Rij>
          <button type="button" className="hoofdknop" style={{ marginTop: 10 }}
                  disabled={loopt} onClick={() => void herken()}>
            {loopt ? <><Spin /> Bezig met uitzoeken…</> : 'Uitzoeken'}
          </button>
          <p className="klein" style={{ marginTop: 8 }}>
            {loopt
              ? 'Dit duurt een halve minuut. Elk onderdeel wordt in het Nederlands '
                + 'Voedingsstoffenbestand opgezocht; de voedingswaarde komt uit die tabel '
                + 'en niet uit het geheugen van het model.'
              : melding}
          </p>
        </>
      ) : (
        <>
          {/* WAT ER NOG VAN JE GEVRAAGD WORDT, EERST

              Eén regel die het vel samenvat, en die het getal noemt dat telt:
              hoeveel er straks ingaat. Staat daar iets anders dan wat je verwacht,
              dan zie je dat hier en niet pas in het dagtotaal van morgen. */}
          <p className="klein">
            <span className="cijfer">{gaan.length}</span> van{' '}
            <span className="cijfer">{keuzes.length}</span> regels gaan erin
            {los > 0 && <>, <span className="cijfer">{los}</span> wacht{los === 1 ? '' : 'en'} nog op een plek</>}
            {trainingen.length > 0 && (
              <>, en <span className="cijfer">{trainingen.length}</span>{' '}
                {trainingen.length === 1 ? 'oefening' : 'oefeningen'}</>
            )}.
          </p>

          {vakken(keuzes).map((vak) => (
            <Kaart plat key={vak.moment} style={{ marginTop: 10 }}
                   toon={vak.moment === 'onbekend' ? 'let' : undefined}>
              <Tussen>
                <Kop>{NAAM[vak.moment]}</Kop>
                <span className="mini cijfer">{dz(Math.round(optellen(vak.keuzes).kcal))} kcal</span>
              </Tussen>
              {vak.moment === 'onbekend' && (
                <p className="mini" style={{ marginTop: 2 }}>
                  Uit je verslag bleek niet wanneer je dit at. Wijs het aan, of laat het weg:
                  onaangewezen gaat het niet mee.
                </p>
              )}
              <div className="lijst" style={{ marginTop: 6 }}>
                {vak.keuzes.map((k) => (
                  <div key={k.sleutel} style={{ flexWrap: 'wrap' }}>
                    <Chip graad={k.regel.conf} />
                    <span className="groei">
                      <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>
                        {k.regel.naam}
                      </span>
                      <span className="mini"><Bron regel={k.regel} /></span>
                    </span>
                    <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span className="cijfer" style={{ fontSize: '.85rem', display: 'block' }}>
                        {dz(k.regel.kcal_punt)}
                      </span>
                      <span className="mini cijfer">{dz(k.regel.kcal_laag)}–{dz(k.regel.kcal_hoog)}</span>
                    </span>
                    <Knop klein titel={`${k.regel.naam} weglaten`}
                          opKlik={() => zetKeuzes(weglaten(keuzes, k.sleutel))}>×</Knop>
                    {/* Verschuiven zonder het vel te verlaten. De vier chips
                        staan er altijd, ook bij een regel die al goed staat: een
                        knop die pas verschijnt als je hem nodig hebt vind je
                        niet, en het model zit er soms naast op een regel die er
                        verder prima uitziet.

                        Ze staan op een eigen regel en niet naast de naam. Naast
                        de naam paste het op een telefoon niet: de band brak over
                        twee regels en "Tussendoor" viel van het scherm. Met
                        flexBasis 100% breken ze af binnen dezelfde rij, zodat ze
                        wel bij deze regel blijven horen. */}
                    <span className="momentkeuze" style={{ flexBasis: '100%', marginTop: 6 }}>
                      {DAGDELEN.map((m) => (
                        <button type="button" key={m}
                                className={'momentchip' + (k.moment === m ? ' aan' : '')}
                                aria-pressed={k.moment === m}
                                onClick={() => zetKeuzes(verplaats(keuzes, k.sleutel, m))}>
                          {NAAM[m]}
                        </button>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </Kaart>
          ))}

          {trainingen.length > 0 && (
            <Kaart plat style={{ marginTop: 10 }}>
              <Kop>Getraind</Kop>
              <div className="lijst" style={{ marginTop: 6 }}>
                {trainingen.map((t, i) => (
                  <div key={i}>
                    <span className="groei">
                      <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>
                        {t.oefening}
                      </span>
                      {/* Wat er niet genoemd is blijft leeg en wordt ook leeg
                          getoond. "3 × 10" waar niemand een aantal noemde is een
                          getal dat je later terugleest als iets wat je gezegd hebt. */}
                      <span className="mini">{beschrijf(t)}</span>
                    </span>
                    <Knop klein titel={`${t.oefening} weglaten`}
                          opKlik={() => zetTrainingen(trainingen.filter((_, j) => j !== i))}>×</Knop>
                  </div>
                ))}
              </div>
            </Kaart>
          )}

          {uitslag.opmerking && (
            <p className="klein" style={{ marginTop: 10 }}>{uitslag.opmerking}</p>
          )}
          {melding && <p className="klein" style={{ marginTop: 8 }}>{melding}</p>}

          <Kaart plat style={{ marginTop: 12 }}>
            <Tussen>
              <span className="cijfer" style={{ fontSize: '.9rem' }}>
                <b>{dz(Math.round(tot.kcal))} kcal</b>{' '}
                {/* De band gaat mee tot in het totaal. Zie `optellen`: geen
                    enkel getal zonder zijn onzekerheid, en een dagtotaal is
                    precies het getal waarvan je denkt dat het wel exact is. */}
                <span className="klein">
                  ({dz(Math.round(tot.laag))}–{dz(Math.round(tot.hoog))}) · {dec(tot.eiwit, 1)} g eiwit
                </span>
              </span>
              <Knop vol opKlik={() => void bewaar()}>
                {loopt ? <><Spin /> Bezig…</> : 'Alles toevoegen'}
              </Knop>
            </Tussen>
            <p className="mini" style={{ marginTop: 6 }}>
              {uitslag.model}
              {los > 0 && ` · ${los} regel${los === 1 ? '' : 's'} zonder plek gaat niet mee`}
            </p>
          </Kaart>
        </>
      )}
    </Venster>
  )
}

/**
 * De regel onder een oefening.
 *
 * De spiergroep en de aantallen staan hier los van elkaar, en dat is niet
 * netheid. Eerst stonden ze in één lijst waar het lege eruit gefilterd werd,
 * met "geen aantallen genoemd" als de lijst leeg bleef — en bij een oefening
 * mét spiergroep en zónder aantallen bleef die lijst niet leeg. Er stond dan
 * alleen "rug", wat leest als een complete regel. De schermproef viel erover.
 *
 * Dat er niets genoemd is, is hier informatie en geen leegte: het zegt dat je
 * die oefening gedaan hebt en dat niemand weet hoe zwaar. Dat hoort er te staan.
 */
function beschrijf(t: Dagtraining): string {
  const aantallen = [
    t.sets != null && t.reps != null ? `${t.sets} × ${t.reps}`
      : t.sets != null ? `${t.sets} sets`
      : t.reps != null ? `${t.reps} herhalingen` : null,
    t.gewicht_kg != null ? `${dec(t.gewicht_kg, 1)} kg` : null,
  ].filter(Boolean)
  return [t.spiergroep, aantallen.length ? aantallen.join(' · ') : 'geen aantallen genoemd']
    .filter(Boolean).join(' · ')
}
