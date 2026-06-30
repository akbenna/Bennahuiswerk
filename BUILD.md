# Structuur & snel laden

De app is bewust **licht en snel** gemaakt: de browser hoeft géén Babel (±3 MB) te
downloaden en hoeft niets meer live te compileren. De render start daardoor in
~0,1 s in plaats van enkele seconden.

## Bestanden
- **`index.html`** — de **live versie** die wordt geserveerd. Deze is
  *voorgecompileerd* (JSX is al omgezet naar `React.createElement`), zonder Babel.
  Dit is het bestand dat snel laadt. Niet met de hand bewerken — wordt gegenereerd.
- **`index.dev.html`** — de **bron** (leesbare versie met JSX en de oefenstof).
  Hierin worden wijzigingen gemaakt.
- **`ROADMAP.md`** — dekking en verbeterlijst.

## Bewerken & opnieuw bouwen
1. Pas `index.dev.html` aan (oefenstof staat in de `SEED`- en `TEMPLATES`-lijsten,
   bovenaan goed leesbaar).
2. Genereer daarna `index.html` opnieuw door de JSX voor te compileren met de
   React-preset (classic runtime), de Babel-`<script>` te verwijderen en de
   gecompileerde code als gewone `<script>` terug te plaatsen.

De oefenstof (vragen/antwoorden) staat in beide bestanden als gewone data en is
ook in `index.html` gewoon leesbaar; alleen de schermcode is daar voorgecompileerd.

## Waarom dit sneller is
- **Geen Babel in de browser** → scheelt ±3 MB download en alle compile-tijd.
- **React/ReactDOM** komen als kleine, gecachte bestanden van een CDN.
- Eén zelfstandig HTML-bestand, geen extra requests voor de app zelf.
