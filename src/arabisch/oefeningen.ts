/**
 * DE OEFENINGEN
 *
 * Uitgangspunt: ophalen boven herkennen. Meerkeuze wordt alleen ingezet waar
 * onderscheiden zélf de vaardigheid is — welke van deze drie lijkende letters
 * hoor je? — en waar intypen onredelijk zou zijn. Overal elders typt, bouwt of
 * stelt de leerling samen.
 *
 * Tweede uitgangspunt: bij élk antwoord volgt terugkoppeling, ook bij een goed
 * antwoord, en bij een fout antwoord staat er altijd bij waaróm. Toetsen
 * zonder terugkoppeling levert weinig op.
 */
import { LETTERS, TEKENS } from './gegevens/letters'
import { WOORDEN } from './gegevens/woorden'
import { GRAMMATICA } from './gegevens/grammatica'
import { ZINNEN } from './gegevens/zinnen'
import { TEKSTEN } from './gegevens/teksten'
import { KORAN100 } from './gegevens/koran'
import type { Koranwoord, Spoor, Woord, Zin } from './gegevens/soorten'
import { kaartId } from './leerplan'
import type { Padstap } from './leerplan'
import { letterVormen, ontdoeTashkil, vocaliseer } from './tekst'
import type { Vocalisatie } from './tekst'
import { husselen, willekeurig } from './toeval'
import type { Toeval } from './toeval'

export type Oefensoort = 'typ' | 'typ-ar' | 'kies' | 'bouw' | 'bouw-zin'

export interface Oefening {
  /** Het kaart-id, als de oefening in de herhaling meedoet. Twee soorten
   *  hebben er geen: de vormherkenning en de zons-/maansletter. Die horen bij
   *  de groep waarin ze gesteld worden en niet bij één losse letter, en ze
   *  wisselen van vraagstelling — een kaart daarvan zou elke keer iets anders
   *  toetsen dan de vorige keer. Zonder id worden ze niet ingepland. */
  id?: string | undefined
  soort: Oefensoort
  /** De vraag; bevat HTML. */
  vraag: string
  /** Arabisch dat bij de vraag hoort. */
  ar?: string | undefined
  arGroot?: boolean | undefined
  /** Wat de stem moet uitspreken. */
  spreek?: string | undefined
  spreekNu?: string | undefined
  luister?: boolean | undefined
  /** Bij een typvraag: alle antwoorden die goed zijn. */
  juist?: string[] | undefined
  /** Bij een meerkeuzevraag. */
  opties?: string[] | undefined
  juistIndex?: number | undefined
  optiesArabisch?: boolean | undefined
  /** Bij een bouwvraag: wat eruit moet komen, en de tegels om mee te bouwen. */
  doel?: string | undefined
  tegels?: string[] | undefined
  hint?: string | undefined
  /** De terugkoppeling; bevat HTML. */
  uitleg: string
}

const esc = (s: string): string => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Afleiders uit dezelfde soort. Uit een willekeurige hoek van de woordenschat
 *  plukken maakt de vraag makkelijker dan bedoeld. */
function afleiders<T>(bron: readonly T[], uitsluiten: unknown, n: number, veld: keyof T, t: Toeval): T[] {
  return husselen(bron.filter((x) => x[veld] !== uitsluiten), t).slice(0, n)
}

function maakKies(
  id: string | undefined, vraag: string, juistTekst: string, afleiderTeksten: string[],
  uitleg: string, t: Toeval, extra: Partial<Oefening> = {},
): Oefening {
  const opties = husselen([juistTekst].concat(afleiderTeksten), t)
  return {
    id, soort: 'kies', vraag, opties, juistIndex: opties.indexOf(juistTekst), uitleg, ...extra,
  }
}

