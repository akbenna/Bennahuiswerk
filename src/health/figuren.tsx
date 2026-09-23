/**
 * DE FIGUREN
 *
 * Drie SVG's, met de hand getekend en zonder grafiekbibliotheek. Dat is geen
 * zuinigheid: elke bibliotheek die dit zou kunnen weegt meer dan de hele app en
 * geen enkele tekent standaard wat hier nodig is, een interval naast een
 * formuleschatting, een weeglijn met de losse metingen eronder, en staven die
 * van kleur wisselen op een drempel die iets betekent.
 *
 * Overgezet uit intervalSVG(), gewichtSVG() en innameSVG() in de oude
 * index.html; de coördinaten zijn ongewijzigd.
 */
import { dec, dz } from '@/gedeeld/getal'
import { kortNL } from '@/gedeeld/datum'
import type { Analyse, Trendpunt } from './rekenkern'
import { VENSTER } from './rekenkern'

/** Het gemeten interval, met de formuleschatting er grijs achter. */
export function IntervalFiguur({ a }: { a: Analyse }) {
  if (a.laag == null || a.hoog == null || a.tdee == null) return null
  const min = Math.min(a.laag, a.doel ?? a.laag, a.priorLaag) - 200
  const max = Math.max(a.hoog, a.priorHoog) + 200
  const p = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <>
      <svg
        className="fig" viewBox="0 0 100 18" preserveAspectRatio="none"
        style={{ height: 48, marginTop: 10 }} role="img"
        aria-label={`Interval ${Math.round(a.laag)} tot ${Math.round(a.hoog)} kcal, doel ${a.doel ?? '–'}`}
      >
        <rect x={p(a.priorLaag)} y={7.5} width={p(a.priorHoog) - p(a.priorLaag)} height={3}
              fill="var(--dim)" opacity={0.28} />
        <line x1={0} y1={9} x2={100} y2={9} stroke="var(--lijn)" strokeWidth={0.35} />
        <rect x={p(a.laag)} y={4} width={p(a.hoog) - p(a.laag)} height={10} fill="var(--k)" opacity={0.2} />
        <line x1={p(a.laag)} y1={4} x2={p(a.laag)} y2={14} stroke="var(--k)" strokeWidth={0.4} />
        <line x1={p(a.hoog)} y1={4} x2={p(a.hoog)} y2={14} stroke="var(--k)" strokeWidth={0.4} />
        <line x1={p(a.tdee)} y1={2} x2={p(a.tdee)} y2={16} stroke="var(--ink)" strokeWidth={0.7} />
        {a.doel != null && (
          <line x1={p(a.doel)} y1={2} x2={p(a.doel)} y2={16} stroke="var(--let)" strokeWidth={0.7} />
        )}
      </svg>
      {/* DE LEGENDA STOND OP DEZELFDE REGEL ALS DE SCHAAL

          Drie dingen in één flexregel: het laagste getal links, het hoogste
          rechts, en daartussen "grijs = formuleschatting · zwart = meting ·
          oranje = doel". Die middelste brak op een telefoon over twee regels en
          liep dan dwars door de getallen heen.

          Nu twee regels, en de legenda toont de kleuren in plaats van ze te
          benoemen. Een vlakje voor de band, een streepje voor de lijn: dezelfde
          vorm als in de figuur, zodat je hem terugvindt in plaats van moet
          onthouden welk woord bij welke kleur hoort. */}
      <div className="tussen mini cijfer" style={{ marginTop: 2 }}>
        <span>{dz(Math.round(min))}</span>
        <span>{dz(Math.round(max))}</span>
      </div>
      <div className="figlegenda mini">
        <span><i style={{ background: 'var(--dim)', opacity: 0.4 }} /> formuleschatting</span>
        <span><i className="staand" style={{ background: 'var(--ink)' }} /> meting</span>
        {a.doel != null && (
          <span><i className="staand" style={{ background: 'var(--let)' }} /> doel</span>
        )}
      </div>
    </>
  )
}

