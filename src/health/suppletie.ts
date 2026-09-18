/**
 * DE SUPPLETIE — wat er ontbreekt, en hoe zeker dat is
 *
 * Deze app heeft één stelregel die alles eronder bepaalt: geen enkel getal
 * zonder zijn onzekerheid. Bij suppletie botst dat op een ongemakkelijk feit,
 * en dat feit staat hier boven de code omdat het alles bepaalt wat eronder
 * staat.
 *
 * WAT DE TABEL NIET WEET
 *
 * Van de 2.328 producten in het voedingsstoffenbestand heeft er níét één een
 * micronutriënt ingevuld — `overige_nutrienten` is overal `{}`. Er staat
 * energie, eiwit, vet, verzadigd vet, koolhydraten, suikers, vezel en natrium,
 * en verder niets.
 *
 * Dus: geen ijzer, geen B12, geen calcium, geen vitamine D uit je eigen log.
 * Niet "nog niet nauwkeurig genoeg" maar helemaal niet. Deze app kán geen
 * inname van een micronutriënt berekenen, en elke regel hieronder die doet alsof
 * dat wel kan zou liegen.
 *
 * WAT ER WEL KAN, EN DAT IS MEER DAN NIETS
 *
 * Twee bronnen, en ze zijn van verschillende sterkte:
 *
 *   GEZEGD    wat je in "Wat je lust" hebt aangezet, en wat er in je profiel
 *             staat. Veganistisch is veganistisch — daar valt niets aan te
 *             meten en het hoeft ook niet.
 *   GEZIEN    uit welke NEVO-groepen je de laatste achtentwintig dagen iets
 *             hebt gelogd. Dat is een wáárneming uit je eigen gegevens: niet
 *             hoeveel omega-3 je binnenkreeg, maar wel dat er geen vis tussen
 *             stond. Zwakker dan een meting en veel sterker dan een vinkje.
 *
 * Een advies dat op "gezien" rust noemt de waarneming erbij. "Je logde de
 * laatste 28 dagen niets uit Vis, schaal- en schelpdieren" is controleerbaar;
 * "je eet weinig vis" is een oordeel.
 *
 * TWEE SOORTEN, EN HET VERSCHIL IS NIET COSMETISCH
 *
 *   NODIG        er is geen voedingsweg. Zonder aanvulling ontstaat er een
 *                tekort, en dat is geen kwestie van hoe goed je verder eet.
 *                Er is er precies één: B12 bij veganistisch.
 *   OVERWEGEN    de inname is waarschijnlijk laag, en aanvullen is verdedigbaar
 *                zonder dwingend te zijn. Alles behalve die ene.
 *
 * Het verschil hoort zichtbaar te zijn omdat de gebruiker er iets anders mee
 * doet. Een lijst waarin B12-bij-veganisme naast "magnesium kan geen kwaad"
 * staat maakt van het eerste een suggestie.
 *
 * WAT HIER NIET IN KOMT
 *
 * Multivitamines, magnesium, en alles wat "ondersteunt" zonder dat er een
 * tekort aan ten grondslag ligt. Niet uit voorzichtigheid maar omdat er geen
 * bewering te doen valt: bij iemand die voldoende eet is er geen aangetoond
 * effect, en een app die het toch voorstelt doet precies wat deze app nergens
 * anders doet.
 *
 * EN DIT IS GEEN VOORSCHRIFT
 *
 * Het is wat er uit je eigen gegevens en je eigen antwoorden volgt. Elke regel
 * zegt waaróp hij rust, zodat je hem kunt narekenen of wegwuiven. Dat is de
 * enige vorm waarin een app dit hoort te doen.
 */
import type { Eetpatroon, Voorkeuren } from './voorkeuren'

export type Zwaarte = 'nodig' | 'overwegen'

export interface Advies {
  /** Stabiel, zodat een scherm er een sleutel van kan maken. */
  id: string
  stof: string
  zwaarte: Zwaarte
  /** Eén zin: waaróm. */
  reden: string
  /** Waarop deze regel rust — te controleren, niet te geloven. */
  grond: string
  /** De richtlijn of het onderzoek erachter. */
  bron: string
}

