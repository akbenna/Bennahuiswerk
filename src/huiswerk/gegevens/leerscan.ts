/**
 * DE LEERSCAN — hoe leer jij eigenlijk?
 *
 * WAT DIT NIET IS
 *
 * Dit is geen leerstijlentest. Het idee dat een kind "visueel", "auditief" of
 * "kinesthetisch" leert en dus zo les moet krijgen, is een van de best
 * onderzochte en best weerlegde ideeën in het onderwijs: kinderen hébben
 * voorkeuren, maar lesgeven volgens die voorkeur levert geen betere resultaten
 * op (Pashler e.a. 2008; Kirschner 2017). Een test die zo'n etiket uitdeelt
 * voelt persoonlijk en helpt niet, en erger: hij geeft een kind een reden om te
 * zeggen "ik ben nu eenmaal geen talenmens".
 *
 * WAT DIT WEL IS
 *
 * Een scan van wat een kind dóét als het leert. Dát verschilt echt per kind, is
 * te veranderen, en de technieken die werken zijn voor iedereen dezelfde. De
 * vijf dingen hieronder zijn de best onderbouwde die er zijn:
 *
 *   ophalen   — jezelf toetsen in plaats van herlezen (retrieval practice)
 *   spreiden  — verdelen over dagen in plaats van één avond (spaced practice)
 *   mengen    — door elkaar oefenen in plaats van per soort (interleaving)
 *   nakijken  — uitzoeken wáárom iets fout ging, niet alleen dát
 *   beginnen  — starten, doorzetten, aandacht vasthouden
 *
 * Deze app is toevallig precies op de eerste vier gebouwd — Leitner is
 * ophalen én spreiden, de mix-oefening is mengen, en het foutenlogboek is
 * nakijken. De scan wijst een kind dus naar knoppen die er al zitten.
 *
 * DE VRAGEN
 *
 * Situaties, geen zelfbeoordeling. "Wat doe je meestal de avond voor een toets"
 * levert eerlijker antwoorden op dan "ben jij een planner". Volledig eerlijk
 * wordt het nooit — een kind voelt welk antwoord braaf klinkt — en daarom staat
 * er in het ouderscherm bij dat dit een gespreksopening is en geen meting.
 */

export type Dimensie = 'ophalen' | 'spreiden' | 'mengen' | 'nakijken' | 'beginnen'

export interface Scanvraag {
  id: string
  dim: Dimensie
  vraag: string
  /** Drie antwoorden, oplopend van 0 naar 2 punten. */
  opties: [string, string, string]
}

export interface Dimensiekaart {
  dim: Dimensie
  kop: string
  emoji: string
  /** Wat deze gewoonte is, in één zin voor het kind. */
  wat: string
  /** Waarom het werkt — voor de ouder, en voor een kind dat wil weten waarom. */
  waarom: string
  /** Advies per band: zwak, midden, sterk. */
  advies: [string, string, string]
  /** Waar in deze app je er meteen mee aan de slag kunt. */
  inDeApp: string
}

