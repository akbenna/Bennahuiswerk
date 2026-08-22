/**
 * KLEINE ONDERDELEN
 *
 * OVER DE HTML IN DE LEERSTOF
 *
 * De teksten in gegevens/ dragen opmaak: <span class="ar"> om Arabisch,
 * <em> om een transcriptie, <b> om een term. Dat is geen sierlijkheid maar
 * betekenis — Arabisch moet in Amiri en van rechts naar links, en een
 * transcriptie moet zich onderscheiden van de vertaling. Die opmaak kan dus
 * niet weg, en zij komt via dangerouslySetInnerHTML op het scherm.
 *
 * Dat mag hier omdat de herkomst vaststaat: deze teksten staan in de repo,
 * gaan langs een review, en komen nergens vandaan waar iemand anders kan
 * schrijven. Alles wat de gebruiker zélf intikt — het logboek, het antwoord
 * van het model — gaat als gewone tekst door React heen en nooit hierlangs.
 */
import type { ReactNode } from 'react'
import type { Kleur, Matn } from './gegevens/soorten'

/** Opmaak uit de leerstof. Zie de kop van dit bestand. */
export function Rijk(
  { html, als = 'div', className }: { html: string; als?: 'div' | 'span' | 'p'; className?: string },
): ReactNode {
  const E = als
  return <E className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export const Tag = (
  { kleur, children }: { kleur?: Kleur | 'green' | undefined; children: ReactNode },
): ReactNode => <span className={kleur ? `tag ${kleur}` : 'tag'}>{children}</span>

/** Een brontekst met vertaling, herkomst, woordanker en verantwoording. */
export function MatnBlok({ m }: { m: Matn }): ReactNode {
  return (
    <div className="matn">
      <div className="ar-blok" lang="ar" dir="rtl">
        {m.ar.split('¶').flatMap((deel, i) => (
          i === 0 ? [deel] : [<span key={i} style={{ opacity: 0.3, padding: '0 10px' }}>·</span>, deel]
        ))}
      </div>
      <div className="nl">{m.nl}</div>
      <Rijk className="herkomst" html={m.bron} />
      {m.g && (
        <div className="gloss">
          {m.g.map(([woord, uitleg], i) => (
            <span className="gl" key={i}>
              <b lang="ar" dir="rtl">{woord}</b>
              <span>{uitleg}</span>
            </span>
          ))}
        </div>
      )}
      {m.w && (
        <div className="waarom">
          <span className="meta">Waarom dit fragment</span>
          <Rijk html={m.w} als="span" />
        </div>
      )}
    </div>
  )
}

export type Soort = 'goed' | 'fout' | undefined

/** De regel onder een kaart die zegt hoe het afliep. */
export const Melding = (
  { tekst, soort }: { tekst: string; soort?: Soort },
): ReactNode => (tekst
  ? <p className={soort ? `notitie ${soort}` : 'notitie'}>{tekst}</p>
  : null)

export const Bezig = ({ tekst = 'bezig…' }: { tekst?: string }): ReactNode => (
  <>
    <span className="spin" />
    <span className="muted small">{tekst}</span>
  </>
)

/** Het vinkje op een afgeronde week. */
export const Vink = (): ReactNode => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 6.4l2.6 2.6L10 3.4" />
  </svg>
)

export const nul = (n: number): string => String(n).padStart(2, '0')
