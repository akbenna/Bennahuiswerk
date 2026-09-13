# Het getal dat we uitrekenen en het getal dat we kunnen meten

*Over energiebalans, onzekerheid en het bord dat er werkelijk staat*

---

Een vrouw van tweeënvijftig zit tegenover me en zegt wat u ook elke week hoort:
ik eet bijna niets en ik val niet af. Ze is de afgelopen tien jaar drie keer
afgevallen en vier keer aangekomen. Haar bloeddruk staat op 152 over 94, haar
nuchtere glucose op 6,4, en ze is het zat.

Wat doe ik dan? Ik open een rekenmachientje, vul lengte, gewicht, leeftijd,
geslacht en een activiteitsfactor in, en er rolt 1.840 kilocalorieën uit. Dat
schrijf ik op een briefje en geef ik haar mee. Het ziet eruit als een meting:
vier cijfers, geen voorbehoud, uit een formule met een naam eraan.

Het is een gok. Mifflin-St Jeor is afgeleid op een populatie, en voor één
individu is de spreiding honderden kilocalorieën per dag. Erger: de twee
grootste onbekenden in haar geval zijn precies de twee die de formule niet kán
kennen. Hoeveel haar ruststofwisseling gedaald is door eerder gewichtsverlies,
en wat haar werkelijke activiteitsniveau is.

Ze gaat naar huis met een getal dat te precies is om aan te twijfelen. En als er
niets gebeurt, concludeert ze niet dat het getal fout was. Ze concludeert dat er
iets mis is met háár. Dat is in mijn ervaring het schadelijkste wat er in een
leefstijltraject kan gebeuren — en wij hebben het haar zelf aangereikt.

## Er is een alternatief, en het is ouder dan de apps

De energiebalans. Over een voldoende lang venster geldt dat inname min
gewichtsverandering gelijk is aan verbruik. Draai die vergelijking om en je hebt
geen formule meer nodig:

> verbruik = gemiddelde gelogde inname − (helling van de gewichtstrend × 7.700 kcal/kg)

Drie termen, en achter elk ervan zit literatuur.

De 7.700 kcal per kilo is als vóórspeller aantoonbaar onjuist. De klassieke regel
— eet vijfhonderd kilocalorieën minder en u verliest blijvend een pond per week —
overschat het gewichtsverlies in het eerste jaar met ruwweg honderd procent,
omdat een statisch model negeert dat de ruststofwisseling daalt en de
energiekost van bewegen met de massa meekrimpt (Hall, *Lancet* 2011). Maar als
conversiefactor achteráf, toegepast op een gemeten trend, houdt de regel wél
stand, en dat zeggen Hall en Chow zelf: het ernstige probleem is het statisch
veronderstellen van de energiebalans, niet de factor.

De helling vraagt om filtering, en om een detail dat verrassend zwaar weegt.
Lichaamsgewicht kent een weekritme: het hoogst op zondag en maandag, dalend naar
het weekeinde, met een amplitude van grofweg een half tot een heel procent van
het lichaamsgewicht (Orsama, *Obesity Facts* 2014). Bij honderdtwintig kilo is
dat zes tot twaalf ons aan puur ritme. Een venster dat geen veelvoud van zeven
dagen is laat dat ritme in de helling lekken, en dat is een fout van honderden
kilocalorieën per dag.

De ruis bepaalt de ondergrens. Bij een dag-tot-dagspreiding rond de acht ons is
de standaardfout van de helling ongeveer 410 kilocalorieën per dag bij veertien
metingen, 145 bij achtentwintig, en 80 bij tweeënveertig. Daarom achtentwintig
dagen: het eerste punt waar het interval smal genoeg is om iets te betekenen, en
nog kort genoeg om over te leven.

En de methode is gevalideerd. Tegen dubbelgelabeld water, bij honderdveertig
deelnemers aan de CALERIE-studie, over twee jaar: de gemiddelde afwijking bleef
binnen veertig kilocalorieën per dag, op individueel niveau was de RMSD 215
(Sanghvi, *AJCN* 2015). Ravelli en Schoeller kwamen in hun methodologische
beoordeling uit op een nauwkeurigheid tot binnen ongeveer twee procent
(*IJO* 2021).

Maar het mooiste argument is niet de validatie. Het is dit: door te méten
absorbeert het model de twee grootste onbekenden vanzelf, zonder ze te
modelleren of zelfs maar te kennen. Mifflin-St Jeor weet niet dat mijn patiënte
vijftien kilo is afgevallen en daardoor tweehonderdvijftig kilocalorieën onder
de voorspelling zit. Een gemeten verbruik weet dat wel, want dat is precies wat
het meet.

