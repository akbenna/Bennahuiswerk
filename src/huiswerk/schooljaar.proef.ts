/**
 * HET SCHOOLJAAR, EN DE UITZONDERING DAARIN
 *
 * Twee dingen staan hier vast.
 *
 * Het eerste is Wassima. Zij doet 2 havo over. Van de vier kinderen is zij de
 * enige die niet opschuift, en dat is precies het soort detail dat een volgende
 * hand "gelijktrekt" met de rest omdat het eruitziet als een vergeten regel.
 * Dan ziet een kind dat net is blijven zitten stof die het nooit gehad heeft.
 * Vandaar dat het hier met zoveel woorden staat.
 *
 * Het tweede is dat elk rekenkundig antwoord in de nieuwe stof opnieuw wordt
 * uitgerekend. Ze zijn nagerekend voordat ze in het bestand kwamen, maar een
 * getal dat één keer klopte blijft niet vanzelf kloppen als iemand er later een
 * cijfer in verandert.
 */
import { describe, expect, it } from 'vitest'
import { PROFIELEN, PROFIELEN_OUD } from './gegevens/profielen'
import { KLASSEN, SCHOOLJAAR, jaarNu, naarDitJaar } from './gegevens/schooljaar'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { SEED } from './gegevens/seed'
import { sjablonen } from './gegevens/sjablonen'
import { MIN_VOORRAAD, opNiveau } from './leitner'
import type { Kaart } from './gegevens/soorten'

describe('wie er dit schooljaar in welke klas zit', () => {
  it('is ingevuld voor 2026/27', () => {
    expect(SCHOOLJAAR).toBe('2026/27')
  })

  /* De regel waar het om gaat. */
  it('laat Wassima 2 havo overdoen en zet haar niet een jaar hoger', () => {
    expect(KLASSEN.wassima?.overgegaan).toBe(false)
    expect(PROFIELEN.wassima?.niveau).toBe('2 havo')
    expect(PROFIELEN.wassima?.volgend).toBe('3 havo')
  })

  it('heeft de andere drie wél een klas laten opschuiven', () => {
    expect(PROFIELEN.amaani?.niveau).toBe('5 vwo')
    expect(PROFIELEN.amine?.niveau).toBe('groep 8')
    expect(PROFIELEN.selma?.niveau).toBe('groep 5')
    for (const pid of ['amaani', 'amine', 'selma']) {
      expect(KLASSEN[pid]?.overgegaan, pid).toBe(true)
    }
  })

  /* De vaste lijst is het bewijs dat de overzetting uit de oude pagina klopte.
     Die hoort niet mee te schuiven met het schooljaar. */
  it('laat het migratieverslag ongemoeid', () => {
    expect(PROFIELEN_OUD.wassima?.niveau).toBe('2 havo')
    expect(PROFIELEN_OUD.amine?.niveau).toBe('groep 7')
    expect(PROFIELEN_OUD.selma?.niveau).toBe('groep 4')
    expect(PROFIELEN_OUD.amaani?.niveau).toBe('4 vwo')
  })

  it('houdt verder alles uit het verslag overeind', () => {
    for (const [pid, oud] of Object.entries(PROFIELEN_OUD)) {
      const nu = PROFIELEN[pid]
      expect(nu?.naam, pid).toBe(oud.naam)
      expect(nu?.emoji, pid).toBe(oud.emoji)
      expect(nu?.vakken, pid).toEqual(oud.vakken)
      expect(nu?.beloning, pid).toBe(oud.beloning)
    }
  })
})

