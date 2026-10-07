# DPIA BennaHealth: gegevensbeschermingseffectbeoordeling

Concept van 15 september 2026, bijgewerkt op 7 oktober 2026. Een DPIA is een proces en geen formulier: dit
stuk beschrijft wat er nu werkelijk gebeurt met welke gegevens, en het benoemt
de besluiten die nog niet genomen zijn. Die staan als open punt en niet als
aanname.

Een DPIA is hier verplicht en niet optioneel. De AVG schrijft er een voor bij
grootschalige verwerking van bijzondere persoonsgegevens, en ook zonder die
drempel geldt dat gezondheidsgegevens plus geautomatiseerde verwerking plus een
nieuwe technologie samen ruim boven de criteria van de EDPB uitkomen. Zolang
alleen de maker de app gebruikte, was dit stuk een voorbereiding. Sinds
BennaHealth vanuit ProVita aan patiënten wordt aangeboden, is het een
verplichting.

## Het besluit dat vooropgaat

**Wie is verwerkingsverantwoordelijke?** ProVita Care. Besloten door de eigenaar
op 7 oktober 2026.

Tot die dag stonden hier twee antwoorden die elkaar uitsluiten: eigen gebruik
door de maker, waarvoor de huishoudelijke uitzondering geldt, of gebruik door
patiënten van de praktijk, en dan de praktijk als verantwoordelijke. Het eerste
viel af toen BennaHealth vanuit ProVita aan patiënten werd aangeboden. Het
tweede is het niet geworden: niet de huisartsenpraktijk maar ProVita Care is
verantwoordelijk, dezelfde partij die de programma's levert.

Dat maakt BennaHealth en het programma twee diensten van één verantwoordelijke,
met twee doelen en twee grondslagen. BennaHealth draait op uitdrukkelijke
toestemming (art. 9 lid 2 onder a), want het is geen zorg en geen onderdeel van
een behandeling. Het programma valt onder de uitzondering voor zorgverlening
(onder h). De knip tussen die twee is het overzetten: gegevens gaan alleen van
de app naar het programma als de gebruiker dat zelf doet, met twee keer ja, via
zijn eigen browser (`src/health/naarprovita.ts`). Er is geen gedeelde database
en geen gedeeld account. Die knip hoort er te blijven, want zonder haar zou wat
iemand op toestemming invult stil onder een andere grondslag gaan vallen.

Alles hieronder is geschreven voor dit geval.

## Wat er verwerkt wordt

| Categorie | Voorbeelden | AVG |
|---|---|---|
| Voeding | wat, hoeveel, welk moment, eigen producten en maaltijden | gewoon, maar verweven met de rest |
| Lichaam | gewicht, middelomtrek, lengte, leeftijd, geslacht | art. 9: gezondheid |
| Metingen | bloeddruk, rustpols, slaap, stappen, training | art. 9 |
| Laboratorium | ASAT, ALAT, trombocyten, cholesterol, HDL | art. 9 |
| Conditie | hypertensie, diabetes type 2, doorgemaakte hart- of vaatziekte | art. 9 |
| Medicatie | groepen: insuline, SU, SGLT2, GLP-1, RAS-remmer, diureticum | art. 9 |
| Vrije invoer | foto's van eten, beschrijvingen in gewone taal | kan alles bevatten |
| Afgeleid | SCORE2, FIB-4, STOP-Bang, energieverbruik, gewichtstrend | art. 9 |

De laatste twee rijen verdienen aandacht. Een foto van een bord eten kan een
gezicht, een keuken of een medicijndoosje bevatten dat de gebruiker er niet bij
bedoelde. En de afgeleide waarden zijn geen invoer maar uitkomst: een
tienjaarsrisico is een nieuw gezondheidsgegeven dat de app zelf maakt.

Het conditieprofiel heeft niets toegevoegd aan de categorie (er stond al
gezondheidsdata in) maar het heeft wel expliciet gemaakt wat impliciet was. Dat
is precies waarom dit stuk nu geschreven wordt en niet een jaar geleden.

## Waar het heen gaat

**Opslag.** Supabase, project `huiuvnjrvvoybbzwfrfp`. Alle toegang loopt via
`SECURITY DEFINER`-functies met vastgezet `search_path`; RLS staat aan zonder
policies, zodat de tabellen niet rechtstreeks leesbaar zijn en de functies
bepalen wat eruit mag. In de browser komt alleen de publieke anon-sleutel.

*Open punt: in welke regio staat dit project?* Dat moet vastgesteld en
vastgelegd worden. Twee andere projecten van dezelfde eigenaar staan in
`eu-central-1` en `eu-west-1`, maar dat zegt niets over dit project.

**Hosting.** Vercel, statische bestanden plus de edge functions.

