/**
 * HET OEFENSCHERM, OP GEDRAG GETOETST
 *
 * De klacht die hier beantwoord wordt: de app bleef dezelfde som stellen, ook
 * als die allang beheerst was. Dat was geen tekst maar gedrag: het scherm zag
 * er goed uit, er kwam alleen niets anders meer uit de voorraad. Een grep zou
 * het dus niet gevonden hebben, en een proef op `kiesVolgende` alleen ook niet:
 * de vernauwing zat in het scherm, dat bij een vast niveau de voorraad eerst
 * terugsneed tot dat ene niveau.
 *
 * Daarom draait deze proef het echte scherm, met een voorraad van vier sommen
 * waarvan er één op niveau drie staat, en telt hij wat een kind te zien krijgt.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Oefenen } from './schermen/Oefenen'
import { Vakken } from './schermen/Vakken'
import { FORMULEBLOKKEN, formulesVoor } from './gegevens/formules'
import { PROFIELEN } from './gegevens/profielen'
import { themaVan } from './schermen/Thuis'
import type { Kaart, Opgave } from './gegevens/soorten'
import type { Voortgang } from './opslag'
import { leegVoortgang, schoonVoortgang } from './opslag'
import { verwerkAntwoord } from './uitslag'
import { UITLEG } from './gegevens/uitleg'
import { BEHEERST_BOX, isBeheerst } from './leitner'
import { ECHT } from './toeval'

/** Vier sommen in één onderwerp, verdeeld over drie niveaus, de vorm waarin
 *  `Delen` bij Amine in de voorraad staat, met kenbare antwoorden. */
const STAPEL: Opgave[] = [
  { id: 'd1', p: 'amine', v: 'rekenen', t: 'Delen', lvl: 1, q: '6 ÷ 3', a: '2' },
  { id: 'd2', p: 'amine', v: 'rekenen', t: 'Delen', lvl: 2, q: '56 ÷ 7', a: '8' },
  { id: 'd3', p: 'amine', v: 'rekenen', t: 'Delen', lvl: 2, q: '81 ÷ 9', a: '9' },
  { id: 'd4', p: 'amine', v: 'rekenen', t: 'Delen', lvl: 3, q: '26 ÷ 4', a: '6' },
]
const ANTWOORD: Record<string, string> = Object.fromEntries(STAPEL.map((e) => [e.q, e.a]))

/* Amine is het kind met het voetbalthema: doelpunten in plaats van sterren in
   de kop. Precies het scherm van de klacht. */
const THEMA = themaVan('amine')

/** Het scherm met een voortgang die echt meeloopt: `verwerkAntwoord` schuift de
 *  doosjes op, precies zoals in de app. */
function Proefscherm({ start }: { start: Voortgang }): ReactNode {
  const [prog, zetProg] = useState(start)
  return (
    <Oefenen
      pid="amine" vak="rekenen" onderwerp="Delen" jaar="nu" alle={STAPEL as Kaart[]}
      prog={prog} thema={THEMA} geluid={false} voorlezen={false} toeval={ECHT}
      terug={() => { /* niet nodig in de proef */ }}
      naarOnderwerp={() => { /* niet nodig in de proef */ }}
      opUitslag={(kaart, beurt, goed, hint) => zetProg((pr) =>
        verwerkAntwoord(pr, { kaart, beurt, goed, hintGebruikt: hint }, new Date()))}
      opToets={() => { /* geen toets in deze proef */ }}
    />
  )
}

/** De vraag die nu op het scherm staat. */
const vraagNu = (): string => {
  const box = document.querySelector('.qbox')
  return box ? (box.textContent ?? '') : ''
}

/** Eén som goed beantwoorden en doorklikken. Geeft de vraag terug die er stond,
 *  of null als het scherm geen vraag meer toont. */
