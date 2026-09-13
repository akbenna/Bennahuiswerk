/**
 * DE TWEEDE VOORRAAD SJABLONEN, NAGEREKEND
 *
 * Een sjabloon dat een verkeerd antwoord geeft is erger dan een ontbrekende
 * opgave: het kind rekent goed, krijgt "fout", en leert dat het het niet kan.
 * Vandaar dat elk rekenkundig sjabloon hier honderden keren draait en het
 * antwoord wordt teruggerekend uit de getallen die in de vráág staan — dus uit
 * wat het kind leest, en niet uit dezelfde variabele die de som ook al maakte.
 * Wie hier een som verandert, moet deze narekening meeveranderen; dat is precies
 * de bedoeling.
 *
 * Voor de taal- en kennissjablonen kan dat niet: dat "meeuw" vóór "meisje" staat
 * is te herleiden, dat "das Haus" das is niet. Die krijgen daarom de controles
 * die er wél zijn — een antwoord dat tussen de opties staat, een afleider die
 * echt verschilt, geen dubbele regels in de lijst — en zijn verder met de hand
 * nagelopen. Het alfabetiseren en het samenstellen staan wél bij de narekening,
 * want die zijn uit de vraag af te leiden.
 */
import { describe, expect, it } from 'vitest'
import { LIJSTEN, extraSjablonen } from './gegevens/sjablonen-extra'
import { sjablonen } from './gegevens/sjablonen'
import { SEED } from './gegevens/seed'
import { NIEUW2627 } from './gegevens/schooljaar2627'
import { PROFIELEN } from './gegevens/profielen'
import type { Opgaveinhoud } from './gegevens/soorten'
import { ECHT, toevalUit } from './toeval'
import { antwoordKlopt } from './nakijken'

const EXTRA = extraSjablonen(ECHT)

/** Alle getallen uit een vraag, in volgorde. Het minteken wordt eerst aan zijn
 *  getal geplakt: in "x² − 7x + 12" hoort de 7 negatief te zijn. */
const getallen = (q: string): number[] =>
  (q.replace(/[−–]\s*/g, '-').match(/-?\d+(?:,\d+)?/g) ?? [])
    .map((t) => Number(t.replace(',', '.')))