/**
 * DE AS SCHAALT OP DE REEKS EN NIET OP DE UITSCHIETER
 *
 * Eén weging van 190,2 in een reeks rond de 118 liet de as tot 191 lopen en
 * drukte tweeëntwintig echte wegingen samen tot een streepje van vier punten
 * hoog. Die figuur was letterlijk waar en tegelijk onbruikbaar: je zag alleen
 * nog de fout.
 *
 * De weging wordt niet weggelaten, want deze app gooit geen metingen weg. Hij
 * komt terug als `buitenBeeld` en wordt op de rand getekend, gemarkeerd en met
 * zijn eigen getal erbij. Dat is het verschil tussen een meting verzwijgen en
 * hem niet de hele figuur laten bepalen.
 *
 * WAAROM HET GEMIDDELDE WÉL MEETELT VOOR DE AS
 *
 * Dat is de uitkomst van het model en niet de meting. Bij een weging die zeventig
 * kilo te hoog is loopt de lijn met alfa 0,1 een paar kilo mee omhoog, en dat
 * hóórt zichtbaar te zijn: anders lijkt de trend kalmer dan hij is en zou de
 * figuur de fout verbergen die de tekst eronder juist benoemt.
 *
 * Blijft er na het weglaten te weinig over om op te schalen, dan gebeurt er
 * niets bijzonders en schaalt de figuur op alles. Een reeks van twee wegingen
 * waarvan er één afwijkt heeft geen "rest" om je op te richten.
 */
export function gewichtSchaal(
  reeks: readonly Trendpunt[],
): { lo: number; hi: number; buitenBeeld: Trendpunt[] } {
  const alles = [...reeks.map((x) => x.w), ...reeks.map((x) => x.ema)]
    .filter((v): v is number => v != null)
  const opSchaal = [
    ...reeks.filter((x) => !x.uitbijter).map((x) => x.w),
    ...reeks.map((x) => x.ema),
  ].filter((v): v is number => v != null)
  const genoeg = opSchaal.length >= 2
  const waarden = genoeg ? opSchaal : alles
  const lo = Math.min(...waarden) - 0.8
  const hi = Math.max(...waarden) + 0.8
  /* Een gemarkeerde weging die toevallig binnen de uitsnede valt, hoort gewoon
     als punt op zijn plek: op de rand zetten zou liegen over waar hij ligt. */
  const buitenBeeld = genoeg
    ? reeks.filter((x) => x.uitbijter && x.w != null && (x.w < lo || x.w > hi))
    : []
  return { lo, hi, buitenBeeld }
}

