# Kalibratie — verantwoording van de algoritmen

*Versie 1, 21 augustus 2026. Bij elke rekenregel in de app staat hier waar hij vandaan komt, hoe hard de onderbouwing is, en waar hij breekt. Waar een bron niet te openen was of niet bestaat, staat dat er expliciet bij. Er staan geen verzonnen referenties in dit document.*

---

## 1. Waarom de app meet in plaats van rekent

Elke bestaande app toont een caloriedoel dat uit een formule rolt. Dat getal oogt als een meting, met twee decimalen en zonder voorbehoud, terwijl het een gok is met een spreiding van vele honderden kilocalorieën. Wie er zijn dag op inricht en niets ziet gebeuren, concludeert dat er iets mis is met hém in plaats van met het getal.

Het gebruikelijke argument tegen formules is dat ze onnauwkeurig zijn. Het sterkere argument is dit: door te *meten* absorbeert het model de twee grootste onbekenden — adaptieve thermogenese en de individuele activiteitsfactor — automatisch, zonder ze te modelleren of zelfs maar te kennen. Mifflin-St Jeor "weet" niet dat iemand vijftien kilo is afgevallen en daardoor 250 kcal per dag onder de voorspelling zit. Een gemeten verbruik weet dat wel, want het meet precies dat.

De kern is één vergelijking, toegepast op een venster van 28 dagen:

```
TDEE = gemiddelde gelogde inname − (helling van de gewichtstrend × 7700 kcal/kg)
```

De rest van dit document gaat over wat elk van die drie termen waard is.

---

## 2. De 7.700 kcal per kilo

**Wat de app doet.** 7.700 kcal/kg (32,2 MJ/kg) wordt gebruikt als conversiefactor op de gemeten trend, nooit als voorspeller.

Dat onderscheid is het hele punt. Als voorspellende regel — "eet 500 kcal minder en je verliest blijvend een pond per week" — is de regel aantoonbaar fout: een statisch model negeert dat de ruststofwisseling daalt en de energiekost van bewegen met de massa meekrimpt, waardoor het gewichtsverlies in jaar één ruwweg met honderd procent wordt overschat (Hall KD et al., *Lancet* 2011;378:826–37, doi:10.1016/S0140-6736(11)60812-X; Thomas DM et al., *Int J Obes* 2013;37:1611–3, doi:10.1038/ijo.2013.51).

Als conversiefactor achteráf houdt de regel wél stand, en dat zeggen Hall en Chow zelf: het ernstige probleem is het statisch veronderstellen van de energiebalans, en "when ΔEB is accurately estimated over time, then the above equation provides a reasonable estimate of weight change" (*Int J Obes* 2013;37:1614, doi:10.1038/ijo.2013.112).

**Waarom de factor voor deze gebruiker gunstig uitpakt.** De vereiste energie per verloren kilo hangt af van de verhouding vet tot vetvrij weefsel, en die hangt weer af van de initiële vetmassa. Hall's analyse met de Forbes-relatie laat zien dat bij een initiële vetmassa boven ongeveer 30 kg de vereiste waarde de 7.700 kcal/kg benadert; bij slankere mensen overschat de regel het tekort (Hall KD, *Int J Obes* 2008;32:573–6, doi:10.1038/sj.ijo.0803720). Bij 120 kg en een BMI van 31 zit deze gebruiker ruim in dat gunstige regime.

**Waar het wél misgaat: de watertransiënt.** Glycogeen wordt opgeslagen met ongeveer 2,7 gram water per gram, bij een voorraad van rond de 500 gram. De effectieve energiedichtheid van glycogeen-met-water is daarmee ruwweg 1.100 kcal/kg — een factor zeven lager dan 7.700 (parameters uit de webappendix bij Hall 2011, NIDDK). Een eenmalige verschuiving van een kilo aan de start van een dieet, of na een refeed, of bij een verandering in koolhydraat- of natriuminname, vertaalt zich dus in een forse fout wanneer het venster over die overgang heen ligt.

Een rekensom met Hall's eigen parameters — mijn afleiding, geen gepubliceerd resultaat — maakt de orde van grootte concreet: bij een venster van 28 dagen met een echt tekort van 750 kcal per dag en een eenmalige waterverschuiving van 1,2 kg wordt het tekort met ongeveer 44 procent overschat, ofwel circa 330 kcal per dag te hoge TDEE. Bij acht weken halveert dat; bij twaalf weken is het ongeveer 110 kcal per dag.

**Wat de app daarmee doet.** De eerste zeven tot veertien dagen na een verandering in dieetsamenstelling worden gemarkeerd en tellen niet mee in het venster. Verder ligt het venster op 28 dagen, en dat is een compromis dat in §3 wordt onderbouwd.

---

## 3. De adaptieve schatting zelf

**De validatie die er is.** De onderliggende methode — energiebalans plus herhaalde gewichtsmetingen — is gevalideerd tegen doubly labelled water bij 140 deelnemers aan de CALERIE-studie, over twee jaar. De gemiddelde afwijking bleef binnen 40 kcal per dag; op individueel niveau was de RMSD 215 kcal per dag (Sanghvi A, Redman LM, Martin CK, Ravussin E, Hall KD, *Am J Clin Nutr* 2015;102:353–8, doi:10.3945/ajcn.115.111070). De bredere methodologie is beoordeeld door Ravelli & Schoeller (*Int J Obes* 2021;45:725–32, doi:10.1038/s41366-021-00738-0): accuraat tot binnen ongeveer 2 procent, met een precisie tussen 4 en 37 procent afhankelijk van methode en meetinterval.

**Wat er níet is.** Voor de commerciële implementaties (MacroFactor, RP) bestaat geen peer-reviewed validatie. MacroFactor publiceert een eigen analyse op 748 gebruikers met een mediane fout van circa 135 kcal per dag tegenover circa 335 voor een standaardformule. Bruikbaar als indicatie, niet als bewijs.