function beantwoord(): string | null {
  const vraag = vraagNu()
  if (!vraag) return null
  const veld = screen.getByPlaceholderText('jouw antwoord')
  act(() => { fireEvent.change(veld, { target: { value: ANTWOORD[vraag] ?? '' } }) })
  act(() => { fireEvent.click(screen.getByText('Nakijken')) })
  const door = screen.queryByText('Volgende →')
  if (door) act(() => { fireEvent.click(door) })
  return vraag
}

const vers = (niveau: Voortgang['niveau']): Voortgang =>
  schoonVoortgang({ ...leegVoortgang(), niveau })

/* Zonder dit blijft het vorige scherm in de DOM staan en vindt een zoekopdracht
   er twee. Er staat geen `globals: true` in de vitest-instellingen, dus het
   opruimen gebeurt niet vanzelf. */
afterEach(cleanup)

describe('het oefenscherm', () => {
  it('herhaalt niet één som als het niveau vaststaat', () => {
    /* Vast op niveau drie staat er precies één som van dat niveau. Vroeger was
       dat de hele voorraad en kreeg het kind tien keer "26 ÷ 4". */
    render(<Proefscherm start={vers(3)} />)
    const gezien: string[] = []
    for (let i = 0; i < 6; i++) {
      const v = beantwoord()
      if (!v) break
      gezien.push(v)
    }
    expect(gezien.length).toBeGreaterThan(2)
    expect(new Set(gezien).size).toBeGreaterThan(2)
  })

  it('stopt met vragen zodra alles net geweest is, en zegt wanneer het terugkomt', () => {
    render(<Proefscherm start={vers('auto')} />)
    for (let i = 0; i < 12; i++) if (!beantwoord()) break
    expect(vraagNu()).toBe('')
    expect(screen.getByText(/Je hebt ze allemaal gehad|Dit beheers je/)).toBeTruthy()
    expect(screen.getByText('Toch nog oefenen')).toBeTruthy()
  })

  it('laat "toch nog oefenen" het rustscherm opzij zetten', () => {
    render(<Proefscherm start={vers('auto')} />)
    for (let i = 0; i < 12; i++) if (!beantwoord()) break
    act(() => { fireEvent.click(screen.getByText('Toch nog oefenen')) })
    expect(vraagNu()).not.toBe('')
  })

  it('toont de sterren van de som die op het scherm staat', () => {
    const pr = vers('auto')
    pr.cards = { d4: { box: 3, ok: 3, wrong: 0, last: 0 } }
    render(<Proefscherm start={pr} />)
    const sterren = [...document.querySelectorAll('.stars')].map((e) => e.textContent)
    expect(sterren.length).toBeGreaterThan(0)
    expect(sterren[0]).toMatch(/^[⭐☆]{5}$/)
  })

  it('zegt na een goed antwoord dat er een ster bij komt', () => {
    render(<Proefscherm start={vers('auto')} />)
    const veld = screen.getByPlaceholderText('jouw antwoord')
    act(() => { fireEvent.change(veld, { target: { value: ANTWOORD[vraagNu()] ?? '' } }) })
    act(() => { fireEvent.click(screen.getByText('Nakijken')) })
    expect(screen.getByText('een ster erbij')).toBeTruthy()
  })
})

/**
 * DE FORMULEKAART NAAST DE SOM
 *
 * De klacht: de wiskunde- en natuurkunderegels waren bij het oefenen nergens
 * meer te vinden. Ze stonden er ook echt niet: de kaart hing aan een knop op
 * het thuisscherm, en wie via het portaal binnenkomt ziet dat scherm nooit.
 * Een grep op `FORMULEBLOKKEN` had dat niet gevonden: het bestand werd gewoon
 * geïmporteerd, alleen niet op een plek waar een kind kwam.
 *
 * Daarom staat de proef op het scherm en niet op de gegevens: hij vraagt wat
 * een kind tijdens een som te zien krijgt.
 */
const natuurkundeStapel: Opgave[] = [
  { id: 'n1', p: 'wassima', v: 'natuurkunde', t: 'Elektriciteit', lvl: 1,
    q: 'U = 12 V en R = 4 Ω. Bereken I.', a: '3' },
]

