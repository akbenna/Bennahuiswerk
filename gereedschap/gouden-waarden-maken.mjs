#!/usr/bin/env node
/**
 * GOUDEN WAARDEN UIT DE OUDE REKENKERN
 *
 * De oude app verdwijnt, maar zijn uitkomsten mogen niet verdwijnen. Dit script
 * draait de rekenkern uit gereedschap/oud/health-index.html — de versie die tegen
 * literatuur is verantwoord en maanden heeft gedraaid — over een reeks
 * verzonnen maar vaste gevallen, en legt de uitkomsten vast.
 *
 * rekenkern.proef.ts controleert daarna de TypeScript-versie tegen dit
 * bestand. Zo is de overzetting geen belofte maar een controleerbaar feit, ook
 * nadat het oude bestand weg is.
 *
 *   node gereedschap/gouden-waarden-maken.mjs
 */
import fs from 'node:fs'
import vm from 'node:vm'

const html = fs.readFileSync('gereedschap/oud/health-index.html', 'utf8')
let js = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
js += `
globalThis.__ = { analyse, bmr, eiwitReferentie, regressie, trendReeks,
                  score2, fib4, stopbangScore, onderhoudZone, vandaag, KCAL_PER_KG, VENSTER };`

const el = () => ({ set innerHTML(_v) {}, value: '', onkeydown: null, textContent: '',
                    dataset: {}, remove() {}, setAttribute() {} })
const ctx = {
  console, navigator: {}, addEventListener() {},
  localStorage: { getItem: () => null, setItem() {} },
  document: { querySelector: () => el(), querySelectorAll: () => [], body: { insertAdjacentHTML() {} } },
  window: { scrollTo() {} },
  fetch: async () => ({ ok: true, json: async () => ({}) }),
}
ctx.globalThis = ctx
vm.createContext(ctx)
vm.runInContext(js, ctx)
const O = ctx.__

/* Vaste pseudo-toevalsgetallen: een proef die elke keer andere gevallen pakt
   is geen proef maar een loterij. */
