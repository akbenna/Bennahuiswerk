/**
 * WAT ER AAN SPIERBEHOUD TE TOETSEN VALT
 *
 * Drie dingen, en ze zijn alle drie een grens die zichzelf niet verdedigt:
 *
 *   de SARC-F-grens   staat op 1 en niet op 4, omdat een screener hoort op te
 *                     sporen en niet uit te sluiten. Schuift hij naar 4, dan
 *                     zwijgt het scherm precies bij de mensen voor wie hij
 *                     bedoeld is, en niets valt daarvan om.
 *   de stoeltest      vijftien seconden, en "niet gedaan" is een eigen uitkomst
 *                     naast snel en traag.
 *   de leucinedrempel dertig gram per maaltijd, náást het dagdoel gedeeld door
 *                     drie. Die twee lopen uiteen bij een laag dagdoel, en dat
 *                     uiteenlopen is het hele punt van dit bestand.
 */
import { describe, expect, it } from 'vitest'
import {
  LEUCINEDREMPEL_G, SARCF_OPSPOREN, SARCF_UITSLUITEN, SARCF_VRAGEN, SPIER_VOORBEHOUD,
  STOELTEST_GRENS_S, STOELTEST_MIN_S, hoofdmaaltijden, maaltijdenBovenDrempel,
  maaltijdverdeling, sarcfscore,
  sarcfsignaal, spierbeeld, stoeltestTraag,
} from './spier'
import type { Sarcfantwoorden, Spiervraag } from './spier'

const NUL: Sarcfantwoorden = { kracht: 0, lopen: 0, opstaan: 0, traplopen: 0, vallen: 0 }
const vraag = (p: Partial<Spiervraag> = {}): Spiervraag => ({ krachtdoel: 3, ...p })

describe('de vijf vragen van SARC-F', () => {
  it('telt op tot hoogstens tien', () => {
    expect(sarcfscore(NUL)).toBe(0)
    expect(sarcfscore({ kracht: 2, lopen: 2, opstaan: 2, traplopen: 2, vallen: 2 })).toBe(10)
  })

  it('elke vraag telt mee', () => {
    for (const { sleutel } of SARCF_VRAGEN) {
      expect(sarcfscore({ ...NUL, [sleutel]: 2 }), sleutel).toBe(2)
    }
  })

  it('er zijn vijf vragen en elke heeft drie antwoorden', () => {
    expect(SARCF_VRAGEN).toHaveLength(5)
    for (const v of SARCF_VRAGEN) {
      expect(v.vraag, v.sleutel).toMatch(/\?$/)
      expect(v.schaal, v.sleutel).toHaveLength(3)
    }
  })

  /* DE BELANGRIJKSTE VAN DIT BESTAND.
     De grens staat op 1 en niet op 4. Bij 4 is de sensitiviteit laag: hij sluit
     goed uit en spoort slecht op, en dat is voor een screener in een app de
     verkeerde kant van de fout. Eén genoemde klacht hoort al tot een regel op
     het scherm te leiden. */
  it('één genoemde klacht is al een signaal', () => {
    expect(sarcfsignaal({ ...NUL, opstaan: 1 })).toBe(true)
    expect(SARCF_OPSPOREN).toBe(1)
  })

  it('en niets genoemd is geen signaal', () => {
    expect(sarcfsignaal(NUL)).toBe(false)
  })

  /* De hoge grens blijft bestaan omdat hij iets ánders betekent: genoeg om het
     na te laten kijken. Twee grenzen, twee betekenissen, en ze horen niet in
     één getal te verdwijnen. */
  it('de twee grenzen zijn verschillend en staan allebei vast', () => {
    expect(SARCF_UITSLUITEN).toBe(4)
    expect(SARCF_OPSPOREN).toBeLessThan(SARCF_UITSLUITEN)
  })
})

describe('vijf keer opstaan uit een stoel', () => {
  it('boven de vijftien seconden is traag', () => {
    expect(stoeltestTraag(STOELTEST_GRENS_S + 0.5)).toBe(true)
  })

  /* Precies op de grens is niet traag: EWGSOP2 zegt "meer dan 15 seconden". */
  it('precies op de grens niet', () => {
    expect(stoeltestTraag(STOELTEST_GRENS_S)).toBe(false)
  })

  /* NIET GEDAAN IS EEN EIGEN UITKOMST. Zou dit `false` geven, dan leest een
     lege meting als "gaat goed", en dat is precies de fout die dit hele
     project probeert te vermijden. */
  it('niet gedaan is niet hetzelfde als snel', () => {
    expect(stoeltestTraag(null)).toBeNull()
    expect(stoeltestTraag(undefined)).toBeNull()
    expect(stoeltestTraag(0)).toBeNull()
    expect(stoeltestTraag(Number.NaN)).toBeNull()
  })
})

