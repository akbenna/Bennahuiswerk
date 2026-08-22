/**
 * DATUMS ZONDER TIJDZONE
 *
 * Alles in deze app rekent in hele dagen: de weegreeks is een reeks dagen en
 * geen reeks tijdstippen. Een `Date` die ergens door een tijdzone gaat kan een
 * ochtendweging naar de vorige dag schuiven, en dan verschuift de helling van
 * het model mee. Daarom is de datum overal een string JJJJ-MM-DD, en gaat hij
 * alleen door een `Date` heen op het middaguur — ver genoeg van middernacht dat
 * geen enkele zomertijdsprong eroverheen komt.
 */
import type { IsoDatum } from './db/tabellen'

const twee = (n: number): string => String(n).padStart(2, '0')

export const iso = (d: Date): IsoDatum =>
  `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`

export const vandaag = (): IsoDatum => iso(new Date())

/** Middaguur, met opzet. Zie de kop van dit bestand. */
export const opDatum = (s: IsoDatum): Date => new Date(s + 'T12:00:00')

export const plusDagen = (s: IsoDatum, n: number): IsoDatum => {
  const d = opDatum(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}

export const dagVerschil = (van: IsoDatum, tot: IsoDatum): number =>
  Math.round((opDatum(tot).getTime() - opDatum(van).getTime()) / 86_400_000)

export const kortNL = (s: IsoDatum): string =>
  opDatum(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export const langNL = (s: IsoDatum): string =>
  opDatum(s).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
