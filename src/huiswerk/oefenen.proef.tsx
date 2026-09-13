/**
 * HET OEFENSCHERM, OP GEDRAG GETOETST
 *
 * De klacht die hier beantwoord wordt: de app bleef dezelfde som stellen, ook
 * als die allang beheerst was. Dat was geen tekst maar gedrag — het scherm zag
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
import { themaVan } from './schermen/Thuis'
import type { Kaart, Opgave } from './gegevens/soorten'
import type { Voortgang } from './opslag'
import { leegVoortgang, schoonVoortgang } from './opslag'
import { verwerkAntwoord } from './uitslag'
import { ECHT } from './toeval'

/** Vier sommen in één onderwerp, verdeeld over drie niveaus — de vorm waarin
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
