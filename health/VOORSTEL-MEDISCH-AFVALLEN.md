# Voorstel: hoe het onderzoek aan de app komt te hangen

*Fase 2 van drie. Leest op `ONDERZOEK-MEDISCH-AFVALLEN.md`; bouwt nog niets.*
*19 september 2026.*

## De gedachte in één alinea

BennaHealth wordt niet nóg een afvalapp met een medische sausje. Hij wordt de
**dagelijkse meetlaag van een medisch traject**, het enige onderdeel dat
doorloopt tijdens de GLI, tijdens de medicatie, en in de jaren daarna. Twee
dingen maken hem onderscheidend, en ze volgen allebei rechtstreeks uit het
onderzoek: hij vertelt eerlijk **waar je staat in het Nederlandse traject**, en
hij bewaakt **wat er van je spieren overblijft**. Geen van beide bestaat in
ProVita Care, en geen van beide bestaat in de markt.

---

## Vier modules, en waarom in deze volgorde

De volgorde hieronder is niet die van belangrijkheid maar van **afhankelijkheid**.
Module A is het onderscheidendst en staat toch niet voorop, omdat hij wacht op
iets wat alleen jij kunt leveren.

| | Module | Blokkeert op | Bouwbaar |
|---|---|---|---|
| **1** | **B: Spierbehoud** | niets | nu |
| **2** | **C: Verdiepen** | niets | nu |
| **3** | **A: De trap** | NHG-criteria geverifieerd | na jouw nalezing |
| **4** | **D: De brug naar de praktijk** | provitacare.nl | na jouw aanlevering |

---

## Module B: Spierbehoud *(eerst, want niets blokkeert)*

**Het gat.** Ongeveer 40 % van wat je op semaglutide verliest is vetvrije massa
(§5). ProVita's GLP-1-traject meet gewicht, buikomvang en zeven labwaarden en
kijkt naar geen enkele maat voor spier (§10.4). Een DEXA-scan is de maat maar
niet haalbaar.

**Wat erbij komt.** Eén nieuwe rekenmodule, in de zuivere kern, plus één kaart.

`src/health/spier.ts`: zuivere functies, geen React, geen database:

- `sarcf(antwoorden)` → score 0–10, met de twee afkapwaarden en hun betekenis
  (≥ 1 opsporen, ≥ 4 uitsluiten). Het scherm gebruikt ≥ 1: bij signaleren hoort
  de fout die kant op te vallen.
- `stoeltest(seconden)` → onder/boven de 15 seconden, met wat dat betekent.
- `eiwitPerMaaltijd(regels)` → haalt élke maaltijd de leucinedrempel van ~30 g?
  De app rekent nu een dagtotaal en deelt dat door drie; dit is een **tweede,
  onafhankelijke** toets die in een tekort zwaarder telt.
- `spierbeeld(...)` → de drie hefbomen bij elkaar: eiwit, kracht, en wat de
  screener zegt. Geen score, geen cijfer: drie regels die zeggen wat er staat
  en wat er ontbreekt.

**Wat het scherm doet.** Een kaart op Beweging of Profiel, met drie regels:

```
Eiwit          2 van 3 maaltijden boven de drempel      gisteren
Kracht         2 van 3 sessies deze week
Opstaan        11 seconden                              3 weken geleden
```

En daaronder, altijd, de zin die deze app van de rest onderscheidt: *wat hiervan
bewezen is en wat niet.* De richting van het bewijs is sterk, de grootte zwak
(§12). Dat hoort er te staan, niet in een voetnoot.

**Waarom dit als eerste.** Het gebruikt uitsluitend wat er al is (eiwit per
maaltijd, krachtsessies, de inspanningsminuten van deze week) en het voegt één
meting toe die geen apparaat vraagt. Het is de goedkoopste module en de
inhoudelijk zwaarste.

**Kosten.** Eén bestand van ~200 regels in de kern, ~30 proeven, één kaart, één
vragenlijstje van vijf vragen. Eén SQL-bestand voor `kal_spiermeting`.

---

## Module C: Verdiepen *(de plek waar klanten zich kunnen inlezen)*

**Wat je vroeg.** Een plek waar klanten zich kunnen verdiepen. De app heeft daar
al een vorm voor: `Uitleg`, de uitklapbare *"waarom dit zo is"* onder elke
kaart, met de bron erbij.

**Het voorstel is om dat niet uit te breiden maar te verdubbelen.** De korte
`Uitleg` blijft waar hij staat, en er komt een eigen scherm **Verdiepen** met
langere stukken. Elk stuk heeft dezelfde vier onderdelen:

1. **Wat we weten**: het getal, met zijn onderzoek en zijn n.
2. **Wat we niet weten**: expliciet, geen voetnoot.
3. **Wat jij eraan hebt**: de brug naar jouw eigen cijfers in deze app.
4. **Waar dit vandaan komt**: de bron, klikbaar.

**De eerste acht stukken**, en ze staan alle acht al in het onderzoek:

| Stuk | Kern |
|---|---|
| De Nederlandse trap | GLI, medicatie, chirurgie, en waarom die volgorde |
| Wat GLP-1 doet | werking, opbouwschema, bijwerkingen, waarschuwingssignalen |
| Wat er gebeurt als je stopt | tweederde terug (STEP-1-extensie, n=327) |
| Waarom eiwit nu meer telt | de drempel per maaltijd, en waar de zekerheid ophoudt |
| Wat je verliest naast vet | 45 % tegenover 25 %, en wat ertegen helpt |
| Bot, en waarom het bewijs botst | −2,6 % heup tegenover een meta-analyse die verbetering vond |
| Meer dan een BMI | de Lancet-herdefinitie: klinisch tegenover preklinisch |
| Wat volhouden voorspelt | wegen als vroeg alarm, en de valkuil van meten |