/** Wat er nodig is om te kunnen oordelen. */
export interface Suppletievraag {
  voorkeuren: Voorkeuren
  /**
   * NEVO-groepen waaruit in het venster iets gelogd is.
   *
   * Leeg betekent hier niet "je at niets uit die groepen" maar "er is te weinig
   * gelogd om iets te zien" — zie `genoegGelogd`.
   */
  gelogdeGroepen: readonly string[]
  /** Hoeveel dagen er werkelijk iets gelogd is in het venster. */
  dagenGelogd: number
}

/**
 * Onder deze grens zegt de log niets.
 *
 * Wie vier dagen heeft gelogd heeft geen vis gegeten in die vier dagen, en dat
 * is geen waarneming over zijn voeding maar over zijn invoergedrag. Veertien van
 * de achtentwintig is de helft: genoeg om een patroon te zien, weinig genoeg om
 * niet alleen voor de trouwste gebruikers te werken.
 *
 * Het getal is gekozen en niet gemeten, en dat hoort erbij te staan.
 */
export const GENOEG_DAGEN = 14

export const VENSTER_DAGEN = 28

export function genoegGelogd(v: Suppletievraag): boolean {
  return v.dagenGelogd >= GENOEG_DAGEN
}

/** Of deze groep in het venster voorkwam. */
function at(v: Suppletievraag, groep: string): boolean {
  return v.gelogdeGroepen.includes(groep)
}

/** Of de gebruiker deze groep heeft uitgezet. */
function uitgezet(v: Suppletievraag, groep: string): boolean {
  return v.voorkeuren.nooit.includes(groep)
}

/**
 * Of een groep buiten beeld is — gezegd óf gezien.
 *
 * Uitgezet telt altijd; niet gelogd telt alleen als er genoeg gelogd is. Die
 * asymmetrie is het hele verschil tussen de twee bronnen: een vinkje is er, ook
 * op een dag dat je niets invulde.
 */
function buitenBeeld(v: Suppletievraag, groep: string): boolean {
  return uitgezet(v, groep) || (genoegGelogd(v) && !at(v, groep))
}

function grondVan(v: Suppletievraag, groep: string): string {
  if (uitgezet(v, groep)) return `Je hebt "${groep}" uitgezet in Wat je lust.`
  return `Je logde de laatste ${VENSTER_DAGEN} dagen niets uit "${groep}".`
}

const VIS = 'Vis, schaal- en schelpdieren'
const ZUIVEL = ['Melk en melkproducten', 'Kaas']
const VLEES = ['Vlees en gevogelte', 'Vleeswaren']

/**
 * De adviezen die volgen uit deze gegevens.
 *
 * DE VOLGORDE VAN DE BLOKKEN HIERONDER IS DRAGEND
 *
 * Wat nodig is staat boven wat te overwegen is, en dat komt uit de volgorde
 * waarin ze worden toegevoegd — B12 als eerste. Hier stond een `sort` die
 * hetzelfde nog eens deed, en die kon niet fout gaan: met één "nodig" dat als
 * eerste wordt toegevoegd verandert sorteren nooit iets. Een mutatieproef liet
 * dat zien — hem weghalen brak geen enkele proef.
 *
 * Dus weg. Komt er ooit een tweede "nodig" bij, dan hoort die bovenaan in deze
 * functie te staan en niet onderaan met een sortering die het rechttrekt.
 * Daarom staat het hier: de volgende die iets toevoegt moet dit lezen.
 */
