/**
 * MODEL — waar het geschatte verbruik vandaan komt, en hoe zeker het is.
 *
 * De zekerheid stond hier als drie woorden in kleine letters rechtsboven, en
 * dat is het verkeerde formaat voor het belangrijkste wat dit scherm te melden
 * heeft. Een getal met lage zekerheid is een ánder getal dan hetzelfde getal
 * met hoge zekerheid, en dat verschil hoort te zien te zijn voordat je het
 * cijfer leest. Vandaar de trapmeter bovenaan.
 */
import { Kaart, Knop, Kop, Rij, Tussen, Uitleg } from '../onderdelen/basis'
import { Lijntje, Schermkop, Trapmeter } from '../hero'
import { GewichtFiguur, InnameFiguur, IntervalFiguur } from '../figuren'
import { dec, dz } from '@/gedeeld/getal'
import { kortNL, plusDagen, vandaag } from '@/gedeeld/datum'
import type { Instellingen, Lab, Profiel } from '@/gedeeld/db/tabellen'
import type { Analyse, Dagenkaart, Trendpunt } from '../rekenkern'

const ZEKERHEID_LABEL = {
  hoog: 'hoog', middel: 'middel', laag: 'laag', geen: 'onvoldoende',
} as const

export function Model(
  { a, dagen, reeks, profiel, labs }:
  {
    a: Analyse; dagen: Dagenkaart; reeks: Trendpunt[]
    profiel: Profiel; labs: Lab[]
  },
) {
  const trap = { geen: 0, laag: 1, middel: 2, hoog: 3 }[a.zekerheid]
  const kleur = a.zekerheid === 'hoog' ? 'var(--goed)'
              : a.zekerheid === 'laag' ? 'var(--let)' : 'var(--k)'
  const trendNu = [...reeks].reverse().find((x) => x.ema != null)

  /* De laatste acht weken gewicht: de ruwe wegingen licht, de gladde lijn
     erover. Wie alleen de gladde lijn ziet denkt dat wegen nauwkeuriger is dan
     het is. */
  const laatste = reeks.slice(-56)

  return (
    <>
      <Schermkop
        toon={a.zekerheid === 'hoog' ? 'goed' : a.zekerheid === 'geen' ? 'rust' : 'let'}
        bovenschrift="Het model"
        titel={a.tdee != null ? 'Wat je lichaam verbruikt' : 'Nog niet te berekenen'}
        rechts={
          <span className={'vlaggetje ' + (a.zekerheid === 'hoog' ? 'goed'
            : a.zekerheid === 'geen' ? 'rust' : 'let')}>
            zekerheid {ZEKERHEID_LABEL[a.zekerheid]}
          </span>
        }
      >
        {a.tdee != null && a.laag != null && a.hoog != null ? (
          <>
            <div className="kerngetallen">
              <div>
                <div className="mini">Verbruik per dag</div>
                <div>
                  <span className="getal">{dz(Math.round(a.laag))}–{dz(Math.round(a.hoog))}</span>
                  <span className="klein"> kcal</span>
                </div>
              </div>
              <div>
                <div className="mini">Bijbehorende inname</div>
                <div><span className="getal">{dz(a.doel)}</span><span className="klein"> kcal</span></div>
              </div>
            </div>
            <p className="mini" style={{ marginTop: 8 }}>
              Een band en geen getal. Hoe smaller hij wordt, hoe meer het model van je weet.
            </p>
            {/* WAT DIT GETAL PRECIES IS, EN WAAROM DAT HIER STAAT

                Dit is geen meting van je stofwisseling. Het is afgeleid uit wat
                jij logde en wat de weegschaal deed, dus het draagt de fout in je
                logboek mee: log je stelselmatig twintig procent te laag, dan
                staat hier een verbruik dat twintig procent te laag is.

                Dat maakt het getal niet minder bruikbaar — het voorspelt jouw
                gewichtsverloop juist goed, want die afwijking is persoonlijk en
                stabiel. Maar "wat je lichaam verbruikt" en "wat je lichaam
                verbruikt volgens jouw logboek" zijn twee verschillende
                beweringen, en deze app hoort te zeggen welke van de twee hij
                doet.

                Dat stond er tot voor kort, in de voetregel onder elk scherm.
                Bij het opruimen van de tekst is die verdwenen en bleef alleen de
                uitleg in de consistentiekaart over — die dichtgeklapt is, en die
                alleen verschijnt bij een verschil boven de driehonderd. Hier
                hoort hij, altijd zichtbaar, onder het getal waar hij over gaat. */}
            <p className="mini" style={{ marginTop: 5 }}>
              Gerekend in gelogde calorieën: dit is je verbruik <i>zoals je logboek het
              impliceert</i>, niet je stofwisseling gemeten.
            </p>
          </>
        ) : (
          <p style={{ fontSize: '.9rem', marginTop: 10 }}>
            Er zijn zeven wegingen én zeven volledige registratiedagen nodig. Je hebt er{' '}
            <b>{a.wPunten.length}</b> en <b>{a.volledig}</b>.
          </p>
        )}

        <div style={{ marginTop: 14 }}>
          <Trapmeter trede={trap} van={3} kleur={kleur}
                     etiketten={['laag', 'middel', 'hoog']} />
        </div>

        {laatste.length > 2 && (
          <div style={{ marginTop: 14 }}>
            <div className="mini">Gewicht, laatste acht weken</div>
            <Lijntje ruw={laatste.map((x) => x.w)}
                     glad={laatste.map((x) => x.ema)} />
          </div>
        )}
      </Schermkop>

      {/* WAAROM DEZE VOLGORDE, EN WAAROM HIJ VERSPRINGT

          Het scherm beantwoordt twee vragen en de rest is verantwoording. De
          eerste — wat verbruik ik — staat in de kop. De tweede — wat eet ik, en
          hoe verhoudt zich dat tot het doel — stond nergens: de gemiddelde
          inname zat verstopt in een bijzin van de afleiding, en de staafjes
          stonden onderaan. Die staat nu hier.

          Daaronder eerst wat om actie vraagt (te snel, wat het model mist), dan
          waar je staat, dan de figuren, en pas onderaan waar de getallen
          vandaan komen.

          De afleiding versprìngt, en dat is met opzet. Zolang er geen band is,
          is "wat er nog nodig is voordat ik iets kan zeggen" juist het
          belangrijkste van het scherm en staat hij bovenaan. Zodra de band er
          is, is het verantwoording en zakt hij naar onderen. */}
      {a.tdee == null && (
      <Kaart>
        <Tussen>
          <Kop>Waar de band vandaan komt</Kop>
          <span className="eyebrow" style={{ color: kleur }}>
            zekerheid {ZEKERHEID_LABEL[a.zekerheid]}
          </span>
        </Tussen>
        {a.tdee != null && a.laag != null && a.hoog != null ? (
          <>
            {/* De band staat al in de kop. Hij hier nóg een keer groot herhalen
                maakt hem niet waarder; wat deze kaart toevoegt is waar hij
                vandaan komt — de figuur en de afleiding eronder. */}
            <IntervalFiguur a={a} />
            <p style={{ fontSize: '.88rem', marginTop: 10 }}>
              Afgeleid uit {a.volledig} bruikbare registratiedagen — gemiddeld{' '}
              {dz(Math.round(a.gemInname ?? 0))} kcal — en een gewichtstrend van{' '}
              {(a.hellingWk ?? 0) > 0 ? '+' : ''}{dec(a.hellingWk, 2)} kg per week, ofwel{' '}
              {dec(a.hellingPct, 2)} procent van je lichaamsgewicht. Bij een streeftempo van{' '}
              {dec(profiel.tempo_pct_week, 1)} procent hoort een inname van <b>{dz(a.doel)} kcal</b>.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--kop)', fontWeight: 640, fontSize: '1.3rem', color: 'var(--grijs)', marginTop: 4 }}>
              Nog niet te berekenen.
            </p>
            <p style={{ fontSize: '.88rem', marginTop: 8 }}>
              Er zijn minstens zeven wegingen én zeven volledige registratiedagen nodig binnen het
              venster van {a.venster} dagen. Je hebt nu <b>{a.wPunten.length}</b>{' '}
              weging{a.wPunten.length === 1 ? '' : 'en'} en <b>{a.volledig}</b>{' '}
              bruikbare dag{a.volledig === 1 ? '' : 'en'}. Weeg vanaf morgen elke ochtend; het model
              rekent zichzelf uit zodra de reeks lang genoeg is. Vier weken geeft pas een bruikbaar
              interval.
            </p>
            <Kaart plat style={{ marginTop: 12 }}>
              <Kop>Voorlopige aanname zolang er geen trend is</Kop>
              <Rij style={{ alignItems: 'baseline', marginTop: 3 }}>
                <span className="getal" style={{ fontSize: '1.5rem' }}>
                  {dz(a.priorLaag)}–{dz(a.priorHoog)}
                </span>
                <span className="klein">kcal</span>
              </Rij>
              <Uitleg id="prior" label="waar dit getal vandaan komt">
                <p>
                  Ruststofwisseling {dz(a.rustBMR)} kcal (Mifflin-St Jeor) maal een activiteitsfactor
                  tussen {dec(a.palLaag, 2)} en {dec(a.palHoog, 2)}. Dat is een band en geen getal,
                  want een gevalideerde omrekening van stappen naar activiteitsfactor bestaat niet.
                  Behandel dit als prior, geen meting.
                </p>
              </Uitleg>
            </Kaart>
          </>
        )}
      </Kaart>

      )}

      <WaarJeStaat a={a} profiel={profiel} />

      {a.teSnel && (
        <Kaart toon="let">
          <Kop>Te snel</Kop>
          <p style={{ fontSize: '.88rem', marginTop: 4 }}>
            De trend is {dec(a.hellingWk, 2)} kg per week, ofwel {dec(a.hellingPct, 2)} procent —
            steiler dan één procent. Dat gaat ten koste van vetvrije massa en is slecht vol te houden.
            Het advies is hier <b>méér</b> eten, niet minder
            {a.doel != null && `: het doel van ${dz(a.doel)} kcal ligt boven wat je nu gemiddeld logt`}.
          </p>
        </Kaart>
      )}

      <Meetgaten a={a} dagen={dagen} instellingen={profiel.instellingen} labs={labs} />

      <Kaart>
        <Kop>Traject</Kop>
        <div className="trio" style={{ marginTop: 8 }}>
          {([
            ['Nu', dec(a.gewicht, 1) + ' kg'],
            ['Trend', trendNu ? dec(trendNu.ema, 1) + ' kg' : '—'],
            ['Doel', (profiel.doel_gewicht_kg ?? '—') + ' kg'],
          ] as const).map(([l, v]) => (
            <div key={l}>
              <div className="mini">{l}</div>
              <div className="getal" style={{ fontSize: '1.25rem' }}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '.88rem', marginTop: 10 }}>
          {a.wekenTotDoel != null ? (
            <>
              Bij het huidige tempo is {profiel.doel_gewicht_kg} kg over ongeveer{' '}
              <b>{a.wekenTotDoel} weken</b> in zicht — rond{' '}
              {kortNL(plusDagen(vandaag(), a.wekenTotDoel * 7))}. Plateaus zitten daar niet in; reken
              op tien tot twintig procent langer.
            </>
          ) : (
            <>
              Zonder gemeten helling is elke einddatum verzonnen. Bij {dec(profiel.tempo_pct_week, 1)}{' '}
              procent per week — nu {dec(a.tempoKgWk, 2)} kg — duurt{' '}
              {dec(a.gewicht - (profiel.doel_gewicht_kg ?? a.gewicht), 0)} kg ongeveer{' '}
              {Math.round((a.gewicht - (profiel.doel_gewicht_kg ?? a.gewicht)) / Math.max(0.1, a.tempoKgWk))}{' '}
              weken.
            </>
          )}
        </p>
        <Kaart plat style={{ marginTop: 10 }}>
          <Uitleg id="grenzen" label="de drie harde grenzen">
            <p>
              Drie regels staan hard in de code. Het doel zakt nooit onder de ruststofwisseling
              ({dz(a.rustBMR)} kcal). Gaat de trend sneller dan één procent per week, dan luidt het
              advies méér eten. En actieve energie uit Garmin of Apple wordt nooit bij het doel
              opgeteld: de fout daarin is twintig tot vijftig procent en niet consistent in één
              richting, dus corrigeren kan niet.
            </p>
          </Uitleg>
        </Kaart>
      </Kaart>
      <Kaart>
        <Kop>Gewicht en voortschrijdend gemiddelde</Kop>
        <GewichtFiguur reeks={reeks} doelGewicht={profiel.doel_gewicht_kg} />
        <Uitleg id="weeglijn" label="wat je hier ziet">
          <p>
            Punten zijn losse wegingen, de lijn is een exponentieel gewogen gemiddelde met een
            halfwaardetijd van ongeveer een week. Dagelijkse schommelingen van één tot twee kilo zijn
            vocht, glycogeen en darminhoud — de helling is het signaal, niet de meting.
          </p>
        </Uitleg>
      </Kaart>

      <Kaart>
        <Kop>Gelogde energie per dag</Kop>
        <InnameFiguur reeks={reeks} doel={a.doel} />
        <p className="mini">
          Oranje staven liggen onder 1.200 kcal en gelden als onvolledig, niet als succes.
          {a.gemarkeerd > 0 &&
            ` ${a.gemarkeerd} dag${a.gemarkeerd === 1 ? '' : 'en'} in dit venster valt in die categorie.`}
        </p>
      </Kaart>

      {a.tdee != null && (
      <Kaart>
        <Tussen>
          <Kop>Waar de band vandaan komt</Kop>
          <span className="eyebrow" style={{ color: kleur }}>
            zekerheid {ZEKERHEID_LABEL[a.zekerheid]}
          </span>
        </Tussen>
        {a.tdee != null && a.laag != null && a.hoog != null ? (
          <>
            {/* De band staat al in de kop. Hij hier nóg een keer groot herhalen
                maakt hem niet waarder; wat deze kaart toevoegt is waar hij
                vandaan komt — de figuur en de afleiding eronder. */}
            <IntervalFiguur a={a} />
            <p style={{ fontSize: '.88rem', marginTop: 10 }}>
              Afgeleid uit {a.volledig} bruikbare registratiedagen — gemiddeld{' '}
              {dz(Math.round(a.gemInname ?? 0))} kcal — en een gewichtstrend van{' '}
              {(a.hellingWk ?? 0) > 0 ? '+' : ''}{dec(a.hellingWk, 2)} kg per week, ofwel{' '}
              {dec(a.hellingPct, 2)} procent van je lichaamsgewicht. Bij een streeftempo van{' '}
              {dec(profiel.tempo_pct_week, 1)} procent hoort een inname van <b>{dz(a.doel)} kcal</b>.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--kop)', fontWeight: 640, fontSize: '1.3rem', color: 'var(--grijs)', marginTop: 4 }}>
              Nog niet te berekenen.
            </p>
            <p style={{ fontSize: '.88rem', marginTop: 8 }}>
              Er zijn minstens zeven wegingen én zeven volledige registratiedagen nodig binnen het
              venster van {a.venster} dagen. Je hebt nu <b>{a.wPunten.length}</b>{' '}
              weging{a.wPunten.length === 1 ? '' : 'en'} en <b>{a.volledig}</b>{' '}
              bruikbare dag{a.volledig === 1 ? '' : 'en'}. Weeg vanaf morgen elke ochtend; het model
              rekent zichzelf uit zodra de reeks lang genoeg is. Vier weken geeft pas een bruikbaar
              interval.
            </p>
            <Kaart plat style={{ marginTop: 12 }}>
              <Kop>Voorlopige aanname zolang er geen trend is</Kop>
              <Rij style={{ alignItems: 'baseline', marginTop: 3 }}>
                <span className="getal" style={{ fontSize: '1.5rem' }}>
                  {dz(a.priorLaag)}–{dz(a.priorHoog)}
                </span>
                <span className="klein">kcal</span>
              </Rij>
              <Uitleg id="prior" label="waar dit getal vandaan komt">
                <p>
                  Ruststofwisseling {dz(a.rustBMR)} kcal (Mifflin-St Jeor) maal een activiteitsfactor
                  tussen {dec(a.palLaag, 2)} en {dec(a.palHoog, 2)}. Dat is een band en geen getal,
                  want een gevalideerde omrekening van stappen naar activiteitsfactor bestaat niet.
                  Behandel dit als prior, geen meting.
                </p>
              </Uitleg>
            </Kaart>
          </>
        )}
      </Kaart>
      )}

      {a.tdee != null && a.onderrapportage != null && (
        <Kaart>
          <Kop>Consistentiecheck registratie</Kop>
          {/* Het oordeel eerst en in één zin; de redenering erachter. Dit is de
              kaart die het meeste uitlegde en het minste zei — acht regels tekst
              waarvan de uitkomst "de registratie is intern consistent" was, of
              niet. Die uitkomst hoort vooraan te staan. */}
          <p style={{ fontSize: '.88rem', marginTop: 4 }}>
            {a.onderrapportage > 300 ? (
              <>
                Je logt ongeveer <b>{dz(Math.round(a.onderrapportage))} kcal</b> minder dan de formule
                verwacht. Dat is normaal, en het advies blijft geldig.
              </>
            ) : a.onderrapportage < -300 ? (
              <>Je registreert <b>méér</b> dan de formule verwacht.</>
            ) : (
              <>Formule en weegreeks liggen dicht bij elkaar: de registratie is intern consistent.</>
            )}
          </p>
          <Uitleg id="consistentie" label="de twee getallen naast elkaar">
            <p>
              De formule voorspelt bij dit gewicht en deze activiteit een onderhoud tussen{' '}
              {dz(a.priorLaag)} en {dz(a.priorHoog)} kcal. De gewichtstrend impliceert{' '}
              {dz(Math.round(a.tdee))} kcal.
            </p>
            {a.onderrapportage > 300 ? (
              <p>
                Een verschil van deze omvang is te groot voor toeval en past bij onderregistratie van
                twintig tot dertig procent — de best gedocumenteerde systematische fout in de
                voedingswetenschap. Dat maakt het advies niet ongeldig: de bias is proportioneel en
                stabiel binnen een persoon, dus zolang je op dezelfde manier blijft loggen klopt het
                doel in gelogde eenheden.
              </p>
            ) : a.onderrapportage < -300 ? (
              <p>
                Dat past bij een hogere activiteit dan de stappen laten zien, of bij een onrustige
                weegreeks.
              </p>
            ) : null}
          </Uitleg>
        </Kaart>
      )}

    </>
  )
}

