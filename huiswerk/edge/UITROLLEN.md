# De vraagbaak uitrollen

**Gedaan op 29 augustus 2026.** `huiswerk-ai` draait op `huiuvnjrvvoybbzwfrfp`
en de vraagbaak werkt. Dit blijft staan als de procedure, voor als hij ooit
opnieuw uitgerold moet worden, naar een ander project, of na een grote
wijziging.

De aanleiding was dit: de function stond op het oude, gedeelde project, en toen
BennaHub naar zijn eigen database verhuisde riep de app een adres aan waar
hij niet meer stond. Elk kind dat een vraag stelde kreeg "De vraagbaak doet het
even niet."

Het is geen SQL maar vier handelingen in het dashboard. Ze duren samen een paar
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

De app stuurt bij deze aanroep **geen** `apikey`-kopregel mee, kijk maar in
`src/huiswerk/vraagbaak.ts`, er gaat alleen een `Content-Type` mee. Staat
`verify_jwt` aan, dan weigert de poort het verzoek voordat de function ook maar
draait, en zie je een 401 die niets met je vraag te maken heeft.

Dat de deur zo openstaat is niet erg. De function doet maar één ding, ze leest
alleen wat er in het verzoek zit, en ze schrijft nergens naartoe. Wat wél
beschermd moet worden is de sleutel, en die staat aan de andere kant.

## 3. `ANTHROPIC_API_KEY` in de secrets

Edge Functions → Secrets. Zonder deze sleutel geeft de function netjes "De
vraagbaak is nog niet ingesteld" en gebeurt er verder niets, dat is met opzet de
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

- **200 met JSON**: klaar. Draai daarna de app en stel dezelfde vraag.
- **401**: `verify_jwt` staat nog aan (stap 2).
- **404**: de naam klopt niet (stap 1).
- **500 "De vraagbaak is nog niet ingesteld"**, de sleutel ontbreekt (stap 3).
- **502**: de function draait, maar Anthropic weigerde. Kijk in de logs van de
  function; daar staat de status en het antwoord.

## 5. Opruimen

Zodra dit werkt kan de kopie op `jnlvvdaisyerhxucxnuu` weg. Twee exemplaren van
dezelfde function op twee projecten is precies hoe je later niet meer weet welke
van de twee je aan het bijwerken bent.

En dan hoort de waarschuwing bovenaan `huiswerk/edge/huiswerk-ai.ts` eruit, die
zegt nu dat het nog niet uitgerold is, en dat klopt dan niet meer.

## De planlezer (`huiswerk-plan`)

**Uitgerold op 1 oktober 2026**, versie 1, op `huiuvnjrvvoybbzwfrfp`, met
`verify_jwt` uit. Wat er draait is byte voor byte dit bestand uit de repo
(nagekeken met `get_edge_function`). Nagekeken met een tekstverzoek vanuit de
database zelf (`net.http_post`, omdat de ontwikkelomgeving supabase.co niet
mag bereiken): drie toetsen terug met de juiste datums, de oefenonderwerpen
precies uit de meegestuurde lijst, en voor Frans, waar de app nog niets voor
heeft, een gat. De procedure hieronder blijft staan voor als het opnieuw moet.

Sinds oktober 2026 staat er een tweede function naast de vraagbaak: de
planlezer, die van een schermafdruk van het rooster of de studiewijzer toetsen
voor het planbord maakt. Hij gebruikt dezelfde sleutel; het uitrollen is
dezelfde procedure met een andere naam.

1. Edge Functions → Deploy a new function, naam **exact** `huiswerk-plan`,
   inhoud `huiswerk/edge/huiswerk-plan.ts` uit deze repo, ongewijzigd.
2. `verify_jwt` uit, om dezelfde reden als bij de vraagbaak.
3. `ANTHROPIC_API_KEY` staat al in de secrets; niets te doen.

Draait hij niet (een ander project, een verkeerde naam), dan krijgt het kind
bij "Lees en maak een planning" de melding dat de fotolezer nog niet aanstaat,
en kan het de toets gewoon zelf intypen. Er gaat dan niets stuk, er ontbreekt
alleen een knop die werkt.

Nakijken, met een tekst in plaats van een afbeelding:

```
curl -sS -X POST 'https://huiuvnjrvvoybbzwfrfp.supabase.co/functions/v1/huiswerk-plan' \
  -H 'Content-Type: application/json' \
  -d '{"tekst":"wo 7 okt toets wiskunde A H3 par 3.1 t/m 3.4",
       "vandaag":"2026-10-01","kind":{"naam":"Amaani","niveau":"5 vwo"},
       "vakken":[{"sleutel":"wiskundeA","naam":"Wiskunde A"}],
       "catalogus":[{"s":"wiskundeA|Kansrekening|nu","vak":"Wiskunde A","onderwerp":"Kansrekening","n":12}]}'
```

Een 200 met `toetsen` erin is goed. De foutcodes betekenen hetzelfde als bij de
vraagbaak hierboven, plus een 422 als het model de afbeelding niet kon of wilde
lezen.
