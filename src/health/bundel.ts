/**
 * Voedingsregels worden per dag opgeteld en aan het dagrecord gehangen: de
 * rekenkern werkt met dagtotalen, de interface met de losse regels.
 *
 * Overgezet uit `bundelDagen()` in de oude index.html. De `+x || 0` staat er
 * nog steeds, en met reden: de database geeft numeric terug als string, en
 * `null + 0` is niet 0 maar NaN — één NaN in de reeks maakt de hele helling NaN.
 */
import type { Dag, Regel } from '@/gedeeld/db/tabellen'
import type { Dagenkaart, DagMetTotalen } from './rekenkern'

export function bundelDagen(dagen: readonly Dag[], regels: readonly Regel[]): Dagenkaart {
  const uit: Dagenkaart = {}
  for (const d of dagen) {
    uit[d.datum] = { ...d, _kcal: 0, _eiwit: 0, _laag: 0, _hoog: 0 }
  }
  for (const r of regels) {
    let d: DagMetTotalen | undefined = uit[r.datum]
    if (!d) {
      d = { datum: r.datum, gewicht_kg: null, stappen: null, _kcal: 0, _eiwit: 0, _laag: 0, _hoog: 0 }
      uit[r.datum] = d
    }
    d._kcal += Number(r.kcal_punt) || 0
    d._laag += Number(r.kcal_laag ?? r.kcal_punt) || 0
    d._hoog += Number(r.kcal_hoog ?? r.kcal_punt) || 0
    d._eiwit += Number(r.eiwit_g) || 0
  }
  return uit
}
