/**
 * KLOPT HET VERSLAG NOG MET DE BESTANDEN?
 *
 * `health/database/controle-md5.sql` vergelijkt de draaiende database met deze
 * map. Dat bestand droeg een belofte die niemand nakwam: "verandert er een
 * functie, dan hoort dit bestand opnieuw gemaakt te worden." De verwachte
 * waarden waren met de hand uitgerekend, er was geen gereedschap om ze opnieuw
 * te maken, en dus zou de eerste de beste wijziging aan een SQL-bestand de
 * controle stilletjes onbruikbaar maken: hij zou VERSCHILT melden op een
 * functie die in de database prima klopt.
 *
 * Deze proef rekent de waarden opnieuw uit en houdt ze ernaast. Valt hij om,
 * dan is dat geen fout in de database maar een bestand dat bijgewerkt moet
 * worden: draai `node gereedschap/md5-verslag.mjs --schrijf`.
 *
 * WAT HIJ NIET KAN
 *
 * Hij kijkt niet in de database. Of wat er draait klopt met deze map is van
 * hieruit niet te zien; daar is het SQL-bestand voor, en dat draai je zelf.
 * Deze proef bewaakt alleen de helft die hier ligt.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  functiesUitMap, opNummer, verslagbestanden, verwachtUitControle, vingerafdruk,
} from '../../gereedschap/db-md5.mjs'

const MAP = 'health/database'
const CONTROLE = MAP + '/controle-md5.sql'

describe('de vingerafdruk is dezelfde als aan de databasekant', () => {
  /* Postgres geeft `prosrc` terug met de regelovergang na de dollartekens erin.
     Aan de SQL-kant wordt die tot één spatie samengetrokken en niet weggehaald.
     Wie hier trimt krijgt op élke functie VERSCHILT te zien en gaat in de
     database zoeken naar een verschil dat aan deze kant zit. */
  it('trekt witruimte samen en trimt niet', () => {
    expect(vingerafdruk('\n  select 1;\n')).toBe(vingerafdruk(' select 1; '))
    expect(vingerafdruk('\n select 1;\n')).not.toBe(vingerafdruk('select 1;'))
  })

  it('laat blokcommentaar buiten beschouwing en regelcommentaar niet', () => {
    expect(vingerafdruk('select 1; /* toelichting */')).toBe(vingerafdruk('select 1; '))
    expect(vingerafdruk('select 1; -- toelichting')).not.toBe(vingerafdruk('select 1;'))
  })
})

describe('welk bestand een functie het laatst neerzet', () => {
  /* Vandaag zijn alle nummers tot twee cijfers aangevuld, dus alfabetisch geeft
     op déze map hetzelfde antwoord. Daarom staat deze proef op de sortering
     zelf en niet op de map: hij gaat over bestand 100, dat alfabetisch tussen
     10 en 11 belandt. Dat is de dag waarop de controle stilletjes het verkeerde
     bestand aanwijst. */
  it('sorteert op het nummer en niet op de naam', () => {
    expect(opNummer(['10-b.sql', '9-a.sql', '100-c.sql', '11-d.sql']))
      .toEqual(['9-a.sql', '10-b.sql', '11-d.sql', '100-c.sql'])
  })

  it('en levert de map in die volgorde', () => {
    const nummers = verslagbestanden(MAP).map((f) => parseInt(f, 10))
    expect(nummers).toEqual([...nummers].sort((a, b) => a - b))
    expect(nummers.length).toBeGreaterThan(9)
  })

  it('neemt alleen genummerde verslagen mee en niet de controle zelf', () => {
    expect(verslagbestanden(MAP).some((f) => f.startsWith('controle'))).toBe(false)
  })
})

describe('het verslag en de bestanden', () => {
  const uitBestanden = functiesUitMap(MAP)
  const uitControle = verwachtUitControle(readFileSync(CONTROLE, 'utf8'))

  it('kent elke functie die deze map neerzet', () => {
    expect([...uitControle.keys()].sort()).toEqual([...uitBestanden.keys()].sort())
  })

  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. */
  it('en noemt bij elke functie hetzelfde bestand en dezelfde vingerafdruk', () => {
    const scheef = [...uitBestanden].filter(([naam, x]) => {
      const y = uitControle.get(naam)
      return !y || y.md5 !== x.md5 || y.bestand !== x.bestand
    }).map(([naam]) => naam)
    expect(scheef).toEqual([])
  })
})
