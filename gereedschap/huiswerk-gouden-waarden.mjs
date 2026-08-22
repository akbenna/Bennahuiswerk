#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT HET OUDE HUISWERK
 *
 * Drie dingen die je niet met het oog controleert.
 *
 * Het eerste is het zakgeld. Er hangt een echt bedrag aan: een
 * nauwkeurigheidspoort, een weging naar moeilijkheid, een toetsbonus die
 * meeschaalt, een dagplafond en een hard weekbudget, allemaal over elkaar
 * heen. Eén verkeerde grens en een kind krijgt structureel te veel of te
 * weinig, en dat merkt niemand aan het scherm. Dus: de oude functie zelf, over
 * tientallen dagstanden, tot op de halve cent.
 *
 * Het tweede is Leitner. Welke som er als volgende komt hangt af van doosje,
 * doelniveau, wachttijd en wat er net geweest is — vier sorteersleutels achter
 * elkaar. Hier draaien hele reeksen doorheen, met de klok en het toeval vast.
 *
 * Het derde zijn de sjablonen. Honderdtwintig sommen met wisselende getallen,
 * elk met een antwoord, hints en een uitwerking die met de hand zijn
 * nagerekend. Met een vaste toevalsbron rolt er per sjabloon steeds dezelfde
 * som uit, en die ligt hier vast — vraag, antwoord, eenheid en al.
 *
 * Verder: het nakijken, de foutdiagnose, het samenvoegen, het leerprofiel, de
 * dagmissie, de rangen en de weeksleutel.
 *
 *   node gereedschap/huiswerk-gouden-waarden.mjs
 */
process.env.TZ = 'Europe/Amsterdam'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'

const NU = '2026-8-22'
const KLOK = Date.parse('2026-08-22T10:00:00Z')

const html = fs.readFileSync('gereedschap/oud/huiswerk-index.html', 'utf8')
/* Alleen het deel vóór de eerste React-component: daarna is het JSX, en dat
   draait niet in een gewone vm. Alles wat hier getoetst wordt staat ervóór. */
const regels = html.split('\n')
const van = regels.findIndex((l) => l.startsWith('const {useState,useEffect'))
const tot = regels.findIndex((l) => l.startsWith('function App(){'))
if (van < 0 || tot < 0) throw new Error('de grenzen van het scriptblok zijn verschoven')
let js = regels.slice(van + 1, tot).join('\n')

js += `
globalThis.__ = {
  PROFILES, THEMES, BELONING, NIVEAUGEWICHT, VAKNAAM, TOPICICON, SEED, TEMPLATES, BADGES,
  BOX_DAGEN, BEHEERS_NIVEAUS,
  ri, pick, shuffle, rnd, nl, pm,
  euro, halfRond, parseDag, weekbudgetVan, weekKey, weekNum, weekPuntenNu, mmss,
  dagMissie, crediteerMissie, zomerStand, berekenBeloning, upsertVerdiend, weekVerdiend,
  totaalVerdiend, totaalUitbetaald, openstaand, weekUitbetaald, rangVoor,
  blankProg, normalizeProg, mergeProg, mergeStore, mergeCards, syncData,
  cardInfo, dueTime, isMastered, puntenVoor, zwakteAnalyse, snapshotHistorie,
  beheersStatus, leerprofiel, instOf, doelNiveau, pickNext,
  norm, checkAnswer, diagnoseFout, todayStr, yesterdayStr, todayISO,
  bouwWedstrijd, wedstrijdWinnaar,
};`

class VasteDatum extends Date {
  constructor(...a) { super(...(a.length ? a : [KLOK])) }
  static now() { return KLOK }
}
/* Het toeval staat vast op een reeks die zich herhaalt. Zo levert elk sjabloon
   dezelfde som en is elke keuze uit `pickNext` te herleiden. */
