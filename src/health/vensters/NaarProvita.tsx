/**
 * De vraag die verschijnt als ProVita Care deze app opent om je gegevens op te
 * halen. Waarom het zo werkt en niet met een koppeling: `../naarprovita.ts`.
 *
 * Het scherm vraagt, en doet niets uit zichzelf. Nee betekent dat er niets
 * gebeurt; het venster mag dan gewoon dicht.
 */
import { useState } from 'react'
import { Kaart, Knop, Rij } from '../onderdelen/basis'
import { roep } from '@/gedeeld/db/rpc'
import { vandaag } from '@/gedeeld/datum'
import { stuurNaarProvita, vraagtNaarProvita } from '../naarprovita'

type Stand = 'vraag' | 'bezig' | 'verstuurd' | 'download' | 'nee'

export function NaarProvita({ token }: { token: string }) {
  const [stand, zetStand] = useState<Stand>(() =>
    (vraagtNaarProvita(window.location.search) ? 'vraag' : 'nee'))
  const [fout, zetFout] = useState<string | null>(null)
  const [bestand, zetBestand] = useState<unknown>(null)

  if (stand === 'nee') return null

  const stuur = async () => {
    zetStand('bezig')
    zetFout(null)
    try {
      const uit = await roep('kal_exporteren', { p_token: token })
      zetBestand(uit)
      const opener = window.opener as Window | null
      zetStand(stuurNaarProvita(opener, uit) ? 'verstuurd' : 'download')
    } catch (e) {
      zetFout(e instanceof Error ? e.message : String(e))
      zetStand('vraag')
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(bestand, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `bennahealth-${vandaag()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Kaart style={{ marginBottom: 12 }}>
      {stand === 'vraag' || stand === 'bezig' ? (
        <>
          <p style={{ fontWeight: 600 }}>ProVita Care vraagt om je gegevens</p>
          <p className="mini" style={{ marginTop: 4 }}>
            Wat je hier hebt vastgelegd (eten, wegingen, metingen) gaat naar je programma bij ProVita
            Care. Daar zie je eerst wat er meekomt en beslis je nog een keer. Je behandelaar kan het
            daarna zien. Wat een model hier voor je schatte, komt daar zonder getal binnen.
          </p>
          {fout && <p className="mini" style={{ color: 'var(--let)', marginTop: 6 }}>{fout}</p>}
          <Rij style={{ marginTop: 10 }}>
            <Knop vol uit={stand === 'bezig'} opKlik={() => void stuur()}>Ja, stuur naar ProVita</Knop>
            <Knop uit={stand === 'bezig'} opKlik={() => zetStand('nee')}>Nee</Knop>
          </Rij>
        </>
      ) : stand === 'verstuurd' ? (
        <>
          <p style={{ fontWeight: 600 }}>Verstuurd naar het venster van ProVita</p>
          <p className="mini" style={{ marginTop: 4 }}>
            Ga terug naar ProVita Care om te bekijken wat er meekomt. Dit venster mag dicht. Kwam er
            daar niets aan, dan kun je het bestand ook zelf meenemen.
          </p>
          <Rij style={{ marginTop: 10 }}>
            <Knop opKlik={download}>Bestand downloaden</Knop>
            <Knop opKlik={() => zetStand('nee')}>Sluiten</Knop>
          </Rij>
        </>
      ) : (
        <>
          <p style={{ fontWeight: 600 }}>Het venster van ProVita is niet bereikbaar</p>
          <p className="mini" style={{ marginTop: 4 }}>
            Dat gebeurt als deze app als losse app op je telefoon staat. Download het bestand en lees
            het in ProVita in bij Voeding, Mijn gegevens.
          </p>
          <Rij style={{ marginTop: 10 }}>
            <Knop vol opKlik={download}>Bestand downloaden</Knop>
            <Knop opKlik={() => zetStand('nee')}>Sluiten</Knop>
          </Rij>
        </>
      )}
    </Kaart>
  )
}
