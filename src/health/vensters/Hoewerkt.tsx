/**
 * HOE DEZE APP WERKT — de uitleg in de app zelf
 *
 * De uitleg stond al ergens: `health/HANDLEIDING.md` legt de logica volledig uit,
 * met de meetuitkomsten erbij. Maar dat bestand staat in een repo op GitHub, en
 * wie deze app gebruikt komt daar nooit. "Zodat iedereen begrijpt hoe alles
 * werkt" betekent dus: ook hier, achter één tik.
 *
 * Dit is met opzet de korte versie. Niet de samenvatting van het document maar de
 * vier dingen die je moet weten om te snappen waarom de app zich gedraagt zoals
 * hij doet — en die alle vier terugkomen op dezelfde grondregel. Wie meer wil,
 * krijgt onderaan te horen waar dat staat.
 *
 * De uitklappers zitten er zodat dit scherm bij openen leesbaar kort is. De stand
 * ervan wordt onthouden, dus wie alles openzet houdt het open.
 */
import { Kaart, Kop, Uitleg, Venster } from '../onderdelen/basis'

export function HoewerktVenster({ opSluiten }: { opSluiten: () => void }) {
  return (
    <Venster titel="Hoe deze app werkt" opSluiten={opSluiten}>
      <Kaart plat>
        <Kop>De grondregel</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          <b>Geen getal zonder zijn onzekerheid.</b> Staat er 1.847 kcal, dan staat erbij
          dat het tussen 1.610 en 2.084 ligt. Niet uit bescheidenheid — een deel van je eten
          is gewogen en een deel is geschat, en dat verschil hoort niet te verdwijnen zodra
          er een getal op het scherm komt. Alles hieronder volgt daaruit.
        </p>
      </Kaart>

      <Kaart>
        <Kop>De drie tekens</Kop>
        <table className="tekenlijst">
          <tbody>
            <tr>
              <td><abbr className="herkomst" title="gemeten waarde uit de voedingsmiddelentabel">◆</abbr></td>
              <td className="mini"><b>gemeten</b> — bepaald in een laboratorium, uit de Nederlandse voedingsmiddelentabel</td>
            </tr>
            <tr>
              <td><abbr className="herkomst" title="etiketwaarde van de fabrikant">◈</abbr></td>
              <td className="mini"><b>etiket</b> — de opgave van een fabrikant, met een wettelijke marge van rond tien procent</td>
            </tr>
            <tr>
              <td><abbr className="herkomst" title="geschat, geen tabelwaarde">◇</abbr></td>
              <td className="mini"><b>geschat</b> — het model, een gerecht, of je eigen product</td>
            </tr>
          </tbody>
        </table>
        <Uitleg id="hoe-tekens" label="Waarom drie en niet twee">
          <p className="mini">
            Een etiket is geen laboratoriumbepaling, maar het is ook geen gok: er staat een
            fabrikant achter die er wettelijk aan gehouden kan worden. Onder ◇ zou het te laag
            ingeschat worden, onder ◆ te hoog.
          </p>
          <p className="mini">
            Daarom staan merkproducten ook in een eigen tabel en niet tussen de gemeten
            waarden. Zou je ze daar doorheen mengen, dan kregen ze ◆ en zou de app beweren dat
            een etiketopgave een meting is.
          </p>
        </Uitleg>
      </Kaart>

      <Kaart>
        <Kop>Waarom er soms “dit lijkt erop” staat</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          Vindt het zoeken helemaal niets, dan probeert de app het nog één keer op klank in
          plaats van op spelling — en zegt dat er dan ook bij. Zo vindt “lesagna” toch de
          lasagne, en “koeskoes” de couscous.
        </p>
        <Uitleg id="hoe-zoeken" label="Hoe dat werkt, en waarom pas als laatste">
          <p className="mini">
            Van elk woord blijft het skelet over: dubbele letters samen, verwante medeklinkers
            gelijk, klinkers eruit. <b>lasagne</b> en <b>lesagna</b> worden allebei <code>lsgn</code>,
            <b> couscous</b> en <b>koeskoes</b> allebei <code>ksks</code>.
          </p>
          <p className="mini">
            Hij draait alleen als het gewone zoeken niets vond. Een benadering mag nooit een
            echte treffer verdringen: zoek je op mayonaise, dan krijg je precies wat je altijd
            kreeg.
          </p>
          <p className="mini">
            En hij kijkt alleen naar echte productnamen. Een eerdere versie keek ruimer en gaf
            op “harira” een haring — een fout antwoord, netjes ingepakt onder “dit lijkt erop”.
            Dat is erger dan een leeg scherm.
          </p>
        </Uitleg>
      </Kaart>

      <Kaart>
        <Kop>Porties, en wie het laatste woord heeft</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          De onzekerheid staat op de wáárde, nooit op het gewicht. Een pak van 200 gram ís
          200 gram; wat je niet zeker weet is hoeveel calorieën erin zitten. Bij een eetlepel
          ligt het andersom — dan is het gewicht de onzekere kant.
        </p>
        <Uitleg id="hoe-porties" label="De tabel wint van het model">
          <p className="mini">
            Beschrijf je een maaltijd in gewone taal, dan schat het model wat erin zit. Maar
            hoeveel een eetlepel weegt schat het niet: dat staat in de portietabel, en die
            wint. De app zegt er dan bij dat het gewicht uit de tabel komt.
          </p>
          <p className="mini">
            Die regel is er gekomen omdat één schaaltje cornflakes op 180 gram stond. Dat is
            672 kcal. Het is 54 gram.
          </p>
        </Uitleg>
      </Kaart>

      <Kaart plat>
        <Kop>Wat de app niet weet</Kop>
        <p className="mini" style={{ marginTop: 4 }}>
          Hij weet niet of je alles hebt ingevoerd — dat is in elk voedingsdagboek de grootste
          foutenbron. Hij weet bij een gerecht niet wat er is ingedampt, dus bij lang stoven
          valt de uitkomst aan de lage kant. En of er lamsvlees in de harira ging weet hij
          niet; dat is geen onzekerheid maar een vraag, en die stelt hij.
        </p>
        <p className="mini" style={{ marginTop: 8 }}>
          De volledige uitleg staat in <b>HANDLEIDING.md</b>, elke rekenregel met bron en
          beperking in <b>VERANTWOORDING.md</b>.
        </p>
      </Kaart>
    </Venster>
  )
}
