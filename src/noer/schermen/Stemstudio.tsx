/**
 * DE STEMSTUDIO — de teksten thuis zelf inspreken
 *
 * De opnames blijven in dít toestel; met de knop onderaan zet je ze over naar
 * de telefoon van een kind, of voorgoed in de app zelf. Geluid hoort niet in de
 * gedeelde opslag thuis: dat wordt te zwaar en het staat er ook niet voor.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AUDIO, OPNAME } from '../geluid'
import { opnameGroepen } from '../opnamelijst'
import { Balk, Melding, Rijk, Tag } from '../onderdelen'
import { useGeluid } from '../luisteren'

export function Stemstudio({ nu, sluit }: { nu: string; sluit: () => void }): ReactNode {
  const g = useGeluid()
  const groepen = opnameGroepen()
  const [, hertekenen] = useState(0)
  const [loopt, zetLoopt] = useState<string | null>(null)
  const [meld, zetMeld] = useState<{ tekst: string; soort?: 'goed' | 'fout' }>({ tekst: '' })

  const ververs = (): void => hertekenen((n) => n + 1)

  const alles = groepen.flatMap((x) => x.items)
  /* Tellen doen we op wat er écht nog moet: de soera's komen uit de recitatie,
     dus die horen niet in de opgave thuis. */
  const nodig = alles.filter((i) => !AUDIO.bestand(i.id)?.includes('/quran/'))
  const zonder = alles.filter((i) => !AUDIO.heeft(i.id)).length
  const gedaan = nodig.filter((i) => AUDIO.eigenIds().includes(i.id)).length

  const opnemen = async (id: string): Promise<void> => {
    if (!OPNAME.kan()) { zetMeld({ tekst: 'Opnemen kan op dit toestel niet.', soort: 'fout' }); return }
    if (loopt !== id) {
      try {
        await OPNAME.start()
        zetLoopt(id)
      } catch {
        zetMeld({ tekst: 'Geen toegang tot de microfoon.', soort: 'fout' })
      }
      return
    }
    const blob = await OPNAME.stop()
    zetLoopt(null)
    if (!blob) {
      zetMeld({ tekst: 'Er is niets opgenomen — probeer het nog een keer.', soort: 'fout' })
      return
    }
    await AUDIO.zet(id, blob)
    /* Meteen terugluisteren, nog binnen de aanraking: dan mag de telefoon. */
    g.speel(id, '')
    ververs()
  }

  const opslaan = async (): Promise<void> => {
    const uit: { v: number; gemaakt: string; opnames: Record<string, string> } =
      { v: 1, gemaakt: nu, opnames: {} }
    for (const id of AUDIO.eigenIds()) {
      const blob = await AUDIO.haal(id)
      if (!blob) continue
      uit.opnames[id] = await new Promise<string>((r) => {
        const f = new FileReader()
        f.onload = () => r(String(f.result))
        f.readAsDataURL(blob)
      })
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(uit)], { type: 'application/json' }))
    a.download = `noer-stem-${nu}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }

  const inlezen = async (f: File): Promise<void> => {
    try {
      const j = JSON.parse(await f.text()) as { opnames?: Record<string, string> }
      let n = 0
      for (const [id, dataUrl] of Object.entries(j.opnames ?? {})) {
        await AUDIO.zet(id, await (await fetch(dataUrl)).blob())
        n++
      }
      ververs()
      zetMeld({ tekst: `${n} opnames ingelezen.`, soort: 'goed' })
    } catch {
      zetMeld({ tekst: 'Dat bestand kon niet gelezen worden.', soort: 'fout' })
    }
  }

  return (
    <>
      <div className="rij tussen">
        <p className="meta">Eigen stem</p>
        <button className="icoon" onClick={() => { AUDIO.stop(); sluit() }} aria-label="Sluiten">✕</button>
      </div>
      <h2 style={{ marginTop: 6 }}>De teksten zelf inspreken</h2>
      <p className="klein" style={{ marginTop: 6 }}>
        {zonder
          ? <>Er zijn nog <b>{zonder}</b> fragmenten zonder geluid. </>
          : 'Alles heeft geluid. '}
        Zelf ingesproken: <b>{gedaan}</b> van de {nodig.length}.
      </p>
      <p className="klein" style={{ marginTop: 6 }}>
        Houd de telefoon een handbreedte van je mond, spreek rustig, en luister meteen terug — je
        hoort zelf wanneer het goed is. Het hoeft niet in één keer: een paar per dag is genoeg.
      </p>
      <div style={{ marginTop: 10 }}>
        <Balk pct={nodig.length ? gedaan / nodig.length * 100 : 0} />
      </div>

      {groepen.map((groep) => {
        const lijst = (
          <div className="stack" style={{ marginTop: 10 }}>
            {groep.items.map((it) => {
              const eigen = AUDIO.eigenIds().includes(it.id)
              const bron = AUDIO.bestand(it.id)
              return (
                <div className="card plat" key={it.id} style={{ background: 'var(--surface-2)', padding: '13px 15px' }}>
                  <div className="rij tussen" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="meta">{it.w}</p>
                      <div className="ar" style={{ fontSize: '1.2rem', color: 'var(--ink)', marginTop: 3 }}>
                        {it.ar}
                      </div>
                      <div className="tr" style={{ fontSize: '.9rem' }}>{it.tr}</div>
                      <div className="rij" style={{ marginTop: 7 }}>
                        {eigen ? <Tag soort="goed">Op dit toestel opgenomen</Tag>
                          : bron?.includes('/eigen/') ? <Tag soort="goed">Eigen stem meegeleverd</Tag>
                            : bron?.includes('/quran/') ? <Tag soort="k">Recitatie meegeleverd</Tag>
                              : bron ? <Tag soort="info">Voorleesstem meegeleverd</Tag>
                                : <Tag soort="let">Nog niets</Tag>}
                      </div>
                    </div>
                    <div className="rij" style={{ flexDirection: 'column', gap: 6 }}>
                      <button
                        className={`icoon${loopt === it.id ? ' aan' : ''}`}
                        title="Opnemen"
                        onClick={() => void opnemen(it.id)}
                      >{loopt === it.id ? '⏹' : '🎙'}</button>
                      <button className="icoon" title="Beluisteren" onClick={() => g.speel(it.id, it.ar)}>
                        🔊
                      </button>
                      {eigen && (
                        <button
                          className="icoon" title="Opname weggooien"
                          onClick={() => void AUDIO.weg(it.id).then(ververs)}
                        >🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
        return groep.klein ? (
          <details style={{ marginTop: 22 }} key={groep.g}>
            <summary style={{ cursor: 'pointer' }}><b>{groep.g}</b></summary>
            <p className="klein" style={{ marginTop: 6 }}>{groep.klein}</p>
            {lijst}
          </details>
        ) : (
          <div key={groep.g}>
            <h3 style={{ marginTop: 22 }}>{groep.g}</h3>
            {lijst}
          </div>
        )
      })}

      <hr className="rule" />
      <h3>Naar een ander toestel</h3>
      <p className="klein" style={{ marginTop: 5 }}>
        Een opname staat eerst alleen in het toestel waarop hij gemaakt is. Er zijn twee manieren
        om hem bij de kinderen te krijgen.
      </p>
      <p className="klein" style={{ marginTop: 8 }}>
        <b>Snel:</b> sla ze op als bestand, stuur dat naar de telefoon van een kind en lees het
        daar in met de tweede knop.
      </p>
      <Rijk
        als="p" className="klein" style={{ marginTop: 6 }}
        html={'<b>Voorgoed:</b> stuur het bestand naar de computer en draai <span class="meta" '
          + 'style="text-transform:none">node public/noer/audio/zet-eigen.mjs &lt;bestand&gt;</span>. '
          + 'De opnames komen dan in de app zelf te zitten, dus op elk toestel, ook op een nieuwe '
          + 'telefoon, en ook zonder internet.'}
      />
      <div className="rij" style={{ marginTop: 12 }}>
        <button className="btn ghost sm" disabled={!gedaan} onClick={() => void opslaan()}>
          Opnames opslaan als bestand
        </button>
        <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
          Opnames inlezen
          <input
            type="file" accept="application/json" hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void inlezen(f)
            }}
          />
        </label>
      </div>
      <Melding {...meld} />
    </>
  )
}
