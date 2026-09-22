/**
 * DE DATABASEGRENS, GETYPT
 *
 * Dit bestand bestaat om één soort fout onmogelijk te maken. De oude app riep
 * de database aan met handgetypte parameternamen in objectletterlijken:
 *
 *     rpc('kal_dag_zetten', { p_token: t, p_datum: d, p_patch: patch })
 *
 * Eén letter mis in `p_patch`, of een kolom die in de database een andere naam
 * krijgt, en er gebeurt niets zichtbaars: PostgREST geeft netjes 200 terug op
 * een aanroep die niets doet. Het getal blijft dan gewoon weg uit het scherm,
 * en dat merk je pas als je het mist. Achttien functies maal een handvol
 * parameters is achttien keer die kans.
 *
 * Hieronder staat elke functie één keer, met wat erin gaat en wat eruit komt,
 * overgenomen uit pg_proc op 22 augustus 2026. Vanaf hier is een verkeerde
 * parameternaam een fout bij het bouwen en niet meer een raadsel in productie.
 *
 * De vormen die de database teruggeeft staan hieronder als `interface`. Dat is
 * een belofte die TypeScript niet kan afdwingen, json is json. Waar het ertoe
 * doet staat er daarom een controle omheen; zie `kal.ts`.
 */
import type {
  Dag, EigenProduct, Graad, Inspanning, IsoDatum, Lab, Meting, Moment, Profiel,
  Recept, Regel, RegelBron, Training, Vragenlijst,
} from './tabellen'
import { verzoek } from './verbinding'

/* -------------------------------------------------------------------------- */
/*  Vormen die de database teruggeeft                                          */
/* -------------------------------------------------------------------------- */

export interface Sessie {
  token: string
  account: string
}

/**
 * Wat `kal_aanmelden` teruggeeft: een sessie, of een reden waarom niet.
 *
 * Geen exception dus, en dat is met opzet. De functie houdt een teller bij van
 * mislukte pogingen, en een exception draait de transactie terug, inclusief de
 * poging die net was vastgelegd. De rem zou daarmee nooit grijpen. Zie
 * `health/database/32-aanmelden-met-rem.sql`.
 *
 * Voor de aanroeper betekent het één ding: kijk of er een token in zit.
 */
export type Aanmelduitslag = Sessie | { fout: string }

export function isSessie(x: Aanmelduitslag): x is Sessie {
  return typeof (x as Sessie).token === 'string' && (x as Sessie).token !== ''
}

export interface Alles {
  profiel: Profiel | null
  dagen: Dag[]
  regels: Regel[]
  producten: EigenProduct[]
  recepten: Recept[]
  metingen: Meting[]
  labs: Lab[]
  vragenlijsten: Vragenlijst[]
  training: Training[]
  /* Leeg zolang de database bestand 43 nog niet gedraaid heeft: `kal_ophalen`
     stuurt de sleutel dan niet mee en `{...LEEG, ...o}` laat hem op []. */
  inspanning: Inspanning[]
}

export interface NevoTreffer {
  nevo_code: string
  naam: string
  groep: string | null
  kcal: number
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  /* Natrium in milligram, zoals het in de tabel staat. Het scherm toont zout in
     gram; die omrekening staat op één plek, in `src/health/zout.ts`.

     Optioneel, want de database geeft hem pas mee vanaf
     30-natrium-in-het-zoeken.sql. Tot dat bestand gedraaid is komt hij niet mee
     en toont het scherm een streepje, en dat is iets anders dan nul. */
  natrium_mg?: number | null
  /* True als dit product niet gevonden maar benaderd is: het woordzoeken gaf
     niets en de terugval op schrijfvarianten heeft het erbij gehaald. "Lesagna"
     komt zo bij Lasagne uit. Het scherm hoort dat te zeggen in plaats van te
     doen alsof er gewoon iets gevonden is.

     Optioneel, want de database geeft hem pas mee vanaf
     health/database/20-zoeken-met-alternatieven.sql. Draait de app tegen een
     database zonder dat bestand, dan is hij undefined en verandert er niets. */
  benadering?: boolean
}

