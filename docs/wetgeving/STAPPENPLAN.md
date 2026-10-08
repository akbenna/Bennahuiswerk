# Stappenplan wetgeving: BennaHealth

Stand 8 oktober 2026. Dit is het stappenplan voor BennaHealth, met in dezelfde map alleen de leveranciers die dit product gebruikt. Tot 8 oktober stond er in alle vijf de repo's één gedeeld plan met een gedeeld leveranciersdossier; nu heeft elk product zijn eigen. Twee hoofdstukken gelden voor de hele praktijk en staan in alle vijf de repo's gelijk: de besluiten (hoofdstuk 3) en de gezamenlijke stappen (hoofdstuk 4). Wie daar iets wijzigt, wijzigt het in alle vijf.

Het plan is geschreven vanuit de code en de documenten zoals die op 7 oktober 2026 in de repo's en in de Claude-documenten staan, en vanuit de correspondentie met Mistral. Het is geen juridisch advies. Waar een stap een oordeel van een functionaris gegevensbescherming (FG), jurist of MDR-adviseur vraagt, staat dat erbij.

## 1. Waar BennaHealth staat

| Product | Wat het doet | Welke gegevens, naar wie | Papier dat er ligt | Wat het gebruik nu blokkeert |
|---|---|---|---|---|
| **BennaHealth** (voedingsapp in `Bennahuiswerk`) | Supabase (eigen project, regio onbekend), Vercel; foto's en dagverslagen naar Anthropic (VS); Resend mailt gewichten naar de beheerder | Gezondheidsgegevens van testers (gewicht, bloeddruk, labwaarden), foto's | DPIA (concept 15 september, verouderd), privacyverklaring in de app (23 september), beoogd doel (15 september), strategie chronische zorg | Wie verantwoordelijke is (praktijk of persoon); patiënt of consument; gewichtsmail naar de beheerder; Resend, Google Fonts en de Claude-weektaak ontbreken in de verklaring; de medicatietrede is na het beoogde doel opengezet; sleutellek van 26 augustus zonder vastlegging. |

## 2. Leveranciers van BennaHealth

Alleen de leveranciers die de code van BennaHealth werkelijk aanroept. Elk dossier staat in `leveranciers/`; bewijsstukken staan in `bewijs/`.

| Leverancier | Dossier | Rol in BennaHealth |
|---|---|---|
| Supabase | `leveranciers/supabase.md` | Database en edge functions (eigen project). |
| Vercel | `leveranciers/vercel.md` | Hosting van de app. |
| Anthropic | `leveranciers/anthropic.md` | Foto's, dagverslagen en de coach (`kal-ai`). |
| OpenAI | `leveranciers/openai.md` | Coachsuggestie in `kal-prikkel`; `kal-ai` alleen op eigen sleutel. |
| Resend | `leveranciers/resend.md` | Prikkel- en coachmail. |
| Overige | `leveranciers/overige.md` | Google Fonts en de wekelijkse Claude-taak. |

## 3. Vijf besluiten voor de hele praktijk

Deze besluiten zijn van de praktijkhouder. Zolang ze niet genomen zijn, blijft elk document met een open plek staan, want ze bepalen wie tekent, waar data heen mag en welk kader geldt.

**Besluit 1: de rechtspersoon.** In de vijf repo's komen vier namen voor als verantwoordelijke of verwerker: Groepspraktijk het Roosendael, ProVita Care, ProVita Care BV en Benmedical BV; de SignaalZorg-DPA heeft dezelfde persoon aan beide kanten. De Mistral-organisatie staat op naam van de praktijk; de Railway-DPA op naam van ProVita. Het hangt af van het handelsregister welke rechtspersonen er werkelijk zijn. Nodig: één tabel met per product de verwerkingsverantwoordelijke (vrijwel zeker de praktijk, want die heeft de WGBO-relatie) en de verwerker (de rechtspersoon die de software levert en de leverancierscontracten houdt). Zijn dat twee rechtspersonen, dan is er per product een verwerkersovereenkomst tussen beide nodig (art. 28 AVG) en hoort elke leveranciers-DPA op naam van de verwerker. Is het één rechtspersoon, dan vervalt die tussenlaag, en moeten de Mistral- en Railway-accounts op dezelfde naam komen. Dit besluit kan alleen de praktijkhouder nemen, met accountant of jurist.

