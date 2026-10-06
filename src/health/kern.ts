/**
 * DE KERN DIE NAAR BUITEN GAAT
 *
 * Dit bestand is de ingang van het pakket dat ProVita Care van BennaHealth
 * overneemt. `gereedschap/kern-bundel.mjs` bundelt alleen wat hier geëxporteerd
 * wordt, en de proef ernaast (`kern.proef.ts`) houdt de lijst vast.
 *
 * WAAROM EEN EIGEN INGANG EN NIET GEWOON DE MAP
 *
 * Omdat de vraag welke functies meegaan geen technische vraag is maar een
 * regelgevingsvraag. ProVita draait in een zorgcontext: daar kijkt een
 * behandelaar mee, en wat hier een gebruiker over zichzelf leest, wordt daar
 * informatie naast een klinisch besluit. Voor registreren en terugrekenen
 * maakt dat niets uit. Voor een risicoscore of een toets aan
 * medicatiecriteria wel: dat is beslisondersteuning, en dan is regel 11 van
 * bijlage VIII MDR niet langer grijs. Zie `health/BEOOGD-DOEL.md` en in de
 * ProVita-repo `docs/voeding-module-compliance.md` en
 * `docs/bennahealth-integratie.md` §5.
 *
 * Dus hier staat wat registreert en terugrekent, en niets wat oordeelt:
 *
 *   wel   de gewichtstrend, de regressie met haar standaardfout, de
 *         energiebalans met haar interval, de middelomtrek als reeks, de
 *         omrekening van natrium naar zout, de bewegingsminuten (zonder
 *         het weekdoel van 150 minuten: ook een norm is een toets)
 *   niet  `klinisch.ts` (SCORE2, FIB-4, STOP-Bang), `trap.ts` (de NHG-criteria
 *         voor medicatie), `spier.ts` (SARC-F en de eiwitdrempel als toets),
 *         `conditie.ts` (de signalen), `watals.ts`
 *
 * Komt er ooit een uitspraak van een MDR-toets die de tweede rij toestaat, dan
 * verhuist er iets naar de eerste, met een regel in `kern.proef.ts` erbij. Niet
 * eerder.
 *
 * Wat ProVita uit `analyse()` gebruikt staat beschreven in die repo. Het
 * rekent zelf ook een `doel` en een `eiwitDoel` uit; ProVita toont die niet,
 * want een kilocaloriedoel is precies de streefwaarde die de
 * compliancenotitie daar uitsluit. De som blijft hier gelijk, zodat de gouden
 * waarden aan beide kanten hetzelfde bewijzen.
 */

/** Verhoog bij elke wijziging aan wat hier geëxporteerd wordt of aan een som
 *  eronder. ProVita pint deze versie en zijn proef leest hem terug. */
export const KERN_VERSIE = '1.0.0'

export {
  KCAL_PER_KG,
  VENSTER,
  UITBIJTER_KG,
  UITBIJTER_MIN_N,
  analyse,
  bmr,
  regressie,
  trendReeks,
} from './rekenkern'
export type {
  Analyse,
  DagMetTotalen,
  Dagenkaart,
  Punt,
  Regressie,
  TdeeOordeel,
  Trendpunt,
  Zekerheid,
} from './rekenkern'

export { MEETRUIS_CM, middelbeloop } from './middelbeloop'
export type { Middelbeloop, Middelpunt } from './middelbeloop'

export { ZOUTFACTOR, zoutGram } from './zout'

export { FACTOR, equivalent, weektotaal } from './inspanning'
export type { Intensiteit, Inspanningsrij } from './inspanning'

export { dagVerschil, plusDagen } from '@/gedeeld/datum'
