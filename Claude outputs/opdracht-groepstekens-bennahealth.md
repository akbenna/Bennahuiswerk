# Opdracht: 27 groepstekens voor BennaHealth

*Plak dit hele bericht in ChatGPT. Vraag om één teken eerst; pas als dat goed is,
de rest, dat werkte de vorige keer.*

---

Ik bouw BennaHealth, een Nederlandstalige app over voeding en gezondheid. De
voedingsmiddelentabel erachter heeft 2.328 producten, verdeeld over 27
productgroepen. Ik zoek één tekening per groep, zodat élk product iets laat zien
in plaats van een handjevol.

Dat is met opzet een groepsteken en geen productfoto. Een tekening die zegt *"dit
is zuivel"* kan nooit het verkeerde beweren; een foto van gemengde noten bij een
zakje pistaches wel. Teken dus de categorie, niet het exemplaar.

## Leveringsvorm: hier is geen speelruimte

**Lever SVG-broncode, geen PNG en geen JPG.** Eén codeblok per bestand, met de
bestandsnaam erboven. Geen ZIP, geen afbeelding van een SVG, geen gegenereerd
plaatje dat eruitziet als vector. Ik plak de code rechtstreeks in mijn app.

**Geen tekst in de tekening.** Geen bestandsnaam, geen bijschrift, geen label.

**Geen `<image>`, geen base64, geen ingesloten bitmap.** Alleen `<path>`,
`<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, `<g>`.

**Geen verlopen, geen filters, geen schaduwen, geen `style`-attribuut of -blok.**
Vlakke vormen, attributen op het element zelf.

**Geen emoji en niets uit een bestaande iconenset.** Zelf tekenen, geen merken.

## De kleurregel

**Uitsluitend `currentColor`.** Elke `fill` en elke `stroke` is `currentColor`.
Diepte maak je met `fill-opacity`, bijvoorbeeld 1 voor de hoofdvorm, 0,45 voor
een tweede laag, 0,2 voor een derde. Dat geeft een duotoon-effect dat rijk oogt
en toch in elke kleur werkt.

**Schrijf nooit een hexcode in de SVG.** De app heeft een licht en een donker
thema; een vaste kleur breekt er één van.

Toets zelf: leest hij als hij helemaal `#07785C` is op wit (`#F3F6F5`), én als hij
helemaal `#4FD2A6` is op bijna-zwart (`#080D0C`)?

## Formaat en leesbaarheid: de les van de vorige ronde

`viewBox="0 0 48 48"` voor alle 27.

Ze worden op **32 pixels** in een lijst getoond en op 96 in een detailvenster.
Teken dus op 48 en **controleer op 32**. In de vorige levering waren de
toestandstekens gevulde cirkels met een uitgespaard teken erin; op kleine maat
verdween die uitsparing en werd alles hetzelfde bolletje. Houd de vormen daarom
open genoeg: liever één herkenbare silhouet met een tweede laag erin, dan fijne
details die wegvallen.

Iemand moet op 32 pixels vlees van vis kunnen onderscheiden, en brood van gebak.
Dat is de toets.

## De stijl

Illustratiever dan een lijnpictogram: gevulde vormen, herkenbare silhouetten, een
beetje karakter. Maar rustig: dit is een medische app en geen spel. Geen
perspectief, geen 3D, geen glans, geen gezichtjes. Ronde hoeken mogen.

Alle 27 moeten als één familie ogen: dezelfde lijndikte, dezelfde mate van
detail, dezelfde optische massa. Een groep mag niet zwaarder ogen dan een andere
alleen omdat zijn vorm toevallig voller is.

## De 27, met het aantal producten en een suggestie

De bestandsnaam staat links. Het getal is hoeveel producten in die groep vallen,
de grote groepen zijn de belangrijkste, begin daar.

| bestand | groep | n | suggestie |
|---|---|---|---|
| `groep-groente.svg` | Groente | 230 | paprika of wortel met loof |
| `groep-vlees-en-gevogelte.svg` | Vlees en gevogelte | 216 | een stuk vlees, of een kippenpoot |
| `groep-gebak-en-koek.svg` | Gebak en koek | 170 | een punt taart of een koekje met een hap eruit |
| `groep-graanproducten.svg` | Graanproducten en meelsoorten | 142 | korenaren, eventueel met een hoopje meel |
| `groep-melk.svg` | Melk en melkproducten | 131 | een pak melk of een glas |
| `groep-suiker-en-zoet.svg` | Suiker, snoep, zoet beleg en zoete sauzen | 128 | een pot met een lepel erin, of een suikerklontje |
| `groep-brood.svg` | Brood | 124 | een brood met een losse snee ervoor |
| `groep-dranken.svg` | Niet-alcoholische dranken | 112 | een glas met een rietje |
| `groep-fruit.svg` | Fruit | 111 | een appel met blad |
| `groep-vis.svg` | Vis, schaal- en schelpdieren | 98 | een vis van opzij |
| `groep-samengestelde-gerechten.svg` | Samengestelde gerechten | 83 | een bord met vork en mes |
| `groep-hartige-sauzen.svg` | Hartige sauzen | 82 | een knijpfles of sauskom |
| `groep-kaas.svg` | Kaas | 73 | een punt kaas met gaten |
| `groep-hartige-snacks.svg` | Hartige snacks en zoutjes | 72 | een schaaltje met chips of zoutjes |
| `groep-vetten-en-olien.svg` | Vetten en oliën | 70 | een oliefles met een druppel |
| `groep-vleeswaren.svg` | Vleeswaren | 65 | twee plakjes vleeswaar, licht verschoven |
| `groep-vervangers.svg` | Vleesvervangers en zuivelvervangers | 62 | een blokje tofu met een blad |
| `groep-flesvoeding.svg` | Flesvoeding en preparaten | 58 | een babyfles met een speen |
| `groep-kruiden-en-specerijen.svg` | Kruiden en specerijen | 51 | een takje kruiden naast een strooipotje |
| `groep-aardappelen.svg` | Aardappelen en knolgewassen | 49 | een aardappel, eventueel half doorgesneden |
| `groep-alcohol.svg` | Alcoholische dranken | 41 | een wijnglas |
| `groep-peulvruchten.svg` | Peulvruchten | 39 | een open peul met bonen |
| `groep-noten-en-zaden.svg` | Noten en zaden | 37 | een noot in de dop, met een paar zaden |
| `groep-soepen.svg` | Soepen | 29 | een soepkom met een lepel |
| `groep-hartig-broodbeleg.svg` | Hartig broodbeleg | 24 | een boterham met beleg, van opzij |
| `groep-diversen.svg` | Diversen | 18 | het lastigste: iets neutraals, geen vraagteken |
| `groep-eieren.svg` | Eieren | 13 | een ei, half gepeld of doorgesneden |

`groep-diversen` is met opzet als laatste genoemd. Het is een restcategorie en
een vraagteken of een lege doos ziet eruit als een fout. Denk eerder aan een
neutraal schaaltje of een eenvoudige verpakking.

## Volgorde

Begin met **`groep-groente.svg`**. Laat het zien, dan beoordeel ik het, en pas
daarna de volgende vijf. Eén goed voorbeeld bepaalt de hele familie.

## Hoe ik ze controleer

1. Staat er ergens een hexcode of `style`? Dan afgekeurd.
2. Is de vorm op 32 pixels nog te onderscheiden van de buurgroepen?
3. Werkt hij in het groen op wit én in het lichtgroen op bijna-zwart?
4. Oogt hij als één familie met de vorige?
