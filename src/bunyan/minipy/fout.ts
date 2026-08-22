/**
 * DE FOUT ZELF
 *
 * Dit is het hart van MINIPY. Niet dat de taal werkt — dat doet elke vertaler —
 * maar dat een kind van elf begrijpt wát er misging. `SyntaxError: invalid
 * syntax` leert niemand iets; "regel 3: je bent de dubbele punt vergeten aan
 * het eind van de if-regel" is het halve onderwijs.
 *
 * Daarom draagt elke fout drie dingen: het regelnummer, de melding in gewone
 * taal, en een tip die zegt wat je eraan doet. Die zinnen staan letterlijk in
 * de gouden waarden; wie ze herformuleert breekt de toets, en dat is precies
 * de bedoeling.
 */
export class MinipyFout extends Error {
  constructor(
    readonly regel: number,
    tekst: string,
    readonly tip: string = '',
  ) {
    super(tekst)
    this.name = 'MinipyFout'
  }
}

export const fout = (regel: number, tekst: string, tip?: string): MinipyFout =>
  new MinipyFout(regel, tekst, tip ?? '')
