/**
 * VANDAAG — het scherm waar de dag op gebeurt.
 *
 * Overgezet uit vwVandaag(). De inhoud is ongewijzigd; wat wél verandert is dat
 * het tekstvak niet meer leegloopt zodra er elders iets verandert. In de oude
 * opzet werd bij elke wijziging het hele scherm opnieuw opgebouwd, en dan
 * verdween wat je aan het typen was.
 */
import { useState } from 'react'
import { Balk, Chip, Kaart, Knop, Kop, Rij, Spin, Tussen, Uitleg } from '../onderdelen/basis'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL, langNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Regel } from '@/gedeeld/db/tabellen'
import type { Analyse, DagMetTotalen } from '../rekenkern'
import { herken, leesFoto } from '../ai'
import type { Herkenning } from '../ai'
import type { NieuweRegel } from '@/gedeeld/db/rpc'

export interface VandaagEigenschappen {
  a: Analyse
  dag: DagMetTotalen
  regels: Regel[]
  datum: IsoDatum
  eiwitPerKg: number
  token: string
  zetDatum: (d: IsoDatum) => void
  zetDagveld: (veld: string, waarde: string | number | boolean | null) => void
  voegRegelsToe: (r: NieuweRegel[]) => void
  wisRegel: (id: string) => void
}