describe('het leerjaar van de opgaven', () => {
  it('schuift de stof van volgend jaar naar nu voor wie is overgegaan', () => {
    expect(jaarNu({ p: 'amine', jaar: 'next' })).toBe('nu')
    expect(jaarNu({ p: 'selma', jaar: 'next' })).toBe('nu')
    expect(jaarNu({ p: 'amaani', jaar: 'next' })).toBe('nu')
  })

  it('laat de vooruitblik van Wassima staan waar hij staat', () => {
    expect(jaarNu({ p: 'wassima', jaar: 'next' })).toBe('next')
  })

  it('raakt de stof van dit jaar nooit aan', () => {
    for (const pid of ['wassima', 'amaani', 'amine', 'selma']) {
      expect(jaarNu({ p: pid }), pid).toBe('nu')
      expect(jaarNu({ p: pid, jaar: 'nu' }), pid).toBe('nu')
    }
  })

  it('haalt het veld weg in plaats van het op undefined te zetten', () => {
    const [uit] = naarDitJaar([{ p: 'amine', jaar: 'next' }])
    expect(uit).toEqual({ p: 'amine' })
    expect('jaar' in (uit ?? {})).toBe(false)
  })

  it('verandert niets anders aan een opgave', () => {
    const heen = SEED.filter((e) => e.p === 'amine' && e.jaar === 'next')
    const terug = naarDitJaar(heen)
    expect(terug).toHaveLength(heen.length)
    terug.forEach((e, i) => {
      expect(e.id).toBe(heen[i]?.id)
      expect(e.q).toBe(heen[i]?.q)
      expect(e.a).toBe(heen[i]?.a)
    })
  })

  it('geeft de drie overgegane kinderen daadwerkelijk meer stof voor dit jaar', () => {
    const heen = naarDitJaar(SEED)
    for (const pid of ['amaani', 'amine', 'selma']) {
      const voor = SEED.filter((e) => e.p === pid && (e.jaar ?? 'nu') === 'nu').length
      const na = heen.filter((e) => e.p === pid && (e.jaar ?? 'nu') === 'nu').length
      expect(na, pid).toBeGreaterThan(voor)
    }
    const wVoor = SEED.filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu').length
    const wNa = heen.filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu').length
    expect(wNa).toBe(wVoor)
  })
})

describe('de nieuwe opgaven voor 2026/27', () => {
  it('heeft geen id die botst met de vaste lijst', () => {
    const seedIds = new Set(SEED.map((e) => e.id))
    for (const e of NIEUW2627) expect(seedIds.has(e.id), e.id).toBe(false)
    expect(new Set(NIEUW2627.map((e) => e.id)).size).toBe(NIEUW2627.length)
  })

  /* Zij doet 2 havo over. Nieuwe stof mag, maar alleen op háár niveau: geen
     enkele opgave hier mag als "volgend jaar" gemarkeerd staan, want dan zou ze
     3-havo-werk voorgeschoteld krijgen dat ze nooit gehad heeft. */
  it('geeft Wassima alleen 2-havo-stof en niets van volgend jaar', () => {
    const hare = NIEUW2627.filter((e) => e.p === 'wassima')
    expect(hare.length).toBeGreaterThan(0)
    for (const e of hare) expect(e.jaar, e.id).toBeUndefined()
  })

  it('hoort helemaal bij dit jaar, niet bij volgend jaar', () => {
    for (const e of NIEUW2627) expect(e.jaar, e.id).toBeUndefined()
  })

  it('heeft overal een vraag, een antwoord en een uitwerking', () => {
    for (const e of NIEUW2627) {
      expect(e.q.trim().length, e.id).toBeGreaterThan(5)
      expect(String(e.a).trim().length, e.id).toBeGreaterThan(0)
      expect((e.s ?? '').trim().length, e.id).toBeGreaterThan(5)
      expect(e.h?.length, e.id).toBeGreaterThan(0)
    }
  })

  it('geeft bij meerkeuze altijd een antwoord dat tussen de opties staat', () => {
    for (const e of NIEUW2627.filter((x) => x.opties?.length)) {
      expect(e.opties, e.id).toContain(e.a)
    }
  })

  it('zet nooit twee keer dezelfde optie onder één vraag', () => {
    for (const e of NIEUW2627.filter((x) => x.opties?.length)) {
      expect(new Set(e.opties).size, e.id).toBe(e.opties?.length)
    }
  })

  /* Bij het schrijven van de derde aanvulling bleek er een vraag tussen te
     zitten die letterlijk al in `seed.ts` stond. Eén dubbele opgave is niet erg,
     maar hij kost een kind wel twee keer dezelfde beurt en telt dubbel mee in
     zijn voortgang. Vandaar dat het hier vastligt. */
  it('herhaalt geen vraag die al in de vaste lijst staat', () => {
    const bestaand = new Set(SEED.map((e) => e.q.trim()))
    for (const e of NIEUW2627) expect(bestaand.has(e.q.trim()), e.q.slice(0, 60)).toBe(false)
    expect(new Set(NIEUW2627.map((e) => e.q.trim())).size).toBe(NIEUW2627.length)
  })
})

/**
 * DE MIDDELSTE TREDE
 *
 * Het niveau van een kind klimt vanzelf: drie keer goed en `autoLvl` gaat een
 * stap omhoog. `volgendeKaart` zoekt dan de opgave die het dichtst bij dat
 * doelniveau ligt, en "het dichtst bij" is geen "precies". Staat er bij een
 * onderwerp wel iets op 1 en op 3 maar niets op 2, dan valt de app daar
 * zwijgend op terug, en springt het kind van de makkelijkste variant naar de
 * moeilijkste zonder de stap ertussen.
 *
 * Dat gebeurde bij het voltooid deelwoord van Amine: zes opgaven op 1, zeven op
 * 3, niets op 2, dus van "gewerkt" rechtstreeks naar "verhuisd". En bij de
 * verwachtingswaarde van Amaani: van een zuivere dobbelsteen rechtstreeks naar
 * een spel met inleg.
 *
 * Het is geen fout die omvalt; hij is alleen te zien als je telt. Vandaar deze
 * proef.
 */
