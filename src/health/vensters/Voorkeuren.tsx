/**
 * WAT JE LUST — het vel waar de voorstellen zich aan houden
 *
 * "Uit de tabel" en "Wat vult het best" putten uit alle 2.328 producten van het
 * voedingsstoffenbestand en weten niet wat jij eet. Ze stellen paardenrookvlees
 * voor aan een vegetariër en kaas aan iemand die geen zuivel gebruikt. Hier zeg
 * je één keer wat er niet hoeft.
 *
 * DRIE LAGEN, EN ZE DOEN EXPRES NIET HETZELFDE
 *
 * Bovenaan het eetpatroon: één keuze die de rest invult. Daaronder de
 * zevenentwintig groepen van de tabel, waar je per groep zegt wat je ermee wilt.
 * Dat is de enige lijst die telt — het patroon zet de vinkjes en beslist niets.
 *
 * WAAROM HET PATROON NIET ZELF FILTERT
 *
 * Vier van de zevenentwintig groepen zijn gemengd: in "Samengestelde gerechten"
 * staat nasi met kip naast nasi zonder, in "Hartig broodbeleg" smeerpaté naast
 * pindakaas. Op de naam scheiden kan niet — dat is precies de fout waardoor
 * bestand 34 bijna een gedroogde tomaat van 258 kcal voor een verse aanzag.
 *
 * Dus zet het patroon die vier mee uit, en zie je dat staan. Wil je je pindakaas
 * houden, dan haal je dat vinkje weg. Eén handeling, en je weet waarom. Een
 * regel die stil raadt zou je die handeling besparen en je vertrouwen kosten.
 *
 * DE VIERDE KOLOM DIE ER NIET IS
 *
 * Er staat geen schuifje van "heel graag" tot "liever niet". Er zijn drie
 * standen — gewoon, liever, nooit — en dat is geen versimpeling maar het
 * ontwerp: "liever niet" verschuift hoogstens twaalf punten op honderd, en
 * "nooit" verwijdert. Daartussen zit niets zinnigs, en een schuifje zou doen
 * alsof dat wel zo is.
 */
import { useState } from 'react'
import { Kaart, Keuzechip, Knop, Kop, Rij, Tussen, Uitleg, Venster } from '../onderdelen/basis'
import type { Profiel } from '@/gedeeld/db/tabellen'
import {
  GEEN_VOORKEUR, GEMENGD, GROEPEN, PATROONNAAM, groepenOver, voorstel,
} from '../voorkeuren'
import type { Eetpatroon, Voorkeuren } from '../voorkeuren'

/** Wat een groep in dit vel kan zijn. Drie standen, geen schaal. */
type Stand = 'gewoon' | 'liever' | 'nooit'

const PATRONEN: readonly Eetpatroon[] = ['alles', 'pescotarisch', 'vegetarisch', 'veganistisch']

function standVan(v: Voorkeuren, groep: string): Stand {
  if (v.nooit.includes(groep)) return 'nooit'
  if (v.liever.includes(groep)) return 'liever'
  return 'gewoon'
}

/**
 * Een groep op een stand zetten.
 *
 * Hij wordt overal weggehaald voordat hij ergens bij komt. Zonder dat kan een
 * groep in twee lijsten tegelijk staan, en dan is de opgeslagen voorkeur een
 * tegenspraak die het scherm niet meer kan tonen.
 *
 * `minder` blijft hier leeg: het vel biedt "liever" en "nooit" aan, en niet de
 * derde. Wie iets écht niet wil zet het op nooit; een aparte "liever niet" naast
 * "nooit" is een verschil dat niemand aan een lijstje van zevenentwintig wil
 * uitleggen. Het veld bestaat wel in de rekenlaag, want daar is het gratis en
 * hier zou het een kolom kosten.
 */
function zetStand(v: Voorkeuren, groep: string, stand: Stand): Voorkeuren {
  const zonder = {
    ...v,
    nooit: v.nooit.filter((g) => g !== groep),
    liever: v.liever.filter((g) => g !== groep),
    minder: v.minder.filter((g) => g !== groep),
  }
  if (stand === 'nooit') return { ...zonder, nooit: [...zonder.nooit, groep] }
  if (stand === 'liever') return { ...zonder, liever: [...zonder.liever, groep] }
  return zonder
}

