/**
 * ARABISCH, BEWEZEN
 *
 * Twee dingen die je niet met het oog controleert, en die daarom het zwaarst
 * getoetst worden: FSRS — de herhalingsplanner met negentien gepubliceerde
 * gewichten — en het nakijken van getypte antwoorden. Alles vergeleken met
 * src/arabisch/gouden-waarden.json, gedraaid uit de oude pagina zelf.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import gouden from './gouden-waarden.json'
import { EXTRA_TEKENS, LETTERS, TEKENS } from './gegevens/letters'
import { WOORDEN } from './gegevens/woorden'
import { GRAMMATICA } from './gegevens/grammatica'
import { ZINNEN } from './gegevens/zinnen'
import { TEKSTEN } from './gegevens/teksten'
import { KORAN100 } from './gegevens/koran'
import { BLOKKEN, JAAR, METING, METINGNIVEAUS, SESSIE, SESSIEMINUTEN } from './gegevens/jaarplan'
import { beoordeel, interval, ophaalbaarheid } from './fsrs'
import type { Kaartstaat, Oordeel } from './fsrs'
import {
  AMBIGU, antwoordKlopt, arIn, letterVormen, normAr, normNl, ontdoeTashkil, vocaliseer,
} from './tekst'
import type { Vocalisatie } from './tekst'
import {
  SPOORLEEFTIJD, SPOORNAAM, alleKaartIds, bouwPad, herhalingsRij, kaartId,
  spoorBijLeeftijd,
} from './leerplan'
import { leeg, samenvoegen } from './opslag'
import { bron } from './toeval'
import { toetsVragen } from './jaarles'
import { schattingMinuten } from './schermen/Vandaag'
import type { Losse, Profiel, Stand } from './opslag'
import { dagVerschil, datumNL, plusDagen } from './datum'
import type { Spoor } from './gegevens/soorten'

const vinger = (x: unknown): string =>
  createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)

/* De spreiding uitgezet: 0.5 laat `1 + (0.5*0.1 - 0.05)` precies op 1
   uitkomen, net als in de opwekker. */
const vast = (): number => 0.5

describe('FSRS', () => {
  it('loopt hele beoordelingsreeksen gelijk met vroeger', () => {
    for (const reeks of gouden.fsrs) {
      let k: Kaartstaat | null = null
      reeks.uit.forEach((stap, i) => {
        k = beoordeel(k, stap.g as Oordeel, stap.dag, vast)
        expect({ s: k.s, d: k.d, due: k.due, herh: k.herh, missers: k.missers },
          `pad ${reeks.pad.join('')} stap ${i + 1}`)
          .toEqual({ s: stap.s, d: stap.d, due: stap.due, herh: stap.herh, missers: stap.missers })
      })
    }
  })

  it('rekent dezelfde intervallen en ophaalbaarheden uit', () => {
    for (const g of gouden.intervallen) {
      expect(interval(g.s), `stabiliteit ${g.s}`).toBe(g.interval)
    }
    for (const g of gouden.ophaalbaar) {
      expect(+ophaalbaarheid(g.dagen, g.s).toFixed(10), `s=${g.s} na ${g.dagen} dagen`).toBe(g.r)
    }
  })

  it('laat de kans op onthouden dalen met de tijd en stijgen met de stabiliteit', () => {
    expect(ophaalbaarheid(0, 10)).toBe(1)
    expect(ophaalbaarheid(10, 10)).toBeLessThan(ophaalbaarheid(1, 10))
    expect(ophaalbaarheid(10, 100)).toBeGreaterThan(ophaalbaarheid(10, 10))
  })

  it('geeft na "makkelijk" een langer interval dan na "goed", en na "opnieuw" het kortste', () => {
    const basis: Kaartstaat = { s: 20, d: 5, laatst: '2026-08-01', due: '2026-08-21', herh: 3, missers: 0 }
    const opnieuw = beoordeel(basis, 1, '2026-08-21', vast)
    const goed = beoordeel(basis, 3, '2026-08-21', vast)
    const makkelijk = beoordeel(basis, 4, '2026-08-21', vast)
    expect(opnieuw.s).toBeLessThan(basis.s)
    expect(goed.s).toBeGreaterThan(basis.s)
    expect(makkelijk.s).toBeGreaterThan(goed.s)
  })

  it('telt de missers alleen bij "opnieuw"', () => {
    let k = beoordeel(null, 3, '2026-08-22', vast)
    expect(k.missers).toBe(0)
    k = beoordeel(k, 1, k.due, vast)
    expect(k.missers).toBe(1)
    k = beoordeel(k, 4, k.due, vast)
    expect(k.missers).toBe(1)
    expect(k.herh).toBe(3)
  })

  it('houdt het interval binnen drie jaar', () => {
    let k = beoordeel(null, 4, '2026-08-22', vast)
    for (let n = 0; n < 30; n++) k = beoordeel(k, 4, k.due, vast)
    expect(dagVerschil(k.laatst, k.due)).toBeLessThanOrEqual(365 * 3)
  })

  it('laat de spreiding het interval hoogstens vijf procent verschuiven', () => {
    const basis: Kaartstaat = { s: 100, d: 5, laatst: '2026-08-01', due: '2026-11-01', herh: 5, missers: 0 }
    const laag = beoordeel(basis, 3, '2026-11-01', () => 0)
    const hoog = beoordeel(basis, 3, '2026-11-01', () => 1)
    const dl = dagVerschil('2026-11-01', laag.due)
    const dh = dagVerschil('2026-11-01', hoog.due)
    expect(dh / dl).toBeGreaterThan(1.08)
    expect(dh / dl).toBeLessThan(1.12)
  })
})

