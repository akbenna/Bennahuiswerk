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
 * een belofte die TypeScript niet kan afdwingen — json is json. Waar het ertoe
 * doet staat er daarom een controle omheen; zie `kal.ts`.
 */
import type {
  Dag, EigenProduct, Graad, IsoDatum, Lab, Meting, Moment, Profiel,
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
}

export interface GerechtTreffer {
  id: string
  naam: string
  keuken: string | null
  omschrijving: string | null
  porties: number
  status: 'concept' | 'in_review' | 'validated' | 'rejected'
}

export interface Zoekuitslag {
  nevo: NevoTreffer[]
  gerechten: GerechtTreffer[]
  eigen: EigenProduct[]
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

export interface NieuweDag {
  datum: IsoDatum
  stappen?: number
  actieve_energie_kcal?: number
  gewicht_kg?: number
  bron?: string
}

/** De tabellen waar kal_rij_toevoegen en kal_rij_wissen op werken. */
export type LosseTabel = 'product' | 'training' | 'meting' | 'lab' | 'vragenlijst' | 'recept'

/* -------------------------------------------------------------------------- */
/*  De kaart: functienaam → wat erin gaat, wat eruit komt                      */
/* -------------------------------------------------------------------------- */

export interface RpcKaart {
  /* --- BennaHealth -----------------------------------------------------
     De functies houden hun kal_-voorvoegsel. Databaseobjecten hernoemen om
     een appnaam is werk met risico en zonder opbrengst: de naam staat in
     achttien functies, vier edge functions en een pg_cron-taak. */
  kal_registreren: { in: { p_account: string; p_ww: string; p_naam: string }; uit: Sessie }
  kal_aanmelden: { in: { p_account: string; p_ww: string }; uit: Sessie }
  kal_afmelden: { in: { p_token: string }; uit: null }
  kal_ophalen: { in: { p_token: string; p_vanaf?: IsoDatum }; uit: Alles }
  kal_profiel_zetten: { in: { p_token: string; p_patch: Partial<Profiel> }; uit: unknown }
  kal_dag_zetten: {
    in: { p_token: string; p_datum: IsoDatum; p_patch: Record<string, unknown> }
    uit: unknown
  }
  kal_dagen_importeren: { in: { p_token: string; p_dagen: NieuweDag[] }; uit: unknown }
  kal_regels_toevoegen: { in: { p_token: string; p_regels: NieuweRegel[] }; uit: Regel[] }
  kal_regel_wissen: { in: { p_token: string; p_id: string }; uit: unknown }
  kal_rij_toevoegen: {
    in: { p_token: string; p_tabel: LosseTabel; p_rij: Record<string, unknown> }
    uit: unknown
  }
  kal_rij_wissen: { in: { p_token: string; p_tabel: LosseTabel; p_id: string }; uit: unknown }
  kal_zoeken: { in: { p_token: string; p_q: string; p_limiet?: number }; uit: Zoekuitslag }
  kal_gerecht: { in: { p_token: string; p_dish_id: string }; uit: Gerecht }
  kal_portiematen: { in: { p_token: string; p_nevo_code: string }; uit: ProductMetMaten }

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
