/**
 * WAT DE LEZER TE ZIEN KRIJGT, EN WAT NIET
 *
 * Deze proef gaat over een leesteken en niet over inhoud, en hij staat er op
 * verzoek: geen gedachtestreepjes in tekst die iemand op het scherm leest.
 *
 * Het gedachtestreepje is op zichzelf goed Nederlands. De reden dat het hier
 * weg moet is een andere: in grote hoeveelheid is het een herkenbaar spoor van
 * tekst die een taalmodel schreef, en deze app hoort eruit te zien als het werk
 * van de arts die hem maakte. Dat is geen kosmetiek. Een lezer die de vorm
 * wantrouwt, wantrouwt ook de getallen.
 *
 * WAAROM DIT MET DE PARSER VAN TYPESCRIPT GAAT EN NIET MET EEN GREP
 *
 * Alleen tekst die een gebruiker ziet telt: stringliteralen, sjabloonteksten en
 * tekst in JSX. Commentaar blijft buiten schot, want dat leest niemand buiten
 * de code.
 *
 * Dat onderscheid is met zoeken niet te maken. Een grep op het bestand keurt
 * elk commentaarblok in deze map af. Een zelfgeschreven ontleding die
 * commentaar overslaat struikelt over de apostrof: in JSX is `zo'n` gewoon
 * tekst, en een ontleding die daar een string ziet beginnen leest de rest van
 * het bestand verkeerd. Die fout heeft deze proef in zijn eerste versie ook
 * gemaakt — hij wees commentaarblokken aan als schermtekst.
 *
 * De parser van TypeScript weet het verschil wel, en hij ligt er al: de
 * edge-poort gebruikt hem om te controleren of die bestanden te lezen zijn.
 * Hier levert hij precies de drie soorten knopen die tekst dragen.
 *
 * WAT HIJ DÉKT
 *
 * Alle negen apps, want dat was de opdracht. Voor de zes leer-apps betekende
 * het meer dan opmaak: hun lesteksten hangen aan gouden waarden die uit de
 * oude HTML-pagina's gedraaid worden, en elke tekenwijziging liet die omvallen.
 * Die vinger loopt sinds deze naloop over de wóórden en niet over de
 * leestekens; zie `src/gedeeld/woordgelijk.ts` en de proef ernaast.
 *
 * Wat hij niet dekt is commentaar, en dat is met opzet. Zie hierboven.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const EM = '\u2014'

/** Elke stuk zichtbare tekst in een bestand, met het regelnummer erbij. */
export function schermteksten(pad: string, bron: string): Array<{ regel: number; tekst: string }> {
  const vel = ts.createSourceFile(pad, bron, ts.ScriptTarget.ES2022, true,
    pad.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const uit: Array<{ regel: number; tekst: string }> = []
  const loop = (k: ts.Node): void => {
    if (ts.isStringLiteral(k) || ts.isNoSubstitutionTemplateLiteral(k)
        || ts.isTemplateHead(k) || ts.isTemplateMiddle(k) || ts.isTemplateTail(k)
        || ts.isJsxText(k)) {
      uit.push({
        regel: vel.getLineAndCharacterOfPosition(k.getStart(vel)).line + 1,
        tekst: k.text,
      })
    }
    k.forEachChild(loop)
  }
  loop(vel)
  return uit
}

function bestanden(map: string): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) uit.push(...bestanden(pad))
    else if (naam.endsWith('.ts') || naam.endsWith('.tsx')) uit.push(pad)
  }
  return uit
}

describe('geen gedachtestreepjes in wat de lezer ziet', () => {
  it('nergens in een van de negen apps', () => {
    const gevonden: string[] = []
    for (const pad of bestanden('src')) {
      /* Twee bestanden noemen het teken omdat ze erover gáán. */
      if (pad.endsWith('schermtekst.proef.ts') || pad.endsWith('woordgelijk.proef.ts')) continue
      /* Geen snelle uitweg op `bron.includes(EM)`. Die stond hier en was fout:
         een bestand dat het streepje ontsnapt schrijft, als \u+2014, draagt het
         teken wél in zijn tekst maar niet in zijn bytes, en werd dus
         overgeslagen. In Sanad staan vierendertig van die ontsnappingen. */
      const bron = readFileSync(pad, 'utf8')
      for (const s of schermteksten(pad, bron)) {
        if (s.tekst.includes(EM)) gevonden.push(`${pad}:${s.regel}: ${s.tekst.trim().slice(0, 80)}`)
      }
    }
    expect(gevonden).toEqual([])
  })

  /* DE ONTLEDING ZELF GETOETST
     Zonder deze regels zou een ontleding die overal niets vindt groen staan, en
     dan toetst de regel hierboven niets. De derde is de reden dat hier een
     echte parser staat. */
  it('ziet een streepje in een string en niet een in commentaar', () => {
    const t = (b: string): string[] => schermteksten('p.tsx', b).map((x) => x.tekst)
    expect(t(`const a = 'een ${EM} streepje'`)).toEqual([`een ${EM} streepje`])
    expect(t(`/* een ${EM} streepje */ const a = 1`)).toEqual([])
    expect(t(`// een ${EM} streepje\nconst a = 1`)).toEqual([])
  })

  it('ziet tekst in JSX, want die staat tussen geen enkel aanhalingsteken', () => {
    const t = schermteksten('p.tsx', `const A = () => <p>tekst ${EM} in jsx</p>`)
    expect(t.some((x) => x.tekst.includes(EM))).toBe(true)
  })

  it("struikelt niet over een apostrof in JSX, waar zo'n geen string opent", () => {
    const bron = `const A = () => <p>zo'n dag</p>\nconst b = 'met een ${EM} erin'`
    const t = schermteksten('p.tsx', bron)
    expect(t.filter((x) => x.tekst.includes(EM))).toHaveLength(1)
  })

  it('leest een sjabloon met een waarde erin in stukken, en ziet ze alle drie', () => {
    const t = schermteksten('p.ts', 'const a = `kop ' + EM + ' ${x} ' + EM + ' staart`')
    expect(t.filter((x) => x.tekst.includes(EM))).toHaveLength(2)
  })
})