export function adviezen(v: Suppletievraag): Advies[] {
  const uit: Advies[] = []
  const p: Eetpatroon = v.voorkeuren.patroon

  /* DE ENIGE DIE NODIG IS

     B12 komt uitsluitend uit dierlijke producten en uit verrijkte voeding. Een
     veganistisch voedingspatroon zonder aanvulling leidt tot een tekort — niet
     misschien, en niet afhankelijk van hoe goed de rest is. Dit is het enige
     advies in dit bestand waar geen afweging bij hoort. */
  if (p === 'veganistisch') {
    uit.push({
      id: 'b12',
      stof: 'Vitamine B12',
      zwaarte: 'nodig',
      reden: 'B12 zit alleen in dierlijke producten en in verrijkte voeding. '
        + 'Zonder aanvulling ontstaat er een tekort, ook bij verder goede voeding.',
      grond: 'Je gaf aan veganistisch te eten.',
      bron: 'Gezondheidsraad, Voedingsnormen B12 — aanvulling geadviseerd bij een '
        + 'volledig plantaardig voedingspatroon.',
    })
  }

  /* IJZER uit planten is heemijzervrij en daarmee slechter opneembaar. Dat is
     een reden om erop te letten en geen reden om standaard te slikken: te veel
     ijzer is niet onschuldig, en een tekort hoort met bloedonderzoek te worden
     vastgesteld en niet met een app. Vandaar de zin over prikken. */
  if ((p === 'vegetarisch' || p === 'veganistisch')
      || VLEES.every((g) => buitenBeeld(v, g))) {
    uit.push({
      id: 'ijzer',
      stof: 'IJzer',
      zwaarte: 'overwegen',
      reden: 'IJzer uit planten wordt slechter opgenomen dan uit vlees. Vitamine C '
        + 'bij de maaltijd helpt daarbij meer dan een pil.',
      grond: p === 'alles' || p === 'pescotarisch'
        ? grondVan(v, VLEES[0]!)
        : 'Je gaf aan geen vlees te eten.',
      bron: 'Gezondheidsraad, Voedingsnormen ijzer. Een tekort hoor je te laten '
        + 'prikken en niet te vermoeden — vraag het na bij je huisarts.',
    })
  }

  /* OMEGA-3: de visadvieslijn. Twee keer per week vis, waarvan één keer vet, is
     de Nederlandse richtlijn; wie geen vis eet haalt EPA en DHA nergens anders
     vandaan behalve uit algenolie. */
  if (buitenBeeld(v, VIS)) {
    uit.push({
      id: 'omega3',
      stof: 'Omega-3 (EPA en DHA)',
      zwaarte: 'overwegen',
      reden: 'EPA en DHA komen vrijwel alleen uit vette vis. Algenolie is de '
        + 'plantaardige weg ernaartoe; lijnzaad en walnoot leveren een andere '
        + 'vetzuur die het lichaam maar beperkt omzet.',
      grond: grondVan(v, VIS),
      bron: 'Richtlijnen goede voeding 2015: wekelijks vis, bij voorkeur vette vis.',
    })
  }

  /* CALCIUM: zuivel is in Nederland verreweg de grootste bron. Zonder zuivel
     is het te halen uit verrijkte vervangers en groene groente, maar dan moet
     je het wel weten. */
  if (ZUIVEL.every((g) => buitenBeeld(v, g))) {
    uit.push({
      id: 'calcium',
      stof: 'Calcium',
      zwaarte: 'overwegen',
      reden: 'Zuivel is in Nederland de grootste calciumbron. Verrijkte '
        + 'plantaardige varianten en groene groente kunnen het overnemen, maar '
        + 'niet vanzelf.',
      grond: uitgezet(v, ZUIVEL[0]!) || uitgezet(v, ZUIVEL[1]!)
        ? 'Je hebt zuivel uitgezet in Wat je lust.'
        : `Je logde de laatste ${VENSTER_DAGEN} dagen niets uit "Melk en melkproducten" of "Kaas".`,
      bron: 'Gezondheidsraad, Voedingsnormen calcium en vitamine D.',
    })
  }

  return uit
}

/**
 * Wat de log níét kon zeggen.
 *
 * Los van de lijst, en dat is met opzet. Dit stond eerst alleen bij een lége
 * lijst, en toen liet een schermproef zien wat daar mis mee was: wie
 * veganistisch eet en drie dagen logt krijgt B12 en ijzer te zien — die hangen
 * aan zijn eetpatroon — en hoort niets over vis. Hij leest dat als "vis is in
 * orde", terwijl de app het simpelweg niet kan zien.
 *
 * Dus staat het er altijd als er te weinig gelogd is, ook onder een gevulde
 * lijst. Zwijgen over wat je niet weet is hier hetzelfde als iets beweren.
 */
export function teWeinigGelogd(v: Suppletievraag): string | null {
  if (genoegGelogd(v)) return null
  return `Er is ${v.dagenGelogd} van de ${VENSTER_DAGEN} dagen gelogd. Vanaf `
    + `${GENOEG_DAGEN} dagen kan de app ook zien welke hoeken je overslaat; tot dan `
    + 'zou dat een uitspraak over je invoer zijn en niet over je voeding.'
}
