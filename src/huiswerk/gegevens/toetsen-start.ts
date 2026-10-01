/**
 * DE EERSTE TOETSEN OP HET PLANBORD
 *
 * Een leeg planbord is een drempel: eerst vier toetsen intypen voordat je er
 * iets aan hebt. Daarom staat hier per kind wat er in de schoolapp stond, zodat
 * het bord met één tik gevuld is.
 *
 * Dit is een aanbod, geen opslag: het verschijnt alleen zolang er nog geen
 * toetsen op het bord staan en de datums niet voorbij zijn.
 *
 * De eerste versie was afgelezen van oranje stippen in een weekrooster, zonder
 * de toetsen zelf te zien. Twee van de vier bleken op 1 oktober niet te
 * kloppen: biologie stond op 2 oktober en is op 9 oktober, natuurkunde stond op
 * 8 oktober en is op 12 oktober. Wie het bord al gevuld had, kreeg daardoor de
 * avond van 1 oktober 140 minuten biologie voor een toets die er niet was.
 * `herstelStart` zet dat recht op een bord dat al bestaat, en raakt daarbij niets
 * aan wat het kind zelf heeft veranderd.
 */
import type { Planstand, Toets } from '../planbord'
import { zetToets } from '../planbord'

export type Starttoets = Omit<Toets, 'bijgewerkt' | 'weg'>

const BIO: Starttoets = {
  id: 'start-bio-2026-10-02', vak: 'biologie', datum: '2026-10-09',
  titel: 'Proefwerk Voortplanting van planten en dieren',
  onderdelen: ['Basisstof 1 en 2', 'Basisstof 3 en 4', 'Basisstof 5 en 6', 'Basisstof 7 en 8', 'Begrippen van het hele thema'],
  perOnderdeel: 40, oefenen: ['biologie|Voortplanting|nu'],
}
const NAT: Starttoets = {
  id: 'start-nat-2026-10-08', vak: 'natuurkunde', datum: '2026-10-12', titel: 'Proefwerk hoofdstuk 1',
  onderdelen: ['Formules van H1 op één blad, met eenheden', 'Voorbeeldopgaven nadoen, dan opgaven', 'Grafieken maken en aflezen', 'Oefentoets op tijd'],
  perOnderdeel: 45,
}
const FRA: Starttoets = {
  id: 'start-fatl-2026-10-09', vak: 'frans', datum: '2026-10-14', titel: 'PW Unité 1',
  onderdelen: ['Apprendre 1 tot en met 5', 'Apprendre 6 tot en met 10', 'Alles door elkaar overhoren'],
  perOnderdeel: 30,
}
const NED: Starttoets = {
  id: 'start-ned-2026-10-09', vak: 'nederlands', datum: '2026-10-09', titel: 'SO schrijven deel 2',
  onderdelen: ['Aantekeningen en de schrijfopdracht van deel 2 doorlezen', 'Formuleren en signaalwoorden oefenen', 'Een stuk schrijven op tijd'],
  perOnderdeel: 30, oefenen: ['nederlands|Formuleren|nu', 'nederlands|Tekstverbanden|nu'],
}

export const STARTTOETSEN: Record<string, Starttoets[]> = {
  amaani: [
    BIO,
    {
      id: 'start-wisa-2026-10-07', vak: 'wiskundeA', datum: '2026-10-07', titel: 'Toets wiskunde A',
      onderdelen: ['Theorie en voorbeelden, opschrijven wat je niet snapt', 'Opgaven maken', 'Oefentoets op tijd'],
      perOnderdeel: 45,
    },
    NAT, FRA, NED,
  ],
}

/** Zoals de eerste versie ze neerzette. Alleen een toets die nog precies zo
 *  op het bord staat wordt rechtgezet: heeft het kind de datum of de stof
 *  veranderd, dan weet zij het beter dan dit bestand. */
const VERSIE_1: Record<string, Pick<Toets, 'datum' | 'onderdelen'>> = {
  'start-bio-2026-10-02': { datum: '2026-10-02', onderdelen: ['Samenvatting en schema’s doorlezen', 'Begrippen overhoren'] },
  'start-nat-2026-10-08': {
    datum: '2026-10-08',
    onderdelen: ['Formules op één blad, met eenheden', 'Voorbeeldopgaven nadoen, dan opgaven', 'Oefentoets op tijd'],
  },
  'start-fatl-2026-10-09': {
    datum: '2026-10-09',
    onderdelen: ['Woordjes eerste helft', 'Woordjes tweede helft', 'Grammatica', 'Woordjes door elkaar'],
  },
}

/** Toetsen die er in de eerste versie niet bij zaten en die een al gevuld bord
 *  erbij krijgt, tenzij het kind ze er zelf af heeft gehaald. */
const ERBIJ: Record<string, Starttoets[]> = { amaani: [NED] }

const gelijk = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i])

/**
 * Een bord dat met de eerste versie gevuld is, rechtzetten. Geeft hetzelfde
 * object terug als er niets te doen is, zodat een scherm aan `!==` ziet dat er
 * bewaard moet worden. `bijgewerkt` gaat één omhoog in plaats van naar de klok:
 * zo wint de rechtgezette toets het samenvoegen van het andere toestel, en geeft
 * twee keer draaien hetzelfde.
 */
export function herstelStart(p: Planstand | undefined, pid: string): Planstand | undefined {
  if (!p || p.toetsen.length === 0) return p
  const nieuw = new Map((STARTTOETSEN[pid] ?? []).map((t) => [t.id, t]))
  let q = p
  for (const t of p.toetsen) {
    const oud = VERSIE_1[t.id]
    const goed = nieuw.get(t.id)
    if (!oud || !goed || t.weg) continue
    if (t.datum !== oud.datum || !gelijk(t.onderdelen, oud.onderdelen)) continue
    q = zetToets(q, { ...goed, bijgewerkt: t.bijgewerkt + 1 })
    /* De blokken die nog open staan hoorden bij de verkeerde datum. Laten staan
       zou ze als achterstand tellen (die wordt gemeten op de eerste datum), dus
       ze gaan weg en het bord zet ze opnieuw neer. Wat af is, vastgezet of met
       een eigen schatting blijft. */
    q = {
      ...q,
      blokken: q.blokken.flatMap((b) => {
        if (b.toets !== t.id || b.gedaan || b.vast) return [b]
        if (b.eigen == null) return []
        const { eerst: _, ...rest } = b
        return [{ ...rest, datum: goed.datum }]
      }),
    }
  }
  const er = new Set(p.toetsen.map((t) => t.id))
  for (const t of ERBIJ[pid] ?? []) {
    if (!er.has(t.id)) q = zetToets(q, { ...t, bijgewerkt: 1 })
  }
  return q === p ? p : { ...q, geplandVoor: null }
}