const oefenNatuurkunde = (): void => {
  render(
    <Oefenen
      pid="wassima" vak="natuurkunde" onderwerp="Elektriciteit" jaar="nu"
      alle={natuurkundeStapel as Kaart[]} prog={vers('auto')} thema={themaVan('wassima')}
      geluid={false} voorlezen={false} toeval={ECHT}
      terug={() => { /* niet nodig */ }}
      naarOnderwerp={() => { /* niet nodig */ }}
      opUitslag={() => { /* niet nodig */ }}
      opToets={() => { /* niet nodig */ }}
    />,
  )
}

/** De tekst van de ingeklapte formulekaart, of null als hij er niet staat. */
const formulekaart = (): string | null => {
  const kaart = [...document.querySelectorAll('details.klapkaart')]
    .find((d) => (d.querySelector('summary')?.textContent ?? '').includes('Formules'))
  return kaart ? (kaart.textContent ?? '') : null
}

describe('de formulekaart bij het oefenen', () => {
  it('staat onder de som van een vak dat formules heeft', () => {
    oefenNatuurkunde()
    const kaart = formulekaart()
    expect(kaart).not.toBeNull()
    expect(kaart).toContain('U = I × R')
    expect(kaart).toContain('v = s / t')
  })

  it('toont alleen de blokken van dít vak', () => {
    oefenNatuurkunde()
    /* Wassima hoort bij natuurkunde geen kansrekening van de bovenbouw te
       krijgen; dan is het blaadje geen blaadje meer maar een boek. */
    expect(formulekaart()).not.toContain('Verwachtingswaarde')
  })

  it('begint dicht, zodat hij de som niet wegdrukt', () => {
    oefenNatuurkunde()
    const kaart = document.querySelector('details.klapkaart')
    expect(kaart?.hasAttribute('open')).toBe(false)
  })

  it('staat er niet bij een vak zonder formules', () => {
    /* Rekenen in groep 8: de regel ís de som. Een lege kaart is erger dan
       geen kaart. */
    render(<Proefscherm start={vers('auto')} />)
    expect(formulekaart()).toBeNull()
  })

  it('staat ook op het vakkenscherm, waar een kind na een reeks terugkomt', () => {
    render(
      <Vakken
        pid="wassima" prog={vers('auto')} alle={natuurkundeStapel as Kaart[]}
        vak="natuurkunde" thema={themaVan('wassima')} nuMs={Date.now()} weektaak={[]}
        wedstrijdAan={false} spelNaDoel={false}
        zetVak={() => { /* niet nodig */ }}
        terug={() => { /* niet nodig */ }}
        naarOnderwerp={() => { /* niet nodig */ }}
        zetDoel={() => { /* niet nodig */ }}
        zetNiveau={() => { /* niet nodig */ }}
        naarWedstrijd={() => { /* niet nodig */ }}
        naarSpellen={() => { /* niet nodig */ }}
        opVraag={() => { /* niet nodig */ }}
        naarLeerscan={() => { /* niet nodig */ }}
      />,
    )
    expect(formulekaart()).toContain('U = I × R')
  })

  it('laat geen blok achter dat bij geen enkel vak hoort', () => {
    /* Een typefout in een vaknaam laat een blok stilzwijgend verdwijnen van
       elk oefenscherm: precies de fout die hier hersteld is, maar dan één
       blok tegelijk en dus minder opvallend. */
    const vakken = new Set(Object.values(PROFIELEN).flatMap((pr) => pr.vakken))
    for (const blok of FORMULEBLOKKEN) {
      expect(blok.vakken.length, blok.kop).toBeGreaterThan(0)
      for (const v of blok.vakken) expect(vakken.has(v), `${blok.kop} → ${v}`).toBe(true)
    }
    /* En elk vak dat blokken claimt, krijgt ze ook echt terug. */
    for (const v of ['wiskunde', 'wiskundeA', 'natuurkunde']) {
      expect(formulesVoor(v).length, v).toBeGreaterThan(0)
    }
    expect(formulesVoor('lezen')).toEqual([])
  })
})

