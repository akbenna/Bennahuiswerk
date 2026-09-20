# Beeldmateriaal voor BennaHealth, wat er van de eerste asset-pack overblijft

Deze map staat met opzet **buiten `public/`**. Niets hierin wordt meegebouwd of
uitgeleverd. Het is een werkbank: hier ligt wat er van `bennahealth-assets-v1.zip`
bruikbaar was, zodat er een besluit over te nemen valt zonder dat er al iets in de
app staat.

## Wat er met de oorspronkelijke bestanden aan de hand was

Het waren geen exports maar uitsnedes van een contactvel. In vrijwel elk bestand
stond het bijschrift ingebrand (`icon_add.png` droeg de tekst "icon_add.png",
`button_primary.png` zelfs de mapnaam `12_buttons`) en er zat een flard van de
buurtegel tegen de linkerrand. Bij de voedselfoto's besloeg het onderwerp 38 tot
69 procent van het bestand; de rest was leegte, kaartrand en ruis.

Van de 83 bestanden zijn er 37 opgeschoond: onderwerp opgezocht, bijschrift en
randflarden weg, vierkant gecentreerd. De overige 46 zijn niet meegekomen, en
waarom staat hieronder.

## Wat er inmiddels in gebruik is

Zes van de tien foto's staan sinds 14-09-2026 in `public/health/eten/` en worden
getoond in het portievenster: banaan, avocado, zalm, skyr, noten en volkorenbrood.
De koppeling staat in `src/health/beeld.ts`, een handgemaakte lijst van
NEVO-code naar bestand, met de reden erbij waarom het geen databasekolom is.

De vier andere zijn samengesteld (eieren met brood, salade met kip, linzensoep)
of hebben geen passende code (bosbessen). Die liggen hier tot er een plek voor
is.

## `eten/`: tien foto's, 384 × 384

Dit is het enige deel dat rechtstreeks bruikbaar is. Let op twee dingen.

De stijl is niet uniform: zalm, avocado en brood zijn fotorealistisch, banaan en
bosbessen zijn 3D-renders in emoji-stijl. Naast elkaar in één lijst valt dat op.

En er zijn er tien, tegenover duizenden NEVO-regels. Ze kunnen dus alleen staan
waar de verzameling gecurateerd en eindig is (de gerechtenbibliotheek) en niet
in de zoekuitslag van de voedingsmiddelentabel. Een lijst waarin drie van de
twaalf regels een plaatje hebben oogt kapot, niet levendig.

Er is op dit moment ook geen kolom om ze aan te hangen: de gerechtentabel in
`01-bibliotheek-en-portiematen.sql` kent geen beeldveld. Dat is een besluit dat
vóór het inbouwen genomen moet worden, niet erna.

## `referentie-iconen/`: 27 stuks, uitsluitend als vorm

Deze horen **niet** in de app. Ze liggen hier om dezelfde reden die
`public/iconen/LEESMIJ.md` al beschrijft: laat een generator de vórm bedenken,
meet de verhoudingen eruit, en teken hem over als vectorpad. Het bestand zelf is
onbruikbaar, bitmap, gerasterde randen, niet te hertinten, zichtbaar zacht zodra
je ze op 96 px bekijkt.

Ze passen bovendien niet op de balk die er staat. `src/health/tekens.tsx` heeft
zes tekens (Vandaag, Inzicht, Voeding, Beweging, Gezondheid, Profiel) en de
pack kent er vijf, zonder Beweging. De kom van Voeding en de dalende lijn van
Inzicht zijn daar met redenen zo getekend; de pack zet er vork-en-mes en een
staafdiagram voor in de plaats.

## Wat niet is meegekomen, en waarom

**`05_categories`, `06_goals`, `07_health_illustrations`, 19 bestanden.** Emoji,
op formaat getrokken: 🥣 🥗 🎯 🧠 🫀 🫁 🫃. `tekens.tsx` opent met de regel
"geen emoji, dat tekent elk toestel anders", en dat is hier niet eens het
zwaarste bezwaar: het beeldmateriaal van Apple-emoji is niet vrij te verspreiden,
en een anatomisch hart naast een getal leest als een uitspraak over dat hart.

