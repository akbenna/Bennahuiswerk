/**
 * DE OVERZETTING BEWIJZEN
 *
 * De rekenkern is uit een gedraaid, verantwoord JavaScript-bestand overgezet
 * naar TypeScript. Zo'n overzetting is precies het moment waarop een stille
 * fout binnenkomt: een haakje verplaatst, een `Math.round` een niveau
 * verschoven, een `>=` dat een `>` wordt. Niets daarvan geeft een foutmelding;
 * het geeft een ander getal.
 *
 * Daarom controleert deze proef niet tegen wat ik dacht dat eruit moest komen,
 * maar tegen wat er werkelijk uit de oude code kwam, over veertig
 * dagenreeksen, dertig SCORE2-gevallen, twintig FIB-4's, vijfentwintig
 * STOP-BANG-invullingen en vijftien onderhoudszones. Zie
 * gereedschap/gouden-waarden-maken.mjs.
 */
import { describe, expect, it } from 'vitest'
import gouden from './gouden-waarden.json'
import type { Dagenkaart, Trendpunt } from './rekenkern'
import { KCAL_PER_KG, VENSTER, analyse, trendReeks } from './rekenkern'
import { fib4, onderhoudZone, score2, stopbangScore } from './klinisch'
import type { Fib4Invoer, Score2Invoer, StopbangAntwoorden } from './klinisch'
import type { Geslacht, IsoDatum, Profiel } from '@/gedeeld/db/tabellen'

/** De gouden waarden zijn json en dus ongetypt; hier gaan ze de typen in. */
interface Geval {
  profiel: Profiel
  dagen: Dagenkaart
  analyse: Record<string, unknown>
  trend: unknown
}
const gevallen = gouden.gevallen as unknown as Geval[]
const peildag = gouden._peildag

describe('constanten', () => {
  it('staan gelijk aan de oude', () => {
    expect(KCAL_PER_KG).toBe(gouden.constanten.KCAL_PER_KG)
    expect(VENSTER).toBe(gouden.constanten.VENSTER)
  })
})

/** Velden die de oude rekenkern niet had. Zie de toelichting in de proef. */
const NA_DE_OVERZETTING = ['tdeeOordeel', 'laagMogelijk']

describe('analyse: veertig dagenreeksen', () => {
  gevallen.forEach((g, i) => {
    it(`geval ${i}: ${Object.keys(g.dagen).length} dagen, ${g.profiel.geslacht}${g.profiel.leeftijd_jaar}`, () => {
      const nu = analyse(g.dagen, g.profiel, peildag) as unknown as Record<string, unknown>
      // Elk veld apart vergelijken: bij een verschil wil je weten wélk getal.
      for (const sleutel of Object.keys(g.analyse)) {
        expect({ [sleutel]: nu[sleutel] }).toEqual({ [sleutel]: g.analyse[sleutel] })
      }
      /* En andersom, zodat een veld niet stilletjes kan verdwijnen. Velden die
         ná de overzetting zijn toegevoegd staan hierboven met name genoemd: de
         oude rekenkern kende ze niet en de gouden waarden kunnen er dus niets
         over zeggen. Ze uitzonderen met een naam en niet met een patroon, zodat
         elke toevoeging een bewuste regel in deze proef is. */
      expect(Object.keys(nu).filter((k) => !NA_DE_OVERZETTING.includes(k)).sort())
        .toEqual(Object.keys(g.analyse).sort())
    })
  })
})

