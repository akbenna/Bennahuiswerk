/**
 * WISKUNDE A VOOR 5 VWO
 *
 * Wat er bij Amaani dun was, gemeten tegen de stof van 5 vwo: de normale
 * verdeling (drie opgaven, niets op niveau 1 of 3), de binomiale verdeling
 * (vier), de verwachtingswaarde (vier). Kansrekening en statistiek in het
 * algemeen stonden er al ruim in; dit zijn de hoofdstukken van 5 vwo zelf.
 * Differentiëren had wel opgaven, maar weinig over toppen en raaklijnen.
 *
 * Zes opgaven per onderwerp per niveau, zoals in `exact5vwo.ts`.
 *
 * KANSEN IN PROCENTEN
 *
 * De nakijker laat een absolute afwijking van 0,01 toe. Bij een kans van
 * 0,0228 is dan bijna elk antwoord goed. Daarom vraagt elke kansopgave hier om
 * procenten in twee decimalen (2,28 %), en dan is de tolerantie wél scherp.
 *
 * DE GETALLEN WORDEN UITGEREKEND
 *
 * De normale verdeling met `fi` (de erf-benadering van Abramowitz en Stegun,
 * afwijking kleiner dan 2·10⁻⁷) en `fiInv` (de benadering van Acklam), de
 * binomiale verdeling exact. `wiskundea5vwo.proef.ts` rekent een deel na met
 * waarden uit de tabel.
 */
import type { Opgave } from './soorten'
import { r4 } from './exact5vwo'

type Ruw = Omit<Opgave, 'id'>

/** De standaardnormale verdelingsfunctie. */
export function fi(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592)
    * t * Math.exp(-z * z / 2)
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

/** De inverse van `fi`, voor invNorm. */
export function fiInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const laag = 0.02425
  const [a0, a1, a2, a3, a4, a5] = a as [number, number, number, number, number, number]
  const [b0, b1, b2, b3, b4] = b as [number, number, number, number, number]
  const [c0, c1, c2, c3, c4, c5] = c as [number, number, number, number, number, number]
  const [d0, d1, d2, d3] = d as [number, number, number, number]
  if (p < laag) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) / ((((d0 * q + d1) * q + d2) * q + d3) * q + 1)
  }
  if (p > 1 - laag) return -fiInv(1 - p)
  const q = p - 0.5
  const r = q * q
  return (((((a0 * r + a1) * r + a2) * r + a3) * r + a4) * r + a5) * q
    / (((((b0 * r + b1) * r + b2) * r + b3) * r + b4) * r + 1)
}

const kans = (mu: number, sigma: number, x: number): number => fi((x - mu) / sigma)
const pct = (p: number): string => r4(p * 100)

export function nOverK(n: number, k: number): number {
  let u = 1
  for (let i = 1; i <= k; i++) u = u * (n - k + i) / i
  return u
}
export const binompdf = (n: number, p: number, k: number): number => nOverK(n, k) * p ** k * (1 - p) ** (n - k)
export function binomcdf(n: number, p: number, k: number): number {
  let s = 0
  for (let i = 0; i <= k; i++) s += binompdf(n, p, i)
  return s
}

const ja = ['ja', 'nee']
const PROCENT = 'Geef je antwoord in procenten, in twee decimalen.'

/* ========================================================= normale verdeling */

