/**
 * UNIT 1 VAN FRANS EN ENGELS, ZOALS DE TOETSEN HEM VRAGEN
 *
 * Uit de schoolapp, 1 oktober 2026:
 *
 *   Frans    SO unité 1 (5 oktober): sortir en partir, de passé composé met
 *            être, en in/naar bij landnamen
 *   Engels   PW grammar unit 1 (8 oktober): object pronouns, possessive
 *            determiners, possessive pronouns, wh-questions, comparisons en
 *            de present simple
 *
 * Dat is basisgrammatica, en dat is het punt: op een proefwerk over zulke stof
 * gaan punten verloren aan slordigheid (its/it’s, -s bij he/she/it, than/then),
 * niet aan onbegrip. Daarom gaat niveau 3 hier over juist die valkuilen.
 *
 * De passé composé met être zelf staat al in `frans5vwo.ts`; hier komt hij
 * terug met sortir en partir, zoals de SO hem combineert.
 *
 * Alles gaat door `metVarianten`: een rechte of gekrulde apostrof, en Frans
 * zonder accenten van een telefoontoetsenbord.
 */
import type { Opgave } from './soorten'
import { metVarianten } from './frans5vwo'

type Ruw = Omit<Opgave, 'id'>

/* ===================================================================== frans */

const SORTIR_PARTIR: Ruw[] = [
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "sortir": je ___',a:'sors',h:['De t van de stam valt weg bij je, tu en il.'],s:'je sors, tu sors, il sort, nous sortons, vous sortez, ils sortent.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "partir": tu ___',a:'pars',h:['Net als je: de t valt weg.'],s:'je pars, tu pars, il part, nous partons, vous partez, ils partent.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "sortir": il ___',a:'sort',h:['Bij il komt de t terug.'],s:'il sort.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "partir": nous ___',a:'partons',h:['Meervoud: de hele stam, met de t.'],s:'nous partons.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "sortir": vous ___',a:'sortez',h:['vous: -ez.'],s:'vous sortez.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:1,q:'Vervoeg "partir": elles ___',a:'partent',h:['ils/elles: -ent, en die hoor je niet.'],s:'elles partent.'},

  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Vervoeg "partir": je ___',a:'pars',h:['Hetzelfde als bij tu.'],s:'je pars.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Vervoeg "sortir": ils ___',a:'sortent',h:['Meervoud, derde persoon.'],s:'ils sortent.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Vervoeg "partir": elle ___',a:'part',h:['Enkelvoud, derde persoon: met t.'],s:'elle part.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Vervoeg "sortir": nous ___',a:'sortons',h:['-ons.'],s:'nous sortons.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Wat betekent "partir"?',a:'vertrekken',alt:['weggaan','vertrekken, weggaan'],h:['Le train part à huit heures.'],s:'partir = vertrekken, weggaan.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:2,q:'Wat betekent "sortir"?',a:'uitgaan',alt:['naar buiten gaan','uit gaan','eruit gaan'],h:['La sortie is de uitgang.'],s:'sortir = uitgaan, naar buiten gaan.'},

  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Passé composé: elle ___ (sortir) hier soir.',a:'est sortie',h:['Werkwoord van beweging: être.','Bij être past het participe zich aan het onderwerp aan.'],s:'elle est sortie: être, en een e omdat elle vrouwelijk is.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Passé composé: nous (jongens) ___ (partir) à huit heures.',a:'sommes partis',h:['être bij nous is sommes.','Mannelijk meervoud: -s.'],s:'nous sommes partis.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Passé composé: mes amies ___ (partir) en vacances.',a:'sont parties',h:['amies: vrouwelijk meervoud.'],s:'mes amies sont parties: -es voor vrouwelijk meervoud.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Passé composé: je (een meisje) ___ (sortir) avec mes copines.',a:'suis sortie',h:['Wie is je hier?'],s:'je suis sortie: een meisje, dus met e.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Waarom is het "elles sont parties" en niet "elles ont parti"?',a:'partir krijgt être, en dan past het participe zich aan het onderwerp aan',opties:['partir krijgt être, en dan past het participe zich aan het onderwerp aan','partir is een onregelmatig werkwoord en krijgt daarom altijd een s','bij elles hoort altijd être'],h:['Denk aan het huis van être: de werkwoorden van beweging.'],s:'partir hoort bij de werkwoorden van beweging die être krijgen. Bij être komt er een e en/of s bij, zoals bij een bijvoeglijk naamwoord.'},
  {p:'amaani',v:'frans',t:'Sortir & partir',lvl:3,q:'Zet in de passé composé, ontkennend: il ne sort pas',a:'il n’est pas sorti',h:['ne ... pas komt om het hulpwerkwoord heen.'],s:'il n’est pas sorti: ne ... pas om est, het participe erachter.'},
]

