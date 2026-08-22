import type { Blok, Metingniveau, Metingvraag, Sessiestap, Week } from './soorten'


/* ============================================================
   HET JAARPROGRAMMA
   Zesendertig zaterdagen van anderhalf uur. Elke week dezelfde
   opbouw, zodat een kind na drie weken weet wat er komt: openen,
   herhalen, nieuwe letters, lezen, schrijven, een stuk geloof, en
   afsluiten. De letters lopen cumulatief — wat er staat blijft
   terugkomen — en het geloofsdeel haakt waar het kan aan de letter
   of het woord van die week.
   ============================================================ */
export const SESSIE: Sessiestap[] = [
  {id:'open',      min:5,  t:'Openen',            wat:'Ga zitten, zeg samen de basmala, en kijk wat jullie vandaag gaan doen.'},
  {id:'herhaal',   min:15, t:'Herhalen',          wat:'Eerst terug: de letters en woorden van de vorige weken. Pas daarna iets nieuws.'},
  {id:'letters',   min:20, t:'Nieuwe letters',    wat:'Kijken, luisteren, naspreken. Elke letter in zijn vier vormen.'},
  {id:'lezen',     min:15, t:'Lezen',             wat:'Woorden waarin de nieuwe letters zitten. Hardop, rustig, meerdere keren.'},
  {id:'schrijven', min:20, t:'Schrijven',         wat:'Het werkblad: overtrekken, dan zelf. Van rechts naar links.'},
  {id:'geloof',    min:10, t:'Een stuk geloof',   wat:'Kort en concreet. Hier hoort het Arabische woord van vandaag bij.'},
  {id:'slot',      min:5,  t:'Afsluiten',         wat:'Wat blijft er deze week thuis liggen om te oefenen? Sluit af met een du\'a.'}
];
export const SESSIEMINUTEN: number = SESSIE.reduce((n,x)=>n+x.min,0);

/* Vier blokken van negen weken. De negende week van elk blok is
   herhaling met een toets — geen nieuwe stof. */
export const BLOKKEN: Blok[] = [
  {n:1, weken:[1,9],   t:'De eerste zestien letters', u:'Van alif tot ta, met de korte klinkers erbij.'},
  {n:2, weken:[10,18], t:'Het alfabet compleet',      u:'De laatste twaalf letters, en de tekens die je nodig hebt om te lezen.'},
  {n:3, weken:[19,27], t:'Woorden en zinnen',         u:'Verbinden, het lidwoord, en de eerste echte zinnen.'},
  {n:4, weken:[28,36], t:'Lezen wat je bidt',         u:'Al-Fatiha en de korte soera\'s, en je eigen zinnen schrijven.'}
];

