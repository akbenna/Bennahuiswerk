/**
 * HUISWERK, BEWEZEN
 *
 * Drie dingen die je niet met het oog controleert, en die hier het zwaarst
 * getoetst worden: het zakgeld (er hangt een echt bedrag aan), Leitner (welke
 * som er als volgende komt) en de sjablonen (honderdtwintig sommen met
 * wisselende getallen, elk met een antwoord dat moet kloppen).
 *
 * Alles vergeleken met src/huiswerk/gouden-waarden.json, gedraaid uit de oude
 * pagina zelf.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import gouden from './gouden-waarden.json'
import { PROFIELEN, THEMAS, VAKNAAM } from './gegevens/profielen'
import { SEED } from './gegevens/seed'
import { sjablonen } from './gegevens/sjablonen'
import type { Kaart } from './gegevens/soorten'
import { toevalUit } from './toeval'
import { antwoordKlopt, diagnoseFout, norm } from './nakijken'
import {
  BELONING, berekenBeloning, euro, halfRond, openstaand, totaalUitbetaald,
  totaalVerdiend, weekVerdiend, zomerStand,
} from './beloning'
import {
  BOX_DAGEN, beurtVan, doelNiveau, isBeheerst, kaartStand, puntenVoor, volgendeKaart,
} from './leitner'
import { beheersStatus, leerprofiel, zwakteAnalyse } from './volgsysteem'
import { dagMissie, rangVoor, verzilverMissie, weekPuntenNu } from './missie'
import { leesDag, mmss, weekNummer, weekSleutel } from './datum'
import { leegVoortgang, schoonVoortgang, voegVoortgangSamen } from './opslag'
import type { Voortgang } from './opslag'

const vinger = (x: unknown): string =>
  createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

/* Dezelfde vaste reeks als in de generator: `nepToeval` daar pakt REEKS[tik++]
   en `zetToeval(n)` zet de teller op n. Zonder dezelfde reeks in dezelfde
   volgorde levert elk sjabloon een andere som en zegt de vergelijking niets. */
const REEKS = [0.13, 0.47, 0.81, 0.29, 0.66, 0.05, 0.92, 0.38, 0.74, 0.51]
function bronVanaf(start: number): () => number {
  let tik = start
  return () => REEKS[tik++ % REEKS.length] as number
}

const KLOK = Date.parse('2026-08-22T10:00:00Z')
const VANDAAG = '2026-8-22'

/** Een verse voortgang, zoals `normalizeProg(blankProg())` in de oude app. */
const vers = (): Voortgang => schoonVoortgang(leegVoortgang())

describe('de leerstof', () => {
  it('is regel voor regel dezelfde als in de oude pagina', () => {
    expect(SEED.length).toBe(gouden.stof.opgaven)
    expect(vinger(SEED)).toBe(gouden.stof.vingerSeed)
    expect(SEED[0]?.id).toBe(gouden.stof.eersteId)
    expect(SEED[SEED.length - 1]?.id).toBe(gouden.stof.laatsteId)
    expect(vinger(VAKNAAM)).toBe(gouden.stof.vingerVaknaam)
    for (const [pid, n] of Object.entries(gouden.stof.perKind)) {
      expect(SEED.filter((e) => e.p === pid).length, pid).toBe(n)
    }
  })

  it('houdt de profielen en de thema’s ongeschonden', () => {
    expect(vinger(PROFIELEN)).toBe(gouden.stof.vingerProfielen)
    expect(vinger(THEMAS)).toBe(gouden.stof.vingerThemas)
  })

  it('heeft alle sjablonen, in dezelfde volgorde', () => {
    const lijst = sjablonen(toevalUit(bronVanaf(0)))
    expect(lijst.length).toBe(gouden.stof.sjablonen)
    expect(lijst.map((t) => t.id)).toEqual(gouden.stof.sjabloonIds)
  })

  it('geeft geen twee opgaven hetzelfde id', () => {
    const ids = new Set(SEED.map((e) => e.id))
    expect(ids.size).toBe(SEED.length)
  })
})