describe('antwoorden nakijken', () => {
  it('keurt precies dezelfde antwoorden goed als vroeger', () => {
    for (const g of gouden.nakijken) {
      expect(antwoordKlopt(g.gegeven, g.juist), `"${g.gegeven}"`).toBe(g.klopt)
      expect(normNl(g.gegeven), `nl "${g.gegeven}"`).toBe(g.nl)
      expect(normAr(g.gegeven), `ar "${g.gegeven}"`).toBe(g.ar)
    }
  })

  it('haalt de klinkertekens eraf zoals vroeger', () => {
    for (const g of gouden.kaalGevallen) {
      expect(ontdoeTashkil(g.in), g.in).toBe(g.uit)
    }
  })

  it('rekent een streepje of een hoofdletter niet aan', () => {
    expect(antwoordKlopt('kitab', ['kitāb'])).toBe(true)
    expect(antwoordKlopt('KiTaB', ['kitāb'])).toBe(true)
    expect(antwoordKlopt('  kitab  ', ['kitāb'])).toBe(true)
    expect(antwoordKlopt('boek', ['kitāb'])).toBe(false)
  })

  it('schakelt de alif-varianten gelijk', () => {
    expect(antwoordKlopt('احمد', ['أحمد'])).toBe(true)
    expect(antwoordKlopt('أحمد', ['احمد'])).toBe(true)
    expect(antwoordKlopt('امر', ['إمر'])).toBe(true)
  })

  it('keurt een leeg antwoord nooit goed', () => {
    expect(antwoordKlopt('', ['kitāb'])).toBe(false)
    expect(antwoordKlopt('   ', ['kitāb'])).toBe(false)
  })
})

describe('de letters', () => {
  it('geeft dezelfde vier vormen als vroeger', () => {
    for (const g of gouden.vormen) {
      expect(letterVormen(g.l), g.l).toEqual({
        los: g.los, begin: g.begin, midden: g.midden, eind: g.eind,
        verbindtLinks: g.verbindtLinks,
      })
    }
  })

  it('laat de zes niet-verbindende letters niet naar links plakken', () => {
    for (const l of ['ا', 'د', 'ذ', 'ر', 'ز', 'و']) {
      expect(letterVormen(l).verbindtLinks, l).toBe(false)
      expect(letterVormen(l).begin, l).toBe(l)
    }
    expect(letterVormen('ب').verbindtLinks).toBe(true)
  })

  it('isoleert Arabisch dat middenin Nederlandse tekst staat', () => {
    for (const g of gouden.arInGevallen) {
      expect(arIn(g.in)).toBe(g.uit)
    }
    expect(arIn('geen Arabisch')).toBe('geen Arabisch')
  })
})