describe('trendReeks', () => {
  /* OP DE VELDEN DIE DE OUDE PAGINA KÉNDE, EN NIET MEER DAN DIE
 
     De gouden waarden komen uit `gereedschap/oud/health-index.html`. Die versie
     kende `afwijkingKg` en `uitbijter` nog niet, dus een strikte vergelijking
     valt om zodra er een veld bij komt, en dan zegt ze niets meer over de
     velden die er al waren.
 
     Daarom wordt er vergeleken op de sleutels die de gouden waarde zélf draagt.
     Een veld dat verdwijnt valt nog steeds om, een waarde die verandert ook.
     Alleen een nieuw veld glipt erdoor, en dat is precies de vrijheid die een
     uitbreiding nodig heeft. De nieuwe velden hebben hun eigen proef, onderaan
     dit bestand. */
  const zoalsVroeger = (punten: readonly Trendpunt[], gouden: readonly object[]): object[] =>
    punten.map((p, i) => Object.fromEntries(
      Object.keys(gouden[i] ?? {}).map((k) => [k, (p as unknown as Record<string, unknown>)[k]])))

  gevallen.forEach((g, i) => {
    it(`geval ${i}`, () => {
      const goud = g.trend as readonly object[]
      expect(zoalsVroeger(trendReeks(g.dagen), goud)).toEqual(goud)
    })
  })

  /* En dat de oude velden er allémaal nog zijn. Zonder deze regel zou een
     hernoemd veld groen staan: de vergelijking hierboven zou er dan overal
     `undefined` voor invullen aan beide kanten. */
  it('draagt nog elk veld dat de oude pagina kende', () => {
    const punt = trendReeks(gevallen[0]!.dagen)[0]!
    const eerste = (gevallen[0]!.trend as readonly object[])[0] ?? {}
    for (const sleutel of Object.keys(eerste)) {
      expect(punt, sleutel).toHaveProperty(sleutel)
    }
  })
})

/* SCORE2 is de enige van deze vijf die niet op de bit af vergeleken wordt, en
   dat is geen verzachting maar een correctie. De formule ketent exponentiëlen:
   `Math.exp` en `Math.pow` mogen per implementatie in de laatste bit afwijken,
   en dat doen ze ook, op Node 24 vielen twee van de dertig gevallen om op het
   vijftiende significante cijfer (12.86730793710429 tegen 12.8673079371043).
   Dat is geen overzettingsfout maar het gedrag van een `double`.

   Wat deze proef moet vangen is een verplaatst haakje of een omgeklapt
   vergelijkingsteken, en dat verandert een uitkomst in het derde cijfer, niet
   in het vijftiende. Tien decimalen is daarvoor een miljard keer scherper dan
   nodig. De klasse blijft wél exact vergeleken: dat is het enige dat een
   patiënt ooit te zien krijgt, en die mag niet schuiven. */
describe('score2', () => {
  ;(
    gouden.score2 as Array<{
      geslacht: string
      invoer: Score2Invoer
      uit: { risico: number; klasse: string } | null
    }>
  ).forEach((g, i) => {
    it(`geval ${i}: ${g.geslacht}, ${g.invoer.leeftijd} jaar`, () => {
      const uit = score2(g.geslacht as Geslacht, g.invoer)
      if (g.uit === null) {
        expect(uit).toBeNull()
        return
      }
      expect(uit).not.toBeNull()
      expect(uit!.klasse).toBe(g.uit.klasse)
      expect(uit!.risico).toBeCloseTo(g.uit.risico, 10)
    })
  })
})

describe('fib4', () => {
  ;(gouden.fib4 as Array<{ invoer: Fib4Invoer; uit: unknown }>).forEach((g, i) => {
    it(`geval ${i}`, () => {
      expect(fib4(g.invoer)).toEqual(g.uit)
    })
  })
})

describe('stopbang', () => {
  ;(gouden.stopbang as Array<{ invoer: StopbangAntwoorden; uit: unknown }>).forEach((g, i) => {
    it(`geval ${i}`, () => {
      expect(stopbangScore(g.invoer)).toEqual(g.uit)
    })
  })
})

describe('onderhoudZone', () => {
  ;(gouden.onderhoud as Array<{ trend: number; basis: number; uit: { zone: string; delta: number } | null }>)
    .forEach((g, i) => {
      it(`geval ${i}: trend ${g.trend} tegen basis ${g.basis}`, () => {
        const nu = onderhoudZone(g.trend, g.basis)
        // De oude gaf ook een kleur terug; die hoort niet in een rekenfunctie
        // en wordt hier dus niet vergeleken. Zie de kop van klinisch.ts.
        expect(nu).toEqual(g.uit == null ? null : { zone: g.uit.zone, delta: g.uit.delta })
      })
    })
})

