/**
 * DE CONTROLE OP DE VRAAGBAAK
 *
 * Het model kiest, de app kijkt na. Dat nakijken is het enige wat tussen een
 * verzonnen onderwerp en een knop op het scherm van een kind staat, dus het
 * staat hier op alle manieren vast waarop het mis kan gaan: een sleutel die
 * niet bestaat, dezelfde sleutel twee keer, meer dan er passen, een leeg
 * antwoord, en een gat dat geclaimd wordt terwijl er wél iets is aangewezen.
 *
 * Er wordt hier niet met een model gepraat. `catalogus` en `verwerk` zijn
 * gewone functies over gewone gegevens; dat is precies waarom ze los staan van
 * `stel`.
 */
import { describe, expect, it } from 'vitest'
import { catalogus, sleutelVan, verwerk } from './vraagbaak'
import type { Ingang } from './vraagbaak'
import type { Kaart } from './gegevens/soorten'
import { leegVoortgang, schoonVoortgang, voegSamen } from './opslag'
import type { Stand, Vraagregel } from './opslag'

const kaart = (id: string, p: string, v: string, t: string, jaar?: 'next'): Kaart =>
  ({ id, p, v, t, q: 'vraag', a: '1', ...(jaar ? { jaar } : {}) }) as Kaart

const STOF: Kaart[] = [
  kaart('r1', 'amine', 'rekenen', 'Breuken'),
  kaart('r2', 'amine', 'rekenen', 'Breuken'),
  kaart('r3', 'amine', 'rekenen', 'Procenten'),
  kaart('r4', 'amine', 'taal', 'Werkwoordspelling'),
  kaart('r5', 'amine', 'rekenen', 'Machten', 'next'),
  kaart('x1', 'selma', 'rekenen', 'Tafels'),
]

const LEEG = schoonVoortgang(leegVoortgang())

describe('de catalogus', () => {
  const cat = catalogus(STOF, 'amine', LEEG)

  it('neemt alleen de stof van dit kind', () => {
    expect(cat.some((i) => i.onderwerp === 'Tafels')).toBe(false)
    expect(cat).toHaveLength(4)
  })

  it('telt de opgaven per onderwerp bij elkaar', () => {
    expect(cat.find((i) => i.onderwerp === 'Breuken')?.n).toBe(2)
    expect(cat.find((i) => i.onderwerp === 'Procenten')?.n).toBe(1)
  })

  it('houdt de twee leerjaren uit elkaar', () => {
    const machten = cat.find((i) => i.onderwerp === 'Machten')
    expect(machten?.jaar).toBe('next')
    expect(machten?.s).toBe('rekenen|Machten|next')
    expect(cat.find((i) => i.onderwerp === 'Breuken')?.jaar).toBe('nu')
  })

  it('zet de nette vaknaam erbij, en de sleutel de ruwe', () => {
    const b = cat.find((i) => i.onderwerp === 'Breuken')
    expect(b?.vak).toBe('Rekenen')
    expect(b?.vakSleutel).toBe('rekenen')
  })

  it('telt mee hoeveel er al beheerst is', () => {
    const geoefend = schoonVoortgang({
      ...leegVoortgang(), cards: { r1: { box: 5, ok: 9, wrong: 0, last: 0 } },
    })
    const c2 = catalogus(STOF, 'amine', geoefend)
    expect(c2.find((i) => i.onderwerp === 'Breuken')?.beheerst).toBe(1)
  })
})