let tik = 0
const REEKS = [0.13, 0.47, 0.81, 0.29, 0.66, 0.05, 0.92, 0.38, 0.74, 0.51]
const nepToeval = () => REEKS[tik++ % REEKS.length]
const ctx = {
  console, Date: VasteDatum,
  Math: Object.assign(Object.create(Math), { random: nepToeval }),
  JSON, Object, Array, String, Number, Set, Map, Boolean, Error, Proxy, Intl,
  isNaN, parseInt, parseFloat, RegExp, Promise,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  React: { useState() {}, useEffect() {}, useMemo() {}, useRef() {} },
  document: { addEventListener() {}, querySelector: () => null },
  window: { speechSynthesis: null, location: { href: 'http://x/' } },
  location: { href: 'http://x/' },
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

const vinger = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)
const zetToeval = (n) => { tik = n }

/* --------------------------------------------------- 1. de leerstof zelf */
const stof = {
  opgaven: O.SEED.length,
  sjablonen: O.TEMPLATES.length,
  vingerSeed: vinger(O.SEED),
  vingerProfielen: vinger(O.PROFILES),
  vingerThemas: vinger(O.THEMES),
  vingerVaknaam: vinger(O.VAKNAAM),
  eersteId: O.SEED[0].id,
  laatsteId: O.SEED[O.SEED.length - 1].id,
  perKind: Object.fromEntries(Object.keys(O.PROFILES)
    .map((p) => [p, O.SEED.filter((e) => e.p === p).length])),
  sjabloonIds: O.TEMPLATES.map((t) => t.id),
}

/* ------------------------------------------------------- 2. de sjablonen */
/* Elk sjabloon één keer, vanaf een vaste plek in de toevalsreeks. */
const sjablonen = O.TEMPLATES.map((t, i) => {
  zetToeval(i * 7)
  const inst = t.gen()
  return {
    id: t.id, p: t.p, v: t.v, t: t.t, lvl: t.lvl ?? null, jaar: t.jaar ?? null,
    q: inst.q, a: String(inst.a), alt: inst.alt ?? null, u: inst.u ?? null,
    opties: inst.opties ?? null, h: inst.h ?? null, s: inst.s ?? null,
    ill: inst.ill ?? null,
  }
})

/* --------------------------------------------------------- 3. het nakijken */
const NAKIJK = [
  ['11', '11'], ['11', ' 11 '], ['11', '11,0'], ['11', '11.00'], ['11', '12'],
  ['-3', '−3'], ['-3', '-3'], ['-3', '3'], ['3/4', '3/4'], ['3/4', '0,75'],
  ['0.75', '3/4'], ['0.75', '0,75'], ['3:00', '3:00'], ['3:00', '3'],
  ['12.5', '12,5'], ['12.5', '12,51'], ['12.5', '12,56'], ['100', '100,4'],
  ['100', '100,6'], ['€ 16', '16'], ['20%', '20'], ['abc', 'ABC'], ['abc', ' abc '],
  ['abc', 'abd'], ['5', ''], ['0', '0'], ['0', '0,001'],
]
const nakijken = NAKIJK.map(([a, val]) => ({
  a, val, norm: O.norm(val), goed: O.checkAnswer({ a }, val),
}))
const metAlt = [
  [{ a: 'bigger', alt: ['groter'] }, 'groter'],
  [{ a: '3/4', alt: ['0.75'] }, '0,75'],
  [{ a: 'goodbye', alt: ['bye', 'see you'] }, 'BYE'],
  [{ a: 'goodbye', alt: ['bye'] }, 'ciao'],
].map(([ex, val]) => ({ ex, val, goed: O.checkAnswer(ex, val) }))

const DIAGNOSE = [
  ['5', '-5'], ['5', '5'], ['36', '10'], ['10', '36'], ['100', '1000'],
  ['100', '10'], ['100', '0,1'], ['100', '105'], ['100', '250'], ['100', 'abc'],
  ['0', '5'], ['5', '0'],
]
const diagnoses = DIAGNOSE.map(([a, val]) => ({ a, val, tip: O.diagnoseFout({ a }, val) }))

