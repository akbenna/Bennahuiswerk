#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT DE OUDE COMPUTERS & CODE
 *
 * Hier zit de zwaarste overzetting van de hele verbouwing: MINIPY, een kleine
 * Python van zevenhonderd regels die in de browser draait. Niet de taal is het
 * kwetsbare deel maar de fóutmeldingen — "regel 3: je bent de dubbele punt
 * vergeten" is het halve onderwijs, en een overzetting die per ongeluk het
 * regelnummer één opschuift of "de naam x kent Python nog niet" anders
 * formuleert, is stiller kapot dan een die niet start.
 *
 * Daarom draait dit script de óude vertaler over een corpus programma's en legt
 * per programma vast wat er precies uitkwam: de uitvoer regel voor regel, en bij
 * een fout het regelnummer, de melding en de tip, woord voor woord.
 *
 * Het corpus komt uit twee bronnen. De eerste is de app zelf: elk voorbeeld en
 * elke startcode uit de drieëntwintig Python-lessen, want dat is precies de code
 * die een kind te zien krijgt. De tweede staat hieronder met de hand: één
 * programma per foutmelding, want juist de foutpaden worden nooit per ongeluk
 * geraakt.
 *
 * Verder gaan de puntentelling, de rangen, de insignes, het samenvoegen en de
 * bouwbank erdoorheen — dat laatste omdat een verkeerd overgezette wattberekening
 * een kind een voeding laat kiezen die niet past.
 *
 *   node gereedschap/bunyan-gouden-waarden.mjs
 */
process.env.TZ = 'UTC'
import fs from 'node:fs'
import vm from 'node:vm'

const NU = '2026-08-22'
const KLOK = Date.parse(NU + 'T10:00:00Z')

const html = fs.readFileSync('gereedschap/oud/bunyan-index.html', 'utf8')
const blok = html.match(/<script>([\s\S]*)<\/script>/)[1]
/* Alles vanaf de opstart is scherm en netwerk; wat daarvóór staat zijn de
   definities. */