describe('het nakijken van wat het model aanwijst', () => {
  const cat = catalogus(STOF, 'amine', LEEG)

  it('laat door wat echt bestaat', () => {
    const u = verwerk({ antwoord: 'Kijk hier.', routes: ['rekenen|Breuken|nu'] }, cat)
    expect(u.routes.map((r) => r.onderwerp)).toEqual(['Breuken'])
    expect(u.verzonnen).toEqual([])
  })

  /* Dit is waar de hele module om draait. */
  it('gooit een verzonnen onderwerp weg', () => {
    const u = verwerk({ routes: ['rekenen|Staartdelingen|nu', 'rekenen|Breuken|nu'] }, cat)
    expect(u.routes.map((r) => r.onderwerp)).toEqual(['Breuken'])
    expect(u.verzonnen).toEqual(['rekenen|Staartdelingen|nu'])
  })

  it('trapt niet in een bestaand onderwerp onder het verkeerde vak', () => {
    const u = verwerk({ routes: ['taal|Breuken|nu'] }, cat)
    expect(u.routes).toEqual([])
    expect(u.verzonnen).toEqual(['taal|Breuken|nu'])
  })

  it('trapt niet in het juiste onderwerp onder het verkeerde jaar', () => {
    const u = verwerk({ routes: ['rekenen|Breuken|next'] }, cat)
    expect(u.routes).toEqual([])
  })

  it('telt dezelfde sleutel één keer', () => {
    const u = verwerk({ routes: ['rekenen|Breuken|nu', 'rekenen|Breuken|nu'] }, cat)
    expect(u.routes).toHaveLength(1)
  })

  it('houdt het bij drie: een lijstje van tien is weer een keuze', () => {
    const u = verwerk({
      routes: ['rekenen|Breuken|nu', 'rekenen|Procenten|nu', 'taal|Werkwoordspelling|nu',
        'rekenen|Machten|next'],
    }, cat)
    expect(u.routes).toHaveLength(3)
    expect(u.routes.map((r) => r.onderwerp)).toEqual(['Breuken', 'Procenten', 'Werkwoordspelling'])
  })

  it('houdt de volgorde van het model aan', () => {
    const u = verwerk({ routes: ['taal|Werkwoordspelling|nu', 'rekenen|Breuken|nu'] }, cat)
    expect(u.routes.map((r) => r.onderwerp)).toEqual(['Werkwoordspelling', 'Breuken'])
  })
})

describe('het gat', () => {
  const cat = catalogus(STOF, 'amine', LEEG)

  it('blijft staan als er niets is aangewezen', () => {
    const u = verwerk({ antwoord: 'Dat staat er nog niet in.', routes: [], gat: 'Staartdelen' }, cat)
    expect(u.gat).toBe('Staartdelen')
  })

  /* Anders belandt elke vraag in de ouderlijst met "hier ontbreekt iets",
     terwijl het kind gewoon een knop kreeg. */
  it('vervalt zodra er wél iets is aangewezen', () => {
    const u = verwerk({ routes: ['rekenen|Breuken|nu'], gat: 'Staartdelen' }, cat)
    expect(u.gat).toBeNull()
  })

  it('vervalt ook als alles wat het model noemde verzonnen was', () => {
    const u = verwerk({ routes: ['rekenen|Onzin|nu'], gat: '   ' }, cat)
    expect(u.gat).toBeNull()
    expect(u.verzonnen).toHaveLength(1)
  })

  /* Dit is het geval waar het scherm op stukliep: geen route, geen gat. Het
     kind zag een alinea en verder niets. `verwerk` hoort hier niets te
     verzinnen — maar `verzonnen` moet wel blijven staan, want dat is het enige
     verschil tussen "hier is niets voor" en "de vraagbaak wees ernaast", en
     `Vraagveld` en het ouderscherm hangen er allebei aan. */
  it('houdt vast wat het model aanwees toen er niets van overbleef', () => {
    const u = verwerk({ antwoord: 'Een werkwoord is een doewoord.', routes: ['taal|Vervoeging|nu'] }, cat)
    expect(u.routes).toEqual([])
    expect(u.gat).toBeNull()
    expect(u.verzonnen).toEqual(['taal|Vervoeging|nu'])
    expect(u.antwoord).not.toBe('')
  })
})

describe('rommel uit het antwoord', () => {
  const cat: Ingang[] = catalogus(STOF, 'amine', LEEG)

  it('valt niet om op een leeg antwoord', () => {
    const u = verwerk({}, cat)
    expect(u).toEqual({ antwoord: '', routes: [], gat: null, verzonnen: [] })
  })

  it('valt niet om als routes geen lijst is', () => {
    expect(verwerk({ routes: 'rekenen|Breuken|nu' }, cat).routes).toEqual([])
  })

  it('bouwt dezelfde sleutel als de catalogus', () => {
    expect(sleutelVan('rekenen', 'Breuken', 'nu')).toBe('rekenen|Breuken|nu')
    expect(sleutelVan('rekenen', 'Machten', 'next')).toBe('rekenen|Machten|next')
    expect(sleutelVan('rekenen', 'Machten', 'onzin')).toBe('rekenen|Machten|nu')
  })
})


