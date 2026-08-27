# De scheiding van de databases

Dit bestand legt vast wat er op 26 augustus 2026 aan de databasekant is
nagegaan, wat er niet klopte, en wat eraan gedaan is. Het is een verslag, geen
handleiding: `BUILD.md` legt de bouw uit en `CLAUDE.md` de regels.

## Wat er stond

Alle negen apps in deze repo wezen naar één project: `jnlvvdaisyerhxucxnuu`,
in het Supabase-dashboard **"Obesitas spreekuur Project"**. Dat is de
ProVita-database. In datzelfde project staan 1,1 miljoen declaratieregels
(`dc_*`), de SignaalZorg-classificaties (`sz_*`), het praktijkrooster
(`rooster_*`), de zorgzwaarte-uitkomsten en de patiënttabellen.

Er was dus geen scheiding. De gezinsapps en de zorggegevens deelden één
database, één anon-sleutel, één back-up en één compute-instantie.

De anon-sleutel staat — bewust en terecht uitgelegd — in
`src/gedeeld/db/verbinding.ts`, en komt daarmee in elke browserbundel terecht.
De redenering in dat bestand klopt voor de hub-tabellen zelf: `kal_*`,
`bennahub_*` en `oefenapp_*` zijn niet rechtstreeks benaderbaar en alle toegang
loopt via `SECURITY DEFINER`-functies. Maar de sleutel opent geen tabel, hij
opent een *project*, en de rest van dat project stond niet zo strak.

## Wat er mee kon

Gemeten met diezelfde publieke sleutel, op 26 augustus:

| tabel | wat anon kon |
|---|---|
| `ses_lookup` | lezen (1.373 postcodegebieden) |
| `practices`, `kaderartsen` | lezen |
| `dc_nza_tariffs`, `video_assets` | lezen |
| `zorgzwaarte_results`, `zorgzwaarte_patients`, `zorgzwaarte_runs` | schrijven |
| `audit_log`, `event_log`, `contact_requests` | schrijven |
| `dc_declarations` | geen rijen, maar wél een scan over 1,1 miljoen regels |

Die laatste is de vervelendste. De policy op `dc_declarations` geldt formeel
voor `public` en hangt aan `auth.uid()`. Voor anon levert dat nooit een rij op —
de gegevens waren veilig — maar de vraag werd wel uitgevoerd. Het antwoord was
geen weigering maar een time-out. Een buitenstaander met de sleutel uit de
huiswerkapp kon daarmee databasetijd laten verbranden.

De oorzaak ligt niet bij de hub. De oudere ProVita-tabellen dragen nog de
standaard `GRANT ALL ... TO anon` uit de begintijd van het project; de nieuwere
hub-tabellen zijn wél dichtgezet. De hub publiceerde alleen de sleutel van een
database die te ruim stond.

## Wat er is ingetrokken

Migratie `anon_rechten_intrekken_zonder_beleid`, toegepast op het gedeelde
project:

1. Op elke publieke tabel zonder één enkele policy voor `anon` of `public` is
   `revoke all ... from anon` uitgevoerd — 138 tabellen. Op die tabellen weigerde
   RLS de rol anon al; het recht bestond alleen nog om te mogen aankloppen. Het
   gedrag verandert dus niet, de tabellen verdwijnen wel uit het
   PostgREST-oppervlak.
2. Daarnaast met de hand: `dc_declarations`, `dc_declaration_imports`,
   `dc_practice_config` en `patients`. Die houden een policy die formeel voor
   `public` geldt, maar de voorwaarde hangt aan `auth.uid()` en levert voor anon
   niets op. Ingelogde gebruikers merken er niets van; de scan is weg.

Nagemeten: `dc_declarations`, `patients`, `sz_patient_classifications`,
`zorgzwaarte_bronnen`, `sciencepulse_articles`, `kal_koppelingen` en
`oefenapp_state` geven nu `42501 permission denied`. De publieke ProVita-paden
(`programs`, `week_content`, `homepage_content`, `site_settings`,
`ui_translations`, `video_assets`) geven onveranderd `200`.

## Wat nog openstaat

- **`zorgzwaarte_results` en `zorgzwaarte_patients`** houden een policy die anon
  laat *invoegen*, met voorwaarde `true`. Dat is ooit bewust gedaan voor een
  importpad zonder login. Zolang die policy er staat kan een buitenstaander
  rijen bijschrijven. Hoort bij ProVita, niet bij deze repo.
- **Nieuwe tabellen** krijgen opnieuw rechten voor anon: de default privileges
  in het schema `public` staan nog zo. Wie dat wil sluiten moet
  `alter default privileges` aanpassen — dat raakt de ProVita-werkwijze en is
  hier bewust niet gedaan.
- **De cronjob `rsd_kv_opruimen`** draait nog in het gedeelde project, terwijl
  Het Roosendael inmiddels een eigen project heeft. Ook `rsd_kv` staat nog op
  beide plekken: 14 rijen hier, 10 in het nieuwe project. Die verhuizing is niet
  afgemaakt.

## De verhuizing van de hub

Uitgevoerd op 26 augustus 2026. De eigen database is `huiuvnjrvvoybbzwfrfp`, in
een aparte organisatie — en, zo bleek onderweg, onder een **ander Supabase-account**
dan het betaalde project. Twee logins dus, wat voor de scheiding strenger is dan
gevraagd maar iets is om te onthouden.

### Hoe het schema is overgezet

