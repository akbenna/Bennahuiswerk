/**
 * DE VINGERAFDRUK VAN EEN FUNCTIE, AAN DEZE KANT UITGEREKEND
 *
 * `health/database/controle-md5.sql` vergelijkt wat er in de database draait
 * met wat er in deze map staat. De verwachte waarden in dat bestand waren met
 * de hand uitgerekend, en dat is precies het soort belofte dat scheefgroeit:
 * het bestand zegt zelf dat het opnieuw gemaakt hoort te worden zodra er een
 * functie verandert, en er was niets dat dat deed of controleerde.
 *
 * Dit bestand doet het rekenwerk, en de proef ernaast (`dbverslag.proef.ts`)
 * houdt vast dat de waarden in het SQL-bestand nog kloppen met de bestanden.
 *
 * HETZELFDE RECEPT ALS AAN DE DATABASEKANT, EN DAAR HANGT ALLES AAN
 *
 * Postgres bewaart in `prosrc` wat er tússen de dollartekens stond: de body en
 * niet de handtekening. Daarom knipt deze code op precies dezelfde plek, haalt
 * dan de blokcommentaren eruit en trekt elke reeks witruimte samen tot één
 * spatie. Geen trim: `prosrc` begint met de regelovergang na `$$` en die wordt
 * aan beide kanten één spatie. Wie hier trimt krijgt overal VERSCHILT te zien
 * en zoekt zich suf in de database.
 *
 * WAAROM HET LAATSTE BESTAND TELT
 *
 * `create or replace function` is de gewone gang van zaken, dus een functie kan
 * in meer dan één bestand staan. Wat er draait is wat er het laatst is
 * neergezet, en de bestanden zijn genummerd. Dus: op nummer sorteren en de
 * laatste winnen laten.
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Precies wat de SQL-kant met `prosrc` doet, en in dezelfde volgorde. */
export function vingerafdruk(lijf) {
  return createHash('md5')
    .update(lijf.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' '))
    .digest('hex')
}

/**
 * Op het nummer vóór het streepje, en niet op de naam.
 *
 * Vandaag lopen de bestanden van 01 tot 43 en zijn de nummers tot twee cijfers
 * aangevuld, dus alfabetisch geeft dezelfde volgorde. Bij bestand 100 niet meer:
 * dat staat alfabetisch tussen 10 en 11, en dan wijst de controle het verkeerde
 * bestand aan op de dag dat het er het meest toe doet.
 */
export function opNummer(namen) {
  return [...namen].sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b))
}

/** De genummerde bestanden, op nummer. `controle-md5.sql` hoort er niet bij. */
export function verslagbestanden(map) {
  return opNummer(readdirSync(map).filter((f) => /^\d+-.*\.sql$/.test(f)))
}

/**
 * Elke functie die deze map neerzet, met het laatste bestand dat haar schrijft.
 *
 * Alleen `create or replace function`: een naam die in een commentaarregel of
 * in een aanroep voorkomt zet niets neer.
 */
export function functiesUitMap(map) {
  const uit = new Map()
  for (const bestand of verslagbestanden(map)) {
    const bron = readFileSync(join(map, bestand), 'utf8')
    const kop = /create\s+or\s+replace\s+function\s+(?:public\.)?(\w+)\s*\(/gi
    let m
    while ((m = kop.exec(bron)) !== null) {
      const open = bron.indexOf('$', m.index + m[0].length)
      if (open < 0) continue
      const tag = bron.slice(open, bron.indexOf('$', open + 1) + 1)
      const lijfVan = open + tag.length
      const lijfTot = bron.indexOf(tag, lijfVan)
      if (lijfTot < 0) continue
      uit.set(m[1], { bestand, md5: vingerafdruk(bron.slice(lijfVan, lijfTot)) })
    }
  }
  return uit
}

/** De regels uit het `values`-blok van controle-md5.sql, zoals ze er staan. */
export function verwachtUitControle(sql) {
  const uit = new Map()
  const regel = /\('?(kal_\w+)'?(?:::text)?,\s*'([^']+)'(?:::text)?,\s*'([0-9a-f]{32})'/g
  let m
  while ((m = regel.exec(sql)) !== null) uit.set(m[1], { bestand: m[2], md5: m[3] })
  return uit
}

/** Het blok zoals het in controle-md5.sql hoort te staan. */
export function blok(map) {
  const rijen = [...functiesUitMap(map)].sort(([a], [b]) => a.localeCompare(b))
  return rijen.map(([naam, x], i) => (i === 0
    ? `    ('${naam}'::text, '${x.bestand}'::text, '${x.md5}'::text)`
    : `    ('${naam}', '${x.bestand}', '${x.md5}')`)).join(',\n')
}
