/**
 * VIJFTIEN VAN TWEEHONDERDNEGENTIEN, EN DAT MOET ERBIJ STAAN
 *
 * `kal_zoeken` kapt elke emmer af. Dat is geen gebrek maar een noodzaak: de
 * tabel telt duizenden regels en een zoekveld dat bij elk teken alles ophaalt
 * is geen zoekveld. Maar een afgekapte lijst die zich voordoet als de hele
 * lijst is wél een gebrek, en het is er een van dezelfde soort als een
 * puntschatting zonder interval: je ziet niet dat je naar een deel kijkt.
 *
 * Dat werd pas zichtbaar toen de merken op het scherm Voeding verschenen. Wie
 * op een merknaam zoekt heeft er honderden, krijgt er vijftien, en die vijftien
 * zijn gekozen op naamlengte. Staat je product er niet bij, dan lijkt het er
 * niet te zijn.
 *
 * DE GRENZEN STAAN HIER OMDAT ZE DAAR STAAN
 *
 * Deze getallen zijn overgeschreven uit `kal_zoeken`, en overschrijven is waar
 * dingen uit elkaar gaan lopen. Vandaar `zoekgrens.proef.ts`: die leest het
 * SQL-bestand, telt de grenzen die er werkelijk in staan, en valt om zodra
 * iemand er in de database een andere van maakt. De app liegt dan niet mee.
 *
 * WAAROM NIET GEWOON HET TOTAAL OPVRAGEN
 *
 * Omdat dat een tweede telling per toetsaanslag betekent over dezelfde
 * tabellen, en het antwoord op de vraag "zijn er meer" is niet het getal maar
 * het feit. Vijftien terugkrijgen waar er vijftien passen betekent: er zijn er
 * mogelijk meer. Dat is precies wat de zin op het scherm zegt, niet meer en
 * niet minder.
 */

/** De emmers van `Zoekuitslag`, zoals `kal_zoeken` ze teruggeeft. */
export type Emmer = 'maaltijden' | 'nevo' | 'gerechten' | 'eigen' | 'merk'

/**
 * De grens die in de SQL als `limit 15` staat, voor de drie emmers die hem
 * letterlijk dragen. `gerechten` telt daar ook mee: dat zijn twee deellijsten
 * van vijftien in een `coalesce`, dus de eerste die iets oplevert wint en er
 * komen er nooit meer dan vijftien uit.
 */
export const VASTE_GRENS = 15

/**
 * Bij hoeveel treffers deze emmer vol zit, of `null` als hij niet afkapt.
 *
 * `nevo` krijgt de grens mee die het scherm zelf vraagt, want die wordt als
 * `p_limiet` doorgegeven aan `kal_nevo_zoek`. De database zet er een dak van
 * vijftig op; vraagt een scherm meer, dan is dát de grens.
 */
export function grensVan(emmer: Emmer, limiet: number): number | null {
  if (emmer === 'maaltijden') return null
  if (emmer === 'nevo') return Math.min(limiet, 50)
  return VASTE_GRENS
}

/**
 * Zit deze emmer aan zijn grens?
 *
 * Groter dan de grens kan niet, maar de vergelijking staat er met `>=` en niet
 * met `===`. Zou de database ooit één regel meer teruggeven, dan hoort de
 * melding te komen en niet stilletjes weg te blijven.
 */
export function afgekapt(emmer: Emmer, aantal: number, limiet: number): boolean {
  const grens = grensVan(emmer, limiet)
  return grens !== null && aantal >= grens
}

/**
 * Wat erbij komt te staan.
 *
 * De zin noemt het getal, want "er zijn er meer" zonder te zeggen hoeveel je er
 * ziet is voor de lezer niet te plaatsen. En hij zegt wat je eraan kunt doen,
 * want een melding die alleen een tekort meldt is een melding waar je niets mee
 * kunt.
 */
export function afgekaptZin(aantal: number): string {
  return `Dit zijn de eerste ${aantal}. Staat wat je zoekt er niet bij, `
    + 'typ er dan een woord bij.'
}
