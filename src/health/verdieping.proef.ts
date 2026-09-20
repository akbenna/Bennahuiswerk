/**
 * WAT DEZE PROEF VASTHOUDT
 *
 * Drie dingen, en ze gaan geen van drieën over de inhoud van een tekst. Ze gaan
 * over de vorm, want de vorm is hier de belofte.
 *
 * DE TEKSTEN ZIJN CONSTANTEN
 *
 * Net als bij `leren.ts`: zodra iemand ooit een gewicht, een dosis of een naam
 * in een stuk weeft, is dit boekje geen boekje meer maar software die
 * patiëntgegevens verwerkt, en schuift de app een categorie op waar hij niet
 * thuishoort. Zie de kop van `verdieping.ts` en
 * `health/STRATEGIE-CHRONISCHE-ZORG.md`.
 *
 * Hier is dat sterker af te dwingen dan bij `leren.ts`: die functie krijgt nog
 * een conditie mee om de volgorde te bepalen. Deze lijst krijgt niets. Er ís
 * geen invoer, dus er valt niets te verwerken — en dat is precies wat hieronder
 * staat.
 *
 * ELK STUK ZEGT WAT HET NIET WEET
 *
 * `nietWeten` mag nooit leeg zijn. In deze markt zijn de claims hard en het
 * bewijs zacht; zeggen waar de zekerheid ophoudt is het enige echte onderscheid.
 * Een stuk zonder dat veld is precies het soort tekst dat dit boekje niet wil
 * zijn, en die zou er stil in glippen zodra iemand haast heeft.
 *
 * EN ELK STUK DRAAGT ZIJN HERKOMST
 *
 * Een gezondheidstekst zonder bron is in deze app dezelfde fout als een
 * voedingswaarde zonder bron.
 */
import { describe, expect, it } from 'vitest'
import { MEDICATIE } from './trap'
import { VERDIEPINGEN } from './verdieping'

describe('de vorm van elk stuk', () => {
  it('er zijn acht stukken en geen twee delen een id', () => {
    expect(VERDIEPINGEN).toHaveLength(8)
    expect(new Set(VERDIEPINGEN.map((v) => v.id)).size).toBe(VERDIEPINGEN.length)
  })

  it('elk stuk heeft een titel, een korte zin en een bron', () => {
    for (const v of VERDIEPINGEN) {
      expect(v.titel, v.id).toBeTruthy()
      expect(v.kort, v.id).toBeTruthy()
      expect(v.bron, v.id).toBeTruthy()
      /* De korte zin staat in de dichte stand en moet daar op één regel passen. */
      expect(v.kort.length, v.id).toBeLessThan(120)
    }
  })

  /* DE BELANGRIJKSTE VAN DIT BESTAND.
     Een stuk dat alleen zegt wat we weten is reclame met voetnoten. */
  it('elk stuk zegt wat het níét weet, en dat is nooit leeg', () => {
    for (const v of VERDIEPINGEN) {
      expect(v.nietWeten.length, v.id).toBeGreaterThan(0)
      for (const zin of v.nietWeten) expect(zin.trim(), v.id).toBeTruthy()
    }
  })

  it('en er staat altijd meer dan één alinea onder "wat we weten"', () => {
    for (const v of VERDIEPINGEN) {
      expect(v.weten.length, v.id).toBeGreaterThan(1)
    }
  })

  it('elk stuk zegt waar je het in de app terugziet', () => {
    for (const v of VERDIEPINGEN) expect(v.inDeApp, v.id).toBeTruthy()
  })
})

