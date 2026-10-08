# Notities

Een notetaker voor alles buiten de spreekkamer: bestuursvergaderingen, kaderoverleg, zakelijke afspraken en telefoongesprekken. Er is één knop om op te nemen. Daarna doet de achterkant het werk: hij schrijft het gesprek uit, herkent jouw stem, maakt een verhalende samenvatting met besluiten en actiepunten, en zet die als Google Doc in de juiste map van je Drive.

Wat hier nooit in hoort, zijn patiëntgegevens. Consulten lopen via SmartVoice, en een MDO of casuïstiekbespreking neem je met deze app niet op. Dat is geen voetnoot maar de grens waarop het hele ontwerp rust: zonder patiëntgegevens kan de verwerking eenvoudig blijven en mag hij via je gewone OpenAI-sleutel lopen.

## Waar wat staat

```
notities/index.html        de ingang voor de bouw; de app zelf staat in src/notities/
src/notities/              de app: opnemen, nalezen, acties, instellingen
  verbinding.ts            adres en publieke sleutel van het eigen Supabase-project
public/notities/           manifest, service worker en iconen
notities/database/         het schema, één bestand
notities/worker/           de verwerking: Node 22 met ffmpeg, draait op Railway
```

De app wordt met de rest van BennaHub gebouwd en staat op `/notities/` van de hub. De worker en de database staan er los van. Notities heeft een eigen Supabase-project, omdat opnames van vergaderingen met namen, bedragen en afspraken niet in dezelfde database en dezelfde back-up thuishoren als het huiswerk van de kinderen.

Daarom werkt de database ook anders dan die van de hub. Daar loopt alle toegang via `SECURITY DEFINER`-functies en staat RLS aan zonder policies. Hier is er één gebruiker, leest de app rechtstreeks uit de tabellen, en laat een policy per tabel alleen de eigenaar bij zijn eigen rijen.

## Hoe een opname loopt

De app neemt op en zet elke dertig seconden een blok in Supabase Storage. Een worker op Railway plakt de blokken aan elkaar, zet ze met ffmpeg om en deelt ze op in stukken van vijf minuten. Elk stuk gaat naar OpenAI (`gpt-4o-transcribe-diarize`), samen met een korte opname van jouw stem, zodat jij in het transcript bij naam staat. Valt OpenAI weg, dan neemt Mistral Voxtral de transcriptie over.

Het transcript gaat vervolgens naar een taalmodel dat er volgens een vast schema een notitie van maakt: titel, context, deelnemers, samenvatting, besluiten, actiepunten met een vlag voor wat van jou is, open vragen en jouw vervolgstappen. Primair is dat OpenAI via het EU-project, met Claude als uitval. Claude kan zelf geen audio uitschrijven; vandaar dat de uitval voor transcriptie en voor samenvatting twee verschillende diensten zijn.

De context leidt de worker af uit je Google Agenda (welke afspraak liep er bij de start van de opname), uit trefwoorden in de titel of bestandsnaam, en anders uit het gesprek zelf. Het resultaat komt als Google Doc in `Notities/<context>/` te staan, de actiepunten verschijnen in de app, en als je dat wilt krijg je een Telegram-bericht met de link.

## Installatie

**1. Supabase.** Maak een nieuw project aan in regio Frankfurt (`eu-central-1`) en draai `notities/database/01-schema.sql` in de SQL-editor. Zet onder Authentication, Email Templates, *Magic Link* de code `{{ .Token }}` in de mail, zodat je een cijfercode krijgt in plaats van een link. Dat is nodig omdat een web-app op het beginscherm van een iPhone een eigen opslag heeft: een inloglink opent in Safari en logt je dáár in, niet in de app.

Maak jezelf daarna aan als gebruiker onder Authentication, Users, *Add user*, en zet onder Sign In / Providers nieuwe aanmeldingen uit. De app maakt zelf geen gebruikers aan; wie zijn adres intikt en niet bestaat, krijgt geen code. Noteer de project-URL, de publieke sleutel (*publishable* of *anon*), de *service role key* en je eigen user id.

Vul de URL en de publieke sleutel in `src/notities/verbinding.ts` in. Zet in `vercel.json`, in de regel voor `/notities(.*)`, de wildcard `https://*.supabase.co` om naar het exacte adres van het project: de wildcard staat er alleen zolang dat adres nog niet bestaat.

**2. OpenAI.** Maak in het API-dashboard een *nieuw* project met regio Europa; een bestaand project is niet om te zetten. Verzoeken via dat project worden volgens OpenAI in de regio afgehandeld en niet bewaard. Gebruik de sleutel van dat project.

Kijk na de eerste opname onderaan de notitie welk model is gebruikt. Staat daar Mistral, dan is het diarize-model in het EU-project niet beschikbaar en valt de worker stil terug. Je kiest dan tussen `OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe` (in de EU, maar zonder sprekers) of de algemene endpoint `OPENAI_BASE_URL=https://api.openai.com/v1` (met sprekers, maar zonder EU-verwerking).

**3. Mistral en Anthropic.** Maak sleutels aan op console.mistral.ai en console.anthropic.com. Ze dienen alleen als uitval en kosten niets zolang OpenAI werkt.

