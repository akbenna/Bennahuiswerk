/**
 * DE PRIVACYVERKLARING
 *
 * Deze tekst staat hier en niet in een los document, om één reden: hij moet
 * kloppen met wat de app werkelijk doet, en die twee groeien uit elkaar zodra
 * ze op twee plekken staan. `health/PRIVACY.md` wordt hieruit geschreven met
 * `node gereedschap/privacy-schrijven.mjs`, en `privacy.proef.ts` valt om zodra
 * dat niet gedaan is.
 *
 * WAT ER IN STAAT IS NAGELOPEN EN NIET AANGENOMEN
 *
 * Elke bewering hieronder is in de code nagekeken op de dag dat hij geschreven
 * werd, en de drie die het meest verrassen staan hier met hun bewijs:
 *
 * **Foto's worden niet bewaard.** Er staat geen enkele opslagaanroep in deze
 * repo: geen `storage.from`, geen bucket, nergens. De foto gaat als tekst mee
 * in het verzoek aan de herkenning en is daarna weg. De kolom `foto_pad` in
 * `kal_regels` bestaat wel en wordt door niets gevuld.
 *
 * **Vercel ziet geen gegeven.** De browser praat rechtstreeks met Supabase
 * (`DATABASE_URL` in `verbinding.ts`); Vercel levert alleen de bestanden van de
 * app. Dat scheelt een verwerker, en het is de reden dat die niet in de lijst
 * staat terwijl het adres wel op vercel.app eindigt.
 *
 * **De beheerder ziet geen gezondheidsgegeven.** `kal_testers` geeft naam,
 * status, aanmelddatum en AI-verbruik terug en verder niets. Dat is geen
 * belofte maar een functie die na te lezen is, en de proefopstelling toetst
 * hem.
 *
 * WAT ER MET OPZET NIET IN STAAT
 *
 * Geen enkele zin die de app niet waarmaakt. Een privacyverklaring die rechten
 * belooft die je niet kunt uitoefenen is erger dan geen, want hij wekt
 * vertrouwen dat nergens op rust.
 *
 * Toen dit bestand geschreven werd, was verwijderen zo'n recht: er was geen
 * knop, dus stond er dat het per bericht ging. Bestand 52 maakte de knop, en
 * toen is de tekst meegedraaid, niet andersom. De proef ernaast bewaakt nu de
 * drie dingen die de knop werkelijk doet (eerst tonen, wachtwoord erbij, geen
 * weg terug) én het ene dat níet verdwijnt: de aantekening dát er gewist is.
 * "Alles wordt verwijderd" zou daarmee niet kloppen.
 */

/** Wie aanspreekbaar is. Eén regel, en hij staat hier zodat hij op één plek staat. */
export const CONTACT = 'info@provita-vare.nl'

/** De dag waarop deze tekst voor het laatst is nagelopen tegen de code. */
export const NAGEKEKEN = '23 september 2026'

export interface Stuk {
  kop: string
  alineas: readonly string[]
}

