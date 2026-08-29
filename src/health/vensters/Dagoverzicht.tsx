/**
 * DE DAG IN DETAIL
 *
 * Het dagscherm is een samenvatting: vier vakken, een totaal per vak, en per
 * regel een naam met calorieën. Dat is met opzet weinig — je opent de app om te
 * loggen, niet om te lezen.
 *
 * Maar soms wil je wél weten waarom er 2.140 kcal staat. Dan is elk getal een
 * vraag: waar komt het vandaan, hoe zeker is het, welke portie was dat ook
 * alweer, en wat is er precies geschat. Dat antwoord past niet in een tegel van
 * vier kolommen breed, en het hoort er ook niet in — dan zou de tegel elke dag
 * onleesbaar zijn voor het geval je het een keer wilt weten.
 *
 * Dus staat het hier, achter één tik, en staat het er dan ook volledig.
 *
 * WAT DIT SCHERM ANDERS DOET DAN DE REST
 *
 * Het rekent niets zelf. Alles komt uit `overzicht.ts`, en dat is de plek waar
 * de sommen bewezen zijn. Hier staat alleen hoe het eruitziet.
 *
 * En het durft te zeggen wat het niet weet. Staan er regels zonder eiwitwaarde
 * in, dan zegt het macrovak dat het totaal een ondergrens is. Een dag waarin de
 * helft van de eiwitwaarden ontbreekt en waar toch "82 g" boven staat is erger
 * dan geen getal: je gaat erop sturen.
 */