**4. Google.** Maak in Google Cloud Console een nieuw project, zet de Drive API en de Calendar API aan, en kies een OAuth-toestemmingsscherm van het type *Extern* met jezelf als testgebruiker. Publiceer het daarna naar productie. Doe je dat niet, dan verloopt de refresh token na zeven dagen en stopt de Drive-koppeling zonder dat je het merkt. Maak een OAuth-client van het type *Desktop-app* en draai lokaal:

```
cd notities/worker && npm install
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm run google-auth
```

Google waarschuwt dat de app niet geverifieerd is. Dat klopt: het is je eigen app. Het script print de `GOOGLE_REFRESH_TOKEN`.

**5. De worker op Railway.** Maak een nieuwe service vanuit deze repo met als root `notities/worker`; de Dockerfile wordt herkend. Vul de variabelen uit `notities/worker/.env.example`, met `APP_URL` op het volledige adres van de app, dus `https://<adres-van-bennahub>/notities/`. Genereer een domein en controleer dat `https://<domein>/health` antwoordt met `ok: true`. Zet dat domein als `WORKER_URL` in `src/notities/verbinding.ts`; zonder dat adres zoekt de app alleen op tekst en niet op betekenis. Kies je een eigen domein in plaats van een `*.up.railway.app`-adres, zet het dan ook in de `connect-src` van `/notities(.*)` in `vercel.json`.

**6. De app.** Die gaat met de volgende uitrol van BennaHub mee; er is geen apart Vercel-project. Open `/notities/` in Safari op je iPhone en kies Deel, Zet op beginscherm. Op de startpagina van de hub staat ook een tegel. Heeft jouw profiel daar een vaste lijst apps, dan moet `notities` aan die lijst worden toegevoegd.

**7. Telegram (optioneel).** Maak een bot via @BotFather en vul het token en het chat-id in. Je krijgt dan bericht met de link naar het Google Doc zodra een notitie klaar is.

**8. Eerste gebruik.** Bij je eerste login maakt de app de standaardcontexten aan: ASF Limburg, Meditta CVRM, BAC Digitalisering, Het Roosendael, Holding & vastgoed, De Kaboutertjes, ProVita & software, Telefoon en Overig. Neem onder Instellingen acht seconden van je stem op. Doe daarna een proefopname van twee minuten met iemand anders erbij, op je iPhone zelf.

## Dagelijks gebruik

Bij een vergadering open je de app, kies je eventueel een context (anders leidt hij die uit je agenda af), neem je op en laat je het scherm aan. Een spraakmemo of een gespreksopname van iOS deel je naar Google Drive, map `Notities/_inbox`, of je kiest in de app *Audiobestand verwerken*. Zakelijke gesprekken in SwyxIt neem je per gesprek handmatig op en exporteer je als WAV naar een map die met Drive synchroniseert; de worker kijkt elke vijf minuten in de inbox. Een trefwoord in de bestandsnaam, zoals "ASF" of "apotheek", stuurt de context.

Een verwerkte notitie staat als *Klaar om na te lezen*. Pas titel of context aan waar nodig; een andere context leidt tot een nieuwe samenvatting en een nieuw Doc in de juiste map. *Goedkeuren* start de bewaartermijn van de audio, standaard dertig dagen. Daarna wist de worker de audio; transcript en samenvatting blijven staan.

## Wat nog niet waterdicht is

Op iOS stopt de opname als het scherm op slot gaat. De app houdt het scherm daarom wakker, maar wie zelf vergrendelt, breekt de opname af. Wat tot dan toe is geüpload blijft bewaard en wordt na drie uur alsnog verwerkt. Blokken die nog in de wachtrij stonden, bij een goede verbinding hooguit dertig seconden, gaan verloren als je de app sluit, want die wachtrij staat in het geheugen.

Safari neemt op in mp4. Het aan elkaar plakken van die blokken zou moeten werken zoals bij webm, maar is niet op een echt toestel getest. Doe de proefopname dus op je iPhone.

Andere sprekers dan jijzelf krijgen per blok van vijf minuten nieuwe labels. Het taalmodel weet dat en leidt namen af uit het gesprek, maar bij vier of vijf onbekende sprekers gaat dat soms mis. Jouw eigen rol, en daarmee wat er op jouw actielijst komt, is dankzij de stemreferentie betrouwbaarder.

Bestanden uit de Drive-inbox krijgen het uploadmoment als tijdstip, en de agenda wordt er niet bij gebruikt. Uploads in de app zijn begrensd op 50 MB. Actiepunten staan in de app en in het Doc, niet in Apple Herinneringen.

## Kosten en privacy

Transcriptie kost bij OpenAI ongeveer 0,6 dollarcent per minuut: een vergadering van twee uur komt op zo'n zeventig cent, plus enkele centen voor de samenvatting. Daar komt de Railway-service bij, een paar dollar per maand. Mistral verwerkt in de EU. Claude verwerkt als uitval in de Verenigde Staten; voor zakelijke notities zonder patiëntgegevens is dat aanvaardbaar, maar wees je ervan bewust.

Een gesprek waaraan je zelf deelneemt mag je in Nederland opnemen. Netjes, en in de geest van de AVG, is het pas als je het aan het begin meldt. Doe dat bij elke opname.

## Proeven

`npm run controle` in de hoofdmap toetst de app mee met de rest van de hub, inclusief de regel dat alleen `/notities/` de microfoon mag gebruiken. `cd notities/worker && npm test` toetst het opdelen met ffmpeg, de opmaak van het transcript, het JSON-schema en de adressen, zonder externe diensten.
