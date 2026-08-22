/** De dertien spellen, in de volgorde waarin ze op het scherm staan. */
import type { Spelbeschrijving } from './kader'
import { EvenOfOneven, GroterGetal, KlokRace, RekenRace, SomSprint } from './optijd'
import { Letterjacht, Mollen, Simon, Veelvouden } from './vakspellen'
import { BoterKaasEieren, HogerOfLager, Memory, WoordWarwinkel } from './overige'

export type { Spelbeschrijving, SpelEigenschappen } from './kader'

export const SPELLEN: readonly Spelbeschrijving[] = [
  { id: 'mollen', ico: '🦔', n: 'Mollen meppen',
    u: 'Tik zo snel mogelijk op de egel', eenh: 'punten', Spel: Mollen },
  { id: 'reken', ico: '⚡', n: 'Reken-race',
    u: 'Zoveel mogelijk tafelsommen in 30 seconden', eenh: 'goed', Spel: RekenRace },
  { id: 'sprint', ico: '➕', n: 'Som-sprint',
    u: 'Plus en min op tijd', eenh: 'goed', Spel: SomSprint },
  { id: 'groter', ico: '🐘', n: 'Groter getal',
    u: 'Tik snel het grootste getal aan', eenh: 'goed', Spel: GroterGetal },
  { id: 'paroon', ico: '🔀', n: 'Even of oneven',
    u: 'Kies snel: even of oneven', eenh: 'goed', Spel: EvenOfOneven },
  { id: 'klok', ico: '🕐', n: 'Klok-race',
    u: 'Lees de klok en kies de juiste tijd', eenh: 'goed', Spel: KlokRace },
  { id: 'letters', ico: 'ع', n: 'Letterjacht',
    u: 'Tik alle plekken aan waar dezelfde Arabische letter staat', eenh: 'goed',
    Spel: Letterjacht },
  { id: 'veelvoud', ico: '✖️', n: 'Veelvouden-vangst',
    u: 'Tik alleen de veelvouden aan', eenh: 'goed', Spel: Veelvouden },
  { id: 'simon', ico: '🎨', n: 'Volg de kleuren',
    u: 'Onthoud de reeks en herhaal hem', eenh: 'niveau', Spel: Simon },
  /* Het enige spel waar minder beter is; dat maakt het samenvoegen tussen
     toestellen anders. Zie opslag.ts. */
  { id: 'memory', ico: '🃏', n: 'Geheugenspel',
    u: 'Vind alle paren in zo min mogelijk beurten', eenh: 'beurten',
    lager: true, Spel: Memory },
  { id: 'hoger', ico: '🔢', n: 'Hoger of lager',
    u: 'Raad het getal met zo min mogelijk gokken', eenh: 'punten', Spel: HogerOfLager },
  { id: 'woord', ico: '🔤', n: 'Woord-warwinkel',
    u: 'Zet de letters in de goede volgorde', eenh: 'woorden', Spel: WoordWarwinkel },
  /* Boter-kaas-eieren telt zijn eigen overwinningen op in plaats van een score
     aan het eind; de omhulling in App.tsx vult die twee eigenschappen aan. */
  { id: 'bke', ico: '⭕', n: 'Boter-kaas-eieren',
    u: 'Speel tegen de computer', eenh: 'gewonnen',
    Spel: BoterKaasEieren as unknown as Spelbeschrijving['Spel'] },
]
