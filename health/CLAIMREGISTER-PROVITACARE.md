# Claimregister provitacare.nl — wat er staat, waar het vandaan komt, en waar het botst

*Opgesteld 20 september 2026, als voorwerk voor module D (de brug naar de praktijk).*

Module D verwijst vanuit BennaHealth naar provitacare.nl. Die brug is alleen wat
waard als beide kanten hetzelfde zeggen. Stuurt de app iemand naar een site die
hem iets anders belooft, dan is de eerlijkheid die in `trap.ts` is ingebouwd
onderweg weg — en dan is de app medeplichtig aan de verwachting die bij de
huisarts stukloopt.

Dit bestand is dus geen audit om het auditen. Het is de lijst die eerst moet
kloppen voordat de verwijzing gebouwd kan worden.

## Hoe dit is nagelopen, en wat het niet kan zien

Gelezen in de clone van `akbenna/provita-care`, commit `57eda9c` van 18 september
2026. De publieke teksten staan in `src/lib/i18n.home.js` — **zeven talen**: Nederlands,
Engels, Duits, Turks, Arabisch, Pools en Oekraïens — en in `src/pages/Home.jsx`.

De toetssteen is de **NHG-Standaard Obesitas, augustus 2026** — dezelfde bron
waarmee in BennaHealth de medicatietrede is opengezet.

**Wat dit niet kan zien, en dat is zelf een bevinding.** Drie van de meest
opvallende getallen op de voorpagina staan níét in de repo:

| wat | waar het vandaan komt |
|---|---|
| de drie cijfers onder *"Wetenschappelijk onderbouwd"* | `segUspStats` — segmentinhoud uit de database, via een adminscherm |
| *"Intakes afgerond"*, *"Gebruikersrating"* en de andere vier tellers | `home.social.stat*` — labels in de repo, getallen uit de database |
| de pakketprijzen | `pkg.price_cents` uit de database |

Die staan dus buiten versiebeheer en buiten elke review. Wie ze aanpast laat geen
spoor na, en niemand ziet het langskomen. Voor cijfers die naast het woord
"wetenschappelijk" staan is dat de verkeerde plek. Aanbeveling: zet de
onderbouwde getallen in de code mét hun bron ernaast, en houd het adminscherm
voor wat werkelijk verandert.

---

## 1. De claim die het meest knelt: tirzepatide

Op de voorpagina, onder de kop **"Bewezen resultaten uit onderzoek"**, met de
ondertitel *"Wat de wetenschap laat zien over onze aanpak"* en het label
**"Verwacht resultaat"**, staat in alle zeven talen:

> Klinische studies tonen 10-15% gewichtsverlies na 12 maanden behandeling met
> semaglutide of **tirzepatide**.

`src/lib/i18n.home.js`, sleutel `home.results.item1Quote`, regels 79, 335, 591,
847, 1103, 1359 en 1615.

De NHG-Standaard Obesitas zegt over datzelfde middel, letterlijk:

> Tirzepatide (GIP/GLP1-agonist) wordt **afgeraden** omdat hier nog nauwelijks
> ervaring mee opgedaan is, er nog te veel onzekerheid is over de veiligheid en
> de kosten zeer hoog zijn.

En elders op diezelfde voorpagina staat, boven een rij logo's met NHG, ESC, RIVM,
WHO en het Voedingscentrum:

> Onze programma's volgen de richtlijnen van…

Dat is de kern van het probleem. Niet dat tirzepatide genoemd wordt — het bestaat
en mensen komen het tegen — maar dat het als **verwacht resultaat van dit
programma** staat op een pagina die twee schermen hoger belooft de NHG-richtlijn
te volgen. Dat is dezelfde soort fout als in `src/lib/glp1MedicationReference.js`,
die de EMA-registratietekst als indicatie opvoert met de NHG als bron. Alleen
staat deze op de voorpagina in plaats van in een bibliotheekbestand, en in alle
zeven talen die de taalkiezer aanbiedt.