describe('elk onderwerp heeft zijn middelste trede', () => {
  /* De sjablonen dragen hun niveau op het sjabloon zelf, dus voor deze telling
     hoeft er geen som uit te rollen: elke bron van toeval voldoet. */
  const nep = { ri: (a: number) => a, pick: <T,>(x: readonly T[]) => x[0] as T,
    shuffle: <T,>(x: readonly T[]) => [...x] }
  const alles = naarDitJaar([...SEED, ...NIEUW2627, ...sjablonen(nep)] as Kaart[])
    .filter((e) => (e.jaar ?? 'nu') === 'nu')

  const perOnderwerp = new Map<string, number[]>()
  for (const e of alles) {
    const sleutel = `${e.p} · ${e.v} · ${e.t}`
    const lijst = perOnderwerp.get(sleutel) ?? []
    lijst.push(e.lvl ?? 1)
    perOnderwerp.set(sleutel, lijst)
  }

  it('slaat nergens niveau 2 over terwijl 1 en 3 er wel zijn', () => {
    const gaten: string[] = []
    for (const [sleutel, lvls] of perOnderwerp) {
      const tel = (n: number) => lvls.filter((x) => x === n).length
      if (tel(1) > 0 && tel(3) > 0 && tel(2) === 0) {
        gaten.push(`${sleutel} (1:${tel(1)} 2:0 3:${tel(3)})`)
      }
    }
    expect(gaten).toEqual([])
  })

  /* De twee die de aanleiding waren, apart vastgelegd, een lege lijst hierboven
     zegt niet wélke gaten er gedicht zijn. */
  it('heeft het voltooid deelwoord van Amine op alle drie de niveaus', () => {
    const lvls = perOnderwerp.get('amine · taal · Voltooid deelwoord') ?? []
    for (const n of [1, 2, 3]) {
      expect(lvls.filter((x) => x === n).length, `niveau ${n}`).toBeGreaterThan(0)
    }
  })

  it('heeft de verwachtingswaarde van Amaani op alle drie de niveaus', () => {
    const lvls = perOnderwerp.get('amaani · wiskundeA · Verwachtingswaarde') ?? []
    for (const n of [1, 2, 3]) {
      expect(lvls.filter((x) => x === n).length, `niveau ${n}`).toBeGreaterThan(0)
    }
  })
})

/**
 * De rekenkundige antwoorden opnieuw narekenen. Alleen de sommen waarvan de
 * uitkomst hier los te herleiden is, de taal- en begripsvragen staan er niet
 * tussen, en dat hoort ook niet: die zijn met de hand nagelopen.
 */
