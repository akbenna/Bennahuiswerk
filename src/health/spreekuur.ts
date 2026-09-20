/**
 * HET OVERZICHT DAT JE MEENEEMT NAAR HET SPREEKUUR
 *
 * Een consult duurt tien minuten en begint met "hoe gaat het". Alles wat in
 * deze app staat, staat er dan niet: het gewicht uit de trend, de week
 * bloeddruk, de middelomtrek van vier maanden geleden, de labwaarden met hun
 * datums. Voorlezen van een telefoon kost meer tijd dan er is, en de helft
 * komt er verkeerd uit.
 *
 * Dit maakt daar één tekst van, om te plakken in een mail, een bericht aan de
 * praktijk of een notitie. Geen bestand, geen opmaak: tekst overleeft elke
 * overdracht en een PDF niet.
 *
 * VIJF REGELS, EN ZE VOLGEN ALLE VIJF UIT DE REST VAN DEZE APP
 *
 * **Er wordt niets nieuws uitgerekend.** Elk getal hieronder staat al op het
 * scherm. Deze functie krijgt ze aangereikt en zet ze op een rij; ze rekent
 * niets opnieuw uit en beslist niets opnieuw. Was het anders, dan konden het
 * scherm en het briefje verschillende dingen zeggen over dezelfde dag.
 *
 * **De voorbehouden reizen mee.** Een SCORE2 van 6,4 procent zonder de
 * onderschatting van 1,3 en zonder de C-index is in de inbox van een huisarts
 * een ander getal dan op dit scherm. Wat op het scherm onder het getal staat,
 * staat hier onder het getal. Dat is geen kleine letter maar de helft van de
 * mededeling, en een proef houdt vast dat het er staat.
 *
 * **Er staat waar het vandaan komt.** Bovenaan staat dat dit zelfgemeten en
 * zelf ingevoerde waarden zijn. Een praktijkmeting en een labuitslag zien er in
 * platte tekst precies hetzelfde uit als een getal dat iemand overtikte, en het
 * verschil hoort niet aan de lezer te worden overgelaten.
 *
 * **Wat ontbreekt wordt genoemd.** Een maat die er niet is verdwijnt niet
 * stilzwijgend maar krijgt een regel onderaan. Leeg betekent in deze app dat er
 * niet gemeten is, en dat is iets anders dan goed.
 *
 * **Er staat geen oordeel in.** Geen "te hoog", geen "goed bezig", geen advies.
 * De klasse die bij SCORE2, FIB-4 en STOP-BANG hoort komt uit de richtlijn die
 * erbij genoemd wordt en is de uitkomst zelf, geen mening van deze app.
 */
import { dec } from '@/gedeeld/getal'
import type { IsoDatum } from '@/gedeeld/db/tabellen'
import { opDatum } from '@/gedeeld/datum'
import type { Middelzone } from './klinisch'
import type { Middelbeloop } from './middelbeloop'
import type { Thuisbloeddruk } from './bloeddruk'
import { tijdspanne } from './verandering'
import type { Verandering } from './verandering'

export interface Spreekuurlab {
  naam: string
  waarde: number
  eenheid: string
  lo: number | null
  hi: number | null
  datum: string
}

export interface Spreekuurbron {
  vandaag: IsoDatum
  /** De gladde lijn, niet de weging van vanochtend. */
  gewichtKg: number | null
  bmi: number | null
  middelCm: number | null
  middelDatum: string | null
  middelLengte: { ratio: number; zone: Middelzone } | null
  middelbeloop: Middelbeloop | null
  thuis: Thuisbloeddruk | null
  /** De geschatte spreekkamerwaarde waarmee SCORE2 gerekend heeft. */
  sysSpreekkamer: number | null
  veranderingen: readonly Verandering[]
  labs: readonly Spreekuurlab[]
  /** Namen van de labwaarden die deze app kent maar die niet ingevuld zijn. */
  labsLeeg: readonly string[]
  score2: { risico: number; klasse: string } | null
  fib4: { waarde: number; klasse: string } | null
  stopbang: { score: number; klasse: string } | null
}

/**
 * Een labwaarde zoals een uitslag hem schrijft.
 *
 * `dec` zet er altijd één cijfer achter de komma, en dat leest in een rij
 * uitslagen verkeerd: een HbA1c van 41,0 en een eGFR van 94,0 zijn hele
 * getallen die er als gemeten precisie uitzien. Is er niets achter de komma,
 * dan staat er niets achter de komma.
 */
const labgetal = (v: number): string => dec(v, 1).replace(/,0$/, '')

