/**
 * DE REST VAN ISLAM LEREN, BEWEZEN
 *
 * De gebedstijden hebben hun eigen toets. Hier staat wat eromheen zit: de
 * leerstof, de niveaus, de oefenkaarten, de dagmissie, de insignes, het
 * weekbudget en het samenvoegen tussen toestellen — alles vergeleken met
 * src/noer/gouden-waarden.json, gedraaid uit de oude pagina zelf.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import gouden from './gouden-waarden.json'
import { MODULES } from './gegevens/modules'
import { HIFZ, DUAS } from './gegevens/hifz'
import { WUDU } from './gegevens/wudu'
import { STAPPEN } from './gegevens/gebed'
import { BIJZONDER, FOUTEN } from './gegevens/bijzonder'
import { INSIGNES, NIVEAUS } from './gegevens/beloning'
import { XP } from './voortgang'
import {
  TUSSEN, alleKaarten, checkInsignes, checkMissie, kaartAntwoord, kaartenNu,
  leeftijd, missie, niveauVan, raakDag, spoorVan, verdien, verdiendDezeWeek,
  markeerOefening, verdiendeInsignes,
} from './voortgang'
import { TARIEF, leeg, leegProg, samenvoegen } from './opslag'
import type { Losse, Profiel, Stand, Voortgang } from './opslag'
import type { Spoor } from './gegevens/soorten'

const vinger = (x: unknown): string =>
  createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

const NU = gouden.nu
const KLOK = Date.parse(NU + 'T10:00:00Z')
const DAG = Math.floor(KLOK / 864e5)
const GISTEREN = '2026-08-21'

/* Het profiel dat de opwekker gebruikte: geboren in 2014, dus twaalf in 2026,
   en daarmee spoor 2. */
const PROFIEL: Profiel = { id: 'p1', naam: 'Test', geb: 2014, kleur: '#0F6F6C' }
const SPOOR: Spoor = spoorVan(PROFIEL, 2026)

describe('de leerstof is ongeschonden overgekomen', () => {
  it('vijftien modules met dezelfde lessen', () => {
    expect(MODULES.map((m) => m.id)).toEqual(gouden.stof.modules.map((m) => m.id))
    MODULES.forEach((m, i) => {
      const g = gouden.stof.modules[i]!
      expect({ t: m.t }).toEqual({ t: g.t })
      expect(vinger(m), m.id).toBe(g.vinger)
      expect(m.lessen.map((l) => l.id)).toEqual(g.lessen.map((l) => l.id))
      m.lessen.forEach((l, k) => {
        const gl = g.lessen[k]!
        expect({
          t: l.t, sp: l.sp ?? 1,
          vragen: (l.q ?? []).map((q) => ({ a: q.a, opties: q.o.length })),
          kaartjes: (l.kt ?? []).length,
        }).toEqual({ t: gl.t, sp: gl.sp, vragen: gl.vragen, kaartjes: gl.kaartjes })
        expect(vinger(l), l.id).toBe(gl.vinger)
      })
    })
  })

  it('houdt het juiste antwoord binnen de opties', () => {
    for (const m of MODULES) {
      for (const l of m.lessen) {
        for (const q of l.q ?? []) {
          expect(q.a, `${l.id}: ${q.v}`).toBeGreaterThanOrEqual(0)
          expect(q.a, `${l.id}: ${q.v}`).toBeLessThan(q.o.length)
        }
      }
    }
  })

  it('houdt de teksten om uit je hoofd te leren compleet', () => {
    HIFZ.forEach((h, i) => {
      const g = gouden.stof.hifz[i]!
      expect({ naam: h.naam, regels: h.r.length }).toEqual({ naam: g.naam, regels: g.regels })
      expect(vinger(h), h.id).toBe(g.vinger)
    })
    expect(HIFZ).toHaveLength(gouden.stof.hifz.length)
    DUAS.forEach((d, i) => expect(vinger(d), d.w).toBe(gouden.stof.duas[i]!.vinger))
    expect(DUAS).toHaveLength(gouden.stof.duas.length)
  })

  it('houdt de wassing, het gebed en de rest compleet', () => {
    WUDU.forEach((w, i) => expect(vinger(w), w.id).toBe(gouden.stof.wudu[i]!.vinger))
    STAPPEN.forEach((s, i) => expect(vinger(s), s.k).toBe(gouden.stof.stappen[i]!.vinger))
    BIJZONDER.forEach((b, i) => expect(vinger(b), b.id).toBe(gouden.stof.bijzonder[i]!.vinger))
    FOUTEN.forEach((f, i) => expect(vinger(f), f.v).toBe(gouden.stof.fouten[i]!.vinger))
    expect(WUDU).toHaveLength(gouden.stof.wudu.length)
    expect(STAPPEN).toHaveLength(gouden.stof.stappen.length)
  })

  it('houdt de niveaus, tarieven en insignes gelijk', () => {
    expect(NIVEAUS).toEqual(gouden.stof.niveaus)
    expect(INSIGNES).toEqual(gouden.stof.insignes)
    expect(TARIEF).toEqual(gouden.stof.tarief)
    expect(XP).toEqual(gouden.stof.xp)
  })
})