const LANDNAMEN: Ruw[] = [
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Je vais ___ France.',a:'en',h:['la France is vrouwelijk.'],s:'en + vrouwelijk land: en France. Dat geldt voor "in" en voor "naar".'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Il habite ___ Paris.',a:'à',h:['Paris is een stad.'],s:'à + stad: à Paris.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Nous allons ___ Canada.',a:'au',h:['le Canada is mannelijk.'],s:'au (= à + le) + mannelijk land: au Canada.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Elle habite ___ Pays-Bas.',a:'aux',h:['les Pays-Bas is meervoud.'],s:'aux (= à + les) + meervoud: aux Pays-Bas.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Ils partent ___ Espagne.',a:'en',h:['l’Espagne is vrouwelijk (eindigt op -e).'],s:'en Espagne.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:1,q:'Vul in: Tu vas ___ Portugal ?',a:'au',h:['le Portugal: mannelijk.'],s:'au Portugal.'},

  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: Je travaille ___ Allemagne.',a:'en',h:['l’Allemagne eindigt op -e.'],s:'en Allemagne.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: Mon oncle habite ___ États-Unis.',a:'aux',h:['les États-Unis.'],s:'aux États-Unis: meervoud.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: On va ___ Maroc cet été.',a:'au',h:['le Maroc.'],s:'au Maroc: mannelijk.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: Elle est née ___ Bruxelles.',a:'à',h:['Een stad.'],s:'à Bruxelles.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: Ils vont ___ Belgique.',a:'en',h:['la Belgique.'],s:'en Belgique.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:2,q:'Vul in: Nous partons ___ Japon.',a:'au',h:['le Japon.'],s:'au Japon.'},

  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Vul in (let op!): Je vais ___ Mexique.',a:'au',h:['Eindigt op -e, maar het is "le Mexique".'],s:'au Mexique: een uitzondering, le Mexique is mannelijk. Net zo le Cambodge en le Mozambique.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Vul in: Il habite ___ Iran.',a:'en',h:['l’Iran is mannelijk, maar begint met een klinker.'],s:'en Iran: voor een mannelijk land dat met een klinker begint gebruik je en, niet au.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Waarom zeg je "en Iran" en niet "au Iran"?',a:'voor een mannelijk land dat met een klinker begint gebruik je en',opties:['voor een mannelijk land dat met een klinker begint gebruik je en','omdat Iran vrouwelijk is','omdat Iran een stad is'],h:['Hoe klinkt "au Iran"?'],s:'Voor een klinker wordt het en, ook bij een mannelijk land: en Iran, en Irak, en Israël.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Vertaal: Ik ga naar Italië.',a:'Je vais en Italie.',alt:['Je vais en Italie'],h:['l’Italie: vrouwelijk.'],s:'Je vais en Italie.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Vertaal: Wij wonen in Nederland.',a:'Nous habitons aux Pays-Bas.',alt:['Nous habitons aux Pays-Bas','On habite aux Pays-Bas.','On habite aux Pays-Bas'],h:['Nederland heet in het Frans les Pays-Bas.'],s:'Nous habitons aux Pays-Bas: meervoud, dus aux.'},
  {p:'amaani',v:'frans',t:'Landnamen',lvl:3,q:'Vul in: Elle habite ___ Londres.',a:'à',h:['Londres is geen land.'],s:'à Londres: een stad krijgt altijd à.'},
]

/* ==================================================================== engels */

