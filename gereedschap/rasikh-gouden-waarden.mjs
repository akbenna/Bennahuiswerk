#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT DE OUDE HERHALINGSPLANNER
 *
 * Dezelfde aanpak als bij de rekenkern van kalibratie, en om dezelfde reden:
 * de planner van Rasikh stuurt een reeks van jaren aan, en een fout daarin is
 * pas over maanden zichtbaar. Een overzetting naar TypeScript controleer je dus
 * niet tegen wat je dénkt dat eruit moet komen, maar tegen wat er wérkelijk
 * uitkwam.
 *
 * Dit script draait de functies uit gereedschap/oud/rasikh-index.html over een
 * reeks vaste gevallen en legt de uitkomsten vast in
 * src/rasikh/gouden-waarden.json.
 *
 *   node gereedschap/rasikh-gouden-waarden.mjs
 */
import fs from 'node:fs'
import vm from 'node:vm'

const html = fs.readFileSync('gereedschap/oud/rasikh-index.html', 'utf8')
let js = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
/* De laatste regel start de app; die knippen we eraf. Wat overblijft zijn de
   definities. En S en INDEX zijn let-bindingen, dus die gaan via een brug. */
js = js.replace(/\(async function\(\)\{[\s\S]*$/, '')
js += `
globalThis.__ = {
  get S(){return S}, set S(v){S=v},
  get INDEX(){return INDEX}, set INDEX(v){INDEX=v},
  leegS, samenvoegen, SAMEN, beoordeel, zetVast, dueLijst, plan, gezond,
  soeraStand, doelSoeras, doelTotaal, doelVast, inDoel, REEKS, dag, sleutel,
};`

const ctx = {
  console, navigator: {}, addEventListener() {}, fetch: async () => ({ ok: false }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    querySelector: () => ({ addEventListener() {}, innerHTML: '', textContent: '', style: {} }),
    querySelectorAll: () => [], addEventListener() {}, createElement: () => ({}),
  },
  window: { scrollTo() {}, addEventListener() {} },
  Audio: function Audio() { return { play: () => Promise.resolve(), pause() {} } },
  URL: { createObjectURL: () => '' },
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

/* Vaste pseudo-toevalsgetallen. */
let zaad = 20260822
const kans = () => (zaad = (zaad * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
const tussen = (a, b) => a + kans() * (b - a)
const heel = (a, b) => Math.round(tussen(a, b))

/* Een verkleinde index: tien soera's met een bekend aantal aya's. Het gaat om
   de planning, niet om de echte tekst. */
const INDEX = [
  { nr: 78, naam: 'an-Naba', ar: '', aya: 40, plaats: 'Mekka', juz: 30 },
  { nr: 93, naam: 'ad-Duha', ar: '', aya: 11, plaats: 'Mekka', juz: 30 },
  { nr: 103, naam: 'al-Asr', ar: '', aya: 3, plaats: 'Mekka', juz: 30 },
  { nr: 108, naam: 'al-Kawthar', ar: '', aya: 3, plaats: 'Mekka', juz: 30 },
  { nr: 110, naam: 'an-Nasr', ar: '', aya: 3, plaats: 'Medina', juz: 30 },
  { nr: 112, naam: 'al-Ikhlas', ar: '', aya: 4, plaats: 'Mekka', juz: 30 },
  { nr: 113, naam: 'al-Falaq', ar: '', aya: 5, plaats: 'Mekka', juz: 30 },
  { nr: 114, naam: 'an-Nas', ar: '', aya: 6, plaats: 'Mekka', juz: 30 },
  { nr: 55, naam: 'ar-Rahman', ar: '', aya: 78, plaats: 'Medina', juz: 27 },
  { nr: 67, naam: 'al-Mulk', ar: '', aya: 30, plaats: 'Mekka', juz: 29 },
]
O.INDEX = INDEX

const VANDAAG = O.dag()

/** Een stand met een willekeurige maar vaste voortgang. */
function maakStand(i) {
  const s = O.leegS()
  s.instel.minuten = [10, 15, 25, 45, 60][i % 5]
  s.instel.maxNieuw = [1, 2, 3, 5, 8][(i + 1) % 5]
  s.instel.volgorde = ['kort', 'achter', 'voor'][i % 3]
  s.instel.doelVan = [78, 103, 112, 55][i % 4]
  s.instel.doelTot = 114
  const hoeveel = [0, 1, 5, 20, 60][i % 5]
  const soeras = INDEX.slice()
  let gezet = 0
  for (const so of soeras) {
    for (let n = 1; n <= so.aya && gezet < hoeveel; n++, gezet++) {
      const t = { stap: heel(0, 8), vast: true, reeks: [], zwak: heel(0, 4) }
      const hoeveelReeks = heel(0, 6)
      for (let k = 0; k < hoeveelReeks; k++) t.reeks.push(heel(1, 3))
      t.laatst = VANDAAG - heel(0, 40)
      t.due = t.laatst + heel(0, 60)
      t.begonnen = t.laatst - heel(0, 100)
      s.aya[so.nr + ':' + n] = t
    }
  }
  return s
}

const gevallen = []
for (let i = 0; i < 30; i++) {
  const s = maakStand(i)
  O.S = s
  const p = O.plan()
  gevallen.push({
    stand: s,
    plan: { nieuw: p.nieuw, reden: p.reden, herhaalTijd: p.herhaalTijd, budget: p.budget,
            rest: p.rest, due: p.due.map((d) => d.id) },
    doelTotaal: O.doelTotaal(),
    doelVast: O.doelVast(),
    doelSoeras: O.doelSoeras().map((x) => x.nr),
    gezond: Object.fromEntries(Object.keys(s.aya).map((id) => [id, O.gezond(id)])),
    soeraStand: Object.fromEntries(INDEX.map((x) => [x.nr, O.soeraStand(x.nr)])),
  })
}

/* Beoordelen en vastzetten los: dat zijn de twee schrijfbewerkingen. */
const beoordelingen = []
for (let i = 0; i < 40; i++) {
  const s = O.leegS()
  const id = '112:1'
  const heeft = i % 4 !== 0
  if (heeft) {
    s.aya[id] = {
      stap: heel(0, 8), vast: true, zwak: heel(0, 5),
      reeks: Array.from({ length: heel(0, 6) }, () => heel(1, 3)),
      laatst: VANDAAG - heel(1, 30), due: VANDAAG - heel(0, 10),
      begonnen: VANDAAG - heel(30, 200),
    }
  }
  O.S = s
  const cijfer = [1, 2, 3][i % 3]
  const voor = heeft ? JSON.parse(JSON.stringify(s.aya[id])) : null
  O.beoordeel(id, cijfer)
  beoordelingen.push({ voor, cijfer, na: s.aya[id] })
}

const vastzettingen = []
for (let i = 0; i < 10; i++) {
  const s = O.leegS()
  const id = '114:2'
  const heeft = i % 2 === 0
  if (heeft) s.aya[id] = { stap: 3, vast: false, reeks: [3, 3], zwak: 1, begonnen: VANDAAG - 50 }
  O.S = s
  const voor = heeft ? JSON.parse(JSON.stringify(s.aya[id])) : null
  O.zetVast(id)
  vastzettingen.push({ voor, na: s.aya[id] })
}

/* Het samenvoegen: het gevoeligste stuk. */
const samenvoegingen = []
for (let i = 0; i < 25; i++) {
  const a = maakStand(i)
  const b = maakStand(i + 7)
  a.instelD = ['2026-08-01T10:00:00Z', null, '2026-08-20T10:00:00Z'][i % 3]
  b.instelD = ['2026-08-15T10:00:00Z', '2026-07-01T10:00:00Z', null][i % 3]
  a.log = [{ d: '2026-08-20', nieuw: heel(0, 5), herhaald: heel(0, 30) },
           { d: '2026-08-21', nieuw: heel(0, 5), herhaald: heel(0, 30) }]
  b.log = [{ d: '2026-08-21', nieuw: heel(0, 5), herhaald: heel(0, 30) },
           { d: '2026-08-22', nieuw: heel(0, 5), herhaald: heel(0, 30) }]
  samenvoegingen.push({ a, b, uit: O.samenvoegen(a, b) })
}

const uit = {
  _toelichting:
    'Uitkomsten van de planner uit de oude gereedschap/oud/rasikh-index.html. ' +
    'Gemaakt met gereedschap/rasikh-gouden-waarden.mjs. planning.proef.ts en ' +
    'opslag.proef.ts controleren de TypeScript-versie hiertegen. Niet met de ' +
    'hand bewerken.',
  _peildag: VANDAAG,
  index: INDEX,
  reeks: O.REEKS,
  gevallen, beoordelingen, vastzettingen, samenvoegingen,
}
fs.mkdirSync('src/rasikh', { recursive: true })
fs.writeFileSync('src/rasikh/gouden-waarden.json', JSON.stringify(uit, null, 1))
console.log(`${gevallen.length} planningen, ${beoordelingen.length} beoordelingen, ` +
            `${vastzettingen.length} vastzettingen, ${samenvoegingen.length} samenvoegingen`)
console.log('peildag:', VANDAAG)
