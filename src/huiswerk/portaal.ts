/**
 * BINNENKOMEN VIA HET PORTAAL
 *
 * Wie op de startpagina zijn eigen profiel al heeft gekozen, hoort zich hier
 * niet nog een keer voor te stellen. Twee keer dezelfde vraag is niet twee keer
 * zo veilig — het is één keer te veel, en het staat tussen een kind en zijn
 * huiswerk in.
 *
 * Er gaat niets verloren door het inlogscherm over te slaan: `useHuiswerk`
 * haalt bij het openen de voortgang van elk kind al stil op met de code en het
 * wachtwoord die hier bekend zijn (`haalKinderen`). Het inlogscherm was een
 * poort, geen ophaler.
 *
 * De koppeling loopt over de naam en niet over een id, want het portaal en deze
 * app hebben nooit een gedeeld sleutelveld gehad. Dat is meteen de reden voor
 * de strengheid hieronder: alleen een rol `kind` telt, en alleen een naam die
 * precies één profiel raakt.
 */
import { wieBenIk } from '@/gedeeld/sessie'
import { PROFIELEN } from './gegevens/profielen'

const sleutelbaar = (s: string): string => String(s ?? '').trim().toLowerCase()

/**
 * Het profiel-id dat bij deze naam hoort, of null. Hoofdletters en spaties doen
 * niet mee: het portaal toont 'Amine', dit profiel heet `amine`.
 */
export function pidVanNaam(naam: string): string | null {
  const gezocht = sleutelbaar(naam)
  if (!gezocht) return null
  for (const [pid, prof] of Object.entries(PROFIELEN)) {
    if (sleutelbaar(prof.naam) === gezocht) return pid
  }
  return null
}

/**
 * Het kind dat via het portaal binnenkwam, of null wanneer er niemand aan
 * staat, de aanmelding verlopen is, een ouder aan de beurt is, of de naam geen
 * profiel in deze app heeft. In al die gevallen begint de app gewoon op het
 * beginscherm — niet met een foutmelding.
 */
export function portaalKind(nuMs: number = Date.now()): string | null {
  const ik = wieBenIk(nuMs)
  if (!ik || ik.rol !== 'kind') return null
  return pidVanNaam(ik.naam)
}