/** Losse wegingen als punten, het voortschrijdend gemiddelde als lijn. */
export function GewichtFiguur(
  { reeks, doelGewicht }: { reeks: readonly Trendpunt[]; doelGewicht: number | null },
) {
  const punten = reeks.filter((x) => x.w != null)
  if (punten.length < 1) {
    return (
      <p className="klein" style={{ marginTop: 8 }}>
        Nog geen weging. Zodra er drie staan, verschijnt hier een lijn.
      </p>
    )
  }
  const teWeinig = punten.length < 3
  const W = 330, H = 140, L = 32, B = 18

  const { lo, hi, buitenBeeld } = gewichtSchaal(reeks)
  /* Bij een smalle as zegt afronden op hele kilo's niets: drie lijnen kregen
     dan twee keer hetzelfde getal. */
  const decim = hi - lo < 3 ? 1 : 0
  const doelInBeeld = doelGewicht != null && doelGewicht > lo && doelGewicht < hi
  const X = (i: number) => (reeks.length < 2 ? (L + W) / 2 : L + (i / (reeks.length - 1)) * (W - L - 4))
  const Y = (v: number) => H - B - ((v - lo) / (hi - lo || 1)) * (H - B - 10)
  const pad = reeks.map((x, i) => (x.ema != null ? `${X(i)},${Y(x.ema)}` : null))
    .filter(Boolean).join(' ')
  const eerste = reeks[0], laatste = reeks[reeks.length - 1]

  return (
    <>
      <svg className="fig" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }} role="img"
           aria-label="Gewicht per dag">
        {[0, 0.5, 1].map((f) => {
          const v = lo + (hi - lo) * f
          return (
            <g key={f}>
              <line x1={L} y1={Y(v)} x2={W} y2={Y(v)} stroke="var(--lijn)" strokeWidth={1} />
              <text x={0} y={Y(v) + 3.5} fontSize={9.5} fill="var(--grijs)"
                    fontFamily="ui-monospace,monospace">
                {v.toFixed(decim).replace('.', ',')}
              </text>
            </g>
          )
        })}
        {doelInBeeld && doelGewicht != null ? (
          <>
            <line x1={L} y1={Y(doelGewicht)} x2={W} y2={Y(doelGewicht)} stroke="var(--let)"
                  strokeWidth={1} strokeDasharray="3 3" />
            <text x={W} y={Y(doelGewicht) - 4} fontSize={9.5} fill="var(--let)" textAnchor="end">
              doel {doelGewicht}
            </text>
          </>
        ) : doelGewicht != null ? (
          /* De regel stond rechtsboven en zei altijd "onder", ook als het doel
             er juist bóven lag. Nu staat hij aan de kant waar het doel ligt, en
             zegt hij welke kant dat is. Rechtsboven botste hij bovendien met
             het getal van een weging die op de rand staat. Onder de as, naast de
             datumregel, want daar ligt het doel ook: buiten beeld. */
          <text x={W} y={doelGewicht > hi ? 10 : H - 4} fontSize={9} fill="var(--grijs)"
                textAnchor="end">
            doel {doelGewicht} kg ligt {doelGewicht > hi ? 'boven' : 'onder'} deze uitsnede
          </text>
        ) : null}
        {reeks.map((x, i) =>
          x.w != null && !buitenBeeld.includes(x)
            ? <circle key={x.d} cx={X(i)} cy={Y(x.w)} r={2} fill="var(--dim)" />
            : null)}
        {/* De weging die buiten de uitsnede valt: op de rand, met een ring
            eromheen zodat hij niet voor een gewone meting wordt aangezien, en
            met zijn eigen getal erbij. Zonder dat getal zou de rand suggereren
            dat hij er net buiten ligt. */}
        {buitenBeeld.map((x) => {
          const i = reeks.indexOf(x)
          const boven = x.w! > hi
          const y = boven ? 10 : H - B
          const naarLinks = X(i) > W - 46
          return (
            <g key={'uit-' + x.d}>
              <circle cx={X(i)} cy={y} r={3.4} fill="none" stroke="var(--let)" strokeWidth={1.6} />
              <line x1={X(i)} y1={boven ? y + 4 : y - 4} x2={X(i)} y2={boven ? y + 9 : y - 9}
                    stroke="var(--let)" strokeWidth={1.2} strokeDasharray="2 2" />
              <text x={naarLinks ? X(i) - 6 : X(i) + 6} y={y + 3.5} fontSize={9}
                    fill="var(--let)" textAnchor={naarLinks ? 'end' : 'start'}>
                {dec(x.w!, 1)}
              </text>
            </g>
          )
        })}
        {pad && (
          <polyline points={pad} fill="none" stroke="var(--k)" strokeWidth={2.2} strokeLinejoin="round" />
        )}
        {eerste && (
          <text x={L} y={H - 4} fontSize={9.5} fill="var(--grijs)">{kortNL(eerste.d)} –</text>
        )}
        {laatste && (
          <text x={L + 34} y={H - 4} fontSize={9.5} fill="var(--grijs)">{kortNL(laatste.d)}</text>
        )}
      </svg>
      {teWeinig && (
        <p className="mini" style={{ marginTop: 6 }}>
          {punten.length === 1 ? 'Eén weging' : `${punten.length} wegingen`}, nog {3 - punten.length}{' '}
          voordat er een lijn te trekken valt, en zeven voordat de helling meer is dan ruis.
        </p>
      )}
    </>
  )
}

