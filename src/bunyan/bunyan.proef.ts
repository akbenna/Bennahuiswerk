/**
 * DE REST VAN COMPUTERS & CODE, BEWEZEN
 *
 * De vertaler heeft zijn eigen toets (minipy.proef.ts). Hier staat wat eromheen
 * zit: de leerstof, de puntentelling, het samenvoegen tussen toestellen en de
 * bouwbank. Alles vergeleken met src/bunyan/gouden-waarden.json, gedraaid uit
 * de oude pagina zelf.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import { CODE } from './gegevens/code'
import { PC } from './gegevens/pc'
import { DELEN, GAMES, SCHERMEN } from './gegevens/bouwbank'
import {
  ALLELESSEN, INSIGNES, RANGEN, XP, afgerond, blokInsignes, leegStand,
  logDag, rangVan, reeksBij, verdien, volgendeRang, weekNr,
} from './voortgang'
import type { Stand } from './opslag'
import { leeg, samenvoegen } from './opslag'
import type { Losse } from './opslag'
import { bouwFouten, bouwPrijs, bouwWatt, deelById, fpsVan } from './bouwbank'
import type { Bouwstand } from './bouwbank'

const KLOK = { vandaag: '2026-08-22', gisteren: '2026-08-21', week: '2026-34' }

describe('de leerstof', () => {
  it('heeft dezelfde blokken en lessen als vroeger', () => {
    const zien = (b: typeof CODE) => b.map((x) => ({
      id: x.id, n: x.n, u: x.u,
      lessen: x.lessen.map((l) => ({
        id: l.id, t: l.t, d: l.d,
        uitleg: l.uitleg.length,
        taal: l.opdracht?.taal ?? 'py',
        vragen: (l.vragen ?? []).map((v) => ({ j: v.j, opties: v.o.length })),
      })),
    }))
    expect(zien(CODE)).toEqual(gouden.stof.code)
    const zienPc = PC.map((x) => ({
      id: x.id, n: x.n, u: x.u,
      lessen: x.lessen.map((l) => ({
        id: l.id, t: l.t, d: l.d,
        uitleg: l.uitleg.length,
        vragen: (l.vragen ?? []).map((v) => ({ j: v.j, opties: v.o.length })),
      })),
    }))
    expect(zienPc).toEqual(gouden.stof.pc)
  })

  it('geeft elke les een eigen id', () => {
    expect(new Set(ALLELESSEN.map((l) => l.id)).size).toBe(ALLELESSEN.length)
  })

  it('houdt het juiste antwoord binnen de opties', () => {
    for (const l of ALLELESSEN) {
      for (const v of l.vragen ?? []) {
        expect(v.j, `${l.id}: ${v.v}`).toBeGreaterThanOrEqual(0)
        expect(v.j, `${l.id}: ${v.v}`).toBeLessThan(v.o.length)
      }
    }
  })

  it('geeft elke opdracht een nakijkfunctie en een foutzin', () => {
    for (const l of ALLELESSEN) {
      if (!l.opdracht) continue
      expect(typeof l.opdracht.check, l.id).toBe('function')
      expect(l.opdracht.fout.length, l.id).toBeGreaterThan(5)
      expect(l.opdracht.hint.length, l.id).toBeGreaterThan(5)
    }
  })

  it('houdt de onderdelen, games en schermen compleet', () => {
    expect(Object.fromEntries(Object.entries(DELEN).map(([k, v]) => [k, v.map((x) => x.id)])))
      .toEqual(gouden.stof.delen)
    expect(GAMES.map((g) => g.id)).toEqual(gouden.stof.games)
    expect(SCHERMEN.map((s) => s.id)).toEqual(gouden.stof.schermen)
  })
})

describe('rangen en punten', () => {
  it('geeft dezelfde rangen als vroeger', () => {
    expect(RANGEN).toEqual(gouden.rangenTabel)
    expect(INSIGNES).toEqual(gouden.insignesTabel)
    expect(XP).toEqual(gouden.xp)
    for (const g of gouden.rangen) {
      expect(rangVan(g.punten), `bij ${g.punten}`).toEqual(g.rang)
      expect(volgendeRang(g.punten), `na ${g.punten}`).toEqual(g.volgende)
    }
  })

  it('loopt dezelfde paden af als vroeger', () => {
    for (const pad of gouden.voortgang) {
      let s: Stand = leegStand()
      for (const stap of pad.stappen) {
        const uit = afgerond(s, stap.id, stap.score, stap.soort as 'les' | 'project', KLOK)
        s = uit.stand
        expect({
          punten: s.punten, saldo: s.saldo, reeks: s.reeks,
          insignes: [...s.insignes].sort(),
          lessen: Object.keys(s.lessen).sort(),
        }, `${pad.naam} · ${stap.id}`).toEqual({
          punten: stap.punten, saldo: stap.saldo, reeks: stap.reeks,
          insignes: stap.insignes, lessen: stap.lessen,
        })
      }
    }
  })

  it('telt een les die je overdoet niet nog een keer', () => {
    let s = leegStand()
    const eerst = afgerond(s, 'c1-1', 100, 'les', KLOK)
    s = eerst.stand
    const weer = afgerond(s, 'c1-1', 100, 'les', KLOK)
    expect(eerst.eerst).toBe(true)
    expect(weer.eerst).toBe(false)
    expect(weer.punten).toBe(0)
    expect(weer.geld).toBe(0)
    expect(weer.stand.punten).toBe(s.punten)
    /* De poging telt wel mee, en de béste score blijft staan. */
    expect(weer.stand.lessen['c1-1']?.pogingen).toBe(2)
  })

  it('houdt de beste score, ook als de tweede poging slechter is', () => {
    let s = leegStand()
    s = afgerond(s, 'c1-1', 100, 'les', KLOK).stand
    s = afgerond(s, 'c1-1', 40, 'les', KLOK).stand
    expect(s.lessen['c1-1']?.score).toBe(100)
  })

  it('stopt met uitbetalen als het weekbudget op is, maar niet met punten', () => {
    let s: Stand = { ...leegStand(), instel: { ...leegStand().instel, weekbudget: 1, tariefLes: 0.4 } }
    const bedragen: number[] = []
    for (const l of ALLELESSEN.slice(0, 5)) {
      const uit = afgerond(s, l.id, 100, 'les', KLOK)
      s = uit.stand
      bedragen.push(uit.geld)
    }
    expect(bedragen.slice(0, 2)).toEqual([0.4, 0.4])
    /* De derde is het restje van het weekpotje, en dat is een kommagetal met
       de gebruikelijke drijvende-kommastaart. */
    expect(bedragen[2]).toBeCloseTo(0.2, 10)
    expect(bedragen.slice(3)).toEqual([0, 0])
    expect(s.week.verdiend).toBe(1)
    expect(s.saldo).toBe(1)
    /* De punten lopen door: het leren stopt niet als het geld stopt. */
    expect(s.punten).toBe(5 * (XP.les + XP.perfect))
  })

  it('rekent het weeknummer zoals vroeger', () => {
    expect(weekNr(new Date('2026-01-01T12:00:00'))).toMatch(/^2026-0\d$/)
    expect(weekNr(new Date('2026-12-31T12:00:00')).startsWith('2026-')).toBe(true)
  })

  it('telt de dagenreeks op en begint na een gat opnieuw', () => {
    const s = { ...leegStand(), laatsteDag: '2026-08-21', reeks: 3 }
    expect(reeksBij(s, '2026-08-22', '2026-08-21').reeks).toBe(4)
    expect(reeksBij({ ...s, laatsteDag: '2026-08-19' }, '2026-08-22', '2026-08-21').reeks).toBe(1)
    expect(reeksBij({ ...s, laatsteDag: '2026-08-22' }, '2026-08-22', '2026-08-21').reeks).toBe(3)
  })

  it('telt binnen één dag op in het logboek', () => {
    let s = leegStand()
    s = logDag(s, '2026-08-22', { lessen: 1, punten: 20 })
    s = logDag(s, '2026-08-22', { lessen: 1, punten: 30 })
    s = logDag(s, '2026-08-23', { lessen: 1, punten: 20 })
    expect(s.log).toEqual([
      { d: '2026-08-22', lessen: 2, punten: 50 },
      { d: '2026-08-23', lessen: 1, punten: 20 },
    ])
  })

  it('betaalt nooit meer uit dan er in het weekpotje zit', () => {
    const s = { ...leegStand(), instel: { ...leegStand().instel, weekbudget: 2 } }
    const een = verdien(s, 1.5, '2026-34')
    expect(een.echt).toBe(1.5)
    const twee = verdien(een.stand, 1.5, '2026-34')
    expect(twee.echt).toBe(0.5)
    expect(twee.stand.saldo).toBe(2)
    /* Een nieuwe week zet het potje terug op nul. */
    const drie = verdien(twee.stand, 1.5, '2026-35')
    expect(drie.echt).toBe(1.5)
  })

  it('geeft een insigne maar één keer', () => {
    let s = leegStand()
    s = afgerond(s, 'c1-1', 100, 'les', KLOK).stand
    const weer = afgerond(s, 'c1-2', 100, 'les', KLOK)
    expect(weer.nieuw.map((i) => i.id)).not.toContain('eerste')
    expect(s.insignes.filter((i) => i === 'eerste')).toHaveLength(1)
  })

  it('geeft het insigne "alles" pas als alle lessen af zijn', () => {
    let s = leegStand()
    for (const l of ALLELESSEN.slice(0, -1)) s = afgerond(s, l.id, 100, 'les', KLOK).stand
    expect(blokInsignes(s)).not.toContain('alles')
    s = afgerond(s, ALLELESSEN.at(-1)!.id, 100, 'les', KLOK).stand
    expect(blokInsignes(s)).toContain('alles')
  })
})