export interface GerechtTreffer {
  id: string
  naam: string
  keuken: string | null
  omschrijving: string | null
  porties: number
  status: 'concept' | 'in_review' | 'validated' | 'rejected'
}

/**
 * Eén voorstel uit de voedingsmiddelentabel: veel eiwit per calorie, met de
 * portie erbij waarin het gewoonlijk gegeten wordt. Zie kal_eiwitrijk() en
 * health/database/23-eiwitrijk-uit-de-tabel.sql.
 *
 * `merk` is gevuld als dit een merkproduct is, en dan staat er een volledige
 * MerkTreffer in, genoeg om het portievenster mee te openen zonder nog een
 * keer de database te hoeven vragen.
 */
export interface EiwitrijkTreffer {
  herkomst: 'nevo' | 'merk'
  nevo_code: string | null
  merk: MerkTreffer | null
  naam: string
  groep: string | null
  /** De naam van de standaardportie: glas, portie, stuk, schep. */
  portie_naam: string
  portie_gram: number
  gram_laag: number
  gram_hoog: number
  /** Kilocalorieën en eiwit ván die portie, niet per honderd gram. */
  kcal: number
  eiwit_g: number
  /** Gram eiwit per kcal: dezelfde maat als de eis van de coach. */
  dichtheid: number
}

/**
 * Eén voorstel dat naar verwachting goed vult. Zie kal_verzadiging() en
 * health/database/28-wat-vult-het-best.sql.
 *
 * `score` is een VOORSPELLING uit de samenstelling en geen gemeten
 * verzadigingsindex, de drie termen komen uit de literatuur, de weging ertussen
 * is een keuze. Daarom staan de drie onderdelen er los bij: `gram_per_100kcal`
 * is een deling van twee gemeten waarden uit de tabel en verder niets, en dat is
 * het getal dat op het scherm vooropstaat.
 */
export interface VerzadigingTreffer {
  /** Een gerecht om te koken, of een product om erbij te nemen. */
  soort: 'gerecht' | 'product'
  /** Uniek binnen de lijst: het nevo_code of het dish_id. */
  sleutel: string
  nevo_code: string | null
  dish_id: string | null
  naam: string
  /** De NEVO-groep bij een product, de keuken bij een gerecht. */
  groep: string | null
  portie_naam: string
  portie_gram: number
  gram_laag: number
  gram_hoog: number
  /** Kilocalorieën ván de standaardportie. */
  kcal: number
  /** Hoeveel gram je krijgt voor honderd kilocalorieën. Gemeten. */
  gram_per_100kcal: number
  eiwit_per_100kcal: number
  vezel_per_100kcal: number
  /** Nul tot honderd. Bepaalt de volgorde; zie de waarschuwing hierboven. */
  score: number
  /** Komt dit uit een hoek waar je de laatste zestig dagen uit gegeten hebt? */
  bekend: boolean
}

export interface Zoekuitslag {
  /* Eerst, want wie 'tonijn' typt bedoelt zijn eigen salade en niet de tabel.
     Er wordt ook in de namen van de onderdelen gezocht, dus 'paprika' vindt de
     salade waar paprika in zit zonder dat dat woord in de titel staat. */
  maaltijden: Maaltijd[]
  nevo: NevoTreffer[]
  gerechten: GerechtTreffer[]
  eigen: EigenProduct[]
  /* Merkproducten staan onderaan, en dat is geen willekeur: een etiketwaarde is
     een opgave van de fabrikant met een wettelijke speelruimte van rond de
     twintig procent, terwijl NEVO in een laboratorium bepaald is. Zie
     health/database/18-merkproducten.sql. */
  merk: MerkTreffer[]
}

