/**
 * DE UITLEZERS
 *
 * Elke app bewaart zijn voortgang in zijn eigen vorm; er is geen gemeenschappelijk
 * formaat en dat ga ik ook niet forceren. Hier staat per app een kleine uitlezer
 * die er het antwoord uit haalt op de twee vragen die je echt stelt: heeft
 * iemand iets gedaan, en hoeveel staat er open?
 *
 * WAAROM DIT BESTAND HET MEEST BAAT HEEFT BIJ TYPEN
 *
 * De invoer is `unknown` en dat is geen formaliteit: het is JSON uit acht
 * losse apps die elk hun eigen vorm mogen veranderen zonder het hier te
 * melden. De oude versie deed `d.profielen.map(...)` met een `try/catch`
 * eromheen, en als een app zijn vorm wijzigde viel de hele tabel stil terug op
 * een lege lijst — zonder dat iemand kon zien waarom.
 *
 * De helpers hieronder lezen elk veld met een expliciete vraag: is dit een
 * lijst, is dit een getal, bestaat deze sleutel. Wat er niet staat wordt niet
 * geraden. Een gewijzigde app levert dan een streepje op de plek waar het
 * getal hoorde, en niet een lege tabel.
 */

/* ------------------------------------------------------- kleine narrowers -- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const veld = (v: unknown, sleutel: string): unknown => (isObject(v) ? v[sleutel] : undefined)

const lijst = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** Een object als lijst van waarden — sommige apps bewaren profielen zo. */
const waarden = (v: unknown): unknown[] => (isObject(v) ? Object.values(v) : [])

const sleutels = (v: unknown): string[] => (isObject(v) ? Object.keys(v) : [])

const tekst = (v: unknown): string | null =>
  typeof v === 'string' && v !== '' ? v : null

const getal = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

/** Het aantal sleutels in een object; nul als het er geen is. */
const aantal = (v: unknown): number => sleutels(v).length

/* -------------------------------------------------------------- de vorm --- */

/** Eén regel in de tabel: een label en wat eronder staat. */
export type Cel = readonly [label: string, waarde: string | number]

export interface Regel {
  wie: string
  laatst: string | null
  /** Wat er nog uitbetaald moet worden, als de app daar iets over zegt. */
  euro: number | null
  regels: Cel[]
}

type Uitlezer = (d: unknown) => Regel[]

const streep = (n: number | null): string | number => n ?? '—'

const euroTekst = (n: number): string =>
  '€ ' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')

/* -------------------------------------------------------- per app ---------- */

