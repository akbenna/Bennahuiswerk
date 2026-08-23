/**
 * DE COACH BEWIJZEN
 *
 * Drie eigenschappen die stilletjes kapot kunnen en dan geen fout geven maar
 * een advies dat plausibel klinkt en verkeerd is.
 *
 * 1. De band om het tekort draait óm. At je aan de bovenkant van de schatting,
 *    dan hou je aan de ónderkant over. Wie die twee verwisselt bouwt een coach
 *    die je op je drukste dag vertelt dat er nog van alles in past.
 * 2. De eiwiteis is de hele rangschikking. Zodra die verdwijnt of omdraait,
 *    stelt de app precies het verkeerde voor: wat lekker binnen de calorieën
 *    past maar je eiwit onhaalbaar maakt.
 * 3. Zwijgen is de standaard. Een prikkel die te vaak afgaat is erger dan geen
 *    prikkel, want dan zet je hem uit en hoor je ook het bericht niet meer dat
 *    er wél toe deed.
 */
import { describe, expect, it } from 'vitest'
import { meldenNu, tekort, voorstellen } from './coach'
import type { Dagstand } from './coach'
import type { Graad, IsoDatum, Moment, Regel, RegelBron } from '@/gedeeld/db/tabellen'

let teller = 0

function regel(
  datum: string, naam: string, moment: Moment, kcal: number, eiwit: number,
): Regel {
  return {
    id: 'r' + ++teller, datum: datum as IsoDatum, moment, naam,
    hoeveelheid: null, eenheid: null, gram_equivalent: null,
    kcal_punt: kcal, kcal_laag: Math.round(kcal * 0.85), kcal_hoog: Math.round(kcal * 1.15),
    eiwit_g: eiwit, vet_g: 5, koolhydraat_g: 20, vezel_g: 2,
    conf: 'B' as Graad, onzekerheidsbronnen: null, bron: 'tekst-ai' as RegelBron,
    nevo_code: null, dish_id: null, recept_id: null, foto_pad: null,
    ruwe_invoer: null, ai_model: null,
  }
}

const NU = '2026-08-23' as IsoDatum
const stand = (kcal: number, eiwit: number, marge = 0.15): Dagstand => ({
  kcal, eiwit,
  kcalLaag: Math.round(kcal * (1 - marge)),
  kcalHoog: Math.round(kcal * (1 + marge)),
})

describe('tekort', () => {
  it('trekt af, en draait de band daarbij om', () => {
    const t = tekort(stand(1200, 60), 2000, 160)
    expect(t.kcalOver).toBe(800)
    /* At je 1380 (de bovenkant), dan hou je 620 over — dat is de óndergrens. */
    expect(t.kcalOverLaag).toBe(620)
    expect(t.kcalOverHoog).toBe(980)
    expect(t.eiwitOver).toBe(100)
  })

  it('meldt gehaald eiwit als gehaald en gaat niet door naar negatief', () => {
    const t = tekort(stand(1200, 180), 2000, 160)
    expect(t.eiwitOver).toBe(0)
    expect(t.eiwitRond).toBe(true)
    expect(t.eis).toBeNull()
  })

  it('rekent de eiwiteis per kcal uit', () => {
    const t = tekort(stand(1500, 100), 2000, 160)
    /* 60 gram in 500 kcal: alles vanaf hier moet 0,12 g/kcal halen. */
    expect(t.eis).toBeCloseTo(0.12, 5)
  })

  it('weet dat je erover zit', () => {
    const t = tekort(stand(2300, 150), 2000, 160)
    expect(t.erover).toBe(true)
    expect(t.kcalOver).toBe(-300)
    expect(t.eis).toBeNull()   // geen ruimte meer om eiwit in te stoppen
  })

  it('houdt zich stil als er nog geen doel is', () => {
    const t = tekort(stand(1200, 60), null, 160)
    expect(t.kcalOver).toBe(0)
    expect(t.erover).toBe(false)
  })
})

