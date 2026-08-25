/**
 * BENNAHUB — de startpagina.
 *
 * Iedereen meldt zich hier. Je kiest je eigen tegel, typt je eigen code, en
 * krijgt daarna de apps te zien die voor jou bedoeld zijn. Wie ouder is, krijgt
 * er een overzicht bij: wie wat wanneer heeft gedaan, en wat er in elke app is
 * verdiend.
 *
 * De apps zelf hebben hun eigen inlog nog. Dat is met opzet: eerst deze poort
 * erbij zetten en gebruiken, daarna de apps er één voor één op aansluiten. Zo
 * werkt er onderweg niets niet meer.
 *
 * Achter de poort is dit geen lijst kaarten meer maar een werkblad: een vaste
 * zijbalk links met het merk en de weg naar alles, en rechts het onthaal met de
 * klok, de twee groepen apps en de snelkoppelingen. De zijbalk vervangt de
 * balk die hier vroeger bovenaan plakte — die zei precies hetzelfde.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { APPS } from './apps'
import type { AppTegel } from './apps'
import { Appgroep, Balk, GROEPEN, Onthaal, Snelbalk, Voet, Zijbalk } from './onderdelen'
import { Code, Kiezen, Opzetten } from './schermen/Poort'
import { Ouder } from './schermen/Ouder'
import { CodeWijzigen } from './schermen/CodeWijzigen'
import type { Ik } from './sessie'
import { meldAan, meldAf, wieBenIk, zetOuderWw } from './sessie'
import { voortgangAlles } from './voortgang'
import type { Lid } from '@/gedeeld/db/bennahub'
import { ledenLijst, overzicht } from '@/gedeeld/db/bennahub'

type Scherm =
  | { naam: 'laden' }
  | { naam: 'zonderNet'; fout: string }
  | { naam: 'opzetten' }
  | { naam: 'kiezen' }
  | { naam: 'code'; lid: Lid }
  | { naam: 'hub' }
  | { naam: 'wachtwoord' }
  | { naam: 'ouder' }

/** Een leeg lijstje bij een lid betekent "alles wat bij je rol hoort". Staat er
 *  wel iets in, dan is dat de hele lijst — zo kun je Amaani de Academie geven
 *  zonder de andere kinderen erbij. */
function zichtbareApps(wie: Ik): readonly AppTegel[] {
  if (wie.apps.length) return APPS.filter((a) => wie.apps.includes(a.id))
  return wie.rol === 'ouder' ? APPS : APPS.filter((a) => a.groep === 'kind')
}

