/**
 * DE SCHIL
 *
 * Kop, zes tabbladen, een bodembalk en de vensters. Wat de oude `teken()` deed,
 * maar dan zonder het hele scherm opnieuw op te bouwen.
 */
import { useCallback, useState } from 'react'
import { useKalibratie } from './toestand'
import { analyse, trendReeks } from './rekenkern'
import { dec } from '@/gedeeld/getal'
import { vandaag } from '@/gedeeld/datum'
import type { IsoDatum, Moment } from '@/gedeeld/db/tabellen'
import { roep } from '@/gedeeld/db/rpc'
import type { NieuweRegel } from '@/gedeeld/db/rpc'
import { Vandaag } from './schermen/Vandaag'
import { Model } from './schermen/Model'
import { Voeding } from './schermen/Voeding'
import { Beweging } from './schermen/Beweging'
import { Klinisch } from './schermen/Klinisch'
import { Meer } from './schermen/Meer'
import { PortieVenster, momentNu } from './vensters/Portie'
import type { Onderwerp } from './vensters/Portie'
import { InvoerVenster } from './vensters/Invoer'
import { KoppelVenster } from './vensters/Koppelen'
import {
  AccountVenster, Aanmelden, ImportVenster, ProfielVenster,
} from './vensters/Instellingen'
import { Opzet } from './Opzet'
import { Kaart, Knop } from './onderdelen/basis'

/* De namen op de balk zijn niet de namen in de code. 'Model' en 'Klinisch'
   zeggen wat een scherm ís voor wie het gebouwd heeft; 'Inzicht' en
   'Gezondheid' zeggen wat je er komt halen. De sleutels blijven staan zoals ze
   waren, want die zitten in de toestand en in de proeven. */
const TABS = [
  ['vandaag', 'Vandaag', '◍'],
  ['model', 'Inzicht', '◎'],
  ['voeding', 'Voeding', '◇'],
  ['beweging', 'Beweging', '◈'],
  ['klinisch', 'Gezondheid', '✚'],
  ['meer', 'Profiel', '⋯'],
] as const

/** Twee letters voor het rondje rechtsboven. Twee woorden geven de eerste van
 *  allebei; één woord geeft zijn eerste twee letters. */
function initialen(account: string): string {
  const delen = account.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  if (delen.length >= 2) return (delen[0]![0]! + delen[1]![0]!).toUpperCase()
  return (delen[0] ?? account).slice(0, 2).toUpperCase()
}

type Tab = (typeof TABS)[number][0]
type VensterNaam = 'profiel' | 'import' | 'account' | 'koppelen'

