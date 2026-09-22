# Kalibratie: verantwoording van de algoritmen

*Versie 1, 21 augustus 2026. Bij elke rekenregel in de app staat hier waar hij vandaan komt, hoe hard de onderbouwing is, en waar hij breekt. Waar een bron niet te openen was of niet bestaat, staat dat er expliciet bij. Er staan geen verzonnen referenties in dit document.*

---

## 1. Waarom de app meet in plaats van rekent

Elke bestaande app toont een caloriedoel dat uit een formule rolt. Dat getal oogt als een meting, met twee decimalen en zonder voorbehoud, terwijl het een gok is met een spreiding van vele honderden kilocalorieën. Wie er zijn dag op inricht en niets ziet gebeuren, concludeert dat er iets mis is met hém in plaats van met het getal.

Het gebruikelijke argument tegen formules is dat ze onnauwkeurig zijn. Het sterkere argument is dit: door te *meten* absorbeert het model de twee grootste onbekenden (adaptieve thermogenese en de individuele activiteitsfactor) automatisch, zonder ze te modelleren of zelfs maar te kennen. Mifflin-St Jeor "weet" niet dat iemand vijftien kilo is afgevallen en daardoor 250 kcal per dag onder de voorspelling zit. Een gemeten verbruik weet dat wel, want het meet precies dat.

De kern is één vergelijking, toegepast op een venster van 28 dagen:

```
TDEE = gemiddelde gelogde inname − (helling van de gewichtstrend × 7700 kcal/kg)
```

De rest van dit document gaat over wat elk van die drie termen waard is.

---

## 2. De 7.700 kcal per kilo

**Wat de app doet.** 7.700 kcal/kg (32,2 MJ/kg) wordt gebruikt als conversiefactor op de gemeten trend, nooit als voorspeller.

Dat onderscheid is het hele punt. Als voorspellende regel ("eet 500 kcal minder en je verliest blijvend een pond per week") is de regel aantoonbaar fout: een statisch model negeert dat de ruststofwisseling daalt en de energiekost van bewegen met de massa meekrimpt, waardoor het gewichtsverlies in jaar één ruwweg met honderd procent wordt overschat (Hall KD et al., *Lancet* 2011;378:826–37, doi:10.1016/S0140-6736(11)60812-X; Thomas DM et al., *Int J Obes* 2013;37:1611–3, doi:10.1038/ijo.2013.51).

Als conversiefactor achteráf houdt de regel wél stand, en dat zeggen Hall en Chow zelf: het ernstige probleem is het statisch veronderstellen van de energiebalans, en "when ΔEB is accurately estimated over time, then the above equation provides a reasonable estimate of weight change" (*Int J Obes* 2013;37:1614, doi:10.1038/ijo.2013.112).

**Waarom de factor voor deze gebruiker gunstig uitpakt.** De vereiste energie per verloren kilo hangt af van de verhouding vet tot vetvrij weefsel, en die hangt weer af van de initiële vetmassa. Hall's analyse met de Forbes-relatie laat zien dat bij een initiële vetmassa boven ongeveer 30 kg de vereiste waarde de 7.700 kcal/kg benadert; bij slankere mensen overschat de regel het tekort (Hall KD, *Int J Obes* 2008;32:573–6, doi:10.1038/sj.ijo.0803720). Bij 120 kg en een BMI van 31 zit deze gebruiker ruim in dat gunstige regime.

**Waar het wél misgaat: de watertransiënt.** Glycogeen wordt opgeslagen met ongeveer 2,7 gram water per gram, bij een voorraad van rond de 500 gram. De effectieve energiedichtheid van glycogeen-met-water is daarmee ruwweg 1.100 kcal/kg, een factor zeven lager dan 7.700 (parameters uit de webappendix bij Hall 2011, NIDDK). Een eenmalige verschuiving van een kilo aan de start van een dieet, of na een refeed, of bij een verandering in koolhydraat- of natriuminname, vertaalt zich dus in een forse fout wanneer het venster over die overgang heen ligt.

Een rekensom met Hall's eigen parameters (mijn afleiding, geen gepubliceerd resultaat) maakt de orde van grootte concreet: bij een venster van 28 dagen met een echt tekort van 750 kcal per dag en een eenmalige waterverschuiving van 1,2 kg wordt het tekort met ongeveer 44 procent overschat, ofwel circa 330 kcal per dag te hoge TDEE. Bij acht weken halveert dat; bij twaalf weken is het ongeveer 110 kcal per dag.

**Wat de app daarmee doet.** De eerste zeven tot veertien dagen na een verandering in dieetsamenstelling worden gemarkeerd en tellen niet mee in het venster. Verder ligt het venster op 28 dagen, en dat is een compromis dat in §3 wordt onderbouwd.

---

## 3. De adaptieve schatting zelf

**De validatie die er is.** De onderliggende methode (energiebalans plus herhaalde gewichtsmetingen) is gevalideerd tegen doubly labelled water bij 140 deelnemers aan de CALERIE-studie, over twee jaar. De gemiddelde afwijking bleef binnen 40 kcal per dag; op individueel niveau was de RMSD 215 kcal per dag (Sanghvi A, Redman LM, Martin CK, Ravussin E, Hall KD, *Am J Clin Nutr* 2015;102:353–8, doi:10.3945/ajcn.115.111070). De bredere methodologie is beoordeeld door Ravelli & Schoeller (*Int J Obes* 2021;45:725–32, doi:10.1038/s41366-021-00738-0): accuraat tot binnen ongeveer 2 procent, met een precisie tussen 4 en 37 procent afhankelijk van methode en meetinterval.

**Wat er níet is.** Voor de commerciële implementaties (MacroFactor, RP) bestaat geen peer-reviewed validatie. MacroFactor publiceert een eigen analyse op 748 gebruikers met een mediane fout van circa 135 kcal per dag tegenover circa 335 voor een standaardformule. Bruikbaar als indicatie, niet als bewijs.

**Twee eerlijke beperkingen die in de app horen te staan.** Sanghvi valideerde een *verandering* in inname, niet een absolute TDEE, systematische fouten in de uitgangswaarde blijven staan. En belangrijker: deze app draait de vergelijking om en gebruikt *zelfgerapporteerde* inname als invoer. Alles wat de gebruiker te weinig logt, komt eruit als een te láge TDEE-schatting, en het algoritme kan dat niet onderscheiden van een echt laag metabolisme. De schatting is dus bruikbaar om doelen bij te sturen, niet als fysiologische maat, en zeker niet als bewijs voor of tegen een "traag metabolisme".

**De vensterlengte.** De literatuur geeft geen expliciete aanbeveling; Sanghvi's intervallen liepen over maanden. Wat de ondergrens bepaalt is de ruis. Bij een dag-tot-dagspreiding van rond de 0,8 kg en kleinste-kwadratenregressie over *n* dagelijkse metingen geldt SE(helling) = σ/√(n(n²−1)/12). Dat geeft ongeveer 410 kcal per dag bij veertien metingen, 145 bij achtentwintig, en 80 bij tweeënveertig. Omdat dagelijkse gewichten geautocorreleerd zijn, is dat nog een optimistische ondergrens.

**Daarom:** minimaal veertien dagen voordat er iets getoond wordt, achtentwintig als standaardvenster, en pas na drie tot vier weken wordt een getal als betrouwbaar gepresenteerd. Aanvullend een dekkingseis (minstens zeven wegingen en zeven bruikbare registratiedagen) en altijd een interval in beeld, nooit alleen een puntschatting.

**Het venster is een veelvoud van zeven dagen, en dat is geen detail.** Lichaamsgewicht kent een systematisch weekritme: hoogste waarden op zondag en maandag, dalend richting het weekeinde, met een amplitude van grofweg 0,5 tot 1 procent van het lichaamsgewicht (Orsama AL et al., *Obes Facts* 2014;7:36–47, doi:10.1159/000356147). Bij 120 kg is dat 0,6 tot 1,2 kg puur ritme. Een venster dat geen veelvoud van zeven is, laat dat ritme in de helling lekken, en dat is een fout van honderden kilocalorieën per dag.

---

## 4. Het filteren van de weegreeks

Tien imputatiestrategieën en meerdere berekeningsmethoden zijn vergeleken bij vijftig deelnemers met slimme weegschalen. De winnaars waren structural modeling met Kalman-smoothing en het exponentieel gewogen voortschrijdend gemiddelde, met een fout van 0,62 tot 0,64 procent, praktisch gelijk (Turicchi J et al., *JMIR Mhealth Uhealth* 2020;8:e17977, doi:10.2196/17977). Nevenbevinding: ontbrekende dagen kun je beter overslaan dan imputeren; de schatters blijven redelijk tot tachtig procent ontbrekende data.

**Wat de app doet.** Een EWMA met een halfwaardetijd van ongeveer zeven tot tien dagen (α ≈ 0,1) voor de getoonde trendlijn, en een gewone kleinste-kwadratenregressie over het venster voor de hélling, die laatste omdat je daar direct een standaardfout uit krijgt, en die standaardfout is precies wat het betrouwbaarheidsinterval op de TDEE voedt. Een weging die te ver van de verwachting ligt wordt aangemerkt als mogelijke uitbijter, maar niet verwijderd: bij snelle koolhydraatwisselingen zijn sprongen van een tot twee kilo fysiologisch. Hoe die markering werkt staat in §27.

Een filter met een halfwaardetijd van zeven tot tien dagen loopt inherent anderhalve week achter op de werkelijkheid. Dat is de prijs van ruisonderdrukking, het is onvermijdelijk, en het staat in de app: wie gisteren streng is gaan diëten mag vandaag geen reactie verwachten.

**De weegfrequentie.** Gewichtsverlies vond plaats tijdens periodes van dagelijks wegen; onderbrekingen langer dan een maand gingen samen met gewichtstoename, terwijl intervallen tot ongeveer 5,8 dagen samengingen met stabiliteit (Helander EE et al., *PLOS ONE* 2014;9:e113164, doi:10.1371/journal.pone.0113164).

---

## 5. De formuleschatting als prior

Zolang er geen trend is, toont de app een formuleschatting, expliciet gelabeld als prior.

**Mifflin-St Jeor** is de aanbevolen keuze bij overgewicht en obesitas volgens de Evidence Analysis Library van de Academy of Nutrition and Dietetics, met circa 70 procent van de voorspellingen binnen tien procent van gemeten indirecte calorimetrie bij obesitas, tegenover 39 tot 64 procent voor Harris-Benedict (Frankenfield DC et al., *J Am Diet Assoc* 2003;103:1152–9, doi:10.1016/S0002-8223(03)00982-9).

```
mannen:  10·W + 6,25·H − 5·A + 5
vrouwen: 10·W + 6,25·H − 5·A − 161
```

Bij een strenger criterium van ±5 procent zakt élke formule in: gemiddelde absolute verschillen van 132 ± 138 kcal per dag (Amaro-Gahete FJ et al., *Nutrients* 2018;10:1635, doi:10.3390/nu10111635). De spreiding tussen individuen is groter dan het verschil tussen formules.

**Beperking die ik niet heb kunnen wegnemen:** voor mannen boven de vijftig heb ik geen bevredigende validatiecijfers gevonden, de relevante bronnen waren niet toegankelijk. Leeftijd zit in Mifflin alleen als lineaire term van −5 kcal per jaar, terwijl de werkelijke daling grotendeels via verlies van vetvrije massa loopt. Behandel de prior daarom als een startwaarde met ruime onzekerheid, niet als een getal met twee significante cijfers.

**De activiteitsfactor uit stappen is het zwakste onderdeel van de hele app, en dat staat er ook bij.** Een gevalideerde stappen-naar-PAL-conversie bestaat niet, voor zover ik heb kunnen vinden. Wat er wel is: tienduizend stappen per dag komt ruwweg overeen met 300 tot 400 kcal, afhankelijk van loopsnelheid en lichaamsgrootte (Tudor-Locke C, Bassett DR, *Sports Med* 2004;34:1–8), een koppeling aan energieverbruik, niet aan PAL. En Westerterp waarschuwt onomwonden: "Adding accelerometer output to the equation as an independent variable, often does not explain any additional variation" (*Front Physiol* 2013;4:90, doi:10.3389/fphys.2013.00090).

De app gebruikt stappen daarom uitsluitend voor de startschatting vóórdat de gemeten TDEE beschikbaar is, en verder als kwalitatieve terugkoppeling. Zodra het model draait, is de stapdata voor de rekenkern overbodig, en dat is precies de kracht van de adaptieve aanpak.

---

## 6. Correctie op een aanname uit de oorspronkelijke opzet

De overdrachtsbrief stelde dat activiteitscalorieën uit Garmin en Apple "bij lage intensiteit systematisch 30–60% te hoog" zijn. **De foutmarge klopt; de richting niet.**