describe('de leucinedrempel naast het dagdoel', () => {
  /* Bij een hoog dagdoel valt er niets te zien: een derde van 161 is 54, ruim
     boven de drempel. Daarom is dít geval niet het interessante. */
  it('een hoog dagdoel haalt de drempel met drie maaltijden', () => {
    const v = maaltijdverdeling(161)
    expect(v.gedeeld).toBe(54)
    expect(v.drieHaaltDrempel).toBe(true)
  })

  /* En dít is het geval waar dit bestand voor bestaat. Een derde van 75 is 25,
     onder de dertig. Het scherm Voeding zegt dan "op peil" terwijl er van
     spieraanmaak weinig terechtkomt. */
  it('een laag dagdoel haalt hem niet, en dat hoort te blijken', () => {
    const v = maaltijdverdeling(75)
    expect(v.gedeeld).toBe(25)
    expect(v.gedeeld).toBeLessThan(LEUCINEDREMPEL_G)
    expect(v.drieHaaltDrempel).toBe(false)
    /* Twee maaltijden van 37 g halen hem wel. Dat is het antwoord, en niet
       "verhoog je dagdoel". */
    expect(v.maaltijdenDieHalen).toBe(2)
  })

  /* Naar beneden afronden: bij 89 g haal je twee maaltijden van dertig en houd
     je 29 over. Twee en negenentwintig dertigste maaltijd bestaat niet. */
  it('een halve maaltijd telt niet mee', () => {
    expect(maaltijdverdeling(89).maaltijdenDieHalen).toBe(2)
    expect(maaltijdverdeling(90).maaltijdenDieHalen).toBe(3)
  })

  it('precies op de grens haalt hem', () => {
    expect(maaltijdverdeling(LEUCINEDREMPEL_G * 3).drieHaaltDrempel).toBe(true)
  })

  it('en een dagdoel van niets levert geen maaltijden op', () => {
    expect(maaltijdverdeling(0).maaltijdenDieHalen).toBe(0)
    expect(maaltijdverdeling(-50).maaltijdenDieHalen).toBe(0)
  })

  it('telt welke gelogde maaltijden erboven uitkwamen', () => {
    expect(maaltijdenBovenDrempel([45, 12, 31])).toBe(2)
    expect(maaltijdenBovenDrempel([LEUCINEDREMPEL_G])).toBe(1)
    expect(maaltijdenBovenDrempel([])).toBe(0)
  })
})

describe('het drieluik', () => {
  it('geeft drie regels als er niets bekend is, alle drie onbekend', () => {
    const r = spierbeeld(vraag())
    expect(r).toHaveLength(3)
    expect(r.every((x) => x.stand === 'onbekend')).toBe(true)
    /* Onbekend heeft geen waarde maar wél een toelichting: die zegt wat er
       ontbreekt, en dat is het enige wat je eraan kunt doen. */
    for (const x of r) {
      expect(x.waarde, x.wat).toBe('')
      expect(x.toelichting, x.wat).toBeTruthy()
    }
  })

  it('eiwit staat voorop, want dat is de enige die vandaag te veranderen valt', () => {
    expect(spierbeeld(vraag())[0]!.wat).toMatch(/Eiwit/)
  })

  it('drie maaltijden boven de drempel staan goed', () => {
    const r = spierbeeld(vraag({ eiwitPerMaaltijd: [40, 35, 32] }))
    expect(r[0]!.stand).toBe('goed')
    expect(r[0]!.waarde).toBe('3 van de 3 boven 30 g')
  })

  it('en twee van de drie niet', () => {
    expect(spierbeeld(vraag({ eiwitPerMaaltijd: [40, 12, 32] }))[0]!.stand).toBe('let')
  })

  it('krachtsessies tellen tegen het doel', () => {
    expect(spierbeeld(vraag({ krachtsessies: 3 }))[1]!.stand).toBe('goed')
    expect(spierbeeld(vraag({ krachtsessies: 2 }))[1]!.stand).toBe('let')
    /* Nul sessies is iets anders dan niet bijgehouden. */
    expect(spierbeeld(vraag({ krachtsessies: 0 }))[1]!.stand).toBe('let')
  })

  it('een trage stoeltest stuurt naar de huisarts', () => {
    const r = spierbeeld(vraag({ stoeltestSeconden: 18 }))[2]!
    expect(r.stand).toBe('let')
    expect(r.toelichting).toMatch(/huisarts/)
  })

  /* Een goede uitslag van een jaar geleden zegt niets over nu. Hij hoort niet
     als "goed" te blijven staan, dat is dezelfde fout als een lege meting die
     als goed leest, alleen langzamer. */
  it('een oude goede stoeltest vervalt naar onbekend', () => {
    const vers = spierbeeld(vraag({ stoeltestSeconden: 9, stoeltestDagenGeleden: 10 }))[2]!
    const oud = spierbeeld(vraag({ stoeltestSeconden: 9, stoeltestDagenGeleden: 200 }))[2]!
    expect(vers.stand).toBe('goed')
    expect(oud.stand).toBe('onbekend')
    expect(oud.toelichting).toMatch(/opnieuw/)
  })

  /* Maar een tráge uitslag vervalt niet: die blijft staan tot hij weerlegd is.
     Verouderen in de richting van geruststelling mag, in de richting van
     wegkijken niet. */
  it('een oude trage stoeltest blijft wél staan', () => {
    expect(spierbeeld(vraag({ stoeltestSeconden: 22, stoeltestDagenGeleden: 200 }))[2]!.stand)
      .toBe('let')
  })

  it('de vragenlijst komt er alleen bij als hij iets zegt', () => {
    expect(spierbeeld(vraag({ sarcf: NUL }))).toHaveLength(3)
    const met = spierbeeld(vraag({ sarcf: { ...NUL, traplopen: 1 } }))
    expect(met).toHaveLength(4)
    expect(met[3]!.stand).toBe('let')
  })

  it('en zegt het verschil tussen één klacht en genoeg om na te kijken', () => {
    const licht = spierbeeld(vraag({ sarcf: { ...NUL, traplopen: 1 } }))[3]!
    const zwaar = spierbeeld(vraag({ sarcf: { ...NUL, traplopen: 2, opstaan: 2 } }))[3]!
    expect(licht.toelichting).not.toBe(zwaar.toelichting)
    expect(zwaar.toelichting).toMatch(/nakijken|na te (laten )?kijken/)
  })
})