describe('voorstellen', () => {
  /* Een geschiedenis met twee soorten eten: iets eiwitrijks en iets dat vooral
     calorieën levert. */
  const geschiedenis = [
    regel('2026-08-20', 'Magere kwark met noten', 'tussendoor', 300, 40),
    regel('2026-08-21', 'Magere kwark met noten', 'tussendoor', 300, 40),
    regel('2026-08-19', 'Twee bruine boterhammen', 'tussendoor', 320, 10),
    regel('2026-08-20', 'Twee bruine boterhammen', 'tussendoor', 320, 10),
    regel('2026-08-21', 'Twee bruine boterhammen', 'tussendoor', 320, 10),
    regel('2026-08-22', 'Twee bruine boterhammen', 'tussendoor', 320, 10),
  ]

  it('zet wat de eiwiteis haalt boven wat je vaker eet', () => {
    /* 60 gram eiwit in 500 kcal: de eis is 0,12. Kwark haalt 0,133, brood
       0,031. Brood is vaker gegeten en zou zonder deze regel bovenaan staan. */
    const t = tekort(stand(1500, 100), 2000, 160)
    const uit = voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor' })
    expect(uit[0]?.naam).toBe('Magere kwark met noten')
    expect(uit[0]?.reden).toBe('eiwit')
    expect(uit[1]?.reden).toBe('past')
  })

  it('vertelt wat er overblijft als je het eet', () => {
    const t = tekort(stand(1500, 100), 2000, 160)
    const eerste = voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor' })[0]
    expect(eerste?.restKcal).toBe(200)
    expect(eerste?.restEiwit).toBe(20)
  })

  it('noemt het gewoonte zodra het eiwit rond is', () => {
    const t = tekort(stand(1500, 200), 2000, 160)
    const uit = voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor' })
    expect(uit.every((v) => v.reden === 'gewoonte')).toBe(true)
  })

  it('stelt niets voor als je over je doel zit', () => {
    const t = tekort(stand(2300, 150), 2000, 160)
    expect(voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor' })).toEqual([])
  })

  it('laat weg wat niet meer past', () => {
    /* Nog 100 kcal over: niets uit deze geschiedenis past daarin. Dít is het
       moment waarop een model iets toe te voegen heeft. */
    const t = tekort(stand(1900, 100), 2000, 160)
    expect(voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor' })).toEqual([])
  })

  it('rangschikt op dichtheid en niet op de grootste portie', () => {
    /* Dit ging mis op het scherm. Haalt niets de eis, dan zette de sortering op
       absoluut eiwit het grootste gerecht bovenaan — bijna je hele resterende
       ruimte in één keer. De eis is uitgedrukt per kcal, dus daarop hoort ook
       gerangschikt te worden. */
    const zwaar = [
      regel('2026-08-20', 'Tajine met kip', 'diner', 720, 46),   // 0,064 g/kcal
      regel('2026-08-21', 'Griekse yoghurt', 'diner', 210, 14),  // 0,067 g/kcal
    ]
    const t = tekort(stand(900, 52), 2010, 160)                  // eis 0,097
    const uit = voorstellen(zwaar, t, { nu: NU, moment: 'diner' })
    expect(uit.every((v) => v.reden === 'past')).toBe(true)
    expect(uit[0]?.naam).toBe('Griekse yoghurt')
  })

  it('houdt zich aan max', () => {
    const t = tekort(stand(1000, 50), 2500, 160)
    expect(voorstellen(geschiedenis, t, { nu: NU, moment: 'tussendoor', max: 1 })).toHaveLength(1)
  })
})

describe('meldenNu', () => {
  const achter = tekort(stand(1200, 60), 2000, 160)     // 800 kcal en 100 g te gaan

  it('zwijgt buiten de uren waarop je er iets mee kunt', () => {
    expect(meldenNu(achter, 7).melden).toBe(false)
    expect(meldenNu(achter, 22).melden).toBe(false)
  })

  it('meldt als het eiwit achterloopt en er nog ruimte is', () => {
    expect(meldenNu(achter, 15)).toEqual({ melden: true, reden: 'eiwit-achter' })
  })

  it('zwijgt als het verschil kleiner is dan de meetfout', () => {
    /* Nog tien gram eiwit te gaan: dat is minder dan één portie en binnen de
       ruis van het loggen zelf. */
    const bijna = tekort(stand(1500, 150), 2000, 160)
    expect(meldenNu(bijna, 15).melden).toBe(false)
  })

  it('waarschuwt vroeg als de ruimte bijna op is, en niet meer laat', () => {
    const krap = tekort(stand(1800, 150), 2000, 160)
    expect(meldenNu(krap, 13)).toEqual({ melden: true, reden: 'bijna-op' })
    expect(meldenNu(krap, 19).melden).toBe(false)
  })

  it('meldt onder-eten pas als de dag half om is', () => {
    const veel = tekort(stand(600, 200), 2000, 160)
    expect(meldenNu(veel, 11).melden).toBe(false)
    expect(meldenNu(veel, 18)).toEqual({ melden: true, reden: 'ruimte-over' })
  })

  it('zegt niets als je er al overheen zit', () => {
    /* Daar valt niets meer aan te doen vandaag, en het benoemen helpt niemand. */
    expect(meldenNu(tekort(stand(2300, 200), 2000, 160), 15).melden).toBe(false)
  })
})