/**
 * DE MOEILIJKHEIDSKNOP MOET TE VINDEN ZIJN
 *
 * Hij bestond al, maar stond onderin de dichtgeklapte kaart "Mijn voortgang",
 * tussen de rangen en de badges. Wie hem niet toevallig kende, kwam hem nooit
 * tegen. Dit is geen behaalde stand maar een knop die bepaalt wát de komende
 * tien sommen zijn, dus hij hoort bij de onderwerpen te staan.
 *
 * Een grep zou dit niet vangen: de knoppen stónden er, alleen achter een
 * `<details>` die dicht begint.
 */
function vakkenscherm(opNiveau: (n: Voortgang['niveau']) => void): void {
  render(
    <Vakken
      pid="wassima" prog={vers('auto')} alle={natuurkundeStapel as Kaart[]}
      vak="natuurkunde" thema={themaVan('wassima')} nuMs={Date.now()} weektaak={[]}
      wedstrijdAan={false} spelNaDoel={false}
      zetVak={() => { /* niet nodig */ }}
      terug={() => { /* niet nodig */ }}
      naarOnderwerp={() => { /* niet nodig */ }}
      zetDoel={() => { /* niet nodig */ }}
      zetNiveau={opNiveau}
      naarWedstrijd={() => { /* niet nodig */ }}
      naarSpellen={() => { /* niet nodig */ }}
      opVraag={() => { /* niet nodig */ }}
      naarLeerscan={() => { /* niet nodig */ }}
    />,
  )
}

describe('de moeilijkheid instellen', () => {
  it('staat op het vakkenscherm zelf, niet achter een dichtgeklapte kaart', () => {
    vakkenscherm(() => { /* alleen kijken */ })
    const knop = screen.getByText('3 · moeilijk')
    expect(knop.closest('details')).toBeNull()
    /* En de meting zelf klopt: wat wél achter de klapkaart hoort, zit er ook
       achter. Zonder deze regel zou de proef hierboven ook slagen als er op dit
       scherm helemaal geen `<details>` meer stond. */
    expect(screen.getByText('Badges').closest('details')).not.toBeNull()
  })

  it('biedt auto en alle drie de niveaus', () => {
    vakkenscherm(() => { /* alleen kijken */ })
    for (const label of ['Auto', '1 · makkelijk', '2 · middel', '3 · moeilijk']) {
      expect(screen.getByText(label), label).toBeTruthy()
    }
  })

  it('geeft het gekozen niveau door', () => {
    const gezet: Array<Voortgang['niveau']> = []
    vakkenscherm((n) => gezet.push(n))
    act(() => { fireEvent.click(screen.getByText('3 · moeilijk')) })
    act(() => { fireEvent.click(screen.getByText('Auto')) })
    expect(gezet).toEqual([3, 'auto'])
  })

  it('zegt bij elk niveau waar het voor staat', () => {
    /* "Niveau 3" is een cijfer, geen keuze: zonder uitleg kan een ouder niet
       zien wat hij aanzet. */
    render(
      <Vakken
        pid="wassima" prog={{ ...vers('auto'), niveau: 3 }} alle={natuurkundeStapel as Kaart[]}
        vak="natuurkunde" thema={themaVan('wassima')} nuMs={Date.now()} weektaak={[]}
        wedstrijdAan={false} spelNaDoel={false}
        zetVak={() => { /* niet nodig */ }}
        terug={() => { /* niet nodig */ }}
        naarOnderwerp={() => { /* niet nodig */ }}
        zetDoel={() => { /* niet nodig */ }}
        zetNiveau={() => { /* niet nodig */ }}
        naarWedstrijd={() => { /* niet nodig */ }}
        naarSpellen={() => { /* niet nodig */ }}
        opVraag={() => { /* niet nodig */ }}
        naarLeerscan={() => { /* niet nodig */ }}
      />,
    )
    expect(screen.getByText(/Vast op niveau 3/)).toBeTruthy()
    expect(screen.getByText(/Terugrekenen/)).toBeTruthy()
  })
})