export const JAAR: Week[] = [
 {n:1,  t:'Alif en ba', letters:['ا','ب'], doel:'Je herkent alif en ba en schrijft ze los.',
  lezen:['أَب','بَاب'], geloof:{t:'Bismillah', ar:'بِسْمِ اللَّهِ', tr:'Bismillah',
  x:'Alles begint hiermee: in de naam van Allah. Voor het eten, voor het lezen, voor de les. De eerste letter die jullie vandaag leren, de ب, is meteen de eerste letter van dat woord.'}},
 {n:2,  t:'Ta en tha', letters:['ت','ث'], doel:'Je ziet het verschil tussen twee punten en drie.',
  lezen:['بَيْت','ثَلْج','تَاب'], geloof:{t:'De getuigenis', ar:'لَا إِلَٰهَ إِلَّا اللَّهُ', tr:'La ilaha illa llah',
  x:'De kortste zin van de islam: er is geen god dan Allah. Wie dat gelooft en uitspreekt, is moslim. Je zult hem straks zelf kunnen lezen.'}},
 {n:3,  t:'Jim, ha en kha', letters:['ج','ح','خ'], doel:'Eén vorm, drie klanken — je hoort en ziet het verschil.',
  lezen:['حَجّ','خُبْز','جَبَل'], geloof:{t:'Allah is Eén', ar:'أَحَد', tr:'ahad',
  x:'Allah is Eén. Niet één van meer, maar de Enige. Hij is niet geboren en heeft geen kinderen, en er is niets dat op Hem lijkt.'}},
 {n:4,  t:'Dal en de korte klinkers', letters:['د'], focus:'fatha, kasra, damma',
  doel:'Je leest een letter mét een klinkerteken: ba, bi, boe.',
  lezen:['بَ بِ بُ','دَ دِ دُ','بَدَ'], geloof:{t:'De vijf zuilen', ar:'أَرْكَان', tr:'arkan',
  x:'De islam rust op vijf dingen: de getuigenis, het gebed, de zakat, het vasten en de bedevaart. Vijf, zoals je vijf vingers hebt.'}},
 {n:5,  t:'Dhal en ra', letters:['ذ','ر'], doel:'Je leest lettergrepen met vier letters door elkaar.',
  lezen:['ذَهَب','رَبّ','دَرَ'], geloof:{t:'Rein worden', ar:'وُضُوء', tr:'wudu',
  x:'Voor het gebed maak je je schoon: handen, mond, neus, gezicht, armen, hoofd, voeten. In Islam leren staat het stap voor stap.'}},
 {n:6,  t:'Zay en sin', letters:['ز','س'], doel:'Je leest woorden van drie letters zonder hulp.',
  lezen:['سَمَك','زَيْت','دَرْس'], geloof:{t:'De vijf gebeden', ar:'صَلَاة', tr:'salah',
  x:'Fajr, Dhuhr, Asr, Maghrib en Isha. Vijf keer per dag stop je met alles en sta je voor Allah.'}},
 {n:7,  t:'Shin en sad', letters:['ش','ص'], doel:'Je hoort het verschil tussen de gewone s en de zware s.',
  lezen:['شَمْس','صَبْر','شَرِبَ'], geloof:{t:'De zon is een teken', ar:'الشَّمْس', tr:'ash-shams',
  x:'De zon komt elke dag op dezelfde manier op. Dat is geen toeval maar een teken. De gebedstijden lopen er precies mee mee.'}},
 {n:8,  t:'Dad en ta', letters:['ض','ط'], doel:'Zestien letters kun je nu lezen en schrijven.',
  lezen:['طَعَام','ضَرَبَ','طَبِيب'], geloof:{t:'Geduld', ar:'صَبْر', tr:'sabr',
  x:'Sabr is doorgaan als het moeilijk is, zonder te klagen tegen Allah. Ook bij het leren van letters: wie doorgaat, kan het over een paar weken.'}},
 {n:9,  t:'Herhalen en toetsen', letters:[], toets:1, doel:'Je laat zien welke van de zestien letters echt zitten.',
  lezen:['بَاب','سَمَك','شَمْس','طَعَام'], geloof:{t:'Wat weet je al?', ar:'الْحَمْدُ لِلَّهِ', tr:'alhamdulillah',
  x:'Kijk eens terug op acht weken. Zestien letters, korte klinkers, en woorden die je kunt lezen. Zeg alhamdulillah — alle lof is voor Allah.'}},

 {n:10, t:'Za en ayn', letters:['ظ','ع'], doel:'De ayn: de moeilijkste klank, en je krijgt hem te pakken.',
  lezen:['عِلْم','ظُهْر','عَبْد'], geloof:{t:'De Koran', ar:'قُرْآن', tr:'Qur\'an',
  x:'Het woord Koran betekent "wat gelezen wordt". Daarom leer je deze letters: niet als kunstje, maar om straks te kunnen lezen wat er staat.'}},
 {n:11, t:'Ghayn en fa', letters:['غ','ف'], doel:'Je leest woorden waarin keelletters zitten.',
  lezen:['غُفْرَان','فَجْر','فَهِمَ'], geloof:{t:'Allah vergeeft', ar:'الْغَفُور', tr:'al-Ghafur',
  x:'Al-Ghafur is een van de mooie namen van Allah: de Vergevende. Wie spijt heeft en het goedmaakt, vindt de deur open.'}},
 {n:12, t:'Qaf en kaf', letters:['ق','ك'], doel:'Je hoort het verschil tussen de k en de diepe q.',
  lezen:['قِبْلَة','كِتَاب','قَلَم'], geloof:{t:'De qibla', ar:'قِبْلَة', tr:'qibla',
  x:'Als je bidt sta je gericht naar de Ka\'ba in Mekka. Vanuit Nederland is dat zuidoost. Het woord begint met de letter van vandaag.'}},
 {n:13, t:'Lam en mim', letters:['ل','م'], doel:'Je schrijft de lam-alif: لا.',
  lezen:['مَسْجِد','لَيْل','عِلْم'], geloof:{t:'Er is geen god dan Allah', ar:'لَا إِلَٰهَ إِلَّا اللَّهُ', tr:'La ilaha illa llah',
  x:'Vandaag kun je hem zelf lezen. Kijk goed: de lam-alif die je net leerde staat er twee keer in.'}},
 {n:14, t:'Nun en ha', letters:['ن','ه'], doel:'Je leest woorden van vier en vijf letters.',
  lezen:['نُور','نَهْر','هُدَى'], geloof:{t:'Het licht', ar:'النُّور', tr:'an-Nur',
  x:'An-Nur betekent het licht. Kennis is licht: wat je weet, verlicht de weg waarop je loopt. Daarom heet de andere app zo.'}},
 {n:15, t:'Waw en ya', letters:['و','ي'], doel:'Het alfabet is compleet: achtentwintig letters.',
  lezen:['يَوْم','وَلَد','بَيْت'], geloof:{t:'De wassing', ar:'الْوُضُوء', tr:'al-wudu',
  x:'Nu je alle letters kent kun je de woorden van de wassing lezen. Doe hem samen door, en let op de woorden die je herkent.'}},
 {n:16, t:'Ta marbuta, alif maqsura en hamza', letters:['ة','ى','ء'],
  doel:'De drie tekens die geen gewone letter zijn maar wel overal staan.',
  lezen:['مَدْرَسَة','مُوسَى','سَمَاء'], geloof:{t:'Salaam geven', ar:'السَّلَامُ عَلَيْكُمْ', tr:'as-salamu \'alaykum',
  x:'Vrede zij met jou. Het antwoord is wa \'alaykumu s-salam. Groet ook mensen die je niet kent.'}},
 {n:17, t:'Sukun en shadda', letters:[], focus:'sukun, shadda',
  doel:'Je weet wanneer een letter geen klinker heeft en wanneer hij dubbel is.',
  lezen:['رَبّ','أُمّ','مَدْ'], geloof:{t:'Alle lof', ar:'الْحَمْدُ لِلَّهِ', tr:'alhamdulillah',
  x:'Kijk naar de shadda boven de lam in لِلَّهِ. Die verdubbelt de letter — en verandert de klank van het hele woord.'}},
 {n:18, t:'Herhalen en toetsen', letters:[], toets:2,
  doel:'Achtentwintig letters plus de tekens. Dit is de helft van het jaar.',
  lezen:['مَسْجِد','قُرْآن','مَدْرَسَة'], geloof:{t:'Halverwege', ar:'شُكْرًا', tr:'shukran',
  x:'Achttien weken. Je leest nu wat een half jaar geleden nog krullen waren. Dank Allah, en dank degene die elke week met je ging zitten.'}},

 {n:19, t:'Tanwin', letters:[], focus:'tanwin', doel:'Je leest de dubbele tekens aan het eind: -an, -in, -un.',
  lezen:['كِتَابٌ','شُكْرًا','بَيْتٍ'], geloof:{t:'Volmaakt is Allah', ar:'سُبْحَانَ اللَّهِ', tr:'subhanallah',
  x:'Subhanallah zeg je als je iets ziet wat je verwondert. Een woord dat in geen enkele taal precies te vertalen is: Allah is vrij van elk gebrek.'}},
 {n:20, t:'De lange klinkers', letters:[], focus:'madd',
  doel:'Je hoort het verschil tussen "kataba" en "kitaab" en ziet waaraan dat ligt.',
  lezen:['كِتَاب','رَسُول','كَبِير'], geloof:{t:'Allah is groter', ar:'اللَّهُ أَكْبَرُ', tr:'Allahu akbar',
  x:'Groter dan wat? Dan alles. Dat zeg je aan het begin van elk gebed, en bij elke beweging erin.'}},
 {n:21, t:'Zon- en maanletters', letters:[], focus:'ال',
  doel:'Je weet wanneer je de lam van "al-" uitspreekt en wanneer niet.',
  lezen:['الشَّمْس','الْقَمَر','السَّلَام'], geloof:{t:'De adhan', ar:'الأَذَان', tr:'adhan',
  x:'De oproep tot het gebed. Luister er deze week een keer bewust naar en tel hoeveel woorden je herkent.'}},
 {n:22, t:'Verbinden', letters:[], focus:'verbinden',
  doel:'Je leest woorden waarin de letters aan elkaar vastzitten, zonder te spellen.',
  lezen:['الْمَسْجِد','الْمَدْرَسَة','الْكِتَاب'], geloof:{t:'De moskee', ar:'الْمَسْجِد', tr:'al-masjid',
  x:'Masjid betekent letterlijk: de plek waar je je neerbuigt. Het woord komt van dezelfde stam als sujud.'}},
 {n:23, t:'Woorden uit de moskee', letters:[],
  doel:'Twintig woorden die je elke week hoort, kun je nu lezen.',
  lezen:['إِمَام','رَكْعَة','سُجُود'], geloof:{t:'Ramadan', ar:'رَمَضَان', tr:'Ramadan',
  x:'De maand van het vasten en van de Koran. Lees deze week de naam ervan zelf, in het Arabisch.'}},
 {n:24, t:'Korte zinnen', letters:[], doel:'Je leest een zin van drie of vier woorden hardop.',
  lezen:['هَذَا كِتَاب','الْبَيْتُ كَبِير','أَنَا طَالِب'], geloof:{t:'Delen', ar:'زَكَاة', tr:'zakat',
  x:'Zakat betekent reiniging én groei. Wat je weggeeft aan wie het nodig heeft, maakt de rest schoon.'}},
 {n:25, t:'Je eigen naam', letters:[], doel:'Je schrijft je eigen naam in het Arabisch, zonder voorbeeld.',
  lezen:['سَلْمَى','أَمِين','وَسِيمَة'], geloof:{t:'Je naam', ar:'اسْم', tr:'ism',
  x:'De Profeet ﷺ zei dat je op de laatste dag bij je naam geroepen wordt. Geef je kinderen later mooie namen — en wees je eigen naam waard.'}},
 {n:26, t:'Al-Fatiha, het eerste stuk', letters:[],
  doel:'Je leest de eerste drie verzen van al-Fatiha van het blad.',
  lezen:['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ','الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'],
  geloof:{t:'Wat je zeventien keer per dag zegt', ar:'الْفَاتِحَة', tr:'al-Fatiha',
  x:'Al-Fatiha betekent "de opening". Je zegt hem in elke rak\'a. Vanaf vandaag lees je hem niet meer na — je léést hem.'}},
 {n:27, t:'Herhalen en toetsen', letters:[], toets:3,
  doel:'Lezen zonder spellen: dat is wat we deze keer meten.',
  lezen:['الْحَمْدُ لِلَّهِ','هَذَا مَسْجِد'], geloof:{t:'Terugkijken', ar:'تَقَدُّم', tr:'taqaddum',
  x:'Drie blokken achter de rug. Kijk terug naar week één en zie hoe ver je bent gekomen.'}},

 {n:28, t:'Al-Fatiha, het slot', letters:[], doel:'Je leest de hele Fatiha van het blad.',
  lezen:['إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ','اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'],
  geloof:{t:'Alleen U vragen wij om hulp', ar:'إِيَّاكَ نَسْتَعِينُ', tr:'iyyaka nasta\'in',
  x:'Middenin al-Fatiha draait het om: eerst spreek je over Allah, daarna tegen Hem. Vanaf dat vers is het een gesprek.'}},
 {n:29, t:'Al-Ikhlas lezen', letters:[], doel:'Je leest een hele soera zelfstandig.',
  lezen:['قُلْ هُوَ اللَّهُ أَحَدٌ','اللَّهُ الصَّمَدُ'], geloof:{t:'Wie Allah is', ar:'الإِخْلَاص', tr:'al-Ikhlas',
  x:'Vier regels die samenvatten wie Allah is. De Profeet ﷺ zei dat deze soera een derde van de Koran waard is.'}},
 {n:30, t:'Al-Falaq lezen', letters:[], doel:'Je leest vlot, met de juiste stops.',
  lezen:['قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ','مِن شَرِّ مَا خَلَقَ'], geloof:{t:'Bescherming vragen', ar:'أَعُوذُ', tr:'a\'udhu',
  x:'A\'udhu betekent: ik zoek bescherming. Twee soera\'s aan het eind van de Koran gaan daarover; lees ze voor het slapen.'}},
 {n:31, t:'An-Nas lezen', letters:[], doel:'Je leest de laatste soera van de Koran.',
  lezen:['قُلْ أَعُوذُ بِرَبِّ النَّاسِ','مَلِكِ النَّاسِ'], geloof:{t:'De mensen', ar:'النَّاس', tr:'an-nas',
  x:'De laatste soera gaat over de mensen — en over wat er in een hart influistert. Herkennen is het halve werk.'}},
 {n:32, t:'Tellen tot tien', letters:[], doel:'Je leest en schrijft de getallen één tot tien.',
  lezen:['وَاحِد','اِثْنَان','ثَلَاثَة'], geloof:{t:'De tasbih', ar:'سُبْحَانَ اللَّهِ', tr:'subhanallah',
  x:'Na het gebed drieëndertig keer subhanallah, drieëndertig keer alhamdulillah, drieëndertig keer Allahu akbar. Nu kun je meetellen in het Arabisch.'}},
 {n:33, t:'Woorden voor elke dag', letters:[], doel:'Je leest en begrijpt vijftien alledaagse woorden.',
  lezen:['مَاء','خُبْز','أُمّ','أَب'], geloof:{t:'Du\'a voor de dag', ar:'دُعَاء', tr:'du\'a',
  x:'Du\'a is gewoon: aan Allah vragen. In je eigen taal mag ook. Maar de korte Arabische du\'a\'s kun je nu zelf lezen.'}},
 {n:34, t:'Een zin schrijven', letters:[], doel:'Je schrijft zelf een zin van vier woorden, zonder voorbeeld.',
  lezen:['أَنَا فِي الْبَيْت','هَذَا كِتَابِي'], geloof:{t:'Mooi gedrag', ar:'أَخْلَاق', tr:'akhlaq',
  x:'"Ik ben gestuurd om het goede gedrag compleet te maken." Schrijf deze week één zin op over iets goeds dat je gaat doen.'}},
 {n:35, t:'Vloeiend lezen', letters:[], doel:'Je leest een half blad achter elkaar, zonder haperen.',
  lezen:['الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ','قُلْ هُوَ اللَّهُ أَحَدٌ'],
  geloof:{t:'De profeten', ar:'الأَنْبِيَاء', tr:'al-anbiya',
  x:'Van Adam tot Mohammed ﷺ. In Islam leren staan dertien van hun verhalen; lees er deze week één samen.'}},
 {n:36, t:'Eindtoets en afsluiting', letters:[], toets:4,
  doel:'Je laat het hele jaar zien: lezen, schrijven en begrijpen.',
  lezen:['الْفَاتِحَة','الإِخْلَاص','الْفَلَق','النَّاس'], geloof:{t:'Wat je nu kunt', ar:'الْحَمْدُ لِلَّهِ', tr:'alhamdulillah',
  x:'Een jaar geleden waren dit krullen op papier. Nu lees je het boek van je Heer. Dit is geen eindpunt maar een begin.'}}
];

