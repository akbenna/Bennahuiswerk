# Kalibratie — wat er vanzelf draait

*21 augustus 2026. Twee dingen lopen zonder dat er iemand op een knop drukt. Ze zijn bewust gescheiden: het ene moet altijd werken, het andere moet kunnen nadenken.*

---

## 1. De dagelijkse prikkel — serverkant, elke ochtend om acht uur

Draait volledig in je eigen Supabase, los van Claude en los van de app. Een app die je niet opent, herinnert je nergens aan; daarom zit dit in de database en niet in de interface.

**De keten.** `pg_cron` (job `kalibratie-prikkel`, `0 6,7 * * *`) → guard die kijkt of het in Amsterdam acht uur is → edge function `kal-prikkel` → `kal_prikkel_bouwen()` in SQL → Resend → je inbox.

De job staat twee keer per dag gepland en voert één keer uit. Dat is geen slordigheid: pg_cron rekent in UTC en Amsterdam schuift een uur op tussen zomer- en wintertijd. Dezelfde constructie gebruikt `patient-nudge-daily` al.

**Wanneer er wél een bericht komt:**

| Situatie | Onderwerp |
|---|---|
| Vanochtend niet gewogen | *nog niet gewogen vanochtend* — met hoeveel wegingen en registratiedagen er nog nodig zijn voor het model |
| Zeven dagen of langer niet gewogen | *de weegreeks staat stil* |
| Wel gewogen, maar twee of meer gaten in de afgelopen zeven dagen | *gaten in de registratie* |

**Wanneer er niets komt:** gewogen én hooguit één gat. Dat is de belangrijkste ontwerpkeuze van het hele ding. Een bericht dat elke dag komt ongeacht de inhoud wordt binnen twee weken weggeklikt, en dan is het kanaal weg op het moment dat er wél iets te melden valt.

`kal_prikkel_log` heeft een unieke sleutel op gebruiker + datum + soort, dus dubbel versturen kan niet — ook niet als de job twee keer vuurt.

**Uitzetten of bijstellen** gaat via één regel:

```sql
update kal_config set waarde = 'nee' where sleutel = 'prikkel_aan';   -- helemaal uit
update kal_config set waarde = '7'   where sleutel = 'prikkel_uur';   -- een uur eerder
update kal_config set waarde = '…'   where sleutel = 'prikkel_email'; -- andere ontvanger
```

**Waarom niet via `send-email`.** Dat was de eerste opzet, en de testverzending gaf 401. De service-role-sleutel in `vault.decrypted_secrets` (aangemaakt 22 juli, oud JWT-formaat) matcht niet meer met wat de functies in hun runtime hebben staan. `kal-prikkel` haalt zijn sleutel daarom uit de eigen omgeving en praat rechtstreeks met Resend. Die sleutel klopt per definitie en overleeft een rotatie.

Het endpoint staat open (`verify_jwt: false`) maar doet niets zonder het gedeelde geheim uit `kal_config.prikkel_geheim`. Zonder dat geheim: 401, geverifieerd.

---

## 2. Het weekbericht — maandagochtend, door Claude

Een geplande taak (`Kalibratie — weekbericht`, maandag 06:00 UTC, dus acht uur in de zomer en zeven in de winter). Die leest via de Supabase-koppeling één functie uit en schrijft daar een analyse bij. Melding komt op je telefoon en in je inbox.

**De cijfers komen uit `kal_weekcijfers(gebruiker)`** — één SQL-functie die de hele stand teruggeeft: regressie over de wegingen met standaardfout, gemiddelde inname en spreiding, het verbruik met interval, het doel, het eiwitgemiddelde tegen het doel op gecorrigeerd gewicht, de gaten, en de vlag `te_snel`.

De regressie gebruikt de ingebouwde `regr_*`-aggregaten; de standaardfout van de helling volgt exact uit `sxx` en `syy`. Geen handwerk, geen benadering.

**De opdracht schrijft voor wat er niet mag.** Nooit het puntgetal zonder interval. Geen waarschuwing over de trend onder de zeven wegingen, want daaronder is de helling ruis. Bij `te_snel`: het advies is méér eten. Geen aanmoediging, geen uitroeptekens, één concrete verandering per week en niet drie. Draait de Supabase-koppeling niet in die sessie, dan meldt hij dat in één zin en stopt — er wordt niet gegokt.