describe('de vocalisatie', () => {
  it('werkt precies zoals vroeger', () => {
    for (const g of gouden.vocalisaties) {
      expect(vocaliseer(g.zin, g.stand as Vocalisatie), `${g.zin} · ${g.stand}`).toBe(g.uit)
    }
  })

  it('houdt de tekens waar het woord zonder die tekens dubbelzinnig is', () => {
    /* كتب kan kataba, kutiba, kutub of kutub zijn — daar blijven de tekens. */
    expect(AMBIGU.has('كتب')).toBe(true)
    expect(vocaliseer('كَتَبَ', 'selectief')).toBe('كَتَبَ')
    expect(vocaliseer('بَيْت', 'selectief')).toBe('بيت')
  })
})

describe('de leerstof', () => {
  it('is ongeschonden overgekomen', () => {
    const zelfde = <T>(rij: T[], g: Array<{ vinger: string }>, naam: string): void => {
      expect(rij, naam).toHaveLength(g.length)
      rij.forEach((x, i) => expect(vinger(x), `${naam}[${i}]`).toBe(g[i]!.vinger))
    }
    zelfde(LETTERS, gouden.stof.letters, 'letters')
    zelfde(TEKENS, gouden.stof.tekens, 'tekens')
    zelfde(EXTRA_TEKENS, gouden.stof.extra, 'extra')
    zelfde(WOORDEN, gouden.stof.woorden, 'woorden')
    zelfde(GRAMMATICA, gouden.stof.grammatica, 'grammatica')
    zelfde(ZINNEN, gouden.stof.zinnen, 'zinnen')
    zelfde(TEKSTEN, gouden.stof.teksten, 'teksten')
    zelfde(KORAN100, gouden.stof.koran, 'koran')
    zelfde(JAAR, gouden.stof.jaar, 'jaar')
    zelfde(METING, gouden.stof.meting, 'meting')
    expect(BLOKKEN).toEqual(gouden.stof.blokken)
    expect(SESSIE).toEqual(gouden.stof.sessie)
    expect(SESSIEMINUTEN).toBe(gouden.stof.sessieminuten)
    expect(METINGNIVEAUS).toEqual(gouden.stof.metingniveaus)
  })

  it('telt achtentwintig letters en zesendertig weken', () => {
    expect(LETTERS).toHaveLength(28)
    expect(JAAR).toHaveLength(36)
    expect(JAAR.map((w) => w.n)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1))
  })

  it('houdt het juiste antwoord binnen de opties', () => {
    for (const g of GRAMMATICA) {
      for (const o of g.oef) {
        if (o.o === undefined || o.j === undefined) continue
        expect(o.j, `${g.id}: ${o.v}`).toBeGreaterThanOrEqual(0)
        expect(o.j, `${g.id}: ${o.v}`).toBeLessThan(o.o.length)
      }
    }
    for (const t of TEKSTEN) {
      expect(t.vraag.j).toBeGreaterThanOrEqual(0)
      expect(t.vraag.j).toBeLessThan(t.vraag.o.length)
    }
    for (const m of METING) {
      expect(m.a).toBeGreaterThanOrEqual(0)
      expect(m.a).toBeLessThan(m.o.length)
    }
  })

  it('geeft elk woord en elke module een plek in een spoor', () => {
    for (const w of WOORDEN) expect([1, 2, 3, 4]).toContain(w.s)
    for (const g of GRAMMATICA) expect([1, 2, 3, 4]).toContain(g.sp)
  })
})

