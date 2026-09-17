/**
 * DE VOLGORDE VAN DE ZOEKUITSLAG
 *
 * WAT ER MIS WAS
 *
 * De uitslag komt in vijf emmers uit de database — eigen maaltijden, eigen
 * producten, gerechten, de voedingsmiddelentabel, merkproducten — en het scherm
 * zette ze achter elkaar in die volgorde. Dat leest als één ranglijst en was het
 * niet: het was de volgorde waarin de stukken ooit zijn opgeschreven.
 *
 * Zolang de gerechtenbibliotheek uit tajines en stamppotten bestond viel dat
 * niet op. Sinds er broodjes in staan wel: wie 'kaas' typte kreeg eerst
 * 'Broodje kaas' en moest langs de hele gerechtenlijst scrollen om bij 'Kaas
 * 30+ jong belegen' te komen. Een gerecht dat het woord toevallig in zijn naam
 * heeft won het van het product dat zo héét.
 *
 * WAT ER NU GEBEURT
 *
 * Eigen maaltijden en eigen producten blijven bovenaan. Dat is wél een bewuste
 * keuze en hij staat al in `kal_zoeken`: wie 'tonijn' typt bedoelt zijn eigen
 * salade en niet de tabel. Daar verandert niets aan.
 *
 * Daaronder gaan gerechten, tabel en merk dóór elkaar, gerangschikt op hoe goed
 * de naam bij de vraag past. Vier treden:
 *
 *   0  de naam ís de vraag                     'kaas' → 'Kaas'
 *   1  de naam begint met de vraag             'kaas' → 'Kaas 30+ jong belegen'
 *   2  een woord in de naam begint ermee       'kaas' → 'Broodje kaas'
 *   3  de naam bevat het ergens                'kaas' → 'Geitenkaassalade'
 *   4  de naam zegt het niet                   matcht via synoniem of omschrijving
 *
 * WAAROM TREDE 4 BESTAAT EN NIET GEWOON WEGVALT
 *
 * Omdat een treffer zonder naamovereenkomst niet fout is. `kal_nevo_zoek` kent
 * synoniemen: 'tonijnsalade' vindt 'Salade tonijn- lunch/borrel', waar het
 * woord tonijnsalade nergens in staat. Datzelfde geldt voor een gerecht dat via
 * zijn omschrijving matcht. Die treffers horen er te zijn — alleen niet bóven
 * een regel die letterlijk zo heet.
 *
 * Binnen dezelfde trede telt de lengte van de naam: korter is specifieker.
 * 'Kaas 30+ oud' staat dus boven 'Kaas 30+ jong belegen', en beide boven een
 * gerecht. Bij gelijke lengte blijft de volgorde staan die de database gaf —
 * dáár zit de relevantie van `kal_nevo_zoek` in, en die gooi ik niet weg.
 */

/** Waar een regel vandaan komt. Bepaalt wat het scherm ermee doet. */
export type Bron = 'gerecht' | 'nevo' | 'merk'

export interface Rangschikbaar {
  bron: Bron
  naam: string
  /** De plek die de database gaf, binnen zijn eigen emmer. */
  plek: number
}

/**
 * Normaliseren zoals `gerechtsleutel` in `beeld.ts` dat doet, en om dezelfde
 * reden: 'çorbası' en 'corbasi' horen hetzelfde te zijn. De dotloze Turkse ı
 * valt niet uiteen onder NFD en wordt daarom apart afgevangen.
 */
export function sleutel(tekst: string): string {
  return tekst
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Hoe goed past deze naam bij deze vraag? Lager is beter; 4 is 'niet in de naam'.
 *
 * De vraag wordt in zijn geheel vergeleken en niet per woord. Wie 'jonge kaas'
 * typt bedoelt dat als één ding, en een naam die alleen 'kaas' bevat hoort daar
 * niet ineens bovenaan voor te komen.
 */
export function naamtrede(naam: string, vraag: string): number {
  const n = sleutel(naam)
  const v = sleutel(vraag)
  if (v === '') return 4
  if (n === v) return 0
  if (n.startsWith(v + ' ')) return 1
  /* Een woordgrens, zodat 'kaas' wel 'Broodje kaas' vindt maar niet ineens
     'Geitenkaas' als woordbegin telt — die hoort een trede lager. */
  if (n.includes(' ' + v)) return 2
  if (n.includes(v)) return 3
  return 4
}

/** De vaste vololgorde van de emmers, als laatste scheidsrechter. */
const BRONVOLGORDE: Record<Bron, number> = { nevo: 0, gerecht: 1, merk: 2 }

/**
 * Rangschikt de drie gedeelde emmers tot één lijst.
 *
 * Stabiel: bij gelijke trede, gelijke naamlengte en gelijke bron blijft de
 * volgorde staan die de database gaf.
 */
export function rangschik<T extends Rangschikbaar>(regels: readonly T[], vraag: string): T[] {
  return [...regels].sort((a, b) => {
    const ta = naamtrede(a.naam, vraag)
    const tb = naamtrede(b.naam, vraag)
    if (ta !== tb) return ta - tb
    const la = sleutel(a.naam).length
    const lb = sleutel(b.naam).length
    if (la !== lb) return la - lb
    if (a.bron !== b.bron) return BRONVOLGORDE[a.bron] - BRONVOLGORDE[b.bron]
    return a.plek - b.plek
  })
}
