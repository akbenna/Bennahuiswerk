/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Vier van de acht STOP-BANG-vragen gaan over iets wat de app al weet:
 * geslacht, leeftijd, BMI en nekomtrek. Die overnemen scheelt vier kansen om
 * mis te tikken, en brengt precies één gevaar mee.
 *
 * **Niet gemeten is geen nee.** Een ontbrekende waarde hoort géén sleutel op te
 * leveren, en zeker geen `false`. Op het scherm zien die twee er hetzelfde uit
 * (een vinkje dat uit staat) en dat is nu juist de reden dat het in de gegevens
 * wél te onderscheiden moet zijn. Deze proef zet dat vast voor alle vier.
 *
 * **En de grenzen zijn die van de vragenlijst.** Ouder dan 50 en BMI boven 35
 * zijn strikt; de nekomtrek is 43 cm of meer bij mannen en 41 of meer bij
 * vrouwen. Een randgeval dat de verkeerde kant op valt, telt een punt te veel of
 * te weinig in een score waar drie punten al "matig risico" heet.
 */
import { describe, expect, it } from 'vitest'
import { stopbangUitGegevens } from './klinisch'

const leeg = { geslacht: null, leeftijdJaar: null, bmi: null, nekCm: null } as const

describe('niet gemeten is geen nee', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('geeft niets terug als er niets bekend is', () => {
    expect(stopbangUitGegevens(leeg)).toEqual({})
  })

  it('laat elke ontbrekende waarde weg in plaats van hem op nee te zetten', () => {
    const uit = stopbangUitGegevens({ ...leeg, geslacht: 'm' })
    expect(uit).toEqual({ man: true })
    expect('bmi' in uit).toBe(false)
    expect('leeftijd' in uit).toBe(false)
    expect('nek' in uit).toBe(false)
  })

  /* De nekvraag heeft twee dingen nodig, want de grens verschilt per geslacht.
     Een nekomtrek zonder geslacht is dus geen antwoord. */
  it('beantwoordt de nekvraag niet zonder geslacht', () => {
    expect('nek' in stopbangUitGegevens({ ...leeg, nekCm: 44 })).toBe(false)
  })

  it('en een nee is wél een nee', () => {
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'v' })).toEqual({ man: false })
  })
})

describe('de grenzen van de vragenlijst', () => {
  it('ouder dan 50 is strikt', () => {
    expect(stopbangUitGegevens({ ...leeg, leeftijdJaar: 50 }).leeftijd).toBe(false)
    expect(stopbangUitGegevens({ ...leeg, leeftijdJaar: 51 }).leeftijd).toBe(true)
  })

  it('BMI boven 35 is strikt', () => {
    expect(stopbangUitGegevens({ ...leeg, bmi: 35 }).bmi).toBe(false)
    expect(stopbangUitGegevens({ ...leeg, bmi: 35.1 }).bmi).toBe(true)
  })

  it('de nekomtrek is 43 of meer bij een man', () => {
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'm', nekCm: 42.9 }).nek).toBe(false)
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'm', nekCm: 43 }).nek).toBe(true)
  })

  it('en 41 of meer bij een vrouw', () => {
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'v', nekCm: 40.9 }).nek).toBe(false)
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'v', nekCm: 41 }).nek).toBe(true)
  })

  /* Dezelfde nek, een andere grens. Zonder dit verschil zou het geslacht bij
     deze vraag niets uitmaken en was de hele voorwaarde overbodig. */
  it('geeft bij dezelfde nekomtrek een ander antwoord per geslacht', () => {
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'm', nekCm: 42 }).nek).toBe(false)
    expect(stopbangUitGegevens({ ...leeg, geslacht: 'v', nekCm: 42 }).nek).toBe(true)
  })
})

describe('alles bekend', () => {
  it('beantwoordt precies die vier vragen en geen andere', () => {
    const uit = stopbangUitGegevens({
      geslacht: 'm', leeftijdJaar: 41, bmi: 30.4, nekCm: 44,
    })
    expect(uit).toEqual({ man: true, leeftijd: false, bmi: false, nek: true })
  })
})