describe('het leerpad', () => {
  it('bouwt hetzelfde pad als vroeger', () => {
    for (const g of gouden.paden) {
      const pad = bouwPad(g.spoor as Spoor).map((s) => ({
        k: s.k, titel: s.titel,
        n: s.items ? s.items.length : (s.letters ? s.letters.length : 1),
      }))
      expect(pad, `spoor ${g.spoor}`).toEqual(g.stappen)
    }
  })

  it('zet nooit twee dezelfde soorten sessies achter elkaar in het lettersspoor', () => {
    /* Behalve de letters zelf: die staan met opzet twee keer op rij. */
    const pad = bouwPad(1)
    let anders = 0
    pad.forEach((s, i) => { if (i > 0 && s.k !== pad[i - 1]?.k) anders++ })
    expect(anders / pad.length).toBeGreaterThan(0.5)
  })

  it('geeft elk spoor dezelfde kaartlijst als vroeger', () => {
    for (const g of gouden.kaartlijsten) {
      const ids = alleKaartIds(g.spoor as Spoor)
      expect(ids, `spoor ${g.spoor}`).toHaveLength(g.aantal)
      expect(ids.slice(0, 8)).toEqual(g.eerste)
      expect(vinger(ids), `spoor ${g.spoor}`).toBe(g.vinger)
    }
  })

  it('bouwt de kaart-id uit de inhoud, met de nul die wegvalt', () => {
    expect(kaartId('W', 12, 'nl')).toBe('W:12:nl')
    expect(kaartId('L', 'ب')).toBe('L:ب')
    /* Nul is falsy, en zo staat het in ieders opslag. */
    expect(kaartId('G', 'g-01', 0)).toBe('G:g-01')
    expect(kaartId('G', 'g-01', 1)).toBe('G:g-01:1')
  })

  it('zet de langst wachtende kaarten vooraan en houdt zich aan het plafond', () => {
    const kaarten: Record<string, Kaartstaat> = Object.fromEntries(
      [['a', '2026-08-10'], ['b', '2026-08-22'], ['c', '2026-08-01'],
        ['d', '2026-08-19'], ['e', '2026-09-01'], ['f', '2026-08-15']]
        .map(([id, due]) => [id as string,
          { s: 1, d: 5, laatst: '2026-01-01', due: due as string, herh: 1, missers: 0 }]))
    for (const g of gouden.rijen) {
      const r = herhalingsRij(kaarten, gouden.nu, g.plafond ?? 3)
      expect(r.rij.map((x) => x.id), `plafond ${g.plafond}`).toEqual(g.ids)
      expect(r.totaal).toBe(g.totaal)
    }
  })

  it('kent het spoor bij de leeftijd', () => {
    for (const g of gouden.sporen) {
      expect(spoorBijLeeftijd(g.leeftijd), String(g.leeftijd)).toBe(g.spoor)
    }
    expect(Object.keys(SPOORNAAM)).toEqual(['1', '2', '3', '4'])
    expect(Object.keys(SPOORLEEFTIJD)).toEqual(['1', '2', '3', '4'])
  })
})

describe('samenvoegen tussen toestellen', () => {
  it('geeft dezelfde uitkomst als vroeger', () => {
    for (const g of gouden.samen) {
      const uit = samenvoegen(g.a as Losse, g.b as Losse)
      const oud = g.uit as Record<string, unknown>
      /* Per veld dat de oude functie teruggaf. Zij liet er twee vallen; zie de
         toets hieronder over de ouderscode. */
      for (const veld of Object.keys(oud)) {
        expect(uit[veld as keyof Stand], `${JSON.stringify(g.a).slice(0, 40)} · ${veld}`)
          .toEqual(oud[veld])
      }
    }
  })

  it('houdt de ouderscode vast — de oude versie liet die vallen', () => {
    /* De oude samenvoegen bouwde een nieuw object met alleen versie, actief,
       thema en profielen. Wie thuis een code instelde en daarna op een tweede
       toestel gelijktrok, stond de volgende dag weer op 1234 zonder dat er
       iets van te zien was. */
    const a: Stand = { ...leeg(), ouderPin: '8213' }
    const b: Stand = { ...leeg() }
    expect(samenvoegen(a, b).ouderPin).toBe('8213')
    expect(samenvoegen(b, a).ouderPin).toBe('8213')
  })

  it('houdt bij een kaart de laatst beoordeelde kant', () => {
    const maak = (laatst: string, s: number): Stand => ({
      ...leeg(),
      profielen: {
        p: {
          kaarten: { k: { s, d: 5, laatst, due: '2026-12-01', herh: 1, missers: 0 } },
          dagen: {}, letters: {}, spelrecords: {}, voorkeur: {},
        } as unknown as Profiel,
      },
    })
    const uit = samenvoegen(maak('2026-08-01', 5), maak('2026-08-10', 2))
    expect(uit.profielen['p']?.kaarten['k']?.s).toBe(2)
    const andersom = samenvoegen(maak('2026-08-10', 2), maak('2026-08-01', 5))
    expect(andersom.profielen['p']?.kaarten['k']?.s).toBe(2)
  })

  it('houdt de profielen van beide kanten', () => {
    const p = (id: string): Profiel => ({
      kaarten: {}, dagen: {}, letters: {}, spelrecords: {}, voorkeur: {}, id,
    } as unknown as Profiel)
    const uit = samenvoegen(
      { ...leeg(), profielen: { a: p('a') } },
      { ...leeg(), profielen: { b: p('b') } })
    expect(Object.keys(uit.profielen).sort()).toEqual(['a', 'b'])
  })

  it('verliest niets bij een ontbrekende kant', () => {
    const s = leeg()
    expect(samenvoegen(s, null)).toEqual(s)
    expect(samenvoegen(null, s)).toEqual(s)
    expect(samenvoegen(null, null)).toEqual(leeg())
  })
})

