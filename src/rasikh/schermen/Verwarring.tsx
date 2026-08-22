/**
 * VERWARPUNTEN
 *
 * Niet met de hand bedacht maar berekend: alle aya's die woordelijk gelijk zijn
 * of hetzelfde beginnen, over de hele Koran. Dat is precies waar hifz omvalt —
 * niet bij moeilijke woorden.
 *
 * Het refrein van ar-Rahman staat eenendertig keer in dezelfde soera.
 * "Ya ayyuha lladhina amanu" opent zevenentwintig aya's. Wie zulke plekken niet
 * apart oefent, springt vroeg of laat van de ene naar de andere — meestal
 * midden in het gebed.
 */
import { useEffect, useMemo, useState } from 'react'
import { Balk, Blad, BladKop, Kaart, Kader } from '../onderdelen'
import { aanhef, laadSoera, laadVerwarring, relevanteVerwarring } from '../koran'
import type { Mutashabihat, Verwargroep } from '../koran'
import type { SoeraInfo } from '../planning'
import type { Stand } from '../opslag'

const hussel = <T,>(a: readonly T[]): T[] => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const x = b[i] as T
    b[i] = b[j] as T
    b[j] = x
  }
  return b
}

export function Verwarring(
  { stand, index }: { stand: Stand; index: readonly SoeraInfo[] },
) {
  const [mut, zetMut] = useState<Mutashabihat | null>(null)
  const [ronde, zetRonde] = useState<Verwargroep[] | null>(null)
  const [lijst, zetLijst] = useState(false)

  useEffect(() => {
    let af = false
    void laadVerwarring().then((m) => { if (!af) zetMut(m) })
    return () => { af = true }
  }, [])

  const vast = useMemo(
    () => new Set(Object.entries(stand.aya).filter(([, t]) => t.vast).map(([id]) => id)),
    [stand.aya])
  const eigen = useMemo(
    () => (mut ? relevanteVerwarring(mut, vast) : []), [mut, vast])
  const naam = (nr: number) => index.find((s) => s.nr === nr)?.naam ?? 'soera ' + nr

  return (
    <>
      <div>
        <h1>Verwarpunten</h1>
        <p className="klein" style={{ marginTop: 5 }}>
          Aya's die woordelijk gelijk zijn of hetzelfde beginnen. Dit is waar hifz omvalt — niet bij
          moeilijke woorden.
        </p>
      </div>

      <div className="grid g3">
        <Kaart>
          <p className="meta">Woordelijk gelijk</p>
          <p className="cijfer">{mut?.exact.length ?? 0}</p>
          <p className="klein">groepen in de hele Koran</p>
        </Kaart>
        <Kaart>
          <p className="meta">Gelijke opening</p>
          <p className="cijfer">{mut?.opening.length ?? 0}</p>
          <p className="klein">eerste vier woorden gelijk</p>
        </Kaart>
        <Kaart>
          <p className="meta">Raakt jouw stof</p>
          <p className="cijfer">{eigen.length}</p>
          <p className="klein">binnen wat je kent</p>
        </Kaart>
      </div>

      <Kaart>
        <h3>Doe een ronde</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          {eigen.length
            ? 'Tien vragen uit de groepen die jouw stof raken: je krijgt de gedeelde tekst en de plaats, en moet zeggen wat daar volgt.'
            : 'Je hebt nog te weinig vastgezet om hier iets zinnigs uit te halen. Zodra je een soera af hebt, staan hier de valstrikken uit precies die soera.'}
        </p>
        <div className="rij" style={{ marginTop: 12 }}>
          <button type="button" className="btn groot" disabled={!eigen.length}
                  onClick={() => zetRonde(hussel(eigen).slice(0, 10))}>
            Beginnen
          </button>
          <button type="button" className="btn ghost" onClick={() => zetLijst(true)}>
            Bekijk de lijst
          </button>
        </div>
      </Kaart>

      <Kader kop="Waarom dit apart getraind wordt">
        Het refrein van ar-Rahman staat eenendertig keer in dezelfde soera. "Ya ayyuha lladhina
        amanu" opent zevenentwintig aya's. Wie zulke plekken niet apart oefent, springt vroeg of laat
        van de ene naar de andere — meestal midden in het gebed.
      </Kader>

      {lijst && (
        <Blad opSluiten={() => zetLijst(false)}>
          <BladKop tekst="Verwarpunten in jouw stof" opSluiten={() => zetLijst(false)} />
          {eigen.length ? eigen.slice(0, 40).map((g, i) => (
            <Kaart plat key={i}>
              <div className="ar" style={{ fontSize: '1.15rem' }}>{g.t}</div>
              <p className="klein" style={{ marginTop: 6 }}>
                {g.soort === 'gelijk' ? 'Woordelijk gelijk' : 'Zelfde opening'} ·{' '}
                {g.p.map(([c, v]) => `${naam(c)} ${v}`).join(' · ')}
              </p>
            </Kaart>
          )) : (
            <p style={{ marginTop: 10 }}>Nog niets — dat komt zodra je meer hebt vastgezet.</p>
          )}
        </Blad>
      )}

      {ronde && (
        <Ronde rij={ronde} lezing={stand.instel.lezing} naam={naam}
               opSluiten={() => zetRonde(null)} />
      )}
    </>
  )
}

