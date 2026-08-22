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