export const DIMENSIES: Dimensiekaart[] = [
  {
    dim: 'ophalen', kop: 'Jezelf overhoren', emoji: '🧠',
    wat: 'Iets uit je hoofd terughalen zonder te kijken.',
    waarom: 'Verreweg het sterkste effect van alle leertechnieken. Herlezen voelt goed omdat '
      + 'de tekst bekend wordt, maar dat gevoel van herkenning is precies waarom het misleidt: '
      + 'je weet dan dat je het gezien hebt, niet dat je het kunt.',
    advies: [
      'Dit is waar je het meeste te winnen hebt. Doe het boek dicht en zeg hardop wat je nog '
      + 'weet — dat voelt zwaarder dan overlezen, en dat is precies het punt.',
      'Je toetst jezelf al af en toe. Maak er een vaste stap van: elk stukje dat je gelezen '
      + 'hebt eerst dichtklappen en navertellen voordat je verder gaat.',
      'Je toetst jezelf uit jezelf. Houd dat vast — dit is de gewoonte die het meest oplevert.',
    ],
    inDeApp: 'De hele app werkt zo: je krijgt de vraag, jij haalt het antwoord op. '
      + 'De oefentoets is de zwaarste vorm ervan.',
  },
  {
    dim: 'spreiden', kop: 'Verdelen over dagen', emoji: '📅',
    wat: 'Kort en vaak, in plaats van één lange avond.',
    waarom: 'Dezelfde tijd verdeeld over meer dagen levert veel meer blijvende kennis op dan '
      + 'in één keer. Juist het stukje vergeten tussendoor maakt het ophalen daarna sterker.',
    advies: [
      'Hier zit je grootste winst. Vier keer een kwartier over de week levert meer op dan één '
      + 'uur op de avond ervoor — dezelfde tijd, veel beter resultaat.',
      'Je begint niet op het laatste moment, maar het mag gelijkmatiger. Zet een klein dagdoel '
      + 'en haal dat élke dag; dat werkt beter dan twee grote sessies.',
      'Je verdeelt je werk goed. Dat is de gewoonte waar je later, met echte examenstof, '
      + 'het meest aan hebt.',
    ],
    inDeApp: 'Het dagdoel en de dagreeks 🔥 zijn hiervoor gemaakt. Zet het doel liever laag '
      + 'en haal het elke dag.',
  },
  {
    dim: 'mengen', kop: 'Door elkaar oefenen', emoji: '🎲',
    wat: 'Verschillende soorten sommen door elkaar, niet twintig van hetzelfde.',
    waarom: 'Twintig sommen van één soort achter elkaar voelt goed en gaat snel, maar dan oefen '
      + 'je alleen het uitrekenen. Op een toets moet je éérst herkennen welk soort het is, en '
      + 'dat oefen je alleen als ze door elkaar staan.',
    advies: [
      'Dit verklaart waarschijnlijk waarom oefenen thuis goed gaat en de toets tegenvalt. Oefen '
      + 'vaker door elkaar — het voelt moeilijker en het werkt beter.',
      'Je mengt af en toe. Sluit je oefenronde voortaan af met een mix: eerst het soort oefenen, '
      + 'dan door elkaar.',
      'Je oefent al door elkaar. Dat is de vorm die het dichtst bij een echte toets komt.',
    ],
    inDeApp: 'De knop 🎲 Mix-oefening en de 📝 Proeftoets zetten de soorten juist door elkaar.',
  },
  {
    dim: 'nakijken', kop: 'Iets doen met je fouten', emoji: '🔍',
    wat: 'Uitzoeken wáárom iets fout ging, niet alleen dát het fout was.',
    waarom: 'Een fout is de plek waar je nog iets kunt leren; de goede sommen leren je niets '
      + 'nieuws. Wie alleen het juiste antwoord overneemt, maakt dezelfde fout over twee weken '
      + 'opnieuw.',
    advies: [
      'Hier laat je het meeste liggen. Bij elke fout één zin opschrijven — "ik vergat de eenheid" '
      + '— en die fout later nog eens maken. Dat is de snelste manier om vooruit te gaan.',
      'Je kijkt naar je fouten, maar vaak alleen naar het goede antwoord. Zoek er de oorzaak bij: '
      + 'rekenfout, verkeerde formule, of vraag verkeerd gelezen?',
      'Je gebruikt je fouten. Dat is precies wat het verschil maakt tussen oefenen en leren.',
    ],
    inDeApp: 'De knop 📕 Mijn fouten oefenen zet alleen de sommen klaar die je fout had.',
  },
  {
    dim: 'beginnen', kop: 'Beginnen en volhouden', emoji: '🚀',
    wat: 'Op gang komen, afleiding wegleggen, doorgaan als het tegenzit.',
    waarom: 'De beste techniek doet niets als je niet begint. Uitstel komt zelden door luiheid — '
      + 'meestal is de eerste stap te groot gemaakt. Een telefoon binnen handbereik kost al '
      + 'aandacht als je er niet naar kijkt.',
    advies: [
      'Maak de eerste stap belachelijk klein: vijf sommen, niet "leren voor de toets". En leg '
      + 'je telefoon in een andere kamer — naast je, op stil, is niet genoeg.',
      'Je komt op gang, maar met moeite. Werk in blokjes van 25 minuten met 5 minuten pauze, '
      + 'en zet die eerste 25 minuten zonder telefoon.',
      'Je begint gewoon. Dat is minder vanzelfsprekend dan het lijkt en scheelt je veel tijd.',
    ],
    inDeApp: 'Zet je dagdoel laag genoeg dat je hem altijd haalt. Een gehaald klein doel werkt '
      + 'beter dan een gemist groot doel.',
  },
]

/* Drie vragen per dimensie, en ze staan door elkaar: staan alle vragen over
   uitstelgedrag op een rij, dan hoort een kind halverwege waar het over gaat en
   gaat het antwoorden wat netjes klinkt. */