/* ------------------------------------------------------- 4. het zakgeld */
const dagstanden = []
for (const goed of [0, 5, 11, 12, 20, 40, 60]) {
  for (const fout of [0, 2, 5, 12]) {
    for (const sterkPunten of [0, 10, 40, 90, 200]) {
      for (const [oefen, proef] of [[0, 0], [70, 0], [95, 0], [0, 70], [0, 88], [80, 100]]) {
        const pr = O.normalizeProg(O.blankProg())
        pr.dag = { d: O.todayStr(), goed, fout, sterk: Math.min(goed, sterkPunten), sterkPunten, sterkIds: [] }
        pr.toetsDag = { d: O.todayStr(), oefen, proef }
        const b = O.berekenBeloning(pr)
        dagstanden.push({
          in: { goed, fout, sterkPunten, oefen, proef },
          uit: {
            bedrag: b.bedrag, vandaagBruto: b.vandaagBruto, nauw: Math.round(b.nauw * 1e6) / 1e6,
            genoeg: b.genoeg, factor: b.factor, poort: b.poort,
            werkEuro: b.werkEuro, toetsEuro: b.toetsEuro, restWeek: b.restWeek,
          },
        })
      }
    }
  }
}
/* Het weekbudget: wat er al uitbetaald is knijpt het bedrag van vandaag af. */
const budgetten = [0, 5, 10, 18, 20, 25].map((betaald) => {
  const pr = O.normalizeProg(O.blankProg())
  pr.dag = { d: O.todayStr(), goed: 40, fout: 2, sterk: 40, sterkPunten: 120, sterkIds: [] }
  pr.betalingen = betaald ? [{ d: O.todayStr(), bedrag: betaald }] : []
  const b = O.berekenBeloning(pr)
  return { betaald, bedrag: b.bedrag, restWeek: b.restWeek, weekPaid: b.weekPaid }
})

const euros = [0, 0.24, 0.25, 0.26, 0.74, 0.75, 1, 2.5, 3.749, 12.3, 19.99]
  .map((n) => ({ n, half: O.halfRond(n), tekst: O.euro(n) }))

/* Verdiensten over meerdere weken: het werk telt per week gecapt op het budget. */
const totalen = (() => {
  const pr = O.normalizeProg(O.blankProg())
  pr.verdiend = [
    { d: '2026-8-3', bedrag: 6 }, { d: '2026-8-4', bedrag: 6 }, { d: '2026-8-5', bedrag: 6 },
    { d: '2026-8-6', bedrag: 6 }, { d: '2026-8-10', bedrag: 6 }, { d: '2026-8-11', bedrag: 6 },
    { d: '2026-8-20', bedrag: 4 }, { d: '2026-8-22', bedrag: 5 },
  ]
  pr.bonus = 10
  pr.verdiendBij = 2.5
  pr.betalingen = [{ d: '2026-8-7', bedrag: 15 }]
  return {
    totaalVerdiend: O.totaalVerdiend(pr),
    totaalUitbetaald: O.totaalUitbetaald(pr),
    openstaand: O.openstaand(pr),
    weekVerdiend: O.weekVerdiend(pr),
  }
})()

const zomers = [
  [{ aan: false, start: '2026-7-1', weken: 7, doel: 50, bonus: 15 }, []],
  [{ aan: true, start: null, weken: 7, doel: 50, bonus: 15 }, []],
  [{ aan: true, start: '2026-7-1', weken: 7, doel: 50, bonus: 15 },
    [{ d: '2026-7-5', bedrag: 12 }, { d: '2026-7-20', bedrag: 20 }, { d: '2026-6-1', bedrag: 99 }]],
  [{ aan: true, start: '2026-7-1', weken: 7, doel: 30, bonus: 15 },
    [{ d: '2026-7-5', bedrag: 12 }, { d: '2026-8-1', bedrag: 20 }]],
].map(([zomer, betalingen]) => {
  const pr = O.normalizeProg(O.blankProg())
  pr.betalingen = betalingen
  return { zomer, betalingen, uit: O.zomerStand(pr, zomer) }
})

