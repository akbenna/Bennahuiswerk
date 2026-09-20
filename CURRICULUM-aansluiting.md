# Curriculum-aansluiting BennaHub

_Opgesteld juli 2026, bijgewerkt september 2026 voor schooljaar **2026/27**. Doel: de oefenstof laten aansluiten op de gangbare Nederlandse leerlijnen én op de klas waar elk kind nu werkelijk in zit. De landelijke domeinindeling is leidend; de oefenvragen die ik toevoeg zijn origineel en zelf opgesteld op basis van die openbare domeinstructuur, geen materiaal van uitgevers of Junior Einstein overgenomen._

## Uitgangspunt: hoe Nederland de leerlijnen indeelt

Voor het basisonderwijs gelden de **referentieniveaus** (1F als fundamenteel, 1S als streefniveau aan het eind van groep 8), met voor rekenen vier domeinen: **Getallen, Verhoudingen, Meten & Meetkunde, Verbanden**. De **doorstroomtoets** (sinds 2024, IEP is één van de aanbieders) toetst drie verplichte onderdelen: **Lezen, Taalverzorging en Rekenen**. In het voortgezet onderwijs werkt de onderbouw met kerndoelen en referentieniveaus (2F/3F), en de bovenbouw met **examenprogramma's** die per vak in domeinen zijn verdeeld, voor vwo-wiskunde A bijvoorbeeld domein A (vaardigheden), B (algebra en tellen), C (verbanden), D (verandering), E (statistiek en kansrekening) en F (keuze).

De app is al grotendeels langs deze lijnen opgebouwd. De aansluiting bestaat dus uit drie dingen: (1) de niveaulabels gelijkzetten met het nieuwe schooljaar, (2) de onderwerpen herkenbaar onder de officiële domeinen hangen, en (3) de resterende gaten vullen met oefenstof op het juiste niveau.

## Hoe het schooljaar doorwerkt

De opgaven in `seed.ts` dragen hun leerjaar ten opzichte van het niveau waarop ze zijn geschreven: geen `jaar` is "dit jaar", `jaar: 'next'` is de klas erna. Welke klas dat nú is, staat in `gegevens/schooljaar.ts`, één bestand dat elk jaar in augustus wordt bijgewerkt. Voor wie is overgegaan wordt de stof van "volgend jaar" de stof van nu; wat daar al stond blijft staan als herhaling, en dat is geen slordigheid: voor de doorstroomtoets en het eindexamen ís de stof van vorig jaar gewoon examenstof.

Twee gevolgen die je moet kennen voordat je iets wijzigt. **Wassima doet 2 havo over**: bij haar schuift er niets, en nieuwe 3-havo-stof zou haar juist een jaar te ver vooruit zetten. En **de schakelaar "Volgend jaar" is dit schooljaar alleen bij haar zichtbaar**: bij de andere drie is die vooruitblik de stof van nu geworden, en de knop verbergt zichzelf als er niets achter zit.

Nieuwe stof komt niet in `seed.ts` maar in `gegevens/schooljaar2627.ts`, met een eigen id-reeks (`nw26_*`). Beide lijsten zijn positioneel genummerd, dus opgaven ertussen schuiven koppelt elke Leitner-kaart los van zijn geschiedenis: nieuwe opgaven horen er áchteraan bij.

---

## Selma: groep 5 (dit schooljaar), groep 6 als volgende stap

_Zij is afgelopen zomer overgegaan naar groep 5. Het complete groep-5-blok dat hier als vooruitblik klaarstond, is daarmee haar hoofdaanbod geworden; het groep-4-werk blijft eronder staan als herhaling._

**Officiële leerlijn rekenen groep 6, waar ze volgend jaar naartoe werkt.** Getallen: rekenen tot en met 100.000, verder automatiseren van de tafels t/m 10, grotere vermenigvuldigingen en delingen (met rest). Verhoudingen: breuken (halven, kwarten, derden, vijfden, zesden, achtsten, tienden) plaatsen op de getallenlijn, vergelijken en eenvoudig vereenvoudigen; eerste stappen met verhoudingstabellen. Meten & Meetkunde: lengte/gewicht/inhoud met kommagetallen, tijd en kalender, oppervlakte via hokjes tellen. Verbanden: aflezen en invullen van tabellen en staafdiagrammen. Kommagetallen worden in groep 6 echt geïntroduceerd (geld en meten).

**Taal groep 6.** Spelling breidt uit: open/gesloten lettergrepen, verkleinwoorden, samenstellingen, ei/ij en au/ou consolideren, begin werkwoordspelling (tegenwoordige tijd: stam, stam+t). Begrijpend lezen: hoofdgedachte, verwijswoorden, signaalwoorden, feit en mening op eenvoudig niveau.