export function oefBouwWoord(kaal: string, gevocaliseerd: string, nl: string, id: string, t: Toeval): Oefening {
  const letters = Array.from(kaal).filter((c) => c !== ' ')
  const vulling = husselen(LETTERS.map((l) => l.l).filter((l) => !letters.includes(l)), t).slice(0, 2)
  return {
    id, soort: 'bouw',
    vraag: nl ? 'Bouw het woord voor <b>' + esc(nl) + '</b>' : 'Bouw dit woord na',
    hint: gevocaliseerd,
    doel: kaal,
    tegels: husselen(letters.concat(vulling), t),
    uitleg: '<span class="ar klein-ar">' + gevocaliseerd + '</span>' + (nl ? ' — ' + esc(nl) : '')
      + '. Let op de volgorde: de eerste letter staat het meest rechts.',
  }
}

export function oefLetters(letters: string[], t: Toeval): Oefening[] {
  const uit: Oefening[] = []
  const groep = LETTERS.filter((l) => letters.includes(l.l))
  const rest = LETTERS.filter((l) => !letters.includes(l.l))

  for (const L of groep) {
    /* Klank intypen: ophalen, niet herkennen. De transcriptie is met een
       gewoon toetsenbord te typen, dus dit kan ook een kind. */
    uit.push({
      id: kaartId('L', L.l), soort: 'typ',
      vraag: 'Welke klank heeft deze letter? Typ de naam of de klank.',
      ar: L.l, arGroot: true, spreek: L.n,
      juist: [L.tr, L.k, L.tr.replace(/[ʾʿ]/g, ''), L.n],
      uitleg: '<b>' + esc(L.n) + '</b> — ' + esc(L.tr) + ', klank <b>' + esc(L.k) + '</b>. ' + L.u,
    })
    /* Onderscheiden binnen de verwargroep: hier is meerkeuze juist wél de
       goede vorm, want het gáát om het uit elkaar houden. */
    const anderen = groep.filter((x) => x.l !== L.l).map((x) => x.l)
    const vulling = afleiders(rest, L.l, Math.max(0, 3 - anderen.length), 'l', t).map((x) => x.l)
    uit.push(maakKies(
      kaartId('L', L.l, 'vorm'),
      'Welke letter is <b>' + esc(L.n) + '</b> (' + esc(L.tr) + ')?',
      L.l, anderen.concat(vulling).slice(0, 3),
      'Dit is ' + esc(L.n) + '. ' + esc(L.u.split('.')[0] ?? '') + '.',
      t, { optiesArabisch: true }))
    /* Vormherkenning: in welke gedaante staat de letter hier? */
    const v = letterVormen(L.l)
    const welke = willekeurig(
      [['begin', 'beginvorm'], ['midden', 'middenvorm'], ['eind', 'eindvorm']] as const, t)
    uit.push(maakKies(
      undefined,
      'In welke vorm staat deze letter hier?',
      welke[1],
      husselen(['losse vorm', 'beginvorm', 'middenvorm', 'eindvorm'].filter((x) => x !== welke[1]), t).slice(0, 3),
      L.vl
        ? 'De ' + esc(L.n) + ' verbindt naar beide kanten, dus hij heeft alle vier de vormen.'
        : 'Let op: de ' + esc(L.n) + ' verbindt niet naar links. Begin- en middenvorm zien er '
          + 'daarom hetzelfde uit als de losse en de eindvorm.',
      t, { ar: v[welke[0]], arGroot: true }))
  }

  /* Zonsletter of maansletter — alleen de vraag stellen als de groep beide
     soorten bevat, anders is het geen onderscheid maar een weetje. */
  if (groep.some((l) => l.zon) && groep.some((l) => !l.zon)) {
    const L = willekeurig(groep, t)
    /* De transcriptie kent digrafen (th, dh, sh, kh, gh); die moeten als één
       klank worden verdubbeld — ash-sh…, niet as-s…. */
    const klank = (L.tr.match(/^(th|dh|sh|kh|gh|.)/) ?? [L.tr[0]])[0] as string
    uit.push(maakKies(
      undefined,
      'Hoe spreek je <span class="ar klein-ar">ال' + L.l + '</span> uit — versmelt de l of niet?',
      L.zon ? 'De l versmelt: a' + klank + '-' + klank + '…' : 'De l blijft: al-…',
      [L.zon ? 'De l blijft: al-…' : 'De l versmelt'],
      L.zon
        ? esc(L.n) + ' is een zonsletter. De l van het lidwoord verdwijnt en de letter wordt verdubbeld.'
        : esc(L.n) + ' is een maansletter. De l blijft gewoon hoorbaar.',
      t))
  }

  /* Afsluiten met een woord bouwen uit losse letters. */
  const L0 = groep[0]
  if (L0?.vb) {
    const nl = WOORDEN.find((w) => ontdoeTashkil(w.a) === ontdoeTashkil(L0.vb))?.n ?? ''
    uit.push(oefBouwWoord(ontdoeTashkil(L0.vb), L0.vb, nl, kaartId('L', L0.l, 'bouw'), t))
  }
  return uit
}

