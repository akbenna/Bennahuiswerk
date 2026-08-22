#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT HET OUDE ARABISCH
 *
 * Twee dingen die je niet met het oog controleert.
 *
 * Het eerste is FSRS: de herhalingsplanner met negentien gepubliceerde
 * gewichten, waarin stabiliteit, moeilijkheid en ophaalbaarheid elkaar per
 * beurt bijstellen. Een cijfer in de zevende decimaal verschuift een interval
 * pas maanden later, en dan is er niets meer te herleiden. Dus: de oude
 * functies zelf, over hele beoordelingsreeksen, met de spreiding uitgezet.
 *
 * Het tweede is het nakijken van getypte antwoorden. Een leerling die "kitab"
 * typt in plaats van "kitāb" heeft het goed; wie dat strenger maakt meet
 * typvaardigheid in plaats van taalkennis. De normalisatie van Nederlands en
 * Arabisch staat hier per geval vastgelegd, inclusief de alif-varianten.
 *
 * Verder: de leerstof, het samenvoegen, de kaartlijst per spoor, de vier
 * letterVormen en het spoor per leeftijd.
 *
 *   node gereedschap/arabisch-gouden-waarden.mjs
 */
process.env.TZ = 'Europe/Amsterdam'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'

const NU = '2026-08-22'
const KLOK = Date.parse(NU + 'T10:00:00Z')

