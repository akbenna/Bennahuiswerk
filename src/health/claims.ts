/**
 * DE VLAGGETJES BIJ EEN PRODUCT — en waarom er maar drie zijn
 *
 * De geleverde beeldset had er zes: rijk aan eiwit, rijk aan vezels, gezonde
 * keuze, goed voor je hart, voordelig, favoriet. Drie daarvan haalden het niet,
 * en dat is geen zuinigheid maar noodzaak.
 *
 * "Goed voor je hart" is een gezondheidsclaim. Die zijn in de EU alleen
 * toegestaan als ze op de toegelaten lijst staan, met een precies voorgeschreven
 * formulering en voorwaarden per stof. Een app die dat zinnetje onder een
 * willekeurig product zet doet een uitspraak die hij niet mag doen — en in deze
 * app zou hij bovendien uit niets volgen.
 *
 * "Gezonde keuze" is erger, want het klinkt onschuldig. Het is een oordeel over
 * een heel product, terwijl deze app juist per waarde laat zien waar hij zeker
 * van is en waar niet. Eén samenvattend stempel gooit dat weg.
 *
 * "Voordelig" kan niet: er staan geen prijzen in de voedingsmiddelentabel.
 *
 * WAT ER WÉL KAN, EN WAAROM DAT STERKER IS
 *
 * Wat overblijft zijn voedingsclaims, en die hebben in Verordening (EG)
 * 1924/2006 een wettelijke drempel. Dat is precies het soort grens waar deze app
 * op draait: niet mijn oordeel maar een gepubliceerde regel, na te rekenen uit
 * waarden die de tabel al levert.
 *
 *     bron van eiwitten    minimaal 12 % van de energie uit eiwit
 *     eiwitrijk            minimaal 20 % van de energie uit eiwit
 *     bron van vezels      minimaal 3 g/100 g, of 1,5 g/100 kcal
 *     vezelrijk            minimaal 6 g/100 g, of 3 g/100 kcal
 *     laag natriumgehalte  hoogstens 0,12 g natrium per 100 g
 *
 * Eiwit levert 4 kcal per gram; dat is de Atwater-factor die ook onder de rest
 * van deze app ligt.
 *
 * Een vlaggetje verschijnt alleen als de waarde er is. Ontbreekt het vezel- of
 * natriumgehalte, dan staat er niets — en niet "bevat weinig", want dat is een
 * uitspraak over iets wat we niet weten.
 */

export type Claimsoort = 'eiwit' | 'vezel' | 'zout'

export interface Claim {
  id: string
  soort: Claimsoort
  naam: string
  /** De regel waar het vlaggetje op steunt, voor de titel bij het zweven. */
  grond: string
}

/** Eiwit levert 4 kcal per gram. */
export const KCAL_PER_GRAM_EIWIT = 4

export interface Voedingswaarden {
  kcal: number
  eiwit_g?: number | null | undefined
  vezel_g?: number | null | undefined
  natrium_mg?: number | null | undefined
}

export function claims(v: Voedingswaarden): Claim[] {
  const uit: Claim[] = []

  if (v.eiwit_g != null && v.kcal > 0) {
    const deel = (v.eiwit_g * KCAL_PER_GRAM_EIWIT) / v.kcal
    if (deel >= 0.2) {
      uit.push({ id: 'eiwitrijk', soort: 'eiwit', naam: 'Eiwitrijk',
        grond: 'Minstens 20 % van de energie komt uit eiwit — de drempel voor "eiwitrijk" '
          + 'in de Europese verordening voor voedingsclaims.' })
    } else if (deel >= 0.12) {
      uit.push({ id: 'eiwitbron', soort: 'eiwit', naam: 'Bron van eiwit',
        grond: 'Minstens 12 % van de energie komt uit eiwit — de drempel voor "bron van '
          + 'eiwitten" in de Europese verordening voor voedingsclaims.' })
    }
  }

  if (v.vezel_g != null && v.kcal > 0) {
    const per100kcal = (v.vezel_g / v.kcal) * 100
    if (v.vezel_g >= 6 || per100kcal >= 3) {
      uit.push({ id: 'vezelrijk', soort: 'vezel', naam: 'Vezelrijk',
        grond: 'Minstens 6 g vezel per 100 g, of 3 g per 100 kcal.' })
    } else if (v.vezel_g >= 3 || per100kcal >= 1.5) {
      uit.push({ id: 'vezelbron', soort: 'vezel', naam: 'Bron van vezels',
        grond: 'Minstens 3 g vezel per 100 g, of 1,5 g per 100 kcal.' })
    }
  }

  /* Alleen de lage kant. "Veel zout" is geen toegestane claim en het zou hier
     ook niet horen: wat veel is hangt af van hoeveel je ervan eet, en dat weet
     dit vlaggetje niet. De zoutwaarde zelf staat er bij hoge bloeddruk al. */
  if (v.natrium_mg != null && v.natrium_mg <= 120) {
    uit.push({ id: 'zoutarm', soort: 'zout', naam: 'Laag natriumgehalte',
      grond: 'Hoogstens 0,12 g natrium per 100 g — de drempel uit de Europese verordening '
        + 'voor voedingsclaims.' })
  }

  return uit
}
