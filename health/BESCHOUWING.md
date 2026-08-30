# Wat deze reeks heeft opgeleverd, en wat er niet aan bleek te kloppen

Dit is geen samenvatting van commits — die staan in `git log`. Het is een
terugblik op wat er onderweg geleerd is, inclusief de keren dat ik het mis had,
want dat is het deel dat je anders kwijtraakt.

## De aanleiding was één klacht, en die klopte niet

Het begon met "mayonaise werkt niet". Dat leek één probleem. Het waren er vijf,
en geen ervan was wat ik als eerste dacht.

1. **Telwoorden trokken ruis omhoog.** "twee boterhammen met mayonaise" zette een
   graanreep bovenaan. Niet toevallig: achter een apostrof begint voor Postgres
   een nieuw woord, dus in `b'tween` past `twee` op woordbegin. En omdat "twee"
   in vrijwel geen productnaam voorkomt woog het zwaar — zeldzame woorden krijgen
   in deze weging het hoogste gewicht. Het telwoord uit de vraag stond daardoor
   niet onderaan maar vooraan. (`12-telwoorden-uit-het-zoeken.sql`)
2. **Een huishoudmaat pakte aantoonbaar fout uit.** Cornflakes stonden op 180 g
   per schaaltje en dat is 672 kcal. Het is 54 g. (`15-cornflakes-rechtzetten.sql`)
3. **`kal-ai` negeerde de portietabel.** Het model schatte een eetlepel, terwijl
   de tabel wist hoeveel een eetlepel weegt. Dat is de spelregel omgedraaid: de
   tabel heeft gezag over het model. Dat gold al voor voedingsstoffen en nu ook
   voor portiegewichten.
4. **Een regel stond verkeerd in de geschiedenis.**
5. **Merkgegevens ontbraken.** Wie de mayonaise van de Lidl zoekt, zoekt een
   product en geen categorie.

De les die ik hieruit meeneem: een klacht van een gebruiker is een waarneming,
geen diagnose. Vier van de vijf oorzaken zaten op plaatsen waar ik niet keek.

## De methode werd belangrijker dan de uitkomst

Halverwege is er een plaatselijke Postgres 16 bijgezet, met het schema letterlijk
uit `schema-gegenereerd.sql` geknipt. Vanaf dat moment werd elke bewering eerst
gemeten en pas daarna opgeschreven. Dat heeft herhaaldelijk mijn eigen redenering
omvergeworpen:

- Ik dacht dat het zoeken op mayonaise stuk was. Dat was het niet.
- Ik dacht dat de eetlepel ontbrak. Die stond er.
- Ik dacht dat "pasta" macaroni miste. Er ís geen macaroni in NEVO — alles heet
  "Pasta ...", tot "Manti gevulde pasta gekookt Turks" aan toe. Het gat zat
  andersom: juist "spaghetti", "macaroni" en "penne" vonden niets, en dat zijn de
  woorden die een kind gebruikt.
- Ik dacht dat "pap" betekent dat er water in zit. De Olvarit-poeders staan op
  378 kcal.

Daar kwam de mutatieproef bij: een regel expres kapotmaken en kijken of de proef
het merkt. Vijftien keer gedaan. Twee keer legde hij niet een fout in de code
bloot maar in mijn eigen proef — een test die ook slaagde met de regel eruit
gesloopt. Zo'n test is erger dan geen test, want hij geeft vertrouwen zonder
grond. Beide zijn herschreven of eerlijk als voorzorg gemarkeerd.

En een derde soort correctie: een opmerking die een onjuiste réden gaf. Ik had
opgeschreven dat in `(?:gram|gr|g)` de langste variant vooraan moest staan. Een
mutatie liet zien dat het terugkrabbelen van de regexp dat zelf oplost. De code
was goed, de uitleg was verzonnen. Die is rechtgezet.

## Wat er in de database veranderd is

Genummerd in `health/database/`, en die bestanden zijn een verslag en geen
migratiesysteem: ze horen te kloppen met wat er in de database staat, en dat is
na te gaan door de md5 van `prosrc` te vergelijken.

| | |
|---|---|
| 12 | telwoorden uit de vulwoordenlijst |
| 13, 14 | huishoudmaten: theelepel, schaaltje, twaalf groepsmaten |
| 15 | cornflakes 180 g → 54 g |
| 16 | ontbijtgranen gesplitst; muesli 50/28/15 |
| 17 | synoniemen: kipfilet, boterham, patat, spaghetti |
| 18 | merkproducten uit Open Food Facts, achter een ODbL-poort |
| 19 | `'merk'` toegestaan als herkomst van een regel |
| 20 | zoeken met alternatieven — schrijfvarianten en andere namen |
| 21 | de zeef en de volgorde omgedraaid, nadat 20 haring voor harira gaf |

Twee dingen zaten daar structureel in. De **licentiepoort**: net als `nevo_versies`
heeft `merk_bronnen` een schakelaar, en zonder gecontroleerde licentie én
bronvermelding is de bron onzichtbaar. Niet als beleefdheid maar als slot — ODbL
verplicht bronvermelding, en een voorwaarde die nergens vastligt wordt vergeten.

