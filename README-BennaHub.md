# BennaHub

Eén startpagina, drie apps. Alles is statische HTML: geen build-stap, geen server,
geen dependencies behalve Google Fonts. Wat hier staat, is wat er draait.

```
index.html          de startpagina (klein, alleen doorverwijzing)
huiswerk/           de oefenapp voor de kinderen — ongewijzigd, alleen een link terug
  index.html          de live versie (voorgecompileerd, niet met de hand bewerken)
  index.dev.html      de bron met JSX en de oefenstof
sanad/index.html    Sanad — achtentwintig weken islamitische wetenschappen
arabisch/index.html Lisan — Arabisch voor het hele gezin
```

## Centrale opslag

Sanad en Lisan slaan voortgang op in `localStorage` én centraal, zodat je op elk
toestel verder gaat waar je gebleven was. De opslag loopt via het bestaande
Supabase-project, tabel `bennahub_state`, met vier `SECURITY DEFINER`-functies:

| functie | doet |
|---|---|
| `bennahub_register(app, account, pin, data)` | account aanmaken |
| `bennahub_load(app, account, pin)` | ophalen |
| `bennahub_save(app, account, pin, data)` | wegschrijven |
| `bennahub_accounts(app)` | namen opsommen, zonder gegevens |

De tabel zelf is voor `anon` afgeschermd; alle toegang loopt via die functies en
vereist het wachtwoord. Het wachtwoord staat gehasht (bcrypt).

**De regel bij het samenvoegen is: niets weggooien.** Bij het openen wordt de
centrale kopie opgehaald en samengevoegd met wat er lokaal staat — nooit
overschreven. Een week die ergens is afgerond blijft afgerond, een kaart houdt
zijn verste interval, een profiel dat aan één kant bestaat blijft bestaan. Zonder
internet werkt alles gewoon door en wordt er bij de volgende verbinding
gelijkgetrokken.

De gedeelde code hiervoor (`WOLK` en `SAMEN`) staat letterlijk in beide apps,
bovenaan het scriptblok. Bewust gedupliceerd: één zelfstandig bestand per app
weegt zwaarder dan het vermijden van die dubbeling.

## Accounts

- **Sanad** — één account, voor Abdelkader. In te stellen onder *Instellingen*.
- **Lisan** — één gezinsaccount met daarbinnen vijf leerprofielen (Hanae, Selma,
  Amine, Wassima, Amaani). In te stellen onder *Ouder*. Bij een lege installatie
  staat er een knop klaar die de vijf profielen in één keer aanmaakt.
- **Huiswerk** — houdt zijn eigen bestaande inlog per kind. Ongewijzigd.

## De AI-functies in Sanad

*Doorvragen* en *laat meelezen* praten rechtstreeks met de Anthropic-API vanuit de
browser. Daarvoor is een eigen sleutel nodig, in te vullen onder *Instellingen*;
die blijft in `localStorage` van dat ene toestel en gaat niet mee naar de centrale
opslag. Zonder sleutel werkt de rest van de app volledig.

Wil je dat later netter: zet het geheel op Vercel en verplaats de aanroep naar een
serverless functie, dan hoeft de sleutel de browser niet meer in.

## Onderhoud

De huiswerkapp bouw je zoals altijd: bewerk `huiswerk/index.dev.html` en compileer
naar `huiswerk/index.html` (zie `BUILD.md`). Sanad en Lisan zijn gewone HTML —
openen, bewerken, klaar. Let bij beide op de terugpijl naar `../`; die veronderstelt
dat de app in een submap onder de hub staat.
