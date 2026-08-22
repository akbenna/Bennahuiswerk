#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT DE OUDE ISLAM LEREN
 *
 * Het zwaarste stuk hier zijn de gebedstijden. Die worden uit de stand van de
 * zon berekend — juliaanse dag, declinatie, tijdvereffening, uurhoek — en een
 * fout van een halve graad is een fout van twee minuten die niemand ziet tot
 * iemand te vroeg bidt. Ze zijn dus niet nagerekend maar gedraaid: de oude
 * functies zelf, over honderden combinaties van datum, plaats, methode en
 * asr-schaduw, tot op de seconde vastgelegd.
 *
 * De tijdzone gaat als getal mee in plaats van uit de klok van de machine te
 * komen. De oude code las hem uit `datum.getTimezoneOffset()`; dat maakte de
 * uitkomst afhankelijk van waar het script draait, en dat is precies wat een
 * gouden waarde niet mag zijn. Dit script draait daarom in Amsterdam — de
 * plaats waar de app gebruikt wordt — en legt per geval vast wélke tijdzone
 * eruit kwam, zodat de nieuwe code hem als argument terugkrijgt.
 *
 * Verder gaan het samenvoegen, de kaartplanner, de punten, de insignes, de
 * dagmissie en het weekbudget erdoorheen.
 *
 *   node gereedschap/noer-gouden-waarden.mjs
 */
process.env.TZ = 'Europe/Amsterdam'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'

const NU = '2026-08-22'
const KLOK = Date.parse(NU + 'T10:00:00Z')

const html = fs.readFileSync('gereedschap/oud/noer-index.html', 'utf8')
const blok = html.match(/<script>([\s\S]*)<\/script>/)[1]
let js = blok.replace(/\n\(async function\s*\(\)\s*\{[\s\S]*$/, '')

js += `
globalThis.__ = {
  MODULES, WUDU, WUDU_REGELS, STAPPEN, GEBEDEN, NAWAFIL, BIJZONDER, ROUW, FOUTEN,
  HIFZ, DUAS, NAAST, NIVEAUS, TARIEF, XP, INSIGNES, SPOREN, T, REGELS, METHODEN,
  julian, zonStand, gebedstijden, qiblaHoek, kaal,
  samenvoegen, leegS, leegProg, niveauVan, leeftijd, spoor, lessenVan, alleLessen,
  raakDag, punten, verdien, verdiendDezeWeek, verdiendVandaagUit,
  missie, checkMissie, checkInsignes, alleKaarten, kaartenNu, kaartAntwoord, markeerOefening,
  vandaag, gisteren, dagMs, half, klok, etiket, TUSSEN, P, prof,
  get S(){return S}, set S(v){S=v},
};`

const knoop = () => new Proxy({ dataset: {}, style: {}, files: [], value: '', classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, {
  get: (d, k) => (k in d ? d[k] : () => {}),
  set: (d, k, v) => ((d[k] = v), true),
})
class VasteDatum extends Date {
  constructor(...a) { super(...(a.length ? a : [KLOK])) }
  static now() { return KLOK }
}
const ctx = {
  console, Date: VasteDatum, Math, JSON, Object, Array, String, Number, Set, Map, Boolean,
  Error, Proxy, Intl, isNaN, parseInt, parseFloat, RegExp,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  speechSynthesis: { getVoices: () => [], speak() {}, cancel() {}, addEventListener() {} },
  SpeechSynthesisUtterance: function () { return {} },
  document: {
    querySelector: knoop, querySelectorAll: () => [], addEventListener() {},
    createElement: knoop, body: { dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {} },
    documentElement: { dataset: {}, style: { setProperty() {} } },
  },
  window: { scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  navigator: { mediaDevices: {}, geolocation: {} },
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { value: 0 } }), createGain: () => ({ connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }), destination: {}, currentTime: 0 } },
}
ctx.globalThis = ctx
ctx.window.AudioContext = ctx.AudioContext
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

const vinger = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)
const rond = (x) => (typeof x === 'number' && !Number.isNaN(x) ? Math.round(x * 3600) / 3600 : null)