/**
 * WAAR JE NU STAAT — de vraag die het scherm niet beantwoordde
 *
 * De kop zegt wat je verbruikt. Wat je éét stond nergens als getal: het zat in
 * een bijzin van de afleiding ("gemiddeld 2.140 kcal") en verder alleen als
 * staafjes onderaan het scherm. De vraag "hoe zit het nou met mijn intake" was
 * daarmee niet te beantwoorden zonder te rekenen.
 *
 * Drie getallen, en het derde is het enige waar je iets mee doet: het verschil
 * tussen wat je logt en wat het doel is.
 *
 * WAAROM HIER NIET HET VERBRUIK STAAT
 *
 * Dat zou het getal uit de kop tien centimeter lager herhalen, en het zou een
 * som suggereren die niet klopt. Inname min verbruik is hier geen onafhankelijk
 * saldo: het verbruik is uít de inname en de weegreeks afgeleid, dus dat
 * verschil is de weegtrend in andere eenheden. Die trend staat er daarom als
 * wat hij is — de onafhankelijke controle van de weegschaal, in kilo's.
 */
function WaarJeStaat({ a, profiel }: { a: Analyse; profiel: Profiel }) {
  if (a.gemInname == null || a.doel == null) return null
  const verschil = Math.round(a.gemInname - a.doel)
  const boven = verschil > 100
  const onder = verschil < -100

  return (
    <Kaart toon={boven ? 'let' : undefined}>
      <Kop>Waar je nu staat</Kop>
      <div className="trio" style={{ marginTop: 8 }}>
        <div>
          <div className="mini">Je logt gemiddeld</div>
          <div className="getal" style={{ fontSize: '1.25rem' }}>
            {dz(Math.round(a.gemInname))}
          </div>
          <div className="mini">kcal per dag</div>
        </div>
        <div>
          <div className="mini">Doel</div>
          <div className="getal" style={{ fontSize: '1.25rem' }}>{dz(a.doel)}</div>
          <div className="mini">kcal per dag</div>
        </div>
        <div>
          <div className="mini">Verschil</div>
          <div className="getal" style={{ fontSize: '1.25rem',
                 color: boven ? 'var(--let)' : onder ? 'var(--k)' : 'var(--goed)' }}>
            {verschil > 0 ? '+' : ''}{dz(verschil)}
          </div>
          <div className="mini">kcal per dag</div>
        </div>
      </div>
      <p style={{ fontSize: '.88rem', marginTop: 10 }}>
        {boven ? (
          <>Je logt <b>{dz(verschil)} kcal per dag méér</b> dan het doel.</>
        ) : onder ? (
          <>Je logt <b>{dz(-verschil)} kcal per dag minder</b> dan het doel.</>
        ) : (
          <>Je zit op het doel.</>
        )}{' '}
        {a.hellingWk != null ? (
          <>De weegschaal doet er ondertussen{' '}
            <b>{(a.hellingWk > 0 ? '+' : '') + dec(a.hellingWk, 2)} kg per week</b> bij of af, en
            dat is de controle: die meting hangt niet van je logboek af.
          </>
        ) : (
          <>Er is nog geen weegtrend om dit tegen af te zetten.</>
        )}
      </p>
      <p className="mini" style={{ marginTop: 6 }}>
        Gemiddeld over {a.volledig} bruikbare dag{a.volledig === 1 ? '' : 'en'} in het venster van{' '}
        {a.venster} dagen. Bij een streeftempo van {dec(profiel.tempo_pct_week, 1)} procent per week.
      </p>
    </Kaart>
  )
}

