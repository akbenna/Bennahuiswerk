# Kalibratie — wat er vanzelf draait

*21 augustus 2026. Twee dingen lopen zonder dat er iemand op een knop drukt. Ze zijn bewust gescheiden: het ene moet altijd werken, het andere moet kunnen nadenken.*

---

## 1. De dagelijkse prikkel — serverkant, elke ochtend om acht uur

Draait volledig in je eigen Supabase, los van Claude en los van de app. Een app die je niet opent, herinnert je nergens aan; daarom zit dit in de database en niet in de interface.

**De keten.** `pg_cron` (job `kalibratie-prikkel`, `0 6,7 * * *`) → guard die kijkt of het in Amsterdam acht uur is → edge function `kal-prikkel` → `kal_prikkel_bouwen()` in SQL → Resend → je inbox.

De job staat twee keer per dag gepland en voert één keer uit. Dat is geen slordigheid: pg_cron rekent in UTC en Amsterdam schuift een uur op tussen zomer- en wintertijd. Dezelfde constructie gebruikt `patient-nudge-daily` al.

**Wanneer er wél een bericht komt:**

| Situatie | Onderwerp |
|---|---|
| Vanochtend niet gewogen | *nog niet gewogen vanochtend* — met hoeveel wegingen en registratiedagen er nog nodig zijn voor het model |
| Zeven dagen of langer niet gewogen | *de weegreeks staat stil* |
| Wel gewogen, maar twee of meer gaten in de afgelopen zeven dagen | *gaten in de registratie* |

**Wanneer er niets komt:** gewogen én hooguit één gat. Dat is de belangrijkste ontwerpkeuze van het hele ding. Een bericht dat elke dag komt ongeacht de inhoud wordt binnen twee weken weggeklikt, en dan is het kanaal weg op het moment dat er wél iets te melden valt.

`kal_prikkel_log` heeft een unieke sleutel op gebruiker + datum + soort, dus dubbel versturen kan niet — ook niet als de job twee keer vuurt.

**Uitzetten of bijstellen** gaat via één regel:

```sql
update kal_config set waarde = 'nee' where sleutel = 'prikkel_aan';   -- helemaal uit
update kal_config set waarde = '7'   where sleutel = 'prikkel_uur';   -- een uur eerder
update kal_config set waarde = '…'   where sleutel = 'prikkel_email'; -- andere ontvanger
```

**Waarom niet via `send-email`.** Dat was de eerste opzet, en de testverzending gaf 401. De service-role-sleutel in `vault.decrypted_secrets` (aangemaakt 22 juli, oud JWT-formaat) matcht niet meer met wat de functies in hun runtime hebben staan. `kal-prikkel` haalt zijn sleutel daarom uit de eigen omgeving en praat rechtstreeks met Resend. Die sleutel klopt per definitie en overleeft een rotatie.

Het endpoint staat open (`verify_jwt: false`) maar doet niets zonder het gedeelde geheim uit `kal_config.prikkel_geheim`. Zonder dat geheim: 401, geverifieerd.

---

## 2. Het weekbericht — maandagochtend, door Claude

Een geplande taak (`Kalibratie — weekbericht`, maandag 06:00 UTC, dus acht uur in de zomer en zeven in de winter). Die leest via de Supabase-koppeling één functie uit en schrijft daar een analyse bij. Melding komt op je telefoon en in je inbox.

**De cijfers komen uit `kal_weekcijfers(gebruiker)`** — één SQL-functie die de hele stand teruggeeft: regressie over de wegingen met standaardfout, gemiddelde inname en spreiding, het verbruik met interval, het doel, het eiwitgemiddelde tegen het doel op gecorrigeerd gewicht, de gaten, en de vlag `te_snel`.

De regressie gebruikt de ingebouwde `regr_*`-aggregaten; de standaardfout van de helling volgt exact uit `sxx` en `syy`. Geen handwerk, geen benadering.

**De opdracht schrijft voor wat er niet mag.** Nooit het puntgetal zonder interval. Geen waarschuwing over de trend onder de zeven wegingen, want daaronder is de helling ruis. Bij `te_snel`: het advies is méér eten. Geen aanmoediging, geen uitroeptekens, één concrete verandering per week en niet drie. Draait de Supabase-koppeling niet in die sessie, dan meldt hij dat in één zin en stopt — er wordt niet gegokt.

**Eén ongemak, expliciet.** `kal_weekcijfers` is de rekenkern een tweede keer, nu in SQL. Twee implementaties kunnen uit elkaar lopen. Het alternatief — een geplande sessie die zelf gaat rekenen — is minder reproduceerbaar, dus dit is de minste van twee kwaden. **Wijzig je de kern in `kalibratie/index.html`, wijzig hem dan hier ook.** De ijkpunten staan in `VERANTWOORDING.md`.

---

## 3. Twee dingen die ik onderweg tegenkwam, buiten dit project

Geen onderdeel van Kalibratie, wel jouw systeem.

**`measurement-alerts-hourly` loopt elk uur in een time-out.** In de laatste zes uur zes runs, alle zes afgebroken op `Timeout of 5000 ms`. Dat is de standaardlimiet van pg_net, en die is te kort voor een edge function die koud start. De job draait dus al die tijd voor niets. Oplossing is één parameter: `timeout_milliseconds := 25000` in de `net.http_post`-aanroep. `kalibratie-prikkel` heeft die al.

**De service-role-sleutel in de vault matcht niet meer.** Alle cron-jobs die `vault.decrypted_secrets` gebruiken — `sciencepulse-monday`, `sciencepulse-thursday`, `measurement-alerts-hourly`, `patient-nudge-daily`, `voeding-fotos-opruimen` — sturen die sleutel mee als `Authorization`. Mijn testaanroep naar `send-email` met precies die sleutel kreeg 401. Ik heb dat niet verder uitgezocht en niets aangepast: het raakt productie en het is jouw beslissing. Maar het is de moeite waard om één van die jobs handmatig te vuren en de respons te bekijken.

**En los daarvan:** de modelnaam in `chat-ai` (`claude-sonnet-4-20250514`) bestaat niet meer op je Anthropic-sleutel. Alles wat daar naar Sonnet routeert — contentgeneratie, intakesamenvattingen, behandelnarratieven, fotoanalyse — valt terug op OpenAI of geeft een fout.

---

## Overzicht

| Onderdeel | Waar | Wanneer |
|---|---|---|
| `kalibratie-prikkel` | pg_cron → `kal-prikkel` → Resend | dagelijks 08:00 |
| `Kalibratie — weekbericht` | geplande Claude-taak → `kal_weekcijfers` | maandag 08:00 |
| `kal-ai` | edge function, Sonnet 5 | op aanroep vanuit de app |
| `kal_nevo_zoek` | één zoekfunctie, gedeeld door de app en `kal-ai` | bij elk zoeken |
| 15 tabellen, 18 functies | schema `public`, prefix `kal_` | — |

Alles staat of valt bij één ding dat geen enkele automatisering kan overnemen: de ochtendweging. De prikkel herinnert eraan, het weekbericht rekent ermee, maar niemand kan hem voor je verzinnen.