**Twee eerlijke beperkingen die in de app horen te staan.** Sanghvi valideerde een *verandering* in inname, niet een absolute TDEE — systematische fouten in de uitgangswaarde blijven staan. En belangrijker: deze app draait de vergelijking om en gebruikt *zelfgerapporteerde* inname als invoer. Alles wat de gebruiker te weinig logt, komt eruit als een te láge TDEE-schatting, en het algoritme kan dat niet onderscheiden van een echt laag metabolisme. De schatting is dus bruikbaar om doelen bij te sturen, niet als fysiologische maat, en zeker niet als bewijs voor of tegen een "traag metabolisme".

**De vensterlengte.** De literatuur geeft geen expliciete aanbeveling; Sanghvi's intervallen liepen over maanden. Wat de ondergrens bepaalt is de ruis. Bij een dag-tot-dagspreiding van rond de 0,8 kg en kleinste-kwadratenregressie over *n* dagelijkse metingen geldt SE(helling) = σ/√(n(n²−1)/12). Dat geeft ongeveer 410 kcal per dag bij veertien metingen, 145 bij achtentwintig, en 80 bij tweeënveertig. Omdat dagelijkse gewichten geautocorreleerd zijn, is dat nog een optimistische ondergrens.

**Daarom:** minimaal veertien dagen voordat er iets getoond wordt, achtentwintig als standaardvenster, en pas na drie tot vier weken wordt een getal als betrouwbaar gepresenteerd. Aanvullend een dekkingseis — minstens zeven wegingen en zeven bruikbare registratiedagen — en altijd een interval in beeld, nooit alleen een puntschatting.

**Het venster is een veelvoud van zeven dagen, en dat is geen detail.** Lichaamsgewicht kent een systematisch weekritme: hoogste waarden op zondag en maandag, dalend richting het weekeinde, met een amplitude van grofweg 0,5 tot 1 procent van het lichaamsgewicht (Orsama AL et al., *Obes Facts* 2014;7:36–47, doi:10.1159/000356147). Bij 120 kg is dat 0,6 tot 1,2 kg puur ritme. Een venster dat geen veelvoud van zeven is, laat dat ritme in de helling lekken, en dat is een fout van honderden kilocalorieën per dag.

---

## 4. Het filteren van de weegreeks

Tien imputatiestrategieën en meerdere berekeningsmethoden zijn vergeleken bij vijftig deelnemers met slimme weegschalen. De winnaars waren structural modeling met Kalman-smoothing en het exponentieel gewogen voortschrijdend gemiddelde, met een fout van 0,62 tot 0,64 procent — praktisch gelijk (Turicchi J et al., *JMIR Mhealth Uhealth* 2020;8:e17977, doi:10.2196/17977). Nevenbevinding: ontbrekende dagen kun je beter overslaan dan imputeren; de schatters blijven redelijk tot tachtig procent ontbrekende data.

**Wat de app doet.** Een EWMA met een halfwaardetijd van ongeveer zeven tot tien dagen (α ≈ 0,1) voor de getoonde trendlijn, en een gewone kleinste-kwadratenregressie over het venster voor de hélling — die laatste omdat je daar direct een standaardfout uit krijgt, en die standaardfout is precies wat het betrouwbaarheidsinterval op de TDEE voedt. Metingen die meer dan drie standaarddeviaties van de verwachte EWMA afwijken worden aangemerkt als mogelijke uitbijter, maar niet automatisch verwijderd: bij snelle koolhydraatwisselingen zijn sprongen van een tot twee kilo fysiologisch.

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

**Beperking die ik niet heb kunnen wegnemen:** voor mannen boven de vijftig heb ik geen bevredigende validatiecijfers gevonden — de relevante bronnen waren niet toegankelijk. Leeftijd zit in Mifflin alleen als lineaire term van −5 kcal per jaar, terwijl de werkelijke daling grotendeels via verlies van vetvrije massa loopt. Behandel de prior daarom als een startwaarde met ruime onzekerheid, niet als een getal met twee significante cijfers.

**De activiteitsfactor uit stappen is het zwakste onderdeel van de hele app, en dat staat er ook bij.** Een gevalideerde stappen-naar-PAL-conversie bestaat niet, voor zover ik heb kunnen vinden. Wat er wel is: tienduizend stappen per dag komt ruwweg overeen met 300 tot 400 kcal, afhankelijk van loopsnelheid en lichaamsgrootte (Tudor-Locke C, Bassett DR, *Sports Med* 2004;34:1–8) — een koppeling aan energieverbruik, niet aan PAL. En Westerterp waarschuwt onomwonden: "Adding accelerometer output to the equation as an independent variable, often does not explain any additional variation" (*Front Physiol* 2013;4:90, doi:10.3389/fphys.2013.00090).

De app gebruikt stappen daarom uitsluitend voor de startschatting vóórdat de gemeten TDEE beschikbaar is, en verder als kwalitatieve terugkoppeling. Zodra het model draait, is de stapdata voor de rekenkern overbodig — en dat is precies de kracht van de adaptieve aanpak.

---

## 6. Correctie op een aanname uit de oorspronkelijke opzet

De overdrachtsbrief stelde dat activiteitscalorieën uit Garmin en Apple "bij lage intensiteit systematisch 30–60% te hoog" zijn. **De foutmarge klopt; de richting niet.**