**`09_progress`, `10_charts`, `11_badges`, `12_buttons`, 16 bestanden.** Plaatjes
ván de interface. `progress_calories.png` is een ring met "1.640 van 2.100 kcal"
er ingebakken. Die cijfers zijn levend en dragen een onzekerheid; als PNG kan
geen van beide.

**`13_backgrounds`: 4 bestanden.** Decoratieve landschappen achter getallen
kosten contrast, en dat is precies waar deze app niet aan hoort toe te geven.

**`01_logo`: 2 bestanden.** Een groen blad. Het merk van deze app ligt vast in
`public/iconen/LEESMIJ.md`: een balans met twee schalen in leisteen, onverzadigd,
"herkenbaar juist doordat hij niet meedoet".

**`14_empty_states`: 3 bestanden.** Wel opgeschoond maar niet meegenomen:
`empty_no_meals.png` is halverwege afgesneden, en de andere twee zijn lijntekeningen
die net zo goed als vectorpad te tekenen zijn.

## Eén ding om eerst te beslissen

`design_tokens.json` zet `primary` op `#2E7D32` en `secondary` op `#4CAF50`, de
Material-groenen. `src/health/stijl.css` draait op `--k #07785C` en
`--kfel #10A87E`. Eén van de twee moet wijken, anders vloekt elk geleverd groen
met elke ring die de app zelf tekent.

---

# De tweede levering: achttien foto's, 15-09-2026

De eerste set kon niet wat er van hem gevraagd werd, en dat is te meten. De zes
sfeerbanden bovenaan de schermen waren productfoto's van 384 bij 384. De band is
over de volle breedte 400 tot 1320 punten; op een telefoon met drie beeldpunten
per punt vraagt dat er 1290. De bron werd dus **3,09 keer opgeblazen** op een
telefoon en 3,73 keer op een breed retinascherm. Dat is geen smaakoordeel maar
een verhouding, en het is precies wat je zag.

Ze waren bovendien vierkant, terwijl de band 8 op 3 is. Wat er van een vierkante
banaan in een band past is een plak door het midden.

## Wat er binnenkwam

Achttien JPEG's: zes schermbanden van 1600 bij 600 en twaalf gerechten van 1024
bij 1024, samen bijna zeven megabyte.

## Wat ermee gedaan is

Hercodeerd met `gereedschap/beeldverpakken.mjs`, geen `sharp` en geen
imagemagick in deze omgeving, wel een Chromium die er voor de proeven toch al
staat. Een canvas schaalt en codeert net zo goed.

| | van | naar | per stuk |
|---|---|---|---|
| schermbanden | 1600×600, ±330 kB | 1600×600, kwaliteit 80 | 78–142 kB |
| gerechten | 1024×1024, ±400 kB | 1400×525, kwaliteit 80 | 70–99 kB |

De gerechten zijn vierkant aangeleverd en worden als band getoond, dus ze zijn
liggend uit het midden gesneden. Samen 1,6 MB in plaats van 7.

De bronbestanden liggen **niet** in de repo. Bij de schermbanden zou dat een
tweede kopie van hetzelfde beeld zijn, wat er in `public/` staat is het
origineel op volle maat, alleen opnieuw gecodeerd. Bij de gerechten is het
verschil de uitsnede, en die is met de regel hierboven opnieuw te maken.

## Wat er is afgekeurd, en daarna goedgekomen

**`gerecht-kuru-fasulye.jpg`.** Het gerecht heet 'Kuru fasulye (witte bonen)' en
op de eerste foto stonden kikkererwten, rond, met het snaveltje, en niet de
ovale witte boon. Op het contactblad viel dat niet op, in een uitsnede van twee
keer wel. `beeld.ts` zegt: liever geen foto dan een foto die bijna klopt. Het
gerecht stond daarom een levering lang zonder beeld.

