import type { Extrateken, Letter, Teken } from './soorten'

/* ============================================================
   LETTERS — de 28 letters van het Arabische alfabet
   ------------------------------------------------------------
   De vier schrijfvormen worden NIET als losse tekens opgeslagen
   maar met zero-width joiner (U+200D) afgedwongen. Reden: de
   Unicode-presentatievormen (U+FE80..) zijn "compatibility"-tekens
   die door sommige fonts slecht worden gedekt, terwijl ZWJ door
   elke shaping-engine correct wordt afgehandeld. Bijkomend
   voordeel: letters die niet naar links verbinden (ا د ذ ر ز و)
   worden vanzelf juist getoond — een ZWJ links van zo'n letter
   levert simpelweg geen verbinding op, precies zoals in echte
   tekst.
   ------------------------------------------------------------
   velden:
   l   letter (losse vorm)
   n   naam in het Arabisch (gevocaliseerd)
   tr  transcriptie van de naam
   k   klank (korte aanduiding)
   u   uitspraakhulp in het Nederlands — eerlijk over wat het
       Nederlands niet kent
   zon true = zonsletter (14 stuks), false = maansletter
   vl  verbindt naar links (false voor ا د ذ ر ز و)
   moeilijk true = klank die een Nederlandstalige echt moet leren
   vb  voorbeeldwoord met die letter
   ============================================================ */