/* ------------------------------------------------------------ 5. Leitner */
const dozen = O.BOX_DAGEN
const puntenTabel = []
for (const box of [0, 1, 2, 3, 4, 5]) {
  for (const hint of [false, true]) {
    const pr = O.normalizeProg(O.blankProg())
    pr.cards = { x: { box, ok: 1, wrong: 0, last: 0 } }
    puntenTabel.push({ box, hint, punten: O.puntenVoor(pr, 'x', hint), beheerst: O.isMastered(pr, 'x') })
  }
}

/* Twintig keer achter elkaar de volgende kaart kiezen, met de doosjes die
   meeschuiven — precies zoals in een sessie. */
function reeks(pid, vak, onderwerp, aantal, goedPatroon) {
  const pool = O.SEED.filter((e) => e.p === pid && e.v === vak && e.t === onderwerp)
  const pr = O.normalizeProg(O.blankProg())
  const recent = []
  const uit = []
  for (let i = 0; i < aantal; i++) {
    zetToeval(i * 3)
    const kaart = O.pickNext(pool, pr, recent)
    if (!kaart) break
    const goed = goedPatroon[i % goedPatroon.length]
    const c = { ...(pr.cards[kaart.id] || { box: 0, ok: 0, wrong: 0, last: 0 }) }
    if (goed) { c.ok++; c.box = Math.min(5, c.box + 1) } else { c.wrong++; c.box = 1 }
    c.last = KLOK + i * 1000
    pr.cards = { ...pr.cards, [kaart.id]: c }
    recent.push(kaart.id)
    if (recent.length > 5) recent.shift()
    uit.push({ i, id: kaart.id, lvl: kaart.lvl ?? null, box: c.box, goed })
  }
  return { pid, vak, onderwerp, aantal: pool.length, stappen: uit }
}
const reeksen = [
  reeks('wassima', 'wiskunde', 'Rekenvolgorde', 12, [true]),
  reeks('wassima', 'wiskunde', 'Breuken', 16, [true, true, false]),
  reeks('amine', 'rekenen', 'Tafels & keer', 14, [false, true]),
  reeks('selma', 'rekenen', 'Getallen tot 100', 10, [true, false, true, true]),
  reeks('amaani', 'wiskundeA', 'Differentiëren', 12, [true, true, true, false]),
]

const niveaus = []
for (const niveau of ['auto', 1, 2, 3]) {
  for (const autoLvl of [1, 2, 3]) {
    const pr = O.normalizeProg({ ...O.blankProg(), niveau, autoLvl })
    niveaus.push({ niveau, autoLvl, doel: O.doelNiveau(pr) })
  }
}

