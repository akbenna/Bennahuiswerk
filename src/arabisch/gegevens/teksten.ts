import type { Tekst } from './soorten'


/* ============================================================
   TEKSTEN — leesteksten, oplopend van drie woorden tot een alinea
   ------------------------------------------------------------
   id     stabiele sleutel
   n2     niveau 1-4
   titel  Nederlandse titel
   ar     de tekst, gevocaliseerd; \n scheidt regels
   nl     vertaling, regel voor regel gelijk opgebouwd
   gloss  woorden die achter een tik verschijnen: [arabisch, nederlands]
          (glossen staan bewust niet standaard in beeld — zie de
          didactische verantwoording in de app)
   vraag  begripsvraag met opties en uitleg
   ============================================================ */
export const TEKSTEN: Tekst[] = [
{id:'t-01',n2:1,titel:'Dit is een huis',
 ar:'هٰذَا بَيْتٌ.\nالْبَيْتُ كَبِيرٌ.\nفِي الْبَيْتِ بَابٌ.',
 nl:'Dit is een huis.\nHet huis is groot.\nIn het huis is een deur.',
 gloss:[['هٰذَا','dit'],['بَيْت','huis'],['كَبِير','groot'],['بَاب','deur']],
 vraag:{v:'Wat staat er over het huis?',o:['Het is klein','Het is groot','Het is nieuw','Het is wit'],j:1,u:'الْبَيْتُ كَبِيرٌ — het huis is groot. Let op: bepaald plus onbepaald, dus een bewering.'}},

{id:'t-02',n2:1,titel:'De kat en de muis',
 ar:'الْقِطُّ صَغِيرٌ.\nالْفَأْرُ صَغِيرٌ أَيْضًا.\nالْقِطُّ يَجْرِي وَالْفَأْرُ يَجْرِي.',
 nl:'De kat is klein.\nDe muis is ook klein.\nDe kat rent en de muis rent.',
 gloss:[['قِطّ','kat'],['فَأْر','muis'],['صَغِير','klein'],['أَيْضًا','ook'],['يَجْرِي','hij rent']],
 vraag:{v:'Wie rent er?',o:['Alleen de kat','Alleen de muis','Allebei','Niemand'],j:2,u:'الْقِطُّ يَجْرِي وَالْفَأْرُ يَجْرِي — allebei rennen ze. De و verbindt de twee zinnen.'}},

{id:'t-03',n2:1,titel:'Mijn familie',
 ar:'هٰذَا أَبِي وَهٰذِهِ أُمِّي.\nلِي أَخٌ وَأُخْتٌ.\nنَحْنُ أُسْرَةٌ سَعِيدَةٌ.',
 nl:'Dit is mijn vader en dit is mijn moeder.\nIk heb een broer en een zus.\nWij zijn een gelukkig gezin.',
 gloss:[['أَبِي','mijn vader'],['أُمِّي','mijn moeder'],['أَخ','broer'],['أُخْت','zus'],['أُسْرَة','gezin']],
 vraag:{v:'Hoeveel kinderen zijn er in het gezin, de verteller meegerekend?',o:['Eén','Twee','Drie','Vier'],j:2,u:'De verteller heeft een broer en een zus: drie kinderen in totaal.'}},

{id:'t-04',n2:1,titel:'In de tuin',
 ar:'فِي الْحَدِيقَةِ شَجَرَةٌ.\nتَحْتَ الشَّجَرَةِ قِطٌّ.\nالشَّمْسُ فِي السَّمَاءِ وَالْجَوُّ جَمِيلٌ.',
 nl:'In de tuin staat een boom.\nOnder de boom zit een kat.\nDe zon staat aan de hemel en het weer is mooi.',
 gloss:[['حَدِيقَة','tuin'],['شَجَرَة','boom'],['تَحْتَ','onder'],['سَمَاء','hemel'],['جَوّ','weer']],
 vraag:{v:'Waar zit de kat?',o:['In de boom','Onder de boom','Op het huis','In de zon'],j:1,u:'تَحْتَ الشَّجَرَةِ — onder de boom. Merk op dat na het voorzetsel تَحْتَ de genitief volgt.'}},

{id:'t-05',n2:2,titel:'Een dag op school',
 ar:'أَذْهَبُ إِلَى الْمَدْرَسَةِ فِي الصَّبَاحِ.\nأَحْمِلُ حَقِيبَتِي وَفِيهَا كُتُبٌ وَأَقْلَامٌ.\nالْمُعَلِّمَةُ تَكْتُبُ عَلَى السَّبُّورَةِ وَنَحْنُ نَقْرَأُ.\nبَعْدَ الدَّرْسِ أَلْعَبُ مَعَ أَصْدِقَائِي فِي السَّاحَةِ.',
 nl:'Ik ga \'s ochtends naar school.\nIk draag mijn tas en daarin zitten boeken en pennen.\nDe lerares schrijft op het bord en wij lezen.\nNa de les speel ik met mijn vrienden op het plein.',
 gloss:[['أَذْهَبُ','ik ga'],['حَقِيبَة','tas'],['أَقْلَام','pennen'],['سَبُّورَة','schoolbord'],['سَاحَة','plein'],['بَعْدَ','na']],
 vraag:{v:'Wat gebeurt er ná de les?',o:['De lerares schrijft','Hij gaat naar huis','Hij speelt op het plein','Hij leest een boek'],j:2,u:'بَعْدَ الدَّرْسِ أَلْعَبُ — na de les speelt hij, met zijn vrienden op het plein.'}},

{id:'t-06',n2:2,titel:'De markt',
 ar:'ذَهَبَتْ أُمِّي إِلَى السُّوقِ يَوْمَ الْجُمُعَةِ.\nاِشْتَرَتْ خُبْزًا وَزَيْتُونًا وَتُفَّاحًا.\nكَانَ السُّوقُ مَلِيئًا بِالنَّاسِ.\nقَالَتْ أُمِّي: الْأَسْعَارُ غَالِيَةٌ هٰذَا الْأُسْبُوعَ.',
 nl:'Mijn moeder ging op vrijdag naar de markt.\nZij kocht brood, olijven en appels.\nDe markt zat vol mensen.\nMijn moeder zei: de prijzen zijn duur deze week.',
 gloss:[['سُوق','markt'],['اِشْتَرَتْ','zij kocht'],['مَلِيء','vol'],['أَسْعَار','prijzen'],['غَالِي','duur']],
 vraag:{v:'Wat vond de moeder van de prijzen?',o:['Goedkoop','Duur','Normaal','Dat zegt de tekst niet'],j:1,u:'الْأَسْعَارُ غَالِيَةٌ — de prijzen zijn duur. Let op de vrouwelijke vorm غَالِيَةٌ bij een meervoud van zaken.'}},

{id:'t-07',n2:2,titel:'De vier seizoenen',
 ar:'فِي الرَّبِيعِ تَتَفَتَّحُ الْأَزْهَارُ وَالْجَوُّ لَطِيفٌ.\nفِي الصَّيْفِ الشَّمْسُ قَوِيَّةٌ وَالْأَيَّامُ طَوِيلَةٌ.\nفِي الْخَرِيفِ تَسْقُطُ أَوْرَاقُ الشَّجَرِ.\nوَفِي الشِّتَاءِ يَنْزِلُ الْمَطَرُ وَأَحْيَانًا الثَّلْجُ.',
 nl:'In de lente gaan de bloemen open en is het weer aangenaam.\nIn de zomer is de zon sterk en zijn de dagen lang.\nIn de herfst vallen de bladeren van de bomen.\nEn in de winter valt de regen en soms de sneeuw.',
 gloss:[['رَبِيع','lente'],['صَيْف','zomer'],['خَرِيف','herfst'],['شِتَاء','winter'],['تَسْقُطُ','zij vallen'],['أَوْرَاق','bladeren']],
 vraag:{v:'Wat gebeurt er in de herfst?',o:['De bloemen openen','De bladeren vallen','Het sneeuwt','De dagen worden lang'],j:1,u:'تَسْقُطُ أَوْرَاقُ الشَّجَرِ — de bladeren van de bomen vallen. أَوْرَاقُ الشَّجَرِ is een idafa.'}},

{id:'t-08',n2:2,titel:'De vlijtige mier',
 ar:'رَأَتِ النَّمْلَةُ حَبَّةَ قَمْحٍ فِي الطَّرِيقِ.\nحَمَلَتْهَا إِلَى بَيْتِهَا تَحْتَ الْأَرْضِ.\nقَالَ لَهَا الْجُنْدُبُ: لِمَاذَا تَتْعَبِينَ فِي الصَّيْفِ؟\nقَالَتِ النَّمْلَةُ: لِأَنَّ الشِّتَاءَ قَادِمٌ.',
 nl:'De mier zag een graankorrel op de weg.\nZij droeg hem naar haar huis onder de grond.\nDe sprinkhaan zei tegen haar: waarom zwoeg je in de zomer?\nDe mier zei: omdat de winter eraan komt.',
 gloss:[['نَمْلَة','mier'],['حَبَّة','korrel'],['قَمْح','graan'],['جُنْدُب','sprinkhaan'],['تَتْعَبِينَ','zwoeg jij (v)'],['قَادِم','komend']],
 vraag:{v:'Waarom werkt de mier in de zomer?',o:['Omdat zij honger heeft','Omdat de winter eraan komt','Omdat de sprinkhaan het vraagt','Omdat het warm is'],j:1,u:'لِأَنَّ الشِّتَاءَ قَادِمٌ — omdat de winter komt. Let op de accusatief na لِأَنَّ.'}},

{id:'t-09',n2:3,titel:'Brief aan mijn grootvader',
 ar:'جَدِّي الْعَزِيزُ،\nكَتَبْتُ إِلَيْكَ هٰذِهِ الرِّسَالَةَ بِالْعَرَبِيَّةِ لِأَنَّنِي بَدَأْتُ أَتَعَلَّمُ اللُّغَةَ.\nلَمْ يَكُنِ الْأَمْرُ سَهْلًا فِي الْبِدَايَةِ، وَلٰكِنِّي أَتَقَدَّمُ قَلِيلًا كُلَّ يَوْمٍ.\nأَتَمَنَّى أَنْ أَتَكَلَّمَ مَعَكَ بِالْعَرَبِيَّةِ عِنْدَمَا أَزُورُكَ فِي الصَّيْفِ.\nحَفِيدُكَ الَّذِي يُحِبُّكَ.',
 nl:'Mijn lieve opa,\nIk heb u deze brief in het Arabisch geschreven omdat ik ben begonnen de taal te leren.\nHet was in het begin niet makkelijk, maar ik ga elke dag een beetje vooruit.\nIk hoop met u Arabisch te spreken wanneer ik u in de zomer bezoek.\nUw kleinzoon die van u houdt.',
 gloss:[['عَزِيز','lief, dierbaar'],['رِسَالَة','brief'],['بِدَايَة','begin'],['أَتَقَدَّمُ','ik ga vooruit'],['أَتَمَنَّى','ik hoop'],['حَفِيد','kleinzoon']],
 vraag:{v:'Wat hoopt de schrijver?',o:['Een brief terug','In de zomer Arabisch met zijn opa te spreken','Naar Marokko te verhuizen','De taal snel af te ronden'],j:1,u:'أَتَمَنَّى أَنْ أَتَكَلَّمَ مَعَكَ بِالْعَرَبِيَّةِ — hij hoopt Arabisch met hem te spreken tijdens het bezoek.'}},

{id:'t-10',n2:3,titel:'De arts en de patiënt',
 ar:'دَخَلَ الرَّجُلُ عِيَادَةَ الطَّبِيبِ وَهُوَ يَضَعُ يَدَهُ عَلَى بَطْنِهِ.\nسَأَلَهُ الطَّبِيبُ: مُنْذُ مَتَى تَشْعُرُ بِالْأَلَمِ؟\nقَالَ الرَّجُلُ: مُنْذُ ثَلَاثَةِ أَيَّامٍ، وَلَمْ أَسْتَطِعِ النَّوْمَ.\nفَحَصَهُ الطَّبِيبُ ثُمَّ قَالَ: لَيْسَ الْأَمْرُ خَطِيرًا، وَلٰكِنْ يَجِبُ أَنْ تَسْتَرِيحَ.',
 nl:'De man kwam de praktijk van de arts binnen terwijl hij zijn hand op zijn buik hield.\nDe arts vroeg hem: sinds wanneer voelt u de pijn?\nDe man zei: sinds drie dagen, en ik heb niet kunnen slapen.\nDe arts onderzocht hem en zei toen: het is niet ernstig, maar u moet rusten.',
 gloss:[['عِيَادَة','praktijk, spreekkamer'],['يَضَعُ','hij legt'],['مُنْذُ','sinds'],['تَشْعُرُ','jij voelt'],['فَحَصَ','hij onderzocht'],['تَسْتَرِيحَ','jij rust'],['خَطِير','ernstig']],
 vraag:{v:'Wat is het oordeel van de arts?',o:['Het is ernstig','Het is niet ernstig, maar hij moet rusten','Hij moet naar het ziekenhuis','Hij heeft niets'],j:1,u:'لَيْسَ الْأَمْرُ خَطِيرًا، وَلٰكِنْ يَجِبُ أَنْ تَسْتَرِيحَ. Let op لَيْسَ met de accusatief خَطِيرًا.'}},

{id:'t-11',n2:3,titel:'Een reis naar Marokko',
 ar:'سَافَرْنَا فِي الصَّيْفِ الْمَاضِي إِلَى الْمَغْرِبِ.\nوَصَلَتِ الطَّائِرَةُ إِلَى مَطَارِ الدَّارِ الْبَيْضَاءِ فِي الْمَسَاءِ.\nثُمَّ أَخَذْنَا الْقِطَارَ إِلَى فَاسَ، وَهِيَ مَدِينَةٌ قَدِيمَةٌ فِيهَا أَقْدَمُ جَامِعَةٍ فِي الْعَالَمِ.\nمَشَيْنَا فِي أَزِقَّةِ الْمَدِينَةِ الْقَدِيمَةِ وَشَرِبْنَا الشَّايَ بِالنَّعْنَاعِ.\nلَنْ أَنْسَى تِلْكَ الرِّحْلَةَ أَبَدًا.',
 nl:'Wij reisden afgelopen zomer naar Marokko.\nHet vliegtuig kwam \'s avonds aan op de luchthaven van Casablanca.\nDaarna namen wij de trein naar Fez, een oude stad met de oudste universiteit ter wereld.\nWij liepen door de steegjes van de oude stad en dronken muntthee.\nIk zal die reis nooit vergeten.',
 gloss:[['الدَّار الْبَيْضَاء','Casablanca (letterlijk: het witte huis)'],['أَقْدَم','oudste'],['جَامِعَة','universiteit'],['أَزِقَّة','steegjes'],['نَعْنَاع','munt'],['رِحْلَة','reis']],
 vraag:{v:'Wat is er bijzonder aan Fez volgens de tekst?',o:['Het is de hoofdstad','Er staat de oudste universiteit ter wereld','Er is een luchthaven','Het ligt aan zee'],j:1,u:'فِيهَا أَقْدَمُ جَامِعَةٍ فِي الْعَالَمِ — de al-Qarawiyyin, gesticht in 859.'}},

{id:'t-12',n2:3,titel:'Het huis van mijn grootmoeder',
 ar:'بَيْتُ جَدَّتِي فِي قَرْيَةٍ صَغِيرَةٍ قُرْبَ الْجَبَلِ.\nلِلْبَيْتِ بَابٌ خَشَبِيٌّ قَدِيمٌ وَفِنَاءٌ فِي الْوَسَطِ.\nكُنَّا نَجْلِسُ فِي الْفِنَاءِ بَعْدَ الْغُرُوبِ وَنَسْتَمِعُ إِلَى قِصَصِ جَدَّتِي.\nكَانَتْ تَحْكِي عَنْ زَمَانٍ لَمْ نَعْرِفْهُ، وَكُنَّا نُصْغِي دُونَ أَنْ نَتَكَلَّمَ.',
 nl:'Het huis van mijn oma staat in een klein dorp bij de berg.\nHet huis heeft een oude houten deur en een binnenplaats in het midden.\nWij zaten na zonsondergang op de binnenplaats en luisterden naar de verhalen van mijn oma.\nZij vertelde over een tijd die wij niet kenden, en wij luisterden zonder te spreken.',
 gloss:[['قُرْب','bij, nabij'],['خَشَبِيّ','houten'],['فِنَاء','binnenplaats'],['غُرُوب','zonsondergang'],['تَحْكِي','zij vertelt'],['نُصْغِي','wij luisteren aandachtig']],
 vraag:{v:'Wat betekent كُنَّا نَجْلِسُ ?',o:['Wij zaten (gewoonte in het verleden)','Wij zullen zitten','Wij zitten','Wij gingen zitten (één keer)'],j:0,u:'كَانَ plus imperfectum drukt een herhaalde handeling in het verleden uit: "wij zaten altijd".'}},

{id:'t-13',n2:4,titel:'Over de wortel van het woord',
 ar:'يَقُومُ الْمُعْجَمُ الْعَرَبِيُّ عَلَى فِكْرَةٍ بَسِيطَةٍ وَعَمِيقَةٍ فِي آنٍ وَاحِدٍ: أَنَّ الْكَلِمَاتِ لَيْسَتْ وَحَدَاتٍ مُنْفَصِلَةً بَلْ تَنْبُتُ مِنْ جُذُورٍ.\nفَالْجَذْرُ ك-ت-ب يَحْمِلُ مَعْنَى الْكِتَابَةِ، وَمِنْهُ يَتَفَرَّعُ الْكَاتِبُ وَالْمَكْتُوبُ وَالْمَكْتَبُ وَالْمَكْتَبَةُ وَالْكِتَابُ.\nوَلِهٰذَا فَإِنَّ مَنْ يَحْفَظُ الْجُذُورَ يَفْهَمُ أَكْثَرَ مِمَّا حَفِظَ، وَهٰذَا مَا يُمَيِّزُ الْعَرَبِيَّةَ عَنْ كَثِيرٍ مِنَ اللُّغَاتِ.',
 nl:'Het Arabische woordenboek berust op een gedachte die tegelijk eenvoudig en diepzinnig is: dat woorden geen losse eenheden zijn maar uit wortels ontspruiten.\nDe wortel k-t-b draagt de betekenis van het schrijven, en daaruit vertakken zich de schrijver, het geschrevene, het bureau, de bibliotheek en het boek.\nDaarom begrijpt wie de wortels onthoudt meer dan hij heeft onthouden, en dit onderscheidt het Arabisch van veel andere talen.',
 gloss:[['مُعْجَم','woordenboek'],['فِكْرَة','gedachte, idee'],['عَمِيق','diep'],['تَنْبُتُ','zij ontspruiten'],['جُذُور','wortels'],['يَتَفَرَّعُ','het vertakt zich'],['يُمَيِّزُ','het onderscheidt']],
 vraag:{v:'Wat is de kerngedachte van de tekst?',o:['Arabisch is moeilijk','Woorden groeien uit wortels','Woordenboeken zijn onmisbaar','Schrijven is belangrijk'],j:1,u:'Het woordenboek berust op de gedachte dat woorden uit wortels ontspruiten — en wie de wortel kent, begrijpt meer woorden dan hij heeft geleerd.'}},

{id:'t-14',n2:4,titel:'De geneeskunde bij Ibn Sina',
 ar:'وُلِدَ ابْنُ سِينَا فِي بُخَارَى سَنَةَ سَبْعِينَ وَثَلَاثِمِائَةٍ لِلْهِجْرَةِ، وَاشْتَهَرَ فِي الشَّرْقِ وَالْغَرْبِ بِكِتَابِهِ «الْقَانُونُ فِي الطِّبِّ».\nظَلَّ هٰذَا الْكِتَابُ يُدَرَّسُ فِي جَامِعَاتِ أُورُوبَّا قُرُونًا طَوِيلَةً بَعْدَ وَفَاتِهِ.\nوَكَانَ ابْنُ سِينَا يَرَى أَنَّ الطَّبِيبَ لَا يُعَالِجُ الْمَرَضَ وَحْدَهُ بَلْ يُعَالِجُ الْإِنْسَانَ كُلَّهُ، وَهِيَ فِكْرَةٌ لَمْ تَفْقِدْ قِيمَتَهَا إِلَى الْيَوْمِ.',
 nl:'Ibn Sina werd geboren in Bukhara in het jaar 370 van de hidjra, en werd in Oost en West beroemd door zijn boek "De Canon van de geneeskunde".\nDit boek werd nog eeuwen na zijn dood aan Europese universiteiten onderwezen.\nIbn Sina meende dat de arts niet de ziekte alleen behandelt maar de hele mens, een gedachte die tot op de dag van vandaag haar waarde niet heeft verloren.',
 gloss:[['وُلِدَ','hij werd geboren (passief)'],['اِشْتَهَرَ','hij werd beroemd'],['ظَلَّ','hij bleef'],['يُدَرَّسُ','het wordt onderwezen (passief)'],['وَفَاة','overlijden'],['يُعَالِجُ','hij behandelt'],['قِيمَة','waarde']],
 vraag:{v:'Welke opvatting van Ibn Sina noemt de tekst?',o:['Dat de arts vooral moet lezen','Dat de arts de hele mens behandelt, niet alleen de ziekte','Dat geneeskunde een wetenschap is','Dat Europa van hem leerde'],j:1,u:'لَا يُعَالِجُ الْمَرَضَ وَحْدَهُ بَلْ يُعَالِجُ الْإِنْسَانَ كُلَّهُ. Let op de twee passieven in de tekst: وُلِدَ en يُدَرَّسُ.'}},

{id:'t-15',n2:4,titel:'Waarom een taal leren',
 ar:'قِيلَ قَدِيمًا إِنَّ مَنْ تَعَلَّمَ لُغَةَ قَوْمٍ أَمِنَ مَكْرَهُمْ، وَلٰكِنَّ الْأَمْرَ أَوْسَعُ مِنْ ذٰلِكَ.\nفَاللُّغَةُ لَيْسَتْ مَجْمُوعَةَ كَلِمَاتٍ تُتَرْجَمُ، بَلْ طَرِيقَةٌ فِي رُؤْيَةِ الْعَالَمِ.\nوَمَنْ يَتَعَلَّمُ لُغَةَ أَجْدَادِهِ لَا يَكْتَسِبُ أَدَاةً جَدِيدَةً فَحَسْبُ، بَلْ يَسْتَعِيدُ صِلَةً كَانَتْ عَلَى وَشَكِ الِانْقِطَاعِ.\nوَلَيْسَ فِي ذٰلِكَ حَنِينٌ إِلَى الْمَاضِي بِقَدْرِ مَا فِيهِ اخْتِيَارٌ لِلْمُسْتَقْبَلِ.',
 nl:'Vanouds werd gezegd dat wie de taal van een volk leert, veilig is voor hun list — maar de zaak reikt verder dan dat.\nEen taal is niet een verzameling woorden die vertaald wordt, maar een manier om de wereld te zien.\nEn wie de taal van zijn voorouders leert, verwerft niet alleen een nieuw werktuig, maar herstelt een band die op het punt stond te breken.\nDaarin schuilt niet zozeer heimwee naar het verleden als wel een keuze voor de toekomst.',
 gloss:[['قِيلَ','er werd gezegd (passief)'],['مَكْر','list'],['أَوْسَع','ruimer'],['رُؤْيَة','het zien, visie'],['يَكْتَسِبُ','hij verwerft'],['يَسْتَعِيدُ','hij herwint'],['صِلَة','band'],['اِنْقِطَاع','breuk'],['حَنِين','heimwee']],
 vraag:{v:'Wat stelt de laatste zin?',o:['Het gaat om heimwee','Het gaat meer om een keuze voor de toekomst dan om heimwee','Het verleden is belangrijker','Talen leren is nutteloos'],j:1,u:'لَيْسَ فِي ذٰلِكَ حَنِينٌ ... بِقَدْرِ مَا فِيهِ اخْتِيَارٌ لِلْمُسْتَقْبَلِ — niet zozeer heimwee als wel een keuze voor de toekomst.'}}
];