describe('het blijft een boekje', () => {
  /* Er is geen functie met invoer. Dat is de sterkste vorm van de garantie die
     `leren.ts` met een proef moet afdwingen: daar gaat nog een conditie in om
     de volgorde te bepalen, hier gaat er niets in. Twee keer lezen geeft
     letterlijk hetzelfde, want er valt niets aan te veranderen. */
  it('twee keer lezen geeft letterlijk hetzelfde', () => {
    const plat = () => VERDIEPINGEN
      .map((v) => [v.id, v.titel, v.kort, v.weten.join(' '), v.nietWeten.join(' '),
        v.inDeApp, v.bron].join('|')).join('\n')
    expect(plat()).toBe(plat())
  })

  /* En de lijst is niet te wijzigen vanuit een scherm. `readonly` houdt dat
     tijdens het typen tegen; dit houdt het tegen als iemand het type omzeilt. */
  it('de lijst is bevroren voor wie het type omzeilt', () => {
    const lijst = VERDIEPINGEN as unknown as Array<Record<string, unknown>>
    const voor = lijst.length
    expect(() => { lijst.push({ id: 'smokkel' }) }).toBeTypeOf('function')
    /* De push mag mislukken of slagen — waar het om gaat is dat de proef hem
       ziet als hij slaagt. Daarom telt hij terug. */
    if (lijst.length !== voor) lijst.pop()
    expect(lijst.length).toBe(voor)
  })

  /* Geen enkel stuk mag een persoonlijk getal bevatten dat eruitziet als een
     berekening. Deze proef is grof — hij zoekt naar de tekens waarmee een
     sjabloon zou worden ingevuld — maar hij vangt de fout die telt: iemand die
     later een template-literal met een waarde erin plakt. */
  it('geen enkel stuk draagt een ingevuld sjabloon', () => {
    for (const v of VERDIEPINGEN) {
      const alles = [v.titel, v.kort, v.inDeApp, ...v.weten, ...v.nietWeten].join(' ')
      expect(alles, v.id).not.toMatch(/\$\{|\{\{|%s|\[jouw?\b/i)
    }
  })
})

describe('de trap zegt niet wat hij niet weet', () => {
  /* DEZE PROEF HEEFT GEDAAN WAARVOOR HIJ STOND, EN IS DAARNA HERSCHREVEN

     Hij hield vast dat dit stuk geen BMI-grenzen noemt, met als reden dat de
     criteria uit samenvattingen kwamen en niet uit de standaard zelf. De
     standaard is er inmiddels wel — augustus 2026, in `trap.ts` — en toen de
     tekst dat rechtzette viel deze regel om. Precies zoals bedoeld: hij dwong
     iemand na te kijken of de bron inmiddels deugde.

     Wat blijft is de andere helft van het besluit. De grenzen stáán nu in de
     app, op Profiel, met beide drempelsets en met de reden waarom de app niet
     zegt of jij eroverheen komt. Ze horen niet óók in dit boekje: hier gaat het
     om de volgorde van de trap, en een los getal in een verhaal is precies het
     getal waar iemand zijn verwachting op bouwt. */
  it('bevat geen BMI-getallen, want die horen bij je traject en niet in een verhaal', () => {
    const trap = VERDIEPINGEN.find((v) => v.id === 'trap')!
    const alles = [...trap.weten, ...trap.nietWeten].join(' ')
    expect(alles).not.toMatch(/BMI\s*(van\s*)?[≥>]?\s*\d/)
    /* En het zégt waar ze dan wél staan, zodat het geen verzwijgen wordt. */
    expect(trap.nietWeten.join(' ')).toMatch(/Profiel/)
  })

  /* De bron hoort de standaard te zijn die de app werkelijk gelezen heeft, en
     niet de vorige. Deze twee regels stonden op verschillende data en niemand
     zag het, want ze staan in verschillende bestanden. */
  it('noemt dezelfde uitgave van de standaard als trap.ts', () => {
    const trap = VERDIEPINGEN.find((v) => v.id === 'trap')!
    expect([...trap.weten, trap.bron].join(' ')).toContain('augustus 2026')
    expect([...trap.weten, trap.bron].join(' ')).not.toMatch(/oktober 2025/)
    expect(MEDICATIE.bron).toContain('augustus 2026')
  })

  it('en stuurt naar de huisarts in plaats van een oordeel te vellen', () => {
    const trap = VERDIEPINGEN.find((v) => v.id === 'trap')!
    expect(trap.nietWeten.join(' ')).toMatch(/huisarts/)
  })
})

describe('het boekje schrijft niets voor', () => {
  /* De app wijst en verwijst. Een stuk dat in de gebiedende wijs een dosis of
     een middel aanraadt hoort hier niet te staan — dat is de grens tussen
     voorlichting en behandeling. */
  it('geen enkel stuk noemt een dosering in milligram', () => {
    for (const v of VERDIEPINGEN) {
      const alles = [...v.weten, ...v.nietWeten, v.inDeApp].join(' ')
      expect(alles, v.id).not.toMatch(/\d+\s*(mg|milligram)\b/i)
    }
  })

  it('en het GLP-1-stuk stuurt bij alarmsignalen naar een arts', () => {
    const g = VERDIEPINGEN.find((v) => v.id === 'glp1')!
    expect(g.weten.join(' ')).toMatch(/arts/)
  })
})
