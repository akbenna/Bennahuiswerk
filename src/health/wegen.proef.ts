/**
 * De proef op het wegen van een herkende regel.
 *
 * Het rekenwerk is vermenigvuldigen, en dat hoort te kloppen. Wat hier vooral
 * getoetst wordt is wat er níet mag gebeuren: een graad die naar A springt, een
 * band die naar nul gaat, en een vraag om te wegen bij een regel waar niets te
 * winnen valt.
 */
import { describe, expect, it } from 'vitest'
import { TABELBAND, grootsteOnzekerheid, spreiding, weegRegel } from './wegen'
import type { HerkendeRegel } from './ai'
import type { Graad } from '@/gedeeld/db/tabellen'

function regel(o: Partial<HerkendeRegel> = {}): HerkendeRegel {
  return {
    naam: 'Tajine met kip', moment: 'diner',
    hoeveelheid: 1, eenheid: 'portie', gram_equivalent: 400,
    kcal_punt: 720, kcal_laag: 520, kcal_hoog: 980,
    eiwit_g: 46, vet_g: 30, koolhydraat_g: 71, vezel_g: 8,
    conf: 'D' as Graad, onzekerheidsbronnen: ['portie geschat uit de foto'],
    bron: 'foto-ai', nevo_code: '1491', nevo_naam: 'Tajine kip',
    gram_laag: 300, gram_hoog: 560, ai_model: 'proef',
    ...o,
  }
}

describe('spreiding', () => {
  it('is de breedte van de band in kcal', () => {
    expect(spreiding(regel())).toBe(460)
  })
  it('wordt nooit negatief', () => {
    expect(spreiding(regel({ kcal_laag: 900, kcal_hoog: 500 }))).toBe(0)
  })
})

describe('grootsteOnzekerheid', () => {
  const smal = regel({ naam: 'Appel', kcal_punt: 95, kcal_laag: 88, kcal_hoog: 102 })

  it('wijst de breedste band aan, en niet de grootste portie', () => {
    /* Een regel van 1.200 kcal met een smalle band heeft niets te winnen; een
       regel van 720 met een brede band wel. Op aantal zou de eerste winnen. */
    const groot = regel({ naam: 'Etiketmaaltijd', kcal_punt: 1200, kcal_laag: 1150, kcal_hoog: 1250 })
    expect(grootsteOnzekerheid([groot, regel()])).toBe(1)
  })

  it('zwijgt als er niets te winnen valt', () => {
    expect(grootsteOnzekerheid([smal])).toBeNull()
  })

  it('vraagt niet om te wegen wat al gewogen is', () => {
    /* Een regel die net door weegRegel is gegaan draagt alleen nog de
       tabelband. Zonder deze regel zou de app je vragen nog eens te wegen wat je
       zojuist gewogen hebt. */
    const gewogen = weegRegel(regel(), 380)
    expect(grootsteOnzekerheid([gewogen])).toBeNull()
  })

  it('kiest uit meerdere de breedste', () => {
    const midden = regel({ naam: 'Rijst', kcal_punt: 300, kcal_laag: 240, kcal_hoog: 380 })
    expect(grootsteOnzekerheid([smal, midden, regel()])).toBe(2)
  })
})

describe('weegRegel', () => {
  it('schaalt alles mee naar het gewogen gewicht', () => {
    const uit = weegRegel(regel(), 200)          // was 400 g
    expect(uit.kcal_punt).toBe(360)
    expect(uit.eiwit_g).toBe(23)
    expect(uit.gram_equivalent).toBe(200)
    expect(uit.hoeveelheid).toBe(200)
    expect(uit.eenheid).toBe('g')
  })

  it('laat de tabelonzekerheid staan en maakt er geen punt van', () => {
    /* Dit is de kern. Na het wegen is de portie bekend, maar de voedingswaarde
       komt nog uit de tabel. Een kaal getal zou beweren dat die exact is. */
    const uit = weegRegel(regel(), 400)
    expect(uit.kcal_laag).toBe(Math.round(720 * (1 - TABELBAND)))
    expect(uit.kcal_hoog).toBe(Math.round(720 * (1 + TABELBAND)))
    expect(uit.kcal_hoog).toBeGreaterThan(uit.kcal_punt)
  })

  it('gaat naar C met een tabelwaarde erachter, en nooit naar A', () => {
    expect(weegRegel(regel({ conf: 'D' }), 300).conf).toBe('C')
  })

  it('laat een regel zonder tabelwaarde op zijn eigen graad staan', () => {
    /* Zonder nevo_code komt de voedingswaarde van het model. Wegen maakt de
       portie zeker en de voedingswaarde niet. */
    expect(weegRegel(regel({ nevo_code: null, conf: 'D' }), 300).conf).toBe('D')
  })

  it('verlaagt een graad nooit', () => {
    expect(weegRegel(regel({ conf: 'A' }), 300).conf).toBe('A')
  })

  it('zegt dat de weging de schatting vervangt, en gooit de rest niet weg', () => {
    const uit = weegRegel(regel({ onzekerheidsbronnen: ['bereidingsvet geschat'] }), 250)
    expect(uit.onzekerheidsbronnen[0]).toContain('gewogen: 250 g')
    expect(uit.onzekerheidsbronnen[0]).toContain('vervangt')
    expect(uit.onzekerheidsbronnen).toContain('bereidingsvet geschat')
  })

  it('laat de regel met rust bij onzin', () => {
    for (const g of [0, -5, NaN, Infinity]) {
      expect(weegRegel(regel(), g)).toEqual(regel())
    }
    expect(weegRegel(regel({ gram_equivalent: 0 }), 200).kcal_punt).toBe(720)
  })
})
