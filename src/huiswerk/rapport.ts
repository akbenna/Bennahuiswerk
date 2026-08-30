/**
 * WAT DE OUDER MEENEEMT
 *
 * Twee uitvoer­vormen naast elkaar, en dat is geen dubbelop. Het rapport is een
 * tekstbestand dat je kunt lezen en meenemen naar een tienminutengesprek. Het
 * leerprofiel is JSON: bedoeld om later mee door te rekenen, en om extra
 * oefenstof gericht te maken op wat er nog niet zit.
 */
import { PROFIELEN, VAKNAAM } from './gegevens/profielen'
import type { Kaart } from './gegevens/soorten'
import type { Stand } from './opslag'
import { schoonVoortgang } from './opslag'
import { isBeheerst, kaartStand } from './leitner'
import { leerprofiel, zwakteAnalyse } from './volgsysteem'

export function rapportTekst(stand: Stand, alle: Kaart[]): string {
  const L = ['Voortgangsrapport — Oefenapp', '==============================', '']
  for (const [pid, P] of Object.entries(PROFIELEN)) {
    const prog = schoonVoortgang(stand.prog[pid])
    L.push(P.naam + ' (' + P.niveau + ')')
    L.push('  Punten: ' + (prog.punten || 0)
      + '  ·  Dagreeks: ' + (prog.dagstreak || 0) + ' dagen'
      + '  ·  Niveau: ' + (prog.niveau === 'auto'
        ? 'automatisch (nu ' + (prog.autoLvl || 1) + ')'
        : String(prog.niveau)))
    for (const v of P.vakken) {
      const kaarten = alle.filter((e) => e.p === pid && e.v === v)
      const beh = kaarten.filter((e) => isBeheerst(prog, e.id)).length
      const beg = kaarten.filter((e) => kaartStand(prog, e.id).box > 0).length
      L.push('  - ' + (VAKNAAM[v] ?? v) + ': ' + beh + '/' + kaarten.length
        + ' beheerst (' + beg + ' begonnen)')
    }
    const az = zwakteAnalyse(prog, alle, pid)
    if (az.zwak.length) {
      L.push('  Aandachtspunten: ' + az.zwak.map((o) => (VAKNAAM[o.v] ?? o.v) + ' – ' + o.t
        + ' (' + o.pct + '% beheerst' + (o.wrong ? ', ' + o.wrong + 'x fout' : '') + ')').join('; '))
    }
    if (az.sterk.length) {
      L.push('  Gaat goed: ' + az.sterk.map((o) => (VAKNAAM[o.v] ?? o.v) + ' – ' + o.t).join('; '))
    }
    if (prog.foutLog.length) {
      L.push('  Nog te herhalen (foutenschrift): ' + prog.foutLog.length)
    }
    L.push('')
  }
  return L.join('\n')
}

export function leerprofielData(stand: Stand, alle: Kaart[]): unknown {
  const kinderen = Object.keys(PROFIELEN).map((pid) => {
    const prof = leerprofiel(schoonVoortgang(stand.prog[pid]), alle, pid, PROFIELEN[pid])
    if (!prof) return null
    return {
      kind: prof.naam, pid, niveau: prof.niveau, volgend: prof.volgend,
      samenvatting: {
        opgaven: prof.totaal, geoefend: prof.geoefend, beheerst: prof.beheerst,
        dekking_pct: prof.dekking, beheersing_pct: prof.mastery, punten: prof.punten,
      },
      vakken: prof.vakken.map((v) => ({
        vak: v.naam, opgaven: v.totaal, beheerst: v.beheerst, geoefend: v.geoefend,
        beheersing_pct: v.pct, dekking_pct: v.dekking,
        onderwerpen: v.onderwerpen.map((o) => ({
          onderwerp: o.t, jaar: o.jaar, opgaven: o.totaal, beheerst: o.beheerst,
          geoefend: o.geoefend, beheersing_pct: o.pct, nauwkeurigheid_pct: o.nauw,
          pogingen: o.pogingen, fouten: o.wrong, status: o.status.label, niveauverdeling: o.lvl,
        })),
      })),
      historie: prof.historie,
    }
  }).filter(Boolean)
  return { app: 'BennaHub', type: 'leerprofiel', gegenereerd_lokaal: true, kinderen }
}

/** Een bestand aanbieden zonder dat het ergens de deur uit gaat. */
export function bewaarAls(naam: string, inhoud: string, soort: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([inhoud], { type: soort }))
  a.download = naam
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500)
}

/* De landelijke domeinen van de rekenlijn. Een onderwerp wordt op zijn naam
   ingedeeld; dat is grover dan een echte curriculumkoppeling maar wel eerlijk
   over wat het is, en het werkt zonder dat er bij elke nieuwe opgave een
   domeincode ingevuld moet worden. */
const DOMEINWOORDEN: Array<[string, string[]]> = [
  ['Getallen', ['getal', 'optel', 'aftrek', 'tafel', 'delen', 'deel', 'vermenigvuldig',
    'kommagetal', 'negatiev', 'macht', 'wortel', 'rekenvolgorde', 'getalbegrip', 'rest',
    'automatiseren']],
  ['Verhoudingen', ['breuk', 'verhouding', 'procent', 'schaal', 'groeifactor']],
  ['Meten & meetkunde', ['meten', 'maten', 'oppervlak', 'omtrek', 'inhoud', 'klok', 'tijd',
    'geld', 'hoek', 'pythagoras', 'meetkunde', 'figuur', 'cirkel', 'driehoek', 'rechthoek',
    'balk', 'kubus', 'hokjes']],
  ['Verbanden', ['tabel', 'grafiek', 'diagram', 'gemiddelde', 'statistiek', 'formule', 'lineair',
    'kwadrat', 'verband', 'kans', 'tellen', 'combinat', 'exponent', 'logaritme', 'vergelijking',
    'stelsel', 'haakjes', 'herleiden', 'wetenschappelijke']],
]

export const DOMEINVOLGORDE = ['Getallen', 'Verhoudingen', 'Meten & meetkunde', 'Verbanden', 'Overig']

export const REKENVAKKEN = new Set(['rekenen', 'wiskunde', 'wiskundeA'])

export function domeinVan(t: string): string {
  const s = (t ?? '').toLowerCase()
  for (const [dom, woorden] of DOMEINWOORDEN) {
    if (woorden.some((k) => s.includes(k))) return dom
  }
  return 'Overig'
}
