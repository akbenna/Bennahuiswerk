/**
 * HET SCHOOLJAAR, EN DE UITZONDERING DAARIN
 *
 * Twee dingen staan hier vast.
 *
 * Het eerste is Wassima. Zij doet 2 havo over. Van de vier kinderen is zij de
 * enige die niet opschuift, en dat is precies het soort detail dat een volgende
 * hand "gelijktrekt" met de rest omdat het eruitziet als een vergeten regel.
 * Dan ziet een kind dat net is blijven zitten stof die het nooit gehad heeft.
 * Vandaar dat het hier met zoveel woorden staat.
 *
 * Het tweede is dat elk rekenkundig antwoord in de nieuwe stof opnieuw wordt
 * uitgerekend. Ze zijn nagerekend voordat ze in het bestand kwamen, maar een
 * getal dat één keer klopte blijft niet vanzelf kloppen als iemand er later een
 * cijfer in verandert.
 */
import { describe, expect, it } from 'vitest'
import { PROFIELEN, PROFIELEN_OUD } from './gegevens/profielen'
import { KLASSEN, SCHOOLJAAR, jaarNu, naarDitJaar } from './gegevens/schooljaar'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'

describe('wie er dit schooljaar in welke klas zit', () => {
  it('is ingevuld voor 2026/27', () => {
    expect(SCHOOLJAAR).toBe('2026/27')
  })

  /* De regel waar het om gaat. */
  it('laat Wassima 2 havo overdoen en zet haar niet een jaar hoger', () => {
    expect(KLASSEN.wassima?.overgegaan).toBe(false)
    expect(PROFIELEN.wassima?.niveau).toBe('2 havo')
    expect(PROFIELEN.wassima?.volgend).toBe('3 havo')
  })

  it('heeft de andere drie wél een klas laten opschuiven', () => {
    expect(PROFIELEN.amaani?.niveau).toBe('5 vwo')
    expect(PROFIELEN.amine?.niveau).toBe('groep 8')
    expect(PROFIELEN.selma?.niveau).toBe('groep 5')
    for (const pid of ['amaani', 'amine', 'selma']) {
      expect(KLASSEN[pid]?.overgegaan, pid).toBe(true)
    }
  })

  /* De vaste lijst is het bewijs dat de overzetting uit de oude pagina klopte.
     Die hoort niet mee te schuiven met het schooljaar. */
  it('laat het migratieverslag ongemoeid', () => {
    expect(PROFIELEN_OUD.wassima?.niveau).toBe('2 havo')
    expect(PROFIELEN_OUD.amine?.niveau).toBe('groep 7')
    expect(PROFIELEN_OUD.selma?.niveau).toBe('groep 4')
    expect(PROFIELEN_OUD.amaani?.niveau).toBe('4 vwo')
  })

  it('houdt verder alles uit het verslag overeind', () => {
    for (const [pid, oud] of Object.entries(PROFIELEN_OUD)) {
      const nu = PROFIELEN[pid]
      expect(nu?.naam, pid).toBe(oud.naam)
      expect(nu?.emoji, pid).toBe(oud.emoji)
      expect(nu?.vakken, pid).toEqual(oud.vakken)
      expect(nu?.beloning, pid).toBe(oud.beloning)
    }
  })
})

describe('het leerjaar van de opgaven', () => {
  it('schuift de stof van volgend jaar naar nu voor wie is overgegaan', () => {
    expect(jaarNu({ p: 'amine', jaar: 'next' })).toBe('nu')
    expect(jaarNu({ p: 'selma', jaar: 'next' })).toBe('nu')
    expect(jaarNu({ p: 'amaani', jaar: 'next' })).toBe('nu')
  })

  it('laat de vooruitblik van Wassima staan waar hij staat', () => {
    expect(jaarNu({ p: 'wassima', jaar: 'next' })).toBe('next')
  })

  it('raakt de stof van dit jaar nooit aan', () => {
    for (const pid of ['wassima', 'amaani', 'amine', 'selma']) {
      expect(jaarNu({ p: pid }), pid).toBe('nu')
      expect(jaarNu({ p: pid, jaar: 'nu' }), pid).toBe('nu')
    }
  })

  it('haalt het veld weg in plaats van het op undefined te zetten', () => {
    const [uit] = naarDitJaar([{ p: 'amine', jaar: 'next' }])
    expect(uit).toEqual({ p: 'amine' })
    expect('jaar' in (uit ?? {})).toBe(false)
  })

  it('verandert niets anders aan een opgave', () => {
    const heen = SEED.filter((e) => e.p === 'amine' && e.jaar === 'next')
    const terug = naarDitJaar(heen)
    expect(terug).toHaveLength(heen.length)
    terug.forEach((e, i) => {
      expect(e.id).toBe(heen[i]?.id)
      expect(e.q).toBe(heen[i]?.q)
      expect(e.a).toBe(heen[i]?.a)
    })
  })

  it('geeft de drie overgegane kinderen daadwerkelijk meer stof voor dit jaar', () => {
    const heen = naarDitJaar(SEED)
    for (const pid of ['amaani', 'amine', 'selma']) {
      const voor = SEED.filter((e) => e.p === pid && (e.jaar ?? 'nu') === 'nu').length
      const na = heen.filter((e) => e.p === pid && (e.jaar ?? 'nu') === 'nu').length
      expect(na, pid).toBeGreaterThan(voor)
    }
    const wVoor = SEED.filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu').length
    const wNa = heen.filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu').length
    expect(wNa).toBe(wVoor)
  })
})