const NORMAAL: Ruw[] = [
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Lengtes zijn normaal verdeeld met μ = 170 cm en σ = 10 cm. Hoeveel procent ligt volgens de vuistregels tussen 160 en 180 cm?',a:'68',alt:['68,27','68,3'],u:'%',h:['160 en 180 liggen elk één σ van het gemiddelde.','Binnen 1σ: 68 %.'],s:'160 = μ − σ en 180 = μ + σ.\nBinnen één standaardafwijking: 68 %.'},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Lengtes zijn normaal verdeeld met μ = 170 cm en σ = 10 cm. Hoeveel procent ligt volgens de vuistregels tussen 150 en 190 cm?',a:'95',alt:['95,45','95,4'],u:'%',h:['Hoeveel σ ligt 150 van 170 af?'],s:'150 = μ − 2σ en 190 = μ + 2σ.\nBinnen twee standaardafwijkingen: 95 %.'},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Lengtes zijn normaal verdeeld met μ = 170 cm en σ = 10 cm. Hoeveel procent is volgens de vuistregels langer dan 180 cm?',a:'16',alt:['15,87','15,9'],u:'%',h:['Binnen 1σ ligt 68 %; de rest is aan twee kanten gelijk verdeeld.'],s:'Buiten 1σ ligt 100 − 68 = 32 %.\nDe helft daarvan boven: 16 %.'},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Lengtes zijn normaal verdeeld met μ = 170 cm en σ = 10 cm. Hoeveel procent is volgens de vuistregels korter dan 150 cm?',a:'2,5',alt:['2,28','2,3'],u:'%',h:['Buiten 2σ ligt 5 %, verdeeld over twee kanten.'],s:'Buiten 2σ ligt 100 − 95 = 5 %.\nDe helft aan de onderkant: 2,5 %.'},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Hoeveel procent van een normale verdeling ligt boven het gemiddelde?',a:'50',u:'%',h:['De normale verdeling is symmetrisch.'],s:'Symmetrisch rond μ: precies de helft ligt erboven, 50 %.'},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:1,q:'Hoeveel procent ligt volgens de vuistregels tussen μ − 3σ en μ + 3σ?',a:'99,7',u:'%',h:['De derde vuistregel: 68, 95, ...'],s:'68 % binnen 1σ, 95 % binnen 2σ, 99,7 % binnen 3σ.'},

  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Pakken suiker wegen gemiddeld 500 g, σ = 10 g, normaal verdeeld. Hoeveel procent weegt minder dan 480 g? ${PROCENT}`,a:pct(kans(500, 10, 480)),u:'%',h:['GR: normalcdf(ondergrens, bovengrens, μ, σ).','Ondergrens: een heel klein getal, zoals −10⁹⁹.'],s:`normalcdf(−10⁹⁹, 480, 500, 10) = ${r4(kans(500, 10, 480))}.\nDat is ${pct(kans(500, 10, 480))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Pakken suiker: μ = 500 g, σ = 10 g. Hoeveel procent weegt meer dan 515 g? ${PROCENT}`,a:pct(1 - kans(500, 10, 515)),u:'%',h:['normalcdf(515, 10⁹⁹, 500, 10).'],s:`normalcdf(515, 10⁹⁹, 500, 10) = ${r4(1 - kans(500, 10, 515))}.\nDat is ${pct(1 - kans(500, 10, 515))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Pakken suiker: μ = 500 g, σ = 10 g. Hoeveel procent weegt tussen 490 en 520 g? ${PROCENT}`,a:pct(kans(500, 10, 520) - kans(500, 10, 490)),u:'%',h:['normalcdf(490, 520, 500, 10).'],s:`normalcdf(490, 520, 500, 10) = ${r4(kans(500, 10, 520) - kans(500, 10, 490))}.\nDat is ${pct(kans(500, 10, 520) - kans(500, 10, 490))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Mannen in een land zijn gemiddeld 180 cm, σ = 7 cm. Hoeveel procent is langer dan 190 cm? ${PROCENT}`,a:pct(1 - kans(180, 7, 190)),u:'%',h:['normalcdf(190, 10⁹⁹, 180, 7).'],s:`normalcdf(190, 10⁹⁹, 180, 7) = ${r4(1 - kans(180, 7, 190))}.\nDat is ${pct(1 - kans(180, 7, 190))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Mannen: μ = 180 cm, σ = 7 cm. Hoeveel procent is tussen 170 en 185 cm? ${PROCENT}`,a:pct(kans(180, 7, 185) - kans(180, 7, 170)),u:'%',h:['normalcdf(170, 185, 180, 7).'],s:`normalcdf(170, 185, 180, 7) = ${r4(kans(180, 7, 185) - kans(180, 7, 170))}.\nDat is ${pct(kans(180, 7, 185) - kans(180, 7, 170))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,q:`Een machine vult pakken melk met gemiddeld 1000 mL, σ = 4 mL. Hoeveel procent bevat minder dan 990 mL? ${PROCENT}`,a:pct(kans(1000, 4, 990)),u:'%',h:['normalcdf(−10⁹⁹, 990, 1000, 4).'],s:`normalcdf(−10⁹⁹, 990, 1000, 4) = ${r4(kans(1000, 4, 990))}.\nDat is ${pct(kans(1000, 4, 990))} %.`},

  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:'Mannen: μ = 180 cm, σ = 7 cm. Boven welke lengte zit de langste 10 %? Rond af op twee decimalen.',a:r4(180 + fiInv(0.90) * 7),u:'cm',h:['De langste 10 %: links ervan ligt 90 %.','GR: invNorm(0,90, 180, 7).'],s:`invNorm(0,90, 180, 7) = ${r4(180 + fiInv(0.90) * 7)} cm.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:'Mannen: μ = 180 cm, σ = 7 cm. Onder welke lengte zit de kortste 5 %? Rond af op twee decimalen.',a:r4(180 + fiInv(0.05) * 7),u:'cm',h:['GR: invNorm(0,05, 180, 7).'],s:`invNorm(0,05, 180, 7) = ${r4(180 + fiInv(0.05) * 7)} cm.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:'Pakken wegen normaal verdeeld met σ = 10 g. Van de pakken weegt 20 % minder dan 500 g. Bereken het gemiddelde μ, in twee decimalen.',a:r4(500 - fiInv(0.20) * 10),u:'g',h:['Zoek eerst de z-waarde waaronder 20 % ligt: invNorm(0,20, 0, 1).','500 = μ + z · σ.'],s:`z = invNorm(0,20, 0, 1) = ${r4(fiInv(0.20))}.\n500 = μ + ${r4(fiInv(0.20))} × 10, dus μ = ${r4(500 - fiInv(0.20) * 10)} g.\n(Of op de GR met de solver: normalcdf(−10⁹⁹, 500, X, 10) = 0,20.)`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:'Een machine vult gemiddeld 1000 mL. Van de pakken bevat 2 % minder dan 990 mL. Bereken σ, in twee decimalen.',a:r4(-10 / fiInv(0.02)),u:'mL',h:['z = invNorm(0,02, 0, 1).','990 = 1000 + z · σ.'],s:`z = invNorm(0,02, 0, 1) = ${r4(fiInv(0.02))}.\n990 = 1000 + ${r4(fiInv(0.02))} · σ, dus σ = ${r4(-10 / fiInv(0.02))} mL.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:`Pakken: μ = 500 g, σ = 10 g. Een pak wordt afgekeurd als het minder dan 480 of meer dan 520 g weegt. Hoeveel procent wordt afgekeurd? ${PROCENT}`,a:pct(kans(500, 10, 480) + 1 - kans(500, 10, 520)),u:'%',h:['Twee staarten, en de verdeling is symmetrisch.'],s:`Onder 480: ${pct(kans(500, 10, 480))} %, boven 520 evenveel.\nSamen ${pct(kans(500, 10, 480) + 1 - kans(500, 10, 520))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:3,q:'Pakken: μ = 500 g, σ = 10 g. Hoeveel van 1000 pakken wegen naar verwachting minder dan 490 g? Rond af op één decimaal.',a:r4(1000 * kans(500, 10, 490)),h:['Eerst de kans, dan keer 1000.'],s:`P(X < 490) = ${r4(kans(500, 10, 490))}.\n1000 × ${r4(kans(500, 10, 490))} = ${r4(1000 * kans(500, 10, 490))} pakken.`},
]

/* ======================================================= binomiale verdeling */

const BINOMIAAL: Ruw[] = [
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:'X is binomiaal verdeeld met n = 10 en p = 0,5. Bereken de verwachtingswaarde E(X).',a:'5',h:['E(X) = n · p.'],s:'E(X) = 10 × 0,5 = 5.'},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:'X is binomiaal verdeeld met n = 20 en p = 0,3. Bereken E(X).',a:'6',h:['E(X) = n · p.'],s:'E(X) = 20 × 0,3 = 6.'},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:'Je gooit 10 keer met een dobbelsteen en telt het aantal zessen. Is dat aantal binomiaal verdeeld?',a:'ja',opties:ja,h:['Vaste n, twee uitkomsten (zes of niet), steeds dezelfde kans, onafhankelijk?'],s:'Ja: 10 onafhankelijke worpen, elk met kans 1/6 op een zes.'},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:'Je trekt zonder terugleggen 3 knikkers uit een vaas met 4 rode en 2 witte en telt de rode. Is dat aantal binomiaal verdeeld?',a:'nee',opties:ja,h:['Blijft de kans op rood bij elke trekking gelijk?'],s:'Nee: zonder terugleggen verandert de kans na elke trekking. Dat is het vaasmodel (hypergeometrisch).'},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:`Je gooit 4 keer een munt. Bereken de kans op 4 keer kop. ${PROCENT}`,a:pct(binompdf(4, 0.5, 4)),u:'%',h:['0,5 × 0,5 × 0,5 × 0,5.'],s:`0,5⁴ = ${r4(0.5 ** 4)}, dat is ${pct(0.5 ** 4)} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:1,q:`Je gooit 3 keer een munt. Bereken de kans op geen enkele keer kop. ${PROCENT}`,a:pct(binompdf(3, 0.5, 0)),u:'%',h:['Drie keer munt: 0,5³.'],s:`0,5³ = ${r4(0.5 ** 3)}, dat is ${pct(0.5 ** 3)} %.`},

  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:`X is binomiaal met n = 10 en p = 0,3. Bereken P(X = 3). ${PROCENT}`,a:pct(binompdf(10, 0.3, 3)),u:'%',h:['GR: binompdf(10, 0,3, 3).'],s:`binompdf(10, 0,3, 3) = ${r4(binompdf(10, 0.3, 3))}, dat is ${pct(binompdf(10, 0.3, 3))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:`X is binomiaal met n = 10 en p = 0,3. Bereken P(X ≤ 2). ${PROCENT}`,a:pct(binomcdf(10, 0.3, 2)),u:'%',h:['Hoogstens 2: binomcdf(10, 0,3, 2).'],s:`binomcdf(10, 0,3, 2) = ${r4(binomcdf(10, 0.3, 2))}, dat is ${pct(binomcdf(10, 0.3, 2))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:`10 % van de lampen is defect. Je pakt er 20. Bereken de kans dat er geen enkele defect is. ${PROCENT}`,a:pct(binompdf(20, 0.1, 0)),u:'%',h:['Alle 20 goed: 0,9²⁰.'],s:`0,9²⁰ = ${r4(0.9 ** 20)}, dat is ${pct(0.9 ** 20)} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:`10 % van de lampen is defect. Je pakt er 20. Bereken de kans dat er minstens één defect is. ${PROCENT}`,a:pct(1 - binompdf(20, 0.1, 0)),u:'%',h:['Minstens één = 1 − geen.'],s:`1 − 0,9²⁰ = ${r4(1 - 0.9 ** 20)}, dat is ${pct(1 - 0.9 ** 20)} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:'X is binomiaal met n = 50 en p = 0,2. Bereken de standaardafwijking, in twee decimalen.',a:r4(Math.sqrt(50 * 0.2 * 0.8)),h:['σ = √(n · p · (1 − p)).'],s:`σ = √(50 × 0,2 × 0,8) = √8 = ${r4(Math.sqrt(8))}.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:2,q:'X is binomiaal met n = 100 en p = 0,5. Bereken de standaardafwijking.',a:'5',h:['σ = √(n · p · (1 − p)).'],s:'σ = √(100 × 0,5 × 0,5) = √25 = 5.'},

  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:`X is binomiaal met n = 20 en p = 0,25. Bereken P(X ≥ 8). ${PROCENT}`,a:pct(1 - binomcdf(20, 0.25, 7)),u:'%',h:['Minstens 8 = 1 − hoogstens 7.','1 − binomcdf(20, 0,25, 7).'],s:`1 − binomcdf(20, 0,25, 7) = ${r4(1 - binomcdf(20, 0.25, 7))}, dat is ${pct(1 - binomcdf(20, 0.25, 7))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:`X is binomiaal met n = 15 en p = 0,6. Bereken P(5 ≤ X ≤ 10). ${PROCENT}`,a:pct(binomcdf(15, 0.6, 10) - binomcdf(15, 0.6, 4)),u:'%',h:['P(X ≤ 10) − P(X ≤ 4).','Let op: niet P(X ≤ 5) aftrekken, want 5 hoort erbij.'],s:`binomcdf(15, 0,6, 10) − binomcdf(15, 0,6, 4) = ${r4(binomcdf(15, 0.6, 10) - binomcdf(15, 0.6, 4))}, dat is ${pct(binomcdf(15, 0.6, 10) - binomcdf(15, 0.6, 4))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:`Een toets heeft 12 meerkeuzevragen met elk 4 opties. Je gokt alles. Bereken de kans op minstens 6 goed. ${PROCENT}`,a:pct(1 - binomcdf(12, 0.25, 5)),u:'%',h:['n = 12, p = 0,25.','Minstens 6 = 1 − hoogstens 5.'],s:`1 − binomcdf(12, 0,25, 5) = ${r4(1 - binomcdf(12, 0.25, 5))}, dat is ${pct(1 - binomcdf(12, 0.25, 5))} %.\nGokken loont dus niet.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:'Hoe vaak moet je minstens met een dobbelsteen gooien om met meer dan 90 % kans minstens één zes te krijgen?',a:String(Math.ceil(Math.log(0.1) / Math.log(5 / 6))),h:['P(minstens één zes) = 1 − (5/6)ⁿ.','Los op: 1 − (5/6)ⁿ > 0,9, met een tabel op de GR of met log.'],s:`(5/6)ⁿ < 0,1 geeft n > log(0,1) ÷ log(5/6) = ${r4(Math.log(0.1) / Math.log(5 / 6))}.\nDus minstens ${Math.ceil(Math.log(0.1) / Math.log(5 / 6))} worpen.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:`Je gooit 5 keer een munt. Bereken de kans op precies 2 keer kop. ${PROCENT}`,a:pct(binompdf(5, 0.5, 2)),u:'%',h:['Aantal volgordes: 5 nCr 2 = 10.','Elke volgorde heeft kans 0,5⁵.'],s:`10 × 0,5⁵ = ${r4(binompdf(5, 0.5, 2))}, dat is ${pct(binompdf(5, 0.5, 2))} %.`},
  {p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,q:`5 % van de producten heeft een fout. In een doos zitten er 30. Bereken de kans op hoogstens 1 product met een fout. ${PROCENT}`,a:pct(binomcdf(30, 0.05, 1)),u:'%',h:['binomcdf(30, 0,05, 1).'],s:`binomcdf(30, 0,05, 1) = ${r4(binomcdf(30, 0.05, 1))}, dat is ${pct(binomcdf(30, 0.05, 1))} %.`},
]