describe('de sommen kloppen nog steeds', () => {
  const zoek = (q: string): string => {
    const e = NIEUW2627.find((x) => x.q.includes(q))
    if (!e) throw new Error('opgave niet gevonden: ' + q)
    return String(e.a)
  }
  const getal = (t: string): number => Number(t.replace('−', '-').replace(',', '.'))

  it('rekent de procenten en verhoudingen van Amine na', () => {
    expect(getal(zoek('25% korting'))).toBe(80 * 0.75)
    expect(getal(zoek('Na 20% korting'))).toBe(48 / 0.8)
    expect(getal(zoek('btw is 21%'))).toBe(200 * 1.21)
    expect(getal(zoek('verhouding 3 : 5'))).toBe(40 * 3 / 8)
    expect(getal(zoek('cijfers 6, 7, 8, 5 en 9'))).toBe((6 + 7 + 8 + 5 + 9) / 5)
    expect(getal(zoek('3 cm bij 4 cm bij 5 cm'))).toBe(3 * 4 * 5)
    expect(getal(zoek('basis van 8 cm'))).toBe(8 * 5 / 2)
    expect(getal(zoek('1 : 25 000'))).toBe(4 * 25000 / 100000)
  })

  it('rekent de kansrekening en groei van Amaani na', () => {
    expect(getal(zoek('zuivere dobbelsteen'))).toBe((1 + 2 + 3 + 4 + 5 + 6) / 6)
    expect(getal(zoek('win je € 5 met kans 0,2'))).toBeCloseTo(0.2 * 5 - 0.8 * 2, 10)
    expect(getal(zoek('10 punten met kans 0,6'))).toBeCloseTo(0.6 * 10 + 0.4 * 20, 10)
    expect(getal(zoek('groepje van 3'))).toBe((10 * 9 * 8) / 6)
    expect(getal(zoek('5 verschillende boeken'))).toBe(120)
    expect(zoek('allebei rood')).toBe('5/14')
    expect(5 / 8 * 4 / 7).toBeCloseTo(5 / 14, 10)
    expect(getal(zoek('groeit met 3% per jaar'))).toBeCloseTo(1.03 ** 10, 3)
    expect(getal(zoek('groeifactor 0,9 per jaar'))).toBeCloseTo(Math.log(0.5) / Math.log(0.9), 2)
    expect(getal(zoek('van 200 naar 260'))).toBeCloseTo((260 / 200) ** (1 / 5), 3)
  })

  it('rekent de scheikunde en natuurkunde van Amaani na', () => {
    expect(getal(zoek('36,0 gram water'))).toBeCloseTo(36 / 18.02, 1)
    expect(getal(zoek('0,50 mol NaCl'))).toBeCloseTo(0.5 * 58.44, 1)
    expect(getal(zoek('van stilstand naar 20 m/s'))).toBe(20 / 8)
    expect(getal(zoek('versnelt met 2,5 m/s²'))).toBe(1200 * 2.5)
    expect(getal(zoek('kinetische energie'))).toBe(0.5 * 1200 * 400)
    expect(getal(zoek('in 8,0 s opgebouwd'))).toBe(240000 / 8)
    expect(getal(zoek('tilt 500 kg 12 m'))).toBeCloseTo(500 * 9.81 * 12, 6)
  })

  it('rekent de tweede aanvulling van Amine na', () => {
    expect(getal(zoek('15% van 240'))).toBe(240 * 0.15)
    expect(getal(zoek('3/5 als percentage'))).toBe(60)
    expect(getal(zoek('3,45 + 2,7'))).toBeCloseTo(6.15, 10)
    expect(getal(zoek('7,2 : 0,8'))).toBe(9)
    expect(getal(zoek('schaal 1 : 200'))).toBe(3.5 * 200 / 100)
    expect(getal(zoek('12 cm bij 7 cm'))).toBe(84)
    expect(getal(zoek('diameter van 10 cm'))).toBeCloseTo(31.4, 10)
    expect(getal(zoek('ribben van 4 cm'))).toBe(64)
    expect(getal(zoek('gemiddelde van vier getallen'))).toBe(12 * 4 - (10 + 11 + 13))
    expect(getal(zoek('120 km in 1,5 uur'))).toBe(80)
    expect(getal(zoek('eerst 20% korting en daarna'))).toBeCloseTo(100 * 0.8 * 0.9, 10)
  })

  it('rekent de tweede aanvulling van Amaani na', () => {
    expect(getal(zoek('2, 4, 4, 5 en 10'))).toBe(5)
    expect(getal(zoek('mediaan van 3, 7, 2, 9 en 5'))).toBe(5)
    expect(getal(zoek('standaardafwijking van de populatie'))).toBe(2)
    expect(getal(zoek('45 voor optie A'))).toBe(15)
    expect(getal(zoek('P(A en B) = 0,1'))).toBeCloseTo(0.7, 10)
    expect(getal(zoek('twee keer kop'))).toBe(0.25)
    expect(zoek('minstens één zes')).toBe('11/36')
    expect(1 - (5 / 6) ** 2).toBeCloseTo(11 / 36, 10)
    expect(getal(zoek('precies 3 keer kop'))).toBe(10 / 32)
    expect(getal(zoek('één prijs van € 500'))).toBe(500 / 1000 - 1)
    expect(getal(zoek('2 mensen kiezen uit 8'))).toBe(28)
    expect(getal(zoek('2¹⁰'))).toBe(1024)
    expect(getal(zoek('10ˣ = 1000'))).toBe(3)
    expect(getal(zoek('verdubbelingstijd'))).toBeCloseTo(Math.log(2) / Math.log(1.05), 2)
    expect(getal(zoek('elk jaar met 8% af'))).toBeCloseTo(0.92 ** 3, 3)
    expect(getal(zoek('22,0 gram CO'))).toBeCloseTo(22 / 44.01, 2)
    expect(getal(zoek('0,20 mol op in 500 mL'))).toBeCloseTo(0.4, 2)
    expect(getal(zoek('lamp van 60 W'))).toBeCloseTo(0.18, 2)
    expect(getal(zoek('waterkoker van 2000 W'))).toBe(600000)
    expect(getal(zoek('0,50 A bij 12 V'))).toBe(24)
    expect(getal(zoek('4,0 Ω staan parallel'))).toBe(2)
    expect(getal(zoek('steen valt 2,0 s'))).toBeCloseTo(9.81 * 2, 1)
    expect(getal(zoek('krijgt 1200 J en levert 300 J'))).toBe(25)
    expect(getal(zoek('prijsindex ging van 100 naar 105'))).toBe(5)
    expect(getal(zoek('nominaal 4% bij een inflatie'))).toBeCloseTo((1.04 / 1.02 - 1) * 100, 1)
    expect(getal(zoek('prijs stijgt met 10%'))).toBe(-2)
  })

  it('rekent de stof van Wassima na: op 2 havo, niet hoger', () => {
    expect(getal(zoek('150 exclusief btw'))).toBeCloseTo(150 * 1.21, 10)
    expect(getal(zoek('12 in en verkoopt het voor'))).toBe(8)
    expect(getal(zoek('procent is de brutowinst'))).toBe(40)
    expect(getal(zoek('rechthoekszijden van 6 en 8'))).toBe(10)
    expect(getal(zoek('y = 3x − 2. Bereken y'))).toBe(3 * 5 - 2)
    expect(getal(zoek('2x + 3 = 17'))).toBe(7)
  })

  it('rekent de sommen van Selma na', () => {
    expect(getal(zoek('9 × 7'))).toBe(63)
    expect(getal(zoek('6 × 9'))).toBe(54)
    expect(getal(zoek('47 + 38'))).toBe(85)
    expect(getal(zoek('92 − 47'))).toBe(45)
    expect(getal(zoek('35 : 5'))).toBe(7)
    expect(getal(zoek('€ 3,50'))).toBe(3.5 / 2)
    expect(getal(zoek('4 × 12'))).toBe(48)
    expect(getal(zoek('helft van 24'))).toBe(12)
    expect(getal(zoek('€ 5,00 voor iets van € 2,35'))).toBeCloseTo(2.65, 10)
    expect(getal(zoek('1/4 van 20'))).toBe(5)
  })
})

