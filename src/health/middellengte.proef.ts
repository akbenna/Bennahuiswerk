/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * De middel-lengteverhouding is één deling, en juist daarom is het de moeite
 * waard op te schrijven wat hij níét doet.
 *
 * **Hij rekent niet met een half getal.** Een ontbrekende middelomtrek of een
 * ontbrekende lengte geeft `null` en geen ratio uit een nul. Dat lijkt
 * vanzelfsprekend tot iemand `?? 0` schrijft om het type kloppend te maken, en
 * dan staat er op het scherm een verhouding van nul of van oneindig bij een
 * gebruiker die simpelweg nog niets gemeten heeft.
 *
 * **De grens is een zone en geen streep.** De meetfout van de middelomtrek
 * loopt in de literatuur van 0,7 tot 15 cm; bij een lengte van 1,90 m is twee
 * centimeter al 0,01 in de verhouding. Wie op 0,50 uitkomt weet dus niet aan
 * welke kant hij staat, en dat hoort het scherm te zeggen in plaats van te
 * kiezen. Dit is dezelfde regel als overal elders in deze app: geen getal
 * zonder zijn onzekerheid.
 *
 * **En de grens hangt niet aan de lengte.** Dat is het hele punt van deze maat
 * naast de afkappunten van 94 en 102 cm: dezelfde 102 cm betekent iets anders
 * bij 1,70 m dan bij 1,96 m.
 */
import { describe, expect, it } from 'vitest'
import { middelLengte } from './klinisch'

describe('de verhouding zelf', () => {
  it('deelt middel door lengte', () => {
    expect(middelLengte(95, 190)?.ratio).toBe(0.5)
    expect(middelLengte(108, 196)?.ratio).toBe(0.55)
  })

  it('rondt af op twee cijfers, want de derde is meetfout', () => {
    expect(middelLengte(101, 196)?.ratio).toBe(0.52)
  })
})

describe('wat er gebeurt zonder meting', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT.
     Een ontbrekende meting is geen nul. */
  it('geeft niets terug als er iets ontbreekt', () => {
    expect(middelLengte(null, 196)).toBeNull()
    expect(middelLengte(108, null)).toBeNull()
    expect(middelLengte(null, null)).toBeNull()
  })

  it('en ook niet bij een nul of een negatief getal', () => {
    expect(middelLengte(0, 196)).toBeNull()
    expect(middelLengte(108, 0)).toBeNull()
    expect(middelLengte(-108, 196)).toBeNull()
  })
})

describe('de grens is een zone', () => {
  it('noemt 0,50 noch boven noch onder', () => {
    expect(middelLengte(95, 190)?.zone).toBe('rond')
  })

  it('en 0,49 en 0,51 evenmin, want dat is dezelfde twee centimeter', () => {
    expect(middelLengte(93, 190)?.zone).toBe('rond')
    expect(middelLengte(97, 190)?.zone).toBe('rond')
  })

  it('maar duidelijk eronder en erboven wel', () => {
    expect(middelLengte(85, 190)?.zone).toBe('onder')
    expect(middelLengte(108, 190)?.zone).toBe('boven')
  })
})

describe('waarom deze maat naast de centimeters staat', () => {
  /* Dezelfde 98 cm: bij 1,70 m ruim boven de grens, bij 1,96 m er precies op.
     Zonder dit verschil zou de verhouding niets toevoegen aan de afkappunten,
     die immers voor iedereen dezelfde centimeters noemen. */
  it('geeft bij dezelfde omtrek een andere uitkomst per lengte', () => {
    expect(middelLengte(98, 170)?.zone).toBe('boven')
    expect(middelLengte(98, 196)?.zone).toBe('rond')
  })

  /* En de 94 uit de richtlijn, de grens waarboven het gewicht niet meer mag
     toenemen, ligt bij 1,96 m ruim onder de helft van de lengte. */
  it('en zet de laagste afkapwaarde bij een lange man onder de grens', () => {
    expect(middelLengte(94, 196)?.zone).toBe('onder')
  })
})
