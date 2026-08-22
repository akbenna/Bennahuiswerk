/**
 * DATUMS IN HELE DAGEN
 *
 * De planner rekent in dagen, niet in tijdstippen. Alles gaat via een string
 * JJJJ-MM-DD, en alleen bij het optellen gaat er een `Date` aan te pas — op
 * middernacht plaatselijk, precies zoals de oude app het deed.
 */
export const vandaag = (): string => {
  const d = new Date()
  const twee = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`
}

export const dagVerschil = (a: string, b: string): number =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 864e5)

export const plusDagen = (iso: string, n: number): string => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const twee = (x: number): string => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`
}

const NL_DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const NL_MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

/** "zaterdag 22 augustus" — zonder jaartal, want de app toont alleen dagen
 *  die binnen dit jaar vallen en het jaartal maakt de regel alleen langer. */
export function datumNL(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${NL_DAGEN[d.getDay()]} ${d.getDate()} ${NL_MAANDEN[d.getMonth()]}`
}
