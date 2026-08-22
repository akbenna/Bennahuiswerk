/**
 * DE LEERSTOF IN BEELD
 *
 * Wat een blok van het leerpad laat zien, en de losse kaarten die daarin
 * terugkomen: een letter met haar vier vormen, een woordregel, een leestekst.
 * Deze stukken staan hier los omdat ze op vier plekken gebruikt worden — in de
 * sessie, in het leerpad, in het alfabet en in de woordenlijst — en drie
 * kopieën die uiteenlopen is precies wat we hier weg aan het halen zijn.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { LETTERS, TEKENS } from './gegevens/letters'
import { GRAMMATICA } from './gegevens/grammatica'
import { TEKSTEN } from './gegevens/teksten'
import { WOORDEN } from './gegevens/woorden'
import type { Koranwoord, Letter, Tekst, Woord, Zin } from './gegevens/soorten'
import type { Padstap } from './leerplan'
import { kaartId } from './leerplan'
import { datumNL } from './datum'
import type { Kaartstaat } from './fsrs'
import { letterVormen, vocaliseer } from './tekst'
import type { Vocalisatie } from './tekst'
import type { Spraak } from './spraak'
import { Luister, Rijk } from './onderdelen'

const VORMNAMEN = ['los', 'begin', 'midden', 'eind'] as const

/** De vier vormen naast elkaar. Bij een letter die niet naar links verbindt
 *  staan begin en midden er wel, maar gedoofd: ze bestaan niet, en dat weten is
 *  precies wat je moet leren. */
export function Vormrij({ l }: { l: string }): ReactNode {
  const v = letterVormen(l)
  const vormen = [v.los, v.begin, v.midden, v.eind]
  return (
    <div className="vormrij">
      {VORMNAMEN.map((naam, i) => (
        <div
          key={naam}
          className={'vormvak' + (!v.verbindtLinks && (i === 1 || i === 2) ? ' nvt' : '')}
        >
          <div className="v">{vormen[i]}</div>
          <div className="n">{naam}</div>
        </div>
      ))}
    </div>
  )
}

export function LetterKaart(
  { L, uitgebreid, spraak }: { L: Letter | undefined; uitgebreid?: boolean; spraak: Spraak },
): ReactNode {
  if (!L) return null
  return (
    <div className="kaart" style={{ marginBottom: 12 }}>
      <div className="rij tussen">
        <div className="rij">
          <span className="ar" style={{ fontSize: '2.8rem', lineHeight: 1 }}>{L.l}</span>
          <div>
            <b style={{ fontSize: '1.05rem' }}>{L.n}</b> <span className="tr">{L.tr}</span>
            <div className="klein muted">klank: {L.k}</div>
          </div>
        </div>
        <Luister spraak={spraak} tekst={L.n} />
      </div>
      <div className="rij" style={{ marginTop: 10 }}>
        <span className={L.zon ? 'vlag warmv' : 'vlag letv'}>
          {L.zon ? 'zonsletter' : 'maansletter'}
        </span>
        {!L.vl && <span className="vlag">verbindt niet naar links</span>}
        {L.moeilijk && <span className="vlag acc">nieuwe klank</span>}
      </div>
      <Vormrij l={L.l} />
      <Rijk als="p" className="small" style={{ margin: 0 }} html={L.u} />
      {uitgebreid && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <span className="label">Voorbeeld</span>
          <div className="ar" style={{ marginTop: 2 }}>{L.vb}</div>
        </div>
      )}
    </div>
  )
}

export function WoordRij(
  { w, vocalisatie, open }: { w: Woord; vocalisatie: Vocalisatie; open: () => void },
): ReactNode {
  return (
    <button type="button" className="woordrij" onClick={open}>
      <span className="beeld">{w.b || '·'}</span>
      <span className="mid-w">
        <span className="ar">{vocaliseer(w.a, vocalisatie)}</span>
        <span className="nl-w">{w.n} <span className="tr">{w.t}</span></span>
      </span>
    </button>
  )
}

/** Een leestekst. Het Arabisch staat vooraan, de vertaling zit achter een knop
 *  en de woordbetekenissen achter een tik. Glossen die permanent in beeld staan
 *  helpen de beginner maar remmen daarna; achter een tik kost het één handeling
 *  om ze te krijgen en blijft de tekst zelf de hoofdzaak. */
