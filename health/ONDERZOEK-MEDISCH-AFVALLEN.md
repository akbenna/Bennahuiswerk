# Medisch afvallen: wat de literatuur zegt, en wat dat voor deze app betekent

*Fase 1 van drie: eerst het onderzoek, dan het voorstel, dan de bouw.*
*Opgesteld 19 september 2026.*

Dit bestand is een verslag van wat er nagezocht is en waar het vandaan komt. Het
is geen behandelrichtlijn en het schrijft niets voor. Waar een getal onzeker is,
staat dat erbij, dezelfde regel als in `VERANTWOORDING.md`.

## Hoe dit onderzocht is, en wat er niet lukte

Gezocht via websearch. **Directe toegang tot `nhg.org`, `app.magicapp.org`,
`voedingonline.nl`, `nieuwsvoordietisten.nl`, `rohamsterdam.nl` en
`provitacare.nl` wordt door de netwerkproxy geblokkeerd.** Wat hieronder staat
over de NHG-Standaard komt dus uit samenvattingen van die bronnen en niet uit de
standaard zelf.

Dat is voor een deel van de inhoud goed genoeg en voor één deel niet: **de exacte
formulering van de medicatiecriteria hoort nagelezen te worden in de standaard
zelf voordat er een regel in code van gemaakt wordt.** Dat staat onderaan bij
"Wat er nog na moet".

### NAGELEZEN: 20 september 2026

Abdelkader heeft de standaard zelf aangeleverd: **NHG-Standaard Obesitas,
augustus 2026**, uitgegeven door het Nederlands Huisartsen Genootschap, 60
bladzijden. De medicatieparagraaf staat op bladzijde 28–29, tabel H5 op bladzijde
25. Wat hieronder staat over de criteria is daaruit overgenomen en niet meer uit
samenvattingen.

**Drie dingen die de samenvattingen niet hadden, en één die ze verkeerd hadden.**

| | |
|---|---|
| **gemist** | De afwijkende BMI-drempels voor mensen met een Aziatische (inclusief Hindostaanse), Midden-Oosterse, Afrikaanse of Afrikaans-Caribische migratieachtergrond. Dat is geen voetnoot: het verschuift de drempel van 40 naar 37,5 en van 35 naar 32,5. |
| **gemist** | Geen medicatie boven de 75 jaar, en niet tijdens zwangerschap of borstvoeding. |
| **gemist** | De stopregel: stoppen bij < 5% gewichtsverlies na 12 weken op de maximaal verdraagbare dosis. |
| **fout** | Ik schreef "aanvullend aanbod". De standaard zegt **"extra aanbod en daarom facultatief"**. |

Dat is precies waarom de medicatietrede in `src/health/trap.ts` een slot had. Een
app die de eerste rij had gemist, had iemand met een Marokkaanse of Surinaamse
achtergrond en een BMI van 38 verteld dat hij er nog niet aan toe was, terwijl
de standaard hem er wél onder brengt. In de praktijk van deze app, en van
ProVitaCare, is dat niet het uitzonderingsgeval maar een groot deel van de
mensen.

---

## 1. De vondst die het meest uitmaakt: registratie is geen indicatie

`src/lib/glp1MedicationReference.js` in ProVita Care noemt als indicatie voor
Wegovy:

> Obesitas (BMI ≥ 30) of overgewicht (BMI ≥ 27) met ten minste één
> gewichtsgerelateerde comorbiditeit

Dat is juist: als **EMA-registratietekst**. Het is niet de grens waarop een
Nederlandse huisarts mag starten.

De **NHG-Standaard Obesitas (augustus 2026)** zet die grens veel hoger. Dit is de
tekst van bladzijde 28–29, letterlijk:

