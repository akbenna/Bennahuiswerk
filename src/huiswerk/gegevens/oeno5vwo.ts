/**
 * O&O (TECHNASIUM) VOOR 5 VWO
 *
 * O&O had nul opgaven. Er is ook geen examenprogramma met hoofdstukken: het
 * Technasium werkt met projecten voor echte opdrachtgevers. Wat in elk project
 * terugkomt, en wat bij de beoordeling telt, zijn drie vaardigheden:
 *
 *   onderzoeken   variabelen, hypothese, betrouwbaar en valide, de uitschieter
 *   ontwerpen     programma van eisen, eis en wens, de ontwerpcyclus, de
 *                 beslismatrix
 *   projectwerk   SMART, de planning met het kritieke pad, bronnen en
 *                 samenwerken
 *
 * Dat laatste is met opzet: projectwerk ís plannen, en plannen is waar Amaani
 * op vastloopt. De opgaven over het kritieke pad en de speling zijn hetzelfde
 * rekenwerk als het planbord doet.
 *
 * Zes opgaven per onderwerp per niveau. Begrip als meerkeuze, zoals bij
 * biologie; de begrippen die je moet kunnen noemen als invulvraag met de
 * gangbare varianten.
 */
import type { Opgave } from './soorten'

type Ruw = Omit<Opgave, 'id'>

const ja = ['ja', 'nee']

