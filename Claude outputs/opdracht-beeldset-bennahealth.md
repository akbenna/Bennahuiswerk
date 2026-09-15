# Opdracht: beeldset voor BennaHealth

*Plak dit hele bericht in ChatGPT. Vraag om de bestanden één voor één, niet allemaal
tegelijk — dan blijft de kwaliteit hoog en kun je per stuk bijsturen.*

---

Ik bouw BennaHealth, een Nederlandstalige app over voeding, gewicht en
cardiometabole gezondheid. Ik zoek een beeldset die grafischer en illustratiever
is dan een gewoon lijnpictogram, maar die aan een paar harde technische eisen
voldoet. Lees die eisen eerst helemaal door — een eerdere set is er precies op
gesneuveld.

## Leveringsvorm — hier is geen speelruimte

**Lever SVG-broncode, geen PNG en geen JPG.** Eén codeblok per bestand, met de
bestandsnaam erboven. Geen ZIP, geen afbeelding van een SVG, geen
gegenereerd plaatje dat "er als vector uitziet". Ik plak de code rechtstreeks in
mijn app.

**Geen tekst in de tekening.** Geen bestandsnaam, geen bijschrift, geen label,
geen watermerk. De vorige set had het bijschrift in de afbeelding gebrand.

**Geen `<image>`, geen base64, geen ingesloten bitmap.** Alleen `<path>`,
`<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, `<g>`.

**Geen verlopen, geen filters, geen schaduwen, geen `style`-blok.** Vlakke
vormen. Attributen op het element zelf.

**Geen emoji en niets uit een bestaande iconenset.** Zelf tekenen. Geen merken,
logo's of herkenbare producten.

## De kleurregel — dit is de belangrijkste eis

De app heeft een licht en een donker thema en die moeten allebei kloppen. Een
tekening met vaste kleuren kan dat niet, dus:

**Gebruik uitsluitend `currentColor`.** Elke `fill` en elke `stroke` is
`currentColor`. Diepte maak je met `fill-opacity` — bijvoorbeeld `1` voor de
hoofdvorm, `0.45` voor een tweede laag, `0.2` voor een derde. Zo krijg je een
duotoon-effect dat illustratief oogt en toch in elke kleur werkt.

Schrijf nooit een hexcode in de SVG. Ik zet de kleur van buitenaf.

Ter oriëntatie, dit zijn de kleuren die de app eromheen gebruikt — niet om in te
bakken, maar zodat je weet waar de tekening op terechtkomt:

| | licht | donker |
|---|---|---|
| ondergrond | `#F3F6F5` | `#080D0C` |
| kaart | `#FFFFFF` | `#121A18` |
| accent (groen) | `#07785C` | `#4FD2A6` |
| let op (oker) | `#8A5A00` | `#E9BC55` |
| waarschuwing | `#A32F2A` | `#F09B95` |

Toets elke tekening zelf: leest hij als hij helemaal `#07785C` is op wit, én als
hij helemaal `#4FD2A6` is op bijna-zwart? Zo niet, teken hem opnieuw.

## De stijl

Illustratiever dan een lijnpictogram: gevulde vormen, herkenbare silhouetten,
een beetje karakter. Maar rustig — dit is een medische app en geen spel. Denk aan
het beeldwerk in een goed schoolboek: helder, vriendelijk, zonder grap.

Geen perspectief, geen 3D, geen glans, geen cartoonogen. Ronde hoeken mogen.

## Wat ik nodig heb

### A. Vier toestandstekens — `viewBox="0 0 24 24"`

Bestandsnamen: `toestand-goed.svg`, `toestand-letop.svg`,
`toestand-waarschuwing.svg`, `toestand-toelichting.svg`

Deze moeten leesbaar blijven op **16 pixels**. Teken ze dus op 24 en controleer
op 16. Belangrijk: de vier moeten aan hun **silhouet** te onderscheiden zijn, ook
zonder kleur — iemand die rood en oranje niet uit elkaar houdt moet zien welke
zwaarder weegt. Een driehoek voor de waarschuwing en cirkels voor de rest is een
beproefde oplossing, maar verzin gerust iets beters.

### B. Zes tabbladtekens — `viewBox="0 0 24 24"`, leesbaar op 21 pixels

`tab-vandaag.svg` — de dag als geheel; in de app staat er een doelring met een opening
`tab-inzicht.svg` — een dalende lijn: de gewichtstrend
`tab-voeding.svg` — een kom met damp; eten, niet het zoeken ernaar
`tab-beweging.svg` — twee voetstappen in een spoor (géén lopend poppetje, want dat
lijkt op 21 pixels te veel op het profieltekentje)
`tab-gezondheid.svg` — een hart
`tab-profiel.svg` — een persoon

Let op: **zes**, niet vijf. Beweging wordt vaak vergeten.

### C. Drie sfeervlakken — `viewBox="0 0 400 200"`

`sfeer-blad.svg`, `sfeer-golf.svg`, `sfeer-heuvel.svg`

Dit zijn achtergronden achter een kaart met tekst erover. Ze worden op **5 tot 7
procent dekking** gezet, dus ze moeten werken als een motief dat je nauwelijks
ziet. Dat betekent: grote vormen, weinig detail, hoog contrast tussen de lagen.
Fijne lijntjes verdwijnen.

Laat de vorm het vlak **uitlopen** aan minstens één zijde. Een motief dat
helemaal in beeld staat leest als een plaatje; afgesneden leest het als
achtergrond.

Blad hoort bij voeding, golf bij een reeks metingen, heuvel bij een trend.

### D. Illustraties bij lege schermen — `viewBox="0 0 240 200"`

`leeg-geen-maaltijden.svg` — nog niets gelogd vandaag
`leeg-geen-gegevens.svg` — te weinig metingen om een trend te tonen
`leeg-geen-doel.svg` — nog geen doel ingesteld

Hier mag het het meest illustratief. Deze staan groot en alleen op een leeg
scherm, dus ze mogen karakter hebben. Wel dezelfde regels: `currentColor`,
vlakke vormen, geen tekst.

## Volgorde

Begin met **één** teken uit A. Laat het zien, dan beoordeel ik het, en pas daarna
de rest. Eén goed voorbeeld is meer waard dan dertien middelmatige.

## Hoe ik het controleer

Van elk bestand kijk ik naar drie dingen, dus scheelt het tijd als je het zelf
al doet:

1. Staat er ergens een hexcode of `style`? Dan afgekeurd.
2. Blijft de vorm leesbaar op de kleinste maat die erbij staat?
3. Werkt hij in het groen op wit én in het lichtgroen op bijna-zwart?
