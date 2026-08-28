/**
 * DE POORT DIE ER NIET MEER IS
 *
 * Het inlogscherm van de huiswerk-app wordt overgeslagen als het portaal al weet
 * wie er is. Dat is precies het soort versoepeling dat stilletjes te ver kan
 * gaan: dan opent de app straks op het profiel van iemand anders, of op dat van
 * een ouder, of op een aanmelding van gisteravond.
 *
 * Daarom staan de vier weigeringen hier vast, en niet alleen het geval dat wél
 * werkt.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pidVanNaam, portaalKind } from './portaal'

const SLEUTEL = 'bennahub.wie'
const NU = Date.parse('2026-08-26T15:00:00Z')

/** Een aanmelding zoals het portaal hem wegschrijft. */
function meldAan(naam: string, rol: 'kind' | 'ouder', geleden = 0): void {
  localStorage.setItem(SLEUTEL, JSON.stringify({
    gezin: 'benna', naam, rol, emoji: '🙂', kleur: '#5EA03A', apps: [], tijd: NU - geleden,
  }))
}

/* Eerst de stub eraf, dán opruimen: de nagemaakte opslag heeft geen `clear`. */
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

describe('de naam van het portaal koppelen aan een profiel', () => {
  it('vindt elk van de vier kinderen', () => {
    expect(pidVanNaam('Wassima')).toBe('wassima')
    expect(pidVanNaam('Amaani')).toBe('amaani')
    expect(pidVanNaam('Amine')).toBe('amine')
    expect(pidVanNaam('Selma')).toBe('selma')
  })

  it('trekt zich niets aan van hoofdletters en spaties', () => {
    expect(pidVanNaam('  aMiNe ')).toBe('amine')
  })

  it('geeft niets terug bij een naam die geen profiel heeft', () => {
    expect(pidVanNaam('Papa')).toBeNull()
    expect(pidVanNaam('')).toBeNull()
    expect(pidVanNaam('Amin')).toBeNull()
  })
})

describe('het kind dat via het portaal binnenkomt', () => {
  it('gaat rechtstreeks door bij een geldige aanmelding', () => {
    meldAan('Selma', 'kind')
    expect(portaalKind(NU)).toBe('selma')
  })

  it('laat een ouder niet als kind binnen', () => {
    meldAan('Amine', 'ouder')
    expect(portaalKind(NU)).toBeNull()
  })

  /* Acht uur is de houdbaarheid van het portaal zelf. Zou deze app een andere
     grens aanhouden, dan komt een kind soms door terwijl het portaal hem al
     vergeten is — of andersom. */
  it('houdt dezelfde houdbaarheid aan als het portaal', () => {
    meldAan('Amine', 'kind', 7.9 * 3600 * 1000)
    expect(portaalKind(NU)).toBe('amine')
    meldAan('Amine', 'kind', 8.1 * 3600 * 1000)
    expect(portaalKind(NU)).toBeNull()
  })

  it('begint gewoon op het beginscherm als er niemand aan staat', () => {
    expect(portaalKind(NU)).toBeNull()
  })

  it('valt niet om op rommel in de opslag', () => {
    localStorage.setItem(SLEUTEL, 'geen json')
    expect(portaalKind(NU)).toBeNull()
    localStorage.setItem(SLEUTEL, '{"rol":"kind"}')
    expect(portaalKind(NU)).toBeNull()
  })

  /* Een tablet met opslag op slot (privémodus) moet de app niet stukmaken. */
  it('valt niet om als localStorage weigert', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('geweigerd') },
      setItem: () => { throw new Error('geweigerd') },
      removeItem: () => { throw new Error('geweigerd') },
    })
    expect(portaalKind(NU)).toBeNull()
  })
})
