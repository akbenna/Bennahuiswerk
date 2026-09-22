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
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { norm } from '@/huiswerk/nakijken'

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

/**
 * EN DE REST VAN DE REPO
 *
 * Het begon bij de schermen, ging door de lesteksten en eindigde bij het
 * commentaar, de SQL, de opmaak, de cursuspagina's en de handleidingen. Wat
 * hieronder staat is de eenvoudigste vorm van dezelfde regel: het teken komt
 * nergens meer voor, behalve op de vier plekken waar het er hoort.
 *
 * WAT ER WÉL MAG, EN WAAROM
 *
 * `gereedschap/oud/` is het archief van de oude HTML-pagina's waaruit de zes
 * leer-apps zijn overgezet. Daar staat de tekst zoals hij wás. Dat archief
 * bijwerken om een proef groen te krijgen zou het bewijsstuk vervalsen, dus
 * blijft het zoals het is.
 *
 * De gouden waarden zijn uit dat archief gedraaid en dragen daarom diezelfde
 * oude tekst. Ze worden sinds deze naloop op hun wóórden vergeleken; zie
 * `woordgelijk.ts`.
 *
 * En deze twee proeven noemen het teken omdat ze erover gaan.
 */
describe('nergens anders in de repo', () => {
  const MAG = [
    'gereedschap/oud/',
    'gouden-waarden.json',
    'src/gedeeld/schermtekst.proef.ts',
    'src/gedeeld/woordgelijk.proef.ts',
    /* Bestand 50 is een verslag: het legt vast wat er op 22 september 2026 in
       de database stond, en `kal_prikkel_bouwen` zette daar een streepje in de
       onderwerpsregel van elke prikkelmail. Die tekst moet tot op het teken
       kloppen, want de md5-controle vergelijkt hem met `prosrc`.

       Dus dezelfde regel als bij het archief hierboven, en om dezelfde reden:
       bewijsmateriaal wordt niet aangepast om een proef groen te krijgen. De
       fout zelf is rechtgezet in bestand 51, dat dubbele punten zet en het
       teken alleen omschrijft. Deze proef viel op allebei die bestanden om en
       deed daarmee precies wat hij moet doen. */
    'health/database/50-de-negen-die-er-nog-niet-stonden.sql',
  ]

  /* Twee plekken hébben het teken nodig en staan er tóch niet bij: de reguliere
     expressie in `huiswerk/nakijken.ts` die min-tekens gelijktrekt, en regel 8
     van de systeemprompt in `health/edge/kal-ai.ts` die het model verbiedt het
     te gebruiken. Allebei schrijven het als `\u2014`: hetzelfde teken zodra het
     draait, maar niet in de bron. Zo hoeft er geen bestand uitgezonderd te
     worden, en blijft de regel hieronder scherp over die hele bestanden. */

  it('staat het teken alleen nog in het archief en in deze twee proeven', () => {
    /* `git grep` en niet een eigen wandeling door de mappen: dan telt precies
       wat er in versiebeheer staat, en niet wat er toevallig in node_modules
       of in een bouwmap ligt. */
    let regels: string[] = []
    try {
      regels = execFileSync('git', ['grep', '-I', '-l', EM], { encoding: 'utf8' })
        .split('\n').filter(Boolean)
    } catch (e) {
      /* Niets gevonden is bij git grep een foutstatus en geen fout. */
      if ((e as { status?: number }).status !== 1) throw e
    }
    expect(regels.filter((p) => !MAG.some((m) => p.includes(m)))).toEqual([])
  })

  /* DE FOUT DIE DIT BIJNA HAD GEMIST
     In `huiswerk/nakijken.ts` stond het streepje in een reguliere expressie die
     min-tekens gelijktrekt: `/[\u2212\u2013\u2014]/`. Dat is geen tekst maar
     code, en de opruiming maakte er een komma van. Twee proeven vielen om en
     dat was geluk, geen ontwerp: een streepje in code is noch een tekst noch
     commentaar, en geen van beide regels hierboven keek ernaar. */
  it('trekt alle drie de streepjes nog gelijk bij het nakijken', () => {
    expect(norm('\u2212 5')).toBe(norm('-5'))
    expect(norm('\u2013 5')).toBe(norm('-5'))
    expect(norm('\u2014 5')).toBe(norm('-5'))
  })
})