/* ------------------------------------------------- 6. het volgsysteem */
function metVoortgang(pid, hoeveel, box) {
  const pr = O.normalizeProg(O.blankProg())
  const eigen = O.SEED.filter((e) => e.p === pid)
  eigen.slice(0, hoeveel).forEach((e, i) => {
    pr.cards[e.id] = { box, ok: box, wrong: i % 4 === 0 ? 2 : 0, last: KLOK - i * 86400000 }
  })
  pr.punten = 340
  pr.dagstreak = 4
  return pr
}
const profielen = [
  ['wassima', 60, 5], ['wassima', 30, 2], ['amine', 40, 4], ['selma', 20, 1], ['amaani', 0, 0],
].map(([pid, n, box]) => {
  const pr = metVoortgang(pid, n, box)
  const lp = O.leerprofiel(pr, [...O.SEED, ...O.TEMPLATES], pid)
  const za = O.zwakteAnalyse(pr, [...O.SEED, ...O.TEMPLATES], pid)
  return {
    pid, n, box,
    profiel: {
      totaal: lp.totaal, beheerst: lp.beheerst, geoefend: lp.geoefend,
      mastery: lp.mastery, dekking: lp.dekking,
      vakken: lp.vakken.map((v) => ({
        v: v.v, naam: v.naam, totaal: v.totaal, beheerst: v.beheerst,
        pct: v.pct, dekking: v.dekking,
        onderwerpen: v.onderwerpen.map((o) => ({
          t: o.t, pct: o.pct, pogingen: o.pogingen, nauw: o.nauw, status: o.status.key,
        })),
      })),
    },
    zwak: za.zwak.map((z) => ({ v: z.v, t: z.t, pct: z.pct, wrong: z.wrong, score: z.score })),
    sterk: za.sterk.map((z) => ({ v: z.v, t: z.t, beg: z.beg })),
    geoefendAantal: za.geoefendAantal,
  }
})

const statussen = []
for (const pct of [0, 20, 49, 50, 79, 80, 100]) {
  for (const geoefend of [0, 1, 5]) {
    statussen.push({ pct, geoefend, key: O.beheersStatus(pct, geoefend).key })
  }
}

/* ----------------------------------------------- 7. missie, rang, week */
const missies = [
  { goal: 10, todayCount: 10, goed: 9, fout: 1, oefen: 80, proef: 0 },
  { goal: 10, todayCount: 4, goed: 4, fout: 0, oefen: 0, proef: 0 },
  { goal: 10, todayCount: 12, goed: 6, fout: 6, oefen: 90, proef: 0 },
  { goal: 5, todayCount: 8, goed: 8, fout: 0, oefen: 0, proef: 75 },
  { goal: 10, todayCount: 20, goed: 18, fout: 2, oefen: 0, proef: 0 },
].map((x) => {
  const pr = O.normalizeProg(O.blankProg())
  pr.goal = x.goal
  pr.todayCount = x.todayCount
  pr.dag = { d: O.todayStr(), goed: x.goed, fout: x.fout, sterk: 0, sterkPunten: 0, sterkIds: [] }
  pr.toetsDag = { d: O.todayStr(), oefen: x.oefen, proef: x.proef }
  const m = O.dagMissie(pr)
  const voor = pr.punten
  const gecrediteerd = O.crediteerMissie(pr)
  return {
    in: x, taken: m.taken.map((t) => ({ k: t.k, ok: t.ok, tekst: t.tekst })), klaar: m.klaar,
    gecrediteerd, puntenErbij: pr.punten - voor, missieStreak: pr.missieStreak,
  }
})

const rangen = []
for (const thema of ['standaard', 'voetbal']) {
  for (const punten of [0, 99, 100, 249, 250, 500, 899, 1400, 2000, 3000, 5000]) {
    const r = O.rangVoor(O.THEMES[thema], punten)
    rangen.push({ thema, punten, naam: r.naam, emoji: r.emoji, volgendeNaam: r.volgendeNaam, naar: r.naar, pct: r.pct })
  }
}

const weken = ['2026-1-1', '2026-1-4', '2026-1-5', '2026-8-22', '2026-12-28', '2027-1-3', '2024-12-30']
  .map((d) => ({ d, wk: O.weekKey(O.parseDag(d)), num: O.weekNum(O.weekKey(O.parseDag(d))) }))
const weekstanden = [
  [{ weekKey: O.weekKey(), weekBasis: 100, punten: 340 }, 240],
  [{ weekKey: '2020-w1', weekBasis: 100, punten: 340 }, 0],
  [{ weekKey: O.weekKey(), weekBasis: 400, punten: 340 }, 0],
].map(([veld]) => {
  const pr = O.normalizeProg({ ...O.blankProg(), ...veld })
  return { veld, uit: O.weekPuntenNu(pr) }
})

