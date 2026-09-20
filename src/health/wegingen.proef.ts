/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **Alleen dagen waarop gewogen is.** Een dag zonder weging is geen weging van
 * nul, en hij hoort dus niet als regel in de lijst te komen. Diezelfde regel
 * staat overal in deze app, en hier zou hij een lege regel opleveren waar je op
 * "weghalen" kunt tikken.
 *
 * **Nieuwste eerst.** Wie zijn reeks naloopt begint bij wat er net gebeurd is.
 * En dagen komen niet gesorteerd uit de database.
 *
 * **De markering en de afwijking komen uit de rekenkern.** Dit bestand rekent
 * niets opnieuw uit: zou het dat wel doen, dan konden de figuur en de lijst
 * verschillende wegingen aanwijzen.
 *
 * **En je ziet wat je overhoudt.** Wegstrepen zonder te zien wat er overblijft
 * is een sprong in het duister, en de lijst kan leeg raken.
 */
import { describe, expect, it } from 'vitest'
import { wegingen, zonder } from './wegingen'
import type { Trendpunt } from './rekenkern'

const punt = (
  d: string, w: number | null, opties: Partial<Trendpunt> = {},
): Trendpunt => ({
  d: d as Trendpunt['d'], w, ema: w, kcal: null, eiwit: null,
  afwijkingKg: null, uitbijter: false, ...opties,
})

describe('de lijst met je wegingen', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('laat dagen zonder weging weg', () => {
    const uit = wegingen([punt('2026-09-01', 119), punt('2026-09-02', null),
                          punt('2026-09-03', 118.4)])
    expect(uit.map((w) => w.kg)).toEqual([118.4, 119])
  })

  it('zet de nieuwste bovenaan, ook als de reeks door elkaar staat', () => {
    const uit = wegingen([punt('2026-09-03', 118), punt('2026-09-01', 120),
                          punt('2026-09-02', 119)])
    expect(uit.map((w) => w.datum)).toEqual(['2026-09-03', '2026-09-02', '2026-09-01'])
  })

  it('neemt de markering en de afwijking over uit de reeks', () => {
    const uit = wegingen([
      punt('2026-09-01', 119),
      punt('2026-09-02', 190.2, { uitbijter: true, afwijkingKg: 71.4 }),
    ])
    expect(uit[0]?.uitbijter).toBe(true)
    expect(uit[0]?.afwijkingKg).toBe(71.4)
    expect(uit[1]?.uitbijter).toBe(false)
  })

  it('geeft een lege lijst als er nooit gewogen is', () => {
    expect(wegingen([punt('2026-09-01', null)])).toEqual([])
    expect(wegingen([])).toEqual([])
  })
})

describe('wat er overblijft', () => {
  const lijst = wegingen([
    punt('2026-09-01', 119), punt('2026-09-02', 190.2), punt('2026-09-03', 118.4),
  ])

  it('telt de wegingen en noemt de laagste en de hoogste', () => {
    const uit = zonder(lijst, new Set())
    expect(uit).toEqual({ over: 3, laagste: 118.4, hoogste: 190.2 })
  })

  it('laat de dagen weg die eruit gaan', () => {
    const uit = zonder(lijst, new Set(['2026-09-02']))
    expect(uit).toEqual({ over: 2, laagste: 118.4, hoogste: 119 })
  })

  /* Een lege reeks is geen reeks van nul kilo. Zonder deze regel zou er
     "van 0 tot 0 kg" staan, en dat is precies het soort getal dat deze app
     nergens neerzet. */
  it('geeft geen grenzen als er niets overblijft', () => {
    const uit = zonder(lijst, new Set(['2026-09-01', '2026-09-02', '2026-09-03']))
    expect(uit).toEqual({ over: 0, laagste: null, hoogste: null })
  })
})
