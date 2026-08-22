/**
 * HET OUDERSCHERM
 *
 * Op slot, ook als er geen code is ingesteld — dan geldt de standaardcode.
 * Zonder slot zet een kind hier in vijf minuten de stemmen, het weekbudget en
 * de gebedstijden om, en dat is precies wat dit scherm niet moet toelaten.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { euro } from '@/gedeeld/getal'
import { MODULES } from '../gegevens/modules'
import { METHODEN } from '../gebedstijden'
import type { Asr, Hoog, MethodeId } from '../gebedstijden'
import { TARIEF, leegProg } from '../opslag'
import type { Gezin, Instellingen, Profiel } from '../opslag'
import { leeftijd, niveauVan, spoorVan } from '../voortgang'
import { AUDIO, STEM } from '../geluid'
import { Blad, Melding } from '../onderdelen'
import { Stemstudio } from './Stemstudio'
import type { Toestand } from '../toestand'

const KLEUREN = ['#0F6F6C', '#175D92', '#5B3B7A', '#7E5300', '#2F6B1F', '#9F2F2D']

export function Ouder({ t }: { t: Toestand }): ReactNode {
  const [open, zetOpen] = useState(false)
  const [pin, zetPin] = useState('')
  const [mis, zetMis] = useState('')

  if (!open) {
    const proberen = (): void => {
      if (pin === (t.stand.gezin.ouderPin || '1234')) { zetOpen(true); return }
      zetMis('Dat is hem niet.')
      zetPin('')
    }
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <h1>Ouderscherm</h1>
        <p className="klein" style={{ marginTop: 8 }}>
          Dit scherm is voor papa en mama. Voer de code in om verder te gaan.
        </p>
        <label className="veld">
          <span>Code</span>
          <input
            type="password" inputMode="numeric" value={pin}
            onChange={(e) => { zetPin(e.target.value); zetMis('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') proberen() }}
          />
        </label>
        <div className="rij" style={{ marginTop: 14 }}>
          <button className="btn" onClick={proberen}>Openen</button>
        </div>
        <Melding tekst={mis} soort="fout" />
      </div>
    )
  }
  return <Binnen t={t} />
}

function Binnen({ t }: { t: Toestand }): ReactNode {
  const { stand, wolk, klok: k } = t
  const g = stand.gezin
  const [studio, zetStudio] = useState(false)
  const [wMeld, zetWMeld] = useState<{ tekst: string; soort?: 'goed' | 'fout' }>({ tekst: '' })
  const [nMeld, zetNMeld] = useState<{ tekst: string; soort?: 'goed' | 'fout' }>({ tekst: '' })
  const [acc, zetAcc] = useState('')
  const [pin, zetPin] = useState('')
  const [naam, zetNaam] = useState('')
  const [geb, zetGeb] = useState('')
  const [weg, zetWeg] = useState<string | null>(null)

  const zetGezin = (v: Partial<Gezin>): void => t.zet((s) => ({ ...s, gezin: { ...s.gezin, ...v } }))
  const zetInstel = (v: Partial<Instellingen>): void =>
    t.zet((s) => ({ ...s, instel: { ...s.instel, ...v } }))

  const voegProfiel = (n: string, j: number): void => t.zet((s) => {
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
    const p: Profiel = { id, naam: n, geb: j, kleur: KLEUREN[s.profielen.length % KLEUREN.length] as string }
    return {
      ...s,
      profielen: [...s.profielen, p],
      data: { ...s.data, [id]: leegProg() },
      actief: s.actief ?? id,
    }
  })

  const totaalLessen = MODULES.reduce((s, m) => s + m.lessen.length, 0)

  return (
    <>
      <div>
        <h1>Ouderscherm</h1>
        <p className="klein" style={{ marginTop: 6 }}>
          Hier stel je de kinderen, het weekbudget, de gebedstijden en de synchronisatie in — en
          hier betaal je uit.
        </p>
      </div>

      <div className="card">
        <h3>De kinderen</h3>
        <div className="stack" style={{ marginTop: 12 }}>
          {stand.profielen.length ? stand.profielen.map((p) => {
            const pr = stand.data[p.id] ?? leegProg()
            const nv = niveauVan(pr.punten)
            return (
              <div className="card plat" key={p.id} style={{ background: 'var(--surface-2)' }}>
                <div className="rij tussen">
                  <div className="rij">
                    <span className="bol" style={{ background: p.kleur }}>{p.naam[0]}</span>
                    <div>
                      <b>{p.naam}</b>
                      <span className="klein">
                        {' '}· {leeftijd(p, k.jaar)} jaar · spoor {spoorVan(p, k.jaar)} · {nv.naam}
                      </span>
                      <div className="klein">
                        {Object.values(pr.lessen).filter((x) => x.klaar).length} lessen ·{' '}
                        {Object.values(pr.hifz).filter((x) => x.gehaald).length} teksten uit het
                        hoofd · {pr.reeks} dagen op rij
                      </div>
                    </div>
                  </div>
                  <div className="rij">
                    <span className={`tag ${pr.saldo > 0 ? 'goed' : ''}`}>{euro(pr.saldo)}</span>
                    <button
                      className="btn sm" disabled={pr.saldo <= 0}
                      onClick={() => t.zet((s) => {
                        const q = s.data[p.id]
                        if (!q || q.saldo <= 0) return s
                        return {
                          ...s,
                          data: {
                            ...s.data,
                            [p.id]: {
                              ...q,
                              betalingen: [...q.betalingen, { d: k.vandaag, b: q.saldo }],
                              saldo: 0,
                            },
                          },
                        }
                      })}
                    >Uitbetaald</button>
                    <button
                      className="icoon" title="Verwijderen"
                      onClick={() => {
                        if (weg !== p.id) { zetWeg(p.id); return }
                        zetWeg(null)
                        t.zet((s) => {
                          const data = { ...s.data }
                          delete data[p.id]
                          const rest = s.profielen.filter((x) => x.id !== p.id)
                          return {
                            ...s, profielen: rest, data,
                            actief: s.actief === p.id ? (rest[0]?.id ?? null) : s.actief,
                          }
                        })
                      }}
                    >{weg === p.id ? '⚠️' : '🗑'}</button>
                  </div>
                </div>
                {weg === p.id && (
                  <p className="melding fout">
                    Profiel van {p.naam} verwijderen? De voortgang gaat weg. Tik nogmaals op het
                    prullenbakje.
                  </p>
                )}
              </div>
            )
          }) : <p className="klein">Nog geen kinderen. Voeg ze hieronder toe.</p>}
        </div>

        <div className="rij" style={{ marginTop: 14, alignItems: 'flex-end' }}>
          <label className="veld kort" style={{ marginTop: 0 }}>
            <span>Naam</span>
            <input placeholder="Bijvoorbeeld Selma" value={naam} onChange={(e) => zetNaam(e.target.value)} />
          </label>
          <label className="veld kort" style={{ marginTop: 0, maxWidth: 130 }}>
            <span>Geboortejaar</span>
            <input inputMode="numeric" placeholder="2016" value={geb} onChange={(e) => zetGeb(e.target.value)} />
          </label>
          <button
            className="btn"
            onClick={() => {
              const j = parseInt(geb, 10)
              if (!naam.trim() || !j || j < 2000 || j > k.jaar) {
                zetNMeld({ tekst: 'Vul een naam en een geboortejaar in.', soort: 'fout' })
                return
              }
              voegProfiel(naam.trim(), j)
              zetNaam('')
              zetGeb('')
              zetNMeld({ tekst: '' })
            }}
          >Toevoegen</button>
        </div>
        <Melding {...nMeld} />
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Beloning</h3>
          <label className="veld">
            <span>Weekbudget per kind</span>
            <input
              inputMode="decimal" defaultValue={g.budget}
              onChange={(e) => {
                const x = parseFloat(e.target.value.replace(',', '.'))
                if (!isNaN(x) && x >= 0) zetGezin({ budget: x })
              }}
            />
          </label>
          <label className="veld">
            <span>Telt het afvinken van een gebed mee voor geld?</span>
            <select
              value={g.gebedTelt ? 'ja' : 'nee'}
              onChange={(e) => zetGezin({ gebedTelt: e.target.value === 'ja' })}
            >
              <option value="nee">Nee — alleen leren levert geld op</option>
              <option value="ja">
                Ja — {euro(TARIEF.gebed)} per gebed, max {euro(TARIEF.gebedDagMax)} per dag
              </option>
            </select>
          </label>
          <div className="kader let" style={{ marginTop: 14 }}>
            <h4>Waarom dit standaard uitstaat</h4>
            <p>
              Geld werkt goed als beloning voor <i>leren</i>: een les halen, een soera echt
              kennen, een examen doen. Dat is meetbaar en het went niet snel. Het gebed zelf is
              aanbidding; als daar een tarief aan hangt, verschuift de reden waarom een kind
              bidt. Voor het gebed werkt de stickerkaart, de reeks en een compliment beter. Wil
              je het toch anders, dan zet je het hier om — het is jouw keuze en de app rekent
              gewoon mee.
            </p>
          </div>
        </div>

        <div className="card">
          <h3>Plaats en gebedstijden</h3>
          <label className="veld">
            <span>Plaatsnaam</span>
            <input defaultValue={g.plaats} onChange={(e) => zetGezin({ plaats: e.target.value || 'Onbekend' })} />
          </label>
          <div className="rij" style={{ gap: 10 }}>
            <label className="veld kort" style={{ maxWidth: 150 }}>
              <span>Breedtegraad</span>
              <input
                inputMode="decimal" defaultValue={g.lat}
                onChange={(e) => {
                  const x = parseFloat(e.target.value.replace(',', '.'))
                  if (!isNaN(x) && Math.abs(x) <= 90) zetGezin({ lat: x })
                }}
              />
            </label>
            <label className="veld kort" style={{ maxWidth: 150 }}>
              <span>Lengtegraad</span>
              <input
                inputMode="decimal" defaultValue={g.lon}
                onChange={(e) => {
                  const x = parseFloat(e.target.value.replace(',', '.'))
                  if (!isNaN(x) && Math.abs(x) <= 180) zetGezin({ lon: x })
                }}
              />
            </label>
          </div>
          <label className="veld">
            <span>Methode</span>
            <select value={g.methode} onChange={(e) => zetGezin({ methode: e.target.value as MethodeId })}>
              {(Object.keys(METHODEN) as MethodeId[]).map((x) => (
                <option value={x} key={x}>{METHODEN[x].n}</option>
              ))}
            </select>
          </label>
          <label className="veld">
            <span>Asr</span>
            <select value={g.asr} onChange={(e) => zetGezin({ asr: Number(e.target.value) as Asr })}>
              <option value="1">Schaduw × 1 (Maliki, Shafi'i, Hanbali)</option>
              <option value="2">Schaduw × 2 (Hanafi)</option>
            </select>
          </label>
          <label className="veld">
            <span>Zomernachten in Nederland</span>
            <select value={g.hoog} onChange={(e) => zetGezin({ hoog: e.target.value as Hoog })}>
              <option value="zevende">Nacht in zevenen (gebruikelijk)</option>
              <option value="midden">Nacht in tweeën</option>
              <option value="geen">Geen aanpassing (kan wegvallen)</option>
            </select>
          </label>
          <p className="klein" style={{ marginTop: 10 }}>
            In juni komt de zon in Nederland 's nachts niet ver genoeg onder de horizon voor de
            gebruikelijke hoeken. Zonder aanpassing verdwijnen Fajr en Isha dan van de kalender;
            met de regel "nacht in zevenen" krijg je bruikbare tijden. Vergelijk ze een keer met
            je moskee en kies wat daarbij past.
          </p>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Instellingen van de app</h3>
          <label className="veld">
            <span>Geluid</span>
            <select
              value={stand.instel.geluid ? '1' : '0'}
              onChange={(e) => zetInstel({ geluid: e.target.value === '1' })}
            ><option value="1">Aan</option><option value="0">Uit</option></select>
          </label>
          <label className="veld">
            <span>Voorlezen door de stem van het toestel</span>
            <select
              value={stand.instel.stem ? '1' : '0'}
              onChange={(e) => zetInstel({ stem: e.target.value === '1' })}
            >
              <option value="1">Aan — ook waar geen opname is</option>
              <option value="0">Uit — alleen echte opnames</option>
            </select>
          </label>
          <p className="klein" style={{ marginTop: 6 }}>
            Zet dit uit als de voorleesstem meer stoort dan helpt. De recitatie en de opnames van
            thuis blijven dan gewoon spelen; waar niets is, blijft het stil.
          </p>
          <label className="veld">
            <span>Het Arabisch</span>
            <select
              value={stand.instel.alleenEcht ? '1' : '0'}
              onChange={(e) => zetInstel({ alleenEcht: e.target.value === '1' })}
            >
              <option value="1">Alleen echte opnames (aanbevolen)</option>
              <option value="0">Ook de stem van het toestel als er geen opname is</option>
            </select>
          </label>
          <p className="klein" style={{ marginTop: 6 }}>
            Staat dit op "alleen echte opnames", dan hoor je alleen de recitatie van de
            reciteerder en de opnames die thuis zijn ingesproken. Waar niets is blijft het stil,
            met een regel erbij. Dat is bewust: een voorleesstem uit een telefoon legt de
            klemtonen verkeerd, en dat is bij de Koran geen detail.
          </p>
          <label className="veld">
            <span>Snelheid van het Arabisch</span>
            <select
              value={String(stand.instel.arTempo)}
              onChange={(e) => zetInstel({ arTempo: parseFloat(e.target.value) })}
            >
              <option value="0.6">Heel langzaam</option>
              <option value="0.75">Langzaam</option>
              <option value="0.85">Rustig</option>
              <option value="1">Gewoon</option>
            </select>
          </label>

          {!stand.instel.alleenEcht && (
            <>
              <label className="veld">
                <span>Arabische stem van het toestel</span>
                <select
                  value={stand.instel.arStem}
                  onChange={(e) => { zetInstel({ arStem: e.target.value }); STEM.zoek(e.target.value) }}
                >
                  {STEM.arLijst.length
                    ? STEM.arLijst.map((v) => (
                      <option value={v.name} key={v.name}>{v.name} ({v.lang})</option>
                    ))
                    : <option value="">Geen Arabische stem gevonden</option>}
                </select>
              </label>
              <label className="veld">
                <span>Klinkertekens meelezen</span>
                <select
                  value={stand.instel.harakat ? '1' : '0'}
                  onChange={(e) => zetInstel({ harakat: e.target.value === '1' })}
                >
                  <option value="1">Ja — met de tekens (meestal beter)</option>
                  <option value="0">Nee — zonder de tekens</option>
                </select>
              </label>
              <div className="kader let" style={{ marginTop: 12 }}>
                <h4>De stem klinkt niet goed. Wat kun je doen?</h4>
                <p>
                  De stem komt uit de telefoon zelf, niet uit deze app. Op een iPhone staat
                  standaard de <b>kleine</b> Arabische stem; die klinkt vlak en legt de klemtoon
                  vaak verkeerd. Download de verbeterde versie via <b>Instellingen →
                  Toegankelijkheid → Gesproken materiaal → Stemmen → Arabisch</b> en kies daar de
                  variant met de grootste download. Helpt dat niet genoeg, zet dan de
                  klinkertekens uit — sommige stemmen struikelen erover.
                </p>
                <p style={{ marginTop: 8 }}>
                  Blijft het onvoldoende, en dat is het meestal: zet hierboven "alleen echte
                  opnames" aan en spreek de teksten zelf in met de knop verderop. Voor het
                  voorzeggen van de Koran is een stem uit een telefoon niet bedoeld.
                </p>
              </div>
            </>
          )}

          <label className="veld">
            <span>Tempo bij meebidden en voorlezen</span>
            <select
              value={String(stand.instel.tempo)}
              onChange={(e) => zetInstel({ tempo: parseFloat(e.target.value) })}
            >
              <option value="0.8">Rustig</option>
              <option value="1">Gewoon</option>
              <option value="1.3">Vlot</option>
            </select>
          </label>
          <label className="veld">
            <span>Grote letters</span>
            <select
              value={stand.instel.groot ? '1' : '0'}
              onChange={(e) => zetInstel({ groot: e.target.value === '1' })}
            ><option value="0">Nee</option><option value="1">Ja</option></select>
          </label>
          <label className="veld">
            <span>Code voor het ouderscherm</span>
            <input
              defaultValue={g.ouderPin} inputMode="numeric"
              onChange={(e) => zetGezin({ ouderPin: e.target.value.trim() || '1234' })}
            />
          </label>
          {g.ouderPin === '1234' && (
            <div className="kader let" style={{ marginTop: 10 }}>
              <h4>Verander deze code</h4>
              <p>
                Hij staat nog op <b>1234</b>, en dat raadt een kind binnen een minuut. Vul
                hierboven iets anders in — dat is het enige dat dit scherm dichthoudt.
              </p>
            </div>
          )}
          <p className="klein" style={{ marginTop: 10 }}>
            Gevonden op dit toestel: <b>{STEM.arLijst.length}</b> Arabische{' '}
            {STEM.arLijst.length === 1 ? 'stem' : 'stemmen'}
            {STEM.nl ? ', en een Nederlandse stem' : ', geen Nederlandse stem'}.
          </p>
        </div>

        <div className="card">
          <h3>Centrale opslag</h3>
          <p className="klein" style={{ marginTop: 5 }}>
            Met een gezinsaccount staat de voortgang op elk toestel gelijk. Zonder internet werkt
            alles gewoon door; bij de volgende verbinding wordt het samengevoegd — er gaat nooit
            iets verloren.
          </p>
          <p className="klein" style={{ marginTop: 9 }}>
            <span className={`tag ${wolk.aan ? 'goed' : ''}`}>
              {wolk.aan ? `Ingelogd als ${wolk.account}` : 'Alleen op dit toestel'}
            </span>
          </p>
          {wolk.aan ? (
            <div className="rij" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => { wolk.uitloggen(); zetWMeld({ tekst: '' }) }}>
                Uitloggen
              </button>
              <button
                className="btn ghost" disabled={wolk.bezig}
                onClick={() => void (async () => {
                  zetWMeld({ tekst: 'Bezig…' })
                  const ok = await t.gelijktrekken()
                  zetWMeld(ok
                    ? { tekst: 'Gelijkgetrokken.', soort: 'goed' }
                    : { tekst: 'Kon de centrale kopie niet ophalen. Er is niets verloren gegaan.', soort: 'fout' })
                })()}
              >Nu gelijktrekken</button>
            </div>
          ) : (
            <>
              <label className="veld">
                <span>Account</span>
                <input placeholder="benna" value={acc} onChange={(e) => zetAcc(e.target.value)} />
              </label>
              <label className="veld">
                <span>Wachtwoord</span>
                <input type="password" value={pin} onChange={(e) => zetPin(e.target.value)} />
              </label>
              <div className="rij" style={{ marginTop: 14 }}>
                <button
                  className="btn"
                  onClick={() => void (async () => {
                    if (!acc.trim() || !pin) return
                    zetWMeld({ tekst: 'Bezig…' })
                    try {
                      await wolk.inloggen(acc.trim(), pin)
                      zetPin('')
                      await t.gelijktrekken()
                      zetWMeld({ tekst: 'Ingelogd en gelijkgetrokken.', soort: 'goed' })
                    } catch (e) {
                      zetWMeld({ tekst: e instanceof Error ? e.message : 'Inloggen mislukte.', soort: 'fout' })
                    }
                  })()}
                >Inloggen</button>
                <button
                  className="btn ghost"
                  onClick={() => void (async () => {
                    if (!acc.trim() || pin.length < 4) {
                      zetWMeld({
                        tekst: 'Kies een naam en een wachtwoord van minstens vier tekens.', soort: 'fout',
                      })
                      return
                    }
                    zetWMeld({ tekst: 'Bezig…' })
                    try {
                      await wolk.registreren(acc.trim(), pin, stand)
                      zetPin('')
                      zetWMeld({ tekst: 'Account aangemaakt.', soort: 'goed' })
                    } catch (e) {
                      zetWMeld({ tekst: e instanceof Error ? e.message : 'Aanmaken mislukte.', soort: 'fout' })
                    }
                  })()}
                >Nieuw account</button>
              </div>
            </>
          )}
          <Melding {...wMeld} />
        </div>
      </div>

      <div className="card">
        <h3>Hoe dit programma in elkaar zit</h3>
        <p className="klein" style={{ marginTop: 8 }}>
          Het leerpad heeft {MODULES.length} modules met samen {totaalLessen} lessen. Elk kind
          krijgt de versie die bij zijn leeftijd hoort: 7–9 jaar korte teksten, 10–12 de gewone
          versie, 13–15 met verdieping erbij. De fiqh volgt de Malikitische school; waar andere
          scholen het anders doen staat dat erbij, zonder oordeel.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          Het gebedsonderdeel bestaat uit de wassing, de onderdelen van het gebed op volgorde,
          een meebid-oefening voor elk van de vijf gebeden, de teksten om uit het hoofd te leren,
          een overzicht van alle gebeden, de bijzondere gebeden, de du'a's van de dag, en wat te
          doen als het misgaat. Er zijn twee examens: de wassing en het gebed op volgorde.
        </p>
        <p className="klein" style={{ marginTop: 8 }}>
          De Arabische teksten zijn met zorg overgenomen, maar controleer ze een keer naast een
          moshaf of met de imam voordat een kind ze uit het hoofd leert — dat is nooit verkeerd.
        </p>
        <div className="rij" style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => zetStudio(true)}>🎙 Eigen stem opnemen</button>
          <button
            className="btn ghost sm"
            onClick={() => {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(
                new Blob([JSON.stringify(stand, null, 2)], { type: 'application/json' }))
              a.download = `noer-${k.vandaag}.json`
              a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 2000)
            }}
          >Gegevens opslaan als bestand</button>
        </div>
        <p className="klein" style={{ marginTop: 9 }}>
          Ingesproken op dit toestel: <b>{AUDIO.eigenIds().length}</b>{' '}
          {AUDIO.eigenIds().length === 1 ? 'fragment' : 'fragmenten'}. Voor de soera's komt het
          geluid uit de recitatie; de zinnen van het gebed en de du'a's spreek je hier zelf in.
        </p>
      </div>

      <Blad open={studio} sluit={() => zetStudio(false)}>
        {studio && <Stemstudio nu={k.vandaag} sluit={() => zetStudio(false)} />}
      </Blad>
    </>
  )
}