> **Overweeg medicatie bij:**
> - patiënten met BMI 35-39,9 en gewichtsgerelateerde comorbiditeit (coronaire
>   hartziekten, beroerte, perifeer arterieel vaatlijden, diabetes mellitus type
>   2, obstructief slaapapneu of artrose van een dragend gewricht)
> - patiënten met BMI ≥ 40
> - patiënten met een Aziatische (inclusief Hindostaanse), Midden-Oosterse,
>   Afrikaanse of Afrikaans-Caribische achtergrond met BMI 32,5-37,4 en
>   bovengenoemde gewichtsgerelateerde comorbiditeit, of een BMI ≥ 37,5
>
> **Schrijf alleen medicatie voor bij patiënten die:**
> - ≥ 1 jaar gemotiveerd hebben deelgenomen aan een (gecombineerde)
>   leefstijlinterventie met onvoldoende gewichtsreductie (< 10% gewichtsverlies
>   vanaf extreem verhoogde GGR, zie tabel h5) **én**
> - blijven deelnemen aan deze leefstijlinterventie, of na afronding van het
>   2-jarige GLI-programma gemotiveerd zijn voor continuering van de gezonde
>   leefstijl
>
> **Stop** met medicatie bij een gewichtsverlies < 5% na 12 weken gebruik van de
> maximaal verdraagbare dosis.
>
> Schrijf medicatie **niet** voor bij patiënten > 75 jaar en tijdens zwangerschap
> of lactatie.

De derde rij is de rij die in elke samenvatting ontbrak. Hij verschuift de
drempel met ongeveer 2,5 BMI-punt omlaag voor een groep die in Nederland (en
zeker in de praktijk van ProVitaCare) groot is. De standaard licht dat elders
toe: dezelfde correctie geldt voor de hele indeling, want bij een gelijke BMI
ligt het gezondheidsrisico bij deze groepen hoger.

De standaard noemt medicatie nadrukkelijk **"extra aanbod en daarom
facultatief"**: de huisarts is niet verplicht het te leveren en het is geen
onderdeel van de basiszorg. Wordt het niet door de huisarts zelf voorgeschreven,
dan is de route een verwijzing naar de tweede lijn, bij voorkeur een
obesitascentrum of een internist gespecialiseerd in obesitas.

Aanbevolen middelen zijn liraglutide 3 mg subcutaan, semaglutide 2,4 mg
subcutaan en naltrexon/bupropion. Semaglutide 2,4 mg lijkt effectiever dan de
andere twee. **Niet** aanbevolen: orale semaglutide (beperkt bewijs), metformine
(beperkt effect en niet geregistreerd voor deze indicatie), en tirzepatide, dat
wordt uitdrukkelijk **afgeraden** wegens te weinig ervaring, te veel
onzekerheid over de veiligheid en zeer hoge kosten.

**Waarom dit ertoe doet voor een commercieel product.** Het verschil tussen
BMI ≥ 27-met-comorbiditeit en BMI ≥ 35-met-comorbiditeit-ná-een-jaar-GLI is het
verschil tussen "de meeste mensen met overgewicht" en "een kleine, scherp
afgebakende groep". Een app die de eerste grens toont, wekt bij vrijwel iedere
bezoeker de verwachting dat medicatie voor hem is. Dat is niet alleen
onzorgvuldig, het is commercieel riskant: de huisarts bij wie die verwachting
landt, zegt nee.

Een app die de Nederlandse trap eerlijk laat zien, doet het omgekeerde. Hij is
het enige product in de markt dat de gebruiker vooraf vertelt wáár hij staat.

---

## 2. De Nederlandse trap, en waar deze app op staat

```
  leefstijl (eigen beheer)
        ↓  verwijzing huisarts nodig
  GLI, gecombineerde leefstijlinterventie          ← volledig vergoed
        ↓  ≥ 1 jaar, < 10 % gewichtsverlies
  medicatie (extra aanbod, facultatief)             ← niet vergoed
        ↓
  bariatrische chirurgie (BMI ≥ 40, of ≥ 35 + comorbiditeit)
```

**Over de GLI, want dat is de trede die er wél is en die vergoed wordt:**

- Duur: **twee jaar** (behandelfase + onderhoudsfase).
- **Volledig vergoed uit de basisverzekering, zonder eigen risico en zonder
  eigen bijdrage**, preventieve zorg.
- **Verwijzing van de huisarts is verplicht.** Zonder verwijzing geen deelname
  en geen vergoeding. De huisarts (of cardioloog/internist) toetst of er een
  matig verhoogd gewichtsgerelateerd gezondheidsrisico (GGR) is.
- Erkende programma's: **BeweegKuur**, **SLIMMER**, **CooL**, **Samen Sportief in
  Beweging**, en sinds januari 2023 ook **X-Fittt GLI**, **Keer Diabetes2 Om
  GLI** en **Keer Diabetes2 Om (intensieve GLI)**.