Niet met de hand. In het bronproject staan twee functies, `hub_verhuis_ddl()` en
`hub_verhuis_rechten()`, die het schema uit de catalogus van de database zelf
opbouwen: tabellen met hun defaults en checks, sleutels, indexen, de weergave
`nevo_actief`, triggers, alle functies met hun lichaam, het commentaar en de
rechten. Het script `gereedschap/verhuizing/verhuizing.py` haalt die tekst op en
voert hem uit aan de doelkant. Wat er is toegepast staat als verslag in
`gereedschap/verhuizing/schema-gegenereerd.sql` en `rechten-gegenereerd.sql`.

Dat was geen omweg maar het punt: wat wordt overgetypt kan bij het overtypen
stilletjes veranderen, en dan valt het verschil pas op als een berekening al een
tijd verkeerd staat.

### Wat er staat

29 tabellen, 61 functies, 58 indexen, 3 triggers, één weergave. Alle tabellen
met RLS aan, **geen policies**, en geen enkele tabel benaderbaar voor `anon` of
`authenticated`. Vijftig functies zijn met de publieke sleutel aanroepbaar; dat
is precies de lijst uit het bronproject.

Drie dingen zijn daarbij strakker gezet dan ze stonden:

- Postgres geeft nieuwe functies standaard uitvoerrecht aan `PUBLIC`. In een
  verse database staat daarmee álles open. Dat recht is ingetrokken en daarna
  zijn de vijftig functies expliciet toegekend.
- `pg_trgm` belandde in het schema `public`, waar PostgREST zijn eenendertig
  functies zou hebben aangeboden. De uitbreiding staat nu in `extensions`; de
  index op `nevo_foods.naam_nl` is daarbij heel gebleven.
- `kal_prikkel_bouwen` en `kal_prikkel_gelogd` stonden in het oude project open
  voor `anon`. Ze horen bij de edge function en zijn hier dichtgezet.

### Wat er is gekopieerd

Elke tabel nageteld tegen de bron. NEVO 2.328 producten, de gerechtenbibliotheek
25 basisrecepten met 267 ingrediënten en 54 portiematen, 35 portiematen uit
`voeding_portiematen`, en de gegevens van BennaHealth zelf: 23 dagen, 44 regels,
3 recepten, 4 metingen, 13 regels ai-log, 8 configregels, 7 bewegingspeilingen.
Het gezin: 1 gezin, 6 leden, 2 appstanden, 4 huishoudens in de oefenapp.

Bewust niet mee: de persoonlijke gerechtvarianten van patiënten
(`owner_patient_id is not null`). De verwijzingen naar `patients`, `clinicians`
en `auth.users` zijn vervallen — die tabellen bestaan hier niet.

`kal_proef_koppeling()` — de eigen 41-gevallenproef — draait op de nieuwe
database en geeft groen.

### De edge functions en de cron

`kal-ai` en `kal-prikkel` draaien in het nieuwe project, met dezelfde
`verify_jwt` als in het oude (false respectievelijk true). Hun broncode staat nu
óók in de repo, in `health/edge/` — dat stond er voor `kal-ai` nog niet, en
uitgerolde code zonder bron in de repo is een gat.

`kal-modellen` is niet meeverhuisd: die was al uitgezet en gaf `410`.

De vier cronjobs staan er: `kalibratie-prikkel` (0 6,7 * * *) en
`kalibratie-coach-12`, `-15` en `-18`. `pg_cron` en `pg_net` staan aan en de
service-sleutel staat in de Vault onder `service_role_key`, precies zoals in het
oude project. De hele keten is getoetst met een proefaanroep langs exact de weg
van de cron: die kwam door de JWT-poort, langs de geheimcontrole, en strandde op
`503 RESEND_API_KEY ontbreekt` — het enige dat nog mist.

### Wat er nog moet gebeuren

1. **De geheimen.** `ANTHROPIC_API_KEY` en `OPENAI_API_KEY` staan er sinds
   26 augustus. Getoetst met de ingebouwde proefstand (`proef_model`), die niets
   verstuurt en niets wegschrijft:
   - **Claude werkt.** Model `claude-sonnet-5` uit `kal_config`, en er kwam een
     bruikbaar antwoord terug.
   - **De OpenAI-sleutel wordt geweigerd**: `401 Incorrect API key provided`.
     De terugval doet wat hij moet — OpenAI faalt, Claude neemt over — dus dit
     breekt niets. Wie OpenAI toch wil, vervangt de sleutel; de modelnaam in
     `kal_config` staat op `gpt-5.6-luna` en is dan meteen het tweede ding om na
     te kijken.
   - **`RESEND_API_KEY` staat er bewust nog niet.** Zolang die ontbreekt draait
     de cron gewoon, krijgt hij `503` terug en gaat er geen bericht de deur uit.
     De app zelf — loggen, wegen, zoeken in NEVO — staat daar los van.
2. **De repo uitrollen.** De tak `verhuizing-eigen-database` moet gecommit en
   naar Vercel; pas dan praten de apps met de nieuwe database.
3. **Daarna pas opruimen in het oude project**: de `kal_`-, `bennahub_`- en
   `oefenapp_`-tabellen en -functies, de vier cronjobs, de drie edge functions,
   en de twee hulpfuncties `hub_verhuis_ddl()` en `hub_verhuis_rechten()`. Niet
   eerder dan wanneer de apps aantoonbaar op de nieuwe database draaien.
4. **Let op de slaapstand.** Een gratis project gaat na een week zonder verkeer
   in slaapstand; de eerste bezoeker daarna wacht op het opstarten. De dagelijkse
   cronjobs houden de database waarschijnlijk wakker, maar dat is geen garantie
   die Supabase geeft.