/** Eén merkproduct. Zie `merk_actief` en kal_merk_zoek() in de database. */
export interface MerkTreffer {
  id: string
  barcode: string
  naam: string
  merk: string | null
  groep: string | null
  kcal: number
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  /** Wat er in het pak zit. Null als de bron het niet weet. */
  verpakking_gram: number | null
  /** Wat de fabrikant een portie noemt. */
  portie_gram: number | null
  portie_naam: string | null
}

/** Eén portie van een gerecht, doorgerekend. Zie kal_gerecht() in de database. */
export interface Portie {
  id: string
  label: string
  maat: string
  icoon: string | null
  standaard: boolean
  notitie: string | null
  gram: number
  gram_laag: number
  gram_hoog: number
  kcal_punt: number
  kcal_laag: number
  kcal_hoog: number
  eiwit_g: number
  vet_g: number
  koolhydraat_g: number
  vezel_g: number
  /** Dezelfde portie mét de optionele ingrediënten. Ontbreekt als die er niet zijn. */
  met: Omit<PortieWaarden, never> | null
}

export interface PortieWaarden {
  kcal_punt: number
  kcal_laag: number
  kcal_hoog: number
  eiwit_g: number
  vet_g: number
  koolhydraat_g: number
  vezel_g: number
}

export interface Ingredientregel {
  naam: string
  categorie: string
  gram: number
  kcal: number
  vet_regel: boolean
  optioneel: boolean
  bevestigd: boolean
  gekoppeld: boolean
  notitie: string | null
  nevo_naam: string | null
}

export interface Gerecht {
  id: string
  naam: string
  keuken: string | null
  omschrijving: string | null
  recept_porties: number
  status: GerechtTreffer['status']
  beoordelaar: string | null
  beoordeeld_op: string | null
  ingredienten: number
  bevestigd: number
  ongekoppeld: number
  ongekoppeld_namen: string | null
  optioneel: number
  optioneel_namen: string | null
  vet_gram: number
  vet_soort: string | null
  totaal_gram: number
  kcal_per_100: number | null
  porties: Portie[]
  regels: Ingredientregel[]
}

export interface Huishoudmaat {
  naam: string
  meervoud: string
  gram: number
  gram_laag: number
  gram_hoog: number
  standaard: boolean
  herkomst: 'gebruikelijk' | 'nevo_maten' | 'dietist'
  dietist: boolean
}

export interface ProductMetMaten {
  nevo_code: string
  naam: string
  groep: string | null
  kcal: number
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  maten: Huishoudmaat[]
}

/**
 * EEN EIGEN MAALTIJD
 *
 * Een samengesteld gerecht dat je één keer hebt uitgezocht en daarna als één
 * regel logt. In de database zijn dit `kal_recepten` en `kal_recept_regels`;
 * wat je ermee rekent staat in src/health/maaltijd.ts.
 */

/** Eén onderdeel van een maaltijd: de momentopname van een gelogde regel. */
export interface MaaltijdRegel {
  naam: string
  hoeveelheid: number | null
  eenheid: string | null
  gram_equivalent: number | null
  kcal_punt: number
  kcal_laag: number | null
  kcal_hoog: number | null
  eiwit_g: number | null
  vet_g: number | null
  koolhydraat_g: number | null
  vezel_g: number | null
  conf: Graad
  onzekerheidsbronnen: string[] | null
  bron: RegelBron
  nevo_code: string | null
}

export interface Maaltijd {
  id: string
  naam: string
  toelichting: string | null
  /** Voor hoeveel porties de onderdelen samen staan. */
  porties: number
  /** Handmatig gezet: bovenaan in de lijst en in het zoekveld. */
  favoriet: boolean
  regels: MaaltijdRegel[]
}

