import type { Koranwoord } from './soorten'


/* ============================================================
   KORANWOORDEN — de honderd meest voorkomende woorden
   ------------------------------------------------------------
   Alleen zichtbaar in het volwassen spoor. Het idee achter deze
   lijst is bekend en goed onderbouwd: een kleine kern van woorden
   dekt een groot deel van de lopende tekst, dus wie deze honderd
   kent, herkent bij het lezen aanzienlijk meer dan honderd
   plaatsen.

   f = ordegrootte van het aantal voorkomens in de Koran, geteld
   over alle vormen van de wortel of het woord. De getallen zijn
   ontleend aan de gangbare frequentielijsten en bewust afgerond;
   verschillende tellingen komen op verschillende cijfers uit
   omdat ze anders omgaan met samengetrokken vormen en met
   voor- en achtervoegsels. Behandel ze als rangorde, niet als
   exacte statistiek.

   a Arabisch · t transcriptie · n Nederlands · r wortel
   k soort: partikel / naam / werkwoord / eigenschap
   ============================================================ */
export const KORAN100: Koranwoord[] = [
{a:'اَللّٰه',t:'Allāh',n:'God',r:'أ-ل-ه',f:2700,k:'naam'},
{a:'مِنْ',t:'min',n:'van, uit; een deel van',r:'—',f:3200,k:'partikel'},
{a:'فِي',t:'fī',n:'in, binnen',r:'—',f:1700,k:'partikel'},
{a:'مَا',t:'mā',n:'wat; niet',r:'—',f:1700,k:'partikel'},
{a:'لَا',t:'lā',n:'niet, geen',r:'—',f:1700,k:'partikel'},
{a:'إِنَّ',t:'inna',n:'voorwaar, werkelijk',r:'—',f:1600,k:'partikel'},
{a:'قَالَ',t:'qāla',n:'hij zei',r:'ق-و-ل',f:1700,k:'werkwoord'},
{a:'عَلَى',t:'ʿalā',n:'op, over, tegen',r:'—',f:1400,k:'partikel'},
{a:'الَّذِي',t:'alladhī',n:'die, hij die',r:'—',f:1400,k:'partikel'},
{a:'كَانَ',t:'kāna',n:'hij was',r:'ك-و-ن',f:1350,k:'werkwoord'},
{a:'رَبّ',t:'rabb',n:'Heer, meester',r:'ر-ب-ب',f:970,k:'naam'},
{a:'عَلِمَ',t:'ʿalima',n:'hij wist, kende',r:'ع-ل-م',f:850,k:'werkwoord'},
{a:'إِلَى',t:'ilā',n:'naar, tot',r:'—',f:740,k:'partikel'},
{a:'آمَنَ',t:'āmana',n:'hij geloofde',r:'أ-م-ن',f:537,k:'werkwoord'},
{a:'كَفَرَ',t:'kafara',n:'hij was ongelovig, verwierp',r:'ك-ف-ر',f:525,k:'werkwoord'},
{a:'أَرْض',t:'arḍ',n:'aarde, land',r:'أ-ر-ض',f:461,k:'naam'},
{a:'يَوْم',t:'yawm',n:'dag',r:'ي-و-م',f:475,k:'naam'},
{a:'إِذَا',t:'idhā',n:'wanneer, als',r:'—',f:407,k:'partikel'},
{a:'قَوْم',t:'qawm',n:'volk, gemeenschap',r:'ق-و-م',f:383,k:'naam'},
{a:'آيَة',t:'āya',n:'teken, vers',r:'أ-ي-ي',f:380,k:'naam'},
{a:'عَمِلَ',t:'ʿamila',n:'hij deed, verrichtte',r:'ع-م-ل',f:360,k:'werkwoord'},
{a:'كُلّ',t:'kull',n:'elk, alle, geheel',r:'ك-ل-ل',f:358,k:'partikel'},
{a:'جَعَلَ',t:'jaʿala',n:'hij maakte, stelde aan',r:'ج-ع-ل',f:346,k:'werkwoord'},
{a:'ثُمَّ',t:'thumma',n:'daarna, vervolgens',r:'—',f:338,k:'partikel'},
{a:'رَسُول',t:'rasūl',n:'boodschapper',r:'ر-س-ل',f:332,k:'naam'},
{a:'عَذَاب',t:'ʿadhāb',n:'bestraffing, kwelling',r:'ع-ذ-ب',f:322,k:'naam'},
{a:'سَمَاء',t:'samāʾ',n:'hemel',r:'س-م-و',f:310,k:'naam'},
{a:'ذَكَرَ',t:'dhakara',n:'hij noemde, gedacht',r:'ذ-ك-ر',f:292,k:'werkwoord'},
{a:'حَقّ',t:'ḥaqq',n:'waarheid, recht',r:'ح-ق-ق',f:287,k:'naam'},
{a:'شَيْء',t:'shayʾ',n:'ding, iets',r:'ش-ي-أ',f:283,k:'naam'},
{a:'أَخَذَ',t:'akhadha',n:'hij nam, greep',r:'أ-خ-ذ',f:273,k:'werkwoord'},
{a:'رَأَى',t:'raʾā',n:'hij zag, meende',r:'ر-أ-ي',f:271,k:'werkwoord'},
{a:'اِتَّقَى',t:'ittaqā',n:'hij vreesde God, hoedde zich',r:'و-ق-ي',f:258,k:'werkwoord'},
{a:'خَلَقَ',t:'khalaqa',n:'hij schiep',r:'خ-ل-ق',f:248,k:'werkwoord'},
{a:'أَمْر',t:'amr',n:'zaak, bevel',r:'أ-م-ر',f:248,k:'naam'},
{a:'بَيْنَ',t:'bayna',n:'tussen',r:'ب-ي-ن',f:248,k:'partikel'},
{a:'نَاس',t:'nās',n:'mensen',r:'ن-و-س',f:241,k:'naam'},
{a:'قَبْلَ',t:'qabla',n:'vóór (in tijd)',r:'ق-ب-ل',f:239,k:'partikel'},
{a:'جَاءَ',t:'jāʾa',n:'hij kwam',r:'ج-ي-أ',f:236,k:'werkwoord'},
{a:'غَفَرَ',t:'ghafara',n:'hij vergaf',r:'غ-ف-ر',f:234,k:'werkwoord'},
{a:'مُؤْمِن',t:'muʾmin',n:'gelovige',r:'أ-م-ن',f:230,k:'naam'},
{a:'دَعَا',t:'daʿā',n:'hij riep aan, nodigde uit',r:'د-ع-و',f:212,k:'werkwoord'},
{a:'بَعْدَ',t:'baʿda',n:'na',r:'ب-ع-د',f:211,k:'partikel'},
{a:'أَنْزَلَ',t:'anzala',n:'hij zond neer, openbaarde',r:'ن-ز-ل',f:190,k:'werkwoord'},
{a:'خَيْر',t:'khayr',n:'goed, het betere',r:'خ-ي-ر',f:186,k:'eigenschap'},
{a:'سَمِعَ',t:'samiʿa',n:'hij hoorde, verhoorde',r:'س-م-ع',f:185,k:'werkwoord'},
{a:'سَبِيل',t:'sabīl',n:'weg, pad',r:'س-ب-ل',f:176,k:'naam'},
{a:'مَوْت',t:'mawt',n:'de dood',r:'م-و-ت',f:165,k:'naam'},
{a:'هَدَى',t:'hadā',n:'hij leidde op het rechte pad',r:'ه-د-ي',f:163,k:'werkwoord'},
{a:'عَلِيم',t:'ʿalīm',n:'alwetend',r:'ع-ل-م',f:163,k:'eigenschap'},
{a:'نَار',t:'nār',n:'vuur, hellevuur',r:'ن-و-ر',f:145,k:'naam'},
{a:'جَنَّة',t:'janna',n:'tuin, paradijs',r:'ج-ن-ن',f:147,k:'naam'},
{a:'قَلْب',t:'qalb',n:'hart',r:'ق-ل-ب',f:132,k:'naam'},
{a:'ظَالِم',t:'ẓālim',n:'onrechtvaardige',r:'ظ-ل-م',f:130,k:'naam'},
{a:'عَبْد',t:'ʿabd',n:'dienaar, slaaf',r:'ع-ب-د',f:130,k:'naam'},
{a:'أَرْسَلَ',t:'arsala',n:'hij zond',r:'ر-س-ل',f:130,k:'werkwoord'},
{a:'أَهْل',t:'ahl',n:'de mensen van, familie',r:'أ-ه-ل',f:127,k:'naam'},
{a:'رَزَقَ',t:'razaqa',n:'hij voorzag van levensonderhoud',r:'ر-ز-ق',f:123,k:'werkwoord'},
{a:'يَد',t:'yad',n:'hand',r:'ي-د-ي',f:120,k:'naam'},
{a:'دُنْيَا',t:'dunyā',n:'het wereldse leven',r:'د-ن-و',f:115,k:'naam'},
{a:'آخِرَة',t:'ākhira',n:'het hiernamaals',r:'أ-خ-ر',f:115,k:'naam'},
{a:'رَحْمَة',t:'raḥma',n:'barmhartigheid',r:'ر-ح-م',f:114,k:'naam'},
{a:'رَحِيم',t:'raḥīm',n:'meest genadevol',r:'ر-ح-م',f:114,k:'eigenschap'},
{a:'كِتَاب',t:'kitāb',n:'boek, schrift',r:'ك-ت-ب',f:261,k:'naam'},
{a:'نَفْس',t:'nafs',n:'ziel, zelf',r:'ن-ف-س',f:295,k:'naam'},
{a:'أَتَى',t:'atā',n:'hij kwam, bracht',r:'أ-ت-ي',f:263,k:'werkwoord'},
{a:'عِلْم',t:'ʿilm',n:'kennis',r:'ع-ل-م',f:105,k:'naam'},
{a:'صَبَرَ',t:'ṣabara',n:'hij was geduldig, volhardde',r:'ص-ب-ر',f:103,k:'werkwoord'},
{a:'وَلَد',t:'walad',n:'kind, zoon',r:'و-ل-د',f:102,k:'naam'},
{a:'عَزِيز',t:'ʿazīz',n:'almachtig, verheven',r:'ع-ز-ز',f:99,k:'eigenschap'},
{a:'حَكِيم',t:'ḥakīm',n:'alwijs',r:'ح-ك-م',f:97,k:'eigenschap'},
{a:'غَفُور',t:'ghafūr',n:'meest vergevend',r:'غ-ف-ر',f:91,k:'eigenschap'},
{a:'مَلَك',t:'malak',n:'engel',r:'م-ل-ك',f:88,k:'naam'},
{a:'شَيْطَان',t:'shayṭān',n:'satan, duivel',r:'ش-ط-ن',f:88,k:'naam'},
{a:'مَال',t:'māl',n:'bezit, rijkdom',r:'م-و-ل',f:86,k:'naam'},
{a:'هُدًى',t:'hudan',n:'leiding',r:'ه-د-ي',f:85,k:'naam'},
{a:'حَيَاة',t:'ḥayāh',n:'leven',r:'ح-ي-ي',f:76,k:'naam'},
{a:'نَبِيّ',t:'nabī',n:'profeet',r:'ن-ب-أ',f:75,k:'naam'},
{a:'وَجْه',t:'wajh',n:'gezicht, aangezicht',r:'و-ج-ه',f:72,k:'naam'},
{a:'قُرْآن',t:'qurʾān',n:'Koran, voordracht',r:'ق-ر-أ',f:70,k:'naam'},
{a:'صَلَاة',t:'ṣalāh',n:'gebed',r:'ص-ل-و',f:67,k:'naam'},
{a:'بَيْت',t:'bayt',n:'huis',r:'ب-ي-ت',f:65,k:'naam'},
{a:'عَيْن',t:'ʿayn',n:'oog, bron',r:'ع-ي-ن',f:65,k:'naam'},
{a:'أُمَّة',t:'umma',n:'gemeenschap, volk',r:'أ-م-م',f:64,k:'naam'},
{a:'مَاء',t:'māʾ',n:'water',r:'م-و-ه',f:63,k:'naam'},
{a:'رَجُل',t:'rajul',n:'man',r:'ر-ج-ل',f:55,k:'naam'},
{a:'قَدِير',t:'qadīr',n:'tot alles in staat',r:'ق-د-ر',f:45,k:'eigenschap'},
{a:'صِرَاط',t:'ṣirāṭ',n:'pad, weg',r:'ص-ر-ط',f:45,k:'naam'},
{a:'نُور',t:'nūr',n:'licht',r:'ن-و-ر',f:43,k:'naam'},
{a:'عَظِيم',t:'ʿaẓīm',n:'geweldig, ontzagwekkend',r:'ع-ظ-م',f:107,k:'eigenschap'},
{a:'قَدْ',t:'qad',n:'reeds; wellicht',r:'—',f:400,k:'partikel'},
{a:'لَمْ',t:'lam',n:'niet (verleden tijd)',r:'—',f:600,k:'partikel'},
{a:'لَنْ',t:'lan',n:'nooit, zeker niet',r:'—',f:150,k:'partikel'},
{a:'إِنْ',t:'in',n:'als, indien',r:'—',f:600,k:'partikel'},
{a:'عَنْ',t:'ʿan',n:'over, weg van',r:'—',f:465,k:'partikel'},
{a:'مَعَ',t:'maʿa',n:'met, samen met',r:'—',f:160,k:'partikel'},
{a:'أَوْ',t:'aw',n:'of',r:'—',f:280,k:'partikel'},
{a:'لٰكِنْ',t:'lākin',n:'maar, echter',r:'—',f:40,k:'partikel'},
{a:'كَثِير',t:'kathīr',n:'veel, talrijk',r:'ك-ث-ر',f:167,k:'eigenschap'},
{a:'أَوَّل',t:'awwal',n:'eerste',r:'أ-و-ل',f:80,k:'eigenschap'}
];