## Wat het getal wél en niet is

Hier moet ik streng zijn tegen mijn eigen enthousiasme, want dit is waar zulke
instrumenten meestal ontsporen.

Het verbruik wordt afgeleid uit *zelfgerapporteerde* inname. En zelfrapportage
is systematisch te laag. Tegen dubbelgelabeld water onderrapporteren
24-uursnavragen de energie-inname met tien tot twintig procent en
voedselfrequentievragenlijsten met twintig tot dertig procent; een analyse in
*Nature Food* uit 2024, gebaseerd op bijna zesenhalfduizend DLW-metingen, kwam
uit op 27,4 procent. De afwijking hangt systematisch samen met leeftijd,
geslacht en BMI.

Daaruit volgt iets wat in elke uitleg hoort te staan. Is de inname
stelselmatig twintig procent te laag gelogd, dan is het afgeleide verbruik dat
ook. Het getal is dus geen schatting van de stofwisseling, maar van het verbruik
zoals het logboek het impliceert. Dat zijn twee verschillende beweringen, en een
instrument hoort te zeggen welke van de twee het doet.

Dat maakt het niet minder bruikbaar — eerder het omgekeerde. Omdat de afwijking
persoonlijk is en betrekkelijk stabiel, voorspelt het getal het gewichtsverloop
van déze patiënt juist goed. Het is bruikbaar om doelen bij te sturen. Het is
geen fysiologische maat, en zeker geen bewijs voor of tegen een traag
metabolisme. Dat onderscheid zouden we in de spreekkamer sowieso scherper moeten
maken dan we doen.

## Geen getal zonder zijn onzekerheid

Dit is de kern, en het is een medische houding voordat het een technische is.

MacroFactor is wat het dichtst bij een concurrent komt: gebouwd door Greg
Nuckols en Eric Trexler, rekent het verbruik uit dezelfde natuurkunde, en toont
óók een band om de verbruikslijn. Hun eigen documentatie schrijft erbij dat je
die band niet als betrouwbaarheidsinterval moet lezen, en dat hij er staat
*"only for fun and curiosity"*. De gebruiker krijgt één getal als antwoord.

Dat is de sterkste aanwijzing die ik ken dat het tonen van onzekerheid geen
heruitvinding is maar een keuze die de markt bewust niet maakt — vermoedelijk
omdat een puntschatting makkelijker verkoopt en makkelijker naar te handelen is.

Wij weten beter. Wij zijn het vak dat een referentiewaarde naast een labuitslag
zet. Wij zouden nooit een HbA1c rapporteren zonder te weten hoe hij varieert, en
we leggen een patiënt met een licht afwijkend TSH geduldig uit wat een
grenswaarde betekent. En vervolgens delen we in de leefstijlzorg de hele dag
puntschattingen uit.

In het instrument dat ik voor mezelf bouwde draagt daarom elk getal zijn
interval, draagt elke gelogde regel een graad van A tot D, en draagt elke waarde
een teken voor waar hij vandaan komt: gemeten uit de voedingsmiddelentabel,
opgave van een fabrikant, of geschat. Drie tekens, hetzelfde teken in drie
vullingen — hoe vol de ruit staat zegt hoeveel er werkelijk bekend is. Dat is
geen versiering. Het is de kortste manier om te zeggen: dit weet ik zeker, en
dit niet.

## De stappen die niet meetellen

Eén weigering verdient toelichting, omdat hij tegen de intuïtie in gaat.

De actieve energie die een horloge erbij optelt gaat nooit naar het doel. De
fout in zulke schattingen is twintig tot vijftig procent en niet consistent in
één richting, dus corrigeren kan niet. Wat stappen wél doen, doen ze via de
weegschaal: wie structureel meer beweegt verschuift de helling, en dat ziet het
model vanzelf, zonder dat er iets bij opgeteld hoeft te worden.

Ook hier kwam het MacroFactor-team onafhankelijk tot dezelfde conclusie. Zij
voegden in 2025 stappen toe aan hun model en schrijven er expliciet bij dat ze
er géén calorische waarde aan toekennen: iedereen heeft een redelijke
stappenteller, en niemand heeft een betrouwbare omrekening naar calorieën.

## Het tweede been: het bord dat er werkelijk staat

Tot zover had elke goede ingenieur dit kunnen bouwen. Wat volgt kan alleen
iemand die de spreekkamer kent.

