#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT DE OUDE GELOOFSSTUDIE
 *
 * Twee dingen moeten de overzetting overleven, en geen van beide is met het
 * blote oog te controleren.
 *
 * Het eerste is de leerstof zelf: vijf sporen, drieëntwintig modules, vierennegentig
 * kaarten, negenenzestig lexicontermen. Die zijn met sed uit de oude pagina
 * gesneden en niet overgetypt, maar een verschoven regel of een gesneuvelde
 * escape zie je pas terug als er een lege week in het programma staat. Daarom
 * legt dit script per onderdeel een vingerafdruk vast.
 *
 * Het tweede is de kaartplanner. Die stuurt een reeks van maanden aan; wie zich
 * daar vergist in de volgorde van twee regels, merkt dat pas als een kaart een
 * kwartaal te laat terugkomt. De planner wordt hier dus niet nagerekend maar
 * gedráaid: de oude functies zelf, in een namaakbrowser, met een vaste klok.
 *
 * De tijdzone gaat op UTC voordat er één datum wordt aangeraakt. De oude app
 * rekende met toISOString(), en dat is UTC; wie dit script in Amsterdam draait
 * zonder die regel krijgt rond middernacht andere waarden dan de app gaf.
 *
 *   node gereedschap/sanad-gouden-waarden.mjs
 */
process.env.TZ = 'UTC'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'

const NU = '2026-08-22'
const KLOK = Date.parse(NU + 'T10:00:00Z')

const html = fs.readFileSync('gereedschap/oud/sanad-index.html', 'utf8')
const blokken = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
/* De laatste regels starten de app en praten met het netwerk; die knippen we
   eraf. Wat overblijft zijn de definities. */