/**
 * Wat er in kal_regels_toevoegen mag. Verplicht is alleen wat de tabel eist.
 *
 * De optionele velden nemen ook `null` aan en niet alleen `undefined`. Dat is
 * geen slordigheid maar de vorm van de databasefunctie: die leest elk veld met
 * `nullif(v_r->>'veld','')`, dus een uitdrukkelijke null en een ontbrekend veld
 * komen daar op hetzelfde neer. De herkenning geeft `nevo_code: null` terug
 * wanneer geen enkele tabelregel paste, en dat moet gewoon door kunnen.
 */
export interface NieuweRegel {
  datum: IsoDatum
  naam: string
  kcal_punt: number
  moment?: Moment | null
  hoeveelheid?: number | null
  eenheid?: string | null
  gram_equivalent?: number | null
  kcal_laag?: number | null
  kcal_hoog?: number | null
  eiwit_g?: number | null
  vet_g?: number | null
  koolhydraat_g?: number | null
  vezel_g?: number | null
  conf?: Graad | null
  onzekerheidsbronnen?: string[] | null
  bron?: RegelBron | null
  nevo_code?: string | null
  dish_id?: string | null
  recept_id?: string | null
  ruwe_invoer?: string | null
  ai_model?: string | null
}

/**
 * Een koppelsleutel zoals de app hem te zien krijgt: zonder de sleutel zelf.
 * Die staat als hash in de database en komt één keer terug, bij het maken.
 */
export interface Koppeling {
  id: string
  naam: string
  sleutel_begin: string
  aangemaakt_op: string
  laatst_gebruikt_op: string | null
  aantal_berichten: number
  aantal_dagen: number
  actief: boolean
}

export interface NieuweInspanning {
  datum: IsoDatum
  soort: string
  minuten: number
  intensiteit?: 'matig' | 'zwaar'
  /** true = afgeleid uit de soort. Ontbreekt hij, dan neemt de database true. */
  geschat?: boolean
  eigennaam?: string | null
  bron?: string
  tijd?: string | null
  notitie?: string | null
}

export interface NieuweDag {
  datum: IsoDatum
  stappen?: number
  actieve_energie_kcal?: number
  gewicht_kg?: number
  bron?: string
  /* Deze vier stuurt alleen de koppeling. Een work-outlijst uit een import komt
     hier niet langs maar wordt een rij in `kal_inspanning`, daar past een
     soort in, en `fiets_min` is één getal per dag zonder soort. Zie
     health/database/43 en `src/health/inspanning.ts`. */
  fiets_min?: number
  slaap_min?: number
  bedtijd?: string
  waaktijd?: string
  gewicht_bron?: string
}

/**
 * De tabellen waar kal_rij_toevoegen en kal_rij_wissen op werken.
 *
 * `recept` stond hier ook, en dat was een belofte die de database niet doet:
 * kal_rij_toevoegen kent die tak niet en zou 'Onbekende tabel recept' roepen.
 * Eigen maaltijden gaan sinds 24 augustus 2026 via kal_maaltijd_bewaren, dat
 * ook de onderdelen wegschrijft, iets wat één rij nooit had gekund.
 */
export type LosseTabel = 'product' | 'training' | 'meting' | 'lab' | 'vragenlijst'
  | 'inspanning'

/* -------------------------------------------------------------------------- */
/*  De kaart: functienaam → wat erin gaat, wat eruit komt                      */
/* -------------------------------------------------------------------------- */