describe('de sjablonen met wisselende getallen', () => {
  it('leveren bij hetzelfde toeval dezelfde som als vroeger', () => {
    for (const [i, g] of gouden.sjablonen.entries()) {
      const t = sjablonen(toevalUit(bronVanaf(i * 7)))[i]
      expect(t, g.id).toBeTruthy()
      if (!t) continue
      expect(t.id).toBe(g.id)
      const inst = beurtVan(t)
      expect(inst.q, g.id).toBe(g.q)
      expect(String(inst.a), g.id).toBe(g.a)
      expect(inst.u ?? null, g.id).toEqual(g.u)
      expect(inst.alt ?? null, g.id).toEqual(g.alt)
      expect(inst.h ?? null, g.id).toEqual(g.h)
      expect(inst.s ?? null, g.id).toEqual(g.s)
      expect(inst.ill ?? null, g.id).toEqual(g.ill)
    }
  })

  it('houden het id van het sjabloon, niet van de beurt', () => {
    const lijst = sjablonen(toevalUit(bronVanaf(0)))
    for (const t of lijst) {
      expect(beurtVan(t).id).toBe(t.id)
      expect(beurtVan(t).t).toBe(t.t)
    }
  })

  it('geven een antwoord dat de nakijker zelf goedkeurt', () => {
    /* Dit vangt het sjabloon dat een antwoord met een komma of een euroteken
       oplevert waar zijn eigen nakijker over struikelt. */
    for (const [i, t] of sjablonen(toevalUit(bronVanaf(3))).entries()) {
      const inst = beurtVan(t)
      expect(antwoordKlopt(inst, String(inst.a)), `${t.id} (${i}): ${inst.q}`).toBe(true)
    }
  })
})

describe('het nakijken', () => {
  it('keurt goed en fout zoals vroeger', () => {
    for (const g of gouden.nakijken) {
      expect(norm(g.val), `norm ${g.val}`).toBe(g.norm)
      expect(antwoordKlopt({ a: g.a }, g.val), `${g.a} ← ${g.val}`).toBe(g.goed)
    }
    for (const g of gouden.metAlt) {
      expect(antwoordKlopt(g.ex, g.val), `${g.ex.a} ← ${g.val}`).toBe(g.goed)
    }
  })

  it('rekent een breuk niet goed op zijn kommagetal', () => {
    /* parseFloat('3/4') is 3, dus zonder de uitzondering zou "3" goed zijn. */
    expect(antwoordKlopt({ a: '3/4' }, '3')).toBe(false)
    expect(antwoordKlopt({ a: '3:00' }, '3')).toBe(false)
  })

  it('geeft dezelfde gerichte tip bij een fout', () => {
    for (const g of gouden.diagnoses) {
      expect(diagnoseFout({ a: g.a }, g.val), `${g.a} ← ${g.val}`).toBe(g.tip)
    }
  })
})

