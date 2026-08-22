/** De vaste gegevens van de spelletjes. */

export const LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
] as const

export const WOORDEN = [
  'appel', 'banaan', 'school', 'vriend', 'zomer', 'winter', 'boek', 'fiets',
  'tafel', 'bloem', 'vogel', 'strand', 'muziek', 'kikker', 'wolk', 'sleutel',
  'koning', 'trein', 'ballon', 'draak', 'moskee', 'dadel', 'kameel',
] as const

/** Eén regel onderaan, elke keer een andere. Niets meer dan dat: een app die om
 *  de twee schermen een grap maakt is na drie dagen vermoeiend. */
export const GRAPPEN = [
  'De mol is eigenlijk een egel. Dat weet niemand en het maakt niemand uit.',
  '"Even vijf minuten" is de meest gebroken belofte in dit huis.',
  'De computer bij boter-kaas-eieren speelt eerlijk. Hij is alleen wat beter.',
  'Bij de reken-race gaat het om snelheid. Bij de tafels van school ook, maar dan zonder muziek.',
  'Als je verliest van de computer: hij heeft geen huiswerk.',
  'Wie het geheugenspel in twaalf beurten haalt mag opscheppen. Onder de tien is verdacht.',
  'De klok-race is oefenen voor de vraag "hoe laat kom je thuis".',
  'Een record verbeteren met één punt telt ook. Vraag maar aan een topsporter.',
  'Voor de duidelijkheid: de getallen bij "groter getal" zijn willekeurig. Echt.',
  'Tip bij hoger of lager: begin in het midden. Dat scheelt de helft. Elke keer.',
] as const

/** Twee spellen staan als eigen bestand naast de huiswerkapp en blijven daar. */
export const EXTERN = [
  { ico: '🧱', n: 'AminoQMc', u: 'Bouw en verken een wereld van blokken',
    href: '/huiswerk/voxelsandbox.html' },
  { ico: '🚦', n: 'Verkeersschool', u: 'Rijden, een vriend uitdagen en het theorie-examen',
    href: '/huiswerk/verkeersschool.html' },
] as const