describe('het voorbehoud', () => {
  /* Het staat als losse tekst zodat het scherm hem móét tonen en niet kan
     vergeten. Een app die "1,6 g/kg behoudt je spieren" zegt belooft meer dan
     het bewijs draagt: van twintig studies vonden er drie een verschil. */
  it('noemt hoe zwak het bewijs voor de grootte is', () => {
    expect(SPIER_VOORBEHOUD).toMatch(/twintig/)
    expect(SPIER_VOORBEHOUD).toMatch(/drie/)
    expect(SPIER_VOORBEHOUD).toMatch(/geen garantie/)
  })
})

describe('de ondergrens van de stoeltest', () => {
  /* Vijf keer volledig opstaan kost minstens een paar seconden. Onder de twee
     is het geen meting maar een dubbele tik. Zonder deze grens bewaarde de app
     een nulmeting zonder te klagen, en las die daarna als "snel", de
     vleiendste uitkomst op de zwakste gegevens.

     De armatuur vond dit: die zet de klok vast, dus `Date.now()` stond stil en
     er ging nul seconden de database in. */
  it('een onmogelijk korte uitslag leest als niet gedaan', () => {
    expect(stoeltestTraag(0)).toBeNull()
    expect(stoeltestTraag(0.4)).toBeNull()
    expect(stoeltestTraag(STOELTEST_MIN_S - 0.1)).toBeNull()
  })

  it('en vanaf de ondergrens telt hij wel', () => {
    expect(stoeltestTraag(STOELTEST_MIN_S)).toBe(false)
  })

  /* De ondergrens ligt ruim onder de trage grens; anders zou hij uitslagen
     wegnemen die juist iets zeggen. */
  it('de twee grenzen bijten elkaar niet', () => {
    expect(STOELTEST_MIN_S).toBeLessThan(STOELTEST_GRENS_S)
  })
})

describe('welke eetmomenten een maaltijd zijn', () => {
  it('de drie hoofdmaaltijden, in de volgorde van de dag', () => {
    expect(hoofdmaaltijden({ diner: 40, ontbijt: 20, lunch: 30 })).toEqual([20, 30, 40])
  })

  /* DE REGEL DIE EEN ARMATUURPROEF NIET KON VANGEN.
     Een handje amandelen is geen maaltijd. Zou "tussendoor" meetellen, dan gaat
     de teller omlaag bij precies het gedrag dat er niets mee te maken heeft:
     drie maaltijden op peil plus iets tussendoor leest dan als "3 van de 4". */
  it('een tussendoortje telt niet als maaltijd', () => {
    expect(hoofdmaaltijden({ ontbijt: 35, lunch: 35, diner: 35, tussendoor: 6 }))
      .toEqual([35, 35, 35])
  })

  /* En "onbekend" evenmin: dat zijn regels uit een import zonder maaltijdmoment.
     Daarvan is de verdeling niet bekend, en onbekend hoort niet als gemist te
     lezen. */
  it('en een regel zonder moment ook niet', () => {
    expect(hoofdmaaltijden({ ontbijt: 35, onbekend: 120 })).toEqual([35])
  })

  /* Een diner dat er niet is, is geen maaltijd van nul gram. Zou het als 0
     meetellen, dan leest "twee maaltijden op peil" als "2 van de 3", een
     gemiste drempel voor een maaltijd die niet bestond. */
  it('een niet-gegeten maaltijd telt niet mee als gemist', () => {
    expect(hoofdmaaltijden({ ontbijt: 23, lunch: 30 })).toEqual([23, 30])
    expect(hoofdmaaltijden({ ontbijt: 23, lunch: 30, diner: 0 })).toEqual([23, 30])
  })

  it('niets gelogd is niets', () => {
    expect(hoofdmaaltijden({})).toEqual([])
  })
})
