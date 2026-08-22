/**
 * MEER — slaap, de onderhoudsfase en de instellingen.
 * Overgezet uit vwMeer().
 */
import { Kaart, Knop, Kop, Rij, Tussen } from '../onderdelen/basis'
import { dec } from '@/gedeeld/getal'
import type { Profiel } from '@/gedeeld/db/tabellen'
import type { Dagenkaart, Trendpunt } from '../rekenkern'
import { onderhoudZone } from '../klinisch'
import type { Onderhoudzone } from '../klinisch'

/** De kleur hoort bij het scherm en niet bij de rekenfunctie. Zie klinisch.ts. */
const ZONEKLEUR: Record<Onderhoudzone, string> = {
  groen: 'var(--goed)', geel: 'var(--let)', rood: 'var(--fout)',
}

export function Meer(
  { dagen, reeks, profiel, opVenster }:
  {
    dagen: Dagenkaart; reeks: Trendpunt[]; profiel: Profiel
    opVenster: (v: 'profiel' | 'import' | 'account') => void
  },
) {
  const trendNu = [...reeks].reverse().find((x) => x.ema != null)
  const zone = profiel.fase === 'onderhoud'
    ? onderhoudZone(trendNu?.ema ?? null, profiel.onderhoud_basis_kg) : null

  const slaap = Object.keys(dagen).sort().slice(-14)
    .map((k) => dagen[k]?.slaap_min).filter((v): v is number => v != null)
  const gemSlaap = slaap.length ? slaap.reduce((s, b) => s + b, 0) / slaap.length / 60 : null

  return (
    <>
      <Kaart>
        <Kop>Slaap, laatste twee weken</Kop>
        <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
          <span className="getal" style={{ fontSize: '1.8rem' }}>
            {gemSlaap != null ? dec(gemSlaap, 1) : '—'}
          </span>
          <span className="klein">
            uur gemiddeld over {slaap.length} nacht{slaap.length === 1 ? '' : 'en'}
          </span>
        </Rij>
        <p className="mini" style={{ marginTop: 8 }}>
          Bij 5,5 tegenover 8,5 uur slaapgelegenheid daalde in Nedeltcheva 2010 het aandeel
          gewichtsverlies als vet met 55 procent en steeg het verlies van vetvrije massa met 60 procent,
          bij identieke caloriebeperking — met meer honger erbij. Tien deelnemers, dus klein, maar het
          mechanisme is plausibel en de richting eenduidig. Slaap is hier geen wellness-item maar een
          variabele in dezelfde vergelijking.
        </p>
      </Kaart>

      {profiel.fase === 'onderhoud' ? (
        <Kaart style={{ borderLeft: `3px solid ${zone ? ZONEKLEUR[zone.zone] : 'var(--lijn)'}` }}>
          <Tussen>
            <Kop>Onderhoud — stoplicht</Kop>
            {zone && <span className="stoplicht" style={{ background: ZONEKLEUR[zone.zone] }} />}
          </Tussen>
          {zone ? (
            <>
              <Rij style={{ alignItems: 'baseline', marginTop: 4 }}>
                <span className="getal" style={{ fontSize: '1.8rem' }}>
                  {zone.delta > 0 ? '+' : ''}{dec(zone.delta, 1)} kg
                </span>
                <span className="klein">
                  ten opzichte van {dec(profiel.onderhoud_basis_kg, 1)} kg
                </span>
              </Rij>
              <p style={{ fontSize: '.88rem', marginTop: 8 }}>
                {zone.zone === 'groen'
                  ? 'Groen: binnen 1,4 kg van je basisgewicht. Doorgaan.'
                  : zone.zone === 'geel'
                  ? 'Geel: 1,4 tot 2,3 kg erboven. Zoek de oorzaak en stel eten en bewegen bij — dit is het moment, niet volgende maand.'
                  : 'Rood: 2,3 kg of meer erboven. Herstart de actieve afvalfase.'}
              </p>
            </>
          ) : (
            <p className="klein" style={{ marginTop: 4 }}>
              Stel eerst een basisgewicht in bij de instellingen — dat is het laagste stabiele gewicht
              waar je op wilt blijven.
            </p>
          )}
          <p className="mini" style={{ marginTop: 10 }}>
            De drempels komen uit STOP Regain (Wing 2006): in die trial kwam 72 procent van de
            controlegroep 2,3 kg of meer aan tegen 46 procent in de begeleide groep. Twee eerlijke
            kanttekeningen. De randomisatie betrof het prógramma, niet het wegen zelf — dagelijks wegen
            zonder actieregel heeft veel zwakker bewijs. En de internet-arm presteerde nauwelijks beter
            dan de controlegroep; een app die alleen digitaal is repliceert de zwakste arm. Het
            stoplicht triggert op het voortschrijdend gemiddelde en niet op de dagmeting, anders vuurt
            rood op vocht.
          </p>
        </Kaart>
      ) : (
        <Kaart plat>
          <Kop>Onderhoudsfase</Kop>
          <p className="klein" style={{ marginTop: 4 }}>
            Nog niet actief. Twintig kilo verliezen zonder gedefinieerd onderhoudsprotocol is waar de
            meeste trajecten stranden — niet in de afvalfase. Zet de fase om zodra je op gewicht bent;
            dan verschijnt hier het stoplicht met een vaste actieregel per zone.
          </p>
        </Kaart>
      )}

      <Kaart>
        <Kop>Instellingen</Kop>
        <Rij style={{ marginTop: 10 }}>
          <Knop opKlik={() => opVenster('profiel')}>Profiel en doelen</Knop>
          <Knop opKlik={() => opVenster('import')}>Importeren uit een andere app</Knop>
          <Knop opKlik={() => opVenster('account')}>Account</Knop>
        </Rij>
      </Kaart>

      <Kaart plat>
        <Kop>Waar de getallen vandaan komen</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          Elke rekenregel in deze app is verantwoord in VERANTWOORDING.md, met bron, beperking en een
          lijst van wat niet te verifiëren viel. De kern in één zin: het verbruik wordt gemeten uit de
          gewichtstrend in plaats van geschat uit een formule, en door te meten worden adaptieve
          thermogenese en de individuele activiteitsfactor automatisch geabsorbeerd — die hoeven niet
          gemodelleerd te worden, ze zitten al in de meting.
        </p>
      </Kaart>
    </>
  )
}
