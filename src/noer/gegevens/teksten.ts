import type { Zegtekst } from './soorten'

/* =============================================================================
   HET GEBED — de losse onderdelen, met wat je doet en wat je zegt.
============================================================================= */
export const T: Record<string, Zegtekst> = {
  takbir:{aid:'t:takbir', ar:'اللَّهُ أَكْبَرُ', tr:'Allahu akbar', uit:'al-LAA-hoe AK-bar', nl:'Allah is groter'},
  fatiha:{naam:'Al-Fatiha', ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    tr:'Bismillahi r-rahmani r-rahim. Alhamdu lillahi rabbi l-\'alamin. Ar-rahmani r-rahim. Maliki yawmi d-din. Iyyaka na\'budu wa iyyaka nasta\'in. Ihdina s-sirata l-mustaqim. Sirata lladhina an\'amta \'alayhim ghayri l-maghdubi \'alayhim wa la d-dallin.',
    nl:'In de naam van Allah, de Erbarmer, de Barmhartige. Alle lof is voor Allah, de Heer van de werelden. De Erbarmer, de Barmhartige. Meester van de dag van het oordeel. Alleen U aanbidden wij en alleen U vragen wij om hulp. Leid ons op het rechte pad. Het pad van hen die U begunstigd hebt, niet van hen op wie toorn rust en niet van de dwalenden.'},
  ruku:{aid:'q:h-dhikr:1', ar:'سُبْحَانَ رَبِّيَ الْعَظِيمِ', tr:'Subhana rabbiya l-\'azim', uit:'soeb-HAA-na RAB-bi-ya l-‘a-DHIEM', nl:'Volmaakt is mijn Heer, de Geweldige', keer:'3×'},
  sami:{aid:'q:h-dhikr:2', ar:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', tr:'Sami\'a llahu liman hamidah', uit:'sa-MI-‘a l-LAA-hoe LI-man HA-mi-dah', nl:'Allah hoort wie Hem prijst'},
  rabbana:{aid:'q:h-dhikr:3', ar:'رَبَّنَا وَلَكَ الْحَمْدُ', tr:'Rabbana wa laka l-hamd', uit:'RAB-ba-naa wa LA-ka l-HAMD', nl:'Onze Heer, aan U komt alle lof toe'},
  sujud:{aid:'q:h-dhikr:4', ar:'سُبْحَانَ رَبِّيَ الْأَعْلَى', tr:'Subhana rabbiya l-a\'la', uit:'soeb-HAA-na RAB-bi-ya l-A‘-laa', nl:'Volmaakt is mijn Heer, de Allerhoogste', keer:'3×'},
  jalsa:{aid:'q:h-dhikr:5', ar:'رَبِّ اغْفِرْ لِي', tr:'Rabbi ghfir li', uit:'RAB-bigh-FIR lie', nl:'Heer, vergeef mij'},
  tashahhud:{ar:'التَّحِيَّاتُ لِلَّهِ، الزَّاكِيَاتُ لِلَّهِ، الطَّيِّبَاتُ الصَّلَوَاتُ لِلَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    tr:'At-tahiyyatu lillah, az-zakiyatu lillah, at-tayyibatu s-salawatu lillah. As-salamu \'alayka ayyuha n-nabiyyu wa rahmatu llahi wa barakatuh. As-salamu \'alayna wa \'ala \'ibadi llahi s-salihin. Ashhadu an la ilaha illa llahu wahdahu la sharika lah, wa ashhadu anna Muhammadan \'abduhu wa rasuluh.',
    nl:'De groeten zijn voor Allah, de reine daden zijn voor Allah, de goede woorden en de gebeden zijn voor Allah. Vrede zij met jou, o profeet, en de barmhartigheid van Allah en Zijn zegeningen. Vrede zij met ons en met de oprechte dienaren van Allah. Ik getuig dat er geen god is dan Allah alleen, zonder deelgenoot, en ik getuig dat Mohammed Zijn dienaar en boodschapper is.'},
  salawat:{ar:'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، وَبَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، فِي الْعَالَمِينَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    tr:'Allahumma salli \'ala Muhammadin wa \'ala ali Muhammad, kama sallayta \'ala Ibrahima wa \'ala ali Ibrahim, wa barik \'ala Muhammadin wa \'ala ali Muhammad, kama barakta \'ala Ibrahima wa \'ala ali Ibrahim, fi l-\'alamina innaka hamidun majid.',
    nl:'Allah, zegen Mohammed en de familie van Mohammed, zoals U Ibrahim en de familie van Ibrahim gezegend hebt, en geef zegen aan Mohammed en zijn familie, zoals U die aan Ibrahim en zijn familie gaf, in alle werelden. U bent waarlijk de Geprezene, de Verhevene.'},
  amin:{aid:'t:amin', ar:'آمِينَ', tr:'Amin', uit:'AA-mien', nl:'Verhoor het'},
  /* Wat je ná de tashahhud en de zegenwens mag vragen, vóór de slotgroet. Dit
     is de overlevering waarin de Profeet ﷺ om bescherming vroeg tegen vier
     dingen; hij leerde hem aan zoals hij een soera aanleerde. */
  duaVoorSalam:{aid:'t:dua-salam',
    ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
    tr:'Allahumma inni a\'udhu bika min \'adhabi jahannam, wa min \'adhabi l-qabr, wa min fitnati l-mahya wa l-mamat, wa min sharri fitnati l-masihi d-dajjal',
    nl:'Allah, ik zoek bij U bescherming tegen de straf van de hel, tegen de straf van het graf, tegen de beproeving van het leven en de dood, en tegen het kwaad van de beproeving van de valse messias.'},
  salam:{aid:'t:salam', ar:'السَّلَامُ عَلَيْكُمْ', tr:'As-salamu \'alaykum', uit:'as-sa-LAA-moe ‘a-LAY-koem', nl:'Vrede zij met jullie'},

  /* Buiten de verplichte volgorde, maar wel goed om te kennen: wat je in een
     vrijwillig gebed zegt en wat andere scholen ook in het fard-gebed doen. */
  istiftah:{aid:'t:istiftah',
    ar:'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَىٰ جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ',
    tr:'Subhanaka llahumma wa bihamdik, wa tabaraka smuk, wa ta\'ala jadduk, wa la ilaha ghayruk',
    nl:'Volmaakt bent U, Allah, en aan U komt de lof toe. Gezegend is Uw naam, verheven is Uw grootheid, en er is geen god buiten U.'},
  taawwudh:{aid:'t:taawwudh', ar:'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    tr:'A\'udhu billahi mina sh-shaytani r-rajim', uit:'a-‘OE-dzoe bil-LAA-hi MI-na sj-sjay-TAA-ni r-ra-DJIEM',
    nl:'Ik zoek bescherming bij Allah tegen de vervloekte duivel'},

  /* Na de slotgroet. Deze stonden wel in de les over dhikr, maar niet in het
     gebedsonderdeel zelf — en juist hier hoor je ze te leren. */
  istighfar:{aid:'t:istighfar', ar:'أَسْتَغْفِرُ اللَّهَ', tr:'Astaghfiru llah', uit:'as-tagh-FI-roe l-LAAH',
    nl:'Ik vraag Allah om vergeving', keer:'3×'},
  naSalam:{aid:'t:na-salam', ar:'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    tr:'Allahumma anta s-salamu wa minka s-salam, tabarakta ya dha l-jalali wa l-ikram',
    nl:'Allah, U bent de Vrede en van U komt de vrede. Gezegend bent U, Bezitter van majesteit en eer.'},
  tasbih:{aid:'t:tasbih', ar:'سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ',
    tr:'Subhana llah (33×) · Alhamdu lillah (33×) · Allahu akbar (33×)',
    nl:'Volmaakt is Allah · Alle lof is voor Allah · Allah is groter', keer:'33× elk'},
  tahlil:{aid:'t:tahlil',
    ar:'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    tr:'La ilaha illa llahu wahdahu la sharika lah, lahu l-mulku wa lahu l-hamdu wa huwa \'ala kulli shay\'in qadir',
    nl:'Er is geen god dan Allah alleen, zonder deelgenoot. Aan Hem behoort het koningschap en aan Hem komt de lof toe, en Hij is tot alles in staat.', keer:'als honderdste'},
  qunut:{aid:'t:qunut', ar:'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ، نَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ. اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ، وَإِلَيْكَ نَسْعَىٰ وَنَحْفِدُ، نَرْجُو رَحْمَتَكَ وَنَخْشَىٰ عَذَابَكَ، إِنَّ عَذَابَكَ الْجِدَّ بِالْكُفَّارِ مُلْحِقٌ',
    tr:'Allahumma inna nasta\'inuka wa nastaghfiruka wa nu\'minu bika wa natawakkalu \'alayka wa nuthni \'alayka l-khayra kullah, nashkuruka wa la nakfuruk, wa nakhla\'u wa natruku man yafjuruk. Allahumma iyyaka na\'budu wa laka nusalli wa nasjud, wa ilayka nas\'a wa nahfid, narju rahmataka wa nakhsha \'adhabak, inna \'adhabaka l-jidda bi-l-kuffari mulhiq.',
    nl:'Allah, wij vragen U om hulp en om vergeving, wij geloven in U en vertrouwen op U, en wij prijzen U met al het goede. Wij danken U en verloochenen U niet. Allah, U alleen aanbidden wij, voor U bidden en knielen wij, naar U streven wij, wij hopen op Uw barmhartigheid en vrezen Uw straf.'},

  /* ---- de gebeden die niet elke dag terugkomen ---- */
  /* De takbir van het feest. In de Maghrebijnse moskeeën zing je hem op weg naar
     het feestgebed, en na de gebeden in de dagen van het offerfeest. */
  takbirEid:{aid:'t:takbir-eid',
    ar:'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    tr:'Allahu akbar, Allahu akbar, Allahu akbar, la ilaha illa llah, wallahu akbar, Allahu akbar, wa lillahi l-hamd',
    uit:'al-LAA-hoe AK-bar (3×) · laa i-LAA-ha il-la l-LAAH · wal-LAA-hoe AK-bar, al-LAA-hoe AK-bar, wa lil-LAA-hi l-HAMD',
    nl:'Allah is groter, Allah is groter, Allah is groter. Er is geen god dan Allah. Allah is groter, Allah is groter, en aan Allah komt de lof toe.'},

  /* Het gebed bij een overledene kent geen buiging en geen knieval: het ís de
     du'a. Deze staat bij Muslim, van Awf ibn Malik, die zei dat hij hem zo mooi
     vond dat hij wenste dat hij zelf die overledene was. */
  janazaDua:{aid:'t:janaza',
    ar:'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ',
    tr:'Allahumma ghfir lahu warhamh, wa \'afihi wa\'fu \'anh, wa akrim nuzulah, wa wassi\' mudkhalah, waghsilhu bi-l-ma\'i wa th-thalji wa l-barad, wa naqqihi mina l-khataya kama naqqayta th-thawba l-abyada mina d-danas',
    nl:'Allah, vergeef hem en heb erbarmen met hem, spaar hem en scheld hem kwijt. Ontvang hem gastvrij en maak zijn plaats ruim. Was hem met water, sneeuw en hagel, en maak hem schoon van fouten zoals U een wit kleed van vuil schoonmaakt.'},
  janazaKind:{aid:'t:janaza-kind',
    ar:'اللَّهُمَّ اجْعَلْهُ فَرَطًا وَذُخْرًا لِوَالِدَيْهِ، وَشَفِيعًا مُجَابًا',
    tr:'Allahumma j\'alhu faratan wa dhukhran li-walidayh, wa shafi\'an mujaba',
    uit:'al-LAA-hoem-ma DJ‘AL-hoe FA-ra-tan wa DZOEKH-ran li-waa-li-DAYH, wa sja-FIE-‘an moe-DJAA-baa',
    nl:'Allah, maak hem tot iemand die vooruitgaat en tot een schat voor zijn ouders, en tot een voorspreker die verhoord wordt.'},

  /* Wat je zegt zodra je het slechte nieuws hoort — de woorden staan in de Koran
     zelf (2:156), en de tweede du'a leerde de Profeet ﷺ aan Umm Salama. */
  istirja:{aid:'t:istirja', ar:'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',
    tr:'Inna lillahi wa inna ilayhi raji\'un', uit:'IN-naa lil-LAA-hi wa IN-naa i-LAY-hi RAA-dji-‘oen',
    nl:'Wij zijn van Allah en tot Hem keren wij terug'},
  duaMusiba:{aid:'t:musiba', ar:'اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي، وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
    tr:'Allahumma jurni fi musibati, wa akhlif li khayran minha',
    uit:'al-LAA-hoem-ma DJOER-nie fie moe-SIE-ba-tie, wa AKH-lif lie GHAY-ran MIN-haa',
    nl:'Allah, beloon mij in mijn verdriet en geef mij iets beters ervoor terug'},
  taziya:{aid:'t:taziya', ar:'أَعْظَمَ اللَّهُ أَجْرَكَ، وَأَحْسَنَ عَزَاءَكَ، وَغَفَرَ لِمَيِّتِكَ',
    tr:'A\'zama llahu ajrak, wa ahsana \'aza\'ak, wa ghafara li-mayyitik',
    uit:'A‘-dha-ma l-LAA-hoe AJ-rak, wa AH-sa-na ‘a-ZAA-‘ak, wa GHA-fa-ra li-MAY-yi-tik',
    nl:'Moge Allah je beloning groot maken, je troost mooi maken en je overledene vergeven'},
  bijGraf:{aid:'t:bij-graf', ar:'بِسْمِ اللَّهِ وَعَلَىٰ مِلَّةِ رَسُولِ اللَّهِ',
    tr:'Bismillahi wa \'ala millati rasuli llah', uit:'BIS-mil-LAAH wa ‘a-LAA MIL-la-ti ra-SOE-li l-LAAH',
    nl:'In de naam van Allah en op de weg van de boodschapper van Allah'},
  groetGraf:{aid:'t:groet-graf',
    ar:'السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ، نَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ',
    tr:'As-salamu \'alaykum ahla d-diyari mina l-mu\'minina wa l-muslimin, wa inna in sha\'a llahu bikum lahiqun, nas\'alu llaha lana wa lakumu l-\'afiya',
    nl:'Vrede zij met jullie, bewoners van deze plaats, gelovigen en moslims. En wij komen, als Allah het wil, achter jullie aan. Wij vragen Allah om welzijn voor ons en voor jullie.'},

  istikhara:{aid:'t:istikhara',
    ar:'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ وَتَعْلَمُ وَلَا أَعْلَمُ وَأَنْتَ عَلَّامُ الْغُيُوبِ. اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَٰذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّهُ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ ثُمَّ أَرْضِنِي بِهِ',
    tr:'Allahumma inni astakhiruka bi-\'ilmik, wa astaqdiruka bi-qudratik, wa as\'aluka min fadlika l-\'azim, fa-innaka taqdiru wa la aqdir, wa ta\'lamu wa la a\'lam, wa anta \'allamu l-ghuyub. Allahumma in kunta ta\'lamu anna hadha l-amra khayrun li fi dini wa ma\'ashi wa \'aqibati amri fa-qdurhu li wa yassirhu li thumma barik li fih. Wa in kunta ta\'lamu annahu sharrun li fi dini wa ma\'ashi wa \'aqibati amri fa-srifhu \'anni wa-srifni \'anh, wa-qdur liya l-khayra haythu kan, thumma ardini bih.',
    nl:'Allah, ik vraag U om het goede te kiezen met Uw kennis, en om kracht met Uw macht, en ik vraag U van Uw grote gunst. U kunt en ik kan niet, U weet en ik weet niet, en U kent het verborgene. Allah, als U weet dat deze zaak goed voor mij is in mijn geloof, mijn leven en mijn toekomst, breng haar dan bij mij, maak haar makkelijk voor mij en zegen haar. En als U weet dat zij slecht voor mij is in mijn geloof, mijn leven en mijn toekomst, houd haar dan bij mij weg en mij bij haar, en breng mij het goede, waar het ook is, en maak mij daar tevreden mee.'},

  istisqa:{aid:'t:istisqa',
    ar:'اللَّهُمَّ اسْقِنَا غَيْثًا مُغِيثًا مَرِيئًا مَرِيعًا، نَافِعًا غَيْرَ ضَارٍّ، عَاجِلًا غَيْرَ آجِلٍ',
    tr:'Allahumma sqina ghaythan mughithan mari\'an mari\'an, nafi\'an ghayra darr, \'ajilan ghayra ajil',
    nl:'Allah, geef ons regen die helpt, die goed is om te drinken en het land vruchtbaar maakt; die baat en geen schade brengt, en die nu komt en niet later.'}
};