interface Keuze { c: number; v: number; tekst: string }

function Ronde(
  { rij, lezing, naam, opSluiten }:
  {
    rij: Verwargroep[]
    lezing: Stand['instel']['lezing']
    naam: (nr: number) => string
    opSluiten: () => void
  },
) {
  const [i, zetI] = useState(0)
  const [goed, zetGoed] = useState(0)
  const [vraag, zetVraag] = useState<{
    groep: Verwargroep; juist: Keuze; opties: Keuze[]; gedeeld: string
  } | null>(null)
  const [gekozen, zetGekozen] = useState<Keuze | null>(null)

  useEffect(() => {
    let af = false
    zetGekozen(null)
    void (async () => {
      const g = rij[i]
      if (!g) { zetVraag(null); return }
      /* Neem drie plaatsen uit de groep en vraag wat er ná de gedeelde aya komt. */
      const plek = hussel(g.p).slice(0, 3)
      const lees = (x: { w: string; h: string }) => (lezing === 'hafs' ? x.h : x.w)
      const na: Keuze[] = []
      for (const [c, v] of plek) {
        try {
          const s = await laadSoera(c)
          const vv = s.aya[v]
          if (vv) na.push({ c, v, tekst: lees(vv) })
        } catch { /* die plek slaan we over */ }
      }
      if (af) return
      if (na.length < 2) { zetI((n) => n + 1); return }

      const juist = na[0] as Keuze
      /* De sleutel in mutashabihat.json staat zonder tekens; toon liever de
         echte tekst uit het moshaf. Bij een gedeelde opening: de eerste vier
         woorden. */
      let gedeeld = g.t
      try {
        const s = await laadSoera(juist.c)
        const zelf = s.aya[juist.v - 1]
        if (zelf) {
          const t = lees(zelf)
          gedeeld = g.soort === 'gelijk' ? t : t.split(/\s+/).slice(0, 4).join(' ') + ' …'
        }
      } catch { /* dan de sleutel */ }
      if (!af) zetVraag({ groep: g, juist, opties: hussel(na), gedeeld })
    })()
    return () => { af = true }
  }, [i, rij, lezing])

  if (i >= rij.length) {
    return (
      <Blad opSluiten={opSluiten}>
        <h2>{goed} van de {rij.length} goed</h2>
        <p style={{ marginTop: 8 }}>
          {goed === rij.length
            ? 'Deze plekken zitten. Kom over een week terug.'
            : 'Loop de uitleg na van wat misging; juist hier gaat het in het gebed mis.'}
        </p>
        <div className="rij" style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={opSluiten}>Klaar</button>
        </div>
      </Blad>
    )
  }

  if (!vraag) return <Blad opSluiten={opSluiten}><p className="meta">Bezig…</p></Blad>

  const ok = gekozen === vraag.juist

  return (
    <Blad opSluiten={opSluiten}>
      <BladKop tekst={`Verwarpunt ${i + 1} van ${rij.length}`} opSluiten={opSluiten} />
      <div style={{ margin: '10px 0 16px' }}><Balk dun deel={(i / rij.length) * 100} /></div>

      <p>
        Je staat in <b>{naam(vraag.juist.c)}</b>, aya {vraag.juist.v}. Je hebt net dit gezegd:
      </p>
      <div className="aya" style={{ marginTop: 10 }}>
        <div className="ar">{vraag.gedeeld}</div>
      </div>
      <p style={{ marginTop: 14 }}>Wat volgt hier?</p>

      <div>
        {vraag.opties.map((o, k) => (
          <div key={k} className="keuze" role="button" tabIndex={0}
               style={{
                 pointerEvents: gekozen ? 'none' : undefined,
                 ...(gekozen && o === vraag.juist ? { borderColor: 'var(--goed)' } : {}),
                 ...(gekozen === o && !ok ? { borderColor: 'var(--fout)' } : {}),
               }}
               onClick={() => zetGekozen(o)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zetGekozen(o) }
               }}>
            <span className="ar">{aanhef(o.tekst)}</span>
          </div>
        ))}
      </div>

      {gekozen && (
        <>
          <Kader toon={ok ? undefined : 'let'} kop={ok ? 'Goed' : 'Let op'}>
            Deze tekst staat op {vraag.groep.p.length} plaatsen:{' '}
            {vraag.groep.p.map(([c, v]) => `${naam(c)} ${v}`).join(', ')}. Wat erná komt verschilt —
            dat is het enige dat je uit elkaar houdt.
          </Kader>
          <p className="klein" style={{ marginTop: 8 }}>
            In {naam(vraag.juist.c)} volgt aya {vraag.juist.v + 1}:
          </p>
          <div className="ar" style={{ fontSize: '1.2rem', marginTop: 4 }}>{vraag.juist.tekst}</div>
          <div className="rij" style={{ marginTop: 14 }}>
            <button type="button" className="btn"
                    onClick={() => { zetGoed((n) => n + (ok ? 1 : 0)); zetI((n) => n + 1) }}>
              Verder
            </button>
          </div>
        </>
      )}
    </Blad>
  )
}
