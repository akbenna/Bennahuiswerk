/**
 * DE POORT — opzetten, kiezen wie je bent, en je code typen.
 * Overgezet uit schermOpzetten(), schermKiezen() en schermCode().
 */
import { useState } from 'react'
import { Codekaart, Melding, Merk, Snelbalk, persoonKleur } from '../onderdelen'
import { hoofd, stilte } from '../opmaak'
import type { Aanmelding, Lid } from '@/gedeeld/db/bennahub'
import { gezinStart, lidAanmelden } from '@/gedeeld/db/bennahub'

/** De leden waarmee het gezin wordt opgezet als de opslag nog leeg is. De emoji
 *  en de volgorde komen uit de huiswerkapp, zodat een kind hier dezelfde bloem
 *  of bal ziet als daar. De ouders krijgen meteen het ouderwachtwoord als code;
 *  de kinderen kiezen er zelf een bij hun eerste keer. */
const BEGINLEDEN = [
  { naam: 'selma', rol: 'kind', emoji: '🌸', kleur: 'code' },
  { naam: 'amine', rol: 'kind', emoji: '⚽', kleur: 'huiswerk' },
  { naam: 'wassima', rol: 'kind', emoji: '🌱', kleur: 'islam' },
  { naam: 'amaani', rol: 'kind', emoji: '🚀', kleur: 'arabisch' },
  { naam: 'hanae', rol: 'ouder', emoji: '🌷', kleur: 'spel' },
  { naam: 'abdelkader', rol: 'ouder', emoji: '📘', kleur: 'koran' },
] as const

const fouttekst = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export function Opzetten({ opKlaar }: { opKlaar: (ouderWw: string) => void }) {
  const [een, zetEen] = useState('')
  const [twee, zetTwee] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  async function doe() {
    if (een.length < 6) { zetMelding('Het wachtwoord moet minstens 6 tekens zijn.'); return }
    if (een !== twee) { zetMelding('De twee vakjes zijn niet gelijk.'); return }
    zetBezig(true)
    zetMelding('Bezig…')
    try {
      await gezinStart(een, BEGINLEDEN)
      opKlaar(een)
    } catch (e) {
      zetBezig(false)
      zetMelding(fouttekst(e))
    }
  }

  return (
    <div className="wrap poort">
      <Codekaart>
        <Merk />
        <div className="regenboog" style={{ margin: '16px auto 0' }} />
        <h2 style={{ marginTop: 26, fontSize: '1.5rem' }}>Eén keer instellen</h2>
        <p className="klein" style={{ marginTop: 8 }}>
          Er is nog geen gezin aangemaakt. Kies een ouderwachtwoord — daarmee kom jij bij het
          overzicht van alle apps, en daarmee meld jij en Hanae je straks aan. De kinderen kiezen bij
          hun eerste keer zelf een code.
        </p>
        <input type="password" placeholder="Ouderwachtwoord (minstens 6 tekens)"
               autoComplete="new-password" value={een} onChange={(e) => zetEen(e.target.value)} />
        <input type="password" placeholder="Nog een keer" autoComplete="new-password"
               value={twee} onChange={(e) => zetTwee(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') void doe() }} />
        <button type="button" className="btn vol" disabled={bezig} onClick={() => void doe()}>
          Gezin aanmaken
        </button>
        <Melding tekst={melding} />
      </Codekaart>
    </div>
  )
}

export function Kiezen({ leden, opKies }: { leden: Lid[]; opKies: (l: Lid) => void }) {
  const tegel = (l: Lid) => (
    <button type="button" key={l.naam} className="persoon" style={persoonKleur(l.kleur)}
            onClick={() => opKies(l)}>
      <span className="gezicht">{l.emoji}</span>
      <span className="pnaam">{hoofd(l.naam)}</span>
      <span className="pmeta">
        {l.heeftCode ? stilte(l.laatstActief).tekst : 'kies een wachtwoord'}
      </span>
    </button>
  )
  return (
    <div className="wrap poort">
      <Merk />
      <div className="regenboog" />
      <p className="lede">
        Wie ben je? Alles hierachter — je lessen, je punten, je spaarpot — staat op jouw eigen naam.
      </p>
      <div className="tegels">{leden.filter((l) => l.rol === 'kind').map(tegel)}</div>
      <p className="meta" style={{ marginTop: 30 }}>Papa en mama</p>
      <div className="tegels" style={{ marginTop: 10 }}>
        {leden.filter((l) => l.rol === 'ouder').map(tegel)}
      </div>
      <Snelbalk vrij />
    </div>
  )
}

export function Code(
  { lid, opTerug, opAangemeld }:
  { lid: Lid; opTerug: () => void; opAangemeld: (a: Aanmelding, code: string) => void },
) {
  const nieuw = !lid.heeftCode
  const [code, zetCode] = useState('')
  const [code2, zetCode2] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [bezig, zetBezig] = useState(false)

  async function doe() {
    if (nieuw) {
      if (code.length < 4) { zetMelding('Minstens vier tekens.'); return }
      if (code !== code2) { zetMelding('De twee vakjes zijn niet gelijk.'); return }
    }
    zetBezig(true)
    zetMelding('Bezig…')
    try {
      opAangemeld(await lidAanmelden(lid.naam, code), code)
    } catch (e) {
      zetBezig(false)
      zetMelding(fouttekst(e))
      zetCode('')
    }
  }

  return (
    <div className="wrap poort">
      <Codekaart kleur={lid.kleur}>
        <div className="groot">{lid.emoji}</div>
        <h2 style={{ marginTop: 16, fontSize: '1.7rem' }}>Hallo {hoofd(lid.naam)}</h2>
        <p className="klein" style={{ marginTop: 8 }}>
          {nieuw
            ? 'Je bent hier voor het eerst. Verzin een wachtwoord van minstens vier tekens en onthoud het — dat heb je elke keer nodig. Vertel het aan niemand; is het toch weg, dan zet papa of mama het opnieuw open.'
            : 'Typ je wachtwoord. Hetzelfde als in de huiswerkapp.'}
        </p>
        <input type="password" autoFocus value={code} onChange={(e) => zetCode(e.target.value)}
               placeholder={nieuw ? 'nieuw wachtwoord' : 'wachtwoord'}
               autoComplete={nieuw ? 'new-password' : 'current-password'}
               onKeyDown={(e) => { if (e.key === 'Enter' && !nieuw) void doe() }} />
        {nieuw && (
          <input type="password" placeholder="nog een keer" autoComplete="new-password"
                 value={code2} onChange={(e) => zetCode2(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') void doe() }} />
        )}
        <button type="button" className="btn vol" disabled={bezig} onClick={() => void doe()}>
          {nieuw ? 'Wachtwoord kiezen en verder' : 'Verder'}
        </button>
        <Melding tekst={melding} />
        <div className="rij" style={{ justifyContent: 'center', marginTop: 18 }}>
          <button type="button" className="btn ghost sm" onClick={opTerug}>← Iemand anders</button>
        </div>
        <p className="klein" style={{ marginTop: 14 }}>
          Weet je het niet meer? Vraag papa — hij kan het openzetten zonder dat je iets kwijtraakt.
        </p>
      </Codekaart>
    </div>
  )
}