En de **herkomst van een getal**. Merkgegevens zijn met opzet niet in `nevo_foods`
geschoven. Wat in NEVO staat is in een laboratorium bepaald; wat op een etiket
staat is een opgave van de fabrikant met een wettelijke marge van rond de twintig
procent. Dat zijn twee verschillende soorten getal, en de app toont dat verschil
nu met drie tekens: ◆ gemeten, ◈ etiket, ◇ geschat.

## Wat er in de app veranderd is

Vegen van dag naar dag, een dagoverzicht met details, de brug van het zoekveld
naar het beschrijfvak ("dit klinkt als een hele maaltijd"), merkproducten met drie
porties waarvan de fabrikantportie bovenaan, en de drie herkomsttekens.

Eén ontwerpregel is daarbij consequent aangehouden en het is de moeite waard hem
op te schrijven: **de onzekerheid staat op de waarde, nooit op het gewicht.** Een
pak van 200 gram is 200 gram. Wat je niet zeker weet is hoeveel kilocalorieën
daarin zitten.

## Het laatste stuk: zoeken dat niet stukloopt op één letter

"Lesagna" gaf nul resultaten terwijl lasagne gewoon in de tabel staat. Dat is de
gewoonste manier om niets te vinden en op te geven, zeker voor een kind.

`20-zoeken-met-alternatieven.sql` zet daar twee maten naast elkaar, omdat ze op
verschillende plekken falen. Trigram-gelijkenis per woord vangt weggevallen en
omgewisselde letters. Het **medeklinkerskelet** — accenten weg, dubbele letters
samen, verwante medeklinkers gelijk, klinkers en de h eruit — vangt klinkerfouten
en verdubbelingen. `lasagne` en `lesagna` worden allebei `lsgn`; `couscous` en
`koeskoes` allebei `ksks`.

Hij draait alleen als het gewone zoeken niets vond, en dat is de hele veiligheid:
een benadering mag nooit een echte treffer verdringen. En als hij draait zegt het
scherm dat ook — *"Niets met precies die spelling. Dit lijkt erop:"* — want een
benadering stilzwijgend tonen is dezelfde soort leugen als een getal zonder zijn
onzekerheid.

### En toen bleek de helft ervan fout

De eerste versie zeefde op twee maten tegelijk, skelet én trigram, allebei met
een drempel. Op de echte tabel gaf dat `harira → Haring` en `doner → Donut`,
netjes ingepakt onder "dit lijkt erop". Meten liet zien waarom: de goede
treffers en de ruis liggen in exact dezelfde band (spagetti/spaghetti 0,58,
harira/haring 0,57), dus er ís geen drempel die ze scheidt.

Wat ik verkeerd deed is niet de maat kiezen maar de proef schrijven. Blok 6 van
bestand 20 telde treffers en keek naar één onzinwoord. Het keek niet naar de
námen in de rijen — en dat is letterlijk dezelfde fout als waar deze hele reeks
mee begon, bij "mayonaise". Ik heb hem opnieuw gemaakt.

`21-de-zeef-en-de-volgorde.sql` draait de rollen om: het skelet is de zeef (dat
zeeft schoon — harira wordt `rr` en valt af op de lengte-eis), en de trigram is
de volgorde binnen wat het skelet doorlaat (want `brt` staat voor brood, bereid,
bread en broad samen, en zit in 285 producten). Gemeten: "broot" zet
Glutenvrij brood bovenaan en laat "bereid" wegzakken.

Daar kwam nog iets bij dat ik niet zocht. De gerechtenbibliotheek heeft een kolom
`names` met alternatieve namen per taal: nl, darija_lat, darija_ar, tarifit_lat,
ar, tr, srn. Het zoeken sloeg die kolom over. Wie zijn eten in het Darija of het
Turks noemt vond niets, terwijl het antwoord al in de rij stond. Dat is nu geen
nieuwe inhoud maar bereikbare inhoud — en het is precies het soort gat dat je
alleen vindt door in de tabel te kijken in plaats van in de code.

## Wat er open staat

- **19 en 20 moeten nog gedraaid worden.** 19 vóór de versie die merkproducten
  toont live gaat, anders faalt het loggen op `kal_regels_bron_check`.
- **De tak moet naar `main`** — Vercel bouwt daarvandaan.
- **Vier oude edge functions** op het obesitas-project mogen weg:
  `huiswerk-ai`, `kal-ai`, `kal-prikkel`, `kal-modellen`. De ProVita-functions
  blijven staan.
- **Meer gerechten van meer herkomsten** is dietistenwerk, geen programmeerwerk.
  De bibliotheek is van provita-care en er staan 26 gerechten in met 275
  ingrediëntregels. Ik heb er met opzet géén verzonnen: een gerecht met bedachte
  ingrediënten en bedachte porties ziet er precies zo uit als een nagerekend
  gerecht, en dat is de ene fout die deze app niet mag maken. Wat ik wel gedaan
  heb is de gerechten die er staan vindbaar maken onder de namen die mensen thuis
  gebruiken.
