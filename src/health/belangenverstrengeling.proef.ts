/**
 * DE APP MAG NIET WETEN WELK MERK VAN DE EIGENAAR IS
 *
 * In `health/database/45-eiwitten-en-supplementen.sql` komen vier merken de
 * voedingslijst in. Eén ervan, Upfront, verkoopt de eigenaar van deze app zelf.
 * Dat is geen bezwaar om het product op te nemen — het bestaat, mensen drinken
 * het, en een voedingslijst die het verzwijgt is minder waard, niet eerlijker.
 *
 * Het is wél een bezwaar om het voor te trekken. Zodra de app een product
 * voortrekt dat de eigenaar verkoopt, wordt élk ander getal erin verdacht: de
 * lezer kan van buitenaf niet meer zien waar het advies ophoudt en de verkoop
 * begint. En dat is precies het vertrouwen waar de rest van deze app op teert —
 * geen getal zonder zijn onzekerheid, geen oordeel dat de huisarts toekomt.
 *
 * Vandaar deze regel, en hij is scherper dan "niet voortrekken": de code mag
 * niet wéten dat deze merken bestaan. Geen naam in een sorteersleutel, geen
 * uitzondering in een zeef, geen badge in een scherm. Ze komen binnen als rij en
 * verlaten de database als rij, op dezelfde voet als een pak melk van de Lidl.
 *
 * Wat hier met opzet níet staat is een proef op de volgorde zélf. Die zou moeten
 * nabouwen wat Postgres doet en zou daarmee de bewering toetsen die ik erover
 * opschrijf in plaats van wat er draait. Dit toetst iets smallers en hards: de
 * naam komt nergens voor. Een voorkeursregel zonder die naam te noemen is niet
 * te schrijven.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** De merken uit bestand 45. Upfront is die van de eigenaar; de andere drie
 *  staan er even hard in, want een regel die alleen voor het eigen merk geldt
 *  is een regel die je omzeilt door een tweede merk te beginnen. */
const MERKEN = ['Upfront', 'Body&Fit', 'XXL Nutrition', 'Orangefit']

/** Het bestand dat de rijen neerzet. Dáár hoort de naam te staan — dat is de
 *  inhoud zelf. Overal elders is hij code die het merk kent. */
const INVOERBESTAND = '45-eiwitten-en-supplementen.sql'

function bestanden(map: string, achtervoegsels: string[]): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) uit.push(...bestanden(pad, achtervoegsels))
    else if (achtervoegsels.some((a) => naam.endsWith(a))) uit.push(pad)
  }
  return uit
}

describe('geen merk in de code', () => {
  it('noemt geen enkel merk uit bestand 45 in de app zelf', () => {
    const gevonden: string[] = []
    for (const pad of bestanden('src', ['.ts', '.tsx'])) {
      if (pad.endsWith('belangenverstrengeling.proef.ts')) continue
      const tekst = readFileSync(pad, 'utf8')
      for (const merk of MERKEN) if (tekst.includes(merk)) gevonden.push(`${pad}: ${merk}`)
    }
    expect(gevonden).toEqual([])
  })

  it('noemt geen enkel merk in de database, behalve in het invoerbestand zelf', () => {
    const gevonden: string[] = []
    for (const pad of bestanden('health/database', ['.sql'])) {
      if (pad.endsWith(INVOERBESTAND)) continue
      const tekst = readFileSync(pad, 'utf8')
      for (const merk of MERKEN) if (tekst.includes(merk)) gevonden.push(`${pad}: ${merk}`)
    }
    expect(gevonden).toEqual([])
  })

  /* Zonder deze regel zou de proef hierboven ook groen staan als bestand 45
     verdwenen was, of als de merken er nooit in gekomen waren. Een proef die
     groen is omdat er niets te toetsen valt is geen proef. */
  it('en de merken staan wél in het invoerbestand — anders toetst dit niets', () => {
    const sql = readFileSync(join('health/database', INVOERBESTAND), 'utf8')
    for (const merk of MERKEN) expect(sql).toContain(merk)
  })
})
