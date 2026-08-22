/**
 * DE WERKBANK — hier hoeft niets
 *
 * Geen opdracht, geen nakijken, geen punten. Typ wat je wilt, draai het, en
 * bewaar het als het iets werd. Dat is de plek waar het leren begint te lijken
 * op wat programmeren werkelijk is.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Editor } from '../editor'
import type { Taal } from '../gegevens/soorten'
import type { Project, Stand } from '../opslag'
import { Kader, Melding } from '../onderdelen'

const TALEN: Array<[Taal, string]> = [['py', 'Python'], ['js', 'JavaScript'], ['html', 'HTML']]

const VOORBEELD: Record<Taal, string> = {
  py: '# Typ hier wat je wilt en druk op Uitvoeren.\nprint("Hallo Amine")\n',
  js: '// Typ hier wat je wilt.\nconsole.log("Hallo Amine");\n',
  html: '<h1>Mijn pagina</h1>\n<p>Typ hier wat je wilt.</p>\n',
}

interface Props {
  stand: Stand
  nu: string
  zet: (f: (s: Stand) => Stand) => void
  naarBouwbank: () => void
}

export function Werkbank({ stand, nu, zet, naarBouwbank }: Props): ReactNode {
  const [taal, zetTaal] = useState<Taal>('py')
  const [naam, zetNaam] = useState('')
  const [bericht, zetBericht] = useState('')

  const sleutel = 'bank-' + taal
  const code = stand.code[sleutel] ?? VOORBEELD[taal]
  const zetCode = (c: string): void =>
    zet((s) => ({ ...s, code: { ...s.code, [sleutel]: c } }))
  const invoer = stand.code['bankin'] ?? ''
  const zetInvoer = (v: string): void =>
    zet((s) => ({ ...s, code: { ...s.code, bankin: v } }))

  const bewaarProject = (): void => {
    const p: Project = {
      id: 'p' + Date.now(), naam: naam.trim() || 'Naamloos', taal, code, d: nu,
    }
    zet((s) => ({ ...s, projecten: [...s.projecten, p] }))
    zetNaam('')
    zetBericht('Bewaard.')
  }

  return (
    <>
      <div>
        <h1>De werkbank</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          Hier hoeft niets. Typ wat je wilt, draai het, en bewaar het als het iets werd.
        </p>
      </div>

      <div className="card">
        <div className="rij tussen">
          <h3>Vrij programmeren</h3>
          <div className="rij">
            {TALEN.map(([t, n]) => (
              <button
                key={t}
                className={`btn sm ${taal === t ? '' : 'ghost'}`}
                onClick={() => zetTaal(t)}
              >{n}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Editor
            key={taal}
            taal={taal}
            code={code}
            zetCode={zetCode}
            begin={VOORBEELD[taal]}
            {...(taal === 'py' ? { invoer, zetInvoer } : {})}
          />
        </div>
        <div className="rij" style={{ marginTop: 12 }}>
          <button className="btn ghost sm" onClick={bewaarProject}>Bewaren als project</button>
          <input
            placeholder="naam van je project"
            value={naam}
            onChange={(e) => zetNaam(e.target.value)}
            style={{
              flex: 1, minWidth: 160, padding: '9px 12px', border: '1px solid var(--line)',
              borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)',
              fontFamily: 'var(--sans)',
            }}
          />
        </div>
        <Melding tekst={bericht} soort="goed" />
      </div>

      <div className="card kleur">
        <h3>🧰 De bouwbank</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Een pc samenstellen binnen een budget, met controle of alles past en een schatting
          van je fps.
        </p>
        <div className="rij" style={{ marginTop: 12 }}>
          <button className="btn" onClick={naarBouwbank}>Openen</button>
        </div>
      </div>

      {stand.projecten.length > 0 ? (
        <div className="card">
          <h3>Je projecten</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {stand.projecten.slice().reverse().map((p) => (
              <div className="card plat" key={p.id}>
                <div className="rij tussen">
                  <div><b>{p.naam}</b><div className="klein">{p.taal} · {p.d}</div></div>
                  <div className="rij">
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        zetTaal(p.taal as Taal)
                        zet((s) => ({ ...s, code: { ...s.code, ['bank-' + p.taal]: p.code } }))
                      }}
                    >Openen</button>
                    <button
                      className="icoon"
                      title="Weggooien"
                      onClick={() => zet((s) => ({
                        ...s, projecten: s.projecten.filter((x) => x.id !== p.id),
                      }))}
                    >🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Kader kop="Nog geen projecten">
          Alles wat je hier bewaart komt in dit lijstje te staan. Drie eigen projecten leveren
          een insigne op.
        </Kader>
      )}
    </>
  )
}