export function App() {
  const k = useKalibratie()
  const [tab, zetTab] = useState<Tab>('vandaag')
  const [datum, zetDatum] = useState<IsoDatum>(vandaag())
  const [venster, zetVenster] = useState<VensterNaam | null>(null)
  const [portie, zetPortie] = useState<Onderwerp | null>(null)
  /* Het invoervel. Het moment zit in de toestand en niet in het vel zelf, omdat
     het portievenster erbovenop kan komen en daarna terug moet kunnen vallen op
     hetzelfde moment. */
  const [invoer, zetInvoer] = useState<Moment | null>(null)

  const voegRegelsToe = useCallback((regels: NieuweRegel[]) => {
    if (!regels.length) return
    void k.wijzig((t) => roep('kal_regels_toevoegen', { p_token: t, p_regels: regels }))
  }, [k])

  if (!k.sessie) {
    return (
      <div className="wrap">
        <Aanmelden bezig={k.bezig} fout={k.fout} opAanmelden={(a, w, n) => void k.aanmelden(a, w, n)} />
      </div>
    )
  }

  if (!k.alles.profiel) {
    return (
      <div className="wrap">
        <Opzet wijzig={k.wijzig} fout={k.fout} />
      </div>
    )
  }

  const profiel = k.alles.profiel
  const a = analyse(k.dagenkaart, profiel)
  const reeks = trendReeks(k.dagenkaart)
  const dag = k.dagenkaart[datum] ?? { datum, _kcal: 0, _eiwit: 0, _laag: 0, _hoog: 0 }
  const regelsVandaag = k.alles.regels.filter((r) => r.datum === datum)

  return (
    <>
      <div className="wrap">
        <header>
          <div className="merk">
            <div>
              <h1>BennaHealth</h1>
              <div className="sub">
                {dec(a.gewicht, 1)} kg
                {profiel.doel_gewicht_kg != null && ` → ${profiel.doel_gewicht_kg} kg`}
                {' · '}BMI {dec(a.bmi, 1)}
                {' · '}{profiel.fase === 'onderhoud' ? 'onderhoudsfase' : 'afvalfase'}
              </div>
            </div>
            <button type="button" className="chip aan rond" aria-label={`Account van ${k.sessie.account}`}
                    onClick={() => zetVenster('account')}>
              {initialen(k.sessie.account)}
            </button>
          </div>
        </header>

        {k.fout && (
          <Kaart toon="fout" plat style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '.86rem' }}>{k.fout}</p>
            <Knop klein opKlik={k.wisFout}>Sluiten</Knop>
          </Kaart>
        )}

        <div id="inhoud">
          {tab === 'vandaag' && (
            <Vandaag
              a={a} dag={dag} regels={regelsVandaag} dagen={k.dagenkaart} datum={datum}
              eiwitPerKg={profiel.eiwit_g_per_kg}
              zetDatum={zetDatum}
              zetDagveld={(veld, waarde) =>
                void k.wijzig((t) => roep('kal_dag_zetten', {
                  p_token: t, p_datum: datum, p_patch: { [veld]: waarde },
                }))}
              opInvoer={zetInvoer}
              wisRegel={(id) =>
                void k.wijzig((t) => roep('kal_regel_wissen', { p_token: t, p_id: id }))}
            />
          )}

          {tab === 'model' && (
            <Model a={a} dagen={k.dagenkaart} reeks={reeks} profiel={profiel} labs={k.alles.labs} />
          )}

          {tab === 'voeding' && (
            <Voeding
              a={a} token={k.sessie.token} producten={k.alles.producten}
              regelsVandaag={regelsVandaag}
              opPortie={zetPortie}
              bewaarProduct={(pr) =>
                void k.wijzig((t) => roep('kal_rij_toevoegen', {
                  p_token: t, p_tabel: 'product', p_rij: { ...pr, conf: 'A' },
                }))}
              wisProduct={(id) =>
                void k.wijzig((t) => roep('kal_rij_wissen', {
                  p_token: t, p_tabel: 'product', p_id: id,
                }))}
            />
          )}

          {tab === 'beweging' && (
            <Beweging
              a={a} dagen={k.dagenkaart} training={k.alles.training} datum={datum}
              bewaarTraining={(tr) =>
                void k.wijzig((t) => roep('kal_rij_toevoegen', {
                  p_token: t, p_tabel: 'training', p_rij: tr,
                }))}
            />
          )}

          {tab === 'klinisch' && (
            <Klinisch
              a={a} profiel={profiel} labs={k.alles.labs} metingen={k.alles.metingen}
              vragenlijsten={k.alles.vragenlijsten}
              bewaarMeting={(m) =>
                void k.wijzig((t) => roep('kal_rij_toevoegen', {
                  p_token: t, p_tabel: 'meting', p_rij: m,
                }))}
              bewaarLab={(l) =>
                void k.wijzig((t) => roep('kal_rij_toevoegen', {
                  p_token: t, p_tabel: 'lab', p_rij: l,
                }))}
              bewaarStopbang={(v) =>
                void k.wijzig((t) => roep('kal_rij_toevoegen', {
                  p_token: t, p_tabel: 'vragenlijst', p_rij: v,
                }))}
            />
          )}

          {tab === 'meer' && (
            <Meer dagen={k.dagenkaart} reeks={reeks} profiel={profiel} opVenster={zetVenster} />
          )}
        </div>

        <footer>
          <b>A</b> etiket en gewogen · <b>B</b> etiket, portie geschat · <b>C</b> tabelwaarde ·{' '}
          <b>D</b> ruwe schatting.<br />
          Het model rekent in gelogde calorieën en kalibreert het niveau op de weegreeks. Het loopt
          ongeveer anderhalve week achter op de werkelijkheid; dat is de prijs van ruisonderdrukking,
          geen fout.
        </footer>
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map(([sleutel, label, icoon]) => (
          <button key={sleutel} type="button" role="tab" aria-selected={tab === sleutel}
                  onClick={() => { zetTab(sleutel); zetVenster(null); scrollTo(0, 0) }}>
            <span className="ic">{icoon}</span>{label}
          </button>
        ))}
      </nav>

      {invoer && !portie && (
        <InvoerVenster
          datum={datum} token={k.sessie.token} startMoment={invoer} regels={k.alles.regels}
          opPortie={(o, m) => { zetInvoer(m); zetPortie(o) }}
          voegRegelsToe={voegRegelsToe}
          opSluiten={() => zetInvoer(null)}
        />
      )}

      {portie && (
        <PortieVenster
          onderwerp={portie} datum={datum} moment={invoer ?? momentNu(datum)}
          /* Terug naar het vel als het daarvandaan kwam: je was een maaltijd
             aan het samenstellen, niet één product aan het opzoeken. */
          opSluiten={() => zetPortie(null)}
          opToevoegen={(r) => {
            zetPortie(null)
            if (!invoer) zetTab('vandaag')
            voegRegelsToe([r])
          }}
        />
      )}

      {venster === 'profiel' && (
        <ProfielVenster
          profiel={profiel} opSluiten={() => zetVenster(null)}
          opBewaren={(patch) => {
            zetVenster(null)
            void k.wijzig((t) => roep('kal_profiel_zetten', { p_token: t, p_patch: patch }))
          }}
        />
      )}

      {venster === 'import' && (
        <ImportVenster
          token={k.sessie.token} opSluiten={() => zetVenster(null)}
          opOvernemen={(dagen, regels) => {
            zetVenster(null)
            void k.wijzig(async (t) => {
              if (dagen.length) await roep('kal_dagen_importeren', { p_token: t, p_dagen: dagen })
              if (regels.length) await roep('kal_regels_toevoegen', { p_token: t, p_regels: regels })
            })
          }}
        />
      )}

      {venster === 'koppelen' && (
        <KoppelVenster
          token={k.sessie.token} opSluiten={() => zetVenster(null)}
          /* Een proefbericht kan dagen hebben aangevuld. Bij het sluiten dus
             opnieuw ophalen, anders staat het scherm achter op de database. */
          opVernieuwen={() => void k.herlaad()}
        />
      )}

      {venster === 'account' && (
        <AccountVenster
          account={k.sessie.account} opSluiten={() => zetVenster(null)}
          opAfmelden={() => { zetVenster(null); void k.afmelden() }}
        />
      )}
    </>
  )
}
