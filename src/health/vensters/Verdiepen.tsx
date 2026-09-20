/**
 * VERDIEPEN — het boekje over afvallen, medicatie en wat je vasthoudt
 *
 * Zelfde vorm als het venster Leren, ander onderwerp. Leren gaat over je
 * aandoening; dit gaat over wat er gebeurt als je afvalt — met of zonder
 * medicijn.
 *
 * ELK STUK HEEFT VIER DELEN, EN DE VOLGORDE IS EEN BESLUIT
 *
 * Eerst wat we weten, dan wat we niet weten, dan waar je het in de app
 * terugziet, dan de bron. Dat tweede deel staat dus vóór het nut en niet in een
 * voetnoot eronder. In deze markt zijn de claims hard en het bewijs zacht; wie
 * het voorbehoud onderaan zet, weet dat niemand het leest.
 *
 * WAT HIER NIET GEBEURT
 *
 * Geen enkel stuk leest iets van de gebruiker. Zie de kop van `verdieping.ts`:
 * onder MDCG 2019-11 is een boekje geen hulpmiddel, en dezelfde tekst met jouw
 * getallen erin zou dat wel zijn. Het veld "waar je dit terugziet" verwijst
 * daarom naar een scherm en rekent zelf niets uit.
 */
import { Kaart, Kop, Uitklap, Venster } from '../onderdelen/basis'
import { VERDIEPINGEN } from '../verdieping'

export function VerdiepVenster({ opSluiten }: { opSluiten: () => void }) {
  return (
    <Venster titel="Verdiepen" opSluiten={opSluiten}>
      <p style={{ fontSize: '.92rem' }}>
        Acht stukken over afvallen, medicatie en wat je onderweg vasthoudt. Bij elk stuk staat wat
        we weten, wat we <i>niet</i> weten, en waar het vandaan komt.
      </p>

      {/* Geen kaart om de Uitklap heen: die levert er zelf al een. Een kaart in
          een kaart geeft een doos in een doos. */}
      {VERDIEPINGEN.map((v) => (
        <div key={v.id} style={{ marginTop: 10 }}>
          <Uitklap id={'verdiep-' + v.id} kop={v.titel} dicht={v.kort}>
            {v.weten.map((alinea, i) => (
              <p key={i} style={{ fontSize: '.92rem', marginTop: i === 0 ? 0 : 8 }}>{alinea}</p>
            ))}

            {/* Het voorbehoud staat in een eigen vak en niet als kleine letter
                onderaan. Het is geen disclaimer maar de helft van het stuk. */}
            <Kaart toon="let" plat style={{ marginTop: 12 }}>
              <Kop>Wat we niet weten</Kop>
              {v.nietWeten.map((alinea, i) => (
                <p key={i} className="klein" style={{ marginTop: i === 0 ? 4 : 8 }}>{alinea}</p>
              ))}
            </Kaart>

            <p className="klein" style={{ marginTop: 12 }}>
              <b>Waar je dit terugziet:</b> {v.inDeApp}
            </p>
            <p className="mini" style={{ marginTop: 8 }}>Bron: {v.bron}</p>
          </Uitklap>
        </div>
      ))}

      <p className="mini" style={{ marginTop: 14 }}>
        Voorlichting, geen persoonlijk advies. Deze app schrijft geen medicijnen voor, beoordeelt
        geen dosering en zegt niet of iets voor jou geschikt is. Dat hoor je van je huisarts.
      </p>
    </Venster>
  )
}
