# Hoe deze app werkt

Dit is geen verantwoording en geen bouwhandleiding. `VERANTWOORDING.md` legt elke
rekenregel uit met bron en beperking, `BUILD.md` legt uit hoe je hem bouwt. Dit
bestand legt uit **waarom de app zich gedraagt zoals hij doet**, in gewone taal,
voor wie hem gebruikt of eraan verder werkt.

Alles hieronder komt terug op één regel.

---

## De grondregel: geen getal zonder zijn onzekerheid

Een puntschatting zonder interval is in dit ontwerp een fout, geen
vereenvoudiging.

Als de app zegt dat je vandaag 1.847 kcal at, dan zegt hij er in dezelfde adem bij
dat het tussen de 1.610 en 2.084 ligt. Niet uit valse bescheidenheid, maar omdat
dat de waarheid is: een deel van je eten is gewogen, een deel is geschat, en het
verschil daartussen mag niet verdwijnen zodra er een getal op het scherm komt.

Daaruit volgt de rest van dit document. Wie zich afvraagt waarom de app iets
omslachtig doet, vindt het antwoord bijna altijd hier.

---

## 1. De drie tekens

Voor elke regel in je dag staat een teken. Het zegt waar het getal vandaan komt.

| | | |
|---|---|---|
| **◆** | gemeten | een laboratoriumbepaling uit de Nederlandse voedingsmiddelentabel (NEVO) |
| **◈** | etiket | de opgave van een fabrikant, met een wettelijke marge van rond de tien procent |
| **◇** | geschat | het model, een gerecht, of je eigen product |

Deze drie zijn met opzet niet twee. Een etiket is geen laboratoriumbepaling, maar
het is ook geen gok: er staat een fabrikant achter die er wettelijk aan gehouden
kan worden. Onder ◇ scharen zou een etiket te laag inschatten, onder ◆ te hoog.

Dit is ook de reden dat merkproducten in een **eigen tabel** staan en niet in de
NEVO-tabel. Zou je ze daar doorheen mengen, dan kregen ze ◆ en zou de app
beweren dat een etiketopgave een meting is. Dat is precies de leugen die deze app
probeert niet te vertellen.

---

## 2. Hoe het zoeken werkt

Typ je iets in het zoekveld, dan gebeurt er dit, in deze volgorde.

**Stap 1 — de woorden.** Je zin wordt in woorden geknipt. Vulwoorden gaan eruit:
`met`, `van`, `de`, `een`, en ook de telwoorden `twee` tot en met `tien`. Dat
laatste is geen kosmetiek. Zoeken op "twee boterhammen met mayonaise" zette ooit
een graanreep bovenaan, omdat in de merknaam `b'tween` achter de apostrof een
nieuw woord begint waar `twee` op past — en omdat "twee" in vrijwel geen
productnaam voorkomt, woog het ook nog eens het zwaarst.

**Stap 2 — zeldzame woorden wegen zwaarder.** Wie "tonijn in water" zoekt, wordt
geholpen door "tonijn" en nauwelijks door "water". De app rekent dat uit in plaats
van het aan te nemen.

**Stap 3 — synoniemen.** NEVO schrijft niet zoals mensen praten. Er staat geen
boterham maar Tarwebrood, geen patat maar Frites, geen kipfilet maar "Kip filet".
Die woorden zijn er los aan gehangen, zodat je vindt wat je bedoelt.

**Stap 4 — en pas als dat allemaal niets oplevert: de benadering.**

### Wat "Niets met precies die spelling" betekent

Vindt het zoeken helemaal niets, dan probeert de app het nog één keer, en dan
**zegt hij dat ook**:

> Niets met precies die spelling. Dit lijkt erop:

Wat er dan gebeurt, is dit. Van elk woord wordt het **medeklinkerskelet**
genomen: accenten weg, dubbele letters samengetrokken, verwante medeklinkers
gelijkgesteld (c→k, d→t, j→g, v→f, z→s), en klinkers en de h eruit. Wat overblijft
is wat een woord hóórbaar maakt.

```
lasagne   → lsgn        lesagna   → lsgn        gelijk
couscous  → ksks        koeskoes  → ksks        gelijk
spaghetti → spgt        spagetti  → spgt        gelijk
komkommer → kmkmr       komkomer  → kmkmr       gelijk
```

Zo vindt "lesagna" toch de lasagne. Vóór dit bestond gaf één verkeerde letter een
leeg scherm, en voor een kind dat zijn eten intypt is dat de gewoonste manier om
op te geven.

