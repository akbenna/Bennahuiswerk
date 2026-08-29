/**
 * WANNEER BIEDEN WE HET AAN
 *
 * Twee soorten fout, en ze zijn niet even erg. Bied je het te vaak aan, dan
 * leert iedereen eroverheen kijken en is het aanbod waardeloos geworden — ook op
 * het moment dat het klopt. Bied je het te weinig aan, dan mist iemand het één
 * keer en typt hij het opnieuw.
 *
 * Daarom staat de drempel vast in proeven, met aan beide kanten een geval dat
 * er net wel en net niet overheen gaat.
 */
import { describe, expect, it } from 'vitest'
import { lijktOpZin } from './zoekzin'

describe('lijktOpZin', () => {
  it('herkent een maaltijd in gewone taal', () => {
    expect(lijktOpZin('twee boterhammen met mayonaise')).toBe(true)
    expect(lijktOpZin('een bord tajine met kip')).toBe(true)
    expect(lijktOpZin('brood met kaas')).toBe(true)
  })

  it('laat een gewone zoekterm met rust', () => {
    expect(lijktOpZin('tonijn')).toBe(false)
    expect(lijktOpZin('halfvolle melk')).toBe(false)
    expect(lijktOpZin('mayonaise')).toBe(false)
    expect(lijktOpZin('')).toBe(false)
  })

  it('telt vulwoorden mee, want díe verraden de zin', () => {
    /* Zonder "met" zijn dit twee woorden en zou het aanbod uitblijven, terwijl
       dit precies het geval is waarvoor het bedoeld is. */
    expect(lijktOpZin('brood met kaas')).toBe(true)
    expect(lijktOpZin('brood kaas')).toBe(false)
  })

  it('losse letters tellen niet mee', () => {
    /* "a b c d" is geen zin maar getik. */
    expect(lijktOpZin('a b c d')).toBe(false)
    expect(lijktOpZin('ei op brood')).toBe(true)
  })

  it('leestekens maken geen extra woorden', () => {
    expect(lijktOpZin('brood, kaas')).toBe(false)
    expect(lijktOpZin('yoghurt (250 ml)')).toBe(true)
  })
})