export function Vandaag(p: VandaagEigenschappen) {
  const { a, dag, regels, datum } = p
  const isVandaag = datum === vandaag()
  const gewogen = dag.gewicht_kg != null
  const eiwitPct = Math.min(100, (dag._eiwit / a.eiwitDoel) * 100)
  const kcalPct = a.doel ? Math.min(100, (dag._kcal / a.doel) * 100) : 0

  /* Hoeveel wegingen er nog nodig zijn voordat het model iets durft te zeggen.
     Dat getal is de enige zinvolle aanmoediging die de app kan geven: het is
     geen streefcijfer maar een telling. */
  const nogNodig = Math.max(0, 7 - a.wPunten.length)

  return (
    <>
      <Tussen style={{ marginBottom: 12 }}>
        <Knop klein opKlik={() => p.zetDatum(plusDagen(datum, -1))} titel="Vorige dag">←</Knop>
        <span style={{ fontSize: '.88rem', fontWeight: 500 }}>
          {isVandaag ? 'Vandaag' : langNL(datum)}
        </span>
        <Knop klein uit={isVandaag} titel="Volgende dag"
              opKlik={() => { const n = plusDagen(datum, 1); if (n <= vandaag()) p.zetDatum(n) }}>
          →
        </Knop>
      </Tussen>

      <Weging {...p} gewogen={gewogen} isVandaag={isVandaag} nogNodig={nogNodig} />

      <Kaart>
        <div className="duo">
          <div>
            <Kop>Eiwit</Kop>
            <div style={{ marginTop: 3 }}>
              <span className="getal" style={{ fontSize: '2.1rem' }}>{Math.round(dag._eiwit)}</span>
              <span className="klein"> van {a.eiwitDoel} g</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Balk deel={eiwitPct} toon={dag._eiwit >= a.eiwitDoel * 0.9 ? 'goed' : 'let'} />
            </div>
            <div className="mini cijfer" style={{ marginTop: 4 }}>
              {dec(p.eiwitPerKg, 1)} g/kg op {dec(a.eiwitRef, 0)} kg gecorrigeerd
            </div>
          </div>
          <div>
            <Kop>Energie gelogd</Kop>
            <div style={{ marginTop: 3 }}>
              <span className="getal" style={{ fontSize: '2.1rem' }}>{dz(Math.round(dag._kcal))}</span>
              <span className="klein"> kcal{a.doel ? ` van ${dz(a.doel)}` : ''}</span>
            </div>
            {a.doel != null ? (
              <>
                <div style={{ marginTop: 8 }}>
                  <Balk deel={kcalPct} toon={dag._kcal > a.doel * 1.1 ? 'let' : undefined} />
                </div>
                <div className="mini cijfer" style={{ marginTop: 4 }}>
                  nog {dz(Math.max(0, a.doel - Math.round(dag._kcal)))} kcal · interval van vandaag{' '}
                  {dz(Math.round(dag._laag))}–{dz(Math.round(dag._hoog))}
                </div>
              </>
            ) : (
              <p className="mini" style={{ marginTop: 8 }}>
                Nog geen doel — het model heeft eerst een weegreeks nodig.
              </p>
            )}
          </div>
        </div>
        <Uitleg id="eiwitref" label="waarom op gecorrigeerd gewicht">
          <p>
            Het eiwitdoel staat op gecorrigeerd gewicht en niet op je werkelijke gewicht: vetmassa
            vraagt nauwelijks eiwit, dus rekenen op 119 kilo geeft een doel dat niemand haalt en dat
            nergens op slaat. De correctie kapt het referentiegewicht af op BMI 30, wat voor jou{' '}
            {dec(a.eiwitRef, 0)} kilo geeft.
          </p>
          <p>
            Waarom het hoog staat: bij een tekort is eiwit wat bepaalt of je gewichtsverlies uit vet
            komt of ook uit spier. Dat is de post waar in jouw Yazio-reeks het meeste te winnen viel.
          </p>
        </Uitleg>
        {dag._kcal > 0 && dag._kcal < 1200 && !isVandaag && (
          <Kaart toon="let" plat style={{ margin: '12px 0 0' }}>
            <p style={{ fontSize: '.84rem' }}>
              Onder 1.200 kcal. Waarschijnlijker een onvolledige registratie dan een echte dag. Het
              model laat deze dag buiten de berekening en toont hem niet als succes.
            </p>
          </Kaart>
        )}
      </Kaart>

      <Herkennen token={p.token} datum={datum} voegRegelsToe={p.voegRegelsToe} />

      {regels.length > 0 && (
        <Kaart>
          <Kop>Gelogd op {kortNL(datum)}</Kop>
          <div className="lijst" style={{ marginTop: 4 }}>
            {regels.map((r) => (
              <div key={r.id}>
                <Chip graad={r.conf} />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.87rem', display: 'block' }}>{r.naam}</span>
                  <span className="mini cijfer">
                    {r.kcal_laag != null && `${dz(r.kcal_laag)}–${dz(r.kcal_hoog)} kcal`}
                    {r.nevo_code && ' · NEVO'}
                    {r.dish_id && ' · bibliotheek'}
                    {r.onzekerheidsbronnen?.[0] && ' · ' + r.onzekerheidsbronnen[0]}
                  </span>
                </span>
                <span style={{ textAlign: 'right', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                  <span className="cijfer" style={{ fontSize: '.85rem', display: 'block' }}>
                    {dz(Math.round(r.kcal_punt))}
                  </span>
                  <span className="mini cijfer">{dec(r.eiwit_g, 1)} g</span>
                </span>
                <Knop klein titel="Verwijderen" opKlik={() => p.wisRegel(r.id)}>×</Knop>
              </div>
            ))}
          </div>
        </Kaart>
      )}

      <Kaart>
        <Kop>Beweging en slaap</Kop>
        <Rij style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <label className="veld">
            <span>stappen</span>
            <input className="smal" type="number" inputMode="numeric"
                   defaultValue={dag.stappen ?? ''} key={'st' + datum}
                   onBlur={(e) => p.zetDagveld('stappen', e.target.value || null)} />
          </label>
          <label className="veld">
            <span>slaap, uur</span>
            <input className="smaller" type="number" step="0.25" inputMode="decimal"
                   key={'sl' + datum}
                   defaultValue={dag.slaap_min != null ? Math.round(dag.slaap_min / 15) / 4 : ''}
                   onBlur={(e) => p.zetDagveld(
                     'slaap_min', e.target.value === '' ? null : Math.round(parseFloat(e.target.value) * 60))} />
          </label>
          <Knop vol={!!dag.kracht} opKlik={() => p.zetDagveld('kracht', !dag.kracht)}>
            {dag.kracht ? '✓ ' : ''}kracht
          </Knop>
        </Rij>
        <Uitleg id="beweging" label="waarom stappen hier alleen staan">
          <p>
            Stappen en slaap staan hier omdat ze ergens vandaan moeten komen, niet omdat het model
            ermee rekent. De actieve energie die je horloge erbij optelt gaat nooit naar het doel: die
            fout is twintig tot vijftig procent en niet consistent in één richting, dus corrigeren kan
            niet.
          </p>
          <p>
            Wat stappen wél doen, doen ze via de weegschaal. Beweeg je structureel meer, dan verschuift
            de helling, en dat ziet het model vanzelf — zonder dat er iets bij opgeteld hoeft te worden.
          </p>
        </Uitleg>
      </Kaart>
    </>
  )
}

function Weging(
  { dag, datum, gewogen, isVandaag, nogNodig, zetDagveld }:
  VandaagEigenschappen & { gewogen: boolean; isVandaag: boolean; nogNodig: number },
) {
  return (
    <Kaart toon={!gewogen && isVandaag ? 'let' : undefined}
           style={!gewogen && isVandaag ? undefined : { paddingTop: 14, paddingBottom: 14 }}>
      <Tussen>
        <Kop>Ochtendweging</Kop>
        {gewogen && <span className="mini" style={{ color: 'var(--goed)' }}>✓ gedaan</span>}
      </Tussen>
      <Rij style={{ marginTop: 8, alignItems: 'center' }}>
        <input className="smal" type="number" step="0.1" inputMode="decimal" placeholder="—"
               key={'gw' + datum} defaultValue={dag.gewicht_kg ?? ''}
               onBlur={(e) => zetDagveld('gewicht_kg', e.target.value || null)}
               style={!gewogen && isVandaag ? { fontSize: '1.25rem', width: 104 } : undefined} />
        <span className="klein">
          kg{!gewogen && ' · nuchter, na het toilet, vóór het eten'}
        </span>
      </Rij>
      {!gewogen && isVandaag && nogNodig > 0 && (
        <p className="mini" style={{ marginTop: 8 }}>
          Nog {nogNodig} weging{nogNodig === 1 ? '' : 'en'} voordat het model een verbruik met interval
          kan tonen.
        </p>
      )}
      <Uitleg id="weging" label="waarom dit de kern is">
        <p>
          Dit is de enige invoer die niet te schatten valt, en het enige onbevooroordeelde signaal in
          het systeem. Alles wat je eet gaat door een schatting heen; de weegschaal niet.
        </p>
        <p>
          Nuchter, na het toilet, vóór het eten — steeds op dezelfde manier, want het gaat om het
          verschil tussen dagen en niet om de absolute waarde. Dagelijkse schommelingen van één tot
          twee kilo zijn vocht, glycogeen en darminhoud. Daarom leest het model de helling en niet de
          meting.
        </p>
      </Uitleg>
    </Kaart>
  )
}

/** Zeggen wat je at, in tekst of met een foto. */
function Herkennen(
  { token, datum, voegRegelsToe }:
  { token: string; datum: IsoDatum; voegRegelsToe: (r: NieuweRegel[]) => void },
) {
  const [tekst, zetTekst] = useState('')
  const [melding, zetMelding] = useState<string | null>(null)
  const [loopt, zetLoopt] = useState(false)
  const [concept, zetConcept] = useState<Herkenning | null>(null)

  async function doe(soort: 'tekst' | 'foto', foto?: File) {
    if (soort === 'tekst' && !tekst.trim()) {
      zetMelding('Schrijf eerst op wat je gegeten hebt.')
      return
    }
    zetLoopt(true)
    zetMelding(null)
    try {
      const fotos = foto ? [await leesFoto(foto)] : []
      const uit = await herken(token, soort, tekst.trim(), fotos)
      zetConcept(uit)
      zetTekst('')
    } catch (e) {
      zetMelding(e instanceof Error ? e.message : String(e))
    } finally {
      zetLoopt(false)
    }
  }

  const totaal = concept?.regels.reduce(
    (a, r) => ({
      p: a.p + (r.kcal_punt || 0), l: a.l + (r.kcal_laag || 0),
      h: a.h + (r.kcal_hoog || 0), e: a.e + (r.eiwit_g || 0),
    }), { p: 0, l: 0, h: 0, e: 0 })

  return (
    <Kaart>
      <Kop>Zeggen wat je at</Kop>
      <textarea style={{ marginTop: 8 }} value={tekst} onChange={(e) => zetTekst(e.target.value)}
                placeholder="Bijvoorbeeld: halve schaal tonijnsalade met olijfolie, twee cappuccino's, en een bord tajine met kip." />
      <Rij style={{ marginTop: 8 }}>
        <Knop vol uit={loopt} opKlik={() => void doe('tekst')}>Herkennen</Knop>
        <label className="knop" style={{ cursor: 'pointer' }}>
          Foto van het bord
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) void doe('foto', f) }} />
        </label>
      </Rij>
      <p className="klein" style={{ marginTop: 8, minHeight: '1.2em' }}>
        {loopt && (
          <>
            <Spin /> Bezig — dit duurt een halve minuut, want er wordt in twee ronden tegen NEVO
            gematcht.
          </>
        )}
        {!loopt && melding}
      </p>

      {concept && totaal && (
        <Kaart plat style={{ marginTop: 12 }}>
          <Tussen>
            <Kop>Herkend — nakijken vóór opslaan</Kop>
            <span className="mini">{concept.model}</span>
          </Tussen>
          <div className="lijst" style={{ marginTop: 6 }}>
            {concept.regels.map((r, i) => (
              <div key={i}>
                <Chip graad={r.conf} />
                <span className="groei">
                  <span className="knip" style={{ fontSize: '.86rem', display: 'block' }}>{r.naam}</span>
                  <span className="mini">
                    {r.nevo_naam ? 'NEVO: ' + r.nevo_naam : 'geen tabelwaarde — schatting van het model'}
                  </span>
                  {r.onzekerheidsbronnen.map((o, j) => (
                    <span className="mini" style={{ display: 'block' }} key={j}>· {o}</span>
                  ))}
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span className="cijfer" style={{ fontSize: '.85rem', display: 'block' }}>
                    {dz(r.kcal_punt)}
                  </span>
                  <span className="mini cijfer">{dz(r.kcal_laag)}–{dz(r.kcal_hoog)}</span>
                </span>
                <Knop klein titel="Weglaten"
                      opKlik={() => {
                        const over = concept.regels.filter((_, j) => j !== i)
                        zetConcept(over.length ? { ...concept, regels: over } : null)
                      }}>×</Knop>
              </div>
            ))}
          </div>
          <Tussen style={{ marginTop: 10 }}>
            <span className="cijfer" style={{ fontSize: '.9rem' }}>
              <b>{dz(Math.round(totaal.p))} kcal</b>{' '}
              <span className="klein">
                ({dz(Math.round(totaal.l))}–{dz(Math.round(totaal.h))}) · {dec(totaal.e, 1)} g eiwit
              </span>
            </span>
            <Knop vol opKlik={() => {
              voegRegelsToe(concept.regels.map((r) => ({ ...r, datum, moment: r.moment })))
              zetConcept(null)
            }}>Toevoegen</Knop>
          </Tussen>
          {concept.opmerking && <p className="klein" style={{ marginTop: 8 }}>{concept.opmerking}</p>}
          {concept.referentieobject && (
            <p className="mini" style={{ marginTop: 4 }}>
              Schaal bepaald aan: {concept.referentieobject}.
            </p>
          )}
        </Kaart>
      )}

      <Uitleg id="herkennen" label="hoe je het opschrijft">
        <p>
          Schrijf het zoals je het zou vertellen. Noem het aantal en de bereiding — "twee sneetjes",
          "gekookt", "in de pan met olie" — dat scheelt meer dan een preciezere naam.
        </p>
        <p>
          Wat er daarna gebeurt: het model benoemt de onderdelen en schat een portiebereik, de server
          zoekt ze op in het Nederlands Voedingsstoffenbestand, en de voedingswaarde komt uit die tabel
          en niet uit het geheugen van het model. Dat scheelt ongeveer twee derde van de fout. Je krijgt
          het concept eerst te zien; er wordt niets opgeslagen voordat jij het nakijkt.
        </p>
        <p>
          De grootste ontbrekende post is bijna altijd de olie die in de bereiding is opgegaan. Die
          schat het model apart en meldt het erbij.
        </p>
      </Uitleg>
    </Kaart>
  )
}
