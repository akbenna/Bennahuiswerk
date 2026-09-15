/**
 * DE SFEERFOTO PER TABBLAD
 *
 * Eén foto bovenaan elk scherm. Niet om iets te zeggen — er staat een zalmmoot
 * bij Gezondheid omdat dat een toon zet, niet omdat je vandaag zalm at.
 *
 * WAAROM DIT HIER STAAT EN NIET IN ELK SCHERM APART
 *
 * Omdat het een keuze is over de app als geheel en niet over één scherm. Zes
 * foto's naast elkaar zijn een sfeer; zes losse besluiten in zes bestanden zijn
 * dat na een half jaar niet meer. Wie hem wil wisselen, wisselt hem hier, en
 * ziet meteen wat er naast staat.
 *
 * DE KEUZE ZELF
 *
 * Fris en herkenbaar, geen bereide gerechten met saus. Ze staan op een witte
 * ondergrond, dus in het donkere thema is de band een lichte strook — dat is
 * geaccepteerd: hij hoort op te vallen, anders heeft hij geen functie.
 *
 * Er zijn er tien beschikbaar in `health/beeldmateriaal/eten/`; deze zes staan
 * in `public/` en worden dus meegebouwd. Wie er een vervangt, zet het bestand
 * daar neer en verandert alleen de regel hieronder.
 */
export const SFEERFOTO = {
  vandaag: '/health/eten/food_skyr.png',
  voeding: '/health/eten/food_salad_chicken.png',
  inzicht: '/health/eten/food_blueberries.png',
  beweging: '/health/eten/food_banana.png',
  gezondheid: '/health/eten/food_salmon.png',
  meer: '/health/eten/food_nuts.png',
} as const
