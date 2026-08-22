/**
 * DE OEFENING
 *
 * Vijf soorten vragen door één component: kiezen, typen in het Nederlands,
 * typen in het Arabisch, een woord bouwen uit letters en een zin bouwen uit
 * woorden. Ze delen de terugkoppeling, en dat is met opzet: terugkoppeling is
 * verplicht en staat er altijd — ook bij goed, want dan bevestigt hij de
 * redenering in plaats van alleen de uitkomst.
 *
 * De component beoordeelt en toont; wat er met het oordeel gebeurt (de FSRS-
 * kaart bijwerken, punten optellen, de volgende vraag klaarzetten) hoort bij de
 * sessie eromheen en gaat via `klaar`.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Oefening } from './oefeningen'
import type { Spraak } from './spraak'
import type { Oordeel } from './fsrs'
import { antwoordKlopt, normAr } from './tekst'
import { Rijk } from './onderdelen'

/* Schermtoetsenbord. Zonder dit kan niemand op een telefoon Arabisch invoeren
   zonder eerst een systeemtoetsenbord te installeren. */
const TOETSRIJ = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ة', 'ى', 'ء', 'أ', 'إ', 'آ', 'ؤ', 'ئ',
]

function Toetsenbord({ tik }: { tik: (t: string) => void }): ReactNode {
  return (
    <div className="toetsen">
      {TOETSRIJ.map((t) => (
        <button type="button" key={t} className="toets" onClick={() => tik(t)}>{t}</button>
      ))}
      <button type="button" className="toets breed" onClick={() => tik(' ')}>spatie</button>
      <button type="button" className="toets breed" onClick={() => tik('«')}>wis</button>
    </div>
  )
}

const AR = /[؀-ۿ]/

/** Is dit stuk tekst Arabisch? Dan moet het in het Arabische lettertype. */
const isAr = (s: string): boolean => AR.test(String(s ?? ''))

interface Uitslag { goed: boolean; juist: string }

export interface OefenvakProps {
  oef: Oefening
  spraak: Spraak
  /** Mag er zelf beoordeeld worden? Alleen bij herhaling op het volwassen
   *  spoor; bij een kind levert "hoe ging dat?" vooral ruis op. */
  zelfOordeel: boolean
  /** Het oordeel: 1 is opnieuw, 3 is goed in één keer. Bij zelfbeoordeling
   *  volgt een tweede aanroep met `zelf`, en die vervángt de eerste: hij rekent
   *  vanaf dezelfde uitgangsstaat en telt niet nog een keer mee in de dag. */
  beoordeeld: (goed: boolean, oordeel: Oordeel, zelf: boolean) => void
  klaar: () => void
}

