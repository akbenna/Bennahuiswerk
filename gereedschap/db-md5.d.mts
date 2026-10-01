/* De proef in src/ leest dit gereedschap; TypeScript heeft er dan een
   handtekening bij nodig. De uitleg staat in db-md5.mjs zelf. */
export function vingerafdruk(lijf: string): string
export function opNummer(namen: readonly string[]): string[]
export function verslagbestanden(map: string): string[]
export function functiesUitMap(map: string): Map<string, { bestand: string; md5: string }>
export function verwachtUitControle(sql: string): Map<string, { bestand: string; md5: string }>
export function blok(map: string): string