Dat laatste stuk hoort er nadrukkelijk bij: wie terugviel had juist **méér**
belangstelling voor registratietechniek, en rapporteerde meer schuld en
ontmoediging (§7). Een app die dat zelf benoemt is geloofwaardiger dan een app
die het verzwijgt.

**Kosten.** Eén gegevensbestand met acht stukken, één scherm, geen rekenwerk.
Het meeste schrijfwerk is al gedaan, het staat in het onderzoeksbestand.

---

## Module A: De trap *(het onderscheidendst, en het wacht)*

**Het gat.** Niemand heeft dit. Niet ProVita, niet de markt. De vraag *"waar sta
ik, en wat is de volgende stap"* wordt nergens eerlijk beantwoord, omdat het
eerlijke antwoord voor de meeste mensen "nog niet" is.

**Wat erbij komt.** `src/health/trap.ts`, zuivere functies:

```
trede(profiel, dagen, gli) → {
  nu:        'leefstijl' | 'gli' | 'medicatie-in-beeld' | 'verwijzing',
  volgende:  wat de eerstvolgende trede vraagt,
  waarom:    per criterium: gehaald / niet gehaald / niet bekend,
  bron:      de richtlijn en het jaartal
}
```

Wat de app hier al voor heeft: lengte, gewicht en dus BMI; middelomtrek;
comorbiditeit (`dm2`, `hypertensie`, `hvz`) uit *Wat er bij jou speelt*;
leeftijd; en een gewichtsreeks waaruit het verloop over een jaar te lezen is.

Wat erbij moet: **of je in een GLI zit, sinds wanneer, en welk programma**. Drie
velden.

**Drie regels die niet onderhandelbaar zijn.**

1. **De app zegt nooit dat je in aanmerking komt.** Hij zegt wat de richtlijn
   vraagt en wat hij van jou weet. Het oordeel is van de huisarts. Dat is niet
   voorzichtigheid maar juistheid: de standaard laat de huisarts uitdrukkelijk
   vrij om dit aanbod niet te leveren.
2. **Registratie-indicatie en NHG-indicatie staan naast elkaar**, met hun
   verschil benoemd. Dat verschil ís de informatie.
3. **"Niet bekend" is een eigen uitkomst**, naast gehaald en niet gehaald. Geen
   leeftijd, geen GLI-gegevens, geen jaar aan wegingen, dan zegt de app dat, en
   niet "je voldoet niet".

**Waarom hij wacht.** De criteria in §1 komen uit samenvattingen; de proxy
blokkeert `nhg.org`. Voor een tekst in een onderzoeksbestand is dat genoeg. Voor
een regel die op iemands scherm bepaalt of hij naar zijn huisarts stapt, niet.

**Wat ik van jou nodig heb.** De medicatieparagraaf van de NHG-Standaard
Obesitas 2.0, letterlijk. Een schermafdruk of een plakje tekst volstaat, zoals
je eerder de productgegevens aanleverde toen de proxy Open Food Facts blokkeerde.

---

## Module D: De brug naar de praktijk *(en naar provitacare.nl)*

**Wat dit is.** Het punt waar de app ophoudt en de praktijk begint. Twee kanten:

**Naar de huisarts toe.** Eén samenvatting die de gebruiker meeneemt: gewicht en
trend over het gekozen venster, de band met zijn onzekerheid, wat er gemeten is
en wat niet, de trede uit module A met de criteria erbij, en de spierregels uit
module B. Eén pagina, gemaakt om te overhandigen.

Dat is ook commercieel het scherpste punt: een app die zorgt dat het consult
beter verloopt, is iets waar een praktijk aan mee wil werken.

**Naar provitacare.nl toe.** Hier stop ik met voorstellen, want ik heb de site
niet kunnen zien, de proxy blokkeert hem. Wat ik wél kan zeggen is wat ik nodig
heb om het te ontwerpen: het aanbod, de doelgroep, de tarieven, en vooral de
**claims** die er staan. Als de site iets belooft wat het onderzoek niet draagt,
is dat het eerste wat we moeten weten, niet het laatste.

---

## Hoe dit aan je engine-vraag vastzit

Je vroeg eerder hoe dit compact en herbruikbaar wordt. Alle drie de nieuwe
rekenmodules (`spier.ts`, `trap.ts`, en de eiwitdrempel) horen in de **zuivere
kern**: geen React, geen database, geen netwerk, alleen typen en getallen, met
hun proeven ernaast. Dat is dezelfde vorm als `rekenkern.ts`, `klinisch.ts` en
`inspanning.ts` nu al hebben.

Daarmee groeit de kern van 2.264 naar ruwweg 2.800 regels en blijft hij in zijn
geheel lichtbaar naar een pakket. Wat hier gebouwd wordt is dus niet alleen
functionaliteit voor BennaHealth maar ook handelswaar voor de engine.

En één ding hoort daar los bij genoemd: het **richtlijnenregister** van ProVita
is het beste stuk governance in beide repositories. Als er één ding overgenomen
hoort te worden in de andere richting, is het dat.

---

## Samengevat: wat ik nu ga doen

1. **Module B bouwen**: spierbehoud. Niets blokkeert.
2. **Module C bouwen**: Verdiepen, met de acht stukken.
3. Dan **module A**, zodra je de NHG-tekst hebt.
4. Dan **module D**, zodra ik weet wat er op provitacare.nl staat.

En twee dingen die geen module zijn maar wel gebeuren moeten, in ProVita:
`glp1MedicationReference.js` krijgt twee indicatievelden in plaats van één, en de
NHG-Standaard Obesitas komt in het richtlijnenregister.
