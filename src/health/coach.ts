/**
 * DE COACH — wat er nog nodig is, en wat dat kan vullen
 *
 * Twee lagen, en de volgorde is het ontwerp.
 *
 * De eerste laag rékent. Hoeveel energie is er nog over vandaag, hoeveel eiwit,
 * en hoeveel van de dag is er nog om het in te doen. Daar komt geen model aan
 * te pas, en dat hoort ook niet: het is aftrekken, en aftrekken hoort te
 * kloppen. Wél draagt de uitkomst zijn onzekerheid, want de invoer draagt die
 * ook — wat je logde ligt tussen `_laag` en `_hoog`, dus wat je nog overhebt
 * ligt tussen `doel - _hoog` en `doel - _laag`. Een coach die "nog 640 kcal"
 * zegt terwijl het 480 tot 800 is, verzint precisie.
 *
 * De tweede laag stelt voor, en doet dat uit je eigen geschiedenis. Dat is geen
 * bezuiniging op de AI maar de betere bron: wat je vorige week at ken je, je
 * hebt het in huis, en de portie is de jouwe — de getallen zijn overgenomen en
 * niet geschat. Een voorstel als "eet 180 gram magere kwark" is voor een app
 * makkelijk te verzinnen en voor een mens moeilijk uit te voeren.
 *
 * De regel waarop gerangschikt wordt is de moeite van het uitleggen waard.
 * Meestal knelt het eiwit en niet de energie: je hebt nog 500 kcal en nog 45
 * gram eiwit te gaan, en dat betekent dat alles wat je vanaf nu eet minstens
 * 0,09 gram eiwit per kcal moet leveren, anders wordt het onhaalbaar. Die eis
 * is een getal, en elk voorstel is ertegen te toetsen: haalt het die dichtheid,
 * dan wordt de rest van je dag makkelijker; haalt het die niet, dan wordt hij
 * moeilijker. Zo staat er bij elk voorstel waaróm het er staat.
 *
 * Wat hier niet gebeurt: verzinnen. Levert je geschiedenis niets dat past, dan
 * is het antwoord een lege lijst en niet een salade die je nooit gegeten hebt.
 * Dát is het punt waarop een model iets toevoegt, en pas daar.
 */
import { herhalingen, sleutelVan } from './herhaal'
import type { Herhaling } from './herhaal'
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'

/* ==========================================================================
   LAAG 1 — WAT ER NOG OVER IS
   ========================================================================== */

export interface Dagstand {
  /** Wat er vandaag gelogd staat, als punt en als band. */
  kcal: number
  kcalLaag: number
  kcalHoog: number
  eiwit: number
}

export interface Tekort {
  /** Energie die er nog in past. Negatief betekent: eroverheen. */
  kcalOver: number
  /** De band eromheen. Laag hoort bij de bovenkant van wat je at. */
  kcalOverLaag: number
  kcalOverHoog: number
  /** Eiwit dat er nog bij moet. Nooit negatief: gehaald is gehaald. */
  eiwitOver: number
  /** Is het eiwitdoel al binnen? */
  eiwitRond: boolean
  /** Zit je over je energiedoel? */
  erover: boolean
  /**
   * Hoeveel gram eiwit er per kcal nodig is in de rest van de dag. Dit is de
   * eis waartegen een voorstel getoetst wordt. Null als er geen eiwit meer bij
   * hoeft, of als er geen energie meer over is om het in te stoppen.
   */
  eis: number | null
}

export function tekort(stand: Dagstand, doelKcal: number | null, doelEiwit: number): Tekort {
  const over = doelKcal == null ? 0 : doelKcal - stand.kcal
  const eiwitOver = Math.max(0, doelEiwit - stand.eiwit)
  return {
    kcalOver: over,
    /* De band draait om: at je aan de bovenkant van de schatting, dan hou je
       aan de onderkant over. Dat is geen slordigheid maar de rekenregel. */
    kcalOverLaag: doelKcal == null ? 0 : doelKcal - stand.kcalHoog,
    kcalOverHoog: doelKcal == null ? 0 : doelKcal - stand.kcalLaag,
    eiwitOver,
    eiwitRond: eiwitOver <= 0,
    erover: doelKcal != null && over < 0,
    eis: eiwitOver > 0 && over > 0 ? eiwitOver / over : null,
  }
}

/* ==========================================================================
   LAAG 2 — WAT DAT KAN VULLEN, UIT JE EIGEN GESCHIEDENIS
   ========================================================================== */

/** Waarom een voorstel in de lijst staat. Er staat altijd een reden bij. */
export type Reden =
  /** Levert genoeg eiwit per kcal om de rest van de dag haalbaar te houden. */
  | 'eiwit'
  /** Past binnen wat er over is, maar helpt het eiwit niet vooruit. */
  | 'past'
  /** Je eiwit is rond; dit is gewoon wat je op dit moment meestal eet. */
  | 'gewoonte'

export interface Voorstel {
  herhaling: Herhaling
  naam: string
  kcal: number
  eiwit: number
  /** Gram eiwit per kcal. Vergelijkbaar met `Tekort.eis`. */
  dichtheid: number
  reden: Reden
  /** Hoeveel er van het tekort overblijft als je dit eet. */
  restKcal: number
  restEiwit: number
}