/* De niveaubepaling. Achttien vragen die oplopen van letterherkenning
   naar het lezen van een zin. Het gaat er niet om wie het meest weet,
   maar op welke week het programma voor dit kind moet beginnen. */
export const METING: Metingvraag[] = [
  {v:'Welke letter is dit?', ar:'ب', o:['ba','ta','tha'], a:0, g:'letters'},
  {v:'Welke letter is dit?', ar:'م', o:['nun','mim','lam'], a:1, g:'letters'},
  {v:'Welke letter is dit?', ar:'ع', o:['ghayn','ha','ayn'], a:2, g:'letters'},
  {v:'Welke letter is dit?', ar:'ش', o:['sin','shin','sad'], a:1, g:'letters'},
  {v:'Welke letter is dit?', ar:'ق', o:['qaf','fa','kaf'], a:0, g:'letters'},
  {v:'In welk woord zit de letter ب?', ar:'', o:['كِتَاب','سَمَك','نُور'], a:0, g:'vormen'},
  {v:'In welk woord zit de letter م?', ar:'', o:['بَاب','مَسْجِد','دَار'], a:1, g:'vormen'},
  {v:'Welke twee vormen horen bij dezelfde letter?', ar:'', o:['ه en هـ','ح en خ','د en ذ'], a:0, g:'vormen'},
  {v:'Hoe klinkt dit?', ar:'بَ', o:['ba','bi','bu'], a:0, g:'klinkers'},
  {v:'Hoe klinkt dit?', ar:'كُ', o:['ka','ki','ku'], a:2, g:'klinkers'},
  {v:'Wat doet dit teken ّ boven een letter?', ar:'رَبّ', o:['de letter is dubbel','de letter is stil','de letter is lang'], a:0, g:'klinkers'},
  {v:'Lees dit woord.', ar:'بَاب', o:['bab — deur','bat — eend','tab — berouw'], a:0, g:'woorden'},
  {v:'Lees dit woord.', ar:'سَمَك', o:['samak — vis','malik — koning','kalam — pen'], a:0, g:'woorden'},
  {v:'Lees dit woord.', ar:'مَسْجِد', o:['masjid — moskee','madrasa — school','maktab — bureau'], a:0, g:'woorden'},
  {v:'Lees dit woord.', ar:'كِتَاب', o:['kitab — boek','katib — schrijver','maktub — geschreven'], a:0, g:'woorden'},
  {v:'Spreek je de lam van ال hier uit?', ar:'الشَّمْس', o:['nee, de shin verdubbelt','ja, gewoon al-shams','alleen bij het lezen'], a:0, g:'zinnen'},
  {v:'Lees deze zin.', ar:'هَذَا كِتَاب', o:['hadha kitab — dit is een boek','hadha bayt — dit is een huis','huwa kitab — hij is een boek'], a:0, g:'zinnen'},
  {v:'Lees dit vers.', ar:'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', o:['alhamdu lillahi rabbi l-\'alamin','bismillahi r-rahmani r-rahim','iyyaka na\'budu wa iyyaka nasta\'in'], a:0, g:'zinnen'}
];
/* Score bepaalt op welke week het programma begint. Wie alles goed heeft,
   hoeft de eerste letters niet nog eens; wie niets goed heeft begint bij één.
   Nooit verder dan week 17: de tekens en het verbinden slaat niemand over. */
export const METINGNIVEAUS: Metingniveau[] = [
  {min:0,  niveau:1, week:1,  t:'Beginner',   u:'Je begint bij de eerste letter. Precies goed — zo hoort het.'},
  {min:7,  niveau:2, week:5,  t:'Op weg',     u:'Je kent de eerste letters al. Je slaat de eerste vier weken over.'},
  {min:12, niveau:3, week:11, t:'Gevorderd',  u:'Je leest losse letters en korte woorden. Je begint halverwege het tweede blok.'},
  {min:16, niveau:4, week:17, t:'Vlot',       u:'Je leest al aardig. Je begint bij de tekens en gaat snel door naar zinnen.'}
];
