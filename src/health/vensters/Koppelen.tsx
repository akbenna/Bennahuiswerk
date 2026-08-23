/**
 * KOPPELEN — bewegingsgegevens van je horloge en je telefoon binnenhalen.
 *
 * Waarom dit er zo uitziet en niet als een knop met "Verbind met Garmin":
 *
 * Garmin heeft een echte Health API, maar die zit achter het Connect Developer
 * Program: een aanvraag, een rechtspersoon, en goedkeuring per partij. Voor één
 * huishouden is dat niet te doen, en het programma neemt op dit moment geen
 * nieuwe aanmeldingen aan. Apple Gezondheid heeft helemaal geen web-API: die
 * gegevens komen alleen van het toestel af, via een app op het toestel zelf.
 *
 * Wat wél werkt en geen toestemming van iemand nodig heeft: de Opdrachten-app
 * op de iPhone leest Gezondheid uit en mag zelf een verzoek versturen. En de
 * Garmin Connect-app schrijft zijn stappen, slaap, trainingen en gewicht in
 * Apple Gezondheid. Eén weg dekt dus allebei de bronnen — het horloge meet, de
 * Garmin-app zet het in Gezondheid, en de opdracht stuurt het elke ochtend
 * hierheen.
 *
 * De sleutel hieronder is dat wat de opdracht meestuurt. Hij verloopt niet,
 * want een koppeling die elke ochtend vuurt mag niet stilvallen omdat je een
 * week niet ingelogd bent. Hij staat als hash in de database en is één keer te
 * zien: bij het maken.
 */