const ONDERZOEKEN: Ruw[] = [
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Hoe heet de variabele die je in een experiment zelf verandert?',a:'onafhankelijke variabele',alt:['onafhankelijke','onafhankelijk','de onafhankelijke variabele'],h:['Hij hangt niet van iets anders af: jij kiest hem.'],s:'De onafhankelijke variabele: die stel jij in.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Hoe heet de variabele die je meet om te zien wat er verandert?',a:'afhankelijke variabele',alt:['afhankelijke','afhankelijk','de afhankelijke variabele'],h:['Hij hangt af van wat jij verandert.'],s:'De afhankelijke variabele: die meet je.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Hoe heten de variabelen die je bewust gelijk houdt?',a:'constante variabelen',alt:['constanten','gecontroleerde variabelen','controlevariabelen','constante','vaste variabelen'],h:['Je houdt ze constant, zodat ze de uitkomst niet beïnvloeden.'],s:'Constante (gecontroleerde) variabelen.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Hoe heet een verwachting die je vooraf opschrijft en met je onderzoek kunt toetsen?',a:'hypothese',alt:['een hypothese','verwachting'],h:['Begint vaak met "Als ..., dan ...".'],s:'Een hypothese: een toetsbare verwachting.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Een meting die bij herhaling steeds (ongeveer) hetzelfde oplevert, is ...',a:'betrouwbaar',opties:['betrouwbaar','valide'],h:['Kun je erop vertrouwen dat het nog eens zo uitkomt?'],s:'Betrouwbaar: herhaalbaar, weinig toeval.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:1,q:'Je meet echt wat je wilt meten. De meting is dan ...',a:'valide',opties:['betrouwbaar','valide'],h:['Meet je het goede?'],s:'Valide (geldig): je meet wat je bedoelt te meten.'},

  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Onderzoeksvraag: "Hoe hangt de groei van tuinkers af van de hoeveelheid licht?" Wat is de onafhankelijke variabele?',a:'de hoeveelheid licht',opties:['de hoeveelheid licht','de groei van de tuinkers','de soort grond'],h:['Wat stel jij in?'],s:'De hoeveelheid licht stel je in; de groei meet je.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Zelfde onderzoek. Wat is de afhankelijke variabele?',a:'de groei van de tuinkers',opties:['de hoeveelheid licht','de groei van de tuinkers','de hoeveelheid water'],h:['Wat meet je?'],s:'De groei van de tuinkers.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Waarom herhaal je een meting meerdere keren?',a:'om de betrouwbaarheid te vergroten',opties:['om de betrouwbaarheid te vergroten','om de hypothese te bewijzen','omdat het verslag langer moet'],h:['Toevallige fouten middelen uit.'],s:'Herhalen verkleint de invloed van toevallige fouten: de uitkomst wordt betrouwbaarder.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Je houdt een enquête alleen onder je eigen vrienden. Wat is het probleem?',a:'de steekproef is geen goede afspiegeling',opties:['de steekproef is geen goede afspiegeling','vrienden geven altijd eerlijke antwoorden','een enquête is nooit betrouwbaar'],h:['Lijken je vrienden op de hele doelgroep?'],s:'De steekproef is niet representatief: je vrienden lijken op jou en niet op de hele doelgroep.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Een open vraag in een enquête levert vooral ... gegevens op.',a:'kwalitatieve',opties:['kwalitatieve','kwantitatieve'],h:['Woorden of getallen?'],s:'Kwalitatief: woorden, meningen, redenen. Kwantitatief: getallen die je kunt optellen.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:2,q:'Wat krijgt een controlegroep?',a:'alles hetzelfde, behalve de behandeling',opties:['alles hetzelfde, behalve de behandeling','een andere behandeling en ander voer','niets, de groep wordt niet gemeten'],h:['Waarmee vergelijk je het effect?'],s:'Een controlegroep krijgt alles hetzelfde behalve de behandeling. Dan weet je dat een verschil door de behandeling komt.'},

  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'Je test of een nieuw isolatiemateriaal beter isoleert. De doos met het materiaal staat in de schaduw, de doos zonder in de zon. Wat is het probleem?',a:'een niet-gecontroleerde variabele beïnvloedt de uitkomst',opties:['een niet-gecontroleerde variabele beïnvloedt de uitkomst','de meting is valide maar niet betrouwbaar','er is geen hypothese'],h:['Wat is er naast het materiaal nog meer verschillend?'],s:'Zon en schaduw is een tweede verschil. Je weet nu niet of het verschil door het materiaal komt of door de zon.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'Hypothese: "Hoe hoger de temperatuur van het water, hoe sneller een suikerklontje oplost." Is deze hypothese toetsbaar?',a:'ja',opties:ja,h:['Kun je temperatuur instellen en de tijd meten?'],s:'Ja: je kunt de temperatuur variëren en de oplostijd meten.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'De ijsverkoop en het aantal verdrinkingen stijgen tegelijk. Betekent dit dat ijs eten verdrinking veroorzaakt?',a:'nee',opties:ja,h:['Is er iets anders dat beide veroorzaakt?'],s:'Nee. Beide stijgen door warm weer. Samenhang (correlatie) is nog geen oorzaak.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'Je meet vijf keer: 12, 13, 12, 30 en 13 seconden. Wat doe je met 30?',a:'nagaan of het een meetfout is, en dat in je verslag vermelden',opties:['nagaan of het een meetfout is, en dat in je verslag vermelden','gewoon weglaten, het past niet','het gemiddelde ermee uitrekenen alsof er niets aan de hand is'],h:['Een uitschieter mag je niet zomaar weggooien.'],s:'Een uitschieter onderzoek je: was er een meetfout? Laat je hem weg, dan zeg je dat en waarom.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'Bereken het gemiddelde van 12, 13, 12 en 13 seconden.',a:'12,5',u:'s',h:['Optellen en delen door het aantal.'],s:'(12 + 13 + 12 + 13) ÷ 4 = 50 ÷ 4 = 12,5 s.'},
  {p:'amaani',v:'oeno',t:'Onderzoeken',lvl:3,q:'Waarom beschrijf je je werkwijze zo precies dat een ander het onderzoek kan herhalen?',a:'zodat het controleerbaar en herhaalbaar is',opties:['zodat het controleerbaar en herhaalbaar is','omdat de opdrachtgever dat leuk vindt','zodat het verslag er professioneel uitziet'],h:['Hoe weet een ander dat jouw uitkomst klopt?'],s:'Een onderzoek dat een ander kan herhalen, kan worden gecontroleerd. Dat maakt je conclusie geloofwaardig.'},
]