**Besluit 2: Railway houden of verhuizen. Beantwoord door Railway op 5 oktober 2026.** Railway past bijlage A van de DPA ("Special Categories of Data: None") voor niemand aan, dus de DPA dekt geen gezondheidsgegevens, ook niet in doorstroom. De logs van elke service staan in US West, en een contractuele toezegging voor alleen-EU bestaat op geen enkel plan (afschrift in `docs/wetgeving/bewijs/railway-dpa-2026-10-05.md` bij VitaScribe, ConsultSpiegel en ProVita Care). Daarmee is de keuze gemaakt: echte consulten van VitaScribe en ConsultSpiegel gaan naar een server bij een Europese host. Voor VitaScribe is die al gebouwd (werkplan stap 4, `deploy/eu/`, instelling "Server voor de EU-modus" in de extensie); voor ConsultSpiegel moet hij nog komen. Railway blijft voor gespeelde consulten, simulatie en diensten zonder gezondheidsgegevens. Wat de praktijkhouder nog kiest, is alleen de host: Cyso Cloud (Nederland), Hetzner (Duitsland) of Scaleway (Frankrijk). Vergelijking in `docs/wetgeving/leveranciers/hosting-hetzner-scaleway.md` bij VitaScribe en ConsultSpiegel (7 oktober 2026); dat advies (Hetzner) is op 8 oktober herzien: een Nederlandse host met NEN 7510-claim, Cyso Cloud, kost vergelijkbaar geld. Eerst het certificaat en de DPA van Cyso opvragen. Zie `docs/bedrijf/BLAUWDRUK.md` in de VitaScribe-repo, met ook de benchmark van de markt, de kostprijs per functie en de vraag wat als EU telt.

**Besluit 3: Amerikaanse AI alleen voor niet-patiëntdata.** Deepgram en Anthropic verwerken nu ongepseudonimiseerde consulttekst en audio (VitaScribe in de Claude-modus, ConsultSpiegel-simulatie, ProVita-coach en foto's). Verdedigbaar is: Amerikaanse partijen alleen voor simulatie, dictaat zonder patiëntgegevens en gepseudonimiseerde tekst, en voor echte gezondheidsgegevens de EU-route (Mistral met ZDR, of Claude via Bedrock in Frankfurt) of lokaal. ConsultSpiegel doet dat al in code; VitaScribe heeft sinds 2.27.1 de EU-modus als standaard, maar het slot dat de Claude-modus weigert staat nog niet aan; ProVita heeft geen EU-route. Wie Amerikaanse AI voor echte patiëntgegevens wil houden, heeft per partij een DPA, een doorgiftegrondslag (DPF of SCC's) en een TIA nodig, plus de bewaartermijn bij de aanbieder in de patiëntinformatie.

**Besluit 4: BennaHealth is een besloten test voor consumenten, of een zorgtoepassing voor patiënten van de praktijk.** De privacyverklaring zegt het eerste, de DPIA het tweede, de export naar ProVita suggereert het tweede. Het eerste maakt de praktijk geen verantwoordelijke en houdt het buiten WGBO en NEN 7510, maar dan moet de app ook geen klinische functies (SCORE2, FIB-4, medicatietrede) aan die testers tonen zonder MDR-kwalificatie. Het tweede brengt de app onder hetzelfde regime als ProVita.

**Besluit 5: een FG of privacyadviseur.** Een huisartsenpraktijk met grootschalige verwerking van gezondheidsgegevens via AI heeft een FG nodig, of op zijn minst een aangewezen privacyadviseur die de DPIA's vaststelt (art. 37 AVG; de AP rekent een praktijk met meerdere artsen en AI-verwerking doorgaans tot "grootschalig"). Elk vastgesteld document in dit plan vraagt die handtekening. Zonder FG blijft alles concept.

## 4. Gezamenlijke stappen

Elke stap noemt wat nodig is, de grond, wie het doet, en wat al in de repo's staat.

