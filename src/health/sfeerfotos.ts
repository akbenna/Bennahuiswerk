/**
 * DE SFEERFOTO PER TABBLAD
 *
 * Eén band bovenaan elk scherm. Niet om iets te zeggen — er staat een fiets bij
 * Beweging omdat dat een toon zet, niet omdat je vandaag gefietst hebt.
 *
 * WAAROM DIT HIER STAAT EN NIET IN ELK SCHERM APART
 *
 * Omdat het een keuze is over de app als geheel en niet over één scherm. Zes
 * foto's naast elkaar zijn een sfeer; zes losse besluiten in zes bestanden zijn
 * dat na een half jaar niet meer. Wie hem wil wisselen, wisselt hem hier, en
 * ziet meteen wat er naast staat.
 *
 * WAAROM DEZE ZES EN NIET DE VORIGE ZES
 *
 * Hier stonden productfoto's van 384 bij 384 — een banaan bij Beweging, een
 * salade bij Voeding. Twee dingen klopten daar niet aan.
 *
 * Ze waren te klein. De band is over de volle breedte 400 tot 1320 punten
 * breed, en op een telefoon met drie beeldpunten per punt vraagt dat er 1290.
 * Een bron van 384 werd dus ruim drie keer opgeblazen, en zo zag hij er ook
 * uit. Dat is gemeten en staat als proef in `health-voorbeeld.mjs`, met een
 * grens per maat: op een telefoon en op een gewoon bureaublad hoort de band
 * verkleind te worden en niet vergroot, en op 1920 punten met twee beeldpunten
 * per punt staat de grens op 1,7 — daar vraagt de band er 2596 en zijn er 1600.
 * Dat laatste is met deze bronnen niet op te lossen; het vraagt een levering op
 * 2400 bij 900.
 *
 * En ze waren vierkant. Een vierkant beeld in een band van 8 op 3 wordt tot een
 * plak door het midden gesneden; wat je overhoudt is de helft van een banaan.
 * Deze zes zijn als band gemaakt — 1600 bij 600 — en tonen dus wat de fotograaf
 * er in heeft gezet.
 *
 * Elk beeld hoort bij de vraag van zijn scherm: een fiets in de polder bij
 * Beweging, een weegschaal bij Inzicht, een bloeddrukmeter bij Gezondheid,
 * groenten bij Voeding, een ontbijt bij Vandaag, de voorraadkast bij Meer.
 *
 * De bronbestanden zijn niet in de repo opgenomen: wat hier staat ís het
 * origineel op zijn volle maat, alleen opnieuw gecodeerd. `LEESMIJ.md` in
 * `health/beeldmateriaal/` beschrijft hoe.
 */
export const SFEERFOTO = {
  vandaag: '/health/koppen/vandaag.jpg',
  voeding: '/health/koppen/voeding.jpg',
  inzicht: '/health/koppen/inzicht.jpg',
  beweging: '/health/koppen/beweging.jpg',
  gezondheid: '/health/koppen/gezondheid.jpg',
  meer: '/health/koppen/meer.jpg',
} as const

/** De maat waarop de banden zijn aangeleverd. De proef rekent hiermee. */
export const SFEERMAAT = { breedte: 1600, hoogte: 600 } as const