export function oefTeken(idx: number, t: Toeval): Oefening[] {
  const T = TEKENS[idx]
  if (!T) return []
  return [
    {
      id: kaartId('T', idx), soort: 'typ',
      vraag: 'Hoe heet dit teken?',
      ar: T.demo, arGroot: true,
      juist: [T.tr, T.n, T.tr.replace(/-/g, ' ')],
      uitleg: '<b>' + esc(T.n) + '</b> — ' + esc(T.tr) + '. ' + T.u,
    },
    maakKies(
      kaartId('T', idx, 'wat'),
      'Wat doet dit teken?',
      (T.u.split('.')[0] ?? '') + '.',
      husselen(TEKENS.filter((x) => x.n !== T.n), t).slice(0, 3).map((x) => (x.u.split('.')[0] ?? '') + '.'),
      esc(T.n) + ': ' + T.u,
      t, { ar: T.demo, arGroot: true }),
  ]
}

export interface Woordplek { w: Woord; i: number }

export function oefWoorden(
  items: Woordplek[], spoor: Spoor, stand: Vocalisatie, magLuisteren: boolean, t: Toeval,
): Oefening[] {
  const uit: Oefening[] = []
  items.forEach(({ w, i }, n) => {
    /* Arabisch → Nederlands, intypen. */
    uit.push({
      id: kaartId('W', i, 'nl'), soort: 'typ',
      vraag: 'Wat betekent dit?',
      ar: vocaliseer(w.a, stand), arGroot: true, spreek: w.a,
      juist: w.n.split(/[,(]/).map((s) => s.trim()).filter(Boolean).concat([w.n]),
      uitleg: '<span class="ar klein-ar">' + w.a + '</span> — <b>' + esc(w.n) + '</b> (' + esc(w.t) + ')'
        + (w.mv ? '<br>Meervoud: <span class="ar klein-ar">' + w.mv + '</span>' : '')
        + (w.g ? '<br>Geslacht: ' + (w.g === 'v' ? 'vrouwelijk' : 'mannelijk') : '')
        + (w.d ? '<br><span class="muted">' + esc(w.d) + '</span>' : ''),
    })
    /* De andere richting: produceren. Kinderen bouwen het woord uit losse
       letters, oudere leerlingen typen het met het schermtoetsenbord. */
    if (n % 2 === 0) {
      if (spoor <= 2) {
        uit.push(oefBouwWoord(ontdoeTashkil(w.a), w.a, w.n, kaartId('W', i, 'ar'), t))
      } else {
        uit.push({
          id: kaartId('W', i, 'ar'), soort: 'typ-ar',
          vraag: 'Schrijf in het Arabisch: <b>' + esc(w.n) + '</b>',
          juist: [w.a, ontdoeTashkil(w.a)],
          uitleg: '<span class="ar klein-ar">' + w.a + '</span> — ' + esc(w.t)
            + '. Klinkertekens hoef je niet mee te typen.',
        })
      }
    }
    /* Luisteren en kiezen — alleen als er echt een Arabische stem is. */
    if (magLuisteren && n === 1) {
      uit.push(maakKies(
        kaartId('W', i, 'luister'),
        'Luister en kies het juiste woord.',
        w.n,
        afleiders(WOORDEN.filter((x) => x.th === w.th), w.n, 3, 'n', t).map((x) => x.n),
        'Je hoorde <span class="ar klein-ar">' + w.a + '</span> — ' + esc(w.n) + '.',
        t, { spreekNu: w.a, luister: true }))
    }
  })
  return uit
}

export function oefGrammatica(id: string): Oefening[] {
  const G = GRAMMATICA.find((g) => g.id === id)
  if (!G) return []
  return G.oef.map((o, n) => {
    if (o.k === 'kies') {
      const opties = (o.o ?? []).slice()
      return {
        id: kaartId('G', G.id, n), soort: 'kies' as const,
        vraag: o.v, opties, juistIndex: o.j, uitleg: o.u,
        optiesArabisch: opties.every((x) => /^[\s؀-ۿ]+$/.test(x)),
      }
    }
    return {
      id: kaartId('G', G.id, n),
      soort: /[؀-ۿ]/.test(o.jt?.[0] ?? '') ? 'typ-ar' as const : 'typ' as const,
      vraag: o.v, juist: o.jt, uitleg: o.u,
    }
  })
}

export interface Zinplek { z: Zin; i: number }

export function oefZinnen(items: Zinplek[], t: Toeval): Oefening[] {
  const uit: Oefening[] = []
  items.forEach(({ z, i }, n) => {
    /* Zin samenstellen uit losse woorden: productie zonder dat je elke letter
       hoeft te typen. */
    const woorden = z.a.split(' ')
    if (woorden.length >= 2 && woorden.length <= 9) {
      uit.push({
        id: kaartId('Z', i), soort: 'bouw-zin',
        vraag: 'Zet de woorden in de goede volgorde: <b>' + esc(z.n) + '</b>',
        doel: z.a, tegels: husselen(woorden, t),
        uitleg: '<span class="ar klein-ar">' + z.a + '</span><br><span class="tr">' + esc(z.t) + '</span>',
      })
    }
    /* Gat in de zin: één woord weg, zelf invullen. */
    if (n % 2 === 1 && woorden.length >= 3) {
      const g = Math.floor(t() * woorden.length)
      const zonder = woorden.slice()
      zonder[g] = '____'
      uit.push({
        id: kaartId('Z', i, 'gat'), soort: 'typ-ar',
        vraag: 'Vul het ontbrekende woord in.<br><span class="small muted">' + esc(z.n) + '</span>',
        ar: zonder.join(' '),
        juist: [woorden[g] as string, ontdoeTashkil(woorden[g] as string)],
        uitleg: '<span class="ar klein-ar">' + z.a + '</span><br><span class="tr">' + esc(z.t)
          + '</span><br>' + esc(z.n),
      })
    }
  })
  return uit
}

export function oefTekst(id: string, t: Toeval): Oefening[] {
  const T = TEKSTEN.find((x) => x.id === id)
  if (!T) return []
  const uit: Oefening[] = [{
    id: kaartId('X', T.id), soort: 'kies',
    vraag: T.vraag.v, opties: T.vraag.o.slice(), juistIndex: T.vraag.j, uitleg: T.vraag.u,
  }]
  /* Twee woorden uit de glossen terugvragen — die zijn tijdens het lezen
     alleen achter een tik zichtbaar geweest. */
  husselen(T.gloss, t).slice(0, 2).forEach((g, n) => {
    uit.push({
      id: kaartId('X', T.id, 'g' + n), soort: 'typ',
      vraag: 'Uit de tekst: wat betekent dit woord?',
      ar: g[0], arGroot: true,
      juist: g[1].split(/[,(]/).map((s) => s.trim()).filter(Boolean).concat([g[1]]),
      uitleg: '<span class="ar klein-ar">' + g[0] + '</span> — <b>' + esc(g[1]) + '</b>',
    })
  })
  return uit
}

export interface Koranplek { k: Koranwoord; i: number }

export function oefKoran(items: Koranplek[], t: Toeval): Oefening[] {
  const uit: Oefening[] = []
  items.forEach(({ k, i }, n) => {
    uit.push({
      id: kaartId('K', i), soort: 'typ',
      vraag: 'Wat betekent dit woord?',
      ar: k.a, arGroot: true, spreek: k.a,
      juist: k.n.split(/[,;]/).map((s) => s.trim()).filter(Boolean).concat([k.n]),
      uitleg: '<span class="ar klein-ar">' + k.a + '</span> — <b>' + esc(k.n) + '</b> (' + esc(k.t) + ')'
        + (k.r !== '—' ? '<br>Wortel: <span class="ar klein-ar">' + k.r + '</span>' : '')
        + '<br><span class="muted">Ongeveer ' + k.f + ' keer in de Koran.</span>',
    })
    if (n % 3 === 0 && k.r !== '—') {
      uit.push(maakKies(
        kaartId('K', i, 'wortel'),
        'Welke wortel zit in <span class="ar klein-ar">' + k.a + '</span>?',
        k.r,
        afleiders(KORAN100.filter((x) => x.r !== '—'), k.r, 3, 'r', t).map((x) => x.r),
        '<span class="ar klein-ar">' + k.a + '</span> komt van <span class="ar klein-ar">' + k.r
        + '</span>. Wie de wortel kent, herkent alle woorden die eruit voortkomen.',
        t, { optiesArabisch: true }))
    }
  })
  return uit
}

export interface Omgeving {
  spoor: Spoor
  vocalisatie: Vocalisatie
  magLuisteren: boolean
  toeval: Toeval
}

/** De oefeningen van één blok uit het leerpad. */
export function oefeningenVoorBlok(blok: Padstap | null, o: Omgeving): Oefening[] {
  if (!blok) return []
  const t = o.toeval
  switch (blok.k) {
    case 'letters': return oefLetters(blok.letters ?? [], t)
    case 'teken': return oefTeken(blok.idx ?? 0, t)
    case 'woorden': return oefWoorden(blok.items as Woordplek[], o.spoor, o.vocalisatie, o.magLuisteren, t)
    case 'grammatica': return oefGrammatica(blok.id ?? '')
    case 'zinnen': return oefZinnen(blok.items as Zinplek[], t)
    case 'tekst': return oefTekst(blok.id ?? '', t)
    case 'koran': return oefKoran(blok.items as Koranplek[], t)
    default: return []
  }
}

/** Een kaart uit de herhalingswachtrij terug naar een oefening. */
export function oefeningVoorKaart(id: string, o: Omgeving): Oefening | null {
  const [soort, sleutel, richting] = id.split(':')
  const t = o.toeval
  try {
    if (soort === 'L') {
      const L = LETTERS.find((x) => x.l === sleutel)
      if (!L) return null
      const set = oefLetters([L.l], t)
      return set.find((x) => x.id === id) ?? set[0] ?? null
    }
    if (soort === 'T') {
      const set = oefTeken(Number(sleutel), t)
      return set[richting === 'wat' ? 1 : 0] ?? null
    }
    if (soort === 'W') {
      const i = Number(sleutel)
      const w = WOORDEN[i]
      if (!w) return null
      const set = oefWoorden([{ w, i }], o.spoor, o.vocalisatie, o.magLuisteren, t)
      return set.find((x) => x.id === id) ?? set[0] ?? null
    }
    if (soort === 'G') {
      return oefGrammatica(sleutel ?? '').find((x) => x.id === id) ?? null
    }
    if (soort === 'Z') {
      const i = Number(sleutel)
      const z = ZINNEN[i]
      if (!z) return null
      const set = oefZinnen([{ z, i }], t)
      return set.find((x) => x.id === id) ?? set[0] ?? null
    }
    if (soort === 'X') {
      const set = oefTekst(sleutel ?? '', t)
      return set.find((x) => x.id === id) ?? set[0] ?? null
    }
    if (soort === 'K') {
      const i = Number(sleutel)
      const k = KORAN100[i]
      if (!k) return null
      const set = oefKoran([{ k, i }], t)
      return set.find((x) => x.id === id) ?? set[0] ?? null
    }
  } catch {
    /* Inhoud kan verschoven zijn; de kaart dan overslaan. */
  }
  return null
}
