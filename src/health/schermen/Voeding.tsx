/**
 * VOEDING — zoeken in NEVO, de gerechtenbibliotheek en je eigen producten.
 *
 * Overgezet uit vwVoeding(). Twee dingen die in de oude versie fout stonden en
 * hier goed: de gerechten hadden geen knop, dus je kon een tajine wél vinden en
 * niet loggen; en `kal_zoeken` gaf je eigen producten altijd al terug, maar
 * hitsHTML had er geen tak voor, dus ze waren onvindbaar in het zoekveld.
 */
import { useEffect, useRef, useState } from 'react'
import { Balk, Chip, Kaart, Knop, Kop, Rij, Spin, Tussen, Uitleg } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import { roep } from '@/gedeeld/db/rpc'
import type { Zoekuitslag } from '@/gedeeld/db/rpc'
import type { EigenProduct, Moment, Regel } from '@/gedeeld/db/tabellen'
import type { Analyse } from '../rekenkern'
import type { Onderwerp } from '../vensters/Portie'

export interface VoedingEigenschappen {
  a: Analyse
  token: string
  producten: EigenProduct[]
  regelsVandaag: Regel[]
  opPortie: (o: Onderwerp) => void
  bewaarProduct: (p: {
    naam: string; per: number; eenheid: string; kcal: number; eiwit_g: number
  }) => void
  wisProduct: (id: string) => void
}

export function Voeding(p: VoedingEigenschappen) {
  return (
    <>
      <Zoeken token={p.token} opPortie={p.opPortie} />
      <EigenProducten producten={p.producten} bewaar={p.bewaarProduct} wis={p.wisProduct} />
      <Kaart>
        <Kop>Eiwitverdeling over de dag</Kop>
        <EiwitVerdeling a={p.a} regels={p.regelsVandaag} />
      </Kaart>
    </>
  )
}