**Eén ongemak, expliciet.** `kal_weekcijfers` is de rekenkern een tweede keer, nu in SQL. Twee implementaties kunnen uit elkaar lopen. Het alternatief — een geplande sessie die zelf gaat rekenen — is minder reproduceerbaar, dus dit is de minste van twee kwaden. **Wijzig je de kern in `kalibratie/index.html`, wijzig hem dan hier ook.** De ijkpunten staan in `VERANTWOORDING.md`.

---

## 3. De koppeling — bewegingsgegevens van je horloge en je telefoon

*Toegevoegd 23 augustus 2026.*

### Waarom de omweg via Apple Gezondheid en niet rechtstreeks op Garmin

Garmin heeft een echte Health API met precies wat we willen: dagtotalen voor stappen en calorieën, slaap, activiteiten. Hij zit achter het [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program/health-api/), en dat vraagt een aanvraag namens een rechtspersoon plus goedkeuring per partij. Er is geen zelfbedieningssleutel. Bovendien nam het programma bij het schrijven hiervan geen nieuwe aanmeldingen aan. Voor één huishouden is dat geen begaanbare weg.

Apple Gezondheid is nog strikter: er ís geen web-API. HealthKit-gegevens komen alleen van het toestel af, via een app óp dat toestel.

Wat wél werkt en van niemand toestemming nodig heeft:

1. De **Garmin Connect-app schrijft in Apple Gezondheid** — stappen, slaap, trainingen, hartslag en gewicht. Aan te zetten onder *Meer → Instellingen → Verbonden apps → Apple Gezondheid*. Die weg is eenrichtingsverkeer: Garmin → Gezondheid, niet terug.
2. De **Opdrachten-app** leest Gezondheid uit (*Zoek gezondheidsmonsters*) en mag zelf een POST versturen (*Verkrijg inhoud van URL*), automatisch op een tijdstip.

Eén weg dekt dus beide bronnen. En hij heeft een voordeel dat de directe API niet heeft: de gegevens gaan van de telefoon rechtstreeks naar onze eigen database, zonder tussenpartij.

Eén valkuil hoort erbij: als meerdere apps hetzelfde gegeven in Gezondheid schrijven, kiest Gezondheid welke voorgaat. Staat de iPhone boven Garmin Connect bij *Stappen*, dan krijg je de stappen van je telefoon en niet die van je horloge. Dat staat onder *Gezondheid → het gegeven → Gegevensbronnen en toegang*.

### De keten

`Opdrachten-automatisering (07:00)` → POST naar `…/rest/v1/rpc/kal_beweging_ontvangen` → upsert in `kal_dagen`.

Geen edge function. De ontvangst is een gewone `SECURITY DEFINER`-functie achter PostgREST, net als alle andere aanroepen van de app. Een edge function zou een tweede plek zijn waar dezelfde regels staan.

### De sleutel

`kal_koppelingen` houdt per koppeling een **sha256 van de sleutel** bij, niet de sleutel zelf. Wie de database leest kan er dus niets mee versturen. De sleutel is één keer te zien, bij het maken, in het scherm *Meer → Horloge en telefoon koppelen*.

Waarom niet het sessietoken: dat verloopt. Een koppeling die elke ochtend om zeven uur vuurt mag niet stilvallen omdat je een week niet ingelogd bent. Deze sleutel verloopt niet en is per stuk in te trekken zonder dat je uitlogt.

De tabel houdt `laatst_gebruikt_op`, `aantal_berichten` en `aantal_dagen` bij, zodat het scherm kan laten zien of er werkelijk iets binnenkomt. Een koppeling die stilletjes gestopt is, is erger dan geen koppeling.

### De botsingsregels — het hart van `kal_beweging_ontvangen`

Ze zijn met opzet niet symmetrisch:

| Veld | Wie wint | Waarom |
|---|---|---|
| `stappen`, `actieve_energie_kcal`, `slaap_min`, `fiets_min`, `bedtijd`, `waaktijd` | wat binnenkomt | Dit zijn metingen. Wat je zelf intikt is een herinnering. |
| `gewicht_kg` | wat er al staat | Het model rekent op de ochtendweging volgens protocol: nuchter, na het toilet, vóór het eten. Een weegschaal die 's avonds met kleren aan een getal doorgeeft meet iets anders; twee metingen door elkaar geven een helling die nergens op slaat. Lege dagen worden wél aangevuld. |
| `kracht`, `notitie` | wat er al staat | Een oordeel van jou, geen meting. De functie raakt ze niet aan. |
| `hartslag_rust` | het toestel, tenzij jij hem invulde | Hij staat niet in `kal_dagen` maar in `kal_metingen`, en heeft daarom zijn eigen regel. Een pols die de koppeling zelf neerzette mag hij bijwerken — die van vanochtend is voorlopig. Eentje die jij hebt ingetikt blijft staan. |

