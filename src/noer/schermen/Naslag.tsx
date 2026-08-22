/**
 * DE NASLAG — alle gebeden, de bijzondere, de du'a's en wat er misgaat
 *
 * Vier schermen die niets van je vragen: je zoekt iets op, je leest het, je
 * gaat weer weg. Vandaar de tabellen en de uitklappers in plaats van
 * stapsgewijze loops.
 */
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { GEBEDEN, NAWAFIL } from '../gegevens/gebed'
import { BIJZONDER, FOUTEN, REGELS, ROUW } from '../gegevens/bijzonder'
import { DUAS } from '../gegevens/hifz'
import { T } from '../gegevens/teksten'
import type { Onderwerp } from '../gegevens/soorten'
import { Rijk, Tag } from '../onderdelen'
import { Tekstblok } from '../luisteren'
import { checkInsignes, puntenErbij } from '../voortgang'
import type { Toestand } from '../toestand'
import type { Gebedtab } from '../tabs'

export function AlleGebeden({ naar }: { naar: (k: Gebedtab) => void }): ReactNode {
  return (
    <div className="stack">
      <div className="card">
        <h2>Alle gebeden op een rij</h2>
        <p className="klein" style={{ marginTop: 6 }}>
          Eerst de vijf verplichte. Daaronder wat er vrijwillig bij hoort — sommige daarvan zijn
          zo sterk aanbevolen dat je ze bijna nooit overslaat.
        </p>
        <div className="tblwrap" style={{ marginTop: 14 }}>
          <table className="tbl">
            <thead>
              <tr><th>Gebed</th><th>Rak'a</th><th>Tijd</th><th>Lezen</th><th>Ervoor</th><th>Erna</th></tr>
            </thead>
            <tbody>
              {GEBEDEN.map((g) => (
                <tr key={g.id}>
                  <td>
                    <b>{g.naam}</b><br />
                    <span className="ar" style={{ fontSize: '1rem', color: 'var(--k)' }}>{g.ar}</span>
                  </td>
                  <td>{g.rak}</td><td>{g.tijd}</td><td>{g.hardop}</td>
                  <td>{g.sunnaVoor}</td><td>{g.sunnaNa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid g2">
        {GEBEDEN.map((g) => (
          <div className="card plat" key={g.id}>
            <h4>{g.naam}</h4>
            <p className="klein" style={{ marginTop: 5 }}>{g.extra}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Vrijwillige en bijzondere gebeden</h3>
        <p className="klein" style={{ marginTop: 6 }}>
          Dit is de korte lijst. Het vrijdaggebed, het feestgebed, het gebed bij een overledene
          en de rest staan helemaal uitgeschreven onder{' '}
          <button className="btn sm ghost" onClick={() => naar('bijzonder')}>Bijzondere gebeden</button>.
        </p>
        <div className="tblwrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr><th>Gebed</th><th>Rak'a</th><th>Wanneer</th><th>Waarom</th></tr></thead>
            <tbody>
              {NAWAFIL.map((n) => (
                <tr key={n.n}>
                  <td>
                    <b>{n.n}</b><br />
                    <span className="ar" style={{ fontSize: '1rem', color: 'var(--k)' }}>{n.ar}</span>
                  </td>
                  <td>{n.r}</td><td>{n.w}</td><td>{n.u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Onderwerpkaart({ b }: { b: Onderwerp }): ReactNode {
  const regel = REGELS[b.regel]
  return (
    <div className="card" id={`bz-${b.id}`}>
      <div className="rij tussen" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3>{b.n}</h3>
          <div className="ar" style={{ fontSize: '1.3rem', color: 'var(--k)', marginTop: 3 }}>{b.ar}</div>
        </div>
        {regel && <Tag soort={regel.c}>{regel.t}</Tag>}
      </div>
      <p style={{ marginTop: 10 }}>{b.kort}</p>
      <div className="grid g2" style={{ marginTop: 14 }}>
        <div className="kader"><h4>Wanneer</h4><p>{b.wanneer}</p></div>
        <div className="kader info"><h4>Hoeveel</h4><p>{b.rak}</p></div>
      </div>
      <h4 style={{ marginTop: 16 }}>Hoe het gaat</h4>
      <ol className="genummerd" style={{ marginTop: 8 }}>
        {b.hoe.map((h, i) => <Rijk key={i} als="li" html={h} />)}
      </ol>
      <div className="kader let" style={{ marginTop: 14 }}>
        <h4>Let op</h4><Rijk als="p" html={b.let} />
      </div>
      {b.tips.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>Tips</h4>
          <ul className="net" style={{ marginTop: 7 }}>
            {b.tips.map((t, i) => <Rijk key={i} als="li" html={t} />)}
          </ul>
        </>
      )}
      {b.zeg.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>Wat je zegt</h4>
          <div className="stack" style={{ marginTop: 9 }}>
            {b.zeg.map((k) => { const w = T[k]; return w ? <Tekstblok key={k} o={w} /> : null })}
          </div>
        </>
      )}
      {b.vragen.length > 0 && (
        <div className="stack" style={{ marginTop: 16 }}>
          {b.vragen.map(([v, a]) => (
            <details
              key={v}
              style={{
                border: '1px solid var(--line)', borderRadius: 9, padding: '12px 14px',
                background: 'var(--surface-2)',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--ink)' }}>{v}</summary>
              <p className="klein" style={{ marginTop: 9 }}>{a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

export function Bijzonder({ t }: { t: Toestand }): ReactNode {
  /* Dit scherm doorlezen is zelf al iets waard: het staat er voor het moment
     dat niemand rustig kan nadenken, en dan helpt het als je het al eens gezien
     hebt. Eén keer, en daarna niet meer. */
  useEffect(() => {
    if (t.pr.duasGezien >= 0 && !t.pr.examens['bijzonder']) {
      t.zetProf((p) => {
        if (p.examens['bijzonder']) return p
        const uit = puntenErbij(
          { ...p, examens: { ...p.examens, bijzonder: { gehaald: true, d: t.klok.vandaag } } },
          5, t.klok.vandaag, t.klok.gisteren)
        return checkInsignes(uit, t.spoor).stand
      })
    }
  }, [])

  const spring = (id: string): void =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="stack">
      <div className="card">
        <h2>Gebeden die niet elke dag terugkomen</h2>
        <p className="klein" style={{ marginTop: 6 }}>
          De vijf gebeden leer je vanzelf: je doet ze vijf keer per dag. Deze niet. Het
          feestgebed komt twee keer per jaar langs, en het gebed bij een overledene komt precies
          op de dag dat niemand in huis rustig kan nadenken. Daarom staan ze hier uitgeschreven.
        </p>
        <div className="rij" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {BIJZONDER.map((b) => (
            <button className="btn sm ghost" key={b.id} onClick={() => spring(`bz-${b.id}`)}>{b.n}</button>
          ))}
          <button className="btn sm ghost" onClick={() => spring('rond-overlijden')}>
            Rond een overlijden
          </button>
        </div>
        <div className="kader" style={{ marginTop: 14 }}>
          <h4>Wat betekenen de kleuren</h4>
          <p className="klein" style={{ marginTop: 4 }}>
            <Tag soort="fout">Verplicht</Tag> geldt voor wie eraan toe is — het vrijdaggebed
            bijvoorbeeld voor volwassen mannen die thuis zijn.{' '}
            <Tag soort="let">Plicht van de gemeenschap</Tag> is <i>fard kifaya</i>: doet een
            groep het, dan is het gedaan voor iedereen; doet niemand het, dan valt het de hele
            buurt aan te rekenen. <Tag soort="k">Sterk aanbevolen</Tag> laat je niet zomaar
            lopen, maar er staat geen zonde op.
          </p>
        </div>
      </div>

      {BIJZONDER.map((b) => (
        <div key={b.id}>
          <Onderwerpkaart b={b} />
          {b.id === 'janaza' && <Rouw />}
        </div>
      ))}

      <div className="card plat">
        <p className="klein">
          Verschillen tussen de scholen zijn hier groter dan bij het dagelijkse gebed, en
          gebruiken verschillen ook per land en per moskee. Wat hier staat, is de Malikitische
          lijn zoals die in Marokko en hier in de moskee gevolgd wordt. Sta je ergens anders mee
          te bidden: kijk naar de imam en doe hem na. Twijfel je: vraag het hem gewoon, na het
          gebed.
        </p>
      </div>
    </div>
  )
}

/** Het rouwblok hoort direct achter het gebed bij een overledene: wie dat
 *  opzoekt, zoekt op dat moment ook de rest. */
function Rouw(): ReactNode {
  return (
    <div className="card" id="rond-overlijden">
      <h3>Rond een overlijden</h3>
      <p className="klein" style={{ marginTop: 6 }}>
        Er gebeurt in die dagen meer dan het gebed alleen, en het gaat snel. Dit is de volgorde,
        zodat je niets hoeft op te zoeken op een moment dat opzoeken niet lukt.
      </p>
      <div className="stack" style={{ marginTop: 14 }}>
        {ROUW.map((r, i) => (
          <div className="kader" key={r.t}>
            <div className="rij tussen"><h4>{r.t}</h4><span className="meta">{i + 1}</span></div>
            <Rijk als="p" className="klein" style={{ marginTop: 5 }} html={r.d} />
            {(r.zeg ?? []).map((k) => { const w = T[k]; return w ? <Tekstblok key={k} o={w} /> : null })}
          </div>
        ))}
      </div>
      <div className="kader let" style={{ marginTop: 14 }}>
        <h4>Voor kinderen</h4>
        <p>
          De dood is in dit geloof geen geheim en geen spookverhaal. Vragen stellen mag, meelopen
          mag, en verdrietig zijn hoort erbij. Wat je niet hoeft te doen is doen alsof je het
          niet erg vindt.
        </p>
      </div>
    </div>
  )
}

export function Duas({ t }: { t: Toestand }): ReactNode {
  useEffect(() => {
    if (t.pr.duasGezien < DUAS.length) {
      t.zetProf((p) => {
        const uit = puntenErbij({ ...p, duasGezien: DUAS.length }, 5, t.klok.vandaag, t.klok.gisteren)
        return checkInsignes(uit, t.spoor).stand
      })
    }
  }, [])

  return (
    <div className="stack">
      <div className="card">
        <h2>Du'a's voor de dag</h2>
        <p className="klein" style={{ marginTop: 6 }}>
          Kleine zinnen die de dag optillen. Leer er eentje per week; over een paar maanden ken
          je ze allemaal.
        </p>
      </div>
      <div className="stack">
        {DUAS.map((d, i) => (
          <div className="card" key={d.w}>
            <p className="meta">{d.w}</p>
            <Tekstblok o={{ ar: d.ar, tr: d.tr, nl: d.nl, aid: `d:${i + 1}` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Fouten(): ReactNode {
  return (
    <div className="stack">
      <div className="card">
        <h2>Als het misgaat</h2>
        <p className="klein" style={{ marginTop: 6 }}>
          Iedereen vergeet weleens iets in het gebed. Daar is een oplossing voor, en die heet de{' '}
          <b>knieval van vergetelheid</b> (sujud as-sahw): twee gewone knievallen om het recht te
          zetten.
        </p>
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div className="kader">
            <h4>Iets vergeten</h4>
            <p>
              Ben je twee of meer sterk aanbevolen onderdelen vergeten, dan doe je twee
              knievallen <b>vóór</b> de slotgroet.
            </p>
          </div>
          <div className="kader let">
            <h4>Iets te veel gedaan</h4>
            <p>
              Heb je iets toegevoegd — een rak'a te veel, een extra buiging — dan doe je twee
              knievallen <b>na</b> de slotgroet, en geef je daarna opnieuw de groet.
            </p>
          </div>
        </div>
        <p className="klein" style={{ marginTop: 12 }}>
          Is er zowel iets vergeten als iets te veel gedaan, dan gaan de knievallen vóór de
          slotgroet. Weet je het niet zeker: ga altijd uit van het laagste aantal dat je zeker
          weet.
        </p>
      </div>

      <div className="card">
        <h3>Wat doe ik als…</h3>
        <div className="stack" style={{ marginTop: 12 }}>
          {FOUTEN.map((f) => (
            <details
              key={f.v}
              style={{
                border: '1px solid var(--line)', borderRadius: 9, padding: '12px 14px',
                background: 'var(--surface-2)',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--ink)' }}>{f.v}</summary>
              <Rijk als="p" className="klein" style={{ marginTop: 9 }} html={f.a} />
            </details>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Wat het gebed ongeldig maakt</h3>
        <ul className="net" style={{ marginTop: 9 }}>
          <li>Met opzet praten, lachen of eten</li>
          <li>Weglopen of je met opzet van de qibla afdraaien</li>
          <li>Een verplicht onderdeel weglaten (bijvoorbeeld al-Fatiha vergeten)</li>
          <li>Je wassing verliezen</li>
          <li>Veel bewegen dat niets met het gebed te maken heeft</li>
        </ul>
        <p className="klein" style={{ marginTop: 11 }}>
          Gebeurt zoiets, dan begin je gewoon opnieuw. Dat is geen straf; dat is hoe het werkt.
        </p>
      </div>
    </div>
  )
}
