/**
 * WANNEER IS EEN VEEG EEN VEEG
 *
 * De haak zelf is niet te toetsen zonder aanrakingen na te bootsen, maar de
 * beslissing wel: die staat los in `veegRichting`. En die beslissing is precies
 * het deel dat stilletjes kapot kan — verruim je één drempel, dan wisselt het
 * scherm van dag terwijl iemand alleen naar beneden scrollde, en dat geeft geen
 * foutmelding maar een app die niet meer te vertrouwen is.
 *
 * Drie voorwaarden, dus drie soorten gevallen: te kort, te schuin, te traag.
 */
import { describe, expect, it } from 'vitest'
import { veegRichting } from './veeg'

describe('veegRichting', () => {
  it('herkent een duidelijke veeg naar links en naar rechts', () => {
    expect(veegRichting(-120, 5, 200)).toBe('links')
    expect(veegRichting(120, 5, 200)).toBe('rechts')
  })

  it('negeert een tik: te weinig afgelegd', () => {
    expect(veegRichting(-59, 0, 200)).toBeNull()
    expect(veegRichting(59, 0, 200)).toBeNull()
    /* Precies op de drempel telt wel: de grens hoort niet te schuiven zonder
       dat iemand dat opschrijft. */
    expect(veegRichting(-60, 0, 200)).toBe('links')
  })

  it('negeert een schuine scroll', () => {
    /* 100 px opzij, 60 omlaag: dat is minder dan twee keer zo horizontaal. */
    expect(veegRichting(100, 60, 200)).toBeNull()
    expect(veegRichting(-100, -60, 200)).toBeNull()
    /* 100 om 49 is wel horizontaal genoeg. */
    expect(veegRichting(100, 49, 200)).toBe('rechts')
  })

  it('negeert een langzaam slepen', () => {
    expect(veegRichting(-200, 0, 701)).toBeNull()
    expect(veegRichting(-200, 0, 700)).toBe('links')
  })

  it('een verticale haal is nooit een veeg, hoe lang ook', () => {
    expect(veegRichting(0, -400, 200)).toBeNull()
    expect(veegRichting(10, -400, 200)).toBeNull()
  })
})