**Huidige dekking in de app.** Groep 5 staat er ruim op: rekenen ± 185 opgaven, taal ± 88, begrijpend lezen ± 53. Een handvol groep-6-onderwerpen (getallen tot 100.000, delen met rest, vermenigvuldigen met grotere getallen, oppervlakte via hokjes) staat daar tussen, die waren als vooruitblik geschreven en zijn met de jaarwissel meegeschoven. Ze blijven waar ze staan: uit de lijst halen zou elke `seed_*`-id erna verschuiven.

**Gaten om te vullen:** begrijpend lezen blijft het dunst van de drie vakken. Open en gesloten lettergreep (dé spellingregel van groep 5) stond er met twee opgaven op en is in september aangevuld tot acht.

---

## Amine: groep 8, doorstroomtoets (IEP-stijl)

_Hij zit sinds september in groep 8. De doorstroomtoets valt begin 2027. Zijn groep-7-stof blijft meedoen als herhaling, voor deze toets ís dat gewoon toetsstof._

**De drie verplichte onderdelen.** *Rekenen*: de vier domeinen Getallen, Verhoudingen, Meten & Meetkunde, Verbanden, op 1F/1S-niveau (procenten, breuken, kommagetallen, schaal, oppervlakte/omtrek/inhoud, gemiddelde, grafieken). *Taalverzorging*: werkwoordspelling (tegenwoordige/verleden tijd, voltooid deelwoord, het lastige 't kofschip' en 'd/dt'), niet-werkwoordspelling (ei/ij, au/ou, s/z, d/t aan het eind), leestekens en hoofdletters. *Lezen*: leestechniek en woordenschat, begrijpen, interpreteren, evalueren, samenvatten en opzoeken.

**Zijn detailrapport: zwakke punten:** samenvatten, woordenschat, opzoeken, werkwoordspelling. Die krijgen prioriteit.

**Huidige dekking.** Ruim vierhonderd opgaven, goed uitgelijnd op de IEP-categorieën. Zijn vier zwakke punten staan er inmiddels stevig op: werkwoordspelling ± 43, voltooid deelwoord ± 19, samenvatten ± 12, opzoeken ± 16, woordenschat in context ± 8.

**Gaten om te vullen:** de dunne IEP-leescategorieën, hoofdgedachte, verwijswoorden, soorten teksten en interpreteren stonden op vier, vier, twee en één, en zijn in september aangevuld. Het voltooid deelwoord had zes opgaven op niveau 1 en zeven op niveau 3 en niets ertussen; die middelste trede is gevuld met werkwoorden die al een voorvoegsel hebben (ver-, be-, ont-, her-) en dus géén ge- krijgen.

---

## Wassima: 2 havo → 3 havo

**Zij doet 2 havo over.** Van de vier kinderen is zij de enige die niet opschuift, en dat is precies het soort detail dat een volgende hand "gelijktrekt" met de rest omdat het eruitziet als een vergeten regel. Dan ziet een kind dat net is blijven zitten stof die het nooit gehad heeft. De app houdt via de leerjaar-schakelaar beide niveaus vast: **2 havo als "dit jaar"** en **3 havo als vooruitblik**, zij is dit schooljaar de enige bij wie die knop nog verschijnt.

**Referentie/kerndoelen onderbouw havo.** Wiskunde: rekenen met negatieve getallen, breuken en procenten (2F→3F), verhoudingen en schaal, lineaire verbanden en grafieken, oppervlakte/omtrek/inhoud, Pythagoras, eerste stappen algebra (herleiden, haakjes, vergelijkingen). Natuurkunde: grootheden en eenheden, krachten, snelheid, energie, elektriciteit, licht en geluid. Talen en zaakvakken op onderbouwniveau.

**Huidige dekking.** Exact staat er stevig op (wiskunde ± 65%, natuurkunde ± 60%). **Gaten om te vullen:** 3 havo-verdieping als "volgend jaar" (kwadratische verbanden intro, machten, stelsels eenvoudig; natuurkunde: formules met eenheden combineren), en de talen/zaakvakken breder (woordenschat per thema, meer werkwoordstijden).

---

## Amaani: 5 vwo

_Zij zit sinds september in 5 vwo. De 4-vwo-stof blijft meedoen als herhaling; voor het eindexamen is dat examenstof._