/* ============================================================= differentiëren */

const DIFF: Ruw[] = [
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = x³. Bereken f′(2).',a:'12',h:['f′(x) = 3x².'],s:'f′(x) = 3x², f′(2) = 3 × 4 = 12.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = 5x². Bereken f′(3).',a:'30',h:['f′(x) = 10x.'],s:'f′(x) = 10x, f′(3) = 30.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = 4x + 7. Wat is f′(x)?',a:'4',h:['De afgeleide van een constante is 0.'],s:'4x geeft 4, 7 geeft 0. f′(x) = 4.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = x⁴. Bereken f′(2).',a:'32',h:['f′(x) = 4x³.'],s:'f′(x) = 4x³, f′(2) = 4 × 8 = 32.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = 3x² − 2x. Bereken f′(1).',a:'4',h:['Differentieer elke term apart.'],s:'f′(x) = 6x − 2, f′(1) = 4.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:1,q:'f(x) = 2x³. Bereken f′(−1).',a:'6',h:['f′(x) = 6x².'],s:'f′(x) = 6x², f′(−1) = 6 × 1 = 6.'},

  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'f(x) = x² − 6x + 5. Bij welke x ligt de top?',a:'3',h:['In de top is f′(x) = 0.'],s:'f′(x) = 2x − 6 = 0 → x = 3.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'f(x) = −2x² + 12x. Bereken de maximale waarde van f.',a:'18',h:['Eerst x van de top met f′(x) = 0.','Dan f van die x.'],s:'f′(x) = −4x + 12 = 0 → x = 3.\nf(3) = −18 + 36 = 18.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'De raaklijn aan f(x) = x² in het punt met x = 3 is y = ax + b. Bereken b.',a:'-9',h:['a = f′(3).','Het raakpunt (3, 9) ligt op de lijn.'],s:'a = f′(3) = 6.\n9 = 6 × 3 + b → b = −9.\nDe raaklijn is y = 6x − 9.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'f(x) = x³ − 3x. Bereken f′(2).',a:'9',h:['f′(x) = 3x² − 3.'],s:'f′(2) = 12 − 3 = 9.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'f(x) = 0,5x⁴. Bereken f′(2).',a:'16',h:['f′(x) = 2x³.'],s:'f′(x) = 4 × 0,5 x³ = 2x³, f′(2) = 16.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,q:'f(x) = x². Bereken het differentiequotiënt op [1, 3].',a:'4',h:['Δy ÷ Δx = (f(3) − f(1)) ÷ (3 − 1).'],s:'(9 − 1) ÷ 2 = 4.\nDat is de helling van de lijn door (1, 1) en (3, 9).'},

  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'f(x) = x³ − 12x. Bij welke x ligt het maximum?',a:'-2',h:['f′(x) = 3x² − 12 = 0 geeft twee x-waarden.','Welke van de twee is het maximum? Schets of kijk naar het teken van f′.'],s:'3x² = 12 → x = −2 of x = 2.\nf′ gaat bij x = −2 van + naar −: daar ligt het maximum.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'f(x) = x³ − 12x. Bereken de waarde van het maximum.',a:'16',h:['Het maximum ligt bij x = −2.'],s:'f(−2) = −8 + 24 = 16.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'f(x) = (2x + 1)³. Bereken f′(1).',a:'54',h:['Kettingregel: f′(x) = 3(2x + 1)² · 2.'],s:'f′(x) = 6(2x + 1)².\nf′(1) = 6 × 9 = 54.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'f(x) = 8√x. Bereken f′(4).',a:'2',h:['Schrijf √x als x^½.','f′(x) = 8 · ½ · x^(−½) = 4 ÷ √x.'],s:'f′(x) = 4 ÷ √x, f′(4) = 4 ÷ 2 = 2.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'De winst is W(q) = −q² + 40q − 100 (q in duizenden stuks). Bij welke q is de winst maximaal?',a:'20',h:['W′(q) = 0.'],s:'W′(q) = −2q + 40 = 0 → q = 20.'},
  {p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,q:'De winst is W(q) = −q² + 40q − 100. Bereken de maximale winst.',a:'300',h:['Maximum bij q = 20.'],s:'W(20) = −400 + 800 − 100 = 300.'},
]