import { Chip, Kaart, Kop, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import { dz } from '@/gedeeld/getal'
import { langNL } from '@/gedeeld/datum'
import type { IsoDatum, Moment, Regel } from '@/gedeeld/db/tabellen'
import type { Analyse, DagMetTotalen } from '../rekenkern'
import { dagoverzicht, portietekst } from '../overzicht'
import type { Macrosom } from '../overzicht'
import { Bron } from '../herkomst'

const NAAM: Record<Moment, string> = {
  ontbijt: 'Ontbijt', lunch: 'Lunch', diner: 'Diner',
  tussendoor: 'Tussendoor', onbekend: 'Tussendoor',
}
const KLEUR: Record<Moment, string> = {
  ontbijt: 'ochtend', lunch: 'middag', diner: 'avond',
  tussendoor: 'tussen', onbekend: 'tussen',
}

export function DagoverzichtVenster(
  { datum, regels, dag, a, opSluiten }:
  {
    datum: IsoDatum
    regels: Regel[]
    dag: DagMetTotalen
    a: Analyse
    opSluiten: () => void
  },
) {
  const o = dagoverzicht(regels)

  return (
    <Venster titel={langNL(datum)} opSluiten={opSluiten}>
      <Kaart plat style={{ marginTop: 10 }}>
        <Tussen>
          <Kop>De hele dag</Kop>
          {o.aantal > 0 && (
            <span className="mini">
              {o.gemeten} van {o.aantal} op een tabelwaarde
            </span>
          )}
        </Tussen>

        <p style={{ marginTop: 6 }}>
          <span className="getal" style={{ fontSize: '1.5rem' }}>{dz(Math.round(o.totaal.kcal))}</span>
          <span className="klein"> kcal</span>
          {o.aantal > 0 && (
            <span className="mini cijfer" style={{ marginLeft: 8 }}>
              {dz(Math.round(o.totaal.laag))}–{dz(Math.round(o.totaal.hoog))}
            </span>
          )}
        </p>

        {a.doel != null && o.aantal > 0 && (
          <p className="mini" style={{ marginTop: 4 }}>
            {o.totaal.kcal > a.doel
              ? <>Dat is <b>{dz(Math.round(o.totaal.kcal - a.doel))}</b> boven je doel
                  van {dz(a.doel)} kcal.</>
              : <>Nog <b>{dz(Math.round(a.doel - o.totaal.kcal))}</b> kcal tot je doel
                  van {dz(a.doel)}.</>}
            {/* Alleen als het model een interval heeft. Zonder die twee zou hier
                "tussen — en —" staan, en dat is een zin die niets zegt. */}
            {a.laag != null && a.hoog != null && (
              <> Je doel ligt zelf tussen {dz(Math.round(a.laag))} en{' '}
                {dz(Math.round(a.hoog))} kcal verbruik.</>
            )}
          </p>
        )}

        <div className="macros" style={{ marginTop: 10 }}>
          <Macrovak naam="Eiwit" klas="eiwit" som={o.totaal.eiwit} doel={a.eiwitDoel} />
          <Macrovak naam="Koolhydraten" klas="koolh" som={o.totaal.koolhydraat} doel={null} />
          <Macrovak naam="Vet" klas="vet" som={o.totaal.vet} doel={null} />
        </div>
        {o.totaal.vezel.gram > 0 && (
          <p className="mini" style={{ marginTop: 8 }}>
            Vezel: <span className="cijfer">{Math.round(o.totaal.vezel.gram)}</span> g
            {o.totaal.vezel.ontbreekt > 0 && ` — van ${o.aantal - o.totaal.vezel.ontbreekt} van de `
              + `${o.aantal} regels bekend`}
          </p>
        )}
      </Kaart>

      {o.aantal === 0 ? (
        <p className="klein" style={{ marginTop: 12 }}>
          Op deze dag is niets gelogd. Er valt dus ook niets uit te splitsen — dat is geen fout van
          de app, alleen een lege dag.
        </p>
      ) : (
        o.vakken.filter((v) => v.regels.length > 0).map((v) => (
          <Kaart plat key={v.moment} style={{ marginTop: 12 }}>
            <Tussen>
              <Kop>
                <span className={'dagstip ' + KLEUR[v.moment]} /> {NAAM[v.moment]}
              </Kop>
              <span className="cijfer klein">
                {dz(Math.round(v.kcal))} kcal
                <span className="mini"> ({dz(Math.round(v.laag))}–{dz(Math.round(v.hoog))})</span>
              </span>
            </Tussen>
            <div className="lijst" style={{ marginTop: 6 }}>
              {v.regels.map((r) => <Regeldetail key={r.id} r={r} />)}
            </div>
          </Kaart>
        ))
      )}

      <Kaart plat style={{ marginTop: 12 }}>
        <Kop>Buiten het eten om</Kop>
        <p className="mini" style={{ marginTop: 6 }}>
          {dag.gewicht_kg != null
            ? <>Gewogen: <span className="cijfer">{dag.gewicht_kg}</span> kg</>
            : 'Niet gewogen.'}
          {dag.stappen != null && <> · <span className="cijfer">{dz(dag.stappen)}</span> stappen</>}
          {dag.slaap_min != null && (
            <> · <span className="cijfer">{Math.round(dag.slaap_min / 6) / 10}</span> uur slaap</>
          )}
          {dag.kracht && ' · krachttraining'}
        </p>
        <p className="mini" style={{ marginTop: 6 }}>
          Deze drie tellen niet mee in het doel hierboven. Wat ze doen, doen ze via de weegschaal.
        </p>
      </Kaart>

      <Uitleg id="overzicht-band" label="waarom de band zo breed is">
        <p>
          De band van de dag is de som van de banden van de regels, niet de wortel daarvan. Dat is
          breder, en het is het eerlijke antwoord: schat het model porties structureel te ruim, dan
          doet het dat de hele dag, en dan mogen de fouten elkaar niet wegstrepen op papier.
        </p>
        <p>
          Regels met het teken ◆ staan op een gemeten waarde uit de voedingsmiddelentabel; ◇ is een
          schatting. Hoe zeker een regel is staat links in de letter A tot D.
        </p>
      </Uitleg>
    </Venster>
  )
}

/**
 * Eén regel, uitgeklapt.
 *
 * De onzekerheidsbronnen staan er letterlijk zoals ze bij het opslaan
 * opgeschreven zijn. Dat is het hele punt van dit scherm: niet een oordeel over
 * hoe zeker het is, maar de zinnen waarop dat oordeel rust.
 */
function Regeldetail({ r }: { r: Regel }) {
  const portie = portietekst(r)
  return (
    <div>
      <Chip graad={r.conf} />
      <span className="groei">
        <span style={{ fontSize: '.88rem', display: 'block' }}>{r.naam}</span>
        <span className="mini" style={{ display: 'block' }}>
          {portie && <>{portie} · </>}<Bron regel={r} />
        </span>
        <span className="mini" style={{ display: 'block' }}>
          {macrozin(r)}
        </span>
        {r.onzekerheidsbronnen?.map((b, i) => (
          <span className="mini" style={{ display: 'block' }} key={i}>· {b}</span>
        ))}
      </span>
      <span style={{ textAlign: 'right' }}>
        <span className="cijfer" style={{ fontSize: '.88rem', display: 'block' }}>
          {dz(Math.round(r.kcal_punt))}
        </span>
        {r.kcal_laag != null && r.kcal_hoog != null && (
          <span className="mini cijfer" style={{ whiteSpace: 'nowrap' }}>
            {dz(Math.round(r.kcal_laag))}–{dz(Math.round(r.kcal_hoog))}
          </span>
        )}
      </span>
    </div>
  )
}

/** De macro's van één regel, of niets als er niets van bekend is. */
function macrozin(r: Regel): string {
  const delen: string[] = []
  if (r.eiwit_g != null) delen.push(`${Math.round(r.eiwit_g)} g eiwit`)
  if (r.koolhydraat_g != null) delen.push(`${Math.round(r.koolhydraat_g)} g koolhydraat`)
  if (r.vet_g != null) delen.push(`${Math.round(r.vet_g)} g vet`)
  return delen.join(' · ')
}

function Macrovak(
  { naam, klas, som, doel }:
  { naam: string; klas: string; som: Macrosom; doel: number | null },
) {
  const deel = doel != null && doel > 0 ? Math.min(100, (som.gram / doel) * 100) : 0
  return (
    <div className={'macro ' + klas}>
      <div className="mini">{naam}</div>
      <div>
        <b>{Math.round(som.gram)}</b>
        <span className="mini"> {doel != null ? `/ ${doel} g` : 'g'}</span>
      </div>
      {doel != null && <div className="staaf"><i style={{ width: `${deel}%` }} /></div>}
      {som.ontbreekt > 0 && (
        <div className="mini" style={{ marginTop: 3 }}>
          ondergrens: {som.ontbreekt} regel{som.ontbreekt === 1 ? '' : 's'} zonder waarde
        </div>
      )}
    </div>
  )
}