export function TekstBlok({ T, vocalisatie }: { T: Tekst | undefined; vocalisatie: Vocalisatie }): ReactNode {
  const [open, zetOpen] = useState<Record<number, boolean>>({})
  const [glos, zetGlos] = useState<Record<number, boolean>>({})
  if (!T) return null
  const regelsAr = T.ar.split('\n')
  const regelsNl = T.nl.split('\n')
  return (
    <div className="kaart">
      {regelsAr.map((r, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div className="ar">{vocaliseer(r, vocalisatie)}</div>
          <button
            type="button" className="k stil klein" style={{ padding: '4px 0' }}
            onClick={() => zetOpen((o) => ({ ...o, [i]: !o[i] }))}
          >{open[i] ? 'Vertaling verbergen' : 'Vertaling tonen'}</button>
          {open[i] && <div className="small muted">{regelsNl[i] ?? ''}</div>}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 6 }}>
        <span className="label">Woorden — tik voor de betekenis</span>
        <div className="chips" style={{ marginTop: 8 }}>
          {T.gloss.map((g, i) => (
            <button
              type="button" key={i} className="chip"
              onClick={() => zetGlos((o) => ({ ...o, [i]: !o[i] }))}
            >
              <span className="ar klein-ar">{g[0]}</span>{' '}
              <span className={glos[i] ? 'gloss' : 'gloss uit'}>{g[1]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ZinRij({ z, vocalisatie, spraak }: { z: Zin; vocalisatie: Vocalisatie; spraak: Spraak }): ReactNode {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div className="rij tussen" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div className="rek">
          <div className="ar">{vocaliseer(z.a, vocalisatie)}</div>
          <div className="tr">{z.t}</div>
          <div className="small">{z.n}</div>
        </div>
        <Luister spraak={spraak} tekst={z.a} />
      </div>
    </div>
  )
}

function KoranRij({ k }: { k: Koranwoord }): ReactNode {
  return (
    <div
      className="rij tussen"
      style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}
    >
      <div className="rek">
        <span className="ar">{k.a}</span> <span className="tr">{k.t}</span>
        <div className="small">{k.n}</div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        {k.r !== '—' && <div className="ar klein-ar">{k.r}</div>}
        <div className="klein muted">± {k.f}×</div>
      </div>
    </div>
  )
}

export interface InhoudProps {
  blok: Padstap
  vocalisatie: Vocalisatie
  spraak: Spraak
  /** Een woord aantikken opent het woordblad; wie dat niet wil geeft niets mee. */
  toonWoord?: ((i: number) => void) | undefined
}

/** Wat er in de leerstap van een blok te zien is. */
export function LeerInhoud({ blok, vocalisatie, spraak, toonWoord }: InhoudProps): ReactNode {
  if (blok.k === 'letters') {
    return (
      <>
        {(blok.letters ?? []).map((l) => (
          <LetterKaart key={l} L={LETTERS.find((x) => x.l === l)} spraak={spraak} />
        ))}
        <div className="melding" style={{ marginTop: 14 }}>
          Deze letters staan bij elkaar omdat ze op elkaar lijken. Ze naast elkaar leren is
          lastiger dan één voor één, en juist daarom onthoud je het verschil.
        </div>
      </>
    )
  }

  if (blok.k === 'teken') {
    const T = TEKENS[blok.idx ?? 0]
    if (!T) return null
    return (
      <div className="kaart mid">
        <div className="ar reus">{T.demo}</div>
        <h3 style={{ marginTop: 8 }}>{T.n}</h3>
        <div className="tr">{T.tr}</div>
        <Rijk als="p" style={{ marginTop: 12, textAlign: 'left' }} html={T.u} />
      </div>
    )
  }

  if (blok.k === 'woorden') {
    const items = (blok.items ?? []) as Array<{ w: Woord; i: number }>
    return (
      <>
        <div className="kaart">
          {items.map(({ w, i }) => (
            <WoordRij key={i} w={w} vocalisatie={vocalisatie} open={() => toonWoord?.(i)} />
          ))}
        </div>
        <p className="klein muted" style={{ marginTop: 10 }}>
          Tik op een woord voor het meervoud, het geslacht en waar het vandaan komt.
        </p>
      </>
    )
  }

  if (blok.k === 'grammatica') {
    const G = GRAMMATICA.find((g) => g.id === blok.id)
    if (!G) return null
    return (
      <>
        <Rijk className="kaart accent" style={{ marginBottom: 14 }} html={G.kern} />
        <div className="kaart">
          <Rijk html={G.tekst} />
          <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            {G.vb.map((v, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="ar">{v[0]}</div>
                <div className="tr">{v[1]}</div>
                <div className="small">{v[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (blok.k === 'zinnen') {
    const items = (blok.items ?? []) as Array<{ z: Zin; i: number }>
    return (
      <div className="kaart">
        {items.map(({ z, i }) => (
          <ZinRij key={i} z={z} vocalisatie={vocalisatie} spraak={spraak} />
        ))}
      </div>
    )
  }

  if (blok.k === 'tekst') {
    return <TekstBlok T={TEKSTEN.find((t) => t.id === blok.id)} vocalisatie={vocalisatie} />
  }

  if (blok.k === 'koran') {
    const items = (blok.items ?? []) as Array<{ k: Koranwoord; i: number }>
    return (
      <div className="kaart">
        {items.map(({ k, i }) => <KoranRij key={i} k={k} />)}
      </div>
    )
  }

  return null
}

/** Eén zin over wat een blok inhoudt, voor het scherm van vandaag. */
export function blokOmschrijving(b: Padstap | null): string {
  if (!b) return ''
  switch (b.k) {
    case 'letters':
      return 'Nieuwe letters, hun vier vormen en hun klank. Ze staan met opzet naast elkaar '
        + 'omdat ze op elkaar lijken.'
    case 'teken': return 'Een klinker- of hulpteken: wat het doet en hoe je het hoort.'
    case 'woorden': return (b.items?.length ?? 0) + ' nieuwe woorden, met beeld en uitspraak.'
    case 'grammatica': return GRAMMATICA.find((g) => g.id === b.id)?.kern ?? ''
    case 'zinnen': return 'Zinnen die je meteen kunt gebruiken, en zelf samenstellen.'
    case 'tekst': return 'Een korte tekst lezen, met de vertaling achter een tik.'
    case 'koran': return (b.items?.length ?? 0) + ' veelvoorkomende Koranwoorden, met hun wortel.'
    default: return ''
  }
}

export const soortNaam = (k: Padstap['k']): string => ({
  letters: 'letters', teken: 'klinkerteken', woorden: 'woordenschat',
  grammatica: 'grammatica', zinnen: 'zinnen', tekst: 'leestekst', koran: 'Koranwoorden',
}[k] ?? k)

/** Wat de herhaling van dit woord weet. Geen kaart betekent: het zit nog niet
 *  in de wachtrij, en dat is geen tekortkoming maar het pad dat er nog aankomt. */
function Kaartstatus({ ids, kaarten }: { ids: string[]; kaarten: Record<string, Kaartstaat> }): ReactNode {
  const k = ids.map((id) => kaarten[id]).find(Boolean)
  if (!k) {
    return (
      <p className="klein muted" style={{ marginTop: 12 }}>
        Dit woord zit nog niet in je herhaling.
      </p>
    )
  }
  return (
    <p className="klein muted" style={{ marginTop: 12 }}>
      In herhaling · volgende keer op {datumNL(k.due)} · stabiliteit {Math.round(k.s)} dagen.
    </p>
  )
}

/** Het blad achter een woord: alles wat er nog meer over te weten valt. */
export function Woordblad(
  { i, kaarten, spraak, sluit }:
  { i: number; kaarten: Record<string, Kaartstaat>; spraak: Spraak; sluit: () => void },
): ReactNode {
  const w = WOORDEN[i]
  if (!w) return null
  return (
    <>
      <div className="mid">
        <div style={{ fontSize: '2.6rem' }}>{w.b || ''}</div>
        <div className="ar" style={{ fontSize: '2.8rem', lineHeight: 1.5 }}>{w.a}</div>
        <div className="tr">{w.t}</div>
        <h3 style={{ marginTop: 6 }}>{w.n}</h3>
        {spraak.beschikbaar && (
          <button
            type="button" className="k rand" style={{ marginTop: 10 }}
            onClick={() => spraak.zeg(w.a)}
          >🔈 Uitspreken</button>
        )}
      </div>
      <div className="raster r2" style={{ marginTop: 18 }}>
        <div className="kaart dun"><span className="label">Thema</span><div>{w.th}</div></div>
        <div className="kaart dun">
          <span className="label">Geslacht</span>
          <div>{w.g === 'v' ? 'vrouwelijk' : w.g === 'm' ? 'mannelijk' : '—'}</div>
        </div>
        {w.mv && (
          <div className="kaart dun">
            <span className="label">
              {w.th === 'werkwoorden' ? 'Tegenwoordige tijd' : 'Meervoud'}
            </span>
            <div className="ar klein-ar">{w.mv}</div>
          </div>
        )}
        <div className="kaart dun"><span className="label">Spoor</span><div>vanaf {w.s}</div></div>
      </div>
      {w.d && (
        <div className="kaart warm" style={{ marginTop: 12 }}>
          <span className="label">Marokkaans terzijde</span>
          <p className="small" style={{ margin: '4px 0 0' }}>{w.d}</p>
        </div>
      )}
      <Kaartstatus ids={[kaartId('W', i, 'nl'), kaartId('W', i, 'ar')]} kaarten={kaarten} />
      <button type="button" className="k rand vol" style={{ marginTop: 16 }} onClick={sluit}>
        Sluiten
      </button>
    </>
  )
}
