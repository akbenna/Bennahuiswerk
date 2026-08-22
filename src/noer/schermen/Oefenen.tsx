/**
 * OEFENEN — herhalen met tussenpozen
 *
 * Wat je goed hebt komt later terug, wat je fout hebt morgen weer. Zo blijft
 * het zitten zonder dat er geblokt hoeft te worden. Een ronde is tien kaarten:
 * eerst wat herhaald moet worden, dan iets nieuws — in die volgorde, want
 * vergeten stof kost minder moeite dan nieuwe.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  alleKaarten, checkInsignes, checkMissie, kaartAntwoord, kaartenNu, markeerOefening, XP,
} from '../voortgang'
import type { Kaart } from '../voortgang'
import { Blad, Rijk } from '../onderdelen'
import { toon } from '../geluid'
import { GeenProfiel } from './Vandaag'
import type { Tab } from '../tabs'
import type { Toestand } from '../toestand'

/** Een vaste, maar per ronde andere volgorde. */
function hussel<T>(a: T[], zaad: number): T[] {
  const b = a.slice()
  let z = zaad || 1
  for (let i = b.length - 1; i > 0; i--) {
    z = (z * 1103515245 + 12345) & 0x7fffffff
    const j = z % (i + 1)
    ;[b[i], b[j]] = [b[j] as T, b[i] as T]
  }
  return b
}

export function Oefenen({ t, ga }: { t: Toestand; ga: (v: Tab) => void }): ReactNode {
  const [ronde, zetRonde] = useState<Kaart[] | null>(null)
  if (!t.profiel) return <GeenProfiel ga={ga} />

  const { pr, spoor, klok: k } = t
  const kn = kaartenNu(pr, spoor, k.dag)
  const geleerd = Object.keys(pr.kaarten).length
  const alle = alleKaarten(spoor).length

  const begin = (): void => {
    const nu = kaartenNu(t.pr, spoor, k.dag)
    const set = [
      ...hussel(nu.herhaal, k.ms % 100000).slice(0, 7),
      ...hussel(nu.nieuw, (k.ms + 7) % 100000).slice(0, 5),
    ].slice(0, 10)
    zetRonde(set)
  }

  return (
    <>
      <div>
        <h1>Oefenen</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Korte kaartjes uit alles wat je geleerd hebt. Wat je goed hebt, komt later terug; wat
          je fout hebt, morgen weer. Zo blijft het zitten zonder dat je hoeft te blokken.
        </p>
      </div>
      <div className="grid g3">
        <div className="card"><p className="meta">Klaar om te herhalen</p><p className="cijfer">{kn.herhaal.length}</p></div>
        <div className="card"><p className="meta">Nieuw</p><p className="cijfer">{kn.nieuw.length}</p></div>
        <div className="card">
          <p className="meta">Al gezien</p>
          <p className="cijfer">{geleerd}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/{alle}</span></p>
        </div>
      </div>
      <div className="card">
        <h3>Doe een ronde</h3>
        <p className="klein" style={{ marginTop: 5 }}>
          Tien kaarten: eerst wat herhaald moet worden, dan iets nieuws.
        </p>
        <div className="rij" style={{ marginTop: 14 }}>
          <button className="btn groot" onClick={begin}>Beginnen</button>
        </div>
      </div>

      <Blad open={ronde !== null} sluit={() => zetRonde(null)}>
        {ronde !== null && (
          <Ronde
            key={ronde.map((x) => x.id).join()}
            set={ronde} t={t}
            sluit={() => zetRonde(null)}
            opnieuw={begin}
            naarLeerpad={() => { zetRonde(null); ga('leerpad') }}
          />
        )}
      </Blad>
    </>
  )
}