**Examenprogramma's, kerndomeinen.** *Wiskunde A*: domein B algebra en tellen (rekenregels, machten, procenten/groeifactoren, tellen), domein C verbanden (formules, grafieken, exponentieel en lineair), domein D verandering (toe-/afname, hellingen), domein E **statistiek en kansrekening** (in vwo A het zwaartepunt: centrummaten, spreiding, relatieve frequentie, kansen met en/of-regel, met/zonder terugleggen, verwachtingswaarde). *Natuurkunde*: samengestelde vraagstukken (kinematica, krachten, energie en vermogen, druk, elektriciteit). *Scheikunde*: rekenen aan reacties, molverhoudingen, reactievergelijkingen kloppend maken, reactiesnelheid.

**Huidige dekking.** Wiskunde A ± 65%, natuurkunde ± 65%, scheikunde ± 50%. **Gaten om te vullen:** wiskunde A statistiek/kansrekening verder uitdiepen (verwachtingswaarde, boomdiagram, combinaties), exponentiële groei en groeifactoren, scheikunde molrekenen en kloppend maken op niveau 3, natuurkunde samengestelde vraagstukken met meerdere formules.

---

## Aanpak in de app

1. **Profielniveaus** staan in `gegevens/schooljaar.ts` en gelden voor 2026/27: Selma groep 5, Amine groep 8, Amaani 5 vwo, en Wassima 2 havo (overdoen). Eén bestand bijwerken in augustus, meer niet, het migratieverslag `PROFIELEN_OUD` blijft staan waar het staat, want dat is het bewijs dat de overzetting uit de oude pagina klopte.
2. **Domein-labels**: elk onderwerp rolt op naar het officiële domein, zodat het rapport en de proeftoets herkenbaar het schoolcurriculum volgen.
3. **Content per kind**: nieuwe oefenstof op het nieuwe niveau, met prioriteit op de gaten hierboven. Omdat elke som klopt moet zijn, doe ik dit in gecontroleerde batches (rekenkundig geverifieerd) en breid ik per kind verder uit, liever correct en stapsgewijs dan veel en slordig.

---

## Naschrift, september 2026: waarom de aanvulling sjablonen werd

De aanpak hierboven ("content per kind, in gecontroleerde batches") liep tegen
een grens aan die pas zichtbaar werd toen de kinderen de app echt gingen
gebruiken. Amine kreeg bij `Delen` tien keer achter elkaar dezelfde som, met
"beheerst" erboven. De oorzaak was niet de planner maar de voorraad: dat
onderwerp had drie vaste opgaven, één per niveau, en wie op een vast niveau
oefent houdt er dan één over.

Losse opgaven bijschrijven lost dat maar half op. Tien sommen zijn na twee
rondjes ook uit het hoofd geleerd; dan oefent een kind zijn geheugen in plaats
van de methode. Voor alles wat uit te rekenen valt is een sjabloon daarom het
betere antwoord: die trekt bij elke beurt nieuwe getallen en raakt niet op. Wat
overblijft (spelling, woordenschat, lidwoorden, begrippen) kan dat niet met
getallen, maar wel met een lijst die met de hand is nagelopen: één sjabloon,
zestien woorden, en een Leitner-kaart die over de regel gaat en niet over één
woord.

`gegevens/sjablonen-extra.ts` doet dat voor negenentachtig onderwerpen, verdeeld
over de vier kinderen en gekozen op de gaten die hierboven staan. Het aantal
onderwerpen met een onuitputtelijke voorraad ging daarmee van vijftig naar
honderdeenendertig, van de tweehonderdzesenzeventig die de app dit schooljaar
aanbiedt. Bij Amine ging `Delen` van één herhaalde vraag naar zeventien
verschillende in twintig beurten.

De rekenkundige sjablonen worden bij elke proefdraai nagerekend, en wel uit de
getallen die in de vráág staan, dus uit wat het kind leest, niet uit dezelfde
variabele die de som ook al maakte. De taalsjablonen krijgen de controles die er
wél zijn: een antwoord dat tussen de opties staat, een afleider die echt
verschilt, geen dubbele regels. De betekenis zelf is met de hand nagelopen; dat
kan een proef niet overnemen.

Wat hiermee niet is opgelost: de zaakvakken. Aardrijkskunde, geschiedenis en
biologie hebben bij Wassima en Amaani nog tientallen onderwerpen met twee of
drie vragen, en daar helpt geen sjabloon, dat is schrijfwerk, per onderwerp,
met een bron ernaast.

_Bronnen: SLO referentieniveaus rekenen 1F/1S; SLO tussendoelen/leerlijnen rekenen PO; doorstroomtoets/IEP-onderdelen; examenprogramma & syllabus wiskunde A vwo (examenblad.nl); SLO handreikingen natuurkunde en scheikunde havo/vwo._