export function Oefenvak({ oef, spraak, zelfOordeel, beoordeeld, klaar }: OefenvakProps): ReactNode {
  const [waarde, zetWaarde] = useState('')
  const [bouwsel, zetBouwsel] = useState<string[]>([])
  const [gekozen, zetGekozen] = useState<number | null>(null)
  const [uitslag, zetUitslag] = useState<Uitslag | null>(null)
  const invoer = useRef<HTMLInputElement>(null)
  const doorKnop = useRef<HTMLButtonElement>(null)

  const bouwt = oef.soort === 'bouw' || oef.soort === 'bouw-zin'
  const typt = oef.soort === 'typ' || oef.soort === 'typ-ar'

  /* Bij een luistervraag hoor je het antwoord zonder dat je erom vraagt: de
     vraag ís het geluid. Even wachten, anders valt hij samen met de overgang. */
  useEffect(() => {
    if (!oef.luister) return
    const t = setTimeout(() => spraak.zeg(oef.spreekNu ?? ''), 350)
    return () => clearTimeout(t)
  }, [oef, spraak])

  useEffect(() => {
    if (oef.soort === 'typ') invoer.current?.focus()
  }, [oef])

  useEffect(() => {
    if (uitslag) doorKnop.current?.focus()
  }, [uitslag])

  const rondAf = (goed: boolean, juist: string): void => {
    if (uitslag) return
    zetUitslag({ goed, juist })
    /* In de sessie oordeelt de app zelf: goed in één keer is "goed" (3), fout
       is "opnieuw" (1). */
    beoordeeld(goed, goed ? 3 : 1, false)
  }

  const kiesOptie = (i: number): void => {
    if (uitslag) return
    zetGekozen(i)
    rondAf(i === oef.juistIndex, oef.opties?.[oef.juistIndex ?? 0] ?? '')
  }

  const controleerTyp = (opgegeven = false): void => {
    if (uitslag) return
    const juist = oef.juist ?? []
    rondAf(!opgegeven && waarde.trim() !== '' && antwoordKlopt(waarde, juist), juist[0] ?? '')
  }

  const controleerBouw = (): void => {
    if (uitslag) return
    const gemaakt = oef.soort === 'bouw-zin' ? bouwsel.join(' ') : bouwsel.join('')
    rondAf(normAr(gemaakt) === normAr(oef.doel ?? ''), oef.doel ?? '')
  }

  const spreekTekst = oef.spreekNu ?? oef.spreek ?? oef.ar ?? ''

  return (
    <div className="vraagblok">
      <Rijk className="vraagtekst" html={oef.vraag} />

      {oef.ar && !oef.luister && (
        <div className="mid" style={{ margin: '6px 0 18px' }}>
          <div className={`ar ${oef.arGroot ? 'reus' : 'groot'}`}>{oef.ar}</div>
          {spraak.beschikbaar && spreekTekst && (
            <button
              type="button" className="ikoon" onClick={() => spraak.zeg(spreekTekst)}
              aria-label="Uitspreken" title="Uitspreken"
            >🔈</button>
          )}
        </div>
      )}

      {oef.luister && (
        <div className="mid" style={{ margin: '6px 0 18px' }}>
          <button
            type="button" className="k" style={{ minWidth: 140 }}
            onClick={() => spraak.zeg(spreekTekst)}
          >🔈 Nog eens</button>
        </div>
      )}

      {oef.soort === 'kies' && (
        <div>
          {(oef.opties ?? []).map((o, i) => (
            <button
              type="button" key={i} onClick={() => kiesOptie(i)} disabled={!!uitslag}
              className={'optie' + (!uitslag ? ''
                : i === oef.juistIndex ? ' goed'
                : i === gekozen ? ' fout' : ' flauw')}
            >
              {oef.optiesArabisch ? <span className="ar">{o}</span> : o}
            </button>
          ))}
        </div>
      )}

      {typt && (
        <>
          <input
            ref={invoer}
            className={oef.soort === 'typ-ar' ? 'veld ar-in' : 'veld'}
            value={waarde}
            disabled={!!uitslag}
            dir={oef.soort === 'typ-ar' ? 'rtl' : undefined}
            autoComplete="off" autoCapitalize="off" spellCheck={false}
            placeholder={oef.soort === 'typ-ar' ? '…' : 'Typ je antwoord'}
            onChange={(e) => zetWaarde(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); controleerTyp() } }}
          />
          {oef.soort === 'typ-ar' && !uitslag && (
            <Toetsenbord tik={(t) => {
              zetWaarde((v) => (t === '«' ? v.slice(0, -1) : v + t))
              invoer.current?.focus()
            }} />
          )}
          <div className="rij" style={{ marginTop: 12 }}>
            <button type="button" className="k" disabled={!!uitslag} onClick={() => controleerTyp()}>
              Controleren
            </button>
            <button type="button" className="k stil" disabled={!!uitslag} onClick={() => controleerTyp(true)}>
              Weet ik niet
            </button>
          </div>
        </>
      )}

      {bouwt && (
        <Bouwvak
          tegels={oef.tegels ?? []} bouwsel={bouwsel} zetBouwsel={zetBouwsel}
          zin={oef.soort === 'bouw-zin'} vast={!!uitslag}
          controleer={controleerBouw}
        />
      )}

      {uitslag && (
        <div className={`terug ${uitslag.goed ? 'goed' : 'fout'}`}>
          <b>{uitslag.goed ? 'Goed' : 'Nog niet'}</b>
          {!uitslag.goed && (
            <div style={{ marginBottom: 6 }}>
              Het juiste antwoord is{' '}
              {isAr(uitslag.juist)
                ? <span className="ar klein-ar">{uitslag.juist}</span>
                : <b>{uitslag.juist}</b>}.
            </div>
          )}
          <Rijk className="uitleg" html={oef.uitleg} />
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {uitslag && (
          zelfOordeel && uitslag.goed && oef.id
            ? (
              <>
                <div className="klein muted" style={{ marginBottom: 6 }}>Hoe ging dat?</div>
                <div className="raster r3">
                  {([[2, 'Lastig'], [3, 'Goed'], [4, 'Makkelijk']] as Array<[Oordeel, string]>)
                    .map(([g, n]) => (
                      <button
                        type="button" key={g} className="k rand"
                        onClick={() => { beoordeeld(true, g, true); klaar() }}
                      >{n}</button>
                    ))}
                </div>
              </>
              )
            : (
              <button ref={doorKnop} type="button" className="k vol" onClick={klaar}>Verder</button>
              )
        )}
      </div>
    </div>
  )
}

/** Het bouwvak: tegels aantikken zet ze erin, een tegel in het vak haalt hem
 *  er weer uit. Een tegel die al gebruikt is vergrijst maar blijft staan —
 *  dezelfde letter kan twee keer in een woord voorkomen. */
export function Bouwvak(
  { tegels, bouwsel, zetBouwsel, zin, vast, controleer }:
  { tegels: string[]; bouwsel: string[]; zetBouwsel: (f: (b: string[]) => string[]) => void
    zin: boolean; vast: boolean; controleer: () => void },
): ReactNode {
  const gebruikt: Record<string, number> = {}
  for (const t of bouwsel) gebruikt[t] = (gebruikt[t] ?? 0) + 1
  const nog: Record<string, number> = {}

  return (
    <>
      <div className="bouwvak">
        {bouwsel.length
          ? bouwsel.map((t, i) => (
            <button
              type="button" key={i} className="tegel inbouw" disabled={vast}
              onClick={() => zetBouwsel((b) => b.filter((_, j) => j !== i))}
            >{t}</button>
            ))
          : (
            <span className="muted small" style={{ direction: 'ltr' }}>
              Tik de stukken in de goede volgorde aan — van rechts naar links.
            </span>
            )}
      </div>
      <div className="tegels">
        {tegels.map((t, i) => {
          nog[t] = (nog[t] ?? 0) + 1
          const op = (nog[t] ?? 0) <= (gebruikt[t] ?? 0)
          return (
            <button
              type="button" key={i} className={op ? 'tegel gebruikt' : 'tegel'} disabled={vast}
              style={zin ? { fontSize: '1.3rem', minWidth: 'auto', padding: '8px 12px' } : undefined}
              onClick={() => zetBouwsel((b) => [...b, t])}
            >{t}</button>
          )
        })}
      </div>
      <div className="rij" style={{ marginTop: 12 }}>
        <button type="button" className="k" disabled={vast} onClick={controleer}>Controleren</button>
        <button type="button" className="k stil" disabled={vast} onClick={() => zetBouwsel(() => [])}>
          Wissen
        </button>
      </div>
    </>
  )
}