export const UITLEZERS: Readonly<Record<string, Uitlezer>> = {
  /* Islam leren: profielen in een lijst, voortgang per profiel-id. */
  bidaya(d) {
    return lijst(veld(d, 'profielen')).map((p): Regel => {
      const id = tekst(veld(p, 'id')) ?? ''
      const g = veld(veld(d, 'data'), id)
      return {
        wie: tekst(veld(p, 'naam')) ?? id,
        laatst: tekst(veld(g, 'laatsteDag')),
        euro: getal(veld(g, 'saldo')),
        regels: [
          ['Punten', getal(veld(g, 'punten')) ?? 0],
          ['Lessen af', aantal(veld(g, 'lessen'))],
          ['Uit het hoofd',
            waarden(veld(g, 'hifz')).filter((h) => veld(h, 'gehaald') === true).length],
          ['Insignes', lijst(veld(g, 'insignes')).length],
        ],
      }
    })
  },

  /* Arabisch: profielen als object, met de sleutel als id. */
  lisan(d) {
    return waarden(veld(d, 'profielen')).map((p): Regel => ({
      wie: tekst(veld(p, 'naam')) ?? tekst(veld(p, 'id')) ?? '—',
      laatst: tekst(veld(p, 'laatst')) ?? tekst(veld(p, 'laatsteDag')),
      euro: null,
      regels: [
        ['Spoor', tekst(veld(p, 'spoor')) ?? streep(getal(veld(p, 'jaar')))],
        ['Blok', streep(getal(veld(p, 'blok')))],
        ['Kaarten', aantal(veld(p, 'kaarten')) || aantal(veld(p, 'cards'))],
      ],
    }))
  },

  /* Computers & Code: één gebruiker, alles op het hoogste niveau. */
  bunyan(d) {
    return [{
      wie: tekst(veld(veld(d, 'instel'), 'naam')) ?? 'Amine',
      laatst: tekst(veld(d, 'laatsteDag')),
      euro: getal(veld(d, 'saldo')),
      regels: [
        ['Punten', getal(veld(d, 'punten')) ?? 0],
        ['Lessen af', aantal(veld(d, 'klaar')) || aantal(veld(d, 'lessen'))],
        ['Uitbetaald', euroTekst(getal(veld(d, 'uitbetaald')) ?? 0)],
        ['Insignes', lijst(veld(d, 'insignes')).length],
      ],
    }]
  },

  /* Geloofsstudie: één gebruiker, weken afgevinkt. */
  sanad(d) {
    const klaar = veld(d, 'klaar')
    const datums = waarden(klaar).map(tekst).filter((x): x is string => x != null).sort()
    return [{
      wie: 'Abdelkader',
      laatst: datums.length ? (datums[datums.length - 1] ?? null) : tekst(veld(d, 'start')),
      euro: null,
      regels: [
        ['Week', streep(getal(veld(d, 'dag')))],
        ['Weken af', `${aantal(klaar)} van 28`],
        ['Kaarten', aantal(veld(d, 'cards'))],
        ['Dagreeks', getal(veld(d, 'dagreeks')) ?? 0],
      ],
    }]
  },

  /* Koran uit je hoofd. */
  rasikh(d) {
    const kaarten = isObject(veld(d, 'kaarten')) ? veld(d, 'kaarten') : veld(d, 'aya')
    const nu = Date.now()
    const teHerhalen = waarden(kaarten).filter((x) => {
      const due = tekst(veld(x, 'due'))
      if (!due) return false
      const t = new Date(due).getTime()
      return Number.isFinite(t) && t <= nu
    }).length
    return [{
      wie: 'Abdelkader',
      laatst: tekst(veld(d, 'laatsteDag')) ?? tekst(veld(d, 'laatst')),
      euro: null,
      regels: [
        ['Aya vast', aantal(kaarten)],
        ['Te herhalen', teHerhalen],
        ['Verwarpunten', aantal(veld(d, 'verwarring'))],
      ],
    }]
  },

  /* Energiebalans. Hier staat bewust géén caloriedoel in het overzicht — dat
     getal hoort thuis in de app, naast zijn interval, en niet los in een tabel
     waar het als een meting oogt. Wat hier telt is of de reeks doorloopt:
     zonder dagelijkse weging rekent het model niets uit. */
  kalibratie(d) {
    const dagen = veld(d, 'dagen')
    const wegingen = sleutels(dagen)
      .filter((k) => getal(veld(veld(dagen, k), 'gewicht')) != null).sort()
    const gelogd = sleutels(dagen).filter((k) => lijst(veld(veld(dagen, k), 'entries')).length)
    const laatsteSleutel = wegingen[wegingen.length - 1]
    const laatsteW = laatsteSleutel != null
      ? getal(veld(veld(dagen, laatsteSleutel), 'gewicht')) : null
    const doel = getal(veld(veld(d, 'profiel'), 'doelGewicht'))
    const alles = [...wegingen, ...gelogd].sort()
    return [{
      wie: 'Abdelkader',
      laatst: alles.length ? (alles[alles.length - 1] ?? null) : null,
      euro: null,
      regels: [
        ['Gewicht', laatsteW == null ? '—' : String(laatsteW).replace('.', ',') + ' kg'],
        ['Te gaan', laatsteW == null || doel == null
          ? '—' : (laatsteW - doel).toFixed(1).replace('.', ',') + ' kg'],
        ['Wegingen', wegingen.length],
        ['Dagen gelogd', gelogd.length],
      ],
    }]
  },

  /* Spelletjes: records. */
  raha(d) {
    return [{
      wie: 'Iedereen',
      laatst: tekst(veld(d, 'laatste')),
      euro: null,
      regels: [
        ['Records', aantal(veld(d, 'records'))],
        ['Gespeeld', waarden(veld(d, 'gespeeld')).reduce<number>((n, x) => n + (getal(x) ?? 0), 0)],
      ],
    }]
  },
}

export { euroTekst }
