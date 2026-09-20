/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * De gewichtsgrafiek schaalde op álles wat erin stond, en dat is precies fout
 * bij het geval waar hij het meest toe doet. Eén weging van 190,2 in een reeks
 * rond de 118 liet de as tot 191 lopen; tweeëntwintig echte wegingen werden
 * daardoor een streepje van een paar punten hoog. De figuur was letterlijk waar
 * en tegelijk onbruikbaar.
 *
 * Twee eisen houden dat tegen, en ze wijzen tegen elkaar in. Ze staan hier
 * allebei, want de ene zonder de andere geeft een nieuwe fout:
 *
 *   1. **De as kijkt naar de reeks.** Een weging die als uitschieter is
 *      aangemerkt bepaalt de uitsnede niet.
 *   2. **De weging verdwijnt niet.** Hij komt terug als `buitenBeeld`, zodat
 *      het scherm hem op de rand kan tekenen met zijn getal erbij. Deze app
 *      gooit geen metingen weg, ook niet uit een plaatje.
 *
 * En één die er los van staat: het voortschrijdend gemiddelde telt wél mee voor
 * de as. Dat is de uitkomst van het model en niet de meting. Bij zo'n weging
 * loopt de lijn een paar kilo mee omhoog, en dat hoort zichtbaar te zijn,
 * anders verbergt de figuur de fout die de tekst eronder juist benoemt.
 */
import { describe, expect, it } from 'vitest'
import { gewichtSchaal } from './figuren'
import type { Trendpunt } from './rekenkern'

const punt = (d: string, w: number | null, ema: number | null, uitbijter = false): Trendpunt => ({
  d: d as Trendpunt['d'], w, ema, kcal: null, eiwit: null,
  afwijkingKg: null, uitbijter,
})

/** Een gewone reeks rond de 118, met het gemiddelde erbovenop. */
const gewoon = (): Trendpunt[] => [
  punt('2026-08-01', 118.4, 118.4),
  punt('2026-08-02', 117.9, 118.35),
  punt('2026-08-03', 118.1, 118.32),
  punt('2026-08-04', 117.6, 118.25),
  punt('2026-08-05', 117.8, 118.2),
]

describe('de as kijkt naar de reeks', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('laat een uitschieter de uitsnede niet bepalen', () => {
    const met = [...gewoon()]
    met.splice(2, 0, punt('2026-08-06', 190.2, 125.4, true))
    const { lo, hi } = gewichtSchaal(met)
    /* De uitsnede loopt tot het gemiddelde, niet tot de weging. */
    expect(hi).toBeLessThan(130)
    expect(lo).toBeGreaterThan(115)
  })

  it('en zonder uitschieter verandert er niets aan de uitsnede', () => {
    const { lo, hi, buitenBeeld } = gewichtSchaal(gewoon())
    expect(lo).toBeCloseTo(116.8, 5)
    expect(hi).toBeCloseTo(119.2, 5)
    expect(buitenBeeld).toEqual([])
  })

  /* Het gemiddelde is de uitkomst van het model: dat hoort in beeld te blijven,
     ook als het door zo'n weging een paar kilo omhoog is gelopen. */
  it('rekent het voortschrijdend gemiddelde wél mee', () => {
    const met = [...gewoon(), punt('2026-08-07', 190.2, 125.4, true)]
    expect(gewichtSchaal(met).hi).toBeGreaterThanOrEqual(125.4)
  })
})

describe('de weging verdwijnt niet', () => {
  it('geeft een uitschieter buiten de uitsnede terug om te tekenen', () => {
    const met = [...gewoon(), punt('2026-08-07', 190.2, 125.4, true)]
    const { buitenBeeld } = gewichtSchaal(met)
    expect(buitenBeeld).toHaveLength(1)
    expect(buitenBeeld[0]!.w).toBe(190.2)
  })

  /* Op de rand zetten wat er gewoon binnen valt zou liegen over waar het ligt.
     Een aangemerkte weging van 119 in een reeks rond de 118 hoort op 119. */
  it('maar laat een gemarkeerde weging die binnen valt gewoon op zijn plek', () => {
    const met = [...gewoon(), punt('2026-08-07', 119.0, 118.3, true)]
    const { buitenBeeld, hi } = gewichtSchaal(met)
    expect(119.0).toBeLessThan(hi)
    expect(buitenBeeld).toEqual([])
  })
})

describe('als er niets overblijft om op te schalen', () => {
  /* Twee wegingen waarvan er één afwijkt: er ís geen rest om je op te richten.
     Dan doet de figuur wat hij altijd deed en schaalt hij op alles, want een as
     op één punt is geen as. */
  it('valt terug op alle waarden en zet niets op de rand', () => {
    const kaal = [punt('2026-08-01', 118.0, null), punt('2026-08-02', 190.2, null, true)]
    const { hi, buitenBeeld } = gewichtSchaal(kaal)
    expect(hi).toBeGreaterThan(190)
    expect(buitenBeeld).toEqual([])
  })

  it('en een lege reeks levert geen onzin op', () => {
    const { buitenBeeld } = gewichtSchaal([punt('2026-08-01', 118.0, 118.0)])
    expect(buitenBeeld).toEqual([])
  })
})
