/**
 * DE LES — uitleg, zelf doen, en vragen
 *
 * De knop "Ik ben klaar" gaat pas aan als de opdracht is nagekeken én alle
 * vragen zijn beantwoord. Dat is geen pesterij: de score die eruit komt telt
 * mee in de punten, en een les die je wegklikt zonder iets te doen zou dan
 * evenveel waard zijn als een les die je maakt.
 *
 * De score is het aandeel vragen dat in één keer goed ging. Wie een vraag
 * misgokt kan hem niet nog eens proberen — het juiste antwoord staat er dan bij
 * met de uitleg erbij, en dat is waar het om gaat.
 */
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Blok, Les as Lesje, Taal } from '../gegevens/soorten'
import { Editor } from '../editor'
import type { EditorGreep, Uitkomst } from '../editor'
import { Kader, Rijk } from '../onderdelen'
import { euro } from '@/gedeeld/getal'
import { afgerond } from '../voortgang'
import type { Beloning } from '../voortgang'
import type { Stand } from '../opslag'
import type { Klok } from '../toestand'

interface Props {
  blokken: Blok[]
  bi: number
  li: number
  stand: Stand
  klok: Klok
  zet: (f: (s: Stand) => Stand) => void
  ga: (bi: number, li: number) => void
  sluit: () => void
}

const taalVan = (l: Lesje): Taal => l.opdracht?.taal ?? l.taal ?? 'py'

export function Les({ blokken, bi, li, stand, klok, zet, ga, sluit }: Props): ReactNode {
  const b = blokken[bi]
  const l = b?.lessen[li]
  const [af, zetAf] = useState<Beloning | null>(null)
  if (!b || !l) return null
  if (af) {
    return <Klaar {...{ blokken, bi, li, les: l, blok: b, beloning: af, stand, ga, sluit }} />
  }
  return (
    <Werken
      key={l.id}
      {...{ blokken, bi, li, blok: b, les: l, stand, klok, zet, ga, sluit }}
      opAf={zetAf}
    />
  )
}

