/**
 * DE VOORTGANG OP DE STARTPAGINA
 *
 * Wat hier getoetst wordt is niet het rekenen — er wordt niets gerekend — maar
 * de vier vragen die stil fout kunnen gaan: lees ik de goede sleutel, pak ik de
 * regel van de goede persoon, laat ik iemand anders zijn cijfers niet per
 * ongeluk zien, en houd ik mijn mond als er nog niets gedaan is.
 *
 * De opslag komt uit acht apps die hun vorm mogen wijzigen zonder het hier te
 * melden. Daarom staat er bij elk geval een stukje echte opslag en niet een
 * verzonnen tussenvorm: verandert een app zijn veldnaam, dan hoort deze proef
 * om te vallen en niet de startpagina.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { voortgangAlles, voortgangVan } from './voortgang'
import { APPS } from './apps'
import type { Ik } from './sessie'

const wie = (naam: string, rol: 'kind' | 'ouder'): Ik =>
  ({ gezin: 'benna', naam, rol, emoji: '🌸', kleur: 'code', apps: [], tijd: Date.now() })

const SELMA = wie('selma', 'kind')
const PAPA = wie('abdelkader', 'ouder')

const zet = (sleutel: string, waarde: unknown): void =>
  localStorage.setItem(sleutel, JSON.stringify(waarde))

/** Een label opzoeken in wat er getoond wordt. */
const cel = (cellen: readonly (readonly [string, string | number])[], label: string) =>
  cellen.find(([l]) => l === label)?.[1]

beforeEach(() => { localStorage.clear() })

describe('welke regel je te zien krijgt', () => {
  it('pakt bij een app met profielen de regel op jouw naam', () => {
    zet('bidaya.v1', {
      profielen: [{ id: 'a', naam: 'Selma' }, { id: 'b', naam: 'Amine' }],
      data: {
        a: { punten: 320, lessen: { l1: 1, l2: 1 }, laatsteDag: '2026-08-24' },
        b: { punten: 999, lessen: { l1: 1 }, laatsteDag: '2026-08-25' },
      },
    })
    const v = voortgangVan('bidaya', SELMA)
    expect(cel(v!.cellen, 'Punten')).toBe(320)
    expect(v!.laatst).toBe('2026-08-24')
    expect(v!.wie).toBeNull()
  })

  it('houdt de cijfers van een ander kind weg bij een app met één gebruiker', () => {
    zet('bunyan.v1', { instel: { naam: 'Amine' }, punten: 480, klaar: { l1: 1 } })
    expect(voortgangVan('bunyan', SELMA)).toBeNull()
  })

  it('laat een ouder wél zien wie er het laatst bezig was, mét naam erbij', () => {
    zet('oefenapp_v1', {
      prog: {
        selma: { punten: 1240, dagstreak: 6, lastDay: '2026-08-20' },
        amine: { punten: 860, dagstreak: 2, lastDay: '2026-08-25' },
      },
    })
    const v = voortgangVan('huiswerk', PAPA)
    expect(v!.wie).toBe('amine')
    expect(cel(v!.cellen, 'Punten')).toBe(860)
  })

  it('noemt geen naam bij wat van het hele gezin is', () => {
    zet('raha.v1', { records: { a: 1, b: 2 }, gespeeld: { a: 12 }, laatste: '2026-08-25' })
    for (const ik of [SELMA, PAPA]) {
      const v = voortgangVan('raha', ik)
      expect(v!.wie).toBeNull()
      expect(cel(v!.cellen, 'Records')).toBe(2)
    }
  })
})

describe('wanneer er niets te melden valt', () => {
  it('zwijgt als de app nog nooit gebruikt is', () => {
    expect(voortgangVan('rasikh', PAPA)).toBeNull()
  })

  it('zwijgt bij een verse installatie waar alles nog op nul staat', () => {
    zet('oefenapp_v1', { prog: { selma: { punten: 0, dagstreak: 0, cards: {}, badges: [] } } })
    expect(voortgangVan('huiswerk', SELMA)).toBeNull()
  })

  it('zwijgt bij stukke opslag in plaats van om te vallen', () => {
    localStorage.setItem('sanad.v2', '{dit is geen json')
    expect(voortgangVan('sanad', PAPA)).toBeNull()
  })

  it('zwijgt bij een app die zijn vorm heeft gewijzigd', () => {
    zet('lisan.v1', { profielen: 'was eerst een object' })
    expect(voortgangVan('lisan', SELMA)).toBeNull()
  })

  it('zwijgt over BennaHealth, want die laat hier niets achter', () => {
    zet('kalibratie.sessie', { token: 'x', account: 'abdelkader' })
    expect(voortgangVan('health', PAPA)).toBeNull()
  })
})

describe('de Academie telt drie cursussen bij elkaar', () => {
  it('telt de afgeronde lessen en de oefendagen over Kompas, Verbind en Podium', () => {
    zet('kompas_v1', { done: { 0: true, 1: true, 2: false }, oefdagen: ['2026-08-20', '2026-08-21'] })
    zet('verbind_v2', { done: { 0: true }, oefdagen: ['2026-08-21', '2026-08-24'] })
    zet('podium_v1', { done: {}, oefdagen: [] })
    const v = voortgangVan('academie', PAPA)
    expect(cel(v!.cellen, 'Lessen af')).toBe(3)
    /* Drie unieke dagen en niet vier: op 21 augustus is er aan twee cursussen
       gewerkt, en dat is één oefendag. */
    expect(cel(v!.cellen, 'Oefendagen')).toBe(3)
    expect(v!.laatst).toBe('2026-08-24')
  })

  it('zwijgt als er nog aan geen van de drie iets gedaan is', () => {
    zet('kompas_v1', { done: {}, oefdagen: [] })
    expect(voortgangVan('academie', PAPA)).toBeNull()
  })
})

describe('alles in één keer', () => {
  it('geeft alleen de apps terug waar iets van te zeggen valt', () => {
    zet('raha.v1', { records: { a: 1 }, laatste: '2026-08-25' })
    zet('rasikh.v1', { kaarten: { a: { due: '2026-01-01' } }, laatsteDag: '2026-08-25' })
    const uit = voortgangAlles(APPS, PAPA)
    expect([...uit.keys()].sort()).toEqual(['raha', 'rasikh'])
  })

  it('geeft niets terug als er niemand is aangemeld', () => {
    zet('raha.v1', { records: { a: 1 } })
    expect(voortgangAlles(APPS, null).size).toBe(0)
  })
})