**Waarom hij pas als laatste draait.** Een benadering mag nooit een echte treffer
verdringen. Typ je "mayonaise", dan krijg je exact wat je altijd kreeg, in exact
dezelfde volgorde.

**Waarom hij alleen naar namen kijkt.** Een eerdere versie liet ook
gelijkenis-op-letterniveau meetellen, en zocht bovendien in de synoniemenvelden
mee. Het resultaat was dat "harira" Haring en Bokking gaf (Engels: *herring*) en
sperziebonen (Frans: *haricots*), en dat "doner" Pepermunt gaf — want NEVO zet
daar "after dinner mints" bij, en `dinner` heeft hetzelfde skelet als `doner`.
Allemaal netjes onder de kop "dit lijkt erop". **Een fout antwoord, netjes
ingepakt, is erger dan een leeg scherm.** Daarom: alleen op wat NEVO zelf een naam
noemt, en niet op een synoniem dat zelf al een benadering is.

### Namen in je eigen taal

De gerechtenbibliotheek bewaart per gerecht ook de namen in andere talen —
Nederlands, Darija, Tarifit, Arabisch, Turks en Sranan. Die worden meegezocht.
"Mercimek" vindt de Turkse linzensoep, ook al staat dat woord in geen enkele
Nederlandse naam.

### Wat de app voorstelt als er nog iets in past

Op het dagscherm staat **Wat er nog in past**: hoeveel energie en hoeveel eiwit
er nog over is, met de band eromheen. Daaronder staan voorstellen, en die komen
uit twee bronnen, in deze volgorde.

**Eerst uit je eigen geschiedenis.** Wat je de afgelopen weken at, met de portie
die jij toen nam. Dat is de betere bron: je hebt het in huis, je weet hoe het
smaakt, en de getallen zijn overgenomen in plaats van geschat.

**Daarna uit de tabel**, onder het kopje *Uit de tabel*. Die verschijnt alleen
als het eiwit knelt, en toont wat het meeste eiwit per calorie levert binnen wat
er nog past — met de portie erbij waarin het gewoonlijk gegeten wordt, zodat er
niet "kwark" staat maar "een glas skyr, 90 kcal, 16 gram eiwit". Eiwitshakes en
eiwitrepen staan daar gewoon tussen, met ◈ ervoor: het zijn etiketwaarden en
geen metingen, en dat blijft te zien.

Waarom die volgorde? Een lijst van optimale producten die je nooit koopt is
netjes en nutteloos. En waarom er gerangschikt wordt op eiwit *per calorie* en
niet op eiwit: heb je nog 500 kcal en 45 gram eiwit te gaan, dan moet alles wat
er nog bij komt minstens 0,09 gram eiwit per kcal leveren, anders wordt de rest
van je dag moeilijker in plaats van makkelijker. Dat is een getal, en elk
voorstel is ertegen te toetsen.

---

## 3. Porties: de onzekerheid staat op de waarde, nooit op het gewicht

Dit onderscheid is klein en het is overal.

Een pak van 200 gram **is** 200 gram. Daar is niets onzeker aan; het staat op de
verpakking. Wat je niet zeker weet, is hoeveel kilocalorieën daarin zitten.

Dus: bij een merkproduct krijg je de fabrikantportie als eerste keuze, met het
gewicht als een hard getal en de energie met een marge eromheen. Bij een
huishoudmaat ("een eetlepel", "een schaaltje") ligt het andersom — dán is het
gewicht de onzekere kant, en staat er een band omheen.

### De breedste band smaller maken

Beschrijf je een maaltijd in woorden of maak je er een foto van, dan komt er een
lijst regels terug met elk een band: *"720 kcal (520–980)"*. Onder de regel met
de **breedste** band staat een weegveld.

Dat staat daar om een reden. Bij herkenning uit tekst of foto is niet het
herkennen de zwakke schakel maar de portie — het product benoemen is makkelijk,
de hoeveelheid schatten niet. Eén weging vervangt precies die post. In het
voorbeeld hierboven: 300 gram intikken maakt van 520–980 een band van 497–583.

En let op wat er blijft staan: **een band, geen getal.** De portie is nu bekend,
maar de voedingswaarde komt nog steeds uit de tabel, en die draagt zijn eigen
marge van ongeveer acht procent. Een app die na het wegen een kaal getal toont,
beweert dat de tabel exact is.

De graad gaat hoogstens naar C. Niet naar A — dat is voorbehouden aan een etiket
dat je zelf overnam, en dat is iets anders dan een tabelwaarde met een gewogen
portie.

### De tabel heeft gezag over het model