- Behandelfase verschilt per programma: 6,5 maanden (SLIMMER), 8 maanden (CooL),
  12 maanden (BeweegKuur, Samen Sportief in Beweging). CooL is het enige
  programma dat door één persoon wordt gegeven, een leefstijlcoach.

**Waar BennaHealth staat.** Op de bovenste trede, en náást alle andere. De app
is geen GLI en wordt niet vergoed, maar hij is wél het enige onderdeel dat
dóórloopt: tijdens de GLI, tijdens de medicatie, en in de jaren erna. Dat is
strategisch de interessantste plek, zie §7.

---

## 3. Wat de middelen doen, met hun getallen

Alle percentages zijn **gemiddelden uit gerandomiseerd onderzoek bij
geselecteerde deelnemers, met leefstijlbegeleiding erbij**. In de praktijk vallen
ze lager uit; hoeveel lager is niet goed bekend.

| Middel | Onderzoek | Duur | Gemiddeld gewichtsverlies |
|---|---|---|---|
| semaglutide 2,4 mg | STEP-1 | 68 weken | **17,3 %** |
| tirzepatide 15 mg | SURMOUNT-1 | 72 weken | **~22,5 %** (>50 % van deelnemers verloor ≥ 20 %) |
| orale semaglutide 14 mg | (|) | 5–10 % (NHG: niet aanbevolen) |

SURMOUNT-5 vergeleek tirzepatide rechtstreeks met semaglutide en vond tirzepatide
superieur.

**Vergoeding in Nederland (stand 2026).** Het Zorginstituut adviseerde in juli
2024 tégen opname van semaglutide (Wegovy) in het basispakket; de minister van
VWS nam dat advies over. Het instituut noemt het middel *bewezen effectief voor
gewichtsverlaging*, maar kan niet vaststellen bíj welke patiënten het tot de
meeste gezondheidswinst leidt, er is geen onderzoek naar verantwoord afbouwen, en
het is onbekend of langdurig gebruik blijvend effectief is. Opname werd
"maatschappelijk niet te verantwoorden" genoemd, mede vanwege het wereldwijde
tekort voor mensen met diabetes type 2.

Per 2026 zijn de middelen beschikbaar maar **niet vergoed** bij obesitas zonder
DM2. Bij DM2 gelden aparte GVS-voorwaarden. De kostenschatting in
`glp1MedicationReference.js` (€ 150–350 per maand) sluit aan bij wat er publiek
over bekend is.

---

## 4. Wat er gebeurt als je stopt, en waarom dat het hart van het aanbod is

**STEP-1-extensie** (Wilding e.a., *Diabetes, Obesity and Metabolism*, 2022; 327
deelnemers, één jaar na staken):

- Deelnemers wonnen **tweederde van het verloren gewicht terug**.
- Netto van start tot week 120: **−5,6 %** (was −17,3 % op week 68).
- Van de deelnemers hield **48,2 %** op week 120 nog ≥ 5 % verlies vast.
- **17,7 %** zat op of boven het startgewicht.

> Hier stond eerst ~43 % voor de ≥ 5 %-groep, en ~24 % voor ≥ 10 %. Bij de naloop van
> 20 september 2026 bleek de extensie zelf 48,2 % te geven; dat is rechtgezet in het
> boekje en hier. Het getal voor ≥ 10 % is bij die naloop niet opnieuw tegen de bron
> gelegd en staat daarom niet meer in de app. Zie `VERANTWOORDING.md` §25.

Cardiometabole verbeteringen liepen mee terug.

Dit is het belangrijkste getal in dit hele bestand. Het zegt dat de medicatie
niet het probleem oplost maar het openhoudt, en dat álles afhangt van wat er
tijdens en na de behandeling gebeurt. Precies dáár zit ruimte voor een app.

---

## 5. Spiermassa: het gat waar bijna niemand in zit

Wat er verloren gaat bij snel gewichtsverlies is niet alleen vet.

- **STEP-1 lichaamssamenstellingssubstudie**: ongeveer **40 %** van het verloren
  gewicht op semaglutide was vetvrije massa.
- **SURMOUNT-1 substudie**: ongeveer **25 %** bij tirzepatide.

Risicofactoren voor spierverlies: leeftijd boven 65, bestaande sarcopenie, een
eiwitinname onder 1,2–1,6 g/kg per dag, weinig beweging en vermoeidheid, en een
hogere dosis.