function Werken({
  blok, les, bi, li, blokken, stand, klok, zet, ga, sluit, opAf,
}: Props & { blok: Blok; les: Lesje; opAf: (b: Beloning) => void }): ReactNode {
  const taal = taalVan(les)
  const vragen = les.vragen ?? []
  const sleutel = 'les-' + les.id

  const [code, zetCode] = useState(stand.code[sleutel] ?? les.opdracht?.start ?? '')
  const [invoer, zetInvoer] = useState(les.opdracht?.invoer ?? '')
  const [oordeel, zetOordeel] = useState<'goed' | 'fout' | 'hint' | null>(null)
  const [gedaan, zetGedaan] = useState<Record<number, boolean>>({})
  const [missers, zetMissers] = useState(0)
  const greep = useRef<EditorGreep | null>(null)

  const opdrachtGoed = les.opdracht ? oordeel === 'goed' : true
  const alleVragen = vragen.every((_, i) => i in gedaan)
  const kan = opdrachtGoed && alleVragen

  /* Python vraagt om invoer als er ergens input( in staat: in de startcode, in
     het voorbeeld, of in de al voorgevulde antwoorden. */
  const invoerNodig = taal === 'py'
    && /input\(/.test((les.opdracht?.start ?? '') + (les.voorbeeld ?? '') + (les.opdracht?.invoer ?? ''))

  const nakijken = (): void => {
    greep.current?.voerUit((u: Uitkomst) => {
      let goed = false
      try {
        goed = Boolean(les.opdracht?.check(u, u.code))
      } catch {
        /* Een nakijkfunctie die zelf struikelt over een half antwoord betekent
           "nog niet", niet "de app is stuk". */
        goed = false
      }
      if (taal === 'py' && !u.ok) goed = false
      zetOordeel(goed ? 'goed' : 'fout')
      zet((s) => ({ ...s, code: { ...s.code, [sleutel]: u.code } }))
    })
  }

  const antwoord = (i: number, a: number): void => {
    if (i in gedaan) return
    const q = vragen[i]
    if (!q) return
    const goed = a === q.j
    if (!goed) zetMissers((m) => m + 1)
    zetGedaan((g) => ({ ...g, [i]: goed }))
  }

  const klaar = (): void => {
    const score = vragen.length
      ? Math.round(Math.max(0, vragen.length - missers) / vragen.length * 100)
      : 100
    const uit = afgerond(stand, les.id, score, les.project ? 'project' : 'les', klok)
    zet(() => uit.stand)
    opAf(uit)
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">{blok.n} · les {li + 1} van {blok.lessen.length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <h2 style={{ marginTop: 8 }}>{les.t}</h2>
      <p className="klein" style={{ marginTop: 4 }}>{les.d}</p>
      <div style={{ marginTop: 16 }}>
        {les.uitleg.map((p, i) => <Rijk key={i} als="p" html={p} />)}
      </div>

      {les.voorbeeld && (
        <div style={{ marginTop: 16 }}>
          <p className="meta">Zo ziet het eruit</p>
          <pre className="voorbeeld" style={{ marginTop: 6 }}>{les.voorbeeld}</pre>
          {les.opdracht && (
            <div className="rij" style={{ marginTop: 8 }}>
              <button className="btn ghost sm" onClick={() => zetCode(les.voorbeeld ?? '')}>
                Zet dit in de editor
              </button>
            </div>
          )}
        </div>
      )}

      {les.opdracht && (
        <div className="card kleur" style={{ marginTop: 20 }}>
          <h3>Opdracht</h3>
          <Rijk als="p" html={les.opdracht.vraag} />
          <div style={{ marginTop: 12 }}>
            <Editor
              taal={taal}
              code={code}
              zetCode={zetCode}
              begin={les.opdracht.start}
              greep={greep}
              {...(invoerNodig ? { invoer, zetInvoer } : {})}
            />
          </div>
          <div className="rij" style={{ marginTop: 12 }}>
            <button className="btn" onClick={nakijken}>Nakijken</button>
            <button className="btn ghost sm" onClick={() => zetOordeel('hint')}>Hint</button>
          </div>
          {oordeel === 'goed' && (
            <Kader soort="goed" kop="Klopt">
              Precies wat er gevraagd werd. Ga door naar de vragen.
            </Kader>
          )}
          {oordeel === 'fout' && <Kader soort="fout" kop="Nog niet">{les.opdracht.fout}</Kader>}
          {oordeel === 'hint' && (
            <Kader soort="let" kop="Hint">
              {les.opdracht.hint || 'Lees de uitleg hierboven nog eens door.'}
            </Kader>
          )}
        </div>
      )}

      {vragen.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="meta">Weet je het nog</p>
          <div className="stack" style={{ marginTop: 8 }}>
            {vragen.map((q, i) => (
              <div className="card plat" key={i}>
                <Rijk als="p" html={q.v} />
                <div className="rij" style={{ marginTop: 10 }}>
                  {q.o.map((o, k) => (
                    <button
                      key={k}
                      className="btn ghost sm"
                      disabled={i in gedaan}
                      style={i in gedaan
                        ? { borderColor: k === q.j ? 'var(--goed)' : undefined }
                        : undefined}
                      onClick={() => antwoord(i, k)}
                    >{o}</button>
                  ))}
                </div>
                {i in gedaan && (
                  <Kader
                    soort={gedaan[i] ? 'goed' : 'let'}
                    kop={gedaan[i] ? 'Goed' : `Het juiste antwoord is: ${q.o[q.j] ?? ''}`}
                  >{q.u}</Kader>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rij" style={{ marginTop: 22 }}>
        <button className="btn groot" disabled={!kan} onClick={klaar}>Ik ben klaar</button>
        {(li > 0 || bi > 0) && (
          <button
            className="btn ghost"
            onClick={() => (li > 0
              ? ga(bi, li - 1)
              : ga(bi - 1, (blokken[bi - 1]?.lessen.length ?? 1) - 1))}
          >Vorige les</button>
        )}
      </div>
      <p className="melding">
        {kan ? '' : !opdrachtGoed
          ? 'Maak eerst de opdracht af en druk op Nakijken.'
          : 'Beantwoord eerst de vragen hierboven.'}
      </p>
    </>
  )
}

function Klaar({
  blok, les, bi, li, blokken, beloning, stand, ga, sluit,
}: {
  blok: Blok; les: Lesje; bi: number; li: number; blokken: Blok[]
  beloning: Beloning; stand: Stand; ga: (bi: number, li: number) => void; sluit: () => void
}): ReactNode {
  const score = stand.lessen[les.id]?.score ?? 0
  const laatste = li >= blok.lessen.length - 1
  const volgend: [number, number] | null = !laatste
    ? [bi, li + 1]
    : (bi < blokken.length - 1 ? [bi + 1, 0] : null)

  return (
    <>
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{ fontSize: '2.6rem' }}>{les.project ? '🏗️' : '✅'}</div>
        <h2 style={{ marginTop: 8 }}>{beloning.eerst ? 'Les af' : 'Nog een keer gedaan'}</h2>
        <p className="klein" style={{ marginTop: 6 }}>{les.t} · {score}% goed</p>
      </div>

      {beloning.eerst ? (
        <div className="grid g2" style={{ marginTop: 18 }}>
          <div className="card plat">
            <p className="meta">Punten erbij</p>
            <p className="cijfer">+{beloning.punten}</p>
          </div>
          <div className="card plat">
            <p className="meta">Verdiend</p>
            <p className="cijfer" style={{ color: 'var(--goed)' }}>
              {beloning.geld > 0 ? euro(beloning.geld) : '—'}
            </p>
            <p className="klein">
              {beloning.geld > 0
                ? `Deze week: ${euro(beloning.stand.week.verdiend)} van ${euro(beloning.stand.instel.weekbudget)}`
                : 'Het weekbudget is op. Punten tellen gewoon door.'}
            </p>
          </div>
        </div>
      ) : (
        <p className="klein" style={{ marginTop: 14, textAlign: 'center' }}>
          Deze had je al af, dus er komt geen geld bij. Oefenen mag altijd.
        </p>
      )}

      {beloning.nieuw.length > 0 && (
        <div className="card kleur" style={{ marginTop: 14 }}>
          <h3>Nieuw insigne</h3>
          {beloning.nieuw.map((i) => (
            <div className="rij" style={{ marginTop: 8 }} key={i.id}>
              <span style={{ fontSize: '1.6rem' }}>{i.ico}</span>
              <div><b>{i.n}</b><div className="klein">{i.u}</div></div>
            </div>
          ))}
        </div>
      )}

      <div className="rij" style={{ marginTop: 20 }}>
        {volgend && (
          <button className="btn groot" onClick={() => ga(volgend[0], volgend[1])}>Volgende les</button>
        )}
        <button className="btn ghost" onClick={sluit}>Terug naar het overzicht</button>
      </div>
    </>
  )
}