export const SCANVRAGEN: Scanvraag[] = [
  {
    id: 'o1', dim: 'ophalen',
    vraag: 'Je moet woordjes leren voor Engels. Wat doe je meestal?',
    opties: [
      'De lijst een paar keer overlezen',
      'De woordjes overschrijven',
      'De vertaling afdekken en mezelf overhoren',
    ],
  },
  {
    id: 's1', dim: 'spreiden',
    vraag: 'Wanneer begin je meestal met leren voor een toets?',
    opties: [
      'De avond ervoor',
      'Een dag of twee van tevoren',
      'Ik verdeel het over de hele week',
    ],
  },
  {
    id: 'n1', dim: 'nakijken',
    vraag: 'Je hebt een som fout. Wat doe je dan?',
    opties: [
      'Ik ga door naar de volgende',
      'Ik kijk wat het goede antwoord was',
      'Ik zoek uit waar het misging en maak hem opnieuw',
    ],
  },
  {
    id: 'm1', dim: 'mengen',
    vraag: 'Als je sommen oefent, hoe staan die er meestal bij?',
    opties: [
      'Twintig van hetzelfde soort achter elkaar',
      'Per hoofdstuk, dus meestal wel bij elkaar',
      'Lekker door elkaar',
    ],
  },
  {
    id: 'b1', dim: 'beginnen',
    vraag: 'Waar ligt je telefoon als je huiswerk maakt?',
    opties: [
      'Naast me, ik kijk er regelmatig op',
      'Naast me, maar op stil',
      'In een andere kamer, of uit',
    ],
  },
  {
    id: 'o2', dim: 'ophalen',
    vraag: 'Je hebt de uitleg gelezen en denkt: ik snap het. Wat doe je dan?',
    opties: [
      'Klaar, door naar het volgende',
      'Nog een keer lezen om het zeker te weten',
      'Boek dicht en het in eigen woorden navertellen',
    ],
  },
  {
    id: 'n2', dim: 'nakijken',
    vraag: 'Weet je nog welke fouten je vorige week maakte?',
    opties: [
      'Geen idee',
      'Vaag, ik weet ongeveer wat lastig was',
      'Ja, ik houd ze bij',
    ],
  },
  {
    id: 's2', dim: 'spreiden',
    vraag: 'Je hebt deze week drie uur voor een vak. Hoe verdeel je dat?',
    opties: [
      'In één keer, aan het eind van de week',
      'Twee keer anderhalf uur',
      'Elke dag een half uurtje',
    ],
  },
  {
    id: 'm2', dim: 'mengen',
    vraag: 'Op een toets staan verschillende soorten sommen door elkaar. Hoe gaat dat?',
    opties: [
      'Lastig — ik zie vaak niet meteen welk soort het is',
      'Soms twijfel ik even',
      'Meestal zie ik meteen wat voor som het is',
    ],
  },
  {
    id: 'b2', dim: 'beginnen',
    vraag: 'Je moet aan je huiswerk beginnen. Hoe gaat dat meestal?',
    opties: [
      'Ik stel het uit tot het echt moet',
      'Het duurt even voor ik zit',
      'Ik ga gewoon zitten en begin',
    ],
  },
  {
    id: 'o3', dim: 'ophalen',
    vraag: 'Hoe weet je of je iets echt kent?',
    opties: [
      'Het voelt bekend als ik het zie',
      'Ik heb het vaak genoeg gelezen',
      'Ik kan het opzeggen of uitrekenen zonder te kijken',
    ],
  },
  {
    id: 'm3', dim: 'mengen',
    vraag: 'Je hebt net een som goed. Wat doe je daarna het liefst?',
    opties: [
      'Nog een paar van precies hetzelfde soort',
      'Door met het hoofdstuk',
      'Juist een ander soort, om te kijken of ik het nog herken',
    ],
  },
  {
    id: 'n3', dim: 'nakijken',
    vraag: 'Je krijgt een toets terug. Waar kijk je het eerst naar?',
    opties: [
      'Het cijfer',
      'Welke vragen fout waren',
      'Waarom die vragen fout gingen',
    ],
  },
  {
    id: 's3', dim: 'spreiden',
    vraag: 'Iets wat je vorige maand geleerd hebt — hoe zit dat er nu bij?',
    opties: [
      'Dat ben ik meestal weer kwijt',
      'Het komt terug als ik het teruglees',
      'Ik haal het af en toe opnieuw op, dus het blijft zitten',
    ],
  },
  {
    id: 'b3', dim: 'beginnen',
    vraag: 'Je loopt vast op een opgave. Wat gebeurt er dan?',
    opties: [
      'Ik haak af of ga iets anders doen',
      'Ik vraag meteen hulp',
      'Ik probeer het eerst zelf nog een paar minuten, dan vraag ik hulp',
    ],
  },
]