Wat ertegen helpt is niet omstreden:

- **Eiwit 1,2–1,6 g/kg per dag.**
- **Krachttraining**, 3–5× per week in de gerapporteerde series.
- **Meten** van lichaamssamenstelling in plaats van alleen gewicht.

In een reeks casussen (2025) van mensen op semaglutide of tirzepatide die
krachttraining deden en op eiwit letten, veranderde de vetvrije massa met −6,9 %,
+2,5 % en +5,8 %, bij een totaal gewichtsverlies van 13–33 %. Een cohort van 200
volwassenen met krachttrainingsinstructie en individuele eiwitbegeleiding verloor
~13 % gewicht bij ~3 % spiermassa in zes maanden.

*Let op het soort bewijs: casusreeksen en cohorten, geen gerandomiseerd
onderzoek. De richting is consistent, de grootte van het effect niet vast te
pinnen.*

**Waarom dit hier bijzonder is.** BennaHealth rekent al met een eiwitdoel per
kilo gecorrigeerd gewicht, telt al krachtsessies als eigen doel, en heeft sinds
deze week een inspanningsmodel dat matige en zware minuten apart weegt. De drie
dingen die spierverlies tegengaan zijn precies de drie dingen die deze app al
meet. Er is geen ander onderdeel van het onderzoek waar de bestaande machinerie
zó direct op aansluit.

---

## 6. De herdefinitie van obesitas (Lancet, januari 2025)

De *Lancet Diabetes & Endocrinology* Commission publiceerde op 14 januari 2025
een nieuwe definitie die BMI als enige maat loslaat.

- Obesitas = **overmaat lichaamsvet**, vast te stellen met directe meting (DEXA)
  óf met **ten minste twee antropometrische maten** (BMI, middelomtrek,
  middel-heupratio, middel-lengteratio).
- Onderscheid tussen **klinische obesitas** (een chronische ziektetoestand met
  aantoonbare orgaanschade of beperking in het dagelijks functioneren) en
  **preklinische obesitas**: overmaat vet zonder huidige schade, wel met
  verhoogd toekomstig risico.
- Voor de diagnose *klinische* obesitas is bij volwassenen ten minste één van
  **18 obesitasgerelateerde ziekten** nodig.

De bedoeling: behandeling richten op wie nú schade ondervindt, en niet op een
getal.

**Wat dat hier betekent.** BennaHealth meet al middelomtrek, BMI, bloeddruk,
rustpols en labwaarden, en heeft al SCORE2, FIB-4 en STOP-BANG. De ingrediënten
voor het onderscheid klinisch/preklinisch liggen er grotendeels al. Dat is een
tweede aansluiting die geen enkele consumenten-afvalapp heeft.

---

## 7. Wat volhouden voorspelt

Uit het **National Weight Control Registry** (mensen die ≥ 13,6 kg verlies ≥ 1
jaar vasthielden) en recent werk daarop:

- **Regelmatig wegen** is de sterkste gedragsvoorspeller. Minder vaak wegen
  hangt samen met meer terugval; wegen werkt als vroeg alarm.
- Terugval hangt verder samen met minder bewegen in de vrije tijd, minder
  dieetbeheersing, een hoger vetpercentage van de inname, en meer disinhibitie.
- Ruim **87 %** van de deelnemers hield op 5 én 10 jaar nog ≥ 10 % verlies vast,
  dat is een zwaar geselecteerde groep en geen algemene slaagkans.
- Een studie uit 2025 vond dat wie terugviel juist méér belangstelling had voor
  technologie om te registreren, maar ook meer **schuld, ontmoediging en
  lichaamsbeeldklachten** rapporteerde bij het gebruik ervan.

Die laatste bevinding is een waarschuwing aan het adres van elke app die dit
bouwt: meer meten is niet vanzelf beter. Het ontwerp bepaalt of een cijfer een
handvat is of een oordeel.

---

## 8. Waar het onderscheidend vermogen zit

Vier dingen die uit dit onderzoek volgen en die deze app al half in huis heeft:

1. **De eerlijke trap.** Vertellen wáár iemand staat in het Nederlandse traject,
   met de échte criteria. Geen enkele consumentenapp doet dit; de meeste citeren
   de bijsluiter.
2. **Spierbehoud tijdens medicatie.** Eiwit per kilo, krachtsessies en
   lichaamssamenstelling naast het gewicht. De machinerie ligt er al.