export interface RpcKaart {
  /* --- BennaHealth -----------------------------------------------------
     De functies houden hun kal_-voorvoegsel. Databaseobjecten hernoemen om
     een appnaam is werk met risico en zonder opbrengst: de naam staat in
     achttien functies, vier edge functions en een pg_cron-taak. */
  kal_registreren: { in: { p_account: string; p_ww: string; p_naam: string }; uit: Sessie }
  kal_aanmelden: { in: { p_account: string; p_ww: string }; uit: Aanmelduitslag }
  /* Wachtwoord kwijt: zie health/database/33-wachtwoord-kwijt.sql. Alle drie
     geven een uitslag terug en gooien niet, om dezelfde reden als aanmelden. */
  kal_ww_wijzigen: {
    in: { p_token: string; p_oud: string; p_nieuw: string }; uit: Aanmelduitslag
  }
  kal_herstelcode_maken: {
    in: { p_token: string; p_ww: string }; uit: { code: string } | { fout: string }
  }
  /* De beheerdersweg: zie health/database/40 en 41. `kal_ben_ik_beheerder`
     bepaalt alleen of de knop er staat; de echte grens ligt in
     `kal_herstelcode_voor`, die zelf nog eens het wachtwoord vraagt. */
  kal_ben_ik_beheerder: { in: { p_token: string }; uit: { beheerder: boolean } }
  /* DE WACHTKAMER EN HET BUDGET: zie health/database/48.

     `kal_mijn_toegang` gaat over jezelf en vraagt geen beheerdersrecht. De twee
     eronder wel, en net als bij de herstelcode ligt die grens in de database:
     `kal_testers` geeft `{fout}` terug aan wie hem niet mag zien, en zegt niet
     waarom. Wat er níet in die lijst staat is even belangrijk als wat er wel in
     staat: geen gewicht, geen bloeddruk, geen labwaarde. Alleen wie er is,
     welke status hij heeft en wat hij deze maand aan AI verbruikt heeft. */
  kal_mijn_toegang: { in: { p_token: string }; uit: Toegang }
  kal_testers: { in: { p_token: string }; uit: Tester[] | { fout: string } }
  kal_tester_zetten: {
    in: {
      p_token: string; p_account: string
      p_status?: string | null; p_budget?: number | null; p_notitie?: string | null
    }
    uit: { account: string; status: string; budget: number } | { fout: string }
  }
  kal_herstelcode_voor: {
    in: { p_token: string; p_ww: string; p_account: string }
    uit: { code: string; account: string } | { fout: string }
  }
  kal_ww_herstellen: {
    in: { p_account: string; p_code: string; p_nieuw: string }; uit: Aanmelduitslag
  }
  kal_afmelden: { in: { p_token: string }; uit: null }
  kal_ophalen: { in: { p_token: string; p_vanaf?: IsoDatum }; uit: Alles }
  kal_profiel_zetten: { in: { p_token: string; p_patch: Partial<Profiel> }; uit: unknown }
  kal_dag_zetten: {
    in: { p_token: string; p_datum: IsoDatum; p_patch: Record<string, unknown> }
    uit: unknown
  }
  kal_dagen_importeren: { in: { p_token: string; p_dagen: NieuweDag[] }; uit: unknown }
  /* Een hele lijst inspanningen in één keer, de weg die het importvenster
     loopt. Een rij die er al staat wordt overgeslagen en geteld; zonder die
     regel zou twee keer dezelfde afdruk importeren de minuten verdubbelen. */
  kal_inspanning_toevoegen: {
    in: { p_token: string; p_rijen: NieuweInspanning[] }
    uit: { toegevoegd: number; overgeslagen: number }
  }
  /* De postbus voor de prikkel. De rekenkern draait in de app; de coach die 's
     middags een mail stuurt kan hem niet zelf uitrekenen zonder een tweede
     implementatie van het model, en die zouden uit elkaar gaan lopen. Dus legt
     de app zijn uitkomst neer met een tijdstempel, en zwijgt de coach zodra die
     ouder is dan twee dagen. Zie health/database/06-de-coach-prikkelt.sql. */
  kal_modelstand_zetten: {
    in: {
      p_token: string; p_doel_kcal: number | null; p_eiwit_doel_g: number | null
      p_tdee_laag: number | null; p_tdee_hoog: number | null; p_zekerheid: string
    }
    uit: null
  }
  kal_regels_toevoegen: { in: { p_token: string; p_regels: NieuweRegel[] }; uit: Regel[] }
  kal_regel_wissen: { in: { p_token: string; p_id: string }; uit: unknown }
  /* Eigen maaltijden. Bewaren vervangt een maaltijd met dezelfde naam; wissen
     raakt de gelogde geschiedenis niet, want kal_regels.recept_id is een spoor
     en geen refererende sleutel. Zie health/database/07-eigen-maaltijden.sql. */
  kal_maaltijden: { in: { p_token: string }; uit: Maaltijd[] }
  kal_maaltijd_bewaren: {
    in: {
      p_token: string; p_naam: string; p_toelichting: string | null
      p_porties: number; p_regels: MaaltijdRegel[]
    }
    uit: Maaltijd
  }
  kal_maaltijd_wissen: { in: { p_token: string; p_id: string }; uit: number }
  kal_maaltijd_favoriet: {
    in: { p_token: string; p_id: string; p_aan: boolean }
    uit: boolean
  }
  kal_rij_toevoegen: {
    in: { p_token: string; p_tabel: LosseTabel; p_rij: Record<string, unknown> }
    uit: unknown
  }
  kal_rij_wissen: { in: { p_token: string; p_tabel: LosseTabel; p_id: string }; uit: unknown }
  kal_koppeling_maken: {
    in: { p_token: string; p_naam: string }
    uit: { sleutel: string; koppeling: Koppeling }
  }
  kal_koppelingen_lijst: { in: { p_token: string }; uit: Koppeling[] }
  kal_koppeling_wissen: { in: { p_token: string; p_id: string }; uit: number }
  /* De ingang voor van buiten. De app roept hem alleen aan om een verse sleutel
     te proberen; in het gewone geval komt hij van een telefoon. */
  kal_beweging_ontvangen: {
    in: { p_sleutel: string; p_dagen: NieuweDag[] }
    uit: { dagen: number; gewicht_behouden: number; overgeslagen: number }
  }
  kal_zoeken: { in: { p_token: string; p_q: string; p_limiet?: number }; uit: Zoekuitslag }
  kal_gerecht: { in: { p_token: string; p_dish_id: string }; uit: Gerecht }
  kal_portiematen: { in: { p_token: string; p_nevo_code: string }; uit: ProductMetMaten }
  /* Uit welke NEVO-groepen er gelogd is, en op hoeveel dagen. `dagen` is het
     getal dat telt: zonder dat is een lege groepenlijst niet te lezen. Zie
     health/database/35-de-voorkeuren-in-de-lijsten.sql. */
  kal_hoeken: {
    in: { p_token: string; p_dagen?: number }
    uit: { groepen: string[]; dagen: number }
  }
  kal_eiwitrijk: {
    in: { p_token: string; p_eis: number; p_max_kcal: number; p_limiet?: number }
    uit: EiwitrijkTreffer[]
  }
  kal_verzadiging: {
    in: { p_token: string; p_max_kcal: number; p_gerechten?: number; p_producten?: number }
    uit: VerzadigingTreffer[]
  }

