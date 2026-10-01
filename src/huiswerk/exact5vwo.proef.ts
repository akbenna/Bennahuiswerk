/**
 * SCHEIKUNDE EN NATUURKUNDE 5 VWO NAGEKEKEN
 *
 * De antwoorden in `gegevens/exact5vwo.ts` komen uit de formules zelf, dus een
 * tikfout in een getal kan daar niet. Een fout in een formule wel: een sinus
 * waar een cosinus hoort, een kwadraat dat ontbreekt. Daarom staan hieronder
 * waarden die los, met de hand, zijn uitgerekend, en moet het antwoord in de
 * app daarmee kloppen. Wie een formule in het bestand stukmaakt, ziet deze
 * proef omvallen.
 *
 * Daarnaast de belofte van de moeilijkheidsknop (zes per onderwerp per niveau),
 * en dat de nakijker niet zo ruim is dat een antwoord van tien procent ernaast
 * goed wordt gerekend.
 */
import { describe, expect, it } from 'vitest'
import { EXACT_5VWO } from './gegevens/exact5vwo'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { ONDERWERPICOON } from './gegevens/profielen'
import { antwoordKlopt, norm } from './nakijken'

const getal = (a: string): number => parseFloat(norm(a))
const vind = (stuk: string) => {
  const e = EXACT_5VWO.filter((x) => x.q.includes(stuk))
  if (e.length !== 1) throw new Error(`${e.length} opgaven met "${stuk}"`)
  return e[0] as (typeof EXACT_5VWO)[number]
}
/** Het antwoord in de app tegen een los uitgerekende waarde, op 0,2 % na. */
const klopt = (stuk: string, verwacht: number): void => {
  const a = getal(vind(stuk).a)
  expect(Math.abs(a - verwacht) / verwacht, stuk).toBeLessThan(0.002)
}

describe('de getallen, los nagerekend', () => {
  it('scheikunde', () => {
    klopt('pH van 0,020 M zoutzuur', 1.699)
    klopt('pH van 0,0050 M zoutzuur', 2.301)
    klopt('pH van 0,10 M azijnzuur', 2.872)
    klopt('pH van 0,010 M azijnzuur', 3.372)
    klopt('pH 2,50. Bereken [H₃O⁺]', 3.162)
    klopt('20,0 mL zoutzuur', 75.0)
    klopt('13,1 g zink', 12.73)
    klopt('6,35 g koper', 21.56)
    klopt('[HI] = 0,70', 49)
    klopt('[NH₃] = 0,20', 3.2)
    klopt('[FeSCN²⁺] = 0,040', 200)
  })

  it('natuurkunde: krachten', () => {
    klopt('100 N werkt onder 30° met de horizontaal. Bereken de horizontale', 86.60)
    klopt('100 N werkt onder 30° met de horizontaal. Bereken de verticale', 50.0)
    klopt('50 N werkt onder 60° met de horizontaal. Bereken Fy', 43.30)
    klopt('Fx = 12 N en Fy = 5,0 N', 22.62)
    klopt('slee van 20 kg', 184.4)
    klopt('Bereken de versnelling', 4.915)
    klopt('normaalkracht van de vloer', 318.4)
    klopt('lamp van 2,0 kg', 19.62)
    klopt('horizontale component van 60 N', 41.41)
  })

  it('natuurkunde: cirkelbeweging en gravitatie', () => {
    klopt('persoon van 70 kg', 687.1)
    klopt('r = 7,0·10⁶ m van het middelpunt', 7.544)
    klopt('Bereken de omlooptijd in minuten', 97.17)
    klopt('baansnelheid van de maan', 1022.9)
    klopt('de massa van de aarde', 6.020)
    klopt('geostationaire', 42.23)
    klopt('looping', 9.905)
  })

  it('natuurkunde: trillingen en golven', () => {
    klopt('slinger met een lengte van 1,00 m', 2.006)
    klopt('veer met C = 20 N/m', 0.9935)
    klopt('trilt in de grondtoon', 200)
    klopt('aan één kant dicht', 100)
    klopt('aan beide kanten open', 200)
    klopt('trillingstijd van 1,50 s', 55.91)
    klopt('A = 4,0 cm', 2.828)
  })
})

describe('de opgaven zelf', () => {
  it('rekent elk antwoord goed, en elk rekenantwoord van 10 % ernaast fout', () => {
    for (const e of EXACT_5VWO) {
      expect(antwoordKlopt(e, e.a), e.q).toBe(true)
      const n = getal(e.a)
      if (!e.opties && !Number.isNaN(n) && n >= 1) {
        expect(antwoordKlopt(e, String(n * 1.1)), e.q).toBe(false)
      }
    }
  })

  it('zet het antwoord van een meerkeuzevraag tussen de opties', () => {
    for (const e of EXACT_5VWO.filter((x) => x.opties)) expect(e.opties, e.q).toContain(e.a)
  })

  it('geeft elk onderwerp zes opgaven per niveau', () => {
    const per = new Map<string, number[]>()
    for (const e of EXACT_5VWO) {
      const n = per.get(e.t) ?? [0, 0, 0, 0]
      n[e.lvl ?? 0] = (n[e.lvl ?? 0] ?? 0) + 1
      per.set(e.t, n)
    }
    expect([...per.keys()].sort()).toEqual([
      'Cirkelbeweging & gravitatie', 'Evenwicht', 'Golven & trillingen',
      'Krachten ontbinden', 'Redox', 'Zuur & base',
    ])
    for (const [t, n] of per) for (const lvl of [1, 2, 3]) expect(n[lvl], `${t} niveau ${lvl}`).toBe(6)
  })

  it('heeft een hint en een uitwerking bij elke opgave', () => {
    for (const e of EXACT_5VWO) {
      expect(e.h?.length, e.q).toBeGreaterThan(0)
      expect((e.s ?? '').length, e.q).toBeGreaterThan(5)
    }
  })

  it('geeft elke nieuwe tegel een eigen teken', () => {
    for (const t of new Set(EXACT_5VWO.map((e) => e.t))) expect(ONDERWERPICOON[t], t).toBeTruthy()
  })

  it('herhaalt geen vraag die er al was', () => {
    const elders = new Set([...SEED, ...NIEUW2627.filter((e) => !EXACT_5VWO.some((x) => x.q === e.q))].map((e) => e.q.trim()))
    for (const e of EXACT_5VWO) expect(elders.has(e.q.trim()), e.q).toBe(false)
  })

  it('staat achter het Frans, zodat de id’s van eerder niet verschuiven', () => {
    expect(NIEUW2627.find((e) => e.id === 'nw26_783')?.q).toBe(EXACT_5VWO[0]?.q)
  })
})