export function VoorkeurVenster(
  { profiel, opSluiten, opBewaren }:
  { profiel: Profiel; opSluiten: () => void; opBewaren: (p: Partial<Profiel>) => void },
) {
  const [v, zetV] = useState<Voorkeuren>(profiel.instellingen.voorkeuren ?? GEEN_VOORKEUR)

  /* Het patroon vult de vinkjes en wist niets wat je zelf hebt aangezet. Ging
     je van vegetarisch naar alles, dan blijven jouw uitsluitingen staan — die
     heb je zelf gekozen en het patroon gaat daar niet over. */
  function kiesPatroon(patroon: Eetpatroon) {
    const erbij = voorstel(patroon).filter((g) => !v.nooit.includes(g))
    zetV({ ...v, patroon, nooit: [...v.nooit, ...erbij] })
  }

  const over = groepenOver(v)
  const uit = GROEPEN.filter((g) => v.nooit.includes(g))

  return (
    <Venster
      titel="Wat je lust"
      opSluiten={opSluiten}
      onder={
        <Tussen>
          <span className="mini">
            <span className="cijfer">{over}</span> van{' '}
            <span className="cijfer">{GROEPEN.length}</span> groepen blijven over
          </span>
          <Knop vol opKlik={() => {
            opBewaren({ instellingen: { ...profiel.instellingen, voorkeuren: v } })
            opSluiten()
          }}>Bewaren</Knop>
        </Tussen>
      }
    >
      <p className="klein">
        Voorstellen uit de tabel houden zich hieraan: "Uit de tabel" op Vandaag en
        "Wat vult het best". Wat je zelf logt blijft gewoon doorgaan — dit gaat over
        wat de app jóú aanbiedt, niet over wat jij mag eten.
      </p>

      <Kaart plat style={{ marginTop: 12 }}>
        <Kop>Eet je alles?</Kop>
        <Rij style={{ marginTop: 8 }}>
          {PATRONEN.map((x) => (
            <Keuzechip key={x} aan={v.patroon === x} opKlik={() => kiesPatroon(x)}>
              {PATROONNAAM[x]}
            </Keuzechip>
          ))}
        </Rij>
        <p className="mini" style={{ marginTop: 8 }}>
          {v.patroon === 'alles'
            ? 'Dan hoef je hieronder niets te doen — tenzij er iets is wat je niet lust.'
            : `Dit zet ${voorstel(v.patroon).length} groepen hieronder uit. Kijk ze na: `
              + 'vier ervan bevatten allebei, en die gaan mee uit.'}
        </p>
      </Kaart>

      {/* WAT ER UITGAAT, BOVENAAN EN BIJ NAAM

          Een lijst van zevenentwintig waarin je moet zoeken welke er uit staan,
          is een lijst waarin je het niet ziet. Wat uitstaat krijgt zijn eigen
          kopje, en daar staat ook hoeveel producten je ermee misloopt — want dat
          is het getal dat de keuze maakt en niet het aantal groepen. */}
      {uit.length > 0 && (
        <Kaart plat style={{ marginTop: 10 }} toon="let">
          <Tussen>
            <Kop>Deze krijg je niet voorgesteld</Kop>
            <span className="mini cijfer">{uit.length}</span>
          </Tussen>
          <div style={{ marginTop: 8 }}>
            {uit.map((g) => (
              <Tussen key={g} style={{ marginTop: 6 }}>
                <span className="mini">
                  {g}
                  {GEMENGD.includes(g) && (
                    <span className="mini" style={{ display: 'block', opacity: 0.8 }}>
                      bevat allebei — hier staat ook wat je wél lust
                    </span>
                  )}
                </span>
                <Knop klein titel={`${g} weer voorstellen`}
                      opKlik={() => zetV(zetStand(v, g, 'gewoon'))}>terug</Knop>
              </Tussen>
            ))}
          </div>
        </Kaart>
      )}

      <Kaart plat style={{ marginTop: 10 }}>
        <Kop>De zevenentwintig groepen</Kop>
        <p className="mini" style={{ marginTop: 2 }}>
          Zo staan ze in het voedingsstoffenbestand. "Liever" zet iets een paar
          plaatsen hoger, niet bovenaan.
        </p>
        <div style={{ marginTop: 8 }}>
          {GROEPEN.map((g) => {
            const stand = standVan(v, g)
            return (
              <Tussen key={g} style={{ marginTop: 8 }}>
                {/* Afbreken en niet afkappen. Met `knip` werd "Graanproducten en
                    meelsoorten" tot "Graanproducten en m…", en dan zet je een
                    vinkje om bij iets waarvan je de naam niet ziet. Drie chips
                    ernaast laten te weinig ruimte over om dat te vermijden. */}
                <span className="mini" style={{ flex: 1, minWidth: 0 }}>{g}</span>
                <Rij style={{ flexShrink: 0 }}>
                  {(['gewoon', 'liever', 'nooit'] as const).map((s) => (
                    <Keuzechip key={s} aan={stand === s}
                               opKlik={() => zetV(zetStand(v, g, s))}>
                      {s}
                    </Keuzechip>
                  ))}
                </Rij>
              </Tussen>
            )
          })}
        </div>
      </Kaart>

      {/* DE WAARSCHUWING KOMT VÓÓRDAT DE LIJST LEEG IS

          Wie twintig groepen uitzet krijgt een lege verzadigingslijst, en die
          ziet eruit als een storing. Dat hoort hier te staan en niet daar. */}
      {over < 10 && (
        <Kaart plat style={{ marginTop: 10 }} toon="let">
          <p className="klein">
            Er blijven nog <span className="cijfer">{over}</span> groepen over. Onder de
            tien wordt "Wat vult het best" vaak leeg — niet omdat er iets stuk is, maar
            omdat er niets meer past binnen wat je nog wilt zien.
          </p>
        </Kaart>
      )}

      <Uitleg id="voorkeuren" label="waarom dit anders werkt dan je geschiedenis">
        <p>
          De coach op Vandaag stelt voor uit wat jij zelf gelogd hebt. Die lijst
          houdt zichzelf vanzelf bij jouw smaak, en juist daarom mag hij níét op
          gewoonte sorteren: wie drie weken hetzelfde eet zou drie weken hetzelfde
          voorgesteld krijgen.
        </p>
        <p>
          Wat je hier instelt is iets anders. Het is niet afgeleid uit wat je at
          maar door jou gezegd, en het vernauwt niet over tijd — het is een grens
          en geen lus. Daarom mag het wél meetellen, en daarom verwijdert "nooit"
          echt terwijl "liever" hooguit een duwtje geeft.
        </p>
      </Uitleg>
    </Venster>
  )
}
