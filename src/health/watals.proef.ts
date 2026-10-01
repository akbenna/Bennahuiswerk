/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * **De richting van elk effect.** Kilo's eraf betekent bloeddruk omlaag, totaal
 * cholesterol omlaag en HDL omhoog, en dat laatste is de enige die de andere
 * kant op gaat. Een teken dat omklapt is hier geen rekenfout maar een bewering
 * over de literatuur die niemand doet.
 *
 * **De band staat niet op de effectmaat maar op de uitkomst.** Het sterkste
 * effect op de bloeddruk geeft het láágste risico. Wie die twee verwisselt
 * toont een band die de verkeerde kant op staat, en dat ziet er precies zo
 * geloofwaardig uit.
 *
 * **Nul kilo verandert niets.** De schuif begint daar, en daar hoort hetzelfde
 * te staan als op het scherm eronder. Anders vertrouwt niemand de rest.
 *
 * **De hartleeftijd is zichzelf consistent.** Wie precies de ideale waarden
 * heeft, krijgt zijn eigen leeftijd terug. Dat is de enige proef die de
 * omkering echt vastlegt: hij gebruikt dezelfde functie in twee richtingen.
 *
 * **En buiten 40 tot 69 houdt het op.** Daar geeft SCORE2 niets terug, en een
 * doorgetrokken lijn buiten het bereik van een model is precies het getal dat in
 * een spreekkamer blijft hangen.
 */
import { describe, expect, it } from 'vitest'
import { IDEAAL, PER_KILO, hartleeftijd, waardenNa, watals } from './watals'
import type { WatalsInvoer } from './watals'

const man: WatalsInvoer = {
  geslacht: 'm', leeftijd: 52, rookt: false, dm: false,
  gewichtKg: 119, sbd: 132, tc: 5.1, hdl: 1.2,
}

describe('van kilo naar waarden', () => {
  it('laat alles staan bij nul kilo', () => {
    const w = waardenNa(man, { kilosEraf: 0, stoptMetRoken: false }, 'mid')
    expect(w).toEqual({ gewichtKg: 119, sbd: 132, tc: 5.1, hdl: 1.2, rookt: false })
  })

  /* DE PROEF WAAR DIT STUK VOOR BESTAAT: de richting van de drie effecten. */
  it('haalt bloeddruk en cholesterol eraf en doet HDL erbij', () => {
    const w = waardenNa(man, { kilosEraf: 10, stoptMetRoken: false }, 'mid')
    expect(w.gewichtKg).toBe(109)
    expect(w.sbd).toBe(132 - 10 * PER_KILO.sbd.mid)
    expect(w.tc).toBe(4.6)
    expect(w.hdl).toBeGreaterThan(man.hdl)
  })

  it('rekent met de sterkte die gevraagd wordt', () => {
    const zwak = waardenNa(man, { kilosEraf: 10, stoptMetRoken: false }, 'zwak')
    const sterk = waardenNa(man, { kilosEraf: 10, stoptMetRoken: false }, 'sterk')
    expect(sterk.sbd).toBeLessThan(zwak.sbd)
    expect(sterk.tc).toBeLessThan(zwak.tc)
    expect(sterk.hdl).toBeGreaterThan(zwak.hdl)
  })

  it('zet roken pas uit als het scenario dat zegt', () => {
    const roker = { ...man, rookt: true }
    expect(waardenNa(roker, { kilosEraf: 0, stoptMetRoken: false }, 'mid').rookt).toBe(true)
    expect(waardenNa(roker, { kilosEraf: 0, stoptMetRoken: true }, 'mid').rookt).toBe(false)
    /* En stoppen met iets wat je niet doet verandert niets. */
    expect(waardenNa(man, { kilosEraf: 0, stoptMetRoken: true }, 'mid').rookt).toBe(false)
  })
})

describe('van waarden naar risico', () => {
  it('geeft hetzelfde risico bij nul kilo', () => {
    const uit = watals(man, { kilosEraf: 0, stoptMetRoken: false })
    expect(uit?.straks.risico).toBeCloseTo(uit!.nu.risico, 10)
  })

  it('laat het risico dalen als er kilo af gaan', () => {
    const uit = watals(man, { kilosEraf: 10, stoptMetRoken: false })!
    expect(uit.straks.risico).toBeLessThan(uit.nu.risico)
  })

  /* De band hoort om de middelste heen te liggen, en de ondergrens hoort bij
     het stérkste effect. Verwisseld ziet dat er net zo geloofwaardig uit. */
  it('zet de band om de middelste uitkomst heen', () => {
    const uit = watals(man, { kilosEraf: 10, stoptMetRoken: false })!
    expect(uit.laagste.risico).toBeLessThanOrEqual(uit.straks.risico)
    expect(uit.hoogste.risico).toBeGreaterThanOrEqual(uit.straks.risico)
    expect(uit.laagste.waarden.sbd).toBeLessThan(uit.hoogste.waarden.sbd)
  })

  it('laat stoppen met roken meetellen', () => {
    const roker = { ...man, rookt: true }
    const blijft = watals(roker, { kilosEraf: 0, stoptMetRoken: false })!
    const stopt = watals(roker, { kilosEraf: 0, stoptMetRoken: true })!
    expect(stopt.straks.risico).toBeLessThan(blijft.straks.risico * 0.75)
  })

  it('geeft niets terug buiten het bereik van SCORE2', () => {
    expect(watals({ ...man, leeftijd: 38 }, { kilosEraf: 10, stoptMetRoken: false })).toBeNull()
    expect(watals({ ...man, leeftijd: 71 }, { kilosEraf: 10, stoptMetRoken: false })).toBeNull()
  })
})

describe('de hartleeftijd', () => {
  /* DE PROEF DIE DE OMKERING VASTLEGT. Wie precies de ideale waarden heeft,
     hoort zijn eigen leeftijd terug te krijgen. */
  it('geeft je eigen leeftijd terug bij de ideale waarden', () => {
    for (const leeftijd of [45, 52, 60, 66]) {
      const ideaal = watals(
        { ...man, leeftijd, rookt: false, dm: false, sbd: IDEAAL.sbd, tc: IDEAAL.tc, hdl: IDEAAL.hdl },
        { kilosEraf: 0, stoptMetRoken: false },
      )!
      expect(hartleeftijd('m', ideaal.nu.risico)).toEqual({ jaren: leeftijd })
    }
  })

  it('ligt hoger dan je eigen leeftijd bij ongunstige waarden', () => {
    const uit = watals(man, { kilosEraf: 0, stoptMetRoken: false })!
    const h = hartleeftijd('m', uit.nu.risico)
    expect(h).toHaveProperty('jaren')
    expect((h as { jaren: number }).jaren).toBeGreaterThan(man.leeftijd)
  })

  it('zegt dat het ophoudt in plaats van door te trekken', () => {
    expect(hartleeftijd('m', 0.1)).toEqual({ grens: 'onder' })
    expect(hartleeftijd('m', 40)).toEqual({ grens: 'boven' })
  })

  it('loopt mee met het risico', () => {
    const laag = hartleeftijd('m', 2) as { jaren: number }
    const hoog = hartleeftijd('m', 6) as { jaren: number }
    expect(hoog.jaren).toBeGreaterThan(laag.jaren)
  })

  it('doet hetzelfde voor vrouwen, met hun eigen coëfficiënten', () => {
    const m = hartleeftijd('m', 4) as { jaren: number }
    const v = hartleeftijd('v', 4) as { jaren: number }
    expect(v.jaren).not.toBe(m.jaren)
  })
})