Twee daarvan — Turks en Arabisch — zijn precies de groepen waarvoor de standaard
de **lágere** BMI-drempels geeft. Voor hen is er dus én een drempel die je niet
noemt (32,5 in plaats van 35), én een middel dat je wél noemt maar dat de
richtlijn afraadt. Dat is de ongelukkigste combinatie die er is: je onderschat
wie in aanmerking komt en overschat waarmee.

**Wat eraan te doen is.** Haal tirzepatide uit de resultaatclaim. Wil je het
noemen, noem het dan waar het thuishoort: bij wat de richtlijn erover zegt. Dat
is bovendien sterker — je bent dan de partij die het uitlegt in plaats van de
partij die het aanprijst.

---

## 2. De vergelijkingstabel

`src/pages/Home.jsx`, regels 1050–1054. Vier regels concurrentie en één eigen
regel:

| optie | prijs | begeleiding | resultaat |
|---|---|---|---|
| **ProVita Care** | €0-149/mnd | arts + coach | **10-15% gewichtsverlies** |
| Particuliere kliniek | €1.500-3.000 | arts | 10-15% |
| Alleen medicatie | €150-300/mnd | geen | 5-10% |
| Diëtist regulier | €50-80/sessie | diëtist | 3-5% |
| Zelf proberen | gratis | geen | < 3% |

Eronder: *"Prijzen zijn indicatief. Resultaten gebaseerd op wetenschappelijk
onderzoek, individuele resultaten kunnen variëren."*

Dit is het onderdeel met het grootste risico, om drie redenen.

**De 10-15% is het cijfer van een medicijn, niet van deze dienst.** Het komt uit
dezelfde bron als claim 1 — de semaglutide/tirzepatide-studies — en staat hier
als uitkomst van *ProVita Care*. Wie het leest ziet een dienst die evenveel
oplevert als een kliniek van drieduizend euro. Wat er werkelijk staat is: dit
medicijn doet dat.

**De rij "Alleen medicatie: 5-10%" klopt niet met de standaard.** Tabel h6 van de
NHG geeft per middel het gemiddelde gewichtsverlies:

| middel | NHG, tabel h6 |
|---|---|
| liraglutide 3 mg | 4,3% |
| semaglutide 2,4 mg | 11,8% |
| naltrexon/bupropion | 4,5% |

En de voetnoot eronder is beslissend:

> \* Gemiddeld gewichtsverlies bij gebruik **als aanvulling op een (gecombineerde)
> leefstijlinterventie**.

Die cijfers zijn dus al mét begeleiding erbij. Voor twee van de drie aanbevolen
middelen is het gemiddelde 4,3% en 4,5% — minder dan de 5-10% die de tabel aan
"alleen medicatie" toeschrijft, en fors minder dan de rij "diëtist regulier"
suggereert dat medicatie verslaat.

**En daarmee valt de vergelijking om.** De tabel zet "medicatie zonder
begeleiding" tegenover "medicatie met begeleiding" om het verschil te laten zien.
Maar het getal dat de bovenste rij draagt is al inclusief begeleiding. Je
vergelijkt het middel met zichzelf.

**Wat eraan te doen is.** Twee mogelijkheden, en de tweede is beter:

1. Zet bij elke rij de bron en het jaartal, en corrigeer de medicatierij naar de
   NHG-cijfers per middel.
2. Laat de resultaatkolom weg. Een prijsvergelijking met begeleidingsniveau is
   eerlijk en overtuigend genoeg; een uitkomstkolom waarin je je eigen dienst een
   percentage geeft is een belofte die je niet kunt waarmaken — en de enige rij
   waar je hem écht nodig hebt is de rij van de concurrent.

---

## 3. De overige claims, en wat ze nodig hebben