function Meetgaten(
  { a, dagen, instellingen, labs }:
  { a: Analyse; dagen: Dagenkaart; instellingen: Instellingen; labs: Lab[] },
) {
  void a
  const g: string[] = []
  if (dagen[vandaag()]?.gewicht_kg == null) {
    g.push('De weging van vanochtend ontbreekt. Zonder dagelijkse reeks is het model inert; ' +
           'het is de enige invoer die niet te schatten valt.')
  }
  if (!instellingen.olie_gewogen) {
    g.push('Weeg één keer de olijfolie in de saladebereiding. Verreweg de grootste onzekerheid ' +
           'van de dag: het verschil tussen 40 en 70 gram is 265 kcal, elke dag.')
  }
  if (!instellingen.melk_gemeten) {
    g.push('Meet af wat de machine per cappuccino schenkt. Bij vier à vijf op een werkdag de ' +
           'grootste onzichtbare post.')
  }
  const leeg7 = Array.from({ length: 7 }, (_, i) => plusDagen(vandaag(), -i - 1))
  const leeg = leeg7.filter((k) => !dagen[k]?._kcal)
  if (leeg.length >= 2) {
    g.push(`${leeg.length} van de afgelopen zeven dagen heeft geen registratie. Gaten verbreden ` +
           'het interval sneller dan een onnauwkeurige schatting dat doet: een ruwe D-waarde is ' +
           'beter dan niets.')
  }
  /* DE KOPPELING DIE STIL IS GEVALLEN
   *
   * Er is geen manier om Apple Gezondheid vanaf een server op te halen — die
   * gegevens komen alleen van het toestel af, via de opdracht die daar draait.
   * Valt die opdracht stil, dan merkt de app dat niet: er komt gewoon niets
   * binnen, en dat ziet er precies zo uit als een dag zonder stappen.
   *
   * Vandaar deze regel. Hij kijkt naar de gegevens en niet naar de sleutel: wat
   * telt is of er íets is aangekomen, niet of de koppeling nog bestaat. En hij
   * verschijnt alleen als er ooit stappen binnenkwamen — wie hem nooit heeft
   * ingesteld hoort geen zeven dagen per week te lezen dat er iets stilstaat. */
  const stappenOoit = Object.values(dagen).some((d) => (d?.stappen ?? 0) > 0)
  const stappenRecent = leeg7.filter((k) => (dagen[k]?.stappen ?? 0) > 0).length
  if (stappenOoit && stappenRecent === 0) {
    g.push('Er komt niets meer binnen uit Gezondheid. De afgelopen zeven dagen staat er geen ' +
           'enkele stap, terwijl dat eerder wel gebeurde. Kijk of de automatisering op je ' +
           'telefoon nog draait — onder Profiel, bij Koppelen, staat wanneer er voor het ' +
           'laatst iets is aangekomen.')
  } else if (stappenOoit && stappenRecent <= 3) {
    g.push(`Uit Gezondheid kwam ${stappenRecent} van de afgelopen zeven dagen iets binnen. ` +
           'Een opdracht die met de hand gestart moet worden slaat dagen over; als automatisering ' +
           'draait hij elke ochtend vanzelf.')
  }
  if (!labs.length) {
    g.push('De klinische nulmeting staat nog leeg. Bloeddruk, HbA1c, lipiden, ALAT en GGT, TSH, ' +
           'vitamine D en middelomtrek — zonder uitgangswaarde is beloop niet te beoordelen.')
  }
  if (!g.length) return null

  return (
    <Kaart toon="let">
      <Kop>Wat het model nog mist</Kop>
      <ol style={{ margin: '8px 0 0', paddingLeft: 19, fontSize: '.86rem', lineHeight: 1.5 }}>
        {g.map((x, i) => {
          const punt = x.indexOf('. ')
          return (
            <li key={i} style={{ marginBottom: 6 }}>
              <b>{x.slice(0, punt + 1)}</b>{x.slice(punt + 1)}
            </li>
          )
        })}
      </ol>
    </Kaart>
  )
}

export { Knop }
