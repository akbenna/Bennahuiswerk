import type { Gebed, Gebedstap, Naast, Nafila, Soortdeel } from './soorten'

/* Drie soorten: wat moet, wat sterk aanbevolen is, en wat ná de slotgroet komt
   en dus strikt genomen niet meer bij het gebed hoort. */
export const etiket = (s: Soortdeel | string): string => s==='fard' ? 'Moet' : s==='na' ? 'Na het gebed' : 'Sunna';

export const STAPPEN: Gebedstap[] = [
 {k:'iqama', t:'De iqama', h:'staan', merk:null, soort:'sunna', zeg:'iqama',
  doe:['Ga staan met je gezicht naar de qibla, vóór je aan het gebed begint.','Zeg de tien zinnen hardop, of zachtjes als je alleen bidt.','Bij "qad qamati s-salah" sta je klaar; daarna begin je met de intentie en de takbir.'],
  let:'De iqama hoort bij de vijf verplichte gebeden, ook als je alleen thuis bidt — dan mag hij zacht. Bij een vrijwillig gebed en bij de witr zeg je hem niet. In de Malikitische school is de iqama <b>enkel</b>: elke zin één keer, alleen de takbir twee keer, en "qad qamati s-salah" ook maar één keer. Andere scholen verdubbelen; dat hoor je in sommige moskeeën. Het roepen is in deze school aan de mannen; meeleren mag iedereen.'},
 {k:'niyyah', t:'Intentie en staan', h:'staan', merk:null, soort:'fard',
  doe:['Sta recht, met je voeten stevig op de grond en je gezicht naar de qibla.','Weet in je hart welk gebed je gaat bidden. Niets hardop.','Kijk naar de plek waar je hoofd straks komt.']},
 {k:'takbir', t:'De openingstakbir', h:'takbir', merk:[131,60,24], soort:'fard', zeg:'takbir',
  doe:['Hef je handen tot ongeveer schouderhoogte, met je handpalmen naar voren.','Zeg: Allahu akbar.','Vanaf dit moment ben je in het gebed: niet meer praten, niet omkijken.'],
  let:'In de Malikitische school hef je je handen alleen hier — niet bij de latere takbirs.'},
 {k:'fatiha', t:'Staan en lezen', h:'staan', merk:null, soort:'fard', zeg:'fatiha',
  doe:['Laat je armen langs je lichaam hangen (sadl); de armen over elkaar (qabd) is binnen de school ook overgeleverd.','Lees al-Fatiha. Zonder al-Fatiha telt de rak\'a niet.','Zeg daarna zachtjes: āmīn.','In de eerste twee rak\'a lees je er een soera achteraan.'],
  let:'In deze school begin je meteen met al-Fatiha: geen openingsdu\'a en geen a\'udhu billah in het verplichte gebed, en de basmala wordt niet hardop gezegd.'},
 {k:'soera', t:'Een soera lezen', h:'staan', merk:null, soort:'sunna',
  doe:['Meteen na al-Fatiha, zonder pauze en zonder opnieuw takbir te zeggen.','Lees een soera die je uit je hoofd kent — helemaal, van de eerste tot de laatste regel.','In de eerste twee rak\'a doe je dit; in de derde en vierde alleen al-Fatiha.','Bij Fajr, en in de eerste twee rak\'a van Maghrib en Isha, lees je hardop.'],
  let:'Dit is sunna mu\'akkada: sterk aanbevolen, maar je gebed is geldig zonder. Al-Fatiha is dat níet — zonder al-Fatiha telt de rak\'a niet mee. Een korte soera die je goed kent is beter dan een lange waar je in vastloopt.'},
 {k:'qunut', t:'De qunut', h:'staan', merk:null, soort:'sunna', zeg:'qunut',
  doe:['Alleen in de Fajr, in de tweede rak\'a, ná het lezen en vóór de buiging.','Zeg hem zachtjes, ook als het gebed verder hardop is.','Je handen hoef je er niet voor op te heffen.'],
  let:'In de Malikitische school hoort de qunut bij de Fajr en nergens anders. Sterk aanbevolen, geen plicht: vergeet je hem, dan is je gebed gewoon geldig en hoef je niets te herstellen.'},
 {k:'ruku', t:'De buiging', h:'ruku', merk:[178,130,30], soort:'fard', zeg:'ruku',
  doe:['Zeg Allahu akbar en buig.','Je rug wordt vlak, je handen pakken je knieën, je vingers gespreid.','Je hoofd is in lijn met je rug, niet omhoog en niet omlaag.','Kom pas overeind als je echt tot rust bent gekomen.']},
 {k:'itidal', t:'Rechtop komen', h:'staan', merk:null, soort:'fard', zeg:'sami', zeg2:'rabbana',
  doe:['Kom omhoog en zeg: sami\'a llahu liman hamidah.','Sta helemaal recht en zeg: rabbana wa laka l-hamd.','Blijf even staan. Rust hoort erbij.']},
 {k:'sujud1', t:'De knieval', h:'sujud', merk:[214,196,26], soort:'fard', zeg:'sujud',
  doe:['Zeg Allahu akbar en ga naar de grond.','Zeven delen raken de grond: je voorhoofd, je twee handpalmen, je twee knieën en de tenen van je twee voeten. Ook je neus raakt de grond.','Je armen liggen niet plat: houd je ellebogen van de grond en van je zij af.','Dit is het moment waarop je het dichtst bij Allah bent — vraag hier wat je wilt.']},
 {k:'jalsa', t:'Zitten tussen de twee knievallen', h:'zitten', merk:null, soort:'fard', zeg:'jalsa',
  doe:['Zeg Allahu akbar en kom overeind tot zitten.','Zit rustig, met je handen op je bovenbenen.','Zeg: rabbi ghfir li — Heer, vergeef mij.']},
 {k:'sujud2', t:'De tweede knieval', h:'sujud', merk:[214,196,26], soort:'fard', zeg:'sujud',
  doe:['Zeg Allahu akbar en ga opnieuw naar de grond.','Precies zoals de eerste keer.','Hierna is de rak\'a compleet.']},
 {k:'opstaan', t:'Opstaan voor de volgende rak\'a', h:'staan', merk:null, soort:'fard',
  doe:['Zeg Allahu akbar terwijl je opstaat.','Sta rechtop en begin opnieuw met al-Fatiha.']},
 {k:'tashahhud', t:'Het zitten en de tashahhud', h:'zitten', merk:null, soort:'sunna', zeg:'tashahhud',
  doe:['Ga zitten, je linkervoet plat onder je door en je rechtervoet rechtop met de tenen naar de qibla.','Je linkerhand ligt op je linkerbeen, je rechterhand op je rechterbeen.','Wijs met je wijsvinger en beweeg hem rustig van links naar rechts.','Zeg de tashahhud.'],
  let:'In de Malikitische school wordt deze woordkeuze aangehouden (de tashahhud van \'Umar, uit de Muwatta\'). Andere scholen gebruiken een iets andere formulering; beide zijn overgeleverd.'},
 {k:'salawat', t:'Zegenwens over de Profeet ﷺ', h:'zitten', merk:null, soort:'sunna', zeg:'salawat',
  doe:['In de laatste zitting, na de tashahhud.','Daarna mag je vragen wat je wilt, voordat je de slotgroet geeft.']},
 {k:'dua', t:'Vragen vóór de slotgroet', h:'zitten', merk:null, soort:'sunna', zeg:'duaVoorSalam',
  doe:['Nog steeds in de laatste zitting, ná de zegenwens.','Zeg de du\'a hieronder, of vraag in je eigen woorden wat je wilt.','Dit is het laatste rustige moment vóór je uit het gebed stapt — gebruik het.'],
  let:'Dit is geen plicht. De Profeet ﷺ leerde deze du\'a aan zoals hij een soera aanleerde, en hij past precies op deze plek. Je eigen woorden mogen ook, in welke taal dan ook.'},
 {k:'salam', t:'De slotgroet', h:'salam', merk:null, soort:'fard', zeg:'salam',
  doe:['Draai je hoofd naar rechts en zeg: as-salamu \'alaykum.','Daarmee is het gebed klaar.'],
  let:'Volgens de Malikitische school is die ene groet naar rechts het verplichte deel. Bid je achter een imam, dan geef je er nog een naar links en één als antwoord aan de imam.'},
 /* De dhikr ná het gebed stond wel in de les over dhikr, maar niet hier — en
    hier hoort hij: het is het staartje van het gebed, niet een los onderwerp.
    Hij telt niet mee in het examen over de volgorde, want hij valt erbuiten. */
 {k:'nagebed', t:'Blijven zitten na het gebed', h:'zitten', merk:null, soort:'na', zeg:'istighfar', zeg2:'naSalam',
  doe:['Sta niet meteen op. Zeg drie keer: astaghfiru llah.','Daarna: allahumma anta s-salamu wa minka s-salam.','Dan 33× subhanallah, 33× alhamdulillah, 33× Allahu akbar, en als honderdste de tahlil.','Lees tot slot ayat al-kursi.'],
  extra:['tasbih','tahlil'],
  let:'Dit hoort niet bij het gebed zelf en is geen plicht. Het is wel de landing: wie meteen opstaat, stapt van het gebed rechtstreeks terug in de dag.'}
];