De tweede levering bracht de goede: witte bonen in tomatensaus met ui en groene
peper, rijst ernaast, çay erbij. Gekoppeld, en de proef bij de lijst noemt hem
nu bij naam.

Twee andere zijn wél gekoppeld en verdienen een aantekening. Bij de couscous is
het lamsvlees niet te zien (dat ligt bij dat gerecht onder de berg) en bij de
roti ontbreekt de kousenband naast de kip en de aardappel. Daar valt een
onderdeel buiten beeld; het is niet een ander gerecht.

## Wat er nog niet perfect was, en de derde levering, 15-09-2026

Op een scherm van 1920 punten met twee beeldpunten per punt vroeg de band er 2596
en waren er 1600: **1,65 keer opgeblazen**. Dat is opgelost met een levering op
2400 bij 900, plus een foto van kuru fasulye die wél witte bonen toont.

### Is 2400 echt fijner, of opgeschaald?

Gemeten, want dat verschil is niet met het oog te zien en het bepaalt of de hele
levering zin heeft. De maat is de gemiddelde absolute Laplaciaan, hoeveel
randenergie er per beeldpunt in zit. Een opschaling verzint geen detail, dus die
blijft op het niveau van de bron hangen. IJkpunt: dezelfde 1600 zelf naar 2400
getrokken.

| scherm | oud, 1600→2400 | nieuw, 2400 | verhouding |
|---|---|---|---|
| beweging | 2,03 | 2,68 | 1,32× |
| gezondheid | 1,52 | 2,02 | 1,33× |
| inzicht | 1,30 | 1,70 | 1,31× |
| meer | 1,79 | 2,37 | 1,33× |
| vandaag | 1,63 | 2,18 | 1,34× |
| voeding | 2,24 | 3,02 | 1,35× |

Consequent een derde meer randenergie. Dat is echt detail.

### Twee maten en niet één

Eén maat lost het niet netjes op. Een bureaublad van 1920 met twee beeldpunten
vraagt er 2564, een telefoon 1290. Zou er alleen een band van 2400 liggen, dan
haalt elke telefoon tweehonderd kilobyte per scherm binnen die hij niet kan
tonen, en dit is een app die vooral op een telefoon open staat.

Dus 1600 én 2400 per band, met een `srcset`. Wat de browser dan werkelijk kiest
is gemeten:

| | kiest | opblazing |
|---|---|---|
| telefoon 430, 3 beeldpunten | 1600 | 0,74× |
| bureaublad 1440, 1 beeldpunt | 1600 | 0,67× |
| breed 1920, 2 beeldpunten | 2400 | **1,10×** (was 1,65) |

### Een val bij het meten

`img.naturalWidth` betekent iets anders zodra er een `srcset` met
`w`-beschrijvingen op staat: de browser rekent hem terug naar de dichtheid
waarop hij het beeld toont. Een bron van 1600 in een doos van 408 punten geeft
dan 408 terug en niet 1600. De proef mat daarmee zichzelf (doos gedeeld door
doos) en meldde 2,91 keer opblazing op een band die perfect scherp stond. De
echte maat komt nu uit een los `Image` zonder srcset.

### De proef kijkt nu twee kanten op

Te klein kiezen geeft een zachte band; te groot kiezen kost een telefoon
bandbreedte die hij niet kan tonen. Een proef die alleen naar scherpte kijkt
vindt dat laatste prima. De ondergrens staat op 0,55 en dat is gemeten: goed
gekozen geeft 0,74 en 0,67, misgrijpen naar de 2400 geeft 0,49 en 0,45.

## De twee die uit `public/` zijn gehaald

`food_blueberries.png` en `food_salad_chicken.png` stonden er alleen als
sfeerband en hebben geen NEVO-code. Nu de banden eigen foto's hebben, werden ze
door niets meer aangeroepen. Ze liggen nog in `eten/` hiernaast.
