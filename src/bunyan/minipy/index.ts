/**
 * MINIPY — een kleine Python die in de browser draait.
 *
 * Waarom niet Pyodide of een andere kant-en-klare vertaler: die weegt tien
 * megabyte, komt van een adres buiten de deur en werkt dus niet zonder
 * internet. Belangrijker nog is de taal van de fouten. Een kind van elf dat
 * `SyntaxError: invalid syntax` te zien krijgt, leert daar niets van. Hier
 * staat er "regel 3: je bent de dubbele punt vergeten aan het eind van de
 * if-regel", en dat is het halve onderwijs.
 *
 * Wat er wél in zit is precies het eerste jaar Python: getallen, tekst,
 * lijsten, woordenboeken, if, while, for, functies, f-strings en de gewone
 * ingebouwde functies. Wat er niet in zit — klassen, modules, uitzonderingen,
 * generatoren — hoort in dat eerste jaar ook niet.
 *
 * Deze overzetting naar TypeScript is regel voor regel gecontroleerd tegen de
 * oude vertaler: honderdtweeëndertig programma's, waaronder één per
 * foutmelding, met regelnummer en tekst. Zie src/bunyan/minipy.proef.ts.
 */
import { MinipyFout } from './fout'
import { Uitvoerder } from './uitvoeren'
import type { Opties } from './uitvoeren'

export { MinipyFout } from './fout'
export { lees } from './lezen'
export { ontleed } from './ontleden'
export type { Opties, Waarde } from './uitvoeren'

/** Wat er van een programma terugkomt. `ok` is false zodra er iets misging. */
export type Uitslag =
  | { ok: true; uit: string[]; stappen: number }
  | { ok: false; uit: string[]; regel: number; fout: string; tip: string; stappen: number }

/** Draait de code en geeft terug wat er geprint is, of de fout in gewone taal. */
export function draai(bron: string, opties: Opties = {}): Uitslag {
  const u = new Uitvoerder(opties)
  try {
    u.draai(bron)
    return { ok: true, uit: u.uit, stappen: u.stappen }
  } catch (e) {
    if (e instanceof MinipyFout) {
      return { ok: false, uit: u.uit, regel: e.regel, fout: e.message, tip: e.tip, stappen: u.stappen }
    }
    return {
      ok: false, uit: u.uit, regel: 0,
      fout: 'er ging iets mis: ' + (e instanceof Error ? e.message : String(e)),
      tip: '', stappen: u.stappen,
    }
  }
}
