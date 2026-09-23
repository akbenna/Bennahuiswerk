/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Eén ding boven alles: **er bestaat geen invoer waarbij alle criteria op
 * "gehaald" staan.**
 *
 * Tot 20 september 2026 stond hier iets anders: zolang de criteria uit
 * samenvattingen kwamen, mocht er hélemaal geen "gehaald" uit komen. Dat slot
 * heeft gedaan waar het voor stond (de standaard zelf bleek drie dingen te
 * bevatten die in geen samenvatting stonden) en is er nu af.
 *
 * Wat ervoor in de plaats komt is geen zwakkere eis maar een scherpere. De
 * criteria zijn nu de echte, en twee ervan zijn klinische oordelen: of de BMI
 * boven de drempel ligt, en of er gewichtsgerelateerde comorbiditeit is. Die
 * twee beoordeelt deze app niet en kán hij niet beoordelen, het gewicht is
 * zelf ingevoerd, de drempelset hangt af van een vraag die hij niet stelt, en
 * een leeg vinkje bij comorbiditeit is geen "nee".
 *
 * Daaruit volgt de eigenschap die deze proef vasthoudt: welk profiel je ook
 * verzint, er staat altijd minstens één criterium op `niet bekend`. Deze app kan
 * dus nooit een scherm tonen waarop alles groen is. Dat is geen tekortkoming
 * maar de kern: het oordeel is van de huisarts, en de standaard laat die
 * uitdrukkelijk vrij dit aanbod niet te leveren.
 */
import { describe, expect, it } from 'vitest'
import {
  COMORBIDITEIT, DREMPELS, GLI_PROGRAMMAS, GLI_TOTAAL_MAANDEN, MEDICATIE, glivoortgang,
  medicatiecriteria, programmaVan, trede,
} from './trap'
import type { Drempelset, Trapvraag } from './trap'
import type { IsoDatum } from '@/gedeeld/db/tabellen'

const vraag = (p: Partial<Trapvraag> = {}): Trapvraag =>
  ({ vandaag: '2026-09-19' as IsoDatum, ...p })

describe('de criteria van de medicatietrede', () => {
  /* DE BELANGRIJKSTE PROEF VAN DIT BESTAND.
     Alle combinaties van wat het profiel kan bevatten, ook de gunstigste. Als
     er ooit één doorheen komt waarbij alles groen is, staat er een scherm dat
     zegt wat deze app niet mag zeggen. */
  it('laat nooit alle criteria op "gehaald" staan, wat je ook invult', () => {
    const programmas = [undefined, 'cool', 'beweegkuur', 'xfittt', 'onzin']
    const data = [undefined, '2015-01-01', '2020-09-19', '2025-09-19', '2026-09-18', 'geen datum']
    const leeftijden = [undefined, 18, 40, 75, 76, 90]
    let gezien = 0
    for (const pr of programmas) {
      for (const d of data) {
        for (const l of leeftijden) {
          const v = vraag({
            gliProgramma: pr, gliBegonnen: d as IsoDatum | undefined, leeftijd: l,
          })
          const c = medicatiecriteria(v)
          expect(c.length, JSON.stringify(v)).toBeGreaterThan(0)
          expect(
            c.some((x) => x.stand === 'niet bekend'), JSON.stringify(v),
          ).toBe(true)
          gezien++
        }
      }
    }
    expect(gezien).toBe(programmas.length * data.length * leeftijden.length)
  })

  /* En de twee die altijd op "niet bekend" staan, staan er met hun reden, niet
     als leeg vakje. Een criterium zonder uitleg leest als een gebrek van de
     app; mét uitleg leest het als wat het is. */
  it('de twee klinische criteria staan er altijd, met hun reden', () => {
    for (const l of [undefined, 40, 90]) {
      const c = medicatiecriteria(vraag({
        gliProgramma: 'cool', gliBegonnen: '2015-01-01' as IsoDatum, leeftijd: l,
      }))
      const bmi = c.find((x) => /BMI/.test(x.wat))
      const co = c.find((x) => /comorbiditeit/i.test(x.wat))
      expect(bmi?.stand).toBe('niet bekend')
      expect(co?.stand).toBe('niet bekend')
      expect(bmi?.toelichting).toMatch(/huisarts/)
      expect(co?.toelichting).toMatch(/huisarts/)
    }
  })

  /* Het GLI-jaar is wél een feit uit je dossier, en wordt dus wél beoordeeld.
     Zonder deze proef zou "zet alles op niet bekend" de vorige proef halen. */
  it('het jaar leefstijlbegeleiding wordt wél beoordeeld', () => {
    const jaar = (d: string) => medicatiecriteria(vraag({
      gliProgramma: 'cool', gliBegonnen: d as IsoDatum,
    })).find((x) => /leefstijlbegeleiding/.test(x.wat))!

    expect(jaar('2025-09-19').stand).toBe('gehaald')
    expect(jaar('2025-09-20').stand).toBe('niet gehaald')
    expect(jaar('2015-01-01').stand).toBe('gehaald')
    expect(medicatiecriteria(vraag()).find((x) => /leefstijlbegeleiding/.test(x.wat))!.stand)
      .toBe('niet bekend')
  })

  /* De leeftijdsgrens, op de dag. 75 mag, 76 niet, en zonder geboortedatum
     staat er niet "je bent te oud" maar "dat weten we niet". */
  it('de leeftijdsgrens ligt op 75 en niet op 76', () => {
    const leeftijd = (l: number | undefined) => medicatiecriteria(vraag({ leeftijd: l }))
      .find((x) => /Leeftijd/.test(x.wat))!

    expect(leeftijd(75).stand).toBe('gehaald')
    expect(leeftijd(76).stand).toBe('niet gehaald')
    expect(leeftijd(undefined).stand).toBe('niet bekend')
    expect(leeftijd(undefined).toelichting).not.toMatch(/te oud|niet voor/)
  })

  it('draagt zijn bron, en die is de standaard zelf', () => {
    expect(MEDICATIE.bevestigd).toBe(true)
    expect(MEDICATIE.bron).toMatch(/NHG-Standaard Obesitas/)
    expect(MEDICATIE.bron).toMatch(/2026/)
  })

  /* Wat er vaststaat bevat geen BMI-grens. Die staan in DREMPELS, waar ze
     inhoud zijn en geen criterium, het verschil tussen een boekje en een
     oordeel, en dat verschil hoort niet te vervagen. */
  it('wat vaststaat bevat geen BMI-grens', () => {
    expect(MEDICATIE.vast.length).toBeGreaterThan(0)
    for (const zin of MEDICATIE.vast) {
      expect(zin, zin).not.toMatch(/BMI\s*[≥>]?\s*\d/)
    }
  })
})

