/**
 * HUISWERK — oefenen voor school, voor vier kinderen tegelijk
 *
 * Van groep 4 tot 4 vwo in één app. Wat een kind ziet hangt af van zijn
 * profiel: de vakken, het thema (voetbal of niet), en of er zakgeld tegenover
 * staat. Wat ze delen is de motor: Leitner voor het herhalen, een
 * nauwkeurigheidspoort voor de beloning, en een ranglijst waarin punten al
 * meeschalen met moeilijkheid — anders zou vier kinderen naast elkaar zetten
 * oneerlijk zijn.
 *
 * De scores volgen het kind en niet het toestel. Wie op de telefoon van zijn
 * broer oefent, ziet zijn eigen punten.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { PROFIELEN } from './gegevens/profielen'
import { KINDEREN, useHuiswerk } from './toestand'
import { schoonVoortgang, leegVoortgang } from './opslag'
import type { Stand } from './opslag'
import { ECHT } from './toeval'
import { stemKlaarzetten } from './geluid'
import { verwerkAntwoord, verwerkToets } from './uitslag'
import {
  familieAanmaken, familieBewaren, familieInloggen, familieOphalen, kindAanmelden, kindBewaren,
} from './wolk'
import { themaVan, Thuis } from './schermen/Thuis'
import { Inloggen } from './schermen/Inloggen'
import { Vakken } from './schermen/Vakken'
import { Oefenen } from './schermen/Oefenen'
import { Ouder } from './schermen/Ouder'
import { Formules, Leertips } from './schermen/Naslag'
import { WedstrijdMaken, WedstrijdSpelen } from './schermen/Wedstrijd'

type Zicht = 'thuis' | 'inloggen' | 'vakken' | 'oefenen' | 'ouder' | 'formules' | 'leertips'
  | 'wedstrijd-maken' | 'wedstrijd-spelen'

export function App(): ReactNode {
  const t = useHuiswerk()
  const [zicht, zetZicht] = useState<Zicht>('thuis')
  const [pid, zetPid] = useState<string | null>(null)
  const [wachtPid, zetWachtPid] = useState<string | null>(null)
  const [vak, zetVak] = useState('')
  const [onderwerp, zetOnderwerp] = useState('')
  const [jaar, zetJaar] = useState('nu')
  const [wedstrijd, zetWedstrijd] = useState<string | null>(null)

  useEffect(() => { stemKlaarzetten() }, [])

  /* Een wedstrijdlink (#w=CODE) opent meteen de uitdaging — de vriend die hem
     krijgt heeft geen profiel in deze app en hoort er ook niet doorheen. */
  useEffect(() => {
    const m = /[#&]w=([a-z0-9]+)/i.exec(location.hash || '')
    if (m?.[1]) { zetWedstrijd(m[1]); zetZicht('wedstrijd-spelen') }
  }, [])

  const prog = pid ? schoonVoortgang(t.stand.prog[pid]) : null

  const naarOnderwerp = useCallback((onderw: string, jr = 'nu'): void => {
    zetOnderwerp(onderw)
    zetJaar(jr)
    zetZicht('oefenen')
    scrollTo({ top: 0 })
  }, [])

  const openProfiel = (id: string): void => {
    t.openKind(id)
    zetPid(id)
    zetVak(PROFIELEN[id]?.vakken[0] ?? '')
    zetZicht('vakken')
    scrollTo({ top: 0 })
  }

  const wolk = {
    status: t.wolkmelding,
    meld: t.zetWolkmelding,
    koppelen: async (code: string, wachtwoord: string): Promise<void> => {
      t.zetWolkmelding('Bezig met koppelen…')
      await familieAanmaken(code, wachtwoord, t.stand)
      t.zet((s) => ({ ...s, cloud: { household: code, pin: wachtwoord, lastServer: null, lastSync: Date.now() } }))
      t.zetWolkmelding('Gekoppeld! Resultaten staan nu in de cloud ✓')
    },
    inloggen: async (code: string, wachtwoord: string): Promise<void> => {
      t.zetWolkmelding('Bezig met inloggen…')
      const samen = await familieInloggen(code, wachtwoord, t.stand, KINDEREN)
      t.zet(() => samen)
      t.zetWolkmelding('Ingelogd — samengevoegd ✓')
    },
    gelijktrekken: async (): Promise<void> => {
      t.zetWolkmelding('Bezig met samenvoegen…')
      const samen = await familieOphalen(t.stand, KINDEREN)
      if (!samen) { t.zetWolkmelding('Koppel eerst een familiecode.'); return }
      t.zet(() => samen)
      await familieBewaren(samen)
      t.zetWolkmelding('Alles samengevoegd — elk toestel toont nu dezelfde score ✓')
    },
    uploaden: async (): Promise<void> => {
      await familieBewaren(t.stand)
      t.zetWolkmelding('Opgeslagen in de cloud ✓')
    },
    ontkoppelen: (): void => {
      t.zet((s) => ({ ...s, cloud: { household: '', pin: '', lastServer: null, lastSync: null } }))
      t.zetWolkmelding('Ontkoppeld (alleen nog lokaal).')
    },
  }

  /* Alles op nul. Ook de familiekoppeling gaat eraf: anders komen de oude
     scores via "hoogste wint" gewoon weer terug. */
  const reset = (): void => {
    t.zet((s): Stand => {
      const prg: Stand['prog'] = {}
      for (const k of KINDEREN) prg[k] = schoonVoortgang(leegVoortgang())
      return {
        ...s, prog: prg, games: {},
        cloud: { household: '', pin: '', lastServer: null, lastSync: null },
      }
    })
    /* En daarna leeg naar elk kind-account, zodat het daar ook weg is. */
    setTimeout(() => { for (const k of KINDEREN) void kindBewaren(t.stand, k) }, 250)
  }

  if (zicht === 'wedstrijd-spelen' && wedstrijd) {
    return (
      <WedstrijdSpelen
        code={wedstrijd} geluid={t.stand.geluid}
        terug={() => {
          try { history.replaceState(null, '', location.href.split('#')[0]) } catch { /* oude browser */ }
          zetWedstrijd(null)
          zetZicht('thuis')
        }}
      />
    )
  }

  if (zicht === 'inloggen' && wachtPid) {
    return (
      <Inloggen
        pid={wachtPid} stand={t.stand}
        terug={() => { zetWachtPid(null); zetZicht('thuis') }}
        aanmelden={async (id, code, pw) => {
          const samen = await kindAanmelden(t.stand, id, code, pw)
          t.zet((s) => ({ ...s, prog: { ...s.prog, [id]: samen } }))
        }}
        ok={() => { const id = wachtPid; zetWachtPid(null); openProfiel(id) }}
      />
    )
  }

  if (zicht === 'formules') return <Formules terug={() => zetZicht('thuis')} />
  if (zicht === 'leertips') return <Leertips terug={() => zetZicht('thuis')} />

  if (zicht === 'ouder') {
    return (
      <Ouder
        stand={t.stand} alle={t.alle} nuMs={Date.now()} terug={() => zetZicht('thuis')}
        zet={t.zet} zetKind={t.zetKind} wolk={wolk} reset={reset}
        ververs={t.haalKinderen}
        alleOnline={async () => {
          let ok = 0
          for (const k of KINDEREN) {
            const samen = await kindBewaren(t.stand, k)
            if (samen) { t.zet((s) => ({ ...s, prog: { ...s.prog, [k]: samen } })); ok++ }
          }
          return ok
        }}
      />
    )
  }

  if (zicht === 'wedstrijd-maken' && pid) {
    return (
      <WedstrijdMaken
        pid={pid} alle={t.alle} toeval={ECHT} geluid={t.stand.geluid}
        terug={() => zetZicht('vakken')}
      />
    )
  }

  if (zicht === 'vakken' && pid && prog) {
    return (
      <Vakken
        pid={pid} prog={prog} alle={t.alle} vak={vak} thema={themaVan(pid)} nuMs={Date.now()}
        weektaak={t.stand.weektaak[pid]?.items ?? []}
        wedstrijdAan={t.stand.wedstrijdAan !== false}
        spelNaDoel={t.stand.spelNaDoel === true}
        zetVak={zetVak}
        terug={() => { zetPid(null); zetZicht('thuis') }}
        naarOnderwerp={naarOnderwerp}
        zetDoel={(n) => t.zetKind(pid, (pr) => ({ ...pr, goal: n }))}
        zetNiveau={(n) => t.zetKind(pid, (pr) => ({ ...pr, niveau: n }))}
        naarWedstrijd={() => zetZicht('wedstrijd-maken')}
        naarSpellen={() => { location.href = '/spellen/' }}
      />
    )
  }

  if (zicht === 'oefenen' && pid && prog) {
    return (
      <Oefenen
        pid={pid} vak={vak} onderwerp={onderwerp} jaar={jaar} alle={t.alle} prog={prog}
        thema={themaVan(pid)} geluid={t.stand.geluid} voorlezen={t.stand.voorlezen} toeval={ECHT}
        terug={() => zetZicht('vakken')}
        naarOnderwerp={naarOnderwerp}
        opUitslag={(kaart, beurt, goed, hint) => t.zetKind(pid, (pr) =>
          verwerkAntwoord(pr, { kaart, beurt, goed, hintGebruikt: hint }, new Date()))}
        opToets={(isProef, pct) => t.zetKind(pid, (pr) =>
          verwerkToets(pr, isProef, pct, new Date()))}
      />
    )
  }

  return (
    <Thuis
      stand={t.stand} alle={t.alle} nuMs={Date.now()}
      kies={(id) => { zetWachtPid(id); zetZicht('inloggen') }}
      naarOuder={() => zetZicht('ouder')}
      naarFormules={() => zetZicht('formules')}
      naarLeertips={() => zetZicht('leertips')}
      naarSpellen={() => { location.href = '/spellen/' }}
      zetGeluid={(aan) => t.zet((s) => ({ ...s, geluid: aan }))}
      zetVoorlezen={(aan) => t.zet((s) => ({ ...s, voorlezen: aan }))}
    />
  )
}