| Nr | Stap | Grond | Wie | Status 7 oktober |
|---|---|---|---|---|
| A1 | **Rechtspersoon en rollen vastleggen** (besluit 1): tabel product × verantwoordelijke × verwerker × wie welk leveranciersaccount houdt | Art. 4, 24, 26, 28 AVG | Praktijkhouder, accountant | Open. Handelsregister controleren is in VitaScribe al als taak genoemd. |
| A2 | **FG of privacyadviseur aanwijzen**, melden bij de AP | Art. 37-39 AVG | Praktijkhouder | Open (besluit 5). |
| A3 | **Verwerkingsregister van de praktijk**: één register met een regel per product. VitaScribe stuk 02 en ProVita-register als invoer; Bricks stuk 09; ConsultSpiegel en BennaHealth ontbreken nog | Art. 30 AVG | Praktijk, met FG | Deelregisters bestaan; samenvoegen en vaststellen. |
| A4 | **Leveranciersdossier**: per leverancier DPA-versie en -datum (PDF), doorgiftegrondslag, regio (schermafdruk), bewaartermijn, subverwerkerslijst, trainingsuitsluiting. Per product in `docs/wetgeving/leveranciers/`, met alleen de leveranciers die dat product gebruikt; een leverancier die twee producten delen staat in beide | Art. 28, 44-46 AVG | Verwerker (ProVita) | Sinds 8 oktober per product aangelegd. Mistral: bevestigd 6 oktober (bewijsstuk bij VitaScribe en ConsultSpiegel). Railway: DPA getekend, bijzondere categorieën open. Supabase, Vercel, Deepgram, Anthropic, OpenAI, Resend: niets vastgelegd. |
| A5 | **Transfer impact assessment** voor de Amerikaanse partijen die gezondheidsgegevens zien (Railway, Deepgram, Anthropic, Resend, web push). Eén document, per partij een paragraaf | Hoofdstuk V AVG, Schrems II, DPF-besluit 2023 | Verwerker, FG | Open. Railway valt voor gezondheidsgegevens af (besluit 2, 5 oktober 2026); blijft over voor Deepgram, Anthropic, Resend en web push, en besluit 3 kan die lijst nog verkorten. |
| A6 | **NEN 7510-beleid van de praktijk** (informatiebeveiligingsbeleid, toegangsbeheer, logging volgens NEN 7513, incidentprocedure). De software verwijst er steeds naar; het document zelf ligt in geen repo | Besluit elektronische gegevensverwerking door zorgaanbieders art. 3; Wabvpz | Praktijk | Open. Alle vijf de producten leunen erop. ProVita toont publiek "NEN 7510" en "ISO 27001" zonder dat er een ISMS is (stap PV3). |
| A7 | **Datalekprocedure** (intern melden, beoordelen, 72 uur AP, betrokkenen) en een **incidentenlogboek** per product | Art. 33-34 AVG | Praktijk | Bricks heeft een logboek; VitaScribe-DPA zegt 24 uur; verder niets. Eén procedure, in alle repo's gelinkt. |
| A8 | **AI-geletterdheid**: korte instructie voor artsen, POH, aios en beheerders, met datum en namen | AI Act art. 4 (sinds 2 februari 2025) | Praktijk | Open; VitaScribe stuk 09 en ConsultSpiegel-handleiding zijn bruikbaar als basis. |
| A9 | **Toestemmings- en informatiemodel**: één patiëntinformatietekst per product, één wachtkamertekst, en vastlegging wie wanneer toestemming gaf. Toestemming is bij VitaScribe een waarborg (grondslag is 9(2)(h) met WGBO), bij ConsultSpiegel-patiënten en BennaHealth de grondslag zelf (9(2)(a)) | Art. 7, 9, 13 AVG; KNMG-richtlijn opnemen van gesprekken; WGBO 7:448 | Praktijk, FG | VitaScribe stuk 08, ConsultSpiegel-formulier (concept), ProVita `ai_consent`. BennaHealth heeft geen aparte handeling. |
| A10 | **Bewaartermijnen** per gegevenssoort, en de opruimtaak die ze uitvoert | Art. 5(1)(e) AVG; WGBO 7:454 (20 jaar dossier) | Verwerker | VitaScribe (niets bewaard, auditlog 5 jaar) en ConsultSpiegel (30 dagen) kloppen in code. ProVita belooft termijnen zonder code; BennaHealth belooft 3 maanden zonder taak. |
| A11 | **Verzekeraar informeren** (beroepsaansprakelijkheid, software in eigen gebruik; vanaf 9 december 2026 ook de nieuwe productaansprakelijkheidsrichtlijn 2024/2853 voor software die in de handel komt) | BW 6:185; richtlijn 2024/2853 | Praktijkhouder | Genoemd in Bricks en VitaScribe, nog niet gedaan. |
| A12 | **Halfjaarlijkse herbeoordeling**: DPA-versies, subverwerkerslijsten, regio's, nieuwe AI-routes in de code. In de agenda, met dit plan als checklist | Art. 24, 32 AVG | Verwerker | Eerste datum: april 2027. |