/** Gelogde energie per dag; oranje onder 1.200 kcal. */
export function InnameFiguur({ reeks, doel }: { reeks: readonly Trendpunt[]; doel: number | null }) {
  const s = reeks.slice(-VENSTER)
  if (!s.length) return null
  const W = 330, H = 118, L = 32, B = 15
  const top = Math.max(2600, ...s.map((x) => x.kcal ?? 0)) * 1.06
  const Y = (v: number) => H - B - (v / top) * (H - B - 8)
  const bw = Math.max(2.5, (W - L - 4) / s.length - 2)
  const eerste = s[0], laatste = s[s.length - 1]

  return (
    <svg className="fig" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }} role="img"
         aria-label="Gelogde energie per dag">
      {[0, 1300, 2600].map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={W} y2={Y(v)} stroke="var(--lijn)" strokeWidth={1} />
          <text x={0} y={Y(v) + 3.5} fontSize={9.5} fill="var(--grijs)"
                fontFamily="ui-monospace,monospace">{v}</text>
        </g>
      ))}
      {s.map((x, i) =>
        x.kcal ? (
          <rect key={x.d} x={L + (i / s.length) * (W - L - 4)} y={Y(x.kcal)} width={bw}
                height={H - B - Y(x.kcal)} rx={1.5}
                fill={x.kcal < 1200 ? 'var(--let)' : 'var(--k)'} opacity={0.85} />
        ) : null)}
      <line x1={L} y1={Y(1200)} x2={W} y2={Y(1200)} stroke="var(--let)" strokeWidth={1}
            strokeDasharray="2 3" />
      {doel != null && (
        <>
          <line x1={L} y1={Y(doel)} x2={W} y2={Y(doel)} stroke="var(--k)" strokeWidth={1.2}
                strokeDasharray="4 3" />
          <text x={W} y={Y(doel) - 3} fontSize={9.5} fill="var(--k)" textAnchor="end">
            doel {dz(doel)}
          </text>
        </>
      )}
      {eerste && <text x={L} y={H - 3} fontSize={9.5} fill="var(--grijs)">{kortNL(eerste.d)}</text>}
      {laatste && (
        <text x={W} y={H - 3} fontSize={9.5} fill="var(--grijs)" textAnchor="end">
          {kortNL(laatste.d)}
        </text>
      )}
    </svg>
  )
}

/** Eén regel met een label en een getal, zoals in de drie- en tweekolomsblokken. */
export function Cijfer(
  { label, waarde, onder }: { label: string; waarde: string; onder?: string },
) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="getal" style={{ fontSize: '1.35rem', marginTop: 4 }}>{waarde}</div>
      {onder && <div className="mini">{onder}</div>}
    </div>
  )
}

export { dec, dz }

/**
 * TWEE GETALLEN DIE ELKAAR OVERSCHRIJVEN ZIJN ÉÉN ONLEESBAAR GETAL
 *
 * Bij een klein verschil staan de twee stippen van de risicoband vlak bij
 * elkaar, en dan schuiven hun percentages over elkaar heen. De stippen blijven
 * staan waar ze horen, want die dragen de betekenis; alleen de bijschriften
 * worden uit elkaar geduwd, en elk de kant op waar hij toch al stond.
 *
 * Staat er geen tweede stip, dan is er niets te duwen. En geen van beide
 * bijschriften loopt de figuur uit: aan de randen houdt het duwen op.
 */
export const LABELRUIMTE = 38

export function uitElkaar(
  nu: number, straks: number | null, breedte: number, ruimte = LABELRUIMTE,
): { nu: number; straks: number } {
  const binnen = (x: number) => Math.max(13, Math.min(breedte - 13, x))
  if (straks == null) return { nu: binnen(nu), straks: 0 }
  const duw = Math.max(0, (ruimte - Math.abs(nu - straks)) / 2)
  const naarRechts = nu >= straks
  return {
    nu: binnen(nu + (naarRechts ? duw : -duw)),
    straks: binnen(straks + (naarRechts ? -duw : duw)),
  }
}