/* Naast de volgorde: wat in deze school niet in het verplichte gebed wordt
   gezegd, maar wel in een vrijwillig gebed en in andere scholen. Kennen is
   nuttig — je staat vroeg of laat achter een imam die het wél zegt. */
export const NAAST: Naast[] = [
 {zeg:'istiftah', t:'De openingsdu\'a', w:'Na de openingstakbir, vóór al-Fatiha',
  u:'In de Malikitische school niet in het verplichte gebed. In een vrijwillig gebed mag hij wel, en de meeste andere scholen zeggen hem altijd.'},
 {zeg:'taawwudh', t:'Bescherming zoeken', w:'Vóór het lezen',
  u:'Ook dit hoort in deze school niet in het verplichte gebed. Buiten het gebed zeg je het wél elke keer dat je de Koran opent.'},
 {zeg:'amin', t:'Amin', w:'Direct na al-Fatiha',
  u:'Zachtjes, ook als het gebed hardop is. Bid je achter een imam, dan zeg je het als hij klaar is met al-Fatiha.'}
];

/* De vijf verplichte gebeden en wat eromheen hoort. */
export const GEBEDEN: Gebed[] = [
 {id:'fajr', naam:'Fajr', ar:'الفجر', rak:2, tijd:'Van de dageraad tot zonsopgang', hardop:'Hardop',
  sunnaVoor:'2 rak\'a (sterk aanbevolen)', sunnaNa:'—',
  extra:'In deze school wordt in de tweede rak\'a de qunut gezegd, zachtjes en vóór de buiging. Aanbevolen, geen plicht.'},
 {id:'dhuhr', naam:'Dhuhr', ar:'الظهر', rak:4, tijd:'Vanaf het moment dat de zon over zijn hoogste punt is', hardop:'Zacht',
  sunnaVoor:'Vrijwillige rak\'a aanbevolen', sunnaNa:'Vrijwillige rak\'a aanbevolen',
  extra:'Op vrijdag vervangen door het jumu\'a-gebed: twee rak\'a met een preek ervoor.'},
 {id:'asr', naam:'Asr', ar:'العصر', rak:4, tijd:'Namiddag, tot de zon ondergaat', hardop:'Zacht',
  sunnaVoor:'Vrijwillige rak\'a aanbevolen', sunnaNa:'—',
  extra:'"Wie het Asr-gebed mist, is als iemand die zijn familie en bezit verloren heeft." Niet uitstellen dus.'},
 {id:'maghrib', naam:'Maghrib', ar:'المغرب', rak:3, tijd:'Zodra de zon onder is', hardop:'Eerste twee hardop',
  sunnaVoor:'—', sunnaNa:'2 rak\'a aanbevolen',
  extra:'Het enige gebed met een oneven aantal rak\'a. De tijd is kort: bid meteen.'},
 {id:'isha', naam:'Isha', ar:'العشاء', rak:4, tijd:'Als de rode gloed weg is, tot de dageraad', hardop:'Eerste twee hardop',
  sunnaVoor:'—', sunnaNa:'Shaf\' (2) en witr (1)',
  extra:'Het liefst vóór het eerste derde deel van de nacht voorbij is.'}
];