**Verwerking door een derde.** Herkenning van eten uit tekst of foto gaat via de
edge function `kal-ai` naar `api.anthropic.com`. Dat is een doorgifte naar een
verwerker in de Verenigde Staten en vraagt om een verwerkersovereenkomst en een
geldige doorgiftegrondslag.

Eén eigenschap is hier gunstig en hoort vastgelegd te worden omdat ze makkelijk
verloren gaat bij een volgende wijziging: **de foto en de tekst worden niet
bewaard.** `kal_ai_log` schrijft alleen gebruiker, soort, model, aantal tokens,
kosten en of het lukte. De inhoud gaat erheen, wordt beantwoord, en verdwijnt.

**Koppelingen.** Beweging en bloeddruk kunnen binnenkomen uit een horloge of
telefoon via `kal_beweging_dag`. Wat daar aan de andere kant gebeurt valt buiten
deze app maar niet buiten de voorlichting aan de gebruiker.

## Noodzaak en evenredigheid

De verwerking is doelgebonden: zonder wat iemand eet en weegt kan de app niets
zeggen. Twee ontwerpkeuzes beperken haar verder, en het is de moeite ze hier te
noemen omdat ze ook privacymaatregelen zijn en niet alleen goede smaak.

Medicatie wordt in groepen gevraagd en niet als middel. Dat is minder gegeven
voor hetzelfde doel, dataminimalisatie in de praktijk.

En de app haalt niets uit het HIS. Wat erin staat is zelfopgave. Dat beperkt de
verwerking en het beperkt ook wat er bij een lek te halen valt.

## De risico's, en wat eraan gedaan is

**Onbevoegde toegang tot gezondheidsgegevens.** Het zwaarste risico, want de
gevolgen zijn onomkeerbaar: een gelekte diagnose is niet terug te nemen. Wat
ertegen staat: toegang uitsluitend via functies, RLS zonder policies, geen
service-role-sleutel in de browser, en een strikte Content-Security-Policy die
per bouw wordt beproefd.
*Open punt: hoe lang leeft een sessietoken, en wat gebeurt er bij verlies van het
toestel?*

**Meer in een foto dan bedoeld.** Een gezicht, een recept, een medicijndoosje.
Wat ertegen staat: de foto wordt niet opgeslagen. Wat er nog moet: de gebruiker
er vóór het maken van de foto op wijzen dat hij naar een verwerker buiten de EU
gaat.

**Een afgeleid oordeel dat zwaarder weegt dan de invoer.** SCORE2 maakt van vijf
losse waarden een tienjaarsrisico. Dat is een nieuw gegeven met meer gewicht dan
de onderdelen. Dit raakt ook aan de vraag in `BEOOGD-DOEL.md`, en het is hier
opnieuw een reden om te overwegen of die uitkomst in de patiëntapp thuishoort.

**Doorgifte naar de VS.** Vraagt een verwerkersovereenkomst met Anthropic en een
grondslag onder hoofdstuk V AVG.
*Open punt: is die overeenkomst er?*

**Verlies van gegevens.** Een jaar loggen dat verdwijnt is geen privacyrisico
maar wel een risico voor de gebruiker.
*Open punt: wat is het herstelbeleid van dit Supabase-project?*

## Wat er nog beslist of geregeld moet worden

Stand op 7 oktober 2026.

**Beslist.** De verantwoordelijke (hierboven). De grondslag: uitdrukkelijke
toestemming, zoals `PRIVACY.md` al zei. De bewaartermijn: zolang iemand
meedoet en daarna drie maanden. Verwijderen kan de gebruiker zelf (bestand 52),
exporteren ook (bestand 55).

**Te regelen door ProVita Care, vóór de eerste patiënt wordt toegelaten.**

- Een verwerkersovereenkomst met Supabase en met Anthropic, afgesloten door of
  overgezet naar ProVita Care, met een geldige grondslag voor doorgifte naar de
  VS. De herkenning draait op de sleutel van ProVita Care (25 per maand per
  gebruiker), dus Anthropic verwerkt hier in opdracht van ProVita Care en niet
  van de gebruiker. Vercel ziet geen gegevens (zie `PRIVACY.md`) en is daarom
  geen verwerker van gezondheidsgegevens; een gebruiker met een eigen sleutel
  van OpenAI of Anthropic verwerkt via zijn eigen afspraak.
- Opname van BennaHealth in het verwerkingsregister van ProVita Care, als
  verwerking los van de programma's.
- De regio van het Supabase-project, vastgesteld en niet aangenomen, en het
  herstelbeleid.
- Een melding vóór het maken van een foto dat die naar een verwerker buiten de
  EU gaat.
- Een toets van dit stuk door een functionaris voor gegevensbescherming of een
  jurist. Het is nog steeds een beschrijving door de bouwer.

---

*Opgesteld september 2026. Dit is een eerste beschrijving door de bouwer en geen
oordeel van een functionaris voor gegevensbescherming. De open punten hierboven
zijn de agenda, niet de restpost.*