/**
 * DE GRENS AAN WAT DE BALANS MAG BEWEREN
 *
 * Dit is nagerekend op een echt schermbeeld, niet op een verzonnen geval. De
 * app toonde "Wat je lichaam verbruikt: −15.786–13.652 kcal" bij een logboek
 * van 1.461 kcal over twaalf dagen en een weegtrend van +2,30 kg per week. De
 * som klopte; de bewering kon niet waar zijn.
 *
 * De proeven hieronder gaan over het oordeel en niet over de som, die blijft
 * met opzet staan zoals hij was.
 */
describe('tdeeOordeel', () => {
  /** Een reeks dagen met een vaste inname en een vaste gewichtshelling. */
  function reeks(kcalPerDag: number, kgPerDag: number, startKg: number): Dagenkaart {
    const uit: Dagenkaart = {}
    for (let i = 0; i < 28; i++) {
      const d = new Date(Date.UTC(2026, 7, 1 + i)).toISOString().slice(0, 10)
      uit[d] = {
        datum: d, _kcal: kcalPerDag, _eiwit: 100, _laag: kcalPerDag, _hoog: kcalPerDag,
        gewicht_kg: Math.round((startKg + kgPerDag * i) * 10) / 10, stappen: 6000,
      } as Dagenkaart[string]
    }
    return uit
  }
  const pf = { ...gevallen[0]!.profiel, lengte_cm: 196, gewicht_kg: 119, leeftijd_jaar: 45 }
  const peil = '2026-08-28'

  it('keurt de zaak van het schermbeeld af: aankomen op 1.461 kcal kan niet', () => {
    const a = analyse(reeks(1461, 2.3 / 7, 119), pf, peil)
    expect(a.tdee).not.toBeNull()
    expect(a.tdee!).toBeLessThan(a.rustBMR)
    expect(a.tdeeOordeel).toBe('onder-rust')
  })

  it('laat een gewone afvalreeks ongemoeid', () => {
    const a = analyse(reeks(2000, -0.7 / 7, 119), pf, peil)
    expect(a.tdeeOordeel).toBe('goed')
    expect(a.tdee!).toBeGreaterThan(a.rustBMR)
  })

  it('keurt ook het onmogelijke aan de bovenkant af', () => {
    /* Drieënhalve kilo per week eraf op 2.000 kcal vraagt een verbruik van
       5.850 kcal per dag, tweeënhalf keer het rustverbruik van deze persoon
       is 5.488. Twee kilo per week haalt die grens nog níet (4.200), en dat is
       terecht: dat tempo is ongezond maar niet onmogelijk. Deze proef ging bij
       het schrijven dan ook eerst op twee kilo en viel om, op mijn
       verwachting, niet op de code. */
    const a = analyse(reeks(2000, -3.5 / 7, 119), pf, peil)
    expect(a.tdee!).toBeGreaterThan(a.rustBMR * 2.5)
    expect(a.tdeeOordeel).toBe('boven-plafond')
  })

  it('geeft geen oordeel zolang er geen uitkomst is', () => {
    const leeg: Dagenkaart = {}
    expect(analyse(leeg, pf, peil).tdeeOordeel).toBeNull()
  })

  it('kapt de ondergrens van de band af op de ruststofwisseling', () => {
    const a = analyse(reeks(1461, 2.3 / 7, 119), pf, peil)
    expect(a.laag!).toBeLessThan(a.rustBMR)
    expect(a.laagMogelijk).toBe(a.rustBMR)
  })

  it('raakt een band die al boven het rustverbruik ligt niet aan', () => {
    const a = analyse(reeks(2000, -0.7 / 7, 119), pf, peil)
    if (a.laag! > a.rustBMR) expect(a.laagMogelijk).toBe(a.laag)
  })

  /* WAT `eind` MOET AFSNIJDEN
   *
   * `eind` knipte het venster af maar niet het referentiegewicht: dat werd
   * gezocht in de hele dagenkaart. Bij de gewone aanroep valt dat niet op,
   * want dan houdt de kaart bij vandaag op. Zodra er een venster van vroeger
   * wordt nagerekend, zoals `aanpassing.ts` doet, rekende de analyse van juli
   * zijn rustverbruik op de weging van september.
   *
   * De proef laat het verschil groot genoeg zijn om niet in afrondruis te
   * verdwijnen: twintig kilo na afloop van het venster. */
  it('laat een weging van ná het venster het rustverbruik niet bepalen', () => {
    const dagen = reeks(2000, -0.7 / 7, 119)
    const alleen = analyse(dagen, pf, peil)
    const later = { ...dagen }
    const na = '2026-09-20'
    later[na] = { datum: na, gewicht_kg: 99, stappen: 6000 } as Dagenkaart[string]

    expect(analyse(later, pf, peil).rustBMR).toBe(alleen.rustBMR)
    /* En zonder de grens zou dít eruit zijn gekomen. Staat de proef er los
       bij, dan is te zien dat de twee uitkomsten werkelijk verschillen en de
       bewering hierboven dus iets vasthoudt. */
    expect(analyse(later, pf, na).rustBMR).toBeLessThan(alleen.rustBMR)
  })
})

