/**
 * WAT HET TEKEN BELOOFT
 *
 * Het onderscheid tussen een gemeten tabelwaarde en een schatting is de kern van
 * deze app: het bepaalt hoeveel een getal waard is. Sinds het een teken is in
 * plaats van een woord is het ook makkelijker om per ongeluk om te draaien —
 * ◆ en ◇ verschillen op het scherm minder dan "NEVO:" en "geen tabelwaarde".
 *
 * Daarom staat hier vast wélk teken bij wat hoort, en dat de volledige woorden
 * nergens verdwijnen: ze horen in de uitleg te blijven staan.
 */
import { describe, expect, it } from 'vitest'
import { herkomstTekst, herkomstVan } from './herkomst'

describe('herkomstVan', () => {
  it('een tabelnaam maakt het gemeten', () => {
    const h = herkomstVan({ nevo_naam: 'Tarwestokbrood wit' })
    expect(h.gemeten).toBe(true)
    expect(h.teken).toBe('◆')
  })

  it('een tabelcode alleen is ook genoeg', () => {
    expect(herkomstVan({ nevo_code: '123' }).gemeten).toBe(true)
  })

  it('zonder tabelwaarde is het geschat', () => {
    const h = herkomstVan({ nevo_naam: null, nevo_code: null })
    expect(h.gemeten).toBe(false)
    expect(h.teken).toBe('◇')
  })

  it('een lege naam telt niet als tabelwaarde', () => {
    expect(herkomstVan({ nevo_naam: '' }).gemeten).toBe(false)
  })

  it('een merkregel krijgt het derde teken', () => {
    const h = herkomstVan({ bron: 'merk' })
    expect(h.teken).toBe('◈')
    expect(h.gemeten).toBe(false)
    expect(h.uitleg).toContain('etiket')
  })

  it('de tabel wint van het etiket', () => {
    /* Kan vandaag niet voorkomen — een merkregel heeft geen tabelnaam — maar de
       volgorde ligt vast, zodat een meting nooit door een etiket overschreven
       wordt als die twee ooit samenvallen. */
    expect(herkomstVan({ bron: 'merk', nevo_naam: 'Pindakaas' }).teken).toBe('◆')
  })

  it('drie tekens en geen twee: ze horen alle drie iets anders te zeggen', () => {
    const t = [herkomstVan({ nevo_naam: 'x' }).teken,
               herkomstVan({ bron: 'merk' }).teken,
               herkomstVan({}).teken]
    expect(new Set(t).size).toBe(3)
  })

  it('de bron alleen zegt niets: een gerecht is opgebouwd uit tabelregels', () => {
    expect(herkomstVan({ bron: 'gerecht', nevo_naam: 'Rijst gekookt' }).gemeten).toBe(true)
    expect(herkomstVan({ bron: 'gerecht' }).gemeten).toBe(false)
  })
})

describe('herkomstTekst', () => {
  it('noemt de tabel bij naam, want het teken alleen is geen uitleg', () => {
    const t = herkomstTekst({ nevo_naam: 'Tarwestokbrood wit' })
    expect(t).toContain('voedingsmiddelentabel')
    expect(t).toContain('Tarwestokbrood wit')
  })

  it('zegt bij een schatting dat het een schatting is', () => {
    expect(herkomstTekst({ nevo_naam: null })).toContain('geschat')
  })
})
