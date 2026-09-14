/**
 * DE SIGNAALKAARTEN — en waar ze staan
 *
 * Ze stonden eerst op Gezondheid, omdat dat het klinische scherm is. Dat was de
 * verkeerde plek en om een eenvoudige reden: wie insuline spuit en afvalt hoort
 * dat te lezen zonder ernaar te zoeken, en Gezondheid is een tabblad dat je
 * opent als je er iets wilt invullen. Een waarschuwing achter een tik die
 * niemand doet is geen waarschuwing.
 *
 * WAAROM ZE OP VANDAAG TUSSEN DE KNOP EN DE MAALTIJDVAKKEN STAAN
 *
 * De volgorde van Vandaag ligt vast met een reden die in de kop van dat bestand
 * staat: hero, dan de knop, dan de maaltijdvakken. "Wie komt om te doen moet
 * niet eerst langs wat er te lezen valt." Deze kaarten boven de knop zetten zou
 * precies die regel breken — de knop zou naar beneden schuiven zodra iemand
 * diabetes aanvinkt.
 *
 * Direct eronder kan wel. De knop staat waar hij stond, ten opzichte van de
 * hero; wie komt om te loggen mist er niets. En wie leest, leest dit eerst.
 *
 * WAAROM ZE INKLAPPEN
 *
 * Een kaart die er elke dag hetzelfde bij staat wordt na een week niet meer
 * gelezen. Daarom de uitklapper die deze app al kent: de kop zegt waar het over
 * gaat, de regel eronder zegt wat je moet doen — die blijft altijd staan, ook
 * dicht — en de uitleg zit erachter. Zo is het eerste wat je ziet de handeling
 * en niet een alinea.
 *
 * Er zit geen wegklikknop op. Het signaal hoort bij de medicatie en het
 * afvaldoel; verdwijnt een van beide, dan verdwijnt de kaart vanzelf. Iets
 * wegklikken wat nog geldt zou een toestand maken die de app moet onthouden, en
 * de enige eerlijke reden om hem te laten verdwijnen is dat hij niet meer waar
 * is.
 */
import { Kaart, Uitklap } from './onderdelen/basis'
import { conditieVan, signalen } from './conditie'
import type { Profiel } from '@/gedeeld/db/tabellen'

export function Signaalkaarten({ profiel }: { profiel: Profiel }) {
  const lijst = signalen(conditieVan(profiel.instellingen), profiel.fase === 'afvallen')
  if (!lijst.length) return null

  return (
    <>
      {lijst.map((s) => (
        <Kaart key={s.id} toon="let" style={{ marginBottom: 14 }}>
          <Uitklap id={'signaal-' + s.id} kop={s.kop} dicht={s.handeling}>
            <p style={{ fontSize: '.92rem' }}>{s.tekst}</p>
            <p className="mini" style={{ marginTop: 8 }}>
              Dit staat er op grond van wat je zelf bij je profiel hebt ingevuld. Voorlichting, geen
              diagnose. Meer hierover staat onder Meer, bij Leren.
            </p>
          </Uitklap>
        </Kaart>
      ))}
    </>
  )
}