const ONTWERPEN: Ruw[] = [
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Hoe heet de lijst met eisen en wensen waaraan een ontwerp moet voldoen?',a:'programma van eisen',alt:['pve','het programma van eisen','programma van eisen (pve)'],h:['Afgekort PvE.'],s:'Het programma van eisen (PvE).'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Een eis is ...',a:'iets waaraan het ontwerp moet voldoen',opties:['iets waaraan het ontwerp moet voldoen','iets wat mooi zou zijn als het lukt'],h:['Moet of mag?'],s:'Een eis moet. Haalt het ontwerp een eis niet, dan is het ontwerp niet goed.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Een wens is ...',a:'iets wat mooi zou zijn als het lukt',opties:['iets waaraan het ontwerp moet voldoen','iets wat mooi zou zijn als het lukt'],h:['Moet of mag?'],s:'Een wens mag: hij maakt het ontwerp beter, maar is niet verplicht.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Waarmee begint de ontwerpcyclus?',a:'het probleem analyseren',opties:['het probleem analyseren','een prototype bouwen','het ontwerp testen'],h:['Wat moet je eerst begrijpen?'],s:'Eerst analyseer je het probleem en de vraag van de opdrachtgever.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Hoe heet een eerste werkend model dat je bouwt om te testen?',a:'prototype',alt:['een prototype','proefmodel'],h:['Proto = eerste.'],s:'Een prototype.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:1,q:'Voor wie een product bedoeld is, heet de ...',a:'doelgroep',alt:['de doelgroep','gebruikers'],h:['De groep mensen die het gaat gebruiken.'],s:'De doelgroep.'},

  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Welke eis is goed geformuleerd?',a:'De lamp weegt maximaal 500 g.',opties:['De lamp weegt maximaal 500 g.','De lamp is licht.','De lamp ziet er mooi uit.'],h:['Kun je achteraf meten of het gelukt is?'],s:'Een goede eis is meetbaar: "maximaal 500 g" kun je controleren, "licht" en "mooi" niet.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Welke eis is meetbaar?',a:'Het apparaat werkt minstens 8 uur op één acculading.',opties:['Het apparaat werkt minstens 8 uur op één acculading.','Het apparaat gaat lang mee.','Het apparaat is gebruiksvriendelijk.'],h:['Staat er een getal met een eenheid?'],s:'"Minstens 8 uur" kun je testen.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Waarvoor gebruik je een morfologisch schema?',a:'om deeloplossingen te combineren tot concepten',opties:['om deeloplossingen te combineren tot concepten','om de planning te maken','om bronnen te vermelden'],h:['Per functie een paar oplossingen, en dan combineren.'],s:'Per deelfunctie zet je mogelijke oplossingen naast elkaar; door ze te combineren ontstaan concepten.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Waarvoor gebruik je een beslismatrix (keuzetabel)?',a:'om concepten te vergelijken op criteria met een weging',opties:['om concepten te vergelijken op criteria met een weging','om de taken te verdelen','om de hypothese te toetsen'],h:['Scores per criterium, keer hoe belangrijk dat criterium is.'],s:'Je geeft elk concept scores op de criteria uit het PvE, vermenigvuldigt met de weging en telt op.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Wat doe je nadat je je prototype hebt getest?',a:'het ontwerp verbeteren en opnieuw testen',opties:['het ontwerp verbeteren en opnieuw testen','meteen het eindverslag schrijven','een nieuw probleem zoeken'],h:['Ontwerpen gaat in rondes.'],s:'Je verbetert het ontwerp op grond van de test en test opnieuw: de ontwerpcyclus is iteratief.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:2,q:'Hoe heet het bedrijf of de persoon die de opdracht geeft?',a:'opdrachtgever',alt:['de opdrachtgever','klant'],h:['Die geeft de opdracht.'],s:'De opdrachtgever.'},

  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'Beslismatrix. Criteria met weging: veiligheid 3, prijs 2, uiterlijk 1. Concept A scoort 4, 2 en 5. Bereken de totaalscore van A.',a:'21',h:['Score × weging, per criterium, en dan optellen.'],s:'3 × 4 + 2 × 2 + 1 × 5 = 12 + 4 + 5 = 21.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'Zelfde matrix (veiligheid 3, prijs 2, uiterlijk 1). Concept B scoort 3, 5 en 3. Bereken de totaalscore van B.',a:'22',h:['Score × weging, en optellen.'],s:'3 × 3 + 2 × 5 + 1 × 3 = 9 + 10 + 3 = 22.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'A scoort 21, B scoort 22. Welk concept kies je op grond van de matrix?',a:'B',opties:['A','B'],h:['De hoogste gewogen score.'],s:'B, al scoort A beter op veiligheid. Zo laat de matrix zien wat de weging doet; bespreek dat in je verslag.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'Een ontwerp voldoet aan alle wensen, maar niet aan één eis. Is het ontwerp acceptabel?',a:'nee',opties:ja,h:['Wat is het verschil tussen een eis en een wens?'],s:'Nee: een eis moet. Wensen maken dat niet goed.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'Waarom leg je in je verslag ook vast welke concepten je níet koos, en waarom?',a:'zodat je keuze verantwoord en navolgbaar is',opties:['zodat je keuze verantwoord en navolgbaar is','omdat het verslag dan langer wordt','omdat de opdrachtgever alle concepten wil kopen'],h:['Hoe laat je zien dat je goed hebt gekozen?'],s:'Wie je verslag leest, moet kunnen volgen waarom dit concept het beste was. Dat kan alleen als de alternatieven erin staan.'},
  {p:'amaani',v:'oeno',t:'Ontwerpen',lvl:3,q:'Ontwerpen is een iteratief proces. Wat betekent dat?',a:'je doorloopt de stappen meerdere keren',opties:['je doorloopt de stappen meerdere keren','je doet alle stappen precies één keer','je begint bij het eindproduct'],h:['Iteratie = herhaling.'],s:'Je doorloopt de cyclus meerdere keren, en het ontwerp wordt elke ronde beter.'},
]