3. **Het na-traject.** Tweederde komt terug. De app die er nog is als de pen op
   is, is het product.
4. **Klinisch versus preklinisch.** Meer dan een BMI, met de maten die er al zijn.

En één ding dat geen van deze vier is maar alles eronder draagt: **de app zegt
wat hij niet weet.** Dat is in deze markt, waar de claims hard zijn en het bewijs
zacht, het enige echte verschil.

---

---

# Deel 2: de kennisbank van ProVita Care, en wat er in ontbreekt

*Toegevoegd 19 september 2026, na het doorlezen van de repository `akbenna/provita-care`.*

## 9. Wat er al ligt, en het is veel

ProVita Care heeft een kennisbasis die beter georganiseerd is dan de meeste
klinische software die ik ken.

**`docs/RICHTLIJNEN_REGISTER.md`**, een levend register van elke klinische
richtlijn in het platform, met per richtlijn de versie die draait, de nieuwste
versie, de status, en de bestanden die eraan hangen. Inclusief een
impactanalyse-procedure bij elke update en een tabel met bekende discrepanties
tussen NHG en ESC, mét de keuze welke het platform volgt en waarom. Laatst
bijgewerkt 5 februari 2026.

Wat erin staat: NHG-Standaard CVRM 2024 v3.1, ESC SCORE2 / SCORE2-OP /
SCORE2-Diabetes, ESC/EAS Dyslipidaemie 2019 + focused update 2025, NHG M01 DM2
met de herziening van december 2024, ADA-EASD consensus 2022, CKD-EPI 2021
(race-vrij), KDIGO 2024, ESC hartfalen 2021 + FU 2023, ESC hypertensie 2023,
ESC atriumfibrilleren 2024, PHQ-9, GAD-7, AUDIT-C, eFI2.

**`docs/GLI-PROGRAMMA-ONTWERP.md`**, een programmaontwerp van 24 maanden met
zeven gedragswetenschappelijke kaders (Self-Determination Theory, COM-B,
Transtheoretisch Model, Habit Formation, Implementation Intentions, Social
Cognitive Theory, Motivational Interviewing), **26 gevalideerde BCT's uit de
Michie-taxonomie** verdeeld over behandel- en onderhoudsfase, drie pathways, en
een week-voor-week thematische structuur.

**`docs/ProVitaCareScore-Methodologie.md`**, 891 regels met de volledige
SCORE2-, SCORE2-OP- en SCORE2-Diabetes-coëfficiënten, de Nederlandse
kalibratieparameters en de verificatiebronnen.

**`src/lib/glp1MedicationReference.js`**, per middel het opbouwschema, de
bewaarcondities, injectietips, bijwerkingen met waarschuwingssignalen,
vergoedingsstatus en controleschema.

Dit is geen app met wat gezondheidsteksten erbij. Dit is een klinisch platform.

## 10. Vier gaten, en ze wijzen alle vier dezelfde kant op

### 10.1 De NHG-Standaard Obesitas staat niet in het register

Onder *Obesitas* staan drie regels: EOSS, WHO BMI-classificatie en FINDRISC. Alle
drie meetinstrumenten. **De NHG-Standaard Obesitas zelf staat er niet in**, niet
de versie van 2023 en niet de herziening van 13 oktober 2025.

Het register is bijgewerkt op 5 februari 2026, bijna vier maanden ná die
herziening. De richtlijn die het hele obesitasaanbod bepaalt is dus de enige
grote die buiten het mechanisme valt dat er juist voor gemaakt is.

Dat verklaart ook hoe §1 kon ontstaan: het register zou de discrepantie hebben
gevonden, als de richtlijn erin had gestaan.

### 10.2 Drie verschillende versies naast elkaar

| Waar | Wat er staat |
|---|---|
| `GLI-PROGRAMMA-ONTWERP.md` §2.2 | "NHG-Standaard Obesitas (2023): BMI ≥ 30 of ≥ 25 + comorbiditeit → GLI-indicatie" |
| `glp1MedicationReference.js` kop | "NHG-Standaard Obesitas 2025" als bron |
| `glp1MedicationReference.js` indicatie | de EMA-registratietekst |

De eerste is een **GLI-indicatie** en de tweede zou een **medicatie-indicatie**
moeten zijn. Dat zijn twee verschillende drempels voor twee verschillende dingen,
en ze staan nergens naast elkaar.