/**
 * DE UITBREIDING VAN WASSIMA
 *
 * Honderdnegentien opgaven erbij bij wiskunde en natuurkunde. Met zoveel sommen
 * tegelijk is met het oog nakijken geen controle meer, dus staat elk getal
 * hieronder los uitgerekend. `zoekUniek` is strenger dan de `zoek` hierboven:
 * die pakt de eerste treffer, en bij honderd nieuwe vragen is "de eerste" niet
 * vanzelf "de bedoelde".
 *
 * En de reden dát ze erbij kwamen staat er als proef onder: haar niveau klimt
 * mee met wat ze goed doet, dus elk onderwerp hoort op alle drie de treden iets
 * te hebben. Dat was bij achttien van de achtentwintig onderwerpen niet zo.
 */
describe('de uitbreiding voor Wassima bij wiskunde en natuurkunde', () => {
  const zoekUniek = (q: string): string => {
    const raak = NIEUW2627.filter((x) => x.p === 'wassima' && x.q.includes(q))
    if (raak.length !== 1) throw new Error(`${raak.length} treffers voor: ${q}`)
    return String(raak[0]?.a)
  }
  const getal = (t: string): number => Number(t.replace('−', '-').replace(',', '.'))
  const g = (q: string): number => getal(zoekUniek(q))

  it('rekent de rekenvolgorde, negatieve getallen en breuken na', () => {
    expect(g('5 × 3 − 8 ÷ 2')).toBe(5 * 3 - 8 / 2)
    expect(g('12 ÷ 4 + 2 × 5')).toBe(12 / 4 + 2 * 5)
    expect(g('2 + 3 × (8 − 5)²')).toBe(2 + 3 * (8 - 5) ** 2)
    expect(g('(6 + 2) × 3 − 4²')).toBe((6 + 2) * 3 - 4 ** 2)
    expect(g('40 − (3 + 2) × 2²')).toBe(40 - (3 + 2) * 2 ** 2)
    expect(g('−7 + 12')).toBe(-7 + 12)
    expect(g('−3 × (−4) + 5')).toBe(-3 * -4 + 5)
    expect(g('(−2)³')).toBe((-2) ** 3)
    expect(g('−15 ÷ 3 − (−4)')).toBe(-15 / 3 - -4)
    expect(g('2/3 van 27')).toBe(27 / 3 * 2)
    /* Breuken worden letterlijk nagekeken (`nakijken.ts`), dus hier ook. */
    expect(zoekUniek('1/2 + 1/3')).toBe('5/6')
    expect(1 / 2 + 1 / 3).toBeCloseTo(5 / 6, 10)
    expect(zoekUniek('3/4 × 2/5')).toBe('3/10')
    expect(3 / 4 * (2 / 5)).toBeCloseTo(3 / 10, 10)
    expect(g('2/3 ÷ 1/6')).toBe(2 / 3 / (1 / 6))
  })

  it('rekent de machten, verhoudingen en statistiek na', () => {
    expect(g('10³')).toBe(10 ** 3)
    expect(g('3² + 4²')).toBe(3 ** 2 + 4 ** 2)
    expect(g('√81 − √16')).toBe(Math.sqrt(81) - Math.sqrt(16))
    expect(g('2⁴ × 2²')).toBe(2 ** 4 * 2 ** 2)
    expect(g('Vier broodjes')).toBe(6 / 4)
    expect(g('300 g rijst')).toBe(300 / 4 * 6)
    expect(g('1 : 50 000')).toBe(6 * 50000 / 100000)
    expect(g('maquette heeft schaal 1 : 200')).toBe(30 * 100 / 200)
    expect(g('1 op 15')).toBe(240 / 15)
    expect(g('per dag zijn geleend')).toBe(3 + 5 + 2 + 6)
    expect(g('gemiddelde van 4, 6, 7, 7 en 9')).toBeCloseTo((4 + 6 + 7 + 7 + 9) / 5, 10)
    expect(g('mediaan van 2, 8, 5, 9, 4 en 6')).toBe((5 + 6) / 2)
    expect(g('gemiddelde van vijf cijfers is 7')).toBe(7 * 5 - (6 + 8 + 5 + 9))
  })

  it('rekent de procenten, vergelijkingen en formules na', () => {
    expect(g('250 leerlingen doet 36%')).toBe(250 * 0.36)
    expect(g('na 30% korting € 63')).toBe(63 / 0.7)
    expect(g('groeit twee jaar achter elkaar met 10%')).toBeCloseTo((1.1 ** 2 - 1) * 100, 10)
    expect(g('eerst 20% duurder')).toBeCloseTo(500 * 1.2 * 0.8, 10)
    expect(g('x − 9 = 4')).toBe(4 + 9)
    expect(g('x ÷ 3 = 7')).toBe(7 * 3)
    expect(g('5x − 4 = 3x + 10')).toBe((10 + 4) / (5 - 3))
    expect(g('7 − 2x = 1')).toBe((7 - 1) / 2)
    expect(g('3(x − 2) = 12')).toBe(12 / 3 + 2)
    expect(g('y = −2x + 9')).toBe(-2 * 3 + 9)
    expect(g('(2, 5) en (6, 17)')).toBe((17 - 5) / (6 - 2))
    expect(g('y = 4x − 6')).toBe((10 + 6) / 4)
    expect(g('€ 4 instaptarief')).toBe(4 + 1.5 * 12)
  })

  it('rekent de meetkunde na', () => {
    expect(g('12 cm lang en 7 cm breed')).toBe(2 * (12 + 7))
    expect(g('parallellogram heeft een basis van 9')).toBe(9 * 4)
    expect(g('straal van 5 cm. Bereken de omtrek')).toBeCloseTo(2 * 3.14 * 5, 10)
    expect(g('oppervlakte van 64 cm²')).toBe(4 * Math.sqrt(64))
    expect(g('trapezium')).toBe((6 + 10) / 2 * 4)
    expect(g('rechthoekszijden van 5 cm en 12 cm')).toBe(Math.sqrt(5 ** 2 + 12 ** 2))
    expect(g('9 cm lang en 12 cm breed')).toBe(Math.sqrt(9 ** 2 + 12 ** 2))
    expect(g('schuine zijde van een rechthoekige driehoek is 17'))
      .toBe(Math.sqrt(17 ** 2 - 8 ** 2))
    expect(g('vlieger')).toBe(Math.sqrt(25 ** 2 - 20 ** 2))
    expect(g('twee hoeken 40° en 60°')).toBe(180 - 40 - 60)
    expect(g('gelijkbenige driehoek zijn allebei 65°')).toBe(180 - 2 * 65)
    expect(g('Deze hoek is 125°')).toBe(180 - 125)
    expect(g('75°, 110° en 95°')).toBe(360 - 75 - 110 - 95)
    expect(g('Z-hoek is 72°')).toBe(180 - 72)
    expect(g('ribben van 6 cm')).toBe(6 ** 3)
    expect(g('6 cm bij 5 cm bij 4 cm')).toBe(6 * 5 * 4)
    expect(g('grondvlak van 20 cm²')).toBe(20 * 7)
    expect(g('straal van 3 cm en een hoogte van 10 cm')).toBeCloseTo(3.14 * 3 ** 2 * 10, 10)
    expect(g('inhoud van 240 cm³')).toBe(240 / (8 * 5))
  })

  it('rekent de beweging en de krachten na', () => {
    expect(g('Hoeveel gram is 2,5 kg')).toBe(2.5 * 1000)
    expect(g('cm³ is 1,5 liter')).toBe(1.5 * 1000)
    expect(g('72 km/u om naar m/s')).toBe(72 / 3.6)
    expect(g('seconden zijn 2,5 minuten')).toBe(2.5 * 60)
    expect(g('40 m af in 8 s')).toBe(40 / 8)
    expect(g('bus rijdt 54 km/u')).toBe(54 / 3.6)
    expect(g('trein rijdt met 30 m/s')).toBe(4500 / 30)
    expect(g('12 km in 50 minuten')).toBeCloseTo(12 / (50 / 60), 10)
    expect(g('grafiek af. Wat is de snelheid')).toBe(20 / 2)
    expect(g('1,5 km af in 25 minuten')).toBe(1500 / (25 * 60))
    /* De onderbouw rekent met g = 10 N/kg, zoals in de opgaven die er al
       stonden; op de formulekaart staat 9,81. */
    expect(g('fiets van 15 kg')).toBe(15 * 10)
    expect(g('200 N omlaag en 260 N omhoog')).toBe(260 - 200)
    expect(g('doos is 450 N')).toBe(450 / 10)
    expect(g('80 N naar rechts')).toBe(80 - 30)
    expect(g('C = 50 N/m')).toBeCloseTo(50 * 0.2, 10)
    expect(g('hang je 3 N')).toBe(6 / 3 * 5)
    expect(g('0,25 m uit bij een kracht van 20 N')).toBe(20 / 0.25)
    expect(g('C = 40 N/m')).toBe(2 * 10 / 40 * 100)
  })

  it('rekent de dichtheid, druk, energie en elektriciteit na', () => {
    expect(g('100 g en een volume van 50 cm³')).toBe(100 / 50)
    expect(g('250 cm³ water')).toBe(1 * 250)
    expect(g('2,7 g/cm³')).toBe(54 / 2.7)
    expect(g('100 N drukt op een vlak van 2 m²')).toBe(100 / 2)
    expect(g('2000 Pa')).toBe(2000 * 0.05)
    expect(g('lamp van 40 W')).toBe(40 * 120)
    expect(g('90 000 J in 3 minuten')).toBe(90000 / 180)
    expect(g('krijgt 2000 J')).toBe(1500 / 2000 * 100)
    expect(g('293 K')).toBe(293 - 273)
    expect(g('verwarmd tot 80 °C')).toBe(80 - 20)
    expect(g('0,4 A bij een spanning van 6 V')).toBe(6 / 0.4)
    expect(g('230 V gebruikt 0,5 A')).toBe(230 * 0.5)
    expect(g('25 Ω loopt een stroom van 0,8 A')).toBe(0.8 * 25)
    expect(g('4 Ω en 6 Ω staan in serie')).toBe(4 + 6)
    expect(g('van 6 Ω staan parallel')).toBe(1 / (1 / 6 + 1 / 6))
    expect(g('onder 30° met de normaal')).toBe(30)
    expect(g('65° met het spiegeloppervlak')).toBe(90 - 65)
    expect(g('donder 6 s na de bliksem')).toBe(340 * 6)
    expect(g('echo 0,5 s')).toBe(340 * 0.5 / 2)
  })

  /* Dít is waar de uitbreiding voor was. `volgendeKaart` pakt de opgave die het
     dichtst bij het doelniveau ligt; ontbreekt een trede, dan valt hij zwijgend
     terug op een andere en krijgt ze steeds dezelfde handvol sommen. */
  it('geeft elk onderwerp van wiskunde en natuurkunde alle drie de treden', () => {
    const hare = [...SEED, ...NIEUW2627]
      .filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu')
      .filter((e) => e.v === 'wiskunde' || e.v === 'natuurkunde')
    const per = new Map<string, number[]>()
    for (const e of hare) {
      const sleutel = `${e.v} · ${e.t}`
      per.set(sleutel, [...(per.get(sleutel) ?? []), e.lvl ?? 1])
    }
    expect(per.size).toBe(28)
    const mager: string[] = []
    for (const [sleutel, lvls] of per) {
      for (const n of [1, 2, 3]) {
        if (!lvls.includes(n)) mager.push(`${sleutel} mist niveau ${n}`)
      }
    }
    expect(mager).toEqual([])
  })

  it('heeft haar voorraad bij allebei de vakken meer dan verdubbeld', () => {
    /* Vóór de eerste uitbreiding stonden er bij wiskunde achtenzestig vaste
       opgaven en bij natuurkunde vijfenveertig (de sjablonen komen daar nog
       bovenop). Een getal dat alleen maar groeit zegt weinig; deze grenzen
       zeggen dat de aanvulling er nog steeds is en niet half is teruggedraaid. */
    const tel = (vak: string): number => [...SEED, ...NIEUW2627]
      .filter((e) => e.p === 'wassima' && e.v === vak && (e.jaar ?? 'nu') === 'nu').length
    expect(tel('wiskunde')).toBeGreaterThanOrEqual(230)
    expect(tel('natuurkunde')).toBeGreaterThanOrEqual(240)
  })
})

