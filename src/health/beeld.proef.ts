/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Dat er niets verschijnt waar niets hoort. Een foto die bij het verkeerde
 * product staat is erger dan geen foto: hij zegt met stelligheid iets onjuists
 * over wat je gaat eten, en niemand controleert een plaatje.
 *
 * Verder dat de lijst kort blijft. Groeit hij ooit voorbij een handvol, dan is
 * dat het moment om de vraag opnieuw te stellen of hij niet in de database
 * hoort — en niet iets wat ongemerkt gebeurt.
 */
import { describe, expect, it } from 'vitest'
import { FOTOS, GERECHTFOTOS, fotoVoor, fotoVoorGerecht, gerechtsleutel } from './beeld'

describe('opzoeken', () => {
  it('geeft een pad voor een code die in de lijst staat', () => {
    expect(fotoVoor('151')).toBe('/health/eten/food_banana.png')
  })

  it('geeft null voor alles wat er niet in staat', () => {
    expect(fotoVoor('9999')).toBeNull()
    expect(fotoVoor('')).toBeNull()
    expect(fotoVoor(null)).toBeNull()
    expect(fotoVoor(undefined)).toBeNull()
  })

  /* Een code als '__proto__' of 'constructor' mag geen pad opleveren. Een
     gewone objectopzoeking geeft daar de ingebouwde eigenschap terug, en dan
     staat er ineens een <img src="/health/eten/function Object..."> op het
     scherm. */
  it('trapt niet in ingebouwde eigenschappen', () => {
    expect(fotoVoor('__proto__')).toBeNull()
    expect(fotoVoor('constructor')).toBeNull()
    expect(fotoVoor('toString')).toBeNull()
  })
})

describe('de lijst zelf', () => {
  it('wijst alleen naar bestanden in de eigen map', () => {
    for (const bestand of Object.values(FOTOS)) {
      expect(bestand).toMatch(/^food_[a-z_]+\.png$/)
    }
  })

  it('blijft klein genoeg om met de hand na te lopen', () => {
    expect(Object.keys(FOTOS).length).toBeLessThanOrEqual(20)
  })
})

/**
 * WAT DE TWEEDE LIJST MOET VASTHOUDEN
 *
 * Dezelfde belofte als de eerste, plus één die er alleen bij gerechten toe
 * doet: de sleutel mag niet gedeeltelijk matchen. 'Harira met lam' is een ander
 * gerecht dan 'Harira', en als de lijst dat verschil laat vallen staat er een
 * foto zonder lam bij een gerecht met lam.
 */
describe('gerechtsleutel', () => {
  it('haalt accenten en hoofdletters weg', () => {
    expect(gerechtsleutel('Harira')).toBe('harira')
    expect(gerechtsleutel('Zaälouk')).toBe('zaalouk')
  })

  it('behandelt de Turkse dotloze i, die NFD laat staan', () => {
    expect(gerechtsleutel('Mercimek çorbası')).toBe('mercimek corbasi')
    expect(gerechtsleutel('Bulgur pilavı')).toBe('bulgur pilavi')
  })

  it('maakt van elke reeks scheidingstekens één spatie', () => {
    expect(gerechtsleutel('  Kefta-tajine  (met ei) ')).toBe('kefta tajine met ei')
  })
})

describe('opzoeken van een gerechtfoto', () => {
  it('geeft een pad voor een gerecht dat in de lijst staat', () => {
    expect(fotoVoorGerecht('Harira')).toBe('/health/gerechten/harira.jpg')
    expect(fotoVoorGerecht('harira')).toBe('/health/gerechten/harira.jpg')
  })

  it('geeft null voor alles wat er niet in staat', () => {
    expect(fotoVoorGerecht('Bestaat niet')).toBeNull()
    expect(fotoVoorGerecht('')).toBeNull()
    expect(fotoVoorGerecht(null)).toBeNull()
    expect(fotoVoorGerecht(undefined)).toBeNull()
  })

  /* De belangrijkste van allemaal: bijna-goed is fout. */
  it('matcht niet gedeeltelijk', () => {
    expect(fotoVoorGerecht('Harira met lam')).toBeNull()
    expect(fotoVoorGerecht('Har')).toBeNull()
  })

  it('trapt niet in ingebouwde eigenschappen', () => {
    expect(fotoVoorGerecht('__proto__')).toBeNull()
    expect(fotoVoorGerecht('constructor')).toBeNull()
    expect(fotoVoorGerecht('toString')).toBeNull()
  })
})

describe('de gerechtenlijst zelf', () => {
  it('wijst alleen naar bestanden in de eigen map', () => {
    for (const bestand of Object.values(GERECHTFOTOS)) {
      expect(bestand).toMatch(/^[a-z0-9-]+\.jpg$/)
    }
  })

  /* Een sleutel die zelf niet genormaliseerd is, kan per definitie nooit
     getroffen worden. Dat is een typefout die anders stil blijft. */
  it('heeft uitsluitend genormaliseerde sleutels', () => {
    for (const sleutel of Object.keys(GERECHTFOTOS)) {
      expect(gerechtsleutel(sleutel)).toBe(sleutel)
    }
  })

  /* DE NAAM ZOALS HIJ IN DE DATABASE STAAT
     De vorige toets kijkt of een sleutel genormaliseerd is; die zegt niets over
     de vraag of hij ooit ergens op slaat. 'kefta tajine met ei' is keurig
     genormaliseerd en treft niets, want het gerecht heet 'Kefta-tajine met ei
     en tomaat'. Daarom staan de namen hier voluit, overgenomen uit
     `cultural_dishes.name_nl`, en rekent de toets de sleutel er zelf uit. Wie
     een naam in de database verandert, hoort deze regel te zien omvallen. */
  it('treft de gerechten zoals ze in de bibliotheek heten', () => {
    const uit_de_database: ReadonlyArray<readonly [string, string]> = [
      ['Harira', 'harira.jpg'],
      ['Zaalouk (auberginesalade)', 'zaalouk.jpg'],
      ['Couscous met zeven groenten en lamsvlees', 'couscous-zeven-groenten.jpg'],
      ['Kefta-tajine met ei en tomaat', 'kefta-tajine.jpg'],
      ['Bulgur pilavı', 'bulgur-pilavi.jpg'],
      ['Mercimek çorbası (rode linzensoep)', 'mercimek-corbasi.jpg'],
      ['Fattoush', 'fattoush.jpg'],
      ['Kibbeh', 'kibbeh.jpg'],
      ['Roti met kip, kousenband en aardappel', 'roti-kip.jpg'],
      ['Heri heri met bakkeljauw', 'heri-heri.jpg'],
      ['Erwtensoep met vlees', 'erwtensoep.jpg'],
    ]
    for (const [naam, bestand] of uit_de_database) {
      expect(fotoVoorGerecht(naam), naam).toBe('/health/gerechten/' + bestand)
    }
    /* En er is er één die met opzet géén foto heeft: bij 'Kuru fasulye' lag een
       foto van kikkererwten. Staat hier ooit een pad, dan is die zonder keuring
       gekoppeld. */
    expect(fotoVoorGerecht('Kuru fasulye (witte bonen)')).toBeNull()
  })

  /* Elk gerecht één eigen foto: twee gerechten die naar hetzelfde bestand
     wijzen is precies de 'ongeveer dit soort ding'-koppeling die de kop van
     `beeld.ts` verbiedt. Bij producten mag het wel — daar staat waarom. */
  it('geeft geen twee gerechten dezelfde foto', () => {
    const bestanden = Object.values(GERECHTFOTOS)
    expect(new Set(bestanden).size).toBe(bestanden.length)
  })
})
