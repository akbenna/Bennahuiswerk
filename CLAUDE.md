# Voor wie hier verder bouwt

Dit bestand staat er zodat een nieuwe sessie niet opnieuw hoeft te ontdekken wat
al vastligt. Het vervangt niets: `BUILD.md` legt de bouw uit,
`health/VERANTWOORDING.md` elke rekenregel en `health/AUTOMATISERING.md` alles
wat vanzelf draait. Wat hieronder staat zijn de regels die niet in code te
zetten waren.

## De poort

```
npm run controle     typen → proeven → bouw → CSP-proef
```

Vier poorten, één opdracht. Ze horen alle vier groen te zijn vóór een commit —
niet erna. De CSP-proef laadt elke app in een echte Chromium achter de headers
uit `vercel.json`; in deze omgeving heeft hij het pad nodig:

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

Na elke wijziging aan `kal_beweging_ontvangen` of `kal_beweging_dag`:

```sql
select * from kal_proef_koppeling();   -- 31 gevallen, alle goed
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