/**
 * HET VERTROUWEN VAN EEN KIND DAT DIT VAK MOEILIJK VINDT
 *
 * Wassima doet 2 havo over en is onzeker over rekenen met letters. Twee dingen
 * in de app werkten daar tegenin, en allebei zijn ze veranderd.
 *
 * Het eerste was het niveau. Dat zakte bij de éérste fout een trede. Voor wie
 * al denkt dit niet te kunnen is dat geen bijsturing maar een bevestiging: je
 * mist er een, en de app zet je meteen terug. Een losse misser hoort bij
 * oefenen. Twee op rij is wél een signaal, en dan zakt hij nog steeds.
 *
 * Het tweede was dat opzoeken hoe het moet geld kostte. Een hint haalt de
 * beurt van tien punten naar vijf. Daarom staat de uitgewerkte som uit haar
 * eigen boek nu gratis in de doos boven de opgave, en wijst het scherm er na
 * een fout naartoe in plaats van alleen te zeggen dat het niet goed was.
 */
describe('een fout mag geen trede kosten', () => {
  const beurt = (id: string) => ({
    kaart: { id, p: 'wassima', v: 'wiskunde', t: 'Machten delen', q: 'q', a: 'a' } as Kaart,
    beurt: { id, p: 'wassima', v: 'wiskunde', t: 'Machten delen', q: 'q', a: 'a' },
  })
  const na = (start: Voortgang, uitslagen: boolean[]): Voortgang => {
    let pr = start
    uitslagen.forEach((goed, i) => {
      const b = beurt('k' + i)
      pr = verwerkAntwoord(pr, { kaart: b.kaart, beurt: b.beurt, goed, hintGebruikt: false },
        new Date())
    })
    return pr
  }
  const opTwee = (): Voortgang => ({ ...vers('auto'), autoLvl: 2 })

  it('laat het niveau staan na één fout', () => {
    expect(na(opTwee(), [false]).autoLvl).toBe(2)
  })

  it('zakt wel na twee fouten achter elkaar', () => {
    expect(na(opTwee(), [false, false]).autoLvl).toBe(1)
  })

  it('telt de fouten niet op als er een goede tussen zit', () => {
    /* Fout, goed, fout is geen reeks van twee. Anders zou een kind dat om en
       om werkt alsnog stukje bij beetje worden teruggezet. */
    expect(na(opTwee(), [false, true, false]).autoLvl).toBe(2)
  })

  it('klimt nog steeds pas na drie goede antwoorden', () => {
    expect(na(vers('auto'), [true, true]).autoLvl).toBe(1)
    expect(na(vers('auto'), [true, true, true]).autoLvl).toBe(2)
  })

  it('zakt nooit onder niveau 1', () => {
    expect(na(vers('auto'), [false, false, false, false]).autoLvl).toBe(1)
  })
})

