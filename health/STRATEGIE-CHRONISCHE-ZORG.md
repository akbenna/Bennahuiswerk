# BennaHealth en de chronische zorg — waar de grens ligt en hoe we eroverheen komen

Dit stuk staat er omdat de vraag "kunnen we diabetes en hypertensie erbij doen"
niet met ja of nee te beantwoorden is. Het antwoord hangt af van wat de app
*claimt* te doen, en die claim bepaalt niet alleen of het scherm overzichtelijk
blijft, maar ook onder welk regime de app valt. Wat hieronder staat is de
redenering, niet het bouwplan. `VERANTWOORDING.md` blijft de plek waar elke
rekenregel zijn bron krijgt; hier staat waarom bepaalde regels er wél en andere
er niet mogen komen.

## De grens is al half overschreden

`klinisch.ts` rekent SCORE2, FIB-4 en STOP-Bang uit. Dat is geen leefstijl meer;
dat is risicovoorspelling. Onder de MDR (Verordening 2017/745) is software die
informatie levert waarop een diagnostische of therapeutische beslissing rust een
hulpmiddel, en regel 11 zet die standaard in klasse IIa. Kan een verkeerde
beslissing ernstige verslechtering of een ingreep tot gevolg hebben, dan IIb; kan
zij tot overlijden of onomkeerbare schade leiden, dan III. Software die
fysiologische processen bewaakt is eveneens IIa, en IIb zodra het om vitale
parameters gaat waarbij afwijking direct gevaar betekent.

Een risicoscore die de patiënt zelf ziet zit in het grijze gebied van die eerste
regel. Een insulinedoseeradvies zit er ondubbelzinnig boven: hypoglykemie ís de
ernstige verslechtering waar IIb over gaat. Ter ijking: Insulia, een app die
niets anders doet dan basale insuline titreren, is een CE-gemarkeerd
IIb-hulpmiddel met aangemelde instantie, ISO 13485 en klinische evaluatie.

Dat is geen reden om te stoppen. Het is de reden om de dienstenlijst niet per
ziekte te ordenen maar per claim, in drie ringen.

## Ring 1 — het meetinstrument

Wat er nu staat: energiebalans met onzekerheid, verzadiging, gewichtstrend,
beweging, slaap. Leefstijl, geen ziekte. Dit is de identiteit van de app en het
blijft voor iedereen hetzelfde scherm. Wie hier iets aan toevoegt moet kunnen
uitleggen waarom het bij álle gebruikers hoort.

## Ring 2 — de context

De gebruiker zegt zelf wat er speelt: hypertensie, diabetes type 2, doorgemaakte
hart- of vaatziekte. En zijn medicatie, maar dan in *groepen* — insuline,
SU-derivaat, SGLT2-remmer, GLP-1-agonist, RAS-remmer, diureticum. Geen losse
middelen en geen ATC-codes: groepen volstaan voor alles wat de app ermee doet, en
ze zijn voor wie moeizaam leest aanwijsbaar met een foto van het doosje. Dat
laatste is geen detail in een praktijk op de Donderberg.

Wat de app met dat profiel doet is de bestaande schermen ánders wegen, niet
uitbreiden. Bij hypertensie komt natrium in beeld op Voeding, en krijgt de
thuisbloeddruk op Gezondheid het meetprotocol uit de NHG-Standaard CVRM in plaats
van een los getal. Bij diabetes komen koolhydraatkwaliteit en vezel naast eiwit
en verzadiging te staan. Dat laatste kan omdat de NDF Voedingsrichtlijn diabetes
(2020, bewijsupdate 2023) geen apart diabetesdieet kent maar uitgaat van gezonde
voeding met persoonsgerichte aanpassing — het bouwwerk dat er staat hoeft dus
niet verdubbeld te worden, alleen anders gewogen.

Het belangrijkste in ring 2 is niet advies maar **veiligheid**, en dat argument
staat los van de MDR. Een app die mensen laat afvallen, gebruikt door iemand op
insuline of gliclazide, veroorzaakt hypo's zodra de inname daalt en de dosis
niet. Iemand op een SGLT2-remmer die fors minder koolhydraten eet loopt risico op
euglykemische ketoacidose — normale glucose, wél ketoacidose, en dus een gevaar
dat de gebruiker niet aan zijn meter ziet. En wie een RAS-remmer slikt en op
advies van de app naar een kaliumhoudende zoutvervanger grijpt, riskeert
hyperkaliëmie.

Dat zijn geen functies maar zorgplichten van een app die weet wat hij aanricht.
De vorm is telkens dezelfde en is met opzet beperkt: niet doseren, wel
signaleren en terugverwijzen. *"Je insulinebehoefte daalt als je afvalt. Bespreek
met je POH wanneer de dosis mee moet."* Dat houdt de mens de beslisser. Het is
ook het enige eerlijke antwoord van een app die geen getal zonder onzekerheid
geeft: een insulinedosis kán deze app niet met een onzekerheidsinterval leveren,
en dus hoort hij hem niet te geven.

## Ring 3 — de behandeling

Titratie op maat, hypo- en hypermanagement berekend voor deze patiënt, een
koolhydraat-insulineratio. Dat is een klasse IIb-product en hoort niet in een
consumentenapp van één praktijk.

Wat wél kan is generieke educatie. Onder MDCG 2019-11 is software die uitsluitend
informatie ontsluit zonder patiëntspecifieke verwerking geen hulpmiddel: een
digitaal leerboek is geen apparaat. "Wat is een hypo en wat doe je dan" als vaste
tekst, op het niveau en in de toon van Thuisarts, is dus veilig. Dezelfde tekst
*berekend voor jou* is dat niet. Die grens is scherp, en hij is bruikbaar als
ontwerpregel: zodra een educatiescherm een waarde van de gebruiker inleest om het
antwoord te veranderen, is het ring 3 geworden.

