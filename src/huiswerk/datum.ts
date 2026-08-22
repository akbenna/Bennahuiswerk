/**
 * DE DAG EN DE WEEK
 *
 * Twee dagnotaties naast elkaar, en dat is met opzet zo gebleven: `dagKort`
 * ("2026-8-9", zonder voorloopnul) staat in ieders opslag als dagstempel, en
 * `dagIso` ("2026-08-09") wordt gebruikt waar er gesorteerd of vergeleken moet
 * worden. Wie ze gelijktrekt, laat elke lopende dagreeks bij het eerstvolgende
 * gebruik afbreken.
 *
 * De klok komt als argument binnen, niet uit `new Date()` in de functie zelf.
 * Zo is een dagreeks te toetsen zonder de systeemklok te verzetten.
 */

const twee = (n: number): string => String(n).padStart(2, '0')

/** De dag zoals hij in de opslag staat: zonder voorloopnullen. */
export const dagKort = (nu: Date): string =>
  nu.getFullYear() + '-' + (nu.getMonth() + 1) + '-' + nu.getDate()

export function gisterKort(nu: Date): string {
  const d = new Date(nu.getTime())
  d.setDate(d.getDate() - 1)
  return dagKort(d)
}

/** De dag om mee te rekenen en te sorteren. */
export const dagIso = (nu: Date): string =>
  nu.getFullYear() + '-' + twee(nu.getMonth() + 1) + '-' + twee(nu.getDate())

/** Een opgeslagen dag terug naar een tijdstip. Ontbrekende delen worden 1
 *  januari 2000, zodat een kapot stempel in het verre verleden valt en niet
 *  vandaag meetelt. */
export function leesDag(s: string | null | undefined): number {
  const p = String(s ?? '').split('-').map(Number)
  return new Date(p[0] || 2000, (p[1] || 1) - 1, p[2] || 1).getTime()
}

/** De ISO-weeksleutel (jaar-week) voor het wekelijkse toernooi. */
export function weekSleutel(tijd?: number): string {
  const d = tijd === undefined ? new Date() : new Date(tijd)
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dag = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dag)
  const jaarstart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const wk = Math.ceil(((t.getTime() - jaarstart.getTime()) / 86400000 + 1) / 7)
  return t.getUTCFullYear() + '-w' + wk
}

/** Een vergelijkbaar weeknummer (jaar × 100 + week). Nodig omdat `2026-w28`
 *  lexicaal vóór `2026-w9` valt en dat de verkeerde week zou laten winnen bij
 *  het samenvoegen. */
export function weekNummer(wk: string | null | undefined): number {
  const m = /^(\d+)-w(\d+)$/.exec(wk ?? '')
  return m ? Number(m[1]) * 100 + Number(m[2]) : 0
}

/** Seconden als klokje, voor de toetstimer. */
export const mmss = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + (s < 10 ? '0' : '') + s
}