const PROJECTWERK: Ruw[] = [
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'SMART: waar staat de M voor?',a:'meetbaar',h:['Kun je zien of het gelukt is?'],s:'Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'SMART: waar staat de S voor?',a:'specifiek',h:['Precies, niet vaag.'],s:'Specifiek: precies omschreven.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'SMART: waar staat de T voor?',a:'tijdgebonden',alt:['tijdsgebonden','tijdgebonden (deadline)'],h:['Wanneer moet het af zijn?'],s:'Tijdgebonden: er staat een datum bij.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'Hoe heet een planning met balken die laten zien wanneer elke taak loopt?',a:'Gantt-chart',alt:['gantt','ganttchart','gantt-diagram','ganttdiagram','gantt chart','strokenplanning','balkenplanning'],h:['Genoemd naar Henry Gantt.'],s:'Een Gantt-chart (strokenplanning).'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'Waarin leg je na een overleg vast wie wat doet en wanneer?',a:'notulen met een actielijst',opties:['notulen met een actielijst','een logboek van je gevoel','het eindverslag'],h:['Afspraken met naam en datum.'],s:'In de notulen, met een actielijst: wat, wie, wanneer.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:1,q:'Wie leidt het overleg en bewaakt de voortgang in een projectgroep?',a:'voorzitter',alt:['de voorzitter','projectleider','de projectleider'],h:['Zit de vergadering voor.'],s:'De voorzitter (of projectleider).'},

  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Welk doel is SMART?',a:'Vóór vrijdag 10 oktober hebben we drie bronnen over isolatiemateriaal samengevat.',opties:['Vóór vrijdag 10 oktober hebben we drie bronnen over isolatiemateriaal samengevat.','We gaan goed onderzoek doen.','We werken hard aan het project.'],h:['Specifiek, meetbaar, met een datum?'],s:'Alleen het eerste doel zegt wat, hoeveel en wanneer.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Wat noem je bij een bronverwijzing in de tekst volgens APA?',a:'de achternaam van de auteur en het jaartal',opties:['de achternaam van de auteur en het jaartal','de titel en de URL','alleen de naam van de website'],h:['Bijvoorbeeld (Jansen, 2024).'],s:'In de tekst: (Achternaam, jaartal). De volledige gegevens staan in de literatuurlijst.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Welke bron is het betrouwbaarst?',a:'een wetenschappelijk artikel',opties:['een wetenschappelijk artikel','een anoniem forumbericht','een reclamefolder'],h:['Wie heeft het gecontroleerd, en wie heeft er belang bij?'],s:'Een wetenschappelijk artikel is door vakgenoten gecontroleerd. Een reclamefolder wil iets verkopen.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Je kunt pas testen als het prototype af is. Bouwen kost 3 dagen, testen 2 dagen. Hoeveel dagen duurt dit minstens?',a:'5',u:'dagen',h:['Na elkaar, niet tegelijk.'],s:'3 + 2 = 5 dagen: de taken hangen van elkaar af.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Een teamgenoot levert zijn deel steeds te laat in. Wat is de eerste stap?',a:'het in de groep bespreken en afspraken vastleggen',opties:['het in de groep bespreken en afspraken vastleggen','zijn werk dan maar zelf doen','meteen naar de docent gaan'],h:['Eerst samen, met afspraken op papier.'],s:'Eerst in de groep bespreken, met concrete afspraken in de notulen. Lukt dat niet, dan pas de begeleider erbij.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:2,q:'Waarvoor houd je een logboek bij?',a:'om te laten zien wie wanneer wat deed en wat je ervan leerde',opties:['om te laten zien wie wanneer wat deed en wat je ervan leerde','om de opdrachtgever te vermaken','omdat het verslag dan dikker wordt'],h:['Bij de beoordeling telt ook het proces.'],s:'Het logboek laat het proces zien: wat je deed, hoe lang het duurde en wat je ervan leerde.'},

  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'Taken: A (2 dagen), B (3 dagen, na A), C (4 dagen, na A), D (1 dag, na B én C). B en C kunnen tegelijk. Hoeveel dagen duurt het project minstens?',a:'7',u:'dagen',h:['Na A lopen B en C tegelijk; D wacht op de langste van de twee.'],s:'A: 2 dagen. Dan B en C tegelijk: de langste is C met 4 dagen. Dan D: 1 dag.\n2 + 4 + 1 = 7 dagen.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'Zelfde project (A 2, B 3, C 4, D 1). Welke taak ligt niet op het kritieke pad?',a:'B',opties:['A','B','C','D'],h:['Het kritieke pad is de langste weg; welke taak heeft speling?'],s:'Het kritieke pad is A, C, D (7 dagen). B duurt korter dan C en mag dus iets uitlopen.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'Zelfde project. Hoeveel dagen speling heeft taak B?',a:'1',u:'dag',h:['B en C lopen tegelijk; C duurt 4 dagen, B 3.'],s:'4 − 3 = 1 dag. B mag één dag uitlopen zonder dat het project later af is.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'De deadline is over 15 werkdagen. Je taken kosten samen 12 dagen, en je houdt 20 % extra tijd aan voor tegenvallers. Past het?',a:'ja',opties:ja,h:['12 dagen plus 20 %.'],s:'12 × 1,2 = 14,4 dagen. Dat past in 15, maar met weinig ruimte.\nZonder die 20 % extra lijkt het ruim, en daar gaat het in de praktijk mis.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'Welke regel hoort in een literatuurlijst volgens APA?',a:'Jansen, P. (2024). Duurzaam bouwen. Boom.',opties:['Jansen, P. (2024). Duurzaam bouwen. Boom.','www.google.nl','Wikipedia, opgezocht in oktober'],h:['Auteur, jaartal, titel, uitgever.'],s:'Auteur, (jaar). Titel. Uitgever. Google is een zoekmachine en geen bron.'},
  {p:'amaani',v:'oeno',t:'Projectwerk',lvl:3,q:'Waarom stel je vóór een tussenpresentatie bij de opdrachtgever vragen op?',a:'om gericht feedback te krijgen waarmee je verder kunt',opties:['om gericht feedback te krijgen waarmee je verder kunt','omdat de presentatie dan langer duurt','omdat de opdrachtgever anders niets zegt'],h:['Wat wil je na afloop weten?'],s:'Met goede vragen krijg je feedback die je direct in de volgende ronde kunt gebruiken.'},
]

export const OENO_5VWO: Ruw[] = [...ONDERZOEKEN, ...ONTWERPEN, ...PROJECTWERK]