const klokjes = [0, 9, 59, 60, 61, 125, 600, 3599].map((s) => ({ s, tekst: O.mmss(s) }))

/* ------------------------------------------------------ 8. samenvoegen */
function stukje(x) {
  return O.normalizeProg({ ...O.blankProg(), ...x })
}
const samen = [
  [{ punten: 100, cards: { a: { box: 3, ok: 3, wrong: 1, last: 500 } } },
    { punten: 60, cards: { a: { box: 2, ok: 5, wrong: 0, last: 900 } } }],
  [{ punten: 50, weekKey: '2026-w30', weekPunten: 20, weekBasis: 30 },
    { punten: 80, weekKey: '2026-w30', weekPunten: 40, weekBasis: 10 }],
  [{ punten: 50, weekKey: '2026-w9', weekPunten: 20, weekBasis: 30 },
    { punten: 80, weekKey: '2026-w28', weekPunten: 40, weekBasis: 10 }],
  [{ dag: { d: '2026-8-22', goed: 10, fout: 2, sterk: 4, sterkPunten: 8, sterkIds: ['a'] } },
    { dag: { d: '2026-8-22', goed: 6, fout: 5, sterk: 6, sterkPunten: 4, sterkIds: ['b'] } }],
  [{ dag: { d: '2026-8-21', goed: 10, fout: 2, sterk: 4, sterkPunten: 8, sterkIds: ['a'] } },
    { dag: { d: '2026-8-22', goed: 1, fout: 0, sterk: 1, sterkPunten: 1, sterkIds: ['b'] } }],
  [{ verdiend: [{ d: '2026-8-20', bedrag: 3 }, { d: '2026-8-21', bedrag: 5 }] },
    { verdiend: [{ d: '2026-8-20', bedrag: 6 }, { d: '2026-8-22', bedrag: 2 }] }],
  [{ niveau: 'auto', autoLvl: 2 }, { niveau: 3, autoLvl: 1 }],
  [{ niveau: 2, autoLvl: 3 }, { niveau: 'auto', autoLvl: 1 }],
  [{ badges: ['p50'], solved: { a: { ok: 3 } } }, { badges: ['s5'], solved: { a: { ok: 1 }, b: { ok: 2 } } }],
  [{ historie: [{ wk: '2026-w30', punten: 100, beheerst: 5, geoefend: 9 }] },
    { historie: [{ wk: '2026-w30', punten: 120, beheerst: 4, geoefend: 12 }, { wk: '2026-w31', punten: 200, beheerst: 8, geoefend: 20 }] }],
].map(([a, b]) => ({ a, b, uit: O.mergeProg(stukje(a), stukje(b)) }))

/* De oude migratie van `solved` naar Leitner-kaarten. */
const migraties = [
  { solved: { x: { ok: 0 } } },
  { solved: { x: { ok: 3 }, y: { ok: 9 } } },
  { solved: { x: { ok: 2 } }, cards: { z: { box: 2, ok: 1, wrong: 0, last: 0 } } },
].map((p) => ({ in: p, uit: O.normalizeProg(p).cards }))

const uit = {
  gemaakt: 'gereedschap/huiswerk-gouden-waarden.mjs, uit gereedschap/oud/huiswerk-index.html',
  nu: NU,
  stof, sjablonen, nakijken, metAlt, diagnoses,
  dagstanden, budgetten, euros, totalen, zomers,
  dozen, puntenTabel, reeksen, niveaus,
  profielen, statussen, missies, rangen, weken, weekstanden, klokjes,
  samen, migraties,
}
fs.writeFileSync('src/huiswerk/gouden-waarden.json', JSON.stringify(uit, null, 1) + '\n')
console.log(`${stof.opgaven} opgaven, ${stof.sjablonen} sjablonen, ${dagstanden.length} dagstanden, `
  + `${nakijken.length} nakijkgevallen — src/huiswerk/gouden-waarden.json`)
process.exit(0)
