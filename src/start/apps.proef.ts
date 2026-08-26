/**
 * WIE ER VOOROP STAAT
 *
 * Het startportaal zet per groep één app groot: `Appgroep` neemt daarvoor het
 * eerste element van de lijst. Dat betekent dat de volgorde in `apps.ts` een
 * ontwerpkeuze is en niet een toevalligheid van hoe het bestand gegroeid is —
 * maar er staat in de code niets wat dat afdwingt. Wie een app toevoegt plakt
 * hem onderaan, of ertussen, en verschuift zo ongemerkt wat er groot op de
 * voorpagina staat.
 *
 * Deze proef legt de keuze vast. Hij is expres smal: hij eist niet de hele
 * volgorde, alleen wie er per groep vooraan staat en dat elke app precies één
 * keer voorkomt. Zo blijft er ruimte om de rest te herschikken zonder dat de
 * proef in de weg zit, en valt hij wél om zodra de voorpagina verandert.
 */
import { describe, expect, it } from 'vitest'
import { APPS } from './apps'

const eersteVan = (groep: 'kind' | 'groot') => APPS.find((a) => a.groep === groep)?.id

describe('de volgorde van de apps', () => {
  it('zet het huiswerk vooraan bij de kinderen', () => {
    expect(eersteVan('kind')).toBe('huiswerk')
  })

  it('zet BennaHealth vooraan bij de groten', () => {
    /* Verplaatst iemand `health` naar beneden in apps.ts, dan staat er ineens
       een ander gerecht groot op de voorpagina. Dat mag, maar dan bewust. */
    expect(eersteVan('groot')).toBe('health')
  })

  it('kent elke app precies één keer', () => {
    const ids = APPS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('houdt de twee groepen bij elkaar', () => {
    /* De groepen worden apart gefilterd, dus door elkaar staan zou niets breken
       — maar een lijst waarin de groepen door elkaar lopen leest als een
       vergissing, en dan wordt hij er ook een. */
    const groepen = APPS.map((a) => a.groep)
    const wissels = groepen.filter((g, i) => i > 0 && g !== groepen[i - 1]).length
    expect(wissels).toBe(1)
  })
})
