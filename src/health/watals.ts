/**
 * WAT ALS: van kilo's naar een risico, in twee stappen die allebei zichtbaar zijn
 *
 * De vraag is oud en goed: wat levert het op als ik tien kilo kwijtraak. De
 * eerlijke versie van het antwoord begint bij wat er niet kan.
 *
 * SCORE2 KENT GEEN GEWICHT
 *
 * De invoer van SCORE2 is leeftijd, geslacht, roken, systolische bloeddruk,
 * totaal cholesterol en HDL. Meer niet. "Wat wordt mijn SCORE2 als ik afval" is
 * dus niet rechtstreeks te berekenen, en een app die het tóch in één getal geeft
 * verzint de weg ertussen.
 *
 * Wat hier staat zet die weg in twee stappen, en toont ze allebei:
 *
 *   1. Van kilo's naar je waarden. Wat doet gewichtsverlies gemiddeld met je
 *      bloeddruk en je lipiden? Dat is gemeten, in meta-analyses, met een
 *      spreiding die groter is dan de meeste mensen denken.
 *   2. Van je waarden naar het risico. Die geschatte waarden gaan door hetzelfde
 *      SCORE2 dat op het scherm staat, met dezelfde omrekening van thuis naar
 *      spreekkamer.
 *
 * Daardoor staat er nooit alleen een uitkomst. Er staat: met zoveel kilo eraf
 * komt de bloeddruk gemiddeld hier uit, en mét die bloeddruk leest SCORE2 dat.
 * Wie de eerste stap niet gelooft, ziet meteen waar hij niet in meegaat.
 *
 * DRIE REGELS DIE DEZE MOTOR BEGRENZEN
 *
 * **Alles wat hier gebeurt is een gemiddelde uit studies.** Niet een
 * voorspelling voor deze lezer. De helft van de deelnemers wijkt er fors van af,
 * en dat staat er met zoveel woorden bij; zie ook het stuk over responders in
 * het boekje.
 *
 * **Elke uitkomst draagt zijn band.** De effectmaten zijn ruim genomen, en de
 * uitkomst wordt drie keer gerekend: met het zwakste effect, het middelste en
 * het sterkste. Eén getal zou hier het ergste soort schijnnauwkeurigheid zijn,
 * want het getal eromheen is een risico op ziekte.
 *
 * **Geen gewonnen levensjaren.** Die stap vraagt aannames die veel verder gaan
 * dan waar deze app zich aan houdt. Wat er staat is wat SCORE2 leest, en SCORE2
 * gaat over tien jaar en over hart en vaten.
 *
 * WAAR DE EFFECTMATEN VANDAAN KOMEN, EN WAT ERAAN MANKEERT
 *
 * **Bloeddruk: ongeveer 1 mmHg systolisch per kilo.** Neter JE e.a., Influence
 * of weight reduction on blood pressure: a meta-analysis of randomized
 * controlled trials, Hypertension 2003;42:878-84. Vijfentwintig trials.
 *
 * **Lipiden: per kilo ongeveer 0,05 mmol/L totaal cholesterol eraf en 0,009
 * mmol/L HDL erbij.** Dattilo AM en Kris-Etherton PM, Effects of weight
 * reduction on blood lipids and lipoproteins: a meta-analysis, Am J Clin Nutr
 * 1992;56:320-8. De HDL-stijging geldt bij een stabiel gewicht; tijdens het
 * afvallen zelf daalt HDL in die analyse juist licht. Wie halverwege meet ziet
 * dus iets anders dan wat hier staat.
 *
 * Wat eraan mankeert, en wat de app erbij zegt: geen van beide schattingen is
 * tegen het artikel zelf nagelopen. Ze komen uit weergaven van derden, net als
 * de 7-2-2 bij de thuisbloeddruk, en dat blijft zo tot iemand de artikelen op
 * tafel legt. De banden hieronder zijn daarom ruim genomen en géén gepubliceerd
 * betrouwbaarheidsinterval.
 */
import type { Geslacht } from '@/gedeeld/db/tabellen'
import { score2 } from './klinisch'
import type { Risicoklasse } from './klinisch'

/** Wat één kilo gewichtsverlies gemiddeld doet. Zie de kop voor de bronnen. */
export const PER_KILO = {
  /** mmHg systolisch eraf per kilo. */
  sbd: { zwak: 0.5, mid: 1.0, sterk: 1.5 },
  /** mmol/L totaal cholesterol eraf per kilo. */
  tc: { zwak: 0.03, mid: 0.05, sterk: 0.07 },
  /** mmol/L HDL erbij per kilo, bij een stabiel gewicht. */
  hdl: { zwak: 0.005, mid: 0.009, sterk: 0.013 },
} as const

export type Sterkte = 'zwak' | 'mid' | 'sterk'

export interface WatalsInvoer {
  geslacht: Geslacht
  leeftijd: number
  rookt: boolean
  dm: boolean
  /** De gladde lijn, niet de weging van vanochtend. */
  gewichtKg: number
  /** De spreekkamerwaarde waarmee SCORE2 al rekent. Zie `bloeddruk.ts`. */
  sbd: number
  tc: number
  hdl: number
}

export interface Scenario {
  kilosEraf: number
  stoptMetRoken: boolean
}

export interface Waarden {
  gewichtKg: number
  sbd: number
  tc: number
  hdl: number
  rookt: boolean
}

export interface Uitkomst {
  waarden: Waarden
  risico: number
  klasse: Risicoklasse
}