const PRONOUNS: Ruw[] = [
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Object pronoun: Can you help ___? (ik)',a:'me',h:['Na een werkwoord: me, you, him, her, it, us, them.'],s:'Can you help me?'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Object pronoun: I saw ___ yesterday. (hij)',a:'him',h:['he wordt als lijdend voorwerp ...'],s:'I saw him yesterday.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Object pronoun: Please call ___ tonight. (wij)',a:'us',h:['we wordt ...'],s:'Please call us tonight.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Possessive determiner: This is ___ bike. (van mij)',a:'my',h:['Er staat een zelfstandig naamwoord achter.'],s:'my bike.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Possessive determiner: They love ___ dog. (van hen)',a:'their',h:['their, niet there.'],s:'their dog.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:1,q:'Possessive pronoun: This bike is ___. (van mij)',a:'mine',h:['Er staat niets achter: dan mine, yours, his, hers, ours, theirs.'],s:'This bike is mine.'},

  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'Is this your pen or ___? (van haar)',a:'hers',h:['Zonder zelfstandig naamwoord erachter.'],s:'hers, zonder apostrof.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'The house on the corner is ___. (van ons)',a:'ours',h:['our + s.'],s:'ours: our + s, zonder apostrof.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'The cat is licking ___ paws. (van de kat)',a:'its',h:['Een dier of ding: its, zonder apostrof.'],s:'its paws. it’s betekent it is.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'I gave ___ the keys. (zij, meervoud)',a:'them',h:['they als lijdend of meewerkend voorwerp.'],s:'I gave them the keys.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'Kies: That car is ___.',a:'theirs',opties:['theirs','their','their’s'],h:['Er staat niets achter, en een bezittelijk voornaamwoord krijgt nooit een apostrof.'],s:'theirs.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:2,q:'This is between you and ___. (ik)',a:'me',h:['Na een voorzetsel (between) komt de object pronoun.'],s:'between you and me.'},

  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'Kies: The company lost ___ biggest client.',a:'its',opties:['its','it’s'],h:['Kun je "it is" invullen?'],s:'its: bezittelijk. it’s = it is, en "it is biggest client" is onzin.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'Kies: ___ going to be late.',a:'You’re',opties:['You’re','Your'],h:['Kun je "you are" invullen?'],s:'You’re = you are.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'Kies: ___ parents are coming tonight.',a:'Their',opties:['Their','There','They’re'],h:['Van wie zijn de ouders?'],s:'Their: van hen. There = daar, they’re = they are.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'He is a friend of ___. (ik)',a:'mine',h:['a friend of + possessive pronoun.'],s:'a friend of mine.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'Verbeter het foute woord: "This jacket is her’s."',a:'hers',h:['Bezittelijke voornaamwoorden krijgen geen apostrof.'],s:'hers. Net zo: yours, ours, theirs, its.'},
  {p:'amaani',v:'engels',t:'Pronouns',lvl:3,q:'Kies: My sister and ___ went to the cinema.',a:'I',opties:['I','me'],h:['Laat "my sister and" weg: ... went to the cinema.'],s:'I: het is het onderwerp. Laat je "my sister and" weg, dan hoor je het: I went, niet me went.'},
]