/**
 * DE RISICOBAND: waar je staat, waar je heen zou gaan, en waar de grenzen liggen
 *
 * Een percentage zegt weinig zonder zijn grenzen. Twee procent is laag bij een
 * vijftiger en matig bij een veertiger, want NHG-CVRM legt de grens anders. Op
 * het scherm stond dat woord er wel ("laag risico volgens NHG-CVRM") maar niet
 * de afstand tot de volgende grens, en dat is juist wat een gesprek stuurt.
 *
 * Deze band zet ze naast elkaar: de drie zones in hun kleur, de twee grenzen met
 * hun getal, waar je nu staat, en waar het scenario je brengt. De kleur is niet
 * die van deze app maar die van de richtlijn: groen, oranje en rood staan voor
 * laag, matig en hoog zoals NHG-CVRM ze noemt, en de grenzen komen uit dezelfde
 * functie die de klasse bepaalt. Zie `score2Grenzen` voor waarom dat één bron is.
 *
 * WAT DE BAND ERBIJ TEKENT
 *
 * De onzekerheid van het scenario, als een lichtere balk rond de nieuwe stip.
 * De schatting van wat gewichtsverlies met je bloeddruk doet heeft een marge, en
 * een stip zonder die marge belooft een precisie die er niet is.
 *
 * WAT ER NIET IN ZIT
 *
 * Geen pijl die "goed zo" zegt en geen kleur die de app zelf kiest. De zones
 * zijn de zones van de richtlijn; wat jouw plek erin betekent, hoor je van je
 * huisarts.
 */
export function Risicoband(
  { nu, straks, laagste, hoogste, matig, hoog }:
  {
    nu: number
    straks?: number | undefined
    laagste?: number | undefined
    hoogste?: number | undefined
    matig: number
    hoog: number
  },
) {
  const W = 330, H = 62
  const top = Math.max(hoog * 1.2, nu * 1.15, (straks ?? 0) * 1.15, (hoogste ?? 0) * 1.1)
  const X = (v: number) => Math.max(0, Math.min(W, (v / top) * W))
  const Y = 30, HOOG = 13

  const label = uitElkaar(X(nu), straks == null ? null : X(straks), W)

  return (
    <svg className="fig" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8 }} role="img"
         aria-label={straks == null
           ? `Risico ${dec(nu, 1)} procent, grenzen ${dec(matig, 1)} en ${dec(hoog, 1)}`
           : `Risico van ${dec(nu, 1)} naar ${dec(straks, 1)} procent, `
             + `grenzen ${dec(matig, 1)} en ${dec(hoog, 1)}`}>
      {/* De drie zones van de richtlijn. */}
      <rect x={0} y={Y} width={X(matig)} height={HOOG} fill="var(--goed)" opacity={0.3} rx={2} />
      <rect x={X(matig)} y={Y} width={X(hoog) - X(matig)} height={HOOG} fill="var(--let)"
            opacity={0.3} />
      <rect x={X(hoog)} y={Y} width={W - X(hoog)} height={HOOG} fill="var(--fout)"
            opacity={0.3} rx={2} />

      {/* De twee grenzen, met hun getal eronder. */}
      {[matig, hoog].map((g) => (
        <g key={g}>
          <line x1={X(g)} y1={Y - 2} x2={X(g)} y2={Y + HOOG + 2} stroke="var(--vlak)"
                strokeWidth={2} />
          <text x={X(g)} y={Y + HOOG + 13} fontSize={9} fill="var(--grijs)" textAnchor="middle">
            {dec(g, 1)}%
          </text>
        </g>
      ))}

      {/* De marge van het scenario: een lichtere balk onder de stippen door. */}
      {laagste != null && hoogste != null && (
        <rect x={X(laagste)} y={Y + 3} width={Math.max(1.5, X(hoogste) - X(laagste))}
              height={HOOG - 6} fill="var(--ink)" opacity={0.18} rx={2} />
      )}

      {/* En waar het scenario je brengt: dicht, en met de weg ernaartoe. */}
      {straks != null && (
        <>
          <line x1={X(nu)} y1={Y + HOOG / 2} x2={X(straks)} y2={Y + HOOG / 2}
                stroke="var(--k)" strokeWidth={2} strokeDasharray="3 2" />
          <circle cx={X(straks)} cy={Y + HOOG / 2} r={5.5} fill="var(--k)" />
          <text x={label.straks} y={Y - 7} fontSize={10} fill="var(--k)" textAnchor="middle"
                fontWeight={700}>
            {dec(straks, 1)}%
          </text>
        </>
      )}

      {/* Waar je nu staat: open, want dat is gemeten en niet gekozen. Ná de
          andere stip getekend, zodat hij er bij een klein verschil bovenop ligt
          en niet eronder verdwijnt. */}
      <circle cx={X(nu)} cy={Y + HOOG / 2} r={5} fill="var(--vlak)" stroke="var(--ink)"
              strokeWidth={2} />
      <text x={label.nu} y={Y - 7} fontSize={10} fill="var(--ink)" textAnchor="middle"
            fontWeight={600}>
        {dec(nu, 1)}%
      </text>
    </svg>
  )
}

