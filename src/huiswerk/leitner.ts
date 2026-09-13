/**
 * LEITNER — slim herhalen
 *
 * Vijf doosjes met een oplopende wachttijd. Goed beantwoord = een doosje
 * omhoog en dus langer wachten; fout = terug naar voren. Vanaf doosje vier
 * geldt een som als beheerst, en dan levert hij nog maar drie punten op in
 * plaats van tien: oefenen wat je al kunt hoort minder waard te zijn dan
 * oefenen wat je nog niet kunt.
 *
 * De klok komt als argument binnen zodat een wachttijd te toetsen is zonder de
 * systeemklok te verzetten.
 *
 * Onderaan staan drie dingen die erbij horen maar er niet in zaten: de doosjes
 * als sterren (`sterrenVan`), de voorraad op niveau brengen zonder hem tot één
 * som terug te snijden (`opNiveau`), en het kiezen van de volgende beurt met de
 * regel dat wat beheerst is en nog wacht níet terugkomt (`kiesVolgende`).
 * `volgendeKaart` zelf is onaangeroerd gebleven: die is op de oude pagina
 * geijkt en heeft een gouden proef.
 */
import type { Kaart, Opgave, Opgaveinhoud, Sjabloon, Toeval } from './gegevens/soorten'
import type { Kaartstand, Voortgang } from './opslag'

/** Wachttijd per doosje, in dagen. */
export const BOX_DAGEN = [0, 0, 1, 3, 7, 16]

const LEEG: Kaartstand = { box: 0, ok: 0, wrong: 0, last: 0 }

export const kaartStand = (prog: Voortgang, id: string): Kaartstand =>
  prog.cards?.[id] ?? LEEG

export const wanneerTerug = (c: Kaartstand): number =>
  (c.last || 0) + (BOX_DAGEN[c.box] ?? 0) * 86400000

export const isBeheerst = (prog: Voortgang, id: string): boolean =>
  kaartStand(prog, id).box >= 4

export const puntenVoor = (prog: Voortgang, id: string, hintGebruikt: boolean): number =>
  (isBeheerst(prog, id) ? 3 : (hintGebruikt ? 5 : 10))

/** Is dit een sjabloon? Dan levert `gen()` de opgave van deze beurt. */
const isSjabloon = (k: Kaart): k is Sjabloon =>
  typeof (k as Sjabloon).gen === 'function'

/** De kaart zoals hij op het scherm komt. Bij een sjabloon is dat één beurt met
 *  verse getallen; het id blijft dat van het sjabloon. */
export function beurtVan(kaart: Kaart): Opgave {
  if (!isSjabloon(kaart)) return kaart
  const inhoud: Opgaveinhoud = kaart.gen()
  return {
    ...inhoud,
    id: kaart.id, p: kaart.p, v: kaart.v, t: kaart.t,
    ...(kaart.lvl === undefined ? {} : { lvl: kaart.lvl }),
    ...(kaart.jaar === undefined ? {} : { jaar: kaart.jaar }),
  } as Opgave
}

/** Het doelniveau van dit moment: een vaste keuze, of het niveau waar de app
 *  zelf op is uitgekomen. */
export const doelNiveau = (prog: Voortgang): number =>
  ([1, 2, 3].includes(prog.niveau as number) ? (prog.niveau as number) : (prog.autoLvl || 1))

/**
 * De volgende kaart kiezen: eerst wat aan de beurt is of nog nooit gezien,
 * daarbinnen het laagste doosje, dan het dichtst bij het doelniveau, dan het
 * langst niet gezien. Uit de bovenste drie wordt geloot, zodat dezelfde reeks
 * niet elke sessie in dezelfde volgorde terugkomt.
 *
 * `recent` is de lijst kaarten die net geweest zijn (oud → nieuw). Die worden
 * zo veel mogelijk overgeslagen, en de oudste wordt weer toegelaten zodra er
 * anders niets overblijft — een voorraad van drie kaarten mag niet vastlopen.
 */