describe('de uitbijtermarkering', () => {
  /* Hoofdstuk 1 van VERANTWOORDING.md beloofde deze markering al terwijl het
     woord uitbijter nergens in de code stond. Wat hier vastligt is niet alleen
     dát er gemarkeerd wordt maar ook hoe weinig: de app gooit niets weg. */
  const reeks = (gewichten: Array<number | null>): Trendpunt[] => {
    const dagen: Dagenkaart = {}
    gewichten.forEach((g, i) => {
      const d = `2026-08-${String(i + 1).padStart(2, '0')}` as IsoDatum
      dagen[d] = { datum: d, gewicht_kg: g, _kcal: 0, _eiwit: 0, _laag: 0, _hoog: 0 }
    })
    return trendReeks(dagen)
  }

  it('wijst de weging aan die niet bij de reeks past', () => {
    const r = reeks([118, 117.8, 118.2, 117.9, 118.1, 190.2, 118, 117.7])
    expect(r.filter((p) => p.uitbijter).map((p) => p.w)).toEqual([190.2])
  })

  /* DE REDEN DAT HIER DE MEDIAAN STAAT EN NIET HET GEMIDDELDE
     Eén weging van 190 in een reeks rond 118 tilt een gewone standaarddeviatie
     zo ver op dat de 190 er binnen drie ervan valt. Deze regel valt om zodra
     iemand de mediane absolute afwijking door een gewone sd vervangt. */
  it('verstopt een grove uitbijter niet achter zijn eigen invloed', () => {
    const w = [118, 117.8, 118.2, 117.9, 118.1, 190.2, 118, 117.7]
    const afw = reeks(w).map((p) => p.afwijkingKg).filter((x): x is number => x != null)
    const gem = afw.reduce((a, b) => a + b, 0) / afw.length
    const sd = Math.sqrt(afw.reduce((a, x) => a + (x - gem) ** 2, 0) / (afw.length - 1))
    const grofste = Math.max(...afw.map((x) => Math.abs(x - gem)))
    expect(grofste).toBeLessThan(3 * sd)          // een gewone sd ziet hem niet
    expect(reeks(w).some((p) => p.uitbijter)).toBe(true)   // deze wel
  })

  it('laat gewone schommelingen met rust, ook bij een heel stabiele weger', () => {
    /* Tweehonderd gram spreiding maakt drie sd zeshonderd gram. Zonder de vloer
       van drie kilo zou een kilo na een zoute maaltijd hier een uitbijter zijn,
       en dat is precies wat hoofdstuk 1 fysiologisch noemt. */
    const r = reeks([100, 100.2, 99.9, 100.1, 100, 101, 100.1, 99.8])
    expect(r.some((p) => p.uitbijter)).toBe(false)
  })

  /* DE BELANGRIJKSTE REGEL VAN DIT BLOK
     Deze app is er voor iemand die afvalt. Een markering die afgaat op de
     gewone daling waar het hele traject om draait zou het scherm vullen met
     waarschuwingen over precies het gedrag dat de bedoeling is. Achtentwintig
     dagen op streeftempo, met de dagelijkse ruis erbij: geen enkele markering. */
  it('gaat niet af op een gestage daling, ook niet na vier weken', () => {
    const ruis = [0.4, -0.3, 0.1, -0.5, 0.2, 0.3, -0.2]
    const w = Array.from({ length: 28 }, (_, i) =>
      Math.round((118 - i * (0.8 / 7) + ruis[i % 7]!) * 10) / 10)
    const r = reeks(w)
    expect(r.filter((p) => p.uitbijter).map((p) => p.w)).toEqual([])
  })

  it('markeert niets zolang er te weinig wegingen zijn voor een spreiding', () => {
    expect(reeks([118, 190]).some((p) => p.uitbijter)).toBe(false)
    expect(reeks([118, 190, 118, 118]).some((p) => p.uitbijter)).toBe(false)
  })

  it('gooit niets weg: de uitbijter blijft staan en telt mee in de trend', () => {
    const r = reeks([118, 117.8, 118.2, 117.9, 118.1, 190.2, 118, 117.7])
    expect(r.filter((p) => p.w != null)).toHaveLength(8)
    const na = r[5]!
    expect(na.w).toBe(190.2)
    expect(na.ema).not.toBeNull()
    /* De EWMA loopt na die weging omhoog. Dat hoort zo: niet weggooien
       betekent ook niet stilletjes buiten de som houden. */
    expect(na.ema!).toBeGreaterThan(r[4]!.ema!)
  })

  it('meet de afwijking tegen de buren en niet tegen de weging zelf', () => {
    const r = reeks([100, 100, 100, 100, 100, 110])
    /* De buren van de laatste staan alle vijf op 100, dus de afwijking is tien. */
    expect(r[5]!.afwijkingKg).toBe(10)
  })

  /* DEZE REGEL IS ER OMDAT EEN MUTANT HEM OVERLEEFDE
     De weging telt niet mee in zijn eigen verwachting. Dat stond er wel, maar
     geen enkele regel hield het vast: bij een mediaan verschuift één waarde er
     nauwelijks iets, dus de meeste reeksen geven hetzelfde antwoord met of
     zonder die uitzondering.
 
     Hier niet. Zes buren splitsen zich in drie van 100 en drie van 110, dus hun
     mediaan is 105 en de afwijking vijf. Telt de weging zelf mee, dan zijn het
     zeven waarden, ligt de mediaan op 110, en is de afwijking nul: een weging
     die zichzelf gelijk geeft. */
  it('laat een weging niet over zijn eigen verwachting meebeslissen', () => {
    const r = reeks([100, 100, 100, 110, 110, 110, 110])
    expect(r[3]!.afwijkingKg).toBe(5)
  })

  /* DE REGEL DIE DE EERSTE OPZET AFKEURDE
     Toen de verwachting nog de EWMA van ervoor was, maakte één verkeerde toets
     er drie: de EWMA loopt naar de uitbijter toe, dus de twee wegingen erna
     weken ook ver af en werden evengoed aangemerkt. */
  it('besmet de wegingen ná een uitbijter niet', () => {
    const r = reeks([118, 117.8, 118.2, 117.9, 118.1, 190.2, 118, 117.7, 118, 117.9])
    expect(r.filter((p) => p.uitbijter).map((p) => p.w)).toEqual([190.2])
  })
})