const html = fs.readFileSync('gereedschap/oud/arabisch-index.html', 'utf8')
const blokken = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
let js = blokken.join('\n').replace(/\nfunction start\(\)\{[\s\S]*$/, '')

js += `
globalThis.__ = {
  LETTERS, EXTRA_TEKENS, TEKENS, WOORDEN, GRAMMATICA, ZINNEN, TEKSTEN, KORAN100,
  SESSIE, SESSIEMINUTEN, BLOKKEN, JAAR, METING, METINGNIVEAUS, SPOORNAAM, SPOORLEEFTIJD,
  FSRS, normNl, normAr, ontdoeTashkil, antwoordKlopt, letterVormen, arIn,
  samenvoegen, samenvoegenProfiel, spoorBijLeeftijd, verseStaat,
  alleKaartIds, herhalingsRij, kaartId, vandaag, dagVerschil, plusDagen, datumNL,
  bouwPad, LETTERGROEPEN, hakInStukken, rondgang, vocaliseer, AMBIGU,
  weekVan, blokVan, lettersTot,
  get S(){return S}, set S(v){S=v},
  get P(){return P}, set P(v){P=v},
};`

const knoop = () => new Proxy({ dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, value: '', files: [] }, {
  get: (d, k) => (k in d ? d[k] : () => {}),
  set: (d, k, v) => ((d[k] = v), true),
})
class VasteDatum extends Date {
  constructor(...a) { super(...(a.length ? a : [KLOK])) }
  static now() { return KLOK }
}
/* De spreiding op de intervallen uitzetten: 0.5 laat `1 + (0.5*0.1 - 0.05)`
   precies op 1 uitkomen, dus het interval blijft wat de formule gaf. */
const ctx = {
  console, Date: VasteDatum, Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  JSON, Object, Array, String, Number, Set, Map, Boolean, Error, Proxy, Intl,
  isNaN, parseInt, parseFloat, RegExp,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  speechSynthesis: { getVoices: () => [], speak() {}, cancel() {}, addEventListener() {} },
  SpeechSynthesisUtterance: function () { return {} },
  document: {
    querySelector: knoop, querySelectorAll: () => [], addEventListener() {},
    createElement: knoop, getElementById: knoop,
    body: { dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
    documentElement: { dataset: {}, style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} } },
    fonts: { check: () => true, ready: Promise.resolve() },
  },
  window: { scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  navigator: {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

const vinger = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

/* ------------------------------------------------------------------ 1. FSRS */
const fsrs = []
for (const pad of [
  [3, 3, 3, 3, 3, 3],
  [4, 4, 4, 4],
  [2, 2, 2, 2],
  [1, 1, 1],
  [3, 1, 3, 3, 1, 4],
  [4, 2, 3, 1, 3, 3, 3],
  [3, 3, 1, 2, 4, 3],
]) {
  let k = null
  const uit = []
  let dag = NU
  for (const g of pad) {
    k = O.FSRS.beoordeel(k, g, dag)
    uit.push({ g, s: k.s, d: k.d, due: k.due, herh: k.herh, missers: k.missers, dag })
    dag = k.due /* de volgende beurt valt op de dag dat hij aan de beurt is */
  }
  fsrs.push({ pad, uit })
}

const intervallen = [0.1, 0.5, 1, 2, 3.5, 7, 15, 40, 120, 400, 1095]
  .map((s) => ({ s, interval: O.FSRS.interval(s) }))
const ophaalbaar = []
for (const s of [1, 5, 20, 100]) {
  for (const d of [0, 1, 3, 7, 30, 365]) {
    ophaalbaar.push({ s, dagen: d, r: +O.FSRS.ophaalbaarheid(d, s).toFixed(10) })
  }
}

/* --------------------------------------------------- 2. antwoorden nakijken */
const nakijken = []
const gevallen = [
  ['kitab', ['kitāb']], ['kitāb', ['kitāb']], ['KITAB', ['kitāb']], [' kitab ', ['kitāb']],
  ['kitab.', ['kitāb']], ['boek', ['kitāb']], ['maktaba', ['maktaba']],
  ["al-'ilm", ['al-ʿilm']], ['alilm', ['al-ʿilm']],
  ['كتاب', ['كِتَاب']], ['كِتَاب', ['كِتَاب']], ['كتٰب', ['كِتَاب']],
  ['الكتاب', ['الْكِتَاب']], ['أحمد', ['احمد']], ['احمد', ['أحمد']],
  ['على', ['علي']], ['مسئول', ['مسؤول']],
  ['', ['kitāb']], ['huis', ['huis', 'woning']], ['woning', ['huis', 'woning']],
  ['hond', ['huis', 'woning']],
]
for (const [gegeven, juist] of gevallen) {
  nakijken.push({
    gegeven, juist,
    klopt: O.antwoordKlopt(gegeven, juist),
    nl: O.normNl(gegeven), ar: O.normAr(gegeven),
  })
}
const kaalGevallen = ['كِتَابٌ', 'الْحَمْدُ', 'مُحَمَّدْ', 'بِسْمِ اللَّهِ', 'كتاب']
  .map((s) => ({ in: s, uit: O.ontdoeTashkil(s) }))

/* ----------------------------------------------------------- 3. de letters */
const vormen = O.LETTERS.map((l) => ({ l: l.l, ...O.letterVormen(l.l) }))
const arInGevallen = [
  'Het woord <b>كِتَاب</b> betekent boek.',
  'Zeg: السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
  'Geen Arabisch hier.',
].map((s) => ({ in: s, uit: O.arIn(s) }))

/* ------------------------------------------------------------ 4. de stof */
const stof = {
  letters: O.LETTERS.map((l) => ({ l: l.l, vinger: vinger(l) })),
  tekens: O.TEKENS.map((t) => ({ vinger: vinger(t) })),
  extra: O.EXTRA_TEKENS.map((t) => ({ vinger: vinger(t) })),
  woorden: O.WOORDEN.map((w) => ({ s: w.s, vinger: vinger(w) })),
  grammatica: O.GRAMMATICA.map((g) => ({ id: g.id, sp: g.sp, oef: g.oef.length, vinger: vinger(g) })),
  zinnen: O.ZINNEN.map((z) => ({ n2: z.n2, vinger: vinger(z) })),
  teksten: O.TEKSTEN.map((t) => ({ vinger: vinger(t) })),
  koran: O.KORAN100.map((k) => ({ vinger: vinger(k) })),
  jaar: O.JAAR.map((w) => ({ n: w.n, vinger: vinger(w) })),
  blokken: O.BLOKKEN, sessie: O.SESSIE, sessieminuten: O.SESSIEMINUTEN,
  meting: O.METING.map((m) => ({ vinger: vinger(m) })),
  metingniveaus: O.METINGNIVEAUS,
  spoornaam: O.SPOORNAAM, spoorleeftijd: O.SPOORLEEFTIJD,
}

/* -------------------------------------------------- 5. sporen en kaartlijst */
const sporen = [5, 7, 9, 10, 12, 13, 15, 16, 40].map((l) => ({ leeftijd: l, spoor: O.spoorBijLeeftijd(l) }))
const kaartlijsten = []
for (const spoor of [1, 2, 3, 4]) {
  O.P = { spoor, kaarten: {}, dagdoel: 40 }
  const ids = O.alleKaartIds()
  kaartlijsten.push({ spoor, aantal: ids.length, eerste: ids.slice(0, 8), vinger: vinger(ids) })
}

/* De wachtrij met dagplafond: langst wachtend eerst. */
const rijen = []
{
  O.P = {
    spoor: 2, dagdoel: 3,
    kaarten: {
      a: { due: '2026-08-10' }, b: { due: '2026-08-22' }, c: { due: '2026-08-01' },
      d: { due: '2026-08-19' }, e: { due: '2026-09-01' }, f: { due: '2026-08-15' },
    },
  }
  for (const plafond of [null, 2, 10]) {
    const r = O.herhalingsRij(plafond)
    rijen.push({ plafond, ids: r.rij.map((x) => x.id), totaal: r.totaal, gebruikt: r.plafond })
  }
}

/* ------------------------------------------------------------- 6. het pad */
const paden = [1, 2, 3, 4].map((spoor) => ({
  spoor,
  stappen: O.bouwPad(spoor).map((s) => ({
    k: s.k, titel: s.titel,
    n: s.items ? s.items.length : (s.letters ? s.letters.length : 1),
  })),
}))

/* De vocalisatie: vol, kaal, of alleen waar het woord anders dubbelzinnig is. */
const vocalisaties = []
for (const zin of ['كِتَابٌ جَدِيدٌ', 'الْعِلْمُ نُورٌ', 'بَيْتٌ كَبِيرٌ', 'دَرَسَ الطَّالِبُ']) {
  for (const stand of ['vol', 'kaal', 'selectief']) {
    O.P = { voorkeur: { vocalisatie: stand } }
    vocalisaties.push({ zin, stand, uit: O.vocaliseer(zin) })
  }
}

/* -------------------------------------------------------- 7. samenvoegen */
const paren = [
  [{}, {}],
  [{ profielen: { p: { punten: 40, blok: 2, kaarten: {}, dagen: {}, letters: {}, spelrecords: {}, voorkeur: { a: 1 } } } },
   { profielen: { p: { punten: 10, blok: 5, kaarten: {}, dagen: {}, letters: {}, spelrecords: {}, voorkeur: { b: 2 } } } }],
  [{ profielen: { p: { kaarten: { k: { laatst: '2026-08-01', s: 5 } }, dagen: {}, letters: {}, spelrecords: {}, voorkeur: {} } } },
   { profielen: { p: { kaarten: { k: { laatst: '2026-08-10', s: 2 } }, dagen: {}, letters: {}, spelrecords: {}, voorkeur: {} } } }],
  [{ profielen: { p: { kaarten: {}, dagen: { '2026-08-01': { blokken: 2, herhaald: 10, goed: 8, fout: 2 } }, letters: {}, spelrecords: {}, voorkeur: {} } } },
   { profielen: { p: { kaarten: {}, dagen: { '2026-08-01': { blokken: 1, herhaald: 30, goed: 4, fout: 9 } }, letters: {}, spelrecords: {}, voorkeur: {} } } }],
  [{ profielen: { a: { kaarten: {}, dagen: {}, letters: {}, spelrecords: {}, voorkeur: {} } }, actief: 'a' },
   { profielen: { b: { kaarten: {}, dagen: {}, letters: {}, spelrecords: {}, voorkeur: {} } }, actief: 'b' }],
]
const samen = paren.map(([a, b]) => ({ a, b, uit: O.samenvoegen(a, b) }))

/* ----------------------------------------------------------- 7. de datums */
const datums = ['2026-01-01', '2026-08-22', '2026-12-31', '2027-02-28']
  .map((d) => ({ d, nl: O.datumNL(d), plus7: O.plusDagen(d, 7), plusMin3: O.plusDagen(d, -3) }))
const verschillen = [
  ['2026-08-01', '2026-08-22'], ['2026-08-22', '2026-08-01'],
  ['2026-02-28', '2026-03-01'], ['2026-12-31', '2027-01-01'],
].map(([a, b]) => ({ a, b, n: O.dagVerschil(a, b) }))

const uit = {
  gemaakt: 'gereedschap/arabisch-gouden-waarden.mjs, uit gereedschap/oud/arabisch-index.html',
  nu: NU, fsrs, intervallen, ophaalbaar, nakijken, kaalGevallen, vormen, arInGevallen,
  stof, sporen, kaartlijsten, rijen, paden, vocalisaties, samen, datums, verschillen,
}
fs.writeFileSync('src/arabisch/gouden-waarden.json', JSON.stringify(uit, null, 1) + '\n')
console.log(`${fsrs.length} FSRS-reeksen, ${nakijken.length} antwoorden, ${stof.woorden.length} woorden — src/arabisch/gouden-waarden.json`)
process.exit(0)
