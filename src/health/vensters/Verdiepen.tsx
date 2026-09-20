/**
 * VERDIEPEN: het boekje over afvallen, medicatie en wat je vasthoudt
 *
 * Zelfde vorm als het venster Leren, ander onderwerp. Leren gaat over je
 * aandoening; dit gaat over wat er gebeurt als je afvalt, met of zonder
 * medicijn.
 *
 * ELK STUK HEEFT VIER DELEN, EN DE VOLGORDE IS EEN BESLUIT
 *
 * Eerst wat we weten, dan wat we niet weten, dan waar je het in de app
 * terugziet, dan de bron. Dat tweede deel staat dus vóór het nut en niet in een
 * voetnoot eronder. In deze markt zijn de claims hard en het bewijs zacht; wie
 * het voorbehoud onderaan zet, weet dat niemand het leest.
 *
 * DIT VENSTER LEEST ANDERS DAN DE ANDERE, DUS HET ZIET ER ANDERS UIT
 *
 * Alle andere vensters zijn er om iets te doen: een waarde invullen, een keuze
 * maken, één uitleg lezen. Dit is het enige waar je in terugleest. Het is
 * daarom breder, de stukken hebben een echte titel in plaats van een
 * bovenschrift, en de hoeveelheden springen eruit: wie opzoekt hoeveel er na
 * een jaar terugkwam, hoort dat getal te zien vóór hij de zin eromheen leest.
 * Wat er wel en niet als hoeveelheid telt staat in `nadruk.tsx`.
 *
 * WAT HIER NIET GEBEURT
 *
 * Geen enkel stuk leest iets van de gebruiker. Zie de kop van `verdieping.ts`:
 * onder MDCG 2019-11 is een boekje geen hulpmiddel, en dezelfde tekst met jouw
 * getallen erin zou dat wel zijn. Het veld "waar je dit terugziet" verwijst
 * daarom naar een scherm en rekent zelf niets uit.
 */
import { metNadruk } from '../nadruk'
import { Kaart, Kop, Uitklap, Venster } from '../onderdelen/basis'
import { VERDIEPINGEN } from '../verdieping'

/* Een aantal in een lopende zin hoort voluit. Het staat hier en niet in de
   tekst, want dan klopt het ook nadat er een stuk bij komt. */
const TELWOORD = ['Geen', 'Eén', 'Twee', 'Drie', 'Vier', 'Vijf', 'Zes', 'Zeven',
                  'Acht', 'Negen', 'Tien', 'Elf', 'Twaalf']

export function VerdiepVenster({ opSluiten }: { opSluiten: () => void }) {
  const aantal = TELWOORD[VERDIEPINGEN.length] ?? String(VERDIEPINGEN.length)

  return (
    <Venster titel="Verdiepen" breed opSluiten={opSluiten}>
      <div className="naslag">
        <p style={{ marginTop: 4 }}>
          {aantal} stukken over afvallen, medicatie en wat je onderweg vasthoudt. Bij
          elk stuk staat wat we weten, wat we <i>niet</i> weten, waar je het in de app terugziet,
          en waar het vandaan komt.
        </p>

        {/* Geen kaart om de Uitklap heen: die levert er zelf al een. Een kaart in
            een kaart geeft een doos in een doos. */}
        {VERDIEPINGEN.map((v) => (
          <div key={v.id} style={{ marginTop: 12 }}>
            <Uitklap id={'verdiep-' + v.id} kop={v.titel} dicht={v.kort}>
              {v.weten.map((alinea, i) => (
                <p key={i} style={{ marginTop: 10 }}>{metNadruk(alinea)}</p>
              ))}

              {/* Het voorbehoud staat in een eigen vak en niet als kleine letter
                  onderaan. Het is geen disclaimer maar de helft van het stuk. */}
              <Kaart toon="let" plat style={{ marginTop: 16 }}>
                <Kop>Wat we niet weten</Kop>
                {v.nietWeten.map((alinea, i) => (
                  <p key={i} className="klein" style={{ marginTop: i === 0 ? 6 : 9 }}>
                    {metNadruk(alinea)}
                  </p>
                ))}
              </Kaart>

              <p className="klein" style={{ marginTop: 14 }}>
                <b>Waar je dit terugziet:</b> {v.inDeApp}
              </p>
              <p className="mini" style={{ marginTop: 8 }}>Bron: {v.bron}</p>
            </Uitklap>
          </div>
        ))}

        <p className="mini" style={{ marginTop: 16 }}>
          Voorlichting, geen persoonlijk advies. Deze app schrijft geen medicijnen voor, beoordeelt
          geen dosering en zegt niet of iets voor jou geschikt is. Dat hoor je van je huisarts.
        </p>
      </div>
    </Venster>
  )
}