export const PRIVACY: readonly Stuk[] = [
  {
    kop: 'Waar dit over gaat',
    alineas: [
      'BennaHealth is geen dienst maar een besloten test. De app meet je energieverbruik '
      + 'uit je gewichtstrend in plaats van het te schatten uit een formule, en daarvoor '
      + 'heeft hij gegevens van je nodig die als gezondheidsgegevens gelden. Deze tekst '
      + 'zegt welke dat zijn, waar ze heen gaan en wat je ermee kunt.',
      'Verantwoordelijk voor die gegevens is de beheerder van deze test, te bereiken op '
      + CONTACT + '. Hij is huisarts, en dat is hier niet van belang: je bent geen '
      + 'patiënt en dit is geen zorg. Wat je hier invult komt niet in een dossier en '
      + 'wordt niet met een zorgverlener gedeeld.',
    ],
  },
  {
    kop: 'Wat er van je wordt bewaard',
    alineas: [
      'Je accountnaam en een versleutelde weergave van je wachtwoord. Het wachtwoord '
      + 'zelf wordt nergens bewaard en is ook niet terug te rekenen.',
      'Wat je invult: je gewicht, je lengte, leeftijd en geslacht, wat je eet en drinkt, '
      + 'je stappen, slaap en inspanning, en de metingen en vragenlijsten die je zelf '
      + 'invoert, waaronder bloeddruk en labwaarden. Ook de notities die je erbij typt.',
      'Wat de app zelf bijhoudt: wanneer je hebt laten herkennen en hoeveel dat kostte, '
      + 'en wanneer je bent toegelaten tot de test. Geen locatie, geen contactenlijst, '
      + 'geen advertentiegegevens, en geen enkel gegeven dat de app niet zelf gebruikt.',
      'Foto’s van je eten worden niet bewaard. Ze gaan mee in het verzoek aan de '
      + 'herkenning en zijn daarna weg; er is geen map en geen opslag waar ze in komen.',
    ],
  },
  {
    kop: 'Waarom het mag',
    alineas: [
      'Omdat je er zelf toestemming voor geeft door een account te maken en gegevens in '
      + 'te voeren. Voor gezondheidsgegevens is dat de grondslag van artikel 9, tweede '
      + 'lid, onder a van de AVG: uitdrukkelijke toestemming.',
      'Die toestemming kun je intrekken wanneer je wilt, en dat kost je niets. Wat er tot '
      + 'dat moment is gebeurd blijft rechtmatig; wat erna gebeurt niet, dus dan houdt het '
      + 'op en worden je gegevens verwijderd.',
    ],
  },
  {
    kop: 'Wie het ziet',
    alineas: [
      'Jij, en verder niemand die niet in deze lijst staat. Andere testers zien niets van '
      + 'je, en jij niets van hen.',
      'De beheerder ziet in zijn overzicht je accountnaam, je status in de test, wanneer '
      + 'je je hebt aangemeld en hoeveel herkenningen je hebt gedaan. Geen gewicht, geen '
      + 'bloeddruk, geen labwaarde, geen maaltijd. Dat is geen belofte op erewoord maar '
      + 'een eigenschap van de functie die dat overzicht maakt, en die functie geeft die '
      + 'gegevens niet terug.',
      'Wat hij in theorie wél kan: hij beheert de database en kan daar bij alles wat erin '
      + 'staat. Dat geldt voor iedereen die een database beheert, en het staat hier omdat '
      + 'het waar is en niet omdat het de bedoeling is.',
    ],
  },
  {
    kop: 'Waar het staat, en wie er nog meer bij komt',
    alineas: [
      'De gegevens staan bij Supabase, de databasedienst waarop deze app draait. Zij zijn '
      + 'verwerker en doen er niets anders mee dan bewaren.',
      'Laat je een maaltijd herkennen uit tekst of een foto, dan gaat die tekst of die '
      + 'foto naar Anthropic, of naar OpenAI als je je eigen sleutel van die aanbieder hebt '
      + 'opgegeven. Dat gebeurt alleen op het moment dat jij op herkennen tikt, en alleen '
      + 'met wat je op dat moment aanbiedt. Je gewicht, je bloeddruk en je labwaarden gaan '
      + 'daar niet heen.',
      'De app zelf wordt geleverd via Vercel. Die ziet geen enkel gegeven van je: je '
      + 'browser praat rechtstreeks met de database en Vercel levert alleen de bestanden '
      + 'van de app.',
      'Verder niemand. Er wordt niets verkocht, niets gedeeld met adverteerders, en er '
      + 'gaat niets naar een verzekeraar, een werkgever of een zorgverlener.',
    ],
  },
  {
    kop: 'Hoe lang',
    alineas: [
      'Zolang je meedoet, en daarna nog drie maanden. Stop je met de test, of stopt de '
      + 'test zelf, dan worden je gegevens uiterlijk drie maanden later verwijderd.',
      'Die drie maanden zijn er zodat je erop terug kunt komen: wie halverwege stopt en '
      + 'na een maand toch verder wil, hoeft niet opnieuw te beginnen. Wil je niet zo '
      + 'lang wachten, dan haal je ze eerder weg; dat kan meteen en het kost je niets.',
      'Je aanmelding op een toestel verloopt na dertig dagen; daarna moet je opnieuw je '
      + 'wachtwoord invullen. Dat is iets anders dan je gegevens, die blijven staan.',
      'Wil je je gegevens zelf houden, vraag er dan om voordat ze weggaan; je krijgt ze '
      + 'dan in een bestand.',
    ],
  },
  {
    kop: 'Wat je kunt vragen',
    alineas: [
      'Inzage in wat er van je bewaard wordt, een kopie ervan in een bestand, correctie '
      + 'van wat niet klopt, en verwijdering van alles. Ook kun je bezwaar maken en je '
      + 'toestemming intrekken.',
      'Verwijderen doe je zelf, onder Account. De app laat eerst zien wat er precies weg '
      + 'zou gaan, per soort gegeven en met aantallen, en pas daarna verdwijnt het. Je '
      + 'vult je wachtwoord er nog een keer bij in, zodat een telefoon die even in een '
      + 'andere hand ligt niet genoeg is. Er is geen prullenbak: wat weg is, is weg.',
      'Eén ding overleeft dat, en dat hoort hier te staan: er blijft een aantekening dat '
      + 'op die dag een account is verwijderd, met de naam van dat account erin. Zonder '
      + 'die aantekening is niet na te gaan dat het gebeurd is, ook niet door jou.',
      'De andere vragen gaan per bericht aan ' + CONTACT + '. Je krijgt binnen een week '
      + 'antwoord en je hoeft geen reden op te geven. Ben je je wachtwoord kwijt en wil '
      + 'je weg, vraag het dan ook zo; de beheerder kan het dan voor je doen.',
      'Ben je het ergens niet mee eens en komen we er samen niet uit, dan kun je klagen '
      + 'bij de Autoriteit Persoonsgegevens.',
    ],
  },
  {
    kop: 'Hoe het beveiligd is',
    alineas: [
      'Je wachtwoord staat gehasht met bcrypt en is niet terug te rekenen. Er zit een rem '
      + 'op het raden ervan.',
      'Geen enkele tabel is rechtstreeks te benaderen: alle toegang loopt via functies die '
      + 'per aanroep controleren wie je bent, en die functies geven alleen jouw eigen '
      + 'gegevens terug. Het verkeer gaat versleuteld.',
      'Geef je een eigen AI-sleutel op, dan wordt die versleuteld bewaard en komt hij '
      + 'nooit meer terug naar je scherm. Ook de beheerder kan hem niet uitlezen; alleen '
      + 'de functie die de herkenning doet kan erbij.',
      'Dit is een test die door één mens wordt onderhouden. Dat is geen gecertificeerde '
      + 'omgeving en dat wordt hier ook niet beweerd. Vul niets in wat je niet kwijt zou '
      + 'willen als het toch ergens terechtkomt.',
    ],
  },
  {
    kop: 'En wat dit niet is',
    alineas: [
      'Geen medisch hulpmiddel en geen diagnose. De app rekent en laat zien; hij stelt '
      + 'niets vast en schrijft niets voor. Wat eruit komt is geen vervanging van je '
      + 'huisarts, en bij klachten ga je daarheen en niet naar een app.',
      'De getallen dragen altijd hun onzekerheid. Dat is met opzet: een schatting zonder '
      + 'interval ziet eruit als een meting, en dat is precies het soort zekerheid dat '
      + 'hier niet bestaat.',
    ],
  },
]

/** De hele tekst als platte regels, voor het document en voor de proef. */
export function platteTekst(): string {
  return PRIVACY
    .map((s) => s.kop + '\n\n' + s.alineas.join('\n\n'))
    .join('\n\n')
}