## Waarom we niet per ziekte splitsen

Een diabetesmodule naast een hypertensiemodule is de app-versie van de
ziektegebonden keten waar het regionale beleid juist vanaf wil. De patiënten in
deze praktijk hebben zelden één aandoening; wie een module per diagnose bouwt,
bouwt het probleem na. Eén profiel dat lagen aanzet is de app-versie van
casemix-light: de hele mens weegt, niet de zwaarste code.

Praktisch betekent dat ook: geen nieuw tabblad. De balk heeft er zes en dat is
genoeg. Een conditie verandert wat er op een scherm staat, niet hoeveel schermen
er zijn.

## Waar we wél splitsen: op rol

De patiënt logt in BennaHealth. De POH kijkt in een praktijkdashboard: de
gewichtstrend met band, de gemiddelde thuisbloeddruk volgens protocol, het
natriumpatroon, en wat de patiënt zelf aan medicatiegroepen opgaf — met de
herkomst erbij, want zelfopgave is geen medicatieoverzicht uit het HIS.

Dat dashboard hoort in ProVita Care en niet hier. Daar zit de risico-engine en de
patiënteducatie al; het kan de bestaande `kal_*`-functies als leverancier
gebruiken. Zo blijft BennaHealth één app met zes tabbladen en krijgt de POH een
instrument, zonder dat de patiënt een cockpit voor zijn neus krijgt.

## Als ring 3 ooit moet

Artikel 5, lid 5 van de MDR laat zorginstellingen hulpmiddelen in eigen huis
maken en gebruiken zonder CE-markering. De voorwaarden zijn niet licht: het
hulpmiddel mag niet aan een andere rechtspersoon worden overgedragen, er moet een
passend kwaliteitssysteem zijn, er moet onderbouwd worden dat geen gelijkwaardig
product op de markt in de behoefte voorziet, er is technische documentatie nodig,
de algemene veiligheids- en prestatie-eisen uit bijlage I blijven gelden, en er
hoort een openbare verklaring bij.

Eén ding is daarbij onzeker en moet niet worden weggeschreven: of een
huisartsenpraktijk kwalificeert als *zorginstelling* in de zin van deze
uitzondering. De definitie in de MDR spreekt van een organisatie die primair
patiëntenzorg of volksgezondheid tot doel heeft, wat een praktijk lijkt te
dekken, maar de voorbeelden in MDCG 2023-1 noemen ziekenhuizen, laboratoria en
volksgezondheidsinstituten — geen huisartsenpraktijken. Dit is dus een optie om
te laten toetsen, geen route om op te plannen.

## Volgorde

Eerst de **intended-purpose-verklaring**, vóór er één regel code bij komt. Eén
alinea: BennaHealth ondersteunt leefstijl en zelfmeting, signaleert wanneer een
behandelaar geraadpleegd moet worden, stelt geen diagnose en doseert geen
medicatie. Laat die alinea één keer toetsen door iemand die MDR-kwalificaties
doet, en laat de bestaande risicoscores in diezelfde toets meegaan — die vraag
staat nu al open, met of zonder chronische zorg. Daarnaast een DPIA: een
conditieprofiel maakt de bijzondere persoonsgegevens expliciet die de app nu
impliciet al verwerkt.

Dan **ring 2 in de patiëntapp**. Conditieprofiel met medicatiegroepen op Profiel,
de drie veiligheidssignalen, natrium en koolhydraatkwaliteit als voorwaardelijke
kolommen op Voeding, het thuisbloeddrukprotocol op Gezondheid, en een venster
Leren met vaste teksten. Alles binnen de zes tabbladen die er zijn.

Dan het **POH-dashboard in ProVita**, beproefd bij de driemaandelijkse controles
in de eigen praktijk voordat er iets regionaals van gemaakt wordt.

Pas daarna de vraag of ring 3 überhaupt moet, en zo ja langs welke route.

## Wat bewust niet

Geen educatievideo's en geen chatbot als eerste stap. Beide voelen als
vooruitgang en veranderen niets aan de zorg; het conditieprofiel wel.

Geen losse middelen in het profiel, alleen groepen. Een medicatielijst die
onvolledig of verouderd is, is gevaarlijker dan geen lijst, omdat hij vertrouwen
wekt dat hij niet verdient.

En geen enkel getal dat de app niet met zijn onzekerheid kan leveren. Die regel
is niet alleen de stelling van deze app; hij is hier ook de scheidslijn tussen
wat mag en wat niet mag.

## Bronnen

De regelgeving hierboven is samengevat uit Verordening (EU) 2017/745 (regel 11
van bijlage VIII, artikel 5 lid 5 en artikel 2 lid 36), MDCG 2019-11 over
kwalificatie en classificatie van software, en MDCG 2023-1 over de uitzondering
voor zorginstellingen. Dit is een lezing en geen advies: de classificatie van
software is berucht om zijn grijstinten en een toets door een gekwalificeerde is
geen formaliteit.

De klinische inhoud hoort te komen uit de NHG-Standaard Cardiovasculair
risicomanagement, de NHG-Standaard Diabetes mellitus type 2 en de NDF
Voedingsrichtlijn diabetes (2020, bewijsupdate 2023). De signalen in ring 2 zijn
hierboven als categorie genoemd; de precieze drempels en formuleringen horen uit
die richtlijnen te komen en met bron in `VERANTWOORDING.md` te worden
vastgelegd, zoals de rest van de rekenregels.
