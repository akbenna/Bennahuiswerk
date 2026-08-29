# De vraagbaak weer aan de praat

`huiswerk-ai` staat sinds 26 augustus 2026 op het oude, gedeelde project
`jnlvvdaisyerhxucxnuu`. Een dag later verhuisde Bennahuiswerk naar zijn eigen
database, en `DATABASE_URL` in `src/gedeeld/db/verbinding.ts` wijst sindsdien
naar `huiuvnjrvvoybbzwfrfp`. De app roept dus een adres aan waar deze function
niet staat: elk kind dat een vraag stelt krijgt "De vraagbaak doet het even
niet."

Dit is geen SQL maar vier handelingen in het dashboard. Ze duren samen een paar
minuten.

## 1. De function aanmaken

Supabase → project `huiuvnjrvvoybbzwfrfp` → Edge Functions → Deploy a new
function. De naam moet **exact** `huiswerk-ai` zijn: de app plakt die naam
achter `/functions/v1/`, dus een andere naam betekent een 404.

De inhoud is `huiswerk/edge/huiswerk-ai.ts` uit deze repo, ongewijzigd. Dat
bestand is het verslag van wat er hoort te draaien; wijkt wat je uitrolt ervan
af, dan klopt het verslag niet meer en is dat een gat.

## 2. `verify_jwt` uit

In de instellingen van de function. Dit moet, en het is geen slordigheid:

De app stuurt bij deze aanroep **geen** `apikey`-kopregel mee — kijk maar in
`src/huiswerk/vraagbaak.ts`, er gaat alleen een `Content-Type` mee. Staat
`verify_jwt` aan, dan weigert de poort het verzoek voordat de function ook maar
draait, en zie je een 401 die niets met je vraag te maken heeft.

Dat de deur zo openstaat is niet erg. De function doet maar één ding, ze leest
alleen wat er in het verzoek zit, en ze schrijft nergens naartoe. Wat wél
beschermd moet worden is de sleutel, en die staat aan de andere kant.

## 3. `ANTHROPIC_API_KEY` in de secrets

Edge Functions → Secrets. Zonder deze sleutel geeft de function netjes "De
vraagbaak is nog niet ingesteld" en gebeurt er verder niets — dat is met opzet de
veilige kant om op te falen, maar het werkt dan natuurlijk niet.

Plak die sleutel nergens anders. Niet in de repo, niet in een chat, niet in de
browser. Dit is de enige plek waar hij hoort.

## 4. Nakijken

Als de function draait, hoort dit een JSON-antwoord te geven met `antwoord`,
`routes` en `gat`:

```
curl -sS -X POST 'https://huiuvnjrvvoybbzwfrfp.supabase.co/functions/v1/huiswerk-ai' \
  -H 'Content-Type: application/json' \
  -d '{"vraag":"ik snap breuken optellen niet",
       "kind":{"naam":"Wassima","niveau":"2 havo","volgend":"3 havo"},
       "catalogus":[{"s":"wis-breuken","vak":"wiskunde","onderwerp":"breuken",
                     "jaar":"nu","n":12,"beheerst":3}]}'
```

Wat je terug hoort te zien:

- **200 met JSON** — klaar. Draai daarna de app en stel dezelfde vraag.
- **401** — `verify_jwt` staat nog aan (stap 2).
- **404** — de naam klopt niet (stap 1).
- **500 "De vraagbaak is nog niet ingesteld"** — de sleutel ontbreekt (stap 3).
- **502** — de function draait, maar Anthropic weigerde. Kijk in de logs van de
  function; daar staat de status en het antwoord.

## 5. Opruimen

Zodra dit werkt kan de kopie op `jnlvvdaisyerhxucxnuu` weg. Twee exemplaren van
dezelfde function op twee projecten is precies hoe je later niet meer weet welke
van de twee je aan het bijwerken bent.

En dan hoort de waarschuwing bovenaan `huiswerk/edge/huiswerk-ai.ts` eruit — die
zegt nu dat het nog niet uitgerold is, en dat klopt dan niet meer.