/**
 * HET VERSCHIL TEGENOVER NUL
 *
 * Eén figuur met één vraag erin: ligt de nul binnen of buiten de band. Alles
 * eromheen is schaal.
 *
 * De nul is hier de verwachting, en er staan twee verwachtingen, dus staat er
 * geen streep maar een strookje: het stuk waar de twee modellen elkaar niet
 * raken. Wie dat als één lijn tekent, verbergt precies de onzekerheid die de
 * rest van deze kaart benoemt.
 *
 * DE KLEUR ZEGT NIET OF HET GOED NIEUWS IS
 *
 * Een verbruik dat lager uitkomt dan verwacht is lastig voor wie afvalt en
 * gunstig voor wie wil aankomen, en de app weet niet aan welke kant van die
 * twee de lezer staat. Wat de kleur wél zegt is of er iets staat: grijs zolang
 * de nul in de band valt, geaccentueerd zodra hij eruit ligt. Dat is een
 * eigenschap van de meting en geen oordeel over de lezer.
 */
export function VerschilFiguur(
  { laagste, hoogste, half, uitspraak }:
  { laagste: number; hoogste: number; half: number; uitspraak: boolean },
) {
  const van = Math.min(laagste - half, 0)
  const tot = Math.max(hoogste + half, 0)
  const rand = Math.max((tot - van) * 0.12, 25)
  const min = van - rand
  const max = tot + rand
  const p = (v: number) => ((v - min) / (max - min)) * 100
  const kleur = uitspraak ? 'var(--k)' : 'var(--dim)'

  return (
    <>
      <svg
        className="fig" viewBox="0 0 100 18" preserveAspectRatio="none"
        style={{ height: 44, marginTop: 10 }} role="img"
        aria-label={
          `Verschil ${Math.round(laagste)} tot ${Math.round(hoogste)} kcal per dag, `
          + `met een marge van ${Math.round(half)}`
        }
      >
        <line x1={0} y1={9} x2={100} y2={9} stroke="var(--lijn)" strokeWidth={0.35} />
        <rect x={p(laagste - half)} y={4} width={p(hoogste + half) - p(laagste - half)}
              height={10} fill={kleur} opacity={0.2} />
        <line x1={p(laagste - half)} y1={4} x2={p(laagste - half)} y2={14}
              stroke={kleur} strokeWidth={0.4} />
        <line x1={p(hoogste + half)} y1={4} x2={p(hoogste + half)} y2={14}
              stroke={kleur} strokeWidth={0.4} />
        <rect x={p(laagste)} y={6.5} width={Math.max(p(hoogste) - p(laagste), 0.6)} height={5}
              fill={kleur} opacity={0.75} />
        <line x1={p(0)} y1={1.5} x2={p(0)} y2={16.5} stroke="var(--ink)" strokeWidth={0.7} />
      </svg>
      <div className="tussen mini cijfer" style={{ marginTop: 2 }}>
        <span>{dz(Math.round(min))}</span>
        <span>{dz(Math.round(max))}</span>
      </div>
      <div className="figlegenda mini">
        <span><i className="staand" style={{ background: 'var(--ink)' }} /> verwacht</span>
        <span><i style={{ background: kleur, opacity: 0.8 }} /> gemeten</span>
        <span><i style={{ background: kleur, opacity: 0.25 }} /> marge</span>
      </div>
    </>
  )
}