describe('de uitgewerkte som uit de methode', () => {
  const HOOFDSTUK1 = ['Het omgekeerde van een getal', 'Delen door een breuk',
    'Breuken met letters', 'Machten vermenigvuldigen', 'Gelijksoortige termen',
    'Macht van een macht', 'Macht van een product', 'Machten delen']

  it('staat bij elk onderwerp van hoofdstuk 1', () => {
    for (const t of HOOFDSTUK1) {
      expect(UITLEG[t]?.voorbeeld, t).toBeTruthy()
      /* Stap voor stap, dus met regels onder elkaar en niet één zin. */
      expect((UITLEG[t]?.voorbeeld ?? '').split('\n').length, t).toBeGreaterThan(3)
    }
  })

  it('staat op het oefenscherm, zonder dat er een hint voor nodig is', () => {
    render(
      <Oefenen
        pid="wassima" vak="wiskunde" onderwerp="Machten delen" jaar="nu"
        alle={[{ id: 'm1', p: 'wassima', v: 'wiskunde', t: 'Machten delen', lvl: 1,
          q: 'Herleid: a¹² ÷ a⁷', a: 'a⁵' }] as Kaart[]}
        prog={vers('auto')} thema={themaVan('wassima')} geluid={false} voorlezen={false}
        toeval={ECHT}
        terug={() => { /* niet nodig */ }}
        naarOnderwerp={() => { /* niet nodig */ }}
        opUitslag={() => { /* niet nodig */ }}
        opToets={() => { /* niet nodig */ }}
      />,
    )
    const doos = document.querySelector('.boekvoorbeeld')
    expect(doos).not.toBeNull()
    expect(doos?.textContent).toContain('12a')
    /* En er is niets aangeklikt om hem te zien. */
    expect(screen.queryByText(/Hint 1:/)).toBeNull()
  })

  it('wijst er na een fout naartoe in plaats van alleen nee te zeggen', () => {
    render(
      <Oefenen
        pid="wassima" vak="wiskunde" onderwerp="Machten delen" jaar="nu"
        alle={[{ id: 'm1', p: 'wassima', v: 'wiskunde', t: 'Machten delen', lvl: 1,
          q: 'Herleid: a¹² ÷ a⁷', a: 'a⁵' }] as Kaart[]}
        prog={vers('auto')} thema={themaVan('wassima')} geluid={false} voorlezen={false}
        toeval={ECHT}
        terug={() => { /* niet nodig */ }}
        naarOnderwerp={() => { /* niet nodig */ }}
        opUitslag={() => { /* niet nodig */ }}
        opToets={() => { /* niet nodig */ }}
      />,
    )
    act(() => { fireEvent.change(screen.getByPlaceholderText('jouw antwoord'),
      { target: { value: 'a9' } }) })
    act(() => { fireEvent.click(screen.getByText('Nakijken')) })
    expect(document.querySelector('.feedback.no')?.textContent).toContain('net als in je boek')
    /* En de doos staat open, anders is wijzen zinloos. */
    expect(document.querySelector('.boekvoorbeeld')).not.toBeNull()
  })
})

/**
 * WAT ZE NU KAN, IN PLAATS VAN WAT ER NOG MOET
 *
 * Het oefenscherm kende twee getallen: hoeveel sommen goed, en hoeveel sterren
 * erbij. Allebei gaan ze over de beurt en niet over haar. Wat er miste is het
 * enige objectieve punt in het hele systeem waarop je kunt zeggen dat ze iets
 * kán: het moment dat een som over de vier sterren gaat. Dat is vier keer
 * achter elkaar goed, verspreid over dagen, met de wachttijden van Leitner
 * ertussen. Dat is niet te gokken.
 *
 * Voor een kind dat onzeker is over dit vak is dat het verschil tussen een
 * aanmoediging en een bewijsstuk. De samenvatting zet het daarom bovenaan,
 * boven het foutenschrift, en niet eronder.
 */