export const LETTERS: Letter[] = [
  {l:'ا',n:'أَلِف',tr:'alif',k:'ā / draagletter',u:'Op zichzelf geen medeklinker. Met een fatha ervoor wordt het een lange aa, als in "maan". Aan het begin van een woord draagt de alif meestal een hamza (أ إ) en is de klank een korte stembandklap, zoals de haperingsklap in "het ei" tegenover "hetei".',zon:false,vl:false,moeilijk:false,vb:'أَب'},
  {l:'ب',n:'بَاء',tr:'bāʾ',k:'b',u:'Precies de Nederlandse b van "boek".',zon:false,vl:true,moeilijk:false,vb:'بَاب'},
  {l:'ت',n:'تَاء',tr:'tāʾ',k:'t',u:'De Nederlandse t van "tafel", maar met de tongpunt iets meer tegen de tanden dan tegen de tandkas.',zon:true,vl:true,moeilijk:false,vb:'تَمْر'},
  {l:'ث',n:'ثَاء',tr:'thāʾ',k:'th (stemloos)',u:'Bestaat niet in het Nederlands. Leg je tongpunt losjes tussen je tanden en blaas: de Engelse th van "think". Niet als s uitspreken — dat is een andere letter.',zon:true,vl:true,moeilijk:true,vb:'ثَلْج'},
  {l:'ج',n:'جِيم',tr:'jīm',k:'dj',u:'Als de dj in "djembé" of de j in het Engelse "jam". In Egypte klinkt het als een harde g; leer de dj — dat is de standaard.',zon:false,vl:true,moeilijk:false,vb:'جَبَل'},
  {l:'ح',n:'حَاء',tr:'ḥāʾ',k:'ḥ',u:'Bestaat niet in het Nederlands. Een scherpe, ademende h diep uit de keel — alsof je een brilleglas wilt beslaan, maar met je keel dichtgeknepen. Verwar niet met de zachte ه en niet met de schrapende خ.',zon:false,vl:true,moeilijk:true,vb:'حَلِيب'},
  {l:'خ',n:'خَاء',tr:'khāʾ',k:'ch',u:'De enige moeilijke klank die het Nederlands wél heeft: de ch van "acht" of de g van het Zuid-Nederlandse "goed", schrapend achter in de mond.',zon:false,vl:true,moeilijk:true,vb:'خُبْز'},
  {l:'د',n:'دَال',tr:'dāl',k:'d',u:'De Nederlandse d van "doen", tong tegen de tanden.',zon:true,vl:false,moeilijk:false,vb:'دَار'},
  {l:'ذ',n:'ذَال',tr:'dhāl',k:'dh (stemhebbend)',u:'Bestaat niet in het Nederlands. Tongpunt tussen de tanden, mét stem: de Engelse th van "this". De stemhebbende tegenhanger van ث.',zon:true,vl:false,moeilijk:true,vb:'ذَهَب'},
  {l:'ر',n:'رَاء',tr:'rāʾ',k:'r (rollend)',u:'Een korte rollende tongpunt-r, zoals in het Spaans of het Rotterdamse "rrr" — nooit de brouwende keel-r.',zon:true,vl:false,moeilijk:false,vb:'رَجُل'},
  {l:'ز',n:'زَاي',tr:'zāy',k:'z',u:'De Nederlandse z van "zon", met stem — niet de scherpe s.',zon:true,vl:false,moeilijk:false,vb:'زَيْت'},
  {l:'س',n:'سِين',tr:'sīn',k:'s',u:'De gewone Nederlandse s van "sok", helder en vooraan in de mond.',zon:true,vl:true,moeilijk:false,vb:'سَمَك'},
  {l:'ش',n:'شِين',tr:'shīn',k:'sj',u:'De sj van "sjaal" of "sjaak"; iets langer aangehouden dan in het Nederlands.',zon:true,vl:true,moeilijk:false,vb:'شَمْس'},
  {l:'ص',n:'صَاد',tr:'ṣād',k:'ṣ (nadrukkelijk)',u:'Bestaat niet in het Nederlands. Een s waarbij je de achterkant van je tong optilt naar je verhemelte; de klank wordt dof en de klinker ernaast kleurt naar "aa" in plaats van "ee". Zeg "sap" met een volle mond en je zit in de buurt.',zon:true,vl:true,moeilijk:true,vb:'صَبَاح'},
  {l:'ض',n:'ضَاد',tr:'ḍād',k:'ḍ (nadrukkelijk)',u:'Bestaat niet in het Nederlands, en zelfs in het Arabisch geldt hij als de moeilijkste — het Arabisch heet daarom "de taal van de ḍād". Een d met dezelfde opgetilde tongrug als bij ص, zwaar en dof.',zon:true,vl:true,moeilijk:true,vb:'ضَيْف'},
  {l:'ط',n:'طَاء',tr:'ṭāʾ',k:'ṭ (nadrukkelijk)',u:'Bestaat niet in het Nederlands. De nadrukkelijke tegenhanger van ت: een t die van achter uit de mond komt, kort en hard, met een donkere klinker ernaast.',zon:true,vl:true,moeilijk:true,vb:'طَالِب'},
  {l:'ظ',n:'ظَاء',tr:'ẓāʾ',k:'ẓ (nadrukkelijk)',u:'Bestaat niet in het Nederlands. De nadrukkelijke tegenhanger van ذ: de Engelse th van "this", maar zwaar en dof, met opgetilde tongrug.',zon:true,vl:true,moeilijk:true,vb:'ظَهْر'},
  {l:'ع',n:'عَيْن',tr:'ʿayn',k:'ʿ',u:'Bestaat niet in het Nederlands en heeft geen enkele gelijkenis met een Nederlandse klank. Knijp je keel samen alsof je gaat kokhalzen en laat er stem doorheen komen; het klinkt als een geknepen "aa" van diep achterin. Dit is de letter waar het meeste geduld in gaat zitten, en het is de moeite waard: zonder ع klinkt geen enkel woord goed.',zon:false,vl:true,moeilijk:true,vb:'عَيْن'},
  {l:'غ',n:'غَيْن',tr:'ghayn',k:'gh',u:'De Franse of Duitse brouw-r, of het geluid van gorgelen. De stemhebbende tegenhanger van خ.',zon:false,vl:true,moeilijk:true,vb:'غَدًا'},
  {l:'ف',n:'فَاء',tr:'fāʾ',k:'f',u:'De Nederlandse f van "fiets", met de boventanden op de onderlip.',zon:false,vl:true,moeilijk:false,vb:'فَم'},
  {l:'ق',n:'قَاف',tr:'qāf',k:'q',u:'Bestaat niet in het Nederlands. Een k die veel dieper ligt: niet met de tongrug tegen het verhemelte maar met de tongwortel tegen de huig. Zeg "kop" en schuif het contactpunt zo ver mogelijk naar achteren. In Marokkaanse spreektaal wordt hij vaak een stembandklap of een g — in het Standaardarabisch is hij een echte q.',zon:false,vl:true,moeilijk:true,vb:'قَمَر'},
  {l:'ك',n:'كَاف',tr:'kāf',k:'k',u:'De gewone Nederlandse k van "kat" — niet te verwarren met de diepere ق.',zon:false,vl:true,moeilijk:false,vb:'كِتَاب'},
  {l:'ل',n:'لَام',tr:'lām',k:'l',u:'De Nederlandse l van "laat", helder en vooraan in de mond. Alleen in het woord الله wordt hij zwaar en dof.',zon:true,vl:true,moeilijk:false,vb:'لَيْل'},
  {l:'م',n:'مِيم',tr:'mīm',k:'m',u:'De Nederlandse m van "maan", met gesloten lippen.',zon:false,vl:true,moeilijk:false,vb:'مَاء'},
  {l:'ن',n:'نُون',tr:'nūn',k:'n',u:'De Nederlandse n van "nee", tongpunt tegen de tandkas.',zon:true,vl:true,moeilijk:false,vb:'نَار'},
  {l:'ه',n:'هَاء',tr:'hāʾ',k:'h',u:'De gewone zachte Nederlandse h van "huis". Verwar hem niet met ح, die veel scherper en dieper is.',zon:false,vl:true,moeilijk:false,vb:'هَوَاء'},
  {l:'و',n:'وَاو',tr:'wāw',k:'w / ū',u:'Als medeklinker de w van het Engelse "water", met ronde lippen — niet de Nederlandse v-achtige w. Als klinkerteken staat hij voor een lange oe, als in "boek".',zon:false,vl:false,moeilijk:false,vb:'وَلَد'},
  {l:'ي',n:'يَاء',tr:'yāʾ',k:'j / ī',u:'Als medeklinker de j van "jas". Als klinkerteken staat hij voor een lange ie, als in "niet".',zon:false,vl:true,moeilijk:false,vb:'يَد'}
];