let js = blokken.join('\n').replace(/\(async function\(\)\{[\s\S]*$/, '')

js += `
globalThis.__ = {
  CURRICULUM, KAARTEN, BRONNEN, LEXICON, EXTRA, CONSOLIDATIE,
  PROGRAMMA, TOT, FASEN, DISC, NIV,
  volgend, fmt, beoordeel, samenvoegen, SAMEN, dueKaarten, actief, open_sporen,
  actieveWeek, planWeek, gedaan, vandaagStr, dagen,
  get S(){return S}, set S(v){S=v},
  get rij(){return rij}, set rij(v){rij=v},
  get kaart(){return kaart}, set kaart(v){kaart=v},
};`

/* Een namaakbrowser die net genoeg kan. Elke knoop slikt alles wat het oude
   scherm erin schrijft; niemand kijkt ernaar. */
const knoop = () => new Proxy({}, {
  get: (d, k) => (k in d ? d[k] : (k === 'classList' ? { add() {}, toggle() {} } : () => {})),
  set: (d, k, v) => ((d[k] = v), true),
})
class VasteDatum extends Date {
  constructor(...a) { super(...(a.length ? a : [KLOK])) }
  static now() { return KLOK }
}
const ctx = {
  console, Date: VasteDatum, Math, JSON, Object, Array, String, Number, Set, Boolean,
  setTimeout: () => 0, clearTimeout() {}, fetch: async () => ({ ok: false, json: async () => ({}) }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { querySelector: knoop, querySelectorAll: () => [], addEventListener() {}, createElement: knoop },
  window: { scrollTo() {}, addEventListener() {} },
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

const vinger = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

/* ---------- 1. de leerstof ---------- */
const stof = {
  curriculum: O.CURRICULUM.map((sp) => ({
    id: sp.id, nr: sp.nr, kleur: sp.kleur, titel: sp.titel,
    modules: sp.modules.map((m) => ({
      id: m.id, titel: m.titel, tijd: m.tijd,
      secties: m.secties.length, juist: m.check.j, opties: m.check.o.length,
      vinger: vinger(m),
    })),
    vinger: vinger(sp),
  })),
  kaarten: O.KAARTEN.map((k) => ({ id: k.id, s: k.s, vinger: vinger(k) })),
  bronnen: O.BRONNEN.map((b) => ({ t: b.t, d: b.d, n: b.n, vinger: vinger(b) })),
  lexicon: O.LEXICON.map((x) => ({ t: x.t, vinger: vinger(x) })),
  extra: Object.fromEntries(Object.entries(O.EXTRA).map(([k, v]) =>
    [k, { matn: v.matn.length, vinger: vinger(v) }])),
  consolidatie: O.CONSOLIDATIE.map((c) => ({ na: c.na, titel: c.titel, taken: c.taken.length, vinger: vinger(c) })),
}

/* ---------- 2. het programma ---------- */
const programma = O.PROGRAMMA.map((w) => ({
  nr: w.nr, type: w.type, spoor: w.sp.id,
  titel: w.type === 'les' ? w.m.titel : w.c.titel,
  module: w.type === 'les' ? w.m.id : null,
}))

/* ---------- 3. de planner ---------- */
const roosters = []
for (const i of [0, 1, 2, 3, 5, 8, 13, 21, 34, 60, 120, 365]) {
  for (const e of [1.3, 1.8, 2.5, 2.9, 3.2]) {
    for (const q of [1, 2, 3]) {
      const d = O.volgend({ i, e }, q)
      roosters.push({ i, e, q, d, tekst: O.fmt(d) })
    }
  }
}
/* Een lege kaart: zo komt een nog niet geziene kaart binnen. */
for (const q of [1, 2, 3]) roosters.push({ i: null, e: null, q, d: O.volgend({}, q), tekst: O.fmt(O.volgend({}, q)) })

/* Volledige reeksen: een verse kaart die achter elkaar zo beoordeeld wordt. */
const reeksen = []
for (const pad of [[2,2,2,2,2,2], [3,3,3,3], [1,1,1,1], [2,0,2,2,0,3], [3,1,2,0,3,3,2], [0,0,0]]) {
  const uit = []
  O.S = { start: '2026-01-01', dag: '4', klaar: { 1: NU }, cards: {}, notities: {}, alles: true, last: null, dagreeks: 0 }
  const k = O.KAARTEN[0]
  for (const q of pad) {
    O.kaart = k
    O.rij = [k]
    O.beoordeel(q)
    const c = O.S.cards[k.id]
    uit.push({ q, i: c.i, e: +c.e.toFixed(10), n: c.n, due: c.due })
  }
  reeksen.push({ pad, uit, dagreeks: O.S.dagreeks, last: O.S.last })
}

/* ---------- 4. samenvoegen ---------- */
const paren = [
  [{}, {}],
  [{ start: '2026-03-01', klaar: { 1: 'a' } }, { start: '2026-01-15', klaar: { 2: 'b' } }],
  [{ cards: { k01: { i: 8, e: 2.5, n: 3, due: '2026-09-01' } } },
   { cards: { k01: { i: 2, e: 2.2, n: 5, due: '2026-08-25' } } }],
  [{ cards: { k01: { i: 8, e: 2.5, n: 3, due: '2026-09-01' } } },
   { cards: { k01: { i: 4, e: 2.5, n: 3, due: '2026-09-09' } } }],
  [{ cards: { k02: { i: 1, e: 2.5, n: 1, due: '2026-08-23' } } },
   { cards: { k03: { i: 1, e: 2.5, n: 1, due: '2026-08-24' } } }],
  [{ notities: { 3: 'kort' } }, { notities: { 3: 'een veel langere uitwerking' } }],
  [{ notities: { 3: 'een veel langere uitwerking' } }, { notities: { 3: 'kort' } }],
  [{ alles: true, dagreeks: 9, last: '2026-08-01' }, { alles: false, dagreeks: 2, last: '2026-08-20' }],
  [{ dag: '4', start: '2026-02-02' }, { dag: '2' }],
  [{ klaar: { 1: 'x', 2: 'y' } }, { klaar: { 2: 'z', 3: 'w' } }],
]
/* JSON kent geen `undefined`: waar het oude samenvoegen niets teruggaf, zou het
   veld anders stilletjes uit de gouden waarden verdwijnen en de vergelijking
   met de nieuwe code — die daar `null` of de standaardwaarde zet — alsnog
   slagen. Aanvullen gebeurt daarom hier, in de opwekker, en niet in de toets. */
const LEEG = { start: null, dag: '4', klaar: {}, cards: {}, notities: {}, alles: false, last: null, dagreeks: 0 }
const aanvullen = (o) => ({ ...LEEG, ...o, start: o.start ?? null, last: o.last ?? null })
const samen = paren.map(([a, b]) => ({ a, b, uit: aanvullen(O.samenvoegen(a, b)) }))

/* ---------- 5. wat er open staat ---------- */
const openstaand = []
for (const klaar of [{}, { 1: NU }, { 1: NU, 6: NU }, { 1: NU, 6: NU, 12: NU, 18: NU, 24: NU }]) {
  O.S = { start: '2026-01-01', dag: '4', klaar, cards: {}, notities: {}, alles: false, last: null, dagreeks: 0 }
  openstaand.push({
    klaar, sporen: [...O.open_sporen()].sort(), actief: O.actief().length,
    due: O.dueKaarten().length, week: O.actieveWeek(), gedaan: O.gedaan(),
  })
}
O.S = { start: '2026-01-01', dag: '4', klaar: {}, cards: {}, notities: {}, alles: true, last: null, dagreeks: 0 }
openstaand.push({ klaar: {}, alles: true, sporen: [], actief: O.actief().length, due: O.dueKaarten().length, week: O.actieveWeek(), gedaan: 0 })

/* ---------- 6. de planning ---------- */
const planning = []
for (const start of [null, NU, '2026-08-15', '2026-06-01', '2025-01-01', '2026-09-01']) {
  O.S = { start, dag: '4', klaar: {}, cards: {}, notities: {}, alles: false, last: null, dagreeks: 0 }
  planning.push({ start, nu: NU, week: O.planWeek() })
}

const uit = {
  gemaakt: 'gereedschap/sanad-gouden-waarden.mjs, uit gereedschap/oud/sanad-index.html',
  nu: NU, totaal: O.TOT, fasen: O.FASEN, disciplines: O.DISC, niveaus: O.NIV,
  stof, programma, roosters, reeksen, samen, openstaand, planning,
}
fs.writeFileSync('src/sanad/gouden-waarden.json', JSON.stringify(uit, null, 1) + '\n')
console.log(`${O.TOT} weken, ${O.KAARTEN.length} kaarten, ${roosters.length} roosters, ${reeksen.length} reeksen — src/sanad/gouden-waarden.json`)
