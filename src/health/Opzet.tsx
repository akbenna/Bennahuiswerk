/**
 * DE EERSTE KEER
 *
 * Een profiel klaarzetten, met of zonder de augustusreeks uit Yazio en Apple
 * Gezondheid. Overgezet uit tekenOpzet() en opzetten().
 *
 * De reeks hieronder is echte invoer uit schermafdrukken van 21 augustus 2026 en
 * geen voorbeeldgegevens. Hij staat er omdat een leeg model niets kan zeggen en
 * omdat overtypen uit een andere app anders het eerste wat je moet doen is.
 */
import { useState } from 'react'
import { Kaart, Knop, Kop, Rij, Spin } from './onderdelen/basis'
import { roep } from '@/gedeeld/db/rpc'
import type { NieuweDag, NieuweRegel } from '@/gedeeld/db/rpc'
import type { Profiel } from '@/gedeeld/db/tabellen'

const PROFIEL: Partial<Profiel> = {
  lengte_cm: 196, leeftijd_jaar: 51, geslacht: 'm',
  start_gewicht_kg: 120, doel_gewicht_kg: 100,
  tempo_pct_week: 0.7, eiwit_g_per_kg: 1.4,
  etniciteit: 'Noord-Afrikaans', fase: 'afvallen',
  instellingen: {
    olie_g: 40, olie_gewogen: false,
    melk_ml: 150, melk_soort: 'half', melk_gemeten: false,
  },
}

/** datum, stappen, actieve energie */
const DAGEN: ReadonlyArray<readonly [string, number, number]> = [
  ['2026-08-04', 8436, 1109], ['2026-08-05', 8465, 997], ['2026-08-06', 10866, 1429],
  ['2026-08-07', 13149, 1201], ['2026-08-08', 10857, 1279], ['2026-08-09', 11717, 640],
  ['2026-08-10', 5368, 259], ['2026-08-11', 1991, 80], ['2026-08-12', 4108, 141],
  ['2026-08-13', 5797, 573], ['2026-08-14', 5438, 405], ['2026-08-15', 4992, 486],
  ['2026-08-16', 4672, 386], ['2026-08-17', 9884, 912], ['2026-08-18', 2758, 221],
  ['2026-08-19', 10308, 841],
]

/** datum, kcal, koolhydraten g, eiwit g, vet g — uit de macroschermen omgerekend */
const ETEN: ReadonlyArray<readonly [string, number, number, number, number]> = [
  ['2026-08-05', 3257, 350, 147, 141], ['2026-08-06', 904, 131, 29, 29],
  ['2026-08-07', 1332, 163, 57, 50], ['2026-08-08', 2386, 227, 89, 125],
  ['2026-08-09', 2364, 278, 89, 100], ['2026-08-10', 2032, 259, 56, 86],
  ['2026-08-11', 982, 128, 52, 29], ['2026-08-13', 1602, 168, 68, 73],
  ['2026-08-14', 1668, 175, 67, 78], ['2026-08-15', 1254, 110, 75, 57],
  ['2026-08-16', 1291, 52, 84, 83], ['2026-08-17', 966, 97, 46, 44],
  ['2026-08-18', 1429, 111, 93, 68], ['2026-08-19', 1481, 107, 93, 76],
  ['2026-08-20', 1319, 132, 76, 54],
]

export function Opzet(
  { wijzig, fout }:
  { wijzig: (werk: (token: string) => Promise<unknown>) => Promise<void>; fout: string | null },
) {
  const [loopt, zetLoopt] = useState(false)

  async function zetKlaar(metReeks: boolean) {
    zetLoopt(true)
    await wijzig(async (t) => {
      await roep('kal_profiel_zetten', {
        p_token: t,
        p_patch: metReeks ? PROFIEL : {
          lengte_cm: 180, leeftijd_jaar: 40, geslacht: 'm',
          tempo_pct_week: 0.7, eiwit_g_per_kg: 1.4,
        },
      })
      if (!metReeks) return
      const dagen: NieuweDag[] = DAGEN.map(([datum, stappen, ae]) => ({
        datum, stappen, actieve_energie_kcal: ae, bron: 'apple-import',
      }))
      await roep('kal_dagen_importeren', { p_token: t, p_dagen: dagen })
      const regels: NieuweRegel[] = ETEN.map(([datum, kcal, koolh, eiwit, vet]) => ({
        datum, naam: 'Dagtotaal uit Yazio', kcal_punt: kcal,
        kcal_laag: Math.round(kcal * 0.85), kcal_hoog: Math.round(kcal * 1.45),
        eiwit_g: eiwit, vet_g: vet, koolhydraat_g: koolh,
        conf: 'D', bron: 'import',
        onzekerheidsbronnen: [
          'dagtotaal uit een andere app, niet per product terug te rekenen',
          'bovengrens ruim genomen wegens de gebruikelijke onderregistratie van twintig tot dertig procent',
        ],
      }))
      await roep('kal_regels_toevoegen', { p_token: t, p_regels: regels })
    })
    zetLoopt(false)
  }

  return (
    <>
      <header>
        <h1>Eerste keer</h1>
        <p className="sub">Er staat nog geen profiel.</p>
      </header>
      <Kaart>
        <Kop>Klaarzetten</Kop>
        <p style={{ fontSize: '.9rem', marginTop: 6 }}>
          Ik kan het profiel van Abdelkader invullen — 196 cm, 51 jaar, 120 naar 100 kg, streeftempo
          0,7 procent per week, eiwit 1,4 g/kg op gecorrigeerd gewicht — en de augustusreeks uit Yazio
          en Apple Gezondheid meteen inladen: zestien dagen stappen en actieve energie, vijftien dagen
          energie met macro's.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Wat er niet in zit, en wat het model nodig heeft: wegingen. Zonder die reeks blijft het model
          inert.
        </p>
        <Rij style={{ marginTop: 12 }}>
          <Knop vol uit={loopt} opKlik={() => void zetKlaar(true)}>
            Vul mijn profiel en de reeks in
          </Knop>
          <Knop uit={loopt} opKlik={() => void zetKlaar(false)}>Leeg beginnen</Knop>
        </Rij>
        <p className="klein" style={{ marginTop: 10, minHeight: '1.2em' }}>
          {loopt ? <><Spin /> Bezig…</> : fout}
        </p>
      </Kaart>
    </>
  )
}