describe('sporen en niveaus', () => {
  it('kent dezelfde leeftijden en sporen als vroeger', () => {
    for (const g of gouden.sporen) {
      const p: Profiel = { id: 'x', naam: 'x', geb: g.geb, kleur: '' }
      expect(leeftijd(p, 2026), String(g.geb)).toBe(g.leeftijd)
      expect(spoorVan(p, 2026), String(g.geb)).toBe(g.spoor)
    }
  })

  it('rekent de niveaus zoals vroeger', () => {
    for (const g of gouden.niveaus) {
      expect(niveauVan(g.punten), String(g.punten)).toEqual(g.n)
    }
  })

  it('begrenst de leeftijd tussen vier en twintig', () => {
    expect(leeftijd({ id: '', naam: '', geb: 2025, kleur: '' }, 2026)).toBe(4)
    expect(leeftijd({ id: '', naam: '', geb: 1980, kleur: '' }, 2026)).toBe(20)
  })

  it('laat een jonger spoor minder lessen zien dan een ouder', () => {
    const een = MODULES.flatMap((m) => m.lessen.filter((l) => (l.sp || 1) <= 1)).length
    const drie = MODULES.flatMap((m) => m.lessen.filter((l) => (l.sp || 1) <= 3)).length
    expect(een).toBeLessThan(drie)
  })
})