let zaad = 20260822
const kans = () => (zaad = (zaad * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
const tussen = (a, b) => a + kans() * (b - a)

const VANDAAG = O.vandaag()
const dagTerug = (n) => {
  const d = new Date(VANDAAG + 'T12:00:00')
  d.setDate(d.getDate() - n)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Een geval: een profiel plus een reeks dagen met gewicht, energie en stappen. */
function maakGeval(i) {
  const profiel = {
    lengte_cm: Math.round(tussen(155, 200)),
    leeftijd_jaar: Math.round(tussen(25, 68)),
    geslacht: kans() < 0.5 ? 'm' : 'v',
    start_gewicht_kg: Math.round(tussen(70, 140)),
    doel_gewicht_kg: Math.round(tussen(60, 110)),
    tempo_pct_week: Math.round(tussen(30, 110)) / 100,
    eiwit_g_per_kg: Math.round(tussen(100, 180)) / 100,
    fase: 'afvallen',
    onderhoud_basis_kg: Math.round(tussen(70, 110)),
    instellingen: {},
  }
  // Hoeveel dagen er zijn, en hoe vol ze zitten, verschilt per geval: dat is
  // waar de drempels van het model (7, 12, 18 punten) op reageren.
  const nDagen = [0, 5, 9, 14, 21, 34, 40][i % 7]
  const wegKans = [0, 0.35, 0.6, 0.85, 1][i % 5]
  const logKans = [0, 0.4, 0.7, 0.95, 1][(i + 2) % 5]
  const helling = tussen(-0.12, 0.04)          // kg per dag
  const basisGewicht = profiel.start_gewicht_kg

  const dagen = {}
  for (let n = nDagen - 1; n >= 0; n--) {
    const k = dagTerug(n)
    /* Ontbrekende waarden staan er als null en niet als een ontbrekende sleutel.
       Dat is geen kosmetiek: JSON kan `undefined` niet vasthouden, dus anders
       zou de gouden waarde het verschil tussen "niet gewogen" en "veld bestaat
       niet" verliezen — precies het verschil waar dit bestand over gaat. */
    const d = { datum: k, gewicht_kg: null, stappen: null, _kcal: 0, _eiwit: 0, _laag: 0, _hoog: 0 }
    if (kans() < wegKans) {
      d.gewicht_kg = Math.round((basisGewicht + helling * (nDagen - n) + tussen(-0.9, 0.9)) * 10) / 10
    }
    if (kans() < logKans) {
      // af en toe een onvolledige dag onder 1200: die hoort apart geteld te worden
      d._kcal = kans() < 0.15 ? Math.round(tussen(300, 1150)) : Math.round(tussen(1250, 3400))
      d._eiwit = Math.round(tussen(40, 190))
    }
    if (kans() < 0.8) d.stappen = Math.round(tussen(1200, 16000))
    dagen[k] = d
  }
  return { profiel, dagen }
}

const gevallen = []
for (let i = 0; i < 40; i++) {
  const { profiel, dagen } = maakGeval(i)
  gevallen.push({ profiel, dagen, analyse: O.analyse(dagen, profiel), trend: O.trendReeks(dagen) })
}

/* De klinische modules apart: die hangen niet aan de dagenreeks. */
const score2 = []
for (let i = 0; i < 30; i++) {
  const inv = {
    leeftijd: Math.round(tussen(35, 75)),
    rook: kans() < 0.4,
    sbd: Math.round(tussen(105, 185)),
    tc: Math.round(tussen(35, 85)) / 10,
    hdl: Math.round(tussen(7, 22)) / 10,
    dm: kans() < 0.3,
  }
  const geslacht = kans() < 0.5 ? 'm' : 'v'
  score2.push({ geslacht, invoer: inv, uit: O.score2({ geslacht }, inv) })
}

const fib4 = []
for (let i = 0; i < 20; i++) {
  const inv = {
    leeftijd: Math.round(tussen(30, 80)),
    asat: Math.round(tussen(10, 120)),
    alat: Math.round(tussen(10, 140)),
    trombo: Math.round(tussen(60, 400)),
  }
  fib4.push({ invoer: inv, uit: O.fib4(inv) })
}

const stopbang = []
const sleutels = ['snurken', 'moe', 'apneu', 'bloeddruk', 'bmi', 'leeftijd', 'nek', 'man']
for (let i = 0; i < 25; i++) {
  const a = {}
  for (const s of sleutels) if (kans() < 0.5) a[s] = true
  stopbang.push({ invoer: a, uit: O.stopbangScore(a) })
}

const onderhoud = []
for (let i = 0; i < 15; i++) {
  const t = Math.round(tussen(70, 120) * 10) / 10
  const b = Math.round(tussen(70, 120) * 10) / 10
  onderhoud.push({ trend: t, basis: b, uit: O.onderhoudZone(t, b) })
}

const uit = {
  _toelichting:
    'Uitkomsten van de rekenkern uit de oude kalibratie/index.html, de versie ' +
    'die in VERANTWOORDING.md tegen literatuur is verantwoord. Gemaakt met ' +
    'gereedschap/gouden-waarden-maken.mjs. rekenkern.proef.ts controleert de ' +
    'TypeScript-versie hiertegen. Niet met de hand bewerken.',
  _gemaakt_op: VANDAAG,
  _peildag: VANDAAG,
  constanten: { KCAL_PER_KG: O.KCAL_PER_KG, VENSTER: O.VENSTER },
  gevallen, score2, fib4, stopbang, onderhoud,
}
fs.mkdirSync('src/health', { recursive: true })
fs.writeFileSync('src/health/gouden-waarden.json', JSON.stringify(uit, null, 1))
console.log(`geschreven: ${gevallen.length} analyses, ${score2.length} score2, ` +
            `${fib4.length} fib4, ${stopbang.length} stopbang, ${onderhoud.length} onderhoud`)
console.log(`peildag: ${VANDAAG}`)