/**
 * DE VRAGENLIJST OVERLEEFT HET SAMENVOEGEN
 *
 * Het ouderscherm bestaat om te tonen wat de kinderen vroegen. Die lijst stond
 * in de stand, en `voegSamen` nam alleen de stand van dít toestel over. Dus:
 * Amine vraagt iets op de tablet, papa opent de app op zijn telefoon, de
 * samenvoeging gooit de lijst weg — en omdat de uitkomst daarna naar de wolk
 * wordt teruggeschreven (`wolk.ts`), was hij ook daar verdwenen. Het scherm
 * wiste zichzelf dus zodra er een tweede toestel meedeed.
 *
 * `voegSamen` had geen enkele proef. Dat is hoe dit er zo lang in kon zitten.
 */
describe('de vragen bij het samenvoegen van twee toestellen', () => {
  const vraag = (tijd: number, pid: string, tekst: string): Vraagregel =>
    ({ tijd, pid, vraag: tekst, raak: [], gat: null })

  const met = (v: Vraagregel[]): Partial<Stand> => ({ vragen: v })

  it('houdt wat er aan de overkant stond', () => {
    const uit = voegSamen(met([]), met([vraag(2, 'amine', 'werkwoord vervoeging')]))
    expect(uit.vragen?.map((v) => v.vraag)).toEqual(['werkwoord vervoeging'])
  })

  it('houdt wat er aan beide kanten stond, nieuwste eerst', () => {
    const uit = voegSamen(
      met([vraag(3, 'selma', 'klokkijken')]),
      met([vraag(1, 'amine', 'breuken'), vraag(5, 'wassima', 'pythagoras')]),
    )
    expect(uit.vragen?.map((v) => v.vraag)).toEqual(['pythagoras', 'klokkijken', 'breuken'])
  })

  it('telt dezelfde vraag één keer, ook als hij van beide kanten komt', () => {
    const zelfde = vraag(7, 'amine', 'werkwoord vervoeging')
    const uit = voegSamen(met([zelfde]), met([{ ...zelfde }]))
    expect(uit.vragen).toHaveLength(1)
  })

  /* Twee kinderen die toevallig op dezelfde milliseconde dezelfde vraag stellen
     bestaat niet; twee kinderen met dezelfde vraag op een ander moment wel. */
  it('houdt dezelfde vraag van twee kinderen apart', () => {
    const uit = voegSamen(
      met([vraag(1, 'amine', 'breuken optellen')]),
      met([vraag(2, 'selma', 'breuken optellen')]),
    )
    expect(uit.vragen?.map((v) => v.pid)).toEqual(['selma', 'amine'])
  })

  it('houdt er honderd, en gooit de oudste weg', () => {
    const veel = Array.from({ length: 80 }, (_, i) => vraag(i + 1, 'amine', 'vraag ' + i))
    const meer = Array.from({ length: 80 }, (_, i) => vraag(i + 101, 'selma', 'ander ' + i))
    const uit = voegSamen(met(veel), met(meer))
    expect(uit.vragen).toHaveLength(100)
    expect(uit.vragen?.[0]?.tijd).toBe(180)
    /* De oudste van de honderd is 61: alles daaronder valt eraf. */
    expect(uit.vragen?.[99]?.tijd).toBe(61)
  })

  it('valt niet om als geen van beide kanten vragen heeft', () => {
    expect(voegSamen({}, {}).vragen).toEqual([])
  })

  it('neemt mee wat de vraagbaak weggooide, want dat is het hele verschil', () => {
    const raar: Vraagregel = {
      tijd: 9, pid: 'amine', vraag: 'werkwoord vervoeging', raak: [], gat: null,
      verzonnen: ['taal|Vervoeging|nu'],
    }
    const uit = voegSamen({}, met([raar]))
    expect(uit.vragen?.[0]?.verzonnen).toEqual(['taal|Vervoeging|nu'])
  })
})
