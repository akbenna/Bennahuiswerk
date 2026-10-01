/**
 * DE PRIVACYVERKLARING OP HET SCHERM
 *
 * Bereikbaar vanaf twee plekken, en de eerste is de belangrijkste: het
 * aanmeldscherm. Wie toestemming geeft door een account te maken, hoort te
 * kunnen lezen waarvoor, en wel vóór dat moment en niet erna. Een verklaring
 * die pas achter de inlog staat, vraagt toestemming van iemand die hem nog niet
 * heeft kunnen lezen.
 *
 * De tweede is het accountvenster, voor wie er later nog eens naar wil kijken.
 *
 * De tekst zelf staat in `../privacy.ts` en wordt hier alleen getoond. Dat
 * bestand is ook de bron van `health/PRIVACY.md`, zodat de app en het document
 * niet uit elkaar kunnen groeien.
 */
import { Knop, Kop, Rij, Venster } from '../onderdelen/basis'
import { CONTACT, NAGEKEKEN, PRIVACY } from '../privacy'

export function PrivacyVenster({ opSluiten }: { opSluiten: () => void }) {
  return (
    <Venster titel="Privacy" opSluiten={opSluiten}>
      <p className="mini" style={{ marginTop: 6 }}>
        Nagelopen tegen de code op {NAGEKEKEN}. Vragen gaan naar{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      {PRIVACY.map((stuk) => (
        <div key={stuk.kop} style={{ marginTop: 16 }}>
          <Kop>{stuk.kop}</Kop>
          {stuk.alineas.map((a, i) => (
            <p key={i} style={{ fontSize: '.9rem', marginTop: i === 0 ? 4 : 8 }}>{a}</p>
          ))}
        </div>
      ))}

      <Rij style={{ marginTop: 18 }}>
        <Knop vol opKlik={opSluiten}>Klaar</Knop>
      </Rij>
    </Venster>
  )
}
