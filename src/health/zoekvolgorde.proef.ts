/**
 * DE VOLGORDE VAN DE ZOEKUITSLAG
 *
 * Deze proef gaat over het geval dat hem aan het licht bracht: 'kaas' gaf eerst
 * 'Broodje kaas' en pas ver daaronder de kaas zelf. En over het geval dat hem
 * kapot kan maken: een treffer die via een synoniem binnenkomt en dus niets in
 * zijn naam heeft staan.
 */
import { describe, expect, it } from 'vitest'
import { naamtrede, rangschik, sleutel } from './zoekvolgorde'
import type { Rangschikbaar } from './zoekvolgorde'

const r = (bron: Rangschikbaar['bron'], naam: string, plek = 0): Rangschikbaar =>
  ({ bron, naam, plek })

describe('naamtrede', () => {
  it('kent de vier treden', () => {
    expect(naamtrede('Kaas', 'kaas')).toBe(0)
    expect(naamtrede('Kaas 30+ jong belegen', 'kaas')).toBe(1)
    expect(naamtrede('Broodje kaas', 'kaas')).toBe(2)
    expect(naamtrede('Geitenkaassalade', 'kaas')).toBe(3)
    expect(naamtrede('Salade tonijn- lunch/borrel', 'tonijnsalade')).toBe(4)
  })

  it('trekt zich niets aan van hoofdletters, accenten en leestekens', () => {
    expect(naamtrede('Mercimek çorbası (rode linzensoep)', 'mercimek corbasi')).toBe(1)
    expect(naamtrede('Bulgur pilavı', 'BULGUR PILAVI')).toBe(0)
  })

  it('leest de vraag als één ding en niet als losse woorden', () => {
    /* 'jonge kaas' is een vraag naar jonge kaas. Een naam die alleen 'kaas'
       bevat hoort daar niet ineens bovenaan voor te komen. */
    expect(naamtrede('Kaas 30+ oud', 'jonge kaas')).toBe(4)
    expect(naamtrede('Kaas jong 48+', 'kaas jong')).toBe(1)
  })

  it('geeft een lege vraag geen enkele trede', () => {
    expect(naamtrede('Kaas', '')).toBe(4)
    expect(naamtrede('Kaas', '   ')).toBe(4)
  })
})

describe('rangschik', () => {
  /* HET GEVAL DAT ERTOE DEED
     Voor deze wijziging stonden alle gerechten boven alle tabelregels, omdat
     het scherm de emmers achter elkaar zette. */
  it('zet de kaas boven het broodje kaas', () => {
    const uit = rangschik([
      r('gerecht', 'Broodje kaas', 0),
      r('gerecht', 'Broodje kaassalade', 1),
      r('nevo', 'Kaas 30+ jong belegen', 0),
      r('nevo', 'Kaas 30+ oud', 1),
    ], 'kaas')
    expect(uit.map((x) => x.naam)).toEqual([
      'Kaas 30+ oud',            // trede 1, kortste naam
      'Kaas 30+ jong belegen',   // trede 1
      'Broodje kaas',            // trede 2
      'Broodje kaassalade',      // trede 2, langer
    ])
  })

  /* DE REGEL DIE DEZE PROEF MOET BESCHERMEN
     `kal_nevo_zoek` kent synoniemen: 'tonijnsalade' vindt 'Salade tonijn-
     lunch/borrel', waar dat woord nergens in staat. Zo'n treffer is goed en
     mag niet verdwijnen — hij hoort alleen niet bovenaan. */
  it('gooit een treffer zonder naamovereenkomst niet weg', () => {
    const uit = rangschik([
      r('nevo', 'Salade tonijn- lunch/borrel', 0),
      r('gerecht', 'Broodje tonijnsalade', 0),
    ], 'tonijnsalade')
    expect(uit.map((x) => x.naam)).toEqual([
      'Broodje tonijnsalade',
      'Salade tonijn- lunch/borrel',
    ])
    expect(uit).toHaveLength(2)
  })

  it('houdt de volgorde van de database aan als alles gelijk is', () => {
    /* Daar zit de relevantie van kal_nevo_zoek in, en die gooi ik niet weg. */
    const uit = rangschik([
      r('nevo', 'Aaaa', 2), r('nevo', 'Bbbb', 0), r('nevo', 'Cccc', 1),
    ], 'zzz')
    expect(uit.map((x) => x.plek)).toEqual([0, 1, 2])
  })

  it('laat een merkproduct zakken bij gelijke naam en lengte', () => {
    const uit = rangschik([
      r('merk', 'Kaas plak', 0),
      r('nevo', 'Kaas plak', 0),
      r('gerecht', 'Kaas plak', 0),
    ], 'kaas')
    expect(uit.map((x) => x.bron)).toEqual(['nevo', 'gerecht', 'merk'])
  })

  it('verandert niets aan het aantal regels', () => {
    const in_ = [r('nevo', 'A'), r('gerecht', 'B'), r('merk', 'C')]
    expect(rangschik(in_, 'wat dan ook')).toHaveLength(3)
    expect(rangschik([], 'kaas')).toEqual([])
  })
})

describe('sleutel', () => {
  it('haalt accenten en leestekens weg', () => {
    expect(sleutel('Mercimek çorbası (rode linzensoep)')).toBe('mercimek corbasi rode linzensoep')
    expect(sleutel('Kaas 30+ jong belegen')).toBe('kaas 30 jong belegen')
  })
})