describe('het zakgeld', () => {
  it('rekent elke dagstand uit zoals vroeger', () => {
    for (const g of gouden.dagstanden) {
      const pr = vers()
      pr.dag = {
        d: VANDAAG, goed: g.in.goed, fout: g.in.fout,
        sterk: Math.min(g.in.goed, g.in.sterkPunten), sterkPunten: g.in.sterkPunten, sterkIds: [],
      }
      pr.toetsDag = { d: VANDAAG, oefen: g.in.oefen, proef: g.in.proef }
      const b = berekenBeloning(pr, KLOK)
      const naam = JSON.stringify(g.in)
      expect(b.bedrag, naam).toBe(g.uit.bedrag)
      expect(b.vandaagBruto, naam).toBe(g.uit.vandaagBruto)
      expect(Math.round(b.nauw * 1e6) / 1e6, naam).toBe(g.uit.nauw)
      expect(b.genoeg, naam).toBe(g.uit.genoeg)
      expect(b.factor, naam).toBe(g.uit.factor)
      expect(b.poort, naam).toBe(g.uit.poort)
      expect(b.werkEuro, naam).toBe(g.uit.werkEuro)
      expect(b.toetsEuro, naam).toBe(g.uit.toetsEuro)
      expect(b.restWeek, naam).toBe(g.uit.restWeek)
    }
  })

  it('knijpt het bedrag af tegen het weekbudget', () => {
    for (const g of gouden.budgetten) {
      const pr = vers()
      pr.dag = { d: VANDAAG, goed: 40, fout: 2, sterk: 40, sterkPunten: 120, sterkIds: [] }
      pr.betalingen = g.betaald ? [{ d: VANDAAG, bedrag: g.betaald }] : []
      const b = berekenBeloning(pr, KLOK)
      expect(b.bedrag, `betaald ${g.betaald}`).toBe(g.bedrag)
      expect(b.restWeek, `betaald ${g.betaald}`).toBe(g.restWeek)
      expect(b.weekPaid, `betaald ${g.betaald}`).toBe(g.weekPaid)
    }
  })

  it('geeft nooit meer dan het dagplafond', () => {
    const pr = vers()
    pr.dag = { d: VANDAAG, goed: 500, fout: 0, sterk: 500, sterkPunten: 5000, sterkIds: [] }
    pr.toetsDag = { d: VANDAAG, oefen: 100, proef: 100 }
    expect(berekenBeloning(pr, KLOK).vandaagBruto).toBeLessThanOrEqual(BELONING.dagMax)
  })

  it('schrijft bedragen op halve euro’s', () => {
    for (const g of gouden.euros) {
      expect(halfRond(g.n), String(g.n)).toBe(g.half)
      expect(euro(g.n), String(g.n)).toBe(g.tekst)
    }
  })

  it('telt het werk per week gecapt, niet over de hele voorraad', () => {
    const pr = vers()
    pr.verdiend = [
      { d: '2026-8-3', bedrag: 6 }, { d: '2026-8-4', bedrag: 6 }, { d: '2026-8-5', bedrag: 6 },
      { d: '2026-8-6', bedrag: 6 }, { d: '2026-8-10', bedrag: 6 }, { d: '2026-8-11', bedrag: 6 },
      { d: '2026-8-20', bedrag: 4 }, { d: '2026-8-22', bedrag: 5 },
    ]
    pr.bonus = 10
    pr.verdiendBij = 2.5
    pr.betalingen = [{ d: '2026-8-7', bedrag: 15 }]
    expect(totaalVerdiend(pr)).toBe(gouden.totalen.totaalVerdiend)
    expect(totaalUitbetaald(pr)).toBe(gouden.totalen.totaalUitbetaald)
    expect(openstaand(pr)).toBe(gouden.totalen.openstaand)
    expect(weekVerdiend(pr, KLOK)).toBe(gouden.totalen.weekVerdiend)
  })

  it('rekent de zomer-uitdaging uit zoals vroeger', () => {
    for (const g of gouden.zomers) {
      const pr = vers()
      pr.betalingen = g.betalingen
      expect(zomerStand(pr, g.zomer, KLOK), JSON.stringify(g.zomer)).toEqual(g.uit)
    }
  })
})

describe('Leitner', () => {
  it('houdt dezelfde wachttijden aan', () => {
    expect(BOX_DAGEN).toEqual(gouden.dozen)
  })

  it('geeft dezelfde punten per doosje', () => {
    for (const g of gouden.puntenTabel) {
      const pr = vers()
      pr.cards = { x: { box: g.box, ok: 1, wrong: 0, last: 0 } }
      expect(puntenVoor(pr, 'x', g.hint), `doosje ${g.box}`).toBe(g.punten)
      expect(isBeheerst(pr, 'x'), `doosje ${g.box}`).toBe(g.beheerst)
    }
  })

  it('kiest dezelfde volgende kaart, twintig beurten lang', () => {
    for (const g of gouden.reeksen) {
      const pool = SEED.filter((e) => e.p === g.pid && e.v === g.vak && e.t === g.onderwerp)
      expect(pool.length, `${g.pid}/${g.onderwerp}`).toBe(g.aantal)
      const pr = vers()
      const recent: string[] = []
      for (const stap of g.stappen) {
        const t = toevalUit(bronVanaf(stap.i * 3))
        const kaart = volgendeKaart(pool, pr, recent, KLOK, t)
        const naam = `${g.onderwerp} stap ${stap.i}`
        expect(kaart, naam).toBeTruthy()
        if (!kaart) break
        expect(kaart.id, naam).toBe(stap.id)
        const c = { ...kaartStand(pr, kaart.id) }
        if (stap.goed) { c.ok++; c.box = Math.min(5, c.box + 1) } else { c.wrong++; c.box = 1 }
        c.last = KLOK + stap.i * 1000
        pr.cards = { ...pr.cards, [kaart.id]: c }
        expect(c.box, naam).toBe(stap.box)
        recent.push(kaart.id)
        if (recent.length > 5) recent.shift()
      }
    }
  })

  it('bepaalt het doelniveau zoals vroeger', () => {
    for (const g of gouden.niveaus) {
      const pr = schoonVoortgang({
        ...leegVoortgang(), niveau: g.niveau as Voortgang['niveau'], autoLvl: g.autoLvl,
      })
      expect(doelNiveau(pr), `${g.niveau}/${g.autoLvl}`).toBe(g.doel)
    }
  })

  it('loopt niet vast op een voorraad die kleiner is dan wat er net geweest is', () => {
    /* Drie kaarten en vijf recent getoonde id's: zonder het teruggeven van de
       oudste zou er niets overblijven en bleef het scherm leeg. */
    const pool = SEED.slice(0, 3)
    const ids = pool.map((e) => e.id)
    const kaart = volgendeKaart(pool, vers(), [...ids, ...ids], KLOK, toevalUit(bronVanaf(0)))
    expect(kaart).toBeTruthy()
    expect(ids).toContain(kaart?.id)
  })

  it('geeft niets terug bij een lege voorraad', () => {
    expect(volgendeKaart([], vers(), [], KLOK, toevalUit(bronVanaf(0)))).toBeNull()
  })
})

