/**
 * WELK SCHOOLJAAR HET IS
 *
 * Eén bestand dat elk jaar in augustus wordt bijgewerkt, en verder niets.
 *
 * WAAROM DIT MOEST
 *
 * De app was opgezet met `niveau` = de klas die net was afgerond en de
 * schakelaar "Volgend jaar" voor de klas die eraan kwam. In de zomer klopte dat.
 * Daarna niet meer: wie in september in groep 8 zit, ziet zijn eigen stof dan
 * achter een schakelaar staan en groep-7-werk als hoofdaanbod.
 *
 * Dus staat hier per kind de klas van NU, en of het is overgegaan. Dat laatste
 * is geen bijzaak:
 *
 *   Wassima doet 2 havo over. Zij gaat dit hele schooljaar door met 2 havo en
 *   heeft géén 3 havo. Wie haar "gelijktrekt" met de rest zet haar een jaar te
 *   hoog en laat een kind dat net is blijven zitten stof zien die het niet
 *   gehad heeft. Dat is precies de fout die deze regel moet voorkomen.
 *
 * WAT `overgegaan` DOET MET DE LEERSTOF
 *
 * De opgaven in `seed.ts` dragen `jaar: 'next'` voor de klas ná het oude niveau.
 * Voor wie is overgegaan is dat de klas van nu, dus die stof schuift naar
 * `'nu'`. Wat daar al stond — vorig jaar — blijft staan als herhaling, en dat is
 * geen slordigheid: voor de doorstroomtoets en het eindexamen ís de stof van
 * vorig jaar gewoon examenstof.
 *
 * Voor wie blijft zitten schuift er niets. Haar `'next'` blijft een vooruitblik.
 */
/** Het enige wat de omzetting van een opgave hoeft te weten. Zo werkt hij ook
 *  op een sjabloon, want die is geen `Opgave` maar heeft wél een kind en een
 *  leerjaar. */
export interface MetJaar { p: string; jaar?: string | undefined }

/** Het schooljaar waarvoor dit bestand is ingevuld. */
export const SCHOOLJAAR = '2026/27'

export interface Klas {
  /** De klas waar het kind nu in zit. */
  niveau: string
  /** De klas van volgend jaar. */
  volgend: string
  /** Is het kind afgelopen zomer overgegaan? */
  overgegaan: boolean
}

export const KLASSEN: Record<string, Klas> = {
  /* Blijven zitten: 2 havo nog een heel jaar. Zie de kop. */
  wassima: { niveau: '2 havo', volgend: '3 havo', overgegaan: false },
  amaani: { niveau: '5 vwo', volgend: '6 vwo', overgegaan: true },
  amine: { niveau: 'groep 8', volgend: 'brugklas', overgegaan: true },
  selma: { niveau: 'groep 5', volgend: 'groep 6', overgegaan: true },
}

/**
 * Het leerjaar van één opgave zoals het dit schooljaar gelezen hoort te worden.
 * Voor een kind dat is overgegaan wordt de stof van "volgend jaar" de stof van
 * nu; de rest blijft waar hij staat.
 */
export function jaarNu(kaart: MetJaar): 'nu' | 'next' {
  const staat = kaart.jaar === 'next' ? 'next' : 'nu'
  if (staat === 'nu') return 'nu'
  return KLASSEN[kaart.p]?.overgegaan ? 'nu' : 'next'
}

/**
 * De hele voorraad omzetten naar het leerjaar van dit schooljaar. Alleen het
 * veld `jaar` verandert — de id's blijven, en daarmee blijft elke Leitner-kaart
 * aan zijn geschiedenis vastzitten.
 */
export function naarDitJaar<T extends MetJaar>(alle: readonly T[]): T[] {
  return alle.map((e) => {
    const jaar = jaarNu(e)
    if (jaar === 'next') return e.jaar === 'next' ? e : { ...e, jaar: 'next' }
    /* Het veld helemaal weghalen en niet op undefined zetten: overal in de app
       geldt "geen jaar" als dit jaar, en `exactOptionalPropertyTypes` houdt die
       twee terecht uit elkaar. */
    if (e.jaar !== 'next') return e
    const { jaar: _weg, ...rest } = e
    return rest as T
  })
}