/**
 * De waarden zoals ze er gemiddeld uit zouden komen.
 *
 * Er gaat niets omhoog waar de richting omlaag is: bij nul kilo eraf verandert
 * er niets, en bij een negatief getal (aankomen) draait hetzelfde effect om.
 * Dat laatste is geen uitgewerkte bewering maar de rekensom die doorloopt; het
 * scherm biedt het niet aan.
 */
export function waardenNa(nu: WatalsInvoer, s: Scenario, sterkte: Sterkte): Waarden {
  const k = s.kilosEraf
  return {
    gewichtKg: rond(nu.gewichtKg - k, 1),
    sbd: rond(nu.sbd - k * PER_KILO.sbd[sterkte], 0),
    tc: rond(nu.tc - k * PER_KILO.tc[sterkte], 2),
    hdl: rond(nu.hdl + k * PER_KILO.hdl[sterkte], 2),
    rookt: nu.rookt && !s.stoptMetRoken,
  }
}

const rond = (x: number, n: number): number => Math.round(x * 10 ** n) / 10 ** n

function uitkomst(nu: WatalsInvoer, w: Waarden): Uitkomst | null {
  const r = score2(nu.geslacht, {
    leeftijd: nu.leeftijd, rook: w.rookt, sbd: w.sbd, tc: w.tc, hdl: w.hdl, dm: nu.dm,
  })
  return r ? { waarden: w, risico: r.risico, klasse: r.klasse } : null
}

export interface Watals {
  nu: Uitkomst
  /** Het middelste effect, en de twee randen van de band. */
  straks: Uitkomst
  laagste: Uitkomst
  hoogste: Uitkomst
}

/**
 * Wat er gebeurt met dit scenario, met de band eromheen.
 *
 * `laagste` en `hoogste` zijn de twee randen van het risico en niet van de
 * effectmaat: het sterkste effect op de bloeddruk geeft het laagste risico, dus
 * die twee wisselen onderweg van plaats. Wie dat door elkaar haalt toont een
 * band die de verkeerde kant op staat.
 */
export function watals(nu: WatalsInvoer, s: Scenario): Watals | null {
  const basis = uitkomst(nu, {
    gewichtKg: nu.gewichtKg, sbd: nu.sbd, tc: nu.tc, hdl: nu.hdl, rookt: nu.rookt,
  })
  const mid = uitkomst(nu, waardenNa(nu, s, 'mid'))
  const zwak = uitkomst(nu, waardenNa(nu, s, 'zwak'))
  const sterk = uitkomst(nu, waardenNa(nu, s, 'sterk'))
  if (!basis || !mid || !zwak || !sterk) return null

  const randen = [zwak, sterk].sort((a, b) => a.risico - b.risico)
  return { nu: basis, straks: mid, laagste: randen[0]!, hoogste: randen[1]! }
}

/**
 * DE HARTLEEFTIJD
 *
 * De leeftijd waarop iemand met ideale risicofactoren hetzelfde tienjaarsrisico
 * heeft als jij nu. Meer is het niet, en dat "meer is het niet" is het punt: er
 * hangt geen behandelgrens aan en het is geen biologische leeftijd. Het is een
 * manier om een percentage te zeggen waar mensen wél iets bij voelen.
 *
 * WAT HIER IDEAAL HEET, EN WAAROM DAT EEN KEUZE IS
 *
 * Niet roken, geen diabetes, een systolische bloeddruk van 120, een totaal
 * cholesterol van 5,0 en een HDL van 1,4 mmol/L. Die set komt uit de
 * Framingham-traditie van de "heart age" en niet uit de SCORE2-publicatie: die
 * kent het begrip hartleeftijd niet. Een andere ideale set geeft een andere
 * hartleeftijd, en daarom staat deze set op het scherm bij het getal.
 *
 * BUITEN 40 TOT 69 HOUDT HET OP
 *
 * Daar geeft SCORE2 zelf niets meer terug. Een hartleeftijd van 78 zou een
 * doorgetrokken lijn zijn buiten het bereik van het model, en dat is precies het
 * soort getal dat in een spreekkamer blijft hangen.
 */
export const IDEAAL = { sbd: 120, tc: 5.0, hdl: 1.4 } as const

export type Hartleeftijd =
  | { jaren: number }
  | { grens: 'onder' | 'boven' }

export function hartleeftijd(geslacht: Geslacht, risico: number): Hartleeftijd | null {
  const bij = (leeftijd: number): number | null =>
    score2(geslacht, {
      leeftijd, rook: false, dm: false,
      sbd: IDEAAL.sbd, tc: IDEAAL.tc, hdl: IDEAAL.hdl,
    })?.risico ?? null

  const onder = bij(40)
  const boven = bij(69)
  if (onder == null || boven == null) return null
  if (risico <= onder) return { grens: 'onder' }
  if (risico >= boven) return { grens: 'boven' }

  /* Halveren, en niet stap voor stap: het risico loopt met de leeftijd mee
     omhoog, dus twintig halveringen brengen de fout ruim onder een tiende jaar
     en dat is fijner dan waar dit getal iets betekent. */
  let laag = 40
  let hoog = 69
  for (let i = 0; i < 20; i += 1) {
    const midden = (laag + hoog) / 2
    const r = bij(midden)
    if (r == null) return null
    if (r < risico) laag = midden
    else hoog = midden
  }
  return { jaren: Math.round((laag + hoog) / 2) }
}
