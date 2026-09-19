# Medisch afvallen — wat de literatuur zegt, en wat dat voor deze app betekent

*Fase 1 van drie: eerst het onderzoek, dan het voorstel, dan de bouw.*
*Opgesteld 19 september 2026.*

Dit bestand is een verslag van wat er nagezocht is en waar het vandaan komt. Het
is geen behandelrichtlijn en het schrijft niets voor. Waar een getal onzeker is,
staat dat erbij — dezelfde regel als in `VERANTWOORDING.md`.

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

---

## 1. De vondst die het meest uitmaakt: registratie is geen indicatie

`src/lib/glp1MedicationReference.js` in ProVita Care noemt als indicatie voor
Wegovy:

> Obesitas (BMI ≥ 30) of overgewicht (BMI ≥ 27) met ten minste één
> gewichtsgerelateerde comorbiditeit

Dat is juist — als **EMA-registratietekst**. Het is niet de grens waarop een
Nederlandse huisarts mag starten.

De herziene **NHG-Standaard Obesitas (versie 2.0, 13 oktober 2025)** zet die
grens veel hoger. Gewichtsreducerende medicatie komt in beeld bij:

| | |
|---|---|
| **BMI 35–39,9** | mét gewichtsgerelateerde comorbiditeit: coronaire hartziekte, beroerte, perifeer arterieel vaatlijden, DM2, slaapapneu, of artrose van een gewichtdragend gewricht |
| **BMI ≥ 40** | zonder aanvullende eis aan comorbiditeit |

En daarbovenop een voorwaarde die in geen enkel registratiedocument staat:

> Alleen voorschrijven aan patiënten die **≥ 1 jaar gemotiveerd hebben
> deelgenomen aan een (G)LI met onvoldoende gewichtsreductie (< 10 %)** en die
> aan die (G)LI blijven deelnemen — of die ná het tweejarige GLI-programma
> gemotiveerd zijn een gezonde leefstijl voort te zetten.

De standaard noemt medicatie nadrukkelijk **"aanvullend aanbod"**: de huisarts is
niet verplicht het te leveren en het is geen onderdeel van de basiszorg.
Aanbevolen middelen zijn liraglutide 3 mg, semaglutide 2,4 mg en
naltrexon/bupropion. Orale semaglutide wordt **niet** aanbevolen wegens beperkt
bewijs.

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
  GLI — gecombineerde leefstijlinterventie          ← volledig vergoed
        ↓  ≥ 1 jaar, < 10 % gewichtsverlies
  medicatie (aanvullend aanbod)                     ← niet vergoed
        ↓
  bariatrische chirurgie (BMI ≥ 40, of ≥ 35 + comorbiditeit)