/**
 * DE DREMPELS
 *
 * De vondst die het slot rechtvaardigde. De tweede set hoort er te zijn, en hij
 * hoort láger te liggen dan de eerste, anders is de hele reden dat hij er staat
 * weg. Deze proef zou omvallen als iemand de tweede rij ooit weghaalt of
 * gelijktrekt.
 */
describe('de BMI-drempels uit de standaard', () => {
  it('er zijn twee sets, en de tweede ligt lager', () => {
    expect(DREMPELS).toHaveLength(2)
    const [gewoon, lager] = DREMPELS as [Drempelset, Drempelset]
    expect(lager.metComorbiditeit).toBeLessThan(gewoon.metComorbiditeit)
    expect(lager.zonder).toBeLessThan(gewoon.zonder)
  })

  it('en ze staan op de getallen die de standaard noemt', () => {
    expect(DREMPELS[0]).toMatchObject({ metComorbiditeit: 35, zonder: 40 })
    expect(DREMPELS[1]).toMatchObject({ metComorbiditeit: 32.5, zonder: 37.5 })
  })

  it('de tweede set noemt de achtergronden die de standaard noemt', () => {
    for (const woord of ['Aziatische', 'Hindostaanse', 'Midden-Oosterse', 'Afrikaans-Caribische']) {
      expect(DREMPELS[1]!.naam).toContain(woord)
    }
  })

  /* De zes aandoeningen uit de standaard, voluit. Zodra er eentje uit valt,
     leest iemand dat zijn slaapapneu niet meetelt. */
  it('de comorbiditeit staat er voluit', () => {
    expect(COMORBIDITEIT).toHaveLength(6)
    expect(COMORBIDITEIT.join(' ')).toMatch(/slaapapneu/)
    expect(COMORBIDITEIT.join(' ')).toMatch(/artrose van een dragend gewricht/)
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
    /* CooL: acht maanden behandelfase. Drie kalendermaanden geleden begonnen,
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
     30,44 dagen, en twee kalenderjaren zijn 730 dagen, gedeeld door 30,44 is
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
     het jaar vergist heeft, en dan vindt hij niets. */
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