Vraag je de app om een maaltijd in gewone taal te herkennen, dan schat het model
wat er in zit. Maar hoeveel een eetlepel weegt, schat het model **niet** — dat
staat in de portietabel, en die wint. Als de tabel zegt dat een eetlepel 15 g is
(met 10–20 g als band), dan is het 15 g, en de app zegt erbij dat dat uit de tabel
komt en niet geschat is.

Deze regel gold al voor voedingsstoffen en geldt sinds kort ook voor
portiegewichten. Hij is er gekomen omdat één schaaltje cornflakes op 180 g stond
— dat is 672 kcal. Het is 54 g.

---

## 4. Waar het dagverbruik vandaan komt

Niet uit een formule maar uit **jouw gewichtstrend**. De app kijkt naar wat je at
en wat de weegschaal deed, en leidt daaruit af hoeveel je verbrandt.

Dat is meer werk dan een formule invullen, en het is om één reden beter: door te
meten worden adaptieve thermogenese (je verbranding zakt als je afvalt) en je
persoonlijke activiteitsniveau **automatisch meegenomen**. Die hoeven niet
gemodelleerd te worden — ze zitten al in de meting.

De prijs is dat het even duurt. De eerste weken leunt de app nog op een
formuleschatting en is het interval breed. Dat is geen storing; dat is het
interval dat eerlijk is over hoe weinig er nog gemeten is.

De volledige onderbouwing, inclusief wat er níet te verifiëren viel, staat in
`VERANTWOORDING.md`.

### Bewegen: stappen of minuten, en geen calorieën

Beweging telt als gehaald bij **8.000 stappen per dag** of **150 minuten matige
inspanning per week**. Eén van de twee is genoeg — het gaat om de belasting, niet
om de manier. Die tweede is er gekomen voor de hometrainer: een halfuur fietsen
levert geen enkele stap op, en de app zei tot voor kort doodleuk "nog 913 stappen
te gaan" tegen iemand die net drie kwartier had gefietst.

Wat je invult is een **soort** en een aantal **minuten**: wandelen, hardlopen,
fietsen, zwemmen, roeien, tennis, dansen, tuinieren, of iets anders met een naam
die je er zelf bij zet.

De soort bepaalt hoe zwaar de minuten tellen. De WHO-richtlijn noemt namelijk
twee bedragen: 150 minuten matige inspanning per week, óf 75 zware, waarbij een
minuut zware voor twee matige telt. Veertig minuten hardlopen telt dus als
tachtig. Op het scherm staan allebei de getallen — wat je gedaan hebt en wat het
telt — want één ervan zou over het andere liegen.

Of iets matig of zwaar is, leidt de app af uit de soort, en dat staat er ook zo
bij: **aangenomen**. Rennen is niet altijd zwaar en wandelen niet altijd matig.
Klopt het niet, dan zet je de schakelaar om, en dan onthoudt hij dat jíj het
gekozen hebt.

Krachttraining telt hier níet mee. Die staat in de richtlijn apart — twee keer
per week — en heeft op datzelfde scherm zijn eigen drie bolletjes.

Wat je verder níet invult: geen afstand — op een hometrainer is er geen afstand.
Geen weerstand, geen fietstype, geen merk: zonder vermogensmeter is dat allemaal
een gok, en een gok met een bredere marge dan het antwoord waard is.

En met opzet **geen calorieën**. Een schatting uit hartslag of uit een tabel heeft
een fout van twintig tot vijftig procent die niet consistent in één richting
zit, dus corrigeren kan niet. Het hoeft ook niet: je verbruik komt uit je
gewichtstrend, en wat je op de fiets verbrandt zit daar al in. Wat dit scherm
doet is bijhouden dát je bewoog.

---

## 5. De poorten op de gegevensbronnen

Twee bronnen liggen achter een schakelaar die uit staat tenzij iemand hem
bewust omzet.

**NEVO.** De brontabel zelf staat niet in deze repo — dat mag niet van de
licentie. Wat er staat is wat eruit is afgeleid en in de database zit. Staat de
licentie van de actieve versie niet op "gecontroleerd", dan vindt het zoeken
niets. Dat is geen storing maar het slot dat werkt.

**Open Food Facts** (de merkproducten). Die staan onder ODbL: je mag ze
gebruiken en verspreiden, maar bronvermelding is verplicht. Daarom kan die bron
niet aan zonder dat er een bronvermelding is ingevuld. Een voorwaarde die nergens
vastligt, wordt vergeten.

---

## 6. Wat waar bewaard wordt

- **Je dagen, je gewicht, je maaltijden** — centraal, achter je eigen aanmelding.
- **De cursussen van de Academie** — alleen op het toestel waar je ze doet, in de
  browseropslag. Geen account, geen naam, geen code.