describe('samenvoegen tussen toestellen', () => {
  it('geeft dezelfde uitkomst als vroeger', () => {
    for (const g of gouden.samen) {
      /* Zoals de app het doet: wat er binnenkomt gaat eerst door de lege stand
         heen, en pas dan het samenvoegen in. */
      const vol = (o: Losse): Losse => ({ ...leeg(), ...o })
      const uit = samenvoegen(vol(g.a as Losse), vol(g.b as Losse))
      const oud = g.uit as Record<string, unknown>
      /* Per veld vergelijken: de oude functie liet velden weg die zij nooit
         aanraakte, en dan zegt een vergelijking van het geheel niets. */
      for (const veld of Object.keys(oud)) {
        expect(uit[veld as keyof typeof uit], `${JSON.stringify(g.a)} · ${veld}`)
          .toEqual(oud[veld])
      }
    }
  })

  it('houdt de beste score van beide toestellen', () => {
    const uit = samenvoegen(
      { lessen: { a: { af: true, score: 60, pogingen: 1 } } },
      { lessen: { a: { af: false, score: 100, pogingen: 3 } } })
    expect(uit.lessen['a']).toEqual({ af: true, score: 100, pogingen: 3, d: undefined })
  })

  it('gooit geen les weg die maar op één toestel af is', () => {
    const uit = samenvoegen(
      { lessen: { a: { af: true, score: 100, pogingen: 1 } } },
      { lessen: { b: { af: true, score: 80, pogingen: 1 } } })
    expect(Object.keys(uit.lessen).sort()).toEqual(['a', 'b'])
  })

  it('rekent het saldo uit verdiend min uitbetaald', () => {
    /* Links is 5 verdiend en niets uitbetaald; rechts is 5 verdiend en 3
       uitbetaald. Samen: 5 verdiend, 3 uitbetaald, dus 2 over. */
    const uit = samenvoegen({ saldo: 5, uitbetaald: 0 }, { saldo: 2, uitbetaald: 3 })
    expect(uit.uitbetaald).toBe(3)
    expect(uit.saldo).toBe(2)
  })

  it('laat het saldo nooit onder nul zakken', () => {
    expect(samenvoegen({ saldo: 0, uitbetaald: 0 }, { saldo: 0, uitbetaald: 9 }).saldo).toBe(0)
  })

  it('neemt de instellingen als één geheel, van de nieuwste kant', () => {
    const uit = samenvoegen(
      { instel: { ...leeg().instel, naam: 'oud', weekbudget: 2 }, instelD: '2026-01-01' },
      { instel: { ...leeg().instel, naam: 'nieuw', weekbudget: 9 }, instelD: '2026-06-01' })
    expect(uit.instel.naam).toBe('nieuw')
    expect(uit.instel.weekbudget).toBe(9)
    expect(uit.instelD).toBe('2026-06-01')
  })

  it('houdt eigen projecten van beide kanten', () => {
    const p = (id: string) => ({ id, naam: id, taal: 'py', code: '', d: '2026-01-01' })
    const uit = samenvoegen({ projecten: [p('a')] }, { projecten: [p('a'), p('b')] })
    expect(uit.projecten.map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('verliest niets bij een lege of ontbrekende kant', () => {
    const s: Stand = { ...leeg(), punten: 40, insignes: ['eerste'] }
    expect(samenvoegen(s, null)).toEqual(s)
    expect(samenvoegen(null, s)).toEqual(s)
    expect(samenvoegen(null, null)).toEqual(leeg())
  })
})

describe('de bouwbank', () => {
  it('rekent prijs, verbruik, fouten en fps zoals vroeger', () => {
    for (const g of gouden.bank) {
      const bouw: Bouwstand = { ...(g.bouw as Record<string, string>), budget: 900, scherm: '1080' }
      expect(bouwPrijs(bouw), JSON.stringify(g.bouw)).toBe(g.prijs)
      expect(bouwWatt(bouw), JSON.stringify(g.bouw)).toBe(g.watt)
      expect(bouwFouten(bouw), JSON.stringify(g.bouw)).toEqual(g.fouten)
      for (const game of GAMES) {
        for (const s of SCHERMEN) {
          expect(fpsVan(bouw, game, s.id), `${JSON.stringify(g.bouw)} ${game.id}@${s.id}`)
            .toBe((g.fps as Record<string, number | null>)[`${game.id}@${s.id}`])
        }
      }
    }
  })

  it('telt de voeding niet mee in het verbruik', () => {
    const zonder: Bouwstand = { cpu: 'r5-5600', budget: 900, scherm: '1080' }
    const met: Bouwstand = { ...zonder, psu: 'w1000' }
    expect(bouwWatt(met)).toBe(bouwWatt(zonder))
  })

  it('blijft overeind bij een onderdeel dat niet meer bestaat', () => {
    /* De oude code liep hierop vast en zette daarmee de hele app stil. */
    const bouw: Bouwstand = { cpu: 'bestaat-niet', budget: 900, scherm: '1080' }
    expect(deelById('cpu', 'bestaat-niet')).toBeNull()
    expect(() => bouwPrijs(bouw)).not.toThrow()
    expect(bouwPrijs(bouw)).toBe(0)
    expect(() => bouwFouten(bouw)).not.toThrow()
  })

  it('geeft geen fps zolang de bouw niet ver genoeg is', () => {
    const game = GAMES[0]!
    expect(fpsVan({ budget: 900 } as Bouwstand, game, '1080')).toBeNull()
    expect(fpsVan({ cpu: 'r5-5600' } as Bouwstand, game, '1080')).toBeNull()
  })

  it('laat een zwaarder scherm de fps zakken', () => {
    const bouw: Bouwstand = {
      cpu: 'r7-7800', mobo: 'b650', gpu: 'rtx4060', ram: 'd5-16',
      opslag: 'nvme1', psu: 'w650', kast: 'atx', budget: 2000, scherm: '1080',
    }
    const game = GAMES.find((g) => g.id === 'cyber')!
    const op1080 = fpsVan(bouw, game, '1080')!
    const op4k = fpsVan(bouw, game, '4k')!
    expect(op4k).toBeLessThan(op1080)
  })
})
