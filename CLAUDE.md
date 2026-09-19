# Voor wie hier verder bouwt

Dit bestand staat er zodat een nieuwe sessie niet opnieuw hoeft te ontdekken wat
al vastligt. Het vervangt niets: `BUILD.md` legt de bouw uit,
`health/VERANTWOORDING.md` elke rekenregel en `health/AUTOMATISERING.md` alles
wat vanzelf draait. Wat hieronder staat zijn de regels die niet in code te
zetten waren.

## De poort

```
npm run controle     typen → edge → proeven → bouw → CSP-proef
```

Vijf poorten, één opdracht. Ze horen alle vijf groen te zijn vóór een commit —
niet erna.

`edge` is er sinds de dag dat een uitrol weigerde. `health/edge/` valt buiten
`tsc -b` — die bestanden draaien op Deno en importeren van https-adressen die van
hier niet te halen zijn — en viel daarmee ook buiten élke controle. In de
systeemprompt van kal-ai stonden veldnamen tussen backticks, en een backtick
sluit een template-literal. Drie commits lang stond daar een bestand dat Deno
niet kon inlezen, en niets merkte het. De poort ontleedt ze nu met de parser van
TypeScript zelf: geen typecontrole, wel de zekerheid dat het bestand te lezen is.

De CSP-proef laadt elke app in een echte Chromium achter de headers uit
`vercel.json`; in deze omgeving heeft hij het pad nodig:

```
CHROOM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run controle
```

`node gereedschap/health-voorbeeld.mjs` staat er los naast. Hij zet `dist/`
achter dezelfde headers, verzint achtentwintig dagen aan gegevens en maakt de
schermafdrukken. Hij is ook een proef: hij valt om bij een lege schermkop, een
verkeerd endpoint, een veldnaam die uit de koppelinstructie verdwenen is, of
maaltijdtegels die niet meer meebewegen. Hij leest `dist/`, dus **eerst
bouwen**. Verandert er iets aan een scherm van BennaHealth, dan hoort hij mee te
draaien en horen de afdrukken mee de commit in.

`node gereedschap/cursus-proef.mjs` staat er net zo naast, en leest ook `dist/`.
Hij gaat over de ingangen van de startpagina: dat de drie cursussen van de
Academie zonder code opengaan, dat ze elk een eigen tegel hebben, en dat
BennaHealth een eigen ingang op de poort heeft die niet langs het gezinsprofiel
gaat. Een grep zou hier niet volstaan: het slot was gedrag, geen
markering — het riep `render()` pas ná het ontgrendelen aan, dus een half
verwijderd slot geeft een leeg scherm dat er in de tekst prima uitziet.

## Wat er nooit in mag

**De NEVO-bronbestanden.** De CSV met de voedingsmiddelentabel blijft buiten de
repo. Wat er wel in mag is wat eruit afgeleid is en in de database staat.

**De service-role-sleutel.** In de browser komt alleen de publieke anon-sleutel,
en waarom dat veilig is staat uitgelegd in `src/gedeeld/db/verbinding.ts`. Elke
andere sleutel hoort in de omgeving van een edge function of in de vault.

**De naam van het model.** Niet in commits, niet in PR-teksten, niet in
codecommentaar.

## Hoe de database werkt

Alle toegang loopt via `SECURITY DEFINER`-functies met een vastgezet
`search_path`. RLS staat aan zonder policies: dat is geen vergissing maar het
ontwerp — de tabellen zijn niet rechtstreeks te lezen, de functies bepalen wat
er uit mag. Functies van BennaHealth heten `kal_*`.

De SQL die bij de app hoort staat genummerd in `health/database/`. Die bestanden
zijn een verslag, geen migratiesysteem: ze horen te kloppen met wat er in de
database staat. Dat is te controleren zonder te vertrouwen op je geheugen —
vergelijk de md5 van `prosrc` met die van het bestand, met commentaar en witruimte
eruit gestript.

## Nooit wegschrijven wat er al staat

De inhoud van de database is met de hand opgebouwd — de gerechtenbibliotheek
voorop — en dat werk is niet te herhalen. Een bestand dat inhoud toevoegt bouwt
er dus bíj, en raakt niet aan wat er al ligt. Vier regels, en ze zijn alle vier
te toetsen:

**Toevoegen is `on conflict do nothing`, nooit `do update`.** Een rij die er al
is blijft zoals hij is, ook als ik denk het beter te weten. Kinderrijen
(ingrediënten, porties) worden alleen aangemaakt voor wat de insert zelf net
heeft neergezet — via `returning`, niet via een opzoeking op naam. Anders krijgt
een gerecht dat de diëtist heeft bijgewerkt er stilletjes mijn ingrediënten bij.

**Twee keer draaien voegt niets toe en haalt niets weg.** Dat is geen
eigenschap die je aanneemt maar een proef die je draait.

**Een terugdraairegel raakt alleen wat dít bestand heeft neergezet.** Dus op de
slugs van het bestand (`slug like 'sur-%'`) en niet op de categorie
(`cuisine = 'surinaams'`) — die tweede haalt ook weg wat er later door iemand
anders bij is gezet. Dit stond fout in bestand 24 en 27 en is rechtgezet.

**Een koppeling die uit zichzelf vuurt overschrijft nooit een waarde die een
mens heeft ingevuld.** Wat de koppeling zelf neerzette mag hij bijwerken, meer
niet. Die regel staat één keer, in `kal_meting_uit_koppeling`, en wordt
mutatiegetoetst.

Wat hier níet onder valt is een functie vervangen: `create or replace function`
is de gewone gang van zaken, want de functies zijn code en geen inhoud. Het gaat
om rijen.

Na elke wijziging aan `kal_beweging_ontvangen` of `kal_beweging_dag`:

```sql
select * from kal_proef_koppeling();   -- 41 gevallen, alle goed
```

Die proef schrijft in de echte tabellen en draait zichzelf terug. Hij is zelf
getoetst met een mutatieproef; waarom dat nodig was staat in
`health/AUTOMATISERING.md`.

## Taal en toon

De code is Nederlands: `regels`, `proef`, `venster`, `scherm`. Engelse namen
sluipen er via bibliotheken in, en daar houdt het op. Commentaar legt uit
*waarom*, niet *wat* — wat er staat is te lezen.

BennaHealth heeft één stelregel die alles eronder bepaalt: **geen enkel getal
zonder zijn onzekerheid.** Een puntschatting zonder interval is in dit ontwerp
een fout, geen vereenvoudiging. Wat overgenomen of geschat is, zegt dat zelf.

## Git

Ontwikkelen op de tak die de opdracht noemt, nooit rechtstreeks op `main`.
Een PR alleen als erom gevraagd wordt.