### 10.3 Pathway C zet de trap in de verkeerde volgorde

`GLI-PROGRAMMA-ONTWERP.md` §4.3:

> **Pathway C: GLI + GLP-1 farmacotherapie**
> Inclusiecriteria: BMI ≥ 30 + indicatie GLP-1 agonist
> Duur: 24 maanden (medicatie parallel)

En §7 laat de medicatiemodules op week 0 beginnen: intake, screening, eerste
injectie in week 2.

De NHG-Standaard vraagt het omgekeerde: **eerst ≥ 1 jaar GLI met < 10 %
gewichtsverlies, dán pas medicatie.** Parallel starten vanaf week 0 is precies
wat de standaard niet bedoelt.

Dit is geen detail van bewoording. Het bepaalt of het programma binnen de
Nederlandse richtlijn valt of ernaast, en daarmee of een huisarts eraan mee wil
werken.

*Er is een lezing waarin Pathway C wél klopt: voor wie al medicatie heeft vanuit
de tweede lijn of op eigen kosten. Maar dan hoort dat er te staan.*

### 10.4 De GLP-1-metingen tellen alles behalve spier

§7 noemt: gewicht wekelijks, buikomvang maandelijks, HbA1c per kwartaal, eGFR en
lipiden halfjaarlijks, schildklier jaarlijks, en B12/D/ijzer halfjaarlijks.

Wat er niet in staat: **lichaamssamenstelling, spierkracht, of enige maat voor
spierverlies.** Terwijl ongeveer 40 % van het verlies op semaglutide vetvrije
massa is (§5). Het programma meet zorgvuldig wat er in het bloed gebeurt en kijkt
niet naar wat er aan het lichaam verdwijnt.

In week 16 staat wél een module *"GLP-1 & Voeding Synergy, eiwitbehoefte ↑"*.
De kennis is er dus; ze is alleen niet in een meting terechtgekomen.

---

## 11. Extra bewijs: hoe je spierverlies zou meten zonder DEXA

Een DEXA-scan is de maat, maar niet haalbaar in een app of een
huisartsenpraktijk. De Europese consensus **EWGSOP2** geeft een praktische trap
die dat wel is.

**Screenen: SARC-F**, vijf vragen: kracht, hulp bij lopen, opstaan uit een
stoel, traplopen, en vallen. De eerste vier scoren 0 (geen moeite), 1 (enige
moeite) of 2 (veel moeite); vallen in het afgelopen jaar 0 (geen), 1 (1–3) of 2
(≥ 4).

De gangbare afkapwaarde **≥ 4** heeft een lage sensitiviteit en hoge
specificiteit. Wie wíl opsporen in plaats van uitsluiten, gebruikt beter **≥ 1**.
Voor een app die wil signaleren en niet diagnosticeren is dat de juiste kant van
de fout.

**Bevestigen: spierkracht:**

| Test | Afkapwaarde (EWGSOP2) |
|---|---|
| Handknijpkracht | ≤ 27 kg (man), ≤ 16 kg (vrouw) |
| Opstaan uit stoel, 5×  | > 15 seconden, of niet kunnen opstaan zonder armen |

De stoeltest vraagt **geen apparaat**. Dat is wat hem bruikbaar maakt in een app:
een stoel en een telefoon met een stopwatch. Bij geriatrische revalidatie
presteerde handknijpkracht beter dan de stoeltest, dus als maat is de stoeltest
de zwakkere, maar hij is de enige die iedereen thuis kan doen.

## 12. Extra bewijs: eiwit, en waar de zekerheid ophoudt

**De hoeveelheid.** 1,2–1,6 g/kg per dag tijdens gewichtsverlies; sommige bronnen
gaan bij actief spierbehoud naar 1,6–2,4 g/kg.

**De verdeling.** Bij ouderen is ongeveer **2,8 g leucine per maaltijd** nodig om
spieraanmaak te prikkelen, zo'n 30 g eiwit, en sommige bronnen noemen 35–40 g.
In een calorietekort is de aanmaak onderdrukt en de afbraak verhoogd, waardoor
het belangrijker wordt die drempel bij élke maaltijd te halen in plaats van het
dagtotaal ergens te halen.

