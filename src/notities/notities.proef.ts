/**
 * DE KLEINE REGELS VAN NOTITIES
 *
 * Alles wat hier getoetst wordt is zuiver: geen database, geen microfoon. Het
 * zijn de plekken waar een stille fout het verst komt. Een verkeerd blokpad
 * zet blok 10 vóór blok 2 en de worker plakt een opname in de verkeerde
 * volgorde aan elkaar; een zoekterm met een komma breekt het filter; een
 * datum door UTC heen schuift een deadline een dag op.
 */
import { describe, expect, it } from 'vitest'
import { blokPad } from './opnemer'
import { dag, duur, extensie, leesRoute, veiligZoeken } from './opmaak'

const ID = '0b6c7c1e-5d0a-4f7e-9a51-3c8f2e1d9a77'

describe('de blokken van een opname', () => {
  it('sorteren op naam in dezelfde volgorde als op nummer', () => {
    /* De worker vraagt de bestanden op naam gesorteerd op. Zonder voorloopnullen
       komt chunk-10 vóór chunk-2, en dan is de opname na vijf minuten onzin. */
    const paden = [1, 2, 9, 10, 11, 100, 240].map((n) => blokPad('u', ID, n, 'webm'))
    expect([...paden].sort()).toEqual(paden)
  })

  it('liggen in de map van de eigenaar, want daar kijkt de opslagregel naar', () => {
    expect(blokPad('uid-1', ID, 3, 'mp4')).toBe(`uid-1/${ID}/chunk-00003.mp4`)
  })
})

describe('duur', () => {
  it('in minuten en seconden, en met uren als het moet', () => {
    expect(duur(0)).toBe('0:00')
    expect(duur(65)).toBe('1:05')
    expect(duur(3600 + 2 * 60 + 9)).toBe('1:02:09')
  })

  it('laat weg wat er niet is, in plaats van NaN te tonen', () => {
    expect(duur(null)).toBe('')
    expect(duur(undefined)).toBe('')
    expect(duur(Number.NaN)).toBe('')
  })
})

describe('de route', () => {
  it('herkent een notitie alleen aan een volledige id', () => {
    expect(leesRoute(`#/notitie/${ID}`)).toEqual({ scherm: 'notitie', id: ID })
    expect(leesRoute('#/notitie/abc')).toEqual({ scherm: 'opnemen' })
  })

  it('valt terug op opnemen, want dat is waar de app voor is', () => {
    expect(leesRoute('')).toEqual({ scherm: 'opnemen' })
    expect(leesRoute('#/onzin')).toEqual({ scherm: 'opnemen' })
    expect(leesRoute('#/acties')).toEqual({ scherm: 'acties' })
    expect(leesRoute('#/notities')).toEqual({ scherm: 'notities' })
    expect(leesRoute('#/instellingen')).toEqual({ scherm: 'instellingen' })
  })
})

describe('zoeken', () => {
  it('haalt weg wat in een PostgREST-filter syntaxis of joker is', () => {
    expect(veiligZoeken('pand, huur (2026)')).toBe('pand  huur  2026')
    expect(veiligZoeken('50%')).toBe('50')
    expect(veiligZoeken('a_b')).toBe('a b')
    expect(veiligZoeken('"x"')).toBe('x')
  })

  it('laat gewone woorden heel', () => {
    expect(veiligZoeken('apotheek Roermond')).toBe('apotheek Roermond')
  })
})

describe('bestanden en datums', () => {
  it('neemt de extensie klein over, en kiest .m4a als er geen is', () => {
    expect(extensie('Gesprek VvIT.WAV')).toBe('.wav')
    expect(extensie('Nieuwe opname')).toBe('.m4a')
  })

  it('schuift een deadline niet een dag op door de tijdzone', () => {
    /* `new Date('2026-03-01')` is middernacht UTC; ten westen van Greenwich is
       dat nog 28 februari. Het middaguur ligt ver genoeg van elke rand. In een
       container op UTC ziet deze regel de fout niet; met TZ=America/New_York
       valt hij om zodra het middaguur verdwijnt (zo nagelopen). */
    expect(dag('2026-03-01')).toMatch(/^1 mrt/)
  })
})
