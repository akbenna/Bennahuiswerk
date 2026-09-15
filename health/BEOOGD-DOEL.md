# Beoogd doel van BennaHealth

**Vastgesteld door A. Bennaghmouch als fabrikant op 15 september 2026.** Externe
toetsing is op dat moment bewust uitgesteld; de verantwoordelijkheid voor die
keuze ligt bij hem.

Dat besluit verandert niets aan wat er hieronder open staat. De Rijksoverheid
stelt dat de fabrikant zelf verantwoordelijk is voor de juiste kwalificatie en
risicoklasse — er is geen instantie die dat vooraf voor je vaststelt — maar die
verantwoordelijkheid dragen is iets anders dan de vraag beantwoorden. Valt deze
app onder de MDR, dan blijft dat zo, ongeacht wie het risico aanvaardt. De
openstaande vragen zijn daarom bewaard en niet weggeschreven: ze staan verderop,
en ze wachten op het moment dat die toetsing er alsnog komt.

De bredere afweging staat in `STRATEGIE-CHRONISCHE-ZORG.md`; dit bestand is de
verklaring zelf en het stuk dat een reviewer nodig heeft.

De volgorde is omgedraaid en dat hoort erkend te worden. De strategie zet deze
verklaring vóór de code; de code van het conditieprofiel stond er al toen zij
werd vastgesteld.

## De verklaring zelf

> BennaHealth ondersteunt volwassenen bij het volgen van hun eigen voeding,
> gewicht, beweging en zelfgemeten waarden. De app maakt zichtbaar wat iemand
> eet en hoe zijn gewicht zich over langere tijd ontwikkelt, en geeft algemene
> voorlichting over leefstijl en over veelvoorkomende aandoeningen.
>
> De app stelt geen diagnose, bepaalt geen behandeling en berekent geen
> dosering. Waar de ingevulde gegevens daar aanleiding toe geven, verwijst de app
> de gebruiker naar zijn huisarts of praktijkondersteuner.

## Wat de app doet

**Registreren en terugrekenen.** Voeding uit een voedingsstoffenbestand, gewicht,
beweging en slaap. Daaruit een adaptieve schatting van het energieverbruik en een
gewichtstrend, beide met een expliciet onzekerheidsinterval. Het uitgangspunt van
de hele app is dat geen enkel getal zonder zijn onzekerheid op het scherm komt.

**Samenvatten van zelfmetingen.** Onder meer een gemiddelde van de zelf ingevoerde
bloeddrukmetingen over een week, met het aantal dagen en de spreiding erbij. Er
wordt geen afkapwaarde toegepast en geen oordeel gegeven.

**Signaleren.** Wie zelf opgeeft dat hij bepaalde medicatiegroepen gebruikt en een
afvaldoel heeft, krijgt de informatie die daarbij hoort — bijvoorbeeld dat de
insulinebehoefte daalt bij gewichtsverlies — met de verwijzing om het met zijn
behandelaar te bespreken. Er wordt geen dosis genoemd en geen waarde berekend.

**Voorlichten.** Vaste teksten over hypoglykemie, zout en bloeddruk, thuis meten,
koolhydraten en vezels. Identiek voor iedere gebruiker, met bronvermelding. Welke
tekst bovenaan staat hangt af van het profiel; de tekst zelf niet.

## Wat de app niet doet

Geen diagnose. Geen behandeladvies. Geen dosering, titratie of
koolhydraat-insulineratio. Geen alarmering op vitale parameters. Geen
terugkoppeling naar een behandelaar: de app schrijft niet in een dossier en er
kijkt niemand mee.

Waar gegevens ontbreken wordt dat benoemd in plaats van als nul behandeld, en
waar de app iets niet kan vaststellen zegt hij dat — bijvoorbeeld dat hij niet
kan zien of bloeddrukmetingen 's ochtends en 's avonds zijn gedaan, omdat een
meting hier een datum draagt en geen tijdstip.

## Het punt dat de toetsing nodig heeft

De app bevat drie rekenmodules die er al stonden vóór het werk aan chronische
zorg: SCORE2 (tienjaarsrisico op hart- en vaatziekten), FIB-4 (leverfibrose) en
STOP-Bang (kans op slaapapneu). Ze rekenen met waarden die de gebruiker zelf
invult en tonen hem de uitkomst.

Dit is naar mijn inschatting het zwaarste punt van het hele dossier, en het staat
los van alles wat er sinds het conditieprofiel bij is gekomen. Een risicoscore is
niet hetzelfde als een voedingsdagboek. De vraag die voorgelegd moet worden is of
deze modules de app onder regel 11 brengen, en zo ja in welke klasse — de
standaard is IIa, met IIb zodra een verkeerde beslissing ernstige verslechtering
of een ingreep tot gevolg kan hebben.

Mijn eigen lezing is dat dit het grijze gebied is en niet dat het er duidelijk
buiten valt. Ik leg het daarom voor in plaats van het zelf te beslissen.

## Vragen die open blijven tot de toetsing er is

Valt BennaHealth in zijn huidige vorm onder de MDR, en zo ja onder welke klasse?
Maakt het verschil of SCORE2, FIB-4 en STOP-Bang alleen aan de gebruiker zelf
worden getoond, of alleen aan een behandelaar, of helemaal uit de patiëntapp
verdwijnen?

Verandert het conditieprofiel met zijn signalen die beoordeling? De signalen
noemen geen getal en verwijzen altijd naar een behandelaar, maar ze worden wel
getoond op grond van wat de gebruiker heeft ingevuld.

Is de scheiding die in `leren.ts` is aangehouden houdbaar: vaste voorlichting die
voor iedereen gelijk is, waarbij het profiel alleen de volgorde bepaalt en niet
de inhoud?

Wat is er nodig als de uitkomst IIa of hoger is, en wat is het verschil in traject
tussen de app zoals hij nu is en een app zonder de drie risicomodules?

## Wat er verder nog moet

Een DPIA. Het conditieprofiel maakt expliciet wat de app impliciet al verwerkte:
gegevens over gezondheid, en dus bijzondere persoonsgegevens. De grondslag, de
bewaartermijn en de rol van de praktijk moeten vastliggen voordat dit bij
patiënten komt.

Een besluit over het geplande overzicht voor de praktijkondersteuner. Dat is een
ander product met een andere gebruiker, en het hoort in ProVita Care en niet
hier. Of het onder dezelfde verklaring valt is een van de dingen die de toetsing
moet uitwijzen.

---

*Vastgesteld september 2026 door de fabrikant, zonder externe toetsing. De
regelgevingsverwijzingen in dit stuk en in `STRATEGIE-CHRONISCHE-ZORG.md` zijn
een lezing van Verordening (EU) 2017/745 en de MDCG-richtsnoeren 2019-11 en
2023-1, geen advies. Wie deze verklaring later toetst, begint bij de vragen
hierboven — die zijn met opzet blijven staan.*
