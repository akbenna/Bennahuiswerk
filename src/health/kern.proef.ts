/**
 * WAT ER NAAR BUITEN GAAT, EN WAT NIET
 *
 * `kern.ts` is de grens tussen wat BennaHealth zelf doet en wat ProVita Care
 * van hem overneemt. De kop van dat bestand legt uit waarom die grens langs de
 * MDR loopt en niet langs de techniek. Deze proef zorgt dat hij er niet
 * ongemerkt overheen schuift: een export erbij is een bewuste regel hier, en
 * een naam uit de verboden rij valt om.
 */
import { describe, expect, it } from 'vitest'
import * as kern from './kern'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Precies wat er nu naar buiten gaat. Typen tellen niet: die bestaan na het
 *  bundelen niet meer. */
const TOEGESTAAN = [
  'FACTOR',
  'KCAL_PER_KG',
  'KERN_VERSIE',
  'MEETRUIS_CM',
  'UITBIJTER_KG',
  'UITBIJTER_MIN_N',
  'VENSTER',
  'ZOUTFACTOR',
  'analyse',
  'bmr',
  'dagVerschil',
  'equivalent',
  'middelbeloop',
  'plusDagen',
  'regressie',
  'trendReeks',
  'weektotaal',
  'zoutGram',
]

/** Namen die een oordeel geven. Staat er één in de kern, dan is de grens uit
 *  de kop van `kern.ts` overschreden. */
const VERBODEN = [
  'score2', 'fib4', 'stopbangScore', 'onderhoudZone',
  'sarcfscore', 'sarcfsignaal', 'stoeltestTraag', 'maaltijdenBovenDrempel', 'spierbeeld',
  'WEEKDOEL_MIN',
]

describe('de kern', () => {
  it('exporteert precies de afgesproken lijst', () => {
    expect(Object.keys(kern).sort()).toEqual([...TOEGESTAAN].sort())
  })

  it('exporteert geen enkele functie die oordeelt', () => {
    for (const naam of VERBODEN) expect(Object.keys(kern)).not.toContain(naam)
  })

  it('haalt niets binnen uit de modules die oordelen', () => {
    /* De exportlijst zegt niet alles: een module kan klinisch.ts importeren en
       een uitkomst daarvan doorgeven onder een onschuldige naam. Dat geldt nu
       voor geen van de vier, en de bron is hier de enige plek waar dat te zien
       is. */
    const hier = 'src/health'
    for (const bestand of ['kern.ts', 'rekenkern.ts', 'middelbeloop.ts', 'zout.ts', 'inspanning.ts']) {
      const bron = readFileSync(join(hier, bestand), 'utf8')
      expect(bron, bestand).not.toMatch(/from '\.\/(klinisch|trap|spier|conditie|watals)'/)
    }
  })

  it('draagt een versie in de vorm die ProVita leest', () => {
    expect(kern.KERN_VERSIE).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