/* ------------------------------------------------- 1. de gebedstijden ----- */
const PLEKKEN = [
  { n: 'Roermond', lat: 51.1942, lon: 5.9873 },
  { n: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { n: 'Mekka', lat: 21.4225, lon: 39.8262 },
  { n: 'Tanger', lat: 35.7595, lon: -5.834 },
  { n: 'Tromsø', lat: 69.6496, lon: 18.956 },
  { n: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { n: 'Jakarta', lat: -6.2088, lon: 106.8456 },
]
/* Vier keerpunten en twee gewone dagen: de zonnewendes zijn waar de hoge
   breedtegraad het lastigst is, de equinoxen waar hij het makkelijkst is. */
const DAGEN = [
  [2026, 1, 15], [2026, 3, 20], [2026, 5, 1], [2026, 6, 21],
  [2026, 9, 23], [2026, 11, 5], [2026, 12, 21], [2027, 2, 28],
]
const tijden = []
for (const p of PLEKKEN) {
  for (const [j, m, d] of DAGEN) {
    for (const methode of ['MWL', 'ISNA', 'EGYPT', 'KARACHI']) {
      for (const asr of [1, 2]) {
        for (const hoog of ['zevende', 'midden', 'geen']) {
          const datum = new Date(Date.UTC(j, m - 1, d, 12))
          O.S = O.leegS()
          O.S.gezin.hoog = hoog
          const t = O.gebedstijden(datum, p.lat, p.lon, { methode, asr })
          tijden.push({
            plek: p.n, lat: p.lat, lon: p.lon, j, m, d, methode, asr, hoog,
            tz: -datum.getTimezoneOffset() / 60,
            t: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, rond(v)])),
          })
        }
      }
    }
  }
}

const qibla = PLEKKEN.map((p) => ({ plek: p.n, lat: p.lat, lon: p.lon, hoek: rond(O.qiblaHoek(p.lat, p.lon)) }))
const juliaans = DAGEN.map(([j, m, d]) => ({ j, m, d, jd: O.julian(j, m, d), zon: (() => {
  const z = O.zonStand(O.julian(j, m, d))
  return { decl: rond(z.decl), eqt: rond(z.eqt) }
})() }))

/* ------------------------------------------------------ 2. de leerstof ---- */
const stof = {
  modules: O.MODULES.map((m) => ({
    id: m.id, t: m.t,
    lessen: m.lessen.map((l) => ({
      id: l.id, t: l.t, sp: l.sp ?? 1,
      vragen: (l.q ?? []).map((q) => ({ a: q.a, opties: q.o.length })),
      kaartjes: (l.kt ?? []).length,
      vinger: vinger(l),
    })),
    vinger: vinger(m),
  })),
  hifz: O.HIFZ.map((h) => ({ id: h.id, naam: h.naam, regels: h.r.length, vinger: vinger(h) })),
  duas: O.DUAS.map((d) => ({ vinger: vinger(d) })),
  wudu: O.WUDU.map((w) => ({ vinger: vinger(w) })),
  stappen: O.STAPPEN.map((s) => ({ vinger: vinger(s) })),
  bijzonder: O.BIJZONDER.map((b) => ({ vinger: vinger(b) })),
  fouten: O.FOUTEN.map((f) => ({ vinger: vinger(f) })),
  niveaus: O.NIVEAUS, tarief: O.TARIEF, xp: O.XP, insignes: O.INSIGNES,
}

/* Diakritische tekens weghalen: dat is hoe uitgesproken tekst met geschreven
   tekst wordt vergeleken, en één regel te veel of te weinig breekt dat stil. */
const kaalGevallen = [
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  'اللَّهُ أَكْبَرُ',
  'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ',
  '  spaties   ertussen  ',
  '',
].map((s) => ({ in: s, uit: O.kaal(s) }))

/* -------------------------------------------------- 3. sporen en niveaus -- */
const niveaus = [0, 1, 119, 120, 299, 300, 599, 600, 1200, 5000, 99999]
  .map((pt) => ({ punten: pt, n: O.niveauVan(pt) }))
const sporen = [2024, 2018, 2016, 2015, 2014, 2013, 2010, 2005]
  .map((geb) => {
    const p = { id: 'x', naam: 'x', geb }
    return { geb, leeftijd: O.leeftijd(p), spoor: O.spoor(p) }
  })