const datumVoluit = (d: string): string =>
  opDatum(d as IsoDatum).toLocaleDateString('nl-NL',
    { day: 'numeric', month: 'long', year: 'numeric' })

/** Een regel met een label ervoor. De inspringing houdt een blok bij elkaar. */
const regel = (label: string, waarde: string): string => `  ${label}: ${waarde}`
const erbij = (tekst: string): string => `    ${tekst}`

function kop(tekst: string): string {
  return `\n${tekst.toUpperCase()}`
}

/**
 * De voorbehouden bij de drie scores, woordelijk zoals ze op het scherm staan.
 *
 * Ze staan hier als vaste tekst en niet als verwijzing naar het scherm: wat er
 * geplakt wordt moet op zichzelf te lezen zijn, ook door iemand die deze app
 * niet heeft.
 */
export const VOORBEHOUD = {
  score2: [
    'berekend met het gepubliceerde ESC-algoritme voor de laag-risicoregio, niet met de tabel',
    'SCORE2 onderschat in Nederland met een factor 1,3 bij mannen, oplopend bij lage '
      + 'sociaaleconomische status en niet-westerse afkomst',
    'de C-index is 0,65 tot 0,72: dit is een gespreksinstrument en geen individuele voorspelling',
  ],
  fib4: [
    'afkapwaarden uit de Richtlijn MASLD/MASH (NVMDL, april 2024)',
    'dit is een uitsluittest en geen stadiëring: geen enkele niet-invasieve test haalt '
      + 'sensitiviteit en specificiteit boven de tachtig procent',
  ],
  stopbang: [
    'een screeningsvragenlijst voor slaapapneu, geen diagnose',
    'wat de uitkomst betekent hoort bij de huisarts, niet bij een app',
  ],
} as const

