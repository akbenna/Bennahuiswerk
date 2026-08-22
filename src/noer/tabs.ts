/** De tabbladen van Islam leren, op één plek zodat elk scherm ernaar kan wijzen. */
export const TABS = [
  ['vandaag', 'Vandaag'], ['leerpad', 'Leerpad'], ['gebed', 'Leren bidden'],
  ['tijden', 'Gebedstijden'], ['oefenen', 'Oefenen'], ['beloning', 'Beloning'],
  ['ouder', 'Ouder'],
] as const

export type Tab = (typeof TABS)[number][0]

/** De onderdelen binnen "Leren bidden". */
export const GEBED_NAV = [
  ['wudu', 'De wassing'], ['stappen', 'Stap voor stap'], ['mee', 'Bid mee'],
  ['hifz', 'Uit je hoofd'], ['alle', 'Alle gebeden'], ['bijzonder', 'Bijzondere gebeden'],
  ['duas', "Du'a's"], ['fouten', 'Als het misgaat'],
] as const

export type Gebedtab = (typeof GEBED_NAV)[number][0]

/** De kleur van een module, uit de vaste reeks. */
export const MODKLEUR = ['k', 'info', 'paars', 'goed', 'let']
