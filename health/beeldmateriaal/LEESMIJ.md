# Beeldmateriaal voor BennaHealth — wat er van de eerste asset-pack overblijft

Deze map staat met opzet **buiten `public/`**. Niets hierin wordt meegebouwd of
uitgeleverd. Het is een werkbank: hier ligt wat er van `bennahealth-assets-v1.zip`
bruikbaar was, zodat er een besluit over te nemen valt zonder dat er al iets in de
app staat.

## Wat er met de oorspronkelijke bestanden aan de hand was

Het waren geen exports maar uitsnedes van een contactvel. In vrijwel elk bestand
stond het bijschrift ingebrand — `icon_add.png` droeg de tekst "icon_add.png",
`button_primary.png` zelfs de mapnaam `12_buttons` — en er zat een flard van de
buurtegel tegen de linkerrand. Bij de voedselfoto's besloeg het onderwerp 38 tot
69 procent van het bestand; de rest was leegte, kaartrand en ruis.

Van de 83 bestanden zijn er 37 opgeschoond: onderwerp opgezocht, bijschrift en
randflarden weg, vierkant gecentreerd. De overige 46 zijn niet meegekomen, en
waarom staat hieronder.

## `eten/` — tien foto's, 384 × 384

Dit is het enige deel dat rechtstreeks bruikbaar is. Let op twee dingen.

De stijl is niet uniform: zalm, avocado en brood zijn fotorealistisch, banaan en
bosbessen zijn 3D-renders in emoji-stijl. Naast elkaar in één lijst valt dat op.

En er zijn er tien, tegenover duizenden NEVO-regels. Ze kunnen dus alleen staan
waar de verzameling gecurateerd en eindig is — de gerechtenbibliotheek — en niet
in de zoekuitslag van de voedingsmiddelentabel. Een lijst waarin drie van de
twaalf regels een plaatje hebben oogt kapot, niet levendig.

Er is op dit moment ook geen kolom om ze aan te hangen: de gerechtentabel in
`01-bibliotheek-en-portiematen.sql` kent geen beeldveld. Dat is een besluit dat
vóór het inbouwen genomen moet worden, niet erna.

## `referentie-iconen/` — 27 stuks, uitsluitend als vorm

Deze horen **niet** in de app. Ze liggen hier om dezelfde reden die
`public/iconen/LEESMIJ.md` al beschrijft: laat een generator de vórm bedenken,
meet de verhoudingen eruit, en teken hem over als vectorpad. Het bestand zelf is
onbruikbaar — bitmap, gerasterde randen, niet te hertinten, zichtbaar zacht zodra
je ze op 96 px bekijkt.

Ze passen bovendien niet op de balk die er staat. `src/health/tekens.tsx` heeft
zes tekens — Vandaag, Inzicht, Voeding, Beweging, Gezondheid, Profiel — en de
pack kent er vijf, zonder Beweging. De kom van Voeding en de dalende lijn van
Inzicht zijn daar met redenen zo getekend; de pack zet er vork-en-mes en een
staafdiagram voor in de plaats.

## Wat niet is meegekomen, en waarom

**`05_categories`, `06_goals`, `07_health_illustrations` — 19 bestanden.** Emoji,
op formaat getrokken: 🥣 🥗 🎯 🧠 🫀 🫁 🫃. `tekens.tsx` opent met de regel
"geen emoji — dat tekent elk toestel anders", en dat is hier niet eens het
zwaarste bezwaar: het beeldmateriaal van Apple-emoji is niet vrij te verspreiden,
en een anatomisch hart naast een getal leest als een uitspraak over dat hart.

**`09_progress`, `10_charts`, `11_badges`, `12_buttons` — 16 bestanden.** Plaatjes
ván de interface. `progress_calories.png` is een ring met "1.640 van 2.100 kcal"
er ingebakken. Die cijfers zijn levend en dragen een onzekerheid; als PNG kan
geen van beide.

**`13_backgrounds` — 4 bestanden.** Decoratieve landschappen achter getallen
kosten contrast, en dat is precies waar deze app niet aan hoort toe te geven.

**`01_logo` — 2 bestanden.** Een groen blad. Het merk van deze app ligt vast in
`public/iconen/LEESMIJ.md`: een balans met twee schalen in leisteen, onverzadigd,
"herkenbaar juist doordat hij niet meedoet".

**`14_empty_states` — 3 bestanden.** Wel opgeschoond maar niet meegenomen:
`empty_no_meals.png` is halverwege afgesneden, en de andere twee zijn lijntekeningen
die net zo goed als vectorpad te tekenen zijn.

## Eén ding om eerst te beslissen

`design_tokens.json` zet `primary` op `#2E7D32` en `secondary` op `#4CAF50` — de
Material-groenen. `src/health/stijl.css` draait op `--k #07785C` en
`--kfel #10A87E`. Eén van de twee moet wijken, anders vloekt elk geleverd groen
met elke ring die de app zelf tekent.
