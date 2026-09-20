/**
 * HET VENSTER LEREN: het boekje bij de conditie
 *
 * Een venster en geen tabblad. De balk heeft er zes en dat is genoeg; een
 * zevende erbij zou zeggen dat lezen even vaak gebeurt als loggen, en dat is
 * niet zo. Wie hier komt, komt met een vraag.
 *
 * De bladzijden staan ingeklapt, met die bij jouw conditie bovenaan. Er valt
 * niets weg: verbergen zou suggereren dat de app weet wat er bij iemand speelt,
 * en het enige wat hij weet is wat er is aangevinkt.
 *
 * De teksten zelf staan in `leren.ts` en veranderen niet mee met wie je bent.
 * Waarom dat de hele opzet is, staat in de kop van dat bestand.
 */
import { Kaart, Uitklap, Venster } from '../onderdelen/basis'
import { bladzijden } from '../leren'
import { conditieVan } from '../conditie'
import type { Profiel } from '@/gedeeld/db/tabellen'

export function LerenVenster(
  { profiel, opSluiten }: { profiel: Profiel; opSluiten: () => void },
) {
  const c = conditieVan(profiel.instellingen)
  const lijst = bladzijden(c)

  return (
    <Venster titel="Leren" opSluiten={opSluiten}>
      <p style={{ fontSize: '.92rem' }}>
        Korte stukjes over wat er bij jouw aandoening en medicijnen komt kijken. Ze staan er voor
        iedereen hetzelfde; wat bij jou hoort staat bovenaan.
      </p>

      {lijst.map((b) => (
        <Kaart key={b.id} style={{ marginTop: 10 }}>
          <Uitklap id={'leren-' + b.id} kop={b.titel} dicht={b.tekst[0]?.slice(0, 68) + '…'}>
            {b.tekst.map((alinea, i) => (
              <p key={i} style={{ fontSize: '.92rem', marginTop: i === 0 ? 0 : 8 }}>{alinea}</p>
            ))}
            <p className="mini" style={{ marginTop: 10 }}>Bron: {b.bron}</p>
          </Uitklap>
        </Kaart>
      ))}

      <p className="mini" style={{ marginTop: 14 }}>
        Voorlichting, geen persoonlijk advies. Deze app kent je dosering niet en rekent er niets
        aan. Wat voor jou geldt, hoor je van je huisarts of praktijkondersteuner.
      </p>
    </Venster>
  )
}