let js = blok.replace(/\n\(async function\s*\(\)\s*\{[\s\S]*$/, '')

js += `
globalThis.__ = {
  MINIPY, CODE, PC, DELEN, DEELNAMEN, GAMES, SCHERMEN,
  RANGEN, XP, INSIGNES, rangVan, volgendeRang,
  samenvoegen, leegS, afgerond, verdien, logDag, reeksBij, insigne, blokInsignes,
  weekNr, nieuweWeek, dag, datum, euro,
  ALLEBLOKKEN, ALLELESSEN, blokVan, lesVan, spoorVan, af, blokAf, blokGedaan, volgendeLes,
  deelById, bouwPrijs, bouwWatt, bouwFouten, fpsVan,
  get S(){return S}, set S(v){S=v},
  get bouw(){return bouw}, set bouw(v){bouw=v},
};`

const knoop = () => new Proxy({ dataset: {}, style: {}, files: [], value: '' }, {
  get: (d, k) => (k in d ? d[k] : (k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false } : () => {})),
  set: (d, k, v) => ((d[k] = v), true),
})
class VasteDatum extends Date {
  constructor(...a) { super(...(a.length ? a : [KLOK])) }
  static now() { return KLOK }
}
const ctx = {
  console, Date: VasteDatum, Math, JSON, Object, Array, String, Number, Set, Map, Boolean, Error, Proxy,
  isNaN, parseInt, parseFloat,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    querySelector: knoop, querySelectorAll: () => [], addEventListener() {},
    createElement: knoop, body: { dataset: {}, classList: { add() {}, remove() {} } },
  },
  window: { scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  navigator: {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

/* ---------------------------------------------------------------- 1. MINIPY */

/* Elk voorbeeld en elke startcode uit de Python-lessen: dat is precies de code
   die op het scherm van een kind terechtkomt. */
const uitDeLes = []
for (const b of O.CODE) {
  for (const l of b.lessen) {
    const taal = l.opdracht?.taal ?? 'py'
    if (taal !== 'py') continue
    /* De app geeft het invoervak als één tekst door en knipt hem op regels;
       dat moet hier precies zo, anders draait het corpus iets anders dan wat
       het kind ziet. */
    const inv = String(l.opdracht?.invoer ?? '').split('\n').filter((x) => x.length)
    if (l.voorbeeld) uitDeLes.push({ naam: `${l.id} voorbeeld`, bron: l.voorbeeld, invoer: inv })
    if (l.opdracht?.oplossing) uitDeLes.push({ naam: `${l.id} oplossing`, bron: l.opdracht.oplossing, invoer: inv })
    if (l.opdracht?.start) uitDeLes.push({ naam: `${l.id} start`, bron: l.opdracht.start, invoer: inv })
  }
}

/* En met de hand: één programma per foutmelding en per taalonderdeel, in
   gereedschap/bunyan-python-corpus.txt. Wat daar niet in staat, is niet
   getoetst. Elk programma begint met een regel `### naam`, en daarachter mag
   `| invoer: a | b` staan voor wat er in het invoervak zou staan. */
function leesCorpus(pad) {
  const uit = []
  let nu = null
  for (const rij of fs.readFileSync(pad, 'utf8').split('\n')) {
    const kop = rij.match(/^### (.+)$/)
    if (kop) {
      const [naam, ...rest] = kop[1].split('|').map((x) => x.trim())
      const inv = rest.find((x) => x.startsWith('invoer:'))
      nu = { naam, invoer: inv ? inv.slice(7).split(';').map((x) => x.trim()) : [], rijen: [] }
      uit.push(nu)
      continue
    }
    if (nu) nu.rijen.push(rij)
  }
  return uit.map((p) => ({ naam: p.naam, invoer: p.invoer, bron: p.rijen.join('\n').replace(/\n+$/, '') }))
}
const metDeHand = leesCorpus('gereedschap/bunyan-python-corpus.txt')

const programmas = [...uitDeLes, ...metDeHand]
const python = programmas.map((p) => {
  const r = O.MINIPY.draai(p.bron, { invoer: (p.invoer ?? []).slice(), zaad: 12345 })
  return {
    naam: p.naam,
    bron: p.bron,
    invoer: p.invoer ?? [],
    uit: { ok: r.ok, uit: r.uit, regel: r.regel ?? null, fout: r.fout ?? null, tip: r.tip ?? null },
  }
})

/* -------------------------------------------------------- 2. punten en rangen */
const rangen = []
for (const p of [0, 1, 99, 100, 250, 499, 500, 1200, 2500, 5000, 99999]) {
  const r = O.rangVan(p)
  const v = O.volgendeRang(p)
  rangen.push({ punten: p, rang: r, volgende: v })
}

/* Hele reeksen afgeronde lessen: de punten, de dagreeks en de insignes die
   daarbij horen. `afgerond` verandert S, dus elk pad begint schoon. */
const paden = [
  { naam: 'eerste les, perfect', stappen: [['c1-1', 100, 'les']] },
  { naam: 'eerste les, half', stappen: [['c1-1', 50, 'les']] },
  { naam: 'blok c1 helemaal', stappen: O.CODE[0].lessen.map((l) => [l.id, 100, 'les']) },
  { naam: 'een project', stappen: [['c1-1', 100, 'les'], ['c1-2', 80, 'project']] },
  { naam: 'les twee keer', stappen: [['c1-1', 100, 'les'], ['c1-1', 100, 'les']] },
]
const voortgang = paden.map((pad) => {
  O.S = O.leegS()
  const stappen = pad.stappen.map(([id, score, soort]) => {
    O.afgerond(id, score, soort)
    return {
      id, score, soort,
      punten: O.S.punten, saldo: O.S.saldo, reeks: O.S.reeks,
      insignes: [...(O.S.insignes ?? [])].sort(),
      lessen: Object.keys(O.S.lessen).sort(),
    }
  })
  return { naam: pad.naam, stappen }
})

/* ------------------------------------------------------------ 3. samenvoegen */
const paren = [
  [{}, {}],
  [{ punten: 40, saldo: 3 }, { punten: 120, saldo: 1 }],
  [{ lessen: { 'c1-1': { af: true, score: 60 } } }, { lessen: { 'c1-1': { af: true, score: 100 } } }],
  [{ lessen: { 'c1-1': { af: true, score: 100 } } }, { lessen: { 'c1-2': { af: true, score: 80 } } }],
  [{ insignes: ['a', 'b'] }, { insignes: ['b', 'c'] }],
  [{ reeks: 5, laatsteDag: 20000 }, { reeks: 2, laatsteDag: 20010 }],
  [{ bouw: { cpu: 'r5-5600' } }, { bouw: { cpu: 'i5-12400', gpu: 'rtx4060' } }],
]
/* Beide kanten eerst aanvullen tot een volledige momentopname. Zo werkt de app
   ook — wat er van een toestel binnenkomt gaat door leegS() heen — en het oude
   samenvoegen rekende met kale objecten een NaN-saldo uit dat in het echt nooit
   voorkomt. */
const vol = (o) => Object.assign(O.leegS(), o)
const samen = paren.map(([a, b]) => ({ a, b, uit: O.samenvoegen(vol(a), vol(b)) }))

/* -------------------------------------------------------------- 4. de bouwbank */
const bouwsels = [
  {},
  /* halve bouw: de fouten moeten dan zwijgen over wat er nog niet is */
  { cpu: 'r5-5600', mobo: 'b550' },
  /* kloppende budgetbouw */
  { cpu: 'r5-5600', mobo: 'b550', gpu: 'rx6600', ram: 'd4-16', opslag: 'nvme1', psu: 'w450', kast: 'matx' },
  /* verkeerde socket: AM4-processor op een AM5-bord */
  { cpu: 'r5-5600', mobo: 'b650', gpu: 'rx6600', ram: 'd5-16', opslag: 'nvme1', psu: 'w450', kast: 'atx' },
  /* verkeerd geheugen: DDR4 op een DDR5-bord */
  { cpu: 'r5-7600', mobo: 'b650', gpu: 'rtx4060', ram: 'd4-16', opslag: 'nvme1', psu: 'w650', kast: 'atx' },
  /* te kleine voeding en een kast die te klein is voor het bord */
  { cpu: 'i5-14600', mobo: 'b760', gpu: 'rtx4080', ram: 'd5-32', opslag: 'nvme2', psu: 'w450', kast: 'itx' },
  /* alles het duurste */
  { cpu: 'r7-7800', mobo: 'b650', gpu: 'rtx4080', ram: 'd5-32', opslag: 'nvme2', psu: 'w1000', kast: 'atx' },
  /* zonder losse videokaart */
  { cpu: 'r5-7600', mobo: 'b650', gpu: 'geen', ram: 'd5-16', opslag: 'sata1', psu: 'w450', kast: 'itx' },
  /* zuinig ITX-systeem */
  { cpu: 'r5-7600', mobo: 'b650i', gpu: 'rtx4060', ram: 'd5-16', opslag: 'nvme1', psu: 'w650', kast: 'itx' },
]
const bank = bouwsels.map((b) => {
  O.bouw = { budget: 900, scherm: '1080', ...b }
  const fps = {}
  for (const g of O.GAMES) {
    for (const s of O.SCHERMEN) fps[`${g.id}@${s.id}`] = O.fpsVan(g, s.id)
  }
  return { bouw: b, prijs: O.bouwPrijs(), watt: O.bouwWatt(), fouten: O.bouwFouten(), fps }
})

/* --------------------------------------------------------------- 5. de stof */
const stof = {
  code: O.CODE.map((b) => ({
    id: b.id, n: b.n, u: b.u,
    lessen: b.lessen.map((l) => ({
      id: l.id, t: l.t, d: l.d,
      uitleg: l.uitleg.length,
      taal: l.opdracht?.taal ?? 'py',
      vragen: (l.vragen ?? []).map((v) => ({ j: v.j, opties: v.o.length })),
    })),
  })),
  pc: O.PC.map((b) => ({
    id: b.id, n: b.n, u: b.u,
    lessen: b.lessen.map((l) => ({
      id: l.id, t: l.t, d: l.d,
      uitleg: l.uitleg.length,
      vragen: (l.vragen ?? []).map((v) => ({ j: v.j, opties: v.o.length })),
    })),
  })),
  delen: Object.fromEntries(Object.entries(O.DELEN).map(([k, v]) => [k, v.map((x) => x.id)])),
  games: O.GAMES.map((g) => g.id),
  schermen: O.SCHERMEN.map((s) => s.id),
}

const uit = {
  gemaakt: 'gereedschap/bunyan-gouden-waarden.mjs, uit gereedschap/oud/bunyan-index.html',
  nu: NU, xp: O.XP, rangenTabel: O.RANGEN, insignesTabel: O.INSIGNES,
  python, rangen, voortgang, samen, bank, stof,
}
fs.writeFileSync('src/bunyan/gouden-waarden.json', JSON.stringify(uit, null, 1) + '\n')
const fouten = python.filter((p) => !p.uit.ok).length
console.log(`${python.length} programma's (${fouten} met een foutmelding), ${bank.length} bouwsels — src/bunyan/gouden-waarden.json`)