function Ronde({ set, t, sluit, opnieuw, naarLeerpad }: {
  set: Kaart[]; t: Toestand; sluit: () => void; opnieuw: () => void; naarLeerpad: () => void
}): ReactNode {
  const [i, zetI] = useState(0)
  const [goed, zetGoed] = useState(0)
  const [gekozen, zetGekozen] = useState<number | null>(null)
  const [open, zetOpen] = useState(false)
  const { klok: k, spoor } = t

  if (!set.length) {
    return (
      <>
        <h2>Niets te doen</h2>
        <p style={{ marginTop: 10 }}>
          Je bent helemaal bij. Kom morgen terug, of doe een nieuwe les.
        </p>
        <div className="rij" style={{ marginTop: 16 }}>
          <button className="btn" onClick={naarLeerpad}>Naar het leerpad</button>
        </div>
      </>
    )
  }

  const antwoord = (id: string, ok: boolean): void => {
    if (ok) zetGoed((g) => g + 1)
    toon(ok ? 'goed' : 'mis', t.stand.instel.geluid)
    t.zetProf((p) => kaartAntwoord(p, id, ok, k.dag, k.vandaag, k.gisteren))
  }

  const verder = (): void => {
    zetGekozen(null)
    zetOpen(false)
    if (i + 1 >= set.length) {
      t.zetProf((p) => {
        let uit = markeerOefening(p, k.vandaag, k.gisteren)
        uit = checkMissie(uit, t.stand.gezin.budget, k.vandaag, k.gisteren, k.ms).stand
        return checkInsignes(uit, spoor).stand
      })
    }
    zetI((n) => n + 1)
  }

  if (i >= set.length) {
    return (
      <>
        <h2>Ronde klaar</h2>
        <p style={{ marginTop: 10 }}>
          {goed} van de {set.length} goed. Je hebt {goed * XP.kaart} punten verdiend.
        </p>
        <div className="rij" style={{ marginTop: 18 }}>
          <button className="btn" onClick={opnieuw}>Nog een ronde</button>
          <button className="btn ghost" onClick={sluit}>Klaar</button>
        </div>
      </>
    )
  }

  const kaart = set[i] as Kaart
  return (
    <>
      <div className="rij tussen">
        <p className="meta">{kaart.mod} · {i + 1}/{set.length}</p>
        <button className="icoon" onClick={sluit} aria-label="Sluiten">✕</button>
      </div>
      <div className="voortgang-strip">
        {set.map((_, x) => <i key={x} className={x < i ? 'aan' : ''} />)}
      </div>

      {kaart.o ? (
        <>
          <h3 style={{ marginTop: 18 }}>{kaart.v}</h3>
          <div className="stack" style={{ marginTop: 14 }}>
            {kaart.o.map((o, x) => (
              <button
                className="card klik" key={x}
                style={{
                  padding: '13px 15px',
                  pointerEvents: gekozen === null ? undefined : 'none',
                  borderColor: gekozen === null ? undefined
                    : x === kaart.a ? 'var(--goed)' : x === gekozen ? 'var(--fout)' : undefined,
                }}
                onClick={() => { zetGekozen(x); antwoord(kaart.id, x === kaart.a) }}
              >{o}</button>
            ))}
          </div>
          {gekozen !== null && (
            <>
              <div className={`kader ${gekozen === kaart.a ? '' : 'let'}`} style={{ marginTop: 14 }}>
                <p>{kaart.u ?? ''}</p>
              </div>
              <div className="rij" style={{ marginTop: 14 }}>
                <button className="btn" onClick={verder}>Verder</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <Rijk als="h3" style={{ marginTop: 18 }} html={kaart.v} />
          {!open ? (
            <div className="rij" style={{ marginTop: 16 }}>
              <button className="btn ghost" onClick={() => zetOpen(true)}>Laat het antwoord zien</button>
            </div>
          ) : (
            <>
              <Rijk
                className="card plat"
                style={{ marginTop: 14, background: 'var(--surface-2)' }}
                html={kaart.open ?? ''}
              />
              <p className="klein" style={{ marginTop: 12 }}>Wist je het?</p>
              <div className="rij" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => { antwoord(kaart.id, true); verder() }}>Ja</button>
                <button className="btn ghost" onClick={() => { antwoord(kaart.id, false); verder() }}>
                  Nog niet
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
