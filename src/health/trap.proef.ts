/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Eén ding boven alles: **zolang de criteria niet nagekeken zijn, mag er geen
 * enkele "gehaald" uit komen.**
 *
 * Dat is geen stijlregel. De criteria van de medicatietrede komen uit
 * samenvattingen van de NHG-Standaard en niet uit de standaard zelf. Wie niet
 * zeker weet wat de eis is, weet ook niet of iemand eraan voldoet — en een
 * scherm dat dan tóch "gehaald" zegt, stuurt iemand met een verwachting naar
 * zijn huisarts die daar stukloopt.
 *
 * De vlag `MEDICATIE.bevestigd` is het slot. Deze proef gaat over het slot en
 * niet over de criteria erachter: als iemand hem ooit omzet zonder de standaard
 * na te lezen, valt hier niets om — dat kan geen proef vangen. Wat hij wél
 * vangt is de omgekeerde fout: criteria die langs het slot heen lekken.
 */
import { describe, expect, it } from 'vitest'
import {
  GLI_PROGRAMMAS, GLI_TOTAAL_MAANDEN, MEDICATIE, glivoortgang, medicatiecriteria,
  programmaVan, trede,
} from './trap'
import type { Trapvraag } from './trap'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const vraag = (p: Partial<Trapvraag> = {}): Trapvraag =>
  ({ vandaag: '2026-09-19' as IsoDatum, ...p })

describe('het slot op de medicatietrede', () => {
  /* DE BELANGRIJKSTE PROEF VAN DIT BESTAND. */
  it('geeft uitsluitend "niet bekend" zolang de criteria niet bevestigd zijn', () => {
    expect(MEDICATIE.bevestigd).toBe(false)
    for (const v of [
      vraag(),
      vraag({ gliProgramma: 'cool', gliBegonnen: '2020-01-01' as IsoDatum }),
      vraag({ gliProgramma: 'beweegkuur', gliBegonnen: '2026-09-18' as IsoDatum }),
    ]) {
      const c = medicatiecriteria(v)
      expect(c.every((x) => x.stand === 'niet bekend'), JSON.stringify(v)).toBe(true)
    }
  })

  /* Ook bij iemand die er op élk denkbaar criterium doorheen zou komen. Zonder
     dit geval zou een slot dat alleen bij lege gegevens werkt er net zo
     uitzien. */
  it('ook bij iemand die zes jaar in een programma zit', () => {
    const c = medicatiecriteria(vraag({
      gliProgramma: 'cool', gliBegonnen: '2020-09-19' as IsoDatum,
    }))
    expect(c.map((x) => x.stand)).toEqual(['niet bekend'])
  })

  /* Eén regel en geen deellijst: een half beoordeelde eis leest als een halve
     toezegging. */
  it('geeft één regel en geen deellijst', () => {
    expect(medicatiecriteria(vraag())).toHaveLength(1)
  })

  it('en zegt waaróm hij niets beoordeelt', () => {
    expect(medicatiecriteria(vraag())[0]!.toelichting).toMatch(/samenvattingen/)
    expect(MEDICATIE.waarom).toMatch(/NHG-Standaard/)
  })

  /* Wat er wél vaststaat, staat er los bij — en is geen van drieën een getal.
     Zodra hier een BMI-grens in sluipt, is de scheiding tussen "dit weten we"
     en "dit is nog niet nagekeken" weg. */
  it('wat vaststaat bevat geen enkel criterium met een getal', () => {
    expect(MEDICATIE.vast.length).toBeGreaterThan(0)
    for (const zin of MEDICATIE.vast) {
      expect(zin, zin).not.toMatch(/BMI\s*[≥>]?\s*\d/)
    }
  })
})

describe('de erkende programma’s', () => {
  it('er zijn er acht, met een eigen sleutel', () => {
    expect(GLI_PROGRAMMAS).toHaveLength(8)
    expect(new Set(GLI_PROGRAMMAS.map((p) => p.sleutel)).size).toBe(8)
  })

  /* Waar de lengte van de behandelfase niet geverifieerd is, staat null en geen
     nul. Nul zou "meteen klaar" betekenen. */
  it('een onbekende behandelfase is null en geen nul', () => {
    for (const p of GLI_PROGRAMMAS) {
      if (p.behandelfaseMaanden !== null) expect(p.behandelfaseMaanden, p.sleutel).toBeGreaterThan(0)
    }
    expect(programmaVan('xfittt')?.behandelfaseMaanden).toBeNull()
  })

  it('en geen enkele behandelfase duurt langer dan het programma', () => {
    for (const p of GLI_PROGRAMMAS) {
      if (p.behandelfaseMaanden != null) {
        expect(p.behandelfaseMaanden, p.sleutel).toBeLessThanOrEqual(GLI_TOTAAL_MAANDEN)
      }
    }
  })

  it('een onbekende sleutel geeft geen programma en valt niet om', () => {
    expect(programmaVan('bestaatniet')).toBeNull()
    expect(programmaVan(null)).toBeNull()
    expect(programmaVan(undefined)).toBeNull()
  })
})