export function App() {
  const [scherm, zetScherm] = useState<Scherm>({ naam: 'laden' })
  const [leden, zetLeden] = useState<Lid[]>([])
  const [ik, zetIk] = useState<Ik | null>(null)

  const start = useCallback(async () => {
    zetScherm({ naam: 'laden' })
    let lijst: Lid[]
    try {
      lijst = await ledenLijst()
    } catch (e) {
      zetIk(wieBenIk())
      zetScherm({ naam: 'zonderNet', fout: e instanceof Error ? e.message : String(e) })
      return
    }
    zetLeden(lijst)
    if (!lijst.length) { zetScherm({ naam: 'opzetten' }); return }
    const wie = wieBenIk()
    zetIk(wie)
    zetScherm(wie ? { naam: 'hub' } : { naam: 'kiezen' })
  }, [])

  useEffect(() => { void start() }, [start])

  useEffect(() => { scrollTo(0, 0) }, [scherm.naam])

  const afmelden = useCallback(() => {
    meldAf()
    zetIk(null)
    void start()
  }, [start])

  const naarOverzicht = useCallback(() => zetScherm({ naam: 'ouder' }), [])
  const naarWachtwoord = useCallback(() => zetScherm({ naam: 'wachtwoord' }), [])

  const balk = (breed?: boolean) =>
    ik ? (
      <Balk ik={ik} breed={breed ?? false}
            naarOverzicht={naarOverzicht}
            naarWachtwoord={naarWachtwoord}
            opAfmelden={afmelden} />
    ) : null

  /** Het werkblad: zijbalk links, wat je meegeeft rechts. Alleen de zichtbare
   *  groepen komen in het menu — wie geen apps voor de groten heeft, hoort daar
   *  ook geen regel voor te zien staan. */
  const werkblad = (lijst: readonly AppTegel[], boven?: ReactNode) => {
    const groepen = GROEPEN.filter((g) => lijst.some((a) => a.groep === g.groep))
    const standen = voortgangAlles(lijst, ik)
    return (
      <div className="hub">
        <Zijbalk ik={ik} groepen={groepen}
                 naarOverzicht={naarOverzicht}
                 naarWachtwoord={naarWachtwoord}
                 opAfmelden={afmelden} />
        <div className="romp">
          {boven}
          <main>
            {groepen.map((g) => (
              <Appgroep key={g.anker} kop={g} standen={standen}
                        lijst={lijst.filter((a) => a.groep === g.groep)} />
            ))}
            <Snelbalk />
          </main>
          <Voet />
        </div>
      </div>
    )
  }

  switch (scherm.naam) {
    case 'laden':
      return <div className="wrap poort"><p className="meta">Even kijken wie er zijn…</p></div>

    /* Zonder internet kun je niet aanmelden — de codes staan centraal. Dat is
       geen fijne boodschap, dus hij komt met een uitweg: de apps zelf werken
       offline gewoon door, dus we laten de kaarten alsnog zien met een eerlijke
       waarschuwing erboven in plaats van een doodlopende foutmelding. */
    case 'zonderNet':
      return werkblad(
        ik ? zichtbareApps(ik) : APPS,
        <header className="welkom mager" id="boven">
          <div className="welkomtekst">
            <h1>Geen verbinding</h1>
            <p className="lede">
              Aanmelden lukt nu niet — de codes staan centraal en die zijn even niet te bereiken
              ({scherm.fout}). De apps zelf werken zonder internet gewoon door; wat je doet wordt
              bewaard en later gelijkgetrokken.
            </p>
            <div className="rij">
              <button type="button" className="btn sm" onClick={() => void start()}>
                Opnieuw proberen
              </button>
            </div>
          </div>
        </header>,
      )

    case 'opzetten':
      return <Opzetten opKlaar={(ww) => { zetOuderWw(ww); void start() }} />

    case 'kiezen':
      return <Kiezen leden={leden} opKies={(lid) => zetScherm({ naam: 'code', lid })} />

    case 'code':
      return (
        <Code
          lid={scherm.lid}
          opTerug={() => zetScherm({ naam: 'kiezen' })}
          opAangemeld={async (aanmelding, code) => {
            zetIk(meldAan(aanmelding))
            /* Is dit een ouder en is zijn code ook het ouderwachtwoord, dan
               hoeft hij het voor het overzicht niet nóg een keer te typen.
               Werkt het niet, dan vraagt het overzicht er straks gewoon om. */
            if (aanmelding.rol === 'ouder') {
              try { await overzicht(code); zetOuderWw(code) } catch { /* dan straks */ }
            }
            zetScherm({ naam: 'hub' })
          }}
        />
      )

    case 'wachtwoord':
      return ik ? (
        <>
          {balk()}
          <CodeWijzigen ik={ik} naarHub={() => zetScherm({ naam: 'hub' })} />
        </>
      ) : null

    case 'ouder':
      return ik ? (
        <Ouder ik={ik} naarHub={() => zetScherm({ naam: 'hub' })}
               naarWachtwoord={naarWachtwoord}
               opAfmelden={afmelden} />
      ) : null

    case 'hub':
      if (!ik) return null
      return werkblad(
        zichtbareApps(ik),
        <Onthaal ik={ik} naarOverzicht={naarOverzicht} naarWachtwoord={naarWachtwoord} />,
      )
  }
}
