/**
 * WAAROP DE HERKENNING ZICH BASEERDE
 *
 * Het scherm "Alle gegevens" van Apple Gezondheid toont een kale kolom getallen
 * bij datums. Welke grootheid dat is staat alleen in de kop bovenaan, en wie
 * eerst doorscrolt en dán een afdruk maakt heeft die kop niet in beeld. De
 * herkenning moet dan kiezen tussen stappen en kilocalorieën op niets anders dan
 * hoe groot de getallen zijn.
 *
 * Dat mag. Wat niet mag is dat stil doen: een verkeerd geraden kolom ziet er in
 * de database uit als elke andere rij, en is achteraf niet terug te vinden. Het
 * scherm toont daarom vóór het overnemen wat er geraden is.
 *
 * Deze proef gaat over die ene beslissing, en met opzet niet over de herkenning
 * zelf, die draait in een edge function en is van hier niet te bereiken.
 */
import { describe, expect, it } from 'vitest'
import { BRONNAAM, geraden } from './ai'
import type { Importbron } from './ai'

const kop: Importbron = { wat: 'stappen', hoe: 'kop', kop: 'Stappen', dagen: 14 }
const reeks: Importbron = { wat: 'stappen', hoe: 'reeks', kop: 'Stappen', dagen: 9 }
const gok: Importbron = { wat: 'actieve_energie_kcal', hoe: 'grootte', kop: null, dagen: 16 }
const onbekend: Importbron = { wat: 'onbekend', hoe: 'kop', kop: null, dagen: 3 }

describe('welke reeksen een gok zijn', () => {
  it('een gelezen kop is geen gok', () => {
    expect(geraden([kop])).toEqual([])
  })

  /* Een kop die van een ándere afdruk van dezelfde lijst komt is net zo goed
     gelezen. Wie doorscrolt maakt meerdere afdrukken, en de kop staat dan op de
     eerste. Zou dit als gok tellen, dan kreeg je bij elke lange lijst een
     waarschuwing die nergens op slaat, en daar kijk je na twee keer overheen. */
  it('een kop van een andere afdruk van dezelfde lijst ook niet', () => {
    expect(geraden([reeks])).toEqual([])
  })

  it('afgeleid uit de grootte is wél een gok', () => {
    expect(geraden([gok])).toEqual([gok])
  })

  /* "Onbekend" met een gelezen kop bestaat: de kop stond er, maar zei iets waar
     dit veld geen plek voor heeft. Dan is er evengoed niets om op te vertrouwen. */
  it('en onbekend telt mee, ook als er een kop gelezen is', () => {
    expect(geraden([onbekend])).toEqual([onbekend])
  })

  it('geeft alleen de gokken terug en niet de rest', () => {
    expect(geraden([kop, gok, reeks, onbekend])).toEqual([gok, onbekend])
  })
})

describe('wat er gebeurt vóór de uitrol', () => {
  /* De edge function die nu draait kent `bronnen` niet en stuurt het veld niet
     mee. Dan hoort het scherm te werken zoals het altijd werkte, en niet te
     waarschuwen over iets wat het niet weet. Zonder deze regel zou de uitrol
     een voorwaarde worden in plaats van een verbetering. */
  it('geen bronnen is geen waarschuwing', () => {
    expect(geraden(undefined)).toEqual([])
    expect(geraden([])).toEqual([])
  })
})

describe('de namen op het scherm', () => {
  it('elke grootheid heeft een naam in gewoon Nederlands', () => {
    for (const wat of ['stappen', 'actieve_energie_kcal', 'kcal', 'gewicht_kg', 'onbekend'] as const) {
      expect(BRONNAAM[wat], wat).toBeTruthy()
      expect(BRONNAAM[wat], wat).not.toMatch(/_/)
    }
  })

  /* De twee die door elkaar gehaald worden zijn stappen en actieve energie,
     dat is precies de verwarring waar dit hele veld voor bestaat. Ze mogen op
     het scherm dus nooit hetzelfde heten. */
  it('stappen en actieve energie heten niet hetzelfde', () => {
    expect(BRONNAAM.stappen).not.toBe(BRONNAAM.actieve_energie_kcal)
  })
})
