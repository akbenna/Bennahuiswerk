/**
 * HET PATROON VAN VIJF SPELLEN
 *
 * Reken-race, Som-sprint, Groter getal, Even of oneven en Klok-race zijn
 * hetzelfde spel met een andere opgave: er staat een klok, er komt een opgave,
 * je antwoordt, en de volgende verschijnt. In de oude app was dat één functie
 * `tijdSpel` met vier callbacks; hier is het één component met dezelfde vier.
 */
import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Kader, RecordRegel, useKlok } from './kader'
import type { SpelEigenschappen } from './kader'

export interface TijdSpelEigenschappen<T> extends SpelEigenschappen {
  duur: number
  /** Een nieuwe opgave. */
  maak: () => T
  /** Hoe de opgave eruitziet. `kies` roep je aan met het antwoord. */
  toon: (opgave: T, kies: (antwoord: string) => void) => ReactNode
  /** Is dit antwoord goed? */
  juist: (opgave: T, antwoord: string) => boolean
}

export function TijdSpel<T>(p: TijdSpelEigenschappen<T>) {
  const [score, zetScore] = useState(0)
  const [opgave, zetOpgave] = useState<T>(() => p.maak())
  const tijd = useKlok(p.duur, () => p.opKlaar(score))

  const kies = useCallback((antwoord: string) => {
    if (p.juist(opgave, antwoord)) {
      zetScore((n) => n + 1)
      p.piep('goed')
    } else {
      p.piep('mis')
    }
    zetOpgave(p.maak())
  }, [opgave, p])

  return (
    <Kader
      spel={p.spel}
      opSluiten={p.opSluiten}
      stand={<>⏱ <b>{tijd}</b>s · 🏆 <b>{score}</b> · <RecordRegel spel={p.spel} record={p.record} /></>}
    >
      {p.toon(opgave, kies)}
    </Kader>
  )
}

/**
 * Het invoerveld dat vanzelf doorgaat zodra het antwoord klopt. Een kind hoeft
 * geen enter te drukken bij een som van twee cijfers, en moet dat wel kunnen
 * bij een som waar het antwoord langer is.
 */
export function Antwoordveld(
  { opKies, juist }: { opKies: (v: string) => void; juist: (v: string) => boolean },
) {
  const [waarde, zetWaarde] = useState('')
  return (
    <input
      className="invoer" inputMode="numeric" autoComplete="off" placeholder="?" autoFocus
      value={waarde}
      onChange={(e) => {
        const v = e.target.value
        zetWaarde(v)
        if (juist(v)) { zetWaarde(''); opKies(v) }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { zetWaarde(''); opKies(waarde) }
      }}
    />
  )
}

/** Twee of drie knoppen om uit te kiezen. */
export function Keuzeknoppen(
  { keuzes, opKies, groot }:
  { keuzes: ReadonlyArray<readonly [sleutel: string, label: string]>
    opKies: (k: string) => void; groot?: boolean },
) {
  return (
    <div className="rij" style={{ justifyContent: 'center', marginTop: 10 }}>
      {keuzes.map(([sleutel, label], i) => (
        <button key={sleutel} type="button" className={'btn' + (i ? ' ghost' : '')}
                style={groot ? { fontSize: '1.5rem', minWidth: 110 } : undefined}
                onClick={() => opKies(sleutel)}>
          {label}
        </button>
      ))}
    </div>
  )
}