Het Nederlandse voedingsstoffenbestand is compleet. NEVO-online 2025/9.0,
tweeëntwintighonderdachtentwintig voedingsmiddelen, allemaal ingelezen. En toch
gaf zoeken op "roti" niets bruikbaars: een roti-vél uit de tabel, wat klopt en
niet is wat er op het bord ligt.

Wat ontbrak was niet de bron maar de bibliotheek — een naam die je intikt en een
portie in huishoudmaten. Dat is handwerk, geen import. En het gevolg was scheef
op een manier die niemand bedacht had: stamppot, hachee, erwtensoep, tosti en
kroket stonden gewoon in het RIVM-bestand, allemaal als heel gerecht
doorgemeten, en de app kwam er niet fatsoenlijk bij omdat niemand ze een naam
had gegeven.

Ik ging ervan uit dat een Surinaamse hoek verzonnen zou moeten worden:
ingrediëntenlijsten die niemand heeft nagewogen. Dat bleek maar half te kloppen.
NEVO heeft een eigen Surinaamse afdeling, en zes gerechten staan er als geheel
gemeten in — bruine bonen met rijst, pom, moksi alesi, dahl, bojo en bara. Voor
die zes is de energie per gram een meting van precies dát gerecht, en dus beter
onderbouwd dan de Marokkaanse hoek, waar de dichtheid uit een optelling van
losse ingrediënten komt.

Het is de tweede keer in dit project dat meten vóór bouwen een aanname van mij
omkeerde. Dat is inmiddels een werkregel geworden: eerst de tabel bevragen, dan
pas iets bedenken.

De bibliotheek telt nu honderd gerechten over zes keukens — Marokkaans, Turks,
Surinaams, Syrisch, Nederlands en een restcategorie. Het is het deel van dit
werk dat rechtstreeks uit de praktijk komt, en het is het deel dat ik als eerste
zou delen. Een diëtist die een Marokkaans gezin begeleidt heeft hier vandaag al
iets aan, ook zonder de rest.

## Wat dit voor de spreekkamer betekent

Wij meten bloeddruk, lipiden, HbA1c en nierfunctie. De energiebalans meten we
niet. Die schatten we, en vervolgens bespreken we die schatting alsof het een
bevinding is.

Wat er verandert als je hem wél meet, is niet dat de patiënt een beter getal
krijgt. Het is dat er na vier weken iets op tafel ligt dat van háár is: dit heb
je gelogd, dit deed de weegschaal, dus dit is je verbruik, en zó breed is dat.
Geen belofte. Een spiegel met een eerlijke breedte.

Voor wie zoals ik met hart- en vaatziekten bezig is, zit de winst ergens anders
dan in het afvallen zelf. Hij zit in de terugkoppeling. In een CVRM-traject
vragen we gedragsverandering en meten we het gevolg pas maanden later aan een
bloeddruk of een lipidenprofiel. Vier weken is korter dan een kwartaalcontrole,
en het is lang genoeg om ruis eruit te middelen.

De eerlijke beperking: dit is een instrument voor iemand die dagelijks wil wegen
en wil loggen. Dat is niet iedereen. Maar het zijn er meer dan we denken, en het
is precies de groep die nu met een formulegetal naar huis gaat.

## Wat dit niet is

Eén afbakening, omdat het de eerste vraag is die elke collega stelt.

Dit is een persoonlijk instrument, geen medisch hulpmiddel. Zodra software een
tienjaarsrisico berekent en dat aan een arts of patiënt toont om een beslissing
op te baseren, kom je onder de Medical Device Regulation — naar alle
waarschijnlijkheid regel 11, klasse IIa — met een aangemelde instantie, een
kwaliteitssysteem en een klinische evaluatie. Voor mezelf gebruiken is geen
enkel probleem. Het aan collega's geven voor hún patiënten is de grens.

Ik noem het niet om te ontmoedigen maar omdat het bepaalt wat dit wel en niet
kan worden, en omdat een instrument dat zijn eigen beperkingen niet benoemt
precies dezelfde fout maakt als het getal op dat briefje.

## Tot slot

Terug naar de vrouw van tweeënvijftig. Wat ik haar zou willen meegeven is niet
een beter getal. Het is een getal dat toegeeft hoeveel het niet weet — en dat
over vier weken van haar is, en van niemand anders.

---

*De onderbouwing per rekenregel, met bron en beperking, staat in*
`health/VERANTWOORDING.md`.