const WH: Ruw[] = [
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ is your name?',a:'What',h:['Wat?'],s:'What is your name?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ do you live? (naar de plaats)',a:'Where',h:['Waar?'],s:'Where do you live?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ is your birthday? (naar de datum)',a:'When',h:['Wanneer?'],s:'When is your birthday?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ is that man? (naar een persoon)',a:'Who',h:['Wie?'],s:'Who is that man?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ are you crying? (naar de reden)',a:'Why',h:['Waarom?'],s:'Why are you crying?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:1,q:'___ are you today? (hoe gaat het)',a:'How',h:['Hoe?'],s:'How are you?'},

  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'___ old are you?',a:'How',h:['Hoe oud?'],s:'How old are you?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'___ bag is this? (van wie)',a:'Whose',h:['Van wie: niet who’s (= who is).'],s:'Whose bag is this?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'How ___ does this jacket cost?',a:'much',h:['Geld is ontelbaar.'],s:'How much does it cost?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'___ book do you want, the red one or the blue one?',a:'Which',h:['Een keuze uit een beperkt aantal.'],s:'Which: een keuze uit een paar mogelijkheden.'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'How ___ do you play tennis? (hoe vaak)',a:'often',h:['Hoe vaak.'],s:'How often do you play tennis?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:2,q:'How ___ brothers do you have?',a:'many',h:['Broers zijn telbaar.'],s:'How many: telbaar. How much: ontelbaar.'},

  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'Where ___ she live?',a:'does',h:['Present simple, she: welk hulpwerkwoord?'],s:'Where does she live? Het hoofdwerkwoord blijft dan zonder -s.'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'What time ___ the train leave?',a:'does',h:['the train = it.'],s:'What time does the train leave?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'Zet in de goede volgorde: you / do / what / want',a:'What do you want?',alt:['What do you want'],h:['Vraagwoord, hulpwerkwoord, onderwerp, werkwoord.'],s:'What do you want? Vraagwoord, do, onderwerp, hoofdwerkwoord.'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'Wat is er fout aan "Where you live?"',a:'het hulpwerkwoord do ontbreekt',opties:['het hulpwerkwoord do ontbreekt','where moet achteraan','live moet lives zijn'],h:['Vergelijk met "Where do you live?"'],s:'In een vraag in de present simple heb je do of does nodig: Where do you live?'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'Kies: Who ___ the window? (wie heeft het gebroken; who is het onderwerp)',a:'broke',opties:['broke','did break','did broke'],h:['Vraag je naar het onderwerp, dan geen did.'],s:'Who broke the window? Vraag je naar het onderwerp, dan blijft de zin in gewone volgorde, zonder do of did.'},
  {p:'amaani',v:'engels',t:'Wh-questions',lvl:3,q:'Kies: Who ___ you call last night? (wie heb jij gebeld)',a:'did',opties:['did','do'],h:['Hier is you het onderwerp.'],s:'Who did you call? Nu vraag je naar het lijdend voorwerp: dan wel did.'},
]

const COMPARISONS: Ruw[] = [
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Comparative van "big":',a:'bigger',h:['Korte klinker, één medeklinker: verdubbelen.'],s:'big, bigger, biggest.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Superlative van "small":',a:'smallest',alt:['the smallest'],h:['-est.'],s:'small, smaller, smallest.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Comparative van "good":',a:'better',h:['Onregelmatig.'],s:'good, better, best.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Superlative van "bad":',a:'worst',alt:['the worst'],h:['Onregelmatig: bad, worse, ...'],s:'bad, worse, worst.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Comparative van "happy":',a:'happier',h:['De y wordt i.'],s:'happy, happier, happiest.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:1,q:'Comparative van "expensive":',a:'more expensive',h:['Lang woord: more.'],s:'Lange woorden krijgen more en most: more expensive.'},

  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'My brother is ___ (tall) than me.',a:'taller',h:['than: vergrotende trap.'],s:'taller than.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'This is the ___ (interesting) book I have ever read.',a:'most interesting',h:['the + lang woord: most.'],s:'the most interesting.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'Today is ___ (hot) than yesterday.',a:'hotter',h:['Medeklinker verdubbelen.'],s:'hotter.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'She is as ___ (old) as her cousin.',a:'old',h:['as ... as: de gewone vorm.'],s:'as old as: even oud als. Bij as ... as verandert het bijvoeglijk naamwoord niet.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'Superlative van "far":',a:'farthest',alt:['furthest','the farthest','the furthest'],h:['Onregelmatig, en er zijn twee vormen.'],s:'far, farther/further, farthest/furthest.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:2,q:'Mount Everest is the ___ (high) mountain in the world.',a:'highest',h:['the + -est.'],s:'the highest.'},

  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'Kies: He is taller ___ his father.',a:'than',opties:['than','then'],h:['then = toen of daarna.'],s:'than bij een vergelijking; then betekent toen of daarna.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'Kies: The ___ you practise, the ___ you get.',a:'more ... better',opties:['more ... better','most ... best','much ... good'],h:['Hoe meer ..., hoe beter ...'],s:'The more you practise, the better you get: the + vergrotende trap, twee keer.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'Comparative van "simple" (er zijn twee goede vormen; geef er één):',a:'simpler',alt:['more simple'],h:['Twee lettergrepen: soms -er, soms more.'],s:'simpler en more simple zijn allebei goed.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'Wat is er fout aan "She is more taller than me"?',a:'more en -er staan er allebei; het is taller',opties:['more en -er staan er allebei; het is taller','than moet then zijn','het moet tallest zijn'],h:['Hoeveel keer vergelijk je?'],s:'Of more, of -er, nooit allebei: she is taller than me.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'This exam was ___ (easy) than the last one.',a:'easier',h:['De y wordt i.'],s:'easier.'},
  {p:'amaani',v:'engels',t:'Comparisons',lvl:3,q:'It was the ___ (bad) day of my life.',a:'worst',h:['bad, worse, ...'],s:'the worst day.'},
]

