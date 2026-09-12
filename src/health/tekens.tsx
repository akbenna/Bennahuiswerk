/**
 * DE TEKENTJES VAN DE TABBALK
 *
 * Dezelfde keuze als in `src/start/tekens.tsx`, en om dezelfde redenen. Geen
 * emoji — dat tekent elk toestel anders. Geen icoonbibliotheek — dat is
 * honderd kilobyte voor zes vormpjes, en een strikte Content-Security-Policy
 * laat er toch geen van een CDN binnen. Dit zijn lijnen die de kleur van hun
 * omgeving overnemen (`currentColor`), dus ze kloppen in het lichte thema, in
 * het donkere, en in de groene tint van het tabblad waar je op staat.
 *
 * WAAROM DE OUDE TEKENS WEG MOESTEN
 *
 * Er stonden zes losse Unicode-vormen op de balk: ◍ ◎ ◇ ◈ ✚ ⋯. Twee daarvan
 * waren al vergeven. ◇ betekent in deze app "geschat" en ◈ betekent "opgave van
 * het etiket" — dat staat op élk scherm naast élke waarde, en het is de
 * kortste samenvatting van waar deze app over gaat. Diezelfde ruiten óók als
 * tabblad gebruiken maakt van een betekenisvol teken een versiering.
 *
 * Wat een tekentje hier moet doen is één ding: bij één blik zeggen waar je
 * bent. Daarom een vorm die bij het scherm hoort en niet bij de plek in de rij.
 *
 * DE ZES
 *
 * Vandaag      de doelring — het beeld dat op dat scherm zelf de dag draagt
 * Inzicht      een lijn die daalt: de weegtrend, waar het verbruik uit komt
 * Voeding      een kom: eten opzoeken en toevoegen
 * Beweging     twee voetstappen
 * Gezondheid   een hart
 * Profiel      een persoon
 *
 * Beweging en Profiel zijn met opzet géén twee mensfiguren. Op twintig pixels
 * is het verschil tussen een lopend en een staand poppetje weg, en dan staan er
 * twee tabbladen die hetzelfde lijken.
 */
import type { ReactNode } from 'react'

const teken = (kinderen: ReactNode) => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kinderen}
  </svg>
)

/** De doelring: bijna rond, met de opening waar het vandaag nog niet vol is. */
export const TekenVandaag = () => teken(
  <><path d="M20.3 8.6a9 9 0 1 1-4.9-4.9" />
    <circle cx="12" cy="12" r="2.6" /></>,
)

/** De weegtrend. Hij daalt, want dat is waar dit scherm over gaat. */
export const TekenInzicht = () => teken(
  <><path d="M3.2 20.4V4.6" /><path d="M3.2 20.4h17.2" />
    {/* Er stond een bolletje op het beginpunt. Op de balk las dat als een
        losse vlek tegen de as aan, en het zei niets wat de lijn niet al zegt. */}
    <path d="M6.2 8.6 10.6 13l3.2-3 5.2 5.6" /></>,
)

/** Een kom met damp: eten, en niet het zoeken ernaar. */
export const TekenVoeding = () => teken(
  <><path d="M3 11.4h18a9 9 0 0 1-18 0Z" />
    <path d="M9.4 7.8c0-1.4 1.4-1.6 1.4-3" />
    <path d="M13.6 7.8c0-1.4 1.4-1.6 1.4-3" /></>,
)

/**
 * Twee voetstappen, uit elkaar gezet zoals ze in een spoor staan.
 *
 * De eerste versie tekende per voet een bal en een hiel als twee losse bogen.
 * Op de balk — eenentwintig pixels — vielen die uit elkaar en stond er "8 8".
 * Dezelfde les als bij de bāʾ in `public/iconen/LEESMIJ.md`: één gestreken
 * contour houdt zijn vorm, twee losse delen lopen dood.
 */
export const TekenBeweging = () => teken(
  <><path d="M8 3.6c2 0 3.2 1.9 3.2 4.2 0 2.3-1.1 3.3-1.1 5.1 0 1.2-.9 2-2.1 2s-2.1-.8-2.1-2c0-1.8-1.1-2.8-1.1-5.1C4.8 5.5 6 3.6 8 3.6Z" />
    <path d="M16 9c2 0 3.2 1.9 3.2 4.2 0 2.3-1.1 3.3-1.1 5.1 0 1.2-.9 2-2.1 2s-2.1-.8-2.1-2c0-1.8-1.1-2.8-1.1-5.1C12.8 10.9 14 9 16 9Z" /></>,
)

/** Een hart. De bloeddruk, de saturatie en de rustpols wonen daar. */
export const TekenGezondheid = () => teken(
  <path d="M12 20.4C12 20.4 3.8 15.6 3.8 10.2a4.6 4.6 0 0 1 8.2-2.9 4.6 4.6 0 0 1 8.2 2.9c0 5.4-8.2 10.2-8.2 10.2Z" />,
)

/** Een persoon. Hier staat wie je bent en wat je instelt. */
export const TekenProfiel = () => teken(
  <><circle cx="12" cy="7.8" r="3.6" />
    <path d="M4.9 20.6a7.3 7.3 0 0 1 14.2 0" /></>,
)
