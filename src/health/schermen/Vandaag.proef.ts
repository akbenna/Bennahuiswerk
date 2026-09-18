/**
 * DE REGEL ONDER DE HERO
 *
 * Eén zin die zegt of de app weet wat je lust. Hij heeft een eigen proef omdat
 * hij twee dingen tegelijk moet doen en er maar één van goed gaat vanzelf:
 * uitnodigen als er niets staat, en verantwoorden als er wel iets staat.
 *
 * Wat hier stil mis kan gaan: een zin die zegt dat de voorstellen zich ergens
 * aan houden terwijl er niets is ingesteld. Dat is geen lelijke tekst maar een
 * onwaarheid over wat de app doet — en het is precies wat er gebeurt als iemand
 * een veld toevoegt aan `Voorkeuren` en `ietsIngesteld` vergeet.
 */
import { describe, expect, it } from 'vitest'
import { voorkeurzin } from './Vandaag'
import { GEEN_VOORKEUR } from '../voorkeuren'
import type { Voorkeuren } from '../voorkeuren'

const v = (p: Partial<Voorkeuren>): Voorkeuren => ({ ...GEEN_VOORKEUR, ...p })

describe('voorkeurzin', () => {
  it('nodigt uit zolang er niets staat', () => {
    expect(voorkeurzin(GEEN_VOORKEUR)).toMatch(/weten nog niet wat je lust/)
    /* En bij een profiel van vóór dit veld net zo. */
    expect(voorkeurzin(undefined)).toMatch(/weten nog niet wat je lust/)
  })

  it('verantwoordt zodra er iets staat', () => {
    const zin = voorkeurzin(v({ patroon: 'vegetarisch', nooit: ['Vis, schaal- en schelpdieren'] }))
    expect(zin).toMatch(/houden zich aan/)
    expect(zin).toContain('vegetarisch')
    expect(zin).toContain('1 groepen uit')
  })

  it('telt en somt niet op', () => {
    /* Drie groepen bij naam is op een telefoon een afgekapte zin, en een halve
       opsomming is misleidender dan een getal: je denkt dat je alles leest. */
    const zin = voorkeurzin(v({ nooit: ['Vlees en gevogelte', 'Vleeswaren', 'Kaas'] }))
    expect(zin).toContain('3 groepen uit')
    expect(zin).not.toContain('Vleeswaren')
  })

  it('noemt de keukens en de weggeklikte producten apart', () => {
    const zin = voorkeurzin(v({ keukens: ['turks'], nietProduct: ['2731', '2730'] }))
    expect(zin).toContain('1 keukens uit')
    expect(zin).toContain('2 weggeklikt')
  })

  it('noemt alleen wat er is', () => {
    /* "0 groepen uit" is ruis: het zegt dat er iets is waar niets is. */
    expect(voorkeurzin(v({ nietProduct: ['2731'] }))).not.toContain('groepen')
    expect(voorkeurzin(v({ nooit: ['Kaas'] }))).not.toContain('weggeklikt')
    expect(voorkeurzin(v({ nooit: ['Kaas'] }))).not.toContain('keukens')
  })

  it('zegt nooit dat er iets geldt terwijl er niets geldt', () => {
    /* De belangrijkste van dit bestand. Elke afzonderlijke knop hoort de zin
       om te zetten van uitnodiging naar verantwoording; vergeet er iemand een,
       dan belooft de app iets wat ze niet waarmaakt. */
    const knoppen: Array<Partial<Voorkeuren>> = [
      { patroon: 'veganistisch' }, { nooit: ['Kaas'] }, { liever: ['Vis, schaal- en schelpdieren'] },
      { keukens: ['syrisch'] }, { nietProduct: ['2731'] },
    ]
    for (const k of knoppen) {
      expect(voorkeurzin(v(k)), JSON.stringify(k)).toMatch(/houden zich aan/)
    }
  })
})