const PRESENT: Ruw[] = [
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'He ___ (play) football every Saturday.',a:'plays',h:['he/she/it: -s.'],s:'He plays.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'She ___ (go) to school by bike.',a:'goes',h:['Na een o: -es.'],s:'She goes.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'My mother ___ (watch) the news every evening.',a:'watches',h:['Na ch, sh, s, x, o: -es.'],s:'She watches.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'They ___ (live) in Rotterdam.',a:'live',h:['They: geen -s.'],s:'They live.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'The baby ___ (cry) a lot.',a:'cries',h:['Medeklinker + y: -ies.'],s:'The baby cries.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:1,q:'He ___ (have) two sisters.',a:'has',h:['Onregelmatig.'],s:'He has.'},

  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'She ___ (not / like) coffee.',a:'doesn’t like',alt:['does not like'],h:['she: does not; het hoofdwerkwoord zonder -s.'],s:'She doesn’t like coffee.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'___ you speak French?',a:'Do',h:['you: do.'],s:'Do you speak French?'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'___ he work on Saturdays?',a:'Does',h:['he: does.'],s:'Does he work on Saturdays?'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'They ___ (not / eat) meat.',a:'don’t eat',alt:['do not eat'],h:['they: do not.'],s:'They don’t eat meat.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'Does she ___ (play) the piano?',a:'play',h:['Na does: geen -s meer.'],s:'Does she play? De -s zit al in does.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:2,q:'Water ___ (boil) at 100 °C.',a:'boils',h:['Een feit dat altijd waar is.'],s:'Water boils at 100 °C.'},

  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'Kies: Listen! I ___ my homework right now.',a:'am doing',opties:['am doing','do'],h:['right now: het gebeurt nu.'],s:'Nu bezig: present continuous, am doing.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'Kies: I usually ___ my homework after dinner.',a:'do',opties:['do','am doing'],h:['usually: een gewoonte.'],s:'Een gewoonte: present simple, do.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'Welk signaalwoord hoort bij de present simple?',a:'usually',opties:['usually','right now','at the moment'],h:['Gewoonte of nu?'],s:'usually, always, often, every day: present simple. right now, at the moment: present continuous.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'My sister ___ (fly) to London every month.',a:'flies',h:['Medeklinker + y.'],s:'She flies.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'Wat is er fout aan "He don’t know the answer"?',a:'bij he hoort doesn’t',opties:['bij he hoort doesn’t','know moet knows zijn','don’t moet aren’t zijn'],h:['he, she, it: does.'],s:'He doesn’t know the answer.'},
  {p:'amaani',v:'engels',t:'Present simple',lvl:3,q:'Maak ontkennend: She watches TV.',a:'She doesn’t watch TV.',alt:['She doesn’t watch TV','She does not watch TV.','She does not watch TV'],h:['does not, en dan watch zonder -es.'],s:'She doesn’t watch TV: de -es verhuist naar does.'},
]

export const FRANS_UNITE1: Ruw[] = [...SORTIR_PARTIR, ...LANDNAMEN].map(metVarianten)
export const ENGELS_UNIT1: Ruw[] = [...PRONOUNS, ...WH, ...COMPARISONS, ...PRESENT].map(metVarianten)