**Waar de zekerheid ophoudt, en dat hoort erbij.** Onderzoek vindt een lineaire
stijging van spieraanmaak van 5 tot 20 g eiwit per maaltijd en géén significante
stijging tussen 20 en 40 g, de maximale respons is omstreden. Bij
postmenopauzale vrouwen met opzettelijk gewichtsverlies halveerde 1,2 g/kg het
verlies van vetvrije massa ten opzichte van 0,6 g/kg (17 % tegenover 37 %). Maar
in een overzicht toonden **slechts 3 van de 20 studies** een significant verschil
in verlies van vetvrije massa tussen eiwitgroepen, en maar één daarvan ging over
mensen boven de vijftig.

Het advies is dus goed onderbouwd in richting en zwak onderbouwd in grootte. Een
app die "1,6 g/kg behoudt je spieren" zegt, belooft meer dan het bewijs draagt.

**Wat dit betekent voor BennaHealth.** De app rekent al met een eiwitdoel per
kilo gecorrigeerd gewicht en zegt al *"streef naar drie tot vier maaltijden van
54 tot 65 g eiwit met minstens drie uur ertussen"*. Dat getal komt nu uit een
deling van het dagtotaal. De literatuur zegt dat er ook een **ondergrens per
maaltijd** bestaat die daar los van staat, en dat die ondergrens juist in een
tekort het meest telt.

## 13. Extra bewijs: bot en micronutriënten

**Bot.** Hier spreekt het bewijs zichzelf tegen en dat hoort gezegd:

- 52 weken semaglutide verlaagde de botdichtheid van de heup met **2,6 %** en van
  de lendenwervels met **2,1 %** ten opzichte van placebo, met verhoogde
  botafbraak zonder compenserende aanmaak. Het verlies aan de heup was
  evenredig met het gewichtsverlies.
- Een meta-analyse bij diabetes type 2 vond juist een **statistisch significante
  verbetering** van botdichtheid en enkele botmarkers.

Twee verschillende populaties, twee verschillende uitkomsten. Wat er overblijft
is dat snel gewichtsverlies bot kost en dat GLP-1 daar mogelijk bovenop komt,
niet hoeveel.

**Micronutriënten.** Wie fors minder eet, krijgt van alles minder binnen. In
cohorten onder GLP-1-gebruikers namen diagnoses van mineraaltekorten toe, onder
meer **zink en selenium**. Calcium en vitamine D zijn de twee waar het meest op
gelet wordt: 1.000–1.200 mg calcium per dag boven de vijftig, en vitamine D.

**En daar komt iets samen.** Deze app kreeg deze week een vitamine D-regel op
grond van de Gezondheidsraad, leeftijd, geslacht, zon. Dat advies staat er om
botten, en het botverhaal hierboven maakt hem tijdens een GLP-1-traject alleen
maar relevanter. Dezelfde regel, twee onafhankelijke redenen.

---

## 14. Wat de twee samen kunnen dat geen van beide alleen kan

ProVita Care heeft het klinische apparaat: richtlijnen, risicomodellen,
behandelplannen, een programmaontwerp van 24 maanden, en een arts in de lus.

BennaHealth heeft de dagelijkse meting en één stelregel die het hele ontwerp
draagt: **geen getal zonder zijn onzekerheid.**

De vier gaten uit §10 zijn precies de vier dingen die BennaHealth al meet of bijna
meet:

| Gat in ProVita | Wat BennaHealth heeft |
|---|---|
| geen maat voor spierverlies | eiwitdoel per kilo, krachtsessies, inspanningsminuten matig/zwaar |
| eiwitbehoefte als module, niet als meting | eiwit per maaltijd, per dag, met bandbreedte |
| geen dagelijkse gewichtstrend | EMA-trend met onzekerheidsband, en het verbruik dat eruit volgt |
| medicatie-indicatie ontbreekt | de trap zelf is nog nergens gebouwd, in geen van beide |

Die laatste rij is de belangrijkste: **niemand heeft hem.** De eerlijke
Nederlandse trap (waar sta je, wat is de volgende trede, en waarom nog niet de
trede daarna) bestaat in geen van beide codebases. Dat is geen gat maar de
opening.

## Wat er nog na moet vóór er code van gemaakt wordt

1. **De NHG-Standaard Obesitas 2.0 zelf nalezen** op de precieze formulering van
   de medicatiecriteria. Alles in §1 komt uit samenvattingen; de proxy blokkeert
   de bron. Dit is de enige plek in dit bestand waar tweedehands niet genoeg is.
