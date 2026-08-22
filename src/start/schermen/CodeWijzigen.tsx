/**
 * JE EIGEN CODE WIJZIGEN
 *
 * Dit ontbrak overal. Raakte je een wachtwoord kwijt, dan was er letterlijk geen
 * weg terug behalve iemand met toegang tot de database.
 */
import { useState } from 'react'
import { Codekaart, Melding } from '../onderdelen'
import type { Ik } from '../sessie'
import { lidCode } from '@/gedeeld/db/bennahub'

export function CodeWijzigen({ ik, naarHub }: { ik: Ik; naarHub: () => void }) {
  const [oud, zetOud] = useState('')
  const [een, zetEen] = useState('')
  const [twee, zetTwee] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [goed, zetGoed] = useState(false)
  const [bezig, zetBezig] = useState(false)

  async function doe() {
    if (een.length < 4) {
      zetGoed(false)
      zetMelding('Het nieuwe wachtwoord moet minstens vier tekens zijn.')
      return
    }
    if (een !== twee) { zetGoed(false); zetMelding('De twee vakjes zijn niet gelijk.'); return }
    zetBezig(true)
    try {
      await lidCode(ik.naam, oud, een)
      zetGoed(true)
      zetMelding('Gelukt. Onthoud hem goed.')
    } catch (e) {
      zetBezig(false)
      zetGoed(false)
      zetMelding(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="wrap" style={{ paddingTop: 34 }}>
      <Codekaart kleur={ik.kleur}>
        <div className="groot">{ik.emoji}</div>
        <h2 style={{ marginTop: 16 }}>Je wachtwoord wijzigen</h2>
        <p className="klein" style={{ marginTop: 8 }}>
          Je huidige wachtwoord is genoeg; je hebt er niemand anders bij nodig. Nu staat iedereen nog
          op hetzelfde — zet hier je eigen.
        </p>
        <input type="password" placeholder="huidig wachtwoord" autoComplete="current-password"
               value={oud} onChange={(e) => zetOud(e.target.value)} />
        <input type="password" placeholder="nieuw wachtwoord" autoComplete="new-password"
               value={een} onChange={(e) => zetEen(e.target.value)} />
        <input type="password" placeholder="nog een keer" autoComplete="new-password"
               value={twee} onChange={(e) => zetTwee(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') void doe() }} />
        <button type="button" className="btn vol" disabled={bezig || goed} onClick={() => void doe()}>
          {goed ? 'Opgeslagen' : 'Opslaan'}
        </button>
        <Melding tekst={melding} goed={goed} />
        <div className="rij" style={{ justifyContent: 'center', marginTop: 18 }}>
          <button type="button" className="btn ghost sm" onClick={naarHub}>← Terug</button>
        </div>
      </Codekaart>
    </div>
  )
}