function Zoeken({ token, opPortie }: { token: string; opPortie: (o: Onderwerp) => void }) {
  const [term, zetTerm] = useState('')
  const [uitslag, zetUitslag] = useState<Zoekuitslag | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [fout, zetFout] = useState<string | null>(null)
  /* Antwoorden kunnen in de verkeerde volgorde terugkomen: een trage treffer op
     'cous' mag het resultaat van 'couscous' niet overschrijven. */
  const teller = useRef(0)

  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) { zetUitslag(null); zetFout(null); return }
    const mijn = ++teller.current
    const tijd = setTimeout(async () => {
      zetLoopt(true)
      try {
        const u = await roep('kal_zoeken', { p_token: token, p_q: q, p_limiet: 12 })
        if (mijn === teller.current) { zetUitslag(u); zetFout(null) }
      } catch (e) {
        if (mijn === teller.current) zetFout(e instanceof Error ? e.message : String(e))
      } finally {
        if (mijn === teller.current) zetLoopt(false)
      }
    }, 300)
    return () => clearTimeout(tijd)
  }, [term, token])

  const leeg = uitslag && !uitslag.nevo.length && !uitslag.gerechten.length && !uitslag.eigen.length

  async function kiesGerecht(id: string) {
    try {
      const g = await roep('kal_gerecht', { p_token: token, p_dish_id: id })
      if (!g.porties.length) { zetFout('Voor dit gerecht staan geen porties klaar.'); return }
      opPortie({ soort: 'gerecht', gerecht: g })
    } catch (e) { zetFout(e instanceof Error ? e.message : String(e)) }
  }
  async function kiesNevo(code: string) {
    try {
      opPortie({ soort: 'nevo', product: await roep('kal_portiematen', { p_token: token, p_nevo_code: code }) })
    } catch (e) { zetFout(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <Kaart>
      <Kop>Zoeken in NEVO en de gerechtenbibliotheek</Kop>
      <input style={{ marginTop: 8 }} placeholder="couscous, olijfolie, tajine…" autoComplete="off"
             value={term} onChange={(e) => zetTerm(e.target.value)} />
      <p className="mini" style={{ marginTop: 8 }}>
        2.328 producten uit het Nederlands Voedingsstoffenbestand, plus de gevalideerde gerechten van
        ProVita. Zoeken gaat terwijl je typt.
      </p>

      {loopt && <p className="klein" style={{ marginTop: 10 }}><Spin /> Zoeken…</p>}
      {fout && <p className="klein" style={{ marginTop: 10 }}>{fout}</p>}

      {uitslag && uitslag.nevo.length > 0 && (
        <>
          <Kop>Voedingsstoffenbestand</Kop>
          <div className="lijst">
            {uitslag.nevo.map((n) => (
              <div key={n.nevo_code}>
                <Chip graad="C" />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{n.naam}</span>
                  <span className="mini">per 100 g · {n.groep}</span>
                </span>
                <span className="cijfer mini" style={{ textAlign: 'right' }}>
                  {dz(n.kcal)} kcal<br />{dec(n.eiwit_g, 1)} g
                </span>
                <Knop klein titel="Portie kiezen" opKlik={() => void kiesNevo(n.nevo_code)}>+</Knop>
              </div>
            ))}
          </div>
        </>
      )}

      {uitslag && uitslag.gerechten.length > 0 && (
        <>
          <Kop>Gerechten van ProVita</Kop>
          <div className="lijst">
            {uitslag.gerechten.map((g) => (
              <div key={g.id}>
                <Chip graad={g.status === 'validated' ? 'C' : 'D'} />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{g.naam}</span>
                  <span className="mini">
                    {g.keuken}{g.omschrijving && ' · ' + g.omschrijving.slice(0, 60)}
                  </span>
                </span>
                <Knop klein titel="Portie kiezen" opKlik={() => void kiesGerecht(g.id)}>+</Knop>
              </div>
            ))}
          </div>
        </>
      )}

      {uitslag && uitslag.eigen.length > 0 && (
        <>
          <Kop>Eigen producten</Kop>
          <div className="lijst">
            {uitslag.eigen.map((pr) => (
              <div key={pr.id}>
                <Chip graad={pr.conf || 'A'} />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{pr.naam}</span>
                  <span className="mini">per {dz(pr.per)} {pr.eenheid || 'g'}</span>
                </span>
                <span className="cijfer mini" style={{ textAlign: 'right' }}>
                  {dz(pr.kcal)} kcal<br />{dec(pr.eiwit_g, 1)} g
                </span>
                <Knop klein titel="Toevoegen"
                      opKlik={() => opPortie({ soort: 'eigen', product: pr })}>+</Knop>
              </div>
            ))}
          </div>
        </>
      )}

      {leeg && !loopt && (
        <p className="klein" style={{ marginTop: 10 }}>
          Niets gevonden voor “{term.trim()}”. Probeer het losse product zonder de bereiding erbij, of
          zeg het in gewone taal onder Vandaag — dan ontleedt de herkenning het voor je.
        </p>
      )}
    </Kaart>
  )
}

function EigenProducten(
  { producten, bewaar, wis }:
  {
    producten: EigenProduct[]
    bewaar: VoedingEigenschappen['bewaarProduct']
    wis: (id: string) => void
  },
) {
  const [naam, zetNaam] = useState('')
  const [per, zetPer] = useState('100')
  const [eenheid, zetEenheid] = useState('g')
  const [kcal, zetKcal] = useState('')
  const [eiwit, zetEiwit] = useState('')

  function opslaan() {
    const k = parseFloat(kcal)
    if (!naam.trim() || !Number.isFinite(k)) return
    bewaar({
      naam: naam.trim(), per: parseFloat(per) || 100, eenheid,
      kcal: k, eiwit_g: parseFloat(eiwit) || 0,
    })
    zetNaam(''); zetKcal(''); zetEiwit('')
  }

  return (
    <Kaart>
      <Kop>Eigen producten</Kop>
      <p className="mini" style={{ marginTop: 4 }}>
        Wat je van het etiket overneemt en afweegt is een A-waarde — de enige categorie zonder
        schatting.
      </p>
      <Rij style={{ marginTop: 8 }}>
        <input placeholder="naam" value={naam} onChange={(e) => zetNaam(e.target.value)}
               style={{ flex: '2 1 140px', width: 'auto' }} />
        <input type="number" placeholder="per" value={per} onChange={(e) => zetPer(e.target.value)}
               style={{ flex: '0 0 72px' }} />
        <select value={eenheid} onChange={(e) => zetEenheid(e.target.value)} style={{ flex: '0 0 78px' }}>
          {['g', 'ml', 'stuk', 'portie'].map((u) => <option key={u}>{u}</option>)}
        </select>
        <input type="number" placeholder="kcal" value={kcal} onChange={(e) => zetKcal(e.target.value)}
               style={{ flex: '0 0 78px' }} />
        <input type="number" step="0.1" placeholder="eiwit" value={eiwit}
               onChange={(e) => zetEiwit(e.target.value)} style={{ flex: '0 0 78px' }} />
        <Knop vol opKlik={opslaan}>Opslaan</Knop>
      </Rij>
      {producten.length > 0 && (
        <div className="lijst" style={{ marginTop: 10 }}>
          {producten.map((pr) => (
            <div key={pr.id}>
              <Chip graad="A" />
              <span className="groei knip" style={{ fontSize: '.86rem' }}>{pr.naam}</span>
              <span className="cijfer mini">
                {dz(pr.kcal)}/{pr.per}{pr.eenheid} · {dec(pr.eiwit_g, 1)} g
              </span>
              <Knop klein titel="Verwijderen" opKlik={() => wis(pr.id)}>×</Knop>
            </div>
          ))}
        </div>
      )}
    </Kaart>
  )
}

const MAALTIJDEN: Moment[] = ['ontbijt', 'lunch', 'diner', 'tussendoor', 'onbekend']

function EiwitVerdeling({ a, regels }: { a: Analyse; regels: Regel[] }) {
  const per: Record<Moment, number> = {
    ontbijt: 0, lunch: 0, diner: 0, tussendoor: 0, onbekend: 0,
  }
  for (const r of regels) per[r.moment ?? 'onbekend'] += Number(r.eiwit_g) || 0
  const totaal = MAALTIJDEN.reduce((s, m) => s + per[m], 0)
  const benoemd = totaal - per.onbekend

  /* Dagtotalen uit een import hebben geen maaltijdmoment. Drie balken op nul
     tonen terwijl er wel eiwit gelogd is, is geen leeg scherm maar een onjuist
     scherm — het antwoord is onbekend, niet nul. */
  if (totaal > 0 && benoemd === 0) {
    return (
      <p className="mini" style={{ marginTop: 8 }}>
        Er is vandaag {dec(totaal, 1)} g eiwit gelogd, maar zonder maaltijdmoment — dat hoort bij
        dagtotalen uit een import. De verdeling over de dag is dus niet bekend. Zodra je een maaltijd
        via <em>Zeggen wat je at</em> logt, komt hij hier vanzelf op de goede plek te staan.
      </p>
    )
  }
  if (totaal === 0) return <p className="mini" style={{ marginTop: 8 }}>Nog niets gelogd vandaag.</p>

  const doelPerMaaltijd = Math.round(a.eiwitDoel / 3)
  const mx = Math.max(doelPerMaaltijd * 1.4, ...MAALTIJDEN.map((m) => per[m]))
  const tonen = MAALTIJDEN.filter(
    (m) => per[m] > 0 || m === 'ontbijt' || m === 'lunch' || m === 'diner')

  return (
    <div style={{ marginTop: 8 }}>
      {tonen.map((m) => (
        <div key={m} style={{ marginBottom: 7 }}>
          <Tussen>
            <span className="mini" style={{ textTransform: 'capitalize' }}>{m}</span>
            <span className="cijfer mini">{dec(per[m], 1)} g</span>
          </Tussen>
          <Balk deel={(per[m] / mx) * 100} toon={per[m] >= doelPerMaaltijd ? 'goed' : undefined} />
        </div>
      ))}
      <Uitleg id="eiwitverdeling" label="waarom de verdeling telt">
        <p>
          Streef naar drie tot vier maaltijden van {doelPerMaaltijd} tot{' '}
          {Math.round((a.eiwitDoel / 3) * 1.2)} g eiwit met minstens drie uur ertussen. Gelijkmatige
          verdeling gaf in Mamerow 2014 een 25 procent hogere spiereiwitsynthese dan een scheve
          verdeling — al ging dat om acht deelnemers van gemiddeld 37 jaar, dus behandel het als
          richting, niet als wet. Het ontbijt is de maaltijd waar de scheve verdeling vrijwel altijd
          ontstaat.
        </p>
      </Uitleg>
    </div>
  )
}