Geen enkel polsapparaat haalde een fout onder twintig procent in energieverbruik, met medianen van 27,4 procent (de beste) tot 92,6 procent (de slechtste), terwijl dezelfde apparaten de hartslag tot op 2 procent nauwkeurig meten (Shcherbina A et al., *J Pers Med* 2017;7:3, doi:10.3390/jpm7020003). Een recente levende meta-analyse van de Apple Watch vond een MAPE van 9,7 procent bij hardlopen tot 151,7 procent bij wandelen, en **geen consistente richting van de bias** (Lambe R et al., *npj Digit Med* 2026;9:63, doi:10.1038/s41746-025-02238-1). De grootste meta-analyse over alle apparaten vond voor *totaal* energieverbruik juist een significante **onder**schatting (O'Driscoll R et al., *Br J Sports Med* 2020;54:332–40, doi:10.1136/bjsports-2018-099643).

De juiste formulering, en die staat nu in de app: de fout in energieverbruik is groot — typisch twintig tot vijftig procent, bij wandelen extremer — en apparaat-, persoons- en activiteitsafhankelijk, maar niet systematisch in één richting. Dat is een sterker argument dan het oorspronkelijke: een bias in bekende richting zou je kunnen corrigeren; een grote fout in onbekende richting niet.

Actieve energie wordt daarom bewaard als volume-indicator en verschijnt nergens in de rekenkern. Voor deze gebruiker gaat het om 633 kcal per dag gemiddeld over zes maanden — genoeg om het hele tekort weg te eten als je het zou bijtellen.

---

## 7. Adaptieve thermogenese

Handhaving van een gewicht tien procent of meer onder het uitgangsgewicht ging gepaard met een daling van het totale energieverbruik van 6 ± 3 kcal per kilo vetvrije massa per dag, bovenop wat de veranderde samenstelling voorspelt (Leibel RL, Rosenbaum M, Hirsch J, *N Engl J Med* 1995;332:621–8, doi:10.1056/NEJM199503093321001). Bij circa 65 kg vetvrije massa is dat grofweg 400 kcal per dag. De reviewliteratuur komt uit op 100 tot 300 kcal per dag bij tien tot twintig procent gewichtsverlies, met grote individuele spreiding (Egan AM, Collins AL, *Proc Nutr Soc* 2021;81:199–212, doi:10.1017/S0029665121003669).

De extreme casus is de Biggest Loser-follow-up: metabole adaptatie van −275 ± 207 kcal per dag op week 30 en −499 ± 207 kcal per dag na zes jaar, ondanks 41 kg gewichtstoename (Fothergill E et al., *Obesity* 2016;24:1612–9, doi:10.1002/oby.21538). Die cijfers zijn niet representatief — extreme snelheid, extreme trainingsvolumes, veertien deelnemers — en er loopt wetenschappelijke discussie over de herinterpretatie ervan.

**Waarom dit voor de app juist rustgevend is.** Een app die het verbruik telkens opnieuw méét, hoeft adaptieve thermogenese niet te modelleren: die zit per definitie al in de meting. Wat wel volgt uit Hall's modelparameters (β_AT ≈ 0,14 met een tijdconstante van veertien dagen) is de minimale reactietijd van het systeem: na een verandering in inname duurt het twee tot zes weken voordat het verbruik zich heeft ingesteld. Een venster korter dan dat meet een transiënt, geen evenwicht.

En de klinische boodschap die de app uitspreekt: bij tien procent gewichtsverlies komt de gemeten TDEE 100 tot 300 kcal per dag lager uit dan een formule met het nieuwe gewicht voorspelt. Dat is een normale fysiologische bevinding, geen meetfout en geen falen.

---

## 8. Onderrapportage — de centrale aanname, herzien

De app rekent bewust in *gelogde* calorieën en gaat ervan uit dat een constante bias het advies niet ongeldig maakt. Die aanname houdt stand, maar met een belangrijke herformulering.

**Het bewijs vóór.** Black & Cole analyseerden zeven studies met herhaalde metingen, waarvan vier gevalideerd met doubly labelled water. De ratio inname/verbruik lag consistent onder 1,0 bij sommige personen en consistent boven 1,0 bij anderen; in twee jaarlange studies lag bij een kwart van de proefpersonen de ratio bij élke meting onder 1,35 × BMR. De titelconclusie is ondubbelzinnig: "Biased over- or under-reporting is characteristic of individuals whether over time or by different assessment methods" (*J Am Diet Assoc* 2001;101:70–80, doi:10.1016/S0002-8223(01)00018-9).

**De omvang.** Twintig tot dertig procent is een redelijke centrale schatting bij obesitas; het bereik over methoden loopt van tien tot vijfendertig procent. De vaak geciteerde 47 procent van Lichtman betreft tien geselecteerde dieet-resistente patiënten en is geen populatiegemiddelde (*N Engl J Med* 1992;327:1893–8, doi:10.1056/NEJM199212313272701). In de OPEN-studie onderrapporteerden mannen twaalf tot veertien procent bij 24-uursrecalls en eenendertig tot zesendertig procent bij voedselfrequentievragenlijsten (Subar AF et al., *Am J Epidemiol* 2003;158:1–13, doi:10.1093/aje/kwg092).

**De herformulering.** De bias is **proportioneel, niet additief** — modelleer `werkelijk ≈ gelogd / (1 − b)`, niet `gelogd + X`. En hij neemt mogelijk toe tijdens overgangen tussen niveaus van energieverbruik (Ambler C et al., *Int J Obes* 1998;22:354–62, doi:10.1038/sj.ijo.0800595) — precies bij de start van een dieet.

De veilige constructie, en die zit nu in de app: **gebruik gelogde calorieën voor verandering ten opzichte van de eigen basislijn, en kalibreer het absolute niveau op de gemeten gewichtscurve.** Het gewicht op de weegschaal is het enige onbevooroordeelde signaal in het systeem. Laat dat de logs corrigeren, niet andersom.

**Een correctie op wat vaak wordt aangenomen:** het beeld dat vooral vet en sauzen worden onderschat, wordt niet consistent bevestigd. Macdiarmid & Blundell vonden juist koolhydraten en met name suiker het sterkst onderschat, met eiwit accuraat of over-gerapporteerd (*Nutr Res Rev* 1998;11:231–53). Alcohol is de duidelijkste uitschieter: bevolkingsenquêtes dekken slechts dertig tot zestig procent van de verkoopcijfers (Esser MB et al., *J Stud Alcohol Drugs* 2022;83:134–44).

---

## 9. Eiwit — twee verschillende referentiegewichten

Dit is de belangrijkste inhoudelijke bevinding voor deze gebruiker, en het punt waar de app het meest afwijkt van de gangbare berekening.

PROT-AGE beveelt voor gezonde ouderen 1,0 tot 1,2 g/kg per dag aan, meer bij activiteit of ziekte (Bauer J et al., *J Am Med Dir Assoc* 2013;14:542–59, doi:10.1016/j.jamda.2013.05.021); ESPEN komt op vrijwel identieke getallen (Deutz NEP et al., *Clin Nutr* 2014;33:929–36, doi:10.1016/j.clnu.2014.04.007). **Beide documenten specificeren niet welk gewicht.** Dat is een bekende lacune.

De Amsterdamse groep heeft die geadresseerd: er bestaat geen enkele trial die de eiwitbehoefte bij obesitas direct heeft bepaald, en op grond van indirect bewijs is tijdens gewichtsverlies ten minste 1,2 g/kg nodig **met het gewicht gemaximeerd op BMI 30** (Weijs PJM, *Curr Opin Clin Nutr Metab Care* 2025;28:27–32, doi:10.1097/MCO.0000000000001087). De onderbouwing waarom actueel gewicht niet deugt: berekeningen op actueel gewicht, gecorrigeerd gewicht en vetvrije massa gaven klinisch relevante verschillen bij 78 tot 100 procent van de mensen met overgewicht of obesitas (Dekker IM et al., *Clin Nutr ESPEN* 2022;48:378–85, doi:10.1016/j.clnesp.2022.01.014).

```
referentiegewicht = min(actueel gewicht, 30 × lengte²)
eiwitdoel = 1,2 tot 1,5 g/kg referentiegewicht
```

Voor 1,96 m en 120 kg: plafond 115,2 kg, dus **138 tot 173 g per dag**. De drie benaderingen — gecorrigeerd gewicht, streefgewicht, en geschatte vetvrije massa — convergeren rond 135 tot 150 g. Dat is het operationele doel.

**Verdeling.** Gelijkmatige verdeling over drie maaltijden gaf een 25 procent hogere 24-uurs spiereiwitsynthese dan een scheve verdeling (Mamerow MM et al., *J Nutr* 2014;144:876–80, doi:10.3945/jn.113.185280 — let op: n=8, gemiddelde leeftijd 37, BMI 25,7; dit is niet de doelgroep). De dosis waarbij de synthese plateaut ligt bij ouderen op 0,40 ± 0,19 g/kg per maaltijd tegenover 0,24 ± 0,06 bij jongeren (Moore DR et al., *J Gerontol A* 2015;70:57–62, doi:10.1093/gerona/glu103 — retrospectieve heranalyse, brede intervallen).

Praktisch: drie tot vier maaltijden van 35 tot 45 g eiwit, met minstens drie uur ertussen, en het ontbijt bewaken — dat is de maaltijd waar de scheve verdeling vrijwel altijd ontstaat.

**Over de leucinedrempel ben ik terughoudender dan gebruikelijk.** Een systematische review vond wel een verband tussen leucinedosis en spiereiwitsynthese bij ouderen, maar kon **geen drempelwaarde vaststellen** en vond geen enkele plasma-leucinevariabele die de respons voorspelde (Wilkinson K et al., *Physiol Rep* 2023;11:e15775, doi:10.14814/phy2.15775). De app noemt het daarom een werkhypothese, geen afkappunt.

**Nierfunctie.** De aanbeveling geldt niet bij eGFR onder 30 zonder dialyse. Een uitgangs-eGFR hoort in de nulmeting.

---

## 10. Tempo van gewichtsverlies

Garthe randomiseerde 24 topsporters naar 0,7 versus 1,4 procent lichaamsgewicht per week, beide met vier krachttrainingen per week. Beide groepen verloren evenveel gewicht, maar de langzame groep wón vetvrije massa (+2,1 ± 0,4 procent) terwijl de snelle onveranderd bleef (−0,2 ± 0,7 procent), p < 0,01 (*Int J Sport Nutr Exerc Metab* 2011;21:97–104, doi:10.1123/ijsnem.21.2.97).

Dat mag niet één-op-één worden overgezet. Forbes toonde een omgekeerd curvilineair verband tussen initieel vetpercentage en het aandeel vetvrij weefsel in het verlies: bij obesitas is dat aandeel aanzienlijk kleiner (*Ann N Y Acad Sci* 2000;904:359–65, doi:10.1111/j.1749-6632.2000.tb06482.x). Iemand met dertig procent vetmassa heeft dus meer buffer dan Garthe's sporters.

**De app hanteert 0,5 tot 1,0 procent lichaamsgewicht per week met 0,7 procent als richtwaarde, herberekend op het actuele gewicht.** Bij 120 kg is dat 0,84 kg per week; bij 100 kg nog 0,70. Van 120 naar 100 kg duurt daarmee ongeveer zesentwintig weken — een half jaar. Dat getal staat vanaf dag één in beeld, omdat de verwachting van sneller verlies de belangrijkste reden is om af te haken.

Boven 1,0 procent per week waarschuwt de app dat het advies **méér** eten is, niet minder. En het tempo alleen is niet het werkzame bestanddeel: Garthe's langzame groep tráinde vier keer per week.

*Wat ik niet heb kunnen vinden: een studie die het omslagpunt in procent per week direct heeft vastgesteld bij mensen met obesitas. De band van 0,5 tot 1,0 procent is een synthese van Garthe en Forbes, geen rechtstreeks gevalideerd afkappunt.*

---

## 11. Herkenning uit tekst en foto

**Wat de nauwkeurigheid werkelijk is.** Op 52 gestandaardiseerde voedselfoto's haalden GPT-4o en Claude 3.5 Sonnet een MAPE van 36,3 respectievelijk 37,3 procent voor gewicht en 35,8 procent voor energie, met correlaties van 0,65 tot 0,81. Alle modellen vertoonden **systematische onderschatting die toenam met de portiegrootte**, met bias-hellingen van −0,23 tot −0,50 (Fridolfsson J et al., *Curr Dev Nutr* 2025;9:107556, doi:10.1016/j.cdnut.2025.107556). Het model maakt dus dezelfde proportionele fout als de mens, in dezelfde richting: een foto-app corrigeert de bias van zelfrapportage niet, hij reproduceert hem.

**Wat wél helpt, en dat is kwantitatief onderbouwd.** Het toevoegen van fysieke schaalinformatie verlaagde de MAPE van 56,6 naar 39,5 procent; met het werkelijke voedselgewicht erbij zakte hij naar 20,2 procent (Mu Y, Sun J, He J, *ACM BCB* 2025;2025:65, doi:10.1145/3765612.3767255). En koppeling aan een gezaghebbende voedingsmiddelendatabase gaf een MAE-reductie van 63 procent (Yan R et al., *Commun Med* 2025;5:458, doi:10.1038/s43856-025-01159-0).

**Hoe de app dat vertaalt.** In vier stappen: het model benoemt de onderdelen en schat een portiebereik; de server zoekt kandidaten in NEVO; het model kiest de best passende tabelregel; de server rékent met de tabelwaarde, niet met het geheugen van het model. Het model doet alleen wat het kan — herkennen en portioneren.

Daarbovenop drie harde regels in de code:

1. **Een minimale intervalbreedte per bron**: ±35 procent voor een foto, ±25 procent voor een beschreven portie, ±8 procent voor een gewogen portie. Een model dat "200 tot 210 gram" zegt over een gefotografeerd bord beweert een nauwkeurigheid die uit geen enkele validatiestudie volgt.
2. **Asymmetrische intervallen**, met de bovengrens ruimer dan de ondergrens, vanwege de gedocumenteerde onderschatting van grote porties.
3. **Niets valt uit het totaal.** Wordt een onderdeel niet in NEVO gevonden, dan rekent de app met de eigen schatting van het model, zakt de regel naar graad D, en staat de reden erbij. Een stilzwijgend verdwenen maaltijd is gevaarlijker dan een ruwe schatting die zichzelf D noemt — in de eerste test verdween zo een hele tajine, ruim achthonderd kilocalorieën, uit de dagtelling.

**De zwakste schakel bleek het zoeken, niet het schatten.** De tweede stap — de server zoekt kandidaten in NEVO — was aanvankelijk één `LIKE` op de hele zoekterm. Op NEVO-namen werkt dat niet, want die staan in telegramstijl met het onderscheidende woord achteraan: *Kaas Goudse 48+ gem*, *Melk halfvolle*, *Ei kippen- gekookt gem*. Gemeten gedrag van die eerste opzet: "bruin brood", "magere kwark" en "gekookte couscous" gaven nul treffers, "goudse kaas" gaf alleen de plantaardige imitaties, en "ei" gaf Madeira, Meringue, Marsepein, Aardbeien en Prei — allemaal namen waarin de letterreeks e-i voorkomt. Het gevolg was niet zichtbaar als fout: het model kreeg onbruikbare kandidaten voorgelegd, koos daaruit terecht niets, en een gekookt ei kreeg een eigen schatting terwijl NEVO het gewoon kent (code 84, 128 kcal per 100 g).

Het zoeken is daarom verplaatst naar de database, naar één functie die ook het zoekveld van de app bedient — anders kan de gebruiker een product opzoeken dat de herkenning even later niet vindt. Die functie knipt de vraag in woorden en eist dat elk woord terugkomt, waarbij de strengheid meeschaalt met de woordlengte: twee letters tellen alleen als heel woord, drie tot vier aan het begin van een woord, vijf of meer overal. Een sluitende -e gaat eraf, zodat "gekookte couscous" ook *Couscous gekookt* vindt. Bereidingswoorden zijn bewust géén stopwoorden, want in NEVO is juist dat het onderscheid dat er het meest toe doet: gekookte couscous heeft ongeveer een derde van de energiedichtheid van droge. En bij een gedeeltelijke treffer wegen woorden naar hun zeldzaamheid in de tabel — inverse document frequency, de standaardmaat uit het zoekvak — omdat "melk" in 135 namen voorkomt en "cappuccino" in drie.

Eén ding kan een rangschikking principieel niet: weten welk woord in "cappuccino met halfvolle melk" het hoofdwoord is. Twee rake woorden wegen daar altijd zwaarder dan één, en dus won *Melk halfvolle* van *Koffie cappuccino vers bereid*. Twee kopjes werden zo 330 kcal in plaats van ongeveer honderd, en 21 gram eiwit in plaats van vijf. De oplossing is niet een slimmere rangschikking maar een scheiding van taken: de zoekstap haalt ruim op — de volledige zoekterm én het hoofdwoord apart, samengevoegd tot één lijst — en het model kiest daaruit. Ophalen is een kwestie van niets missen, kiezen is een kwestie van begrijpen; die twee horen niet in dezelfde functie. Daarnaast is het model geïnstrueerd dat de zoekterm het product is en niet de omschrijving ervan: een cappuccino zoek je op als "cappuccino", niet als "cappuccino halfvolle melk".

Dat dit gevonden is, komt niet door de code te lezen maar door hem te draaien. Alle vier de fouten in dit hoofdstuk — de verdwenen tajine, de verdubbelde olie, de halve cappuccino en de melk die de koffie verdrong — zijn zichtbaar geworden door de herkenning op gewone Nederlandse ontbijtzinnen los te laten en de uitkomst met de tabel na te rekenen.

**Waar de app het slechtst is, en dat is ongemakkelijk.** Onder gecontroleerde condities haalden zowel diëtisten als de beste modellen praktische nauwkeurigheid voor energie en koolhydraten, maar was de nauwkeurigheid voor **eiwit en vet significant lager**, met een systematische overschatting van vet bij alle AI-modellen (Isobe T et al., *Nutrients* 2026;18:966, doi:10.3390/nu18060966). Een foto-app is dus het onbetrouwbaarst voor precies de voedingsstof waarop hier gestuurd wordt.

En: voor samengestelde Marokkaanse gerechten bestaat **geen validatiedata**. De fout is daar vrijwel zeker groter, omdat juist samengestelde gerechten met onzichtbare vetten het slechtst worden geschat. Vandaar dat het bereidingsvet een apart veld is dat het model verplicht moet invullen en dat altijd als onzekerheid wordt gemeld.

**De praktische conclusie die de app uitspreekt:** een keukenweegschaal voor de drie meest gegeten basisproducten — olijfolie, couscous, brood — levert meer nauwkeurigheidswinst op dan welke modelverbetering dan ook.

---

## 12. De gerechtenbibliotheek en de huishoudmaten

Naast NEVO staat er in dezelfde database een tweede soort kennis, die niet over losse producten gaat maar over gerechten: zesentwintig samengestelde gerechten uit de Marokkaanse en Turkse keuken, met tweehonderdvijfenzeventig ingrediëntregels, waarvan er zesentachtig door een diëtist zijn bevestigd. Vijfentwintig ervan zijn hier zichtbaar; de zesentwintigste is de persoonlijke variant van een patiënt in provita-care en die hoort in deze app niet thuis. Zesendertig van die regels zijn bereidingsvet, elk met een vetsoort en een opnamefractie. Daarnaast zesenvijftig porties met bandbreedte, en vijfendertig huishoudmaten verdeeld over de zevenentwintig NEVO-groepen.

Die kennis lag er en werd niet gebruikt. De app kon een tajine wel vínden — het zoekveld toonde hem — maar er zat geen knop op, dus loggen ging alsnog via de herkenning uit tekst, die hetzelfde gerecht opnieuw moest ontleden en het bereidingsvet blind moest schatten.

**Hoe een portie wordt doorgerekend.** Per ingrediënt: grammen maal de NEVO-waarde per honderd gram. Bereidingsvet telt mee naar zijn opnamefractie — bij een tajine is dat alles, bij frituren een deel. Dat levert een energiedichtheid voor het gerecht op, en die gaat maal de portiegrootte.

Niet andersom, en dat is een keuze die uitleg verdient. De voor de hand liggende weg is een portie te behandelen als een deel van het recept: zes porties, dus een zesde per persoon. Die weg klopt niet. Harira staat op zes porties en weegt bijna vier kilo, maar een kom harira is driehonderd gram en geen zeshonderdvierentwintig; een kom is nu eenmaal geen zesde van de pan, want er wordt brood bij gegeten. Bij msemen valt het wél samen: acht stuks van honderdvijfentwintig gram op duizend gram deeg. De dichtheid is het enige dat over beide gevallen klopt.

**Wat deze rekenwijze niet weet.** De dichtheid staat op het gewicht zoals de ingrediënten de pan in gaan. Wat indampt verdwijnt uit het gerecht maar niet uit die noemer, dus voor een gerecht dat lang stooft valt de uitkomst aan de lage kant. Hoeveel precies is niet bekend en wordt daarom niet verzonnen; het staat als onzekerheid bij elke regel die uit de bibliotheek komt. De orde van grootte is af te lezen aan de gerechten waar het recept zelf een deel van de schaal benoemt: bij de kiptajine ligt de portieschatting elf procent boven het ruwe gewicht gedeeld door vier, bij de couscous zesentwintig procent eronder, bij msemen precies gelijk. De afwijkingen gaan dus beide kanten op en blijven binnen de bandbreedte van de portie zelf, die ongeveer ±25 procent is.

**Optionele ingrediënten zijn een vraag, geen onzekerheid.** In vier van de vijfentwintig gerechten staat een ingrediënt als optioneel: het lamsvlees in de harira, de sucuk in kuru fasulye, de ui in menemen, de harissa in de kefta-tajine. De eerste opzet liet die meelopen in de bovengrens. Dat leverde voor een kom harira 124 tot 227 kilocalorieën op — een band van tachtig procent die niets over de portie zegt en alles over een vraag die de gebruiker gewoon kan beantwoorden. Het staat nu als aanvinkhokje in het venster: zonder lamsvlees 155 kcal, met lamsvlees 179, en de band blijft in beide gevallen over de portie gaan.

**De graad.** Een gerecht uit de bibliotheek krijgt C wanneer het gevalideerd is en al zijn ingrediënten een tabelwaarde hebben, en anders D. Dat is één trede beter dan wat de herkenning uit tekst of foto van hetzelfde gerecht maakt, en het verschil zit niet in de portie — die blijft een schatting — maar in het bereidingsvet en de samenstelling. Die zijn hier per gerecht uitgezocht in plaats van per keer geschat.

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

Drie waarschuwingen die in de app staan. De NHG-tabellen werken met non-HDL-cholesterol terwijl het model TC en HDL apart gebruikt — bij gelijk non-HDL kunnen die uiteenlopen. SCORE2 onderschat in Nederland: een observed/predicted-ratio van 1,3 bij mannen, oplopend tot 1,5 à 1,6 bij lage sociaaleconomische status en 1,9 bij Surinaamse afkomst (Kist JM et al., *EClinicalMedicine* 2023;57:101862, doi:10.1016/j.eclinm.2023.101862) — etniciteit en SES zitten niet in het model. En de C-index is 0,65 tot 0,72: dit is een gespreksinstrument, geen individuele voorspelling.

**SCORE2-OP is bewust niet geïmplementeerd.** De coëfficiëntenset die ik vond reproduceert het gepubliceerde voorbeeld niet. Voor deze gebruiker niet relevant; voor de app een openstaand punt.

### MASLD en FIB-4

```
FIB-4 = (leeftijd × ASAT) / (trombocyten[10⁹/L] × √ALAT)
```

Afkapwaarden volgens de **Richtlijn MASLD/MASH (NVMDL, 4 april 2024)**, waaraan het NHG deelnam: onder 65 jaar sluit FIB-4 < 1,3 fibrose praktisch uit; boven 65 jaar geldt < 2,0. Tussen die grens en 2,67 volgt een tweede test (VCTE of ELF); boven 2,67 verwijzing naar de MDL. De leeftijdscorrectie is onderbouwd: bij 65-plussers zakt de specificiteit van de afkap 1,3 naar 35 procent, en herstelt bij afkap 2,0 naar 70 procent bij een sensitiviteit van 77 procent (McPherson S et al., *Am J Gastroenterol* 2017;112:740–51, doi:10.1038/ajg.2016.453).

MASLD zelf vraagt steatose plus minstens één cardiometabool criterium (Rinella ME et al., *Hepatology* 2023;78:1966–86, doi:10.1097/HEP.0000000000000520). Bij BMI 31 is het adipositascriterium al vervuld. De app stelt geen diagnose — steatose moet met beeldvorming zijn aangetoond — en positioneert FIB-4 uitdrukkelijk als triagesignaal.

### STOP-BANG

De acht items met de officiële afkapwaarden: luid snurken, vermoeidheid overdag, waargenomen apneu, hypertensie, BMI **boven 35** (niet 30), leeftijd boven 50, nekomtrek ≥ 43 cm bij mannen en ≥ 41 cm bij vrouwen, en mannelijk geslacht. Laag risico 0–2, matig 3–4, hoog 5–8, met de verfijningsregels voor de matige groep (Chung F et al., *Anesthesiology* 2008;108:812–21, doi:10.1097/ALN.0b013e31816d83e4; Chung F, Abdullah HR, Liao P, *Chest* 2016;149:631–8, doi:10.1378/chest.15-0903).

Bij score ≥ 3 is de sensitiviteit voor matig-ernstig OSA 94 procent in slaapklinieken, maar de **specificiteit slechts 34 procent** (Nagappa M et al., *PLOS One* 2015;10:e0143697, doi:10.1371/journal.pone.0143697). Voor deze gebruiker betekent dat: man boven de vijftig levert al twee punten op zonder één klacht. De app zegt dat er expliciet bij — in een populatie van vijftigplusmannen met obesitas is bijna iedereen "matig risico", en dat is informatie over de vragenlijst, niet over de persoon.

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

Twee eerlijke kanttekeningen. De randomisatie betrof het *programma*, niet het wegen zelf — dagelijks wegen zónder actieregel heeft veel zwakker bewijs. En de internet-arm presteerde nauwelijks beter dan de controlegroep: een app die alleen digitaal is, repliceert de zwakste arm. Onderhoudsinterventies halen gemiddeld geen significant effect (Flore G et al., *Nutrients* 2022;14:1259, doi:10.3390/nu14061259); ongeveer een kwart houdt het resultaat langdurig vast. De app zegt dat plafond hardop.

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
- Een gevalideerde leucinedrempel bij ouderen: bestaat niet — Wilkinson 2023 vond die expliciet níet.
- Een direct vastgesteld omslagpunt in procent per week bij obesitas: bestaat niet.
- Validatiedata voor foto-gebaseerde schatting van Marokkaanse samengestelde gerechten: bestaat niet.
- De coëfficiënten van SCORE2-OP: gevonden maar niet reproduceerbaar; daarom niet geïmplementeerd.

---

## 15. Wat dit alles betekent voor de eerste weken

De zwakste schakel is niet de wiskunde maar de invoer. Elke foutbron die hierboven gekwantificeerd is — de watertransiënt van enkele honderden kilocalorieën in ongunstige gevallen, de weegruis van circa 145 kcal per dag bij achtentwintig metingen — valt in het niet bij systematische onderrapportage van twintig tot dertig procent.

Daarom zijn dit de vier dingen die de app actief blijft vragen, op volgorde van hoeveel ze opleveren:

1. **Elke ochtend wegen.** Zonder die reeks is het model inert; het is de enige invoer die niet te schatten valt en het enige onbevooroordeelde signaal in het systeem.
2. **De olijfolie in de saladebereiding één keer wegen.** Het verschil tussen veertig en zeventig gram is 265 kcal, elke dag.
3. **Meten wat de machine per cappuccino schenkt.** Bij vier à vijf op een werkdag de grootste onzichtbare post.
4. **Gaten dichten met een ruwe schatting.** Een D-waarde verbreedt het interval minder dan een ontbrekende dag dat doet.

En twee getallen die permanent in beeld horen te staan, niet alleen in de code: het betrouwbaarheidsinterval op de verbruiksschatting, en de mededeling dat het systeem ongeveer twee weken achterloopt. Beide voorkomen dat ruis wordt gelezen als falen.

---

## 16. Eigen maaltijden — één gerecht, zeven producten, één regel

Dit hoofdstuk is later toegevoegd dan de rest, en om een reden die niet in de literatuur staat maar in de praktijk: *"ik vind het moeilijk invoeren van mijn favoriete maaltijden."* Een tonijnsalade is één ding om te eten en zeven dingen om op te zoeken, en wie hem wekelijks logt zoekt hem wekelijks opnieuw op — met wekelijks een net iets ander antwoord.

Dat is geen ongemak maar een meetfout, en wel de duurste soort. De app leidt het verbruik af uit de hélling van gelogde inname tegen gewicht (§3). Ruis in de invoer die niets met de werkelijke inname te maken heeft gaat rechtstreeks de standaardfout van die helling in, en verbreedt dus het interval waarbinnen het model iets durft te zeggen. Dezelfde salade twee keer verschillend invoeren kost meetbaar zekerheid.

De oplossing is de gewone: zoek het één keer uit, bewaar het, log het daarna als één regel. Drie keuzes daarin zijn niet vanzelfsprekend.

**Eén regel en niet zeven.** De onderdelen blijven in het recept staan en de gelogde regel wijst er met `recept_id` naar terug, maar in het dagoverzicht is een salade één salade. Dat is niet alleen netjes: de coach (§ AUTOMATISERING) stelt voor uit wat je eerder at, en met losse onderdelen stelt hij "olijfolie, veertig gram" voor als tussendoortje. Een voorstel dat niemand eet is erger dan geen voorstel.

**De band telt op zijn breedst op.** Laag bij laag, hoog bij hoog — de aanname dat alle fouten dezelfde kant op wijzen. Statistisch is dat te ruim: bij onafhankelijke fouten hoort de wortel uit de kwadratensom, en die is smaller. Hier is te ruim precies goed. De fouten in een recept zijn aantoonbaar níét onafhankelijk — wie ruim opschept doet dat met alles tegelijk — en bovenal geldt in deze app dat onzekerheid nooit in je voordeel pleit. Een smallere band zou een nauwkeurigheid claimen die uit een optelling van zeven schattingen niet te halen valt.

**De graad is de slechtste van de onderdelen, niet het gemiddelde.** Zes gewogen ingrediënten en één geschat scheutje olie maken samen een geschatte maaltijd. Middelen zou dat scheutje wegpoetsen, en juist dat scheutje is bij deze gebruiker de grootste post van de dag (§8, en de vier prioriteiten in §15).

**Delen door porties kost een trede.** Wat je afgewogen in de pan doet is A; wat je daarna over twee borden verdeelt is dat niet meer, want die twee borden zijn niet gelijk. A zakt daarom naar B zodra er verdeeld wordt. Lager dan B zakt hij niet: het verdelen voegt onzekerheid toe, het wist niet wat er al bekend was. De aanname staat bovendien uitgeschreven in de regel zelf — "1 van 2 porties, niet apart gewogen" — en niet in de kleine lettertjes, conform de regel die de hele app draagt.

### De band komt uit grammen, niet uit een percentage

De twee maaltijden die bij de oplevering al klaarstonden (`health/database/08-de-twee-favorieten.sql`) zijn zo opgebouwd dat er geen enkele calorie is ingetypt. Er staan grammen, en die worden vermenigvuldigd met wat NEVO per honderd gram zegt. De ondergrens en de bovengrens komen op dezelfde manier tot stand: uit een ondergrens en een bovengrens in gráms.

Dat is het eerlijke model van deze onzekerheid. De tabelwaarde van tomaat is niet onzeker; het aantal tomaten is dat. "Drie middelgrote tomaten" is alles tussen 280 en 440 gram, en dat verschil hoort in de band te staan en niet in een percentage dat iemand gekozen heeft omdat het redelijk voelde.

De olijfolie is waarom dit zo moet. Zijn ondergrens staat op 30 en zijn bovengrens op 70 gram — een verschil van 360 kcal in de kom — en zijn graad op D. Omdat de maaltijd de slechtste graad van zijn onderdelen erft, is de hele salade D zolang die olie niet gewogen is. Dat is geen defect van de weergave maar de boodschap zelf: één keer wegen maakt van deze maaltijd een B en haalt de breedste band van de dag weg. Het is dezelfde aansporing als prioriteit 2 in §15, maar nu op de plek waar hij ertoe doet — op het moment dat je logt, en niet in een lijstje achteraf.

### Wat dit niet is

Geen nieuwe schatting. Er komt hier geen enkel getal bij dat niet al ergens vandaan kwam; alles is wat je ooit hebt ingevoerd, maal een factor. En geen vervanging van de gerechtenbibliotheek (§12): die bevat gevalideerde gerechten met portiematen voor iedereen, dit zijn de jouwe.

### Wat een maaltijd betekent, en de twee knoppen

Bij de oplevering stond er alleen wat erin zat. Wat het bétekent is een andere vraag, en bij deze gebruiker is het de hele vraag: 752 kcal zegt niets zonder te weten waar die kilocalorieën vandaan komen.

Drie maten staan daarom bij elk gerecht, alle drie verhoudingen en dus onafhankelijk van hoeveel je opschept — een halve portie van een schaal met vier gram eiwit per honderd kilocalorieën heeft nog steeds vier gram eiwit per honderd kilocalorieën.

- **Energiedichtheid** (kcal per gram). Onder de 1,0 vult het meer dan het aantelt; boven de 2,0 andersom. De tonijnsalade zit op 0,96 en het halve stokbrood op 2,25 — bijna dezelfde energie, minder dan de helft van het volume.
- **Gram eiwit per 100 kcal.** Dit is de maat die telt bij een tekort (§9). De salade komt op 4,0, en dat is de bevinding uit §8 nu zichtbaar op gerechtniveau: qua groente uitstekend, qua eiwit een lege huls.
- **De energieprocenten**, die expres niet optellen tot honderd. Ze worden berekend uit macro's die per onderdeel op één decimaal zijn afgerond, en vezels leveren zelf ook nog ongeveer twee kilocalorieën per gram. Normaliseren zou het beeld netter maken en de afwijking verbergen; die afwijking is informatie over hoe grof de invoer is.

Daaronder staan twee hefbomen, en die worden afgeleid en niet ingetypt: **halveer wat de meeste energie levert** en **verdubbel wat de hoogste eiwitdichtheid heeft**. De eerste geldt alleen bij een onderdeel dat ten minste een kwart van de energie levert — daaronder is halveren een gebaar. De tweede geldt alleen bij een onderdeel boven het eiwitgemiddelde van de maaltijd, en dat is geen vuistregel maar een identiteit: verdubbelen van iets boven het gemiddelde trekt het gemiddelde per definitie omhoog. Ligt niets erboven, dan valt er niets te verdubbelen dat iets oplevert, en zwijgt de app.

Voor de tonijnsalade komen die twee uit op de olijfolie (48 procent van de energie) en de tonijn. De vier uitkomsten naast elkaar:

| | per portie | eiwit per 100 kcal |
|---|---|---|
| zoals je hem maakt | 376 kcal | 4,0 g |
| olijfolie halveren | 286 kcal | 5,3 g |
| tonijn verdubbelen | 431 kcal | 6,4 g |
| allebei | 341 kcal | 8,1 g |

De laatste rij is het hele punt in twee getallen: voor 35 kcal mínder dan nu het dubbele aan eiwit per calorie. Er staat expres geen aanbeveling bij. Een tabel blijft kloppen als je voorkeuren veranderen; een aanbeveling niet.

### Vindbaar, en het sterretje

Twee dingen die pas opvielen bij gebruik. Wie "tonijn" typte kreeg de tonijnregels van NEVO en niet zijn eigen salade — de app had het antwoord al en liet het niet zien. `kal_zoeken` doorzoekt nu ook de eigen maaltijden, en dan niet alleen op de titel maar ook op de namen van de onderdelen: "paprika" vindt zo het gerecht waar paprika in zit zonder dat dat woord in de naam staat. Dat is precies waar een samengesteld gerecht zich anders gedraagt dan een product.

Het sterretje bepaalt de volgorde, in de lijst en in het zoekveld. Handmatig, en niet afgeleid uit hoe vaak iets gegeten is: die afleiding straft precies het gerecht af dat je nét bewaard hebt. Bij opnieuw bewaren onder dezelfde naam blijft het staan — anders verlies je het op het moment dat je de olie eindelijk gewogen hebt, en dat is nu juist het moment waarop je het gerecht het meest gebruikt.