- **Je aanmelding** — acht uur, daarna verloopt hij vanzelf. Op een gedeelde
  tablet blijft anders het account van 's ochtends de hele avond openstaan.
- **Dag of nacht** — alleen op dit toestel, net als de cursussen. Onder *Profiel
  → Dag of nacht* staan drie standen: **Volg het toestel**, **Dag**, **Nacht**.
  De eerste is de grondstand en schakelt mee met de schemerstand van iOS; de
  andere twee zetten hem vast, ook als je telefoon iets anders doet. Er staat
  bewust geen tuimelschakelaar met twee standen: die kan "volg het toestel" niet
  uitdrukken, en zodra je hem één keer aanraakt kun je er niet meer terug.

Toegang tot de database loopt altijd via functies met vaste rechten; de tabellen
zijn niet rechtstreeks te lezen. In de browser komt alleen de publieke sleutel.
Waarom dat veilig is, staat uitgelegd in `src/gedeeld/db/verbinding.ts`.

---

## 7. Als er meer speelt dan je gewicht

Bij je profiel kun je aangeven dat je hoge bloeddruk hebt, diabetes type 2, of
een hart- of vaatziekte hebt gehad, en welke medicijnen je gebruikt. Dat laatste
in groepen — insuline, een tablet die suiker uitplast, een bloeddrukpil die op de
nieren werkt — en niet in merknamen, met bij elke groep een voorbeeld zodat je
hem kunt aanwijzen.

Vul je niets in, dan verandert er niets. Leeg betekent voor deze app dat hij het
niet weet, en dan zwijgt hij. Wat je invult is jouw opgave en geen
medicatieoverzicht uit de praktijk; dat staat er op het scherm ook bij.

### Wat er dan verandert

Er komt geen tabblad bij en er verandert niets aan de manier waarop de app
rekent. Wat er verandert is wat je ziet.

Op **Vandaag**, onder de knop, kan een kaart verschijnen. Bijvoorbeeld als je
insuline gebruikt en een afvaldoel hebt: je insulinebehoefte daalt als je
afvalt, en de dosis die vorige maand klopte kan over een paar weken te hoog zijn.
De kaart zegt wat je ermee moet — het met je praktijkondersteuner bespreken — en
de uitleg zit erachter. Hij noemt geen dosis. Dat kan deze app niet en dat hoort
hij dus niet te doen.

Op **Voeding** staat bij diabetes onder elk product hoeveel koolhydraten en
vezels erin zitten, naast de energie en het eiwit die er altijd al stonden.
Bij hoge bloeddruk staat het zout erbij, in gram — hetzelfde getal als op de
verpakking. Weet de tabel het voor een product niet, dan staat er een streepje en
geen 0,0: dat zou beweren dat er geen zout in zit, en dat is iets anders dan
onbekend.

Onder **Meer** staat *Leren*: korte stukjes over een te lage bloedsuiker, over
zout en bloeddruk, over thuis meten, over koolhydraten en vezels. Ze staan er
voor iedereen hetzelfde en met de bron erbij; wat bij jou hoort staat bovenaan.
Er valt niets weg — je mag lezen over iets wat je niet hebt.

### Wat je spieren vasthoudt

Bij snel afvallen verdwijnt er naast vet ook spier — bij semaglutide was dat in
onderzoek ongeveer 45 procent van wat je kwijtraakt. Geen app kan dat meten. Wat
deze wel doet, op het scherm Beweging, is de drie dingen naast elkaar zetten
waarvan bekend is dat ze het tegengaan.

**Eiwit per maaltijd.** Niet je dagtotaal — dat staat al bij Voeding — maar of
elke maaltijd boven de 30 gram uitkomt. Daaronder komt de spieraanmaak
nauwelijks op gang, en in een calorietekort telt dat zwaarder dan je dagtotaal.
Ligt je dagdoel gedeeld door drie ónder die 30 gram, dan zegt de app dat, met het
antwoord erbij: verdeel het over twee grotere maaltijden in plaats van drie.

**Krachttraining.** Die telt al mee op hetzelfde scherm.

**Opstaan uit een stoel.** Vijf keer opstaan en gaan zitten zonder je armen te
gebruiken, met de klok van je telefoon. Boven de vijftien seconden is dat een
aanwijzing om te bespreken — geen diagnose.

Daarnaast kun je vijf vragen invullen over kracht, lopen, opstaan, traplopen en
vallen. Eén genoemde klacht levert al een regel op. Dat is met opzet: deze lijst
hoort dingen op te sporen, niet uit te sluiten.