Een veld dat niet in het bericht zit laat de bestaande waarde met rust — je hoeft dus niet alles mee te sturen. Dagen in de toekomst en dagen van vóór 2015 worden overgeslagen en geteld in het antwoord, niet stilzwijgend weggeschreven: dat is altijd een fout in de opdracht en niet een meting.

Het antwoord is `{"dagen": n, "gewicht_behouden": n, "overgeslagen": n}`. Die tweede is er expres: zonder dat getal lijkt het alsof er niets gebeurde met het gewicht dat je meestuurde.

### Wat er nog niet bewezen is

De functie zelf is in de database getest, inclusief alle botsingsregels en een geweigerde sleutel. De HTTP-weg erheen is **niet** vanuit de ontwikkelomgeving te testen — het netwerk daar laat de Supabase-host niet door. Daarvoor zit de knop *Verbinding proberen* in het koppelscherm: die stuurt vanaf jouw toestel een bericht met een lege dagenlijst langs precies dezelfde weg als de opdracht straks loopt. Slaagt die, dan klopt de hele keten op de inhoud van het bericht na.

### Eén valkuil, gevonden bij het echt instellen

De opdracht heeft **precies één koptekst** nodig: `apikey`. Voeg je er met de hand een `Content-Type: application/json` aan toe, dan weigert iOS het hele verzoek — de Opdrachten-app zet die koptekst zelf al zodra de hoofdtekst op JSON staat, en een dubbele koptekst wordt afgekeurd.

Wat het zo vervelend maakt is de melding die je dan krijgt: *"De netwerkverbinding is verbroken."* Die wijst naar wifi, naar het domein, naar van alles behalve naar de koptekst. De weg eruit was opbouwen in stappen: eerst alleen de URL (dan antwoordt de server met *"No API key found in request"* — een net antwoord, dus de verbinding stáát), daarna één ding per keer erbij tot het omslaat.

Een `Authorization`-koptekst is ook niet nodig; `apikey` alleen volstaat.

### De platte ingang: `kal_beweging_dag`

De Opdrachten-app kan geen lijst van objecten bouwen zonder dat het een middag kost. Daarom staat er naast `kal_beweging_ontvangen` een tweede ingang die één dag plat aanneemt — twaalf losse velden, en niets anders te doen dan ze invullen. Hij rekent zelf niets uit: hij bouwt de dag en geeft hem door aan `kal_beweging_ontvangen`, zodat de botsingsregels op één plek blijven staan.

Drie dingen daaraan komen niet uit een ontwerp maar uit het opbouwen op een echt toestel. Ze staan met de reden erbij in `health/database/04-koppeling-in-de-praktijk.sql`.

**`p_dagen_terug` in plaats van een datum.** De datum meesturen vraagt op een iPhone twee extra acties, een aangepaste notatie, en de variabele *Huidige datum* — die niet in de variabelenkiezer staat. Eén getal doet hetzelfde werk: `0` is vandaag, `1` is gisteren. Laat je hem weg, dan wordt het gisteren; stuur je toch een `p_datum` mee, dan wint die.

**Alle waarden komen binnen als tekst.** Een nacht zonder slaapmeting stuurde een lege waarde, PostgREST probeerde die naar `numeric` te casten, en het hele bericht sneuvelde met `22P02` — inclusief de stappen die wél gemeten waren. Eén ontbrekende meting hoort de andere niet mee te slepen. `kal_getal` leest de getallen nu zelf: leeg betekent *niet meegestuurd*, een komma is een decimaalteken (de telefoon staat op Nederlands), en iets onleesbaars wordt overgeslagen en genoemd in `niet_gelezen`. Dat laatste veld is er expres: stil overslaan is hetzelfde als liegen over wat er is binnengekomen.

**Een 0 wordt niet weggeschreven.** *Bereken statistiek* geeft over nul monsters een **0** terug en niet leeg. Die 0 is dus niet te onderscheiden van "niets gevonden" — en als meting is hij onmogelijk: wie zijn telefoon bij zich draagt komt niet op nul stappen of nul actieve energie uit, en nul minuten slaap bestaat niet. Op 23 augustus kwam er zo 0 kcal binnen naast 1.746 stappen. Wegschrijven levert een dag op die eruitziet als gemeten en die het model als echte nul meeneemt, dus die 0 gaat de tabellen niet in; hij komt terug in `nul_overgeslagen`. Dat is expres iets anders dan `niet_gelezen`: een "0" is prima leesbaar. En het geldt expres alleen voor de platte ingang — wie via de lijst-ingang een 0 stuurt, meent hem.

