/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Dat er niets verschijnt waar niets hoort. Een foto die bij het verkeerde
 * product staat is erger dan geen foto: hij zegt met stelligheid iets onjuists
 * over wat je gaat eten, en niemand controleert een plaatje.
 *
 * Verder dat de lijst kort blijft. Groeit hij ooit voorbij een handvol, dan is
 * dat het moment om de vraag opnieuw te stellen of hij niet in de database
 * hoort — en niet iets wat ongemerkt gebeurt.
 */
import { describe, expect, it } from 'vitest'
import { FOTOS, fotoVoor } from './beeld'

describe('opzoeken', () => {
  it('geeft een pad voor een code die in de lijst staat', () => {
    expect(fotoVoor('151')).toBe('/health/eten/food_banana.png')
  })

  it('geeft null voor alles wat er niet in staat', () => {
    expect(fotoVoor('9999')).toBeNull()
    expect(fotoVoor('')).toBeNull()
    expect(fotoVoor(null)).toBeNull()
    expect(fotoVoor(undefined)).toBeNull()
  })

  /* Een code als '__proto__' of 'constructor' mag geen pad opleveren. Een
     gewone objectopzoeking geeft daar de ingebouwde eigenschap terug, en dan
     staat er ineens een <img src="/health/eten/function Object..."> op het
     scherm. */
  it('trapt niet in ingebouwde eigenschappen', () => {
    expect(fotoVoor('__proto__')).toBeNull()
    expect(fotoVoor('constructor')).toBeNull()
    expect(fotoVoor('toString')).toBeNull()
  })
})

describe('de lijst zelf', () => {
  it('wijst alleen naar bestanden in de eigen map', () => {
    for (const bestand of Object.values(FOTOS)) {
      expect(bestand).toMatch(/^food_[a-z_]+\.png$/)
    }
  })

  it('blijft klein genoeg om met de hand na te lopen', () => {
    expect(Object.keys(FOTOS).length).toBeLessThanOrEqual(20)
  })
})
