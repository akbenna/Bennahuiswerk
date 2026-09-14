/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * De drempels, want die zijn niet van mij. Ze staan in Verordening (EG)
 * 1924/2006 en een vlaggetje dat er net naast zit is een claim die het product
 * niet mag voeren. Elke grens wordt daarom van twee kanten getoetst: net eronder
 * mag hij niet verschijnen, net erop wel.
 *
 * En dat ontbrekende waarden zwijgen. Een product zonder vezelgehalte is geen
 * product zonder vezels, en een product zonder natriumwaarde is niet zoutarm.
 * Dat is dezelfde regel die de rest van deze app volgt en hij is hier
 * verleidelijk om te overtreden, want `null <= 120` is in JavaScript waar.
 */
import { describe, expect, it } from 'vitest'
import { claims } from './claims'

const namen = (v: Parameters<typeof claims>[0]) => claims(v).map((c) => c.id)

describe('eiwit — 12 % en 20 % van de energie', () => {
  /* 100 kcal, 5 g eiwit = 20 kcal = 20 %. */
  it('geeft eiwitrijk op precies 20 %', () => {
    expect(namen({ kcal: 100, eiwit_g: 5 })).toContain('eiwitrijk')
  })

  it('geeft bron van eiwit tussen 12 en 20 %', () => {
    expect(namen({ kcal: 100, eiwit_g: 3 })).toContain('eiwitbron')   // 12 %
    expect(namen({ kcal: 100, eiwit_g: 4.9 })).toContain('eiwitbron')
  })

  it('geeft niets onder de 12 %', () => {
    expect(namen({ kcal: 100, eiwit_g: 2.9 })).toEqual([])
  })

  it('geeft nooit twee eiwitvlaggen tegelijk', () => {
    const ids = namen({ kcal: 100, eiwit_g: 9 })
    expect(ids.filter((x) => x.startsWith('eiwit'))).toHaveLength(1)
  })

  /* Skyr: 60 kcal en 11 g eiwit per 100 g — 44 kcal uit eiwit, ruim 70 %. */
  it('herkent skyr als eiwitrijk', () => {
    expect(namen({ kcal: 60, eiwit_g: 11 })).toContain('eiwitrijk')
  })
})

describe('vezels — 3 en 6 gram, of per 100 kcal', () => {
  it('geeft vezelrijk vanaf 6 g per 100 g', () => {
    expect(namen({ kcal: 300, vezel_g: 6 })).toContain('vezelrijk')
  })

  it('geeft vezelrijk ook via de energieroute', () => {
    expect(namen({ kcal: 100, vezel_g: 3 })).toContain('vezelrijk')   // 3 g/100 kcal
  })

  it('geeft bron van vezels tussen de twee grenzen', () => {
    expect(namen({ kcal: 300, vezel_g: 3 })).toContain('vezelbron')
  })

  it('geeft niets onder de ondergrens', () => {
    expect(namen({ kcal: 400, vezel_g: 2 })).toEqual([])
  })
})

describe('natrium — alleen de lage kant', () => {
  it('vlagt een laag natriumgehalte', () => {
    expect(namen({ kcal: 50, natrium_mg: 120 })).toContain('zoutarm')
  })

  it('zwijgt net erboven', () => {
    expect(namen({ kcal: 50, natrium_mg: 121 })).toEqual([])
  })

  /* Een bouillonblokje is geen "veel zout"-vlag waard: wat veel is hangt af van
     hoeveel je ervan gebruikt, en dat weet dit vlaggetje niet. */
  it('zet geen waarschuwing bij een zoutrijk product', () => {
    expect(namen({ kcal: 200, natrium_mg: 19687 })).toEqual([])
  })
})

describe('onbekend zwijgt', () => {
  it('vlagt niets als de waarde ontbreekt', () => {
    expect(namen({ kcal: 100 })).toEqual([])
    expect(namen({ kcal: 100, eiwit_g: null, vezel_g: null, natrium_mg: null })).toEqual([])
  })

  /* `null <= 120` is in JavaScript waar. Zonder de expliciete null-toets zou
     elk product zonder natriumwaarde "laag natriumgehalte" krijgen. */
  it('houdt een ontbrekend natrium niet voor zoutarm', () => {
    expect(namen({ kcal: 100, natrium_mg: null })).not.toContain('zoutarm')
    expect(namen({ kcal: 100, natrium_mg: undefined })).not.toContain('zoutarm')
  })

  it('deelt niet door nul', () => {
    expect(namen({ kcal: 0, eiwit_g: 10, vezel_g: 10 })).toEqual([])
  })
})

describe('elke vlag draagt zijn grond', () => {
  it('noemt de regel waar hij op steunt', () => {
    for (const c of claims({ kcal: 60, eiwit_g: 11, vezel_g: 8, natrium_mg: 40 })) {
      expect(c.grond.length).toBeGreaterThan(20)
      expect(c.naam.length).toBeGreaterThan(3)
    }
  })
})