describe('de oefenkaarten', () => {
  it('maakt dezelfde kaarten als vroeger', () => {
    expect(alleKaarten(SPOOR).map((k) => k.id)).toEqual(gouden.kaartIds)
  })

  it('geeft elke kaart een eigen id', () => {
    const ids = alleKaarten(SPOOR).map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('telt bij een verse stand alles als nieuw', () => {
    const n = kaartenNu(leegProg(), SPOOR, DAG)
    expect({ nieuw: n.nieuw.length, herhaal: n.herhaal.length, totaal: gouden.kaartIds.length })
      .toEqual(gouden.kaartTelling)
  })

  it('loopt dezelfde reeksen beoordelingen af als vroeger', () => {
    for (const reeks of gouden.kaartRondes) {
      let pr: Voortgang = leegProg()
      const id = gouden.kaartIds[0] as string
      reeks.uit.forEach((stap, i) => {
        pr = kaartAntwoord(pr, id, stap.goed, DAG, NU, GISTEREN)
        const st = pr.kaarten[id]!
        expect({ stap: st.stap, over: st.due - DAG }, `${reeks.pad.join('')} stap ${i + 1}`)
          .toEqual({ stap: stap.stap, over: stap.over })
      })
      expect(pr.punten).toBe(reeks.punten)
      expect(pr.reeks).toBe(reeks.reeks)
    }
  })

  it('zet een fout antwoord helemaal terug', () => {
    let pr: Voortgang = leegProg()
    const id = 'x'
    for (let n = 0; n < 5; n++) pr = kaartAntwoord(pr, id, true, DAG, NU, GISTEREN)
    expect(pr.kaarten[id]!.stap).toBe(5)
    pr = kaartAntwoord(pr, id, false, DAG, NU, GISTEREN)
    expect(pr.kaarten[id]!.stap).toBe(0)
    expect(pr.kaarten[id]!.due).toBe(DAG + (TUSSEN[0] as number))
  })

  it('loopt niet voorbij de langste tussenpoos', () => {
    let pr: Voortgang = leegProg()
    for (let n = 0; n < 20; n++) pr = kaartAntwoord(pr, 'x', true, DAG, NU, GISTEREN)
    expect(pr.kaarten['x']!.stap).toBe(TUSSEN.length - 1)
    expect(pr.kaarten['x']!.due).toBe(DAG + (TUSSEN.at(-1) as number))
  })

  it('geeft alleen punten voor een goed antwoord', () => {
    const goed = kaartAntwoord(leegProg(), 'x', true, DAG, NU, GISTEREN)
    const fout = kaartAntwoord(leegProg(), 'x', false, DAG, NU, GISTEREN)
    expect(goed.punten).toBe(XP.kaart)
    expect(fout.punten).toBe(0)
  })
})

describe('de dagreeks', () => {
  it('telt op bij aaneengesloten dagen en begint na een gat opnieuw', () => {
    const basis: Voortgang = { ...leegProg(), laatsteDag: GISTEREN, reeks: 4 }
    expect(raakDag(basis, NU, GISTEREN).reeks).toBe(5)
    expect(raakDag({ ...basis, laatsteDag: '2026-08-01' }, NU, GISTEREN).reeks).toBe(1)
    expect(raakDag({ ...basis, laatsteDag: NU }, NU, GISTEREN).reeks).toBe(4)
  })
})

describe('het weekbudget', () => {
  it('betaalt niet meer uit dan er in het budget zit', () => {
    let pr: Voortgang = leegProg()
    const gekregen: number[] = []
    for (const g of gouden.budget) {
      const uit = verdien(pr, 'proef', g.gevraagd, 2, NU, KLOK)
      pr = uit.stand
      gekregen.push(uit.echt)
      expect(uit.echt, `bij ${g.gevraagd}`).toBeCloseTo(g.gekregen, 10)
      expect(pr.saldo, `bij ${g.gevraagd}`).toBeCloseTo(g.saldo, 10)
    }
    expect(gekregen.at(-1)).toBe(0)
  })

  it('telt alleen wat binnen zeven dagen verdiend is', () => {
    const pr: Voortgang = {
      ...leegProg(),
      verdiensten: [
        { d: '2026-08-01', bron: 'oud', b: 5 },
        { d: '2026-08-20', bron: 'nieuw', b: 2 },
      ],
    }
    expect(verdiendDezeWeek(pr, KLOK)).toBe(2)
  })
})

describe('de dagmissie', () => {
  const metLes: Voortgang = { ...leegProg(), lessen: { l1: { klaar: true, score: 100, d: NU } } }

  it('is pas klaar als alle drie de taken staan', () => {
    expect(missie(leegProg(), NU).klaar).toBe(false)
    expect(missie(metLes, NU).klaar).toBe(false)
    const met = markeerOefening(metLes, NU, GISTEREN)
    expect(missie(met, NU).klaar).toBe(false)
    const alles: Voortgang = { ...met, gebed: { [NU]: { fajr: true } } }
    expect(missie(alles, NU).klaar).toBe(true)
  })

  it('telt vijf kaarten net zo zwaar als een les', () => {
    const pr: Voortgang = { ...leegProg(), kaartenDag: { d: NU, n: 5 } }
    expect(missie(pr, NU).taken.find((t) => t.k === 'leren')?.ok).toBe(true)
    expect(missie({ ...pr, kaartenDag: { d: NU, n: 4 } }, NU).taken
      .find((t) => t.k === 'leren')?.ok).toBe(false)
  })

  it('geeft punten en geld, maar maar één keer per dag', () => {
    const klaar: Voortgang = {
      ...markeerOefening(metLes, NU, GISTEREN), gebed: { [NU]: { fajr: true } },
    }
    const een = checkMissie(klaar, 10, NU, GISTEREN, KLOK)
    expect(een.gehaald).toBe(true)
    expect(een.stand.punten).toBe(XP.missie)
    expect(een.stand.saldo).toBe(TARIEF.missie)
    const twee = checkMissie(een.stand, 10, NU, GISTEREN, KLOK)
    expect(twee.gehaald).toBe(false)
    expect(twee.stand.punten).toBe(XP.missie)
  })

  it('betaalt de zevendedagbonus alleen op een veelvoud van zeven', () => {
    const basis: Voortgang = {
      ...markeerOefening(metLes, NU, GISTEREN), gebed: { [NU]: { fajr: true } },
    }
    const zeven = checkMissie({ ...basis, reeks: 7 }, 10, NU, GISTEREN, KLOK)
    const acht = checkMissie({ ...basis, reeks: 8 }, 10, NU, GISTEREN, KLOK)
    expect(zeven.stand.saldo).toBe(TARIEF.missie + TARIEF.reeks7)
    expect(acht.stand.saldo).toBe(TARIEF.missie)
  })
})

describe('de insignes', () => {
  it('geeft er geen bij een lege stand', () => {
    expect(verdiendeInsignes(leegProg(), SPOOR)).toEqual([])
  })

  it('geeft het wudu-insigne bij een gehaald examen', () => {
    const pr: Voortgang = { ...leegProg(), examens: { wudu: { gehaald: true } } }
    expect(verdiendeInsignes(pr, SPOOR)).toContain('i-wudu')
  })

  it('geeft er drie bij drie afgeronde teksten', () => {
    const pr: Voortgang = {
      ...leegProg(),
      hifz: {
        'h-fatiha': { niveau: 3, gehaald: true },
        b: { niveau: 3, gehaald: true },
        c: { niveau: 3, gehaald: true },
      },
    }
    const uit = verdiendeInsignes(pr, SPOOR)
    expect(uit).toContain('i-fatiha')
    expect(uit).toContain('i-drie')
    expect(uit).not.toContain('i-tien')
  })

  it('vindt zeven volle gebedsdagen op rij, en zes niet', () => {
    const vol = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }
    const dagen = (n: number, start = 1): Record<string, Record<string, boolean>> =>
      Object.fromEntries(Array.from({ length: n }, (_, i) =>
        [`2026-08-${String(start + i).padStart(2, '0')}`, vol]))
    expect(verdiendeInsignes({ ...leegProg(), gebed: dagen(6) }, SPOOR)).not.toContain('i-vijf7')
    expect(verdiendeInsignes({ ...leegProg(), gebed: dagen(7) }, SPOOR)).toContain('i-vijf7')
    /* Een gat erin telt niet mee. */
    const metGat = { ...dagen(4), ...dagen(4, 10) }
    expect(verdiendeInsignes({ ...leegProg(), gebed: metGat }, SPOOR)).not.toContain('i-vijf7')
  })

  it('geeft elk insigne maar één keer', () => {
    const pr: Voortgang = { ...leegProg(), reeks: 30 }
    const een = checkInsignes(pr, SPOOR)
    expect(een.nieuw).toContain('i-reeks7')
    expect(een.nieuw).toContain('i-reeks30')
    const twee = checkInsignes(een.stand, SPOOR)
    expect(twee.nieuw).toEqual([])
  })
})

describe('samenvoegen tussen toestellen', () => {
  it('geeft dezelfde uitkomst als vroeger', () => {
    for (const g of gouden.samen) {
      const vol = (o: Losse): Stand => ({ ...leeg(), ...o })
      const uit = samenvoegen(vol(g.a as Losse), vol(g.b as Losse))
      expect(uit, JSON.stringify(g.a).slice(0, 60)).toEqual(g.uit)
    }
  })

  it('houdt de profielen van beide toestellen', () => {
    const a: Losse = { profielen: [{ id: 'a', naam: 'A', geb: 2014, kleur: '' }] }
    const b: Losse = { profielen: [{ id: 'b', naam: 'B', geb: 2016, kleur: '' }] }
    expect(samenvoegen({ ...leeg(), ...a }, { ...leeg(), ...b }).profielen.map((p) => p.id))
      .toEqual(['a', 'b'])
  })

  it('houdt de verste kaart en de beste score', () => {
    const maak = (v: Partial<Voortgang>): Stand => ({ ...leeg(), data: { p: { ...leegProg(), ...v } } })
    const uit = samenvoegen(
      maak({ kaarten: { k: { stap: 5, due: 100 } }, lessen: { l: { klaar: true, score: 40 } } }),
      maak({ kaarten: { k: { stap: 2, due: 500 } }, lessen: { l: { klaar: false, score: 90 } } }))
    expect(uit.data['p']!.kaarten['k']).toEqual({ stap: 5, due: 100 })
    expect(uit.data['p']!.lessen['l']).toEqual({ klaar: true, score: 90, d: undefined })
  })

  it('gooit een afgevinkt gebed nooit weg', () => {
    const maak = (g: Voortgang['gebed']): Stand => ({ ...leeg(), data: { p: { ...leegProg(), gebed: g } } })
    const uit = samenvoegen(
      maak({ '2026-08-22': { fajr: true } }),
      maak({ '2026-08-22': { dhuhr: true }, '2026-08-21': { isha: true } }))
    expect(uit.data['p']!.gebed['2026-08-22']).toEqual({ fajr: true, dhuhr: true })
    expect(uit.data['p']!.gebed['2026-08-21']).toEqual({ isha: true })
  })

  it('verliest niets bij een ontbrekende kant', () => {
    const s: Stand = { ...leeg(), profielen: [PROFIEL], actief: 'p1' }
    expect(samenvoegen(s, null).profielen).toEqual([PROFIEL])
    expect(samenvoegen(null, s).profielen).toEqual([PROFIEL])
  })
})