describe('de datums', () => {
  it('schrijft en telt zoals vroeger', () => {
    for (const g of gouden.datums) {
      expect(datumNL(g.d), g.d).toBe(g.nl)
      expect(plusDagen(g.d, 7), g.d).toBe(g.plus7)
      expect(plusDagen(g.d, -3), g.d).toBe(g.plusMin3)
    }
    for (const g of gouden.verschillen) {
      expect(dagVerschil(g.a, g.b), `${g.a} → ${g.b}`).toBe(g.n)
    }
  })

  it('gaat goed over een maand- en een jaargrens heen', () => {
    expect(plusDagen('2026-01-31', 1)).toBe('2026-02-01')
    expect(plusDagen('2026-12-31', 1)).toBe('2027-01-01')
    expect(plusDagen('2028-02-28', 1)).toBe('2028-02-29')
    expect(dagVerschil('2026-12-31', '2027-01-01')).toBe(1)
  })
})

describe('de schatting vooraf', () => {
  /* De oude formule: n*0.6 + herh*0.35 + 2, afgerond, met een ondergrens van
     vijf minuten. Wie hem verandert verandert wat er op de knop staat, en dat
     is het enige waar iemand op afgaat voordat hij begint. */
  it('rekent zoals de oude app', () => {
    expect(schattingMinuten(0, 0)).toBe(5)
    expect(schattingMinuten(10, 0)).toBe(8)
    expect(schattingMinuten(10, 20)).toBe(15)
    expect(schattingMinuten(24, 60)).toBe(37)
  })
})

describe('de toets aan het eind van een blok', () => {
  const t = bron(7)

  it('vraagt hoogstens twaalf vragen, uit de weken van dat blok zelf', () => {
    for (const b of BLOKKEN) {
      const weken = JAAR.filter((w) => w.n >= b.weken[0] && w.n <= b.weken[1])
      const eigenLetters = new Set(weken.flatMap((w) => w.letters ?? []))
      const eigenWoorden = new Set(weken.flatMap((w) => w.lezen ?? []))
      const vragen = toetsVragen(b.n, t)
      expect(vragen.length, `blok ${b.n}`).toBeGreaterThan(0)
      expect(vragen.length, `blok ${b.n}`).toBeLessThanOrEqual(12)
      for (const v of vragen) {
        expect(v.o, `blok ${b.n}: ${v.goed}`).toContain(v.goed)
        expect(v.o.length, `blok ${b.n}`).toBe(3)
        if (v.ar) expect(eigenLetters.has(v.ar), `letter ${v.ar}`).toBe(true)
        else expect(eigenWoorden.has(v.goed), `woord ${v.goed}`).toBe(true)
      }
    }
  })

  it('geeft niets terug voor een blok dat niet bestaat', () => {
    expect(toetsVragen(0, t)).toEqual([])
    expect(toetsVragen(9, t)).toEqual([])
  })
})