export function volgendeKaart(
  pool: readonly Kaart[], prog: Voortgang, recent: readonly string[], nu: number, t: Toeval,
): Kaart | null {
  if (!pool || pool.length === 0) return null
  const doel = doelNiveau(prog)
  const dichtbij = (k: Kaart): number => Math.abs((k.lvl ?? 1) - doel)
  const alle = pool.map((kaart) => {
    const c = kaartStand(prog, kaart.id)
    return { kaart, c, terug: c.box === 0 ? 0 : wanneerTerug(c), nu: c.box === 0 || nu >= wanneerTerug(c) }
  })

  let uit = alle
  for (let laat = 0; laat <= recent.length; laat++) {
    const blok = new Set(recent.slice(laat))
    const f = alle.filter((s) => !blok.has(s.kaart.id))
    if (f.length) { uit = f; break }
  }

  const aanDeBeurt = uit.filter((s) => s.nu)
  const set = aanDeBeurt.length ? aanDeBeurt : uit
  set.sort((a, b) => (a.c.box - b.c.box)
    || (dichtbij(a.kaart) - dichtbij(b.kaart))
    || ((a.kaart.lvl ?? 1) - (b.kaart.lvl ?? 1))
    || (a.c.last - b.c.last)
    || (a.terug - b.terug))
  const eerste = set[0]
  if (!eerste) return null
  const top = set
    .filter((s) => s.c.box === eerste.c.box && dichtbij(s.kaart) === dichtbij(eerste.kaart))
    .slice(0, 3)
  return t.pick(top).kaart
}

/* ------------------------------------------------------------------ sterren */

/** Hoeveel sterren een som hoogstens kan hebben: één per doosje. */
export const STERREN = 5

/**
 * Het doosje als sterren. Vier sterren is de grens: daar heet een som
 * beheerst, en daar gaat hij ook van tien naar drie punten. Vijf is de
 * bovenste doos — dezelfde som die na zestien dagen nog goed gaat.
 *
 * Dit is geen tweede waarheid naast `box` maar een weergave ervan. Wie de
 * doosjes verandert, verandert de sterren mee, en dat hoort ook.
 */
export const sterrenVan = (box: number): string => {
  const n = Math.max(0, Math.min(STERREN, Math.round(box)))
  return '⭐'.repeat(n) + '☆'.repeat(STERREN - n)
}

/** De sterren van één som. */
export const sterrenVoor = (prog: Voortgang, id: string): string =>
  sterrenVan(kaartStand(prog, id).box)

/**
 * De sterren van een hele stapel: het gemiddelde doosje, naar beneden
 * afgerond. Naar beneden, want drie sterren horen te betekenen dat het
 * grootste deel er echt in zit — niet dat het er bijna in zit.
 *
 * Dit loopt met kleine stapjes mee, en dat is het verschil met tellen hoeveel
 * sommen er beheerst zijn: die sprong komt pas bij doosje vier, en tot dat
 * moment ziet een kind niets bewegen terwijl het wel vooruitgaat.
 */
export function sterrenVanStapel(prog: Voortgang, kaarten: readonly Kaart[]): number {
  if (!kaarten.length) return 0
  const som = kaarten.reduce((s, k) => s + kaartStand(prog, k.id).box, 0)
  return Math.floor(som / kaarten.length)
}

/* ---------------------------------------------------- de voorraad per niveau */

/**
 * Hoeveel opgaven een voorraad minstens moet houden voordat een vast niveau
 * hem verder mag inperken.
 *
 * Hier zat de klacht. Een vast niveau sneed de voorraad terug tot precies dát
 * niveau, en bij een onderwerp als `Delen` staan er drie vaste sommen — één
 * per niveau. Vast op drie betekende dus: één som, eindeloos herhaald, ook als
 * hij allang beheerst was.
 */
export const MIN_VOORRAAD = 6