  /* --- de hub en de acht kinder-apps ------------------------------------ */
  bennahub_accounts: { in: { p_app: string }; uit: unknown }
  bennahub_register: {
    in: { p_app: string; p_account: string; p_pin: string; p_data: unknown }
    uit: unknown
  }
  bennahub_load: { in: { p_app: string; p_account: string; p_pin: string }; uit: unknown }
  bennahub_save: {
    in: { p_app: string; p_account: string; p_pin: string; p_data: unknown }
    uit: unknown
  }
  bennahub_wachtwoord: {
    in: { p_app: string; p_account: string; p_oud: string; p_nieuw: string }
    uit: unknown
  }
  bennahub_gezin_start: {
    in: { p_gezin: string; p_wachtwoord: string; p_leden: unknown }
    uit: unknown
  }
  bennahub_gezin_wachtwoord: {
    in: { p_gezin: string; p_oud: string; p_nieuw: string }
    uit: unknown
  }
  bennahub_leden_lijst: { in: { p_gezin: string }; uit: unknown }
  bennahub_lid_aanmelden: { in: { p_gezin: string; p_naam: string; p_code: string }; uit: unknown }
  bennahub_lid_code: {
    in: { p_gezin: string; p_naam: string; p_oud: string; p_nieuw: string }
    uit: unknown
  }
  bennahub_lid_reset: { in: { p_gezin: string; p_ouder_ww: string; p_naam: string }; uit: unknown }
  bennahub_lid_foto: {
    in: { p_gezin: string; p_naam: string; p_code: string; p_foto: string }
    uit: unknown
  }
  bennahub_lid_geboren: {
    in: { p_gezin: string; p_ouder_ww: string; p_naam: string; p_jaar: number }
    uit: unknown
  }
  bennahub_lid_zet: {
    in: {
      p_gezin: string; p_ouder_ww: string; p_naam: string; p_rol: string
      p_emoji: string; p_kleur: string; p_apps: unknown
      p_actief: boolean; p_volgorde: number
    }
    uit: unknown
  }
  bennahub_overzicht: { in: { p_gezin: string; p_ouder_ww: string }; uit: unknown }
  bennahub_fotos: { in: { p_gezin: string; p_naam: string; p_code: string }; uit: unknown }