describe('de nieuwe opgaven voor 2026/27', () => {
  it('heeft geen id die botst met de vaste lijst', () => {
    const seedIds = new Set(SEED.map((e) => e.id))
    for (const e of NIEUW2627) expect(seedIds.has(e.id), e.id).toBe(false)
    expect(new Set(NIEUW2627.map((e) => e.id)).size).toBe(NIEUW2627.length)
  })

  it('is er niet voor Wassima — zij doet haar jaar over', () => {
    expect(NIEUW2627.filter((e) => e.p === 'wassima')).toHaveLength(0)
  })

  it('hoort helemaal bij dit jaar, niet bij volgend jaar', () => {
    for (const e of NIEUW2627) expect(e.jaar, e.id).toBeUndefined()
  })

  it('heeft overal een vraag, een antwoord en een uitwerking', () => {
    for (const e of NIEUW2627) {
      expect(e.q.trim().length, e.id).toBeGreaterThan(5)
      expect(String(e.a).trim().length, e.id).toBeGreaterThan(0)
      expect((e.s ?? '').trim().length, e.id).toBeGreaterThan(5)
      expect(e.h?.length, e.id).toBeGreaterThan(0)
    }
  })

  it('geeft bij meerkeuze altijd een antwoord dat tussen de opties staat', () => {
    for (const e of NIEUW2627.filter((x) => x.opties?.length)) {
      expect(e.opties, e.id).toContain(e.a)
    }
  })
})

/**
 * De rekenkundige antwoorden opnieuw narekenen. Alleen de sommen waarvan de
 * uitkomst hier los te herleiden is — de taal- en begripsvragen staan er niet
 * tussen, en dat hoort ook niet: die zijn met de hand nagelopen.
 */
describe('de sommen kloppen nog steeds', () => {
  const zoek = (q: string): string => {
    const e = NIEUW2627.find((x) => x.q.includes(q))
    if (!e) throw new Error('opgave niet gevonden: ' + q)
    return String(e.a)
  }
  const getal = (t: string): number => Number(t.replace('−', '-').replace(',', '.'))

  it('rekent de procenten en verhoudingen van Amine na', () => {
    expect(getal(zoek('25% korting'))).toBe(80 * 0.75)
    expect(getal(zoek('Na 20% korting'))).toBe(48 / 0.8)
    expect(getal(zoek('btw is 21%'))).toBe(200 * 1.21)
    expect(getal(zoek('verhouding 3 : 5'))).toBe(40 * 3 / 8)
    expect(getal(zoek('cijfers 6, 7, 8, 5 en 9'))).toBe((6 + 7 + 8 + 5 + 9) / 5)
    expect(getal(zoek('3 cm bij 4 cm bij 5 cm'))).toBe(3 * 4 * 5)
    expect(getal(zoek('basis van 8 cm'))).toBe(8 * 5 / 2)
    expect(getal(zoek('1 : 25 000'))).toBe(4 * 25000 / 100000)
  })

  it('rekent de kansrekening en groei van Amaani na', () => {
    expect(getal(zoek('zuivere dobbelsteen'))).toBe((1 + 2 + 3 + 4 + 5 + 6) / 6)
    expect(getal(zoek('win je € 5 met kans 0,2'))).toBeCloseTo(0.2 * 5 - 0.8 * 2, 10)
    expect(getal(zoek('groepje van 3'))).toBe((10 * 9 * 8) / 6)
    expect(getal(zoek('5 verschillende boeken'))).toBe(120)
    expect(zoek('allebei rood')).toBe('5/14')
    expect(5 / 8 * 4 / 7).toBeCloseTo(5 / 14, 10)
    expect(getal(zoek('groeit met 3% per jaar'))).toBeCloseTo(1.03 ** 10, 3)
    expect(getal(zoek('groeifactor 0,9 per jaar'))).toBeCloseTo(Math.log(0.5) / Math.log(0.9), 2)
    expect(getal(zoek('van 200 naar 260'))).toBeCloseTo((260 / 200) ** (1 / 5), 3)
  })

  it('rekent de scheikunde en natuurkunde van Amaani na', () => {
    expect(getal(zoek('36,0 gram water'))).toBeCloseTo(36 / 18.02, 1)
    expect(getal(zoek('0,50 mol NaCl'))).toBeCloseTo(0.5 * 58.44, 1)
    expect(getal(zoek('van stilstand naar 20 m/s'))).toBe(20 / 8)
    expect(getal(zoek('versnelt met 2,5 m/s²'))).toBe(1200 * 2.5)
    expect(getal(zoek('kinetische energie'))).toBe(0.5 * 1200 * 400)
    expect(getal(zoek('in 8,0 s opgebouwd'))).toBe(240000 / 8)
    expect(getal(zoek('tilt 500 kg 12 m'))).toBeCloseTo(500 * 9.81 * 12, 6)
  })

  it('rekent de sommen van Selma na', () => {
    expect(getal(zoek('7 × 8'))).toBe(56)
    expect(getal(zoek('6 × 9'))).toBe(54)
    expect(getal(zoek('47 + 38'))).toBe(85)
    expect(getal(zoek('92 − 47'))).toBe(45)
    expect(getal(zoek('35 : 5'))).toBe(7)
    expect(getal(zoek('€ 3,50'))).toBe(3.5 / 2)
  })
})
