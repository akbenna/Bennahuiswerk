# DPIA BennaHealth — gegevensbeschermingseffectbeoordeling

Concept van 15 september 2026. Een DPIA is een proces en geen formulier: dit
stuk beschrijft wat er nu werkelijk gebeurt met welke gegevens, en het benoemt
de besluiten die nog niet genomen zijn. Die staan als open punt en niet als
aanname.

Een DPIA is hier verplicht en niet optioneel. De AVG schrijft er een voor bij
grootschalige verwerking van bijzondere persoonsgegevens, en ook zonder die
drempel geldt dat gezondheidsgegevens plus geautomatiseerde verwerking plus een
nieuwe technologie samen ruim boven de criteria van de EDPB uitkomen. Blijft de
app beperkt tot de maker zelf, dan is hij er niet toe verplicht — maar dan is
dit stuk de voorbereiding op het moment dat dat verandert, en dat moment is de
reden dat het er nu ligt.

## Het besluit dat vooropgaat

**Wie is verwerkingsverantwoordelijke?** Dat is de eerste vraag en hij is nog
niet beantwoord. Er zijn twee antwoorden en ze sluiten elkaar uit.

Gebruikt alleen de maker de app voor zichzelf, dan is er geen verwerking in de
zin van de AVG die buiten de huishoudelijke uitzondering valt en houdt het hier
op. Gebruiken patiënten van Huisartsenpraktijk Het Roosendael hem, dan is de
praktijk verwerkingsverantwoordelijke, met alles wat daaraan hangt: een
grondslag, een verwerkersovereenkomst per dienstverlener, een bewaartermijn, een
plek in het verwerkingsregister, en een route voor de rechten van betrokkenen.

Alles hieronder is geschreven voor het tweede geval, want dat is het geval waar
het fout kan gaan.

## Wat er verwerkt wordt

| Categorie | Voorbeelden | AVG |
|---|---|---|
| Voeding | wat, hoeveel, welk moment, eigen producten en maaltijden | gewoon, maar verweven met de rest |
| Lichaam | gewicht, middelomtrek, lengte, leeftijd, geslacht | art. 9 — gezondheid |
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

Het conditieprofiel heeft niets toegevoegd aan de categorie — er stond al
gezondheidsdata in — maar het heeft wel expliciet gemaakt wat impliciet was. Dat
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
voor hetzelfde doel — dataminimalisatie in de praktijk.

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

## Wat er nog beslist moet worden

Wie verwerkingsverantwoordelijke is — en dus of dit stuk een voorbereiding is of
een verplichting.

De grondslag. Bij een app die patiënten vrijwillig gebruiken ligt uitdrukkelijke
toestemming (art. 9 lid 2 onder a) meer voor de hand dan de uitzondering voor
zorgverlening (onder h), omdat de app geen onderdeel is van de behandeling. Die
keuze bepaalt hoe de tekst bij het aanmelden moet luiden.

De bewaartermijn, en wat er gebeurt als iemand stopt. Nu is er geen termijn en
geen opzegroute.

Een verwerkersovereenkomst met Supabase, Vercel en Anthropic, en opname in het
verwerkingsregister van de praktijk.

Hoe iemand zijn gegevens inziet, corrigeert en meeneemt. De app kan importeren;
exporteren en wissen zijn de tegenhangers die er nog niet zijn.

De regio van het Supabase-project, vastgesteld en niet aangenomen.

---

*Opgesteld september 2026. Dit is een eerste beschrijving door de bouwer en geen
oordeel van een functionaris voor gegevensbescherming. De open punten hierboven
zijn de agenda, niet de restpost.*