/* ========================================================= verwachtingswaarde */

const VERWACHTING: Ruw[] = [
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'Je gooit één keer met een dobbelsteen. Bereken de verwachtingswaarde van het aantal ogen.',a:'3,5',h:['E = som van (waarde × kans).','Elke uitkomst heeft kans 1/6.'],s:'(1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 = 3,5.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'Bij kop krijg je € 2, bij munt niets. Bereken de verwachte uitbetaling in euro.',a:'1',h:['E = 2 × 0,5 + 0 × 0,5.'],s:'E = 2 × 0,5 = € 1.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'X kan 0, 1 en 2 zijn, met kansen 0,2, 0,5 en 0,3. Bereken E(X).',a:'1,1',h:['E = 0 × 0,2 + 1 × 0,5 + 2 × 0,3.'],s:'E = 0 + 0,5 + 0,6 = 1,1.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'Een lot geeft 1 % kans op € 100, anders niets. Bereken de verwachte uitbetaling in euro.',a:'1',h:['E = 100 × 0,01.'],s:'E = 100 × 0,01 = € 1.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'Een spel is eerlijk als de verwachte winst gelijk is aan ...',a:'0',h:['Op de lange duur win je niets en verlies je niets.'],s:'Eerlijk: verwachte winst 0.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'X is 10 met kans 0,4 en 20 met kans 0,6. Bereken E(X).',a:'16',h:['E = 10 × 0,4 + 20 × 0,6.'],s:'E = 4 + 12 = 16.'},

  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'De inzet is € 3. Je gooit een dobbelsteen; bij een zes krijg je € 15. Bereken de verwachte winst per spel in euro.',a:'-0,5',h:['Verwachte uitbetaling min inzet.'],s:'Uitbetaling: 15 × 1/6 = 2,50.\nWinst: 2,50 − 3 = −€ 0,50.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'Een rad geeft met kans ¼ € 8, anders niets. De inzet is € 1,50. Bereken de verwachte winst in euro.',a:'0,5',h:['Verwachte uitbetaling min inzet.'],s:'8 × ¼ = 2,00.\n2,00 − 1,50 = € 0,50.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'Je gooit met twee dobbelstenen en telt de ogen op. Bereken de verwachtingswaarde van de som.',a:'7',h:['E(X + Y) = E(X) + E(Y).'],s:'3,5 + 3,5 = 7.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'Een huis heeft per jaar 2 % kans op schade van € 5000. Bereken de verwachte schade per jaar in euro.',a:'100',h:['E = 5000 × 0,02.'],s:'E = € 100: dat is wat een verzekeraar minstens als premie moet vragen.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'Je gooit 3 keer een munt. X is het aantal keer kop. Bereken E(X).',a:'1,5',h:['Binomiaal: E = n · p.'],s:'E = 3 × 0,5 = 1,5.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,q:'Je trekt één kaart uit een spel van 52. Bij harten krijg je € 4, anders niets. Bereken de verwachte uitbetaling in euro.',a:'1',h:['13 van de 52 kaarten zijn harten.'],s:'4 × 13/52 = 4 × ¼ = € 1.'},

  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'De inzet is € 2. Met kans 1/6 win je een prijs, anders niets. Hoe groot moet de prijs zijn voor een eerlijk spel, in euro?',a:'12',h:['Eerlijk: verwachte uitbetaling = inzet.'],s:'P × 1/6 = 2 → P = € 12.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Uit een vaas met 3 rode en 2 witte knikkers trek je er 2 zonder terugleggen. X is het aantal rode. Bereken E(X).',a:r4(0 * (2 / 5 * 1 / 4) + 1 * (3 / 5 * 2 / 4 + 2 / 5 * 3 / 4) + 2 * (3 / 5 * 2 / 4)),h:['P(X = 0) = 2/5 · 1/4, P(X = 2) = 3/5 · 2/4.','P(X = 1) is de rest.'],s:'P(0) = 0,1, P(1) = 0,6, P(2) = 0,3.\nE = 0 + 0,6 + 0,6 = 1,2.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Er zijn 1000 loten van € 5. Prijzen: 1 keer € 1000 en 10 keer € 100. Bereken de verwachte winst per lot in euro.',a:r4((1000 + 10 * 100) / 1000 - 5),h:['Verwachte uitbetaling: totaal prijzengeld ÷ aantal loten.'],s:'Prijzengeld: 1000 + 1000 = € 2000.\nPer lot: 2000 ÷ 1000 = € 2.\nWinst: 2 − 5 = −€ 3.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Een spel levert −€ 2 met kans 0,5, € 1 met kans 0,3 en € 10 met kans 0,2. Bereken de verwachte winst in euro.',a:r4(-2 * 0.5 + 1 * 0.3 + 10 * 0.2),h:['Som van waarde × kans, met het minteken.'],s:'−1 + 0,3 + 2 = € 1,30.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Je wint € 10 met kans 0,3, anders niets. Bij welke inzet in euro is het spel eerlijk?',a:'3',h:['Eerlijk: inzet = verwachte uitbetaling.'],s:'10 × 0,3 = € 3.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Een toets heeft 20 meerkeuzevragen met 4 opties. Goed geeft +1, fout geeft −⅓. Je gokt alles. Bereken de verwachte score.',a:r4(20 * (0.25 * 1 + 0.75 * (-1 / 3))),h:['Per vraag: 0,25 × 1 + 0,75 × (−⅓).'],s:'Per vraag: 0,25 − 0,25 = 0.\nVerwachte score: 0. Precies daarom geeft zo’n toets strafpunten.'},
]

export const WISKUNDEA_5VWO: Ruw[] = [...NORMAAL, ...BINOMIAAL, ...DIFF, ...VERWACHTING]
