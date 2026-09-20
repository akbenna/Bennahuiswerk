/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Eén eigenschap boven alles: **de tekst blijft letterlijk dezelfde.** Wat er
 * in gaat komt er weer uit, alleen in stukken geknipt. Een nadrukregel die
 * onderweg een spatie of een woord opeet richt in een medische tekst meer
 * schade aan dan geen nadruk, en dat soort fout is op het scherm bijna niet te
 * zien: er staat gewoon een zin, en er ontbreekt iets.
 *
 * Daarnaast de drie voorwaarden uit de kop van `nadruk.tsx`, en ze staan hier
 * elk met het geval waarvoor ze bestaan: `STEP-1` en `Diabetes2` (een cijfer
 * dat aan een woord vastzit), de eenheid die bij het getal hoort, en het kale
 * jaartal dat geen hoeveelheid is.
 */
import { describe, expect, it } from 'vitest'
import { splitsHoeveelheden } from './nadruk'

const stukken = (t: string): string[] =>
  splitsHoeveelheden(t).filter((s) => s.nadruk).map((s) => s.tekst)
const heel = (t: string): string => splitsHoeveelheden(t).map((s) => s.tekst).join('')

describe('de tekst blijft de tekst', () => {
  /* DE BELANGRIJKSTE PROEF VAN DIT BESTAND. */
  it('geeft letterlijk terug wat er in ging', () => {
    const zinnen = [
      'In de vervolgstudie van STEP-1 werden 327 deelnemers een jaar gevolgd.',
      'Van het oorspronkelijke verlies van ruim 17 procent bleef netto 5,6 procent over.',
      'Bij ouderen ligt die rond de 30 gram; sommige onderzoeken noemen 35 tot 40.',
      'De NHG-Standaard Obesitas van augustus 2026 vraagt een hogere BMI.',
      'Een zin zonder enig getal erin.',
      '',
    ]
    for (const z of zinnen) expect(heel(z), z).toBe(z)
  })

  it('laat een zin zonder getal in één stuk heel', () => {
    const uit = splitsHoeveelheden('Een zin zonder enig getal erin.')
    expect(uit).toHaveLength(1)
    expect(uit[0]!.nadruk).toBe(false)
  })
})

describe('wat er nadruk krijgt', () => {
  it('een getal met zijn eenheid, als één geheel', () => {
    expect(stukken('bleef netto 5,6 procent over')).toEqual(['5,6 procent'])
  })

  it('een bereik met de eenheid erachter', () => {
    expect(stukken('tijdens afvallen 1,2 tot 1,6 gram eiwit per kilo'))
      .toEqual(['1,2 tot 1,6 gram'])
  })

  it('ook een getal zonder eenheid', () => {
    expect(stukken('werden 327 deelnemers gevolgd')).toEqual(['327 deelnemers'])
    expect(stukken('op week 120 gemeten')).toEqual(['120'])
  })

  it('meer dan één per zin', () => {
    expect(stukken('rond de 30 gram; sommige noemen 35 tot 40.'))
      .toEqual(['30 gram', '35 tot 40'])
  })
})

describe('wat er géén nadruk krijgt', () => {
  /* Deze drie zijn de reden dat dit bestand bestaat. */
  it('een cijfer dat aan een naam vastzit', () => {
    expect(stukken('In de vervolgstudie van STEP-1 en SURMOUNT-1')).toEqual([])
    expect(stukken('wat GLP-1 doet')).toEqual([])
    expect(stukken('Keer Diabetes2 Om intensief')).toEqual([])
  })

  it('een kaal jaartal', () => {
    expect(stukken('de NHG-Standaard van augustus 2026')).toEqual([])
    expect(stukken('in januari 2025 stelde een commissie')).toEqual([])
  })

  /* En een jaartal met een eenheid erachter is wél een hoeveelheid: "2000 kcal"
     is geen jaar. Zonder deze regel zou de uitzondering te ver reiken. */
  it('maar wel een getal van vier cijfers met een eenheid', () => {
    expect(stukken('een dag van 2000 kcal')).toEqual(['2000 kcal'])
  })
})
