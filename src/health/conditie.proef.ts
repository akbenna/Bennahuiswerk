/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Niet dat de teksten kloppen: dat kan een proef niet weten. Wel de twee
 * regels die er echt toe doen en die bij een latere wijziging stil kunnen
 * sneuvelen.
 *
 * De eerste: de app zwijgt zolang er niets is opgegeven. Een lege conditie mag
 * nooit een signaal geven, want leeg betekent "we weten het niet" en niet "er
 * is niets aan de hand". Zou iemand `heeftMed` ooit met een standaardwaarde
 * uitrusten, dan gaan er signalen af bij mensen die nooit iets hebben ingevuld.
 *
 * De tweede: geen enkel signaal bevat een dosis of een getal dat als dosis te
 * lezen is. Dat is de grens tussen voorlichting en behandeling, en die grens is
 * te dun om alleen in een commentaarblok te bewaren. De proef leest de tekst
 * van élk signaal en valt om zodra er een cijfer in staat.
 */
import { describe, expect, it } from 'vitest'
import { conditieGezet, conditieVan, heeftMed, signalen } from './conditie'
import type { Conditie } from './conditie'

const leeg: Conditie = {}

describe('de lege conditie', () => {
  it('geeft geen enkel signaal, ook niet met een afvaldoel', () => {
    expect(signalen(leeg, true)).toEqual([])
    expect(signalen(leeg, false)).toEqual([])
  })

  it('telt niet als ingevuld', () => {
    expect(conditieGezet(leeg)).toBe(false)
    expect(conditieGezet({ med: [] })).toBe(false)
    expect(conditieGezet({ dm2: true })).toBe(true)
  })

  it('komt eruit als er geen instellingen zijn', () => {
    expect(conditieVan({})).toEqual({})
    expect(heeftMed(conditieVan({}), 'insuline')).toBe(false)
  })
})

describe('het hyposignaal', () => {
  it('gaat af bij insuline én een afvaldoel', () => {
    const ids = signalen({ dm2: true, med: ['insuline'] }, true).map((s) => s.id)
    expect(ids).toContain('hypo')
  })

  it('gaat ook af bij een SU-derivaat', () => {
    expect(signalen({ med: ['su'] }, true).map((s) => s.id)).toContain('hypo')
  })

  /* Zonder afvaldoel daalt de inname niet, en dan is er niets te melden. Een
     signaal dat altijd staat wordt niet meer gelezen. */
  it('zwijgt zonder afvaldoel', () => {
    expect(signalen({ med: ['insuline'] }, false)).toEqual([])
  })

  it('gaat niet af bij een middel dat geen hypo geeft', () => {
    expect(signalen({ med: ['glp1'] }, true)).toEqual([])
  })
})

describe('het kaliumsignaal', () => {
  /* Dit signaal hangt aan de hoge bloeddruk en niet aan het afvallen: het gaat
     over het zoutadvies, en dat staat er ook in een onderhoudsfase. */
  it('vraagt om zowel hypertensie als een RAS-remmer', () => {
    expect(signalen({ hypertensie: true, med: ['ras'] }, false).map((s) => s.id)).toContain('kalium')
    expect(signalen({ hypertensie: true }, false)).toEqual([])
    expect(signalen({ med: ['ras'] }, false)).toEqual([])
  })
})

describe('de grens tussen voorlichten en doseren', () => {
  const alles: Conditie = {
    hypertensie: true, dm2: true, hvz: true,
    med: ['insuline', 'su', 'sglt2', 'glp1', 'ras', 'diureticum'],
  }

  it('geeft in geen enkel signaal een getal', () => {
    for (const s of [...signalen(alles, true), ...signalen(alles, false)]) {
      expect(s.kop + ' ' + s.tekst + ' ' + s.handeling).not.toMatch(/\d/)
    }
  })

  it('verwijst in elk signaal naar een mens', () => {
    for (const s of signalen(alles, true)) {
      expect(s.handeling).toMatch(/huisarts|praktijkondersteuner/)
    }
  })

  it('levert elk signaal hoogstens één keer', () => {
    const ids = signalen(alles, true).map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