**`p_hartslag_rust`.** De rustpols bestond al als meting die je met de hand invulde, maar kwam nergens binnen en werd nergens getoond. Het is het waardevolste dagcijfer dat een horloge levert: hij daalt als de conditie verbetert en stijgt bij ziekte, slechte slaap of te zware belasting. In de opdracht hoort hij op **Gemiddelde** te staan, niet op Som. Het scherm *Klinisch* zet hem af tegen je gemiddelde van de afgelopen dertig dagen, en zwijgt zolang er minder dan drie eerdere metingen zijn — één dag verschil is ruis.

Het antwoord vertelt per stuk wat er gebeurd is, ook als er niets gebeurde: `{"datum": …, "dagen": 1, "hartslag_rust": "opgeslagen" | "die van jou blijft staan" | "onmogelijk, genegeerd" | "niet meegestuurd", "niet_gelezen": [], "nul_overgeslagen": []}`.

### Peilingen: waarom de opdracht vaker mag vuren

Eten voer je zelf in, dus dat staat er meteen. Beweging kwam één keer per etmaal binnen, om 23:45, als de dag al voorbij was. Over iets wat je pas achteraf weet valt niets te adviseren.

De helft van de oplossing zit op de telefoon: laat de opdracht **vaker vuren**. Vier of vijf tijdstip-automatiseringen die dezelfde opdracht draaien, plus eventueel één op *Wanneer ik een training beëindig*. Dat werkt zonder enige wijziging, want `stappen` heeft de regel "het toestel wint" en een nieuwere stand is altijd hoger dan de vorige.

De andere helft staat in `health/database/05-peilingen-van-de-dag.sql`. Elke stand van vandáág blijft daar staan **mét het tijdstip**, in `kal_beweging_peilingen`. Uit dagtotalen valt namelijk niet af te leiden of 3.400 stappen om drie uur voor jou veel of weinig is: twee dagen van 8.000 stappen kunnen een ochtendwandeling zijn of een avondrondje, en het advies om drie uur is in die twee gevallen tegengesteld.

`kal_beweging_gewoonte(gebruiker, minuut)` geeft de mediane stand rond dat tijdstip op eerdere dagen, mét het aantal dagen waarop dat berust. Dat aantal is het belangrijkste veld: onder de vijf dagen zegt het niets en hoort de app te zwijgen.

Twee dingen doet die tabel expres niet. Hij vervangt `kal_dagen` niet — daar staat het dagtotaal, en dat blijft de waarheid over een dag; een tussenstand is een meting van een moment. En hij rekent niet mee in het model: stappen zitten sowieso niet in de verbruiksschatting (hoofdstuk 6 van `VERANTWOORDING.md`), dus een advies om te wandelen is hier nooit een calorieënhandel.

### De coach: het scherm dat naar je toe komt

Het scherm rekent al uit wat er nog in past. Dat helpt alleen als je kijkt. Sinds 24 augustus stuurt de app op drie momenten een bericht — **12:30, 15:30 en 18:30** — maar alleen als er iets te zeggen valt, en dat is meestal niet zo.

De drempels staan in `kal_coach_bouwen` en in `meldenNu` in `src/health/coach.ts`, en ze zijn met opzet grof: minder dan vijftien gram eiwit verschil is binnen de ruis van het loggen zelf. Er gaat niets uit vóór negen uur, niets na negenen 's avonds, en niets als je al over je doel zit — daar valt die dag niets meer aan te doen en het benoemen helpt niemand. De soort draagt het tijdvak (`coach-12`), zodat de ontdubbeling per dag én per moment werkt.

**Waarom er een postbus tussen zit.** Om te zeggen "je hebt nog 800 kcal" moet je het doel kennen, en dat komt uit de rekenkern: een regressie over de weegreeks, gekruist met de gelogde inname. Die kern staat in TypeScript en is daar met gouden waarden vastgelegd. Hem in SQL nabouwen zou een tweede implementatie van het model opleveren, en twee implementaties lopen uit elkaar zonder dat iemand ziet welke van de twee liegt. Dus publiceert de app zijn uitkomst in `kal_modelstand` met een tijdstempel, en zwijgt de coach zodra die ouder is dan achtenveertig uur. Dat is meteen de juiste uitkomst om een tweede reden: als de app twee dagen niet open is geweest, is de dagregistratie ook onvolledig en klopt het tekort toch niet.