describe('de samenvatting benoemt wat er beheerst is geraakt', () => {
  const SOM: Kaart = { id: 's1', p: 'wassima', v: 'wiskunde', t: 'Machten delen', lvl: 1,
    q: 'Herleid: a¹² ÷ a⁷', a: 'a⁵' }

  /** Het scherm met een som die op `box` staat, met een meelopende voortgang. */
  function Reeks({ box, fout }: { box: number; fout?: boolean }): ReactNode {
    const start = { ...vers('auto'), cards: { s1: { box, ok: box, wrong: 0, last: 0 } } }
    const [prog, zetProg] = useState<Voortgang>(
      fout ? { ...start, foutLog: [{ id: 'x', t: 'Breuken', v: 'wiskunde', q: '1/2 + 1/2', a: '1', u: '', when: 0 }] } : start)
    return (
      <Oefenen
        pid="wassima" vak="wiskunde" onderwerp="Machten delen" jaar="nu" alle={[SOM]}
        prog={prog} thema={themaVan('wassima')} geluid={false} voorlezen={false} toeval={ECHT}
        terug={() => { /* niet nodig */ }}
        naarOnderwerp={() => { /* niet nodig */ }}
        opUitslag={(kaart, beurt, goed, hint) => zetProg((pr) =>
          verwerkAntwoord(pr, { kaart, beurt, goed, hintGebruikt: hint }, new Date()))}
        opToets={() => { /* niet nodig */ }}
      />
    )
  }

  /** Goed antwoorden en daarna de samenvatting opvragen. */
  const totSamenvatting = (): void => {
    act(() => { fireEvent.change(screen.getByPlaceholderText('jouw antwoord'),
      { target: { value: 'a⁵' } }) })
    act(() => { fireEvent.click(screen.getByText('Nakijken')) })
    act(() => { fireEvent.click(screen.getByText(/Stoppen/)) })
  }

  it('noemt de som die net over de vier sterren ging', () => {
    render(<Reeks box={3} />)
    totSamenvatting()
    expect(screen.getByText(/Dit beheers je nu \(1\)/)).toBeTruthy()
    expect(screen.getByText(/a¹²/)).toBeTruthy()
  })

  it('noemt niets bij een som die pas op één ster staat', () => {
    render(<Reeks box={0} />)
    totSamenvatting()
    expect(screen.queryByText(/Dit beheers je nu/)).toBeNull()
  })

  it('noemt niets bij een som die al beheerst wás', () => {
    /* Anders zou dezelfde som elke sessie opnieuw als doorbraak tellen, en dan
       zegt het woord niets meer. */
    render(<Reeks box={4} />)
    totSamenvatting()
    expect(screen.queryByText(/Dit beheers je nu/)).toBeNull()
  })

  it('zet het bóven het foutenschrift', () => {
    render(<Reeks box={3} fout />)
    totSamenvatting()
    const tekst = document.body.textContent ?? ''
    expect(tekst.indexOf('Dit beheers je nu')).toBeGreaterThan(-1)
    expect(tekst.indexOf('foutenschrift')).toBeGreaterThan(-1)
    expect(tekst.indexOf('Dit beheers je nu')).toBeLessThan(tekst.indexOf('foutenschrift'))
  })

  it('zegt niet meer dat het foutenschrift van deze sessie is', () => {
    /* Er stond "Deze gingen mis" boven een lijst van veertig, ook na een sessie
       waarin alles goed ging. */
    render(<Reeks box={3} fout />)
    totSamenvatting()
    const kaart = document.body.textContent ?? ''
    expect(kaart).toContain('van vandaag en van daarvoor')
    expect(kaart).not.toContain('Deze gingen mis')
  })

  it('zegt het ook meteen, op dezelfde grens als de app zelf hanteert', () => {
    /* Het scherm mag geen eigen 4 hebben naast die van `isBeheerst`. Deze proef
       kijkt naar het gedrag op de trede eronder en erop, en niet naar de waarde
       van de constante: die twee samen verschuiven zou hem anders ontgaan. */
    render(<Reeks box={BEHEERST_BOX - 1} />)
    act(() => { fireEvent.change(screen.getByPlaceholderText('jouw antwoord'),
      { target: { value: 'a\u2075' } }) })
    act(() => { fireEvent.click(screen.getByText('Nakijken')) })
    expect(screen.getByText(/nu beheers je deze som/)).toBeTruthy()
    expect(isBeheerst({ ...vers('auto'),
      cards: { s1: { box: BEHEERST_BOX, ok: 4, wrong: 0, last: 0 } } }, 's1')).toBe(true)
    cleanup()

    render(<Reeks box={BEHEERST_BOX - 2} />)
    act(() => { fireEvent.change(screen.getByPlaceholderText('jouw antwoord'),
      { target: { value: 'a\u2075' } }) })
    act(() => { fireEvent.click(screen.getByText('Nakijken')) })
    expect(screen.queryByText(/nu beheers je deze som/)).toBeNull()
  })
})
