/**
 * HET TOERNOOI VAN DE WEEK
 *
 * Vier kinderen op verschillende niveaus in één ranglijst. Dat kan alleen als
 * er geteld wordt wat iedereen zelf verdient: punten schalen al met
 * moeilijkheid, dus een som van groep 4 en een som van 4 vwo leveren niet
 * hetzelfde op. De koploper van een afgelopen week krijgt een bonus.
 *
 * De stand wordt bijgehouden als een hoogste-tot-nu-toe per kind, niet als een
 * momentopname: een toestel dat een dag niet online was zou anders de stand
 * kunnen terugzetten.
 */
import { weekSleutel } from './datum'
import { BELONING, halfRond } from './beloning'
import { weekPuntenNu } from './missie'
import type { Stand, Voortgang } from './opslag'

export interface Toernooiuitslag {
  stand: Stand
  /** Wie er zojuist gewonnen heeft, of niets als de week nog loopt. */
  winnaar: { pid: string; week: string; bedrag: number } | null
}

/**
 * Een ronde afsluiten als de week is omgeslagen. Muteert niets; geeft de
 * nieuwe stand terug, met de bonus al bijgeschreven bij de winnaar.
 */
export function toernooiRonde(s: Stand, kinderen: string[], nuMs: number): Toernooiuitslag {
  const nu = weekSleutel(nuMs)
  const huidig: Record<string, number> = {}
  for (const pid of kinderen) {
    const p = s.prog[pid]
    huidig[pid] = p ? weekPuntenNu(p, nuMs) : 0
  }

  const vorige = s.toernooiStand
  if (vorige?.week && vorige.week !== nu) {
    const rij = Object.entries(vorige.punten ?? {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
    const kop = rij[0]
    if (!kop) {
      return {
        stand: { ...s, toernooiStand: { week: nu, punten: huidig }, toernooiWinnaar: null },
        winnaar: null,
      }
    }
    const [winPid] = kop
    const wp = s.prog[winPid] as Voortgang | undefined
    const prog = wp
      ? { ...s.prog, [winPid]: { ...wp, bonus: halfRond((wp.bonus || 0) + BELONING.toernooiBonus) } }
      : s.prog
    const winnaar = { pid: winPid, week: vorige.week, bedrag: BELONING.toernooiBonus }
    return {
      stand: { ...s, prog, toernooiStand: { week: nu, punten: huidig }, toernooiWinnaar: winnaar },
      winnaar,
    }
  }

  /* Dezelfde week: de stand mag alleen omhoog. */
  const samen: Record<string, number> = {}
  for (const pid of kinderen) {
    samen[pid] = Math.max(vorige?.punten?.[pid] ?? 0, huidig[pid] ?? 0)
  }
  return { stand: { ...s, toernooiStand: { week: nu, punten: samen } }, winnaar: null }
}