2. **`glp1MedicationReference.js` rechtzetten**: registratie-indicatie en
   NHG-indicatie zijn twee verschillende velden en horen beide te bestaan.
3. **De NHG-Standaard Obesitas opnemen in `docs/RICHTLIJNEN_REGISTER.md`**, zie
   §10.1. Zonder die regel blijft de richtlijn die het hele obesitasaanbod
   bepaalt buiten het mechanisme dat daarvoor gemaakt is.
4. **Pathway C herzien of herformuleren**, zie §10.3. Ofwel de volgorde van de
   standaard volgen, ofwel expliciet maken dat het pad bedoeld is voor wie al
   medicatie heeft.
5. **provitacare.nl** is van hier niet te bereiken. Wat daar staat aan aanbod,
   doelgroep en claims moet erbij voordat de koppeling ontworpen wordt.
6. **Tirzepatide-vergoeding**: het bestand noemt een GVS-advies van maart 2026.
   Niet geverifieerd.
7. **De botuitkomsten** spreken elkaar tegen (§13). Voordat hier iets over op een
   scherm komt, hoort uitgezocht te worden welke populatie welke uitkomst gaf.

## Bronnen

- NHG-Standaard Obesitas 2.0 (13 oktober 2025), via samenvattingen van
  [NHG](https://www.nhg.org/praktijkvoering/praktijksituaties-gewichtsreducerende-medicatie/),
  [Huisarts & Wetenschap](https://www.henw.org/artikelen/nhg-standaard-obesitas-herzien-beperkte-plaats-voor-gewichtsreducerende-medicatie),
  [NVD](https://nvdietist.nl/nieuws/herziene-nhg-standaard-obesitas/),
  [Ned. Tijdschrift voor Diabetologie](https://link.springer.com/article/10.1007/s12467-025-1605-z)
- [Zorginstituut Nederland: advies Wegovy niet vergoeden (juli 2024)](https://www.zorginstituutnederland.nl/actueel/nieuws/2024/07/16/wegovy-niet-vergoeden-uit-basispakket)
- [RIVM: GLI-programma's](https://www.rivm.nl/gecombineerde-leefstijlinterventie/programmas)
- [Wilding e.a., STEP-1-extensie, *Diabetes Obes Metab* 2022](https://dom-pubs.onlinelibrary.wiley.com/doi/10.1111/dom.14725)
- [SURMOUNT-1 (NEJM)](https://www.nejm.org/doi/full/10.1056/NEJMoa2410819)
- [Lancet Commission: Redefining obesity (jan 2025)](https://www.thelancet.com/journals/landia/article/PIIS2213-8587(25)00004-X/fulltext)
- [Lean mass preservation bij GLP-1, *Metabolites* 2025](https://www.mdpi.com/2218-1989/16/6/364)
- [Casusreeks behoud vetvrije massa, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12536186/)
- [NWCR: zelfmonitoring en terugval (2025)](https://pubmed.ncbi.nlm.nih.gov/40950752/)
- [EWGSOP2: Sarcopenia: revised European consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC6322506/)
- [SARC-F sensitiviteit bij afkapwaarde ≥1 (2025)](https://xmed.jmir.org/2025/1/e54475)
- [Handknijpkracht versus stoeltest, RESORT, *Age and Ageing* 2022](https://academic.oup.com/ageing/article/51/11/afac242/6834150)
- [Eiwitkwantiteit en -verdeling en lichaamssamenstelling, *Front Nutr* 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11099237/)
- [Eiwit en behoud vetvrije massa bij postmenopauzale vrouwen, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8255642/)
- [Botdichtheid en botmarkers bij GLP-1 bij ouderen, *Front Aging* 2025](https://www.frontiersin.org/journals/aging/articles/10.3389/fragi.2025.1691007/full)
- [Meta-analyse botdichtheid GLP-1 bij DM2 (2025)](https://pubmed.ncbi.nlm.nih.gov/39985672/)

### Uit de eigen repository `akbenna/provita-care`

- `docs/RICHTLIJNEN_REGISTER.md` (5 februari 2026)
- `docs/GLI-PROGRAMMA-ONTWERP.md` v1.0
- `docs/ProVitaCareScore-Methodologie.md`
- `src/lib/glp1MedicationReference.js`