Geen enkel polsapparaat haalde een fout onder twintig procent in energieverbruik, met medianen van 27,4 procent (de beste) tot 92,6 procent (de slechtste), terwijl dezelfde apparaten de hartslag tot op 2 procent nauwkeurig meten (Shcherbina A et al., *J Pers Med* 2017;7:3, doi:10.3390/jpm7020003). Een recente levende meta-analyse van de Apple Watch vond een MAPE van 9,7 procent bij hardlopen tot 151,7 procent bij wandelen, en **geen consistente richting van de bias** (Lambe R et al., *npj Digit Med* 2026;9:63, doi:10.1038/s41746-025-02238-1). De grootste meta-analyse over alle apparaten vond voor *totaal* energieverbruik juist een significante **onder**schatting (O'Driscoll R et al., *Br J Sports Med* 2020;54:332–40, doi:10.1136/bjsports-2018-099643).

De juiste formulering, en die staat nu in de app: de fout in energieverbruik is groot (typisch twintig tot vijftig procent, bij wandelen extremer) en apparaat-, persoons- en activiteitsafhankelijk, maar niet systematisch in één richting. Dat is een sterker argument dan het oorspronkelijke: een bias in bekende richting zou je kunnen corrigeren; een grote fout in onbekende richting niet.

Actieve energie wordt daarom bewaard als volume-indicator en verschijnt nergens in de rekenkern. Voor deze gebruiker gaat het om 633 kcal per dag gemiddeld over zes maanden, genoeg om het hele tekort weg te eten als je het zou bijtellen.

---

## 7. Adaptieve thermogenese

Handhaving van een gewicht tien procent of meer onder het uitgangsgewicht ging gepaard met een daling van het totale energieverbruik van 6 ± 3 kcal per kilo vetvrije massa per dag, bovenop wat de veranderde samenstelling voorspelt (Leibel RL, Rosenbaum M, Hirsch J, *N Engl J Med* 1995;332:621–8, doi:10.1056/NEJM199503093321001). Bij circa 65 kg vetvrije massa is dat grofweg 400 kcal per dag. De reviewliteratuur komt uit op 100 tot 300 kcal per dag bij tien tot twintig procent gewichtsverlies, met grote individuele spreiding (Egan AM, Collins AL, *Proc Nutr Soc* 2021;81:199–212, doi:10.1017/S0029665121003669).

De extreme casus is de Biggest Loser-follow-up: metabole adaptatie van −275 ± 207 kcal per dag op week 30 en −499 ± 207 kcal per dag na zes jaar, ondanks 41 kg gewichtstoename (Fothergill E et al., *Obesity* 2016;24:1612–9, doi:10.1002/oby.21538). Die cijfers zijn niet representatief (extreme snelheid, extreme trainingsvolumes, veertien deelnemers) en er loopt wetenschappelijke discussie over de herinterpretatie ervan.

**Waarom dit voor de app juist rustgevend is.** Een app die het verbruik telkens opnieuw méét, hoeft adaptieve thermogenese niet te modelleren: die zit per definitie al in de meting. Wat wel volgt uit Hall's modelparameters (β_AT ≈ 0,14 met een tijdconstante van veertien dagen) is de minimale reactietijd van het systeem: na een verandering in inname duurt het twee tot zes weken voordat het verbruik zich heeft ingesteld. Een venster korter dan dat meet een transiënt, geen evenwicht.

En de klinische boodschap die de app uitspreekt: bij tien procent gewichtsverlies komt de gemeten TDEE 100 tot 300 kcal per dag lager uit dan een formule met het nieuwe gewicht voorspelt. Dat is een normale fysiologische bevinding, geen meetfout en geen falen.

---

## 8. Onderrapportage: de centrale aanname, herzien

De app rekent bewust in *gelogde* calorieën en gaat ervan uit dat een constante bias het advies niet ongeldig maakt. Die aanname houdt stand, maar met een belangrijke herformulering.

**Het bewijs vóór.** Black & Cole analyseerden zeven studies met herhaalde metingen, waarvan vier gevalideerd met doubly labelled water. De ratio inname/verbruik lag consistent onder 1,0 bij sommige personen en consistent boven 1,0 bij anderen; in twee jaarlange studies lag bij een kwart van de proefpersonen de ratio bij élke meting onder 1,35 × BMR. De titelconclusie is ondubbelzinnig: "Biased over- or under-reporting is characteristic of individuals whether over time or by different assessment methods" (*J Am Diet Assoc* 2001;101:70–80, doi:10.1016/S0002-8223(01)00018-9).

**De omvang.** Twintig tot dertig procent is een redelijke centrale schatting bij obesitas; het bereik over methoden loopt van tien tot vijfendertig procent. De vaak geciteerde 47 procent van Lichtman betreft tien geselecteerde dieet-resistente patiënten en is geen populatiegemiddelde (*N Engl J Med* 1992;327:1893–8, doi:10.1056/NEJM199212313272701). In de OPEN-studie onderrapporteerden mannen twaalf tot veertien procent bij 24-uursrecalls en eenendertig tot zesendertig procent bij voedselfrequentievragenlijsten (Subar AF et al., *Am J Epidemiol* 2003;158:1–13, doi:10.1093/aje/kwg092).

**De herformulering.** De bias is **proportioneel, niet additief**, modelleer `werkelijk ≈ gelogd / (1 − b)`, niet `gelogd + X`. En hij neemt mogelijk toe tijdens overgangen tussen niveaus van energieverbruik (Ambler C et al., *Int J Obes* 1998;22:354–62, doi:10.1038/sj.ijo.0800595), precies bij de start van een dieet.

De veilige constructie, en die zit nu in de app: **gebruik gelogde calorieën voor verandering ten opzichte van de eigen basislijn, en kalibreer het absolute niveau op de gemeten gewichtscurve.** Het gewicht op de weegschaal is het enige onbevooroordeelde signaal in het systeem. Laat dat de logs corrigeren, niet andersom.

**Een correctie op wat vaak wordt aangenomen:** het beeld dat vooral vet en sauzen worden onderschat, wordt niet consistent bevestigd. Macdiarmid & Blundell vonden juist koolhydraten en met name suiker het sterkst onderschat, met eiwit accuraat of over-gerapporteerd (*Nutr Res Rev* 1998;11:231–53). Alcohol is de duidelijkste uitschieter: bevolkingsenquêtes dekken slechts dertig tot zestig procent van de verkoopcijfers (Esser MB et al., *J Stud Alcohol Drugs* 2022;83:134–44).

---

## 9. Eiwit: twee verschillende referentiegewichten

Dit is de belangrijkste inhoudelijke bevinding voor deze gebruiker, en het punt waar de app het meest afwijkt van de gangbare berekening.

PROT-AGE beveelt voor gezonde ouderen 1,0 tot 1,2 g/kg per dag aan, meer bij activiteit of ziekte (Bauer J et al., *J Am Med Dir Assoc* 2013;14:542–59, doi:10.1016/j.jamda.2013.05.021); ESPEN komt op vrijwel identieke getallen (Deutz NEP et al., *Clin Nutr* 2014;33:929–36, doi:10.1016/j.clnu.2014.04.007). **Beide documenten specificeren niet welk gewicht.** Dat is een bekende lacune.

De Amsterdamse groep heeft die geadresseerd: er bestaat geen enkele trial die de eiwitbehoefte bij obesitas direct heeft bepaald, en op grond van indirect bewijs is tijdens gewichtsverlies ten minste 1,2 g/kg nodig **met het gewicht gemaximeerd op BMI 30** (Weijs PJM, *Curr Opin Clin Nutr Metab Care* 2025;28:27–32, doi:10.1097/MCO.0000000000001087). De onderbouwing waarom actueel gewicht niet deugt: berekeningen op actueel gewicht, gecorrigeerd gewicht en vetvrije massa gaven klinisch relevante verschillen bij 78 tot 100 procent van de mensen met overgewicht of obesitas (Dekker IM et al., *Clin Nutr ESPEN* 2022;48:378–85, doi:10.1016/j.clnesp.2022.01.014).

```
referentiegewicht = min(actueel gewicht, 30 × lengte²)
eiwitdoel = 1,2 tot 1,5 g/kg referentiegewicht
```

Voor 1,96 m en 120 kg: plafond 115,2 kg, dus **138 tot 173 g per dag**. De drie benaderingen (gecorrigeerd gewicht, streefgewicht, en geschatte vetvrije massa) convergeren rond 135 tot 150 g. Dat is het operationele doel.

**Verdeling.** Gelijkmatige verdeling over drie maaltijden gaf een 25 procent hogere 24-uurs spiereiwitsynthese dan een scheve verdeling (Mamerow MM et al., *J Nutr* 2014;144:876–80, doi:10.3945/jn.113.185280, let op: n=8, gemiddelde leeftijd 37, BMI 25,7; dit is niet de doelgroep). De dosis waarbij de synthese plateaut ligt bij ouderen op 0,40 ± 0,19 g/kg per maaltijd tegenover 0,24 ± 0,06 bij jongeren (Moore DR et al., *J Gerontol A* 2015;70:57–62, doi:10.1093/gerona/glu103, retrospectieve heranalyse, brede intervallen).

Praktisch: drie tot vier maaltijden van 35 tot 45 g eiwit, met minstens drie uur ertussen, en het ontbijt bewaken, dat is de maaltijd waar de scheve verdeling vrijwel altijd ontstaat.

**Over de leucinedrempel ben ik terughoudender dan gebruikelijk.** Een systematische review vond wel een verband tussen leucinedosis en spiereiwitsynthese bij ouderen, maar kon **geen drempelwaarde vaststellen** en vond geen enkele plasma-leucinevariabele die de respons voorspelde (Wilkinson K et al., *Physiol Rep* 2023;11:e15775, doi:10.14814/phy2.15775). De app noemt het daarom een werkhypothese, geen afkappunt.

**Nierfunctie.** De aanbeveling geldt niet bij eGFR onder 30 zonder dialyse. Een uitgangs-eGFR hoort in de nulmeting.

---

## 10. Tempo van gewichtsverlies

Garthe randomiseerde 24 topsporters naar 0,7 versus 1,4 procent lichaamsgewicht per week, beide met vier krachttrainingen per week. Beide groepen verloren evenveel gewicht, maar de langzame groep wón vetvrije massa (+2,1 ± 0,4 procent) terwijl de snelle onveranderd bleef (−0,2 ± 0,7 procent), p < 0,01 (*Int J Sport Nutr Exerc Metab* 2011;21:97–104, doi:10.1123/ijsnem.21.2.97).

Dat mag niet één-op-één worden overgezet. Forbes toonde een omgekeerd curvilineair verband tussen initieel vetpercentage en het aandeel vetvrij weefsel in het verlies: bij obesitas is dat aandeel aanzienlijk kleiner (*Ann N Y Acad Sci* 2000;904:359–65, doi:10.1111/j.1749-6632.2000.tb06482.x). Iemand met dertig procent vetmassa heeft dus meer buffer dan Garthe's sporters.

**De app hanteert 0,5 tot 1,0 procent lichaamsgewicht per week met 0,7 procent als richtwaarde, herberekend op het actuele gewicht.** Bij 120 kg is dat 0,84 kg per week; bij 100 kg nog 0,70. Van 120 naar 100 kg duurt daarmee ongeveer zesentwintig weken, een half jaar. Dat getal staat vanaf dag één in beeld, omdat de verwachting van sneller verlies de belangrijkste reden is om af te haken.

Boven 1,0 procent per week waarschuwt de app dat het advies **méér** eten is, niet minder. En het tempo alleen is niet het werkzame bestanddeel: Garthe's langzame groep tráinde vier keer per week.

*Wat ik niet heb kunnen vinden: een studie die het omslagpunt in procent per week direct heeft vastgesteld bij mensen met obesitas. De band van 0,5 tot 1,0 procent is een synthese van Garthe en Forbes, geen rechtstreeks gevalideerd afkappunt.*

---

## 11. Herkenning uit tekst en foto

**Wat de nauwkeurigheid werkelijk is.** Op 52 gestandaardiseerde voedselfoto's haalden GPT-4o en Claude 3.5 Sonnet een MAPE van 36,3 respectievelijk 37,3 procent voor gewicht en 35,8 procent voor energie, met correlaties van 0,65 tot 0,81. Alle modellen vertoonden **systematische onderschatting die toenam met de portiegrootte**, met bias-hellingen van −0,23 tot −0,50 (Fridolfsson J et al., *Curr Dev Nutr* 2025;9:107556, doi:10.1016/j.cdnut.2025.107556). Het model maakt dus dezelfde proportionele fout als de mens, in dezelfde richting: een foto-app corrigeert de bias van zelfrapportage niet, hij reproduceert hem.

**Wat wél helpt, en dat is kwantitatief onderbouwd.** Het toevoegen van fysieke schaalinformatie verlaagde de MAPE van 56,6 naar 39,5 procent; met het werkelijke voedselgewicht erbij zakte hij naar 20,2 procent (Mu Y, Sun J, He J, *ACM BCB* 2025;2025:65, doi:10.1145/3765612.3767255). En koppeling aan een gezaghebbende voedingsmiddelendatabase gaf een MAE-reductie van 63 procent (Yan R et al., *Commun Med* 2025;5:458, doi:10.1038/s43856-025-01159-0).

**Hoe de app dat vertaalt.** In vier stappen: het model benoemt de onderdelen en schat een portiebereik; de server zoekt kandidaten in NEVO; het model kiest de best passende tabelregel; de server rékent met de tabelwaarde, niet met het geheugen van het model. Het model doet alleen wat het kan, herkennen en portioneren.

Daarbovenop drie harde regels in de code:

1. **Een minimale intervalbreedte per bron**: ±35 procent voor een foto, ±25 procent voor een beschreven portie, ±8 procent voor een gewogen portie. Een model dat "200 tot 210 gram" zegt over een gefotografeerd bord beweert een nauwkeurigheid die uit geen enkele validatiestudie volgt.
2. **Asymmetrische intervallen**, met de bovengrens ruimer dan de ondergrens, vanwege de gedocumenteerde onderschatting van grote porties.
3. **Niets valt uit het totaal.** Wordt een onderdeel niet in NEVO gevonden, dan rekent de app met de eigen schatting van het model, zakt de regel naar graad D, en staat de reden erbij. Een stilzwijgend verdwenen maaltijd is gevaarlijker dan een ruwe schatting die zichzelf D noemt, in de eerste test verdween zo een hele tajine, ruim achthonderd kilocalorieën, uit de dagtelling.

**De zwakste schakel bleek het zoeken, niet het schatten.** De tweede stap (de server zoekt kandidaten in NEVO) was aanvankelijk één `LIKE` op de hele zoekterm. Op NEVO-namen werkt dat niet, want die staan in telegramstijl met het onderscheidende woord achteraan: *Kaas Goudse 48+ gem*, *Melk halfvolle*, *Ei kippen- gekookt gem*. Gemeten gedrag van die eerste opzet: "bruin brood", "magere kwark" en "gekookte couscous" gaven nul treffers, "goudse kaas" gaf alleen de plantaardige imitaties, en "ei" gaf Madeira, Meringue, Marsepein, Aardbeien en Prei, allemaal namen waarin de letterreeks e-i voorkomt. Het gevolg was niet zichtbaar als fout: het model kreeg onbruikbare kandidaten voorgelegd, koos daaruit terecht niets, en een gekookt ei kreeg een eigen schatting terwijl NEVO het gewoon kent (code 84, 128 kcal per 100 g).

Het zoeken is daarom verplaatst naar de database, naar één functie die ook het zoekveld van de app bedient, anders kan de gebruiker een product opzoeken dat de herkenning even later niet vindt. Die functie knipt de vraag in woorden en eist dat elk woord terugkomt, waarbij de strengheid meeschaalt met de woordlengte: twee letters tellen alleen als heel woord, drie tot vier aan het begin van een woord, vijf of meer overal. Een sluitende -e gaat eraf, zodat "gekookte couscous" ook *Couscous gekookt* vindt. Bereidingswoorden zijn bewust géén stopwoorden, want in NEVO is juist dat het onderscheid dat er het meest toe doet: gekookte couscous heeft ongeveer een derde van de energiedichtheid van droge. En bij een gedeeltelijke treffer wegen woorden naar hun zeldzaamheid in de tabel (inverse document frequency, de standaardmaat uit het zoekvak) omdat "melk" in 135 namen voorkomt en "cappuccino" in drie.

Eén ding kan een rangschikking principieel niet: weten welk woord in "cappuccino met halfvolle melk" het hoofdwoord is. Twee rake woorden wegen daar altijd zwaarder dan één, en dus won *Melk halfvolle* van *Koffie cappuccino vers bereid*. Twee kopjes werden zo 330 kcal in plaats van ongeveer honderd, en 21 gram eiwit in plaats van vijf. De oplossing is niet een slimmere rangschikking maar een scheiding van taken: de zoekstap haalt ruim op (de volledige zoekterm én het hoofdwoord apart, samengevoegd tot één lijst) en het model kiest daaruit. Ophalen is een kwestie van niets missen, kiezen is een kwestie van begrijpen; die twee horen niet in dezelfde functie. Daarnaast is het model geïnstrueerd dat de zoekterm het product is en niet de omschrijving ervan: een cappuccino zoek je op als "cappuccino", niet als "cappuccino halfvolle melk".

Dat dit gevonden is, komt niet door de code te lezen maar door hem te draaien. Alle vier de fouten in dit hoofdstuk (de verdwenen tajine, de verdubbelde olie, de halve cappuccino en de melk die de koffie verdrong) zijn zichtbaar geworden door de herkenning op gewone Nederlandse ontbijtzinnen los te laten en de uitkomst met de tabel na te rekenen.

**Waar de app het slechtst is, en dat is ongemakkelijk.** Onder gecontroleerde condities haalden zowel diëtisten als de beste modellen praktische nauwkeurigheid voor energie en koolhydraten, maar was de nauwkeurigheid voor **eiwit en vet significant lager**, met een systematische overschatting van vet bij alle AI-modellen (Isobe T et al., *Nutrients* 2026;18:966, doi:10.3390/nu18060966). Een foto-app is dus het onbetrouwbaarst voor precies de voedingsstof waarop hier gestuurd wordt.

En: voor samengestelde Marokkaanse gerechten bestaat **geen validatiedata**. De fout is daar vrijwel zeker groter, omdat juist samengestelde gerechten met onzichtbare vetten het slechtst worden geschat. Vandaar dat het bereidingsvet een apart veld is dat het model verplicht moet invullen en dat altijd als onzekerheid wordt gemeld.

**De praktische conclusie die de app uitspreekt:** een keukenweegschaal voor de drie meest gegeten basisproducten (olijfolie, couscous, brood) levert meer nauwkeurigheidswinst op dan welke modelverbetering dan ook.

---

## 12. De gerechtenbibliotheek en de huishoudmaten

Naast NEVO staat er in dezelfde database een tweede soort kennis, die niet over losse producten gaat maar over gerechten: zesentwintig samengestelde gerechten uit de Marokkaanse en Turkse keuken, met tweehonderdvijfenzeventig ingrediëntregels, waarvan er zesentachtig door een diëtist zijn bevestigd. Vijfentwintig ervan zijn hier zichtbaar; de zesentwintigste is de persoonlijke variant van een patiënt in provita-care en die hoort in deze app niet thuis. Zesendertig van die regels zijn bereidingsvet, elk met een vetsoort en een opnamefractie. Daarnaast zesenvijftig porties met bandbreedte, en vijfendertig huishoudmaten verdeeld over de zevenentwintig NEVO-groepen.

Die kennis lag er en werd niet gebruikt. De app kon een tajine wel vínden (het zoekveld toonde hem) maar er zat geen knop op, dus loggen ging alsnog via de herkenning uit tekst, die hetzelfde gerecht opnieuw moest ontleden en het bereidingsvet blind moest schatten.

**Hoe een portie wordt doorgerekend.** Per ingrediënt: grammen maal de NEVO-waarde per honderd gram. Bereidingsvet telt mee naar zijn opnamefractie, bij een tajine is dat alles, bij frituren een deel. Dat levert een energiedichtheid voor het gerecht op, en die gaat maal de portiegrootte.

Niet andersom, en dat is een keuze die uitleg verdient. De voor de hand liggende weg is een portie te behandelen als een deel van het recept: zes porties, dus een zesde per persoon. Die weg klopt niet. Harira staat op zes porties en weegt bijna vier kilo, maar een kom harira is driehonderd gram en geen zeshonderdvierentwintig; een kom is nu eenmaal geen zesde van de pan, want er wordt brood bij gegeten. Bij msemen valt het wél samen: acht stuks van honderdvijfentwintig gram op duizend gram deeg. De dichtheid is het enige dat over beide gevallen klopt.

**Wat deze rekenwijze niet weet.** De dichtheid staat op het gewicht zoals de ingrediënten de pan in gaan. Wat indampt verdwijnt uit het gerecht maar niet uit die noemer, dus voor een gerecht dat lang stooft valt de uitkomst aan de lage kant. Hoeveel precies is niet bekend en wordt daarom niet verzonnen; het staat als onzekerheid bij elke regel die uit de bibliotheek komt. De orde van grootte is af te lezen aan de gerechten waar het recept zelf een deel van de schaal benoemt: bij de kiptajine ligt de portieschatting elf procent boven het ruwe gewicht gedeeld door vier, bij de couscous zesentwintig procent eronder, bij msemen precies gelijk. De afwijkingen gaan dus beide kanten op en blijven binnen de bandbreedte van de portie zelf, die ongeveer ±25 procent is.

**Optionele ingrediënten zijn een vraag, geen onzekerheid.** In vier van de vijfentwintig gerechten staat een ingrediënt als optioneel: het lamsvlees in de harira, de sucuk in kuru fasulye, de ui in menemen, de harissa in de kefta-tajine. De eerste opzet liet die meelopen in de bovengrens. Dat leverde voor een kom harira 124 tot 227 kilocalorieën op, een band van tachtig procent die niets over de portie zegt en alles over een vraag die de gebruiker gewoon kan beantwoorden. Het staat nu als aanvinkhokje in het venster: zonder lamsvlees 155 kcal, met lamsvlees 179, en de band blijft in beide gevallen over de portie gaan.

**De graad.** Een gerecht uit de bibliotheek krijgt C wanneer het gevalideerd is en al zijn ingrediënten een tabelwaarde hebben, en anders D. Dat is één trede beter dan wat de herkenning uit tekst of foto van hetzelfde gerecht maakt, en het verschil zit niet in de portie (die blijft een schatting) maar in het bereidingsvet en de samenstelling. Die zijn hier per gerecht uitgezocht in plaats van per keer geschat.

**De huishoudmaten vervangen een onbeantwoordbare vraag.** Wie in het zoekveld een product aantikte, kreeg tot nu toe `prompt('Hoeveel gram?')`. Dat is een vraag die een mens niet kan beantwoorden: een snee brood is vijfentwintig tot vijfenveertig gram en niemand weet dat uit het hoofd. Erger is dat het antwoord geen marge had en daarmee deed alsof het gewogen was. De vijfendertig maten hangen aan de NEVO-groep en dekken alle zevenentwintig groepen, dus er is geen product zonder maat. "Drie sneetjes" wordt honderdvijf gram met een band van vijfenzeventig tot honderdvijfendertig, en die band gaat mee de regel in. Afwegen kan nog steeds en is de enige optie waarbij de portie geen schatting meer is; dan resteert alleen de tabelonzekerheid van NEVO zelf.

**Waar deze kennis vandaan komt en van wie zij blijft.** De bibliotheek is opgebouwd in provita-care en wordt daar onderhouden, op een validatietool waar de diëtist mee werkt. Deze app leest eruit en schrijft er niet in. Dat is geen tijdelijke oplossing maar de bedoeling: één plek waar de gerechten worden nagelopen is beter dan twee die uit elkaar lopen, en het scheelt de diëtist dubbel werk.

---

## 13. De klinische modules

### SCORE2

De app implementeert het gepubliceerde algoritme, niet de tabel. Invoer: geslacht, leeftijd, roken, systolische bloeddruk, en totaal- én HDL-cholesterol apart. Nederland valt in de **laag-risicoregio**.

```
cage = (leeftijd − 60)/5 · csbp = (SBD − 120)/20 · ctc = totaalchol − 6 · chdl = (HDL − 1,3)/0,5

mannen <70 j:
x = 0,3742·cage + 0,6012·rook + 0,2777·csbp + 0,1458·ctc − 0,2698·chdl
  − 0,0755·cage·rook − 0,0255·cage·csbp − 0,0281·cage·ctc + 0,0426·cage·chdl
u = 1 − 0,9605^exp(x)
risico% = (1 − exp(−exp(−0,5699 + 0,7476·ln(−ln(1−u))))) × 100
```

Deze implementatie is gecontroleerd tegen de vier gepubliceerde rekenvoorbeelden uit *Eur Heart J* 2021;42:2439–54 (doi:10.1093/eurheartj/ehab309) en reproduceert ze exact.

Afkapwaarden voor 50 tot 69 jaar volgens NHG-CVRM: laag onder 5 procent, matig 5 tot 10, hoog vanaf 10 procent.

Drie waarschuwingen die in de app staan. De NHG-tabellen werken met non-HDL-cholesterol terwijl het model TC en HDL apart gebruikt, bij gelijk non-HDL kunnen die uiteenlopen. SCORE2 onderschat in Nederland: een observed/predicted-ratio van 1,3 bij mannen, oplopend tot 1,5 à 1,6 bij lage sociaaleconomische status en 1,9 bij Surinaamse afkomst (Kist JM et al., *EClinicalMedicine* 2023;57:101862, doi:10.1016/j.eclinm.2023.101862), etniciteit en SES zitten niet in het model. En de C-index is 0,65 tot 0,72: dit is een gespreksinstrument, geen individuele voorspelling.

**SCORE2-OP is bewust niet geïmplementeerd.** De coëfficiëntenset die ik vond reproduceert het gepubliceerde voorbeeld niet. Voor deze gebruiker niet relevant; voor de app een openstaand punt.

### MASLD en FIB-4

```
FIB-4 = (leeftijd × ASAT) / (trombocyten[10⁹/L] × √ALAT)
```

Afkapwaarden volgens de **Richtlijn MASLD/MASH (NVMDL, 4 april 2024)**, waaraan het NHG deelnam: onder 65 jaar sluit FIB-4 < 1,3 fibrose praktisch uit; boven 65 jaar geldt < 2,0. Tussen die grens en 2,67 volgt een tweede test (VCTE of ELF); boven 2,67 verwijzing naar de MDL. De leeftijdscorrectie is onderbouwd: bij 65-plussers zakt de specificiteit van de afkap 1,3 naar 35 procent, en herstelt bij afkap 2,0 naar 70 procent bij een sensitiviteit van 77 procent (McPherson S et al., *Am J Gastroenterol* 2017;112:740–51, doi:10.1038/ajg.2016.453).

MASLD zelf vraagt steatose plus minstens één cardiometabool criterium (Rinella ME et al., *Hepatology* 2023;78:1966–86, doi:10.1097/HEP.0000000000000520). Bij BMI 31 is het adipositascriterium al vervuld. De app stelt geen diagnose (steatose moet met beeldvorming zijn aangetoond) en positioneert FIB-4 uitdrukkelijk als triagesignaal.

### STOP-BANG

De acht items met de officiële afkapwaarden: luid snurken, vermoeidheid overdag, waargenomen apneu, hypertensie, BMI **boven 35** (niet 30), leeftijd boven 50, nekomtrek ≥ 43 cm bij mannen en ≥ 41 cm bij vrouwen, en mannelijk geslacht. Laag risico 0–2, matig 3–4, hoog 5–8, met de verfijningsregels voor de matige groep (Chung F et al., *Anesthesiology* 2008;108:812–21, doi:10.1097/ALN.0b013e31816d83e4; Chung F, Abdullah HR, Liao P, *Chest* 2016;149:631–8, doi:10.1378/chest.15-0903).

Bij score ≥ 3 is de sensitiviteit voor matig-ernstig OSA 94 procent in slaapklinieken, maar de **specificiteit slechts 34 procent** (Nagappa M et al., *PLOS One* 2015;10:e0143697, doi:10.1371/journal.pone.0143697). Voor deze gebruiker betekent dat: man boven de vijftig levert al twee punten op zonder één klacht. De app zegt dat er expliciet bij, in een populatie van vijftigplusmannen met obesitas is bijna iedereen "matig risico", en dat is informatie over de vragenlijst, niet over de persoon.

**En hier gaat het bewijs de andere kant op dan meestal wordt aangenomen.** CPAP maakt afvallen niet makkelijker; twee meta-analyses vinden een kleine gewichts**toename** (Drager LF et al., *Thorax* 2015;70:258–64, doi:10.1136/thoraxjnl-2014-205361, Hedges' g = 0,17; Chen B et al., *Ann Am Thorac Soc* 2021;18:1717–27, doi:10.1513/AnnalsATS.202101-060OC, ΔBMI +0,148). De omgekeerde richting is wél sterk: tien kilo afvallen verlaagde de AHI met 9,7 events per uur (Foster GD et al., Sleep AHEAD, *Arch Intern Med* 2009;169:1619–26, doi:10.1001/archinternmed.2009.266).

De app formuleert het dus zo: behandel OSA om de OSA, en behandel het gewicht apart. Wat wel meespeelt is slaaptekort op zichzelf: bij 5,5 tegenover 8,5 uur slaapgelegenheid daalde het aandeel gewichtsverlies als vet met 55 procent en steeg het verlies van vetvrije massa met 60 procent, bij identieke caloriebeperking (Nedeltcheva AV et al., *Ann Intern Med* 2010;153:435–41, doi:10.7326/0003-4819-153-7-201010050-00006; n=10).

### De onderhoudsfase

Dit is waar de meeste trajecten stranden, en het ontbrak in de oorspronkelijke opzet. De app implementeert het stoplichtprotocol uit STOP Regain letterlijk:

| Zone | Afwijking t.o.v. basisgewicht | Actie |
|---|---|---|
| Groen | binnen 1,4 kg | doorgaan |
| Geel | 1,4 tot 2,2 kg toename | oorzaak zoeken, eten en bewegen bijstellen |
| Rood | 2,3 kg of meer | actieve afvalfase herstarten |

In de trial kwam 72,4 procent van de controlegroep 2,3 kg of meer aan, tegen 45,7 procent in de face-to-face-arm; dagelijks wegen nam toe in beide interventiearmen en hing samen met een lager risico op terugval, p < 0,001 (Wing RR et al., *N Engl J Med* 2006;355:1563–71, doi:10.1056/NEJMoa061883).

Twee eerlijke kanttekeningen. De randomisatie betrof het *programma*, niet het wegen zelf, dagelijks wegen zónder actieregel heeft veel zwakker bewijs. En de internet-arm presteerde nauwelijks beter dan de controlegroep: een app die alleen digitaal is, repliceert de zwakste arm. Onderhoudsinterventies halen gemiddeld geen significant effect (Flore G et al., *Nutrients* 2022;14:1259, doi:10.3390/nu14061259); ongeveer een kwart houdt het resultaat langdurig vast. De app zegt dat plafond hardop.

De zones triggeren op het voortschrijdend gemiddelde en niet op de dagmeting, anders vuurt rood vals op dagelijkse schommelingen van een tot twee kilo.

### Middelomtrek

94 en 102 cm voor mannen, 80 en 88 cm voor vrouwen. Die getallen komen uit Nederlands onderzoek: 2.183 mannen en 2.698 vrouwen uit Amsterdam en Maastricht, met odds ratio's van 2,2 bij 94–102 cm en 4,6 boven 102 cm (Han TS, van Leer EM, Seidell JC, Lean MEJ, *BMJ* 1995;311:1401–5, doi:10.1136/bmj.311.7017.1401).

**Voor Noord-Afrikaanse afkomst bestaat geen aparte afkapwaarde, en dat is een bevinding en geen hiaat.** De IDF zegt letterlijk "use European data until more specific data are available" voor Oostelijke Middellandse Zee- en Arabische populaties; de WHO meldt dat studies in het Midden-Oosten waarden opleverden die vergelijkbaar zijn met de Europese; en de Nederlandse richtlijn Overgewicht en obesitas (PON, 2023) zet "Midden-Oost Mediterraan" in dezelfde rij als Europees. Alleen voor Zuid-, Zuidoost- en Oost-Aziatische afkomst gelden lagere waarden.

De app gebruikt middelomtrek als motivatie- en volgmaat, niet als invoer in een risicoscore: NHG-CVRM stelt expliciet dat noch BMI noch buikomvang de risicoschatting verbetert. En met een meetfout die in de literatuur wordt gerapporteerd tussen 0,7 en 15 cm, is een individuele verandering van twee centimeter ruis.

### Krachttraining

Krachttraining voorkwam 93,5 procent van het door caloriebeperking veroorzaakte verlies aan vetvrije massa, zonder dat het vetverlies eronder leed; het protocol in alle zes de onderliggende RCT's was drie keer per week gedurende twaalf tot vierentwintig weken (Sardeli AV et al., *Nutrients* 2018;10:423, doi:10.3390/nu10040423). Zonder training gaat het mis: 81 procent van de groepen met alleen energierestrictie verloor vijftien procent of meer van het gewichtsverlies als vetvrije massa, tegen 39 procent met beweging erbij (Weinheimer EM et al., *Nutr Rev* 2010;68:375–88, doi:10.1111/j.1753-4887.2010.00298.x).

Voor het volume geldt een gegradeerde dosis-responsrelatie met ongeveer tien sets per spiergroep per week als redelijke ondergrens (Schoenfeld BJ et al., *J Sports Sci* 2017;35:1073–82, doi:10.1080/02640414.2016.1210197), met duidelijk afnemende meeropbrengst daarboven (Pelland JC et al., *Sports Med* 2026;56:481–505, doi:10.1007/s40279-025-02344-w).

**Eiwit is faciliterend, niet vervangend.** In een trial met 1,7 tegenover 0,9 g/kg zonder krachttraining was er géén verschil in verlies van vetvrije massa (Backx EM et al., *Int J Obes* 2016;40:299–304, doi:10.1038/ijo.2015.182); alleen de combinatie hoog eiwit plus krachttraining verhoogde de vetvrije massa (Verreijen AM et al., *Nutr J* 2017;16:10, doi:10.1186/s12937-017-0229-6).

*Er bestaat geen meta-analyse die sets per spiergroep per week direct onderzoekt tijdens energierestrictie bij vijftigplussers. De aanbeveling van drie keer per week met tien sets per spiergroep is een gemotiveerde synthese, geen getoetste dosering.*

---

## 14. Wat niet geverifieerd kon worden

Volledigheidshalve, want een verantwoording die alleen zijn sterke punten noemt is geen verantwoording:

- De originele teksten van Mifflin (1990), Roza & Shizgal (1984) en Cunningham (1991) waren niet toegankelijk. De citaties zijn geverifieerd, de formules komen uit standaardkennis. Controleer ze vóór klinisch gebruik tegen de originelen.
- Validatiecijfers voor rustmetabolismeformules bij mannen boven de vijftig: niet gevonden.
- De constante van 0,5 kcal/kg/km voor de netto energiekost van lopen: niet tegen een primaire bron bevestigd.
- De fout van de 7.700-regel over twee tot vier weken bij 120 kg: niet als zodanig gepubliceerd. De rekensom in §2 gebruikt gepubliceerde parameters maar is een eigen afleiding.
- Een formele replicatie of gepubliceerde kritiek van Holt's verzadigingsindex: niet gevonden. De app gebruikt daarom energiedichtheid als continue proxy in plaats van een SI-tabel.
- Een gevalideerde leucinedrempel bij ouderen: bestaat niet, Wilkinson 2023 vond die expliciet níet.
- Een direct vastgesteld omslagpunt in procent per week bij obesitas: bestaat niet.
- Validatiedata voor foto-gebaseerde schatting van Marokkaanse samengestelde gerechten: bestaat niet.
- De coëfficiënten van SCORE2-OP: gevonden maar niet reproduceerbaar; daarom niet geïmplementeerd.

---

## 15. Wat dit alles betekent voor de eerste weken

De zwakste schakel is niet de wiskunde maar de invoer. Elke foutbron die hierboven gekwantificeerd is (de watertransiënt van enkele honderden kilocalorieën in ongunstige gevallen, de weegruis van circa 145 kcal per dag bij achtentwintig metingen) valt in het niet bij systematische onderrapportage van twintig tot dertig procent.

Daarom zijn dit de vier dingen die de app actief blijft vragen, op volgorde van hoeveel ze opleveren:

1. **Elke ochtend wegen.** Zonder die reeks is het model inert; het is de enige invoer die niet te schatten valt en het enige onbevooroordeelde signaal in het systeem.
2. **De olijfolie in de saladebereiding één keer wegen.** Het verschil tussen veertig en zeventig gram is 265 kcal, elke dag.
3. **Meten wat de machine per cappuccino schenkt.** Bij vier à vijf op een werkdag de grootste onzichtbare post.
4. **Gaten dichten met een ruwe schatting.** Een D-waarde verbreedt het interval minder dan een ontbrekende dag dat doet.

En twee getallen die permanent in beeld horen te staan, niet alleen in de code: het betrouwbaarheidsinterval op de verbruiksschatting, en de mededeling dat het systeem ongeveer twee weken achterloopt. Beide voorkomen dat ruis wordt gelezen als falen.

---

## 16. Eigen maaltijden: één gerecht, zeven producten, één regel

Dit hoofdstuk is later toegevoegd dan de rest, en om een reden die niet in de literatuur staat maar in de praktijk: *"ik vind het moeilijk invoeren van mijn favoriete maaltijden."* Een tonijnsalade is één ding om te eten en zeven dingen om op te zoeken, en wie hem wekelijks logt zoekt hem wekelijks opnieuw op, met wekelijks een net iets ander antwoord.

Dat is geen ongemak maar een meetfout, en wel de duurste soort. De app leidt het verbruik af uit de hélling van gelogde inname tegen gewicht (§3). Ruis in de invoer die niets met de werkelijke inname te maken heeft gaat rechtstreeks de standaardfout van die helling in, en verbreedt dus het interval waarbinnen het model iets durft te zeggen. Dezelfde salade twee keer verschillend invoeren kost meetbaar zekerheid.

De oplossing is de gewone: zoek het één keer uit, bewaar het, log het daarna als één regel. Drie keuzes daarin zijn niet vanzelfsprekend.

**Eén regel en niet zeven.** De onderdelen blijven in het recept staan en de gelogde regel wijst er met `recept_id` naar terug, maar in het dagoverzicht is een salade één salade. Dat is niet alleen netjes: de coach (§ AUTOMATISERING) stelt voor uit wat je eerder at, en met losse onderdelen stelt hij "olijfolie, veertig gram" voor als tussendoortje. Een voorstel dat niemand eet is erger dan geen voorstel.

**De band telt op zijn breedst op.** Laag bij laag, hoog bij hoog, de aanname dat alle fouten dezelfde kant op wijzen. Statistisch is dat te ruim: bij onafhankelijke fouten hoort de wortel uit de kwadratensom, en die is smaller. Hier is te ruim precies goed. De fouten in een recept zijn aantoonbaar níét onafhankelijk (wie ruim opschept doet dat met alles tegelijk) en bovenal geldt in deze app dat onzekerheid nooit in je voordeel pleit. Een smallere band zou een nauwkeurigheid claimen die uit een optelling van zeven schattingen niet te halen valt.

**De graad is de slechtste van de onderdelen, niet het gemiddelde.** Zes gewogen ingrediënten en één geschat scheutje olie maken samen een geschatte maaltijd. Middelen zou dat scheutje wegpoetsen, en juist dat scheutje is bij deze gebruiker de grootste post van de dag (§8, en de vier prioriteiten in §15).

**Delen door porties kost een trede.** Wat je afgewogen in de pan doet is A; wat je daarna over twee borden verdeelt is dat niet meer, want die twee borden zijn niet gelijk. A zakt daarom naar B zodra er verdeeld wordt. Lager dan B zakt hij niet: het verdelen voegt onzekerheid toe, het wist niet wat er al bekend was. De aanname staat bovendien uitgeschreven in de regel zelf ("1 van 2 porties, niet apart gewogen") en niet in de kleine lettertjes, conform de regel die de hele app draagt.

### De band komt uit grammen, niet uit een percentage

De twee maaltijden die bij de oplevering al klaarstonden (`health/database/08-de-twee-favorieten.sql`) zijn zo opgebouwd dat er geen enkele calorie is ingetypt. Er staan grammen, en die worden vermenigvuldigd met wat NEVO per honderd gram zegt. De ondergrens en de bovengrens komen op dezelfde manier tot stand: uit een ondergrens en een bovengrens in gráms.

Dat is het eerlijke model van deze onzekerheid. De tabelwaarde van tomaat is niet onzeker; het aantal tomaten is dat. "Drie middelgrote tomaten" is alles tussen 280 en 440 gram, en dat verschil hoort in de band te staan en niet in een percentage dat iemand gekozen heeft omdat het redelijk voelde.

De olijfolie is waarom dit zo moet. Zijn ondergrens staat op 30 en zijn bovengrens op 70 gram (een verschil van 360 kcal in de kom) en zijn graad op D. Omdat de maaltijd de slechtste graad van zijn onderdelen erft, is de hele salade D zolang die olie niet gewogen is. Dat is geen defect van de weergave maar de boodschap zelf: één keer wegen maakt van deze maaltijd een B en haalt de breedste band van de dag weg. Het is dezelfde aansporing als prioriteit 2 in §15, maar nu op de plek waar hij ertoe doet, op het moment dat je logt, en niet in een lijstje achteraf.

### Wat dit niet is

Geen nieuwe schatting. Er komt hier geen enkel getal bij dat niet al ergens vandaan kwam; alles is wat je ooit hebt ingevoerd, maal een factor. En geen vervanging van de gerechtenbibliotheek (§12): die bevat gevalideerde gerechten met portiematen voor iedereen, dit zijn de jouwe.

### Wat een maaltijd betekent, en de twee knoppen

Bij de oplevering stond er alleen wat erin zat. Wat het bétekent is een andere vraag, en bij deze gebruiker is het de hele vraag: 752 kcal zegt niets zonder te weten waar die kilocalorieën vandaan komen.

Drie maten staan daarom bij elk gerecht, alle drie verhoudingen en dus onafhankelijk van hoeveel je opschept, een halve portie van een schaal met vier gram eiwit per honderd kilocalorieën heeft nog steeds vier gram eiwit per honderd kilocalorieën.

- **Energiedichtheid** (kcal per gram). Onder de 1,0 vult het meer dan het aantelt; boven de 2,0 andersom. De tonijnsalade zit op 0,96 en het halve stokbrood op 2,25, bijna dezelfde energie, minder dan de helft van het volume.
- **Gram eiwit per 100 kcal.** Dit is de maat die telt bij een tekort (§9). De salade komt op 4,0, en dat is de bevinding uit §8 nu zichtbaar op gerechtniveau: qua groente uitstekend, qua eiwit een lege huls.
- **De energieprocenten**, die expres niet optellen tot honderd. Ze worden berekend uit macro's die per onderdeel op één decimaal zijn afgerond, en vezels leveren zelf ook nog ongeveer twee kilocalorieën per gram. Normaliseren zou het beeld netter maken en de afwijking verbergen; die afwijking is informatie over hoe grof de invoer is.

Daaronder staan twee hefbomen, en die worden afgeleid en niet ingetypt: **halveer wat de meeste energie levert** en **verdubbel wat de hoogste eiwitdichtheid heeft**. De eerste geldt alleen bij een onderdeel dat ten minste een kwart van de energie levert, daaronder is halveren een gebaar. De tweede geldt alleen bij een onderdeel boven het eiwitgemiddelde van de maaltijd, en dat is geen vuistregel maar een identiteit: verdubbelen van iets boven het gemiddelde trekt het gemiddelde per definitie omhoog. Ligt niets erboven, dan valt er niets te verdubbelen dat iets oplevert, en zwijgt de app.

Voor de tonijnsalade komen die twee uit op de olijfolie (48 procent van de energie) en de tonijn. De vier uitkomsten naast elkaar:

| | per portie | eiwit per 100 kcal |
|---|---|---|
| zoals je hem maakt | 376 kcal | 4,0 g |
| olijfolie halveren | 286 kcal | 5,3 g |
| tonijn verdubbelen | 431 kcal | 6,4 g |
| allebei | 341 kcal | 8,1 g |

De laatste rij is het hele punt in twee getallen: voor 35 kcal mínder dan nu het dubbele aan eiwit per calorie. Er staat expres geen aanbeveling bij. Een tabel blijft kloppen als je voorkeuren veranderen; een aanbeveling niet.

### Wat de duiding meteen opleverde

Er staat een derde gerecht in, en dat is geen illustratie maar het resultaat van de vorige twee. Een stokbrood met tonijn, tomaat, paprika, één plak jonge kaas, een theelepel olie en zout:

| | kcal | eiwit | per 100 kcal | dichtheid | graad |
|---|---|---|---|---|---|
| Mijn stokbroodtonijn | 629 | 43,6 g | **6,9 g** | 1,21 | C |
| Tonijnsalade (per portie) | 376 | 15,2 g | 4,0 g | 0,96 | D |
| Half stokbrood belegd | 752 | 22,4 g | 3,0 g | 2,25 | D |

Het verschil zit niet in wat erbij is gekomen maar in wat er níét in zit: één theelepel olie in plaats van anderhalve eetlepel, en dat scheelt 135 kcal. De tonijn levert 24,9 van de 43,6 gram eiwit voor 109 kcal.

En dit gerecht is een C waar de andere twee een D zijn. Dezelfde onzekerheid over dezelfde handeling (een lepel olie die niet gewogen wordt) maar hier loopt de schatting van 3 tot 10 gram en dat is 63 kcal, tegen 30 tot 70 gram en 360 kcal bij de salade. Dat is precies wat een graad hoort uit te drukken: niet of je slordig bent geweest, maar hoeveel die slordigheid kost.

Dit gerecht dekt bovendien een tak van de rekenregels die de andere twee niet raken. Bij de salade is de grootste energiepost toevallig ook het vet; hier is het het brood. Een regel die simpelweg "het vet" aanwijst zou op de salade niet stukgaan en hier wel, en daarom staat dit geval als tweede ijkpunt in `maaltijd.proef.ts`.

### Een variant vastleggen, en waarom de graad dan omhoog mag

De onderste rij van de variantentabel (olie halveren én tonijn verdubbelen) staat als eigen gerecht in de app: *Tonijnsalade licht*, 341 kcal per portie met 27,6 gram eiwit, oftewel 8,1 gram per 100 kcal tegen 4,0. Voor mínder energie het dubbele aan eiwit per calorie.

Dat schept een risico dat het benoemen waard is: hetzelfde getal staat nu op twee plekken, in de tabel in het scherm en in de rij in de database, en twee plekken met hetzelfde getal lopen uiteen zodra iemand er één aanraakt. Er staat daarom een proef tussen die eist dat het punt, het eiwit en de eiwitdichtheid exact gelijk zijn aan wat `varianten()` uitrekent.

**Eén ding is met opzet níét gelijk: de band.** `varianten()` halveert de band van de olie mee en houdt daarmee de onzekerheid van een slordige gieting; het vastgelegde gerecht heeft een smallere marge. Dat verschil is de hele reden dat deze variant een gerecht is en geen tabelregel.

Dat raakt aan wat een graad betekent. *Tonijnsalade licht* is een C waar het origineel een D is, en niet omdat er minder olie in gaat, een kleinere hoeveelheid van iets onbekends blijft onbekend. Het is een C omdat de olie wordt **afgemeten**: anderhalve gestreken eetlepel is een huishoudmaat met een tabelwaarde, terwijl "drie ruime lepels" aantoonbaar onbepaald is (de bronanalyse schrijft letterlijk dat het 40 of 70 gram kan zijn). Die voorwaarde staat in de toelichting van het gerecht, waar je hem leest op het moment dat je logt: giet je hem vrij, dan klopt de band niet meer en is het weer een D.

Het gevolg is zichtbaar in de band en niet alleen in de letter: 273 tot 437 kcal per portie tegen 289 tot 580. Het punt zakt met 35 kcal en de band wordt honderdvijftig kcal smaller. Dat tweede is de grotere winst, een smalle band is wat het model nodig heeft om iets te durven zeggen (§3).

Het origineel blijft staan. Dit is geen verbeterde versie die de oude vervangt maar een tweede gerecht ernaast: wat er op tafel staat hangt af van wie er meeeet, en een app die dat invult heeft het mis.

### Vindbaar, en het sterretje

Twee dingen die pas opvielen bij gebruik. Wie "tonijn" typte kreeg de tonijnregels van NEVO en niet zijn eigen salade, de app had het antwoord al en liet het niet zien. `kal_zoeken` doorzoekt nu ook de eigen maaltijden, en dan niet alleen op de titel maar ook op de namen van de onderdelen: "paprika" vindt zo het gerecht waar paprika in zit zonder dat dat woord in de naam staat. Dat is precies waar een samengesteld gerecht zich anders gedraagt dan een product.

Het sterretje bepaalt de volgorde, in de lijst en in het zoekveld. Handmatig, en niet afgeleid uit hoe vaak iets gegeten is: die afleiding straft precies het gerecht af dat je nét bewaard hebt. Bij opnieuw bewaren onder dezelfde naam blijft het staan, anders verlies je het op het moment dat je de olie eindelijk gewogen hebt, en dat is nu juist het moment waarop je het gerecht het meest gebruikt.

---

## 17. De tweede coachlaag en de bewegingsminuten

Twee toevoegingen van september 2026. Allebei raken ze de vraag wat er wél en
niet in de rekenkern mag.

### 17.1 Eiwitrijke voorstellen uit de tabel, `kal_eiwitrijk`

**Wat het doet.** Binnen een energiegrens de producten zoeken met de hoogste
verhouding eiwit per kilocalorie, met hun gebruikelijke portie erbij, één per
productgroep.

**Waarom per kcal en niet per 100 gram.** De coach drukt zijn tekort uit als een
eis: nog 45 gram eiwit in 500 kcal is 0,09 g/kcal. Een voorstel helpt pas als het
die dichtheid haalt. Rangschikken op absoluut eiwit zet de grootste portie
bovenaan, op de proefgegevens een tajine van 720 kcal, goed voor bijna de hele
resterende ruimte in één keer.

**De vier filters, en wat elk ervan aantoonbaar tegenhield.** Gemeten op de
volledige tabel van 2.328 producten:

| filter | wat het tegenhield |
|---|---|
| geen `rauw`, `onbereid`, `poeder`, `extract` | "Kipfilet rauw", staat in de tabel, op geen bord |
| minstens 12 g eiwit per portie | strooikaas, de hóógste dichtheid van de tabel (0,241), maar een plak van 20 g is 11 g eiwit |
| minstens 40 kcal per portie | een plak vleeswaar van 15 g: 3 g eiwit |
| één per productgroep | zonder dit zijn de eerste vijftien allemaal magere vis |

**Wat het niet is.** Geen voedingsadvies. De lijst zegt uitsluitend: dit levert
het meeste eiwit per calorie binnen wat er vandaag nog past. Of het in huis is,
of je het lust en of het bij de rest van je dag past weet de tabel niet. Daarom
staat de lijst ónder je eigen geschiedenis en niet erboven.

**Herkomst blijft zichtbaar.** Tabelproducten dragen ◆, merkproducten ◈. Juist
hier, want dit is de enige lijst in de app waar een eiwitshake van de supermarkt
naast een stuk vis kan staan.

### 17.2 Bewegingsminuten naast stappen

**De norm.** 150 minuten matige inspanning per week, de ondergrens uit de
WHO-richtlijn beweging van 2020. Naast de 8.000 stappen per dag uit Paluch 2022,
en niet in plaats daarvan: één van de twee halen is genoeg.

**Waarom een tweede maat nodig was.** Stappen meten wandelen. Een uur op een
hometrainer levert er nul op. De app beoordeelde daarmee iemand die dagelijks
fietst als inactief, geen strengheid maar blindheid, en het veld `fiets_min`
stond al die tijd al gevuld in de database.

**Waarom één getal niet genoeg was.** De richtlijn noemt twee bedragen en geen
één: 150 tot 300 minuten matige inspanning per week, óf 75 tot 150 zware, óf een
combinatie waarin **een minuut zware voor twee matige telt**. Die wisselkoers
staat in de richtlijn zelf en is hier niet bedacht. Zolang alles in één kolom
`fiets_min` stond, zei de app tegen iemand die drie keer per week een halfuur
hardliep dat hij nog niet op de helft was.

Sinds `health/database/43` staat elke inspanning als eigen rij met een soort en
een intensiteit. De balk op het scherm telt matige minuten; de lijst eronder
toont échte minuten. Die twee verschillen zodra er iets zwaars bij zit, en dat
is met opzet: één getal zou over een van beide liegen.

**De intensiteit is een aanname, en zegt dat zelf.** Welke soort matig heet en
welke zwaar volgt het Compendium of Physical Activities, matig is 3 tot 6 MET,
zwaar 6 of meer. Wandelen op 5 km/u is 3,5; hardlopen op 8 km/u is 8,3. Maar
rennen is niet altijd zwaar en wandelen niet altijd matig: dat hangt af van
tempo, helling en van wie het doet, en wat een horloge daarover weet (hartslag
als percentage van de reserve) komt niet mee in een schermafdruk en niet in de
koppeling.

Daarom staat `geschat` bij de rij, zegt het scherm "aangenomen", en staat de
schakelaar ernaast. Fietsen ligt op de grens van het Compendium (4 tot 6 MET
gewoon, 8 tot 10 stevig) en is als **matig** ingedeeld: dat is de voorzichtige
kant. Wie hard fietst zet hem om; wie dat niet doet krijgt geen weekdoel dat
zichzelf haalt.

**Krachttraining telt hier niet mee.** De richtlijn noemt die apart (twee keer
per week spierversterkend, náást de aerobe minuten) en de app houdt hem in
`kal_training` met zijn eigen drie bolletjes. Zou een krachtsessie van een uur
als zware inspanning meetellen, dan stond de halve aerobe week er al op zonder
dat er één aerobe minuut gemaakt was. Een work-outlijst die "Functionele kracht"
noemt, komt daarom ongevinkt binnen, met die reden erbij.

**Waarom er geen kilocalorieën van gemaakt worden.** Dezelfde reden waarom
actieve energie uit Apple of Garmin nergens bij het doel wordt opgeteld: de fout
is twintig tot vijftig procent en niet consistent in één richting, dus
corrigeren is onmogelijk. Bij dit lichaamsgewicht zou een rit van dertig minuten
ergens tussen 210 en 410 kcal liggen, een factor twee, en precies daarom hoort
het getal niet in de som. Het verbruik komt uit de gewichtstrend, en de fiets zit
daar al in.

**Wat er wél mee gebeurt.** De minuten tellen mee in het weekdoel en staan in het
dagoverzicht. Verder niets.

**Het oude veld blijft bestaan.** `kal_dagen.fiets_min` is de weg waarlangs de
koppeling op de telefoon binnenkomt, en die afspraak breken zou betekenen dat de
opdracht op het toestel opnieuw moet. Het scherm leest hem als één matige
fietsrit van die dag, naast de rijen. De prijs is dat een rit die de koppeling
doorgeeft én die je met de hand toevoegt twee keer telt, zichtbaar, want beide
staan in de lijst van die dag met hun herkomst, en met één tik weg te halen. Een
stille voorkeursregel die er één van de twee laat verdwijnen zou erger zijn: dan
mis je minuten zonder te weten welke.

---

## 18. Wat het marktonderzoek opleverde, en wat eruit volgt

September 2026. Aanleiding: de vraag hoe deze app zich verhoudt tot Yazio en de
rest, en wat "eerlijker naar individualiteit" zou kunnen betekenen.

**Voorbehoud bij alles hieronder.** Het onderzoek is gedaan met zoekopdrachten;
geen enkele bronpagina kon rechtstreeks gelezen worden omdat de uitgaande
verbinding geblokkeerd is. Alles is dus tweedehands. Daar komt bij dat de
"reviews" in deze categorie voor een groot deel automatisch gegenereerde reclame
zijn, gepubliceerd door concurrenten, met overtuigend klinkende getallen die
nergens op slaan. Wat hieronder staat is wat over meerdere onafhankelijke
bronnen consistent terugkwam, of wat uit een vindplaats in de vakliteratuur
komt.

### 18.1 De dichtstbijzijnde concurrent doet het omgekeerde met onzekerheid

**MacroFactor** (Greg Nuckols en Eric Trexler) berekent het verbruik uit dezelfde
natuurkunde: over een voldoende lang venster is inname min gewichtsverandering
gelijk aan verbruik. Ze gladden het gewicht met een voortschrijdend gemiddelde,
convergeren in twee tot vier weken, en verwerpen "je stofwisseling is kapot",
bij een verlies onder de tien procent schatten ze de aanpassing op ongeveer vijf
procent.

Ze tónen ook een band om de verbruikslijn, de *flux range*. En hun eigen
documentatie zegt erover: *"it's tempting to think of flux range as a confidence
interval, and that's not a harmful simplification, but it's not technically
accurate"*, en ze tonen hem *"for fun and curiosity"*. De gebruiker krijgt één
getal als antwoord.

**Nagekeken op 13 september 2026.** In een eerdere versie stond hier een
parafrase tussen aanhalingstekens (*"While it's tempting to think of the flux
range as a confidence interval, it's not technically accurate"*) en *"only for
fun and curiosity"* met een "only" die er niet staat. De weggelaten tussenzin
deed er bovendien toe: die zegt dat het lezen als betrouwbaarheidsinterval een
ónschadelijke vereenvoudiging is, en dat maakt hun positie milder dan mijn
parafrase suggereerde.

Dat is precies het tegenovergestelde van de stelregel van deze app. Het is de
sterkste aanwijzing die er is dat *geen enkel getal zonder zijn onzekerheid* geen
heruitvinding is maar een keuze die de markt bewust niet maakt, vermoedelijk
omdat een puntschatting makkelijker verkoopt en makkelijker naar te handelen is.

### 18.2 Stappen als vertrouwen, niet als calorieën, onafhankelijke bevestiging

MacroFactor voegde in 2025 *Expenditure Modifiers* toe met daarin
*Step-Informed Updates*, en zegt er expliciet bij dat ze **geen calorische waarde
aan stappen toekennen**. Stappen gaan erin als signaal dat het algoritme sneller
mag bijstellen, niet als energie. De reden die ze geven is de onze: iedereen
heeft een redelijke stappenteller, en niemand heeft een betrouwbare omrekening
naar calorieën.

Dat is dezelfde conclusie als in §17.2, langs dezelfde redenering, door een
ander team. Het patroon dat zij eraan toevoegen (een stappentrend het *interval
sneller laten versmallen* in plaats van het doel te verschuiven) is bruikbaar
voor ons venster van 28 dagen, en staat als open mogelijkheid genoteerd.

### 18.3 De grootste ongemodelleerde fout is onderrapportage, niet weegruis

Tegen dubbelgelabeld water onderrapporteren 24-uursnavragen de energie-inname
met tien tot twintig procent en voedselfrequentievragenlijsten met twintig tot
dertig procent. Een analyse in *Nature Food* (2025;6:58–71,
doi:10.1038/s43016-024-01089-5) op basis van 6.497
DLW-metingen, toegepast op NDNS en NHANES, kwam uit op 27,4 procent. De
afwijking hangt systematisch samen met leeftijd, geslacht en BMI.

**Let op bij het citeren.** Het oorspronkelijke artikel meldde meer dan vijftig
procent. Dat was een rekenfout: de voorspelde waarden werden naar kilojoule
omgezet, maar het totale verbruik in kilojoule belandde in de verkeerde
vergelijking, waardoor de onderrapportage werd overschat. De auteurs corrigeerden
het in mei 2025 naar 27,4 procent (Author Correction,
doi:10.1038/s43016-025-01175-2). Hier stond eerst "2024" als jaartal en geen
verwijzing naar de correctie; wie dat naliep kwam dus bij >50 procent uit.

Daaruit volgt iets over wat dit model eigenlijk berekent. Het verbruik wordt
afgeleid uit *gelogde* inname. Is die stelselmatig twintig procent te laag, dan
is het afgeleide verbruik dat ook. Het getal is dus geen schatting van de
stofwisseling maar van **het verbruik zoals het logboek het impliceert**.

Dat maakt het niet minder bruikbaar, omdat de afwijking persoonlijk en
betrekkelijk stabiel is, voorspelt het getal het gewichtsverloop van déze
gebruiker juist goed. Maar het zijn twee verschillende beweringen, en de app
hoort te zeggen welke van de twee hij doet. Dat staat sinds deze ronde onder het
getal op het inzichtscherm.

**Wat er nog niet gebeurt.** Het interval bevat alleen een term voor de ruis in
de weegreeks, niet voor de onzekerheid in het logboek. Strikt genomen is het
interval dus te smal. Dat is bewust nog niet aangepast: een tweede foutterm
erbij optellen verbreedt elke band in de app, en dat is een modelbeslissing met
gevolgen tot in het dagdoel. Hij staat hier genoteerd als openstaand, niet als
opgelost.

### 18.4 Wat de proefliteratuur zegt over de coach

De **SMARTER-trial** (n=502, twaalf maanden, JMIR 2022) vergeleek zelfregistratie
met zelfregistratie plús dagelijkse op maat gemaakte terugkoppeling op de
telefoon. Er kwam **geen verschil** uit: −2,39 tegen −2,12 procent
gewichtsverlies, en vijf procent of meer werd gehaald door 29,1 tegen 26,3
procent.

Dat is een negatieve uitkomst die deze app aangaat. De dagcoach mag dus niet
verantwoord worden als iets wat het gewichtsverlies vergroot, want daar is geen
bewijs voor. Zijn rechtvaardiging is dat hij het loggen goedkoper maakt (
voorstellen uit je eigen geschiedenis, het eiwitgat zichtbaar) en dat is een
argument over volhouden, niet over uitkomst. Zo hoort het benoemd te worden.

### 18.5 Eenvoudig loggen is niet de mindere variant

Pilot-trials met een *stoplichtaanpak* (alleen de "rode" producten loggen) 
vonden een vergelijkbare inname-daling en gewichtsverlies over zes maanden als
volledig calorieën tellen (−403 tegen −364 kcal per dag), en in de eenvoudige arm
gingen deelnemers daarnaast méér bewegen. Volledig opgezette vergelijkingen zijn
nog schaars.

Dat betekent dat het stoplicht in de onderhoudsfase en de ruwe D-waarden geen
concessies zijn maar een verdedigbare vorm, en dat ze zo beschreven mogen worden.

### 18.6 Fotoherkenning: het product herkennen is makkelijk, de portie niet

Een systematische review van beeldgebaseerde voedingsanalyse vond relatieve
fouten van 0,1 tot 38,3 procent op energie. Een studie uit 2025 met GPT-4o op
maaltijdfoto's vond de grootste fouten bij vet in samengestelde gerechten, en
een duidelijke verbetering zodra er context werd meegegeven.

Daaruit volgt iets concreets: **één verhelderende vraag over de portie of de
bereiding verkleint de fout meetbaar.**

Dat is gebouwd, en dan in de vorm die het minste vraagt. Niet een vraag terug aan
het model (dat is een tweede aanroep met een tweede schatting erin) maar een
weegveld onder de regel met de breedste band. De gebruiker heeft de weegschaal al
in huis; wat ontbrak was de plek om het getal kwijt te kunnen.

Drie keuzes liggen daarin vast, en ze zijn alle drie te toetsen in
`src/health/wegen.proef.ts`.

**Eén veld, niet dertien.** Onder elke regel een weegveld maakt van een lijstje
om na te kijken een formulier, en dan wordt er niets gewogen. Het staat onder de
regel die de band van de hele maaltijd bepaalt, en alleen als daar meer dan
vijftig kilocalorieën te winnen zijn.

**De band blijft.** Na het wegen is de portie bekend en de voedingswaarde nog
steeds een tabelwaarde. Er blijft dus ±8 procent staan, dezelfde marge die
`kal-ai` aanhoudt voor een gewogen portie. Een puntschatting zou beweren dat de
tabel exact is. Gemeten op de proefgegevens: 520–980 wordt 497–583, niet 540.

**De graad gaat hoogstens naar C.** A is voorbehouden aan een etiket dat de
gebruiker zelf overnam; een tabelwaarde met een gewogen portie is iets anders.
Omlaag gaat de graad nooit.

Wat er níet gebeurt is de oude onzekerheidsopmerking weggooien. Die is vrije
tekst van het model en niet betrouwbaar te classificeren, een opmerking over het
bereidingsvet is na het wegen van de portie even geldig als ervoor. De nieuwe
opmerking staat daarom vooraan en zegt met zoveel woorden dat hij de schatting
eronder vervangt.

### 18.7 Twee dingen om te weten over de gegevensbronnen

**Open Food Facts** heeft gedocumenteerde kwaliteitsproblemen: dubbelingen,
eenhedenchaos, halfgevulde rijen en onmogelijke waarden, en geeft geen enkele
garantie omdat alles van vrijwilligers komt. Dat rechtvaardigt de keuze uit
bestand 18 om die producten als eigen, lagere herkomst te merken en niet met de
tabelwaarden te mengen.

**LEDA**, de Levensmiddelendatabank waar het Voedingscentrum zijn Mijn Eetmeter
mee vult, is een Nederlandse, samengestelde bron voor merkproducten, niet
crowdsourced. Of hij buiten het Voedingscentrum te gebruiken is, en onder welke
voorwaarden, is niet nagegaan. Als hoger gegradeerde herkomst voor Nederlandse
supermarktproducten is dat het uitzoeken waard.

### 18.8 Wat de markt doet dat deze app bewust niet doet

Volledigheidshalve, want een keuze die je niet opschrijft ziet er later uit als
een omissie.

- **Abonnementen met donkere patronen.** Noom betaalde rond de zestig miljoen
  dollar aan schikkingen over automatische verlenging en opzegproblemen.
- **Schuldopwekkend ontwerp.** Gebruikers van calorie-apps rapporteren meer
  verstoord eetgedrag; wie logt om gewicht of vorm (in plaats van om gezondheid)
  meldt vaker voedselpreoccupatie en alles-of-nietsdenken.
- **Zoe**, het bekendste merk in gepersonaliseerde voeding, haalde in september
  2025 de glucosemeter en de bloedvettest uit het pakket. Die reacties worden nu
  vóórspeld uit vragenlijsten in plaats van gemeten. De bekendste
  personaliseerder ging dus terug naar een populatiemodel met een persoonlijk
  jasje. Dat is een waarschuwing waard: personalisatie die niet op een meting
  rust, is presentatie.

## 19. De bibliotheek uitgebreid: Surinaams, Nederlands, en het verschil met NEVO

### 19.1 Twee dingen die op elkaar lijken en het niet zijn

De vraag "waar zijn de RIVM-bestanden gebleven, want Nederlandse gerechten
staan er niet in" berust op een verwarring die het waard is één keer goed op te
schrijven, want hij komt terug.

| | `nevo_foods` | `cultural_dishes` |
|---|---|---|
| wat | 2328 voedingsmiddelen van het RIVM | gerechten met naam en portie |
| herkomst | NEVO-online 2025/9.0, compleet ingelezen | handwerk |
| bevat | ingrediënten, én 83 samengestelde gerechten en 29 soepen die als geheel zijn doorgemeten | vóór deze uitbreiding: 16 Marokkaanse, 10 Turkse, 1 Nederlands concept |
| geeft | voedingswaarde per 100 gram | een naam die je intikt en een portie in huishoudmaten |

Het RIVM-bestand is compleet en is dat sinds 12 augustus 2026: 2328 van 2328
rijen, nul overgeslagen, vastgelegd in `nevo_versies`. Er ontbrak niets aan de
bron. Wat ontbrak was de bibliotheek, en dat is handwerk, geen import.

Het gevolg was scheef op een manier die niemand bedacht had: er stond
stamppot, hachee, erwtensoep, tosti en kroket in het RIVM-bestand, allemaal
doorgemeten, en de app kwam er niet fatsoenlijk bij omdat niemand ze een naam
en een portie had gegeven. Zoeken op "roti" gaf nul uit de bibliotheek en een
roti-vél uit de tabel, wat klopt en niet is wat er op het bord ligt.

### 19.2 Wat ik verwachtte en wat er bleek

Ik ging ervan uit dat een Surinaamse hoek verzonnen zou moeten worden:
ingrediëntenlijsten die niemand heeft nagewogen. Dat bleek maar voor een deel
te kloppen. NEVO heeft een eigen Surinaamse afdeling, en zes gerechten staan er
als geheel gemeten in, bruine bonen met rijst, pom, moksi alesi, dahl, bojo en
bara. Voor die zes is de energie per gram een méting van precies dát gerecht,
en dus beter onderbouwd dan de Marokkaanse hoek, waar de dichtheid uit een
optelling van losse ingrediënten komt.

Dat is de tweede keer in dit project dat meten vóór bouwen een aanname omkeerde.
De eerste was de drempel van de zoekterugval (hoofdstuk 20 van de
databasebestanden); dit is de tweede.

### 19.3 De scheidslijn die in elk bestand terugkomt

**Onderbouwd:** alle voedingswaarden. In bestand 24 en 25 staat geen enkel
voedingsgetal, `kal_gerecht()` rekent ze uit de tabel. De identiteit van elk
ingrediënt en zijn NEVO-code is per stuk uit `nevo_foods` gehaald, niet uit het
geheugen opgeschreven.

**Niet onderbouwd:** de grammen per ingrediënt bij de twee Surinaamse gerechten
die uit onderdelen zijn opgebouwd (roti met kip, heri heri), en alle
portiegewichten. Dat is oordeel en is uit geen bron hier te controleren.

Daarom draagt elke laag het merkteken dat het schema ervoor heeft:
`validation_status = 'concept'`, `mapping_status = 'ai_voorstel'`,
`measurement_basis = 'estimated'`. De app toont ze als graad D. Dat is geen
tijdelijke slordigheid maar de juiste graad, ze zijn niet nagekeken. Naar
'validated' mag pas als een diëtist de porties heeft nagelopen, en het schema
weigert dat ook zonder beoordelaar en datum.

Waar de portie om opscheppen gaat, staat niet mijn schatting maar die van
`voeding_portiematen` voor de NEVO-groep: "Samengestelde gerechten" kent portie
250 g (175–350), "Soepen" kom 250 g (200–350). Een schatting van een ander
blijft een schatting; wat het niet is, is een schatting die er vandaag bij
verzonnen is.

### 19.4 Hoe het getoetst is

Beide bestanden zijn tegen het échte schema gedraaid, de tabellen met al hun
checks nagebouwd in een lokale Postgres, `nevo_foods` gevuld met de 73 regels
waar ze naar wijzen. Vijf proeven:

1. elke `external_food_id` wijst naar een bestaande NEVO-regel, 0 wezen;
2. elk gerecht heeft precies één ingrediënt en precies één standaardportie;
3. alle drie de merktekens staan goed, bij alle 61 gerechten;
4. veertien ijkpunten kloppen met wat er met de hand uit valt te rekenen;
5. twee keer draaien voegt niets toe, 61 gerechten blijven 61.

Proef 1 vond meteen twee gerechten waarvan de code ontbrak in de gevulde
tabel (terecht, want de proef hoort dat te vinden) en proef 1 vond ook een
voorrangsfout in mijn eigen nakijkvraag: `where a or b and c` leest als
`a or (b and c)`. Een nakijkvraag die stilzwijgend de helft overslaat is
gevaarlijker dan geen nakijkvraag.

### 19.5 Wat er niet in zit, en waarom

**De Syrische hoek.** Was bij het schrijven van dit hoofdstuk nog leeg; zie
hoofdstuk 21, waar de reden waarom hij leeg bleef bij nameten maar half bleek
te kloppen.

**Hutspot met vlees.** NEVO 1485 is de stamppot zonder vlees; een versie mét
bestaat niet in het bestand, anders dan bij boerenkool en andijvie. Dat gat is
zichtbaar gelaten in plaats van gevuld met een eigen optelsom.

**Keuken `overig` is geen restbak.** Bami, nasi, saté en pizza staan wekelijks
op tafel en zijn niet Nederlands. Ze onder `nederlands` schuiven zou dat filter
onbruikbaar maken. De keuken waar ze wél bij horen heeft de bibliotheek nog niet.

## 20. De lichaamsparameters die niet meekwamen

### 20.1 Wat er al was

De weg van horloge naar app staat sinds bestand 04 en is uitgelegd in
`Koppelen.tsx`: Garmin heeft een Health API achter een ontwikkelaarsprogramma
dat geen nieuwe aanmeldingen aanneemt, en Apple Gezondheid heeft helemaal geen
web-API. Wat wél werkt is de Opdrachten-app op de iPhone, die Gezondheid uitleest
en zelf een verzoek mag versturen. Eén weg dekt beide bronnen, want de Garmin
Connect-app schrijft zijn metingen in Gezondheid.

Langs die weg kwamen al automatisch binnen: stappen, slaap, actieve energie,
fietsminuten, gewicht en de rustpols. Saturatie en bloeddruk niet, terwijl ze
allebei al bestonden als meting die je met de hand kon invullen. Dat is precies
het overtikwerk dat een koppeling hoort weg te nemen.

### 20.2 Eén regel op één plek

Het blok dat de rustpols wegschrijft was twintig regels: een grens, een
botsingsregel, een bijwerken-of-invoegen. Dat drie keer overschrijven zou drie
plekken opleveren waar de botsingsregel uit elkaar kan gaan lopen, en juist die
regel hoort overal dezelfde te zijn. Hij staat nu één keer, in
`kal_meting_uit_koppeling`, en de rustpols gebruikt hem ook.

Die regel luidt: wat de koppeling zelf neerzette mag hij bijwerken, want de
rustpols van vanochtend is voorlopig. Wat jíj hebt ingevuld blijft staan, altijd.
Jij stond erbij toen die bloeddruk gemeten werd en het horloge niet.

### 20.3 De ondergrenzen doen meer werk dan ze lijken

| meting | bereik |
|---|---|
| rustpols | 25 – 150 /min |
| saturatie | 70 – 100 % |
| bovendruk | 60 – 260 mmHg |
| onderdruk | 30 – 160 mmHg |

Saturatie is een percentage, dus boven de honderd is het een verkeerd veld en
geen meting; onder de zeventig meet een polssensor geen mens meer.

De ondergrenzen vangen daarnaast de fout af waar bestand 04 voor stappen en
energie een aparte regel voor nodig had: `Bereken statistiek` in de
Opdrachten-app geeft over nul monsters een 0 terug en niet leeg. Voor deze vier
velden is die extra regel overbodig, een 0 valt vanzelf buiten elk bereik, en
wordt gemeld als *onmogelijk, genegeerd* in plaats van stil weggeschreven.

### 20.4 Wat een horloge niet meet

Bloeddruk komt niet van een horloge. Wat hem in Gezondheid zet is een meter met
een manchet. Voor de opdracht maakt dat niets uit (die leest Gezondheid, niet
het horloge) maar het is het verschil tussen een waarde die er elke dag staat
en een waarde die er staat op de dagen dat je hebt gemeten. Dat staat er ook zo
bij, want een lege grafiek die je als een verslechtering leest is erger dan geen
grafiek.

### 20.5 Getoetst

Zeventien gevallen in `kal_proef_lichaamsparameters()`, naast de 41 van
`kal_proef_koppeling()` en niet erin: die gaat over de dagtabel, deze over
`kal_metingen`, en ze samenvoegen zou één functie van vierhonderd regels geven
waarin niet meer te zien is welke regel welk geval dekt.

Getoetst met twee mutanten, want een proef die nooit rood wordt is erger dan
geen proef. Haal de botsingsregel weg en "jouw meting wordt niet overschreven"
valt om; zet de ondergrens van de saturatie op 0 en de twee gevallen over de 0
uit een lege zoekactie vallen om. Beide keren precies die gevallen en geen
andere.

Twee gevallen gaan over de rustpols, die niets nieuws doet maar wel door een
andere functie loopt dan gisteren. Als die verhuizing iets gebroken heeft, hoort
dat hier zichtbaar te worden en niet pas op een telefoon.


## 21. De Syrische hoek, en een patroon in mijn eigen schattingen

### 21.1 De aanname die ik in hoofdstuk 19 opschreef

"NEVO heeft er geen samengestelde gerechten voor, dus daar zou voor álles
gelden wat nu alleen voor roti en heri heri geldt: verzonnen grammenlijsten."

Nagemeten klopt dat half. Samengestelde Syrische gerechten heeft NEVO inderdaad
niet. Maar hij heeft wél een reeks Levantijnse onderdelen die als heel product
zijn doorgemeten, hummus (320 kcal/100 g), baklava (461), falafelmengsel (231),
tahin (585), gekookte bulgur (80), rode linzen (110), lamsgehakt gebakken (252),
Turks witbrood (250). Hummus en baklava zijn daarmee complete gerechten met een
gemeten waarde; de rest is de bouwdoos.

Dat is een betere uitgangspositie dan de Marokkaanse hoek had.

### 21.2 Het patroon

Dit is de derde keer dat meten vóór bouwen een aanname van mij omkeert:

1. de drempel van de zoekterugval, de trigram-zeef haalde onzin binnen waar ik
   dacht dat hij zou werken (databasebestand 21);
2. de Surinaamse hoek: ik dacht dat hij verzonnen moest worden; NEVO had zes
   gerechten als geheel gemeten;
3. de Syrische hoek: idem, met negen bruikbare onderdelen.

Twee van de drie gaan over hetzelfde: **mijn schatting van wat er in de tabel
staat is systematisch te pessimistisch.** Dat is geen toeval en het is goedkoop
te verhelpen, één query voordat ik concludeer dat iets er niet is. Die regel
staat hier omdat hij het soort ding is dat je een volgende keer weer vergeet.

### 21.3 Twaalf gerechten, en twee getallen die alles bepalen

Twee uit één gemeten NEVO-regel (hummus, baklava), tien uit gemeten onderdelen:
rode linzensoep, tabouleh, fattoush, mujadara, moutabal, falafel, broodje
shawarma, maqluba, kibbeh en manakish.

In deze hoek zijn twee soorten getallen doorslaggevend, en allebei zijn het
schattingen die met zoveel woorden in de regel staan.

**Het frituurvet.** `absorbed_fraction` zegt hoeveel van het vet dat de pan in
gaat in het gerecht achterblijft. Bij een tajine is dat 1,0: er wordt in
gestoofd. Bij frituren is het een fractie die in deze tabel niet te meten is. Ik
heb hem gekozen en daarna gecontroleerd waar hij uitkomt, en die volgorde hoort
er eerlijk bij: 0,12 geeft gefrituurde falafel van 303 kcal per 100 g en dat
ligt midden in wat erover bekend is; 0,10 geeft kibbeh van 200. De fractie is
dus geen meting maar een **ijking**.

**Het water.** Water heeft geen energie en wel gewicht, dus het staat in de
noemer van de dichtheid en verder nergens. De rode linzensoep gaf met een liter
water 54 kcal per 100 g, dat is bouillon met linzen erin. Met 700 ml komt hij
op 64. Eén getal, en het verschil tussen een gerecht en iets anders.

Allebei zijn tijdens het schrijven bijgesteld omdat de uitkomst buiten haar
bereik viel. Dat staat in het bestand, want het laat zien waar de hefbomen
zitten voor wie het straks nakijkt.

### 21.4 Twee dingen die NEVO niet goed genoeg heeft

**Shoarmavlees is varkensvlees.** NEVO 2906 en 3027 zijn de enige
shoarma-regels en allebei van varken. Voor een Syrisch gerecht is dat de
verkeerde regel, en niet een beetje. Het broodje is daarom met kip gebouwd,
kipshawarma bestaat, is gangbaar, en staat gemeten in de tabel.

**Ful medames ontbreekt.** Ful is de gedroogde bruine tuinboon, gekookt; NEVO
kent alleen de verse en de ingeblikte groene, en dat scheelt op de hoofdmoot van
het gerecht ruim een derde. Een gerecht waarvan het belangrijkste ingrediënt er
een derde naast zit is slechter dan geen gerecht. Het ontbreekt dus, en dat is
een keuze.

Hetzelfde geldt kleiner voor het platbrood: Syrisch khubz staat niet in NEVO, en
Turks witbrood is de dichtstbijzijnde regel. Dat staat per gerecht in de notitie
en niet één keer hier, want je leest het op het moment dat je het getal ziet.

### 21.5 Waar de bibliotheek nu staat

| keuken | gerechten |
|---|---|
| Nederlands | 44 |
| Marokkaans | 16 |
| Syrisch | 12 |
| Turks | 10 |
| overig | 10 |
| Surinaams | 8 |
| **totaal** | **100** |

Alle zes de keukens die het schema toestaat zijn nu gevuld. Van de 73 nieuwe
draagt elke regel `concept`, `ai_voorstel` en `estimated`, graad D, tot een
diëtist ernaar heeft gekeken.

---

## 22. Verzadiging: een derde as, en waarom hij een schatting blijft

### 22.1 De vraag die eiwit niet beantwoordt

De coach rangschikt op gram eiwit per kilocalorie. Dat beantwoordt "waar haal ik
mijn eiwit vandaan" en niet "waar heb ik genoeg aan". Die twee lopen uiteen, en
het scherpste voorbeeld staat in de tabel zelf: paardenrookvlees heeft 21,1 g
eiwit per 100 kcal (bijna de hoogste dichtheid die er is) en de standaardportie
is een plak van vijftien gram. Dat is op in twee happen.

Wie om zes uur voor de koelkast staat, stelt de tweede vraag.

### 22.2 Wat de literatuur zegt, in volgorde van bewijskracht

Drie kenmerken hangen samen met verzadiging, en ze zijn niet even sterk
onderbouwd.

**Energiedichtheid** is het best onderbouwde gegeven in dit veld. Mensen eten
grofweg een vast gewicht aan voedsel, niet een vast aantal calorieën; bij gelijk
gewicht leidt een lagere energiedichtheid tot een lagere energie-inname
(Ello-Martin JA, Ledikwe JH, Rolls BJ, *Am J Clin Nutr* 2005;82(1 Suppl):236S–241S).

**Eiwit** is de meest verzadigende macronutriënt per kilocalorie. Bij dertig
procent van de energie uit eiwit daalde de spontane inname met ruim vierhonderd
kcal per dag (Weigle DS et al., *Am J Clin Nutr* 2005;82:41–8); zie ook het
overzicht van Halton TL en Hu FB (*J Am Coll Nutr* 2004;23:373–85).

**Vezel** doet iets, maar bescheiden en sterk afhankelijk van het soort; vooral
viskeuze, gelvormende vezels. De meta-analyse van Wanders AJ et al.
(*Obes Rev* 2011;12:724–39) vond een klein en inconsistent effect.

### 22.3 Waarom het geen meting is, en wat er dan wél staat

De klassieke méting is de verzadigingsindex van Holt SH, Miller JC, Petocz P en
Farmakalidis E (*Eur J Clin Nutr* 1995;49:675–90): achtendertig voedingsmiddelen,
isocalorische porties, wit brood op honderd, gekookte aardappel als hoogste op
323 procent. Dat zou de beste bron zijn. Maar hij dekt achtendertig producten en
deze tabel heeft er 2328; elke koppeling daartussen zou voor het overgrote deel
verzinnen zijn.

Wat er dus staat is een **voorspelling uit de samenstelling**:

```
45 × min(1, gram per 100 kcal / 240)
35 × min(1, gram eiwit per 100 kcal / 12,5)
20 × min(1, gram vezel per 100 kcal / 5)
```

De verhouding 45/35/20 volgt de bewijskracht hierboven en is verder mijn keuze,
geen gepubliceerd resultaat. De drie afkappunten zijn dat níet: het zijn de
negentigste percentielen van de tabel zelf, over de 2224 producten met energie en
eiwit (gram p90 = 238, eiwit p90 = 12,5, vezel p90 = 5,09). Het afkappen bestaat
zodat één uitschieter de score niet kan dragen; zonder afkapping wint altijd het
natste product, ongeacht de rest.

**Daarom staat de score niet voorop op het scherm.** Wat vooropstaat is het
aantal gram dat je voor honderd kilocalorieën krijgt, en dat is een deling van
twee gemeten waarden uit de tabel en verder niets. De score bepaalt de volgorde;
het gram-getal is wat je kunt narekenen en wat de keuze maakt.

### 22.4 Twee zeven, allebei uit een meting voortgekomen

Gerangschikt zonder enige zeef kwam er dit bovenaan de echte tabel:

| | score | gram per 100 kcal |
|---|---|---|
| Champignon gekookt | 100 | 476 |
| Peterselie vers | 95 | 270 |
| Yoghurtdrank Fristi | 86 | 417 |
| Saus soja- | 81 | 250 |
| Sap tomatengroenten- | 66 | 476 |
| Bier alcoholarm | 54 | 455 |
| Azijn | 50 | 455 |

Champignons kloppen. De rest niet, en om twee verschillende redenen.

Peterselie, sojasaus en azijn zijn geen voedsel maar smaakmaker: de score rekent
per honderd kilocalorieën en die hoeveelheid haal je nooit. Fristi, groentesap en
alcoholarm bier zijn **dranken**, en dat is geen smaakkwestie: vloeibare
calorieën verzadigen minder dan vaste bij gelijke energie. Een verzadigingslijst
die drinken aanraadt doet het omgekeerde van wat hij belooft.

Dat werden twee zeven (een groepenlijst en een regexp op de naam) en ze zijn
allebei dragend. Op een nagebouwde tabel met de echte waarden: groepszeef eruit
en peterselie, sojasaus en roomboter komen terug; naamzeef eruit en Fristi komt
terug. Die tweede mutant is het bewijs dat de naamzeef niet overbodig is naast de
groepen: *Yoghurt*drank staat bij Melk en melkproducten en glipt door elke
groepszeef heen.

### 22.5 De zeef die ik eerst fout had

Mijn eerste zeef eiste tachtig kilocalorieën per portie, naar het voorbeeld van
`kal_eiwitrijk`. Daarmee viel de hele groep Groente eruit: een opscheplepel
gekookte groente is vijftig gram en tien tot twintig kilocalorieën.

Dat is precies de categorie die in een verzadigingslijst thuishoort, en mijn zeef
gooide hem er als eerste uit. De ondergrens van bestand 23 hoort bij een
eiwitvraag, waar een portie iets aan een tekort moet bijdragen; bij een
verzadigingsvraag is een lage portie-energie juist de bedoeling. De zeef op
smaakmakers moet dus op de groep zitten en niet op de calorieën.

Dit is de derde keer in dit project dat meten vóór bouwen een aanname omkeerde,
na de drempel van de zoekterugval en de Surinaamse hoek. Het patroon uit §21.2
geldt hier in een andere vorm: niet mijn schatting van de tabel was te
pessimistisch, maar mijn gewoonte om een zeef uit een ander bestand over te nemen
zonder te kijken of de vraag dezelfde is.

### 22.6 Wat je al eet wordt gemarkeerd, niet vooraan gezet

Elke regel draagt een vlag: komt dit uit een groep waar je de afgelopen zestig
dagen iets uit gelogd hebt? Dat beantwoordt "iets wat in de smaak valt" zonder de
lijst te vernauwen.

Sorteren op die vlag zou een fout zijn, en wel een bekende. De reden dat bestand
23 überhaupt bestaat is dat de eigen geschiedenis leegloopt: wie drie weken
hetzelfde eet krijgt drie weken hetzelfde voorgesteld. Een lijst uit de tabel die
alsnog op je eigen gewoonten sorteert loopt tegen dezelfde muur. De vlag is er om
te herkennen, niet om te rangschikken.

### 22.7 De kaart begint dicht, en dat is te tellen

Er hangt een vraag aan de database aan deze lijst. De belofte van een uitklapper
is dus dat wie hem nooit opent er ook niet voor betaalt, en die belofte is een
proef: het schermvoorbeeld telt de aanvragen, verwacht er nul zolang de kaart
dicht is en precies één na het openen. De mutant die de lijst buiten de
uitklapper hangt valt om met *"dicht en toch 1 keer gevraagd"*.

## 22b. Suppletie: wat de app wél en niet kan zien

De kaart *Wat ontbreekt er?* op het dagscherm. Vijf regels, en ze rusten op twee
verschillende soorten grond, dat onderscheid is het belangrijkste van dit
hoofdstuk.

### Wat er uit je log volgt, en waarom dat maar beperkt is

De voedingsmiddelentabel bevat **geen vitamines en mineralen**. De app kan dus
nooit zeggen hoeveel ijzer of calcium er binnenkomt; hij kan alleen zien welke
NEVO-groepen in je log voorkomen en welke je hebt uitgezet. Drie regels werken zo:

| Regel | Vuurt bij | Zwaarte |
|---|---|---|
| IJzer | vegetarisch of veganistisch, of geen vlees in je log | overwegen |
| Omega-3 (EPA/DHA) | geen vis in je log of vis uitgezet | overwegen |
| Calcium | geen zuivel in je log of zuivel uitgezet | overwegen |

Alle drie staan op *overwegen* en niet op *nodig*, en alle drie wijzen naar de
huisarts in plaats van naar een potje. Een tekort hoor je te laten prikken en
niet te vermoeden.

**Onder de veertien gelogde dagen zwijgen ze.** Vier dagen zonder vis betekent
dat je vier dagen lang geen vis logde, en dat zegt niets over je voeding. Die
drempel staat in `GENOEG_DAGEN`; de melding erover staat er ook bóven een gevulde
lijst, want wie B12 en ijzer te zien krijgt en niets over vis leest dat als "vis
is in orde".

### Wat uit je profiel volgt, en waarom dat zwaarder weegt

Twee regels hangen aan geen enkele log. Ze komen uit staand Nederlands advies, en
staan daarom op *nodig* respectievelijk met een harde bron erbij.

**Vitamine D: het meest gegeven suppletieadvies van Nederland.** De huid maakt
vitamine D uit zonlicht, en tussen oktober en maart staat de zon hier te laag om
daar genoeg van te leveren; voeding levert maar een klein deel. De Gezondheidsraad
adviseert:

| Wie | Hoeveel |
|---|---|
| iedereen vanaf 70 jaar | 20 microgram per dag |
| vrouwen van 50 tot en met 69 | 10 microgram per dag |
| getinte of donkere huid, of weinig buiten / bedekkende kleding, elke leeftijd | 10 microgram per dag |

*Staat er geen leeftijd in het profiel, dan vuren de eerste twee niet.* Een
leeftijd raden zou hier een uitspraak over iemands botten worden op een getal dat
niemand heeft ingevuld.

**De twee zonvragen worden apart gesteld, en niet afgeleid uit `etniciteit`.**
Dat is een bewuste keuze en geen omissie. Afkomst is geen huidskleur, en een app
die dat gelijkstelt doet een aanname over iemand die hij niet mag doen, en die
hij bovendien nergens opschrijft. `etniciteit` gaat in deze app over de
afkapwaarde van de middelomtrek (zie hoofdstuk 5) en over niets anders. Een leeg
vinkje betekent "niet gevraagd" en niet "nee": zolang er niets staat, zwijgt de
regel over die grond.

**B12 bij metformine.** Langdurig metforminegebruik verlaagt de opname van B12.
Dat is een reden om het te laten meten en geen reden om te gaan slikken, dezelfde
lijn als bij ijzer. De NHG-Standaard Diabetes mellitus type 2 adviseert een
B12-bepaling te overwegen bij langdurig gebruik, zeker bij tintelingen of een
doof gevoel in handen of voeten.

Deze regel staat **naast** de veganistische B12-regel en niet in plaats daarvan.
Dat is geen dubbeling: de ene gaat over wat er binnenkomt, deze over wat ervan
opgenomen wordt. Twee gronden, dus twee regels, met twee id's, anders verdwijnt
er stilletjes één.

`metformine` stond eerst niet in de medicatiegroepen, en dat zegt iets over
waarvoor die lijst gemaakt was: de andere zes zijn gekozen op hypo-risico en op
nier- en vochtbelasting, en metformine doet geen van beide. Voor de suppletievraag
is hij juist de belangrijkste.

### Een lege lijst zegt wat er nagekeken is

Dat was er eerst niet, en de eerste vraag die erover gesteld werd was precies de
twijfel die het opriep: *"Wat ontbreekt is leeg?"* Een lege uitslag met alleen een
voorbehoud eronder is niet te onderscheiden van een lijst die stuk is.

De kaart noemt daarom alle vijf de regels bij naam met wat er per regel gezien
is, en elke regel geeft zijn eigen reden. *Uitgezet in Wat je lust*, *niet in je
log* en *nog te weinig gelogd* lezen alle drie anders, zou dat niet zo zijn, dan
was de lijst een sierrand en geen afleiding.

### Wat er nadrukkelijk niet gebeurt

Geen doseringen boven wat de richtlijn zelf noemt. Geen merknamen. Geen advies
dat zonder arts uitgevoerd hoort te worden. De app wijst en verwijst; hij
schrijft niet voor.

---

## 22c. Spierbehoud: drie hefbomen, en waarom er geen cijfer uit komt

Een weegschaal telt kilo's en zegt niet waar ze vandaan komen. Bij snel
gewichtsverlies is dat verschil groot: in de lichaamssamenstellingssubstudie van
STEP-1 was ongeveer **40 %** van wat er op semaglutide verdween vetvrije massa;
in de SURMOUNT-1-substudie bij tirzepatide ongeveer **25 %**.

Geen app meet lichaamssamenstelling. Wat deze wel kan is de drie dingen naast
elkaar zetten waarvan bekend is dat ze spierverlies tegengaan, en zeggen welke
er staan.

### De drie, in de volgorde waarin je er iets aan kunt doen

**Eiwit per maaltijd.** Niet het dagtotaal, dat staat al op Voeding. Naast de
dagmaat bestaat een tweede, onafhankelijke grens: bij ouderen is ongeveer 2,8 g
leucine per maaltijd nodig om spieraanmaak te prikkelen, zo'n **30 g eiwit**. In
een calorietekort is de aanmaak onderdrukt en de afbraak verhoogd, en dan telt
het halen van die drempel bij élke maaltijd zwaarder dan het dagtotaal.

*Waar de twee uit elkaar lopen.* Het scherm Voeding zet een stippellijn op het
dagdoel gedeeld door drie. Bij een dagdoel van 161 g is dat 54, ruim boven de
drempel, en dan valt er niets te zien. Bij een dagdoel van 75 g is het 25, en
dan ligt de stippellijn eronder: Voeding zegt "op peil" terwijl er van
spieraanmaak weinig terechtkomt. De kaart zegt dat dan, met het antwoord erbij,
dat is geen reden het dagdoel te verhogen maar om het over **twee grotere
maaltijden** te verdelen.

*Wat een maaltijd is.* Alleen ontbijt, lunch en diner, en alleen als er
werkelijk iets gelogd is. Een handje amandelen is geen maaltijd: zou
"tussendoor" meetellen, dan leest drie maaltijden op peil plus een tussendoortje
als "3 van de 4", een oordeel over het tussendoortje vermomd als een oordeel
over spieren. Een diner dat er niet was telt evenmin als gemiste drempel.

**Krachttraining.** Al geteld op dit scherm, tegen hetzelfde doel van drie
sessies per week.

**Opstaan uit een stoel.** Vijf keer opstaan en gaan zitten zonder je armen.
Boven de **15 seconden** geldt als aanwijzing voor verminderde spierkracht
(EWGSOP2). De Europese consensus laat de keuze tussen handknijpkracht en deze
test; knijpkracht is aantoonbaar de betere maat, maar vraagt een dynamometer.
Een maat die niemand thuis kan doen meet niets, daarom deze, met erbij dat hij
de zwakkere is.

Onder de **2 seconden** is het geen meting maar een dubbele tik op de knop, en
dan leest hij als *niet gedaan*. Die ondergrens kwam uit de armatuur: die zet de
klok vast, dus een stopwatch op `Date.now()` stond stil en er ging nul seconden
de database in, wat daarna als "snel" las. De stopwatch gebruikt nu
`performance.now()`, die monotoon doorloopt.

### De screener, en waarom de lage afkapwaarde

**SARC-F**: vijf vragen, geen apparaat. De gangbare afkapwaarde is 4. Die heeft
een hoge specificiteit en een **lage sensitiviteit**: goed in uitsluiten, slecht
in opsporen. Voor een screener in een app is dat de verkeerde kant van de fout,
die hoort te signaleren, niet te diagnosticeren. Deze app gebruikt daarom **≥ 1**
en bewaart beide betekenissen: één genoemde klacht is een regel op het scherm,
vier of meer is "genoeg om het na te laten kijken".

### Waarom er geen score uit komt

Elk van de drie meet iets anders met een eigen onzekerheid. Ze optellen tot één
spiergetal zou een nauwkeurigheid suggereren die geen van de drie heeft. Er komen
drie regels uit die zeggen wat er staat en wat er ontbreekt, en "onbekend" is
daarbij een eigen uitkomst.

Een goede stoeltest van ouder dan drie maanden vervalt naar onbekend; een **tráge**
uitslag doet dat niet. Verouderen in de richting van geruststelling mag, in de
richting van wegkijken niet.

### Wat hier niet bewezen is

De richting is goed onderbouwd: meer eiwit en krachttraining behouden meer
vetvrije massa dan minder. **De grootte niet.** In een overzicht van twintig
studies naar eiwit en vetvrije massa vonden er drie een duidelijk verschil, en
maar één daarvan ging over mensen boven de vijftig.

Een app die zegt "1,6 g/kg behoudt je spieren" belooft daarom meer dan het bewijs
draagt. Die zin staat als losse tekst in `spier.ts`, zodat het scherm hem moet
tonen en niet kan vergeten.

### Waar het opgeslagen wordt

Nergens nieuw. De stoeltest is een rij in `kal_metingen` (`soort: 'stoeltest'`,
eenheid seconden), de vragenlijst een rij in `kal_vragenlijsten` naast STOP-BANG.
Deze hele module vroeg **geen enkele databasewijziging**, beide vormen bestonden
al.

---

## 22d. Verdiepen: het boekje over afvallen, en waarom het een boekje blijft

Acht stukken op het scherm Profiel, onder *Verdiepen: afvallen en medicatie*.
Over de Nederlandse trap, wat GLP-1 doet, wat er gebeurt als je stopt, waarom
eiwit nu zwaarder telt, wat je naast vet verliest, bot, de herdefinitie van
obesitas, en wat volhouden voorspelt.

### Elk stuk heeft vier delen, en de volgorde is een besluit

**Wat we weten**: het getal, met het onderzoek en waar het vandaan komt.
**Wat we niet weten**: in een eigen vak, vóór het nut.
**Waar je dit terugziet**: een verwijzing naar een scherm.
**Bron**: klikbaar in het onderzoeksbestand.

Dat tweede deel staat dus niet als kleine letter onderaan. In deze markt zijn de
claims hard en het bewijs zacht; wie het voorbehoud onderaan zet weet dat niemand
het leest. Een proef eist dat `nietWeten` nooit leeg is, en de armatuur leest het
echte scherm om te zien dat het ook getóónd wordt, die twee zijn niet hetzelfde,
en een venster dat alleen `weten` rendert zou door de eerste heen komen.

### Het blijft een boekje, en dat is een grens en geen stijl

Net als `leren.ts`: onder MDCG 2019-11 is software die uitsluitend informatie
ontsluit, zonder patiëntspecifieke verwerking, geen medisch hulpmiddel. "Bij
semaglutide is ongeveer 40 procent van het verlies vetvrije massa" als vaste
tekst mag. Diezelfde zin met jóuw cijfers erin zou de app een categorie op
schuiven waar hij niet thuishoort. Zie `health/STRATEGIE-CHRONISCHE-ZORG.md`.

Hier is die garantie sterker af te dwingen dan bij `leren.ts`. Die functie krijgt
nog een conditie mee om de volgorde te bepalen; **deze lijst krijgt niets**. Er is
geen invoer, dus er valt niets te verwerken.

Het oorspronkelijke voorstel had per stuk een *"wat jij eraan hebt"* met de eigen
getallen van de lezer erin. Dat is bij het schrijven rechtgezet naar een
verwijzing: hier staat wáár in de app je het terugziet, en het rekenen gebeurt
dáár. Het verschil tussen die twee is precies het verschil tussen een boekje en
een hulpmiddel.

De armatuur opent alle acht stukken en zoekt naar de getallen van de proef­
gebruiker, gewicht, eiwitdoel, kcal-doel, stappen. Komt er één van voor, dan valt
hij om.

### Waarom het stuk over de trap geen BMI-grenzen noemt

Het draagt de volgorde van het Nederlandse traject en de constatering dat de lat
voor de huisarts hoger ligt dan de bijsluiter, maar geen getallen. De criteria
komen uit samenvattingen van de NHG-Standaard en niet uit de standaard zelf:
genoeg om de volgorde uit te leggen, niet genoeg om een getal op te schrijven
waar iemand zijn verwachting op bouwt.

Een proef houdt dat vast. Komen de grenzen er ooit in, dan valt hij om en kijkt
iemand na of de bron inmiddels wél deugt. Zo blijft het een besluit in plaats van
een vergetelheid.

### Wat het boekje niet doet

Geen dosering in milligrammen: een proef zoekt daarop. Geen oordeel of iets
voor jou geschikt is. Het GLP-1-stuk noemt de alarmsignalen en stuurt daarbij
naar een arts; dat is de grens tussen voorlichting en behandeling.

---

## 22e. De trap: je traject, en de trede die op slot staat

Op het scherm Profiel staat een kaart *Je traject*, en die komt er alleen als je
in je profiel een gecombineerde leefstijlinterventie hebt opgegeven. Hij toont
twee treden. De eerste kan de app vullen, de tweede niet, en dat verschil is de
hele kaart.

### Wat de app wél weet: de GLI

Een GLI duurt in Nederland twee jaar: een behandelfase en daarna een
onderhoudsfase. Hoe lang die behandelfase duurt verschilt per programma, en die
duur is openbaar. `GLI_PROGRAMMAS` in `src/health/trap.ts` draagt er acht, met
hun behandelfase waar die vaststaat en `null` waar niet.

Die `null` is geen gat maar een derde antwoord. Van X-Fittt en Keer Diabetes2 Om
staat de lengte van de behandelfase hier niet vast, en dan leest de kaart
"*14 maanden bezig; van dit programma is de lengte van de behandelfase hier niet
vastgelegd*", een duur zonder fase. Dat is iets anders dan niets weten, en
het hoort ook anders te lezen.

### Hele kalendermaanden, en waarom dat uitmaakt

Eerst stond er een deling door 30,44 dagen: de gemiddelde maandlengte. Bijna
goed, en precies verkeerd op de plek waar het telt. Twee kalenderjaren zijn 730
dagen, en 730 gedeeld door 30,44 is 23,98. Wie zijn tweejarige programma op de
dag af had doorlopen kreeg te lezen dat hij nog in de onderhoudsfase zat.

Het telt nu in kalendermaanden: 10 juni plus drie maanden is 10 september,
ongeacht hoeveel dagen daar tussen zitten, en de dag van de maand telt mee, op
de negende is die maand nog niet vol. Dat kost iets: het antwoord is een heel
getal, dus de zes-en-een-halve maand behandelfase van SLIMMER valt op maand
zeven. Een halve maand onnauwkeurigheid in een fase-indeling weegt niet op tegen
een jaargrens die niet klopt.

Twee datums kunnen hier misgaan, en ze krijgen niet dezelfde zin. Een onleesbare
datum leest als "de startdatum is niet te lezen"; een datum in de toekomst als
"die startdatum ligt in de toekomst". Eerst stonden ze op één hoop, en dan stuurt
de app iemand zijn invoer nakijken die zich enkel in het jaartal vergist heeft,
hij vindt dan niets, want er is niets mis met wat hij heeft ingetikt. Het
datumveld draagt daarnaast een `max` op vandaag, zodat het meestal niet zover
komt.

### De medicatietrede, en het slot dat eraf ging

Boven de GLI staat een trede waar medicatie hoort. Die stond op slot: de
criteria kwamen uit samenvattingen van de NHG-Standaard, en `medicatiecriteria()`
gaf daarom uitsluitend `niet bekend` terug, hoeveel er verder ook van iemand
bekend was.

Op 20 september 2026 leverde Abdelkader de standaard zelf aan, **NHG-Standaard
Obesitas, augustus 2026, bladzijde 28–29**. Het slot is eraf, en het heeft zijn
nut bewezen. De standaard bevatte drie dingen die in geen enkele samenvatting
stonden:

| | |
|---|---|
| **de belangrijkste** | Afwijkende BMI-drempels voor mensen met een Aziatische (inclusief Hindostaanse), Midden-Oosterse, Afrikaanse of Afrikaans-Caribische migratieachtergrond: 32,5 mét comorbiditeit en 37,5 zonder, in plaats van 35 en 40. |
| | Geen medicatie boven de 75 jaar, en niet tijdens zwangerschap of borstvoeding. |
| | Stoppen bij minder dan 5% gewichtsverlies na twaalf weken op de maximaal verdraagbare dosis. |

Die eerste rij is niet een detail maar de reden dat het slot er hoorde. Een app
die alleen 35 en 40 had getoond, had iemand met een Marokkaanse of Surinaamse
achtergrond en een BMI van 38 verteld dat hij er nog niet aan toe was, terwijl
de standaard hem er wél onder brengt. Voor de mensen voor wie deze app gebouwd
is, en voor de praktijk van ProVitaCare, is dat niet het uitzonderingsgeval.

### Twee soorten criterium, en de app beoordeelt er maar één

Een criterium is een **feit uit je eigen dossier** of een **klinisch oordeel**.

Feit uit je dossier: hoe lang je GLI loopt, en je leeftijd. Die staan in je
profiel, er valt niets aan te wegen, en die beoordeelt de app, met `gehaald`,
`niet gehaald` of `niet bekend` als er niets is ingevuld.

Klinisch oordeel: of je BMI boven de drempel ligt, en of er
gewichtsgerelateerde comorbiditeit is. Die twee blijven altijd `niet bekend`.
Drie redenen, en geen ervan is voorzichtigheid:

- **Het gewicht in deze app is zelf ingevoerd en ongebonden.** In het dossier van
  de bouwer staan wegingen van 107 én 190 kilo. Een drempeloordeel op zulke
  getallen is geen oordeel.
- **Welke drempelset geldt, hangt af van een vraag die deze app niet stelt.** Het
  profiel kent `etniciteit`, maar dat is een vrij tekstveld dat over de
  afkapwaarde van de middelomtrek gaat. Het zou verleidelijk zijn er de
  drempelset uit af te leiden; dat is dezelfde verleiding die bij de
  vitamine D-regel al is afgeslagen, en om dezelfde reden. Afkomst is geen
  antwoord op een vraag die je niet gesteld hebt.
- **Een leeg vinkje bij comorbiditeit is geen "nee".** Wie niets heeft aangevinkt
  kan slaapapneu hebben dat hij nooit heeft ingevoerd. "Niet aangevinkt" en "niet
  aanwezig" door elkaar halen is hier de gevaarlijkste fout die er is, want hij
  wijst iemand af.

De drempels staan er dus wél (allebei de sets, met de getallen en de
achtergronden die de standaard noemt) maar als inhoud en niet als oordeel.
Precies de grens uit `leren.ts`: welke bladzijde bovenaan komt is bladeren, de
tekst zelf verandert niet.

### De eigenschap die hieruit volgt, en die twee proeven bewaken

Er bestaat geen invoer waarbij alle criteria op `gehaald` staan. De twee
klinische staan er altijd op `niet bekend`, dus **deze app kan nooit een scherm
tonen waarop alles groen is.** Dat is geen tekortkoming maar de kern: het oordeel
is van de huisarts, en de standaard laat die uitdrukkelijk vrij dit aanbod niet
te leveren.

De proef in `trap.proef.ts` loopt honderdvijftig profielen af (alle combinaties
van programma, startdatum en leeftijd, inclusief de gunstigste) en eist dat er
altijd minstens één `niet bekend` tussen zit.

Die bewaakt de functie, niet het scherm. En dáár zit het risico: een component
die de vier regels optelt tot één uitkomst ("drie van de vier", een groen vinkje,
"je komt er waarschijnlijk voor in aanmerking") komt door de eerste proef heen,
terwijl er dan precies staat wat deze app niet mag zeggen. De armatuur leest
daarom het echte scherm, eist dat de twee onbeoordeelde regels zichtbaar blijven
staan juist bij een gebruiker die op allebei de beoordeelbare criteria groen
staat, en valt om zodra er een totaaloordeel opduikt.

De enige zin waarin "in aanmerking" mag voorkomen is die waarin de app zegt dat
hij er niet over gaat. Die wordt er in de proef uitgeknipt vóór het zoeken,
anders zou het voorbehoud zichzelf aangeven.

### Wat er niet in staat

Geen dosering, geen middelkeuze, geen contra-indicaties per middel. Wat er wél
staat is dat tirzepatide door de standaard wordt **afgeraden** en orale
semaglutide **niet aanbevolen**, dat is voorlichting die iemand behoedt voor een
aanbod dat hij elders tegenkomt, en het is geen behandeladvies.

## 22f. Sportvoeding in de lijst, en het merk van de eigenaar

De voedingslijst kende de supermarkt en niet de sportvoeding. Wie een shake
drinkt kon hem nergens terugvinden, en wat je niet kunt invoeren telt nergens
mee, niet in de dag, niet in het eiwit, niet in "wat ontbreekt". Voor iemand
die aan een gewichtstraject bezig is is dat juist de post die er het meest toe
doet: bij een energiebeperking is eiwit de enige macro waar je níet op wilt
bezuinigen (§22c), en poeders zijn de manier waarop die post in de praktijk
gehaald wordt.

Vier merken, gekozen op wat er in Nederland werkelijk verkocht wordt: Upfront,
Body&Fit, XXL Nutrition en Orangefit. 404 producten bekeken, 359 bruikbaar; de
45 die afvielen staan geteld in `health/database/45-eiwitten-en-supplementen.sql`
mét de reden. Het gaat niet alleen om shakes, Upfront voert een heel
assortiment, tot olijfolie en roomboter aan toe, en dat gaat mee. Een lijst die
alleen de eiwitpoeders van een merk kent laat iemand die de rest ook koopt
halverwege staan.

### De getallen zijn etiketopgaven

Zoals alles in `merk_producten`: een opgave van de fabrikant met de wettelijke
speelruimte die daarbij hoort, niet een laboratoriumbepaling. Dat verschil is
zichtbaar (◈ tegenover ◆) en die beslissing staat in §18.7 en in de kop van
bestand 18. Ze verandert hier niet, ook niet nu het om producten gaat waarvan
het eiwitgehalte de reden is dat iemand ze koopt. Juist dán niet: 80 g eiwit per
100 g met twintig procent speelruimte is 64 tot 96, en dat is het verschil
tussen de dagbehoefte halen en hem missen.

### Wat ik zelf het scherpst in de gaten hou

Upfront is het merk dat de eigenaar van deze app zelf verkoopt.

Dat is geen reden om het eruit te laten. Het bestaat, mensen drinken het, en een
voedingslijst die het verzwijgt is minder waard en niet eerlijker. Het is wél
een reden om het op precies dezelfde voet binnen te laten als de andere drie.
Zodra de app een product voortrekt dat de eigenaar verkoopt, wordt élk ander
getal erin verdacht: de lezer kan van buitenaf niet meer zien waar het advies
ophoudt en de verkoop begint. Dat is hetzelfde vertrouwen waar §22e op teert (
de app die níet zegt of je in aanmerking komt) en het is met dezelfde munt te
verspelen.

De belofte is daarom niet aan mijn woord overgelaten.
`src/health/belangenverstrengeling.proef.ts` toetst dat geen van deze vier
merknamen ergens in de code voorkomt: niet in `src/`, niet in de overige
SQL-bestanden. Ze komen binnen als rij en verlaten de database als rij, op
dezelfde voet als een pak melk van de Lidl. Een voorkeursregel (een
sorteersleutel, een uitzondering in de zeef, een badge op een scherm) is niet
te schrijven zonder de naam te noemen, en dus niet te schrijven zonder dat deze
proef omvalt.

Drie dingen maken die proef meer dan een formaliteit. Hij noemt alle vier de
merken en niet alleen het eigen merk, want een regel die alleen voor Upfront
geldt omzeil je door een tweede merk te beginnen. Hij zondert alleen bestand 45
uit, want dáár is de naam inhoud in plaats van code. En hij toetst er als derde
bij dát de merken in bestand 45 stáán: zonder die regel zou hij ook groen zijn
als het invoerbestand verdwenen was, en een proef die groen is omdat er niets te
toetsen valt is geen proef. Alle drie zijn mutatiegetoetst (een voorkeursregel
in de volgorde van bestand 21, een `HUISMERK`-constante in een scherm, en een
verdwenen bestand 45) en elk mutant werd gedood door precies de regel die
ervoor bedoeld is.

### Twee keer draaien verandert niets, nu werkelijk

De import werkt bij op streepjescode (`on conflict do update`), zodat opnieuw
draaien niet verdubbelt. Daar zat een gat in: de `set` zet ook
`geimporteerd_op = now()`, dus een tweede run raakte élke rij, ook als er bij de
bron niets veranderd was. Daarmee was "twee keer draaien voegt niets toe en
haalt niets weg" een bewering in plaats van een eigenschap, gebroken door de
tijdstempel alleen.

`gereedschap/merkgegevens.mjs` zet er nu een `where` onder: bijwerken gebeurt
alleen als de rij werkelijk verschilt van wat binnenkomt. De proef daarop toetst
niet dát er een `where` staat maar dat hij **volledig** is, elke kolom die de
`set` bijwerkt staat ook in de vergelijking, want een kolom die wel bijgewerkt
wordt maar niet meevergeleken zou stilletjes nooit meer bijwerken. `synoniemen`
staat met opzet in geen van beide: die kolom vult een mens, en wat een mens
invulde overschrijft een import niet.

### En de terugdraairegel

Op de 359 streepjescodes van het bestand zelf, niet op het merk.
`where merk = 'Upfront'` zou ook weghalen wat er later door iemand anders bij is
gezet, dezelfde fout die in bestand 24 en 27 rechtgezet moest worden.

## 23. De conditie: signaleren zonder te doseren

Deze app rekent aan energie en verzadiging, en dat is voor de meeste mensen
genoeg. Voor een deel van de gebruikers is het dat niet: wie insuline spuit en
afvalt krijgt hypo's zodra de inname daalt en de dosis niet meedaalt. Dat is
geen zeldzame samenloop maar de gewone gang van zaken in een spreekkamer, en een
app die mensen laat afvallen zonder het te noemen laat een gat vallen dat hij
zelf heeft gegraven.

Wat er sinds dit hoofdstuk staat is een conditieprofiel (hoge bloeddruk,
diabetes type 2, doorgemaakte hart- of vaatziekte, en de medicatie in groepen) 
en drie dingen die de app daarmee doet. De bredere afweging, inclusief de vraag
onder welk regime dit valt, staat in `STRATEGIE-CHRONISCHE-ZORG.md`; hier staan
de regels zelf.

### 23.1 Waarom er geen drempels in de signalen staan

De verleiding was een signaal te laten afgaan bij "tekort groter dan zoveel
kilocalorieën" of "trend steiler dan zoveel kilo per week". Dat zou precisie
suggereren die er niet is. Zulke drempels staan in geen enkele richtlijn die ik
kon vinden; ik zou ze hier zelf verzinnen, en dan staat er een getal op het
scherm dat nergens vandaan komt.

Wat er wél staat is een voorwaarde die geen uitleg nodig heeft: je gebruikt dit
middel én je hebt een afvaldoel. Drie signalen komen daaruit voort. Insuline of
een SU-derivaat bij afvallen, omdat de dosis op de oude inname is afgestemd. Een
SGLT2-remmer bij sterk minder koolhydraten, omdat euglykemische ketoacidose bij
normale glucosewaarden verloopt en dus niet aan de meter te zien is. En
kaliumhoudende zoutvervangers naast een RAS-remmer, omdat het zoutadvies en het
kalium elkaar daar tegenkomen.

Komt er ooit een drempel, dan komt hij uit een richtlijn en met bron in dit
bestand. Niet andersom.

### 23.2 De grens tussen voorlichten en doseren, als proef

Elk signaal zegt wat er speelt en verwijst naar een mens. Geen dosis, geen
getal. Dat is geen stijlkeuze: een insulinedosis is een therapeutische
beslissing, en software die die beslissing voorrekent is iets anders dan deze
app. Er is ook een reden van binnenuit. De stelregel hier is dat geen enkel
getal zonder zijn onzekerheid op het scherm komt, en een insulinedosis kán deze
app niet met een interval leveren, hij weet de gevoeligheid niet, de
koolhydraat-insulineratio niet en de nierfunctie niet.

Een commentaarblok houdt zo'n grens niet vast. `conditie.proef.ts` leest daarom
de tekst van élk signaal en valt om zodra er een cijfer in staat, en eist dat
elke handeling het woord huisarts of praktijkondersteuner bevat.

In `leren.ts` staan wél getallen, en dat is geen tegenspraak. Het verschil is van
wie het getal is. "Eet zes tabletten druivensuiker" staat letterlijk zo op
Thuisarts en geldt voor iedereen gelijk; "verlaag je insuline met vier eenheden"
zou een dosis voor één persoon zijn. Het eerste is een boek, het tweede een
behandeling. De proef bij dat bestand leest elke tekst twee keer (met een lege
conditie en met alles aangevinkt) en eist dat er letterlijk hetzelfde staat.

### 23.3 Groepen en geen middelen

De gebruiker kiest een medicatiegroep en niet een merk. Drie redenen. Alles wat
de app ermee doet hangt van de groep af. Een lijst met losse middelen die
onvolledig of verouderd is wekt vertrouwen dat hij niet verdient. En een groep is
met een voorbeeld erbij ("tablet die suiker uitplast · dapagliflozine,
empagliflozine") aan te wijzen door iemand die moeizaam leest, wat in deze
praktijk geen bijzaak is.

Wat er staat is zelfopgave en geen medicatieoverzicht uit het HIS. Dat staat er
op het scherm ook bij.

### 23.4 Waar de signaalkaarten staan, en waarom niet op Gezondheid

Ze stonden eerst op het klinische scherm, want daar woont de rest van de
klinische inhoud. Dat was de verkeerde plek om een eenvoudige reden: Gezondheid
is een tabblad dat je opent als je er iets wilt invullen, en een waarschuwing
achter een tik die niemand doet is geen waarschuwing.

Ze staan nu op Vandaag, direct onder de knop en boven de maaltijdvakken. Dat is
de enige plek die de volgorde van dat scherm niet breekt. Die volgorde ligt vast
met de regel dat wie komt om te doen niet eerst langs wat er te lezen valt hoeft;
de kaarten bóven de knop zetten zou de knop laten zakken zodra iemand diabetes
aanvinkt. Eronder blijft de knop staan waar hij stond ten opzichte van de hero,
en wie leest, leest dit als eerste.

Ze klappen in, met de uitklapper die de app al kent. Een kaart die er elke dag
hetzelfde bij staat wordt na een week niet meer gelezen. De kop zegt waar het
over gaat, de regel eronder is de handeling en blijft ook dicht staan, en de
uitleg zit erachter, het eerste wat je ziet is dus wat je moet doen en niet een
alinea.

Er zit geen wegklikknop op. Het signaal hangt aan de medicatie en het afvaldoel;
valt een van beide weg, dan valt de kaart vanzelf weg. Iets kunnen wegklikken wat
nog geldt zou een toestand maken die de app moet onthouden, en de enige eerlijke
reden om zo'n kaart te laten verdwijnen is dat hij niet meer waar is.

### 23.5 Leeg is niet hetzelfde als niets aan de hand

Een lege conditie geeft nooit een signaal. Dat lijkt vanzelfsprekend en is het
niet: zou `heeftMed` ooit een standaardwaarde krijgen, dan gaan er signalen af
bij mensen die nooit iets hebben ingevuld. Leeg betekent dat we het niet weten,
en dan zwijgt de app. Dezelfde regel als bij een ontbrekende voedingswaarde, die
hier ook niet als nul doorgaat.

## 24. De bloeddruk als weekgemiddelde

Het klinische scherm liet de nieuwste bloeddrukmeting zien. Voor deze waarde is
dat dezelfde fout als één weging voor het gewicht: de dagelijkse schommeling is
groter dan het verschil dat je probeert te zien. Eén meting van 148 zegt niets;
zeven dagen die rond de 148 uitkomen zeggen alles. De app rekende al zo over het
gewicht en deed het hier niet.

### 24.1 Wat de richtlijn vraagt, en wat hiervan te controleren is

De geprotocolleerde thuismeting bij de NHG-Standaard CVRM is twee metingen vóór
het ontbijt en twee metingen twee uur na het avondeten, een week lang.

Van dat protocol kan deze app de helft nagaan. Een `Meting` draagt hier een datum
en geen tijdstip, dus of iemand 's ochtends én 's avonds gemeten heeft is niet te
zien. De app telt dus metingen en dagen, en zegt er met zoveel woorden bij dat
het ochtend-en-avonddeel buiten zijn bereik ligt. Dat is beter dan een vinkje dat
"protocol gevolgd" zegt op grond van iets wat het niet gemeten heeft.

Hij weet evenmin of het thuismetingen zijn. Wat je invult telt mee, waar je het
ook mat. Ook dat staat er.

### 24.2 Eerst per dag, dan pas over de dagen

Wie op dinsdag vier keer meet en de rest van de week één keer, laat dinsdag vier
keer zo zwaar wegen in een plat gemiddelde. Het protocol vraagt om een week en
niet om een aantal metingen. Daarom eerst het daggemiddelde en dan het gemiddelde
daarvan: elke dag telt één keer mee. De proef zet er een geval naast waarin het
platte gemiddelde 165 geeft en de daggewogen versie 150.

Een dag zonder onderdruk valt weg. Een bovendruk zonder onderdruk is geen
bloeddruk, en half ingevulde dagen voor vol aanzien is hetzelfde soort fout als
een ontbrekende waarde als nul behandelen.

### 24.3 Waarom er geen oordeel bij staat

Er komt geen afkapwaarde in deze functie en geen kleur op het scherm. De
praktische handleiding bij de standaard geeft streefwaarden voor de meting in de
praktijk; een aparte afkapwaarde voor de thuismeting staat daar niet in, en de
135/85 die elders circuleert komt uit een andere richtlijn. Zelf een grens kiezen
zou hier dezelfde stap zijn als een dosis geven: van informeren naar beoordelen.
Dat oordeel hoort bij de praktijkondersteuner.

Wat er wel bij staat is de spreiding. Een gemiddelde van 132 uit dagen die tussen
118 en 146 liggen is een ander getal dan hetzelfde gemiddelde uit dagen die
tussen 130 en 134 liggen, en dat hoort te zien te zijn.

De eerste dag blijft meetellen. Sommige richtlijnen laten hem vervallen omdat hij
systematisch hoger uitvalt; de handleiding waar dit op steunt schrijft dat niet
voor. Zolang dat zo is verzint deze app die regel niet zelf.

### 24.4 Bronnen bij dit hoofdstuk en het vorige

Thuisarts.nl, *Mijn bloedsuiker is te laag bij diabetes type 2*, de hypotekst in
`leren.ts` volgt die bladzijde. NHG-Standaard Cardiovasculair risicomanagement en
de praktische handleiding daarbij, het meetprotocol en het zoutadvies.
NHG-Standaard Diabetes mellitus type 2. NDF Voedingsrichtlijn diabetes (2020,
bewijsupdate 2023), dat er geen apart diabetesdieet bestaat en dat gezonde
voeding met persoonsgerichte aanpassing het uitgangspunt is.

De drempels en formuleringen in de signalen zijn bewust gebleven bij wat deze
bronnen dragen. Waar ze niets zeggen, zegt de app ook niets.

---

## 25. De naloop van 20 september 2026, wat er niet klopte

Op verzoek is elke medische bewering in de app nagelopen tegen de bron waar hij
naar verwijst. Het meeste hield stand. Wat hieronder staat is wat niet hield,
plus twee dingen die de app onderling tegensprak.

### 25.1 Vijfenveertig procent was veertig

De app zei op drie plaatsen dat in de lichaamssamenstellingssubstudie van STEP-1
ongeveer **45 %** van het verloren gewicht vetvrije massa was, waarvan twee
plaatsen in het boekje dat de gebruiker leest. De gepubliceerde uitkomst is
ongeveer **40 %**: in de DXA-deelgroep verloren 95 deelnemers op semaglutide
6,9 kg vetvrij weefsel naast 10,4 kg vetmassa, wat op 39,9 % uitkomt. Twee
onafhankelijke weergaven van de studie geven hetzelfde getal.

Rechtgezet in `verdieping.ts`, `spier.ts`, `HANDLEIDING.md`,
`ONDERZOEK-MEDISCH-AFVALLEN.md`, `VOORSTEL-MEDISCH-AFVALLEN.md` en hierboven.
De 25 % voor tirzepatide in SURMOUNT-1 klopt wel (5,6 kg vetvrij naast 15,9 kg
vet, ofwel 26 %).

### 25.2 Drieënveertig procent was achtenveertig

In het boekje stond dat een jaar na het staken van semaglutide nog ongeveer
43 % van de deelnemers minstens 5 % gewichtsverlies vasthield. De STEP-1-extensie
geeft **48,2 %** op week 120. Rechtgezet.

Twee andere getallen uit diezelfde tabel (het aandeel dat ≥ 10 % vasthield en
het aandeel op of boven het startgewicht) zijn vanaf deze machine niet na te
kijken: de uitgever, PubMed Central en de repositories zijn alle geblokkeerd
door de uitgaande proxy. Ze zijn daarom vervangen door een zin die zegt wat er
wél vaststaat. Wie de tabel bij de hand heeft kan ze terugzetten; dan met het
getal erbij.

### 25.3 Wishnofsky, niet Wichmann

`rekenkern.ts` schreef de 7.700 kcal per kilo toe aan "Wichmann". De regel komt
van **Max Wishnofsky**, *Caloric equivalents of gained or lost weight*, Am J Clin
Nutr 1958. Alleen commentaar, maar een verkeerde naam in de bron van een
medische app is precies het soort fout dat deze naloop moest vinden.

### 25.4 De eerste meetdag van de bloeddruk telde ten onrechte mee

Dit is de zwaarste bevinding, want hier veranderde een rekenregel.

`bloeddruk.ts` liet de eerste meetdag meetellen in het weekgemiddelde, met als
opgeschreven reden dat de handleiding het laten vervallen niet voorschrijft. Dat
klopt niet. Het NHG-protocol thuisbloeddrukmeting is 7-2-2 (zeven dagen, twee
keer per dag, twee metingen per keer) en laat de eerste dag uitdrukkelijk
vervallen, omdat iemand dan nog aan het apparaat went en de meting systematisch
hoger uitvalt. Er blijven zes dagen over.

Het gevolg van de oude regel was een gemiddelde dat te hoog uitviel. Dat is de
veilige kant van de fout, maar het was er wel een, en hij hing aan een verkeerd
gelezen protocol.

**Wat er anders is dan in het protocol.** Het protocol beschrijft één meetweek
met een begin; deze app rekent over een schuivend venster van zeven dagen op een
reeks die kan doorlopen. De oudste dag in dat venster is dus niet vanzelf iemands
eerste meetdag. De gewenningsdag vervalt daarom alleen als er geen enkele eerdere
bloeddrukmeting staat, en nooit als er anders niets overblijft. Het scherm zegt
erbij dát die dag is overgeslagen; een dag die stilzwijgend wegvalt is een dag
waarvan de lezer denkt dat hij meetelt.

**En de afkapwaarde.** Hier stond dat het protocol geen eigen grens voor de
thuismeting geeft en dat de 135/85 die elders circuleert uit een andere richtlijn
komt. Ook dat klopt niet: 135/85 is de grens voor de thuismeting. De app zet hem
nog steeds niet op het scherm, maar dat is nu een keuze en geen leemte, en zo
staat het er ook.

**Wat hieraan ontbreekt.** `nhg.org`, de richtlijnendatabase en de praktische
handleiding zijn vanaf deze machine geen van drieën op te halen. Het bovenstaande
komt uit drie onafhankelijke weergaven van het protocol en niet uit het protocol
zelf. Dat hoort nagelopen te worden door iemand die het op zijn bureau heeft
voordat dit als gecontroleerd geldt.

### 25.5 De app sprak zichzelf tegen over de standaard

`trap.ts` citeert de NHG-Standaard Obesitas van **augustus 2026**, de uitgave
die er als pdf ligt. Het boekje in `verdieping.ts` noemde nog de herziening van
**oktober 2025**, "via samenvattingen". Twee bestanden, twee data, en niemand die
het zag omdat ze nergens naast elkaar stonden.

Het boekje volgt nu dezelfde uitgave. De zin dat de criteria uit samenvattingen
komen is vervallen, want dat is niet meer waar. En de reden dat er geen
BMI-grenzen in dat stuk staan is herschreven: ze stonden er niet omdat de bron
tweedehands was, ze staan er nu niet omdat ze op Profiel horen, bij je traject,
met beide drempelsets en met het voorbehoud erbij.

`verdieping.proef.ts` hield de oude reden vast en viel om zodra de tekst
veranderde. Dat is precies waarvoor die regel er stond. Hij toetst nu twee
dingen: dat het stuk geen BMI-getallen draagt, en dat het dezelfde uitgave van de
standaard noemt als `trap.ts`.

### 25.6 Wat wél hield

Nagelopen en in orde bevonden: de WHO-richtlijn van 2020 (150 tot 300 matige of
75 tot 150 zware minuten, twee keer per week spierversterkend, één zware minuut
voor twee matige); de MET-waarden van de inspanningssoorten tegen het Compendium
of Physical Activities; SARC-F met afkapwaarde 4 en de vijf-keer-opstaantest
boven vijftien seconden uit EWGSOP2; de leucinedrempel van rond 30 g eiwit per
maaltijd; de suppletieadviezen van de Gezondheidsraad voor vitamine D (20 µg
vanaf 70 jaar, 10 µg voor vrouwen van 50 tot 70 en bij een getinte of donkere
huid); de vijf drempels voor voedingsclaims uit Verordening (EG) 1924/2006; zout
is natrium maal 2,5 uit Verordening (EU) 1169/2011; de botdichtheidscijfers
(2,6 % heup en 2,1 % onderrug over 52 weken); de STEP-1-extensie (n=327,
tweederde terug, netto −5,6 %); de hypotekst tegen Thuisarts.nl; Mamerow 2014
voor de eiwitverdeling; en de Lancet-commissie van januari 2025.

Bij de botstudie is erbij gezet wat er stond maar niet bij: 64 deelnemers, allen
met een verhoogd risico op botbreuken, en een lagere dosering dan bij
gewichtsbehandeling gebruikelijk is. En de duur van de middelenstudies is van
"anderhalf jaar" naar "ruim een jaar (68 tot 72 weken)" gegaan, want dat is wat
de studies liepen.

De leeftijdsklassen bij SCORE2 leken een fout: de richtlijn kent drie banden
(onder 50, 50 tot 69, vanaf 70) en de app twee. Hij kent er twee omdat
`score2()` buiten 40 tot 69 jaar `null` geeft, SCORE2-OP is bewust niet
geïmplementeerd. De derde band kan dus nooit vuren. Geen fout.

---

## 26. Geen gedachtestreepjes in schermtekst

Een verzoek, en een dat meer is dan smaak.

Het gedachtestreepje is goed Nederlands. In grote hoeveelheid is het ook een
herkenbaar spoor van tekst die een taalmodel schreef, en deze app hoort eruit te
zien als het werk van de arts die hem maakte. Een lezer die de vorm wantrouwt,
wantrouwt ook de getallen, en dan is de hele onzekerheidsdiscipline hierboven
voor niets geweest.

Alle 203 streepjes in schermtekst van BennaHealth zijn met de hand vervangen:
een komma waar het een bijstelling was, een dubbele punt waar het een uitleg
inleidde, een punt waar er twee hoofdzinnen stonden, haakjes waar het een
tussenzin was. Losse streepjes in een tabelcel waar niets te melden valt zijn een
half streepje geworden.

`src/health/schermtekst.proef.ts` houdt het vast. Die proef gebruikt de parser
van TypeScript en geen grep, en dat is geen overdaad: een grep op het bestand
keurt elk commentaarblok af, en een zelfgeschreven ontleding struikelt over de
apostrof, in JSX is `zo'n` gewoon tekst, en wie daar een string ziet beginnen
leest de rest van het bestand verkeerd. Die fout heeft de eerste versie van deze
proef ook gemaakt. De parser die de edge-poort al gebruikt weet het verschil wel.

### En de andere apps

Die zijn nu ook om: 886 streepjes in Noer, Sanad, Arabisch, Bunyan, Huiswerk,
Rasikh, Spelletjes, het startscherm en de gedeelde laag.

Een regelgestuurde vervanging was de eerste poging en die maakte brokken. Van
`"Vrijheid, gelijkheid, broederschap", iedereen even vrij` maakte hij een zin
met een half streepje tegen het aanhalingsteken, en van een tussenzin bleef één
sluithaakje over. De fout zat in het venster: hij keek honderdtachtig tekens om
zich heen en zag het tweede streepje van een paar daardoor soms wel en soms
niet.

Wat wél werkte is de tekst eerst in zinnen knippen en dan pas tellen. Twee
streepjes in dezelfde zin zijn een tussenzin en krijgen haakjes; een los
streepje krijgt een komma als het vervolg de verbinding zelf al draagt ("en",
"maar", "dus"), een dubbele punt na een kort label, en anders een komma. De
schermen en de kortere teksten zijn daarnaast met de hand gedaan.

Eén ding zat daarbij lelijk verstopt. Sanad schrijft het streepje in zijn bron
als `\u2014`, en zowel mijn gereedschap als de proef sloegen bestanden over die
het teken niet in hun bytes droegen. Vierendertig streepjes stonden er dus nog
terwijl alles groen was. Die snelle uitweg is eruit.

### Wat het de gouden waarden kostte

Elf proeven vielen om, en dat was geen hindernis maar het punt van die proeven.

De gouden waarden van de zes leer-apps worden gedraaid uit de oude
HTML-pagina's in `gereedschap/oud/`. Ze bewijzen dat de overzetting naar
TypeScript woordgetrouw was. Die pagina's bijwerken om een proef groen te
krijgen zou het bewijsstuk vervalsen, en dat gebeurt hier niet.

Wat er wél kon: de vinger over de wóórden laten lopen in plaats van over de
tekens. `src/gedeeld/woordgelijk.ts` gooit hoofdletters en alles wat geen letter
of cijfer is weg, aan beide kanten van de vergelijking. Daarmee ziet de proef de
leestekens niet meer, en blijft ze zien wat ze hoort te zien: een woord dat
verdwijnt, een getal dat verschuift, een les die van plaats wisselt.

Dat is een versoepeling, en een versoepeling zonder proef is een gat. Daarom
staat `src/gedeeld/woordgelijk.proef.ts` ernaast, met beide helften: wat er
wegvalt (streepje, komma, dubbele punt en haakjes zijn gelijk; een punt met een
hoofdletter erna ook) en wat er blijft (een verdwenen woord, een ander getal,
een andere volgorde, een leeg geworden tekst). Plus de regel dat Arabisch en
andere schriften blijven staan, werden die als leesteken weggegooid, dan kwam
de halve leerstof op één lege tekst uit en stond alles groen om de verkeerde
reden.

De opwekkers draaien als los script zonder de padaliassen van de app en hebben
daarom hun eigen kopie in `gereedschap/woordgelijk.mjs`. Twee kopieën die
uiteenlopen geven een vinger die aan beide kanten anders gerekend wordt; de
laatste regel van die proef draait ze allebei en legt ze naast elkaar.

`schermtekst.proef.ts` is meeverhuisd naar `src/gedeeld/` en dekt nu alle negen
apps.

### En daarna de rest

Op verzoek is het daar niet bij gebleven. Alle handleidingen, het
onderzoeksdossier, deze verantwoording, het codecommentaar, de SQL, de opmaak,
de cursuspagina's en de manifesten zijn meegegaan: nog eens 2.725 streepjes.
Buiten vier plekken staat het teken nergens meer in de repo, en
`src/gedeeld/schermtekst.proef.ts` houdt dat vast met een `git grep` over alles
wat in versiebeheer staat.

Die vier: het archief `gereedschap/oud/`, de gouden waarden die eruit gedraaid
zijn, en de twee proeven die over het teken gáán.

### De fout die dit bijna stil had gemaakt

In `src/huiswerk/nakijken.ts` stond het streepje in een reguliere expressie die
min-tekens gelijktrekt, zodat een kind dat een lang streepje typt niet ten
onrechte fout krijgt. De opruiming las dat als tekst en maakte er een komma van.

Twee proeven vielen om en dat was geluk, geen ontwerp. Een streepje in code is
noch een tekst noch commentaar, en geen van beide regels keek ernaar. De
expressie schrijft de drie tekens nu als ontsnapping, en de proef bevat een
regel die alle drie de streepjes daadwerkelijk door de functie haalt.

Dezelfde ontsnapping staat in regel 8 van de systeemprompt in
`health/edge/kal-ai.ts`. Die regel is er nieuw bij en verbiedt het model
gedachtestreepjes te gebruiken in de zinnen die het zelf schrijft. Zonder die
regel zou de app ze bij elke herkenning opnieuw op het scherm zetten, en geen
enkele statische proef zou dat zien.

---

## 27. De uitbijter die beloofd was en er niet stond

Hoofdstuk 1 zei dat een weging die te ver van de verwachting ligt wordt
aangemerkt. Dat stond er sinds de eerste versie, en het klopte niet: het woord
uitbijter kwam in de hele code niet voor. `trendReeks` rekende de EWMA en verder
niets.

Dat is precies het soort gat waar een naloop voor is. De aanleiding was een
schermafdruk waarop de y-as van de gewichtsgrafiek tot 191 liep terwijl de
gebruiker rond de 118 weegt: één weging van 190,2 in een reeks van achtentwintig
dagen. Zo'n getal trekt de trend, het verbruik, de BMI en het eiwitdoel scheef,
en dan staat er op vier schermen een uitkomst waar niemand iets aan heeft.

### Wat er nu gebeurt

Elke weging krijgt een `afwijkingKg`: het verschil met de mediaan van de
buurwegingen, drie aan elke kant, zichzelf niet meegerekend. Ligt die afwijking
boven de grens, dan is `uitbijter` waar. De grens is drie keer de eigen
spreiding, met een vloer van drie kilo.

Drie getallen, en alle drie om een reden.

**De mediaan van de buren, en niet de EWMA.** Dat was de eerste opzet en die
maakte van één fout er drie. Een EWMA lóópt naar een uitbijter toe, dus na die
190,2 weken ook de twee wegingen erná ver van de verwachting af en werden ze
evengoed aangemerkt. Eén verkeerde toets besmette drie dagen. Een mediaan
verschuift niet van één wild getal, dus de buren blijven schoon.

**De spreiding als mediane absolute afwijking.** Met een gewone
standaarddeviatie verstopt een grove uitbijter zich achter zijn eigen invloed:
die 190,2 tilt de spreiding zó ver op dat hij er zelf binnen drie ervan valt. De
proef rekent dat na en laat zien dat de gewone standaarddeviatie hem inderdaad
mist.

**De vloer van drie kilo.** Wie elke ochtend binnen tweehonderd gram weegt heeft
een spreiding van tweehonderd gram, en drie keer dat is zeshonderd. Een kilo na
een zoute maaltijd zou dan een uitbijter zijn, en dat is precies wat hoofdstuk 1
fysiologisch noemt. Drie kilo lichaamsweefsel komt er in één nacht niet bij; wat
er wél kan is vocht, een andere weegschaal, een ander mens erop, of een
verkeerde toets.

### Wat er niet gebeurt

De weging blijft staan, telt mee in de EWMA en telt mee in de regressie. Er
wordt niets weggegooid en niets gecorrigeerd. Wie op de weegschaal stond weet of
het een tweede persoon was of een verkeerde toets; de app weet dat niet en zegt
het dus ook niet.

Op Inzicht staat onder de grafiek welke weging het is, hoeveel hij afwijkt, en
dat hij gewoon meetelt. Een markering die de gebruiker niet ziet is geen
markering.

### De regel die een mutant afdwong

Vier mutanten werden gedood: de mediane absolute afwijking vervangen door een
gewone standaarddeviatie, de vloer van drie kilo weghalen, de drempel van vijf
wegingen op één zetten, en de verwachting terugzetten op de EWMA.

Eén overleefde: de weging meelaten tellen in zijn eigen verwachting. Dat is
logisch, want bij een mediaan verschuift één waarde er nauwelijks iets, en de
meeste reeksen geven hetzelfde antwoord met of zonder die uitzondering. Er is nu
een reeks die het wél laat zien: zes buren die zich splitsen in drie van 100 en
drie van 110, dus mediaan 105 en afwijking vijf. Telt de weging zelf mee, dan
zijn het zeven waarden, ligt de mediaan op 110 en is de afwijking nul, een
weging die zichzelf gelijk geeft.

En de belangrijkste regel van het blok gaat niet over uitbijters maar over de
gewone gang van zaken: achtentwintig dagen op streeftempo, met dagelijkse ruis,
levert geen enkele markering op. Deze app is er voor iemand die afvalt, en een
waarschuwing over precies dat gedrag zou het scherm met ruis vullen.

### Wat hier openstond, en hoe het is opgelost

De grafiek schaalde mee met de uitbijter: de y-as liep tot 191 en de echte reeks
werd een streepje. Dat is opgelost zoals hieronder in §31 staat: de as kijkt
naar de reeks, de weging staat op de rand.


## 28. De sparkline die niets tekende

In de kop van het inzichtscherm staat een strookje van acht weken gewicht: de
ruwe wegingen licht, de gladde lijn erover. Op de schermafdruk van 20 september
stond daar het kopje "Gewicht, laatste acht weken" met daaronder een paar losse
streepjes in een verder lege strook. Dat las als een kapotte figuur.

### Wat er misging

Het pad werd opgebouwd als `M` voor het eerste punt van een stuk en `L` voor
elk volgend punt, en bij een ontbrekende dag begon er een nieuw stuk. Een reeks
waarin geen twee wegingen naast elkaar liggen levert dan een pad op dat
uitsluitend uit verplaatsingen bestaat, en zo'n pad heeft geen lengte: er wordt
niets getekend. Gemeten in een echte Chromium, met een reeks die om de drie
dagen een weging heeft:

```
paden: [{ M: 10, L: 0, lengte: 0.0 }, { M: 10, L: 0, lengte: 0.0 }]
```

Tien wegingen, twee paden, nul beeldpunten. Bij zestien wegingen in
achtentwintig dagen (de toestand van de schermafdruk) valt het deels wél uit
elkaar en deels niet, en dat geeft de losse streepjes.

Het is geen rekenfout: het getal klopte, de figuur eronder toonde het niet. Maar
een lege strook onder een kopje zegt de gebruiker iets anders dan "je weegt
dun", namelijk "hier is iets stuk".

### Wat eraan gedaan is

Een punt dat helemaal alleen staat krijgt een lijnstuk naar zichzelf. Met een
ronde streepdop is dat een stip. De dop staat nu op allebei de paden en niet
alleen op de gladde; zonder dop tekent een lijnstuk van nul lengte namelijk
evenmin iets, en dan was een losse weging weer onzichtbaar geweest.

Wat er uitdrukkelijk **niet** gebeurd is: doortrekken over de gaten heen. Dat
zou de figuur een verloop laten tonen over dagen waarop niet gewogen is, en dat
is een meting verzinnen. Een gat blijft een gat, en dun wegen ziet er nu dun
uit in plaats van kapot.

### De proef

`src/health/lijntje.proef.ts`, tien gevallen. De twee eisen wijzen tegen elkaar
in en staan er allebei: elke waarde wordt getekend, ook een losse, én er wordt
nooit doorgetrokken over een gat. De eerste zonder de tweede geeft een vloeiende
lijn die niet gemeten is; de tweede zonder de eerste geeft de lege strook terug.

Drie mutanten, alle drie gedood: het lijnstuk naar zichzelf weghalen (drie
gevallen vallen om), het gat niet meer als gat behandelen (drie), en élk punt een
stip geven in plaats van alleen het losse (vier).

## 29. Het naslagvenster: breder, en met de getallen eruit

Verdiepen is het enige venster van deze app waar je in leest in plaats van iets
invult. Het had wel de vorm van alle andere: een kolom van 520 punten, titels in
de maat van een onderschrift, en alinea's in de maat van een bijschrift. Op een
tablet stonden daar regels van veertig aanslagen in, met de getallen middenin
weggezakt. Zo leest naslagwerk als een melding.

Drie dingen veranderd, en ze hangen samen.

**Breder, maar niet eindeloos.** Het venster kent nu een stand `breed`: 780
punten vanaf een scherm van 820. De bovengrens is geen smaak. Voorbij ongeveer
vijfentachtig aanslagen per regel raakt het oog bij de terugsprong de volgende
regel kwijt, en dat is precies wat je bij naslagwerk niet wilt. Alle andere
vensters blijven zoals ze waren: daar vul je iets in, en daar is smal juist
goed.

**Een titel is een titel.** De kop van een stuk stond in `eyebrow`, grijs en op
0,78 rem, dezelfde stijl als het bovenschrift "Wat we niet weten" eronder. Nu
staat hij in de kleur van de tekst op 1,12 rem. Het bovenschrift in het
voorbehoud blijft wat het was, want dat ís een bovenschrift.

**De hoeveelheden springen eruit.** Wie opzoekt hoeveel er na een jaar
terugkwam, hoort dat getal te zien voordat hij de zin eromheen leest. Dat
gebeurt bij het tekenen en niet met de hand in de tekst, want teksten worden
bijgewerkt en dan staat de nadruk op het vorige getal.

### Waarom dat laatste een eigen bestand en een eigen proef kreeg

Een cijfer is niet hetzelfde als een getal. In deze teksten staan `STEP-1`,
`GLP-1`, `Keer Diabetes2 Om` en `augustus 2026`, en geen van vieren is een
hoeveelheid. Vet gezet zouden ze de aandacht trekken van precies de getallen
waar het om gaat. Vandaar drie voorwaarden: geen letter, cijfer of koppelteken
tegen het getal aan (dat haalt `STEP-1` en `Diabetes2` eruit), de eenheid hoort
bij het getal (anders staat "40" dik en "procent" dun), en een kaal jaartal telt
niet mee. Een getal van vier cijfers mét eenheid wel, want 2000 kcal is geen
jaar.

Eén ding ging bij het bouwen mis en is het vermelden waard. De nadruk kreeg
eerst de klasse `cijfer`, die al bestond: mono met tabelcijfers, precies goed
voor een getal in een vakje waar cijfers onder elkaar horen te staan. In een
lopende zin leest datzelfde als een stuk code midden in de tekst. Een
hoeveelheid in proza blijft dus in dezelfde letter en wordt alleen zwaarder.

De eigenschap die er het meest toe doet is een andere: **de tekst blijft
letterlijk dezelfde.** Wat erin gaat komt eruit, alleen in stukken geknipt. Een
nadrukregel die onderweg een spatie of een woord opeet is in een medische tekst
erger dan geen nadruk, en op het scherm is dat bijna niet te zien: er staat
gewoon een zin, en er ontbreekt iets. Die eigenschap staat als eerste proef in
`src/health/nadruk.proef.ts`.

Vier mutanten, alle vier gedood: de jaartalwacht weghalen, de terugblik in de
uitdrukking weghalen (dan wordt `STEP-1` dik), de eenheid niet meenemen, en één
teken te weinig afknippen (dan verdwijnt er stilletjes een letter uit de tekst).

## 30. Wat er aan het boekje bij is gekomen

Het was acht stukken en het zijn er negen. Wat er bij kwam en wat er aangevuld
is, staat hieronder; de bronnen staan bij de stukken zelf.

**Slaap, en waar je gewichtsverlies vandaan komt.** Dit ontbrak, en het is een
van de weinige dingen in dit dossier waar het bewijs scherp is en de uitkomst
onverwacht. Dezelfde mensen, twee keer veertien dagen hetzelfde caloriearme
dieet, één keer met 8,5 uur slaapgelegenheid en één keer met 5,5 uur: even veel
gewicht eraf, maar bij de korte nachten daalde het aandeel vet in dat verlies
met 55 procent en steeg het verlies aan vetvrije massa met 60 procent
(Nedeltcheva e.a., 2010). Het voorbehoud hoort er even hard bij: tien mensen, in
een laboratorium, opgelegd slaaptekort.

Daar hoort de apneukant naast, omdat de richting van dat bewijs tegen de
intuïtie in gaat. Afvallen helpt tegen slaapapneu (tien kilo eraf gaf bijna tien
ademstops per uur minder), maar CPAP helpt niet tegen het gewicht: twee
meta-analyses vinden een kleine toename. Vandaar de volgorde in het stuk:
behandel de apneu om de apneu, en het gewicht daarnaast.

**Wat GLP-1 doet** stond er met één samengevat bereik ("15 tot ruim 20
procent"). Dat is nu per middel, met de studie erbij, en er staat bij wat het
kost: bij obesitas zonder diabetes type 2 wordt er in Nederland niets vergoed.
Dat is voor de lezer geen bijzaak.

**Wat je verliest naast vet** had de casusreeksen wel en het hardere bewijs
niet. Krachttraining hield in een samenvatting van zes gelote onderzoeken 93,5
procent tegen van het verlies aan vetvrije massa dat door de caloriebeperking
kwam, bij drie keer per week gedurende twaalf tot vierentwintig weken. En
andersom: zonder beweging erbij verloor 81 procent van de groepen meer dan een
zesde van het gewichtsverlies als vetvrije massa, tegen 39 procent met beweging.

**Waarom eiwit nu zwaarder telt** noemde een drempel zonder te zeggen hoe je
die haalt. Er staan nu porties bij (honderd gram bereide kipfilet rond de 30
gram, een schep wei-eiwit van dertig gram rond de 27, drie eieren rond de 19),
en het gewicht waarop het doel per kilo slaat: gemaximeerd op wat bij een BMI
van 30 hoort, zoals de app zelf rekent. Bij het voorbehoud zijn twee dingen
gekomen die in de reclame voor eiwit nooit staan: de leucinedrempel is een
werkhypothese waarvoor geen afkappunt is vast te stellen, en er bestaat geen
enkel onderzoek dat de eiwitbehoefte bij obesitas rechtstreeks heeft bepaald.

### Eén getal rechtgezet in het onderzoeksdossier

`ONDERZOEK-MEDISCH-AFVALLEN.md` gaf voor de STEP-1-extensie nog ~43 procent voor
de groep die minstens 5 procent verlies vasthield. Bij de naloop van 20
september bleek de extensie zelf 48,2 procent te geven; dat was toen in het
boekje rechtgezet maar niet in het dossier, dus daar stonden twee getallen in
één repo. Nu gelijkgetrokken, met de reden erbij.


## 31. De as kijkt naar de reeks, de weging staat op de rand

De uitbijter uit §27 werd wél aangewezen in de tekst, maar de figuur eronder
bleef onleesbaar: één weging van 190,2 in een reeks rond de 118 liet de as van
107 tot 191 lopen, en tweeëntwintig echte wegingen werden daardoor een streepje
van een paar punten hoog. Letterlijk waar, en precies daardoor nutteloos: je zag
alleen nog de fout.

Dat stond hier als ontwerpkeuze open. Hij is nu gemaakt, en het is niet de keuze
tussen eerlijk en leesbaar geworden maar allebei.

**De as kijkt naar de reeks.** Een weging die als uitschieter is aangemerkt
bepaalt de uitsnede niet meer.

**De weging verdwijnt niet.** Hij staat op de rand van de figuur, met een ring
eromheen zodat hij niet voor een gewone meting wordt aangezien, met een gestreept
streepje dat naar buiten wijst, en met zijn eigen getal ernaast. Zonder dat getal
zou de rand suggereren dat hij er net buiten ligt. Deze app gooit geen metingen
weg, ook niet uit een plaatje.

**Het voortschrijdend gemiddelde telt wél mee voor de as.** Dat is de uitkomst
van het model en niet de meting. Bij alfa 0,1 loopt de lijn na zo'n weging een
paar kilo mee omhoog en zakt daarna terug; dat hóórt zichtbaar te zijn, anders
lijkt de trend kalmer dan hij is en verbergt de figuur juist de fout die de tekst
eronder benoemt. Gemeten in de proefreeks: de as loopt nu van 115 tot 127 in
plaats van 107 tot 191, met de piek van het gemiddelde erin.

**En een gemarkeerde weging die gewoon binnen de uitsnede valt, blijft op zijn
plek staan.** Op de rand zetten wat er niet buiten ligt zou liegen over waar het
ligt. Een weging van 119 in een reeks rond de 118 kan aangemerkt zijn zonder ver
weg te liggen.

**Blijft er te weinig over om op te schalen, dan gebeurt er niets bijzonders.**
Twee wegingen waarvan er één afwijkt hebben geen "rest" om je op te richten, en
een as op één punt is geen as. Dan schaalt de figuur op alles, zoals altijd.

De schaal zit in `gewichtSchaal()` en niet in de tekening, zodat hij te toetsen
is zonder een browser. Zeven gevallen, vijf mutanten gedood: de uitbijter toch
mee laten tellen voor de as, `buitenBeeld` altijd leeg maken, het gemiddelde
níét meerekenen, de terugval weghalen, en élke uitbijter op de rand zetten in
plaats van alleen die erbuiten valt.

### Twee dingen die bij dezelfde figuur opvielen

De regel "doel 100 kg ligt onder deze uitsnede" stond rechtsboven en zei altijd
"onder", ook wanneer het doel er juist bóven zou liggen. Hij staat nu onder de
as, naast de datumregel (daar ligt het doel immers ook: buiten beeld), en hij
zegt welke kant het op is. Rechtsboven botste hij bovendien letterlijk met het
getal van een weging op de rand.

## 32. Wat er uit een nascholing van september 2026 is overgenomen, en wat niet

Een avond met drie sprekers over de behandeling van obesitas: Blüher (Leipzig)
over heterogeniteit, Vangoitsenhoven (UZ Leuven) over dopamine, Acosta (Mayo
Clinic) over fenotypering. Veel van wat daar langskwam is het opschrijven waard.
Eén ding staat daarom bovenaan en niet onderaan: **de avond werd betaald door
Good Life Pharma, en alle drie de sprekers kwamen langs een eigen route uit bij
naltrexon-bupropion, precies het middel dat die organisator in de Benelux
voert.** Dat maakt de inhoud niet onwaar; het bepaalt wel hoe hard je hem mag
brengen.

### Wat er in de app is gekomen

**Eén maat erbij, en het is de maat die de sprekers zelf meten.** De
middelomtrek stond er al met de afkappunten van 94 en 102 cm. Die zijn
centimeters voor iedereen, en dat is hun zwakte: 102 cm bij 1,70 m is iets
anders dan bij 1,96 m. De verhouding met de lengte lost dat op met één deling
en kent één grens voor iedereen, 0,5. NICE beveelt hem naast de BMI aan, en in
de kliniek is hij vaak het enige wat er werkelijk gemeten wordt: DEXA mag daar
alleen binnen onderzoek, en een MRI-scanner houdt rond de 140 kilo op, precies
bij de patiënten waar het om gaat.

De grens is een zone en geen streep. De meetfout van het lint loopt in de
literatuur van 0,7 tot 15 cm; bij een lengte van 1,90 m is twee centimeter al
0,01 in de verhouding. Wie op 0,50 uitkomt weet met één meting niet aan welke
kant hij staat, en dat zegt het scherm in plaats van te kiezen. Dat is dezelfde
regel als overal: geen getal zonder zijn onzekerheid.

Een overlevende mutant heeft hier iets opgeleverd. De functie had eerst een
losse null-controle vóór de controle op groter dan nul, en een mutant die de
eerste wegnam bleef leven: de tweede wacht ving hetzelfde geval al op. Twee
regels die hetzelfde bewaken zijn er één te veel; het is nu één wacht.

**Twee stukken erbij in het boekje.** Het eerste gaat over waarom dezelfde
behandeling bij de een wel werkt en bij de ander niet: de non-responscijfers
(ongeveer 13 procent van de volwassenen op semaglutide, ongeveer 27 procent van
de jongeren, minder dan 10 procent op de hoogste dosering tirzepatide, samen 15
tot 20 procent), de vijf weefselgroepen uit Leipzig, en de vier eetprofielen.
Het tweede gaat over food noise: het homeostatische systeem naast het
hedonische, de verschuiving van de beloning naar het signaal dat haar
aankondigt, de acht weken waarin een vet en zoet tussendoortje de voorkeur voor
vetarm eten verlaagde, en het metabole-afdelingsonderzoek waarin twintig mensen
op bewerkt eten ongeveer 508 kcal per dag meer aten.

**En het mechanisme dat "Meer dan een BMI" miste.** Waarom hetzelfde gewicht bij
de een wel en bij de ander geen schade geeft, gaat over opslagcapaciteit:
onderhuids vet dat meegroeit door nieuwe cellen tegenover vetcellen die uitzetten
tot ze zuurstof tekortkomen, ontstekingscellen aantrekken, en het overschot
doorsturen naar buikholte, lever, spier en alvleesklier. De gematchte paren met
dezelfde BMI, leeftijd, sekse en vetmassa, waarvan de een niets mankeerde en de
ander diabetes en hypertensie had, maken dat concreet: het verschil zat in vet
in de buikholte en in het weefsel zelf.

### Wat er niet in is gekomen, en waarom

**De naam van het middel.** Het mechanistische verhaal eromheen is fraai (een
POMC-neuron dat zichzelf via β-endorfine afremt, een blokkade die die rem
weghaalt) en het klinische signaal is interessant: angst en depressie vóór start
voorspelden wél de respons op dat middel en niet op de incretines. Maar een
boekje voor een patiënt dat een middel bij naam aanprijst op grond van een
gesponsorde avond is een advertentie, hoe goed het mechanisme ook klinkt. Het
stuk beschrijft daarom wél dat er verschillende motoren onder obesitas zitten en
dat dezelfde marker voor twee middelen tegengesteld kan voorspellen, en noemt
geen merk. Wil de eigenaar het er alsnog in, dan is dat een bewuste keuze en
geen omissie.

**Geen vragenlijst voor angst en depressie.** Acosta triageert met de PHQ-2 en
meet met de GAD-7 en de PHQ-9. Dat zijn bruikbare, vrij beschikbare instrumenten
en het zou technisch een halve dag werk zijn. Het is niet gedaan omdat vraag 9
van de PHQ-9 over suïcidale gedachten gaat. Een app die die vraag stelt moet een
route hebben voor het antwoord, en die route is geen tekstje maar een afspraak
met een mens. Zolang die er niet is, hoort de vraag er niet te staan.

**Geen fenotype-indeling.** De vier eetprofielen zijn aantrekkelijk en de
gegevens erachter zijn dun: kleine trials, uitsplitsing achteraf, en de
genetische score die ze schaalbaar zou maken is binnen één groep ontwikkeld en
gevalideerd. Een app die je op grond daarvan een etiket geeft, doet precies wat
deze app nergens doet: een oordeel vellen dat de gegevens niet dragen.

### De regel die daaruit volgt, en die nu getoetst wordt

Noemt de bron van een stuk een sponsor, dan staat het belang in datzelfde stuk
onder "wat we niet weten", waar de lezer het ziet. Niet in een voetnoot, niet in
de bronvermelding alleen. Dat staat als proef in
`src/health/belangenverstrengeling.proef.ts`, naast de regel over merken in de
voedingslijst, met een tweede regel die omvalt zodra er geen stuk meer is waarop
de eis slaat: een eis die geruisloos verdwijnt bewaakt niets.

## 33. Het bloeddrukprotocol nagelopen, en wat het wel en niet bevestigt

Er lag een vraag open sinds de medische naloop: de thuisbloeddrukregel in deze
app (zeven dagen, twee metingen 's ochtends en twee 's avonds, eerste dag eraf,
grens 135/85) kwam uit drie onafhankelijke weergaven en niet uit het protocol
zelf, want nhg.org is vanaf deze machine niet te bereiken.

Er is nu een protocol op tafel gekomen: **NHG, Protocol bloeddruk meten, 2022,
versie 1.1.** Dat is een ander document dan waar de vraag over ging. Het gaat
over de méting in de spreekkamer en niet over de week thuis, en het bevestigt de
7-2-2-opzet, de gewenningsdag en de 135/85 dus niet. Die drie staan nog steeds
als "uit secundaire bronnen" in de kop van `bloeddruk.ts`. Dat is de eerlijke
uitkomst en niet de gewenste.

### Wat het wél bevestigt, en wat daarvan in de app is gekomen

Het document geeft de meetregels zelf, en die zijn in deze app niets waard als
ze in een boekje blijven staan. Ze staan nu bij het invoerveld, want daar wordt
bepaald hoe goed het getal wordt dat je intikt: vijf minuten rustig zitten, niet
praten, voeten naast elkaar, de manchet ter hoogte van het midden van het
borstbeen, en twee metingen met een of twee minuten ertussen waarbij de manchet
helemaal leeg moet. Wat je noteert is het gemiddelde van de laatste twee.
Verschillen die twee meer dan 10 mmHg systolisch of 5 diastolisch, dan meet je
door tot twee opeenvolgende metingen dichter bij elkaar liggen.

En het geeft het sterkste argument voor de kaart die er al stond. Bij 15 tot 20
procent van de mensen is de bloeddruk alleen in de spreekkamer verhoogd, en bij
10 tot 15 procent juist alleen daarbuiten. Dat is precies waarom een week thuis
iets zegt wat de spreekkamer niet zegt, en het staat nu in de app met de bron
erbij. De spreekkamergrens (gemiddelde van de geregistreerde bovendrukken over
drie momenten, 140 mmHg of hoger) staat er ook, met de opmerking dat thuis een
lagere grens geldt die deze app met opzet niet neerzet.

### Eén verschil dat daardoor zichtbaar werd

Het spreekkamerprotocol zegt: noteer het gemiddelde van de láátste twee
metingen. `thuisbloeddruk` middelt alles wat er op een dag staat. Dat verschil
is blijven staan, en met reden: die rekenregel overnemen op gezag van een
document dat niet over de thuismeting gaat, zou precies de fout zijn die dit
hoofdstuk rechtzet. Het verschil staat nu in de kop van `bloeddruk.ts` én in een
proef (een dag met drie metingen geeft 137/88 en niet 130/85), zodat het niet
stilletjes kan verschuiven.

### De stand van de andere open punten

Bestand 44 is toegepast. Module D blijft rusten. De twee fixes in de
ProVita-repo vervallen: `Bennahuiswerk` is de repo die telt. "Wat ontbreekt er"
op Vandaag blijft zoals het is, over voedingsstoffen en niet over producten.

Eén punt is níet opgelost, ondanks dat het geregeld leek: toegang tot de
database van BennaHealth. De Supabase-koppeling van deze sessie ziet twee
projecten, en `huiuvnjrvvoybbzwfrfp` zit er niet bij; een leesvraag erop komt
terug met "You do not have permission to perform this action". Daardoor is de
md5-controle uit `CLAUDE.md` (de `prosrc` van elke functie tegen het genummerde
bestand) nog steeds niet zelf te draaien. Tot dat lukt geldt voor elk genummerd
bestand: toegepast is wat de eigenaar zegt, niet wat deze sessie heeft gezien.

## 34. Twee dingen die de app al wist maar niet gebruikte

Beide komen uit de lijst die na de nascholing van september is opgeschreven, en
beide gebruiken uitsluitend gegevens die er al stonden.

### Vier van de acht STOP-BANG-vragen

De vragenlijst vraagt naar geslacht, leeftijd, BMI en nekomtrek. Die vier staan
al in deze app, en de nekomtrek stond er zelfs twee keer: als meting in het
lijstje, en als vinkje dat je zelf moest zetten. Twee plekken voor hetzelfde
getal is één plek waar het fout kan gaan, en in een score waar drie punten al
"matig risico" heet telt één verkeerd vinkje mee.

De app vult die vier nu in, maar alleen de eerste keer. Wie de lijst al eens
bewaard heeft, heeft antwoorden gegeven, en die overschrijven met een berekening
zou zijn oordeel weggooien. Onder elk van de vier staat waar het antwoord
vandaan komt (*uit je profiel*, *uit je geboortedatum*, *uit je lengte en je
laatste weging*, *uit je laatste nekomtrek*), en zet je het vinkje anders dan de
gegevens zeggen, dan zegt het scherm dat de twee uit elkaar lopen zonder je
tegen te spreken.

**Niet gemeten is geen nee.** Een ontbrekende waarde levert géén sleutel op en
zeker geen `false`. Op het scherm zien die twee er hetzelfde uit, een vinkje dat
uit staat, en juist daarom moet het verschil in de gegevens wél bestaan. Zonder
geslacht valt de nekvraag niet te beantwoorden (de grens is 43 cm bij mannen en
41 bij vrouwen) en dan komt hij er dus niet uit.

De grenzen zijn die van de officiële vragenlijst en niet die van het gemak:
ouder dan 50 en BMI boven 35 zijn strikt. Vier mutanten gedood, waaronder de
twee die ertoe doen: een ontbrekende waarde als nee behandelen, en de nekgrens
voor iedereen op 43 zetten.

### Wat er veranderd is sinds je begon

Dit is de kaart die de app het langst miste. Elk scherm toonde een
momentopname, terwijl de vraag die ertoe doet is of er iets beter van geworden
is. Het slotwoord van de nascholing ging daarover: beoordeel respons niet op de
weegschaal maar op de comorbiditeit. De gegevens daarvoor stonden er al, met
datum en al.

De kaart zet per maat de eerste meting naast de laatste: gewicht, middelomtrek,
boven- en onderdruk, en zes labwaarden. Drie regels, en ze volgen alle drie uit
de rest van deze app.

**Twee metingen op verschillende dagen, of de maat komt er niet in.** Eén
waarde is geen beloop, en twee waarden op dezelfde dag zijn één meetmoment. Een
verschil van nul tonen omdat er maar één moment is, suggereert dat er niets
veranderd is terwijl er niets gemeten is.

**Het gewicht komt uit de gladde lijn en niet van de weegschaal.** Het verschil
tussen twee losse wegingen is voor een flink deel vocht. De proef zet dat vast
met een reeks waarin de eerste en de laatste weging toevallig gelijk zijn
terwijl de trend wél daalt: wie de ruwe waarden pakt komt op nul uit.

**Er staat een verschil en geen oordeel.** Geen kleur, geen pijl die "goed"
betekent. Of een daling van 0,3 in het HbA1c iets betekent hangt af van dingen
die deze app niet weet.

Vijf mutanten gedood, waaronder twee die op het scherm niet op zouden vallen:
niet op datum sorteren (de database geeft rijen in de volgorde die hij toevallig
heeft) en het verschil de verkeerde kant op berekenen.

De proefgegevens hebben er een tweede, oudere meetdag bij gekregen. Zonder die
dag heeft de kaart niets te vergelijken en zou de schermproef een kaart tonen
die op de telefoon van de gebruiker vol staat en hier altijd leeg blijft. De
proef kijkt nu of alle vier de maten er staan en of de verschillen kloppen: 114
naar 108 is zes centimeter eraf, 146 naar 128 is achttien punten.

## 35. De middelomtrek als reeks

De app bewaarde elke middelomtrek met een datum en toonde er één: de nieuwste.
Daarmee is de vraag die ertoe doet niet te beantwoorden. Niet "hoeveel is het",
maar "gaat het de goede kant op, en gaat het mee met het gewicht".

Dat laatste is het punt. Valt het gewicht terwijl de omtrek gelijk blijft, dan
gaat er iets anders weg dan buikvet. Valt de omtrek terwijl de weegschaal
stilstaat, dan gebeurt er juist wél iets. Die twee naast elkaar zeggen samen
meer dan allebei apart, en beide getallen stonden er al.

Onder de laatste waarde staat nu de reeks: per meetdag de datum, de waarde en
het verschil met de vorige, en daaronder het geheel in één zin. Staat het
gewicht van beide dagen bekend, dan staat de gewichtstrend van diezelfde twee
dagen erachter.

### Vier keuzes, en ze volgen uit de rest van deze app

**Geen lijntje.** Een sparkline zet zijn punten even ver uit elkaar, en
middelomtrekmetingen liggen dat nooit: twee in mei en één in september zouden er
uitzien als een gelijkmatig verloop. Bij een handvol metingen is de datum erbij
zetten eerlijker dan een lijn die de tijd ertussen platslaat.

**Geen trendlijn met een helling.** Bij vier metingen over een half jaar is een
helling met standaardfout schijnnauwkeurigheid. Er staat wat er staat.

**Een verschil onder de meetfout heet geen verandering.** De fout van het lint
loopt in de literatuur van 0,7 tot 15 cm. Onder de twee centimeter zegt de app
dat er nog niets uit af te lezen valt, in plaats van een daling van één
centimeter als vooruitgang te presenteren.

**Het gewicht ernaast komt uit de gladde lijn, en van de juiste dag.** Niet de
weging van die ochtend, want dat is voor een deel vocht, en niet de nieuwste
waarde uit de hele reeks, want dan vergelijk je een omtrek van april met een
gewicht van september. Het is het voortschrijdend gemiddelde op of vóór de dag
van die meting, en is er op dat moment nog niet gewogen, dan komt die zin er
niet.

Zes mutanten gedood. Twee ervan zijn het vermelden waard: vooruitkijken in de
gewichtsreeks (dan hangt er een gewicht naast een omtrek die maanden ouder is)
en twee metingen op één dag als twee punten tellen (dan telt een dag waarop je
twee keer mat dubbel mee in het beeld).

## 36. Een verschil zonder tijd erbij is niet te lezen

De kaart "Wat er veranderd is" zette twee momenten naast elkaar en noemde het
verschil: `114 → 108 cm`, `-6`. Wat er niet bij stond is hoe lang daar over
gedaan is, en dat is precies het getal dat bepaalt wat je van de zes vindt. Zes
centimeter eraf in vier maanden is een beloop; zes centimeter eraf in drie jaar
is ruis met een lange aanloop. Het verschil op het scherm is in beide gevallen
hetzelfde.

De datums stonden er al. `Verandering` droeg `vanDatum` en `totDatum` vanaf het
begin, want de kaart heeft ze nodig om te weten of er wel twee meetdagen zijn.
Ze stonden alleen niet op het scherm. Er is dus niets bij gemeten en niets bij
geschat: er staat nu `118,9 → 117,3 kg · 4 wk` waar eerst alleen het eerste deel
stond.

### De eenheid wisselt mee, en waarom daar grenzen bij horen

Onder de twee weken staan er dagen, daarboven weken, vanaf tien weken maanden en
vanaf twee jaar jaren. Twee keuzes daarin zijn geen afronding maar een oordeel.

**Boven de twee weken geen dagen meer.** "Zeventien dagen" klinkt preciezer dan
het is. De meetmomenten zelf liggen niet op een vaste dag; je meet je middel
wanneer je eraan denkt. De dag erbij zetten suggereert een nauwkeurigheid die in
de meting niet zit.

**Onder de twee jaar geen jaren.** Anderhalf jaar leest als `18 mnd` en niet als
`2 jr`. Daar is de maand nog de eenheid die het verschil draagt, en afronden naar
hele jaren gooit een half jaar weg.

Hoe lang een maand of een jaar precies duurt doet hier niet toe. Op hele maanden
afgerond geeft 30, 30,44 of 31 dagen hetzelfde antwoord, en dat is ook wat de
mutatieproef laat zien: de maand van 30,44 naar 30 zetten doodt geen enkele
proef, en dat is terecht. Wat wél omvalt zijn de grenzen (veertien, zeventig,
zevenhonderddertig) en de deler die van de ene eenheid naar de andere springt.
Zes mutanten gedood, één overlevende die na onderzoek een equivalente bleek: het
jaar stond als tweede constante in de code en is nu `MAAND * 12`, zodat de vraag
zich niet nog eens stelt.

## 37. De controle op de database controleerde zichzelf niet

`controle-md5.sql` vergelijkt elke functie in de database met het genummerde
bestand dat haar het laatst neerzet. Onder in dat bestand stond een belofte:
"verandert er een functie, dan hoort dit bestand opnieuw gemaakt te worden." Er
was niets dat dat deed, en niets dat het controleerde. De verwachte waarden
waren met de hand uitgerekend.

Dat is een controle die na de eerste de beste wijziging het verkeerde antwoord
geeft, en nog het gevaarlijkste soort ook: hij zou *VERSCHILT* melden op een
functie die in de database volkomen in orde is, en dan ga je in de database
zoeken naar een verschil dat aan deze kant zit.

Nu rekent `gereedschap/db-md5.mjs` de waarden uit, schrijft
`gereedschap/md5-verslag.mjs --schrijf` ze weg, en houdt
`src/health/dbverslag.proef.ts` bij elke poort vast dat ze nog kloppen met de
bestanden. De proef kan de database niet zien, en zegt dat ook: hij bewaakt de
helft die hier ligt.

### Twee dingen waar deze code over kon struikelen, en allebei stil

**Niet trimmen.** Postgres bewaart in `prosrc` wat er tussen de dollartekens
stond, inclusief de regelovergang meteen na `$$`. De SQL-kant trekt witruimte
samen tot één spatie en haalt hem dus niet weg. Wie aan deze kant trimt krijgt
op élke functie *VERSCHILT* te zien.

**Op nummer sorteren en niet op naam.** Een functie mag in meer dan één bestand
staan, want `create or replace function` is de gewone gang van zaken. Wat er
draait is wat er het laatst is neergezet. Alfabetisch komt bestand 9 ná 10, en
dan wijst de controle het verkeerde bestand aan zodra er een tiende bijkomt.

Beide staan als proef vast, en beide doden een mutant.

### Wat de eerste echte uitslag liet zien

Zeven functies verschillen van hun bestand, en tien draaien er zonder dat er
ergens een bestand over gaat: `kal_sessie`, `kal_afmelden`, `kal_profiel_zetten`,
`kal_dagstand`, `kal_dag_zetten`, `kal_regels_toevoegen`, `kal_regel_wissen`,
`kal_weekcijfers`, `kal_prikkel_bouwen` en `kal_prikkel_gelogd`. Dat zijn de
sessie, het profiel en het wegschrijven van een dag: de bodem van de app.

Die tien zijn van hieruit niet te schrijven, want hun tekst staat alleen in de
database. `health/database/uitlezen-functies.sql` haalt hem op. Wat er niet
gebeurt is ze uit het hoofd reconstrueren: een verslag dat lijkt op wat er
draait is erger dan geen verslag, want het wordt geloofd.

## 38. Wat de richtlijnmodule bevestigde, en het getal dat daardoor fout stond

Bij §33 is het protocol bloeddruk meten nagelopen en stond eronder wat er niet
mee bevestigd was: de 7-2-2-opzet, het vervallen van de eerste dag, en de grens
van 135/85. Die drie hingen aan weergaven van derden.

De richtlijnmodule Bloeddrukmeting bij CVRM (NHG en NIV, 17 oktober 2018,
geldigheid beoordeeld 1 juni 2021) gaat wél over de ambulante metingen, en
bevestigt er twee van:

- **De opzet.** "Een week lang volgens protocol 2x per dag." Zeven dagen en twee
  meetmomenten per dag staan daarmee vast.
- **De grens.** Tabel 1 zet een spreekkamermeting van 140 mmHg naast een
  geprotocolleerde thuismeting van 135, en 180 naast 170.

Wat er níet in staat, en dus tweedehands blijft: de twee metingen per
meetmoment, de gewenningsdag, en de 85 diastolisch. Tabel 1 gaat alleen over de
bovendruk.

### Het getal dat daardoor fout stond

Diezelfde module zegt iets wat deze app negeerde: ambulante metingen kunnen niet
rechtstreeks in de risicotabel, want het uitgangspunt van die tabel zijn
gestandaardiseerde spreekkamermetingen. Wie er een thuiswaarde in stopt, krijgt
een risico dat te laag uitvalt.

En dat deed de app. SCORE2 rekende met `nieuwste('bloeddruk_sys')`: de laatste
losse meting, thuis gedaan. Twee fouten in één getal. Eén meting is geen
bloeddruk, en dat weet deze app als geen ander, want de kaart eronder rekent al
over een week. En een thuiswaarde valt lager uit dan de spreekkamerwaarde waar
de tabel op rust.

Nu gaat het weekgemiddelde erin, omgerekend met tabel 1. Wat erin ging staat op
het scherm, met het risico zonder die stap ernaast, zodat te zien is hoeveel de
correctie uitmaakt. Er is geen tweede getal bijgekomen: er staat één risico, en
eronder waar het op rust.

### Waarom de schatting nooit onder de thuiswaarde zakt

De lijn door de twee ijkpunten snijdt de diagonaal rond de 100 mmHg. Daaronder
zou hij een spreekkamerwaarde geven die láger is dan wat er thuis gemeten is, en
dat is een uitloper van de rekensom en geen bevinding. Daar houdt de schatting
op bij de thuiswaarde zelf. Zes proeven, waarvan twee op de ijkpunten: verandert
daar iets, dan verandert er iets aan de bron en niet aan de code.

En één ding dat de module toevoegt en dat nu op het scherm staat: een
24-uursmeting heeft de voorkeur boven de week thuis, omdat de nachtelijke
bloeddruk een sterkere voorspeller is dan die overdag. Deze app meet thuis. Dat
is de tweede keus, en dat hoort er te staan.

## 39. Het overzicht dat je meeneemt naar het spreekuur

Een consult duurt tien minuten. Alles wat in deze app staat, staat er dan niet:
voorlezen van een telefoon kost meer tijd dan er is, en de helft komt er
verkeerd uit. Op Gezondheid staat nu één knop die er één tekst van maakt, om te
plakken in een mail of een bericht aan de praktijk.

Platte tekst en geen bestand: tekst overleeft elke overdracht en een PDF niet.

### Vijf regels, en ze volgen alle vijf uit de rest van deze app

**Er wordt niets nieuws uitgerekend.** Elk getal in het vel staat al op het
scherm en wordt aangereikt, niet opnieuw berekend. Anders konden het scherm en
het briefje verschillende dingen zeggen over dezelfde dag.

**De voorbehouden reizen mee.** Een SCORE2 van 6,4 procent zonder de
onderschatting van 1,3 en zonder de C-index is in de inbox van een huisarts een
ander getal. Wat op het scherm onder het getal staat, staat in het vel onder het
getal. Vijf mutanten gedood, en ze gingen alle vijf over weglaten: het voorbehoud
bij SCORE2, dat bij FIB-4, de datum bij een labwaarde, de bloeddruk waarmee
gerekend is, en een maat die ontbreekt.

**Er staat waar het vandaan komt.** Bovenaan staat dat het zelfgemeten en zelf
ingevoerde waarden zijn. In platte tekst ziet een overgetikt getal er precies
hetzelfde uit als een labuitslag.

**Wat ontbreekt krijgt een regel.** Onderaan staat wat er niet in staat en
waarom: welke labwaarden leeg zijn, dat FIB-4 zonder ASAT niet te berekenen is,
dat de vragenlijst niet is ingevuld. Leeg betekent in deze app niet gemeten, en
dat is iets anders dan goed.

**Er staat geen oordeel in.** De proef op de gerenderde pagina zoekt naar "te
hoog", "te laag" en "goed bezig" en valt om als ze er staan.

### Twee dingen aan de vorm

**Het vel is zichtbaar vóór je het kopieert.** Wat je verstuurt, hoor je gelezen
te hebben. Een knop die stilletjes iets over je gezondheid op je klembord zet, en
daarmee op de volgende plek waar je plakt, is hier de verkeerde vorm.

**Een kop komt alleen als er iets onder staat.** Een kop boven niets leest als
een gegeven dat is weggevallen, en dat is erger dan de regel onderaan waar hij
dan wél staat.

## 40. Elf stukken die je moest kennen om ze te vinden

Het boekje Verdiepen stond als één knop onderaan Profiel, in een kaart die over
de herkomst van de getallen gaat. Elf stukken met bronnen, en je moest weten dat
ze bestonden om ze te vinden.

Dat is dezelfde fout als met de conditiekaart, en die staat in dit bestand al
opgeschreven: een functie die pas bestaat als je hem al kent, bestaat niet.

Nu staat de inhoudsopgave op het scherm en niet de doos. Elf titels, aan te
tikken, en je komt binnen op het stuk dat je aanwees. Wat het kost is elf regels
op een scherm dat toch al scrollt; wat het oplevert is dat die stukken bestaan
voor wie er niet naar op zoek was.

Daarnaast staan er nu verwijzingen op de plek waar de vraag opkomt: bij de
slaapkaart naar het stuk over slaap, bij je traject naar het stuk over de trap,
en op Gezondheid, waar iemand met een aandoening binnenkomt, naast "Leren over
je aandoening".

### Eén regel code die het verschil maakt tussen werken en niet werken

Een uitklapper onthoudt per blok of jij hem open of dicht zette. Wie een stuk
ooit dichtklapte en daarna op een verwijzing ernaartoe tikt, zou het boekje open
krijgen met dat ene stuk dicht: je klikt, en er gebeurt zichtbaar niets. Een
verwijzing wint daarom van de onthouden stand, en alleen die kant op. De proef
op de gerenderde pagina zet die stand met opzet op dicht voordat hij klikt.

## 41. Dezelfde fout, een kaart lager

Bij §38 stond de fout in SCORE2: die rekende met één losse thuismeting, terwijl
de kaart eronder met zoveel woorden uitlegt dat één meting geen bloeddruk is. Bij
het rechtzetten daarvan bleek de kaart "Wat er veranderd is" hetzelfde te doen.
Die zette de eerste bloeddrukmeting naast de laatste en noemde het verschil.

Nu staat aan elk uiteinde het gemiddelde van de meetdagen binnen een week van
dat uiteinde. Dezelfde week als bij de thuisbloeddruk, en om dezelfde reden.

### Drie regels, en twee ervan zijn alleen op papier te zien

**Twee metingen op één dag zijn één dag.** Anders weegt een dag waarop je twee
keer mat dubbel mee. Dat gold al voor de middelomtrek en geldt nu voor alles.

**De twee vensters delen nooit een dag.** Bij een reeks die korter is dan twee
weken zou dezelfde dag aan beide kanten meetellen, en dan vergelijkt het
verschil een getal met zichzelf. Elke dag hoort bij het uiteinde waar hij het
dichtst bij ligt.

**Een dag die er precies tussenin ligt telt nergens mee.** Hij zegt over geen
van beide kanten iets. Hem bij één kant leggen zou die kant een halve reeks
geven.

**De labwaarden houden hun eigen regel.** Daar blijft het de eerste uitslag
tegen de laatste: twee bloedafnames van weken uit elkaar middelen zou twee
metingen op één hoop gooien die niets met elkaar te maken hebben.

Vier mutanten gedood, en de proef op de gerenderde pagina heeft er een meetdag
bij gekregen zodat de twee antwoorden uit elkaar liggen: met het venster staat
er -20, zonder -18. Was die dag er niet, dan zou de proef groen blijven met de
oude rekenwijze.

## 42. Wat de eerste md5-uitslag werkelijk was

De controle meldde zeven keer VERSCHILT. Drie daarvan zijn gedrag, vier alleen
commentaar, en dat onderscheid vertelt hoe het scheefgroeide.

**Twee keer een gedachtestreepje dat nooit is toegepast.** `kal_ww_klacht` zegt
in de database nog "Je accountnaam staat erin - dat raadt iemand meteen", met
het teken dat in september uit de hele repo is gehaald. Datzelfde geldt voor de
drie e-mailonderwerpen in `kal_coach_bouwen`. De opruiming liep over de
bestanden en niet over de database, en daar stond het dus nog op het scherm van
wie zich aanmeldt en in de post die de app verstuurt.

**Eén keer een bestand dat geschreven is en nooit gedraaid.** Bestand 42 voegt
`fiets_min` toe aan `kal_dagen_importeren`. De database kent dat veld daar niet,
dus een import uit een schermafdruk liet de fietsminuten vallen zonder iets te
zeggen.

**Vier keer alleen commentaar.** `kal_nevo_zoek`, `kal_zoeken`,
`kal_proef_koppeling` en `kal_gerecht` dragen in hun toelichting nog
gedachtestreepjes. Het gedrag is gelijk.

### En één verschil de andere kant op

`kal_gerecht` leest in de database `nevo_actief` en in bestand 01 `nevo_foods`.
Dat is de licentiepoort, en de database heeft gelijk: valt de licentie weg, dan
hoort niet het gerecht te verdwijnen maar de voedingswaarde erachter. Die regel
staat in vier andere bestanden opgeschreven en bij kal_gerecht in geen enkel.

`46-zeven-functies-gelijktrekken.sql` zet alle zeven op de tekst die in deze map
staat, met bij kal_gerecht de poort erin. Het bestand is niet overgetikt maar
uit de bestanden geknipt, en dat is te zien: van de zeven veranderde er maar één
md5, die van kal_gerecht. De andere zes zijn byte voor byte wat er al stond.

### Gedraaid op 21 september 2026

De controle meldt sindsdien **44 keer gelijk** en geen enkele keer VERSCHILT.
Daarmee is de belofte onder in `controle-md5.sql` voor het eerst waar: de
genummerde bestanden in deze map beschrijven wat er draait.

Wat er nog openstaat zijn de tien functies die in geen enkel bestand beschreven
zijn: `kal_sessie`, `kal_afmelden`, `kal_profiel_zetten`, `kal_dagstand`,
`kal_dag_zetten`, `kal_regels_toevoegen`, `kal_regel_wissen`, `kal_weekcijfers`,
`kal_prikkel_bouwen` en `kal_prikkel_gelogd`. Dat zijn de sessie, het profiel en
het wegschrijven van een dag: de bodem waar de hele app op staat. Ze zijn van
hieruit niet te schrijven, want hun tekst staat alleen in de database, en ze uit
het hoofd reconstrueren gebeurt niet: een verslag dat lijkt op wat er draait is
erger dan geen verslag, want het wordt geloofd.

## 43. De tweede helft van een belofte die maar half bestond

De app merkt een weging aan die niet bij de reeks past en gooit hem niet weg.
Dat is hoofdstuk 1 en het klopt: de app kan niet weten of er een tweede persoon
op de weegschaal stond of dat er een toets misging. Maar eronder stond "klopt
het niet, zet hem dan recht op de dag zelf", en dat betekende: zoek zelf uit
welke dag het was, blader erheen, typ het over.

Voor één weging gaat dat. Wie eerst een maand met de app heeft zitten spelen
voordat hij hem echt ging gebruiken, heeft er tien, en dan blijft er een reeks
staan met een 190 erin die de trend, het verbruik, de BMI en het eiwitdoel
scheeftrekt.

Het venster "Je wegingen" zet ze op een rij: elke dag waarop gewogen is, met de
opvallende bovenaan, elk getal in een vakje dat je kunt overschrijven, en een
knop om de weging weg te halen.

### Wat hier met opzet niet in zit

**Geen grens waarbuiten een weging vanzelf weggaat.** De verleiding is groot en
hij is verkeerd. Wie weet dat hij rond de 119 weegt kan zeggen "alles buiten 117
tot 121 is fout", en voor de reeks van vandaag klopt dat. Maar dit is een app om
af te vallen. Wie tien kilo kwijtraakt weegt straks 109, en dan gooit die grens
precies het resultaat weg dat de app moet meten. Een vaste band is hetzelfde als
het model vertellen wat eruit moet komen.

**Geen scherm dat doet alsof.** Na het weghalen blijft de regel staan tot de
database hem werkelijk kwijt is. Een scherm dat de regel meteen doorstreept
liegt op de dag dat het verzoek niet aankomt, en dan denkt iemand dat zijn 190
weg is terwijl hij in de trend blijft staan.

**Wel een weg terug.** Zolang het venster openstaat is een weggehaalde weging
met één tik terug te zetten, met de waarde die erin stond. Zonder dat is één
misgetikte rij een getal dat je nooit meer terugvindt.

De proef op de gerenderde pagina leest mee wat er naar de database gaat: dat
weghalen `gewicht_kg: null` stuurt, en op de dag van díe weging en niet op de
dag die bovenaan het scherm staat.

## 44. Zes vakjes in plaats van een uitrolmenu

De metingen op Gezondheid gingen via een uitrolmenu met één waardeveld ernaast.
Voor het geval waar het hier het vaakst om gaat is dat de verkeerde vorm: een
bloeddruk is twee getallen die bij elkaar horen, en die kostte zo twee keer
kiezen, twee keer typen en twee keer opslaan.

Nu staan er zes open vakjes met de naam erboven, in twee kolommen op een
telefoon en drie zodra het past. Eén knop bewaart alles wat je hebt ingevuld, en
hij zegt hoeveel dat er zijn. De datum staat ernaast en is te veranderen, want
een meting van gisteren invoeren was tot nu toe niet mogelijk.

Eén ding dat het scherm erbij zegt: vul je maar één van de twee bloeddrukken in,
dan telt die dag niet mee in het weekgemiddelde. Dat is geen blokkade maar een
mededeling; wie werkelijk maar één getal heeft mag het bewaren.

## 45. De kennisbank, en waarom hij niet Academie heet

De elf stukken stonden onderaan Profiel in een kaart over de herkomst van de
getallen. Ze staan nu bovenaan, als eerste kaart onder de schermkop, met de
inhoudsopgave zichtbaar en twee planken ernaast: je aandoening, en hoe deze app
rekent. Dertien regels, allemaal aan te tikken, en je komt binnen op het stuk
dat je aanwees.

De naam is Kennisbank en niet Academie, en dat is een keuze. Academie betekent
op dit portaal al iets: de drie cursussen van BennaHuiswerk, met hun eigen
tegels en hun eigen proef. Twee dingen op één portaal die allebei Academie heten
is een verwarring die je later niet meer uit de teksten krijgt.

## 46. Wat als: van kilo's naar een risico, en waarom dat twee stappen zijn

De vraag is oud en goed: wat levert het op als ik tien kilo kwijtraak. Het
eerlijke antwoord begint bij wat er niet kan.

**SCORE2 kent geen gewicht.** De invoer is leeftijd, geslacht, roken,
systolische bloeddruk, totaal cholesterol en HDL. Meer niet. "Wat wordt mijn
SCORE2 als ik afval" is dus niet rechtstreeks te berekenen, en een app die het
tóch in één getal geeft, verzint de weg ertussen.

Daarom staat die weg hier in twee stappen, en staan ze allebei op het scherm:

1. **Van kilo's naar je waarden.** Wat doet gewichtsverlies gemiddeld met je
   bloeddruk en je lipiden? Dat is gemeten, in meta-analyses.
2. **Van je waarden naar het risico.** Die geschatte waarden gaan door hetzelfde
   SCORE2 dat op het scherm staat, mét de omrekening van thuis naar spreekkamer
   uit §38.

Wie de eerste stap niet gelooft, ziet meteen waar hij niet in meegaat. Eén pijl
van kilo's naar een percentage zou verbergen dat er een aanname tussen zit.

### De effectmaten, en wat eraan mankeert

**Bloeddruk: ongeveer 1 mmHg systolisch per kilo.** Neter en anderen,
Hypertension 2003, vijfentwintig trials.

**Lipiden: per kilo ongeveer 0,05 mmol/L totaal cholesterol eraf en 0,009 mmol/L
HDL erbij.** Dattilo en Kris-Etherton, Am J Clin Nutr 1992. Die HDL-stijging
geldt bij een stabiel gewicht; tijdens het afvallen zelf daalt HDL in die
analyse juist licht, en dat staat op het scherm, want wie halverwege meet ziet
anders iets wat hij niet verwacht.

Geen van beide is tegen het artikel zelf nagelopen. Ze komen uit weergaven van
derden, net als de 7-2-2 bij de thuisbloeddruk voordat die werd nagelopen, en
dat staat er met zoveel woorden bij. De banden zijn daarom ruim genomen (0,5 tot
1,5 mmHg per kilo) en heten geen betrouwbaarheidsinterval, want dat zijn ze
niet.

### Drie dingen die deze motor begrenzen

**Elke uitkomst draagt zijn band.** Het risico wordt drie keer gerekend: met het
zwakste effect, het middelste en het sterkste. Daarbij wisselen de randen van
plaats, want het sterkste effect op de bloeddruk geeft het láágste risico. Wie
die twee verwisselt toont een band die de verkeerde kant op staat, en dat ziet
er precies zo geloofwaardig uit. Er staat een proef op.

**Geen gewonnen levensjaren.** Die stap vraagt aannames die veel verder gaan dan
waar deze app zich aan houdt. Wat er staat is wat SCORE2 leest, en dat gaat over
tien jaar en over hart en vaten.

**Het is een gemiddelde en geen voorspelling.** De helft van de mensen wijkt er
fors van af. Dat staat op de kaart, met een verwijzing naar het stuk over
responders in de kennisbank.

### De hartleeftijd

De leeftijd waarop iemand met ideale waarden hetzelfde tienjaarsrisico heeft als
jij. Meer is het niet: er hangt geen behandelgrens aan en het is geen
biologische leeftijd. Het is een manier om een percentage te zeggen waar mensen
wel iets bij voelen.

Wat hier ideaal heet is een keuze en staat erbij: niet roken, geen diabetes,
bovendruk 120, totaal cholesterol 5,0 en HDL 1,4. Die set komt uit de
Framingham-traditie van de heart age en niet uit de SCORE2-publicatie, die het
begrip niet kent. Een andere ideale set geeft een andere hartleeftijd.

Buiten 40 tot 69 zegt de app dat het ophoudt in plaats van de lijn door te
trekken. Daar geeft SCORE2 zelf niets meer terug, en een hartleeftijd van 78 zou
precies het getal zijn dat in een spreekkamer blijft hangen.

Zeven mutanten gedood. De sterkste proef is de omkering: wie precies de ideale
waarden heeft, krijgt zijn eigen leeftijd terug. Die gebruikt dezelfde functie in
twee richtingen en valt om zodra er aan één kant iets schuift.

## 47. Kleur die iets betekent

De wat-als-kaart stond er in cijfers: 1,9 procent nu, 1,1 procent straks, band
0,9 tot 1,4. Alles klopte en niemand zag het. Een percentage zegt weinig zonder
zijn grenzen, en juist die grenzen sturen een gesprek: dezelfde 6 procent heet
onder de vijftig matig en daarboven hoog.

Er staat nu een band onder. Drie zones in hun kleur, de twee grenzen met hun
getal, een open stip waar je nu staat en een dichte waar het scenario je brengt,
met de weg ertussen gestippeld en de marge als een lichtere balk eromheen.

### Drie regels, en ze zijn alle drie het verschil met een gekleurd plaatje

**De kleur is die van de richtlijn en niet die van deze app.** Groen, oranje en
rood staan voor laag, matig en hoog zoals NHG-CVRM ze noemt. De app kleurt niets
op eigen gezag; hij tekent de zones die de richtlijn al heeft.

**De grenzen komen uit één bron.** Ze stonden als vier getallen binnen `score2`,
en de band zou ze een tweede keer hebben gehad. Twee plekken met dezelfde
getallen lopen uit elkaar zonder dat iemand het ziet, en dan kleurt de band
oranje bij een uitkomst die de app "laag" noemt. Nu staat er één
`score2Grenzen(leeftijd)`, en een proef rekent een echte SCORE2 uit en houdt
zijn klasse ernaast.

**De schuif draagt de BMI-grenzen.** De baan loopt van je gewicht van nu naar
het uiterste, en de kleur zegt waar 30 en 25 liggen. Zonder lengte is er geen
BMI en blijft de baan grijs: een gekleurde baan zonder betekenis is erger dan
een grijze.

### Twee getallen die elkaar overschrijven zijn één onleesbaar getal

Bij een klein verschil staan de twee stippen vlak bij elkaar en schoven hun
percentages over elkaar heen. De stippen blijven staan waar ze horen, want die
dragen de betekenis; alleen de bijschriften wijken, elk de kant op waar hij toch
al stond, en geen van beide loopt de figuur uit.

Zes mutanten gedood, waaronder de twee die er het geloofwaardigst uitzien: een
grens die een punt verschuift, en twee bijschriften die allebei dezelfde kant op
wijken.

### Wat er uit de ProVita-simulator niet is overgenomen

Die kaart rekent met een eigen risicoscore van nul tot honderd, met punten per
factor. Hier ligt een echte SCORE2 met gepubliceerde coëfficiënten; een tweede,
eenvoudiger score ernaast zou twee antwoorden op dezelfde vraag geven. En de
uitroep ("word je vier jaar jonger!") blijft weg: er staat wat er staat, en of
dat goed nieuws is hoor je van je huisarts.

## 48. Het weegveld stond onderaan, en drie tekstniveaus die er twee bleken

Twee dingen die op dezelfde dag opvielen en allebei over leesbaarheid gaan.

### Het ene getal waar de app op rust, stond achter zes kaarten

De ochtendweging is de eerste handeling van de dag en het enige signaal in deze
app dat niet te schatten valt. Het invoervak stond onderaan het dagscherm, terwijl
de kop bovenaan "Stap op de weegschaal" zei. Je moest dus langs alles heen
scrollen om te doen wat er boven aan het scherm van je gevraagd werd.

Het veld staat nu in de hero, op de plek van het vlaggetje, als een witte pil
met een eigen vlak: hij ligt op een foto, en wat je intikt hoort leesbaar te
blijven welke foto er ook achter staat. Zodra er gewogen is verdwijnt het veld en
staat het getal er in plaats van het woord: `✓ 116,6 kg` en niet `✓ gewogen`.

De kaart onderaan blijft bestaan, om te corrigeren en om uit te leggen waarom dit
de kern is. Dat hoeft niet bovenaan.

**Er was geen enkel proefgeval waarin vandaag nog niet gewogen was.** Elke vorm
in de proefopstelling had die dag al een weging, dus de kop "Stap op de
weegschaal" en alles eromheen stonden in geen enkele afdruk. Dat geval heet nu
`niet-gewogen` en staat in de rij, en de proef houdt vast dat kop en handeling
bij elkaar staan: zegt de hero dat je moet wegen, dan staat het veld er ook, en
zegt hij dat niet, dan staat het er niet.

### Drie tekstniveaus die er in de praktijk twee waren

Een kaartkop stond in 0,78 rem grijs, de regel eronder in 0,84 en de toelichting
in 0,75. Op papier drie niveaus, op het scherm één lange labtekst waarin niets
begint of eindigt. Een scherm vol goede informatie motiveert dan niemand om te
lezen.

Wat er veranderd is:

**Alleen de eerste kop van een kaart groeit**, naar 0,97 rem, vet, in inktkleur,
met de wegwijzer ernaast in de accentkleur. Een tussenkop verderop in dezelfde
kaart ("Stap 1", "De rest van de kast") blijft klein, en juist daardoor is er nu
een rangorde in plaats van één vlak. De vier selectors dekken de twee vormen die
`Kaart` oplevert, met en zonder sfeermotief.

**Een regel in een lijst krijgt een echte titel.** `.rijkop` is 0,88 rem en
halfvet in inktkleur; de toelichting eronder blijft 0,75 in grijs. Die twee
stonden eerst op 0,84 en 0,75 en verschilden dus nauwelijks.

De contrastproef loopt nu over 1408 stukken tekst in zes tabbladen en twee
thema's, en alles haalt nog steeds 4,5.


## 49. De editor toont alleen de laatste vraag

Twee keer kwam er een andere tabel terug dan ik verwachtte, en twee keer heb ik
dat aan het plakken geweten. Het lag aan het bestand.

De SQL-editor van Supabase toont het resultaat van de **laatste** opdracht in
het venster. `uitlezen-functies.sql` had er twee, dus kwam alleen de tweede
terug en verdween de eerste zonder melding. De versie erna had tien losse
selects, en leverde alleen de tiende op.

Dat is precies het soort fout waar deze hele controle over gaat: niet iets dat
kapot is, maar iets dat stil weggelaten wordt. Beide bestanden zeggen het nu,
en `uitlezen-tien.sql` staat met opzet in één opdracht die tien rijen geeft.

### En de eerste van de tien staat op papier

`47-de-bodem-op-papier.sql` bevat `kal_prikkel_gelogd`, letterlijk zoals de
database hem kent. Dat het letterlijk is, is geen belofte maar een meting: de
md5 die uit dit bestand rolt is `713ef4d7`, en dat is exact wat de controle uit
`pg_proc` las. Eén afwijkende spatie in een regelcommentaar zou een ander getal
geven.

De negen die nog ontbreken staan in de kop van dat bestand, en de controle
blijft ze melden tot ze er zijn. Het gat is pas dicht als het dicht is.

## 50. Is je verbruik meegezakt?

Deze app zegt op elk scherm dat hij het verbruik **meet** en niet schat. Dat is
waar, en tot vandaag deed hij er niet het enige mee waar meten voor nodig is.

Een formule kent alleen lengte, gewicht, leeftijd en geslacht. Die zegt dus per
definitie dat je verbruik precies zoveel gezakt is als je lichter bent geworden.
De vraag of er méér gezakt is dan je gewicht verklaart, de vraag waar iedereen
die een plateau meemaakt mee zit, is met een formule niet te stellen. Met twee
metingen wel.

De rekenkern nam al een venster van achtentwintig dagen, en `eind` was er al een
argument. Er was dus niets nieuws nodig om hem een tweede keer te laten rekenen,
op het vroegste venster dat de reeks toelaat. Het verschil tussen die twee is
wat er nu op het Inzicht-scherm staat.

### Waarom een verschil schoner is dan de twee getallen zelf

Het gemeten verbruik is inname min de energie die het vet in of uit ging. De
inname komt uit een logboek, en een logboek zit ernaast: onderrapportage is de
regel en niet de uitzondering, en de app rekent dat verschil zelfs uit. Elk
niveau dat hier op het scherm staat draagt die fout mee.

In een verschil valt hij weg, zolang hij dezelfde blijft. Wie zijn boterham al
een jaar tweehonderd kcal te licht opschrijft, doet dat in beide vensters, en
tweehonderd min tweehonderd is nul. Dat is een prettige eigenschap en hij gaat
tegen de intuïtie in: het afgeleide getal is hier betrouwbaarder dan de twee
getallen waar het uit komt.

Precies nul is het alleen onder het model dat optelt. Onder het model dat
vermenigvuldigt blijft er een restje staan ter grootte van de fout maal het
stukje dat je lichter bent, bij driehonderd kcal en acht kilo eraf zo'n acht
kcal. Dat staat zo in de proef, met een grens erop, in plaats van dat ik de
bewering rond maak.

Wat er niet uit wegvalt is een fout die verándert. Wie sinds juni nauwkeuriger
weegt en logt, ziet zijn gemeten verbruik stijgen zonder dat er aan hem iets
veranderd is. Dat is de enige manier waarop dit getal er flink naast kan zitten
zonder dat iets het verraadt, en het staat daarom in de uitklap met de datum van
het vroege venster erbij: ben je sinds die dag anders gaan loggen, lees dit getal
dan niet.

### Twee verwachtingen, omdat er twee antwoorden zijn

Om te zeggen dat er méér gezakt is dan het gewicht verklaart, moet er staan wat
het gewicht dan verklaart. Daar bestaan twee verdedigbare antwoorden:

**Alles zakt mee.** Een lichter lichaam verbruikt minder in rust én minder bij
elke stap, want er is minder te dragen. Het hele verbruik schaalt dan met het
rustverbruik.

**Alleen de rust zakt.** Het rustverbruik daalt met de massa, maar wat je aan
beweging kwijt bent blijft in absolute zin gelijk.

Welke klopt is met de gegevens die deze app heeft niet uit te maken. De verleiding
is om er één te kiezen en het niet te noemen; dan staat er één getal en klinkt het
alsof de keuze niet bestaat. Nu staan ze er allebei, het scherm toont het bereik
ertussen, en een uitspraak komt er alleen als die onder béide modellen overeind
blijft.

### Wat de mutatieproef hierover leerde

Die strengheid leek eerst niets te doen. De versie die alleen naar het ene model
keek overleefde elke proef, en de reden bleek wiskundig: bij afvallen staan de
twee modellen altijd in dezelfde volgorde, dus is "de strengste van de twee"
vanzelf dat ene model. De mutant was niet fout, het geval dat hem zou betrappen
ontbrak.

Bij aankomen wisselen ze van plaats, en dan doet het er wel toe. Een reeks met
ruim acht kilo erbij in twaalf weken zet de afwijking onder het ene model net
buiten de band (−157 bij een band van 143) en onder het andere net erbinnen
(−136). Eén model kiezen levert daar "je verbruik is lager" op, en dat berust
dan op de modelkeuze en niet op de meting. Er staan nu twee proeven, één voor
elke kant, want de code toetst de twee kanten met twee verschillende velden en
een versie die er maar één goed doet kwam anders langs de ene proef heen.

### Een grens die `eind` al had moeten hebben

`analyse(dagen, profiel, eind)` knipte het venster af op `eind`, maar zocht het
referentiegewicht in de hele dagenkaart. Bij de gewone aanroep valt dat niet op,
want dan houdt de kaart bij vandaag op, en de veertig gouden waarden merkten er
dus niets van. Zodra er een venster van vroeger wordt nagerekend, rekende de
analyse van april zijn rustverbruik op de weging van augustus, en dat is precies
het verschil dat hier gemeten wordt.

De grens staat er nu, de gouden waarden bleven ongemoeid, en er staat een proef
bij die omvalt zodra hij weggaat. Die proef bewijst allebei de kanten: dat het
rustverbruik niet meeschuift met een latere weging, én dat de twee uitkomsten
werkelijk verschillen, zodat de eerste bewering ergens over gaat.

### Wat er met opzet niet staat

**Niet "metabole adaptatie".** Dat is één verklaring voor een verbruik dat verder
zakt dan het gewicht verklaart, en de app kan hem niet onderscheiden van minder
zijn gaan bewegen zonder het te merken, of van anders zijn gaan loggen. Het
bestand heet daarom `aanpassing.ts` en niet `adaptatie.ts`, en de uitklap noemt
de andere verklaringen bij naam.

**Geen kleur die zegt of het goed nieuws is.** Een lager verbruik is lastig voor
wie afvalt en gunstig voor wie wil aankomen, en de app weet niet aan welke kant
de lezer staat. De kleur zegt alleen of er iets staat: grijs zolang de nul in de
band valt, geaccentueerd zodra hij eruit ligt. Dat is een eigenschap van de
meting en geen oordeel over de lezer.

**Geen uitkomst uit één venster.** Twee vensters die elkaar raken zouden dezelfde
dagen aan beide kanten van het minteken zetten. Vandaar de eis van ruim vier
maanden reeks, en vandaar dat de kaart tot die tijd alleen zegt vanaf wanneer hij
iets te melden heeft. Dat is hier geen vormfout maar de hele zaak: leeg betekent
in deze app niet gemeten, en dat is iets anders dan niets aan de hand.

De maat om dit tegenaan te leggen staat in §2: in de Biggest Loser-follow-up
−275 ± 207 kcal per dag op week 30 en −499 ± 207 na zes jaar. Dat is een uiterste,
bij een extreem tempo en veertien deelnemers, en het staat hier als ordegrootte
en niet als verwachting. Bij de marges die een reeks van vier maanden oplevert,
rond de honderdvijftig tot tweehonderd kcal, is een verschil van die omvang
zichtbaar en een verschil van vijftig kcal niet. Dat is geen tekortkoming van de
meting maar de meting zelf, en het scherm zegt het met zoveel woorden: een
langere reeks maakt de marge smaller, een kortere nooit.

## 51. De app gaat naar testers, en daarmee verandert er iets aan wat hij is

Tot vandaag was dit een app van één mens met een gezin erbij. Wat er nu bij komt
is niet een functie maar een positie: er komen mensen in die ik niet ken, met
hun eigen gewicht, hun eigen bloeddruk en hun eigen labwaarden.

### De audit, en wat er werkelijk fout aan stond

Wat al goed stond: geen sleutel in de repo (ik heb erop gescand, en wat op een
sleutel lijkt zijn voorbeeldpatronen plus publieke anon-sleutels van het oude
project in het archief), bcrypt op kostenfactor 10 met een rem op het raden,
alle toegang via `SECURITY DEFINER` met een vastgezet `search_path`, een edge
function die zijn eigen sessietoken controleert in plaats van de client te
geloven, en per gebruiker een logboek met tokens en kosten.

Wat er fout aan stond was één ding, en het was groot: **`kal_registreren` stond
wagenwijd open.** Wie de URL had maakte een account en mocht meteen dertig
AI-aanroepen per uur doen op de Anthropic-sleutel van de eigenaar. Dat is geen
theoretisch lek maar de rekening van één mens.

Daarnaast: geen beheerscherm (de vlag bestond, de lijst niet), en geen
`robots.txt`, dus een besloten test die een zoekmachine kon indexeren.

### Waarom het budget in aanroepen staat en niet in euro

`kal_ai_log` heeft een kolom `kosten_usd`, dus een budget in euro lag voor de
hand. Maar die kolom wordt in de edge function uitgerekend met een vast
Sonnet-tarief, terwijl het model uit een instelling komt en dus een ander kan
zijn. Een grens leggen op een getal dat stilletjes de verkeerde prijs gebruikt,
is een grens die pas op de rekening zichtbaar wordt.

Aanroepen tellen klopt altijd. Het bedrag staat er wel bij op het beheerscherm,
met het voorbehoud erbij, en de proefopstelling toetst dat dat voorbehoud er
staat.

### Twee remmen, en waarom niet één

De maand begrenst wat het kost. Het uur begrenst wat een lek kan aanrichten
voordat iemand het merkt. Eén rem van duizend per maand laat een losgeslagen
script op één avond duizend aanroepen doen: binnen budget en toch fout.

Alleen geslaagde aanroepen tellen mee voor de maand. Wie zijn budget kwijtraakt
aan storingen aan mijn kant krijgt een rekening voor mijn fout. Voor de rem per
uur tellen ze wél mee, want daar gaat het niet om kosten maar om een hollende
aanroeper.

### Wat een slot is en wat een scherm is

Dit onderscheid staat in drie bestanden en het hoort er te staan.

De AI-poort is een slot. Hij ligt in `kal_ai_toegestaan`, de edge function roept
hem aan met de service-role-sleutel, en daar komt niemand omheen. Dat is de
poort die geld kost.

De afwijzing is een scherm. Wie is afgewezen krijgt in de app een bericht in
plaats van de app, maar wie de RPC's rechtstreeks aanroept komt nog steeds bij
zijn eigen gegevens. Dat is te verdedigen, want het zijn zijn eigen gegevens en
niet die van een ander, maar het is geen slot en het staat nergens als slot
beschreven. Een echt slot vraagt een regel in `kal_sessie`, en die functie is
één van de negen waarvan de brontekst nog niet in deze repo staat. Een functie
vervangen die je niet kunt nalezen, is hem overschrijven met een gok.

`robots.txt` is ook een scherm en zegt dat zelf.

### De truc met de standaardwaarde

Een kolom toevoegen vult alle bestaande rijen met de standaard. Zou die meteen
op `wacht` staan, dan stond het gezin buiten zijn eigen app; zou het budget
meteen op honderd staan, dan had de eigenaar sinds vandaag een limiet die hij
nooit gekozen heeft. Dus: erin met de ruime waarde, en daarna de standaard
verschuiven voor wie nog komt. Twee regels, en ze horen in deze volgorde.

### Geen antwoord is geen afwijzing

De app roept `kal_mijn_toegang` aan, en die functie bestaat pas nadat bestand 48
gedraaid is. Wie in de trein zit krijgt helemaal niets terug.

In allebei die gevallen blijft de app open. Een app die zichzelf dichtzet omdat
een RPC ontbreekt, zet zich dicht bij precies degene die er het minste aan kan
doen, en de echte grens staat toch in de edge function.

Maar een status die er wél is en die deze versie niet kent, telt níet als goed.
Dat lijkt hetzelfde en het is het tegenovergestelde: dat is geen ruis maar een
nieuwere database, en zo'n waarde stilletjes als toegelaten lezen is opnieuw de
fout die pas op de rekening zichtbaar wordt. Beide staan in
`src/health/toegang.proef.ts` en allebei met een mutant erop.

### Twee proeven die vacuüm langsgingen

Dit hoort erbij omdat het twee keer gebeurde in één dag.

De eerste: een mutant op `aanpassing.ts` gaf "overleeft" terwijl de bouw op die
mutant stilletjes was omgevallen. De proef draaide op de vorige `dist/`. Een
mutant die niet compileert is geen overlevende mutant maar een mislukte meting.

De tweede: de proefopstelling zocht de testerslijst met
`getByRole('heading', { name: 'Testers' })`, en `Kop` rendert een `div`. Nul
treffers bij de gewone gebruiker las daardoor als een geslaagde afwezigheid,
terwijl er in het geheel niets gezocht werd. Die proef bewees niets en zag er
groen uit, precies de soort proef waar hoofdstuk 26 van dit document over gaat.

### Wat er nog niet staat

Er is geen privacyverklaring in de app en geen weg om je gegevens te
verwijderen. Zolang het om de eigenaar en zijn gezin ging was dat te dragen;
bij testers die hun bloeddruk invoeren is het dat niet. De DPIA die er ligt is
geschreven voor één gebruiker. Dat is de volgende stap en het is er geen die je
in code oplost.