describe('het volgsysteem', () => {
  const alle: Kaart[] = [...SEED, ...sjablonen(toevalUit(bronVanaf(0)))]

  it('bouwt hetzelfde leerprofiel', () => {
    for (const g of gouden.profielen) {
      const pr = vers()
      const eigen = SEED.filter((e) => e.p === g.pid)
      eigen.slice(0, g.n).forEach((e, i) => {
        pr.cards[e.id] = {
          box: g.box, ok: g.box, wrong: i % 4 === 0 ? 2 : 0, last: KLOK - i * 86400000,
        }
      })
      pr.punten = 340
      pr.dagstreak = 4
      const lp = leerprofiel(pr, alle, g.pid, PROFIELEN[g.pid])
      expect(lp, g.pid).toBeTruthy()
      if (!lp) continue
      expect(lp.totaal, g.pid).toBe(g.profiel.totaal)
      expect(lp.beheerst, g.pid).toBe(g.profiel.beheerst)
      expect(lp.geoefend, g.pid).toBe(g.profiel.geoefend)
      expect(lp.mastery, g.pid).toBe(g.profiel.mastery)
      expect(lp.dekking, g.pid).toBe(g.profiel.dekking)
      expect(lp.vakken.map((v) => ({
        v: v.v, naam: v.naam, totaal: v.totaal, beheerst: v.beheerst,
        pct: v.pct, dekking: v.dekking,
        onderwerpen: v.onderwerpen.map((o) => ({
          t: o.t, pct: o.pct, pogingen: o.pogingen, nauw: o.nauw, status: o.status.key,
        })),
      })), g.pid).toEqual(g.profiel.vakken)

      const za = zwakteAnalyse(pr, alle, g.pid)
      expect(za.zwak.map((z) => ({ v: z.v, t: z.t, pct: z.pct, wrong: z.wrong, score: z.score })), g.pid)
        .toEqual(g.zwak)
      expect(za.sterk.map((z) => ({ v: z.v, t: z.t, beg: z.beg })), g.pid).toEqual(g.sterk)
      expect(za.geoefendAantal, g.pid).toBe(g.geoefendAantal)
    }
  })

  it('geeft dezelfde beheersstatus', () => {
    for (const g of gouden.statussen) {
      expect(beheersStatus(g.pct, g.geoefend).key, `${g.pct}/${g.geoefend}`).toBe(g.key)
    }
  })
})