| # | claim | waar | status |
|---|---|---|---|
| 3.1 | *"Leefstijlinterventies kunnen het cardiovasculair risico met tot 80% verlagen bij consistente toepassing."* | `home.results.item2Quote` | **Bovengrens zonder populatie.** "Tot 80%" is het hoogste getal uit een reeks; zonder wie, hoe lang en ten opzichte waarvan zegt het niets. Vervang door de mediaan of het bereik mét de studiepopulatie. |
| 3.2 | *"Gecombineerde aanpak (medicatie + coaching) geeft 35-55% succeskans vs 3-5% zonder begeleiding."* | `home.results.item3Quote` | **"Succes" is niet gedefinieerd.** Bij ≥5% gewichtsverlies zijn dit andere getallen dan bij ≥10%. De 3-5% komt uit oude dieetliteratuur en staat hier als contrast. Definieer de drempel, of laat de vergelijking vallen. |
| 3.3 | *"Gemiddeld 30% reductie in ziekteverzuim binnen 6 maanden door preventie."* | `biz.benefit1Desc` | **Eigen uitkomstclaim, bron onbekend.** Dit is de claim waar een werkgever een contract op tekent. Hij hoort een vindplaats te hebben. |
| 3.4 | *"89% van deelnemers beveelt het programma aan bij collega's."* | `biz.benefit3Desc` | **Eigen meting, n onbekend.** Zet het aantal respondenten erbij. 89% van negen is iets anders dan 89% van negenhonderd. |
| 3.5 | *"Bewezen resultaten bij 47+ organisaties in Nederland"* | `biz.*` | **"Bewezen" draagt hier niets.** 47 organisaties is een klantental, geen bewijs. Noem het een klantental — dat is op zichzelf goed nieuws. |
| 3.6 | *"Even effectief als fitness voor buikomvang (−1,8 cm in 12 wk)"* | `home.taichi.card2Body` | **Dit is de best onderbouwde claim op de pagina.** Getal, eenheid, tijdsduur en vergelijking staan er alle vier. Voetnoot noemt zes peer-reviewed studies. Zo hoort het; dit is het model voor de rest. |
| 3.7 | *"Gebaseerd op 6 peer-reviewed studies"* | `home.taichi.footnote` | Goed, maar noem ze. Eén klikbare lijst maakt het verifieerbaar in plaats van geloofwaardig. |
| 3.8 | *"Klinisch gevalideerde calculators (SCORE2, FINDRISC, EOSS)"* | `home.platform.dashDesc` | **Correct, en precies geformuleerd.** De *calculators* zijn gevalideerd — er staat niet dat het platform dat is. Dit onderscheid is goed gemaakt. |
| 3.9 | De rij logo's NHG/ESC/RIVM/WHO/Voedingscentrum onder *"Onze programma's volgen de richtlijnen van"* | `Home.jsx` 1016-1021 | **Formulering deugt** (volgen ≠ goedgekeurd door). Maar zolang claim 1 op dezelfde pagina staat, spreekt de pagina zichzelf tegen. Los claim 1 op, en deze rij wordt je sterkste troef. |

De twee disclaimers (`home.science.disclaimer` en `home.pricing.disclaimer`)
dekken "resultaten kunnen per individu verschillen". Dat dekt spreiding rond een
juist gemiddelde. Het dekt niet dat het gemiddelde van een ander product komt.

---

## Wat dit betekent voor module D

De brug wordt pas gebouwd nadat claim 1 en 2 opgelost zijn. Zolang ze er staan
zou BennaHealth iemand met "de app beoordeelt je BMI-drempel niet, dat doet je
huisarts" doorsturen naar een pagina die hem 10-15% in het vooruitzicht stelt.
Dat verschil merkt de lezer, en het is het soort verschil dat het vertrouwen in
allebei kost.

Daarna is de verwijzing juist sterk, want dan zegt hij iets wat niemand anders
zegt: *hier staat wat de richtlijn vraagt, en hier is een plek die het volgens
die richtlijn doet.*

Drie dingen zijn nog nodig voordat module D gebouwd kan worden:

1. **De pakketprijzen** — die staan in de database, niet in de repo. Een
   schermafdruk van het prijzenscherm volstaat.
2. **De doelgroep zoals ProVita hem zelf omschrijft** — de repo toont drie
   pakketten (Basis met AI-coach, Coach+ met persoonlijke leefstijlcoach en
   WhatsApp, en een derde met maandelijks videoconsult met een arts) plus twee
   zakelijke lijnen. Wie daarvoor in aanmerking komt staat er niet.
3. **Een besluit over de claims hierboven.** Niet mijn besluit — het is jouw
   bedrijf. Maar module D verwijst naar wat er staat, en dit is wat er staat.
