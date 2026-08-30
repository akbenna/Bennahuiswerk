/**
 * DE PORTIES VAN EEN MERKPRODUCT
 *
 * Drie dingen die stil fout kunnen gaan en er dan plausibel uitzien.
 *
 * 1. De volgorde. De portie van de fabrikant hoort vooraan, want dat is de maat
 *    waarin het product bedoeld is. Zakt hij naar beneden, dan is "100 g" wat je
 *    krijgt als je niets kiest — en dat is voor een pak koekjes iets anders.
 * 2. De band. Een etiket ziet eruit als een exact getal en is het niet.
 *    Verdwijnt die band, dan belooft de app een zekerheid die er niet is.
 * 3. Ontbrekende gegevens. Lang niet elk product heeft een portie of een
 *    verpakkingsgewicht; dan hoort die keuze er gewoon niet te staan in plaats
 *    van als nul of als honderd gram.
 */
import { describe, expect, it } from 'vitest'
import { keuzesVoorMerk } from './vensters/Portie'
import type { MerkTreffer } from '@/gedeeld/db/rpc'

function merk(extra: Partial<MerkTreffer> = {}): MerkTreffer {
  return {
    id: 'x', barcode: '123', naam: 'Pindakaas', merk: 'Lidl', groep: null,
    kcal: 600, eiwit_g: 25, vet_g: 50, koolhydraat_g: 12, vezel_g: 6,
    verpakking_gram: 350, portie_gram: 15, portie_naam: '15 g',
    ...extra,
  }
}

describe('keuzesVoorMerk', () => {
  it('zet de portie van de fabrikant vooraan', () => {
    const k = keuzesVoorMerk(merk())
    expect(k.map((x) => x.gram)).toEqual([15, 100, 350])
    expect(k[0]!.label).toContain('portie')
  })

  it('rekent de voedingswaarde naar het gewicht', () => {
    const [portie, honderd, pak] = keuzesVoorMerk(merk())
    expect(portie!.kcal_punt).toBe(90)      // 15 g van 600 kcal/100 g
    expect(honderd!.kcal_punt).toBe(600)
    expect(pak!.kcal_punt).toBe(2100)       // 350 g
    expect(portie!.eiwit_g).toBeCloseTo(3.75)
  })

  it('geeft elke keuze een band, want een etiket is geen meting', () => {
    for (const k of keuzesVoorMerk(merk())) {
      expect(k.kcal_laag).toBeLessThan(k.kcal_punt)
      expect(k.kcal_hoog).toBeGreaterThan(k.kcal_punt)
    }
  })

  it('het gewicht staat wél vast: de band zit op de waarde, niet op de gram', () => {
    /* Wie 100 g afweegt weet het gewicht precies. Wat hij niet precies weet is
       wat erin zit. Zou de band op de gram zitten, dan zou de app beweren dat je
       weegschaal onbetrouwbaar is. */
    for (const k of keuzesVoorMerk(merk())) {
      expect(k.gram_laag).toBe(k.gram)
      expect(k.gram_hoog).toBe(k.gram)
    }
  })

  it('laat weg wat de bron niet weet', () => {
    expect(keuzesVoorMerk(merk({ portie_gram: null })).map((k) => k.gram)).toEqual([100, 350])
    expect(keuzesVoorMerk(merk({ verpakking_gram: null })).map((k) => k.gram)).toEqual([15, 100])
    expect(keuzesVoorMerk(merk({ portie_gram: null, verpakking_gram: null }))
      .map((k) => k.gram)).toEqual([100])
  })

  it('negeert een verpakking die geen verpakking kan zijn', () => {
    /* Open Food Facts bevat gewichten die er als een fout uitzien: een pak van
       vijftig kilo is een pallet, geen boodschap. */
    expect(keuzesVoorMerk(merk({ verpakking_gram: 50000 })).map((k) => k.gram)).toEqual([15, 100])
    expect(keuzesVoorMerk(merk({ verpakking_gram: 0 })).map((k) => k.gram)).toEqual([15, 100])
  })

  it('een ontbrekende macro telt als nul en niet als NaN', () => {
    const k = keuzesVoorMerk(merk({ eiwit_g: null, vezel_g: null }))[0]!
    expect(k.eiwit_g).toBe(0)
    expect(k.vezel_g).toBe(0)
  })
})
