/**
 * Het overzetten naar ProVita bezorgt alleen bij ProVita.
 *
 * `postMessage` met `'*'` als doel zou de export bezorgen bij elke site die
 * deze app opent. Deze proef legt vast dat er alleen naar de genoemde
 * adressen wordt gestuurd, en dat het er zonder opener niets van wordt.
 */
import { describe, expect, it } from 'vitest'
import { BERICHTSOORT, PROVITA_ORIGINS, stuurNaarProvita, vraagtNaarProvita } from './naarprovita'

describe('naar ProVita', () => {
  it('stuurt alleen naar de ProVita-adressen, nooit naar elke origin', () => {
    const verstuurd: string[] = []
    stuurNaarProvita({ postMessage: (_b, o) => verstuurd.push(o) }, { formaat: 'x' })
    expect(verstuurd).toEqual([...PROVITA_ORIGINS])
    expect(verstuurd).not.toContain('*')
    for (const o of verstuurd) expect(o).toMatch(/^https:\/\/(www\.)?provita-care\.nl$/)
  })

  it('verpakt het bestand met een soort die ProVita herkent', () => {
    let bericht: unknown = null
    stuurNaarProvita({ postMessage: (b) => { bericht = b } }, { formaat: 'bennahealth-export' })
    expect(bericht).toEqual({ soort: BERICHTSOORT, bestand: { formaat: 'bennahealth-export' } })
  })

  it('zonder opener wordt er niets verstuurd', () => {
    expect(stuurNaarProvita(null, {})).toBe(false)
  })

  it('herkent de vraag alleen aan naar=provita', () => {
    expect(vraagtNaarProvita('?naar=provita')).toBe(true)
    expect(vraagtNaarProvita('?naar=elders')).toBe(false)
    expect(vraagtNaarProvita('')).toBe(false)
  })
})
