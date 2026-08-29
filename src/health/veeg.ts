/**
 * VEGEN OM VAN DAG TE WISSELEN
 *
 * Twee pijltjes bovenaan werken, maar op een telefoon is vegen wat je vanzelf
 * doet. Dit is de haak die dat mogelijk maakt zonder de rest van het scherm in
 * de weg te zitten.
 *
 * WAAR HET MISGAAT ALS JE HET NAÏEF DOET
 *
 * Een scherm met een dagoverzicht scrollt verticaal. Wie omhoog veegt en daarbij
 * een paar pixels naar links afwijkt, hoort niet ineens op gisteren uit te
 * komen. Vandaar drie voorwaarden, en niet één:
 *
 *   1. minstens 60 px horizontaal — een tik met trillende vinger telt niet;
 *   2. horizontaal minstens twee keer zo veel als verticaal — dan is het echt
 *      een zijwaartse beweging en geen schuine scroll;
 *   3. binnen 700 ms — een langzaam slepen is meestal iets anders.
 *
 * En het begin telt mee: start de veeg op een invoerveld, een knop of iets wat
 * zelf horizontaal schuift, dan blijven we eraf. Anders kun je geen tekst meer
 * selecteren in het zoekveld zonder van dag te wisselen.
 *
 * WAAROM GEEN preventDefault
 *
 * De browser mag zijn eigen werk blijven doen — scrollen, terugvegen in de
 * geschiedenis op iOS. We kijken alleen mee en beslissen achteraf. Dat maakt
 * deze haak passief en dus goedkoop; hij kan het scrollen niet stroef maken.
 */
import { useEffect, useRef } from 'react'

/** Hoeveel er horizontaal afgelegd moet zijn voordat het een veeg heet. */
const DREMPEL_PX = 60
/** Hoeveel keer horizontaler dan verticaal. */
const VERHOUDING = 2
/** Langer dan dit is geen veeg meer. */
const MAX_MS = 700

/** Waar we niet overheen vegen: die elementen doen zelf al iets met slepen. */
const MET_RUST = 'input, textarea, select, button, a, [role="button"], .geenveeg'

export interface Veegacties {
  links?: (() => void) | undefined
  rechts?: (() => void) | undefined
}

/**
 * Luistert op `doel` naar een zijwaartse veeg.
 *
 * `links` is de veeg náár links (vinger van rechts naar links), wat in een
 * tijdlijn "verder" betekent; `rechts` is terug. Ontbreekt de handeling, dan
 * gebeurt er niets — zo hoeft de aanroeper niet zelf te bewaken dat morgen niet
 * bestaat.
 *
 * Het element komt binnen als element en niet als ref. Dat is geen smaak: een
 * ref die van null naar een element gaat laat React niet opnieuw draaien, en dan
 * hangt de haak zich vast aan niets en merkt niemand het. Met een terugroep-ref
 * (`ref={zetVlak}` op een `useState`) verandert de waarde wél, en dan klopt de
 * afhankelijkheid hieronder vanzelf.
 */
export function useVeeg(doel: HTMLElement | null, acties: Veegacties): void {
  /* In een ref en niet in de afhankelijkheden: anders koppelt hij bij elke
     hertekening opnieuw, en dat is elke seconde als er een klok meeloopt. */
  const nu = useRef(acties)
  nu.current = acties

  useEffect(() => {
    const el = doel
    if (!el) return

    let x0 = 0
    let y0 = 0
    let t0 = 0
    let doeMee = false

    const begin = (e: TouchEvent): void => {
      if (e.touches.length !== 1) { doeMee = false; return }
      const raak = e.touches[0]
      if (!raak) { doeMee = false; return }
      doeMee = !(e.target instanceof Element && e.target.closest(MET_RUST))
      x0 = raak.clientX
      y0 = raak.clientY
      t0 = Date.now()
    }

    const eind = (e: TouchEvent): void => {
      if (!doeMee) return
      doeMee = false
      const raak = e.changedTouches[0]
      if (!raak) return
      const dx = raak.clientX - x0
      const dy = raak.clientY - y0
      if (Date.now() - t0 > MAX_MS) return
      if (Math.abs(dx) < DREMPEL_PX) return
      if (Math.abs(dx) < Math.abs(dy) * VERHOUDING) return
      if (dx < 0) nu.current.links?.()
      else nu.current.rechts?.()
    }

    el.addEventListener('touchstart', begin, { passive: true })
    el.addEventListener('touchend', eind, { passive: true })
    return () => {
      el.removeEventListener('touchstart', begin)
      el.removeEventListener('touchend', eind)
    }
  }, [doel])
}

/**
 * De beslissing los van de browser, zodat hij te toetsen is zonder aanraakingen
 * na te bootsen. `null` betekent: dit was geen veeg.
 */
export function veegRichting(
  dx: number, dy: number, ms: number,
): 'links' | 'rechts' | null {
  if (ms > MAX_MS) return null
  if (Math.abs(dx) < DREMPEL_PX) return null
  if (Math.abs(dx) < Math.abs(dy) * VERHOUDING) return null
  return dx < 0 ? 'links' : 'rechts'
}
