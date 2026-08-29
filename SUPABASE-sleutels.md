# Van de oude sleutels af

Op 26 augustus 2026 is de `service_role`-sleutel van het gedeelde project in een
chatgesprek beland. Dat is de sleutel die alle rij-beveiliging omzeilt. Dit
bestand is het plan om van de oude sleutels af te komen — niet alleen die ene,
maar het hele stelsel eronder.

## Waarom het niet één knop is

De oude `anon`- en `service_role`-sleutels zijn allebei ondertekend met hetzelfde
JWT-geheim van het project. Ze zijn niet los te vervangen: wie het geheim
roteert, maakt beide sleutels tegelijk ongeldig, en alles wat erop draait valt
stil tot het opnieuw is uitgerold.

Supabase heeft daar een nieuw stelsel naast gezet: `sb_publishable_…` voor de
browser en `sb_secret_…` voor de server. Die worden los aangemaakt, los benoemd
en los ingetrokken. Beide stelsels werken tegelijk, dus de omzetting kan cliënt
voor cliënt; de oude sleutels gaan pas uit als er niets meer op draait. Volgens
Supabase blijven de oude sleutels werken tot eind 2026, en het uitzetten is
omkeerbaar.

**Het nieuwe sleutelpaar staat er al.** Het project heeft een publishable
sleutel onder de naam `default`. Er hoeft dus niets aangemaakt te worden; er moet
omgezet worden.

## Wat er anders werkt

Drie dingen die de omzetting meer maken dan zoeken-en-vervangen:

1. **De nieuwe sleutels zijn geen JWT.** Ze mogen alleen in de `apikey`-kop, niet
   in `Authorization: Bearer`. Wie ze daar tóch zet, krijgt `Invalid JWT` terug —
   het platform probeert ze dan als token te lezen. Onze eigen `verzoek()` in
   `src/gedeeld/db/verbinding.ts` zet de sleutel nu in *allebei* de koppen. Die
   `Authorization`-regel moet er dus uit.
2. **Edge functions met `verify_jwt = true` weigeren ze.** Die controle kent
   alleen de oude JWT-sleutels. Elke functie die met een nieuwe sleutel wordt
   aangeroepen moet naar `verify_jwt = false` en zelf in code bepalen wie er
   binnen mag.
3. **Edge functions lezen hun sleutel anders.** Naast `SUPABASE_SERVICE_ROLE_KEY`
   staan er nu `SUPABASE_SECRET_KEYS` en `SUPABASE_PUBLISHABLE_KEYS` in de
   omgeving. Die bevatten JSON, geen kale tekst:
   `JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS'))['default']`.

## Wat er op de oude sleutel draait

**Op `service_role`:**

- Negen cronjobs die een edge function aanroepen. Goed nieuws: ze halen de
  sleutel uit de Vault, onder de naam `service_role_key` — niet uit een
  hardgecodeerde regel. Eén Vault-geheim vervangen raakt ze dus allemaal. Wel
  moet in elke opdracht de kop `Authorization` worden `apikey`.
- Twintig edge functions, die hem uit `SUPABASE_SERVICE_ROLE_KEY` lezen.
- Het Roosendael-portaal (`api/_kv.js`), dat via de service-sleutel bij `rsd_kv`
  komt.
- Wat er verder buiten beeld staat: n8n, scripts, CI.

**Op `anon`:** de ProVita-webapp, en tot de verhuizing ook de negen apps in deze
repo.

## De volgorde

**Stap 0 — wat vanzelf verdwijnt.** Vier van de negen cronjobs
(`kalibratie-prikkel`, `kalibratie-coach-12`, `-15`, `-18`) en drie edge
functions (`kal-ai`, `kal-modellen`, `kal-prikkel`) horen bij BennaHealth en
verhuizen mee naar de eigen database. Die hoeven in het oude project niet
omgezet te worden — daar mogen ze weg zodra de verhuizing staat. Dat scheelt een
derde van het werk. Doe de verhuizing dus eerst.

**Stap 1 — de achterkant, want daar zit het lek.** Zet de secret-sleutel in de
Vault onder `service_role_key`, pas in de negen (straks vijf) cronopdrachten de
kop aan van `Authorization: Bearer` naar `apikey`, en zet in elke edge function
die met een sleutel wordt aangeroepen `verify_jwt = false` met een eigen
controle. Daarna het Roosendael-portaal en wat er in n8n staat.

**Stap 2 — de voorkant.** Vervang in de ProVita-app de anon-sleutel door de
publishable sleutel, en haal daar — net als hier — de `Authorization`-kop weg
waar de sleutel in stond. In deze repo gebeurt dat vanzelf mee met de verhuizing:
de nieuwe database krijgt meteen een publishable sleutel en geen
`Authorization`-kop.

**Stap 3 — nalopen.** Er is geen teller die zegt of een oude sleutel nog gebruikt
wordt; dit is handwerk. Loop alles langs: uitgerolde apps, CI, webhooks,
integraties, cronjobs.

**Stap 4 — uitzetten.** Project Settings → API Keys → de oude sleutels
deactiveren. Blijkt er iets vergeten, dan kunnen ze weer aan.

## Wat er nu al kan

De verhuizing van BennaHub is stap 0 en die loopt al. Zolang die niet af is, is
elke omzetting aan de `kal_`-kant weggegooid werk.