describe('waar je in je GLI staat', () => {
  const v = (begonnen: string, programma = 'cool') =>
    glivoortgang(programma, begonnen as IsoDatum, '2026-09-19' as IsoDatum)

  it('binnen de behandelfase', () => {
    /* CooL: acht maanden behandelfase. Drie kalendermaanden geleden begonnen —
       19 juni plus drie is 19 september, precies. */
    const g = v('2026-06-19')
    expect(g.fase).toBe('behandelfase')
    expect(g.maanden).toBe(3)
    expect(g.tekst).toMatch(/van de 8 maanden/)
  })

  it('en erna in de onderhoudsfase', () => {
    const g = v('2025-09-19')
    expect(g.fase).toBe('onderhoudsfase')
  })

  it('na twee jaar is het afgerond', () => {
    expect(v('2024-01-01').fase).toBe('afgerond')
  })

  /* PRECIES OP DE GRENS VAN TWEE JAAR.
     Hier viel de eerste versie om. Die rekende met een gemiddelde maand van
     30,44 dagen, en twee kalenderjaren zijn 730 dagen — gedeeld door 30,44 is
     dat 23,98. Wie zijn tweejarige programma op de dag af had doorlopen, las
     dat hij nog in de onderhoudsfase zat. Nu wordt er in kalendermaanden
     geteld. */
  it('precies op twee jaar ook', () => {
    expect(v('2024-09-19').fase).toBe('afgerond')
    expect(v('2024-09-19').maanden).toBe(GLI_TOTAAL_MAANDEN)
    /* En één dag eerder nog niet. */
    expect(v('2024-09-20').fase).toBe('onderhoudsfase')
  })

  /* De dag van de maand telt mee: 19 juni tot 18 september is twee maanden en
     bijna drie weken, en niet drie maanden. */
  it('een maand is pas vol op de dag zelf', () => {
    expect(glivoortgang('cool', '2026-06-19' as IsoDatum, '2026-09-18' as IsoDatum).maanden)
      .toBe(2)
    expect(glivoortgang('cool', '2026-06-19' as IsoDatum, '2026-09-19' as IsoDatum).maanden)
      .toBe(3)
  })

  /* Zonder startdatum valt er niets te zeggen, en dat is iets anders dan "nog
     niet begonnen". */
  it('zonder startdatum is de fase onbekend', () => {
    expect(glivoortgang('cool', null, '2026-09-19' as IsoDatum).fase).toBe('onbekend')
    expect(glivoortgang('cool', undefined, '2026-09-19' as IsoDatum).maanden).toBeNull()
  })

  /* Allebei 'onbekend', maar niet dezelfde zin. "Niet te lezen" bij een datum
     die prima leesbaar is stuurt iemand zijn invoer nakijken die zich enkel in
     het jaar vergist heeft — en dan vindt hij niets. */
  it('en een onleesbare of toekomstige datum ook, maar met een andere reden', () => {
    const onleesbaar = glivoortgang('cool', 'geen datum' as IsoDatum, '2026-09-19' as IsoDatum)
    expect(onleesbaar.fase).toBe('onbekend')
    expect(onleesbaar.tekst).toMatch(/niet te lezen/)

    const toekomst = glivoortgang('cool', '2027-01-01' as IsoDatum, '2026-09-19' as IsoDatum)
    expect(toekomst.fase).toBe('onbekend')
    expect(toekomst.maanden).toBeNull()
    expect(toekomst.tekst).toMatch(/in de toekomst/)
    expect(toekomst.tekst).not.toMatch(/niet te lezen/)
  })

  /* Eén dag te ver is al te ver, en één dag ervoor niet. Zonder deze twee kan
     de grens een maand verschuiven zonder dat er iets omvalt. */
  it('de grens ligt op de dag', () => {
    expect(glivoortgang('cool', '2026-09-20' as IsoDatum, '2026-09-19' as IsoDatum).tekst)
      .toMatch(/in de toekomst/)
    expect(glivoortgang('cool', '2026-09-19' as IsoDatum, '2026-09-19' as IsoDatum).maanden)
      .toBe(0)
  })

  /* Bij een programma zonder bekende behandelfase valt er geen fase te noemen,
     wél een duur. Dat hoort ook anders te lezen dan helemaal niets weten. */
  it('een programma zonder bekende behandelfase geeft wel de duur', () => {
    const g = v('2026-03-19', 'xfittt')
    expect(g.fase).toBe('onbekend')
    expect(g.maanden).toBe(6)
    expect(g.tekst).toMatch(/niet vastgelegd/)
  })
})

describe('op welke trede iemand staat', () => {
  it('zonder opgegeven GLI staat er leefstijl', () => {
    expect(trede(vraag())).toBe('leefstijl')
  })

  it('en met een programma de GLI-trede', () => {
    expect(trede(vraag({ gliProgramma: 'slimmer' }))).toBe('gli')
  })

  /* De app plaatst niemand op de medicatietrede. Dat is een oordeel van de
     huisarts, en er is geen invoer die deze functie daarheen kan brengen. */
  it('niets brengt iemand op de medicatietrede', () => {
    for (const p of [...GLI_PROGRAMMAS.map((x) => x.sleutel), null, 'onzin']) {
      for (const d of ['2010-01-01', '2026-09-19', null]) {
        expect(trede(vraag({ gliProgramma: p, gliBegonnen: d as IsoDatum })))
          .not.toBe('medicatie')
      }
    }
  })
})