  /* --- Huiswerk --------------------------------------------------------
     Deze functies houden hun `oefenapp_`-voorvoegsel: dat staat in de
     database, in de rijen die er al staan, en in de accountcodes van vier
     kinderen. Hernoemen om een appnaam is werk met risico en zonder
     opbrengst. Ze melden een fout net als de bennahub_-functies in het
     antwoord en niet in de statuscode, dus ze gaan via `hub()`. */
  oefenapp_register: {
    in: { p_household: string; p_pin: string; p_data: unknown }
    uit: unknown
  }
  oefenapp_load: { in: { p_household: string; p_pin: string }; uit: unknown }
  oefenapp_save: {
    in: { p_household: string; p_pin: string; p_data: unknown }
    uit: unknown
  }
  /** De wedstrijd: een vriend uitdagen via een link. */
  oefenapp_ch_create: { in: { p_code: string; p_data: unknown }; uit: unknown }
  oefenapp_ch_get: { in: { p_code: string }; uit: unknown }
  oefenapp_ch_submit: { in: { p_code: string; p_friend: unknown }; uit: unknown }
}

/**
 * De enige manier waarop deze codebase de database aanroept.
 *
 * `roep('kal_zoeken', { p_token, p_q })` levert een `Zoekuitslag` op, en
 * `roep('kal_zoeken', { p_toke: … })` compileert niet. Dat is het hele punt.
 */
export async function roep<K extends keyof RpcKaart>(
  functie: K,
  argumenten: RpcKaart[K]['in'],
): Promise<RpcKaart[K]['uit']> {
  return (await verzoek('/rest/v1/rpc/' + functie, argumenten)) as RpcKaart[K]['uit']
}

/** Wat `kal_mijn_toegang` teruggeeft. Zie `src/health/toegang.ts`. */
export interface Toegang {
  mag?: boolean
  status?: string
  reden?: string
  gebruikt?: number
  budget?: number
  uur?: number
  beheerder?: boolean
  maand_tot?: string
}

/** Eén regel uit `kal_testers`. Geen enkel gegeven uit de app zelf. */
export interface Tester {
  account: string
  naam: string | null
  status: string
  beheerder: boolean
  budget: number
  notitie: string | null
  aangemaakt_op: string
  beoordeeld_op: string | null
  maand_aanroepen: number
  maand_tokens: number
  /** Gerekend met een vast Sonnet-tarief; zie de kop van bestand 48. */
  maand_usd: number
  laatst_actief: string | null
}
