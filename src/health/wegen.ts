/**
 * DE BREEDSTE BAND SMALLER MAKEN
 *
 * Na het herkennen staat er een lijst regels met elk een band: "720 kcal
 * (520–980)". Je kon zo'n regel weggooien en verder niets. Terwijl er één
 * handeling is die de band van zo'n regel vrijwel dichtklapt, en dat is hem op
 * een weegschaal leggen.
 *
 * WAAROM DIT DE MOEITE WAARD IS, EN NIET ZOMAAR EEN EXTRA VELD
 *
 * Bij herkenning uit tekst of foto is niet het hérkennen de zwakke schakel maar
 * de portie. Een overzicht van beeldgebaseerde voedingsanalyse vond relatieve
 * fouten op de energie van 0,1 tot 38,3 procent, met de grootste fouten bij
 * samengestelde gerechten; een studie uit 2025 met GPT-4o op maaltijdfoto's vond
 * hetzelfde patroon en zag de nauwkeurigheid duidelijk verbeteren zodra er
 * context werd meegegeven. Het product benoemen is makkelijk, de hoeveelheid
 * schatten is het niet. Zie VERANTWOORDING.md §18.6.
 *
 * Eén weging vervangt dus precies de post die de band breed maakt.
 *
 * WAT ER DAARNA OVERBLIJFT
 *
 * Niet nul. De voedingswaarde komt nog steeds uit de tabel, en die draagt zijn
 * eigen onzekerheid, dezelfde acht procent die `kal-ai` aanhoudt voor een
 * gewogen portie. Een gewogen regel krijgt hier dus een band van ±8 procent en
 * geen punt. Een app die na het wegen een kaal getal toont zou beweren dat de
 * tabel exact is.
 *
 * WAT ER MET DE GRAAD GEBEURT
 *
 * Hoogstens C, en alleen als de voedingswaarde uit de tabel komt. A is
 * voorbehouden aan een etiket dat je zelf overnam; dat is iets anders dan een
 * tabelwaarde met een gewogen portie. Een graad die omhoog springt naar A omdat
 * je iets op een weegschaal legde zou de herkomst van het getal verkeerd
 * voorstellen. Omlaag gaat hij nooit.
 */
import type { Graad } from '@/gedeeld/db/tabellen'
import type { HerkendeRegel } from './ai'

/** De onzekerheid die na het wegen overblijft: die van de tabel zelf. */
export const TABELBAND = 0.08

/**
 * Hoe breed de band van een regel is, in kilocalorieën.
 *
 * Absoluut en niet relatief. Een regel van 700 kcal met twintig procent
 * spreiding doet meer met je dag dan een regel van 90 kcal met vijftig procent,
 * en het is de dag die het onderwerp is.
 */
export function spreiding(r: HerkendeRegel): number {
  return Math.max(0, (r.kcal_hoog || 0) - (r.kcal_laag || 0))
}

/**
 * Welke regel het meest te winnen heeft bij een weging, of null.
 *
 * De drempel staat er zodat het veld niet verschijnt als er niets te winnen
 * valt. Vijftig kilocalorieën is ongeveer een appel: daaronder is het verschil
 * kleiner dan de fout die je met de weegschaal zelf nog maakt, en dan is de
 * vraag stellen erger dan hem niet stellen.
 *
 * Al gewogen regels doen niet mee, te herkennen aan een band die al niet
 * breder is dan de tabelband. Anders zou de app je vragen nog eens te wegen wat
 * je net gewogen hebt.
 */
export function grootsteOnzekerheid(
  regels: readonly HerkendeRegel[], drempel = 50,
): number | null {
  let beste: number | null = null
  let breedste = 0
  regels.forEach((r, i) => {
    const s = spreiding(r)
    /* Een regel waarvan de band al de tabelband is, valt niets meer aan te
       scherpen. De marge van 1 kcal vangt afronding op. */
    if (s <= (r.kcal_punt || 0) * TABELBAND * 2 + 1) return
    if (s >= drempel && s > breedste) { breedste = s; beste = i }
  })
  return beste
}

/**
 * Eén regel opnieuw, met een gewogen portie.
 *
 * Er wordt geschaald vanaf wat er stond: de voedingswaarde per gram verandert
 * niet door te wegen, alleen het aantal grammen. Dat is ook waarom dit hier kan
 * en niet opnieuw langs het model hoeft, er valt niets te herkennen, alleen te
 * vermenigvuldigen.
 *
 * Geeft de regel ongewijzigd terug als er niets te schalen valt: nul of een
 * onzinnig getal, of een regel zonder gram_equivalent om vanaf te rekenen.
 */
export function weegRegel(r: HerkendeRegel, gram: number): HerkendeRegel {
  if (!Number.isFinite(gram) || gram <= 0) return r
  const was = r.gram_equivalent
  if (!Number.isFinite(was) || was <= 0) return r

  const f = gram / was
  const punt = Math.round((r.kcal_punt || 0) * f)

  /* Hoogstens C, en alleen met een tabelwaarde erachter. Zie de kop. */
  const beter: Graad = r.nevo_code ? 'C' : r.conf
  const rang: Record<Graad, number> = { A: 0, B: 1, C: 2, D: 3 }
  const conf: Graad = rang[beter] < rang[r.conf] ? beter : r.conf

  return {
    ...r,
    hoeveelheid: gram,
    eenheid: 'g',
    gram_equivalent: gram,
    gram_laag: gram,
    gram_hoog: gram,
    kcal_punt: punt,
    kcal_laag: Math.round(punt * (1 - TABELBAND)),
    kcal_hoog: Math.round(punt * (1 + TABELBAND)),
    eiwit_g: (r.eiwit_g || 0) * f,
    vet_g: (r.vet_g || 0) * f,
    koolhydraat_g: (r.koolhydraat_g || 0) * f,
    vezel_g: (r.vezel_g || 0) * f,
    conf,
    /* De oude opmerkingen blijven staan, over het bereidingsvet bijvoorbeeld,
       dat na het wegen van de portie nog even onzeker is. Maar een opmerking
       die zegt dat de portie geschat is, is nu onwaar, en er is geen
       betrouwbare manier om die eruit te vissen: het is vrije tekst van het
       model. Vandaar dat de nieuwe opmerking vooraan staat en met zoveel
       woorden zegt dat hij de schatting vervangt. */
    onzekerheidsbronnen: [
      `portie door jou gewogen: ${gram} g. Dat vervangt de schatting hieronder`,
      ...r.onzekerheidsbronnen,
    ],
  }
}
