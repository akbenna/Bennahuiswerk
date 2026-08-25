/**
 * DE TEKENTJES VAN DE ZIJBALK
 *
 * Geen emoji en geen icoonbibliotheek. Emoji tekent elk toestel anders — op de
 * ene telefoon is het huisje plat en grijs, op de andere een gekleurd blokje —
 * en een bibliotheek is honderd kilobyte voor acht vormpjes. Dit zijn lijnen
 * die de kleur van hun omgeving overnemen, dus ze kloppen in de donkere zijbalk
 * én op een lichte kaart.
 */
import type { ReactNode } from 'react'

const teken = (kinderen: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kinderen}
  </svg>
)

export const TekenHuis = () => teken(
  <><path d="M3 10.6 12 3.6l9 7v9.2a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 20.8Z" />
    <path d="M9.4 21.8v-6.4h5.2v6.4" /></>,
)

export const TekenRaster = () => teken(
  <><rect x="3.2" y="3.2" width="7.4" height="7.4" rx="2" />
    <rect x="13.4" y="3.2" width="7.4" height="7.4" rx="2" />
    <rect x="3.2" y="13.4" width="7.4" height="7.4" rx="2" />
    <rect x="13.4" y="13.4" width="7.4" height="7.4" rx="2" /></>,
)

export const TekenBoek = () => teken(
  <><path d="M3.4 4.6h5a3.4 3.4 0 0 1 3.6 3v11.8a2.6 2.6 0 0 0-2.8-2.2h-5.8Z" />
    <path d="M20.6 4.6h-5a3.4 3.4 0 0 0-3.6 3v11.8a2.6 2.6 0 0 1 2.8-2.2h5.8Z" /></>,
)

export const TekenGrafiek = () => teken(
  <><path d="M3.4 20.6h17.2" /><rect x="5" y="11" width="3.6" height="6.4" rx="1.2" />
    <rect x="10.2" y="6.6" width="3.6" height="10.8" rx="1.2" />
    <rect x="15.4" y="9" width="3.6" height="8.4" rx="1.2" /></>,
)

export const TekenSleutel = () => teken(
  <><circle cx="8.2" cy="15.8" r="4.2" /><path d="M11.2 12.8 20 4" />
    <path d="M16.6 7.4l2.2 2.2" /></>,
)

export const TekenUit = () => teken(
  <><path d="M9.6 20.4H5.4a1.4 1.4 0 0 1-1.4-1.4V5a1.4 1.4 0 0 1 1.4-1.4h4.2" />
    <path d="M15.6 16.4 20 12l-4.4-4.4" /><path d="M20 12H9.4" /></>,
)

export const TekenHulp = () => teken(
  <><circle cx="12" cy="12" r="8.8" /><path d="M9.6 9.6a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.2-2.5 3.8" />
    <path d="M12 17.4h.01" /></>,
)

export const TekenKalender = () => teken(
  <><rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.6" /><path d="M3.4 10h17.2" />
    <path d="M8.2 3.4v3.4" /><path d="M15.8 3.4v3.4" /></>,
)

export const TekenKlok = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.8" /><path d="M12 6.8V12l3.4 2" />
  </svg>
)

export const TekenLamp = () => teken(
  <><path d="M9.4 18.2h5.2" /><path d="M10.2 21h3.6" />
    <path d="M12 3.2a5.8 5.8 0 0 1 3.4 10.5c-.6.5-.9 1.1-.9 1.8v.7H9.5v-.7c0-.7-.3-1.3-.9-1.8A5.8 5.8 0 0 1 12 3.2Z" /></>,
)

export const TekenSter = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8Z" />
  </svg>
)