/**
 * De voorraad op niveau brengen. Bij `auto` gebeurt er niets; bij een vast
 * niveau komt eerst dát niveau, en pas als er te weinig overblijft schuiven de
 * buurniveaus erbij — het dichtstbijzijnde eerst.
 *
 * Het niveau blijft daarmee een voorkeur en geen muur: `volgendeKaart` sorteert
 * nog steeds op de afstand tot het doelniveau, dus wie vast op drie staat
 * krijgt nog altijd vooral sommen van niveau drie.
 */
export function opNiveau(
  lijst: readonly Kaart[], niveau: Voortgang['niveau'], min: number = MIN_VOORRAAD,
): Kaart[] {
  if (!([1, 2, 3] as unknown[]).includes(niveau)) return [...lijst]
  const doel = niveau as number
  let uit: Kaart[] = []
  for (let afstand = 0; afstand <= 2; afstand++) {
    uit = lijst.filter((k) => Math.abs((k.lvl ?? 1) - doel) <= afstand)
    if (uit.length >= min) break
  }
  return uit.length ? uit : [...lijst]
}

/* ------------------------------------------------------------- de volgende beurt */

export interface Beurtkeuze {
  kaart: Kaart | null
  /**
   * Alles in deze stapel is net geweest en wacht nog. Geen reden om door te
   * vragen: dat is precies het herhalen waar de klacht over ging.
   */
  rust: boolean
  /**
   * En zit alles ook écht vast (doosje vier of hoger)? Dat is iets anders dan
   * rust. Na één goede ronde wacht een som al een dag, maar dan beheers je hem
   * nog niet — en dat hoort het scherm niet te zeggen.
   */
  allesBeheerst: boolean
  /** Wanneer de eerstvolgende som weer aan de beurt is, in ms. */
  terugOm: number
}

/** Is deze som nu aan de beurt — nooit gezien, of zijn wachttijd is om? */
const aanDeBeurt = (prog: Voortgang, k: Kaart, nu: number): boolean => {
  const c = kaartStand(prog, k.id)
  return c.box === 0 || nu >= wanneerTerug(c)
}

/**
 * De volgende beurt kiezen, met twee regels bovenop `volgendeKaart`.
 *
 * **Wat beheerst is en nog wacht, komt niet terug.** `volgendeKaart` valt terug
 * op de hele voorraad zodra er niets aan de beurt is; dan krijg je een som die
 * je vorige week al vier keer goed had. Hier stopt dat: er komt `rust: true`
 * uit, en het scherm zegt wanneer het onderwerp terugkomt. Met `dwing` gaat het
 * alsnog door — bij een toets, die zijn tien vragen nodig heeft, en bij een
 * kind dat zelf zegt dat het wil doorgaan.
 *
 * **Een sjabloon gaat vóór dezelfde som nóg een keer.** Is alles wat overblijft
 * net geweest, dan wint een sjabloon: die levert verse getallen en dus een
 * vraag die het kind nog niet gezien heeft. Herhalen mag, maar niet als er iets
 * nieuws naast ligt.
 */
export function kiesVolgende(
  pool: readonly Kaart[], prog: Voortgang, recent: readonly string[], nu: number, t: Toeval,
  dwing = false,
): Beurtkeuze {
  if (!pool || pool.length === 0) {
    return { kaart: null, rust: false, allesBeheerst: false, terugOm: 0 }
  }
  const terugOm = pool.reduce(
    (m, k) => Math.min(m, wanneerTerug(kaartStand(prog, k.id))), Infinity)
  const allesBeheerst = pool.every((k) => isBeheerst(prog, k.id))
  const open = pool.filter((k) => aanDeBeurt(prog, k, nu))
  if (!open.length && !dwing) return { kaart: null, rust: true, allesBeheerst, terugOm }

  const bron = open.length ? open : pool
  const gezien = new Set(recent)
  if (bron.every((k) => gezien.has(k.id))) {
    const versen = bron.filter(isSjabloon)
    if (versen.length) return { kaart: t.pick(versen), rust: false, allesBeheerst, terugOm }
  }
  return {
    kaart: volgendeKaart(bron, prog, recent, nu, t), rust: false, allesBeheerst, terugOm,
  }
}
