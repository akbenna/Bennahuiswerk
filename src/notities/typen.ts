/**
 * De rijen zoals ze uit de database komen. Eén keer opgeschreven, zodat een
 * verschreven kolomnaam een fout bij het bouwen is en niet een veld dat stil
 * leeg blijft. De bron is `notities/database/01-schema.sql`.
 */

export type Status =
  | 'opname' | 'klaar_voor_verwerking' | 'transcriberen' | 'samenvatten'
  | 'gereed' | 'goedgekeurd' | 'opnieuw' | 'fout'

export type Bron = 'app' | 'upload' | 'drive'

export interface Context {
  id: string
  owner_id: string
  naam: string
  drive_folder_id: string | null
  agenda_trefwoorden: string[]
  instructie: string
  volgorde: number
}

export interface Actiepunt {
  wie: string
  wat: string
  deadline: string
  van_mij: boolean
}

/** De uitvoer van het taalmodel, zoals `worker/src/structure.js` hem vastlegt. */
export interface Samenvatting {
  titel: string
  context: string
  samenvatting: string
  deelnemers: string[]
  besluiten: string[]
  actiepunten: Actiepunt[]
  open_vragen: string[]
  mijn_vervolgstappen: string[]
}

export interface Modellen {
  transcriptie?: string[] | string
  samenvatting?: string
  bestandsnaam?: string
  drive_fout?: string
}

export interface Notitie {
  id: string
  owner_id: string
  status: Status
  bron: Bron
  context_id: string | null
  context_vast: boolean
  titel: string | null
  gestart_op: string
  duur_sec: number | null
  agenda_event_id: string | null
  agenda_titel: string | null
  deelnemers: string[]
  samenvatting: Samenvatting | null
  transcript: string | null
  drive_doc_id: string | null
  modellen: Modellen
  fout: string | null
  audio_verwijderen_na: string | null
  audio_verwijderd: boolean
}

/** Wat de lijst ophaalt; de rest blijft op de server. */
export type NotitieRegel = Pick<Notitie, 'id' | 'titel' | 'status' | 'gestart_op' | 'duur_sec' | 'context_id' | 'bron'>

export interface Actie {
  id: string
  note_id: string
  owner_id: string
  wie: string | null
  wat: string
  deadline: string | null
  van_mij: boolean
  afgerond: boolean
}

export interface Instellingen {
  owner_id: string
  mijn_naam: string
  stemreferentie_pad: string | null
  bewaartermijn_audio_dagen: number
}

export interface WerkerStatus {
  ok: boolean
  google: boolean
  gestart: string
  verwerkt: number
  fouten: number
}
