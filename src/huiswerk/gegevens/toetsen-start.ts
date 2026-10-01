/**
 * DE EERSTE TOETSEN OP HET PLANBORD
 *
 * Een leeg planbord is een drempel: eerst vier toetsen intypen voordat je er
 * iets aan hebt. Daarom staat hier per kind wat er op het rooster stond toen
 * het bord gemaakt werd, zodat het bord met één tik gevuld is. De onderdelen
 * zijn algemeen gehouden, want de paragrafen stonden niet op het rooster; het
 * kind vult ze zelf aan, en vanaf de volgende toets typt het ze meteen goed in.
 *
 * Dit is een aanbod, geen opslag: het verschijnt alleen zolang er nog geen
 * toetsen op het bord staan en de datums niet voorbij zijn.
 */
import type { Toets } from '../planbord'

export type Starttoets = Omit<Toets, 'bijgewerkt' | 'weg'>

export const STARTTOETSEN: Record<string, Starttoets[]> = {
  amaani: [
    {
      id: 'start-bio-2026-10-02', vak: 'biologie', datum: '2026-10-02', titel: 'Toets biologie',
      onderdelen: ['Samenvatting en schema’s doorlezen', 'Begrippen overhoren'], perOnderdeel: 40,
    },
    {
      id: 'start-wisa-2026-10-07', vak: 'wiskundeA', datum: '2026-10-07', titel: 'Toets wiskunde A',
      onderdelen: ['Theorie en voorbeelden, opschrijven wat je niet snapt', 'Opgaven maken', 'Oefentoets op tijd'],
      perOnderdeel: 45,
    },
    {
      id: 'start-nat-2026-10-08', vak: 'natuurkunde', datum: '2026-10-08', titel: 'Toets natuurkunde',
      onderdelen: ['Formules op één blad, met eenheden', 'Voorbeeldopgaven nadoen, dan opgaven', 'Oefentoets op tijd'],
      perOnderdeel: 45,
    },
    {
      id: 'start-fatl-2026-10-09', vak: 'frans', datum: '2026-10-09', titel: 'Toets Frans',
      onderdelen: ['Woordjes eerste helft', 'Woordjes tweede helft', 'Grammatica', 'Woordjes door elkaar'],
      perOnderdeel: 20,
    },
  ],
}
