/**
 * WAT ER THUIS INGESPROKEN KAN WORDEN
 *
 * Voor de soera's komt het geluid uit de meegeleverde recitatie. Voor de zinnen
 * van het gebed en de du'a's bestaat zoiets niet; die spreekt een ouder of de
 * imam één keer in. Een kind hoort dan de uitspraak van thuis in plaats van een
 * stem uit de telefoon.
 */
import { HIFZ, DUAS } from './gegevens/hifz'
import { T } from './gegevens/teksten'
import { NAAST } from './gegevens/gebed'
import { BIJZONDER, ROUW } from './gegevens/bijzonder'

export interface Opnamestuk { id: string; ar: string; tr: string; w: string }
export interface Opnamegroep { g: string; klein?: string; items: Opnamestuk[] }

const regels = (id: string, naam: string): Opnamestuk[] => {
  const h = HIFZ.find((x) => x.id === id)
  return h
    ? h.r.map((r, i) => ({ id: `q:${h.id}:${i + 1}`, ar: r[0], tr: r[1], w: `${naam} · regel ${i + 1}` }))
    : []
}

const uitT = (sleutel: string, w: string): Opnamestuk[] => {
  const t = T[sleutel]
  return t ? [{ id: t.aid ?? `t:${sleutel}`, ar: t.ar, tr: t.tr, w }] : []
}

export function opnameGroepen(): Opnamegroep[] {
  const uit: Opnamegroep[] = [
    { g: 'Voor het gebed', items: regels('h-iqama', 'Iqama') },
    {
      g: 'De zinnen in het gebed',
      items: [
        ...uitT('takbir', 'De takbir'),
        ...regels('h-dhikr', 'Buiging en knieval'),
        ...regels('h-tashahhud', 'Tashahhud'),
        ...regels('h-salawat', 'Salawat'),
        ...regels('h-dua-salam', "Du'a vóór de slotgroet"),
        ...uitT('salam', 'De slotgroet'),
        ...uitT('qunut', 'De qunut (lang)'),
        ...uitT('amin', 'Amin'),
      ],
    },
    { g: 'Na het gebed', items: regels('h-nagebed', 'Na het gebed') },
    {
      g: 'Naast de volgorde',
      klein: 'Niet in het verplichte gebed van deze school, wel goed om te kennen.',
      items: NAAST.flatMap((x) => uitT(x.zeg, x.t)),
    },
    {
      g: 'De bijzondere gebeden',
      klein: 'Het feest, een overlijden, een keuze, droogte. Ze komen zelden langs — juist daarom is het fijn als ze klaarstaan.',
      items: BIJZONDER.flatMap((b) => b.zeg.flatMap((k) => uitT(k, b.n))),
    },
    {
      g: 'Rond een overlijden',
      klein: 'De zinnen die je op dat moment niet wilt opzoeken.',
      items: ROUW.flatMap((r) => (r.zeg ?? []).flatMap((k) => uitT(k, r.t))),
    },
    {
      g: "De du'a's van de dag",
      items: DUAS.map((d, i) => ({ id: `d:${i + 1}`, ar: d.ar, tr: d.tr, w: d.w })),
    },
  ]

  /* Sommige zinnen staan op twee plekken: zowel bij de volgorde van het gebed
     als bij wat ernaast hoort. Twee keer opnemen is zonde van de moeite, dus de
     eerste plek wint en de rest valt weg. */
  const gezien = new Set<string>()
  return uit
    .map((g) => ({ ...g, items: g.items.filter((i) => !gezien.has(i.id) && (gezien.add(i.id), true)) }))
    .filter((g) => g.items.length > 0)
}