export const NAWAFIL: Nafila[] = [
 {n:'Shaf\' en witr', ar:'الشفع والوتر', r:'2 + 1', w:'Na Isha, tot de dageraad', u:'In de Malikitische school twee rak\'a (shaf\') met een slotgroet, en daarna één losse rak\'a (witr). Sterk aanbevolen; sla hem niet over.'},
 {n:'Sunna van de Fajr', ar:'ركعتا الفجر', r:'2', w:'Vlak voor het Fajr-gebed', u:'Kort, met al-Ikhlas en al-Kafirun. "Beter dan de wereld en alles daarin."'},
 {n:'Duha', ar:'الضحى', r:'2 tot 8', w:'Als de zon goed op is, tot vlak voor de middag', u:'Het gebed van de ochtend. Een fijne gewoonte in de vakantie of het weekend.'},
 {n:'Qiyam al-layl / tahajjud', ar:'قيام الليل', r:'2 of meer', w:'\'s Nachts, het liefst in het laatste derde deel', u:'Je staat op als anderen slapen. Begin klein: twee rak\'a is genoeg.'},
 {n:'Tarawih', ar:'التراويح', r:'20', w:'Elke nacht van ramadan, na Isha', u:'In de Maghrebijnse traditie twintig rak\'a, gevolgd door de witr.'},
 {n:'Groet aan de moskee', ar:'تحية المسجد', r:'2', w:'Als je de moskee binnenkomt', u:'Voordat je gaat zitten — behalve als het gebed al begonnen is.'},
 {n:'Istikhara', ar:'الاستخارة', r:'2', w:'Als je moet kiezen', u:'Twee rak\'a en daarna de du\'a van de istikhara: je vraagt Allah om het goede voor je te kiezen.'},
 {n:'Het feestgebed', ar:'صلاة العيد', r:'2', w:'Op de ochtend van beide feesten', u:'Met extra takbirs, en een preek na het gebed.'},
 {n:'Het gebed bij een overledene', ar:'صلاة الجنازة', r:'—', w:'Bij een begrafenis', u:'Staand, met vier takbirs, zonder buiging en zonder knieval. Je bidt voor de overledene.'},
 {n:'Op reis', ar:'صلاة السفر', r:'4 → 2', w:'Bij een reis van ongeveer 80 km of meer', u:'De gebeden van vier rak\'a bid je als twee (qasr). Onder voorwaarden mag je Dhuhr en Asr, of Maghrib en Isha, samenvoegen.'},
 {n:'Bij een verduistering', ar:'صلاة الكسوف', r:'2', w:'Zolang de zon of de maan verduisterd is', u:'Bij de zon met twee keer lezen en twee keer buigen per rak\'a, samen in de moskee. Bij de maan bidt ieder voor zich.'},
 {n:'Om regen vragen', ar:'صلاة الاستسقاء', r:'2', w:'Bij droogte, \'s ochtends buiten', u:'Hardop, met een preek erna en veel istighfar. De hele gemeenschap komt.'}
];