**Wanneer een model aan zet is.** Alleen als er in je eigen geschiedenis niets meer past binnen de resterende ruimte. Dán zet `kal_coach_bouwen` het vlaggetje `vraag_model` aan en vraagt de edge function om één concreet idee — eerst OpenAI, dan Claude. Het model mag geen kcal- of eiwitwaarden noemen: die komen uit de tabel zodra je het logt, en een getal uit het geheugen van een model zou daarmee botsen. In het bericht staat erbij dat het een voorstel van een taalmodel is en niet iets uit je geschiedenis.

De modelnamen staan in `kal_config` en niet in de code, om dezelfde reden als bij `kal-ai`: namen verlopen. Staat er geen `model_coach_openai`, dan wordt OpenAI overgeslagen — er wordt geen naam geraden die niemand heeft nagekeken.

**Eén ding om te onthouden bij het uitrollen.** Een nieuwe versie van een edge function komt terug met `verify_jwt = true`, ook als hij eerder open stond. De prikkel-cron stuurde alleen een `Content-Type` mee en kreeg daarmee `UNAUTHORIZED_NO_AUTH_HEADER` van de poort — vóór de functie zelf ook maar iets zag. Alle prikkel-taken sturen nu een `Authorization` met de service-role-sleutel uit de vault. Dat is per saldo beter: het endpoint stond open en het gedeelde geheim was het enige slot; nu zijn het er twee.

### De regels zijn vastgelegd

De botsingsregels stonden alleen in de functie. Sinds 23 augustus staan ze ook in een proef: `select * from kal_proef_koppeling();` — 41 gevallen, alle regels uit de tabel hierboven plus de sleutelafhandeling, de grenzen, de scheiding tussen gebruikers en alles wat de platte ingang hierboven moet verdragen. Zie `health/database/03-proef-koppeling.sql`.

Twee dingen daaraan zijn niet vanzelfsprekend en dus het vermelden waard.

**Hij schrijft in de echte tabellen.** Anders toetst hij een nabootsing van de regels in plaats van de regels zelf. Hij draait zichzelf altijd terug: alles staat in een blok dat eindigt met een exception, en plpgsql rolt de schrijfacties van dat blok dan terug. De uitslag overleeft dat wel, want variabelen zijn niet transactioneel. Na afloop staat er geen proefgebruiker, geen proefsleutel en geen proefdag.

**De proef is zelf getoetst.** Met de gewichtsregel expres omgedraaid — `coalesce(nieuw, oud)` in plaats van `coalesce(oud, nieuw)` — slaan er precies twee gevallen om: *"GEWICHT WORDT NOOIT OVERSCHREVEN"* en *"lege dag krijgt het gewicht wel"*. Die mutatie liep in een transactie die is teruggedraaid; de kapotte versie heeft nooit gecommit. Een proef die nooit rood wordt is erger dan geen proef, want hij geeft dekking die er niet is.

Waarom dit geen vijfde poort in `npm run controle` is: die poorten draaien zonder database. Dit is dus een script dat je zelf draait, na elke wijziging aan `kal_beweging_ontvangen` of `kal_beweging_dag`.

### Als de Garmin-API ooit wel kan

Dan verandert er aan deze kant niets. Alles wat binnenkomt gaat door dezelfde functie met dezelfde botsingsregels; er komt alleen een andere afzender bij.

---

## 4. Twee dingen die ik onderweg tegenkwam, buiten dit project

Geen onderdeel van Kalibratie, wel jouw systeem.

**`measurement-alerts-hourly` loopt elk uur in een time-out.** In de laatste zes uur zes runs, alle zes afgebroken op `Timeout of 5000 ms`. Dat is de standaardlimiet van pg_net, en die is te kort voor een edge function die koud start. De job draait dus al die tijd voor niets. Oplossing is één parameter: `timeout_milliseconds := 25000` in de `net.http_post`-aanroep. `kalibratie-prikkel` heeft die al.