/* Extra tekens die geen van de 28 letters zijn maar wel dagelijks
   voorkomen. Ze staan apart omdat "achtentwintig" een getal is dat
   klopt en dat moet blijven kloppen. */
export const EXTRA_TEKENS: Extrateken[] = [
  {l:'ة',n:'تَاء مَرْبُوطَة',tr:'tāʾ marbūṭa',u:'De "gebonden t": een h-vorm met de twee punten van de t erboven. Staat vrijwel altijd aan het eind van een vrouwelijk woord. Je spreekt hem uit als een korte a wanneer je stopt, en als een t wanneer het woord doorloopt in een idafa: مَدْرَسَة klinkt als "madrasa", maar مَدْرَسَةُ الْقَرْيَة klinkt als "madrasatu l-qarya".'},
  {l:'ى',n:'أَلِف مَقْصُورَة',tr:'alif maqṣūra',u:'Een alif in de gedaante van een yāʾ zonder punten, altijd aan het woordeinde, altijd uitgesproken als lange aa: عَلَى klinkt "ʿalā", niet "ʿalay".'},
  {l:'ء',n:'هَمْزَة',tr:'hamza',u:'De stembandklap: de harde inzet die je hoort tussen de twee delen van "het ei" als je ze los uitspreekt. De hamza rust op een alif, een wāw of een yāʾ (أ ؤ ئ) of staat los op de regel (ء). Welke stoel hij krijgt hangt af van de klinkers eromheen.'},
  {l:'لا',n:'لَام أَلِف',tr:'lām alif',u:'Geen aparte letter maar een verplichte samentrekking: waar een lām direct gevolgd wordt door een alif schrijf je لا. Er bestaat geen manier om ze los te schrijven.'}
];

/* Klinker- en hulptekens. Korte klinkers worden in het Arabisch niet
   met letters geschreven maar met tekens boven en onder de regel. */
export const TEKENS: Teken[] = [
  {t:'َ',n:'فَتْحَة',tr:'fatha',u:'Een streepje boven de letter. Korte a: بَ klinkt "ba".',demo:'بَ'},
  {t:'ِ',n:'كَسْرَة',tr:'kasra',u:'Een streepje onder de letter. Korte i: بِ klinkt "bi".',demo:'بِ'},
  {t:'ُ',n:'ضَمَّة',tr:'damma',u:'Een klein wāw-je boven de letter. Korte oe: بُ klinkt "boe".',demo:'بُ'},
  {t:'ْ',n:'سُكُون',tr:'sukun',u:'Een klein rondje boven de letter: hier volgt géén klinker. De letter plakt aan de vorige: بَبْ klinkt "bab".',demo:'بْ'},
  {t:'ّ',n:'شَدَّة',tr:'shadda',u:'Een klein "w"-tje boven de letter: verdubbeling. Je houdt de medeklinker echt langer vast, en dat verandert de betekenis: دَرَسَ is "hij studeerde", دَرَّسَ is "hij onderwees".',demo:'بّ'},
  {t:'ً',n:'تَنْوِين فَتْح',tr:'tanwin fath',u:'Twee streepjes: de nunatie -an. Vaak een bijwoord: شُكْرًا "shukran", جِدًّا "jiddan".',demo:'بًا'},
  {t:'ٌ',n:'تَنْوِين ضَمّ',tr:'tanwin damm',u:'De nunatie -un: het teken van een onbepaald zelfstandig naamwoord in de nominatief. كِتَابٌ is "een boek".',demo:'بٌ'},
  {t:'ٍ',n:'تَنْوِين كَسْر',tr:'tanwin kasr',u:'De nunatie -in: onbepaald in de genitief, na een voorzetsel. فِي بَيْتٍ is "in een huis".',demo:'بٍ'},
  {t:'ٓ',n:'مَدَّة',tr:'madda',u:'Het golfje op de alif (آ) staat voor een hamza gevolgd door een lange aa: آمَنَ klinkt "āmana".',demo:'آ'}
];