export function spreekuurtekst(b: Spreekuurbron): string {
  const uit: string[] = [
    'BennaHealth, overzicht voor het spreekuur',
    datumVoluit(b.vandaag),
    '',
    'Alle waarden hieronder heb ik zelf gemeten en zelf ingevoerd. Het zijn geen',
    'praktijkmetingen, en de labwaarden heb ik overgenomen uit mijn laatste uitslag.',
  ]
  const leeg: string[] = []

  /* GEWICHT EN OMTREK */
  if (b.gewichtKg != null || b.middelCm != null) uit.push(kop('Gewicht en omtrek'))
  if (b.gewichtKg != null) {
    uit.push(regel('Gewichtstrend', `${dec(b.gewichtKg, 1)} kg`
      + (b.bmi != null ? `, BMI ${dec(b.bmi, 1)}` : '')))
    uit.push(erbij('de gladde lijn door de dagelijkse wegingen, niet de weging van vandaag'))
  } else {
    leeg.push('Gewicht: nog niet genoeg wegingen voor een trend.')
  }
  if (b.middelCm != null) {
    uit.push(regel('Middelomtrek', `${dec(b.middelCm, 0)} cm`
      + (b.middelDatum ? `, gemeten op ${datumVoluit(b.middelDatum)}` : '')))
    /* Het beloop zelf staat verderop bij wat er veranderd is. Wat daar niet
       staat is dat een klein verschil geen verschil is, en juist dat hoort een
       lezer te weten voordat hij er iets van vindt. */
    if (b.middelbeloop?.binnenRuis) {
      uit.push(erbij(`het verschil met ${datumVoluit(b.middelbeloop.eerste.datum)} is minder `
        + 'dan twee centimeter, en dat valt binnen de meetfout van het lint'))
    }
  } else {
    leeg.push('Middelomtrek: niet gemeten.')
  }
  if (b.middelLengte) {
    uit.push(regel('Middel gedeeld door lengte', `${dec(b.middelLengte.ratio, 2)}, `
      + `${b.middelLengte.zone} de grens van 0,5`))
  }

  /* BLOEDDRUK
     De kop komt alleen als er iets onder staat. Een kop boven niets leest als
     een gegeven dat is weggevallen, en dat is erger dan de regel onderaan waar
     hij dan wél staat. */
  if (b.thuis) {
    const t = b.thuis
    uit.push(kop('Bloeddruk, thuis gemeten'))
    uit.push(regel('Gemiddelde', `${t.sys}/${t.dia} mmHg over ${t.dagen} `
      + `${t.dagen === 1 ? 'dag' : 'dagen'}, ${t.metingen} metingen`))
    uit.push(erbij(`de daggemiddelden liepen ${t.spreidingSys} mmHg uiteen in bovendruk`))
    if (t.gewenningsdagWeg) {
      uit.push(erbij('de eerste meetdag telt niet mee, want op die dag valt de meting '
        + 'systematisch hoger uit'))
    }
    uit.push(erbij('wat de app niet kan nagaan: of er twee keer voor het ontbijt en twee keer '
      + 'na het avondeten gemeten is. Een meting draagt hier een datum en geen tijdstip'))
  } else {
    leeg.push('Bloeddruk: geen dagen met zowel een boven- als een onderdruk.')
  }

  /* WAT ER VERANDERD IS */
  if (b.veranderingen.length) {
    uit.push(kop('Wat er veranderd is, van de eerste meting tot de laatste'))
    for (const v of b.veranderingen) {
      uit.push(regel(v.naam, `van ${dec(v.vanWaarde, v.decimalen)} naar `
        + `${dec(v.totWaarde, v.decimalen)} ${v.eenheid} in ${tijdspanne(v.dagen)}`))
      /* Een weekgemiddelde en een losse meting zien er in platte tekst
         hetzelfde uit, en dat verschil bepaalt hoe zwaar het getal weegt. */
      if (v.vanDagen > 1 || v.totDagen > 1) {
        uit.push(erbij(`gemiddelden van ${v.vanDagen} en ${v.totDagen} meetdagen, `
          + 'niet twee losse metingen'))
      }
    }
  }

  /* LAB */
  if (b.labs.length) {
    uit.push(kop('Labwaarden, overgenomen uit mijn uitslag'))
    for (const l of b.labs) {
      const ref = l.lo != null && l.hi != null
        ? `referentie ${labgetal(l.lo)} tot ${labgetal(l.hi)}`
        : l.hi != null ? `referentie tot ${labgetal(l.hi)}`
        : l.lo != null ? `referentie vanaf ${labgetal(l.lo)}`
        : 'geen afkapwaarde in deze app'
      uit.push(regel(l.naam, `${labgetal(l.waarde)} ${l.eenheid}, ${ref}, `
        + `gemeten op ${datumVoluit(l.datum)}`))
    }
  } else {
    leeg.push('Labwaarden: geen enkele ingevuld.')
  }
  if (b.labs.length && b.labsLeeg.length) {
    leeg.push(`Niet ingevuld: ${b.labsLeeg.join(', ')}.`)
  }

  /* DE SCORES, MET HUN VOORBEHOUD */
  if (b.score2 || b.fib4 || b.stopbang) uit.push(kop('Wat de app hieruit berekent'))
  if (b.score2) {
    uit.push(regel('SCORE2', `${dec(b.score2.risico, 1)} procent tienjaarsrisico op hart- en `
      + `vaatziekten, ${b.score2.klasse} risico volgens NHG-CVRM`))
    if (b.sysSpreekkamer != null) {
      uit.push(erbij(`gerekend met ${b.sysSpreekkamer} mmHg: de geschatte spreekkamerwaarde bij `
        + (b.thuis ? `het thuisgemiddelde van ${b.thuis.sys}` : 'mijn laatste eigen meting')
        + ', want de risicotabel gaat uit van gestandaardiseerde spreekkamermetingen'))
    }
    for (const v of VOORBEHOUD.score2) uit.push(erbij(v))
  } else {
    leeg.push('SCORE2: niet te berekenen. Nodig zijn bloeddruk, totaal cholesterol en HDL.')
  }
  if (b.fib4) {
    uit.push(regel('FIB-4', `${dec(b.fib4.waarde, 2)}, ${b.fib4.klasse}`))
    for (const v of VOORBEHOUD.fib4) uit.push(erbij(v))
  } else {
    leeg.push('FIB-4: niet te berekenen. Nodig zijn ASAT, ALAT en trombocyten.')
  }
  if (b.stopbang) {
    uit.push(regel('STOP-BANG', `${b.stopbang.score} van 8, ${b.stopbang.klasse}`))
    for (const v of VOORBEHOUD.stopbang) uit.push(erbij(v))
  } else {
    leeg.push('STOP-BANG: de vragenlijst is niet ingevuld.')
  }

  /* WAT ER NIET IN STAAT */
  if (leeg.length) {
    uit.push(kop('Wat hier niet in staat'))
    for (const r of leeg) uit.push(`  ${r}`)
  }

  uit.push('')
  uit.push('Gemaakt met BennaHealth. Deze app meet en rekent; wat de getallen betekenen,')
  uit.push('staat er niet bij, en dat is met opzet.')
  return uit.join('\n')
}
