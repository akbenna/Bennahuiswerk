import type { Grammatica } from './soorten'


/* ============================================================
   GRAMMATICA — korte modules, verdeeld over de vier sporen
   ------------------------------------------------------------
   De uitleg staat bewust in doorlopend proza. Opsommingen laten
   zich makkelijk overslaan en geven de illusie dat je het snapt;
   een lopende zin dwingt je de redenering te volgen.
   ------------------------------------------------------------
   id     stabiele sleutel (nooit hergebruiken)
   sp     spoor 1-4: vanaf welk spoor deze module hoort
   titel  kop
   kern   één zin die de module samenvat
   tekst  HTML-alinea's
   vb     voorbeelden [arabisch, transcriptie, nederlands]
   oef    oefeningen, zie OEFENVORMEN in de app
   ============================================================ */
export const GRAMMATICA: Grammatica[] = [
{id:'g-richting',sp:1,titel:'Van rechts naar links',
 kern:'Arabisch schrijf je van rechts naar links, en de letters plakken aan elkaar.',
 tekst:`<p>Het eerste wat je moet afleren is de richting. Een Arabische regel begint rechts en loopt naar links, en dat geldt ook binnen een woord: de eerste letter die je schrijft staat het meest rechts. Cijfers gaan trouwens wél van links naar rechts, precies zoals bij ons — in een zin met een jaartal loopt de tekst dus twee kanten op tegelijk. Daar wen je sneller aan dan je denkt.</p>
 <p>Het tweede is dat Arabisch een verbonden schrift is. Er bestaat geen "blokletter" en geen "schrijfletter": er is maar één schrift, en daarin raken de letters elkaar. Daarom heeft bijna elke letter vier gedaanten. Staat hij alleen, dan zie je zijn volle vorm. Staat hij aan het begin van een groepje, dan verliest hij zijn staart en krijgt hij een haakje naar links. Staat hij ertussenin, dan is hij aan beide kanten vastgeplakt en blijft er vaak weinig meer over dan een bochtje met puntjes. Staat hij aan het eind, dan mag zijn staart weer terug.</p>
 <p>Zes letters doen niet mee aan de verbinding naar links: ا، د، ذ، ر، ز en و. Ze pakken de letter vóór zich wel vast, maar geven de letter erna geen hand. Daardoor valt een woord soms uiteen in losse stukjes die tóch één woord zijn. In زَيْتُون zie je dat gebeuren: na de ز moet je opnieuw beginnen.</p>`,
 vb:[['بَاب','bāb','deur — drie letters, allemaal verbonden'],['وَرْدَة','warda','roos — na de و en de ر breekt de verbinding'],['دَرْس','dars','les — de د geeft geen hand naar links']],
 oef:[
  {k:'kies',v:'Welke van deze letters verbindt níet naar links?',o:['ب','د','م','س'],j:1,u:'د is een van de zes: ا د ذ ر ز و. Ze pakken wel de letter ervóór vast, maar de volgende letter moet opnieuw beginnen.'},
  {k:'kies',v:'Waar staat de eerste letter van een Arabisch woord?',o:['Links','Rechts','Midden','Boven'],j:1,u:'Rechts. De hele regel loopt van rechts naar links, dus je begint aan de rechterkant.'}]},

{id:'g-klinkers',sp:1,titel:'De drie korte klinkers',
 kern:'Fatha is a, kasra is i, damma is oe — kleine tekens boven en onder de letter.',
 tekst:`<p>Arabisch heeft maar drie korte klinkers, en ze worden niet met letters geschreven maar met tekentjes die je boven of onder de medeklinker zet. Een streepje erboven is de <b>fatha</b> en klinkt als een korte a. Een streepje eronder is de <b>kasra</b> en klinkt als een korte i. Een klein krulletje erboven, dat eruitziet als een miniatuur-و, is de <b>damma</b> en klinkt als een korte oe.</p>
 <p>Dezelfde letter met een ander tekentje is een ander woord. بَ is "ba", بِ is "bi", بُ is "boe". Dat lijkt een detail, maar het is de kern van hoe Arabisch werkt: de medeklinkers dragen de betekenis, de klinkers vertellen wat er grammaticaal met die betekenis gebeurt.</p>
 <p>In gewone Arabische teksten voor volwassenen staan die tekentjes er niet. Ze staan wel in de Koran, in kinderboeken en in leerboeken — precies daar waar het ertoe doet dat je het goed uitspreekt. In deze app staan ze er in het begin altijd, en later alleen nog waar het woord anders dubbelzinnig zou zijn.</p>`,
 vb:[['بَ / بِ / بُ','ba / bi / bu','dezelfde letter, drie klanken'],['كَتَبَ','kataba','hij schreef'],['كُتِبَ','kutiba','er werd geschreven — dezelfde letters, andere klinkers']],
 oef:[
  {k:'kies',v:'Welke klank hoort bij de kasra?',o:['a','i','oe','geen'],j:1,u:'De kasra is het streepje ónder de letter en klinkt als een korte i, zoals in "pit".'},
  {k:'kies',v:'Hoe spreek je بُ uit?',o:['ba','bi','boe','b'],j:2,u:'Het krulletje boven de letter is een damma: korte oe.'}]},

{id:'g-sukun',sp:1,titel:'Sukun — de letter zonder klinker',
 kern:'Een rondje boven de letter betekent: hier komt geen klinker, plak vast aan de vorige.',
 tekst:`<p>Soms volgt er op een medeklinker helemaal geen klinker. Dat wordt aangegeven met een klein rondje boven de letter, de <b>sukun</b>. Het is geen klank maar een aanwijzing dat je moet doorlopen naar de volgende medeklinker.</p>
 <p>Zo ontstaat het verschil tussen بَبَ ("baba", twee lettergrepen) en بَبْ ("bab", één lettergreep die op een medeklinker eindigt). In een woord als مَدْرَسَة hoor je het meteen: de د heeft een sukun, dus je zegt "mad-" en niet "mada-".</p>
 <p>Een Arabisch woord begint nooit met een sukun. Elke lettergreep begint met een medeklinker met klinker; pas daarna kan er een medeklinker zonder klinker volgen. Dat is de reden dat Arabische woorden zo makkelijk in lettergrepen uiteenvallen zodra je de tekentjes eenmaal ziet.</p>`,
 vb:[['قَلْب','qalb','hart — de ل draagt een sukun'],['شَمْس','shams','zon'],['بِنْت','bint','meisje']],
 oef:[
  {k:'kies',v:'Wat betekent het rondje in بْ ?',o:['Verdubbeling','Lange klinker','Geen klinker','Vraagteken'],j:2,u:'Het rondje is de sukun: er volgt geen klinker, de letter plakt aan de vorige vast.'},
  {k:'typ',v:'Schrijf de transcriptie van قَلْب',jt:['qalb'],u:'qalb. De ل heeft een sukun, dus geen klinker tussen de l en de b.'}]},

{id:'g-shadda',sp:1,titel:'Shadda — de dubbele letter',
 kern:'Een klein "w"-tje boven de letter verdubbelt hem, en dat verandert de betekenis.',
 tekst:`<p>De <b>shadda</b> ziet eruit als een klein w-vormig kroontje boven de letter en betekent dat je die medeklinker dubbel uitspreekt. Niet twee keer achter elkaar, maar één keer langer aangehouden, zoals de n in het Nederlandse "aannemen" wanneer je hem echt uitspreekt.</p>
 <p>Dat is geen sierlijkheid. De verdubbeling is in het Arabisch een betekenisdrager. دَرَسَ betekent "hij studeerde", maar دَرَّسَ met een shadda op de ر betekent "hij onderwees". De verdubbelde middelste medeklinker maakt van een handeling die je zelf doet een handeling die je een ander laat doen. Wie de shadda overslaat, leest een ander woord.</p>`,
 vb:[['دَرَسَ / دَرَّسَ','darasa / darrasa','hij studeerde / hij onderwees'],['سُكَّر','sukkar','suiker'],['جَدّ','jadd','opa']],
 oef:[
  {k:'kies',v:'Wat betekent دَرَّسَ ?',o:['hij studeerde','hij onderwees','hij las','hij schreef'],j:1,u:'De shadda op de ر verdubbelt hem en maakt van "studeren" het veroorzakende "onderwijzen".'},
  {k:'typ',v:'Schrijf de transcriptie van سُكَّر',jt:['sukkar'],u:'sukkar — de shadda op de ك betekent dat je hem dubbel aanhoudt.'}]},

{id:'g-lang',sp:1,titel:'De lange klinkers',
 kern:'ا، و en ي rekken de klinker ervoor op tot aa, oe en ie.',
 tekst:`<p>Naast de drie korte klinkers zijn er drie lange, en die worden wél met een letter geschreven. Een fatha gevolgd door een <b>ا</b> wordt een lange aa. Een damma gevolgd door een <b>و</b> wordt een lange oe. Een kasra gevolgd door een <b>ي</b> wordt een lange ie.</p>
 <p>De و en de ي doen dus dubbel dienst: ze zijn medeklinker (w en j) én klinkerteken, en welke van de twee het is lees je af aan de klinker ervoor. In وَلَد is de و een medeklinker: "walad". In نُور hoort hij bij de damma en wordt hij een klinker: "noer".</p>
 <p>Het verschil tussen kort en lang is in het Arabisch net zo belangrijk als het verschil tussen twee medeklinkers. كَتَبَ is "hij schreef", كَاتِب is "schrijver". Eén lange aa scheelt.</p>`,
 vb:[['بَاب','bāb','deur — lange aa'],['نُور','nūr','licht — lange oe'],['كَبِير','kabīr','groot — lange ie']],
 oef:[
  {k:'kies',v:'Welke letter maakt van een damma een lange oe?',o:['ا','و','ي','ه'],j:1,u:'De و. Een damma gevolgd door و wordt "oe", zoals in نُور.'},
  {k:'kies',v:'Wat is het verschil tussen كَتَبَ en كَاتِب ?',o:['Alleen de spelling','De eerste is een werkwoord, de tweede een persoon','Niets','De tweede is meervoud'],j:1,u:'كَتَبَ is "hij schreef"; كَاتِب met lange aa is "schrijver". De lange klinker maakt van de handeling de handelende persoon.'}]},

{id:'g-tamarbuta',sp:1,titel:'Ta marbuta — het teken van het vrouwelijke',
 kern:'De ة aan het eind van een woord maakt het bijna altijd vrouwelijk.',
 tekst:`<p>Aan het eind van heel veel Arabische woorden staat een teken dat eruitziet als een ه met de twee puntjes van een ت erboven: <b>ة</b>. Het heet <i>tāʾ marbūṭa</i>, de "gebonden t", en het is het duidelijkste signaal dat een woord vrouwelijk is.</p>
 <p>Je spreekt hem meestal niet als t uit. Stop je aan het eind van het woord, dan hoor je alleen een korte a: مَدْرَسَة klinkt als "madrasa". Maar zodra het woord grammaticaal doorloopt, komt de t tevoorschijn: مَدْرَسَةُ الْقَرْيَة klinkt als "madrasatu l-qarya", de school van het dorp. Vandaar de naam: de t zit erin, maar hij is vastgebonden.</p>
 <p>Er zijn woorden die vrouwelijk zijn zonder ة — أُمّ (moeder), شَمْس (zon), أَرْض (aarde), en de meeste lichaamsdelen die in paren voorkomen, zoals يَد en عَيْن. En er zijn een paar mannelijke woorden mét ة, zoals خَلِيفَة. De regel is dus sterk, maar niet zonder uitzondering.</p>`,
 vb:[['مَدْرَسَة','madrasa','school'],['شَجَرَة','shajara','boom'],['شَمْس','shams','zon — vrouwelijk zónder ة']],
 oef:[
  {k:'kies',v:'Welk woord is vrouwelijk?',o:['كِتَاب','قَلَم','مَدْرَسَة','بَيْت'],j:2,u:'مَدْرَسَة eindigt op ة, en dat is het teken van het vrouwelijke.'},
  {k:'kies',v:'شَمْس is vrouwelijk. Hoe zie je dat aan het woord?',o:['Aan de ة','Aan de ش','Dat zie je niet — je moet het weten','Aan de sukun'],j:2,u:'Niet elk vrouwelijk woord heeft een ة. شَمْس, أَرْض en أُمّ zijn vrouwelijk zonder zichtbaar teken; die leer je uit het hoofd.'}]},

{id:'g-lidwoord',sp:2,titel:'Het lidwoord الـ',
 kern:'Eén lidwoord voor alles, vastgeplakt aan het woord, en het bestaat alleen in de bepaalde vorm.',
 tekst:`<p>Het Arabisch kent maar één lidwoord: <b>الـ</b>, uitgesproken als "al", en het staat vast aan het woord. كِتَاب is "een boek", الْكِتَاب is "het boek". Er is geen apart woord voor "een": onbepaaldheid is de standaard, en soms zie je haar aan een n-klank aan het eind, de zogeheten nunatie: كِتَابٌ, "kitābun".</p>
 <p>Een woord is óf bepaald óf onbepaald, en dat verschil regelt in het Arabisch veel meer dan bij ons. Of een bijvoeglijk naamwoord bij een zelfstandig naamwoord hoort of er iets over beweert, hangt er volledig van af. الْبَيْتُ الْكَبِيرُ betekent "het grote huis"; الْبَيْتُ كَبِيرٌ betekent "het huis is groot". Er staat geen werkwoord in, alleen een verschil in bepaaldheid — en dat is het hele verschil tussen een omschrijving en een bewering.</p>`,
 vb:[['كِتَاب','kitāb','een boek'],['الْكِتَاب','al-kitāb','het boek'],['الْبَيْتُ كَبِيرٌ','al-baytu kabīrun','het huis is groot']],
 oef:[
  {k:'kies',v:'Wat betekent الْقَلَم ?',o:['een pen','de pen','pennen','geen pen'],j:1,u:'الـ maakt het woord bepaald: "de pen".'},
  {k:'kies',v:'Wat betekent الْبَيْتُ كَبِيرٌ ?',o:['het grote huis','het huis is groot','een groot huis','de grootte van het huis'],j:1,u:'Het onderwerp is bepaald, het gezegde onbepaald. Dat verschil ís de bewering; een werkwoord "zijn" heb je niet nodig.'}]},

{id:'g-zonmaan',sp:2,titel:'Zons- en maansletters',
 kern:'Bij veertien letters versmelt de l van al- met de eerste letter van het woord.',
 tekst:`<p>Het lidwoord الـ schrijf je altijd hetzelfde, maar je spreekt het niet altijd hetzelfde uit. Begint het woord met een van veertien bepaalde letters, dan verdwijnt de l en verdubbel je in plaats daarvan de eerste letter van het woord. الشَّمْس schrijf je met een lām, maar je zegt "ash-shams", niet "al-shams". Je ziet het aan de shadda op de eerste letter.</p>
 <p>Die veertien heten <b>zonsletters</b>, naar het woord شَمْس, zon, dat er zelf mee begint. De andere veertien heten <b>maansletters</b>, naar قَمَر, maan, waar de l gewoon hoorbaar blijft: "al-qamar". De namen zijn niet meer dan een ezelsbruggetje, maar wel een goed ezelsbruggetje.</p>
 <p>Er zit een logica achter. De zonsletters worden allemaal vooraan in de mond gevormd, met de tongpunt tegen of vlak achter de tanden — precies waar ook de l wordt gemaakt. Twee klanken op dezelfde plek laten zich makkelijker samentrekken dan uit elkaar houden. De maansletters worden verder naar achteren of met de lippen gevormd, en daar valt niets samen te trekken.</p>`,
 vb:[['الشَّمْس','ash-shams','de zon — zonsletter, de l versmelt'],['الْقَمَر','al-qamar','de maan — maansletter, de l blijft'],['الرَّجُل','ar-rajul','de man — ر is een zonsletter']],
 oef:[
  {k:'kies',v:'Hoe spreek je الطَّالِب uit?',o:['al-ṭālib','aṭ-ṭālib','a-ṭālib','al-ālib'],j:1,u:'ط is een zonsletter: de l versmelt en de ط wordt verdubbeld — "aṭ-ṭālib".'},
  {k:'kies',v:'Welke van deze woorden houdt de l hoorbaar?',o:['الشَّمْس','الرَّجُل','الْبَيْت','النَّار'],j:2,u:'ب is een maansletter, dus "al-bayt". De andere drie beginnen met een zonsletter.'},
  {k:'kies',v:'Waarom versmelt de l juist bij die veertien letters?',o:['Toeval','Ze worden op dezelfde plek in de mond gevormd als de l','Het zijn de oudste letters','Ze hebben allemaal punten'],j:1,u:'De zonsletters worden met de tongpunt bij de tanden gevormd, net als de l. Klanken op dezelfde plaats trekken makkelijk samen.'}]},

{id:'g-geslacht',sp:2,titel:'Mannelijk en vrouwelijk',
 kern:'Elk woord heeft een geslacht, en alles wat erbij hoort past zich aan.',
 tekst:`<p>Zoals het Nederlands "de" en "het" heeft, verdeelt het Arabisch alle zelfstandige naamwoorden in mannelijk en vrouwelijk. Het verschil is alleen zichtbaarder en het heeft meer gevolgen. Een vrouwelijk woord herken je meestal aan de ة aan het eind, en alles wat bij dat woord hoort — het bijvoeglijk naamwoord, het aanwijzend voornaamwoord, het werkwoord — moet meebewegen.</p>
 <p>Zeg je "de grote leraar", dan wordt dat الْمُعَلِّمُ الْكَبِيرُ. Zeg je "de grote lerares", dan wordt het الْمُعَلِّمَةُ الْكَبِيرَةُ: het bijvoeglijk naamwoord krijgt zelf ook een ة. Hetzelfde geldt voor "deze": هٰذَا bij mannelijk, هٰذِهِ bij vrouwelijk.</p>
 <p>Een vrouwelijk woord maak je van een mannelijk door er een ة achter te zetten, en dat werkt verrassend consequent: مُعَلِّم wordt مُعَلِّمَة, طَالِب wordt طَالِبَة, صَدِيق wordt صَدِيقَة. Wie het patroon eenmaal ziet, verdubbelt zijn woordenschat zonder nieuwe woorden te leren.</p>`,
 vb:[['الْمُعَلِّمُ الْكَبِيرُ','al-muʿallimu l-kabīru','de grote leraar'],['الْمُعَلِّمَةُ الْكَبِيرَةُ','al-muʿallimatu l-kabīratu','de grote lerares'],['هٰذِهِ بِنْتٌ','hādhihi bintun','dit is een meisje']],
 oef:[
  {k:'kies',v:'Wat hoort bij مَدْرَسَة ?',o:['هٰذَا','هٰذِهِ','ذٰلِكَ','هُوَ'],j:1,u:'مَدْرَسَة is vrouwelijk (ة aan het eind), dus هٰذِهِ.'},
  {k:'typ',v:'Maak van طَالِب de vrouwelijke vorm (schrijf in het Arabisch)',jt:['طالبة','طَالِبَة'],u:'طَالِبَة — je zet er simpelweg een ة achter.'}]},

{id:'g-getal',sp:2,titel:'Enkelvoud, tweevoud, meervoud',
 kern:'Arabisch heeft een aparte vorm voor precies twee.',
 tekst:`<p>Waar het Nederlands alleen enkelvoud en meervoud kent, heeft het Arabisch er een derde vorm bij: de <b>dualis</b>, het tweevoud, voor precies twee van iets. Je maakt hem door <b>ـانِ</b> achter het woord te zetten: كِتَاب wordt كِتَابَانِ, twee boeken. Bij vrouwelijke woorden verandert de ة eerst in een gewone ت: مَدْرَسَة wordt مَدْرَسَتَانِ.</p>
 <p>Het tweevoud is geen archaïsme. Je gebruikt het dagelijks, en vooral bij dingen die van nature in paren komen: عَيْنَانِ, twee ogen, يَدَانِ, twee handen, وَالِدَانِ, de twee ouders. In dat laatste woord zie je hoe elegant het is: één woord voor "vader en moeder samen".</p>
 <p>Voor het echte meervoud, vanaf drie, bestaat een regelmatige vorm — ـُونَ voor mannelijke personen, ـَات voor vrouwelijke — maar de meeste woorden gebruiken die niet. Die hebben een gebroken meervoud, en dat is de volgende module.</p>`,
 vb:[['كِتَابَانِ','kitābāni','twee boeken'],['مَدْرَسَتَانِ','madrasatāni','twee scholen'],['مُعَلِّمُونَ','muʿallimūna','leraren'],['مُعَلِّمَات','muʿallimāt','leraressen']],
 oef:[
  {k:'kies',v:'Hoeveel boeken zijn كِتَابَانِ ?',o:['één','twee','drie','veel'],j:1,u:'De uitgang ـانِ is de dualis: precies twee.'},
  {k:'kies',v:'Wat is het meervoud van مُعَلِّمَة ?',o:['مُعَلِّمُونَ','مُعَلِّمَات','مُعَلِّمَانِ','مَعَالِم'],j:1,u:'Vrouwelijke personen krijgen het regelmatige meervoud op ـَات.'}]},

{id:'g-gebroken',sp:2,titel:'Het gebroken meervoud',
 kern:'De meeste woorden maken hun meervoud niet met een uitgang maar door van binnen te veranderen.',
 tekst:`<p>Bij de meeste Arabische woorden plak je voor het meervoud niets achteraan. In plaats daarvan verandert het woord van binnenuit: de medeklinkers blijven staan, de klinkers eromheen worden vervangen. كِتَاب wordt كُتُب, بَيْت wordt بُيُوت, وَلَد wordt أَوْلَاد, رَجُل wordt رِجَال. Dat heet een <b>gebroken meervoud</b>, omdat het woord als het ware wordt opengebroken en opnieuw gevuld.</p>
 <p>Er zijn tientallen van die patronen en ze zijn maar half voorspelbaar. Een ervaren lezer voelt aan dat فُعُول of أَفْعَال het meervoud zal zijn, maar zeker weten doe je het niet. In de praktijk leer je bij elk nieuw woord het meervoud er meteen bij, zoals je in het Duits het lidwoord meeleert. Dat kost in het begin extra moeite en bespaart later heel veel.</p>
 <p>Nog iets eigenaardigs: het meervoud van niet-menselijke dingen wordt grammaticaal behandeld als vrouwelijk enkelvoud. "De boeken zijn nieuw" wordt الْكُتُبُ جَدِيدَةٌ, met een enkelvoudig vrouwelijk bijvoeglijk naamwoord. Dat voelt fout en het is toch echt goed.</p>`,
 vb:[['كِتَاب ← كُتُب','kitāb ← kutub','boek ← boeken'],['بَيْت ← بُيُوت','bayt ← buyūt','huis ← huizen'],['الْكُتُبُ جَدِيدَةٌ','al-kutubu jadīdatun','de boeken zijn nieuw']],
 oef:[
  {k:'kies',v:'Wat is het meervoud van بَيْت ?',o:['بَيْتَات','بُيُوت','بَيْتُونَ','أَبْيَات'],j:1,u:'بُيُوت. De medeklinkers ب-ي-ت blijven, de klinkers veranderen.'},
  {k:'kies',v:'Hoe zeg je "de boeken zijn nieuw"?',o:['الْكُتُبُ جُدُدٌ','الْكُتُبُ جَدِيدَةٌ','الْكُتُبُ جَدِيدٌ','كُتُبٌ جَدِيدَةٌ'],j:1,u:'Meervouden van zaken gedragen zich als vrouwelijk enkelvoud, dus جَدِيدَةٌ.'}]},

{id:'g-nisba',sp:2,titel:'De nisba',
 kern:'Zet ـِيّ achter een woord en je hebt "van, behorend bij".',
 tekst:`<p>Een van de handigste dingen in het Arabisch is de <b>nisba</b>: een uitgang ـِيّ (bij vrouwelijk ـِيَّة) waarmee je van vrijwel elk zelfstandig naamwoord een bijvoeglijk naamwoord maakt dat "van" of "horend bij" betekent. مَغْرِب is Marokko, مَغْرِبِيّ is Marokkaans. عَرَب zijn de Arabieren, عَرَبِيّ is Arabisch.</p>
 <p>Eindigt het grondwoord op een ة of op een lange klinker, dan valt die eerst weg: مَدِينَة wordt مَدَنِيّ, "stedelijk". Bij landen en talen is de nisba zo standaard dat je met één regel een hele reeks woorden erbij krijgt: هُولَنْدِيّ, Nederlands; مِصْرِيّ, Egyptisch; فَرَنْسِيّ, Frans.</p>
 <p>De nisba maakt ook abstracte begrippen. Zet er de vrouwelijke uitgang achter en je krijgt een zelfstandig naamwoord: حُرّ is vrij, حُرِّيَّة is vrijheid; إِسْلَام is islam, إِسْلَامِيَّة is islamiteit. Veel moderne vaktermen zijn precies zo gebouwd.</p>`,
 vb:[['مَغْرِبِيّ','maghribī','Marokkaans'],['عَرَبِيَّة','ʿarabiyya','Arabisch (v)'],['هُولَنْدِيّ','hūlandī','Nederlands']],
 oef:[
  {k:'kies',v:'Wat betekent مِصْرِيّ ?',o:['Egypte','Egyptisch','Egyptenaren','naar Egypte'],j:1,u:'De nisba-uitgang ـِيّ maakt van مِصْر (Egypte) het bijvoeglijk naamwoord "Egyptisch".'},
  {k:'typ',v:'Hoe schrijf je de transcriptie van "Marokkaans"?',jt:['maghribi','maghribī','maghribiyy'],u:'maghribī, van مَغْرِب met de nisba-uitgang.'}]},

{id:'g-adjectief',sp:2,titel:'Het bijvoeglijk naamwoord staat achteraan',
 kern:'Anders dan bij ons komt het bijvoeglijk naamwoord ná het zelfstandig naamwoord, en het past zich in alles aan.',
 tekst:`<p>In het Nederlands zeggen we "het grote huis". In het Arabisch staat het omgekeerd: الْبَيْتُ الْكَبِيرُ, letterlijk "het huis het grote". Het bijvoeglijk naamwoord volgt, en het kopieert vier eigenschappen van het woord waar het bij hoort: geslacht, getal, bepaaldheid en naamval.</p>
 <p>Die bepaaldheid is het lastigste voor beginners, want daar hangt de betekenis van af. Zijn beide woorden bepaald, dan hoort het bijvoeglijk naamwoord erbij en krijg je een omschrijving. Is het eerste bepaald en het tweede niet, dan is het een hele zin geworden. بَيْتٌ كَبِيرٌ, allebei onbepaald, is weer gewoon "een groot huis".</p>`,
 vb:[['بَيْتٌ كَبِيرٌ','baytun kabīrun','een groot huis'],['الْبَيْتُ الْكَبِيرُ','al-baytu l-kabīru','het grote huis'],['الْبَيْتُ كَبِيرٌ','al-baytu kabīrun','het huis is groot']],
 oef:[
  {k:'kies',v:'Wat betekent الْوَلَدُ صَغِيرٌ ?',o:['de kleine jongen','het jongetje','de jongen is klein','een kleine jongen'],j:2,u:'Bepaald plus onbepaald is een bewering: "de jongen is klein".'},
  {k:'kies',v:'Hoe zeg je "de nieuwe school"?',o:['مَدْرَسَةٌ جَدِيدَةٌ','الْمَدْرَسَةُ جَدِيدَةٌ','الْمَدْرَسَةُ الْجَدِيدَةُ','الْجَدِيدَةُ الْمَدْرَسَةُ'],j:2,u:'Allebei bepaald, en het bijvoeglijk naamwoord staat achteraan en is vrouwelijk.'}]},

{id:'g-bezit',sp:2,titel:'Bezit met achtervoegsels',
 kern:'"Mijn", "jouw" en "zijn" zijn geen losse woorden maar uitgangen.',
 tekst:`<p>Het Arabisch heeft geen losse bezittelijke voornaamwoorden. In plaats daarvan plak je een uitgang achter het woord: كِتَاب wordt كِتَابِي, mijn boek; كِتَابُكَ, jouw boek (tegen een man); كِتَابُكِ, jouw boek (tegen een vrouw); كِتَابُهُ, zijn boek; كِتَابُهَا, haar boek.</p>
 <p>Zodra er zo'n uitgang aan hangt, is het woord bepaald. Je kunt dus niet én الـ én een bezitsuitgang gebruiken: "de mijn boek" bestaat niet. Wil je er een bijvoeglijk naamwoord bij, dan krijgt dat wél het lidwoord: كِتَابِي الْجَدِيدُ, mijn nieuwe boek.</p>
 <p>Bij vrouwelijke woorden komt de verborgen t weer tevoorschijn: مَدْرَسَة wordt مَدْرَسَتِي, mijn school. Dat is precies dezelfde t die ook in de idafa opduikt.</p>`,
 vb:[['كِتَابِي','kitābī','mijn boek'],['بَيْتُكَ','baytuka','jouw huis (m)'],['مَدْرَسَتُهَا','madrasatuhā','haar school']],
 oef:[
  {k:'kies',v:'Wat betekent أُمِّي ?',o:['een moeder','de moeder','mijn moeder','moeders'],j:2,u:'De uitgang ـِي betekent "mijn". أُمِّي = mijn moeder.'},
  {k:'kies',v:'Waarom is الْكِتَابِي fout?',o:['De ك is verkeerd','Een woord met bezitsuitgang is al bepaald','Het moet vrouwelijk','Er ontbreekt een klinker'],j:1,u:'Een bezitsuitgang maakt het woord bepaald; het lidwoord er nog eens bij kan niet.'}]},

{id:'g-nominaal',sp:3,titel:'De nominale zin',
 kern:'Een Arabische zin heeft niet altijd een werkwoord nodig.',
 tekst:`<p>De eenvoudigste Arabische zin bestaat uit twee naamwoorden en verder niets. الْبَيْتُ كَبِيرٌ: het huis is groot. Er staat geen "is", en dat hoort ook niet. Het eerste deel heet de <b>mubtadaʾ</b>, het beginpunt, en het tweede de <b>khabar</b>, het bericht — datgene wat over het beginpunt wordt meegedeeld.</p>
 <p>Het beginpunt is in de regel bepaald en het bericht onbepaald. Juist dat verschil maakt duidelijk dat er iets bewéérd wordt in plaats van dat er iets omschreven wordt. Beide staan in de nominatief, herkenbaar aan de damma of de nunatie ـٌ.</p>
 <p>De khabar hoeft geen enkel woord te zijn. Hij kan ook een voorzetselgroep zijn — الْكِتَابُ عَلَى الطَّاوِلَةِ, het boek ligt op de tafel — of een hele zin. En wil je zo'n zin in de verleden tijd zetten, dan zet je er كَانَ voor: كَانَ الْبَيْتُ كَبِيرًا, het huis wás groot. Let op de accusatief die كَانَ aan zijn khabar oplegt.</p>`,
 vb:[['الْبَيْتُ كَبِيرٌ','al-baytu kabīrun','het huis is groot'],['الْكِتَابُ عَلَى الطَّاوِلَةِ','al-kitābu ʿalā ṭ-ṭāwilati','het boek ligt op de tafel'],['كَانَ الْبَيْتُ كَبِيرًا','kāna l-baytu kabīran','het huis was groot']],
 oef:[
  {k:'kies',v:'Welk woord ontbreekt er in الطَّالِبُ مُجْتَهِدٌ vergeleken met het Nederlands?',o:['de','een','is','niet'],j:2,u:'Het koppelwerkwoord "is" wordt in de tegenwoordige tijd niet geschreven. De zin betekent "de leerling is ijverig".'},
  {k:'kies',v:'Wat gebeurt er met de khabar na كَانَ ?',o:['Niets','Hij wordt bepaald','Hij komt in de accusatief','Hij verdwijnt'],j:2,u:'كَانَ zet zijn khabar in de accusatief: كَانَ الْبَيْتُ كَبِيرًا.'}]},

{id:'g-verbaal',sp:3,titel:'De verbale zin',
 kern:'Staat het werkwoord vooraan, dan blijft het in het enkelvoud staan.',
 tekst:`<p>Naast de nominale zin bestaat de <b>verbale zin</b>, die met het werkwoord begint. De klassieke volgorde is werkwoord – onderwerp – lijdend voorwerp: كَتَبَ الْوَلَدُ الدَّرْسَ, "schreef de jongen de les". In modern journalistiek Arabisch zie je ook vaak het onderwerp vooraan, maar de werkwoord-eerst-volgorde blijft de neutrale.</p>
 <p>Er is één eigenaardigheid die je meteen moet weten. Staat het werkwoord vóór het onderwerp, dan blijft het in het enkelvoud, ook als het onderwerp meervoud is. كَتَبَ الْأَوْلَادُ betekent "de jongens schreven", met een enkelvoudig werkwoord. Zet je het onderwerp vooraan, dan móet het werkwoord wél meervoud worden: الْأَوْلَادُ كَتَبُوا.</p>
 <p>Het geslacht past zich altijd aan. كَتَبَتِ الْبِنْتُ, het meisje schreef, met een ت aan het werkwoord — ook als het werkwoord vooropstaat.</p>`,
 vb:[['كَتَبَ الْوَلَدُ الدَّرْسَ','kataba l-waladu d-darsa','de jongen schreef de les'],['كَتَبَ الْأَوْلَادُ','kataba l-awlādu','de jongens schreven'],['الْأَوْلَادُ كَتَبُوا','al-awlādu katabū','de jongens schreven']],
 oef:[
  {k:'kies',v:'Waarom staat het werkwoord in كَتَبَ الْأَوْلَادُ in het enkelvoud?',o:['Fout van de schrijver','Omdat het vóór het onderwerp staat','Omdat أولاد enkelvoud is','Omdat het verleden tijd is'],j:1,u:'Een werkwoord vóór het onderwerp blijft enkelvoud. Staat het onderwerp voorop, dan wordt het werkwoord meervoud.'},
  {k:'kies',v:'Hoe zeg je "het meisje las"?',o:['قَرَأَ الْبِنْتُ','قَرَأَتِ الْبِنْتُ','قَرَأُوا الْبِنْتُ','الْبِنْتُ قَرَأَ'],j:1,u:'Het geslacht past zich altijd aan: قَرَأَتْ met de vrouwelijke ت.'}]},

{id:'g-perfectum',sp:3,titel:'De verleden tijd',
 kern:'Het perfectum bouw je met uitgangen achter de stam.',
 tekst:`<p>De verleden tijd, het <b>perfectum</b>, is de eenvoudigste werkwoordsvorm van het Arabisch, en meteen ook de vorm waarin werkwoorden in het woordenboek staan. De grondvorm is de derde persoon mannelijk enkelvoud: كَتَبَ, "hij schreef". Alle andere personen krijgen daar een uitgang achter.</p>
 <p>Zo wordt het كَتَبْتُ voor "ik schreef", كَتَبْتَ voor "jij schreef" tegen een man, كَتَبْتِ tegen een vrouw, كَتَبَتْ voor "zij schreef", كَتَبْنَا voor "wij schreven", كَتَبْتُمْ voor "jullie schreven" en كَتَبُوا voor "zij schreven". De stam كَتَبْ blijft steeds herkenbaar staan; alleen de staart verandert.</p>
 <p>Merk op dat het Arabisch geen apart woord voor "ik" nodig heeft. De uitgang zegt het al. أَنَا كَتَبْتُ kan wel, maar dan leg je nadruk op de persoon: <i>ik</i> heb geschreven, en niet iemand anders.</p>`,
 vb:[['كَتَبْتُ','katabtu','ik schreef'],['كَتَبَتْ','katabat','zij schreef'],['كَتَبْنَا','katabnā','wij schreven'],['كَتَبُوا','katabū','zij schreven']],
 oef:[
  {k:'kies',v:'Wat betekent دَرَسْتُ ?',o:['hij studeerde','ik studeerde','wij studeerden','zij studeerde'],j:1,u:'De uitgang ـْتُ is de eerste persoon enkelvoud: "ik studeerde".'},
  {k:'typ',v:'Schrijf de transcriptie van "wij schreven"',jt:['katabna','katabnā'],u:'katabnā — de uitgang ـْنَا is "wij".'}]},

{id:'g-imperfectum',sp:3,titel:'De tegenwoordige tijd',
 kern:'Het imperfectum werkt met voorvoegsels, niet met uitgangen.',
 tekst:`<p>Waar de verleden tijd achtervoegsels gebruikt, werkt de tegenwoordige tijd, het <b>imperfectum</b>, vooral met voorvoegsels. Van de stam ـكْتُبـ maak je أَكْتُبُ voor "ik schrijf", تَكْتُبُ voor "jij schrijft" én voor "zij schrijft", يَكْتُبُ voor "hij schrijft" en نَكْتُبُ voor "wij schrijven". De vier voorvoegsels أ، ت، ي، ن zijn het hele systeem.</p>
 <p>Dat تَكْتُبُ twee dingen kan betekenen is geen slordigheid maar een echte dubbelzinnigheid, die in de praktijk door de context wordt opgelost — of door de uitgang, want tegen een vrouw zeg je تَكْتُبِينَ.</p>
 <p>Het imperfectum dekt zowel "hij schrijft" als "hij is aan het schrijven" als "hij zal schrijven". Wil je de toekomst uitdrukkelijk markeren, dan zet je er سَـ of سَوْفَ voor: سَيَكْتُبُ, hij zal schrijven. En de ontkenning van de tegenwoordige tijd is simpelweg لَا ervoor: لَا يَكْتُبُ, hij schrijft niet.</p>`,
 vb:[['أَكْتُبُ','aktubu','ik schrijf'],['يَكْتُبُ','yaktubu','hij schrijft'],['نَكْتُبُ','naktubu','wij schrijven'],['سَيَكْتُبُ','sayaktubu','hij zal schrijven']],
 oef:[
  {k:'kies',v:'Welk voorvoegsel hoort bij "wij"?',o:['أ','ت','ي','ن'],j:3,u:'De ن: نَكْتُبُ, wij schrijven.'},
  {k:'kies',v:'Wat betekent يَدْرُسُ ?',o:['hij studeerde','hij studeert','ik studeer','zij studeert'],j:1,u:'Het voorvoegsel يَـ is de derde persoon mannelijk in de tegenwoordige tijd.'}]},

{id:'g-idafa',sp:3,titel:'De idafa',
 kern:'Twee naamwoorden achter elkaar drukken bezit uit — zonder "van".',
 tekst:`<p>Om "de deur van het huis" te zeggen heeft het Arabisch geen voorzetsel nodig. Je zet de twee woorden gewoon achter elkaar: بَابُ الْبَيْتِ. Die constructie heet <b>iḍāfa</b>, "toevoeging", en ze is een van de meest voorkomende structuren in de taal.</p>
 <p>Er gelden twee ijzeren regels. Het eerste woord krijgt nooit een lidwoord en nooit nunatie, hoe bepaald het ook is — het ontleent zijn bepaaldheid aan het tweede. En het tweede woord staat altijd in de genitief, herkenbaar aan de kasra of ـٍ. Zo lees je aan بَابُ الْبَيْتِ meteen af wat waarbij hoort: de damma op de ب markeert het hoofdwoord, de kasra op الْبَيْتِ het bepalende woord.</p>
 <p>Is het tweede woord onbepaald, dan is de hele constructie onbepaald: بَابُ بَيْتٍ, "een deur van een huis". En een bijvoeglijk naamwoord kan er niet tussen; dat moet erachteraan, met alle risico op dubbelzinnigheid van dien. Hier is ook waar de ta marbuta haar t laat horen: مَدْرَسَةُ الْقَرْيَةِ klinkt "madrasatu l-qaryati".</p>`,
 vb:[['بَابُ الْبَيْتِ','bābu l-bayti','de deur van het huis'],['كِتَابُ الطَّالِبِ','kitābu ṭ-ṭālibi','het boek van de leerling'],['مَدْرَسَةُ الْقَرْيَةِ','madrasatu l-qaryati','de school van het dorp']],
 oef:[
  {k:'kies',v:'Waarom staat er geen الـ voor بَاب in بَابُ الْبَيْتِ ?',o:['Vergeten','Het eerste woord van een idafa krijgt nooit een lidwoord','Deuren zijn onbepaald','Omdat het mannelijk is'],j:1,u:'Het eerste lid van een idafa krijgt nooit een lidwoord; het ontleent zijn bepaaldheid aan het tweede lid.'},
  {k:'kies',v:'In welke naamval staat het tweede woord van een idafa?',o:['Nominatief','Accusatief','Genitief','Geen'],j:2,u:'Altijd genitief: kasra of ـٍ.'}]},

{id:'g-voorzetsels',sp:3,titel:'Voorzetsels en de genitief',
 kern:'Na elk voorzetsel volgt de genitief, altijd.',
 tekst:`<p>Voorzetsels als فِي (in), عَلَى (op), مِنْ (van), إِلَى (naar), مَعَ (met), عَنْ (over), بِـ (met, door) en لِـ (voor, aan) leggen aan het woord dat erop volgt zonder uitzondering de genitief op. فِي الْبَيْتِ, in het huis, met een kasra. Dat is een van de weinige regels in de Arabische grammatica zonder uitzonderingen, en dus een geschenk.</p>
 <p>Twee van die voorzetsels, بِـ en لِـ, zijn één letter en worden aan het volgende woord vastgeschreven: بِالْقَلَمِ, met de pen. Voor بِـ en لِـ verandert een woord met الـ overigens van klank: لِلْمَدْرَسَةِ, voor de school, waarbij de alif van het lidwoord verdwijnt.</p>
 <p>Voorzetsels combineren ook met persoonsuitgangen: مَعِي (met mij), عَلَيْهِ (op hem), لَهُ (voor hem), فِيهَا (erin, bij een vrouwelijk woord). Zo ontstaat bovendien de gewone manier om bezit uit te drukken: عِنْدِي كِتَابٌ, letterlijk "bij mij is een boek", oftewel "ik heb een boek". Een werkwoord "hebben" bestaat niet.</p>`,
 vb:[['فِي الْبَيْتِ','fī l-bayti','in het huis'],['عِنْدِي كِتَابٌ','ʿindī kitābun','ik heb een boek'],['ذَهَبْتُ إِلَى الْمَدْرَسَةِ','dhahabtu ilā l-madrasati','ik ging naar school']],
 oef:[
  {k:'kies',v:'Hoe zeg je "ik heb een boek"?',o:['أَنَا كِتَابٌ','عِنْدِي كِتَابٌ','لِي الْكِتَابُ','كِتَابِي'],j:1,u:'عِنْدِي كِتَابٌ, letterlijk "bij mij is een boek". Een werkwoord "hebben" bestaat niet in het Arabisch.'},
  {k:'kies',v:'Welke naamval volgt na فِي ?',o:['Nominatief','Accusatief','Genitief','Wisselt'],j:2,u:'Na elk voorzetsel volgt de genitief. Zonder uitzondering.'}]},

{id:'g-ontkenning',sp:3,titel:'Ontkennen',
 kern:'Welk ontkenningswoord je kiest, hangt af van de tijd.',
 tekst:`<p>Het Arabisch heeft niet één woord voor "niet" maar een handvol, en de keuze hangt af van wat je ontkent. De tegenwoordige tijd ontken je met <b>لَا</b>: لَا أَعْرِفُ, ik weet het niet. De verleden tijd ontken je met <b>مَا</b> voor het perfectum — مَا كَتَبَ, hij schreef niet — of, eleganter en gebruikelijker in verzorgd Arabisch, met <b>لَمْ</b> gevolgd door een aparte imperfectumvorm: لَمْ يَكْتُبْ, met een sukun op het eind.</p>
 <p>Een nominale zin zonder werkwoord ontken je met <b>لَيْسَ</b>, dat zich als een werkwoord gedraagt en zijn khabar in de accusatief zet: لَيْسَ الْبَيْتُ كَبِيرًا, het huis is niet groot. En de toekomst ontken je met <b>لَنْ</b>: لَنْ أَذْهَبَ, ik zal niet gaan.</p>
 <p>Wie in het Nederlands "niet" denkt en dat op één manier probeert te vertalen, loopt hier vast. Het loont om de vier gevallen — heden, verleden, toekomst, en de zin zonder werkwoord — apart in te slijpen.</p>`,
 vb:[['لَا أَعْرِفُ','lā aʿrifu','ik weet het niet'],['لَمْ يَكْتُبْ','lam yaktub','hij heeft niet geschreven'],['لَيْسَ الْبَيْتُ كَبِيرًا','laysa l-baytu kabīran','het huis is niet groot'],['لَنْ أَذْهَبَ','lan adhhaba','ik zal niet gaan']],
 oef:[
  {k:'kies',v:'Hoe ontken je een zin zonder werkwoord?',o:['لَا','لَمْ','لَيْسَ','لَنْ'],j:2,u:'لَيْسَ, dat zich als werkwoord gedraagt en zijn khabar in de accusatief zet.'},
  {k:'kies',v:'Wat betekent لَنْ أَذْهَبَ ?',o:['ik ga niet','ik ging niet','ik zal niet gaan','ga niet'],j:2,u:'لَنْ ontkent de toekomst.'}]},

{id:'g-naamval',sp:3,titel:'De naamvallen — een eerste kennismaking',
 kern:'Drie naamvallen, meestal onzichtbaar, maar wel de ruggengraat van de zin.',
 tekst:`<p>Het Arabisch heeft drie naamvallen, en ze worden aangegeven met precies één klinker aan het eind van het woord. De <b>nominatief</b> (damma, ـُ of ـٌ) is voor het onderwerp en voor beide delen van de nominale zin. De <b>accusatief</b> (fatha, ـَ of ـً) is voor het lijdend voorwerp en voor allerlei bijwoordelijke bepalingen. De <b>genitief</b> (kasra, ـِ of ـٍ) is voor alles na een voorzetsel en voor het tweede lid van een idafa.</p>
 <p>Het merkwaardige is dat je die uitgangen in geschreven Arabisch bijna nooit ziet en in gesproken Arabisch bijna nooit hoort: aan het eind van een zin laat je ze weg, en in de krant staan ze niet. Toch zijn ze er, en ze verklaren waarom de woordvolgorde zo vrij kan zijn. Wie de naamvallen leest, ziet aan één klinker wie er iets doet en met wie het gebeurt.</p>
 <p>Voor jou nu is dit genoeg: herken de drie tekens, weet welke functie erbij hoort, en verwacht ze vooral in de Koran, in poëzie en in zorgvuldig voorgelezen tekst. Actief produceren komt later.</p>`,
 vb:[['الْوَلَدُ','al-waladu','de jongen — nominatief, onderwerp'],['الْوَلَدَ','al-walada','de jongen — accusatief, lijdend voorwerp'],['الْوَلَدِ','al-waladi','de jongen — genitief, na voorzetsel of in een idafa']],
 oef:[
  {k:'kies',v:'Welke naamval hoort bij het lijdend voorwerp?',o:['Nominatief','Accusatief','Genitief','Geen'],j:1,u:'De accusatief, met een fatha of tanwin fath.'},
  {k:'kies',v:'In رَأَيْتُ الْوَلَدَ — wat vertelt de fatha op الْوَلَدَ ?',o:['Het is het onderwerp','Het is het lijdend voorwerp','Het is bepaald','Het is meervoud'],j:1,u:'De fatha markeert de accusatief: de jongen ondergaat de handeling. "Ik zag de jongen."'}]},

{id:'g-wortel',sp:4,titel:'Wortel en patroon',
 kern:'Bijna elk Arabisch woord is een wortel van drie medeklinkers, gegoten in een patroon.',
 tekst:`<p>Hier ligt het hart van de taal. Het Arabische lexicon is niet opgebouwd uit losse woorden maar uit <b>wortels</b> van meestal drie medeklinkers, die een betekenisveld dragen, en <b>patronen</b> van klinkers en toevoegsels, die dat veld een grammaticale gedaante geven. De wortel ك-ت-ب draagt alles wat met schrijven te maken heeft. Giet je hem in het patroon فَعَلَ, dan krijg je كَتَبَ, hij schreef. In فَاعِل krijg je كَاتِب, schrijver. In مَفْعَل krijg je مَكْتَب, bureau, de plaats van het schrijven. In مَفْعَلَة krijg je مَكْتَبَة, bibliotheek. In فِعَال krijg je كِتَاب, boek.</p>
 <p>Het patroon wordt traditioneel weergegeven met de dummy-wortel ف-ع-ل, "doen". Zeg je dat een woord "op فَاعِل staat", dan weet elke Arabist meteen: het is het actief deelwoord, de doener. Dat is een verbluffend compact vakjargon en het loont om het over te nemen.</p>
 <p>Praktisch betekent dit dat je woordenschat niet lineair groeit maar in blokken. Ken je een wortel en beheers je tien patronen, dan lees je woorden die je nooit hebt geleerd en raad je hun betekenis meestal goed. Het is ook de sleutel tot het woordenboek: klassieke Arabische woordenboeken zijn geordend op wortel, niet op alfabetische volgorde van het hele woord.</p>`,
 vb:[['ك-ت-ب','k-t-b','schrijven'],['كَاتِب / مَكْتَب / مَكْتَبَة / كِتَاب','kātib / maktab / maktaba / kitāb','schrijver / bureau / bibliotheek / boek'],['د-ر-س ← دَرَسَ، مُدَرِّس، مَدْرَسَة','d-r-s','studeren, onderwijzer, school']],
 oef:[
  {k:'kies',v:'Welke wortel zit in مَدْرَسَة ?',o:['م-ر-س','د-ر-س','م-د-ر','ر-س-ة'],j:1,u:'د-ر-س, studeren. Het patroon مَفْعَلَة geeft de plaats: de plaats van studeren, dus school.'},
  {k:'kies',v:'Wat betekent het patroon فَاعِل ?',o:['de plaats','de doener','het gevolg','het gereedschap'],j:1,u:'فَاعِل is het actief deelwoord: كَاتِب schrijver, طَالِب zoeker/student, عَالِم geleerde.'}]},

{id:'g-vormen',sp:4,titel:'De tien werkwoordsvormen',
 kern:'Dezelfde wortel krijgt door verdubbeling, verlenging of voorvoegsels een voorspelbaar andere betekenis.',
 tekst:`<p>Van elke wortel kunnen tot tien werkwoordsvormen worden afgeleid, en die vormen dragen elk een eigen betekenisrichting. Vorm I is de kale grondvorm, فَعَلَ. Vorm II verdubbelt de middelste medeklinker, فَعَّلَ, en maakt de handeling veroorzakend of intensief: van عَلِمَ (weten) komt عَلَّمَ (onderwijzen, iemand doen weten). Vorm III rekt de eerste klinker op, فَاعَلَ, en richt de handeling op iemand anders: van قَتَلَ (doden) komt قَاتَلَ (bevechten).</p>
 <p>Vorm IV, أَفْعَلَ, is opnieuw veroorzakend, vaak met een zakelijker klank: سَلِمَ (heel zijn) wordt أَسْلَمَ (zich overgeven). Vorm V en VI zijn de wederkerende tegenhangers van II en III, met een تَـ ervoor: تَعَلَّمَ, leren, letterlijk "zichzelf laten weten". Vorm VII, اِنْفَعَلَ, is passief-achtig. Vorm VIII, اِفْتَعَلَ, is vaak wederkerend of middelmatig: اِجْتَمَعَ, samenkomen. Vorm X, اِسْتَفْعَلَ, betekent doorgaans "vragen om" of "beschouwen als": اِسْتَغْفَرَ, om vergeving vragen.</p>
 <p>De richtingen zijn tendensen, geen wetten; er zijn genoeg werkwoorden waarvan de betekenis eeuwen geleden is afgedreven. Maar als leesstrategie is dit onmisbaar. Zie je een onbekend woord met een verdubbelde middelste medeklinker, dan weet je al voor je het opzoekt dat er iets veroorzakends aan de hand is.</p>`,
 vb:[['عَلِمَ ← عَلَّمَ ← تَعَلَّمَ','ʿalima ← ʿallama ← taʿallama','weten ← onderwijzen ← leren'],['غَفَرَ ← اِسْتَغْفَرَ','ghafara ← istaghfara','vergeven ← om vergeving vragen'],['جَمَعَ ← اِجْتَمَعَ','jamaʿa ← ijtamaʿa','verzamelen ← samenkomen']],
 oef:[
  {k:'kies',v:'Wat doet vorm II (فَعَّلَ) meestal met de betekenis?',o:['Ontkent haar','Maakt haar veroorzakend of intensief','Maakt haar passief','Maakt haar meervoud'],j:1,u:'De verdubbelde middelste medeklinker maakt de handeling veroorzakend: عَلِمَ weten → عَلَّمَ doen weten, onderwijzen.'},
  {k:'kies',v:'Wat betekent اِسْتَغْفَرَ, gebouwd op غ-ف-ر (vergeven)?',o:['hij vergaf','hij werd vergeven','hij vroeg om vergeving','hij vergat'],j:2,u:'Vorm X (اِسْتَفْعَلَ) betekent doorgaans "vragen om": om vergeving vragen.'}]},

{id:'g-deelwoord',sp:4,titel:'Deelwoorden en naamwoorden van plaats',
 kern:'Uit dezelfde wortel rollen de doener, de ondergaande en de plaats.',
 tekst:`<p>Naast werkwoordsvormen levert elke wortel een reeks naamwoorden op die je aan hun patroon herkent. Het <b>actief deelwoord</b> staat op فَاعِل en is de doener: كَاتِب, schrijver; قَارِئ, lezer; عَالِم, wetende, geleerde. Het <b>passief deelwoord</b> staat op مَفْعُول en is degene of datgene die de handeling ondergaat: مَكْتُوب, geschreven; مَعْلُوم, bekend; مَفْهُوم, begrepen — en als zelfstandig naamwoord: een begrip.</p>
 <p>Het <b>naamwoord van plaats en tijd</b> staat op مَفْعَل of مَفْعِل en geeft aan waar of wanneer iets gebeurt: مَكْتَب, bureau; مَسْجِد, de plaats van het neerknielen, moskee; مَغْرِب, de plaats waar de zon ondergaat, het westen — en daarmee ook het land Marokko en het gebedsmoment bij zonsondergang. Eén patroon, drie betekenissen die alle drie kloppen.</p>
 <p>Bij de afgeleide vormen II tot X werkt het net iets anders: daar begint het deelwoord met مُـ, met een kasra voor de actieve en een fatha voor de passieve variant. مُعَلِّم is een onderwijzer, مُعَلَّم is iemand die onderwezen wordt. Eén klinker scheelt.</p>`,
 vb:[['كَاتِب / مَكْتُوب','kātib / maktūb','schrijver / geschreven'],['مَسْجِد','masjid','plaats van neerknielen — moskee'],['مُسْلِم','muslim','vorm IV, actief deelwoord: hij die zich overgeeft']],
 oef:[
  {k:'kies',v:'Op welk patroon staat het passief deelwoord van vorm I?',o:['فَاعِل','مَفْعُول','مَفْعَل','فَعِيل'],j:1,u:'مَفْعُول: مَكْتُوب geschreven, مَعْلُوم bekend.'},
  {k:'kies',v:'Wat is de letterlijke betekenis van مَغْرِب ?',o:['de zon','de plaats van ondergaan','de reiziger','het gebed'],j:1,u:'Patroon مَفْعِل van غ-ر-ب (ondergaan): de plaats waar de zon ondergaat — het westen, Marokko, én het avondgebed.'}]},

{id:'g-kasus-praktijk',sp:4,titel:'Naamvallen in de praktijk',
 kern:'Je ziet ze zelden, maar waar je ze ziet, ontsluiten ze de zin.',
 tekst:`<p>Voor een volwassen lezer is de vraag niet of de naamvallen bestaan maar wanneer ze ertoe doen. Ze doen ertoe wanneer je hardop leest, want dan moet je ze uitspreken; ze doen ertoe in de Koran en in poëzie, waar ze volledig zijn geschreven; en ze doen ertoe bij zinnen waarin de woordvolgorde niet uitwijst wie wat doet.</p>
 <p>In lopende krantentaal laat je de eindklinkers weg en niemand merkt het, omdat je aan het eind van een zinsdeel toch pauzeert. Dat heet <i>waqf</i>, pauzevorm, en het is geen slordigheid maar de norm. Wat je wél altijd hoort en schrijft, is de accusatief-tanwin ـً in bijwoorden: شُكْرًا, جِدًّا, أَحْيَانًا, أَهْلًا. Die zijn versteend en verdwijnen nooit.</p>
 <p>Er is één categorie woorden waarbij de naamvallen wél altijd zichtbaar blijven: de zogeheten "vijf naamwoorden" zoals أَب en أَخ in een idafa, waar ze een lange klinker krijgen — أَبُو, أَبَا, أَبِي. Vandaar namen als أَبُو بَكْر. Wie dat weet, leest de kunya meteen goed.</p>`,
 vb:[['شُكْرًا','shukran','dank je — versteende accusatief'],['أَبُو بَكْرٍ','abū bakrin','Aboe Bakr — nominatief van أَب in een idafa'],['رَأَيْتُ أَبَاهُ','raʾaytu abāhu','ik zag zijn vader — accusatief']],
 oef:[
  {k:'kies',v:'Waarom eindigt شُكْرًا op een tanwin fath?',o:['Toeval','Het is een versteende accusatief als bijwoord','Het is meervoud','Het is vrouwelijk'],j:1,u:'Bijwoorden staan in de accusatief, en die uitgang blijft altijd staan en hoorbaar.'},
  {k:'kies',v:'Wat is de vorm van أَب als lijdend voorwerp in een idafa?',o:['أَبُو','أَبَا','أَبِي','أَبْ'],j:1,u:'أَبَا. De "vijf naamwoorden" tonen hun naamval met een lange klinker: أَبُو, أَبَا, أَبِي.'}]},

{id:'g-passief',sp:4,titel:'Het passief',
 kern:'Het passief wordt niet met een hulpwerkwoord gemaakt maar met andere klinkers.',
 tekst:`<p>Het Arabische passief is een van de zuiverste voorbeelden van hoe de taal werkt. Er komt geen hulpwerkwoord aan te pas en er verandert geen enkele medeklinker; alleen de klinkers wisselen. كَتَبَ, hij schreef, wordt كُتِبَ, het werd geschreven. De regel is even kort als hij klinkt: damma op de eerste, kasra op de voorlaatste.</p>
 <p>In de tegenwoordige tijd wordt يَكْتُبُ tot يُكْتَبُ: damma op het voorvoegsel, fatha op de voorlaatste. Ook hier veranderen alleen de klinkers.</p>
 <p>Klassiek Arabisch gebruikt het passief vooral wanneer de handelende persoon onbekend is of bewust niet genoemd wordt; het heet dan ook مَجْهُول, "onbekend". Een zin als قُتِلَ الرَّجُلُ zegt dat de man gedood werd zonder te verklappen door wie. Wil je de dader wél noemen, dan gebruikt zorgvuldig klassiek Arabisch liever de actieve zin. In moderne journalistiek is die regel losser geworden.</p>`,
 vb:[['كَتَبَ ← كُتِبَ','kataba ← kutiba','hij schreef ← het werd geschreven'],['يَكْتُبُ ← يُكْتَبُ','yaktubu ← yuktabu','hij schrijft ← het wordt geschreven'],['وُلِدَ','wulida','hij werd geboren']],
 oef:[
  {k:'kies',v:'Wat is het passief van فَعَلَ ?',o:['فَاعَلَ','فُعِلَ','أَفْعَلَ','فَعَّلَ'],j:1,u:'فُعِلَ: damma op de eerste medeklinker, kasra op de voorlaatste.'},
  {k:'typ',v:'Wat betekent وُلِدَ ?',jt:['hij werd geboren','werd geboren','geboren'],u:'وُلِدَ is het passief van وَلَدَ (baren): hij werd geboren.'}]},

{id:'g-koranstijl',sp:4,titel:'Zinsverbanden in Koranisch Arabisch',
 kern:'إنّ، قد، en de alomtegenwoordige و zijn de scharnieren van de klassieke zin.',
 tekst:`<p>Wie klassiek Arabisch begint te lezen, valt over een paar kleine woorden die in leerboeken zelden aandacht krijgen en op elke bladzijde staan. <b>إِنَّ</b> opent een nominale zin met nadruk en zet het onderwerp in de accusatief: إِنَّ اللّٰهَ غَفُورٌ رَحِيمٌ. Vertalen met "voorwaar" klinkt archaïsch; meestal is het beter om de nadruk in het Nederlands met woordvolgorde of intonatie te vangen.</p>
 <p><b>قَدْ</b> voor een perfectum versterkt de voltooidheid — "hij heeft werkelijk al" — en voor een imperfectum betekent het juist "wellicht". Eén woordje, twee tegengestelde functies, uitsluitend te onderscheiden aan de tijd die erop volgt.</p>
 <p>En dan de <b>و</b>. In klassiek proza is dit niet alleen "en" maar het universele scharnier tussen zinnen; een lange passage kan uit een reeks met wāw verbonden clausules bestaan waar het Nederlands punten en bijzinnen nodig heeft. Een bijzondere is de wāw al-ḥāl, die een gelijktijdige omstandigheid inleidt: جَاءَ وَهُوَ يَبْكِي, "hij kwam terwijl hij huilde". Wie die wāw als "en" leest, mist het verband.</p>`,
 vb:[['إِنَّ اللّٰهَ غَفُورٌ رَحِيمٌ','inna llāha ghafūrun raḥīmun','God is waarlijk vergevend en genadig'],['قَدْ أَفْلَحَ الْمُؤْمِنُونَ','qad aflaḥa l-muʾminūna','de gelovigen zijn waarlijk geslaagd'],['جَاءَ وَهُوَ يَبْكِي','jāʾa wa-huwa yabkī','hij kwam terwijl hij huilde']],
 oef:[
  {k:'kies',v:'Wat doet إِنَّ met het onderwerp van de zin?',o:['Niets','Zet het in de accusatief','Zet het in de genitief','Maakt het onbepaald'],j:1,u:'إِنَّ zet zijn onderwerp in de accusatief: إِنَّ اللّٰهَ, met een fatha.'},
  {k:'kies',v:'Wat betekent de wāw in جَاءَ وَهُوَ يَبْكِي ?',o:['en','of','terwijl','maar'],j:2,u:'Dit is de wāw al-ḥāl, die een gelijktijdige omstandigheid inleidt: "terwijl".'}]},

{id:'g-vocalisatie',sp:4,titel:'Waarom je de klinkertekens leert loslaten',
 kern:'Volledige vocalisatie helpt de beginner en remt de gevorderde.',
 tekst:`<p>Alle Arabische kinderen leren lezen met volledige tashkil en laten die binnen een paar jaar los. Dat is geen gemakzucht maar een noodzakelijke stap. Een geoefend lezer herkent woordbeelden in hun geheel; de klinkertekens leveren dan geen nieuwe informatie meer op maar wel extra visuele ruis, en het leestempo zakt.</p>
 <p>Het punt waarop je ze kunt missen komt eerder dan je denkt, en het komt per woord. Een woord als مَدْرَسَة is zonder tekens volstrekt eenduidig; er bestaat geen andere manier om مدرسة te lezen. Maar كتب kan كَتَبَ zijn, كُتِبَ, كُتُب of كَتَّبَ, en daar helpt geen woordbeeld. Vandaar dat ook in onvocaliseerde teksten af en toe een teken opduikt: juist op de plaats waar het ertoe doet.</p>
 <p>Deze app doet hetzelfde. In de eerste twee sporen staat alles volledig vocaliseerd. Vanaf spoor drie wordt het afgebouwd en blijven de tekens staan waar het woord anders dubbelzinnig is. Je kunt dat in de instellingen zelf bijstellen — en het is de moeite waard om jezelf af en toe op de zwaarste stand te zetten en te merken hoeveel je al zonder hulp leest.</p>`,
 vb:[['مدرسة','madrasa','ondubbelzinnig zonder tekens'],['كتب','?','kataba, kutiba, kutub of kattaba — hier is een teken nodig'],['كُتِبَ','kutiba','met alleen de noodzakelijke tekens']],
 oef:[
  {k:'kies',v:'Waarom wordt tashkil op den duur weggelaten?',o:['Het is te veel werk','Een geoefend lezer herkent woordbeelden en de tekens vertragen dan','Het is niet correct','Alleen kinderen mogen het gebruiken'],j:1,u:'Voor de geoefende lezer voegen de tekens bij eenduidige woorden geen informatie toe en verlagen ze het leestempo.'},
  {k:'kies',v:'Welk woord heeft echt een klinkerteken nodig?',o:['مدرسة','مسجد','كتب','بيت'],j:2,u:'كتب kan kataba, kutiba, kutub of kattaba zijn. De andere drie zijn ondubbelzinnig.'}]}
];