/* ------------------------------------------------------ 4. de kaarten ----- */
O.S = O.leegS()
O.S.profielen = [{ id: 'p1', naam: 'Test', geb: 2014, kleur: '#0F6F6C' }]
O.S.actief = 'p1'
const kaartIds = O.alleKaarten().map((k) => k.id)
const kaartRondes = []
for (const pad of [[true, true, true, true, true, true, true, true],
  [true, true, false, true, true],
  [false, false, true],
  [true, false, true, false, true]]) {
  O.S = O.leegS()
  O.S.profielen = [{ id: 'p1', naam: 'Test', geb: 2014, kleur: '#0F6F6C' }]
  O.S.actief = 'p1'
  const id = kaartIds[0]
  const uit = []
  for (const goed of pad) {
    O.kaartAntwoord(id, goed)
    const st = O.S.data.p1.kaarten[id]
    uit.push({ goed, stap: st.stap, over: st.due - Math.floor(KLOK / 864e5) })
  }
  kaartRondes.push({ pad, uit, punten: O.S.data.p1.punten, reeks: O.S.data.p1.reeks })
}
const kaartTelling = (() => {
  O.S = O.leegS()
  O.S.profielen = [{ id: 'p1', naam: 'Test', geb: 2014, kleur: '#0F6F6C' }]
  O.S.actief = 'p1'
  const n = O.kaartenNu()
  return { nieuw: n.nieuw.length, herhaal: n.herhaal.length, totaal: kaartIds.length }
})()

/* ------------------------------------------------------ 5. het budget ----- */
const budget = []
{
  O.S = O.leegS()
  O.S.profielen = [{ id: 'p1', naam: 'Test', geb: 2014, kleur: '#0F6F6C' }]
  O.S.actief = 'p1'
  O.S.gezin.budget = 2
  for (const bedrag of [0.5, 1.0, 0.75, 0.5]) {
    budget.push({ gevraagd: bedrag, gekregen: O.verdien('proef', bedrag), saldo: O.S.data.p1.saldo })
  }
}

/* ---------------------------------------------------- 6. het samenvoegen -- */
/* Aanvullen tot een volledige momentopname, zoals de app het ook doet: wat er
   van een toestel binnenkomt gaat eerst door leegS() heen. Het gezin en de
   instellingen worden daarbij per veld aangevuld en niet in hun geheel
   vervangen — anders zou een half gezin uit een oudere versie de plaats
   meenemen en de gebedsmethode kwijtraken. */
const maakStand = (o) => {
  const s = O.leegS()
  return Object.assign(s, o, {
    gezin: Object.assign(s.gezin, o.gezin || {}),
    instel: Object.assign(s.instel, o.instel || {}),
  })
}
const paren = [
  [{}, {}],
  [{ profielen: [{ id: 'a', naam: 'A', geb: 2014 }] }, { profielen: [{ id: 'b', naam: 'B', geb: 2016 }] }],
  [{ data: { a: Object.assign(O.leegProg(), { punten: 100, saldo: 3 }) } },
   { data: { a: Object.assign(O.leegProg(), { punten: 40, saldo: 5 }) } }],
  [{ data: { a: Object.assign(O.leegProg(), { lessen: { l1: { klaar: true, score: 60, d: '2026-01-01' } } }) } },
   { data: { a: Object.assign(O.leegProg(), { lessen: { l1: { klaar: false, score: 90, d: '2026-02-01' } } }) } }],
  [{ data: { a: Object.assign(O.leegProg(), { kaarten: { k1: { stap: 4, due: 100 } } }) } },
   { data: { a: Object.assign(O.leegProg(), { kaarten: { k1: { stap: 2, due: 200 } } }) } }],
  [{ data: { a: Object.assign(O.leegProg(), { insignes: ['x', 'y'] }) } },
   { data: { a: Object.assign(O.leegProg(), { insignes: ['y', 'z'] }) } }],
  [{ gezin: { plaats: 'Roermond', budget: 10 } }, { gezin: { plaats: 'Weert', budget: 5 } }],
]
const samen = paren.map(([a, b]) => ({
  a, b, uit: O.samenvoegen(maakStand(a), maakStand(b)),
}))

const uit = {
  gemaakt: 'gereedschap/noer-gouden-waarden.mjs, uit gereedschap/oud/noer-index.html',
  nu: NU, tijden, qibla, juliaans, stof, kaalGevallen, niveaus, sporen,
  kaartIds, kaartRondes, kaartTelling, budget, samen,
}
fs.writeFileSync('src/noer/gouden-waarden.json', JSON.stringify(uit, null, 1) + '\n')
process.exitCode = 0
console.log(`${tijden.length} gebedstijden, ${kaartIds.length} kaarten, ${stof.modules.length} modules — src/noer/gouden-waarden.json`)
process.exit(0)
