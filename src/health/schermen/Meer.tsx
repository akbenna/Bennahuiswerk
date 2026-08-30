/**
 * MEER — slaap, de onderhoudsfase en de instellingen.
 *
 * Overgezet uit vwMeer(). Bij het herontwerp bleek dit scherm twee dingen te
 * doen die niets met elkaar te maken hebben: het toont een variabele die je
 * kunt bijsturen (slaap) en een oordeel over waar je staat (het stoplicht).
 * De kop draagt nu het oordeel als dat er is, en anders de slaap — met veertien
 * nachten erbij, want één gemiddelde zegt niet of het beter of slechter gaat.
 */
import { Kaart, Knop, Kop, Rij, Tussen } from '../onderdelen/basis'
import { Lijntje, Schermkop } from '../hero'
import { dec } from '@/gedeeld/getal'
import type { Profiel } from '@/gedeeld/db/tabellen'
import type { Dagenkaart, Trendpunt } from '../rekenkern'
import { onderhoudZone } from '../klinisch'
import type { Onderhoudzone } from '../klinisch'

/** De kleur hoort bij het scherm en niet bij de rekenfunctie. Zie klinisch.ts. */
const ZONEKLEUR: Record<Onderhoudzone, string> = {
  groen: 'var(--goed)', geel: 'var(--let)', rood: 'var(--fout)',
}

/* Er staat altijd een woord bij de kleur. Een gekleurde stip alleen is voor een
   kleurenblinde lezer geen stoplicht maar een stip. */
const ZONEWOORD: Record<Onderhoudzone, string> = {
  groen: 'groen', geel: 'geel', rood: 'rood',
}

export function Meer(
  { dagen, reeks, profiel, opVenster }:
  {
    dagen: Dagenkaart; reeks: Trendpunt[]; profiel: Profiel
    opVenster: (v: 'profiel' | 'import' | 'account' | 'koppelen' | 'hoewerkt') => void
  },
) {
  const trendNu = [...reeks].reverse().find((x) => x.ema != null)
  const zone = profiel.fase === 'onderhoud'
    ? onderhoudZone(trendNu?.ema ?? null, profiel.onderhoud_basis_kg) : null

  /* Veertien nachten, met de gaten erin. Een nacht zonder gegevens is geen nacht
     van nul uur, dus hij hoort een gat te zijn en geen punt op de bodem. */
  const nachten = Object.keys(dagen).sort().slice(-14)
    .map((k) => { const m = dagen[k]?.slaap_min; return m != null ? m / 60 : null })
  const gemeten = nachten.filter((v): v is number => v != null)
  const gemSlaap = gemeten.length
    ? gemeten.reduce((s, b) => s + b, 0) / gemeten.length : null

  /* Het voortschrijdend gemiddelde over drie nachten. Slaap schommelt per nacht
     meer dan er aan sturing in zit; wat je wilt zien is de richting. */
  const glad = nachten.map((_, i) => {
    const venster = nachten.slice(Math.max(0, i - 2), i + 1).filter((v): v is number => v != null)
    return venster.length ? venster.reduce((s, b) => s + b, 0) / venster.length : null
  })

  const slaapToon = gemSlaap == null ? 'rust' : gemSlaap >= 7 ? 'goed' : gemSlaap >= 6 ? 'let' : 'fout'
  const kopToon = zone
    ? ({ groen: 'goed', geel: 'let', rood: 'fout' } as const)[zone.zone]
    : slaapToon
  const kopTitel = zone
    ? (zone.zone === 'groen' ? 'Je houdt het vast'
      : zone.zone === 'geel' ? 'Het loopt op — nu bijsturen'
      : 'Terug naar de actieve fase')
    : gemSlaap == null ? 'Nog geen slaapgegevens'
    : gemSlaap >= 7 ? 'Je slaapt genoeg'
    : gemSlaap >= 6 ? 'Slaap zit aan de krappe kant'
    : 'Slaap is hier de zwakke schakel'

  return (
    <>
      <Schermkop toon={kopToon} titel={kopTitel}
                 bovenschrift={zone ? 'Onderhoud' : 'De laatste twee weken'}
                 rechts={zone
                   ? <span className={'vlaggetje ' + kopToon}>
                       <span className="stoplicht" style={{ background: ZONEKLEUR[zone.zone] }} />
                       {ZONEWOORD[zone.zone]}
                     </span>
                   : undefined}>
        <div className="kerngetallen">
          {zone && (
            <div>
              <div className="mini">Ten opzichte van je basis</div>
              <div>
                <span className="getal">
                  {zone.delta > 0 ? '+' : ''}{dec(zone.delta, 1)}
                </span>
                <span className="klein"> kg</span>
              </div>
            </div>
          )}
          <div>
            <div className="mini">Slaap, gemiddeld per nacht</div>
            <div>
              <span className="getal">{gemSlaap != null ? dec(gemSlaap, 1) : '—'}</span>
              <span className="klein">
                {' '}uur over {gemeten.length} nacht{gemeten.length === 1 ? '' : 'en'}
              </span>
            </div>
          </div>
        </div>
        {gemeten.length >= 2 && (
          <div style={{ marginTop: 10 }}>
            <Lijntje ruw={nachten} glad={glad} hoogte={44} />
            <p className="mini" style={{ marginTop: 2 }}>
              Per nacht licht, het gemiddelde over drie nachten donker —{' '}
              {dec(Math.min(...gemeten), 1)} tot {dec(Math.max(...gemeten), 1)} uur.
            </p>
          </div>
        )}
      </Schermkop>

      <Kaart>
        <Kop>Waarom slaap hier staat</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
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
              <p className="klein" style={{ marginTop: 4 }}>
                Je basisgewicht staat op {dec(profiel.onderhoud_basis_kg, 1)} kg.
              </p>
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
          <Knop vol opKlik={() => opVenster('koppelen')}>Horloge en telefoon koppelen</Knop>
          <Knop opKlik={() => opVenster('import')}>Importeren uit een andere app</Knop>
          <Knop opKlik={() => opVenster('account')}>Account</Knop>
        </Rij>
        <p className="mini" style={{ marginTop: 8 }}>
          Koppelen haalt stappen, slaap en fietsminuten elke ochtend vanzelf uit Apple Gezondheid —
          en daarmee ook wat je Garmin daarin schrijft. Importeren is voor een eenmalige overstap uit
          een andere app.
        </p>
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
        {/* Die verwijzing naar een bestand is genoeg voor wie de repo kent en
            nutteloos voor ieder ander. De uitleg zelf hoort ook hier te staan,
            achter één tik. */}
        <Rij>
          <Knop opKlik={() => opVenster('hoewerkt')}>Hoe deze app werkt</Knop>
        </Rij>
      </Kaart>
    </>
  )
}