**De service-role-sleutel in de vault matcht niet meer.** Alle cron-jobs die `vault.decrypted_secrets` gebruiken — `sciencepulse-monday`, `sciencepulse-thursday`, `measurement-alerts-hourly`, `patient-nudge-daily`, `voeding-fotos-opruimen` — sturen die sleutel mee als `Authorization`. Mijn testaanroep naar `send-email` met precies die sleutel kreeg 401. Ik heb dat niet verder uitgezocht en niets aangepast: het raakt productie en het is jouw beslissing. Maar het is de moeite waard om één van die jobs handmatig te vuren en de respons te bekijken.

**En los daarvan:** de modelnaam in `chat-ai` (`claude-sonnet-4-20250514`) bestaat niet meer op je Anthropic-sleutel. Alles wat daar naar Sonnet routeert — contentgeneratie, intakesamenvattingen, behandelnarratieven, fotoanalyse — valt terug op OpenAI of geeft een fout.

---

## De licentiepoort

NEVO mag alleen uitgeleverd worden zolang de voorwaarden nagelopen zijn. In
`nevo_versies` staan daarom twee vlaggen per versie, `is_actief` en
`licentie_gecontroleerd`, met een check-constraint die "actief maar niet
gecontroleerd" onmogelijk maakt. De view `nevo_actief` toont alleen rijen die
door beide vlaggen komen.

Die poort deed lange tijd niets. `kal_nevo_zoek`, `kal_portiematen` en
`kal_gerecht` lazen `nevo_foods` rechtstreeks, dus de vlag omzetten had de app
gewoon door laten draaien — de schakelaar zat er wel, maar hij zat nergens aan
vast. Dat is nu rechtgezet: alle zes de functies die NEVO aanraken lezen via
`nevo_actief`.

Bij het naspelen bleek er nog iets tweede: met een lege bron brak
`kal_nevo_zoek` af op `ln(0)` in de idf-berekening. De poort maakte de app dan
niet stil maar stuk. Ook dat is opgelost; nul producten geeft nu nul resultaten.

**De schakelaar omzetten** gaat via `is_actief`, niet via
`licentie_gecontroleerd` — de constraint staat de tweede in zijn eentje niet toe:

```sql
update nevo_versies set is_actief = false where versie = '2025/9.0';
```

Daarna vindt het zoeken niets, tonen gerechten nul kcal met "ongekoppeld"
erbij, en meldt `kal_portiematen` dat het product niet in het bestand staat.
De tabel `nevo_foods` blijft onaangeroerd; terugzetten is dezelfde regel met
`true`.

Wie hier een functie bij bouwt: lees `nevo_actief`, nooit `nevo_foods`. Deze
query laat zien of dat ergens misgaat:

```sql
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and regexp_replace(p.prosrc, '--[^\n]*', '', 'g') ~* '\m(from|join)\s+(public\.)?nevo_foods\M';
```

---

## Overzicht

| Onderdeel | Waar | Wanneer |
|---|---|---|
| `kalibratie-prikkel` | pg_cron → `kal-prikkel` → Resend | dagelijks 08:00 |
| `Kalibratie — weekbericht` | geplande Claude-taak → `kal_weekcijfers` | maandag 08:00 |
| `kal-ai` | edge function, Sonnet 5 | op aanroep vanuit de app |
| `kal_nevo_zoek` | één zoekfunctie, gedeeld door de app en `kal-ai` | bij elk zoeken |
| `nevo_actief` | de licentiepoort waar alle NEVO-toegang langs gaat | — |
| `kal_beweging_ontvangen` | Opdrachten op de iPhone → PostgREST → `kal_dagen` | dagelijks, door de telefoon |
| `kal_beweging_dag` | de platte ingang die de Opdrachten-app aanroept | een paar keer per dag, door de telefoon |
| `kal_peiling_vastleggen` | bewaart elke stand van vandaag met zijn tijdstip | bij elke aanroep hierboven |
| `kal_modelstand_zetten` | de app legt de uitkomst van de rekenkern neer | bij elke keer dat de app opent |
| `kal_coach_stand` | wat er nog in past, en wat dat kan vullen | door de coachprikkel |
| `kal_coach_bouwen` | bouwt de coachberichten | 12:30, 15:30 en 18:30 |
| `kal_proef_koppeling` | 41 gevallen over de botsingsregels en de platte ingang, draait zichzelf terug | met de hand, na elke wijziging |
| 16 tabellen, 24 functies | schema `public`, prefix `kal_` | — |

Alles staat of valt bij één ding dat geen enkele automatisering kan overnemen: de ochtendweging. De prikkel herinnert eraan, het weekbericht rekent ermee, maar niemand kan hem voor je verzinnen.