import { useEffect, useState } from 'react'
import { Kaart, Knop, Kop, Rij, Spin, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import { ANON_SLEUTEL, DATABASE_URL } from '@/gedeeld/db/verbinding'
import { roep } from '@/gedeeld/db/rpc'
import type { Koppeling } from '@/gedeeld/db/rpc'
import { kortNL } from '@/gedeeld/datum'

const ENDPOINT = DATABASE_URL + '/rest/v1/rpc/kal_beweging_ontvangen'

/** Het lichaam dat de opdracht moet versturen, met de sleutel er al in. */
function voorbeeldLichaam(sleutel: string): string {
  return JSON.stringify({
    p_sleutel: sleutel,
    p_dagen: [{
      datum: '2026-08-23', stappen: 8421, slaap_min: 447,
      actieve_energie_kcal: 612, fiets_min: 0,
    }],
  }, null, 2)
}

export function KoppelVenster(
  { token, opSluiten, opVernieuwen }:
  { token: string; opSluiten: () => void; opVernieuwen: () => void },
) {
  const [lijst, zetLijst] = useState<Koppeling[] | null>(null)
  const [naam, zetNaam] = useState('iPhone')
  const [nieuw, zetNieuw] = useState<string | null>(null)
  const [melding, zetMelding] = useState<string | null>(null)
  const [loopt, zetLoopt] = useState(false)

  async function laden() {
    try {
      const uit = await roep('kal_koppelingen_lijst', { p_token: token })
      /* De functie geeft een json-lijst terug. Een server die iets anders
         teruggeeft mag het scherm niet omver halen — dan liever geen lijst. */
      zetLijst(Array.isArray(uit) ? uit : [])
    } catch (e) {
      zetLijst([])
      zetMelding(e instanceof Error ? e.message : String(e))
    }
  }
  useEffect(() => { void laden() }, [token])

  async function maken() {
    zetLoopt(true); zetMelding(null)
    try {
      const uit = await roep('kal_koppeling_maken', { p_token: token, p_naam: naam })
      zetNieuw(uit.sleutel)
      await laden()
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally { zetLoopt(false) }
  }

  async function wissen(id: string) {
    zetMelding(null)
    try { await roep('kal_koppeling_wissen', { p_token: token, p_id: id }); await laden() }
    catch (e) { zetMelding(e instanceof Error ? e.message : String(e)) }
  }

  /* De verbinding proberen langs precies dezelfde weg als de opdracht straks
     loopt, met een lege dagenlijst. Dat bewijst de sleutel en het endpoint
     zonder één getal weg te schrijven. */
  async function proberen(sleutel: string) {
    zetLoopt(true); zetMelding(null)
    try {
      await roep('kal_beweging_ontvangen', { p_sleutel: sleutel, p_dagen: [] })
      zetMelding('De sleutel werkt: de server heeft hem herkend. Er is niets weggeschreven, '
        + 'want er zaten geen dagen in het bericht.')
      await laden()
    } catch (e) {
      zetMelding('Werkt niet: ' + (e instanceof Error ? e.message : String(e)))
    } finally { zetLoopt(false) }
  }

  return (
    <Venster titel="Koppelen met je horloge en telefoon" opSluiten={() => { opVernieuwen(); opSluiten() }}>
      <p className="klein" style={{ marginTop: 8 }}>
        Stappen, slaap, fietsminuten en actieve energie kunnen hier vanzelf binnenkomen — elke
        ochtend, zonder dat je iets overtikt. Je gewicht niet: zie onderaan waarom.
      </p>

      {/* ---------------------------------------------------- de sleutels --- */}
      <div style={{ marginTop: 16 }}><Kop>Sleutels</Kop></div>
      {lijst == null ? (
        <p className="klein" style={{ marginTop: 6 }}><Spin /> Laden…</p>
      ) : lijst.length === 0 ? (
        <p className="klein" style={{ marginTop: 6 }}>
          Nog geen sleutel. Maak er een aan, dan volgt hieronder wat je op de telefoon doet.
        </p>
      ) : (
        <div className="lijst" style={{ marginTop: 6 }}>
          {lijst.map((k) => (
            <div key={k.id}>
              <span className="groei">
                <span className="knip" style={{ fontSize: '.88rem', display: 'block' }}>{k.naam}</span>
                <span className="mini">
                  {k.sleutel_begin}… · {k.laatst_gebruikt_op
                    ? `laatst ontvangen ${kortNL(k.laatst_gebruikt_op.slice(0, 10))}`
                    : 'nog niets ontvangen'}
                  {k.aantal_berichten > 0 && ` · ${k.aantal_berichten} berichten, ${k.aantal_dagen} dagen`}
                </span>
              </span>
              <Knop klein titel={`${k.naam} intrekken`} opKlik={() => void wissen(k.id)}>×</Knop>
            </div>
          ))}
        </div>
      )}

      <Rij style={{ marginTop: 10 }}>
        <input value={naam} onChange={(e) => zetNaam(e.target.value)} aria-label="Naam van de sleutel"
               style={{ flex: '1 1 140px', width: 'auto' }} placeholder="iPhone" />
        <Knop vol uit={loopt} opKlik={() => void maken()}>Sleutel maken</Knop>
      </Rij>

      {nieuw && (
        <Kaart toon="let" style={{ marginTop: 12 }}>
          <Kop>Je sleutel — je ziet hem één keer</Kop>
          <p className="mini" style={{ marginTop: 4 }}>
            Er staat alleen een hash van deze sleutel in de database. Sluit je dit venster, dan is hij
            weg en maak je een nieuwe. Dat is bewust: een sleutel die terug te lezen valt is een
            sleutel die uit de database te stelen valt.
          </p>
          <Kopieer waarde={nieuw} label="Sleutel" />
          <Rij style={{ marginTop: 8 }}>
            <Knop uit={loopt} opKlik={() => void proberen(nieuw)}>Verbinding proberen</Knop>
          </Rij>
        </Kaart>
      )}

      {melding && <p className="klein" style={{ marginTop: 10 }}>{melding}</p>}

      {/* ------------------------------------------------- wat je invoert --- */}
      <Kaart plat style={{ marginTop: 14 }}>
        <Kop>Wat je in de Opdrachten-app zet</Kop>
        <p className="klein" style={{ marginTop: 4 }}>
          Op de iPhone, in <em>Opdrachten</em> → <em>Automatisering</em> → <em>Tijdstip</em>, bijvoorbeeld
          elke dag om 07:00. Eén actie is genoeg: <em>Verkrijg inhoud van URL</em>.
        </p>
        <ol className="stappen">
          <li>
            <b>URL</b> — <Kopieer waarde={ENDPOINT} label="Endpoint" />
          </li>
          <li><b>Methode</b> — POST</li>
          <li>
            <b>Kopteksten</b> — drie stuks:
            <Kopieer waarde={ANON_SLEUTEL} label="apikey" />
            <p className="mini" style={{ marginTop: 4 }}>
              Zet dezelfde waarde ook onder <code>Authorization</code>, met <code>Bearer </code>
              ervoor. En <code>Content-Type</code> op <code>application/json</code>. Deze sleutel is
              openbaar en geeft uit zichzelf nergens toegang toe — die van jou hierboven wel.
            </p>
          </li>
          <li>
            <b>Verzoektekst</b> — JSON, in deze vorm. De getallen komen uit
            <em> Zoek gezondheidsmonsters</em>-acties; de datum uit <em>Huidige datum</em>, opgemaakt
            als <code>jjjj-MM-dd</code>.
            <Kopieer waarde={voorbeeldLichaam(nieuw ?? 'kal_…jouw sleutel…')} label="Verzoektekst"
                     meerregelig />
          </li>
        </ol>
        <p className="mini" style={{ marginTop: 8 }}>
          Velden die je weglaat blijven staan zoals ze stonden. Je hoeft dus niet alles mee te sturen —
          alleen stappen is ook goed, en er komt later gewoon meer bij.
        </p>
      </Kaart>

      {/* ------------------------------------------------------- Garmin ----- */}
      <Kaart plat style={{ marginTop: 12 }}>
        <Kop>En Garmin?</Kop>
        <p className="klein" style={{ marginTop: 4 }}>
          Die loopt mee over dezelfde weg. Zet in de Garmin Connect-app <em>Meer</em> →{' '}
          <em>Instellingen</em> → <em>Verbonden apps</em> → <em>Apple Gezondheid</em> aan, en kies daar
          stappen, slaap, trainingen en gewicht. Garmin schrijft die dan in Gezondheid, en de opdracht
          hierboven haalt ze daar op. Eén koppeling, twee bronnen.
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Let op de volgorde van de bronnen in Gezondheid: staat je iPhone boven Garmin Connect, dan
          krijg je de stappen van je telefoon in plaats van die van je horloge. Dat staat onder
          Gezondheid → het gegeven → <em>Gegevensbronnen en toegang</em>.
        </p>
        <Uitleg id="garminapi" label="waarom niet rechtstreeks op de Garmin-API">
          <p>
            Die bestaat en doet precies wat je wilt — dagelijkse totalen, slaap, activiteiten — maar
            hij zit achter het Garmin Connect Developer Program. Dat vraagt een aanvraag namens een
            rechtspersoon en goedkeuring per partij, en het programma neemt op dit moment geen nieuwe
            aanmeldingen aan. Voor één huishouden is dat geen begaanbare weg.
          </p>
          <p>
            Verandert dat, dan is de omweg via Gezondheid zo te vervangen: alles wat binnenkomt gaat
            door dezelfde functie, dus er hoeft aan deze kant niets te veranderen. En één voordeel
            houdt de omweg sowieso: je gegevens gaan van je telefoon rechtstreeks naar je eigen
            database, zonder tussenpartij die meekijkt.
          </p>
        </Uitleg>
      </Kaart>

      {/* ------------------------------------------ wat er níét gebeurt ----- */}
      <Kaart plat style={{ marginTop: 12 }}>
        <Kop>Wat een koppeling niet overschrijft</Kop>
        <p className="klein" style={{ marginTop: 4 }}>
          Stappen, slaap, fietsminuten en actieve energie worden vervangen door wat er binnenkomt: dat
          zijn metingen, en een meting is beter dan wat jij je herinnert.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Je <b>gewicht</b> gaat precies andersom. Een dag waar al een weging staat wordt nooit
          overschreven; alleen lege dagen worden aangevuld. Het model rekent op de ochtendweging
          volgens protocol — nuchter, na het toilet, vóór het eten — en een weegschaal die 's avonds
          met kleren aan een getal doorgeeft meet iets anders. Twee metingen door elkaar geven een
          helling die nergens op slaat.
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          Krachttraining en je notities blijven ook onaangeraakt: dat is een oordeel van jou en geen
          meting. En actieve energie komt binnen als volume-indicator, maar telt nergens mee in het
          verbruik — zie het scherm Beweging voor waarom.
        </p>
      </Kaart>
    </Venster>
  )
}

/**
 * Een waarde met een kopieerknop.
 *
 * Op een telefoon is een sleutel van achtenveertig tekens overtikken geen optie
 * en selecteren met je vinger nauwelijks. De knop valt terug op selecteren als
 * het klembord niet mag — dat mag namelijk alleen in een beveiligde context.
 */
function Kopieer(
  { waarde, label, meerregelig }: { waarde: string; label: string; meerregelig?: boolean },
) {
  const [gedaan, zetGedaan] = useState(false)

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(waarde)
      zetGedaan(true)
      setTimeout(() => zetGedaan(false), 2000)
    } catch {
      /* Geen klembord: dan maar zelf selecteren. Beter dan een knop die niets
         doet en niets zegt. */
      const el = document.getElementById('kop-' + label)
      if (el) {
        const bereik = document.createRange()
        bereik.selectNodeContents(el)
        getSelection()?.removeAllRanges()
        getSelection()?.addRange(bereik)
      }
    }
  }

  return (
    <Tussen style={{ marginTop: 6, alignItems: 'flex-start', gap: 8 }}>
      <code id={'kop-' + label} className={'sleutelvak' + (meerregelig ? ' meer' : '')}>{waarde}</code>
      <Knop klein titel={`${label} kopiëren`} opKlik={() => void kopieer()}>
        {gedaan ? '✓' : 'kopieer'}
      </Knop>
    </Tussen>
  )
}