const rond = (x: number, d: number): number => Math.round(x * 10 ** d) / 10 ** d
const ggd = (a: number, b: number): number => (b === 0 ? a : ggd(b, a % b))
const combinaties = (n: number, k: number): number => {
  let uit = 1
  for (let i = 1; i <= k; i++) uit = uit * (n - k + i) / i
  return Math.round(uit)
}
const MACHT: Record<string, number> = { '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6 }

/** Wat een sjabloon hoort te antwoorden, teruggerekend uit de vraag. Geeft
 *  `null` als deze soort niet na te rekenen is; die krijgt alleen de algemene
 *  controles. */
type Narekening = (n: number[], inh: Opgaveinhoud) => string | number | null

const NAREKENING: Record<string, Narekening> = {
  /* ----- Selma ----- */
  xs_deelrest: (n) => (n[0] as number) % (n[1] as number),
  xs_deelheel: (n) => Math.floor((n[1] as number) / (n[0] as number)),
  xs_keergroter: (n) => (n[0] as number) * (n[1] as number),
  xs_evenoneven: (n) => ((n[0] as number) % 2 === 0 ? 'even' : 'oneven'),
  xs_rij: (n) => (n[3] as number) + ((n[1] as number) - (n[0] as number)),
  xs_plaatswaarde: (_n, inh) => {
    const m = /in de (\w+) van (\d+)\?/.exec(inh.q)
    const plek: Record<string, number> = {
      tienduizendtallen: 10000, duizendtallen: 1000, honderdtallen: 100, tientallen: 10,
    }
    return Math.floor(Number(m?.[2]) / (plek[m?.[1] ?? ''] as number)) % 10
  },
  xs_tabel: (n) => n.reduce((s, x) => s + x, 0),
  xs_hokjes: (n) => (n[0] as number) * (n[1] as number),
  xs_samenstelling: (_n, inh) => {
    const m = /: (\S+) \+ (\S+)$/.exec(inh.q)
    return (m?.[1] ?? '') + (m?.[2] ?? '')
  },
  /* ----- Amine ----- */
  xa_coordinaten: (n) => `(${n[0]}, ${n[1]})`,
  xa_geld: (n) => rond(20 - (n[0] as number) * (n[1] as number), 2),
  xa_tijd: (n) => (n[0] as number) * 60 + (n[1] as number),
  xa_verbanden: (n) => rond((n[0] as number) + (n[1] as number) * (n[2] as number), 2),
  xa_formulex: (n) => (n[0] as number) * (n[2] as number) + (n[1] as number),
  xa_hoeken: (n) => 180 - (n[0] as number) - (n[1] as number),
  xa_gemiddelde: (n) => rond(n.reduce((s, x) => s + x, 0) / n.length, 1),
  xa_maten2: (_n, inh) => {
    const m = /Hoeveel (\S+) is (\d+) (\S+)\?/.exec(inh.q)
    const stap: Record<string, number> = { 'dm²>cm²': 100, 'm²>dm²': 100, 'm²>cm²': 10000 }
    return Number(m?.[2]) * (stap[`${m?.[3]}>${m?.[1]}`] as number)
  },
  xa_schaal: (n) => (n[2] as number) * (n[1] as number) / 100,
  xa_inhoud: (n) => (n[0] as number) ** 3,
  xa_meetkunde: (n) => (n[0] as number) / 4,
  xa_negatief: (n) => (n[0] as number) - (n[1] as number),
  xa_driehoek: (n) => (n[0] as number) * (n[1] as number) / 2,
  xa_omtrek: (n) => 2 * ((n[0] as number) + (n[1] as number)),
  xa_klok: (n) => {
    const t = (n[0] as number) * 60 + (n[1] as number) + (n[2] as number)
    return `${Math.floor(t / 60) % 24}:${String(t % 60).padStart(2, '0')}`
  },
  xa_breukdeel: (n) => (n[2] as number) * (n[0] as number) / (n[1] as number),
  xa_breukvereenvoudig: (n) => {
    const d = ggd(n[0] as number, n[1] as number)
    return `${(n[0] as number) / d}/${(n[1] as number) / d}`
  },
  xa_grafiek: (n) => Math.max(...n) - Math.min(...n),
  xa_redactie: (n) => (n[1] as number) + (n[2] as number) / (n[0] as number),
  xa_afronden100: (n) => Math.round((n[0] as number) / 100) * 100,
  xa_alfabet: (_n, inh) => {
    const woorden = (inh.q.split('? ')[1] ?? '').split(', ')
    return [...woorden].sort()[0] as string
  },
  xa_eeuw: (n) => Math.ceil((n[0] as number) / 100),
  /* ----- Wassima ----- */
  xw_gemiddelde: (n) => rond(n.reduce((s, x) => s + x, 0) / n.length, 2),
  xw_mediaan: (n) => [...n].sort((a, b) => a - b)[Math.floor(n.length / 2)] as number,
  xw_hoeken: (n) => 180 - (n[0] as number),
  xw_schaal: (n) => (n[2] as number) * (n[1] as number) / 100,
  xw_snelheid: (n) => (n[0] as number) / (n[1] as number),
  xw_druk: (n) => Math.round((n[0] as number) / (n[1] as number)),
  xw_serie: (n) => (n[0] as number) + (n[1] as number),
  xw_ohm: (n) => rond((n[0] as number) * (n[1] as number), 2),
  xw_energie: (n) => (n[0] as number) * (n[1] as number),
  xw_warmte: (n) => (n[2] as number) * (n[0] as number) * (n[1] as number),
  xw_veer: (n) => rond((n[0] as number) * (n[1] as number), 2),
  xw_geluid: (n) => (n[0] as number) * (n[1] as number),
  xw_btw: (n) => rond((n[0] as number) * (1 + (n[1] as number) / 100), 2),
  xw_rente: (n) => rond((n[0] as number) * (n[1] as number) / 100, 2),
  xw_eeuw: (n) => Math.ceil((n[0] as number) / 100),
  /* ----- Amaani ----- */
  xm_groeifactor: (n, inh) =>
    rond(inh.q.includes('daalt') ? 1 - (n[0] as number) / 100 : 1 + (n[0] as number) / 100, 4),
  xm_machten: (_n, inh) => {
    const m = /: (\d+)(.)$/.exec(inh.q)
    return Number(m?.[1]) ** (MACHT[m?.[2] ?? ''] as number)
  },
  xm_vergelijking: (n) => {
    /* x² + bx + c = 0 met gehele wortels: de grootste van de twee. */
    const b = n[0] as number, c = n[1] as number
    const d = Math.sqrt(b * b - 4 * c)
    return (-b + d) / 2
  },
  xm_rij: (n) => (n[0] as number) + ((n[2] as number) - 1) * (n[1] as number),
  xm_zwaarde: (n) => rond(((n[2] as number) - (n[0] as number)) / (n[1] as number), 3),
  xm_verwachting: (n) =>
    rond((n[1] as number) * (n[0] as number) - (n[3] as number) * (n[2] as number), 2),
  xm_log: (n) => Math.round(Math.log(n[1] as number) / Math.log(n[0] as number)),
  xm_afgeleide: (n) => 3 * (n[0] as number) * (n[3] as number) ** 2 + 2 * (n[1] as number) * (n[3] as number),
  xm_expgroei: (n) => rond((n[0] as number) * (n[1] as number) ** (n[2] as number), 2),
  xm_combinaties: (n) => combinaties(n[0] as number, n[1] as number),
  xm_binomiaal: (n) => rond(combinaties(n[0] as number, n[1] as number) / 2 ** (n[0] as number), 3),
  xm_pyth: (n) => Math.sqrt((n[0] as number) ** 2 + (n[1] as number) ** 2),
  xm_kracht: (n) => rond((n[0] as number) * (n[1] as number), 2),
  xm_zwaarte: (n) => rond((n[0] as number) * (n[1] as number), 2),
  xm_ezwaarte: (n) => rond((n[0] as number) * 9.81 * (n[1] as number), 1),
  xm_vermogen: (n) => (n[0] as number) / (n[1] as number),
  xm_rendement: (n) => (n[1] as number) / (n[0] as number) * 100,
  xm_halvering: (n) => (n[0] as number) / 2 ** (n[1] as number),
  xm_gaswet: (n) => rond((n[0] as number) * (n[1] as number) / (n[2] as number), 3),
  xm_warmte: (n) => (n[2] as number) * (n[0] as number) * (n[1] as number),
  xm_snelheid: (n) => (n[0] as number) / (n[1] as number),
  xm_beweging: (n) => rond(0.5 * (n[0] as number) * (n[1] as number) ** 2, 2),
  xm_concentratie: (n) => rond((n[0] as number) / (n[1] as number), 3),
  xm_inflatie: (n) =>
    rond(((1 + (n[0] as number) / 100) / (1 + (n[1] as number) / 100) - 1) * 100, 1),
  xm_elasticiteit: (n) => rond(-(n[1] as number) / (n[0] as number), 2),
}

/** Hoe vaak elk sjabloon gedraaid wordt. Genoeg om elke tak van een `pick` een
 *  paar keer te raken. */
const BEURTEN = 300

describe('de tweede voorraad sjablonen', () => {
  it('botst met geen enkel bestaand id', () => {
    const bestaand = new Set([...SEED, ...NIEUW2627, ...sjablonen(ECHT)].map((e) => e.id))
    for (const t of EXTRA) expect(bestaand.has(t.id), t.id).toBe(false)
    expect(new Set(EXTRA.map((t) => t.id)).size).toBe(EXTRA.length)
  })

  it('hoort bij een bestaand kind, een vak van dat kind en bij dit schooljaar', () => {
    for (const t of EXTRA) {
      const prof = PROFIELEN[t.p]
      expect(prof, t.id).toBeTruthy()
      expect(prof?.vakken, `${t.id} · ${t.v}`).toContain(t.v)
      expect([1, 2, 3], t.id).toContain(t.lvl)
      /* Geen vooruitblik: dit is stof voor de klas waar het kind nu in zit. */
      expect(t.jaar, t.id).toBeUndefined()
    }
  })

  it('landt op een onderwerp dat al bestaat', () => {
    /* Een tikfout in een onderwerpnaam maakt geen fout maar iets ergers: een
       tweede tegel naast de bestaande, met één opgave erin. Precies de dunne
       voorraad die dit bestand moest oplossen. */
    const bestaand = new Set(
      [...SEED, ...NIEUW2627, ...sjablonen(ECHT)].map((e) => `${e.p}|${e.v}|${e.t}`))
    for (const t of EXTRA) {
      expect(bestaand.has(`${t.p}|${t.v}|${t.t}`), `${t.id}: ${t.v} · ${t.t}`).toBe(true)
    }
  })

  it('levert bij elke beurt een hele opgave', () => {
    const bron = toevalUit(vasteBron())
    const vast = extraSjablonen(bron)
    for (const t of vast) {
      for (let i = 0; i < BEURTEN; i++) {
        const o = t.gen()
        expect(o.q.trim().length, t.id).toBeGreaterThan(5)
        expect(String(o.a).trim().length, t.id).toBeGreaterThan(0)
        expect(o.h?.length, t.id).toBeGreaterThan(0)
        expect((o.s ?? '').trim().length, t.id).toBeGreaterThan(5)
        /* Geen enkele opgave mag "undefined" of "NaN" op het scherm zetten. */
        expect(o.q + String(o.a) + (o.s ?? ''), t.id).not.toMatch(/undefined|NaN|Infinity/)
      }
    }
  })

  it('zet bij meerkeuze het goede antwoord tussen de opties, zonder dubbele', () => {
    const vast = extraSjablonen(toevalUit(vasteBron()))
    for (const t of vast) {
      for (let i = 0; i < BEURTEN; i++) {
        const o = t.gen()
        if (!o.opties?.length) continue
        expect(o.opties, t.id).toContain(o.a)
        expect(new Set(o.opties).size, t.id).toBe(o.opties.length)
        expect(o.opties.length, t.id).toBeGreaterThan(1)
      }
    }
  })

  it('keurt zijn eigen antwoord goed', () => {
    /* Het antwoord moet ook door `antwoordKlopt` komen — een komma, een euro of
       een spatie te veel maakt een goed antwoord anders fout. */
    const vast = extraSjablonen(toevalUit(vasteBron()))
    for (const t of vast) {
      for (let i = 0; i < 40; i++) {
        const o = t.gen()
        expect(antwoordKlopt(o, String(o.a)), `${t.id}: ${o.q} → ${o.a}`).toBe(true)
      }
    }
  })

  it('rekent elk rekensjabloon terug uit de vraag zelf', () => {
    const vast = extraSjablonen(toevalUit(vasteBron()))
    let nagerekend = 0
    for (const t of vast) {
      const check = NAREKENING[t.id]
      if (!check) continue
      nagerekend++
      for (let i = 0; i < BEURTEN; i++) {
        const o = t.gen()
        const verwacht = check(getallen(o.q), o)
        if (verwacht === null) continue
        const naam = `${t.id}: ${o.q}`
        if (typeof verwacht === 'number') {
          expect(Number(String(o.a).replace(',', '.')), naam).toBeCloseTo(verwacht, 6)
        } else {
          expect(String(o.a), naam).toBe(verwacht)
        }
      }
    }
    /* Geen stille uitval: raakt een sjabloon zijn narekening kwijt, dan hoort
       dit getal te zakken en valt het op. */
    expect(nagerekend).toBe(Object.keys(NAREKENING).length)
  })

  it('laat geen rekensjabloon zonder narekening staan', () => {
    /* De vakken waarin een antwoord uit te rekenen valt. Komt er hier een
       sjabloon bij zonder regel in NAREKENING, dan valt dat hier om. */
    const rekenvakken = ['rekenen', 'wiskunde', 'wiskundeA', 'natuurkunde', 'scheikunde']
    const zonder = EXTRA.filter((t) => rekenvakken.includes(t.v) && !NAREKENING[t.id])
      .map((t) => t.id)
    expect(zonder, 'deze rekensjablonen worden niet nagerekend').toEqual(['xm_molmassa'])
  })
})

describe('de woordlijsten', () => {
  const L = LIJSTEN

  it('heeft in elk ei/ij-woord precies één van de twee', () => {
    for (const w of L.EIIJ) {
      const ei = w.includes('ei'), ij = w.includes('ij')
      expect(ei !== ij, w).toBe(true)
    }
    expect(new Set(L.EIIJ).size).toBe(L.EIIJ.length)
  })

  it('heeft in elk au/ou-woord precies één van de twee', () => {
    for (const w of L.AUOU) {
      const au = w.includes('au'), ou = w.includes('ou')
      expect(au !== ou, w).toBe(true)
    }
    expect(new Set(L.AUOU).size).toBe(L.AUOU.length)
  })

  it('laat elk d/t-woord op een d of een t eindigen, met een meervoud dat erbij hoort', () => {
    for (const [enk, mv] of L.DOFT) {
      expect(['d', 't'], enk).toContain(enk.slice(-1))
      /* Dát het meervoud de letter hoorbaar maakt, is de hele regel. Het is
         niet simpelweg het enkelvoud plus -en: bij "brood" valt er een o weg.
         Dus: haal de uitgang eraf en kijk of de d of de t er nog staat. */
      expect(mv.replace(/e[ns]?$/, '').slice(-1), `${enk} → ${mv}`).toBe(enk.slice(-1))
      expect(mv.length, enk).toBeGreaterThan(enk.length)
    }
  })

  it('geeft elk woordpaar een vorm die echt verschilt', () => {
    for (const [woord, vorm] of [...L.KLEIN, ...L.MEERVOUD, ...L.SAMEN]) {
      expect(vorm, woord).not.toBe(woord)
      expect(vorm.length, woord).toBeGreaterThan(0)
    }
    expect(new Set(L.KLEIN.map((r) => r[0])).size).toBe(L.KLEIN.length)
    expect(new Set(L.MEERVOUD.map((r) => r[0])).size).toBe(L.MEERVOUD.length)
  })

  it('geeft elke ng/nk-zin een goed en een fout woord die niet gelijk zijn', () => {
    for (const [zin, goed, fout] of L.NGNK) {
      expect(zin, zin).toContain('...')
      expect(goed, zin).not.toBe(fout)
    }
  })

  it('schrijft elk cht-woord met cht', () => {
    for (const [, woord] of L.CHT) expect(woord, woord).toContain('cht')
  })

  it('telt tussen de twee en de vijf klankgroepen', () => {
    for (const [woord, n] of L.HAK) {
      expect(n, woord).toBeGreaterThanOrEqual(2)
      expect(n, woord).toBeLessThanOrEqual(5)
    }
    expect(new Set(L.HAK.map((r) => r[0])).size).toBe(L.HAK.length)
  })

  it('geeft elk synoniem en antoniem twee afleiders die van elkaar verschillen', () => {
    for (const [woord, goed, a, b] of [...L.SYNONIEM, ...L.ANTONIEM]) {
      expect(new Set([goed, a, b]).size, woord).toBe(3)
      expect(goed, woord).not.toBe(woord)
    }
  })

  it('gebruikt bij woordsoorten alleen soorten die in de keuzelijst staan', () => {
    for (const [, woord, soort] of L.WOORDSOORT) {
      expect(L.WOORDSOORTEN as readonly string[], woord).toContain(soort)
    }
    expect(L.WOORDSOORTEN.length).toBeGreaterThanOrEqual(3)
  })

  it('zet in elke ontleedzin het onderwerp, een ander zinsdeel en het werkwoord', () => {
    for (const [zin, onderwerp, ander, ww] of L.ONDERWERP) {
      expect(new Set([onderwerp, ander, ww]).size, zin).toBe(3)
      for (const deel of [onderwerp, ander, ww]) {
        expect(zin.toLowerCase(), zin).toContain(deel.toLowerCase())
      }
    }
  })

  it('houdt de lidwoordlijsten bij hun eigen lidwoorden', () => {
    for (const [woord, lid] of L.DUITS_LIDWOORD) expect(['der', 'die', 'das'], woord).toContain(lid)
    for (const [woord, lid] of L.FRANS_LIDWOORD) expect(['le', 'la'], woord).toContain(lid)
    expect(new Set(L.DUITS_LIDWOORD.map((r) => r[0])).size).toBe(L.DUITS_LIDWOORD.length)
    expect(new Set(L.FRANS_LIDWOORD.map((r) => r[0])).size).toBe(L.FRANS_LIDWOORD.length)
  })

  it('geeft elke molmassa als een positief getal', () => {
    for (const [formule, , M] of L.MOLMASSA) {
      expect(M, formule).toBeGreaterThan(0)
      expect(M, formule).toBeLessThan(500)
    }
    expect(new Set(L.MOLMASSA.map((r) => r[0])).size).toBe(L.MOLMASSA.length)
  })

  it('houdt de alfabetlijst uniek en in kleine letters', () => {
    expect(new Set(L.ALFABET).size).toBe(L.ALFABET.length)
    for (const w of L.ALFABET) expect(w, w).toBe(w.toLowerCase())
  })

  it('geeft elk Engels telwoord één schrijfwijze', () => {
    for (const [n, w] of L.ENGELS_GETAL) {
      expect(w.trim(), String(n)).toBe(w)
      expect(w.length, String(n)).toBeGreaterThan(2)
    }
    expect(new Set(L.ENGELS_GETAL.map((r) => r[0])).size).toBe(L.ENGELS_GETAL.length)
  })
})

/** Een vaste toevalsbron, zodat een omgevallen proef met dezelfde getallen
 *  terugkomt. Geen echte willekeur: die maakt een fout onherhaalbaar. */
function vasteBron(): () => number {
  let zaad = 20260913
  return () => {
    zaad = (zaad * 1103515245 + 12345) % 2147483648
    return zaad / 2147483648
  }
}
