/**
 * JE WEGINGEN NALOPEN
 *
 * De app merkte een weging die niet bij de reeks past wel aan, maar liet je er
 * niets mee doen: "zet hem recht op de dag zelf" betekende zelf uitzoeken welke
 * dag het was, erheen bladeren en overtypen. Voor één weging gaat dat. Wie een
 * maand met de app heeft zitten spelen voordat hij hem echt ging gebruiken,
 * heeft er tien, en dan blijft er een reeks staan met een 190 erin.
 *
 * DRIE REGELS, EN ZE VOLGEN UIT WAT DE APP AL BELOOFDE
 *
 * **De app haalt niets uit zichzelf weg.** Elke regel hier is een tik van jou.
 * Een grens waarbuiten wegingen vanzelf verdwijnen zit er niet in, en waarom
 * niet staat in de kop van `wegingen.ts`: in een app om af te vallen zou zo'n
 * band precies het resultaat weggooien dat hij moet meten.
 *
 * **Weghalen is terug te draaien zolang dit venster openstaat.** De regel blijft
 * staan met wat erin stond, en de knop ernaast zet hem terug. Zonder dat is één
 * misgetikte rij een getal dat je nooit meer terugvindt.
 *
 * **Je ziet wat je overhoudt.** Onder de lijst staat hoeveel wegingen er
 * overblijven en tussen welke twee waarden die liggen. Wegstrepen zonder dat
 * getal is een sprong in het duister, en je kunt de reeks hier leegmaken.
 */
import { useState } from 'react'
import { Kaart, Keuzechip, Knop, Kop, Rij, Tussen, Venster } from '../onderdelen/basis'
import { dec } from '@/gedeeld/getal'
import { kortNL } from '@/gedeeld/datum'
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import type { Trendpunt } from '../rekenkern'
import { wegingen, zonder } from '../wegingen'

export function WegingVenster(
  { reeks, zetGewicht, opSluiten }:
  {
    reeks: readonly Trendpunt[]
    /** Een weging rechtzetten of weghalen. Null haalt hem weg. */
    zetGewicht: (datum: IsoDatum, kg: number | null) => void
    opSluiten: () => void
  },
) {
  const lijst = wegingen(reeks)
  const gemerkt = lijst.filter((w) => w.uitbijter)
  /* Wat deze zitting heeft weggehaald, met de waarde die erin stond. De reeks
     zelf is dan al bijgewerkt, dus zonder dit zou de regel verdwijnen en was
     terugzetten niet meer mogelijk. */
  const [weg, zetWeg] = useState<Array<{ datum: IsoDatum; kg: number }>>([])
  const [alles, zetAlles] = useState(gemerkt.length === 0)

  const toon = alles ? lijst : lijst.filter((w) => w.uitbijter)
  const rijen = [
    ...toon.map((w) => ({ ...w, weggehaald: false })),
    ...weg.filter((x) => !lijst.some((w) => w.datum === x.datum))
      .map((x) => ({ ...x, afwijkingKg: null, uitbijter: false, weggehaald: true })),
  ].sort((a, b) => b.datum.localeCompare(a.datum))

  const straks = zonder(lijst, new Set())

  function haalWeg(datum: IsoDatum, kg: number) {
    zetWeg((was) => [...was.filter((x) => x.datum !== datum), { datum, kg }])
    zetGewicht(datum, null)
  }

  function zetTerug(datum: IsoDatum, kg: number) {
    zetWeg((was) => was.filter((x) => x.datum !== datum))
    zetGewicht(datum, kg)
  }

  return (
    <Venster titel="Je wegingen" opSluiten={opSluiten}>
      <p style={{ fontSize: '.92rem' }}>
        Elke dag waarop je gewogen bent. Klopt een getal niet, zet het dan recht of haal het weg.
        De app doet dat nooit uit zichzelf: hij kan niet weten of er een tweede persoon op de
        weegschaal stond of dat er een toets misging.
      </p>
      {gemerkt.length > 0 && (
        <p className="mini" style={{ marginTop: 6 }}>
          {gemerkt.length === 1
            ? 'Eén weging past niet bij de dagen eromheen.'
            : `${gemerkt.length} wegingen passen niet bij de dagen eromheen.`}
          {' '}Ze staan met een kringetje in de figuur en hieronder bovenaan.
        </p>
      )}

      <Tussen style={{ marginTop: 14 }}>
        <Kop>{alles ? `Alle ${lijst.length} wegingen` : `${gemerkt.length} om na te lopen`}</Kop>
        <Keuzechip aan={alles} opKlik={() => zetAlles((x) => !x)}>
          {alles ? 'alleen de opvallende' : 'toon alles'}
        </Keuzechip>
      </Tussen>

      <Kaart plat style={{ marginTop: 8 }}>
        <div className="lijst">
          {rijen.map((w) => (
            <div key={w.datum} style={{ opacity: w.weggehaald ? 0.55 : 1 }}>
              <span className="klein" style={{ flex: '0 0 74px' }}>{kortNL(w.datum)}</span>
              {w.weggehaald ? (
                <>
                  <span className="mini groei">weggehaald, stond op {dec(w.kg, 1)} kg</span>
                  <Knop klein opKlik={() => zetTerug(w.datum, w.kg)}>terugzetten</Knop>
                </>
              ) : (
                <>
                  <input type="number" step="0.1" inputMode="decimal" defaultValue={w.kg}
                         className="smal" aria-label={`gewicht op ${kortNL(w.datum)}`}
                         onBlur={(e) => {
                           const n = Number(e.target.value.replace(',', '.'))
                           if (Number.isFinite(n) && n > 0 && n !== w.kg) zetGewicht(w.datum, n)
                         }} />
                  <span className="mini groei">
                    {w.uitbijter && w.afwijkingKg != null
                      ? `${dec(Math.abs(w.afwijkingKg), 1)} kg `
                        + `${w.afwijkingKg > 0 ? 'boven' : 'onder'} de dagen eromheen`
                      : 'kg'}
                  </span>
                  <Knop klein titel={`de weging van ${kortNL(w.datum)} weghalen`}
                        opKlik={() => haalWeg(w.datum, w.kg)}>weghalen</Knop>
                </>
              )}
            </div>
          ))}
          {rijen.length === 0 && (
            <div><span className="mini">Er staat nog geen weging in je reeks.</span></div>
          )}
        </div>
      </Kaart>

      <p className="mini" style={{ marginTop: 10 }}>
        {straks.over === 0
          ? 'Er blijft geen enkele weging over, en zonder wegingen kan de app niets meten.'
          : `Er staan ${straks.over} wegingen in je reeks, van ${dec(straks.laagste, 1)} tot `
            + `${dec(straks.hoogste, 1)} kg. Het model rekent met de gladde lijn erdoorheen, dus `
            + 'één rechtgezette dag verandert de uitkomst maar een beetje, en één weging die er '
            + 'tientallen kilo naast zit verandert hem flink.'}
      </p>
      <Rij style={{ marginTop: 14 }}>
        <Knop vol opKlik={opSluiten}>Klaar</Knop>
      </Rij>
    </Venster>
  )
}