## 5. Stappen voor BennaHealth

Doel hangt af van besluit 4. Onder beide uitkomsten geldt:

| Nr | Stap | Grond | Status |
|---|---|---|---|
| BH1 | Gewichtsmail naar de beheerder stoppen of het gewicht eruit (`kal_prikkel_bouwen`, `kal_coach_bouwen`); de privacyverklaring zegt dat de beheerder geen gewicht ziet | Art. 5(1)(a), 32 | Codewijziging, klein. |
| BH2 | Privacyverklaring (`privacy.ts`) aanvullen: Resend, Vercel (IP-logs), Google Fonts (of lokaal zetten), de Claude-weektaak, en dat gewicht, stappen en workouts via de screenshot-import wél naar Anthropic gaan; OpenAI-coachroute kloppend maken | Art. 13 | Codewijziging; de proef `privacy.proef.ts` bewaakt de tekst. |
| BH3 | Supabase-regio en plan vastleggen; DPA; de anon-rechten op `kal_dagstand` en `kal_weekcijfers` nalopen (ruw gebruikers-id zonder token) | Art. 28, 32 | Open; live database controleren met `controle-md5.sql`. |
| BH4 | Sleutellek 26 augustus 2026 (service_role van het ProVita-project): rotatie bevestigen en een beoordeling onder art. 33 vastleggen, ook als de uitkomst "geen melding" is | Art. 33 | Open; nergens vastgelegd. |
| BH5 | DPIA herschrijven naar de huidige code (export en wissen bestaan, bewaartermijn 3 maanden, foto's naar de VS) en de opruimtaak voor de 3 maanden bouwen | Art. 35, 5(1)(e) | Open. |
| BH6 | Toestemming als handeling: een vinkje met tijdstip en versie, en een melding vóór de eerste foto dat die naar de VS gaat | Art. 7, 9(2)(a) | Codewijziging. |
| BH7 | Persoonsgegevens van de eigenaar uit de vaste systeemprompt van `kal-ai` | Dataminimalisatie | Codewijziging, klein. |
| BH8 | MDR: BEOOGD-DOEL bijwerken met de medicatietrede (sinds 20 september open) en SCORE2/FIB-4/STOP-Bang, of die functies dicht voor testers tot een adviseur heeft gekeken; de stellige "geen medisch hulpmiddel" in de privacyverklaring afzwakken tot de tekst van BEOOGD-DOEL | MDR regel 11 | Open. |
| BH9 | Huiswerk-AI (vragen en roosterfoto's van kinderen naar Anthropic): aparte paragraaf in het register en een eigen korte DPIA, want het gaat om minderjarigen | Art. 8, 35 | Open. |

## 6. Volgorde

Eerst de besluiten uit hoofdstuk 3: ze kosten geen techniek, en zonder besluit 1 kan niets worden getekend. Eerst besluit 4, want het bepaalt welk regime geldt. Ongeacht de uitkomst meteen BH1 (geen gewicht naar de beheerder) en BH4 (het sleutellek vastleggen). Dan de verklaring en de toestemming (BH2, BH6, BH7) en de database (BH3). BH5 en BH8 daarna; BH9 apart, want het gaat om kinderen.

## 7. De andere producten

Elk product heeft een eigen stappenplan in `docs/wetgeving/STAPPENPLAN.md` van zijn repo.

| Product | Repo |
|---|---|
| VitaScribe | `akbenna/VitaScribe` |
| ConsultSpiegel | `akbenna/consultspiegel` |
| ProVita Care | `akbenna/provita-care` |
| Bricks Companion | `akbenna/bricks-companion-` |
