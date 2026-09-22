/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **Geen antwoord is geen afwijzing.** Dit is de belangrijkste regel van het
 * bestand en de makkelijkste om per ongeluk om te draaien. De app roept een
 * functie aan die pas bestaat nadat bestand 48 gedraaid is, en wie in de trein
 * zit krijgt helemaal niets terug. In allebei die gevallen hoort de app open te
 * blijven: de poort die geld kost ligt in de edge function en die weigert zelf
 * wel, met een zin erbij.
 *
 * **Maar een onbekende status telt niet als goed.** Dat lijkt hetzelfde en is
 * het tegenovergestelde: komt er een antwoord terug met een status die deze
 * versie van de app niet kent, dan is dat geen ruis maar een nieuwere database.
 * Zo'n waarde stilletjes als toegelaten lezen is precies de fout die pas op de
 * rekening zichtbaar wordt.
 *
 * **Elke weigering draagt een zin.** Een uitleg die null teruggeeft laat een
 * leeg vlak achter waar de knop stond, en dat leest als een storing.
 *
 * **En de eigenaar leest geen budget.** Wie op honderdduizend staat heeft geen
 * teller nodig; een teller die er altijd staat wordt niet meer gelezen.
 */
import { describe, expect, it } from 'vitest'
import {
  ONBEKEND, geslotenScherm, leesToegang, magAi, restZin, uitlegAi,
} from './toegang'

const uit = (o: Record<string, unknown>) =>
  leesToegang(o as Parameters<typeof leesToegang>[0])

const toegelaten = uit({
  mag: true, status: 'toegelaten', reden: 'goed',
  gebruikt: 12, budget: 100, beheerder: false, maand_tot: '2026-10-01',
})

describe('wat de database terugstuurt', () => {
  it('leest een gewone uitslag over', () => {
    expect(toegelaten).toEqual({
      status: 'toegelaten', reden: 'goed', gebruikt: 12, budget: 100,
      beheerder: false, maandTot: '2026-10-01',
    })
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('houdt de app open als er niets terugkomt', () => {
    for (const leeg of [null, undefined, {}]) {
      const t = leesToegang(leeg as Parameters<typeof leesToegang>[0])
      expect(t.status).toBe('onbekend')
      expect(magAi(t)).toBe(true)
      expect(geslotenScherm(t)).toBe(false)
    }
    expect(magAi(ONBEKEND)).toBe(true)
  })

  /* En de andere kant: een antwoord dat er wél is maar dat deze app niet kent.
     Dat is geen ruis maar een database die verder is dan deze versie. */
  it('vertrouwt een status niet die het niet kent', () => {
    const t = uit({ status: 'geschorst', reden: 'nieuw-geval', gebruikt: 1, budget: 10 })
    expect(t.status).toBe('onbekend')
    expect(t.reden).toBe('onbekend')
  })

  it('maakt van onzin geen getal', () => {
    const t = uit({ status: 'wacht', reden: 'wacht', gebruikt: 'veel', budget: null })
    expect(t.gebruikt).toBe(0)
    expect(t.budget).toBe(0)
  })

  it('neemt de beheerdersvlag alleen over als hij echt waar is', () => {
    expect(uit({ status: 'toegelaten', beheerder: 'ja' }).beheerder).toBe(false)
    expect(uit({ status: 'toegelaten', beheerder: true }).beheerder).toBe(true)
  })
})

describe('wat de app ermee doet', () => {
  it('laat de AI toe aan wie is toegelaten en aan niemand die wacht', () => {
    expect(magAi(toegelaten)).toBe(true)
    expect(magAi(uit({ status: 'wacht', reden: 'wacht' }))).toBe(false)
    expect(magAi(uit({ status: 'afgewezen', reden: 'afgewezen' }))).toBe(false)
  })

  /* Alleen een echte afwijzing haalt de app van het scherm. Wie wacht mag
     wegen en loggen, en dat is de hele afspraak met een tester. */
  it('zet alleen bij een afwijzing een scherm in de plaats van de app', () => {
    expect(geslotenScherm(uit({ status: 'afgewezen', reden: 'afgewezen' }))).toBe(true)
    expect(geslotenScherm(uit({ status: 'wacht', reden: 'wacht' }))).toBe(false)
    expect(geslotenScherm(toegelaten)).toBe(false)
  })

  it('geeft bij elke weigering een zin en bij goed geen', () => {
    expect(uitlegAi(toegelaten)).toBeNull()
    for (const geval of [
      { status: 'wacht', reden: 'wacht' },
      { status: 'afgewezen', reden: 'afgewezen' },
      { status: 'toegelaten', reden: 'maand-op', budget: 100, maand_tot: '2026-10-01' },
      { status: 'toegelaten', reden: 'uur-vol' },
    ]) {
      const zin = uitlegAi(uit(geval))
      expect(zin, JSON.stringify(geval)).toBeTruthy()
      expect(zin!.length).toBeGreaterThan(20)
    }
  })

  /* Wie wacht hoort te lezen dat de rest van de app wél werkt. Zonder die zin
     is "wacht op toelating" een dichte deur in plaats van een half open. */
  it('zegt tegen wie wacht dat de rest gewoon werkt', () => {
    const zin = uitlegAi(uit({ status: 'wacht', reden: 'wacht' }))!
    expect(zin).toMatch(/wegen/i)
  })

  it('noemt bij een lege maand het aantal en de dag dat hij terugspringt', () => {
    const zin = uitlegAi(uit({
      status: 'toegelaten', reden: 'maand-op', budget: 100, maand_tot: '2026-10-01',
    }))!
    expect(zin).toContain('100')
    expect(zin).toContain('2026-10-01')
  })

  it('laat de dag weg als de database hem niet meegaf', () => {
    const zin = uitlegAi(uit({ status: 'toegelaten', reden: 'maand-op', budget: 100 }))!
    expect(zin).toContain('100')
    expect(zin).not.toContain('springt')
  })
})

describe('de teller die er niet altijd hoort te staan', () => {
  it('telt af voor wie een budget heeft dat ergens op slaat', () => {
    expect(restZin(toegelaten)).toBe('88 van je 100 herkenningen over deze maand')
  })

  it('zwijgt bij de eigenaar, die op honderdduizend staat', () => {
    expect(restZin(uit({ status: 'toegelaten', gebruikt: 12, budget: 100000 }))).toBeNull()
  })

  it('en zwijgt bij wie nog wacht, want daar is de teller niet het punt', () => {
    expect(restZin(uit({ status: 'wacht', reden: 'wacht', budget: 100 }))).toBeNull()
  })

  /* Een budget kan overschreden worden: de maandgrens telt alleen geslaagde
     aanroepen en de rem per uur laat er een enkele langs. Dan hoort er nul te
     staan en geen negatief getal. */
  it('gaat niet onder nul', () => {
    expect(restZin(uit({ status: 'toegelaten', gebruikt: 140, budget: 100 })))
      .toBe('0 van je 100 herkenningen over deze maand')
  })
})