/**
 * DE NIVEAUKNOP MOET OOK IETS DÓEN
 *
 * "Vast op 3" beloofde moeilijker werk en leverde dat niet. `opNiveau` houdt
 * een ondergrens van zes sommen aan (`MIN_VOORRAAD`) en schuift de buurniveaus
 * erbij zodra dat ene niveau er minder heeft. Geen enkel onderwerp van Wassima
 * hád er zes op één niveau, dus die buurniveaus schoven altijd mee, en omdat
 * er onder niveau 3 alleen makkelijker werk ligt, werd "moeilijk" in de praktijk
 * een stapel waarin niveau 2 in de meerderheid was. Bij Geluid, Druk en
 * Elektrische schakelingen gaven 1, 2 en 3 zelfs exact dezelfde stapel.
 *
 * Deze proef staat op de belofte en niet op de aantallen: wat komt er uit
 * `opNiveau` als je een niveau kiest. Zes per onderwerp per niveau is het
 * middel, dit is het doel.
 */
describe('een vast niveau geeft Wassima ook echt dat niveau', () => {
  const nep = { ri: (a: number) => a, pick: <T,>(x: readonly T[]) => x[0] as T,
    shuffle: <T,>(x: readonly T[]) => [...x] }
  const hare = [...SEED, ...NIEUW2627, ...sjablonen(nep)]
    .filter((e) => e.p === 'wassima' && (e.jaar ?? 'nu') === 'nu')
    .filter((e) => e.v === 'wiskunde' || e.v === 'natuurkunde')

  const perOnderwerp = new Map<string, Kaart[]>()
  for (const e of hare) {
    const sleutel = `${e.v} · ${e.t}`
    perOnderwerp.set(sleutel, [...(perOnderwerp.get(sleutel) ?? []), e as Kaart])
  }

  it('heeft achtentwintig onderwerpen bij die twee vakken', () => {
    expect(perOnderwerp.size).toBe(28)
  })

  it('levert bij elk onderwerp op elk niveau alleen sommen van dát niveau', () => {
    const vies: string[] = []
    for (const [sleutel, lijst] of perOnderwerp) {
      for (const n of [1, 2, 3] as const) {
        const uit = opNiveau(lijst, n)
        const mis = uit.filter((k) => (k.lvl ?? 1) !== n).length
        if (mis) vies.push(`${sleutel} · vast op ${n}: ${mis} van de ${uit.length} ernaast`)
      }
    }
    expect(vies).toEqual([])
  })

  it('houdt op elk niveau genoeg over om een sessie mee te vullen', () => {
    /* De ondergrens van `opNiveau` zelf. Zakt een onderwerp hieronder, dan
       schuiven de buurniveaus er weer bij en is de belofte hierboven stil weg. */
    for (const [sleutel, lijst] of perOnderwerp) {
      for (const n of [1, 2, 3] as const) {
        expect(opNiveau(lijst, n).length, `${sleutel} · niveau ${n}`)
          .toBeGreaterThanOrEqual(MIN_VOORRAAD)
      }
    }
  })

  it('geeft bij drie verschillende niveaus ook drie verschillende stapels', () => {
    /* Bij Geluid, Druk en Elektrische schakelingen was dat niet zo: daar kwam
       er bij 1, 2 en 3 dezelfde stapel uit. */
    for (const [sleutel, lijst] of perOnderwerp) {
      const stapels = [1, 2, 3].map((n) =>
        opNiveau(lijst, n as 1 | 2 | 3).map((k) => k.id).sort().join(','))
      expect(new Set(stapels).size, sleutel).toBe(3)
    }
  })
})