**Er komt geen score uit.** De drie meten elk iets anders, met een eigen
onzekerheid; er één cijfer van maken zou nauwkeurigheid suggereren die er niet
is. En de richting van dit advies is goed onderbouwd, de grootte niet — de app
zegt dat er zelf bij.

### Wat ontbreekt er, en waarom de app daar voorzichtig in is

Op het dagscherm staat een kaart *Wat ontbreekt er?*. Vijf regels, en ze kijken
naar twee verschillende dingen.

**Drie kijken naar je logboek.** IJzer, omega-3 en calcium. De
voedingsmiddelentabel bevat geen vitamines en mineralen, dus de app kan nooit
zien hoevéél er binnenkomt — alleen welke hoeken je overslaat. Die drie staan
daarom op *overwegen* en wijzen naar je huisarts, niet naar een potje. En onder
de veertien gelogde dagen zwijgen ze: vier dagen zonder vis zegt iets over je
invoer en niets over je voeding.

**Twee kijken naar je profiel.** Die hangen aan geen enkele log.

*Vitamine D* is het meest gegeven suppletieadvies van Nederland. De
Gezondheidsraad adviseert 20 microgram per dag vanaf 70 jaar, 10 microgram voor
vrouwen van 50 tot en met 69, en 10 microgram op elke leeftijd bij een getinte of
donkere huid of bij weinig buitenkomen of bedekkende kleding. Die laatste twee
vraagt de app apart bij *Wat er bij jou speelt* — hij leidt ze niet af uit je
afkomst, want afkomst is geen huidskleur. Staat er geen leeftijd in je profiel,
dan zegt de app daarover niets in plaats van te gokken.

*B12 bij metformine.* Langdurig metformine verlaagt de opname van B12. Dat is een
reden om het te laten prikken en niet om te gaan slikken. Vul je metformine in
bij je medicijnen, dan komt die regel vanzelf.

**Is de lijst leeg, dan noemt hij wat hij nagekeken heeft** — met per regel wat
hij zag. Leeg zonder die opsomming is niet te onderscheiden van kapot.

### De bloeddruk telt per week, niet per meting

Meet je thuis je bloeddruk, dan laat **Gezondheid** het gemiddelde over de
afgelopen week zien, met erbij op hoeveel dagen het rust en hoe ver die dagen
uiteenliepen. Eén meting van 148 zegt niets; zeven dagen die daar rond uitkomen
zeggen alles. Dezelfde reden waarom de app naar je gewichtstrend kijkt en niet
naar de weging van vanochtend.

Elke dag telt daarbij één keer mee, ook als je die dag vier keer mat. Het gaat om
de week.

Er staat geen oordeel bij en geen kleur. De meting zoals de richtlijn hem
bedoelt is twee keer voor het ontbijt en twee keer twee uur na het avondeten, een
week lang — en of je dat zo gedaan hebt kan de app niet zien, want een meting
draagt hier een datum en geen tijdstip. Wat het getal betekent, hoor je van je
huisarts of praktijkondersteuner.

## 8. Wat de app niet weet

Dit hoort er net zo goed in te staan.

- Hij weet niet of je alles hebt ingevoerd. Onderrapportage is de grootste
  foutenbron in elk voedingsdagboek, ook in dit.
- Hij weet bij een gerecht niet wat er is ingedampt. Wat verdampt verdwijnt uit
  de pan maar niet uit de noemer, dus bij lang stoven valt de uitkomst aan de
  lage kant. Dat staat bij de regel en wordt niet weggepoetst.
- Hij weet niet of er lamsvlees in de harira ging. Dat is geen onzekerheid maar
  een vraag met een antwoord, en die vraag stelt hij.
- Hij weet niet welke medicijnen je werkelijk gebruikt. Hij weet wat je hebt
  aangevinkt, en dat is iets anders.
- Hij weet niet of je bloeddrukmeting thuis of in de praktijk is gedaan, en
  evenmin of hij 's ochtends of 's avonds was. Alles wat je invult telt mee.

---

## Voor wie eraan verder werkt

`CLAUDE.md` heeft de werkafspraken, `BUILD.md` de bouw, `VERANTWOORDING.md` elke
rekenregel, `AUTOMATISERING.md` wat er vanzelf draait, en `BESCHOUWING.md` een
terugblik met de fouten erin die onderweg gemaakt zijn.

Eén gewoonte is belangrijker dan alle vier: **meten voordat je verandert.** In
deze app is bijna elke aanname die vanzelfsprekend leek, bij nameten onjuist
gebleken — de mayonaise die "stuk" was, de eetlepel die "ontbrak", de macaroni die
niet bestaat, en de haring die voor harira doorging.
