/**
 * DE GRENS OP HET SCHERM IS DE GRENS IN DE DATABASE
 *
 * `zoekgrens.ts` draagt getallen die ergens anders vandaan komen: de `limit`
 * die in `kal_zoeken` staat. Overgeschreven getallen lopen uit elkaar, en dat
 * gebeurt stil: verandert de SQL naar twintig, dan blijft het scherm "Dit zijn
 * de eerste 15" zeggen terwijl er twintig staan, en dan is de melding zelf een
 * onwaarheid geworden.
 *
 * Deze proef leest daarom het SQL-bestand en telt wat erin staat. Hij toetst
 * geen gedrag van de app maar de band tussen twee bestanden, en dat is precies
 * de soort band die niemand nakijkt.
 *
 * WAAROM DIT BESTAND EN NIET DE DATABASE
 *
 * Omdat de repo het verslag is en `controle-md5.sql` al bewaakt dat de database
 * met de repo klopt. Twee schakels, allebei getoetst, en geen van beide vraagt
 * om een verbinding vanaf hier.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { VASTE_GRENS, afgekapt, afgekaptZin, grensVan } from './zoekgrens'

const BESTAND = 'health/database/46-zeven-functies-gelijktrekken.sql'

/** De tekst van `kal_zoeken`, van zijn kop tot het einde van zijn body. */
function lichaam(): string {
  const bron = readFileSync(BESTAND, 'utf8')
  const van = bron.indexOf('CREATE OR REPLACE FUNCTION public.kal_zoeken')
  expect(van, 'kal_zoeken staat niet meer in dit bestand').toBeGreaterThan(0)
  const tot = bron.indexOf('$function$;', van)
  expect(tot).toBeGreaterThan(van)
  return bron.slice(van, tot)
}

describe('de grenzen van kal_zoeken', () => {
  /* DE PROEF WAAR DIT BESTAND VOOR BESTAAT. Vier keer `limit 15`: twee voor de
     gerechten (twee deellijsten in een coalesce), een voor je eigen producten
     en een voor de merken. Verandert er een, dan liegt de zin op het scherm. */
  it('staan vier keer als limit 15 in de SQL', () => {
    const vast = lichaam().match(/limit\s+(\d+)/gi) ?? []
    expect(vast).toHaveLength(4)
    for (const l of vast) {
      expect(Number(l.replace(/limit\s+/i, ''))).toBe(VASTE_GRENS)
    }
  })

  /* En nevo hoort de grens te krijgen die het scherm vraagt, met een dak van
     vijftig. Staat daar ooit een vast getal, dan klopt grensVan() niet meer. */
  it('en nevo krijgt p_limiet mee, met vijftig als dak', () => {
    expect(lichaam()).toContain('kal_nevo_zoek(p_q, least(coalesce(p_limiet, 25), 50))')
  })
})

describe('wanneer een emmer vol zit', () => {
  it('kapt nevo af op wat het scherm vraagt', () => {
    expect(grensVan('nevo', 12)).toBe(12)
    expect(afgekapt('nevo', 12, 12)).toBe(true)
    expect(afgekapt('nevo', 11, 12)).toBe(false)
  })

  /* Vraagt een scherm meer dan de database geeft, dan is vijftig de grens en
     niet wat er gevraagd werd. Anders zou de melding nooit komen. */
  it('en op vijftig als een scherm meer vraagt dan dat', () => {
    expect(grensVan('nevo', 200)).toBe(50)
    expect(afgekapt('nevo', 50, 200)).toBe(true)
  })

  it('de drie vaste emmers zitten vol bij vijftien', () => {
    for (const e of ['gerechten', 'eigen', 'merk'] as const) {
      expect(grensVan(e, 12)).toBe(15)
      expect(afgekapt(e, 15, 12)).toBe(true)
      expect(afgekapt(e, 14, 12)).toBe(false)
    }
  })

  /* Je eigen maaltijden kent geen limit in de SQL, dus daar hoort nooit een
     melding te staan. Een melding bij een volledige lijst is net zo fout als
     geen melding bij een afgekapte. */
  it('en je eigen maaltijden kappen niet af', () => {
    expect(grensVan('maaltijden', 12)).toBeNull()
    expect(afgekapt('maaltijden', 999, 12)).toBe(false)
  })

  /* Meer dan de grens kan niet, maar als het ooit gebeurt hoort de melding te
     komen. Met === zou hij juist dan wegblijven. */
  it('en meer dan de grens telt ook als vol', () => {
    expect(afgekapt('merk', 16, 12)).toBe(true)
  })
})

describe('de zin erbij', () => {
  it('noemt het getal en zegt wat je kunt doen', () => {
    const zin = afgekaptZin(15)
    expect(zin).toContain('15')
    expect(zin).toMatch(/typ er dan een woord bij/)
  })

  /* De regel uit CLAUDE.md, hier waar een zin wordt opgebouwd uit een getal.
     Repo-breed staat hij in schermtekst.proef.ts; deze hoort erbij omdat de
     tekst hier pas bij het draaien ontstaat en dus niet in de bytes staat. */
  it('en draagt geen gedachtestreepje', () => {
    expect(afgekaptZin(15)).not.toMatch(/[–—]/)
  })
})