```

**Over de GLI, want dat is de trede die er wél is en die vergoed wordt:**

- Duur: **twee jaar** (behandelfase + onderhoudsfase).
- **Volledig vergoed uit de basisverzekering, zonder eigen risico en zonder
  eigen bijdrage** — preventieve zorg.
- **Verwijzing van de huisarts is verplicht.** Zonder verwijzing geen deelname
  en geen vergoeding. De huisarts (of cardioloog/internist) toetst of er een
  matig verhoogd gewichtsgerelateerd gezondheidsrisico (GGR) is.
- Erkende programma's: **BeweegKuur**, **SLIMMER**, **CooL**, **Samen Sportief in
  Beweging**, en sinds januari 2023 ook **X-Fittt GLI**, **Keer Diabetes2 Om
  GLI** en **Keer Diabetes2 Om (intensieve GLI)**.
- Behandelfase verschilt per programma: 6,5 maanden (SLIMMER), 8 maanden (CooL),
  12 maanden (BeweegKuur, Samen Sportief in Beweging). CooL is het enige
  programma dat door één persoon wordt gegeven — een leefstijlcoach.

**Waar BennaHealth staat.** Op de bovenste trede, en náást alle andere. De app
is geen GLI en wordt niet vergoed, maar hij is wél het enige onderdeel dat
dóórloopt: tijdens de GLI, tijdens de medicatie, en in de jaren erna. Dat is
strategisch de interessantste plek — zie §7.

---

## 3. Wat de middelen doen, met hun getallen

Alle percentages zijn **gemiddelden uit gerandomiseerd onderzoek bij
geselecteerde deelnemers, met leefstijlbegeleiding erbij**. In de praktijk vallen
ze lager uit; hoeveel lager is niet goed bekend.

| Middel | Onderzoek | Duur | Gemiddeld gewichtsverlies |
|---|---|---|---|
| semaglutide 2,4 mg | STEP-1 | 68 weken | **17,3 %** |
| tirzepatide 15 mg | SURMOUNT-1 | 72 weken | **~22,5 %** (>50 % van deelnemers verloor ≥ 20 %) |
| orale semaglutide 14 mg | — | — | 5–10 % (NHG: niet aanbevolen) |

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

## 4. Wat er gebeurt als je stopt — en waarom dat het hart van het aanbod is

**STEP-1-extensie** (Wilding e.a., *Diabetes, Obesity and Metabolism*, 2022; 327
deelnemers, één jaar na staken):

- Deelnemers wonnen **tweederde van het verloren gewicht terug**.
- Netto van start tot week 120: **−5,6 %** (was −17,3 % op week 68).
- Van de deelnemers hield **~43 %** nog ≥ 5 % verlies vast, **~24 %** nog ≥ 10 %.
- **17,7 %** zat op of boven het startgewicht.

Cardiometabole verbeteringen liepen mee terug.

Dit is het belangrijkste getal in dit hele bestand. Het zegt dat de medicatie
niet het probleem oplost maar het openhoudt, en dat álles afhangt van wat er
tijdens en na de behandeling gebeurt. Precies dáár zit ruimte voor een app.

---

## 5. Spiermassa — het gat waar bijna niemand in zit

Wat er verloren gaat bij snel gewichtsverlies is niet alleen vet.

- **STEP-1 lichaamssamenstellingssubstudie**: ongeveer **45 %** van het verloren
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
+2,5 % en +5,8 % — bij een totaal gewichtsverlies van 13–33 %. Een cohort van 200
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
- Onderscheid tussen **klinische obesitas** — een chronische ziektetoestand met
  aantoonbare orgaanschade of beperking in het dagelijks functioneren — en
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
- Ruim **87 %** van de deelnemers hield op 5 én 10 jaar nog ≥ 10 % verlies vast —
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

## Wat er nog na moet vóór er code van gemaakt wordt

1. **De NHG-Standaard Obesitas 2.0 zelf nalezen** op de precieze formulering van
   de medicatiecriteria. Alles in §1 komt uit samenvattingen; de proxy blokkeert
   de bron. Dit is de enige plek in dit bestand waar tweedehands niet genoeg is.
2. **`glp1MedicationReference.js` rechtzetten**: registratie-indicatie en
   NHG-indicatie zijn twee verschillende velden en horen beide te bestaan.
3. **provitacare.nl** is van hier niet te bereiken. Wat daar staat aan aanbod,
   doelgroep en claims moet erbij voordat de koppeling ontworpen wordt.
4. **Tirzepatide-vergoeding**: het bestand noemt een GVS-advies van maart 2026.
   Niet geverifieerd.

## Bronnen

- NHG-Standaard Obesitas 2.0 (13 oktober 2025) — via samenvattingen van
  [NHG](https://www.nhg.org/praktijkvoering/praktijksituaties-gewichtsreducerende-medicatie/),
  [Huisarts & Wetenschap](https://www.henw.org/artikelen/nhg-standaard-obesitas-herzien-beperkte-plaats-voor-gewichtsreducerende-medicatie),
  [NVD](https://nvdietist.nl/nieuws/herziene-nhg-standaard-obesitas/),
  [Ned. Tijdschrift voor Diabetologie](https://link.springer.com/article/10.1007/s12467-025-1605-z)
- [Zorginstituut Nederland — advies Wegovy niet vergoeden (juli 2024)](https://www.zorginstituutnederland.nl/actueel/nieuws/2024/07/16/wegovy-niet-vergoeden-uit-basispakket)
- [RIVM — GLI-programma's](https://www.rivm.nl/gecombineerde-leefstijlinterventie/programmas)
- [Wilding e.a., STEP-1-extensie, *Diabetes Obes Metab* 2022](https://dom-pubs.onlinelibrary.wiley.com/doi/10.1111/dom.14725)
- [SURMOUNT-1 (NEJM)](https://www.nejm.org/doi/full/10.1056/NEJMoa2410819)
- [Lancet Commission — Redefining obesity (jan 2025)](https://www.thelancet.com/journals/landia/article/PIIS2213-8587(25)00004-X/fulltext)
- [Lean mass preservation bij GLP-1 — *Metabolites* 2025](https://www.mdpi.com/2218-1989/16/6/364)
- [Casusreeks behoud vetvrije massa — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12536186/)
- [NWCR — zelfmonitoring en terugval (2025)](https://pubmed.ncbi.nlm.nih.gov/40950752/)