describe('de dagmissie en de rangen', () => {
  it('stelt dezelfde drie taken en verzilvert hetzelfde', () => {
    const nu = new Date(KLOK)
    for (const g of gouden.missies) {
      const pr = vers()
      pr.goal = g.in.goal
      pr.todayCount = g.in.todayCount
      pr.dag = { d: VANDAAG, goed: g.in.goed, fout: g.in.fout, sterk: 0, sterkPunten: 0, sterkIds: [] }
      pr.toetsDag = { d: VANDAAG, oefen: g.in.oefen, proef: g.in.proef }
      const m = dagMissie(pr, nu)
      const naam = JSON.stringify(g.in)
      expect(m.taken.map((t) => ({ k: t.k, ok: t.ok, tekst: t.tekst })), naam).toEqual(g.taken)
      expect(m.klaar, naam).toBe(g.klaar)
      const na = verzilverMissie(pr, nu)
      expect(na !== null, naam).toBe(g.gecrediteerd)
      expect((na?.punten ?? pr.punten) - pr.punten, naam).toBe(g.puntenErbij)
      expect(na?.missieStreak ?? pr.missieStreak, naam).toBe(g.missieStreak)
    }
  })

  it('verzilvert hoogstens één keer per dag', () => {
    const nu = new Date(KLOK)
    let pr = vers()
    pr.goal = 5
    pr.todayCount = 10
    pr.dag = { d: VANDAAG, goed: 10, fout: 0, sterk: 0, sterkPunten: 0, sterkIds: [] }
    pr.toetsDag = { d: VANDAAG, oefen: 80, proef: 0 }
    pr = verzilverMissie(pr, nu) as Voortgang
    expect(pr.punten).toBe(25)
    expect(verzilverMissie(pr, nu)).toBeNull()
  })

  it('geeft dezelfde rang bij hetzelfde puntenaantal', () => {
    for (const g of gouden.rangen) {
      const thema = THEMAS[g.thema]
      expect(thema, g.thema).toBeTruthy()
      if (!thema) continue
      const r = rangVoor(thema, g.punten)
      const naam = `${g.thema} ${g.punten}`
      expect(r.naam, naam).toBe(g.naam)
      expect(r.emoji, naam).toBe(g.emoji)
      expect(r.volgendeNaam, naam).toBe(g.volgendeNaam)
      expect(r.naar, naam).toBe(g.naar)
      expect(r.pct, naam).toBe(g.pct)
    }
  })
})

describe('de dag en de week', () => {
  it('bepaalt dezelfde ISO-week', () => {
    for (const g of gouden.weken) {
      expect(weekSleutel(leesDag(g.d)), g.d).toBe(g.wk)
      expect(weekNummer(g.wk), g.d).toBe(g.num)
    }
  })

  it('vergelijkt weken op nummer en niet op letter', () => {
    /* '2026-w9' valt lexicaal ná '2026-w28'; op nummer klopt het wel. */
    expect('2026-w9' > '2026-w28').toBe(true)
    expect(weekNummer('2026-w9') > weekNummer('2026-w28')).toBe(false)
  })

  it('rekent de toernooistand af tegen de ijkwaarde', () => {
    for (const g of gouden.weekstanden) {
      const pr = schoonVoortgang({ ...leegVoortgang(), ...g.veld } as Partial<Voortgang>)
      expect(weekPuntenNu(pr, KLOK), JSON.stringify(g.veld)).toBe(g.uit)
    }
  })

  it('schrijft de klok zoals vroeger', () => {
    for (const g of gouden.klokjes) expect(mmss(g.s), String(g.s)).toBe(g.tekst)
  })
})

describe('het samenvoegen', () => {
  it('kiest per veld hetzelfde als vroeger', () => {
    for (const g of gouden.samen) {
      /* Net als in de generator: een volledige voortgang met het stuk erin.
         Een kaal `{punten:100}` krijgt van `schoonVoortgang` een ijkwaarde die
         gelijk is aan de punten, en dat is een andere vergelijking dan deze. */
      const heel = (x: object): Voortgang =>
        schoonVoortgang({ ...leegVoortgang(), ...x } as Partial<Voortgang>)
      const uit = voegVoortgangSamen(heel(g.a), heel(g.b))
      const naam = JSON.stringify(g.a)
      for (const sleutel of Object.keys(g.uit)) {
        expect(uit[sleutel as keyof Voortgang], `${naam} · ${sleutel}`)
          .toEqual((g.uit as Record<string, unknown>)[sleutel])
      }
    }
  })

  it('telt niets op — twee toestellen die dezelfde sessie zagen', () => {
    const pr = vers()
    pr.punten = 120
    pr.cards = { a: { box: 3, ok: 3, wrong: 1, last: 500 } }
    const samen = voegVoortgangSamen(pr, pr)
    expect(samen.punten).toBe(120)
    expect(samen.cards.a?.ok).toBe(3)
  })

  it('zet de oude solved om naar Leitner-kaarten, maar alleen als er nog geen zijn', () => {
    for (const g of gouden.migraties) {
      expect(schoonVoortgang(g.in as Partial<Voortgang>).cards, JSON.stringify(g.in)).toEqual(g.uit)
    }
  })
})