export interface Coachvraag {
  nu: IsoDatum
  /** Het moment waarvoor je een voorstel zoekt. */
  moment: Moment
  /** Hoeveel dagen geschiedenis meetellen. */
  venster?: number
  max?: number
}

/**
 * Een voorstel past als het binnen de puntschatting van wat er over is valt.
 *
 * De eerste versie hier nam de bovenkant van de band: at je misschien minder
 * dan geschat, dan is er misschien meer ruimte. Dat klinkt redelijk en het is
 * het niet. De proef liet zien wat het oplevert: met nog 100 kcal over als punt
 * en 385 als bovengrens werd een boterham van 320 kcal voorgesteld, met een
 * rest van −220. De band mag het bericht breder maken — "nog 800, tussen 620
 * en 980" — maar hij is geen vergunning om erover te gaan. Dezelfde asymmetrie
 * als elders in deze app: onzekerheid pleit niet in je voordeel.
 */
function past(kcal: number, t: Tekort): boolean {
  return kcal > 0 && kcal <= t.kcalOver
}

export function voorstellen(regels: Regel[], t: Tekort, vraag: Coachvraag): Voorstel[] {
  /* Boven het doel heeft een voorstel geen betekenis meer. Zwijgen is dan het
     eerlijke antwoord; de app zegt het in woorden, niet met een lege lijst
     die op een storing lijkt. */
  if (t.erover || t.kcalOver <= 0) return []

  const max = vraag.max ?? 4
  const kandidaten = herhalingen(regels, {
    nu: vraag.nu,
    soort: 'vaak',
    moment: vraag.moment,
    venster: vraag.venster ?? 60,
    max: 60,
  })

  const uit: Voorstel[] = []
  for (const h of kandidaten) {
    const kcal = h.regel.kcal_punt ?? 0
    const eiwit = h.regel.eiwit_g ?? 0
    if (!past(kcal, t)) continue
    const dichtheid = kcal > 0 ? eiwit / kcal : 0
    const reden: Reden = t.eis == null ? 'gewoonte' : dichtheid >= t.eis ? 'eiwit' : 'past'
    uit.push({
      herhaling: h,
      naam: h.naam,
      kcal,
      eiwit,
      dichtheid,
      reden,
      restKcal: Math.round(t.kcalOver - kcal),
      restEiwit: Math.round(Math.max(0, t.eiwitOver - eiwit)),
    })
  }

  /* Eerst wat de eis haalt, en daarbinnen op dichtheid — niet op absoluut
     eiwit. Dat verschil is niet academisch: bij een eis van 0,10 g/kcal en nog
     1.110 kcal te gaan zette de sortering op absoluut eiwit een tajine van 720
     kcal bovenaan, goed voor bijna je hele resterende ruimte in één keer. Op
     dichtheid komt bovenaan wat het meeste eiwit per calorie levert, en dat is
     precies de grootheid waarin de eis is uitgedrukt.

     Knelt het eiwit niet, dan is dichtheid betekenisloos en wint gewoonte: wat
     je op dit moment het vaakst eet. Die volgorde draagt `herhalingen` al. */
  const rang = (v: Voorstel): number => (v.reden === 'eiwit' ? 0 : v.reden === 'past' ? 1 : 0)
  if (t.eis == null) return uit.slice(0, max)
  return uit
    .sort((a, b) => (rang(a) - rang(b)) || (b.dichtheid - a.dichtheid))
    .slice(0, max)
}

/* ==========================================================================
   WANNEER HET DE MOEITE WAARD IS OM IETS TE ZEGGEN
   ========================================================================== */

/**
 * Een prikkel die elke dag om drie uur afgaat is na een week behang. Deze
 * functie bepaalt of er op dit moment iets te melden valt, en het antwoord is
 * meestal nee.
 *
 * De drempels zijn met opzet grof. Vijftien gram eiwit is ongeveer een portie;
 * daaronder is het verschil kleiner dan de meetfout van het loggen zelf, en dan
 * zou de app je storen voor ruis.
 */
export interface Melding {
  melden: boolean
  reden: 'eiwit-achter' | 'ruimte-over' | 'bijna-op' | 'niets'
}

export function meldenNu(t: Tekort, uur: number): Melding {
  /* Na negenen 's avonds heeft een voorstel geen zin meer: dan eet je niet meer
     en is het enige effect dat je je slecht voelt over een dag die al voorbij
     is. */
  if (uur >= 21 || uur < 9) return { melden: false, reden: 'niets' }

  if (t.erover) return { melden: false, reden: 'niets' }

  /* Bijna op, met nog een halve dag te gaan: dat is het enige waarschuwende
     bericht dat de app stuurt, en alleen als het vroeg genoeg is om er iets
     mee te doen. */
  if (uur < 17 && t.kcalOver > 0 && t.kcalOver < 350) {
    return { melden: true, reden: 'bijna-op' }
  }

  if (t.eiwitOver >= 15 && t.kcalOver >= 150) {
    return { melden: true, reden: 'eiwit-achter' }
  }

  /* Veel ruimte over en het is al laat: dan is onder-eten het risico, en dat
     ondermijnt het model net zo goed als over-eten. */
  if (uur >= 17 && t.kcalOver > 700) return { melden: true, reden: 'ruimte-over' }

  return { melden: false, reden: 'niets' }
}

/** De sleutel waarop een voorstel herkend wordt; gedeeld met de suggestielijst. */
export const sleutel = sleutelVan
